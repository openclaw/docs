---
read_when:
    - web_search에 Ollama를 사용하려고 합니다
    - 키가 필요 없는 web_search 제공자를 원함
    - OLLAMA_API_KEY를 사용하여 호스팅된 Ollama Web Search를 이용하려는 경우
    - Ollama 웹 검색 설정 안내가 필요합니다
summary: 로컬 Ollama 호스트 또는 호스팅된 Ollama API를 통한 Ollama 웹 검색
title: Ollama 웹 검색
x-i18n:
    generated_at: "2026-07-12T01:16:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw는 번들 `web_search` 제공자로 **Ollama Web Search**를 지원하며,
Ollama의 웹 검색 API에서 제목, URL 및 요약문을 반환합니다.

로컬/자체 호스팅 Ollama는 기본적으로 API 키가 필요하지 않지만, 연결 가능한
Ollama 호스트와 `ollama signin`이 필요합니다. 로컬 Ollama 없이 호스팅 검색을 직접 사용하려면
`baseUrl: "https://ollama.com"`과 실제 `OLLAMA_API_KEY`가 필요합니다.

## 설정

<Steps>
  <Step title="Ollama 시작">
    Ollama가 설치되어 실행 중인지 확인합니다.
  </Step>
  <Step title="로그인">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Ollama Web Search 선택">
    ```bash
    openclaw configure --section web
    ```

    제공자로 **Ollama Web Search**를 선택합니다.

  </Step>
</Steps>

이미 모델에 Ollama를 사용하고 있다면 Ollama Web Search는 동일하게
구성된 호스트를 재사용합니다.

<Note>
  OpenClaw는 자격 증명이 설정된 우선순위가 더 높은 제공자보다 Ollama Web Search를
  자동으로 우선 선택하지 않습니다. 반드시
  `tools.web.search.provider: "ollama"`로 명시적으로 선택해야 합니다.
</Note>

## 구성

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

웹 검색에만 적용되는 선택적 호스트 재정의:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

또는 Ollama 모델 제공자에 이미 구성된 호스트를 재사용합니다.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl`이 표준 키입니다. 웹 검색
제공자는 OpenAI SDK 방식의 구성 예시와의 호환성을 위해 해당 위치에서 `baseURL`도
허용합니다. 아무것도 설정하지 않으면 OpenClaw는
`http://127.0.0.1:11434`를 기본값으로 사용합니다.

호스팅된 Ollama Web Search 직접 사용(로컬 Ollama 없음):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## 인증 및 요청 라우팅

- 웹 검색 전용 API 키 필드는 없습니다. 구성된 호스트가 인증으로 보호되는 경우 제공자는
  `models.providers.ollama.apiKey`(또는 일치하는 환경 변수 기반 제공자 인증)를
  재사용합니다.
- 호스트 확인 순서: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl`(또는 `baseURL`) → `http://127.0.0.1:11434`.
- 확인된 호스트가 `https://ollama.com`이면 OpenClaw는 API 키를 Bearer
  인증으로 사용하여 `https://ollama.com/api/web_search`를 직접 호출합니다.
- 그렇지 않으면 OpenClaw는 먼저 로컬 프록시 엔드포인트
  `/api/experimental/web_search`를 호출합니다. 이 엔드포인트는 요청에 서명한 후 Ollama
  Cloud로 전달하며, 실패하면 동일한 호스트의 `/api/web_search`로 대체합니다. 둘 다 실패하고
  `OLLAMA_API_KEY`가 설정되어 있으면 해당 키로
  `https://ollama.com/api/web_search`에 한 번 다시 시도하며, 키를
  로컬 호스트에는 전송하지 않습니다.
- 설정 중 Ollama에 연결할 수 없거나 로그인되어 있지 않으면 OpenClaw가 경고하지만,
  제공자 선택을 차단하지는 않습니다.

## 관련 문서

- [웹 검색 개요](/ko/tools/web) -- 모든 제공자 및 자동 감지
- [Ollama](/ko/providers/ollama) -- Ollama 모델 설정 및 클라우드/로컬 모드
