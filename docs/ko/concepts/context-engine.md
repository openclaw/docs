---
read_when:
    - OpenClaw가 모델 컨텍스트를 구성하는 방식을 이해하려는 경우
    - 레거시 엔진과 Plugin 엔진 간에 전환하고 있습니다
    - 컨텍스트 엔진 Plugin을 빌드하고 있습니다
sidebarTitle: Context engine
summary: '컨텍스트 엔진: 플러그형 컨텍스트 조립, 압축, 하위 에이전트 수명 주기'
title: 컨텍스트 엔진
x-i18n:
    generated_at: "2026-06-30T13:54:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

**컨텍스트 엔진**은 OpenClaw가 각 실행의 모델 컨텍스트를 빌드하는 방식을 제어합니다. 포함할 메시지, 오래된 기록을 요약하는 방식, 하위 에이전트 경계 전반에서 컨텍스트를 관리하는 방식이 여기에 해당합니다.

OpenClaw는 기본 제공 `legacy` 엔진을 함께 제공하며 기본적으로 이를 사용합니다. 대부분의 사용자는 이를 변경할 필요가 없습니다. 다른 조립, compaction 또는 세션 간 회상 동작이 필요할 때만 Plugin 엔진을 설치하고 선택하세요.

## 빠른 시작

<Steps>
  <Step title="활성 엔진 확인">
    ```bash
    openclaw doctor
    # 또는 구성을 직접 검사:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Plugin 엔진 설치">
    컨텍스트 엔진 Plugin은 다른 OpenClaw Plugin과 동일한 방식으로 설치합니다.

    <Tabs>
      <Tab title="npm에서">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="로컬 경로에서">
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
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    설치 및 구성 후 Gateway를 다시 시작하세요.

  </Step>
  <Step title="legacy로 되돌리기(선택 사항)">
    `contextEngine`을 `"legacy"`로 설정하세요(또는 키를 완전히 제거하세요. `"legacy"`가 기본값입니다).
  </Step>
</Steps>

## 작동 방식

OpenClaw가 모델 프롬프트를 실행할 때마다 컨텍스트 엔진은 네 가지 수명 주기 지점에 참여합니다.

<AccordionGroup>
  <Accordion title="1. 수집">
    새 메시지가 세션에 추가될 때 호출됩니다. 엔진은 자체 데이터 저장소에 메시지를 저장하거나 인덱싱할 수 있습니다.
  </Accordion>
  <Accordion title="2. 조립">
    각 모델 실행 전에 호출됩니다. 엔진은 토큰 예산 내에 맞는 정렬된 메시지 집합(및 선택적 `systemPromptAddition`)을 반환합니다.
  </Accordion>
  <Accordion title="3. 압축">
    컨텍스트 창이 가득 찼거나 사용자가 `/compact`를 실행할 때 호출됩니다. 엔진은 공간을 확보하기 위해 오래된 기록을 요약합니다.
  </Accordion>
  <Accordion title="4. 턴 이후">
    실행이 완료된 후 호출됩니다. 엔진은 상태를 유지하거나, 백그라운드 compaction을 트리거하거나, 인덱스를 업데이트할 수 있습니다.
  </Accordion>
</AccordionGroup>

번들로 제공되는 비-ACP Codex 하니스의 경우, OpenClaw는 조립된 컨텍스트를 Codex 개발자 지침과 현재 턴 프롬프트로 투영하여 동일한 수명 주기를 적용합니다. Codex는 여전히 자체 네이티브 스레드 기록과 네이티브 compactor를 소유합니다.

### 하위 에이전트 수명 주기(선택 사항)

OpenClaw는 두 가지 선택적 하위 에이전트 수명 주기 훅을 호출합니다.

<ParamField path="prepareSubagentSpawn" type="method">
  하위 실행이 시작되기 전에 공유 컨텍스트 상태를 준비합니다. 훅은 부모/자식 세션 키, `contextMode`(`isolated` 또는 `fork`), 사용 가능한 트랜스크립트 ID/파일, 선택적 TTL을 받습니다. 롤백 핸들을 반환하면, 준비 성공 후 스폰이 실패할 때 OpenClaw가 이를 호출합니다. `lightContext`를 요청하고 `contextMode="isolated"`로 확인되는 네이티브 하위 에이전트 스폰은 의도적으로 이 훅을 건너뛰어, 자식이 컨텍스트 엔진 관리 사전 스폰 상태 없이 경량 부트스트랩 컨텍스트에서 시작하도록 합니다.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  하위 에이전트 세션이 완료되거나 정리될 때 정리합니다.
</ParamField>

### 시스템 프롬프트 추가

`assemble` 메서드는 `systemPromptAddition` 문자열을 반환할 수 있습니다. OpenClaw는 이를 실행의 시스템 프롬프트 앞에 붙입니다. 이를 통해 엔진은 정적 작업 공간 파일 없이 동적 회상 가이드, 검색 지침 또는 컨텍스트 인식 힌트를 주입할 수 있습니다.

## legacy 엔진

기본 제공 `legacy` 엔진은 OpenClaw의 원래 동작을 보존합니다.

- **수집**: no-op(세션 관리자가 메시지 지속성을 직접 처리합니다).
- **조립**: pass-through(런타임의 기존 sanitize → validate → limit 파이프라인이 컨텍스트 조립을 처리합니다).
- **압축**: 기본 제공 요약 compaction에 위임하며, 이는 오래된 메시지의 단일 요약을 만들고 최근 메시지는 그대로 유지합니다.
- **턴 이후**: no-op.

legacy 엔진은 도구를 등록하거나 `systemPromptAddition`을 제공하지 않습니다.

`plugins.slots.contextEngine`이 설정되지 않았거나 `"legacy"`로 설정된 경우, 이 엔진이 자동으로 사용됩니다.

## Plugin 엔진

Plugin은 Plugin API를 사용하여 컨텍스트 엔진을 등록할 수 있습니다.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

팩터리 `ctx`에는 선택적 `config`, `agentDir`, `workspaceDir` 값이 포함되어 있어 Plugin이 첫 번째 수명 주기 훅이 실행되기 전에 에이전트별 또는 작업 공간별 상태를 초기화할 수 있습니다.

그런 다음 구성에서 활성화하세요.

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

| 멤버               | 종류     | 목적                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | 속성     | 엔진 ID, 이름, 버전, compaction 소유 여부                |
| `ingest(params)`   | 메서드   | 단일 메시지 저장                                        |
| `assemble(params)` | 메서드   | 모델 실행을 위한 컨텍스트 빌드(`AssembleResult` 반환)   |
| `compact(params)`  | 메서드   | 컨텍스트 요약/축소                                      |

`assemble`은 다음이 포함된 `AssembleResult`를 반환합니다.

<ParamField path="messages" type="Message[]" required>
  모델에 보낼 정렬된 메시지입니다.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  조립된 컨텍스트의 총 토큰에 대한 엔진의 추정치입니다. OpenClaw는 compaction 임계값 결정과 진단 보고에 이를 사용합니다.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  시스템 프롬프트 앞에 붙습니다.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  러너가 선제적 오버플로 사전 확인에 사용할 토큰 추정치를 제어합니다. 기본값은 `"assembled"`이며, 이는 compaction을 소유하지 않는 엔진의 경우 조립된 프롬프트의 추정치만 확인한다는 뜻입니다. `ownsCompaction: true`를 설정한 엔진은 자체 프롬프트 허용을 관리하므로, OpenClaw는 기본적으로 일반적인 프롬프트 전 사전 확인을 건너뜁니다. 조립된 뷰가 기본 트랜스크립트의 오버플로 위험을 숨길 수 있는 경우에만 `"preassembly_may_overflow"`를 설정하세요. 그러면 러너는 일반 사전 확인을 활성 상태로 유지하고, 선제적 compaction 여부를 결정할 때 조립된 추정치와 사전 조립(윈도우 적용 전) 세션 기록 추정치 중 최댓값을 사용합니다. 어느 쪽이든 반환한 메시지는 여전히 모델이 보게 되는 내용입니다. `promptAuthority`는 사전 확인에만 영향을 줍니다.
</ParamField>

`compact`는 `CompactResult`를 반환합니다. compaction이 활성 트랜스크립트를 회전하면, `result.sessionId`와 `result.sessionFile`은 다음 재시도 또는 턴이 사용해야 하는 후속 세션을 식별합니다.

선택적 멤버:

| 멤버                           | 종류   | 목적                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 메서드 | 세션에 대한 엔진 상태를 초기화합니다. 엔진이 세션을 처음 볼 때 한 번 호출됩니다(예: 기록 가져오기).             |
| `ingestBatch(params)`          | 메서드 | 완료된 턴을 배치로 수집합니다. 실행 완료 후 해당 턴의 모든 메시지와 함께 한 번에 호출됩니다.                   |
| `afterTurn(params)`            | 메서드 | 실행 후 수명 주기 작업(상태 유지, 백그라운드 compaction 트리거).                                                |
| `prepareSubagentSpawn(params)` | 메서드 | 자식 세션이 시작되기 전에 공유 상태를 설정합니다.                                                              |
| `onSubagentEnded(params)`      | 메서드 | 하위 에이전트가 종료된 후 정리합니다.                                                                          |
| `dispose()`                    | 메서드 | 리소스를 해제합니다. Gateway 종료 또는 Plugin 리로드 중 호출되며, 세션별로 호출되지는 않습니다.                |

### 런타임 설정

OpenClaw 내부에서 실행되는 수명 주기 훅은 선택적 `runtimeSettings` 객체를 받습니다. 이는 버전이 지정된 읽기 전용 내부 생산자/소비자 API 표면입니다. OpenClaw가 선택된 컨텍스트 엔진을 위해 이를 생성하고, 컨텍스트 엔진은 수명 주기 훅 내부에서 이를 소비합니다. 사용자에게 직접 렌더링되지 않으며 전용 보고 표면을 만들지 않습니다.

- `schemaVersion`: 현재 `1`
- `runtime`: OpenClaw 호스트, 런타임 모드(`normal`, `fallback` 또는 `degraded`), 선택적 하니스/런타임 ID
- `contextEngineSelection`: 선택된 컨텍스트 엔진 ID 및 선택 소스
- `executionHost`: 훅을 호출하는 표면의 호스트 ID 및 레이블
- `model`: 요청된 모델, 확인된 모델, 공급자, 선택적 모델 패밀리
- `limits`: 알려진 경우 프롬프트 토큰 예산 및 최대 출력 토큰
- `diagnostics`: 알려진 경우 닫힌 fallback 및 degraded 사유 코드

알 수 없는 필드는 `null`로 표현됩니다. 런타임 모드와 선택 소스 같은 판별자 필드는 null을 허용하지 않습니다. 이전 엔진은 계속 호환됩니다. 엄격한 legacy 엔진이 알 수 없는 속성이라는 이유로 `runtimeSettings`를 거부하면, OpenClaw는 엔진을 격리하는 대신 이를 제외하고 수명 주기 호출을 다시 시도합니다.

### 호스트 요구 사항

컨텍스트 엔진은 `info.hostRequirements`에 호스트 기능 요구 사항을 선언할 수 있습니다. OpenClaw는 작업을 시작하기 전에 이러한 요구 사항을 확인하고, 선택된 런타임이 이를 충족할 수 없으면 설명이 포함된 오류와 함께 닫힌 방식으로 실패합니다.

에이전트 실행의 경우, 엔진이 `assemble()`을 통해 실제 모델 프롬프트를 제어해야 한다면 `assemble-before-prompt`를 선언하세요.

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

네이티브 Codex 및 OpenClaw 임베디드 에이전트 실행은 `assemble-before-prompt`를 충족합니다. 일반 CLI 백엔드는 충족하지 않으므로, 이를 요구하는 엔진은 CLI 프로세스가 시작되기 전에 거부됩니다.

### 실패 격리

OpenClaw는 선택된 Plugin 엔진을 핵심 응답 경로에서 격리합니다. 레거시가 아닌 엔진이
누락되었거나, 계약 검증에 실패했거나, 팩토리 생성 중 예외를 던지거나,
수명 주기 메서드에서 예외를 던지면, OpenClaw는 현재 Gateway 프로세스에서
해당 엔진을 격리하고 컨텍스트 엔진 작업을 내장 `legacy` 엔진으로
다운그레이드합니다. 오류는 실패한 작업과 함께 기록되므로 운영자는 에이전트가
응답을 멈추지 않게 하면서 Plugin을 복구, 업데이트 또는 비활성화할 수 있습니다.

호스트 요구 사항 실패는 다릅니다. 엔진이 런타임에 필요한 기능이 없다고 선언하면
OpenClaw는 실행을 시작하기 전에 폐쇄형으로 실패합니다. 이렇게 하면 지원되지 않는
호스트에서 실행될 경우 상태를 손상시킬 수 있는 엔진을 보호할 수 있습니다.

### ownsCompaction

`ownsCompaction`은 실행 중 OpenClaw 런타임의 내장 시도 내 자동 Compaction을 계속 활성화할지 여부를 제어합니다.

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    엔진이 Compaction 동작을 소유합니다. OpenClaw는 해당 실행에서 OpenClaw 런타임의 내장 자동 Compaction과 일반 사전 프롬프트 오버플로 사전 검사를 비활성화하며, 엔진의 `compact()` 구현은 `/compact`, 제공자 오버플로 복구 Compaction, 그리고 `afterTurn()`에서 수행하려는 모든 선제적 Compaction을 책임집니다. OpenClaw는 엔진이 `assemble()`에서 `promptAuthority: "preassembly_may_overflow"`를 반환할 때 여전히 사전 프롬프트 오버플로 보호 장치를 실행합니다.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw 런타임의 내장 자동 Compaction은 프롬프트 실행 중 계속 실행될 수 있지만, `/compact`와 오버플로 복구에는 여전히 활성 엔진의 `compact()` 메서드가 호출됩니다.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`는 OpenClaw가 레거시 엔진의 Compaction 경로로 자동 대체한다는 의미가 **아닙니다**.
</Warning>

즉, 유효한 Plugin 패턴은 두 가지입니다.

<Tabs>
  <Tab title="Owning mode">
    자체 Compaction 알고리즘을 구현하고 `ownsCompaction: true`를 설정합니다.
  </Tab>
  <Tab title="Delegating mode">
    `ownsCompaction: false`를 설정하고 `compact()`가 `openclaw/plugin-sdk/core`의 `delegateCompactionToRuntime(...)`를 호출하게 하여 OpenClaw의 내장 Compaction 동작을 사용합니다.
  </Tab>
</Tabs>

무작업 `compact()`는 활성 상태의 비소유 엔진에 안전하지 않습니다. 해당 엔진 슬롯의 일반 `/compact` 및 오버플로 복구 Compaction 경로를 비활성화하기 때문입니다.

## 구성 참조

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
슬롯은 실행 시점에 배타적입니다. 지정된 실행 또는 Compaction 작업에는 등록된 컨텍스트 엔진 하나만 해석됩니다. 활성화된 다른 `kind: "context-engine"` Plugin은 여전히 로드되어 등록 코드를 실행할 수 있습니다. `plugins.slots.contextEngine`은 컨텍스트 엔진이 필요할 때 OpenClaw가 해석할 등록된 엔진 ID만 선택합니다.
</Note>

<Note>
**Plugin 제거:** 현재 `plugins.slots.contextEngine`으로 선택된 Plugin을 제거하면 OpenClaw는 슬롯을 기본값(`legacy`)으로 되돌립니다. 같은 초기화 동작이 `plugins.slots.memory`에도 적용됩니다. 수동 구성 편집은 필요하지 않습니다.
</Note>

## Compaction 및 메모리와의 관계

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction은 컨텍스트 엔진의 책임 중 하나입니다. 레거시 엔진은 OpenClaw의 내장 요약 기능에 위임합니다. Plugin 엔진은 어떤 Compaction 전략이든 구현할 수 있습니다(DAG 요약, 벡터 검색 등).
  </Accordion>
  <Accordion title="Memory plugins">
    메모리 Plugin(`plugins.slots.memory`)은 컨텍스트 엔진과 별개입니다. 메모리 Plugin은 검색/조회 기능을 제공하고, 컨텍스트 엔진은 모델이 보는 내용을 제어합니다. 둘은 함께 작동할 수 있습니다. 예를 들어 컨텍스트 엔진은 조립 중 메모리 Plugin 데이터를 사용할 수 있습니다. 활성 메모리 프롬프트 경로를 사용하려는 Plugin 엔진은 `openclaw/plugin-sdk/core`의 `buildMemorySystemPromptAddition(...)`를 우선 사용하는 것이 좋습니다. 이 함수는 활성 메모리 프롬프트 섹션을 바로 앞에 붙일 수 있는 `systemPromptAddition`으로 변환합니다. 엔진에 더 낮은 수준의 제어가 필요하다면 `openclaw/plugin-sdk/memory-host-core`에서 `buildActiveMemoryPromptSection(...)`을 통해 원시 줄을 가져올 수도 있습니다.
  </Accordion>
  <Accordion title="Session pruning">
    어떤 컨텍스트 엔진이 활성 상태인지와 관계없이, 메모리 내 오래된 도구 결과 정리는 계속 실행됩니다.
  </Accordion>
</AccordionGroup>

## 팁

- 엔진이 올바르게 로드되는지 확인하려면 `openclaw doctor`를 사용합니다.
- 엔진을 전환해도 기존 세션은 현재 기록으로 계속 진행됩니다. 새 엔진은 이후 실행부터 담당합니다.
- 엔진 오류는 기록되고, 선택된 Plugin 엔진은 현재 Gateway 프로세스에서 격리됩니다. OpenClaw는 사용자 턴에서 `legacy`로 대체하여 응답이 계속되게 하지만, 손상된 Plugin은 여전히 복구, 업데이트, 비활성화 또는 제거해야 합니다.
- 개발 중에는 `openclaw plugins install -l ./my-engine`를 사용하여 복사 없이 로컬 Plugin 디렉터리를 연결합니다.

## 관련 항목

- [Compaction](/ko/concepts/compaction) - 긴 대화 요약
- [컨텍스트](/ko/concepts/context) - 에이전트 턴을 위한 컨텍스트가 구성되는 방식
- [Plugin 아키텍처](/ko/plugins/architecture) - 컨텍스트 엔진 Plugin 등록
- [Plugin 매니페스트](/ko/plugins/manifest) - Plugin 매니페스트 필드
- [Plugin](/ko/tools/plugin) - Plugin 개요
