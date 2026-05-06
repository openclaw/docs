---
read_when:
    - 실행 중인 Gateway의 상태를 빠르게 확인하려는 경우
summary: '`openclaw health`에 대한 CLI 참조(RPC를 통한 Gateway 상태 스냅샷)'
title: 상태
x-i18n:
    generated_at: "2026-05-06T09:02:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

실행 중인 Gateway에서 상태를 가져옵니다.

옵션:

- `--json`: 기계 판독 가능 출력
- `--timeout <ms>`: 밀리초 단위의 연결 시간 제한(기본값 `10000`)
- `--verbose`: 자세한 로깅
- `--debug`: `--verbose`의 별칭

예시:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

참고:

- 기본 `openclaw health`는 실행 중인 Gateway에 상태 스냅샷을 요청합니다. Gateway에 이미 최신 캐시된 스냅샷이 있으면, 해당 캐시된 페이로드를 반환하고 백그라운드에서 새로 고칠 수 있습니다.
- `--verbose`는 실시간 프로브를 강제하고, Gateway 연결 세부 정보를 출력하며, 구성된 모든 계정과 에이전트에 대해 사람이 읽을 수 있는 출력을 확장합니다.
- 여러 에이전트가 구성된 경우 출력에는 에이전트별 세션 저장소가 포함됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Gateway 상태](/ko/gateway/health)
