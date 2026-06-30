---
read_when:
    - 의미 기억을 색인화하거나 검색하려는 경우
    - 메모리 가용성 또는 인덱싱을 디버깅하는 중입니다
    - 회상된 단기 메모리를 `MEMORY.md`(으)로 승격하려는 경우
summary: '`openclaw memory`에 대한 CLI 참조 (status/index/search/promote/promote-explain/rem-harness)'
title: 메모리
x-i18n:
    generated_at: "2026-06-30T13:52:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

의미 기반 메모리 색인 및 검색을 관리합니다.
번들된 `memory-core` Plugin에서 제공합니다. 이 명령은
`plugins.slots.memory`가 `memory-core`를 선택할 때(기본값) 사용할 수 있습니다. 다른 메모리 Plugin은
자체 CLI 네임스페이스를 노출합니다.

관련 항목:

- 메모리 개념: [메모리](/ko/concepts/memory)
- 메모리 위키: [메모리 위키](/ko/plugins/memory-wiki)
- 위키 CLI: [wiki](/ko/cli/wiki)
- Plugin: [Plugin](/ko/tools/plugin)

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
- `--verbose`: 프로브 및 색인 작업 중 자세한 로그를 출력합니다.

`memory status`:

- `--deep`: 로컬 벡터 저장소 준비 상태, 임베딩 제공자 준비 상태, 의미 기반 벡터 검색 준비 상태를 프로브합니다. 일반 `memory status`는 빠르게 유지되며 라이브 임베딩 또는 제공자 검색 작업을 실행하지 않습니다. 알 수 없는 벡터 저장소 또는 의미 기반 벡터 상태는 해당 명령에서 프로브되지 않았음을 의미합니다. QMD 어휘 `searchMode: "search"`는 `--deep`을 사용해도 의미 기반 벡터 프로브와 임베딩 유지 관리를 건너뜁니다.
- `--index`: 저장소가 더티 상태이면 재색인을 실행합니다(`--deep`을 포함).
- `--fix`: 오래된 회수 잠금을 복구하고 승격 메타데이터를 정규화합니다.
- `--json`: JSON 출력을 인쇄합니다.

`memory status`에 `Dreaming status: blocked`가 표시되면 관리형 Dreaming Cron은 활성화되어 있지만 이를 구동하는 Heartbeat가 기본 에이전트에서 실행되지 않는 상태입니다. 두 가지 일반적인 원인은 [Dreaming이 실행되지 않음](/ko/concepts/dreaming#dreaming-never-runs-status-shows-blocked)을 참조하세요.

`memory index`:

- `--force`: 전체 재색인을 강제로 실행합니다.

`memory search`:

- 쿼리 입력: 위치 인수 `[query]` 또는 `--query <text>`를 전달합니다.
- 둘 다 제공되면 `--query`가 우선합니다.
- 둘 다 제공되지 않으면 명령이 오류와 함께 종료됩니다.
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--max-results <n>`: 반환되는 결과 수를 제한합니다.
- `--min-score <n>`: 낮은 점수의 일치를 필터링합니다.
- `--json`: JSON 결과를 인쇄합니다.

`memory promote`:

단기 메모리 승격을 미리 보고 적용합니다.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 승격 항목을 `MEMORY.md`에 씁니다(기본값: 미리 보기만).
- `--limit <n>` -- 표시할 후보 수의 상한을 설정합니다.
- `--include-promoted` -- 이전 주기에서 이미 승격된 항목을 포함합니다.

전체 옵션:

- 가중 승격 신호(`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`)를 사용하여 `memory/YYYY-MM-DD.md`의 단기 후보 순위를 매깁니다.
- 메모리 회수와 일일 수집 패스의 단기 신호, 그리고 light/REM 단계 강화 신호를 함께 사용합니다.
- Dreaming이 활성화되면 `memory-core`가 백그라운드에서 전체 스윕(`light -> REM -> deep`)을 실행하는 Cron 작업 하나를 자동으로 관리합니다(수동 `openclaw cron add`가 필요 없음).
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--limit <n>`: 반환/적용할 최대 후보 수입니다.
- `--min-score <n>`: 최소 가중 승격 점수입니다.
- `--min-recall-count <n>`: 후보에 필요한 최소 회수 횟수입니다.
- `--min-unique-queries <n>`: 후보에 필요한 최소 고유 쿼리 수입니다.
- `--apply`: 선택한 후보를 `MEMORY.md`에 추가하고 승격됨으로 표시합니다.
- `--include-promoted`: 이미 승격된 후보를 출력에 포함합니다.
- `--json`: JSON 출력을 인쇄합니다.

`memory promote-explain`:

특정 승격 후보와 점수 세부 내역을 설명합니다.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: 조회할 후보 키, 경로 조각 또는 스니펫 조각입니다.
- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--include-promoted`: 이미 승격된 후보를 포함합니다.
- `--json`: JSON 출력을 인쇄합니다.

`memory rem-harness`:

아무것도 쓰지 않고 REM 성찰, 후보 사실, deep 승격 출력을 미리 봅니다.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: 단일 에이전트로 범위를 제한합니다(기본값: 기본 에이전트).
- `--include-promoted`: 이미 승격된 deep 후보를 포함합니다.
- `--json`: JSON 출력을 인쇄합니다.

## Dreaming

Dreaming은 세 가지 협력 단계로 구성된 백그라운드 메모리 통합 시스템입니다.
단계는 **light**(단기 자료 정렬/스테이징), **deep**(`MEMORY.md`로 지속 가능한
사실 승격), **REM**(성찰 및 주제 노출)입니다.

- `plugins.entries.memory-core.config.dreaming.enabled: true`로 활성화합니다.
- 채팅에서 `/dreaming on|off`로 전환합니다(또는 `/dreaming status`로 확인).
  채널 호출자는 설정을 변경하려면 소유자여야 합니다. Gateway 클라이언트에는
  `operator.admin`이 필요합니다. 읽기 전용 상태와 도움말은 권한이 있는
  명령 발신자에게 계속 제공됩니다.
- Dreaming은 하나의 관리형 스윕 일정(`dreaming.frequency`)으로 실행되며 단계를 light, REM, deep 순서로 실행합니다.
- deep 단계만 `MEMORY.md`에 지속 메모리를 씁니다.
- 사람이 읽을 수 있는 단계 출력과 일지 항목은 `DREAMS.md`(또는 기존 `dreams.md`)에 작성되며, 선택적으로 `memory/dreaming/<phase>/YYYY-MM-DD.md`에 단계별 보고서를 작성합니다.
- 순위 지정은 가중 신호를 사용합니다. 회수 빈도, 검색 관련성, 쿼리 다양성, 시간적 최신성, 여러 날에 걸친 통합, 파생된 개념 풍부도입니다.
- 승격은 `MEMORY.md`에 쓰기 전에 라이브 일일 노트를 다시 읽으므로, 편집되거나 삭제된 단기 스니펫이 오래된 회수 저장소 스냅샷에서 승격되지 않습니다.
- 예약된 실행과 수동 `memory promote` 실행은 CLI 임계값 재정의를 전달하지 않는 한 동일한 deep 단계 기본값을 공유합니다.
- 자동 실행은 구성된 메모리 작업 공간 전체로 팬아웃됩니다.

기본 예약:

- **스윕 주기**: `dreaming.frequency = 0 3 * * *`
- **deep 임계값**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose`는 단계별 세부 정보(제공자, 모델, 소스, 배치 활동)를 인쇄합니다.
- `memory status`에는 `memorySearch.extraPaths`를 통해 구성된 추가 경로가 포함됩니다.
- 실질적으로 활성화된 메모리 원격 API 키 필드가 SecretRefs로 구성된 경우, 명령은 활성 Gateway 스냅샷에서 해당 값을 해석합니다. Gateway를 사용할 수 없으면 명령은 빠르게 실패합니다.
- Gateway 버전 불일치 참고: 이 명령 경로에는 `secrets.resolve`를 지원하는 Gateway가 필요합니다. 이전 Gateway는 알 수 없는 메서드 오류를 반환합니다.
- 예약된 스윕 주기는 `dreaming.frequency`로 조정합니다. deep 승격 정책은 `dreaming.phases.deep.maxPromotedSnippetTokens`를 제외하면 내부 정책입니다. 이 값은 출처를 보이게 유지하면서 승격된 스니펫 길이를 제한합니다. 일회성 수동 임계값 재정의가 필요하면 `memory promote`에서 CLI 플래그를 사용하세요.
- `memory rem-harness --path <file-or-dir> --grounded`는 아무것도 쓰지 않고 과거 일일 노트에서 근거 기반 `What Happened`, `Reflections`, `Possible Lasting Updates`를 미리 봅니다.
- `memory rem-backfill --path <file-or-dir>`는 UI 검토를 위해 되돌릴 수 있는 근거 기반 일지 항목을 `DREAMS.md`에 씁니다.
- `memory rem-backfill --path <file-or-dir> --stage-short-term`은 일반 deep 단계가 순위를 매길 수 있도록 근거 기반 지속 후보를 라이브 단기 승격 저장소에도 시드합니다.
- `memory rem-backfill --rollback`은 이전에 작성된 근거 기반 일지 항목을 제거하고, `memory rem-backfill --rollback-short-term`은 이전에 스테이징된 근거 기반 단기 후보를 제거합니다.
- 전체 단계 설명과 구성 참조는 [Dreaming](/ko/concepts/dreaming)을 참조하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [메모리 개요](/ko/concepts/memory)
