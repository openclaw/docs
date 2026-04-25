---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: 에이전트별 sandbox + 도구 제한, 우선순위, 그리고 예시
title: 다중 에이전트 sandbox & 도구
x-i18n:
    generated_at: "2026-04-25T06:12:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# 다중 에이전트 sandbox 및 도구 구성

다중 에이전트 설정의 각 에이전트는 전역 sandbox와 도구
정책을 재정의할 수 있습니다. 이 페이지에서는 에이전트별 구성, 우선순위 규칙, 예시를 다룹니다.

- **Sandbox 백엔드 및 모드**: [Sandboxing](/ko/gateway/sandboxing) 참고
- **차단된 도구 디버깅**: [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) 및 `openclaw sandbox explain` 참고
- **Elevated exec**: [Elevated Mode](/ko/tools/elevated) 참고

인증은 에이전트별입니다. 각 에이전트는
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 자체 `agentDir` 인증 저장소를 읽습니다.
자격 증명은 **에이전트 간에 공유되지 않습니다**. 절대로 에이전트 간에 `agentDir`를 재사용하지 마세요.
자격 증명을 공유하려면 `auth-profiles.json`을 다른 에이전트의 `agentDir`로 복사하세요.

---

## 구성 예시

### 예시 1: 개인용 + 제한된 가족용 에이전트

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

- `main` 에이전트: 호스트에서 실행, 전체 도구 접근 가능
- `family` 에이전트: Docker에서 실행(에이전트당 하나의 컨테이너), `read` 도구만 사용 가능

---

### 예시 2: 공유 sandbox를 사용하는 업무용 에이전트

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

---

### 예시 2b: 전역 coding profile + 메시징 전용 에이전트

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

- 기본 에이전트는 coding 도구를 받음
- `support` 에이전트는 메시징 전용(+ Slack 도구)

---

### 예시 3: 에이전트별로 다른 sandbox 모드

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // 전역 기본값
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // 재정의: main은 절대 sandbox되지 않음
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // 재정의: public은 항상 sandbox됨
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

---

## 구성 우선순위

전역(`agents.defaults.*`)과 에이전트별(`agents.list[].*`) config가 모두 존재할 때:

### Sandbox Config

에이전트별 설정이 전역보다 우선합니다:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**참고:**

- `agents.list[].sandbox.{docker,browser,prune}.*`는 해당 에이전트에 대해 `agents.defaults.sandbox.{docker,browser,prune}.*`를 재정의합니다(sandbox 범위가 `"shared"`로 확인되면 무시됨).

### 도구 제한

필터링 순서는 다음과 같습니다.

1. **도구 profile** (`tools.profile` 또는 `agents.list[].tools.profile`)
2. **provider 도구 profile** (`tools.byProvider[provider].profile` 또는 `agents.list[].tools.byProvider[provider].profile`)
3. **전역 도구 정책** (`tools.allow` / `tools.deny`)
4. **provider 도구 정책** (`tools.byProvider[provider].allow/deny`)
5. **에이전트별 도구 정책** (`agents.list[].tools.allow/deny`)
6. **에이전트 provider 정책** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Sandbox 도구 정책** (`tools.sandbox.tools` 또는 `agents.list[].tools.sandbox.tools`)
8. **Subagent 도구 정책** (`tools.subagents.tools`, 해당되는 경우)

각 단계는 도구를 추가로 제한할 수는 있지만, 이전 단계에서 거부된 도구를 다시 허용할 수는 없습니다.
`agents.list[].tools.sandbox.tools`가 설정되어 있으면 해당 에이전트에 대해 `tools.sandbox.tools`를 대체합니다.
`agents.list[].tools.profile`이 설정되어 있으면 해당 에이전트에 대해 `tools.profile`을 재정의합니다.
Provider 도구 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 받을 수 있습니다.

해당 체인의 명시적 allowlist 중 하나라도 실행 가능한 도구를 하나도 남기지 않으면,
OpenClaw는 프롬프트를 모델에 제출하기 전에 중단합니다. 이것은 의도된 동작입니다:
`agents.list[].tools.allow: ["query_db"]`처럼
존재하지 않는 도구로 구성된 에이전트는 해당
`query_db`를 등록하는 plugin이 활성화될 때까지 텍스트 전용 에이전트로 계속 동작하는 대신
명확하게 실패해야 합니다.

도구 정책은 여러 도구로 확장되는 `group:*` 단축 표기를 지원합니다. 전체 목록은 [Tool groups](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)를 참고하세요.

에이전트별 elevated 재정의(`agents.list[].tools.elevated`)는 특정 에이전트에 대한 elevated exec를 추가로 제한할 수 있습니다. 자세한 내용은 [Elevated Mode](/ko/tools/elevated)를 참고하세요.

---

## 단일 에이전트에서 마이그레이션

**이전(단일 에이전트):**

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

**이후(다른 profile을 사용하는 다중 에이전트):**

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

레거시 `agent.*` config는 `openclaw doctor`로 마이그레이션됩니다. 앞으로는 `agents.defaults` + `agents.list`를 사용하세요.

---

## 도구 제한 예시

### 읽기 전용 에이전트

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### 안전한 실행 에이전트(파일 수정 없음)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### 커뮤니케이션 전용 에이전트

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

이 profile의 `sessions_history`는 여전히 원시 transcript dump가 아니라
제한되고 정리된 recall
보기를 반환합니다. assistant recall은 thinking 태그,
`<relevant-memories>` scaffolding, 일반 텍스트 tool-call XML payload
(예: `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, 그리고 잘린 tool-call 블록),
낮은 수준의 tool-call scaffolding, 유출된 ASCII/전각 모델 제어
token, 잘못된 MiniMax tool-call XML을 redaction/truncation 전에 제거합니다.

---

## 흔한 함정: "non-main"

`agents.defaults.sandbox.mode: "non-main"`은 에이전트 id가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 동작합니다.
그룹/채널 세션은 항상 자체 키를 가지므로
non-main으로 취급되어 sandbox됩니다. 에이전트를 절대로
sandbox하지 않게 하려면 `agents.list[].sandbox.mode: "off"`를 설정하세요.

---

## 테스트

다중 에이전트 sandbox와 도구를 구성한 뒤:

1. **에이전트 확인 확인:**

   ```exec
   openclaw agents list --bindings
   ```

2. **sandbox 컨테이너 확인:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **도구 제한 테스트:**
   - 제한된 도구가 필요한 메시지를 보냅니다
   - 에이전트가 거부된 도구를 사용할 수 없는지 확인합니다

4. **로그 모니터링:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## 문제 해결

### `mode: "all"`인데도 에이전트가 sandbox되지 않음

- 이를 재정의하는 전역 `agents.defaults.sandbox.mode`가 있는지 확인하세요
- 에이전트별 config가 우선하므로 `agents.list[].sandbox.mode: "all"`을 설정하세요

### deny 목록이 있는데도 도구를 계속 사용할 수 있음

- 도구 필터링 순서를 확인하세요: 전역 → 에이전트 → sandbox → subagent
- 각 단계는 추가로 제한만 할 수 있으며 다시 허용할 수는 없습니다
- 로그로 확인: `[tools] filtering tools for agent:${agentId}`

### 컨테이너가 에이전트별로 격리되지 않음

- 에이전트별 sandbox config에서 `scope: "agent"`를 설정하세요
- 기본값은 `"session"`이며 세션당 하나의 컨테이너를 만듭니다

---

## 관련

- [Sandboxing](/ko/gateway/sandboxing) -- 전체 sandbox 참조(모드, 범위, 백엔드, 이미지)
- [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated) -- "왜 이게 차단되었는가?" 디버깅
- [Elevated Mode](/ko/tools/elevated)
- [Multi-Agent Routing](/ko/concepts/multi-agent)
- [Sandbox Configuration](/ko/gateway/config-agents#agentsdefaultssandbox)
- [Session Management](/ko/concepts/session)
