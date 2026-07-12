---
read_when:
    - LiteLLM 프록시를 통해 OpenClaw를 라우팅하려고 합니다.
    - LiteLLM을 통한 비용 추적, 로깅 또는 모델 라우팅이 필요합니다
summary: 통합 모델 액세스 및 비용 추적을 위해 LiteLLM Proxy를 통해 OpenClaw 실행하기
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T15:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai)은 100개 이상의 모델 제공자를 위한 통합 API를 제공하는 오픈 소스 LLM Gateway입니다.
OpenClaw 구성을 변경하지 않고도 중앙 집중식 비용 추적, 로깅, 지출 한도가 있는 가상 키 및 백엔드 장애 조치를 위해 OpenClaw을 LiteLLM을 통해 라우팅할 수 있습니다.

## 빠른 시작

<Tabs>
  <Tab title="온보딩(권장)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    원격 프록시를 대상으로 비대화형 설정을 수행하려면 프록시 URL을 명시적으로 전달하십시오.

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="수동 설정">
    <Steps>
      <Step title="LiteLLM 프록시 시작">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw이 LiteLLM을 사용하도록 설정">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 구성

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

온보딩에서 작성하는 기본 모델은 `litellm/claude-opus-4-6`입니다.

## 이미지 생성

LiteLLM은 OpenAI 호환 `/images/generations` 및 `/images/edits` 경로를 통해 `image_generate` 도구의 백엔드 역할을 할 수 있습니다. 기본 이미지 모델은 `gpt-image-2`이며, 다른 모델을 사용하려면 `agents.defaults.imageGenerationModel`에서 구성하십시오.

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

루프백 LiteLLM URL(`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`)은 전역 사설 네트워크 재정의 없이 작동합니다. LAN에서 호스팅되는 프록시의 경우 API 키가 해당 호스트로 전송되므로 `models.providers.litellm.request.allowPrivateNetwork: true`를 설정하십시오.

## 고급

<AccordionGroup>
  <Accordion title="가상 키">
    지출 한도가 있는 OpenClaw 전용 키를 생성하십시오.

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    생성된 키를 `LITELLM_API_KEY`로 사용하십시오.

  </Accordion>

  <Accordion title="모델 라우팅">
    LiteLLM은 모델 요청을 여러 백엔드로 라우팅할 수 있습니다. LiteLLM의 `config.yaml`에서 구성하십시오.

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw은 계속 `claude-opus-4-6`을 요청하고 LiteLLM이 라우팅을 처리합니다.

  </Accordion>

  <Accordion title="사용량 보기">
    ```bash
    # 키 정보
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 지출 로그
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="프록시 동작 참고 사항">
    - LiteLLM은 기본적으로 `http://localhost:4000`에서 실행됩니다.
    - OpenClaw은 LiteLLM의 프록시 형식 OpenAI 호환 `/v1` 엔드포인트를 통해 연결됩니다.
    - 구성된 LiteLLM 기본 URL을 통해서는 네이티브 OpenAI 전용 요청 형식 조정이 적용되지 않습니다.
      `service_tier`, Responses의 `store`, 프롬프트 캐시 힌트 및 OpenAI 추론 노력
      페이로드 형식 조정이 적용되지 않습니다.
    - 숨겨진 OpenClaw 속성 헤더(`originator`, `version`, `User-Agent`)는 검증된
      네이티브 OpenAI 엔드포인트에만 전송되므로 사용자 지정 LiteLLM 기본 URL에는 삽입되지 않습니다.
  </Accordion>
</AccordionGroup>

<Note>
일반적인 제공자 구성 및 장애 조치 동작은 [모델 제공자](/ko/concepts/model-providers)를 참조하십시오.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="LiteLLM 문서" href="https://docs.litellm.ai" icon="book">
    공식 LiteLLM 문서 및 API 참조입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 제공자, 모델 참조 및 장애 조치 동작의 개요입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조입니다.
  </Card>
  <Card title="모델" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법입니다.
  </Card>
</CardGroup>
