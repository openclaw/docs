---
read_when:
    - OpenClaw에서 Xiaomi MiMo 모델을 사용하려고 합니다
    - '`XIAOMI_API_KEY` 설정이 필요합니다'
summary: OpenClaw에서 Xiaomi MiMo 모델 사용하기
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-12T23:33:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd5a526764c796da7e1fff61301bc2ec618e1cf3857894ba2ef4b6dd9c4dc339
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo는 **MiMo** 모델용 API 플랫폼입니다. OpenClaw는 API 키 인증과 함께 Xiaomi의 OpenAI 호환 엔드포인트를 사용합니다.

| 속성 | 값 |
| -------- | ------------------------------- |
| Provider | `xiaomi` |
| 인증 | `XIAOMI_API_KEY` |
| API | OpenAI 호환 |
| Base URL | `https://api.xiaomimimo.com/v1` |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys)에서 API 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    또는 키를 직접 전달할 수 있습니다:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## 사용 가능한 모델

| 모델 참조 | 입력 | 컨텍스트 | 최대 출력 | 추론 | 참고 |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text | 262,144 | 8,192 | 아니요 | 기본 모델 |
| `xiaomi/mimo-v2-pro` | text | 1,048,576 | 32,000 | 예 | 대형 컨텍스트 |
| `xiaomi/mimo-v2-omni` | text, image | 262,144 | 32,000 | 예 | 멀티모달 |

<Tip>
기본 모델 참조는 `xiaomi/mimo-v2-flash`입니다. `XIAOMI_API_KEY`가 설정되어 있거나 인증 프로필이 존재하면 provider가 자동으로 주입됩니다.
</Tip>

## 구성 예시

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="자동 주입 동작">
    `xiaomi` provider는 환경에 `XIAOMI_API_KEY`가 설정되어 있거나 인증 프로필이 존재하면 자동으로 주입됩니다. 모델 메타데이터나 base URL을 재정의하려는 경우가 아니라면 provider를 수동으로 구성할 필요가 없습니다.
  </Accordion>

  <Accordion title="모델 세부 사항">
    - **mimo-v2-flash** — 가볍고 빠르며 일반적인 텍스트 작업에 적합합니다. 추론은 지원하지 않습니다.
    - **mimo-v2-pro** — 긴 문서 작업을 위한 1M 토큰 컨텍스트 창과 추론을 지원합니다.
    - **mimo-v2-omni** — 텍스트와 이미지 입력을 모두 받는 추론 지원 멀티모달 모델입니다.

    <Note>
    모든 모델은 `xiaomi/` 접두사를 사용합니다(예: `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="문제 해결">
    - 모델이 표시되지 않으면 `XIAOMI_API_KEY`가 설정되어 있고 유효한지 확인하세요.
    - Gateway가 데몬으로 실행되면 해당 프로세스에서 키를 사용할 수 있도록 하세요(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).

    <Warning>
    대화형 셸에만 설정된 키는 데몬이 관리하는 gateway 프로세스에서는 보이지 않습니다. 지속적으로 사용 가능하게 하려면 `~/.openclaw/.env` 또는 `env.shellEnv` config를 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 장애 조치 동작 선택하기.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration" icon="gear">
    전체 OpenClaw 구성 참조.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 대시보드 및 API 키 관리.
  </Card>
</CardGroup>
