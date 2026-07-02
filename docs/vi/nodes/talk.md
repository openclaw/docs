---
read_when:
    - Triển khai chế độ Talk trên macOS/iOS/Android
    - Thay đổi hành vi giọng nói/TTS/ngắt
summary: 'Chế độ trò chuyện: hội thoại bằng giọng nói liên tục qua STT/TTS cục bộ và giọng nói thời gian thực'
title: Chế độ trò chuyện
x-i18n:
    generated_at: "2026-07-02T22:37:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

Chế độ Talk có hai dạng thời gian chạy:

- Talk gốc trên macOS/iOS/Android dùng nhận dạng giọng nói cục bộ, trò chuyện qua Gateway và TTS `talk.speak`. Các nút quảng bá capability `talk` và khai báo các lệnh `talk.*` mà chúng hỗ trợ.
- Talk trên iOS dùng WebRTC do client sở hữu cho các cấu hình realtime của OpenAI chọn `webrtc` hoặc bỏ qua transport. Các cấu hình realtime tường minh `gateway-relay`, `provider-websocket` và không phải OpenAI vẫn ở trên relay do Gateway sở hữu; các cấu hình không realtime dùng vòng lặp giọng nói gốc.
- Talk trên trình duyệt dùng `talk.client.create` cho các phiên `webrtc` và `provider-websocket` do client sở hữu, hoặc `talk.session.create` cho các phiên `gateway-relay` do Gateway sở hữu. `managed-room` được dành riêng cho chuyển giao Gateway và phòng bộ đàm.
- Talk trên Android có thể chọn dùng các phiên relay realtime do Gateway sở hữu với `talk.realtime.mode: "realtime"` và `talk.realtime.transport: "gateway-relay"`. Nếu không, nó vẫn dùng nhận dạng giọng nói gốc, trò chuyện qua Gateway và `talk.speak`.
- Client chỉ phiên âm dùng `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, rồi `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close` khi cần phụ đề hoặc đọc chính tả mà không cần phản hồi giọng nói của trợ lý.

Talk gốc là một vòng lặp hội thoại giọng nói liên tục:

1. Nghe giọng nói
2. Gửi bản chép lời tới mô hình thông qua phiên đang hoạt động
3. Chờ phản hồi
4. Đọc phản hồi qua nhà cung cấp Talk đã cấu hình (`talk.speak`)

Talk realtime do client sở hữu chuyển tiếp các lệnh gọi công cụ của nhà cung cấp qua `talk.client.toolCall`; các client đó không gọi trực tiếp `chat.send` cho các lượt tham vấn realtime.
Trong khi một lượt tham vấn realtime đang hoạt động, client Talk có thể dùng `talk.client.steer` hoặc
`talk.session.steer` để phân loại đầu vào lời nói thành `status`, `steer`, `cancel` hoặc
`followup`. Điều hướng được chấp nhận sẽ được đưa vào hàng đợi của lượt chạy nhúng đang hoạt động; điều hướng bị từ chối
trả về một lý do có cấu trúc như `no_active_run`, `not_streaming`
hoặc `compacting`.

Talk chỉ phiên âm phát cùng phong bì sự kiện Talk chung như các phiên realtime và STT/TTS, nhưng dùng `mode: "transcription"` và `brain: "none"`. Nó dành cho phụ đề, đọc chính tả và thu giọng nói chỉ để quan sát; ghi chú thoại tải lên một lần vẫn dùng đường dẫn media/audio.

## Hành vi (macOS)

- **Lớp phủ luôn bật** khi chế độ Talk được bật.
- Chuyển pha **Đang nghe → Đang suy nghĩ → Đang nói**.
- Khi có **khoảng dừng ngắn** (cửa sổ im lặng), bản chép lời hiện tại được gửi.
- Câu trả lời được **ghi vào WebChat** (giống như nhập văn bản).
- **Ngắt khi có lời nói** (mặc định bật): nếu người dùng bắt đầu nói khi trợ lý đang nói, chúng tôi dừng phát lại và ghi nhận dấu thời gian ngắt cho prompt tiếp theo.

## Chỉ thị giọng nói trong câu trả lời

Trợ lý có thể thêm tiền tố cho câu trả lời bằng **một dòng JSON duy nhất** để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ dòng không rỗng đầu tiên.
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
- `silenceTimeoutMs`: khi chưa đặt, Talk giữ cửa sổ tạm dừng mặc định của nền tảng trước khi gửi bản chép lời (`700 ms trên macOS và Android, 900 ms trên iOS`)
- `provider`: chọn nhà cung cấp Talk đang hoạt động. Dùng `elevenlabs`, `mlx` hoặc `system` cho các đường dẫn phát lại cục bộ trên macOS.
- `providers.<provider>.voiceId`: dùng dự phòng `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` cho ElevenLabs (hoặc giọng ElevenLabs đầu tiên khi có khóa API).
- `providers.elevenlabs.modelId`: mặc định là `eleven_v3` khi chưa đặt.
- `providers.mlx.modelId`: mặc định là `mlx-community/Soprano-80M-bf16` khi chưa đặt.
- `providers.elevenlabs.apiKey`: dùng dự phòng `ELEVENLABS_API_KEY` (hoặc hồ sơ shell gateway nếu có).
- `consultThinkingLevel`: ghi đè mức suy nghĩ tùy chọn cho toàn bộ lượt chạy tác tử OpenClaw phía sau các lệnh gọi realtime `openclaw_agent_consult`.
- `consultFastMode`: ghi đè chế độ nhanh tùy chọn cho các lệnh gọi realtime `openclaw_agent_consult`.
- `realtime.provider`: chọn nhà cung cấp giọng nói realtime đang hoạt động. Dùng `openai` cho WebRTC, `google` cho WebSocket của nhà cung cấp, hoặc một nhà cung cấp chỉ bridge thông qua relay Gateway.
- `realtime.providers.<provider>` lưu cấu hình realtime do nhà cung cấp sở hữu. Trình duyệt chỉ nhận thông tin xác thực phiên tạm thời hoặc bị giới hạn, không bao giờ nhận khóa API tiêu chuẩn.
- `realtime.providers.openai.voice`: id giọng nói OpenAI Realtime tích hợp. Các giọng `gpt-realtime-2` hiện tại là `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` và `cedar`; `marin` và `cedar` được khuyến nghị để có chất lượng tốt nhất.
- `realtime.transport`: `webrtc` dùng OpenAI WebRTC do client sở hữu trên iOS và trong trình duyệt. `provider-websocket` do trình duyệt sở hữu nhưng vẫn ở trên relay Gateway trên iOS. `gateway-relay` giữ âm thanh của nhà cung cấp trên Gateway; Android chỉ dùng realtime cho transport này và nếu không thì giữ vòng lặp STT/TTS gốc.
- `realtime.brain`: `agent-consult` định tuyến các lệnh gọi công cụ realtime qua chính sách Gateway; `direct-tools` là hành vi tương thích công cụ trực tiếp kế thừa; `none` dành cho phiên âm hoặc điều phối bên ngoài.
- `realtime.consultRouting`: `provider-direct` giữ lại phản hồi trực tiếp của nhà cung cấp khi nó bỏ qua `openclaw_agent_consult`; `force-agent-consult` khiến relay Gateway định tuyến các bản chép lời người dùng đã hoàn tất qua OpenClaw thay vào đó.
- `realtime.instructions`: nối thêm hướng dẫn hệ thống hướng tới nhà cung cấp vào prompt realtime tích hợp của OpenClaw. Dùng cho phong cách và sắc thái giọng nói; OpenClaw giữ hướng dẫn `openclaw_agent_consult` mặc định.
- `talk.catalog` hiển thị các chế độ, transport, chiến lược brain, định dạng âm thanh realtime và cờ capability hợp lệ của từng nhà cung cấp để các client Talk bên thứ nhất có thể tránh những tổ hợp không được hỗ trợ.
- Các nhà cung cấp phiên âm streaming được phát hiện qua `talk.catalog.transcription`. Relay Gateway hiện tại dùng cấu hình nhà cung cấp streaming Voice Call cho đến khi bề mặt cấu hình phiên âm Talk chuyên dụng được thêm vào.
- `speechLocale`: id locale BCP 47 tùy chọn cho nhận dạng giọng nói Talk trên thiết bị ở iOS/macOS. Để trống để dùng mặc định của thiết bị.
- `outputFormat`: mặc định là `pcm_44100` trên macOS/iOS và `pcm_24000` trên Android (đặt `mp3_*` để buộc streaming MP3)

## Giao diện macOS

- Công tắc trên thanh menu: **Talk**
- Tab cấu hình: nhóm **Chế độ Talk** (id giọng nói + công tắc ngắt)
- Lớp phủ:
  - **Đang nghe**: đám mây phát xung theo mức mic
  - **Đang suy nghĩ**: hoạt ảnh chìm xuống
  - **Đang nói**: các vòng tỏa ra
  - Nhấp vào đám mây: dừng nói
  - Nhấp X: thoát chế độ Talk

## Giao diện Android

- Công tắc tab Giọng nói: **Talk**
- **Mic** thủ công và **Talk** là các chế độ thu thời gian chạy loại trừ lẫn nhau.
- Mic thủ công dừng khi ứng dụng rời foreground hoặc người dùng rời tab Giọng nói.
- Chế độ Talk tiếp tục chạy cho đến khi được tắt hoặc nút Android ngắt kết nối, và dùng loại foreground-service microphone của Android khi hoạt động.

## Ghi chú

- Yêu cầu quyền Speech + Microphone.
- Talk gốc dùng phiên Gateway đang hoạt động và chỉ dùng dự phòng polling lịch sử khi không có sự kiện phản hồi.
- Talk realtime do client sở hữu dùng `talk.client.toolCall` cho `openclaw_agent_consult` thay vì phơi bày `chat.send` cho các phiên do nhà cung cấp sở hữu.
- Talk chỉ phiên âm dùng `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close`; client đăng ký `talk.event` để nhận cập nhật bản chép lời từng phần/cuối cùng.
- Gateway phân giải phát lại Talk qua `talk.speak` bằng nhà cung cấp Talk đang hoạt động. Android chỉ dùng dự phòng TTS hệ thống cục bộ khi RPC đó không khả dụng.
- Phát lại MLX cục bộ trên macOS dùng helper `openclaw-mlx-tts` được đóng gói khi có, hoặc một executable trên `PATH`. Đặt `OPENCLAW_MLX_TTS_BIN` để trỏ tới binary helper tùy chỉnh trong quá trình phát triển.
- `stability` cho `eleven_v3` được xác thực là `0.0`, `0.5` hoặc `1.0`; các mô hình khác chấp nhận `0..1`.
- `latency_tier` được xác thực là `0..4` khi được đặt.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000` và `pcm_44100` cho streaming AudioTrack độ trễ thấp.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung media](/vi/nodes/media-understanding)
