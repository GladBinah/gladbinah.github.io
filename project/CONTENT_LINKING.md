# 성경 번역·해설·시각 자료 연결 규약

공통 작업 및 문단 작성은 [AGENTS.md](../AGENTS.md), 번역 판단은 [번역 원칙](../docs/translation/principles.md), 해설 작성은 최신 Bible Study Master Prompt와 [성경 해석의 원칙](../docs/commentary/principles.md)을 따른다. 이 문서는 자료 연결과 출판의 기술·운영 규약이다.

## 1. 독립 저작물과 독서 환경

성경 번역과 해설은 별개의 독립 저작물이다. 기존 성경 번역 페이지의 본문, 일반 읽기·원어 학습·Translation Notes와 문단 구조를 유지한다. 별도의 통합 독서 메뉴는 만들지 않고 성경 해설 영역에서 책 → 필요한 Part → 필요한 Section → 절별·절묶음 해설이라는 위계와 서론·Part 읽기 안내 및 종합·책 전체 결론을 독립적으로 구성한다. 실제 읽기 단위의 '1. 본문 읽기'에서는 해당 범위의 승인·공개 본문을 펼치거나 접고 한국어·영어 KJV 읽기용 편집본을 선택할 수 있도록 한다. 부분 공개라면 실제 제공 범위를 표시하고, 공개본이 없어도 해설 작업을 보류하지 않는다. 본문 전문은 번역 데이터에서 불러오며 해설 원고에 중복 저장·편집하지 않는다.

개인 Obsidian 집필 원고와 승인된 비공개 자료는 개인 작업 환경에서 관리한다. 공개 저장소의 승인 파일은 공개 상태와 성경 번역 데이터의 기준이다. 공개 원고와 개인 원고를 독립적으로 수정하지 않고 마지막 공통 승인본과 양쪽 변경을 대조하여 합의된 내용만 반영한다. 공개 저장소에는 미승인 원고, 이미지 후보, 개인 연구 메모·경로 또는 권리가 확보되지 않은 파일을 넣지 않는다. 개인 환경의 폴더와 백업 방식은 작성자의 결정에 따른다.

## 2. 안정적인 연결 키

자료는 제목이나 표시 번호가 아니라 안정적인 성경책 코드와 장·절 범위로 연결한다. 현재 창세기 코드는 GEN이다. 새 책의 코드는 등록 시 확정하고 이후 변경하거나 재사용하지 않는다. 번역 Section ID(예: GEN-S02)와 Translation Notes ID(예: GEN-S02-T07)를 보존한다. 해설의 독립 단위(책 서론, Part 안내, Section 또는 직접 읽는 Part, 절묶음 해설, Part 종합 및 책 결론)에는 불변 ID(예: GEN-C001)를 부여하여 Markdown의 명시적 앵커와 연결한다. Part·Section 번호와 제목은 표시 구조이며 ID를 대체하지 않는다. 분할·통합·제목 변경 시 기존 참조를 보존하도록 대응과 필요한 앵커 별칭을 기록한다.

번역과 해설의 내용 단위는 각각 독립적으로 결정한다. 상위 해설에는 책 또는 Part의 범위와 실제 관련 참조를 기록하되, 독립적인 서론·종합을 절별 해설로 강제 분류하지 않는다. 공개되지 않은 대상이나 존재하지 않는 앵커의 가상 링크를 만들지 않는다.

## 3. 공개 파일 및 카탈로그

- 번역 원본: 기존 `docs/assets/scripture/<book-slug>/<dataset-id>.json` 구조를 유지한다. 현재 창세기 파일은 `genesis/GEN-020.json`이다.
- 본문 연결 카탈로그: `docs/assets/scripture/catalog.json`에 책별 현재 공개 누적 데이터 파일, 실제 번역 페이지 경로 및 KJV 장별 절 수를 등록한다. 새 책이나 데이터 경로가 바뀌면 함께 갱신하며, 버전은 원본 데이터의 version에서 읽는다. 장절 수는 실제 KJV 기준 자료에서 검증한다.
- 공개 해설: 기존 `docs/commentary/old-testament/` 또는 `docs/commentary/new-testament/` 아래 책별 Markdown. 내부 경로와 기존 URL을 보존한다.
- 해설 연결 기록: 첫 승인 해설 출판 시 `docs/assets/commentary/<book-slug>/manifest.json`을 만들고 카탈로그에 commentary의 reader와 manifest 경로를 등록한다. 자체 번역이 없는 책도 번역 data와 reader 없이 해설만 등록할 수 있다.
- 시각 자료: 최초 승인 자료의 등록 시 `docs/assets/commentary/media/`와 그 아래 `registry.json`을 기본 경로로 사용할 수 있다. 실제 저장 전에 기존 규약과 승인 상태를 확인한다.

카탈로그 data는 assets/scripture 아래 상대 경로, reader는 사이트 루트 기준 상대 URL이다. 실제 해설 공개 시에만 `commentary: {"reader":"commentary/old-testament/genesis/","manifest":"assets/commentary/genesis/manifest.json"}` 같은 필드를 추가한다. 이 예시는 형식 설명일 뿐 아직 존재하지 않는 해설을 등록하지 않는다.

## 4. 해설 연결 기록과 웹 본문

책별 manifest에는 schema_version, book, commentary_version, units를 둔다. 각 unit에는 id, kind, title, parent_id(필요시), start_ref/end_ref(관련 범위가 있을 때), status와 필요한 related_translation_notes, image_ids, translation_basis, translation_dependencies를 기록한다. kind는 book_intro, part_intro, section, part_reading, verse_block, part_summary, book_conclusion 등을 사용한다. section과 part_reading은 실제 읽기 단위이며 공개 manifest에는 published 자료만 등록한다. 상위 구조와 절묶음의 범위 중첩은 허용한다.

translation_basis에는 실제 확인한 자체 번역의 book, lang, version, commit(고정 Git 커밋), source_data를 기록한다. translation_dependencies에는 실제 인용 또는 논증이 의존하는 book, lang, start_ref, end_ref, basis_version, basis_commit, source_data, kind(quote, wording, paragraph, note 등)를 기록한다. 직접 인용에는 exact_quote를, 번역 결정에 의존하면 note_id를 기록한다. 다른 책의 참조도 해당 책 코드로 기록한다. 단순 읽기 범위와 논증의 번역 의존 범위를 구별한다. 자체 번역이 없어 외부 역본을 인용한 경우 역본·범위·출처 및 이후 검토 필요성을 기록한다. 이 정보는 출판 단계에서 Agent가 승인 원고와 확인된 출처를 바탕으로 구성하며 작성자에게 중복 입력을 요구하지 않는다.

개인 Obsidian 원고에는 읽기 범위와 확인된 일반 Markdown 링크를 유지한다. 웹 출판본에서는 아래의 접이식 본문 영역을 사용한다. 예시는 기술 형식이며 승인 해설이 아니다.

```html
<details class="commentary-scripture" data-book="GEN"
         data-start="2:4" data-end="2:25" data-lang="ko" open>
  <summary>성경 본문 · 창세기 2:4–25</summary>
  <p class="commentary-scripture-fallback">
    <a href="/translation/old-testament/genesis/#GEN-S02">성경 본문 및 원어 학습 열기</a>
  </p>
</details>
```

컴포넌트는 카탈로그에 등록된 공개 데이터의 정확한 범위를 표시한다. 미공개 또는 불러오기 실패에도 해설과 검증된 링크는 읽을 수 있어야 한다. 번역 페이지의 절 앵커는 `#sr-ko-2-19`, `#sr-en-2-19`, 원어 학습은 `#sr-ko-2-19-study`를 사용한다. 공개 해설 manifest가 있을 때만 관련 번역 Section에 작은 해설 링크를 제공하며 기존 읽기 탭과 구조는 바꾸지 않는다. Translation Notes도 실제 ID로 연결한다.

## 5. 개정 및 검증

번역 출판·개정 시 실제 추가·수정된 책·장절·언어, 문단 및 Translation Notes를 식별한다. 공개 해설 manifest 및 확인 가능한 승인 원고의 translation_dependencies와 대조하여 실제 영향을 받는 해설만 검토 대상으로 기록한다. 인용 기준판과 검토 상태·결과를 보존하며, 직접 인용이나 논증을 자동 변경하지 않는다. 독자는 본문 영역의 현재 판본과 해설의 인용 기준판을 구별할 수 있어야 한다. 번역과 해설의 승인·버전·출판 이력은 독립적으로 관리한다.

출판 시 카탈로그, 실제 파일·장절·앵커·링크, 인용판과 실제 문구, Translation Notes, 이미지 권리·승인 및 경로를 검증한다. 전체·부분·미공개 본문, 언어 전환, 펼침·접기, 불러오기 실패, 링크 및 모바일 표시를 실제 가능한 환경에서 시험하며 기존 번역 기능의 회귀도 확인한다. GitHub 저장, 빌드, 배포와 실제 브라우저 검증은 구별한다. 자동 의존성 검증 도구가 없는 단계에서는 Agent가 실제 자료를 대조하고 결과를 기록한다. 최초 해설 출판 시 실제 manifest와 렌더링을 검증한다.

## 6. 시각 자료 관리

이미지 후보·원본·승인된 편집본·공개본을 구별한다. 이미지에는 불변 ID를 부여하고 실제 파일, 관련 책·장절과 해설 ID, 승인된 캡션·대체 텍스트를 연결한다. 여러 책·영상에서 재사용해도 하나의 ID와 원본을 기준으로 관리한다. 등록 기록에는 작가·제작자·작품명·연대·소장 기관, 원본 출처와 실제 이미지 URL, 권리 근거·라이선스·확인일, 원본과 수정본의 대응·편집 내역, 해설·웹·YouTube 등 매체별 승인 및 재사용 범위를 남긴다. 필요한 경우 공개용 파일의 체크섬과 버전을 기록한다. 외부 이미지의 권리는 성경 번역·해설의 라이선스와 별개이다. 공개 링크는 상대 경로 또는 실제 사이트 URL을 사용하며 개인 Windows 절대 경로나 미승인 원본을 공개하지 않는다. 상세 검토는 Master Prompt I.14 및 [저작권 및 AI 활용 안내](../docs/policies/index.md)를 따른다.
