---
read_when:
    - API 키 없이 웹 검색을 사용하고 싶은 경우
    - Parallel의 유료 Search API가 필요합니다
    - LLM 컨텍스트 효율성을 위해 순위가 매겨진 조밀한 발췌문을 원합니다
summary: 병렬 검색 -- 웹 출처에서 가져온 LLM 최적화 고밀도 발췌문
title: 병렬 검색
x-i18n:
    generated_at: "2026-06-27T18:15:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel Plugin은 두 가지 [Parallel](https://parallel.ai/) `web_search` provider를 제공합니다.

- **Parallel 검색(무료)** (`parallel-free`) -- Parallel의 무료
  [검색 MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)입니다. 계정이나
  API 키가 필요하지 않습니다. Parallel의 호스팅되는 키 없는 검색 경로를 원할 때
  명시적으로 선택하세요.
- **Parallel 검색** (`parallel`) -- Parallel의 유료 검색 API입니다. `PARALLEL_API_KEY`가
  필요하며 더 높은 속도 제한과 objective 조정을 제공합니다.

둘 다 AI 에이전트용으로 구축된 웹 인덱스에서 순위가 매겨지고 LLM에 최적화된 발췌문을 반환합니다.
하나를 명시적으로 선택하려면 `tools.web.search.provider`를 `parallel-free` 또는 `parallel`로 설정하세요.

<Note>
  OpenAI Responses 모델은 `tools.web.search.provider`가 설정되지 않은 경우
  OpenAI의 네이티브 웹 검색을 사용하므로 Parallel provider를 우회합니다.
  Parallel을 통해 라우팅하려면 `tools.web.search.provider`를 `parallel-free` 또는
  `parallel`로 설정하세요.
</Note>

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작하세요.

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API 키(유료 provider)

`parallel-free`에는 API 키가 필요하지 않지만, 관리형 provider로 선택되어야 합니다.
유료 `parallel` provider에는 API 키가 필요합니다.

<Steps>
  <Step title="계정 만들기">
    [platform.parallel.ai](https://platform.parallel.ai)에서 가입하고
    대시보드에서 API 키를 생성하세요.
  </Step>
  <Step title="키 저장하기">
    Gateway 환경에서 `PARALLEL_API_KEY`를 설정하거나 다음으로 구성하세요.

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
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**환경 대안:** Gateway 환경에서 `PARALLEL_API_KEY`를 설정하세요.
Gateway 설치의 경우 `~/.openclaw/.env`에 넣으세요.

## 기본 URL 재정의

기본 URL 재정의는 유료 `parallel` provider에만 적용됩니다. 무료
`parallel-free` provider는 항상 `https://search.parallel.ai/mcp`를 사용합니다.

Parallel 요청이 호환되는 프록시 또는 대체 Parallel 엔드포인트(예:
Cloudflare AI Gateway)를 거쳐야 할 때 `plugins.entries.parallel.config.webSearch.baseUrl`을
설정하세요. OpenClaw는 베어 호스트 앞에 `https://`를 붙여 정규화하고,
경로가 이미 그렇게 끝나지 않는 한 `/v1/search`를 덧붙입니다. 확인된 엔드포인트는
검색 캐시 키에 포함되므로 서로 다른 Parallel 엔드포인트의 결과는 공유되지 않습니다.

## 도구 매개변수

OpenClaw는 모델이 자연어 목표와 몇 개의 짧은 키워드 쿼리를 모두 채울 수 있도록
Parallel의 네이티브 검색 형태를 노출합니다. 이 조합은 최상의 결과를 위해
Parallel이 [권장](https://docs.parallel.ai/search/best-practices)하는 방식입니다.

<ParamField path="objective" type="string" required>
기저 질문 또는 목표에 대한 자연어 설명입니다(최대 5000자). 자체적으로 완결되어야 합니다.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
간결한 키워드 검색 쿼리입니다. 각각 3-6단어입니다(1-5개 항목, 각각 최대 200자).
최상의 결과를 위해 다양한 쿼리 2-3개를 제공하세요.
</ParamField>

<ParamField path="count" type="number">
반환할 결과 수입니다(1-40).
</ParamField>

<ParamField path="session_id" type="string">
선택적 Parallel 세션 ID입니다(`parallel`에서는 최대 1000자, 무료
`parallel-free` 검색 MCP는 100자로 제한). 같은 작업의 일부인 후속 검색에서는
이전 Parallel 결과의 `sessionId`를 전달하여 Parallel이 관련 호출을 그룹화하고
이후 결과를 개선할 수 있게 하세요. 제한을 초과한 ID는 삭제되고 새 ID가 생성됩니다.
</ParamField>

<ParamField path="client_model" type="string">
호출을 수행하는 모델의 선택적 식별자입니다(예: `claude-opus-4-7`,
`gpt-5.5`). Parallel이 모델의 기능에 맞게 기본 설정을 조정할 수 있게 합니다.
정확한 활성 모델 슬러그를 전달하세요. 제품군 별칭으로 줄이지 마세요.
</ParamField>

## 참고 사항

- Parallel은 사람의 클릭률이 아니라 LLM 추론 유용성을 기준으로 결과의 순위를 매기고 압축합니다.
  각 결과에서 전체 페이지 콘텐츠보다 밀도 높은 발췌문을 기대하세요.
- 결과 발췌문은 `excerpts` 배열로 반환되며, 일반 `web_search` 계약과의
  호환성을 위해 `description` 필드에도 결합됩니다.
- Parallel은 모든 응답에서 `session_id`를 반환합니다. OpenClaw는 호출자가 후속
  검색을 그룹화할 수 있도록 도구 페이로드에서 이를 `sessionId`로 노출합니다.
- Parallel의 `searchId`, `warnings`, `usage`는 존재하는 경우 그대로 전달됩니다.
- OpenClaw는 확인된 결과 수를 항상 `advanced_settings.max_results`로 Parallel에 전달합니다.
  호출자의 `count` 인자가 우선하고, 그다음 최상위 `tools.web.search.maxResults`
  설정이 우선하며, 그렇지 않으면 OpenClaw의 일반 `web_search` 기본값(5)이 사용됩니다.
  이렇게 하면 provider를 전환할 때 결과 양이 일관되게 유지됩니다. Parallel 자체의
  기본값은 10입니다.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`로 구성 가능).
- 무료 `parallel-free` provider는 동일한 매개변수를 허용합니다. `count`를 클라이언트
  측에서 적용하고, 제공되지 않은 경우 호출마다 `session_id`를 생성합니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 provider와 자동 감지
- [Exa 검색](/ko/tools/exa-search) -- 콘텐츠 추출이 있는 신경망 검색
- [Perplexity 검색](/ko/tools/perplexity-search) -- 도메인 필터링이 있는 구조화된 결과
