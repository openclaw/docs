---
read_when:
    - 전체 CLI 온보딩 없이 첫 실행 설정을 진행하고 있습니다
    - 기본 워크스페이스 경로를 설정하려는 경우
    - 모든 플래그와 설정이 baseline 모드와 wizard 모드 중에서 어떻게 결정하는지 알아야 합니다
summary: '`openclaw setup`에 대한 CLI 참조(구성 및 워크스페이스 초기화, 선택적으로 온보딩 실행)'
title: 설정
x-i18n:
    generated_at: "2026-06-27T17:19:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

기본 구성과 에이전트 작업 영역을 초기화합니다. 온보딩 플래그가 하나라도 있으면 마법사도 실행합니다.

<Note>
`openclaw setup`은 변경 가능한 구성 설치를 위한 것입니다. Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 구성 파일이 Nix에서 관리되므로 OpenClaw가 설정 쓰기를 거부합니다. 공식 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start) 또는 다른 Nix 패키지에 해당하는 동등한 소스 구성을 사용하세요.
</Note>

## 옵션

| 플래그                     | 설명                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 에이전트 작업 영역 디렉터리(기본값 `~/.openclaw/workspace`; `agents.defaults.workspace`로 저장됨). |
| `--wizard`                 | 대화형 온보딩을 실행합니다.                                                                         |
| `--non-interactive`        | 프롬프트 없이 온보딩을 실행합니다.                                                                  |
| `--accept-risk`            | 전체 시스템 에이전트 접근 위험을 승인합니다. `--non-interactive`와 함께 필요합니다.                |
| `--mode <mode>`            | 온보딩 모드: `local` 또는 `remote`.                                                                 |
| `--import-from <provider>` | 온보딩 중 실행할 마이그레이션 제공자입니다.                                                         |
| `--import-source <path>`   | `--import-from`의 소스 에이전트 홈입니다.                                                           |
| `--import-secrets`         | 온보딩 마이그레이션 중 지원되는 비밀 값을 가져옵니다.                                               |
| `--remote-url <url>`       | 원격 Gateway WebSocket URL입니다.                                                                   |
| `--remote-token <token>`   | 원격 Gateway 토큰입니다(선택 사항).                                                                 |

### 마법사 자동 트리거

`openclaw setup`은 `--wizard` 없이도 다음 플래그 중 하나가 명시적으로 있으면 마법사를 실행합니다.

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## 예시

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 참고

- 단순 `openclaw setup`은 전체 온보딩 흐름을 실행하지 않고 구성과 작업 영역을 초기화합니다.
- 단순 설정 후에는 전체 안내 여정을 위해 `openclaw onboard`를 실행하고, 대상 변경에는 `openclaw configure`를 실행하거나, 채널 계정을 추가하려면 `openclaw channels add`를 실행하세요.
- Hermes 상태가 감지되면 대화형 온보딩에서 마이그레이션을 자동으로 제안할 수 있습니다. 가져오기 온보딩에는 새 설정이 필요합니다. 온보딩 외부에서 모의 실행 계획, 백업, 덮어쓰기 모드를 사용하려면 [마이그레이션](/ko/cli/migrate)을 사용하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [온보딩(CLI)](/ko/start/wizard)
- [시작하기](/ko/start/getting-started)
- [설치 개요](/ko/install)
