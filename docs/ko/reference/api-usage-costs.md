---
read_when:
    - 어떤 기능이 유료 API를 호출할 수 있는지 알고 싶습니다
    - 키, 비용 및 사용량 가시성을 감사해야 합니다
    - /status 또는 /usage 비용 보고를 설명하고 있습니다
summary: 비용을 발생시킬 수 있는 항목, 사용되는 키, 사용량 확인 방법 감사하기
title: API 사용량 및 비용
x-i18n:
    generated_at: "2026-04-30T06:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# API 사용량 및 비용

이 문서는 **API 키를 호출할 수 있는 기능**과 그 비용이 표시되는 위치를 나열합니다. provider 사용량 또는 유료 API 호출을 생성할 수 있는 OpenClaw 기능에 초점을 둡니다.

## 비용이 표시되는 위치(chat + CLI)

**세션별 비용 스냅샷**

- `/status`는 현재 세션 모델, 컨텍스트 사용량, 마지막 응답 토큰을 표시합니다.
- 모델이 **API-key auth**를 사용하는 경우 `/status`는 마지막 응답의 **예상 비용**도 표시합니다.
- 라이브 세션 메타데이터가 부족한 경우 `/status`는 최신 transcript 사용량 항목에서 토큰/cache 카운터와 활성 runtime 모델 라벨을 복구할 수 있습니다. 기존의 0이 아닌 라이브 값이 여전히 우선하며, 저장된 총계가 없거나 더 작으면 prompt 크기의 transcript 총계가 우선할 수 있습니다.

**메시지별 비용 푸터**

- `/usage full`은 모든 응답에 **예상 비용**(API-key 전용)을 포함한 사용량 푸터를 추가합니다.
- `/usage tokens`는 토큰만 표시합니다. subscription-style OAuth/token 및 CLI 흐름은 달러 비용을 숨깁니다.
- Gemini CLI 참고: CLI가 JSON 출력을 반환하면 OpenClaw는 `stats`에서 사용량을 읽고, `stats.cached`를 `cacheRead`로 정규화하며, 필요할 때 `stats.input_tokens - stats.cached`에서 입력 토큰을 도출합니다.

Anthropic 참고: Anthropic 직원은 OpenClaw 방식의 Claude CLI 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 이 integration에서 Claude CLI 재사용과 `claude -p` 사용을 허가된 것으로 취급합니다. Anthropic은 여전히 OpenClaw가 `/usage full`에 표시할 수 있는 메시지별 달러 추정치를 제공하지 않습니다.

**CLI 사용량 창(provider 할당량)**

- `openclaw status --usage` 및 `openclaw channels list`는 provider **사용량 창**(메시지별 비용이 아닌 할당량 스냅샷)을 표시합니다.
- 사람이 읽는 출력은 provider 전반에서 `X% left`로 정규화됩니다.
- 현재 사용량 창 provider: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi, z.ai.
- MiniMax 참고: 원시 `usage_percent` / `usagePercent` 필드는 남은 할당량을 의미하므로 OpenClaw는 표시 전에 이를 반전합니다. 개수 기반 필드가 있으면 여전히 우선합니다. provider가 `model_remains`를 반환하면 OpenClaw는 chat-model 항목을 우선하고, 필요할 때 timestamp에서 창 라벨을 도출하며, plan 라벨에 모델 이름을 포함합니다.
- 이러한 할당량 창의 사용량 auth는 사용 가능한 경우 provider별 hook에서 오며, 그렇지 않으면 OpenClaw가 auth profile, env 또는 config에서 일치하는 OAuth/API-key 자격 증명으로 fallback합니다.

자세한 내용과 예시는 [토큰 사용량 및 비용](/ko/reference/token-use)을 참조하세요.

## 키가 발견되는 방식

OpenClaw는 다음에서 자격 증명을 가져올 수 있습니다.

- **Auth profiles**(agent별, `auth-profiles.json`에 저장).
- **환경 변수**(예: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config**(`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`, `talk.providers.*.apiKey`).
- skill process env로 키를 export할 수 있는 **Skills**(`skills.entries.<name>.apiKey`).

## 키를 사용할 수 있는 기능

### 1) Core 모델 응답(chat + tools)

모든 응답 또는 tool 호출은 **현재 모델 provider**(OpenAI, Anthropic 등)를 사용합니다. 이것이 사용량과 비용의 주된 출처입니다.

여기에는 OpenClaw의 local UI 외부에서 여전히 과금되는 subscription-style hosted provider도 포함됩니다. 예: **OpenAI Codex**, **Alibaba Cloud Model Studio Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, 그리고 **Extra Usage**가 활성화된 Anthropic의 OpenClaw Claude-login 경로.

가격 config는 [모델](/ko/providers/models)을, 표시 방식은 [토큰 사용량 및 비용](/ko/reference/token-use)을 참조하세요.

### 2) 미디어 이해(audio/image/video)

수신 미디어는 응답이 실행되기 전에 요약/전사될 수 있습니다. 이 작업은 model/provider API를 사용합니다.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Image: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

[미디어 이해](/ko/nodes/media-understanding)를 참조하세요.

### 3) 이미지 및 동영상 생성

공유 생성 기능도 provider 키를 사용할 수 있습니다.

- Image generation: OpenAI / Google / DeepInfra / fal / MiniMax
- Video generation: DeepInfra / Qwen

`agents.defaults.imageGenerationModel`이 설정되지 않은 경우 image generation은 auth 기반 provider 기본값을 추론할 수 있습니다. Video generation은 현재 `qwen/wan2.6-t2v`와 같은 명시적인 `agents.defaults.videoGenerationModel`이 필요합니다.

[이미지 생성](/ko/tools/image-generation), [Qwen Cloud](/ko/providers/qwen), [모델](/ko/concepts/models)을 참조하세요.

### 4) Memory embedding + semantic search

Semantic memory search는 원격 provider로 구성된 경우 **embedding API**를 사용합니다.

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "deepinfra"` → DeepInfra embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings(local/self-hosted)
- `memorySearch.provider = "ollama"` → Ollama embeddings(local/self-hosted, 일반적으로 hosted API 과금 없음)
- local embeddings가 실패하는 경우 원격 provider로의 선택적 fallback

`memorySearch.provider = "local"`로 local에 유지할 수 있습니다(API 사용 없음).

[Memory](/ko/concepts/memory)를 참조하세요.

### 5) Web search tool

`web_search`는 provider에 따라 사용료가 발생할 수 있습니다.

- **Brave Search API**: `BRAVE_API_KEY` 또는 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` 또는 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` 또는 `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` 또는 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` 또는 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: 접근 가능한 로그인된 local Ollama host에서는 키가 필요 없음. 직접 `https://ollama.com` 검색은 `OLLAMA_API_KEY`를 사용하며, auth로 보호되는 host는 일반 Ollama provider bearer auth를 재사용할 수 있음
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` 또는 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` 또는 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: 키가 필요 없는 fallback(API 과금 없음, 비공식이며 HTML 기반)
- **SearXNG**: `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`(키가 필요 없는 self-hosted, hosted API 과금 없음)

레거시 `tools.web.search.*` provider 경로는 여전히 임시 compatibility shim을 통해 로드되지만, 더 이상 권장 config 표면은 아닙니다.

**Brave Search 무료 크레딧:** 각 Brave plan에는 매월 갱신되는 \$5의 무료 크레딧이 포함됩니다. Search plan은 요청 1,000건당 \$5이므로, 이 크레딧은 월 1,000건의 요청을 무료로 처리합니다. 예상치 못한 요금을 피하려면 Brave dashboard에서 사용량 한도를 설정하세요.

[Web tools](/ko/tools/web)를 참조하세요.

### 5) Web fetch tool(Firecrawl)

API 키가 있으면 `web_fetch`가 **Firecrawl**을 호출할 수 있습니다.

- `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl이 구성되지 않은 경우 tool은 직접 fetch와 bundled `web-readability` Plugin으로 fallback합니다(유료 API 없음). local Readability 추출을 건너뛰려면 `plugins.entries.web-readability.enabled`를 비활성화하세요.

[Web tools](/ko/tools/web)를 참조하세요.

### 6) Provider 사용량 스냅샷(status/health)

일부 status 명령은 할당량 창 또는 auth 상태를 표시하기 위해 **provider usage endpoints**를 호출합니다. 일반적으로 호출량은 적지만 여전히 provider API에 도달합니다.

- `openclaw status --usage`
- `openclaw models status --json`

[Models CLI](/ko/cli/models)를 참조하세요.

### 7) Compaction safeguard 요약

Compaction safeguard는 **현재 모델**을 사용해 세션 기록을 요약할 수 있으며, 실행될 때 provider API를 호출합니다.

[세션 관리 + Compaction](/ko/reference/session-management-compaction)을 참조하세요.

### 8) 모델 scan / probe

`openclaw models scan`은 OpenRouter 모델을 probe할 수 있으며, probing이 활성화된 경우 `OPENROUTER_API_KEY`를 사용합니다.

[Models CLI](/ko/cli/models)를 참조하세요.

### 9) Talk(음성)

Talk mode는 구성된 경우 **ElevenLabs**를 호출할 수 있습니다.

- `ELEVENLABS_API_KEY` 또는 `talk.providers.elevenlabs.apiKey`

[Talk mode](/ko/nodes/talk)를 참조하세요.

### 10) Skills(타사 API)

Skills는 `skills.entries.<name>.apiKey`에 `apiKey`를 저장할 수 있습니다. skill이 외부 API에 해당 키를 사용하면 skill provider에 따라 비용이 발생할 수 있습니다.

[Skills](/ko/tools/skills)를 참조하세요.

## 관련 항목

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [Prompt caching](/ko/reference/prompt-caching)
- [사용량 추적](/ko/concepts/usage-tracking)
