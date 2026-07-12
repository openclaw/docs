---
read_when:
    - 제공자별 모델 설정 참조가 필요합니다
    - 모델 제공업체의 예제 구성 또는 CLI 온보딩 명령이 필요합니다
sidebarTitle: Model providers
summary: 예시 구성 + CLI 흐름을 포함한 모델 제공자 개요
title: 모델 제공업체
x-i18n:
    generated_at: "2026-07-12T15:11:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20477f9f6c8c616b4eca6653a29e0e8c9ffe5049ddfed91c585e9e22cdb669a2
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/모델 제공자**에 대한 참조 문서입니다(WhatsApp/Telegram과 같은 채팅 채널이 아님). 모델 선택 규칙은 [모델](/ko/concepts/models)을 참조하십시오.

## 빠른 규칙

<AccordionGroup>
  <Accordion title="모델 참조와 CLI 도우미">
    - 모델 참조는 `provider/model` 형식을 사용합니다(예: `opencode/claude-opus-4-6`).
    - `agents.defaults.models`가 설정되어 있으면 허용 목록으로 작동합니다.
    - CLI 도우미: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens`는 제공자 수준 기본값을 설정하며, `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens`는 모델별로 이를 재정의합니다.
    - 폴백 규칙, 쿨다운 프로브 및 세션 재정의 지속성: [모델 장애 조치](/ko/concepts/model-failover).

  </Accordion>
  <Accordion title="제공자 인증을 추가해도 기본 모델은 변경되지 않습니다">
    제공자를 추가하거나 다시 인증할 때 `openclaw configure`는 기존 `agents.defaults.model.primary`를 유지합니다. `openclaw models auth login`도 `--set-default`를 전달하지 않는 한 동일하게 작동합니다. 제공자 Plugin이 인증 구성 패치에서 권장 기본 모델을 반환할 수는 있지만, 기본 모델이 이미 존재하면 OpenClaw는 이를 "현재 기본 모델 교체"가 아니라 "이 모델을 사용할 수 있도록 설정"으로 처리합니다.

    기본 모델을 의도적으로 전환하려면 `openclaw models set <provider/model>` 또는 `openclaw models auth login --provider <id> --set-default`를 사용하십시오.

  </Accordion>
  <Accordion title="OpenAI 제공자/런타임 분리">
    OpenAI 모델 참조와 에이전트 런타임은 서로 분리되어 있습니다.

    - `openai/<model>`은 정식 OpenAI 제공자와 모델을 선택합니다. 접두사만으로는 절대 Codex가 선택되지 않습니다.
    - 제공자/모델 런타임 정책이 설정되지 않았거나 `auto`이면, 작성자가 요청을 재정의하지 않은 정확한 공식 HTTPS Platform Responses 또는 ChatGPT Responses 경로에 한해서만 OpenAI가 Codex를 암시적으로 선택할 수 있습니다.
    - 작성된 Completions 어댑터, 사용자 지정 엔드포인트 및 작성된 요청 동작이 있는 경로는 OpenClaw에서 계속 실행됩니다. 공식 평문 HTTP 엔드포인트는 거부됩니다.
    - 레거시 Codex 모델 참조는 doctor가 `openai/<model>`로 다시 작성하는 레거시 구성입니다.
    - 제공자/모델의 `agentRuntime.id: "openclaw"`는 그 외에는 적합한 경로를 명시적으로 OpenClaw에 유지합니다. `agentRuntime.id: "codex"`는 Codex를 요구하며, 유효 경로가 Codex와 호환되지 않으면 안전하게 실패합니다.

    [OpenAI 암시적 에이전트 런타임](/ko/providers/openai#implicit-agent-runtime)과 [Codex 하네스](/ko/plugins/codex-harness)를 참조하십시오. 제공자/런타임 분리가 혼란스럽다면 먼저 [에이전트 런타임](/ko/concepts/agent-runtimes)을 읽으십시오.

    Plugin 자동 활성화에도 동일한 경계가 적용됩니다. 암시적으로 Codex와 호환되는 유효 경로는 Codex Plugin을 활성화할 수 있지만, 명시적인 제공자/모델 `agentRuntime.id: "codex"` 또는 레거시 `codex/<model>` 참조는 이를 필수로 요구합니다. `openai/*` 접두사만으로는 활성화되지 않습니다.

    새로운 OpenAI 설정은 경로별 GPT-5.6 참조를 사용합니다. API 키 설정은
    `openai/gpt-5.6`을 선택하며(장식 없는 직접 API ID는 Sol로 해석됨),
    ChatGPT/Codex OAuth는 네이티브 Codex 카탈로그에 정확한 `openai/gpt-5.6-sol`을
    선택합니다. `openai/gpt-5.5`를 포함한 기존의 명시적 기본 모델은 OpenAI 인증이
    추가되거나 갱신되어도 유지됩니다. GPT-5.5는 GPT-5.6에 액세스할 수 없는 계정을
    위한 명시적 복구 선택지로 두 런타임 모두에서 계속 사용할 수 있습니다.

  </Accordion>
  <Accordion title="CLI 런타임">
    CLI 런타임에도 동일한 분리가 적용됩니다. `anthropic/claude-*` 또는 `google/gemini-*`와 같은 정식 모델 참조를 선택한 다음, 로컬 CLI 백엔드를 사용하려면 제공자/모델 런타임 정책을 `claude-cli` 또는 `google-gemini-cli`로 설정하십시오.

    레거시 `claude-cli/*` 및 `google-gemini-cli/*` 참조는 런타임을 별도로 기록하면서 정식 제공자 참조로 다시 마이그레이션됩니다. 레거시 `codex-cli/*` 참조는 `openai/*`로 마이그레이션되고 Codex 앱 서버 경로를 사용합니다. OpenClaw는 더 이상 번들 Codex CLI 백엔드를 유지하지 않습니다.

  </Accordion>
</AccordionGroup>

## Plugin 소유의 제공자 동작

대부분의 제공자별 로직은 제공자 Plugin(`registerProvider(...)`)에 있으며, OpenClaw는 일반 추론 루프를 유지합니다. Plugin은 온보딩, 모델 카탈로그, 인증 환경 변수 매핑, 전송/구성 정규화, 도구 스키마 정리, 장애 조치 분류, OAuth 갱신, 사용량 보고, 사고/추론 프로필 등을 소유합니다.

제공자 SDK 후크와 번들 Plugin 예제의 전체 목록은 [제공자 Plugin](/ko/plugins/sdk-provider-plugins)에 있습니다. 완전히 사용자 지정된 요청 실행기가 필요한 제공자는 별도의 더 심층적인 확장 표면입니다.

<Note>
제공자 소유 실행기 동작은 재생 정책, 도구 스키마 정규화, 스트림 래핑, 전송/요청 도우미와 같은 명시적 제공자 후크에 있습니다. 레거시 `ProviderPlugin.capabilities` 정적 백은 호환성 전용이며 공유 실행기 로직에서 더 이상 읽지 않습니다.
</Note>

## API 키 순환

<AccordionGroup>
  <Accordion title="키 소스와 우선순위">
    다음을 통해 여러 키를 구성하십시오.

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 라이브 재정의, 최우선)
    - `<PROVIDER>_API_KEYS`(쉼표 또는 세미콜론으로 구분된 목록)
    - `<PROVIDER>_API_KEY`(기본 키)
    - `<PROVIDER>_API_KEY_*`(번호가 지정된 목록, 예: `<PROVIDER>_API_KEY_1`)

    Google 제공자의 경우 `GOOGLE_API_KEY`도 폴백으로 포함됩니다. 키 선택 순서는 우선순위를 유지하고 중복 값을 제거합니다.

  </Accordion>
  <Accordion title="순환이 시작되는 시점">
    - 요청은 속도 제한 응답(예: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` 또는 주기적인 사용량 제한 메시지)이 발생한 경우에만 다음 키로 재시도됩니다.
    - 속도 제한이 아닌 실패는 즉시 실패하며 키 순환을 시도하지 않습니다.
    - 모든 후보 키가 실패하면 마지막 시도의 최종 오류가 반환됩니다.

  </Accordion>
</AccordionGroup>

## 공식 제공자 Plugin

공식 제공자 Plugin은 자체 모델 카탈로그 행을 게시합니다. 이러한 제공자는 `models.providers` 모델 항목이 **필요하지 않습니다**. 제공자 Plugin을 활성화하고 인증을 설정한 다음 모델을 선택하십시오. `models.providers`는 명시적인 사용자 지정 제공자나 시간 제한과 같은 제한적인 요청 설정에만 사용하십시오.

### OpenAI

- 제공자: `openai`
- 인증: `OPENAI_API_KEY`
- 선택적 순환: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` 및 `OPENCLAW_LIVE_OPENAI_KEY`(단일 재정의)
- 새로운 설정의 기본값: `openai/gpt-5.6`; 직접 API에서는 장식 없는 ID가 Sol로 해석됩니다.
- 모델 예시: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- 특정 설치 또는 API 키가 다르게 작동하는 경우 `openclaw models list --provider openai`로 계정/모델 가용성을 확인하십시오.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 기본 전송 방식은 `auto`입니다. OpenClaw는 전송 방식 선택을 공유 모델 런타임에 전달합니다.
- 모델별 재정의는 `agents.defaults.models["openai/<model>"].params.transport`를 통해 설정합니다(`"sse"`, `"websocket"` 또는 `"auto"`).
- `agents.defaults.models["openai/<model>"].params.serviceTier`를 통해 OpenAI 우선 처리 기능을 활성화할 수 있습니다.
- `/fast`와 `params.fastMode`는 `api.openai.com`에 대한 직접 `openai/*` Responses 요청을 `service_tier=priority`에 매핑합니다.
- 공유 `/fast` 토글 대신 명시적 티어를 사용하려면 `params.serviceTier`를 사용하십시오.
- 숨겨진 OpenClaw 귀속 헤더(`originator`, `version`, `User-Agent`)는 `api.openai.com`으로 향하는 네이티브 OpenAI 트래픽에만 적용되며, 일반 OpenAI 호환 프록시에는 적용되지 않습니다.
- 네이티브 OpenAI 경로는 Responses의 `store`, 프롬프트 캐시 힌트 및 OpenAI 추론 호환 페이로드 구성도 유지하지만 프록시 경로는 그렇지 않습니다.
- `openai/gpt-5.3-codex-spark`는 ChatGPT/Codex OAuth를 통해서만 사용할 수 있으며, 직접 OpenAI API 키 및 Azure API 키 경로에서는 거부됩니다.

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

API 조직에서 GPT-5.6을 제공하지 않으면
`openai/gpt-5.5`를 명시적으로 설정하십시오. 일반 온보딩과 재인증은 기존의
명시적 기본 모델을 유지하며, `models auth login --set-default`와
`models set`은 의도적인 교체 경로입니다.

### Anthropic

- 제공자: `anthropic`
- 인증: `ANTHROPIC_API_KEY`
- 선택적 순환: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` 및 `OPENCLAW_LIVE_ANTHROPIC_KEY`(단일 재정의)
- 모델 예시: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 직접 공개 Anthropic 요청은 `api.anthropic.com`으로 전송되는 API 키 및 OAuth 인증 트래픽을 포함하여 공유 `/fast` 토글과 `params.fastMode`를 지원합니다. OpenClaw는 이를 Anthropic `service_tier`(`auto`와 `standard_only`)에 매핑합니다.
- 권장 Claude CLI 구성은 모델 참조를 정식 형식으로 유지하고 CLI
  백엔드를 별도로 선택합니다. 즉, `anthropic/claude-opus-4-8`과
  모델 범위의 `agentRuntime.id: "claude-cli"`를 사용합니다. 레거시
  `claude-cli/claude-opus-4-7` 참조도 호환성을 위해 계속 작동합니다.

<Note>
Claude CLI 재사용(`claude -p`)은 OpenClaw에서 승인된 통합 경로입니다. Anthropic 설정 토큰 인증은 계속 지원되지만, 가능한 경우 OpenClaw는 Claude CLI 재사용을 우선합니다.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- 제공자: `openai`
- 인증: OAuth(ChatGPT)
- 새로운 네이티브 Codex 앱 서버 하네스 참조: `openai/gpt-5.6-sol`
- 네이티브 Codex 앱 서버 하네스 문서: [Codex 하네스](/ko/plugins/codex-harness)
- 레거시 모델 참조: `codex/gpt-*`
- Plugin 경계: `openai/*`는 OpenAI Plugin을 로드하며, 명시적 런타임 정책 또는 제공자가 소유한 유효 경로가 네이티브 Codex 앱 서버 Plugin의 선택 여부를 결정합니다.
- CLI: `openclaw onboard --auth-choice openai` 또는 `openclaw models auth login --provider openai`
- OpenClaw에 내장된 ChatGPT Responses 전송 방식의 기본값은 `auto`입니다(WebSocket 우선, SSE 폴백).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier`, `params.fastMode`는 작성된 내장 요청 설정입니다. 이 설정은 암시적 런타임 선택을 OpenClaw에 유지하며, 네이티브 Codex는 자체 앱 서버 전송 방식과 서비스 티어를 소유합니다.
- 숨겨진 OpenClaw 귀속 헤더(`originator`, `version`, `User-Agent`)는 `chatgpt.com/backend-api`로 향하는 네이티브 Codex 트래픽에만 첨부되며, 일반 OpenAI 호환 프록시에는 첨부되지 않습니다.
- 공유 `/fast` 토글은 런타임 제어로 계속 사용할 수 있으며, 작성된 모델 매개변수와는 별개입니다.
- 네이티브 Codex 카탈로그는 계정 액세스 권한에 따라 정확한 `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna` 참조를 제공할 수 있습니다. 직접 API의 장식 없는 `gpt-5.6` 별칭은 클라이언트 측에서 적용하지 않습니다.
- `openai/gpt-5.5`는 Codex 카탈로그의 네이티브 `contextWindow = 400000`과 기본 런타임 `contextTokens = 272000`을 사용합니다. 런타임 상한을 재정의하려면 `models.providers.openai.models[].contextTokens`를 사용하십시오.
- 새로운 구독 기반 설정에서는 `openai` 인증으로 로그인하고 `openai/gpt-5.6-sol`을 사용하십시오. 해당 Codex 작업 공간에서 GPT-5.6을 제공하지 않으면 `openai/gpt-5.5`를 명시적으로 선택하십시오.
- 그 외에는 적합한 경로를 내장 런타임에 유지하려면 제공자/모델의 `agentRuntime.id: "openclaw"`를 사용하십시오. 런타임이 설정되지 않았거나 `auto`이면 작성된 요청 재정의가 없는 정확한 공식 HTTPS Responses/ChatGPT 호환 경로만 Codex를 암시적으로 선택할 수 있습니다.
- 레거시 Codex GPT 참조는 라이브 제공자 경로가 아니라 레거시 상태입니다. 새 에이전트 구성에는 정식 `openai/*` 참조를 사용하고, 기존의 명시적 `openai/gpt-5.5` 선택을 업그레이드하지 않으면서 오래된 레거시 Codex 모델 참조를 마이그레이션하려면 `openclaw doctor --fix`를 실행하십시오.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
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

### 기타 구독형 호스팅 옵션

<CardGroup cols={3}>
  <Card title="MiniMax" href="/ko/providers/minimax">
    MiniMax Coding Plan OAuth 또는 API 키 액세스입니다.
  </Card>
  <Card title="Qwen Cloud" href="/ko/providers/qwen">
    Qwen Cloud 제공자 기능과 Alibaba DashScope 및 Coding Plan 엔드포인트 매핑을 제공합니다.
  </Card>
  <Card title="Z.AI (GLM)" href="/ko/providers/zai">
    Z.AI Coding Plan 또는 일반 API 엔드포인트입니다.
  </Card>
</CardGroup>

### OpenCode

- 인증: `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)
- Zen 런타임 제공자: `opencode`
- Go 런타임 제공자: `opencode-go`
- 모델 예시: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini(API 키)

- 제공자: `google`
- 인증: `GEMINI_API_KEY`
- 선택적 순환: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` 대체 항목 및 `OPENCLAW_LIVE_GEMINI_KEY`(단일 재정의)
- 모델 예시: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- 호환성: `google/gemini-3.1-flash-preview`를 사용하는 기존 OpenClaw 구성은 `google/gemini-3-flash-preview`로 정규화됩니다.
- 별칭: `google/gemini-3.1-pro`를 사용할 수 있으며 Google의 실제 Gemini API ID인 `google/gemini-3.1-pro-preview`로 정규화됩니다.
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 사고: `/think adaptive`는 Google 동적 사고를 사용합니다. Gemini 3/3.1은 고정된 `thinkingLevel`을 생략하며 Gemini 2.5는 `thinkingBudget: -1`을 전송합니다.
- 직접 Gemini 실행에서는 `agents.defaults.models["google/<model>"].params.cachedContent`(또는 기존 `cached_content`)도 허용하여 제공자 네이티브 `cachedContents/...` 핸들을 전달합니다. Gemini 캐시 적중은 OpenClaw `cacheRead`로 표시됩니다.

### Google Vertex 및 Gemini CLI

- 제공자: `google-vertex`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC를 사용하며 Gemini CLI는 자체 OAuth 흐름을 사용합니다.

<Warning>
OpenClaw의 Gemini CLI OAuth는 비공식 통합입니다. 일부 사용자는 타사 클라이언트를 사용한 후 Google 계정 제한이 발생했다고 보고했습니다. 계속 진행하려면 Google 약관을 검토하고 중요하지 않은 계정을 사용하십시오.
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

    기본 모델: `google-gemini-cli/gemini-3-flash-preview`. 클라이언트 ID나 비밀 값을 `openclaw.json`에 붙여 넣지 **마십시오**. CLI 로그인 흐름은 Gateway 호스트의 인증 프로필에 토큰을 저장합니다.

  </Step>
  <Step title="프로젝트 설정(필요한 경우)">
    로그인 후 요청이 실패하면 Gateway 호스트에서 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하십시오.
  </Step>
</Steps>

Gemini CLI는 기본적으로 `stream-json`을 사용합니다. OpenClaw는 어시스턴트 스트림
메시지를 읽고 `stats.cached`를 `cacheRead`로 정규화합니다. 기존
`--output-format json` 재정의에서도 `response`의 응답 텍스트를 계속 읽습니다.

### Z.AI (GLM)

- 제공자: `zai`
- 인증: `ZAI_API_KEY`
- 모델 예시: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 모델 참조는 표준 `zai/*` 제공자 ID를 사용합니다.
  - `zai-api-key`는 일치하는 Z.AI 엔드포인트를 자동으로 감지하며 `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`은 특정 기능을 강제로 사용합니다.

### Vercel AI Gateway

- 제공자: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 모델 예시: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### 기타 번들 제공자 Plugin

| 제공자                                  | ID                               | 인증 환경 변수                                         | 모델 예시                                                  |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` 또는 `OPENROUTER_API_KEY`          | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` 또는 `CHUTES_OAUTH_TOKEN`           | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                            |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                               |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                         |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                             |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`              | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/ko/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth 또는 `OPENROUTER_API_KEY`           | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [Qwen OAuth](/ko/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth 또는 `XAI_API_KEY`         | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### 알아두면 좋은 특이 사항

<AccordionGroup>
  <Accordion title="OpenRouter">
    검증된 `openrouter.ai` 경로에만 앱 귀속 헤더와 Anthropic `cache_control` 마커를 적용합니다. DeepSeek, Moonshot, ZAI 참조는 OpenRouter 관리형 프롬프트 캐싱의 캐시 TTL 적용 대상이지만 Anthropic 캐시 마커는 받지 않습니다. 프록시 방식의 OpenAI 호환 경로이므로 네이티브 OpenAI 전용 조정(`serviceTier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI 추론 호환성)은 건너뜁니다. Gemini 기반 참조에는 프록시 Gemini 사고 서명 정리만 유지합니다.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 기반 참조는 동일한 프록시 Gemini 정리 경로를 따릅니다. `kilocode/kilo/auto` 및 프록시 추론을 지원하지 않는 기타 참조는 프록시 추론 삽입을 건너뜁니다.
  </Accordion>
  <Accordion title="MiniMax">
    API 키 온보딩은 명시적인 M3 및 M2.7 채팅 모델 정의를 작성합니다. 이미지 이해는 Plugin 소유의 `MiniMax-VL-01` 미디어 제공자에서 유지됩니다.
  </Accordion>
  <Accordion title="NVIDIA">
    모델 ID는 `nvidia/<vendor>/<model>` 네임스페이스를 사용합니다(예: `nvidia/moonshotai/kimi-k2.5`와 함께 `nvidia/nvidia/nemotron-...` 사용). 선택기는 리터럴 `<provider>/<model-id>` 조합을 유지하지만 API로 전송되는 정식 키에는 접두사가 하나만 붙습니다.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses 경로를 사용합니다. 권장 경로는 SuperGrok/X Premium OAuth입니다. API 키도 `XAI_API_KEY` 또는 Plugin 구성을 통해 계속 작동하며, Grok `web_search`는 API 키 대체 경로를 사용하기 전에 동일한 인증 프로필을 재사용합니다. 사용 가능한 경우 채팅, 코딩 및 에이전트 작업에 Grok 4.5를 선택할 수 있으며, `grok-4.3`은 지역 안전성이 보장되는 번들 기본값으로 유지됩니다. 이전 `/fast` 및 `params.fastMode: true` 구성도 xAI의 Grok 4.3 호환성 리디렉션을 통해 계속 해석되지만, 새 구성에서는 현재 모델을 직접 선택해야 합니다. `tool_stream`은 기본적으로 활성화됩니다. 비활성화하려면 `agents.defaults.models["xai/<model>"].params.tool_stream=false`를 설정하십시오.
  </Accordion>
</AccordionGroup>

## `models.providers`를 통한 제공자(사용자 지정/기본 URL)

`models.providers`(또는 `models.json`)를 사용하여 **사용자 지정** 제공자나 OpenAI/Anthropic 호환 프록시를 추가하십시오.

아래의 번들 제공자 Plugin 중 다수는 이미 기본 카탈로그를 게시합니다. 기본 URL, 헤더 또는 모델 목록을 재정의하려는 경우에만 명시적인 `models.providers.<id>` 항목을 사용하십시오.

Gateway 모델 기능 검사도 명시적인 `models.providers.<id>.models[]` 메타데이터를 읽습니다. 사용자 지정 또는 프록시 모델이 이미지를 허용하는 경우 해당 모델에 `input: ["text", "image"]`를 설정하여 WebChat 및 Node에서 시작된 첨부 파일 경로가 이미지를 텍스트 전용 미디어 참조 대신 네이티브 모델 입력으로 전달하도록 하십시오.

`agents.defaults.models["provider/model"]`은 에이전트의 모델 표시 여부, 별칭 및 모델별 메타데이터만 제어합니다. 이것만으로는 새 런타임 모델을 등록하지 않습니다. 사용자 지정 제공자 모델의 경우 일치하는 `id` 이상을 포함하여 `models.providers.<provider>.models[]`도 추가하십시오.

### Moonshot AI(Kimi)

온보딩 전에 `@openclaw/moonshot-provider`를 설치하십시오. 기본 URL 또는 모델 메타데이터를 재정의해야 하는 경우에만 명시적인 `models.providers.moonshot` 항목을 추가하십시오.

- 제공자: `moonshot`
- 인증: `MOONSHOT_API_KEY`
- 모델 예시: `moonshot/kimi-k2.6`
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

전체 설정 가이드는 [Moonshot AI(Kimi + Kimi Coding)](/ko/providers/moonshot)을 참조하십시오.

### Kimi Coding

Kimi Coding은 Moonshot AI의 Anthropic 호환 엔드포인트를 사용합니다.

- 제공자: `kimi`
- 인증: `KIMI_API_KEY`
- 모델 예시: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

레거시 `kimi/kimi-code` 및 `kimi/k2p5`는 호환성 모델 ID로 계속 허용되며 Kimi의 안정적인 API 모델 ID로 정규화됩니다.

### Volcano Engine(Doubao)

Volcano Engine(火山引擎)은 중국에서 Doubao 및 기타 모델에 대한 액세스를 제공합니다.

- 제공자: `volcengine`(코딩: `volcengine-plan`)
- 인증: `VOLCANO_ENGINE_API_KEY`
- 모델 예시: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

온보딩은 기본적으로 코딩 표면을 사용하지만 일반 `volcengine/*` 카탈로그도 동시에 등록됩니다.

온보딩/구성 모델 선택기에서 Volcengine 인증 선택은 `volcengine/*` 및 `volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우 OpenClaw는 빈 제공자 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

<Tabs>
  <Tab title="표준 모델">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

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

BytePlus ARK는 해외 사용자에게 Volcano Engine과 동일한 모델에 대한 액세스를 제공합니다.

- 제공자: `byteplus`(코딩: `byteplus-plan`)
- 인증: `BYTEPLUS_API_KEY`
- 모델 예시: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

온보딩은 기본적으로 코딩 표면을 사용하지만 일반 `byteplus/*` 카탈로그도 동시에 등록됩니다.

온보딩/구성 모델 선택기에서 BytePlus 인증 선택은 `byteplus/*` 및 `byteplus-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우 OpenClaw는 빈 제공자 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

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

Synthetic은 `synthetic` 제공자 뒤에서 Anthropic 호환 모델을 제공합니다.

- 제공자: `synthetic`
- 인증: `SYNTHETIC_API_KEY`
- 모델 예시: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

- MiniMax OAuth(글로벌): `--auth-choice minimax-global-oauth`
- MiniMax OAuth(중국): `--auth-choice minimax-cn-oauth`
- MiniMax API 키(글로벌): `--auth-choice minimax-global-api`
- MiniMax API 키(중국): `--auth-choice minimax-cn-api`
- 인증: `minimax`에는 `MINIMAX_API_KEY`, `minimax-portal`에는 `MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`

설정 세부 정보, 모델 옵션 및 구성 스니펫은 [/providers/minimax](/ko/providers/minimax)을 참조하십시오.

<Note>
MiniMax의 Anthropic 호환 스트리밍 경로에서 OpenClaw는 명시적으로 설정하지 않는 한 M2.x 제품군의 사고를 기본적으로 비활성화합니다. MiniMax-M3(M3.x 포함)는 기본적으로 제공자의 생략형/적응형 사고 경로를 유지합니다. `/fast on`은 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 작성합니다.
</Note>

Plugin 소유 기능 분리:

- 텍스트/채팅 기본값은 `minimax/MiniMax-M3`에 유지됩니다.
- 이미지 생성은 `minimax/image-01` 또는 `minimax-portal/image-01`입니다.
- 이미지 이해는 두 MiniMax 인증 경로 모두에서 Plugin 소유의 `MiniMax-VL-01`입니다.
- 웹 검색은 제공자 ID `minimax`에 유지됩니다.

### LM Studio

LM Studio는 네이티브 API를 사용하는 번들 제공자 Plugin으로 제공됩니다.

- 제공자: `lmstudio`
- 인증: `LM_API_TOKEN`
- 기본 추론 기본 URL: `http://localhost:1234/v1`

그런 다음 모델을 설정하십시오(`http://localhost:1234/api/v1/models`에서 반환된 ID 중 하나로 교체).

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw는 검색 및 자동 로드에 LM Studio의 네이티브 `/api/v1/models`와 `/api/v1/models/load`를 사용하며, 기본적으로 추론에는 `/v1/chat/completions`를 사용합니다. LM Studio의 JIT 로딩, TTL 및 자동 제거가 모델 수명 주기를 관리하도록 하려면 `models.providers.lmstudio.params.preload: false`를 설정하십시오. 설정 및 문제 해결은 [/providers/lmstudio](/ko/providers/lmstudio)를 참조하십시오.

### Ollama

Ollama는 번들 제공자 Plugin으로 제공되며 Ollama의 네이티브 API를 사용합니다.

- 제공자: `ollama`
- 인증: 필요 없음(로컬 서버)
- 모델 예시: `ollama/llama3.3`
- 설치: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama를 설치한 다음 모델을 가져옵니다.
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY`로 명시적으로 활성화하면 Ollama는 로컬의 `http://127.0.0.1:11434`에서 감지되며, 번들 제공자 Plugin은 Ollama를 `openclaw onboard`와 모델 선택기에 직접 추가합니다. 온보딩, 클라우드/로컬 모드 및 사용자 지정 구성은 [/providers/ollama](/ko/providers/ollama)를 참조하십시오.

### vLLM

vLLM은 로컬/자체 호스팅 OpenAI 호환 서버용 번들 제공자 Plugin으로 제공됩니다.

- 제공자: `vllm`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 URL: `http://127.0.0.1:8000/v1`

로컬 자동 검색을 명시적으로 활성화하려면 다음을 설정하십시오(서버에서 인증을 강제하지 않는 경우 어떤 값이든 사용할 수 있음).

```bash
export VLLM_API_KEY="vllm-local"
```

그런 다음 모델을 설정하십시오(`/v1/models`에서 반환된 ID 중 하나로 교체).

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/ko/providers/vllm)을 참조하십시오.

### SGLang

SGLang은 빠른 자체 호스팅 OpenAI 호환 서버용 번들 제공자 Plugin으로 제공됩니다.

- 제공자: `sglang`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 URL: `http://127.0.0.1:30000/v1`

로컬 자동 검색을 명시적으로 활성화하려면 다음을 설정하십시오(서버에서 인증을 강제하지 않는 경우 어떤 값이든 사용할 수 있음).

```bash
export SGLANG_API_KEY="sglang-local"
```

그런 다음 모델을 설정하십시오(`/v1/models`에서 반환된 ID 중 하나로 교체).

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/sglang](/ko/providers/sglang)을 참조하십시오.

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
  <Accordion title="기본 선택적 필드">
    사용자 지정 제공자의 경우 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는 선택 사항입니다. 생략하면 OpenClaw는 다음 기본값을 사용합니다.

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    권장 사항: 프록시/모델 제한과 일치하는 값을 명시적으로 설정하십시오.

  </Accordion>
  <Accordion title="프록시 경로 조정 규칙">
    - 비네이티브 엔드포인트(`baseUrl`이 비어 있지 않고 호스트가 `api.openai.com`이 아닌 경우)에서 `api: "openai-completions"`를 사용하면, OpenClaw는 지원되지 않는 `developer` 역할로 인한 제공자 400 오류를 방지하기 위해 `compat.supportsDeveloperRole: false`를 강제합니다.
    - 프록시 방식의 OpenAI 호환 경로에서는 OpenAI 네이티브 전용 요청 조정도 건너뜁니다. 즉, `service_tier`, Responses의 `store`, Completions의 `store`, 프롬프트 캐시 힌트, OpenAI 추론 호환 페이로드 조정, 숨겨진 OpenClaw 출처 헤더를 사용하지 않습니다.
    - 공급업체별 필드가 필요한 OpenAI 호환 Completions 프록시의 경우, `agents.defaults.models["provider/model"].params.extra_body`(또는 `extraBody`)를 설정하여 추가 JSON을 발신 요청 본문에 병합하십시오.
    - vLLM 채팅 템플릿 제어의 경우 `agents.defaults.models["provider/model"].params.chat_template_kwargs`를 설정하십시오. 세션 사고 수준이 꺼져 있으면 번들 vLLM Plugin이 `vllm/nemotron-3-*`에 대해 `enable_thinking: false`와 `force_nonempty_content: true`를 자동으로 전송합니다.
    - 느린 로컬 모델이나 원격 LAN/테일넷 호스트의 경우 `models.providers.<id>.timeoutSeconds`를 설정하십시오. 이 설정은 전체 에이전트 런타임 제한 시간을 늘리지 않으면서 연결, 헤더, 본문 스트리밍, 보호된 가져오기의 전체 중단 시간을 포함한 제공자 모델 HTTP 요청 처리 시간을 연장합니다. `agents.defaults.timeoutSeconds` 또는 실행별 제한 시간이 더 짧다면 해당 상한도 높이십시오. 제공자 제한 시간은 전체 실행 시간을 연장할 수 없습니다.
    - 모델 제공자 HTTP 호출은 구성된 제공자 `baseUrl` 호스트 이름에 대해서만 `198.18.0.0/15` 및 `fc00::/7` 범위의 Surge, Clash, sing-box 가상 IP DNS 응답을 허용합니다. 또한 사용자 지정/로컬 제공자 엔드포인트는 루프백, LAN, 테일넷 호스트를 포함하여 보호된 모델 요청에 대해 구성된 정확한 `scheme://host:port` 출처를 신뢰합니다. 이는 새로운 구성 옵션이 아닙니다. 구성한 `baseUrl`은 해당 출처에 대해서만 요청 정책을 확장합니다. 가상 IP 호스트 이름 허용과 정확한 출처 신뢰는 서로 독립적인 메커니즘입니다. 그 밖의 비공개, 루프백, 링크 로컬, 메타데이터 대상 및 다른 포트에는 여전히 명시적인 `models.providers.<id>.request.allowPrivateNetwork: true` 옵트인이 필요합니다. 정확한 출처 신뢰를 해제하려면 `models.providers.<id>.request.allowPrivateNetwork: false`를 설정하십시오.
    - `baseUrl`이 비어 있거나 생략되면 OpenClaw는 기본 OpenAI 동작(`api.openai.com`으로 확인됨)을 유지합니다.
    - 안전을 위해 비네이티브 `openai-completions` 엔드포인트에서는 명시적인 `compat.supportsDeveloperRole: true`도 여전히 재정의됩니다.
    - 직접 연결이 아닌 엔드포인트(정식 `anthropic` 이외의 제공자 또는 호스트가 공개 `api.anthropic.com` 엔드포인트가 아닌 사용자 지정 `models.providers.anthropic.baseUrl`)에서 `api: "anthropic-messages"`를 사용하면, OpenClaw는 사용자 지정 Anthropic 호환 프록시가 지원되지 않는 베타 플래그를 거부하지 않도록 `claude-code-20250219`, `interleaved-thinking-2025-05-14`, OAuth 마커와 같은 암시적 Anthropic 베타 헤더를 억제합니다. 프록시에 특정 베타 기능이 필요하면 `models.providers.<id>.headers["anthropic-beta"]`를 명시적으로 설정하십시오.

  </Accordion>
</AccordionGroup>

## CLI 예시

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

전체 구성 예시는 [구성](/ko/gateway/configuration)도 참조하십시오.

## 관련 항목

- [구성 참조](/ko/gateway/config-agents#agent-defaults) - 모델 구성 키
- [모델 장애 조치](/ko/concepts/model-failover) - 폴백 체인 및 재시도 동작
- [모델](/ko/concepts/models) - 모델 구성 및 별칭
- [제공자](/ko/providers) - 제공자별 설정 가이드
