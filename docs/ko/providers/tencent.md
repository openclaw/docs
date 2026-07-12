---
read_when:
    - OpenClaw에서 Tencent hy3를 사용하려고 합니다
    - TokenHub 또는 TokenPlan API 키 설정이 필요합니다
summary: hy3용 Tencent Cloud TokenHub 및 TokenPlan 설정
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T01:08:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

OpenAI 호환 API를 사용해 TokenHub(`tencent-tokenhub`)와 TokenPlan(`tencent-tokenplan)이라는 두 엔드포인트를 통해 Tencent Hy3에 액세스하려면 공식 Tencent Cloud 제공자 Plugin을 설치하세요.

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
  <Step title="Create a Tencent API key">
    Tencent Cloud TokenHub 및 TokenPlan용 API 키를 생성하세요. 키에 제한된 액세스 범위를 선택하는 경우 허용된 모델에 **hy3**를 포함하고, TokenHub에서 사용할 계획이라면 **hy3 preview**도 포함하세요.
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>
__OC_I18N_900000____OC_I18N_900001____OC_I18N_900002____OC_I18N_900003____OC_I18N_900004__
    </CodeGroup>

  </Step>
  <Step title="Verify the model">__OC_I18N_900005__  </Step>
</Steps>

## 비대화형 설정
__OC_I18N_900006__
<Note>
`--non-interactive`와 함께 `--accept-risk`를 사용해야 합니다.
</Note>

## 기본 제공 카탈로그

| 모델 참조                      | 이름                   | 입력   | 컨텍스트 | 최대 출력 | 참고              |
| ------------------------------ | ---------------------- | ------ | -------- | --------- | ----------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | 텍스트 | 256,000  | 64,000    | 추론 지원         |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | 텍스트 | 256,000  | 64,000    | 추론 지원         |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | 텍스트 | 256,000  | 64,000    | 추론 지원         |

hy3는 추론, 긴 컨텍스트 명령 준수, 코드 및 에이전트 워크플로를 위한 Tencent Hunyuan의 대규모 MoE 언어 모델입니다. Tencent의 OpenAI 호환 예시에서는 모델 ID로 `hy3`를 사용하며, 표준 채팅 완성 도구 호출과 `reasoning_effort`를 지원합니다.

<Tip>
  모델 ID는 `hy3`입니다. Tencent의 `HY-3D-*` 모델과 혼동하지 마세요. 해당 모델들은 3D 생성 API이며, 이 제공자가 구성하는 OpenClaw 채팅 모델이 아닙니다.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw의 기본 제공 카탈로그는 Tencent Cloud의 `https://tokenhub.tencentmaas.com/v1` 엔드포인트를 사용합니다. TokenHub 계정이나 리전에 다른 엔드포인트가 필요한 경우에만 재정의하세요.
__OC_I18N_900007__
  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Gateway가 관리형 서비스(launchd, systemd, Docker)로 실행되는 경우 해당 프로세스에서 `TOKENHUB_API_KEY` 및 `TOKENPLAN_API_KEY`를 확인할 수 있어야 합니다. launchd, systemd 또는 Docker exec 환경에서 읽을 수 있도록 `~/.openclaw/.env`나 `env.shellEnv`를 통해 설정하세요.

    <Warning>
      대화형 셸에서만 내보낸 키는 관리형 Gateway 프로세스에서 확인할 수 없습니다. 지속적으로 사용할 수 있도록 환경 파일이나 구성 연결 지점을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model providers" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 설정을 포함한 전체 구성 스키마입니다.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud의 TokenHub 제품 페이지입니다.
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview의 세부 정보와 벤치마크입니다.
  </Card>
</CardGroup>
