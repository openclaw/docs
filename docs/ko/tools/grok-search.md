---
read_when:
    - web_search에 Grok을 사용하려고 합니다
    - 웹 검색을 위해 XAI_API_KEY가 필요합니다
summary: xAI의 웹에 근거한 응답을 통한 Grok 웹 검색
title: Grok 검색
x-i18n:
    generated_at: "2026-05-02T21:15:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw는 Grok를 `web_search` 제공자로 지원하며, xAI 웹 기반
응답을 사용해 실시간 검색 결과와 인용으로 뒷받침되는 AI 합성 답변을
생성합니다.

동일한 `XAI_API_KEY`는 X(이전 Twitter) 게시물 검색용 내장 `x_search`
도구에도 사용할 수 있습니다. 키를
`plugins.entries.xai.config.webSearch.apiKey` 아래에 저장하면, OpenClaw는
이제 번들 xAI 모델 제공자의 대체 키로도 이를 재사용합니다.

재게시, 답글, 북마크, 조회수 같은 게시물 수준의 X 지표에는 광범위한
검색 쿼리 대신 정확한 게시물 URL 또는 상태 ID와 함께 `x_search`를
사용하는 것이 좋습니다.

## 온보딩 및 구성

다음 중에 **Grok**를 선택하면:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw는 동일한 `XAI_API_KEY`로 `x_search`를 활성화하는 별도의 후속
단계를 표시할 수 있습니다. 이 후속 단계는:

- `web_search`에 Grok를 선택한 뒤에만 나타납니다
- 별도의 최상위 웹 검색 제공자 선택지가 아닙니다
- 같은 흐름에서 선택적으로 `x_search` 모델을 설정할 수 있습니다

건너뛰면 나중에 config에서 `x_search`를 활성화하거나 변경할 수 있습니다.

## API 키 가져오기

<Steps>
  <Step title="키 만들기">
    [xAI](https://console.x.ai/)에서 API 키를 가져옵니다.
  </Step>
  <Step title="키 저장하기">
    Gateway 환경에서 `XAI_API_KEY`를 설정하거나, 다음으로 구성합니다.

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Config

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**환경 대안:** Gateway 환경에서 `XAI_API_KEY`를 설정합니다.
Gateway 설치의 경우 `~/.openclaw/.env`에 넣습니다.

## 작동 방식

Grok는 xAI 웹 기반 응답을 사용해 인라인 인용이 포함된 답변을
합성하며, Gemini의 Google Search 그라운딩 방식과 유사합니다.

## 지원되는 매개변수

Grok 검색은 `query`를 지원합니다.

`count`는 공유 `web_search` 호환성을 위해 허용되지만, Grok는 여전히
N개 결과 목록이 아니라 인용이 포함된 하나의 합성 답변을 반환합니다.

제공자별 필터는 현재 지원되지 않습니다.

Grok는 xAI Responses 웹 기반 검색이 공유 `web_search` 기본값보다 더
오래 실행될 수 있기 때문에 제공자별 60초 기본 타임아웃을 사용합니다.
이를 재정의하려면 `tools.web.search.timeoutSeconds`를 설정합니다.

## Base URL 재정의

Grok 웹 검색을 운영자 프록시 또는 xAI 호환 Responses 엔드포인트를 통해
라우팅해야 할 때 `plugins.entries.xai.config.webSearch.baseUrl`을
설정합니다. OpenClaw는 끝의 슬래시를 제거한 뒤 `<baseUrl>/responses`에
게시합니다. `plugins.entries.xai.config.xSearch.baseUrl`이 설정되지 않은
경우 `x_search`도 동일한 `webSearch.baseUrl` 대체값을 사용합니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [웹 검색의 x_search](/ko/tools/web#x_search) -- xAI를 통한 일급 X 검색
- [Gemini Search](/ko/tools/gemini-search) -- Google 그라운딩을 통한 AI 합성 답변
