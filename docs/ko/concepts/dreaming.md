---
read_when:
    - 메모리 승격이 자동으로 실행되도록 하려는 경우
    - 각 Dreaming 단계에서 수행하는 작업을 이해하려는 경우
    - MEMORY.md를 불필요한 내용으로 채우지 않으면서 통합을 조정하려고 합니다
sidebarTitle: Dreaming
summary: 가벼운 단계, 깊은 단계 및 REM 단계를 통한 백그라운드 메모리 통합과 꿈 일기
title: Dreaming
x-i18n:
    generated_at: "2026-07-12T15:09:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다. 프로세스를 설명하고 검토할 수 있는 상태로 유지하면서 강한 단기 신호를 영구 메모리로 이동합니다.

<Note>
Dreaming은 **명시적으로 활성화해야 하며** 기본적으로 비활성화되어 있습니다.
</Note>

## Dreaming이 기록하는 항목

- `memory/.dreams/`의 **머신 상태**(회상 저장소, 단계 신호, 수집 체크포인트, 잠금).
- `DREAMS.md`(또는 기존 `dreams.md`)의 **사람이 읽을 수 있는 출력**과 선택적으로 `memory/dreaming/<phase>/YYYY-MM-DD.md` 아래의 단계 보고서 파일.

장기 승격은 계속해서 `MEMORY.md`에만 기록합니다.

## 단계 모델

Dreaming은 각 스윕마다 light -> REM -> deep 순서로 서로 협력하는 세 단계를 실행합니다. 이는 내부 구현 단계이며, 사용자가 별도로 구성하는 모드가 아닙니다.

| 단계  | 목적                              | 영구 기록         |
| ----- | --------------------------------- | ----------------- |
| Light | 최근 단기 자료를 정렬하고 준비    | 아니요            |
| REM   | 주제와 반복되는 아이디어를 성찰   | 아니요            |
| Deep  | 영구 후보를 평가하고 승격         | 예 (`MEMORY.md`)  |

<AccordionGroup>
  <Accordion title="Light 단계">
    - 최근 단기 회상 상태, 일별 메모리 파일, 그리고 사용 가능한 경우 민감 정보가 제거된 세션 기록을 읽습니다.
    - 신호의 중복을 제거하고 후보 줄을 준비합니다.
    - 저장소에 인라인 출력이 포함된 경우 관리되는 `## Light Sleep` 블록을 기록합니다.
    - 이후 deep 순위 지정에 사용할 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 기록하지 않습니다.

  </Accordion>
  <Accordion title="REM 단계">
    - 최근 단기 흔적에서 주제 및 성찰 요약을 생성합니다.
    - 저장소에 인라인 출력이 포함된 경우 관리되는 `## REM Sleep` 블록을 기록합니다.
    - deep 순위 지정에 사용되는 REM 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 기록하지 않습니다.

  </Accordion>
  <Accordion title="Deep 단계">
    - 가중치 점수와 임계값 게이트를 사용하여 후보의 순위를 지정합니다(`minScore`, `minRecallCount`, `minUniqueQueries`를 모두 통과해야 합니다).
    - 기록하기 전에 현재 일별 파일에서 스니펫을 다시 불러오므로 오래되었거나 삭제된 스니펫은 건너뜁니다.
    - 승격된 항목을 `MEMORY.md`에 추가합니다.
    - `DREAMS.md`에 `## Deep Sleep` 요약을 기록하고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`에도 기록합니다.

  </Accordion>
</AccordionGroup>

## 세션 기록 수집

Dreaming은 민감 정보가 제거된 세션 기록을 Dreaming 코퍼스에 수집할 수 있습니다. 기록을 사용할 수 있으면 일별 메모리 신호 및 회상 흔적과 함께 light 단계에 입력됩니다. 개인 정보 및 민감한 콘텐츠는 수집 전에 제거됩니다.

## 꿈 일기

Dreaming은 `DREAMS.md`에 서술형 **꿈 일기**를 유지합니다. 각 단계에 충분한 자료가 모이면 `memory-core`가 최선형 백그라운드 하위 에이전트 턴을 실행하고 짧은 일기 항목을 추가합니다. `dreaming.model`이 구성되지 않은 경우 기본 런타임 모델을 사용합니다. 구성된 모델을 사용할 수 없으면 일기 실행은 세션 기본 모델로 한 번 재시도합니다. 신뢰 또는 허용 목록 실패는 재시도하지 않으며, 일반적인 일기 항목으로 자동 대체하는 대신 로그에 계속 표시됩니다.

<Note>
일기는 Dreams UI에서 사람이 읽기 위한 것이며 승격 소스가 아닙니다. 일기/보고서 아티팩트는 단기 승격에서 제외되며, 근거가 있는 메모리 스니펫만 `MEMORY.md`로 승격할 수 있습니다.
</Note>

검토 및 복구 작업을 위한 근거 기반 과거 백필 경로도 있습니다.

<AccordionGroup>
  <Accordion title="백필 명령">
    - `memory rem-harness --path ... --grounded`는 과거 `YYYY-MM-DD.md` 메모에서 근거 기반 일기 출력을 미리 봅니다.
    - `memory rem-backfill --path ...`는 되돌릴 수 있는 근거 기반 일기 항목을 `DREAMS.md`에 기록합니다.
    - `memory rem-backfill --path ... --stage-short-term`은 근거 기반 영구 후보를 일반 deep 단계에서 사용하는 것과 동일한 단기 증거 저장소에 준비합니다.
    - `memory rem-backfill --rollback` 및 `--rollback-short-term`은 일반 일기 항목이나 현재 단기 회상에 영향을 주지 않고 준비된 백필 아티팩트를 제거합니다.

  </Accordion>
</AccordionGroup>

Control UI는 에이전트의 Memory 탭(Agents 페이지)에 동일한 일기 백필/재설정 흐름을 제공하므로, 근거 기반 후보가 승격될 가치가 있는지 결정하기 전에 꿈 장면에서 결과를 검사할 수 있습니다. 별도의 근거 기반 Scene 경로에는 과거 재생에서 생성된 준비된 단기 항목, 근거 기반 항목이 주도한 승격 항목이 표시되며, 현재 단기 상태에 영향을 주지 않고 근거 기반 전용 준비 항목만 지울 수 있습니다.

## Deep 순위 지정 신호

Deep 순위 지정은 단계 강화와 함께 다음 6개의 가중 기본 신호를 사용합니다.

| 신호          | 가중치 | 설명                                      |
| ------------- | ------ | ----------------------------------------- |
| 관련성        | 0.30   | 항목의 평균 검색 품질                     |
| 빈도          | 0.24   | 항목에 누적된 단기 신호 수                |
| 쿼리 다양성   | 0.15   | 해당 항목이 나타난 서로 다른 쿼리/일별 문맥 |
| 최신성        | 0.15   | 시간 경과에 따라 감소하는 최신성 점수     |
| 통합          | 0.10   | 여러 날에 걸친 반복 강도                  |
| 개념적 풍부함 | 0.06   | 스니펫/경로의 개념 태그 밀도              |

Light 및 REM 단계의 적중은 `memory/.dreams/phase-signals.json`에서 최신성에 따라 조금씩 감소하는 작은 가산점을 추가합니다.

Shadow trial 결과는 영구 기록 전에 검토 신호로 기본 점수 위에 추가될 수 있습니다. 유용한 trial은 후보에 작고 제한된 가산점을 부여하고, 중립적인 trial은 후보를 보류 상태로 유지하며, 유해한 trial은 해당 점수 산정 과정에서 후보를 거부된 것으로 표시합니다. 이 신호는 보고서 전용입니다. 후보 순서나 검토 메타데이터를 변경할 수 있지만, `MEMORY.md`에 기록하거나 자체적으로 후보를 승격하지는 않습니다.

### QA Shadow trial 보고서 범위

QA Lab에는 향후 Dreaming Shadow trial이 승격 전에 후보 메모리를 검토하는 방식을 탐색하기 위한 보고서 전용 시나리오가 포함되어 있습니다. 에이전트는 기준 답변과 후보 메모리를 사용할 수 있는 답변을 비교한 다음 판정, 사유 및 위험 플래그가 포함된 로컬 보고서를 기록합니다. 이 범위는 QA로 제한됩니다. 보고서 아티팩트가 `MEMORY.md`와 분리된 상태로 유지되며 에이전트가 후보가 승격되었다고 주장하지 않는지 검증합니다. 프로덕션 Shadow trial 동작을 추가하거나 deep 단계 승격 엔진을 변경하지는 않습니다.

`memory-core` Shadow trial 실행기는 안정적인 아티팩트가 필요한 코드 경로에 대해 동일한 보고서 전용 계약을 유지합니다. 후보, trial 프롬프트, 기준 결과, 후보 결과, 판정, 사유, 위험 플래그 및 증거 참조를 받은 다음 `promotion action: report-only`가 포함된 보고서를 기록합니다. 유용함 판정은 `promote` 권장 사항에, 중립 판정은 `defer`에, 유해함 판정은 `reject`에 대응합니다. 이 중 어느 것도 `MEMORY.md`에 기록하거나 deep 단계 승격을 적용하지 않습니다.

## 예약

활성화하면 `memory-core`는 전체 Dreaming 스윕을 위한 Cron 작업 하나를 자동으로 관리합니다. 기본 런타임 작업 공간과 구성된 모든 에이전트 작업 공간에서 중복이 제거되므로, 하위 에이전트 작업 공간의 팬아웃으로 인해 기본 에이전트의 `DREAMS.md`와 메모리 상태가 제외되지 않습니다.

| 설정                 | 기본값        |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | 기본 모델     |

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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on`과 `/dreaming off`는 채널 호출자의 경우 소유자 상태가 필요하며, Gateway 클라이언트의 경우 `operator.admin`이 필요합니다. `/dreaming status`와 `/dreaming help`는 읽기 전용입니다.

## CLI 워크플로

<Tabs>
  <Tab title="승격 미리 보기/적용">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    수동 `memory promote`는 CLI 플래그로 재정의하지 않는 한 기본적으로 deep 단계 임계값을 사용합니다.

  </Tab>
  <Tab title="승격 설명">
    특정 후보가 승격되거나 승격되지 않는 이유를 설명합니다.

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM 하네스 미리 보기">
    아무것도 기록하지 않고 REM 성찰, 후보 진술 및 deep 승격 출력을 미리 봅니다.

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
  선택적인 꿈 일기 하위 에이전트 모델 재정의입니다. 하위 에이전트 `allowedModels` 허용 목록도 설정할 때는 정규 `provider/model` 값을 사용하십시오.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md`로 승격되는 각 단기 회상 스니펫에서 유지되는 최대 추정 토큰 수입니다. 순위 지정 출처는 계속 표시됩니다.
</ParamField>

<Warning>
`dreaming.model`에는 `plugins.entries.memory-core.subagent.allowModelOverride: true`가 필요합니다. 제한하려면 `plugins.entries.memory-core.subagent.allowedModels`도 설정하십시오. 자동 재시도는 모델 사용 불가 오류에만 적용됩니다. 신뢰 또는 허용 목록 실패는 자동으로 대체되지 않고 로그에 계속 표시됩니다.
</Warning>

<Note>
대부분의 단계 정책, 임계값 및 저장소 동작은 내부 구현 세부 정보입니다. 전체 키 목록은 [메모리 구성 참조](/ko/reference/memory-config#dreaming)를 참조하십시오.
</Note>

## Dreams UI

활성화하면 Gateway **Dreams** 탭에 다음 항목이 표시됩니다.

- 현재 Dreaming 활성화 상태
- 단계별 상태 및 관리되는 스윕의 존재 여부
- 단기, 근거 기반, 신호 및 오늘 승격된 항목 수
- 다음 예약 실행 시점
- 준비된 과거 재생 항목을 위한 별도의 근거 기반 Scene 경로
- `doctor.memory.dreamDiary`를 기반으로 하는 확장 가능한 꿈 일기 리더

## 관련 항목

- [메모리](/ko/concepts/memory)
- [메모리 CLI](/ko/cli/memory)
- [메모리 구성 참조](/ko/reference/memory-config)
- [메모리 검색](/ko/concepts/memory-search)
