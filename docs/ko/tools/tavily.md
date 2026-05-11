---
read_when:
    - Tavily 기반 웹 검색을 원합니다
    - Tavily API 키가 필요합니다
    - Tavily를 web_search 제공자로 사용하려는 경우
    - URL에서 콘텐츠를 추출하려는 경우
summary: Tavily 검색 및 추출 도구
title: Tavily
x-i18n:
    generated_at: "2026-05-11T20:40:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com)는 AI 애플리케이션을 위해 설계된 검색 API입니다. OpenClaw는 이를 두 가지 방식으로 노출합니다.

- 범용 검색 도구의 `web_search` 제공자로
- 명시적 Plugin 도구인 `tavily_search` 및 `tavily_extract`로

Tavily는 구성 가능한 검색 깊이, 주제 필터링, 도메인 필터, AI 생성 답변 요약, URL 콘텐츠 추출(JavaScript로 렌더링된 페이지 포함)을 통해 LLM 소비에 최적화된 구조화된 결과를 반환합니다.

| 속성          | 값                                  |
| ------------- | ----------------------------------- |
| Plugin ID     | `tavily`                            |
| 인증          | `TAVILY_API_KEY` 또는 config `apiKey` |
| 기본 URL      | `https://api.tavily.com` (기본값)   |
| 번들 도구     | `tavily_search`, `tavily_extract`   |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [tavily.com](https://tavily.com)에서 Tavily 계정을 만든 다음, 대시보드에서 API 키를 생성합니다.
  </Step>
  <Step title="Plugin 및 제공자 구성">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="검색 실행 확인">
    아무 에이전트에서나 `web_search`를 트리거하거나, `tavily_search`를 직접 호출합니다.
  </Step>
</Steps>

<Tip>
온보딩 또는 `openclaw configure --section web`에서 Tavily를 선택하면 번들 Tavily Plugin이 자동으로 활성화됩니다.
</Tip>

## 도구 참조

### `tavily_search`

범용 `web_search` 대신 Tavily 전용 검색 제어가 필요할 때 사용합니다.

| 매개변수          | 유형         | 제약 조건 / 기본값                     | 설명                                            |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | 필수                                   | 검색 쿼리 문자열입니다. 400자 미만으로 유지하세요. |
| `search_depth`    | enum         | `basic` (기본값), `advanced`           | `advanced`는 더 느리지만 관련성이 더 높습니다.  |
| `topic`           | enum         | `general` (기본값), `news`, `finance`  | 주제 계열로 필터링합니다.                       |
| `max_results`     | integer      | 1-20                                   | 결과 수입니다.                                  |
| `include_answer`  | boolean      | 기본값 `false`                         | Tavily AI 생성 답변 요약을 포함합니다.          |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | 최신순 기준으로 결과를 필터링합니다.            |
| `include_domains` | string array | (없음)                                 | 이 도메인의 결과만 포함합니다.                  |
| `exclude_domains` | string array | (없음)                                 | 이 도메인의 결과를 제외합니다.                  |

검색 깊이의 트레이드오프:

| 깊이       | 속도   | 관련성 | 가장 적합한 용도                     |
| ---------- | ------ | ------ | ------------------------------------ |
| `basic`    | 더 빠름 | 높음   | 범용 쿼리(기본값).                   |
| `advanced` | 더 느림 | 가장 높음 | 정밀 조사 및 사실 확인.              |

### `tavily_extract`

하나 이상의 URL에서 정제된 콘텐츠를 추출할 때 사용합니다. JavaScript로 렌더링된 페이지를 처리하며, 대상 추출을 위한 쿼리 중심 청킹을 지원합니다.

| 매개변수            | 유형         | 제약 조건 / 기본값          | 설명                                                        |
| ------------------- | ------------ | --------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | 필수, 1-20                  | 콘텐츠를 추출할 URL입니다.                                  |
| `query`             | string       | (선택 사항)                 | 추출된 청크를 이 쿼리와의 관련성 기준으로 다시 정렬합니다.  |
| `extract_depth`     | enum         | `basic` (기본값), `advanced` | JS가 많은 페이지, SPA 또는 동적 테이블에는 `advanced`를 사용하세요. |
| `chunks_per_source` | integer      | 1-5; **`query` 필요**       | URL당 반환되는 청크 수입니다. `query` 없이 설정하면 오류가 발생합니다. |
| `include_images`    | boolean      | 기본값 `false`              | 결과에 이미지 URL을 포함합니다.                             |

추출 깊이의 트레이드오프:

| 깊이       | 사용할 때                                  |
| ---------- | ------------------------------------------ |
| `basic`    | 단순한 페이지입니다. 먼저 이것을 시도하세요. |
| `advanced` | JS로 렌더링된 SPA, 동적 콘텐츠, 테이블.     |

<Tip>
더 큰 URL 목록은 여러 `tavily_extract` 호출로 나누어 처리하세요(요청당 최대 20개). 전체 페이지 대신 관련 콘텐츠만 얻으려면 `query`와 `chunks_per_source`를 함께 사용하세요.
</Tip>

## 올바른 도구 선택

| 필요 사항                              | 도구             |
| -------------------------------------- | ---------------- |
| 빠른 웹 검색, 특별한 옵션 없음         | `web_search`     |
| 깊이, 주제, AI 답변을 포함한 검색      | `tavily_search`  |
| 특정 URL에서 콘텐츠 추출               | `tavily_extract` |

<Note>
Tavily를 제공자로 사용하는 범용 `web_search` 도구는 `query`와 `count`(최대 20개 결과)를 지원합니다. Tavily 전용 제어(`search_depth`, `topic`, `include_answer`, 도메인 필터, 시간 범위)가 필요하면 대신 `tavily_search`를 사용하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="API 키 확인 순서">
    Tavily 클라이언트는 다음 순서로 API 키를 조회합니다.

    1. `plugins.entries.tavily.config.webSearch.apiKey`(SecretRefs를 통해 확인됨).
    2. Gateway 환경의 `TAVILY_API_KEY`.

    둘 다 없으면 `tavily_extract`는 설정 오류를 발생시킵니다.

  </Accordion>

  <Accordion title="사용자 지정 기본 URL">
    프록시를 통해 Tavily를 연결하는 경우 `plugins.entries.tavily.config.webSearch.baseUrl`을 재정의합니다. 기본값은 `https://api.tavily.com`입니다.
  </Accordion>

  <Accordion title="`chunks_per_source`에는 `query`가 필요함">
    `tavily_extract`는 `query` 없이 `chunks_per_source`를 전달하는 호출을 거부합니다. Tavily는 쿼리 관련성을 기준으로 청크의 순위를 매기므로, 쿼리가 없으면 이 매개변수는 의미가 없습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="웹 검색 개요" href="/ko/tools/web" icon="magnifying-glass">
    모든 제공자와 자동 감지 규칙.
  </Card>
  <Card title="Firecrawl" href="/ko/tools/firecrawl" icon="fire">
    콘텐츠 추출을 포함한 검색 및 스크래핑.
  </Card>
  <Card title="Exa Search" href="/ko/tools/exa-search" icon="binoculars">
    콘텐츠 추출을 포함한 신경망 검색.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    Plugin 항목 및 도구 라우팅을 위한 전체 config 스키마.
  </Card>
</CardGroup>
