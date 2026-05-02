---
read_when:
    - Firecrawl 기반 웹 추출을 원합니다
    - Firecrawl API 키가 필요합니다
    - Firecrawl을 web_search 제공업체로 사용하려는 경우
    - web_fetch에 대한 봇 방지 추출이 필요합니다
summary: Firecrawl 검색, 스크레이핑 및 web_fetch 폴백
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T21:15:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw은 **Firecrawl**을 세 가지 방식으로 사용할 수 있습니다.

- `web_search` 제공자로
- 명시적 Plugin 도구로: `firecrawl_search` 및 `firecrawl_scrape`
- `web_fetch`의 대체 추출기로

Firecrawl은 봇 우회 및 캐싱을 지원하는 호스팅형 추출/검색 서비스이며,
JS가 많은 사이트나 일반 HTTP 가져오기를 차단하는 페이지에 도움이 됩니다.

## API 키 받기

1. Firecrawl 계정을 만들고 API 키를 생성합니다.
2. 설정에 저장하거나 Gateway 환경에서 `FIRECRAWL_API_KEY`를 설정합니다.

## Firecrawl 검색 구성

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

참고:

- 온보딩 또는 `openclaw configure --section web`에서 Firecrawl을 선택하면 번들 Firecrawl Plugin이 자동으로 활성화됩니다.
- Firecrawl을 사용하는 `web_search`는 `query`와 `count`를 지원합니다.
- `sources`, `categories` 또는 결과 스크래핑 같은 Firecrawl 전용 제어가 필요하면 `firecrawl_search`를 사용하세요.
- `baseUrl`의 기본값은 `https://api.firecrawl.dev`의 호스팅 Firecrawl입니다. 자체 호스팅 재정의는 비공개/내부 엔드포인트에만 허용되며, HTTP는 해당 비공개 대상에만 허용됩니다.
- `FIRECRAWL_BASE_URL`은 Firecrawl 검색 및 스크래핑 기본 URL의 공유 환경 대체값입니다.

## Firecrawl 스크래핑 + web_fetch 대체 구성

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

참고:

- Firecrawl 대체 시도는 API 키를 사용할 수 있을 때만 실행됩니다(`plugins.entries.firecrawl.config.webFetch.apiKey` 또는 `FIRECRAWL_API_KEY`).
- `maxAgeMs`는 캐시된 결과가 얼마나 오래되어도 되는지(ms)를 제어합니다. 기본값은 2일입니다.
- 기존 `tools.web.fetch.firecrawl.*` 설정은 `openclaw doctor --fix`에 의해 자동 마이그레이션됩니다.
- Firecrawl 스크래핑/기본 URL 재정의는 검색과 동일한 호스팅/비공개 규칙을 따릅니다. 공개 호스팅 트래픽은 `https://api.firecrawl.dev`를 사용하며, 자체 호스팅 재정의는 비공개/내부 엔드포인트로 확인되어야 합니다.
- `firecrawl_scrape`는 명시적 Firecrawl 스크래핑 호출에 대해 `web_fetch` 대상 안전 계약과 일치하도록, Firecrawl로 전달하기 전에 명백한 비공개, loopback, 메타데이터 및 비 HTTP(S) 대상 URL을 거부합니다.

`firecrawl_scrape`는 동일한 `plugins.entries.firecrawl.config.webFetch.*` 설정과 환경 변수를 재사용합니다.

### 자체 호스팅 Firecrawl

Firecrawl을 직접 실행하는 경우 `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` 또는 `FIRECRAWL_BASE_URL`을 설정하세요.
OpenClaw은 loopback, 비공개 네트워크, `.local`, `.internal` 또는 `.localhost` 대상에 대해서만 `http://`를 허용합니다. Firecrawl API 키가 실수로 임의의 엔드포인트에 전송되지 않도록 공개 사용자 지정 호스트는 거부됩니다.

## Firecrawl Plugin 도구

### `firecrawl_search`

일반 `web_search` 대신 Firecrawl 전용 검색 제어가 필요할 때 사용하세요.

핵심 매개변수:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

일반 `web_fetch`가 약한 JS가 많은 페이지 또는 봇 보호 페이지에 사용하세요.

핵심 매개변수:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 스텔스 / 봇 우회

Firecrawl은 봇 우회를 위한 **프록시 모드** 매개변수(`basic`, `stealth` 또는 `auto`)를 노출합니다.
OpenClaw은 Firecrawl 요청에 항상 `proxy: "auto"`와 `storeInCache: true`를 사용합니다.
프록시가 생략되면 Firecrawl은 기본값으로 `auto`를 사용합니다. `auto`는 기본 시도가 실패하면 스텔스 프록시로 다시 시도하며, 이 경우 기본 전용 스크래핑보다 더 많은 크레딧을 사용할 수 있습니다.

## `web_fetch`가 Firecrawl을 사용하는 방식

`web_fetch` 추출 순서:

1. Readability(로컬)
2. Firecrawl(선택되었거나 활성 web-fetch 대체로 자동 감지된 경우)
3. 기본 HTML 정리(마지막 대체)

선택 노브는 `tools.web.fetch.provider`입니다. 이를 생략하면 OpenClaw은 사용 가능한 자격 증명에서 준비된 첫 번째 web-fetch 제공자를 자동 감지합니다.
현재 번들 제공자는 Firecrawl입니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Web Fetch](/ko/tools/web-fetch) -- Firecrawl 대체가 있는 web_fetch 도구
- [Tavily](/ko/tools/tavily) -- 검색 + 추출 도구
