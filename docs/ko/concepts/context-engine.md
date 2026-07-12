---
read_when:
    - OpenClaw가 모델 컨텍스트를 구성하는 방식을 이해하려고 합니다
    - 레거시 엔진과 Plugin 엔진 간에 전환하고 있습니다
    - 컨텍스트 엔진 Plugin을 구축하고 있습니다
sidebarTitle: Context engine
summary: '컨텍스트 엔진: 플러그형 컨텍스트 구성, Compaction 및 하위 에이전트 수명 주기'
title: 컨텍스트 엔진
x-i18n:
    generated_at: "2026-07-12T15:09:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

**컨텍스트 엔진**은 OpenClaw가 각 실행의 모델 컨텍스트를 구성하는 방식을 제어합니다. 여기에는 포함할 메시지, 이전 기록을 요약하는 방법, 하위 에이전트 경계 간에 컨텍스트를 관리하는 방법이 포함됩니다.

OpenClaw에는 기본 제공 `legacy` 엔진이 포함되어 있으며 기본적으로 이 엔진을 사용합니다. 다른 구성, Compaction 또는 세션 간 회상 동작이 필요한 경우에만 Plugin 엔진을 설치하고 선택하십시오.

## 빠른 시작

<Steps>
  <Step title="활성 엔진 확인">
    ```bash
    openclaw doctor
    # 또는 구성을 직접 확인합니다:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Plugin 엔진 설치">
    컨텍스트 엔진 Plugin은 다른 OpenClaw Plugin과 같은 방식으로 설치합니다.

    <Tabs>
      <Tab title="npm에서 설치">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="로컬 경로에서 설치">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="엔진 활성화 및 선택">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // Plugin에 등록된 엔진 ID와 일치해야 합니다
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin별 구성은 여기에 입력합니다(Plugin 문서 참조)
          },
        },
      },
    }
    ```

    설치하고 구성한 후 Gateway를 다시 시작하십시오.

  </Step>
  <Step title="legacy로 다시 전환(선택 사항)">
    `contextEngine`을 `"legacy"`로 설정하거나 키를 완전히 제거하십시오. `"legacy"`가 기본값입니다.
  </Step>
</Steps>

## 작동 방식

OpenClaw가 모델 프롬프트를 실행할 때마다 컨텍스트 엔진은 다음 네 가지 수명 주기 지점에 관여합니다.

<AccordionGroup>
  <Accordion title="1. 수집">
    세션에 새 메시지가 추가될 때 호출됩니다. 엔진은 메시지를 자체 데이터 저장소에 저장하거나 인덱싱할 수 있습니다.
  </Accordion>
  <Accordion title="2. 구성">
    각 모델 실행 전에 호출됩니다. 엔진은 토큰 예산에 맞는 순서가 지정된 메시지 집합과 선택적 `systemPromptAddition`을 반환합니다.
  </Accordion>
  <Accordion title="3. Compaction">
    컨텍스트 창이 가득 차거나 사용자가 `/compact`를 실행할 때 호출됩니다. 엔진은 공간을 확보하기 위해 이전 기록을 요약합니다.
  </Accordion>
  <Accordion title="4. 턴 이후">
    실행이 완료된 후 호출됩니다. 엔진은 상태를 영구 저장하거나, 백그라운드 Compaction을 트리거하거나, 인덱스를 업데이트할 수 있습니다.
  </Accordion>
</AccordionGroup>

엔진은 부트스트랩, 성공적인 턴 또는 Compaction 이후 트랜스크립트 유지 관리(`runtimeContext.rewriteTranscriptEntries()`를 통한 안전한 재작성)를 위해 선택적 `maintain()` 메서드도 구현할 수 있습니다. 응답을 차단하지 않고 지연된 작업으로 실행하려면 `info.turnMaintenanceMode: "background"`를 설정하십시오.

번들로 제공되는 비 ACP Codex 하네스의 경우 OpenClaw는 구성된 컨텍스트를 Codex 개발자 지침과 현재 턴 프롬프트에 투영하여 동일한 수명 주기를 적용합니다. Codex는 계속해서 자체 네이티브 스레드 기록과 네이티브 컴팩터를 관리합니다.

### 하위 에이전트 수명 주기(선택 사항)

OpenClaw는 다음 두 가지 선택적 하위 에이전트 수명 주기 훅을 호출합니다.

<ParamField path="prepareSubagentSpawn" type="method">
  자식 실행이 시작되기 전에 공유 컨텍스트 상태를 준비합니다. 훅은 부모/자식 세션 키, `contextMode`(`isolated` 또는 `fork`), 사용 가능한 트랜스크립트 ID/파일 및 선택적 TTL을 받습니다. 롤백 핸들을 반환하면 준비가 성공한 후 생성이 실패할 때 OpenClaw가 이를 호출합니다. `lightContext`를 요청하고 `contextMode="isolated"`로 확인되는 네이티브 하위 에이전트 생성은 이 훅을 의도적으로 건너뛰므로, 자식은 컨텍스트 엔진이 관리하는 생성 전 상태 없이 경량 부트스트랩 컨텍스트에서 시작합니다.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  하위 에이전트 세션이 완료되거나 정리될 때 정리합니다.
</ParamField>

### 시스템 프롬프트 추가 내용

`assemble` 메서드는 `systemPromptAddition` 문자열을 반환할 수 있습니다. OpenClaw는 이를 해당 실행의 시스템 프롬프트 앞에 추가합니다. 이를 통해 엔진은 정적 작업 공간 파일 없이도 동적 회상 지침, 검색 지침 또는 컨텍스트 인식 힌트를 삽입할 수 있습니다.

## legacy 엔진

기본 제공 `legacy` 엔진은 OpenClaw의 기존 동작을 유지합니다.

- **수집**: 아무 작업도 하지 않습니다(세션 관리자가 메시지 영구 저장을 직접 처리합니다).
- **구성**: 그대로 전달합니다(런타임의 기존 정리 → 검증 → 제한 파이프라인이 컨텍스트 구성을 처리합니다).
- **Compaction**: 기본 제공 요약 Compaction에 위임합니다. 이 기능은 이전 메시지를 하나의 요약으로 만들고 최근 메시지는 그대로 유지합니다.
- **턴 이후**: 아무 작업도 하지 않습니다.

legacy 엔진은 도구를 등록하거나 `systemPromptAddition`을 제공하지 않습니다.

`plugins.slots.contextEngine`이 설정되지 않았거나 `"legacy"`로 설정된 경우 이 엔진이 자동으로 사용됩니다.

## Plugin 엔진

Plugin은 Plugin API를 사용하여 컨텍스트 엔진을 등록할 수 있습니다.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // 메시지를 데이터 저장소에 저장합니다
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // 예산에 맞는 메시지를 반환합니다
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // 이전 컨텍스트를 요약합니다
      return { ok: true, compacted: true };
    },
  }));
}
```

팩토리 `ctx`에는 선택적 `config`, `agentDir`, `workspaceDir` 값이 포함되므로 Plugin은 첫 번째 수명 주기 훅이 실행되기 전에 에이전트별 또는 작업 공간별 상태를 초기화할 수 있습니다.

그런 다음 구성에서 활성화하십시오.

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine 인터페이스

필수 멤버:

| 멤버               | 종류     | 용도                                                   |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | 속성     | 엔진 ID, 이름, 버전 및 Compaction 소유 여부            |
| `ingest(params)`   | 메서드   | 단일 메시지 저장                                        |
| `assemble(params)` | 메서드   | 모델 실행을 위한 컨텍스트 구성(`AssembleResult` 반환)   |
| `compact(params)`  | 메서드   | 컨텍스트 요약/축소                                      |

`assemble`은 다음 항목을 포함하는 `AssembleResult`를 반환합니다.

<ParamField path="messages" type="Message[]" required>
  모델에 전송할 순서가 지정된 메시지입니다.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  구성된 컨텍스트의 총 토큰 수에 대한 엔진의 추정값입니다. OpenClaw는 이를 Compaction 임계값 결정과 진단 보고에 사용합니다.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  시스템 프롬프트 앞에 추가됩니다.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  선제적 오버플로 사전 검사에 러너가 사용할 토큰 추정값을 제어합니다. 기본값은 `"assembled"`이며, 이는 Compaction을 소유하지 않는 엔진의 경우 구성된 프롬프트의 추정값만 검사한다는 의미입니다. `ownsCompaction: true`를 설정한 엔진은 자체 프롬프트 수용 여부를 관리하므로 OpenClaw는 기본적으로 일반적인 프롬프트 전 사전 검사를 건너뜁니다. 구성된 뷰가 기본 트랜스크립트의 오버플로 위험을 숨길 수 있는 경우에만 `"preassembly_may_overflow"`를 설정하십시오. 그러면 러너는 일반 사전 검사를 계속 활성화하고 선제적으로 Compaction할지 결정할 때 구성된 추정값과 구성 전(창이 적용되지 않은) 세션 기록 추정값 중 최댓값을 사용합니다. 어느 경우든 반환한 메시지가 모델에 표시됩니다. `promptAuthority`는 사전 검사에만 영향을 줍니다.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  영구 백엔드 스레드가 있는 호스트(예: Codex 앱 서버)를 위한 선택적 투영 수명 주기입니다. 안정적인 `epoch`와 함께 `mode: "thread_bootstrap"`을 사용하면 호스트가 구성된 컨텍스트를 epoch마다 한 번 삽입하고, 매 턴마다 다시 투영하는 대신 epoch가 변경될 때까지 백엔드 스레드를 재사용하도록 요청합니다. 일반적인 턴별 투영에는 이 필드를 생략하십시오.
</ParamField>

`compact`는 `CompactResult`를 반환합니다. Compaction이 활성 세션 ID를 변경하는 경우 `result.sessionTarget`(세션 ID와 저장소 범위를 전달하는 형식 지정된 `ContextEngineSessionTarget`)은 다음 재시도 또는 턴에서 사용해야 하는 후속 세션을 식별하며, `result.sessionId`는 후속 세션 ID를 반영합니다.

선택적 멤버:

| 멤버                           | 종류     | 용도                                                                                                                                               |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 메서드   | 세션의 엔진 상태를 초기화합니다. 엔진이 세션을 처음 확인할 때 한 번 호출됩니다(예: 기록 가져오기).                                                 |
| `maintain(params)`             | 메서드   | 부트스트랩, 성공적인 턴 또는 Compaction 이후의 트랜스크립트 유지 관리입니다. 안전한 재작성에는 `runtimeContext.rewriteTranscriptEntries()`를 사용합니다. |
| `ingestBatch(params)`          | 메서드   | 완료된 턴을 일괄 수집합니다. 실행이 완료된 후 해당 턴의 모든 메시지와 함께 한 번에 호출됩니다.                                                     |
| `afterTurn(params)`            | 메서드   | 실행 후 수명 주기 작업입니다(상태 영구 저장, 백그라운드 Compaction 트리거).                                                                        |
| `prepareSubagentSpawn(params)` | 메서드   | 자식 세션이 시작되기 전에 공유 상태를 설정합니다.                                                                                                  |
| `onSubagentEnded(params)`      | 메서드   | 하위 에이전트가 종료된 후 정리합니다.                                                                                                              |
| `dispose()`                    | 메서드   | 리소스를 해제합니다. Gateway 종료 또는 Plugin 다시 로드 중에 호출되며 세션별로 호출되지 않습니다.                                                  |

### 런타임 설정

OpenClaw 내부에서 실행되는 수명 주기 훅은 선택적 `runtimeSettings` 객체를 받습니다. 이는 버전이 지정된 읽기 전용 내부 생산자/소비자 API 표면입니다. OpenClaw가 선택된 컨텍스트 엔진을 위해 이를 생성하고, 컨텍스트 엔진은 수명 주기 훅 내부에서 이를 소비합니다. 사용자에게 직접 렌더링되지 않으며 전용 보고 표면을 만들지 않습니다.

- `schemaVersion`: 현재 `1`
- `runtime`: OpenClaw 호스트, 런타임 모드(`normal`, `fallback` 또는 `degraded`) 및 선택적 하네스/런타임 ID
- `contextEngineSelection`: 선택된 컨텍스트 엔진 ID와 선택 출처
- `executionHost`: 훅을 호출하는 표면의 호스트 ID와 레이블
- `model`: 요청된 모델, 확인된 모델, 제공자 및 선택적 모델 계열
- `limits`: 알려진 경우 프롬프트 토큰 예산과 최대 출력 토큰 수
- `diagnostics`: 알려진 경우 닫힌 폴백 및 성능 저하 이유 코드

알 수 없는 필드는 `null`로 표현되며, 런타임 모드 및 선택 소스와 같은 판별자 필드는 null을 허용하지 않습니다. 이전 엔진도 계속 호환됩니다. 엄격한 레거시 엔진이 `runtimeSettings`를 알 수 없는 속성으로 거부하면 OpenClaw는 엔진을 격리하는 대신 해당 속성을 제외하고 수명 주기 호출을 재시도합니다.

### 호스트 요구 사항

컨텍스트 엔진은 `info.hostRequirements`에 호스트 기능 요구 사항을 선언할 수 있습니다. OpenClaw는 작업을 시작하기 전에 이러한 요구 사항을 확인하고, 선택한 런타임이 이를 충족할 수 없으면 설명이 포함된 오류와 함께 안전하게 실패합니다.

에이전트 실행에서 엔진이 `assemble()`을 통해 실제 모델 프롬프트를 제어해야 하는 경우 `assemble-before-prompt`를 선언하십시오.

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "네이티브 Codex 또는 OpenClaw 임베디드 런타임을 사용하거나 레거시 컨텍스트 엔진을 선택하십시오.",
    },
  },
}
```

네이티브 Codex 및 OpenClaw 임베디드 에이전트 실행은 `assemble-before-prompt`를 충족합니다. 일반 CLI 백엔드는 이를 충족하지 않으므로, 이 기능이 필요한 엔진은 CLI 프로세스가 시작되기 전에 거부됩니다.

### 장애 격리

OpenClaw는 선택한 Plugin 엔진을 핵심 응답 경로에서 격리합니다. 비레거시 엔진이 없거나, 계약 검증에 실패하거나, 팩토리 생성 중 예외를 발생시키거나, 수명 주기 메서드에서 예외를 발생시키면 OpenClaw는 현재 Gateway 프로세스에서 해당 엔진을 격리하고 컨텍스트 엔진 작업을 기본 제공 `legacy` 엔진으로 다운그레이드합니다. 운영자가 에이전트의 응답이 중단되지 않은 상태에서 Plugin을 복구, 업데이트 또는 비활성화할 수 있도록 실패한 작업과 함께 오류가 기록됩니다.

호스트 요구 사항 실패는 다르게 처리됩니다. 엔진이 런타임에 필수 기능이 없다고 선언하면 OpenClaw는 실행을 시작하기 전에 안전하게 실패합니다. 이렇게 하면 지원되지 않는 호스트에서 실행될 경우 상태를 손상시킬 수 있는 엔진을 보호합니다.

### ownsCompaction

`ownsCompaction`은 OpenClaw 런타임에 기본 제공되는 시도 중 자동 Compaction을 해당 실행에서 계속 활성화할지 제어합니다.

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    엔진이 Compaction 동작을 담당합니다. OpenClaw는 해당 실행에서 OpenClaw 런타임의 기본 제공 자동 Compaction과 일반적인 프롬프트 전 오버플로 사전 검사를 비활성화하며, 엔진의 `compact()` 구현은 `/compact`, 제공자 오버플로 복구 Compaction 및 `afterTurn()`에서 수행하려는 모든 선제적 Compaction을 담당합니다. 엔진이 `assemble()`에서 `promptAuthority: "preassembly_may_overflow"`를 반환하는 경우 OpenClaw는 프롬프트 전 오버플로 안전장치를 계속 실행합니다.
  </Accordion>
  <Accordion title="ownsCompaction: false 또는 미설정">
    OpenClaw 런타임의 기본 제공 자동 Compaction은 프롬프트 실행 중에도 계속 실행될 수 있지만, `/compact` 및 오버플로 복구에는 활성 엔진의 `compact()` 메서드가 계속 호출됩니다.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`는 OpenClaw가 레거시 엔진의 Compaction 경로로 자동 대체된다는 의미가 **아닙니다**.
</Warning>

따라서 다음과 같은 두 가지 유효한 Plugin 패턴이 있습니다.

<Tabs>
  <Tab title="소유 모드">
    자체 Compaction 알고리즘을 구현하고 `ownsCompaction: true`를 설정하십시오.
  </Tab>
  <Tab title="위임 모드">
    OpenClaw의 기본 제공 Compaction 동작을 사용하려면 `ownsCompaction: false`를 설정하고 `compact()`가 `openclaw/plugin-sdk/core`의 `delegateCompactionToRuntime(...)`을 호출하도록 하십시오.
  </Tab>
</Tabs>

아무 작업도 수행하지 않는 `compact()`는 활성 비소유 엔진에 안전하지 않습니다. 해당 엔진 슬롯의 일반적인 `/compact` 및 오버플로 복구 Compaction 경로가 비활성화되기 때문입니다.

## 구성 참조

```json5
{
  plugins: {
    slots: {
      // 활성 컨텍스트 엔진을 선택합니다. 기본값: "legacy".
      // Plugin 엔진을 사용하려면 Plugin ID로 설정합니다.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
슬롯은 실행 시 배타적입니다. 지정된 실행 또는 Compaction 작업에는 등록된 컨텍스트 엔진 하나만 확인됩니다. 활성화된 다른 `kind: "context-engine"` Plugin도 계속 로드되어 등록 코드를 실행할 수 있습니다. `plugins.slots.contextEngine`은 OpenClaw에 컨텍스트 엔진이 필요할 때 확인할 등록 엔진 ID만 선택합니다.
</Note>

<Note>
**Plugin 제거:** 현재 `plugins.slots.contextEngine`으로 선택된 Plugin을 제거하면 OpenClaw는 슬롯을 기본값(`legacy`)으로 재설정합니다. `plugins.slots.memory`에도 동일한 재설정 동작이 적용됩니다. 구성을 수동으로 편집할 필요가 없습니다.
</Note>

## Compaction 및 메모리와의 관계

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction은 컨텍스트 엔진의 책임 중 하나입니다. 레거시 엔진은 OpenClaw의 기본 제공 요약 기능에 위임합니다. Plugin 엔진은 모든 Compaction 전략(DAG 요약, 벡터 검색 등)을 구현할 수 있습니다.
  </Accordion>
  <Accordion title="메모리 Plugin">
    메모리 Plugin(`plugins.slots.memory`)은 컨텍스트 엔진과 별개입니다. 메모리 Plugin은 검색/조회 기능을 제공하고, 컨텍스트 엔진은 모델에 표시되는 내용을 제어합니다. 두 기능은 함께 작동할 수 있습니다. 예를 들어 컨텍스트 엔진이 조립 중에 메모리 Plugin 데이터를 사용할 수 있습니다. 활성 메모리 프롬프트 경로를 사용하려는 Plugin 엔진은 `openclaw/plugin-sdk/core`의 `buildMemorySystemPromptAddition(...)`을 우선 사용해야 합니다. 이 함수는 활성 메모리 프롬프트 섹션을 바로 앞에 추가할 수 있는 `systemPromptAddition`으로 변환합니다. 엔진에 더 낮은 수준의 제어가 필요한 경우에도 `buildActiveMemoryPromptSection(...)`을 통해 `openclaw/plugin-sdk/memory-host-core`에서 원시 줄을 가져올 수 있습니다.
  </Accordion>
  <Accordion title="세션 정리">
    메모리에서 오래된 도구 결과를 잘라내는 작업은 어떤 컨텍스트 엔진이 활성 상태인지와 관계없이 계속 실행됩니다.
  </Accordion>
</AccordionGroup>

## 팁

- 엔진이 올바르게 로드되는지 확인하려면 `openclaw doctor`를 사용하십시오.
- 엔진을 전환해도 기존 세션은 현재 기록으로 계속 진행됩니다. 새 엔진은 이후 실행부터 적용됩니다.
- 엔진 오류가 기록되고 선택한 Plugin 엔진은 현재 Gateway 프로세스에서 격리됩니다. 응답이 계속될 수 있도록 OpenClaw는 사용자 턴에 `legacy`를 대체 엔진으로 사용하지만, 손상된 Plugin을 복구, 업데이트, 비활성화 또는 제거해야 합니다.
- 개발 시 로컬 Plugin 디렉터리를 복사하지 않고 연결하려면 `openclaw plugins install -l ./my-engine`을 사용하십시오.

## 관련 항목

- [Compaction](/ko/concepts/compaction) - 긴 대화 요약
- [컨텍스트](/ko/concepts/context) - 에이전트 턴의 컨텍스트가 구성되는 방식
- [Plugin 아키텍처](/ko/plugins/architecture) - 컨텍스트 엔진 Plugin 등록
- [Plugin 매니페스트](/ko/plugins/manifest) - Plugin 매니페스트 필드
- [Plugin](/ko/tools/plugin) - Plugin 개요
