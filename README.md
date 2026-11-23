# 성경 앞의 우리 — Together Before Scripture

「성경 앞의 우리」의 공식 웹사이트를 위한 MkDocs Material 소스 저장소입니다.

- **웹사이트:** https://gladbinah.github.io/
- **YouTube:** https://www.youtube.com/@GladBinah

## 사이트 구성

- **성경 번역:** KJV의 독립적인 한국어 번역 작업, 번역 원칙, 책별 버전과 검토 기록
- **성경 주석:** 책별·내용 단위별 주석 프로젝트 (추후 공개)

현재는 웹사이트 소개와 작업 원칙을 공개한 초기 단계입니다. 아직 승인된 성경 번역문과 주석서는 게시되지 않았습니다.

## 로컬 미리보기

```bash
python -m pip install -r requirements.txt
mkdocs serve
```

## GitHub Pages 배포

저장소의 Settings → Pages → Build and deployment → Source에서 **GitHub Actions**를 선택합니다.

`main` 브랜치에 Markdown이나 MkDocs 설정이 반영되면 `.github/workflows/deploy.yml`이 MkDocs 사이트를 빌드하여 GitHub Pages에 게시합니다. 배포 작업은 **Actions** 탭에서 확인할 수 있습니다.

## 공개와 검토

성경 번역 본문은 책별로 독립적인 버전을 관리하고, 중요한 결정과 비판·수정 근거를 별도로 기록할 예정입니다. 독립 한국어 번역문의 목표 라이선스는 CC BY-NC-SA 4.0이며, 실제 공개 시 권리와 적용 범위를 책별로 명시합니다. 주석은 All Rights Reserved, 영어 KJV 편집본은 독점적 저작권을 주장하지 않는 원칙으로 구분합니다.

이 저장소의 README 및 사이트 운영 자료에 적힌 내용과, 향후 공개될 번역문 각각의 이용 조건은 같다고 가정하지 마세요. [저작권 및 AI 활용 안내](https://gladbinah.github.io/policies/)와 [기여 및 수정 안내](https://gladbinah.github.io/policies/contributing/)를 확인해 주세요.

## 문단 편집 기준

공개 글은 문장 수가 아니라 **논리적 단위**를 기준으로 문단을 구성합니다. 하나의 주장과 그 근거·설명은 가능한 한 같은 문단에 두고, 논점이 실제로 전환될 때 문단을 구분합니다. 단독 강조문을 남발하지 않으며, 목록·인용·안내문은 각 기능에 맞는 구조를 유지합니다. 한국어와 영어 페이지 모두 같은 기준을 적용합니다.

## 개인정보

공개 커밋의 작성자 이름·이메일이 노출될 수 있으므로 GitHub 계정의 이메일 공개 설정을 점검하세요.
