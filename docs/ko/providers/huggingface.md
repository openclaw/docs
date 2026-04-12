---
read_when:
    - OpenClaw에서 Hugging Face Inference를 사용하려고 합니다
    - HF 토큰 환경 변수 또는 CLI 인증 선택지가 필요합니다
summary: Hugging Face Inference 설정(인증 + 모델 선택)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-12T23:31:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7787fce1acfe81adb5380ab1c7441d661d03c574da07149c037d3b6ba3c8e52a
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers)는 단일 라우터 API를 통해 OpenAI 호환 chat completions를 제공합니다. 하나의 토큰으로 많은 모델(DeepSeek, Llama 등)에 접근할 수 있습니다. OpenClaw는 **OpenAI 호환 엔드포인트**(chat completions 전용)를 사용합니다. text-to-image, 임베딩 또는 음성에는 [HF inference clients](https://huggingface.co/docs/api-inference/quicktour)를 직접 사용하세요.

- Provider: `huggingface`
- 인증: `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN` (**Make calls to Inference Providers** 권한이 있는 세분화 토큰)
- API: OpenAI 호환 (`https://router.huggingface.co/v1`)
- 과금: 단일 HF 토큰, [요금](https://huggingface.co/docs/inference-providers/pricing)은 provider 요율을 따르며 무료 등급이 있습니다.

## 시작하기

<Steps>
  <Step title="세분화 토큰 생성">
    [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)로 이동해 새 세분화 토큰을 생성하세요.

    <Warning>
    토큰에는 반드시 **Make calls to Inference Providers** 권한이 활성화되어 있어야 하며, 그렇지 않으면 API 요청이 거부됩니다.
    </Warning>

  </Step>
  <Step title="온보딩 실행">
    provider 드롭다운에서 **Hugging Face**를 선택한 다음, 프롬프트가 표시되면 API 키를 입력하세요:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="기본 모델 선택">
    **Default Hugging Face model** 드롭다운에서 원하는 모델을 선택하세요. 유효한 토큰이 있으면 목록은 Inference API에서 로드되고, 그렇지 않으면 내장 목록이 표시됩니다. 선택한 항목은 기본 모델로 저장됩니다.

    나중에 config에서 기본 모델을 설정하거나 변경할 수도 있습니다:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### 비대화형 설정

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

이렇게 하면 `huggingface/deepseek-ai/DeepSeek-R1`이 기본 모델로 설정됩니다.

## 모델 ID

모델 참조는 `huggingface/<org>/<model>` 형식(Hub 스타일 ID)을 사용합니다. 아래 목록은 **GET** `https://router.huggingface.co/v1/models`에서 가져온 것이며, 카탈로그에는 더 많은 모델이 포함될 수 있습니다.

| 모델 | 참조 (`huggingface/` 접두사 추가) |
| ---------------------- | ----------------------------------- |
| DeepSeek R1 | `deepseek-ai/DeepSeek-R1` |
| DeepSeek V3.2 | `deepseek-ai/DeepSeek-V3.2` |
| Qwen3 8B | `Qwen/Qwen3-8B` |
| Qwen2.5 7B Instruct | `Qwen/Qwen2.5-7B-Instruct` |
| Qwen3 32B | `Qwen/Qwen3-32B` |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct | `meta-llama/Llama-3.1-8B-Instruct` |
| GPT-OSS 120B | `openai/gpt-oss-120b` |
| GLM 4.7 | `zai-org/GLM-4.7` |
| Kimi K2.5 | `moonshotai/Kimi-K2.5` |

<Tip>
어떤 모델 ID에도 `:fastest` 또는 `:cheapest`를 덧붙일 수 있습니다. 기본 순서는 [Inference Provider settings](https://hf.co/settings/inference-providers)에서 설정하세요. 전체 목록은 [Inference Providers](https://huggingface.co/docs/inference-providers)와 **GET** `https://router.huggingface.co/v1/models`를 참고하세요.
</Tip>

## 고급 세부 사항

<AccordionGroup>
  <Accordion title="모델 검색과 온보딩 드롭다운">
    OpenClaw는 **Inference 엔드포인트를 직접 호출**하여 모델을 검색합니다:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (선택 사항: 전체 목록을 보려면 `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` 또는 `$HF_TOKEN`을 보내세요. 일부 엔드포인트는 인증 없이 부분 집합만 반환합니다.) 응답은 OpenAI 스타일의 `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`입니다.

    Hugging Face API 키를 구성하면(온보딩, `HUGGINGFACE_HUB_TOKEN`, 또는 `HF_TOKEN`을 통해) OpenClaw는 이 GET 요청을 사용해 사용 가능한 chat-completion 모델을 검색합니다. **대화형 설정** 중에는 토큰을 입력한 뒤 이 목록(또는 요청이 실패할 경우 내장 카탈로그)으로 채워진 **Default Hugging Face model** 드롭다운이 표시됩니다. 런타임(예: Gateway 시작)에서도 키가 있으면 OpenClaw는 다시 **GET** `https://router.huggingface.co/v1/models`를 호출해 카탈로그를 새로 고칩니다. 이 목록은 컨텍스트 창과 비용 같은 메타데이터를 위한 내장 카탈로그와 병합됩니다. 요청이 실패하거나 키가 설정되지 않으면 내장 카탈로그만 사용됩니다.

  </Accordion>

  <Accordion title="모델 이름, 별칭, 정책 접미사">
    - **API의 이름:** API가 `name`, `title`, 또는 `display_name`을 반환하면 모델 표시 이름은 **GET /v1/models에서 수집**됩니다. 그렇지 않으면 모델 ID에서 파생됩니다(예: `deepseek-ai/DeepSeek-R1`은 "DeepSeek R1"이 됩니다).
    - **표시 이름 재정의:** config에서 모델별 사용자 지정 레이블을 설정해 CLI와 UI에서 원하는 방식으로 표시할 수 있습니다:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **정책 접미사:** OpenClaw의 번들 Hugging Face 문서와 도우미는 현재 다음 두 접미사를 내장 정책 변형으로 취급합니다:
      - **`:fastest`** — 가장 높은 처리량.
      - **`:cheapest`** — 출력 토큰당 가장 낮은 비용.

      이를 `models.providers.huggingface.models`에 별도 항목으로 추가하거나, 접미사를 포함한 `model.primary`를 설정할 수 있습니다. [Inference Provider settings](https://hf.co/settings/inference-providers)에서 기본 provider 순서를 설정할 수도 있습니다(접미사 없음 = 해당 순서 사용).

    - **Config 병합:** `models.providers.huggingface.models`(예: `models.json`)의 기존 항목은 config 병합 시 유지됩니다. 따라서 այնտեղ 설정한 사용자 지정 `name`, `alias`, 또는 모델 옵션은 보존됩니다.

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되면 `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`이 해당 프로세스에서 사용 가능하도록 하세요(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).

    <Note>
    OpenClaw는 `HUGGINGFACE_HUB_TOKEN`과 `HF_TOKEN`을 모두 env var 별칭으로 허용합니다. 둘 중 어느 것이든 동작합니다. 둘 다 설정되면 `HUGGINGFACE_HUB_TOKEN`이 우선합니다.
    </Note>

  </Accordion>

  <Accordion title="Config: Qwen 폴백이 있는 DeepSeek R1">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: cheapest 및 fastest 변형이 있는 Qwen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: 별칭이 있는 DeepSeek + Llama + GPT-OSS">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: 정책 접미사가 있는 여러 Qwen 및 DeepSeek">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 provider" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 참조, 장애 조치 동작 개요.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법.
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    공식 Hugging Face Inference Providers 문서.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 config 참조.
  </Card>
</CardGroup>
