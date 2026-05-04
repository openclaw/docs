---
read_when:
    - Bạn muốn dùng tính năng chuyển văn bản thành giọng nói của ElevenLabs trong OpenClaw
    - Bạn muốn dùng ElevenLabs Scribe để chuyển giọng nói thành văn bản cho các tệp đính kèm âm thanh
    - Bạn muốn dùng phiên âm thời gian thực của ElevenLabs cho Cuộc gọi thoại hoặc Google Meet
summary: Sử dụng giọng nói ElevenLabs, Scribe STT và phiên âm theo thời gian thực với OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw sử dụng ElevenLabs để chuyển văn bản thành giọng nói, chuyển giọng nói thành văn bản theo lô với Scribe
v2, và STT phát trực tuyến với Scribe v2 Realtime.

| Khả năng                         | Giao diện OpenClaw                                                  | Mặc định                 |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Chuyển văn bản thành giọng nói   | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio`                                                  | `scribe_v2`              |
| Chuyển giọng nói thành văn bản phát trực tuyến | Phát trực tuyến Voice Call hoặc Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Xác thực

Đặt `ELEVENLABS_API_KEY` trong môi trường. `XI_API_KEY` cũng được chấp nhận để
tương thích với công cụ ElevenLabs hiện có.

```bash
export ELEVENLABS_API_KEY="..."
```

## Chuyển văn bản thành giọng nói

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

Đặt `modelId` thành `eleven_v3` để sử dụng ElevenLabs v3 TTS. OpenClaw giữ
`eleven_multilingual_v2` làm mặc định cho các bản cài đặt hiện có.

## Chuyển giọng nói thành văn bản

Sử dụng Scribe v2 cho tệp âm thanh đính kèm gửi đến và các đoạn thoại ghi âm ngắn:

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

OpenClaw gửi âm thanh multipart tới ElevenLabs `/v1/speech-to-text` với
`model_id: "scribe_v2"`. Gợi ý ngôn ngữ ánh xạ tới `language_code` khi có.

## STT phát trực tuyến

Plugin `elevenlabs` đi kèm đăng ký Scribe v2 Realtime cho bản chép lời phát trực tuyến
ở chế độ tác tử của Voice Call và Google Meet.

| Cài đặt         | Đường dẫn cấu hình                                                     | Mặc định                                          |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Khóa API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Dự phòng về `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Mô hình         | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Định dạng âm thanh | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Tần số lấy mẫu  | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Chiến lược commit | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Ngôn ngữ        | `...elevenlabs.languageCode`                                              | (chưa đặt)                                        |

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
Voice Call nhận phương tiện Twilio dưới dạng G.711 u-law 8 kHz. Nhà cung cấp realtime
ElevenLabs mặc định là `ulaw_8000`, nên các khung thoại điện thoại có thể được chuyển tiếp mà không cần
chuyển mã.
</Note>

Đối với chế độ tác tử Google Meet, đặt
`plugins.entries.google-meet.config.realtime.transcriptionProvider` thành
`"elevenlabs"` và cấu hình cùng một khối nhà cung cấp trong
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Liên quan

- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Google Meet](/vi/plugins/google-meet)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
