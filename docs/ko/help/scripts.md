---
read_when:
    - 저장소에서 스크립트 실행하기
    - ./scripts 아래에 스크립트 추가 또는 변경하기
summary: '저장소 스크립트: 목적, 범위 및 안전 참고 사항'
title: 스크립트
x-i18n:
    generated_at: "2026-07-12T00:49:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/`에는 로컬 워크플로와 운영 작업을 위한 도우미 스크립트가 있습니다. 작업이 특정 스크립트와 명확히 관련된 경우 이를 사용하고, 그렇지 않으면 CLI를 우선 사용하세요.

## 규칙

- 문서 또는 릴리스 체크리스트에서 참조하지 않는 한 스크립트는 **선택 사항**입니다.
- CLI 인터페이스가 있으면 이를 우선 사용하세요(예: `openclaw models status --check`).
- 스크립트는 호스트별로 다를 수 있다고 가정하고, 새 머신에서 실행하기 전에 내용을 확인하세요.

## 인증 모니터링 스크립트

일반적인 모델 인증은 [인증](/ko/gateway/authentication)에서 다룹니다. 아래 스크립트는 원격/헤드리스 호스트에서 **Claude Code CLI 구독 토큰**을 모니터링하고 휴대전화에서 재인증하기 위한 별도의 선택적 시스템입니다.

- `scripts/setup-auth-system.sh` - 일회성 설정: 현재 인증을 확인하고, 장기 유효 `claude setup-token` 생성을 지원하며, systemd/Termux 설치 단계를 출력합니다.
- `scripts/claude-auth-status.sh [full|json|simple]` - Claude Code와 OpenClaw의 인증 상태를 확인합니다.
- `scripts/auth-monitor.sh` - 상태를 주기적으로 확인하고 토큰 만료가 가까워지면 알림을 전송합니다(OpenClaw 전송 및/또는 ntfy.sh 사용). 환경 변수: `WARN_HOURS`(기본값 `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. 번들로 제공되는 `scripts/systemd/openclaw-auth-monitor.{service,timer}`를 통해 일정에 따라 실행합니다(30분마다).
- `scripts/mobile-reauth.sh` - `claude setup-token`을 다시 실행하고 휴대전화에서 열 URL을 출력합니다. Termux에서 SSH를 통해 사용할 수 있습니다.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - 호스트에 SSH로 접속하고 상태 토스트를 표시하며 인증이 만료되었을 때 재인증 콘솔/안내를 여는 Termux:Widget 스크립트입니다.

## GitHub 읽기 도우미

저장소 범위의 읽기 호출에 GitHub App 설치 토큰을 사용하면서 쓰기 작업을 위한 일반 `gh`는 개인 로그인 상태로 유지하려면 `scripts/gh-read`를 사용하세요.

필수 환경 변수:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

선택적 환경 변수:

- 저장소 기반 설치 조회를 건너뛰려는 경우 `OPENCLAW_GH_READ_INSTALLATION_ID`
- 요청할 읽기 권한 하위 집합을 쉼표로 구분하여 재정의하는 `OPENCLAW_GH_READ_PERMISSIONS`

저장소 확인 순서:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

예시:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 스크립트를 추가할 때

- 스크립트의 목적을 명확히 한정하고 문서화하세요.
- 관련 문서에 짧은 항목을 추가하세요(문서가 없으면 새로 만드세요).

## 관련 문서

- [테스트](/ko/help/testing)
- [실시간 테스트](/ko/help/testing-live)
