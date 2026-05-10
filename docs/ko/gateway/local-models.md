---
read_when:
    - 자체 GPU 머신에서 모델을 서빙하려는 경우
    - LM Studio 또는 OpenAI 호환 프록시를 연결하고 있습니다
    - 가장 안전한 로컬 모델 지침이 필요합니다
summary: 로컬 LLM(LM Studio, vLLM, LiteLLM, 사용자 지정 OpenAI 엔드포인트)에서 OpenClaw 실행
title: 로컬 모델
x-i18n:
    generated_at: "2026-05-10T19:36:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

로컬 모델은 가능합니다. 하지만 하드웨어, 컨텍스트 크기, 프롬프트 인젝션 방어에 대한 기준도 높아집니다. 작거나 과도하게 양자화된 카드는 컨텍스트를 잘라내고 안전성을 떨어뜨립니다. 이 페이지는 고급 로컬 스택과 사용자 지정 OpenAI 호환 로컬 서버를 위한 주관적인 가이드입니다. 가장 마찰이 적은 온보딩을 원한다면 [LM Studio](/ko/providers/lmstudio) 또는 [Ollama](/ko/providers/ollama)와 `openclaw onboard`로 시작하세요.

선택한 모델이 필요할 때만 시작되어야 하는 로컬 서버는
[로컬 모델 서비스](/ko/gateway/local-model-services)를 참조하세요.

## 하드웨어 하한선

편안한 에이전트 루프를 위해서는 **최대 사양 Mac Studio 2대 이상 또는 동급 GPU 장비(~$30k+)**를 목표로 하세요. 단일 **24 GB** GPU는 더 가벼운 프롬프트에서 더 높은 지연 시간을 감수할 때만 적합합니다. 항상 **호스팅할 수 있는 가장 큰 / 풀사이즈 변형**을 실행하세요. 작거나 심하게 양자화된 체크포인트는 프롬프트 인젝션 위험을 높입니다([보안](/ko/gateway/security) 참조).

## 백엔드 선택

| 백엔드                                              | 사용할 때                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/ko/providers/lmstudio)                     | 첫 로컬 설정, GUI 로더, 네이티브 Responses API                    |
| [Ollama](/ko/providers/ollama)                          | CLI 워크플로, 모델 라이브러리, 자동 systemd 서비스                      |
| MLX / vLLM / SGLang                                  | OpenAI 호환 HTTP 엔드포인트로 처리량이 높은 자체 호스팅 서빙 |
| LiteLLM / OAI-proxy / 사용자 지정 OpenAI 호환 프록시 | 다른 모델 API를 앞단에 두고 OpenClaw가 이를 OpenAI처럼 다루게 해야 할 때         |

백엔드가 지원하면 Responses API(`api: "openai-responses"`)를 사용하세요(LM Studio는 지원합니다). 그렇지 않으면 Chat Completions(`api: "openai-completions"`)를 유지하세요.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 사용자:** 공식 Ollama Linux 설치 프로그램은 `Restart=always`가 설정된 systemd 서비스를 활성화합니다. WSL2 GPU 설정에서는 자동 시작이 부팅 중 마지막 모델을 다시 로드하고 호스트 메모리를 고정할 수 있습니다. Ollama를 활성화한 뒤 WSL2 VM이 반복해서 재시작된다면 [WSL2 크래시 루프](/ko/providers/ollama#wsl2-crash-loop-repeated-reboots)를 참조하세요.
</Warning>

## 권장: LM Studio + 대형 로컬 모델(Responses API)

현재 가장 좋은 로컬 스택입니다. LM Studio에서 대형 모델(예: 풀사이즈 Qwen, DeepSeek, 또는 Llama 빌드)을 로드하고, 로컬 서버(기본값 `http://127.0.0.1:1234`)를 활성화한 다음, Responses API를 사용해 추론을 최종 텍스트와 분리하세요.

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

**설정 체크리스트**

- LM Studio 설치: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio에서 **사용 가능한 가장 큰 모델 빌드**를 다운로드하고("small"/심하게 양자화된 변형은 피하세요), 서버를 시작한 뒤 `http://127.0.0.1:1234/v1/models`에 해당 모델이 표시되는지 확인하세요.
- `my-local-model`을 LM Studio에 표시된 실제 모델 ID로 바꾸세요.
- 모델을 로드된 상태로 유지하세요. 콜드 로드는 시작 지연 시간을 추가합니다.
- LM Studio 빌드가 다르면 `contextWindow`/`maxTokens`를 조정하세요.
- WhatsApp의 경우 최종 텍스트만 전송되도록 Responses API를 유지하세요.

로컬로 실행할 때도 호스팅 모델 구성을 유지하세요. `models.mode: "merge"`를 사용해 폴백을 계속 사용할 수 있게 하세요.

### 하이브리드 구성: 호스팅 기본, 로컬 폴백

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

### 로컬 우선, 호스팅 안전망

기본 모델과 폴백 순서를 바꾸세요. 같은 providers 블록과 `models.mode: "merge"`를 유지하면 로컬 장비가 내려갔을 때 Sonnet 또는 Opus로 폴백할 수 있습니다.

### 지역 호스팅 / 데이터 라우팅

- 호스팅 MiniMax/Kimi/GLM 변형은 OpenRouter에도 지역 고정 엔드포인트(예: 미국 호스팅)로 제공됩니다. 선택한 관할권 안에 트래픽을 유지하면서도 Anthropic/OpenAI 폴백을 위해 `models.mode: "merge"`를 계속 사용할 수 있도록 해당 지역 변형을 선택하세요.
- 로컬 전용이 가장 강력한 개인정보 보호 경로입니다. 제공자 기능이 필요하지만 데이터 흐름을 제어하고 싶을 때는 호스팅 지역 라우팅이 중간 지점입니다.

## 기타 OpenAI 호환 로컬 프록시

MLX(`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy 또는 사용자 지정
Gateway는 OpenAI 스타일 `/v1/chat/completions`
엔드포인트를 노출하면 작동합니다. 백엔드가 `/v1/responses` 지원을 명시적으로
문서화하지 않는 한 Chat Completions 어댑터를 사용하세요. 위 provider 블록을
사용자의 엔드포인트와 모델 ID로 바꾸세요.

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

`baseUrl`이 있는 사용자 지정 provider에서 `api`를 생략하면 OpenClaw는 기본값으로
`openai-completions`를 사용합니다. `127.0.0.1` 같은 loopback 엔드포인트는
자동으로 신뢰됩니다. LAN, tailnet, 비공개 DNS 엔드포인트에는 여전히
`request.allowPrivateNetwork: true`가 필요합니다.

`models.providers.<id>.models[].id` 값은 provider 내부에서만 유효합니다. 거기에
provider 접두사를 포함하지 마세요. 예를 들어
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`로 시작한 MLX 서버는
다음 카탈로그 ID와 모델 참조를 사용해야 합니다.

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

로컬 또는 프록시된 비전 모델에는 `input: ["text", "image"]`를 설정해 이미지
첨부 파일이 에이전트 턴에 주입되도록 하세요. 대화형 사용자 지정 provider
온보딩은 일반적인 비전 모델 ID를 추론하고 알 수 없는 이름에 대해서만 질문합니다.
비대화형 온보딩도 같은 추론을 사용합니다. 알 수 없는 비전 ID에는
`--custom-image-input`을 사용하고, 알려진 것처럼 보이는 모델이 엔드포인트 뒤에서
텍스트 전용일 때는 `--custom-text-input`을 사용하세요.

호스팅 모델을 폴백으로 계속 사용할 수 있도록 `models.mode: "merge"`를 유지하세요.
느린 로컬 또는 원격 모델 서버에는 `agents.defaults.timeoutSeconds`를 올리기 전에
`models.providers.<id>.timeoutSeconds`를 사용하세요. provider 타임아웃은 연결,
헤더, 본문 스트리밍, 전체 보호된 fetch 중단을 포함한 모델 HTTP 요청에만 적용됩니다.

<Note>
사용자 지정 OpenAI 호환 provider의 경우 `baseUrl`이 loopback, 비공개 LAN, `.local` 또는 베어 호스트 이름으로 해석되면 `apiKey: "ollama-local"` 같은 비밀이 아닌 로컬 마커를 유지해도 허용됩니다. OpenClaw는 이를 누락된 키로 보고하지 않고 유효한 로컬 자격 증명으로 취급합니다. 공개 호스트 이름을 허용하는 모든 provider에는 실제 값을 사용하세요.
</Note>

로컬/프록시된 `/v1` 백엔드에 대한 동작 참고:

- OpenClaw는 이를 네이티브 OpenAI 엔드포인트가 아니라 프록시 스타일의 OpenAI 호환 라우트로 취급합니다
- 네이티브 OpenAI 전용 요청 shaping은 여기에 적용되지 않습니다. `service_tier` 없음,
  Responses `store` 없음, OpenAI 추론 호환 페이로드 shaping 없음,
  프롬프트 캐시 힌트 없음
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는
  이러한 사용자 지정 프록시 URL에 주입되지 않습니다

더 엄격한 OpenAI 호환 백엔드에 대한 호환성 참고:

- 일부 서버는 Chat Completions에서 구조화된 content-part 배열이 아니라 문자열 `messages[].content`만
  허용합니다. 그런 엔드포인트에는
  `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
- 일부 로컬 모델은 `[tool_name]` 뒤에 JSON과 `[END_TOOL_REQUEST]`가 이어지는 형태처럼
  독립적인 대괄호 도구 요청을 텍스트로 내보냅니다. OpenClaw는 이름이 해당 턴에 등록된
  도구와 정확히 일치할 때만 이를 실제 도구 호출로 승격합니다. 그렇지 않으면 해당 블록은
  지원되지 않는 텍스트로 처리되고 사용자에게 보이는 응답에서는 숨겨집니다.
- 모델이 도구 호출처럼 보이는 JSON, XML 또는 ReAct 스타일 텍스트를 내보내지만
  provider가 구조화된 호출을 내보내지 않았다면, OpenClaw는 이를 텍스트로 남겨두고
  실행 ID, provider/model, 감지된 패턴, 가능한 경우 도구 이름과 함께 경고를 기록합니다.
  이를 완료된 도구 실행이 아니라 provider/model 도구 호출 비호환성으로 취급하세요.
- 도구가 실행되는 대신 raw JSON, XML, ReAct 구문 또는 provider 응답의 빈 `tool_calls` 배열처럼
  assistant 텍스트로 나타난다면, 먼저 서버가 도구 호출이 가능한 chat template/parser를
  사용하고 있는지 확인하세요. 도구 사용이 강제될 때만 parser가 작동하는 OpenAI 호환
  Chat Completions 백엔드의 경우 텍스트 파싱에 의존하지 말고 모델별 요청 override를 설정하세요.

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

  모든 일반 턴이 도구를 호출해야 하는 모델/세션에서만 이것을 사용하세요.
  이는 OpenClaw의 기본 프록시 값인 `tool_choice: "auto"`를 override합니다.
  `local/my-local-model`을 `openclaw models list`에 표시된 정확한 provider/model 참조로 바꾸세요.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 사용자 지정 OpenAI 호환 모델이 내장 프로필을 넘어서는 OpenAI reasoning effort를 허용한다면
  모델 compat 블록에 선언하세요. 여기에 `"xhigh"`를 추가하면 `/think xhigh`,
  세션 선택기, Gateway 검증, `llm-task` 검증이 구성된 provider/model 참조에 대해
  해당 수준을 노출합니다.

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

## 더 작거나 더 엄격한 백엔드

모델이 정상적으로 로드되지만 전체 에이전트 턴이 오작동한다면 하향식으로 작업하세요. 먼저 전송을 확인한 다음 범위를 좁힙니다.

1. **로컬 모델 자체가 응답하는지 확인합니다.** 도구도, 에이전트 컨텍스트도 없습니다.

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway 라우팅을 확인합니다.** 제공된 프롬프트만 전송합니다. transcript, AGENTS bootstrap, context-engine assembly, 도구, 번들 MCP 서버는 건너뛰지만 Gateway 라우팅, 인증, provider 선택은 계속 실행합니다.

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **린 모드를 시도합니다.** 두 프로브가 모두 통과하지만 실제 에이전트 턴이 잘못된 형식의 도구 호출 또는 과도하게 큰 프롬프트로 실패한다면 `agents.defaults.experimental.localModelLean: true`를 활성화하세요. 가장 무거운 기본 도구 세 가지(`browser`, `cron`, `message`)를 제거하여 프롬프트 형태를 더 작고 덜 취약하게 만듭니다. 전체 설명, 사용 시점, 활성화 여부 확인 방법은 [실험적 기능 → 로컬 모델 린 모드](/ko/concepts/experimental-features#local-model-lean-mode)를 참조하세요.

4. **최후의 수단으로 도구를 완전히 비활성화합니다.** 린 모드로 충분하지 않다면 해당 모델 항목에 `models.providers.<provider>.models[].compat.supportsTools: false`를 설정하세요. 그러면 에이전트가 해당 모델에서 도구 호출 없이 작동합니다.

5. **그 이후의 병목은 upstream에 있습니다.** 린 모드와 `supportsTools: false`를 적용한 뒤에도 더 큰 OpenClaw 실행에서만 backend가 계속 실패한다면 남은 문제는 보통 upstream 모델 또는 서버 용량입니다. 컨텍스트 창, GPU 메모리, kv-cache 축출, 또는 backend 버그일 수 있습니다. 그 시점에서는 OpenClaw의 전송 계층 문제가 아닙니다.

## 문제 해결

- Gateway가 프록시에 접근할 수 있나요? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio 모델이 언로드되었나요? 다시 로드하세요. 콜드 스타트는 흔한 "멈춤" 원인입니다.
- 로컬 서버가 `terminated`, `ECONNRESET`을 표시하거나 턴 도중 스트림을 닫나요?
  OpenClaw는 진단 정보에 저카디널리티 `model.call.error.failureKind`와
  OpenClaw 프로세스 RSS/힙 스냅샷을 기록합니다. LM Studio/Ollama
  메모리 압박의 경우 해당 타임스탬프를 서버 로그 또는 macOS crash /
  jetsam 로그와 대조해 모델 서버가 종료되었는지 확인하세요.
- OpenClaw는 감지된 모델 창, 또는 `agents.defaults.contextTokens`가 유효 창을 낮춘 경우 캡이 적용되지 않은 모델 창에서 컨텍스트 창 사전 점검 임계값을 도출합니다. **8k** 하한으로 20% 미만에서 경고합니다. 하드 차단은 **4k** 하한으로 10% 임계값을 사용하며, 유효 컨텍스트 창으로 상한이 제한되어 과도하게 큰 모델 메타데이터가 그 외에는 유효한 사용자 캡을 거부하지 못하게 합니다. 이 사전 점검에 걸리면 서버/모델 컨텍스트 제한을 높이거나 더 큰 모델을 선택하세요.
- 컨텍스트 오류가 있나요? `contextWindow`를 낮추거나 서버 제한을 높이세요.
- OpenAI 호환 서버가 `messages[].content ... expected a string`을 반환하나요?
  해당 모델 항목에 `compat.requiresStringContent: true`를 추가하세요.
- OpenAI 호환 서버가 `validation.keys`를 반환하거나 메시지 항목이 `role`과 `content`만 허용한다고 하나요?
  해당 모델 항목에 `compat.strictMessageKeys: true`를 추가하세요.
- 직접 실행한 작은 `/v1/chat/completions` 호출은 작동하지만 `openclaw infer model run --local`이
  Gemma 또는 다른 로컬 모델에서 실패하나요? 먼저 provider URL, 모델 ref, auth
  marker, 서버 로그를 확인하세요. 로컬 `model run`에는 에이전트 도구가 포함되지 않습니다.
  로컬 `model run`은 성공하지만 더 큰 에이전트 턴이 실패한다면 `localModelLean` 또는
  `compat.supportsTools: false`로 에이전트 도구 범위를 줄이세요.
- 도구 호출이 원시 JSON/XML/ReAct 텍스트로 나타나거나 provider가
  빈 `tool_calls` 배열을 반환하나요? assistant 텍스트를 도구 실행으로 맹목적으로 변환하는
  프록시를 추가하지 마세요. 먼저 서버 채팅 템플릿/파서를 수정하세요. 도구 사용을 강제할 때만
  모델이 작동한다면 위의 모델별 `params.extra_body.tool_choice: "required"` 오버라이드를
  추가하고, 모든 턴에서 도구 호출이 예상되는 세션에만 해당 모델 항목을 사용하세요.
- 안전: 로컬 모델은 provider 측 필터를 건너뜁니다. 프롬프트 인젝션 영향 범위를 제한하려면 에이전트를 좁게 유지하고 Compaction을 켜 두세요.

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference)
- [모델 failover](/ko/concepts/model-failover)
