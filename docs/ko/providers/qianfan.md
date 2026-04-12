---
read_when:
    - 여러 LLM에 하나의 API 키를 사용하려고 합니다
    - Baidu Qianfan 설정 안내가 필요합니다
summary: OpenClaw에서 Qianfan의 통합 API를 사용해 다양한 모델에 접근하기
title: Qianfan
x-i18n:
    generated_at: "2026-04-12T23:32:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d0eeee9ec24b335c2fb8ac5e985a9edc35cfc5b2641c545cb295dd2de619f50
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan

Qianfan은 Baidu의 MaaS 플랫폼으로, 단일 엔드포인트와 API 키 뒤에서 많은 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로 대부분의 OpenAI SDK는 base URL만 바꾸면 동작합니다.

| 속성 | 값 |
| -------- | --------------------------------- |
| Provider | `qianfan` |
| 인증 | `QIANFAN_API_KEY` |
| API | OpenAI 호환 |
| Base URL | `https://qianfan.baidubce.com/v2` |

## 시작하기

<Steps>
  <Step title="Baidu Cloud 계정 만들기">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey)에서 가입하거나 로그인한 뒤, Qianfan API 액세스가 활성화되어 있는지 확인하세요.
  </Step>
  <Step title="API 키 생성">
    새 애플리케이션을 만들거나 기존 애플리케이션을 선택한 다음 API 키를 생성하세요. 키 형식은 `bce-v3/ALTAK-...`입니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 사용 가능한 모델

| 모델 참조 | 입력 | 컨텍스트 | 최대 출력 | 추론 | 참고 |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2` | text | 98,304 | 32,768 | 예 | 기본 모델 |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000 | 예 | 멀티모달 |

<Tip>
기본 번들 모델 참조는 `qianfan/deepseek-v3.2`입니다. 사용자 지정 base URL이나 모델 메타데이터가 필요할 때만 `models.providers.qianfan`을 재정의하면 됩니다.
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
  <Accordion title="전송 및 호환성">
    Qianfan은 기본 OpenAI 요청 셰이핑이 아니라 OpenAI 호환 전송 경로를 통해 실행됩니다. 즉, 표준 OpenAI SDK 기능은 동작하지만 provider별 파라미터는 전달되지 않을 수 있습니다.
  </Accordion>

  <Accordion title="카탈로그 및 재정의">
    현재 번들 카탈로그에는 `deepseek-v3.2`와 `ernie-5.0-thinking-preview`가 포함됩니다. 사용자 지정 base URL이나 모델 메타데이터가 필요할 때만 `models.providers.qianfan`을 추가하거나 재정의하세요.

    <Note>
    모델 참조는 `qianfan/` 접두사를 사용합니다(예: `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="문제 해결">
    - API 키가 `bce-v3/ALTAK-`로 시작하고 Baidu Cloud 콘솔에서 Qianfan API 액세스가 활성화되어 있는지 확인하세요.
    - 모델이 표시되지 않으면 계정에서 Qianfan 서비스가 활성화되어 있는지 확인하세요.
    - 기본 base URL은 `https://qianfan.baidubce.com/v2`입니다. 사용자 지정 엔드포인트나 프록시를 사용하는 경우에만 변경하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 장애 조치 동작 선택하기.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration" icon="gear">
    전체 OpenClaw 구성 참조.
  </Card>
  <Card title="agent 설정" href="/ko/concepts/agent" icon="robot">
    agent 기본값과 모델 할당 구성하기.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    공식 Qianfan API 문서.
  </Card>
</CardGroup>
