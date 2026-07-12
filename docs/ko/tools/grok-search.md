---
read_when:
    - web_search에 Grok을 사용하려고 합니다
    - 웹 검색에 xAI OAuth 또는 XAI_API_KEY를 사용하려는 경우
summary: xAI 웹 기반 응답을 통한 Grok 웹 검색
title: Grok 검색
x-i18n:
    generated_at: "2026-07-12T01:20:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw은 Grok을 `web_search` 제공자로 지원하며, xAI의 웹 기반 응답을 사용하여 실시간 검색 결과와 인용을 근거로 AI가 종합한 답변을 생성합니다.

Grok 웹 검색은 기존 xAI OAuth 로그인이 있으면 이를 우선 사용합니다. OAuth 프로필이 없으면 동일한 xAI API 키로 X(이전 Twitter) 게시물 검색용 내장 `x_search` 도구와 `code_execution` 도구도 사용할 수 있습니다. 키를 `plugins.entries.xai.config.webSearch.apiKey`에 저장하면 OpenClaw이 이를 번들 xAI 모델 제공자의 대체 수단으로도 재사용할 수 있습니다.

게시물 단위의 X 지표(재게시, 답글, 북마크, 조회수)를 확인하려면 광범위한 검색 쿼리 대신 정확한 게시물 URL 또는 상태 ID와 함께 [`x_search`](/ko/tools/web#x_search)를 사용하세요.

## 온보딩 및 구성

`openclaw onboard` 또는 `openclaw configure --section web` 실행 중 **Grok**을 선택하면 OpenClaw이 별도의 웹 검색 키를 요구하지 않고 기존 xAI OAuth 프로필을 재사용할 수 있습니다. OAuth가 없으면 xAI API 키 설정으로 대체됩니다.

그런 다음 OpenClaw은 동일한 xAI 자격 증명으로 `x_search`를 활성화하는 후속 단계를 제공합니다. 이 후속 단계는 다음과 같습니다.

- `web_search`에 Grok을 선택한 후에만 표시됩니다
- 별도의 최상위 웹 검색 제공자 선택 항목이 아닙니다
- 동일한 흐름에서 선택적으로 `x_search` 모델을 설정할 수 있습니다

나중에 구성에서 `x_search`를 활성화하거나 변경하려면 이 단계를 건너뛰세요.

## 로그인 또는 API 키 발급

<Steps>
  <Step title="xAI OAuth 사용">
    온보딩 또는 모델 인증 중 이미 xAI에 로그인했다면 `web_search` 제공자로 Grok을 선택하세요. 별도의 API 키는 필요하지 않습니다.

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API 키 대체 수단 사용">
    OAuth를 사용할 수 없거나 의도적으로 키 기반 웹 검색 구성을 사용하려면 [xAI](https://console.x.ai/)에서 API 키를 발급받으세요.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `XAI_API_KEY`를 설정하거나 다음 명령으로 구성하세요.

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

**자격 증명 대안:** `openclaw models auth login --provider xai --method oauth`, Gateway 환경의 `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey`를 사용할 수 있습니다. Gateway 설치 환경에서는 환경 변수를 `~/.openclaw/.env`에 넣으세요.

## 작동 방식

Grok은 Gemini의 Google 검색 그라운딩 방식과 유사하게 xAI의 웹 기반 응답을 사용하여 인라인 인용이 포함된 답변을 종합합니다.

## 지원되는 매개변수

Grok 검색은 `query`를 지원합니다. 공통 `web_search` 호환성을 위해 `count`를 허용하지만, Grok은 N개 결과 목록 대신 항상 인용이 포함된 하나의 종합 답변을 반환합니다. 제공자별 필터는 지원되지 않습니다.

xAI Responses의 웹 기반 검색은 공통 `web_search` 기본값보다 오래 걸릴 수 있으므로 Grok의 기본 제한 시간은 60초입니다. `tools.web.search.timeoutSeconds`로 재정의할 수 있습니다.

## 기본 URL 재정의

Grok 웹 검색을 운영자 프록시 또는 xAI 호환 Responses 엔드포인트를 통해 라우팅하려면 `plugins.entries.xai.config.webSearch.baseUrl`을 설정하세요. OpenClaw은 후행 슬래시를 제거한 후 `<baseUrl>/responses`로 POST 요청을 보냅니다. `plugins.entries.xai.config.xSearch.baseUrl`이 설정되지 않은 경우 `x_search`도 동일한 `webSearch.baseUrl`을 대체 수단으로 사용합니다.

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [웹 검색의 x_search](/ko/tools/web#x_search) -- xAI를 통한 일급 X 검색
- [Gemini 검색](/ko/tools/gemini-search) -- Google 그라운딩을 통한 AI 종합 답변
