---
read_when:
    - web_search에 Ollama를 사용하려고 합니다
    - 키가 필요 없는 web_search 프로바이더가 필요합니다
    - OLLAMA_API_KEY로 호스팅된 Ollama Web Search를 사용하려고 합니다
    - Ollama Web Search 설정 안내가 필요합니다
summary: 로컬 Ollama 호스트 또는 호스팅된 Ollama API를 통한 Ollama 웹 검색
title: Ollama 웹 검색
x-i18n:
    generated_at: "2026-06-27T18:15:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw는 번들 `web_search` 제공자로 **Ollama Web Search**를 지원합니다. 이 기능은
Ollama의 웹 검색 API를 사용하며 제목, URL, 스니펫이 포함된 구조화된 결과를
반환합니다.

로컬 또는 자체 호스팅 Ollama의 경우, 이 설정에는 기본적으로 API 키가 필요하지
않습니다. 다음은 필요합니다.

- OpenClaw에서 접근할 수 있는 Ollama 호스트
- `ollama signin`

직접 호스팅 검색을 사용하려면 Ollama 제공자 기본 URL을 `https://ollama.com`으로
설정하고 실제 `OLLAMA_API_KEY`를 제공하세요.

## 설정

<Steps>
  <Step title="Start Ollama">
    Ollama가 설치되어 실행 중인지 확인하세요.
  </Step>
  <Step title="Sign in">
    실행합니다.

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choose Ollama Web Search">
    실행합니다.

    ```bash
    openclaw configure --section web
    ```

    그런 다음 제공자로 **Ollama Web Search**를 선택합니다.

  </Step>
</Steps>

이미 모델에 Ollama를 사용 중이라면, Ollama Web Search는 동일하게
구성된 호스트를 재사용합니다.

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

선택적 Ollama 호스트 재정의:

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

이미 Ollama를 모델 제공자로 구성한 경우, 웹 검색 제공자는 대신 해당 호스트를
재사용할 수 있습니다.

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

Ollama 모델 제공자는 `baseUrl`을 정식 키로 사용합니다. 웹 검색 제공자는 OpenAI SDK 스타일 구성 예시와의 호환성을 위해 `models.providers.ollama`의 `baseURL`도 인식합니다.

명시적인 Ollama 기본 URL이 설정되지 않은 경우 OpenClaw는 `http://127.0.0.1:11434`를 사용합니다.

Ollama 호스트가 bearer 인증을 요구하는 경우, OpenClaw는 구성된 해당 호스트에 대한 요청에
`models.providers.ollama.apiKey`(또는 일치하는 환경 변수 기반 제공자 인증)를
재사용합니다.

직접 호스팅 Ollama Web Search:

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

## 참고

- 이 제공자에는 웹 검색 전용 API 키 필드가 필요하지 않습니다.
- Ollama 호스트가 인증으로 보호되는 경우, OpenClaw는 존재할 때 일반 Ollama
  제공자 API 키를 재사용합니다.
- `baseUrl`이 `https://ollama.com`이면 OpenClaw는
  `https://ollama.com/api/web_search`를 직접 호출하고 구성된 Ollama
  API 키를 bearer 인증으로 전송합니다.
- 구성된 호스트가 웹 검색을 노출하지 않고 `OLLAMA_API_KEY`가 설정되어 있으면,
  OpenClaw는 해당 환경 변수 키를 로컬 호스트로 보내지 않고
  `https://ollama.com/api/web_search`로 대체할 수 있습니다.
- Ollama에 접근할 수 없거나 로그인되어 있지 않으면 OpenClaw는 설정 중 경고하지만
  선택을 차단하지는 않습니다.
- 더 높은 우선순위의 인증 정보가 있는 제공자가 구성되지 않았을 때 OpenClaw는
  Ollama Web Search를 자동 선택하지 않습니다. `tools.web.search.provider: "ollama"`로
  명시적으로 선택하세요.
- 로컬 Ollama 데몬 호스트는 로컬 프록시 엔드포인트
  `/api/experimental/web_search`를 사용하며, 이 엔드포인트가 서명한 뒤 Ollama Cloud로 전달합니다.
- `https://ollama.com` 호스트는 bearer API 키 인증으로 공개 호스팅 엔드포인트
  `/api/web_search`를 직접 사용합니다.

## 관련 항목

- [Web Search 개요](/ko/tools/web) -- 모든 제공자와 자동 감지
- [Ollama](/ko/providers/ollama) -- Ollama 모델 설정 및 클라우드/로컬 모드
