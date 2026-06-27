---
read_when:
    - URL을 가져와 읽기 쉬운 콘텐츠를 추출하려는 경우
    - web_fetch 또는 Firecrawl 대체 수단을 구성해야 합니다
    - web_fetch 제한 사항과 캐싱을 이해하고 싶습니다
sidebarTitle: Web Fetch
summary: web_fetch 도구 -- 읽기 쉬운 콘텐츠 추출 기능을 갖춘 HTTP 가져오기
title: 웹 가져오기
x-i18n:
    generated_at: "2026-06-27T18:18:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 도구는 일반 HTTP GET을 수행하고 읽을 수 있는 콘텐츠
(HTML을 markdown 또는 text로 변환)를 추출합니다. JavaScript는 실행하지 **않습니다**.

JS 의존도가 높은 사이트나 로그인으로 보호된 페이지에는 대신
[웹 브라우저](/ko/tools/browser)를 사용하세요.

## 빠른 시작

`web_fetch`는 **기본적으로 활성화되어 있습니다** -- 구성이 필요 없습니다. 에이전트가
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
    Chrome과 유사한 User-Agent 및 `Accept-Language`
    헤더로 HTTP GET을 보냅니다. 비공개/내부 호스트 이름을 차단하고 리디렉션을 다시 검사합니다.
  </Step>
  <Step title="Extract">
    HTML 응답에서 Readability(주요 콘텐츠 추출)를 실행합니다.
  </Step>
  <Step title="Fallback (optional)">
    Readability가 실패하고 Firecrawl이 선택되어 있으면, 봇 우회 모드로
    Firecrawl API를 통해 다시 시도합니다.
  </Step>
  <Step title="Cache">
    동일한 URL을 반복해서 가져오는 일을 줄이기 위해 결과가 15분 동안
    캐시됩니다(구성 가능).
  </Step>
</Steps>

## 진행 상황 업데이트

`web_fetch`는 가져오기가 5초 후에도 아직 대기 중일 때만 공개 진행 상황 줄을 내보냅니다.

```text
Fetching page content...
```

빠른 캐시 적중과 빠른 네트워크 응답은 타이머가 실행되기 전에 완료되므로
진행 상황 줄을 표시하지 않습니다. 호출이 취소되면 타이머가 지워집니다.
가져오기가 결국 완료되면 에이전트는 일반 도구 결과를 받습니다.
진행 상황 줄은 채널 UI 상태일 뿐이며 가져온 페이지 콘텐츠를 절대 포함하지 않습니다.

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey`는 선택 사항이며 SecretRef 객체를 지원합니다.
레거시 `tools.web.fetch.firecrawl.*` 구성은 `openclaw doctor --fix`가 자동으로 마이그레이션합니다.

<Note>
  Firecrawl API 키 SecretRef를 구성했지만 해석되지 않고
  `FIRECRAWL_API_KEY` env 폴백도 없으면 Gateway 시작이 빠르게 실패합니다.
</Note>

<Note>
  Firecrawl `baseUrl` 재정의는 제한됩니다. 호스팅 트래픽은
  `https://api.firecrawl.dev`를 사용합니다. 자체 호스팅 재정의는 비공개 또는
  내부 엔드포인트를 대상으로 해야 하며, `http://`는 이러한 비공개 대상에 대해서만 허용됩니다.
</Note>

현재 런타임 동작:

- `tools.web.fetch.provider`는 가져오기 폴백 provider를 명시적으로 선택합니다.
- `provider`가 생략되면 OpenClaw는 구성된 자격 증명에서 준비된 첫 번째 web-fetch
  provider를 자동 감지합니다. 샌드박스 처리되지 않은 `web_fetch`는
  `contracts.webFetchProviders`를 선언하고 런타임에 일치하는 provider를 등록하는
  설치된 plugins를 사용할 수 있습니다. 공식 Firecrawl Plugin이 이 폴백을 제공합니다.
- 샌드박스 처리된 `web_fetch` 호출은 번들 provider와 공식 npm 또는 ClawHub 출처가
  검증된 설치된 provider를 허용합니다. 현재는 공식 Firecrawl Plugin이 허용되며,
  서드파티 외부 fetch plugins는 제외됩니다.
- Readability가 비활성화되어 있으면 `web_fetch`는 선택한 provider 폴백으로 바로 건너뜁니다.
  사용 가능한 provider가 없으면 닫힌 방식으로 실패합니다.

## 신뢰할 수 있는 env 프록시

배포에서 `web_fetch`가 신뢰할 수 있는 아웃바운드
HTTP(S) 프록시를 거쳐야 하는 경우 `tools.web.fetch.useTrustedEnvProxy: true`를 설정하세요.

이 모드에서도 OpenClaw는 요청을 보내기 전에 호스트 이름 기반 SSRF 검사를 적용하지만,
로컬 DNS 고정 대신 프록시가 DNS를 해석하도록 허용합니다. 프록시가 운영자 제어하에 있고
DNS 해석 후 아웃바운드 정책을 적용하는 경우에만 활성화하세요.

<Note>
  HTTP(S) 프록시 env 변수가 구성되어 있지 않거나 대상 호스트가
  `NO_PROXY`에 의해 제외된 경우, `web_fetch`는 로컬 DNS 고정을 사용하는 일반 엄격 경로로
  폴백합니다.
</Note>

## 제한 및 안전성

- `maxChars`는 `tools.web.fetch.maxCharsCap`으로 제한됩니다.
- 응답 본문은 파싱 전에 `maxResponseBytes`로 제한됩니다. 너무 큰
  응답은 경고와 함께 잘립니다.
- 비공개/내부 호스트 이름은 차단됩니다.
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 및
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`는 신뢰할 수 있는 fake-IP 프록시 스택을 위한
  좁은 옵트인입니다. 프록시가 이러한 합성 범위를 소유하고 자체 대상 정책을 적용하는 경우가 아니라면
  설정하지 않은 상태로 두세요.
- 리디렉션은 검사되며 `maxRedirects`로 제한됩니다.
- `useTrustedEnvProxy`는 명시적인 옵트인이며, DNS 해석 후에도 아웃바운드 정책을 적용하는
  운영자 제어 프록시에 대해서만 활성화해야 합니다.
- `web_fetch`는 최선형 기능입니다. 일부 사이트에는 [웹 브라우저](/ko/tools/browser)가 필요합니다.

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

- [웹 검색](/ko/tools/web) -- 여러 provider로 웹 검색
- [웹 브라우저](/ko/tools/browser) -- JS 의존도가 높은 사이트를 위한 전체 브라우저 자동화
- [Firecrawl](/ko/tools/firecrawl) -- Firecrawl 검색 및 스크래핑 도구
