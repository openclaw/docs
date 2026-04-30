---
read_when:
    - 저장된 세션 목록을 보고 최근 활동을 확인하려는 경우
summary: '`openclaw sessions`에 대한 CLI 참조(저장된 세션 목록 + 사용법)'
title: 세션
x-i18n:
    generated_at: "2026-04-30T06:24:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

저장된 대화 세션을 나열합니다.

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
- `--verbose`: 상세 로깅
- `--agent <id>`: 구성된 에이전트 저장소 하나
- `--all-agents`: 구성된 모든 에이전트 저장소 집계
- `--store <path>`: 명시적 저장소 경로(`--agent` 또는 `--all-agents`와 함께 사용할 수 없음)

저장된 세션의 trajectory 번들을 내보냅니다:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

이 명령 경로는 소유자가 실행 요청을 승인한 후 `/export-trajectory` 슬래시 명령에서 사용됩니다. 출력 디렉터리는 항상 선택한 작업 영역 아래의 `.openclaw/trajectory-exports/` 내부로 해석됩니다.

`openclaw sessions --all-agents`는 구성된 에이전트 저장소를 읽습니다. Gateway 및 ACP 세션 검색은 더 넓습니다. 기본 `agents/` 루트 또는 템플릿화된 `session.store` 루트 아래에서 발견되는 디스크 전용 저장소도 포함합니다. 이렇게 발견된 저장소는 에이전트 루트 내부의 일반 `sessions.json` 파일로 해석되어야 하며, 심볼릭 링크와 루트 밖 경로는 건너뜁니다.

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

## 정리 유지 관리

다음 쓰기 주기를 기다리지 않고 지금 유지 관리를 실행합니다:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`은 구성의 `session.maintenance` 설정을 사용합니다:

- 범위 참고: `openclaw sessions cleanup`은 세션 저장소, transcript, trajectory 사이드카를 유지 관리합니다. `cron/runs/<jobId>.jsonl` Cron 실행 로그는 정리하지 않습니다. 이 로그는 [Cron 구성](/ko/automation/cron-jobs#configuration)의 `cron.runLog.maxBytes` 및 `cron.runLog.keepLines`로 관리되며 [Cron 유지 관리](/ko/automation/cron-jobs#maintenance)에 설명되어 있습니다.

- `--dry-run`: 쓰기 없이 몇 개의 항목이 정리되거나 제한될지 미리 봅니다.
  - 텍스트 모드에서 dry-run은 세션별 작업 표(`Action`, `Key`, `Age`, `Model`, `Flags`)를 출력하므로 무엇이 유지되고 무엇이 제거될지 확인할 수 있습니다.
- `--enforce`: `session.maintenance.mode`가 `warn`이어도 유지 관리를 적용합니다.
- `--fix-missing`: transcript 파일이 누락된 항목을 제거합니다. 아직 일반적인 나이/개수 기준에 걸리지 않더라도 제거합니다.
- `--active-key <key>`: 특정 활성 키를 디스크 예산 축출에서 보호합니다.
- `--agent <id>`: 구성된 에이전트 저장소 하나에 대해 정리를 실행합니다.
- `--all-agents`: 구성된 모든 에이전트 저장소에 대해 정리를 실행합니다.
- `--store <path>`: 특정 `sessions.json` 파일에 대해 실행합니다.
- `--json`: JSON 요약을 출력합니다. `--all-agents`와 함께 사용하면 출력에 저장소별 요약이 포함됩니다.

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

- 세션 구성: [구성 참고](/ko/gateway/config-agents#session)

## 관련 항목

- [CLI 참고](/ko/cli)
- [세션 관리](/ko/concepts/session)
