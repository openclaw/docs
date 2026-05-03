---
read_when:
    - 의미 메모리를 색인화하거나 검색하려는 경우
    - 메모리 가용성 또는 인덱싱을 디버깅하는 중입니다
    - 불러온 단기 기억을 `MEMORY.md`(으)로 승격하려고 합니다
summary: '`openclaw memory`에 대한 CLI 참조 (status/index/search/promote/promote-explain/rem-harness)'
title: 메모리
x-i18n:
    generated_at: "2026-05-03T21:28:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

의미 기반 메모리 인덱싱 및 검색을 관리합니다.
Active Memory Plugin에서 제공합니다(기본값: `memory-core`; 비활성화하려면 `plugins.slots.memory = "none"` 설정).

관련 항목:

- 메모리 개념: [메모리](/ko/concepts/memory)
- 메모리 위키: [메모리 위키](/ko/plugins/memory-wiki)
- 위키 CLI: [wiki](/ko/cli/wiki)
- Plugins: [Plugins](/ko/tools/plugin)

## 예제

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 옵션

`memory status` 및 `memory index`:

- `--agent <id>`: 단일 에이전트로 범위를 제한합니다. 이 옵션이 없으면 이러한 명령은 구성된 각 에이전트에 대해 실행됩니다. 에이전트 목록이 구성되어 있지 않으면 기본 에이전트로 대체됩니다.
- `--verbose`: 프로브 및 인덱싱 중 자세한 로그를 출력합니다.

`memory status`:

- `--deep`: 로컬 벡터 저장소 준비 상태, 임베딩 제공자 준비 상태, 의미 기반 벡터 검색 준비 상태를 프로브합니다. 일반 `memory status`는 빠르게 유지되며 라이브 임베딩 또는 제공자 탐색 작업을 실행하지 않습니다. 알 수 없는 벡터 저장소 또는 의미 기반 벡터 상태는 해당 명령에서 프로브되지 않았다는 뜻입니다. QMD 어휘 `searchMode: "search"`는 `--deep`을 사용하더라도 의미 기반 벡터 프로브와 임베딩 유지 관리를 건너뜁니다.
- `--index`: 저장소가 dirty 상태이면 재인덱싱을 실행합니다(`--deep`을 암시).
- `--fix`: 오래된 recall lock을 복구하고 promotion 메타데이터를 정규화합니다.
- `--json`: JSON 출력을 인쇄합니다.

`memory status`에 `Dreaming status: blocked`가 표시되면 관리형 Dreaming Cron은 활성화되어 있지만 이를 구동하는 Heartbeat가 기본 에이전트에 대해 실행되고 있지 않은 것입니다. 두 가지 일반적인 원인은 [Dreaming이 실행되지 않음](/ko/concepts/dreaming#dreaming-never-runs-status-shows-blocked)을 참조하세요.

`memory index`:

- `--force`: 전체 재인덱싱을 강제합니다.

`memory search`:

- 쿼리 입력: 위치 인수 `[query]` 또는 `--query <text>` 중 하나를 전달합니다.
- 둘 다 제공되면 `--query`가 우선합니다.
- 둘 다 제공되지 않으면 명령은 오류와 함께 종료됩니다.
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--max-results <n>`: 반환되는 결과 수를 제한합니다.
- `--min-score <n>`: 낮은 점수의 일치를 필터링합니다.
- `--json`: JSON 결과를 인쇄합니다.

`memory promote`:

단기 메모리 promotion을 미리 보고 적용합니다.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promotion을 `MEMORY.md`에 씁니다(기본값: 미리 보기만).
- `--limit <n>` -- 표시할 후보 수를 제한합니다.
- `--include-promoted` -- 이전 주기에서 이미 promoted된 항목을 포함합니다.

전체 옵션:

- 가중 promotion 신호(`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)를 사용해 `memory/YYYY-MM-DD.md`의 단기 후보 순위를 매깁니다.
- 메모리 recall과 일일 수집 패스의 단기 신호, 그리고 light/REM 단계 강화 신호를 사용합니다.
- Dreaming이 활성화되면 `memory-core`는 백그라운드에서 전체 스윕(`light -> REM -> deep`)을 실행하는 하나의 Cron 작업을 자동 관리합니다(수동 `openclaw cron add` 필요 없음).
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--limit <n>`: 반환/적용할 최대 후보 수입니다.
- `--min-score <n>`: 최소 가중 promotion 점수입니다.
- `--min-recall-count <n>`: 후보에 필요한 최소 recall 횟수입니다.
- `--min-unique-queries <n>`: 후보에 필요한 최소 고유 쿼리 수입니다.
- `--apply`: 선택한 후보를 `MEMORY.md`에 추가하고 promoted로 표시합니다.
- `--include-promoted`: 이미 promoted된 후보를 출력에 포함합니다.
- `--json`: JSON 출력을 인쇄합니다.

`memory promote-explain`:

특정 promotion 후보와 해당 점수 분해를 설명합니다.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 조회할 후보 키, 경로 조각 또는 스니펫 조각입니다.
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--include-promoted`: 이미 promoted된 후보를 포함합니다.
- `--json`: JSON 출력을 인쇄합니다.

`memory rem-harness`:

아무것도 쓰지 않고 REM reflections, 후보 truths, deep promotion 출력을 미리 봅니다.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--include-promoted`: 이미 promoted된 deep 후보를 포함합니다.
- `--json`: JSON 출력을 인쇄합니다.

## Dreaming

Dreaming은 세 가지 협력 단계로 구성된 백그라운드 메모리 통합 시스템입니다.
**light**(단기 자료 정렬/스테이징), **deep**(지속 가능한 사실을
`MEMORY.md`로 promote), **REM**(성찰 및 주제 표면화).

- `plugins.entries.memory-core.config.dreaming.enabled: true`로 활성화합니다.
- 채팅에서 `/dreaming on|off`로 전환합니다(또는 `/dreaming status`로 확인).
- Dreaming은 하나의 관리형 스윕 일정(`dreaming.frequency`)으로 실행되며 light, REM, deep 순서로 단계를 실행합니다.
- deep 단계만 지속 메모리를 `MEMORY.md`에 씁니다.
- 사람이 읽을 수 있는 단계 출력과 일기 항목은 `DREAMS.md`(또는 기존 `dreams.md`)에 쓰이며, 선택적으로 단계별 보고서는 `memory/dreaming/<phase>/YYYY-MM-DD.md`에 기록됩니다.
- 순위 지정은 recall 빈도, 검색 관련성, 쿼리 다양성, 시간적 최신성, 날짜 간 통합, 파생 개념 풍부도라는 가중 신호를 사용합니다.
- Promotion은 `MEMORY.md`에 쓰기 전에 라이브 일일 노트를 다시 읽으므로, 편집되거나 삭제된 단기 스니펫은 오래된 recall-store 스냅샷에서 promoted되지 않습니다.
- 예약 및 수동 `memory promote` 실행은 CLI 임계값 오버라이드를 전달하지 않는 한 동일한 deep 단계 기본값을 공유합니다.
- 자동 실행은 구성된 메모리 워크스페이스 전체로 fan out됩니다.

기본 일정:

- **스윕 주기**: `dreaming.frequency = 0 3 * * *`
- **Deep 임계값**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

예제:

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

참고:

- `memory index --verbose`는 단계별 세부 정보(제공자, 모델, 소스, 배치 활동)를 인쇄합니다.
- `memory status`는 `memorySearch.extraPaths`를 통해 구성된 추가 경로를 포함합니다.
- 실제로 활성화된 Active Memory 원격 API 키 필드가 SecretRefs로 구성된 경우, 명령은 활성 Gateway 스냅샷에서 해당 값을 확인합니다. Gateway를 사용할 수 없으면 명령이 빠르게 실패합니다.
- Gateway 버전 불일치 참고: 이 명령 경로에는 `secrets.resolve`를 지원하는 Gateway가 필요합니다. 이전 Gateway는 알 수 없는 메서드 오류를 반환합니다.
- 예약된 스윕 주기는 `dreaming.frequency`로 조정합니다. Deep promotion 정책은 그 외에는 내부 정책입니다. 일회성 수동 오버라이드가 필요할 때는 `memory promote`에서 CLI 플래그를 사용하세요.
- `memory rem-harness --path <file-or-dir> --grounded`는 아무것도 쓰지 않고 과거 일일 노트에서 근거 기반 `What Happened`, `Reflections`, `Possible Lasting Updates`를 미리 봅니다.
- `memory rem-backfill --path <file-or-dir>`는 UI 검토를 위해 되돌릴 수 있는 근거 기반 일기 항목을 `DREAMS.md`에 씁니다.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`은 근거 기반 지속 후보도 라이브 단기 promotion 저장소에 시드하여 일반 deep 단계가 순위를 매길 수 있게 합니다.
- `memory rem-backfill --rollback`은 이전에 쓴 근거 기반 일기 항목을 제거하고, `memory rem-backfill --rollback-short-term`은 이전에 스테이징한 근거 기반 단기 후보를 제거합니다.
- 전체 단계 설명 및 구성 참조는 [Dreaming](/ko/concepts/dreaming)을 참조하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [메모리 개요](/ko/concepts/memory)
