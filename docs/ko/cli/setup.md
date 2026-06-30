---
read_when:
    - CLI 온보딩 마법사로 첫 실행 설정을 진행하고 있습니다
    - 기본 작업 영역 경로를 설정하려고 합니다
    - 스크립트에는 기준선 전용 설정 플래그가 필요합니다
summary: '`openclaw setup`에 대한 CLI 참조(온보딩의 별칭이며, 플래그로 기본 설정 사용 가능)'
title: 설정
x-i18n:
    generated_at: "2026-06-30T22:11:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

전체 CLI 온보딩 흐름을 실행합니다. `openclaw setup`은 `openclaw onboard`의 별칭입니다. 마법사 없이 설정/작업공간 폴더만 초기화하면 되는 경우 `--baseline`을 사용하세요.

<Note>
`openclaw setup`은 변경 가능한 설정 설치용입니다. Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 설정 파일이 Nix에서 관리되므로 OpenClaw가 설정 쓰기를 거부합니다. 일급 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start) 또는 다른 Nix 패키지에 해당하는 동등한 소스 설정을 사용하세요.
</Note>

## 옵션

| 플래그                     | 설명                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | 에이전트 작업공간 디렉터리(기본값 `~/.openclaw/workspace`; `agents.defaults.workspace`로 저장됨).              |
| `--baseline`               | 온보딩 없이 기본 설정/작업공간/세션 폴더를 만듭니다.                                                           |
| `--wizard`                 | 호환성을 위해 허용됩니다. 설정은 기본적으로 온보딩을 실행합니다.                                               |
| `--non-interactive`        | 프롬프트 없이 온보딩을 실행합니다.                                                                             |
| `--accept-risk`            | 전체 시스템 에이전트 접근 위험을 인정합니다. `--non-interactive`와 함께 필요합니다.                            |
| `--mode <mode>`            | 온보딩 모드: `local` 또는 `remote`.                                                                            |
| `--import-from <provider>` | 온보딩 중 실행할 마이그레이션 제공자입니다.                                                                    |
| `--import-source <path>`   | `--import-from`의 소스 에이전트 홈입니다.                                                                      |
| `--import-secrets`         | 온보딩 마이그레이션 중 지원되는 비밀을 가져옵니다.                                                            |
| `--remote-url <url>`       | 원격 Gateway WebSocket URL입니다.                                                                              |
| `--remote-token <token>`   | 원격 Gateway 토큰(선택 사항)입니다.                                                                            |

### 기본 모드

`openclaw setup --baseline`은 이전의 기본값 전용 동작을 보존합니다. 설정, 작업공간, 세션 디렉터리를 만든 다음 온보딩을 실행하지 않고 종료합니다.

## 예시

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## 참고

- 일반 `openclaw setup`은 `openclaw onboard`와 동일한 안내 여정을 실행합니다.
- 기본 설정 후에는 전체 안내 여정을 위해 `openclaw setup` 또는 `openclaw onboard`를 실행하고, 대상 변경에는 `openclaw configure`를, 채널 계정을 추가하려면 `openclaw channels add`를 실행하세요.
- Hermes 상태가 감지되면 대화형 온보딩에서 자동으로 마이그레이션을 제안할 수 있습니다. 가져오기 온보딩에는 새 설정이 필요합니다. 온보딩 밖에서 드라이런 계획, 백업, 덮어쓰기 모드를 사용하려면 [마이그레이션](/ko/cli/migrate)을 사용하세요.

## 관련

- [CLI 참조](/ko/cli)
- [온보딩(CLI)](/ko/start/wizard)
- [시작하기](/ko/start/getting-started)
- [설치 개요](/ko/install)
