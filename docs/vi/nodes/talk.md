---
read_when:
    - Triển khai chế độ Talk trên macOS/iOS/Android
    - Thay đổi hành vi giọng nói/TTS/ngắt
summary: 'Chế độ trò chuyện: các cuộc hội thoại bằng giọng nói liên tục qua STT/TTS cục bộ và giọng nói thời gian thực'
title: Chế độ trò chuyện
x-i18n:
    generated_at: "2026-07-03T09:41:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Chế độ thoại có hai dạng runtime:

- Thoại gốc trên macOS/iOS/Android dùng nhận dạng giọng nói cục bộ, trò chuyện qua Gateway và TTS `talk.speak`. Các Node quảng bá capability `talk` và khai báo các lệnh `talk.*` mà chúng hỗ trợ.
- Thoại trên iOS dùng WebRTC do client sở hữu cho các cấu hình thời gian thực của OpenAI chọn `webrtc` hoặc bỏ qua transport. Các cấu hình thời gian thực `gateway-relay`, `provider-websocket` tường minh và không phải OpenAI vẫn ở relay do Gateway sở hữu; các cấu hình không theo thời gian thực dùng vòng lặp giọng nói gốc.
- Thoại trên trình duyệt dùng `talk.client.create` cho các phiên `webrtc` và `provider-websocket` do client sở hữu, hoặc `talk.session.create` cho các phiên `gateway-relay` do Gateway sở hữu. `managed-room` được dành riêng cho bàn giao Gateway và phòng bộ đàm.
- Thoại trên Android có thể chọn tham gia các phiên relay thời gian thực do Gateway sở hữu với `talk.realtime.mode: "realtime"` và `talk.realtime.transport: "gateway-relay"`. Nếu không, nó vẫn dùng nhận dạng giọng nói gốc, trò chuyện qua Gateway và `talk.speak`.
- Các client chỉ phiên âm dùng `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, rồi `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close` khi cần phụ đề hoặc đọc chính tả mà không cần phản hồi thoại từ trợ lý.

Thoại gốc là một vòng lặp hội thoại bằng giọng nói liên tục:

1. Lắng nghe giọng nói
2. Gửi bản phiên âm đến mô hình thông qua phiên đang hoạt động
3. Chờ phản hồi
4. Phát bằng nhà cung cấp thoại đã cấu hình (`talk.speak`)

Thoại thời gian thực do client sở hữu chuyển tiếp các lệnh gọi công cụ của nhà cung cấp qua `talk.client.toolCall`; các client đó không gọi trực tiếp `chat.send` cho các lượt tư vấn thời gian thực.
Khi một lượt tư vấn thời gian thực đang hoạt động, client thoại có thể dùng `talk.client.steer` hoặc
`talk.session.steer` để phân loại đầu vào bằng lời nói là `status`, `steer`, `cancel`, hoặc
`followup`. Điều hướng được chấp nhận sẽ được xếp hàng vào lượt chạy nhúng đang hoạt động; điều hướng bị từ chối
trả về lý do có cấu trúc như `no_active_run`, `not_streaming`,
hoặc `compacting`.

Thoại chỉ phiên âm phát ra cùng phong bì sự kiện thoại chung như các phiên thời gian thực và STT/TTS, nhưng dùng `mode: "transcription"` và `brain: "none"`. Nó dành cho phụ đề, đọc chính tả và thu giọng nói chỉ để quan sát; ghi chú thoại tải lên một lần vẫn dùng đường dẫn media/audio.

## Hành vi (macOS)

- **Lớp phủ luôn bật** khi chế độ thoại được bật.
- Chuyển pha **Đang nghe → Đang suy nghĩ → Đang nói**.
- Khi có **khoảng dừng ngắn** (cửa sổ im lặng), bản phiên âm hiện tại được gửi đi.
- Phản hồi được **ghi vào WebChat** (giống như nhập văn bản).
- **Ngắt khi có giọng nói** (bật mặc định): nếu người dùng bắt đầu nói khi trợ lý đang nói, chúng tôi dừng phát và ghi lại dấu thời gian ngắt cho prompt tiếp theo.

## Chỉ thị giọng nói trong phản hồi

Trợ lý có thể thêm tiền tố cho phản hồi bằng **một dòng JSON duy nhất** để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ dòng không rỗng đầu tiên.
- Các khóa không xác định bị bỏ qua.
- `once: true` chỉ áp dụng cho phản hồi hiện tại.
- Nếu không có `once`, giọng nói trở thành mặc định mới cho chế độ thoại.
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
- `silenceTimeoutMs`: khi chưa đặt, thoại giữ cửa sổ tạm dừng mặc định của nền tảng trước khi gửi bản phiên âm (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: chọn nhà cung cấp thoại đang hoạt động. Dùng `elevenlabs`, `mlx`, hoặc `system` cho các đường dẫn phát cục bộ trên macOS.
- `providers.<provider>.voiceId`: dự phòng về `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` cho ElevenLabs (hoặc giọng ElevenLabs đầu tiên khi có khóa API).
- `providers.elevenlabs.modelId`: mặc định là `eleven_v3` khi chưa đặt.
- `providers.mlx.modelId`: mặc định là `mlx-community/Soprano-80M-bf16` khi chưa đặt.
- `providers.elevenlabs.apiKey`: dự phòng về `ELEVENLABS_API_KEY` (hoặc hồ sơ shell của gateway nếu có).
- `consultThinkingLevel`: ghi đè cấp độ suy nghĩ tùy chọn cho lượt chạy đầy đủ của agent OpenClaw phía sau các lệnh gọi `openclaw_agent_consult` thời gian thực.
- `consultFastMode`: ghi đè chế độ nhanh tùy chọn cho các lệnh gọi `openclaw_agent_consult` thời gian thực.
- `realtime.provider`: chọn nhà cung cấp giọng nói thời gian thực đang hoạt động. Dùng `openai` cho WebRTC, `google` cho WebSocket của nhà cung cấp, hoặc nhà cung cấp chỉ cầu nối thông qua relay Gateway.
- `realtime.providers.<provider>` lưu cấu hình thời gian thực do nhà cung cấp sở hữu. Trình duyệt chỉ nhận thông tin xác thực phiên tạm thời hoặc bị ràng buộc, không bao giờ nhận khóa API tiêu chuẩn.
- `realtime.providers.openai.voice`: id giọng nói OpenAI Realtime tích hợp. Các giọng `gpt-realtime-2` hiện tại là `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` và `cedar`; `marin` và `cedar` được khuyến nghị để có chất lượng tốt nhất.
- `realtime.transport`: `webrtc` dùng OpenAI WebRTC do client sở hữu trên iOS và trong trình duyệt. `provider-websocket` do trình duyệt sở hữu nhưng vẫn ở relay Gateway trên iOS. `gateway-relay` giữ âm thanh của nhà cung cấp trên Gateway; Android chỉ dùng thời gian thực cho transport này và nếu không thì giữ vòng lặp STT/TTS gốc.
- `realtime.brain`: `agent-consult` định tuyến các lệnh gọi công cụ thời gian thực qua chính sách Gateway; `direct-tools` là hành vi tương thích công cụ trực tiếp cũ; `none` dành cho phiên âm hoặc điều phối bên ngoài.
- `realtime.consultRouting`: `provider-direct` giữ nguyên phản hồi trực tiếp của nhà cung cấp khi nó bỏ qua `openclaw_agent_consult`; `force-agent-consult` khiến relay Gateway định tuyến các bản phiên âm người dùng đã hoàn tất qua OpenClaw thay vào đó.
- `realtime.instructions`: nối thêm hướng dẫn hệ thống hướng tới nhà cung cấp vào prompt thời gian thực tích hợp của OpenClaw. Dùng cho phong cách và sắc thái giọng nói; OpenClaw giữ hướng dẫn `openclaw_agent_consult` mặc định.
- `talk.catalog` hiển thị id nhà cung cấp chuẩn và bí danh registry cùng với các chế độ, transport, chiến lược brain, định dạng âm thanh thời gian thực, cờ capability hợp lệ của từng nhà cung cấp, và kết quả sẵn sàng được runtime chọn. Các client thoại bên thứ nhất nên dùng catalog đó thay vì duy trì bí danh nhà cung cấp cục bộ; một Gateway cũ bỏ qua trạng thái sẵn sàng theo nhóm được xem là chưa xác minh chứ không phải chắc chắn chưa cấu hình.
- Các nhà cung cấp phiên âm streaming được phát hiện thông qua `talk.catalog.transcription`. Relay Gateway hiện tại dùng cấu hình nhà cung cấp streaming Voice Call cho đến khi bề mặt cấu hình phiên âm thoại chuyên dụng được thêm vào.
- `speechLocale`: id locale BCP 47 tùy chọn cho nhận dạng giọng nói thoại trên thiết bị ở iOS/macOS. Để trống để dùng mặc định của thiết bị.
- `outputFormat`: mặc định là `pcm_44100` trên macOS/iOS và `pcm_24000` trên Android (đặt `mp3_*` để buộc streaming MP3)

## Giao diện người dùng macOS

- Công tắc thanh menu: **Thoại**
- Tab cấu hình: nhóm **Chế độ thoại** (id giọng nói + công tắc ngắt)
- Lớp phủ:
  - **Đang nghe**: đám mây dao động theo mức mic
  - **Đang suy nghĩ**: hoạt ảnh chìm xuống
  - **Đang nói**: các vòng tỏa ra
  - Nhấp vào đám mây: dừng nói
  - Nhấp X: thoát chế độ thoại

## Giao diện người dùng Android

- Công tắc tab giọng nói: **Thoại**
- **Mic** thủ công và **Thoại** là các chế độ thu runtime loại trừ lẫn nhau.
- Mic thủ công và thoại thời gian thực ưu tiên microphone tai nghe Bluetooth Classic hoặc BLE đã kết nối. Nếu ngắt kết nối, ứng dụng yêu cầu đầu vào tai nghe khác hoặc để Android dùng microphone mặc định; dừng thu sẽ khôi phục tùy chọn microphone mặc định.
- Mic thủ công dừng khi ứng dụng rời foreground hoặc người dùng rời tab Giọng nói.
- Chế độ thoại tiếp tục chạy cho đến khi được tắt hoặc Node Android ngắt kết nối, và dùng loại foreground-service microphone của Android khi đang hoạt động.

## Ghi chú

- Yêu cầu quyền Speech + Microphone.
- Thoại gốc dùng phiên Gateway đang hoạt động và chỉ dự phòng về thăm dò lịch sử khi không có sự kiện phản hồi.
- Thoại thời gian thực do client sở hữu dùng `talk.client.toolCall` cho `openclaw_agent_consult` thay vì để lộ `chat.send` cho các phiên do nhà cung cấp sở hữu.
- Thoại chỉ phiên âm dùng `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close`; client đăng ký `talk.event` để nhận cập nhật bản phiên âm từng phần/cuối cùng.
- Gateway phân giải phát thoại qua `talk.speak` bằng nhà cung cấp thoại đang hoạt động. Android chỉ dự phòng về TTS hệ thống cục bộ khi RPC đó không khả dụng.
- Phát MLX cục bộ trên macOS dùng helper `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`. Đặt `OPENCLAW_MLX_TTS_BIN` để trỏ đến binary helper tùy chỉnh trong quá trình phát triển.
- `stability` cho `eleven_v3` được xác thực là `0.0`, `0.5`, hoặc `1.0`; các mô hình khác chấp nhận `0..1`.
- `latency_tier` được xác thực là `0..4` khi được đặt.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000` và `pcm_44100` cho streaming AudioTrack độ trễ thấp.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
