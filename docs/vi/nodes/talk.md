---
read_when:
    - Triển khai chế độ Trò chuyện trên macOS/iOS/Android
    - Thay đổi hành vi giọng nói/TTS/ngắt lời
summary: 'Chế độ trò chuyện: hội thoại bằng giọng nói liên tục qua STT/TTS cục bộ và giọng nói thời gian thực'
title: Chế độ trò chuyện
x-i18n:
    generated_at: "2026-07-12T08:02:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Chế độ Talk bao gồm năm dạng thức chạy:

- **Talk gốc trên macOS/iOS/Android**: nhận dạng giọng nói cục bộ, trò chuyện qua Gateway và TTS `talk.speak`. Các Node quảng bá khả năng `talk` và khai báo những lệnh `talk.*` mà chúng hỗ trợ.
- **Talk trên iOS (thời gian thực)**: WebRTC do máy khách quản lý dành cho các cấu hình thời gian thực của OpenAI chọn phương thức truyền tải `webrtc` hoặc không chỉ định phương thức truyền tải. Các cấu hình thời gian thực chỉ định rõ `gateway-relay`, `provider-websocket` và không thuộc OpenAI vẫn sử dụng chuyển tiếp do Gateway quản lý; các cấu hình không theo thời gian thực sử dụng vòng lặp giọng nói gốc.
- **Talk trên trình duyệt**: `talk.client.create` dành cho các phiên `webrtc`/`provider-websocket` do máy khách quản lý, hoặc `talk.session.create` dành cho các phiên `gateway-relay` do Gateway quản lý. `managed-room` được dành riêng cho việc bàn giao qua Gateway và các phòng liên lạc bộ đàm.
- **Talk trên Android (thời gian thực)**: chủ động bật bằng `talk.realtime.mode: "realtime"` và `talk.realtime.transport: "gateway-relay"`. Nếu không, Android vẫn sử dụng nhận dạng giọng nói gốc, trò chuyện qua Gateway và `talk.speak`.
- **Máy khách chỉ phiên âm**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, sau đó dùng `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close` để tạo phụ đề/đọc chính tả mà không có phản hồi bằng giọng nói từ trợ lý. Ghi chú thoại tải lên một lần vẫn sử dụng đường dẫn âm thanh [hiểu nội dung đa phương tiện](/vi/nodes/media-understanding).

Talk gốc là một vòng lặp liên tục: nghe lời nói, gửi bản phiên âm đến mô hình thông qua phiên đang hoạt động, chờ phản hồi, rồi phát phản hồi bằng nhà cung cấp Talk đã cấu hình (`talk.speak`).

Talk thời gian thực do máy khách quản lý chuyển tiếp các lệnh gọi công cụ của nhà cung cấp qua `talk.client.toolCall` thay vì gọi trực tiếp `chat.send`. Khi một lượt tham vấn thời gian thực đang hoạt động, máy khách có thể gọi `talk.client.steer` hoặc `talk.session.steer` để phân loại đầu vào lời nói thành `status`, `steer`, `cancel` hoặc `followup`. Yêu cầu điều hướng được chấp nhận sẽ được đưa vào hàng đợi của lượt chạy nhúng đang hoạt động; yêu cầu bị từ chối sẽ trả về lý do như `no_active_run`, `not_streaming` hoặc `compacting`.

Talk chỉ phiên âm phát cùng một vỏ sự kiện Talk như các phiên thời gian thực và STT/TTS, nhưng sử dụng `mode: "transcription"` và `brain: "none"`. Tất cả các phiên Talk phát sự kiện trên kênh `talk.event`; máy khách đăng ký kênh này để nhận các bản cập nhật phiên âm từng phần/hoàn chỉnh (`transcript.delta`/`transcript.done`) và dữ liệu đo từ xa khác của phiên.

## Hành vi (macOS)

- Lớp phủ luôn hiển thị khi chế độ Talk được bật.
- Chuyển đổi giữa các giai đoạn **Đang nghe &rarr; Đang suy nghĩ &rarr; Đang nói**.
- Khi có một khoảng dừng ngắn (khoảng im lặng), bản phiên âm hiện tại sẽ được gửi.
- Câu trả lời được ghi vào WebChat (giống như khi nhập văn bản).
- **Ngắt khi có lời nói** (bật theo mặc định): nếu người dùng nói trong khi trợ lý đang phát lời, việc phát sẽ dừng và dấu thời gian ngắt được ghi lại cho lời nhắc tiếp theo.

## Chỉ thị giọng nói trong câu trả lời

Trợ lý có thể thêm một dòng JSON ở đầu câu trả lời để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ áp dụng cho dòng không trống đầu tiên; dòng JSON được loại bỏ trước khi phát TTS.
- Các khóa không xác định sẽ bị bỏ qua.
- `once: true` chỉ áp dụng cho câu trả lời hiện tại; nếu không có, giọng nói sẽ trở thành mặc định mới của chế độ Talk.

Các khóa được hỗ trợ: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Nói với giọng ấm áp và giữ câu trả lời ngắn gọn.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Khóa                                     | Mặc định                                   | Ghi chú                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Nhà cung cấp TTS đang hoạt động của Talk. Dùng `elevenlabs`, `mlx` hoặc `system` cho các đường dẫn phát cục bộ trên macOS.                                                                                                                                                  |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs dự phòng sang `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, hoặc giọng nói khả dụng đầu tiên khi có khóa API.                                                                                                                                                         |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                           |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                           |
| `providers.elevenlabs.apiKey`            | -                                          | Dự phòng sang `ELEVENLABS_API_KEY` (hoặc hồ sơ shell của Gateway nếu có).                                                                                                                                                                                                  |
| `speechLocale`                           | mặc định của thiết bị                      | Mã định danh ngôn ngữ BCP 47 cho tính năng nhận dạng giọng nói Talk trên thiết bị ở iOS/macOS.                                                                                                                                                                             |
| `silenceTimeoutMs`                       | `700` ms trên macOS/Android, `900` ms trên iOS | Khoảng dừng trước khi Talk gửi bản phiên âm.                                                                                                                                                                                                                            |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                           |
| `outputFormat`                           | `pcm_44100` trên macOS/iOS, `pcm_24000` trên Android | Đặt thành `mp3_*` để buộc truyền phát MP3.                                                                                                                                                                                                                       |
| `consultThinkingLevel`                   | chưa đặt                                   | Ghi đè mức suy nghĩ cho lượt chạy tác tử phía sau các lệnh gọi `openclaw_agent_consult` thời gian thực.                                                                                                                                                                    |
| `consultFastMode`                        | chưa đặt                                   | Ghi đè chế độ nhanh cho các lệnh gọi `openclaw_agent_consult` thời gian thực.                                                                                                                                                                                              |
| `realtime.provider`                      | -                                          | `openai` cho WebRTC, `google` cho WebSocket của nhà cung cấp, hoặc một nhà cung cấp chỉ dùng cầu nối thông qua chuyển tiếp Gateway.                                                                                                                                         |
| `realtime.providers.<id>`                | -                                          | Cấu hình thời gian thực do nhà cung cấp quản lý. Trình duyệt chỉ nhận thông tin xác thực phiên tạm thời/bị giới hạn, không bao giờ nhận khóa API tiêu chuẩn.                                                                                                                |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Mã định danh giọng nói OpenAI Realtime tích hợp sẵn (khóa `voice` cũ vẫn hoạt động nhưng đã lỗi thời). Các giọng nói hiện tại của `gpt-realtime-2.1`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; nên dùng `marin` và `cedar` để có chất lượng tốt nhất. |
| `realtime.transport`                     | -                                          | `webrtc`: OpenAI WebRTC do máy khách quản lý trên iOS và trong trình duyệt. `provider-websocket`: do trình duyệt quản lý, vẫn sử dụng chuyển tiếp Gateway trên iOS. `gateway-relay`: giữ âm thanh của nhà cung cấp trên Gateway; Android chỉ dùng chế độ thời gian thực với phương thức truyền tải này. |
| `realtime.brain`                         | -                                          | `agent-consult` định tuyến các lệnh gọi công cụ thời gian thực qua chính sách Gateway; `direct-tools` là chế độ tương thích cũ cho công cụ trực tiếp; `none` dành cho phiên âm/điều phối bên ngoài.                                                                            |
| `realtime.consultRouting`                | -                                          | `provider-direct` giữ nguyên câu trả lời trực tiếp của nhà cung cấp khi nhà cung cấp bỏ qua `openclaw_agent_consult`; thay vào đó, `force-agent-consult` định tuyến các bản phiên âm hoàn chỉnh của người dùng qua OpenClaw.                                                  |
| `realtime.instructions`                  | -                                          | Nối thêm chỉ thị hệ thống dành cho nhà cung cấp vào lời nhắc thời gian thực tích hợp sẵn của OpenClaw (phong cách/sắc thái giọng nói); hướng dẫn `openclaw_agent_consult` mặc định vẫn được giữ nguyên.                                                                       |

`talk.catalog` cung cấp các id nhà cung cấp chuẩn và bí danh trong registry, các chế độ/phương thức truyền/chiến lược brain/định dạng âm thanh thời gian thực/cờ khả năng hợp lệ của từng nhà cung cấp, cùng kết quả về trạng thái sẵn sàng được chọn trong thời gian chạy. Các ứng dụng Talk chính chủ nên đọc catalog đó thay vì tự duy trì bí danh nhà cung cấp cục bộ; hãy xem một Gateway cũ không cung cấp trạng thái sẵn sàng theo nhóm là chưa được xác minh, thay vì kết luận chắc chắn rằng nhóm đó chưa được cấu hình. Các nhà cung cấp phiên âm trực tuyến được phát hiện thông qua `talk.catalog.transcription`; relay Gateway hiện tại sử dụng cấu hình nhà cung cấp phát trực tuyến Voice Call cho đến khi có bề mặt cấu hình phiên âm Talk chuyên biệt.

## Giao diện macOS

- Nút bật/tắt trên thanh menu: **Talk**
- Thẻ cấu hình: nhóm **Talk Mode** (id giọng nói + nút bật/tắt ngắt lời)
- Lớp phủ: quả cầu hiển thị dạng sóng Talk chung (dùng chung với iOS, watchOS và Android). Trạng thái Listening phản ánh mức mic trực tiếp, trạng thái Speaking phản ánh đường bao phát TTS thực tế, còn trạng thái Thinking dao động nhẹ nhàng. Nhấp vào quả cầu để tạm dừng/tiếp tục, nhấp đúp để dừng nói, nhấp vào X để thoát chế độ Talk.

## Giao diện Android

- Nút bật/tắt trong thẻ Voice: **Talk**
- **Mic** và **Talk** thủ công là các chế độ thu âm loại trừ lẫn nhau.
- Mic thủ công và Talk thời gian thực ưu tiên mic của tai nghe Bluetooth Classic hoặc BLE đang kết nối; nếu tai nghe ngắt kết nối, ứng dụng yêu cầu một đầu vào tai nghe khác hoặc chuyển về mic mặc định, đồng thời khôi phục tùy chọn ưu tiên mặc định sau khi dừng thu âm.
- Mic thủ công sẽ dừng khi ứng dụng rời khỏi tiền cảnh hoặc người dùng rời khỏi thẻ Voice.
- Talk Mode tiếp tục chạy cho đến khi bị tắt hoặc Node ngắt kết nối, đồng thời sử dụng loại dịch vụ tiền cảnh dành cho mic của Android khi đang hoạt động.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000` và `pcm_44100` để phát trực tuyến `AudioTrack` với độ trễ thấp.

## Ghi chú

- Yêu cầu quyền truy cập Giọng nói + Micrô.
- Talk gốc sử dụng phiên Gateway đang hoạt động và chỉ chuyển sang thăm dò lịch sử khi không có sự kiện phản hồi.
- Gateway phân giải việc phát Talk thông qua `talk.speak` bằng nhà cung cấp Talk đang hoạt động. Android chỉ chuyển sang TTS hệ thống cục bộ khi RPC đó không khả dụng.
- Tính năng phát MLX cục bộ trên macOS sử dụng trình trợ giúp `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`. Đặt `OPENCLAW_MLX_TTS_BIN` để trỏ đến tệp nhị phân của trình trợ giúp tùy chỉnh trong quá trình phát triển.
- Phạm vi giá trị chỉ thị giọng nói (ElevenLabs): `stability`, `similarity` và `style` chấp nhận `0..1`; `speed` chấp nhận `0.5..2`; `latency_tier` chấp nhận `0..4`.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
