---
read_when:
    - 여러 LLM에 사용할 단일 API 키가 필요합니다
    - Baidu Qianfan 설정 안내가 필요합니다
summary: Qianfan의 통합 API를 사용하여 OpenClaw에서 다양한 모델에 액세스하세요
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T06:48:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan은 Baidu의 MaaS 플랫폼으로, 단일 엔드포인트와 API 키 뒤에서 여러 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI와 호환되므로 대부분의 OpenAI SDK는 기본 URL만 바꾸면 작동합니다.

| 속성 | 값                                |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| Auth     | `QIANFAN_API_KEY`                 |
| API      | OpenAI 호환                       |
| 기본 URL | `https://qianfan.baidubce.com/v2` |

## 시작하기

<Steps>
  <Step title="Create a Baidu Cloud account">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey)에서 가입하거나 로그인하고 Qianfan API 접근이 활성화되어 있는지 확인합니다.
  </Step>
  <Step title="Generate an API key">
    새 애플리케이션을 만들거나 기존 애플리케이션을 선택한 다음 API 키를 생성합니다. 키 형식은 `bce-v3/ALTAK-...`입니다.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 기본 제공 카탈로그

| 모델 참조                            | 입력        | 컨텍스트 | 최대 출력 | 추론 | 참고         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | 텍스트      | 98,304  | 32,768     | 예        | 기본 모델 |
| `qianfan/ernie-5.0-thinking-preview` | 텍스트, 이미지 | 119,000 | 64,000     | 예        | 멀티모달    |

<Tip>
기본으로 번들된 모델 참조는 `qianfan/deepseek-v3.2`입니다. 사용자 지정 기본 URL이나 모델 메타데이터가 필요한 경우에만 `models.providers.qianfan`을 재정의하면 됩니다.
</Tip>

## 구성 예시

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan은 네이티브 OpenAI 요청 형성이 아니라 OpenAI 호환 전송 경로를 통해 실행됩니다. 즉 표준 OpenAI SDK 기능은 작동하지만, 제공자별 매개변수는 전달되지 않을 수 있습니다.
  </Accordion>

  <Accordion title="Catalog and overrides">
    번들된 카탈로그에는 현재 `deepseek-v3.2` 및 `ernie-5.0-thinking-preview`가 포함되어 있습니다. 사용자 지정 기본 URL이나 모델 메타데이터가 필요한 경우에만 `models.providers.qianfan`을 추가하거나 재정의하세요.

    <Note>
    모델 참조는 `qianfan/` 접두사를 사용합니다(예: `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - API 키가 `bce-v3/ALTAK-`로 시작하고 Baidu Cloud 콘솔에서 Qianfan API 접근이 활성화되어 있는지 확인합니다.
    - 모델이 나열되지 않으면 계정에서 Qianfan 서비스가 활성화되어 있는지 확인합니다.
    - 기본 기본 URL은 `https://qianfan.baidubce.com/v2`입니다. 사용자 지정 엔드포인트나 프록시를 사용하는 경우에만 변경하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration-reference" icon="gear">
    전체 OpenClaw 구성 참조입니다.
  </Card>
  <Card title="Agent setup" href="/ko/concepts/agent" icon="robot">
    에이전트 기본값과 모델 할당을 구성합니다.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    공식 Qianfan API 문서입니다.
  </Card>
</CardGroup>
