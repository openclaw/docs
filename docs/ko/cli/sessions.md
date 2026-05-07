---
read_when:
    - 저장된 세션 목록을 표시하고 최근 활동을 확인하려는 경우
summary: '`openclaw sessions`에 대한 CLI 참조(저장된 세션 목록 표시 + 사용법)'
title: 세션
x-i18n:
    generated_at: "2026-05-07T13:14:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

저장된 대화 세션을 나열합니다.

세션 목록은 채널/공급자의 활성 상태 점검이 아닙니다. 세션 저장소에 유지된
대화 행을 보여줍니다. 조용한 Discord, Slack, Telegram 또는
기타 채널은 메시지가 처리될 때까지 새 세션 행을 만들지 않고도
성공적으로 다시 연결될 수 있습니다. 실시간
채널 연결이 필요할 때는 `openclaw channels status --probe`,
`openclaw status --deep` 또는 `openclaw health --verbose`를 사용하세요.

`openclaw sessions` 및 Gateway `sessions.list` 응답은 기본적으로 제한되어
대규모 장기 저장소가 CLI 프로세스나 Gateway
이벤트 루프를 독점할 수 없도록 합니다. CLI는 기본적으로 최신 세션 100개를 반환합니다.
더 작거나 큰 범위가 필요하면 `--limit <n>`을 전달하고, 의도적으로
전체 저장소가 필요할 때는 `--limit all`을 전달하세요. JSON 응답에는 호출자가
더 많은 행이 있음을 표시해야 할 때 사용할 수 있도록 `totalCount`, `limitApplied`, `hasMore`가
포함됩니다.

RPC 클라이언트는 넓은 통합
검색 소스를 유지하되 현재 구성에 있는 에이전트의 행만 반환하도록
`configuredAgentsOnly: true`를 전달할 수 있습니다.
제어 UI는 삭제되었거나 디스크에만 있는 에이전트 저장소가
세션 보기에서 다시 나타나지 않도록 기본적으로 이 모드를 사용합니다.

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

저장된 세션의 궤적 번들을 내보냅니다.

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

이는 소유자가 실행 요청을 승인한 뒤 `/export-trajectory` 슬래시 명령이 사용하는
명령 경로입니다. 출력 디렉터리는 항상 선택한 워크스페이스 아래의
`.openclaw/trajectory-exports/` 내부로 해석됩니다.

`openclaw sessions --all-agents`는 구성된 에이전트 저장소를 읽습니다. Gateway 및 ACP
세션 검색은 더 넓습니다. 기본 `agents/` 루트 또는 템플릿화된 `session.store` 루트 아래에서 찾은
디스크 전용 저장소도 포함합니다. 이렇게
검색된 저장소는 에이전트 루트 내부의 일반 `sessions.json` 파일로 해석되어야 하며,
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

## 정리 유지관리

다음 쓰기 주기를 기다리지 않고 지금 유지관리를 실행합니다.

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

- 범위 참고: `openclaw sessions cleanup`은 세션 저장소, 트랜스크립트, 궤적 사이드카를 유지관리합니다. `cron.runLog.maxBytes`와 `cron.runLog.keepLines`가 관리하는 Cron 실행 로그(`cron/runs/<jobId>.jsonl`)는 정리하지 않으며, 이는 [Cron 구성](/ko/automation/cron-jobs#configuration)에서 관리되고 [Cron 유지관리](/ko/automation/cron-jobs#maintenance)에서 설명합니다.
- 정리는 `session.maintenance.pruneAfter`보다 오래된 참조되지 않는 기본 트랜스크립트, Compaction 체크포인트, 궤적 사이드카도 제거합니다. `sessions.json`에서 계속 참조하는 파일은 보존됩니다.

- `--dry-run`: 쓰기 없이 제거/제한될 항목 수를 미리 봅니다.
  - 텍스트 모드에서 dry-run은 세션별 작업 표(`Action`, `Key`, `Age`, `Model`, `Flags`)를 출력하므로 무엇이 유지되고 무엇이 제거될지 확인할 수 있습니다.
- `--enforce`: `session.maintenance.mode`가 `warn`이어도 유지관리를 적용합니다.
- `--fix-missing`: 트랜스크립트 파일이 누락된 항목을, 아직 일반적인 age/count 제거 조건에 해당하지 않더라도 제거합니다.
- `--fix-dm-scope`: `session.dmScope`가 `main`일 때, 이전 `per-peer`, `per-channel-peer` 또는 `per-account-channel-peer` 라우팅이 남긴 오래된 피어 키 기반 직접 DM 행을 폐기합니다. 먼저 `--dry-run`을 사용하세요. 정리를 적용하면 해당 행이 `sessions.json`에서 제거되고, 트랜스크립트는 삭제된 아카이브로 보존됩니다.
- `--active-key <key>`: 특정 활성 키가 디스크 예산 퇴거에서 보호되도록 합니다. 그룹 세션 및 스레드 범위 채팅 세션과 같은 내구성 있는 외부 대화 포인터도 age/count/disk-budget 유지관리에서 보존됩니다.
- `--agent <id>`: 구성된 에이전트 저장소 하나에 대해 정리를 실행합니다.
- `--all-agents`: 구성된 모든 에이전트 저장소에 대해 정리를 실행합니다.
- `--store <path>`: 특정 `sessions.json` 파일에 대해 실행합니다.
- `--json`: JSON 요약을 출력합니다. `--all-agents`를 사용하면 출력에 저장소별 요약이 하나씩 포함됩니다.

Gateway에 연결할 수 있으면 구성된 에이전트 저장소에 대한 non-dry-run 정리는
Gateway를 통해 전송되어 런타임 트래픽과 동일한 세션 저장소 작성기를 공유합니다.
저장소 파일의 명시적 오프라인 복구에는 `--store <path>`를 사용하세요.

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

관련 항목:

- 세션 구성: [구성 참조](/ko/gateway/config-agents#session)

## 관련 항목

- [CLI 참조](/ko/cli)
- [세션 관리](/ko/concepts/session)
