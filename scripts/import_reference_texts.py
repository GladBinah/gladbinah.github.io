#!/usr/bin/env python3
"""Import pinned public-domain KJV 1769 and Scrivener 1894 NT data.

Usage: python scripts/import_reference_texts.py
The archived 1961 Korean Revised Version is maintained separately. This script
does not download or alter its verse text; it only standardizes source credits.
"""
from __future__ import annotations
import hashlib
import json
import re
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"docs"/"source-texts"
KJV_COMMIT="88723a44bb3e3f229a34f9cf11ce1b7acf971eee"
GREEK_COMMIT="2bac2dae4a0961c84d6d544a40cbef8b8d8c4e32"
KJV_URL=f"https://raw.githubusercontent.com/renniemaharaj/kjv-bible/{KJV_COMMIT}"
GREEK_URL=f"https://raw.githubusercontent.com/honza/textus-receptus/{GREEK_COMMIT}/data/gnt.flat.json"

BOOKS=[
("genesis","Genesis",50),("exodus","Exodus",40),("leviticus","Leviticus",27),
("numbers","Numbers",36),("deuteronomy","Deuteronomy",34),("joshua","Joshua",24),
("judges","Judges",21),("ruth","Ruth",4),("1-samuel","1 Samuel",31),
("2-samuel","2 Samuel",24),("1-kings","1 Kings",22),("2-kings","2 Kings",25),
("1-chronicles","1 Chronicles",29),("2-chronicles","2 Chronicles",36),
("ezra","Ezra",10),("nehemiah","Nehemiah",13),("esther","Esther",10),
("job","Job",42),("psalms","Psalms",150),("proverbs","Proverbs",31),
("ecclesiastes","Ecclesiastes",12),("song-of-songs","Song of Solomon",8),
("isaiah","Isaiah",66),("jeremiah","Jeremiah",52),("lamentations","Lamentations",5),
("ezekiel","Ezekiel",48),("daniel","Daniel",12),("hosea","Hosea",14),
("joel","Joel",3),("amos","Amos",9),("obadiah","Obadiah",1),("jonah","Jonah",4),
("micah","Micah",7),("nahum","Nahum",3),("habakkuk","Habakkuk",3),
("zephaniah","Zephaniah",3),("haggai","Haggai",2),("zechariah","Zechariah",14),
("malachi","Malachi",4),("matthew","Matthew",28),("mark","Mark",16),
("luke","Luke",24),("john","John",21),("acts","Acts",28),("romans","Romans",16),
("1-corinthians","1 Corinthians",16),("2-corinthians","2 Corinthians",13),
("galatians","Galatians",6),("ephesians","Ephesians",6),
("philippians","Philippians",4),("colossians","Colossians",4),
("1-thessalonians","1 Thessalonians",5),("2-thessalonians","2 Thessalonians",3),
("1-timothy","1 Timothy",6),("2-timothy","2 Timothy",4),
("titus","Titus",3),("philemon","Philemon",1),("hebrews","Hebrews",13),
("james","James",5),("1-peter","1 Peter",5),("2-peter","2 Peter",3),
("1-john","1 John",5),("2-john","2 John",1),("3-john","3 John",1),
("jude","Jude",1),("revelation","Revelation",22)
]
assert len(BOOKS)==66 and sum(n for _,_,n in BOOKS)==1189

def download(url:str) -> bytes:
    req=urllib.request.Request(url,headers={"User-Agent":"GladBinah-Scripture-Reference-Importer/1.0"})
    with urllib.request.urlopen(req, timeout=110) as response: return response.read()

def text_index(title:str, description:str, entries:list[tuple], source_url:str, info:str)->str:
    return (f"# {title}\n\n{description}\n\n"
            +f"원문 자료(Original data): [{source_url}]({source_url})\n\n"
            +info+"\n\n## Old Testament\n\n"
            + "\n".join(f"- [{name}]({slug}.md)" for slug,name,_ in entries[:39])
            +"\n\n## New Testament\n\n"
            +"\n".join(f"- [{name}]({slug}.md)" for slug,name,_ in entries[39:])+"\n")

def write_kjv()->dict:
    # Independently maintained, SHA-512 audited 66-book KJV corpus (last checked 2026-07-30).
    out=OUTPUT/"kjv1769";out.mkdir(parents=True,exist_ok=True)
    total=0
    sample={}
    book_hashes={}
    for slug,name,nchap in BOOKS:
        url=KJV_URL+"/"+quote(name+".json",safe="")
        raw=download(url)
        book_hashes[slug]=hashlib.sha256(raw).hexdigest()
        data=json.loads(raw.decode("utf-8-sig"))
        if not isinstance(data,dict) or sorted(map(int,data.keys()))!=list(range(1,nchap+1)):
            raise ValueError("Unexpected KJV chapters for "+name)
        result=[f"# {name} — King James Version (1769 standard text)","",
            "> Source: King James Version (1769 standard-spelling text).",""]
        for chapter in range(1,nchap+1):
            verses=data[str(chapter)]
            vv=sorted(map(int,verses.keys()))
            if vv!=list(range(1,max(vv)+1)):
                raise ValueError(f"KJV verse gap in {name} {chapter}")
            result.extend(["",f"## Chapter {chapter} {{#chapter-{chapter}}}",""])
            for v in vv:
                text=re.sub(r"\s+"," ",str(verses[str(v)])).strip()
                if not text:raise ValueError(f"Blank KJV verse: {name} {chapter}:{v}")
                if slug=="genesis" and (chapter,v) in ((1,1),(13,4),(28,2)):
                    sample[f"{chapter}:{v}"]=text
                result.append(f"**{v}** {text}  ")
                total+=1
        (out/f"{slug}.md").write_text("\n".join(result)+"\n",encoding="utf-8")
    if total!=31102:raise ValueError(f"KJV verses {total}, expected 31102")
    if sample.get("1:1")!="In the beginning God created the heaven and the earth.":
        raise ValueError("Genesis 1:1 mismatch: "+repr(sample.get("1:1")))
    if "had made" not in sample.get("13:4","") or "the LORD" not in sample["13:4"]:
        raise ValueError("Genesis 13:4 mismatch: "+repr(sample.get("13:4")))
    if "daughters" not in sample.get("28:2",""):
        raise ValueError("Genesis 28:2 mismatch: "+repr(sample.get("28:2")))
    # Public-facing index pages are maintained separately from this importer.
    return {"books":66,"chapters":1189,"verses":total,"source_commit":KJV_COMMIT,"book_sha256":book_hashes,"sanity_check":sample}


def greek_slug(row:dict)->str:
    code=re.sub("[^a-z0-9]","",str(row.get("book_name_osis","")).lower())
    codes={
      "matt":"matthew","mat":"matthew","mt":"matthew",
      "mark":"mark","mrk":"mark","mar":"mark","mk":"mark",
      "luke":"luke","luk":"luke","lk":"luke",
      "john":"john","jhn":"john","joh":"john","jn":"john",
      "acts":"acts","act":"acts","ac":"acts",
      "rom":"romans","ro":"romans","1cor":"1-corinthians","1co":"1-corinthians",
      "2cor":"2-corinthians","2co":"2-corinthians",
      "gal":"galatians","ga":"galatians","eph":"ephesians",
      "phil":"philippians","php":"philippians","col":"colossians",
      "1thess":"1-thessalonians","1th":"1-thessalonians",
      "2thess":"2-thessalonians","2th":"2-thessalonians",
      "1tim":"1-timothy","1ti":"1-timothy","2tim":"2-timothy","2ti":"2-timothy",
      "tit":"titus","phlm":"philemon","phm":"philemon",
      "heb":"hebrews","jas":"james","jam":"james",
      "1pet":"1-peter","1pe":"1-peter","2pet":"2-peter","2pe":"2-peter",
      "1john":"1-john","1jn":"1-john","1jo":"1-john",
      "2john":"2-john","2jn":"2-john","2jo":"2-john",
      "3john":"3-john","3jn":"3-john","3jo":"3-john",
      "jude":"jude","jud":"jude","rev":"revelation","re":"revelation"
    }
    if code in codes:return codes[code]
    name=re.sub("[^a-z0-9]","",str(row.get("book_name","")).lower())
    if name in codes:return codes[name]
    for canonical_slug, canonical_name, _ in BOOKS[39:]:
        accepted={re.sub("[^a-z0-9]","",canonical_slug.lower()),
                  re.sub("[^a-z0-9]","",canonical_name.lower())}
        if code in accepted or name in accepted:return canonical_slug
    raise ValueError("Unrecognized Scrivener book: "+repr((code,name)))

def write_greek(raw:bytes)->dict:
    obj=json.loads(raw.decode("utf-8-sig"))
    if isinstance(obj,dict):
        for key in ("verses","data","gnt","records"):
            if key in obj and isinstance(obj[key],list):obj=obj[key];break
    if not isinstance(obj,list):raise ValueError("Unexpected Greek JSON structure")
    groups=defaultdict(dict)
    for row in obj:
        if not isinstance(row,dict) or "greek_text" not in row:raise ValueError("Unexpected Greek entry")
        slug=greek_slug(row)
        cv=(int(row["chapter"]),int(row["verse"]))
        textv=str(row["greek_text"]).strip()
        if not textv or cv in groups[slug]:raise ValueError(f"Empty or duplicate Greek verse: {slug} {cv}")
        groups[slug][cv]=textv
    slugs=[slug for slug,_,_ in BOOKS[39:]]
    if set(groups)!=set(slugs):raise ValueError("Greek books mismatch: "+str(set(groups)^set(slugs)))
    count=sum(len(g) for g in groups.values())
    if not (7950<=count<=7980):raise ValueError(f"Greek verse count unexpected: {count}")
    out=OUTPUT/"scrivener1894";out.mkdir(parents=True,exist_ok=True)
    for slug,name,nchap in BOOKS[39:]:
        group=groups[slug]
        chapters=sorted({ch for ch,_ in group})
        if chapters!=list(range(1,nchap+1)):raise ValueError("Greek chapter mismatch: "+slug)
        lines=[f"# {name} — Scrivener 1894 Textus Receptus","",
               "> Source: F. H. A. Scrivener, *Textus Receptus* (1894).",""]
        for ch in chapters:
            vs=sorted(v for c,v in group if c==ch)
            if vs!=list(range(1,max(vs)+1)):raise ValueError(f"Greek verse gap {slug} ch {ch}")
            lines.extend(["",f"## Chapter {ch} {{#chapter-{ch}}}",""])
            for verse in vs:lines.append(f"**{verse}** {group[ch,verse]}  ")
        (out/f"{slug}.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
    # Public-facing index pages are maintained separately from this importer.
    return {"books":27,"chapters":sum(n for _,_,n in BOOKS[39:]),"verses":count,"sha256":hashlib.sha256(raw).hexdigest()}

def simplify_krv_headers()->None:
    # Keep all Korean verse text unchanged; only shorten book-level attribution.
    folder=OUTPUT/"krv1961"
    books=sorted(p for p in folder.glob("*.md") if p.name not in ("index.md","index.en.md"))
    if len(books)!=66:raise ValueError(f"Expected 66 KRV books, found {len(books)}")
    prefix="> 출처: 대한성서공회, 『성경전서 개역한글판』(1961)."
    for path in books:
        text=path.read_text(encoding="utf-8")
        lines=text.splitlines(keepends=True)
        if len(lines)<4 or not lines[2].startswith(prefix):
            raise ValueError("Unexpected KRV book header: "+str(path))
        lines[2]=prefix+"\n"
        revised="".join(lines)
        if revised!=text:path.write_text(revised,encoding="utf-8")

def main():
    kjv=write_kjv()
    greek=write_greek(download(GREEK_URL))
    simplify_krv_headers()
    info={"kjv1769":{"url":KJV_URL+"/kjv.json","commit":KJV_COMMIT,**kjv},
          "scrivener1894":{"url":GREEK_URL,"commit":GREEK_COMMIT,**greek}}
    (OUTPUT/"import-manifest.json").write_text(json.dumps(info,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(info,ensure_ascii=False,indent=2))

if __name__=="__main__":main()
