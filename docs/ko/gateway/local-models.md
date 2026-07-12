---
read_when:
    - 자체 GPU 서버에서 모델을 제공하려는 경우
    - LM Studio 또는 OpenAI 호환 프록시를 연결하고 있습니다
    - 가장 안전한 로컬 모델 지침이 필요합니다
summary: 로컬 LLM에서 OpenClaw 실행하기(LM Studio, vLLM, LiteLLM, 사용자 지정 OpenAI 엔드포인트)
title: 로컬 모델
x-i18n:
    generated_at: "2026-07-12T00:47:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

로컬 모델도 작동하지만 하드웨어, 컨텍스트 크기, 프롬프트 인젝션 방어에 대한 요구 수준이 높아집니다. 작거나 과도하게 양자화된 모델은 컨텍스트를 잘라내고 공급자 측 안전 필터를 건너뜁니다. 이 페이지에서는 고성능 로컬 스택과 사용자 지정 OpenAI 호환 서버를 다룹니다. 가장 간편한 경로는 [LM Studio](/ko/providers/lmstudio) 또는 [Ollama](/ko/providers/ollama)와 `openclaw onboard`로 시작하세요.

선택한 모델에 필요할 때만 시작해야 하는 로컬 서버에 대해서는 [로컬 모델 서비스](/ko/gateway/local-model-services)를 참조하세요.

## 최소 하드웨어

원활한 에이전트 루프를 위해 **최고 사양 Mac Studio 2대 이상 또는 동급 GPU 장비(약 3만 달러 이상)**를 권장합니다. **24 GB** GPU 한 대로는 지연 시간이 더 긴 가벼운 프롬프트만 처리할 수 있습니다. 항상 **호스팅할 수 있는 가장 큰 / 전체 크기 변형**을 실행하세요. 작거나 심하게 양자화된 체크포인트는 프롬프트 인젝션 위험을 높입니다([보안](/ko/gateway/security) 참조).

## 백엔드 선택

| 백엔드                                              | 사용 시점                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/ko/providers/ds4)                                | OpenAI 호환 도구 호출을 지원하는 macOS Metal에서 로컬 DeepSeek V4 Flash를 실행할 때    |
| [LM Studio](/ko/providers/lmstudio)                     | 최초 로컬 설정, GUI 로더, 네이티브 Responses API가 필요할 때                    |
| LiteLLM / OAI-proxy / 사용자 지정 OpenAI 호환 프록시 | 다른 모델 API를 앞단에 두고 OpenClaw가 이를 OpenAI로 취급하도록 해야 할 때         |
| MLX / vLLM / SGLang                                  | OpenAI 호환 HTTP 엔드포인트를 사용하는 고처리량 자체 호스팅 서빙이 필요할 때 |
| [Ollama](/ko/providers/ollama)                          | CLI 워크플로, 모델 라이브러리, 별도 관리가 필요 없는 systemd 서비스를 사용할 때                      |

백엔드가 지원한다면 `api: "openai-responses"`를 사용하세요(LM Studio는 지원함). 그렇지 않으면 `api: "openai-completions"`를 사용하세요. `baseUrl`이 있는 사용자 지정 공급자에서 `api`를 생략하면 OpenClaw는 기본값으로 `openai-completions`를 사용합니다.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** 공식 Ollama Linux 설치 프로그램은 `Restart=always`가 설정된 systemd 서비스를 활성화합니다. WSL2 GPU 설정에서는 자동 시작 시 부팅 중 마지막 모델을 다시 로드하고 호스트 메모리를 점유하여 VM이 반복적으로 재시작될 수 있습니다. [WSL2 충돌 루프](/ko/providers/ollama#troubleshooting)를 참조하세요.
</Warning>

## LM Studio + 대형 로컬 모델(Responses API)

현재 가장 좋은 로컬 스택입니다. LM Studio에서 대형 모델(Qwen, DeepSeek 또는 Llama의 전체 크기 빌드)을 로드하고 로컬 서버(기본값 `http://127.0.0.1:1234`)를 활성화한 다음, 추론과 최종 텍스트를 분리하도록 Responses API를 사용하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

설정 체크리스트:

- LM Studio 설치: [https://lmstudio.ai](https://lmstudio.ai)
- **사용 가능한 가장 큰 모델 빌드**를 다운로드하고("small"/심하게 양자화된 변형은 피함) 서버를 시작한 다음, `http://127.0.0.1:1234/v1/models`에 해당 모델이 표시되는지 확인하세요.
- `my-local-model`을 LM Studio에 표시되는 실제 모델 ID로 바꾸세요.
- 모델을 로드된 상태로 유지하세요. 콜드 로드는 시작 지연 시간을 늘립니다.
- LM Studio 빌드의 값이 다르면 `contextWindow`/`maxTokens`를 조정하세요.
- WhatsApp에서는 최종 텍스트만 전송되도록 Responses API를 계속 사용하세요.
- 호스팅 모델을 폴백으로 계속 사용할 수 있도록 `models.mode: "merge"`를 유지하세요.

### 하이브리드 구성: 호스팅 기본 모델, 로컬 폴백

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

호스팅 모델을 안전망으로 두고 로컬 모델을 우선 사용하려면 `primary`/`fallbacks` 순서를 바꾸고 동일한 `providers` 블록과 `models.mode: "merge"`를 유지하세요.

### 지역별 호스팅 / 데이터 라우팅

호스팅되는 MiniMax/Kimi/GLM 변형은 지역이 고정된 엔드포인트(예: 미국 호스팅)를 통해 OpenRouter에서도 제공됩니다. 선택한 관할권 내에서 트래픽을 유지하려면 지역별 변형을 선택하고, Anthropic/OpenAI 폴백을 위해 `models.mode: "merge"`를 유지하세요. 개인정보 보호 측면에서는 로컬 전용이 여전히 가장 강력한 경로입니다. 공급자 기능이 필요하지만 데이터 흐름을 제어하고 싶을 때 호스팅 지역 라우팅은 중간 선택지입니다.

## 기타 OpenAI 호환 로컬 프록시

MLX(`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy 또는 모든 사용자 지정 Gateway는 OpenAI 방식의 `/v1/chat/completions` 엔드포인트를 노출한다면 작동합니다. 백엔드 문서에 `/v1/responses` 지원이 명시되어 있지 않다면 `openai-completions`를 사용하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

사용자 지정/로컬 공급자 항목은 local loopback, LAN, tailnet, 사설 DNS 호스트를 포함하여 보호된 모델 요청에 대해 정확히 구성된 `baseUrl` 오리진을 신뢰합니다. 메타데이터/링크 로컬 오리진은 설정과 관계없이 항상 차단됩니다. 다른 사설 오리진으로 요청하려면 여전히 `models.providers.<id>.request.allowPrivateNetwork: true`가 필요합니다. 정확한 오리진 신뢰를 사용하지 않으려면 신뢰 플래그를 `false`로 설정하세요.

`models.providers.<id>.models[].id`는 공급자 로컬 ID이므로 공급자 접두사를 포함하지 마세요. `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`로 시작한 MLX 서버의 경우:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

로컬 또는 프록시된 비전 모델에는 `input: ["text", "image"]`를 설정하여 이미지 첨부 파일이 에이전트 턴에 삽입되도록 하세요. 대화형 사용자 지정 공급자 온보딩은 일반적인 비전 모델 ID를 추론하고 알 수 없는 이름에 대해서만 질문합니다. 비대화형 온보딩도 동일한 추론을 사용하며, `--custom-image-input` / `--custom-text-input`으로 재정의할 수 있습니다.

느린 로컬/원격 모델 서버에는 `agents.defaults.timeoutSeconds`를 높이기 전에 `models.providers.<id>.timeoutSeconds`를 사용하세요. 공급자 타임아웃은 모델 HTTP 요청에 한해 연결, 헤더, 본문 스트리밍, 보호된 가져오기의 전체 중단 시간을 포괄합니다. 에이전트/실행 타임아웃이 더 낮다면 공급자 타임아웃으로 전체 실행 시간을 늘릴 수 없으므로 해당 값도 높이세요.

<Note>
사용자 지정 OpenAI 호환 공급자의 경우 `baseUrl`이 local loopback, 사설 LAN, `.local` 또는 점이 없는 호스트 이름으로 해석되면 `apiKey: "ollama-local"`과 같은 비밀이 아닌 로컬 표시자도 허용됩니다. OpenClaw는 키 누락을 보고하는 대신 이를 유효한 로컬 자격 증명으로 취급합니다. 공개 호스트 이름을 허용하는 공급자에는 실제 값을 사용하세요.
</Note>

로컬/프록시된 `/v1` 백엔드의 동작 참고 사항:

- OpenClaw는 이를 네이티브 OpenAI 엔드포인트가 아니라 프록시 방식의 OpenAI 호환 경로로 취급합니다.
- 네이티브 OpenAI 전용 요청 형성은 적용되지 않습니다. 즉, `service_tier`, Responses `store`, OpenAI 추론 호환 페이로드 형성, 프롬프트 캐시 힌트가 없습니다.
- 숨겨진 OpenClaw 출처 헤더(`originator`, `version`, `User-Agent`)는 사용자 지정 프록시 URL에 삽입되지 않습니다.

더 엄격한 OpenAI 호환 백엔드를 위한 호환성 재정의:

- **문자열 전용 콘텐츠**: 일부 서버는 구조화된 콘텐츠 부분 배열이 아니라 문자열 `messages[].content`만 허용합니다. `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
- **엄격한 메시지 키**: 서버가 `role`/`content` 외의 키가 포함된 메시지 항목을 거부하면 `compat.strictMessageKeys: true`를 설정하세요.
- **대괄호로 묶인 도구 텍스트**: 일부 로컬 모델은 `[tool_name]` 뒤에 JSON과 `[END_TOOL_REQUEST]`가 오는 독립적인 대괄호 형식의 도구 요청을 텍스트로 출력합니다. OpenClaw는 이름이 해당 턴에 등록된 도구와 정확히 일치할 때만 이를 실제 도구 호출로 승격합니다. 그렇지 않으면 숨겨진 미지원 텍스트로 유지됩니다.
- **구조화되지 않은 도구 호출 형태의 텍스트**: 모델이 도구 호출처럼 보이지만 구조화된 호출이 아닌 JSON/XML/ReAct 형식의 텍스트를 출력하면 OpenClaw는 이를 텍스트로 유지하고 실행 ID, 공급자/모델, 감지된 패턴 및 확인 가능한 경우 도구 이름과 함께 경고를 기록합니다. 이는 완료된 도구 실행이 아니라 공급자/모델 비호환성입니다.
- **도구 사용 강제**: 도구가 어시스턴트 텍스트(원시 JSON/XML/ReAct 또는 빈 `tool_calls` 배열)로 표시되면 먼저 서버의 채팅 템플릿/파서가 도구 호출을 지원하는지 확인하세요. 도구 사용을 강제할 때만 파서가 작동한다면 모델별로 기본 프록시 값 `tool_choice: "auto"`를 재정의하세요.

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  모든 일반 턴에서 도구를 호출해야 하는 경우에만 사용하세요. `local/my-local-model`을 `openclaw models list`에 표시되는 정확한 참조로 바꾸거나 CLI를 통해 설정하세요.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **추가 추론 강도**: 사용자 지정 OpenAI 호환 모델이 기본 제공 프로필 이외의 OpenAI 추론 강도를 허용한다면 모델의 호환성 블록에 이를 선언하세요. `"xhigh"`를 추가하면 해당 모델 참조에서 `/think xhigh`, 세션 선택기, Gateway 유효성 검사 및 `llm-task` 유효성 검사에 노출됩니다.

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## 더 작거나 엄격한 백엔드

모델은 정상적으로 로드되지만 전체 에이전트 턴이 오작동한다면 위에서 아래로 점검하세요. 먼저 전송 계층을 확인한 다음 범위를 좁히세요.

1. **로컬 모델 응답 확인** - 도구와 에이전트 컨텍스트 없이:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway 라우팅 확인** - 대화 기록, AGENTS 부트스트랩, 컨텍스트 엔진 조립, 도구 및 번들 MCP 서버는 건너뛰고 프롬프트만 전송하지만, Gateway 라우팅, 인증 및 제공자 선택은 계속 실행합니다.

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. 두 프로브는 모두 통과하지만 실제 에이전트 턴에서 잘못된 형식의 도구 호출이나 지나치게 큰 프롬프트로 인해 실패한다면 **경량 모드를 사용해 보세요**. `agents.defaults.experimental.localModelLean: true`로 설정합니다. 명시적으로 필요한 경우가 아니면 무거운 브라우저, Cron, 메시지, 미디어 생성, 음성 및 PDF 도구를 제외하고, `exec`는 직접 표시한 채 더 큰 도구 카탈로그를 기본적으로 구조화된 도구 검색 제어 뒤에 둡니다. 자세한 내용과 활성화 여부를 확인하는 방법은 [실험적 기능 -> 로컬 모델 경량 모드](/ko/concepts/experimental-features#local-model-lean-mode)를 참조하세요.

4. **최후의 수단으로 도구를 완전히 비활성화**하려면 해당 모델에 `models.providers.<provider>.models[].compat.supportsTools: false`를 설정하세요. 그러면 에이전트가 도구 호출 없이 실행됩니다.

5. **그 이후의 병목은 업스트림에 있습니다.** 경량 모드와 `supportsTools: false`를 적용한 후에도 더 큰 OpenClaw 실행에서만 백엔드가 계속 실패한다면, 남은 문제는 대개 OpenClaw의 전송 계층이 아니라 모델이나 서버 자체의 컨텍스트 창, GPU 메모리, kv-cache 축출 또는 백엔드 버그입니다.

## 문제 해결

- **Gateway가 프록시에 연결할 수 없나요?** `curl http://127.0.0.1:1234/v1/models`.
- **LM Studio 모델이 언로드되었나요?** 다시 로드하세요. 콜드 스타트는 흔한 "멈춤" 원인입니다.
- **로컬 서버에서 `terminated`, `ECONNRESET`이 표시되거나 턴 도중 스트림이 닫히나요?** OpenClaw는 진단 정보에 낮은 카디널리티의 `model.call.error.failureKind`와 OpenClaw 프로세스의 RSS/힙 스냅샷을 기록합니다. LM Studio/Ollama의 메모리 압박이 원인이라면 해당 타임스탬프를 서버 로그 또는 macOS 충돌/jetsam 로그와 대조하여 모델 서버가 종료되었는지 확인하세요.
- **컨텍스트 오류가 발생하나요?** OpenClaw는 감지된 모델 창 또는 `agents.defaults.contextTokens`가 이를 낮춘 경우 제한된 창을 기준으로 컨텍스트 창 사전 점검 임계값을 산출합니다. **8k**를 최저값으로 하여 20% 미만일 때 경고하고, **4k**를 최저값으로 하여 10% 미만일 때 강제로 차단합니다. 이 값은 유효 컨텍스트 창으로 제한되므로 과도하게 큰 모델 메타데이터가 유효한 사용자 제한을 거부하지 않습니다. `contextWindow`를 낮추거나 서버/모델의 컨텍스트 제한을 높이세요.
- **`messages[].content ... expected a string` 오류가 발생하나요?** 해당 모델 항목에 `compat.requiresStringContent: true`를 추가하세요.
- **`validation.keys` 오류 또는 "message entries only allow `role` and `content`"가 표시되나요?** 해당 모델 항목에 `compat.strictMessageKeys: true`를 추가하세요.
- **직접 `/v1/chat/completions`를 호출하면 작동하지만 Gemma 또는 다른 로컬 모델에서 `openclaw infer model run --local`이 실패하나요?** 먼저 제공자 URL, 모델 참조, 인증 표시 및 서버 로그를 확인하세요. `model run`은 에이전트 도구를 완전히 건너뜁니다. `model run`은 성공하지만 더 큰 에이전트 턴에서 실패한다면 `localModelLean` 또는 `compat.supportsTools: false`로 도구 범위를 줄이세요.
- **도구 호출이 원시 JSON/XML/ReAct 텍스트로 표시되거나 제공자가 빈 `tool_calls` 배열을 반환하나요?** 어시스턴트 텍스트를 무조건 도구 실행으로 변환하는 프록시를 추가하지 말고, 먼저 서버의 채팅 템플릿/파서를 수정하세요. 도구 사용을 강제할 때만 모델이 작동한다면 위의 `params.extra_body.tool_choice: "required"` 재정의를 추가하고 매 턴마다 도구 호출이 예상되는 세션에만 해당 모델 항목을 사용하세요.
- **안전**: 로컬 모델은 제공자 측 필터를 건너뜁니다. 프롬프트 인젝션의 영향 범위를 제한하려면 에이전트의 범위를 좁게 유지하고 Compaction을 활성화하세요.

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference)
- [모델 장애 조치](/ko/concepts/model-failover)
