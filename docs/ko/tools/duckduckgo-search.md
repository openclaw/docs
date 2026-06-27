---
read_when:
    - API 키가 필요 없는 웹 검색 제공자를 원합니다
    - 웹 검색에 DuckDuckGo를 사용하려고 합니다
    - 명시적으로 선택한 키 없는 검색 공급자가 필요합니다
summary: DuckDuckGo 웹 검색 -- 키가 필요 없는 제공자(실험적, HTML 기반)
title: DuckDuckGo 검색
x-i18n:
    generated_at: "2026-06-27T18:13:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw는 **키가 필요 없는** `web_search` 공급자로 DuckDuckGo를 지원합니다. API
키나 계정이 필요하지 않습니다.

<Warning>
  DuckDuckGo는 공식 API가 아닌 DuckDuckGo의 비 JavaScript 검색 페이지에서 결과를
  가져오는 **실험적이고 비공식적인** 통합입니다. 봇 챌린지 페이지나 HTML 변경으로
  가끔 문제가 발생할 수 있습니다.
</Warning>

## 설정

API 키가 필요 없습니다. DuckDuckGo를 공급자로 설정하기만 하면 됩니다.

<Steps>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    # 공급자로 "duckduckgo"를 선택합니다
    ```
  </Step>
</Steps>

## 설정

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
            region: "us-en", // DuckDuckGo 지역 코드
            safeSearch: "moderate", // "strict", "moderate" 또는 "off"
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
반환할 결과 수(1~10)입니다.
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 지역 코드(예: `us-en`, `uk-en`, `de-de`)입니다.
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 수준입니다.
</ParamField>

지역 및 SafeSearch는 Plugin 설정에서도 지정할 수 있습니다(위 참조). 도구
매개변수는 쿼리별로 설정 값을 재정의합니다.

## 참고

- **API 키 없음** - DuckDuckGo를 `web_search` 공급자로 선택하면 작동합니다
- **실험적** - 공식 API나 SDK가 아니라 DuckDuckGo의 비 JavaScript HTML
  검색 페이지에서 결과를 수집합니다
- **봇 챌린지 위험** - 과도하거나 자동화된 사용 시 DuckDuckGo가 CAPTCHA를 제공하거나 요청을
  차단할 수 있습니다
- **HTML 구문 분석** - 결과는 페이지 구조에 따라 달라지며, 페이지 구조는 예고 없이
  변경될 수 있습니다
- **명시적 선택** - API 기반 공급자가 구성되지 않은 경우에도 OpenClaw가 DuckDuckGo를 자동으로
  선택하지 않습니다
- **SafeSearch는 설정되지 않은 경우 보통으로 기본 설정됩니다**

<Tip>
  프로덕션 사용 시 [Brave Search](/ko/tools/brave-search)(무료 티어
  제공) 또는 다른 API 기반 공급자를 고려하세요.
</Tip>

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 공급자 및 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 무료 티어가 있는 구조화된 결과
- [Exa Search](/ko/tools/exa-search) -- 콘텐츠 추출을 포함한 신경망 검색
