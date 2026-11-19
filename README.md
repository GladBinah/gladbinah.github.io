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

성경 번역 본문은 책별로 독립적인 버전을 관리하고, 중요한 결정과 비판·수정 근거를 별도로 기록할 예정입니다. 번역문의 목표 라이선스는 CC BY-NC 4.0이며, 실제 공개할 때 권리와 적용 범위를 명시합니다.

이 저장소의 README 및 사이트 운영 자료에 적힌 내용과, 향후 공개될 번역문 각각의 이용 조건은 같다고 가정하지 마세요.

## 개인정보

공개 커밋의 작성자 이름·이메일이 노출될 수 있으므로 GitHub 계정의 이메일 공개 설정을 점검하세요. 이 프로젝트는 PsycheMatrica의 학술 프로젝트와 독립적으로 운영합니다.
