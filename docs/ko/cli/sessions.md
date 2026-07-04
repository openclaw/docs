---
read_when:
    - 저장된 세션을 나열하고 최근 활동을 확인하려고 합니다
summary: '`openclaw sessions`용 CLI 참조(저장된 세션 목록 + 사용법)'
title: 세션
x-i18n:
    generated_at: "2026-07-04T20:28:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

저장된 대화 세션을 나열합니다.

세션 목록은 채널/제공자 활성 상태 검사가 아닙니다. 세션 저장소에 유지된
대화 행을 표시합니다. 조용한 Discord, Slack, Telegram 또는 다른 채널은
메시지가 처리되어 새 세션 행이 생성되기 전에도 성공적으로 다시 연결될 수
있습니다. 실시간 채널 연결 상태가 필요하면 `openclaw channels status --probe`,
`openclaw status --deep` 또는 `openclaw health --verbose`를 사용하세요.

`openclaw sessions`와 Gateway `sessions.list` 응답은 기본적으로 제한되어
있으므로, 크고 오래 유지되는 저장소가 CLI 프로세스나 Gateway 이벤트 루프를
독점할 수 없습니다. CLI는 기본적으로 최신 세션 100개를 반환합니다. 더 작거나
큰 범위가 필요하면 `--limit <n>`을 전달하고, 의도적으로 전체 저장소가 필요할
때는 `--limit all`을 전달하세요. 호출자가 더 많은 행이 있음을 표시해야 할 때를
위해 JSON 응답에는 `totalCount`, `limitApplied`, `hasMore`가 포함됩니다.

RPC 클라이언트는 `configuredAgentsOnly: true`를 전달하여 넓은 통합 검색
소스는 유지하되 현재 구성에 있는 에이전트의 행만 반환할 수 있습니다.
Control UI는 기본적으로 이 모드를 사용하므로 삭제되었거나 디스크에만 있는
에이전트 저장소가 Sessions 보기에서 다시 나타나지 않습니다.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

범위 선택:

- 기본값: 구성된 기본 에이전트 저장소
- `--verbose`: 자세한 로깅
- `--agent <id>`: 구성된 에이전트 저장소 하나
- `--all-agents`: 구성된 모든 에이전트 저장소 집계
- `--store <path>`: 명시적 저장소 경로(`--agent` 또는 `--all-agents`와 함께 사용할 수 없음)
- `--limit <n|all>`: 출력할 최대 행 수(기본값 `100`; `all`은 전체 출력을 복원)

저장된 세션의 사람이 읽을 수 있는 트래젝터리 진행 상황을 tail합니다.

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail`은 최근 트래젝터리 JSONL 이벤트를 간결한 진행
상태 줄로 렌더링합니다. `--session-key`가 없으면 먼저 실행 중인 세션을
tail한 다음, 최신 저장 세션을 tail합니다. `--tail <count>`는 follow 모드 전에
출력할 기존 이벤트 수를 제어합니다. 기본값은 `80`이며, `0`은 현재 끝에서
시작합니다. `--follow`는 `<session>.trajectory-path.json`이 참조하는 이동된
파일을 포함해 선택한 트래젝터리 파일을 계속 감시합니다.

진행 보기에는 의도적으로 보수적인 정보만 표시됩니다. 프롬프트 텍스트, 도구
인수, 도구 결과 본문은 출력되지 않습니다. 도구 호출은 도구 이름과
`{...redacted...}`를 표시합니다. 도구 결과는 `ok`, `error`, `done` 같은 상태를
표시합니다. 모델 완료 줄은 제공자/모델과 터미널 상태를 표시합니다.

저장된 세션의 트래젝터리 번들을 내보냅니다.

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

이는 소유자가 exec 요청을 승인한 뒤 `/export-trajectory` 슬래시 명령이
사용하는 명령 경로입니다. 출력 디렉터리는 항상 선택한 작업 영역 아래의
`.openclaw/trajectory-exports/` 내부로 해석됩니다.

`openclaw sessions --all-agents`는 구성된 에이전트 저장소를 읽습니다. Gateway와
ACP 세션 검색은 더 넓습니다. 기본 `agents/` 루트 또는 템플릿화된
`session.store` 루트 아래에서 발견된 디스크 전용 저장소도 포함합니다. 발견된
저장소는 에이전트 루트 내부의 일반 `sessions.json` 파일로 해석되어야 하며,
심볼릭 링크와 루트 밖 경로는 건너뜁니다.

JSON 예:

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
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## 정리 유지보수

다음 쓰기 주기를 기다리지 않고 지금 유지보수를 실행합니다.

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`은 구성의 `session.maintenance` 설정을 사용합니다.

- 범위 참고: `openclaw sessions cleanup`은 세션 저장소, 트랜스크립트, 트래젝터리 사이드카를 유지보수합니다. Cron 실행 기록은 정리하지 않으며, 이는 [Cron 구성](/ko/automation/cron-jobs#configuration)의 `cron.runLog.keepLines`가 관리하고 [Cron 유지보수](/ko/automation/cron-jobs#maintenance)에서 설명합니다.
- 정리는 `session.maintenance.pruneAfter`보다 오래된 참조되지 않는 기본 트랜스크립트, Compaction 체크포인트, 트래젝터리 사이드카도 제거합니다. `sessions.json`이 아직 참조하는 파일은 보존됩니다.
- 정리는 수명이 짧은 Gateway 모델 실행 프로브 정리를 `modelRunPruned`로 별도 보고합니다. 이는 `agent:*:explicit:model-run-<uuid>` 형태의 엄격하고 명시적인 키에만 일치합니다. 고정 보존 기간은 `24h`이지만, 압력 기반으로 제한됩니다. 세션 항목 유지보수/상한 압력에 도달했을 때만 오래된 프로브 행을 제거합니다. 실행될 때 모델 실행 정리는 전역 오래된 항목 정리와 상한 적용 전에 수행됩니다.

- `--dry-run`: 쓰기 없이 몇 개의 항목이 제거/상한 적용될지 미리 봅니다.
  - 텍스트 모드에서 dry-run은 세션별 작업 표(`Action`, `Key`, `Age`, `Model`, `Flags`)와 세션 레이블별로 그룹화된 요약을 출력하므로 무엇이 유지되고 제거될지 확인할 수 있습니다.
- `--enforce`: `session.maintenance.mode`가 `warn`이어도 유지보수를 적용합니다.
- `--fix-missing`: 트랜스크립트 파일이 없거나 헤더만 있거나 비어 있는 항목을 제거합니다. 아직 일반적으로 수명/개수 조건에 걸리지 않더라도 제거합니다.
- `--fix-dm-scope`: `session.dmScope`가 `main`일 때 이전 `per-peer`, `per-channel-peer` 또는 `per-account-channel-peer` 라우팅이 남긴 오래된 peer 키 직접 DM 행을 폐기합니다. 먼저 `--dry-run`을 사용하세요. 정리를 적용하면 해당 행이 `sessions.json`에서 제거되고 트랜스크립트는 삭제된 아카이브로 보존됩니다.
- `--active-key <key>`: 특정 활성 키를 디스크 예산 축출에서 보호합니다. 그룹 세션과 스레드 범위 채팅 세션 같은 내구성 있는 외부 대화 포인터도 수명/개수/디스크 예산 유지보수에서 유지됩니다.
- `--agent <id>`: 구성된 에이전트 저장소 하나에 대해 정리를 실행합니다.
- `--all-agents`: 구성된 모든 에이전트 저장소에 대해 정리를 실행합니다.
- `--store <path>`: 특정 `sessions.json` 파일에 대해 실행합니다.
- `--json`: JSON 요약을 출력합니다. `--all-agents`와 함께 사용하면 저장소별 요약이 하나씩 포함됩니다.

Gateway에 연결할 수 있으면 구성된 에이전트 저장소의 non-dry-run 정리는
Gateway를 통해 전송되어 런타임 트래픽과 동일한 세션 저장소 writer를 공유합니다.
저장소 파일을 명시적으로 오프라인 복구하려면 `--store <path>`를 사용하세요.

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

## 세션 Compact

막혔거나 너무 커진 세션의 컨텍스트 예산을 회수합니다. `openclaw sessions compact <key>`는 `sessions.compact` Gateway RPC를 감싸는 일급 래퍼이며, 실행 중인 Gateway가 필요합니다.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines`가 없으면 Gateway가 LLM으로 트랜스크립트를 요약합니다. CLI는 기본적으로 클라이언트 기한을 부과하지 않습니다. 구성된 Compaction 수명 주기는 Gateway가 소유합니다.
- `--max-lines <n>`을 사용하면 마지막 `n`개 트랜스크립트 줄로 잘라내고 이전 트랜스크립트를 `.bak` 사이드카로 아카이브합니다.
- `--agent <id>`: 세션을 소유한 에이전트입니다. `global` 키에 필요합니다.
- `--url` / `--token` / `--password`: Gateway 연결 재정의입니다.
- `--timeout <ms>`: 선택적 클라이언트 측 RPC 제한 시간(밀리초)입니다.
- `--json`: 원시 RPC 페이로드를 출력합니다.

Gateway가 Compaction 실패를 보고하거나 연결할 수 없으면 명령은 0이 아닌 값으로 종료되므로, cron과 스크립트는 조용한 no-op을 성공으로 착각하지 않습니다.

> 참고: `openclaw agent --message '/compact ...'`는 Compaction 경로가 **아닙니다**. CLI의 슬래시 명령은 승인된 발신자 검사에서 거부됩니다. 이 호출은 조용히 no-op하지 않고 여기를 가리키는 안내와 함께 0이 아닌 값으로 종료됩니다.

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'`는 다음을 받습니다.

| 필드       | 유형        | 필수 | 설명                                                       |
| ---------- | ----------- | ---- | ---------------------------------------------------------- |
| `key`      | string      | 예   | Compact할 세션 키입니다(예: `agent:main:main`).            |
| `agentId`  | string      | 아니요 | 세션을 소유한 에이전트 id입니다(`global` 키용).             |
| `maxLines` | integer ≥ 1 | 아니요 | LLM 요약 대신 마지막 N줄로 자릅니다.                       |

LLM 요약 응답 예:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

자르기 응답 예(`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## 관련 항목

- 세션 구성: [구성 참조](/ko/gateway/config-agents#session)
- [CLI 참조](/ko/cli)
- [세션 관리](/ko/concepts/session)
