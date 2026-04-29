---
read_when:
    - Thay đổi phiên âm âm thanh hoặc xử lý phương tiện
summary: Cách âm thanh/ghi chú thoại đến được tải xuống, phiên âm và đưa vào phản hồi
title: Âm thanh và ghi chú thoại
x-i18n:
    generated_at: "2026-04-29T22:54:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Âm thanh / Ghi chú thoại (2026-01-17)

## Những gì hoạt động

- **Hiểu nội dung phương tiện (âm thanh)**: Nếu tính năng hiểu âm thanh được bật (hoặc được tự động phát hiện), OpenClaw:
  1. Định vị tệp đính kèm âm thanh đầu tiên (đường dẫn cục bộ hoặc URL) và tải xuống nếu cần.
  2. Áp dụng `maxBytes` trước khi gửi tới từng mục mô hình.
  3. Chạy mục mô hình đủ điều kiện đầu tiên theo thứ tự (nhà cung cấp hoặc CLI).
  4. Nếu thất bại hoặc bị bỏ qua (kích thước/hết thời gian), thử mục tiếp theo.
  5. Khi thành công, thay thế `Body` bằng khối `[Audio]` và đặt `{{Transcript}}`.
- **Phân tích lệnh**: Khi phiên âm thành công, `CommandBody`/`RawBody` được đặt thành bản phiên âm để các lệnh gạch chéo vẫn hoạt động.
- **Ghi nhật ký chi tiết**: Trong `--verbose`, chúng tôi ghi nhật ký khi phiên âm chạy và khi nó thay thế phần thân.

## Tự động phát hiện (mặc định)

Nếu bạn **không cấu hình mô hình** và `tools.media.audio.enabled` **không** được đặt thành `false`,
OpenClaw tự động phát hiện theo thứ tự này và dừng ở tùy chọn đầu tiên hoạt động:

1. **Mô hình trả lời đang hoạt động** khi nhà cung cấp của nó hỗ trợ hiểu âm thanh.
2. **CLI cục bộ** (nếu đã cài đặt)
   - `sherpa-onnx-offline` (yêu cầu `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
   - `whisper-cli` (từ `whisper-cpp`; dùng `WHISPER_CPP_MODEL` hoặc mô hình tiny đi kèm)
   - `whisper` (Python CLI; tự động tải xuống mô hình)
3. **Gemini CLI** (`gemini`) dùng `read_many_files`
4. **Xác thực nhà cung cấp**
   - Các mục `models.providers.*` đã cấu hình có hỗ trợ âm thanh sẽ được thử trước
   - Thứ tự dự phòng đi kèm: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Để tắt tự động phát hiện, đặt `tools.media.audio.enabled: false`.
Để tùy chỉnh, đặt `tools.media.audio.models`.
Lưu ý: Việc phát hiện tệp nhị phân là nỗ lực tốt nhất trên macOS/Linux/Windows; hãy bảo đảm CLI nằm trên `PATH` (chúng tôi mở rộng `~`), hoặc đặt một mô hình CLI rõ ràng với đường dẫn lệnh đầy đủ.

## Ví dụ cấu hình

### Dự phòng nhà cung cấp + CLI (OpenAI + Whisper CLI)

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

### Chỉ nhà cung cấp với kiểm soát phạm vi

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

### Chỉ nhà cung cấp (Deepgram)

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

### Chỉ nhà cung cấp (Mistral Voxtral)

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

### Chỉ nhà cung cấp (SenseAudio)

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

### Gửi lại bản phiên âm vào cuộc trò chuyện (chọn tham gia)

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

## Ghi chú & giới hạn

- Xác thực nhà cung cấp tuân theo thứ tự xác thực mô hình tiêu chuẩn (hồ sơ xác thực, biến môi trường, `models.providers.*.apiKey`).
- Chi tiết thiết lập Groq: [Groq](/vi/providers/groq).
- Deepgram nhận `DEEPGRAM_API_KEY` khi dùng `provider: "deepgram"`.
- Chi tiết thiết lập Deepgram: [Deepgram (phiên âm âm thanh)](/vi/providers/deepgram).
- Chi tiết thiết lập Mistral: [Mistral](/vi/providers/mistral).
- SenseAudio nhận `SENSEAUDIO_API_KEY` khi dùng `provider: "senseaudio"`.
- Chi tiết thiết lập SenseAudio: [SenseAudio](/vi/providers/senseaudio).
- Các nhà cung cấp âm thanh có thể ghi đè `baseUrl`, `headers` và `providerOptions` thông qua `tools.media.audio`.
- Giới hạn kích thước mặc định là 20MB (`tools.media.audio.maxBytes`). Âm thanh quá kích thước sẽ bị bỏ qua cho mô hình đó và mục tiếp theo sẽ được thử.
- Các tệp âm thanh nhỏ/trống dưới 1024 byte bị bỏ qua trước khi phiên âm bằng nhà cung cấp/CLI.
- `maxChars` mặc định cho âm thanh **chưa được đặt** (bản phiên âm đầy đủ). Đặt `tools.media.audio.maxChars` hoặc `maxChars` theo từng mục để cắt ngắn đầu ra.
- Mặc định tự động của OpenAI là `gpt-4o-mini-transcribe`; đặt `model: "gpt-4o-transcribe"` để có độ chính xác cao hơn.
- Dùng `tools.media.audio.attachments` để xử lý nhiều ghi chú thoại (`mode: "all"` + `maxAttachments`).
- Bản phiên âm có sẵn cho mẫu dưới dạng `{{Transcript}}`.
- `tools.media.audio.echoTranscript` mặc định tắt; bật để gửi xác nhận bản phiên âm trở lại cuộc trò chuyện gốc trước khi agent xử lý.
- `tools.media.audio.echoFormat` tùy chỉnh văn bản gửi lại (placeholder: `{transcript}`).
- stdout của CLI bị giới hạn (5MB); hãy giữ đầu ra CLI ngắn gọn.
- `args` của CLI nên dùng `{{MediaPath}}` cho đường dẫn tệp âm thanh cục bộ. Chạy `openclaw doctor --fix` để di chuyển các placeholder `{input}` không còn được khuyến nghị từ cấu hình `audio.transcription.command` cũ hơn.

### Hỗ trợ môi trường proxy

Phiên âm âm thanh dựa trên nhà cung cấp tôn trọng các biến môi trường proxy đi ra tiêu chuẩn:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Nếu không có biến môi trường proxy nào được đặt, kết nối ra trực tiếp sẽ được dùng. Nếu cấu hình proxy sai định dạng, OpenClaw ghi nhật ký cảnh báo và quay về tải trực tiếp.

## Phát hiện lượt nhắc trong nhóm

Khi `requireMention: true` được đặt cho cuộc trò chuyện nhóm, OpenClaw giờ đây phiên âm âm thanh **trước khi** kiểm tra lượt nhắc. Điều này cho phép ghi chú thoại được xử lý ngay cả khi chúng chứa lượt nhắc.

**Cách hoạt động:**

1. Nếu một tin nhắn thoại không có phần thân văn bản và nhóm yêu cầu lượt nhắc, OpenClaw thực hiện phiên âm "preflight".
2. Bản phiên âm được kiểm tra theo các mẫu lượt nhắc (ví dụ: `@BotName`, trình kích hoạt emoji).
3. Nếu tìm thấy lượt nhắc, tin nhắn đi qua toàn bộ quy trình trả lời.
4. Bản phiên âm được dùng để phát hiện lượt nhắc để ghi chú thoại có thể vượt qua cổng lượt nhắc.

**Hành vi dự phòng:**

- Nếu phiên âm thất bại trong preflight (hết thời gian, lỗi API, v.v.), tin nhắn được xử lý dựa trên phát hiện lượt nhắc chỉ bằng văn bản.
- Điều này bảo đảm rằng các tin nhắn hỗn hợp (văn bản + âm thanh) không bao giờ bị loại bỏ sai.

**Tắt theo từng nhóm/chủ đề Telegram:**

- Đặt `channels.telegram.groups.<chatId>.disableAudioPreflight: true` để bỏ qua kiểm tra lượt nhắc bằng bản phiên âm preflight cho nhóm đó.
- Đặt `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` để ghi đè theo từng chủ đề (`true` để bỏ qua, `false` để buộc bật).
- Mặc định là `false` (preflight được bật khi điều kiện có cổng lượt nhắc khớp).

**Ví dụ:** Người dùng gửi một ghi chú thoại nói "Hey @Claude, what's the weather?" trong nhóm Telegram có `requireMention: true`. Ghi chú thoại được phiên âm, lượt nhắc được phát hiện và agent trả lời.

## Những điểm cần lưu ý

- Quy tắc phạm vi dùng lượt khớp đầu tiên thắng. `chatType` được chuẩn hóa thành `direct`, `group` hoặc `room`.
- Bảo đảm CLI của bạn thoát với mã 0 và in văn bản thuần; JSON cần được xử lý qua `jq -r .text`.
- Với `parakeet-mlx`, nếu bạn truyền `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi `--output-format` là `txt` (hoặc bị bỏ qua); các định dạng đầu ra không phải `txt` quay về phân tích stdout.
- Giữ thời gian chờ hợp lý (`timeoutSeconds`, mặc định 60 giây) để tránh chặn hàng đợi trả lời.
- Phiên âm preflight chỉ xử lý tệp đính kèm âm thanh **đầu tiên** để phát hiện lượt nhắc. Âm thanh bổ sung được xử lý trong giai đoạn hiểu phương tiện chính.

## Liên quan

- [Hiểu nội dung phương tiện](/vi/nodes/media-understanding)
- [Chế độ trò chuyện](/vi/nodes/talk)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
