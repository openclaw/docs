---
read_when:
    - 사고 수준, 고속 모드 또는 상세 출력 지시문의 구문 분석이나 기본값 조정
summary: /think, /fast, /verbose, /trace 및 추론 표시 여부를 위한 지시문 구문
title: 사고 수준
x-i18n:
    generated_at: "2026-07-12T01:22:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## 기능

- 모든 인바운드 본문에서 사용할 수 있는 인라인 지시문: `/t <level>`, `/think:<level>` 또는 `/thinking <level>`.
- 수준(별칭): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`. Anthropic의 고전적인 "think" < "think hard" < "think harder" < "ultrathink" 마법 단어 단계를 대략적으로 반영합니다.
  - minimal ~ "생각"
  - low ~ "깊이 생각"
  - medium ~ "더 깊이 생각"
  - high ~ "최대한 깊이 생각"(최대 예산)
  - xhigh ~ "최대한 깊이 생각+"(GPT-5.2+ 및 Codex 모델과 Anthropic Claude Opus 4.7+의 노력 수준)
  - adaptive → 공급자가 관리하는 적응형 사고(Anthropic/Bedrock의 Claude 4.6, Anthropic Claude Opus 4.7+, Google Gemini 동적 사고에서 지원)
  - max → 공급자 최대 추론(Anthropic Claude Opus 4.7+; Ollama에서는 이를 가장 높은 네이티브 `think` 노력 수준에 매핑)
  - ultra → 선택한 모델/런타임에서 지원하는 경우 공급자 최대 추론과 선제적 하위 에이전트 오케스트레이션을 함께 사용
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`에 매핑됩니다.
  - `highest`는 `high`에 매핑됩니다.
- 공급자 참고 사항:
  - 사고 메뉴와 선택기는 공급자 프로필을 기반으로 합니다. 공급자 Plugin은 바이너리 `on` 같은 레이블을 포함하여 선택한 모델에서 지원하는 정확한 수준 집합을 선언합니다.
  - `adaptive`, `xhigh`, `max`, `ultra`는 이를 지원하는 공급자/모델/런타임 프로필에서만 표시됩니다. 지원되지 않는 수준을 입력한 지시문은 해당 모델의 유효한 옵션과 함께 거부됩니다.
  - 저장된 기존의 미지원 수준은 공급자 프로필 순위에 따라 다시 매핑됩니다. `adaptive`는 비적응형 모델에서 `medium`으로 대체되며, `xhigh`와 `max`는 선택한 모델이 지원하는 `off` 이외의 가장 높은 수준으로 대체됩니다.
  - 명시적인 사고 수준이 설정되지 않은 경우 Anthropic Claude 4.6 모델의 기본값은 `adaptive`입니다.
  - Anthropic Claude Opus 4.8과 Opus 4.7은 사고 수준을 명시적으로 설정하지 않으면 사고를 끈 상태로 유지합니다. 적응형 사고가 활성화된 후 Opus 4.8의 공급자 소유 노력 수준 기본값은 `high`입니다.
  - Anthropic Claude Opus 4.7+는 `/think xhigh`를 적응형 사고와 `output_config.effort: "xhigh"`의 조합에 매핑합니다. `/think`는 사고 지시문이고 `xhigh`는 Opus 노력 수준 설정이기 때문입니다.
  - Anthropic Claude Opus 4.7+는 `/think max`도 제공합니다. 이는 동일한 공급자 소유 최대 노력 수준 경로에 매핑됩니다.
  - 직접 연결된 DeepSeek V4 모델은 `/think xhigh|max`를 제공합니다. 두 수준 모두 DeepSeek `reasoning_effort: "max"`에 매핑되며, 그보다 낮은 `off` 이외의 수준은 `high`에 매핑됩니다.
  - OpenRouter를 통해 라우팅되는 DeepSeek V4 모델은 `/think xhigh`를 제공하며, DeepSeek 네이티브 최상위 `reasoning_effort` 대신 OpenRouter에서 지원하는 `reasoning.effort` 값을 전송합니다. 그보다 낮은 `off` 이외의 수준은 `high`에 매핑되고, 저장된 `max` 재정의는 `xhigh`로 대체됩니다.
  - 사고를 지원하는 Ollama 모델은 `/think low|medium|high|max`를 제공합니다. Ollama의 네이티브 API가 `low`, `medium`, `high` 노력 수준 문자열을 허용하므로 `max`는 네이티브 `think: "high"`에 매핑됩니다.
  - OpenAI GPT 모델은 모델별 Responses API 노력 수준 지원에 따라 `/think`를 매핑합니다. 대상 모델이 지원하는 경우에만 `/think off`가 `reasoning.effort: "none"`을 전송하며, 그렇지 않으면 OpenClaw는 지원되지 않는 값을 보내는 대신 비활성화된 추론 페이로드를 생략합니다.
  - GPT-5.6 Sol과 Terra는 Codex 런타임을 통해 네이티브 `/think ultra`를 제공합니다. GPT-5.6 Luna는 Codex 카탈로그에서 Ultra를 명시하지 않으므로 `max`까지의 수준을 제공합니다.
  - 내장 OpenClaw 런타임은 GPT-5.6 Sol, Terra, Luna에 논리적 `/think ultra`를 제공합니다. 공급자 최대 노력 수준을 전송하고 실행 범위의 선제적 하위 에이전트 오케스트레이션 지침을 추가합니다.
  - 사용자 지정 OpenAI 호환 카탈로그 항목은 `models.providers.<provider>.models[].compat.supportedReasoningEfforts`에 `"xhigh"`를 포함하도록 설정하여 `/think xhigh`를 활성화할 수 있습니다. 이는 아웃바운드 OpenAI 추론 노력 수준 페이로드를 매핑하는 것과 동일한 호환성 메타데이터를 사용하므로 메뉴, 세션 검증, 에이전트 CLI, `llm-task`의 동작이 전송 계층 동작과 일치합니다.
  - 오래된 OpenRouter Hunter Alpha 구성 참조에서는 프록시 추론 주입을 건너뜁니다. 사용 중단된 해당 경로가 추론 필드를 통해 최종 답변 텍스트를 반환할 수 있기 때문입니다.
  - Google Gemini는 `/think adaptive`를 Gemini의 공급자 소유 동적 사고에 매핑합니다. Gemini 3 요청은 고정 `thinkingLevel`을 생략하며, Gemini 2.5 요청은 `thinkingBudget: -1`을 전송합니다. 고정 수준은 해당 모델 계열에서 가장 가까운 Gemini `thinkingLevel` 또는 예산에 계속 매핑됩니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax M2.x(`minimax/MiniMax-M2*`)는 모델 매개변수나 요청 매개변수에서 사고를 명시적으로 설정하지 않는 한 기본적으로 `thinking: { type: "disabled" }`를 사용합니다. 이렇게 하면 M2.x의 비네이티브 Anthropic 스트림 형식에서 `reasoning_content` 델타가 누출되는 것을 방지할 수 있습니다. MiniMax-M3 및 M3.x는 예외입니다. M3는 올바른 Anthropic 사고 블록을 내보내고 사고가 비활성화되면 빈 콘텐츠를 반환하므로 OpenClaw는 M3에 공급자의 생략형/적응형 사고 경로를 유지합니다.
  - 대부분의 GLM 모델에서 Z.AI(`zai/*`)는 바이너리(`on`/`off`) 방식입니다. GLM-5.2는 예외로, `/think off|low|high|max`를 제공하고 `low`와 `high`를 Z.AI `reasoning_effort: "high"`에, `max`를 `reasoning_effort: "max"`에 매핑합니다.
  - Moonshot Kimi K2.7 Code(`moonshot/kimi-k2.7-code`)는 항상 사고합니다. 해당 프로필은 `on`만 제공하며, OpenClaw는 Moonshot의 요구 사항에 따라 아웃바운드 `thinking` 필드를 생략합니다. 다른 `moonshot/*` 모델은 `/think off`를 `thinking: { type: "disabled" }`에 매핑하고, `off`가 아닌 모든 수준을 `thinking: { type: "enabled" }`에 매핑합니다. 사고가 활성화되면 Moonshot은 `tool_choice`로 `auto|none`만 허용하므로 OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 결정 순서

1. 메시지의 인라인 지시문(해당 메시지에만 적용).
2. 세션 재정의(지시문만 포함된 메시지를 전송하여 설정).
3. 에이전트별 기본값(구성의 `agents.list[].thinkingDefault`).
4. 전역 기본값(구성의 `agents.defaults.thinkingDefault`).
5. 대체 동작: 가능한 경우 공급자가 선언한 기본값을 사용합니다. 그렇지 않으면 추론 지원 모델은 `medium` 또는 해당 모델이 지원하는 `off` 이외의 가장 가까운 수준으로 결정되고, 추론을 지원하지 않는 모델은 `off` 상태를 유지합니다.

## 세션 기본값 설정

- 지시문**만** 포함된 메시지를 전송합니다(공백 허용). 예: `/think:medium` 또는 `/t high`.
- 이 설정은 현재 세션에서 유지됩니다(기본적으로 발신자별). `/think default`를 사용하면 세션 재정의를 지우고 구성/공급자 기본값을 상속합니다. 별칭으로 `inherit`, `clear`, `reset`, `unpin`을 사용할 수 있습니다.
- `/think off`는 명시적인 끄기 재정의를 저장합니다. 세션 재정의를 변경하거나 지울 때까지 사고를 비활성화합니다.
- 확인 응답이 전송됩니다(`사고 수준을 high로 설정했습니다.` / `사고를 비활성화했습니다.`). 수준이 유효하지 않으면(예: `/thinking big`) 명령은 안내와 함께 거부되며 세션 상태는 변경되지 않습니다.
- 인수 없이 `/think` 또는 `/think:`를 전송하면 현재 사고 수준을 볼 수 있습니다.

## 에이전트별 적용 방식

- **내장 OpenClaw**: 결정된 수준이 프로세스 내 OpenClaw 에이전트 런타임으로 전달됩니다.
- **Claude CLI 백엔드**: `claude-cli`를 사용할 때 구체적인 `off` 이외의 수준은 `--effort`로 Claude Code에 전달됩니다. `adaptive`는 구성된 노력 수준 플래그를 제거하고 실제 노력 수준 결정을 Claude Code의 환경, 설정, 모델 기본값에 위임합니다. [CLI 백엔드](/ko/gateway/cli-backends)를 참조하세요.

## 빠른 모드(/fast)

- 수준: `auto|on|off|default`.
- 지시문만 포함된 메시지는 세션 빠른 모드 재정의를 전환하고 `빠른 모드를 auto로 설정했습니다.`, `빠른 모드를 활성화했습니다.` 또는 `빠른 모드를 비활성화했습니다.`라고 응답합니다. `/fast default`를 사용하면 세션 재정의를 지우고 구성된 기본값을 상속합니다. 별칭으로 `inherit`, `clear`, `reset`, `unpin`을 사용할 수 있습니다.
- 모드 없이 `/fast` 또는 `/fast status`를 전송하면 현재 적용되는 빠른 모드 상태를 볼 수 있습니다.
- OpenClaw는 다음 순서로 빠른 모드를 결정합니다.
  1. 인라인/지시문 전용 `/fast auto|on|off` 재정의(`/fast default`는 이 계층을 지움)
  2. 세션 재정의
  3. 에이전트별 기본값(`agents.list[].fastModeDefault`)
  4. 모델별 구성: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 대체 동작: `off`
- `auto`는 세션/구성 모드를 자동으로 유지하지만 새 모델 호출마다 독립적으로 결정합니다. 자동 전환 제한 시간 전에 시작된 호출은 빠른 모드가 활성화되고, 이후의 재시도, 대체 동작, 도구 결과 또는 연속 호출은 빠른 모드가 비활성화된 상태로 시작됩니다. 제한 시간의 기본값은 60초입니다. 변경하려면 활성 모델에서 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`를 설정하세요.
- `openai/*`에서 빠른 모드는 지원되는 Responses 요청에 `service_tier=priority`를 전송하여 OpenAI 우선 처리에 매핑됩니다.
- Codex 기반 `openai/*` / `openai-codex/*` 모델에서 빠른 모드는 Codex Responses에 동일한 `service_tier=priority` 플래그를 전송합니다. 네이티브 Codex 앱 서버 턴은 `turn/start` 또는 스레드 시작/재개 시에만 티어를 받으므로 `auto`는 이미 실행 중인 앱 서버 턴의 티어를 변경할 수 없으며, OpenClaw가 시작하는 다음 모델 턴부터 적용됩니다.
- OAuth 인증 트래픽을 포함하여 `api.anthropic.com`으로 직접 전송되는 공개 `anthropic/*` 요청에서 빠른 모드는 Anthropic 서비스 티어에 매핑됩니다. `/fast on`은 `service_tier=auto`를 설정하고 `/fast off`는 `service_tier=standard_only`를 설정합니다.
- Anthropic 호환 경로의 `minimax/*`에서 `/fast on` 또는 `params.fastMode: true`는 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 작성합니다.
- 명시적인 Anthropic `serviceTier` / `service_tier` 모델 매개변수가 빠른 모드 기본값과 함께 설정되면 해당 매개변수가 우선합니다. OpenClaw는 Anthropic이 아닌 프록시 기본 URL에 대해서는 Anthropic 서비스 티어 주입을 계속 건너뜁니다.
- 빠른 모드가 활성화되면 `/status`에 `Fast`가 표시되고, 구성된 모드가 자동이면 `Fast:auto`가 표시됩니다.

## 상세 출력 지시문(/verbose 또는 /v)

- 수준: `on`(최소) | `full` | `off`(기본값).
- 지시문만 포함된 메시지는 세션 상세 출력을 전환하고 `상세 로깅을 활성화했습니다.` / `상세 로깅을 비활성화했습니다.`라고 응답합니다. 유효하지 않은 수준은 상태를 변경하지 않고 안내를 반환합니다.
- `/verbose off`는 명시적인 세션 재정의를 저장합니다. Sessions UI에서 `inherit`를 선택하여 지울 수 있습니다.
- 권한이 있는 외부 채널 발신자는 세션 상세 출력 재정의를 영구 저장할 수 있습니다. 내부 Gateway/웹 채팅 클라이언트에서 이를 영구 저장하려면 `operator.admin`이 필요합니다.
- 인라인 지시문은 해당 메시지에만 영향을 미치며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 인수 없이 `/verbose` 또는 `/verbose:`를 전송하면 현재 상세 출력 수준을 볼 수 있습니다.
- 상세 출력이 켜져 있으면 구조화된 도구 결과를 내보내는 에이전트는 각 도구 호출을 별도의 메타데이터 전용 메시지로 다시 전송하며, 가능한 경우 `<emoji> <tool-name>: <arg>` 접두사를 붙입니다. 이러한 도구 요약은 각 도구가 시작되는 즉시 스트리밍 델타가 아닌 별도의 말풍선으로 전송됩니다.
- 도구 실패 요약은 일반 모드에서도 계속 표시되지만, 원시 오류 세부 정보 접미사는 상세 출력이 `full`인 경우에만 표시됩니다.
- 상세 출력이 `full`이면 완료 후 도구 출력도 전달됩니다(별도 말풍선, 안전한 길이로 잘림). 실행 중에 `/verbose on|full|off`를 전환하면 이후 도구 말풍선은 새 설정을 따릅니다.
- `agents.defaults.toolProgressDetail`은 `/verbose` 도구 요약과 진행 상황 초안의 도구 줄 형식을 제어합니다. `🛠️ Exec: JS 구문 확인 중` 같은 간결하고 사람이 읽기 쉬운 레이블을 사용하려면 `"explain"`(기본값)을 사용하고, 디버깅을 위해 원시 명령/세부 정보도 추가하려면 `"raw"`를 사용하세요. 에이전트별 `agents.list[].toolProgressDetail`은 기본값을 재정의합니다.
  - `explain`: `🛠️ Exec: /tmp/app.js의 JS 구문 확인`
  - `raw`: `🛠️ Exec: /tmp/app.js의 JS 구문 확인, node --check /tmp/app.js`

## Plugin 추적 지시문(/trace)

- 수준: `on` | `off`(기본값).
- 지시문만 포함된 메시지는 세션 Plugin 추적 출력을 전환하고 `Plugin 추적을 활성화했습니다.` / `Plugin 추적을 비활성화했습니다.`라고 응답합니다.
- 인라인 지시문은 해당 메시지에만 영향을 미치며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 인수 없이 `/trace` 또는 `/trace:`를 전송하면 현재 추적 수준을 볼 수 있습니다.
- `/trace`는 `/verbose`보다 범위가 좁습니다. Active Memory 디버그 요약과 같은 Plugin 소유 추적/디버그 줄만 노출합니다.
- 추적 줄은 `/status`와 일반 어시스턴트 응답 이후의 후속 진단 메시지에 표시될 수 있습니다.

## 추론 표시 여부(/reasoning)

- 수준: `on|off|stream`.
- 지시어만 포함된 메시지는 답변에 사고 과정 블록을 표시할지 여부를 전환합니다.
- 활성화하면 추론이 `Thinking` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream`: 활성 채널이 추론 미리보기를 지원하는 경우 답변을 생성하는 동안 추론을 스트리밍한 다음, 추론 없이 최종 답변을 전송합니다.
- 별칭: `/reason`.
- 인수 없이 `/reasoning`(또는 `/reasoning:`)을 전송하면 현재 추론 수준을 확인할 수 있습니다.
- 결정 순서: 인라인 지시어, 세션 재정의, 에이전트별 기본값(`agents.list[].reasoningDefault`), 전역 기본값(`agents.defaults.reasoningDefault`), 대체값(`off`) 순입니다.

잘못된 로컬 모델 추론 태그는 보수적으로 처리됩니다. 닫힌 `<think>...</think>` 블록은 일반 답변에서 계속 숨겨지며, 이미 표시된 텍스트 뒤에 닫히지 않은 추론이 있어도 숨겨집니다. 답변 전체가 닫히지 않은 단일 여는 태그로 감싸져 있어 그대로라면 빈 텍스트로 전달되는 경우, OpenClaw는 잘못된 여는 태그를 제거하고 나머지 텍스트를 전달합니다.

## 관련 항목

- 권한 상승 모드 문서는 [권한 상승 모드](/ko/tools/elevated)를 참조하세요.

## Heartbeat

- Heartbeat 검사 본문은 구성된 Heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat 메시지의 인라인 지시어도 평소처럼 적용됩니다(단, Heartbeat에서 세션 기본값을 변경하지 마세요).
- Heartbeat 전달은 기본적으로 최종 페이로드만 전송합니다. 별도의 `Thinking` 메시지도 함께 전송하려면(사용 가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true`를 설정하세요.

## 웹 채팅 UI

- 페이지가 로드되면 웹 채팅의 사고 수준 선택기는 수신 세션 저장소/구성에 저장된 세션 수준을 반영합니다.
- 다른 수준을 선택하면 `sessions.patch`를 통해 세션 재정의가 즉시 기록됩니다. 다음 전송을 기다리지 않으며 일회성 `thinkingOnce` 재정의도 아닙니다.
- 모델, 추론 또는 속도 선택기의 변경 사항이 아직 적용 중일 때 메시지를 전송하면 대기 중인 모든 선택기 패치가 완료될 때까지 기다립니다. 변경에 실패하면 검토할 수 있도록 메시지는 전송되지 않은 상태로 유지됩니다.
- 첫 번째 옵션은 항상 재정의를 해제하는 선택지입니다. 상속된 사고 기능이 비활성화된 경우의 `Inherited: Off`를 포함하여 `Inherited: <resolved level>`로 표시됩니다.
- 선택기에서 명시적으로 선택한 항목은 공급자 레이블이 있는 경우 이를 유지하면서 해당 수준의 직접적인 레이블을 사용합니다(예: 공급자가 `max` 옵션에 지정한 `Maximum`).
- 선택기는 Gateway 세션 행/기본값에서 반환된 `thinkingLevels`를 사용하며, `thinkingOptions`는 레거시 레이블 목록으로 유지됩니다. 브라우저 UI는 자체 공급자 정규식 목록을 유지하지 않으며, Plugin이 모델별 수준 집합을 소유합니다.
- `/think:<level>`도 계속 작동하며 동일하게 저장된 세션 수준을 업데이트하므로 채팅 지시어와 선택기가 동기화된 상태로 유지됩니다.

## 공급자 프로필

- 공급자 Plugin은 `resolveThinkingProfile(ctx)`을 노출하여 모델에서 지원하는 수준과 기본값을 정의할 수 있습니다.
- Claude 모델을 프록시하는 공급자 Plugin은 직접 Anthropic 카탈로그와 프록시 카탈로그가 일치하도록 `openclaw/plugin-sdk/provider-model-shared`의 `resolveClaudeThinkingProfile(modelId)`을 재사용해야 합니다.
- 각 프로필 수준에는 저장되는 정규 `id`(`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` 또는 `ultra`)가 있으며, 표시용 `label`을 포함할 수 있습니다. 이진 공급자는 `{ id: "low", label: "on" }`을 사용합니다.
- 프로필 훅은 가능한 경우 `reasoning`, `compat.thinkingFormat`, `compat.supportedReasoningEfforts`를 포함하여 병합된 카탈로그 정보를 받습니다. 구성된 요청 계약이 해당 페이로드를 지원하는 경우에만 이 정보를 사용하여 이진 또는 사용자 지정 프로필을 노출하세요.
- 명시적인 사고 수준 재정의를 검증해야 하는 도구 Plugin은 `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })`와 `api.runtime.agent.normalizeThinkingLevel(...)`을 함께 사용해야 하며, 자체 공급자/모델 수준 목록을 유지해서는 안 됩니다. 항상 임베디드 방식으로 실행되는 경우처럼 도구가 실행 경로를 소유할 때는 `agentRuntime`을 전달하세요.
- 구성된 사용자 지정 모델 메타데이터에 접근할 수 있는 도구 Plugin은 `catalog`를 `resolveThinkingPolicy`에 전달하여 `compat.supportedReasoningEfforts` 옵트인이 Plugin 측 검증에 반영되도록 할 수 있습니다.
- 게시된 레거시 훅(`supportsXHighThinking`, `isBinaryThinking`, `resolveDefaultThinkingLevel`)은 호환성 어댑터로 유지되지만, 새로운 사용자 지정 수준 집합에는 `resolveThinkingProfile`을 사용해야 합니다.
- Gateway 행/기본값은 `thinkingLevels`, `thinkingOptions`, `thinkingDefault`를 노출하므로 ACP/채팅 클라이언트는 런타임 검증에서 사용하는 것과 동일한 프로필 ID 및 레이블을 렌더링합니다.
