---
read_when:
    - '`openclaw infer` 명령 추가 또는 수정'
    - 안정적인 헤드리스 기능 자동화 설계
summary: 제공자 기반 모델, 이미지, 오디오, TTS, 비디오, 웹 및 임베딩 워크플로를 위한 추론 우선 CLI
title: 추론 CLI
x-i18n:
    generated_at: "2026-04-30T06:23:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer`는 공급자 기반 추론 워크플로의 표준 헤드리스 표면입니다.

원시 Gateway RPC 이름이나 원시 에이전트 도구 ID가 아니라 기능 계열을 의도적으로 노출합니다.

## infer를 skill로 전환하기

이 내용을 에이전트에 복사하여 붙여넣으세요.

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

좋은 infer 기반 skill은 다음을 수행해야 합니다.

- 일반적인 사용자 의도를 올바른 infer 하위 명령에 매핑
- 다루는 워크플로에 대한 몇 가지 표준 infer 예시 포함
- 예시와 제안에서 `openclaw infer ...` 선호
- skill 본문 안에서 전체 infer 표면을 다시 문서화하지 않기

일반적인 infer 중심 skill 적용 범위:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer를 사용하는 이유

`openclaw infer`는 OpenClaw 내부의 공급자 기반 추론 작업을 위한 일관된 CLI를 제공합니다.

이점:

- 각 백엔드에 대해 일회성 래퍼를 연결하는 대신 OpenClaw에 이미 구성된 공급자와 모델을 사용합니다.
- 모델, 이미지, 오디오 전사, TTS, 비디오, 웹, 임베딩 워크플로를 하나의 명령 트리 아래에 유지합니다.
- 스크립트, 자동화, 에이전트 주도 워크플로에 안정적인 `--json` 출력 형태를 사용합니다.
- 작업의 본질이 "추론 실행"일 때 1자 OpenClaw 표면을 선호합니다.
- 대부분의 infer 명령에서 Gateway를 요구하지 않고 일반 로컬 경로를 사용합니다.

종단 간 공급자 검사의 경우 하위 수준 공급자 테스트가 통과한 뒤 `openclaw infer ...`를 선호하세요. 공급자 요청이 이루어지기 전에 배포된 CLI, 구성 로드, 기본 에이전트 해석, 번들 Plugin 활성화, 런타임 의존성 복구, 공유 기능 런타임을 실행합니다.

## 명령 트리

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## 일반 작업

이 표는 일반적인 추론 작업을 해당 infer 명령에 매핑합니다.

| 작업                         | 명령                                                                                          | 참고                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 텍스트/모델 프롬프트 실행    | `openclaw infer model run --prompt "..." --json`                                              | 기본적으로 일반 로컬 경로를 사용합니다                |
| 이미지에서 모델 프롬프트 실행 | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 여러 이미지 입력에는 `--file`을 반복합니다            |
| 이미지 생성                  | `openclaw infer image generate --prompt "..." --json`                                         | 기존 파일에서 시작할 때는 `image edit` 사용           |
| 이미지 파일 설명             | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model`은 이미지 지원 `<provider/model>`이어야 함   |
| 오디오 전사                  | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model`은 `<provider/model>`이어야 함               |
| 음성 합성                    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status`는 Gateway 중심입니다                     |
| 비디오 생성                  | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` 같은 공급자 힌트를 지원합니다          |
| 비디오 파일 설명             | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model`은 `<provider/model>`이어야 함               |
| 웹 검색                      | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 웹 페이지 가져오기           | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 임베딩 생성                  | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 동작

- `openclaw infer ...`는 이러한 워크플로의 기본 CLI 표면입니다.
- 출력이 다른 명령이나 스크립트에서 소비될 경우 `--json`을 사용합니다.
- 특정 백엔드가 필요할 때는 `--provider` 또는 `--model provider/model`을 사용합니다.
- `image describe`, `audio transcribe`, `video describe`의 경우 `--model`은 `<provider/model>` 형식을 사용해야 합니다.
- `image describe`의 경우 명시적인 `--model`은 해당 공급자/모델을 직접 실행합니다. 모델은 모델 카탈로그 또는 공급자 구성에서 이미지를 지원해야 합니다. `codex/<model>`은 제한된 Codex 앱 서버 이미지 이해 턴을 실행하고, `openai-codex/<model>`은 OpenAI Codex OAuth 공급자 경로를 사용합니다.
- 무상태 실행 명령은 기본값이 로컬입니다.
- Gateway 관리 상태 명령은 기본값이 Gateway입니다.
- 일반 로컬 경로는 Gateway가 실행 중일 필요가 없습니다.
- 로컬 `model run`은 간결한 일회성 공급자 완료입니다. 구성된 에이전트 모델과 인증을 해석하지만, 채팅 에이전트 턴을 시작하거나 도구를 로드하거나 번들 MCP 서버를 열지 않습니다.
- `model run --file`은 이미지 파일을 받고, MIME 유형을 감지하며, 선택한 모델에 제공된 프롬프트와 함께 전송합니다. 여러 이미지에는 `--file`을 반복합니다.
- `model run --file`은 이미지가 아닌 입력을 거부합니다. 오디오 파일에는 `infer audio transcribe`를, 비디오 파일에는 `infer video describe`를 사용하세요.
- `model run --gateway`는 Gateway 라우팅, 저장된 인증, 공급자 선택, 임베디드 런타임을 실행하지만 여전히 원시 모델 프로브로 실행됩니다. 이전 세션 트랜스크립트, 부트스트랩/AGENTS 컨텍스트, 컨텍스트 엔진 조립, 도구 또는 번들 MCP 서버 없이 제공된 프롬프트와 이미지 첨부를 전송합니다.
- `model run --gateway --model <provider/model>`은 요청이 Gateway에 일회성 공급자/모델 재정의를 실행하도록 요구하므로 신뢰할 수 있는 운영자 Gateway 자격 증명이 필요합니다.

## 모델

공급자 기반 텍스트 추론과 모델/공급자 검사에는 `model`을 사용하세요.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Gateway를 시작하거나 전체 에이전트 도구 표면을 로드하지 않고 특정 공급자를 스모크 테스트하려면 전체 `<provider/model>` 참조를 사용하세요.

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

참고:

- 로컬 `model run`은 제공된 프롬프트만 선택한 모델에 전송하므로 공급자/모델/인증 상태를 확인하는 가장 좁은 CLI 스모크입니다.
- 로컬 `model run --file`은 그 간결한 경로를 유지하고 이미지 콘텐츠를 단일 사용자 메시지에 직접 첨부합니다. PNG, JPEG, WebP 같은 일반 이미지 파일은 MIME 유형이 `image/*`로 감지되면 작동하며, 지원되지 않거나 인식되지 않는 파일은 공급자가 호출되기 전에 실패합니다.
- `model run --file`은 선택한 멀티모달 텍스트 모델을 직접 테스트하려는 경우에 가장 적합합니다. OpenClaw의 이미지 이해 공급자 선택과 기본 이미지 모델 라우팅을 원할 때는 `infer image describe`를 사용하세요.
- 선택한 모델은 이미지 입력을 지원해야 하며, 텍스트 전용 모델은 공급자 계층에서 요청을 거부할 수 있습니다.
- `model run --prompt`는 공백이 아닌 텍스트를 포함해야 하며, 빈 프롬프트는 로컬 공급자 또는 Gateway가 호출되기 전에 거부됩니다.
- 로컬 `model run`은 공급자가 텍스트 출력을 반환하지 않으면 0이 아닌 코드로 종료되므로, 연결할 수 없는 로컬 공급자와 빈 완료가 성공한 프로브처럼 보이지 않습니다.
- 모델 입력을 원시 상태로 유지하면서 Gateway 라우팅, 에이전트 런타임 설정 또는 Gateway 관리 공급자 상태를 테스트해야 할 때는 `model run --gateway`를 사용하세요. 전체 에이전트 컨텍스트, 도구, 메모리, 세션 트랜스크립트를 원할 때는 `openclaw agent` 또는 채팅 표면을 사용하세요.
- `model auth login`, `model auth logout`, `model auth status`는 저장된 공급자 인증 상태를 관리합니다.

## 이미지

생성, 편집, 설명에는 `image`를 사용하세요.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

참고:

- 기존 입력 파일에서 시작할 때는 `image edit`를 사용하세요.
- 참조 이미지 편집에서 지오메트리 힌트를 지원하는 공급자/모델에는 `image edit`와 함께 `--size`, `--aspect-ratio`, 또는 `--resolution`을 사용하세요.
- 투명 배경 OpenAI PNG 출력에는 `--model openai/gpt-image-1.5`와 함께 `--output-format png --background transparent`를 사용하세요. `--openai-background`는 OpenAI 전용 별칭으로 계속 사용할 수 있습니다. 배경 지원을 선언하지 않는 공급자는 해당 힌트를 무시된 재정의로 보고합니다.
- 어떤 번들 이미지 공급자가 검색 가능하고, 구성되어 있으며, 선택되었는지와 각 공급자가 노출하는 생성/편집 기능을 확인하려면 `image providers --json`을 사용하세요.
- 이미지 생성 변경에 대한 가장 좁은 라이브 CLI 스모크로 `image generate --model <provider/model> --json`을 사용하세요. 예:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 응답은 `ok`, `provider`, `model`, `attempts` 및 작성된 출력 경로를 보고합니다. `--output`이 설정된 경우 최종 확장자는 제공자가 반환한 MIME 유형을 따를 수 있습니다.

- `image describe` 및 `image describe-many`의 경우 OCR, 비교, UI 검사 또는 간결한 캡션 작성과 같은 작업별 지시를 비전 모델에 제공하려면 `--prompt`를 사용하세요.
- 느린 로컬 비전 모델이나 콜드 Ollama 시작에는 `--timeout-ms`를 사용하세요.
- `image describe`의 경우 `--model`은 이미지 지원 `<provider/model>`이어야 합니다.
- 로컬 Ollama 비전 모델의 경우 먼저 모델을 가져오고 `OLLAMA_API_KEY`를 임의의 플레이스홀더 값(예: `ollama-local`)으로 설정하세요. [Ollama](/ko/providers/ollama#vision-and-image-description)를 참조하세요.

## 오디오

파일 전사에는 `audio`를 사용하세요.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

참고:

- `audio transcribe`는 실시간 세션 관리가 아니라 파일 전사용입니다.
- `--model`은 `<provider/model>`이어야 합니다.

## TTS

음성 합성과 TTS 제공자 상태에는 `tts`를 사용하세요.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

참고:

- `tts status`는 Gateway에서 관리하는 TTS 상태를 반영하므로 기본값이 Gateway입니다.
- TTS 동작을 검사하고 구성하려면 `tts providers`, `tts voices`, `tts set-provider`를 사용하세요.

## 비디오

생성과 설명에는 `video`를 사용하세요.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

참고:

- `video generate`는 `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, `--timeout-ms`를 허용하며 이를 비디오 생성 런타임으로 전달합니다.
- `video describe`의 경우 `--model`은 `<provider/model>`이어야 합니다.

## 웹

검색 및 가져오기 워크플로에는 `web`을 사용하세요.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

참고:

- 사용 가능하고 구성되었으며 선택된 제공자를 검사하려면 `web providers`를 사용하세요.

## 임베딩

벡터 생성과 임베딩 제공자 검사에는 `embedding`을 사용하세요.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 출력

Infer 명령은 공유 엔벌로프 아래에서 JSON 출력을 정규화합니다.

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

최상위 필드는 안정적입니다.

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

생성된 미디어 명령의 경우 `outputs`에는 OpenClaw가 작성한 파일이 포함됩니다. 사람이 읽을 수 있는 stdout을 파싱하는 대신 자동화에는 해당 배열의 `path`, `mimeType`, `size` 및 미디어별 차원을 사용하세요.

## 흔한 실수

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 참고

- `openclaw capability ...`는 `openclaw infer ...`의 별칭입니다.

## 관련

- [CLI 참조](/ko/cli)
- [모델](/ko/concepts/models)
