---
read_when:
    - 저장된 세션 목록과 최근 활동을 확인하려고 합니다
summary: '`openclaw sessions`의 CLI 참조(저장된 세션 목록 + 사용법)'
title: 세션
x-i18n:
    generated_at: "2026-07-12T15:07:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29820bd34035ba3a6539950bd18dc671739eaeee9ddea3d57455c16b945caffa
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

저장된 대화 세션을 나열합니다.

세션 목록은 채널/제공자의 활성 상태를 확인하는 기능이 아닙니다. 세션 저장소에 영구 저장된
대화 행을 표시합니다. 조용한 Discord, Slack, Telegram 또는
기타 채널은 메시지가 처리되기 전까지 새 세션 행을 생성하지 않고도
성공적으로 다시 연결될 수 있습니다. 실시간 채널 연결 상태가 필요하면
`openclaw channels status --probe`, `openclaw status --deep` 또는
`openclaw health --verbose`를 사용하십시오.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

플래그:

| 플래그               | 설명                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | 구성된 에이전트 저장소 하나(기본값: 구성된 기본 에이전트).             |
| `--all-agents`       | 구성된 모든 에이전트 저장소를 집계합니다.                              |
| `--store <path>`     | 명시적 저장소 경로(`--agent` 또는 `--all-agents`와 함께 사용할 수 없음). |
| `--active <minutes>` | 지난 N분 이내에 업데이트된 세션만 표시합니다.                          |
| `--limit <n\|all>`   | 출력할 최대 행 수(기본값 `100`, `all`은 전체 출력을 복원함).           |
| `--json`             | 머신 판독 가능한 출력입니다.                                          |
| `--verbose`          | 상세 로깅입니다.                                                       |

`openclaw sessions`와 Gateway `sessions.list` RPC에는 기본적으로 제한이
적용되므로, 수명이 긴 대규모 저장소가 CLI 프로세스나 Gateway 이벤트 루프를
독점하지 않습니다. CLI는 기본적으로 최신 세션 100개를 반환합니다. 더 작거나
큰 범위를 지정하려면 `--limit <n>`을 전달하고, 의도적으로 전체 저장소가 필요하면
`--limit all`을 전달하십시오. 호출자가 더 많은 행이 있음을 표시해야 하는 경우
JSON 응답에 `totalCount`, `limitApplied`, `hasMore`가 포함됩니다.

RPC 클라이언트는 광범위한 통합 검색 소스를 유지하면서 현재 구성에 존재하는
에이전트의 행만 반환하도록 `configuredAgentsOnly: true`를 전달할 수 있습니다.
Control UI는 기본적으로 이 모드를 사용하므로 삭제되었거나 디스크에만 있는
에이전트 저장소가 Sessions 보기에 다시 나타나지 않습니다.

`--all-agents`는 구성된 에이전트 저장소를 읽습니다. Gateway와 ACP 세션
검색은 더 광범위합니다. 구성된 에이전트 루트 또는 템플릿화된 `session.store`
루트에서 확인된 SQLite 저장소도 포함합니다. 레거시 선택기 경로는 에이전트
루트 내부로 확인되어야 하며, 심볼릭 링크와 루트 외부 경로는 건너뜁니다.

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## 궤적 진행 상황 추적

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail`은 최근 런타임 궤적 이벤트를 간결한 진행 상황 행으로
표시합니다. `--session-key`가 없으면 먼저 실행 중인 세션을 추적한 다음
가장 최근에 저장된 세션을 추적합니다. `--tail <count>`는 추적 모드 전에
출력할 기존 이벤트 수를 제어합니다. 기본값은 `80`이며, `0`은 현재 끝에서
시작합니다. `--follow`는 선택한 SQLite 기반 세션 또는 명시적인 레거시
궤적 파일을 계속 감시합니다.

진행 상황 보기에는 의도적으로 보수적인 정책이 적용됩니다. 프롬프트 텍스트,
도구 인수 및 도구 결과 본문은 출력되지 않습니다. 도구 호출에는 도구 이름과
`{...redacted...}`가 표시되고, 도구 결과에는 `ok`, `error`, `done` 같은
상태가 표시되며, 모델 완료 행에는 제공자/모델 및 종료 상태가 표시됩니다.

## 궤적 번들 내보내기

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

소유자가 실행 요청을 승인한 후 `/export-trajectory` 슬래시 명령이 사용하는
명령 경로입니다. 출력 디렉터리는 항상 선택한 작업 공간 아래의
`.openclaw/trajectory-exports/` 내부로 확인됩니다.

## 정리 유지 관리

다음 쓰기 주기를 기다리지 않고 지금 유지 관리를 실행합니다.

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`은 구성의 `session.maintenance` 설정을 사용합니다
([구성 참조](/ko/gateway/config-agents#session)).

- 범위 참고: `openclaw sessions cleanup`은 세션 저장소,
  트랜스크립트, 궤적 행 및 레거시 궤적 사이드카를 유지 관리합니다.
  `cron.runLog.keepLines`에서 관리하는 Cron 실행 기록은
  정리하지 않습니다
  ([Cron 구성](/ko/automation/cron-jobs#configuration)).
- 정리 작업은 참조되지 않은 레거시/보관 트랜스크립트 아티팩트,
  Compaction 체크포인트 및 `session.maintenance.pruneAfter`보다 오래된
  궤적 사이드카도 정리합니다. SQLite 세션 행에서 계속 참조하는
  아티팩트는 보존됩니다.
- 정리 작업은 수명이 짧은 Gateway 모델 실행 프로브 정리를
  `modelRunPruned`로 별도 보고합니다. 이는
  `agent:*:explicit:model-run-<uuid>` 형식의 엄격하고 명시적인 키에만
  일치합니다. 보존 기간은 고정된 `24h`이며 압력 조건이 적용됩니다.
  세션 항목 유지 관리/상한 압력에 도달한 경우에만 오래된 프로브 행을
  제거합니다. 실행될 때 모델 실행 정리는 전역 오래된 항목 정리 및
  상한 적용보다 먼저 수행됩니다.

플래그:

| 플래그               | 설명                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 쓰지 않고 정리/상한 적용될 항목 수를 미리 봅니다. 텍스트 모드에서는 세션별 작업 표(`Action`, `Key`, `Age`, `Model`, `Flags`)와 세션 레이블별로 그룹화된 요약을 출력합니다.                                                                                                                                            |
| `--enforce`          | `session.maintenance.mode`가 `warn`인 경우에도 유지 관리를 적용합니다.                                                                                                                                                                                                                                                                     |
| `--fix-missing`      | 일반적으로 아직 기간/개수 기준을 초과하지 않았더라도 보관된 트랜스크립트 아티팩트가 없거나 헤더만 있거나 비어 있는 레거시 항목을 제거합니다.                                                                                                                                                                                                 |
| `--fix-dm-scope`     | `session.dmScope`가 `main`이면 이전 `per-peer`, `per-channel-peer` 또는 `per-account-channel-peer` 라우팅에서 남은 오래된 피어 키 기반 직접 DM 행을 폐기합니다. 먼저 `--dry-run`을 사용하십시오. 적용하면 SQLite에서 해당 행을 제거하고 레거시 트랜스크립트 아티팩트는 삭제된 보관 파일로 보존합니다. |
| `--active-key <key>` | 특정 활성 키를 디스크 예산 축출로부터 보호합니다. 그룹 세션 및 스레드 범위 채팅 세션 같은 영구 외부 대화 포인터도 기간/개수/디스크 예산 유지 관리에서 보존됩니다.                                                                                                                                                                            |
| `--agent <id>`       | 구성된 에이전트 저장소 하나에 대해 정리를 실행합니다.                                                                                                                                                                                                                                                                                     |
| `--all-agents`       | 구성된 모든 에이전트 저장소에 대해 정리를 실행합니다.                                                                                                                                                                                                                                                                                     |
| `--store <path>`     | 특정 레거시 저장소 선택기 경로를 대상으로 실행합니다.                                                                                                                                                                                                                                                                                     |
| `--json`             | JSON 요약을 출력합니다. `--all-agents`를 사용하면 출력에 저장소별 요약 하나가 포함됩니다.                                                                                                                                                                                                                                                   |

Gateway에 연결할 수 있는 경우, 구성된 에이전트 저장소에 대한 드라이런이 아닌
정리 작업은 Gateway를 통해 전송되므로 런타임 트래픽과 동일한 세션 저장소 작성기를
공유합니다. 레거시 저장소 선택기를 명시적으로 오프라인 복구하려면
`--store <path>`를 사용하십시오.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## 세션 압축

멈추었거나 지나치게 커진 세션의 컨텍스트 예산을 회수합니다. `openclaw sessions
compact <key>`는 `sessions.compact` Gateway RPC의 일급 래퍼이며 실행 중인
Gateway가 필요합니다.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines`가 없으면 Gateway LLM이 트랜스크립트를 요약합니다. CLI는
  기본적으로 클라이언트 기한을 적용하지 않으며, 구성된 Compaction 수명 주기는
  Gateway가 소유합니다.
- `--max-lines <n>`을 사용하면 마지막 `n`개 트랜스크립트 행으로 잘라내고
  이전 트랜스크립트를 `.bak` 사이드카로 보관합니다.
- `--agent <id>`: 세션을 소유한 에이전트이며 `global` 키에는 필수입니다.
- `--url` / `--token` / `--password`: Gateway 연결 재정의입니다.
- `--timeout <ms>`: 선택적인 클라이언트 측 RPC 제한 시간(밀리초)입니다.
- `--json`: 원시 RPC 페이로드를 출력합니다.

Gateway가 Compaction 실패를 보고하거나 연결할 수 없으면 명령이 0이 아닌
코드로 종료되므로 Cron과 스크립트가 아무 작업도 하지 않은 상태를 성공으로
잘못 판단하지 않습니다.

<Note>
`openclaw agent --message '/compact ...'`는 Compaction 경로가 **아닙니다**.
CLI의 슬래시 명령은 승인된 발신자 검사에서 거부됩니다. 이 호출은 아무 작업도
하지 않고 조용히 종료되는 대신 이 페이지를 안내하며 0이 아닌 코드로 종료됩니다.
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'`에서 허용하는 매개변수는 다음과 같습니다.

| 필드       | 유형        | 필수 여부 | 설명                                                         |
| ---------- | ----------- | --------- | ------------------------------------------------------------ |
| `key`      | string      | 예        | Compaction할 세션 키(예: `agent:main:main`)입니다.            |
| `agentId`  | string      | 아니요    | 세션을 소유한 에이전트 ID(`global` 키용)입니다.               |
| `maxLines` | integer ≥ 1 | 아니요    | LLM 요약 대신 마지막 N개 줄만 남기도록 잘라냅니다.           |

LLM 요약 응답 예시:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

자르기 응답 예시(`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## 관련 문서

- [세션 구성](/ko/gateway/config-agents#session)
- [세션 관리](/ko/concepts/session)
- [Compaction](/ko/concepts/compaction)
- [CLI 참조](/ko/cli)
