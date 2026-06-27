---
read_when:
    - Thay đổi phiên âm âm thanh hoặc xử lý phương tiện
summary: Cách âm thanh/ghi chú thoại gửi đến được tải xuống, phiên âm và đưa vào phản hồi
title: Âm thanh và ghi chú thoại
x-i18n:
    generated_at: "2026-06-27T17:39:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## Những gì hoạt động

- **Hiểu phương tiện (âm thanh)**: Nếu tính năng hiểu âm thanh được bật (hoặc được tự động phát hiện), OpenClaw:
  1. Định vị tệp đính kèm âm thanh đầu tiên (đường dẫn cục bộ hoặc URL) và tải xuống nếu cần.
  2. Áp dụng `maxBytes` trước khi gửi đến từng mục mô hình.
  3. Chạy mục mô hình đủ điều kiện đầu tiên theo thứ tự (nhà cung cấp hoặc CLI).
  4. Nếu thất bại hoặc bị bỏ qua (kích thước/hết thời gian), nó thử mục tiếp theo.
  5. Khi thành công, nó thay thế `Body` bằng một khối `[Audio]` và đặt `{{Transcript}}`.
- **Phân tích lệnh**: Khi phiên âm thành công, `CommandBody`/`RawBody` được đặt thành bản phiên âm để các lệnh bắt đầu bằng dấu gạch chéo vẫn hoạt động.
- **Ghi nhật ký chi tiết**: Trong `--verbose`, chúng tôi ghi nhật ký khi quá trình phiên âm chạy và khi nó thay thế nội dung.

## Tự động phát hiện (mặc định)

Nếu bạn **không cấu hình mô hình** và `tools.media.audio.enabled` **không** được đặt thành `false`,
OpenClaw tự động phát hiện theo thứ tự này và dừng ở tùy chọn hoạt động đầu tiên:

1. **Mô hình trả lời đang hoạt động** khi nhà cung cấp của nó hỗ trợ hiểu âm thanh.
2. **CLI cục bộ** (nếu đã cài đặt)
   - `sherpa-onnx-offline` (yêu cầu `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
   - `whisper-cli` (từ `whisper-cpp`; dùng `WHISPER_CPP_MODEL` hoặc mô hình tiny đi kèm)
   - `whisper` (Python CLI; tự động tải mô hình)
3. **Xác thực nhà cung cấp**
   - Các mục `models.providers.*` đã cấu hình có hỗ trợ âm thanh sẽ được thử trước
   - Thứ tự dự phòng nhà cung cấp: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Kể từ 2026-05-22, tính năng tự động phát hiện Gemini CLI không còn được hỗ trợ cho hiểu phương tiện. Google đang chuyển người dùng Gemini CLI sang Antigravity CLI; âm thanh nên dùng phiên âm cục bộ hoặc qua nhà cung cấp, còn dự phòng CLI cho hình ảnh/video nên chuyển sang Antigravity CLI (`agy`).

Để tắt tự động phát hiện, đặt `tools.media.audio.enabled: false`.
Để tùy chỉnh, đặt `tools.media.audio.models`.
Lưu ý: Việc phát hiện nhị phân là nỗ lực tối đa trên macOS/Linux/Windows; hãy đảm bảo CLI nằm trên `PATH` (chúng tôi mở rộng `~`), hoặc đặt một mô hình CLI rõ ràng với đường dẫn lệnh đầy đủ.

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

### Chỉ nhà cung cấp với giới hạn theo phạm vi

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

### Phản hồi bản phiên âm vào cuộc trò chuyện (chọn bật)

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
- Chi tiết thiết lập Deepgram: [Deepgram (phiên âm âm thanh)](/vi/providers/deepgram).
- Chi tiết thiết lập Mistral: [Mistral](/vi/providers/mistral).
- SenseAudio nhận `SENSEAUDIO_API_KEY` khi dùng `provider: "senseaudio"`.
- Chi tiết thiết lập SenseAudio: [SenseAudio](/vi/providers/senseaudio).
- Nhà cung cấp âm thanh có thể ghi đè `baseUrl`, `headers` và `providerOptions` qua `tools.media.audio`.
- Giới hạn kích thước mặc định là 20MB (`tools.media.audio.maxBytes`). Âm thanh vượt kích thước sẽ bị bỏ qua cho mô hình đó và mục tiếp theo sẽ được thử.
- Tệp âm thanh nhỏ/trống dưới 1024 byte sẽ bị bỏ qua trước khi phiên âm qua nhà cung cấp/CLI.
- `maxChars` mặc định cho âm thanh là **chưa đặt** (bản phiên âm đầy đủ). Đặt `tools.media.audio.maxChars` hoặc `maxChars` theo từng mục để cắt bớt đầu ra.
- Mặc định tự động của OpenAI là `gpt-4o-mini-transcribe`; đặt `model: "gpt-4o-transcribe"` để có độ chính xác cao hơn.
- Dùng `tools.media.audio.attachments` để xử lý nhiều ghi chú thoại (`mode: "all"` + `maxAttachments`).
- Bản phiên âm có sẵn cho mẫu dưới dạng `{{Transcript}}`.
- `tools.media.audio.echoTranscript` tắt theo mặc định; bật để gửi xác nhận bản phiên âm về cuộc trò chuyện gốc trước khi tác tử xử lý.
- `tools.media.audio.echoFormat` tùy chỉnh văn bản phản hồi (placeholder: `{transcript}`).
- stdout của CLI bị giới hạn (5MB); giữ đầu ra CLI ngắn gọn.
- `args` của CLI nên dùng `{{MediaPath}}` cho đường dẫn tệp âm thanh cục bộ. Chạy `openclaw doctor --fix` để di chuyển các placeholder `{input}` đã ngừng khuyến nghị từ cấu hình `audio.transcription.command` cũ.

### Hỗ trợ môi trường proxy

Phiên âm âm thanh dựa trên nhà cung cấp tôn trọng các biến môi trường proxy đi ra tiêu chuẩn:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Nếu không đặt biến môi trường proxy nào, kết nối đi trực tiếp sẽ được dùng. Nếu cấu hình proxy sai định dạng, OpenClaw ghi cảnh báo và quay về tải trực tiếp.

## Phát hiện nhắc đến trong nhóm

Khi `requireMention: true` được đặt cho cuộc trò chuyện nhóm, OpenClaw hiện phiên âm âm thanh **trước khi** kiểm tra các lượt nhắc đến. Điều này cho phép xử lý ghi chú thoại ngay cả khi chúng chứa lượt nhắc đến.

**Cách hoạt động:**

1. Nếu một tin nhắn thoại không có nội dung văn bản và nhóm yêu cầu lượt nhắc đến, OpenClaw thực hiện phiên âm "kiểm tra sơ bộ".
2. Bản phiên âm được kiểm tra theo các mẫu nhắc đến (ví dụ: `@BotName`, trình kích hoạt emoji).
3. Nếu tìm thấy lượt nhắc đến, tin nhắn tiếp tục đi qua toàn bộ pipeline trả lời.
4. Bản phiên âm được dùng để phát hiện lượt nhắc đến để ghi chú thoại có thể vượt qua cổng nhắc đến.

**Hành vi dự phòng:**

- Nếu phiên âm thất bại trong kiểm tra sơ bộ (hết thời gian, lỗi API, v.v.), tin nhắn được xử lý dựa trên phát hiện lượt nhắc đến chỉ bằng văn bản.
- Điều này đảm bảo các tin nhắn hỗn hợp (văn bản + âm thanh) không bao giờ bị loại bỏ sai.

**Tắt theo từng nhóm/chủ đề Telegram:**

- Đặt `channels.telegram.groups.<chatId>.disableAudioPreflight: true` để bỏ qua kiểm tra nhắc đến bằng bản phiên âm sơ bộ cho nhóm đó.
- Đặt `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` để ghi đè theo từng chủ đề (`true` để bỏ qua, `false` để buộc bật).
- Mặc định là `false` (bật kiểm tra sơ bộ khi các điều kiện có cổng nhắc đến khớp).

**Ví dụ:** Một người dùng gửi ghi chú thoại nói "Hey @Claude, what's the weather?" trong một nhóm Telegram có `requireMention: true`. Ghi chú thoại được phiên âm, lượt nhắc đến được phát hiện, và tác tử trả lời.

## Những điểm dễ vấp

- Quy tắc phạm vi dùng nguyên tắc khớp đầu tiên thắng. `chatType` được chuẩn hóa thành `direct`, `group` hoặc `room`.
- Đảm bảo CLI của bạn thoát với mã 0 và in văn bản thuần; JSON cần được xử lý qua `jq -r .text`.
- Với `parakeet-mlx`, nếu bạn truyền `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi `--output-format` là `txt` (hoặc bị bỏ qua); các định dạng đầu ra không phải `txt` quay về phân tích stdout.
- Giữ thời gian chờ hợp lý (`timeoutSeconds`, mặc định 60 giây) để tránh chặn hàng đợi trả lời.
- Phiên âm kiểm tra sơ bộ chỉ xử lý tệp đính kèm âm thanh **đầu tiên** để phát hiện lượt nhắc đến. Âm thanh bổ sung được xử lý trong giai đoạn hiểu phương tiện chính.

## Liên quan

- [Hiểu phương tiện](/vi/nodes/media-understanding)
- [Chế độ trò chuyện](/vi/nodes/talk)
- [Kích hoạt bằng giọng nói](/vi/nodes/voicewake)
