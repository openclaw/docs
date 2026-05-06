---
read_when:
    - URL을 가져와 읽기 쉬운 콘텐츠를 추출하려는 경우
    - web_fetch 또는 해당 Firecrawl 폴백을 구성해야 합니다
    - web_fetch 제한과 캐싱을 이해하려는 경우
sidebarTitle: Web Fetch
summary: web_fetch 도구 -- 가독성 있는 콘텐츠 추출을 지원하는 HTTP 가져오기
title: 웹 가져오기
x-i18n:
    generated_at: "2026-05-06T18:01:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 도구는 일반 HTTP GET을 수행하고 읽을 수 있는 콘텐츠를 추출합니다
(HTML을 markdown 또는 text로 변환). JavaScript는 실행하지 **않습니다**.

JS가 많은 사이트나 로그인으로 보호된 페이지에는 대신
[웹 브라우저](/ko/tools/browser)를 사용하세요.

## 빠른 시작

`web_fetch`는 **기본적으로 활성화되어 있습니다** -- 설정이 필요 없습니다. 에이전트가
즉시 호출할 수 있습니다.

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 도구 매개변수

<ParamField path="url" type="string" required>
가져올 URL입니다. `http(s)`만 지원합니다.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
주요 콘텐츠 추출 후 출력 형식입니다.
</ParamField>

<ParamField path="maxChars" type="number">
출력을 지정한 문자 수로 잘라냅니다.
</ParamField>

## 작동 방식

<Steps>
  <Step title="Fetch">
    Chrome과 유사한 User-Agent 및 `Accept-Language` 헤더로 HTTP GET을
    보냅니다. 비공개/내부 호스트 이름을 차단하고 리디렉션을 다시 확인합니다.
  </Step>
  <Step title="Extract">
    HTML 응답에서 Readability(주요 콘텐츠 추출)를 실행합니다.
  </Step>
  <Step title="Fallback (optional)">
    Readability가 실패하고 Firecrawl이 설정되어 있으면 봇 우회 모드로
    Firecrawl API를 통해 다시 시도합니다.
  </Step>
  <Step title="Cache">
    동일한 URL의 반복 가져오기를 줄이기 위해 결과를 15분 동안(설정 가능)
    캐시합니다.
  </Step>
</Steps>

## 설정

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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

## Firecrawl 폴백

Readability 추출이 실패하면 `web_fetch`는 봇 우회와 더 나은 추출을 위해
[Firecrawl](/ko/tools/firecrawl)로 폴백할 수 있습니다.

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
레거시 `tools.web.fetch.firecrawl.*` 설정은 `openclaw doctor --fix`로 자동 마이그레이션됩니다.

<Note>
  Firecrawl이 활성화되어 있고 해당 SecretRef가 확인되지 않았으며
  `FIRECRAWL_API_KEY` env 폴백도 없으면 Gateway 시작이 빠르게 실패합니다.
</Note>

<Note>
  Firecrawl `baseUrl` 재정의는 제한되어 있습니다. 호스팅 트래픽은
  `https://api.firecrawl.dev`를 사용하며, 자체 호스팅 재정의는 비공개 또는
  내부 엔드포인트를 대상으로 해야 하고 `http://`는 이러한 비공개 대상에만 허용됩니다.
</Note>

현재 런타임 동작:

- `tools.web.fetch.provider`는 가져오기 폴백 제공자를 명시적으로 선택합니다.
- `provider`가 생략되면 OpenClaw는 사용 가능한 자격 증명에서 준비된 첫 번째 web-fetch
  제공자를 자동 감지합니다. 샌드박스가 아닌 `web_fetch`는
  `contracts.webFetchProviders`를 선언하고 런타임에 일치하는 제공자를 등록하는
  설치된 plugins를 사용할 수 있습니다. 현재 번들 제공자는 Firecrawl입니다.
- 샌드박스 처리된 `web_fetch` 호출은 번들 제공자로 제한됩니다.
- Readability가 비활성화되어 있으면 `web_fetch`는 선택된
  제공자 폴백으로 바로 건너뜁니다. 사용 가능한 제공자가 없으면 닫힌 상태로 실패합니다.

## 신뢰할 수 있는 env 프록시

배포에서 `web_fetch`가 신뢰할 수 있는 아웃바운드 HTTP(S) 프록시를 거쳐야 한다면
`tools.web.fetch.useTrustedEnvProxy: true`를 설정하세요.

이 모드에서도 OpenClaw는 요청을 보내기 전에 호스트 이름 기반 SSRF 검사를 적용하지만,
로컬 DNS 고정을 수행하는 대신 프록시가 DNS를 확인하도록 합니다. 프록시가 운영자가
제어하며 DNS 확인 후 아웃바운드 정책을 적용하는 경우에만 활성화하세요.

<Note>
  HTTP(S) 프록시 env 변수가 설정되어 있지 않거나 대상 호스트가
  `NO_PROXY`로 제외된 경우, `web_fetch`는 로컬 DNS 고정이 있는 일반 엄격 경로로
  폴백합니다.
</Note>

## 제한 및 안전성

- `maxChars`는 `tools.web.fetch.maxCharsCap`로 제한됩니다
- 응답 본문은 파싱 전에 `maxResponseBytes`로 제한되며, 너무 큰
  응답은 경고와 함께 잘립니다
- 비공개/내부 호스트 이름은 차단됩니다
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange`와
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`는 신뢰할 수 있는 가짜 IP
  프록시 스택을 위한 좁은 옵트인입니다. 프록시가 해당 합성 범위를 소유하고
  자체 대상 정책을 적용하지 않는 한 설정하지 마세요
- 리디렉션은 확인되며 `maxRedirects`로 제한됩니다
- `useTrustedEnvProxy`는 명시적 옵트인이며, DNS 확인 후에도 아웃바운드 정책을
  적용하는 운영자 제어 프록시에만 활성화해야 합니다
- `web_fetch`는 최선 노력 방식입니다 -- 일부 사이트에는 [웹 브라우저](/ko/tools/browser)가 필요합니다

## 도구 프로필

도구 프로필이나 허용 목록을 사용하는 경우 `web_fetch` 또는 `group:web`을 추가하세요.

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 관련 항목

- [웹 검색](/ko/tools/web) -- 여러 제공자로 웹 검색
- [웹 브라우저](/ko/tools/browser) -- JS가 많은 사이트를 위한 전체 브라우저 자동화
- [Firecrawl](/ko/tools/firecrawl) -- Firecrawl 검색 및 스크레이핑 도구
