---
read_when:
    - OpenClaw에서 ElevenLabs 텍스트 음성 변환을 사용하려는 경우
    - 오디오 첨부 파일에 ElevenLabs Scribe 음성-텍스트 변환을 사용하려는 경우
    - Voice Call 또는 Google Meet에서 ElevenLabs 실시간 음성 변환을 사용하려는 경우
summary: OpenClaw에서 ElevenLabs 음성, Scribe STT 및 실시간 음성 변환 사용하기
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T01:10:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw은 텍스트 음성 변환에 ElevenLabs를, Scribe v2를 사용한 일괄 음성 텍스트 변환과 Scribe v2 Realtime을 사용한 스트리밍 STT를 지원합니다. Plugin은 번들로 제공되며 기본적으로 활성화되어 있으므로 `plugins install` 단계가 필요하지 않습니다.

| 기능                     | OpenClaw 제공 표면                                                     | 기본값                   |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------ |
| 텍스트 음성 변환         | `messages.tts` / `talk`                                                | `eleven_multilingual_v2` |
| 일괄 음성 텍스트 변환    | `tools.media.audio`                                                    | `scribe_v2`              |
| 스트리밍 음성 텍스트 변환 | 음성 통화 스트리밍 또는 Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## 인증

환경에 `ELEVENLABS_API_KEY`를 설정합니다. 기존 ElevenLabs 도구와의 호환성을 위해 `XI_API_KEY`도 사용할 수 있습니다.

```bash
export ELEVENLABS_API_KEY="..."
```

## 텍스트 음성 변환

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

ElevenLabs v3 TTS를 사용하려면 `modelId`를 `eleven_v3`으로 설정합니다. OpenClaw은 기존 설치에서 `eleven_multilingual_v2`를 기본값으로 유지합니다.

ElevenLabs가 선택된 `voice.tts`/`messages.tts` 제공자인 경우 Discord 음성 채널은 ElevenLabs의 스트리밍 TTS 엔드포인트를 사용합니다. OpenClaw이 전체 오디오 파일을 먼저 다운로드할 때까지 기다리지 않고 반환된 오디오 스트림에서 재생을 시작합니다. `latencyTier`는 이를 지원하는 모델에서 ElevenLabs의 `optimize_streaming_latency` 쿼리 매개변수에 매핑됩니다. OpenClaw은 이 매개변수를 거부하는 `eleven_v3`에는 해당 매개변수를 생략합니다.

## 음성 텍스트 변환

수신 오디오 첨부 파일과 짧게 녹음된 음성 구간에는 Scribe v2를 사용합니다.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw은 `model_id: "scribe_v2"`와 함께 멀티파트 오디오를 ElevenLabs `/v1/speech-to-text`로 전송합니다. 언어 힌트가 있는 경우 `language_code`에 매핑됩니다.

## 스트리밍 STT

번들로 제공되는 `elevenlabs` Plugin은 음성 통화 및 Google Meet 에이전트 모드 스트리밍 전사를 위해 Scribe v2 Realtime을 등록합니다.

| 설정            | 구성 경로                                                                 | 기본값                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| API 키          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY`로 대체       |
| 모델            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                             |
| 오디오 형식     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                      |
| 샘플링 속도     | `...elevenlabs.sampleRate`                                                | `8000`                                           |
| 커밋 전략       | `...elevenlabs.commitStrategy`                                            | `vad`                                            |
| 언어            | `...elevenlabs.languageCode`                                              | (설정되지 않음)                                  |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
음성 통화는 Twilio 미디어를 8kHz G.711 u-law 형식으로 수신합니다. ElevenLabs 실시간 제공자의 기본값은 `ulaw_8000`이므로 전화 통신 프레임을 트랜스코딩 없이 전달할 수 있습니다.
</Note>

Google Meet 에이전트 모드에서는 `plugins.entries.google-meet.config.realtime.transcriptionProvider`를 `"elevenlabs"`로 설정하고 `plugins.entries.google-meet.config.realtime.providers.elevenlabs` 아래에 동일한 제공자 블록을 구성합니다.

## 관련 문서

- [텍스트 음성 변환](/ko/tools/tts)
- [Google Meet](/ko/plugins/google-meet)
- [모델 선택](/ko/concepts/model-providers)
