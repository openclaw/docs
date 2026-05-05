---
read_when:
    - 저장된 세션 목록을 보고 최근 활동을 확인하려는 경우
summary: '`openclaw sessions`에 대한 CLI 참조(저장된 세션 목록 표시 + 사용법)'
title: 세션
x-i18n:
    generated_at: "2026-05-05T08:25:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

저장된 대화 세션을 나열합니다.

세션 목록은 채널/제공자 활성 상태 확인이 아닙니다. 세션 저장소에 유지된
대화 행을 보여줍니다. 조용한 Discord, Slack, Telegram 또는
다른 채널은 메시지가 처리되어 새 세션 행이 생성되기 전까지도
성공적으로 다시 연결될 수 있습니다. 실시간 채널 연결이 필요하면
`openclaw channels status --probe`, `openclaw status --deep` 또는
`openclaw health --verbose`를 사용하세요.

`openclaw sessions` 및 Gateway `sessions.list` 응답은 기본적으로 제한되어,
크고 오래 실행되는 저장소가 CLI 프로세스나 Gateway 이벤트 루프를
독점하지 못하게 합니다. CLI는 기본적으로 최신 100개 세션을 반환합니다.
더 작거나 큰 범위가 필요하면 `--limit <n>`을 전달하고, 의도적으로 전체
저장소가 필요하면 `--limit all`을 전달하세요. JSON 응답에는 호출자가 더 많은
행이 있음을 표시해야 할 때 사용할 수 있도록 `totalCount`, `limitApplied`,
`hasMore`가 포함됩니다.

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

저장된 세션의 trajectory 번들을 내보냅니다.

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

이는 소유자가 실행 요청을 승인한 뒤 `/export-trajectory` 슬래시 명령이
사용하는 명령 경로입니다. 출력 디렉터리는 항상 선택된 워크스페이스 아래의
`.openclaw/trajectory-exports/` 안에서 해석됩니다.

`openclaw sessions --all-agents`는 구성된 에이전트 저장소를 읽습니다. Gateway 및 ACP
세션 검색은 더 넓은 범위를 다룹니다. 기본 `agents/` 루트 또는 템플릿화된
`session.store` 루트 아래에서 발견된 디스크 전용 저장소도 포함합니다. 이렇게
발견된 저장소는 에이전트 루트 안의 일반 `sessions.json` 파일로 해석되어야 하며,
심볼릭 링크와 루트 밖 경로는 건너뜁니다.

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`은 구성의 `session.maintenance` 설정을 사용합니다.

- 범위 참고: `openclaw sessions cleanup`은 세션 저장소, transcript, trajectory 보조 파일을 유지 관리합니다. `cron/runs/<jobId>.jsonl`의 Cron 실행 로그는 정리하지 않으며, 이는 [Cron 구성](/ko/automation/cron-jobs#configuration)의 `cron.runLog.maxBytes` 및 `cron.runLog.keepLines`로 관리되고 [Cron 유지 관리](/ko/automation/cron-jobs#maintenance)에 설명되어 있습니다.
- 정리는 `session.maintenance.pruneAfter`보다 오래된 참조되지 않는 기본 transcript, Compaction 체크포인트, trajectory 보조 파일도 정리합니다. `sessions.json`에서 아직 참조되는 파일은 보존됩니다.

- `--dry-run`: 쓰지 않고 몇 개의 항목이 정리/제한될지 미리 봅니다.
  - 텍스트 모드에서 dry-run은 세션별 작업 표(`Action`, `Key`, `Age`, `Model`, `Flags`)를 출력하므로 무엇이 유지되고 무엇이 제거될지 확인할 수 있습니다.
- `--enforce`: `session.maintenance.mode`가 `warn`이어도 유지 관리를 적용합니다.
- `--fix-missing`: transcript 파일이 없는 항목을 아직 일반적인 연령/개수 기준에서 제외되지 않더라도 제거합니다.
- `--active-key <key>`: 특정 활성 키를 디스크 예산 기반 제거에서 보호합니다. 그룹 세션과 스레드 범위 채팅 세션 같은 내구성 있는 외부 대화 포인터도 연령/개수/디스크 예산 유지 관리에서 유지됩니다.
- `--agent <id>`: 구성된 에이전트 저장소 하나에 대해 정리를 실행합니다.
- `--all-agents`: 구성된 모든 에이전트 저장소에 대해 정리를 실행합니다.
- `--store <path>`: 특정 `sessions.json` 파일을 대상으로 실행합니다.
- `--json`: JSON 요약을 출력합니다. `--all-agents`를 함께 사용하면 출력에 저장소별 요약이 포함됩니다.

Gateway에 도달할 수 있으면, 구성된 에이전트 저장소에 대한 dry-run이 아닌 정리는
Gateway를 통해 전송되어 런타임 트래픽과 동일한 세션 저장소 작성기를 공유합니다.
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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

관련 항목:

- 세션 구성: [구성 참조](/ko/gateway/config-agents#session)

## 관련 항목

- [CLI 참조](/ko/cli)
- [세션 관리](/ko/concepts/session)
