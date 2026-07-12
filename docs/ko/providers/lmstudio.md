---
read_when:
    - LM Studio를 통해 오픈 소스 모델로 OpenClaw를 실행하려고 합니다
    - LM Studio를 설정하고 구성하려고 합니다
summary: LM Studio로 OpenClaw 실행하기
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T15:40:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio는 llama.cpp(GGUF) 또는 MLX 모델을 GUI 앱이나 헤드리스 `llmster`
데몬으로 로컬에서 실행합니다. 설치 및 제품 문서는 [lmstudio.ai](https://lmstudio.ai/)를 참조하십시오.

## 빠른 시작

<Steps>
  <Step title="서버 설치 및 시작">
    LM Studio(데스크톱) 또는 `llmster`(헤드리스)를 설치한 다음 서버를 시작합니다.

    ```bash
    lms server start --port 1234
    ```

    또는 헤드리스 데몬을 실행합니다.

    ```bash
    lms daemon up
    ```

    데스크톱 앱을 사용하는 경우 원활한 모델 로딩을 위해 JIT를 활성화하십시오.
    [LM Studio JIT 및 TTL 가이드](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)를 참조하십시오.

  </Step>
  <Step title="인증이 활성화된 경우 API 키 설정">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    LM Studio 인증이 비활성화되어 있다면 설정 중 API 키를 비워 두십시오.
    [LM Studio 인증](https://lmstudio.ai/docs/developer/core/authentication)을 참조하십시오.

  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard
    ```

    `LM Studio`를 선택한 다음 `Default model` 프롬프트에서 모델을 선택하십시오.

  </Step>
</Steps>

나중에 기본 모델을 변경하려면 다음을 실행합니다.

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 모델 키는 `author/model-name` 형식(예: `qwen/qwen3.5-9b`)을 사용하며, OpenClaw 모델 참조에는
제공자 접두사가 붙습니다: `lmstudio/qwen/qwen3.5-9b`. 모델의 정확한 키를 찾으려면 아래
명령을 실행하고 `key` 필드를 확인하십시오.

```bash
curl http://localhost:1234/api/v1/models
```

## 비대화형 온보딩

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

또는 기본 URL, 모델, API 키를 명시적으로 지정합니다.

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`에는 `lmstudio/` 제공자 접두사 없이 LM Studio가 반환한 모델 키
(예: `qwen/qwen3.5-9b`)를 지정합니다. 인증된 서버에서는 `--lmstudio-api-key`를 전달하거나
`LM_API_TOKEN`을 설정하십시오. 인증되지 않은 서버에서는 이를 생략하면 OpenClaw가 대신 로컬 비밀 정보가 아닌 마커를 저장합니다.
호환성을 위해 `--custom-api-key`도 계속 허용되지만 `--lmstudio-api-key` 사용을 권장합니다.

이 명령은 `models.providers.lmstudio`를 기록하고 기본 모델을 `lmstudio/<custom-model-id>`로 설정합니다.
API 키를 제공하면 `lmstudio:default` 인증 프로필도 기록합니다.

대화형 설정에서는 선호하는 로드 컨텍스트 길이를 추가로 묻고, 구성에 저장하는
검색된 모든 모델에 이를 적용할 수 있습니다.

## 구성

### 스트리밍 사용량 호환성

LM Studio는 스트리밍 응답에서 OpenAI 형식의 `usage` 객체를 항상 내보내지는 않습니다. OpenClaw는
대신 llama.cpp 형식의 `timings.prompt_n` / `timings.predicted_n` 메타데이터에서 토큰 수를
복구합니다. 로컬 엔드포인트(루프백 호스트)로 확인된 모든 OpenAI 호환 엔드포인트에는 동일한
대체 처리가 적용되며, vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI,
text-generation-webui 등의 다른 로컬 백엔드에도 적용됩니다.

### 추론 호환성

LM Studio의 `/api/v1/models` 검색이 모델별 추론 옵션을 보고하면 OpenClaw는
모델 호환성 메타데이터에 일치하는 `reasoning_effort` 값(`none`, `minimal`, `low`, `medium`, `high`, `xhigh`)을
노출합니다. 일부 LM Studio 빌드는 이진 UI 옵션(`allowed_options: ["off",
"on"]`)을 표시하지만 `/v1/chat/completions`에서는 해당 리터럴 값을 거부합니다. OpenClaw는 요청을
보내기 전에 이 이진 형식을 6단계 척도로 정규화하며, `off`/`on` 추론 맵이
여전히 포함된 이전 저장 구성에도 이를 적용합니다.

### 명시적 구성

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 사전 로드 비활성화

LM Studio는 첫 번째 요청 시 모델을 로드하는 적시(JIT) 모델 로딩을 지원합니다. OpenClaw는
기본적으로 LM Studio의 네이티브 로드 엔드포인트를 통해 모델을 사전 로드하며, 이는 JIT가
비활성화된 경우 유용합니다. 대신 LM Studio의 JIT, 유휴 TTL 및 자동 제거 동작이 모델 수명 주기를
관리하도록 하려면 OpenClaw의 사전 로드 단계를 비활성화하십시오.

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN 또는 tailnet 호스트

LM Studio 호스트에서 접근 가능한 주소를 사용하고 `/v1`을 유지하며, 해당 머신에서 LM Studio가
루프백 이외의 주소에도 바인딩되어 있는지 확인하십시오.

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

`lmstudio`는 루프백, LAN 및 tailnet 호스트를 포함하여 구성된 모델 요청 엔드포인트를 자동으로
신뢰합니다(메타데이터/링크 로컬 출처 제외). 모든 사용자 지정/로컬 OpenAI 호환 제공자 항목에도
동일한 정확한 출처 신뢰가 적용됩니다. 다른 사설 호스트 또는 포트에 대한 요청에는 여전히
`models.providers.<id>.request.allowPrivateNetwork: true`가 필요합니다. 기본 신뢰를 사용하지 않으려면
이를 `false`로 설정하십시오.

## 문제 해결

### LM Studio가 감지되지 않음

LM Studio가 실행 중인지 확인하십시오.

```bash
lms server start --port 1234
```

인증이 활성화되어 있다면 `LM_API_TOKEN`도 설정하십시오. API에 접근할 수 있는지 확인합니다.

```bash
curl http://localhost:1234/api/v1/models
```

### 인증 오류(HTTP 401)

- `LM_API_TOKEN`이 LM Studio에 구성된 키와 일치하는지 확인하십시오.
- [LM Studio 인증](https://lmstudio.ai/docs/developer/core/authentication)을 참조하십시오.
- 서버에서 인증이 필요하지 않다면 설정 중 키를 비워 두십시오.

## 관련 문서

- [모델 선택](/ko/concepts/model-providers)
- [Ollama](/ko/providers/ollama)
- [로컬 모델](/ko/gateway/local-models)
