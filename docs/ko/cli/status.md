---
read_when:
    - 채널 상태와 최근 세션 수신자를 빠르게 진단하려는 경우
    - 디버깅을 위해 붙여넣을 수 있는 "all" 상태 정보가 필요합니다
summary: '`openclaw status`의 CLI 참조(진단, 프로브, 사용량 스냅샷)'
title: openclaw 상태
x-i18n:
    generated_at: "2026-07-12T15:08:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

채널 + 세션 진단입니다.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| 플래그                  | 설명                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | 전체 진단을 수행합니다(읽기 전용, 붙여넣기 가능). 보안 감사, Plugin 호환성 및 메모리 벡터 검사를 포함합니다.                 |
| `--deep`                | 실시간 검사(WhatsApp Web + Telegram + Discord + Slack + Signal)를 실행합니다. 보안 감사도 활성화합니다.                     |
| `--usage`               | 정규화된 제공자 사용량 기간을 `X% left` 형식으로 출력합니다.                                                                 |
| `--json`                | 머신 판독 가능한 출력입니다.                                                                                                |
| `--verbose` / `--debug` | 보고서보다 먼저 원시 Gateway 대상 확인 결과도 출력합니다.                                                                   |

일반 `openclaw status`는 빠른 읽기 전용 경로를 유지하며, 메모리 검사를
건너뛸 때 메모리를 사용할 수 없음으로 표시하는 대신 `not checked`로
표시합니다. 무거운 보안 감사, Plugin 호환성 및 메모리 벡터 검사는
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`,
`openclaw memory status --deep`에서 수행합니다.

## 세션 및 모델 확인

- 세션 상태 출력은 `Execution:`과 `Runtime:`을 구분합니다. `Execution`
  은 샌드박스 경로(`direct`, `docker/*`)이고, `Runtime`은 세션이
  `OpenClaw Default`, `OpenAI Codex`, CLI 백엔드 또는 `codex (acp/acpx)`와
  같은 ACP 백엔드 중 무엇을 사용하는지 알려 줍니다. 제공자/모델/런타임의
  차이점은 [에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하십시오.
- 현재 세션 스냅샷에 정보가 부족하면 `/status`는 가장 최근의 트랜스크립트
  사용량 로그에서 토큰 및 캐시 카운터를 보완할 수 있습니다. 기존의 0이 아닌
  실시간 값은 계속 트랜스크립트 대체 값보다 우선합니다.
- 실시간 세션 항목에 활성 런타임 모델 레이블이 없으면 트랜스크립트 대체를 통해
  복구할 수도 있습니다. 해당 트랜스크립트 모델이 선택된 모델과 다르면 상태는
  선택된 모델 대신 복구된 런타임 모델을 기준으로 컨텍스트 창을 확인합니다.
- 프롬프트 크기를 계산할 때 세션 메타데이터가 없거나 더 작으면 트랜스크립트
  대체는 프롬프트 지향 합계 중 더 큰 값을 우선하므로, 사용자 지정 제공자
  세션의 토큰 표시가 `0`으로 축소되지 않습니다.
- 세션이 구성된 기본 모델과 다른 모델로 고정된 경우 상태는 두 값을 모두
  출력하고, 이유(`session override`)와 힌트 `/model default`를 표시합니다.
  구성된 기본 모델은 새 세션 또는 고정되지 않은 세션에 적용되며, 기존의
  고정된 세션은 선택이 해제될 때까지 해당 세션의 선택을 유지합니다.
- 여러 에이전트가 구성된 경우 출력에 에이전트별 세션 저장소가 포함됩니다.

## 사용량 및 할당량

- `--usage`는 정규화된 제공자 사용량 기간을 `X% left` 형식으로 출력합니다.
- MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 남은 할당량을
  나타내므로 OpenClaw는 표시하기 전에 이를 반전합니다. 개수 기반 필드가
  있으면 해당 필드가 우선합니다. `model_remains` 응답은 채팅 모델 항목을
  우선하고, 필요한 경우 타임스탬프에서 기간 레이블을 도출하며, 요금제
  레이블에 모델 이름을 포함합니다.
- 모델 가격 갱신 실패는 선택적 가격 경고로 표시됩니다.
  이는 Gateway 또는 채널이 비정상임을 의미하지 않습니다.

## 개요 및 업데이트 상태

- 개요에는 가능한 경우 Gateway + Node 호스트 서비스의 설치/런타임 상태와
  간략한 Gateway 프로세스 가동 시간 및 호스트 시스템 가동 시간이 포함됩니다.
- 개요에는 업데이트 채널 + git SHA(소스 체크아웃의 경우)가 포함됩니다.
- 업데이트 정보는 개요에 표시됩니다. 업데이트가 있으면 상태는
  `openclaw update` 실행 힌트를 출력합니다([업데이트](/ko/install/updating) 참조).

## 시크릿

- 읽기 전용 상태 표면(`status`, `status --json`, `status --all`)은 가능한 경우
  대상 구성 경로에 대해 지원되는 SecretRef를 확인합니다.
- 지원되는 채널 SecretRef가 구성되어 있지만 현재 명령 경로에서 사용할 수 없는
  경우 상태는 읽기 전용을 유지하며 충돌하는 대신 성능 저하 출력을 보고합니다.
  사람이 읽을 수 있는 출력에는 "이 명령 경로에서 구성된 토큰을 사용할 수 없음"과
  같은 경고가 표시되고, JSON 출력에는 `secretDiagnostics`가 포함됩니다.
- 명령 로컬 SecretRef 확인에 성공하면 상태는 확인된 스냅샷을 우선하며 최종
  출력에서 일시적인 "시크릿을 사용할 수 없음" 채널 표시를 제거합니다.
- `status --all`에는 시크릿 개요 행과 보고서 생성을 중단하지 않고 시크릿
  진단을 요약하는 진단 섹션이 포함됩니다(가독성을 위해 일부 생략됨).

## 메모리

`status --json --all`은 `plugins.slots.memory`에서 선택한 활성 메모리 Plugin
런타임의 메모리 세부 정보를 보고합니다. 사용자 지정 메모리 Plugin은 기본 제공
`agents.defaults.memorySearch.enabled`를 비활성화된 상태로 두고도 자체 파일,
청크, 벡터 및 FTS 상태를 보고할 수 있습니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Doctor](/ko/gateway/doctor)
