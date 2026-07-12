---
read_when:
    - Bạn muốn sử dụng tính năng chuyển văn bản thành giọng nói của ElevenLabs trong OpenClaw
    - Bạn muốn sử dụng tính năng chuyển giọng nói thành văn bản ElevenLabs Scribe cho các tệp âm thanh đính kèm
    - Bạn muốn sử dụng tính năng phiên âm theo thời gian thực của ElevenLabs cho Voice Call hoặc Google Meet
summary: Sử dụng giọng nói ElevenLabs, Scribe STT và tính năng phiên âm theo thời gian thực với OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T08:20:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw sử dụng ElevenLabs để chuyển văn bản thành giọng nói, chuyển giọng nói thành văn bản theo lô bằng Scribe
v2 và STT phát trực tuyến bằng Scribe v2 Realtime. Plugin này được đóng gói kèm và
bật theo mặc định; không cần thực hiện bước `plugins install`.

| Khả năng                         | Bề mặt OpenClaw                                                      | Mặc định                 |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Chuyển văn bản thành giọng nói   | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Chuyển giọng nói thành văn bản theo lô | `tools.media.audio`                                             | `scribe_v2`              |
| Chuyển giọng nói thành văn bản phát trực tuyến | Phát trực tuyến Voice Call hoặc `realtime.transcriptionProvider` của Google Meet | `scribe_v2_realtime`     |

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

Đặt `modelId` thành `eleven_v3` để sử dụng TTS v3 của ElevenLabs. OpenClaw giữ
`eleven_multilingual_v2` làm mặc định cho các bản cài đặt hiện có.

Các kênh thoại Discord sử dụng điểm cuối TTS phát trực tuyến của ElevenLabs khi ElevenLabs
là nhà cung cấp `voice.tts`/`messages.tts` được chọn: quá trình phát bắt đầu từ
luồng âm thanh được trả về thay vì chờ OpenClaw tải xuống toàn bộ
tệp âm thanh trước. `latencyTier` ánh xạ tới tham số truy vấn `optimize_streaming_latency`
của ElevenLabs đối với các mô hình chấp nhận tham số này; OpenClaw bỏ qua tham số đó đối với
`eleven_v3`, vì mô hình này từ chối tham số đó.

## Chuyển giọng nói thành văn bản

Sử dụng Scribe v2 cho các tệp âm thanh đính kèm đến và các đoạn thoại ngắn đã ghi:

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

OpenClaw gửi âm thanh nhiều phần tới `/v1/speech-to-text` của ElevenLabs với
`model_id: "scribe_v2"`. Gợi ý ngôn ngữ ánh xạ tới `language_code` khi có.

## STT phát trực tuyến

Plugin `elevenlabs` được đóng gói kèm đăng ký Scribe v2 Realtime cho Voice Call và
tính năng phiên âm phát trực tuyến ở chế độ tác nhân của Google Meet.

| Cài đặt          | Đường dẫn cấu hình                                                        | Mặc định                                          |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Khóa API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Dùng `ELEVENLABS_API_KEY` / `XI_API_KEY` làm phương án dự phòng |
| Mô hình          | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Định dạng âm thanh | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                       |
| Tần số lấy mẫu   | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Chiến lược xác nhận | `...elevenlabs.commitStrategy`                                         | `vad`                                             |
| Ngôn ngữ         | `...elevenlabs.languageCode`                                              | (chưa đặt)                                        |

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
Voice Call nhận dữ liệu phương tiện Twilio dưới dạng G.711 u-law 8 kHz. Nhà cung cấp thời gian thực
ElevenLabs mặc định sử dụng `ulaw_8000`, vì vậy các khung dữ liệu điện thoại có thể được chuyển tiếp mà không cần
chuyển mã.
</Note>

Đối với chế độ tác nhân của Google Meet, đặt
`plugins.entries.google-meet.config.realtime.transcriptionProvider` thành
`"elevenlabs"` và cấu hình cùng khối nhà cung cấp trong
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Liên quan

- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Google Meet](/vi/plugins/google-meet)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
