---
read_when:
    - OpenClaw에서 Bedrock Mantle이 호스팅하는 OSS 모델을 사용하려고 합니다
    - GPT-OSS, Qwen, Kimi 또는 GLM용 Mantle OpenAI 호환 엔드포인트가 필요합니다.
    - Amazon Bedrock Mantle을 통해 Claude Sonnet 5 또는 Mythos 5를 사용하려고 합니다
summary: OpenClaw에서 Amazon Bedrock Mantle의 OpenAI 호환 모델 및 Claude Messages 모델 사용하기
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T15:34:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw에는 Mantle의 OpenAI 호환 엔드포인트에 연결하는 번들 **Amazon Bedrock Mantle** 제공자가 포함되어 있습니다. Mantle은 Bedrock 인프라를 기반으로 하는 표준 `/v1/chat/completions` 인터페이스를 통해 오픈 소스 및 서드 파티 모델(GPT-OSS, Qwen, Kimi, GLM 등)을 호스팅합니다. Mantle은 Anthropic Messages 경로를 통해 Anthropic Claude 모델도 제공합니다.

| 속성           | 값                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------- |
| 제공자 ID      | `amazon-bedrock-mantle`                                                                        |
| API            | 검색된 OSS 모델에는 `openai-completions`, Claude 모델에는 `anthropic-messages`                 |
| 인증           | 명시적 `AWS_BEARER_TOKEN_BEDROCK` 또는 IAM 자격 증명 체인을 통한 베어러 토큰 생성               |
| 기본 리전      | `us-east-1` (`AWS_REGION` 또는 `AWS_DEFAULT_REGION`으로 재정의)                                 |

## 시작하기

원하는 인증 방법을 선택하고 설정 단계를 따르십시오.

<Tabs>
  <Tab title="명시적 베어러 토큰">
    **적합한 경우:** Mantle 베어러 토큰을 이미 보유한 환경.

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
      <Step title="모델 검색 확인">
        ```bash
        openclaw models list
        ```

        검색된 모델은 `amazon-bedrock-mantle` 제공자 아래에 표시됩니다. 기본값을 재정의하려는 경우가 아니면 추가 설정이 필요하지 않습니다.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 자격 증명">
    **적합한 경우:** AWS SDK 호환 자격 증명(공유 설정, SSO, 웹 자격 증명, 인스턴스 또는 작업 역할)을 사용하는 환경.

    <Steps>
      <Step title="Gateway 호스트에서 AWS 자격 증명 구성">
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
    `AWS_BEARER_TOKEN_BEDROCK`이 설정되지 않은 경우 OpenClaw는 공유 자격 증명/설정 프로필, SSO, 웹 자격 증명, 인스턴스 또는 작업 역할을 포함한 AWS 기본 자격 증명 체인에서 베어러 토큰을 생성합니다.
    </Tip>

  </Tab>
</Tabs>

## 자동 모델 검색

`AWS_BEARER_TOKEN_BEDROCK`이 설정되어 있으면 OpenClaw는 이를 직접 사용합니다. 그렇지 않으면 OpenClaw는 AWS 기본 자격 증명 체인에서 Mantle 베어러 토큰 생성을 시도합니다. 그런 다음 해당 리전의 `/v1/models` 엔드포인트를 쿼리하여 사용 가능한 Mantle 모델을 검색합니다.

| 동작              | 세부 정보                                                                          |
| ----------------- | ---------------------------------------------------------------------------------- |
| 검색 캐시         | 리전별로 결과를 1시간 동안 캐시하며, 가져오기에 실패하면 마지막 캐시 결과를 반환합니다 |
| IAM 토큰 갱신     | 리전별로 캐시되며 2시간마다 갱신됩니다                                              |

Mantle Plugin을 활성화된 상태로 유지하면서 자동 검색 및 IAM 베어러 토큰 생성을 중지하려면 Plugin 소유의 검색 토글을 비활성화하십시오.

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
베어러 토큰은 표준 [Amazon Bedrock](/ko/providers/bedrock) 제공자가 사용하는 것과 동일한 `AWS_BEARER_TOKEN_BEDROCK`입니다.
</Note>

### 지원되는 리전

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## 수동 구성

자동 검색 대신 명시적 구성을 사용하려면 다음과 같이 설정하십시오.

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

명시적으로 지정된 비어 있지 않은 `models` 목록이 우선하며, 아래의 Claude 항목을 포함한 검색 결과의 모든 항목을 대체합니다. 자동 Mantle 카탈로그를 유지하려면 `models`를 생략하고, 사용하려는 Claude 모델 항목을 모두 포함하려면 완전한 항목을 지정하십시오.

## 고급 구성

<AccordionGroup>
  <Accordion title="추론 지원">
    추론 지원 여부는 모델 ID에 `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` 또는 `gpt-oss-safeguard-120b`와 같은 패턴이 포함되어 있는지를 기준으로 추론됩니다. OpenClaw는 검색 중에 일치하는 모델에 `reasoning: true`를 자동으로 설정합니다.
  </Accordion>

  <Accordion title="엔드포인트 사용 불가">
    Mantle 엔드포인트를 사용할 수 없거나, 모델을 반환하지 않거나, 베어러 토큰 확인에 실패하면 검색은 빈 결과를 반환하고 암시적 제공자는 건너뜁니다. OpenClaw는 오류를 발생시키지 않으며, 구성된 다른 제공자는 계속 정상적으로 작동합니다.
  </Accordion>

  <Accordion title="Anthropic Messages 경로를 통한 Claude">
    자동 검색이 모델 목록을 관리하는 경우 OpenClaw는 `/v1/models`가 반환하는 내용과 관계없이 조회에 성공한 후 Claude 모델 4개를 추가합니다. `amazon-bedrock-mantle/anthropic.claude-sonnet-5`(Claude Sonnet 5), `amazon-bedrock-mantle/anthropic.claude-opus-4-7`(Claude Opus 4.7), `amazon-bedrock-mantle/anthropic.claude-mythos-5`(Claude Mythos 5), 그리고 `amazon-bedrock-mantle/anthropic.claude-mythos-preview`(Claude Mythos Preview)입니다. 이 모델들은 `anthropic-messages` API 인터페이스를 사용하며, 동일한 베어러 인증 Anthropic 호환 엔드포인트(`<mantle-base>/anthropic`)를 통해 스트리밍하므로 AWS 베어러 토큰은 Anthropic API 키처럼 취급되지 않습니다.

    Claude Sonnet 5는 항상 적응형 사고를 사용하며 기본 노력 수준은 `high`입니다. Mantle 경로에서는 사고를 비활성화할 수 없으므로 `/think off`와 `/think minimal`은 `low`로 매핑됩니다. 또한 OpenClaw는 Sonnet 5 요청에서 사용자 지정 temperature를 생략합니다.

    Claude Mythos 5는 액세스가 제한되어 있습니다. 1,000,000토큰 컨텍스트 창과 128,000토큰 출력 한도를 제공하고, 항상 적응형 사고를 사용하며, `/think off`와 `/think minimal`을 `low`로 매핑하고, 호출자가 선택한 샘플링 매개변수를 생략합니다.

    Claude Mythos Preview는 항상 추론을 요청하며, `/think` 수준이 설정되지 않은 경우 기본 노력 수준은 `high`입니다(`xhigh`/`max`는 `high`로 낮추고 `minimal`은 `low`로 높여 매핑). Mantle의 Opus 4.7은 모델이 제공하는 추론 없이 스트리밍되며, 이 경로에서는 Opus 4.7이 샘플링 재정의를 허용하지 않으므로 OpenClaw는 해당 모델의 `temperature` 매개변수를 생략합니다. Mythos Preview는 `temperature` 재정의를 정상적으로 허용합니다.

    비어 있지 않은 명시적 `models.providers["amazon-bedrock-mantle"].models` 목록은 검색된 전체 카탈로그를 대체합니다. 이러한 내장 Claude 항목을 사용하려면 해당 목록을 생략하십시오.

  </Accordion>

  <Accordion title="Amazon Bedrock 제공자와의 관계">
    Bedrock Mantle은 표준 [Amazon Bedrock](/ko/providers/bedrock) 제공자와 별개의 제공자입니다. Mantle은 OSS 카탈로그에 OpenAI 호환 `/v1` 인터페이스를 사용하지만, 표준 Bedrock 제공자는 네이티브 Bedrock Converse API를 사용합니다.

    두 제공자는 `AWS_BEARER_TOKEN_BEDROCK` 자격 증명이 있는 경우 이를 공유합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ko/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan 및 기타 모델을 위한 네이티브 Bedrock 제공자입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보와 자격 증명 재사용 규칙입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법입니다.
  </Card>
</CardGroup>
