---
read_when:
    - LM Studio를 통해 오픈 소스 모델로 OpenClaw를 실행하려는 경우
    - LM Studio를 설치하고 구성하려고 합니다
summary: LM Studio로 OpenClaw 실행하기
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T06:47:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio는 사용자의 하드웨어에서 오픈 웨이트 모델을 실행할 수 있는 친숙하면서도 강력한 앱입니다. llama.cpp(GGUF) 또는 MLX 모델(Apple Silicon)을 실행할 수 있습니다. GUI 패키지 또는 헤드리스 데몬(`llmster`)으로 제공됩니다. 제품 및 설정 문서는 [lmstudio.ai](https://lmstudio.ai/)를 참고하세요.

## 빠른 시작

1. LM Studio(데스크톱) 또는 `llmster`(헤드리스)를 설치한 다음 로컬 서버를 시작합니다.

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 서버 시작

데스크톱 앱을 시작했거나 다음 명령으로 데몬을 실행했는지 확인하세요.

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

앱을 사용하는 경우 원활한 경험을 위해 JIT가 활성화되어 있는지 확인하세요. 자세한 내용은 [LM Studio JIT 및 TTL 가이드](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)를 참고하세요.

3. LM Studio 인증이 활성화되어 있으면 `LM_API_TOKEN`을 설정합니다.

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio 인증이 비활성화되어 있으면 대화형 OpenClaw 설정 중 API 키를 비워 둘 수 있습니다.

LM Studio 인증 설정 세부 정보는 [LM Studio 인증](https://lmstudio.ai/docs/developer/core/authentication)을 참고하세요.

4. 온보딩을 실행하고 `LM Studio`를 선택합니다.

```bash
openclaw onboard
```

5. 온보딩에서 `Default model` 프롬프트를 사용해 LM Studio 모델을 선택합니다.

나중에 설정하거나 변경할 수도 있습니다.

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 모델 키는 `author/model-name` 형식(예: `qwen/qwen3.5-9b`)을 따릅니다. OpenClaw
모델 참조는 제공자 이름을 앞에 붙입니다: `lmstudio/qwen/qwen3.5-9b`. 모델의 정확한 키는
`curl http://localhost:1234/api/v1/models`를 실행하고 `key` 필드를 확인해 찾을 수 있습니다.

## 비대화형 온보딩

설정을 스크립트화하려는 경우(CI, 프로비저닝, 원격 부트스트랩) 비대화형 온보딩을 사용하세요.

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

또는 기본 URL, 모델, 선택적 API 키를 지정합니다.

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`는 `lmstudio/` 제공자 접두사 없이 LM Studio에서 반환한 모델 키(예: `qwen/qwen3.5-9b`)를 받습니다.

인증된 LM Studio 서버의 경우 `--lmstudio-api-key`를 전달하거나 `LM_API_TOKEN`을 설정하세요.
인증되지 않은 LM Studio 서버의 경우 키를 생략하세요. OpenClaw는 로컬 비밀이 아닌 마커를 저장합니다.

`--custom-api-key`는 호환성을 위해 계속 지원되지만, LM Studio에는 `--lmstudio-api-key`가 권장됩니다.

이 작업은 `models.providers.lmstudio`를 작성하고 기본 모델을
`lmstudio/<custom-model-id>`로 설정합니다. API 키를 제공하면 설정은
`lmstudio:default` 인증 프로필도 작성합니다.

대화형 설정은 선택적인 선호 로드 컨텍스트 길이를 묻고, 이를 config에 저장하는 검색된 LM Studio 모델 전반에 적용할 수 있습니다.
LM Studio Plugin config는 loopback, LAN, tailnet 호스트를 포함하여 모델 요청에 대해 구성된 LM Studio 엔드포인트를 신뢰합니다. `models.providers.lmstudio.request.allowPrivateNetwork: false`를 설정해 이 동작을 선택 해제할 수 있습니다.

## 구성

### 스트리밍 사용량 호환성

LM Studio는 스트리밍 사용량과 호환됩니다. OpenAI 형태의
`usage` 객체를 내보내지 않는 경우, OpenClaw는 대신 llama.cpp 스타일
`timings.prompt_n` / `timings.predicted_n` 메타데이터에서 토큰 수를 복구합니다.

동일한 스트리밍 사용량 동작은 다음 OpenAI 호환 로컬 백엔드에도 적용됩니다.

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 사고 호환성

LM Studio의 `/api/v1/models` 검색이 모델별 추론 옵션을 보고하면,
OpenClaw는 해당 네이티브 값을 모델 호환성 메타데이터에 보존합니다. `allowed_options: ["off", "on"]`을 알리는
이진 사고 모델의 경우, OpenClaw는 비활성화된 사고를 `off`로, 활성화된 `/think` 수준을 `on`으로 매핑하며
`low` 또는 `medium` 같은 OpenAI 전용 값을 보내지 않습니다.

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

## 문제 해결

### LM Studio가 감지되지 않음

LM Studio가 실행 중인지 확인하세요. 인증이 활성화되어 있으면 `LM_API_TOKEN`도 설정하세요.

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

API에 접근할 수 있는지 확인합니다.

```bash
curl http://localhost:1234/api/v1/models
```

### 인증 오류(HTTP 401)

설정에서 HTTP 401을 보고하면 API 키를 확인하세요.

- `LM_API_TOKEN`이 LM Studio에 구성된 키와 일치하는지 확인하세요.
- LM Studio 인증 설정 세부 정보는 [LM Studio 인증](https://lmstudio.ai/docs/developer/core/authentication)을 참고하세요.
- 서버에 인증이 필요하지 않다면 설정 중 키를 비워 두세요.

### Just-in-time 모델 로딩

LM Studio는 첫 요청 시 모델을 로드하는 just-in-time(JIT) 모델 로딩을 지원합니다. 'Model not loaded' 오류를 피하려면 이 기능이 활성화되어 있는지 확인하세요.

### LAN 또는 tailnet LM Studio 호스트

LM Studio 호스트의 접근 가능한 주소를 사용하고, `/v1`을 유지하며, 해당 머신에서 LM Studio가 loopback을 넘어 바인딩되어 있는지 확인하세요.

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

일반 OpenAI 호환 제공자와 달리 `lmstudio`는 보호된 모델 요청에 대해 구성된 로컬/프라이빗 엔드포인트를 자동으로 신뢰합니다. `localhost` 또는 `127.0.0.1` 같은 사용자 지정 loopback 제공자 ID도 자동으로 신뢰됩니다. LAN, tailnet 또는 프라이빗 DNS 사용자 지정 제공자 ID의 경우 `models.providers.<id>.request.allowPrivateNetwork: true`를 명시적으로 설정하세요.

## 관련 항목

- [모델 선택](/ko/concepts/model-providers)
- [Ollama](/ko/providers/ollama)
- [로컬 모델](/ko/gateway/local-models)
