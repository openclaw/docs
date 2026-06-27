---
read_when:
    - 빠르게 채널 상태와 최근 세션 수신자를 진단하려는 경우
    - 디버깅을 위해 붙여넣을 수 있는 "전체" 상태가 필요합니다
summary: '`openclaw status`에 대한 CLI 참조(진단, 프로브, 사용량 스냅샷)'
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:20:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

채널 및 세션 진단.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

참고:

- `--deep`는 라이브 프로브(WhatsApp Web + Telegram + Discord + Slack + Signal)를 실행합니다.
- 일반 `openclaw status`는 빠른 읽기 전용 경로를 유지하며, 메모리 검사를 건너뛸 때 메모리를 사용할 수 없음으로 표시하는 대신 `not checked`로 표시합니다. 무거운 보안 감사, plugin 호환성, 메모리 벡터 프로브는 `openclaw status --all`, `openclaw status --deep`, `openclaw security audit`, `openclaw memory status --deep`에 맡깁니다.
- `status --json --all`은 `plugins.slots.memory`가 선택한 활성 메모리 plugin 런타임의 메모리 세부 정보를 보고합니다. 사용자 지정 메모리 plugin은 기본 제공 `agents.defaults.memorySearch.enabled`를 비활성화한 상태에서도 자체 파일, 청크, 벡터, FTS 상태를 보고할 수 있습니다.
- `--usage`는 정규화된 공급자 사용량 창을 `X% left` 형식으로 출력합니다.
- 세션 상태 출력은 `Execution:`과 `Runtime:`을 분리합니다. `Execution`은 샌드박스 경로(`direct`, `docker/*`)이고, `Runtime`은 세션이 `OpenClaw Default`, `OpenAI Codex`, CLI 백엔드, 또는 `codex (acp/acpx)` 같은 ACP 백엔드 중 무엇을 사용하는지 알려줍니다. 공급자/모델/런타임의 차이는 [에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하세요.
- MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 남은 할당량이므로 OpenClaw는 표시 전에 이를 반전합니다. 개수 기반 필드가 있으면 우선합니다. `model_remains` 응답은 채팅 모델 항목을 우선하고, 필요하면 타임스탬프에서 창 레이블을 파생하며, 플랜 레이블에 모델 이름을 포함합니다.
- 현재 세션 스냅샷이 희소한 경우 `/status`는 가장 최근의 transcript 사용량 로그에서 토큰 및 캐시 카운터를 보충할 수 있습니다. 기존의 0이 아닌 라이브 값은 transcript fallback 값보다 계속 우선합니다.
- `/status`에는 간결한 Gateway 프로세스 uptime과 호스트 시스템 uptime이 포함됩니다.
- 라이브 세션 항목에 활성 런타임 모델 레이블이 없을 때 transcript fallback으로 이를 복구할 수도 있습니다. 해당 transcript 모델이 선택된 모델과 다르면, status는 선택된 모델 대신 복구된 런타임 모델을 기준으로 context window를 해석합니다.
- 세션이 구성된 기본 모델과 다른 모델에 고정되어 있으면 status는 두 값, 이유(`session override`), 명확한 힌트(`/model default`)를 모두 출력합니다. 구성된 기본 모델은 새 세션 또는 고정되지 않은 세션에 적용되며, 기존의 고정된 세션은 해제될 때까지 세션 선택을 유지합니다.
- 프롬프트 크기 산정에서 세션 메타데이터가 없거나 더 작으면 transcript fallback은 프롬프트 중심의 더 큰 합계를 우선하므로, 사용자 지정 공급자 세션이 `0` 토큰 표시로 축소되지 않습니다.
- 여러 에이전트가 구성된 경우 출력에는 에이전트별 세션 저장소가 포함됩니다.
- 개요에는 사용 가능한 경우 Gateway + Node 호스트 서비스 설치/런타임 상태가 포함됩니다.
- 개요에는 업데이트 채널 + git SHA(소스 checkout의 경우)가 포함됩니다.
- 업데이트 정보는 개요에 표시됩니다. 업데이트가 있으면 status는 `openclaw update` 실행 힌트를 출력합니다([업데이트](/ko/install/updating) 참조).
- 모델 가격 정보 새로 고침 실패는 선택적 가격 정보 경고로 표시됩니다. 이는
  Gateway 또는 채널이 비정상이라는 뜻이 아닙니다.
- 읽기 전용 status 표면(`status`, `status --json`, `status --all`)은 가능할 때 대상 config 경로에 대해 지원되는 SecretRef를 해석합니다.
- 지원되는 채널 SecretRef가 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우, status는 읽기 전용 상태를 유지하고 충돌하는 대신 성능 저하된 출력을 보고합니다. 사람이 읽는 출력에는 "configured token unavailable in this command path" 같은 경고가 표시되고, JSON 출력에는 `secretDiagnostics`가 포함됩니다.
- 명령 로컬 SecretRef 해석이 성공하면 status는 해석된 스냅샷을 우선하고 최종 출력에서 일시적인 "secret unavailable" 채널 표시를 제거합니다.
- `status --all`에는 Secrets 개요 행과, 보고서 생성을 중단하지 않고 secret diagnostics를 요약하는 진단 섹션(가독성을 위해 잘림)이 포함됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Doctor](/ko/gateway/doctor)
