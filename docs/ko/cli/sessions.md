---
read_when:
    - 저장된 세션을 나열하고 최근 활동을 확인하려는 경우
summary: '`openclaw sessions`용 CLI 참조(저장된 세션 목록 + 사용법)'
title: 세션
x-i18n:
    generated_at: "2026-05-04T06:22:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

저장된 대화 세션을 나열합니다.

세션 목록은 채널/Provider 활성 상태 확인이 아닙니다. 세션 저장소에 유지된
대화 행을 보여줍니다. 조용한 Discord, Slack, Telegram 또는 기타 채널은
메시지가 처리되어 새 세션 행이 생성되기 전까지도 성공적으로 다시 연결될 수
있습니다. 실시간 채널 연결이 필요할 때는 `openclaw channels status --probe`,
`openclaw status --deep` 또는 `openclaw health --verbose`를 사용하세요.

Gateway `sessions.list` 응답은 기본적으로 제한되어 있으므로, 크고 오래 유지되는
저장소가 Gateway 이벤트 루프를 독점할 수 없습니다. RPC 클라이언트에서 다른 결과
범위가 필요할 때는 명시적인 양수 `limit`를 전달하세요. 호출자가 더 많은 행이
있다는 것을 표시해야 하는 경우 응답에는 `totalCount`, `limitApplied`,
`hasMore`가 포함됩니다.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

범위 선택:

- 기본값: 구성된 기본 에이전트 저장소
- `--verbose`: 자세한 로깅
- `--agent <id>`: 구성된 단일 에이전트 저장소
- `--all-agents`: 구성된 모든 에이전트 저장소 집계
- `--store <path>`: 명시적 저장소 경로(`--agent` 또는 `--all-agents`와 함께 사용할 수 없음)

저장된 세션의 trajectory 번들을 내보냅니다.

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

이 명령 경로는 소유자가 exec 요청을 승인한 뒤 `/export-trajectory` 슬래시 명령에서 사용됩니다. 출력 디렉터리는 항상 선택한 작업 영역 아래의 `.openclaw/trajectory-exports/` 안으로 해석됩니다.

`openclaw sessions --all-agents`는 구성된 에이전트 저장소를 읽습니다. Gateway와 ACP 세션 검색은 더 넓습니다. 기본 `agents/` 루트 또는 템플릿화된 `session.store` 루트 아래에서 찾은 디스크 전용 저장소도 포함합니다. 이러한 발견된 저장소는 에이전트 루트 내부의 일반 `sessions.json` 파일로 해석되어야 하며, 심볼릭 링크와 루트 밖 경로는 건너뜁니다.

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`은 구성의 `session.maintenance` 설정을 사용합니다.

- 범위 참고: `openclaw sessions cleanup`은 세션 저장소, transcript, trajectory sidecar를 유지관리합니다. Cron 실행 로그(`cron/runs/<jobId>.jsonl`)는 정리하지 않습니다. 이 로그는 [Cron 구성](/ko/automation/cron-jobs#configuration)의 `cron.runLog.maxBytes`와 `cron.runLog.keepLines`로 관리되며 [Cron 유지관리](/ko/automation/cron-jobs#maintenance)에 설명되어 있습니다.

- `--dry-run`: 쓰기 없이 정리/제한될 항목 수를 미리 봅니다.
  - 텍스트 모드에서 dry-run은 세션별 작업 표(`Action`, `Key`, `Age`, `Model`, `Flags`)를 출력하므로 무엇이 유지되고 무엇이 제거될지 확인할 수 있습니다.
- `--enforce`: `session.maintenance.mode`가 `warn`이어도 유지관리를 적용합니다.
- `--fix-missing`: transcript 파일이 없는 항목을 제거합니다. 아직 일반적인 age/count 기준에 따라 제거되지 않을 항목도 포함됩니다.
- `--active-key <key>`: 특정 활성 키를 디스크 예산 기반 제거에서 보호합니다. 그룹 세션과 스레드 범위 채팅 세션 같은 내구성 있는 외부 대화 포인터도 age/count/disk-budget 유지관리에서 보존됩니다.
- `--agent <id>`: 구성된 단일 에이전트 저장소에 대해 정리를 실행합니다.
- `--all-agents`: 구성된 모든 에이전트 저장소에 대해 정리를 실행합니다.
- `--store <path>`: 특정 `sessions.json` 파일을 대상으로 실행합니다.
- `--json`: JSON 요약을 출력합니다. `--all-agents`를 사용하면 출력에 저장소별 요약이 하나씩 포함됩니다.

Gateway에 연결할 수 있으면, 구성된 에이전트 저장소의 non-dry-run 정리는 Gateway를 통해 전송되어 런타임 트래픽과 동일한 세션 저장소 writer를 공유합니다. 저장소 파일의 명시적 오프라인 복구에는 `--store <path>`를 사용하세요.

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
