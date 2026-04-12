---
read_when:
    - OpenClaw와 함께 Bedrock Mantle에서 호스팅되는 OSS 모델을 사용하려고 합니다
    - GPT-OSS, Qwen, Kimi 또는 GLM에 대해 Mantle OpenAI 호환 엔드포인트가 필요합니다
summary: OpenClaw에서 Amazon Bedrock Mantle(OpenAI 호환) 모델 사용하기
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-12T23:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27e602b6f6a3ae92427de135cb9df6356e0daaea6b6fe54723a7542dd0d5d21e
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw에는 Mantle OpenAI 호환 엔드포인트에 연결하는 번들 **Amazon Bedrock Mantle** provider가 포함되어 있습니다. Mantle은 Bedrock 인프라 기반의 표준 `/v1/chat/completions` 인터페이스를 통해 오픈 소스 및 서드파티 모델(GPT-OSS, Qwen, Kimi, GLM 등)을 호스팅합니다.

| Property       | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| Provider ID    | `amazon-bedrock-mantle`                                                             |
| API            | `openai-completions` (OpenAI 호환)                                                  |
| Auth           | 명시적 `AWS_BEARER_TOKEN_BEDROCK` 또는 IAM 자격 증명 체인 기반 bearer token 생성    |
| Default region | `us-east-1` (`AWS_REGION` 또는 `AWS_DEFAULT_REGION`으로 재정의 가능)                |

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

        선택적으로 리전도 설정할 수 있습니다(기본값은 `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="모델이 검색되는지 확인">
        ```bash
        openclaw models list
        ```

        검색된 모델은 `amazon-bedrock-mantle` provider 아래에 표시됩니다. 기본값을 재정의하려는 경우가 아니라면 추가 구성은 필요하지 않습니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 자격 증명">
    **가장 적합한 경우:** AWS SDK 호환 자격 증명(공유 구성, SSO, web identity, 인스턴스 또는 태스크 역할)을 사용하는 경우.

    <Steps>
      <Step title="Gateway 호스트에서 AWS 자격 증명 구성">
        모든 AWS SDK 호환 인증 소스를 사용할 수 있습니다:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="모델이 검색되는지 확인">
        ```bash
        openclaw models list
        ```

        OpenClaw는 자격 증명 체인에서 Mantle bearer token을 자동으로 생성합니다.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK`가 설정되어 있지 않으면 OpenClaw가 AWS 기본 자격 증명 체인(공유 자격 증명/구성 프로필, SSO, web identity, 인스턴스 또는 태스크 역할 포함)으로부터 bearer token을 대신 발급합니다.
    </Tip>

  </Tab>
</Tabs>

## 자동 모델 검색

`AWS_BEARER_TOKEN_BEDROCK`가 설정되어 있으면 OpenClaw는 이를 직접 사용합니다. 그렇지 않으면 OpenClaw는 AWS 기본 자격 증명 체인에서 Mantle bearer token 생성을 시도합니다. 그런 다음 해당 리전의 `/v1/models` 엔드포인트를 조회하여 사용 가능한 Mantle 모델을 검색합니다.

| Behavior          | Detail                    |
| ----------------- | ------------------------- |
| Discovery cache   | 결과는 1시간 동안 캐시됨  |
| IAM token refresh | 1시간마다 갱신            |

<Note>
bearer token은 표준 [Amazon Bedrock](/ko/providers/bedrock) provider에서 사용하는 `AWS_BEARER_TOKEN_BEDROCK`와 동일합니다.
</Note>

### 지원 리전

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 수동 구성

자동 검색 대신 명시적 구성을 선호한다면:

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

  <Accordion title="엔드포인트 사용 불가">
    Mantle 엔드포인트를 사용할 수 없거나 모델을 반환하지 않으면 해당 provider는 조용히 건너뜁니다. OpenClaw는 오류를 내지 않으며, 다른 구성된 provider는 계속 정상적으로 동작합니다.
  </Accordion>

  <Accordion title="Amazon Bedrock provider와의 관계">
    Bedrock Mantle은 표준 [Amazon Bedrock](/ko/providers/bedrock) provider와는 별개의 provider입니다. Mantle은 OpenAI 호환 `/v1` 인터페이스를 사용하고, 표준 Bedrock provider는 네이티브 Bedrock API를 사용합니다.

    두 provider 모두 `AWS_BEARER_TOKEN_BEDROCK`가 존재할 경우 동일한 자격 증명을 공유합니다.

  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ko/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan 및 기타 모델용 네이티브 Bedrock provider.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조 및 장애 조치 동작 선택하기.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법.
  </Card>
</CardGroup>
