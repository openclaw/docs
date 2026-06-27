---
read_when:
    - 제공자별 모델 설정 참조가 필요합니다
    - 모델 제공자를 위한 예시 구성 또는 CLI 온보딩 명령이 필요합니다
sidebarTitle: Model providers
summary: 예제 설정 + CLI 흐름이 포함된 모델 제공자 개요
title: 모델 제공자
x-i18n:
    generated_at: "2026-06-27T17:23:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

Reference for **LLM/model providers** (not chat channels like WhatsApp/Telegram). For model selection rules, see [Models](/ko/concepts/models).

## Quick rules

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - Model refs use `provider/model` (example: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` acts as an allowlist when set.
    - CLI helpers: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` set provider-level defaults; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` override them per model.
    - Fallback rules, cooldown probes, and session-override persistence: [Model failover](/ko/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` preserves an existing `agents.defaults.model.primary` when you add or reauth a provider. `openclaw models auth login` does the same unless you pass `--set-default`. Provider plugins may still return a recommended default model in their auth config patch, but OpenClaw treats that as "make this model available" when a primary model already exists, not "replace the current primary model."

    To intentionally switch the default model, use `openclaw models set <provider/model>` or `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    OpenAI-family routes are prefix-specific:

    - `openai/<model>` uses the native Codex app-server harness for agent turns by default. This is the usual ChatGPT/Codex subscription setup.
    - legacy Codex model refs are legacy config that doctor rewrites to `openai/<model>`.
    - `openai/<model>` plus provider/model `agentRuntime.id: "openclaw"` uses OpenClaw's built-in runtime for explicit API-key or compatibility routes.

    See [OpenAI](/ko/providers/openai) and [Codex harness](/ko/plugins/codex-harness). If the provider/runtime split is confusing, read [Agent runtimes](/ko/concepts/agent-runtimes) first.

    Plugin auto-enable follows the same boundary: `openai/*` agent refs enable the Codex plugin for the default route, and explicit provider/model `agentRuntime.id: "codex"` or legacy `codex/<model>` refs also require it.

    GPT-5.5 is available through the native Codex app-server harness by default on `openai/gpt-5.5`, and through the OpenClaw runtime when provider/model runtime policy explicitly selects `openclaw`.

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI runtimes use the same split: choose canonical model refs such as `anthropic/claude-*` or `google/gemini-*`, then set provider/model runtime policy to `claude-cli` or `google-gemini-cli` when you want a local CLI backend.

    Legacy `claude-cli/*` and `google-gemini-cli/*` refs migrate back to canonical provider refs with the runtime recorded separately. Legacy `codex-cli/*` refs migrate to `openai/*` and use the Codex app-server route; OpenClaw no longer keeps a bundled Codex CLI backend.

  </Accordion>
</AccordionGroup>

## Plugin-owned provider behavior

Most provider-specific logic lives in provider plugins (`registerProvider(...)`) while OpenClaw keeps the generic inference loop. Plugins own onboarding, model catalogs, auth env-var mapping, transport/config normalization, tool-schema cleanup, failover classification, OAuth refresh, usage reporting, thinking/reasoning profiles, and more.

The full list of provider-SDK hooks and bundled-plugin examples lives in [Provider plugins](/ko/plugins/sdk-provider-plugins). A provider that needs a totally custom request executor is a separate, deeper extension surface.

<Note>
Provider-owned runner behavior lives on explicit provider hooks such as replay policy, tool-schema normalization, stream wrapping, and transport/request helpers. The legacy `ProviderPlugin.capabilities` static bag is compatibility-only and is no longer read by shared runner logic.
</Note>

## API key rotation

<AccordionGroup>
  <Accordion title="Key sources and priority">
    Configure multiple keys via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (single live override, highest priority)
    - `<PROVIDER>_API_KEYS` (comma or semicolon list)
    - `<PROVIDER>_API_KEY` (primary key)
    - `<PROVIDER>_API_KEY_*` (numbered list, e.g. `<PROVIDER>_API_KEY_1`)

    For Google providers, `GOOGLE_API_KEY` is also included as fallback. Key selection order preserves priority and deduplicates values.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - Requests are retried with the next key only on rate-limit responses (for example `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, or periodic usage-limit messages).
    - Non-rate-limit failures fail immediately; no key rotation is attempted.
    - When all candidate keys fail, the final error is returned from the last attempt.

  </Accordion>
</AccordionGroup>

## Official provider plugins

Official provider plugins publish their own model catalog rows. These providers require **no** `models.providers` model entries; enable the provider plugin, set auth, and pick a model. Use `models.providers` only for explicit custom providers or narrow request settings such as timeouts.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optional rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (single override)
- Example models: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verify account/model availability with `openclaw models list --provider openai` if a specific install or API key behaves differently.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Default transport is `auto`; OpenClaw passes the transport choice to the shared model runtime.
- Override per model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, or `"auto"`)
- OpenAI priority processing can be enabled via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` and `params.fastMode` map direct `openai/*` Responses requests to `service_tier=priority` on `api.openai.com`
- Use `params.serviceTier` when you want an explicit tier instead of the shared `/fast` toggle
- Hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`) apply only on native OpenAI traffic to `api.openai.com`, not generic OpenAI-compatible proxies
- Native OpenAI routes also keep Responses `store`, prompt-cache hints, and OpenAI reasoning-compat payload shaping; proxy routes do not
- `openai/gpt-5.3-codex-spark` is available through ChatGPT/Codex OAuth subscription auth when your signed-in account exposes it; OpenClaw still suppresses direct OpenAI API-key and Azure API-key routes for this model because those transports reject it

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optional rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (single override)
- Example model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direct public Anthropic requests support the shared `/fast` toggle and `params.fastMode`, including API-key and OAuth-authenticated traffic sent to `api.anthropic.com`; OpenClaw maps that to Anthropic `service_tier` (`auto` vs `standard_only`)
- Preferred Claude CLI config keeps the model ref canonical and selects the CLI
  backend separately: `anthropic/claude-opus-4-8` with
  model-scoped `agentRuntime.id: "claude-cli"`. Legacy
  `claude-cli/claude-opus-4-7` refs still work for compatibility.

<Note>
Anthropic staff told us OpenClaw-style Claude CLI usage is allowed again, so OpenClaw treats Claude CLI reuse and `claude -p` usage as sanctioned for this integration unless Anthropic publishes a new policy. Anthropic setup-token remains available as a supported OpenClaw token path, but OpenClaw now prefers Claude CLI reuse and `claude -p` when available.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Provider: `openai`
- Auth: OAuth (ChatGPT)
- Legacy OpenAI Codex model ref: `openai/gpt-5.5`
- Native Codex app-server harness ref: `openai/gpt-5.5`
- Native Codex app-server harness docs: [Codex harness](/ko/plugins/codex-harness)
- Legacy model refs: `codex/gpt-*`
- Plugin boundary: `openai/*` loads the OpenAI plugin; the native Codex app-server plugin is selected by the Codex harness runtime.
- CLI: `openclaw onboard --auth-choice openai` or `openclaw models auth login --provider openai`
- Default transport is `auto` (WebSocket-first, SSE fallback)
- Override per OpenAI Codex model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, or `"auto"`)
- `params.serviceTier` is also forwarded on native Codex Responses requests (`chatgpt.com/backend-api`)
- Hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`) are only attached on native Codex traffic to `chatgpt.com/backend-api`, not generic OpenAI-compatible proxies
- Shares the same `/fast` toggle and `params.fastMode` config as direct `openai/*`; OpenClaw maps that to `service_tier=priority`
- `openai/gpt-5.5` uses the Codex catalog native `contextWindow = 400000` and default runtime `contextTokens = 272000`; override the runtime cap with `models.providers.openai.models[].contextTokens`
- Policy note: OpenAI Codex OAuth is explicitly supported for external tools/workflows like OpenClaw.
- For the common subscription plus native Codex runtime route, sign in with `openai` auth and configure `openai/gpt-5.5`; OpenAI agent turns select Codex by default.
- Use provider/model `agentRuntime.id: "openclaw"` only when you want the built-in OpenClaw route; otherwise keep `openai/gpt-5.5` on the default Codex harness.
- legacy Codex GPT refs are legacy state, not a live provider route. Use `openai/gpt-5.5` on the native Codex runtime for new agent config, and run `openclaw doctor --fix` to migrate old legacy Codex model refs to canonical `openai/*` refs.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Other subscription-style hosted options

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/ko/providers/zai">
    Z.AI Coding Plan or general API endpoints.
  </Card>
  <Card title="MiniMax" href="/ko/providers/minimax">
    MiniMax Coding Plan OAuth or API key access.
  </Card>
  <Card title="Qwen Cloud" href="/ko/providers/qwen">
    Qwen Cloud provider surface plus Alibaba DashScope and Coding Plan endpoint mapping.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (or `OPENCODE_ZEN_API_KEY`)
- Zen runtime provider: `opencode`
- Go runtime provider: `opencode-go`
- Example models: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` or `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- 공급자: `google`
- 인증: `GEMINI_API_KEY`
- 선택적 순환: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` 대체, 및 `OPENCLAW_LIVE_GEMINI_KEY`(단일 재정의)
- 예시 모델: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 호환성: `google/gemini-3.1-flash-preview`를 사용하는 레거시 OpenClaw 설정은 `google/gemini-3-flash-preview`로 정규화됩니다
- 별칭: `google/gemini-3.1-pro`는 허용되며 Google의 라이브 Gemini API ID인 `google/gemini-3.1-pro-preview`로 정규화됩니다
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 사고: `/think adaptive`는 Google 동적 사고를 사용합니다. Gemini 3/3.1은 고정된 `thinkingLevel`을 생략하며, Gemini 2.5는 `thinkingBudget: -1`을 보냅니다.
- 직접 Gemini 실행은 공급자 네이티브 `cachedContents/...` 핸들을 전달하기 위해 `agents.defaults.models["google/<model>"].params.cachedContent`(또는 레거시 `cached_content`)도 허용합니다. Gemini 캐시 적중은 OpenClaw `cacheRead`로 표시됩니다

### Google Vertex 및 Gemini CLI

- 공급자: `google-vertex`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC를 사용합니다. Gemini CLI는 자체 OAuth 흐름을 사용합니다

<Warning>
OpenClaw의 Gemini CLI OAuth는 비공식 통합입니다. 일부 사용자는 타사 클라이언트를 사용한 후 Google 계정 제한을 보고했습니다. 계속 진행하기로 선택한 경우 Google 약관을 검토하고 중요하지 않은 계정을 사용하세요.
</Warning>

Gemini CLI OAuth는 번들된 `google` Plugin의 일부로 제공됩니다.

<Steps>
  <Step title="Gemini CLI 설치">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Plugin 활성화">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="로그인">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    기본 모델: `google-gemini-cli/gemini-3-flash-preview`. 클라이언트 ID나 비밀 값을 `openclaw.json`에 붙여넣지 **않습니다**. CLI 로그인 흐름은 Gateway 호스트의 인증 프로필에 토큰을 저장합니다.

  </Step>
  <Step title="프로젝트 설정(필요한 경우)">
    로그인 후 요청이 실패하면 Gateway 호스트에서 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하세요.
  </Step>
</Steps>

Gemini CLI는 기본적으로 `stream-json`을 사용합니다. OpenClaw는 어시스턴트 스트림
메시지를 읽고 `stats.cached`를 `cacheRead`로 정규화합니다. 레거시
`--output-format json` 재정의는 여전히 `response`에서 응답 텍스트를 읽습니다.

### Z.AI (GLM)

- 공급자: `zai`
- 인증: `ZAI_API_KEY`
- 예시 모델: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 모델 참조는 표준 `zai/*` 공급자 ID를 사용합니다.
  - `zai-api-key`는 일치하는 Z.AI 엔드포인트를 자동 감지합니다. `zai-coding-global`, `zai-coding-cn`, `zai-global`, 및 `zai-cn`은 특정 표면을 강제합니다

### Vercel AI Gateway

- 공급자: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 예시 모델: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### 기타 번들 공급자 Plugin

| 공급자                                  | ID                               | 인증 환경 변수                                      | 예시 모델                                                  |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`              | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/ko/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth 또는 `OPENROUTER_API_KEY`           | `openrouter/auto`                                          |
| [Qwen OAuth](/ko/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth 또는 `XAI_API_KEY`         | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### 알아두면 좋은 특이 사항

<AccordionGroup>
  <Accordion title="OpenRouter">
    앱 기여 헤더와 Anthropic `cache_control` 마커를 검증된 `openrouter.ai` 경로에만 적용합니다. DeepSeek, Moonshot, 및 ZAI 참조는 OpenRouter 관리형 프롬프트 캐싱의 캐시 TTL 대상이지만 Anthropic 캐시 마커는 받지 않습니다. 프록시 스타일의 OpenAI 호환 경로로서 네이티브 OpenAI 전용 shaping(`serviceTier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI reasoning 호환)을 건너뜁니다. Gemini 기반 참조는 프록시 Gemini thought-signature 정리만 유지합니다.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 기반 참조는 동일한 프록시 Gemini 정리 경로를 따릅니다. `kilocode/kilo/auto` 및 기타 프록시 reasoning 미지원 참조는 프록시 reasoning 주입을 건너뜁니다.
  </Accordion>
  <Accordion title="MiniMax">
    API 키 온보딩은 명시적인 M3 및 M2.7 채팅 모델 정의를 작성합니다. 이미지 이해는 Plugin 소유 `MiniMax-VL-01` 미디어 공급자에 유지됩니다.
  </Accordion>
  <Accordion title="NVIDIA">
    모델 ID는 `nvidia/<vendor>/<model>` 네임스페이스를 사용합니다(예: `nvidia/moonshotai/kimi-k2.5`와 함께 `nvidia/nvidia/nemotron-...`). 선택기는 리터럴 `<provider>/<model-id>` 구성을 보존하지만 API로 전송되는 표준 키는 단일 접두사를 유지합니다.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses 경로를 사용합니다. 권장 경로는 SuperGrok/X Premium OAuth입니다. API 키도 `XAI_API_KEY` 또는 Plugin 설정을 통해 계속 작동하며, Grok `web_search`는 API 키 대체 전에 동일한 인증 프로필을 재사용합니다. `grok-4.3`은 번들 기본 채팅 모델이며, `grok-build-0.1`은 빌드/코딩 중심 작업에 선택할 수 있습니다. `/fast` 또는 `params.fastMode: true`는 `grok-3`, `grok-3-mini`, `grok-4`, 및 `grok-4-0709`를 해당 `*-fast` 변형으로 다시 씁니다. `tool_stream`은 기본적으로 켜져 있습니다. `agents.defaults.models["xai/<model>"].params.tool_stream=false`로 비활성화하세요.
  </Accordion>
</AccordionGroup>

## `models.providers`를 통한 공급자(사용자 지정/base URL)

**사용자 지정** 공급자 또는 OpenAI/Anthropic 호환 프록시를 추가하려면 `models.providers`(또는 `models.json`)를 사용하세요.

아래의 많은 번들 공급자 Plugin은 이미 기본 카탈로그를 게시합니다. 기본 base URL, 헤더, 또는 모델 목록을 재정의하려는 경우에만 명시적인 `models.providers.<id>` 항목을 사용하세요.

Gateway 모델 기능 검사도 명시적인 `models.providers.<id>.models[]` 메타데이터를 읽습니다. 사용자 지정 또는 프록시 모델이 이미지를 허용하는 경우, 해당 모델에 `input: ["text", "image"]`를 설정하여 WebChat 및 노드 출처 첨부 파일 경로가 이미지를 텍스트 전용 미디어 참조 대신 네이티브 모델 입력으로 전달하도록 하세요.

`agents.defaults.models["provider/model"]`은 에이전트의 모델 표시 여부, 별칭, 모델별 메타데이터만 제어합니다. 이것만으로 새 런타임 모델을 등록하지는 않습니다. 사용자 지정 공급자 모델의 경우, 일치하는 `id`를 최소한 포함하여 `models.providers.<provider>.models[]`도 추가하세요.

### Moonshot AI (Kimi)

온보딩 전에 `@openclaw/moonshot-provider`를 설치하세요. 기본 URL 또는 모델 메타데이터를 재정의해야 할 때만 명시적인 `models.providers.moonshot` 항목을 추가하세요.

- 공급자: `moonshot`
- 인증: `MOONSHOT_API_KEY`
- 예시 모델: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 모델 ID:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

### Kimi 코딩

Kimi Coding은 Moonshot AI의 Anthropic 호환 엔드포인트를 사용합니다.

- 공급자: `kimi`
- 인증: `KIMI_API_KEY`
- 예시 모델: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

레거시 `kimi/kimi-code`와 `kimi/k2p5`는 호환성 모델 ID로 계속 허용되며 Kimi의 안정적인 API 모델 ID로 정규화됩니다.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎)은 중국에서 Doubao 및 기타 모델에 대한 액세스를 제공합니다.

- 공급자: `volcengine` (코딩: `volcengine-plan`)
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

온보딩은 기본적으로 코딩 표면을 사용하지만, 일반 `volcengine/*` 카탈로그도 동시에 등록됩니다.

온보딩/구성 모델 선택기에서 Volcengine 인증 선택지는 `volcengine/*` 및 `volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우 OpenClaw는 비어 있는 제공자 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus(국제)

BytePlus ARK는 국제 사용자를 위해 Volcano Engine과 동일한 모델에 대한 접근을 제공합니다.

- 제공자: `byteplus`(코딩: `byteplus-plan`)
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

온보딩은 기본적으로 코딩 표면을 사용하지만, 일반 `byteplus/*` 카탈로그도 동시에 등록됩니다.

온보딩/구성 모델 선택기에서 BytePlus 인증 선택지는 `byteplus/*` 및 `byteplus-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우 OpenClaw는 비어 있는 제공자 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic은 `synthetic` 제공자 뒤에서 Anthropic 호환 모델을 제공합니다.

- 제공자: `synthetic`
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

MiniMax는 사용자 지정 엔드포인트를 사용하므로 `models.providers`를 통해 구성됩니다.

- MiniMax OAuth(글로벌): `--auth-choice minimax-global-oauth`
- MiniMax OAuth(CN): `--auth-choice minimax-cn-oauth`
- MiniMax API 키(글로벌): `--auth-choice minimax-global-api`
- MiniMax API 키(CN): `--auth-choice minimax-cn-api`
- 인증: `minimax`에는 `MINIMAX_API_KEY`, `minimax-portal`에는 `MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`

설정 세부 정보, 모델 옵션, 구성 스니펫은 [/providers/minimax](/ko/providers/minimax)를 참조하세요.

<Note>
MiniMax의 Anthropic 호환 스트리밍 경로에서 OpenClaw는 명시적으로 설정하지 않는 한 M2.x 제품군에 대해 기본적으로 thinking을 비활성화합니다. MiniMax-M3(및 M3.x)는 기본적으로 제공자의 생략/적응형 thinking 경로를 유지합니다. `/fast on`은 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
</Note>

Plugin 소유 기능 분리:

- 텍스트/채팅 기본값은 `minimax/MiniMax-M3`에 유지됩니다.
- 이미지 생성은 `minimax/image-01` 또는 `minimax-portal/image-01`입니다.
- 이미지 이해는 두 MiniMax 인증 경로 모두에서 Plugin 소유 `MiniMax-VL-01`입니다.
- 웹 검색은 제공자 ID `minimax`에 유지됩니다.

### LM Studio

LM Studio는 네이티브 API를 사용하는 번들 제공자 Plugin으로 제공됩니다.

- 제공자: `lmstudio`
- 인증: `LM_API_TOKEN`
- 기본 추론 기준 URL: `http://localhost:1234/v1`

그런 다음 모델을 설정합니다(`http://localhost:1234/api/v1/models`에서 반환된 ID 중 하나로 바꾸세요).

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw는 검색 및 자동 로드에 LM Studio의 네이티브 `/api/v1/models` 및 `/api/v1/models/load`를 사용하고, 기본적으로 추론에는 `/v1/chat/completions`를 사용합니다. LM Studio JIT 로딩, TTL, 자동 제거가 모델 수명 주기를 소유하도록 하려면 `models.providers.lmstudio.params.preload: false`를 설정하세요. 설정 및 문제 해결은 [/providers/lmstudio](/ko/providers/lmstudio)를 참조하세요.

### Ollama

Ollama는 번들 제공자 Plugin으로 제공되며 Ollama의 네이티브 API를 사용합니다.

- 제공자: `ollama`
- 인증: 필요 없음(로컬 서버)
- 예시 모델: `ollama/llama3.3`
- 설치: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY`로 옵트인하면 Ollama는 `http://127.0.0.1:11434`에서 로컬로 감지되며, 번들 제공자 Plugin은 Ollama를 `openclaw onboard`와 모델 선택기에 직접 추가합니다. 온보딩, 클라우드/로컬 모드, 사용자 지정 구성은 [/providers/ollama](/ko/providers/ollama)를 참조하세요.

### vLLM

vLLM은 로컬/자체 호스팅 OpenAI 호환 서버용 번들 제공자 Plugin으로 제공됩니다.

- 제공자: `vllm`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 기준 URL: `http://127.0.0.1:8000/v1`

로컬에서 자동 검색에 옵트인하려면(서버가 인증을 강제하지 않는 경우 어떤 값이든 가능):

```bash
export VLLM_API_KEY="vllm-local"
```

그런 다음 모델을 설정합니다(`/v1/models`에서 반환된 ID 중 하나로 바꾸세요).

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/ko/providers/vllm)을 참조하세요.

### SGLang

SGLang은 빠른 자체 호스팅 OpenAI 호환 서버용 번들 제공자 Plugin으로 제공됩니다.

- 제공자: `sglang`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 기준 URL: `http://127.0.0.1:30000/v1`

로컬에서 자동 검색에 옵트인하려면(서버가 인증을 강제하지 않는 경우 어떤 값이든 가능):

```bash
export SGLANG_API_KEY="sglang-local"
```

그런 다음 모델을 설정합니다(`/v1/models`에서 반환된 ID 중 하나로 바꾸세요).

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/sglang](/ko/providers/sglang)을 참조하세요.

### 로컬 프록시(LM Studio, vLLM, LiteLLM 등)

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
        timeoutSeconds: 300,
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

<AccordionGroup>
  <Accordion title="Default optional fields">
    사용자 지정 제공자에서 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는 선택 사항입니다. 생략하면 OpenClaw는 다음 값을 기본값으로 사용합니다.

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    권장: 프록시/모델 제한과 일치하는 명시적 값을 설정하세요.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - 네이티브가 아닌 엔드포인트(호스트가 `api.openai.com`이 아닌, 비어 있지 않은 모든 `baseUrl`)에서 `api: "openai-completions"`를 사용하는 경우, OpenClaw는 지원되지 않는 `developer` 역할로 인한 제공자 400 오류를 피하기 위해 `compat.supportsDeveloperRole: false`를 강제합니다.
    - 프록시 스타일 OpenAI 호환 경로는 네이티브 OpenAI 전용 요청 형성도 건너뜁니다. `service_tier` 없음, Responses `store` 없음, Completions `store` 없음, 프롬프트 캐시 힌트 없음, OpenAI reasoning 호환 페이로드 형성 없음, 숨겨진 OpenClaw attribution 헤더 없음.
    - 공급업체별 필드가 필요한 OpenAI 호환 Completions 프록시의 경우, `agents.defaults.models["provider/model"].params.extra_body`(또는 `extraBody`)를 설정하여 추가 JSON을 외부 요청 본문에 병합하세요.
    - vLLM 채팅 템플릿 제어의 경우 `agents.defaults.models["provider/model"].params.chat_template_kwargs`를 설정하세요. 번들 vLLM Plugin은 세션 thinking 수준이 꺼져 있을 때 `vllm/nemotron-3-*`에 대해 `enable_thinking: false` 및 `force_nonempty_content: true`를 자동으로 전송합니다.
    - 느린 로컬 모델이나 원격 LAN/tailnet 호스트의 경우 `models.providers.<id>.timeoutSeconds`를 설정하세요. 이렇게 하면 전체 에이전트 런타임 제한 시간을 늘리지 않고도 연결, 헤더, 본문 스트리밍, 전체 보호된 가져오기 중단을 포함한 제공자 모델 HTTP 요청 처리가 연장됩니다. `agents.defaults.timeoutSeconds` 또는 실행별 제한 시간이 더 낮으면 해당 상한도 높이세요. 제공자 제한 시간은 전체 실행을 연장할 수 없습니다.
    - 모델 제공자 HTTP 호출은 구성된 제공자 `baseUrl` 호스트명에 대해서만 `198.18.0.0/15` 및 `fc00::/7`의 Surge, Clash, sing-box fake-IP DNS 응답을 허용합니다. 사용자 지정/로컬 제공자 엔드포인트는 또한 loopback, LAN, tailnet 호스트를 포함하여 보호된 모델 요청에 대해 정확히 구성된 `scheme://host:port` origin을 신뢰합니다. 이는 새로운 구성 옵션이 아닙니다. 구성한 `baseUrl`은 해당 origin에 대해서만 요청 정책을 확장합니다. Fake-IP 호스트명 허용과 정확한 origin 신뢰는 독립적인 메커니즘입니다. 기타 private, loopback, link-local, metadata 대상 및 다른 포트는 여전히 명시적 `models.providers.<id>.request.allowPrivateNetwork: true` 옵트인이 필요합니다. 정확한 origin 신뢰를 옵트아웃하려면 `models.providers.<id>.request.allowPrivateNetwork: false`를 설정하세요.
    - `baseUrl`이 비어 있거나 생략된 경우 OpenClaw는 기본 OpenAI 동작(`api.openai.com`으로 확인됨)을 유지합니다.
    - 안전을 위해 명시적 `compat.supportsDeveloperRole: true`도 네이티브가 아닌 `openai-completions` 엔드포인트에서는 여전히 재정의됩니다.
    - 직접이 아닌 엔드포인트(표준 `anthropic`이 아닌 모든 제공자 또는 호스트가 공개 `api.anthropic.com` 엔드포인트가 아닌 사용자 지정 `models.providers.anthropic.baseUrl`)에서 `api: "anthropic-messages"`를 사용하는 경우, OpenClaw는 `claude-code-20250219`, `interleaved-thinking-2025-05-14`, OAuth 마커와 같은 암시적 Anthropic 베타 헤더를 억제하여 사용자 지정 Anthropic 호환 프록시가 지원되지 않는 베타 플래그를 거부하지 않도록 합니다. 프록시에 특정 베타 기능이 필요한 경우 `models.providers.<id>.headers["anthropic-beta"]`를 명시적으로 설정하세요.

  </Accordion>
</AccordionGroup>

## CLI 예시

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

전체 구성 예시는 [구성](/ko/gateway/configuration)도 참조하세요.

## 관련 항목

- [구성 참조](/ko/gateway/config-agents#agent-defaults) - 모델 구성 키
- [모델 장애 조치](/ko/concepts/model-failover) - 대체 체인 및 재시도 동작
- [모델](/ko/concepts/models) - 모델 구성 및 별칭
- [제공자](/ko/providers) - 제공자별 설정 가이드
