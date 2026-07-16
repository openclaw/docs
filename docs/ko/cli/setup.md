---
read_when:
    - 설정 또는 복구를 위해 OpenClaw와 채팅하려고 합니다
    - 온보딩 마법사를 사용하여 최초 실행 설정을 진행하고 있습니다.
    - 기본 작업 공간 경로를 설정하려고 합니다
    - 스크립트에는 기준선 전용 설정 플래그가 필요합니다
summary: '`openclaw setup`에 대한 CLI 참조(온보딩 폴백을 지원하는 시스템 에이전트 채팅)'
title: 설정
x-i18n:
    generated_at: "2026-07-16T12:31:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup`은 시스템 에이전트 진입점입니다. 구성된 시스템에서 별도의 옵션 없이
`openclaw setup`을 실행하면 대화형 OpenClaw 채팅이 열립니다. 새 시스템에서는
안내형 온보딩으로 전환됩니다. 단일 요청에는 `-m`/`--message`을 사용하고,
마법사 없이 구성/워크스페이스 폴더를 초기화하려면 `--baseline`을 사용하십시오.

라우팅 순서:

1. 온보딩 옵션(`--wizard`, `--baseline`, 워크스페이스, 재설정,
   비대화형, 흐름, 모드, Gateway, 데몬, 건너뛰기, 가져오기, 원격 또는 인증
   옵션)을 지정하면 `openclaw onboard`과 정확히 동일하게 온보딩을 실행합니다.
2. `-m`/`--message` 또는 `--yes`은 시스템 에이전트를 실행합니다.
3. 라우팅 옵션이 없으면 구성된 대화형 시스템에서 OpenClaw가 열립니다. 새
   시스템에서는 온보딩을 실행합니다. 구성된 시스템에서는 TTY가 없어도 `--json`이
   시스템 개요를 출력하며, 온보딩 옵션을 지정하면 온보딩의
   JSON 요약이 유지됩니다.

안내형 모드에서 `--workspace <dir>`은 OpenClaw에 제안되는 워크스페이스이며,
해당 제안을 승인한 후에만 저장됩니다. 기준, 클래식 및
비대화형 설정은 일반적인 흐름을 통해 제공된 워크스페이스를 저장합니다.

안내형 추론 감지는 macOS 또는 Linux의 Gateway 호스트에서 실행됩니다. CLI와
macOS 앱은 구성된 모델, 지원되는 CLI 로그인, API 키 환경 변수 및 이미
설치된 Ollama 또는 LM Studio 모델을 확인하는 동일한 Gateway 소유 감지기를
호출합니다. 이 자동 처리 과정에서는 로컬 모델을 절대 다운로드하지 않습니다.
선택된 후보가 실제 완성 요청에 응답해야만 공급자 및 모델 구성이 저장됩니다.

`setup`은 인증(`--auth-choice`, `--token`, 공급자 키 플래그),
Gateway(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale(`--tailscale`), 재설정(`--reset`, `--reset-scope`), 흐름
(`--flow quickstart|advanced|manual|import`) 및 건너뛰기 플래그
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`)를 포함하여
`openclaw onboard`과 동일한 온보딩 플래그를 허용합니다. 전체 플래그 참조와
비대화형 예제는 [온보딩](/ko/cli/onboard) 및
[CLI 자동화](/ko/start/wizard-cli-automation)를 참조하십시오. `openclaw onboard --modern`은 동일한
추론 게이트 OpenClaw 어시스턴트를 위한 호환성 진입점으로 유지됩니다.

<Note>
`openclaw setup`은 변경 가능한 구성 설치용입니다. Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 구성 파일을 Nix가 관리하므로 OpenClaw가 설정 쓰기를 거부합니다. 공식 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start) 또는 다른 Nix 패키지에 상응하는 소스 구성을 사용하십시오.
</Note>

## 옵션

| 플래그                       | 설명                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | OpenClaw 요청 하나를 실행합니다.                                                                             |
| `--yes`                    | 하나의 `--message` 요청에 대해 영구 구성 쓰기를 승인합니다.                                         |
| `--workspace <dir>`        | 안내형 모드의 워크스페이스 제안이며, 기준, 클래식 및 비대화형 설정에서는 직접 저장됩니다. |
| `--baseline`               | 온보딩 없이 기준 구성/워크스페이스/세션 폴더를 생성합니다.                                  |
| `--wizard`                 | 대화형 온보딩을 강제로 실행합니다.                                                                         |
| `--non-interactive`        | 프롬프트 없이 온보딩을 실행합니다.                                                                       |
| `--accept-risk`            | 전체 시스템 에이전트 액세스 위험을 인정합니다. `--non-interactive`과 함께 사용해야 합니다.                         |
| `--mode <mode>`            | 온보딩 모드: `local` 또는 `remote`.                                                                 |
| `--flow <flow>`            | 온보딩 흐름: `quickstart`, `advanced`, `manual` 또는 `import`.                                        |
| `--reset`                  | 온보딩 전에 구성 + 자격 증명 + 세션을 재설정합니다(워크스페이스는 `--reset-scope full`을 사용한 경우에만 해당).   |
| `--reset-scope <scope>`    | 재설정 범위: `config`, `config+creds+sessions` 또는 `full`.                                            |
| `--import-from <provider>` | 온보딩 중 실행할 마이그레이션 공급자입니다.                                                          |
| `--import-source <path>`   | `--import-from`의 소스 에이전트 홈입니다.                                                                |
| `--import-secrets`         | 온보딩 마이그레이션 중 지원되는 비밀 정보를 가져옵니다.                                                 |
| `--remote-url <url>`       | 원격 Gateway WebSocket URL입니다.                                                                         |
| `--remote-token <token>`   | 원격 Gateway 토큰입니다(선택 사항).                                                                      |
| `--json`                   | 구성된 시스템: OpenClaw 개요. 온보딩 경로: 온보딩 요약.                           |

`--classic`과 `--non-interactive`은 상호 배타적입니다. 클래식은
프롬프트가 표시되는 마법사를 열고, 비대화형 설정은 자동화 경로를 사용합니다.

### 기준 모드

`openclaw setup --baseline`은 이전의 기준 전용 동작을 유지합니다. 구성,
워크스페이스 및 세션 디렉터리를 생성한 후 온보딩을 실행하지 않고
종료합니다.

## 예제

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 참고

- 기준 설정 후 전체 안내 과정을 진행하려면 `openclaw onboard`을, 특정 항목을 변경하려면 `openclaw configure`을, 채널 계정을 추가하려면 `openclaw channels add`을 실행하십시오.
- Hermes 상태가 감지되면 대화형 온보딩에서 마이그레이션을 자동으로 제안할 수 있습니다. 가져오기 온보딩에는 새로운 설정이 필요합니다. 온보딩 외부에서 시험 실행 계획, 백업 및 덮어쓰기 모드를 사용하려면 [마이그레이션](/ko/cli/migrate)을 사용하십시오.

## 관련 문서

- [CLI 참조](/ko/cli)
- [온보딩](/ko/cli/onboard)
- [온보딩(CLI)](/ko/start/wizard)
- [시작하기](/ko/start/getting-started)
- [설치 개요](/ko/install)
