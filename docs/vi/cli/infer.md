---
read_when:
    - Thêm hoặc sửa đổi các lệnh `openclaw infer`
    - Thiết kế tự động hóa khả năng không giao diện ổn định
summary: CLI ưu tiên suy luận cho các quy trình làm việc về mô hình, hình ảnh, âm thanh, TTS, video, web và embedding được hỗ trợ bởi nhà cung cấp
title: CLI suy luận
x-i18n:
    generated_at: "2026-04-29T22:32:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` là bề mặt headless chuẩn cho các quy trình inference được hỗ trợ bởi nhà cung cấp.

Nó chủ ý phơi bày các nhóm năng lực, không phải tên RPC Gateway thô và không phải id công cụ agent thô.

## Biến infer thành một kỹ năng

Sao chép và dán nội dung này cho một agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Một kỹ năng dựa trên infer tốt nên:

- ánh xạ các ý định phổ biến của người dùng tới đúng lệnh con infer
- bao gồm một vài ví dụ infer chuẩn cho các quy trình mà nó bao phủ
- ưu tiên `openclaw infer ...` trong ví dụ và đề xuất
- tránh ghi lại toàn bộ bề mặt infer trong phần thân kỹ năng

Phạm vi điển hình của kỹ năng tập trung vào infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Vì sao dùng infer

`openclaw infer` cung cấp một CLI nhất quán cho các tác vụ inference được hỗ trợ bởi nhà cung cấp trong OpenClaw.

Lợi ích:

- Dùng các nhà cung cấp và mô hình đã được cấu hình trong OpenClaw thay vì nối các wrapper dùng một lần cho từng backend.
- Giữ các quy trình mô hình, hình ảnh, phiên âm âm thanh, TTS, video, web và embedding trong cùng một cây lệnh.
- Dùng dạng đầu ra `--json` ổn định cho script, tự động hóa và các quy trình do agent điều khiển.
- Ưu tiên bề mặt OpenClaw chính chủ khi tác vụ về cơ bản là "chạy inference".
- Dùng đường dẫn cục bộ thông thường mà không yêu cầu Gateway cho hầu hết lệnh infer.

Để kiểm tra nhà cung cấp từ đầu đến cuối, ưu tiên `openclaw infer ...` sau khi các bài kiểm thử nhà cung cấp cấp thấp hơn đã xanh. Nó thực thi CLI đã phát hành, tải cấu hình, phân giải agent mặc định, kích hoạt Plugin đi kèm, sửa chữa phụ thuộc runtime và runtime năng lực dùng chung trước khi yêu cầu nhà cung cấp được thực hiện.

## Cây lệnh

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Tác vụ phổ biến

Bảng này ánh xạ các tác vụ inference phổ biến tới lệnh infer tương ứng.

| Tác vụ                       | Lệnh                                                                                          | Ghi chú                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Chạy prompt văn bản/mô hình  | `openclaw infer model run --prompt "..." --json`                                              | Mặc định dùng đường dẫn cục bộ thông thường           |
| Chạy prompt mô hình trên ảnh | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Lặp lại `--file` cho nhiều đầu vào hình ảnh           |
| Tạo hình ảnh                 | `openclaw infer image generate --prompt "..." --json`                                         | Dùng `image edit` khi bắt đầu từ một tệp hiện có      |
| Mô tả tệp hình ảnh           | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` phải là `<provider/model>` có khả năng ảnh  |
| Phiên âm âm thanh            | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` phải là `<provider/model>`                  |
| Tổng hợp giọng nói           | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` hướng tới Gateway                        |
| Tạo video                    | `openclaw infer video generate --prompt "..." --json`                                         | Hỗ trợ gợi ý nhà cung cấp như `--resolution`          |
| Mô tả tệp video              | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` phải là `<provider/model>`                  |
| Tìm kiếm web                 | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Lấy một trang web            | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Tạo embedding                | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Hành vi

- `openclaw infer ...` là bề mặt CLI chính cho các quy trình này.
- Dùng `--json` khi đầu ra sẽ được tiêu thụ bởi một lệnh hoặc script khác.
- Dùng `--provider` hoặc `--model provider/model` khi cần một backend cụ thể.
- Với `image describe`, `audio transcribe` và `video describe`, `--model` phải dùng dạng `<provider/model>`.
- Với `image describe`, một `--model` tường minh sẽ chạy trực tiếp nhà cung cấp/mô hình đó. Mô hình phải có khả năng xử lý hình ảnh trong danh mục mô hình hoặc cấu hình nhà cung cấp. `codex/<model>` chạy một lượt hiểu hình ảnh có giới hạn của máy chủ ứng dụng Codex; `openai-codex/<model>` dùng đường dẫn nhà cung cấp OAuth OpenAI Codex.
- Các lệnh thực thi không trạng thái mặc định là cục bộ.
- Các lệnh trạng thái do Gateway quản lý mặc định là Gateway.
- Đường dẫn cục bộ thông thường không yêu cầu Gateway đang chạy.
- `model run` cục bộ là một completion nhà cung cấp một lần, gọn nhẹ. Nó phân giải mô hình agent và xác thực đã cấu hình, nhưng không bắt đầu lượt chat-agent, tải công cụ hoặc mở máy chủ MCP đi kèm.
- `model run --file` chấp nhận tệp hình ảnh, phát hiện loại MIME của chúng và gửi chúng cùng prompt đã cung cấp tới mô hình đã chọn. Lặp lại `--file` cho nhiều hình ảnh.
- `model run --file` từ chối đầu vào không phải hình ảnh. Dùng `infer audio transcribe` cho tệp âm thanh và `infer video describe` cho tệp video.
- `model run --gateway` thực thi định tuyến Gateway, xác thực đã lưu, lựa chọn nhà cung cấp và runtime nhúng, nhưng vẫn chạy như một phép thăm dò mô hình thô: nó gửi prompt đã cung cấp và mọi tệp đính kèm hình ảnh mà không có transcript phiên trước đó, ngữ cảnh bootstrap/AGENTS, lắp ráp context-engine, công cụ hoặc máy chủ MCP đi kèm.
- `model run --gateway --model <provider/model>` yêu cầu thông tin xác thực Gateway của operator đáng tin cậy vì yêu cầu này đề nghị Gateway chạy một override nhà cung cấp/mô hình dùng một lần.

## Mô hình

Dùng `model` cho inference văn bản được hỗ trợ bởi nhà cung cấp và kiểm tra mô hình/nhà cung cấp.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Dùng ref `<provider/model>` đầy đủ để smoke-test một nhà cung cấp cụ thể mà không khởi động Gateway hoặc tải toàn bộ bề mặt công cụ agent:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Ghi chú:

- `model run` cục bộ là smoke CLI hẹp nhất cho tình trạng nhà cung cấp/mô hình/xác thực vì nó chỉ gửi prompt đã cung cấp tới mô hình đã chọn.
- `model run --file` cục bộ giữ đường dẫn gọn nhẹ đó và đính kèm trực tiếp nội dung hình ảnh vào một tin nhắn người dùng duy nhất. Các tệp hình ảnh phổ biến như PNG, JPEG và WebP hoạt động khi loại MIME của chúng được phát hiện là `image/*`; tệp không được hỗ trợ hoặc không nhận diện được sẽ thất bại trước khi nhà cung cấp được gọi.
- `model run --file` là tốt nhất khi bạn muốn kiểm thử trực tiếp mô hình văn bản đa phương thức đã chọn. Dùng `infer image describe` khi bạn muốn lựa chọn nhà cung cấp hiểu hình ảnh của OpenClaw và định tuyến mô hình hình ảnh mặc định.
- Mô hình đã chọn phải hỗ trợ đầu vào hình ảnh; các mô hình chỉ văn bản có thể từ chối yêu cầu ở lớp nhà cung cấp.
- `model run --prompt` phải chứa văn bản không chỉ là khoảng trắng; prompt rỗng bị từ chối trước khi nhà cung cấp cục bộ hoặc Gateway được gọi.
- `model run` cục bộ thoát khác 0 khi nhà cung cấp không trả về đầu ra văn bản, nên các nhà cung cấp cục bộ không truy cập được và completion rỗng không trông giống phép thăm dò thành công.
- Dùng `model run --gateway` khi bạn cần kiểm thử định tuyến Gateway, thiết lập agent-runtime hoặc trạng thái nhà cung cấp do Gateway quản lý trong khi vẫn giữ đầu vào mô hình ở dạng thô. Dùng `openclaw agent` hoặc bề mặt chat khi bạn muốn ngữ cảnh agent đầy đủ, công cụ, bộ nhớ và transcript phiên.
- `model auth login`, `model auth logout` và `model auth status` quản lý trạng thái xác thực nhà cung cấp đã lưu.

## Hình ảnh

Dùng `image` để tạo, chỉnh sửa và mô tả.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Ghi chú:

- Dùng `image edit` khi bắt đầu từ các tệp đầu vào hiện có.
- Dùng `--size`, `--aspect-ratio` hoặc `--resolution` với `image edit` cho các nhà cung cấp/mô hình hỗ trợ gợi ý hình học trên chỉnh sửa hình ảnh tham chiếu.
- Dùng `--output-format png --background transparent` với `--model openai/gpt-image-1.5` cho đầu ra PNG OpenAI nền trong suốt; `--openai-background` vẫn có sẵn như một bí danh dành riêng cho OpenAI. Các nhà cung cấp không khai báo hỗ trợ nền sẽ báo gợi ý này là một override bị bỏ qua.
- Dùng `image providers --json` để xác minh nhà cung cấp hình ảnh đi kèm nào có thể được phát hiện, đã cấu hình, được chọn, và mỗi nhà cung cấp phơi bày những năng lực tạo/chỉnh sửa nào.
- Dùng `image generate --model <provider/model> --json` làm smoke CLI live hẹp nhất cho các thay đổi tạo hình ảnh. Ví dụ:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Phản hồi JSON báo cáo `ok`, `provider`, `model`, `attempts` và các đường dẫn
  đầu ra đã được ghi. Khi `--output` được đặt, phần mở rộng cuối cùng có thể theo
  loại MIME do nhà cung cấp trả về.

- Đối với `image describe` và `image describe-many`, dùng `--prompt` để cung cấp cho mô hình thị giác một chỉ dẫn riêng cho tác vụ như OCR, so sánh, kiểm tra giao diện người dùng hoặc tạo chú thích ngắn gọn.
- Dùng `--timeout-ms` với các mô hình thị giác cục bộ chậm hoặc khi Ollama khởi động lạnh.
- Đối với `image describe`, `--model` phải là một `<provider/model>` có khả năng xử lý hình ảnh.
- Với các mô hình thị giác Ollama cục bộ, hãy tải mô hình trước và đặt `OLLAMA_API_KEY` thành bất kỳ giá trị giữ chỗ nào, ví dụ `ollama-local`. Xem [Ollama](/vi/providers/ollama#vision-and-image-description).

## Âm thanh

Dùng `audio` để chép lời tệp.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Ghi chú:

- `audio transcribe` dùng để chép lời tệp, không phải quản lý phiên thời gian thực.
- `--model` phải là `<provider/model>`.

## TTS

Dùng `tts` để tổng hợp giọng nói và trạng thái nhà cung cấp TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Ghi chú:

- `tts status` mặc định dùng Gateway vì nó phản ánh trạng thái TTS do Gateway quản lý.
- Dùng `tts providers`, `tts voices` và `tts set-provider` để kiểm tra và cấu hình hành vi TTS.

## Video

Dùng `video` để tạo và mô tả.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Ghi chú:

- `video generate` chấp nhận `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` và `--timeout-ms`, rồi chuyển tiếp chúng đến runtime tạo video.
- `--model` phải là `<provider/model>` cho `video describe`.

## Web

Dùng `web` cho các quy trình tìm kiếm và tìm nạp.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Ghi chú:

- Dùng `web providers` để kiểm tra các nhà cung cấp hiện có, đã cấu hình và được chọn.

## Embedding

Dùng `embedding` để tạo vector và kiểm tra nhà cung cấp embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Đầu ra JSON

Các lệnh infer chuẩn hóa đầu ra JSON trong một phong bì dùng chung:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Các trường cấp cao nhất ổn định:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Đối với các lệnh tạo phương tiện, `outputs` chứa các tệp do OpenClaw ghi. Dùng
`path`, `mimeType`, `size` và mọi kích thước riêng của phương tiện trong mảng đó
để tự động hóa thay vì phân tích stdout dành cho người đọc.

## Các lỗi thường gặp

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Ghi chú

- `openclaw capability ...` là bí danh của `openclaw infer ...`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Mô hình](/vi/concepts/models)
