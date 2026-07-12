---
read_when:
    - Thêm hoặc sửa đổi các lệnh `openclaw infer`
    - Thiết kế cơ chế tự động hóa chức năng headless ổn định
summary: CLI ưu tiên suy luận cho các quy trình làm việc với mô hình, hình ảnh, âm thanh, TTS, video, web và embedding dựa trên nhà cung cấp
title: CLI suy luận
x-i18n:
    generated_at: "2026-07-12T07:48:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` là giao diện không giao diện đồ họa chính thức dành cho suy luận dựa trên nhà cung cấp. Lệnh này cung cấp các nhóm khả năng (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), không phải tên RPC thô của Gateway hay mã định danh công cụ của tác nhân. `openclaw capability ...` là bí danh cho cùng cây lệnh.

Các lý do nên ưu tiên lệnh này thay vì một trình bao bọc nhà cung cấp dùng một lần:

- Tái sử dụng các nhà cung cấp và mô hình đã được cấu hình trong OpenClaw.
- Cung cấp phong bì `--json` ổn định cho tập lệnh và tác vụ tự động hóa do tác nhân điều khiển (xem [Đầu ra JSON](#json-output)).
- Chạy theo đường dẫn cục bộ thông thường mà không cần Gateway đối với hầu hết các lệnh con.
- Đối với các lượt kiểm tra nhà cung cấp đầu cuối, lệnh này kiểm thử CLI đã phát hành, quá trình tải cấu hình, phân giải tác nhân mặc định, kích hoạt Plugin đi kèm và môi trường thực thi khả năng dùng chung trước khi gửi yêu cầu đến nhà cung cấp.

## Biến infer thành một skill

Sao chép và dán nội dung sau cho một tác nhân:

```text
Đọc https://docs.openclaw.ai/cli/infer, sau đó tạo một skill định tuyến các quy trình làm việc phổ biến của tôi đến `openclaw infer`.
Tập trung vào chạy mô hình, tạo hình ảnh, tạo video, phiên âm âm thanh, TTS, tìm kiếm web và embedding.
```

Một skill tốt dựa trên infer sẽ ánh xạ các ý định phổ biến của người dùng đến đúng lệnh con, bao gồm một vài ví dụ chuẩn cho mỗi quy trình làm việc, ưu tiên `openclaw infer ...` hơn các phương án cấp thấp hơn và không trình bày lại toàn bộ giao diện infer trong nội dung skill.

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` hiển thị cây này dưới dạng dữ liệu (mã định danh khả năng, phương thức truyền tải, mô tả).

## Tác vụ phổ biến

| Tác vụ                              | Lệnh                                                                                          | Ghi chú                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Chạy lời nhắc văn bản/mô hình       | `openclaw infer model run --prompt "..." --json`                                              | Mặc định chạy cục bộ                                           |
| Chạy lời nhắc mô hình trên hình ảnh | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Lặp lại `--file` cho nhiều hình ảnh                             |
| Tạo hình ảnh                        | `openclaw infer image generate --prompt "..." --json`                                         | Dùng `image edit` khi bắt đầu từ một tệp hiện có                |
| Mô tả tệp hình ảnh hoặc URL         | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` phải là `<provider/model>` có khả năng xử lý hình ảnh |
| Phiên âm âm thanh                   | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` phải là `<provider/model>`                            |
| Tổng hợp giọng nói                  | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` chỉ chạy thông qua Gateway                         |
| Tạo video                           | `openclaw infer video generate --prompt "..." --json`                                         | Hỗ trợ các gợi ý cho nhà cung cấp như `--resolution`            |
| Mô tả tệp video                     | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` phải là `<provider/model>`                            |
| Tìm kiếm trên web                   | `openclaw infer web search --query "..." --json`                                              |                                                                |
| Tải trang web                       | `openclaw infer web fetch --url https://example.com --json`                                   |                                                                |
| Tạo embedding                       | `openclaw infer embedding create --text "..." --json`                                         |                                                                |

## Hành vi

- Dùng `--json` khi đầu ra được chuyển cho một lệnh hoặc tập lệnh khác; nếu không, dùng đầu ra văn bản.
- Dùng `--provider` hoặc `--model provider/model` để cố định một phần phụ trợ cụ thể.
- Dùng `model run --thinking <level>` để ghi đè mức suy nghĩ/lập luận cho một lần chạy: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` hoặc `max`.
- Đối với `image describe`, `audio transcribe` và `video describe`, `--model` phải sử dụng dạng `<provider/model>`.
- Đối với `image describe`, `--file` chấp nhận đường dẫn cục bộ và URL HTTP(S); URL từ xa phải tuân theo chính sách SSRF tải phương tiện thông thường.
- Các lệnh thực thi không trạng thái (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) mặc định chạy cục bộ. Các lệnh trạng thái do Gateway quản lý (`tts status`) mặc định chạy qua Gateway.
- Đường dẫn cục bộ không bao giờ yêu cầu Gateway phải đang chạy.
- `model run` cục bộ là một lượt hoàn thành gọn nhẹ, dùng một lần từ nhà cung cấp: lệnh này phân giải mô hình và thông tin xác thực đã cấu hình của tác nhân nhưng không bắt đầu lượt tác nhân trò chuyện, tải công cụ hoặc mở các máy chủ MCP đi kèm.
- `model run --file` đính kèm các tệp hình ảnh (tự động phát hiện loại MIME) vào lời nhắc; lặp lại `--file` cho nhiều hình ảnh. Các tệp không phải hình ảnh sẽ bị từ chối — hãy dùng `infer audio transcribe` hoặc `infer video describe`.
- `model run --gateway` kiểm thử định tuyến Gateway, thông tin xác thực đã lưu, lựa chọn nhà cung cấp và môi trường thực thi nhúng, nhưng vẫn là phép thăm dò mô hình thô: không có bản ghi phiên trước đó, ngữ cảnh khởi tạo/AGENTS, công cụ hoặc máy chủ MCP đi kèm.
- `model run --gateway --model <provider/model>` yêu cầu thông tin xác thực Gateway của toán tử đáng tin cậy vì lệnh này yêu cầu Gateway chạy một lần với phần ghi đè nhà cung cấp/mô hình.

## Mô hình

Suy luận văn bản và kiểm tra mô hình/nhà cung cấp.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Dùng tham chiếu đầy đủ `<provider/model>` với `--local` để kiểm thử nhanh một nhà cung cấp mà không khởi động Gateway hoặc tải bề mặt công cụ của tác nhân:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Ghi chú:

- `model run` cục bộ là phép kiểm thử nhanh CLI hẹp nhất để kiểm tra tình trạng nhà cung cấp/mô hình/xác thực: đối với các nhà cung cấp không phải ChatGPT-Codex, lệnh này chỉ gửi lời nhắc được cung cấp.
- `model run --model <provider/model>` cục bộ có thể phân giải chính xác các hàng trong danh mục tĩnh đi kèm (cùng các hàng mà `openclaw models list --all` hiển thị) trước khi nhà cung cấp đó được ghi vào cấu hình. Vẫn cần xác thực nhà cung cấp; nếu thiếu thông tin xác thực, lệnh sẽ thất bại với lỗi xác thực, không phải `Unknown model`.
- Đối với các phép thăm dò lập luận của Mistral Medium 3.5, hãy để nhiệt độ không được đặt/dùng mặc định. Mistral từ chối `reasoning_effort="high"` khi `temperature: 0`; hãy dùng nhiệt độ mặc định hoặc một giá trị khác 0 như `0.7`.
- Các phép thăm dò cục bộ bằng OAuth của OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) thêm một chỉ dẫn hệ thống tối thiểu để phương thức truyền tải có thể điền trường `instructions` bắt buộc — không có ngữ cảnh tác nhân đầy đủ, công cụ, bộ nhớ hoặc bản ghi phiên.
- `model run --file` đính kèm trực tiếp nội dung hình ảnh vào một thông điệp duy nhất của người dùng. Các định dạng phổ biến (PNG, JPEG, WebP) hoạt động khi loại MIME được phát hiện là `image/*`; các tệp không được hỗ trợ hoặc không nhận dạng được sẽ thất bại trước khi gọi nhà cung cấp. Thay vào đó, hãy dùng `infer image describe` khi bạn muốn cơ chế định tuyến và dự phòng mô hình hình ảnh của OpenClaw thay vì thăm dò trực tiếp mô hình đa phương thức.
- Mô hình được chọn phải hỗ trợ đầu vào hình ảnh; các mô hình chỉ hỗ trợ văn bản có thể từ chối yêu cầu tại lớp nhà cung cấp.
- `model run --prompt` phải chứa văn bản không chỉ gồm khoảng trắng; lời nhắc trống sẽ bị từ chối trước mọi lệnh gọi đến nhà cung cấp hoặc Gateway.
- `model run` cục bộ thoát với mã khác 0 khi nhà cung cấp không trả về đầu ra văn bản, để các nhà cung cấp không thể truy cập và các lượt hoàn thành trống không bị xem như phép thăm dò thành công.
- Dùng `model run --gateway` để kiểm thử định tuyến Gateway hoặc thiết lập môi trường thực thi tác nhân trong khi vẫn giữ đầu vào mô hình ở dạng thô. Dùng `openclaw agent` hoặc một giao diện trò chuyện để có đầy đủ ngữ cảnh tác nhân, công cụ, bộ nhớ và bản ghi phiên.
- `--thinking adaptive` ánh xạ tới mức `medium` của môi trường thực thi hoàn thành; `--thinking max` ánh xạ tới `max` đối với các mô hình OpenAI hỗ trợ mức nỗ lực tối đa gốc, nếu không sẽ ánh xạ tới `xhigh`.
- `model auth login`, `model auth logout` và `model auth status` quản lý trạng thái xác thực nhà cung cấp đã lưu.

## Hình ảnh

Tạo, chỉnh sửa và mô tả.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Ghi chú:

- Dùng `image edit` khi bắt đầu từ các tệp đầu vào hiện có; `--size`, `--aspect-ratio` hoặc `--resolution` bổ sung gợi ý về kích thước hình học trên các nhà cung cấp/mô hình hỗ trợ chúng.
- `--output-format png --background transparent` cùng với `--model openai/gpt-image-1.5` tạo đầu ra PNG OpenAI có nền trong suốt; `--openai-background` là bí danh dành riêng cho OpenAI của cùng gợi ý đó. Các nhà cung cấp không khai báo hỗ trợ nền sẽ báo cáo tùy chọn ghi đè này là bị bỏ qua (xem `ignoredOverrides` trong [cấu trúc JSON](#json-output)).
- `--quality low|medium|high|auto` hoạt động với các nhà cung cấp hỗ trợ gợi ý chất lượng hình ảnh, bao gồm OpenAI. OpenAI cũng chấp nhận `--openai-moderation low|auto`.
- `image providers --json` liệt kê những nhà cung cấp hình ảnh tích hợp sẵn nào có thể được phát hiện, đã được cấu hình, được chọn, cùng các khả năng tạo/chỉnh sửa mà mỗi nhà cung cấp cung cấp.
- `image generate --model <provider/model> --json` là phép kiểm tra nhanh trực tiếp có phạm vi hẹp nhất cho các thay đổi về tạo hình ảnh:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Phản hồi báo cáo `ok`, `provider`, `model`, `attempts` và các đường dẫn đầu ra đã ghi. Khi đặt `--output`, phần mở rộng cuối cùng có thể tuân theo loại MIME do nhà cung cấp trả về.

- Với `image describe` và `image describe-many`, dùng `--prompt` cho chỉ dẫn dành riêng cho tác vụ (OCR, so sánh, kiểm tra giao diện người dùng, tạo chú thích ngắn gọn).
- Dùng `--timeout-ms` cho các mô hình thị giác cục bộ chạy chậm hoặc khi Ollama khởi động nguội.
- Với `image describe`, một `--model` được chỉ định rõ ràng (phải là `<provider/model>` có khả năng xử lý hình ảnh) sẽ chạy trước, sau đó thử các giá trị `agents.defaults.imageModel.fallbacks` đã cấu hình nếu lệnh gọi đó thất bại. Lỗi chuẩn bị đầu vào (thiếu tệp, URL không được hỗ trợ) sẽ thất bại trước mọi lần thử dự phòng, và mô hình phải có khả năng xử lý hình ảnh trong danh mục mô hình hoặc cấu hình nhà cung cấp.
- Với các mô hình thị giác Ollama cục bộ, hãy tải mô hình xuống trước và đặt `OLLAMA_API_KEY` thành một giá trị giữ chỗ bất kỳ, ví dụ `ollama-local`. Xem [Ollama](/vi/providers/ollama#vision-and-image-description).

## Âm thanh

Chuyển lời tệp âm thanh thành văn bản (không phải quản lý phiên theo thời gian thực).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` phải có dạng `<provider/model>`.

## TTS

Tổng hợp giọng nói và trạng thái nhà cung cấp/chân dung giọng nói TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Lưu ý:

- `tts status` chỉ hỗ trợ `--gateway` (nó phản ánh trạng thái TTS do Gateway quản lý).
- Dùng `tts providers`, `tts voices`, `tts personas`, `tts set-provider` và `tts set-persona` để kiểm tra và cấu hình hành vi TTS.

## Video

Tạo và mô tả.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Lưu ý:

- `video generate` chấp nhận `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` và `--timeout-ms`, rồi chuyển tiếp chúng đến môi trường thực thi tạo video.
- Với `video describe`, `--model` phải có dạng `<provider/model>`.

## Web

Tìm kiếm và truy xuất.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` liệt kê các nhà cung cấp có sẵn, đã được cấu hình và được chọn cho việc tìm kiếm và truy xuất.

## Nhúng

Tạo véc-tơ và kiểm tra nhà cung cấp mô hình nhúng.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Đầu ra JSON

Các lệnh suy luận chuẩn hóa đầu ra JSON trong một cấu trúc dùng chung:

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
- `inputs` (các tệp hình ảnh đính kèm được gửi cùng yêu cầu, khi áp dụng)
- `outputs`
- `ignoredOverrides` (các khóa gợi ý mà nhà cung cấp không hỗ trợ, khi áp dụng)
- `error`

Đối với các lệnh tạo phương tiện, `outputs` chứa các tệp do OpenClaw ghi. Để tự động hóa, hãy dùng `path`, `mimeType`, `size` và mọi kích thước dành riêng cho phương tiện trong mảng đó thay vì phân tích đầu ra chuẩn dạng văn bản dành cho người đọc.

## Những lỗi thường gặp

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

## Nội dung liên quan

- [Tham chiếu CLI](/vi/cli)
- [Mô hình](/vi/concepts/models)
