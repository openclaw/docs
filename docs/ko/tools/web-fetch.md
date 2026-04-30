---
read_when:
    - URL을 가져와 읽기 쉬운 콘텐츠를 추출하려는 경우
    - web_fetch 또는 그 Firecrawl 대체 수단을 구성해야 합니다
    - web_fetch 제한 사항과 캐싱을 이해하려는 경우
sidebarTitle: Web Fetch
summary: web_fetch 도구 -- 가독성 있는 콘텐츠 추출을 포함한 HTTP 가져오기
title: 웹 가져오기
x-i18n:
    generated_at: "2026-04-30T06:56:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 도구는 일반 HTTP GET을 수행하고 읽을 수 있는 콘텐츠를 추출합니다
(HTML을 markdown 또는 텍스트로 변환). JavaScript는 **실행하지 않습니다**.

JS 의존도가 높은 사이트나 로그인으로 보호된 페이지에는 대신
[Web Browser](/ko/tools/browser)를 사용하세요.

## 빠른 시작

`web_fetch`는 **기본적으로 활성화되어 있습니다** -- 구성이 필요하지 않습니다. 에이전트가
즉시 호출할 수 있습니다.

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 도구 매개변수

<ParamField path="url" type="string" required>
가져올 URL입니다. `http(s)`만 지원합니다.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
주요 콘텐츠 추출 후의 출력 형식입니다.
</ParamField>

<ParamField path="maxChars" type="number">
출력을 이 문자 수로 잘라냅니다.
</ParamField>

## 작동 방식

<Steps>
  <Step title="Fetch">
    Chrome과 유사한 User-Agent와 `Accept-Language` 헤더로 HTTP GET을 보냅니다.
    비공개/내부 호스트 이름을 차단하고 리디렉션을 다시 확인합니다.
  </Step>
  <Step title="Extract">
    HTML 응답에서 Readability(주요 콘텐츠 추출)를 실행합니다.
  </Step>
  <Step title="Fallback (optional)">
    Readability가 실패하고 Firecrawl이 구성되어 있으면 봇 우회 모드로
    Firecrawl API를 통해 다시 시도합니다.
  </Step>
  <Step title="Cache">
    동일한 URL의 반복 fetch를 줄이기 위해 결과를 15분 동안(구성 가능) 캐시합니다.
  </Step>
</Steps>

## 구성

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl fallback

Readability 추출이 실패하면 `web_fetch`는 봇 우회와 더 나은 추출을 위해
[Firecrawl](/ko/tools/firecrawl)로 fallback할 수 있습니다.

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey`는 SecretRef 객체를 지원합니다.
레거시 `tools.web.fetch.firecrawl.*` 구성은 `openclaw doctor --fix`에 의해 자동 마이그레이션됩니다.

<Note>
  Firecrawl이 활성화되어 있고 해당 SecretRef가 해결되지 않았으며
  `FIRECRAWL_API_KEY` env fallback도 없으면 gateway 시작이 빠르게 실패합니다.
</Note>

<Note>
  Firecrawl `baseUrl` 재정의는 제한됩니다. `https://`와 공식 Firecrawl 호스트
  (`api.firecrawl.dev`)를 사용해야 합니다.
</Note>

현재 런타임 동작:

- `tools.web.fetch.provider`는 fetch fallback 제공자를 명시적으로 선택합니다.
- `provider`가 생략되면 OpenClaw는 사용 가능한 자격 증명에서 첫 번째 준비된 web-fetch
  제공자를 자동 감지합니다. 현재 번들 제공자는 Firecrawl입니다.
- Readability가 비활성화되어 있으면 `web_fetch`는 선택된 제공자 fallback으로 바로 넘어갑니다.
  사용 가능한 제공자가 없으면 실패한 상태로 닫힙니다.

## 제한 및 안전

- `maxChars`는 `tools.web.fetch.maxCharsCap`로 제한됩니다
- 응답 본문은 파싱 전에 `maxResponseBytes`로 제한됩니다. 지나치게 큰
  응답은 경고와 함께 잘립니다
- 비공개/내부 호스트 이름은 차단됩니다
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange`와
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`는 신뢰할 수 있는 fake-IP 프록시 스택을 위한 좁은 opt-in입니다. 프록시가
  해당 합성 범위를 소유하고 자체 대상 정책을 적용하지 않는 한 설정하지 마세요
- 리디렉션은 확인되며 `maxRedirects`로 제한됩니다
- `web_fetch`는 최선의 노력 방식입니다 -- 일부 사이트에는 [Web Browser](/ko/tools/browser)가 필요합니다

## 도구 프로필

도구 프로필 또는 허용 목록을 사용하는 경우 `web_fetch` 또는 `group:web`을 추가하세요.

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 관련 항목

- [Web Search](/ko/tools/web) -- 여러 제공자로 web 검색
- [Web Browser](/ko/tools/browser) -- JS 의존도가 높은 사이트를 위한 전체 browser 자동화
- [Firecrawl](/ko/tools/firecrawl) -- Firecrawl 검색 및 scrape 도구
