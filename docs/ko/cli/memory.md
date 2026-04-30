---
read_when:
    - 의미 메모리를 인덱싱하거나 검색하려는 경우
    - 메모리 가용성 또는 인덱싱을 디버깅하는 경우
    - 회상된 단기 메모리를 `MEMORY.md`로 승격하려고 합니다
summary: '`openclaw memory`의 CLI 참조 (status/index/search/promote/promote-explain/rem-harness)'
title: 메모리
x-i18n:
    generated_at: "2026-04-30T06:23:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

의미론적 메모리 인덱싱과 검색을 관리합니다.
활성 메모리 Plugin에서 제공합니다(기본값: `memory-core`; 비활성화하려면 `plugins.slots.memory = "none"` 설정).

관련 항목:

- 메모리 개념: [메모리](/ko/concepts/memory)
- 메모리 위키: [메모리 위키](/ko/plugins/memory-wiki)
- 위키 CLI: [wiki](/ko/cli/wiki)
- Plugins: [Plugins](/ko/tools/plugin)

## 예시

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
- `--verbose`: 프로브와 인덱싱 중 자세한 로그를 출력합니다.

`memory status`:

- `--deep`: 벡터 + 임베딩 사용 가능 여부를 프로브합니다. 일반 `memory status`는 빠르게 유지되며 라이브 임베딩 ping을 실행하지 않습니다. QMD 어휘 `searchMode: "search"`는 `--deep`이 있어도 의미론적 벡터 프로브와 임베딩 유지 관리를 건너뜁니다.
- `--index`: 저장소가 dirty 상태이면 재인덱싱을 실행합니다(`--deep` 암시).
- `--fix`: 오래된 recall 잠금을 복구하고 promotion 메타데이터를 정규화합니다.
- `--json`: JSON 출력을 표시합니다.

`memory status`에 `Dreaming status: blocked`가 표시되면 관리형 dreaming Cron은 활성화되어 있지만 이를 구동하는 Heartbeat가 기본 에이전트에서 실행되고 있지 않은 것입니다. 일반적인 두 가지 원인은 [Dreaming이 실행되지 않음](/ko/concepts/dreaming#dreaming-never-runs-status-shows-blocked)을 참조하세요.

`memory index`:

- `--force`: 전체 재인덱싱을 강제합니다.

`memory search`:

- 쿼리 입력: 위치 인수 `[query]` 또는 `--query <text>` 중 하나를 전달합니다.
- 둘 다 제공되면 `--query`가 우선합니다.
- 둘 다 제공되지 않으면 명령은 오류와 함께 종료됩니다.
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--max-results <n>`: 반환되는 결과 수를 제한합니다.
- `--min-score <n>`: 낮은 점수의 일치를 필터링합니다.
- `--json`: JSON 결과를 표시합니다.

`memory promote`:

단기 메모리 promotion을 미리 보고 적용합니다.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promotion을 `MEMORY.md`에 씁니다(기본값: 미리 보기만).
- `--limit <n>` -- 표시되는 후보 수를 제한합니다.
- `--include-promoted` -- 이전 주기에서 이미 promoted된 항목을 포함합니다.

전체 옵션:

- 가중 promotion 신호(`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)를 사용해 `memory/YYYY-MM-DD.md`의 단기 후보 순위를 매깁니다.
- 메모리 recall 및 일일 ingestion 패스의 단기 신호와 light/REM 단계 reinforcement 신호를 함께 사용합니다.
- Dreaming이 활성화되면 `memory-core`는 백그라운드에서 전체 sweep(`light -> REM -> deep`)을 실행하는 Cron 작업 하나를 자동 관리합니다(수동 `openclaw cron add` 불필요).
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--limit <n>`: 반환/적용할 최대 후보 수입니다.
- `--min-score <n>`: 최소 가중 promotion 점수입니다.
- `--min-recall-count <n>`: 후보에 필요한 최소 recall 횟수입니다.
- `--min-unique-queries <n>`: 후보에 필요한 최소 고유 쿼리 수입니다.
- `--apply`: 선택한 후보를 `MEMORY.md`에 추가하고 promoted로 표시합니다.
- `--include-promoted`: 이미 promoted된 후보를 출력에 포함합니다.
- `--json`: JSON 출력을 표시합니다.

`memory promote-explain`:

특정 promotion 후보와 해당 점수 breakdown을 설명합니다.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 조회할 후보 키, 경로 조각 또는 snippet 조각입니다.
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--include-promoted`: 이미 promoted된 후보를 포함합니다.
- `--json`: JSON 출력을 표시합니다.

`memory rem-harness`:

아무것도 쓰지 않고 REM reflections, 후보 truths, deep promotion 출력을 미리 봅니다.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--include-promoted`: 이미 promoted된 deep 후보를 포함합니다.
- `--json`: JSON 출력을 표시합니다.

## Dreaming

Dreaming은 세 가지 협력 단계로 이루어진 백그라운드 메모리 consolidation 시스템입니다.
단계는 **light**(단기 자료 정렬/스테이징), **deep**(지속성 있는
facts를 `MEMORY.md`로 promote), **REM**(성찰 및 주제 표면화)입니다.

- `plugins.entries.memory-core.config.dreaming.enabled: true`로 활성화합니다.
- 채팅에서 `/dreaming on|off`로 전환합니다(또는 `/dreaming status`로 확인).
- Dreaming은 하나의 관리형 sweep 일정(`dreaming.frequency`)에서 실행되며 light, REM, deep 순서로 단계를 실행합니다.
- deep 단계만 지속성 있는 메모리를 `MEMORY.md`에 씁니다.
- 사람이 읽을 수 있는 단계 출력과 diary 항목은 `DREAMS.md`(또는 기존 `dreams.md`)에 기록되며, 선택적으로 `memory/dreaming/<phase>/YYYY-MM-DD.md`에 단계별 보고서가 기록됩니다.
- 순위 지정은 가중 신호를 사용합니다: recall 빈도, retrieval 관련성, 쿼리 다양성, 시간적 최신성, cross-day consolidation, 파생 concept richness.
- Promotion은 `MEMORY.md`에 쓰기 전에 라이브 일일 노트를 다시 읽으므로, 편집되거나 삭제된 단기 snippet은 오래된 recall 저장소 snapshot에서 promoted되지 않습니다.
- 예약 실행과 수동 `memory promote` 실행은 CLI 임계값 override를 전달하지 않는 한 동일한 deep 단계 기본값을 공유합니다.
- 자동 실행은 구성된 메모리 워크스페이스 전체로 fan out됩니다.

기본 일정:

- **Sweep 주기**: `dreaming.frequency = 0 3 * * *`
- **Deep 임계값**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

예시:

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

- `memory index --verbose`는 단계별 세부 정보(provider, model, sources, batch activity)를 출력합니다.
- `memory status`에는 `memorySearch.extraPaths`를 통해 구성된 추가 경로가 포함됩니다.
- 실질적으로 활성 메모리 원격 API 키 필드가 SecretRefs로 구성된 경우, 이 명령은 활성 Gateway snapshot에서 해당 값을 해석합니다. Gateway를 사용할 수 없으면 명령은 빠르게 실패합니다.
- Gateway 버전 불일치 참고: 이 명령 경로에는 `secrets.resolve`를 지원하는 Gateway가 필요합니다. 이전 Gateway는 unknown-method 오류를 반환합니다.
- 예약된 sweep 주기는 `dreaming.frequency`로 조정합니다. deep promotion 정책은 그 외에는 내부적입니다. 일회성 수동 override가 필요하면 `memory promote`에서 CLI 플래그를 사용하세요.
- `memory rem-harness --path <file-or-dir> --grounded`는 아무것도 쓰지 않고 과거 일일 노트에서 grounded `What Happened`, `Reflections`, `Possible Lasting Updates`를 미리 봅니다.
- `memory rem-backfill --path <file-or-dir>`는 UI review를 위해 되돌릴 수 있는 grounded diary 항목을 `DREAMS.md`에 씁니다.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`는 정상 deep 단계에서 순위를 매길 수 있도록 grounded 지속 후보도 라이브 단기 promotion 저장소에 seed합니다.
- `memory rem-backfill --rollback`은 이전에 작성된 grounded diary 항목을 제거하고, `memory rem-backfill --rollback-short-term`은 이전에 스테이징된 grounded 단기 후보를 제거합니다.
- 전체 단계 설명과 구성 reference는 [Dreaming](/ko/concepts/dreaming)을 참조하세요.

## 관련 항목

- [CLI reference](/ko/cli)
- [메모리 개요](/ko/concepts/memory)
