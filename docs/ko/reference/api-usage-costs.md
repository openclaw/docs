---
read_when:
    - 어떤 기능이 유료 API를 호출할 수 있는지 이해하려는 경우
    - 키, 비용, 사용량 가시성을 감사해야 합니다
    - /status 또는 /usage 비용 보고를 설명하고 있습니다
summary: 무엇이 비용을 발생시킬 수 있는지, 어떤 키가 사용되는지, 사용량을 확인하는 방법 감사
title: API 사용량 및 비용
x-i18n:
    generated_at: "2026-06-27T18:06:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

이 문서는 **API 키를 호출할 수 있는 기능**과 해당 비용이 표시되는 위치를 나열합니다. Provider 사용량 또는 유료 API 호출을 생성할 수 있는 OpenClaw 기능에 초점을 맞춥니다.

## 비용이 표시되는 위치(채팅 + CLI)

**세션별 비용 스냅샷**

- `/status`는 현재 세션 모델, 컨텍스트 사용량, 마지막 응답 토큰을 표시합니다.
- OpenClaw에 활성 모델의 사용량 메타데이터와 로컬 가격 정보가 있으면,
  `/status`는 마지막 답변의 **예상 비용**도 표시합니다. 여기에는 Bedrock `aws-sdk` 모델처럼 명시적으로 가격이 책정된 비 API 키 Provider가 포함될 수 있습니다.
- 라이브 세션 메타데이터가 부족하면, `/status`는 최신 트랜스크립트 사용량
  항목에서 토큰/캐시 카운터와 활성 런타임 모델 라벨을 복구할 수 있습니다. 기존의 0이 아닌 라이브 값이 여전히 우선하며, 저장된 총합이 없거나 더 작을 때는 프롬프트 크기의 트랜스크립트 총합이 우선할 수 있습니다.

**메시지별 비용 푸터**

- `/usage full`은 활성 모델에 로컬 가격 정보가 구성되어 있고 사용량 메타데이터를
  사용할 수 있을 때 **예상 비용**을 포함한 사용량 푸터를 모든 답변에 추가합니다.
- `/usage tokens`는 토큰만 표시합니다. 구독형 OAuth/토큰 및 CLI 흐름도 해당 런타임이
  호환되는 사용량 메타데이터를 제공하고 명시적 로컬 가격이 구성되어 있지 않으면 토큰만 표시합니다.
- Gemini CLI 참고: 기본 `stream-json` 출력과 레거시 JSON 오버라이드는 모두
  `stats`에서 사용량을 읽고, `stats.cached`를 `cacheRead`로 정규화하며, 필요할 때
  `stats.input_tokens - stats.cached`에서 입력 토큰을 산출합니다.

Anthropic 참고: Anthropic 직원은 OpenClaw 스타일 Claude CLI 사용이 다시
허용된다고 알려왔으므로, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 이 통합에서 Claude CLI 재사용과 `claude -p` 사용을 승인된 것으로 취급합니다.
Anthropic은 여전히 OpenClaw가 `/usage full`에 표시할 수 있는 메시지별 달러 추정치를 제공하지 않습니다.

**CLI 사용량 기간(Provider 할당량)**

- `openclaw status --usage`와 `openclaw channels list`는 Provider **사용량 기간**
  (메시지별 비용이 아닌 할당량 스냅샷)을 표시합니다.
- 사람이 읽는 출력은 Provider 전반에서 `X% left`로 정규화됩니다.
- 현재 사용량 기간 Provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai.
- MiniMax 참고: 원시 `usage_percent` / `usagePercent` 필드는 남은
  할당량을 의미하므로 OpenClaw는 표시 전에 이를 반전합니다. 카운트 기반 필드가 있으면 여전히 우선합니다. Provider가 `model_remains`를 반환하면 OpenClaw는 채팅 모델 항목을 선호하고, 필요할 때 타임스탬프에서 기간 라벨을 산출하며, 플랜 라벨에 모델 이름을 포함합니다.
- 해당 할당량 기간의 사용량 인증은 가능할 때 Provider별 훅에서 가져옵니다. 그렇지 않으면 OpenClaw는 인증 프로필, env 또는 config에서 일치하는 OAuth/API 키
  자격 증명으로 폴백합니다.

자세한 내용과 예시는 [토큰 사용량 및 비용](/ko/reference/token-use)을 참조하세요.

## 키 검색 방식

OpenClaw는 다음에서 자격 증명을 가져올 수 있습니다.

- **인증 프로필**(에이전트별, `auth-profiles.json`에 저장됨).
- **환경 변수**(예: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config**(`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills**(`skills.entries.<name>.apiKey`)는 Skills 프로세스 env로 키를 내보낼 수 있습니다.

## 키 비용을 발생시킬 수 있는 기능

### 1) 코어 모델 응답(채팅 + 도구)

모든 답변 또는 도구 호출은 **현재 모델 Provider**(OpenAI, Anthropic 등)를 사용합니다. 이것이 사용량과 비용의 주된 원천입니다.

여기에는 OpenClaw의 로컬 UI 외부에서 여전히 과금되는 구독형 호스팅 Provider도 포함됩니다. 예를 들면 **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, 그리고 **Extra Usage**가 활성화된 Anthropic의 OpenClaw Claude 로그인 경로입니다.

가격 구성은 [모델](/ko/providers/models)을, 표시는 [토큰 사용량 및 비용](/ko/reference/token-use)을 참조하세요.

### 2) 미디어 이해(오디오/이미지/비디오)

수신 미디어는 답변 실행 전에 요약/전사될 수 있습니다. 이는 모델/Provider API를 사용합니다.

- 오디오: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- 이미지: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- 비디오: Google / Qwen / Moonshot.

[미디어 이해](/ko/nodes/media-understanding)를 참조하세요.

### 3) 이미지 및 비디오 생성

공유 생성 기능도 Provider 키 비용을 발생시킬 수 있습니다.

- 이미지 생성: OpenAI / Google / DeepInfra / fal / MiniMax
- 비디오 생성: DeepInfra / Qwen

`agents.defaults.imageGenerationModel`이 설정되지 않은 경우 이미지 생성은 인증 기반 Provider 기본값을 추론할 수 있습니다. 비디오 생성은 현재
`qwen/wan2.6-t2v` 같은 명시적 `agents.defaults.videoGenerationModel`이 필요합니다.

[이미지 생성](/ko/tools/image-generation), [Qwen Cloud](/ko/providers/qwen),
[모델](/ko/concepts/models)을 참조하세요.

### 4) 메모리 임베딩 + 시맨틱 검색

시맨틱 메모리 검색은 원격 Provider로 구성된 경우 **임베딩 API**를 사용합니다.

- `memorySearch.provider = "openai"` → OpenAI 임베딩
- `memorySearch.provider = "gemini"` → Gemini 임베딩
- `memorySearch.provider = "voyage"` → Voyage 임베딩
- `memorySearch.provider = "mistral"` → Mistral 임베딩
- `memorySearch.provider = "deepinfra"` → DeepInfra 임베딩
- `memorySearch.provider = "lmstudio"` → LM Studio 임베딩(로컬/자체 호스팅)
- `memorySearch.provider = "ollama"` → Ollama 임베딩(로컬/자체 호스팅, 일반적으로 호스팅 API 과금 없음)
- 로컬 임베딩이 실패할 경우 원격 Provider로 선택적 폴백

`memorySearch.provider = "local"`로 로컬 상태를 유지할 수 있습니다(API 사용 없음).

[메모리](/ko/concepts/memory)를 참조하세요.

### 5) 웹 검색 도구

`web_search`는 Provider에 따라 사용량 요금이 발생할 수 있습니다.

- **Brave Search API**: `BRAVE_API_KEY` 또는 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` 또는 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` 또는 `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: xAI OAuth 프로필, `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` 또는 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` 또는 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: 접근 가능한 로그인된 로컬 Ollama 호스트에서는 키 없이 사용 가능. 직접 `https://ollama.com` 검색은 `OLLAMA_API_KEY`를 사용하며, 인증 보호된 호스트는 일반 Ollama Provider bearer 인증을 재사용할 수 있습니다.
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` 또는 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` 또는 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: 명시적으로 선택한 경우 키 없는 Provider(API 과금 없음, 비공식이며 HTML 기반)
- **SearXNG**: `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`(키 없음/자체 호스팅, 호스팅 API 과금 없음)

레거시 `tools.web.search.*` Provider 경로는 여전히 임시 호환성 shim을 통해 로드되지만, 더 이상 권장 config 표면이 아닙니다.

**Brave Search 무료 크레딧:** 각 Brave 플랜에는 매월 갱신되는 \$5 무료 크레딧이 포함됩니다. Search 플랜은 요청 1,000건당 \$5이므로, 크레딧으로 월 1,000건의 요청을 무료로 처리할 수 있습니다. 예상치 못한 요금을 피하려면 Brave 대시보드에서 사용량 한도를 설정하세요.

[웹 도구](/ko/tools/web)를 참조하세요.

### 5) 웹 가져오기 도구(Firecrawl)

`web_fetch`는 키 없는 스타터 액세스로 **Firecrawl**을 호출할 수 있습니다. 더 높은 한도를 원하면 API 키를 추가하세요.

- `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl이 구성되어 있지 않으면 도구는 직접 fetch와 번들된 `web-readability` Plugin으로 폴백합니다(유료 API 없음). 로컬 Readability 추출을 건너뛰려면 `plugins.entries.web-readability.enabled`를 비활성화하세요.

[웹 도구](/ko/tools/web)를 참조하세요.

### 6) Provider 사용량 스냅샷(상태/상태 점검)

일부 상태 명령은 **Provider 사용량 엔드포인트**를 호출하여 할당량 기간 또는 인증 상태를 표시합니다.
이는 일반적으로 호출량이 적지만 여전히 Provider API에 요청합니다.

- `openclaw status --usage`
- `openclaw models status --json`

[모델 CLI](/ko/cli/models)를 참조하세요.

### 7) Compaction 보호 장치 요약

Compaction 보호 장치는 **현재 모델**을 사용해 세션 기록을 요약할 수 있으며, 실행될 때 Provider API를 호출합니다.

[세션 관리 + Compaction](/ko/reference/session-management-compaction)을 참조하세요.

### 8) 모델 스캔 / 프로브

`openclaw models scan`은 OpenRouter 모델을 프로브할 수 있으며, 프로브가 활성화되면 `OPENROUTER_API_KEY`를 사용합니다.

[모델 CLI](/ko/cli/models)를 참조하세요.

### 9) Talk(음성)

Talk 모드는 구성된 경우 **ElevenLabs**를 호출할 수 있습니다.

- `ELEVENLABS_API_KEY` 또는 `talk.providers.elevenlabs.apiKey`

[Talk 모드](/ko/nodes/talk)를 참조하세요.

### 10) Skills(타사 API)

Skills는 `skills.entries.<name>.apiKey`에 `apiKey`를 저장할 수 있습니다. Skills가 외부 API에 해당 키를 사용하면 Skills의 Provider에 따라 비용이 발생할 수 있습니다.

[Skills](/ko/tools/skills)를 참조하세요.

## 관련 항목

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
- [사용량 추적](/ko/concepts/usage-tracking)
