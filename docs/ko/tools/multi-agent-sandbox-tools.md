---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 에이전트별 샌드박스 + 도구 제한, 우선순위 및 예시
title: 멀티 에이전트 샌드박스 및 도구
x-i18n:
    generated_at: "2026-05-11T20:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

다중 에이전트 설정의 각 에이전트는 전역 샌드박스 및 도구 정책을 재정의할 수 있습니다. 이 페이지에서는 에이전트별 구성, 우선순위 규칙, 예시를 다룹니다.

<CardGroup cols={3}>
  <Card title="샌드박싱" href="/ko/gateway/sandboxing">
    백엔드와 모드 — 전체 샌드박스 참조입니다.
  </Card>
  <Card title="샌드박스 vs 도구 정책 vs 승격" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated">
    "왜 이것이 차단되나요?"를 디버그합니다.
  </Card>
  <Card title="승격 모드" href="/ko/tools/elevated">
    신뢰할 수 있는 발신자를 위한 승격된 exec입니다.
  </Card>
</CardGroup>

<Warning>
인증은 에이전트별로 범위가 지정됩니다. 각 에이전트에는 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 자체 `agentDir` 인증 저장소가 있습니다. 에이전트 간에 `agentDir`를 재사용하지 마세요. 로컬 프로필이 없을 때 에이전트는 기본/메인 에이전트의 인증 프로필을 읽어 사용할 수 있지만, OAuth 갱신 토큰은 보조 에이전트 저장소로 복제되지 않습니다. 자격 증명을 수동으로 복사하는 경우 이식 가능한 정적 `api_key` 또는 `token` 프로필만 복사하세요.
</Warning>

---

## 구성 예시

<AccordionGroup>
  <Accordion title="예시 1: 개인용 + 제한된 가족 에이전트">
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
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
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

    - `main` 에이전트: 호스트에서 실행되며 전체 도구에 접근합니다.
    - `family` 에이전트: Docker에서 실행되며(에이전트당 컨테이너 하나), `read`와 현재 대화 메시지 전송만 허용됩니다.

  </Accordion>
  <Accordion title="예시 2: 공유 샌드박스를 사용하는 업무 에이전트">
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
  <Accordion title="예시 2b: 전역 코딩 프로필 + 메시징 전용 에이전트">
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

    - 기본 에이전트는 코딩 도구를 받습니다.
    - `support` 에이전트는 메시징 전용입니다(+ Slack 도구).

  </Accordion>
  <Accordion title="예시 3: 에이전트별 서로 다른 샌드박스 모드">
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

전역(`agents.defaults.*`) 구성과 에이전트별(`agents.list[].*`) 구성이 모두 있는 경우:

### 샌드박스 구성

에이전트별 설정이 전역 설정을 재정의합니다.

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
`agents.list[].sandbox.{docker,browser,prune}.*`는 해당 에이전트에 대해 `agents.defaults.sandbox.{docker,browser,prune}.*`를 재정의합니다(샌드박스 범위가 `"shared"`로 해석되면 무시됨).
</Note>

### 도구 제한

필터링 순서는 다음과 같습니다.

<Steps>
  <Step title="도구 프로필">
    `tools.profile` 또는 `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider 도구 프로필">
    `tools.byProvider[provider].profile` 또는 `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="전역 도구 정책">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider 도구 정책">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="에이전트별 도구 정책">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="에이전트 Provider 정책">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="샌드박스 도구 정책">
    `tools.sandbox.tools` 또는 `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="하위 에이전트 도구 정책">
    해당하는 경우 `tools.subagents.tools`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="우선순위 규칙">
    - 각 수준은 도구를 더 제한할 수 있지만, 이전 수준에서 거부된 도구를 다시 허용할 수는 없습니다.
    - `agents.list[].tools.sandbox.tools`가 설정되어 있으면 해당 에이전트에 대해 `tools.sandbox.tools`를 대체합니다.
    - `agents.list[].tools.profile`이 설정되어 있으면 해당 에이전트에 대해 `tools.profile`을 재정의합니다.
    - Provider 도구 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 허용합니다.

  </Accordion>
  <Accordion title="빈 허용 목록 동작">
    해당 체인의 명시적 허용 목록 중 하나라도 실행에 호출 가능한 도구가 없게 만들면, OpenClaw는 프롬프트를 모델에 제출하기 전에 중지합니다. 이는 의도된 동작입니다. `agents.list[].tools.allow: ["query_db"]`처럼 누락된 도구로 구성된 에이전트는 `query_db`를 등록하는 Plugin이 활성화될 때까지 명확하게 실패해야 하며, 텍스트 전용 에이전트로 계속 실행되어서는 안 됩니다.
  </Accordion>
</AccordionGroup>

도구 정책은 여러 도구로 확장되는 `group:*` 축약형을 지원합니다. 전체 목록은 [도구 그룹](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)을 참조하세요.

에이전트별 승격 재정의(`agents.list[].tools.elevated`)는 특정 에이전트에 대해 승격된 exec를 추가로 제한할 수 있습니다. 자세한 내용은 [승격 모드](/ko/tools/elevated)를 참조하세요.

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
레거시 `agent.*` 구성은 `openclaw doctor`로 마이그레이션됩니다. 앞으로는 `agents.defaults` + `agents.list`를 사용하는 것이 좋습니다.
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
  <Tab title="파일 시스템 도구가 비활성화된 셸 실행">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    이 정책은 OpenClaw 파일 시스템 도구를 비활성화하지만, `exec`는 여전히 셸이므로 선택한 호스트나 샌드박스 파일 시스템이 허용하는 모든 위치에 파일을 쓸 수 있습니다. 읽기 전용 에이전트의 경우 `exec`와 `process`를 거부하거나, 셸 액세스를 `agents.defaults.sandbox.workspaceAccess: "ro"` 또는 `"none"` 같은 샌드박스 파일 시스템 제어와 결합하세요.
    </Warning>

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

    이 프로필의 `sessions_history`는 원시 트랜스크립트 덤프가 아니라 제한되고 정제된 리콜 보기를 계속 반환합니다. 어시스턴트 리콜은 수정/잘라내기 전에 사고 태그, `<relevant-memories>` 스캐폴딩, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함), 다운그레이드된 도구 호출 스캐폴딩, 유출된 ASCII/전각 모델 제어 토큰, 형식이 잘못된 MiniMax 도구 호출 XML을 제거합니다.

  </Tab>
</Tabs>

---

## 흔한 함정: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"`은 에이전트 ID가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다. 그룹/채널 세션은 항상 자체 키를 받으므로 non-main으로 처리되어 샌드박스 처리됩니다. 에이전트가 샌드박스를 절대 사용하지 않도록 하려면 `agents.list[].sandbox.mode: "off"`를 설정하세요.
</Warning>

---

## 테스트

다중 에이전트 샌드박스와 도구를 구성한 후:

<Steps>
  <Step title="에이전트 해석 확인">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="샌드박스 컨테이너 확인">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="도구 제한 테스트">
    - 제한된 도구가 필요한 메시지를 보냅니다.
    - 에이전트가 거부된 도구를 사용할 수 없는지 확인합니다.

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
  <Accordion title="`mode: 'all'`인데도 에이전트가 샌드박스 처리되지 않음">
    - 이를 재정의하는 전역 `agents.defaults.sandbox.mode`가 있는지 확인합니다.
    - 에이전트별 구성이 우선하므로 `agents.list[].sandbox.mode: "all"`을 설정하세요.

  </Accordion>
  <Accordion title="거부 목록이 있는데도 도구가 계속 사용 가능함">
    - 도구 필터링 순서를 확인합니다: 전역 → 에이전트 → 샌드박스 → 하위 에이전트.
    - 각 수준은 더 제한할 수만 있으며, 다시 허용할 수는 없습니다.
    - 로그로 확인합니다: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="컨테이너가 에이전트별로 격리되지 않음">
    - 에이전트별 샌드박스 구성에서 `scope: "agent"`를 설정합니다.
    - 기본값은 `"session"`이며, 세션당 하나의 컨테이너를 생성합니다.

  </Accordion>
</AccordionGroup>

---

## 관련

- [승격 모드](/ko/tools/elevated)
- [다중 에이전트 라우팅](/ko/concepts/multi-agent)
- [샌드박스 구성](/ko/gateway/config-agents#agentsdefaultssandbox)
- [샌드박스 vs 도구 정책 vs 승격](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) — "왜 이것이 차단되나요?" 디버깅
- [샌드박싱](/ko/gateway/sandboxing) — 전체 샌드박스 참조(모드, 범위, 백엔드, 이미지)
- [세션 관리](/ko/concepts/session)
