---
read_when:
    - 웹 검색 프로바이더로 Perplexity를 구성하려고 합니다
    - Perplexity API 키 또는 OpenRouter 프록시 설정이 필요합니다
summary: Perplexity 웹 검색 프로바이더 설정(API 키, 검색 모드, 필터링)
title: Perplexity
x-i18n:
    generated_at: "2026-04-12T23:32:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55c089e96601ebe05480d305364272c7f0ac721caa79746297c73002a9f20f55
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (웹 검색 프로바이더)

Perplexity Plugin은 Perplexity
Search API 또는 OpenRouter를 통한 Perplexity Sonar를 통해 웹 검색 기능을 제공합니다.

<Note>
이 페이지는 Perplexity **프로바이더** 설정을 다룹니다. Perplexity
**도구**(에이전트가 이를 사용하는 방법)는 [Perplexity tool](/ko/tools/perplexity-search)을 참고하세요.
</Note>

| 속성        | 값                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 유형        | 웹 검색 프로바이더(모델 프로바이더 아님)                               |
| 인증        | `PERPLEXITY_API_KEY`(직접) 또는 `OPENROUTER_API_KEY`(OpenRouter 경유) |
| 구성 경로   | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

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
    키가 구성되면 에이전트가 웹 검색에 Perplexity를 자동으로 사용합니다.
    추가 단계는 필요하지 않습니다.
  </Step>
</Steps>

## 검색 모드

이 Plugin은 API 키 접두사를 기준으로 전송 방식을 자동 선택합니다:

<Tabs>
  <Tab title="기본 Perplexity API (pplx-)">
    키가 `pplx-`로 시작하면 OpenClaw는 기본 Perplexity Search
    API를 사용합니다. 이 전송 방식은 구조화된 결과를 반환하며 도메인, 언어,
    날짜 필터를 지원합니다(아래 필터링 옵션 참고).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    키가 `sk-or-`로 시작하면 OpenClaw는
    Perplexity Sonar 모델을 사용해 OpenRouter를 통해 라우팅합니다. 이 전송 방식은
    인용이 포함된 AI 합성 답변을 반환합니다.
  </Tab>
</Tabs>

| 키 접두사 | 전송 방식                     | 기능                                             |
| --------- | ----------------------------- | ------------------------------------------------ |
| `pplx-`   | 기본 Perplexity Search API    | 구조화된 결과, 도메인/언어/날짜 필터            |
| `sk-or-`  | OpenRouter (Sonar)            | 인용이 포함된 AI 합성 답변                       |

## 기본 API 필터링

<Note>
필터링 옵션은 기본 Perplexity API
(`pplx-` 키)를 사용할 때만 사용할 수 있습니다. OpenRouter/Sonar 검색은 이러한 매개변수를 지원하지 않습니다.
</Note>

기본 Perplexity API를 사용할 때 검색은 다음 필터를 지원합니다:

| 필터          | 설명                                      | 예시                                |
| -------------- | ----------------------------------------- | ----------------------------------- |
| 국가           | 2자리 국가 코드                           | `us`, `de`, `jp`                    |
| 언어           | ISO 639-1 언어 코드                       | `en`, `fr`, `zh`                    |
| 날짜 범위      | 최신성 범위                               | `day`, `week`, `month`, `year`      |
| 도메인 필터    | 허용 목록 또는 거부 목록(최대 20개 도메인) | `example.com`                       |
| 콘텐츠 예산    | 응답당 / 페이지당 토큰 제한                | `max_tokens`, `max_tokens_per_page` |

## 고급 참고사항

<AccordionGroup>
  <Accordion title="데몬 프로세스용 환경 변수">
    OpenClaw Gateway가 데몬(`launchd/systemd`)으로 실행되는 경우
    `PERPLEXITY_API_KEY`를 해당 프로세스에서 사용할 수 있어야 합니다.

    <Warning>
    `~/.profile`에만 설정된 키는 해당 환경을 명시적으로 가져오지 않는 한
    `launchd/systemd`
    데몬에서 보이지 않습니다. Gateway 프로세스가 이를
    읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하세요.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter 프록시 설정">
    Perplexity 검색을 OpenRouter를 통해 라우팅하려면
    기본 Perplexity 키 대신 `OPENROUTER_API_KEY`(접두사 `sk-or-`)를 설정하세요.
    OpenClaw는 접두사를 감지하고 자동으로 Sonar 전송 방식으로
    전환합니다.

    <Tip>
    OpenRouter 전송 방식은 이미 OpenRouter 계정을 가지고 있고
    여러 프로바이더에 걸쳐 통합 청구를 원할 때 유용합니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="Perplexity 검색 도구" href="/ko/tools/perplexity-search" icon="magnifying-glass">
    에이전트가 Perplexity 검색을 호출하고 결과를 해석하는 방법.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    Plugin 항목을 포함한 전체 구성 참조.
  </Card>
</CardGroup>
