---
read_when:
    - 오디오 전사 또는 미디어 처리 변경하기
summary: 수신 오디오/음성 메모가 다운로드되고, 텍스트로 변환되어, 답변에 삽입되는 방식
title: 오디오 및 음성 메모
x-i18n:
    generated_at: "2026-07-12T00:55:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## 기능

오디오 이해가 활성화되었거나 자동 감지되면 OpenClaw는 다음을 수행합니다.

1. 첫 번째 오디오 첨부 파일(로컬 경로 또는 URL)을 찾고, 필요한 경우 다운로드합니다.
2. 각 모델 항목으로 보내기 전에 `maxBytes`를 적용합니다.
3. 순서대로 사용 가능한 첫 번째 모델 항목(제공자 또는 CLI)을 실행합니다. 항목이 실패하거나 건너뛰어지면(크기/시간 초과) 다음 항목을 시도합니다.
4. 성공하면 `Body`를 `[Audio]` 블록으로 바꾸고 `{{Transcript}}`를 설정합니다.

트랜스크립션에 성공하면 슬래시 명령이 계속 작동하도록 `CommandBody`/`RawBody`도 트랜스크립트로 설정됩니다. `--verbose`를 사용하면 트랜스크립션이 실행되는 시점과 본문을 대체하는 시점이 로그에 표시됩니다.

## 자동 감지(기본값)

모델을 구성하지 않았고 `tools.media.audio.enabled`가 `false`가 아니면 OpenClaw는 다음 순서로 자동 감지하며, 처음으로 작동하는 옵션에서 중지합니다.

1. 제공자가 오디오 이해를 지원하는 경우 **활성 응답 모델**.
2. **구성된 제공자 인증** — 오디오 트랜스크립션을 지원하며 인증을 사용할 수 있는 제공자의 모든 `models.providers.*` 항목. 로컬 CLI보다 먼저 확인되므로 구성된 API 키는 항상 `PATH`의 로컬 바이너리보다 우선합니다.
   여러 제공자가 구성된 경우의 우선순위: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **로컬 CLI**(제공자 인증이 확인되지 않은 경우에만). OpenClaw는 다음과 같이 순서가 지정된 폴백 목록을 구성합니다.
   - 현재 프로세스에서 이전 모델 호출이 Metal 또는 CUDA를 감지한 경우에만 CPU 기본값보다 앞에 오는 `whisper-cli`
   - 기본 CPU 제공자의 `sherpa-onnx-offline`(`tokens.txt`, `encoder.onnx`, `decoder.onnx`, `joiner.onnx`가 포함된 `SHERPA_ONNX_MODEL_DIR` 필요)
   - Metal/CUDA가 빌드만 가능한 상태이거나 선택된 백엔드가 달리 감지되지 않은 경우의 `whisper-cli`
   - Apple Silicon의 `parakeet-mlx`(MLX 지원, 장치 사용 여부는 감지되지 않은 상태로 유지)
   - `whisper`(Python CLI, 모델 자동 다운로드)

설치/링크 출처는 기능을 뒷받침하는 증거이지 실행 증거가 아닙니다. 그 자체만으로 후보를 CPU sherpa보다 앞당기지는 않습니다. OpenClaw는 백엔드를 탐지하기 위해 설정 또는 상태 확인 중에 모델을 로드하지 않습니다.
자동 감지된 whisper.cpp는 OpenClaw가 업스트림의 `using … backend` 줄을 기록할 수 있도록 일반적인 모델 실행 로그를 활성화한 상태로 유지합니다. 명시적 CLI 항목은 구성된 출력 플래그를 유지합니다.

미디어 이해를 위한 Gemini CLI 자동 감지는 이미지/동영상용 샌드박스 Antigravity CLI(`agy`) 폴백으로 대체되었습니다. 오디오는 위의 로컬 바이너리 외에는 CLI 폴백을 사용하지 않습니다.

자동 감지를 비활성화하려면 `tools.media.audio.enabled: false`를 설정하세요. 사용자 지정하려면 `tools.media.audio.models`를 설정하세요.

<Note>
바이너리 감지는 macOS/Linux/Windows에서 최선형 방식으로 수행됩니다. CLI가 `PATH`에 있는지 확인하거나(`~`는 확장됨), 전체 명령 경로를 사용하는 명시적 CLI 모델을 설정하세요.
</Note>

오디오를 트랜스크립션하지 않고 로컬 선택 항목을 검사하려면 다음을 실행하세요.

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

제공자 인벤토리는 전역 제공자 선택과 별도로 로컬 폴백의 최종 선택 항목을 보고하며, 지원 가능, 요청됨, 감지됨 백엔드 필드도 함께 표시합니다. 트랜스크립션 실행 후 `/status`는 미디어 줄에 요청되었거나 감지된 백엔드를 표시합니다. 명시적 `tools.media.audio.models` CLI 항목은 여전히 자동 선택을 우회합니다. sherpa의 `--provider=cuda` 또는 whisper.cpp의 `--no-gpu`/`--device`와 같은 백엔드별 플래그를 사용하세요.

## 구성 예시

### 제공자 + CLI 폴백(OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
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

### 범위 제한을 사용하는 제공자 전용 구성

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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

### 제공자 전용(Deepgram)

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

### 제공자 전용(Mistral Voxtral)

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

### 제공자 전용(SenseAudio)

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

### 트랜스크립트를 채팅에 다시 전송(선택적 활성화)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // 기본값은 false
        echoFormat: '📝 "{transcript}"', // 선택 사항, {transcript} 지원
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## 참고 사항 및 제한

- 제공자 인증은 표준 모델 인증 순서(인증 프로필, 환경 변수, `models.providers.*.apiKey`)를 따릅니다.
- Groq 설정 세부 정보: [Groq](/ko/providers/groq).
- `provider: "deepgram"`을 사용하면 Deepgram은 `DEEPGRAM_API_KEY`를 사용합니다. 설정 세부 정보: [Deepgram](/ko/providers/deepgram).
- Mistral 설정 세부 정보: [Mistral](/ko/providers/mistral).
- `provider: "senseaudio"`를 사용하면 SenseAudio는 `SENSEAUDIO_API_KEY`를 사용합니다. 설정 세부 정보: [SenseAudio](/ko/providers/senseaudio).
- 오디오 제공자는 `tools.media.audio`를 통해 `baseUrl`, `headers`, `providerOptions`를 재정의할 수 있습니다.
- 기본 크기 제한은 20MB(`tools.media.audio.maxBytes`)입니다. 크기 제한을 초과한 오디오는 해당 모델에서 건너뛰고 다음 항목을 시도합니다.
- 1024바이트 미만의 오디오 파일은 제공자/CLI 트랜스크립션 전에 건너뜁니다.
- 오디오의 기본 `maxChars`는 **설정되지 않음**(전체 트랜스크립트)입니다. 출력을 잘라내려면 `tools.media.audio.maxChars` 또는 항목별 `maxChars`를 설정하세요.
- OpenAI 자동 감지 기본값은 `gpt-4o-transcribe`입니다. 더 저렴하고 빠른 옵션을 사용하려면 `model: "gpt-4o-mini-transcribe"`를 설정하세요.
- 여러 음성 메모를 처리하려면 `tools.media.audio.attachments`를 사용하세요(`mode: "all"`과 `maxAttachments`, 기본값 1).
- 트랜스크립트는 템플릿에서 `{{Transcript}}`로 사용할 수 있습니다.
- `tools.media.audio.echoTranscript`는 기본적으로 꺼져 있습니다. 에이전트 처리 전에 원래 채팅으로 트랜스크립트 확인 메시지를 보내려면 활성화하세요.
- `tools.media.audio.echoFormat`은 다시 전송할 텍스트를 사용자 지정합니다(자리표시자: `{transcript}`, 기본값 `📝 "{transcript}"`).
- CLI 표준 출력은 5MB로 제한됩니다. CLI 출력을 간결하게 유지하세요.
- CLI `args`는 로컬 오디오 파일 경로에 `{{MediaPath}}`를 사용해야 합니다. 이전 `audio.transcription.command` 구성의 폐기된 `{input}` 자리표시자를 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요(폐기된 키: `audio.transcription`, `tools.media.audio.models`로 대체됨).
- `tools.media.concurrency`는 미디어 작업 수를 제한하며 GPU 스케줄러가 아닙니다.

### 상주형 로컬 STT

자동 감지된 로컬 STT는 요청별 프로세스 방식으로 유지됩니다. 표준 Homebrew `whisper-cpp` 패키지가 해당 서버를 비활성화하고 업스트림 예제에는 구성된 제한형 수락 대기열이 없으므로 OpenClaw는 현재 상주형 whisper.cpp 서버를 관리하지 않습니다. Plugin 소유의 상주형 수명 주기를 안전하게 활성화하려면 상태 점검/시작, 모델 상주, 제한형 대기열 처리, 취소/시간 초과, 인증 없는 local loopback 전용 운영, 클라우드 폴백 없음 기능을 갖춘 유지 관리되는 패키지형 작업자가 필요합니다.

### 프록시 환경 지원

제공자 기반 오디오 트랜스크립션은 undici의 `EnvHttpProxyAgent` 의미 체계에 맞춰 표준 아웃바운드 프록시 환경 변수를 따릅니다.

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

소문자 변수가 대문자보다 우선합니다. `NO_PROXY`/`no_proxy` 항목(호스트 이름, `*.suffix` 또는 `host:port`)은 프록시를 우회합니다. 프록시 환경 변수가 설정되지 않으면 직접 외부 연결을 사용합니다. 프록시 설정이 실패하면(잘못된 URL) OpenClaw는 경고를 기록하고 직접 가져오기로 폴백합니다.

## 그룹에서 멘션 감지

오디오 사전 검사를 지원하는 채널에서 그룹 채팅에 `requireMention: true`가 설정된 경우 OpenClaw는 멘션을 확인하기 **전에** 오디오를 트랜스크립션합니다. 이를 통해 캡션 없는 음성 메모의 트랜스크립트에 구성된 멘션 패턴이 포함되어 있으면 멘션 관문을 통과할 수 있습니다. 입력된 멘션이 필요한 전송 방식은 채널별 문서에 설명되어 있습니다.

**작동 방식:**

1. 음성 메시지에 텍스트 본문이 없고 그룹에서 멘션을 요구하면 OpenClaw는 첫 번째 오디오 첨부 파일을 사전 트랜스크립션합니다.
2. 트랜스크립트에서 멘션 패턴(예: `@BotName`, 이모지 트리거)을 확인합니다.
3. 멘션이 발견되면 메시지가 전체 응답 파이프라인을 진행합니다.

**폴백 동작:** 사전 트랜스크립션이 실패하면(시간 초과, API 오류 등) 메시지는 텍스트 전용 멘션 감지로 폴백하므로 혼합 메시지(텍스트 + 오디오)가 누락되지 않습니다.

**Telegram 그룹/주제별 비활성화:**

- 해당 그룹에서 사전 트랜스크립트 멘션 확인을 건너뛰려면 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`를 설정하세요.
- 주제별로 재정의하려면 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`를 설정하세요(`true`는 건너뛰기, `false`는 강제 활성화).
- 기본값은 `false`입니다(멘션 제한 조건과 일치하면 사전 검사 활성화).

**예시:** 사용자가 `requireMention: true`인 Telegram 그룹에서 "안녕 @Claude, 날씨가 어때?"라고 말하는 음성 메모를 보냅니다. 음성 메모가 트랜스크립션되고 멘션이 감지되면 에이전트가 응답합니다.

## 주의 사항

- 범위 규칙은 처음 일치하는 항목이 우선합니다. `chatType`은 `direct`, `group`, `channel` 중 하나로 정규화됩니다.
- CLI가 종료 코드 0으로 종료되고 일반 텍스트를 출력하는지 확인하세요. JSON 출력은 `jq -r .text`를 통해 가공해야 합니다.
- 알려진 파일 출력 모드가 최종 기준입니다. 추론된 트랜스크립트 파일이 비어 있거나 없으면 CLI 진행률 출력으로 폴백하지 않고 트랜스크립트를 생성하지 않습니다.
- `parakeet-mlx`에서는 `--output-dir` 및 기본 `{filename}` 출력 템플릿과 함께 `--output-format txt`(또는 `all`)를 사용하세요. 업스트림의 `PARAKEET_OUTPUT_FORMAT` 및 `PARAKEET_OUTPUT_TEMPLATE` 환경 변수도 적용됩니다. OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. 기본 `srt` 형식, 기타 형식 및 사용자 지정 출력 템플릿은 계속 표준 출력을 사용합니다.
- 응답 대기열이 차단되지 않도록 시간 초과를 적절하게 유지하세요(`timeoutSeconds`, 기본값 60초).
- 사전 트랜스크립션은 멘션 감지를 위해 **첫 번째** 오디오 첨부 파일만 처리합니다. 추가 오디오 첨부 파일은 기본 미디어 이해 단계에서 처리됩니다.

## 관련 문서

- [미디어 이해](/ko/nodes/media-understanding)
- [대화 모드](/ko/nodes/talk)
- [음성 호출](/ko/nodes/voicewake)
