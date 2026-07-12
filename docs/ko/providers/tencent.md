---
read_when:
    - OpenClaw에서 Tencent hy3를 사용하려고 합니다
    - TokenHub 또는 TokenPlan API 키 설정이 필요합니다
summary: hy3용 Tencent Cloud TokenHub 및 TokenPlan 설정
title: Tencent Cloud(TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T15:41:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

공식 Tencent Cloud 제공자 Plugin을 설치하여 OpenAI 호환 API를 사용하는 두 엔드포인트인 TokenHub(`tencent-tokenhub`)와 TokenPlan(`tencent-tokenplan`)을 통해 Tencent Hy3에 액세스합니다.

| 속성                      | 값                                                    |
| ------------------------- | ----------------------------------------------------- |
| 제공자 ID                 | `tencent-tokenhub`, `tencent-tokenplan`               |
| 패키지                    | `@openclaw/tencent-provider`                          |
| TokenHub 인증 환경 변수   | `TOKENHUB_API_KEY`                                    |
| TokenPlan 인증 환경 변수  | `TOKENPLAN_API_KEY`                                   |
| TokenHub 온보딩 플래그    | `--auth-choice tokenhub-api-key`                      |
| TokenPlan 온보딩 플래그   | `--auth-choice tokenplan-api-key`                     |
| TokenHub 직접 CLI 플래그  | `--tokenhub-api-key <key>`                            |
| TokenPlan 직접 CLI 플래그 | `--tokenplan-api-key <key>`                           |
| API                       | OpenAI 호환(`openai-completions`)                     |
| TokenHub 기본 URL         | `https://tokenhub.tencentmaas.com/v1`                 |
| TokenHub 글로벌 기본 URL  | `https://tokenhub-intl.tencentmaas.com/v1` (재정의)   |
| TokenPlan 기본 URL        | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| 기본 모델                 | `tencent-tokenhub/hy3`                                |

## 빠른 시작

<Steps>
  <Step title="Tencent API 키 생성">
    Tencent Cloud TokenHub 및 TokenPlan용 API 키를 생성합니다. 키에 제한된 액세스 범위를 선택하는 경우 허용된 모델에 **hy3**를 포함하고, TokenHub에서 사용할 계획이라면 **hy3 preview**도 포함합니다.
  </Step>
  <Step title="온보딩 실행">
    <CodeGroup>

```bash TokenHub 온보딩
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub 직접 플래그
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan 온보딩
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan 직접 플래그
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash 환경 변수만 사용
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="모델 확인">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## 비대화형 설정

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--non-interactive`와 함께 `--accept-risk`를 지정해야 합니다.
</Note>

## 기본 제공 카탈로그

| 모델 참조                      | 이름                    | 입력   | 컨텍스트 | 최대 출력 | 참고           |
| ------------------------------ | ----------------------- | ------ | -------- | --------- | -------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub)  | 텍스트 | 256,000  | 64,000    | 추론 지원      |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)          | 텍스트 | 256,000  | 64,000    | 추론 지원      |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)         | 텍스트 | 256,000  | 64,000    | 추론 지원      |

hy3는 추론, 긴 컨텍스트 명령 따르기, 코드 및 에이전트 워크플로를 위한 Tencent Hunyuan의 대규모 MoE 언어 모델입니다. Tencent의 OpenAI 호환 예시에서는 모델 ID로 `hy3`를 사용하며, 표준 채팅 완성 도구 호출과 `reasoning_effort`를 지원합니다.

<Tip>
  모델 ID는 `hy3`입니다. 이를 Tencent의 `HY-3D-*` 모델과 혼동하지 마십시오. 해당 모델은 3D 생성 API이며, 이 제공자가 구성하는 OpenClaw 채팅 모델이 아닙니다.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="엔드포인트 재정의">
    OpenClaw의 기본 제공 카탈로그는 Tencent Cloud의 `https://tokenhub.tencentmaas.com/v1` 엔드포인트를 사용합니다. TokenHub 계정 또는 리전에서 다른 엔드포인트를 요구하는 경우에만 재정의하십시오.

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="데몬의 환경 변수 가용성">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우 해당 프로세스에서 `TOKENHUB_API_KEY`와 `TOKENPLAN_API_KEY`를 사용할 수 있어야 합니다. launchd, systemd 또는 Docker exec 환경에서 이를 읽을 수 있도록 `~/.openclaw/.env`나 `env.shellEnv`를 통해 설정합니다.

    <Warning>
      대화형 셸에서만 내보낸 키는 관리형 Gateway 프로세스에서 사용할 수 없습니다. 지속적으로 사용할 수 있도록 환경 변수 파일 또는 구성 연결 지점을 사용하십시오.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 설정을 포함한 전체 구성 스키마입니다.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud의 TokenHub 제품 페이지입니다.
  </Card>
  <Card title="Hy3 preview 모델 카드" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview의 세부 정보와 벤치마크입니다.
  </Card>
</CardGroup>
