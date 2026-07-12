---
read_when:
    - CLI 온보딩 마법사를 사용하여 최초 실행 설정을 진행하고 있습니다.
    - 기본 작업 공간 경로를 설정하려고 합니다
    - 스크립트에는 기준선 전용 설정 플래그가 필요합니다
summary: '`openclaw setup`의 CLI 참조(온보딩의 별칭이며, 플래그로 기본 설정 사용 가능)'
title: 설정
x-i18n:
    generated_at: "2026-07-12T00:39:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup`은 `openclaw onboard`와 동일한 안내형 온보딩 흐름을 실행합니다.
먼저 추론 구성을 확인하고 저장한 다음, Crestodian을 시작하여
작업 공간, Gateway, 채널, Skills 및 상태를 구성합니다. 마법사 없이
구성/작업 공간 폴더만 초기화하려면 `--baseline`을 사용하세요.

안내형 모드에서 `--workspace <dir>`은 Crestodian에 제안되는 작업 공간이며,
해당 제안을 승인한 후에만 저장됩니다. 기준선, 클래식 및
비대화형 설정에서는 제공된 작업 공간을 각자의 일반적인 흐름을 통해 저장합니다.

`setup`은 인증(`--auth-choice`, `--token`, 공급자 키 플래그), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale(`--tailscale`), 초기화(`--reset`, `--reset-scope`), 흐름
(`--flow quickstart|advanced|manual|import`) 및 건너뛰기 플래그
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`)를 포함하여 `openclaw onboard`와
동일한 온보딩 플래그를 허용합니다. 전체 플래그 참조와 비대화형 예시는
[온보딩](/ko/cli/onboard) 및 [CLI 자동화](/ko/start/wizard-cli-automation)를 참조하세요.
`openclaw onboard --modern`은 추론 구성을 필수로 확인하는 Crestodian 도우미의
호환성 별칭이며, 이에 해당하는 `setup` 옵션은 없습니다.

<Note>
`openclaw setup`은 변경 가능한 구성 설치용입니다. Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 구성 파일이 Nix에 의해 관리되므로 OpenClaw가 설정 쓰기를 거부합니다. 공식 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start) 또는 다른 Nix 패키지의 동등한 소스 구성을 사용하세요.
</Note>

## 옵션

| 플래그                     | 설명                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 안내형 모드의 작업 공간 제안입니다. 기준선, 클래식 및 비대화형 설정에서는 직접 저장됩니다.            |
| `--baseline`               | 온보딩 없이 기준선 구성/작업 공간/세션 폴더를 생성합니다.                                             |
| `--wizard`                 | 호환성을 위해 허용됩니다. 설정은 기본적으로 온보딩을 실행합니다.                                      |
| `--non-interactive`        | 프롬프트 없이 온보딩을 실행합니다.                                                                    |
| `--accept-risk`            | 에이전트의 전체 시스템 접근 위험을 인지합니다. `--non-interactive`와 함께 사용해야 합니다.            |
| `--mode <mode>`            | 온보딩 모드: `local` 또는 `remote`.                                                                   |
| `--flow <flow>`            | 온보딩 흐름: `quickstart`, `advanced`, `manual` 또는 `import`.                                        |
| `--reset`                  | 온보딩 전에 구성 + 자격 증명 + 세션을 초기화합니다(`--reset-scope full`을 사용한 경우에만 작업 공간 포함). |
| `--reset-scope <scope>`    | 초기화 범위: `config`, `config+creds+sessions` 또는 `full`.                                           |
| `--import-from <provider>` | 온보딩 중 실행할 마이그레이션 공급자입니다.                                                           |
| `--import-source <path>`   | `--import-from`에 사용할 원본 에이전트 홈입니다.                                                      |
| `--import-secrets`         | 온보딩 마이그레이션 중 지원되는 비밀 정보를 가져옵니다.                                               |
| `--remote-url <url>`       | 원격 Gateway WebSocket URL입니다.                                                                     |
| `--remote-token <token>`   | 원격 Gateway 토큰입니다(선택 사항).                                                                   |
| `--json`                   | JSON 요약을 출력합니다.                                                                               |

`--classic`과 `--non-interactive`는 함께 사용할 수 없습니다. 클래식은
프롬프트가 있는 마법사를 여는 반면, 비대화형 설정은 자동화 경로를 사용합니다.

### 기준선 모드

`openclaw setup --baseline`은 이전의 기준선 전용 동작을 유지합니다.
구성, 작업 공간 및 세션 디렉터리를 만든 다음 온보딩을 실행하지 않고
종료합니다.

## 예시

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 참고

- 기준선 설정 후 전체 안내 과정을 진행하려면 `openclaw setup` 또는 `openclaw onboard`를 실행하고, 특정 항목만 변경하려면 `openclaw configure`를 실행하거나, 채널 계정을 추가하려면 `openclaw channels add`를 실행하세요.
- Hermes 상태가 감지되면 대화형 온보딩에서 마이그레이션을 자동으로 제안할 수 있습니다. 가져오기 온보딩에는 새로운 설정이 필요합니다. 온보딩 외부에서 시험 실행 계획, 백업 및 덮어쓰기 모드를 사용하려면 [마이그레이션](/ko/cli/migrate)을 사용하세요.

## 관련 문서

- [CLI 참조](/ko/cli)
- [온보딩](/ko/cli/onboard)
- [온보딩(CLI)](/ko/start/wizard)
- [시작하기](/ko/start/getting-started)
- [설치 개요](/ko/install)
