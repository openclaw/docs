---
read_when:
    - 메모리 승격이 자동으로 실행되기를 원합니다.
    - 각 Dreaming 단계가 무엇을 하는지 이해하고 싶습니다.
    - MEMORY.md를 오염시키지 않고 통합을 조정하고 싶습니다.
summary: Dream Diary가 포함된 light, deep, REM 단계의 백그라운드 메모리 통합
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T14:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming은 `memory-core`의 백그라운드 메모리 통합 시스템입니다.
강한 단기 신호를 영속 메모리로 옮기도록 OpenClaw를 돕는 동시에,
과정을 설명 가능하고 검토 가능하게 유지합니다.

Dreaming은 **옵트인**이며 기본적으로 비활성화되어 있습니다.

## Dreaming이 기록하는 내용

Dreaming은 두 종류의 출력을 유지합니다:

- `memory/.dreams/`의 **기계 상태**(recall 저장소, 단계 신호, 수집 체크포인트, 잠금).
- `DREAMS.md`(또는 기존 `dreams.md`)의 **사람이 읽을 수 있는 출력** 및 선택적 단계 보고서 파일(`memory/dreaming/<phase>/YYYY-MM-DD.md` 아래).

장기 승격은 여전히 `MEMORY.md`에만 기록됩니다.

## 단계 모델

Dreaming은 협력적으로 동작하는 세 단계로 구성됩니다:

| 단계 | 목적                                      | 영속 기록         |
| ----- | ----------------------------------------- | ----------------- |
| Light | 최근 단기 자료를 정렬하고 준비            | 아니오            |
| Deep  | 영속 후보를 점수화하고 승격               | 예 (`MEMORY.md`) |
| REM   | 주제와 반복되는 아이디어를 성찰            | 아니오            |

이 단계들은 별도의 사용자 구성 "모드"가 아니라 내부 구현 세부 사항입니다.

### Light 단계

Light 단계는 최근 일일 메모리 신호와 recall trace를 수집하고, 중복을 제거하며,
후보 라인을 준비합니다.

- 사용 가능한 경우 단기 recall 상태, 최근 일일 메모리 파일, 마스킹된 세션 transcript를 읽습니다.
- 저장소에 인라인 출력이 포함된 경우 관리되는 `## Light Sleep` 블록을 기록합니다.
- 이후 Deep 순위 산정을 위한 강화 신호를 기록합니다.
- `MEMORY.md`에는 절대 기록하지 않습니다.

### Deep 단계

Deep 단계는 무엇이 장기 메모리가 될지 결정합니다.

- 가중 점수와 임계값 게이트를 사용해 후보의 순위를 매깁니다.
- 통과하려면 `minScore`, `minRecallCount`, `minUniqueQueries`가 필요합니다.
- 기록 전에 활성 일일 파일에서 스니펫을 다시 hydrate하므로, 오래되었거나 삭제된 스니펫은 건너뜁니다.
- 승격된 항목을 `MEMORY.md`에 추가합니다.
- `DREAMS.md`에 `## Deep Sleep` 요약을 기록하고, 선택적으로 `memory/dreaming/deep/YYYY-MM-DD.md`에도 기록합니다.

### REM 단계

REM 단계는 패턴과 성찰 신호를 추출합니다.

- 최근 단기 trace를 바탕으로 주제 및 성찰 요약을 만듭니다.
- 저장소에 인라인 출력이 포함된 경우 관리되는 `## REM Sleep` 블록을 기록합니다.
- Deep 순위 산정에 사용되는 REM 강화 신호를 기록합니다.
- `MEMORY.md`에는 절대 기록하지 않습니다.

## 세션 transcript 수집

Dreaming은 마스킹된 세션 transcript를 Dreaming 코퍼스로 수집할 수 있습니다. Transcript를 사용할 수 있으면 일일 메모리 신호 및 recall trace와 함께 Light 단계로 입력됩니다. 개인 정보 및 민감한 콘텐츠는 수집 전에 마스킹됩니다.

## Dream Diary

Dreaming은 또한 `DREAMS.md`에 서술형 **Dream Diary**를 유지합니다.
각 단계에 충분한 자료가 쌓이면 `memory-core`는 최선의 노력 방식으로 백그라운드
subagent 턴을 실행하고(기본 런타임 모델 사용), 짧은 일기 항목을 추가합니다.

이 일기는 메모리 승격 소스가 아니라 Dreams UI에서 사람이 읽기 위한 것입니다.
Dreaming이 생성한 일기/보고서 아티팩트는 단기 승격에서 제외됩니다.
근거가 있는 메모리 스니펫만 `MEMORY.md`로 승격될 수 있습니다.

검토 및 복구 작업을 위한 근거 기반 과거 backfill 경로도 있습니다:

- `memory rem-harness --path ... --grounded`는 과거 `YYYY-MM-DD.md` 노트에서 근거 기반 일기 출력을 미리 봅니다.
- `memory rem-backfill --path ...`는 되돌릴 수 있는 근거 기반 일기 항목을 `DREAMS.md`에 기록합니다.
- `memory rem-backfill --path ... --stage-short-term`은 근거 기반 영속 후보를, 일반 Deep 단계가 이미 사용하는 동일한 단기 증거 저장소에 준비합니다.
- `memory rem-backfill --rollback` 및 `--rollback-short-term`은 일반 일기 항목이나 활성 단기 recall을 건드리지 않고 이러한 준비된 backfill 아티팩트를 제거합니다.

Control UI는 동일한 일기 backfill/reset 흐름을 노출하므로, 근거 기반 후보를 승격할 가치가 있는지 결정하기 전에 Dreams 장면에서 결과를 검사할 수 있습니다. 이 장면은 또한 별도의 근거 기반 레인을 보여주므로, 어떤 준비된 단기 항목이 과거 재생에서 왔는지, 어떤 승격 항목이 근거 기반 주도였는지 확인할 수 있고, 일반 활성 단기 상태를 건드리지 않고 근거 기반 전용 준비 항목만 지울 수 있습니다.

## Deep 순위 신호

Deep 순위 산정은 여섯 가지 가중 기본 신호와 단계 강화 신호를 사용합니다:

| 신호               | 가중치 | 설명                                           |
| ------------------ | ------ | ---------------------------------------------- |
| 빈도               | 0.24   | 항목이 축적한 단기 신호 수                     |
| 관련성             | 0.30   | 항목의 평균 검색 품질                          |
| 쿼리 다양성        | 0.15   | 이를 드러낸 고유 쿼리/일 컨텍스트              |
| 최신성             | 0.15   | 시간 감쇠 기반 신선도 점수                     |
| 통합               | 0.10   | 여러 날짜에 걸친 반복 강도                     |
| 개념적 풍부함      | 0.06   | 스니펫/경로의 개념 태그 밀도                   |

Light 및 REM 단계 적중은
`memory/.dreams/phase-signals.json`에서 최신성 감쇠 기반의 작은 부스트를 추가합니다.

## 스케줄링

활성화되면 `memory-core`는 전체 Dreaming 스윕을 위한 Cron 작업 하나를 자동 관리합니다. 각 스윕은 Light -> REM -> Deep 순서로 단계를 실행합니다.

기본 주기 동작:

| 설정                 | 기본값      |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## 빠른 시작

Dreaming 활성화:

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

사용자 지정 스윕 주기로 Dreaming 활성화:

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

## 슬래시 명령

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 워크플로

미리 보기 또는 수동 적용에는 CLI 승격을 사용하세요:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

수동 `memory promote`는 CLI 플래그로 재정의하지 않는 한 기본적으로 Deep 단계 임계값을 사용합니다.

특정 후보가 왜 승격되거나 승격되지 않는지 설명하기:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

아무 것도 기록하지 않고 REM 성찰, 후보 truth, Deep 승격 출력을 미리 보기:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 주요 기본값

모든 설정은 `plugins.entries.memory-core.config.dreaming` 아래에 있습니다.

| 키          | 기본값      |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

단계 정책, 임계값, 저장소 동작은 내부 구현 세부 사항이며 사용자 대상 config가 아닙니다.

전체 키 목록은 [Memory configuration reference](/ko/reference/memory-config#dreaming)를 참조하세요.

## Dreams UI

활성화되면 Gateway의 **Dreams** 탭에 다음이 표시됩니다:

- 현재 Dreaming 활성화 상태
- 단계 수준 상태 및 관리되는 스윕 존재 여부
- 단기, 근거 기반, 신호, 오늘 승격 수
- 다음 예약 실행 시각
- 준비된 과거 재생 항목을 위한 별도의 근거 기반 장면 레인
- `doctor.memory.dreamDiary`를 기반으로 하는 확장 가능한 Dream Diary 리더

## 문제 해결

### Dreaming이 전혀 실행되지 않음(상태가 blocked로 표시됨)

관리되는 Dreaming Cron은 기본 에이전트의 Heartbeat를 따라갑니다. 해당 에이전트에서 Heartbeat가 발생하지 않으면 Cron은 아무도 소비하지 않는 시스템 이벤트를 대기열에 넣고, Dreaming은 조용히 실행되지 않습니다. `openclaw memory status`와 `/dreaming status` 모두 이런 경우 `blocked`를 보고하고, 어떤 에이전트의 Heartbeat가 문제인지 이름을 보여줍니다.

흔한 원인은 두 가지입니다:

- 다른 에이전트가 명시적인 `heartbeat:` 블록을 선언한 경우. `agents.list`의 어떤 항목이든 자체 `heartbeat` 블록을 가지면, Heartbeat는 해당 에이전트들에서만 발생하고 기본값은 더 이상 모두에게 적용되지 않으므로 기본 에이전트가 조용해질 수 있습니다. Heartbeat 설정을 `agents.defaults.heartbeat`로 옮기거나, 기본 에이전트에 명시적인 `heartbeat` 블록을 추가하세요. [Scope and precedence](/ko/gateway/heartbeat#scope-and-precedence)를 참조하세요.
- `heartbeat.every`가 `0`, 비어 있음, 또는 파싱할 수 없는 값인 경우. Cron이 스케줄 기준으로 사용할 간격이 없으므로 Heartbeat가 사실상 비활성화됩니다. `every`를 `30m` 같은 양의 기간으로 설정하세요. [Defaults](/ko/gateway/heartbeat#defaults)를 참조하세요.

## 관련

- [Heartbeat](/ko/gateway/heartbeat)
- [Memory](/ko/concepts/memory)
- [Memory Search](/ko/concepts/memory-search)
- [memory CLI](/ko/cli/memory)
- [Memory configuration reference](/ko/reference/memory-config)
