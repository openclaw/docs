---
read_when:
    - Bạn muốn sử dụng tính năng chuyển văn bản thành giọng nói của ElevenLabs trong OpenClaw
    - Bạn muốn dùng tính năng chuyển giọng nói thành văn bản ElevenLabs Scribe cho tệp đính kèm âm thanh
    - Bạn muốn dùng tính năng phiên âm theo thời gian thực của ElevenLabs cho Cuộc gọi thoại hoặc Google Meet
summary: Sử dụng giọng nói ElevenLabs, Scribe STT và phiên âm thời gian thực với OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:24:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw sử dụng ElevenLabs để chuyển văn bản thành giọng nói, chuyển giọng nói thành văn bản theo lô bằng Scribe
v2, và STT truyền phát bằng Scribe v2 Realtime.

| Khả năng                                  | Bề mặt OpenClaw                                                     | Mặc định                 |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------ |
| Chuyển văn bản thành giọng nói            | `messages.tts` / `talk`                                             | `eleven_multilingual_v2` |
| Chuyển giọng nói thành văn bản theo lô    | `tools.media.audio`                                                 | `scribe_v2`              |
| Chuyển giọng nói thành văn bản truyền phát | truyền phát Voice Call hoặc Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

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

Các kênh thoại Discord dùng điểm cuối TTS truyền phát của ElevenLabs khi ElevenLabs là
nhà cung cấp `voice.tts`/`messages.tts` được chọn. Việc phát bắt đầu từ luồng âm thanh
được trả về thay vì chờ OpenClaw tải xuống và ghi toàn bộ tệp âm thanh trước.
`latencyTier` ánh xạ tới tham số truy vấn `optimize_streaming_latency` của ElevenLabs
đối với các mô hình chấp nhận tham số đó; OpenClaw bỏ qua tham số đó cho `eleven_v3`,
vì mô hình này từ chối tham số đó.

## Chuyển giọng nói thành văn bản

Dùng Scribe v2 cho tệp đính kèm âm thanh đầu vào và các đoạn thoại ngắn đã ghi:

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

## STT truyền phát

Plugin `elevenlabs` được đóng gói đăng ký Scribe v2 Realtime cho Voice Call và
phiên âm truyền phát ở chế độ tác nhân của Google Meet.

| Thiết lập        | Đường dẫn cấu hình                                                     | Mặc định                                          |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| Khóa API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Dự phòng về `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Mô hình          | `...elevenlabs.modelId`                                                | `scribe_v2_realtime`                              |
| Định dạng âm thanh | `...elevenlabs.audioFormat`                                          | `ulaw_8000`                                       |
| Tần số lấy mẫu   | `...elevenlabs.sampleRate`                                             | `8000`                                            |
| Chiến lược commit | `...elevenlabs.commitStrategy`                                        | `vad`                                             |
| Ngôn ngữ         | `...elevenlabs.languageCode`                                           | (chưa đặt)                                        |

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
của ElevenLabs mặc định là `ulaw_8000`, nên các khung thoại có thể được chuyển tiếp mà không
cần chuyển mã.
</Note>

Đối với chế độ tác nhân Google Meet, đặt
`plugins.entries.google-meet.config.realtime.transcriptionProvider` thành
`"elevenlabs"` và cấu hình cùng khối nhà cung cấp dưới
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Liên quan

- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Google Meet](/vi/plugins/google-meet)
- [Chọn mô hình](/vi/concepts/model-providers)
