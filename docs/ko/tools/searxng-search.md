---
read_when:
    - 자체 호스팅 웹 검색 제공자를 원하는 경우
    - web_search에 SearXNG를 사용하려고 합니다
    - 개인정보 보호에 중점을 두거나 에어갭 환경에서 사용할 수 있는 검색 옵션이 필요합니다
summary: SearXNG 웹 검색 -- 자체 호스팅 방식의 API 키가 필요 없는 메타 검색 제공자
title: SearXNG 검색
x-i18n:
    generated_at: "2026-07-12T15:51:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw는 [SearXNG](https://docs.searxng.org/)를 **자체 호스팅되며
키가 필요 없는** `web_search` 제공자로 지원합니다. SearXNG는 Google, Bing,
DuckDuckGo 및 기타 소스의 결과를 집계하는 오픈 소스 메타 검색 엔진입니다.

장점:

- **무료이며 무제한** -- API 키나 상용 구독이 필요하지 않습니다
- **개인정보 보호 / 에어 갭** -- 쿼리가 네트워크 외부로 나가지 않습니다
- **어디서나 작동** -- 상용 검색 API의 지역 제한이 없습니다

## 설정

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="SearXNG 인스턴스 실행">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    또는 접근할 수 있는 기존 SearXNG 배포를 사용하십시오. 프로덕션 설정은
    [SearXNG 문서](https://docs.searxng.org/)를 참조하십시오.

  </Step>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    # 제공자로 "searxng"를 선택합니다
    ```

    또는 환경 변수를 설정하고 자동 감지로 찾도록 하십시오:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## 구성

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNG 인스턴스의 Plugin 수준 설정:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // 선택 사항
            language: "en", // 선택 사항
          },
        },
      },
    },
  },
}
```

`baseUrl`은 SecretRef 객체도 허용합니다(예: `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## 환경 변수

구성 대신 `SEARXNG_BASE_URL`을 설정하십시오:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

확인 순서는 구성된 `baseUrl` 문자열, `baseUrl`의 인라인 환경 변수 SecretRef,
`SEARXNG_BASE_URL` 순입니다. 어떤 구성 경로도 설정되지 않고 명시적인 제공자를
선택하지 않은 상태에서 `SEARXNG_BASE_URL`이 있으면 자동 감지가 SearXNG를 선택합니다.

## Plugin 구성 참조

| 필드         | 설명                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | SearXNG 인스턴스의 기본 URL(필수)                                  |
| `categories` | `general`, `news`, `science` 등의 쉼표로 구분된 카테고리            |
| `language`   | `en`, `de`, `fr` 등의 결과 언어 코드                               |

`web_search` 도구 호출은 호출별 재정의로 `count`(결과 1-10개), `categories`,
`language`도 허용합니다.

## 참고 사항

- **JSON API** -- HTML 스크래핑이 아니라 SearXNG의 네이티브 `format=json` 엔드포인트를 사용합니다
- **이미지 결과 URL** -- SearXNG가 직접 이미지 URL을 반환하면 이미지 카테고리 결과에
  `img_src`가 포함됩니다
- **API 키 불필요** -- 모든 SearXNG 인스턴스에서 별도 설정 없이 작동합니다
- **기본 URL 검증** -- `baseUrl`은 유효한 `http://` 또는 `https://` URL이어야
  합니다
- **네트워크 가드** -- `http://` 기본 URL은 신뢰할 수 있는 비공개 또는
  루프백 호스트를 대상으로 해야 합니다(공개 호스트는 `https://`를 사용해야 합니다).
  비공개/내부 주소로 확인되는 `https://` 기본 URL에는 동일한 자체 호스팅 허용이
  적용되며, 공개 주소로 확인되는 `https://` 기본 URL에는 엄격한 SSRF 보호가 유지됩니다
- **자동 감지 순서** -- SearXNG에는 구성된 `baseUrl`이 필요합니다(필수 자격 증명이
  이미 있는 제공자 중 순서 200). DuckDuckGo 또는 Ollama Web Search와 같이 키가
  필요 없는 제공자는 암시적으로 자동 감지에서 선택되지 않으며, 명시적으로 `provider`를
  선택한 경우에만 활성화됩니다
- **자체 호스팅** -- 인스턴스, 쿼리 및 업스트림 검색 엔진을 직접 제어합니다
- **카테고리**는 구성하지 않으면 기본적으로 `general`입니다
- **카테고리 폴백** -- `general`이 아닌 카테고리 요청이 성공했지만 결과가 0개이면,
  OpenClaw는 빈 결과 집합을 반환하기 전에 같은 쿼리를 `general`로 한 번 재시도합니다
- **결과 캐싱** -- 동일한 쿼리(동일한 쿼리, 개수, 카테고리, 언어 및 기본 URL)는
  짧은 TTL 동안 프로세스 내에 캐시됩니다
- **버전 요구 사항** -- Plugin은 `minHostVersion: >=2026.6.9`를 선언합니다

<Tip>
  SearXNG JSON API가 작동하려면 SearXNG 인스턴스의 `settings.yml`에서
  `search.formats` 아래에 `json` 형식이 활성화되어 있는지 확인하십시오.
</Tip>

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [DuckDuckGo 검색](/ko/tools/duckduckgo-search) -- 키가 필요 없는 또 다른 제공자
- [Brave 검색](/ko/tools/brave-search) -- 무료 티어가 제공되는 구조화된 결과
