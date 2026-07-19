---
read_when:
    - Triển khai chế độ Trò chuyện trên macOS/iOS/Android
    - Thay đổi hành vi giọng nói/TTS/ngắt lời
summary: 'Chế độ trò chuyện: hội thoại bằng giọng nói liên tục qua STT/TTS cục bộ và giọng nói thời gian thực'
title: Chế độ trò chuyện
x-i18n:
    generated_at: "2026-07-19T17:06:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1cb76789212054ce782703b9a456f5e809c0a45d1af5665445b17fcba4fd8f93
    source_path: nodes/talk.md
    workflow: 16
---

Chế độ Talk bao gồm năm dạng runtime:

- **Talk gốc trên macOS/iOS/Android**: nhận dạng giọng nói cục bộ, trò chuyện qua Gateway và TTS `talk.speak`. Các Node quảng bá khả năng `talk` và khai báo những lệnh `talk.*` mà chúng hỗ trợ.
- **Talk trên iOS (thời gian thực)**: WebRTC do máy khách quản lý dành cho các cấu hình thời gian thực của OpenAI chọn phương thức truyền `webrtc` hoặc bỏ qua phương thức truyền. Các cấu hình thời gian thực chỉ định rõ `gateway-relay`, `provider-websocket` và không thuộc OpenAI vẫn sử dụng relay do Gateway quản lý; các cấu hình không theo thời gian thực sử dụng vòng lặp giọng nói gốc.
- **Talk trên trình duyệt**: `talk.client.create` cho các phiên `webrtc`/`provider-websocket` do máy khách quản lý, hoặc `talk.session.create` cho các phiên `gateway-relay` do Gateway quản lý. `managed-room` được dành riêng cho việc chuyển giao qua Gateway và các phòng bộ đàm.
- **Talk trên Android (thời gian thực)**: bật bằng `talk.realtime.mode: "realtime"` và `talk.realtime.transport: "gateway-relay"`. Nếu không, Android tiếp tục sử dụng nhận dạng giọng nói gốc, trò chuyện qua Gateway và `talk.speak`.
- **Máy khách chỉ phiên âm**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, sau đó là `talk.session.appendAudio`, `talk.session.cancelTurn` và `talk.session.close` để tạo phụ đề/đọc chính tả mà không có phản hồi bằng giọng nói của trợ lý. Các ghi chú thoại tải lên dùng một lần vẫn sử dụng đường dẫn âm thanh [hiểu nội dung phương tiện](/vi/nodes/media-understanding).

Talk gốc là một vòng lặp liên tục: lắng nghe lời nói, gửi bản phiên âm đến mô hình thông qua phiên đang hoạt động, chờ phản hồi, rồi phát phản hồi qua nhà cung cấp Talk đã cấu hình (`talk.speak`).

Talk thời gian thực do máy khách quản lý chuyển tiếp các lệnh gọi công cụ của nhà cung cấp qua `talk.client.toolCall` thay vì gọi trực tiếp `chat.send`. Trong khi một lượt tham vấn thời gian thực đang hoạt động, máy khách có thể gọi `talk.client.steer` hoặc `talk.session.steer` để phân loại nội dung nói thành `status`, `steer`, `cancel` hoặc `followup`. Chỉ dẫn điều hướng được chấp nhận sẽ được đưa vào hàng đợi của lượt chạy nhúng đang hoạt động; chỉ dẫn bị từ chối sẽ trả về lý do như `no_active_run`, `not_streaming` hoặc `compacting`.

Các phát ngôn thời gian thực đã hoàn tất của người dùng và trợ lý luôn được nối trực tiếp vào phiên tác nhân đang hoạt động, để các lượt trò chuyện và thoại sau đó dùng chung một lịch sử. Các phương thức truyền do máy khách quản lý báo cáo bản phiên âm đã hoàn tất bằng mã định danh mục nhập ổn định; các phiên relay qua Gateway nối cùng các sự kiện đó ở phía máy chủ. Các phiên của nhà cung cấp cũng nhận ngữ cảnh hồ sơ thời gian thực có giới hạn mà thoại Discord sử dụng.

Các lượt tham vấn bắt nguồn từ giọng nói yêu cầu một xác nhận bằng lời mới và chính xác trước các hành động có tác động lớn như gửi tin nhắn, điều khiển Node, thao tác trên trình duyệt/máy tính, thay đổi dịch vụ, thực thi lệnh shell phá hủy hoặc xuất bản. Xác nhận chỉ áp dụng cho chính xác các đối số công cụ bị chặn và chỉ được sử dụng một lần; các lượt chạy đồng thời không liên quan không bị ảnh hưởng. Khi một cuộc gọi kết thúc, OpenClaw có thể gửi bản tóm tắt ngắn gọn **Các thay đổi của cuộc gọi thoại** về các công cụ có khả năng thay đổi trạng thái đến đích phân phối không phải WebChat gần nhất của phiên.

Talk chỉ phiên âm phát cùng một vỏ bọc sự kiện Talk như các phiên thời gian thực và STT/TTS, nhưng sử dụng `mode: "transcription"` và `brain: "none"`. Tất cả các phiên Talk phát sự kiện trên kênh `talk.event`; máy khách đăng ký kênh này để nhận các bản cập nhật phiên âm một phần/hoàn chỉnh (`transcript.delta`/`transcript.done`) và dữ liệu đo từ xa khác của phiên.

Talk video trên trình duyệt khả dụng cho WebRTC thời gian thực của OpenAI và các phiên WebSocket của nhà cung cấp Google Live. OpenAI nhận một ảnh JPEG có giới hạn duy nhất khi
`describe_view` yêu cầu ngữ cảnh hình ảnh; OpenAI không nhận luồng
camera liên tục. Google Live nhận trực tiếp các khung hình JPEG có giới hạn từ
trình duyệt với tốc độ tối đa một khung hình mỗi giây, trong khi `describe_view` báo cáo
trạng thái luồng camera. Trong cả hai trường hợp, các khung hình camera bỏ qua Gateway và
việc dừng Talk sẽ giải phóng các luồng camera và micrô.

## Hành vi (macOS)

- Lớp phủ luôn hiển thị khi chế độ Talk được bật.
- Các chuyển đổi giai đoạn **Đang nghe &rarr; Đang suy nghĩ &rarr; Đang nói**.
- Sau một khoảng tạm dừng ngắn (cửa sổ im lặng), bản phiên âm hiện tại được gửi đi.
- Các phản hồi được ghi vào WebChat (tương tự như khi nhập văn bản).
- **Ngắt khi có lời nói** (bật theo mặc định): nếu người dùng nói trong khi trợ lý đang phát lời, quá trình phát sẽ dừng và dấu thời gian ngắt được ghi lại cho lời nhắc tiếp theo.

## Chỉ thị giọng nói trong phản hồi

Trợ lý có thể thêm tiền tố là một dòng JSON duy nhất vào phản hồi để điều khiển giọng nói:

```json
{ "voice": "<voice-id>", "once": true }
```

Quy tắc:

- Chỉ dòng không trống đầu tiên; dòng JSON được loại bỏ trước khi phát TTS.
- Các khóa không xác định sẽ bị bỏ qua.
- `once: true` chỉ áp dụng cho phản hồi hiện tại; nếu không có, giọng nói sẽ trở thành mặc định mới của chế độ Talk.

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

| Khóa                                     | Mặc định                                   | Ghi chú                                                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Nhà cung cấp TTS cho Active Talk. Sử dụng `elevenlabs`, `mlx` hoặc `system` cho các phương thức phát cục bộ trên macOS.                                                                                                                                                                             |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs dự phòng sang `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, hoặc giọng nói khả dụng đầu tiên có khóa API.                                                                                                                                                             |
| `speechLocale`                           | mặc định của thiết bị                      | Mã ngôn ngữ BCP 47 cho tính năng nhận dạng giọng nói trên Android, iOS và macOS. Android cũng chuyển tiếp thành phần ngôn ngữ đến tính năng chuyển lời nói đầu vào thành văn bản theo thời gian thực.                                                                                                                                |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | Dự phòng sang `ELEVENLABS_API_KEY` (hoặc hồ sơ shell của Gateway nếu có).                                                                                                                                                                                                |
| `speechLocale`                           | mặc định của thiết bị                      | ID mã ngôn ngữ BCP 47 cho tính năng nhận dạng giọng nói Talk trên thiết bị iOS/macOS.                                                                                                                                                                                                       |
| `silenceTimeoutMs`                       | `700` ms macOS/Android, `900` ms iOS       | Khoảng tạm dừng trước khi Talk gửi bản chép lời.                                                                                                                                                                                                                             |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Đặt `mp3_*` để buộc truyền phát MP3.                                                                                                                                                                                                                                        |
| `consultThinkingLevel`                   | chưa đặt                                   | Ghi đè mức suy luận cho lượt chạy tác tử phía sau các lệnh gọi `openclaw_agent_consult` theo thời gian thực.                                                                                                                                                                                  |
| `consultFastMode`                        | chưa đặt                                   | Ghi đè chế độ nhanh cho các lệnh gọi `openclaw_agent_consult` theo thời gian thực.                                                                                                                                                                                                            |
| `realtime.provider`                      | -                                          | `openai` cho WebRTC, `google` cho WebSocket của nhà cung cấp, hoặc nhà cung cấp chỉ dùng cầu nối thông qua chuyển tiếp của Gateway.                                                                                                                                                                     |
| `realtime.providers.<id>`                | -                                          | Cấu hình thời gian thực do nhà cung cấp sở hữu. Trình duyệt chỉ nhận thông tin xác thực phiên tạm thời/bị giới hạn, tuyệt đối không nhận khóa API tiêu chuẩn.                                                                                                                                                 |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | ID giọng nói OpenAI Realtime tích hợp sẵn (khóa `voice` cũ hơn vẫn hoạt động nhưng đã lỗi thời). Các giọng nói `gpt-realtime-2.1` hiện tại: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; nên dùng `marin` và `cedar` để đạt chất lượng tốt nhất. |
| `realtime.transport`                     | -                                          | `webrtc`: WebRTC OpenAI do máy khách sở hữu trên iOS và trong trình duyệt. `provider-websocket`: do trình duyệt sở hữu, vẫn sử dụng chuyển tiếp Gateway trên iOS. `gateway-relay`: duy trì âm thanh của nhà cung cấp trên Gateway; Android chỉ sử dụng chế độ thời gian thực với phương thức truyền tải này.                                  |
| `realtime.brain`                         | -                                          | `agent-consult` định tuyến các lệnh gọi công cụ theo thời gian thực qua chính sách Gateway; `direct-tools` là khả năng tương thích công cụ trực tiếp kiểu cũ; `none` dành cho việc chuyển lời nói thành văn bản/điều phối bên ngoài.                                                                                                 |
| `realtime.consultRouting`                | -                                          | `provider-direct` giữ nguyên phản hồi trực tiếp của nhà cung cấp khi bỏ qua `openclaw_agent_consult`; thay vào đó, `force-agent-consult` định tuyến bản chép lời hoàn chỉnh của người dùng qua OpenClaw.                                                                                          |
| `realtime.instructions`                  | -                                          | Nối thêm hướng dẫn hệ thống dành cho nhà cung cấp vào lời nhắc thời gian thực tích hợp sẵn của OpenClaw (phong cách/tông giọng); hướng dẫn `openclaw_agent_consult` mặc định vẫn được giữ nguyên.                                                                                                                |

`talk.catalog` cung cấp các ID nhà cung cấp chuẩn và bí danh trong sổ đăng ký, các chế độ/phương thức truyền tải/chiến lược bộ não/định dạng âm thanh thời gian thực/cờ khả năng hợp lệ của từng nhà cung cấp, cùng kết quả về trạng thái sẵn sàng được chọn trong thời gian chạy. Các máy khách Talk chính chủ nên đọc danh mục đó thay vì duy trì bí danh nhà cung cấp cục bộ; với Gateway cũ không cung cấp trạng thái sẵn sàng của nhóm, hãy coi trạng thái này là chưa được xác minh thay vì chắc chắn chưa được cấu hình. Các nhà cung cấp chuyển lời nói thành văn bản dạng truyền phát được phát hiện thông qua `talk.catalog.transcription`; chuyển tiếp Gateway hiện tại sử dụng cấu hình nhà cung cấp truyền phát Voice Call cho đến khi một bề mặt cấu hình chuyển lời nói thành văn bản chuyên dụng cho Talk được phát hành.

## Giao diện người dùng macOS

- Nút bật/tắt trên thanh menu: **Talk**
- Thẻ cấu hình: nhóm **Chế độ Talk** (ID giọng nói + nút bật/tắt ngắt lời)
- Lớp phủ: quả cầu hiển thị dạng sóng Talk dùng chung (được chia sẻ với iOS, watchOS và Android). Trạng thái Đang nghe tuân theo mức micrô trực tiếp, trạng thái Đang nói tuân theo đường bao phát lại TTS thực tế, trạng thái Đang suy nghĩ dao động nhẹ nhàng. Nhấp vào quả cầu để tạm dừng/tiếp tục, nhấp đúp để dừng nói, nhấp vào X để thoát chế độ Talk.

## Giao diện người dùng Android

- Điều hướng chính của Android gồm **Trang chủ**, **Trò chuyện** và **Cài đặt**. Tính năng nhập liệu bằng giọng nói
  nằm trong trình soạn thảo Trò chuyện thay vì một thẻ Giọng nói riêng.
- Chạm vào micrô của trình soạn thảo để đọc chính tả trên thiết bị. Nhấn giữ để ghi
  tệp đính kèm ghi chú thoại. Bắt đầu Talk liên tục từ dạng sóng Talk.
- Đọc chính tả, ghi ghi chú thoại và Talk là các phương thức sử dụng micrô loại trừ
  lẫn nhau; việc bắt đầu một phương thức sẽ dừng hoặc chặn các phương thức còn lại.
- Talk theo thời gian thực ưu tiên micrô của tai nghe Bluetooth Classic hoặc BLE
  đang kết nối; nếu kết nối bị ngắt, ứng dụng sẽ yêu cầu một đầu vào tai nghe khác hoặc
  dự phòng sang micrô mặc định, đồng thời khôi phục tùy chọn mặc định sau khi
  dừng thu âm.
- Tính năng đọc chính tả và ghi ghi chú thoại sẽ dừng khi ứng dụng rời khỏi nền trước hoặc
  người dùng rời khỏi Trò chuyện.
- Chế độ Talk tiếp tục chạy cho đến khi bị tắt hoặc Node ngắt kết nối, đồng thời sử dụng loại dịch vụ nền trước dành cho micrô của Android khi đang hoạt động.
- Android hỗ trợ các định dạng đầu ra `pcm_16000`, `pcm_22050`, `pcm_24000` và `pcm_44100` để truyền phát `AudioTrack` với độ trễ thấp.

## Ghi chú

- Yêu cầu quyền truy cập Giọng nói + Micrô.
- Talk gốc sử dụng phiên Gateway đang hoạt động và chỉ dự phòng sang thăm dò lịch sử khi không có các sự kiện phản hồi.
- Gateway phân giải việc phát lại Talk thông qua `talk.speak` bằng nhà cung cấp Talk đang hoạt động. Android chỉ dự phòng sang TTS hệ thống cục bộ khi RPC đó không khả dụng.
- Tính năng phát lại MLX cục bộ trên macOS sử dụng trình trợ giúp `openclaw-mlx-tts` đi kèm nếu có, hoặc một tệp thực thi trên `PATH`. Đặt `OPENCLAW_MLX_TTS_BIN` để trỏ đến tệp nhị phân của trình trợ giúp tùy chỉnh trong quá trình phát triển.
- Phạm vi giá trị chỉ thị giọng nói (ElevenLabs): `stability`, `similarity` và `style` chấp nhận `0..1`; `speed` chấp nhận `0.5..2`; `latency_tier` chấp nhận `0..4`.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
