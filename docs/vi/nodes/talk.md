---
read_when:
    - Triển khai chế độ Nói chuyện trên macOS/iOS/Android
    - Thay đổi hành vi giọng nói/TTS/ngắt lời
summary: 'Chế độ nói: hội thoại bằng giọng nói liên tục trên STT/TTS cục bộ và giọng nói thời gian thực'
title: Chế độ trò chuyện
x-i18n:
    generated_at: "2026-05-06T09:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Chế độ Talk có hai dạng runtime:

- Talk gốc trên macOS/iOS/Android dùng nhận dạng giọng nói cục bộ, chat qua Gateway và TTS `talk.speak`. Các Node quảng bá khả năng `talk` và khai báo các lệnh `talk.*` mà chúng hỗ trợ.
- Talk trên trình duyệt dùng `talk.client.create` cho các phiên `webrtc` và `provider-websocket` do client sở hữu, hoặc `talk.session.create` cho các phiên `gateway-relay` do Gateway sở hữu. `managed-room` được dành riêng cho việc bàn giao Gateway và các phòng bộ đàm.
- Client chỉ phiên âm dùng `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, rồi dùng `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close` khi cần phụ đề hoặc đọc chính tả mà không có phản hồi giọng nói từ trợ lý.

Talk gốc là một vòng lặp hội thoại giọng nói liên tục:

1. Lắng nghe giọng nói
2. Gửi bản chép lời đến mô hình qua phiên đang hoạt động
3. Chờ phản hồi
4. Đọc phản hồi qua provider Talk đã cấu hình (`talk.speak`)

Talk thời gian thực trên trình duyệt chuyển tiếp các lệnh gọi công cụ của provider qua `talk.client.toolCall`; client trình duyệt không gọi trực tiếp `chat.send` cho các lượt tham vấn thời gian thực.

Talk chỉ phiên âm phát ra cùng phong bì sự kiện Talk chung như các phiên thời gian thực và STT/TTS, nhưng dùng `mode: "transcription"` và `brain: "none"`. Tính năng này dành cho phụ đề, đọc chính tả và thu giọng nói chỉ để quan sát; ghi chú thoại tải lên một lần vẫn dùng đường dẫn media/audio.

## Hành vi (macOS)

- **Lớp phủ luôn bật** khi chế độ Talk được bật.
- Chuyển pha **Đang nghe → Đang suy nghĩ → Đang nói**.
- Khi có **khoảng dừng ngắn** (cửa sổ im lặng), bản chép lời hiện tại được gửi.
- Câu trả lời được **ghi vào WebChat** (giống như khi nhập).
- **Ngắt khi có giọng nói** (mặc định bật): nếu người dùng bắt đầu nói trong khi trợ lý đang nói, chúng tôi dừng phát và ghi lại dấu thời gian ngắt cho prompt tiếp theo.

## Chỉ thị giọng nói trong câu trả lời

Trợ lý có thể thêm tiền tố vào câu trả lời bằng **một dòng JSON duy nhất** để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ dòng không rỗng đầu tiên.
- Các khóa không xác định bị bỏ qua.
- `once: true` chỉ áp dụng cho câu trả lời hiện tại.
- Nếu không có `once`, giọng nói sẽ trở thành mặc định mới cho chế độ Talk.
- Dòng JSON bị loại bỏ trước khi phát TTS.

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Mặc định:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: khi chưa đặt, Talk giữ cửa sổ tạm dừng mặc định của nền tảng trước khi gửi bản chép lời (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: chọn provider Talk đang hoạt động. Dùng `elevenlabs`, `mlx` hoặc `system` cho các đường dẫn phát cục bộ trên macOS.
- `providers.<provider>.voiceId`: dùng dự phòng `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` cho ElevenLabs (hoặc giọng ElevenLabs đầu tiên khi có khóa API).
- `providers.elevenlabs.modelId`: mặc định là `eleven_v3` khi chưa đặt.
- `providers.mlx.modelId`: mặc định là `mlx-community/Soprano-80M-bf16` khi chưa đặt.
- `providers.elevenlabs.apiKey`: dùng dự phòng `ELEVENLABS_API_KEY` (hoặc hồ sơ shell của gateway nếu có).
- `realtime.provider`: chọn provider giọng nói thời gian thực trên trình duyệt/máy chủ đang hoạt động. Dùng `openai` cho WebRTC, `google` cho WebSocket của provider, hoặc provider chỉ làm cầu nối qua Gateway relay.
- `realtime.providers.<provider>` lưu cấu hình thời gian thực do provider sở hữu. Trình duyệt chỉ nhận thông tin xác thực phiên tạm thời hoặc bị ràng buộc, không bao giờ nhận khóa API tiêu chuẩn.
- `realtime.brain`: `agent-consult` định tuyến các lệnh gọi công cụ thời gian thực qua chính sách Gateway; `direct-tools` là hành vi tương thích chỉ dành cho owner; `none` dành cho phiên âm hoặc điều phối bên ngoài.
- `talk.catalog` hiển thị các chế độ, transport, chiến lược brain, định dạng âm thanh thời gian thực và cờ khả năng hợp lệ của từng provider để client Talk chính chủ có thể tránh các tổ hợp không được hỗ trợ.
- Các provider phiên âm streaming được phát hiện qua `talk.catalog.transcription`. Gateway relay hiện tại dùng cấu hình provider streaming của Voice Call cho đến khi bề mặt cấu hình phiên âm Talk chuyên dụng được thêm vào.
- `speechLocale`: id locale BCP 47 tùy chọn cho nhận dạng giọng nói Talk trên thiết bị ở iOS/macOS. Để trống để dùng mặc định của thiết bị.
- `outputFormat`: mặc định là `pcm_44100` trên macOS/iOS và `pcm_24000` trên Android (đặt `mp3_*` để buộc streaming MP3)

## UI macOS

- Nút bật/tắt trên thanh menu: **Talk**
- Tab cấu hình: nhóm **Chế độ Talk** (id giọng nói + nút bật/tắt ngắt)
- Lớp phủ:
  - **Đang nghe**: đám mây phát xung theo mức mic
  - **Đang suy nghĩ**: hiệu ứng chìm
  - **Đang nói**: các vòng tỏa ra
  - Nhấp vào đám mây: dừng nói
  - Nhấp X: thoát chế độ Talk

## UI Android

- Nút bật/tắt tab Giọng nói: **Talk**
- **Mic** và **Talk** thủ công là các chế độ thu runtime loại trừ lẫn nhau.
- Mic thủ công dừng khi ứng dụng rời foreground hoặc người dùng rời tab Giọng nói.
- Chế độ Talk tiếp tục chạy cho đến khi bị tắt hoặc Node Android ngắt kết nối, và dùng loại foreground-service microphone của Android khi đang hoạt động.

## Ghi chú

- Yêu cầu quyền Speech + Microphone.
- Talk gốc dùng phiên Gateway đang hoạt động và chỉ dùng dự phòng cơ chế thăm dò lịch sử khi không có sự kiện phản hồi.
- Talk thời gian thực trên trình duyệt dùng `talk.client.toolCall` cho `openclaw_agent_consult` thay vì để lộ `chat.send` cho các phiên trình duyệt do provider sở hữu.
- Talk chỉ phiên âm dùng `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close`; client đăng ký `talk.event` để nhận cập nhật bản chép lời từng phần/cuối cùng.
- gateway phân giải phát Talk qua `talk.speak` bằng provider Talk đang hoạt động. Android chỉ dùng dự phòng TTS hệ thống cục bộ khi RPC đó không khả dụng.
- Phát MLX cục bộ trên macOS dùng helper `openclaw-mlx-tts` đi kèm khi có, hoặc một executable trên `PATH`. Đặt `OPENCLAW_MLX_TTS_BIN` để trỏ đến binary helper tùy chỉnh trong quá trình phát triển.
- `stability` cho `eleven_v3` được xác thực là `0.0`, `0.5` hoặc `1.0`; các mô hình khác chấp nhận `0..1`.
- `latency_tier` được xác thực là `0..4` khi được đặt.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000` và `pcm_44100` cho streaming AudioTrack độ trễ thấp.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu media](/vi/nodes/media-understanding)
