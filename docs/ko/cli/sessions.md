---
read_when:
    - 저장된 세션을 나열하고 최근 활동을 확인하려고 합니다
summary: '`openclaw sessions`에 대한 CLI 참조(저장된 세션 목록 + 사용법)'
title: 세션
x-i18n:
    generated_at: "2026-06-27T17:19:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

저장된 대화 세션을 나열합니다.

세션 목록은 채널/제공자 활성 상태 확인이 아닙니다. 세션 저장소에 지속된
대화 행을 표시합니다. 조용한 Discord, Slack, Telegram 또는 기타 채널은
메시지가 처리되어 새 세션 행이 생성되기 전까지도 성공적으로 다시 연결될 수
있습니다. 실시간 채널 연결이 필요하면 `openclaw channels status --probe`,
`openclaw status --deep` 또는 `openclaw health --verbose`를 사용하세요.

`openclaw sessions` 및 Gateway `sessions.list` 응답은 기본적으로 제한되어
대규모 장기 저장소가 CLI 프로세스나 Gateway 이벤트 루프를 독점하지 못하게
합니다. CLI는 기본적으로 최신 세션 100개를 반환합니다. 더 작거나 큰 범위가
필요하면 `--limit <n>`을 전달하고, 의도적으로 전체 저장소가 필요할 때는
`--limit all`을 전달하세요. JSON 응답에는 호출자가 더 많은 행이 있음을
표시해야 할 때 사용할 수 있도록 `totalCount`, `limitApplied`, `hasMore`가
포함됩니다.

RPC 클라이언트는 넓은 결합 검색 소스를 유지하되 현재 구성에 있는 에이전트의
행만 반환하도록 `configuredAgentsOnly: true`를 전달할 수 있습니다. Control UI는
삭제되었거나 디스크에만 있는 에이전트 저장소가 Sessions 뷰에 다시 나타나지
않도록 기본적으로 이 모드를 사용합니다.

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

저장된 세션의 사람이 읽을 수 있는 trajectory 진행 상황을 tail합니다.

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail`은 최근 trajectory JSONL 이벤트를 간결한 진행 줄로 렌더링합니다. `--session-key`가 없으면 실행 중인 세션을 먼저 tail한 다음 최신 저장 세션을 tail합니다. `--tail <count>`는 follow 모드 전에 출력할 기존 이벤트 수를 제어합니다. 기본값은 `80`이며, `0`은 현재 끝에서 시작합니다. `--follow`는 `<session>.trajectory-path.json`에서 참조하는 이동된 파일을 포함하여 선택된 trajectory 파일을 계속 감시합니다.

진행 뷰는 의도적으로 보수적입니다. 프롬프트 텍스트, 도구 인수, 도구 결과 본문은 출력하지 않습니다. 도구 호출은 도구 이름과 `{...redacted...}`를 표시합니다. 도구 결과는 `ok`, `error` 또는 `done` 같은 상태를 표시합니다. 모델 완료 줄은 제공자/모델 및 종료 상태를 표시합니다.

저장된 세션의 trajectory 번들을 내보냅니다.

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

이는 소유자가 exec 요청을 승인한 뒤 `/export-trajectory` 슬래시 명령이
사용하는 명령 경로입니다. 출력 디렉터리는 항상 선택된 워크스페이스 아래의
`.openclaw/trajectory-exports/` 내부로 해석됩니다.

`openclaw sessions --all-agents`는 구성된 에이전트 저장소를 읽습니다. Gateway 및 ACP
세션 검색은 더 넓습니다. 기본 `agents/` 루트 또는 템플릿화된 `session.store`
루트 아래에서 발견된 디스크 전용 저장소도 포함합니다. 이렇게 검색된 저장소는
에이전트 루트 내부의 일반 `sessions.json` 파일로 해석되어야 하며, 심볼릭 링크와
루트 밖 경로는 건너뜁니다.

JSON 예시:

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

`openclaw sessions cleanup`은 구성의 `session.maintenance` 설정을 사용합니다.

- 범위 참고: `openclaw sessions cleanup`은 세션 저장소, 대화 기록, trajectory 사이드카를 유지 관리합니다. Cron 실행 기록은 정리하지 않습니다. Cron 실행 기록은 [Cron 구성](/ko/automation/cron-jobs#configuration)의 `cron.runLog.keepLines`로 관리되며 [Cron 유지 관리](/ko/automation/cron-jobs#maintenance)에서 설명합니다.
- 정리는 `session.maintenance.pruneAfter`보다 오래된 참조되지 않은 기본 대화 기록, Compaction 체크포인트, trajectory 사이드카도 정리합니다. `sessions.json`에서 아직 참조되는 파일은 보존됩니다.
- 정리는 단기 Gateway 모델 실행 프로브 정리를 `modelRunPruned`로 별도 보고합니다. 이는 `agent:*:explicit:model-run-<uuid>` 형태의 엄격한 명시적 키에만 일치합니다. 고정 보존 기간은 `24h`이지만 압력 기반으로 동작합니다. 즉, 세션 항목 유지 관리/상한 압력에 도달했을 때만 오래된 프로브 행을 제거합니다. 실행되면 모델 실행 정리는 전역 오래된 항목 정리 및 상한 적용 전에 발생합니다.

- `--dry-run`: 쓰지 않고 몇 개의 항목이 정리/상한 적용될지 미리 봅니다.
  - 텍스트 모드에서 dry-run은 세션별 작업 표(`Action`, `Key`, `Age`, `Model`, `Flags`)와 세션 레이블별로 그룹화된 요약을 출력하므로 무엇이 유지되고 제거될지 확인할 수 있습니다.
- `--enforce`: `session.maintenance.mode`가 `warn`이어도 유지 관리를 적용합니다.
- `--fix-missing`: 대화 기록 파일이 없거나 헤더만 있거나 비어 있는 항목을 아직 일반적으로 나이/개수 조건에 걸리지 않더라도 제거합니다.
- `--fix-dm-scope`: `session.dmScope`가 `main`일 때 이전 `per-peer`, `per-channel-peer` 또는 `per-account-channel-peer` 라우팅이 남긴 오래된 피어 키 직접 DM 행을 폐기합니다. 먼저 `--dry-run`을 사용하세요. 정리를 적용하면 해당 행은 `sessions.json`에서 제거되고 대화 기록은 삭제된 아카이브로 보존됩니다.
- `--active-key <key>`: 특정 활성 키를 디스크 예산 축출에서 보호합니다. 그룹 세션 및 스레드 범위 채팅 세션 같은 지속적인 외부 대화 포인터도 나이/개수/디스크 예산 유지 관리에서 유지됩니다.
- `--agent <id>`: 구성된 에이전트 저장소 하나에 대해 정리를 실행합니다.
- `--all-agents`: 구성된 모든 에이전트 저장소에 대해 정리를 실행합니다.
- `--store <path>`: 특정 `sessions.json` 파일에 대해 실행합니다.
- `--json`: JSON 요약을 출력합니다. `--all-agents`와 함께 사용하면 출력에 저장소별 요약이 포함됩니다.

Gateway에 연결할 수 있으면 구성된 에이전트 저장소에 대한 non-dry-run 정리는
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

막혔거나 너무 커진 세션의 컨텍스트 예산을 회수합니다. `openclaw sessions compact <key>`는 `sessions.compact` Gateway RPC를 감싸는 일급 래퍼이며 실행 중인 Gateway가 필요합니다.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines`가 없으면 Gateway가 LLM으로 대화 기록을 요약합니다. 시간이 오래 걸릴 수 있으므로 기본 `--timeout`은 `180000` ms입니다.
- `--max-lines <n>`을 사용하면 마지막 `n`개 대화 기록 줄로 잘라내고 이전 대화 기록을 `.bak` 사이드카로 아카이브합니다.
- `--agent <id>`: 세션을 소유한 에이전트입니다. `global` 키에는 필수입니다.
- `--url` / `--token` / `--password`: Gateway 연결 재정의입니다.
- `--timeout <ms>`: 밀리초 단위의 RPC 제한 시간입니다.
- `--json`: 원시 RPC 페이로드를 출력합니다.

Gateway가 Compaction 실패를 보고하거나 연결할 수 없으면 명령은 0이 아닌 값으로 종료하므로 Cron 작업과 스크립트가 조용한 no-op을 성공으로 오인하지 않습니다.

> 참고: `openclaw agent --message '/compact ...'`는 Compaction 경로가 **아닙니다**. CLI의 슬래시 명령은 authorized-sender 확인에서 거부됩니다. 해당 호출은 조용히 no-op하지 않고 여기로 안내하는 지침과 함께 0이 아닌 값으로 종료합니다.

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'`는 다음을 허용합니다.

| 필드       | 타입        | 필수 | 설명                                                       |
| ---------- | ----------- | ---- | ---------------------------------------------------------- |
| `key`      | 문자열      | 예   | Compact할 세션 키(예: `agent:main:main`).                  |
| `agentId`  | 문자열      | 아니요 | 세션을 소유한 에이전트 ID(`global` 키용).                  |
| `maxLines` | 정수 ≥ 1    | 아니요 | LLM 요약 대신 마지막 N개 줄로 잘라냅니다.                 |

LLM 요약 응답 예시:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

잘라내기 응답 예시(`--max-lines 200`):

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
