---
read_when:
    - Triển khai chế độ Nói chuyện trên macOS/iOS/Android
    - Thay đổi hành vi giọng nói/TTS/ngắt lời
summary: 'Chế độ đàm thoại: các cuộc trò chuyện bằng giọng nói liên tục qua STT/TTS cục bộ và giọng nói thời gian thực'
title: Chế độ trò chuyện
x-i18n:
    generated_at: "2026-05-10T19:40:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

Chế độ Talk có hai dạng runtime:

- Talk gốc trên macOS/iOS/Android dùng nhận dạng giọng nói cục bộ, trò chuyện qua Gateway và TTS `talk.speak`. Các Node quảng bá capability `talk` và khai báo các lệnh `talk.*` mà chúng hỗ trợ.
- Talk trên trình duyệt dùng `talk.client.create` cho các phiên `webrtc` và `provider-websocket` do client sở hữu, hoặc `talk.session.create` cho các phiên `gateway-relay` do Gateway sở hữu. `managed-room` được dành riêng cho chuyển giao Gateway và các phòng bộ đàm.
- Client chỉ phiên âm dùng `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, sau đó dùng `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close` khi cần phụ đề hoặc đọc chính tả mà không có phản hồi bằng giọng nói của trợ lý.

Talk gốc là một vòng lặp hội thoại bằng giọng nói liên tục:

1. Lắng nghe giọng nói
2. Gửi bản ghi lời nói đến mô hình thông qua phiên đang hoạt động
3. Chờ phản hồi
4. Phát lại qua nhà cung cấp Talk đã cấu hình (`talk.speak`)

Talk thời gian thực trên trình duyệt chuyển tiếp các lời gọi công cụ của nhà cung cấp qua `talk.client.toolCall`; client trình duyệt không gọi trực tiếp `chat.send` cho các lượt tham vấn thời gian thực.

Talk chỉ phiên âm phát ra cùng phong bì sự kiện Talk chung như các phiên thời gian thực và STT/TTS, nhưng dùng `mode: "transcription"` và `brain: "none"`. Nó dành cho phụ đề, đọc chính tả và thu giọng nói chỉ để quan sát; ghi chú thoại tải lên một lần vẫn dùng đường dẫn media/audio.

## Hành vi (macOS)

- **Lớp phủ luôn bật** khi chế độ Talk được bật.
- Chuyển pha **Đang nghe → Đang suy nghĩ → Đang nói**.
- Khi có **khoảng dừng ngắn** (cửa sổ im lặng), bản ghi lời nói hiện tại được gửi đi.
- Câu trả lời được **ghi vào WebChat** (giống như nhập văn bản).
- **Ngắt khi có giọng nói** (mặc định bật): nếu người dùng bắt đầu nói khi trợ lý đang nói, chúng tôi dừng phát và ghi lại dấu thời gian ngắt cho prompt tiếp theo.

## Chỉ thị giọng nói trong câu trả lời

Trợ lý có thể thêm tiền tố cho câu trả lời bằng **một dòng JSON duy nhất** để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ dòng không trống đầu tiên.
- Các khóa không xác định bị bỏ qua.
- `once: true` chỉ áp dụng cho câu trả lời hiện tại.
- Nếu không có `once`, giọng nói trở thành mặc định mới cho chế độ Talk.
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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Mặc định:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: khi chưa đặt, Talk giữ cửa sổ tạm dừng mặc định của nền tảng trước khi gửi bản ghi lời nói (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: chọn nhà cung cấp Talk đang hoạt động. Dùng `elevenlabs`, `mlx` hoặc `system` cho các đường dẫn phát cục bộ trên macOS.
- `providers.<provider>.voiceId`: dự phòng về `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` cho ElevenLabs (hoặc giọng ElevenLabs đầu tiên khi có API key).
- `providers.elevenlabs.modelId`: mặc định là `eleven_v3` khi chưa đặt.
- `providers.mlx.modelId`: mặc định là `mlx-community/Soprano-80M-bf16` khi chưa đặt.
- `providers.elevenlabs.apiKey`: dự phòng về `ELEVENLABS_API_KEY` (hoặc hồ sơ shell Gateway nếu có).
- `consultThinkingLevel`: ghi đè cấp độ suy nghĩ tùy chọn cho toàn bộ lượt chạy tác nhân OpenClaw phía sau các lời gọi thời gian thực `openclaw_agent_consult`.
- `consultFastMode`: ghi đè chế độ nhanh tùy chọn cho các lời gọi thời gian thực `openclaw_agent_consult`.
- `realtime.provider`: chọn nhà cung cấp giọng nói thời gian thực trên trình duyệt/máy chủ đang hoạt động. Dùng `openai` cho WebRTC, `google` cho WebSocket của nhà cung cấp, hoặc nhà cung cấp chỉ cầu nối thông qua chuyển tiếp Gateway.
- `realtime.providers.<provider>` lưu cấu hình thời gian thực do nhà cung cấp sở hữu. Trình duyệt chỉ nhận thông tin xác thực phiên tạm thời hoặc bị ràng buộc, không bao giờ nhận API key tiêu chuẩn.
- `realtime.providers.openai.voice`: id giọng nói OpenAI Realtime tích hợp sẵn. Các giọng `gpt-realtime-2` hiện tại là `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` và `cedar`; `marin` và `cedar` được khuyến nghị để có chất lượng tốt nhất.
- `realtime.brain`: `agent-consult` định tuyến các lời gọi công cụ thời gian thực qua chính sách Gateway; `direct-tools` là hành vi tương thích chỉ dành cho chủ sở hữu; `none` dành cho phiên âm hoặc điều phối bên ngoài.
- `realtime.instructions`: nối thêm chỉ dẫn hệ thống hướng tới nhà cung cấp vào prompt thời gian thực tích hợp của OpenClaw. Dùng nó cho phong cách và tông giọng; OpenClaw giữ hướng dẫn `openclaw_agent_consult` mặc định.
- `talk.catalog` hiển thị các chế độ, transport, chiến lược brain, định dạng âm thanh thời gian thực và cờ capability hợp lệ của từng nhà cung cấp để client Talk chính chủ có thể tránh các tổ hợp không được hỗ trợ.
- Nhà cung cấp phiên âm streaming được phát hiện thông qua `talk.catalog.transcription`. Chuyển tiếp Gateway hiện tại dùng cấu hình nhà cung cấp streaming Voice Call cho đến khi bề mặt cấu hình phiên âm Talk chuyên dụng được thêm vào.
- `speechLocale`: id ngôn ngữ BCP 47 tùy chọn cho nhận dạng giọng nói Talk trên thiết bị ở iOS/macOS. Để trống để dùng mặc định của thiết bị.
- `outputFormat`: mặc định là `pcm_44100` trên macOS/iOS và `pcm_24000` trên Android (đặt `mp3_*` để buộc streaming MP3)

## Giao diện macOS

- Công tắc trên thanh menu: **Talk**
- Tab cấu hình: nhóm **Talk Mode** (id giọng nói + công tắc ngắt)
- Lớp phủ:
  - **Đang nghe**: đám mây phát xung theo mức mic
  - **Đang suy nghĩ**: hoạt ảnh chìm xuống
  - **Đang nói**: các vòng tỏa ra
  - Nhấp vào đám mây: dừng nói
  - Nhấp X: thoát chế độ Talk

## Giao diện Android

- Công tắc tab Voice: **Talk**
- **Mic** thủ công và **Talk** là các chế độ thu runtime loại trừ lẫn nhau.
- Mic thủ công dừng khi ứng dụng rời foreground hoặc người dùng rời tab Voice.
- Talk Mode tiếp tục chạy cho đến khi bị tắt hoặc Node Android ngắt kết nối, và dùng loại foreground-service microphone của Android khi hoạt động.

## Ghi chú

- Yêu cầu quyền Speech + Microphone.
- Talk gốc dùng phiên Gateway đang hoạt động và chỉ dự phòng sang thăm dò lịch sử khi không có sự kiện phản hồi.
- Talk thời gian thực trên trình duyệt dùng `talk.client.toolCall` cho `openclaw_agent_consult` thay vì để lộ `chat.send` cho các phiên trình duyệt do nhà cung cấp sở hữu.
- Talk chỉ phiên âm dùng `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close`; client đăng ký `talk.event` để nhận cập nhật bản ghi lời nói từng phần/cuối cùng.
- Gateway phân giải phát lại Talk thông qua `talk.speak` bằng nhà cung cấp Talk đang hoạt động. Android chỉ dự phòng về TTS hệ thống cục bộ khi RPC đó không khả dụng.
- Phát lại MLX cục bộ trên macOS dùng helper `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`. Đặt `OPENCLAW_MLX_TTS_BIN` để trỏ tới một helper binary tùy chỉnh trong quá trình phát triển.
- `stability` cho `eleven_v3` được xác thực thành `0.0`, `0.5` hoặc `1.0`; các mô hình khác chấp nhận `0..1`.
- `latency_tier` được xác thực thành `0..4` khi được đặt.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000` và `pcm_44100` cho streaming AudioTrack độ trễ thấp.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
