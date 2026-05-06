---
read_when:
    - Thay đổi cách phiên âm âm thanh hoặc xử lý phương tiện
summary: Cách ghi chú âm thanh/giọng nói đến được tải xuống, phiên âm và đưa vào câu trả lời
title: Âm thanh và ghi chú thoại
x-i18n:
    generated_at: "2026-05-06T17:57:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## Những gì hoạt động

- **Hiểu phương tiện (âm thanh)**: Nếu tính năng hiểu âm thanh được bật (hoặc được tự động phát hiện), OpenClaw:
  1. Tìm tệp đính kèm âm thanh đầu tiên (đường dẫn cục bộ hoặc URL) và tải xuống nếu cần.
  2. Áp dụng `maxBytes` trước khi gửi đến từng mục mô hình.
  3. Chạy mục mô hình đủ điều kiện đầu tiên theo thứ tự (nhà cung cấp hoặc CLI).
  4. Nếu thất bại hoặc bị bỏ qua (kích thước/hết thời gian), nó thử mục tiếp theo.
  5. Khi thành công, nó thay thế `Body` bằng một khối `[Audio]` và đặt `{{Transcript}}`.
- **Phân tích lệnh**: Khi chép lời thành công, `CommandBody`/`RawBody` được đặt thành bản chép lời để các lệnh gạch chéo vẫn hoạt động.
- **Ghi nhật ký chi tiết**: Trong `--verbose`, chúng tôi ghi nhật ký khi quá trình chép lời chạy và khi nó thay thế phần thân.

## Tự động phát hiện (mặc định)

Nếu bạn **không cấu hình mô hình** và `tools.media.audio.enabled` **không** được đặt thành `false`,
OpenClaw tự động phát hiện theo thứ tự này và dừng ở tùy chọn hoạt động đầu tiên:

1. **Mô hình trả lời đang hoạt động** khi nhà cung cấp của nó hỗ trợ hiểu âm thanh.
2. **CLI cục bộ** (nếu đã cài đặt)
   - `sherpa-onnx-offline` (yêu cầu `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
   - `whisper-cli` (từ `whisper-cpp`; dùng `WHISPER_CPP_MODEL` hoặc mô hình tiny đi kèm)
   - `whisper` (CLI Python; tự động tải xuống mô hình)
3. **Gemini CLI** (`gemini`) dùng `read_many_files`
4. **Xác thực nhà cung cấp**
   - Các mục `models.providers.*` đã cấu hình có hỗ trợ âm thanh sẽ được thử trước
   - Thứ tự dự phòng đi kèm: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Để tắt tự động phát hiện, đặt `tools.media.audio.enabled: false`.
Để tùy chỉnh, đặt `tools.media.audio.models`.
Lưu ý: Phát hiện tệp nhị phân là nỗ lực tốt nhất trên macOS/Linux/Windows; hãy đảm bảo CLI nằm trên `PATH` (chúng tôi mở rộng `~`), hoặc đặt một mô hình CLI rõ ràng với đường dẫn lệnh đầy đủ.

## Ví dụ cấu hình

### Nhà cung cấp + CLI dự phòng (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Chỉ dùng nhà cung cấp với kiểm soát theo phạm vi

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Chỉ dùng nhà cung cấp (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Chỉ dùng nhà cung cấp (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Chỉ dùng nhà cung cấp (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Phản hồi bản chép lời vào cuộc trò chuyện (tùy chọn bật)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Ghi chú và giới hạn

- Xác thực nhà cung cấp tuân theo thứ tự xác thực mô hình tiêu chuẩn (hồ sơ xác thực, biến môi trường, `models.providers.*.apiKey`).
- Chi tiết thiết lập Groq: [Groq](/vi/providers/groq).
- Deepgram nhận `DEEPGRAM_API_KEY` khi dùng `provider: "deepgram"`.
- Chi tiết thiết lập Deepgram: [Deepgram (chép lời âm thanh)](/vi/providers/deepgram).
- Chi tiết thiết lập Mistral: [Mistral](/vi/providers/mistral).
- SenseAudio nhận `SENSEAUDIO_API_KEY` khi dùng `provider: "senseaudio"`.
- Chi tiết thiết lập SenseAudio: [SenseAudio](/vi/providers/senseaudio).
- Các nhà cung cấp âm thanh có thể ghi đè `baseUrl`, `headers` và `providerOptions` qua `tools.media.audio`.
- Giới hạn kích thước mặc định là 20MB (`tools.media.audio.maxBytes`). Âm thanh quá kích thước sẽ bị bỏ qua cho mô hình đó và mục tiếp theo sẽ được thử.
- Các tệp âm thanh rất nhỏ/trống dưới 1024 byte sẽ bị bỏ qua trước khi chép lời bằng nhà cung cấp/CLI.
- `maxChars` mặc định cho âm thanh là **chưa đặt** (toàn bộ bản chép lời). Đặt `tools.media.audio.maxChars` hoặc `maxChars` theo từng mục để cắt gọn đầu ra.
- Mặc định tự động của OpenAI là `gpt-4o-mini-transcribe`; đặt `model: "gpt-4o-transcribe"` để có độ chính xác cao hơn.
- Dùng `tools.media.audio.attachments` để xử lý nhiều ghi chú thoại (`mode: "all"` + `maxAttachments`).
- Bản chép lời có sẵn cho mẫu dưới dạng `{{Transcript}}`.
- `tools.media.audio.echoTranscript` mặc định tắt; bật nó để gửi xác nhận bản chép lời về cuộc trò chuyện gốc trước khi agent xử lý.
- `tools.media.audio.echoFormat` tùy chỉnh văn bản phản hồi (placeholder: `{transcript}`).
- stdout của CLI bị giới hạn (5MB); giữ đầu ra CLI ngắn gọn.
- `args` của CLI nên dùng `{{MediaPath}}` cho đường dẫn tệp âm thanh cục bộ. Chạy `openclaw doctor --fix` để di chuyển các placeholder `{input}` đã ngừng dùng từ cấu hình `audio.transcription.command` cũ hơn.

### Hỗ trợ môi trường proxy

Chép lời âm thanh dựa trên nhà cung cấp tôn trọng các biến môi trường proxy gửi ra tiêu chuẩn:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Nếu không đặt biến môi trường proxy nào, kết nối ra trực tiếp sẽ được dùng. Nếu cấu hình proxy sai định dạng, OpenClaw ghi cảnh báo và quay về tải trực tiếp.

## Phát hiện nhắc đến trong nhóm

Khi `requireMention: true` được đặt cho cuộc trò chuyện nhóm, OpenClaw hiện chép lời âm thanh **trước khi** kiểm tra các lượt nhắc. Điều này cho phép xử lý ghi chú thoại ngay cả khi chúng chứa lượt nhắc.

**Cách hoạt động:**

1. Nếu một tin nhắn thoại không có phần thân văn bản và nhóm yêu cầu lượt nhắc, OpenClaw thực hiện chép lời "preflight".
2. Bản chép lời được kiểm tra theo các mẫu nhắc đến (ví dụ: `@BotName`, kích hoạt bằng emoji).
3. Nếu tìm thấy lượt nhắc, tin nhắn tiếp tục đi qua toàn bộ quy trình trả lời.
4. Bản chép lời được dùng để phát hiện lượt nhắc để ghi chú thoại có thể vượt qua cổng lượt nhắc.

**Hành vi dự phòng:**

- Nếu chép lời thất bại trong preflight (hết thời gian, lỗi API, v.v.), tin nhắn được xử lý dựa trên phát hiện lượt nhắc chỉ bằng văn bản.
- Điều này đảm bảo rằng các tin nhắn hỗn hợp (văn bản + âm thanh) không bao giờ bị loại bỏ sai.

**Tắt theo từng nhóm/chủ đề Telegram:**

- Đặt `channels.telegram.groups.<chatId>.disableAudioPreflight: true` để bỏ qua kiểm tra lượt nhắc bằng bản chép lời preflight cho nhóm đó.
- Đặt `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` để ghi đè theo từng chủ đề (`true` để bỏ qua, `false` để buộc bật).
- Mặc định là `false` (preflight được bật khi điều kiện có cổng lượt nhắc khớp).

**Ví dụ:** Một người dùng gửi ghi chú thoại nói "Hey @Claude, what's the weather?" trong một nhóm Telegram với `requireMention: true`. Ghi chú thoại được chép lời, lượt nhắc được phát hiện, và agent trả lời.

## Những điểm dễ vấp

- Quy tắc phạm vi dùng khớp đầu tiên sẽ thắng. `chatType` được chuẩn hóa thành `direct`, `group` hoặc `room`.
- Đảm bảo CLI của bạn thoát với mã 0 và in văn bản thuần; JSON cần được xử lý qua `jq -r .text`.
- Với `parakeet-mlx`, nếu bạn truyền `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi `--output-format` là `txt` (hoặc bị bỏ qua); các định dạng đầu ra không phải `txt` quay về phân tích stdout.
- Giữ thời gian chờ hợp lý (`timeoutSeconds`, mặc định 60 giây) để tránh chặn hàng đợi trả lời.
- Chép lời preflight chỉ xử lý tệp đính kèm âm thanh **đầu tiên** để phát hiện lượt nhắc. Âm thanh bổ sung được xử lý trong giai đoạn hiểu phương tiện chính.

## Liên quan

- [Hiểu phương tiện](/vi/nodes/media-understanding)
- [Chế độ trò chuyện](/vi/nodes/talk)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
