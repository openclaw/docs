---
read_when:
    - 오디오 전사 또는 미디어 처리 변경하기
summary: 수신 오디오/음성 메모가 다운로드되고 전사되어 답장에 삽입되는 방식
title: 오디오 및 음성 메모
x-i18n:
    generated_at: "2026-05-06T17:58:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## 작동하는 기능

- **미디어 이해(오디오)**: 오디오 이해가 활성화되어 있거나 자동 감지되면 OpenClaw는:
  1. 첫 번째 오디오 첨부 파일(로컬 경로 또는 URL)을 찾고 필요하면 다운로드합니다.
  2. 각 모델 항목으로 보내기 전에 `maxBytes`를 적용합니다.
  3. 순서대로 첫 번째 사용 가능한 모델 항목(프로바이더 또는 CLI)을 실행합니다.
  4. 실패하거나 건너뛰면(크기/시간 초과) 다음 항목을 시도합니다.
  5. 성공하면 `Body`를 `[Audio]` 블록으로 바꾸고 `{{Transcript}}`를 설정합니다.
- **명령 파싱**: 전사가 성공하면 슬래시 명령이 계속 작동하도록 `CommandBody`/`RawBody`가 전사문으로 설정됩니다.
- **자세한 로깅**: `--verbose`에서는 전사가 실행될 때와 본문을 대체할 때 로그를 남깁니다.

## 자동 감지(기본값)

**모델을 구성하지 않았고** `tools.media.audio.enabled`가 `false`로 설정되어 **있지 않으면**,
OpenClaw는 다음 순서로 자동 감지하며 첫 번째로 작동하는 옵션에서 중단합니다.

1. 프로바이더가 오디오 이해를 지원하는 경우 **활성 응답 모델**
2. **로컬 CLI**(설치된 경우)
   - `sherpa-onnx-offline`(encoder/decoder/joiner/tokens가 있는 `SHERPA_ONNX_MODEL_DIR` 필요)
   - `whisper-cli`(`whisper-cpp` 제공, `WHISPER_CPP_MODEL` 또는 번들 tiny 모델 사용)
   - `whisper`(Python CLI, 모델을 자동으로 다운로드)
3. `read_many_files`를 사용하는 **Gemini CLI**(`gemini`)
4. **프로바이더 인증**
   - 오디오를 지원하는 구성된 `models.providers.*` 항목을 먼저 시도합니다
   - 번들 fallback 순서: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

자동 감지를 비활성화하려면 `tools.media.audio.enabled: false`를 설정하세요.
사용자 지정하려면 `tools.media.audio.models`를 설정하세요.
참고: 바이너리 감지는 macOS/Linux/Windows 전반에서 최선의 방식으로 수행됩니다. CLI가 `PATH`에 있는지 확인하거나(`~`를 확장함), 전체 명령 경로가 포함된 명시적 CLI 모델을 설정하세요.

## 구성 예시

### 프로바이더 + CLI fallback(OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### 범위 게이팅이 있는 프로바이더 전용

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### 프로바이더 전용(Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### 프로바이더 전용(Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### 프로바이더 전용(SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### 채팅에 전사문 에코(선택 사항)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 참고 및 제한 사항

- 프로바이더 인증은 표준 모델 인증 순서(인증 프로필, 환경 변수, `models.providers.*.apiKey`)를 따릅니다.
- Groq 설정 세부 정보: [Groq](/ko/providers/groq).
- `provider: "deepgram"`을 사용할 때 Deepgram은 `DEEPGRAM_API_KEY`를 가져옵니다.
- Deepgram 설정 세부 정보: [Deepgram(오디오 전사)](/ko/providers/deepgram).
- Mistral 설정 세부 정보: [Mistral](/ko/providers/mistral).
- `provider: "senseaudio"`를 사용할 때 SenseAudio는 `SENSEAUDIO_API_KEY`를 가져옵니다.
- SenseAudio 설정 세부 정보: [SenseAudio](/ko/providers/senseaudio).
- 오디오 프로바이더는 `tools.media.audio`를 통해 `baseUrl`, `headers`, `providerOptions`를 재정의할 수 있습니다.
- 기본 크기 제한은 20MB(`tools.media.audio.maxBytes`)입니다. 크기를 초과하는 오디오는 해당 모델에서 건너뛰고 다음 항목을 시도합니다.
- 1024바이트 미만의 작거나 빈 오디오 파일은 프로바이더/CLI 전사 전에 건너뜁니다.
- 오디오의 기본 `maxChars`는 **설정되지 않음**(전체 전사문)입니다. 출력을 자르려면 `tools.media.audio.maxChars` 또는 항목별 `maxChars`를 설정하세요.
- OpenAI 자동 기본값은 `gpt-4o-mini-transcribe`입니다. 더 높은 정확도를 원하면 `model: "gpt-4o-transcribe"`를 설정하세요.
- 여러 음성 메모를 처리하려면 `tools.media.audio.attachments`를 사용하세요(`mode: "all"` + `maxAttachments`).
- 전사문은 템플릿에서 `{{Transcript}}`로 사용할 수 있습니다.
- `tools.media.audio.echoTranscript`는 기본적으로 꺼져 있습니다. 에이전트 처리 전에 원래 채팅으로 전사 확인을 보내려면 활성화하세요.
- `tools.media.audio.echoFormat`은 에코 텍스트를 사용자 지정합니다(placeholder: `{transcript}`).
- CLI stdout은 제한됩니다(5MB). CLI 출력을 간결하게 유지하세요.
- CLI `args`는 로컬 오디오 파일 경로에 `{{MediaPath}}`를 사용해야 합니다. 이전 `audio.transcription.command` 구성의 더 이상 사용되지 않는 `{input}` placeholder를 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요.

### 프록시 환경 지원

프로바이더 기반 오디오 전사는 표준 outbound 프록시 환경 변수를 따릅니다.

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

프록시 환경 변수가 설정되어 있지 않으면 직접 egress가 사용됩니다. 프록시 구성이 잘못된 형식이면 OpenClaw가 경고를 로그에 남기고 direct fetch로 fallback합니다.

## 그룹의 멘션 감지

그룹 채팅에 `requireMention: true`가 설정된 경우, OpenClaw는 이제 멘션을 확인하기 **전에** 오디오를 전사합니다. 이를 통해 음성 메모에 멘션이 포함되어 있어도 처리할 수 있습니다.

**작동 방식:**

1. 음성 메시지에 텍스트 본문이 없고 그룹에서 멘션이 필요한 경우, OpenClaw는 "preflight" 전사를 수행합니다.
2. 전사문에서 멘션 패턴(예: `@BotName`, 이모지 트리거)을 확인합니다.
3. 멘션이 발견되면 메시지는 전체 응답 pipeline을 진행합니다.
4. 음성 메모가 멘션 게이트를 통과할 수 있도록 전사문이 멘션 감지에 사용됩니다.

**Fallback 동작:**

- preflight 중 전사가 실패하면(시간 초과, API 오류 등) 메시지는 텍스트 전용 멘션 감지를 기준으로 처리됩니다.
- 이렇게 하면 혼합 메시지(텍스트 + 오디오)가 잘못 삭제되지 않습니다.

**Telegram 그룹/topic별 옵트아웃:**

- 해당 그룹의 preflight 전사문 멘션 확인을 건너뛰려면 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`를 설정하세요.
- topic별로 재정의하려면 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`를 설정하세요(`true`는 건너뛰기, `false`는 강제 활성화).
- 기본값은 `false`입니다(멘션 게이트 조건이 일치하면 preflight 활성화).

**예시:** 한 사용자가 `requireMention: true`가 설정된 Telegram 그룹에서 "Hey @Claude, what's the weather?"라고 말하는 음성 메모를 보냅니다. 음성 메모가 전사되고, 멘션이 감지되며, 에이전트가 응답합니다.

## 주의 사항

- 범위 규칙은 첫 번째 일치 항목이 우선합니다. `chatType`은 `direct`, `group`, `room`으로 정규화됩니다.
- CLI가 0으로 종료되고 일반 텍스트를 출력하는지 확인하세요. JSON은 `jq -r .text`를 통해 가공해야 합니다.
- `parakeet-mlx`의 경우 `--output-dir`를 전달하면, `--output-format`이 `txt`이거나 생략되었을 때 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 출력 형식은 stdout 파싱으로 fallback합니다.
- 응답 큐가 차단되지 않도록 시간 초과(`timeoutSeconds`, 기본값 60초)를 합리적으로 유지하세요.
- preflight 전사는 멘션 감지를 위해 **첫 번째** 오디오 첨부 파일만 처리합니다. 추가 오디오는 기본 미디어 이해 단계에서 처리됩니다.

## 관련 항목

- [미디어 이해](/ko/nodes/media-understanding)
- [대화 모드](/ko/nodes/talk)
- [음성 wake](/ko/nodes/voicewake)
