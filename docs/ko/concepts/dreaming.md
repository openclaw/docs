---
read_when:
    - 메모리 승격이 자동으로 실행되도록 설정하려는 경우
    - 각 Dreaming 단계가 무엇을 하는지 이해하려고 합니다
    - MEMORY.md를 오염시키지 않고 통합을 조정하려는 경우
sidebarTitle: Dreaming
summary: 얕은 수면, 깊은 수면, REM 단계와 꿈 일기를 포함한 백그라운드 메모리 통합
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T13:54:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다. OpenClaw가 강한 단기 신호를 내구성 있는 메모리로 옮기는 동시에 프로세스를 설명 가능하고 검토 가능하게 유지하도록 돕습니다.

<Note>
Dreaming은 **선택 사항**이며 기본적으로 비활성화되어 있습니다.
</Note>

## Dreaming이 쓰는 것

Dreaming은 두 종류의 출력을 유지합니다.

- `memory/.dreams/`의 **머신 상태**(리콜 저장소, 단계 신호, 수집 체크포인트, 잠금).
- `DREAMS.md`(또는 기존 `dreams.md`)의 **사람이 읽을 수 있는 출력** 및 `memory/dreaming/<phase>/YYYY-MM-DD.md` 아래의 선택적 단계 보고서 파일.

장기 승격은 여전히 `MEMORY.md`에만 씁니다.

## 단계 모델

Dreaming은 세 가지 협력 단계를 사용합니다.

| 단계 | 목적 | 내구성 쓰기 |
| ----- | ----------------------------------------- | ----------------- |
| Light | 최근 단기 자료를 정렬하고 스테이징 | 아니요 |
| Deep | 내구성 있는 후보를 점수화하고 승격 | 예(`MEMORY.md`) |
| REM | 주제와 반복되는 아이디어를 성찰 | 아니요 |

이 단계들은 내부 구현 세부 사항이며, 사용자가 별도로 구성하는 "모드"가 아닙니다.

<AccordionGroup>
  <Accordion title="Light 단계">
    Light 단계는 최근 일일 메모리 신호와 리콜 추적을 수집하고, 중복을 제거하며, 후보 줄을 스테이징합니다.

    - 사용 가능한 경우 단기 리콜 상태, 최근 일일 메모리 파일, 수정된 세션 트랜스크립트에서 읽습니다.
    - 저장소에 인라인 출력이 포함된 경우 관리되는 `## Light Sleep` 블록을 씁니다.
    - 나중의 Deep 순위를 위해 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 쓰지 않습니다.

  </Accordion>
  <Accordion title="Deep 단계">
    Deep 단계는 무엇이 장기 메모리가 될지 결정합니다.

    - 가중 점수화와 임계값 게이트를 사용해 후보의 순위를 매깁니다.
    - 통과하려면 `minScore`, `minRecallCount`, `minUniqueQueries`가 필요합니다.
    - 쓰기 전에 라이브 일일 파일에서 스니펫을 다시 수화하므로 오래되었거나 삭제된 스니펫은 건너뜁니다.
    - 승격된 항목을 `MEMORY.md`에 추가합니다.
    - `DREAMS.md`에 `## Deep Sleep` 요약을 쓰고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`를 씁니다.

  </Accordion>
  <Accordion title="REM 단계">
    REM 단계는 패턴과 성찰 신호를 추출합니다.

    - 최근 단기 추적에서 주제 및 성찰 요약을 만듭니다.
    - 저장소에 인라인 출력이 포함된 경우 관리되는 `## REM Sleep` 블록을 씁니다.
    - Deep 순위에서 사용하는 REM 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 쓰지 않습니다.

  </Accordion>
</AccordionGroup>

## 세션 트랜스크립트 수집

Dreaming은 수정된 세션 트랜스크립트를 Dreaming 코퍼스로 수집할 수 있습니다. 트랜스크립트가 있으면 일일 메모리 신호 및 리콜 추적과 함께 Light 단계에 제공됩니다. 개인적이고 민감한 내용은 수집 전에 수정됩니다.

## Dream Diary

Dreaming은 `DREAMS.md`에 서술형 **Dream Diary**도 유지합니다. 각 단계에 충분한 자료가 쌓이면 `memory-core`가 최선 노력 방식의 백그라운드 서브에이전트 턴을 실행하고 짧은 일기 항목을 추가합니다. `dreaming.model`이 구성되어 있지 않으면 기본 런타임 모델을 사용합니다. 구성된 모델을 사용할 수 없으면 Dream Diary는 세션 기본 모델로 한 번 다시 시도합니다.

<Note>
이 일기는 Dreams UI에서 사람이 읽기 위한 것이며, 승격 소스가 아닙니다. Dreaming이 생성한 일기/보고서 아티팩트는 단기 승격에서 제외됩니다. 근거가 있는 메모리 스니펫만 `MEMORY.md`로 승격될 수 있습니다.
</Note>

검토 및 복구 작업을 위한 근거 기반 과거 백필 레인도 있습니다.

<AccordionGroup>
  <Accordion title="백필 명령">
    - `memory rem-harness --path ... --grounded`는 과거 `YYYY-MM-DD.md` 노트에서 근거 기반 일기 출력을 미리 봅니다.
    - `memory rem-backfill --path ...`는 되돌릴 수 있는 근거 기반 일기 항목을 `DREAMS.md`에 씁니다.
    - `memory rem-backfill --path ... --stage-short-term`은 근거 기반 내구성 후보를 일반 Deep 단계가 이미 사용하는 동일한 단기 증거 저장소에 스테이징합니다.
    - `memory rem-backfill --rollback` 및 `--rollback-short-term`은 일반 일기 항목이나 라이브 단기 리콜을 건드리지 않고 해당 스테이징된 백필 아티팩트를 제거합니다.

  </Accordion>
</AccordionGroup>

Control UI는 동일한 일기 백필/재설정 흐름을 제공하므로, 근거 기반 후보가 승격할 가치가 있는지 결정하기 전에 Dreams 장면에서 결과를 살펴볼 수 있습니다. Scene에는 별도의 근거 기반 레인도 표시되어, 어떤 스테이징된 단기 항목이 과거 리플레이에서 왔는지, 어떤 승격 항목이 근거 기반으로 주도되었는지 확인하고, 일반 라이브 단기 상태를 건드리지 않고 근거 기반 전용 스테이징 항목만 지울 수 있습니다.

## Deep 순위 신호

Deep 순위는 여섯 가지 가중 기본 신호와 단계 강화를 사용합니다.

| 신호 | 가중치 | 설명 |
| ------------------- | ------ | ------------------------------------------------- |
| 빈도 | 0.24 | 항목이 축적한 단기 신호 수 |
| 관련성 | 0.30 | 항목에 대한 평균 검색 품질 |
| 쿼리 다양성 | 0.15 | 해당 항목을 드러낸 고유한 쿼리/일 컨텍스트 |
| 최신성 | 0.15 | 시간 감쇠가 적용된 신선도 점수 |
| 통합 | 0.10 | 여러 날에 걸친 반복 강도 |
| 개념적 풍부함 | 0.06 | 스니펫/경로의 개념 태그 밀도 |

Light 및 REM 단계 히트는 `memory/.dreams/phase-signals.json`에서 작은 최신성 감쇠 부스트를 추가합니다.

섀도 트라이얼 결과는 내구성 쓰기 전에 검토 신호로 해당 기본 점수 위에 계층화될 수 있습니다. 도움이 되는 트라이얼은 후보에 작고 제한된 부스트를 주고, 중립 트라이얼은 후보를 보류 상태로 유지하며, 해로운 트라이얼은 해당 점수화 패스에서 거부된 것으로 표시합니다. 이 신호는 여전히 보고서 전용입니다. 후보 순서나 검토 메타데이터를 바꿀 수는 있지만, `MEMORY.md`에 쓰거나 후보를 단독으로 승격하지는 않습니다.

## QA 섀도 트라이얼 보고서 범위

QA Lab에는 향후 Dreaming 섀도 트라이얼이 승격 전에 후보 메모리를 어떻게 검토할 수 있는지 살펴보기 위한 보고서 전용 시나리오가 포함되어 있습니다. 이 시나리오는 에이전트에게 기준 답변과 후보 메모리를 사용할 수 있는 답변을 비교한 다음, 판정, 이유, 위험 플래그가 포함된 로컬 보고서를 쓰도록 요청합니다.

이 범위는 의도적으로 QA에 한정됩니다. 보고서 아티팩트가 `MEMORY.md`와 분리되어 유지되고, 에이전트가 후보가 승격되었다고 주장하지 않는지 검증합니다. 프로덕션 섀도 트라이얼 동작을 추가하거나 Deep 단계 승격 엔진을 변경하지 않습니다.

`memory-core` 섀도 트라이얼 러너는 안정적인 아티팩트가 필요한 코드 경로에 대해 동일한 보고서 전용 계약을 유지합니다. 후보, 트라이얼 프롬프트, 기준 결과, 후보 결과, 판정, 이유, 위험 플래그, 증거 참조를 받은 다음 `promotion action: report-only`가 포함된 보고서를 씁니다. 도움이 되는 판정은 `promote` 권장 사항에 매핑되고, 중립 판정은 `defer`에 매핑되며, 해로운 판정은 `reject`에 매핑됩니다. 이러한 권장 사항 중 어느 것도 `MEMORY.md`에 쓰거나 Deep 단계 승격을 적용하지 않습니다.

## 예약

활성화되면 `memory-core`가 전체 Dreaming 스윕을 위한 Cron 작업 하나를 자동으로 관리합니다. 각 스윕은 light → REM → deep 순서로 단계를 실행합니다.

스윕에는 기본 런타임 작업공간과 구성된 모든 에이전트 작업공간이 포함되며, 경로 기준으로 중복 제거됩니다. 따라서 서브에이전트 작업공간 팬아웃이 기본 에이전트의 `DREAMS.md` 및 메모리 상태를 제외하지 않습니다.

기본 주기 동작:

| 설정 | 기본값 |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *` |
| `dreaming.model` | 기본 모델 |

## 빠른 시작

<Tabs>
  <Tab title="Dreaming 활성화">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="사용자 지정 스윕 주기">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## 슬래시 명령

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` 및 `/dreaming off`는 Gateway 전체 구성을 변경합니다. 채널 호출자는 소유자여야 하며, Gateway 클라이언트에는 `operator.admin`이 있어야 합니다. `/dreaming status` 및 `/dreaming help`는 읽기 전용으로 유지됩니다.

## CLI 워크플로

<Tabs>
  <Tab title="승격 미리보기 / 적용">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    수동 `memory promote`는 CLI 플래그로 재정의하지 않는 한 기본적으로 Deep 단계 임계값을 사용합니다.

  </Tab>
  <Tab title="승격 설명">
    특정 후보가 승격되거나 승격되지 않는 이유를 설명합니다.

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM 하네스 미리보기">
    아무것도 쓰지 않고 REM 성찰, 후보 진실, Deep 승격 출력을 미리 봅니다.

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 주요 기본값

모든 설정은 `plugins.entries.memory-core.config.dreaming` 아래에 있습니다.

<ParamField path="enabled" type="boolean" default="false">
  Dreaming 스윕을 활성화하거나 비활성화합니다.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  전체 Dreaming 스윕의 Cron 주기입니다.
</ParamField>
<ParamField path="model" type="string">
  선택적 Dream Diary 서브에이전트 모델 재정의입니다. 서브에이전트 `allowedModels` 허용 목록도 설정하는 경우 표준 `provider/model` 값을 사용하세요.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md`로 승격되는 각 단기 리콜 스니펫에서 유지할 최대 예상 토큰 수입니다. 순위 출처는 계속 표시됩니다.
</ParamField>

<Warning>
`dreaming.model`에는 `plugins.entries.memory-core.subagent.allowModelOverride: true`가 필요합니다. 이를 제한하려면 `plugins.entries.memory-core.subagent.allowedModels`도 설정하세요. 신뢰 또는 허용 목록 실패는 조용히 대체되지 않고 계속 표시됩니다. 재시도는 모델을 사용할 수 없는 오류에만 적용됩니다.
</Warning>

<Note>
대부분의 단계 정책, 임계값, 저장소 동작은 내부 구현 세부 사항입니다. 전체 키 목록은 [메모리 구성 참조](/ko/reference/memory-config#dreaming)를 참고하세요.
</Note>

## Dreams UI

활성화되면 Gateway **Dreams** 탭에 다음이 표시됩니다.

- 현재 Dreaming 활성화 상태
- 단계 수준 상태 및 관리형 스윕 존재 여부
- 단기, 근거 기반, 신호, 오늘 승격된 항목 수
- 다음 예약 실행 시점
- 스테이징된 과거 리플레이 항목을 위한 별도의 근거 기반 Scene 레인
- `doctor.memory.dreamDiary`가 뒷받침하는 확장 가능한 Dream Diary 리더

## Dreaming이 전혀 실행되지 않음: 상태가 차단됨으로 표시됨

`openclaw memory status`가 `Dreaming status: blocked`를 보고하면 관리형 Cron은 존재하지만 기본 에이전트 Heartbeat가 실행되지 않는 것입니다. 기본 에이전트에 대해 Heartbeat가 활성화되어 있고 대상이 `none`이 아닌지 확인한 다음, 다음 Heartbeat 간격 후 `openclaw memory status --deep`를 다시 실행하세요.

## 관련 항목

- [메모리](/ko/concepts/memory)
- [메모리 CLI](/ko/cli/memory)
- [메모리 구성 참조](/ko/reference/memory-config)
- [메모리 검색](/ko/concepts/memory-search)
