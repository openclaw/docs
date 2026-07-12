---
read_when:
    - web_search에 Kimi를 사용하려고 합니다
    - KIMI_API_KEY 또는 MOONSHOT_API_KEY가 필요합니다.
summary: Moonshot 웹 검색을 통한 Kimi 웹 검색
title: Kimi 검색
x-i18n:
    generated_at: "2026-07-12T15:50:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi는 Moonshot의 네이티브 웹 검색을 기반으로 하는 `web_search` 제공자입니다. Moonshot은
순위가 지정된 결과 목록을 반환하는 대신 Gemini 및 Grok의
근거 기반 응답 제공자와 유사하게 인라인 인용이 포함된 하나의 답변을 종합합니다.

## 설정

<Steps>
  <Step title="키 생성">
    [Moonshot AI](https://platform.moonshot.cn/)에서 API 키를 발급받으십시오.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`를 설정하거나(Gateway
    설치의 경우 `~/.openclaw/.env`에 추가), 다음 명령으로 구성하십시오.

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` 또는 `openclaw configure --section web` 실행 중 **Kimi**를 선택하면
다음 항목도 입력하라는 메시지가 표시됩니다.

- Moonshot API 리전: `https://api.moonshot.ai/v1` 또는 `https://api.moonshot.cn/v1`
- 웹 검색 모델(기본값: `kimi-k2.6`)

## 구성

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // KIMI_API_KEY 또는 MOONSHOT_API_KEY가 설정된 경우 선택 사항
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

`tools.web.search.provider`를 생략하면 사용 가능한 API 키에서 자동으로 감지됩니다.
검색 자격 증명을 여러 개 구성한 경우에는 `kimi`로 명시적으로 설정하십시오.

`tools.web.search.kimi` 아래에 범위를 지정하는 동등한 형식(`apiKey`, `baseUrl`, `model`)도
사용할 수 있으며, 두 형식은 동일하게 해석된 구성으로 병합됩니다.

기본값: `baseUrl`을 생략하면 기본값은 `https://api.moonshot.ai/v1`이고, `model`의
기본값은 `kimi-k2.6`입니다.

채팅 트래픽이 중국 호스트(`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`)를 사용하는 경우, Kimi `web_search`는 자체 `baseUrl`이 설정되지
않았을 때 해당 호스트를 자동으로 재사용합니다. 따라서 `.cn` 키가 실수로 국제
엔드포인트에 요청을 보내지 않습니다(해당 키로 요청하면 HTTP 401이 반환됩니다). 이 상속을 재정의하려면
Kimi `baseUrl`을 명시적으로 설정하십시오.

## 근거 요건

OpenClaw는 Moonshot의 응답에 `$web_search` 도구 호출
재현, `search_results` 또는 인용 URL과 같은 네이티브 웹 검색 근거 증거가 포함된 후에만 Kimi `web_search` 결과를
반환합니다. Kimi가 근거 없이 직접 답변하는 경우
(예: "인터넷을 탐색할 수 없습니다") OpenClaw는 해당 텍스트를 검색
결과로 처리하지 않고 `kimi_web_search_ungrounded` 오류를 반환합니다.
쿼리를 다시 시도하거나, Brave와 같은 구조화된 제공자로 전환하거나,
대상 URL이 이미 있는 경우 `web_fetch` / 브라우저 도구를 사용하십시오.

## 도구 매개변수

| 매개변수                                                        | 지원 여부                                                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | 예                                                                                                                             |
| `count`                                                         | 제공자 간 호환성을 위해 허용되지만 무시됩니다. Kimi는 N개 결과 목록이 아니라 항상 종합된 하나의 답변을 반환합니다.              |
| `country`, `language`, `freshness`, `date_after`, `date_before` | 아니요                                                                                                                         |

## 관련 문서

- [웹 검색 개요](/ko/tools/web) - 모든 제공자 및 자동 감지
- [Moonshot AI](/ko/providers/moonshot) - Moonshot 모델 + Kimi Coding 제공자 문서
- [Gemini 검색](/ko/tools/gemini-search) - Google 근거를 통한 AI 종합 답변
- [Grok 검색](/ko/tools/grok-search) - xAI 근거를 통한 AI 종합 답변
