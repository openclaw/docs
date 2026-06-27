---
read_when:
    - OpenClaw에서 Amazon Bedrock 모델을 사용하려는 경우
    - 모델 호출을 위해 AWS 자격 증명/리전 설정이 필요합니다
summary: OpenClaw에서 Amazon Bedrock(Converse API) 모델 사용
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:00:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw는 **Bedrock Converse** 스트리밍 제공자를 통해 **Amazon Bedrock** 모델을 사용할 수 있습니다. Bedrock 인증은 API 키가 아니라 **AWS SDK 기본 자격 증명 체인**을 사용합니다.

| 속성 | 값                                                       |
| -------- | ----------------------------------------------------------- |
| 제공자 | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| 인증     | AWS 자격 증명(환경 변수, 공유 구성, 또는 인스턴스 역할) |
| 리전   | `AWS_REGION` 또는 `AWS_DEFAULT_REGION`(기본값: `us-east-1`) |

## 시작하기

선호하는 인증 방식을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="Access keys / env vars">
    **가장 적합한 경우:** 개발자 머신, CI, 또는 AWS 자격 증명을 직접 관리하는 호스트.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
        `apiKey`는 필요하지 않습니다. 제공자를 `auth: "aws-sdk"`로 구성하세요.

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    환경 표시자 인증(`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, 또는 `AWS_BEARER_TOKEN_BEDROCK`)을 사용하면 OpenClaw가 추가 구성 없이 모델 검색을 위한 암시적 Bedrock 제공자를 자동으로 활성화합니다.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **가장 적합한 경우:** IAM 역할이 연결되어 있고 인증에 인스턴스 메타데이터 서비스를 사용하는 EC2 인스턴스.

    <Steps>
      <Step title="Enable discovery explicitly">
        IMDS를 사용할 때 OpenClaw는 환경 표시자만으로 AWS 인증을 감지할 수 없으므로, 명시적으로 옵트인해야 합니다.

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        환경 표시자 자동 감지 경로도 작동하게 하려면(예: `openclaw status` 화면용):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        가짜 API 키는 **필요하지** 않습니다.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    EC2 인스턴스에 연결된 IAM 역할에는 다음 권한이 있어야 합니다.

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`(자동 검색용)
    - `bedrock:ListInferenceProfiles`(추론 프로필 검색용)

    또는 관리형 정책 `AmazonBedrockFullAccess`를 연결하세요.
    </Warning>

    <Note>
    자동 모드 또는 상태 화면을 위한 환경 표시자가 특별히 필요한 경우에만 `AWS_PROFILE=default`가 필요합니다. 실제 Bedrock 런타임 인증 경로는 AWS SDK 기본 체인을 사용하므로, 환경 표시자가 없어도 IMDS 인스턴스 역할 인증이 작동합니다.
    </Note>

  </Tab>
</Tabs>

## 자동 모델 검색

OpenClaw는 **스트리밍**과 **텍스트 출력**을 지원하는 Bedrock 모델을 자동으로 검색할 수 있습니다. 검색은 `bedrock:ListFoundationModels`와 `bedrock:ListInferenceProfiles`를 사용하며, 결과는 캐시됩니다(기본값: 1시간).

암시적 제공자가 활성화되는 방식:

- `plugins.entries.amazon-bedrock.config.discovery.enabled`가 `true`이면,
  AWS 환경 표시자가 없어도 OpenClaw가 검색을 시도합니다.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`가 설정되지 않은 경우,
  OpenClaw는 다음 AWS 인증 표시자 중 하나를 확인했을 때만
  암시적 Bedrock 제공자를 자동으로 추가합니다:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, 또는 `AWS_PROFILE`.
- 실제 Bedrock 런타임 인증 경로는 여전히 AWS SDK 기본 체인을 사용하므로,
  검색을 옵트인하기 위해 `enabled: true`가 필요했던 경우에도 공유 구성,
  SSO, IMDS 인스턴스 역할 인증이 작동할 수 있습니다.

<Note>
명시적인 `models.providers["amazon-bedrock"]` 항목의 경우, OpenClaw는 전체 런타임 인증 로딩을 강제하지 않고도 `AWS_BEARER_TOKEN_BEDROCK` 같은 AWS 환경 표시자에서 Bedrock 환경 표시자 인증을 초기에 확인할 수 있습니다. 실제 모델 호출 인증 경로는 여전히 AWS SDK 기본 체인을 사용합니다.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    구성 옵션은 `plugins.entries.amazon-bedrock.config.discovery` 아래에 있습니다.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | 옵션 | 기본값 | 설명 |
    | ------ | ------- | ----------- |
    | `enabled` | auto | 자동 모드에서 OpenClaw는 지원되는 AWS 환경 표시자를 확인했을 때만 암시적 Bedrock 제공자를 활성화합니다. 검색을 강제하려면 `true`로 설정하세요. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 검색 API 호출에 사용되는 AWS 리전. |
    | `providerFilter` | (전체) | Bedrock 제공자 이름과 일치합니다(예: `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | 초 단위 캐시 기간. 캐싱을 비활성화하려면 `0`으로 설정하세요. |
    | `defaultContextWindow` | `32000` | 검색된 모델에 사용되는 컨텍스트 창(모델 제한을 알고 있다면 재정의하세요). |
    | `defaultMaxTokens` | `4096` | 검색된 모델에 사용되는 최대 출력 토큰 수(모델 제한을 알고 있다면 재정의하세요). |

  </Accordion>
</AccordionGroup>

## 빠른 설정(AWS 경로)

이 안내는 IAM 역할을 만들고, Bedrock 권한을 연결하고, 인스턴스 프로필을 연결한 뒤, EC2 호스트에서 OpenClaw 검색을 활성화합니다.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## 고급 구성

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw는 기반 모델과 함께 **리전 및 글로벌 추론 프로필**을 검색합니다. 프로필이 알려진 기반 모델에 매핑되면, 해당 프로필은 그 모델의 기능(컨텍스트 창, 최대 토큰, 추론, 비전)을 상속하고 올바른 Bedrock 요청 리전이 자동으로 주입됩니다. 즉, 교차 리전 Claude 프로필은 수동 제공자 재정의 없이 작동합니다.

    추론 프로필 ID는 `us.anthropic.claude-opus-4-6-v1:0`(리전)
    또는 `anthropic.claude-opus-4-6-v1:0`(글로벌)처럼 보입니다. 기반 모델이 이미
    검색 결과에 있으면 프로필은 전체 기능 집합을 상속합니다.
    그렇지 않으면 안전한 기본값이 적용됩니다.

    추가 구성은 필요하지 않습니다. 검색이 활성화되어 있고 IAM 주체에 `bedrock:ListInferenceProfiles` 권한이 있으면, 프로필은 `openclaw models list`에서 기반 모델과 함께 표시됩니다.

  </Accordion>

  <Accordion title="Service tier">
    일부 Bedrock 모델은 비용 또는 지연 시간을 최적화하기 위해 `service_tier` 매개변수를 지원합니다. 사용할 수 있는 티어는 다음과 같습니다.

    | 티어 | 설명 |
    |------|-------------|
    | `default` | 표준 Bedrock 티어 |
    | `flex` | 더 긴 지연 시간을 허용할 수 있는 워크로드를 위한 할인 처리 |
    | `priority` | 지연 시간에 민감한 워크로드를 위한 우선 처리 |
    | `reserved` | 안정 상태 워크로드를 위한 예약 용량 |

    Bedrock 모델 요청에 대해 `agents.defaults.params`를 통해 `serviceTier`(또는 `service_tier`)를 설정하거나, `agents.defaults.models["<model-key>"].params`에서 모델별로 설정하세요.

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    유효한 값은 `default`, `flex`, `priority`, `reserved`입니다. 모든
    모델이 모든 티어를 지원하지는 않습니다. 지원되지 않는 티어가 요청되면 Bedrock은
    검증 오류를 반환합니다. 참고: 오류 메시지는 다소 오해의 소지가 있을 수 있습니다.
    지원되지 않는 서비스 티어를 나타내는 대신 "The provided model identifier is invalid"라고
    표시될 수 있습니다. 이 오류가 보이면 모델이 요청한 티어를 지원하는지 확인하세요.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock은 Claude Opus 4.7에 대해 `temperature` 매개변수를 거부합니다. OpenClaw는 기반 모델 ID, 명명된 추론 프로필, `bedrock:GetInferenceProfile`을 통해 기본 모델이 Opus 4.7로 확인되는 애플리케이션 추론 프로필, 그리고 선택적 리전 접두사(`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`)가 있는 점 표기 `opus-4.7` 변형을 포함해, 모든 Opus 4.7 Bedrock 참조에 대해 `temperature`를 자동으로 생략합니다. 구성 노브는 필요하지 않으며, 이 생략은 요청 옵션 객체와 `inferenceConfig` 페이로드 필드 모두에 적용됩니다.
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1`에서 `amazon-bedrock/anthropic.claude-fable-5`를 사용하거나,
    `us.anthropic.claude-fable-5` 같은 리전별 추론 ID를 사용하세요.
    OpenClaw는 Fable의 1M 컨텍스트 창, 128K 출력 제한, 항상 켜진
    적응형 사고, 지원되는 effort 매핑을 적용합니다. `/think off`와
    `/think minimal`은 `low`에 매핑되며, 지원되지 않는 temperature와 강제 도구
    선택 제어는 생략됩니다. Bedrock이 종료 상태를 반환할 때까지 스트리밍 출력은
    보류되므로 스트림 중간의 거부가 부분 텍스트를 노출하지 않습니다.
    Fable은 표준 서비스 티어만 지원합니다. OpenClaw는 이 모델에 대해 구성된
    `flex`, `priority`, `reserved` 티어를 무시합니다.

    AWS는 Fable을 사용할 수 있기 전에 명시적인 `provider_data_share` 데이터 보존 옵트인이
    필요합니다. 프롬프트와 완성 결과는 Anthropic과 공유되며 신뢰 및 안전을 위해
    최대 30일 동안 보존됩니다. 모델을 활성화하기 전에
    [Bedrock 데이터 보존](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)을
    검토하고 구성하세요.

  </Accordion>

  <Accordion title="가드레일">
    `amazon-bedrock` Plugin 구성에 `guardrail` 객체를 추가하면
    모든 Bedrock 모델 호출에 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)를
    적용할 수 있습니다. 가드레일을 사용하면 콘텐츠 필터링, 주제 거부,
    단어 필터, 민감한 정보 필터, 문맥 기반 grounding 검사를 강제할 수 있습니다.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | 옵션 | 필수 | 설명 |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | 예 | 가드레일 ID(예: `abc123`) 또는 전체 ARN(예: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | 예 | 게시된 버전 번호 또는 작업 중인 초안의 경우 `"DRAFT"`. |
    | `streamProcessingMode` | 아니요 | 스트리밍 중 가드레일 평가에 사용할 `"sync"` 또는 `"async"`. 생략하면 Bedrock이 기본값을 사용합니다. |
    | `trace` | 아니요 | 디버깅에는 `"enabled"` 또는 `"enabled_full"`을 사용하고, 프로덕션에서는 생략하거나 `"disabled"`로 설정하세요. |

    <Warning>
    Gateway에서 사용하는 IAM 보안 주체에는 표준 호출 권한 외에도 `bedrock:ApplyGuardrail` 권한이 있어야 합니다.
    </Warning>

  </Accordion>

  <Accordion title="메모리 검색용 임베딩">
    Bedrock은 [메모리 검색](/ko/concepts/memory-search)을 위한 임베딩 제공자로도
    사용할 수 있습니다. 이는 추론 제공자와 별도로 구성됩니다. `agents.defaults.memorySearch.provider`를
    `"bedrock"`으로 설정하세요.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Bedrock 임베딩은 추론과 동일한 AWS SDK 자격 증명 체인(인스턴스 역할,
    SSO, 액세스 키, 공유 구성, 웹 ID)을 사용합니다. API 키는 필요하지 않습니다.
    Bedrock 임베딩을 사용하려면 `memorySearch.provider: "bedrock"`을 명시적으로 설정하세요.

    지원되는 임베딩 모델에는 Amazon Titan Embed(v1, v2), Amazon Nova
    Embed, Cohere Embed(v3, v4), TwelveLabs Marengo가 포함됩니다. 전체 모델 목록과
    차원 옵션은 [메모리 구성 참조 -- Bedrock](/ko/reference/memory-config#bedrock-embedding-config)을
    참조하세요.

  </Accordion>

  <Accordion title="참고 사항 및 주의점">
    - Bedrock은 AWS 계정/리전에서 **모델 액세스**가 활성화되어 있어야 합니다.
    - 자동 검색에는 `bedrock:ListFoundationModels` 및
      `bedrock:ListInferenceProfiles` 권한이 필요합니다.
    - 자동 모드에 의존하는 경우 Gateway 호스트에 지원되는 AWS 인증 env 마커 중 하나를
      설정하세요. env 마커 없이 IMDS/공유 구성 인증을 선호한다면
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`를 설정하세요.
    - OpenClaw는 자격 증명 소스를 다음 순서로 표시합니다. `AWS_BEARER_TOKEN_BEDROCK`,
      그다음 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, 그다음 `AWS_PROFILE`, 그다음
      기본 AWS SDK 체인입니다.
    - 추론 지원은 모델에 따라 다릅니다. 현재 기능은 Bedrock 모델 카드를 확인하세요.
    - 관리형 키 흐름을 선호한다면 Bedrock 앞에 OpenAI 호환
      프록시를 배치하고 대신 OpenAI 제공자로 구성할 수도 있습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="메모리 검색" href="/ko/concepts/memory-search" icon="magnifying-glass">
    메모리 검색 구성을 위한 Bedrock 임베딩.
  </Card>
  <Card title="메모리 구성 참조" href="/ko/reference/memory-config#bedrock-embedding-config" icon="database">
    전체 Bedrock 임베딩 모델 목록과 차원 옵션.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ.
  </Card>
</CardGroup>
