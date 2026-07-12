---
read_when:
    - 여러 LLM에 하나의 API 키를 사용하려는 경우
    - Baidu Qianfan 설정 안내가 필요합니다
summary: Qianfan의 통합 API를 사용하여 OpenClaw에서 다양한 모델에 액세스합니다.
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T15:39:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan은 Baidu의 MaaS 플랫폼으로, 단일 엔드포인트와 API 키를 통해 여러 모델로 요청을 라우팅하는 통합 OpenAI 호환 API입니다. OpenClaw는 이를 공식 외부 Plugin `@openclaw/qianfan-provider`로 제공합니다.

| 속성          | 값                                       |
| ------------- | ---------------------------------------- |
| 제공자        | `qianfan`                                |
| 인증          | `QIANFAN_API_KEY`                        |
| API           | OpenAI 호환 (`openai-completions`)       |
| 기본 URL      | `https://qianfan.baidubce.com/v2`        |
| 기본 모델     | `qianfan/deepseek-v3.2`                  |

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="Baidu Cloud 계정 만들기">
    [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey)에서 가입하거나 로그인하고 Qianfan API 액세스가 활성화되어 있는지 확인합니다.
  </Step>
  <Step title="API 키 생성하기">
    새 애플리케이션을 만들거나 기존 애플리케이션을 선택한 다음 API 키를 생성합니다. Baidu Cloud 키는 `bce-v3/ALTAK-...` 형식을 사용합니다.
  </Step>
  <Step title="온보딩 실행하기">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    비대화형 실행에서는 `--qianfan-api-key <key>` 또는
    `QIANFAN_API_KEY`에서 키를 읽습니다. 온보딩은 제공자 구성을 작성하고, 기본 모델에
    `QIANFAN` 별칭을 추가하며, 구성된 기본 모델이 없으면 `qianfan/deepseek-v3.2`를
    기본 모델로 설정합니다.

  </Step>
  <Step title="모델 사용 가능 여부 확인하기">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 기본 제공 카탈로그

| 모델 참조                            | 입력        | 컨텍스트 | 최대 출력 | 추론 | 참고         |
| ------------------------------------ | ----------- | -------- | --------- | ---- | ------------ |
| `qianfan/deepseek-v3.2`              | 텍스트      | 98,304   | 32,768    | 예   | 기본 모델    |
| `qianfan/ernie-5.0-thinking-preview` | 텍스트, 이미지 | 119,000 | 64,000    | 예   | 멀티모달     |

카탈로그는 정적이며 실시간 모델 탐색은 없습니다.

<Tip>
사용자 지정 기본 URL이나 모델 메타데이터가 필요한 경우에만 `models.providers.qianfan`을 재정의하면 됩니다.
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

<Note>
모델 참조는 `qianfan/` 접두사를 사용합니다(예: `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="전송 및 호환성">
    Qianfan은 네이티브 OpenAI 요청 형식이 아니라 OpenAI 호환 전송 경로를 통해 실행됩니다. 표준 OpenAI SDK 기능은 작동하지만 제공자별 매개변수는 전달되지 않을 수 있습니다.
  </Accordion>

  <Accordion title="문제 해결">
    - API 키가 `bce-v3/ALTAK-`로 시작하고 Baidu Cloud 콘솔에서 Qianfan API 액세스가 활성화되어 있는지 확인합니다.
    - 모델이 나열되지 않으면 계정에서 Qianfan 서비스가 활성화되어 있는지 확인합니다.
    - 사용자 지정 엔드포인트나 프록시를 사용하는 경우에만 기본 URL을 변경합니다.

  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    전체 OpenClaw 구성 참조입니다.
  </Card>
  <Card title="에이전트 설정" href="/ko/concepts/agent" icon="robot">
    에이전트 기본값과 모델 할당을 구성하는 방법입니다.
  </Card>
  <Card title="Qianfan API 문서" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    공식 Qianfan API 문서입니다.
  </Card>
</CardGroup>
