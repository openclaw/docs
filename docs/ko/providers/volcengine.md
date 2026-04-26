---
read_when:
    - OpenClaw에서 Volcengine 또는 Doubao 모델을 사용하려고 합니다
    - Volcengine API 키 설정이 필요합니다
    - Volcengine Speech 텍스트 음성 변환을 사용하려고 합니다
summary: Volcengine 설정(Doubao 모델, 코딩 엔드포인트, Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-26T11:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
---

Volcengine provider는 Volcano Engine에서 호스팅되는 Doubao 모델과 서드파티 모델에 대한
액세스를 제공하며, 일반 워크로드와 코딩 워크로드에 대해 별도의 엔드포인트를 사용합니다.
동일한 번들 Plugin은 Volcengine Speech를 TTS provider로도 등록할 수 있습니다.

| 세부 정보 | 값 |
| ---------- | ---------------------------------------------------------- |
| Providers | `volcengine` (일반 + TTS) + `volcengine-plan` (코딩) |
| 모델 인증 | `VOLCANO_ENGINE_API_KEY` |
| TTS 인증 | `VOLCENGINE_TTS_API_KEY` 또는 `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API | OpenAI 호환 모델, BytePlus Seed Speech TTS |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    대화형 온보딩을 실행합니다:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    이렇게 하면 하나의 API 키로 일반(`volcengine`) provider와 코딩(`volcengine-plan`) provider가 모두 등록됩니다.

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

## Providers 및 엔드포인트

| Provider | 엔드포인트 | 사용 사례 |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine` | `ark.cn-beijing.volces.com/api/v3` | 일반 모델 |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 코딩 모델 |

<Note>
두 provider 모두 하나의 API 키로 구성됩니다. 설정 시 둘 다 자동으로 등록됩니다.
</Note>

## 내장 카탈로그

<Tabs>
  <Tab title="일반 (volcengine)">
    | 모델 ref | 이름 | 입력 | 컨텍스트 |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228` | Doubao Seed 1.8 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127` | Kimi K2.5 | text, image | 256,000 |
    | `volcengine/glm-4-7-251222` | GLM 4.7 | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201` | DeepSeek V3.2 | text, image | 128,000 |
  </Tab>
  <Tab title="코딩 (volcengine-plan)">
    | 모델 ref | 이름 | 입력 | 컨텍스트 |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest` | Ark Coding Plan | text | 256,000 |
    | `volcengine-plan/doubao-seed-code` | Doubao Seed Code | text | 256,000 |
    | `volcengine-plan/glm-4.7` | GLM 4.7 Coding | text | 200,000 |
    | `volcengine-plan/kimi-k2-thinking` | Kimi K2 Thinking | text | 256,000 |
    | `volcengine-plan/kimi-k2.5` | Kimi K2.5 Coding | text | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text | 256,000 |
  </Tab>
</Tabs>

## 텍스트 음성 변환

Volcengine TTS는 BytePlus Seed Speech HTTP API를 사용하며
OpenAI 호환 Doubao 모델 API 키와는 별도로 구성됩니다. BytePlus
콘솔에서 Seed Speech > Settings > API Keys를 열고 API 키를 복사한 다음, 다음과 같이 설정하세요:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

그런 다음 `openclaw.json`에서 활성화합니다:

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

음성 노트 대상의 경우 OpenClaw는 Volcengine에 provider 네이티브
`ogg_opus`를 요청합니다. 일반 오디오 첨부의 경우에는 `mp3`를 요청합니다. provider 별칭인
`bytedance`와 `doubao`도 동일한 speech provider로 확인됩니다.

기본 리소스 ID는 `seed-tts-1.0`입니다. 이는 BytePlus가 기본 프로젝트에서 새로 생성된
Seed Speech API 키에 부여하는 값이기 때문입니다. 프로젝트에 TTS 2.0 권한이 있으면
`VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`으로 설정하세요.

<Warning>
`VOLCANO_ENGINE_API_KEY`는 ModelArk/Doubao 모델 엔드포인트용이며
Seed Speech API 키가 아닙니다. TTS에는 BytePlus Speech
Console의 Seed Speech API 키 또는 레거시 Speech Console AppID/token 쌍이 필요합니다.
</Warning>

이전 Speech Console 애플리케이션을 위해 레거시 AppID/token 인증도 계속 지원됩니다:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## 고급 구성

<AccordionGroup>
  <Accordion title="온보딩 후 기본 모델">
    `openclaw onboard --auth-choice volcengine-api-key`는 현재
    일반 `volcengine` 카탈로그도 등록하면서
    기본 모델로 `volcengine-plan/ark-code-latest`를 설정합니다.
  </Accordion>

  <Accordion title="모델 선택기 폴백 동작">
    온보딩/구성 모델 선택 중 Volcengine 인증 선택은
    `volcengine/*` 및 `volcengine-plan/*` 행을 모두 우선 적용합니다. 이러한 모델이
    아직 로드되지 않았다면 OpenClaw는 빈
    provider 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 폴백합니다.
  </Accordion>

  <Accordion title="데몬 프로세스용 환경 변수">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 모델 및 TTS
    환경 변수(`VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID`,
    `VOLCENGINE_TTS_TOKEN` 등)가 해당 프로세스에서 사용 가능해야 합니다(예:
    `~/.openclaw/.env` 또는 `env.shellEnv`에서).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw를 백그라운드 서비스로 실행할 때 대화형 셸에 설정한 환경 변수는
자동으로 상속되지 않습니다. 위의 데몬 관련 참고 사항을 확인하세요.
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, 장애 조치 동작 선택.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    agents, 모델, provider에 대한 전체 구성 참조.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계.
  </Card>
  <Card title="FAQ" href="/ko/help/faq" icon="circle-question">
    OpenClaw 설정에 대해 자주 묻는 질문.
  </Card>
</CardGroup>
