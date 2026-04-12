---
read_when:
    - OpenClaw에서 Volcano Engine 또는 Doubao 모델을 사용하려고 합니다
    - Volcengine API 키 설정이 필요합니다
summary: Volcano Engine 설정(Doubao 모델, 일반 + 코딩 엔드포인트)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-12T23:33:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a21f390da719f79c88c6d55a7d952d35c2ce5ff26d910c9f10020132cd7d2f4c
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Volcengine 프로바이더는 일반 작업과 코딩 작업을 위한 별도 엔드포인트를 통해,
Volcano Engine에 호스팅된 Doubao 모델과 서드파티 모델에 접근할 수 있게 해줍니다.

| 세부 정보   | 값                                                  |
| ----------- | --------------------------------------------------- |
| 프로바이더  | `volcengine`(일반) + `volcengine-plan`(코딩)        |
| 인증        | `VOLCANO_ENGINE_API_KEY`                            |
| API         | OpenAI 호환                                         |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    대화형 온보딩을 실행하세요:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    이 명령은 하나의 API 키로 일반(`volcengine`) 및 코딩(`volcengine-plan`) 프로바이더를 모두 등록합니다.

  </Step>
  <Step title="기본 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
비대화형 설정(CI, 스크립팅)의 경우 키를 직접 전달하세요:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## 프로바이더 및 엔드포인트

| 프로바이더         | 엔드포인트                               | 사용 사례     |
| ------------------ | ---------------------------------------- | ------------- |
| `volcengine`       | `ark.cn-beijing.volces.com/api/v3`       | 일반 모델     |
| `volcengine-plan`  | `ark.cn-beijing.volces.com/api/coding/v3` | 코딩 모델     |

<Note>
두 프로바이더 모두 하나의 API 키로 구성됩니다. 설정 시 두 항목이 자동으로 등록됩니다.
</Note>

## 사용 가능한 모델

<Tabs>
  <Tab title="일반 (volcengine)">
    | 모델 ref                                     | 이름                            | 입력        | 컨텍스트 |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="코딩 (volcengine-plan)">
    | 모델 ref                                          | 이름                     | 입력  | 컨텍스트 |
    | ------------------------------------------------- | ------------------------ | ----- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000  |
  </Tab>
</Tabs>

## 고급 참고사항

<AccordionGroup>
  <Accordion title="온보딩 후 기본 모델">
    `openclaw onboard --auth-choice volcengine-api-key`는 현재
    `volcengine-plan/ark-code-latest`를 기본 모델로 설정하는 동시에
    일반 `volcengine` 카탈로그도 등록합니다.
  </Accordion>

  <Accordion title="모델 선택기 대체 동작">
    온보딩/구성 모델 선택 중에는 Volcengine 인증 선택 항목이
    `volcengine/*`와 `volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이 아직
    로드되지 않았다면, OpenClaw는 빈 프로바이더 범위 선택기를 보여주는 대신
    필터링되지 않은 카탈로그로 대체합니다.
  </Accordion>

  <Accordion title="데몬 프로세스용 환경 변수">
    Gateway가 데몬(`launchd/systemd`)으로 실행되는 경우,
    `VOLCANO_ENGINE_API_KEY`를 해당 프로세스에서 사용할 수 있어야 합니다(예:
    `~/.openclaw/.env` 또는 `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw를 백그라운드 서비스로 실행할 때, 대화형 셸에 설정한 환경 변수는
자동으로 상속되지 않습니다. 위의 데몬 참고사항을 확인하세요.
</Warning>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    프로바이더, 모델 ref, 페일오버 동작 선택하기.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    에이전트, 모델, 프로바이더를 위한 전체 구성 참조.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계.
  </Card>
  <Card title="FAQ" href="/ko/help/faq" icon="circle-question">
    OpenClaw 설정에 관한 자주 묻는 질문.
  </Card>
</CardGroup>
