---
read_when:
    - Bạn muốn sử dụng tính năng chuyển văn bản thành giọng nói của ElevenLabs trong OpenClaw
    - Bạn muốn sử dụng ElevenLabs Scribe để chuyển giọng nói thành văn bản cho các tệp đính kèm âm thanh
    - Bạn muốn dùng tính năng phiên âm theo thời gian thực của ElevenLabs cho Cuộc gọi thoại
summary: Sử dụng giọng nói của ElevenLabs, Scribe STT và phiên âm theo thời gian thực với OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-29T23:06:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw sử dụng ElevenLabs cho chuyển văn bản thành giọng nói, chuyển giọng nói thành văn bản theo lô với Scribe v2, và STT truyền phát Voice Call với Scribe v2 Realtime.

| Khả năng                 | Bề mặt OpenClaw                               | Mặc định                 |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Chuyển văn bản thành giọng nói | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio`                           | `scribe_v2`              |
| Chuyển giọng nói thành văn bản dạng truyền phát | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

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

Đặt `modelId` thành `eleven_v3` để dùng ElevenLabs v3 TTS. OpenClaw giữ
`eleven_multilingual_v2` làm mặc định cho các bản cài đặt hiện có.

## Chuyển giọng nói thành văn bản

Dùng Scribe v2 cho tệp đính kèm âm thanh đầu vào và các đoạn giọng nói ghi âm ngắn:

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

OpenClaw gửi âm thanh multipart đến ElevenLabs `/v1/speech-to-text` với
`model_id: "scribe_v2"`. Gợi ý ngôn ngữ ánh xạ tới `language_code` khi có.

## STT truyền phát Voice Call

Plugin `elevenlabs` được đóng gói đăng ký Scribe v2 Realtime cho phiên âm truyền phát
Voice Call.

| Cài đặt         | Đường dẫn cấu hình                                                        | Mặc định                                          |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Khóa API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Dự phòng về `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Mô hình         | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Định dạng âm thanh | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Tốc độ lấy mẫu  | `...elevenlabs.sampleRate`                                                | `8000`                                            |
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

## Liên quan

- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
