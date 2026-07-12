---
read_when:
    - web_search에 Brave Search를 사용하려고 합니다
    - BRAVE_API_KEY 또는 요금제 세부 정보가 필요합니다.
summary: web_search를 위한 Brave Search API 설정
title: Brave 검색
x-i18n:
    generated_at: "2026-07-12T15:47:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw은 `web_search` 제공자로 Brave Search API를 지원합니다.

## API 키 받기

1. [https://brave.com/search/api/](https://brave.com/search/api/)에서 Brave Search API 계정을 생성합니다.
2. 대시보드에서 **Search** 플랜을 선택하고 API 키를 생성합니다.
3. 키를 구성에 저장하거나 Gateway 환경에 `BRAVE_API_KEY`를 설정합니다.

## 구성 예시

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // 또는 "llm-context"
            baseUrl: "https://api.search.brave.com", // 선택적 프록시/기본 URL 재정의
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

제공자별 Brave 검색 설정은 `plugins.entries.brave.config.webSearch.*`에 있으며, 이것이 표준 구성 경로입니다. 공유 최상위 `tools.web.search.apiKey`와 범위가 지정된 `tools.web.search.brave.*`도 호환성 병합을 통해 계속 로드되지만, 새 구성에서는 위의 Plugin 범위 경로를 사용해야 합니다.

`webSearch.mode`는 Brave 전송 방식을 제어합니다.

- `web`(기본값): 제목, URL, 스니펫을 포함하는 일반 Brave 웹 검색
- `llm-context`: 그라운딩을 위해 미리 추출된 텍스트 청크와 소스를 제공하는 Brave LLM Context API

`webSearch.baseUrl`을 사용하면 Brave 요청이 신뢰할 수 있는 Brave 호환 프록시
또는 게이트웨이를 가리키도록 설정할 수 있습니다. OpenClaw은 구성된 기본 URL에
`/res/v1/web/search` 또는 `/res/v1/llm/context`를 추가하고 기본 URL을 캐시 키에
포함합니다. 공개 엔드포인트는 `https://`를 사용해야 하며, `http://`는 신뢰할 수
있는 루프백 또는 사설 네트워크 프록시 호스트에만 허용됩니다.

## 도구 매개변수

<ParamField path="query" type="string" required>
검색 쿼리입니다.
</ParamField>

<ParamField path="count" type="number" default="5">
반환할 결과 수입니다(1–10).
</ParamField>

<ParamField path="country" type="string">
2자리 ISO 국가 코드입니다(예: `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
검색 결과에 사용할 ISO 639-1 언어 코드입니다(예: `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave 검색 언어 코드입니다(예: `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
UI 요소에 사용할 ISO 언어 코드입니다.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
시간 필터입니다. `day`는 24시간입니다.
</ParamField>

<ParamField path="date_after" type="string">
이 날짜 이후에 게시된 결과만 반환합니다(`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
이 날짜 이전에 게시된 결과만 반환합니다(`YYYY-MM-DD`).
</ParamField>

**예시:**

```javascript
// 국가 및 언어별 검색
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 최근 결과(지난 1주)
await web_search({
  query: "AI news",
  freshness: "week",
});

// 날짜 범위 검색
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 참고 사항

- OpenClaw은 Brave **Search** 플랜을 사용합니다. 기존 구독(예: 월 2,000개 쿼리를 제공하는 기존 Free 플랜)이 있는 경우 계속 유효하지만, LLM Context나 더 높은 속도 제한 같은 최신 기능은 포함되지 않습니다.
- 각 Brave 플랜에는 매월 갱신되는 **월 \$5 무료 크레딧**이 포함됩니다. Search 플랜은 요청 1,000건당 \$5이므로 이 크레딧으로 월 1,000개의 쿼리를 사용할 수 있습니다. 예상치 못한 요금을 방지하려면 Brave 대시보드에서 사용량 한도를 설정하십시오. 현재 플랜은 [Brave API 포털](https://brave.com/search/api/)을 참조하십시오.
- Search 플랜에는 LLM Context 엔드포인트와 AI 추론 권한이 포함됩니다. 모델 학습 또는 튜닝을 위해 결과를 저장하려면 명시적인 저장 권한이 포함된 플랜이 필요합니다. Brave [서비스 약관](https://api-dashboard.search.brave.com/terms-of-service)을 참조하십시오.
- `llm-context` 모드는 일반 웹 검색 스니펫 형식 대신 그라운딩된 소스 항목을 반환합니다.
- `llm-context` 모드는 `freshness`와 범위가 제한된 `date_after` + `date_before` 구간을 지원합니다. `ui_lang`은 지원하지 않습니다. Brave에서는 사용자 지정 최신성 범위에 시작일과 종료일을 모두 포함해야 하므로 `date_after` 없이 `date_before`만 지정하면 거부됩니다.
- `ui_lang`에는 `en-US`와 같은 지역 하위 태그가 포함되어야 합니다.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 구성 가능).
- 사용자 지정 `webSearch.baseUrl` 값은 Brave 캐시 식별자에 포함되므로
  프록시별 응답이 충돌하지 않습니다.
- 문제를 해결하는 동안 Brave 요청 URL/쿼리 매개변수, 응답 상태/소요 시간, 검색 캐시 적중/미적중/쓰기 이벤트를 기록하려면 `brave.http` 진단 플래그를 활성화하십시오. 이 플래그는 API 키나 응답 본문을 기록하지 않지만, 검색 쿼리에는 민감한 정보가 포함될 수 있습니다.

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Perplexity 검색](/ko/tools/perplexity-search) -- 도메인 필터링을 지원하는 구조화된 결과
- [Exa 검색](/ko/tools/exa-search) -- 콘텐츠 추출을 지원하는 신경망 검색
