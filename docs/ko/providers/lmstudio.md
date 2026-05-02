---
read_when:
    - LM Studio를 통해 오픈 소스 모델로 OpenClaw를 실행하려는 경우
    - LM Studio를 설정하고 구성하려는 경우
summary: LM Studio로 OpenClaw 실행하기
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T21:11:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio는 자체 하드웨어에서 오픈 가중치 모델을 실행하기 위한 친숙하면서도 강력한 앱입니다. llama.cpp(GGUF) 또는 MLX 모델(Apple Silicon)을 실행할 수 있습니다. GUI 패키지 또는 헤드리스 데몬(`llmster`)으로 제공됩니다. 제품 및 설정 문서는 [lmstudio.ai](https://lmstudio.ai/)를 참조하세요.

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

앱을 사용하는 경우 원활한 경험을 위해 JIT가 활성화되어 있는지 확인하세요. 자세한 내용은 [LM Studio JIT 및 TTL 가이드](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)를 참조하세요.

3. LM Studio 인증이 활성화되어 있으면 `LM_API_TOKEN`을 설정합니다.

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio 인증이 비활성화되어 있으면 대화형 OpenClaw 설정 중 API 키를 비워 둘 수 있습니다.

LM Studio 인증 설정 세부 정보는 [LM Studio 인증](https://lmstudio.ai/docs/developer/core/authentication)을 참조하세요.

4. 온보딩을 실행하고 `LM Studio`를 선택합니다.

```bash
openclaw onboard
```

5. 온보딩에서 `Default model` 프롬프트를 사용해 LM Studio 모델을 선택합니다.

나중에 설정하거나 변경할 수도 있습니다.

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 모델 키는 `author/model-name` 형식(예: `qwen/qwen3.5-9b`)을 따릅니다. OpenClaw 모델 참조는 제공자 이름을 앞에 붙입니다: `lmstudio/qwen/qwen3.5-9b`. 모델의 정확한 키는 `curl http://localhost:1234/api/v1/models`를 실행하고 `key` 필드를 확인해 찾을 수 있습니다.

## 비대화형 온보딩

설정을 스크립트화하려는 경우(CI, 프로비저닝, 원격 부트스트랩) 비대화형 온보딩을 사용합니다.

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

인증된 LM Studio 서버의 경우 `--lmstudio-api-key`를 전달하거나 `LM_API_TOKEN`을 설정합니다. 인증되지 않은 LM Studio 서버의 경우 키를 생략하세요. OpenClaw는 로컬 비밀이 아닌 마커를 저장합니다.

`--custom-api-key`는 호환성을 위해 계속 지원되지만, LM Studio에는 `--lmstudio-api-key`가 권장됩니다.

그러면 `models.providers.lmstudio`가 작성되고 기본 모델이 `lmstudio/<custom-model-id>`로 설정됩니다. API 키를 제공하면 설정이 `lmstudio:default` 인증 프로필도 작성합니다.

대화형 설정은 선택적 선호 로드 컨텍스트 길이를 물어볼 수 있으며, 구성에 저장하는 발견된 LM Studio 모델 전반에 이를 적용합니다.
LM Studio Plugin 구성은 루프백, LAN, tailnet 호스트를 포함해 모델 요청에 대해 구성된 LM Studio 엔드포인트를 신뢰합니다. `models.providers.lmstudio.request.allowPrivateNetwork: false`를 설정해 옵트아웃할 수 있습니다.

## 구성

### 스트리밍 사용량 호환성

LM Studio는 스트리밍 사용량과 호환됩니다. OpenAI 형태의 `usage` 객체를 내보내지 않는 경우 OpenClaw는 대신 llama.cpp 스타일 `timings.prompt_n` / `timings.predicted_n` 메타데이터에서 토큰 수를 복구합니다.

동일한 스트리밍 사용량 동작이 다음 OpenAI 호환 로컬 백엔드에 적용됩니다.

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 사고 호환성

LM Studio의 `/api/v1/models` 발견이 모델별 추론 옵션을 보고하면 OpenClaw는 해당 네이티브 값을 모델 호환성 메타데이터에 보존합니다. `allowed_options: ["off", "on"]`을 광고하는 이진 사고 모델의 경우 OpenClaw는 OpenAI 전용 값인 `low` 또는 `medium`을 보내는 대신 비활성화된 사고를 `off`로, 활성화된 `/think` 레벨을 `on`으로 매핑합니다.

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

LM Studio가 실행 중인지 확인하세요. 인증이 활성화되어 있으면 `LM_API_TOKEN`도 설정합니다.

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

- `LM_API_TOKEN`이 LM Studio에 구성된 키와 일치하는지 확인합니다.
- LM Studio 인증 설정 세부 정보는 [LM Studio 인증](https://lmstudio.ai/docs/developer/core/authentication)을 참조하세요.
- 서버에 인증이 필요하지 않은 경우 설정 중 키를 비워 두세요.

### Just-in-time 모델 로딩

LM Studio는 첫 번째 요청 시 모델이 로드되는 just-in-time(JIT) 모델 로딩을 지원합니다. OpenClaw는 기본적으로 LM Studio의 네이티브 로드 엔드포인트를 통해 모델을 미리 로드하며, 이는 JIT가 비활성화되어 있을 때 유용합니다. LM Studio의 JIT, 유휴 TTL, 자동 제거 동작이 모델 수명 주기를 맡도록 하려면 OpenClaw의 사전 로드 단계를 비활성화하세요.

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

### LAN 또는 tailnet LM Studio 호스트

LM Studio 호스트의 연결 가능한 주소를 사용하고, `/v1`을 유지하며, 해당 머신에서 LM Studio가 루프백을 넘어 바인딩되어 있는지 확인하세요.

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

일반 OpenAI 호환 제공자와 달리 `lmstudio`는 보호된 모델 요청에 대해 구성된 로컬/비공개 엔드포인트를 자동으로 신뢰합니다. `localhost` 또는 `127.0.0.1` 같은 사용자 지정 루프백 제공자 ID도 자동으로 신뢰됩니다. LAN, tailnet 또는 비공개 DNS 사용자 지정 제공자 ID의 경우 `models.providers.<id>.request.allowPrivateNetwork: true`를 명시적으로 설정하세요.

## 관련 항목

- [모델 선택](/ko/concepts/model-providers)
- [Ollama](/ko/providers/ollama)
- [로컬 모델](/ko/gateway/local-models)
