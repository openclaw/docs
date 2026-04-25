---
read_when:
    - 채널 상태와 최근 세션 수신자에 대한 빠른 진단이 필요한 경우
    - 디버깅을 위한 붙여넣기 가능한 “all” 상태가 필요한 경우
summary: '`openclaw status`용 CLI 참조(진단, 프로브, 사용량 스냅샷)'
title: 상태
x-i18n:
    generated_at: "2026-04-25T05:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

채널 + 세션 진단.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

참고:

- `--deep`는 라이브 프로브를 실행합니다(WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage`는 정규화된 provider 사용량 창을 `X% 남음` 형식으로 출력합니다.
- 세션 상태 출력은 `Execution:`과 `Runtime:`을 분리해서 표시합니다. `Execution`은 샌드박스 경로(`direct`, `docker/*`)이고, `Runtime`은 세션이 `OpenClaw Pi Default`, `OpenAI Codex`, CLI 백엔드, 또는 `codex (acp/acpx)` 같은 ACP 백엔드를 사용 중인지 알려줍니다. provider/model/runtime 구분은 [에이전트 런타임](/ko/concepts/agent-runtimes)을 참고하세요.
- MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 남은 할당량이므로, OpenClaw는 표시 전에 이를 반전합니다. count 기반 필드가 있으면 그것이 우선합니다. `model_remains` 응답은 chat-model 항목을 우선하며, 필요하면 타임스탬프에서 창 레이블을 유도하고, 플랜 레이블에 모델 이름을 포함합니다.
- 현재 세션 스냅샷이 희소한 경우 `/status`는 가장 최근 transcript 사용량 로그에서 토큰 및 캐시 카운터를 보강할 수 있습니다. 기존의 0이 아닌 라이브 값은 여전히 transcript 대체 값보다 우선합니다.
- transcript 대체는 라이브 세션 항목에 활성 런타임 모델 레이블이 없을 때 이를 복구할 수도 있습니다. 해당 transcript 모델이 선택된 모델과 다르면, status는 선택된 모델 대신 복구된 런타임 모델을 기준으로 컨텍스트 창을 해석합니다.
- 프롬프트 크기 계산의 경우, 세션 메타데이터가 없거나 더 작으면 transcript 대체는 더 큰 프롬프트 지향 총합을 우선하므로 custom-provider 세션이 `0` 토큰 표시로 축소되지 않습니다.
- 여러 에이전트가 구성된 경우 출력에는 에이전트별 세션 저장소가 포함됩니다.
- 가능한 경우 개요에는 Gateway + Node 호스트 서비스 설치/런타임 상태가 포함됩니다.
- 개요에는 업데이트 채널 + git SHA(소스 체크아웃용)가 포함됩니다.
- 업데이트 정보는 개요에 표시되며, 업데이트가 उपलब्ध하면 status는 `openclaw update` 실행 힌트를 출력합니다([업데이트](/ko/install/updating) 참고).
- 읽기 전용 status 표면(`status`, `status --json`, `status --all`)은 가능한 경우 대상 구성 경로에 대해 지원되는 SecretRef를 해석합니다.
- 지원되는 채널 SecretRef가 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우, status는 읽기 전용을 유지하고 충돌하지 않고 성능 저하된 출력을 보고합니다. 사람이 읽는 출력에는 “이 명령 경로에서 구성된 토큰을 사용할 수 없음” 같은 경고가 표시되고, JSON 출력에는 `secretDiagnostics`가 포함됩니다.
- 명령 로컬 SecretRef 해석에 성공하면, status는 해석된 스냅샷을 우선 사용하고 최종 출력에서 일시적인 “secret unavailable” 채널 마커를 제거합니다.
- `status --all`에는 Secrets 개요 행과, 보고서 생성을 중단하지 않고 secret 진단을 요약하는 진단 섹션(가독성을 위해 잘림)이 포함됩니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [Doctor](/ko/gateway/doctor)
