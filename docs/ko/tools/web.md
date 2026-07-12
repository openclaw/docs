---
read_when:
    - web_search를 활성화하거나 구성하려고 합니다
    - x_search를 활성화하거나 구성하려고 합니다
    - 검색 제공업체를 선택해야 합니다
    - 자동 감지 및 제공업체 선택을 이해하려는 경우
sidebarTitle: Web Search
summary: web_search, x_search, web_fetch -- 웹 검색, X 게시물 검색 또는 페이지 콘텐츠 가져오기
title: 웹 검색
x-i18n:
    generated_at: "2026-07-12T01:17:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search`는 구성된 제공자를 사용해 웹을 검색하고 정규화된 결과를 반환하며,
검색어별로 15분 동안 캐시합니다(설정 가능). OpenClaw에는 X(이전 Twitter) 게시물용
`x_search`와 간단한 URL 가져오기용 `web_fetch`도 포함되어 있습니다. `web_fetch`는
항상 로컬에서 실행됩니다. Grok이 제공자인 경우 `web_search`는 xAI Responses를
통하며, `x_search`는 항상 xAI Responses를 사용합니다.

<Info>
  `web_search`는 브라우저 자동화가 아닌 경량 HTTP 도구입니다. JavaScript 의존도가
  높은 사이트나 로그인이 필요한 경우 [웹 브라우저](/ko/tools/browser)를 사용하세요.
  특정 URL을 가져오려면 [웹 가져오기](/ko/tools/web-fetch)를 사용하세요.
</Info>

## 빠른 시작

<Steps>
  <Step title="제공자 선택">
    제공자를 선택하고 필요한 설정을 완료하세요. 일부 제공자는 키 없이 사용할 수
    있지만, 다른 제공자는 API 키가 필요합니다. 자세한 내용은 아래 제공자 페이지를
    참조하세요.
  </Step>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    ```
    이 명령은 제공자와 필요한 자격 증명을 저장합니다. API 기반 제공자의 경우 이
    단계를 건너뛰고 제공자의 환경 변수(예: `BRAVE_API_KEY`)를 설정할 수도 있습니다.
  </Step>
  <Step title="사용">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X 게시물의 경우:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 제공자 선택

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ko/tools/brave-search">
    스니펫이 포함된 구조화된 결과를 제공합니다. `llm-context` 모드와 국가/언어 필터를 지원합니다. 무료 등급을 이용할 수 있습니다.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/ko/plugins/codex-harness">
    Codex 앱 서버 계정을 통해 출처에 근거하여 AI가 종합한 답변을 제공합니다.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ko/tools/duckduckgo-search">
    키가 필요 없는 제공자입니다. API 키가 필요하지 않습니다. 비공식 HTML 기반 연동입니다.
  </Card>
  <Card title="Exa" icon="brain" href="/ko/tools/exa-search">
    콘텐츠 추출(하이라이트, 텍스트, 요약)을 지원하는 신경망 및 키워드 검색입니다.
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ko/tools/firecrawl">
    구조화된 결과를 제공합니다. 심층 추출에는 `firecrawl_search` 및 `firecrawl_scrape`와 함께 사용하는 것이 가장 좋습니다.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ko/tools/gemini-search">
    Google Search 기반 검색을 통해 인용이 포함된 AI 종합 답변을 제공합니다.
  </Card>
  <Card title="Grok" icon="zap" href="/ko/tools/grok-search">
    xAI 웹 기반 검색을 통해 인용이 포함된 AI 종합 답변을 제공합니다.
  </Card>
  <Card title="Kimi" icon="moon" href="/ko/tools/kimi-search">
    Moonshot 웹 검색을 통해 인용이 포함된 AI 종합 답변을 제공하며, 근거 없는 채팅 대체 경로는 명시적으로 실패합니다.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ko/tools/minimax-search">
    MiniMax Token Plan 검색 API를 통해 구조화된 결과를 제공합니다.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ko/tools/ollama-search">
    로그인된 로컬 Ollama 호스트 또는 호스팅된 Ollama API를 통해 검색합니다.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ko/tools/parallel-search">
    유료 Parallel Search API(`PARALLEL_API_KEY`)로, 더 높은 요청 한도와 목표 조정을 제공합니다.
  </Card>
  <Card title="Parallel Search (무료)" icon="layer-group" href="/ko/tools/parallel-search">
    키 없이 선택적으로 사용할 수 있습니다. LLM에 최적화된 밀도 높은 발췌문을 제공하는 Parallel의 무료 Search MCP이며 API 키가 필요하지 않습니다.
  </Card>
  <Card title="Perplexity" icon="search" href="/ko/tools/perplexity-search">
    콘텐츠 추출 제어 및 도메인 필터링을 지원하는 구조화된 결과를 제공합니다.
  </Card>
  <Card title="SearXNG" icon="server" href="/ko/tools/searxng-search">
    자체 호스팅 메타 검색입니다. API 키가 필요하지 않습니다. Google, Bing, DuckDuckGo 등을 통합합니다.
  </Card>
  <Card title="Tavily" icon="globe" href="/ko/tools/tavily">
    검색 깊이와 주제 필터링을 지원하는 구조화된 결과 및 URL 추출용 `tavily_extract`를 제공합니다.
  </Card>
</CardGroup>

### 제공자 비교

| 제공자                                           | 결과 형식                                                      | 필터                                             | API 키                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ko/tools/brave-search)                     | 구조화된 스니펫                                                | 국가, 언어, 시간, `llm-context` 모드             | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/ko/plugins/codex-harness)    | AI 종합 답변 + 출처 URL                                        | 도메인, 컨텍스트 크기, 사용자 위치               | 없음. Codex/OpenAI 로그인을 사용                                                       |
| [DuckDuckGo](/ko/tools/duckduckgo-search)           | 구조화된 스니펫                                                | --                                               | 없음(키 불필요)                                                                         |
| [Exa](/ko/tools/exa-search)                         | 구조화된 결과 + 추출된 콘텐츠                                  | 신경망/키워드 모드, 날짜, 콘텐츠 추출            | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ko/tools/firecrawl)                    | 구조화된 스니펫                                                | `firecrawl_search` 도구를 통해                   | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ko/tools/gemini-search)                   | AI 종합 답변 + 인용                                            | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ko/tools/grok-search)                       | AI 종합 답변 + 인용                                            | --                                               | xAI OAuth, `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey`             |
| [Kimi](/ko/tools/kimi-search)                       | AI 종합 답변 + 인용. 근거 없는 채팅 대체 경로에서는 실패       | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ko/tools/minimax-search)          | 구조화된 스니펫                                                | 지역(`global` / `cn`)                            | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ko/tools/ollama-search)        | 구조화된 스니펫                                                | --                                               | 로그인된 로컬 호스트는 없음. `https://ollama.com` 직접 검색에는 `OLLAMA_API_KEY` 필요   |
| [Parallel](/ko/tools/parallel-search)               | LLM 컨텍스트에 맞게 순위가 지정된 밀도 높은 발췌문             | --                                               | `PARALLEL_API_KEY`(유료)                                                                |
| [Parallel Search (무료)](/ko/tools/parallel-search) | LLM 컨텍스트에 맞게 순위가 지정된 밀도 높은 발췌문             | --                                               | 없음(무료 Search MCP)                                                                   |
| [Perplexity](/ko/tools/perplexity-search)           | 구조화된 스니펫                                                | 국가, 언어, 시간, 도메인, 콘텐츠 제한            | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ko/tools/searxng-search)                 | 구조화된 스니펫                                                | 카테고리, 언어                                   | 없음(자체 호스팅)                                                                       |
| [Tavily](/ko/tools/tavily)                          | 구조화된 스니펫                                                | `tavily_search` 도구를 통해                      | `TAVILY_API_KEY`                                                                        |

## 자동 감지

문서와 설정 흐름의 제공자 목록은 알파벳순입니다. 자동 감지는 별도의 고정된 우선순위를
사용하며, 자격 증명이 필요한 제공자(`requiresCredential !== false`) 중 구성된
자격 증명을 찾은 경우에만 해당 제공자를 선택합니다. `provider`가 설정되지 않은 경우,
OpenClaw는 다음 순서로 제공자를 확인하고 준비된 첫 번째 제공자를 사용합니다.

먼저 API 기반 제공자:

1. **Brave** -- `BRAVE_API_KEY` 또는 `plugins.entries.brave.config.webSearch.apiKey`(순서 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 또는 `plugins.entries.minimax.config.webSearch.apiKey`(순서 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` 또는 `models.providers.google.apiKey`(순서 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey`(순서 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 또는 `plugins.entries.moonshot.config.webSearch.apiKey`(순서 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 또는 `plugins.entries.perplexity.config.webSearch.apiKey`(순서 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 또는 `plugins.entries.firecrawl.config.webSearch.apiKey`(순서 60)
8. **Exa** -- `EXA_API_KEY` 또는 `plugins.entries.exa.config.webSearch.apiKey`. 선택적 `plugins.entries.exa.config.webSearch.baseUrl`은 Exa 엔드포인트를 재정의합니다(순서 65).
9. **Tavily** -- `TAVILY_API_KEY` 또는 `plugins.entries.tavily.config.webSearch.apiKey`(순서 70)
10. **Parallel** -- `PARALLEL_API_KEY` 또는 `plugins.entries.parallel.config.webSearch.apiKey`를 통한 유료 Parallel Search API. 선택적 `plugins.entries.parallel.config.webSearch.baseUrl`은 엔드포인트를 재정의합니다(순서 75).

그다음 구성된 엔드포인트 제공자:

11. **SearXNG** -- `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`(순서 200)

**Parallel Search (무료)**, **DuckDuckGo**, **Ollama Web Search**,
**Codex Hosted Search**처럼 키가 필요 없는 제공자는 내부 순서 값이 있어도 자동
감지에서 선택되지 않습니다. `tools.web.search.provider`로 명시적으로 선택하거나
`openclaw configure --section web`을 통해 선택한 경우에만 사용됩니다. API 기반
제공자가 구성되지 않았다는 이유만으로 OpenClaw가 관리형 `web_search` 쿼리를 키가
필요 없는 제공자에게 보내지는 않습니다.

OpenAI Responses 모델은 예외입니다. `tools.web.search.provider`가 설정되지 않은
동안에는 위의 관리형 제공자 대신 OpenAI의 네이티브 웹 검색을 사용합니다(아래 참조).
관리형 경로를 통해 라우팅하려면 `tools.web.search.provider`를 `parallel-free`
또는 다른 제공자로 설정하세요.

<Note>
  모든 제공자 키 필드는 SecretRef 객체를 지원합니다.
  `plugins.entries.<plugin>.config.webSearch.apiKey` 아래의 Plugin 범위 SecretRef는
  Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity,
  Tavily를 포함하여 설치된 API 기반 웹 검색 제공자에 대해 해석됩니다.
  이는 제공자가 `tools.web.search.provider`를 통해 명시적으로 선택되었든 자동 감지를
  통해 선택되었든 동일합니다. 자동 감지 모드에서 OpenClaw는 선택된 제공자의 키만
  해석합니다. 선택되지 않은 SecretRef는 비활성 상태로 유지되므로 사용하지 않는
  제공자의 해석 비용을 부담하지 않고 여러 제공자를 구성해 둘 수 있습니다.
</Note>

## OpenAI 네이티브 웹 검색

OpenAI Responses 모델(`api: "openai-responses"`, 공급자 `openai`, 기본 URL이 없거나 공식 OpenAI API 기본 URL 사용)은 OpenClaw 웹 검색이 활성화되어 있고 관리형 공급자가 고정되지 않은 경우 OpenAI에서 호스팅하는 `web_search` 도구를 자동으로 사용합니다. 이는 번들 OpenAI Plugin에서 공급자가 소유하는 동작이며, OpenAI 호환 프록시 기본 URL이나 Azure 경로에는 적용되지 않습니다. OpenAI 모델에서 관리형 `web_search` 도구를 계속 사용하려면 `tools.web.search.provider`를 `brave` 같은 다른 공급자로 설정하고, 관리형 검색과 네이티브 OpenAI 검색을 모두 비활성화하려면 `tools.web.search.enabled: false`를 설정하세요.

## 네이티브 Codex 웹 검색

Codex 앱 서버 런타임은 웹 검색이 활성화되어 있고 관리형 공급자가 선택되지 않은 경우 Codex에서 호스팅하는 `web_search` 도구를 자동으로 사용합니다. 네이티브 호스팅 검색과 OpenClaw의 관리형 `web_search` 동적 도구는 상호 배타적이므로, 관리형 검색으로 네이티브 도메인 제한을 우회할 수 없습니다. OpenClaw는 호스팅 검색을 사용할 수 없거나 명시적으로 비활성화했거나 선택한 관리형 공급자로 대체한 경우 관리형 도구를 사용합니다. 프로덕션 앱 서버 트래픽이 사용자가 정의한 `web` 네임스페이스를 거부하므로 OpenClaw는 Codex의 독립 실행형 `web.run` 확장을 비활성화된 상태(`features.standalone_web_search: false`)로 유지합니다.

- 네이티브 검색은 `tools.web.search.openaiCodex`에서 구성하세요.
- `tools.web.search.provider: "codex"`를 설정하면 모든 상위 모델에 대해 Codex 호스팅 검색을 관리형 `web_search` 공급자로 프로비저닝합니다. 각 호출은 범위가 제한된 임시 Codex 앱 서버 턴을 실행하며, Codex가 호스팅된 `webSearch` 항목을 내보내지 않으면 실패합니다.
- `mode: "cached"`가 기본 설정이지만 Codex는 제한 없는 앱 서버 턴에서 이를 실시간 외부 액세스로 해석합니다. 실시간 액세스를 명시적으로 요청하려면 `"live"`를 설정하세요.
- OpenClaw의 관리형 `web_search`를 대신 사용하려면 `tools.web.search.provider`를 `brave` 같은 관리형 공급자로 설정하세요.
- Codex 호스팅 검색을 사용하지 않으려면 `tools.web.search.openaiCodex.enabled: false`를 설정하세요. 다른 관리형 공급자는 계속 사용할 수 있습니다.
- Codex 네이티브 도구 표면을 제한해도 관리형 `web_search`는 계속 사용할 수 있습니다.
- `allowedDomains`가 설정된 경우 호스팅 검색을 사용할 수 없으면 자동 관리형 대체가 실패 시 차단되므로 네이티브 허용 목록을 우회할 수 없습니다.
- 도구가 비활성화된 LLM 전용 실행에서는 네이티브 검색과 관리형 검색이 모두 비활성화됩니다.
- `tools.web.search.enabled: false`는 관리형 검색과 네이티브 검색을 모두 비활성화합니다.

영구적으로 적용되는 Codex 검색 정책이 변경되면 이미 로드된 앱 서버 스레드가 오래된 호스팅 검색 액세스를 유지하지 못하도록 새 바인딩 스레드를 시작합니다. 턴별 임시 제한에는 일시적으로 제한된 스레드를 사용하며 나중에 재개할 수 있도록 기존 바인딩을 보존합니다.

직접 OpenAI ChatGPT Responses 트래픽에서도 OpenAI가 호스팅하는 `web_search` 도구를 사용할 수 있습니다. 이 별도 경로는 `tools.web.search.openaiCodex.enabled: true`를 통해 선택적으로 활성화해야 하며, `api: "openai-chatgpt-responses"`를 사용하는 적격 `openai/*` 모델에만 적용됩니다.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // 선택 사항: Codex가 아닌 상위 모델에서도 Codex 호스팅 검색을 사용합니다.
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

네이티브 Codex 검색을 지원하지 않는 런타임과 공급자에서는 Codex가 OpenClaw의 동적 도구 네임스페이스를 통해 관리형 `web_search` 대체 수단을 사용할 수 있습니다. Codex 호스팅 검색 대신 OpenClaw 공급자별 네트워크 제어가 필요한 경우 관리형 공급자를 명시적으로 사용하세요.

`provider: "codex"`를 선택하면 번들 `codex` Plugin이 활성화되고 위에 표시된 것과 동일한 `tools.web.search.openaiCodex` 제한이 사용됩니다. 먼저 `openclaw models auth login --provider openai`로 Codex 앱 서버를 인증하세요. 상위 에이전트는 어떤 모델이나 런타임이든 사용할 수 있으며, 범위가 제한된 검색 작업자만 Codex를 통해 실행됩니다.

## 네트워크 안전

관리형 HTTP `web_search` 공급자 호출은 현재 공급자 자체 호스트 이름으로 범위가 제한된 OpenClaw의 보호된 가져오기 경로를 사용합니다. 해당 호스트 이름에 한해서만 OpenClaw는 `198.18.0.0/15`와 `fc00::/7`의 Surge, Clash 및 sing-box 가짜 IP DNS 응답을 허용합니다. 그 밖의 사설, 루프백, 링크 로컬 및 메타데이터 대상은 계속 차단됩니다. Codex 호스팅 검색은 예외입니다. 범위가 제한된 작업자가 네트워크 액세스를 Codex 앱 서버의 호스팅 `web_search` 도구에 위임합니다.

이 자동 허용은 임의의 `web_fetch` URL에는 적용되지 않습니다. `web_fetch`에서는 신뢰할 수 있는 프록시가 해당 합성 범위를 소유한 경우에만 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange`와 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`를 명시적으로 활성화하세요.

## 구성

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 기본값: true
        provider: "brave", // 또는 자동 감지를 사용하려면 생략
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

공급자별 구성(API 키, 기본 URL, 모드)은 `plugins.entries.<plugin>.config.webSearch.*` 아래에 있습니다. Gemini는 전용 웹 검색 구성과 `GEMINI_API_KEY` 다음의 낮은 우선순위 대체 값으로 `models.providers.google.apiKey`와 `models.providers.google.baseUrl`도 재사용할 수 있습니다. 예시는 공급자 페이지를 참조하세요.
Grok은 `openclaw models auth login --provider xai --method oauth`에서 생성한 xAI OAuth 인증 프로필도 재사용할 수 있으며, API 키 구성은 계속 대체 수단으로 사용됩니다.

`tools.web.search.provider`는 번들 및 설치된 Plugin 매니페스트에서 선언한 웹 검색 공급자 ID를 기준으로 검증됩니다. `"brvae"` 같은 오타는 자동 감지로 조용히 대체되지 않고 구성 검증에 실패합니다. 구성된 공급자에 서드 파티 Plugin 제거 후 남은 `plugins.entries.<plugin>` 블록 같은 오래된 Plugin 증거만 있는 경우 OpenClaw는 시작 복원력을 유지하고 경고를 보고하므로, Plugin을 다시 설치하거나 `openclaw doctor --fix`를 실행하여 오래된 구성을 정리할 수 있습니다.

`web_fetch` 대체 공급자 선택은 별개입니다.

- `tools.web.fetch.provider`로 선택하세요.
- 또는 해당 필드를 생략하면 OpenClaw가 구성된 자격 증명에서 준비된 첫 번째 웹 가져오기 공급자를 자동으로 감지합니다.
- 샌드박스 외부의 `web_fetch`는 `contracts.webFetchProviders`를 선언한 설치된 Plugin 공급자를 사용할 수 있습니다. 샌드박스 내 가져오기는 번들 공급자와 검증된 공식 Plugin 설치를 허용하지만 서드 파티 외부 Plugin은 제외합니다.
- 공식 Firecrawl Plugin은 현재 유일한 번들 `webFetchProviders` 기여자이며 `plugins.entries.firecrawl.config.webFetch.*`에서 구성합니다.

`openclaw onboard` 또는 `openclaw configure --section web` 중에 **Kimi**를 선택하면 OpenClaw가 다음 항목도 요청할 수 있습니다.

- Moonshot API 리전(`https://api.moonshot.ai/v1` 또는 `https://api.moonshot.cn/v1`)
- 기본 Kimi 웹 검색 모델(기본값: `kimi-k2.6`)

`x_search`는 `plugins.entries.xai.config.xSearch.*`에서 구성하세요. 채팅과 동일한 xAI 인증 프로필이나 Grok 웹 검색에서 사용하는 `XAI_API_KEY`/Plugin 웹 검색 자격 증명을 사용합니다.
레거시 `tools.web.x_search.*` 구성은 `openclaw doctor --fix`에 의해 자동으로 마이그레이션됩니다.
`openclaw onboard` 또는 `openclaw configure --section web` 중에 Grok을 선택하면 OpenClaw는 Grok 설정이 완료된 직후 동일한 자격 증명으로 선택적 `x_search` 설정도 제공합니다. 이는 별도의 최상위 웹 검색 공급자 선택이 아니라 Grok 경로 내의 별도 후속 단계입니다. 다른 공급자를 선택하면 OpenClaw는 `x_search` 프롬프트를 표시하지 않습니다.

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
    Gateway 프로세스 환경에서 공급자 환경 변수를 설정하세요.

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gateway 설치의 경우 `~/.openclaw/.env`에 넣으세요.
    [환경 변수](/ko/help/faq#env-vars-and-env-loading)를 참조하세요.

  </Tab>
</Tabs>

## 도구 매개변수

| 매개변수              | 설명                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | 검색 질의(필수)                                                    |
| `count`               | 반환할 결과 수(1~10, 기본값: 5)                                   |
| `country`             | 두 글자 ISO 국가 코드(예: "US", "DE")                              |
| `language`            | ISO 639-1 언어 코드(예: "en", "de")                                |
| `search_lang`         | 검색 언어 코드(Brave 전용)                                        |
| `freshness`           | 시간 필터: `day`, `week`, `month` 또는 `year`                      |
| `date_after`          | 이 날짜 이후의 결과(YYYY-MM-DD)                                   |
| `date_before`         | 이 날짜 이전의 결과(YYYY-MM-DD)                                   |
| `ui_lang`             | UI 언어 코드(Brave 전용)                                          |
| `domain_filter`       | 도메인 허용 목록/차단 목록 배열(Perplexity 전용)                   |
| `max_tokens`          | 전체 콘텐츠 토큰 예산, 네이티브 Perplexity Search API 전용         |
| `max_tokens_per_page` | 페이지별 추출 토큰 제한, 네이티브 Perplexity Search API 전용       |

<Warning>
  모든 매개변수가 모든 공급자에서 작동하는 것은 아닙니다. Brave `llm-context` 모드는 `ui_lang`을 거부합니다. 또한 Brave의 사용자 지정 최신성 범위에는 시작일과 종료일이 모두 필요하므로 `date_before`를 사용하려면 `date_after`도 필요합니다.
  Gemini, Grok 및 Kimi는 인용이 포함된 하나의 종합 답변을 반환합니다. 공유 도구 호환성을 위해 `count`를 허용하지만, 근거 기반 답변의 형식은 변경되지 않습니다. Gemini는 `day` 최신성을 최근성 힌트로 처리하며, 더 넓은 최신성 값과 명시적 날짜는 Google Search 근거 설정의 시간 범위를 지정합니다.
  Sonar/OpenRouter 호환 경로(`plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 또는 `OPENROUTER_API_KEY`)를 사용할 때 Perplexity도 같은 방식으로 동작합니다. 또한 해당 경로에서는 `max_tokens`와 `max_tokens_per_page`가 지원되지 않습니다.
  SearXNG는 신뢰할 수 있는 사설 네트워크 또는 루프백 호스트에만 `http://`를 허용합니다. 공개 SearXNG 엔드포인트는 `https://`를 사용해야 합니다.
  Firecrawl과 Tavily는 `web_search`를 통해 `query`와 `count`만 지원합니다. 고급 옵션에는 전용 도구를 사용하세요.
</Warning>

## x_search

`x_search`는 xAI를 사용하여 X(이전 명칭 Twitter) 게시물을 검색하고 인용이 포함된 AI 종합 답변을 반환합니다. 자연어 질의와 선택적 구조화 필터를 허용합니다. OpenClaw는 내장 xAI `x_search` 도구를 영구적으로 등록해 두지 않고 요청별로 구성하므로, 실제로 호출하는 턴에서만 활성화됩니다.

<Warning>
  `x_search`는 xAI 서버에서 실행됩니다. xAI는 도구 호출 1,000회당 5달러와 모델의 입력 및 출력 토큰 비용을 청구합니다.
</Warning>

<Note>
  xAI 문서에 따르면 `x_search`는 키워드 검색, 의미론적 검색, 사용자 검색 및 스레드 가져오기를 지원합니다. 재게시, 답글, 북마크 또는 조회 수 같은 게시물별 참여 통계를 확인하려면 정확한 게시물 URL이나 상태 ID를 대상으로 조회하는 것이 좋습니다. 광범위한 키워드 검색으로 올바른 게시물을 찾을 수는 있지만 게시물별 메타데이터가 덜 완전할 수 있습니다. 권장 패턴은 먼저 게시물을 찾은 다음 해당 게시물에 초점을 맞춘 두 번째 `x_search` 질의를 실행하는 것입니다.
</Note>

### x_search 구성

`enabled`를 생략하면 활성 모델의 제공자가 `xai`이고 xAI 자격 증명을 확인할 수 있을 때만 `x_search`가 노출됩니다. 활성 모델의 제공자가 xAI가 아닌 것으로 알려진 경우, 제공자 간 사용을 명시적으로 활성화하려면 `plugins.entries.xai.config.xSearch.enabled`를 `true`로 설정하세요. 활성 모델 제공자가 없거나 확인되지 않으면 도구는 계속 숨겨집니다. 모든 제공자에서 비활성화하려면 `enabled`를 `false`로 설정하세요. xAI 자격 증명은 항상 필요합니다.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // required for a known non-xAI model provider
            model: "grok-4.3",
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

`plugins.entries.xai.config.xSearch.baseUrl`이 설정되어 있으면 `x_search`는 `<baseUrl>/responses`로 요청을 보냅니다. 해당 필드를 생략하면 `plugins.entries.xai.config.webSearch.baseUrl`, 레거시 `tools.web.search.grok.baseUrl`, 마지막으로 공개 xAI 엔드포인트(`https://api.x.ai/v1`) 순으로 대체 사용합니다.

### x_search 매개변수

| 매개변수                     | 설명                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 검색 쿼리(필수)                                        |
| `allowed_x_handles`          | 결과를 최대 20개의 X 핸들로 제한                       |
| `excluded_x_handles`         | 최대 20개의 X 핸들을 제외                              |
| `from_date`                  | 이 날짜 이후 또는 당일의 게시물만 포함(YYYY-MM-DD)     |
| `to_date`                    | 이 날짜 이전 또는 당일의 게시물만 포함(YYYY-MM-DD)     |
| `enable_image_understanding` | xAI가 일치하는 게시물에 첨부된 이미지를 검사하도록 허용 |
| `enable_video_understanding` | xAI가 일치하는 게시물에 첨부된 동영상을 검사하도록 허용 |

`allowed_x_handles`와 `excluded_x_handles`는 함께 사용할 수 없습니다.

### x_search 예제

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

## 예제

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

## 관련 문서

- [웹 가져오기](/ko/tools/web-fetch) -- URL을 가져와 읽을 수 있는 콘텐츠 추출
- [웹 브라우저](/ko/tools/browser) -- JavaScript 의존도가 높은 사이트를 위한 전체 브라우저 자동화
- [Grok 검색](/ko/tools/grok-search) -- `web_search` 제공자로 사용하는 Grok
- [Ollama 웹 검색](/ko/tools/ollama-search) -- Ollama 호스트를 통한 키 없는 웹 검색
