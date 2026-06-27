---
read_when:
    - OpenClaw에서 Bedrock Mantle 호스팅 OSS 모델 사용하기
    - GPT-OSS, Qwen, Kimi 또는 GLM을 사용하려면 Mantle OpenAI 호환 엔드포인트가 필요합니다.
summary: OpenClaw에서 Amazon Bedrock Mantle(OpenAI 호환) 모델 사용
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T18:00:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw에는 Mantle OpenAI 호환 엔드포인트에 연결하는 번들 **Amazon Bedrock Mantle** 제공자가 포함되어 있습니다. Mantle은 Bedrock 인프라를 기반으로 하는 표준 `/v1/chat/completions` 표면을 통해 오픈 소스 및 타사 모델(GPT-OSS, Qwen, Kimi, GLM 등)을 호스팅합니다.

| 속성           | 값                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------- |
| 제공자 ID      | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions`(OpenAI 호환) 또는 `anthropic-messages`(Anthropic Messages 경로)        |
| 인증           | 명시적 `AWS_BEARER_TOKEN_BEDROCK` 또는 IAM 자격 증명 체인 베어러 토큰 생성                  |
| 기본 리전      | `us-east-1`(`AWS_REGION` 또는 `AWS_DEFAULT_REGION`으로 재정의)                              |

## 시작하기

선호하는 인증 방식을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="명시적 베어러 토큰">
    **적합한 경우:** 이미 Mantle 베어러 토큰이 있는 환경.

    <Steps>
      <Step title="Gateway 호스트에 베어러 토큰 설정">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        선택적으로 리전을 설정합니다(기본값은 `us-east-1`).

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Claude Fable 5용 제공자 데이터 공유 옵트인">
        Claude Fable 5 및 Claude Mythos급 Bedrock 모델은 호출 전에 Mantle Data Retention API 모드 `provider_data_share`가 필요합니다. 이 옵트인은 Bedrock이 프롬프트와 완성을 Anthropic과 공유하고, 신뢰 및 안전성 검토를 위해 최대 30일 동안 보관하도록 허용합니다.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        해당 보관 모드를 수용할 수 없다면 구성에서 다른 Bedrock 모델을 사용하세요.
      </Step>
      <Step title="모델 검색 확인">
        ```bash
        openclaw models list
        ```

        검색된 모델은 `amazon-bedrock-mantle` 제공자 아래에 표시됩니다. 기본값을 재정의하려는 경우가 아니면 추가 구성이 필요하지 않습니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 자격 증명">
    **적합한 경우:** AWS SDK 호환 자격 증명(공유 구성, SSO, 웹 ID, 인스턴스 또는 작업 역할)을 사용하는 경우.

    <Steps>
      <Step title="Gateway 호스트에 AWS 자격 증명 구성">
        모든 AWS SDK 호환 인증 소스를 사용할 수 있습니다.

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="모델 검색 확인">
        ```bash
        openclaw models list
        ```

        OpenClaw는 자격 증명 체인에서 Mantle 베어러 토큰을 자동으로 생성합니다.
      </Step>
    </Steps>

    <Tip>
    `AWS_BEARER_TOKEN_BEDROCK`이 설정되지 않은 경우 OpenClaw는 공유 자격 증명/구성 프로필, SSO, 웹 ID, 인스턴스 또는 작업 역할을 포함한 AWS 기본 자격 증명 체인에서 베어러 토큰을 생성합니다.
    </Tip>

  </Tab>
</Tabs>

## 자동 모델 검색

`AWS_BEARER_TOKEN_BEDROCK`이 설정되어 있으면 OpenClaw는 이를 직접 사용합니다. 그렇지 않으면 OpenClaw는 AWS 기본 자격 증명 체인에서 Mantle 베어러 토큰 생성을 시도합니다. 그런 다음 해당 리전의 `/v1/models` 엔드포인트를 쿼리하여 사용 가능한 Mantle 모델을 검색합니다.

| 동작           | 세부 정보                 |
| -------------- | ------------------------- |
| 검색 캐시      | 결과를 1시간 동안 캐시    |
| IAM 토큰 갱신  | 매시간                    |

Mantle Plugin을 활성화한 상태로 유지하되 자동 검색 및 IAM 베어러 토큰 생성을 억제하려면 Plugin 소유 검색 토글을 비활성화하세요.

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
베어러 토큰은 표준 [Amazon Bedrock](/ko/providers/bedrock) 제공자가 사용하는 동일한 `AWS_BEARER_TOKEN_BEDROCK`입니다.
</Note>

### 지원되는 리전

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

## 고급 구성

<AccordionGroup>
  <Accordion title="추론 지원">
    추론 지원은 `thinking`, `reasoner`, `gpt-oss-120b` 같은 패턴을 포함하는 모델 ID에서 추론됩니다. OpenClaw는 검색 중 일치하는 모델에 대해 `reasoning: true`를 자동으로 설정합니다.
  </Accordion>

  <Accordion title="엔드포인트 사용 불가">
    Mantle 엔드포인트를 사용할 수 없거나 모델을 반환하지 않으면 해당 제공자는 조용히 건너뜁니다. OpenClaw는 오류를 발생시키지 않으며, 구성된 다른 제공자는 정상적으로 계속 작동합니다.
  </Accordion>

  <Accordion title="Anthropic Messages 경로를 통한 Claude Opus 4.7">
    Mantle은 동일한 베어러 인증 스트리밍 경로를 통해 Claude 모델을 전달하는 Anthropic Messages 경로도 노출합니다. Claude Opus 4.7(`amazon-bedrock-mantle/claude-opus-4.7`)은 제공자 소유 스트리밍으로 이 경로를 통해 호출할 수 있으므로, AWS 베어러 토큰은 Anthropic API 키처럼 처리되지 않습니다.

    Mantle 제공자에서 Anthropic Messages 모델을 고정하면 OpenClaw는 해당 모델에 대해 `openai-completions` 대신 `anthropic-messages` API 표면을 사용합니다. 인증은 여전히 `AWS_BEARER_TOKEN_BEDROCK`(또는 생성된 IAM 베어러 토큰)에서 가져옵니다.

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
    Bedrock Mantle은 표준 [Amazon Bedrock](/ko/providers/bedrock) 제공자와 별도의 제공자입니다. Mantle은 OpenAI 호환 `/v1` 표면을 사용하는 반면, 표준 Bedrock 제공자는 네이티브 Bedrock API를 사용합니다.

    두 제공자는 `AWS_BEARER_TOKEN_BEDROCK` 자격 증명이 있을 때 이를 공유합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ko/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan 및 기타 모델을 위한 네이티브 Bedrock 제공자.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작 선택.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법.
  </Card>
</CardGroup>
