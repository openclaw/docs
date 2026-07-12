---
read_when:
    - OpenClaw에서 MiniMax 모델을 사용하려는 경우
    - MiniMax 설정 안내가 필요합니다
summary: OpenClaw에서 MiniMax 모델 사용하기
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T01:11:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  번들로 제공되는 `minimax` Plugin은 두 개의 제공자와 채팅, 이미지 생성, 음악 생성, 동영상 생성, 이미지 이해, 음성(T2A v2), 웹 검색의 일곱 가지 기능을 등록합니다.

  | 제공자 ID       | 인증    | 기능                                                                                 |
  | ---------------- | ------- | ------------------------------------------------------------------------------------ |
  | `minimax`        | API 키  | 텍스트, 이미지 생성, 음악 생성, 동영상 생성, 이미지 이해, 음성, 웹 검색             |
  | `minimax-portal` | OAuth   | 텍스트, 이미지 생성, 음악 생성, 동영상 생성, 이미지 이해, 음성                      |

  <Tip>
  MiniMax Coding Plan 추천 링크(10% 할인): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## 기본 제공 카탈로그

  | 모델                     | 유형             | 설명                                  |
  | ------------------------ | ---------------- | ------------------------------------- |
  | `MiniMax-M3`             | 채팅(추론)       | 기본 호스팅 추론 모델                 |
  | `MiniMax-M2.7`           | 채팅(추론)       | 이전 호스팅 추론 모델                 |
  | `MiniMax-M2.7-highspeed` | 채팅(추론)       | 더 빠른 M2.7 추론 등급                |
  | `MiniMax-VL-01`          | 비전             | 이미지 이해 모델                      |
  | `image-01`               | 이미지 생성      | 텍스트-이미지 및 이미지-이미지 편집   |
  | `music-2.6`              | 음악 생성        | 기본 음악 모델                        |
  | `MiniMax-Hailuo-2.3`     | 동영상 생성      | 텍스트-동영상 및 이미지-동영상 흐름   |

  모델 참조는 인증 경로를 따릅니다. API 키 설정에서는 `minimax/<model>`, OAuth 설정에서는 `minimax-portal/<model>`을 사용합니다.

  ## 시작하기

  <Tabs>
  <Tab title="OAuth(Coding Plan)">
    **적합한 용도:** API 키 없이 OAuth를 통해 MiniMax Coding Plan을 빠르게 설정하는 경우.

    <Tabs>
      <Tab title="국제">
        <Steps>
          <Step title="온보딩 실행">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            설정되는 제공자 기본 URL: `api.minimax.io`.
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

            설정되는 제공자 기본 URL: `api.minimaxi.com`.
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
    OAuth 설정은 `minimax-portal` 제공자 ID를 사용합니다. 모델 참조 형식은 `minimax-portal/MiniMax-M3`입니다.
    </Note>

  </Tab>

  <Tab title="API 키">
    **적합한 용도:** Anthropic 호환 API를 사용하는 호스팅 MiniMax.

    <Tabs>
      <Tab title="국제">
        <Steps>
          <Step title="온보딩 실행">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            기본 URL을 `api.minimax.io`로 구성합니다.
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

            기본 URL을 `api.minimaxi.com`으로 구성합니다.
          </Step>
          <Step title="모델 사용 가능 여부 확인">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### 구성 예시

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    MiniMax-M2.x의 Anthropic 호환 스트리밍 엔드포인트는 네이티브 Anthropic 사고 블록 대신 OpenAI 스타일 델타 청크로 `reasoning_content`를 내보내므로, 사고 기능이 암시적으로 활성화된 상태로 유지되면 내부 추론이 사용자에게 표시되는 출력에 노출됩니다. 사용자가 직접 `thinking`을 명시적으로 설정하지 않는 한 OpenClaw는 기본적으로 M2.x의 사고 기능을 비활성화합니다. MiniMax-M3와 향후 호환되는 M3.x는 예외입니다. M3는 올바른 Anthropic 사고 블록을 내보내며 표시 가능한 콘텐츠를 생성하려면 사고 기능이 활성화되어 있어야 하므로, OpenClaw는 M3에서 제공자의 적응형 사고 경로를 유지합니다. 아래 고급 구성의 사고 기능 기본값 섹션을 참조하세요.
    </Warning>

    <Note>
    API 키 설정은 `minimax` 제공자 ID를 사용합니다. 모델 참조 형식은 `minimax/MiniMax-M3`입니다.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure`로 구성

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
    | 인증 선택               | 설명                              |
    | ----------------------- | --------------------------------- |
    | `minimax-global-oauth` | 국제 OAuth(Coding Plan)           |
    | `minimax-cn-oauth`     | 중국 OAuth(Coding Plan)           |
    | `minimax-global-api`   | 국제 API 키                       |
    | `minimax-cn-api`       | 중국 API 키                       |
  </Step>
  <Step title="기본 모델 선택">
    메시지가 표시되면 기본 모델을 선택합니다.
  </Step>
</Steps>

## 기능

### 이미지 생성

MiniMax Plugin은 `minimax`와 `minimax-portal` 모두에서 `image_generate` 도구에 `image-01` 모델을 등록하며, 텍스트 모델과 동일한 `MINIMAX_API_KEY` 또는 OAuth 인증을 재사용합니다.

- 텍스트-이미지 생성 및 이미지-이미지 편집(피사체 참조), 둘 다 종횡비 제어 지원
- 요청당 최대 9개의 출력 이미지, 편집 요청당 1개의 참조 이미지
- 지원되는 종횡비: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

이미지 생성은 항상 MiniMax 전용 이미지 엔드포인트(`/v1/image_generation`)를 사용하며 `models.providers.minimax.baseUrl`을 무시합니다. 이 필드는 대신 채팅/Anthropic 호환 기본 URL을 구성하기 때문입니다. 이미지 생성을 중국 엔드포인트로 라우팅하려면 `MINIMAX_API_HOST=https://api.minimaxi.com`을 설정합니다. 기본 글로벌 엔드포인트는 `https://api.minimax.io`입니다.

<Note>
공통 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.
</Note>

### 텍스트 음성 변환

번들 `minimax` Plugin은 MiniMax T2A v2를 `messages.tts`의 음성 제공자로 등록합니다.

- 기본 TTS 모델: `speech-2.8-hd`
- 기본 음성: `English_expressive_narrator`
- 번들 모델 ID: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- 인증 확인 순서: `messages.tts.providers.minimax.apiKey`, 그다음 `minimax-portal` OAuth/토큰 인증 프로필, 그다음 Token Plan 환경 키(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), 마지막으로 `MINIMAX_API_KEY`
- TTS 호스트가 구성되지 않은 경우 OpenClaw는 구성된 `minimax-portal` OAuth 호스트를 재사용하고 `/anthropic`과 같은 Anthropic 호환 경로 접미사를 제거합니다.
- 일반 오디오 첨부 파일은 MP3로 유지됩니다. 음성 메시지 호환 첨부 파일을 요청하는 대상(Feishu, Telegram 및 기타 채널)은 `ffmpeg`를 사용하여 MiniMax MP3를 48kHz Opus로 트랜스코딩합니다. 예를 들어 Feishu/Lark 파일 API는 네이티브 오디오 메시지에 `file_type: "opus"`만 허용하기 때문입니다.
- MiniMax T2A는 소수점 `speed`와 `vol`을 허용하지만 `pitch`는 정수로 전송됩니다. OpenClaw는 API 요청 전에 소수점 `pitch` 값을 버림 처리합니다.

| 설정                                     | 환경 변수              | 기본값                        | 설명                              |
| ---------------------------------------- | ---------------------- | ----------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 호스트입니다.     |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 모델 ID입니다.                |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 음성 출력에 사용하는 음성 ID입니다. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 재생 속도, `0.5..2.0`입니다.      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 음량, `(0, 10]`입니다.            |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 정수 음높이 이동, `-12..12`입니다. |

### 음악 생성

번들 MiniMax Plugin은 `minimax`와 `minimax-portal` 모두에서 공통 `music_generate` 도구를 통해 음악 생성을 등록합니다.

- 기본 음악 모델: `minimax/music-2.6`(OAuth: `minimax-portal/music-2.6`)
- `music-2.6-free`, `music-cover`, `music-cover-free`도 지원
- 프롬프트 제어 항목: `lyrics`, `instrumental`
- 출력 형식: `mp3`
- 세션 기반 실행은 `action: "status"`를 포함한 공통 작업/상태 흐름을 통해 분리됩니다.

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
공통 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [음악 생성](/ko/tools/music-generation)을 참조하세요.
</Note>

### 동영상 생성

번들 MiniMax Plugin은 `minimax`와 `minimax-portal` 모두에서 공통 `video_generate` 도구를 통해 동영상 생성을 등록합니다.

- 기본 동영상 모델: `minimax/MiniMax-Hailuo-2.3`(OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live`, `I2V-01`도 지원
- 모드: 텍스트-동영상 및 단일 이미지 참조 흐름
- `resolution` 지원(Hailuo 2.3/02 모델에서 `768P` 또는 `1080P), `aspectRatio`는 지원되지 않으며 무시됩니다.
__OC_I18N_900012__
<Note>
공통 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [동영상 생성](/tools/video-generation)을 참조하세요.
</Note>

### 이미지 이해

MiniMax Plugin은 이미지 이해 기능을 텍스트 카탈로그와 별도로 등록합니다.

| 제공자 ID        | 기본 이미지 모델   | PDF 텍스트 추출 |
| ---------------- | ------------------- | ---------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`   |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`   |

따라서 번들 텍스트 제공자 카탈로그에 이미지 기능을 지원하는 M3 채팅 참조가 포함되어 있어도 자동 미디어 라우팅에서 MiniMax 이미지 이해 기능을 사용할 수 있습니다. PDF 이해 기능은 텍스트 추출에만 `MiniMax-M2.7`을 사용하며, MiniMax는 PDF를 이미지로 변환하는 경로를 등록하지 않습니다.

### 웹 검색

MiniMax Plugin은 MiniMax Token Plan 검색 API(`/v1/coding_plan/search`)를 통해 `web_search`도 등록합니다.

- 제공자 ID: `minimax`
- 구조화된 결과: 제목, URL, 스니펫, 관련 검색어
- 권장 환경 변수: `MINIMAX_CODE_PLAN_KEY`
- 허용되는 환경 변수 별칭: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- 호환성 대체 경로: 이미 토큰 플랜 자격 증명을 가리키는 경우 `MINIMAX_API_KEY`
- 리전 재사용 순서: `plugins.entries.minimax.config.webSearch.region`, `MINIMAX_API_HOST`, MiniMax 제공자 기본 URL
- 검색은 제공자 ID `minimax`를 유지합니다. OAuth 중국/글로벌 설정은 `models.providers.minimax-portal.baseUrl`을 통해 간접적으로 리전을 지정할 수 있으며, `MINIMAX_OAUTH_TOKEN`을 통해 베어러 인증을 제공할 수 있습니다.

구성은 `plugins.entries.minimax.config.webSearch.*` 아래에 있습니다.

<Note>
전체 웹 검색 구성과 사용법은 [MiniMax 검색](/tools/minimax-search)을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="구성 옵션">
    | 옵션 | 설명 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic`(Anthropic 호환)을 권장하며, OpenAI 호환 페이로드에는 `https://api.minimax.io/v1`을 선택적으로 사용할 수 있습니다. |
    | `models.providers.minimax.api` | `anthropic-messages`를 권장하며, OpenAI 호환 페이로드에는 `openai-completions`를 선택적으로 사용할 수 있습니다. |
    | `models.providers.minimax.apiKey` | MiniMax API 키(`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` 정의 |
    | `agents.defaults.models` | 허용 목록에 포함할 모델의 별칭 지정 |
    | `models.mode` | 기본 제공 모델과 함께 MiniMax를 추가하려면 `merge`를 유지하세요. |
  </Accordion>

  <Accordion title="사고 기본값">
    `api: "anthropic-messages"`에서 이전 래퍼가 페이로드의 `thinking` 필드를 이미 설정하지 않은 경우, OpenClaw는 MiniMax M2.x 모델에 `thinking: { type: "disabled" }`를 삽입합니다. 이렇게 하면 M2.x의 스트리밍 엔드포인트가 OpenAI 스타일 델타 청크에 `reasoning_content`를 내보내 내부 추론이 표시 출력에 노출되는 것을 방지합니다.

    MiniMax-M3 및 M3.x는 예외입니다. 사고가 비활성화되면 M3가 `stop_reason: "end_turn"`과 함께 빈 `content` 배열을 반환하므로, OpenClaw는 M3에 대해 암시적인 비활성화 기본값을 제거하고 사고 수준이 설정된 경우 대신 `thinking: { type: "adaptive" }`를 강제합니다.

    모델 계열별 사용 가능한 사고 수준:

    | 모델 계열       | 수준                                      | 기본값     |
    | --------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`    | `off`, `adaptive`                         | `adaptive` |
    | `MiniMax-M2.x`  | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="고속 모드">
    `/fast on` 또는 `params.fastMode: true`는 Anthropic 호환 스트림 경로(`api: "anthropic-messages"`, 제공자 `minimax` 또는 `minimax-portal`)에서 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 변경합니다.
  </Accordion>

  <Accordion title="장애 조치 예시">
    **가장 적합한 용도:** 가장 강력한 최신 세대 모델을 기본 모델로 유지하고 MiniMax M2.7로 장애 조치합니다. 아래 예시는 구체적인 기본 모델로 Opus를 사용합니다. 원하는 최신 세대 기본 모델로 교체하세요.
__OC_I18N_900013__
  </Accordion>

  <Accordion title="Coding Plan 사용 세부 정보">
    - Coding Plan 사용량 API: `https://api.minimaxi.com/v1/token_plan/remains` 또는 `https://api.minimax.io/v1/token_plan/remains`(코딩 플랜 키 필요)
    - 구성된 경우 사용량 폴링은 `models.providers.minimax-portal.baseUrl` 또는 `models.providers.minimax.baseUrl`에서 호스트를 파생하므로, `https://api.minimax.io/anthropic`을 사용하는 글로벌 설정에서는 `api.minimax.io`를 폴링합니다. 기본 URL이 없거나 잘못된 경우 호환성을 위해 중국 리전 대체 경로를 유지합니다.
    - OpenClaw는 MiniMax 코딩 플랜 사용량을 다른 제공자와 동일한 `% 남음` 표시로 정규화합니다. MiniMax의 원시 `usage_percent` / `usagePercent` 필드는 소비한 할당량이 아니라 남은 할당량이므로 OpenClaw가 이를 반전합니다. 개수 기반 필드가 있으면 이를 우선합니다.
    - API가 `model_remains`를 반환하면 OpenClaw는 채팅 모델 항목을 우선하고, 필요한 경우 `start_time` / `end_time`에서 기간 레이블을 파생하며, 코딩 플랜 기간을 더 쉽게 구분할 수 있도록 선택한 모델 이름을 플랜 레이블에 포함합니다.
    - 사용량 스냅샷은 `minimax`, `minimax-cn`, `minimax-portal`, `minimax-portal-cn`을 동일한 MiniMax 할당량 영역으로 취급하며, Coding Plan 키 환경 변수로 대체하기 전에 저장된 MiniMax OAuth를 우선합니다.

  </Accordion>
</AccordionGroup>

## 참고 사항

- 기본 채팅 모델: `MiniMax-M3`. 대체 채팅 모델: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- 온보딩 및 직접 API 키 설정은 M3와 두 M2.7 변형의 모델 정의를 기록합니다.
- 이미지 이해에는 Plugin이 소유한 `MiniMax-VL-01` 미디어 제공자를 사용합니다.
- 정확한 비용 추적이 필요하면 `models.json`의 가격 값을 업데이트하세요.
- `openclaw models list`를 사용하여 현재 제공자 ID를 확인한 다음, `openclaw models set minimax/MiniMax-M3` 또는 `openclaw models set minimax-portal/MiniMax-M3`로 전환하세요.

<Note>
제공자 규칙은 [모델 제공자](/concepts/model-providers)를 참조하세요.
</Note>

## 문제 해결

<AccordionGroup>
  <Accordion title='"알 수 없는 모델: minimax/MiniMax-M3"'>
    이는 일반적으로 **MiniMax 제공자가 구성되지 않았음**을 의미합니다(일치하는 제공자 항목이 없으며 MiniMax 인증 프로필이나 환경 변수 키도 찾을 수 없음). 다음 방법으로 해결하세요.

    - `openclaw configure`를 실행하고 **MiniMax** 인증 옵션을 선택하거나
    - 일치하는 `models.providers.minimax` 또는 `models.providers.minimax-portal` 블록을 수동으로 추가하거나
    - 일치하는 제공자를 삽입할 수 있도록 `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` 또는 MiniMax 인증 프로필을 설정합니다.

    모델 ID는 **대소문자를 구분**하므로 정확히 입력하세요.

    - API 키 경로: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` 또는 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 경로: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` 또는 `minimax-portal/MiniMax-M2.7-highspeed`

    그런 다음 다음 명령으로 다시 확인하세요.

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [자주 묻는 질문](/ko/help/faq)
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수와 제공자 선택입니다.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공통 음악 도구 매개변수와 제공자 선택입니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공통 동영상 도구 매개변수와 제공자 선택입니다.
  </Card>
  <Card title="MiniMax 검색" href="/ko/tools/minimax-search" icon="magnifying-glass">
    MiniMax Token Plan을 통한 웹 검색 구성입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 자주 묻는 질문입니다.
  </Card>
</CardGroup>
