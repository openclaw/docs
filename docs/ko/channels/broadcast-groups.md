---
read_when:
    - 브로드캐스트 그룹 구성하기
    - WhatsApp의 멀티 에이전트 응답 디버깅
sidebarTitle: Broadcast groups
status: experimental
summary: WhatsApp 메시지를 여러 에이전트에게 브로드캐스트하기
title: 브로드캐스트 그룹
x-i18n:
    generated_at: "2026-07-12T14:58:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**상태:** 실험적 기능입니다. 2026.1.9에 추가되었습니다. WhatsApp(웹 채널)에서만 사용할 수 있습니다.
</Note>

## 개요

브로드캐스트 그룹은 동일한 수신 메시지에 대해 **여러 에이전트**를 실행합니다. 각 에이전트는 자체적으로 격리된 세션에서 메시지를 처리하고 자체 응답을 게시하므로, 하나의 WhatsApp 번호로 단일 그룹 채팅이나 DM에서 전문 에이전트 팀을 운영할 수 있습니다.

브로드캐스트 그룹은 채널 허용 목록과 그룹 활성화 규칙이 적용된 후 평가됩니다. WhatsApp 그룹에서는 OpenClaw가 정상적으로 응답하는 경우에 브로드캐스트가 실행됩니다(예: 그룹 설정에 따라 멘션 시). 브로드캐스트 그룹은 메시지를 처리할 수 있는지 여부가 아니라 **어떤 에이전트가 실행되는지**만 변경합니다.

실제 WhatsApp QA 레인에는 `whatsapp-broadcast-group-fanout`이 포함되어 있으며, 멘션이 포함된 하나의 그룹 메시지에 대해 구성된 두 에이전트가 서로 구분되는 응답을 표시할 수 있는지 검증합니다.

## 구성

### 기본 설정

최상위 수준에 `broadcast` 섹션을 추가합니다(`bindings`와 같은 수준). 키는 WhatsApp 피어 ID이고, 값은 에이전트 ID 배열입니다.

- 그룹 채팅: 그룹 JID(예: `120363403215116621@g.us`)
- DM: 발신자의 E.164 전화번호(예: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**결과:** OpenClaw가 이 채팅에 응답하는 경우 세 에이전트를 모두 실행합니다.

나열된 모든 에이전트 ID는 `agents.list`에 있어야 합니다. 구성 검증 시 알 수 없는 ID가 보고되며, 런타임은 `Broadcast agent <id> not found in agents.list; skipping` 경고를 표시하고 해당 ID를 건너뜁니다.

### 처리 전략

`broadcast.strategy`는 에이전트가 메시지를 처리하는 방식을 설정합니다.

| 전략                 | 동작                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `parallel`(기본값)   | 모든 에이전트가 동시에 처리하며, 응답은 순서와 관계없이 도착합니다.   |
| `sequential`         | 에이전트가 배열 순서대로 처리하며, 각각 이전 에이전트가 완료될 때까지 기다립니다. |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

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
  <Step title="라우팅 및 수락">
    OpenClaw는 채널 허용 목록, 그룹 활성화 규칙, 구성된 ACP 바인딩 소유권을 적용합니다.
  </Step>
  <Step title="브로드캐스트 확인">
    구성된 ACP 바인딩이 라우트를 소유하지 않으면 OpenClaw는 피어 ID가 `broadcast`에 있는지 확인합니다.
  </Step>
  <Step title="브로드캐스트가 적용되는 경우">
    - 나열된 모든 에이전트가 메시지를 처리합니다.
    - 각 에이전트에는 자체 세션 키와 격리된 컨텍스트가 있습니다.
    - 에이전트는 병렬(기본값) 또는 순차적으로 처리합니다.
    - 오디오 첨부 파일은 팬아웃 전에 한 번만 텍스트로 변환되므로, 에이전트가 별도의 STT 호출을 수행하는 대신 하나의 트랜스크립트를 공유합니다.

  </Step>
  <Step title="브로드캐스트가 적용되지 않는 경우">
    OpenClaw는 일반 라우트 또는 라우팅 중 선택된 구성된 ACP 세션 라우트로 디스패치합니다.
  </Step>
</Steps>

<Note>
브로드캐스트 그룹은 채널 허용 목록이나 그룹 활성화 규칙(멘션/명령 등)을 우회하지 않습니다. 메시지를 처리할 수 있는 경우에 _어떤 에이전트가 실행되는지_만 변경합니다.
</Note>

### 세션 격리

브로드캐스트 그룹의 각 에이전트는 다음 항목을 완전히 별도로 유지합니다.

- **세션 키**(`agent:alfred:whatsapp:group:120363...` 및 `agent:baerbel:whatsapp:group:120363...`)
- **대화 기록**(에이전트는 다른 에이전트의 응답을 볼 수 없음)
- **워크스페이스**(구성된 경우 별도의 샌드박스)
- **도구 액세스**(서로 다른 허용/거부 목록)
- **메모리/컨텍스트**(별도의 `IDENTITY.md`, `SOUL.md` 등)

의도적으로 공유되는 한 가지 예외는 **그룹 컨텍스트 버퍼**(컨텍스트에 사용되는 최근 그룹 메시지)입니다. 이 버퍼는 피어별로 공유되므로 트리거 시 모든 브로드캐스트 에이전트가 동일한 컨텍스트를 확인합니다. 팬아웃이 완료된 후 한 번 초기화됩니다.

이를 통해 각 에이전트에 서로 다른 성격, 모델, Skills, 도구 액세스(예: 읽기 전용 및 읽기/쓰기)를 지정할 수 있습니다.

### 예시: 격리된 세션

에이전트가 `["alfred", "baerbel"]`인 그룹 `120363403215116621@g.us`의 경우:

<Tabs>
  <Tab title="Alfred의 컨텍스트">
    ```text
    세션: agent:alfred:whatsapp:group:120363403215116621@g.us
    기록: [사용자 메시지, alfred의 이전 응답]
    워크스페이스: ~/openclaw-alfred/
    도구: 읽기, 쓰기, 실행
    ```
  </Tab>
  <Tab title="Baerbel의 컨텍스트">
    ```text
    세션: agent:baerbel:whatsapp:group:120363403215116621@g.us
    기록: [사용자 메시지, baerbel의 이전 응답]
    워크스페이스: ~/openclaw-baerbel/
    도구: 읽기 전용
    ```
  </Tab>
</Tabs>

## 사용 사례

- **전문 에이전트 팀**: `code-reviewer`, `security-auditor`, `test-generator`, `docs-checker`가 각각 동일한 메시지에 각자의 관점으로 응답하는 개발 그룹입니다.
- **다국어 지원**: 하나의 지원 채팅에서 `support-en`, `support-de`, `support-es`가 각각 해당 언어로 응답합니다.
- **품질 보증**: `support-agent`가 응답하는 동안 `qa-agent`가 검토하고 문제를 발견한 경우에만 응답합니다.
- **작업 자동화**: `task-tracker`, `time-logger`, `report-generator`가 모두 동일한 상태 업데이트를 처리합니다.

## 모범 사례

<AccordionGroup>
  <Accordion title="1. 에이전트의 역할을 명확하게 유지">
    하나의 일반적인 "dev-helper" 에이전트 대신 각 에이전트에 하나의 명확한 책임(`formatter`, `linter`, `tester`)을 부여합니다.
  </Accordion>
  <Accordion title="2. 설명적인 ID와 이름 사용">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. 서로 다른 도구 액세스 구성">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer`는 읽기 전용입니다. `fixer`는 읽고 쓸 수 있습니다.

  </Accordion>
  <Accordion title="4. 성능 모니터링">
    에이전트가 많은 경우 `"strategy": "parallel"`(기본값)을 사용하고, 브로드캐스트 그룹의 에이전트 수를 소수로 유지하며, 단순한 에이전트에는 더 빠른 모델을 사용합니다.
  </Accordion>
  <Accordion title="5. 오류 격리 유지">
    에이전트는 서로 독립적으로 실패합니다. 한 에이전트의 오류는 기록되며(`Broadcast agent <id> failed: ...`), 다른 에이전트를 차단하지 않습니다.
  </Accordion>
</AccordionGroup>

## 호환성

### 제공자

브로드캐스트 그룹은 현재 WhatsApp(웹 채널)에만 구현되어 있습니다. 다른 채널은 `broadcast` 구성을 무시합니다.

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
- `GROUP_B`: agent1과 agent2가 모두 응답합니다(브로드캐스트).

<Note>
**우선순위:** `broadcast`는 일반 라우트 바인딩보다 우선합니다. 구성된 ACP 바인딩(`bindings[].type="acp"`)은 배타적입니다. 일치하는 바인딩이 있으면 OpenClaw는 팬아웃 브로드캐스트 대신 구성된 ACP 세션으로 디스패치합니다.
</Note>

## 문제 해결

<AccordionGroup>
  <Accordion title="에이전트가 응답하지 않음">
    **확인 사항:**

    1. 에이전트 ID가 `agents.list`에 있어야 합니다(구성 검증 시 알 수 없는 ID가 거부됨).
    2. 피어 ID 형식이 올바른지 확인합니다(그룹의 경우 `120363403215116621@g.us`와 같은 JID, DM의 경우 `+15551234567`과 같은 E.164).
    3. 메시지가 일반 게이팅을 통과했는지 확인합니다(멘션/활성화 규칙은 계속 적용됨).

    **디버깅:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    팬아웃에 성공하면 `Broadcasting message to <n> agents (<strategy>)`가 로그에 기록됩니다.

  </Accordion>
  <Accordion title="하나의 에이전트만 응답함">
    **원인:** 피어 ID가 일반 라우트 바인딩에는 있지만 `broadcast`에는 없거나, 배타적으로 구성된 ACP 바인딩과 일치할 수 있습니다.

    **해결 방법:** 일반 라우트에 바인딩된 피어를 브로드캐스트 구성에 추가하거나, 팬아웃 브로드캐스트를 사용하려면 구성된 ACP 바인딩을 제거하거나 변경합니다.

  </Accordion>
  <Accordion title="성능 문제">
    에이전트가 많아 속도가 느린 경우 그룹당 에이전트 수를 줄이고, 더 가벼운 모델을 사용하며, 샌드박스 시작 시간을 확인합니다.
  </Accordion>
</AccordionGroup>

## 예시

<AccordionGroup>
  <Accordion title="예시 1: 코드 검토 팀">
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

    그룹에 하나의 코드 스니펫을 게시하면 형식 수정, 보안 발견 사항, 커버리지 누락, 문서의 사소한 문제에 대한 네 가지 응답이 생성됩니다.

  </Accordion>
  <Accordion title="예시 2: 다국어 파이프라인">
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
  에이전트 처리 방식입니다. `parallel`은 모든 에이전트를 동시에 실행하고, `sequential`은 배열 순서대로 실행합니다.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 그룹 JID 또는 E.164 전화번호입니다. 값은 해당 피어의 메시지를 모두 처리해야 하는 에이전트 ID 배열입니다.
</ParamField>

## 제한 사항

1. **최대 에이전트 수:** 엄격한 제한은 없지만 에이전트가 많으면(10개 이상) 속도가 느려질 수 있습니다.
2. **공유 컨텍스트:** 에이전트는 의도적으로 서로의 응답을 볼 수 없습니다.
3. **메시지 순서:** 병렬 응답은 어떤 순서로든 도착할 수 있습니다.
4. **속도 제한:** 모든 응답은 하나의 WhatsApp 계정에서 전송되므로 모든 에이전트의 응답에 동일한 WhatsApp 속도 제한이 적용됩니다.

## 관련 항목

- [채널 라우팅](/ko/channels/channel-routing)
- [그룹](/ko/channels/groups)
- [멀티 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
- [페어링](/ko/channels/pairing)
- [세션 관리](/ko/concepts/session)
