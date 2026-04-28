---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 에이전트별 샌드박스 + 도구 제한, 우선순위 및 예시
title: 다중 에이전트 샌드박스 및 도구
x-i18n:
    generated_at: "2026-04-26T11:40:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

다중 에이전트 설정에서 각 에이전트는 전역 샌드박스 및 도구 정책을 재정의할 수 있습니다. 이 페이지는 에이전트별 구성, 우선순위 규칙, 예시를 다룹니다.

<CardGroup cols={3}>
  <Card title="샌드박싱" href="/ko/gateway/sandboxing">
    백엔드와 모드 — 전체 샌드박스 참조.
  </Card>
  <Card title="샌드박스 vs 도구 정책 vs elevated" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated">
    "왜 차단되나요?" 디버깅.
  </Card>
  <Card title="Elevated mode" href="/ko/tools/elevated">
    신뢰된 발신자를 위한 elevated exec.
  </Card>
</CardGroup>

<Warning>
인증은 에이전트별입니다. 각 에이전트는 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 자체 `agentDir` 인증 저장소에서 읽습니다. 자격 증명은 에이전트 간에 **공유되지 않습니다**. 절대 여러 에이전트에서 `agentDir`를 재사용하지 마세요. 자격 증명을 공유하려면 `auth-profiles.json`을 다른 에이전트의 `agentDir`로 복사하세요.
</Warning>

---

## 구성 예시

<AccordionGroup>
  <Accordion title="예시 1: 개인용 + 제한된 가족용 에이전트">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "개인 비서",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "가족 봇",
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

    - `main` 에이전트: 호스트에서 실행, 전체 도구 접근 가능
    - `family` 에이전트: Docker에서 실행(에이전트당 컨테이너 1개), `read` 도구만 사용 가능

  </Accordion>
  <Accordion title="예시 2: 공유 샌드박스를 사용하는 업무용 에이전트">
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
  <Accordion title="예시 2b: 전역 coding 프로필 + 메시징 전용 에이전트">
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

    - 기본 에이전트는 coding 도구를 받습니다.
    - `support` 에이전트는 메시징 전용(+ Slack 도구)입니다.

  </Accordion>
  <Accordion title="예시 3: 에이전트별로 다른 샌드박스 모드">
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

전역(`agents.defaults.*`)과 에이전트별(`agents.list[].*`) 구성이 모두 존재할 때:

### 샌드박스 config

에이전트별 설정이 전역 설정을 재정의합니다:

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
`agents.list[].sandbox.{docker,browser,prune}.*`는 해당 에이전트에 대해 `agents.defaults.sandbox.{docker,browser,prune}.*`를 재정의합니다(샌드박스 범위가 `"shared"`로 확인되면 무시됨).
</Note>

### 도구 제한

필터링 순서는 다음과 같습니다:

<Steps>
  <Step title="도구 프로필">
    `tools.profile` 또는 `agents.list[].tools.profile`.
  </Step>
  <Step title="provider 도구 프로필">
    `tools.byProvider[provider].profile` 또는 `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="전역 도구 정책">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="provider 도구 정책">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="에이전트별 도구 정책">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="에이전트 provider 정책">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="샌드박스 도구 정책">
    `tools.sandbox.tools` 또는 `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="하위 에이전트 도구 정책">
    해당되는 경우 `tools.subagents.tools`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="우선순위 규칙">
    - 각 단계는 도구를 더 제한할 수는 있지만, 이전 단계에서 거부된 도구를 다시 허용할 수는 없습니다.
    - `agents.list[].tools.sandbox.tools`가 설정되면 해당 에이전트에 대해 `tools.sandbox.tools`를 대체합니다.
    - `agents.list[].tools.profile`이 설정되면 해당 에이전트에 대해 `tools.profile`을 재정의합니다.
    - provider 도구 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 받을 수 있습니다.

  </Accordion>
  <Accordion title="빈 allowlist 동작">
    해당 체인의 어떤 명시적 allowlist라도 실행 결과 호출 가능한 도구가 하나도 남지 않게 만들면, OpenClaw는 모델에 프롬프트를 제출하기 전에 중단합니다. 이는 의도된 동작입니다. `agents.list[].tools.allow: ["query_db"]`처럼 존재하지 않는 도구로 구성된 에이전트는 `query_db`를 등록하는 Plugin이 활성화될 때까지 크게 실패해야 하며, 텍스트 전용 에이전트로 계속 실행되면 안 됩니다.
  </Accordion>
</AccordionGroup>

도구 정책은 여러 도구로 확장되는 `group:*` 축약형을 지원합니다. 전체 목록은 [Tool groups](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)를 참조하세요.

에이전트별 elevated 재정의(`agents.list[].tools.elevated`)는 특정 에이전트에 대해 elevated exec를 더 제한할 수 있습니다. 자세한 내용은 [Elevated mode](/ko/tools/elevated)를 참조하세요.

---

## 단일 에이전트에서 마이그레이션

<Tabs>
  <Tab title="이전(단일 에이전트)">
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
  <Tab title="이후(다중 에이전트)">
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
레거시 `agent.*` config는 `openclaw doctor`에 의해 마이그레이션됩니다. 앞으로는 `agents.defaults` + `agents.list`를 사용하세요.
</Note>

---

## 도구 제한 예시

<Tabs>
  <Tab title="읽기 전용 에이전트">
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

    이 프로필의 `sessions_history`는 여전히 원시 transcript 덤프가 아니라 제한되고 비공개 처리된 recall 뷰를 반환합니다. assistant recall은 thinking 태그, `<relevant-memories>` scaffolding, 일반 텍스트 tool-call XML payload(``<tool_call>...</tool_call>``, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 tool-call 블록 포함), 낮춰진 tool-call scaffolding, 유출된 ASCII/전각 model 제어 토큰, 잘못된 MiniMax tool-call XML을 비공개 처리/잘림 전에 제거합니다.

  </Tab>
</Tabs>

---

## 흔한 함정: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"`은 에이전트 id가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다. 그룹/채널 세션은 항상 자체 키를 가지므로 non-main으로 취급되어 샌드박스 처리됩니다. 에이전트를 절대 샌드박스에 넣고 싶지 않다면 `agents.list[].sandbox.mode: "off"`로 설정하세요.
</Warning>

---

## 테스트

다중 에이전트 샌드박스와 도구를 구성한 후:

<Steps>
  <Step title="에이전트 확인 확인">__OC_I18N_900010__  </Step>
  <Step title="샌드박스 컨테이너 확인">__OC_I18N_900011__  </Step>
  <Step title="도구 제한 테스트">
    - 제한된 도구가 필요한 메시지를 보냅니다.
    - 에이전트가 거부된 도구를 사용할 수 없는지 확인합니다.

  </Step>
  <Step title="로그 모니터링">__OC_I18N_900012__  </Step>
</Steps>

---

## 문제 해결

<AccordionGroup>
  <Accordion title="`mode: 'all'`인데도 에이전트가 샌드박스되지 않음">
    - 이를 재정의하는 전역 `agents.defaults.sandbox.mode`가 있는지 확인하세요.
    - 에이전트별 config가 우선하므로 `agents.list[].sandbox.mode: "all"`을 설정하세요.

  </Accordion>
  <Accordion title="deny 목록이 있는데도 도구를 여전히 사용할 수 있음">
    - 도구 필터링 순서를 확인하세요: 전역 → 에이전트 → 샌드박스 → 하위 에이전트.
    - 각 단계는 더 제한만 할 수 있고, 다시 허용할 수는 없습니다.
    - 로그로 확인하세요: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="컨테이너가 에이전트별로 격리되지 않음">
    - 에이전트별 샌드박스 config에서 `scope: "agent"`를 설정하세요.
    - 기본값은 `"session"`이며 세션당 컨테이너 하나를 만듭니다.

  </Accordion>
</AccordionGroup>

---

## 관련

- [Elevated mode](/ko/tools/elevated)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [샌드박스 구성](/ko/gateway/config-agents#agentsdefaultssandbox)
- [샌드박스 vs 도구 정책 vs elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) — "왜 차단되나요?" 디버깅
- [샌드박싱](/ko/gateway/sandboxing) — 전체 샌드박스 참조(모드, 범위, 백엔드, 이미지)
- [세션 관리](/ko/concepts/session)
