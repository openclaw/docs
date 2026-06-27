---
read_when:
    - web_search를 활성화하거나 구성하려고 합니다
    - x_search를 활성화하거나 구성하려고 합니다
    - 검색 제공자를 선택해야 합니다
    - 자동 감지 및 제공자 선택 이해하기
sidebarTitle: Web Search
summary: web_search, x_search 및 web_fetch -- 웹 검색, X 게시물 검색 또는 페이지 콘텐츠 가져오기
title: 웹 검색
x-i18n:
    generated_at: "2026-06-27T18:18:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

`web_search` 도구는 구성된 provider를 사용해 웹을 검색하고 결과를 반환합니다. 결과는 쿼리별로 15분 동안 캐시됩니다(구성 가능).

OpenClaw에는 X(구 Twitter) 게시물용 `x_search`와 가벼운 URL 가져오기용 `web_fetch`도 포함되어 있습니다. 이 단계에서는 `web_fetch`는 로컬에 머무르며, `web_search`와 `x_search`는 내부적으로 xAI Responses를 사용할 수 있습니다.

<Info>
  `web_search`는 브라우저 자동화가 아니라 가벼운 HTTP 도구입니다. JS가 많은 사이트나 로그인이 필요한 경우 [웹 브라우저](/ko/tools/browser)를 사용하세요. 특정 URL을 가져오려면 [Web Fetch](/ko/tools/web-fetch)를 사용하세요.
</Info>

## 빠른 시작

<Steps>
  <Step title="Choose a provider">
    provider를 선택하고 필요한 설정을 완료합니다. 일부 provider는 키가 필요 없고, 다른 provider는 API 키를 사용합니다. 자세한 내용은 아래 provider 페이지를 참조하세요.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    그러면 provider와 필요한 자격 증명이 저장됩니다. env var(예: `BRAVE_API_KEY`)를 설정하고 API 기반 provider에 대해 이 단계를 건너뛸 수도 있습니다.
  </Step>
  <Step title="Use it">
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

## provider 선택

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ko/tools/brave-search">
    스니펫이 포함된 구조화된 결과입니다. `llm-context` 모드와 국가/언어 필터를 지원합니다. 무료 티어를 사용할 수 있습니다.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/ko/plugins/codex-harness">
    Codex app-server 계정을 통한 출처 기반 AI 합성 답변입니다.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ko/tools/duckduckgo-search">
    키가 필요 없는 provider입니다. API 키가 필요 없습니다. 비공식 HTML 기반 통합입니다.
  </Card>
  <Card title="Exa" icon="brain" href="/ko/tools/exa-search">
    콘텐츠 추출(하이라이트, 텍스트, 요약)을 포함한 신경망 + 키워드 검색입니다.
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ko/tools/firecrawl">
    구조화된 결과입니다. 깊은 추출에는 `firecrawl_search` 및 `firecrawl_scrape`와 함께 사용하는 것이 가장 좋습니다.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ko/tools/gemini-search">
    Google Search grounding을 통한 인용 포함 AI 합성 답변입니다.
  </Card>
  <Card title="Grok" icon="zap" href="/ko/tools/grok-search">
    xAI 웹 grounding을 통한 인용 포함 AI 합성 답변입니다.
  </Card>
  <Card title="Kimi" icon="moon" href="/ko/tools/kimi-search">
    Moonshot 웹 검색을 통한 인용 포함 AI 합성 답변입니다. grounding되지 않은 채팅 fallback은 명시적으로 실패합니다.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ko/tools/minimax-search">
    MiniMax Token Plan 검색 API를 통한 구조화된 결과입니다.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ko/tools/ollama-search">
    로그인된 로컬 Ollama 호스트 또는 호스팅 Ollama API를 통한 검색입니다.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ko/tools/parallel-search">
    유료 Parallel Search API(`PARALLEL_API_KEY`)입니다. 더 높은 rate limit과 objective tuning을 제공합니다.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/ko/tools/parallel-search">
    키가 필요 없는 옵트인입니다. Parallel의 무료 Search MCP로, LLM에 최적화된 밀도 높은 발췌문을 제공하며 API 키가 필요 없습니다.
  </Card>
  <Card title="Perplexity" icon="search" href="/ko/tools/perplexity-search">
    콘텐츠 추출 제어와 도메인 필터링이 포함된 구조화된 결과입니다.
  </Card>
  <Card title="SearXNG" icon="server" href="/ko/tools/searxng-search">
    셀프 호스팅 메타 검색입니다. API 키가 필요 없습니다. Google, Bing, DuckDuckGo 등을 집계합니다.
  </Card>
  <Card title="Tavily" icon="globe" href="/ko/tools/tavily">
    검색 깊이, 주제 필터링, URL 추출용 `tavily_extract`가 포함된 구조화된 결과입니다.
  </Card>
</CardGroup>

### provider 비교

| Provider                                         | 결과 스타일                                                   | 필터                                            | API 키                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ko/tools/brave-search)                     | 구조화된 스니펫                                            | 국가, 언어, 시간, `llm-context` 모드      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/ko/plugins/codex-harness)    | AI 합성 + 출처 URL                                   | 도메인, 컨텍스트 크기, 사용자 위치             | 없음. Codex/OpenAI 로그인을 사용                                                         |
| [DuckDuckGo](/ko/tools/duckduckgo-search)           | 구조화된 스니펫                                            | --                                               | 없음(키 불필요)                                                                         |
| [Exa](/ko/tools/exa-search)                         | 구조화됨 + 추출됨                                         | 신경망/키워드 모드, 날짜, 콘텐츠 추출    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ko/tools/firecrawl)                    | 구조화된 스니펫                                            | `firecrawl_search` 도구를 통해                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ko/tools/gemini-search)                   | AI 합성 + 인용                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ko/tools/grok-search)                       | AI 합성 + 인용                                     | --                                               | xAI OAuth, `XAI_API_KEY`, 또는 `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/ko/tools/kimi-search)                       | AI 합성 + 인용. grounding되지 않은 채팅 fallback에서 실패 | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ko/tools/minimax-search)          | 구조화된 스니펫                                            | 리전(`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ko/tools/ollama-search)        | 구조화된 스니펫                                            | --                                               | 로그인된 로컬 호스트는 없음. 직접 `https://ollama.com` 검색에는 `OLLAMA_API_KEY` |
| [Parallel](/ko/tools/parallel-search)               | LLM 컨텍스트에 맞게 순위가 매겨진 밀도 높은 발췌문                          | --                                               | `PARALLEL_API_KEY`(유료)                                                               |
| [Parallel Search (Free)](/ko/tools/parallel-search) | LLM 컨텍스트에 맞게 순위가 매겨진 밀도 높은 발췌문                          | --                                               | 없음(무료 Search MCP)                                                                  |
| [Perplexity](/ko/tools/perplexity-search)           | 구조화된 스니펫                                            | 국가, 언어, 시간, 도메인, 콘텐츠 제한 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ko/tools/searxng-search)                 | 구조화된 스니펫                                            | 카테고리, 언어                             | 없음(셀프 호스팅)                                                                      |
| [Tavily](/ko/tools/tavily)                          | 구조화된 스니펫                                            | `tavily_search` 도구를 통해                         | `TAVILY_API_KEY`                                                                        |

## 자동 감지

## 네이티브 OpenAI 웹 검색

직접 OpenAI Responses 모델은 OpenClaw 웹 검색이 활성화되어 있고 관리형 provider가 고정되어 있지 않을 때 OpenAI의 호스팅 `web_search` 도구를 자동으로 사용합니다. 이는 번들 OpenAI Plugin의 provider 소유 동작이며, OpenAI 호환 프록시 기본 URL이나 Azure 경로가 아니라 네이티브 OpenAI API 트래픽에만 적용됩니다. OpenAI 모델에 대해 관리형 `web_search` 도구를 유지하려면 `tools.web.search.provider`를 `brave` 같은 다른 provider로 설정하거나, 관리형 검색과 네이티브 OpenAI 검색을 모두 비활성화하려면 `tools.web.search.enabled: false`를 설정하세요.

## 네이티브 Codex 웹 검색

Codex app-server 런타임은 웹 검색이 활성화되어 있고 관리형 provider가 선택되지 않았을 때 Codex의 호스팅 `web_search` 도구를 자동으로 사용합니다. 네이티브 호스팅 검색과 OpenClaw의 관리형 `web_search` 동적 도구는 상호 배타적이므로, 관리형 검색은 네이티브 도메인 제한을 우회할 수 없습니다. OpenClaw는 호스팅 검색을 사용할 수 없거나, 명시적으로 비활성화되었거나, 선택된 관리형 provider로 대체된 경우 관리형 도구를 사용합니다. OpenClaw는 Codex의 독립 실행형 `web.run` 확장을 비활성화된 상태로 유지합니다. 프로덕션 app-server 트래픽이 사용자 정의 `web` namespace를 거부하기 때문입니다.

- `tools.web.search.openaiCodex` 아래에서 네이티브 검색을 구성합니다
- `tools.web.search.provider: "codex"`를 설정하면 모든 상위 모델에 대해 Codex Hosted Search를 관리형 `web_search` provider로 프로비저닝합니다. 각 호출은 제한된 임시 Codex app-server 턴을 실행하며, Codex가 호스팅 `webSearch` 항목을 내보내지 않으면 실패합니다.
- `mode: "cached"`가 기본 선호값이지만, Codex는 제한 없는 app-server 턴에 대해 이를 라이브 외부 액세스로 해석합니다. 라이브 액세스를 명시적으로 요청하려면 `"live"`를 설정하세요
- OpenClaw의 관리형 `web_search`를 대신 사용하려면 `tools.web.search.provider`를 `brave` 같은 관리형 provider로 설정합니다
- Codex 호스팅 검색을 옵트아웃하려면 `tools.web.search.openaiCodex.enabled: false`를 설정합니다. 다른 관리형 provider는 계속 사용할 수 있습니다
- Codex 네이티브 도구 표면을 제한해도 관리형 `web_search`는 계속 사용할 수 있습니다
- `allowedDomains`가 설정된 경우, 호스팅 검색을 사용할 수 없으면 자동 관리형 fallback이 fail closed로 동작하므로 네이티브 허용 목록을 우회할 수 없습니다
- 도구가 비활성화된 LLM 전용 실행은 네이티브 검색과 관리형 검색을 모두 비활성화합니다
- `tools.web.search.enabled: false`는 관리형 검색과 네이티브 검색을 모두 비활성화합니다

영구적인 유효 Codex 검색 정책 변경은 새로 바인딩된 스레드를 시작하므로, 이미 로드된 app-server 스레드가 오래된 호스팅 검색 액세스를 유지할 수 없습니다. 턴별 임시 제한은 임시 제한 스레드를 사용하고 이후 재개를 위해 기존 바인딩을 보존합니다.

직접 OpenAI ChatGPT Responses 트래픽도 OpenAI의 호스팅 `web_search` 도구를 사용할 수 있습니다. 이 별도 경로는 `tools.web.search.openaiCodex.enabled: true`를 통해 계속 옵트인으로 유지되며, `api: "openai-chatgpt-responses"`를 사용하는 적격 `openai/*` 모델에만 적용됩니다.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

네이티브 Codex 검색을 지원하지 않는 런타임과 provider의 경우, Codex는 OpenClaw의 동적 도구 namespace를 통해 관리형 `web_search` fallback을 사용할 수 있습니다. Codex 호스팅 검색 대신 OpenClaw의 provider별 네트워크 제어가 필요할 때는 명시적인 관리형 provider를 사용하세요.

`provider: "codex"`를 선택하면 번들된 `codex` Plugin이 활성화되고 위에 표시된 것과 동일한 `tools.web.search.openaiCodex` 제한이 사용됩니다. 먼저 `openclaw models auth login --provider openai`로 Codex 앱 서버를 인증하세요. 상위 에이전트는 어떤 모델이나 런타임도 사용할 수 있으며, 제한된 검색 워커만 Codex를 통해 실행됩니다.

## 네트워크 안전성

관리형 HTTP `web_search` provider 호출은 OpenClaw의 보호된 fetch 경로를 사용합니다. 신뢰할 수 있는 provider API 호스트에 대해 OpenClaw는 해당 provider 호스트 이름에 한해서만 `198.18.0.0/15` 및 `fc00::/7` 범위의 Surge, Clash, sing-box fake-IP DNS 응답을 허용합니다. 그 밖의 private, 루프백, 링크 로컬, 메타데이터 대상은 계속 차단됩니다. Codex Hosted Search는 예외입니다. 제한된 워커가 네트워크 접근을 Codex 앱 서버의 hosted `web_search` 도구에 위임합니다.

이 자동 허용은 임의의 `web_fetch` URL에는 적용되지 않습니다. `web_fetch`의 경우 신뢰하는 프록시가 해당 합성 범위를 소유할 때만 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 및 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`를 명시적으로 활성화하세요.

## 웹 검색 설정

문서와 설정 흐름의 provider 목록은 알파벳순입니다. 자동 감지는 별도의 우선순위를 유지합니다.

`provider`가 설정되지 않은 경우 OpenClaw는 다음 순서로 provider를 확인하고 준비된 첫 번째 provider를 사용합니다.

API 기반 provider가 먼저입니다.

1. **Brave** -- `BRAVE_API_KEY` 또는 `plugins.entries.brave.config.webSearch.apiKey` (순서 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 또는 `plugins.entries.minimax.config.webSearch.apiKey` (순서 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` 또는 `models.providers.google.apiKey` (순서 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey` (순서 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 또는 `plugins.entries.moonshot.config.webSearch.apiKey` (순서 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 또는 `plugins.entries.perplexity.config.webSearch.apiKey` (순서 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webSearch.apiKey` (순서 60)
8. **Exa** -- `EXA_API_KEY` 또는 `plugins.entries.exa.config.webSearch.apiKey`; 선택 사항인 `plugins.entries.exa.config.webSearch.baseUrl`은 Exa endpoint를 재정의합니다 (순서 65)
9. **Tavily** -- `TAVILY_API_KEY` 또는 `plugins.entries.tavily.config.webSearch.apiKey` (순서 70)
10. **Parallel** -- `PARALLEL_API_KEY` 또는 `plugins.entries.parallel.config.webSearch.apiKey`를 통한 유료 Parallel Search API; 선택 사항인 `plugins.entries.parallel.config.webSearch.baseUrl`은 endpoint를 재정의합니다 (순서 75)

그다음은 구성된 endpoint provider입니다.

11. **SearXNG** -- `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl` (순서 200)

**Parallel Search (Free)**, **DuckDuckGo**, **Ollama Web Search**, **Codex Hosted Search** 같은 키 없는 provider는 `tools.web.search.provider`로 명시적으로 선택하거나 `openclaw configure --section web`을 통해 선택한 경우에만 사용할 수 있습니다. OpenClaw는 API 기반 provider가 구성되지 않았다는 이유만으로 관리형 `web_search` 쿼리를 키 없는 provider로 보내지 않습니다.

OpenAI Responses 모델은 예외입니다. `tools.web.search.provider`가 설정되지 않은 동안에는 위의 관리형 provider 대신 OpenAI의 네이티브 웹 검색을 사용합니다. 관리형 경로를 통해 라우팅하려면 `tools.web.search.provider`를 `parallel-free`(또는 다른 provider)로 설정하세요.

<Note>
  모든 provider 키 필드는 SecretRef 객체를 지원합니다. `plugins.entries.<plugin>.config.webSearch.apiKey` 아래의 Plugin 범위 SecretRef는 Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity, Tavily를 포함하여 설치된 API 기반 웹 검색 provider에 대해 확인되며, provider가 `tools.web.search.provider`를 통해 명시적으로 선택되었는지 자동 감지를 통해 선택되었는지와 관계없이 적용됩니다. 자동 감지 모드에서 OpenClaw는 선택된 provider 키만 확인합니다. 선택되지 않은 SecretRef는 비활성 상태로 남으므로 사용하지 않는 provider의 확인 비용을 지불하지 않고도 여러 provider를 구성해 둘 수 있습니다.
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

provider별 구성(API 키, 기본 URL, 모드)은 `plugins.entries.<plugin>.config.webSearch.*` 아래에 있습니다. Gemini는 전용 웹 검색 구성 및 `GEMINI_API_KEY` 다음의 낮은 우선순위 fallback으로 `models.providers.google.apiKey` 및 `models.providers.google.baseUrl`도 재사용할 수 있습니다. 예시는 provider 페이지를 참조하세요.
Grok은 `openclaw models auth login --provider xai --method oauth`의 xAI OAuth 인증 프로필도 재사용할 수 있으며, API 키 구성은 fallback으로 유지됩니다.

`tools.web.search.provider`는 번들 및 설치된 Plugin manifest가 선언한 웹 검색 provider ID를 기준으로 검증됩니다. `"brvae"` 같은 오타는 자동 감지로 조용히 fallback되는 대신 구성 검증에 실패합니다. 구성된 provider에 오래된 Plugin 근거만 있는 경우, 예를 들어 서드 파티 Plugin을 제거한 뒤 남은 `plugins.entries.<plugin>` 블록이 있는 경우, OpenClaw는 시작을 탄력적으로 유지하고 경고를 보고하여 Plugin을 다시 설치하거나 `openclaw doctor --fix`를 실행해 오래된 구성을 정리할 수 있게 합니다.

`web_fetch` fallback provider 선택은 별도입니다.

- `tools.web.fetch.provider`로 선택합니다.
- 또는 해당 필드를 생략하고 OpenClaw가 구성된 자격 증명에서 준비된 첫 번째 web-fetch provider를 자동 감지하도록 합니다.
- 샌드박스 처리되지 않은 `web_fetch`는 `contracts.webFetchProviders`를 선언한 설치된 Plugin provider를 사용할 수 있습니다. 샌드박스 처리된 fetch는 번들 provider와 검증된 공식 Plugin 설치를 허용하지만, 서드 파티 외부 Plugin은 제외합니다.
- 공식 Firecrawl Plugin은 `plugins.entries.firecrawl.config.webFetch.*` 아래에 구성되는 web-fetch fallback을 제공합니다.

`openclaw onboard` 또는 `openclaw configure --section web` 중에 **Kimi**를 선택하면 OpenClaw가 다음도 요청할 수 있습니다.

- Moonshot API 지역(`https://api.moonshot.ai/v1` 또는 `https://api.moonshot.cn/v1`)
- 기본 Kimi 웹 검색 모델(기본값은 `kimi-k2.6`)

`x_search`의 경우 `plugins.entries.xai.config.xSearch.*`를 구성하세요. 이는 채팅과 동일한 xAI 인증 프로필을 사용하거나 Grok 웹 검색에 사용되는 `XAI_API_KEY` / Plugin 웹 검색 자격 증명을 사용합니다.
레거시 `tools.web.x_search.*` 구성은 `openclaw doctor --fix`에 의해 자동 마이그레이션됩니다.
`openclaw onboard` 또는 `openclaw configure --section web` 중에 Grok을 선택하면 OpenClaw가 동일한 자격 증명으로 선택 사항인 `x_search` 설정도 제공할 수 있습니다. 이는 Grok 경로 내부의 별도 후속 단계이며, 별도의 최상위 웹 검색 provider 선택이 아닙니다. 다른 provider를 선택하면 OpenClaw는 `x_search` 프롬프트를 표시하지 않습니다.

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
| `search_lang`         | 검색 언어 코드(Brave만 해당)                         |
| `freshness`           | 시간 필터: `day`, `week`, `month` 또는 `year`        |
| `date_after`          | 이 날짜 이후의 결과(YYYY-MM-DD)                      |
| `date_before`         | 이 날짜 이전의 결과(YYYY-MM-DD)                      |
| `ui_lang`             | UI 언어 코드(Brave만 해당)                           |
| `domain_filter`       | 도메인 허용 목록/차단 목록 배열(Perplexity만 해당)   |
| `max_tokens`          | 총 콘텐츠 예산, 기본값 25000(Perplexity만 해당)      |
| `max_tokens_per_page` | 페이지당 토큰 제한, 기본값 2048(Perplexity만 해당)   |

<Warning>
  모든 매개변수가 모든 provider에서 작동하는 것은 아닙니다. Brave `llm-context` 모드는 `ui_lang`을 거부합니다. `date_before`도 `date_after`가 필요합니다. Brave 사용자 지정 freshness 범위에는 시작 날짜와 종료 날짜가 모두 필요하기 때문입니다.
  Gemini, Grok, Kimi는 인용이 포함된 하나의 합성 답변을 반환합니다. 이들은 공유 도구 호환성을 위해 `count`를 받지만, 근거 기반 답변의 형태를 바꾸지는 않습니다. Gemini는 `day` freshness를 최신성 힌트로 취급합니다. 더 넓은 freshness 값과 명시적 날짜는 Google Search grounding 시간 범위를 설정합니다.
  Perplexity는 Sonar/OpenRouter 호환성 경로(`plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 또는 `OPENROUTER_API_KEY`)를 사용할 때 동일하게 동작합니다.
  SearXNG는 신뢰할 수 있는 private-network 또는 루프백 호스트에 대해서만 `http://`를 허용합니다. 공개 SearXNG endpoint는 `https://`를 사용해야 합니다.
  Firecrawl과 Tavily는 `web_search`를 통해 `query`와 `count`만 지원합니다. 고급 옵션에는 전용 도구를 사용하세요.
</Warning>

## x_search

`x_search`는 xAI를 사용해 X(이전 Twitter) 게시물을 쿼리하고 인용이 포함된 AI 합성 답변을 반환합니다. 자연어 쿼리와 선택 사항인 구조화된 필터를 받습니다. OpenClaw는 이 도구 호출을 처리하는 요청에서만 내장 xAI `x_search` 도구를 활성화합니다.

<Note>
  xAI는 `x_search`가 키워드 검색, 의미 검색, 사용자 검색, thread fetch를 지원한다고 문서화합니다. repost, reply, bookmark, view 같은 게시물별 engagement 통계에는 정확한 게시물 URL 또는 status ID를 대상으로 한 조회를 선호하세요. 광범위한 키워드 검색은 올바른 게시물을 찾을 수는 있지만 게시물별 metadata가 덜 완전하게 반환될 수 있습니다. 좋은 패턴은 먼저 게시물을 찾은 다음, 해당 정확한 게시물에 초점을 맞춘 두 번째 `x_search` 쿼리를 실행하는 것입니다.
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`plugins.entries.xai.config.xSearch.baseUrl`이 설정된 경우 `x_search`는 `<baseUrl>/responses`에 게시합니다. 해당 필드가 생략되면 `plugins.entries.xai.config.webSearch.baseUrl`, 레거시 `tools.web.search.grok.baseUrl`, 마지막으로 공개 xAI endpoint로 fallback됩니다.

### x_search 매개변수

| 매개변수                    | 설명                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 검색 쿼리(필수)                                       |
| `allowed_x_handles`          | 결과를 특정 X 핸들로 제한                             |
| `excluded_x_handles`         | 특정 X 핸들 제외                                      |
| `from_date`                  | 이 날짜 이후 또는 당일의 게시물만 포함(YYYY-MM-DD)    |
| `to_date`                    | 이 날짜 이전 또는 당일의 게시물만 포함(YYYY-MM-DD)    |
| `enable_image_understanding` | xAI가 일치하는 게시물에 첨부된 이미지를 검사하도록 허용 |
| `enable_video_understanding` | xAI가 일치하는 게시물에 첨부된 동영상을 검사하도록 허용 |

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

도구 프로필이나 허용 목록을 사용하는 경우 `web_search`, `x_search` 또는 `group:web`을 추가하세요.

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## 관련 항목

- [웹 가져오기](/ko/tools/web-fetch) -- URL을 가져오고 읽기 쉬운 콘텐츠 추출
- [웹 브라우저](/ko/tools/browser) -- JS가 많은 사이트를 위한 전체 브라우저 자동화
- [Grok 검색](/ko/tools/grok-search) -- `web_search` 제공자로 Grok 사용
- [Ollama 웹 검색](/ko/tools/ollama-search) -- Ollama 호스트를 통한 키 없는 웹 검색
