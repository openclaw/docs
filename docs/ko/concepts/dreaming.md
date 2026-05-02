---
read_when:
    - 메모리 승격을 자동으로 실행하려는 경우
    - 각 Dreaming 단계가 수행하는 작업을 이해하려는 경우
    - MEMORY.md를 오염시키지 않고 통합을 조정하려는 경우
sidebarTitle: Dreaming
summary: 얕은, 깊은, REM 단계와 꿈 일기를 포함한 백그라운드 메모리 통합
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T22:18:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다. OpenClaw가 강한 단기 신호를 지속적인 메모리로 옮기면서도 과정을 설명 가능하고 검토 가능하게 유지하도록 돕습니다.

<Note>
Dreaming은 **옵트인**이며 기본적으로 비활성화되어 있습니다.
</Note>

## Dreaming이 기록하는 내용

Dreaming은 두 종류의 출력을 유지합니다.

- `memory/.dreams/`의 **머신 상태**(리콜 저장소, 단계 신호, 수집 체크포인트, 잠금).
- `DREAMS.md`(또는 기존 `dreams.md`)의 **사람이 읽을 수 있는 출력**과 `memory/dreaming/<phase>/YYYY-MM-DD.md` 아래의 선택적 단계 보고서 파일.

장기 승격은 여전히 `MEMORY.md`에만 기록합니다.

## 단계 모델

Dreaming은 세 가지 협력 단계를 사용합니다.

| 단계 | 목적                                   | 지속 기록     |
| ----- | ----------------------------------------- | ----------------- |
| Light | 최근 단기 자료를 정렬하고 스테이징 | 아니요                |
| Deep  | 지속 가능한 후보를 점수화하고 승격      | 예 (`MEMORY.md`) |
| REM   | 주제와 반복되는 아이디어를 성찰     | 아니요                |

이 단계들은 내부 구현 세부 정보이며, 사용자가 별도로 구성하는 "모드"가 아닙니다.

<AccordionGroup>
  <Accordion title="Light phase">
    Light 단계는 최근 일일 메모리 신호와 리콜 추적을 수집하고, 중복을 제거한 뒤 후보 줄을 스테이징합니다.

    - 가능한 경우 단기 리콜 상태, 최근 일일 메모리 파일, 수정된 세션 트랜스크립트에서 읽습니다.
    - 저장소가 인라인 출력을 포함할 때 관리되는 `## Light Sleep` 블록을 기록합니다.
    - 이후 Deep 순위 지정을 위한 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 기록하지 않습니다.

  </Accordion>
  <Accordion title="Deep phase">
    Deep 단계는 무엇이 장기 메모리가 될지 결정합니다.

    - 가중 점수화와 임계값 게이트를 사용해 후보의 순위를 매깁니다.
    - 통과하려면 `minScore`, `minRecallCount`, `minUniqueQueries`가 필요합니다.
    - 기록하기 전에 라이브 일일 파일에서 스니펫을 다시 가져오므로, 오래되었거나 삭제된 스니펫은 건너뜁니다.
    - 승격된 항목을 `MEMORY.md`에 추가합니다.
    - `DREAMS.md`에 `## Deep Sleep` 요약을 기록하고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`를 기록합니다.

  </Accordion>
  <Accordion title="REM phase">
    REM 단계는 패턴과 성찰 신호를 추출합니다.

    - 최근 단기 추적에서 주제와 성찰 요약을 만듭니다.
    - 저장소가 인라인 출력을 포함할 때 관리되는 `## REM Sleep` 블록을 기록합니다.
    - Deep 순위 지정에 사용되는 REM 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 기록하지 않습니다.

  </Accordion>
</AccordionGroup>

## 세션 트랜스크립트 수집

Dreaming은 수정된 세션 트랜스크립트를 Dreaming 코퍼스로 수집할 수 있습니다. 트랜스크립트가 있으면 일일 메모리 신호와 리콜 추적과 함께 Light 단계에 제공됩니다. 개인적이고 민감한 내용은 수집 전에 수정됩니다.

## Dream Diary

Dreaming은 `DREAMS.md`에 서사형 **Dream Diary**도 유지합니다. 각 단계에 충분한 자료가 생기면 `memory-core`가 최선 노력 방식으로 백그라운드 서브에이전트 턴을 실행하고 짧은 일기 항목을 추가합니다. `dreaming.model`이 구성되어 있지 않으면 기본 런타임 모델을 사용합니다. 구성된 모델을 사용할 수 없으면 Dream Diary는 세션 기본 모델로 한 번 재시도합니다.

<Note>
이 일기는 Dreams UI에서 사람이 읽기 위한 것이며, 승격 소스가 아닙니다. Dreaming이 생성한 일기/보고서 아티팩트는 단기 승격에서 제외됩니다. 근거가 있는 메모리 스니펫만 `MEMORY.md`로 승격될 수 있습니다.
</Note>

검토와 복구 작업을 위한 근거 기반 과거 백필 레인도 있습니다.

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded`는 과거 `YYYY-MM-DD.md` 노트에서 근거 기반 일기 출력을 미리 봅니다.
    - `memory rem-backfill --path ...`는 되돌릴 수 있는 근거 기반 일기 항목을 `DREAMS.md`에 기록합니다.
    - `memory rem-backfill --path ... --stage-short-term`은 근거가 있는 지속 후보를 일반 Deep 단계가 이미 사용하는 동일한 단기 증거 저장소에 스테이징합니다.
    - `memory rem-backfill --rollback` 및 `--rollback-short-term`은 일반 일기 항목이나 라이브 단기 리콜을 건드리지 않고 이러한 스테이징된 백필 아티팩트를 제거합니다.

  </Accordion>
</AccordionGroup>

Control UI는 동일한 일기 백필/초기화 흐름을 제공하므로, 근거 있는 후보가 승격될 만한지 결정하기 전에 Dreams 장면에서 결과를 검사할 수 있습니다. Scene은 별도의 근거 기반 레인도 표시하므로, 어떤 스테이징된 단기 항목이 과거 재생에서 왔는지, 어떤 승격 항목이 근거 기반으로 이끌렸는지 확인하고, 일반 라이브 단기 상태를 건드리지 않고 근거 전용 스테이징 항목만 지울 수 있습니다.

## Deep 순위 지정 신호

Deep 순위 지정은 여섯 가지 가중 기본 신호와 단계 강화를 사용합니다.

| 신호              | 가중치 | 설명                                       |
| ------------------- | ------ | ------------------------------------------------- |
| 빈도           | 0.24   | 항목이 축적한 단기 신호 수 |
| 관련성           | 0.30   | 항목의 평균 검색 품질           |
| 쿼리 다양성     | 0.15   | 이를 드러낸 고유 쿼리/일 컨텍스트      |
| 최신성             | 0.15   | 시간 감쇠가 적용된 최신성 점수                      |
| 통합       | 0.10   | 여러 날에 걸친 반복 강도                     |
| 개념적 풍부함 | 0.06   | 스니펫/경로의 개념 태그 밀도             |

Light 및 REM 단계 히트는 `memory/.dreams/phase-signals.json`에서 최신성 감쇠가 적용된 작은 부스트를 추가합니다.

## 스케줄링

활성화되면 `memory-core`는 전체 Dreaming 스윕을 위한 Cron 작업 하나를 자동 관리합니다. 각 스윕은 Light → REM → Deep 순서로 단계를 실행합니다.

스윕에는 기본 런타임 워크스페이스와 구성된 모든 에이전트 워크스페이스가 포함되며, 경로 기준으로 중복 제거됩니다. 따라서 서브에이전트 워크스페이스 팬아웃이 주 에이전트의 `DREAMS.md`와 메모리 상태를 제외하지 않습니다.

기본 주기 동작:

| 설정              | 기본값       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | 기본 모델 |

## 빠른 시작

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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

## CLI 워크플로

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    수동 `memory promote`는 CLI 플래그로 재정의하지 않는 한 기본적으로 Deep 단계 임계값을 사용합니다.

  </Tab>
  <Tab title="Explain promotion">
    특정 후보가 승격될지 또는 승격되지 않을지 설명합니다.

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    아무것도 기록하지 않고 REM 성찰, 후보 진실, Deep 승격 출력을 미리 봅니다.

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
  선택적 Dream Diary 서브에이전트 모델 재정의입니다. 서브에이전트 `allowedModels` 허용 목록도 설정할 때는 표준 `provider/model` 값을 사용하세요.
</ParamField>

<Warning>
`dreaming.model`에는 `plugins.entries.memory-core.subagent.allowModelOverride: true`가 필요합니다. 이를 제한하려면 `plugins.entries.memory-core.subagent.allowedModels`도 설정하세요. 신뢰 또는 허용 목록 실패는 조용히 대체되지 않고 계속 표시되며, 재시도는 모델 사용 불가 오류만 처리합니다.
</Warning>

<Note>
단계 정책, 임계값, 저장 동작은 내부 구현 세부 정보입니다(사용자 대상 구성 아님). 전체 키 목록은 [메모리 구성 참조](/ko/reference/memory-config#dreaming)를 참조하세요.
</Note>

## Dreams UI

활성화되면 Gateway **Dreams** 탭에 다음이 표시됩니다.

- 현재 Dreaming 활성화 상태
- 단계 수준 상태와 관리되는 스윕 존재 여부
- 단기, 근거 기반, 신호, 오늘 승격된 항목 수
- 다음 예약 실행 시간
- 스테이징된 과거 재생 항목을 위한 별도의 근거 기반 Scene 레인
- `doctor.memory.dreamDiary`가 뒷받침하는 확장 가능한 Dream Diary 리더

## Dreaming이 실행되지 않음: 상태가 차단됨으로 표시됨

`openclaw memory status`가 `Dreaming status: blocked`를 보고하면 관리되는 Cron은 존재하지만 기본 에이전트 Heartbeat가 작동하지 않는 것입니다. 기본 에이전트의 Heartbeat가 활성화되어 있고 대상이 `none`이 아닌지 확인한 다음, 다음 Heartbeat 간격 이후 `openclaw memory status --deep`를 다시 실행하세요.

## 관련 항목

- [메모리](/ko/concepts/memory)
- [메모리 CLI](/ko/cli/memory)
- [메모리 구성 참조](/ko/reference/memory-config)
- [메모리 검색](/ko/concepts/memory-search)
