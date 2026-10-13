"""Synchronize the downloadable app folder and ZIP with the root application."""
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    'index.html', 'app.js', 'learning-core.js', 'course-data.js', 'study.js',
    'styles.css', 'sw.js', 'radicals.json', 'manifest.webmanifest',
    'icon.svg', 'icon.png', 'icon-maskable.svg', 'README_RU.md',
    'REQUIREMENTS_RU.md', 'CHANGELOG.md', 'UPDATE_v03_RU.md', 'tools/build_ru_pack.py',
]

if __name__ == '__main__':
    folder = ROOT / 'Hanzi_One_iPhone_PWA'
    folder.mkdir(exist_ok=True)
    for name in FILES:
        (folder / name).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, folder / name)
    with zipfile.ZipFile(ROOT / 'Hanzi_One_iPhone_PWA.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in FILES:
            entry = zipfile.ZipInfo('Hanzi_One_iPhone_PWA/' + name, (2026, 10, 13, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(entry, (ROOT / name).read_bytes())
    print('Updated release folder and ZIP with', len(FILES), 'files')
