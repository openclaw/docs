---
read_when:
    - Thêm hoặc sửa đổi lệnh `openclaw infer`
    - Thiết kế tự động hóa capability headless ổn định
summary: CLI ưu tiên suy luận cho các quy trình làm việc về mô hình, hình ảnh, âm thanh, TTS, video, web và embedding do nhà cung cấp hỗ trợ
title: CLI suy luận
x-i18n:
    generated_at: "2026-06-27T17:18:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` là bề mặt headless chuẩn cho các quy trình suy luận được provider hỗ trợ.

Nó cố ý phơi bày các họ năng lực, không phải tên RPC Gateway thô và không phải id công cụ agent thô.

## Biến infer thành một skill

Sao chép và dán nội dung này cho một agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Một skill dựa trên infer tốt nên:

- ánh xạ các ý định phổ biến của người dùng tới đúng lệnh con infer
- bao gồm một vài ví dụ infer chuẩn cho các quy trình mà nó bao phủ
- ưu tiên `openclaw infer ...` trong ví dụ và gợi ý
- tránh ghi lại toàn bộ bề mặt infer trong phần thân skill

Phạm vi điển hình của skill tập trung vào infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Vì sao dùng infer

`openclaw infer` cung cấp một CLI nhất quán cho các tác vụ suy luận được provider hỗ trợ bên trong OpenClaw.

Lợi ích:

- Dùng các provider và model đã được cấu hình trong OpenClaw thay vì nối các wrapper dùng một lần cho từng backend.
- Giữ các quy trình model, hình ảnh, phiên âm âm thanh, TTS, video, web và embedding trong một cây lệnh.
- Dùng dạng đầu ra `--json` ổn định cho script, tự động hóa và quy trình do agent điều khiển.
- Ưu tiên bề mặt OpenClaw chính chủ khi tác vụ về cơ bản là "chạy suy luận".
- Dùng đường dẫn cục bộ thông thường mà không yêu cầu gateway cho hầu hết lệnh infer.

Đối với kiểm tra provider đầu cuối, ưu tiên `openclaw infer ...` sau khi các kiểm thử
provider cấp thấp hơn đã xanh. Nó thực thi CLI đã phát hành, tải cấu hình,
phân giải default-agent, kích hoạt plugin đi kèm và runtime năng lực dùng chung
trước khi yêu cầu provider được thực hiện.

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

Bảng này ánh xạ các tác vụ suy luận phổ biến tới lệnh infer tương ứng.

| Tác vụ                        | Lệnh                                                                                          | Ghi chú                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Chạy một prompt văn bản/model | `openclaw infer model run --prompt "..." --json`                                              | Mặc định dùng đường dẫn cục bộ thông thường           |
| Chạy prompt model trên ảnh    | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Lặp lại `--file` cho nhiều đầu vào ảnh                |
| Tạo ảnh                       | `openclaw infer image generate --prompt "..." --json`                                         | Dùng `image edit` khi bắt đầu từ tệp hiện có          |
| Mô tả tệp ảnh hoặc URL        | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` phải là `<provider/model>` có khả năng ảnh  |
| Phiên âm âm thanh             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` phải là `<provider/model>`                  |
| Tổng hợp giọng nói            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` hướng tới gateway                        |
| Tạo video                     | `openclaw infer video generate --prompt "..." --json`                                         | Hỗ trợ gợi ý provider như `--resolution`              |
| Mô tả tệp video               | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` phải là `<provider/model>`                  |
| Tìm kiếm trên web             | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Lấy một trang web             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Tạo embeddings                | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Hành vi

- `openclaw infer ...` là bề mặt CLI chính cho các quy trình này.
- Dùng `--json` khi đầu ra sẽ được lệnh hoặc script khác tiêu thụ.
- Dùng `--provider` hoặc `--model provider/model` khi cần một backend cụ thể.
- Dùng `model run --thinking <level>` để truyền mức thinking/reasoning một lần (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh`, hoặc `max`) trong khi giữ lượt chạy ở dạng thô.
- Với `image describe`, `audio transcribe` và `video describe`, `--model` phải dùng dạng `<provider/model>`.
- Với `image describe`, `--file` chấp nhận đường dẫn cục bộ và URL ảnh HTTP(S). URL từ xa dùng chính sách SSRF lấy phương tiện thông thường.
- Với `image describe`, `--model` rõ ràng sẽ chạy trực tiếp provider/model đó. Model phải có khả năng xử lý ảnh trong catalog model hoặc cấu hình provider. `codex/<model>` chạy một lượt hiểu ảnh qua app-server Codex có giới hạn; `openai/<model>` dùng đường dẫn provider OpenAI với xác thực API-key hoặc OAuth ChatGPT/Codex.
- Các lệnh thực thi không trạng thái mặc định dùng cục bộ.
- Các lệnh trạng thái do Gateway quản lý mặc định dùng gateway.
- Đường dẫn cục bộ thông thường không yêu cầu gateway đang chạy.
- `model run` cục bộ là một completion provider một lần, gọn nhẹ. Nó phân giải model agent và xác thực đã cấu hình, nhưng không bắt đầu một lượt chat-agent, tải công cụ hoặc mở các MCP server đi kèm.
- `model run --file` chấp nhận tệp ảnh, phát hiện kiểu MIME của chúng và gửi chúng cùng prompt đã cung cấp tới model đã chọn. Lặp lại `--file` cho nhiều ảnh.
- `model run --file` từ chối đầu vào không phải ảnh. Dùng `infer audio transcribe` cho tệp âm thanh và `infer video describe` cho tệp video.
- `model run --gateway` thực thi định tuyến Gateway, xác thực đã lưu, chọn provider và runtime nhúng, nhưng vẫn chạy như một phép dò model thô: nó gửi prompt đã cung cấp và mọi tệp đính kèm ảnh mà không có transcript phiên trước đó, ngữ cảnh bootstrap/AGENTS, lắp ráp context-engine, công cụ hoặc MCP server đi kèm.
- `model run --gateway --model <provider/model>` yêu cầu thông tin xác thực gateway của operator đáng tin cậy vì yêu cầu này đề nghị Gateway chạy một override provider/model dùng một lần.
- `model run --thinking` cục bộ dùng đường dẫn provider-completion gọn nhẹ; các mức riêng của provider như `adaptive` và `max` được ánh xạ tới mức simple-completion di động gần nhất.

## Model

Dùng `model` cho suy luận văn bản được provider hỗ trợ và kiểm tra model/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Dùng ref đầy đủ `<provider/model>` để smoke-test một provider cụ thể mà không
khởi động Gateway hoặc tải toàn bộ bề mặt công cụ agent:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Ghi chú:

- `model run` cục bộ là smoke CLI hẹp nhất cho tình trạng provider/model/auth vì, với các provider không phải Codex, nó chỉ gửi prompt đã cung cấp tới model đã chọn.
- `model run --model <provider/model>` cục bộ có thể dùng chính xác các hàng catalog tĩnh đi kèm từ `models list --all` trước khi provider đó được ghi vào cấu hình. Xác thực provider vẫn bắt buộc; thiếu thông tin xác thực sẽ thất bại dưới dạng lỗi auth, không phải `Unknown model`.
- Với các phép dò reasoning Mistral Medium 3.5, để temperature không đặt/mặc định. Mistral từ chối `reasoning_effort="high"` cộng với `temperature: 0`; dùng `mistral/mistral-medium-3-5` với temperature mặc định hoặc một giá trị chế độ reasoning khác 0 như `0.7`.
- Các phép dò cục bộ Codex Responses là ngoại lệ hẹp: OpenClaw thêm một chỉ dẫn hệ thống tối thiểu để transport có thể điền trường `instructions` bắt buộc của nó, mà không thêm toàn bộ ngữ cảnh agent, công cụ, bộ nhớ hoặc transcript phiên.
- `model run --file` cục bộ giữ đường dẫn gọn nhẹ đó và đính kèm trực tiếp nội dung ảnh vào một thông điệp người dùng duy nhất. Các tệp ảnh phổ biến như PNG, JPEG và WebP hoạt động khi kiểu MIME của chúng được phát hiện là `image/*`; tệp không được hỗ trợ hoặc không được nhận diện sẽ thất bại trước khi provider được gọi.
- `model run --file` phù hợp nhất khi bạn muốn kiểm thử trực tiếp model văn bản đa phương thức đã chọn. Dùng `infer image describe` khi bạn muốn cơ chế chọn provider hiểu ảnh và định tuyến model ảnh mặc định của OpenClaw.
- Model đã chọn phải hỗ trợ đầu vào ảnh; các model chỉ văn bản có thể từ chối yêu cầu ở lớp provider.
- `model run --prompt` phải chứa văn bản không phải khoảng trắng; prompt trống bị từ chối trước khi provider cục bộ hoặc Gateway được gọi.
- `model run` cục bộ thoát với mã khác 0 khi provider không trả về đầu ra văn bản, vì vậy provider cục bộ không thể truy cập và completion rỗng sẽ không trông giống phép dò thành công.
- Dùng `model run --gateway` khi bạn cần kiểm thử định tuyến Gateway, thiết lập agent-runtime hoặc trạng thái provider do Gateway quản lý trong khi vẫn giữ đầu vào model ở dạng thô. Dùng `openclaw agent` hoặc các bề mặt chat khi bạn muốn toàn bộ ngữ cảnh agent, công cụ, bộ nhớ và transcript phiên.
- `model auth login`, `model auth logout` và `model auth status` quản lý trạng thái xác thực provider đã lưu.

## Hình ảnh

Dùng `image` để tạo, chỉnh sửa và mô tả.

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

- Dùng `image edit` khi bắt đầu từ các tệp đầu vào hiện có.
- Dùng `--size`, `--aspect-ratio`, hoặc `--resolution` với `image edit` cho
  các nhà cung cấp/mô hình hỗ trợ gợi ý hình học khi chỉnh sửa ảnh tham chiếu.
- Dùng `--output-format png --background transparent` với
  `--model openai/gpt-image-1.5` cho đầu ra PNG nền trong suốt của OpenAI;
  `--openai-background` vẫn có sẵn dưới dạng bí danh riêng cho OpenAI. Các nhà cung cấp
  không khai báo hỗ trợ nền sẽ báo gợi ý này là một ghi đè bị bỏ qua.
- Dùng `--quality low|medium|high|auto` cho các nhà cung cấp hỗ trợ gợi ý chất lượng
  hình ảnh, bao gồm OpenAI. OpenAI cũng chấp nhận `--openai-moderation low|auto` cho
  gợi ý kiểm duyệt riêng của nhà cung cấp.
- Dùng `image providers --json` để xác minh những nhà cung cấp hình ảnh tích hợp sẵn nào
  có thể được phát hiện, đã được cấu hình, được chọn, và mỗi nhà cung cấp bộc lộ những
  khả năng tạo/chỉnh sửa nào.
- Dùng `image generate --model <provider/model> --json` làm kiểm thử smoke CLI trực tiếp
  hẹp nhất cho các thay đổi tạo hình ảnh. Ví dụ:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Phản hồi JSON báo cáo `ok`, `provider`, `model`, `attempts`, và các đường dẫn
  đầu ra đã ghi. Khi đặt `--output`, phần mở rộng cuối cùng có thể tuân theo
  kiểu MIME do nhà cung cấp trả về.

- Với `image describe` và `image describe-many`, dùng `--prompt` để cung cấp cho mô hình thị giác một chỉ dẫn theo nhiệm vụ cụ thể như OCR, so sánh, kiểm tra UI, hoặc tạo chú thích ngắn gọn.
- Dùng `--timeout-ms` với các mô hình thị giác cục bộ chậm hoặc các lần khởi động nguội của Ollama.
- Với `image describe`, `--model` phải là một `<provider/model>` có khả năng xử lý hình ảnh.
- Với các mô hình thị giác Ollama cục bộ, hãy kéo mô hình trước và đặt `OLLAMA_API_KEY` thành bất kỳ giá trị giữ chỗ nào, ví dụ `ollama-local`. Xem [Ollama](/vi/providers/ollama#vision-and-image-description).

## Âm thanh

Dùng `audio` để phiên âm tệp.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Ghi chú:

- `audio transcribe` dùng để phiên âm tệp, không phải quản lý phiên theo thời gian thực.
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
- Dùng `tts providers`, `tts voices`, và `tts set-provider` để kiểm tra và cấu hình hành vi TTS.

## Video

Dùng `video` để tạo và mô tả.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Ghi chú:

- `video generate` chấp nhận `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, và `--timeout-ms`, rồi chuyển tiếp chúng đến runtime tạo video.
- `--model` phải là `<provider/model>` cho `video describe`.

## Web

Dùng `web` cho các quy trình tìm kiếm và lấy nội dung.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Ghi chú:

- Dùng `web providers` để kiểm tra các nhà cung cấp có sẵn, đã được cấu hình, và được chọn.

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

Đối với các lệnh tạo media, `outputs` chứa các tệp do OpenClaw ghi. Dùng
`path`, `mimeType`, `size`, và mọi kích thước riêng cho media trong mảng đó
để tự động hóa thay vì phân tích stdout dành cho người đọc.

## Lỗi thường gặp

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
