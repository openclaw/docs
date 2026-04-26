---
read_when:
    - OpenClaw가 모델 컨텍스트를 어떻게 조합하는지 이해하려고 합니다
    - 레거시 엔진과 Plugin 엔진 사이를 전환하고 있습니다
    - 컨텍스트 엔진 Plugin을 만들고 있습니다
sidebarTitle: Context engine
summary: '컨텍스트 엔진: 플러그형 컨텍스트 조합, Compaction 및 하위 에이전트 생명주기'
title: 컨텍스트 엔진
x-i18n:
    generated_at: "2026-04-26T11:26:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

**컨텍스트 엔진**은 OpenClaw가 각 실행마다 모델 컨텍스트를 어떻게 구성할지 제어합니다. 즉, 어떤 메시지를 포함할지, 오래된 기록을 어떻게 요약할지, 하위 에이전트 경계를 넘나들며 컨텍스트를 어떻게 관리할지를 담당합니다.

OpenClaw에는 내장 `legacy` 엔진이 포함되어 있으며 기본값으로 사용됩니다. 대부분의 사용자는 이를 변경할 필요가 없습니다. 조합, Compaction 또는 세션 간 회상 동작을 다르게 하고 싶을 때만 Plugin 엔진을 설치하고 선택하세요.

## 빠른 시작

<Steps>
  <Step title="현재 활성 엔진 확인">
    ```bash
    openclaw doctor
    # 또는 config를 직접 확인:
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
          contextEngine: "lossless-claw", // Plugin이 등록한 엔진 id와 일치해야 함
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin 전용 config는 여기에 추가(Plugin 문서 참조)
          },
        },
      },
    }
    ```

    설치 및 구성 후 gateway를 다시 시작하세요.

  </Step>
  <Step title="legacy로 다시 전환(선택 사항)">
    `contextEngine`을 `"legacy"`로 설정하세요(또는 키를 아예 제거해도 됩니다. 기본값은 `"legacy"`입니다).
  </Step>
</Steps>

## 작동 방식

OpenClaw가 모델 프롬프트를 실행할 때마다 컨텍스트 엔진은 네 가지 생명주기 지점에 참여합니다.

<AccordionGroup>
  <Accordion title="1. 수집">
    새 메시지가 세션에 추가될 때 호출됩니다. 엔진은 자체 데이터 저장소에 메시지를 저장하거나 인덱싱할 수 있습니다.
  </Accordion>
  <Accordion title="2. 조합">
    각 모델 실행 전에 호출됩니다. 엔진은 토큰 예산 안에 들어가는 정렬된 메시지 집합(및 선택적인 `systemPromptAddition`)을 반환합니다.
  </Accordion>
  <Accordion title="3. Compaction">
    컨텍스트 윈도우가 가득 찼거나 사용자가 `/compact`를 실행할 때 호출됩니다. 엔진은 오래된 기록을 요약해 공간을 확보합니다.
  </Accordion>
  <Accordion title="4. 턴 이후">
    실행이 완료된 후 호출됩니다. 엔진은 상태를 지속 저장하거나, 백그라운드 Compaction을 트리거하거나, 인덱스를 갱신할 수 있습니다.
  </Accordion>
</AccordionGroup>

번들된 비-ACP Codex 하네스의 경우에도 OpenClaw는 조합된 컨텍스트를 Codex 개발자 지침과 현재 턴 프롬프트로 투영하여 동일한 생명주기를 적용합니다. Codex는 여전히 자체 네이티브 스레드 기록과 네이티브 compactor를 소유합니다.

### 하위 에이전트 생명주기(선택 사항)

OpenClaw는 선택적인 하위 에이전트 생명주기 hook 두 개를 호출합니다.

<ParamField path="prepareSubagentSpawn" type="method">
  하위 실행이 시작되기 전에 공유 컨텍스트 상태를 준비합니다. 이 hook은 부모/자식 세션 키, `contextMode`(`isolated` 또는 `fork`), 사용 가능한 transcript id/파일, 선택적 TTL을 받습니다. 준비는 성공했지만 spawn이 실패한 경우 되돌리기 핸들을 반환하면 OpenClaw가 이를 호출합니다.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  하위 에이전트 세션이 완료되거나 정리될 때 정리 작업을 수행합니다.
</ParamField>

### 시스템 프롬프트 추가

`assemble` 메서드는 `systemPromptAddition` 문자열을 반환할 수 있습니다. OpenClaw는 실행 시 이를 시스템 프롬프트 앞에 덧붙입니다. 이를 통해 엔진은 정적 workspace 파일 없이도 동적 회상 가이드, 검색 지침 또는 컨텍스트 인지 힌트를 주입할 수 있습니다.

## legacy 엔진

내장 `legacy` 엔진은 OpenClaw의 원래 동작을 유지합니다.

- **수집**: no-op(세션 관리자가 메시지 지속 저장을 직접 처리함)
- **조합**: pass-through(런타임의 기존 sanitize → validate → limit 파이프라인이 컨텍스트 조합을 처리함)
- **Compact**: 오래된 메시지의 단일 요약을 만들고 최근 메시지는 그대로 유지하는 내장 요약 Compaction에 위임
- **턴 이후**: no-op

legacy 엔진은 도구를 등록하지 않으며 `systemPromptAddition`도 제공하지 않습니다.

`plugins.slots.contextEngine`이 설정되지 않았거나 `"legacy"`로 설정되어 있으면 이 엔진이 자동으로 사용됩니다.

## Plugin 엔진

Plugin은 Plugin API를 사용해 컨텍스트 엔진을 등록할 수 있습니다.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // 메시지를 데이터 저장소에 저장
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // 예산에 맞는 메시지 반환
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
      // 오래된 컨텍스트 요약
      return { ok: true, compacted: true };
    },
  }));
}
```

그런 다음 config에서 활성화합니다.

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

| 멤버              | 종류     | 목적                                                       |
| ----------------- | -------- | ---------------------------------------------------------- |
| `info`            | 속성     | 엔진 id, 이름, 버전, Compaction 소유 여부                  |
| `ingest(params)`  | 메서드   | 단일 메시지 저장                                           |
| `assemble(params)`| 메서드   | 모델 실행용 컨텍스트 구성(`AssembleResult` 반환)           |
| `compact(params)` | 메서드   | 컨텍스트 요약/축소                                         |

`assemble`은 다음을 포함한 `AssembleResult`를 반환합니다.

<ParamField path="messages" type="Message[]" required>
  모델에 보낼 정렬된 메시지.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  조합된 컨텍스트의 총 토큰 수에 대한 엔진의 추정치입니다. OpenClaw는 이를 Compaction 임계값 결정과 진단 보고에 사용합니다.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  시스템 프롬프트 앞에 추가됩니다.
</ParamField>

선택적 멤버:

| 멤버                           | 종류   | 목적                                                                                                              |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 메서드 | 세션용 엔진 상태 초기화. 엔진이 세션을 처음 볼 때 한 번 호출됨(예: 기록 가져오기).                              |
| `ingestBatch(params)`          | 메서드 | 완료된 턴을 배치로 수집. 실행 완료 후 해당 턴의 모든 메시지를 한 번에 받아 호출됨.                              |
| `afterTurn(params)`            | 메서드 | 실행 후 생명주기 작업(상태 지속 저장, 백그라운드 Compaction 트리거).                                             |
| `prepareSubagentSpawn(params)` | 메서드 | 하위 세션이 시작되기 전에 공유 상태 설정.                                                                         |
| `onSubagentEnded(params)`      | 메서드 | 하위 에이전트 종료 후 정리.                                                                                       |
| `dispose()`                    | 메서드 | 리소스 해제. gateway 종료 또는 Plugin 리로드 중 호출되며, 세션별 호출은 아님.                                    |

### ownsCompaction

`ownsCompaction`은 Pi의 내장 실행 중 자동 Compaction이 해당 실행에서 계속 활성화될지 여부를 제어합니다.

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    엔진이 Compaction 동작을 소유합니다. OpenClaw는 해당 실행에 대해 Pi의 내장 자동 Compaction을 비활성화하며, 엔진의 `compact()` 구현이 `/compact`, 오버플로 복구 Compaction, 그리고 `afterTurn()`에서 수행하려는 선제적 Compaction을 책임집니다. OpenClaw는 여전히 프롬프트 전 오버플로 보호 장치를 실행할 수 있으며, 전체 transcript가 오버플로할 것으로 예측되면 복구 경로가 활성 엔진의 `compact()`를 호출한 뒤 다른 프롬프트를 제출합니다.
  </Accordion>
  <Accordion title="ownsCompaction: false 또는 미설정">
    프롬프트 실행 중 Pi의 내장 자동 Compaction은 계속 실행될 수 있지만, `/compact` 및 오버플로 복구를 위해서는 활성 엔진의 `compact()` 메서드가 여전히 호출됩니다.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`는 OpenClaw가 자동으로 legacy 엔진의 Compaction 경로로 폴백한다는 뜻이 **아닙니다**.
</Warning>

즉, 유효한 Plugin 패턴은 두 가지입니다.

<Tabs>
  <Tab title="소유 모드">
    자체 Compaction 알고리즘을 구현하고 `ownsCompaction: true`로 설정합니다.
  </Tab>
  <Tab title="위임 모드">
    `ownsCompaction: false`로 설정하고, OpenClaw의 내장 Compaction 동작을 사용하기 위해 `compact()`가 `openclaw/plugin-sdk/core`의 `delegateCompactionToRuntime(...)`를 호출하도록 합니다.
  </Tab>
</Tabs>

활성 비소유 엔진에서 no-op `compact()`는 안전하지 않습니다. 해당 엔진 슬롯에 대한 일반 `/compact` 및 오버플로 복구 Compaction 경로를 비활성화하기 때문입니다.

## 구성 참조

```json5
{
  plugins: {
    slots: {
      // 활성 컨텍스트 엔진 선택. 기본값: "legacy".
      // Plugin 엔진을 사용하려면 Plugin id로 설정.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
이 슬롯은 런타임에서 배타적입니다. 주어진 실행 또는 Compaction 작업에 대해 등록된 컨텍스트 엔진은 하나만 해석됩니다. 다른 활성화된 `kind: "context-engine"` Plugin도 계속 로드되어 등록 코드를 실행할 수 있지만, `plugins.slots.contextEngine`은 OpenClaw가 컨텍스트 엔진이 필요할 때 어떤 등록된 엔진 id를 해석할지만 선택합니다.
</Note>

<Note>
**Plugin 제거:** 현재 `plugins.slots.contextEngine`으로 선택된 Plugin을 제거하면 OpenClaw는 해당 슬롯을 기본값(`legacy`)으로 재설정합니다. 동일한 재설정 동작이 `plugins.slots.memory`에도 적용됩니다. 수동 config 편집은 필요하지 않습니다.
</Note>

## Compaction 및 메모리와의 관계

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction은 컨텍스트 엔진의 책임 중 하나입니다. legacy 엔진은 OpenClaw의 내장 요약에 위임합니다. Plugin 엔진은 어떤 Compaction 전략이든 구현할 수 있습니다(DAG 요약, 벡터 검색 등).
  </Accordion>
  <Accordion title="메모리 Plugin">
    메모리 Plugin(`plugins.slots.memory`)은 컨텍스트 엔진과 별개입니다. 메모리 Plugin은 검색/회수를 제공하고, 컨텍스트 엔진은 모델이 무엇을 보게 할지를 제어합니다. 둘은 함께 동작할 수 있습니다. 예를 들어 컨텍스트 엔진은 조합 중에 메모리 Plugin 데이터를 사용할 수 있습니다. 활성 메모리 프롬프트 경로가 필요한 Plugin 엔진은 `openclaw/plugin-sdk/core`의 `buildMemorySystemPromptAddition(...)`를 우선 사용하는 것이 좋습니다. 이 함수는 활성 메모리 프롬프트 섹션을 바로 앞에 붙일 수 있는 `systemPromptAddition`으로 변환합니다. 엔진에 더 낮은 수준의 제어가 필요하면 `openclaw/plugin-sdk/memory-host-core`의 `buildActiveMemoryPromptSection(...)`을 통해 원시 줄을 직접 가져올 수도 있습니다.
  </Accordion>
  <Accordion title="세션 정리">
    메모리 내 오래된 도구 결과를 잘라내는 작업은 어떤 컨텍스트 엔진이 활성인지와 관계없이 계속 실행됩니다.
  </Accordion>
</AccordionGroup>

## 팁

- 엔진이 올바르게 로드되는지 확인하려면 `openclaw doctor`를 사용하세요.
- 엔진을 전환하더라도 기존 세션은 현재 기록을 그대로 유지합니다. 새 엔진은 이후 실행부터 적용됩니다.
- 엔진 오류는 로그에 기록되고 진단에 표시됩니다. Plugin 엔진 등록에 실패하거나 선택된 엔진 id를 해석할 수 없으면 OpenClaw는 자동으로 폴백하지 않습니다. Plugin을 수정하거나 `plugins.slots.contextEngine`을 `"legacy"`로 되돌릴 때까지 실행은 실패합니다.
- 개발 시에는 `openclaw plugins install -l ./my-engine`을 사용해 복사 없이 로컬 Plugin 디렉터리를 링크하세요.

## 관련 항목

- [Compaction](/ko/concepts/compaction) — 긴 대화 요약
- [컨텍스트](/ko/concepts/context) — 에이전트 턴용 컨텍스트가 구성되는 방식
- [Plugin 아키텍처](/ko/plugins/architecture) — 컨텍스트 엔진 Plugin 등록
- [Plugin 매니페스트](/ko/plugins/manifest) — Plugin 매니페스트 필드
- [Plugins](/ko/tools/plugin) — Plugin 개요
