---
read_when:
    - web_search에 Gemini를 사용하려고 합니다
    - GEMINI_API_KEY 또는 models.providers.google.apiKey가 필요합니다
    - Google Search 그라운딩을 원하는 경우
summary: Google Search 그라운딩을 사용한 Gemini 웹 검색
title: Gemini 검색
x-i18n:
    generated_at: "2026-05-02T21:15:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw는 기본 제공
[Google Search 그라운딩](https://ai.google.dev/gemini-api/docs/grounding)을 사용하는 Gemini 모델을 지원하며,
실시간 Google Search 결과와 인용을 기반으로 AI가 합성한 답변을 반환합니다.

## API 키 받기

<Steps>
  <Step title="키 생성">
    [Google AI Studio](https://aistudio.google.com/apikey)로 이동하여
    API 키를 생성합니다.
  </Step>
  <Step title="키 저장">
    Gateway 환경에서 `GEMINI_API_KEY`를 설정하거나,
    `models.providers.google.apiKey`를 재사용하거나, 다음을 통해 전용 웹 검색 키를 구성합니다.

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
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
`plugins.entries.google.config.webSearch.apiKey`를 사용하고, 그다음 `GEMINI_API_KEY`,
그다음 `models.providers.google.apiKey`를 사용합니다. 기본 URL의 경우 전용
`plugins.entries.google.config.webSearch.baseUrl`이
`models.providers.google.baseUrl`보다 우선합니다.

Gateway 설치의 경우 환경 키를 `~/.openclaw/.env`에 넣습니다.

## 작동 방식

링크와 스니펫 목록을 반환하는 기존 검색 제공자와 달리,
Gemini는 Google Search 그라운딩을 사용하여 인라인 인용이 포함된
AI 합성 답변을 생성합니다. 결과에는 합성된 답변과 소스 URL이 모두 포함됩니다.

- Gemini 그라운딩의 인용 URL은 Google 리디렉션 URL에서 직접 URL로 자동 해석됩니다.
- 리디렉션 해석은 최종 인용 URL을 반환하기 전에 SSRF 가드 경로(HEAD + 리디렉션 검사 +
  http/https 검증)를 사용합니다.
- 리디렉션 해석은 엄격한 SSRF 기본값을 사용하므로
  비공개/내부 대상으로의 리디렉션은 차단됩니다.

## 지원되는 매개변수

Gemini 검색은 `query`, `freshness`, `date_after`, `date_before`를 지원합니다.

`count`는 공유 `web_search` 호환성을 위해 허용되지만, Gemini 그라운딩은
N개 결과 목록 대신 인용이 포함된 하나의 합성 답변을 반환합니다.

`freshness`는 `day`, `week`, `month`, `year`와 공유 단축값
`pd`, `pw`, `pm`, `py`를 허용합니다. OpenClaw는 이러한 값 또는 명시적
`date_after`/`date_before` 범위를 Gemini Google Search 그라운딩의
`timeRangeFilter`로 변환합니다. `country`, `language`, `domain_filter`는 지원되지 않습니다.

## 모델 선택

기본 모델은 `gemini-2.5-flash`입니다(빠르고 비용 효율적). 그라운딩을 지원하는 모든 Gemini
모델은 `plugins.entries.google.config.webSearch.model`을 통해 사용할 수 있습니다.

## 기본 URL 재정의

Gemini 웹 검색이 운영자 프록시 또는 사용자 지정 Gemini 호환 엔드포인트를 통해 라우팅되어야 하는 경우
`plugins.entries.google.config.webSearch.baseUrl`을 설정합니다. 설정하지 않으면 Gemini 웹 검색은
`models.providers.google.baseUrl`을 재사용합니다. 일반
`https://generativelanguage.googleapis.com` 값은
`https://generativelanguage.googleapis.com/v1beta`로 정규화되며, 사용자 지정 프록시 경로는
뒤쪽 슬래시를 제거한 뒤 제공된 그대로 유지됩니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 스니펫이 포함된 구조화된 결과
- [Perplexity Search](/ko/tools/perplexity-search) -- 구조화된 결과 + 콘텐츠 추출
