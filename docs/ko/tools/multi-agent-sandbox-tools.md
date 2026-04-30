---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 에이전트별 샌드박스 및 도구 제한, 우선순위와 예시
title: 다중 에이전트 샌드박스 및 도구
x-i18n:
    generated_at: "2026-04-30T06:54:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

각 agent는 multi-agent 설정에서 전역 sandbox 및 tool 정책을 재정의할 수 있습니다. 이 페이지에서는 agent별 구성, 우선순위 규칙, 예제를 다룹니다.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/ko/gateway/sandboxing">
    백엔드와 모드 — 전체 sandbox 참고 자료입니다.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated">
    "왜 이것이 차단되나요?"를 디버그합니다.
  </Card>
  <Card title="Elevated mode" href="/ko/tools/elevated">
    신뢰할 수 있는 발신자를 위한 elevated exec입니다.
  </Card>
</CardGroup>

<Warning>
인증은 agent별로 범위가 지정됩니다. 각 agent에는 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 자체 `agentDir` 인증 저장소가 있습니다. agent 간에 `agentDir`를 절대 재사용하지 마세요. agent에 로컬 프로필이 없을 때 기본/main agent의 인증 프로필을 읽을 수 있지만, OAuth refresh token은 보조 agent 저장소로 복제되지 않습니다. 자격 증명을 수동으로 복사하는 경우, 이식 가능한 정적 `api_key` 또는 `token` 프로필만 복사하세요.
</Warning>

---

## 구성 예제

<AccordionGroup>
  <Accordion title="예제 1: 개인용 + 제한된 가족 agent">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **결과:**

    - `main` agent: 호스트에서 실행되며, 전체 tool 접근 권한이 있습니다.
    - `family` agent: Docker에서 실행되며(agent당 컨테이너 하나), `read` tool만 사용할 수 있습니다.

  </Accordion>
  <Accordion title="예제 2: 공유 sandbox를 사용하는 업무용 agent">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="예제 2b: 전역 코딩 프로필 + 메시징 전용 agent">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **결과:**

    - 기본 agent는 코딩 tool을 받습니다.
    - `support` agent는 메시징 전용입니다(+ Slack tool).

  </Accordion>
  <Accordion title="예제 3: agent별로 다른 sandbox 모드">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## 구성 우선순위

전역(`agents.defaults.*`) 구성과 agent별(`agents.list[].*`) 구성이 모두 있는 경우:

### Sandbox 구성

agent별 설정이 전역 설정을 재정의합니다.

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*`는 해당 agent에 대해 `agents.defaults.sandbox.{docker,browser,prune}.*`를 재정의합니다(sandbox 범위가 `"shared"`로 해석되면 무시됨).
</Note>

### Tool 제한

필터링 순서는 다음과 같습니다.

<Steps>
  <Step title="Tool 프로필">
    `tools.profile` 또는 `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider tool 프로필">
    `tools.byProvider[provider].profile` 또는 `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="전역 tool 정책">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider tool 정책">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agent별 tool 정책">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent provider 정책">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox tool 정책">
    `tools.sandbox.tools` 또는 `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent tool 정책">
    해당되는 경우 `tools.subagents.tools`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="우선순위 규칙">
    - 각 수준은 tool을 추가로 제한할 수 있지만, 이전 수준에서 거부된 tool을 다시 허용할 수는 없습니다.
    - `agents.list[].tools.sandbox.tools`가 설정된 경우, 해당 agent에 대해 `tools.sandbox.tools`를 대체합니다.
    - `agents.list[].tools.profile`이 설정된 경우, 해당 agent에 대해 `tools.profile`을 재정의합니다.
    - Provider tool 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 허용합니다.

  </Accordion>
  <Accordion title="빈 허용 목록 동작">
    해당 체인의 명시적 허용 목록 중 하나라도 실행에 호출 가능한 tool이 남지 않게 만들면, OpenClaw는 모델에 프롬프트를 제출하기 전에 중지합니다. 이는 의도된 동작입니다. `agents.list[].tools.allow: ["query_db"]`처럼 누락된 tool로 구성된 agent는 `query_db`를 등록하는 Plugin이 활성화될 때까지 명확히 실패해야 하며, 텍스트 전용 agent로 계속 진행해서는 안 됩니다.
  </Accordion>
</AccordionGroup>

Tool 정책은 여러 tool로 확장되는 `group:*` 축약형을 지원합니다. 전체 목록은 [Tool groups](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)를 참조하세요.

agent별 elevated 재정의(`agents.list[].tools.elevated`)는 특정 agent의 elevated exec를 추가로 제한할 수 있습니다. 자세한 내용은 [Elevated mode](/ko/tools/elevated)를 참조하세요.

---

## 단일 agent에서 마이그레이션

<Tabs>
  <Tab title="이전(단일 agent)">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="이후(multi-agent)">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
레거시 `agent.*` 구성은 `openclaw doctor`로 마이그레이션됩니다. 앞으로는 `agents.defaults` + `agents.list`를 사용하는 것이 좋습니다.
</Note>

---

## Tool 제한 예제

<Tabs>
  <Tab title="읽기 전용 agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="안전한 실행(파일 수정 없음)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="통신 전용">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    이 프로필의 `sessions_history`는 원시 transcript dump가 아니라 제한되고 정제된 recall view를 계속 반환합니다. Assistant recall은 thinking tag, `<relevant-memories>` scaffolding, 일반 텍스트 tool-call XML payload(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 잘린 tool-call block 포함), downgraded tool-call scaffolding, 유출된 ASCII/full-width 모델 제어 token, 잘못된 형식의 MiniMax tool-call XML을 redaction/truncation 전에 제거합니다.

  </Tab>
</Tabs>

---

## 흔한 함정: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"`은 agent id가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다. 그룹/채널 세션은 항상 자체 키를 받으므로 non-main으로 처리되어 sandbox가 적용됩니다. 특정 agent에 sandbox를 절대 적용하지 않으려면 `agents.list[].sandbox.mode: "off"`를 설정하세요.
</Warning>

---

## 테스트

multi-agent sandbox와 tool을 구성한 후:

<Steps>
  <Step title="Agent 해석 확인">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Sandbox 컨테이너 확인">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Tool 제한 테스트">
    - 제한된 tool이 필요한 메시지를 보냅니다.
    - agent가 거부된 tool을 사용할 수 없는지 확인합니다.

  </Step>
  <Step title="로그 모니터링">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## 문제 해결

<AccordionGroup>
  <Accordion title="`mode: 'all'`임에도 agent에 sandbox가 적용되지 않음">
    - 이를 재정의하는 전역 `agents.defaults.sandbox.mode`가 있는지 확인합니다.
    - agent별 구성이 우선하므로 `agents.list[].sandbox.mode: "all"`을 설정하세요.

  </Accordion>
  <Accordion title="deny 목록에도 불구하고 tool이 계속 사용 가능함">
    - tool 필터링 순서를 확인하세요: 전역 → agent → sandbox → subagent.
    - 각 수준은 추가로 제한만 할 수 있으며, 다시 허용할 수는 없습니다.
    - 로그로 확인하세요: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="컨테이너가 agent별로 격리되지 않음">
    - agent별 sandbox 구성에서 `scope: "agent"`를 설정하세요.
    - 기본값은 `"session"`이며, 세션당 하나의 컨테이너를 생성합니다.

  </Accordion>
</AccordionGroup>

---

## 관련 항목

- [Elevated mode](/ko/tools/elevated)
- [Multi-agent routing](/ko/concepts/multi-agent)
- [Sandbox configuration](/ko/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) — "왜 이것이 차단되나요?" 디버깅
- [Sandboxing](/ko/gateway/sandboxing) — 전체 sandbox 참고 자료(모드, 범위, 백엔드, 이미지)
- [Session management](/ko/concepts/session)
