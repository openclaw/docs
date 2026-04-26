---
read_when:
    - 메모리 승격이 자동으로 실행되기를 원합니다.
    - 각 Dreaming 단계가 무엇을 하는지 이해하려고 합니다.
    - MEMORY.md를 오염시키지 않고 통합을 조정하려고 합니다.
sidebarTitle: Dreaming
summary: Dream Diary가 포함된 light, deep, REM 단계의 백그라운드 메모리 통합
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:27:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다. OpenClaw가 설명 가능하고 검토 가능한 상태를 유지하면서 강한 단기 신호를 지속 메모리로 이동하도록 돕습니다.

<Note>
Dreaming은 **opt-in** 기능이며 기본적으로 비활성화되어 있습니다.
</Note>

## Dreaming이 쓰는 내용

Dreaming은 두 종류의 출력을 유지합니다:

- **머신 상태**: `memory/.dreams/`(recall 저장소, 단계 신호, 수집 체크포인트, 잠금)
- **사람이 읽을 수 있는 출력**: `DREAMS.md`(또는 기존 `dreams.md`) 및 `memory/dreaming/<phase>/YYYY-MM-DD.md` 아래의 선택적 단계 보고서 파일

장기 승격은 여전히 `MEMORY.md`에만 기록됩니다.

## 단계 모델

Dreaming은 서로 협력하는 세 단계로 구성됩니다:

| 단계 | 목적                                      | 지속 기록          |
| ----- | ----------------------------------------- | ------------------- |
| Light | 최근 단기 자료를 정렬하고 준비            | 아니요              |
| Deep  | 지속 후보를 점수화하고 승격               | 예 (`MEMORY.md`)    |
| REM   | 주제와 반복되는 아이디어를 성찰            | 아니요              |

이 단계들은 내부 구현 세부 사항일 뿐이며, 사용자가 별도로 구성하는 "모드"가 아닙니다.

<AccordionGroup>
  <Accordion title="Light 단계">
    Light 단계는 최근 일일 메모리 신호와 recall 추적을 수집하고, 중복을 제거한 뒤, 후보 줄을 준비합니다.

    - 가능한 경우 단기 recall 상태, 최근 일일 메모리 파일, redact된 세션 transcript를 읽습니다.
    - 저장소에 인라인 출력이 포함된 경우 관리되는 `## Light Sleep` 블록을 기록합니다.
    - 이후 deep 순위 매기기를 위한 reinforcement 신호를 기록합니다.
    - `MEMORY.md`에는 절대 기록하지 않습니다.

  </Accordion>
  <Accordion title="Deep 단계">
    Deep 단계는 어떤 내용이 장기 메모리가 될지를 결정합니다.

    - 가중치 점수와 임계값 게이트를 사용해 후보의 순위를 매깁니다.
    - 통과하려면 `minScore`, `minRecallCount`, `minUniqueQueries`가 필요합니다.
    - 기록 전에 활성 일일 파일에서 스니펫을 다시 hydrate하므로, 오래되었거나 삭제된 스니펫은 건너뜁니다.
    - 승격된 항목을 `MEMORY.md`에 추가합니다.
    - `DREAMS.md`에 `## Deep Sleep` 요약을 기록하고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`에도 기록합니다.

  </Accordion>
  <Accordion title="REM 단계">
    REM 단계는 패턴과 성찰 신호를 추출합니다.

    - 최근 단기 추적으로부터 주제 및 성찰 요약을 생성합니다.
    - 저장소에 인라인 출력이 포함된 경우 관리되는 `## REM Sleep` 블록을 기록합니다.
    - deep 순위 매기기에 사용되는 REM reinforcement 신호를 기록합니다.
    - `MEMORY.md`에는 절대 기록하지 않습니다.

  </Accordion>
</AccordionGroup>

## 세션 transcript 수집

Dreaming은 redact된 세션 transcript를 dreaming 코퍼스로 수집할 수 있습니다. transcript를 사용할 수 있으면 일일 메모리 신호 및 recall 추적과 함께 light 단계에 입력됩니다. 개인 정보 및 민감한 내용은 수집 전에 redact됩니다.

## Dream Diary

Dreaming은 또한 `DREAMS.md`에 서술형 **Dream Diary**를 유지합니다. 각 단계에 충분한 자료가 쌓이면 `memory-core`는 최선형(best-effort) 백그라운드 subagent 턴(기본 런타임 모델 사용)을 실행하고 짧은 diary 항목을 추가합니다.

<Note>
이 diary는 Dreams UI에서 사람이 읽기 위한 것이며, 승격 소스가 아닙니다. Dreaming이 생성한 diary/보고서 아티팩트는 단기 승격에서 제외됩니다. `MEMORY.md`로 승격될 수 있는 것은 근거가 있는 메모리 스니펫뿐입니다.
</Note>

검토 및 복구 작업을 위한 근거 기반 기록 backfill 레인도 있습니다:

<AccordionGroup>
  <Accordion title="Backfill 명령">
    - `memory rem-harness --path ... --grounded`는 과거 `YYYY-MM-DD.md` 노트에서 근거 기반 diary 출력을 미리 봅니다.
    - `memory rem-backfill --path ...`는 되돌릴 수 있는 근거 기반 diary 항목을 `DREAMS.md`에 기록합니다.
    - `memory rem-backfill --path ... --stage-short-term`는 정상 deep 단계가 이미 사용하는 동일한 단기 증거 저장소에 근거 기반 지속 후보를 준비합니다.
    - `memory rem-backfill --rollback` 및 `--rollback-short-term`는 일반 diary 항목이나 활성 단기 recall은 건드리지 않고 이러한 준비된 backfill 아티팩트를 제거합니다.
  </Accordion>
</AccordionGroup>

Control UI는 동일한 diary backfill/reset 흐름을 노출하므로, 근거 기반 후보를 승격할 가치가 있는지 결정하기 전에 Dreams 장면에서 결과를 검사할 수 있습니다. 이 장면은 또한 별도의 근거 기반 레인을 표시하므로 어떤 준비된 단기 항목이 과거 재생에서 왔는지, 어떤 승격된 항목이 근거 기반 주도였는지 확인할 수 있으며, 일반 활성 단기 상태를 건드리지 않고 근거 기반으로만 준비된 항목만 지울 수 있습니다.

## Deep 순위 신호

Deep 순위 매기기는 여섯 개의 가중 기본 신호와 단계 reinforcement를 사용합니다:

| 신호                | 가중치 | 설명                                          |
| ------------------- | ------ | --------------------------------------------- |
| 빈도                | 0.24   | 항목이 누적한 단기 신호 수                    |
| 관련성              | 0.30   | 항목의 평균 검색 품질                         |
| 쿼리 다양성         | 0.15   | 이를 드러낸 서로 다른 쿼리/일자 컨텍스트 수   |
| 최신성              | 0.15   | 시간 감쇠 기반 최신성 점수                    |
| 통합성              | 0.10   | 여러 날짜에 걸친 반복 강도                    |
| 개념적 풍부함       | 0.06   | 스니펫/경로의 개념 태그 밀도                  |

Light 및 REM 단계 적중은 `memory/.dreams/phase-signals.json`의 최신성 감쇠가 적용된 작은 부스트를 추가합니다.

## 스케줄링

활성화되면 `memory-core`는 전체 Dreaming 스윕을 위한 하나의 Cron 작업을 자동 관리합니다. 각 스윕은 light → REM → deep 순서로 단계를 실행합니다.

기본 주기 동작:

| 설정                 | 기본값      |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

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

## CLI 워크플로

<Tabs>
  <Tab title="승격 미리 보기 / 적용">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    수동 `memory promote`는 CLI 플래그로 재정의하지 않는 한 기본적으로 deep 단계 임계값을 사용합니다.

  </Tab>
  <Tab title="승격 설명">
    특정 후보가 왜 승격되거나 승격되지 않는지 설명합니다:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 미리 보기">
    아무것도 기록하지 않고 REM 성찰, 후보 사실, deep 승격 출력을 미리 봅니다:

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

<Note>
단계 정책, 임계값, 저장소 동작은 내부 구현 세부 사항이며 사용자 대상 구성이 아닙니다. 전체 키 목록은 [메모리 구성 참조](/ko/reference/memory-config#dreaming)를 참조하세요.
</Note>

## Dreams UI

활성화되면 Gateway의 **Dreams** 탭에 다음이 표시됩니다:

- 현재 Dreaming 활성화 상태
- 단계 수준 상태 및 관리되는 스윕 존재 여부
- 단기, 근거 기반, 신호, 오늘 승격된 항목 수
- 다음 예약 실행 시점
- 준비된 과거 재생 항목을 위한 별도의 근거 기반 장면 레인
- `doctor.memory.dreamDiary`를 기반으로 하는 확장 가능한 Dream Diary 리더

## 관련 항목

- [메모리](/ko/concepts/memory)
- [메모리 CLI](/ko/cli/memory)
- [메모리 구성 참조](/ko/reference/memory-config)
- [메모리 검색](/ko/concepts/memory-search)
