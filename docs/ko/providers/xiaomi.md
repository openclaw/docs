---
read_when:
    - OpenClaw에서 Xiaomi MiMo 모델을 사용하려는 경우
    - Xiaomi MiMo 인증 또는 Token Plan 설정이 필요합니다
summary: OpenClaw에서 Xiaomi MiMo 종량제 및 Token Plan 모델 사용하기
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:05:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo는 **MiMo** 모델을 위한 API 플랫폼입니다. OpenClaw에는 두 가지 텍스트 제공자 프리셋이 포함된 번들 Xiaomi plugin이 포함되어 있습니다.

- 종량제 키(`sk-...`)용 `xiaomi`
- 지역별 엔드포인트 프리셋이 있는 Token Plan 키(`tp-...`)용 `xiaomi-token-plan`

같은 plugin은 `xiaomi` 음성(TTS) 제공자도 등록합니다.

| 속성             | 값                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 제공자 ID        | `xiaomi`(종량제), `xiaomi-token-plan`(Token Plan)                                                                                                  |
| Plugin           | 번들됨, `enabledByDefault: true`                                                                                                                   |
| 인증 환경 변수   | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| 온보딩 플래그    | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| 직접 CLI 플래그  | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| 계약             | 채팅 완성 + `speechProviders`                                                                                                                      |
| API              | OpenAI 호환(`openai-completions`)                                                                                                                  |
| 기본 URL         | 종량제: `https://api.xiaomimimo.com/v1`; Token Plan 프리셋: `token-plan-{cn,sgp,ams}...`                                                           |
| 기본 모델        | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS 기본값       | `mimo-v2.5-tts`, 음성 `mimo_default`; voicedesign 모델 `mimo-v2.5-tts-voicedesign`                                                                 |

## 시작하기

<Steps>
  <Step title="Get the right key">
    [Xiaomi MiMo 콘솔](https://platform.xiaomimimo.com/#/console/api-keys)에서 종량제 키를 만들거나, Token Plan 구독 페이지를 열고 지역별 OpenAI 호환 기본 URL과 일치하는 `tp-...` 키를 복사합니다.
  </Step>

  <Step title="Run onboarding">
    종량제:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    또는 키를 직접 전달합니다.

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## 종량제 카탈로그

| 모델 ref               | 입력        | 컨텍스트  | 최대 출력 | 추론   | 참고        |
| ---------------------- | ----------- | --------- | --------- | ------ | ----------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192     | 아니요 | 기본 모델   |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000    | 예     | 큰 컨텍스트 |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000    | 예     | 멀티모달    |

<Tip>
기본 모델 ref는 `xiaomi/mimo-v2-flash`입니다. `XIAOMI_API_KEY`가 설정되어 있거나 인증 프로필이 있으면 제공자가 자동으로 주입됩니다.
</Tip>

## Token Plan 카탈로그

Xiaomi 구독 UI에 표시된 지역별 기본 URL과 일치하는 Token Plan 인증 선택지를 고르세요.

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| 모델 ref                          | 입력        | 컨텍스트  | 최대 출력 | 추론 | 참고      |
| --------------------------------- | ----------- | --------- | --------- | ---- | --------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | text        | 1,048,576 | 131,072   | 예   | 기본 모델 |
| `xiaomi-token-plan/mimo-v2.5`     | text, image | 1,048,576 | 131,072   | 예   | 멀티모달  |

<Tip>
Token Plan 온보딩은 키 형식을 검증하고, `tp-...` 키를 종량제 경로에 입력하거나 `sk-...` 키를 Token Plan 경로에 입력하면 경고합니다.
</Tip>

## 텍스트 음성 변환

번들 `xiaomi` plugin은 Xiaomi MiMo도 `messages.tts`용 음성 제공자로 등록합니다. 텍스트를 `assistant` 메시지로, 선택적 스타일 안내를 `user` 메시지로 사용하여 Xiaomi의 채팅 완성 TTS 계약을 호출합니다.

| 속성    | 값                                       |
| ------- | ---------------------------------------- |
| TTS ID  | `xiaomi`(`mimo` 별칭)                    |
| 인증    | `XIAOMI_API_KEY`                         |
| API     | `audio`가 포함된 `POST /v1/chat/completions` |
| 기본값  | `mimo-v2.5-tts`, 음성 `mimo_default`     |
| 출력    | 기본값은 MP3, 구성 시 WAV                |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

지원되는 내장 음성에는 `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo`, `Dean`이 포함됩니다. 프리셋 음성 모델은 `audio.voice`를 사용하므로 OpenClaw는 `mimo-v2.5-tts`와 `mimo-v2-tts`에 `speakerVoice`를 보냅니다.

Xiaomi의 voicedesign 모델인 `mimo-v2.5-tts-voicedesign`은 프리셋 음성 ID 대신 자연어 스타일 프롬프트에서 음성을 생성합니다. 원하는 음성 설명으로 `style`을 구성하세요. OpenClaw는 이를 `user` 메시지로 보내고, 말할 텍스트를 `assistant` 메시지로 보내며, 이 모델에서는 `audio.voice`를 생략합니다.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Feishu 및 Telegram 같은 음성 메모 대상의 경우 OpenClaw는 전달 전에 `ffmpeg`를 사용해 Xiaomi 출력을 48kHz Opus로 트랜스코딩합니다.

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

가격 및 호환성 플래그는 번들 plugin 매니페스트에서 오므로, 구성 예시는 런타임 동작과 달라지는 것을 피하기 위해 `cost`와 `compat`을 생략합니다.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

가격은 번들 매니페스트에서 오므로(Token Plan 모델에는 계층형 캐시 읽기 가격이 포함됨), 구성 예시는 `cost`를 생략합니다.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    `XIAOMI_API_KEY`가 환경에 설정되어 있거나 인증 프로필이 있으면 `xiaomi` 제공자가 자동으로 주입됩니다. `xiaomi-token-plan`에는 지역별 기본 URL이 필요하므로, 지원되는 경로는 번들 Token Plan 온보딩 선택지 또는 명시적 `models.providers.xiaomi-token-plan` 구성 블록입니다.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — 가볍고 빠르며 범용 텍스트 작업에 적합합니다. 추론 지원은 없습니다.
    - **mimo-v2-pro** — 긴 문서 작업 부하를 위해 1M 토큰 컨텍스트 창으로 추론을 지원합니다.
    - **mimo-v2-omni** — 텍스트와 이미지 입력을 모두 받는 추론 지원 멀티모달 모델입니다.
    - **mimo-v2.5-pro** — Xiaomi의 현재 V2.5 추론 스택을 사용하는 Token Plan 기본값입니다.
    - **mimo-v2.5** — Token Plan 멀티모달 V2.5 경로입니다.

    <Note>
    종량제 모델은 `xiaomi/` 접두사를 사용합니다. Token Plan 모델은 `xiaomi-token-plan/` 접두사를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 모델이 표시되지 않으면 관련 키 환경 변수 또는 인증 프로필이 있고 유효한지 확인하세요.
    - Token Plan의 경우 선택한 온보딩 지역이 구독 페이지 기본 URL과 일치하고 키가 `tp-`로 시작하는지 확인하세요.
    - Gateway가 데몬으로 실행되는 경우 해당 프로세스에서 키를 사용할 수 있는지 확인하세요. 예를 들어 `~/.openclaw/.env` 또는 `env.shellEnv`를 사용합니다.

    <Warning>
    대화형 셸에만 설정된 키는 데몬이 관리하는 Gateway 프로세스에 보이지 않습니다. 지속적인 사용 가능성을 위해 `~/.openclaw/.env` 또는 `env.shellEnv` 구성을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 ref, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration-reference" icon="gear">
    전체 OpenClaw 구성 참조입니다.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 대시보드 및 API 키 관리입니다.
  </Card>
</CardGroup>
