---
read_when:
    - 메모리 승격이 자동으로 실행되도록 하려는 경우
    - 각 Dreaming 단계가 무엇을 하는지 이해하고 싶습니다
    - MEMORY.md를 오염시키지 않고 통합을 조정하려는 경우
sidebarTitle: Dreaming
summary: 가벼운 단계, 깊은 단계, REM 단계 및 Dream Diary를 포함한 백그라운드 메모리 통합
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:22:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다. OpenClaw가 강한 단기 신호를 지속 가능한 메모리로 옮기면서도 과정을 설명 가능하고 검토 가능하게 유지하도록 돕습니다.

<Note>
Dreaming은 **옵트인**이며 기본적으로 비활성화되어 있습니다.
</Note>

## Dreaming이 기록하는 것

Dreaming은 두 종류의 출력을 유지합니다.

- `memory/.dreams/`의 **머신 상태**(recall 저장소, phase 신호, ingestion 체크포인트, 잠금).
- `DREAMS.md`(또는 기존 `dreams.md`)의 **사람이 읽을 수 있는 출력**과 `memory/dreaming/<phase>/YYYY-MM-DD.md` 아래의 선택적 phase 보고서 파일.

장기 승격은 여전히 `MEMORY.md`에만 기록합니다.

## Phase 모델

Dreaming은 세 가지 협력 phase를 사용합니다.

| Phase | 목적 | 지속 기록 |
| ----- | ----------------------------------------- | ----------------- |
| Light | 최근 단기 자료를 정렬하고 스테이징 | 아니요 |
| Deep  | 지속 가능한 후보를 점수화하고 승격 | 예(`MEMORY.md`) |
| REM   | 주제와 반복되는 아이디어를 성찰 | 아니요 |

이 phase들은 별도의 사용자 구성 "모드"가 아니라 내부 구현 세부 사항입니다.

<AccordionGroup>
  <Accordion title="Light phase">
    Light phase는 최근 일일 메모리 신호와 recall 추적을 수집하고, 중복을 제거한 뒤 후보 줄을 스테이징합니다.

    - 사용 가능한 경우 단기 recall 상태, 최근 일일 메모리 파일, 그리고 수정된 세션 transcript에서 읽습니다.
    - 저장소에 inline 출력이 포함된 경우 관리되는 `## Light Sleep` 블록을 기록합니다.
    - 이후 deep 랭킹을 위한 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 기록하지 않습니다.

  </Accordion>
  <Accordion title="Deep phase">
    Deep phase는 무엇이 장기 메모리가 될지 결정합니다.

    - 가중 점수화와 임계값 게이트를 사용해 후보의 순위를 매깁니다.
    - 통과하려면 `minScore`, `minRecallCount`, `minUniqueQueries`가 필요합니다.
    - 기록하기 전에 live 일일 파일에서 snippet을 다시 수화하므로, 오래되었거나 삭제된 snippet은 건너뜁니다.
    - 승격된 항목을 `MEMORY.md`에 추가합니다.
    - `DREAMS.md`에 `## Deep Sleep` 요약을 기록하고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`를 기록합니다.

  </Accordion>
  <Accordion title="REM phase">
    REM phase는 패턴과 성찰 신호를 추출합니다.

    - 최근 단기 추적에서 주제와 성찰 요약을 빌드합니다.
    - 저장소에 inline 출력이 포함된 경우 관리되는 `## REM Sleep` 블록을 기록합니다.
    - deep 랭킹에서 사용하는 REM 강화 신호를 기록합니다.
    - `MEMORY.md`에는 절대 기록하지 않습니다.

  </Accordion>
</AccordionGroup>

## 세션 transcript ingestion

Dreaming은 수정된 세션 transcript를 dreaming corpus로 ingest할 수 있습니다. transcript를 사용할 수 있으면, 일일 메모리 신호 및 recall 추적과 함께 light phase로 공급됩니다. 개인 및 민감한 콘텐츠는 ingestion 전에 수정됩니다.

## Dream Diary

Dreaming은 `DREAMS.md`에 서술형 **Dream Diary**도 유지합니다. 각 phase에 충분한 자료가 생기면 `memory-core`가 최선 노력 방식의 백그라운드 subagent turn을 실행하고 짧은 diary 항목을 추가합니다. `dreaming.model`이 구성되지 않은 한 기본 런타임 모델을 사용합니다. 구성된 모델을 사용할 수 없으면 Dream Diary는 세션 기본 모델로 한 번 재시도합니다.

<Note>
이 diary는 Dreams UI에서 사람이 읽기 위한 것이며, 승격 소스가 아닙니다. Dreaming이 생성한 diary/report artifact는 단기 승격에서 제외됩니다. 근거가 있는 메모리 snippet만 `MEMORY.md`로 승격될 수 있습니다.
</Note>

검토 및 복구 작업을 위한 근거 기반의 historical backfill lane도 있습니다.

<AccordionGroup>
  <Accordion title="Backfill 명령">
    - `memory rem-harness --path ... --grounded`는 historical `YYYY-MM-DD.md` 노트에서 근거 기반 diary 출력을 미리 봅니다.
    - `memory rem-backfill --path ...`는 되돌릴 수 있는 근거 기반 diary 항목을 `DREAMS.md`에 기록합니다.
    - `memory rem-backfill --path ... --stage-short-term`은 일반 deep phase가 이미 사용하는 동일한 단기 evidence 저장소에 근거 기반의 지속 가능한 후보를 스테이징합니다.
    - `memory rem-backfill --rollback` 및 `--rollback-short-term`은 일반 diary 항목이나 live 단기 recall을 건드리지 않고 해당 스테이징된 backfill artifact를 제거합니다.

  </Accordion>
</AccordionGroup>

Control UI는 동일한 diary backfill/reset 흐름을 노출하므로, 근거 기반 후보가 승격될 만한지 결정하기 전에 Dreams scene에서 결과를 검사할 수 있습니다. Scene은 또한 별도의 근거 기반 lane을 표시하여 어떤 스테이징된 단기 항목이 historical replay에서 왔는지, 어떤 승격 항목이 근거 기반으로 주도되었는지 확인하고, 일반 live 단기 상태를 건드리지 않고 근거 기반 전용 스테이징 항목만 지울 수 있게 합니다.

## Deep 랭킹 신호

Deep 랭킹은 여섯 가지 가중 기반 신호와 phase 강화를 사용합니다.

| 신호 | 가중치 | 설명 |
| ------------------- | ------ | ------------------------------------------------- |
| 빈도 | 0.24   | 항목이 누적한 단기 신호 수 |
| 관련성 | 0.30   | 항목의 평균 retrieval 품질 |
| 쿼리 다양성 | 0.15   | 해당 항목을 드러낸 서로 다른 쿼리/일 컨텍스트 |
| 최신성 | 0.15   | 시간 감쇠 freshness 점수 |
| 통합 | 0.10   | 여러 날에 걸친 반복 강도 |
| 개념적 풍부함 | 0.06   | snippet/path의 concept-tag 밀도 |

Light 및 REM phase hit는 `memory/.dreams/phase-signals.json`에서 작은 최신성 감쇠 boost를 추가합니다.

Shadow-trial 결과는 지속 기록 전에 검토 신호로 해당 기본 점수 위에 겹쳐질 수 있습니다. 유용한 trial은 후보에 작고 제한된 boost를 주고, 중립 trial은 보류 상태를 유지하며, 유해한 trial은 해당 scoring pass에서 거부된 것으로 표시합니다. 이 신호는 여전히 report-only입니다. 후보 순서나 검토 metadata를 변경할 수는 있지만, 자체적으로 `MEMORY.md`에 기록하거나 후보를 승격하지는 않습니다.

## QA shadow trial 보고서 커버리지

QA Lab에는 향후 dreaming shadow trial이 승격 전에 candidate memory를 검토하는 방식을 탐색하기 위한 report-only scenario가 포함되어 있습니다. 이 scenario는 agent에게 baseline 답변과 candidate memory를 사용할 수 있는 답변을 비교한 다음, verdict, reason, risk flags가 포함된 local report를 작성하도록 요청합니다.

이 커버리지는 의도적으로 QA로 범위가 제한됩니다. report artifact가 `MEMORY.md`와 분리되어 유지되고 agent가 후보가 승격되었다고 주장하지 않는지 검증합니다. production shadow-trial 동작을 추가하거나 deep-phase promotion engine을 변경하지 않습니다.

`memory-core` shadow-trial runner는 안정적인 artifact가 필요한 code path에 대해 동일한 report-only contract를 유지합니다. candidate, trial prompt, baseline outcome, candidate outcome, verdict, reason, risk flags, evidence references를 받아 `promotion action: report-only`가 포함된 report를 기록합니다. 유용한 verdict는 `promote` recommendation으로, 중립 verdict는 `defer`로, 유해한 verdict는 `reject`로 매핑됩니다. 이 recommendation들 중 어떤 것도 `MEMORY.md`에 기록하거나 deep-phase promotion을 적용하지 않습니다.

## Scheduling

활성화되면 `memory-core`는 전체 dreaming sweep에 대해 하나의 cron job을 자동 관리합니다. 각 sweep은 light → REM → deep 순서로 phase를 실행합니다.

sweep에는 primary runtime workspace와 구성된 모든 agent workspace가 포함되며, path 기준으로 중복 제거되므로 subagent workspace fan-out이 main agent의 `DREAMS.md`와 memory state를 제외하지 않습니다.

기본 cadence 동작:

| 설정 | 기본값 |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | 기본 모델 |

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
  <Tab title="사용자 지정 sweep cadence">
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

## Slash command

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI workflow

<Tabs>
  <Tab title="승격 preview / 적용">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    수동 `memory promote`는 CLI flag로 override하지 않는 한 기본적으로 deep-phase threshold를 사용합니다.

  </Tab>
  <Tab title="승격 설명">
    특정 candidate가 승격되거나 승격되지 않는 이유를 설명합니다.

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    아무것도 기록하지 않고 REM reflection, candidate truth, deep promotion 출력을 미리 봅니다.

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 주요 기본값

모든 설정은 `plugins.entries.memory-core.config.dreaming` 아래에 있습니다.

<ParamField path="enabled" type="boolean" default="false">
  dreaming sweep을 활성화하거나 비활성화합니다.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  전체 dreaming sweep의 Cron cadence입니다.
</ParamField>
<ParamField path="model" type="string">
  선택적 Dream Diary subagent 모델 override입니다. subagent `allowedModels` allowlist도 설정하는 경우 canonical `provider/model` 값을 사용하세요.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  `MEMORY.md`로 승격되는 각 단기 recall snippet에서 유지되는 최대 추정 token count입니다. 랭킹 provenance는 계속 표시됩니다.
</ParamField>

<Warning>
`dreaming.model`에는 `plugins.entries.memory-core.subagent.allowModelOverride: true`가 필요합니다. 제한하려면 `plugins.entries.memory-core.subagent.allowedModels`도 설정하세요. trust 또는 allowlist 실패는 조용히 fallback하지 않고 계속 표시됩니다. 재시도는 model-unavailable 오류만 다룹니다.
</Warning>

<Note>
대부분의 phase policy, threshold, storage 동작은 내부 구현 세부 사항입니다. 전체 key 목록은 [Memory configuration reference](/ko/reference/memory-config#dreaming)를 참조하세요.
</Note>

## Dreams UI

활성화되면 Gateway **Dreams** 탭은 다음을 표시합니다.

- 현재 dreaming 활성화 상태
- phase-level status 및 managed-sweep 존재 여부
- short-term, grounded, signal, promoted-today count
- 다음 scheduled run timing
- 스테이징된 historical replay 항목을 위한 별도의 grounded Scene lane
- `doctor.memory.dreamDiary`가 backing하는 확장 가능한 Dream Diary reader

## Dreaming이 실행되지 않음: status가 blocked로 표시됨

`openclaw memory status`가 `Dreaming status: blocked`를 보고하면, managed cron은 존재하지만 default agent heartbeat가 실행되고 있지 않은 것입니다. default agent에 대해 heartbeat가 활성화되어 있고 target이 `none`이 아닌지 확인한 다음, 다음 heartbeat interval 이후 `openclaw memory status --deep`를 다시 실행하세요.

## 관련 항목

- [Memory](/ko/concepts/memory)
- [Memory CLI](/ko/cli/memory)
- [Memory configuration reference](/ko/reference/memory-config)
- [Memory search](/ko/concepts/memory-search)
