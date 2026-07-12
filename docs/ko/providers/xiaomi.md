---
read_when:
    - OpenClaw에서 Xiaomi MiMo 모델을 사용하려는 경우
    - Xiaomi MiMo 인증 또는 Token Plan 설정이 필요합니다
summary: OpenClaw에서 Xiaomi MiMo 종량제 및 토큰 플랜 모델 사용하기
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T01:13:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo는 **MiMo** 모델용 API 플랫폼입니다. 번들 `xiaomi`
Plugin(`enabledByDefault: true`, 설치 단계 없음)은 두 개의 텍스트
제공자와 음성(TTS) 제공자를 등록합니다.

- `xiaomi` - 사용량 기반 결제 키(`sk-...`)
- `xiaomi-token-plan` - 리전별 엔드포인트 프리셋을 사용하는 Token Plan 키(`tp-...`)

| 속성             | 값                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 제공자 ID        | `xiaomi`(사용량 기반 결제), `xiaomi-token-plan`(Token Plan)                                                                                        |
| 인증 환경 변수   | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| 온보딩 플래그    | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| 직접 CLI 플래그  | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API              | OpenAI 호환 채팅 완성(`openai-completions`)                                                                                                        |
| 음성 계약        | `speechProviders: ["xiaomi"]`                                                                                                                      |
| 기본 URL         | 사용량 기반 결제: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                        |
| 기본 모델        | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS 기본값       | `mimo-v2.5-tts`, 음성 `mimo_default`; 음성 디자인 모델 `mimo-v2.5-tts-voicedesign`                                                                |

## 시작하기

<Steps>
  <Step title="Get the right key">
    [Xiaomi MiMo 콘솔](https://platform.xiaomimimo.com/#/console/api-keys)에서 사용량 기반 결제 키를 생성하거나, Token Plan 구독 페이지를 열어 리전별 OpenAI 호환 기본 URL과 이에 대응하는 `tp-...` 키를 복사합니다.
  </Step>

  <Step title="Run onboarding">
    사용량 기반 결제:

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

<Tip>
온보딩은 키 형식을 검증하며, 사용량 기반 결제 경로에 `tp-...` 키를 입력하거나 Token Plan 경로에 `sk-...` 키를 입력하면 경고합니다.
</Tip>

## 사용량 기반 결제 카탈로그

| 모델 참조              | 입력         | 컨텍스트  | 최대 출력  | 추론      | 참고          |
| ---------------------- | ------------ | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | 텍스트       | 262,144   | 8,192      | 아니요    | 기본 모델     |
| `xiaomi/mimo-v2-pro`   | 텍스트       | 1,048,576 | 32,000     | 예        | 대규모 컨텍스트 |
| `xiaomi/mimo-v2-omni`  | 텍스트, 이미지 | 262,144 | 32,000     | 예        | 멀티모달      |

## Token Plan 카탈로그

Xiaomi의 구독 UI에 표시된 리전별 기본 URL과 일치하는 Token Plan 인증 옵션을 선택합니다.

| 인증 옵션                | 기본 URL                                   |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| 모델 참조                         | 입력           | 컨텍스트  | 최대 출력 | 추론 | 참고      |
| --------------------------------- | -------------- | --------- | --------- | ---- | --------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | 텍스트         | 1,048,576 | 131,072   | 예   | 기본 모델 |
| `xiaomi-token-plan/mimo-v2.5`     | 텍스트, 이미지 | 1,048,576 | 131,072   | 예   | 멀티모달  |

`xiaomi-token-plan`을 해석하려면 리전별 기본 URL이 필요합니다. 지원되는
경로는 번들 Token Plan 온보딩 옵션을 사용하거나 `baseUrl`이 설정된 명시적
`models.providers.xiaomi-token-plan` 구성 블록을 사용하는 것입니다.
둘 중 하나가 없으면 해당 제공자는 표시되지 않습니다.

## 추론 모델

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5`, `mimo-v2.5-pro`는
`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` 수준을 사용하는
OpenClaw의 [`/think` 지시문](/ko/tools/thinking)을 지원합니다(기본값 `high`).
`mimo-v2-flash`는 추론을 지원하지 않습니다.

## 텍스트 음성 변환

번들 `xiaomi` Plugin은 `messages.tts`용 음성 제공자로 Xiaomi MiMo도
등록합니다. 텍스트를 `assistant` 메시지로, 선택적 스타일 지침을 `user`
메시지로 전달하여 Xiaomi의 채팅 완성 TTS 계약을 호출합니다.

| 속성     | 값                                       |
| -------- | ---------------------------------------- |
| TTS ID   | `xiaomi`(`mimo` 별칭)                    |
| 인증     | `XIAOMI_API_KEY`                         |
| API      | `audio`를 포함한 `POST /v1/chat/completions` |
| 기본값   | `mimo-v2.5-tts`, 음성 `mimo_default`     |
| 출력     | 기본값은 MP3, 구성 시 WAV                |

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

내장 음성: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. 프리셋 음성 모델(`mimo-v2.5-tts`, `mimo-v2-tts`)은
`audio.voice`를 사용하므로 OpenClaw는 해당 모델에 `speakerVoice`를 전송합니다.

음성 디자인 모델 `mimo-v2.5-tts-voicedesign`은 프리셋 음성 ID 대신
자연어 스타일 프롬프트로 음성을 생성합니다. `style`을 원하는 음성 설명으로
설정합니다. OpenClaw는 이를 `user` 메시지로 전송하고, 발화할 텍스트를
`assistant` 메시지로 전송하며, 이 모델에서는 `audio.voice`를 생략합니다.

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

음성 메모 합성 대상을 요청하는 채널(Discord, Feishu, Matrix, Telegram,
WhatsApp)의 경우 OpenClaw는 전달 전에 `ffmpeg`를 사용하여 Xiaomi 출력을
48kHz 모노 Opus로 트랜스코딩합니다.

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

가격 및 호환성 플래그는 번들 Plugin 매니페스트에서 가져오므로, 런타임 동작과 달라지는 것을 방지하기 위해 구성 예시에서는 `cost`와 `compat`을 생략합니다.

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

가격은 번들 매니페스트에서 가져옵니다(Token Plan 모델에는 계층형 캐시 읽기 가격이 포함됨). 따라서 구성 예시에서는 `cost`를 생략합니다.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    환경에 `XIAOMI_API_KEY`가 설정되어 있거나 인증 프로필이 존재하면 `xiaomi` 제공자가 자동으로 활성화됩니다. `xiaomi-token-plan`에는 리전별 기본 URL이 필요하므로, 지원되는 경로는 번들 Token Plan 온보딩 옵션을 사용하거나 명시적 `models.providers.xiaomi-token-plan` 구성 블록을 사용하는 것입니다.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** - 가볍고 빠르며 범용 텍스트 작업에 적합합니다. 추론은 지원하지 않습니다.
    - **mimo-v2-pro** - 긴 문서 워크로드를 위한 100만 토큰 컨텍스트 창과 추론을 지원합니다.
    - **mimo-v2-omni** - 텍스트와 이미지 입력을 모두 받는 추론 지원 멀티모달 모델입니다.
    - **mimo-v2.5-pro** - Xiaomi의 현재 V2.5 추론 스택을 사용하는 Token Plan 기본 모델입니다.
    - **mimo-v2.5** - Token Plan 멀티모달 V2.5 경로입니다.

    <Note>
    사용량 기반 결제 모델은 `xiaomi/` 접두사를 사용합니다. Token Plan 모델은 `xiaomi-token-plan/` 접두사를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 모델이 표시되지 않으면 관련 키 환경 변수 또는 인증 프로필이 존재하며 유효한지 확인합니다.
    - Token Plan의 경우 선택한 온보딩 리전이 구독 페이지의 기본 URL과 일치하고 키가 `tp-`로 시작하는지 확인합니다.
    - Gateway가 데몬으로 실행되는 경우 해당 프로세스에서 키를 사용할 수 있는지 확인합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv` 사용).

    <Warning>
    대화형 셸에만 설정된 키는 데몬이 관리하는 Gateway 프로세스에서 볼 수 없습니다. 지속적으로 사용할 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv` 구성을 사용합니다.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작 선택 방법입니다.
  </Card>
  <Card title="Thinking levels" href="/ko/tools/thinking" icon="brain">
    `/think` 지시문 구문 및 수준 매핑입니다.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration-reference" icon="gear">
    전체 OpenClaw 구성 참조입니다.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 대시보드 및 API 키 관리입니다.
  </Card>
</CardGroup>
