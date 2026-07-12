---
read_when:
    - OpenClaw에서 Amazon Bedrock 모델을 사용하려고 합니다
    - 모델 호출을 위한 AWS 자격 증명/리전 설정이 필요합니다
summary: OpenClaw에서 Amazon Bedrock(Converse API) 모델 사용하기
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T15:38:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw은 **Bedrock Converse** 스트리밍 제공자를 통해 **Amazon Bedrock**
모델을 사용할 수 있습니다. Bedrock 인증은 API 키가 아닌 **AWS SDK 기본 자격 증명 체인**을
사용합니다.

| 속성     | 값                                                               |
| -------- | ---------------------------------------------------------------- |
| 제공자   | `amazon-bedrock`                                                 |
| API      | `bedrock-converse-stream`                                        |
| 인증     | AWS 자격 증명(환경 변수, 공유 구성 또는 인스턴스 역할)            |
| 리전     | `AWS_REGION` 또는 `AWS_DEFAULT_REGION`(기본값: `us-east-1`)       |

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르십시오.

<Tabs>
  <Tab title="액세스 키/환경 변수">
    **적합한 환경:** AWS 자격 증명을 직접 관리하는 개발자 머신, CI 또는 호스트입니다.

    <Steps>
      <Step title="Gateway 호스트에서 AWS 자격 증명 설정">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # 선택 사항:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # 선택 사항(Bedrock API 키/전달자 토큰):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="구성에 Bedrock 제공자 및 모델 추가">
        `apiKey`는 필요하지 않습니다. `auth: "aws-sdk"`로 제공자를 구성하십시오.

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
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    환경 표시자 인증(`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` 또는 `AWS_BEARER_TOKEN_BEDROCK`)을 사용하면 OpenClaw이 추가 구성 없이 모델 검색용 암시적 Bedrock 제공자를 자동으로 활성화합니다.
    </Tip>

  </Tab>

  <Tab title="EC2 인스턴스 역할(IMDS)">
    **적합한 환경:** IAM 역할이 연결되어 있고 인증에 인스턴스 메타데이터 서비스를 사용하는 EC2 인스턴스입니다.

    <Steps>
      <Step title="검색 명시적 활성화">
        IMDS를 사용할 때 OpenClaw은 환경 표시자만으로 AWS 인증을 감지할 수 없으므로 명시적으로 사용 설정해야 합니다.

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="자동 모드용 환경 표시자 선택적 추가">
        환경 표시자 자동 감지 경로도 작동하도록 하려면(예: `openclaw status` 화면) 다음을 설정하십시오.

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        가짜 API 키는 **필요하지 않습니다**.
      </Step>
      <Step title="모델 검색 여부 확인">
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

    또는 관리형 정책 `AmazonBedrockFullAccess`를 연결하십시오.
    </Warning>

    <Note>
    자동 모드 또는 상태 화면용 환경 표시자가 특별히 필요한 경우에만 `AWS_PROFILE=default`가 필요합니다. 실제 Bedrock 런타임 인증 경로는 AWS SDK 기본 체인을 사용하므로 환경 표시자가 없어도 IMDS 인스턴스 역할 인증이 작동합니다.
    </Note>

  </Tab>
</Tabs>

## 자동 모델 검색

OpenClaw은 **스트리밍**과 **텍스트 출력**을 지원하는 Bedrock 모델을
자동으로 검색할 수 있습니다. 검색은 `bedrock:ListFoundationModels`와
`bedrock:ListInferenceProfiles`를 사용하며, 결과는 캐시됩니다(기본값: 1시간).

암시적 제공자가 활성화되는 방식은 다음과 같습니다.

- `plugins.entries.amazon-bedrock.config.discovery.enabled`가 `true`이면
  AWS 환경 표시자가 없어도 OpenClaw이 검색을 시도합니다.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`가 설정되지 않았으면
  OpenClaw은 다음 AWS 인증 표시자 중 하나를 감지한 경우에만
  암시적 Bedrock 제공자를 자동으로 추가합니다.
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` 또는 `AWS_PROFILE`.
- 실제 Bedrock 런타임 인증 경로는 계속 AWS SDK 기본 체인을 사용하므로
  검색을 사용 설정하기 위해 `enabled: true`가 필요했더라도 공유 구성, SSO 및
  IMDS 인스턴스 역할 인증이 작동할 수 있습니다.

<Note>
명시적인 `models.providers["amazon-bedrock"]` 항목의 경우에도 OpenClaw은 전체 런타임 인증 로딩을 강제하지 않고 `AWS_BEARER_TOKEN_BEDROCK` 같은 AWS 환경 표시자에서 Bedrock 환경 표시자 인증을 조기에 확인할 수 있습니다. 실제 모델 호출 인증 경로는 계속 AWS SDK 기본 체인을 사용합니다.
</Note>

<AccordionGroup>
  <Accordion title="검색 구성 옵션">
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
    | ---- | ------ | ---- |
    | `enabled` | 자동 | 자동 모드에서 OpenClaw은 지원되는 AWS 환경 표시자를 감지한 경우에만 암시적 Bedrock 제공자를 활성화합니다. 검색을 강제하려면 `true`로 설정하십시오. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 검색 API 호출에 사용하는 AWS 리전입니다. |
    | `providerFilter` | (전체) | Bedrock 제공자 이름과 일치시킵니다(예: `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | 캐시 지속 시간(초)입니다. 캐싱을 비활성화하려면 `0`으로 설정하십시오. |
    | `defaultContextWindow` | `32000` | 알려진 토큰 제한이 없는 검색된 모델에 사용하는 컨텍스트 창입니다(모델 제한을 알고 있다면 재정의하십시오). |
    | `defaultMaxTokens` | `4096` | 알려진 토큰 제한이 없는 검색된 모델에 사용하는 최대 출력 토큰 수입니다(모델 제한을 알고 있다면 재정의하십시오). |

  </Accordion>

  <Accordion title="컨텍스트 창 및 최대 토큰 제한">
    Bedrock `ListFoundationModels` 및 `GetFoundationModel` API는 토큰 제한
    메타데이터를 반환하지 않으며 모델 ID, 이름, 모달리티 및 수명 주기 상태만
    반환합니다. OpenClaw은 세션 관리, Compaction 임계값 및 컨텍스트 오버플로
    감지가 해당 모델에서 올바르게 작동하도록 인기 있는 Bedrock 모델(Claude,
    Nova, Llama, Mistral, DeepSeek 등)의 알려진 컨텍스트 창과 출력 제한에 대한
    조회 테이블을 제공합니다.

    테이블에 없는 검색된 모델은 `defaultContextWindow`와
    `defaultMaxTokens`를 대체 값으로 사용합니다. 사용하는 모델에 정확한 제한이
    누락되어 있으면 명시적인
    `models.providers["amazon-bedrock"].models` 항목으로 재정의하십시오.

  </Accordion>
</AccordionGroup>

## 빠른 설정(AWS 경로)

이 안내에서는 IAM 역할을 생성하고, Bedrock 권한을 연결하고, 인스턴스 프로필을
연결한 다음 EC2 호스트에서 OpenClaw 검색을 활성화합니다.

```bash
# 1. IAM 역할 및 인스턴스 프로필 생성
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

# 2. EC2 인스턴스에 연결
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. EC2 인스턴스에서 검색을 명시적으로 활성화
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. 선택 사항: 명시적 활성화 없이 자동 모드를 사용하려면 환경 표시자 추가
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. 모델 검색 여부 확인
openclaw models list
```

## 고급 구성

<AccordionGroup>
  <Accordion title="추론 프로필">
    OpenClaw은 기반 모델과 함께 **리전 및 글로벌 추론 프로필**을 검색합니다.
    프로필이 알려진 기반 모델에 매핑되면 해당 모델의 기능(컨텍스트 창, 최대 토큰,
    추론, 비전)을 상속하고 올바른 Bedrock 요청 리전이 자동으로 주입됩니다.
    따라서 리전 간 Claude 프로필이 수동 제공자 재정의 없이 작동합니다. 글로벌
    리전 간 프로필(`global.*`)은 일반적으로 더 나은 용량과 자동 장애 조치를
    제공하므로 `openclaw models list`에서 먼저 표시됩니다.

    추론 프로필 ID는 `us.anthropic.claude-opus-4-6-v1:0`(리전) 또는
    `anthropic.claude-opus-4-6-v1:0`(글로벌)과 같은 형식입니다. 기반 모델이 이미
    검색 결과에 있으면 프로필이 전체 기능 세트를 상속하고, 그렇지 않으면 안전한
    기본값이 적용됩니다.

    추가 구성은 필요하지 않습니다. 검색이 활성화되어 있고 IAM 주체에
    `bedrock:ListInferenceProfiles` 권한이 있으면 프로필이
    `openclaw models list`에서 기반 모델과 함께 표시됩니다.

  </Accordion>

  <Accordion title="서비스 계층">
    일부 Bedrock 모델은 비용 또는 지연 시간을 최적화하기 위한 `service_tier`
    매개변수를 지원합니다. 다음 계층을 사용할 수 있습니다.

    | 계층 | 설명 |
    |------|------|
    | `default` | 표준 Bedrock 계층 |
    | `flex` | 더 긴 지연 시간을 허용할 수 있는 워크로드를 위한 할인 처리 |
    | `priority` | 지연 시간에 민감한 워크로드를 위한 우선 처리 |
    | `reserved` | 정상 상태 워크로드를 위한 예약 용량 |

    Bedrock 모델 요청에 대해 `agents.defaults.params`를 통해
    `serviceTier`(또는 `service_tier`)를 설정하거나,
    `agents.defaults.models["<model-key>"].params`에서 모델별로 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // 모든 모델에 적용
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // 모델별 재정의
              },
            },
          },
        },
      },
    }
    ```

    유효한 값은 `default`, `flex`, `priority`, `reserved`입니다. Claude
    Fable 5와 Sonnet 5는 `default` 티어만 지원합니다. 해당 모델에
    `flex`, `priority` 또는 `reserved`를 요청하면 OpenClaw가 경고를 표시하고
    무시합니다. 다른 모델의 경우에도 모든 모델이 모든 티어를 지원하는 것은
    아닙니다. 지원되지 않는 티어를 사용하면 Bedrock 검증 오류가 반환되며,
    오류 메시지는 문제의 원인이 티어임을 명시하지 않고
    "The provided model identifier is invalid"와 같이 오해를 유발할 수
    있습니다. 이 오류가 표시되면 모델이 요청된 티어를 지원하는지
    확인하십시오.

  </Accordion>

  <Accordion title="Claude Opus 4.7 및 4.8의 temperature">
    Bedrock은 Claude Opus 4.7 및 Opus 4.8에서 `temperature` 매개변수를
    거부합니다. OpenClaw는 일치하는 모든 Bedrock 참조에서 `temperature`를
    자동으로 생략합니다. 여기에는 기반 모델 ID, 명명된 추론 프로필,
    `bedrock:GetInferenceProfile`을 통해 기반 모델이 Opus 4.7/4.8로 확인되는
    애플리케이션 추론 프로필, 선택적 리전 접두사(`us.`, `eu.`, `ap.`, `apac.`,
    `au.`, `jp.`, `global.`)가 붙은 점 표기 `opus-4.7`/`opus-4.8` 변형이
    포함됩니다. 별도의 구성 옵션은 필요하지 않으며, 요청 옵션 객체와
    `inferenceConfig` 페이로드 필드 모두에서 생략됩니다.
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1`에서는 `amazon-bedrock/anthropic.claude-fable-5`를 사용하거나
    `us.anthropic.claude-fable-5`와 같은 리전 추론 ID를 사용하십시오.
    OpenClaw는 Fable의 1M 컨텍스트 창, 128K 출력 제한, 항상 활성화되는
    적응형 사고, 지원되는 노력 수준 매핑을 적용합니다. `/think off`와
    `/think minimal`은 `low`로 매핑되며, temperature 및 강제 도구 선택
    제어는 Opus 4.7/4.8 경로와 동일하게 생략됩니다. 스트리밍 도중의 거부가
    일부 텍스트를 노출하지 않도록 Bedrock이 종료 상태를 반환할 때까지
    스트리밍 출력을 보류합니다.

    Fable을 사용하려면 AWS에서 명시적인 `provider_data_share` 데이터 보존
    동의가 필요합니다. 프롬프트와 완성 결과는 Anthropic과 공유되며 신뢰 및
    안전을 위해 최대 30일 동안 보존됩니다. 모델을 활성화하기 전에
    [Bedrock 데이터 보존](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)을
    검토하고 구성하십시오.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5는 필요한 제한 액세스 승인을 받은 계정에서만 Bedrock을
    통해 사용할 수 있습니다. OpenClaw는 기반 모델
    `anthropic.claude-mythos-5`와 `us.anthropic.claude-mythos-5` 같은 리전
    또는 글로벌 추론 프로필을 인식합니다.

    OpenClaw는 1,000,000토큰 컨텍스트 창, 128,000토큰 출력 제한, 이미지
    입력, 프롬프트 캐싱, 거부 안전 스트리밍 및 네이티브 노력 수준을
    적용합니다. 적응형 사고는 항상 활성화됩니다. `/think off`와
    `/think minimal`은 `low`로 매핑되며, `xhigh`와 `max`는 계속 사용할 수
    있습니다. 사용자 지정 샘플링 값과 강제 도구 선택 값은 생략됩니다.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS는
    [`bedrock-runtime` 및 `bedrock-mantle` 엔드포인트](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html)
    모두에서 Sonnet 5를 사용할 수 있다고 문서화합니다.
    OpenClaw는 Bedrock 기반 모델 `anthropic.claude-sonnet-5`와
    `us.anthropic.claude-sonnet-5` 같은 리전 또는 글로벌 추론 프로필을
    인식합니다. 1,000,000토큰 컨텍스트 창, 128,000토큰 출력 제한, 이미지
    입력, 네이티브 노력 수준, 프롬프트 캐싱 및 거부 안전 스트리밍을
    적용합니다.

    Bedrock은 Sonnet 5의 적응형 사고를 활성화된 상태로 유지합니다.
    OpenClaw의 기본값은 `high`입니다. 이 경로에서는 사고를 비활성화할 수
    없으므로 `/think off`와 `/think minimal`은 `low`로 매핑됩니다. 적응형
    사고가 활성화된 동안에는 사용자 지정 temperature 값과 강제 도구 선택
    값이 생략됩니다.

  </Accordion>

  <Accordion title="가드레일">
    `amazon-bedrock` Plugin 구성에 `guardrail` 객체를 추가하면 모든 Bedrock
    모델 호출에 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)를
    적용할 수 있습니다. 가드레일을 사용하면 콘텐츠 필터링, 주제 거부, 단어
    필터, 민감한 정보 필터 및 컨텍스트 기반 근거 확인을 적용할 수 있습니다.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // 가드레일 ID 또는 전체 ARN
                guardrailVersion: "1", // 버전 번호 또는 "DRAFT"
                streamProcessingMode: "sync", // 선택 사항: "sync" 또는 "async"
                trace: "enabled", // 선택 사항: "enabled", "disabled" 또는 "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    `guardrailIdentifier`와 `guardrailVersion`은 필수입니다.

    | 옵션 | 설명 |
    | ------ | ----------- |
    | `guardrailIdentifier` | 가드레일 ID(예: `abc123`) 또는 전체 ARN(예: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`)입니다. |
    | `guardrailVersion` | 게시된 버전 번호 또는 작업 중인 초안의 경우 `"DRAFT"`입니다. |
    | `streamProcessingMode` | 스트리밍 중 가드레일 평가에 사용할 `"sync"` 또는 `"async"`입니다. 생략하면 Bedrock이 기본값을 사용합니다. |
    | `trace` | 디버깅의 경우 `"enabled"` 또는 `"enabled_full"`이며, 프로덕션에서는 생략하거나 `"disabled"`로 설정합니다. |

    <Warning>
    Gateway에서 사용하는 IAM 보안 주체에는 표준 호출 권한뿐 아니라 `bedrock:ApplyGuardrail` 권한도 있어야 합니다.
    </Warning>

  </Accordion>

  <Accordion title="메모리 검색용 임베딩">
    Bedrock은 [메모리 검색](/ko/concepts/memory-search)의 임베딩 제공자로도
    사용할 수 있습니다. 이는 추론 제공자와 별도로 구성합니다.
    `agents.defaults.memorySearch.provider`를 `"bedrock"`으로 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // 기본값
          },
        },
      },
    }
    ```

    Bedrock 임베딩은 추론과 동일한 AWS SDK 자격 증명 체인(인스턴스 역할,
    SSO, 액세스 키, 공유 구성 및 웹 ID)을 사용합니다. API 키는 필요하지
    않습니다.

    지원되는 임베딩 모델에는 Amazon Titan Embed(v1, v2), Amazon Nova
    Embed, Cohere Embed(v3, v4) 및 TwelveLabs Marengo가 포함됩니다. 전체
    모델 목록과 차원 옵션은
    [메모리 구성 참조 -- Bedrock](/ko/reference/memory-config#bedrock-embedding-config)을
    참조하십시오.

  </Accordion>

  <Accordion title="참고 사항 및 주의점">
    - Bedrock을 사용하려면 AWS 계정/리전에서 **모델 액세스**가 활성화되어 있어야 합니다.
    - 자동 검색에는 `bedrock:ListFoundationModels` 및
      `bedrock:ListInferenceProfiles` 권한이 필요합니다.
    - 자동 모드를 사용하는 경우 Gateway 호스트에 지원되는 AWS 인증 환경
      마커 중 하나를 설정하십시오. 환경 마커 없이 IMDS/공유 구성 인증을
      사용하려면 `plugins.entries.amazon-bedrock.config.discovery.enabled: true`로
      설정하십시오.
    - OpenClaw는 자격 증명 소스를 `AWS_BEARER_TOKEN_BEDROCK`, 그다음
      `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, 그다음 `AWS_PROFILE`,
      마지막으로 기본 AWS SDK 체인 순서로 표시합니다.
    - 추론 지원 여부는 모델에 따라 다릅니다. 현재 기능은 Bedrock 모델
      카드를 확인하십시오.
    - 관리형 키 흐름을 선호하는 경우 Bedrock 앞에 OpenAI 호환 프록시를
      배치하고 대신 OpenAI 제공자로 구성할 수도 있습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="메모리 검색" href="/ko/concepts/memory-search" icon="magnifying-glass">
    메모리 검색을 위한 Bedrock 임베딩 구성입니다.
  </Card>
  <Card title="메모리 구성 참조" href="/ko/reference/memory-config#bedrock-embedding-config" icon="database">
    전체 Bedrock 임베딩 모델 목록 및 차원 옵션입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ입니다.
  </Card>
</CardGroup>
