---
read_when:
    - Thay đổi cách chuyển âm thanh thành văn bản hoặc xử lý nội dung đa phương tiện
summary: Cách ghi chú âm thanh/giọng nói đến được tải xuống, chuyển thành văn bản và đưa vào câu trả lời
title: Âm thanh và tin nhắn thoại
x-i18n:
    generated_at: "2026-07-12T08:04:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Chức năng

Khi tính năng hiểu âm thanh được bật (hoặc được tự động phát hiện), OpenClaw:

1. Tìm tệp đính kèm âm thanh đầu tiên (đường dẫn cục bộ hoặc URL) và tải xuống nếu cần.
2. Áp dụng giới hạn `maxBytes` trước khi gửi đến từng mục mô hình.
3. Chạy mục mô hình đủ điều kiện đầu tiên theo thứ tự (nhà cung cấp hoặc CLI); nếu một mục gặp lỗi hoặc bị bỏ qua (do kích thước/thời gian chờ), mục tiếp theo sẽ được thử.
4. Khi thành công, thay thế `Body` bằng một khối `[Audio]` và đặt `{{Transcript}}`.

Khi phiên âm thành công, `CommandBody`/`RawBody` cũng được đặt thành bản phiên âm để các lệnh gạch chéo vẫn hoạt động. Với `--verbose`, nhật ký cho biết thời điểm phiên âm chạy và thời điểm nội dung được thay thế.

## Tự động phát hiện (mặc định)

Nếu bạn chưa cấu hình mô hình và `tools.media.audio.enabled` không phải là `false`, OpenClaw sẽ tự động phát hiện theo thứ tự sau và dừng ở tùy chọn hoạt động đầu tiên:

1. **Mô hình trả lời đang hoạt động**, khi nhà cung cấp của mô hình hỗ trợ hiểu âm thanh.
2. **Xác thực nhà cung cấp đã cấu hình** — bất kỳ mục `models.providers.*` nào có thông tin xác thực khả dụng cho một nhà cung cấp hỗ trợ phiên âm. Mục này được kiểm tra trước các CLI cục bộ, vì vậy khóa API đã cấu hình luôn được ưu tiên hơn tệp nhị phân cục bộ trên `PATH`.
   Thứ tự ưu tiên nhà cung cấp khi có nhiều nhà cung cấp được cấu hình: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **CLI cục bộ** (chỉ khi không phân giải được thông tin xác thực của nhà cung cấp). OpenClaw tạo danh sách phương án dự phòng có thứ tự:
   - `whisper-cli`, đứng trước các lựa chọn mặc định dùng CPU chỉ khi một lần gọi mô hình trước đó trong tiến trình hiện tại đã phát hiện Metal hoặc CUDA
   - `sherpa-onnx-offline` trên nhà cung cấp CPU mặc định của nó (yêu cầu `SHERPA_ONNX_MODEL_DIR` chứa `tokens.txt`, `encoder.onnx`, `decoder.onnx` và `joiner.onnx`)
   - `whisper-cli` khi Metal/CUDA chỉ có khả năng hỗ trợ ở bản dựng hoặc phần phụ trợ được chọn chưa được quan sát theo cách khác
   - `parakeet-mlx` trên Apple Silicon (có khả năng dùng MLX; việc sử dụng thiết bị vẫn chưa được quan sát)
   - `whisper` (CLI Python; tự động tải xuống các mô hình)

Nguồn gốc cài đặt/liên kết là bằng chứng về khả năng, không phải bằng chứng thực thi. Chỉ riêng điều đó không bao giờ đưa một ứng viên lên trước sherpa dùng CPU. OpenClaw không tải mô hình trong quá trình thiết lập hoặc kiểm tra trạng thái chỉ để thăm dò phần phụ trợ.
whisper.cpp được tự động phát hiện giữ nguyên nhật ký chạy mô hình thông thường để OpenClaw có thể ghi lại dòng `using … backend` từ thượng nguồn. Các mục CLI tường minh giữ nguyên cờ đầu ra đã cấu hình.

Tính năng tự động phát hiện Gemini CLI để hiểu nội dung đa phương tiện đã được thay thế bằng phương án dự phòng Antigravity CLI (`agy`) chạy trong môi trường cách ly dành cho hình ảnh/video; âm thanh không sử dụng phương án dự phòng CLI nào ngoài các tệp nhị phân cục bộ nêu trên.

Để tắt tự động phát hiện, hãy đặt `tools.media.audio.enabled: false`. Để tùy chỉnh, hãy đặt `tools.media.audio.models`.

<Note>
Việc phát hiện tệp nhị phân được thực hiện theo khả năng tốt nhất trên macOS/Linux/Windows. Hãy đảm bảo CLI nằm trên `PATH` (`~` được mở rộng), hoặc đặt một mô hình CLI tường minh với đường dẫn lệnh đầy đủ.
</Note>

Kiểm tra lựa chọn cục bộ mà không phiên âm:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Bảng kiểm kê nhà cung cấp báo cáo riêng phương án dự phòng cục bộ được chọn so với lựa chọn nhà cung cấp toàn cục, cùng các trường phần phụ trợ có khả năng, được yêu cầu và đã quan sát. Sau khi phiên âm chạy, `/status` báo cáo phần phụ trợ được yêu cầu hoặc đã quan sát trong dòng phương tiện. Các mục CLI tường minh trong `tools.media.audio.models` vẫn bỏ qua quá trình tự động lựa chọn; hãy dùng các cờ dành riêng cho phần phụ trợ, chẳng hạn như `--provider=cuda` của sherpa hoặc `--no-gpu`/`--device` của whisper.cpp.

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
          { provider: "openai", model: "gpt-4o-transcribe" },
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

### Chỉ nhà cung cấp với kiểm soát theo phạm vi

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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### Gửi lại bản phiên âm vào cuộc trò chuyện (tùy chọn bật)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // mặc định là false
        echoFormat: '📝 "{transcript}"', // tùy chọn, hỗ trợ {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Lưu ý và giới hạn

- Xác thực nhà cung cấp tuân theo thứ tự xác thực mô hình tiêu chuẩn (hồ sơ xác thực, biến môi trường, `models.providers.*.apiKey`).
- Chi tiết thiết lập Groq: [Groq](/vi/providers/groq).
- Deepgram sử dụng `DEEPGRAM_API_KEY` khi dùng `provider: "deepgram"`. Chi tiết thiết lập: [Deepgram](/vi/providers/deepgram).
- Chi tiết thiết lập Mistral: [Mistral](/vi/providers/mistral).
- SenseAudio sử dụng `SENSEAUDIO_API_KEY` khi dùng `provider: "senseaudio"`. Chi tiết thiết lập: [SenseAudio](/vi/providers/senseaudio).
- Các nhà cung cấp âm thanh có thể ghi đè `baseUrl`, `headers` và `providerOptions` thông qua `tools.media.audio`.
- Giới hạn kích thước mặc định là 20MB (`tools.media.audio.maxBytes`). Âm thanh vượt quá kích thước sẽ bị bỏ qua đối với mô hình đó và mục tiếp theo sẽ được thử.
- Các tệp âm thanh nhỏ hơn 1024 byte bị bỏ qua trước khi phiên âm bằng nhà cung cấp/CLI.
- `maxChars` mặc định cho âm thanh **không được đặt** (bản phiên âm đầy đủ). Đặt `tools.media.audio.maxChars` hoặc `maxChars` cho từng mục để cắt ngắn đầu ra.
- Giá trị tự động phát hiện mặc định của OpenAI là `gpt-4o-transcribe`; đặt `model: "gpt-4o-mini-transcribe"` để có tùy chọn rẻ hơn/nhanh hơn.
- Dùng `tools.media.audio.attachments` để xử lý nhiều ghi chú thoại (`mode: "all"` cùng `maxAttachments`, mặc định là 1).
- Bản phiên âm có sẵn cho các mẫu dưới dạng `{{Transcript}}`.
- `tools.media.audio.echoTranscript` mặc định bị tắt; bật tùy chọn này để gửi xác nhận bản phiên âm trở lại cuộc trò chuyện nguồn trước khi tác nhân xử lý.
- `tools.media.audio.echoFormat` tùy chỉnh văn bản gửi lại (phần giữ chỗ: `{transcript}`; mặc định `📝 "{transcript}"`).
- Đầu ra chuẩn của CLI bị giới hạn ở 5MB; hãy giữ đầu ra CLI ngắn gọn.
- `args` của CLI nên dùng `{{MediaPath}}` cho đường dẫn tệp âm thanh cục bộ. Chạy `openclaw doctor --fix` để di chuyển các phần giữ chỗ `{input}` đã ngừng dùng từ cấu hình `audio.transcription.command` cũ (khóa đã ngừng dùng: `audio.transcription`, được thay bằng `tools.media.audio.models`).
- `tools.media.concurrency` giới hạn các tác vụ đa phương tiện; đây không phải là bộ lập lịch GPU.

### STT cục bộ thường trú

STT cục bộ được tự động phát hiện vẫn dùng một tiến trình cho mỗi yêu cầu. OpenClaw hiện không quản lý máy chủ whisper.cpp thường trú vì gói Homebrew `whisper-cpp` tiêu chuẩn vô hiệu hóa máy chủ đó, trong khi ví dụ thượng nguồn không có hàng đợi tiếp nhận có giới hạn đã cấu hình. Một vòng đời thường trú do Plugin sở hữu cần một tiến trình xử lý đóng gói được duy trì, có kiểm tra tình trạng/khởi động, duy trì mô hình trong bộ nhớ, hàng đợi có giới hạn, hủy/thời gian chờ, hoạt động không xác thực chỉ trên local loopback và không có phương án dự phòng lên đám mây trước khi có thể được bật một cách an toàn.

### Hỗ trợ môi trường proxy

Phiên âm dựa trên nhà cung cấp tuân thủ các biến môi trường proxy đầu ra tiêu chuẩn, phù hợp với ngữ nghĩa `EnvHttpProxyAgent` của undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Các biến chữ thường được ưu tiên hơn chữ hoa; các mục `NO_PROXY`/`no_proxy` (tên máy chủ, `*.suffix` hoặc `host:port`) bỏ qua proxy. Nếu không đặt biến môi trường proxy nào, kết nối ra trực tiếp sẽ được sử dụng. Nếu thiết lập proxy thất bại (URL sai định dạng), OpenClaw ghi cảnh báo và quay về tải trực tiếp.

## Phát hiện lượt nhắc trong nhóm

Trên các kênh hỗ trợ kiểm tra sơ bộ âm thanh, OpenClaw phiên âm **trước khi** kiểm tra lượt nhắc khi `requireMention: true` được đặt cho cuộc trò chuyện nhóm. Điều này cho phép ghi chú thoại không có chú thích vượt qua cổng yêu cầu lượt nhắc khi bản phiên âm chứa mẫu lượt nhắc đã cấu hình. Tài liệu dành riêng cho từng kênh mô tả các phương thức truyền tải yêu cầu lượt nhắc được nhập bằng văn bản.

**Cách hoạt động:**

1. Nếu tin nhắn thoại không có nội dung văn bản và nhóm yêu cầu lượt nhắc, OpenClaw thực hiện phiên âm sơ bộ tệp đính kèm âm thanh đầu tiên.
2. Bản phiên âm được kiểm tra để tìm các mẫu lượt nhắc (ví dụ `@BotName`, trình kích hoạt bằng emoji).
3. Nếu tìm thấy lượt nhắc, tin nhắn tiếp tục qua toàn bộ quy trình phản hồi.

**Hành vi dự phòng:** nếu phiên âm sơ bộ thất bại (hết thời gian chờ, lỗi API, v.v.), tin nhắn quay về cơ chế phát hiện lượt nhắc chỉ dựa trên văn bản để các tin nhắn hỗn hợp (văn bản + âm thanh) không bao giờ bị loại bỏ.

**Tắt theo từng nhóm/chủ đề Telegram:**

- Đặt `channels.telegram.groups.<chatId>.disableAudioPreflight: true` để bỏ qua kiểm tra lượt nhắc bằng bản phiên âm sơ bộ cho nhóm đó.
- Đặt `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` để ghi đè theo từng chủ đề (`true` để bỏ qua, `false` để buộc bật).
- Mặc định là `false` (kiểm tra sơ bộ được bật khi các điều kiện yêu cầu lượt nhắc khớp).

**Ví dụ:** một người dùng gửi ghi chú thoại với nội dung "Này @Claude, thời tiết thế nào?" trong một nhóm Telegram có `requireMention: true`. Ghi chú thoại được phiên âm, lượt nhắc được phát hiện và tác nhân trả lời.

## Các điểm cần lưu ý

- Các quy tắc phạm vi áp dụng quy tắc khớp đầu tiên; `chatType` được chuẩn hóa thành `direct`, `group` hoặc `channel`.
- Đảm bảo CLI của bạn thoát với mã 0 và in văn bản thuần túy; đầu ra JSON cần được xử lý qua `jq -r .text`.
- Các chế độ đầu ra tệp đã biết có tính quyết định: tệp phiên âm được suy luận nhưng trống hoặc thiếu sẽ không tạo bản phiên âm, thay vì quay về đầu ra tiến trình của CLI.
- Với `parakeet-mlx`, hãy dùng `--output-format txt` (hoặc `all`) cùng `--output-dir` và mẫu đầu ra `{filename}` mặc định. Các biến môi trường `PARAKEET_OUTPUT_FORMAT` và `PARAKEET_OUTPUT_TEMPLATE` từ thượng nguồn cũng được hỗ trợ. OpenClaw đọc `<output-dir>/<media-basename>.txt`; định dạng `srt` mặc định, các định dạng khác và mẫu đầu ra tùy chỉnh tiếp tục sử dụng đầu ra chuẩn.
- Giữ thời gian chờ ở mức hợp lý (`timeoutSeconds`, mặc định 60 giây) để tránh chặn hàng đợi phản hồi.
- Phiên âm sơ bộ chỉ xử lý tệp đính kèm âm thanh **đầu tiên** để phát hiện lượt nhắc. Các tệp đính kèm âm thanh bổ sung được xử lý trong giai đoạn hiểu nội dung đa phương tiện chính.

## Liên quan

- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
- [Chế độ trò chuyện](/vi/nodes/talk)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
