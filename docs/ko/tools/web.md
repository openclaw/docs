---
read_when:
    - web_search를 활성화하거나 구성하려고 합니다
    - x_search를 활성화하거나 설정하려고 합니다
    - 검색 제공자를 선택해야 합니다
    - 자동 감지 및 제공자 폴백을 이해하려는 경우
sidebarTitle: Web Search
summary: web_search, x_search 및 web_fetch -- 웹 검색, X 게시물 검색 또는 페이지 콘텐츠 가져오기
title: 웹 검색
x-i18n:
    generated_at: "2026-05-03T21:39:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

`web_search` 도구는 구성된 제공자를 사용해 웹을 검색하고
결과를 반환합니다. 결과는 쿼리별로 15분 동안 캐시됩니다(구성 가능).

OpenClaw에는 X(이전 Twitter) 게시물을 위한 `x_search`와
가벼운 URL 가져오기를 위한 `web_fetch`도 포함되어 있습니다. 이 단계에서는 `web_fetch`가
로컬에 머무르며, `web_search`와 `x_search`는 내부적으로 xAI Responses를 사용할 수 있습니다.

<Info>
  `web_search`는 브라우저 자동화가 아니라 가벼운 HTTP 도구입니다. JS가 많은
  사이트나 로그인이 필요한 경우 [웹 브라우저](/ko/tools/browser)를 사용하세요. 특정 URL을
  가져오려면 [Web Fetch](/ko/tools/web-fetch)를 사용하세요.
</Info>

## 빠른 시작

<Steps>
  <Step title="제공자 선택">
    제공자를 선택하고 필요한 설정을 완료하세요. 일부 제공자는
    키 없이 사용할 수 있으며, 다른 제공자는 API 키를 사용합니다. 자세한 내용은
    아래 제공자 페이지를 참고하세요.
  </Step>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    ```
    이렇게 하면 제공자와 필요한 자격 증명이 저장됩니다. 환경 변수(예:
    `BRAVE_API_KEY`)를 설정하고 API 기반 제공자에 대해서는 이 단계를
    건너뛸 수도 있습니다.
  </Step>
  <Step title="사용">
    이제 에이전트가 `web_search`를 호출할 수 있습니다.

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X 게시물에는 다음을 사용하세요.

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 제공자 선택

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ko/tools/brave-search">
    스니펫이 포함된 구조화된 결과입니다. `llm-context` 모드와 국가/언어 필터를 지원합니다. 무료 티어를 사용할 수 있습니다.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ko/tools/duckduckgo-search">
    키가 필요 없는 폴백입니다. API 키가 필요 없습니다. 비공식 HTML 기반 통합입니다.
  </Card>
  <Card title="Exa" icon="brain" href="/ko/tools/exa-search">
    콘텐츠 추출(하이라이트, 텍스트, 요약)을 포함한 신경망 + 키워드 검색입니다.
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ko/tools/firecrawl">
    구조화된 결과입니다. 깊은 추출에는 `firecrawl_search` 및 `firecrawl_scrape`와 함께 사용하는 것이 가장 좋습니다.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ko/tools/gemini-search">
    Google Search 그라운딩을 통해 인용이 포함된 AI 합성 답변을 제공합니다.
  </Card>
  <Card title="Grok" icon="zap" href="/ko/tools/grok-search">
    xAI 웹 그라운딩을 통해 인용이 포함된 AI 합성 답변을 제공합니다.
  </Card>
  <Card title="Kimi" icon="moon" href="/ko/tools/kimi-search">
    Moonshot 웹 검색을 통해 인용이 포함된 AI 합성 답변을 제공하며, 그라운딩되지 않은 채팅 폴백은 명시적으로 실패합니다.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ko/tools/minimax-search">
    MiniMax Token Plan 검색 API를 통한 구조화된 결과입니다.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ko/tools/ollama-search">
    로그인된 로컬 Ollama 호스트 또는 호스팅 Ollama API를 통한 검색입니다.
  </Card>
  <Card title="Perplexity" icon="search" href="/ko/tools/perplexity-search">
    콘텐츠 추출 제어와 도메인 필터링이 포함된 구조화된 결과입니다.
  </Card>
  <Card title="SearXNG" icon="server" href="/ko/tools/searxng-search">
    자체 호스팅 메타 검색입니다. API 키가 필요 없습니다. Google, Bing, DuckDuckGo 등을 집계합니다.
  </Card>
  <Card title="Tavily" icon="globe" href="/ko/tools/tavily">
    검색 깊이, 주제 필터링, URL 추출용 `tavily_extract`가 포함된 구조화된 결과입니다.
  </Card>
</CardGroup>

### 제공자 비교

| 제공자                                    | 결과 스타일                                                   | 필터                                             | API 키                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ko/tools/brave-search)              | 구조화된 스니펫                                               | 국가, 언어, 시간, `llm-context` 모드             | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/ko/tools/duckduckgo-search)    | 구조화된 스니펫                                               | --                                               | 없음(키 불필요)                                                                         |
| [Exa](/ko/tools/exa-search)                  | 구조화 + 추출                                                 | 신경망/키워드 모드, 날짜, 콘텐츠 추출            | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ko/tools/firecrawl)             | 구조화된 스니펫                                               | `firecrawl_search` 도구를 통해                  | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ko/tools/gemini-search)            | AI 합성 + 인용                                                | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ko/tools/grok-search)                | AI 합성 + 인용                                                | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/ko/tools/kimi-search)                | AI 합성 + 인용; 그라운딩되지 않은 채팅 폴백에서 실패          | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ko/tools/minimax-search)   | 구조화된 스니펫                                               | 지역(`global` / `cn`)                            | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ko/tools/ollama-search) | 구조화된 스니펫                                               | --                                               | 로그인된 로컬 호스트에는 없음; 직접 `https://ollama.com` 검색에는 `OLLAMA_API_KEY`     |
| [Perplexity](/ko/tools/perplexity-search)    | 구조화된 스니펫                                               | 국가, 언어, 시간, 도메인, 콘텐츠 제한            | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ko/tools/searxng-search)          | 구조화된 스니펫                                               | 카테고리, 언어                                   | 없음(자체 호스팅)                                                                       |
| [Tavily](/ko/tools/tavily)                   | 구조화된 스니펫                                               | `tavily_search` 도구를 통해                     | `TAVILY_API_KEY`                                                                        |

## 자동 감지

## 네이티브 OpenAI 웹 검색

직접 OpenAI Responses 모델은 OpenClaw 웹 검색이 활성화되어 있고 관리형 제공자가 고정되어 있지 않을 때 OpenAI의 호스팅 `web_search` 도구를 자동으로 사용합니다. 이는 번들 OpenAI Plugin의 제공자 소유 동작이며, OpenAI 호환 프록시 기본 URL이나 Azure 경로가 아니라 네이티브 OpenAI API 트래픽에만 적용됩니다. OpenAI 모델에 대해 관리형 `web_search` 도구를 유지하려면 `tools.web.search.provider`를 `brave` 같은 다른 제공자로 설정하고, 관리형 검색과 네이티브 OpenAI 검색을 모두 비활성화하려면 `tools.web.search.enabled: false`를 설정하세요.

## 네이티브 Codex 웹 검색

Codex 지원 모델은 선택적으로 OpenClaw의 관리형 `web_search` 함수 대신 제공자 네이티브 Responses `web_search` 도구를 사용할 수 있습니다.

- `tools.web.search.openaiCodex` 아래에서 구성합니다
- Codex 지원 모델(`openai-codex/*` 또는 `api: "openai-codex-responses"`를 사용하는 제공자)에만 활성화됩니다
- 관리형 `web_search`는 Codex가 아닌 모델에 계속 적용됩니다
- `mode: "cached"`가 기본값이자 권장 설정입니다
- `tools.web.search.enabled: false`는 관리형 검색과 네이티브 검색을 모두 비활성화합니다

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

네이티브 Codex 검색이 활성화되어 있지만 현재 모델이 Codex를 지원하지 않는 경우, OpenClaw는 일반 관리형 `web_search` 동작을 유지합니다.

## 네트워크 안전

관리형 `web_search` 제공자 호출은 OpenClaw의 보호된 fetch 경로를 사용합니다. 신뢰할 수 있는
제공자 API 호스트에 대해 OpenClaw는 해당 제공자 호스트 이름에 한해서만
`198.18.0.0/15` 및 `fc00::/7`의 Surge, Clash, sing-box fake-IP
DNS 응답을 허용합니다. 그 밖의 사설, 루프백, 링크-로컬, 메타데이터 대상은 계속 차단됩니다.

이 자동 허용은 임의의 `web_fetch` URL에는 적용되지 않습니다. `web_fetch`의 경우
신뢰하는 프록시가 이러한 합성 범위를 소유한 경우에만
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 및
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`를 명시적으로 활성화하세요.

## 웹 검색 설정

문서와 설정 흐름의 제공자 목록은 알파벳순입니다. 자동 감지는
별도의 우선순위를 유지합니다.

`provider`가 설정되어 있지 않으면 OpenClaw는 다음 순서로 제공자를 확인하고
준비된 첫 번째 제공자를 사용합니다.

먼저 API 기반 제공자:

1. **Brave** -- `BRAVE_API_KEY` 또는 `plugins.entries.brave.config.webSearch.apiKey`(순서 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 또는 `plugins.entries.minimax.config.webSearch.apiKey`(순서 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` 또는 `models.providers.google.apiKey`(순서 20)
4. **Grok** -- `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey`(순서 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 또는 `plugins.entries.moonshot.config.webSearch.apiKey`(순서 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 또는 `plugins.entries.perplexity.config.webSearch.apiKey`(순서 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webSearch.apiKey`(순서 60)
8. **Exa** -- `EXA_API_KEY` 또는 `plugins.entries.exa.config.webSearch.apiKey`; 선택 사항인 `plugins.entries.exa.config.webSearch.baseUrl`은 Exa 엔드포인트를 재정의합니다(순서 65)
9. **Tavily** -- `TAVILY_API_KEY` 또는 `plugins.entries.tavily.config.webSearch.apiKey`(순서 70)

그다음 키가 필요 없는 폴백:

10. **DuckDuckGo** -- 계정이나 API 키가 필요 없는 키 불필요 HTML 폴백(순서 100)
11. **Ollama Web Search** -- 구성된 로컬 Ollama 호스트에 연결할 수 있고 `ollama signin`으로 로그인되어 있을 때 이를 통한 키 불필요 폴백입니다. 호스트에 필요한 경우 Ollama 제공자 bearer 인증을 재사용할 수 있으며, `OLLAMA_API_KEY`로 구성된 경우 직접 `https://ollama.com` 검색을 호출할 수 있습니다(순서 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`(순서 200)

제공자가 감지되지 않으면 Brave로 폴백합니다(구성을 요청하는 키 누락
오류가 표시됩니다).

<Note>
  모든 제공자 키 필드는 SecretRef 객체를 지원합니다. `plugins.entries.<plugin>.config.webSearch.apiKey`
  아래의 Plugin 범위 SecretRef는 Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity, Tavily를 포함한
  번들 API 기반 웹 검색 제공자에 대해 해석되며,
  제공자가 `tools.web.search.provider`를 통해 명시적으로 선택되었는지
  자동 감지를 통해 선택되었는지와 관계없이 적용됩니다. 자동 감지 모드에서 OpenClaw는
  선택된 제공자 키만 해석합니다. 선택되지 않은 SecretRef는 비활성 상태로 유지되므로
  사용하지 않는 제공자에 대해 해석 비용을 지불하지 않고도
  여러 제공자를 구성해 둘 수 있습니다.
</Note>

## 구성

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Provider별 구성(API 키, base URL, 모드)은
`plugins.entries.<plugin>.config.webSearch.*` 아래에 있습니다. Gemini는 전용 웹 검색 구성과 `GEMINI_API_KEY` 이후의 낮은 우선순위 fallback으로
`models.providers.google.apiKey`와 `models.providers.google.baseUrl`도 재사용할 수 있습니다. 예시는 provider 페이지를 참조하세요.

`tools.web.search.provider`는 번들 제공 및 설치된 Plugin manifest가 선언한 웹 검색 provider ID에 대해 검증됩니다. `"brvae"` 같은 오타는 자동 감지로 조용히 fallback하지 않고 구성 검증에 실패합니다. 구성된 provider에 stale Plugin 근거만 있는 경우, 예를 들어 서드파티 Plugin을 제거한 뒤 남은
`plugins.entries.<plugin>` 블록이 있는 경우에도 OpenClaw는 시작을 resilient하게 유지하고 경고를 보고하므로 Plugin을 다시 설치하거나 `openclaw doctor --fix`를 실행해 stale 구성을 정리할 수 있습니다.

`web_fetch` fallback provider 선택은 별도입니다.

- `tools.web.fetch.provider`로 선택합니다.
- 또는 해당 필드를 생략하고 OpenClaw가 사용 가능한 자격 증명에서 처음 준비된 web-fetch provider를 자동 감지하게 합니다.
- 샌드박스가 아닌 `web_fetch`는 `contracts.webFetchProviders`를 선언한 설치된 Plugin provider를 사용할 수 있으며, 샌드박스 fetch는 번들 제공 provider로만 유지됩니다.
- 현재 번들 제공 web-fetch provider는 Firecrawl이며, `plugins.entries.firecrawl.config.webFetch.*` 아래에서 구성됩니다.

`openclaw onboard` 또는
`openclaw configure --section web` 중에 **Kimi**를 선택하면 OpenClaw가 다음도 물어볼 수 있습니다.

- Moonshot API 리전(`https://api.moonshot.ai/v1` 또는 `https://api.moonshot.cn/v1`)
- 기본 Kimi 웹 검색 모델(기본값 `kimi-k2.6`)

`x_search`의 경우 `plugins.entries.xai.config.xSearch.*`를 구성하세요. 이는 Grok 웹 검색과 동일한 `XAI_API_KEY` fallback을 사용합니다.
기존 `tools.web.x_search.*` 구성은 `openclaw doctor --fix`로 자동 마이그레이션됩니다.
`openclaw onboard` 또는 `openclaw configure --section web` 중에 Grok을 선택하면 OpenClaw가 같은 키로 선택적 `x_search` 설정도 제공할 수 있습니다.
이는 Grok 경로 안의 별도 후속 단계이며, 별도의 최상위 웹 검색 provider 선택지가 아닙니다. 다른 provider를 선택하면 OpenClaw는 `x_search` 프롬프트를 표시하지 않습니다.

### API 키 저장

<Tabs>
  <Tab title="구성 파일">
    `openclaw configure --section web`을 실행하거나 키를 직접 설정하세요.

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="환경 변수">
    Gateway 프로세스 환경에서 provider 환경 변수를 설정하세요.

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gateway 설치의 경우 `~/.openclaw/.env`에 넣으세요.
    [환경 변수](/ko/help/faq#env-vars-and-env-loading)를 참조하세요.

  </Tab>
</Tabs>

## 도구 매개변수

| 매개변수              | 설명                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 검색 쿼리(필수)                                      |
| `count`               | 반환할 결과 수(1-10, 기본값: 5)                      |
| `country`             | 2글자 ISO 국가 코드(예: "US", "DE")                  |
| `language`            | ISO 639-1 언어 코드(예: "en", "de")                  |
| `search_lang`         | 검색 언어 코드(Brave 전용)                           |
| `freshness`           | 시간 필터: `day`, `week`, `month` 또는 `year`        |
| `date_after`          | 이 날짜 이후 결과(YYYY-MM-DD)                       |
| `date_before`         | 이 날짜 이전 결과(YYYY-MM-DD)                       |
| `ui_lang`             | UI 언어 코드(Brave 전용)                             |
| `domain_filter`       | 도메인 허용 목록/차단 목록 배열(Perplexity 전용)     |
| `max_tokens`          | 전체 콘텐츠 예산, 기본값 25000(Perplexity 전용)      |
| `max_tokens_per_page` | 페이지당 토큰 제한, 기본값 2048(Perplexity 전용)     |

<Warning>
  모든 매개변수가 모든 provider에서 동작하는 것은 아닙니다. Brave `llm-context` 모드는
  `ui_lang`를 거부합니다. Brave 사용자 지정 freshness 범위는 시작일과 종료일을 모두 필요로 하므로 `date_before`에는 `date_after`도 필요합니다.
  Gemini, Grok, Kimi는 인용이 포함된 하나의 합성 답변을 반환합니다. 공유 도구 호환성을 위해 `count`를 받지만, 근거 기반 답변 형태를 바꾸지는 않습니다. Gemini는 `freshness`, `date_after`, `date_before`를 Google Search grounding 시간 범위로 변환하여 지원합니다.
  Perplexity도 Sonar/OpenRouter 호환 경로(`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 또는 `OPENROUTER_API_KEY`)를 사용할 때 같은 방식으로 동작합니다.
  SearXNG는 신뢰할 수 있는 사설 네트워크 또는 local loopback 호스트에만 `http://`를 허용합니다.
  공개 SearXNG 엔드포인트는 `https://`를 사용해야 합니다.
  Firecrawl과 Tavily는 `web_search`를 통해 `query`와 `count`만 지원합니다.
  고급 옵션은 전용 도구를 사용하세요.
</Warning>

## x_search

`x_search`는 xAI를 사용해 X(이전 Twitter) 게시물을 쿼리하고 인용이 포함된 AI 합성 답변을 반환합니다. 자연어 쿼리와 선택적 구조화 필터를 받습니다. OpenClaw는 이 도구 호출을 처리하는 요청에서만 내장 xAI `x_search` 도구를 활성화합니다.

<Note>
  xAI는 `x_search`가 키워드 검색, 의미 검색, 사용자 검색, 스레드 가져오기를 지원한다고 문서화합니다. repost, reply, bookmark, view 같은 게시물별 engagement 통계의 경우 정확한 게시물 URL 또는 status ID를 대상으로 조회하는 편이 좋습니다. 넓은 키워드 검색은 올바른 게시물을 찾을 수 있지만 게시물별 metadata가 덜 완전하게 반환될 수 있습니다. 좋은 패턴은 먼저 게시물을 찾은 다음, 그 정확한 게시물에 초점을 맞춘 두 번째 `x_search` 쿼리를 실행하는 것입니다.
</Note>

### x_search 구성

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`plugins.entries.xai.config.xSearch.baseUrl`이 설정된 경우 `x_search`는
`<baseUrl>/responses`로 post합니다. 해당 필드가 생략되면
`plugins.entries.xai.config.webSearch.baseUrl`, 기존
`tools.web.search.grok.baseUrl`, 마지막으로 공개 xAI 엔드포인트로 fallback합니다.

### x_search 매개변수

| 매개변수                     | 설명                                                 |
| ---------------------------- | ---------------------------------------------------- |
| `query`                      | 검색 쿼리(필수)                                     |
| `allowed_x_handles`          | 결과를 특정 X handle로 제한                         |
| `excluded_x_handles`         | 특정 X handle 제외                                  |
| `from_date`                  | 이 날짜 또는 이후의 게시물만 포함(YYYY-MM-DD)       |
| `to_date`                    | 이 날짜 또는 이전의 게시물만 포함(YYYY-MM-DD)       |
| `enable_image_understanding` | xAI가 일치하는 게시물에 첨부된 이미지를 검사하도록 허용 |
| `enable_video_understanding` | xAI가 일치하는 게시물에 첨부된 비디오를 검사하도록 허용 |

### x_search 예시

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 예시

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 도구 프로필

도구 프로필 또는 허용 목록을 사용하는 경우 `web_search`, `x_search` 또는 `group:web`을 추가하세요.

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## 관련 항목

- [Web Fetch](/ko/tools/web-fetch) -- URL을 가져와 읽기 쉬운 콘텐츠 추출
- [Web Browser](/ko/tools/browser) -- JS가 많은 사이트를 위한 전체 브라우저 자동화
- [Grok Search](/ko/tools/grok-search) -- `web_search` provider로 사용하는 Grok
- [Ollama Web Search](/ko/tools/ollama-search) -- Ollama 호스트를 통한 키 없는 웹 검색
