---
read_when:
    - 자체 GPU 장비에서 모델을 제공하려는 경우
    - LM Studio 또는 OpenAI 호환 프록시를 연결하는 중입니다
    - 가장 안전한 로컬 모델 지침이 필요합니다
summary: 로컬 LLM에서 OpenClaw 실행 (LM Studio, vLLM, LiteLLM, 사용자 지정 OpenAI 엔드포인트)
title: 로컬 모델
x-i18n:
    generated_at: "2026-04-30T06:31:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ec1be4eac371328c1efe80b71450019f68fb1114df90db1532a4ff72bfa0ab1
    source_path: gateway/local-models.md
    workflow: 16
---

로컬도 가능하지만, OpenClaw는 큰 컨텍스트와 프롬프트 인젝션에 대한 강력한 방어를 기대합니다. 작은 카드는 컨텍스트를 잘라 내고 안전성을 약화시킵니다. 목표를 높게 잡으세요: **최대 사양 Mac Studio 2대 이상 또는 동급 GPU 장비(약 $30k+)**. 단일 **24 GB** GPU는 더 가벼운 프롬프트에서만 더 높은 지연 시간으로 동작합니다. 실행할 수 있는 **가장 큰 / 풀사이즈 모델 변형**을 사용하세요. 공격적으로 양자화된 체크포인트나 “small” 체크포인트는 프롬프트 인젝션 위험을 높입니다([Security](/ko/gateway/security) 참조).

마찰이 가장 적은 로컬 설정을 원한다면 [LM Studio](/ko/providers/lmstudio) 또는 [Ollama](/ko/providers/ollama)와 `openclaw onboard`로 시작하세요. 이 페이지는 고급 로컬 스택과 사용자 지정 OpenAI 호환 로컬 서버를 위한 견해가 반영된 가이드입니다.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 사용자:** 공식 Ollama Linux 설치 관리자는 `Restart=always`가 설정된 systemd 서비스를 활성화합니다. WSL2 GPU 설정에서는 자동 시작이 부팅 중 마지막 모델을 다시 로드하고 호스트 메모리를 고정할 수 있습니다. Ollama를 활성화한 뒤 WSL2 VM이 반복적으로 다시 시작되면 [WSL2 crash loop](/ko/providers/ollama#wsl2-crash-loop-repeated-reboots)을 참조하세요.
</Warning>

## 권장: LM Studio + 대형 로컬 모델(Responses API)

현재 가장 좋은 로컬 스택입니다. LM Studio에서 대형 모델(예: 풀사이즈 Qwen, DeepSeek 또는 Llama 빌드)을 로드하고, 로컬 서버(기본값 `http://127.0.0.1:1234`)를 활성화한 뒤, 최종 텍스트와 추론을 분리해 유지하도록 Responses API를 사용하세요.

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
- LM Studio에서 **사용 가능한 가장 큰 모델 빌드**를 다운로드하고(“small”/고도로 양자화된 변형은 피하세요), 서버를 시작한 뒤 `http://127.0.0.1:1234/v1/models`에 해당 모델이 나열되는지 확인합니다.
- `my-local-model`을 LM Studio에 표시된 실제 모델 ID로 바꿉니다.
- 모델을 로드된 상태로 유지합니다. 콜드 로드는 시작 지연 시간을 추가합니다.
- LM Studio 빌드가 다르면 `contextWindow`/`maxTokens`를 조정합니다.
- WhatsApp의 경우 최종 텍스트만 전송되도록 Responses API를 고수하세요.

로컬로 실행하더라도 호스팅 모델을 계속 구성해 두세요. `models.mode: "merge"`를 사용하면 폴백을 계속 사용할 수 있습니다.

### 하이브리드 구성: 호스팅 primary, 로컬 fallback

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

### 호스팅 안전망이 있는 로컬 우선

primary와 fallback 순서를 바꾸세요. 같은 providers 블록과 `models.mode: "merge"`를 유지하면 로컬 박스가 내려갔을 때 Sonnet 또는 Opus로 폴백할 수 있습니다.

### 지역 호스팅 / 데이터 라우팅

- 호스팅 MiniMax/Kimi/GLM 변형도 OpenRouter에서 지역 고정 엔드포인트(예: 미국 호스팅)로 제공됩니다. Anthropic/OpenAI 폴백에 `models.mode: "merge"`를 계속 사용하면서도 선택한 관할권 안에 트래픽을 유지하려면 해당 지역 변형을 선택하세요.
- 로컬 전용은 여전히 가장 강력한 개인정보 보호 경로입니다. 호스팅 지역 라우팅은 제공자 기능이 필요하지만 데이터 흐름을 제어하고 싶을 때의 중간 지점입니다.

## 기타 OpenAI 호환 로컬 프록시

MLX(`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy 또는 사용자 지정 Gateway는 OpenAI 스타일 `/v1/chat/completions` 엔드포인트를 노출하면 동작합니다. 백엔드가 `/v1/responses` 지원을 명시적으로 문서화하지 않는 한 Chat Completions 어댑터를 사용하세요. 위 provider 블록을 엔드포인트와 모델 ID로 바꾸세요.

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

`baseUrl`이 있는 사용자 지정 provider에서 `api`를 생략하면 OpenClaw는 기본값으로 `openai-completions`를 사용합니다. `127.0.0.1` 같은 loopback 엔드포인트는 자동으로 신뢰됩니다. LAN, tailnet, 비공개 DNS 엔드포인트에는 여전히 `request.allowPrivateNetwork: true`가 필요합니다.

`models.providers.<id>.models[].id` 값은 provider 로컬입니다. 여기에 provider 접두사를 포함하지 마세요. 예를 들어 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`로 시작한 MLX 서버는 다음 카탈로그 id와 모델 참조를 사용해야 합니다.

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

이미지 첨부 파일이 agent 턴에 주입되도록 로컬 또는 프록시된 비전 모델에 `input: ["text", "image"]`를 설정하세요. 대화형 사용자 지정 provider 온보딩은 일반적인 비전 모델 ID를 추론하고 알 수 없는 이름에 대해서만 질문합니다. 비대화형 온보딩도 같은 추론을 사용합니다. 알 수 없는 비전 ID에는 `--custom-image-input`을, 엔드포인트 뒤의 알려진 형태의 모델이 텍스트 전용일 때는 `--custom-text-input`을 사용하세요.

호스팅 모델이 폴백으로 계속 사용 가능하도록 `models.mode: "merge"`를 유지하세요. 느린 로컬 또는 원격 모델 서버에는 `agents.defaults.timeoutSeconds`를 올리기 전에 `models.providers.<id>.timeoutSeconds`를 사용하세요. provider 타임아웃은 연결, 헤더, 본문 스트리밍, 전체 보호된 fetch 중단을 포함한 모델 HTTP 요청에만 적용됩니다.

<Note>
사용자 지정 OpenAI 호환 provider의 경우, `baseUrl`이 loopback, 비공개 LAN, `.local` 또는 단일 호스트 이름으로 확인되면 `apiKey: "ollama-local"` 같은 비밀이 아닌 로컬 마커를 저장해도 허용됩니다. OpenClaw는 이를 누락된 키로 보고하는 대신 유효한 로컬 자격 증명으로 처리합니다. 공개 호스트 이름을 받는 provider에는 실제 값을 사용하세요.
</Note>

로컬/프록시된 `/v1` 백엔드의 동작 참고 사항:

- OpenClaw는 이를 네이티브 OpenAI 엔드포인트가 아니라 프록시 스타일 OpenAI 호환 경로로 처리합니다.
- 네이티브 OpenAI 전용 요청 셰이핑은 여기서 적용되지 않습니다. `service_tier` 없음, Responses `store` 없음, OpenAI reasoning 호환 페이로드 셰이핑 없음, 프롬프트 캐시 힌트 없음
- 숨겨진 OpenClaw 속성 헤더(`originator`, `version`, `User-Agent`)는 이러한 사용자 지정 프록시 URL에 주입되지 않습니다.

더 엄격한 OpenAI 호환 백엔드에 대한 호환성 참고 사항:

- 일부 서버는 Chat Completions에서 구조화된 콘텐츠 파트 배열이 아니라 문자열 `messages[].content`만 받습니다. 이러한 엔드포인트에는 `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
- 일부 로컬 모델은 `[tool_name]` 뒤에 JSON과 `[END_TOOL_REQUEST]`가 이어지는 것처럼 독립적인 대괄호 도구 요청을 텍스트로 내보냅니다. OpenClaw는 해당 이름이 그 턴에 등록된 도구와 정확히 일치할 때만 이를 실제 도구 호출로 승격합니다. 그렇지 않으면 해당 블록은 지원되지 않는 텍스트로 처리되어 사용자에게 보이는 응답에서 숨겨집니다.
- 모델이 도구 호출처럼 보이는 JSON, XML 또는 ReAct 스타일 텍스트를 내보내지만 provider가 구조화된 호출을 내보내지 않은 경우, OpenClaw는 이를 텍스트로 남기고 가능한 경우 run id, provider/model, 감지된 패턴, 도구 이름과 함께 경고를 기록합니다. 이를 완료된 도구 실행이 아니라 provider/model 도구 호출 비호환성으로 간주하세요.
- 원시 JSON, XML, ReAct 구문 또는 provider 응답의 빈 `tool_calls` 배열처럼 도구가 실행되지 않고 assistant 텍스트로 나타나는 경우, 먼저 서버가 도구 호출을 지원하는 채팅 템플릿/파서를 사용 중인지 확인하세요. 도구 사용이 강제될 때만 파서가 동작하는 OpenAI 호환 Chat Completions 백엔드의 경우, 텍스트 파싱에 의존하지 말고 모델별 요청 override를 설정하세요.

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

  모든 일반 턴이 도구를 호출해야 하는 모델/세션에만 이것을 사용하세요. 이는 OpenClaw의 기본 프록시 값인 `tool_choice: "auto"`를 override합니다. `local/my-local-model`을 `openclaw models list`에 표시된 정확한 provider/model 참조로 바꾸세요.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 사용자 지정 OpenAI 호환 모델이 기본 제공 프로필을 넘어서는 OpenAI reasoning efforts를 받는 경우, 모델 compat 블록에 이를 선언하세요. 여기에 `"xhigh"`를 추가하면 `/think xhigh`, 세션 선택기, Gateway 검증, `llm-task` 검증이 해당 구성된 provider/model 참조에 대해 그 수준을 노출합니다.

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

- 일부 더 작거나 더 엄격한 로컬 백엔드는 특히 도구 스키마가 포함될 때 OpenClaw의 전체 agent-runtime 프롬프트 형태에서 불안정합니다. 먼저 간소한 로컬 프로브로 provider 경로를 확인하세요.

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  전체 agent 프롬프트 형태 없이 Gateway 경로를 확인하려면 대신 Gateway 모델 프로브를 사용하세요.

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  로컬 및 Gateway 모델 프로브는 모두 제공된 프롬프트만 전송합니다. Gateway 프로브는 여전히 Gateway 라우팅, 인증, provider 선택을 검증하지만, 이전 세션 transcript, AGENTS/bootstrap 컨텍스트, context-engine 어셈블리, 도구, 번들 MCP 서버는 의도적으로 건너뜁니다.

  그 작업이 성공하지만 일반 OpenClaw agent 턴이 실패한다면, 먼저
  `browser`, `cron`, `message` 같은 무거운
  기본 도구를 제거하도록 `agents.defaults.experimental.localModelLean: true`를 시도하세요. 이는 실험적
  플래그이며, 안정적인 기본 모드 설정이 아닙니다. 자세한 내용은
  [실험적 기능](/ko/concepts/experimental-features)을 참조하세요. 그래도 실패하면
  `models.providers.<provider>.models[].compat.supportsTools: false`를 시도하세요.

- 백엔드가 여전히 더 큰 OpenClaw 실행에서만 실패한다면, 남은 문제는
  대개 OpenClaw의 전송 계층이 아니라 업스트림 모델/서버 용량 또는 백엔드 버그입니다.

## 문제 해결

- Gateway가 프록시에 연결할 수 있나요? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio 모델이 언로드되었나요? 다시 로드하세요. 콜드 스타트는 흔한 “멈춤” 원인입니다.
- 로컬 서버가 `terminated`, `ECONNRESET`을 표시하거나 턴 중간에 스트림을 닫나요?
  OpenClaw는 낮은 카디널리티의 `model.call.error.failureKind`와
  OpenClaw 프로세스 RSS/힙 스냅샷을 진단 정보에 기록합니다. LM Studio/Ollama
  메모리 압박의 경우, 해당 타임스탬프를 서버 로그 또는 macOS crash /
  jetsam 로그와 대조하여 모델 서버가 종료되었는지 확인하세요.
- OpenClaw는 감지된 컨텍스트 창이 **32k** 미만이면 경고하고 **16k** 미만이면 차단합니다. 해당 사전 검사에 걸리면 서버/모델 컨텍스트 제한을 높이거나 더 큰 모델을 선택하세요.
- 컨텍스트 오류가 있나요? `contextWindow`를 낮추거나 서버 제한을 높이세요.
- OpenAI 호환 서버가 `messages[].content ... expected a string`을 반환하나요?
  해당 모델 항목에 `compat.requiresStringContent: true`를 추가하세요.
- 작은 `/v1/chat/completions` 직접 호출은 작동하지만 `openclaw infer model run --local`이
  Gemma 또는 다른 로컬 모델에서 실패하나요? 먼저 provider URL, 모델 참조, 인증
  마커, 서버 로그를 확인하세요. 로컬 `model run`에는 agent 도구가 포함되지 않습니다.
  로컬 `model run`은 성공하지만 더 큰 agent 턴이 실패한다면, `localModelLean` 또는
  `compat.supportsTools: false`로 agent 도구 표면을 줄이세요.
- 도구 호출이 원시 JSON/XML/ReAct 텍스트로 표시되거나 provider가 빈
  `tool_calls` 배열을 반환하나요? assistant 텍스트를 무작정 도구 실행으로
  변환하는 프록시는 추가하지 마세요. 먼저 서버 chat 템플릿/파서를 수정하세요. 모델이
  도구 사용을 강제할 때만 작동한다면, 위의 모델별
  `params.extra_body.tool_choice: "required"` 재정의를 추가하고 모든 턴에서 도구 호출이 예상되는 세션에만 해당 모델
  항목을 사용하세요.
- 안전: 로컬 모델은 provider 측 필터를 건너뜁니다. prompt injection 영향 범위를 제한하려면 agents를 좁게 유지하고 compaction을 켜두세요.

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference)
- [모델 장애 조치](/ko/concepts/model-failover)
