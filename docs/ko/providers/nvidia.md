---
read_when:
    - OpenClaw에서 오픈 모델을 무료로 사용하고 싶습니다
    - '`NVIDIA_API_KEY` 설정이 필요합니다'
summary: OpenClaw에서 NVIDIA의 OpenAI 호환 API 사용하기
title: NVIDIA
x-i18n:
    generated_at: "2026-04-12T23:31:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45048037365138141ee82cefa0c0daaf073a1c2ae3aa7b23815f6ca676fc0d3e
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA는 `https://integrate.api.nvidia.com/v1`에서 무료 오픈 모델용 OpenAI 호환 API를 제공합니다. [build.nvidia.com](https://build.nvidia.com/settings/api-keys)에서 발급한 API 키로 인증하세요.

## 시작하기

<Steps>
  <Step title="API 키 가져오기">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="키를 내보내고 온보딩 실행">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="NVIDIA 모델 설정">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
환경 변수 대신 `--token`을 전달하면 값이 셸 기록과 `ps` 출력에 남습니다. 가능하면 `NVIDIA_API_KEY` 환경 변수를 사용하는 것이 좋습니다.
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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 기본 제공 카탈로그

| Model ref                                  | Name                         | 컨텍스트 | 최대 출력 |
| ------------------------------------------ | ---------------------------- | -------- | --------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192     |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192     |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192     |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192     |

## 고급 참고 사항

<AccordionGroup>
  <Accordion title="자동 활성화 동작">
    `NVIDIA_API_KEY` 환경 변수가 설정되면 provider가 자동으로 활성화됩니다. 키 외에는 명시적인 provider 구성이 필요하지 않습니다.
  </Accordion>

  <Accordion title="카탈로그 및 가격">
    번들 카탈로그는 정적입니다. NVIDIA가 현재 나열된 모델에 대해 무료 API 액세스를 제공하므로, 비용은 소스에서 기본값 `0`으로 설정되어 있습니다.
  </Accordion>

  <Accordion title="OpenAI 호환 엔드포인트">
    NVIDIA는 표준 `/v1` completions 엔드포인트를 사용합니다. NVIDIA base URL과 함께라면 모든 OpenAI 호환 도구가 별도 설정 없이 동작해야 합니다.
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA 모델은 현재 무료로 사용할 수 있습니다. 최신 제공 여부와 rate-limit 세부 정보는 [build.nvidia.com](https://build.nvidia.com/)에서 확인하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, provider에 대한 전체 구성 참조입니다.
  </Card>
</CardGroup>
