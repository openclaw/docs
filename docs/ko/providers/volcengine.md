---
read_when:
    - OpenClaw에서 Volcano Engine 또는 Doubao 모델을 사용하려는 경우
    - Volcengine API 키 설정이 필요합니다.
    - Volcengine Speech의 텍스트 음성 변환을 사용하려는 경우
summary: Volcano Engine 설정(Doubao 모델, 코딩 엔드포인트 및 Seed Speech TTS)
title: Volcengine(Doubao)
x-i18n:
    generated_at: "2026-07-12T01:13:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine 제공자는 Doubao 모델과 Volcano Engine에서 호스팅되는 타사 모델에 대한 액세스를 제공하며, 일반 작업과 코딩 작업에 별도의 엔드포인트를 사용합니다. 동일한 번들 Plugin은 Volcengine Speech도 TTS 제공자로 등록합니다.

| 세부 정보   | 값                                                         |
| ----------- | ---------------------------------------------------------- |
| 제공자      | `volcengine`(일반 + TTS), `volcengine-plan`(코딩)          |
| 모델 인증   | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS 인증    | `VOLCENGINE_TTS_API_KEY` 또는 `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API         | OpenAI 호환 모델, BytePlus Seed Speech TTS                 |

## 시작하기

<Steps>
  <Step title="Set the API key">
    대화형 온보딩을 실행합니다.

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    단일 API 키로 일반(`volcengine`) 및 코딩(`volcengine-plan`) 제공자를 모두 등록합니다.

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
비대화형 설정(CI, 스크립팅)의 경우 키를 직접 전달합니다.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## 제공자 및 엔드포인트

| 제공자            | 엔드포인트                                | 사용 사례   |
| ----------------- | ----------------------------------------- | ----------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 일반 모델   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 코딩 모델   |

<Note>
두 제공자는 모두 단일 API 키로 구성됩니다. 설정 시 둘 다 자동으로 등록되며, 코딩 제공자의 모델 선택기도 일반 제공자의 인증을 재사용합니다(`volcengine-plan`은 `volcengine`의 인증 별칭입니다).
</Note>

## 기본 제공 카탈로그

<Tabs>
  <Tab title="General (volcengine)">
    | 모델 참조                                    | 이름                            | 입력         | 컨텍스트 |
    | -------------------------------------------- | ------------------------------- | ------------ | -------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | 텍스트, 이미지 | 128,000  |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | 텍스트, 이미지 | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | 텍스트, 이미지 | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | 텍스트, 이미지 | 200,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | 텍스트, 이미지 | 256,000  |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | 모델 참조                                         | 이름                     | 입력   | 컨텍스트 |
    | ------------------------------------------------- | ------------------------ | ------ | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | 텍스트 | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | 텍스트 | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | 텍스트 | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | 텍스트 | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | 텍스트 | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | 텍스트 | 256,000  |
  </Tab>
</Tabs>

두 카탈로그는 모두 정적이며(`/models` 검색 호출 없음), OpenAI 호환 스트리밍 사용량 집계를 지원합니다. Volcengine 도구 호출 API가 해당 키워드를 거부하므로 두 제공자의 도구 스키마에서는 `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains`, `maxContains` 키워드가 자동으로 제거됩니다.

## 텍스트 음성 변환

Volcengine TTS는 BytePlus Seed Speech HTTP API(`voice.ap-southeast-1.bytepluses.com`)를 사용하며, OpenAI 호환 Doubao 모델 API 키와 별도로 구성됩니다. BytePlus 콘솔에서 Seed Speech > Settings > API Keys를 열고 API 키를 복사한 후 다음과 같이 설정합니다.

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

그런 다음 `openclaw.json`에서 활성화합니다.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

`messages.tts.providers.volcengine`에서 사용할 수 있는 필드는 `apiKey`, `voice`, `speedRatio`(0.2~3.0), `emotion`, `cluster`, `resourceId`, `appKey`, `baseUrl`입니다. 음성 설정 재정의가 허용된 경우 `!emotion=<value>`도 인라인 음성 지시문으로 사용할 수 있습니다.

음성 메모 대상의 경우 OpenClaw는 제공자 네이티브 형식인 `ogg_opus`를 요청합니다. 일반 오디오 첨부 파일에는 `mp3`를 요청합니다. 제공자 별칭인 `bytedance`와 `doubao`도 이 음성 제공자로 해석됩니다.

기본 리소스 ID는 `seed-tts-1.0`이며, BytePlus가 새로 생성된 Seed Speech API 키에 기본적으로 부여하는 사용 권한입니다. 프로젝트에 TTS 2.0 사용 권한이 있는 경우 `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`을 설정합니다.

<Warning>
`VOLCANO_ENGINE_API_KEY`는 ModelArk/Doubao 모델 엔드포인트용이며 Seed Speech API 키가 아닙니다. TTS에는 BytePlus Speech Console에서 발급한 Seed Speech API 키 또는 레거시 Speech Console AppID/토큰 쌍이 필요합니다.
</Warning>

이전 Speech Console 애플리케이션에서는 레거시 AppID/토큰 인증도 계속 지원됩니다.

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

그 밖의 선택적 TTS 환경 변수로는 `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY`, `VOLCENGINE_TTS_BASE_URL`이 있으며, 설정하면 해당 `messages.tts.providers.volcengine` 구성 필드를 재정의합니다.

## 고급 구성

<AccordionGroup>
  <Accordion title="Default model after onboarding">
    `openclaw onboard --auth-choice volcengine-api-key`는 일반 `volcengine` 카탈로그도 등록하면서 `volcengine-plan/ark-code-latest`를 기본 모델로 설정합니다.
  </Accordion>

  <Accordion title="Model picker fallback behavior">
    온보딩 또는 구성 중 모델을 선택할 때 Volcengine 인증 옵션은 `volcengine/*` 및 `volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이 아직 로드되지 않은 경우 OpenClaw는 제공자 범위로 제한된 빈 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.
  </Accordion>

  <Accordion title="Environment variables for daemon processes">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN` 등의 모델 및 TTS 환경 변수를 해당 프로세스에서 사용할 수 있는지 확인합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 설정).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw를 백그라운드 서비스로 실행하면 대화형 셸에 설정된 환경 변수가 자동으로 상속되지 않습니다. 위의 데몬 참고 사항을 확인하세요.
</Warning>

## 관련 문서

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="Configuration" href="/ko/gateway/configuration" icon="gear">
    에이전트, 모델 및 제공자에 관한 전체 구성 참고 자료입니다.
  </Card>
  <Card title="Troubleshooting" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계입니다.
  </Card>
  <Card title="FAQ" href="/ko/help/faq" icon="circle-question">
    OpenClaw 설정에 관해 자주 묻는 질문입니다.
  </Card>
</CardGroup>
