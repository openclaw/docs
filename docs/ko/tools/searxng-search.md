---
read_when:
    - 자체 호스팅 웹 검색 제공업체를 원한다면
    - web_search에 SearXNG를 사용하려고 합니다
    - 개인정보 보호 중심 또는 망 분리형 검색 옵션이 필요한 경우
summary: SearXNG 웹 검색 -- 자체 호스팅되는 키가 필요 없는 메타 검색 제공자
title: SearXNG 검색
x-i18n:
    generated_at: "2026-05-02T21:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw는 **자체 호스팅,
키 불필요** `web_search` 제공자로 [SearXNG](https://docs.searxng.org/)를 지원합니다. SearXNG는 Google, Bing, DuckDuckGo 및 기타 소스의 결과를 집계하는 오픈 소스 메타 검색 엔진입니다.

장점:

- **무료 및 무제한** -- API 키나 상용 구독이 필요하지 않음
- **개인정보 보호 / 에어갭** -- 쿼리가 네트워크를 벗어나지 않음
- **어디서나 작동** -- 상용 검색 API의 지역 제한 없음

## 설정

<Steps>
  <Step title="SearXNG 인스턴스 실행">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    또는 액세스할 수 있는 기존 SearXNG 배포를 사용하세요. 프로덕션 설정은
    [SearXNG 문서](https://docs.searxng.org/)를 참조하세요.

  </Step>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    또는 환경 변수를 설정하고 자동 감지가 찾도록 하세요.

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
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

`baseUrl` 필드는 SecretRef 객체도 허용합니다.

전송 규칙:

- `https://`는 공개 또는 비공개 SearXNG 호스트에서 작동합니다
- `http://`는 신뢰할 수 있는 비공개 네트워크 또는 loopback 호스트에만 허용됩니다
- 공개 SearXNG 호스트는 `https://`를 사용해야 합니다
- 비공개/내부 호스트는 자체 호스팅 네트워크 가드를 사용합니다. 공개 `https://`
  호스트는 엄격한 웹 검색 가드를 유지하며 비공개 주소로 리디렉션할 수 없습니다

## 환경 변수

구성의 대안으로 `SEARXNG_BASE_URL`을 설정하세요.

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL`이 설정되어 있고 명시적인 제공자가 구성되어 있지 않으면, 자동 감지가
SearXNG를 자동으로 선택합니다(가장 낮은 우선순위 -- 키가 있는 API 기반 제공자가 먼저 우선합니다).

## Plugin 구성 참조

| 필드         | 설명                                                              |
| ------------ | ----------------------------------------------------------------- |
| `baseUrl`    | SearXNG 인스턴스의 기본 URL(필수)                                 |
| `categories` | `general`, `news` 또는 `science` 같은 쉼표로 구분된 카테고리      |
| `language`   | `en`, `de` 또는 `fr` 같은 결과용 언어 코드                        |

## 참고

- **JSON API** -- HTML 스크래핑이 아니라 SearXNG의 네이티브 `format=json` 엔드포인트를 사용합니다
- **이미지 결과 URL** -- SearXNG가 직접 이미지 URL을 반환하면 이미지 카테고리 결과에 `img_src`가 포함됩니다
- **API 키 없음** -- 모든 SearXNG 인스턴스에서 기본적으로 작동합니다
- **기본 URL 검증** -- `baseUrl`은 유효한 `http://` 또는 `https://`
  URL이어야 하며, 공개 호스트는 `https://`를 사용해야 합니다
- **네트워크 가드** -- 비공개/내부 SearXNG 엔드포인트는
  비공개 네트워크 액세스에 옵트인합니다. 공개 `https://` SearXNG 엔드포인트는 엄격한 SSRF
  보호를 유지합니다
- **자동 감지 순서** -- SearXNG는 자동 감지에서 마지막(순서 200)으로 확인됩니다.
  구성된 키가 있는 API 기반 제공자가 먼저 실행되고, 그다음 DuckDuckGo(순서 100), 그다음 Ollama Web Search(순서 110)가 실행됩니다
- **자체 호스팅** -- 인스턴스, 쿼리, 업스트림 검색 엔진을 사용자가 제어합니다
- **카테고리**는 구성되지 않은 경우 기본값이 `general`입니다
- **카테고리 폴백** -- `general`이 아닌 카테고리 요청이 성공했지만
  결과가 0개이면, OpenClaw는 빈 결과 집합을 반환하기 전에 동일한 쿼리를 `general`로 한 번 다시 시도합니다

<Tip>
  SearXNG JSON API가 작동하려면 SearXNG 인스턴스의 `settings.yml`에서 `search.formats` 아래에 `json`
  형식이 활성화되어 있는지 확인하세요.
</Tip>

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [DuckDuckGo 검색](/ko/tools/duckduckgo-search) -- 또 다른 키 불필요 폴백
- [Brave Search](/ko/tools/brave-search) -- 무료 티어가 있는 구조화된 결과
