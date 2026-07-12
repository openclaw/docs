---
read_when:
    - Perplexity를 웹 검색 제공자로 구성하려고 합니다
    - Perplexity API 키 또는 OpenRouter 프록시 설정이 필요합니다.
summary: Perplexity 웹 검색 제공자 설정(API 키, 검색 모드, 필터링)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T15:41:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin은 두 가지 전송 방식을 사용하는 `web_search` 제공자를 등록합니다. 하나는 필터가 포함된 구조화된 결과를 제공하는 네이티브 Perplexity Search API이고, 다른 하나는 직접 또는 OpenRouter를 통해 인용이 포함된 AI 종합 답변을 제공하는 Perplexity Sonar 채팅 완성입니다.

<Note>
이 페이지에서는 Perplexity **제공자** 설정을 설명합니다. Perplexity **도구**(에이전트가 이를 사용하는 방법)에 대해서는 [Perplexity 검색](/ko/tools/perplexity-search)을 참조하십시오.
</Note>

| 속성        | 값                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 유형        | 웹 검색 제공자(모델 제공자가 아님)                                    |
| 인증        | `PERPLEXITY_API_KEY`(네이티브) 또는 `OPENROUTER_API_KEY`(OpenRouter 경유) |
| 구성 경로   | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| 재정의      | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| 키 받기     | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## Plugin 설치

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    openclaw configure --section web
    ```

    또는 키를 직접 설정하십시오.

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Gateway 환경에서 `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`로 내보낸 키도 사용할 수 있습니다.

  </Step>
  <Step title="검색 시작">
    해당 키가 사용 가능한 검색 자격 증명이 되면 `web_search`가 Perplexity를 자동으로 감지하므로 추가 설정이 필요하지 않습니다. 제공자를 명시적으로 고정하려면 다음을 실행하십시오.

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## 검색 모드

Plugin은 다음 순서로 전송 방식을 결정합니다.

1. `webSearch.baseUrl` 또는 `webSearch.model`이 설정된 경우: 키 유형과 관계없이 항상 해당 엔드포인트를 사용하는 Sonar 채팅 완성을 통해 라우팅합니다.
2. 그렇지 않으면 키 소스가 엔드포인트를 결정합니다. 구성된 키는 접두사에 따라 전송 방식을 선택하며(구성이 환경 변수보다 우선함), 환경 키는 일치하는 엔드포인트를 직접 사용합니다.

| 키 접두사 | 전송 방식                                                  | 기능                                             |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`    | 네이티브 Perplexity Search API(`https://api.perplexity.ai`) | 구조화된 결과, 도메인/언어/날짜 필터             |
| `sk-or-`   | OpenRouter(`https://openrouter.ai/api/v1`), Sonar 모델      | 인용이 포함된 AI 종합 답변                       |

다른 접두사를 사용하는 구성된 키도 네이티브 Search API를 사용합니다. 채팅 완성 경로의 기본 모델은 `perplexity/sonar-pro`입니다. `plugins.entries.perplexity.config.webSearch.model`을 사용하여 재정의할 수 있습니다.

## 네이티브 API 필터링

| 필터                                 | 설명                                                            | 전송 방식       |
| ------------------------------------ | --------------------------------------------------------------- | --------------- |
| `count`                              | 검색당 결과 수, 1-10(기본값 5)                                 | 네이티브 전용   |
| `freshness`                          | 최신성 기간: `day`, `week`, `month`, `year`                    | 둘 다           |
| `country`                            | 2자리 국가 코드(`us`, `de`, `jp`)                              | 네이티브 전용   |
| `language`                           | ISO 639-1 언어 코드(`en`, `fr`, `zh`)                           | 네이티브 전용   |
| `date_after` / `date_before`         | `YYYY-MM-DD` 형식의 게시 날짜 범위                              | 네이티브 전용   |
| `domain_filter`                      | 최대 20개 도메인, 허용 목록 또는 `-` 접두사 차단 목록이며 혼용 불가 | 네이티브 전용 |
| `max_tokens` / `max_tokens_per_page` | 모든 결과 전체/페이지당 콘텐츠 예산                            | 네이티브 전용   |

채팅 완성 경로에서 네이티브 전용 필터를 사용하면 설명이 포함된 오류가 반환됩니다. `freshness`는 `date_after`/`date_before`와 함께 사용할 수 없습니다.

## 고급 구성

<AccordionGroup>
  <Accordion title="데몬 프로세스용 환경 변수">
    <Warning>
    대화형 셸에서만 내보낸 키는 해당 환경을 명시적으로 가져오지 않는 한 launchd/systemd Gateway 데몬에서 볼 수 없습니다. Gateway 프로세스가 키를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하십시오. 전체 우선순위는 [환경 변수](/ko/help/environment)를 참조하십시오.
    </Warning>
  </Accordion>

  <Accordion title="OpenRouter 프록시 설정">
    Perplexity 검색을 OpenRouter를 통해 라우팅하려면 네이티브 Perplexity 키 대신 `OPENROUTER_API_KEY`(접두사 `sk-or-`)를 설정하십시오. OpenClaw는 키를 감지하고 Sonar 전송 방식으로 자동 전환합니다. 이미 OpenRouter 결제를 설정했으며 제공자를 한곳으로 통합하려는 경우 유용합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Perplexity 검색 도구" href="/ko/tools/perplexity-search" icon="magnifying-glass">
    에이전트가 Perplexity 검색을 호출하고 결과를 해석하는 방법입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    Plugin 항목을 포함한 전체 구성 참조입니다.
  </Card>
</CardGroup>
