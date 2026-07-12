---
read_when:
    - API 키 없이 웹 검색을 사용하려고 합니다
    - Parallel의 유료 Search API를 사용하려고 합니다
    - LLM 컨텍스트 효율성을 기준으로 순위가 매겨진 밀도 높은 발췌문이 필요합니다
summary: 병렬 검색 -- 웹 소스에서 추출한 LLM 최적화 고밀도 발췌문
title: 병렬 검색
x-i18n:
    generated_at: "2026-07-12T15:50:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel Plugin은 AI 에이전트용으로 구축된 웹 인덱스에서 순위가 지정되고 LLM에 최적화된 발췌문을 반환하는 두 가지 [Parallel](https://parallel.ai/) `web_search`
제공자를 제공합니다.

| 제공자                 | id              | 인증                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search (무료) | `parallel-free` | 없음 -- Parallel의 무료 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- 유료 Search API, 더 높은 요청 한도 및 목표 튜닝                      |

제공자를 명시적으로 선택하려면 `tools.web.search.provider`를
`parallel-free` 또는 `parallel`로 설정하십시오. 어느 제공자도 자동으로 감지되지 않습니다.

<Note>
  직접 OpenAI Responses 모델(`api: "openai-responses"`, 제공자
  `openai`, 공식 API 기본 URL)은 `tools.web.search.provider`가 설정되지 않았거나 비어 있거나 `"auto"`
  또는 `"openai"`인 경우 OpenAI에서 호스팅하는 네이티브 웹 검색을
  자동으로 사용하므로, 기본적으로 Parallel을 우회합니다. 대신 Parallel을
  통해 라우팅하려면 `tools.web.search.provider`를 `parallel-free` 또는 `parallel`로 설정하십시오.
  [웹 검색 개요](/ko/tools/web)를 참조하십시오.
</Note>

## Plugin 설치

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API 키(유료 제공자)

`parallel-free`에는 키가 필요하지 않지만 여전히 명시적으로 선택해야 합니다. 유료
`parallel` 제공자에는 API 키가 필요합니다.

<Steps>
  <Step title="계정 만들기">
    [platform.parallel.ai](https://platform.parallel.ai)에서 가입하고
    대시보드에서 API 키를 생성하십시오.
  </Step>
  <Step title="키 저장">
    Gateway 환경에서 `PARALLEL_API_KEY`를 설정하거나 다음 명령으로 구성하십시오.

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
            apiKey: "par-...", // PARALLEL_API_KEY가 설정된 경우 선택 사항
            baseUrl: "https://api.parallel.ai", // 선택 사항; OpenClaw가 /v1/search를 추가함
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // 무료 Search MCP에는 "parallel-free"를 사용하고, 여기에 표시된
        // 유료 API 기반 제공자에는 "parallel"을 사용합니다.
        provider: "parallel",
      },
    },
  },
}
```

**환경 변수 대안:** Gateway 환경에서 `PARALLEL_API_KEY`를 설정하십시오.
Gateway 설치의 경우 `~/.openclaw/.env`에 추가하십시오.

## 기본 URL 재정의

유료 `parallel` 제공자에만 적용됩니다. `parallel-free`는 항상
`https://search.parallel.ai/mcp`를 사용하며 이 설정을 무시합니다.

호환 프록시 또는 대체 엔드포인트(예: Cloudflare AI Gateway)를 통해 유료
요청을 라우팅하려면 `plugins.entries.parallel.config.webSearch.baseUrl`을 설정하십시오.
OpenClaw는 프로토콜이 없는 호스트 앞에 `https://`를 추가하고, 경로가 이미
`/v1/search`로 끝나지 않는 한 이를 덧붙여 정규화합니다. 확인된 엔드포인트는
검색 캐시 키의 일부이므로 서로 다른 엔드포인트의 결과는 절대 공유되지 않습니다.

## 도구 매개변수

두 제공자 모두 Parallel의 기본 검색 형식을 제공하므로 모델은 자연어 목표와
몇 개의 짧은 키워드 쿼리를 입력합니다. 이는 최상의 결과를 위해 Parallel이
[권장하는](https://docs.parallel.ai/search/best-practices) 조합입니다.

<ParamField path="objective" type="string" required>
기본 질문 또는 목표에 대한 자연어 설명입니다(최대 5000자).
설명 자체만으로 완전해야 합니다.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
각각 3~6단어로 구성된 간결한 키워드 검색 쿼리입니다(1~5개 항목, 각각 최대
200자). 최상의 결과를 얻으려면 서로 다양한 쿼리 2~3개를 제공하십시오.
</ParamField>

<ParamField path="count" type="number">
반환할 결과 수(1-40).
</ParamField>

<ParamField path="session_id" type="string">
이전 결과의 `sessionId`에서 가져온 선택적 Parallel 세션 ID입니다. 동일한 작업의
후속 검색에 전달하면 Parallel이 관련 호출을 그룹화하고 이후 결과를 개선합니다.
`parallel`에서는 최대 1000자이며, 무료 `parallel-free` Search MCP에서는 100자로
제한됩니다. 제한을 초과하는 ID는 삭제되거나(유료) 새 ID가 발급됩니다(무료).
</ParamField>

<ParamField path="client_model" type="string">
호출하는 모델의 선택적 식별자(예: `claude-opus-4-7`, `gpt-5.6-sol`)이며 최대
100자입니다. Parallel이 모델의 기능에 맞게 기본 설정을 조정할 수 있도록 합니다.
현재 활성화된 모델 슬러그를 정확히 전달하고 제품군 별칭으로 줄이지 마십시오.
</ParamField>

## 참고 사항

- Parallel은 사람이 클릭하여 탐색하기 위한 용도가 아니라 LLM 추론 유용성을 기준으로 결과의 순위를 정하고 압축합니다.
  따라서 전체 페이지 콘텐츠가 아니라 결과별로 밀도 높은 발췌문이 제공됩니다.
- 결과 발췌문은 `excerpts` 배열로 반환되며, 일반 `web_search` 계약과의
  호환성을 위해 `description`에도 결합됩니다.
- 두 제공자 모두 `session_id`을 반환하며, OpenClaw는 호출자가 후속 검색을
  그룹화할 수 있도록 도구 페이로드에서 이를 `sessionId`로 노출합니다. 호출자가
  제공하지 않고 Parallel이 생성한 세션 ID는 동일한 쿼리를 사용하는 관련 없는 작업이
  이를 상속하지 않도록 캐시 항목에서 제외됩니다.
- Parallel의 `searchId`, `warnings`, `usage`은 존재하는 경우
  그대로 전달됩니다.
- OpenClaw는 확인된 결과 수를 항상 `advanced_settings.max_results`(`parallel`)로 Parallel에
  전달하거나, Parallel의 고정 크기 응답(`parallel-free`)을 받은 후 클라이언트 측에서
  `count`을 적용합니다. 호출자의 `count` 인수가 우선하고, 그다음은
  `tools.web.search.maxResults`이며, 둘 다 없으면 OpenClaw의 일반 `web_search` 기본값(5)을
  사용합니다. Parallel 자체 API의 기본값은 10입니다.
- 결과는 기본적으로 15분 동안 캐시됩니다(`cacheTtlMinutes`).
- 호출자가 제공하지 않으면 `parallel-free`은 MCP 핸드셰이크를 통해 호출마다 새로운
  `session_id`을 발급하며, `parallel`은 이 경우 값을 설정하지 않은 상태로
  둡니다.

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Exa 검색](/ko/tools/exa-search) -- 콘텐츠 추출을 지원하는 신경망 검색
- [Perplexity 검색](/ko/tools/perplexity-search) -- 도메인 필터링을 지원하는 구조화된 결과
