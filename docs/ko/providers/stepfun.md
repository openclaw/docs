---
read_when:
    - OpenClaw에서 StepFun 모델을 사용하려고 합니다
    - StepFun 설정 가이드가 필요합니다
summary: OpenClaw에서 StepFun 모델 사용하기
title: StepFun
x-i18n:
    generated_at: "2026-04-12T23:32:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a463bed0951d33802dcdb3a7784406272ee206b731e9864ea020323e67b4d159
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw에는 두 개의 프로바이더 id를 가진 번들 StepFun 프로바이더 Plugin이 포함되어 있습니다:

- 표준 엔드포인트용 `stepfun`
- Step Plan 엔드포인트용 `stepfun-plan`

<Warning>
Standard와 Step Plan은 서로 다른 엔드포인트와 모델 ref 접두사(`stepfun/...` 대 `stepfun-plan/...`)를 사용하는 **별도의 프로바이더**입니다. `.com` 엔드포인트에는 China 키를, `.ai` 엔드포인트에는 글로벌 키를 사용하세요.
</Warning>

## 리전 및 엔드포인트 개요

| 엔드포인트 | China (`.com`)                         | 글로벌 (`.ai`)                        |
| ---------- | -------------------------------------- | ------------------------------------- |
| Standard   | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan  | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

인증 env var: `STEPFUN_API_KEY`

## 기본 제공 카탈로그

Standard (`stepfun`):

| 모델 ref                 | 컨텍스트 | 최대 출력 | 참고                    |
| ------------------------ | -------- | --------- | ----------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536    | 기본 Standard 모델      |

Step Plan (`stepfun-plan`):

| 모델 ref                           | 컨텍스트 | 최대 출력 | 참고                      |
| ---------------------------------- | -------- | --------- | ------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536    | 기본 Step Plan 모델       |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536    | 추가 Step Plan 모델       |

## 시작하기

사용할 프로바이더 인터페이스를 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="Standard">
    **권장 대상:** 표준 StepFun 엔드포인트를 통한 범용 사용

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택 항목                  | 엔드포인트                      | 리전          |
        | -------------------------------- | ------------------------------ | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`    | International |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`   | China         |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        또는 China 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="비대화형 대체 방법">
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
    **권장 대상:** Step Plan 추론 엔드포인트

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택 항목                | 엔드포인트                              | 리전          |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`   | International |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1`  | China         |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        또는 China 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="비대화형 대체 방법">
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

## 고급

<AccordionGroup>
  <Accordion title="전체 구성: Standard 프로바이더">
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

  <Accordion title="전체 구성: Step Plan 프로바이더">
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

  <Accordion title="참고사항">
    - 이 프로바이더는 OpenClaw에 번들되어 있으므로 별도의 Plugin 설치 단계가 없습니다.
    - `step-3.5-flash-2603`은 현재 `stepfun-plan`에서만 노출됩니다.
    - 하나의 인증 흐름이 `stepfun`과 `stepfun-plan` 모두에 대해 리전에 맞는 프로필을 작성하므로, 두 인터페이스를 함께 검색할 수 있습니다.
    - 모델을 확인하거나 전환하려면 `openclaw models list`와 `openclaw models set <provider/model>`을 사용하세요.
  </Accordion>
</AccordionGroup>

<Note>
더 넓은 프로바이더 개요는 [Model providers](/ko/concepts/model-providers)를 참고하세요.
</Note>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 프로바이더" href="/ko/concepts/model-providers" icon="layers">
    모든 프로바이더, 모델 ref, 페일오버 동작 개요.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    프로바이더, 모델, Plugin을 위한 전체 구성 스키마.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델 선택 및 구성 방법.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API 키 관리 및 문서.
  </Card>
</CardGroup>
