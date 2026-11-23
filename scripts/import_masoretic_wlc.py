#!/usr/bin/env python3
"""Reproducible Hebrew/Aramaic WLC importer from pinned Open Scriptures XML.

Retains Hebrew MT verse numbering and Unicode pointing. No English translations,
morphology, or lexical annotations are reproduced. Does not NFC-normalize Hebrew.
Ketiv is kept in the verse and Qere is listed in a separate variant apparatus.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from hashlib import sha256
from html import escape
from pathlib import Path
import json
import re
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/source-texts/wlc"
SOURCE_COMMIT = "db6c5c9b46b8f39346f10915ddb1a70dcd429901"
SOURCE_BASE = "https://raw.githubusercontent.com/openscriptures/morphhb/" + SOURCE_COMMIT + "/wlc/"
SOURCE_REPO = "https://github.com/openscriptures/morphhb"
NS = "{http://www.bibletechnologies.net/2003/OSIS/namespace}"
BOOKS = [
    ("genesis", "Gen", "창세기", "Genesis"),
    ("exodus", "Exod", "출애굽기", "Exodus"),
    ("leviticus", "Lev", "레위기", "Leviticus"),
    ("numbers", "Num", "민수기", "Numbers"),
    ("deuteronomy", "Deut", "신명기", "Deuteronomy"),
    ("joshua", "Josh", "여호수아", "Joshua"),
    ("judges", "Judg", "사사기", "Judges"),
    ("ruth", "Ruth", "룻기", "Ruth"),
    ("1-samuel", "1Sam", "사무엘상", "1 Samuel"),
    ("2-samuel", "2Sam", "사무엘하", "2 Samuel"),
    ("1-kings", "1Kgs", "열왕기상", "1 Kings"),
    ("2-kings", "2Kgs", "열왕기하", "2 Kings"),
    ("1-chronicles", "1Chr", "역대상", "1 Chronicles"),
    ("2-chronicles", "2Chr", "역대하", "2 Chronicles"),
    ("ezra", "Ezra", "에스라", "Ezra"),
    ("nehemiah", "Neh", "느헤미야", "Nehemiah"),
    ("esther", "Esth", "에스더", "Esther"),
    ("job", "Job", "욥기", "Job"),
    ("psalms", "Ps", "시편", "Psalms"),
    ("proverbs", "Prov", "잠언", "Proverbs"),
    ("ecclesiastes", "Eccl", "전도서", "Ecclesiastes"),
    ("song-of-songs", "Song", "아가", "Song of Songs"),
    ("isaiah", "Isa", "이사야", "Isaiah"),
    ("jeremiah", "Jer", "예레미야", "Jeremiah"),
    ("lamentations", "Lam", "예레미야애가", "Lamentations"),
    ("ezekiel", "Ezek", "에스겔", "Ezekiel"),
    ("daniel", "Dan", "다니엘", "Daniel"),
    ("hosea", "Hos", "호세아", "Hosea"),
    ("joel", "Joel", "요엘", "Joel"),
    ("amos", "Amos", "아모스", "Amos"),
    ("obadiah", "Obad", "오바댜", "Obadiah"),
    ("jonah", "Jonah", "요나", "Jonah"),
    ("micah", "Mic", "미가", "Micah"),
    ("nahum", "Nah", "나훔", "Nahum"),
    ("habakkuk", "Hab", "하박국", "Habakkuk"),
    ("zephaniah", "Zeph", "스바냐", "Zephaniah"),
    ("haggai", "Hag", "학개", "Haggai"),
    ("zechariah", "Zech", "스가랴", "Zechariah"),
    ("malachi", "Mal", "말라기", "Malachi"),
]
assert len(BOOKS) == 39

def download(item):
    slug, osis, ko, en = item
    req = urllib.request.Request(SOURCE_BASE + osis + ".xml",
            headers={"User-Agent": "GladBinah-WLC-Reference-Importer/1.0"})
    with urllib.request.urlopen(req, timeout=90) as response:
        body = response.read()
    if len(body) < 10000:
        raise ValueError("Unexpectedly small upstream XML for " + slug)
    return item, body

def inner_text(node):
    # A forward slash in OSHB <w> separates morphology; not part of biblical Hebrew.
    value = "".join(node.itertext()).replace("/", "")
    return re.sub(r"\s+", " ", value).strip()

def process_verse(verse, osis, chapter, number):
    if verse.get("osisID") != f"{osis}.{chapter}.{number}":
        raise ValueError(f"Unexpected OSIS verse id {verse.get('osisID')}")
    parts = []
    joined_to_next = False
    ketiv = []
    qere = []
    other_notes = 0
    words = 0
    for child in verse:
        kind = child.tag.removeprefix(NS)
        if kind == "w":
            value = inner_text(child)
            if not value:
                raise ValueError("Empty Hebrew word at " + verse.get("osisID"))
            parts.append(("" if not parts or joined_to_next else " ") + value)
            joined_to_next = False
            words += 1
            if child.get("type") == "x-ketiv":
                ketiv.append(value)
        elif kind == "seg":
            value = inner_text(child)
            if not value:
                continue
            if value in ("־", "׃"):
                parts.append(value)
                joined_to_next = value == "־"
            else:
                parts.append(" " + value)
                joined_to_next = False
        elif kind == "note":
            if child.get("type") == "variant":
                reading = child.find(f".//{NS}rdg")
                if reading is not None:
                    word = inner_text(reading)
                    if word:
                        qere.append(word)
                    else:
                        qere.append("—")
                else:
                    qere.append("—")
            else:
                other_notes += 1
        else:
            raise ValueError(f"Unhandled verse markup {kind} in {verse.get('osisID')}")
    if not words:
        raise ValueError("No Hebrew words at " + verse.get("osisID"))
    line = "".join(parts).strip()
    if "/" in line:
        raise ValueError("Unremoved OSHB morpheme separator in " + verse.get("osisID"))
    if not re.search(r"[\u0590-\u05ff]", line):
        raise ValueError("Non-Hebrew verse " + verse.get("osisID"))
    # Preserve Ketiv in the primary text, and Qere in the textual-note apparatus.
    variants = []
    if ketiv or qere:
        variants.append((chapter, number, " / ".join(ketiv) if ketiv else "—",
                         " / ".join(qere) if qere else "—"))
    return line, variants, words, other_notes

def convert(item, raw):
    slug, osis, ko, en = item
    root = ET.fromstring(raw)
    chapters = root.findall(f".//{NS}chapter")
    if not chapters:
        raise ValueError("No chapters in " + slug)
    lines = [
        f"# {ko} · {en} — Westminster Leningrad Codex",
        "",
        f"> 본문: [Westminster Leningrad Codex (WLC)]({SOURCE_REPO})",
        "",
    ]
    verses_total = 0
    variants = []
    other_notes = 0
    words_total = 0
    for chapter_n, chapter in enumerate(chapters, 1):
        if chapter.get("osisID") != f"{osis}.{chapter_n}":
            raise ValueError(f"Unexpected chapter id in {slug}: {chapter.get('osisID')}")
        entries = chapter.findall(f"{NS}verse")
        if not entries:
            raise ValueError(f"No verses in {osis}.{chapter_n}")
        lines.extend(["", f"## Chapter {chapter_n} {{#chapter-{chapter_n}}}", ""])
        for vnum, verse in enumerate(entries, 1):
            text, notes, nwords, other = process_verse(verse, osis, chapter_n, vnum)
            variants.extend(notes)
            other_notes += other
            words_total += nwords
            lines.append(f'**{vnum}** <span class="wlc-hebrew" dir="rtl" lang="he">{escape(text)}</span>  ')
            verses_total += 1
    if variants:
        lines.extend(["", "## Ketiv/Qere — 기록형과 낭독형", "",
          "본문에는 기록형(Ketiv)을 두고, 전통적으로 낭독되는 형태(Qere)를 아래에 구별해 표시합니다.", ""])
        for ch, v, written, read in variants:
            anchor = f"wlc-kq-{ch}-{v}"
            lines.append(f'<span id="{anchor}"></span>**{ch}:{v}** — כתיב: '
                         f'<span class="wlc-hebrew" lang="he" dir="rtl">{escape(written)}</span> · '
                         f'קרי: <span class="wlc-hebrew" lang="he" dir="rtl">{escape(read)}</span>  ')
        # Insert navigation markers after rendering, without changing verse content.
        for ch, v, _, _ in variants:
            target = f'<span class="wlc-hebrew"'
            chapter_start = lines.index(f"## Chapter {ch} {{#chapter-{ch}}}")
            verse_prefix = f"**{v}** "
            for j in range(chapter_start + 1, len(lines)):
                if lines[j].startswith(verse_prefix):
                    lines[j] = lines[j].rstrip() + f' [†](#wlc-kq-{ch}-{v})  '
                    break
            else:
                raise ValueError(f"Cannot find variant's verse in {slug} {ch}:{v}")
    content = "\n".join(lines).rstrip() + "\n"
    return {
        "slug": slug, "osis": osis, "ko": ko, "en": en,
        "chapter_count": len(chapters), "verse_count": verses_total,
        "variant_locations": len(variants), "word_elements": words_total,
        "other_editorial_notes": other_notes,
        "upstream_sha256": sha256(raw).hexdigest(),
        "rendered_sha256": sha256(content.encode("utf-8")).hexdigest(),
        "content": content,
    }

def index_page(language, results, numchapters, numverses):
    ko = language == "ko"
    header = ("# 마소라 본문 — Westminster Leningrad Codex" if ko
             else "# Masoretic Text — Westminster Leningrad Codex")
    lead = (
        "구약성경의 히브리어·성서 아람어 **마소라 본문**을 책별로 제공합니다. "
        "이 전자 본문은 레닌그라드 사본에 기반한 **Westminster Leningrad Codex(WLC)**이며, "
        "KJV 번역자들이 직접 사용한 히브리어 인쇄본과 동일한 판본이라는 뜻은 아닙니다."
        if ko else
        "Read the Hebrew and Biblical Aramaic **Masoretic Text** of the Old Testament, "
        "book by book. The electronic **Westminster Leningrad Codex (WLC)** is based on "
        "the Leningrad manuscript; it is not identical to a particular printed Hebrew "
        "edition used by the KJV translators.")
    info = (
        "**본문 출처:** [Open Scriptures Hebrew Bible](https://github.com/openscriptures/morphhb) "
        "(WLC: 퍼블릭 도메인). 형태 분석 데이터는 싣지 않았습니다.\n\n"
        "**장절 번호:** 마소라 본문 자체의 번호를 유지합니다. "
        "KJV의 장절 번호와 다른 부분이 있으며, 임의로 변환하지 않았습니다.\n\n"
        "**표기:** 모음부호와 전통적 악센트를 보존합니다. Ketiv/Qere는 해당 성경책 하단에 구별해 기록합니다."
        if ko else
        "**Text source:** [Open Scriptures Hebrew Bible](https://github.com/openscriptures/morphhb) "
        "(WLC text: public domain). No morphology annotations are reproduced.\n\n"
        "**Versification:** Original Masoretic chapter and verse numbering is retained; "
        "it sometimes differs from the KJV. No remapping was applied.\n\n"
        "**Text:** Vowel points and cantillation marks are preserved; Ketiv/Qere variants "
        "are distinguished in notes following each book.")
    subtitle = "## 구약성경 (39권)" if ko else "## Old Testament (39 books)"
    links = "\n".join(
        f"- [{r['ko'] if ko else r['en']}]({r['slug']}.md)" for r in results
    )
    extent = (f"**수록 범위:** 39권 · {numchapters:,}장 · {numverses:,}절"
              if ko else
              f"**Coverage:** 39 books · {numchapters:,} chapters · {numverses:,} verses")
    return "\n\n".join([header, lead, info, extent, subtitle, links]) + "\n"

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    fetched = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(download, item) for item in BOOKS]
        for future in as_completed(futures):
            item, body = future.result()
            fetched[item[0]] = body
    results = [convert(item, fetched[item[0]]) for item in BOOKS]
    chapters = sum(x["chapter_count"] for x in results)
    verses = sum(x["verse_count"] for x in results)
    if chapters != 929 or not 22000 <= verses <= 24000:
        raise ValueError(f"Unexpected OSHB size: {chapters} chapters, {verses} verses")
    if not results[0]["content"].split("## Chapter 1")[1].find("בְּרֵאשׁ") >= 0:
        raise ValueError("Genesis 1:1 Hebrew sanity check failed")
    for r in results:
        (OUT / (r["slug"] + ".md")).write_text(r.pop("content"), encoding="utf-8")
    (OUT / "index.md").write_text(index_page("ko", results, chapters, verses), encoding="utf-8")
    (OUT / "index.en.md").write_text(index_page("en", results, chapters, verses), encoding="utf-8")
    manifest = {
      "edition": "Westminster Leningrad Codex (WLC)",
      "upstream_project": SOURCE_REPO,
      "upstream_commit": SOURCE_COMMIT,
      "underlying_hebrew_text_license": "Public Domain",
      "morphological_annotations_included": False,
      "hebrew_nfc_normalization_applied": False,
      "word_morpheme_markers_removed": True,
      "ketiv_qere_recorded": True,
      "numbering": "Original Masoretic, not KJV remapped",
      "books": 39, "chapters": chapters, "verses": verses,
      "book_data": results
    }
    (OUT / "import-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"WLC import verified: 39 books / {chapters} chapters / {verses} verses")
    for r in results:
        print(f"  {r['slug']}: {r['chapter_count']} chapters; {r['verse_count']} verses; "
              f"{r['variant_locations']} Ketiv/Qere positions")

if __name__ == "__main__":
    main()
