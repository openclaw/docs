---
read_when:
    - 명시적 승인이 포함된 결정론적 다단계 워크플로를 원합니다
    - 이전 단계를 다시 실행하지 않고 워크플로를 재개해야 합니다
summary: 재개 가능한 승인 게이트를 갖춘 OpenClaw용 타입 지정 워크플로 런타임.
title: 바닷가재
x-i18n:
    generated_at: "2026-05-04T02:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster는 OpenClaw가 여러 단계의 도구 시퀀스를 명시적 승인 체크포인트가 있는 하나의 결정적 작업으로 실행할 수 있게 해 주는 워크플로 셸입니다.

Lobster는 분리된 백그라운드 작업 위의 작성 계층입니다. 개별 작업 위의 플로 오케스트레이션은 [Task Flow](/ko/automation/taskflow)(`openclaw tasks flow`)를 참조하세요. 작업 활동 원장은 [`openclaw tasks`](/ko/automation/tasks)를 참조하세요.

## 훅

어시스턴트는 자신을 관리하는 도구를 빌드할 수 있습니다. 워크플로를 요청하면 30분 뒤에는 한 번의 호출로 실행되는 CLI와 파이프라인을 갖게 됩니다. Lobster는 빠진 조각입니다. 결정적 파이프라인, 명시적 승인, 재개 가능한 상태를 제공합니다.

## 이유

오늘날 복잡한 워크플로에는 여러 번의 왕복 도구 호출이 필요합니다. 각 호출은 토큰을 소비하고, LLM은 모든 단계를 오케스트레이션해야 합니다. Lobster는 이 오케스트레이션을 타입이 지정된 런타임으로 옮깁니다.

- **여러 번 대신 한 번의 호출**: OpenClaw는 Lobster 도구 호출 하나를 실행하고 구조화된 결과를 얻습니다.
- **내장된 승인**: 부작용(이메일 보내기, 댓글 게시)은 명시적으로 승인될 때까지 워크플로를 중단합니다.
- **재개 가능**: 중단된 워크플로는 토큰을 반환합니다. 승인하고 모든 것을 다시 실행하지 않고 재개할 수 있습니다.

## 일반 프로그램 대신 DSL을 쓰는 이유는 무엇인가요?

Lobster는 의도적으로 작습니다. 목표는 "새 언어"가 아니라, 일급 승인과 재개 토큰을 갖춘 예측 가능하고 AI 친화적인 파이프라인 명세입니다.

- **승인/재개가 내장됨**: 일반 프로그램은 사람에게 프롬프트를 표시할 수 있지만, 직접 런타임을 만들지 않는 한 내구성 있는 토큰으로 _일시 중지하고 재개_할 수는 없습니다.
- **결정성 + 감사 가능성**: 파이프라인은 데이터이므로 로깅, diff, 재실행, 검토가 쉽습니다.
- **AI를 위한 제한된 표면**: 작은 문법 + JSON 파이핑은 “창의적인” 코드 경로를 줄이고 검증을 현실적으로 만듭니다.
- **내장된 안전 정책**: 타임아웃, 출력 한도, 샌드박스 검사, 허용 목록은 각 스크립트가 아니라 런타임이 강제합니다.
- **여전히 프로그래밍 가능**: 각 단계는 임의의 CLI 또는 스크립트를 호출할 수 있습니다. JS/TS를 원한다면 코드에서 `.lobster` 파일을 생성하세요.

## 작동 방식

OpenClaw는 내장 러너를 사용해 Lobster 워크플로를 **프로세스 내부**에서 실행합니다. 외부 CLI 하위 프로세스는 생성되지 않습니다. 워크플로 엔진은 gateway 프로세스 안에서 실행되고 JSON 봉투를 직접 반환합니다.
파이프라인이 승인을 위해 일시 중지되면, 도구는 나중에 계속할 수 있도록 `resumeToken`을 반환합니다.

## 패턴: 작은 CLI + JSON 파이프 + 승인

JSON을 주고받는 작은 명령을 만든 다음, 하나의 Lobster 호출로 연결하세요. (아래 예시 명령 이름은 원하는 것으로 바꾸세요.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

파이프라인이 승인을 요청하면 토큰으로 재개하세요.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI가 워크플로를 트리거하고, Lobster가 단계를 실행합니다. 승인 게이트는 부작용을 명시적이고 감사 가능하게 유지합니다.

예: 입력 항목을 도구 호출로 매핑합니다.

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON 전용 LLM 단계(llm-task)

**구조화된 LLM 단계**가 필요한 워크플로의 경우 선택 사항인
`llm-task` Plugin 도구를 활성화하고 Lobster에서 호출하세요. 이렇게 하면 모델로 분류/요약/초안을 만들 수 있으면서도 워크플로를
결정적으로 유지할 수 있습니다.

도구를 활성화하세요.

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

파이프라인에서 사용하세요.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

자세한 내용과 구성 옵션은 [LLM Task](/ko/tools/llm-task)를 참조하세요.

## 워크플로 파일(.lobster)

Lobster는 `name`, `args`, `steps`, `env`, `condition`, `approval` 필드가 있는 YAML/JSON 워크플로 파일을 실행할 수 있습니다. OpenClaw 도구 호출에서는 `pipeline`을 파일 경로로 설정하세요.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

참고:

- `stdin: $step.stdout`와 `stdin: $step.json`은 이전 단계의 출력을 전달합니다.
- `condition`(또는 `when`)은 `$step.approved`를 기준으로 단계를 게이트할 수 있습니다.

## Lobster 설치

번들된 Lobster 워크플로는 프로세스 내부에서 실행되며, 별도의 `lobster` 바이너리가 필요하지 않습니다. 내장 러너는 Lobster Plugin과 함께 제공됩니다.

개발 또는 외부 파이프라인을 위해 독립 실행형 Lobster CLI가 필요하다면 [Lobster 저장소](https://github.com/openclaw/lobster)에서 설치하고 `lobster`가 `PATH`에 있는지 확인하세요.

## 도구 활성화

Lobster는 **선택 사항** Plugin 도구입니다(기본적으로 활성화되지 않음).

권장 방식(추가형, 안전함):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

또는 에이전트별로:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

제한적인 허용 목록 모드로 실행하려는 경우가 아니라면 `tools.allow: ["lobster"]` 사용을 피하세요.

<Note>
허용 목록은 선택 사항 Plugin에 대해 옵트인 방식입니다. `alsoAllow`는 일반 코어 도구 세트를 보존하면서 이름이 지정된 선택 사항 Plugin 도구만 활성화합니다. 코어 도구를 제한하려면 원하는 코어 도구 또는 그룹과 함께 `tools.allow`를 사용하세요.
</Note>

## 예: 이메일 분류

Lobster 없이:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Lobster 사용:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

JSON 봉투를 반환합니다(일부 생략).

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

사용자가 승인 → 재개:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

하나의 워크플로. 결정적. 안전함.

## 도구 매개변수

### `run`

도구 모드에서 파이프라인을 실행합니다.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

인수와 함께 워크플로 파일을 실행합니다.

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

승인 후 중단된 워크플로를 계속합니다.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 선택 입력

- `cwd`: 파이프라인의 상대 작업 디렉터리(gateway 작업 디렉터리 안에 있어야 함).
- `timeoutMs`: 이 시간을 초과하면 워크플로를 중단합니다(기본값: 20000).
- `maxStdoutBytes`: 출력이 이 크기를 초과하면 워크플로를 중단합니다(기본값: 512000).
- `argsJson`: `lobster run --args-json`에 전달되는 JSON 문자열(워크플로 파일 전용).

## 출력 봉투

Lobster는 세 가지 상태 중 하나가 포함된 JSON 봉투를 반환합니다.

- `ok` → 성공적으로 완료됨
- `needs_approval` → 일시 중지됨. 재개하려면 `requiresApproval.resumeToken`이 필요함
- `cancelled` → 명시적으로 거부되었거나 취소됨

도구는 `content`(보기 좋게 정렬된 JSON)와 `details`(원시 객체) 양쪽에 봉투를 표시합니다.

## 승인

`requiresApproval`이 있으면 프롬프트를 검토하고 결정하세요.

- `approve: true` → 재개하고 부작용을 계속 진행
- `approve: false` → 취소하고 워크플로 마무리

사용자 지정 jq/heredoc 연결 코드 없이 승인 요청에 JSON 미리보기를 첨부하려면 `approve --preview-from-stdin --limit N`을 사용하세요. 이제 재개 토큰은 작습니다. Lobster는 워크플로 재개 상태를 자체 상태 디렉터리에 저장하고 작은 토큰 키를 반환합니다.

## OpenProse

OpenProse는 Lobster와 잘 어울립니다. `/prose`를 사용해 다중 에이전트 준비를 오케스트레이션한 다음, 결정적 승인을 위해 Lobster 파이프라인을 실행하세요. Prose 프로그램에 Lobster가 필요하면 `tools.subagents.tools`를 통해 하위 에이전트에 `lobster` 도구를 허용하세요. [OpenProse](/ko/prose)를 참조하세요.

## 안전성

- **로컬 프로세스 내부 전용** — 워크플로는 gateway 프로세스 안에서 실행되며, Plugin 자체는 네트워크 호출을 하지 않습니다.
- **비밀 없음** — Lobster는 OAuth를 관리하지 않습니다. OAuth를 관리하는 OpenClaw 도구를 호출합니다.
- **샌드박스 인식** — 도구 컨텍스트가 샌드박스 처리된 경우 비활성화됩니다.
- **강화됨** — 내장 러너가 타임아웃과 출력 한도를 강제합니다.

## 문제 해결

- **`lobster timed out`** → `timeoutMs`를 늘리거나 긴 파이프라인을 분할하세요.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes`를 높이거나 출력 크기를 줄이세요.
- **`lobster returned invalid JSON`** → 파이프라인이 도구 모드에서 실행되고 JSON만 출력하는지 확인하세요.
- **`lobster failed`** → 내장 러너 오류 세부 정보는 gateway 로그를 확인하세요.

## 더 알아보기

- [Plugins](/ko/tools/plugin)
- [Plugin 도구 작성](/ko/plugins/building-plugins#registering-agent-tools)

## 사례 연구: 커뮤니티 워크플로

공개 예시 하나: 세 개의 Markdown vault(개인, 파트너, 공유)를 관리하는 “세컨드 브레인” CLI + Lobster 파이프라인입니다. CLI는 통계, 받은 편지함 목록, 오래된 항목 스캔을 JSON으로 내보냅니다. Lobster는 해당 명령을 `weekly-review`, `inbox-triage`, `memory-consolidation`, `shared-task-sync` 같은 워크플로로 연결하며, 각각 승인 게이트를 갖습니다. AI는 사용 가능한 경우 판단(분류)을 처리하고, 그렇지 않은 경우 결정적 규칙으로 대체합니다.

- 스레드: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 저장소: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 관련

- [자동화 및 작업](/ko/automation) — Lobster 워크플로 예약
- [자동화 개요](/ko/automation) — 모든 자동화 메커니즘
- [도구 개요](/ko/tools) — 사용 가능한 모든 에이전트 도구
