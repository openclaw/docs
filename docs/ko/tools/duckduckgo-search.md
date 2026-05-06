---
read_when:
    - API 키가 필요 없는 웹 검색 제공자를 원합니다
    - web_search에 DuckDuckGo를 사용하려고 합니다
    - 제로 구성 검색 대체 수단이 필요합니다
summary: DuckDuckGo 웹 검색 -- 키가 필요 없는 대체 제공자(실험적, HTML 기반)
title: DuckDuckGo 검색
x-i18n:
    generated_at: "2026-05-06T06:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw는 DuckDuckGo를 **키가 필요 없는** `web_search` 제공자로 지원합니다. API
키나 계정이 필요하지 않습니다.

<Warning>
  DuckDuckGo는 공식 API가 아니라 DuckDuckGo의 JavaScript 미사용 검색 페이지에서
  결과를 가져오는 **실험적이고 비공식적인** 통합입니다. 봇 챌린지 페이지나 HTML 변경으로 인해
  가끔 중단될 수 있습니다.
</Warning>

## 설정

API 키가 필요 없습니다. DuckDuckGo를 제공자로 설정하기만 하면 됩니다.

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## 구성

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

지역 및 SafeSearch에 대한 선택적 Plugin 수준 설정:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## 도구 매개변수

<ParamField path="query" type="string" required>
검색 쿼리입니다.
</ParamField>

<ParamField path="count" type="number" default="5">
반환할 결과 수입니다(1~10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 지역 코드입니다(예: `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 수준입니다.
</ParamField>

지역 및 SafeSearch는 Plugin 구성에서도 설정할 수 있습니다(위 참조). 도구
매개변수는 쿼리별로 구성 값을 재정의합니다.

## 참고 사항

- **API 키 없음** - 별도 구성 없이 바로 작동합니다
- **실험적** - 공식 API나 SDK가 아니라 DuckDuckGo의 JavaScript 미사용 HTML
  검색 페이지에서 결과를 수집합니다
- **봇 챌린지 위험** - 사용량이 많거나 자동화된 사용에서는 DuckDuckGo가 CAPTCHA를 표시하거나 요청을 차단할 수 있습니다
- **HTML 파싱** - 결과는 페이지 구조에 따라 달라지며, 페이지 구조는 예고 없이
  변경될 수 있습니다
- **자동 감지 순서** - DuckDuckGo는 자동 감지에서 첫 번째 키가 필요 없는 폴백입니다
  (순서 100). 키가 구성된 API 기반 제공자가
  먼저 실행되고, 그다음 Ollama Web Search(순서 110), 그다음 SearXNG(순서 200)가 실행됩니다
- **SafeSearch는 구성되지 않은 경우 moderate가 기본값입니다**

<Tip>
  프로덕션 용도로는 [Brave Search](/ko/tools/brave-search)(무료 티어
  제공) 또는 다른 API 기반 제공자를 고려하세요.
</Tip>

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 무료 티어가 있는 구조화된 결과
- [Exa Search](/ko/tools/exa-search) -- 콘텐츠 추출을 지원하는 신경망 검색
