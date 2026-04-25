---
read_when:
    - '`openclaw infer` 명령 추가 또는 수정하기'
    - 안정적인 헤드리스 capability 자동화 설계하기
summary: provider 기반 모델, 이미지, 오디오, TTS, 비디오, 웹, 임베딩 워크플로를 위한 추론 우선 CLI
title: 추론 CLI
x-i18n:
    generated_at: "2026-04-25T05:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2127deec34c5cf8431035c6cc02fc4acb35e4a107f70de0c7654fe4806c0d43
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer`는 provider 기반 추론 워크플로를 위한 표준 헤드리스 표면입니다.

이는 의도적으로 원시 gateway RPC 이름이나 원시 에이전트 도구 id가 아니라 capability 계열을 노출합니다.

## infer를 skill로 만들기

다음을 에이전트에 복사해 붙여넣으세요.

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

좋은 infer 기반 skill은 다음을 충족해야 합니다.

- 일반적인 사용자 의도를 올바른 infer 하위 명령으로 매핑
- 다루는 워크플로에 대한 몇 가지 표준 infer 예시 포함
- 예시와 제안에서 `openclaw infer ...`를 우선 사용
- skill 본문 안에서 전체 infer 표면을 다시 문서화하지 않음

일반적인 infer 중심 skill 범위:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## infer를 사용하는 이유

`openclaw infer`는 OpenClaw 내부의 provider 기반 추론 작업을 위한 일관된 하나의 CLI를 제공합니다.

장점:

- 각 백엔드마다 일회성 래퍼를 연결하는 대신 OpenClaw에 이미 구성된 provider와 모델을 사용합니다.
- 모델, 이미지, 오디오 전사, TTS, 비디오, 웹, 임베딩 워크플로를 하나의 명령 트리 아래에 유지합니다.
- 스크립트, 자동화, 에이전트 기반 워크플로에 안정적인 `--json` 출력 형식을 사용합니다.
- 작업의 본질이 "추론 실행"일 때 first-party OpenClaw 표면을 우선 사용합니다.
- 대부분의 infer 명령에서 gateway 없이 일반 로컬 경로를 사용할 수 있습니다.

엔드투엔드 provider 검사에는 하위 수준
provider 테스트가 정상인 경우 `openclaw infer ...`를 우선 사용하세요. 이는 provider 요청이 이루어지기 전에 배포된 CLI, config 로딩,
기본 에이전트 확인, 번들 plugin 활성화, 런타임 의존성 복구,
공유 capability 런타임을 실행합니다.

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

| 작업                    | 명령                                                                 | 참고                                                  |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| 텍스트/모델 프롬프트 실행 | `openclaw infer model run --prompt "..." --json`                     | 기본적으로 일반 로컬 경로를 사용합니다                |
| 이미지 생성             | `openclaw infer image generate --prompt "..." --json`                | 기존 파일에서 시작할 때는 `image edit`를 사용하세요   |
| 이미지 파일 설명        | `openclaw infer image describe --file ./image.png --json`            | `--model`은 이미지 지원 `<provider/model>`이어야 합니다 |
| 오디오 전사             | `openclaw infer audio transcribe --file ./memo.m4a --json`           | `--model`은 `<provider/model>`이어야 합니다           |
| 음성 합성               | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status`는 gateway 지향적입니다                 |
| 비디오 생성             | `openclaw infer video generate --prompt "..." --json`                |                                                       |
| 비디오 파일 설명        | `openclaw infer video describe --file ./clip.mp4 --json`             | `--model`은 `<provider/model>`이어야 합니다           |
| 웹 검색                 | `openclaw infer web search --query "..." --json`                     |                                                       |
| 웹 페이지 가져오기      | `openclaw infer web fetch --url https://example.com --json`          |                                                       |
| 임베딩 생성             | `openclaw infer embedding create --text "..." --json`                |                                                       |

## 동작

- `openclaw infer ...`는 이러한 워크플로를 위한 기본 CLI 표면입니다.
- 출력이 다른 명령이나 스크립트에서 소비될 경우 `--json`을 사용하세요.
- 특정 백엔드가 필요할 경우 `--provider` 또는 `--model provider/model`을 사용하세요.
- `image describe`, `audio transcribe`, `video describe`의 경우 `--model`은 반드시 `<provider/model>` 형식을 사용해야 합니다.
- `image describe`에서 명시적인 `--model`은 해당 provider/model을 직접 실행합니다. 모델은 모델 카탈로그 또는 provider config에서 이미지 지원 가능해야 합니다. `codex/<model>`은 제한된 Codex app-server 이미지 이해 턴을 실행하고, `openai-codex/<model>`은 OpenAI Codex OAuth provider 경로를 사용합니다.
- 상태 비저장 실행 명령은 기본적으로 local입니다.
- gateway 관리 상태 명령은 기본적으로 gateway입니다.
- 일반 로컬 경로는 gateway 실행을 요구하지 않습니다.

## Model

provider 기반 텍스트 추론 및 모델/provider 검사는 `model`을 사용하세요.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

참고:

- `model run`은 에이전트 런타임을 재사용하므로 provider/model 재정의가 일반 에이전트 실행처럼 동작합니다.
- `model auth login`, `model auth logout`, `model auth status`는 저장된 provider 인증 상태를 관리합니다.

## Image

생성, 편집, 설명에는 `image`를 사용하세요.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

참고:

- 기존 입력 파일에서 시작할 때는 `image edit`를 사용하세요.
- `image providers --json`을 사용해 어떤 번들 이미지 provider를
  검색할 수 있는지, 구성되었는지, 선택되었는지, 그리고 각 provider가 어떤 생성/편집 capability를
  노출하는지 확인하세요.
- 이미지 생성 변경에 대한 가장 좁은 범위의 실시간
  CLI 스모크 테스트로 `image generate --model <provider/model> --json`을 사용하세요. 예:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 응답은 `ok`, `provider`, `model`, `attempts`, 기록된
  출력 경로를 보고합니다. `--output`이 설정된 경우 최종 확장자는
  provider가 반환한 MIME type을 따를 수 있습니다.

- `image describe`에서 `--model`은 이미지 지원 `<provider/model>`이어야 합니다.
- 로컬 Ollama 비전 모델의 경우 먼저 모델을 pull하고 `OLLAMA_API_KEY`를 임의의 플레이스홀더 값(예: `ollama-local`)으로 설정하세요. [Ollama](/ko/providers/ollama#vision-and-image-description)를 참고하세요.

## Audio

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

음성 합성과 TTS provider 상태에는 `tts`를 사용하세요.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

참고:

- `tts status`는 gateway가 관리하는 TTS 상태를 반영하므로 기본적으로 gateway를 사용합니다.
- `tts providers`, `tts voices`, `tts set-provider`를 사용해 TTS 동작을 검사하고 구성하세요.

## Video

생성과 설명에는 `video`를 사용하세요.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

참고:

- `video describe`에서 `--model`은 `<provider/model>`이어야 합니다.

## Web

검색 및 가져오기 워크플로에는 `web`을 사용하세요.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

참고:

- 사용 가능하고, 구성되었고, 선택된 provider를 확인하려면 `web providers`를 사용하세요.

## Embedding

벡터 생성 및 임베딩 provider 검사에는 `embedding`을 사용하세요.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 출력

Infer 명령은 공유 envelope 아래에서 JSON 출력을 정규화합니다.

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

생성된 미디어 명령의 경우 `outputs`에는 OpenClaw가 기록한 파일이 포함됩니다.
자동화에서는 사람이 읽는 stdout을 파싱하는 대신
그 배열의 `path`, `mimeType`, `size`, 그리고 미디어별 치수를 사용하세요.

## 일반적인 함정

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

- `openclaw capability ...`는 `openclaw infer ...`의 alias입니다.

## 관련

- [CLI reference](/ko/cli)
- [Models](/ko/concepts/models)
