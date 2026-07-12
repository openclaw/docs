---
read_when:
    - 유료 API를 호출할 수 있는 기능을 파악하려는 경우
    - 키, 비용 및 사용량 가시성을 감사해야 합니다.
    - /status 또는 /usage의 비용 보고 방식을 설명하고 있습니다
summary: 비용이 발생할 수 있는 항목, 사용되는 키, 사용량 확인 방법 감사
title: API 사용량 및 비용
x-i18n:
    generated_at: "2026-07-12T01:09:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

유료 제공자 API를 호출할 수 있는 OpenClaw 기능, 각 기능이 자격 증명을 읽는 위치, 그로 인해 발생한 비용이 표시되는 위치를 정리한 문서입니다.

## 비용이 표시되는 위치

**`/status`**(세션별 스냅샷)

- 현재 세션 모델, 컨텍스트 사용량, 마지막 응답의 토큰 수를 표시합니다.
- OpenClaw에 사용량 메타데이터와 활성 모델의 로컬 가격 정보가 있으면 마지막 응답의 **예상 비용**을 추가합니다. 여기에는 가격이 명시된 Bedrock `aws-sdk` 모델처럼 API 키를 사용하지 않는 제공자도 포함됩니다.
- 실시간 세션 스냅샷에 정보가 부족하면 `/status`는 최신 트랜스크립트 사용량 항목에서 토큰/캐시 카운터와 활성 모델 레이블을 복원합니다. 0이 아닌 기존 실시간 값은 트랜스크립트 데이터보다 우선합니다. 저장된 합계가 없거나 더 작으면 프롬프트 크기 수준의 트랜스크립트 합계가 우선할 수도 있습니다.

**`/usage`**(메시지별 바닥글)

- `/usage full`은 모든 응답에 사용량 바닥글을 추가하며, 로컬 가격이 구성되어 있고 사용량 메타데이터를 사용할 수 있으면 **예상 비용**도 포함합니다.
- `/usage tokens`는 토큰만 표시합니다. 구독형 OAuth/토큰 및 CLI 런타임은 호환되는 사용량 메타데이터와 명시적인 로컬 가격을 제공하지 않는 한 토큰만 표시합니다.
- `/usage cost`는 로컬 비용 요약을 출력하고, `/usage off`는 바닥글을 비활성화합니다.
- Gemini CLI 참고: `stream-json`과 레거시 `json` 출력 모두 `stats` 아래에 사용량 정보를 포함합니다. OpenClaw는 `stats.cached`를 `cacheRead`로 정규화하고, 필요한 경우 `stats.input_tokens - stats.cached`로 입력 토큰을 계산합니다.

**Control UI → 사용량**(세션 간 분석)

- 선택한 날짜 범위에 대해 트랜스크립트에서 산출한 토큰 합계와 예상 비용 합계를 표시하며, 제공자, 모델, 에이전트, 채널, 토큰 유형별 분석을 제공합니다.
- 선택 범위의 종료일에 끝나는 더 짧은 달력 기간과 비교합니다. 누락된 날짜는 사용량이 0인 달력 날짜로 계산되며, 더 조밀한 기간을 만들기 위해 건너뛰지 않습니다.
- 일별 차트의 척도를 직접 표시합니다. `√` 배지는 제곱근 압축을 적용하여 사용량이 적은 날짜도 보이게 하고 있음을 의미합니다.
- 이 합계는 사용 가능한 로컬 세션 기록을 나타내며, 제공자 청구서나 전체 기간의 결제 원장이 아닙니다. 일부 항목의 가격 정보가 없으면 UI에 경고가 표시됩니다.

**CLI 사용량 기간**(메시지별 비용이 아닌 제공자 할당량)

- `openclaw status --usage`와 `openclaw channels list`는 제공자의 **사용량 기간**을 `X% left` 형식으로 표시합니다.
- 현재 사용량 기간을 지원하는 제공자는 Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI(ChatGPT/Codex OAuth/토큰 인증 포함), Xiaomi, z.ai입니다. 전체 제공자/플래그 목록은 [모델 CLI](/ko/cli/models) 및 [채널 CLI](/ko/cli/channels)를 참조하세요.
- MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 남은 할당량을 나타내므로 OpenClaw가 이를 반전합니다. 개수 기반 필드가 있으면 해당 필드가 우선합니다. 응답에 `model_remains` 배열이 포함되어 있으면 OpenClaw는 채팅 모델 항목을 선택하고, 필요한 경우 타임스탬프에서 기간 레이블을 산출하며, 요금제 레이블에 모델 이름을 포함합니다.
- 사용량 인증은 가능한 경우 제공자별 훅에서 가져오며, 그렇지 않으면 OpenClaw가 인증 프로필, 환경 변수 또는 구성에서 일치하는 OAuth/API 키 자격 증명을 찾습니다.

자세한 예시는 [토큰 사용량 및 비용](/ko/reference/token-use)을 참조하세요.

<Note>
Anthropic은 새 정책을 게시하지 않는 한 Claude CLI 재사용(`claude -p` 포함)이 공식적으로 허용된 통합 방식임을 확인했습니다. Anthropic은 메시지별 예상 금액을 제공하지 않으므로 `/usage full`은 Claude CLI 사용 비용을 표시할 수 없습니다.
</Note>

## 키를 검색하는 방법

- **인증 프로필**: 에이전트별로 `auth-profiles.json`에 저장됩니다.
- **환경 변수**: 예를 들어 `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`입니다.
- **구성**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`이며, 키를 Skills 프로세스 환경으로 내보낼 수 있습니다.

## 키를 사용하여 비용이 발생할 수 있는 기능

### 핵심 모델 응답(채팅 + 도구)

모든 응답이나 도구 호출은 현재 모델 제공자에서 실행됩니다. 이는 사용량과 비용의 주요 원인이며, OpenClaw의 로컬 UI 외부에서 요금을 청구하는 구독형 호스팅 요금제도 포함합니다. 해당 요금제로는 OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan, Extra Usage가 활성화된 Anthropic의 Claude 로그인 경로가 있습니다.

가격 구성은 [모델](/ko/providers/models)을, 표시는 [토큰 사용량 및 비용](/ko/reference/token-use)을 참조하세요.

### 미디어 이해(오디오/이미지/동영상)

수신 미디어는 응답 파이프라인이 실행되기 전에 제공자 API를 통해 요약되거나 텍스트로 변환될 수 있습니다. 제공자 지원은 Plugin별로 등록되며 Plugin 추가에 따라 변경됩니다. 현재 목록과 구성은 [미디어 이해](/ko/nodes/media-understanding)를 참조하세요.

### 이미지 및 동영상 생성

`image_generate`와 `video_generate`는 구성된 제공자 중 사용 가능한 제공자로 요청을 전달합니다. `agents.defaults.imageGenerationModel`이 설정되지 않은 경우 이미지 생성은 인증 정보가 있는 기본 제공자를 추론할 수 있습니다. 동영상 생성에는 명시적인 `agents.defaults.videoGenerationModel`이 필요합니다(예: `qwen/wan2.6-t2v`).

현재 제공자 목록은 [이미지 생성](/ko/tools/image-generation) 및 [동영상 생성](/ko/tools/video-generation)을 참조하세요.

### 메모리 임베딩 및 의미 검색

`agents.defaults.memorySearch.provider`가 원격 어댑터(예: `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`)를 지정하면 의미 기반 메모리 검색에서 임베딩 API를 사용합니다. `memorySearch.provider = "lmstudio"` 또는 `"ollama"`는 로컬/자체 호스팅 서버에서 실행되며 일반적으로 호스팅 비용이 발생하지 않습니다. `memorySearch.provider = "local"`은 모든 처리를 기기 내에서 수행하므로 API를 사용하지 않습니다. 선택 사항인 `memorySearch.fallback` 제공자는 로컬 임베딩 실패에 대응할 수 있습니다.

[메모리](/ko/concepts/memory)를 참조하세요.

### 웹 검색 도구

`web_search`는 선택한 제공자에 따라 사용 요금이 발생할 수 있습니다. 각 제공자는 먼저 환경 변수에서 키를 읽은 다음 `plugins.entries.<id>.config.webSearch.apiKey`에서 읽습니다.

| 제공자                 | 환경 변수                                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                                                           |
| DuckDuckGo             | 키 불필요, 비공식 HTML 기반, 비용 없음                                                                                                                                                                    |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                                             |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                                                       |
| Gemini(Google Search)  | `GEMINI_API_KEY`                                                                                                                                                                                          |
| Grok(xAI)              | xAI OAuth 프로필 또는 `XAI_API_KEY`                                                                                                                                                                       |
| Kimi(Moonshot)         | `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`                                                                                                                                                                    |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`                                                                                                           |
| Ollama Web Search      | 접근 가능한 로그인된 로컬 호스트에서는 키 불필요, `https://ollama.com` 직접 검색은 `OLLAMA_API_KEY` 사용, 인증으로 보호된 호스트는 일반 Ollama 제공자의 전달자 인증 재사용 |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                                                        |
| Perplexity Search API  | `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`                                                                                                                                                            |
| SearXNG                | `SEARXNG_BASE_URL`, 키 불필요/자체 호스팅, 호스팅 비용 없음                                                                                                                                               |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                                                          |

레거시 `tools.web.search.*` 구성 경로는 호환성 심을 통해 계속 로드되지만 더 이상 권장되는 구성 표면이 아닙니다.

**Brave Search 무료 크레딧**: 각 요금제에는 매월 갱신되는 5달러의 무료 크레딧이 포함됩니다. Search 요금제는 요청 1,000건당 5달러이므로 이 크레딧으로 매월 요청 1,000건을 무료로 처리할 수 있습니다. 예상치 못한 요금을 방지하려면 Brave 대시보드에서 사용량 한도를 설정하세요.

[웹 도구](/ko/tools/web)를 참조하세요.

### 웹 가져오기 도구(Firecrawl)

`web_fetch`는 키 없이 제공되는 스타터 액세스로 Firecrawl을 호출할 수 있습니다. 더 높은 한도를 사용하려면 `FIRECRAWL_API_KEY`(또는 `plugins.entries.firecrawl.config.webFetch.apiKey`)를 추가하세요. Firecrawl이 구성되지 않은 경우 도구는 직접 가져오기와 번들 `web-readability` Plugin으로 대체합니다(유료 API 없음). 로컬 Readability 추출을 건너뛰려면 `plugins.entries.web-readability.enabled`를 비활성화하세요.

[웹 도구](/ko/tools/web)를 참조하세요.

### 제공자 사용량 스냅샷(상태/상태 점검)

`openclaw status --usage`와 `openclaw models status --json`은 제공자 사용량 엔드포인트를 호출하여 할당량 기간 또는 인증 상태를 표시합니다. 호출 빈도는 낮지만 여전히 제공자 API를 사용합니다.

[모델 CLI](/ko/cli/models)를 참조하세요.

### Compaction 보호 요약

Compaction 보호 기능은 현재 모델을 사용하여 세션 기록을 요약할 수 있으며, 실행될 때 제공자 API를 호출합니다.

[세션 관리 및 Compaction](/ko/reference/session-management-compaction)을 참조하세요.

### 모델 검색/프로브

`openclaw models scan`은 OpenRouter 모델을 프로브할 수 있으며, 프로브가 활성화되면 `OPENROUTER_API_KEY`를 사용합니다.

[모델 CLI](/ko/cli/models)를 참조하세요.

### 말하기(음성)

말하기 모드는 구성된 경우 ElevenLabs를 호출할 수 있습니다. `ELEVENLABS_API_KEY` 또는 `talk.providers.elevenlabs.apiKey`를 사용합니다.

[말하기 모드](/ko/nodes/talk)를 참조하세요.

### Skills(서드 파티 API)

Skills는 `skills.entries.<name>.apiKey`에 `apiKey`를 저장할 수 있습니다. Skills가 이 키를 외부 API에 사용하면 해당 Skills의 제공자에 따라 비용이 발생합니다.

[Skills](/ko/tools/skills)를 참조하세요.

## 관련 문서

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [프롬프트 캐싱](/ko/reference/prompt-caching)
- [사용량 추적](/ko/concepts/usage-tracking)
