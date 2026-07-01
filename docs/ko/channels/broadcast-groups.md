---
read_when:
    - 브로드캐스트 그룹 구성하기
    - WhatsApp에서 다중 에이전트 응답 디버깅
sidebarTitle: Broadcast groups
status: experimental
summary: 여러 에이전트에게 WhatsApp 메시지 브로드캐스트하기
title: 브로드캐스트 그룹
x-i18n:
    generated_at: "2026-07-01T05:31:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**상태:** 실험적 기능. 2026.1.9에 추가됨.
</Note>

## 개요

브로드캐스트 그룹을 사용하면 여러 에이전트가 동일한 메시지를 동시에 처리하고 응답할 수 있습니다. 이를 통해 하나의 WhatsApp 그룹 또는 DM에서 함께 작업하는 전문 에이전트 팀을 만들 수 있으며, 모두 하나의 전화번호를 사용합니다.

현재 범위: **WhatsApp 전용**(웹 채널).

브로드캐스트 그룹은 채널 허용 목록과 그룹 활성화 규칙 이후에 평가됩니다. WhatsApp 그룹에서는 OpenClaw가 일반적으로 응답할 때 브로드캐스트가 발생한다는 뜻입니다(예: 그룹 설정에 따라 멘션 시).

실시간 WhatsApp QA 레인에는 `whatsapp-broadcast-group-fanout`이 포함되어 있으며, 하나의 멘션된 그룹 메시지가 구성된 두 에이전트에서 서로 다른 가시적 응답을 생성할 수 있는지 확인합니다.

## 사용 사례

<AccordionGroup>
  <Accordion title="1. 전문 에이전트 팀">
    원자적이고 집중된 책임을 가진 여러 에이전트를 배포합니다.

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    각 에이전트는 동일한 메시지를 처리하고 자신의 전문 관점을 제공합니다.

  </Accordion>
  <Accordion title="2. 다국어 지원">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. 품질 보증 워크플로">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. 작업 자동화">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## 구성

### 기본 설정

최상위 `broadcast` 섹션을 추가합니다(`bindings` 옆). 키는 WhatsApp 피어 ID입니다.

- 그룹 채팅: 그룹 JID(예: `120363403215116621@g.us`)
- DM: E.164 전화번호(예: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**결과:** OpenClaw가 이 채팅에서 응답해야 할 때 세 에이전트를 모두 실행합니다.

### 처리 전략

에이전트가 메시지를 처리하는 방식을 제어합니다.

<Tabs>
  <Tab title="parallel(기본값)">
    모든 에이전트가 동시에 처리합니다.

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    에이전트가 순서대로 처리합니다(하나가 이전 에이전트가 끝날 때까지 기다림).

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### 전체 예시

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 작동 방식

### 메시지 흐름

<Steps>
  <Step title="수신 메시지 도착">
    WhatsApp 그룹 또는 DM 메시지가 도착합니다.
  </Step>
  <Step title="라우팅 및 허용">
    OpenClaw는 채널 허용 목록, 그룹 활성화 규칙, 구성된 ACP 바인딩 소유권을 적용합니다.
  </Step>
  <Step title="브로드캐스트 확인">
    구성된 ACP 바인딩이 라우트를 소유하지 않으면 OpenClaw는 피어 ID가 `broadcast`에 있는지 확인합니다.
  </Step>
  <Step title="브로드캐스트가 적용되는 경우">
    - 나열된 모든 에이전트가 메시지를 처리합니다.
    - 각 에이전트는 자체 세션 키와 격리된 컨텍스트를 가집니다.
    - 에이전트는 병렬(기본값) 또는 순차적으로 처리합니다.

  </Step>
  <Step title="브로드캐스트가 적용되지 않는 경우">
    OpenClaw는 일반 라우트 또는 라우팅 중 선택된 구성된 ACP 세션 라우트로 디스패치합니다.
  </Step>
</Steps>

<Note>
브로드캐스트 그룹은 채널 허용 목록이나 그룹 활성화 규칙(멘션/명령 등)을 우회하지 않습니다. 메시지가 처리 대상일 때 _어떤 에이전트가 실행되는지_만 변경합니다.
</Note>

### 세션 격리

브로드캐스트 그룹의 각 에이전트는 다음을 완전히 별도로 유지합니다.

- **세션 키**(`agent:alfred:whatsapp:group:120363...` 및 `agent:baerbel:whatsapp:group:120363...`)
- **대화 기록**(에이전트는 다른 에이전트의 메시지를 보지 않음)
- **작업 영역**(구성된 경우 별도 샌드박스)
- **도구 접근 권한**(서로 다른 허용/거부 목록)
- **메모리/컨텍스트**(별도의 IDENTITY.md, SOUL.md 등)
- **그룹 컨텍스트 버퍼**(컨텍스트에 사용되는 최근 그룹 메시지)는 피어별로 공유되므로, 트리거될 때 모든 브로드캐스트 에이전트가 동일한 컨텍스트를 봅니다.

이를 통해 각 에이전트는 다음을 가질 수 있습니다.

- 서로 다른 성격
- 서로 다른 도구 접근 권한(예: 읽기 전용 및 읽기-쓰기)
- 서로 다른 모델(예: opus 및 sonnet)
- 서로 다른 Skills 설치

### 예시: 격리된 세션

에이전트 `["alfred", "baerbel"]`가 있는 그룹 `120363403215116621@g.us`에서:

<Tabs>
  <Tab title="Alfred의 컨텍스트">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel의 컨텍스트">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## 모범 사례

<AccordionGroup>
  <Accordion title="1. 에이전트를 집중적으로 유지">
    각 에이전트를 하나의 명확한 책임으로 설계합니다.

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **좋음:** 각 에이전트가 하나의 작업을 담당합니다. ❌ **나쁨:** 하나의 일반적인 "dev-helper" 에이전트.

  </Accordion>
  <Accordion title="2. 설명적인 이름 사용">
    각 에이전트가 무엇을 하는지 명확하게 만듭니다.

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. 서로 다른 도구 접근 권한 구성">
    에이전트에 필요한 도구만 부여합니다.

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer`는 읽기 전용입니다. `fixer`는 읽고 쓸 수 있습니다.

  </Accordion>
  <Accordion title="4. 성능 모니터링">
    에이전트가 많을 때는 다음을 고려하세요.

    - 속도를 위해 `"strategy": "parallel"`(기본값) 사용
    - 브로드캐스트 그룹을 5-10개 에이전트로 제한
    - 더 단순한 에이전트에는 더 빠른 모델 사용

  </Accordion>
  <Accordion title="5. 실패를 적절히 처리">
    에이전트는 독립적으로 실패합니다. 한 에이전트의 오류가 다른 에이전트를 막지 않습니다.

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## 호환성

### 제공자

브로드캐스트 그룹은 현재 다음과 함께 작동합니다.

- ✅ WhatsApp(구현됨)
- 🚧 Telegram(계획됨)
- 🚧 Discord(계획됨)
- 🚧 Slack(계획됨)

### 라우팅

브로드캐스트 그룹은 기존 라우팅과 함께 작동합니다.

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: alfred만 응답합니다(일반 라우팅).
- `GROUP_B`: agent1과 agent2가 응답합니다(브로드캐스트).

<Note>
**우선순위:** `broadcast`는 일반 라우트 바인딩보다 우선합니다. 구성된 ACP 바인딩(`bindings[].type="acp"`)은 배타적입니다. 일치하는 경우 OpenClaw는 팬아웃 브로드캐스트 대신 구성된 ACP 세션으로 디스패치합니다.
</Note>

## 문제 해결

<AccordionGroup>
  <Accordion title="에이전트가 응답하지 않음">
    **확인:**

    1. 에이전트 ID가 `agents.list`에 존재합니다.
    2. 피어 ID 형식이 올바릅니다(예: `120363403215116621@g.us`).
    3. 에이전트가 거부 목록에 없습니다.

    **디버그:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="하나의 에이전트만 응답함">
    **원인:** 피어 ID가 일반 라우트 바인딩에는 있지만 `broadcast`에는 없거나, 배타적인 구성된 ACP 바인딩과 일치할 수 있습니다.

    **수정:** 일반 라우트에 바인딩된 피어를 브로드캐스트 구성에 추가하거나, 팬아웃 브로드캐스트를 원하는 경우 구성된 ACP 바인딩을 제거/변경합니다.

  </Accordion>
  <Accordion title="성능 문제">
    많은 에이전트로 인해 느린 경우:

    - 그룹당 에이전트 수를 줄입니다.
    - 더 가벼운 모델을 사용합니다(opus 대신 sonnet).
    - 샌드박스 시작 시간을 확인합니다.

  </Accordion>
</AccordionGroup>

## 예시

<AccordionGroup>
  <Accordion title="예시 1: 코드 리뷰 팀">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **사용자 전송:** 코드 스니펫.

    **응답:**

    - code-formatter: "들여쓰기를 수정하고 타입 힌트를 추가했습니다"
    - security-scanner: "⚠️ 12번째 줄에 SQL 인젝션 취약점이 있습니다"
    - test-coverage: "커버리지는 45%이며, 오류 사례에 대한 테스트가 없습니다"
    - docs-checker: "`process_data` 함수의 docstring이 없습니다"

  </Accordion>
  <Accordion title="예시 2: 다국어 지원">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## API 참조

### 구성 스키마

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 필드

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  에이전트를 처리하는 방식입니다. `parallel`은 모든 에이전트를 동시에 실행하고, `sequential`은 배열 순서대로 실행합니다.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 그룹 JID, E.164 번호 또는 기타 피어 ID입니다. 값은 메시지를 처리해야 하는 에이전트 ID의 배열입니다.
</ParamField>

## 제한 사항

1. **최대 에이전트 수:** 엄격한 제한은 없지만, 에이전트가 10개 이상이면 느릴 수 있습니다.
2. **공유 컨텍스트:** 에이전트는 서로의 응답을 볼 수 없습니다(의도된 설계입니다).
3. **메시지 순서:** 병렬 응답은 어떤 순서로든 도착할 수 있습니다.
4. **속도 제한:** 모든 에이전트가 WhatsApp 속도 제한에 포함됩니다.

## 향후 개선 사항

계획된 기능:

- [ ] 공유 컨텍스트 모드(에이전트가 서로의 응답을 볼 수 있음)
- [ ] 에이전트 조정(에이전트가 서로에게 신호를 보낼 수 있음)
- [ ] 동적 에이전트 선택(메시지 콘텐츠를 기준으로 에이전트 선택)
- [ ] 에이전트 우선순위(일부 에이전트가 다른 에이전트보다 먼저 응답)

## 관련 항목

- [채널 라우팅](/ko/channels/channel-routing)
- [그룹](/ko/channels/groups)
- [멀티 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
- [페어링](/ko/channels/pairing)
- [세션 관리](/ko/concepts/session)
