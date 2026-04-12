---
read_when:
    - OpenClaw에서 Amazon Bedrock 모델을 사용하고 싶습니다
    - 모델 호출을 위해 AWS 자격 증명 및 리전 설정이 필요합니다
summary: OpenClaw에서 Amazon Bedrock(Converse API) 모델 사용하기
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-12T23:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88e7e24907ec26af098b648e2eeca32add090a9e381c818693169ab80aeccc47
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw는 pi-ai의 **Bedrock Converse** 스트리밍 provider를 통해 **Amazon Bedrock** 모델을 사용할 수 있습니다. Bedrock 인증은 API 키가 아니라 **AWS SDK 기본 자격 증명 체인**을 사용합니다.

| Property | Value                                                       |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Auth     | AWS 자격 증명(환경 변수, 공유 구성 또는 인스턴스 역할)      |
| Region   | `AWS_REGION` 또는 `AWS_DEFAULT_REGION`(기본값: `us-east-1`) |

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="액세스 키 / 환경 변수">
    **적합한 대상:** 개발자 머신, CI 또는 AWS 자격 증명을 직접 관리하는 호스트.

    <Steps>
      <Step title="Gateway 호스트에 AWS 자격 증명 설정">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # 선택 사항:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # 선택 사항(Bedrock API 키/베어러 토큰):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="구성에 Bedrock provider와 모델 추가">
        `apiKey`는 필요하지 않습니다. `auth: "aws-sdk"`로 provider를 구성하세요.

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
    환경 변수 마커 인증(`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` 또는 `AWS_BEARER_TOKEN_BEDROCK`)을 사용하면, OpenClaw는 추가 구성 없이 모델 검색을 위해 암시적 Bedrock provider를 자동 활성화합니다.
    </Tip>

  </Tab>

  <Tab title="EC2 인스턴스 역할(IMDS)">
    **적합한 대상:** 인증에 인스턴스 메타데이터 서비스를 사용하는 IAM 역할이 연결된 EC2 인스턴스.

    <Steps>
      <Step title="명시적으로 검색 활성화">
        IMDS를 사용할 때는 OpenClaw가 환경 변수 마커만으로 AWS 인증을 감지할 수 없으므로, 명시적으로 opt-in해야 합니다.

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="자동 모드를 위한 환경 변수 마커 선택적 추가">
        환경 변수 마커 자동 감지 경로도 동작하게 하려면(예: `openclaw status` 표면용):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        가짜 API 키는 **필요하지 않습니다**.
      </Step>
      <Step title="모델이 검색되는지 확인">
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
    자동 모드 또는 상태 표면용 환경 변수 마커를 특별히 원할 때만 `AWS_PROFILE=default`가 필요합니다. 실제 Bedrock 런타임 인증 경로는 AWS SDK 기본 체인을 사용하므로, IMDS 인스턴스 역할 인증은 환경 변수 마커가 없어도 동작합니다.
    </Note>

  </Tab>
</Tabs>

## 자동 모델 검색

OpenClaw는 **스트리밍**과 **텍스트 출력**을 지원하는 Bedrock 모델을 자동으로 검색할 수 있습니다. 검색에는 `bedrock:ListFoundationModels`와 `bedrock:ListInferenceProfiles`가 사용되며, 결과는 캐시됩니다(기본값: 1시간).

암시적 provider가 활성화되는 방식:

- `plugins.entries.amazon-bedrock.config.discovery.enabled`가 `true`이면, OpenClaw는 AWS 환경 변수 마커가 없더라도 검색을 시도합니다.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`가 설정되지 않으면, OpenClaw는 다음 AWS 인증 마커 중 하나를 볼 때만 암시적 Bedrock provider를 자동 추가합니다: `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, 또는 `AWS_PROFILE`.
- 실제 Bedrock 런타임 인증 경로는 여전히 AWS SDK 기본 체인을 사용하므로, 공유 구성, SSO 및 IMDS 인스턴스 역할 인증은 검색에 `enabled: true`로 opt-in해야 했던 경우에도 동작할 수 있습니다.

<Note>
명시적인 `models.providers["amazon-bedrock"]` 항목의 경우, OpenClaw는 전체 런타임 인증 로드를 강제하지 않고도 `AWS_BEARER_TOKEN_BEDROCK` 같은 AWS 환경 변수 마커에서 Bedrock 환경 변수 마커 인증을 조기에 확인할 수 있습니다. 실제 모델 호출 인증 경로는 여전히 AWS SDK 기본 체인을 사용합니다.
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

    | Option | Default | 설명 |
    | ------ | ------- | ----------- |
    | `enabled` | auto | 자동 모드에서는 지원되는 AWS 환경 변수 마커가 보일 때만 OpenClaw가 암시적 Bedrock provider를 활성화합니다. 강제로 검색하려면 `true`로 설정하세요. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 검색 API 호출에 사용되는 AWS 리전입니다. |
    | `providerFilter` | (all) | Bedrock provider 이름과 일치시킵니다(예: `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | 초 단위 캐시 기간입니다. 캐시를 비활성화하려면 `0`으로 설정하세요. |
    | `defaultContextWindow` | `32000` | 검색된 모델에 사용되는 컨텍스트 윈도우입니다(모델 제한을 알고 있다면 재정의하세요). |
    | `defaultMaxTokens` | `4096` | 검색된 모델에 사용되는 최대 출력 토큰 수입니다(모델 제한을 알고 있다면 재정의하세요). |

  </Accordion>
</AccordionGroup>

## 빠른 설정(AWS 경로)

이 안내는 IAM 역할을 생성하고, Bedrock 권한을 연결하고, 인스턴스 프로필을 연결한 다음, EC2 호스트에서 OpenClaw 검색을 활성화합니다.

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

# 3. EC2 인스턴스에서 명시적으로 검색 활성화
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. 선택 사항: 명시적 활성화 없이 자동 모드를 원하면 환경 변수 마커 추가
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. 모델이 검색되는지 확인
openclaw models list
```

## 고급 구성

<AccordionGroup>
  <Accordion title="추론 프로필">
    OpenClaw는 foundation model과 함께 **리전 및 전역 추론 프로필**도 검색합니다. 프로필이 알려진 foundation model에 매핑되면, 해당 프로필은 그 모델의 기능(context window, max tokens, reasoning, vision)을 상속하고 올바른 Bedrock 요청 리전이 자동으로 주입됩니다. 즉, 교차 리전 Claude 프로필도 수동 provider 재정의 없이 동작합니다.

    추론 프로필 ID는 `us.anthropic.claude-opus-4-6-v1:0`(리전)
    또는 `anthropic.claude-opus-4-6-v1:0`(전역)처럼 보입니다. 백엔드 모델이 이미 검색 결과에 있으면, 프로필은 해당 모델의 전체 기능 집합을 상속합니다. 그렇지 않으면 안전한 기본값이 적용됩니다.

    추가 구성은 필요하지 않습니다. 검색이 활성화되어 있고 IAM 주체에 `bedrock:ListInferenceProfiles` 권한이 있으면, 프로필은 `openclaw models list`에서 foundation model과 함께 표시됩니다.

  </Accordion>

  <Accordion title="Guardrails">
    `amazon-bedrock` Plugin 구성에 `guardrail` 객체를 추가하면 모든 Bedrock 모델 호출에 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)를 적용할 수 있습니다. Guardrails를 사용하면 콘텐츠 필터링, 주제 차단, 단어 필터, 민감 정보 필터 및 컨텍스트 기반 grounding 검사를 적용할 수 있습니다.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID 또는 전체 ARN
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

    | Option | Required | 설명 |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Yes | Guardrail ID(예: `abc123`) 또는 전체 ARN(예: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Yes | 게시된 버전 번호 또는 작업 중 초안인 `"DRAFT"`입니다. |
    | `streamProcessingMode` | No | 스트리밍 중 guardrail 평가용 `"sync"` 또는 `"async"`입니다. 생략하면 Bedrock 기본값이 사용됩니다. |
    | `trace` | No | 디버깅용 `"enabled"` 또는 `"enabled_full"`입니다. 프로덕션에서는 생략하거나 `"disabled"`로 설정하세요. |

    <Warning>
    Gateway가 사용하는 IAM 주체에는 표준 호출 권한 외에 `bedrock:ApplyGuardrail` 권한도 있어야 합니다.
    </Warning>

  </Accordion>

  <Accordion title="메모리 검색용 임베딩">
    Bedrock는 [메모리 검색](/ko/concepts/memory-search)의 임베딩 provider로도 사용할 수 있습니다. 이는 추론 provider와 별도로 구성됩니다. `agents.defaults.memorySearch.provider`를 `"bedrock"`으로 설정하세요.

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

    Bedrock 임베딩은 추론과 동일한 AWS SDK 자격 증명 체인(인스턴스 역할, SSO, 액세스 키, 공유 구성, 웹 ID)을 사용합니다. API 키는 필요하지 않습니다. `provider`가 `"auto"`이면, 해당 자격 증명 체인이 성공적으로 확인될 경우 Bedrock가 자동 감지됩니다.

    지원되는 임베딩 모델에는 Amazon Titan Embed(v1, v2), Amazon Nova
Embed, Cohere Embed(v3, v4), TwelveLabs Marengo가 포함됩니다. 전체 모델 목록과 차원 옵션은
[메모리 구성 참조 -- Bedrock](/ko/reference/memory-config#bedrock-embedding-config)를
참조하세요.

  </Accordion>

  <Accordion title="참고 사항 및 주의점">
    - Bedrock를 사용하려면 AWS 계정/리전에서 **모델 액세스**가 활성화되어 있어야 합니다.
    - 자동 검색에는 `bedrock:ListFoundationModels` 및
      `bedrock:ListInferenceProfiles` 권한이 필요합니다.
    - 자동 모드에 의존한다면, Gateway 호스트에 지원되는 AWS 인증 환경 변수 마커 중 하나를 설정하세요.
      환경 변수 마커 없이 IMDS/공유 구성 인증을 선호한다면,
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`를 설정하세요.
    - OpenClaw는 자격 증명 소스를 다음 순서로 표시합니다: `AWS_BEARER_TOKEN_BEDROCK`,
      그다음 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, 그다음 `AWS_PROFILE`, 마지막으로
      기본 AWS SDK 체인입니다.
    - reasoning 지원 여부는 모델에 따라 다르므로, 현재 기능은 Bedrock 모델 카드에서
      확인하세요.
    - 관리형 키 흐름을 선호한다면, Bedrock 앞단에 OpenAI 호환
      프록시를 두고 이를 OpenAI provider로 구성할 수도 있습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작을 선택합니다.
  </Card>
  <Card title="메모리 검색" href="/ko/concepts/memory-search" icon="magnifying-glass">
    메모리 검색 구성을 위한 Bedrock 임베딩입니다.
  </Card>
  <Card title="메모리 구성 참조" href="/ko/reference/memory-config#bedrock-embedding-config" icon="database">
    전체 Bedrock 임베딩 모델 목록과 차원 옵션입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결과 FAQ입니다.
  </Card>
</CardGroup>
