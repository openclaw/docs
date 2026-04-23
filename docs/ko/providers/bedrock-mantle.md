---
read_when:
    - OpenClaw와 함께 Bedrock Mantle에서 호스팅되는 OSS 모델을 사용하려고 합니다
    - GPT-OSS, Qwen, Kimi 또는 GLM용 Mantle OpenAI 호환 endpoint가 필요합니다
summary: Amazon Bedrock Mantle(OpenAI 호환) 모델을 OpenClaw와 함께 사용
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T14:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw에는 Mantle OpenAI 호환 endpoint에 연결하는 번들 **Amazon Bedrock Mantle** provider가 포함되어 있습니다. Mantle은 Bedrock 인프라를 기반으로 하는 표준 `/v1/chat/completions` 표면을 통해 오픈 소스 및 서드파티 모델(GPT-OSS, Qwen, Kimi, GLM 등)을 호스팅합니다.

| Property       | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Provider ID    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions`(OpenAI 호환) 또는 `anthropic-messages`(Anthropic Messages 경로)       |
| Auth           | 명시적 `AWS_BEARER_TOKEN_BEDROCK` 또는 IAM credential-chain bearer-token 생성              |
| Default region | `us-east-1`(`AWS_REGION` 또는 `AWS_DEFAULT_REGION`으로 재정의)                              |

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

        선택적으로 리전을 설정할 수 있습니다(기본값은 `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="모델이 검색되는지 확인">
        ```bash
        openclaw models list
        ```

        검색된 모델은 `amazon-bedrock-mantle` provider 아래에 표시됩니다. 기본값을 재정의하려는 경우가 아니라면
        추가 구성은 필요하지 않습니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 자격 증명">
    **가장 적합한 경우:** AWS SDK 호환 자격 증명(공유 config, SSO, 웹 ID, 인스턴스 또는 태스크 역할)을 사용하는 경우.

    <Steps>
      <Step title="Gateway 호스트에 AWS 자격 증명 구성">
        AWS SDK와 호환되는 모든 인증 소스를 사용할 수 있습니다:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="모델이 검색되는지 확인">
        ```bash
        openclaw models list
        ```

        OpenClaw가 credential chain에서 Mantle bearer token을 자동으로 생성합니다.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK`가 설정되지 않은 경우 OpenClaw는 공유 credentials/config profile, SSO, 웹 ID, 인스턴스 또는 태스크 역할을 포함한 AWS 기본 credential chain에서 bearer token을 대신 발급합니다.
    </Tip>

  </Tab>
</Tabs>

## 자동 모델 검색

`AWS_BEARER_TOKEN_BEDROCK`가 설정되어 있으면 OpenClaw는 이를 직접 사용합니다. 그렇지 않으면
OpenClaw는 AWS 기본 credential chain에서 Mantle bearer token 생성을 시도합니다.
그런 다음 해당 리전의 `/v1/models` endpoint를 조회하여 사용 가능한 Mantle 모델을 검색합니다.

| Behavior          | Detail                 |
| ----------------- | ---------------------- |
| 검색 캐시         | 결과는 1시간 동안 캐시 |
| IAM 토큰 갱신     | 매시간                 |

<Note>
bearer token은 표준 [Amazon Bedrock](/ko/providers/bedrock) provider에서 사용하는 것과 동일한 `AWS_BEARER_TOKEN_BEDROCK`입니다.
</Note>

### 지원 리전

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 수동 구성

자동 검색 대신 명시적 구성을 선호하는 경우:

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

## 고급 참고 사항

<AccordionGroup>
  <Accordion title="추론 지원">
    추론 지원은 `thinking`, `reasoner`, `gpt-oss-120b` 같은 패턴이 포함된 모델 ID를 기준으로 추론됩니다. OpenClaw는 검색 중 일치하는 모델에 대해 자동으로 `reasoning: true`를 설정합니다.
  </Accordion>

  <Accordion title="Endpoint 사용 불가">
    Mantle endpoint를 사용할 수 없거나 모델을 반환하지 않으면 해당 provider는 조용히 건너뜁니다. OpenClaw는 오류를 발생시키지 않으며, 다른 구성된 provider는 정상적으로 계속 동작합니다.
  </Accordion>

  <Accordion title="Anthropic Messages 경로를 통한 Claude Opus 4.7">
    Mantle은 동일한 bearer 인증 스트리밍 경로를 통해 Claude 모델을 전달하는 Anthropic Messages 경로도 노출합니다. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`)은 이 경로를 통해 provider 소유 스트리밍으로 호출할 수 있으므로 AWS bearer token은 Anthropic API 키처럼 취급되지 않습니다.

    Mantle provider에서 Anthropic Messages 모델을 고정하면 OpenClaw는 해당 모델에 대해 `openai-completions` 대신 `anthropic-messages` API 표면을 사용합니다. 인증은 여전히 `AWS_BEARER_TOKEN_BEDROCK`(또는 발급된 IAM bearer token)에서 가져옵니다.

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

  <Accordion title="Amazon Bedrock provider와의 관계">
    Bedrock Mantle은 표준
    [Amazon Bedrock](/ko/providers/bedrock) provider와는 별도의 provider입니다. Mantle은
    OpenAI 호환 `/v1` 표면을 사용하고, 표준 Bedrock provider는
    네이티브 Bedrock API를 사용합니다.

    두 provider는 존재할 경우 동일한 `AWS_BEARER_TOKEN_BEDROCK` 자격 증명을 공유합니다.

  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ko/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan 및 기타 모델용 네이티브 Bedrock provider.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 사항 및 자격 증명 재사용 규칙.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법.
  </Card>
</CardGroup>
