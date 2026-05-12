---
read_when:
    - 미디어 이해 설계 또는 리팩터링
    - 인바운드 오디오/비디오/이미지 전처리 조정
sidebarTitle: Media understanding
summary: 수신 이미지/오디오/비디오 이해(선택 사항)와 제공자 + CLI 폴백
title: 미디어 이해
x-i18n:
    generated_at: "2026-05-12T08:45:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw는 응답 파이프라인이 실행되기 전에 **인바운드 미디어를 요약**(이미지/오디오/비디오)할 수 있습니다. 로컬 도구 또는 제공자 키를 사용할 수 있을 때 자동 감지하며, 비활성화하거나 사용자 지정할 수 있습니다. 이해 기능이 꺼져 있어도 모델은 평소처럼 원본 파일/URL을 계속 받습니다.

벤더별 미디어 동작은 벤더 Plugin이 등록하며, OpenClaw 코어는 공유 `tools.media` 구성, 대체 순서, 응답 파이프라인 통합을 담당합니다.

## 목표

- 선택 사항: 더 빠른 라우팅 + 더 나은 명령 파싱을 위해 인바운드 미디어를 짧은 텍스트로 사전 요약합니다.
- 원본 미디어가 모델에 전달되도록 보존합니다(항상).
- **제공자 API**와 **CLI 대체 수단**을 지원합니다.
- 순서가 지정된 대체(오류/크기/시간 초과)를 위해 여러 모델을 허용합니다.

## 상위 수준 동작

<Steps>
  <Step title="첨부 파일 수집">
    인바운드 첨부 파일(`MediaPaths`, `MediaUrls`, `MediaTypes`)을 수집합니다.
  </Step>
  <Step title="기능별 선택">
    활성화된 각 기능(이미지/오디오/비디오)에 대해 정책에 따라 첨부 파일을 선택합니다(기본값: **첫 번째**).
  </Step>
  <Step title="모델 선택">
    첫 번째 적격 모델 항목(크기 + 기능 + 인증)을 선택합니다.
  </Step>
  <Step title="실패 시 대체">
    모델이 실패하거나 미디어가 너무 크면 **다음 항목으로 대체합니다**.
  </Step>
  <Step title="성공 블록 적용">
    성공 시:

    - `Body`는 `[Image]`, `[Audio]` 또는 `[Video]` 블록이 됩니다.
    - 오디오는 `{{Transcript}}`를 설정합니다. 캡션 텍스트가 있으면 명령 파싱은 이를 사용하고, 없으면 트랜스크립트를 사용합니다.
    - 캡션은 블록 안에서 `User text:`로 보존됩니다.

  </Step>
</Steps>

이해가 실패하거나 비활성화되어도 **응답 흐름은 계속됩니다**. 원본 본문 + 첨부 파일이 사용됩니다.

## 구성 개요

`tools.media`는 **공유 모델**과 기능별 재정의를 지원합니다:

<AccordionGroup>
  <Accordion title="최상위 키">
    - `tools.media.models`: 공유 모델 목록(`capabilities`로 제한).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - 기본값(`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - 제공자 재정의(`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram`을 통한 Deepgram 오디오 옵션
      - 오디오 트랜스크립트 에코 제어(`echoTranscript`, 기본값 `false`; `echoFormat`)
      - 선택적 **기능별 `models` 목록**(공유 모델보다 우선)
      - `attachments` 정책(`mode`, `maxAttachments`, `prefer`)
      - `scope`(채널/chatType/세션 키별 선택적 제한)
    - `tools.media.concurrency`: 최대 동시 기능 실행 수(기본값 **2**).

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

각 `models[]` 항목은 **제공자** 또는 **CLI**일 수 있습니다:

<Tabs>
  <Tab title="제공자 항목">
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

    CLI 템플릿은 다음도 사용할 수 있습니다:

    - `{{MediaDir}}`(미디어 파일이 들어 있는 디렉터리)
    - `{{OutputDir}}`(이번 실행을 위해 생성된 스크래치 디렉터리)
    - `{{OutputBase}}`(확장자 없는 스크래치 파일 기본 경로)

  </Tab>
</Tabs>

## 기본값 및 제한

권장 기본값:

- `maxChars`: 이미지/비디오용 **500**(짧고 명령에 적합)
- `maxChars`: 오디오용은 **설정하지 않음**(제한을 설정하지 않는 한 전체 트랜스크립트)
- `maxBytes`:
  - 이미지: **10MB**
  - 오디오: **20MB**
  - 비디오: **50MB**

<AccordionGroup>
  <Accordion title="규칙">
    - 미디어가 `maxBytes`를 초과하면 해당 모델을 건너뛰고 **다음 모델을 시도합니다**.
    - **1024바이트**보다 작은 오디오 파일은 비어 있거나 손상된 것으로 처리되어 제공자/CLI 트랜스크립션 전에 건너뜁니다. 인바운드 응답 컨텍스트는 에이전트가 노트가 너무 작았다는 것을 알 수 있도록 결정적 플레이스홀더 트랜스크립트를 받습니다.
    - 모델이 `maxChars`보다 많이 반환하면 출력이 잘립니다.
    - `prompt`는 간단한 "{media}를 설명하세요."와 `maxChars` 지침을 기본값으로 사용합니다(이미지/비디오만).
    - 활성 기본 이미지 모델이 이미 비전을 기본 지원하면 OpenClaw는 `[Image]` 요약 블록을 건너뛰고 대신 원본 이미지를 모델에 전달합니다.
    - Gateway/WebChat 기본 모델이 텍스트 전용이면 이미지 첨부 파일은 오프로드된 `media://inbound/*` 참조로 보존되어, 첨부 파일을 잃지 않고 이미지/PDF 도구 또는 구성된 이미지 모델이 계속 검사할 수 있습니다.
    - 명시적인 `openclaw infer image describe --model <provider/model>` 요청은 다릅니다. `ollama/qwen2.5vl:7b` 같은 Ollama 참조를 포함해 해당 이미지 지원 provider/model을 직접 실행합니다.
    - `<capability>.enabled: true`이지만 모델이 구성되지 않은 경우, OpenClaw는 제공자가 해당 기능을 지원하면 **활성 응답 모델**을 시도합니다.

  </Accordion>
</AccordionGroup>

### 미디어 이해 자동 감지(기본값)

`tools.media.<capability>.enabled`가 `false`로 설정되어 **있지 않고** 모델을 구성하지 않았다면, OpenClaw는 다음 순서로 자동 감지하고 **첫 번째 작동 옵션에서 중단합니다**:

<Steps>
  <Step title="활성 응답 모델">
    제공자가 해당 기능을 지원하는 경우 활성 응답 모델.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` 기본/대체 참조(이미지만).
    `provider/model` 참조를 선호합니다. 단독 참조는 일치가 고유한 경우에만 구성된 이미지 지원 제공자 모델 항목에서 한정됩니다.
  </Step>
  <Step title="로컬 CLI(오디오 전용)">
    로컬 CLI(설치된 경우):

    - `sherpa-onnx-offline`(encoder/decoder/joiner/tokens가 있는 `SHERPA_ONNX_MODEL_DIR` 필요)
    - `whisper-cli`(`whisper-cpp`; `WHISPER_CPP_MODEL` 또는 번들된 tiny 모델 사용)
    - `whisper`(Python CLI; 모델을 자동으로 다운로드)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files`를 사용하는 `gemini`.
  </Step>
  <Step title="제공자 인증">
    - 해당 기능을 지원하는 구성된 `models.providers.*` 항목은 번들된 대체 순서보다 먼저 시도됩니다.
    - 이미지 지원 모델이 있는 이미지 전용 구성 제공자는 번들된 벤더 Plugin이 아니어도 미디어 이해에 자동 등록됩니다.
    - Ollama 이미지 이해는 명시적으로 선택한 경우 사용할 수 있습니다. 예를 들어 `agents.defaults.imageModel` 또는 `openclaw infer image describe --model ollama/<vision-model>`을 통해 사용할 수 있습니다.

    번들된 대체 순서:

    - 오디오: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - 이미지: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - 비디오: Google → Qwen → Moonshot

  </Step>
</Steps>

자동 감지를 비활성화하려면 다음을 설정하세요:

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
바이너리 감지는 macOS/Linux/Windows 전반에서 최선 노력 방식입니다. CLI가 `PATH`에 있는지 확인하거나(`~`를 확장함), 전체 명령 경로로 명시적 CLI 모델을 설정하세요.
</Note>

### 프록시 환경 지원(제공자 모델)

제공자 기반 **오디오** 및 **비디오** 미디어 이해가 활성화되면, OpenClaw는 제공자 HTTP 호출에 대해 표준 아웃바운드 프록시 환경 변수를 따릅니다:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

프록시 환경 변수가 설정되지 않은 경우 미디어 이해는 직접 외부 연결을 사용합니다. 프록시 값의 형식이 잘못된 경우 OpenClaw는 경고를 기록하고 직접 가져오기로 대체합니다.

## 기능(선택 사항)

`capabilities`를 설정하면 해당 항목은 해당 미디어 유형에 대해서만 실행됩니다. 공유 목록의 경우 OpenClaw는 기본값을 추론할 수 있습니다:

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

CLI 항목에서는 예상치 못한 매칭을 피하려면 **`capabilities`를 명시적으로 설정하세요**. `capabilities`를 생략하면 해당 항목은 자신이 나타나는 목록에 적합한 것으로 간주됩니다.

## 제공자 지원 매트릭스(OpenClaw 통합)

| 기능 | 제공자 통합                                                                                                         | 참고                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 이미지      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, 구성 제공자 | 벤더 Plugin이 이미지 지원을 등록합니다. `openai-codex/*`는 OAuth 제공자 연결 구조를 사용합니다. `codex/*`는 제한된 Codex app-server 턴을 사용합니다. MiniMax와 MiniMax OAuth는 모두 `MiniMax-VL-01`을 사용합니다. 이미지 지원 구성 제공자는 자동 등록됩니다. |
| 오디오      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | 제공자 트랜스크립션(Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| 비디오      | Google, Qwen, Moonshot                                                                                                       | 벤더 Plugin을 통한 제공자 비디오 이해. Qwen 비디오 이해는 Standard DashScope 엔드포인트를 사용합니다.                                                                                                                        |

<Note>
**MiniMax 참고**

- `minimax` 및 `minimax-portal` 이미지 이해는 Plugin 소유의 `MiniMax-VL-01` 미디어 제공자에서 제공됩니다.
- 번들된 MiniMax 텍스트 카탈로그는 여전히 텍스트 전용으로 시작합니다. 명시적인 `models.providers.minimax` 항목은 이미지 지원 M2.7 채팅 참조를 생성합니다.

</Note>

## 모델 선택 지침

- 품질과 안전성이 중요할 때는 각 미디어 기능에 사용할 수 있는 가장 강력한 최신 세대 모델을 선호하세요.
- 신뢰할 수 없는 입력을 처리하는 도구 사용 에이전트의 경우 오래되었거나 약한 미디어 모델은 피하세요.
- 가용성을 위해 기능별 대체 모델을 하나 이상 유지하세요(고품질 모델 + 더 빠르거나 저렴한 모델).
- CLI 대체 수단(`whisper-cli`, `whisper`, `gemini`)은 제공자 API를 사용할 수 없을 때 유용합니다.
- `parakeet-mlx` 참고: `--output-dir`를 사용하면 출력 형식이 `txt`이거나 지정되지 않은 경우 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 형식은 stdout으로 대체됩니다.

## 첨부 파일 정책

기능별 `attachments`는 처리할 첨부 파일을 제어합니다:

<ParamField path="mode" type='"first" | "all"' default="first">
  첫 번째로 선택한 첨부 파일을 처리할지, 모든 첨부 파일을 처리할지 여부입니다.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  처리할 개수를 제한합니다.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  후보 첨부 파일 중 선택 우선순위입니다.
</ParamField>

`mode: "all"`일 때 출력에는 `[Image 1/2]`, `[Audio 2/2]` 등으로 레이블이 지정됩니다.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - 추출된 파일 텍스트는 미디어 프롬프트에 추가되기 전에 **신뢰할 수 없는 외부 콘텐츠**로 래핑됩니다.
    - 주입된 블록은 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 명시적 경계 마커를 사용하며 `Source: External` 메타데이터 줄을 포함합니다.
    - 이 첨부 파일 추출 경로는 미디어 프롬프트가 불필요하게 커지는 것을 피하기 위해 긴 `SECURITY NOTICE:` 배너를 의도적으로 생략합니다. 경계 마커와 메타데이터는 그대로 유지됩니다.
    - 파일에 추출 가능한 텍스트가 없으면 OpenClaw는 `[No extractable text]`를 주입합니다.
    - 이 경로에서 PDF가 렌더링된 페이지 이미지로 대체되면, 이 첨부 파일 추출 단계는 렌더링된 PDF 이미지가 아니라 텍스트 블록을 전달하므로 미디어 프롬프트는 `[PDF content rendered to images; images not forwarded to model]` 플레이스홀더를 유지합니다.

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

이는 기능별 결과와 적용 가능한 경우 선택된 공급자/모델을 보여줍니다.

## 참고 사항

- 이해는 **최선의 노력**으로 수행됩니다. 오류가 답변을 차단하지 않습니다.
- 이해가 비활성화되어 있어도 첨부 파일은 여전히 모델에 전달됩니다.
- `scope`를 사용하여 이해가 실행되는 위치를 제한하세요(예: DM만).

## 관련 항목

- [구성](/ko/gateway/configuration)
- [이미지 및 미디어 지원](/ko/nodes/images)
