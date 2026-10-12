from pathlib import Path
from tempfile import TemporaryDirectory
import gzip, json, struct, tarfile, io
from build_ru_pack import read_hsk, parse_stardict
with TemporaryDirectory() as d:
 p=Path(d)
 (p/'hsk.json').write_text(json.dumps({'data':{'records':[{'word':'你好'},{'word':'谢谢'}]+[{'word':'词'+chr(0x4e00+i)} for i in range(101)]}},ensure_ascii=False),encoding='utf-8')
 idx=bytearray(); blob=bytearray()
 for word,meaning in [('你好','<b>Привет</b>; здравствуй'),('谢谢','<div>Спасибо</div>'),('无','ничего')]:
  val=meaning.encode('utf-8'); idx.extend(word.encode()+b'\0'+struct.pack('>II',len(blob),len(val))); blob.extend(val)
 with tarfile.open(p/'sample.tar.xz','w:xz') as tf:
  for name,data in [('test.ifo',b"StarDict's dict ifo file\nversion=2.4.2\n"),('test.idx',bytes(idx)),('test.dict.dz',gzip.compress(bytes(blob)))]:
   info=tarfile.TarInfo(name);info.size=len(data);tf.addfile(info,io.BytesIO(data))
 result=parse_stardict(p/'sample.tar.xz',read_hsk(str(p/'hsk.json')))
 assert result=={'你好':'Привет ; здравствуй','谢谢':'Спасибо'},result
 print('PASS StarDict converter',result)
