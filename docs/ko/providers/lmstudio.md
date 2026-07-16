---
read_when:
    - LM Studio를 통해 오픈 소스 모델로 OpenClaw를 실행하려고 합니다
    - LM Studio를 설정하고 구성하려고 합니다
summary: LM Studio로 OpenClaw 실행하기
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T13:01:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio는 GUI 앱 또는 헤드리스 `llmster` 데몬으로 llama.cpp(GGUF) 또는 MLX 모델을 로컬에서 실행합니다. 설치 및 제품 문서는 [lmstudio.ai](https://lmstudio.ai/)를 참조하십시오.

## 빠른 시작

<Steps>
  <Step title="서버 설치 및 시작">
    LM Studio(데스크톱) 또는 `llmster`(헤드리스)를 설치한 다음 서버를 시작하십시오.

    ```bash
    lms server start --port 1234
    ```

    또는 헤드리스 데몬을 실행하십시오.

    ```bash
    lms daemon up
    ```

    데스크톱 앱을 사용하는 경우 원활한 모델 로딩을 위해 JIT를 활성화하십시오. 자세한 내용은
    [LM Studio JIT 및 TTL 가이드](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)를 참조하십시오.

  </Step>
  <Step title="인증이 활성화된 경우 API 키 설정">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    LM Studio 인증이 비활성화되어 있다면 설정 중 API 키를 비워 두십시오. 자세한 내용은
    [LM Studio 인증](https://lmstudio.ai/docs/developer/core/authentication)을 참조하십시오.

  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard
    ```

    `LM Studio`을 선택한 다음 `Default model` 프롬프트에서 모델을 선택하십시오.

    새로운 안내식 설정에서는 OpenClaw가 먼저 기본 또는 구성된 LM Studio 호스트의
    `/api/v1/models`을 조회합니다. 기존 LLM은 동일한 CLI/macOS 설정 단계를 통해 제공되며,
    구성이 저장되기 전에 실제 완성 요청으로 검증됩니다. 자동 검사는 모델을 다운로드하지 않으며
    임베딩 전용 카탈로그 항목을 무시합니다.

  </Step>
</Steps>

나중에 기본 모델을 변경하려면 다음을 실행하십시오.

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 모델 키는 `author/model-name` 형식(예: `qwen/qwen3.5-9b`)을 사용하며, OpenClaw 모델 참조에는
제공자가 앞에 붙습니다: `lmstudio/qwen/qwen3.5-9b`. 모델의 정확한 키를 찾으려면 아래 명령을 실행하고
`key` 필드를 확인하십시오.

```bash
curl http://localhost:1234/api/v1/models
```

## 비대화형 온보딩

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

또는 기본 URL, 모델 및 API 키를 명시적으로 지정하십시오.

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`에는 `lmstudio/` 제공자 접두사 없이 LM Studio가 반환한 모델 키(예: `qwen/qwen3.5-9b`)를
입력합니다. 인증된 서버에는 `--lmstudio-api-key`을 전달하거나 `LM_API_TOKEN`을 설정하십시오.
인증되지 않은 서버에서는 생략하며, OpenClaw가 대신 로컬 비밀 정보가 아닌 마커를 저장합니다.
호환성을 위해 `--custom-api-key`도 계속 허용되지만, `--lmstudio-api-key`을 사용하는 것이 좋습니다.

이 작업은 `models.providers.lmstudio`을 기록하고 기본 모델을 `lmstudio/<custom-model-id>`로 설정합니다.
API 키를 제공하면 `lmstudio:default` 인증 프로필도 기록됩니다.

대화형 설정에서는 선호하는 로드 컨텍스트 길이를 추가로 묻고, 검색하여 구성에 저장하는 모든 모델에 이를 적용할 수 있습니다.

## 구성

### 스트리밍 사용량 호환성

LM Studio는 스트리밍 응답에서 OpenAI 형식의 `usage` 객체를 항상 내보내지는 않습니다. OpenClaw는
대신 llama.cpp 형식의 `timings.prompt_n` / `timings.predicted_n` 메타데이터에서 토큰 수를 복구합니다.
로컬 엔드포인트(루프백 호스트)로 확인된 모든 OpenAI 호환 엔드포인트에는 동일한 대체 처리가 적용되며,
vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI, text-generation-webui 같은 다른 로컬 백엔드도 포함됩니다.

### 사고 호환성

LM Studio의 `/api/v1/models` 검색이 모델별 추론 옵션을 보고하면 OpenClaw는 모델 호환성 메타데이터에
일치하는 `reasoning_effort` 값(`none`, `minimal`, `low`, `medium`, `high`, `xhigh`)을 노출합니다.
일부 LM Studio 빌드는 이진 UI 옵션(`allowed_options: ["off",
"on"]`)을 표시하면서 `/v1/chat/completions`에서는 이러한 리터럴 값을 거부합니다.
OpenClaw는 요청을 보내기 전에 이 이진 형식을 6단계 척도로 정규화하며, 여기에는 여전히
`off`/`on` 추론 맵이 있는 이전 저장 구성도 포함됩니다.

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

LM Studio는 첫 번째 요청 시 모델을 로드하는 JIT(Just-In-Time) 모델 로딩을 지원합니다. OpenClaw는 기본적으로
LM Studio의 네이티브 로드 엔드포인트를 통해 모델을 사전 로드하며, 이는 JIT가 비활성화된 경우 유용합니다.
대신 LM Studio의 JIT, 유휴 TTL 및 자동 축출 동작이 모델 수명 주기를 관리하도록 하려면
OpenClaw의 사전 로드 단계를 비활성화하십시오.

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
루프백 외부에도 바인딩되어 있는지 확인하십시오.

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

`lmstudio`은 루프백, LAN 및 tailnet 호스트(메타데이터/링크 로컬 오리진 제외)를 포함하여
구성된 엔드포인트를 모델 요청 대상으로 자동 신뢰합니다. 모든 사용자 지정/로컬 OpenAI 호환 제공자 항목에도
동일한 정확한 오리진 신뢰가 적용됩니다. 다른 비공개 호스트나 포트에 대한 요청에는 여전히
`models.providers.<id>.request.allowPrivateNetwork: true`이 필요하며, 기본 신뢰를 사용하지 않으려면 이를 `false`로 설정하십시오.

## 문제 해결

### LM Studio가 감지되지 않음

LM Studio가 실행 중인지 확인하십시오.

```bash
lms server start --port 1234
```

인증이 활성화되어 있다면 `LM_API_TOKEN`도 설정하십시오. API에 접근할 수 있는지 확인하십시오.

```bash
curl http://localhost:1234/api/v1/models
```

### 인증 오류(HTTP 401)

- LM Studio에 구성된 키와 `LM_API_TOKEN`이 일치하는지 확인하십시오.
- [LM Studio 인증](https://lmstudio.ai/docs/developer/core/authentication)을 참조하십시오.
- 서버에 인증이 필요하지 않다면 설정 중 키를 비워 두십시오.

## 관련 문서

- [모델 선택](/ko/concepts/model-providers)
- [Ollama](/ko/providers/ollama)
- [로컬 모델](/ko/gateway/local-models)
