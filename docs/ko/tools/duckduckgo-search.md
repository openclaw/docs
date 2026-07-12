---
read_when:
    - API 키가 필요 없는 웹 검색 제공자를 원하는 경우
    - web_search에 DuckDuckGo를 사용하려고 합니다
    - 명시적으로 선택된 API 키가 필요 없는 검색 제공자를 원합니다
summary: DuckDuckGo 웹 검색 -- 키가 필요 없는 제공자(실험적, HTML 기반)
title: DuckDuckGo 검색
x-i18n:
    generated_at: "2026-07-12T15:49:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw는 DuckDuckGo를 **키가 필요 없는** `web_search` 제공자로 지원합니다. API 키나 계정이 필요하지 않습니다.

<Warning>
  DuckDuckGo는 공식 API가 아니라 DuckDuckGo의 비 JavaScript HTML 검색 페이지를 스크래핑하는 **실험적이고 비공식적인** 통합입니다. 봇 확인 페이지나 HTML 변경으로 인해 간혹 작동하지 않을 수 있습니다.
</Warning>

## 설정

자동 감지는 사용 가능한 자격 증명이 있는 제공자만 고려하므로 DuckDuckGo는 자동으로 선택되지 않습니다. 명시적으로 설정하십시오.

<Steps>
  <Step title="구성">
    ```bash
    openclaw configure --section web
    # 제공자로 "duckduckgo"를 선택하십시오
    ```
  </Step>
</Steps>

## 구성

구성에서 제공자를 직접 설정하십시오.

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

지역 및 SafeSearch에 대한 선택적 Plugin 수준 설정은 다음과 같습니다.

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
반환할 결과 수입니다(1-10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 지역 코드입니다(예: `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 수준입니다.
</ParamField>

`region` 및 `safeSearch` 도구 매개변수는 쿼리별로 위의 Plugin 구성 값을 재정의합니다.

## 참고

- **API 키 불필요** -- DuckDuckGo를 `web_search` 제공자로 선택하면 작동합니다.
- **실험적 기능** -- 공식 API나 SDK가 아니라 DuckDuckGo의 비 JavaScript HTML 검색 페이지를 스크래핑합니다. 결과는 예고 없이 변경될 수 있는 페이지 구조에 따라 달라집니다.
- **봇 확인 위험** -- 과도하거나 자동화된 사용 시 DuckDuckGo에서 CAPTCHA를 표시하거나 요청을 차단할 수 있습니다.
- **명시적으로만 선택 가능** -- OpenClaw의 자동 감지는 사용 가능한 자격 증명이 있는 제공자만 고려하므로 DuckDuckGo와 같이 키가 필요 없는 제공자는 자동으로 선택되지 않습니다. `provider: "duckduckgo"`를 설정해야 합니다.
- 구성하지 않으면 **SafeSearch의 기본값은 `moderate`입니다**.

<Tip>
  프로덕션 용도로는 [Brave Search](/ko/tools/brave-search)(무료 요금제 제공) 또는 API 기반의 다른 제공자를 고려하십시오.
</Tip>

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 무료 요금제가 포함된 구조화된 결과
- [Exa Search](/ko/tools/exa-search) -- 콘텐츠 추출 기능이 포함된 신경망 검색
