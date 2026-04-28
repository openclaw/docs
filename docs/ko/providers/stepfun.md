---
read_when:
    - OpenClaw에서 StepFun 모델을 사용하려는 경우
    - StepFun 설정 가이드가 필요한 경우
summary: OpenClaw에서 StepFun 모델 사용하기
title: StepFun
x-i18n:
    generated_at: "2026-04-24T06:32:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw에는 두 개의 provider id를 가진 번들 StepFun provider Plugin이 포함되어 있습니다.

- 표준 엔드포인트용 `stepfun`
- Step Plan 엔드포인트용 `stepfun-plan`

<Warning>
표준과 Step Plan은 **서로 다른 provider**이며 엔드포인트와 모델 ref 접두사도 다릅니다(`stepfun/...` vs `stepfun-plan/...`). China 키는 `.com` 엔드포인트와 함께, 글로벌 키는 `.ai` 엔드포인트와 함께 사용하세요.
</Warning>

## 리전 및 엔드포인트 개요

| 엔드포인트 | China (`.com`) | Global (`.ai`) |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard | `https://api.stepfun.com/v1` | `https://api.stepfun.ai/v1` |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

인증 환경 변수: `STEPFUN_API_KEY`

## 내장 카탈로그

표준 (`stepfun`):

| 모델 ref | 컨텍스트 | 최대 출력 | 참고 |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536 | 기본 표준 모델 |

Step Plan (`stepfun-plan`):

| 모델 ref | 컨텍스트 | 최대 출력 | 참고 |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash` | 262,144 | 65,536 | 기본 Step Plan 모델 |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536 | 추가 Step Plan 모델 |

## 시작하기

provider 표면을 선택한 뒤 설정 단계를 따르세요.

<Tabs>
  <Tab title="표준">
    **권장 용도:** 표준 StepFun 엔드포인트를 통한 범용 사용

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택 | 엔드포인트 | 리전 |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1` | 국제 |
        | `stepfun-standard-api-key-cn` | `https://api.stepfun.com/v1` | 중국 |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        또는 China 엔드포인트용:

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

    ### 모델 ref

    - 기본 모델: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **권장 용도:** Step Plan reasoning 엔드포인트

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택 | 엔드포인트 | 리전 |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1` | 국제 |
        | `stepfun-plan-api-key-cn` | `https://api.stepfun.com/step_plan/v1` | 중국 |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        또는 China 엔드포인트용:

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

    ### 모델 ref

    - 기본 모델: `stepfun-plan/step-3.5-flash`
    - 대체 모델: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 고급 설정

<AccordionGroup>
  <Accordion title="전체 설정: 표준 provider">
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

  <Accordion title="전체 설정: Step Plan provider">
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
    - 이 provider는 OpenClaw에 번들되어 있으므로 별도의 Plugin 설치 단계는 없습니다.
    - `step-3.5-flash-2603`은 현재 `stepfun-plan`에서만 노출됩니다.
    - 단일 인증 흐름이 `stepfun`과 `stepfun-plan` 모두에 대해 리전에 맞는 profile을 기록하므로, 두 표면을 함께 discovery할 수 있습니다.
    - 모델 확인 또는 전환에는 `openclaw models list`와 `openclaw models set <provider/model>`을 사용하세요.

  </Accordion>
</AccordionGroup>

<Note>
더 넓은 provider 개요는 [Model providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 ref, 장애 조치 동작 개요
  </Card>
  <Card title="설정 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider, 모델, Plugin에 대한 전체 설정 스키마
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API 키 관리 및 문서
  </Card>
</CardGroup>
