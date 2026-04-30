---
read_when:
    - 전체 CLI 온보딩 없이 최초 실행 설정을 진행하고 있습니다
    - 기본 워크스페이스 경로를 설정하려는 경우
summary: '`openclaw setup`의 CLI 참조 (설정 + 워크스페이스 초기화)'
title: 설정
x-i18n:
    generated_at: "2026-04-30T06:24:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` 및 에이전트 작업 영역을 초기화합니다.

관련 항목:

- 시작하기: [시작하기](/ko/start/getting-started)
- CLI 온보딩: [온보딩 (CLI)](/ko/start/wizard)

## 예시

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 옵션

- `--workspace <dir>`: 에이전트 작업 영역 디렉터리(`agents.defaults.workspace`로 저장됨)
- `--wizard`: 온보딩 실행
- `--non-interactive`: 프롬프트 없이 온보딩 실행
- `--mode <local|remote>`: 온보딩 모드
- `--import-from <provider>`: 온보딩 중 실행할 마이그레이션 프로바이더
- `--import-source <path>`: `--import-from`의 소스 에이전트 홈
- `--import-secrets`: 온보딩 마이그레이션 중 지원되는 시크릿 가져오기
- `--remote-url <url>`: 원격 Gateway WebSocket URL
- `--remote-token <token>`: 원격 Gateway 토큰

설정을 통해 온보딩을 실행하려면:

```bash
openclaw setup --wizard
```

참고:

- 일반 `openclaw setup`은 전체 온보딩 흐름 없이 구성 + 작업 영역을 초기화합니다.
- 온보딩 플래그가 있으면 온보딩이 자동으로 실행됩니다(`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Hermes 상태가 감지되면 대화형 온보딩에서 마이그레이션을 자동으로 제안할 수 있습니다. 가져오기 온보딩에는 새 설정이 필요합니다. 온보딩 외부에서 드라이런 계획, 백업, 덮어쓰기 모드를 사용하려면 [마이그레이션](/ko/cli/migrate)을 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [설치 개요](/ko/install)
