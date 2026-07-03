---
read_when:
    - Triển khai chế độ Talk trên macOS/iOS/Android
    - Thay đổi hành vi giọng nói/TTS/ngắt
summary: 'Chế độ trò chuyện: các cuộc hội thoại nói liên tục trên STT/TTS cục bộ và giọng nói thời gian thực'
title: Chế độ trò chuyện
x-i18n:
    generated_at: "2026-07-03T00:59:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

Chế độ Thoại có hai dạng thời gian chạy:

- Thoại gốc trên macOS/iOS/Android dùng nhận dạng giọng nói cục bộ, trò chuyện qua Gateway và TTS `talk.speak`. Các node quảng bá khả năng `talk` và khai báo các lệnh `talk.*` mà chúng hỗ trợ.
- Thoại trên iOS dùng WebRTC do máy khách sở hữu cho các cấu hình thời gian thực OpenAI chọn `webrtc` hoặc bỏ qua transport. Các cấu hình thời gian thực rõ ràng dùng `gateway-relay`, `provider-websocket` và không phải OpenAI vẫn ở trên relay do Gateway sở hữu; các cấu hình không thời gian thực dùng vòng lặp giọng nói gốc.
- Thoại trên trình duyệt dùng `talk.client.create` cho các phiên `webrtc` và `provider-websocket` do máy khách sở hữu, hoặc `talk.session.create` cho các phiên `gateway-relay` do Gateway sở hữu. `managed-room` được dành riêng cho chuyển giao Gateway và các phòng bộ đàm.
- Thoại trên Android có thể chọn tham gia các phiên relay thời gian thực do Gateway sở hữu với `talk.realtime.mode: "realtime"` và `talk.realtime.transport: "gateway-relay"`. Nếu không, nó vẫn dùng nhận dạng giọng nói gốc, trò chuyện qua Gateway và `talk.speak`.
- Máy khách chỉ phiên âm dùng `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, rồi `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close` khi cần phụ đề hoặc đọc chính tả mà không có phản hồi giọng nói từ trợ lý.

Thoại gốc là một vòng lặp hội thoại giọng nói liên tục:

1. Lắng nghe lời nói
2. Gửi bản chép lời đến mô hình thông qua phiên đang hoạt động
3. Chờ phản hồi
4. Phát bằng nhà cung cấp Thoại đã cấu hình (`talk.speak`)

Thoại thời gian thực do máy khách sở hữu chuyển tiếp các lệnh gọi công cụ của nhà cung cấp qua `talk.client.toolCall`; các máy khách đó không gọi trực tiếp `chat.send` cho các lượt tham vấn thời gian thực.
Khi một lượt tham vấn thời gian thực đang hoạt động, máy khách Thoại có thể dùng `talk.client.steer` hoặc
`talk.session.steer` để phân loại lời nói đầu vào là `status`, `steer`, `cancel` hoặc
`followup`. Điều hướng được chấp nhận sẽ được xếp hàng vào lượt chạy nhúng đang hoạt động; điều hướng bị từ chối
trả về một lý do có cấu trúc như `no_active_run`, `not_streaming`,
hoặc `compacting`.

Thoại chỉ phiên âm phát cùng phong bì sự kiện Thoại chung như các phiên thời gian thực và STT/TTS, nhưng dùng `mode: "transcription"` và `brain: "none"`. Nó dùng cho phụ đề, đọc chính tả và thu giọng nói chỉ quan sát; ghi chú thoại tải lên một lần vẫn dùng đường dẫn media/audio.

## Hành vi (macOS)

- **Lớp phủ luôn bật** khi chế độ Thoại được bật.
- Chuyển pha **Đang nghe → Đang suy nghĩ → Đang nói**.
- Khi có **khoảng dừng ngắn** (cửa sổ im lặng), bản chép lời hiện tại được gửi đi.
- Câu trả lời được **ghi vào WebChat** (giống như khi nhập).
- **Ngắt khi có lời nói** (mặc định bật): nếu người dùng bắt đầu nói trong khi trợ lý đang nói, chúng tôi dừng phát lại và ghi nhận dấu thời gian ngắt cho prompt tiếp theo.

## Chỉ thị giọng nói trong câu trả lời

Trợ lý có thể thêm tiền tố vào câu trả lời bằng một **dòng JSON duy nhất** để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ dòng không rỗng đầu tiên.
- Các khóa không xác định bị bỏ qua.
- `once: true` chỉ áp dụng cho câu trả lời hiện tại.
- Không có `once`, giọng nói trở thành mặc định mới cho chế độ Thoại.
- Dòng JSON bị loại bỏ trước khi phát lại TTS.

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
- `silenceTimeoutMs`: khi không đặt, Thoại giữ cửa sổ tạm dừng mặc định của nền tảng trước khi gửi bản chép lời (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: chọn nhà cung cấp Thoại đang hoạt động. Dùng `elevenlabs`, `mlx` hoặc `system` cho các đường dẫn phát lại cục bộ trên macOS.
- `providers.<provider>.voiceId`: quay về `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` cho ElevenLabs (hoặc giọng nói ElevenLabs đầu tiên khi có khóa API).
- `providers.elevenlabs.modelId`: mặc định là `eleven_v3` khi không đặt.
- `providers.mlx.modelId`: mặc định là `mlx-community/Soprano-80M-bf16` khi không đặt.
- `providers.elevenlabs.apiKey`: quay về `ELEVENLABS_API_KEY` (hoặc hồ sơ shell Gateway nếu có).
- `consultThinkingLevel`: ghi đè mức suy nghĩ tùy chọn cho toàn bộ lượt chạy agent OpenClaw phía sau các lệnh gọi thời gian thực `openclaw_agent_consult`.
- `consultFastMode`: ghi đè chế độ nhanh tùy chọn cho các lệnh gọi thời gian thực `openclaw_agent_consult`.
- `realtime.provider`: chọn nhà cung cấp giọng nói thời gian thực đang hoạt động. Dùng `openai` cho WebRTC, `google` cho WebSocket của nhà cung cấp, hoặc một nhà cung cấp chỉ bridge thông qua relay Gateway.
- `realtime.providers.<provider>` lưu cấu hình thời gian thực do nhà cung cấp sở hữu. Trình duyệt chỉ nhận thông tin xác thực phiên tạm thời hoặc bị ràng buộc, không bao giờ nhận khóa API tiêu chuẩn.
- `realtime.providers.openai.voice`: id giọng nói OpenAI Realtime tích hợp sẵn. Các giọng nói `gpt-realtime-2` hiện tại là `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` và `cedar`; `marin` và `cedar` được khuyến nghị để có chất lượng tốt nhất.
- `realtime.transport`: `webrtc` dùng WebRTC OpenAI do máy khách sở hữu trên iOS và trong trình duyệt. `provider-websocket` do trình duyệt sở hữu nhưng vẫn ở trên relay Gateway trên iOS. `gateway-relay` giữ âm thanh của nhà cung cấp trên Gateway; Android chỉ dùng thời gian thực cho transport này và nếu không thì giữ vòng lặp STT/TTS gốc.
- `realtime.brain`: `agent-consult` định tuyến các lệnh gọi công cụ thời gian thực qua chính sách Gateway; `direct-tools` là hành vi tương thích công cụ trực tiếp cũ; `none` dùng cho phiên âm hoặc điều phối bên ngoài.
- `realtime.consultRouting`: `provider-direct` giữ nguyên câu trả lời trực tiếp của nhà cung cấp khi nó bỏ qua `openclaw_agent_consult`; `force-agent-consult` khiến relay Gateway định tuyến bản chép lời người dùng đã hoàn tất qua OpenClaw thay vào đó.
- `realtime.instructions`: nối thêm hướng dẫn hệ thống hướng tới nhà cung cấp vào prompt thời gian thực tích hợp sẵn của OpenClaw. Dùng nó cho phong cách và sắc thái giọng nói; OpenClaw giữ hướng dẫn `openclaw_agent_consult` mặc định.
- `talk.catalog` hiển thị các chế độ, transport, chiến lược brain, định dạng âm thanh thời gian thực và cờ khả năng hợp lệ của từng nhà cung cấp để các máy khách Thoại chính chủ có thể tránh các tổ hợp không được hỗ trợ.
- Các nhà cung cấp phiên âm truyền trực tuyến được phát hiện thông qua `talk.catalog.transcription`. Relay Gateway hiện tại dùng cấu hình nhà cung cấp truyền trực tuyến Cuộc gọi thoại cho đến khi bề mặt cấu hình phiên âm Thoại chuyên dụng được thêm vào.
- `speechLocale`: id locale BCP 47 tùy chọn cho nhận dạng giọng nói Thoại trên thiết bị ở iOS/macOS. Để trống để dùng mặc định của thiết bị.
- `outputFormat`: mặc định là `pcm_44100` trên macOS/iOS và `pcm_24000` trên Android (đặt `mp3_*` để buộc truyền trực tuyến MP3)

## Giao diện người dùng macOS

- Công tắc thanh menu: **Thoại**
- Thẻ cấu hình: nhóm **Chế độ Thoại** (id giọng nói + công tắc ngắt)
- Lớp phủ:
  - **Đang nghe**: đám mây dao động theo mức mic
  - **Đang suy nghĩ**: hoạt ảnh chìm xuống
  - **Đang nói**: các vòng tỏa ra
  - Nhấp đám mây: dừng nói
  - Nhấp X: thoát chế độ Thoại

## Giao diện người dùng Android

- Công tắc thẻ Giọng nói: **Thoại**
- **Mic** thủ công và **Thoại** thủ công là các chế độ thu thời gian chạy loại trừ lẫn nhau.
- Mic thủ công và Thoại thời gian thực ưu tiên mic tai nghe Bluetooth Classic hoặc BLE đã kết nối. Nếu nó ngắt kết nối, ứng dụng yêu cầu đầu vào tai nghe khác hoặc để Android dùng mic mặc định; dừng thu sẽ khôi phục tùy chọn mic mặc định.
- Mic thủ công dừng khi ứng dụng rời nền trước hoặc người dùng rời thẻ Giọng nói.
- Chế độ Thoại tiếp tục chạy cho đến khi bị tắt hoặc node Android ngắt kết nối, và dùng loại dịch vụ nền trước micrô của Android khi đang hoạt động.

## Ghi chú

- Yêu cầu quyền Speech + Microphone.
- Thoại gốc dùng phiên Gateway đang hoạt động và chỉ quay về thăm dò lịch sử khi không có sự kiện phản hồi.
- Thoại thời gian thực do máy khách sở hữu dùng `talk.client.toolCall` cho `openclaw_agent_consult` thay vì để lộ `chat.send` cho các phiên do nhà cung cấp sở hữu.
- Thoại chỉ phiên âm dùng `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close`; máy khách đăng ký `talk.event` để nhận cập nhật bản chép lời một phần/cuối cùng.
- Gateway phân giải phát lại Thoại thông qua `talk.speak` bằng nhà cung cấp Thoại đang hoạt động. Android chỉ quay về TTS hệ thống cục bộ khi RPC đó không khả dụng.
- Phát lại MLX cục bộ trên macOS dùng helper `openclaw-mlx-tts` được đóng gói khi có, hoặc một tệp thực thi trên `PATH`. Đặt `OPENCLAW_MLX_TTS_BIN` để trỏ tới một helper binary tùy chỉnh trong quá trình phát triển.
- `stability` cho `eleven_v3` được xác thực thành `0.0`, `0.5` hoặc `1.0`; các mô hình khác chấp nhận `0..1`.
- `latency_tier` được xác thực thành `0..4` khi được đặt.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000` và `pcm_44100` để truyền trực tuyến AudioTrack độ trễ thấp.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
