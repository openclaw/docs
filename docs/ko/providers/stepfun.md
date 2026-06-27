---
read_when:
    - OpenClaw에서 StepFun 모델을 사용하려는 경우
    - StepFun 설정 안내가 필요합니다
summary: OpenClaw에서 StepFun 모델 사용하기
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:04:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun 제공자 Plugin은 두 가지 제공자 ID를 지원합니다:

- 표준 엔드포인트용 `stepfun`
- Step Plan 엔드포인트용 `stepfun-plan`

<Warning>
표준 및 Step Plan은 서로 다른 엔드포인트와 모델 참조 접두사(`stepfun/...` 대 `stepfun-plan/...`)를 사용하는 **별도 제공자**입니다. `.com` 엔드포인트에는 중국 키를 사용하고, `.ai` 엔드포인트에는 글로벌 키를 사용하세요.
</Warning>

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## 리전 및 엔드포인트 개요

| 엔드포인트 | 중국 (`.com`)                          | 글로벌 (`.ai`)                         |
| ---------- | -------------------------------------- | -------------------------------------- |
| 표준       | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`            |
| Step Plan  | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1`  |

인증 환경 변수: `STEPFUN_API_KEY`

## 내장 카탈로그

표준 (`stepfun`):

| 모델 참조                | 컨텍스트 | 최대 출력 | 참고              |
| ------------------------ | -------- | --------- | ----------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536    | 기본 표준 모델    |

Step Plan (`stepfun-plan`):

| 모델 참조                          | 컨텍스트 | 최대 출력 | 참고                       |
| ---------------------------------- | -------- | --------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536    | 기본 Step Plan 모델        |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536    | 추가 Step Plan 모델        |

## 시작하기

제공자 표면을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="표준">
    **적합한 용도:** 표준 StepFun 엔드포인트를 통한 범용 사용.

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택                        | 엔드포인트                      | 리전      |
        | -------------------------------- | -------------------------------- | --------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | 국제      |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | 중국      |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        또는 중국 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="비대화형 대안">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### 모델 참조

    - 기본 모델: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **적합한 용도:** Step Plan 추론 엔드포인트.

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택                    | 엔드포인트                              | 리전      |
        | ---------------------------- | --------------------------------------- | --------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | 국제      |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | 중국      |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        또는 중국 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="비대화형 대안">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### 모델 참조

    - 기본 모델: `stepfun-plan/step-3.5-flash`
    - 대체 모델: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 고급 구성

<AccordionGroup>
  <Accordion title="전체 구성: 표준 제공자">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="전체 구성: Step Plan 제공자">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="참고">
    - 이 제공자는 공식 외부 패키지입니다. 설정 전에 설치하세요.
    - `step-3.5-flash-2603`은 현재 `stepfun-plan`에서만 노출됩니다.
    - 단일 인증 흐름은 `stepfun`과 `stepfun-plan` 모두에 대해 리전이 일치하는 프로필을 작성하므로, 두 표면을 함께 검색할 수 있습니다.
    - 모델을 검사하거나 전환하려면 `openclaw models list` 및 `openclaw models set <provider/model>`을 사용하세요.

  </Accordion>
</AccordionGroup>

<Note>
더 넓은 제공자 개요는 [모델 제공자](/ko/concepts/model-providers)를 참조하세요.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 제공자, 모델 참조, 장애 조치 동작에 대한 개요입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    제공자, 모델, Plugin의 전체 구성 스키마입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법입니다.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API 키 관리 및 문서입니다.
  </Card>
</CardGroup>
