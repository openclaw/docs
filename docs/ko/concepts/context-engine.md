---
read_when:
    - OpenClaw가 모델 컨텍스트를 구성하는 방식을 이해하려고 합니다
    - 레거시 엔진과 Plugin 엔진 간에 전환하고 있습니다
    - 컨텍스트 엔진 Plugin을 구축하고 있습니다
sidebarTitle: Context engine
summary: '컨텍스트 엔진: 플러그형 컨텍스트 조립, Compaction 및 서브에이전트 수명 주기'
title: 컨텍스트 엔진
x-i18n:
    generated_at: "2026-05-02T20:47:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

**컨텍스트 엔진**은 각 실행에서 OpenClaw가 모델 컨텍스트를 구성하는 방식을 제어합니다. 포함할 메시지, 오래된 기록을 요약하는 방법, 하위 에이전트 경계를 넘어 컨텍스트를 관리하는 방법을 결정합니다.

OpenClaw는 내장 `legacy` 엔진을 제공하며 기본값으로 사용합니다. 대부분의 사용자는 이를 변경할 필요가 없습니다. 다른 조립, Compaction, 또는 세션 간 회상 동작이 필요할 때만 Plugin 엔진을 설치하고 선택하세요.

## 빠른 시작

<Steps>
  <Step title="활성 엔진 확인">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Plugin 엔진 설치">
    컨텍스트 엔진 Plugin은 다른 OpenClaw Plugin과 동일하게 설치합니다.

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

    설치와 구성을 마친 뒤 Gateway를 다시 시작하세요.

  </Step>
  <Step title="legacy로 되돌리기(선택 사항)">
    `contextEngine`을 `"legacy"`로 설정하세요. 또는 키를 완전히 제거해도 됩니다. `"legacy"`가 기본값입니다.
  </Step>
</Steps>

## 작동 방식

OpenClaw가 모델 프롬프트를 실행할 때마다 컨텍스트 엔진은 네 가지 수명 주기 지점에 참여합니다.

<AccordionGroup>
  <Accordion title="1. 수집">
    세션에 새 메시지가 추가될 때 호출됩니다. 엔진은 자체 데이터 저장소에 메시지를 저장하거나 색인할 수 있습니다.
  </Accordion>
  <Accordion title="2. 조립">
    각 모델 실행 전에 호출됩니다. 엔진은 토큰 예산 안에 맞는 정렬된 메시지 집합과 선택적 `systemPromptAddition`을 반환합니다.
  </Accordion>
  <Accordion title="3. 압축">
    컨텍스트 창이 가득 찼거나 사용자가 `/compact`를 실행할 때 호출됩니다. 엔진은 공간을 확보하기 위해 오래된 기록을 요약합니다.
  </Accordion>
  <Accordion title="4. 턴 이후">
    실행이 완료된 뒤 호출됩니다. 엔진은 상태를 유지하고, 백그라운드 Compaction을 트리거하거나, 색인을 업데이트할 수 있습니다.
  </Accordion>
</AccordionGroup>

번들된 비 ACP Codex 하니스의 경우, OpenClaw는 조립된 컨텍스트를 Codex 개발자 지침과 현재 턴 프롬프트로 투영하여 동일한 수명 주기를 적용합니다. Codex는 여전히 자체 네이티브 스레드 기록과 네이티브 압축기를 소유합니다.

### 하위 에이전트 수명 주기(선택 사항)

OpenClaw는 두 가지 선택적 하위 에이전트 수명 주기 훅을 호출합니다.

<ParamField path="prepareSubagentSpawn" type="method">
  자식 실행이 시작되기 전에 공유 컨텍스트 상태를 준비합니다. 이 훅은 부모/자식 세션 키, `contextMode`(`isolated` 또는 `fork`), 사용 가능한 대화록 ID/파일, 선택적 TTL을 받습니다. 롤백 핸들을 반환하면, 준비가 성공한 뒤 스폰이 실패했을 때 OpenClaw가 이를 호출합니다.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  하위 에이전트 세션이 완료되거나 정리될 때 정리합니다.
</ParamField>

### 시스템 프롬프트 추가

`assemble` 메서드는 `systemPromptAddition` 문자열을 반환할 수 있습니다. OpenClaw는 이를 해당 실행의 시스템 프롬프트 앞에 붙입니다. 이를 통해 엔진은 정적 워크스페이스 파일 없이도 동적 회상 지침, 검색 지침, 또는 컨텍스트 인식 힌트를 주입할 수 있습니다.

## legacy 엔진

내장 `legacy` 엔진은 OpenClaw의 기존 동작을 보존합니다.

- **수집**: 작업 없음입니다. 세션 관리자가 메시지 지속성을 직접 처리합니다.
- **조립**: 그대로 전달합니다. 런타임의 기존 sanitize → validate → limit 파이프라인이 컨텍스트 조립을 처리합니다.
- **압축**: 내장 요약 Compaction에 위임합니다. 이는 오래된 메시지의 단일 요약을 만들고 최근 메시지는 그대로 유지합니다.
- **턴 이후**: 작업 없음입니다.

legacy 엔진은 도구를 등록하지 않으며 `systemPromptAddition`도 제공하지 않습니다.

`plugins.slots.contextEngine`이 설정되지 않았거나 `"legacy"`로 설정된 경우 이 엔진이 자동으로 사용됩니다.

## Plugin 엔진

Plugin은 Plugin API를 사용해 컨텍스트 엔진을 등록할 수 있습니다.

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

팩터리 `ctx`에는 선택적 `config`, `agentDir`, `workspaceDir` 값이 포함되어 Plugin이 첫 번째 수명 주기 훅이 실행되기 전에 에이전트별 또는 워크스페이스별 상태를 초기화할 수 있습니다.

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
| `info`             | 속성     | 엔진 ID, 이름, 버전, 그리고 Compaction 소유 여부         |
| `ingest(params)`   | 메서드   | 단일 메시지 저장                                        |
| `assemble(params)` | 메서드   | 모델 실행을 위한 컨텍스트 구성(`AssembleResult` 반환)   |
| `compact(params)`  | 메서드   | 컨텍스트 요약/축소                                      |

`assemble`은 다음을 포함하는 `AssembleResult`를 반환합니다.

<ParamField path="messages" type="Message[]" required>
  모델에 보낼 정렬된 메시지입니다.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  조립된 컨텍스트의 총 토큰 수에 대한 엔진의 추정치입니다. OpenClaw는 이를 Compaction 임계값 결정과 진단 보고에 사용합니다.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  시스템 프롬프트 앞에 붙습니다.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  실행기가 선제적 오버플로 사전 검사에 사용할 토큰 추정치를 제어합니다. 기본값은 `"assembled"`이며, 이는 조립된 프롬프트의 추정치만 검사한다는 뜻입니다. 윈도 처리된 자체 완결 컨텍스트를 반환하는 엔진에 적합합니다. 조립된 뷰가 기본 대화록의 오버플로 위험을 숨길 수 있는 경우에만 `"preassembly_may_overflow"`로 설정하세요. 그러면 실행기는 선제적으로 압축할지 결정할 때 조립된 추정치와 조립 전(윈도 처리되지 않은) 세션 기록 추정치 중 최댓값을 사용합니다. 어느 쪽이든 반환한 메시지가 모델이 보는 내용입니다. `promptAuthority`는 사전 검사에만 영향을 줍니다.
</ParamField>

`compact`는 `CompactResult`를 반환합니다. Compaction이 활성 대화록을 회전시키면 `result.sessionId`와 `result.sessionFile`이 다음 재시도 또는 턴에서 사용해야 하는 후속 세션을 식별합니다.

선택 멤버:

| 멤버                           | 종류   | 목적                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 메서드 | 세션의 엔진 상태를 초기화합니다. 엔진이 세션을 처음 볼 때 한 번 호출됩니다(예: 기록 가져오기).                 |
| `ingestBatch(params)`          | 메서드 | 완료된 턴을 배치로 수집합니다. 실행이 완료된 뒤 해당 턴의 모든 메시지와 함께 한 번 호출됩니다.                |
| `afterTurn(params)`            | 메서드 | 실행 후 수명 주기 작업입니다. 상태 유지, 백그라운드 Compaction 트리거 등을 수행합니다.                         |
| `prepareSubagentSpawn(params)` | 메서드 | 자식 세션이 시작되기 전에 공유 상태를 설정합니다.                                                              |
| `onSubagentEnded(params)`      | 메서드 | 하위 에이전트가 종료된 뒤 정리합니다.                                                                          |
| `dispose()`                    | 메서드 | 리소스를 해제합니다. Gateway 종료 또는 Plugin 다시 로드 중 호출되며, 세션별로 호출되지 않습니다.              |

### ownsCompaction

`ownsCompaction`은 해당 실행에서 Pi의 내장 시도 중 자동 Compaction이 활성 상태로 유지되는지 제어합니다.

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    엔진이 Compaction 동작을 소유합니다. OpenClaw는 해당 실행에서 Pi의 내장 자동 Compaction을 비활성화하며, 엔진의 `compact()` 구현이 `/compact`, 오버플로 복구 Compaction, 그리고 `afterTurn()`에서 수행하려는 모든 사전 Compaction을 담당합니다. OpenClaw는 여전히 프롬프트 전 오버플로 보호 장치를 실행할 수 있습니다. 전체 대화록이 오버플로될 것으로 예측되면 복구 경로는 다른 프롬프트를 제출하기 전에 활성 엔진의 `compact()`를 호출합니다.
  </Accordion>
  <Accordion title="ownsCompaction: false 또는 미설정">
    Pi의 내장 자동 Compaction은 프롬프트 실행 중에도 계속 실행될 수 있지만, 활성 엔진의 `compact()` 메서드는 여전히 `/compact`와 오버플로 복구를 위해 호출됩니다.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`는 OpenClaw가 legacy 엔진의 Compaction 경로로 자동 대체된다는 뜻이 **아닙니다**.
</Warning>

따라서 유효한 Plugin 패턴은 두 가지입니다.

<Tabs>
  <Tab title="소유 모드">
    자체 Compaction 알고리즘을 구현하고 `ownsCompaction: true`를 설정하세요.
  </Tab>
  <Tab title="위임 모드">
    `ownsCompaction: false`를 설정하고, OpenClaw의 내장 Compaction 동작을 사용하도록 `compact()`에서 `openclaw/plugin-sdk/core`의 `delegateCompactionToRuntime(...)`를 호출하세요.
  </Tab>
</Tabs>

작업 없는 `compact()`는 활성 비소유 엔진에 안전하지 않습니다. 해당 엔진 슬롯의 정상적인 `/compact`와 오버플로 복구 Compaction 경로를 비활성화하기 때문입니다.

## 구성 참고

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
슬롯은 실행 시간에 배타적입니다. 지정된 실행 또는 Compaction 작업에 대해 등록된 컨텍스트 엔진은 하나만 해석됩니다. 활성화된 다른 `kind: "context-engine"` Plugin은 여전히 로드되어 등록 코드를 실행할 수 있습니다. `plugins.slots.contextEngine`은 OpenClaw가 컨텍스트 엔진이 필요할 때 해석할 등록 엔진 ID만 선택합니다.
</Note>

<Note>
**Plugin 제거:** 현재 `plugins.slots.contextEngine`으로 선택된 Plugin을 제거하면 OpenClaw는 슬롯을 기본값(`legacy`)으로 재설정합니다. 동일한 재설정 동작은 `plugins.slots.memory`에도 적용됩니다. 수동 구성 편집은 필요하지 않습니다.
</Note>

## Compaction 및 메모리와의 관계

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction은 컨텍스트 엔진의 책임 중 하나입니다. 레거시 엔진은 OpenClaw의 기본 요약 기능에 위임합니다. Plugin 엔진은 어떤 Compaction 전략이든 구현할 수 있습니다(DAG 요약, 벡터 검색 등).
  </Accordion>
  <Accordion title="Memory plugins">
    메모리 Plugin(`plugins.slots.memory`)은 컨텍스트 엔진과 별개입니다. 메모리 Plugin은 검색/검색 결과 가져오기를 제공하고, 컨텍스트 엔진은 모델이 보는 내용을 제어합니다. 둘은 함께 동작할 수 있습니다. 예를 들어 컨텍스트 엔진은 조립 과정에서 메모리 Plugin 데이터를 사용할 수 있습니다. Active Memory 프롬프트 경로를 원하는 Plugin 엔진은 `openclaw/plugin-sdk/core`의 `buildMemorySystemPromptAddition(...)`을 사용하는 것이 좋습니다. 이 함수는 Active Memory 프롬프트 섹션을 앞에 붙일 준비가 된 `systemPromptAddition`으로 변환합니다. 엔진에 더 낮은 수준의 제어가 필요하다면 `buildActiveMemoryPromptSection(...)`을 통해 `openclaw/plugin-sdk/memory-host-core`에서 원시 줄을 가져올 수도 있습니다.
  </Accordion>
  <Accordion title="Session pruning">
    어떤 컨텍스트 엔진이 활성 상태인지와 관계없이, 오래된 도구 결과를 메모리 내에서 잘라내는 작업은 계속 실행됩니다.
  </Accordion>
</AccordionGroup>

## 팁

- `openclaw doctor`를 사용해 엔진이 올바르게 로드되는지 확인하세요.
- 엔진을 전환해도 기존 세션은 현재 기록으로 계속 진행됩니다. 새 엔진은 이후 실행부터 이어받습니다.
- 엔진 오류는 로그에 기록되고 진단에 표시됩니다. Plugin 엔진 등록에 실패하거나 선택한 엔진 ID를 확인할 수 없으면 OpenClaw는 자동으로 대체 엔진으로 전환하지 않습니다. Plugin을 수정하거나 `plugins.slots.contextEngine`을 다시 `"legacy"`로 전환할 때까지 실행은 실패합니다.
- 개발 중에는 `openclaw plugins install -l ./my-engine`을 사용해 로컬 Plugin 디렉터리를 복사하지 않고 연결하세요.

## 관련 항목

- [Compaction](/ko/concepts/compaction) — 긴 대화 요약
- [컨텍스트](/ko/concepts/context) — 에이전트 턴의 컨텍스트가 구성되는 방식
- [Plugin 아키텍처](/ko/plugins/architecture) — 컨텍스트 엔진 Plugin 등록
- [Plugin 매니페스트](/ko/plugins/manifest) — Plugin 매니페스트 필드
- [Plugin](/ko/tools/plugin) — Plugin 개요
