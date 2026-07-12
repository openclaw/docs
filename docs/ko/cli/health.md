---
read_when:
    - 실행 중인 Gateway의 상태를 빠르게 확인하려고 합니다
summary: '`openclaw health`에 대한 CLI 참고 자료(RPC를 통한 Gateway 상태 스냅샷)'
title: 상태
x-i18n:
    generated_at: "2026-07-12T15:05:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

WebSocket RPC를 통해 실행 중인 Gateway에서 상태 스냅샷을 가져옵니다(CLI에서 채널 소켓에 직접 연결하지 않음).

## 옵션

| 플래그           | 기본값  | 설명                                                                                  |
| ---------------- | ------- | ------------------------------------------------------------------------------------- |
| `--json`         | `false` | 텍스트 대신 머신 리더블 JSON을 출력합니다.                                            |
| `--timeout <ms>` | `10000` | 연결 제한 시간(밀리초)입니다.                                                         |
| `--verbose`      | `false` | 실시간 프로브를 강제하고 구성된 모든 계정과 에이전트에 대한 출력을 확장합니다.        |
| `--debug`        | `false` | `--verbose`의 별칭입니다.                                                             |

예시:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## 동작

- `--verbose`를 사용하지 않으면 Gateway는 캐시된 스냅샷(최대 60초 동안 유효하며 실시간 채널 런타임 상태와 동일함)을 반환하고 다음 호출자를 위해 백그라운드에서 새로 고칠 수 있습니다.
- `--verbose`는 실시간 프로브(채널별 계정 프로브)를 강제하고 Gateway 연결 세부 정보를 출력하며, 기본 에이전트만 표시하는 대신 구성된 모든 계정과 에이전트에 대한 사람이 읽을 수 있는 출력을 확장합니다.
- `--json`은 항상 전체 스냅샷을 반환합니다. 여기에는 채널, 계정별 프로브, Plugin 로드 상태, 컨텍스트 엔진 격리 상태, 모델 가격 캐시 상태, 이벤트 루프 상태, 에이전트별 세션 저장소가 포함됩니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [`openclaw status`](/ko/cli/status) — 전체 상태 스냅샷 없이 로컬 진단 및 채널 프로브 수행
- [Gateway 상태](/ko/gateway/health)
