---
read_when:
    - 전체 CLI 온보딩 없이 최초 실행 설정을 진행하고 있습니다
    - 기본 작업공간 경로를 설정하려는 경우
summary: '`openclaw setup`용 CLI 참조(구성 + 작업 공간 초기화)'
title: 설정
x-i18n:
    generated_at: "2026-05-06T17:54:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json`과 에이전트 작업 공간을 초기화합니다.

<Note>
`openclaw setup`은 변경 가능한 구성 설치용입니다. Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 구성 파일이 Nix에서 관리되므로 OpenClaw가 설정 쓰기를 거부합니다. 에이전트는 공식 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start) 또는 다른 Nix 패키지에 해당하는 소스 구성을 사용해야 합니다.
</Note>

관련 항목:

- 시작하기: [시작하기](/ko/start/getting-started)
- CLI 온보딩: [온보딩(CLI)](/ko/start/wizard)

## 예제

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 옵션

- `--workspace <dir>`: 에이전트 작업 공간 디렉터리(`agents.defaults.workspace`로 저장됨)
- `--wizard`: 온보딩 실행
- `--non-interactive`: 프롬프트 없이 온보딩 실행
- `--mode <local|remote>`: 온보딩 모드
- `--import-from <provider>`: 온보딩 중 실행할 마이그레이션 제공자
- `--import-source <path>`: `--import-from`의 소스 에이전트 홈
- `--import-secrets`: 온보딩 마이그레이션 중 지원되는 비밀 정보 가져오기
- `--remote-url <url>`: 원격 Gateway WebSocket URL
- `--remote-token <token>`: 원격 Gateway 토큰

설정을 통해 온보딩을 실행하려면:

```bash
openclaw setup --wizard
```

참고:

- 단순 `openclaw setup`은 전체 온보딩 흐름 없이 구성과 작업 공간을 초기화합니다.
- 단순 설정 후 `openclaw configure`를 실행하여 모델, 채널, Gateway, Plugin, Skills 또는 상태 검사를 선택합니다.
- 온보딩 플래그가 하나라도 있으면 온보딩이 자동 실행됩니다(`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Hermes 상태가 감지되면 대화형 온보딩에서 마이그레이션을 자동으로 제안할 수 있습니다. 가져오기 온보딩에는 새 설정이 필요합니다. 온보딩 외부에서 드라이런 계획, 백업, 덮어쓰기 모드를 사용하려면 [마이그레이션](/ko/cli/migrate)을 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [설치 개요](/ko/install)
