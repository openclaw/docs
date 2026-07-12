---
read_when:
    - 시맨틱 메모리를 인덱싱하거나 검색하려고 합니다
    - 메모리 가용성 또는 인덱싱을 디버깅하고 있습니다
    - 회상된 단기 기억을 `MEMORY.md`(으)로 승격하려고 합니다.
summary: '`openclaw memory`에 대한 CLI 참조(status/index/search/promote/promote-explain/rem-harness/rem-backfill)'
title: 메모리
x-i18n:
    generated_at: "2026-07-12T15:06:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

의미 기반 메모리 인덱싱, 검색 및 `MEMORY.md`로의 승격을 관리합니다.
번들로 제공되는 `memory-core` Plugin에서 제공하며,
`plugins.slots.memory`가 `memory-core`(기본값)를 선택할 때 사용할 수 있습니다. 다른 메모리
Plugin은 자체 CLI 네임스페이스를 제공합니다.

관련 항목: [메모리](/ko/concepts/memory) 개념, [Dreaming](/ko/concepts/dreaming),
[메모리 구성 참조](/ko/reference/memory-config), [메모리 Wiki](/ko/plugins/memory-wiki),
[Wiki](/ko/cli/wiki), [Plugin](/ko/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

`--agent`를 지정하지 않으면 `agents.list`의 모든 에이전트에 대해 실행합니다. 에이전트 목록이
구성되어 있지 않으면 기본 에이전트를 사용합니다.

| 플래그      | 효과                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | 벡터 저장소, 임베딩 제공자 및 의미 검색 준비 상태를 점검합니다(추가 제공자 호출이 수반됨). 일반 `memory status`는 빠르게 실행되며 이 점검을 건너뜁니다. 벡터/의미 상태가 알 수 없음이면 점검되지 않았다는 뜻입니다. QMD 어휘 `searchMode: "search"`는 `--deep`을 사용하더라도 항상 의미 벡터 점검을 건너뜁니다. |
| `--index`   | 저장소가 변경된 상태이면 다시 인덱싱합니다. `--deep`이 암시됩니다.                                                                                                                                                                                                                                                          |
| `--fix`     | 오래된 회상 잠금을 복구하고 승격 메타데이터를 정규화합니다.                                                                                                                                                                                                                                               |
| `--json`    | JSON을 출력합니다.                                                                                                                                                                                                                                                                                               |
| `--verbose` | 단계별 상세 로그를 출력합니다.                                                                                                                                                                                                                                                                             |

`dreaming.enabled: true`인 경우에도 `Dreaming` 줄이 계속 `off`로 표시되거나
예약된 정리 작업이 실행되지 않는 것처럼 보인다면, 관리되는 Dreaming Cron은
조정을 트리거하기 위해 기본 에이전트의 Heartbeat 실행에 의존합니다. 예약 세부 정보는
[Dreaming](/ko/concepts/dreaming)을 참조하십시오.

상태에는 `agents.defaults.memorySearch.extraPaths`의 추가 검색 경로도 표시됩니다.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

`status`와 동일한 에이전트별 범위가 적용됩니다. `--force`는 증분 재인덱싱 대신
전체 재인덱싱을 실행합니다. `--verbose`는 인덱싱 진행 상황을 표시하기 전에 에이전트별 제공자, 모델, 소스 및
추가 경로 세부 정보를 출력합니다.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- 쿼리: 위치 인수 `[query]` 또는 `--query <text>`입니다. 둘 다 설정하면 `--query`가
  우선합니다. 둘 다 설정하지 않으면 명령에서 오류가 발생합니다.
- `--agent <id>`: 기본 에이전트를 기본값으로 사용합니다(전체 에이전트 목록이 아님).
- `--max-results <n>`: 결과 수를 제한합니다(양의 정수).
- `--min-score <n>`: 이 점수보다 낮은 일치 항목을 제외합니다.

## `memory promote`

`memory/YYYY-MM-DD.md`의 단기 후보 순위를 매기고, 선택적으로
상위 항목을 `MEMORY.md`에 추가합니다.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| 플래그                     | 기본값       | 효과                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | 반환하거나 적용할 최대 후보 수입니다.                                   |
| `--min-score <n>`          | `0.75`       | 최소 가중 승격 점수입니다.                                 |
| `--min-recall-count <n>`   | `3`          | 필요한 최소 회상 횟수입니다.                                    |
| `--min-unique-queries <n>` | `2`          | 필요한 최소 고유 쿼리 수입니다.                            |
| `--apply`                  | 미리 보기만  | 선택한 후보를 `MEMORY.md`에 추가하고 승격된 것으로 표시합니다. |
| `--include-promoted`       |              | 이전 주기에 이미 승격된 후보를 포함합니다.           |
| `--json`                   |              | JSON을 출력합니다.                                                       |

이러한 CLI 기본값은 예약된 Dreaming 정리 작업의 심층 단계
임계값과 다릅니다(아래의 [Dreaming](#dreaming) 참조). 일회성 수동 실행에서
정리 작업 동작과 일치시키려면 플래그를 명시적으로 전달하십시오.

순위 신호에는 회상 빈도, 검색 관련성, 쿼리 다양성,
시간적 최신성, 날짜 간 통합 및 파생 개념의 풍부함이 포함되며,
메모리 회상과 일일 수집 과정 모두에서 가져옵니다. 또한 반복되는 Dreaming 재방문에는 light/REM 단계의
강화 부스트가 적용됩니다. 쓰기 전에 승격 과정이 현재 일일 메모를
다시 읽으므로, 순위 지정 이후 단기 스니펫을 편집하거나 삭제한 내용이
오래된 스냅샷에서 승격되는 대신 반영됩니다.

## `memory promote-explain`

한 승격 후보의 점수 세부 내역을 설명합니다.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>`는 후보의 키(정확히 일치하거나 부분 문자열), 경로 또는 스니펫 텍스트와 일치합니다.

## `memory rem-harness`

아무것도 기록하지 않고 REM 성찰, 진실 후보, 심층 단계 승격 출력을 미리 봅니다.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: 라이브 작업 공간 대신 과거 `YYYY-MM-DD.md`
  일일 파일을 사용하여 하네스를 초기화합니다.
- `--grounded`: 과거 노트를 기반으로 근거가 있는 `What Happened` / `Reflections` /
  `Possible Lasting Updates` 미리 보기도 렌더링합니다.

## `memory rem-backfill`

UI 검토를 위해 근거가 있는 과거 REM 요약을 `DREAMS.md`에 기록합니다.
되돌릴 수 있습니다.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: `--rollback`/`--rollback-short-term`을 설정하지 않은 경우 필수입니다.
  백필에 사용할 과거 일일 메모리 파일 또는 디렉터리입니다.
- `--stage-short-term`: 근거가 있는 영구 후보도 현재 단기 승격 저장소에
  시드하여 일반 심층 단계에서 후보의 순위를 지정할 수 있게 합니다.
- `--rollback`: 이전에 `DREAMS.md`에 기록한 근거가 있는 일기 항목을
  제거합니다.
- `--rollback-short-term`: 이전에 스테이징한 근거가 있는 단기
  후보를 제거합니다.

## Dreaming

Dreaming은 하나의 일정에 따라 순서대로 실행되는 세 가지 협력 단계로 구성된 백그라운드 메모리 통합 시스템입니다. **light**(단기 자료 정렬/준비), **REM**(성찰 및 주제 도출), **deep**(지속적으로 보존할 사실을 `MEMORY.md`로 승격) 단계가 있습니다. `MEMORY.md`에는 deep 단계만 기록합니다.

- `plugins.entries.memory-core.config.dreaming.enabled: true`으로 활성화합니다
  (기본값 `false`). `memory-core`는 스윕 Cron 작업을 자동으로 관리하므로 수동
  `openclaw cron add`이 필요하지 않습니다.
- 채팅에서 `/dreaming on|off`으로 전환하고, `/dreaming status`
  (또는 `/dreaming`/`/dreaming help`)으로 확인합니다. `on`/`off`에는 채널 소유자 상태
  또는 Gateway `operator.admin`이 필요합니다. `status` 및 도움말은 명령을
  호출할 수 있는 누구에게나 계속 제공됩니다.
- 사람이 읽을 수 있는 단계 출력은 `DREAMS.md`(또는 기존 `dreams.md`)에 기록됩니다.
  기본적으로(`dreaming.storage.mode: "separate"`) 각 단계는
  독립 실행형 보고서도 `memory/dreaming/<phase>/YYYY-MM-DD.md`에 작성합니다. 대신 보고서를 일일 메모리 파일에 통합하려면 `mode:
"inline"`으로 설정하고, 두 방식 모두 사용하려면 `"both"`으로
  설정합니다.
- 예약 및 수동 `memory promote` 실행은 동일한 심층 단계
  순위 지정 신호를 공유하며, 기본 임계값만 다릅니다(위 표와
  아래의 예약 실행 기본값을 참조하십시오).
- 예약 실행은 구성된 모든 에이전트의 메모리 작업 공간 전체로 병렬 확장됩니다.

예약 기본값(`plugins.entries.memory-core.config.dreaming`):

| 키                                     | 기본값      |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

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

전체 키 목록 및 단계별 세부 정보: [Dreaming](/ko/concepts/dreaming),
[메모리 구성 참조](/ko/reference/memory-config#dreaming).

## SecretRef Gateway 종속성

Active Memory 원격 API 키 필드가 SecretRef로 구성된 경우, `memory`
명령은 활성 Gateway 스냅샷에서 해당 필드를 확인합니다. Gateway를
사용할 수 없으면 명령이 즉시 실패합니다. 이를 위해서는 `secrets.resolve`
메서드를 지원하는 Gateway가 필요하며, 이전 Gateway는 알 수 없는 메서드 오류를 반환합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [메모리 개요](/ko/concepts/memory)
