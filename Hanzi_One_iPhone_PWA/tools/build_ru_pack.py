#!/usr/bin/env python3
"""Convert a locally downloaded FreeDict/WikDict Chinese->Russian StarDict
archive into a small Hanzi One HSK translation pack. Python 3, stdlib only.

This script does not bypass paid services and does not embed third-party data.
The user supplies the openly licensed dictionary archive separately.
"""
import argparse
import gzip
import html
import json
from pathlib import Path
import re
import struct
import tarfile
import urllib.request

HSK_URL = 'https://raw.githubusercontent.com/profesorm/hsk30/main/data/hsk_vocabulary_compact.json'
HANZI_RE = re.compile(r'[\u3400-\u9fff]')
RUSSIAN_RE = re.compile(r'[а-яА-ЯёЁ]')


def read_hsk(path: str | None) -> set[str]:
    if path:
        raw = Path(path).read_bytes()
    else:
        print('Загружаю открытый список HSK 3.0…')
        with urllib.request.urlopen(HSK_URL, timeout=45) as resp:
            raw = resp.read()
    data = json.loads(raw)
    rows = data.get('data', {}).get('records', []) if isinstance(data, dict) else data
    words = {re.sub(r'\d+$', '', str(row.get('word', ''))).strip() for row in rows}
    words = {w for w in words if w and HANZI_RE.search(w)}
    if len(words) < 100:
        raise ValueError('Список HSK пустой или неизвестного формата')
    return words


def parse_stardict(archive: Path, wanted: set[str]) -> dict[str, str]:
    with tarfile.open(archive, 'r:*') as tf:
        files = {Path(m.name).name: m for m in tf.getmembers() if m.isfile()}
        def member(ext: str):
            possible = [m for name, m in files.items() if name.endswith(ext)]
            if len(possible) != 1:
                raise ValueError(f'Нужен ровно один файл *{ext}, найдено: {len(possible)}')
            return tf.extractfile(possible[0]).read()
        info = member('.ifo').decode('utf-8-sig')
        idx = member('.idx')
        if any(name.endswith('.dict.dz') for name in files):
            dictionary = gzip.decompress(member('.dict.dz'))
        else:
            dictionary = member('.dict')

    bits = 64 if re.search(r'(?m)^idxoffsetbits=64$', info) else 32
    offset_fmt = '>QI' if bits == 64 else '>II'
    entry_bytes = struct.calcsize(offset_fmt)
    pos = 0
    entries: dict[str, str] = {}
    while pos < len(idx):
        end = idx.find(b'\x00', pos)
        if end < 0 or end + 1 + entry_bytes > len(idx):
            raise ValueError('Повреждён индекс StarDict')
        word = idx[pos:end].decode('utf-8', errors='replace').strip()
        offset, size = struct.unpack_from(offset_fmt, idx, end + 1)
        pos = end + 1 + entry_bytes
        if word not in wanted or word in entries or offset + size > len(dictionary):
            continue
        source = dictionary[offset:offset + size].decode('utf-8', errors='replace')
        # HTML dictionary entries vary. Preserve textual senses and strip markup.
        source = re.sub(r'(?i)<\s*(br|/p|/li|/div)\b[^>]*>', '; ', source)
        source = re.sub(r'<[^>]*>', ' ', source)
        source = html.unescape(source)
        source = re.sub(r'[\x00-\x1f\x7f]+', ' ', source)
        source = re.sub(r'\s+', ' ', source).strip(' ;,')
        if not RUSSIAN_RE.search(source):
            continue
        entries[word] = source[:300].rstrip(' ;,')
    return entries


def main():
    parser = argparse.ArgumentParser(description='Локальный конвертер китайско-русского словаря в Hanzi One')
    parser.add_argument('archive', type=Path, help='FreeDict Chinese-Russian файл *.stardict.tar.xz')
    parser.add_argument('--hsk', help='Локальный файл hsk_vocabulary_compact.json (по умолчанию загрузить из GitHub)')
    parser.add_argument('--output', default='ru-pack.json', help='Выходной файл (по умолчанию ru-pack.json)')
    args = parser.parse_args()
    wanted = read_hsk(args.hsk)
    print(f'В списке HSK: {len(wanted)} различных написаний')
    translations = parse_stardict(args.archive, wanted)
    pack = {
        'format': 'hanzi-one-ru-v1',
        'source': 'FreeDict / WikDict Chinese-Russian, locally supplied by user',
        'attribution': 'https://freedict.org/downloads/ ; https://www.wikdict.com/page/download',
        'license_note': 'Данные словаря имеют отдельную свободную лицензию. Перед распространением проверьте лицензию конкретного архива и сохраняйте её указание.',
        'words': dict(sorted(translations.items())),
    }
    Path(args.output).write_text(json.dumps(pack, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'Готово: {args.output}. Покрытие HSK по написаниям: {len(translations)}/{len(wanted)}. Проверь значения перед изучением!')

if __name__ == '__main__':
    main()
