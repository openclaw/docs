---
read_when:
    - Thêm hoặc sửa đổi các lệnh `openclaw infer`
    - Thiết kế tự động hóa năng lực headless ổn định
summary: CLI ưu tiên suy luận cho các quy trình làm việc với mô hình, hình ảnh, âm thanh, TTS, video, web và embedding do nhà cung cấp hỗ trợ
title: CLI suy luận
x-i18n:
    generated_at: "2026-07-19T05:40:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3147bb516a08e12c4eacd6bd527af62049ecae25b5fde9439da6a4431c147b07
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` là bề mặt headless chuẩn cho suy luận dựa trên nhà cung cấp. Nó cung cấp các nhóm khả năng (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), thay vì tên RPC thô của Gateway hoặc mã định danh công cụ của tác tử. `openclaw capability ...` là bí danh cho cùng một cây lệnh.

Lý do nên ưu tiên nó thay vì một trình bao bọc dùng một lần cho nhà cung cấp:

- Tái sử dụng các nhà cung cấp và mô hình đã được cấu hình trong OpenClaw.
- Cấu trúc bao `--json` ổn định dành cho tập lệnh và tự động hóa do tác tử điều khiển (xem [Đầu ra JSON](#json-output)).
- Chạy theo đường dẫn cục bộ thông thường mà không cần Gateway đối với hầu hết các lệnh con.
- Đối với các bước kiểm tra nhà cung cấp đầu cuối, nó thực thi CLI đã phát hành, quá trình tải cấu hình, phân giải tác tử mặc định, kích hoạt Plugin đi kèm và môi trường thực thi khả năng dùng chung trước khi yêu cầu được gửi đến nhà cung cấp.

## Biến infer thành một skill

Sao chép và dán nội dung này cho một tác tử:

```text
Đọc https://docs.openclaw.ai/cli/infer, sau đó tạo một skill định tuyến các quy trình làm việc phổ biến của tôi đến `openclaw infer`.
Tập trung vào chạy mô hình, tạo hình ảnh, tạo video, phiên âm âm thanh, TTS, tìm kiếm web và embedding.
```

Một skill tốt dựa trên infer sẽ ánh xạ các ý định phổ biến của người dùng tới đúng lệnh con, bao gồm một vài ví dụ chuẩn cho mỗi quy trình làm việc, ưu tiên `openclaw infer ...` hơn các phương án cấp thấp hơn và không trình bày lại toàn bộ bề mặt infer trong nội dung skill.

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

| Tác vụ                          | Lệnh                                                                                       | Ghi chú                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Chạy một lời nhắc văn bản/mô hình       | `openclaw infer model run --prompt "..." --json`                                              | Mặc định chạy cục bộ                                      |
| Chạy lời nhắc mô hình trên hình ảnh  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Lặp lại `--file` cho nhiều hình ảnh                   |
| Tạo hình ảnh             | `openclaw infer image generate --prompt "..." --json`                                         | Dùng `image edit` khi bắt đầu từ một tệp hiện có  |
| Mô tả tệp hình ảnh hoặc URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` phải là `<provider/model>` có khả năng xử lý hình ảnh |
| Phiên âm âm thanh              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` phải là `<provider/model>`                  |
| Tổng hợp giọng nói             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` chỉ chạy thông qua Gateway            |
| Tạo video              | `openclaw infer video generate --prompt "..." --json`                                         | Hỗ trợ gợi ý nhà cung cấp như `--resolution`        |
| Mô tả tệp video         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` phải là `<provider/model>`                  |
| Tìm kiếm trên web                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Tải trang web              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Tạo embedding             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Hành vi

- Dùng `--json` khi đầu ra được chuyển cho một lệnh hoặc tập lệnh khác; nếu không, dùng đầu ra văn bản.
- Dùng `--provider` hoặc `--model provider/model` để cố định một backend cụ thể.
- Dùng `model run --thinking <level>` để ghi đè chế độ suy nghĩ/lập luận cho một lần chạy: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` hoặc `max`.
- Đối với `image describe`, `audio transcribe` và `video describe`, `--model` phải có dạng `<provider/model>`.
- Đối với `image describe`, `--file` chấp nhận đường dẫn cục bộ và URL HTTP(S); URL từ xa tuân theo chính sách SSRF tìm nạp phương tiện thông thường.
- Các lệnh thực thi không trạng thái (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) mặc định chạy cục bộ. Các lệnh trạng thái do Gateway quản lý (`tts status`) mặc định chạy qua Gateway.
- Đường dẫn cục bộ không bao giờ yêu cầu Gateway phải đang chạy.
- `model run` cục bộ là một lần hoàn tất gọn nhẹ trực tiếp với nhà cung cấp: nó phân giải mô hình và thông tin xác thực đã cấu hình của tác tử nhưng không bắt đầu một lượt tác tử trò chuyện, tải công cụ hoặc mở các máy chủ MCP đi kèm.
- `model run --file` đính kèm tệp hình ảnh (tự động phát hiện loại MIME) vào lời nhắc; lặp lại `--file` cho nhiều hình ảnh. Các tệp không phải hình ảnh sẽ bị từ chối — thay vào đó, hãy dùng `infer audio transcribe` hoặc `infer video describe`.
- `model run --gateway` thực thi định tuyến Gateway, thông tin xác thực đã lưu, lựa chọn nhà cung cấp và môi trường thực thi nhúng, nhưng vẫn là phép thăm dò mô hình thô: không có bản chép lời phiên trước đó, ngữ cảnh bootstrap/AGENTS, công cụ hoặc máy chủ MCP đi kèm.
- `model run --gateway --model <provider/model>` yêu cầu thông tin xác thực Gateway của người vận hành đáng tin cậy vì nó yêu cầu Gateway chạy một lần ghi đè nhà cung cấp/mô hình.

## Mô hình

Suy luận văn bản và kiểm tra mô hình/nhà cung cấp.

```bash
openclaw infer model run --prompt "Chỉ trả lời chính xác: smoke-ok" --json
openclaw infer model run --prompt "Tóm tắt mục nhật ký thay đổi này" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Mô tả hình ảnh này trong một câu" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Suy luận kỹ hơn ở đây" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Dùng tham chiếu `<provider/model>` đầy đủ với `--local` để kiểm tra nhanh một nhà cung cấp mà không khởi động Gateway hoặc tải bề mặt công cụ của tác tử:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Chỉ trả lời chính xác: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Chỉ trả lời chính xác: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Chỉ trả lời chính xác: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Chỉ trả lời chính xác: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Chỉ trả lời chính xác: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Chỉ trả lời chính xác: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Chỉ trả lời chính xác: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Mô tả hình ảnh này." --file ./photo.jpg --json
```

Ghi chú:

- `model run` cục bộ là phép kiểm tra nhanh CLI có phạm vi hẹp nhất về tình trạng nhà cung cấp/mô hình/xác thực: đối với các nhà cung cấp không phải ChatGPT-Codex, nó chỉ gửi lời nhắc được cung cấp.
- `model run --model <provider/model>` cục bộ có thể phân giải chính xác các hàng trong danh mục tĩnh đi kèm (cùng các hàng mà `openclaw models list --all` hiển thị) trước khi nhà cung cấp đó được ghi vào cấu hình. Vẫn cần xác thực nhà cung cấp; nếu thiếu thông tin xác thực, lệnh sẽ thất bại với lỗi xác thực, không phải `Unknown model`.
- Đối với các phép thăm dò lập luận Mistral Medium 3.5, hãy để nhiệt độ không được đặt/mặc định. Mistral từ chối `reasoning_effort="high"` với `temperature: 0`; hãy dùng nhiệt độ mặc định hoặc một giá trị khác 0 như `0.7`.
- Các phép thăm dò cục bộ bằng OAuth OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) thêm một chỉ dẫn hệ thống tối thiểu để phương thức truyền tải có thể điền trường `instructions` bắt buộc — không có đầy đủ ngữ cảnh tác tử, công cụ, bộ nhớ hoặc bản chép lời phiên.
- `model run --file` đính kèm nội dung hình ảnh trực tiếp vào tin nhắn duy nhất của người dùng. Các định dạng phổ biến (PNG, JPEG, WebP) hoạt động khi loại MIME được phát hiện là `image/*`; các tệp không được hỗ trợ hoặc không nhận dạng được sẽ thất bại trước khi gọi nhà cung cấp. Thay vào đó, hãy dùng `infer image describe` khi bạn muốn sử dụng cơ chế định tuyến và dự phòng mô hình hình ảnh của OpenClaw thay vì thăm dò trực tiếp mô hình đa phương thức.
- Mô hình được chọn phải hỗ trợ đầu vào hình ảnh; các mô hình chỉ hỗ trợ văn bản có thể từ chối yêu cầu ở tầng nhà cung cấp.
- `model run --prompt` phải chứa văn bản không chỉ gồm khoảng trắng; lời nhắc trống bị từ chối trước mọi lệnh gọi nhà cung cấp hoặc Gateway.
- `model run` cục bộ thoát với mã khác 0 khi nhà cung cấp không trả về đầu ra văn bản, nhờ đó nhà cung cấp không thể truy cập và kết quả hoàn tất trống không bị xem nhầm là phép thăm dò thành công.
- Dùng `model run --gateway` để kiểm tra định tuyến Gateway hoặc thiết lập môi trường thực thi tác tử trong khi vẫn giữ nguyên đầu vào mô hình ở dạng thô. Dùng `openclaw agent` hoặc một bề mặt trò chuyện để có đầy đủ ngữ cảnh tác tử, công cụ, bộ nhớ và bản chép lời phiên.
- `--thinking adaptive` ánh xạ tới `medium` ở cấp môi trường thực thi hoàn tất; `--thinking max` ánh xạ tới `max` đối với các mô hình OpenAI hỗ trợ mức nỗ lực tối đa gốc, nếu không thì ánh xạ tới `xhigh`.
- `model auth login`, `model auth logout` và `model auth status` quản lý trạng thái xác thực nhà cung cấp đã lưu.

## Hình ảnh

Tạo, chỉnh sửa và mô tả.

```bash
openclaw infer image generate --prompt "hình minh họa tôm hùm thân thiện" --json
openclaw infer image generate --prompt "ảnh sản phẩm tai nghe mang phong cách điện ảnh" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "nhãn dán hình tròn màu đỏ đơn giản trên nền trong suốt" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "bản nháp áp phích chi phí thấp" --json
openclaw infer image generate --prompt "backend hình ảnh chậm" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "giữ nguyên logo, xóa nền" --json
openclaw infer image edit --file ./poster.png --prompt "biến nội dung này thành quảng cáo story dọc" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Trích xuất tên người bán, ngày và tổng số tiền" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "So sánh các ảnh chụp màn hình và liệt kê những thay đổi UI có thể nhìn thấy" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Mô tả hình ảnh trong một câu" --timeout-ms 300000 --json
```

Ghi chú:

- Sử dụng `image edit` khi bắt đầu từ các tệp đầu vào hiện có; `--size`, `--aspect-ratio` hoặc `--resolution` thêm gợi ý hình học trên các nhà cung cấp/mô hình hỗ trợ chúng.
- `--output-format png --background transparent` cùng với `--model openai/gpt-image-1.5` tạo đầu ra PNG OpenAI có nền trong suốt; `--openai-background` là bí danh dành riêng cho OpenAI cho cùng gợi ý đó. Các nhà cung cấp không khai báo hỗ trợ nền sẽ báo cáo gợi ý này là một giá trị ghi đè bị bỏ qua (xem `ignoredOverrides` trong [phong bì JSON](#json-output)).
- `--quality low|medium|high|auto` hoạt động với các nhà cung cấp hỗ trợ gợi ý chất lượng hình ảnh, bao gồm OpenAI. OpenAI cũng chấp nhận `--openai-moderation low|auto`.
- `image providers --json` liệt kê các nhà cung cấp hình ảnh đi kèm nào có thể được phát hiện, đã được cấu hình, được chọn và những khả năng tạo/chỉnh sửa mà mỗi nhà cung cấp cung cấp.
- `image generate --model <provider/model> --json` là phép kiểm tra nhanh trực tiếp có phạm vi hẹp nhất cho các thay đổi về tạo hình ảnh:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image \
    --prompt "Hình ảnh thử nghiệm phẳng tối giản: một hình vuông màu xanh lam trên nền trắng, không có chữ." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Phản hồi báo cáo `ok`, `provider`, `model`, `attempts` và các đường dẫn đầu ra đã ghi. Khi `--output` được đặt, phần mở rộng cuối cùng có thể tuân theo kiểu MIME do nhà cung cấp trả về.

- Đối với `image describe` và `image describe-many`, hãy sử dụng `--prompt` cho một chỉ dẫn dành riêng cho tác vụ (OCR, so sánh, kiểm tra giao diện người dùng, tạo chú thích ngắn gọn).
- Sử dụng `--timeout-ms` cho các mô hình thị giác cục bộ chậm hoặc lần khởi động nguội của Ollama.
- Đối với `image describe`, một `--model` được chỉ định rõ ràng (phải là một `<provider/model>` có khả năng xử lý hình ảnh) sẽ chạy trước, sau đó thử `agents.defaults.imageModel.fallbacks` đã cấu hình nếu lệnh gọi đó thất bại. Các lỗi chuẩn bị đầu vào (thiếu tệp, URL không được hỗ trợ) sẽ thất bại trước bất kỳ lần thử dự phòng nào, và mô hình phải có khả năng xử lý hình ảnh trong danh mục mô hình hoặc cấu hình nhà cung cấp.
- Đối với các mô hình thị giác Ollama cục bộ, trước tiên hãy kéo mô hình xuống và đặt `OLLAMA_API_KEY` thành bất kỳ giá trị giữ chỗ nào, ví dụ `ollama-local`. Xem [Ollama](/vi/providers/ollama#vision-and-image-description).

## Âm thanh

Chuyển lời tệp thành văn bản (không phải quản lý phiên theo thời gian thực).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Tập trung vào tên và các mục hành động" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` phải là `<provider/model>`.

## TTS

Tổng hợp giọng nói và trạng thái nhà cung cấp/chân dung giọng nói TTS.

```bash
openclaw infer tts convert --text "xin chào từ openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Bản dựng của bạn đã hoàn tất" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Ghi chú:

- `tts status` chỉ hỗ trợ `--gateway` (nó phản ánh trạng thái TTS do Gateway quản lý).
- Sử dụng `tts providers`, `tts voices`, `tts personas`, `tts set-provider` và `tts set-persona` để kiểm tra và cấu hình hành vi TTS.

## Video

Tạo và mô tả.

```bash
openclaw infer video generate --prompt "hoàng hôn điện ảnh trên đại dương" --json
openclaw infer video generate --prompt "cảnh quay drone chậm trên một hồ nước trong rừng" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Ghi chú:

- `video generate` chấp nhận `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` và `--timeout-ms`, được chuyển tiếp đến runtime tạo video.
- `--model` phải là `<provider/model>` đối với `video describe`.

## Web

Tìm kiếm và truy xuất.

```bash
openclaw infer web search --query "tài liệu OpenClaw" --json
openclaw infer web search --query "các nhà cung cấp web infer của OpenClaw" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` liệt kê các nhà cung cấp khả dụng, đã cấu hình và được chọn cho việc tìm kiếm và truy xuất.

## Nhúng

Tạo vectơ và kiểm tra nhà cung cấp nhúng.

```bash
openclaw infer embedding create --text "tôm hùm thân thiện" --json
openclaw infer embedding create --text "phiếu hỗ trợ khách hàng: giao hàng chậm" --model openai/text-embedding-3-large --json
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
- `inputs` (các tệp đính kèm hình ảnh được gửi cùng yêu cầu, khi áp dụng)
- `outputs`
- `ignoredOverrides` (các khóa gợi ý mà nhà cung cấp không hỗ trợ, khi áp dụng)
- `error`

Đối với các lệnh tạo nội dung đa phương tiện, `outputs` chứa các tệp do OpenClaw ghi. Để tự động hóa, hãy sử dụng `path`, `mimeType`, `size` và mọi kích thước dành riêng cho nội dung đa phương tiện trong mảng đó thay vì phân tích stdout dành cho người đọc.

## Những lỗi thường gặp

```bash
# Không đúng
openclaw infer media image generate --prompt "tôm hùm thân thiện"

# Đúng
openclaw infer image generate --prompt "tôm hùm thân thiện"
```

```bash
# Không đúng
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Đúng
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Mô hình](/vi/concepts/models)
