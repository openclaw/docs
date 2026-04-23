---
read_when:
    - LiteLLM 프록시를 통해 OpenClaw를 라우팅하려고 합니다
    - LiteLLM을 통한 비용 추적, 로깅 또는 모델 라우팅이 필요합니다
summary: LiteLLM Proxy를 통해 OpenClaw를 실행하여 통합 모델 액세스 및 비용 추적 사용
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T14:06:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f9665b204126861a7dbbd426b26a624e60fd219a44756cec6a023df73848cef
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai)은 100개 이상의 모델 provider에 대한 통합 API를 제공하는 오픈 소스 LLM Gateway입니다. OpenClaw를 LiteLLM을 통해 라우팅하면 중앙 집중식 비용 추적, 로깅, 그리고 OpenClaw config를 변경하지 않고도 백엔드를 전환할 수 있는 유연성을 얻을 수 있습니다.

<Tip>
**OpenClaw에서 LiteLLM을 사용하는 이유는 무엇인가요?**

- **비용 추적** — 모든 모델에서 OpenClaw가 정확히 얼마나 사용했는지 확인
- **모델 라우팅** — config 변경 없이 Claude, GPT-4, Gemini, Bedrock 간 전환
- **가상 키** — OpenClaw용 지출 한도가 있는 키 생성
- **로깅** — 디버깅을 위한 전체 요청/응답 로그
- **fallback** — 기본 provider가 다운된 경우 자동 failover

</Tip>

## 빠른 시작

<Tabs>
  <Tab title="온보딩(권장)">
    **가장 적합한 경우:** 작동하는 LiteLLM 설정으로 가는 가장 빠른 경로.

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

        이제 완료되었습니다. OpenClaw는 이제 LiteLLM을 통해 라우팅됩니다.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 구성

### 환경 변수

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### config 파일

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

## 고급 주제

<AccordionGroup>
  <Accordion title="가상 키">
    지출 한도가 있는 OpenClaw 전용 키를 생성합니다:

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
    LiteLLM 대시보드 또는 API를 확인하세요:

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
    - LiteLLM은 기본적으로 `http://localhost:4000`에서 실행됩니다
    - OpenClaw는 LiteLLM의 프록시 스타일 OpenAI 호환 `/v1`
      endpoint를 통해 연결합니다
    - 네이티브 OpenAI 전용 요청 shaping은 LiteLLM을 통해서는 적용되지 않습니다:
      `service_tier` 없음, Responses `store` 없음, prompt-cache 힌트 없음, OpenAI reasoning 호환 payload shaping 없음
    - 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는
      사용자 지정 LiteLLM base URL에는 주입되지 않습니다
  </Accordion>
</AccordionGroup>

<Note>
일반적인 provider 구성 및 failover 동작은 [Model Providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

## 관련 문서

<CardGroup cols={2}>
  <Card title="LiteLLM 문서" href="https://docs.litellm.ai" icon="book">
    공식 LiteLLM 문서 및 API 참조.
  </Card>
  <Card title="모델 provider" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 ref, failover 동작 개요.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 config 참조.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법.
  </Card>
</CardGroup>
