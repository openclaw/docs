---
read_when:
    - 미디어 이해 설계 또는 리팩터링
    - 수신 오디오/비디오/이미지 전처리 조정
sidebarTitle: Media understanding
summary: 제공자 + CLI 폴백을 포함한 수신 이미지/오디오/비디오 이해(선택 사항)
title: 미디어 이해
x-i18n:
    generated_at: "2026-04-30T06:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw는 응답 파이프라인이 실행되기 전에 **인바운드 미디어를 요약**(이미지/오디오/비디오)할 수 있습니다. 로컬 도구나 공급자 키를 사용할 수 있을 때 자동으로 감지하며, 비활성화하거나 사용자 지정할 수 있습니다. 이해 기능이 꺼져 있으면 모델은 평소처럼 원본 파일/URL을 계속 받습니다.

공급자별 미디어 동작은 공급자 Plugin에서 등록하며, OpenClaw 코어는 공유 `tools.media` 구성, 폴백 순서, 응답 파이프라인 통합을 담당합니다.

## 목표

- 선택 사항: 더 빠른 라우팅과 더 나은 명령 파싱을 위해 인바운드 미디어를 짧은 텍스트로 미리 요약합니다.
- 모델로의 원본 미디어 전달을 보존합니다(항상).
- **공급자 API**와 **CLI 폴백**을 지원합니다.
- 정렬된 폴백(오류/크기/시간 초과)으로 여러 모델을 허용합니다.

## 상위 수준 동작

<Steps>
  <Step title="첨부 파일 수집">
    인바운드 첨부 파일(`MediaPaths`, `MediaUrls`, `MediaTypes`)을 수집합니다.
  </Step>
  <Step title="기능별 선택">
    활성화된 각 기능(이미지/오디오/비디오)에 대해 정책에 따라 첨부 파일을 선택합니다(기본값: **첫 번째**).
  </Step>
  <Step title="모델 선택">
    첫 번째로 적합한 모델 항목(크기 + 기능 + 인증)을 선택합니다.
  </Step>
  <Step title="실패 시 폴백">
    모델이 실패하거나 미디어가 너무 크면 **다음 항목으로 폴백**합니다.
  </Step>
  <Step title="성공 블록 적용">
    성공 시:

    - `Body`가 `[Image]`, `[Audio]` 또는 `[Video]` 블록이 됩니다.
    - 오디오는 `{{Transcript}}`를 설정합니다. 명령 파싱은 캡션 텍스트가 있으면 이를 사용하고, 없으면 전사문을 사용합니다.
    - 캡션은 블록 안의 `User text:`로 보존됩니다.

  </Step>
</Steps>

이해 기능이 실패하거나 비활성화되면 **응답 흐름은 계속 진행**되며 원본 본문 + 첨부 파일을 사용합니다.

## 구성 개요

`tools.media`는 **공유 모델**과 기능별 재정의를 지원합니다.

<AccordionGroup>
  <Accordion title="최상위 키">
    - `tools.media.models`: 공유 모델 목록(`capabilities`를 사용해 게이트).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - 기본값(`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - 공급자 재정의(`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram`을 통한 Deepgram 오디오 옵션
      - 오디오 전사문 에코 제어(`echoTranscript`, 기본값 `false`; `echoFormat`)
      - 선택적 **기능별 `models` 목록**(공유 모델보다 우선)
      - `attachments` 정책(`mode`, `maxAttachments`, `prefer`)
      - `scope`(채널/chatType/session 키별 선택적 게이트)
    - `tools.media.concurrency`: 동시에 실행할 수 있는 최대 기능 수(기본값 **2**).

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

각 `models[]` 항목은 **공급자** 또는 **CLI**일 수 있습니다.

<Tabs>
  <Tab title="공급자 항목">
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
  <Tab title="CLI 항목">
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
    - `{{OutputDir}}`(이 실행을 위해 생성된 스크래치 디렉터리)
    - `{{OutputBase}}`(확장자가 없는 스크래치 파일 기본 경로)

  </Tab>
</Tabs>

## 기본값과 제한

권장 기본값:

- `maxChars`: 이미지/비디오의 경우 **500**(짧고 명령에 적합)
- `maxChars`: 오디오의 경우 **설정 안 함**(제한을 설정하지 않는 한 전체 전사문)
- `maxBytes`:
  - 이미지: **10MB**
  - 오디오: **20MB**
  - 비디오: **50MB**

<AccordionGroup>
  <Accordion title="규칙">
    - 미디어가 `maxBytes`를 초과하면 해당 모델은 건너뛰고 **다음 모델을 시도**합니다.
    - **1024바이트**보다 작은 오디오 파일은 비어 있거나 손상된 것으로 처리되어 공급자/CLI 전사 전에 건너뜁니다. 인바운드 응답 컨텍스트는 에이전트가 해당 노트가 너무 작았음을 알 수 있도록 결정적 플레이스홀더 전사문을 받습니다.
    - 모델이 `maxChars`보다 많이 반환하면 출력이 잘립니다.
    - `prompt`의 기본값은 간단한 "Describe the {media}."와 `maxChars` 안내입니다(이미지/비디오만).
    - 활성 기본 이미지 모델이 이미 네이티브로 비전을 지원하면 OpenClaw는 `[Image]` 요약 블록을 건너뛰고 대신 원본 이미지를 모델에 전달합니다.
    - Gateway/WebChat 기본 모델이 텍스트 전용이면 이미지 첨부 파일은 오프로딩된 `media://inbound/*` 참조로 보존되므로, 첨부 파일을 잃지 않고 이미지/PDF 도구나 구성된 이미지 모델이 계속 검사할 수 있습니다.
    - 명시적 `openclaw infer image describe --model <provider/model>` 요청은 다릅니다. 해당 요청은 `ollama/qwen2.5vl:7b` 같은 Ollama 참조를 포함해 이미지 기능이 있는 공급자/모델을 직접 실행합니다.
    - `<capability>.enabled: true`이지만 모델이 구성되어 있지 않으면, OpenClaw는 해당 공급자가 기능을 지원할 때 **활성 응답 모델**을 시도합니다.

  </Accordion>
</AccordionGroup>

### 미디어 이해 자동 감지(기본값)

`tools.media.<capability>.enabled`가 `false`로 설정되어 **있지 않고** 모델을 구성하지 않았다면, OpenClaw는 다음 순서로 자동 감지하고 **첫 번째로 작동하는 옵션에서 중지**합니다.

<Steps>
  <Step title="활성 응답 모델">
    해당 공급자가 기능을 지원할 때 활성 응답 모델입니다.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` 기본/폴백 참조(이미지만).
    `provider/model` 참조를 선호합니다. 단순 참조는 일치 항목이 고유할 때만 구성된 이미지 기능 공급자 모델 항목에서 한정됩니다.
  </Step>
  <Step title="로컬 CLI(오디오만)">
    로컬 CLI(설치된 경우):

    - `sherpa-onnx-offline`(encoder/decoder/joiner/tokens가 있는 `SHERPA_ONNX_MODEL_DIR` 필요)
    - `whisper-cli`(`whisper-cpp`; `WHISPER_CPP_MODEL` 또는 번들 tiny 모델 사용)
    - `whisper`(Python CLI; 모델을 자동으로 다운로드)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files`를 사용하는 `gemini`.
  </Step>
  <Step title="공급자 인증">
    - 기능을 지원하는 구성된 `models.providers.*` 항목은 번들 폴백 순서보다 먼저 시도됩니다.
    - 이미지 기능 모델이 있는 이미지 전용 구성 공급자는 번들 공급자 Plugin이 아니어도 미디어 이해용으로 자동 등록됩니다.
    - Ollama 이미지 이해는 명시적으로 선택한 경우 사용할 수 있습니다. 예를 들어 `agents.defaults.imageModel` 또는 `openclaw infer image describe --model ollama/<vision-model>`을 통해 선택할 수 있습니다.

    번들 폴백 순서:

    - 오디오: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - 이미지: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - 비디오: Google → Qwen → Moonshot

  </Step>
</Steps>

자동 감지를 비활성화하려면 다음을 설정합니다.

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
바이너리 감지는 macOS/Linux/Windows 전반에서 최선의 방식으로 수행됩니다. CLI가 `PATH`에 있는지 확인하거나(`~`를 확장함), 전체 명령 경로로 명시적 CLI 모델을 설정하세요.
</Note>

### 프록시 환경 지원(공급자 모델)

공급자 기반 **오디오** 및 **비디오** 미디어 이해가 활성화되면, OpenClaw는 공급자 HTTP 호출에 대해 표준 아웃바운드 프록시 환경 변수를 따릅니다.

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

프록시 환경 변수가 설정되어 있지 않으면 미디어 이해는 직접 송신을 사용합니다. 프록시 값 형식이 잘못된 경우 OpenClaw는 경고를 기록하고 직접 가져오기로 폴백합니다.

## 기능(선택 사항)

`capabilities`를 설정하면 해당 항목은 해당 미디어 유형에 대해서만 실행됩니다. 공유 목록의 경우 OpenClaw는 기본값을 추론할 수 있습니다.

- `openai`, `anthropic`, `minimax`: **이미지**
- `minimax-portal`: **이미지**
- `moonshot`: **이미지 + 비디오**
- `openrouter`: **이미지**
- `google`(Gemini API): **이미지 + 오디오 + 비디오**
- `qwen`: **이미지 + 비디오**
- `mistral`: **오디오**
- `zai`: **이미지**
- `groq`: **오디오**
- `xai`: **오디오**
- `deepgram`: **오디오**
- 이미지 기능 모델이 있는 모든 `models.providers.<id>.models[]` 카탈로그: **이미지**

CLI 항목의 경우 예기치 않은 매칭을 피하려면 **`capabilities`를 명시적으로 설정**하세요. `capabilities`를 생략하면 해당 항목은 자신이 들어 있는 목록에 적합한 것으로 간주됩니다.

## 공급자 지원 매트릭스(OpenClaw 통합)

| 기능 | 공급자 통합                                                                                                         | 참고                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 이미지      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, 구성 공급자 | 공급자 Plugin이 이미지 지원을 등록합니다. `openai-codex/*`는 OAuth 공급자 플러밍을 사용합니다. `codex/*`는 제한된 Codex app-server 턴을 사용합니다. MiniMax와 MiniMax OAuth는 모두 `MiniMax-VL-01`을 사용합니다. 이미지 기능 구성 공급자는 자동 등록됩니다. |
| 오디오      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | 공급자 전사(Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| 비디오      | Google, Qwen, Moonshot                                                                                                       | 공급자 Plugin을 통한 공급자 비디오 이해입니다. Qwen 비디오 이해는 Standard DashScope 엔드포인트를 사용합니다.                                                                                                                        |

<Note>
**MiniMax 참고**

- `minimax` 및 `minimax-portal` 이미지 이해는 Plugin 소유 `MiniMax-VL-01` 미디어 공급자에서 제공됩니다.
- 번들 MiniMax 텍스트 카탈로그는 여전히 텍스트 전용으로 시작합니다. 명시적 `models.providers.minimax` 항목은 이미지 기능 M2.7 채팅 참조를 실체화합니다.

</Note>

## 모델 선택 지침

- 품질과 안전이 중요할 때 각 미디어 기능에 대해 사용 가능한 가장 강력한 최신 세대 모델을 선호하세요.
- 신뢰할 수 없는 입력을 처리하는 도구 활성 에이전트의 경우 오래되었거나 약한 미디어 모델을 피하세요.
- 가용성을 위해 기능별로 최소 하나의 폴백을 유지하세요(품질 모델 + 더 빠르거나 저렴한 모델).
- 공급자 API를 사용할 수 없을 때 CLI 폴백(`whisper-cli`, `whisper`, `gemini`)이 유용합니다.
- `parakeet-mlx` 참고: `--output-dir`와 함께 사용할 때 출력 형식이 `txt`(또는 미지정)이면 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 형식은 stdout으로 폴백합니다.

## 첨부 파일 정책

기능별 `attachments`는 처리할 첨부 파일을 제어합니다:

<ParamField path="mode" type='"first" | "all"' default="first">
  첫 번째 선택된 첨부 파일을 처리할지, 아니면 모두 처리할지 여부입니다.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  처리할 개수를 제한합니다.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  후보 첨부 파일 중 선택 선호도입니다.
</ParamField>

`mode: "all"`일 때 출력에는 `[Image 1/2]`, `[Audio 2/2]` 등과 같은 레이블이 붙습니다.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - 추출된 파일 텍스트는 미디어 프롬프트에 추가되기 전에 **신뢰할 수 없는 외부 콘텐츠**로 래핑됩니다.
    - 삽입된 블록은 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 명시적 경계 마커를 사용하며 `Source: External` 메타데이터 줄을 포함합니다.
    - 이 첨부 파일 추출 경로는 미디어 프롬프트가 불필요하게 커지는 것을 피하기 위해 긴 `SECURITY NOTICE:` 배너를 의도적으로 생략합니다. 경계 마커와 메타데이터는 그대로 유지됩니다.
    - 파일에 추출 가능한 텍스트가 없으면 OpenClaw는 `[No extractable text]`를 삽입합니다.
    - 이 경로에서 PDF가 렌더링된 페이지 이미지로 폴백하는 경우, 이 첨부 파일 추출 단계는 렌더링된 PDF 이미지가 아니라 텍스트 블록을 전달하므로 미디어 프롬프트에는 `[PDF content rendered to images; images not forwarded to model]` 플레이스홀더가 유지됩니다.

  </Accordion>
</AccordionGroup>

## 구성 예시

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

이 줄은 기능별 결과와, 해당하는 경우 선택된 제공자/모델을 보여줍니다.

## 참고

- 이해는 **최선의 노력** 방식입니다. 오류가 응답을 차단하지 않습니다.
- 이해가 비활성화된 경우에도 첨부 파일은 여전히 모델에 전달됩니다.
- 이해가 실행되는 위치를 제한하려면 `scope`를 사용하세요(예: DM만).

## 관련 항목

- [구성](/ko/gateway/configuration)
- [이미지 및 미디어 지원](/ko/nodes/images)
