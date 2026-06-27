---
read_when:
    - 웹 검색에 Perplexity Search를 사용하려고 합니다
    - PERPLEXITY_API_KEY 또는 OPENROUTER_API_KEY 설정이 필요합니다
summary: web_search용 Perplexity Search API 및 Sonar/OpenRouter 호환성
title: Perplexity 검색
x-i18n:
    generated_at: "2026-06-27T18:15:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw는 `web_search` 공급자로 Perplexity Search API를 지원합니다.
`title`, `url`, `snippet` 필드가 포함된 구조화된 결과를 반환합니다.

호환성을 위해 OpenClaw는 레거시 Perplexity Sonar/OpenRouter 설정도 지원합니다.
`OPENROUTER_API_KEY`, `plugins.entries.perplexity.config.webSearch.apiKey`의 `sk-or-...` 키를 사용하거나 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`을 설정하면, 공급자는 chat-completions 경로로 전환되어 구조화된 Search API 결과 대신 인용이 포함된 AI 합성 답변을 반환합니다.

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Perplexity API 키 받기

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)에서 Perplexity 계정을 만듭니다
2. 대시보드에서 API 키를 생성합니다
3. 키를 설정에 저장하거나 Gateway 환경에 `PERPLEXITY_API_KEY`를 설정합니다.

## OpenRouter 호환성

이미 Perplexity Sonar용으로 OpenRouter를 사용하고 있었다면 `provider: "perplexity"`를 유지하고 Gateway 환경에 `OPENROUTER_API_KEY`를 설정하거나, `plugins.entries.perplexity.config.webSearch.apiKey`에 `sk-or-...` 키를 저장합니다.

선택적 호환성 제어 항목:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 설정 예시

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

## 키를 설정할 위치

**설정을 통해:** `openclaw configure --section web`를 실행합니다. 이 명령은 키를
`~/.openclaw/openclaw.json`의 `plugins.entries.perplexity.config.webSearch.apiKey` 아래에 저장합니다.
해당 필드는 SecretRef 객체도 허용합니다.

**환경을 통해:** Gateway 프로세스 환경에 `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`를 설정합니다.
Gateway 설치의 경우 `~/.openclaw/.env`(또는 서비스 환경)에 넣습니다. [Env vars](/ko/help/faq#env-vars-and-env-loading)를 참조하세요.

`provider: "perplexity"`가 설정되어 있고 Perplexity 키 SecretRef가 환경 폴백 없이 확인되지 않으면, 시작/다시 로드가 빠르게 실패합니다.

## 도구 매개변수

이 매개변수는 네이티브 Perplexity Search API 경로에 적용됩니다.

<ParamField path="query" type="string" required>
검색 쿼리입니다.
</ParamField>

<ParamField path="count" type="number" default="5">
반환할 결과 수입니다(1-10).
</ParamField>

<ParamField path="country" type="string">
2글자 ISO 국가 코드입니다(예: `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 언어 코드입니다(예: `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
시간 필터입니다. `day`는 24시간입니다.
</ParamField>

<ParamField path="date_after" type="string">
이 날짜 이후에 게시된 결과만 포함합니다(`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
이 날짜 이전에 게시된 결과만 포함합니다(`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
도메인 허용 목록/거부 목록 배열입니다(최대 20개).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
전체 콘텐츠 예산입니다(최대 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
페이지당 토큰 제한입니다.
</ParamField>

레거시 Sonar/OpenRouter 호환성 경로의 경우:

- `query`, `count`, `freshness`가 허용됩니다
- 여기서 `count`는 호환성 전용입니다. 응답은 여전히 N개 결과 목록이 아니라 인용이 포함된 하나의 합성 답변입니다
- `country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`와 같은 Search API 전용 필터는 명시적 오류를 반환합니다

**예시:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 도메인 필터 규칙

- 필터당 최대 20개 도메인
- 같은 요청에서 허용 목록과 거부 목록을 혼합할 수 없습니다
- 거부 목록 항목에는 `-` 접두사를 사용합니다(예: `["-reddit.com"]`)

## 참고

- Perplexity Search API는 구조화된 웹 검색 결과(`title`, `url`, `snippet`)를 반환합니다
- OpenRouter 또는 명시적인 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`은 호환성을 위해 Perplexity를 다시 Sonar chat completions로 전환합니다
- Sonar/OpenRouter 호환성은 구조화된 결과 행이 아니라 인용이 포함된 하나의 합성 답변을 반환합니다
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 설정 가능)

## 관련 항목

<CardGroup cols={2}>
  <Card title="Web search overview" href="/ko/tools/web" icon="globe">
    모든 공급자와 자동 감지 규칙입니다.
  </Card>
  <Card title="Brave search" href="/ko/tools/brave-search" icon="shield">
    국가 및 언어 필터가 포함된 구조화된 결과입니다.
  </Card>
  <Card title="Exa search" href="/ko/tools/exa-search" icon="magnifying-glass">
    콘텐츠 추출이 포함된 신경망 검색입니다.
  </Card>
  <Card title="Perplexity Search API docs" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    공식 Perplexity Search API 빠른 시작 및 참조입니다.
  </Card>
</CardGroup>
