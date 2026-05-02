---
read_when:
    - 메모리 승격이 자동으로 실행되기를 원하는 경우
    - 각 Dreaming 단계가 수행하는 작업을 이해하려는 경우
    - MEMORY.md를 오염시키지 않고 통합을 조정하려는 경우
sidebarTitle: Dreaming
summary: 얕은, 깊은, REM 단계와 꿈 일기를 포함한 백그라운드 메모리 통합
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T20:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다. OpenClaw가 강한 단기 신호를 지속 가능한 메모리로 이동하면서도 과정을 설명 가능하고 검토 가능하게 유지하도록 돕습니다.

<Note>
Dreaming은 **선택 사항**이며 기본적으로 비활성화되어 있습니다.
</Note>

## Dreaming이 쓰는 항목

Dreaming은 두 종류의 출력을 유지합니다.

- `memory/.dreams/`의 **기계 상태**(회상 저장소, 단계 신호, 수집 체크포인트, 잠금).
- `DREAMS.md`(또는 기존 `dreams.md`)의 **사람이 읽을 수 있는 출력**과 `memory/dreaming/<phase>/YYYY-MM-DD.md` 아래의 선택적 단계 보고서 파일.

장기 승격은 여전히 `MEMORY.md`에만 씁니다.

## 단계 모델

Dreaming은 세 가지 협력 단계를 사용합니다.

| 단계 | 목적 | 지속 쓰기 |
| ----- | ----------------------------------------- | ----------------- |
| Light | 최근 단기 자료를 정렬하고 스테이징 | 아니요 |
| Deep | 지속 가능한 후보를 점수화하고 승격 | 예(`MEMORY.md`) |
| REM | 주제와 반복되는 아이디어를 성찰 | 아니요 |

이 단계들은 내부 구현 세부 정보이며, 사용자가 별도로 구성하는 "모드"가 아닙니다.

<AccordionGroup>
  <Accordion title="Light 단계">
    Light 단계는 최근 일일 메모리 신호와 회상 추적을 수집하고, 중복을 제거한 뒤 후보 줄을 스테이징합니다.

    - 사용 가능한 경우 단기 회상 상태, 최근 일일 메모리 파일, 편집된 세션 transcript에서 읽습니다.
    - 저장소에 인라인 출력이 포함되어 있으면 관리되는 `## Light Sleep` 블록을 씁니다.
    - 이후 Deep 순위 지정을 위한 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 쓰지 않습니다.

  </Accordion>
  <Accordion title="Deep 단계">
    Deep 단계는 무엇이 장기 메모리가 될지 결정합니다.

    - 가중 점수화와 임계값 게이트를 사용해 후보의 순위를 매깁니다.
    - 통과하려면 `minScore`, `minRecallCount`, `minUniqueQueries`가 필요합니다.
    - 쓰기 전에 라이브 일일 파일에서 스니펫을 다시 불러오므로 오래되었거나 삭제된 스니펫은 건너뜁니다.
    - 승격된 항목을 `MEMORY.md`에 추가합니다.
    - `DREAMS.md`에 `## Deep Sleep` 요약을 쓰고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`를 씁니다.

  </Accordion>
  <Accordion title="REM 단계">
    REM 단계는 패턴과 성찰 신호를 추출합니다.

    - 최근 단기 추적에서 주제와 성찰 요약을 만듭니다.
    - 저장소에 인라인 출력이 포함되어 있으면 관리되는 `## REM Sleep` 블록을 씁니다.
    - Deep 순위 지정에 사용되는 REM 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 쓰지 않습니다.

  </Accordion>
</AccordionGroup>

## 세션 transcript 수집

Dreaming은 편집된 세션 transcript를 Dreaming 말뭉치로 수집할 수 있습니다. transcript가 사용 가능하면 일일 메모리 신호 및 회상 추적과 함께 Light 단계에 공급됩니다. 개인적이고 민감한 콘텐츠는 수집 전에 편집됩니다.

## 꿈 일지

Dreaming은 `DREAMS.md`에 서술형 **꿈 일지**도 유지합니다. 각 단계에 충분한 자료가 쌓이면 `memory-core`가 최선 노력 방식의 백그라운드 subagent 턴을 실행하고 짧은 일지 항목을 추가합니다. `dreaming.model`이 구성되어 있지 않으면 기본 런타임 모델을 사용합니다. 구성된 모델을 사용할 수 없는 경우 꿈 일지는 세션 기본 모델로 한 번 재시도합니다.

<Note>
이 일지는 Dreams UI에서 사람이 읽기 위한 것이며, 승격 소스가 아닙니다. Dreaming이 생성한 일지/보고서 아티팩트는 단기 승격에서 제외됩니다. 근거가 있는 메모리 스니펫만 `MEMORY.md`로 승격될 수 있습니다.
</Note>

검토 및 복구 작업을 위한 근거 기반 과거 백필 레인도 있습니다.

<AccordionGroup>
  <Accordion title="백필 명령">
    - `memory rem-harness --path ... --grounded`는 과거 `YYYY-MM-DD.md` 노트에서 근거 기반 일지 출력을 미리 봅니다.
    - `memory rem-backfill --path ...`는 되돌릴 수 있는 근거 기반 일지 항목을 `DREAMS.md`에 씁니다.
    - `memory rem-backfill --path ... --stage-short-term`은 근거가 있는 지속 후보를 일반 Deep 단계가 이미 사용하는 동일한 단기 증거 저장소에 스테이징합니다.
    - `memory rem-backfill --rollback` 및 `--rollback-short-term`은 일반 일지 항목이나 라이브 단기 회상은 건드리지 않고 해당 스테이징된 백필 아티팩트를 제거합니다.

  </Accordion>
</AccordionGroup>

Control UI는 동일한 일지 백필/재설정 흐름을 제공하므로 근거가 있는 후보를 승격할 가치가 있는지 결정하기 전에 Dreams scene에서 결과를 검사할 수 있습니다. Scene은 또한 별도의 근거 기반 레인을 표시하므로, 과거 재생에서 온 스테이징된 단기 항목, 근거 기반으로 승격된 항목을 확인하고, 일반 라이브 단기 상태를 건드리지 않은 채 근거 기반 전용 스테이징 항목만 지울 수 있습니다.

## Deep 순위 지정 신호

Deep 순위 지정은 6개의 가중 기본 신호와 단계 강화를 사용합니다.

| 신호 | 가중치 | 설명 |
| ------------------- | ------ | ------------------------------------------------- |
| 빈도 | 0.24 | 항목이 누적한 단기 신호 수 |
| 관련성 | 0.30 | 항목의 평균 검색 품질 |
| 쿼리 다양성 | 0.15 | 이를 드러낸 서로 다른 쿼리/일 컨텍스트 |
| 최신성 | 0.15 | 시간 감쇠가 적용된 최신성 점수 |
| 통합 | 0.10 | 여러 날에 걸친 반복 강도 |
| 개념적 풍부함 | 0.06 | 스니펫/경로의 개념 태그 밀도 |

Light 및 REM 단계 히트는 `memory/.dreams/phase-signals.json`에서 작은 최신성 감쇠 부스트를 추가합니다.

## 예약

활성화되면 `memory-core`는 전체 Dreaming sweep을 위한 하나의 Cron 작업을 자동 관리합니다. 각 sweep은 light → REM → deep 순서로 단계를 실행합니다.

sweep에는 기본 런타임 workspace와 구성된 agent workspace가 포함되며, 경로 기준으로 중복 제거되므로 subagent workspace fan-out이 main agent의 `DREAMS.md`와 메모리 상태를 제외하지 않습니다.

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
  <Tab title="사용자 지정 sweep 주기">
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

## CLI workflow

<Tabs>
  <Tab title="승격 미리 보기 / 적용">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    수동 `memory promote`는 CLI flags로 재정의하지 않는 한 기본적으로 Deep 단계 임계값을 사용합니다.

  </Tab>
  <Tab title="승격 설명">
    특정 후보가 승격되는 이유 또는 승격되지 않는 이유를 설명합니다.

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 미리 보기">
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
  Dreaming sweep을 활성화하거나 비활성화합니다.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  전체 Dreaming sweep의 Cron 주기입니다.
</ParamField>
<ParamField path="model" type="string">
  선택적 꿈 일지 subagent 모델 재정의입니다. subagent `allowedModels` allowlist도 설정하는 경우 정식 `provider/model` 값을 사용하세요.
</ParamField>

<Warning>
`dreaming.model`에는 `plugins.entries.memory-core.subagent.allowModelOverride: true`가 필요합니다. 이를 제한하려면 `plugins.entries.memory-core.subagent.allowedModels`도 설정하세요. 신뢰 또는 allowlist 실패는 조용히 fallback하지 않고 계속 표시되며, 재시도는 모델을 사용할 수 없는 오류에만 적용됩니다.
</Warning>

<Note>
단계 정책, 임계값, 저장소 동작은 내부 구현 세부 정보입니다(사용자 대상 config가 아님). 전체 키 목록은 [메모리 configuration reference](/ko/reference/memory-config#dreaming)를 참고하세요.
</Note>

## Dreams UI

활성화되면 Gateway **Dreams** 탭에 다음이 표시됩니다.

- 현재 Dreaming 활성화 상태
- 단계 수준 상태와 관리되는 sweep 존재 여부
- 단기, 근거 기반, 신호, 오늘 승격됨 개수
- 다음 예약 실행 시각
- 스테이징된 과거 재생 항목을 위한 별도의 근거 기반 Scene 레인
- `doctor.memory.dreamDiary`가 뒷받침하는 펼칠 수 있는 꿈 일지 리더

## 관련 항목

- [Memory](/ko/concepts/memory)
- [Memory CLI](/ko/cli/memory)
- [Memory configuration reference](/ko/reference/memory-config)
- [Memory search](/ko/concepts/memory-search)
