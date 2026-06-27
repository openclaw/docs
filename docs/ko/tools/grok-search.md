---
read_when:
    - web_search에 Grok을 사용하려는 경우
    - 웹 검색에 xAI OAuth 또는 XAI_API_KEY를 사용하려는 경우
summary: xAI 웹 근거 응답을 통한 Grok 웹 검색
title: Grok 검색
x-i18n:
    generated_at: "2026-06-27T18:14:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw은 실시간 검색 결과와 인용으로 뒷받침되는 AI 합성 답변을 생성하기 위해 xAI의 웹 기반 응답을 사용하여 Grok을 `web_search` 공급자로 지원합니다.

Grok 웹 검색은 사용 가능한 경우 기존 xAI OAuth 로그인을 우선 사용합니다.
OAuth 프로필이 없으면 동일한 xAI API 키로 X(이전 Twitter) 게시물 검색을 위한 내장 `x_search` 도구와 `code_execution` 도구도 사용할 수 있습니다. 키를 `plugins.entries.xai.config.webSearch.apiKey` 아래에 저장하면 OpenClaw은 번들 xAI 모델 공급자의 대체 키로도 이를 재사용합니다.

리포스트, 답글, 북마크, 조회수 같은 게시물 수준의 X 지표에는 광범위한 검색 쿼리 대신 정확한 게시물 URL 또는 상태 ID와 함께 `x_search`를 사용하는 것이 좋습니다.

## 온보딩 및 구성

다음 중 **Grok**을 선택하면:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw은 별도의 웹 검색 키를 요청하지 않고 기존 xAI OAuth 프로필을 사용할 수 있습니다. OAuth를 사용할 수 없으면 xAI API 키 설정으로 대체합니다.
OpenClaw은 동일한 xAI 자격 증명으로 `x_search`를 활성화하는 별도의 후속 단계도 표시할 수 있습니다. 해당 후속 단계는 다음과 같습니다.

- `web_search`에 Grok을 선택한 후에만 나타납니다
- 별도의 최상위 웹 검색 공급자 선택지가 아닙니다
- 동일한 흐름에서 선택적으로 `x_search` 모델을 설정할 수 있습니다

건너뛰면 나중에 구성에서 `x_search`를 활성화하거나 변경할 수 있습니다.

## 로그인 또는 API 키 받기

<Steps>
  <Step title="xAI OAuth 사용">
    온보딩 또는 모델 인증 중에 이미 xAI로 로그인했다면
    Grok을 `web_search` 공급자로 선택하세요. 별도의 API 키는 필요하지 않습니다.

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API 키 대체 사용">
    OAuth를 사용할 수 없거나 의도적으로 키 기반 웹 검색 구성을 원하는 경우 [xAI](https://console.x.ai/)에서 API 키를 받으세요.
  </Step>
  <Step title="키 저장">
    Gateway 환경에서 `XAI_API_KEY`를 설정하거나 다음을 통해 구성하세요.

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // xAI OAuth 또는 XAI_API_KEY를 사용할 수 있으면 선택 사항
            baseUrl: "https://api.x.ai/v1", // 선택적 Responses API 프록시/기본 URL 재정의
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

**자격 증명 대안:** `openclaw models auth login
--provider xai --method oauth`로 로그인하거나, Gateway 환경에서 `XAI_API_KEY`를 설정하거나, `plugins.entries.xai.config.webSearch.apiKey`를 저장하세요. 게이트웨이 설치에서는 환경 변수를 `~/.openclaw/.env`에 넣으세요.

## 작동 방식

Grok은 Gemini의 Google Search grounding 접근 방식과 유사하게 xAI 웹 기반 응답을 사용하여 인라인 인용이 포함된 답변을 합성합니다.

## 지원되는 매개변수

Grok 검색은 `query`를 지원합니다.

`count`는 공유 `web_search` 호환성을 위해 허용되지만, Grok은 여전히 N개 결과 목록이 아니라 인용이 포함된 하나의 합성 답변을 반환합니다.

공급자별 필터는 현재 지원되지 않습니다.

Grok은 xAI Responses 웹 기반 검색이 공유 `web_search` 기본값보다 더 오래 실행될 수 있기 때문에 공급자별 60초 기본 제한 시간을 사용합니다. 이를 재정의하려면 `tools.web.search.timeoutSeconds`를 설정하세요.

## 기본 URL 재정의

Grok 웹 검색이 운영자 프록시 또는 xAI 호환 Responses 엔드포인트를 통해 라우팅되어야 하는 경우 `plugins.entries.xai.config.webSearch.baseUrl`을 설정하세요. OpenClaw은 뒤쪽 슬래시를 제거한 후 `<baseUrl>/responses`에 게시합니다. `plugins.entries.xai.config.xSearch.baseUrl`이 설정되어 있지 않으면 `x_search`는 동일한 `webSearch.baseUrl` 대체값을 사용합니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 공급자 및 자동 감지
- [Web Search의 x_search](/ko/tools/web#x_search) -- xAI를 통한 일급 X 검색
- [Gemini Search](/ko/tools/gemini-search) -- Google grounding을 통한 AI 합성 답변
