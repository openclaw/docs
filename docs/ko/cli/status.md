---
read_when:
    - 채널 상태 + 최근 세션 수신자를 빠르게 진단하려는 경우
    - 디버깅을 위해 붙여넣을 수 있는 “전체” 상태가 필요한 경우
summary: '`openclaw status`에 대한 CLI 참조(진단, 프로브, 사용량 스냅샷)'
title: 상태
x-i18n:
    generated_at: "2026-05-05T06:06:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

채널 + 세션에 대한 진단입니다.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

참고:

- `--deep`은 라이브 프로브(WhatsApp Web + Telegram + Discord + Slack + Signal)를 실행합니다.
- 일반 `openclaw status`는 빠른 읽기 전용 경로를 유지하며, 메모리 검사를 건너뛸 때 메모리를 사용할 수 없음이 아니라 `not checked`로 표시합니다. 무거운 보안 감사, Plugin 호환성, 메모리 벡터 프로브는 `openclaw status --all`, `openclaw status --deep`, `openclaw security audit`, `openclaw memory status --deep`에 맡깁니다.
- `status --json --all`은 `plugins.slots.memory`가 선택한 활성 메모리 Plugin 런타임의 메모리 세부 정보를 보고합니다. 사용자 지정 메모리 Plugin은 기본 제공 `agents.defaults.memorySearch.enabled`를 비활성화한 상태에서도 자체 파일, 청크, 벡터, FTS 상태를 보고할 수 있습니다.
- `--usage`는 정규화된 제공자 사용량 기간을 `X% left` 형식으로 출력합니다.
- 세션 상태 출력은 `Execution:`과 `Runtime:`을 분리합니다. `Execution`은 샌드박스 경로(`direct`, `docker/*`)이며, `Runtime`은 세션이 `OpenClaw Pi Default`, `OpenAI Codex`, CLI 백엔드, 또는 `codex (acp/acpx)` 같은 ACP 백엔드 중 무엇을 사용하는지 알려줍니다. 제공자/모델/런타임의 차이는 [에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하세요.
- MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 남은 할당량이므로 OpenClaw는 표시 전에 이를 반전합니다. 카운트 기반 필드가 있으면 우선합니다. `model_remains` 응답은 채팅 모델 항목을 우선하며, 필요할 때 타임스탬프에서 기간 레이블을 파생하고, 요금제 레이블에 모델 이름을 포함합니다.
- 현재 세션 스냅샷이 희소한 경우 `/status`는 가장 최근 트랜스크립트 사용량 로그에서 토큰 및 캐시 카운터를 보강할 수 있습니다. 기존의 0이 아닌 라이브 값은 여전히 트랜스크립트 대체 값보다 우선합니다.
- `/status`에는 간결한 Gateway 프로세스 가동 시간과 호스트 시스템 가동 시간이 포함됩니다.
- 라이브 세션 항목에 활성 런타임 모델 레이블이 없을 때 트랜스크립트 대체로 이를 복구할 수도 있습니다. 해당 트랜스크립트 모델이 선택된 모델과 다르면, 상태는 선택된 모델 대신 복구된 런타임 모델을 기준으로 컨텍스트 창을 해석합니다.
- 프롬프트 크기 계산에서 트랜스크립트 대체는 세션 메타데이터가 없거나 더 작을 때 더 큰 프롬프트 중심 합계를 우선하므로, 사용자 지정 제공자 세션이 `0` 토큰 표시로 축소되지 않습니다.
- 여러 에이전트가 구성된 경우 출력에는 에이전트별 세션 저장소가 포함됩니다.
- 사용 가능한 경우 개요에는 Gateway + Node 호스트 서비스 설치/런타임 상태가 포함됩니다.
- 개요에는 업데이트 채널 + git SHA(소스 체크아웃의 경우)가 포함됩니다.
- 업데이트 정보는 개요에 표시됩니다. 업데이트가 있으면 상태는 `openclaw update` 실행 힌트를 출력합니다([업데이트](/ko/install/updating) 참조).
- 읽기 전용 상태 표면(`status`, `status --json`, `status --all`)은 가능할 때 대상 구성 경로에 대해 지원되는 SecretRef를 해석합니다.
- 지원되는 채널 SecretRef가 구성되었지만 현재 명령 경로에서 사용할 수 없는 경우, 상태는 읽기 전용을 유지하고 충돌 대신 저하된 출력을 보고합니다. 사람이 읽는 출력에는 “configured token unavailable in this command path” 같은 경고가 표시되며, JSON 출력에는 `secretDiagnostics`가 포함됩니다.
- 명령 로컬 SecretRef 해석이 성공하면, 상태는 해석된 스냅샷을 우선하고 최종 출력에서 일시적인 “secret unavailable” 채널 표시를 지웁니다.
- `status --all`에는 Secrets 개요 행과 보고서 생성을 중단하지 않고 비밀 진단을 요약하는 진단 섹션(가독성을 위해 잘림)이 포함됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [진단 도구](/ko/gateway/doctor)
