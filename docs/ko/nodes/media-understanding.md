---
read_when:
    - 미디어 이해 설계 또는 리팩터링하기
    - inbound audio/video/image 전처리 조정하기
sidebarTitle: Media understanding
summary: provider + CLI 폴백을 사용하는 inbound image/audio/video 이해(선택 사항)
title: 미디어 이해
x-i18n:
    generated_at: "2026-04-26T11:33:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw는 응답 파이프라인이 실행되기 전에 **inbound 미디어**(image/audio/video)를 요약할 수 있습니다. 로컬 도구나 provider 키를 사용할 수 있을 때 이를 자동 감지하며, 비활성화하거나 사용자 정의할 수도 있습니다. 이해 기능이 꺼져 있어도 모델은 원본 파일/URL을 평소처럼 계속 받습니다.

벤더별 미디어 동작은 벤더 Plugin이 등록하고, 코어 OpenClaw는 공용 `tools.media` config, 폴백 순서, 응답 파이프라인 통합을 담당합니다.

## 목표

- 선택 사항: 더 빠른 라우팅과 더 나은 명령 파싱을 위해 inbound 미디어를 짧은 텍스트로 미리 요약
- 원본 미디어 전달은 항상 모델에 유지
- **provider API**와 **CLI 폴백** 모두 지원
- 순서가 있는 여러 모델의 폴백 허용(오류/크기/timeout 기준)

## 상위 수준 동작

<Steps>
  <Step title="첨부 수집">
    inbound 첨부(`MediaPaths`, `MediaUrls`, `MediaTypes`)를 수집합니다.
  </Step>
  <Step title="capability별 선택">
    활성화된 각 capability(image/audio/video)에 대해 정책별로 첨부를 선택합니다(기본값: **첫 번째**).
  </Step>
  <Step title="모델 선택">
    첫 번째 적격 모델 항목(크기 + capability + auth)을 선택합니다.
  </Step>
  <Step title="실패 시 폴백">
    모델이 실패하거나 미디어가 너무 크면 **다음 항목으로 폴백**합니다.
  </Step>
  <Step title="성공 블록 적용">
    성공 시:

    - `Body`는 `[Image]`, `[Audio]`, `[Video]` 블록이 됩니다.
    - Audio는 `{{Transcript}}`를 설정하며, 명령 파싱은 캡션 텍스트가 있으면 이를 사용하고, 없으면 transcript를 사용합니다.
    - 캡션은 블록 안에 `User text:`로 보존됩니다.

  </Step>
</Steps>

이해가 실패하거나 비활성화되어도 **응답 흐름은 계속 진행**되며 원본 body + 첨부를 유지합니다.

## Config 개요

`tools.media`는 **공용 모델**과 capability별 재정의를 지원합니다.

<AccordionGroup>
  <Accordion title="최상위 키">
    - `tools.media.models`: 공용 모델 목록(`capabilities`로 제한 가능)
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - 기본값(`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - provider 재정의(`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram`을 통한 Deepgram audio 옵션
      - audio transcript echo 제어(`echoTranscript`, 기본값 `false`; `echoFormat`)
      - 선택적 **capability별 `models` 목록**(공용 모델보다 우선)
      - `attachments` 정책(`mode`, `maxAttachments`, `prefer`)
      - `scope`(channel/chatType/session key 기준의 선택적 제한)
    - `tools.media.concurrency`: 동시에 실행할 수 있는 capability의 최대 수(기본값 **2**)
  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* 공용 목록 */
      ],
      image: {
        /* 선택적 재정의 */
      },
      audio: {
        /* 선택적 재정의 */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* 선택적 재정의 */
      },
    },
  },
}
```

### 모델 항목

각 `models[]` 항목은 **provider** 또는 **CLI**일 수 있습니다.

<Tabs>
  <Tab title="Provider 항목">
    ```json5
    {
      type: "provider", // 생략 시 기본값
      provider: "openai",
      model: "gpt-5.5",
      prompt: "이미지를 500자 이하로 설명하세요.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // 선택 사항, 멀티모달 항목에 사용
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
        "{{MediaPath}}의 미디어를 읽고 {{MaxChars}}자 이하로 설명하세요.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI 템플릿은 다음도 사용할 수 있습니다.

    - `{{MediaDir}}` (미디어 파일이 있는 디렉터리)
    - `{{OutputDir}}` (이 실행을 위해 생성된 scratch 디렉터리)
    - `{{OutputBase}}` (확장자 없는 scratch 파일 기본 경로)

  </Tab>
</Tabs>

## 기본값 및 제한

권장 기본값:

- `maxChars`: image/video는 **500**(짧고 명령 친화적)
- `maxChars`: audio는 **미설정**(제한을 두지 않으면 전체 transcript)
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="규칙">
    - 미디어가 `maxBytes`를 초과하면 해당 모델은 건너뛰고 **다음 모델을 시도**합니다.
    - **1024바이트**보다 작은 audio 파일은 비어 있거나 손상된 것으로 간주되어 provider/CLI 전사 전에 건너뜁니다. inbound 응답 컨텍스트는 결정적인 placeholder transcript를 받아 에이전트가 해당 노트가 너무 작았음을 알 수 있습니다.
    - 모델이 `maxChars`보다 긴 응답을 반환하면 출력은 잘립니다.
    - `prompt`의 기본값은 단순한 "Describe the {media}."와 `maxChars` 지침 조합입니다(image/video만).
    - 활성 primary image 모델이 이미 기본적으로 vision을 지원하면, OpenClaw는 `[Image]` 요약 블록을 건너뛰고 원본 이미지를 모델에 그대로 전달합니다.
    - Gateway/WebChat primary 모델이 텍스트 전용이면, image 첨부는 오프로드된 `media://inbound/*` ref로 보존되므로 image/PDF 도구나 구성된 image 모델이 이를 검사할 수 있으며 첨부가 사라지지 않습니다.
    - 명시적인 `openclaw infer image describe --model <provider/model>` 요청은 다릅니다. 이 경우 Ollama 참조(`ollama/qwen2.5vl:7b`)를 포함해 image-capable provider/model을 직접 실행합니다.
    - `<capability>.enabled: true`인데 구성된 모델이 없으면, OpenClaw는 해당 capability를 provider가 지원할 때 **활성 응답 모델**을 시도합니다.
  </Accordion>
</AccordionGroup>

### 미디어 이해 자동 감지(기본값)

`tools.media.<capability>.enabled`가 **명시적으로 `false`로 설정되지 않았고** 구성된 모델이 없다면, OpenClaw는 다음 순서로 자동 감지하며 **처음 동작하는 옵션에서 중지**합니다.

<Steps>
  <Step title="활성 응답 모델">
    provider가 해당 capability를 지원할 경우 활성 응답 모델.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel`의 primary/fallback 참조(image만).
  </Step>
  <Step title="로컬 CLI (audio만)">
    로컬 CLI(설치된 경우):

    - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR`에 encoder/decoder/joiner/tokens 필요)
    - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` 또는 번들된 tiny 모델 사용)
    - `whisper` (Python CLI; 모델 자동 다운로드)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files`를 사용하는 `gemini`.
  </Step>
  <Step title="Provider auth">
    - 해당 capability를 지원하는 구성된 `models.providers.*` 항목이 번들된 폴백 순서보다 먼저 시도됩니다.
    - image-capable 모델이 있는 image 전용 config provider도, 번들 벤더 Plugin이 아니어도 미디어 이해용으로 자동 등록됩니다.
    - Ollama image 이해는 예를 들어 `agents.defaults.imageModel` 또는 `openclaw infer image describe --model ollama/<vision-model>`을 통해 명시적으로 선택했을 때 사용할 수 있습니다.

    번들된 폴백 순서:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Image: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

자동 감지를 비활성화하려면 다음과 같이 설정하세요.

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
바이너리 감지는 macOS/Linux/Windows 전반에서 best-effort 방식입니다. CLI가 `PATH`에 있는지 확인하세요(`~`는 확장됨). 또는 전체 명령 경로를 사용해 명시적인 CLI 모델을 설정하세요.
</Note>

### 프록시 환경 변수 지원(provider 모델)

provider 기반 **audio** 및 **video** 미디어 이해가 활성화되면, OpenClaw는 provider HTTP 호출에 대해 표준 outbound 프록시 환경 변수를 따릅니다.

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

프록시 env var가 설정되지 않으면 미디어 이해는 직접 외부로 연결합니다. 프록시 값이 잘못된 형식이면 OpenClaw는 경고를 기록하고 직접 fetch로 폴백합니다.

## Capability(선택 사항)

`capabilities`를 설정하면 해당 항목은 지정된 미디어 유형에서만 실행됩니다. 공용 목록에서는 OpenClaw가 기본값을 추론할 수 있습니다.

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- image-capable 모델이 있는 모든 `models.providers.<id>.models[]` 카탈로그: **image**

CLI 항목의 경우, 예상치 못한 매칭을 피하려면 **`capabilities`를 명시적으로 설정**하세요. `capabilities`를 생략하면 해당 항목은 자신이 속한 목록에 대해 적격이 됩니다.

## Provider 지원 매트릭스 (OpenClaw 통합)

| Capability | Provider 통합                                                                                                              | 참고                                                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config provider | 벤더 Plugin이 image 지원을 등록합니다. `openai-codex/*`는 OAuth provider plumbing을, `codex/*`는 제한된 Codex app-server 턴을 사용합니다. MiniMax와 MiniMax OAuth는 모두 `MiniMax-VL-01`을 사용하며, image-capable config provider는 자동 등록됩니다. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                      | Provider 전사(Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                             |
| Video      | Google, Qwen, Moonshot                                                                                                     | 벤더 Plugin을 통한 provider video 이해. Qwen video 이해는 Standard DashScope 엔드포인트를 사용합니다.                                                                                                                                    |

<Note>
**MiniMax 참고**

- `minimax`와 `minimax-portal`의 image 이해는 Plugin이 소유한 `MiniMax-VL-01` 미디어 provider에서 제공합니다.
- 번들된 MiniMax 텍스트 카탈로그는 여전히 텍스트 전용으로 시작합니다. 명시적인 `models.providers.minimax` 항목은 image-capable M2.7 chat 참조를 실체화합니다.
  </Note>

## 모델 선택 지침

- 품질과 안전이 중요할 때는 각 미디어 capability에 대해 가능한 가장 강력한 최신 세대 모델을 우선 사용하세요.
- 신뢰할 수 없는 입력을 처리하는 도구 활성화 에이전트의 경우, 오래되거나 약한 미디어 모델은 피하세요.
- 가용성을 위해 capability별로 최소 하나의 폴백을 유지하세요(고품질 모델 + 더 빠르고 저렴한 모델).
- CLI 폴백(`whisper-cli`, `whisper`, `gemini`)은 provider API를 사용할 수 없을 때 유용합니다.
- `parakeet-mlx` 참고: `--output-dir`와 함께 사용할 때, 출력 형식이 `txt`이거나 지정되지 않은 경우 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 형식은 stdout으로 폴백됩니다.

## 첨부 정책

capability별 `attachments`는 어떤 첨부를 처리할지 제어합니다.

<ParamField path="mode" type='"first" | "all"' default="first">
  첫 번째로 선택된 첨부만 처리할지, 아니면 모두 처리할지를 지정합니다.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  처리할 첨부 수의 상한입니다.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  후보 첨부 중 선택 우선순위입니다.
</ParamField>

`mode: "all"`일 때 출력은 `[Image 1/2]`, `[Audio 2/2]`처럼 라벨이 붙습니다.

<AccordionGroup>
  <Accordion title="파일 첨부 추출 동작">
    - 추출된 파일 텍스트는 미디어 프롬프트에 추가되기 전에 **신뢰되지 않는 외부 콘텐츠**로 래핑됩니다.
    - 주입된 블록은 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 명시적 경계 마커를 사용하며 `Source: External` 메타데이터 줄을 포함합니다.
    - 이 첨부 추출 경로는 미디어 프롬프트가 너무 커지는 것을 피하기 위해 긴 `SECURITY NOTICE:` 배너를 의도적으로 생략합니다. 대신 경계 마커와 메타데이터는 그대로 유지됩니다.
    - 파일에서 추출 가능한 텍스트가 없으면 OpenClaw는 `[No extractable text]`를 주입합니다.
    - 이 경로에서 PDF가 렌더링된 페이지 이미지로 폴백되면, 이 첨부 추출 단계는 렌더링된 PDF 이미지를 전달하지 않고 텍스트 블록만 전달하므로 미디어 프롬프트에는 `[PDF content rendered to images; images not forwarded to model]` placeholder가 유지됩니다.
  </Accordion>
</AccordionGroup>

## Config 예시

<Tabs>
  <Tab title="공용 모델 + 재정의">
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
                "{{MediaPath}}의 미디어를 읽고 {{MaxChars}}자 이하로 설명하세요.",
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
  <Tab title="Audio + video만">
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
                  "{{MediaPath}}의 미디어를 읽고 {{MaxChars}}자 이하로 설명하세요.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Image 전용">
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
                  "{{MediaPath}}의 미디어를 읽고 {{MaxChars}}자 이하로 설명하세요.",
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

```text
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

이 줄은 capability별 결과와, 해당되는 경우 선택된 provider/model을 보여줍니다.

## 참고

- 이해 기능은 **best-effort**입니다. 오류가 발생해도 응답을 막지 않습니다.
- 이해 기능이 비활성화되어 있어도 첨부는 여전히 모델에 전달됩니다.
- `scope`를 사용해 이해 기능이 실행될 위치를 제한하세요(예: DM에서만).

## 관련 항목

- [Configuration](/ko/gateway/configuration)
- [Image & media support](/ko/nodes/images)
