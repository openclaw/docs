---
read_when:
    - OpenClaw가 모델 컨텍스트를 조립하는 방식을 이해하려고 합니다
    - 레거시 엔진과 Plugin 엔진 사이를 전환하고 있습니다
    - 컨텍스트 엔진 Plugin을 빌드하고 있습니다
summary: '컨텍스트 엔진: 플러그형 컨텍스트 조립, Compaction, 및 서브에이전트 수명 주기'
title: 컨텍스트 엔진
x-i18n:
    generated_at: "2026-04-25T05:59:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

**컨텍스트 엔진**은 OpenClaw가 각 실행마다 모델 컨텍스트를 어떻게 구성할지 제어합니다.
어떤 메시지를 포함할지, 오래된 기록을 어떻게 요약할지, 그리고 서브에이전트 경계를 넘나드는 컨텍스트를 어떻게 관리할지를 결정합니다.

OpenClaw에는 내장 `legacy` 엔진이 포함되어 있으며 기본적으로 이를 사용합니다. 대부분의 사용자는 이를 변경할 필요가 없습니다. 조립, Compaction, 또는 세션 간 재호출 동작을 다르게 하고 싶을 때만 Plugin 엔진을 설치하고 선택하세요.

## 빠른 시작

현재 어떤 엔진이 활성화되어 있는지 확인합니다:

```bash
openclaw doctor
# 또는 config를 직접 확인:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### 컨텍스트 엔진 Plugin 설치

컨텍스트 엔진 Plugin은 다른 OpenClaw Plugin과 동일하게 설치합니다. 먼저 설치한 다음 슬롯에서 엔진을 선택하세요:

```bash
# npm에서 설치
openclaw plugins install @martian-engineering/lossless-claw

# 또는 로컬 경로에서 설치(개발용)
openclaw plugins install -l ./my-context-engine
```

그런 다음 config에서 Plugin을 활성화하고 활성 엔진으로 선택합니다:

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
        // Plugin별 config는 여기에 작성(Plugin 문서 참고)
      },
    },
  },
}
```

설치와 구성을 마친 뒤 Gateway를 다시 시작하세요.

내장 엔진으로 다시 전환하려면 `contextEngine`을 `"legacy"`로 설정하세요(또는 키를 완전히 제거해도 됩니다. `"legacy"`가 기본값입니다).

## 동작 방식

OpenClaw가 모델 프롬프트를 실행할 때마다, 컨텍스트 엔진은 네 가지 수명 주기 지점에 참여합니다:

1. **Ingest** — 새 메시지가 세션에 추가될 때 호출됩니다. 엔진은 자체 데이터 저장소에 메시지를 저장하거나 인덱싱할 수 있습니다.
2. **Assemble** — 각 모델 실행 전에 호출됩니다. 엔진은 토큰 예산 안에 맞는 정렬된 메시지 집합(및 선택적 `systemPromptAddition`)을 반환합니다.
3. **Compact** — 컨텍스트 창이 가득 찼거나 사용자가 `/compact`를 실행할 때 호출됩니다. 엔진은 공간을 확보하기 위해 오래된 기록을 요약합니다.
4. **After turn** — 실행이 완료된 뒤 호출됩니다. 엔진은 상태를 저장하거나, 백그라운드 Compaction을 트리거하거나, 인덱스를 업데이트할 수 있습니다.

번들된 비-ACP Codex harness의 경우, OpenClaw는 조립된 컨텍스트를 Codex 개발자 지침과 현재 턴 프롬프트에 투영하여 동일한 수명 주기를 적용합니다. Codex는 여전히 자체 네이티브 스레드 기록과 네이티브 compactor를 관리합니다.

### 서브에이전트 수명 주기(선택 사항)

OpenClaw는 두 개의 선택적 서브에이전트 수명 주기 훅을 호출합니다:

- **prepareSubagentSpawn** — 자식 실행이 시작되기 전에 공유 컨텍스트 상태를 준비합니다. 이 훅은 부모/자식 세션 키, `contextMode`(`isolated` 또는 `fork`), 사용 가능한 transcript id/파일, 선택적 TTL을 받습니다. 롤백 핸들을 반환하면 준비 성공 후 spawn이 실패했을 때 OpenClaw가 이를 호출합니다.
- **onSubagentEnded** — 서브에이전트 세션이 완료되거나 정리되었을 때 정리 작업을 수행합니다.

### 시스템 프롬프트 추가

`assemble` 메서드는 `systemPromptAddition` 문자열을 반환할 수 있습니다. OpenClaw는 이를 해당 실행의 시스템 프롬프트 앞에 덧붙입니다. 이를 통해 엔진은 정적 workspace 파일이 없어도 동적 재호출 안내, 검색 지침, 또는 컨텍스트 인지 힌트를 주입할 수 있습니다.

## legacy 엔진

내장 `legacy` 엔진은 OpenClaw의 원래 동작을 유지합니다:

- **Ingest**: no-op(세션 관리자가 메시지 지속성을 직접 처리함).
- **Assemble**: pass-through(런타임의 기존 sanitize → validate → limit 파이프라인이 컨텍스트 조립을 처리함).
- **Compact**: 내장 요약 Compaction에 위임하며, 오래된 메시지 하나의 요약을 만들고 최근 메시지는 그대로 유지합니다.
- **After turn**: no-op.

legacy 엔진은 도구를 등록하지 않으며 `systemPromptAddition`도 제공하지 않습니다.

`plugins.slots.contextEngine`이 설정되지 않았거나(또는 `"legacy"`로 설정된 경우), 이 엔진이 자동으로 사용됩니다.

## Plugin 엔진

Plugin은 Plugin API를 사용해 컨텍스트 엔진을 등록할 수 있습니다:

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
      // 데이터 저장소에 메시지 저장
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

그런 다음 config에서 활성화합니다:

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

| 멤버               | 종류     | 목적                                                   |
| ------------------ | -------- | ------------------------------------------------------ |
| `info`             | 속성     | 엔진 id, 이름, 버전, 그리고 Compaction 소유 여부       |
| `ingest(params)`   | 메서드   | 단일 메시지 저장                                       |
| `assemble(params)` | 메서드   | 모델 실행용 컨텍스트 구성(`AssembleResult` 반환)       |
| `compact(params)`  | 메서드   | 컨텍스트 요약/축소                                     |

`assemble`은 다음을 포함하는 `AssembleResult`를 반환합니다:

- `messages` — 모델에 보낼 정렬된 메시지.
- `estimatedTokens`(필수, `number`) — 조립된 컨텍스트의 총 토큰 수에 대한 엔진의 추정치. OpenClaw는 이를 Compaction 임계값 결정과 진단 보고에 사용합니다.
- `systemPromptAddition`(선택 사항, `string`) — 시스템 프롬프트 앞에 덧붙여집니다.

선택적 멤버:

| 멤버                           | 종류   | 목적                                                                                                  |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 메서드 | 세션용 엔진 상태 초기화. 엔진이 세션을 처음 볼 때 한 번 호출됨(예: 기록 가져오기).                   |
| `ingestBatch(params)`          | 메서드 | 완료된 턴을 배치로 수집. 실행 완료 후 해당 턴의 모든 메시지와 함께 한 번에 호출됨.                  |
| `afterTurn(params)`            | 메서드 | 실행 후 수명 주기 작업(상태 저장, 백그라운드 Compaction 트리거).                                     |
| `prepareSubagentSpawn(params)` | 메서드 | 자식 세션이 시작되기 전에 공유 상태 설정.                                                            |
| `onSubagentEnded(params)`      | 메서드 | 서브에이전트 종료 후 정리 작업.                                                                      |
| `dispose()`                    | 메서드 | 리소스 해제. Gateway 종료 또는 Plugin 다시 로드 중 호출되며 세션별 호출은 아님.                     |

### ownsCompaction

`ownsCompaction`은 실행 중 Pi의 내장 in-attempt 자동 Compaction을 계속 활성화할지 제어합니다:

- `true` — 엔진이 Compaction 동작을 소유합니다. OpenClaw는 해당 실행에서 Pi의 내장 자동 Compaction을 비활성화하며, 엔진의 `compact()` 구현이 `/compact`, 오버플로 복구 Compaction, 그리고 `afterTurn()`에서 원하는 모든 사전적 Compaction을 담당합니다. OpenClaw는 여전히 프롬프트 전 오버플로 보호 장치를 실행할 수 있습니다. 전체 transcript가 오버플로할 것으로 예측되면, 복구 경로는 다른 프롬프트를 제출하기 전에 활성 엔진의 `compact()`를 호출합니다.
- `false` 또는 미설정 — 프롬프트 실행 중 Pi의 내장 자동 Compaction이 계속 실행될 수 있지만, 활성 엔진의 `compact()` 메서드는 여전히 `/compact` 및 오버플로 복구에 호출됩니다.

`ownsCompaction: false`는 OpenClaw가 자동으로 legacy 엔진의 Compaction 경로로 대체된다는 뜻이 **아닙니다**.

즉, 유효한 Plugin 패턴은 두 가지입니다:

- **소유 모드** — 자체 Compaction 알고리즘을 구현하고 `ownsCompaction: true`로 설정합니다.
- **위임 모드** — `ownsCompaction: false`로 설정하고 `compact()`에서 `openclaw/plugin-sdk/core`의 `delegateCompactionToRuntime(...)`을 호출해 OpenClaw의 내장 Compaction 동작을 사용합니다.

실행 중인 비소유 엔진에서 no-op `compact()`는 안전하지 않습니다. 해당 엔진 슬롯의 일반적인 `/compact` 및 오버플로 복구 Compaction 경로를 비활성화하기 때문입니다.

## 구성 참조

```json5
{
  plugins: {
    slots: {
      // 활성 컨텍스트 엔진을 선택합니다. 기본값: "legacy".
      // Plugin 엔진을 사용하려면 Plugin id로 설정하세요.
      contextEngine: "legacy",
    },
  },
}
```

이 슬롯은 런타임에서 배타적입니다. 주어진 실행 또는 Compaction 작업에 대해 등록된 컨텍스트 엔진은 하나만 확인됩니다. 다른 활성화된 `kind: "context-engine"` Plugin도 계속 로드되어 등록 코드를 실행할 수 있지만, `plugins.slots.contextEngine`은 OpenClaw가 컨텍스트 엔진이 필요할 때 어떤 등록 엔진 id를 확인할지만 선택합니다.

## Compaction 및 메모리와의 관계

- **Compaction**은 컨텍스트 엔진의 책임 중 하나입니다. legacy 엔진은 OpenClaw의 내장 요약 기능에 위임합니다. Plugin 엔진은 어떤 Compaction 전략이든 구현할 수 있습니다(DAG 요약, 벡터 검색 등).
- **메모리 Plugin**(`plugins.slots.memory`)은 컨텍스트 엔진과 별개입니다. 메모리 Plugin은 검색/재호출을 제공하고, 컨텍스트 엔진은 모델이 무엇을 볼지 제어합니다. 둘은 함께 작동할 수 있습니다. 예를 들어 컨텍스트 엔진은 조립 중 메모리 Plugin 데이터를 사용할 수 있습니다. 활성 메모리 프롬프트 경로를 원하는 Plugin 엔진은 `openclaw/plugin-sdk/core`의 `buildMemorySystemPromptAddition(...)`을 우선 사용하는 것이 좋습니다. 이 함수는 활성 메모리 프롬프트 섹션을 바로 앞에 붙일 수 있는 `systemPromptAddition`으로 변환합니다. 엔진에 더 낮은 수준의 제어가 필요하면, 여전히 `openclaw/plugin-sdk/memory-host-core`의 `buildActiveMemoryPromptSection(...)`을 통해 원시 줄 데이터를 가져올 수 있습니다.
- **세션 가지치기**(메모리 내 오래된 도구 결과 정리)는 어떤 컨텍스트 엔진이 활성인지와 관계없이 계속 실행됩니다.

## 팁

- 엔진이 올바르게 로드되는지 확인하려면 `openclaw doctor`를 사용하세요.
- 엔진을 전환해도 기존 세션은 현재 기록을 유지한 채 계속됩니다. 새 엔진은 이후 실행부터 적용됩니다.
- 엔진 오류는 로그에 기록되고 진단에 표시됩니다. Plugin 엔진 등록에 실패하거나 선택한 엔진 id를 확인할 수 없으면, OpenClaw는 자동으로 대체하지 않습니다. Plugin을 수정하거나 `plugins.slots.contextEngine`을 `"legacy"`로 되돌릴 때까지 실행이 실패합니다.
- 개발 시에는 `openclaw plugins install -l ./my-engine`을 사용해 로컬 Plugin 디렉터리를 복사하지 않고 링크할 수 있습니다.

함께 보기: [Compaction](/ko/concepts/compaction), [Context](/ko/concepts/context),
[Plugins](/ko/tools/plugin), [Plugin manifest](/ko/plugins/manifest).

## 관련 항목

- [Context](/ko/concepts/context) — 에이전트 턴용 컨텍스트가 구성되는 방식
- [Plugin Architecture](/ko/plugins/architecture) — 컨텍스트 엔진 Plugin 등록
- [Compaction](/ko/concepts/compaction) — 긴 대화 요약
