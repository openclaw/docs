---
read_when:
    - Triển khai chế độ Talk trên macOS/iOS/Android
    - Thay đổi hành vi giọng nói/TTS/ngắt lời
summary: 'Chế độ trò chuyện: cuộc hội thoại bằng giọng nói liên tục với các nhà cung cấp TTS đã cấu hình'
title: Chế độ trò chuyện
x-i18n:
    generated_at: "2026-04-29T22:55:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 16
---

Chế độ Nói chuyện là một vòng lặp trò chuyện bằng giọng nói liên tục:

1. Nghe lời nói
2. Gửi bản chép lời đến mô hình (phiên chính, chat.send)
3. Chờ phản hồi
4. Phát thành tiếng qua nhà cung cấp Nói chuyện đã cấu hình (`talk.speak`)

## Hành vi (macOS)

- **Lớp phủ luôn bật** khi chế độ Nói chuyện được bật.
- Chuyển pha **Đang nghe → Đang suy nghĩ → Đang nói**.
- Khi có **khoảng dừng ngắn** (cửa sổ im lặng), bản chép lời hiện tại sẽ được gửi.
- Câu trả lời được **ghi vào WebChat** (giống như khi nhập).
- **Ngắt khi có lời nói** (mặc định bật): nếu người dùng bắt đầu nói trong khi trợ lý đang nói, chúng tôi dừng phát lại và ghi nhận dấu thời gian ngắt cho prompt tiếp theo.

## Chỉ thị giọng nói trong câu trả lời

Trợ lý có thể thêm tiền tố vào câu trả lời bằng **một dòng JSON duy nhất** để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ dòng không trống đầu tiên.
- Các khóa không xác định sẽ bị bỏ qua.
- `once: true` chỉ áp dụng cho câu trả lời hiện tại.
- Nếu không có `once`, giọng nói sẽ trở thành mặc định mới cho chế độ Nói chuyện.
- Dòng JSON sẽ bị loại bỏ trước khi phát TTS.

Các khóa được hỗ trợ:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Cấu hình (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Mặc định:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: khi chưa đặt, chế độ Nói chuyện giữ cửa sổ tạm dừng mặc định của nền tảng trước khi gửi bản chép lời (`700 ms trên macOS và Android, 900 ms trên iOS`)
- `provider`: chọn nhà cung cấp Nói chuyện đang hoạt động. Dùng `elevenlabs`, `mlx`, hoặc `system` cho các đường dẫn phát lại cục bộ trên macOS.
- `providers.<provider>.voiceId`: dự phòng về `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` cho ElevenLabs (hoặc giọng ElevenLabs đầu tiên khi có khóa API).
- `providers.elevenlabs.modelId`: mặc định là `eleven_v3` khi chưa đặt.
- `providers.mlx.modelId`: mặc định là `mlx-community/Soprano-80M-bf16` khi chưa đặt.
- `providers.elevenlabs.apiKey`: dự phòng về `ELEVENLABS_API_KEY` (hoặc hồ sơ shell của Gateway nếu có).
- `speechLocale`: id locale BCP 47 tùy chọn cho nhận dạng giọng nói Nói chuyện trên thiết bị ở iOS/macOS. Để trống để dùng mặc định của thiết bị.
- `outputFormat`: mặc định là `pcm_44100` trên macOS/iOS và `pcm_24000` trên Android (đặt `mp3_*` để buộc phát trực tuyến MP3)

## Giao diện macOS

- Nút bật/tắt trên thanh menu: **Nói chuyện**
- Thẻ cấu hình: nhóm **Chế độ Nói chuyện** (id giọng nói + nút bật/tắt ngắt)
- Lớp phủ:
  - **Đang nghe**: đám mây rung theo mức mic
  - **Đang suy nghĩ**: hoạt ảnh chìm xuống
  - **Đang nói**: các vòng tỏa ra
  - Nhấp vào đám mây: dừng nói
  - Nhấp X: thoát chế độ Nói chuyện

## Giao diện Android

- Nút bật/tắt thẻ Giọng nói: **Nói chuyện**
- **Mic** và **Nói chuyện** thủ công là các chế độ thu âm runtime loại trừ lẫn nhau.
- Mic thủ công dừng khi ứng dụng rời foreground hoặc người dùng rời thẻ Giọng nói.
- Chế độ Nói chuyện tiếp tục chạy cho đến khi bị tắt hoặc Node Android ngắt kết nối, và dùng loại foreground service microphone của Android khi đang hoạt động.

## Ghi chú

- Yêu cầu quyền Speech + Microphone.
- Dùng `chat.send` với khóa phiên `main`.
- Gateway phân giải phát lại Nói chuyện qua `talk.speak` bằng nhà cung cấp Nói chuyện đang hoạt động. Android chỉ dự phòng về TTS hệ thống cục bộ khi RPC đó không khả dụng.
- Phát lại MLX cục bộ trên macOS dùng helper `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`. Đặt `OPENCLAW_MLX_TTS_BIN` để trỏ đến binary helper tùy chỉnh trong quá trình phát triển.
- `stability` cho `eleven_v3` được xác thực là `0.0`, `0.5`, hoặc `1.0`; các mô hình khác chấp nhận `0..1`.
- `latency_tier` được xác thực là `0..4` khi được đặt.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000`, và `pcm_44100` cho phát trực tuyến AudioTrack độ trễ thấp.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu phương tiện](/vi/nodes/media-understanding)
