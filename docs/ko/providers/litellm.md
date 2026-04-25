---
read_when:
    - LiteLLM proxy를 통해 OpenClaw를 라우팅하려고 함
    - LiteLLM을 통한 비용 추적, 로깅 또는 모델 라우팅이 필요함
summary: 통합된 모델 액세스와 비용 추적을 위해 LiteLLM Proxy를 통해 OpenClaw 실행
title: LiteLLM
x-i18n:
    generated_at: "2026-04-25T18:21:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai)은 100개 이상의 모델 provider에 통합 API를 제공하는 오픈 소스 LLM Gateway입니다. OpenClaw를 LiteLLM을 통해 라우팅하면 중앙화된 비용 추적, 로깅, 그리고 OpenClaw config를 변경하지 않고도 백엔드를 전환할 수 있는 유연성을 얻을 수 있습니다.

<Tip>
**왜 OpenClaw와 함께 LiteLLM을 사용하나요?**

- **비용 추적** — 모든 모델에서 OpenClaw가 정확히 얼마를 사용하는지 확인
- **모델 라우팅** — config 변경 없이 Claude, GPT-4, Gemini, Bedrock 간 전환
- **가상 키** — OpenClaw용 지출 한도가 있는 키 생성
- **로깅** — 디버깅을 위한 전체 요청/응답 로그
- **Fallback** — 기본 provider가 다운되었을 때 자동 장애 조치

</Tip>

## 빠른 시작

<Tabs>
  <Tab title="온보딩(권장)">
    **가장 적합한 경우:** 동작하는 LiteLLM 설정으로 가는 가장 빠른 경로.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="수동 설정">
    **가장 적합한 경우:** 설치 및 config를 완전히 제어하려는 경우.

    <Steps>
      <Step title="LiteLLM Proxy 시작">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw를 LiteLLM으로 지정">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        이것으로 끝입니다. 이제 OpenClaw는 LiteLLM을 통해 라우팅됩니다.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 구성

### 환경 변수

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Config 파일

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

## 고급 구성

### 이미지 생성

LiteLLM은 OpenAI 호환
`/images/generations` 및 `/images/edits` 경로를 통해 `image_generate` 도구의 백엔드로도 사용할 수 있습니다. `agents.defaults.imageGenerationModel` 아래에 LiteLLM 이미지
모델을 구성하세요.

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

`http://localhost:4000` 같은 loopback LiteLLM URL은 전역
private-network override 없이 작동합니다. LAN에 호스팅된 proxy의 경우
API 키가 구성된 proxy 호스트로 전송되므로
`models.providers.litellm.request.allowPrivateNetwork: true`를 설정하세요.

<AccordionGroup>
  <Accordion title="가상 키">
    지출 한도가 있는 OpenClaw 전용 키를 생성하세요:

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

    생성된 키를 `LITELLM_API_KEY`로 사용하세요.

  </Accordion>

  <Accordion title="모델 라우팅">
    LiteLLM은 모델 요청을 서로 다른 백엔드로 라우팅할 수 있습니다. LiteLLM `config.yaml`에서 구성하세요:

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

    OpenClaw는 계속 `claude-opus-4-6`을 요청하고, 라우팅은 LiteLLM이 처리합니다.

  </Accordion>

  <Accordion title="사용량 보기">
    LiteLLM의 대시보드 또는 API를 확인하세요:

    ```bash
    # 키 정보
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 지출 로그
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy 동작 참고">
    - LiteLLM은 기본적으로 `http://localhost:4000`에서 실행됩니다
    - OpenClaw는 LiteLLM의 proxy 스타일 OpenAI 호환 `/v1`
      엔드포인트를 통해 연결합니다
    - 기본 OpenAI 전용 요청 셰이핑은 LiteLLM을 통해서는 적용되지 않습니다:
      `service_tier` 없음, Responses `store` 없음, prompt-cache 힌트 없음, 그리고
      OpenAI reasoning 호환 payload 셰이핑 없음
    - 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는
      사용자 지정 LiteLLM base URL에 주입되지 않습니다
  </Accordion>
</AccordionGroup>

<Note>
일반적인 provider 구성 및 장애 조치 동작은 [Model Providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

## 관련

<CardGroup cols={2}>
  <Card title="LiteLLM 문서" href="https://docs.litellm.ai" icon="book">
    공식 LiteLLM 문서 및 API 참조입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, model ref 및 장애 조치 동작 개요입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 config 참조입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델 선택 및 구성 방법입니다.
  </Card>
</CardGroup>
