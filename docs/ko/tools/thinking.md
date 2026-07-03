---
read_when:
    - 사고, 빠른 모드 또는 자세한 지시문 파싱이나 기본값 조정
summary: /think, /fast, /verbose, /trace 및 추론 가시성을 위한 지시문 구문
title: 사고 수준
x-i18n:
    generated_at: "2026-07-03T09:30:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## 수행하는 작업

- 모든 수신 본문 안의 인라인 지시어: `/t <level>`, `/think:<level>` 또는 `/thinking <level>`.
- 수준(별칭): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "생각"
  - low → "깊게 생각"
  - medium → "더 깊게 생각"
  - high → "초고강도 사고" (최대 예산)
  - xhigh → "초고강도 사고+" (GPT-5.2+ 및 Codex 모델, Anthropic Claude Opus 4.7+ effort 포함)
  - adaptive → 공급자 관리형 적응형 사고(Anthropic/Bedrock의 Claude 4.6, Anthropic Claude Opus 4.7+, Google Gemini 동적 사고에서 지원)
  - max → 공급자 최대 추론(Anthropic Claude Opus 4.7+; Ollama는 이를 자체 최고 `think` effort에 매핑)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`에 매핑됩니다.
  - `highest`는 `high`에 매핑됩니다.
- 공급자 참고 사항:
  - 사고 메뉴와 선택기는 공급자 프로필에 의해 구동됩니다. 공급자 Plugin은 바이너리 `on` 같은 레이블을 포함해 선택된 모델의 정확한 수준 집합을 선언합니다.
  - `adaptive`, `xhigh`, `max`는 이를 지원하는 공급자/모델 프로필에만 표시됩니다. 지원되지 않는 수준을 입력한 지시어는 해당 모델의 유효한 옵션과 함께 거부됩니다.
  - 기존에 저장된 지원되지 않는 수준은 공급자 프로필 순위에 따라 다시 매핑됩니다. 비적응형 모델에서 `adaptive`는 `medium`으로 폴백하고, `xhigh`와 `max`는 선택한 모델이 지원하는 `off`가 아닌 가장 큰 수준으로 폴백합니다.
  - Anthropic Claude 4.6 모델은 명시적인 사고 수준이 설정되지 않으면 기본값이 `adaptive`입니다.
  - Anthropic Claude Opus 4.8 및 Opus 4.7은 사고 수준을 명시적으로 설정하지 않는 한 사고를 꺼 둡니다. Opus 4.8의 공급자 소유 effort 기본값은 적응형 사고가 활성화된 뒤 `high`입니다.
  - Anthropic Claude Opus 4.7+는 `/think xhigh`를 적응형 사고와 `output_config.effort: "xhigh"`에 매핑합니다. `/think`는 사고 지시어이고 `xhigh`는 Opus effort 설정이기 때문입니다.
  - Anthropic Claude Opus 4.7+는 `/think max`도 노출하며, 동일한 공급자 소유 최대 effort 경로에 매핑됩니다.
  - 직접 DeepSeek V4 모델은 `/think xhigh|max`를 노출합니다. 둘 다 DeepSeek `reasoning_effort: "max"`에 매핑되고, 더 낮은 비-`off` 수준은 `high`에 매핑됩니다.
  - OpenRouter를 통해 라우팅된 DeepSeek V4 모델은 `/think xhigh`를 노출하며 DeepSeek 네이티브 최상위 `reasoning_effort` 대신 OpenRouter가 지원하는 `reasoning.effort` 값을 보냅니다. 더 낮은 비-`off` 수준은 `high`에 매핑되고, 저장된 `max` 오버라이드는 `xhigh`로 폴백합니다.
  - 사고 가능 Ollama 모델은 `/think low|medium|high|max`를 노출합니다. Ollama의 네이티브 API가 `low`, `medium`, `high` effort 문자열을 허용하므로 `max`는 네이티브 `think: "high"`에 매핑됩니다.
  - OpenAI GPT 모델은 모델별 Responses API effort 지원을 통해 `/think`를 매핑합니다. `/think off`는 대상 모델이 이를 지원할 때만 `reasoning.effort: "none"`을 보내며, 그렇지 않으면 OpenClaw는 지원되지 않는 값을 보내는 대신 비활성화된 추론 페이로드를 생략합니다.
  - 사용자 지정 OpenAI 호환 카탈로그 항목은 `models.providers.<provider>.models[].compat.supportedReasoningEfforts`에 `"xhigh"`를 포함하도록 설정해 `/think xhigh`를 사용할 수 있습니다. 이는 아웃바운드 OpenAI 추론 effort 페이로드를 매핑하는 것과 동일한 호환성 메타데이터를 사용하므로 메뉴, 세션 검증, 에이전트 CLI, `llm-task`가 전송 동작과 일치합니다.
  - 오래된 구성의 OpenRouter Hunter Alpha 참조는 해당 폐기된 경로가 reasoning 필드를 통해 최종 답변 텍스트를 반환할 수 있었기 때문에 프록시 추론 주입을 건너뜁니다.
  - Google Gemini는 `/think adaptive`를 Gemini의 공급자 소유 동적 사고에 매핑합니다. Gemini 3 요청은 고정 `thinkingLevel`을 생략하고, Gemini 2.5 요청은 `thinkingBudget: -1`을 보냅니다. 고정 수준은 여전히 해당 모델 제품군에 가장 가까운 Gemini `thinkingLevel` 또는 예산에 매핑됩니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax M2.x(`minimax/MiniMax-M2*`)는 모델 매개변수 또는 요청 매개변수에서 사고를 명시적으로 설정하지 않는 한 기본값이 `thinking: { type: "disabled" }`입니다. 이는 M2.x의 비네이티브 Anthropic 스트림 형식에서 `reasoning_content` 델타가 유출되는 것을 방지합니다. MiniMax-M3(및 M3.x)는 예외입니다. M3는 올바른 Anthropic thinking 블록을 내보내고 사고가 비활성화되면 빈 콘텐츠를 반환하므로 OpenClaw는 M3를 공급자의 생략/적응형 사고 경로에 둡니다.
  - Z.AI(`zai/*`)는 대부분의 GLM 모델에서 바이너리(`on`/`off`)입니다. GLM-5.2는 예외입니다. `/think off|low|high|max`를 노출하고, `low`와 `high`를 Z.AI `reasoning_effort: "high"`에 매핑하며, `max`를 `reasoning_effort: "max"`에 매핑합니다.
  - Moonshot Kimi K2.7 Code(`moonshot/kimi-k2.7-code`)는 항상 사고합니다. 해당 프로필은 `on`만 노출하며, OpenClaw는 Moonshot이 요구하는 대로 아웃바운드 `thinking` 필드를 생략합니다. 다른 `moonshot/*` 모델은 `/think off`를 `thinking: { type: "disabled" }`에, 비-`off` 수준을 `thinking: { type: "enabled" }`에 매핑합니다. 사고가 활성화되면 Moonshot은 `tool_choice` `auto|none`만 허용합니다. OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 해결 순서

1. 메시지의 인라인 지시어(해당 메시지에만 적용).
2. 세션 오버라이드(지시어만 포함한 메시지를 보내 설정).
3. 에이전트별 기본값(구성의 `agents.list[].thinkingDefault`).
4. 전역 기본값(구성의 `agents.defaults.thinkingDefault`).
5. 폴백: 사용 가능한 경우 공급자가 선언한 기본값. 그렇지 않으면 추론 가능 모델은 `medium` 또는 해당 모델에서 지원되는 가장 가까운 비-`off` 수준으로 해결되고, 추론 불가능 모델은 `off`로 유지됩니다.

## 세션 기본값 설정

- 지시어**만** 포함한 메시지를 보내세요(공백 허용). 예: `/think:medium` 또는 `/t high`.
- 이 설정은 현재 세션에 적용됩니다(기본적으로 발신자별). `/think default`를 사용해 세션 오버라이드를 지우고 구성/공급자 기본값을 상속하세요. 별칭에는 `inherit`, `clear`, `reset`, `unpin`이 포함됩니다.
- `/think off`는 명시적인 끄기 오버라이드를 저장합니다. 세션 오버라이드를 변경하거나 지울 때까지 사고를 비활성화합니다.
- 확인 응답이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 수준이 유효하지 않으면(예: `/thinking big`) 명령이 힌트와 함께 거부되고 세션 상태는 변경되지 않습니다.
- 현재 사고 수준을 보려면 인수 없이 `/think`(또는 `/think:`)를 보내세요.

## 에이전트별 적용

- **임베디드 OpenClaw**: 해결된 수준이 프로세스 내 OpenClaw 에이전트 런타임에 전달됩니다.
- **Claude CLI 백엔드**: `claude-cli`를 사용할 때 비-끄기 수준은 Claude Code에 `--effort`로 전달됩니다. [CLI 백엔드](/ko/gateway/cli-backends)를 참조하세요.

## 빠른 모드(/fast)

- 수준: `auto|on|off|default`.
- 지시어만 포함한 메시지는 세션 빠른 모드 오버라이드를 전환하고 `Fast mode set to auto.`, `Fast mode enabled.`, 또는 `Fast mode disabled.`로 응답합니다. `/fast default`를 사용해 세션 오버라이드를 지우고 구성된 기본값을 상속하세요. 별칭에는 `inherit`, `clear`, `reset`, `unpin`이 포함됩니다.
- 현재 유효한 빠른 모드 상태를 보려면 모드 없이 `/fast`(또는 `/fast status`)를 보내세요.
- OpenClaw는 다음 순서로 빠른 모드를 해결합니다.
  1. 인라인/지시어 전용 `/fast auto|on|off` 오버라이드(`/fast default`는 이 계층을 지움)
  2. 세션 오버라이드
  3. 에이전트별 기본값(`agents.list[].fastModeDefault`)
  4. 모델별 구성: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 폴백: `off`
- `auto`는 세션/구성 모드를 auto로 유지하지만 각 새 모델 호출을 독립적으로 해결합니다. 자동 컷오프 전에 시작한 호출은 빠른 모드가 활성화되고, 이후 재시도, 폴백, 도구 결과 또는 이어가기 호출은 빠른 모드가 비활성화된 상태로 시작합니다. 컷오프 기본값은 60초입니다. 변경하려면 활성 모델에 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`를 설정하세요.
- `openai/*`의 경우 빠른 모드는 지원되는 Responses 요청에서 `service_tier=priority`를 보내 OpenAI 우선 처리에 매핑됩니다.
- Codex 기반 `openai/*` / `openai-codex/*` 모델의 경우 빠른 모드는 Codex Responses에 동일한 `service_tier=priority` 플래그를 보냅니다. 네이티브 Codex 앱 서버 턴은 `turn/start` 또는 스레드 시작/재개에서만 tier를 받으므로, `auto`는 이미 실행 중인 앱 서버 턴의 tier를 다시 지정할 수 없습니다. OpenClaw가 시작하는 다음 모델 턴에 적용됩니다.
- OAuth 인증 트래픽이 `api.anthropic.com`으로 전송되는 경우를 포함해 직접 공개 `anthropic/*` 요청의 경우 빠른 모드는 Anthropic 서비스 tier에 매핑됩니다. `/fast on`은 `service_tier=auto`를 설정하고, `/fast off`는 `service_tier=standard_only`를 설정합니다.
- Anthropic 호환 경로의 `minimax/*`의 경우 `/fast on`(또는 `params.fastMode: true`)은 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
- 명시적 Anthropic `serviceTier` / `service_tier` 모델 매개변수는 둘 다 설정된 경우 빠른 모드 기본값을 오버라이드합니다. OpenClaw는 여전히 비-Anthropic 프록시 기준 URL에 대해서는 Anthropic 서비스 tier 주입을 건너뜁니다.
- `/status`는 빠른 모드가 활성화되면 `Fast`를 표시하고, 구성된 모드가 auto이면 `Fast:auto`를 표시합니다.

## 자세한 지시어(/verbose 또는 /v)

- 수준: `on`(최소) | `full` | `off`(기본값).
- 지시어만 포함한 메시지는 세션 자세한 로깅을 전환하고 `Verbose logging enabled.` / `Verbose logging disabled.`로 응답합니다. 유효하지 않은 수준은 상태를 변경하지 않고 힌트를 반환합니다.
- `/verbose off`는 명시적인 세션 오버라이드를 저장합니다. Sessions UI에서 `inherit`을 선택해 지우세요.
- 권한이 있는 외부 채널 발신자는 세션 자세한 로깅 오버라이드를 유지할 수 있습니다. 내부 Gateway/웹챗 클라이언트는 이를 유지하려면 `operator.admin`이 필요합니다.
- 인라인 지시어는 해당 메시지에만 영향을 줍니다. 그렇지 않으면 세션/전역 기본값이 적용됩니다.
- 현재 자세한 수준을 보려면 인수 없이 `/verbose`(또는 `/verbose:`)를 보내세요.
- 자세한 로깅이 켜져 있으면 구조화된 도구 결과를 내보내는 에이전트는 사용 가능한 경우 `<emoji> <tool-name>: <arg>` 접두사가 붙은 각 도구 호출을 자체 메타데이터 전용 메시지로 다시 보냅니다. 이러한 도구 요약은 각 도구가 시작되는 즉시(별도 말풍선) 전송되며, 스트리밍 델타로 전송되지 않습니다.
- 도구 실패 요약은 일반 모드에서도 계속 표시되지만, 원시 오류 세부 정보 접미사는 자세한 수준이 `full`이 아닌 한 숨겨집니다.
- 자세한 수준이 `full`이면 도구 출력도 완료 후 전달됩니다(별도 말풍선, 안전한 길이로 잘림). 실행 중에 `/verbose on|full|off`를 전환하면 이후 도구 말풍선은 새 설정을 따릅니다.
- `agents.defaults.toolProgressDetail`은 `/verbose` 도구 요약과 진행 초안 도구 줄의 형태를 제어합니다. `🛠️ Exec: checking JS syntax` 같은 간결한 사람이 읽는 레이블에는 `"explain"`(기본값)을 사용하고, 디버깅을 위해 원시 명령/세부 정보도 덧붙이고 싶으면 `"raw"`를 사용하세요. 에이전트별 `agents.list[].toolProgressDetail`은 기본값을 오버라이드합니다.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin 추적 지시어(/trace)

- 수준: `on` | `off`(기본값).
- 지시어만 포함한 메시지는 세션 Plugin 추적 출력을 전환하고 `Plugin trace enabled.` / `Plugin trace disabled.`로 응답합니다.
- 인라인 지시어는 해당 메시지에만 영향을 줍니다. 그렇지 않으면 세션/전역 기본값이 적용됩니다.
- 현재 추적 수준을 보려면 인수 없이 `/trace`(또는 `/trace:`)를 보내세요.
- `/trace`는 `/verbose`보다 범위가 좁습니다. Active Memory 디버그 요약 같은 Plugin 소유 추적/디버그 줄만 노출합니다.
- 추적 줄은 `/status`에 나타날 수 있으며, 일반 어시스턴트 응답 뒤 후속 진단 메시지로 나타날 수 있습니다.

## 추론 표시 여부(/reasoning)

- 수준: `on|off|stream`.
- 지시어만 포함한 메시지는 thinking 블록을 응답에 표시할지 전환합니다.
- 활성화되면 추론은 `Thinking` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream`: 활성 채널이 추론 미리보기를 지원할 때 응답 생성 중 추론을 스트리밍한 다음, 추론 없이 최종 답변을 보냅니다.
- 별칭: `/reason`.
- 현재 추론 수준을 보려면 인수 없이 `/reasoning`(또는 `/reasoning:`)을 보내세요.
- 해결 순서: 인라인 지시어, 세션 오버라이드, 에이전트별 기본값(`agents.list[].reasoningDefault`), 전역 기본값(`agents.defaults.reasoningDefault`), 폴백(`off`).

잘못된 로컬 모델 추론 태그는 보수적으로 처리됩니다. 닫힌 `<think>...</think>` 블록은 일반 응답에서 숨겨진 상태로 유지되며, 이미 보이는 텍스트 뒤에 닫히지 않은 추론도 숨겨집니다. 응답이 닫히지 않은 단일 여는 태그로 완전히 감싸져 있고 그렇지 않으면 빈 텍스트로 전달될 경우, OpenClaw는 잘못된 여는 태그를 제거하고 남은 텍스트를 전달합니다.

## 관련 항목

- 권한 상승 모드 문서는 [권한 상승 모드](/ko/tools/elevated)에 있습니다.

## Heartbeats

- Heartbeat 프로브 본문은 구성된 Heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat 메시지의 인라인 지시문은 평소처럼 적용됩니다(하지만 Heartbeat에서 세션 기본값을 변경하지 않는 것이 좋습니다).
- Heartbeat 전달은 기본적으로 최종 페이로드만 사용합니다. 별도의 `Thinking` 메시지도 전송하려면(사용 가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true`를 설정합니다.

## 웹 채팅 UI

- 페이지가 로드될 때 웹 채팅 추론 선택기는 인바운드 세션 저장소/구성에서 세션에 저장된 수준을 반영합니다.
- 다른 수준을 선택하면 `sessions.patch`를 통해 세션 재정의가 즉시 기록됩니다. 다음 전송을 기다리지 않으며 일회성 `thinkingOnce` 재정의가 아닙니다.
- 첫 번째 옵션은 항상 재정의 해제 선택지입니다. 상속된 추론이 비활성화된 경우 `Inherited: Off`를 포함해 `Inherited: <resolved level>`로 표시됩니다.
- 명시적인 선택기 선택지는 직접 수준 레이블을 사용하며, 제공자 레이블이 있는 경우 이를 보존합니다(예: 제공자 레이블이 지정된 `max` 옵션의 `Maximum`).
- 선택기는 Gateway 세션 행/기본값에서 반환된 `thinkingLevels`를 사용하며, `thinkingOptions`는 레거시 레이블 목록으로 유지됩니다. 브라우저 UI는 자체 제공자 정규식 목록을 유지하지 않습니다. plugins가 모델별 수준 집합을 소유합니다.
- `/think:<level>`은 여전히 작동하며 동일하게 저장된 세션 수준을 업데이트하므로, 채팅 지시문과 선택기는 동기화된 상태를 유지합니다.

## 제공자 프로필

- 제공자 plugins는 모델의 지원 수준과 기본값을 정의하기 위해 `resolveThinkingProfile(ctx)`를 노출할 수 있습니다.
- Claude 모델을 프록시하는 제공자 plugins는 직접 Anthropic 카탈로그와 프록시 카탈로그가 정렬된 상태를 유지하도록 `openclaw/plugin-sdk/provider-model-shared`의 `resolveClaudeThinkingProfile(modelId)`를 재사용해야 합니다.
- 각 프로필 수준에는 저장되는 정규 `id`(`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` 또는 `max`)가 있으며, 표시용 `label`을 포함할 수 있습니다. 이진 제공자는 `{ id: "low", label: "on" }`을 사용합니다.
- 프로필 훅은 사용 가능한 경우 `reasoning`, `compat.thinkingFormat`, `compat.supportedReasoningEfforts`를 포함한 병합된 카탈로그 사실을 받습니다. 구성된 요청 계약이 일치하는 페이로드를 지원할 때만 이러한 사실을 사용해 이진 또는 사용자 지정 프로필을 노출합니다.
- 명시적인 추론 재정의를 검증해야 하는 도구 plugins는 `api.runtime.agent.resolveThinkingPolicy({ provider, model })`와 `api.runtime.agent.normalizeThinkingLevel(...)`를 사용해야 합니다. 자체 제공자/모델 수준 목록을 유지해서는 안 됩니다.
- 구성된 사용자 지정 모델 메타데이터에 접근할 수 있는 도구 plugins는 `catalog`를 `resolveThinkingPolicy`에 전달하여 `compat.supportedReasoningEfforts` 옵트인이 plugin 측 검증에 반영되도록 할 수 있습니다.
- 게시된 레거시 훅(`supportsXHighThinking`, `isBinaryThinking`, `resolveDefaultThinkingLevel`)은 호환성 어댑터로 유지되지만, 새로운 사용자 지정 수준 집합은 `resolveThinkingProfile`을 사용해야 합니다.
- Gateway 행/기본값은 `thinkingLevels`, `thinkingOptions`, `thinkingDefault`를 노출하여 ACP/채팅 클라이언트가 런타임 검증에서 사용하는 것과 동일한 프로필 ID와 레이블을 렌더링하도록 합니다.
