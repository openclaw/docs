---
read_when:
    - 내장 에이전트 런타임 또는 하니스 레지스트리를 변경하고 있습니다
    - 번들 또는 신뢰할 수 있는 Plugin에서 에이전트 하니스를 등록하고 있습니다.
    - Codex Plugin이 모델 제공업체와 어떤 관련이 있는지 이해해야 합니다
sidebarTitle: Agent Harness
summary: 저수준 임베디드 에이전트 실행기를 대체하는 Plugin을 위한 실험적 SDK 인터페이스
title: 에이전트 하네스 Plugin
x-i18n:
    generated_at: "2026-07-12T15:34:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be2717d9986c30e931d3443dc6b70542ab20badb4ad0921e797fbad280513d1e
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**에이전트 하네스**는 준비된 OpenClaw 에이전트 턴 하나를 실행하는 저수준 실행기입니다. 모델 제공자도, 채널도, 도구 레지스트리도 아닙니다. 사용자 관점의 개념 모델은 [에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하십시오.

이 표면은 번들 또는 신뢰할 수 있는 네이티브 Plugin에만 사용하십시오. 매개변수 유형이 의도적으로 현재 임베디드 러너를 그대로 반영하므로 계약은 아직 실험 단계입니다.

## 하네스를 사용해야 하는 경우

모델 계열에 자체 네이티브 세션 런타임이 있고 일반 OpenClaw 제공자 전송이 적합한 추상화가 아닌 경우 에이전트 하네스를 등록하십시오.

- 스레드와 Compaction을 소유하는 네이티브 코딩 에이전트 서버
- 네이티브 계획/추론/도구 이벤트를 스트리밍해야 하는 로컬 CLI 또는 데몬
- OpenClaw 세션 트랜스크립트 외에 자체 재개 ID가 필요한 모델 런타임

새 LLM API를 추가하기 위한 목적으로만 하네스를 등록하지 **마십시오**. 일반적인 HTTP 또는 WebSocket 모델 API에는 [제공자 Plugin](/ko/plugins/sdk-provider-plugins)을 구축하십시오.

## 코어가 계속 소유하는 항목

하네스가 선택되기 전에 OpenClaw는 이미 다음 항목을 결정합니다.

- 제공자 및 모델
- 하네스가 인증 부트스트랩을 소유한다고 선언하지 않는 한 런타임 인증 상태
- 사고 수준 및 컨텍스트 예산
- OpenClaw 트랜스크립트/세션 파일
- 작업 공간, 샌드박스 및 도구 정책
- 채널 응답 콜백 및 스트리밍 콜백
- 모델 폴백 및 실시간 모델 전환 정책

하네스는 준비된 시도를 실행하며 제공자를 선택하거나, 채널 전달을 대체하거나, 모델을 자동으로 전환하지 않습니다.

### 하네스 소유 인증 부트스트랩

기본적으로 코어는 하네스를 호출하기 전에 제공자 자격 증명을 결정합니다. 자체 네이티브 런타임을 통해 인증할 수 있는 신뢰할 수 있는 하네스는 정적 `AgentHarness` 등록에 `authBootstrap: "harness"`를 설정할 수 있습니다. 그러면 코어는 해당 하네스가 담당하는 모든 시도에 대해 일반 제공자 자격 증명 부트스트랩과 자격 증명 누락 오류 처리를 건너뜁니다.

코어는 호환되며 명시적으로 선택되었거나 순서가 지정된 OpenClaw 인증 프로필과 범위가 지정된 저장소가 존재하는 경우 이를 계속 전달합니다. 하네스는 모델 요청을 실행하기 전에 해당 프로필이나 자체 네이티브 자격 증명을 확인하고, 비밀을 해당 시도의 범위로 제한하며, 조치 가능한 인증 오류를 표시해야 합니다. 인증을 일부 경우에만 소유하는 하네스에는 이 기능을 설정하지 마십시오.

### 검증된 설정 런타임 아티팩트

첫 실행 설정에 추론을 제공할 수 있는 로컬 하네스는 프로브를 완료한 구현을 증명해야 합니다. `params.captureRuntimeArtifact`가 true이면 안정적인 ID와 콘텐츠 지문을 포함하는 불투명한 `result.runtimeArtifact`를 반환하십시오. 다른 하네스를 로드하거나 관련 없는 Plugin을 검색하지 않고 해당 바인딩을 다시 확인하는 일치하는 `runtimeArtifact.validate(...)` 기능을 등록하십시오.

검증된 Crestodian 연속 실행에서는 `params.expectedRuntimeArtifact`도 전달됩니다. 하네스는 이를 자신이 획득한 정확한 네이티브 프로세스와 비교해야 하며, 서로 다르면 네이티브 스레드를 시작하거나 재개하기 전에 실패해야 합니다. 일반 에이전트 턴에서는 두 필드를 모두 생략하므로 콘텐츠 해싱이 일반 요청의 핫 패스에 포함되지 않습니다. 원격/WebSocket 하네스가 참여하려면 서버 증명 계약이 필요하며, 버전 문자열만으로는 아티팩트 ID가 될 수 없습니다.

준비된 시도에는 OpenClaw와 네이티브 하네스 간에 공유되어야 하는 런타임 결정을 위한 OpenClaw 소유 정책 번들인 `params.runtimePlan`도 포함됩니다.

- 제공자 인식 도구 스키마 정책을 위한 `runtimePlan.tools.normalize(...)` 및 `runtimePlan.tools.logDiagnostics(...)`
- 트랜스크립트 정제 및 도구 호출 복구 정책을 위한 `runtimePlan.transcript.resolvePolicy(...)`
- 공유 `NO_REPLY` 및 미디어 전달 억제를 위한 `runtimePlan.delivery.isSilentPayload(...)`
- 모델 폴백 분류를 위한 `runtimePlan.outcome.classifyRunResult(...)`
- 결정된 제공자/모델/하네스 메타데이터를 위한 `runtimePlan.observability`

하네스는 OpenClaw 동작과 일치해야 하는 결정에 이 계획을 사용할 수 있지만, 이를 호스트 소유 시도 상태로 취급하십시오. 변경하거나 턴 내에서 제공자/모델을 전환하는 데 사용하지 마십시오.

### 요청 전송 계약

`supports(ctx)`는 `ctx.modelProvider`에서 결정된 모델 전송을 받습니다. 비밀이 포함되지 않은 제공자 소유 정보 두 가지가 선택된 경로를 설명합니다.

- `runtimePolicy.compatibleIds`는 제공자가 해당 구체적인 경로와 호환된다고 선언한 런타임 ID를 나열합니다. 정책이 없다는 것은 제공자가 경로 수준 호환성을 선언하지 않았다는 의미이며, 지원을 가정해도 된다는 허가가 아닙니다.
- `requestTransportOverrides: "none"`은 작성된 제공자/모델 요청 재정의를 재현할 필요가 없음을 의미합니다. `"present"`는 작성된 헤더, 인증 전송, 프록시, TLS, 로컬 서비스, 사설 네트워크 동작 또는 요청 매개변수가 존재함을 의미합니다. 이 정보는 해당 값을 노출하지 않습니다.

하네스가 준비된 전송을 재현할 수 없으면 `{ supported: false, reason }`을 반환하십시오. 선택 후 원시 구성을 읽어 지원 여부를 추론하지 마십시오. 인증 준비에서 여러 재시도 경로가 생성되면 디스패치 전에 하나의 하네스가 모든 경로를 지원해야 합니다. 어떤 Plugin도 전체 경로 집합을 소유할 수 없으면 암시적 선택은 OpenClaw를 사용하며, 명시적으로 선택되었거나 저장된 Plugin 선택은 안전하게 실패합니다.

## 하네스 등록

**가져오기:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "effective route is not harness-compatible" };
  },

  async runAttempt(params) {
    // 네이티브 스레드를 시작하거나 재개합니다.
    // params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent 및 준비된 기타 시도 필드를 사용합니다.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "선택한 모델을 네이티브 에이전트 데몬을 통해 실행합니다.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

이 일반 예제에서는 의도적으로 `authBootstrap`을 생략했습니다. 하네스가 위의 계약을 충족하는 경우에만
`authBootstrap: "harness"`를 추가하십시오.

### 위임된 실행

하네스 소유자는 음성 전송 계층이 Codex 기반 대화를 계속하는 경우처럼, 기존의 모델 잠금 세션을 실행해야 하는 신뢰할 수 있는 Plugin의 ID를 `delegatedExecutionPluginIds`에 설정할 수 있습니다. 이는 코어 허용 목록이 아니라 소유자의 정적 동의입니다. 범위를 좁게 유지하십시오.

위임자는 작업 수락과 임베디드 실행 권한만 받습니다. OpenClaw에는 저장된 세션 키, 저장소 경로 및 세션 ID가 정확히 일치해야 하고, `modelSelectionLocked:
true`여야 하며, `agentHarnessId`와 `agentHarnessRuntimeOverride` 값도 일치해야 합니다.
그러면 실행 범위가 하네스 소유자를 통해 지정됩니다. 세션 생성, 패치,
재설정, 삭제, 보관 및 Gateway 변경은 계속 소유자만 수행할 수 있습니다.

## 선택 정책

OpenClaw는 공급자/모델을 확인한 후 하네스를 선택합니다.

1. 모델 범위 런타임 정책이 우선합니다.
2. 그다음은 공급자 범위 런타임 정책입니다.
3. `auto`는 등록된 하네스에 확인된 유효 경로를 지원하는지 묻습니다.
   공급자/모델 접두사만으로는 하네스를 선택하지 않습니다.
4. 일치하는 등록 하네스가 없으면 OpenClaw는 임베디드 런타임을 사용합니다.

Plugin 하네스 실패는 실행 실패로 표시됩니다. `auto` 모드에서 임베디드
대체는 확인된 공급자/모델을 지원하는 등록된 Plugin 하네스가 없을 때만
적용됩니다. Plugin 하네스가 실행을 인수한 후에는 인증/런타임 의미 체계가
달라지거나 부작용이 중복될 수 있으므로 OpenClaw는 동일한 턴을 다른
런타임으로 재실행하지 않습니다.

구성된 런타임 정책은 원하는 런타임에 대한 최종 권한을 유지합니다.
지속된 세션의 `agentHarnessId`는 경로/인증 준비가 아직 진행 중인 동안에도
네이티브 트랜스크립트의 소유권을 유지합니다. 어느 쪽도 호환되지 않는
경로를 호환 가능하게 만들지는 않습니다. 준비된 정보가 존재하면 선택되거나
고정된 하네스가 이를 지원해야 하며, 그렇지 않으면 실행이 실패하도록
차단됩니다. `/status`는 정책, 지속된 소유권 및 경로 지원을 바탕으로 선택된
유효 런타임을 표시합니다.
준비 상태는 명시적입니다. `runtimePolicy`가 없으면 우연히 존재하는 전송
필드에서 추론하지 않고 선언되지 않은 상태로 유지됩니다.
하네스 소유 인증에서 여러 물리적 경로가 확인되지 않은 채 남아 있으면,
준비된 지원 정보는 해당 경로들의 호환 가능한 런타임 ID의 교집합이며,
후보 중 하나라도 요청 재정의를 보유하면 이를 보고합니다. 따라서 선언되지
않은 후보가 하나라도 있으면 네이티브 호환성은 비게 됩니다.
`preparedAuth.source: "harness"`는 인증 소유자를 나타내며, 경로 지원을
추론할 권한이 아닙니다.

선택된 하네스가 예상과 다르면 `agents/harness` 디버그 로깅을 활성화하고
Gateway의 구조화된 `agent harness selected` 레코드를 확인하십시오. 여기에는
선택된 하네스 ID, 선택 이유, 런타임/대체 정책이 포함되며, `auto` 모드에서는
각 Plugin 후보의 지원 결과도 포함됩니다.

번들 Codex Plugin은 `codex`를 하네스 ID로 등록합니다. 코어는 이를 일반적인
Plugin 하네스 ID로 취급합니다. Codex 전용 별칭은 공유 런타임 선택기가 아니라
Plugin 또는 운영자 구성에 속합니다.

## 공급자와 하네스 페어링

대부분의 하네스는 공급자도 등록해야 합니다. 공급자는 모델 참조,
인증 상태, 모델 메타데이터 및 `/model` 선택을 OpenClaw의 나머지 부분에
표시합니다. 그런 다음 하네스가 `supports(...)`에서 해당 공급자를 인수합니다.

번들 Codex Plugin은 다음 패턴을 따릅니다.

- 권장 사용자 모델 참조: `openai/gpt-5.6-sol`
- 호환성 참조: 레거시 `codex/gpt-*` 참조는 계속 허용되지만, 새
  구성에서는 이를 일반적인 공급자/모델 참조로 사용하지 않아야 합니다.
- 하네스 ID: `codex`
- 인증: Codex 하네스가 네이티브 Codex 로그인/세션을 소유하므로 합성 공급자 가용성을 사용합니다.
- 앱 서버 요청: OpenClaw는 기본 모델 ID만 Codex에 전송하고 하네스가
  네이티브 앱 서버 프로토콜과 통신하도록 합니다.

Codex Plugin은 추가 방식으로 작동합니다. 런타임 정책이 설정되지 않았거나
`auto`인 경우 OpenAI는 공급자 소유 경로 계약이 `codex` 호환성을 선언할
때만 Codex를 선택할 수 있습니다. 즉, 작성된 요청 재정의가 없는 정확한 공식
HTTPS Platform Responses 또는 ChatGPT Responses 경로여야 합니다.
`openai/*` 접두사만으로는 Codex를 선택하지 않습니다. 사용자 지정 엔드포인트,
Completions 어댑터 및 작성된 요청 동작은 OpenClaw에서 계속 처리됩니다.
공식 일반 텍스트 HTTP 엔드포인트는 거부됩니다. 이전 `codex/gpt-*`
참조는 호환성 입력으로 계속 허용됩니다. [OpenAI 암시적 에이전트 런타임](/ko/providers/openai#implicit-agent-runtime)을 참조하십시오.

운영자 설정, 모델 접두사 예제 및 Codex 전용 구성은
[Codex 하네스](/ko/plugins/codex-harness)를 참조하십시오.

Codex Plugin은 [Codex 하네스](/ko/plugins/codex-harness)에 문서화된 최소
앱 서버 버전을 적용합니다. 초기화 핸드셰이크를 검사하고 이전 버전 또는
버전 정보가 없는 서버를 차단하므로 OpenClaw는 테스트된 프로토콜 표면에서만
실행됩니다.

### 도구 결과 미들웨어

일치하는 매니페스트 계약을 갖춘 번들 Plugin과 명시적으로 활성화된 설치
Plugin은 매니페스트의 `contracts.agentToolResultMiddleware`에 대상 런타임
ID를 선언한 경우 `api.registerAgentToolResultMiddleware(...)`를 통해
런타임 중립적인 도구 결과 미들웨어를 연결할 수 있습니다. 이 신뢰할 수 있는
접점은 OpenClaw 또는 Codex가 도구 출력을 모델에 다시 제공하기 전에 실행해야
하는 비동기 도구 결과 변환용입니다.

레거시 번들 Plugin은 Codex 앱 서버 전용 미들웨어에
`api.registerCodexAppServerExtensionFactory(...)`를 계속 사용할 수 있지만,
새로운 결과 변환에는 런타임 중립 API를 사용해야 합니다. 임베디드 실행기
전용 `api.registerEmbeddedExtensionFactory(...)` 훅은 제거되었습니다.
임베디드 도구 결과 변환은 런타임 중립 미들웨어를 사용해야 합니다.

### 터미널 결과 분류

자체 프로토콜 프로젝션을 소유하는 네이티브 하네스는 완료된 턴에서 표시할 어시스턴트 텍스트가 생성되지 않았을 때
`openclaw/plugin-sdk/agent-harness-runtime`의
`classifyAgentHarnessTerminalOutcome(...)`을 사용할 수 있습니다. 이 헬퍼는
`empty`, `reasoning-only`, 또는 `planning-only`를 반환하므로 OpenClaw의 폴백 정책이
다른 모델로 재시도할지 결정할 수 있습니다. `planning-only`에는 하네스의 명시적
`planText` 필드가 필요하며, OpenClaw는 어시스턴트 산문에서 이를 추론하지 않습니다. 이 헬퍼는
프롬프트 오류, 진행 중인 턴, `NO_REPLY`와 같은 의도적인 무응답을
의도적으로 분류하지 않습니다.

### 에이전트 종료 부수 효과

네이티브 하네스는 시도를 최종 확정한 후
`openclaw/plugin-sdk/agent-harness-runtime`의
`runAgentEndSideEffects(...)`를 호출해야 합니다. 이 함수는 대화형 응답을 지연시키지 않고
이식 가능한 `agent_end` 훅과 OpenClaw의 연구 캡처를 디스패치합니다.
해당 부수 효과가 완료될 때까지 시도가 완료되어서는 안 되는 로컬 비대화형 실행에는
`awaitAgentEndSideEffects(...)`를 사용하십시오. 두 헬퍼 모두
`runAgentHarnessAgentEndHook(...)`과 동일한 `{ event, ctx }` 페이로드를 받으며,
실패하더라도 완료된 시도의 결과는 변경되지 않습니다.

### 사용자 입력 및 도구 표면

런타임 수준의 사용자 입력 요청을 노출하는 네이티브 하네스는
`openclaw/plugin-sdk/agent-harness-runtime`의 사용자 입력 헬퍼를 사용하여
프롬프트를 구성하고, OpenClaw의 차단형 응답 경로를 통해 전달하고,
선택형/자유 형식 응답을 런타임의 네이티브 응답 형태로 다시 정규화해야 합니다.
각 하네스가 자체 프로토콜 파싱과 대기 중인 요청의 수명 주기를 유지하는 동안,
이 헬퍼는 채널/TUI 표시를 일관되게 유지합니다.

Pi와 유사한 간결한 도구 라우팅이 필요한 네이티브 하네스는
`openclaw/plugin-sdk/agent-harness-tool-runtime`의
`createAgentHarnessToolSurfaceRuntime(...)`을 사용해야 합니다. 이 함수는
도구 검색/코드 모드 제어 선택, 로컬 모델용 경량 기본값,
런타임 호환 스키마 필터링, 숨겨진 카탈로그 실행, 디렉터리
하이드레이션 및 카탈로그 정리를 담당합니다. 하네스는 계속해서 자체 SDK별 도구
변환과 네이티브 실행 콜백을 소유합니다.

### 네이티브 Codex 하네스 모드

번들 `codex` 하네스는 임베디드 OpenClaw
에이전트 턴을 위한 네이티브 Codex 모드입니다. 먼저 번들 `codex` Plugin을 활성화하고,
구성에서 제한적 허용 목록을 사용하는 경우 `plugins.allow`에 `codex`를 포함하십시오. 네이티브 앱 서버
구성은 `openai/gpt-*`를 사용해야 합니다. OpenAI 에이전트 턴은 유효 경로가
Codex 호환성을 선언한 경우에만 Codex 하네스를 선택합니다. 레거시 Codex 모델
참조는 `openclaw doctor --fix`로 수정해야 하며, 레거시 `codex/*`
모델 참조는 네이티브 하네스의 호환성 별칭으로 유지됩니다.

이 모드가 실행되면 Codex가 네이티브 스레드 ID, 재개 동작,
Compaction 및 앱 서버 실행을 소유합니다. OpenClaw는 계속해서 채팅 채널,
표시되는 트랜스크립트 미러, 도구 정책, 승인, 미디어 전달 및 세션
선택을 소유합니다. Codex 앱 서버 경로만 실행을 점유할 수 있음을
입증해야 하는 경우 공급자/모델의 `agentRuntime.id: "codex"`를 사용하십시오. 명시적 Plugin
런타임은 안전하게 실패하며, Codex 앱 서버 선택 실패와 런타임 실패는
다른 런타임을 통해 재시도되지 않습니다.

## 런타임 엄격성

기본적으로 OpenClaw는 `auto` 공급자/모델 런타임 정책을 사용합니다. 등록된
Plugin 하네스가 호환되는 유효 경로를 점유할 수 있으며, 일치하는 하네스가 없으면 임베디드
런타임이 턴을 처리합니다. 공급자/모델 접두사만으로는 하네스가 선택되지 않습니다.
하네스 선택이 누락되었을 때 임베디드 런타임으로 라우팅하는 대신 실패하게 하려면
`agentRuntime.id: "codex"`와 같은 명시적 공급자/모델 Plugin 런타임을 사용하십시오.
명시적 선택으로 비호환 경로가 호환되지는 않습니다. 선택된 Plugin 하네스가 실패하면
항상 즉시 실패합니다. 이는 명시적 공급자/모델
`agentRuntime.id: "openclaw"`를 차단하지 않습니다.

Codex 전용 임베디드 실행의 경우:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

하나의 표준 모델에 CLI 백엔드를 사용하려면 해당
모델 항목에 런타임을 지정하십시오.

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

에이전트별 재정의도 동일한 모델 범위 형태를 사용합니다.

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

다음과 같은 레거시 전체 에이전트 런타임 예시는 무시됩니다.

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

명시적 Plugin 런타임을 사용하면 요청한 하네스가 등록되지 않았거나,
확정된 공급자/모델을 지원하지 않거나, 턴 부수 효과를 생성하기 전에
실패할 경우 세션이 조기에 실패합니다. 이는 Codex 전용 배포와
Codex 앱 서버 경로가 실제로 사용 중임을 입증해야 하는 라이브 테스트에서 의도된 동작입니다.

이 설정은 임베디드 에이전트 하네스만 제어합니다. 이미지, 동영상,
음악, TTS, PDF 또는 기타 공급자별 모델 라우팅은 비활성화하지 않습니다.

## 네이티브 세션 및 트랜스크립트 미러

하네스는 네이티브 세션 ID, 스레드 ID 또는 데몬 측 재개
토큰을 유지할 수 있습니다. 해당 바인딩을 OpenClaw 세션과 명시적으로 연결하고,
사용자에게 표시되는 어시스턴트/도구 출력을 OpenClaw
트랜스크립트에 계속 미러링하십시오.

OpenClaw 트랜스크립트는 다음을 위한 호환성 계층으로 유지됩니다.

- 채널에 표시되는 세션 기록
- 트랜스크립트 검색 및 인덱싱
- 이후 턴에서 기본 제공 OpenClaw 하네스로 다시 전환
- 일반적인 `/new`, `/reset` 및 세션 삭제 동작

하네스가 사이드카 바인딩을 저장하는 경우 소유 OpenClaw 세션이 재설정될 때
OpenClaw가 이를 지울 수 있도록 `reset(...)`을 구현하십시오.

## 도구 및 미디어 결과

코어는 OpenClaw 도구 목록을 구성하여 준비된
시도에 전달합니다. 하네스가 동적 도구 호출을 실행할 때는 직접 채널 미디어를
전송하지 말고 하네스 결과 형태를 통해 도구 결과를 반환하십시오.

이를 통해 텍스트, 이미지, 동영상, 음악, TTS, 승인 및 메시징 도구
출력이 OpenClaw 기반 실행과 동일한 전달 경로를 사용합니다.

## 현재 제한 사항

- 공개 임포트 경로는 범용적이지만 일부 시도/결과 타입 별칭에는
  호환성을 위해 여전히 레거시 이름이 사용됩니다.
- 서드 파티 하네스 설치는 실험적입니다. 네이티브 세션 런타임이
  필요해질 때까지 공급자 Plugin을 우선 사용하십시오.
- 턴 간 하네스 전환은 지원됩니다. 네이티브 도구, 승인,
  어시스턴트 텍스트 또는 메시지 전송이 시작된 후에는 턴 도중 하네스를 전환하지 마십시오.

## 관련 문서

- [SDK 개요](/ko/plugins/sdk-overview)
- [런타임 헬퍼](/ko/plugins/sdk-runtime)
- [공급자 Plugin](/ko/plugins/sdk-provider-plugins)
- [Codex 하네스](/ko/plugins/codex-harness)
- [모델 공급자](/ko/concepts/model-providers)
