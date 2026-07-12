---
read_when:
    - 웹 검색에 Perplexity Search를 사용하려고 합니다
    - PERPLEXITY_API_KEY 또는 OPENROUTER_API_KEY를 설정해야 합니다.
summary: web_search를 위한 Perplexity Search API 및 Sonar/OpenRouter 호환성
title: Perplexity 검색
x-i18n:
    generated_at: "2026-07-12T15:51:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw는 Perplexity Search API를 `web_search` 제공자로 지원합니다. 이 API는 `title`, `url`, `snippet` 필드가 포함된 구조화된 결과를 반환합니다.

호환성을 위해 OpenClaw는 레거시 Perplexity Sonar/OpenRouter 설정도 지원합니다. `OPENROUTER_API_KEY`, `plugins.entries.perplexity.config.webSearch.apiKey`의 `sk-or-...` 키를 사용하거나 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`을 설정하면 제공자가 채팅 완성 경로로 전환되고, 구조화된 Search API 결과 대신 인용이 포함된 AI 합성 답변을 반환합니다.

## Plugin 설치

공식 Plugin을 설치한 후 Gateway를 다시 시작하십시오.

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Perplexity API 키 발급

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)에서 Perplexity 계정을 생성합니다.
2. 대시보드에서 API 키를 생성합니다.
3. 키를 구성에 저장하거나 Gateway 환경에서 `PERPLEXITY_API_KEY`를 설정합니다.

## OpenRouter 호환성

이미 OpenRouter를 통해 Perplexity Sonar를 사용하고 있었다면 `provider: "perplexity"`를 유지하고 Gateway 환경에서 `OPENROUTER_API_KEY`를 설정하거나, `plugins.entries.perplexity.config.webSearch.apiKey`에 `sk-or-...` 키를 저장하십시오.

선택적 호환성 제어 항목:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 구성 예시

### 네이티브 Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar 호환성

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## 키 설정 위치

**구성을 통한 설정:** `openclaw configure --section web`을 실행하십시오. 키는 `~/.openclaw/openclaw.json`의 `plugins.entries.perplexity.config.webSearch.apiKey` 아래에 저장됩니다. 이 필드에는 SecretRef 객체도 사용할 수 있습니다.

**환경을 통한 설정:** Gateway 프로세스 환경에서 `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`를 설정하십시오. Gateway 설치 환경에서는 `~/.openclaw/.env` 또는 서비스 환경에 설정하십시오. [환경 변수](/ko/help/faq#env-vars-and-env-loading)를 참조하십시오.

`provider: "perplexity"`가 구성되어 있고 Perplexity 키 SecretRef가 확인되지 않으며 대체 환경 변수도 없으면 시작 또는 다시 불러오기가 즉시 실패합니다.

## 도구 매개변수

다음 매개변수는 네이티브 Perplexity Search API 경로에 적용됩니다.

<ParamField path="query" type="string" required>
검색 쿼리입니다.
</ParamField>

<ParamField path="count" type="number" default="5">
반환할 결과 수입니다(1-10).
</ParamField>

<ParamField path="country" type="string">
2자리 ISO 국가 코드입니다(예: `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 언어 코드입니다(예: `en`, `de`, `fr`).
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

<ParamField path="domain_filter" type="string[]">
도메인 허용 목록/차단 목록 배열입니다(최대 20개).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
전체 콘텐츠 예산입니다(최대 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
페이지당 토큰 제한입니다.
</ParamField>

레거시 Sonar/OpenRouter 호환성 경로의 경우:

- `query`, `count`, `freshness`를 사용할 수 있습니다.
- 이 경로에서 `count`는 호환성만을 위한 항목이며, 응답은 N개 결과 목록이 아니라 인용이 포함된 하나의 합성 답변입니다.
- Search API 전용 필터(`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`)를 사용하면 명시적인 오류가 반환됩니다.

**예시:**

```javascript
// 국가 및 언어별 검색
await web_search({
  query: "재생 에너지",
  country: "DE",
  language: "de",
});

// 최근 결과(지난 1주)
await web_search({
  query: "AI 뉴스",
  freshness: "week",
});

// 날짜 범위 검색
await web_search({
  query: "AI 발전 동향",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 도메인 필터링(허용 목록)
await web_search({
  query: "기후 연구",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 도메인 필터링(차단 목록 - 앞에 - 추가)
await web_search({
  query: "제품 리뷰",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 더 많은 콘텐츠 추출
await web_search({
  query: "상세한 AI 연구",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 도메인 필터 규칙

- 필터당 최대 20개의 도메인을 사용할 수 있습니다.
- 동일한 요청에서 허용 목록과 차단 목록 항목을 함께 사용할 수 없습니다.
- 차단 목록 항목에는 `-` 접두사를 사용하십시오(예: `["-reddit.com"]`).

## 참고 사항

- Perplexity Search API는 구조화된 웹 검색 결과(`title`, `url`, `snippet`)를 반환합니다.
- OpenRouter 또는 명시적인 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 설정은 호환성을 위해 Perplexity를 Sonar 채팅 완성 방식으로 다시 전환합니다.
- Sonar/OpenRouter 호환성은 구조화된 결과 행이 아니라 인용이 포함된 하나의 합성 답변을 반환합니다.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`를 통해 구성 가능).

## 관련 항목

<CardGroup cols={2}>
  <Card title="웹 검색 개요" href="/ko/tools/web" icon="globe">
    모든 제공자 및 자동 감지 규칙입니다.
  </Card>
  <Card title="Brave 검색" href="/ko/tools/brave-search" icon="shield">
    국가 및 언어 필터가 포함된 구조화된 결과입니다.
  </Card>
  <Card title="Exa 검색" href="/ko/tools/exa-search" icon="magnifying-glass">
    콘텐츠 추출을 지원하는 신경망 검색입니다.
  </Card>
  <Card title="Perplexity Search API 문서" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    공식 Perplexity Search API 빠른 시작 및 참조 문서입니다.
  </Card>
</CardGroup>
