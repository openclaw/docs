---
read_when:
    - Firecrawl 기반 웹 추출을 원합니다
    - 키 없이 Firecrawl web_fetch를 사용하려는 경우
    - 검색 또는 더 높은 제한을 사용하려면 Firecrawl API 키가 필요합니다
    - Firecrawl을 web_search 제공자로 사용하려는 경우
    - web_fetch에 대한 봇 방지 추출이 필요합니다
summary: Firecrawl 검색, 스크레이핑 및 web_fetch 폴백
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:14:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw는 **Firecrawl**을 세 가지 방식으로 사용할 수 있습니다.

- `web_search` 제공자로 사용
- 명시적 Plugin 도구로 사용: `firecrawl_search` 및 `firecrawl_scrape`
- `web_fetch`의 폴백 추출기로 사용

이는 봇 우회 및 캐싱을 지원하는 호스팅 추출/검색 서비스이며,
JS가 많은 사이트나 일반 HTTP fetch를 차단하는 페이지에 유용합니다.

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작하세요.

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## 키 없는 web_fetch 및 API 키

명시적으로 선택한 호스팅 Firecrawl `web_fetch` 폴백은 API 키 없이도
스타터 액세스를 지원합니다. 더 높은 한도가 필요하면 gateway 환경에
`FIRECRAWL_API_KEY`를 추가하거나 구성하세요. Firecrawl `web_search` 및
`firecrawl_scrape`에는 API 키가 필요합니다.

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

- 온보딩에서 Firecrawl을 선택하거나 `openclaw configure --section web`을 사용하면 설치된 Firecrawl Plugin이 자동으로 활성화됩니다.
- Firecrawl을 사용하는 `web_search`는 `query` 및 `count`를 지원합니다.
- `sources`, `categories` 또는 결과 스크래핑 같은 Firecrawl 전용 제어가 필요하면 `firecrawl_search`를 사용하세요.
- `baseUrl`의 기본값은 호스팅 Firecrawl인 `https://api.firecrawl.dev`입니다. 자체 호스팅 재정의는 비공개/내부 엔드포인트에만 허용되며, HTTP도 이러한 비공개 대상에 대해서만 허용됩니다.
- `FIRECRAWL_BASE_URL`은 Firecrawl 검색 및 스크래핑 기본 URL의 공유 env 폴백입니다.

## Firecrawl web_fetch 폴백 구성

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
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

- 명시적으로 선택한 Firecrawl `web_fetch` 폴백은 API 키 없이 작동합니다. 구성된 경우 OpenClaw는 더 높은 한도를 위해 `plugins.entries.firecrawl.config.webFetch.apiKey` 또는 `FIRECRAWL_API_KEY`를 보냅니다.
- 온보딩 중 Firecrawl을 선택하거나 `openclaw configure --section web`을 사용하면 Plugin이 활성화되고, 다른 fetch 제공자가 이미 구성되어 있지 않은 한 `web_fetch`에 Firecrawl이 선택됩니다.
- `firecrawl_scrape`에는 API 키가 필요합니다.
- `maxAgeMs`는 캐시된 결과가 얼마나 오래되어도 되는지(ms)를 제어합니다. 기본값은 2일입니다.
- 레거시 `tools.web.fetch.firecrawl.*` 구성은 `openclaw doctor --fix`에 의해 자동 마이그레이션됩니다.
- Firecrawl scrape/base URL 재정의는 검색과 동일한 호스팅/비공개 규칙을 따릅니다. 공개 호스팅 트래픽은 `https://api.firecrawl.dev`를 사용하며, 자체 호스팅 재정의는 비공개/내부 엔드포인트로 해석되어야 합니다.
- `firecrawl_scrape`는 명백한 비공개, loopback, 메타데이터 및 비HTTP(S) 대상 URL을 Firecrawl로 전달하기 전에 거부하며, 명시적 Firecrawl scrape 호출에 대한 `web_fetch` 대상 안전성 계약과 일치합니다.

`firecrawl_scrape`는 필요한 API 키를 포함하여 동일한 `plugins.entries.firecrawl.config.webFetch.*` 설정 및 env vars를 재사용합니다.

### 자체 호스팅 Firecrawl

Firecrawl을 직접 실행하는 경우 `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` 또는 `FIRECRAWL_BASE_URL`을
설정하세요. OpenClaw는 loopback, 비공개 네트워크, `.local`, `.internal` 또는
`.localhost` 대상에 대해서만 `http://`를 허용합니다. Firecrawl API 키가 실수로
임의의 엔드포인트로 전송되지 않도록 공개 사용자 지정 호스트는 거부됩니다.

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

일반 `web_fetch`가 약한 JS가 많은 페이지나 봇 보호 페이지에 사용하세요.

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
OpenClaw는 Firecrawl 요청에 항상 `proxy: "auto"`와 `storeInCache: true`를 사용합니다.
proxy가 생략되면 Firecrawl은 기본값으로 `auto`를 사용합니다. `auto`는 기본 시도가 실패하면 스텔스 프록시로 재시도하므로, basic 전용 스크래핑보다 더 많은 크레딧을 사용할 수 있습니다.

## `web_fetch`가 Firecrawl을 사용하는 방식

`web_fetch` 추출 순서:

1. Readability(로컬)
2. Firecrawl(선택된 경우 또는 구성된 자격 증명에서 자동 감지된 경우)
3. 기본 HTML 정리(마지막 폴백)

선택 노브는 `tools.web.fetch.provider`입니다. 이를 생략하면 OpenClaw는
사용 가능한 자격 증명에서 첫 번째 준비된 web-fetch 제공자를 자동 감지합니다.
공식 Firecrawl Plugin이 해당 폴백을 제공합니다.

## 관련 항목

- [Web Search 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Web Fetch](/ko/tools/web-fetch) -- Firecrawl 폴백이 포함된 web_fetch 도구
- [Tavily](/ko/tools/tavily) -- 검색 + 추출 도구
