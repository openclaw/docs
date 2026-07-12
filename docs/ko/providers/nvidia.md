---
read_when:
    - OpenClaw에서 오픈 모델을 무료로 사용하고 싶습니다
    - NVIDIA_API_KEY 설정이 필요합니다
    - NVIDIA를 통해 Nemotron 3 Ultra를 사용하려고 합니다
summary: OpenClaw에서 NVIDIA의 OpenAI 호환 API 사용하기
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T01:08:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA는 [build.nvidia.com](https://build.nvidia.com/settings/api-keys)에서 발급한 API 키로 인증하는 OpenAI 호환 API `https://integrate.api.nvidia.com/v1`을 통해 오픈 모델을 무료로 제공합니다. OpenClaw는 NVIDIA 제공자의 기본 모델로 장문 컨텍스트 에이전트 작업을 위한 NVIDIA의 총 550B/활성 55B 추론 모델인 Nemotron 3 Ultra를 사용합니다.

## 시작하기

<Steps>
  <Step title="API 키 발급">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="키 내보내기 및 온보딩 실행">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="NVIDIA 모델 설정">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

비대화형 설정에서는 키를 직접 전달합니다.

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key`를 사용하면 키가 셸 기록과 `ps` 출력에 남습니다. 가능하면 `NVIDIA_API_KEY` 환경 변수를 사용하세요.
</Warning>

## 구성 예시

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## 주요 카탈로그

NVIDIA API 키가 구성되어 있으면 설정 및 모델 선택 경로에서 `https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json`에 있는 NVIDIA의 공개 주요 모델 카탈로그를 가져와 결과를 24시간 동안 캐시합니다(처음 32개 항목을 무료 텍스트 입력 행으로 가져옴). 따라서 build.nvidia.com의 새로운 주요 모델은 OpenClaw 릴리스를 기다리지 않고 설정 및 모델 선택 화면에 표시됩니다. 실시간 피드를 사용할 수 있으면 NVIDIA 설정 중 처음 반환된 모델이 미리 선택된 옵션이 됩니다.

가져오기에는 `assets.ngc.nvidia.com`에 대한 고정 HTTPS 호스트 정책이 적용됩니다. NVIDIA API 키가 구성되지 않았거나 피드를 사용할 수 없거나 형식이 잘못된 경우 OpenClaw는 아래의 번들 카탈로그와 번들 기본값으로 대체합니다.

## Nemotron 3 Ultra

Nemotron 3 Ultra는 OpenClaw의 기본 NVIDIA 모델입니다. NVIDIA의 [`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) 빌드 페이지에는 이 모델이 100만 토큰 컨텍스트 사양을 갖춘 무료 엔드포인트로 표시되어 있습니다.

번들 Ultra 행은 기본적으로 `chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`를 전송하므로, 일반 채팅 출력에서 추론 텍스트가 노출되지 않고 표시되는 답변에 내용이 유지됩니다.

가장 뛰어난 기능의 NVIDIA 기본 모델이 필요하면 Ultra를 사용하세요. 더 작은 Nemotron 3 옵션을 원하면 Super를 계속 선택하고, NVIDIA 카탈로그에서 호스팅되는 타사 모델의 컨텍스트, 지연 시간 또는 동작이 더 적합하면 해당 모델 중 하나를 선택하세요.

## 번들 대체 카탈로그

선택 가능한 번들 행은 NVIDIA의 주요 모델 카탈로그를 스냅샷으로 저장한 것입니다. 사용 중단된 호환성 행은 정확한 참조로 계속 확인할 수 있지만 모델 선택기에는 표시되지 않습니다.

| 모델 참조                                  | 이름                  | 컨텍스트   | 최대 출력 |
| ------------------------------------------ | --------------------- | ---------- | --------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576  | 8,192     |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000  | 8,192     |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752    | 8,192     |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144    | 8,192     |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608    | 8,192     |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144    | 16,384    |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144    | 16,384    |

전체 호환성 카탈로그에는 기존 구성을 위해 배포된 다음 참조도 유지됩니다. `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`, `nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5`, `nvidia/minimaxai/minimax-m2.7`. 이러한 모델은 정확한 참조로 계속 사용할 수 있지만 온보딩이나 모델 선택기에는 표시되지 않습니다.

## 고급 구성

<AccordionGroup>
  <Accordion title="자동 활성화 동작">
    `NVIDIA_API_KEY` 환경 변수가 설정되어 있거나 온보딩 중 키가 저장되면 제공자가 자동으로 활성화됩니다. 키 외에 명시적인 제공자 구성은 필요하지 않습니다.
  </Accordion>

  <Accordion title="카탈로그 및 가격">
    NVIDIA 인증이 구성되어 있으면 OpenClaw는 NVIDIA의 공개 주요 모델 카탈로그를 우선 사용하고 24시간 동안 캐시합니다. 선택 가능한 번들 대체 항목은 NVIDIA 주요 모델 카탈로그의 정적 스냅샷이며, 사용 중단된 정확한 참조 호환성 행은 모델 선택기에서 숨겨집니다. NVIDIA가 현재 나열된 모델에 무료 API 액세스를 제공하므로 소스에서 비용 기본값은 `0`입니다.
  </Accordion>

  <Accordion title="OpenAI 호환 엔드포인트">
    OpenClaw는 표준 `/v1` 채팅 완성 경로에 대해 `openai-completions` 어댑터를 사용하여 NVIDIA와 통신합니다. 모든 OpenAI 호환 도구는 NVIDIA 기본 URL로 별도 설정 없이 작동합니다.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra 추론 매개변수">
    NVIDIA의 Ultra 샘플 요청은 추론 출력에 `chat_template_kwargs.enable_thinking`과 `reasoning_budget`을 사용합니다. OpenClaw의 번들 Ultra 행은 일반 채팅 사용을 위해 기본적으로 템플릿 추론을 비활성화합니다. NVIDIA 추론 출력을 사용하도록 설정하거나 다른 NVIDIA 전용 요청 필드를 강제로 지정해야 하는 경우 모델별 매개변수를 설정하고 제공자별 재정의 범위를 NVIDIA 모델로 제한하세요.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.chat_template_kwargs`는 전체 객체를 대체하지 않고 요청에 이미 있는 `chat_template_kwargs`에 병합됩니다. `params.extra_body`는 최종 OpenAI 호환 요청 본문 재정의이며 충돌하는 페이로드 키를 덮어쓰므로, 선택한 엔드포인트에 대해 NVIDIA가 문서화한 필드에만 사용하세요.

  </Accordion>

  <Accordion title="느린 사용자 지정 제공자 응답">
    NVIDIA에서 호스팅되는 일부 사용자 지정 모델은 첫 번째 응답 청크를 내보내기까지 기본 약 120초의 모델 유휴 감시 제한보다 오래 걸릴 수 있습니다. 사용자 지정 NVIDIA 제공자 항목에서는 전체 에이전트 런타임 제한 시간 대신 제공자 제한 시간을 늘리세요. `timeoutSeconds`는 제공자 HTTP 요청에 적용되며 해당 제공자의 유휴/스트림 감시 상한을 늘립니다.

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
현재 NVIDIA 모델은 무료로 사용할 수 있습니다. 최신 이용 가능 여부와 요청 제한 세부 정보는 [build.nvidia.com](https://build.nvidia.com/)에서 확인하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델 및 제공자에 대한 전체 구성 참조입니다.
  </Card>
</CardGroup>
