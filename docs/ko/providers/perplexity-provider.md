---
read_when:
    - Perplexity를 웹 검색 provider로 구성하려고 합니다
    - Perplexity API 키 또는 OpenRouter proxy 설정이 필요합니다
summary: Perplexity 웹 검색 provider 설정(API 키, 검색 모드, 필터링)
title: Perplexity
x-i18n:
    generated_at: "2026-04-25T06:09:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Perplexity Plugin은 Perplexity
Search API 또는 OpenRouter를 통한 Perplexity Sonar로 웹 검색 capability를 제공합니다.

<Note>
이 페이지는 Perplexity **provider** 설정을 다룹니다. Perplexity
**도구**(에이전트가 이를 사용하는 방식)는 [Perplexity tool](/ko/tools/perplexity-search)을 참고하세요.
</Note>

| 속성         | 값                                                                     |
| ------------ | ---------------------------------------------------------------------- |
| 유형         | 웹 검색 provider (model provider가 아님)                              |
| 인증         | `PERPLEXITY_API_KEY` (직접) 또는 `OPENROUTER_API_KEY` (OpenRouter 경유) |
| config 경로  | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    대화형 웹 검색 구성 흐름을 실행하세요:

    ```bash
    openclaw configure --section web
    ```

    또는 키를 직접 설정하세요:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="검색 시작">
    키가 구성되면 에이전트가 자동으로 Perplexity를 웹 검색에 사용합니다.
    추가 단계는 필요하지 않습니다.
  </Step>
</Steps>

## 검색 모드

Plugin은 API 키 접두사에 따라 전송 방식을 자동 선택합니다:

<Tabs>
  <Tab title="네이티브 Perplexity API (pplx-)">
    키가 `pplx-`로 시작하면 OpenClaw는 네이티브 Perplexity Search
    API를 사용합니다. 이 전송 방식은 구조화된 결과를 반환하며 도메인, 언어,
    날짜 필터를 지원합니다(아래 필터링 옵션 참고).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    키가 `sk-or-`로 시작하면 OpenClaw는 OpenRouter를 통해
    Perplexity Sonar 모델을 사용하여 라우팅합니다. 이 전송 방식은
    인용이 포함된 AI 합성 응답을 반환합니다.
  </Tab>
</Tabs>

| 키 접두사    | 전송 방식                     | 기능                                             |
| ------------ | ----------------------------- | ------------------------------------------------ |
| `pplx-`      | 네이티브 Perplexity Search API | 구조화된 결과, 도메인/언어/날짜 필터            |
| `sk-or-`     | OpenRouter (Sonar)            | 인용이 포함된 AI 합성 응답                      |

## 네이티브 API 필터링

<Note>
필터링 옵션은 네이티브 Perplexity API
(`pplx-` 키)를 사용할 때만 사용할 수 있습니다. OpenRouter/Sonar 검색은 이 매개변수를 지원하지 않습니다.
</Note>

네이티브 Perplexity API를 사용할 때 검색은 다음 필터를 지원합니다:

| 필터            | 설명                                   | 예시                                |
| --------------- | -------------------------------------- | ----------------------------------- |
| 국가            | 2자리 국가 코드                        | `us`, `de`, `jp`                    |
| 언어            | ISO 639-1 언어 코드                    | `en`, `fr`, `zh`                    |
| 날짜 범위       | 최신성 창                              | `day`, `week`, `month`, `year`      |
| 도메인 필터     | allowlist 또는 denylist (최대 20개 도메인) | `example.com`                    |
| 콘텐츠 예산     | 응답당 / 페이지당 토큰 제한            | `max_tokens`, `max_tokens_per_page` |

## 고급 구성

<AccordionGroup>
  <Accordion title="daemon 프로세스용 환경 변수">
    OpenClaw Gateway가 daemon(launchd/systemd)으로 실행 중이라면,
    `PERPLEXITY_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다.

    <Warning>
    키를 `~/.profile`에만 설정하면, 해당 환경을 명시적으로 가져오지 않는 한
    launchd/systemd daemon에서는 보이지 않습니다. gateway 프로세스가
    읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하세요.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy 설정">
    Perplexity 검색을 OpenRouter를 통해 라우팅하고 싶다면,
    네이티브 Perplexity 키 대신 `OPENROUTER_API_KEY`
    (접두사 `sk-or-`)를 설정하세요.
    OpenClaw는 접두사를 감지하고 자동으로 Sonar 전송으로 전환합니다.

    <Tip>
    OpenRouter 전송은 이미 OpenRouter 계정을 사용 중이고,
    여러 provider에 대한 통합 청구를 원할 때 유용합니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Perplexity 검색 도구" href="/ko/tools/perplexity-search" icon="magnifying-glass">
    에이전트가 Perplexity 검색을 호출하고 결과를 해석하는 방법.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    Plugin 항목을 포함한 전체 구성 참조.
  </Card>
</CardGroup>
