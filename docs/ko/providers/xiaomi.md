---
read_when:
    - OpenClaw에서 Xiaomi MiMo 모델을 사용하고 싶습니다
    - XIAOMI_API_KEY 설정이 필요합니다
summary: Xiaomi MiMo 모델을 OpenClaw와 함께 사용하기
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T06:38:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo는 **MiMo** 모델용 API 플랫폼입니다. OpenClaw에는 동일한 `XIAOMI_API_KEY`에 대해 OpenAI 호환 채팅 제공자와 음성(TTS) 제공자를 모두 등록하는 번들 `xiaomi` Plugin이 포함되어 있습니다.

| 속성            | 값                                       |
| --------------- | ---------------------------------------- |
| 제공자 ID       | `xiaomi`                                 |
| Plugin          | 번들, `enabledByDefault: true`           |
| 인증 환경 변수  | `XIAOMI_API_KEY`                         |
| 온보딩 플래그   | `--auth-choice xiaomi-api-key`           |
| 직접 CLI 플래그 | `--xiaomi-api-key <key>`                 |
| 계약            | 채팅 완성 + `speechProviders`            |
| API             | OpenAI 호환(`openai-completions`)        |
| 기본 URL        | `https://api.xiaomimimo.com/v1`          |
| 기본 모델       | `xiaomi/mimo-v2-flash`                   |
| TTS 기본값      | `mimo-v2.5-tts`, 음성 `mimo_default`     |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [Xiaomi MiMo 콘솔](https://platform.xiaomimimo.com/#/console/api-keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    또는 키를 직접 전달합니다.

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

## 내장 카탈로그

| 모델 참조              | 입력        | 컨텍스트 | 최대 출력 | 추론   | 참고       |
| ---------------------- | ----------- | -------- | --------- | ------ | ---------- |
| `xiaomi/mimo-v2-flash` | 텍스트      | 262,144  | 8,192     | 아니요 | 기본 모델  |
| `xiaomi/mimo-v2-pro`   | 텍스트      | 1,048,576 | 32,000   | 예     | 큰 컨텍스트 |
| `xiaomi/mimo-v2-omni`  | 텍스트, 이미지 | 262,144 | 32,000    | 예     | 멀티모달   |

<Tip>
기본 모델 참조는 `xiaomi/mimo-v2-flash`입니다. `XIAOMI_API_KEY`가 설정되어 있거나 인증 프로필이 있으면 제공자가 자동으로 주입됩니다.
</Tip>

## 텍스트 음성 변환

번들 `xiaomi` Plugin은 `messages.tts`용 음성 제공자로도 Xiaomi MiMo를 등록합니다. 텍스트를 `assistant` 메시지로, 선택적 스타일 지침을 `user` 메시지로 전달하여 Xiaomi의 채팅 완성 TTS 계약을 호출합니다.

| 속성   | 값                                       |
| ------ | ---------------------------------------- |
| TTS ID | `xiaomi`(`mimo` 별칭)                    |
| 인증   | `XIAOMI_API_KEY`                         |
| API    | `audio`를 포함한 `POST /v1/chat/completions` |
| 기본값 | `mimo-v2.5-tts`, 음성 `mimo_default`     |
| 출력   | 기본값은 MP3, 구성 시 WAV                |

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
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

지원되는 내장 음성에는 `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`, `Milo`, `Dean`이 포함됩니다. `mimo-v2-tts`는 이전 MiMo TTS 계정에서 지원됩니다. 기본값은 현재 MiMo-V2.5 TTS 모델을 사용합니다. Feishu 및 Telegram과 같은 음성 노트 대상의 경우 OpenClaw는 전달 전에 Xiaomi 출력을 `ffmpeg`로 48kHz Opus로 트랜스코딩합니다.

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
    환경에 `XIAOMI_API_KEY`가 설정되어 있거나 인증 프로필이 있으면 `xiaomi` 제공자가 자동으로 주입됩니다. 모델 메타데이터나 기본 URL을 재정의하려는 경우가 아니라면 제공자를 수동으로 구성할 필요가 없습니다.
  </Accordion>

  <Accordion title="모델 세부 정보">
    - **mimo-v2-flash** — 가볍고 빠르며 범용 텍스트 작업에 적합합니다. 추론은 지원하지 않습니다.
    - **mimo-v2-pro** — 긴 문서 워크로드를 위해 1M 토큰 컨텍스트 창으로 추론을 지원합니다.
    - **mimo-v2-omni** — 텍스트와 이미지 입력을 모두 받는 추론 지원 멀티모달 모델입니다.

    <Note>
    모든 모델은 `xiaomi/` 접두사를 사용합니다(예: `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="문제 해결">
    - 모델이 표시되지 않으면 `XIAOMI_API_KEY`가 설정되어 있고 유효한지 확인합니다.
    - Gateway가 데몬으로 실행되는 경우 해당 프로세스에서 키를 사용할 수 있는지 확인합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).

    <Warning>
    대화형 셸에만 설정된 키는 데몬 관리 Gateway 프로세스에서 보이지 않습니다. 지속적인 사용 가능성을 위해 `~/.openclaw/.env` 또는 `env.shellEnv` 구성을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    전체 OpenClaw 구성 참조입니다.
  </Card>
  <Card title="Xiaomi MiMo 콘솔" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 대시보드 및 API 키 관리입니다.
  </Card>
</CardGroup>
