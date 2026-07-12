---
read_when:
    - Thiết kế hoặc tái cấu trúc tính năng hiểu nội dung đa phương tiện
    - Tinh chỉnh quy trình tiền xử lý âm thanh/video/hình ảnh đầu vào
sidebarTitle: Media understanding
summary: Khả năng hiểu hình ảnh/âm thanh/video đầu vào (tùy chọn) với phương án dự phòng bằng nhà cung cấp + CLI
title: Nhận hiểu nội dung đa phương tiện
x-i18n:
    generated_at: "2026-07-12T08:05:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw có thể tóm tắt nội dung phương tiện đầu vào (hình ảnh/âm thanh/video) trước khi quy trình phản hồi chạy, nhờ đó việc phân tích lệnh và định tuyến sử dụng văn bản ngắn thay vì các byte thô. Tính năng nhận hiểu tự động phát hiện các công cụ cục bộ hoặc khóa của nhà cung cấp, hoặc bạn có thể cấu hình rõ các mô hình. Phương tiện gốc luôn được chuyển đến mô hình như bình thường; khi quá trình nhận hiểu thất bại hoặc bị tắt, luồng phản hồi vẫn tiếp tục mà không thay đổi.

Các Plugin của nhà cung cấp đăng ký siêu dữ liệu về khả năng (nhà cung cấp nào hỗ trợ loại phương tiện nào, mô hình mặc định, mức ưu tiên). Phần lõi OpenClaw quản lý cấu hình `tools.media` dùng chung, thứ tự dự phòng và việc tích hợp vào quy trình phản hồi.

## Cách hoạt động

<Steps>
  <Step title="Thu thập tệp đính kèm">
    Thu thập các tệp đính kèm đầu vào (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Chọn theo từng khả năng">
    Với mỗi khả năng được bật (hình ảnh/âm thanh/video), chọn tệp đính kèm theo chính sách `attachments` (mặc định: chỉ tệp đính kèm đầu tiên).
  </Step>
  <Step title="Chọn mô hình">
    Chọn mục mô hình đủ điều kiện đầu tiên (kích thước + khả năng + có thông tin xác thực).
  </Step>
  <Step title="Dự phòng khi thất bại">
    Nếu mô hình gặp lỗi, hết thời gian chờ hoặc phương tiện vượt quá `maxBytes`, hãy thử mục tiếp theo.
  </Step>
  <Step title="Áp dụng khi thành công">
    `Body` trở thành một khối `[Image]`, `[Audio]` hoặc `[Video]`. Âm thanh cũng đặt `{{Transcript}}`; quá trình phân tích lệnh sử dụng văn bản chú thích nếu có, nếu không thì sử dụng bản chép lời. Chú thích được giữ lại dưới dạng `User text:` bên trong khối.
  </Step>
</Steps>

## Cấu hình

`tools.media` chứa danh sách mô hình dùng chung cùng các phần ghi đè theo từng khả năng:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

Các khóa theo từng khả năng (`image`/`audio`/`video`):

| Khóa                                            | Kiểu      | Mặc định                                             | Ghi chú                                                                                               |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | tự động (`false` sẽ tắt)                             | Đặt thành `false` để tắt tính năng tự động phát hiện cho khả năng này                                 |
| `models`                                        | mảng      | không có                                             | Được ưu tiên trước danh sách `tools.media.models` dùng chung                                          |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ hướng dẫn về maxChars)  | Theo mặc định chỉ dành cho hình ảnh/video                                                             |
| `maxChars`                                      | `number`  | `500` (hình ảnh/video), không đặt (âm thanh)         | Đầu ra sẽ bị cắt bớt nếu mô hình trả về nhiều hơn                                                     |
| `maxBytes`                                      | `number`  | hình ảnh `10485760`, âm thanh `20971520`, video `52428800` | Phương tiện quá kích thước sẽ được bỏ qua để chuyển sang mô hình tiếp theo                      |
| `timeoutSeconds`                                | `number`  | `60` (hình ảnh/âm thanh), `120` (video)              |                                                                                                       |
| `language`                                      | `string`  | không đặt                                            | Gợi ý ngôn ngữ cho việc chép lời âm thanh                                                             |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | Ghi đè yêu cầu của nhà cung cấp; xem [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools)       |
| `attachments`                                   | đối tượng | `{ mode: "first", maxAttachments: 1 }`               | Xem [Chính sách tệp đính kèm](#attachment-policy)                                                     |
| `scope`                                         | đối tượng | không đặt                                            | Giới hạn theo channel/chatType/keyPrefix                                                              |
| `echoTranscript`                                | `boolean` | `false`                                              | Chỉ dành cho âm thanh: gửi lại bản chép lời vào cuộc trò chuyện trước khi tác tử xử lý                |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | Chỉ dành cho âm thanh: phần giữ chỗ `{transcript}`                                                    |

Các tùy chọn dành riêng cho Deepgram nằm trong `providerOptions.deepgram` (trường cấp cao nhất `deepgram: { detectLanguage, punctuate, smartFormat }` đã lỗi thời nhưng vẫn được đọc).

### Các mục mô hình

Mỗi mục `models[]` là một mục **nhà cung cấp** (mặc định) hoặc một mục **CLI**:

<Tabs>
  <Tab title="Mục nhà cung cấp">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Mục CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Các mẫu CLI cũng có thể sử dụng `{{MediaDir}}` (thư mục chứa tệp phương tiện), `{{OutputDir}}` (thư mục tạm được tạo cho lần chạy này) và `{{OutputBase}}` (đường dẫn cơ sở của tệp tạm, không có phần mở rộng).

  </Tab>
</Tabs>

### Thông tin xác thực của nhà cung cấp

Tính năng nhận hiểu phương tiện của nhà cung cấp sử dụng cùng cách phân giải xác thực như các lệnh gọi mô hình thông thường: hồ sơ xác thực, biến môi trường, sau đó là `models.providers.<providerId>.apiKey`. Các mục `tools.media.*.models[]` không chấp nhận trường `apiKey` nội tuyến.

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Xem [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) để biết về hồ sơ, biến môi trường và URL cơ sở tùy chỉnh.

## Quy tắc và hành vi

- Phương tiện vượt quá `maxBytes` sẽ bỏ qua mô hình đó và thử mô hình tiếp theo.
- Các tệp âm thanh nhỏ hơn 1024 byte được coi là trống/hỏng và bị bỏ qua trước khi chép lời; tác tử sẽ nhận được một bản chép lời giữ chỗ có tính xác định.
- Nếu mô hình hình ảnh chính đang hoạt động đã hỗ trợ thị giác nguyên bản, OpenClaw sẽ bỏ qua khối tóm tắt `[Image]` và chuyển trực tiếp hình ảnh gốc vào mô hình. MiniMax là một ngoại lệ: `minimax`, `minimax-cn`, `minimax-portal` và `minimax-portal-cn` luôn định tuyến việc nhận hiểu hình ảnh qua nhà cung cấp phương tiện `MiniMax-VL-01` do Plugin quản lý, ngay cả khi siêu dữ liệu trò chuyện MiniMax M2.x cũ tuyên bố hỗ trợ đầu vào hình ảnh (chỉ `MiniMax-M3` trở lên được coi là có khả năng thị giác nguyên bản).
- Nếu mô hình chính của Gateway/WebChat chỉ hỗ trợ văn bản, các tệp đính kèm hình ảnh được giữ lại dưới dạng tham chiếu `media://inbound/*` đã chuyển tải, để các công cụ hình ảnh/PDF hoặc mô hình hình ảnh đã cấu hình vẫn có thể kiểm tra chúng thay vì làm mất tệp đính kèm.
- Lệnh rõ ràng `openclaw infer image describe --file <path> --model <provider/model>` (bí danh: `openclaw capability image describe`) chạy trực tiếp nhà cung cấp/mô hình có khả năng xử lý hình ảnh đó, bao gồm các tham chiếu Ollama như `ollama/qwen2.5vl:7b` khi một mô hình có khả năng xử lý hình ảnh tương ứng được cấu hình trong `models.providers.ollama.models[]`.
- Nếu `<capability>.enabled` không phải là `false` nhưng không có mô hình nào được cấu hình, OpenClaw sẽ thử mô hình phản hồi đang hoạt động khi nhà cung cấp của mô hình đó hỗ trợ khả năng này.

### Tự động phát hiện (mặc định)

Khi `tools.media.<capability>.enabled` không phải là `false` và không có mô hình nào được cấu hình, OpenClaw thử các tùy chọn sau theo thứ tự và dừng lại ở tùy chọn hoạt động đầu tiên:

<Steps>
  <Step title="Mô hình hình ảnh đã cấu hình (chỉ hình ảnh)">
    Các tham chiếu chính/dự phòng của `agents.defaults.imageModel`, trừ khi mô hình phản hồi đang hoạt động đã hỗ trợ thị giác nguyên bản. Ưu tiên các tham chiếu `provider/model`; các tham chiếu trần chỉ được định danh từ những mục mô hình nhà cung cấp có khả năng xử lý hình ảnh đã cấu hình khi kết quả khớp là duy nhất.
  </Step>
  <Step title="Mô hình phản hồi đang hoạt động">
    Mô hình phản hồi đang hoạt động, khi nhà cung cấp của mô hình đó hỗ trợ khả năng này.
  </Step>
  <Step title="Xác thực nhà cung cấp (chỉ âm thanh, trước các CLI cục bộ)">
    Các mục `models.providers.*` đã cấu hình có hỗ trợ âm thanh được thử trước các CLI cục bộ. Thứ tự ưu tiên của nhà cung cấp đi kèm (nếu bằng nhau, sắp xếp theo bảng chữ cái của mã nhà cung cấp): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="Các CLI cục bộ (chỉ âm thanh)">
    Các tệp nhị phân cục bộ sẵn sàng trở thành một danh sách dự phòng có thứ tự:
    - `whisper-cli` đứng đầu chỉ sau khi một lần gọi mô hình trước đó trong tiến trình hiện tại đã quan sát thấy Metal hoặc CUDA
    - `sherpa-onnx-offline` mặc định dùng CPU (yêu cầu `SHERPA_ONNX_MODEL_DIR` có `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` khi khả năng tăng tốc chỉ mới được bản dựng hỗ trợ hoặc chưa được quan sát
    - `parakeet-mlx` trên Apple Silicon (có khả năng MLX, chưa quan sát việc sử dụng thiết bị)
    - `whisper` (CLI Python; mặc định sử dụng mô hình `turbo`, tự động tải xuống)

    Việc kiểm tra khả năng của phần phụ trợ được lưu vào bộ nhớ đệm và không tải mô hình. Khả năng của bản dựng, các cờ phần phụ trợ được yêu cầu và phần phụ trợ được quan sát từ một lần gọi thực tế vẫn được tách biệt. whisper.cpp được tự động phát hiện vẫn bật nhật ký chạy mô hình để có thể ghi lại dòng phần phụ trợ được chọn từ phần thượng nguồn. Các mục CLI được khai báo rõ vẫn giữ nguyên thứ tự, cờ phần phụ trợ và cờ đầu ra đã cấu hình.

  </Step>
  <Step title="Xác thực nhà cung cấp (hình ảnh/video)">
    Các mục `models.providers.*` đã cấu hình có hỗ trợ khả năng này được thử trước thứ tự dự phòng đi kèm. Các nhà cung cấp chỉ có trong cấu hình hình ảnh với một mô hình có khả năng xử lý hình ảnh sẽ tự động đăng ký để nhận hiểu phương tiện, ngay cả khi không phải là Plugin nhà cung cấp đi kèm.

    Thứ tự ưu tiên của nhà cung cấp đi kèm (nếu bằng nhau, sắp xếp theo bảng chữ cái của mã nhà cung cấp):
    - Hình ảnh: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI Antigravity (chỉ hình ảnh/video)">
    Tệp nhị phân `agy` hoặc `antigravity` đầu tiên đã cài đặt (ghi đè bằng `OPENCLAW_ANTIGRAVITY_CLI`), được cách ly trong thư mục của phương tiện.
  </Step>
</Steps>

Để tắt tính năng tự động phát hiện cho một khả năng:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
Việc phát hiện tệp nhị phân được thực hiện theo khả năng tốt nhất trên macOS/Linux/Windows; hãy đảm bảo CLI nằm trong `PATH` (`~` được mở rộng), hoặc đặt rõ một mục mô hình CLI với đường dẫn lệnh đầy đủ.
</Note>

### Hỗ trợ proxy (các lệnh gọi nhà cung cấp âm thanh/video)

Tính năng nhận hiểu **âm thanh** và **video** dựa trên nhà cung cấp tuân theo các biến môi trường proxy đầu ra tiêu chuẩn, bao gồm các quy tắc bỏ qua `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Các biến chữ thường được ưu tiên hơn biến chữ hoa. Nếu không có biến nào được đặt, tính năng nhận hiểu phương tiện sử dụng kết nối đi trực tiếp; nếu giá trị proxy không hợp lệ, OpenClaw ghi cảnh báo và quay về tải trực tiếp. Tính năng nhận hiểu hình ảnh không đi qua đường dẫn proxy này.

## Các khả năng

Đặt `capabilities` trên một mục `models[]` để giới hạn mục đó cho các loại phương tiện cụ thể. Với danh sách dùng chung, OpenClaw suy luận các giá trị mặc định theo từng nhà cung cấp đi kèm:

| Nhà cung cấp                                                            | Khả năng             |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | hình ảnh              |
| `minimax-portal`                                                         | hình ảnh              |
| `moonshot`                                                               | hình ảnh + video      |
| `openrouter`                                                             | hình ảnh + âm thanh   |
| `google` (API Gemini)                                                    | hình ảnh + âm thanh + video |
| `qwen`                                                                   | hình ảnh + video      |
| `deepinfra`                                                              | hình ảnh + âm thanh   |
| `mistral`                                                                | âm thanh              |
| `zai`                                                                    | hình ảnh              |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | âm thanh              |
| Mọi danh mục `models.providers.<id>.models[]` có mô hình hỗ trợ hình ảnh | hình ảnh              |

Đối với các mục CLI, hãy đặt `capabilities` rõ ràng để tránh các kết quả khớp ngoài dự kiến; nếu bỏ qua, mục đó đủ điều kiện cho mọi danh sách khả năng mà nó xuất hiện trong đó.

## Ma trận hỗ trợ của nhà cung cấp

| Khả năng | Nhà cung cấp                                                                                                                                               | Ghi chú                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hình ảnh      | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, các nhà cung cấp cấu hình | Các plugin của nhà cung cấp đăng ký hỗ trợ hình ảnh; `openai/*` có thể sử dụng định tuyến bằng khóa API hoặc Codex OAuth; `codex/*` sử dụng một lượt Codex app-server có giới hạn; các nhà cung cấp cấu hình hỗ trợ hình ảnh được tự động đăng ký. |
| Âm thanh      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Phiên âm của nhà cung cấp (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Video      | Google, Moonshot, Qwen                                                                                                                                  | Khả năng hiểu video của nhà cung cấp thông qua các plugin của nhà cung cấp; khả năng hiểu video của Qwen sử dụng các điểm cuối DashScope tiêu chuẩn.                                                                        |

<Note>
**Lưu ý về MiniMax**: Khả năng hiểu hình ảnh của `minimax`, `minimax-cn`, `minimax-portal` và `minimax-portal-cn` luôn đến từ nhà cung cấp phương tiện `MiniMax-VL-01` do plugin sở hữu, ngay cả khi siêu dữ liệu trò chuyện MiniMax M2.x cũ tuyên bố hỗ trợ đầu vào hình ảnh.
</Note>

## Hướng dẫn chọn mô hình

- Ưu tiên mô hình thế hệ hiện tại mạnh nhất cho từng khả năng phương tiện khi chất lượng và độ an toàn là quan trọng.
- Đối với các tác nhân có hỗ trợ công cụ xử lý đầu vào không đáng tin cậy, tránh sử dụng các mô hình phương tiện cũ hoặc yếu hơn.
- Duy trì ít nhất một phương án dự phòng cho mỗi khả năng để đảm bảo tính sẵn sàng (mô hình chất lượng cao + mô hình nhanh hơn/rẻ hơn).
- Các phương án dự phòng CLI (`whisper-cli`, `whisper`, `gemini`) hữu ích khi API của nhà cung cấp không khả dụng.
- Các chế độ xuất tệp đã biết có tính quyết định: tệp bản chép lời được suy luận bị trống hoặc thiếu sẽ không tạo ra bản chép lời, thay vì dự phòng bằng đầu ra tiến trình CLI.
- `parakeet-mlx`: sử dụng `--output-format txt` (hoặc `all`) cùng với `--output-dir` và mẫu đầu ra mặc định `{filename}`. Các biến môi trường thượng nguồn `PARAKEET_OUTPUT_FORMAT` và `PARAKEET_OUTPUT_TEMPLATE` cũng được tôn trọng. OpenClaw đọc `<output-dir>/<media-basename>.txt`; định dạng `srt` mặc định, các định dạng khác và mẫu đầu ra tùy chỉnh tiếp tục sử dụng stdout.

## Chính sách tệp đính kèm

`attachments` theo từng khả năng kiểm soát những tệp đính kèm nào được xử lý:

<ParamField path="mode" type='"first" | "all"' default="first">
  Chỉ xử lý tệp đính kèm đầu tiên được chọn hoặc xử lý tất cả.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Giới hạn số lượng được xử lý.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Tùy chọn ưu tiên khi chọn trong số các tệp đính kèm ứng viên.
</ParamField>

Khi `mode: "all"`, đầu ra được gắn nhãn `[Hình ảnh 1/2]`, `[Âm thanh 2/2]`, v.v.

### Trích xuất tệp đính kèm

- Văn bản được trích xuất từ tệp được bao bọc dưới dạng nội dung bên ngoài không đáng tin cậy trước khi được nối vào lời nhắc phương tiện, sử dụng các dấu mốc biên như `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` cùng với dòng siêu dữ liệu `Source: External`.
- Đường dẫn này cố ý bỏ qua biểu ngữ dài `SECURITY NOTICE:` để giữ lời nhắc phương tiện ngắn gọn; các dấu mốc biên và siêu dữ liệu vẫn được áp dụng.
- Tệp không có văn bản có thể trích xuất sẽ nhận `[Không có văn bản có thể trích xuất]`.
- Nếu PDF chuyển sang phương án dự phòng là hình ảnh trang được kết xuất, OpenClaw chuyển tiếp các hình ảnh đó đến các mô hình trả lời có khả năng thị giác và giữ chỗ `[Nội dung PDF được kết xuất thành hình ảnh]` trong khối tệp.

## Ví dụ cấu hình

<Tabs>
  <Tab title="Mô hình dùng chung + ghi đè">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Chỉ âm thanh + video">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Chỉ hình ảnh">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Một mục đa phương thức">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Đầu ra trạng thái

Khi quá trình hiểu phương tiện chạy, `/status` bao gồm một dòng tóm tắt cho mỗi khả năng:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Để kiểm kê trước khi chạy, hãy chạy `openclaw capability audio providers`. Các hàng cục bộ hiển thị riêng phương án dự phòng cục bộ được chọn so với lựa chọn nhà cung cấp toàn cục, trạng thái sẵn sàng và các trường phần phụ trợ có khả năng/được yêu cầu/quan sát được tách biệt. Lựa chọn cục bộ tương tự cũng có sẵn dưới dạng một phát hiện thông tin của doctor:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Ghi chú

- Khả năng hiểu được thực hiện theo nỗ lực tối đa. Lỗi không chặn phản hồi.
- Tệp đính kèm vẫn được truyền đến mô hình ngay cả khi khả năng hiểu bị tắt.
- Sử dụng `scope` để giới hạn nơi khả năng hiểu chạy (ví dụ: chỉ tin nhắn trực tiếp).

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Hỗ trợ hình ảnh và phương tiện](/vi/nodes/images)
