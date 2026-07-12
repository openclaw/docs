---
read_when:
    - OpenClaw에서 StepFun 모델을 사용하려는 경우
    - StepFun 설정 안내가 필요합니다
summary: OpenClaw에서 StepFun 모델 사용하기
title: StepFun
x-i18n:
    generated_at: "2026-07-12T01:09:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun은 두 개의 제공자 ID를 사용하는 외부 공식 Plugin(`@openclaw/stepfun-provider`)으로 제공됩니다.

- 표준 엔드포인트용 `stepfun`
- Step Plan 엔드포인트용 `stepfun-plan`

<Warning>
표준 제공자와 Step Plan 제공자는 엔드포인트와 모델 참조 접두사가 서로 다른 **별개의 제공자**입니다(`stepfun/...` 및 `stepfun-plan/...`). `.com` 엔드포인트에는 중국 키를 사용하고 `.ai` 엔드포인트에는 글로벌 키를 사용하세요.
</Warning>

## Plugin 설치

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## 리전 및 엔드포인트 개요

| 엔드포인트 | 중국(`.com`)                           | 글로벌(`.ai`)                          |
| --------- | -------------------------------------- | -------------------------------------- |
| 표준      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`            |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1`  |

인증 환경 변수: `STEPFUN_API_KEY`

## 내장 카탈로그

표준(`stepfun`):

| 모델 참조                | 컨텍스트 | 최대 출력 | 참고                           |
| ------------------------ | -------- | --------- | ------------------------------ |
| `stepfun/step-3.5-flash` | 262,144  | 65,536    | 기본 표준 모델                 |
| `stepfun/step-3.7-flash` | 262,144  | 262,144   | 멀티모달 이미지 입력 지원      |

Step Plan(`stepfun-plan`):

| 모델 참조                          | 컨텍스트 | 최대 출력 | 참고                         |
| ---------------------------------- | -------- | --------- | ---------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536    | 기본 Step Plan 모델          |
| `stepfun-plan/step-3.7-flash`      | 262,144  | 262,144   | 멀티모달 이미지 입력 지원    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536    | 추가 Step Plan 모델          |

## 시작하기

<Tabs>
  <Tab title="표준">
    표준 StepFun 엔드포인트를 통한 범용 사용에 가장 적합합니다.

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택                        | 엔드포인트                    | 리전 |
        | -------------------------------- | ----------------------------- | ---- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`   | 국제 |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`  | 중국 |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        중국 엔드포인트:

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

    기본 모델: `stepfun/step-3.5-flash`
    대체 모델: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Step Plan 추론 엔드포인트에 가장 적합합니다.

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택                    | 엔드포인트                               | 리전 |
        | ---------------------------- | ---------------------------------------- | ---- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`    | 국제 |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1`   | 중국 |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        중국 엔드포인트:

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

    기본 모델: `stepfun-plan/step-3.5-flash`
    대체 모델: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

한 번의 인증 흐름으로 `stepfun`과 `stepfun-plan` 모두에 대해 리전이 일치하는 프로필이 작성되므로, 온보딩을 한 번 실행하면 두 제공자 표면이 함께 검색됩니다.

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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
    - `step-3.7-flash`는 OpenClaw를 통해 텍스트와 이미지 입력을 받습니다. StepFun API는 동영상도 지원하지만, 아직 OpenClaw의 모델 입력 모달리티로는 지원되지 않습니다.
    - Step 3.7은 `low`, `medium`, `high` 추론 강도를 지원합니다. 이 모델에는 비추론 모드가 없으므로 `/think off`는 `low`로 매핑됩니다.
    - `step-3.5-flash-2603`은 현재 `stepfun-plan`에서만 제공됩니다.
    - 모델을 확인하거나 전환하려면 `openclaw models list`와 `openclaw models set <provider/model>`을 사용하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    모든 제공자, 모델 참조 및 장애 조치 동작에 대한 개요입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    제공자, 모델 및 Plugin의 전체 구성 스키마입니다.
  </Card>
  <Card title="모델 CLI" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법입니다.
  </Card>
  <Card title="StepFun 플랫폼" href="https://platform.stepfun.com" icon="globe">
    StepFun API 키 관리 및 문서입니다.
  </Card>
</CardGroup>
