---
read_when:
    - 미디어 이해 설계 또는 리팩터링
    - 인바운드 오디오/비디오/이미지 전처리 조정
sidebarTitle: Media understanding
summary: 수신 이미지/오디오/비디오 이해(선택 사항), 제공자 + CLI 폴백 지원
title: 미디어 이해
x-i18n:
    generated_at: "2026-06-27T17:38:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw는 응답 파이프라인이 실행되기 전에 **인바운드 미디어를 요약**(이미지/오디오/비디오)할 수 있습니다. 로컬 도구나 provider 키를 사용할 수 있는지 자동으로 감지하며, 비활성화하거나 사용자 지정할 수 있습니다. 이해 기능이 꺼져 있으면 모델은 평소처럼 원본 파일/URL을 계속 받습니다.

벤더별 미디어 동작은 벤더 Plugin이 등록하고, OpenClaw 코어는 공유 `tools.media` 구성, fallback 순서, 응답 파이프라인 통합을 소유합니다.

## 목표

- 선택 사항: 더 빠른 라우팅과 더 나은 명령 파싱을 위해 인바운드 미디어를 짧은 텍스트로 미리 요약합니다.
- 모델에 원본 미디어 전달을 보존합니다(항상).
- **provider API**와 **CLI fallback**을 지원합니다.
- 순서가 있는 fallback(오류/크기/타임아웃)으로 여러 모델을 허용합니다.

## 상위 수준 동작

<Steps>
  <Step title="Collect attachments">
    인바운드 첨부 파일(`MediaPaths`, `MediaUrls`, `MediaTypes`)을 수집합니다.
  </Step>
  <Step title="Select per-capability">
    활성화된 각 capability(이미지/오디오/비디오)에 대해 정책에 따라 첨부 파일을 선택합니다(기본값: **첫 번째**).
  </Step>
  <Step title="Choose model">
    첫 번째 적격 모델 항목을 선택합니다(크기 + capability + 인증).
  </Step>
  <Step title="Fallback on failure">
    모델이 실패하거나 미디어가 너무 크면 **다음 항목으로 fallback**합니다.
  </Step>
  <Step title="Apply success block">
    성공 시:

    - `Body`가 `[Image]`, `[Audio]` 또는 `[Video]` 블록이 됩니다.
    - 오디오는 `{{Transcript}}`를 설정합니다. 명령 파싱은 캡션 텍스트가 있으면 이를 사용하고, 없으면 transcript를 사용합니다.
    - 캡션은 블록 안에서 `User text:`로 보존됩니다.

  </Step>
</Steps>

이해 기능이 실패하거나 비활성화되어도 **응답 흐름은 계속 진행**되며 원래 본문과 첨부 파일을 사용합니다.

## 구성 개요

`tools.media`는 **공유 모델**과 capability별 오버라이드를 지원합니다.

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: 공유 모델 목록입니다(`capabilities`로 제한).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - 기본값(`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - provider 오버라이드(`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram`을 통한 Deepgram 오디오 옵션
      - 오디오 transcript 에코 제어(`echoTranscript`, 기본값 `false`; `echoFormat`)
      - 선택 사항인 **capability별 `models` 목록**(공유 모델보다 우선)
      - `attachments` 정책(`mode`, `maxAttachments`, `prefer`)
      - `scope`(채널/chatType/세션 키별 선택적 게이팅)
    - `tools.media.concurrency`: 동시 capability 실행의 최대 수(기본값 **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### 모델 항목

각 `models[]` 항목은 **provider** 또는 **CLI**일 수 있습니다.

<Tabs>
  <Tab title="Provider entry">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI entry">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI 템플릿은 다음도 사용할 수 있습니다.

    - `{{MediaDir}}`(미디어 파일이 포함된 디렉터리)
    - `{{OutputDir}}`(이 실행을 위해 생성된 scratch 디렉터리)
    - `{{OutputBase}}`(scratch 파일 기본 경로, 확장자 없음)

  </Tab>
</Tabs>

### Provider 자격 증명(`apiKey`)

Provider 미디어 이해는 일반 모델 호출과 동일한 provider 인증 확인 방식을 사용합니다. 인증 프로필, 환경 변수, 그리고
`models.providers.<providerId>.apiKey` 순서입니다.

`tools.media.*.models[]` 항목은 인라인 `apiKey` 필드를 허용하지 않습니다. 미디어 모델 항목의 `provider` 값(예: `openai` 또는 `moonshot`)은 표준 provider 인증 소스 중 하나를 통해 자격 증명을 사용할 수 있어야 합니다.

최소 예시:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

프로필, 환경 변수, 사용자 지정 기본 URL을 포함한 전체 provider 인증 참고 자료는 [도구 및 사용자 지정 provider](/ko/gateway/config-tools)를 참조하세요.

## 기본값 및 제한

권장 기본값:

- `maxChars`: 이미지/비디오에 **500**(짧고 명령에 적합)
- `maxChars`: 오디오에는 **설정하지 않음**(제한을 설정하지 않는 한 전체 transcript)
- `maxBytes`:
  - 이미지: **10MB**
  - 오디오: **20MB**
  - 비디오: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - 미디어가 `maxBytes`를 초과하면 해당 모델은 건너뛰고 **다음 모델을 시도**합니다.
    - **1024바이트**보다 작은 오디오 파일은 비어 있거나 손상된 것으로 처리되어 provider/CLI transcription 전에 건너뜁니다. 인바운드 응답 컨텍스트는 결정론적 placeholder transcript를 받아 agent가 해당 note가 너무 작았음을 알 수 있습니다.
    - 모델이 `maxChars`보다 더 많이 반환하면 출력은 잘립니다.
    - `prompt`의 기본값은 간단한 "Describe the {media}."와 `maxChars` 안내입니다(이미지/비디오만).
    - 활성 기본 이미지 모델이 이미 vision을 네이티브로 지원하면 OpenClaw는 `[Image]` 요약 블록을 건너뛰고 대신 원본 이미지를 모델에 전달합니다.
    - Gateway/WebChat 기본 모델이 텍스트 전용이면 이미지 첨부 파일은 offloaded `media://inbound/*` 참조로 보존되어, 첨부 파일을 잃지 않고 이미지/PDF 도구 또는 구성된 이미지 모델이 계속 검사할 수 있습니다.
    - 명시적인 `openclaw infer image describe --model <provider/model>` 요청은 다릅니다. 이 요청은 `ollama/qwen2.5vl:7b` 같은 Ollama 참조를 포함해 해당 이미지 지원 provider/model을 직접 실행합니다.
    - `<capability>.enabled: true`이지만 모델이 구성되어 있지 않으면 OpenClaw는 해당 provider가 capability를 지원할 때 **활성 응답 모델**을 시도합니다.

  </Accordion>
</AccordionGroup>

### 미디어 이해 자동 감지(기본값)

`tools.media.<capability>.enabled`가 `false`로 설정되어 있지 않고 모델을 구성하지 않았다면, OpenClaw는 다음 순서로 자동 감지하고 **첫 번째로 작동하는 옵션에서 중지**합니다.

<Steps>
  <Step title="Active reply model">
    provider가 capability를 지원할 때 활성 응답 모델입니다.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` 기본/fallback 참조입니다(이미지만).
    `provider/model` 참조를 선호하세요. Bare ref는 일치 항목이 유일할 때만 구성된 이미지 지원 provider 모델 항목에서 한정됩니다.
  </Step>
  <Step title="Local CLIs (audio only)">
    로컬 CLI(설치된 경우):

    - `sherpa-onnx-offline`(encoder/decoder/joiner/tokens가 있는 `SHERPA_ONNX_MODEL_DIR` 필요)
    - `whisper-cli`(`whisper-cpp`; `WHISPER_CPP_MODEL` 또는 번들된 tiny 모델 사용)
    - `whisper`(Python CLI; 모델을 자동으로 다운로드)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files`를 사용하는 `gemini`입니다.
  </Step>
  <Step title="Provider auth">
    - capability를 지원하는 구성된 `models.providers.*` 항목은 번들된 fallback 순서보다 먼저 시도됩니다.
    - 이미지 지원 모델이 있는 이미지 전용 구성 provider는 번들된 벤더 Plugin이 아니더라도 미디어 이해에 자동 등록됩니다.
    - Ollama 이미지 이해는 명시적으로 선택했을 때 사용할 수 있습니다. 예를 들어 `agents.defaults.imageModel` 또는 `openclaw infer image describe --model ollama/<vision-model>`을 통해 사용할 수 있습니다.

    번들된 fallback 순서:

    - 오디오: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - 이미지: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - 비디오: Google → Qwen → Moonshot

  </Step>
</Steps>

자동 감지를 비활성화하려면 다음을 설정하세요.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
바이너리 감지는 macOS/Linux/Windows 전반에서 최선의 방식으로 수행됩니다. CLI가 `PATH`에 있는지 확인하세요(`~`를 확장함). 또는 전체 명령 경로가 있는 명시적 CLI 모델을 설정하세요.
</Note>

### 프록시 환경 지원(provider 모델)

Provider 기반 **오디오** 및 **비디오** 미디어 이해가 활성화되면 OpenClaw는 provider HTTP 호출에 대해 표준 아웃바운드 프록시 환경 변수를 준수합니다.

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

프록시 환경 변수가 설정되어 있지 않으면 미디어 이해는 직접 egress를 사용합니다. 프록시 값이 잘못된 형식이면 OpenClaw는 경고를 기록하고 직접 가져오기로 fallback합니다.

## Capabilities(선택 사항)

`capabilities`를 설정하면 해당 항목은 지정된 미디어 유형에 대해서만 실행됩니다. 공유 목록의 경우 OpenClaw는 기본값을 추론할 수 있습니다.

- `openai`, `anthropic`, `minimax`: **이미지**
- `minimax-portal`: **이미지**
- `moonshot`: **이미지 + 비디오**
- `openrouter`: **이미지 + 오디오**
- `google`(Gemini API): **이미지 + 오디오 + 비디오**
- `qwen`: **이미지 + 비디오**
- `mistral`: **오디오**
- `zai`: **이미지**
- `groq`: **오디오**
- `xai`: **오디오**
- `deepgram`: **오디오**
- 이미지 지원 모델이 있는 모든 `models.providers.<id>.models[]` 카탈로그: **이미지**

CLI 항목의 경우 예상치 못한 매칭을 피하려면 **`capabilities`를 명시적으로 설정**하세요. `capabilities`를 생략하면 해당 항목은 자신이 포함된 목록에 적격합니다.

## Provider 지원 매트릭스(OpenClaw 통합)

| Capability | Provider 통합                                                                                                             | 참고                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 이미지      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | 벤더 Plugin이 이미지 지원을 등록합니다. `openai/*`는 API 키 또는 Codex OAuth 라우팅을 사용할 수 있습니다. `codex/*`는 제한된 Codex app-server turn을 사용합니다. MiniMax와 MiniMax OAuth는 모두 `MiniMax-VL-01`을 사용합니다. 이미지 지원 config provider는 자동 등록됩니다. |
| 오디오      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Provider transcription(Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| 비디오      | Google, Qwen, Moonshot                                                                                                       | 벤더 Plugin을 통한 provider 비디오 이해입니다. Qwen 비디오 이해는 Standard DashScope endpoints를 사용합니다.                                                                                                                            |

<Note>
**MiniMax 참고**

- `minimax`, `minimax-cn`, `minimax-portal`, `minimax-portal-cn` 이미지 이해는 Plugin이 소유한 `MiniMax-VL-01` 미디어 제공자에서 제공됩니다.
- 자동 이미지 라우팅은 레거시 MiniMax M2.x 채팅 메타데이터가 이미지 입력을 지원한다고 표시하더라도 계속 `MiniMax-VL-01`을 사용합니다.

</Note>

## 모델 선택 지침

- 품질과 안전이 중요한 경우 각 미디어 기능에서 사용할 수 있는 가장 강력한 최신 세대 모델을 우선 사용하세요.
- 신뢰할 수 없는 입력을 처리하는 도구 지원 에이전트에는 오래되었거나 성능이 약한 미디어 모델을 피하세요.
- 가용성을 위해 기능마다 최소 하나의 폴백을 유지하세요(품질 모델 + 더 빠르거나 저렴한 모델).
- CLI 폴백(`whisper-cli`, `whisper`, `gemini`)은 제공자 API를 사용할 수 없을 때 유용합니다.
- `parakeet-mlx` 참고: `--output-dir`을 사용하면 출력 형식이 `txt`이거나 지정되지 않은 경우 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 형식은 stdout으로 폴백됩니다.

## 첨부 파일 정책

기능별 `attachments`는 처리할 첨부 파일을 제어합니다.

<ParamField path="mode" type='"first" | "all"' default="first">
  처음 선택된 첨부 파일만 처리할지, 모두 처리할지 여부입니다.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  처리할 개수의 상한입니다.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  후보 첨부 파일 중 선택 선호도입니다.
</ParamField>

`mode: "all"`이면 출력에 `[Image 1/2]`, `[Audio 2/2]` 등의 레이블이 붙습니다.

<AccordionGroup>
  <Accordion title="파일 첨부 추출 동작">
    - 추출된 파일 텍스트는 미디어 프롬프트에 추가되기 전에 **신뢰할 수 없는 외부 콘텐츠**로 래핑됩니다.
    - 삽입된 블록은 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 명시적 경계 마커를 사용하며 `Source: External` 메타데이터 줄을 포함합니다.
    - 이 첨부 파일 추출 경로는 미디어 프롬프트가 불필요하게 커지는 것을 피하기 위해 긴 `SECURITY NOTICE:` 배너를 의도적으로 생략합니다. 경계 마커와 메타데이터는 그대로 유지됩니다.
    - 파일에 추출 가능한 텍스트가 없으면 OpenClaw는 `[No extractable text]`를 삽입합니다.
    - 이 경로에서 PDF가 렌더링된 페이지 이미지로 폴백되는 경우, 이 첨부 파일 추출 단계는 렌더링된 PDF 이미지가 아니라 텍스트 블록을 전달하므로 미디어 프롬프트는 `[PDF content rendered to images; images not forwarded to model]` 플레이스홀더를 유지합니다.

  </Accordion>
</AccordionGroup>

## 설정 예시

<Tabs>
  <Tab title="공유 모델 + 오버라이드">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="오디오 + 비디오만">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="이미지만">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="멀티모달 단일 항목">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 상태 출력

미디어 이해가 실행되면 `/status`에 짧은 요약 줄이 포함됩니다.

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

이는 기능별 결과와 해당하는 경우 선택된 제공자/모델을 표시합니다.

## 참고

- 이해는 **최선 노력** 방식입니다. 오류가 답변을 차단하지 않습니다.
- 이해가 비활성화되어 있어도 첨부 파일은 계속 모델에 전달됩니다.
- `scope`를 사용해 이해가 실행되는 위치를 제한하세요(예: DM만).

## 관련

- [설정](/ko/gateway/configuration)
- [이미지 및 미디어 지원](/ko/nodes/images)
