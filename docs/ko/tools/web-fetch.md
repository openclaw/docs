---
read_when:
    - URL을 가져와 읽기 쉬운 콘텐츠를 추출하려고 합니다
    - web_fetch 또는 Firecrawl 대체 수단을 구성해야 합니다.
    - web_fetch의 제한 및 캐싱을 이해하려고 합니다
sidebarTitle: Web Fetch
summary: web_fetch 도구 -- 읽기 쉬운 콘텐츠 추출을 포함한 HTTP 가져오기
title: 웹 가져오기
x-i18n:
    generated_at: "2026-07-12T15:52:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch`는 일반 HTTP GET을 수행하고 읽을 수 있는 콘텐츠를 추출합니다(HTML을
마크다운 또는 텍스트로 변환). JavaScript는 실행하지 **않습니다**. JS 의존도가 높은 사이트나
로그인으로 보호된 페이지에는 대신 [웹 브라우저](/ko/tools/browser)를 사용하십시오.

## 빠른 시작

기본적으로 활성화되어 있으며 구성이 필요하지 않습니다.

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
출력을 이 문자 수로 잘라냅니다. `tools.web.fetch.maxCharsCap` 범위로 제한됩니다.
</ParamField>

## 작동 방식

<Steps>
  <Step title="가져오기">
    Chrome과 유사한 User-Agent 및 `Accept-Language` 헤더를 사용하여 HTTP GET을
    전송합니다. 비공개/내부 호스트 이름을 차단하고 리디렉션을 다시 검사합니다.
  </Step>
  <Step title="추출">
    HTML 응답에 Readability(주요 콘텐츠 추출)를 실행합니다.
  </Step>
  <Step title="대체 경로(선택 사항)">
    Readability가 실패하고 가져오기 제공자를 사용할 수 있으면 해당 제공자를 통해
    다시 시도합니다(예: Firecrawl의 봇 우회 모드).
  </Step>
  <Step title="캐시">
    동일한 URL을 반복해서 가져오는 작업을 줄이기 위해 결과를 15분 동안 캐시합니다
    (구성 가능).
  </Step>
</Steps>

## 진행 상황 업데이트

`web_fetch`는 가져오기 작업이 5초 후에도 계속 대기 중인 경우에만 공개 진행 상황 줄을
표시합니다.

```text
페이지 콘텐츠를 가져오는 중...
```

빠른 캐시 적중과 신속한 네트워크 응답은 타이머가 실행되기 전에 완료되므로 진행 상황 줄이
표시되지 않습니다. 호출을 취소하면 타이머가 해제됩니다. 진행 상황 줄은 채널 UI 상태일
뿐이며 가져온 페이지 콘텐츠를 포함하지 않습니다.

## 구성

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // 기본값: true
        provider: "firecrawl", // 선택 사항, 자동 감지하려면 생략
        maxChars: 20000, // 기본 출력 문자 수, maxCharsCap으로 제한됨
        maxCharsCap: 20000, // maxChars 매개변수의 절대 상한
        maxResponseBytes: 750000, // 잘라내기 전 최대 다운로드 크기(32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // 신뢰할 수 있는 HTTP(S) 환경 프록시가 DNS를 확인하도록 허용
        readability: true, // Readability 추출 사용
        userAgent: "Mozilla/5.0 ...", // User-Agent 재정의
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // 198.18.0.0/15를 사용하는 신뢰할 수 있는 가짜 IP 프록시에 명시적으로 허용
          allowIpv6UniqueLocalRange: true, // fc00::/7을 사용하는 신뢰할 수 있는 가짜 IP 프록시에 명시적으로 허용
        },
      },
    },
  },
}
```

## Firecrawl 대체 경로

Readability 추출이 실패하면 `web_fetch`는 봇 우회 및 향상된 추출을 위해
[Firecrawl](/ko/tools/firecrawl)을 대체 경로로 사용할 수 있습니다.

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 선택 사항, 사용 가능한 자격 증명에서 자동 감지하려면 생략
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // 선택 사항, 키 없는 스타터 액세스를 사용하려면 생략
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // 캐시 기간(2일)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey`는 선택 사항이며 SecretRef 객체를 지원합니다.
기존 `tools.web.fetch.firecrawl.*` 구성은 `openclaw doctor --fix`를 통해
`plugins.entries.firecrawl.config.webFetch`로 자동 마이그레이션됩니다.

<Note>
  Firecrawl API 키 SecretRef를 구성했지만 이를 확인할 수 없고
  `FIRECRAWL_API_KEY` 환경 변수 대체 값도 없으면 Gateway 시작이 즉시 실패합니다.
</Note>

<Note>
  Firecrawl `baseUrl` 재정의는 엄격히 제한됩니다. 호스팅된 트래픽은
  `https://api.firecrawl.dev`를 사용하며, 자체 호스팅 재정의는 비공개 또는 내부
  엔드포인트를 대상으로 해야 합니다. `http://`는 이러한 비공개 대상에만 허용됩니다.
</Note>

현재 런타임 동작은 다음과 같습니다.

- `tools.web.fetch.provider`는 가져오기 대체 제공자를 명시적으로 선택합니다.
- `provider`를 생략하면 OpenClaw는 구성된 자격 증명에서 준비된 첫 번째 웹 가져오기
  제공자를 자동으로 감지합니다. 샌드박스되지 않은 `web_fetch`는
  `contracts.webFetchProviders`를 선언하고 런타임에 일치하는 제공자를 등록하는 설치된
  Plugin을 사용할 수 있습니다. 현재 공식 Firecrawl Plugin이 이 대체 경로를 제공합니다.
- 샌드박스된 `web_fetch` 호출에서는 번들 제공자와 공식 npm 또는 ClawHub 출처가
  확인된 설치 제공자를 허용합니다. 현재는 공식 Firecrawl Plugin이 허용되며,
  서드 파티 외부 가져오기 Plugin은 계속 제외됩니다.
- Readability가 비활성화되어 있으면 `web_fetch`는 선택한 제공자 대체 경로로 바로
  이동합니다. 사용할 수 있는 제공자가 없으면 닫힌 상태로 실패합니다.

## 신뢰할 수 있는 환경 프록시

배포 환경에서 `web_fetch`가 신뢰할 수 있는 아웃바운드 HTTP(S) 프록시를 통과해야 한다면
`tools.web.fetch.useTrustedEnvProxy: true`로 설정하십시오.

이 모드에서도 OpenClaw는 요청을 보내기 전에 호스트 이름 기반 SSRF 검사를 적용하지만,
로컬 DNS 고정 대신 프록시가 DNS를 확인하도록 허용합니다. 프록시가 운영자에 의해
제어되고 DNS 확인 후 아웃바운드 정책을 적용하는 경우에만 이를 활성화하십시오.

<Note>
  HTTP(S) 프록시 환경 변수가 구성되지 않았거나 대상 호스트가 `NO_PROXY`에 의해
  제외된 경우 `web_fetch`는 로컬 DNS 고정이 적용되는 일반적인 엄격한 경로로
  대체됩니다.
</Note>

## 제한 및 안전

- `maxChars`는 `tools.web.fetch.maxCharsCap`(기본값 `20000`)으로 제한됩니다
- 응답 본문은 구문 분석 전에 `maxResponseBytes`(기본값 `750000`, 32000-10000000으로
  제한됨)로 제한됩니다. 크기를 초과하는 응답은 경고와 함께 잘립니다
- 비공개/내부 호스트 이름은 차단됩니다
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange`와
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`는 신뢰할 수 있는 가짜 IP
  프록시 스택만을 위한 제한적인 명시적 허용 옵션입니다. 프록시가 해당 합성 범위를
  소유하고 자체 대상 정책을 적용하는 경우가 아니면 설정하지 마십시오
- 리디렉션은 검사되며 `maxRedirects`(기본값 `3`)로 제한됩니다
- `useTrustedEnvProxy`는 명시적 허용 옵션이며 DNS 확인 후에도 아웃바운드 정책을
  적용하는 운영자 제어 프록시에만 활성화해야 합니다
- `web_fetch`는 최선형 방식으로 작동하며 일부 사이트에는 [웹 브라우저](/ko/tools/browser)가 필요합니다

## 도구 프로필

도구 프로필 또는 허용 목록을 사용하는 경우 `web_fetch` 또는 `group:web`을 추가하십시오.

```json5
{
  tools: {
    allow: ["web_fetch"],
    // 또는: allow: ["group:web"]  (web_fetch, web_search 및 x_search 포함)
  },
}
```

## 관련 항목

- [웹 검색](/ko/tools/web) -- 여러 제공자를 사용하여 웹을 검색합니다
- [웹 브라우저](/ko/tools/browser) -- JS 의존도가 높은 사이트를 위한 전체 브라우저 자동화
- [Firecrawl](/ko/tools/firecrawl) -- Firecrawl 검색 및 스크래핑 도구
