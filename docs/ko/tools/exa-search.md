---
read_when:
    - web_search에 Exa를 사용하려고 합니다
    - EXA_API_KEY가 필요합니다
    - 신경망 검색 또는 콘텐츠 추출이 필요한 경우
summary: Exa AI 검색 -- 콘텐츠 추출을 지원하는 신경망 및 키워드 검색
title: Exa 검색
x-i18n:
    generated_at: "2026-07-12T15:48:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/)는 신경망, 키워드 및 하이브리드 검색 모드와 기본 제공 콘텐츠 추출(하이라이트, 텍스트, 요약)을 지원하는 `web_search` 제공자입니다.

## Plugin 설치

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API 키 발급

<Steps>
  <Step title="계정 생성">
    [exa.ai](https://exa.ai/)에서 가입하고 대시보드에서 API 키를 생성합니다.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `EXA_API_KEY`를 설정하거나 다음 명령으로 구성합니다.

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
            apiKey: "exa-...", // EXA_API_KEY가 설정된 경우 선택 사항
            baseUrl: "https://api.exa.ai", // 선택 사항. OpenClaw가 /search를 추가함
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

**환경 변수 대안:** Gateway 환경에 `EXA_API_KEY`를 설정합니다. Gateway 설치 환경에서는 `~/.openclaw/.env`에 추가합니다. [환경 변수](/ko/help/faq#env-vars-and-env-loading)를 참조하십시오.

## 기본 URL 재정의

Exa 검색 요청을 호환 프록시나 대체 엔드포인트를 통해 라우팅하려면 `plugins.entries.exa.config.webSearch.baseUrl`을 설정합니다. OpenClaw는 프로토콜이 없는 호스트 앞에 `https://`를 추가하여 정규화하고, 경로가 이미 `/search`로 끝나지 않으면 이를 추가합니다. 확인된 엔드포인트는 검색 캐시 키의 일부이므로 서로 다른 엔드포인트의 결과가 공유되는 일은 없습니다.

## 도구 매개변수

<ParamField path="query" type="string" required>
검색 쿼리입니다.
</ParamField>

<ParamField path="count" type="number" default="5">
반환할 결과 수입니다(1~100, Exa 검색 유형 제한 적용).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
검색 모드입니다.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
시간 필터입니다. `date_after`/`date_before`와 함께 사용할 수 없습니다.
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

결과에서 추출할 콘텐츠를 제어하려면 `contents` 객체를 전달합니다.

```javascript
await web_search({
  query: "트랜스포머 아키텍처 설명",
  type: "neural",
  contents: {
    text: true, // 전체 페이지 텍스트
    highlights: { numSentences: 3 }, // 핵심 문장
    summary: true, // AI 요약
  },
});
```

| 콘텐츠 옵션     | 유형                                                                  | 설명                  |
| --------------- | --------------------------------------------------------------------- | --------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | 전체 페이지 텍스트 추출 |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 핵심 문장 추출          |
| `summary`       | `boolean \| { query }`                                                | AI 생성 요약            |

`contents`를 생략하면 Exa는 기본적으로 `{ highlights: true }`를 사용하므로 결과에 핵심 문장 발췌문이 포함됩니다. 결과 설명은 하이라이트, 요약, 전체 텍스트 순으로 사용 가능한 첫 번째 항목에서 가져옵니다. 또한 사용 가능한 경우 Exa API 응답의 원시 `highlightScores` 및 `summary` 필드도 결과에 그대로 유지됩니다.

### 검색 모드

| 모드             | 설명                               |
| ---------------- | ---------------------------------- |
| `auto`           | Exa가 최적의 모드를 선택함(기본값) |
| `neural`         | 의미 기반 시맨틱 검색              |
| `fast`           | 빠른 키워드 검색                   |
| `deep`           | 철저한 심층 검색                   |
| `deep-reasoning` | 추론을 포함한 심층 검색            |
| `instant`        | 가장 빠른 결과                     |

## 참고 사항

- `count`는 Exa 검색 유형 제한에 따라 최대 100까지 허용합니다.
- 결과는 기본적으로 15분 동안 캐시됩니다. Exa를 포함한 모든 `web_search` 제공자의 캐싱 및 요청 시간 제한을 변경하려면 공유 설정인 `tools.web.search.cacheTtlMinutes`(분)와 `tools.web.search.timeoutSeconds`(기본값 30초)를 구성합니다.

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Brave Search](/ko/tools/brave-search) -- 국가/언어 필터를 지원하는 구조화된 결과
- [Perplexity Search](/ko/tools/perplexity-search) -- 도메인 필터링을 지원하는 구조화된 결과
