---
read_when:
    - OpenClaw에서 MiniMax 모델을 사용하려고 합니다
    - MiniMax 설정 안내가 필요합니다
summary: OpenClaw에서 MiniMax 모델 사용하기
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T06:09:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 202b0852f3f1f484193d6f9a019b179c807dc13d7bed497f1122c36eae03e980
    source_path: providers/minimax.md
    workflow: 15
---

OpenClaw의 MiniMax 프로바이더는 기본적으로 **MiniMax M2.7**을 사용합니다.

MiniMax는 또한 다음을 제공합니다:

- T2A v2를 통한 번들 음성 합성
- `MiniMax-VL-01`을 통한 번들 이미지 이해
- `music-2.5+`를 통한 번들 음악 생성
- MiniMax Coding Plan 검색 API를 통한 번들 `web_search`

프로바이더 분리:

| 프로바이더 ID    | 인증   | 기능                                                             |
| ---------------- | ------ | ---------------------------------------------------------------- |
| `minimax`        | API 키 | 텍스트, 이미지 생성, 이미지 이해, 음성, 웹 검색                 |
| `minimax-portal` | OAuth  | 텍스트, 이미지 생성, 이미지 이해                                |

## 내장 카탈로그

| 모델                     | 유형             | 설명                                       |
| ------------------------ | ---------------- | ------------------------------------------ |
| `MiniMax-M2.7`           | 채팅(reasoning)  | 기본 호스팅 reasoning 모델                 |
| `MiniMax-M2.7-highspeed` | 채팅(reasoning)  | 더 빠른 M2.7 reasoning 티어                |
| `MiniMax-VL-01`          | 비전             | 이미지 이해 모델                           |
| `image-01`               | 이미지 생성      | 텍스트-이미지 및 이미지-이미지 편집        |
| `music-2.5+`             | 음악 생성        | 기본 음악 모델                             |
| `music-2.5`              | 음악 생성        | 이전 음악 생성 티어                        |
| `music-2.0`              | 음악 생성        | 레거시 음악 생성 티어                      |
| `MiniMax-Hailuo-2.3`     | 비디오 생성      | 텍스트-비디오 및 이미지 참조 흐름          |

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **가장 적합한 경우:** API 키 없이 OAuth로 MiniMax Coding Plan을 빠르게 설정할 때.

    <Tabs>
      <Tab title="국제">
        <Steps>
          <Step title="온보딩 실행">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            그러면 `api.minimax.io`에 대해 인증합니다.
          </Step>
          <Step title="모델 사용 가능 여부 확인">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="중국">
        <Steps>
          <Step title="온보딩 실행">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            그러면 `api.minimaxi.com`에 대해 인증합니다.
          </Step>
          <Step title="모델 사용 가능 여부 확인">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 설정은 `minimax-portal` 프로바이더 ID를 사용합니다. 모델 ref 형식은 `minimax-portal/MiniMax-M2.7`입니다.
    </Note>

    <Tip>
    MiniMax Coding Plan 추천 링크(10% 할인): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API 키">
    **가장 적합한 경우:** Anthropic 호환 API를 사용하는 호스팅된 MiniMax.

    <Tabs>
      <Tab title="국제">
        <Steps>
          <Step title="온보딩 실행">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            그러면 `api.minimax.io`가 기본 URL로 구성됩니다.
          </Step>
          <Step title="모델 사용 가능 여부 확인">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="중국">
        <Steps>
          <Step title="온보딩 실행">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            그러면 `api.minimaxi.com`이 기본 URL로 구성됩니다.
          </Step>
          <Step title="모델 사용 가능 여부 확인">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### config 예시

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Anthropic 호환 스트리밍 경로에서는, 명시적으로 `thinking`을 직접 설정하지 않는 한 OpenClaw가 MiniMax thinking을 기본적으로 비활성화합니다. MiniMax의 스트리밍 엔드포인트는 네이티브 Anthropic thinking 블록 대신 OpenAI 스타일 델타 청크로 `reasoning_content`를 내보내므로, 암묵적으로 활성화된 상태로 두면 내부 reasoning이 사용자에게 보이는 출력으로 유출될 수 있습니다.
    </Warning>

    <Note>
    API 키 설정은 `minimax` 프로바이더 ID를 사용합니다. 모델 ref 형식은 `minimax/MiniMax-M2.7`입니다.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure`로 구성

JSON을 직접 편집하지 않고 대화형 config 마법사로 MiniMax를 설정하세요:

<Steps>
  <Step title="마법사 실행">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth 선택">
    메뉴에서 **Model/auth**를 선택합니다.
  </Step>
  <Step title="MiniMax 인증 옵션 선택">
    사용 가능한 MiniMax 옵션 중 하나를 선택합니다:

    | 인증 선택 | 설명 |
    | --- | --- |
    | `minimax-global-oauth` | 국제 OAuth (Coding Plan) |
    | `minimax-cn-oauth` | 중국 OAuth (Coding Plan) |
    | `minimax-global-api` | 국제 API 키 |
    | `minimax-cn-api` | 중국 API 키 |

  </Step>
  <Step title="기본 모델 선택">
    프롬프트가 표시되면 기본 모델을 선택합니다.
  </Step>
</Steps>

## 기능

### 이미지 생성

MiniMax Plugin은 `image_generate` 도구용으로 `image-01` 모델을 등록합니다. 지원 항목:

- 종횡비 제어가 가능한 **텍스트-이미지 생성**
- 종횡비 제어가 가능한 **이미지-이미지 편집**(피사체 참조)
- 요청당 최대 **9개 출력 이미지**
- 편집 요청당 최대 **1개 참조 이미지**
- 지원 종횡비: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

이미지 생성에 MiniMax를 사용하려면 이를 이미지 생성 프로바이더로 설정하세요:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin은 텍스트 모델과 동일한 `MINIMAX_API_KEY` 또는 OAuth 인증을 사용합니다. MiniMax가 이미 설정되어 있다면 추가 구성은 필요하지 않습니다.

`minimax`와 `minimax-portal` 모두 동일한
`image-01` 모델로 `image_generate`를 등록합니다. API 키 설정은 `MINIMAX_API_KEY`를 사용하고, OAuth 설정은 번들된 `minimax-portal` 인증 경로를 대신 사용할 수 있습니다.

온보딩 또는 API 키 설정이 명시적인 `models.providers.minimax`
항목을 기록할 때, OpenClaw는 `MiniMax-M2.7`과
`MiniMax-M2.7-highspeed`를 텍스트 전용 채팅 모델로 구체화합니다. 이미지 이해는 Plugin 소유 `MiniMax-VL-01` 미디어 프로바이더를 통해 별도로 노출됩니다.

<Note>
공유 도구 매개변수, 프로바이더 선택, failover 동작은 [Image Generation](/ko/tools/image-generation)을 참고하세요.
</Note>

### 텍스트 음성 변환

번들된 `minimax` Plugin은 `messages.tts`용 음성 프로바이더로
MiniMax T2A v2도 등록합니다.

- 기본 TTS 모델: `speech-2.8-hd`
- 기본 음성: `English_expressive_narrator`
- 일반 오디오 첨부 파일은 계속 MP3로 유지됩니다.
- Feishu 및 Telegram 같은 음성 메모 대상은 MiniMax
  MP3에서 48kHz Opus로 `ffmpeg`를 사용해 트랜스코딩됩니다. 이는 Feishu/Lark 파일 API가 네이티브 오디오 메시지에 대해 `file_type: "opus"`만 허용하기 때문입니다.
- MiniMax T2A는 소수점 `speed`와 `vol`을 허용하지만, `pitch`는 정수로 전송됩니다. OpenClaw는 API 요청 전에 소수점 `pitch` 값을 버립니다.

| 설정                                     | 환경 변수             | 기본값                        | 설명                              |
| ---------------------------------------- | --------------------- | ----------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`    | `https://api.minimax.io`      | MiniMax T2A API 호스트.           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`   | `speech-2.8-hd`               | TTS 모델 ID.                      |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID`| `English_expressive_narrator` | 음성 출력에 사용되는 voice ID.    |
| `messages.tts.providers.minimax.speed`   |                       | `1.0`                         | 재생 속도, `0.5..2.0`.            |
| `messages.tts.providers.minimax.vol`     |                       | `1.0`                         | 볼륨, `(0, 10]`.                  |
| `messages.tts.providers.minimax.pitch`   |                       | `0`                           | 정수 pitch 이동, `-12..12`.       |

### 음악 생성

번들된 `minimax` Plugin은 공유
`music_generate` 도구를 통해 음악 생성도 등록합니다.

- 기본 음악 모델: `minimax/music-2.5+`
- `minimax/music-2.5` 및 `minimax/music-2.0`도 지원
- 프롬프트 제어: `lyrics`, `instrumental`, `durationSeconds`
- 출력 형식: `mp3`
- 세션 기반 실행은 `action: "status"`를 포함한 공유 task/status 흐름을 통해 분리 실행됨

기본 음악 프로바이더로 MiniMax를 사용하려면:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
공유 도구 매개변수, 프로바이더 선택, failover 동작은 [Music Generation](/ko/tools/music-generation)을 참고하세요.
</Note>

### 비디오 생성

번들된 `minimax` Plugin은 공유
`video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `minimax/MiniMax-Hailuo-2.3`
- 모드: 텍스트-비디오 및 단일 이미지 참조 흐름
- `aspectRatio`와 `resolution` 지원

기본 비디오 프로바이더로 MiniMax를 사용하려면:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
공유 도구 매개변수, 프로바이더 선택, failover 동작은 [Video Generation](/ko/tools/video-generation)을 참고하세요.
</Note>

### 이미지 이해

MiniMax Plugin은 텍스트
카탈로그와 별도로 이미지 이해를 등록합니다:

| 프로바이더 ID    | 기본 이미지 모델 |
| ---------------- | ---------------- |
| `minimax`        | `MiniMax-VL-01`  |
| `minimax-portal` | `MiniMax-VL-01`  |

이 때문에 번들된 텍스트 프로바이더 카탈로그에 여전히 텍스트 전용 M2.7 채팅 ref만 보이더라도, 자동 미디어 라우팅은 MiniMax 이미지 이해를 사용할 수 있습니다.

### 웹 검색

MiniMax Plugin은 MiniMax Coding Plan
검색 API를 통해 `web_search`도 등록합니다.

- 프로바이더 ID: `minimax`
- 구조화된 결과: 제목, URL, 스니펫, 관련 쿼리
- 권장 env var: `MINIMAX_CODE_PLAN_KEY`
- 허용되는 env 별칭: `MINIMAX_CODING_API_KEY`
- 호환성 대체값: 이미 coding-plan 토큰을 가리키고 있는 경우 `MINIMAX_API_KEY`
- 리전 재사용: `plugins.entries.minimax.config.webSearch.region`, 그다음 `MINIMAX_API_HOST`, 그다음 MiniMax 프로바이더 base URL
- 검색은 계속 프로바이더 ID `minimax`를 사용합니다. OAuth CN/global 설정도 `models.providers.minimax-portal.baseUrl`을 통해 간접적으로 리전을 조정할 수 있습니다

config는 `plugins.entries.minimax.config.webSearch.*` 아래에 있습니다.

<Note>
전체 웹 검색 구성 및 사용법은 [MiniMax Search](/ko/tools/minimax-search)를 참고하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="구성 옵션">
    | 옵션 | 설명 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` 권장(Anthropic 호환). `https://api.minimax.io/v1`은 OpenAI 호환 페이로드용 선택 사항 |
    | `models.providers.minimax.api` | `anthropic-messages` 권장. `openai-completions`는 OpenAI 호환 페이로드용 선택 사항 |
    | `models.providers.minimax.apiKey` | MiniMax API 키 (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` 정의 |
    | `agents.defaults.models` | allowlist에 넣고 싶은 모델에 별칭 부여 |
    | `models.mode` | 내장 항목과 함께 MiniMax를 추가하려면 `merge` 유지 |
  </Accordion>

  <Accordion title="Thinking 기본값">
    `api: "anthropic-messages"`에서는, thinking이 params/config에 이미 명시적으로 설정되지 않은 한 OpenClaw가 `thinking: { type: "disabled" }`를 주입합니다.

    이렇게 하면 MiniMax 스트리밍 엔드포인트가 OpenAI 스타일 델타 청크로 `reasoning_content`를 내보내는 것을 방지할 수 있으며, 그렇지 않으면 내부 reasoning이 사용자에게 보이는 출력으로 유출될 수 있습니다.

  </Accordion>

  <Accordion title="빠른 모드">
    `/fast on` 또는 `params.fastMode: true`는 Anthropic 호환 스트림 경로에서 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
  </Accordion>

  <Accordion title="Fallback 예시">
    **가장 적합한 경우:** 최신 세대의 가장 강력한 모델을 기본값으로 유지하고, MiniMax M2.7로 fail over하고 싶을 때. 아래 예시는 구체적인 기본 모델로 Opus를 사용합니다. 원하는 최신 세대 기본 모델로 바꿔 사용하세요.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan 사용량 세부 사항">
    - Coding Plan 사용량 API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`(coding plan 키 필요).
    - OpenClaw는 MiniMax coding-plan 사용량을 다른 프로바이더와 동일한 `% left` 표시로 정규화합니다. MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 사용된 할당량이 아니라 남은 할당량이므로, OpenClaw는 이를 반전합니다. count 기반 필드가 있으면 그것이 우선합니다.
    - API가 `model_remains`를 반환하면, OpenClaw는 채팅 모델 항목을 우선 사용하고, 필요 시 `start_time` / `end_time`에서 윈도우 레이블을 도출하며, coding-plan 윈도우를 더 쉽게 구분할 수 있도록 계획 레이블에 선택된 모델 이름을 포함합니다.
    - 사용량 스냅샷은 `minimax`, `minimax-cn`, `minimax-portal`을 동일한 MiniMax 할당량 표면으로 취급하며, Coding Plan 키 env var로 대체하기 전에 저장된 MiniMax OAuth를 우선 사용합니다.
  </Accordion>
</AccordionGroup>

## 참고

- 모델 ref는 인증 경로를 따릅니다:
  - API 키 설정: `minimax/<model>`
  - OAuth 설정: `minimax-portal/<model>`
- 기본 채팅 모델: `MiniMax-M2.7`
- 대체 채팅 모델: `MiniMax-M2.7-highspeed`
- 온보딩 및 직접 API 키 설정은 두 M2.7 변형 모두에 대해 텍스트 전용 모델 정의를 기록합니다
- 이미지 이해는 Plugin 소유 `MiniMax-VL-01` 미디어 프로바이더를 사용합니다
- 정확한 비용 추적이 필요하면 `models.json`의 가격 값을 업데이트하세요
- 현재 프로바이더 ID를 확인하려면 `openclaw models list`를 사용하고, `openclaw models set minimax/MiniMax-M2.7` 또는 `openclaw models set minimax-portal/MiniMax-M2.7`로 전환하세요

<Tip>
MiniMax Coding Plan 추천 링크(10% 할인): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
프로바이더 규칙은 [Model providers](/ko/concepts/model-providers)를 참고하세요.
</Note>

## 문제 해결

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    이는 보통 **MiniMax 프로바이더가 구성되지 않았음**을 의미합니다(일치하는 프로바이더 항목이 없고, MiniMax 인증 프로필/env 키도 확인되지 않음). 이 감지에 대한 수정은 **2026.1.12**에 포함되어 있습니다. 다음 방법으로 해결하세요:

    - **2026.1.12**로 업그레이드(또는 소스 `main`에서 실행)한 뒤 gateway를 다시 시작합니다.
    - `openclaw configure`를 실행하고 **MiniMax** 인증 옵션을 선택하거나,
    - 일치하는 `models.providers.minimax` 또는 `models.providers.minimax-portal` 블록을 수동으로 추가하거나,
    - `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, 또는 MiniMax 인증 프로필을 설정해 일치하는 프로바이더가 주입될 수 있게 합니다.

    모델 ID는 **대소문자를 구분**한다는 점을 확인하세요:

    - API 키 경로: `minimax/MiniMax-M2.7` 또는 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 경로: `minimax-portal/MiniMax-M2.7` 또는 `minimax-portal/MiniMax-M2.7-highspeed`

    그런 다음 다음 명령으로 다시 확인하세요:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [Troubleshooting](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    프로바이더, 모델 ref, failover 동작 선택하기.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수 및 프로바이더 선택.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공유 음악 도구 매개변수 및 프로바이더 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수 및 프로바이더 선택.
  </Card>
  <Card title="MiniMax Search" href="/ko/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan을 통한 웹 검색 구성.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ.
  </Card>
</CardGroup>
