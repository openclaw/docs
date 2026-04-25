---
read_when:
    - 제공업체별 모델 설정 참조가 필요합니다
    - 모델 제공업체에 대한 예제 구성 또는 CLI 온보딩 명령이 필요합니다
summary: 예제 구성과 CLI 흐름이 포함된 모델 제공업체 개요
title: 모델 제공업체
x-i18n:
    generated_at: "2026-04-25T18:18:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0991f256bfeda9086eaa2911cc8056561dce84ee8cb9c16e99602eb396bbee83
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/모델 제공업체**를 위한 참조입니다(WhatsApp/Telegram 같은 채팅 채널이 아닙니다). 모델 선택 규칙은 [Models](/ko/concepts/models)를 참고하세요.

## 빠른 규칙

- 모델 참조는 `provider/model`을 사용합니다(예: `opencode/claude-opus-4-6`).
- `agents.defaults.models`는 설정되어 있을 때 허용 목록으로 동작합니다.
- CLI 도우미: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow`는 네이티브 모델 메타데이터이고, `contextTokens`는 실제 런타임 제한값입니다.
- 폴백 규칙, 쿨다운 프로브, 세션 재정의 영속성: [Model failover](/ko/concepts/model-failover).
- OpenAI 계열 경로는 접두사별로 구분됩니다: `openai/<model>`은 PI에서 직접 OpenAI API 키 제공업체를 사용하고, `openai-codex/<model>`은 PI에서 Codex OAuth를 사용하며, `openai/<model>`에 `agents.defaults.embeddedHarness.runtime: "codex"`를 함께 사용하면 네이티브 Codex 앱 서버 harness를 사용합니다. 자세한 내용은 [OpenAI](/ko/providers/openai) 및 [Codex harness](/ko/plugins/codex-harness)를 참고하세요. 제공업체/런타임 분리가 혼란스럽다면 먼저 [Agent runtimes](/ko/concepts/agent-runtimes)를 읽어보세요.
- Plugin 자동 활성화도 같은 경계를 따릅니다: `openai-codex/<model>`은 OpenAI Plugin에 속하며, Codex Plugin은 `embeddedHarness.runtime: "codex"` 또는 레거시 `codex/<model>` 참조로 활성화됩니다.
- CLI 런타임도 같은 분리를 사용합니다: `anthropic/claude-*`, `google/gemini-*`, `openai/gpt-*` 같은 정식 모델 참조를 선택한 다음, 로컬 CLI 백엔드를 원하면 `agents.defaults.embeddedHarness.runtime`을 `claude-cli`, `google-gemini-cli`, 또는 `codex-cli`로 설정하세요. 레거시 `claude-cli/*`, `google-gemini-cli/*`, `codex-cli/*` 참조는 런타임을 별도로 기록한 상태로 정식 제공업체 참조로 다시 마이그레이션됩니다.
- GPT-5.5는 직접 API 키 트래픽용 `openai/gpt-5.5`, PI에서 Codex OAuth용 `openai-codex/gpt-5.5`, 그리고 `embeddedHarness.runtime: "codex"`가 설정된 경우 네이티브 Codex 앱 서버 harness를 통해 사용할 수 있습니다.

## Plugin 소유 제공업체 동작

대부분의 제공업체별 로직은 제공업체 Plugin(`registerProvider(...)`)에 있으며, OpenClaw는 일반적인 추론 루프를 유지합니다. Plugin은 온보딩, 모델 카탈로그, 인증 환경 변수 매핑, 전송/구성 정규화, 도구 스키마 정리, 장애 조치 분류, OAuth 갱신, 사용량 보고, thinking/reasoning 프로필 등 다양한 기능을 담당합니다.

제공업체 SDK 훅의 전체 목록과 번들된 Plugin 예시는 [Provider plugins](/ko/plugins/sdk-provider-plugins)에 있습니다. 완전히 사용자 지정된 요청 실행기가 필요한 제공업체는 더 깊은 별도의 확장 표면에 해당합니다.

<Note>
제공업체 런타임 `capabilities`는 공유 실행기 메타데이터(제공업체 계열, transcript/tooling 특이사항, 전송/캐시 힌트)입니다. 이는 Plugin이 등록하는 항목(텍스트 추론, 음성 등)을 설명하는 [public capability model](/ko/plugins/architecture#public-capability-model)과는 다릅니다.
</Note>

## API 키 순환

- 선택된 제공업체에 대해 일반적인 제공업체 키 순환을 지원합니다.
- 여러 키는 다음을 통해 구성합니다:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (단일 라이브 재정의, 최우선)
  - `<PROVIDER>_API_KEYS` (쉼표 또는 세미콜론으로 구분된 목록)
  - `<PROVIDER>_API_KEY` (기본 키)
  - `<PROVIDER>_API_KEY_*` (번호가 붙은 목록, 예: `<PROVIDER>_API_KEY_1`)
- Google 제공업체의 경우 `GOOGLE_API_KEY`도 폴백으로 포함됩니다.
- 키 선택 순서는 우선순위를 유지하고 중복 값을 제거합니다.
- 요청은 속도 제한 응답에서만 다음 키로 재시도됩니다(예: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, 또는 주기적 사용량 제한 메시지).
- 속도 제한이 아닌 실패는 즉시 실패 처리되며, 키 순환은 시도되지 않습니다.
- 모든 후보 키가 실패하면 마지막 시도의 최종 오류가 반환됩니다.

## 기본 제공 제공업체 (pi-ai 카탈로그)

OpenClaw는 pi-ai 카탈로그와 함께 제공됩니다. 이 제공업체들은 `models.providers` 구성이 **필요 없습니다**. 인증을 설정하고 모델만 선택하면 됩니다.

### OpenAI

- 제공업체: `openai`
- 인증: `OPENAI_API_KEY`
- 선택적 순환: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, 그리고 `OPENCLAW_LIVE_OPENAI_KEY` (단일 재정의)
- 예제 모델: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- 특정 설치 또는 API 키의 동작이 다를 경우 `openclaw models list --provider openai`로 계정/모델 사용 가능 여부를 확인하세요.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 기본 전송은 `auto`입니다(WebSocket 우선, SSE 폴백)
- 모델별 재정의: `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, 또는 `"auto"`)
- OpenAI Responses WebSocket 워밍업은 기본적으로 `params.openaiWsWarmup` (`true`/`false`)을 통해 활성화되어 있습니다.
- OpenAI 우선 처리(priority processing)는 `agents.defaults.models["openai/<model>"].params.serviceTier`를 통해 활성화할 수 있습니다.
- `/fast`와 `params.fastMode`는 직접 `openai/*` Responses 요청을 `api.openai.com`의 `service_tier=priority`에 매핑합니다.
- 공유 `/fast` 토글 대신 명시적인 계층을 원하면 `params.serviceTier`를 사용하세요.
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`,
  `User-Agent`)는 일반적인 OpenAI 호환 프록시가 아니라 `api.openai.com`으로 가는 네이티브 OpenAI 트래픽에만 적용됩니다.
- 네이티브 OpenAI 경로는 Responses `store`, 프롬프트 캐시 힌트, OpenAI reasoning 호환 페이로드 형태도 유지하지만, 프록시 경로는 그렇지 않습니다.
- `openai/gpt-5.3-codex-spark`는 라이브 OpenAI API 요청에서 거부되고 현재 Codex 카탈로그에도 노출되지 않기 때문에 OpenClaw에서 의도적으로 숨겨져 있습니다.

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- 제공업체: `anthropic`
- 인증: `ANTHROPIC_API_KEY`
- 선택적 순환: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, 그리고 `OPENCLAW_LIVE_ANTHROPIC_KEY` (단일 재정의)
- 예제 모델: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 직접 공개 Anthropic 요청은 공유 `/fast` 토글과 `params.fastMode`를 지원하며, `api.anthropic.com`으로 전송되는 API 키 및 OAuth 인증 트래픽도 포함됩니다. OpenClaw는 이를 Anthropic `service_tier` (`auto` 대 `standard_only`)에 매핑합니다.
- Anthropic 참고: Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새로운 정책을 발표하지 않는 한 OpenClaw는 Claude CLI 재사용 및 `claude -p` 사용을 이 통합에 대해 허용된 것으로 취급합니다.
- Anthropic setup-token은 여전히 지원되는 OpenClaw 토큰 경로로 사용할 수 있지만, OpenClaw는 이제 가능할 경우 Claude CLI 재사용과 `claude -p`를 우선합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- 제공업체: `openai-codex`
- 인증: OAuth (ChatGPT)
- PI 모델 참조: `openai-codex/gpt-5.5`
- 네이티브 Codex 앱 서버 harness 참조: `openai/gpt-5.5`와 `agents.defaults.embeddedHarness.runtime: "codex"`
- 네이티브 Codex 앱 서버 harness 문서: [Codex harness](/ko/plugins/codex-harness)
- 레거시 모델 참조: `codex/gpt-*`
- Plugin 경계: `openai-codex/*`는 OpenAI Plugin을 로드합니다. 네이티브 Codex 앱 서버 Plugin은 Codex harness 런타임 또는 레거시 `codex/*` 참조로만 선택됩니다.
- CLI: `openclaw onboard --auth-choice openai-codex` 또는 `openclaw models auth login --provider openai-codex`
- 기본 전송은 `auto`입니다(WebSocket 우선, SSE 폴백)
- PI 모델별 재정의: `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, 또는 `"auto"`)
- `params.serviceTier`도 네이티브 Codex Responses 요청(`chatgpt.com/backend-api`)에서 전달됩니다.
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`,
  `User-Agent`)는 일반적인 OpenAI 호환 프록시가 아니라 `chatgpt.com/backend-api`로 가는 네이티브 Codex 트래픽에만 첨부됩니다.
- 직접 `openai/*`와 동일한 `/fast` 토글 및 `params.fastMode` 구성을 공유하며, OpenClaw는 이를 `service_tier=priority`에 매핑합니다.
- `openai-codex/gpt-5.5`는 Codex 카탈로그의 네이티브 `contextWindow = 400000`과 기본 런타임 `contextTokens = 272000`을 사용합니다. 런타임 제한은 `models.providers.openai-codex.models[].contextTokens`로 재정의하세요.
- 정책 참고: OpenAI Codex OAuth는 OpenClaw 같은 외부 도구/워크플로에 대해 명시적으로 지원됩니다.
- Codex OAuth/구독 경로를 원하면 `openai-codex/gpt-5.5`를 사용하세요. API 키 설정과 로컬 카탈로그에서 공개 API 경로가 노출되는 경우에는 `openai/gpt-5.5`를 사용하세요.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### 기타 구독형 호스팅 옵션

- [Qwen Cloud](/ko/providers/qwen): Qwen Cloud 제공업체 표면과 Alibaba DashScope 및 Coding Plan 엔드포인트 매핑
- [MiniMax](/ko/providers/minimax): MiniMax Coding Plan OAuth 또는 API 키 액세스
- [GLM models](/ko/providers/glm): Z.AI Coding Plan 또는 일반 API 엔드포인트

### OpenCode

- 인증: `OPENCODE_API_KEY` (또는 `OPENCODE_ZEN_API_KEY`)
- Zen 런타임 제공업체: `opencode`
- Go 런타임 제공업체: `opencode-go`
- 예제 모델: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API 키)

- 제공업체: `google`
- 인증: `GEMINI_API_KEY`
- 선택적 순환: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` 폴백, 그리고 `OPENCLAW_LIVE_GEMINI_KEY` (단일 재정의)
- 예제 모델: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 호환성: `google/gemini-3.1-flash-preview`를 사용하는 레거시 OpenClaw 구성은 `google/gemini-3-flash-preview`로 정규화됩니다.
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive`는 Google 동적 thinking을 사용합니다. Gemini 3/3.1은 고정 `thinkingLevel`을 생략하고, Gemini 2.5는 `thinkingBudget: -1`을 보냅니다.
- 직접 Gemini 실행도 `agents.defaults.models["google/<model>"].params.cachedContent`
  (또는 레거시 `cached_content`)를 받아 제공업체 네이티브 `cachedContents/...` 핸들을 전달합니다. Gemini 캐시 적중은 OpenClaw `cacheRead`로 표시됩니다.

### Google Vertex 및 Gemini CLI

- 제공업체: `google-vertex`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC를 사용하고, Gemini CLI는 자체 OAuth 흐름을 사용합니다.
- 주의: OpenClaw의 Gemini CLI OAuth는 비공식 통합입니다. 일부 사용자는 서드파티 클라이언트 사용 후 Google 계정 제한을 보고했습니다. 진행하기로 선택한다면 Google 약관을 검토하고 중요하지 않은 계정을 사용하세요.
- Gemini CLI OAuth는 번들된 `google` Plugin의 일부로 제공됩니다.
  - 먼저 Gemini CLI를 설치하세요:
    - `brew install gemini-cli`
    - 또는 `npm install -g @google/gemini-cli`
  - 활성화: `openclaw plugins enable google`
  - 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
  - 참고: `openclaw.json`에 client id 또는 secret을 붙여 넣지 않습니다. CLI 로그인 흐름은 게이트웨이 호스트의 인증 프로필에 토큰을 저장합니다.
  - 로그인 후 요청이 실패하면 게이트웨이 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하세요.
  - Gemini CLI JSON 응답은 `response`에서 파싱되며, 사용량은 `stats`로 폴백되고 `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.

### Z.AI (GLM)

- 제공업체: `zai`
- 인증: `ZAI_API_KEY`
- 예제 모델: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 별칭: `z.ai/*` 및 `z-ai/*`는 `zai/*`로 정규화됩니다.
  - `zai-api-key`는 일치하는 Z.AI 엔드포인트를 자동 감지하며, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`은 특정 표면을 강제합니다.

### Vercel AI Gateway

- 제공업체: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 예제 모델: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- 제공업체: `kilocode`
- 인증: `KILOCODE_API_KEY`
- 예제 모델: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- 기본 URL: `https://api.kilo.ai/api/gateway/`
- 정적 폴백 카탈로그는 `kilocode/kilo/auto`를 포함하며, 라이브
  `https://api.kilo.ai/api/gateway/models` 검색을 통해 런타임
  카탈로그가 더 확장될 수 있습니다.
- `kilocode/kilo/auto` 뒤의 정확한 업스트림 라우팅은 OpenClaw에
  하드코딩되어 있지 않고 Kilo Gateway가 관리합니다.

설정 세부 정보는 [/providers/kilocode](/ko/providers/kilocode)를 참고하세요.

### 기타 번들 제공업체 Plugin

| 제공업체                | Id                               | 인증 env                                                     | 예제 모델                                        |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                  |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                           |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                                |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                     |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                                |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                                |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`            |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                             |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` 또는 `KIMICODE_API_KEY`                       | `kimi/kimi-code`                                 |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                           |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                   |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                             |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`  |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                                |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                          |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                              |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                         |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                  |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                                |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`    |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`                |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                     |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                           |

알아두면 좋은 특이사항:

- **OpenRouter**는 검증된 `openrouter.ai` 경로에서만 앱 attribution 헤더와 Anthropic `cache_control` 마커를 적용합니다. DeepSeek, Moonshot, ZAI 참조는 OpenRouter가 관리하는 프롬프트 캐싱에서 cache-TTL 대상이 되지만 Anthropic 캐시 마커는 받지 않습니다. 프록시 스타일의 OpenAI 호환 경로이므로 네이티브 OpenAI 전용 형태 조정(`serviceTier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI reasoning 호환)은 건너뜁니다. Gemini 기반 참조는 프록시 Gemini thought-signature 정리만 유지합니다.
- **Kilo Gateway**의 Gemini 기반 참조도 동일한 프록시 Gemini 정리 경로를 따릅니다. `kilocode/kilo/auto`와 기타 프록시 reasoning 미지원 참조는 프록시 reasoning 주입을 건너뜁니다.
- **MiniMax** API 키 온보딩은 명시적인 텍스트 전용 M2.7 채팅 모델 정의를 작성합니다. 이미지 이해는 Plugin이 소유하는 `MiniMax-VL-01` 미디어 제공업체에 그대로 남아 있습니다.
- **xAI**는 xAI Responses 경로를 사용합니다. `/fast` 또는 `params.fastMode: true`는 `grok-3`, `grok-3-mini`, `grok-4`, `grok-4-0709`를 해당 `*-fast` 변형으로 다시 씁니다. `tool_stream`은 기본적으로 활성화되어 있으며, `agents.defaults.models["xai/<model>"].params.tool_stream=false`로 비활성화할 수 있습니다.
- **Cerebras** GLM 모델은 `zai-glm-4.7` / `zai-glm-4.6`을 사용합니다. OpenAI 호환 기본 URL은 `https://api.cerebras.ai/v1`입니다.

## `models.providers`를 통한 제공업체 (사용자 지정/기본 URL)

**사용자 지정** 제공업체 또는 OpenAI/Anthropic 호환 프록시를 추가하려면 `models.providers`(또는 `models.json`)를 사용하세요.

아래의 많은 번들 제공업체 Plugin은 이미 기본 카탈로그를 게시합니다.
기본 base URL, 헤더 또는 모델 목록을 재정의하려는 경우에만
명시적인 `models.providers.<id>` 항목을 사용하세요.

### Moonshot AI (Kimi)

Moonshot은 번들 제공업체 Plugin으로 제공됩니다. 기본적으로는 내장 제공업체를
사용하고, base URL 또는 모델 메타데이터를 재정의해야 할 때만 명시적인 `models.providers.moonshot` 항목을 추가하세요:

- 제공업체: `moonshot`
- 인증: `MOONSHOT_API_KEY`
- 예제 모델: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 모델 ID:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding은 Moonshot AI의 Anthropic 호환 엔드포인트를 사용합니다:

- 제공업체: `kimi`
- 인증: `KIMI_API_KEY`
- 예제 모델: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

레거시 `kimi/k2p5`도 호환성 모델 id로 계속 허용됩니다.

### Volcano Engine (Doubao)

Volcano Engine (화산엔진)은 중국에서 Doubao 및 기타 모델에 대한 액세스를 제공합니다.

- 제공업체: `volcengine` (coding: `volcengine-plan`)
- 인증: `VOLCANO_ENGINE_API_KEY`
- 예제 모델: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

온보딩은 기본적으로 coding 표면을 사용하지만, 일반 `volcengine/*`
카탈로그도 동시에 등록됩니다.

온보딩/모델 구성 선택기에서 Volcengine 인증 선택은 `volcengine/*`와
`volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우,
OpenClaw는 비어 있는 제공업체 범위 선택기를 보여주는 대신 필터링되지 않은
카탈로그로 폴백합니다.

사용 가능한 모델:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

코딩 모델 (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (International)

BytePlus ARK는 국제 사용자를 위해 Volcano Engine과 동일한 모델에 대한 액세스를 제공합니다.

- 제공업체: `byteplus` (coding: `byteplus-plan`)
- 인증: `BYTEPLUS_API_KEY`
- 예제 모델: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

온보딩은 기본적으로 coding 표면을 사용하지만, 일반 `byteplus/*`
카탈로그도 동시에 등록됩니다.

온보딩/모델 구성 선택기에서 BytePlus 인증 선택은 `byteplus/*`와
`byteplus-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우,
OpenClaw는 비어 있는 제공업체 범위 선택기를 보여주는 대신 필터링되지 않은
카탈로그로 폴백합니다.

사용 가능한 모델:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

코딩 모델 (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic는 `synthetic` 제공업체 뒤에서 Anthropic 호환 모델을 제공합니다:

- 제공업체: `synthetic`
- 인증: `SYNTHETIC_API_KEY`
- 예제 모델: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax는 사용자 지정 엔드포인트를 사용하므로 `models.providers`를 통해 구성합니다:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API 키 (Global): `--auth-choice minimax-global-api`
- MiniMax API 키 (CN): `--auth-choice minimax-cn-api`
- 인증: `minimax`에는 `MINIMAX_API_KEY`; `minimax-portal`에는 `MINIMAX_OAUTH_TOKEN` 또는
  `MINIMAX_API_KEY`

설정 세부 정보, 모델 옵션, 구성 스니펫은 [/providers/minimax](/ko/providers/minimax)를 참고하세요.

MiniMax의 Anthropic 호환 스트리밍 경로에서 OpenClaw는
명시적으로 설정하지 않는 한 기본적으로 thinking을 비활성화하며, `/fast on`은
`MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.

Plugin 소유 capability 분리:

- 텍스트/채팅 기본값은 `minimax/MiniMax-M2.7`에 유지됩니다.
- 이미지 생성은 `minimax/image-01` 또는 `minimax-portal/image-01`입니다.
- 이미지 이해는 두 MiniMax 인증 경로 모두에서 Plugin이 소유하는 `MiniMax-VL-01`입니다.
- 웹 검색은 제공업체 id `minimax`에 유지됩니다.

### LM Studio

LM Studio는 네이티브 API를 사용하는 번들 제공업체 Plugin으로 제공됩니다:

- 제공업체: `lmstudio`
- 인증: `LM_API_TOKEN`
- 기본 추론 base URL: `http://localhost:1234/v1`

그런 다음 모델을 설정하세요(`http://localhost:1234/api/v1/models`에서 반환된 ID 중 하나로 바꾸세요):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw는 기본적으로 검색 + 자동 로드를 위해 LM Studio의 네이티브 `/api/v1/models` 및 `/api/v1/models/load`를 사용하고, 추론에는 `/v1/chat/completions`를 사용합니다.
설정 및 문제 해결은 [/providers/lmstudio](/ko/providers/lmstudio)를 참고하세요.

### Ollama

Ollama는 번들 제공업체 Plugin으로 제공되며 Ollama의 네이티브 API를 사용합니다:

- 제공업체: `ollama`
- 인증: 필요 없음 (로컬 서버)
- 예제 모델: `ollama/llama3.3`
- 설치: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama를 설치한 다음 모델을 가져오세요:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY`로 옵트인하면 Ollama는 로컬의 `http://127.0.0.1:11434`에서 감지되며,
번들 제공업체 Plugin은 Ollama를 `openclaw onboard`와 모델 선택기에 직접 추가합니다. 온보딩, 클라우드/로컬 모드, 사용자 지정 구성은 [/providers/ollama](/ko/providers/ollama)를 참고하세요.

### vLLM

vLLM은 로컬/셀프 호스팅 OpenAI 호환 서버를 위한 번들 제공업체 Plugin으로 제공됩니다:

- 제공업체: `vllm`
- 인증: 선택 사항 (서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:8000/v1`

로컬에서 자동 검색을 사용하려면 옵트인하세요(서버가 인증을 강제하지 않으면 어떤 값이든 동작함):

```bash
export VLLM_API_KEY="vllm-local"
```

그런 다음 모델을 설정하세요(`/v1/models`에서 반환된 ID 중 하나로 바꾸세요):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/ko/providers/vllm)를 참고하세요.

### SGLang

SGLang은 빠른 셀프 호스팅
OpenAI 호환 서버를 위한 번들 제공업체 Plugin으로 제공됩니다:

- 제공업체: `sglang`
- 인증: 선택 사항 (서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:30000/v1`

로컬에서 자동 검색을 사용하려면 옵트인하세요(서버가 인증을
강제하지 않으면 어떤 값이든 동작함):

```bash
export SGLANG_API_KEY="sglang-local"
```

그런 다음 모델을 설정하세요(`/v1/models`에서 반환된 ID 중 하나로 바꾸세요):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/sglang](/ko/providers/sglang)를 참고하세요.

### 로컬 프록시 (LM Studio, vLLM, LiteLLM 등)

예시 (OpenAI 호환):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "로컬" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "로컬 모델",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

참고:

- 사용자 지정 제공업체의 경우 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는 선택 사항입니다.
  생략하면 OpenClaw는 기본적으로 다음 값을 사용합니다:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 권장 사항: 프록시/모델 제한에 맞는 명시적 값을 설정하세요.
- 네이티브가 아닌 엔드포인트의 `api: "openai-completions"`(호스트가 `api.openai.com`이 아닌 비어 있지 않은 `baseUrl`)에 대해 OpenClaw는 지원되지 않는 `developer` 역할로 인한 제공업체 400 오류를 피하기 위해 `compat.supportsDeveloperRole: false`를 강제로 설정합니다.
- 프록시 스타일 OpenAI 호환 경로도 네이티브 OpenAI 전용 요청
  형태 조정을 건너뜁니다: `service_tier` 없음, Responses `store` 없음, Completions `store` 없음,
  프롬프트 캐시 힌트 없음, OpenAI reasoning 호환 페이로드 형태 조정 없음, 숨겨진
  OpenClaw attribution 헤더 없음.
- 공급업체별 필드가 필요한 OpenAI 호환 Completions 프록시의 경우,
  `agents.defaults.models["provider/model"].params.extra_body` (또는
  `extraBody`)를 설정해 추가 JSON을 아웃바운드 요청 본문에 병합하세요.
- `baseUrl`이 비어 있거나 생략되면 OpenClaw는 기본 OpenAI 동작을 유지합니다(`api.openai.com`으로 해석됨).
- 안전을 위해 네이티브가 아닌 `openai-completions` 엔드포인트에서는 명시적인 `compat.supportsDeveloperRole: true`도 여전히 재정의됩니다.

## CLI 예제

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

추가 참고: 전체 구성 예제는 [Configuration](/ko/gateway/configuration)을 참고하세요.

## 관련

- [Models](/ko/concepts/models) — 모델 구성 및 별칭
- [Model failover](/ko/concepts/model-failover) — 폴백 체인 및 재시도 동작
- [Configuration reference](/ko/gateway/config-agents#agent-defaults) — 모델 구성 키
- [Providers](/ko/providers) — 제공업체별 설정 가이드
