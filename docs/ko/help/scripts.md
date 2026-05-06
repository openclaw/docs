---
read_when:
    - 리포지토리에서 스크립트 실행
    - ./scripts 아래의 스크립트 추가 또는 변경
summary: '저장소 스크립트: 목적, 범위 및 안전 참고 사항'
title: 스크립트
x-i18n:
    generated_at: "2026-05-06T06:28:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` 디렉터리에는 로컬 워크플로와 운영 작업을 위한 헬퍼 스크립트가 포함되어 있습니다.
작업이 스크립트와 명확히 관련되어 있을 때 이를 사용하고, 그렇지 않으면 CLI를 선호하세요.

## 규칙

- 스크립트는 문서나 릴리스 체크리스트에서 참조되지 않는 한 **선택 사항**입니다.
- CLI 인터페이스가 있으면 그것을 선호하세요(예: 인증 모니터링은 `openclaw models status --check`를 사용합니다).
- 스크립트는 호스트별로 다르다고 가정하고, 새 머신에서 실행하기 전에 내용을 읽으세요.

## 인증 모니터링 스크립트

인증 모니터링은 [인증](/ko/gateway/authentication)에서 다룹니다. `scripts/` 아래의 스크립트는 systemd/Termux 휴대폰 워크플로를 위한 선택적 추가 기능입니다.

## GitHub 읽기 헬퍼

쓰기 작업에는 일반 `gh`가 개인 로그인 상태를 사용하도록 두면서, 저장소 범위 읽기 호출에는 `gh`가 GitHub App 설치 토큰을 사용하게 하려면 `scripts/gh-read`를 사용하세요.

필수 환경 변수:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

선택 환경 변수:

- 저장소 기반 설치 조회를 건너뛰려면 `OPENCLAW_GH_READ_INSTALLATION_ID`
- 요청할 읽기 권한 하위 집합을 쉼표로 구분해 재정의하려면 `OPENCLAW_GH_READ_PERMISSIONS`

저장소 확인 순서:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

예시:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 스크립트를 추가할 때

- 스크립트의 범위를 좁게 유지하고 문서화하세요.
- 관련 문서에 짧은 항목을 추가하세요(없으면 새로 만드세요).

## 관련 항목

- [테스트](/ko/help/testing)
- [라이브 테스트](/ko/help/testing-live)
