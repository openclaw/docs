---
read_when:
    - 전체 CLI 온보딩 없이 최초 실행 설정을 수행하고 있습니다
    - 기본 작업 공간 경로를 설정하려는 경우
    - 모든 플래그와 설정이 기준 모드와 마법사 모드 중 어느 쪽을 선택할지 결정하는 방식을 알아야 합니다
summary: '`openclaw setup`에 대한 CLI 참조(구성 및 작업 공간을 초기화하고, 선택적으로 온보딩 실행)'
title: 설정
x-i18n:
    generated_at: "2026-05-10T19:29:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

기본 구성과 에이전트 작업 영역을 초기화합니다. 온보딩 플래그가 있으면 마법사도 실행합니다.

<Note>
`openclaw setup`은 변경 가능한 구성 설치용입니다. Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 구성 파일이 Nix에서 관리되므로 OpenClaw가 setup 쓰기를 거부합니다. 공식 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start) 또는 다른 Nix 패키지의 동등한 소스 구성을 사용하세요.
</Note>

## 옵션

| 플래그                    | 설명                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 에이전트 작업 영역 디렉터리(기본값 `~/.openclaw/workspace`, `agents.defaults.workspace`로 저장됨). |
| `--wizard`                 | 대화형 온보딩을 실행합니다.                                                                         |
| `--non-interactive`        | 프롬프트 없이 온보딩을 실행합니다.                                                                     |
| `--mode <mode>`            | 온보딩 모드: `local` 또는 `remote`.                                                               |
| `--import-from <provider>` | 온보딩 중 실행할 마이그레이션 제공자입니다.                                                        |
| `--import-source <path>`   | `--import-from`의 소스 에이전트 홈입니다.                                                              |
| `--import-secrets`         | 온보딩 마이그레이션 중 지원되는 비밀 정보를 가져옵니다.                                               |
| `--remote-url <url>`       | 원격 Gateway WebSocket URL입니다.                                                                       |
| `--remote-token <token>`   | 원격 Gateway 토큰(선택 사항)입니다.                                                                    |

### 마법사 자동 트리거

`openclaw setup`은 `--wizard` 없이도 다음 플래그 중 하나가 명시적으로 있으면 마법사를 실행합니다.

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## 예시

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 참고

- 일반 `openclaw setup`은 전체 온보딩 흐름을 실행하지 않고 구성과 작업 영역을 초기화합니다.
- 일반 setup 이후 전체 안내 과정을 진행하려면 `openclaw onboard`를 실행하고, 대상 변경을 하려면 `openclaw configure`를 실행하거나, 채널 계정을 추가하려면 `openclaw channels add`를 실행하세요.
- Hermes 상태가 감지되면 대화형 온보딩에서 마이그레이션을 자동으로 제안할 수 있습니다. 가져오기 온보딩에는 새 setup이 필요합니다. 온보딩 외부에서 드라이런 계획, 백업, 덮어쓰기 모드를 사용하려면 [마이그레이션](/ko/cli/migrate)을 사용하세요.

## 관련

- [CLI 참조](/ko/cli)
- [온보딩(CLI)](/ko/start/wizard)
- [시작하기](/ko/start/getting-started)
- [설치 개요](/ko/install)
