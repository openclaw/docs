---
read_when:
    - web_search에 Gemini를 사용하려고 합니다
    - GEMINI_API_KEY 또는 models.providers.google.apiKey가 필요합니다.
    - Google 검색 그라운딩을 사용하려는 경우
summary: Google Search 그라운딩을 사용하는 Gemini 웹 검색
title: Gemini 검색
x-i18n:
    generated_at: "2026-07-12T15:48:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw는 내장된
[Google 검색 그라운딩](https://ai.google.dev/gemini-api/docs/grounding)을 통해 Gemini 모델을 지원합니다.
이 기능은 실시간 Google 검색 결과를 기반으로 AI가 종합한 답변과
인용을 반환합니다.

## API 키 가져오기

<Steps>
  <Step title="키 생성">
    [Google AI Studio](https://aistudio.google.com/apikey)로 이동하여
    API 키를 생성합니다.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `GEMINI_API_KEY`를 설정하거나,
    `models.providers.google.apiKey`를 재사용하거나, 다음을 통해 웹 검색 전용 키를 구성합니다.

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 구성

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // GEMINI_API_KEY 또는 models.providers.google.apiKey가 설정된 경우 선택 사항
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 선택 사항, models.providers.google.baseUrl을 대체 값으로 사용
            model: "gemini-2.5-flash", // 기본값
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**자격 증명 우선순위:** Gemini 웹 검색은 먼저
`plugins.entries.google.config.webSearch.apiKey`, 그다음 `GEMINI_API_KEY`,
마지막으로 `models.providers.google.apiKey`를 사용합니다. 기본 URL은 전용
`plugins.entries.google.config.webSearch.baseUrl`이
`models.providers.google.baseUrl`보다 우선합니다.

Gateway 설치 환경에서는 환경 키를 `~/.openclaw/.env`에 넣으십시오.

## 작동 방식

링크와 스니펫 목록을 반환하는 기존 검색 제공자와 달리,
Gemini는 Google 검색 그라운딩을 사용하여 인라인 인용이 포함된 AI 종합 답변을
생성합니다. 결과에는 종합된 답변과 출처
URL이 모두 포함됩니다.

- Gemini 그라운딩의 인용 URL은 OpenClaw의 SSRF 보호
  가져오기 경로를 통한 HEAD 요청으로 Google 리디렉션 URL에서 직접 URL로 자동 변환됩니다
  (리디렉션 추적, http/https 검증).
- 리디렉션 변환에는 엄격한 SSRF 기본값이 적용되므로
  비공개/내부 대상으로의 리디렉션은 차단됩니다.

## 지원되는 매개변수

Gemini 검색은 `query`, `freshness`, `date_after`, `date_before`를 지원합니다.

공통 `web_search` 호환성을 위해 `count`를 허용하지만, Gemini 그라운딩은
N개의 결과 목록 대신 인용이 포함된 하나의 종합 답변을
반환합니다.

`freshness`에는 `day`, `week`, `month`, `year`와 공통 단축어
`pd`, `pw`, `pm`, `py`를 사용할 수 있습니다. `day`/`pd`는 엄격한 24시간 범위를 적용하는 대신 Gemini
쿼리에 최신성 지침을 추가합니다. `week`, `month`, `year` 및 명시적
`date_after`/`date_before` 범위는 Gemini Google 검색 그라운딩의
`timeRangeFilter`를 설정합니다. `country`, `language`, `domain_filter`는 지원되지 않습니다.

## 모델 선택

기본 모델은 `gemini-2.5-flash`입니다(빠르고 비용 효율적). 그라운딩을
지원하는 모든 Gemini 모델을
`plugins.entries.google.config.webSearch.model`을 통해 사용할 수 있습니다.

## 기본 URL 재정의

Gemini 웹 검색을 운영자 프록시나 사용자 지정 Gemini 호환 엔드포인트를 통해
라우팅해야 하는 경우 `plugins.entries.google.config.webSearch.baseUrl`을 설정합니다. 설정하지 않으면
Gemini 웹 검색은 `models.providers.google.baseUrl`을 재사용합니다. 단순
`https://generativelanguage.googleapis.com` 값은
`https://generativelanguage.googleapis.com/v1beta`로 정규화되며, 사용자 지정 프록시 경로는
후행 슬래시를 제거한 후 제공된 그대로 유지됩니다.

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 스니펫이 포함된 구조화된 결과
- [Perplexity Search](/ko/tools/perplexity-search) -- 구조화된 결과 + 콘텐츠 추출
