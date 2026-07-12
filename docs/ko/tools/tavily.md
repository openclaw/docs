---
read_when:
    - Tavily 기반 웹 검색을 사용하려는 경우
    - Tavily API 키가 필요합니다
    - Tavily를 web_search 제공자로 사용하려는 경우
    - URL에서 콘텐츠를 추출하려는 경우
summary: Tavily 검색 및 추출 도구
title: Tavily
x-i18n:
    generated_at: "2026-07-12T01:17:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com)는 AI 애플리케이션용으로 설계된 검색 API입니다. OpenClaw는 이를 두 가지 방식으로 제공합니다.

- 범용 검색 도구의 `web_search` 제공자로 사용
- 명시적인 Plugin 도구인 `tavily_search` 및 `tavily_extract`로 사용

Tavily는 LLM이 사용하기에 최적화된 구조화된 결과를 반환하며, 검색 깊이 설정, 주제 필터링, 도메인 필터, AI 생성 답변 요약, URL 콘텐츠 추출(JavaScript로 렌더링되는 페이지 포함)을 지원합니다.

| 속성      | 값                                                                                            |
| --------- | --------------------------------------------------------------------------------------------- |
| Plugin ID | `tavily`                                                                                      |
| 패키지    | `@openclaw/tavily-plugin`                                                                     |
| 인증      | `TAVILY_API_KEY` 환경 변수 또는 `apiKey` 구성                                                 |
| 기본 URL  | `https://api.tavily.com`(기본값), 재정의하려면 `TAVILY_BASE_URL` 환경 변수 또는 `baseUrl` 구성 |
| 시간 제한 | 검색 30초, 추출 60초(기본값)                                                                  |
| 도구      | `tavily_search`, `tavily_extract`                                                             |

## 시작하기

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="API 키 발급">
    [tavily.com](https://tavily.com)에서 Tavily 계정을 만든 다음 대시보드에서 API 키를 생성합니다.
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
                apiKey: "tvly-...", // TAVILY_API_KEY가 설정된 경우 선택 사항
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
    에이전트에서 `web_search`를 실행하거나 `tavily_search`를 직접 호출합니다.
  </Step>
</Steps>

<Tip>
온보딩 또는 `openclaw configure --section web`에서 Tavily를 선택하면 필요할 때 공식 Tavily Plugin을 설치하고 활성화합니다.
</Tip>

## 도구 레퍼런스

### `tavily_search`

범용 `web_search` 대신 Tavily 전용 검색 제어 옵션이 필요할 때 사용합니다.

| 매개변수          | 유형        | 제약 조건 / 기본값                      | 설명                                      |
| ----------------- | ----------- | --------------------------------------- | ----------------------------------------- |
| `query`           | 문자열      | 필수                                    | 검색 쿼리 문자열입니다.                   |
| `search_depth`    | 열거형      | `basic`(기본값), `advanced`             | `advanced`는 느리지만 관련성이 높습니다.  |
| `topic`           | 열거형      | `general`(기본값), `news`, `finance`    | 주제 계열로 필터링합니다.                 |
| `max_results`     | 정수        | 1~20, 기본값 `5`                        | 결과 수입니다.                            |
| `include_answer`  | 불리언      | 기본값 `false`                          | Tavily의 AI 생성 답변 요약을 포함합니다.  |
| `time_range`      | 열거형      | `day`, `week`, `month`, `year`          | 최신성에 따라 결과를 필터링합니다.        |
| `include_domains` | 문자열 배열 | (없음)                                  | 지정한 도메인의 결과만 포함합니다.        |
| `exclude_domains` | 문자열 배열 | (없음)                                  | 지정한 도메인의 결과를 제외합니다.        |

검색 깊이에 따른 장단점:

| 깊이       | 속도 | 관련성 | 적합한 용도                         |
| ---------- | ---- | ------ | ----------------------------------- |
| `basic`    | 빠름 | 높음   | 범용 쿼리(기본값)                   |
| `advanced` | 느림 | 최고   | 정밀한 조사 및 사실 확인            |

### `tavily_extract`

하나 이상의 URL에서 정제된 콘텐츠를 추출할 때 사용합니다. JavaScript로 렌더링되는 페이지를 처리하며, 원하는 콘텐츠만 추출하도록 쿼리 중심 청킹을 지원합니다.

| 매개변수            | 유형        | 제약 조건 / 기본값              | 설명                                                        |
| ------------------- | ----------- | ------------------------------- | ----------------------------------------------------------- |
| `urls`              | 문자열 배열 | 필수, 1~20                      | 콘텐츠를 추출할 URL입니다.                                  |
| `query`             | 문자열      | (선택 사항)                     | 이 쿼리와의 관련성에 따라 추출된 청크의 순위를 재조정합니다. |
| `extract_depth`     | 열거형      | `basic`(기본값), `advanced`     | JS 비중이 높은 페이지, SPA 또는 동적 표에는 `advanced`를 사용합니다. |
| `chunks_per_source` | 정수        | 1~5, **`query` 필요**           | URL당 반환되는 청크 수입니다. `query` 없이 설정하면 오류가 발생합니다. |
| `include_images`    | 불리언      | 기본값 `false`                  | 결과에 이미지 URL을 포함합니다.                             |

추출 깊이에 따른 장단점:

| 깊이       | 사용 시점                                  |
| ---------- | ------------------------------------------ |
| `basic`    | 단순한 페이지. 먼저 이 옵션을 사용하세요. |
| `advanced` | JS로 렌더링되는 SPA, 동적 콘텐츠, 표       |

<Tip>
URL 목록이 많으면 여러 번의 `tavily_extract` 호출로 나누세요(요청당 최대 20개). 전체 페이지 대신 관련 콘텐츠만 가져오려면 `query`와 `chunks_per_source`를 함께 사용하세요.
</Tip>

## 적합한 도구 선택

| 요구 사항                              | 도구               |
| -------------------------------------- | ------------------ |
| 특수 옵션이 없는 빠른 웹 검색          | `web_search`       |
| 깊이, 주제, AI 답변을 지정한 검색      | `tavily_search`    |
| 특정 URL에서 콘텐츠 추출               | `tavily_extract`   |

<Note>
Tavily를 제공자로 사용하는 범용 `web_search` 도구는 `query`와 `count`를 지원합니다(최대 20개 결과). Tavily 전용 제어 옵션(`search_depth`, `topic`, `include_answer`, 도메인 필터, 기간)이 필요하면 대신 `tavily_search`를 사용하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="API 키 확인 순서">
    Tavily 클라이언트는 다음 순서로 API 키를 찾습니다.

    1. `plugins.entries.tavily.config.webSearch.apiKey`(SecretRefs를 통해 확인)
    2. Gateway 환경의 `TAVILY_API_KEY`

    둘 다 없으면 `tavily_search`와 `tavily_extract` 모두 설정 오류를 발생시킵니다.

  </Accordion>

  <Accordion title="사용자 지정 기본 URL">
    프록시를 통해 Tavily를 사용하는 경우 `plugins.entries.tavily.config.webSearch.baseUrl`을 재정의하거나 `TAVILY_BASE_URL`을 설정합니다. 구성 값이 환경 변수보다 우선합니다. 기본값은 `https://api.tavily.com`입니다.
  </Accordion>

  <Accordion title="`chunks_per_source`에는 `query` 필요">
    `tavily_extract`는 `query` 없이 `chunks_per_source`를 전달하는 호출을 거부합니다. Tavily는 쿼리 관련성에 따라 청크의 순위를 지정하므로 쿼리가 없으면 이 매개변수는 의미가 없습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="웹 검색 개요" href="/ko/tools/web" icon="magnifying-glass">
    모든 제공자 및 자동 감지 규칙입니다.
  </Card>
  <Card title="Firecrawl" href="/ko/tools/firecrawl" icon="fire">
    콘텐츠 추출을 포함한 검색 및 스크래핑입니다.
  </Card>
  <Card title="Exa 검색" href="/ko/tools/exa-search" icon="binoculars">
    콘텐츠 추출을 포함한 신경망 검색입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    Plugin 항목 및 도구 라우팅을 위한 전체 구성 스키마입니다.
  </Card>
</CardGroup>
