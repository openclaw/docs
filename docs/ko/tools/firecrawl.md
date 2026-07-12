---
read_when:
    - Firecrawl 기반 웹 추출을 사용하려는 경우
    - 키 없이 Firecrawl `web_fetch`를 사용하려고 합니다
    - 검색 또는 더 높은 한도를 사용하려면 Firecrawl API 키가 필요합니다.
    - Firecrawl을 web_search 제공자로 사용하려는 경우
    - web_fetch에 대한 봇 차단 우회 추출이 필요합니다
summary: Firecrawl 검색, 스크래핑 및 web_fetch 폴백
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T15:49:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw은 **Firecrawl**을 세 가지 방식으로 사용할 수 있습니다.

- `web_search` 제공자로 사용
- 명시적 Plugin 도구인 `firecrawl_search`와 `firecrawl_scrape`로 사용
- `web_fetch`의 대체 추출기로 사용

Firecrawl은 봇 우회와 캐싱을 지원하는 호스팅형 추출/검색 서비스로, JavaScript 의존도가 높은 사이트나 일반 HTTP 가져오기를 차단하는 페이지에 유용합니다.

## Plugin 설치

공식 Plugin을 설치한 후 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## 키 없는 web_fetch 및 API 키

명시적으로 선택한 호스팅형 Firecrawl `web_fetch` 대체 기능은 API 키 없이도 스타터 액세스를 지원합니다. 더 높은 한도가 필요한 경우 Gateway 환경에 `FIRECRAWL_API_KEY`를 추가하거나 이를 구성하십시오. Firecrawl `web_search`와 `firecrawl_scrape`에는 API 키가 필요합니다.

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

- 온보딩이나 `openclaw configure --section web`에서 Firecrawl을 선택하면 설치된 Firecrawl Plugin이 자동으로 활성화됩니다.
- Firecrawl을 사용하는 `web_search`는 `query`와 `count`를 지원합니다.
- `sources`, `categories`, 결과 스크래핑 같은 Firecrawl 전용 제어 기능을 사용하려면 `firecrawl_search`를 사용하십시오.
- `baseUrl`의 기본값은 `https://api.firecrawl.dev`의 호스팅형 Firecrawl입니다. 자체 호스팅 재정의는 비공개/내부 엔드포인트에만 허용되며, HTTP도 이러한 비공개 대상에만 허용됩니다.
- `FIRECRAWL_BASE_URL`은 Firecrawl 검색 및 스크래핑 기본 URL에 공통으로 적용되는 환경 변수 대체 값입니다.
- Firecrawl 검색 요청의 기본 시간 제한은 30초이며, `firecrawl_search`의 `timeoutSeconds` 매개변수로 호출별 재정의가 가능합니다.

## Firecrawl web_fetch 대체 기능 구성

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 명시적으로 선택하면 키 없는 대체 기능이 활성화됩니다
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- 명시적으로 선택한 Firecrawl `web_fetch` 대체 기능은 API 키 없이 작동합니다. 구성된 경우 OpenClaw은 더 높은 한도를 위해 `plugins.entries.firecrawl.config.webFetch.apiKey` 또는 `FIRECRAWL_API_KEY`를 전송합니다.
- 온보딩이나 `openclaw configure --section web`에서 Firecrawl을 선택하면 다른 가져오기 제공자가 이미 구성되어 있지 않은 한 Plugin을 활성화하고 `web_fetch`에 Firecrawl을 선택합니다.
- `firecrawl_scrape`에는 API 키가 필요합니다.
- `maxAgeMs`는 캐시된 결과를 사용할 수 있는 최대 경과 시간(ms)을 제어합니다. 기본값은 172,800,000ms(2일)입니다.
- `onlyMainContent`의 기본값은 `true`이고, `timeoutSeconds`의 기본값은 60입니다.
- 기존 `tools.web.fetch.firecrawl.*` 및 `tools.web.search.firecrawl.*` 구성은 `openclaw doctor --fix`를 통해 자동으로 마이그레이션됩니다.
- Firecrawl 스크래핑/기본 URL 재정의에는 검색과 동일한 호스팅형/비공개 규칙이 적용됩니다. 공개 호스팅 트래픽은 `https://api.firecrawl.dev`를 사용하며, 자체 호스팅 재정의는 비공개/내부 엔드포인트로 확인되어야 합니다.
- `firecrawl_scrape`는 명시적인 Firecrawl 스크래핑 호출에 대해 `web_fetch` 대상 안전성 계약에 맞춰, 명백한 비공개, 루프백, 메타데이터 및 HTTP(S)가 아닌 대상 URL을 Firecrawl에 전달하기 전에 거부합니다.

`firecrawl_scrape`는 필수 API 키를 포함하여 동일한 `plugins.entries.firecrawl.config.webFetch.*` 설정과 환경 변수를 재사용합니다.

### 자체 호스팅 Firecrawl

Firecrawl을 직접 실행하는 경우 `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` 또는 `FIRECRAWL_BASE_URL`을 설정하십시오. OpenClaw은 루프백, 비공개 네트워크, `.local`, `.internal` 또는 `.localhost` 대상에만 `http://`를 허용합니다. Firecrawl API 키가 실수로 임의의 엔드포인트에 전송되지 않도록 공개 사용자 지정 호스트는 거부됩니다.

## Firecrawl Plugin 도구

### `firecrawl_search`

일반 `web_search` 대신 Firecrawl 전용 검색 제어 기능을 사용하려는 경우 사용하십시오.

매개변수:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

일반 `web_fetch`의 성능이 부족한 JavaScript 의존도가 높거나 봇으로부터 보호된 페이지에 사용하십시오.

매개변수:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 스텔스/봇 우회

호출자가 해당 매개변수를 재정의하지 않는 한 `firecrawl_scrape`와 `web_fetch` Firecrawl 대체 기능의 기본값은 `proxy: "auto"` 및 `storeInCache: true`입니다. `firecrawl_search`와 `web_search` Firecrawl 제공자에는 `proxy`/`storeInCache` 제어 기능이 없으며, 스텔스 프록시 모드는 스크래핑/가져오기 요청에만 적용됩니다.

Firecrawl의 `proxy` 모드는 봇 우회 방식(`basic`, `stealth` 또는 `auto`)을 제어합니다. `auto`는 기본 시도가 실패하면 스텔스 프록시로 재시도하며, 기본 모드만 사용하는 스크래핑보다 더 많은 크레딧을 사용할 수 있습니다.

## `web_fetch`에서 Firecrawl을 사용하는 방식

`web_fetch` 추출 순서:

1. Readability(로컬)
2. Firecrawl 같은 구성된 가져오기 제공자(선택되었거나 구성된 자격 증명에서 자동 감지된 경우)
3. 기본 HTML 정리(최종 대체 수단)

선택 설정은 `tools.web.fetch.provider`입니다. 이를 생략하면 OpenClaw은 사용 가능한 자격 증명에서 준비된 첫 번째 웹 가져오기 제공자를 자동으로 감지합니다. 공식 Firecrawl Plugin이 이 대체 기능을 제공합니다.

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [웹 가져오기](/ko/tools/web-fetch) -- Firecrawl 대체 기능을 사용하는 web_fetch 도구
- [Tavily](/ko/tools/tavily) -- 검색 및 추출 도구
