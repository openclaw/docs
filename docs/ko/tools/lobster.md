---
read_when:
    - 명시적 승인이 포함된 결정론적 다단계 워크플로를 원하는 경우
    - 이전 단계를 다시 실행하지 않고 워크플로를 재개해야 합니다
summary: 재개 가능한 승인 게이트를 갖춘 OpenClaw용 타입 지정 워크플로 런타임.
title: 바닷가재
x-i18n:
    generated_at: "2026-05-12T01:00:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster는 OpenClaw가 명시적 승인 체크포인트가 있는 단일 결정적 작업으로 다단계 도구 시퀀스를 실행할 수 있게 해주는 워크플로 셸입니다.

Lobster는 분리된 백그라운드 작업보다 한 단계 위에 있는 작성 레이어입니다. 개별 작업 위의 흐름 오케스트레이션은 [TaskFlow](/ko/automation/taskflow)(`openclaw tasks flow`)를 참조하세요. 작업 활동 원장은 [`openclaw tasks`](/ko/automation/tasks)를 참조하세요.

## 훅

어시스턴트가 자신을 관리하는 도구를 빌드할 수 있습니다. 워크플로를 요청하면 30분 후 단일 호출로 실행되는 CLI와 파이프라인을 갖게 됩니다. Lobster는 빠져 있던 조각입니다. 결정적 파이프라인, 명시적 승인, 재개 가능한 상태를 제공합니다.

## 이유

오늘날 복잡한 워크플로에는 여러 번의 왕복 도구 호출이 필요합니다. 각 호출은 토큰을 소모하며, LLM이 모든 단계를 오케스트레이션해야 합니다. Lobster는 해당 오케스트레이션을 타입이 지정된 런타임으로 옮깁니다.

- **여러 번 대신 한 번의 호출**: OpenClaw는 Lobster 도구 호출 하나를 실행하고 구조화된 결과를 받습니다.
- **승인 내장**: 부수 효과(이메일 전송, 댓글 게시)는 명시적으로 승인될 때까지 워크플로를 중단합니다.
- **재개 가능**: 중단된 워크플로는 토큰을 반환합니다. 승인하고 재개하면 모든 것을 다시 실행하지 않습니다.

## 일반 프로그램 대신 DSL을 쓰는 이유는 무엇인가요?

Lobster는 의도적으로 작게 설계되었습니다. 목표는 "새 언어"가 아니라, 일급 승인과 재개 토큰을 갖춘 예측 가능하고 AI 친화적인 파이프라인 명세입니다.

- **승인/재개가 내장됨**: 일반 프로그램은 사람에게 프롬프트를 띄울 수 있지만, 그 런타임을 직접 만들지 않는 한 내구성 있는 토큰으로 _일시 중지하고 재개_할 수 없습니다.
- **결정성 + 감사 가능성**: 파이프라인은 데이터이므로 기록, 비교, 재생, 검토가 쉽습니다.
- **AI를 위한 제한된 표면**: 작은 문법 + JSON 파이핑은 "창의적인" 코드 경로를 줄이고 검증을 현실적으로 만듭니다.
- **안전 정책 내장**: 타임아웃, 출력 상한, 샌드박스 검사, 허용 목록은 각 스크립트가 아니라 런타임이 강제합니다.
- **여전히 프로그래밍 가능**: 각 단계는 어떤 CLI나 스크립트도 호출할 수 있습니다. JS/TS를 원한다면 코드에서 `.lobster` 파일을 생성하세요.

## 작동 방식

OpenClaw는 내장 러너를 사용해 Lobster 워크플로를 **프로세스 내부에서** 실행합니다. 외부 CLI 하위 프로세스는 생성되지 않습니다. 워크플로 엔진은 Gateway 프로세스 안에서 실행되며 JSON 엔벌로프를 직접 반환합니다.
파이프라인이 승인을 위해 일시 중지되면 도구는 나중에 계속할 수 있도록 `resumeToken`을 반환합니다.

## 패턴: 작은 CLI + JSON 파이프 + 승인

JSON으로 통신하는 작은 명령을 빌드한 뒤, 이를 단일 Lobster 호출로 연결합니다. (아래 예시 명령 이름은 직접 사용하는 이름으로 바꾸세요.)

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

파이프라인이 승인을 요청하면 토큰으로 재개합니다.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI가 워크플로를 트리거하고, Lobster가 단계를 실행합니다. 승인 게이트는 부수 효과를 명시적이고 감사 가능하게 유지합니다.

예: 입력 항목을 도구 호출로 매핑합니다.

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON 전용 LLM 단계(llm-task)

**구조화된 LLM 단계**가 필요한 워크플로의 경우 선택 사항인
`llm-task` Plugin 도구를 활성화하고 Lobster에서 호출하세요. 이렇게 하면 모델로 분류/요약/초안을 수행할 수 있으면서도 워크플로를 결정적으로 유지할 수 있습니다.

도구를 활성화합니다.

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

### 중요한 제한 사항: 내장 Lobster와 `openclaw.invoke`

번들된 Lobster Plugin은 Gateway 내부에서 워크플로를 **프로세스 내부로** 실행합니다. 이 내장 모드에서 `openclaw.invoke`는 중첩된 OpenClaw CLI 도구 호출을 위한 Gateway URL/인증 컨텍스트를 자동으로 상속하지 **않습니다**.

즉, 이 패턴은 **현재 내장 러너에서 안정적이지 않습니다**.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

아래 예시는 `openclaw.invoke`가 이미 올바른 Gateway/인증 컨텍스트로 구성된 환경에서 **독립 실행형 Lobster CLI**를 실행할 때만 사용하세요.

독립 실행형 Lobster CLI 파이프라인에서 사용합니다.

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

현재 내장 Lobster Plugin을 사용 중이라면 다음 중 하나를 선호하세요.

- Lobster 외부에서 직접 `llm-task` 도구 호출, 또는
- 지원되는 내장 브리지가 추가될 때까지 Lobster 파이프라인 내부에서 `openclaw.invoke`가 아닌 단계 사용.

자세한 내용과 구성 옵션은 [LLM 작업](/ko/tools/llm-task)을 참조하세요.

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
- `condition`(또는 `when`)은 `$step.approved`에 따라 단계를 게이트할 수 있습니다.

## Lobster 설치

번들된 Lobster 워크플로는 프로세스 내부에서 실행되므로 별도의 `lobster` 바이너리가 필요하지 않습니다. 내장 러너는 Lobster Plugin과 함께 제공됩니다.

개발 또는 외부 파이프라인을 위해 독립 실행형 Lobster CLI가 필요하다면 [Lobster 저장소](https://github.com/openclaw/lobster)에서 설치하고 `lobster`가 `PATH`에 있는지 확인하세요.

## 도구 활성화

Lobster는 **선택 사항** Plugin 도구입니다(기본적으로 활성화되지 않음).

권장 방식(추가 방식, 안전함):

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

제한적 허용 목록 모드에서 실행하려는 경우가 아니라면 `tools.allow: ["lobster"]` 사용은 피하세요.

<Note>
허용 목록은 선택 사항 Plugin에 대해 옵트인입니다. `alsoAllow`는 일반 코어 도구 세트를 유지하면서 명명된 선택 사항 Plugin 도구만 활성화합니다. 코어 도구를 제한하려면 원하는 코어 도구나 그룹과 함께 `tools.allow`를 사용하세요.
</Note>

## 예시: 이메일 분류

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

JSON 엔벌로프를 반환합니다(잘림).

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

- `cwd`: 파이프라인의 상대 작업 디렉터리(Gateway 작업 디렉터리 안에 있어야 함).
- `timeoutMs`: 워크플로가 이 시간을 초과하면 중단합니다(기본값: 20000).
- `maxStdoutBytes`: 출력이 이 크기를 초과하면 워크플로를 중단합니다(기본값: 512000).
- `argsJson`: `lobster run --args-json`에 전달되는 JSON 문자열(워크플로 파일 전용).

## 출력 엔벌로프

Lobster는 세 가지 상태 중 하나가 포함된 JSON 엔벌로프를 반환합니다.

- `ok` → 성공적으로 완료됨
- `needs_approval` → 일시 중지됨. 재개하려면 `requiresApproval.resumeToken`이 필요함
- `cancelled` → 명시적으로 거부되었거나 취소됨

도구는 `content`(예쁘게 출력된 JSON)와 `details`(원시 객체) 모두에서 엔벌로프를 노출합니다.

## 승인

`requiresApproval`이 있으면 프롬프트를 검토하고 결정하세요.

- `approve: true` → 재개하고 부수 효과를 계속함
- `approve: false` → 워크플로를 취소하고 종료함

사용자 지정 jq/heredoc 글루 없이 승인 요청에 JSON 미리보기를 첨부하려면 `approve --preview-from-stdin --limit N`을 사용하세요. 이제 재개 토큰은 작습니다. Lobster는 워크플로 재개 상태를 상태 디렉터리에 저장하고 작은 토큰 키를 반환합니다.

## OpenProse

OpenProse는 Lobster와 잘 어울립니다. `/prose`를 사용해 멀티 에이전트 준비를 오케스트레이션한 다음, 결정적 승인을 위해 Lobster 파이프라인을 실행하세요. Prose 프로그램에 Lobster가 필요하다면 `tools.subagents.tools`를 통해 하위 에이전트에 `lobster` 도구를 허용하세요. [OpenProse](/ko/prose)를 참조하세요.

## 안전

- **로컬 프로세스 내부 전용** - 워크플로는 Gateway 프로세스 내부에서 실행됩니다. Plugin 자체에서는 네트워크 호출을 하지 않습니다.
- **비밀 없음** - Lobster는 OAuth를 관리하지 않습니다. 이를 처리하는 OpenClaw 도구를 호출합니다.
- **샌드박스 인식** - 도구 컨텍스트가 샌드박스 처리된 경우 비활성화됩니다.
- **강화됨** - 타임아웃과 출력 상한은 내장 러너가 강제합니다.

## 문제 해결

- **`lobster timed out`** → `timeoutMs`를 늘리거나 긴 파이프라인을 나누세요.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes`를 높이거나 출력 크기를 줄이세요.
- **`lobster returned invalid JSON`** → 파이프라인이 도구 모드에서 실행되고 JSON만 출력하는지 확인하세요.
- **`lobster failed`** → 내장 러너 오류 세부 정보는 Gateway 로그를 확인하세요.

## 더 알아보기

- [Plugin](/ko/tools/plugin)
- [Plugin 도구 작성](/ko/plugins/building-plugins#registering-agent-tools)

## 사례 연구: 커뮤니티 워크플로

공개 예시 하나는 개인, 파트너, 공유라는 세 개의 Markdown 보관소를 관리하는 "세컨드 브레인" CLI + Lobster 파이프라인입니다. 이 CLI는 통계, 받은 편지함 목록, 오래된 항목 스캔을 JSON으로 내보냅니다. Lobster는 해당 명령을 `weekly-review`, `inbox-triage`, `memory-consolidation`, `shared-task-sync` 같은 워크플로로 연결하며, 각각 승인 게이트를 갖습니다. AI는 사용할 수 있을 때 판단(분류)을 처리하고, 사용할 수 없을 때는 결정적 규칙으로 대체합니다.

- 스레드: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 저장소: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 관련

- [자동화](/ko/automation) - Lobster 워크플로 예약
- [자동화 개요](/ko/automation) - 모든 자동화 메커니즘
- [도구 개요](/ko/tools) - 사용 가능한 모든 에이전트 도구
