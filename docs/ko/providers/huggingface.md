---
read_when:
    - OpenClaw에서 Hugging Face Inference를 사용하려고 합니다
    - HF 토큰 환경 변수 또는 CLI 인증 옵션이 필요합니다.
summary: Hugging Face Inference 설정(인증 + 모델 선택)
title: Hugging Face(추론)
x-i18n:
    generated_at: "2026-07-12T15:39:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers)는 하나의 토큰으로 여러 호스팅 모델(DeepSeek, Llama 등)을 사용할 수 있도록 OpenAI 호환 채팅 완성 라우터를 제공합니다. OpenClaw는 **채팅 완성 엔드포인트만** 사용합니다. 텍스트-이미지 변환, 임베딩 또는 음성 기능에는 [HF 추론 클라이언트](https://huggingface.co/docs/api-inference/quicktour)를 직접 사용하십시오.

| 속성         | 값                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 제공자 ID    | `huggingface`                                                                                                               |
| Plugin       | 번들 제공(기본적으로 활성화되며 설치 단계 없음)                                                                             |
| 인증 환경 변수 | `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`(세분화된 토큰)                                                                     |
| API          | OpenAI 호환(`https://router.huggingface.co/v1`)                                                                              |
| 요금         | 단일 HF 토큰을 사용하며, [요금](https://huggingface.co/docs/inference-providers/pricing)은 무료 등급을 포함한 제공자 요율을 따릅니다 |

## 시작하기

<Steps>
  <Step title="세분화된 토큰 만들기">
    [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)로 이동하여 새로운 세분화된 토큰을 만드십시오.

    <Warning>
    토큰에 **Make calls to Inference Providers** 권한을 활성화해야 합니다. 그렇지 않으면 API 요청이 거부됩니다.
    </Warning>

  </Step>
  <Step title="온보딩 실행하기">
    제공자 드롭다운에서 **Hugging Face**를 선택한 다음, 메시지가 표시되면 API 키를 입력하십시오.

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="기본 모델 선택하기">
    **기본 Hugging Face 모델** 드롭다운에서 모델을 선택하십시오. 토큰이 유효하면 Inference API에서 목록을 불러오고, 그렇지 않으면 OpenClaw가 아래의 기본 제공 카탈로그를 표시합니다. 선택한 모델은 `agents.defaults.model.primary`에 저장됩니다.

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
  <Step title="모델 사용 가능 여부 확인하기">
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

`huggingface/deepseek-ai/DeepSeek-R1`을 기본 모델로 설정합니다.

## 모델 ID

모델 참조는 `huggingface/<org>/<model>` 형식(Hub 스타일 ID)을 사용합니다. OpenClaw의 기본 제공 카탈로그는 다음과 같습니다.

| 모델                         | 참조(`huggingface/` 접두사 사용)          |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
토큰이 유효하면 OpenClaw는 온보딩 시점과 Gateway 시작 시 **GET** `https://router.huggingface.co/v1/models`에서 다른 모든 모델도 검색하므로, 카탈로그에 위의 네 가지 모델보다 훨씬 많은 모델이 포함될 수 있습니다. 모든 모델 ID에 `:fastest` 또는 `:cheapest`를 추가할 수 있으며, HF 라우터는 조건에 맞는 추론 제공자로 라우팅합니다. [Inference Provider settings](https://hf.co/settings/inference-providers)에서 기본 제공자 순서를 설정하십시오.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="모델 검색 및 온보딩 드롭다운">
    OpenClaw는 다음 요청으로 모델을 검색합니다.

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # 또는 $HF_TOKEN
    ```

    응답은 OpenAI 스타일입니다. `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    키가 구성되어 있으면(온보딩, `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`) 대화형 설정 중 **기본 Hugging Face 모델** 드롭다운이 이 엔드포인트의 데이터로 채워집니다. Gateway가 시작될 때도 같은 호출을 반복하여 카탈로그를 새로 고칩니다. 검색된 모델은 위의 기본 제공 카탈로그와 병합됩니다(ID가 일치하면 컨텍스트 창과 비용 등의 메타데이터에 사용됨). 요청이 실패하거나 데이터를 반환하지 않거나 키가 설정되지 않은 경우, OpenClaw는 기본 제공 카탈로그만 사용합니다.

    제공자를 제거하지 않고 검색을 비활성화하려면 다음을 실행하십시오.

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="모델 이름, 별칭 및 정책 접미사">
    - **API의 이름:** 검색된 모델은 API에 `name`, `title` 또는 `display_name`이 있으면 이를 사용합니다. 그렇지 않으면 OpenClaw가 모델 ID에서 이름을 생성합니다(예: `deepseek-ai/DeepSeek-R1`은 "DeepSeek R1"이 됨).
    - **표시 이름 재정의:** 구성에서 모델별 사용자 지정 레이블을 설정하십시오.

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

    - **정책 접미사:** `:fastest`와 `:cheapest`는 HF 라우터 규칙이며 OpenClaw가 다시 작성하는 값이 아닙니다. 접미사는 모델 ID의 일부로 그대로 전송되고, HF 라우터가 조건에 맞는 추론 제공자를 선택합니다. 접미사마다 별도의 별칭을 사용하려면 각 변형을 `models.providers.huggingface.models` 아래(또는 `model.primary`)에 독립된 항목으로 추가하십시오.
    - **구성 병합:** 구성 병합 시 `models.providers.huggingface.models`의 기존 항목(예: `models.json` 내부)은 유지되므로, 여기에서 설정한 사용자 지정 `name`, `alias` 또는 모델 옵션은 재시작 후에도 유지됩니다.

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`을 해당 프로세스에서 사용할 수 있는지 확인하십시오(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 설정).

    <Note>
    OpenClaw는 `HUGGINGFACE_HUB_TOKEN`과 `HF_TOKEN`을 모두 허용합니다. 둘 다 설정된 경우 `HUGGINGFACE_HUB_TOKEN`이 우선합니다.
    </Note>

  </Accordion>

  <Accordion title="구성: 대체 모델을 포함한 DeepSeek R1">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="구성: 최저 비용 및 최고 속도 변형을 포함한 DeepSeek">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="구성: 별칭을 포함한 DeepSeek + Llama + GPT-OSS">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 제공자, 모델 참조 및 장애 조치 동작에 대한 개요입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법입니다.
  </Card>
  <Card title="Inference Providers 문서" href="https://huggingface.co/docs/inference-providers" icon="book">
    공식 Hugging Face Inference Providers 문서입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조입니다.
  </Card>
</CardGroup>
