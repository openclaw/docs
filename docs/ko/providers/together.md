---
read_when:
    - Together AI를 OpenClaw와 함께 사용하려고 합니다
    - API 키 env var 또는 CLI auth 선택이 필요합니다
summary: Together AI 설정(auth + 모델 선택)
title: Together AI
x-i18n:
    generated_at: "2026-04-12T23:33:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33531a1646443ac2e46ee1fbfbb60ec71093611b022618106e8e5435641680ac
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai)는 통합 API를 통해 Llama, DeepSeek, Kimi 등을 포함한 주요 오픈소스 모델에 대한 접근을 제공합니다.

| Property | Value |
| -------- | ----- |
| Provider | `together` |
| Auth | `TOGETHER_API_KEY` |
| API | OpenAI-compatible |
| Base URL | `https://api.together.xyz/v1` |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)에서 API 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="기본 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
온보딩 프리셋은 기본 모델로 `together/moonshotai/Kimi-K2.5`를 설정합니다.
</Note>

## 내장 카탈로그

OpenClaw는 다음과 같은 번들 Together 카탈로그를 제공합니다.

| Model ref | Name | Input | Context | Notes |
| --- | --- | --- | --- | --- |
| `together/moonshotai/Kimi-K2.5` | Kimi K2.5 | text, image | 262,144 | 기본 모델; reasoning 활성화 |
| `together/zai-org/GLM-4.7` | GLM 4.7 Fp8 | text | 202,752 | 범용 텍스트 모델 |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | text | 131,072 | 빠른 instruction 모델 |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct` | Llama 4 Scout 17B 16E Instruct | text, image | 10,000,000 | 멀티모달 |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | 멀티모달 |
| `together/deepseek-ai/DeepSeek-V3.1` | DeepSeek V3.1 | text | 131,072 | 범용 텍스트 모델 |
| `together/deepseek-ai/DeepSeek-R1` | DeepSeek R1 | text | 131,072 | reasoning 모델 |
| `together/moonshotai/Kimi-K2-Instruct-0905` | Kimi K2-Instruct 0905 | text | 262,144 | 보조 Kimi 텍스트 모델 |

## 비디오 생성

번들된 `together` Plugin은 공용 `video_generate` tool을 통해 비디오 생성도 등록합니다.

| Property | Value |
| -------------------- | ------------------------------------- |
| Default video model | `together/Wan-AI/Wan2.2-T2V-A14B` |
| Modes | text-to-video, single-image reference |
| Supported parameters | `aspectRatio`, `resolution` |

Together를 기본 비디오 provider로 사용하려면:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
공용 tool parameters, provider 선택, failover 동작은 [Video Generation](/ko/tools/video-generation)을 참고하세요.
</Tip>

<AccordionGroup>
  <Accordion title="환경 참고">
    Gateway가 daemon(launchd/systemd)으로 실행된다면 `TOGETHER_API_KEY`가 해당 프로세스에서 사용 가능하도록 해야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv` 사용).

    <Warning>
    대화형 셸에만 설정된 키는 daemon이 관리하는 gateway 프로세스에서는 보이지 않습니다. 지속적인 사용 가능성을 위해 `~/.openclaw/.env` 또는 `env.shellEnv` config를 사용하세요.
    </Warning>

  </Accordion>

  <Accordion title="문제 해결">
    - 키가 동작하는지 확인: `openclaw models list --provider together`
    - 모델이 나타나지 않는다면, Gateway 프로세스에 대해 올바른 환경에 API 키가 설정되어 있는지 확인하세요.
    - 모델 ref 형식은 `together/<model-id>`입니다.
  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="Model providers" href="/ko/concepts/model-providers" icon="layers">
    Provider 규칙, model refs, failover 동작.
  </Card>
  <Card title="Video generation" href="/ko/tools/video-generation" icon="video">
    공용 비디오 생성 tool parameters와 provider 선택.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration-reference" icon="gear">
    provider settings를 포함한 전체 config schema.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 대시보드, API 문서, 요금제.
  </Card>
</CardGroup>
