---
read_when:
    - OpenClaw에서 Volcano Engine 또는 Doubao model을 사용하려고 합니다
    - Volcengine API key 설정이 필요합니다
summary: Volcano Engine 설정(Doubao model, 일반 + 코딩 엔드포인트)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T14:08:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Volcengine provider는 Volcano Engine에 호스팅된 Doubao model과 서드파티 model에 접근할 수 있게 하며, 일반 워크로드와 코딩 워크로드에 대해 별도의 엔드포인트를 제공합니다.

| 세부 정보 | 값                                                  |
| --------- | --------------------------------------------------- |
| Providers | `volcengine` (general) + `volcengine-plan` (coding) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | OpenAI 호환                                         |

## 시작하기

<Steps>
  <Step title="API key 설정">
    대화형 온보딩을 실행하세요:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    이렇게 하면 하나의 API key로 일반 provider(`volcengine`)와 코딩 provider(`volcengine-plan`)가 모두 등록됩니다.

  </Step>
  <Step title="기본 model 설정">
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
  <Step title="model 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
비대화형 설정(CI, 스크립팅)에서는 key를 직접 전달하세요:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## provider 및 엔드포인트

| Provider          | Endpoint                                  | 사용 사례    |
| ----------------- | ----------------------------------------- | ------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 일반 model   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 코딩 model   |

<Note>
두 provider 모두 하나의 API key로 구성됩니다. 설정 시 둘 다 자동으로 등록됩니다.
</Note>

## 사용 가능한 model

<Tabs>
  <Tab title="General (volcengine)">
    | Model ref                                    | 이름                            | 입력        | 컨텍스트 |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Model ref                                         | 이름                     | 입력 | 컨텍스트 |
    | ------------------------------------------------- | ------------------------ | ---- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text | 256,000  |
  </Tab>
</Tabs>

## 고급 참고 사항

<AccordionGroup>
  <Accordion title="온보딩 후 기본 model">
    `openclaw onboard --auth-choice volcengine-api-key`는 현재
    일반 `volcengine` 카탈로그도 등록하면서
    `volcengine-plan/ark-code-latest`를 기본 model로 설정합니다.
  </Accordion>

  <Accordion title="model 선택기 fallback 동작">
    온보딩/구성 model 선택 중에 Volcengine auth choice는
    `volcengine/*`와 `volcengine-plan/*` 행을 모두 우선합니다. 해당 model이 아직
    로드되지 않았다면 OpenClaw는 비어 있는
    provider 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 fallback합니다.
  </Accordion>

  <Accordion title="daemon 프로세스용 환경 변수">
    Gateway가 daemon(launchd/systemd)으로 실행되는 경우
    `VOLCANO_ENGINE_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다(예:
    `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw를 백그라운드 서비스로 실행할 때 대화형 셸에 설정한 환경 변수는
자동으로 상속되지 않습니다. 위의 daemon 참고 사항을 확인하세요.
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref, failover 동작 선택하기.
  </Card>
  <Card title="Configuration" href="/ko/gateway/configuration" icon="gear">
    agent, model, provider에 대한 전체 config 참조입니다.
  </Card>
  <Card title="Troubleshooting" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계입니다.
  </Card>
  <Card title="FAQ" href="/ko/help/faq" icon="circle-question">
    OpenClaw 설정에 대한 자주 묻는 질문입니다.
  </Card>
</CardGroup>
