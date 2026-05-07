---
read_when:
    - 명시적인 승인이 있는 결정론적 다단계 워크플로를 원하는 경우
    - 이전 단계를 다시 실행하지 않고 워크플로를 재개해야 합니다
summary: 재개 가능한 승인 게이트를 갖춘 OpenClaw용 타입 지정 워크플로 런타임.
title: 랍스터
x-i18n:
    generated_at: "2026-05-07T13:25:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster는 OpenClaw가 명시적 승인 체크포인트를 포함한 단일 결정적 작업으로 여러 단계의 도구 시퀀스를 실행할 수 있게 해주는 워크플로 셸입니다.

Lobster는 분리된 백그라운드 작업 위에 있는 하나의 작성 계층입니다. 개별 작업 위의 플로 오케스트레이션은 [Task Flow](/ko/automation/taskflow)(`openclaw tasks flow`)를 참조하세요. 작업 활동 원장은 [`openclaw tasks`](/ko/automation/tasks)를 참조하세요.

## 훅

사용자의 어시스턴트는 스스로를 관리하는 도구를 만들 수 있습니다. 워크플로를 요청하면 30분 뒤에는 한 번의 호출로 실행되는 CLI와 파이프라인을 갖게 됩니다. Lobster는 빠져 있던 조각입니다. 결정적 파이프라인, 명시적 승인, 재개 가능한 상태를 제공합니다.

## 이유

오늘날 복잡한 워크플로에는 많은 왕복 도구 호출이 필요합니다. 각 호출은 토큰을 소비하며, LLM은 모든 단계를 오케스트레이션해야 합니다. Lobster는 그 오케스트레이션을 타입이 지정된 런타임으로 옮깁니다.

- **여러 번 대신 한 번 호출**: OpenClaw는 하나의 Lobster 도구 호출을 실행하고 구조화된 결과를 받습니다.
- **승인 내장**: 부작용(이메일 보내기, 댓글 게시)은 명시적으로 승인될 때까지 워크플로를 중지합니다.
- **재개 가능**: 중지된 워크플로는 토큰을 반환합니다. 승인 후 모든 것을 다시 실행하지 않고 재개할 수 있습니다.

## 일반 프로그램 대신 DSL을 사용하는 이유는 무엇인가요?

Lobster는 의도적으로 작게 설계되었습니다. 목표는 "새 언어"가 아니라, 일급 승인과 재개 토큰을 갖춘 예측 가능하고 AI 친화적인 파이프라인 명세입니다.

- **승인/재개가 내장됨**: 일반 프로그램은 사람에게 프롬프트를 띄울 수는 있지만, 해당 런타임을 직접 만들지 않는 한 지속성 있는 토큰으로 _일시 중지하고 재개_할 수 없습니다.
- **결정성 + 감사 가능성**: 파이프라인은 데이터이므로 로그 기록, diff, 재실행, 검토가 쉽습니다.
- **AI를 위한 제한된 표면**: 작은 문법 + JSON 파이핑은 "창의적인" 코드 경로를 줄이고 검증을 현실적으로 만듭니다.
- **안전 정책 내장**: 타임아웃, 출력 상한, 샌드박스 검사, 허용 목록은 각 스크립트가 아니라 런타임이 강제합니다.
- **여전히 프로그래밍 가능**: 각 단계는 어떤 CLI나 스크립트든 호출할 수 있습니다. JS/TS를 원한다면 코드에서 `.lobster` 파일을 생성하세요.

## 작동 방식

OpenClaw는 임베디드 러너를 사용해 Lobster 워크플로를 **프로세스 내부에서** 실행합니다. 외부 CLI 서브프로세스를 생성하지 않으며, 워크플로 엔진은 gateway 프로세스 내부에서 실행되고 JSON 봉투를 직접 반환합니다.
파이프라인이 승인을 위해 일시 중지되면, 도구는 나중에 계속할 수 있도록 `resumeToken`을 반환합니다.

## 패턴: 작은 CLI + JSON 파이프 + 승인

JSON으로 소통하는 작은 명령을 만든 다음, 하나의 Lobster 호출로 연결하세요. (아래 예시 명령 이름은 직접 사용하는 이름으로 바꾸세요.)

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

예시: 입력 항목을 도구 호출로 매핑합니다.

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON 전용 LLM 단계(llm-task)

**구조화된 LLM 단계**가 필요한 워크플로에서는 선택 사항인
`llm-task` Plugin 도구를 활성화하고 Lobster에서 호출하세요. 이렇게 하면 모델로 분류/요약/초안을 작성할 수 있으면서도 워크플로를
결정적으로 유지할 수 있습니다.

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

### 중요한 제한 사항: 임베디드 Lobster와 `openclaw.invoke`

번들 Lobster Plugin은 gateway 내부에서 워크플로를 **프로세스 내부로** 실행합니다. 이 임베디드 모드에서 `openclaw.invoke`는 중첩된 OpenClaw CLI 도구 호출을 위한 gateway URL/인증 컨텍스트를 자동으로 상속하지 **않습니다**.

즉, 이 패턴은 **현재 임베디드 러너에서 안정적이지 않습니다**.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

아래 예시는 `openclaw.invoke`가 이미 올바른 gateway/인증 컨텍스트로 구성된 환경에서 **독립 실행형 Lobster CLI**를 실행할 때만 사용하세요.

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

현재 임베디드 Lobster Plugin을 사용 중이라면 다음 중 하나를 선호하세요.

- Lobster 외부에서 직접 `llm-task` 도구 호출, 또는
- 지원되는 임베디드 브리지가 추가될 때까지 Lobster 파이프라인 내부에서 `openclaw.invoke`가 아닌 단계 사용.

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

번들 Lobster 워크플로는 프로세스 내부에서 실행되므로 별도의 `lobster` 바이너리가 필요하지 않습니다. 임베디드 러너는 Lobster Plugin과 함께 제공됩니다.

개발이나 외부 파이프라인을 위해 독립 실행형 Lobster CLI가 필요하다면 [Lobster repo](https://github.com/openclaw/lobster)에서 설치하고 `lobster`가 `PATH`에 있는지 확인하세요.

## 도구 활성화

Lobster는 **선택 사항**인 Plugin 도구입니다(기본적으로 활성화되지 않음).

권장 방식(추가적이고 안전함):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

또는 에이전트별로 설정합니다.

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
허용 목록은 선택 사항 Plugin에 대해 옵트인입니다. `alsoAllow`는 일반 코어 도구 세트를 유지하면서 이름이 지정된 선택 사항 Plugin 도구만 활성화합니다. 코어 도구를 제한하려면 원하는 코어 도구 또는 그룹과 함께 `tools.allow`를 사용하세요.
</Note>

## 예시: 이메일 분류

Lobster가 없을 때:

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

Lobster 사용 시:

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

하나의 워크플로입니다. 결정적입니다. 안전합니다.

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

승인 후 중지된 워크플로를 계속합니다.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 선택 입력

- `cwd`: 파이프라인의 상대 작업 디렉터리입니다(gateway 작업 디렉터리 안에 머물러야 함).
- `timeoutMs`: 워크플로가 이 시간을 초과하면 중단합니다(기본값: 20000).
- `maxStdoutBytes`: 출력이 이 크기를 초과하면 워크플로를 중단합니다(기본값: 512000).
- `argsJson`: `lobster run --args-json`에 전달되는 JSON 문자열입니다(워크플로 파일에만 해당).

## 출력 봉투

Lobster는 세 가지 상태 중 하나가 포함된 JSON 봉투를 반환합니다.

- `ok` → 성공적으로 완료됨
- `needs_approval` → 일시 중지됨. 재개하려면 `requiresApproval.resumeToken`이 필요함
- `cancelled` → 명시적으로 거부되었거나 취소됨

도구는 `content`(보기 좋게 정리된 JSON)와 `details`(원시 객체) 모두에 봉투를 표시합니다.

## 승인

`requiresApproval`이 있으면 프롬프트를 확인하고 결정하세요.

- `approve: true` → 재개하고 부작용을 계속 진행
- `approve: false` → 워크플로를 취소하고 완료 처리

사용자 지정 jq/heredoc 접착 코드 없이 승인 요청에 JSON 미리보기를 첨부하려면 `approve --preview-from-stdin --limit N`을 사용하세요. 이제 재개 토큰은 간결합니다. Lobster는 워크플로 재개 상태를 자체 상태 디렉터리에 저장하고 작은 토큰 키를 반환합니다.

## OpenProse

OpenProse는 Lobster와 잘 어울립니다. `/prose`를 사용해 다중 에이전트 준비를 오케스트레이션한 다음, 결정적 승인을 위해 Lobster 파이프라인을 실행하세요. Prose 프로그램에 Lobster가 필요하다면 `tools.subagents.tools`를 통해 하위 에이전트에 `lobster` 도구를 허용하세요. [OpenProse](/ko/prose)를 참조하세요.

## 안전

- **로컬 프로세스 내부 전용** - 워크플로는 gateway 프로세스 내부에서 실행되며, Plugin 자체에서는 네트워크 호출을 하지 않습니다.
- **비밀 없음** - Lobster는 OAuth를 관리하지 않습니다. OAuth를 관리하는 OpenClaw 도구를 호출합니다.
- **샌드박스 인식** - 도구 컨텍스트가 샌드박스 처리된 경우 비활성화됩니다.
- **강화됨** - 임베디드 러너가 타임아웃과 출력 상한을 강제합니다.

## 문제 해결

- **`lobster timed out`** → `timeoutMs`를 늘리거나 긴 파이프라인을 나누세요.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes`를 높이거나 출력 크기를 줄이세요.
- **`lobster returned invalid JSON`** → 파이프라인이 도구 모드에서 실행되고 JSON만 출력하는지 확인하세요.
- **`lobster failed`** → 임베디드 러너 오류 세부 정보는 gateway 로그를 확인하세요.

## 더 알아보기

- [Plugins](/ko/tools/plugin)
- [Plugin 도구 작성](/ko/plugins/building-plugins#registering-agent-tools)

## 사례 연구: 커뮤니티 워크플로

공개 예시 중 하나로, 세 개의 Markdown vault(개인, 파트너, 공유)를 관리하는 "second brain" CLI + Lobster 파이프라인이 있습니다. CLI는 통계, 받은 편지함 목록, 오래된 항목 스캔을 JSON으로 내보냅니다. Lobster는 해당 명령들을 `weekly-review`, `inbox-triage`, `memory-consolidation`, `shared-task-sync` 같은 워크플로로 연결하며, 각각 승인 게이트를 포함합니다. AI는 사용 가능할 때 판단(분류)을 처리하고, 그렇지 않을 때는 결정적 규칙으로 대체합니다.

- 스레드: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 관련 항목

- [Automation & Tasks](/ko/automation) - Lobster 워크플로 예약
- [Automation Overview](/ko/automation) - 모든 자동화 메커니즘
- [Tools Overview](/ko/tools) - 사용 가능한 모든 에이전트 도구
