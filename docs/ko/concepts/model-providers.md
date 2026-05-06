---
read_when:
    - 제공자별 모델 설정 참조가 필요합니다
    - 모델 제공업체용 예시 설정이나 CLI 온보딩 명령이 필요한 경우
sidebarTitle: Model providers
summary: 예제 구성 + CLI 흐름이 포함된 모델 제공자 개요
title: 모델 제공자
x-i18n:
    generated_at: "2026-05-06T09:02:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/model providers **LLM/model 공급자**(WhatsApp/Telegram 같은 채팅 채널이 아님)에 대한 참고 자료입니다. 모델 선택 규칙은 [Models](/ko/concepts/models)를 참조하세요.

## 빠른 규칙

<AccordionGroup>
  <Accordion title="모델 참조 및 CLI 도우미">
    - 모델 참조는 `provider/model`을 사용합니다(예: `opencode/claude-opus-4-6`).
    - `agents.defaults.models`는 설정된 경우 허용 목록으로 작동합니다.
    - CLI 도우미: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens`는 공급자 수준 기본값을 설정하고, `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens`는 모델별로 이를 재정의합니다.
    - 폴백 규칙, 쿨다운 프로브, 세션 재정의 지속성: [모델 장애 조치](/ko/concepts/model-failover).

  </Accordion>
  <Accordion title="공급자 인증을 추가해도 기본 모델은 변경되지 않습니다">
    `openclaw configure`는 공급자를 추가하거나 다시 인증할 때 기존 `agents.defaults.model.primary`를 보존합니다. 공급자 Plugin은 인증 구성 패치에서 권장 기본 모델을 여전히 반환할 수 있지만, 기본 모델이 이미 있으면 configure는 이를 "이 모델을 사용할 수 있게 함"으로 처리하며, "현재 기본 모델을 교체함"으로 처리하지 않습니다.

    기본 모델을 의도적으로 전환하려면 `openclaw models set <provider/model>` 또는 `openclaw models auth login --provider <id> --set-default`를 사용하세요.

  </Accordion>
  <Accordion title="OpenAI 공급자/런타임 분리">
    OpenAI 계열 라우트는 접두사별로 구분됩니다.

    - `openai/<model>`에 `agents.defaults.agentRuntime.id: "codex"`를 함께 사용하면 네이티브 Codex 앱 서버 하네스를 사용합니다. 이것이 일반적인 ChatGPT/Codex 구독 설정입니다.
    - `openai-codex/<model>`은 PI에서 Codex OAuth를 사용합니다.
    - Codex 런타임 재정의가 없는 `openai/<model>`은 PI에서 직접 OpenAI API 키 공급자를 사용합니다.

    [OpenAI](/ko/providers/openai) 및 [Codex 하네스](/ko/plugins/codex-harness)를 참조하세요. 공급자/런타임 분리가 혼란스럽다면 먼저 [에이전트 런타임](/ko/concepts/agent-runtimes)을 읽어 보세요.

    Plugin 자동 활성화도 동일한 경계를 따릅니다. `openai-codex/<model>`은 OpenAI Plugin에 속하며, Codex Plugin은 `agentRuntime.id: "codex"` 또는 레거시 `codex/<model>` 참조로 활성화됩니다.

    `agentRuntime.id: "codex"`가 설정된 경우 네이티브 Codex 앱 서버 하네스를 통해 GPT-5.5를 사용할 수 있고, Codex OAuth용 PI에서는 `openai-codex/gpt-5.5`를 통해, 계정에서 노출되는 경우 직접 API 키 트래픽용 PI에서는 `openai/gpt-5.5`를 통해 사용할 수 있습니다.

  </Accordion>
  <Accordion title="CLI 런타임">
    CLI 런타임도 동일한 분리를 사용합니다. `anthropic/claude-*`, `google/gemini-*`, `openai/gpt-*` 같은 표준 모델 참조를 선택한 다음, 로컬 CLI 백엔드를 원할 때 `agents.defaults.agentRuntime.id`를 `claude-cli`, `google-gemini-cli`, 또는 `codex-cli`로 설정하세요.

    레거시 `claude-cli/*`, `google-gemini-cli/*`, `codex-cli/*` 참조는 런타임을 별도로 기록한 상태에서 표준 공급자 참조로 다시 마이그레이션됩니다.

  </Accordion>
</AccordionGroup>

## Plugin 소유 공급자 동작

대부분의 공급자별 로직은 공급자 Plugin(`registerProvider(...)`)에 있고, OpenClaw는 일반 추론 루프를 유지합니다. Plugin은 온보딩, 모델 카탈로그, 인증 환경 변수 매핑, 전송/구성 정규화, 도구 스키마 정리, 장애 조치 분류, OAuth 갱신, 사용량 보고, 사고/추론 프로필 등을 소유합니다.

공급자 SDK 훅과 번들 Plugin 예제의 전체 목록은 [공급자 Plugin](/ko/plugins/sdk-provider-plugins)에 있습니다. 완전히 사용자 지정 요청 실행기가 필요한 공급자는 별도의 더 깊은 확장 표면입니다.

<Note>
공급자 소유 러너 동작은 재생 정책, 도구 스키마 정규화, 스트림 래핑, 전송/요청 도우미 같은 명시적 공급자 훅에 있습니다. 레거시 `ProviderPlugin.capabilities` 정적 백은 호환성 전용이며, 공유 러너 로직에서 더 이상 읽지 않습니다.
</Note>

## API 키 순환

<AccordionGroup>
  <Accordion title="키 소스 및 우선순위">
    여러 키를 다음으로 구성하세요.

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 라이브 재정의, 가장 높은 우선순위)
    - `<PROVIDER>_API_KEYS`(쉼표 또는 세미콜론 목록)
    - `<PROVIDER>_API_KEY`(기본 키)
    - `<PROVIDER>_API_KEY_*`(번호가 붙은 목록, 예: `<PROVIDER>_API_KEY_1`)

    Google 공급자의 경우 `GOOGLE_API_KEY`도 폴백으로 포함됩니다. 키 선택 순서는 우선순위를 보존하고 값을 중복 제거합니다.

  </Accordion>
  <Accordion title="순환이 시작되는 시점">
    - 요청은 속도 제한 응답에서만 다음 키로 재시도됩니다(예: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, 또는 주기적인 사용량 제한 메시지).
    - 속도 제한이 아닌 실패는 즉시 실패하며, 키 순환을 시도하지 않습니다.
    - 모든 후보 키가 실패하면 마지막 시도에서 나온 최종 오류가 반환됩니다.

  </Accordion>
</AccordionGroup>

## 내장 공급자(pi-ai 카탈로그)

OpenClaw는 pi-ai 카탈로그와 함께 제공됩니다. 이러한 공급자는 `models.providers` 구성이 **필요 없습니다**. 인증을 설정하고 모델을 선택하기만 하면 됩니다.

### OpenAI

- 공급자: `openai`
- 인증: `OPENAI_API_KEY`
- 선택적 순환: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, 그리고 `OPENCLAW_LIVE_OPENAI_KEY`(단일 재정의)
- 예제 모델: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- 특정 설치 또는 API 키가 다르게 동작하는 경우 `openclaw models list --provider openai`로 계정/모델 사용 가능 여부를 확인하세요.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 기본 전송은 `auto`입니다(WebSocket 우선, SSE 폴백).
- 모델별 재정의는 `agents.defaults.models["openai/<model>"].params.transport`(`"sse"`, `"websocket"`, 또는 `"auto"`)를 통해 설정합니다.
- OpenAI Responses WebSocket 워밍업은 기본적으로 `params.openaiWsWarmup`(`true`/`false`)를 통해 활성화됩니다.
- OpenAI 우선순위 처리는 `agents.defaults.models["openai/<model>"].params.serviceTier`를 통해 활성화할 수 있습니다.
- `/fast`와 `params.fastMode`는 직접 `openai/*` Responses 요청을 `api.openai.com`에서 `service_tier=priority`로 매핑합니다.
- 공유 `/fast` 토글 대신 명시적 티어를 원할 때는 `params.serviceTier`를 사용하세요.
- 숨겨진 OpenClaw 기여 표시 헤더(`originator`, `version`, `User-Agent`)는 `api.openai.com`으로 가는 네이티브 OpenAI 트래픽에만 적용되며, 일반 OpenAI 호환 프록시에는 적용되지 않습니다.
- 네이티브 OpenAI 라우트는 Responses `store`, 프롬프트 캐시 힌트, OpenAI 추론 호환 페이로드 형성도 유지합니다. 프록시 라우트는 그렇지 않습니다.
- `openai/gpt-5.3-codex-spark`는 라이브 OpenAI API 요청이 이를 거부하고 현재 Codex 카탈로그가 이를 노출하지 않으므로 OpenClaw에서 의도적으로 억제됩니다.

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- 공급자: `anthropic`
- 인증: `ANTHROPIC_API_KEY`
- 선택적 순환: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, 그리고 `OPENCLAW_LIVE_ANTHROPIC_KEY`(단일 재정의)
- 예제 모델: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 직접 공개 Anthropic 요청은 공유 `/fast` 토글과 `params.fastMode`를 지원하며, `api.anthropic.com`으로 전송되는 API 키 및 OAuth 인증 트래픽을 포함합니다. OpenClaw는 이를 Anthropic `service_tier`(`auto` 대 `standard_only`)로 매핑합니다.
- 선호되는 Claude CLI 구성은 모델 참조를 표준으로 유지하고 CLI
  백엔드를 별도로 선택합니다. `anthropic/claude-opus-4-7`과
  `agents.defaults.agentRuntime.id: "claude-cli"`를 사용하세요. 레거시
  `claude-cli/claude-opus-4-7` 참조도 호환성을 위해 계속 작동합니다.

<Note>
Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려 주었으므로, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 이 통합에서 Claude CLI 재사용 및 `claude -p` 사용을 승인된 것으로 취급합니다. Anthropic setup-token은 지원되는 OpenClaw 토큰 경로로 계속 제공되지만, 이제 OpenClaw는 사용 가능한 경우 Claude CLI 재사용 및 `claude -p`를 선호합니다.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- 공급자: `openai-codex`
- 인증: OAuth(ChatGPT)
- PI 모델 참조: `openai-codex/gpt-5.5`
- 네이티브 Codex 앱 서버 하네스 참조: `agents.defaults.agentRuntime.id: "codex"`와 함께 `openai/gpt-5.5`
- 네이티브 Codex 앱 서버 하네스 문서: [Codex 하네스](/ko/plugins/codex-harness)
- 레거시 모델 참조: `codex/gpt-*`
- Plugin 경계: `openai-codex/*`는 OpenAI Plugin을 로드합니다. 네이티브 Codex 앱 서버 Plugin은 Codex 하네스 런타임 또는 레거시 `codex/*` 참조로만 선택됩니다.
- CLI: `openclaw onboard --auth-choice openai-codex` 또는 `openclaw models auth login --provider openai-codex`
- 기본 전송은 `auto`입니다(WebSocket 우선, SSE 폴백).
- PI 모델별 재정의는 `agents.defaults.models["openai-codex/<model>"].params.transport`(`"sse"`, `"websocket"`, 또는 `"auto"`)를 통해 설정합니다.
- `params.serviceTier`도 네이티브 Codex Responses 요청(`chatgpt.com/backend-api`)에서 전달됩니다.
- 숨겨진 OpenClaw 기여 표시 헤더(`originator`, `version`, `User-Agent`)는 `chatgpt.com/backend-api`로 가는 네이티브 Codex 트래픽에만 첨부되며, 일반 OpenAI 호환 프록시에는 첨부되지 않습니다.
- 직접 `openai/*`와 동일한 `/fast` 토글 및 `params.fastMode` 구성을 공유합니다. OpenClaw는 이를 `service_tier=priority`로 매핑합니다.
- `openai-codex/gpt-5.5`는 Codex 카탈로그 네이티브 `contextWindow = 400000`과 기본 런타임 `contextTokens = 272000`을 사용합니다. 런타임 상한은 `models.providers.openai-codex.models[].contextTokens`로 재정의하세요.
- 정책 참고: OpenAI Codex OAuth는 OpenClaw 같은 외부 도구/워크플로에 대해 명시적으로 지원됩니다.
- 일반적인 구독 및 네이티브 Codex 런타임 경로의 경우 `openai-codex` 인증으로 로그인하되, `agents.defaults.agentRuntime.id: "codex"`와 함께 `openai/gpt-5.5`를 구성하세요.
- PI를 통한 Codex OAuth/구독 경로를 원할 때만 `openai-codex/gpt-5.5`를 사용하세요. API 키 설정과 로컬 카탈로그가 공개 API 경로를 노출하는 경우 Codex 런타임 재정의 없이 `openai/gpt-5.5`를 사용하세요.
- 이전 `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*`, `openai-codex/gpt-5.3*` 참조는 ChatGPT/Codex OAuth 계정이 이를 거부하므로 억제됩니다. 대신 `openai-codex/gpt-5.5` 또는 네이티브 Codex 런타임 경로를 사용하세요.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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
  <Card title="GLM 모델" href="/ko/providers/glm">
    Z.AI Coding Plan 또는 일반 API 엔드포인트.
  </Card>
  <Card title="MiniMax" href="/ko/providers/minimax">
    MiniMax Coding Plan OAuth 또는 API 키 액세스.
  </Card>
  <Card title="Qwen Cloud" href="/ko/providers/qwen">
    Qwen Cloud 공급자 표면과 Alibaba DashScope 및 Coding Plan 엔드포인트 매핑.
  </Card>
</CardGroup>

### OpenCode

- 인증: `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)
- Zen 런타임 공급자: `opencode`
- Go 런타임 공급자: `opencode-go`
- 예제 모델: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini(API 키)

- 제공자: `google`
- 인증: `GEMINI_API_KEY`
- 선택적 순환: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` 대체, `OPENCLAW_LIVE_GEMINI_KEY`(단일 재정의)
- 예시 모델: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 호환성: `google/gemini-3.1-flash-preview`를 사용하는 기존 OpenClaw 설정은 `google/gemini-3-flash-preview`로 정규화됩니다
- 별칭: `google/gemini-3.1-pro`가 허용되며 Google의 라이브 Gemini API id인 `google/gemini-3.1-pro-preview`로 정규화됩니다
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive`는 Google 동적 thinking을 사용합니다. Gemini 3/3.1은 고정 `thinkingLevel`을 생략하고, Gemini 2.5는 `thinkingBudget: -1`을 보냅니다.
- 직접 Gemini 실행은 제공자 네이티브 `cachedContents/...` 핸들을 전달하기 위해 `agents.defaults.models["google/<model>"].params.cachedContent`(또는 기존 `cached_content`)도 허용합니다. Gemini 캐시 적중은 OpenClaw `cacheRead`로 표시됩니다

### Google Vertex 및 Gemini CLI

- 제공자: `google-vertex`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC를 사용하고, Gemini CLI는 자체 OAuth 흐름을 사용합니다

<Warning>
OpenClaw의 Gemini CLI OAuth는 비공식 통합입니다. 일부 사용자는 서드파티 클라이언트 사용 후 Google 계정 제한을 보고했습니다. 계속 진행하기로 선택한 경우 Google 약관을 검토하고 중요하지 않은 계정을 사용하세요.
</Warning>

Gemini CLI OAuth는 번들 `google` Plugin의 일부로 제공됩니다.

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

    기본 모델: `google-gemini-cli/gemini-3-flash-preview`. `openclaw.json`에 클라이언트 id 또는 secret을 붙여넣지 **않습니다**. CLI 로그인 흐름은 Gateway 호스트의 인증 프로필에 토큰을 저장합니다.

  </Step>
  <Step title="프로젝트 설정(필요한 경우)">
    로그인 후 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하세요.
  </Step>
</Steps>

Gemini CLI JSON 응답은 `response`에서 파싱됩니다. 사용량은 `stats`로 대체되며, `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.

### Z.AI (GLM)

- 제공자: `zai`
- 인증: `ZAI_API_KEY`
- 예시 모델: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 별칭: `z.ai/*` 및 `z-ai/*`는 `zai/*`로 정규화됩니다
  - `zai-api-key`는 일치하는 Z.AI 엔드포인트를 자동 감지합니다. `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`은 특정 표면을 강제합니다

### Vercel AI Gateway

- 제공자: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 예시 모델: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- 제공자: `kilocode`
- 인증: `KILOCODE_API_KEY`
- 예시 모델: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- 기본 URL: `https://api.kilo.ai/api/gateway/`
- 정적 대체 카탈로그에는 `kilocode/kilo/auto`가 포함되어 있습니다. 라이브 `https://api.kilo.ai/api/gateway/models` 탐색은 런타임 카탈로그를 더 확장할 수 있습니다.
- `kilocode/kilo/auto` 뒤의 정확한 업스트림 라우팅은 OpenClaw에 하드코딩되어 있지 않고 Kilo Gateway가 소유합니다.

설정 세부 정보는 [/providers/kilocode](/ko/providers/kilocode)를 참조하세요.

### 기타 번들 제공자 Plugin

| 제공자                  | Id                               | 인증 env                                                     | 예시 모델                                     |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` 또는 `KIMICODE_API_KEY`                       | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### 알아두면 좋은 특이 사항

<AccordionGroup>
  <Accordion title="OpenRouter">
    검증된 `openrouter.ai` 경로에서만 앱 기여도 헤더와 Anthropic `cache_control` 마커를 적용합니다. DeepSeek, Moonshot, ZAI 참조는 OpenRouter 관리형 프롬프트 캐싱에서 캐시 TTL 적용 대상이지만 Anthropic 캐시 마커는 받지 않습니다. 프록시 스타일의 OpenAI 호환 경로이므로 네이티브 OpenAI 전용 셰이핑(`serviceTier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI reasoning 호환성)은 건너뜁니다. Gemini 기반 참조는 프록시 Gemini 사고 서명 정리만 유지합니다.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 기반 참조는 동일한 프록시 Gemini 정리 경로를 따릅니다. `kilocode/kilo/auto` 및 기타 프록시 reasoning 미지원 참조는 프록시 reasoning 주입을 건너뜁니다.
  </Accordion>
  <Accordion title="MiniMax">
    API 키 온보딩은 명시적인 텍스트 전용 M2.7 채팅 모델 정의를 작성합니다. 이미지 이해는 Plugin 소유의 `MiniMax-VL-01` 미디어 제공자에 유지됩니다.
  </Accordion>
  <Accordion title="NVIDIA">
    모델 ID는 `nvidia/<vendor>/<model>` 네임스페이스를 사용합니다(예: `nvidia/moonshotai/kimi-k2.5`와 함께 `nvidia/nvidia/nemotron-...`). 선택기는 리터럴 `<provider>/<model-id>` 구성을 보존하지만 API로 전송되는 정식 키는 단일 접두사를 유지합니다.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses 경로를 사용합니다. `grok-4.3`은 번들 기본 채팅 모델입니다. `/fast` 또는 `params.fastMode: true`는 `grok-3`, `grok-3-mini`, `grok-4`, `grok-4-0709`를 해당 `*-fast` 변형으로 다시 씁니다. `tool_stream`은 기본적으로 켜져 있습니다. `agents.defaults.models["xai/<model>"].params.tool_stream=false`로 비활성화하세요.
  </Accordion>
  <Accordion title="Cerebras">
    번들 `cerebras` 제공자 Plugin으로 제공됩니다. GLM은 `zai-glm-4.7`을 사용합니다. OpenAI 호환 기본 URL은 `https://api.cerebras.ai/v1`입니다.
  </Accordion>
</AccordionGroup>

## `models.providers`를 통한 제공자(사용자 지정/기본 URL)

`models.providers`(또는 `models.json`)를 사용하여 **사용자 지정** 제공자나 OpenAI/Anthropic 호환 프록시를 추가하세요.

아래의 번들 제공자 Plugin 중 다수는 이미 기본 카탈로그를 게시합니다. 기본 기본 URL, 헤더 또는 모델 목록을 재정의하려는 경우에만 명시적인 `models.providers.<id>` 항목을 사용하세요.

Gateway 모델 기능 검사도 명시적인 `models.providers.<id>.models[]` 메타데이터를 읽습니다. 사용자 지정 또는 프록시 모델이 이미지를 허용하는 경우, 해당 모델에 `input: ["text", "image"]`를 설정하여 WebChat과 Node 출처 첨부 경로가 이미지를 텍스트 전용 미디어 참조 대신 네이티브 모델 입력으로 전달하게 하세요.

### Moonshot AI(Kimi)

Moonshot은 번들 제공자 Plugin으로 제공됩니다. 기본적으로 내장 제공자를 사용하고, 기본 URL 또는 모델 메타데이터를 재정의해야 할 때만 명시적인 `models.providers.moonshot` 항목을 추가하세요.

- 제공자: `moonshot`
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

### Kimi 코딩

Kimi Coding은 Moonshot AI의 Anthropic 호환 엔드포인트를 사용합니다.

- 제공자: `kimi`
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

Legacy `kimi/k2p5`는 호환성 모델 ID로 계속 허용됩니다.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎)은 중국에서 Doubao 및 기타 모델에 대한 액세스를 제공합니다.

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

온보딩/구성 모델 선택기에서 Volcengine 인증 선택은 `volcengine/*` 및 `volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우, OpenClaw는 비어 있는 공급자 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

<Tabs>
  <Tab title="표준 모델">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="코딩 모델(volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus(국제)

BytePlus ARK는 국제 사용자가 Volcano Engine과 동일한 모델에 액세스할 수 있게 합니다.

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

온보딩/구성 모델 선택기에서 BytePlus 인증 선택은 `byteplus/*` 및 `byteplus-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우, OpenClaw는 비어 있는 공급자 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

<Tabs>
  <Tab title="표준 모델">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="코딩 모델(byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic은 `synthetic` 공급자 뒤에서 Anthropic 호환 모델을 제공합니다.

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

MiniMax는 사용자 지정 엔드포인트를 사용하므로 `models.providers`를 통해 구성됩니다.

- MiniMax OAuth(글로벌): `--auth-choice minimax-global-oauth`
- MiniMax OAuth(CN): `--auth-choice minimax-cn-oauth`
- MiniMax API 키(글로벌): `--auth-choice minimax-global-api`
- MiniMax API 키(CN): `--auth-choice minimax-cn-api`
- 인증: `minimax`에는 `MINIMAX_API_KEY`, `minimax-portal`에는 `MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`

설정 세부 정보, 모델 옵션, 구성 스니펫은 [/providers/minimax](/ko/providers/minimax)를 참조하세요.

<Note>
MiniMax의 Anthropic 호환 스트리밍 경로에서 OpenClaw는 명시적으로 설정하지 않는 한 기본적으로 thinking을 비활성화하며, `/fast on`은 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
</Note>

Plugin 소유 기능 분할:

- 텍스트/채팅 기본값은 `minimax/MiniMax-M2.7`에 유지됩니다.
- 이미지 생성은 `minimax/image-01` 또는 `minimax-portal/image-01`입니다.
- 이미지 이해는 두 MiniMax 인증 경로 모두에서 Plugin 소유 `MiniMax-VL-01`입니다.
- Web search는 공급자 ID `minimax`에 유지됩니다.

### LM Studio

LM Studio는 네이티브 API를 사용하는 번들 공급자 Plugin으로 제공됩니다.

- Provider: `lmstudio`
- 인증: `LM_API_TOKEN`
- 기본 추론 기본 URL: `http://localhost:1234/v1`

그런 다음 모델을 설정합니다(`http://localhost:1234/api/v1/models`가 반환한 ID 중 하나로 바꾸세요).

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw는 검색 및 자동 로드에 LM Studio의 네이티브 `/api/v1/models` 및 `/api/v1/models/load`를 사용하고, 기본적으로 추론에는 `/v1/chat/completions`를 사용합니다. LM Studio JIT 로딩, TTL, 자동 제거가 모델 수명 주기를 소유하게 하려면 `models.providers.lmstudio.params.preload: false`를 설정하세요. 설정 및 문제 해결은 [/providers/lmstudio](/ko/providers/lmstudio)를 참조하세요.

### Ollama

Ollama는 번들 공급자 Plugin으로 제공되며 Ollama의 네이티브 API를 사용합니다.

- Provider: `ollama`
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

`OLLAMA_API_KEY`로 옵트인하면 Ollama가 `http://127.0.0.1:11434`에서 로컬로 감지되며, 번들 공급자 Plugin이 Ollama를 `openclaw onboard`와 모델 선택기에 직접 추가합니다. 온보딩, 클라우드/로컬 모드, 사용자 지정 구성은 [/providers/ollama](/ko/providers/ollama)를 참조하세요.

### vLLM

vLLM은 로컬/자체 호스팅 OpenAI 호환 서버를 위한 번들 공급자 Plugin으로 제공됩니다.

- Provider: `vllm`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 URL: `http://127.0.0.1:8000/v1`

로컬에서 자동 검색에 옵트인하려면 다음을 설정합니다(서버가 인증을 강제하지 않는 경우 어떤 값이든 작동합니다).

```bash
export VLLM_API_KEY="vllm-local"
```

그런 다음 모델을 설정합니다(`/v1/models`가 반환한 ID 중 하나로 바꾸세요).

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/ko/providers/vllm)을 참조하세요.

### SGLang

SGLang은 빠른 자체 호스팅 OpenAI 호환 서버를 위한 번들 공급자 Plugin으로 제공됩니다.

- Provider: `sglang`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 URL: `http://127.0.0.1:30000/v1`

로컬에서 자동 검색에 옵트인하려면 다음을 설정합니다(서버가 인증을 강제하지 않는 경우 어떤 값이든 작동합니다).

```bash
export SGLANG_API_KEY="sglang-local"
```

그런 다음 모델을 설정합니다(`/v1/models`가 반환한 ID 중 하나로 바꾸세요).

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
  <Accordion title="기본 선택 필드">
    사용자 지정 공급자의 경우 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는 선택 사항입니다. 생략하면 OpenClaw는 다음을 기본값으로 사용합니다.

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    권장: 프록시/모델 제한에 맞는 명시적 값을 설정하세요.

  </Accordion>
  <Accordion title="프록시 라우트 형성 규칙">
    - 네이티브가 아닌 엔드포인트(호스트가 `api.openai.com`이 아닌, 비어 있지 않은 모든 `baseUrl`)에서 `api: "openai-completions"`를 사용하는 경우, OpenClaw는 지원되지 않는 `developer` 역할로 인한 공급자 400 오류를 피하기 위해 `compat.supportsDeveloperRole: false`를 강제합니다.
    - 프록시 스타일 OpenAI 호환 라우트도 네이티브 OpenAI 전용 요청 형성을 건너뜁니다. `service_tier` 없음, Responses `store` 없음, Completions `store` 없음, prompt-cache 힌트 없음, OpenAI reasoning 호환 페이로드 형성 없음, 숨겨진 OpenClaw attribution 헤더 없음.
    - 공급자별 필드가 필요한 OpenAI 호환 Completions 프록시의 경우, `agents.defaults.models["provider/model"].params.extra_body`(또는 `extraBody`)를 설정하여 추가 JSON을 발신 요청 본문에 병합하세요.
    - vLLM 채팅 템플릿 제어의 경우 `agents.defaults.models["provider/model"].params.chat_template_kwargs`를 설정하세요. 번들 vLLM Plugin은 세션 thinking 수준이 꺼져 있을 때 `vllm/nemotron-3-*`에 대해 `enable_thinking: false` 및 `force_nonempty_content: true`를 자동으로 전송합니다.
    - 느린 로컬 모델 또는 원격 LAN/tailnet 호스트의 경우 `models.providers.<id>.timeoutSeconds`를 설정하세요. 이렇게 하면 전체 agent 런타임 제한 시간을 늘리지 않고도 연결, 헤더, 본문 스트리밍, 전체 보호된 fetch 중단을 포함한 공급자 모델 HTTP 요청 처리가 확장됩니다.
    - 모델 공급자 HTTP 호출은 구성된 공급자 `baseUrl` 호스트 이름에 대해서만 Surge, Clash, sing-box fake-IP DNS 응답을 `198.18.0.0/15` 및 `fc00::/7`에서 허용합니다. 기타 private, loopback, link-local, metadata 대상에는 여전히 명시적 `models.providers.<id>.request.allowPrivateNetwork: true` 옵트인이 필요합니다.
    - `baseUrl`이 비어 있거나 생략되면 OpenClaw는 기본 OpenAI 동작(`api.openai.com`으로 해석됨)을 유지합니다.
    - 안전을 위해 네이티브가 아닌 `openai-completions` 엔드포인트에서는 명시적 `compat.supportsDeveloperRole: true`도 여전히 재정의됩니다.
    - 직접 연결이 아닌 엔드포인트(표준 `anthropic`이 아닌 모든 공급자 또는 호스트가 공개 `api.anthropic.com` 엔드포인트가 아닌 사용자 지정 `models.providers.anthropic.baseUrl`)에서 `api: "anthropic-messages"`를 사용하는 경우, OpenClaw는 사용자 지정 Anthropic 호환 프록시가 지원되지 않는 beta 플래그를 거부하지 않도록 `claude-code-20250219`, `interleaved-thinking-2025-05-14`, OAuth 마커와 같은 암시적 Anthropic beta 헤더를 억제합니다. 프록시에 특정 beta 기능이 필요한 경우 `models.providers.<id>.headers["anthropic-beta"]`를 명시적으로 설정하세요.

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

- [구성 참조](/ko/gateway/config-agents#agent-defaults) - 모델 구성 키
- [모델 장애 조치](/ko/concepts/model-failover) - fallback 체인 및 재시도 동작
- [모델](/ko/concepts/models) - 모델 구성 및 별칭
- [공급자](/ko/providers) - 공급자별 설정 가이드
