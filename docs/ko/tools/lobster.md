---
read_when:
    - 명시적 승인을 포함하는 결정론적 다단계 워크플로가 필요한 경우
    - 이전 단계를 다시 실행하지 않고 워크플로를 재개해야 합니다
summary: 재개 가능한 승인 게이트를 갖춘 OpenClaw용 타입 기반 워크플로 런타임입니다.
title: Lobster
x-i18n:
    generated_at: "2026-07-12T15:49:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster는 명시적인 승인 체크포인트와 재개 토큰을 사용하여 다단계 도구 파이프라인을 하나의 결정론적 도구 호출로 실행합니다. 분리된 백그라운드 작업보다 한 계층 위에 있습니다. 여러 분리된 작업에 걸친 흐름을 오케스트레이션하려면 [Task Flow](/ko/automation/taskflow)(`openclaw tasks flow`)를 참조하고, 작업 활동 원장은 [백그라운드 작업](/ko/automation/tasks)을 참조하십시오.

## 필요한 이유

Lobster가 없으면 다단계 작업에는 여러 번의 왕복 도구 호출이 필요하며, 모델이 모든 단계를 오케스트레이션해야 합니다. Lobster는 이러한 오케스트레이션을 형식이 지정된 런타임으로 옮깁니다.

- **여러 번이 아닌 한 번의 호출**: 단일 Lobster 도구 호출이 전체 파이프라인의 구조화된 결과를 반환합니다.
- **승인 기능 내장**: 부작용이 있는 작업(전송, 게시, 삭제)은 명시적으로 승인할 때까지 워크플로를 중단합니다.
- **재개 가능**: 중단된 워크플로는 토큰을 반환합니다. 이전 단계를 다시 실행하지 않고 승인한 후 재개할 수 있습니다.

Lobster는 범용 스크립팅 언어가 아니라 작고 제한된 DSL입니다. 승인/재개는 지속성이 보장되는 내장 기본 요소이며, 파이프라인은 데이터이므로 로깅, 차이 비교, 재실행, 검토가 쉽습니다. 작은 문법은 "창의적인" 코드 경로를 제한하여 검증을 현실적으로 유지하며, 시간 제한, 출력 상한, 샌드박스 검사, 허용 목록은 각 스크립트가 아니라 런타임에서 적용합니다. 각 단계에서는 여전히 모든 CLI나 스크립트를 호출할 수 있습니다. 더 풍부한 작성 언어가 필요하다면 다른 도구에서 `.lobster` 파일을 생성하십시오.

Lobster가 없으면 반복적인 이메일 분류 작업은 다음과 같습니다.

```text
사용자: "내 이메일을 확인하고 답장을 초안으로 작성해 줘"
→ openclaw가 gmail.list를 호출합니다
→ LLM이 요약합니다
→ 사용자: "#2와 #5에 대한 답장을 초안으로 작성해 줘"
→ LLM이 초안을 작성합니다
→ 사용자: "#2를 보내 줘"
→ openclaw가 gmail.send를 호출합니다
(매일 반복하며, 무엇을 분류했는지 기억하지 못합니다)
```

Lobster를 사용하면 동일한 작업이 승인을 위해 중단되고 이후 재개되는 한 번의 호출로 처리됩니다.

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5개는 답장이 필요하고, 2개는 조치가 필요합니다" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "답장 초안 2개를 보내시겠습니까?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## 작동 방식

OpenClaw는 번들로 제공되는 `@clawdbot/lobster` 패키지를 임베디드 러너로 사용하여 Lobster 워크플로를 **프로세스 내에서** 실행합니다. 외부 `lobster` 하위 프로세스는 생성되지 않으며, 도구 호출은 JSON 봉투를 직접 반환합니다. 파이프라인이 승인을 위해 중단되면 봉투에 재개 토큰(또는 짧은 승인 ID)이 포함되어 나중에 계속할 수 있습니다.

## 활성화

Lobster는 기본적으로 활성화되지 않는 **선택적** Plugin 도구입니다. 번들로 제공되므로 별도의 설치 단계는 필요하지 않습니다. 도구를 허용하기만 하면 됩니다.

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

<Note>
`alsoAllow`는 다른 핵심 도구를 제한하지 않고 활성 도구 프로필에 `lobster`를 추가합니다. 제한적인 허용 목록 모드를 사용하려는 경우에만 `tools.allow`를 대신 사용하십시오.
</Note>

샌드박스 처리된 도구 컨텍스트에서는 이 도구가 완전히 비활성화됩니다.

개발 또는 외부 파이프라인에서 독립 실행형 Lobster CLI가 필요한 경우(임베디드 Gateway 러너 외부) [Lobster 저장소](https://github.com/openclaw/lobster)에서 설치하고 `lobster`를 `PATH`에 추가하십시오.

## 패턴: 소형 CLI + JSON 파이프 + 승인

JSON을 사용하는 작은 명령을 만든 다음 하나의 Lobster 호출로 연결하십시오. 아래의 명령 이름은 예시이므로 자체 명령으로 바꾸십시오.

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

파이프라인에서 승인을 요청하면 토큰을 사용하여 재개하십시오.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

예시: 입력 항목을 도구 호출로 매핑합니다.

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON 전용 LLM 단계(llm-task)

워크플로 내에서 **구조화된 LLM 단계**를 사용하려면 선택적 `llm-task` Plugin 도구를 활성화한 다음 Lobster에서 호출하십시오.

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

번들로 제공되는 Lobster Plugin은 Gateway 내부에서 워크플로를 **프로세스 내에서** 실행합니다. 이 임베디드 모드에서는 `openclaw.invoke`가 중첩된 OpenClaw CLI 도구 호출에 필요한 Gateway URL/인증 컨텍스트를 자동으로 상속하지 **않습니다**.

따라서 다음 패턴은 **현재 임베디드 러너에서 안정적으로 작동하지 않습니다**.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

아래 예시는 `openclaw.invoke`에 올바른 Gateway/인증 컨텍스트가 이미 구성된 환경에서 **독립 실행형 Lobster CLI**를 실행할 때만 사용하십시오.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "입력 이메일을 바탕으로 의도와 초안을 반환하십시오.",
  "thinking": "low",
  "input": { "subject": "안녕하세요", "body": "도와주실 수 있나요?" },
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

현재 임베디드 Lobster Plugin을 사용하는 경우 다음 중 하나를 권장합니다.

- Lobster 외부에서 `llm-task` 도구를 직접 호출하거나
- 지원되는 임베디드 브리지가 추가될 때까지 Lobster 파이프라인 내부에서 `openclaw.invoke`가 아닌 단계를 사용합니다.

자세한 내용과 구성 옵션은 [LLM 작업](/ko/tools/llm-task)을 참조하십시오.

## 워크플로 파일(.lobster)

Lobster는 `name`, `args`, `steps`, `env`, `condition`, `approval` 필드가 포함된 YAML/JSON 워크플로 파일을 실행할 수 있습니다. 도구 호출의 `pipeline`을 파일 경로로 설정하십시오.

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

- `stdin: $step.stdout` 및 `stdin: $step.json`은 이전 단계의 출력을 전달합니다.
- `condition`(또는 `when`)은 `$step.approved`를 기준으로 단계 실행 여부를 제어할 수 있습니다.

## 도구 매개변수

### `run`

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

인수를 사용하여 워크플로 파일을 실행합니다.

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| 필드             | 기본값      | 참고                                                                                                                 |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | 필수        | 인라인 파이프라인 문자열 또는 워크플로 파일을 나타내는 `.lobster`/`.yaml`/`.yml`/`.json`으로 끝나는 경로입니다.      |
| `cwd`            | Gateway cwd | 상대 작업 디렉터리입니다. Gateway 작업 디렉터리 내부로 해석되어야 합니다(절대 경로는 거부됩니다).                    |
| `timeoutMs`      | `20000`     | 초과하면 실행을 중단합니다.                                                                                          |
| `maxStdoutBytes` | `512000`    | 캡처된 stdout 또는 stderr가 이 크기를 초과하면 실행을 중단합니다.                                                     |
| `argsJson`       | -           | 워크플로 파일에 사용할 인수의 JSON 문자열입니다(인라인 파이프라인에서는 무시됩니다).                                  |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume`은 `token`(`requiresApproval`의 전체 재개 토큰) 또는 `approvalId`(동일한 객체의 짧은 ID)를 허용합니다. 중단된 실행에서 반환한 값을 사용하십시오. `approve`는 필수입니다.

### 관리형 Task Flow 모드

`run`에 `flowControllerId`와 `flowGoal`을 전달하거나 `resume`에 `flowId`와 `flowExpectedRevision`을 전달하면, 호출이 단순 봉투를 반환하는 대신 Plugin 런타임의 관리형 [Task Flow](/ko/automation/taskflow) API를 통해 실행됩니다. OpenClaw는 지속성 있는 흐름 레코드를 생성하거나 재개하고 Lobster 봉투를 적용하며(승인 시 `waiting`, 완료 시 `succeeded`/`failed`), `{ ok, envelope, flow, mutation }`을 반환합니다. 이 모드는 바인딩된 Task Flow 런타임이 필요하며, 일반적인 임시 에이전트 사용이 아니라 Gateway 재시작 후에도 지속되는 흐름 상태가 필요한 Plugin/컨트롤러 코드를 위한 것입니다.

## 출력 봉투

Lobster는 다음 세 상태 중 하나가 포함된 JSON 봉투를 반환합니다.

- `ok` - 성공적으로 완료됨
- `needs_approval` - 일시 중지됨. `requiresApproval`에 `resumeToken`과 짧은 `approvalId`가 포함되며, 둘 중 하나로 실행을 재개할 수 있음
- `cancelled` - 명시적으로 거부되거나 취소됨

도구는 `content`(보기 좋게 구성된 JSON)와 `details`(원시 객체) 모두에 봉투를 제공합니다.

## 승인

`requiresApproval`이 있으면 프롬프트를 검토하고 결정하십시오.

- `approve: true` - 재개하여 부작용이 있는 작업을 계속함
- `approve: false` - 워크플로를 취소하고 종료함

사용자 지정 jq/heredoc 연결 코드 없이 승인 요청에 JSON 미리보기를 첨부하려면 `approve --preview-from-stdin --limit N`을 사용하십시오. 재개 상태는 Lobster 상태 디렉터리(기본값은 `~/.lobster/state`, `LOBSTER_STATE_DIR`로 재정의 가능) 아래의 작은 JSON 파일로 저장됩니다. 토큰 자체에는 전체 파이프라인 상태가 아니라 해당 상태를 가리키는 포인터만 인코딩됩니다.

## OpenProse

OpenProse는 Lobster와 함께 사용하기 좋습니다. `/prose`를 사용하여 멀티 에이전트 준비 작업을 오케스트레이션한 다음, 결정론적 승인을 위해 Lobster 파이프라인을 실행하십시오. Prose 프로그램에 Lobster가 필요한 경우 `tools.subagents.tools`를 통해 하위 에이전트에 `lobster` 도구를 허용하십시오. [OpenProse](/ko/prose)를 참조하십시오.

## 안전성

- **로컬 프로세스 내 실행 전용** - 워크플로는 Gateway 프로세스 내부에서 실행되며 Plugin 자체에서는 네트워크 호출을 수행하지 않습니다.
- **보안 비밀 없음** - Lobster는 OAuth를 관리하지 않으며, 이를 처리하는 OpenClaw 도구를 호출합니다.
- **샌드박스 인식** - 도구 컨텍스트가 샌드박스 처리된 경우 비활성화됩니다.
- **강화됨** - 임베디드 러너가 시간 제한과 출력 상한을 적용합니다.

## 문제 해결

| 오류                                                          | 원인/해결 방법                                                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | 파이프라인이 `timeoutMs`를 초과했습니다. 값을 늘리거나 파이프라인을 분할하십시오.                         |
| `lobster stdout exceeded maxStdoutBytes`(또는 `stderr`)        | 캡처된 출력이 상한을 초과했습니다. `maxStdoutBytes`를 늘리거나 출력을 줄이십시오.                         |
| `run --args-json must be valid JSON`                           | `argsJson`(워크플로 파일 실행)을 구문 분석하지 못했습니다. JSON 문자열을 수정하십시오.                   |
| `lobster runtime failed`(또는 다른 `runtime_error` 메시지)     | 임베디드 런타임이 오류 봉투를 반환했습니다. 자세한 내용은 Gateway 로그를 확인하십시오.                   |

## 자세히 알아보기

- [Plugin](/ko/tools/plugin)
- [Plugin 도구 작성](/ko/plugins/building-plugins#registering-agent-tools)

## 사례 연구: 커뮤니티 워크플로

공개된 사례 중 하나는 3개의 Markdown 볼트(개인용, 파트너용, 공유용)를 관리하는 "세컨드 브레인" CLI + Lobster 파이프라인입니다. 이 CLI는 통계, 받은 편지함 목록, 오래된 항목 스캔 결과를 JSON으로 출력하며, Lobster는 이러한 명령을 각각 승인 게이트가 있는 `weekly-review`, `inbox-triage`, `memory-consolidation`, `shared-task-sync` 같은 워크플로로 연결합니다. AI를 사용할 수 있을 때는 판단(분류)을 처리하고, 사용할 수 없을 때는 결정론적 규칙을 사용합니다.

- 스레드: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 저장소: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 관련 항목

- [자동화](/ko/automation) - 모든 자동화 메커니즘
- [도구 개요](/ko/tools) - 사용 가능한 모든 에이전트 도구
