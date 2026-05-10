---
read_when:
    - OpenClaw에서 Bedrock Mantle 호스팅 OSS 모델을 사용하려고 합니다
    - GPT-OSS, Qwen, Kimi 또는 GLM에는 Mantle OpenAI 호환 엔드포인트가 필요합니다
summary: OpenClaw에서 Amazon Bedrock Mantle(OpenAI 호환) 모델 사용
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-10T19:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw에는 Mantle OpenAI 호환 endpoint에 연결되는 번들 **Amazon Bedrock Mantle** 제공자가 포함되어 있습니다. Mantle은 Bedrock 인프라가 뒷받침하는 표준
`/v1/chat/completions` 표면을 통해 오픈 소스 및 타사 모델(GPT-OSS, Qwen, Kimi, GLM 등)을 호스팅합니다.

| 속성       | 값                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| 제공자 ID    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions`(OpenAI 호환) 또는 `anthropic-messages`(Anthropic Messages 경로) |
| 인증           | 명시적 `AWS_BEARER_TOKEN_BEDROCK` 또는 IAM credential-chain bearer-token 생성         |
| 기본 리전 | `us-east-1`(`AWS_REGION` 또는 `AWS_DEFAULT_REGION`으로 재정의)                            |

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="명시적 bearer token">
    **가장 적합한 경우:** 이미 Mantle bearer token이 있는 환경.

    <Steps>
      <Step title="Gateway 호스트에 bearer token 설정">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        선택적으로 리전을 설정합니다(기본값은 `us-east-1`).

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="모델이 발견되는지 확인">
        ```bash
        openclaw models list
        ```

        발견된 모델은 `amazon-bedrock-mantle` 제공자 아래에 표시됩니다. 기본값을 재정의하려는 경우가 아니면 추가 설정은 필요하지 않습니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 자격 증명">
    **가장 적합한 경우:** AWS SDK 호환 자격 증명(공유 config, SSO, web identity, instance 또는 task role)을 사용하는 경우.

    <Steps>
      <Step title="Gateway 호스트에 AWS 자격 증명 설정">
        모든 AWS SDK 호환 인증 소스를 사용할 수 있습니다.

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="모델이 발견되는지 확인">
        ```bash
        openclaw models list
        ```

        OpenClaw는 credential chain에서 Mantle bearer token을 자동으로 생성합니다.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK`이 설정되지 않은 경우, OpenClaw는 공유 자격 증명/config 프로필, SSO, web identity, instance 또는 task role을 포함한 AWS 기본 credential chain에서 bearer token을 발급합니다.
    </Tip>

  </Tab>
</Tabs>

## 자동 모델 검색

`AWS_BEARER_TOKEN_BEDROCK`이 설정되어 있으면 OpenClaw는 이를 직접 사용합니다. 그렇지 않으면 OpenClaw는 AWS 기본 credential chain에서 Mantle bearer token 생성을 시도합니다. 그런 다음 리전의 `/v1/models` endpoint를 쿼리하여 사용 가능한 Mantle 모델을 발견합니다.

| 동작          | 세부 정보                    |
| ----------------- | ------------------------- |
| 검색 캐시   | 결과는 1시간 동안 캐시됨 |
| IAM token 새로 고침 | 매시간                    |

Mantle Plugin을 활성화한 상태로 유지하되 자동 검색 및 IAM bearer-token 생성을 억제하려면 Plugin 소유 검색 토글을 비활성화하세요.

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
bearer token은 표준 [Amazon Bedrock](/ko/providers/bedrock) 제공자가 사용하는 동일한 `AWS_BEARER_TOKEN_BEDROCK`입니다.
</Note>

### 지원되는 리전

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 수동 구성

자동 검색 대신 명시적 config를 선호하는 경우:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="추론 지원">
    추론 지원은 `thinking`, `reasoner`, 또는 `gpt-oss-120b`와 같은 패턴을 포함하는 모델 ID에서 추론됩니다. OpenClaw는 검색 중 일치하는 모델에 대해 `reasoning: true`를 자동으로 설정합니다.
  </Accordion>

  <Accordion title="Endpoint 사용 불가">
    Mantle endpoint를 사용할 수 없거나 모델을 반환하지 않으면 제공자는 조용히 건너뜁니다. OpenClaw는 오류를 발생시키지 않으며, 구성된 다른 제공자는 정상적으로 계속 작동합니다.
  </Accordion>

  <Accordion title="Anthropic Messages 경로를 통한 Claude Opus 4.7">
    Mantle은 동일한 bearer 인증 streaming 경로를 통해 Claude 모델을 전달하는 Anthropic Messages 경로도 노출합니다. Claude Opus 4.7(`amazon-bedrock-mantle/claude-opus-4.7`)은 제공자 소유 streaming을 사용해 이 경로를 통해 호출할 수 있으므로, AWS bearer token은 Anthropic API key처럼 취급되지 않습니다.

    Mantle 제공자에서 Anthropic Messages 모델을 고정하면 OpenClaw는 해당 모델에 대해 `openai-completions` 대신 `anthropic-messages` API 표면을 사용합니다. 인증은 여전히 `AWS_BEARER_TOKEN_BEDROCK`(또는 발급된 IAM bearer token)에서 가져옵니다.

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Amazon Bedrock 제공자와의 관계">
    Bedrock Mantle은 표준 [Amazon Bedrock](/ko/providers/bedrock) 제공자와 별개의 제공자입니다. Mantle은 OpenAI 호환 `/v1` 표면을 사용하는 반면, 표준 Bedrock 제공자는 네이티브 Bedrock API를 사용합니다.

    두 제공자는 `AWS_BEARER_TOKEN_BEDROCK` 자격 증명이 있는 경우 이를 공유합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ko/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan 및 기타 모델을 위한 네이티브 Bedrock 제공자입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, failover 동작을 선택합니다.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보와 자격 증명 재사용 규칙입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법입니다.
  </Card>
</CardGroup>
