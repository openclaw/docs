---
read_when:
    - provider별 모델 설정 참조가 필요합니다
    - 모델 providers용 예시 config 또는 CLI 온보딩 명령을 원합니다
sidebarTitle: Model providers
summary: 예시 config 및 CLI 흐름이 포함된 모델 provider 개요
title: 모델 providers
x-i18n:
    generated_at: "2026-04-26T11:27:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/모델 providers** 참조입니다(WhatsApp/Telegram 같은 채팅 채널 아님). 모델 선택 규칙은 [Models](/ko/concepts/models)를 참조하세요.

## 빠른 규칙

<AccordionGroup>
  <Accordion title="모델 ref 및 CLI 헬퍼">
    - 모델 ref는 `provider/model`을 사용합니다(예: `opencode/claude-opus-4-6`).
    - `agents.defaults.models`는 설정된 경우 allowlist로 동작합니다.
    - CLI 헬퍼: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.models[].contextWindow`는 네이티브 모델 메타데이터이며, `contextTokens`는 유효 런타임 상한입니다.
    - fallback 규칙, cooldown probe, 세션 override 지속성: [Model failover](/ko/concepts/model-failover).

  </Accordion>
  <Accordion title="OpenAI provider/런타임 분리">
    OpenAI 계열 경로는 prefix별로 구분됩니다.

    - `openai/<model>`은 PI의 직접 OpenAI API-key provider를 사용합니다.
    - `openai-codex/<model>`은 PI의 Codex OAuth를 사용합니다.
    - `openai/<model>`과 `agents.defaults.agentRuntime.id: "codex"`를 함께 사용하면 네이티브 Codex app-server harness를 사용합니다.

    [OpenAI](/ko/providers/openai) 및 [Codex harness](/ko/plugins/codex-harness)를 참조하세요. provider/런타임 분리가 헷갈린다면 먼저 [Agent runtimes](/ko/concepts/agent-runtimes)를 읽으세요.

    Plugin 자동 활성화도 같은 경계를 따릅니다. `openai-codex/<model>`은 OpenAI plugin에 속하며, Codex plugin은 `agentRuntime.id: "codex"` 또는 레거시 `codex/<model>` ref로 활성화됩니다.

    GPT-5.5는 직접 API-key 트래픽용 `openai/gpt-5.5`, PI의 Codex OAuth용 `openai-codex/gpt-5.5`, 그리고 `agentRuntime.id: "codex"`가 설정된 경우 네이티브 Codex app-server harness를 통해 사용할 수 있습니다.

  </Accordion>
  <Accordion title="CLI 런타임">
    CLI 런타임은 동일한 분리를 사용합니다. `anthropic/claude-*`, `google/gemini-*`, `openai/gpt-*` 같은 정식 모델 ref를 선택한 다음, 로컬 CLI 백엔드를 사용하려면 `agents.defaults.agentRuntime.id`를 `claude-cli`, `google-gemini-cli`, `codex-cli`로 설정하세요.

    레거시 `claude-cli/*`, `google-gemini-cli/*`, `codex-cli/*` ref는 런타임을 별도로 기록한 상태로 정식 provider ref로 다시 마이그레이션됩니다.

  </Accordion>
</AccordionGroup>

## Plugin 소유 provider 동작

대부분의 provider별 로직은 provider plugins(`registerProvider(...)`)에 있으며, OpenClaw는 일반적인 추론 루프를 유지합니다. plugins는 onboarding, 모델 카탈로그, 인증 env-var 매핑, transport/config 정규화, tool-schema 정리, failover 분류, OAuth 갱신, 사용량 보고, thinking/reasoning 프로필 등을 담당합니다.

provider-SDK hooks 전체 목록과 번들 plugin 예시는 [Provider plugins](/ko/plugins/sdk-provider-plugins)에 있습니다. 완전히 사용자 지정된 요청 실행기가 필요한 provider는 별도의 더 깊은 확장 표면입니다.

<Note>
Provider 런타임 `capabilities`는 공유 runner 메타데이터입니다(provider 계열, transcript/tooling 특성, transport/cache 힌트). 이것은 plugin이 등록하는 내용(텍스트 추론, 음성 등)을 설명하는 [공개 capability 모델](/ko/plugins/architecture#public-capability-model)과는 다릅니다.
</Note>

## API key 회전

<AccordionGroup>
  <Accordion title="키 소스 및 우선순위">
    여러 키는 다음을 통해 구성합니다.

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (단일 live override, 최고 우선순위)
    - `<PROVIDER>_API_KEYS` (쉼표 또는 세미콜론 목록)
    - `<PROVIDER>_API_KEY` (기본 키)
    - `<PROVIDER>_API_KEY_*` (번호가 붙은 목록, 예: `<PROVIDER>_API_KEY_1`)

    Google providers의 경우 `GOOGLE_API_KEY`도 fallback으로 포함됩니다. 키 선택 순서는 우선순위를 유지하고 값을 중복 제거합니다.

  </Accordion>
  <Accordion title="회전이 시작되는 시점">
    - 요청은 rate-limit 응답에서만 다음 키로 재시도됩니다(예: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, 또는 주기적인 usage-limit 메시지).
    - rate-limit이 아닌 실패는 즉시 실패하며 키 회전은 시도되지 않습니다.
    - 모든 후보 키가 실패하면 마지막 시도의 최종 오류가 반환됩니다.

  </Accordion>
</AccordionGroup>

## 내장 providers (pi-ai 카탈로그)

OpenClaw는 pi‑ai 카탈로그와 함께 제공됩니다. 이 providers는 `models.providers` config가 **필요 없습니다**. 인증을 설정하고 모델만 선택하면 됩니다.

### OpenAI

- Provider: `openai`
- 인증: `OPENAI_API_KEY`
- 선택적 회전: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, 그리고 `OPENCLAW_LIVE_OPENAI_KEY` (단일 override)
- 예시 모델: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- 특정 설치 또는 API key 동작이 다를 경우 `openclaw models list --provider openai`로 계정/모델 사용 가능 여부를 확인하세요.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 기본 transport는 `auto`입니다(WebSocket 우선, SSE fallback)
- 모델별 override: `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, 또는 `"auto"`)
- OpenAI Responses WebSocket warm-up은 기본적으로 `params.openaiWsWarmup`을 통해 활성화됩니다(`true`/`false`)
- OpenAI priority processing은 `agents.defaults.models["openai/<model>"].params.serviceTier`로 활성화할 수 있습니다
- `/fast`와 `params.fastMode`는 직접 `openai/*` Responses 요청을 `api.openai.com`의 `service_tier=priority`로 매핑합니다
- 공유 `/fast` 토글 대신 명시적인 tier를 원하면 `params.serviceTier`를 사용하세요
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는 일반적인 OpenAI 호환 프록시가 아니라 `api.openai.com`에 대한 네이티브 OpenAI 트래픽에만 적용됩니다
- 네이티브 OpenAI 경로는 Responses `store`, prompt-cache 힌트, OpenAI reasoning 호환 payload shaping도 유지하지만 프록시 경로는 그렇지 않습니다
- `openai/gpt-5.3-codex-spark`는 live OpenAI API 요청에서 거부되고 현재 Codex 카탈로그에도 노출되지 않기 때문에 OpenClaw에서 의도적으로 숨겨집니다

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- 인증: `ANTHROPIC_API_KEY`
- 선택적 회전: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, 그리고 `OPENCLAW_LIVE_ANTHROPIC_KEY` (단일 override)
- 예시 모델: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 직접 공개 Anthropic 요청은 `api.anthropic.com`으로 전송되는 API-key 및 OAuth 인증 트래픽을 포함해 공유 `/fast` 토글과 `params.fastMode`를 지원합니다. OpenClaw는 이를 Anthropic `service_tier` (`auto` vs `standard_only`)로 매핑합니다
- 권장 Claude CLI config는 모델 ref를 정식 형식으로 유지하고 CLI
  백엔드를 별도로 선택합니다: `anthropic/claude-opus-4-7`과
  `agents.defaults.agentRuntime.id: "claude-cli"`. 레거시
  `claude-cli/claude-opus-4-7` ref도 호환성을 위해 계속 동작합니다.

<Note>
Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려주었으므로, Anthropic이 새로운 정책을 발표하지 않는 한 OpenClaw는 Claude CLI 재사용과 `claude -p` 사용을 이 통합에서 허용된 것으로 취급합니다. Anthropic setup-token은 여전히 지원되는 OpenClaw 토큰 경로로 제공되지만, OpenClaw는 이제 가능할 경우 Claude CLI 재사용과 `claude -p`를 선호합니다.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- 인증: OAuth (ChatGPT)
- PI 모델 ref: `openai-codex/gpt-5.5`
- 네이티브 Codex app-server harness ref: `openai/gpt-5.5`와 `agents.defaults.agentRuntime.id: "codex"`
- 네이티브 Codex app-server harness 문서: [Codex harness](/ko/plugins/codex-harness)
- 레거시 모델 ref: `codex/gpt-*`
- Plugin 경계: `openai-codex/*`는 OpenAI plugin을 로드하며, 네이티브 Codex app-server plugin은 Codex harness 런타임 또는 레거시 `codex/*` ref로만 선택됩니다.
- CLI: `openclaw onboard --auth-choice openai-codex` 또는 `openclaw models auth login --provider openai-codex`
- 기본 transport는 `auto`입니다(WebSocket 우선, SSE fallback)
- PI 모델별 override: `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, 또는 `"auto"`)
- `params.serviceTier`는 네이티브 Codex Responses 요청(`chatgpt.com/backend-api`)에도 전달됩니다
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는 일반적인 OpenAI 호환 프록시가 아니라 `chatgpt.com/backend-api`에 대한 네이티브 Codex 트래픽에만 붙습니다
- 직접 `openai/*`와 같은 `/fast` 토글 및 `params.fastMode` config를 공유하며, OpenClaw는 이를 `service_tier=priority`로 매핑합니다
- `openai-codex/gpt-5.5`는 Codex 카탈로그의 네이티브 `contextWindow = 400000`과 기본 런타임 `contextTokens = 272000`을 사용합니다. 런타임 상한은 `models.providers.openai-codex.models[].contextTokens`로 override하세요
- 정책 참고: OpenAI Codex OAuth는 OpenClaw 같은 외부 도구/워크플로에 대해 명시적으로 지원됩니다.
- Codex OAuth/구독 경로를 원하면 `openai-codex/gpt-5.5`를 사용하고, API-key 설정과 로컬 카탈로그가 공개 API 경로를 노출하는 경우 `openai/gpt-5.5`를 사용하세요.

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

<CardGroup cols={3}>
  <Card title="GLM models" href="/ko/providers/glm">
    Z.AI Coding Plan 또는 일반 API 엔드포인트.
  </Card>
  <Card title="MiniMax" href="/ko/providers/minimax">
    MiniMax Coding Plan OAuth 또는 API key 액세스.
  </Card>
  <Card title="Qwen Cloud" href="/ko/providers/qwen">
    Qwen Cloud provider 표면과 Alibaba DashScope 및 Coding Plan 엔드포인트 매핑.
  </Card>
</CardGroup>

### OpenCode

- 인증: `OPENCODE_API_KEY` (또는 `OPENCODE_ZEN_API_KEY`)
- Zen 런타임 provider: `opencode`
- Go 런타임 provider: `opencode-go`
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
- 선택적 회전: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` fallback, 그리고 `OPENCLAW_LIVE_GEMINI_KEY` (단일 override)
- 예시 모델: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 호환성: `google/gemini-3.1-flash-preview`를 사용하는 레거시 OpenClaw config는 `google/gemini-3-flash-preview`로 정규화됩니다
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive`는 Google dynamic thinking을 사용합니다. Gemini 3/3.1은 고정 `thinkingLevel`을 생략하고, Gemini 2.5는 `thinkingBudget: -1`을 보냅니다.
- 직접 Gemini 실행은 `agents.defaults.models["google/<model>"].params.cachedContent`(또는 레거시 `cached_content`)도 받아 provider 네이티브 `cachedContents/...` 핸들을 전달합니다. Gemini 캐시 적중은 OpenClaw `cacheRead`로 표시됩니다.

### Google Vertex 및 Gemini CLI

- Providers: `google-vertex`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC를 사용하고, Gemini CLI는 자체 OAuth 흐름을 사용합니다

<Warning>
OpenClaw의 Gemini CLI OAuth는 비공식 통합입니다. 일부 사용자는 서드파티 클라이언트 사용 후 Google 계정 제한을 보고했습니다. 진행하기로 한다면 Google 약관을 검토하고 중요하지 않은 계정을 사용하세요.
</Warning>

Gemini CLI OAuth는 번들된 `google` plugin의 일부로 제공됩니다.

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
  <Step title="plugin 활성화">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="로그인">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    기본 모델: `google-gemini-cli/gemini-3-flash-preview`. 클라이언트 ID나 secret을 `openclaw.json`에 붙여넣지 **않습니다**. CLI 로그인 흐름은 gateway 호스트의 auth profiles에 토큰을 저장합니다.

  </Step>
  <Step title="프로젝트 설정(필요한 경우)">
    로그인 후 요청이 실패하면 gateway 호스트에서 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하세요.
  </Step>
</Steps>

Gemini CLI JSON 답장은 `response`에서 파싱되며, 사용량은 `stats`로 fallback하고, `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.

### Z.AI (GLM)

- Provider: `zai`
- 인증: `ZAI_API_KEY`
- 예시 모델: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 별칭: `z.ai/*` 및 `z-ai/*`는 `zai/*`로 정규화됩니다
  - `zai-api-key`는 일치하는 Z.AI 엔드포인트를 자동 감지합니다. `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`은 특정 표면을 강제합니다

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 예시 모델: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- 인증: `KILOCODE_API_KEY`
- 예시 모델: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- 기본 URL: `https://api.kilo.ai/api/gateway/`
- 정적 fallback 카탈로그는 `kilocode/kilo/auto`를 포함하며, live `https://api.kilo.ai/api/gateway/models` 검색은 런타임 카탈로그를 더 확장할 수 있습니다.
- `kilocode/kilo/auto` 뒤의 정확한 업스트림 라우팅은 OpenClaw에 하드코딩되지 않고 Kilo Gateway가 소유합니다.

설정 세부 정보는 [/providers/kilocode](/ko/providers/kilocode)를 참조하세요.

### 기타 번들 provider plugins

| Provider                | ID                               | 인증 env                                                     | 예시 모델                                        |
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

#### 알아두면 좋은 특이사항

<AccordionGroup>
  <Accordion title="OpenRouter">
    검증된 `openrouter.ai` 경로에서만 자체 앱 attribution 헤더와 Anthropic `cache_control` 마커를 적용합니다. DeepSeek, Moonshot, ZAI ref는 OpenRouter가 관리하는 prompt caching에 대해 cache-TTL 적용 대상이지만 Anthropic cache 마커는 받지 않습니다. 프록시 스타일의 OpenAI 호환 경로이므로 네이티브 OpenAI 전용 shaping(`serviceTier`, Responses `store`, prompt-cache 힌트, OpenAI reasoning 호환성)은 건너뜁니다. Gemini 기반 ref는 프록시 Gemini thought-signature 정리만 유지합니다.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 기반 ref는 동일한 프록시 Gemini 정리 경로를 따릅니다. `kilocode/kilo/auto` 및 기타 프록시 reasoning 미지원 ref는 프록시 reasoning 주입을 건너뜁니다.
  </Accordion>
  <Accordion title="MiniMax">
    API-key onboarding은 명시적인 텍스트 전용 M2.7 채팅 모델 정의를 기록합니다. 이미지 이해는 plugin이 소유하는 `MiniMax-VL-01` 미디어 provider에 남아 있습니다.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses 경로를 사용합니다. `/fast` 또는 `params.fastMode: true`는 `grok-3`, `grok-3-mini`, `grok-4`, `grok-4-0709`를 해당 `*-fast` 변형으로 다시 작성합니다. `tool_stream`은 기본적으로 활성화되며, `agents.defaults.models["xai/<model>"].params.tool_stream=false`로 비활성화하세요.
  </Accordion>
  <Accordion title="Cerebras">
    GLM 모델은 `zai-glm-4.7` / `zai-glm-4.6`을 사용합니다. OpenAI 호환 기본 URL은 `https://api.cerebras.ai/v1`입니다.
  </Accordion>
</AccordionGroup>

## `models.providers`를 통한 providers (사용자 지정/기본 URL)

**사용자 지정** providers 또는 OpenAI/Anthropic 호환 프록시를 추가하려면 `models.providers`(또는 `models.json`)를 사용하세요.

아래의 많은 번들 provider plugins는 이미 기본 카탈로그를 제공합니다. 기본 base URL, 헤더, 모델 목록을 override하려는 경우에만 명시적인 `models.providers.<id>` 항목을 사용하세요.

### Moonshot AI (Kimi)

Moonshot은 번들 provider plugin으로 제공됩니다. 기본적으로 내장 provider를 사용하고, base URL 또는 모델 메타데이터를 override해야 할 때만 명시적인 `models.providers.moonshot` 항목을 추가하세요.

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

Volcano Engine (화산엔진)은 중국에서 Doubao 및 기타 모델에 대한 액세스를 제공합니다.

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

온보딩은 기본적으로 코딩 표면을 사용하지만, 일반 `volcengine/*` 카탈로그도 동시에 등록됩니다.

온보딩/configure 모델 선택기에서 Volcengine 인증 선택은 `volcengine/*`와 `volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않았다면 OpenClaw는 빈 provider 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 fallback합니다.

<Tabs>
  <Tab title="표준 모델">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="코딩 모델 (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (국제)

BytePlus ARK는 국제 사용자를 위해 Volcano Engine과 동일한 모델에 대한 액세스를 제공합니다.

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

온보딩은 기본적으로 코딩 표면을 사용하지만, 일반 `byteplus/*` 카탈로그도 동시에 등록됩니다.

온보딩/configure 모델 선택기에서 BytePlus 인증 선택은 `byteplus/*`와 `byteplus-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않았다면 OpenClaw는 빈 provider 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 fallback합니다.

<Tabs>
  <Tab title="표준 모델">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="코딩 모델 (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

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

MiniMax는 사용자 지정 엔드포인트를 사용하므로 `models.providers`를 통해 구성합니다.

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- 인증: `minimax`에는 `MINIMAX_API_KEY`; `minimax-portal`에는 `MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`

설정 세부 정보, 모델 옵션, config 스니펫은 [/providers/minimax](/ko/providers/minimax)를 참조하세요.

<Note>
MiniMax의 Anthropic 호환 스트리밍 경로에서는 명시적으로 설정하지 않는 한 OpenClaw가 기본적으로 thinking을 비활성화하며, `/fast on`은 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 작성합니다.
</Note>

plugin 소유 capability 분리:

- 텍스트/채팅 기본값은 `minimax/MiniMax-M2.7`에 유지
- 이미지 생성은 `minimax/image-01` 또는 `minimax-portal/image-01`
- 이미지 이해는 두 MiniMax 인증 경로 모두에서 plugin 소유 `MiniMax-VL-01`
- Web 검색은 provider ID `minimax`에 유지

### LM Studio

LM Studio는 네이티브 API를 사용하는 번들 provider plugin으로 제공됩니다.

- Provider: `lmstudio`
- 인증: `LM_API_TOKEN`
- 기본 추론 base URL: `http://localhost:1234/v1`

그런 다음 모델을 설정하세요(`http://localhost:1234/api/v1/models`가 반환하는 ID 중 하나로 교체):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw는 검색 + 자동 로드를 위해 LM Studio의 네이티브 `/api/v1/models`와 `/api/v1/models/load`를 사용하고, 기본적으로 추론에는 `/v1/chat/completions`를 사용합니다. 설정 및 문제 해결은 [/providers/lmstudio](/ko/providers/lmstudio)를 참조하세요.

### Ollama

Ollama는 번들 provider plugin으로 제공되며 Ollama의 네이티브 API를 사용합니다.

- Provider: `ollama`
- 인증: 필요 없음(로컬 서버)
- 예시 모델: `ollama/llama3.3`
- 설치: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama를 설치한 다음 모델을 pull합니다:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama는 `OLLAMA_API_KEY`로 옵트인하면 로컬 `http://127.0.0.1:11434`에서 감지되며, 번들 provider plugin은 Ollama를 `openclaw onboard`와 모델 선택기에 직접 추가합니다. onboarding, cloud/로컬 모드, 사용자 지정 구성은 [/providers/ollama](/ko/providers/ollama)를 참조하세요.

### vLLM

vLLM은 로컬/자체 호스팅 OpenAI 호환 서버용 번들 provider plugin으로 제공됩니다.

- Provider: `vllm`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:8000/v1`

로컬에서 자동 검색에 옵트인하려면(서버가 인증을 강제하지 않으면 어떤 값이든 가능):

```bash
export VLLM_API_KEY="vllm-local"
```

그런 다음 모델을 설정하세요(`/v1/models`가 반환하는 ID 중 하나로 교체):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/ko/providers/vllm)을 참조하세요.

### SGLang

SGLang은 빠른 자체 호스팅 OpenAI 호환 서버용 번들 provider plugin으로 제공됩니다.

- Provider: `sglang`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:30000/v1`

로컬에서 자동 검색에 옵트인하려면(서버가 인증을 강제하지 않으면 어떤 값이든 가능):

```bash
export SGLANG_API_KEY="sglang-local"
```

그런 다음 모델을 설정하세요(`/v1/models`가 반환하는 ID 중 하나로 교체):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/sglang](/ko/providers/sglang)을 참조하세요.

### 로컬 프록시 (LM Studio, vLLM, LiteLLM 등)

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

<AccordionGroup>
  <Accordion title="기본 선택 필드">
    사용자 지정 providers의 경우 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는 선택 사항입니다. 생략하면 OpenClaw는 기본적으로 다음 값을 사용합니다.

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    권장 사항: 프록시/모델 한도와 일치하는 명시적 값을 설정하세요.

  </Accordion>
  <Accordion title="프록시 경로 shaping 규칙">
    - 네이티브가 아닌 엔드포인트에서 `api: "openai-completions"`를 사용할 때(호스트가 `api.openai.com`이 아닌 비어 있지 않은 `baseUrl`), OpenClaw는 지원되지 않는 `developer` 역할에 대한 provider 400 오류를 피하기 위해 `compat.supportsDeveloperRole: false`를 강제합니다.
    - 프록시 스타일 OpenAI 호환 경로는 네이티브 OpenAI 전용 요청 shaping도 건너뜁니다: `service_tier` 없음, Responses `store` 없음, Completions `store` 없음, prompt-cache 힌트 없음, OpenAI reasoning 호환 payload shaping 없음, 숨겨진 OpenClaw attribution 헤더 없음.
    - vendor별 필드가 필요한 OpenAI 호환 Completions 프록시의 경우 `agents.defaults.models["provider/model"].params.extra_body`(또는 `extraBody`)를 설정하여 추가 JSON을 아웃바운드 요청 본문에 병합하세요.
    - vLLM chat-template 제어에는 `agents.defaults.models["provider/model"].params.chat_template_kwargs`를 설정하세요. 세션 thinking level이 꺼져 있을 때 OpenClaw는 `vllm/nemotron-3-*`에 대해 자동으로 `enable_thinking: false` 및 `force_nonempty_content: true`를 보냅니다.
    - `baseUrl`이 비어 있거나 생략되면 OpenClaw는 기본 OpenAI 동작을 유지합니다(`api.openai.com`으로 해석됨).
    - 안전을 위해 명시적인 `compat.supportsDeveloperRole: true`도 네이티브가 아닌 `openai-completions` 엔드포인트에서는 여전히 override됩니다.

  </Accordion>
</AccordionGroup>

## CLI 예시

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

전체 구성 예시는 [Configuration](/ko/gateway/configuration)도 참조하세요.

## 관련 항목

- [Configuration reference](/ko/gateway/config-agents#agent-defaults) — 모델 config 키
- [Model failover](/ko/concepts/model-failover) — fallback 체인 및 재시도 동작
- [Models](/ko/concepts/models) — 모델 구성 및 별칭
- [Providers](/ko/providers) — provider별 설정 가이드
