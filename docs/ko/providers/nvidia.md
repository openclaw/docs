---
read_when:
    - OpenClaw에서 오픈 모델을 무료로 사용하려고 합니다
    - NVIDIA_API_KEY 설정이 필요합니다
    - NVIDIA를 통해 Nemotron 3 Ultra를 사용하려는 경우
summary: OpenClaw에서 NVIDIA의 OpenAI 호환 API 사용
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:03:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA는 오픈 모델을 무료로 사용할 수 있도록 `https://integrate.api.nvidia.com/v1`에서 OpenAI 호환 API를 제공합니다. [build.nvidia.com](https://build.nvidia.com/settings/api-keys)에서 발급한 API 키로 인증하세요. OpenClaw는 NVIDIA provider의 기본값을 긴 컨텍스트 에이전트 작업을 위한 NVIDIA의 550B 전체 / 55B 활성 추론 모델인 Nemotron 3 Ultra로 설정합니다.

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="키를 내보내고 온보딩 실행하기">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="NVIDIA 모델 설정하기">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
env var 대신 `--nvidia-api-key`를 전달하면 값이 셸 기록과 `ps` 출력에 남습니다. 가능하면 `NVIDIA_API_KEY` 환경 변수를 사용하는 것이 좋습니다.
</Warning>

비대화형 설정에서는 키를 직접 전달할 수도 있습니다.

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

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

## 추천 카탈로그

NVIDIA API 키가 구성되어 있으면 OpenClaw 설정 및 모델 선택 경로는 `https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json`에서 NVIDIA의 공개 추천 모델 카탈로그를 시도하고, 순위가 매겨진 결과를 24시간 동안 캐시합니다. 따라서 build.nvidia.com의 새 추천 모델은 OpenClaw 릴리스를 기다리지 않고 설정 및 모델 선택 화면에 표시됩니다. 라이브 피드를 사용할 수 있으면 반환된 첫 번째 모델이 NVIDIA 설정 중 표시되는 기본 옵션입니다.

가져오기는 `assets.ngc.nvidia.com`에 대해 고정 HTTPS 호스트 정책을 사용합니다. NVIDIA API 키가 구성되어 있지 않거나 해당 공개 카탈로그를 사용할 수 없거나 형식이 잘못된 경우 OpenClaw는 아래의 번들 카탈로그 및 번들 기본값으로 대체합니다.

## Nemotron 3 Ultra

Nemotron 3 Ultra는 OpenClaw의 기본 NVIDIA 모델입니다. [`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)에 대한 NVIDIA의 build 페이지는 이 모델을 1M 토큰 컨텍스트 사양을 갖춘 사용 가능한 무료 엔드포인트로 표시합니다. 번들 카탈로그는 호스팅 엔드포인트에 대한 NVIDIA의 현재 OpenAI 호환 샘플 요청과 맞추기 위해 16,384 토큰 최대 출력을 기록합니다.

가장 높은 성능의 NVIDIA 기본값이 필요하면 Ultra를 사용하세요. 더 작은 Nemotron 3 옵션이 필요하면 Super를 선택한 상태로 유지하거나, 컨텍스트, 지연 시간 또는 동작이 더 잘 맞는 경우 NVIDIA 카탈로그에서 호스팅되는 타사 모델 중 하나를 선택하세요. 번들 Ultra 행은 기본적으로 `chat_template_kwargs.enable_thinking: false`와 `force_nonempty_content: true`를 전송하여 일반 채팅 출력이 추론 텍스트를 노출하지 않고 보이는 답변에 유지되도록 합니다.

## 번들 대체 카탈로그

| Model ref                                  | 이름                         | 컨텍스트  | 최대 출력 | 참고                              |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | 기본값                            |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192      | 추천 대체                         |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | 추천 대체                         |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | 추천 대체                         |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | 추천 대체                         |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | 사용 중단됨, 업그레이드 호환성    |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | 사용 중단됨, 업그레이드 호환성    |

## 고급 구성

<AccordionGroup>
  <Accordion title="자동 활성화 동작">
    `NVIDIA_API_KEY` 환경 변수가 설정되어 있으면 provider가 자동으로 활성화됩니다. 키 이외의 명시적 provider 구성은 필요하지 않습니다.
  </Accordion>

  <Accordion title="카탈로그 및 가격">
    OpenClaw는 NVIDIA 인증이 구성되어 있으면 NVIDIA의 공개 추천 모델 카탈로그를 우선 사용하고 이를 24시간 동안 캐시합니다. 번들 대체 카탈로그는 정적이며 업그레이드 호환성을 위해 사용 중단된 출시 ref를 유지합니다. NVIDIA가 현재 나열된 모델에 대해 무료 API 액세스를 제공하므로 소스에서 비용 기본값은 `0`입니다.
  </Accordion>

  <Accordion title="OpenAI 호환 엔드포인트">
    NVIDIA는 표준 `/v1` completions 엔드포인트를 사용합니다. 모든 OpenAI 호환 도구는 NVIDIA 기본 URL로 바로 작동해야 합니다.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra 추론 매개변수">
    NVIDIA의 Ultra 샘플 요청은 추론 출력에 `chat_template_kwargs.enable_thinking`과 `reasoning_budget`을 사용합니다. OpenClaw의 번들 Ultra 행은 일반 채팅 사용을 위해 기본적으로 템플릿 thinking을 비활성화합니다. NVIDIA 추론 출력을 사용하도록 선택하거나 다른 NVIDIA 전용 요청 필드를 강제해야 하는 경우 모델별 params를 설정하고 provider별 override를 NVIDIA 모델로 한정하세요.

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

    `params.extra_body`는 최종 OpenAI 호환 요청 본문 override이므로 NVIDIA가 선택한 엔드포인트에 대해 문서화한 필드에만 사용하세요.

  </Accordion>

  <Accordion title="느린 사용자 지정 provider 응답">
    일부 NVIDIA 호스팅 사용자 지정 모델은 첫 응답 청크를 내보내기 전에 기본 모델 유휴 watchdog보다 더 오래 걸릴 수 있습니다. 사용자 지정 NVIDIA provider 항목의 경우 전체 에이전트 런타임 제한 시간을 늘리지 말고 provider 제한 시간을 늘리세요.

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
NVIDIA 모델은 현재 무료로 사용할 수 있습니다. 최신 제공 여부 및 rate-limit 세부 정보는 [build.nvidia.com](https://build.nvidia.com/)에서 확인하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 ref, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, provider에 대한 전체 구성 참조입니다.
  </Card>
</CardGroup>
