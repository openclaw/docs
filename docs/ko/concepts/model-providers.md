---
read_when:
    - provider별 모델 설정 참조가 필요합니다.
    - 모델 provider용 예시 구성 또는 CLI 온보딩 명령이 필요합니다.
summary: 모델 provider 개요, 예시 구성 + CLI 흐름
title: 모델 provider
x-i18n:
    generated_at: "2026-04-25T05:59:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdab460823e3138377a7e2b183b31caa64bb2eef4c9e77ebd8db0aacc97493bb
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/모델 provider** 참조입니다(WhatsApp/Telegram 같은 채팅 채널이 아님). 모델 선택 규칙은 [Models](/ko/concepts/models)를 참조하세요.

## 빠른 규칙

- 모델 ref는 `provider/model` 형식을 사용합니다(예: `opencode/claude-opus-4-6`).
- `agents.defaults.models`가 설정되면 허용 목록으로 동작합니다.
- CLI helper: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow`는 네이티브 모델 메타데이터이고, `contextTokens`는 실제 런타임 상한입니다.
- 폴백 규칙, cooldown probe, 세션 override 지속성: [Model failover](/ko/concepts/model-failover).
- OpenAI 계열 라우트는 prefix별로 구분됩니다: `openai/<model>`은 PI의 직접 OpenAI API key provider를 사용하고, `openai-codex/<model>`은 PI의 Codex OAuth를 사용하며, `openai/<model>`에 `agents.defaults.embeddedHarness.runtime: "codex"`를 함께 쓰면 네이티브 Codex app-server harness를 사용합니다. [OpenAI](/ko/providers/openai) 및 [Codex harness](/ko/plugins/codex-harness)를 참조하세요. provider/runtime 분리가 혼란스럽다면 먼저 [Agent runtimes](/ko/concepts/agent-runtimes)를 읽어보세요.
- Plugin 자동 활성화도 같은 경계를 따릅니다: `openai-codex/<model>`은 OpenAI Plugin에 속하고, Codex Plugin은 `embeddedHarness.runtime: "codex"` 또는 레거시 `codex/<model>` ref로 활성화됩니다.
- CLI runtime도 같은 분리를 사용합니다: `anthropic/claude-*`, `google/gemini-*`, `openai/gpt-*` 같은 정식 모델 ref를 선택한 뒤, 로컬 CLI 백엔드를 원하면 `agents.defaults.embeddedHarness.runtime`을 `claude-cli`, `google-gemini-cli`, `codex-cli`로 설정하세요. 레거시 `claude-cli/*`, `google-gemini-cli/*`, `codex-cli/*` ref는 런타임을 별도로 기록하면서 정식 provider ref로 마이그레이션됩니다.
- GPT-5.5는 현재 subscription/OAuth 경로를 통해 제공됩니다: PI에서는 `openai-codex/gpt-5.5`, Codex app-server harness에서는 `openai/gpt-5.5`를 사용합니다. `openai/gpt-5.5`의 직접 API key 경로는 OpenAI가 공개 API에서 GPT-5.5를 활성화하면 지원됩니다. 그전까지는 `OPENAI_API_KEY` 설정에 대해 `openai/gpt-5.4` 같은 API 지원 모델을 사용하세요.

## Plugin이 소유하는 provider 동작

대부분의 provider별 로직은 provider Plugin(`registerProvider(...)`)에 있으며, OpenClaw는 일반적인 추론 루프를 유지합니다. Plugin은 onboarding, 모델 카탈로그, 인증 env var 매핑, transport/config 정규화, tool-schema 정리, failover 분류, OAuth 갱신, 사용량 보고, thinking/reasoning 프로필 등을 담당합니다.

provider-SDK hook 전체 목록과 번들 Plugin 예시는 [Provider plugins](/ko/plugins/sdk-provider-plugins)에 있습니다. 완전히 커스텀 요청 실행기가 필요한 provider는 별도의 더 깊은 extension 표면입니다.

<Note>
provider runtime `capabilities`는 공유 runner 메타데이터입니다(provider family, transcript/tooling 특이점, transport/cache 힌트). 이는 Plugin이 등록하는 항목(텍스트 추론, 음성 등)을 설명하는 [public capability model](/ko/plugins/architecture#public-capability-model)과는 다릅니다.
</Note>

## API key 순환

- 일부 provider에 대해 일반적인 provider key 순환을 지원합니다.
- 여러 키는 다음을 통해 구성할 수 있습니다:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (단일 라이브 override, 최우선)
  - `<PROVIDER>_API_KEYS` (쉼표 또는 세미콜론 구분 목록)
  - `<PROVIDER>_API_KEY` (기본 키)
  - `<PROVIDER>_API_KEY_*` (번호가 붙은 목록, 예: `<PROVIDER>_API_KEY_1`)
- Google provider의 경우 `GOOGLE_API_KEY`도 fallback으로 포함됩니다.
- 키 선택 순서는 우선순위를 유지하고 값을 deduplicate합니다.
- 요청은 rate-limit 응답일 때만 다음 키로 재시도됩니다(예: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, 또는 주기적인 사용량 제한 메시지).
- rate-limit이 아닌 실패는 즉시 실패하며 key 순환을 시도하지 않습니다.
- 모든 후보 키가 실패하면 마지막 시도의 최종 오류가 반환됩니다.

## 내장 provider (`pi-ai` 카탈로그)

OpenClaw는 `pi‑ai` 카탈로그와 함께 제공됩니다. 이 provider들은 `models.providers` 구성이 **필요 없습니다**. 인증을 설정하고 모델만 선택하면 됩니다.

### OpenAI

- Provider: `openai`
- 인증: `OPENAI_API_KEY`
- 선택적 순환: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, 그리고 `OPENCLAW_LIVE_OPENAI_KEY` (단일 override)
- 예시 모델: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- GPT-5.5 직접 API 지원은 OpenAI가 API에 GPT-5.5를 노출하면 여기서 바로 사용할 수 있도록 준비되어 있습니다
- Codex app-server runtime 없이 `openai/gpt-5.5`를 사용하기 전에 `openclaw models list --provider openai`로 직접 API 사용 가능 여부를 확인하세요
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 기본 transport는 `auto`입니다(WebSocket 우선, SSE fallback)
- 모델별 override는 `agents.defaults.models["openai/<model>"].params.transport`로 설정합니다(`"sse"`, `"websocket"`, 또는 `"auto"`)
- OpenAI Responses WebSocket warm-up은 기본적으로 `params.openaiWsWarmup`을 통해 활성화됩니다(`true`/`false`)
- OpenAI priority processing은 `agents.defaults.models["openai/<model>"].params.serviceTier`로 활성화할 수 있습니다
- `/fast`와 `params.fastMode`는 직접 `openai/*` Responses 요청을 `api.openai.com`의 `service_tier=priority`로 매핑합니다
- 공유 `/fast` 토글 대신 명시적인 tier를 원하면 `params.serviceTier`를 사용하세요
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는 일반적인 OpenAI 호환 proxy가 아니라 `api.openai.com`으로 가는 네이티브 OpenAI 트래픽에만 적용됩니다
- 네이티브 OpenAI 라우트는 Responses `store`, prompt-cache 힌트, OpenAI reasoning 호환 payload shaping도 유지합니다. proxy 라우트는 그렇지 않습니다
- `openai/gpt-5.3-codex-spark`는 실제 OpenAI API 요청에서 거부되고 현재 Codex 카탈로그에도 노출되지 않기 때문에 OpenClaw에서 의도적으로 숨겨져 있습니다

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- 인증: `ANTHROPIC_API_KEY`
- 선택적 순환: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, 그리고 `OPENCLAW_LIVE_ANTHROPIC_KEY` (단일 override)
- 예시 모델: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 직접 공개 Anthropic 요청은 `api.anthropic.com`으로 전송되는 API key 및 OAuth 인증 트래픽을 포함해 공유 `/fast` 토글과 `params.fastMode`를 지원하며, OpenClaw는 이를 Anthropic `service_tier`(`auto` vs `standard_only`)로 매핑합니다
- Anthropic 참고: Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려주었으므로, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 Claude CLI 재사용과 `claude -p` 사용을 이 통합에 대해 허용된 것으로 취급합니다.
- Anthropic setup-token은 여전히 지원되는 OpenClaw 토큰 경로로 남아 있지만, OpenClaw는 이제 가능하면 Claude CLI 재사용과 `claude -p`를 선호합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- 인증: OAuth (ChatGPT)
- PI 모델 ref: `openai-codex/gpt-5.5`
- 네이티브 Codex app-server harness ref: `openai/gpt-5.5`와 `agents.defaults.embeddedHarness.runtime: "codex"`
- 네이티브 Codex app-server harness 문서: [Codex harness](/ko/plugins/codex-harness)
- 레거시 모델 ref: `codex/gpt-*`
- Plugin 경계: `openai-codex/*`는 OpenAI Plugin을 로드하고, 네이티브 Codex app-server Plugin은 Codex harness runtime 또는 레거시 `codex/*` ref로만 선택됩니다.
- CLI: `openclaw onboard --auth-choice openai-codex` 또는 `openclaw models auth login --provider openai-codex`
- 기본 transport는 `auto`입니다(WebSocket 우선, SSE fallback)
- PI 모델별 override는 `agents.defaults.models["openai-codex/<model>"].params.transport`로 설정합니다(`"sse"`, `"websocket"`, 또는 `"auto"`)
- `params.serviceTier`도 네이티브 Codex Responses 요청(`chatgpt.com/backend-api`)에서 전달됩니다
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는 일반적인 OpenAI 호환 proxy가 아니라 `chatgpt.com/backend-api`로 가는 네이티브 Codex 트래픽에만 첨부됩니다
- 직접 `openai/*`와 동일한 `/fast` 토글 및 `params.fastMode` 구성을 공유하며, OpenClaw는 이를 `service_tier=priority`로 매핑합니다
- `openai-codex/gpt-5.5`는 네이티브 `contextWindow = 1000000`과 기본 런타임 `contextTokens = 272000`을 유지합니다. 런타임 상한은 `models.providers.openai-codex.models[].contextTokens`로 override할 수 있습니다
- 정책 참고: OpenAI Codex OAuth는 OpenClaw 같은 외부 도구/워크플로에 대해 명시적으로 지원됩니다.
- 현재 GPT-5.5 접근은 OpenAI가 공개 API에서 GPT-5.5를 활성화할 때까지 이 OAuth/subscription 경로를 사용합니다.

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

### 기타 subscription 스타일 호스팅 옵션

- [Qwen Cloud](/ko/providers/qwen): Qwen Cloud provider 표면과 Alibaba DashScope 및 Coding Plan 엔드포인트 매핑
- [MiniMax](/ko/providers/minimax): MiniMax Coding Plan OAuth 또는 API key 접근
- [GLM models](/ko/providers/glm): Z.AI Coding Plan 또는 일반 API 엔드포인트

### OpenCode

- 인증: `OPENCODE_API_KEY` (또는 `OPENCODE_ZEN_API_KEY`)
- Zen runtime provider: `opencode`
- Go runtime provider: `opencode-go`
- 예시 모델: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- 인증: `GEMINI_API_KEY`
- 선택적 순환: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` fallback, 그리고 `OPENCLAW_LIVE_GEMINI_KEY` (단일 override)
- 예시 모델: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 호환성: `google/gemini-3.1-flash-preview`를 사용하는 레거시 OpenClaw 구성은 `google/gemini-3-flash-preview`로 정규화됩니다
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive`는 Google dynamic thinking을 사용합니다. Gemini 3/3.1은 고정 `thinkingLevel`을 생략하고, Gemini 2.5는 `thinkingBudget: -1`을 보냅니다.
- 직접 Gemini 실행은 `agents.defaults.models["google/<model>"].params.cachedContent`(또는 레거시 `cached_content`)도 받아 네이티브 provider `cachedContents/...` 핸들을 전달합니다. Gemini cache hit는 OpenClaw `cacheRead`로 표시됩니다

### Google Vertex 및 Gemini CLI

- Providers: `google-vertex`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC를 사용하고, Gemini CLI는 자체 OAuth 흐름을 사용합니다
- 주의: OpenClaw의 Gemini CLI OAuth는 비공식 통합입니다. 일부 사용자는 서드파티 클라이언트 사용 후 Google 계정 제한을 보고했습니다. 진행하기 전에 Google 약관을 검토하고, 사용한다면 중요하지 않은 계정을 사용하세요.
- Gemini CLI OAuth는 번들된 `google` Plugin의 일부로 제공됩니다.
  - 먼저 Gemini CLI를 설치합니다:
    - `brew install gemini-cli`
    - 또는 `npm install -g @google/gemini-cli`
  - 활성화: `openclaw plugins enable google`
  - 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
  - 참고: `openclaw.json`에 client id 또는 secret을 붙여 넣지 **않습니다**. CLI 로그인 흐름은 Gateway 호스트의 auth profile에 토큰을 저장합니다.
  - 로그인 후 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하세요.
  - Gemini CLI JSON 응답은 `response`에서 파싱되며, 사용량은 `stats`로 fallback되고, `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.

### Z.AI (GLM)

- Provider: `zai`
- 인증: `ZAI_API_KEY`
- 예시 모델: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 별칭: `z.ai/*` 및 `z-ai/*`는 `zai/*`로 정규화됩니다
  - `zai-api-key`는 일치하는 Z.AI 엔드포인트를 자동 감지하고, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`은 특정 표면을 강제합니다

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 예시 모델: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- 인증: `KILOCODE_API_KEY`
- 예시 모델: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- 정적 fallback 카탈로그는 `kilocode/kilo/auto`를 제공합니다. 실시간
  `https://api.kilo.ai/api/gateway/models` 검색은 런타임
  카탈로그를 더 확장할 수 있습니다.
- `kilocode/kilo/auto` 뒤의 정확한 upstream 라우팅은 OpenClaw에 하드코딩되어 있지 않고
  Kilo Gateway가 소유합니다.

설정 세부 정보는 [/providers/kilocode](/ko/providers/kilocode)를 참조하세요.

### 기타 번들된 provider Plugin

| Provider                | Id                               | 인증 env                                                     | 예시 모델                                        |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                  |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                           |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                                |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                     |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                                |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                                |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`            |
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

알아두면 좋은 특이 사항:

- **OpenRouter**는 검증된 `openrouter.ai` 라우트에서만 자체 앱 attribution 헤더와 Anthropic `cache_control` 마커를 적용합니다. DeepSeek, Moonshot, ZAI ref는 OpenRouter가 관리하는 prompt cache에 대해 cache-TTL 적용 대상이지만 Anthropic cache 마커는 받지 않습니다. proxy 스타일 OpenAI 호환 경로이므로 네이티브 OpenAI 전용 shaping(`serviceTier`, Responses `store`, prompt-cache 힌트, OpenAI reasoning-compat)은 건너뜁니다. Gemini 기반 ref는 proxy-Gemini thought-signature sanitation만 유지합니다.
- **Kilo Gateway**의 Gemini 기반 ref는 동일한 proxy-Gemini sanitation 경로를 따릅니다. `kilocode/kilo/auto` 및 기타 proxy-reasoning 미지원 ref는 proxy reasoning injection을 건너뜁니다.
- **MiniMax** API key onboarding은 명시적인 텍스트 전용 M2.7 채팅 모델 정의를 기록합니다. 이미지 이해는 Plugin이 소유하는 `MiniMax-VL-01` 미디어 provider에 남아 있습니다.
- **xAI**는 xAI Responses 경로를 사용합니다. `/fast` 또는 `params.fastMode: true`는 `grok-3`, `grok-3-mini`, `grok-4`, `grok-4-0709`를 해당 `*-fast` 변형으로 재작성합니다. `tool_stream`은 기본적으로 켜져 있으며, `agents.defaults.models["xai/<model>"].params.tool_stream=false`로 비활성화할 수 있습니다.
- **Cerebras** GLM 모델은 `zai-glm-4.7` / `zai-glm-4.6`을 사용합니다. OpenAI 호환 base URL은 `https://api.cerebras.ai/v1`입니다.

## `models.providers`를 통한 provider(커스텀/base URL)

`models.providers`(또는 `models.json`)를 사용해 **커스텀** provider 또는
OpenAI/Anthropic 호환 proxy를 추가하세요.

아래의 많은 번들 provider Plugin은 이미 기본 카탈로그를 게시합니다.
기본 base URL, 헤더 또는 모델 목록을 override하려는 경우에만
명시적인 `models.providers.<id>` 항목을 사용하세요.

### Moonshot AI (Kimi)

Moonshot은 번들된 provider Plugin으로 제공됩니다. 기본적으로 내장 provider를 사용하고,
base URL 또는 모델 메타데이터를 override해야 할 때만 명시적인 `models.providers.moonshot` 항목을 추가하세요.

- Provider: `moonshot`
- 인증: `MOONSHOT_API_KEY`
- 예시 모델: `moonshot/kimi-k2.6`
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

Kimi Coding은 Moonshot AI의 Anthropic 호환 엔드포인트를 사용합니다.

- Provider: `kimi`
- 인증: `KIMI_API_KEY`
- 예시 모델: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

레거시 `kimi/k2p5`도 호환성 모델 ID로 계속 허용됩니다.

### Volcano Engine (Doubao)

Volcano Engine(화산 엔진)은 중국에서 Doubao 및 기타 모델에 대한 접근을 제공합니다.

- Provider: `volcengine` (코딩: `volcengine-plan`)
- 인증: `VOLCANO_ENGINE_API_KEY`
- 예시 모델: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

온보딩은 기본적으로 코딩 표면을 사용하지만, 일반 `volcengine/*`
카탈로그도 동시에 등록됩니다.

온보딩/구성 모델 선택기에서는 Volcengine 인증 선택이
`volcengine/*`와 `volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우,
OpenClaw는 빈 provider 범위 선택기를 보여주는 대신 필터링되지 않은 카탈로그로 대체합니다.

사용 가능한 모델:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

코딩 모델(`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (국제)

BytePlus ARK는 국제 사용자에게 Volcano Engine과 동일한 모델에 대한 접근을 제공합니다.

- Provider: `byteplus` (코딩: `byteplus-plan`)
- 인증: `BYTEPLUS_API_KEY`
- 예시 모델: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

온보딩은 기본적으로 코딩 표면을 사용하지만, 일반 `byteplus/*`
카탈로그도 동시에 등록됩니다.

온보딩/구성 모델 선택기에서는 BytePlus 인증 선택이
`byteplus/*`와 `byteplus-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우,
OpenClaw는 빈 provider 범위 선택기를 보여주는 대신 필터링되지 않은 카탈로그로 대체합니다.

사용 가능한 모델:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

코딩 모델(`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic는 `synthetic` provider 뒤에서 Anthropic 호환 모델을 제공합니다.

- Provider: `synthetic`
- 인증: `SYNTHETIC_API_KEY`
- 예시 모델: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax는 커스텀 엔드포인트를 사용하므로 `models.providers`를 통해 구성합니다.

- MiniMax OAuth (글로벌): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (중국): `--auth-choice minimax-cn-oauth`
- MiniMax API key (글로벌): `--auth-choice minimax-global-api`
- MiniMax API key (중국): `--auth-choice minimax-cn-api`
- 인증: `minimax`에는 `MINIMAX_API_KEY`, `minimax-portal`에는
  `MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`

설정 세부 정보, 모델 옵션, 구성 스니펫은 [/providers/minimax](/ko/providers/minimax)를 참조하세요.

MiniMax의 Anthropic 호환 스트리밍 경로에서 OpenClaw는
명시적으로 설정하지 않는 한 기본적으로 thinking을 비활성화하며, `/fast on`은
`MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 재작성합니다.

Plugin이 소유하는 capability 분리:

- 텍스트/채팅 기본값은 `minimax/MiniMax-M2.7`에 유지됩니다
- 이미지 생성은 `minimax/image-01` 또는 `minimax-portal/image-01`입니다
- 이미지 이해는 두 MiniMax 인증 경로 모두에서 Plugin이 소유하는 `MiniMax-VL-01`입니다
- 웹 검색은 provider id `minimax`에 유지됩니다

### LM Studio

LM Studio는 네이티브 API를 사용하는 번들된 provider Plugin으로 제공됩니다.

- Provider: `lmstudio`
- 인증: `LM_API_TOKEN`
- 기본 추론 base URL: `http://localhost:1234/v1`

그런 다음 모델을 설정합니다(`http://localhost:1234/api/v1/models`가 반환하는 ID 중 하나로 바꾸세요):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw는 기본적으로 검색 + 자동 로드를 위해 LM Studio의 네이티브 `/api/v1/models`와 `/api/v1/models/load`,
추론을 위해 `/v1/chat/completions`를 사용합니다.
설정 및 문제 해결은 [/providers/lmstudio](/ko/providers/lmstudio)를 참조하세요.

### Ollama

Ollama는 번들된 provider Plugin으로 제공되며 Ollama의 네이티브 API를 사용합니다.

- Provider: `ollama`
- 인증: 필요 없음(로컬 서버)
- 예시 모델: `ollama/llama3.3`
- 설치: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama를 설치한 다음 모델을 가져옵니다:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama는 `OLLAMA_API_KEY`로 명시적으로 활성화하면 로컬의 `http://127.0.0.1:11434`에서 감지되며,
번들된 provider Plugin은 Ollama를 `openclaw onboard`와 모델 선택기에 직접 추가합니다.
온보딩, cloud/local 모드, 커스텀 구성은 [/providers/ollama](/ko/providers/ollama)를 참조하세요.

### vLLM

vLLM은 로컬/셀프 호스팅 OpenAI 호환
서버를 위한 번들된 provider Plugin으로 제공됩니다.

- Provider: `vllm`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:8000/v1`

로컬 자동 검색을 활성화하려면(서버가 인증을 강제하지 않는 경우 어떤 값이든 가능):

```bash
export VLLM_API_KEY="vllm-local"
```

그런 다음 모델을 설정합니다(`/v1/models`가 반환하는 ID 중 하나로 바꾸세요):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/ko/providers/vllm)을 참조하세요.

### SGLang

SGLang은 빠른 셀프 호스팅
OpenAI 호환 서버를 위한 번들된 provider Plugin으로 제공됩니다.

- Provider: `sglang`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:30000/v1`

로컬 자동 검색을 활성화하려면(서버가 인증을
강제하지 않는 경우 어떤 값이든 가능):

```bash
export SGLANG_API_KEY="sglang-local"
```

그런 다음 모델을 설정합니다(`/v1/models`가 반환하는 ID 중 하나로 바꾸세요):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/sglang](/ko/providers/sglang)을 참조하세요.

### 로컬 proxy(LM Studio, vLLM, LiteLLM 등)

예시(OpenAI 호환):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
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
            name: "Local Model",
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

- 커스텀 provider의 경우 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는 선택 사항입니다.
  생략하면 OpenClaw는 기본값으로 다음을 사용합니다.
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 권장 사항: proxy/모델 제한에 맞는 명시적 값을 설정하세요.
- 네이티브가 아닌 엔드포인트(호스트가 `api.openai.com`이 아닌 비어 있지 않은 `baseUrl`)에서 `api: "openai-completions"`를 사용할 경우, OpenClaw는 미지원 `developer` role에 대한 provider 400 오류를 피하기 위해 `compat.supportsDeveloperRole: false`를 강제로 설정합니다.
- proxy 스타일 OpenAI 호환 라우트는 네이티브 OpenAI 전용 요청 shaping도 건너뜁니다: `service_tier` 없음, Responses `store` 없음, Completions `store` 없음, prompt-cache 힌트 없음, OpenAI reasoning-compat payload shaping 없음, 숨겨진 OpenClaw attribution 헤더 없음.
- vendor별 필드가 필요한 OpenAI 호환 Completions proxy의 경우, `agents.defaults.models["provider/model"].params.extra_body`(또는 `extraBody`)를 설정해 추가 JSON을 아웃바운드 요청 본문에 병합하세요.
- `baseUrl`이 비어 있거나 생략되면, OpenClaw는 기본 OpenAI 동작을 유지합니다(`api.openai.com`으로 해석됨).
- 안전을 위해, 명시적인 `compat.supportsDeveloperRole: true`도 네이티브가 아닌 `openai-completions` 엔드포인트에서는 여전히 override됩니다.

## CLI 예시

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

추가 참조: 전체 구성 예시는 [Configuration](/ko/gateway/configuration)을 참조하세요.

## 관련 항목

- [Models](/ko/concepts/models) — 모델 구성 및 별칭
- [Model failover](/ko/concepts/model-failover) — 폴백 체인 및 재시도 동작
- [Configuration reference](/ko/gateway/config-agents#agent-defaults) — 모델 구성 키
- [Providers](/ko/providers) — provider별 설정 가이드
