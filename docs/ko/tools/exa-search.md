---
read_when:
    - Exa를 web_search에 사용하려고 합니다
    - EXA_API_KEY가 필요합니다
    - 신경망 검색 또는 콘텐츠 추출이 필요한 경우
summary: Exa AI 검색 -- 콘텐츠 추출을 포함한 신경망 및 키워드 검색
title: Exa 검색
x-i18n:
    generated_at: "2026-06-27T18:13:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw은 `web_search` 제공자로 [Exa AI](https://exa.ai/)를 지원합니다. Exa는
내장 콘텐츠 추출(하이라이트, 텍스트, 요약)과 함께 신경망, 키워드, 하이브리드
검색 모드를 제공합니다.

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API 키 받기

<Steps>
  <Step title="계정 만들기">
    [exa.ai](https://exa.ai/)에서 가입하고 대시보드에서 API 키를 생성합니다.
  </Step>
  <Step title="키 저장">
    Gateway 환경에서 `EXA_API_KEY`를 설정하거나 다음으로 구성합니다.

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**환경 대안:** Gateway 환경에서 `EXA_API_KEY`를 설정합니다.
Gateway 설치의 경우 `~/.openclaw/.env`에 넣습니다.

## 기본 URL 재정의

Exa 검색 요청이 호환 프록시나 대체 Exa 엔드포인트를 거쳐야 하는 경우
`plugins.entries.exa.config.webSearch.baseUrl`을 설정합니다. OpenClaw은
bare 호스트 앞에 `https://`를 붙여 정규화하고, 경로가 이미 `/search`로 끝나지
않으면 `/search`를 추가합니다. 해석된 엔드포인트는 검색 캐시 키에 포함되므로
서로 다른 Exa 엔드포인트의 결과는 공유되지 않습니다.

## 도구 매개변수

<ParamField path="query" type="string" required>
검색 쿼리입니다.
</ParamField>

<ParamField path="count" type="number">
반환할 결과 수입니다(1~100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
검색 모드입니다.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
시간 필터입니다.
</ParamField>

<ParamField path="date_after" type="string">
이 날짜 이후의 결과입니다(`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
이 날짜 이전의 결과입니다(`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
콘텐츠 추출 옵션입니다(아래 참조).
</ParamField>

### 콘텐츠 추출

Exa는 검색 결과와 함께 추출된 콘텐츠를 반환할 수 있습니다. 활성화하려면
`contents` 객체를 전달합니다.

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| 콘텐츠 옵션     | 유형                                                                  | 설명                    |
| --------------- | --------------------------------------------------------------------- | ----------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | 전체 페이지 텍스트 추출 |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 핵심 문장 추출          |
| `summary`       | `boolean \| { query }`                                                | AI 생성 요약            |

### 검색 모드

| 모드             | 설명                                  |
| ---------------- | ------------------------------------- |
| `auto`           | Exa가 최적의 모드를 선택합니다(기본값) |
| `neural`         | 의미 기반 검색                        |
| `fast`           | 빠른 키워드 검색                      |
| `deep`           | 철저한 딥 검색                        |
| `deep-reasoning` | 추론을 포함한 딥 검색                 |
| `instant`        | 가장 빠른 결과                        |

## 참고

- `contents` 옵션이 제공되지 않으면 Exa는 기본적으로 `{ highlights: true }`를
  사용하므로 결과에 핵심 문장 발췌가 포함됩니다
- 사용 가능한 경우 결과는 Exa API 응답의 `highlightScores` 및 `summary` 필드를
  보존합니다
- 결과 설명은 하이라이트, 요약, 전체 텍스트 순서로 확인하며, 사용 가능한 것을
  사용합니다
- `freshness`와 `date_after`/`date_before`는 함께 사용할 수 없습니다. 하나의
  시간 필터 모드를 사용하세요
- 쿼리당 최대 100개의 결과를 반환할 수 있습니다(Exa 검색 유형 제한에 따름)
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 구성 가능)
- Exa는 구조화된 JSON 응답을 제공하는 공식 API 통합입니다

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자와 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 국가/언어 필터가 포함된 구조화된 결과
- [Perplexity Search](/ko/tools/perplexity-search) -- 도메인 필터링이 포함된 구조화된 결과
