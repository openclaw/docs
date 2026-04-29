---
read_when:
    - Thiết kế hoặc tái cấu trúc khả năng hiểu nội dung đa phương tiện
    - Tinh chỉnh tiền xử lý âm thanh/video/hình ảnh đầu vào
sidebarTitle: Media understanding
summary: Khả năng hiểu hình ảnh/âm thanh/video đầu vào (tùy chọn) với phương án dự phòng qua nhà cung cấp + CLI
title: Hiểu nội dung đa phương tiện
x-i18n:
    generated_at: "2026-04-29T22:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw có thể **tóm tắt phương tiện đến** (hình ảnh/âm thanh/video) trước khi pipeline phản hồi chạy. Nó tự động phát hiện khi các công cụ cục bộ hoặc khóa nhà cung cấp có sẵn, và có thể được tắt hoặc tùy chỉnh. Nếu tính năng hiểu bị tắt, các mô hình vẫn nhận các tệp/URL gốc như thường lệ.

Hành vi phương tiện riêng theo nhà cung cấp được đăng ký bởi Plugin của nhà cung cấp, trong khi lõi OpenClaw sở hữu cấu hình `tools.media` dùng chung, thứ tự dự phòng và tích hợp pipeline phản hồi.

## Mục tiêu

- Tùy chọn: tiền xử lý phương tiện đến thành văn bản ngắn để định tuyến nhanh hơn + phân tích lệnh tốt hơn.
- Luôn giữ việc chuyển phương tiện gốc đến mô hình.
- Hỗ trợ **API nhà cung cấp** và **dự phòng CLI**.
- Cho phép nhiều mô hình với thứ tự dự phòng (lỗi/kích thước/hết thời gian).

## Hành vi cấp cao

<Steps>
  <Step title="Thu thập tệp đính kèm">
    Thu thập các tệp đính kèm đến (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Chọn theo từng khả năng">
    Với mỗi khả năng được bật (hình ảnh/âm thanh/video), chọn tệp đính kèm theo chính sách (mặc định: **đầu tiên**).
  </Step>
  <Step title="Chọn mô hình">
    Chọn mục mô hình đủ điều kiện đầu tiên (kích thước + khả năng + xác thực).
  </Step>
  <Step title="Dự phòng khi thất bại">
    Nếu một mô hình thất bại hoặc phương tiện quá lớn, **chuyển dự phòng sang mục tiếp theo**.
  </Step>
  <Step title="Áp dụng khối thành công">
    Khi thành công:

    - `Body` trở thành khối `[Image]`, `[Audio]`, hoặc `[Video]`.
    - Âm thanh đặt `{{Transcript}}`; phân tích lệnh dùng văn bản chú thích khi có, nếu không thì dùng bản chép lời.
    - Chú thích được giữ lại dưới dạng `User text:` bên trong khối.

  </Step>
</Steps>

Nếu quá trình hiểu thất bại hoặc bị tắt, **luồng phản hồi vẫn tiếp tục** với phần thân gốc + tệp đính kèm.

## Tổng quan cấu hình

`tools.media` hỗ trợ **mô hình dùng chung** cộng với ghi đè theo từng khả năng:

<AccordionGroup>
  <Accordion title="Khóa cấp cao nhất">
    - `tools.media.models`: danh sách mô hình dùng chung (dùng `capabilities` để kiểm soát).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - giá trị mặc định (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - ghi đè nhà cung cấp (`baseUrl`, `headers`, `providerOptions`)
      - tùy chọn âm thanh Deepgram qua `tools.media.audio.providerOptions.deepgram`
      - điều khiển lặp lại bản chép lời âm thanh (`echoTranscript`, mặc định `false`; `echoFormat`)
      - tùy chọn **danh sách `models` theo từng khả năng** (được ưu tiên trước mô hình dùng chung)
      - chính sách `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (kiểm soát tùy chọn theo kênh/chatType/khóa phiên)
    - `tools.media.concurrency`: số lượt chạy khả năng đồng thời tối đa (mặc định **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Mục mô hình

Mỗi mục `models[]` có thể là **nhà cung cấp** hoặc **CLI**:

<Tabs>
  <Tab title="Mục nhà cung cấp">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
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

    Mẫu CLI cũng có thể dùng:

    - `{{MediaDir}}` (thư mục chứa tệp phương tiện)
    - `{{OutputDir}}` (thư mục nháp được tạo cho lượt chạy này)
    - `{{OutputBase}}` (đường dẫn cơ sở của tệp nháp, không có phần mở rộng)

  </Tab>
</Tabs>

## Mặc định và giới hạn

Giá trị mặc định được khuyến nghị:

- `maxChars`: **500** cho hình ảnh/video (ngắn, thân thiện với lệnh)
- `maxChars`: **không đặt** cho âm thanh (bản chép lời đầy đủ trừ khi bạn đặt giới hạn)
- `maxBytes`:
  - hình ảnh: **10MB**
  - âm thanh: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Quy tắc">
    - Nếu phương tiện vượt quá `maxBytes`, mô hình đó bị bỏ qua và **mô hình tiếp theo được thử**.
    - Tệp âm thanh nhỏ hơn **1024 byte** được xem là rỗng/hỏng và bị bỏ qua trước khi chép lời bằng nhà cung cấp/CLI; ngữ cảnh phản hồi đến nhận một bản chép lời giữ chỗ xác định để tác nhân biết ghi chú quá nhỏ.
    - Nếu mô hình trả về nhiều hơn `maxChars`, đầu ra sẽ bị cắt.
    - `prompt` mặc định là câu đơn giản "Describe the {media}." cộng với hướng dẫn `maxChars` (chỉ hình ảnh/video).
    - Nếu mô hình hình ảnh chính đang hoạt động đã hỗ trợ thị giác nguyên bản, OpenClaw bỏ qua khối tóm tắt `[Image]` và thay vào đó truyền hình ảnh gốc vào mô hình.
    - Nếu mô hình chính Gateway/WebChat chỉ hỗ trợ văn bản, tệp đính kèm hình ảnh được giữ lại dưới dạng tham chiếu `media://inbound/*` đã được chuyển ra ngoài để công cụ hình ảnh/PDF hoặc mô hình hình ảnh đã cấu hình vẫn có thể kiểm tra chúng thay vì mất tệp đính kèm.
    - Yêu cầu `openclaw infer image describe --model <provider/model>` rõ ràng thì khác: chúng chạy trực tiếp nhà cung cấp/mô hình có khả năng xử lý hình ảnh đó, bao gồm các tham chiếu Ollama như `ollama/qwen2.5vl:7b`.
    - Nếu `<capability>.enabled: true` nhưng không cấu hình mô hình nào, OpenClaw thử **mô hình phản hồi đang hoạt động** khi nhà cung cấp của nó hỗ trợ khả năng đó.

  </Accordion>
</AccordionGroup>

### Tự động phát hiện khả năng hiểu phương tiện (mặc định)

Nếu `tools.media.<capability>.enabled` **không** được đặt thành `false` và bạn chưa cấu hình mô hình, OpenClaw tự động phát hiện theo thứ tự này và **dừng ở tùy chọn hoạt động đầu tiên**:

<Steps>
  <Step title="Mô hình phản hồi đang hoạt động">
    Mô hình phản hồi đang hoạt động khi nhà cung cấp của nó hỗ trợ khả năng này.
  </Step>
  <Step title="agents.defaults.imageModel">
    Tham chiếu chính/dự phòng `agents.defaults.imageModel` (chỉ hình ảnh).
    Ưu tiên tham chiếu `provider/model`. Tham chiếu trần được xác định từ các mục mô hình nhà cung cấp có khả năng xử lý hình ảnh đã cấu hình chỉ khi kết quả khớp là duy nhất.
  </Step>
  <Step title="CLI cục bộ (chỉ âm thanh)">
    CLI cục bộ (nếu đã cài đặt):

    - `sherpa-onnx-offline` (yêu cầu `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; dùng `WHISPER_CPP_MODEL` hoặc mô hình tiny đi kèm)
    - `whisper` (CLI Python; tự động tải xuống mô hình)

  </Step>
  <Step title="Gemini CLI">
    `gemini` dùng `read_many_files`.
  </Step>
  <Step title="Xác thực nhà cung cấp">
    - Các mục `models.providers.*` đã cấu hình hỗ trợ khả năng này được thử trước thứ tự dự phòng đi kèm.
    - Nhà cung cấp cấu hình chỉ hình ảnh có mô hình hỗ trợ hình ảnh sẽ tự động đăng ký cho tính năng hiểu phương tiện ngay cả khi chúng không phải là Plugin nhà cung cấp đi kèm.
    - Khả năng hiểu hình ảnh Ollama có sẵn khi được chọn rõ ràng, ví dụ thông qua `agents.defaults.imageModel` hoặc `openclaw infer image describe --model ollama/<vision-model>`.

    Thứ tự dự phòng đi kèm:

    - Âm thanh: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Hình ảnh: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

Để tắt tự động phát hiện, đặt:

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
Phát hiện nhị phân là nỗ lực tốt nhất trên macOS/Linux/Windows; hãy đảm bảo CLI nằm trên `PATH` (chúng tôi mở rộng `~`), hoặc đặt một mô hình CLI rõ ràng với đường dẫn lệnh đầy đủ.
</Note>

### Hỗ trợ môi trường proxy (mô hình nhà cung cấp)

Khi tính năng hiểu phương tiện **âm thanh** và **video** dựa trên nhà cung cấp được bật, OpenClaw tôn trọng các biến môi trường proxy đi ra tiêu chuẩn cho lệnh gọi HTTP đến nhà cung cấp:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Nếu không có biến môi trường proxy nào được đặt, tính năng hiểu phương tiện dùng kết nối đi trực tiếp. Nếu giá trị proxy sai định dạng, OpenClaw ghi cảnh báo và chuyển về tải trực tiếp.

## Khả năng (tùy chọn)

Nếu bạn đặt `capabilities`, mục này chỉ chạy cho các loại phương tiện đó. Với danh sách dùng chung, OpenClaw có thể suy luận mặc định:

- `openai`, `anthropic`, `minimax`: **hình ảnh**
- `minimax-portal`: **hình ảnh**
- `moonshot`: **hình ảnh + video**
- `openrouter`: **hình ảnh**
- `google` (Gemini API): **hình ảnh + âm thanh + video**
- `qwen`: **hình ảnh + video**
- `mistral`: **âm thanh**
- `zai`: **hình ảnh**
- `groq`: **âm thanh**
- `xai`: **âm thanh**
- `deepgram`: **âm thanh**
- Bất kỳ danh mục `models.providers.<id>.models[]` nào có mô hình hỗ trợ hình ảnh: **hình ảnh**

Với các mục CLI, **hãy đặt `capabilities` rõ ràng** để tránh khớp ngoài ý muốn. Nếu bạn bỏ qua `capabilities`, mục đó đủ điều kiện cho danh sách mà nó xuất hiện.

## Ma trận hỗ trợ nhà cung cấp (tích hợp OpenClaw)

| Khả năng | Tích hợp nhà cung cấp                                                                                                        | Ghi chú                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hình ảnh      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, nhà cung cấp cấu hình | Plugin nhà cung cấp đăng ký hỗ trợ hình ảnh; `openai-codex/*` dùng cơ chế nhà cung cấp OAuth; `codex/*` dùng một lượt Codex app-server có giới hạn; MiniMax và MiniMax OAuth đều dùng `MiniMax-VL-01`; nhà cung cấp cấu hình có khả năng xử lý hình ảnh tự động đăng ký. |
| Âm thanh      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Chép lời bằng nhà cung cấp (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| Video      | Google, Qwen, Moonshot                                                                                                       | Hiểu video bằng nhà cung cấp thông qua Plugin nhà cung cấp; khả năng hiểu video của Qwen dùng các endpoint Standard DashScope.                                                                                                                        |

<Note>
**Ghi chú MiniMax**

- Khả năng hiểu hình ảnh của `minimax` và `minimax-portal` đến từ nhà cung cấp phương tiện `MiniMax-VL-01` do Plugin sở hữu.
- Danh mục văn bản MiniMax đi kèm vẫn khởi đầu ở chế độ chỉ văn bản; các mục `models.providers.minimax` rõ ràng sẽ tạo ra tham chiếu chat M2.7 có khả năng xử lý hình ảnh.

</Note>

## Hướng dẫn chọn mô hình

- Ưu tiên mô hình thế hệ mới nhất mạnh nhất có sẵn cho từng khả năng phương tiện khi chất lượng và an toàn là quan trọng.
- Với các tác nhân bật công cụ xử lý đầu vào không đáng tin cậy, tránh các mô hình phương tiện cũ/yếu hơn.
- Giữ ít nhất một dự phòng cho mỗi khả năng để đảm bảo tính sẵn sàng (mô hình chất lượng + mô hình nhanh hơn/rẻ hơn).
- Dự phòng CLI (`whisper-cli`, `whisper`, `gemini`) hữu ích khi API nhà cung cấp không khả dụng.
- Ghi chú `parakeet-mlx`: với `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi định dạng đầu ra là `txt` (hoặc không được chỉ định); các định dạng không phải `txt` chuyển về stdout.

## Chính sách tệp đính kèm

`attachments` theo từng khả năng kiểm soát tệp đính kèm nào được xử lý:

<ParamField path="mode" type='"first" | "all"' default="first">
  Xử lý tệp đính kèm đầu tiên được chọn hay tất cả chúng.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Giới hạn số lượng được xử lý.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Tùy chọn lựa chọn giữa các tệp đính kèm ứng viên.
</ParamField>

Khi `mode: "all"`, đầu ra được gắn nhãn `[Image 1/2]`, `[Audio 2/2]`, v.v.

<AccordionGroup>
  <Accordion title="Hành vi trích xuất tệp đính kèm">
    - Văn bản tệp đã trích xuất được bọc dưới dạng **nội dung bên ngoài không đáng tin cậy** trước khi được thêm vào lời nhắc media.
    - Khối được chèn sử dụng các dấu mốc ranh giới rõ ràng như `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` và bao gồm một dòng siêu dữ liệu `Source: External`.
    - Đường dẫn trích xuất tệp đính kèm này cố ý bỏ qua biểu ngữ dài `SECURITY NOTICE:` để tránh làm phình to lời nhắc media; các dấu mốc ranh giới và siêu dữ liệu vẫn được giữ lại.
    - Nếu một tệp không có văn bản nào có thể trích xuất, OpenClaw sẽ chèn `[No extractable text]`.
    - Nếu một PDF chuyển sang dùng ảnh trang đã kết xuất trong đường dẫn này, lời nhắc media giữ phần giữ chỗ `[PDF content rendered to images; images not forwarded to model]` vì bước trích xuất tệp đính kèm này chuyển tiếp các khối văn bản, không phải ảnh PDF đã kết xuất.

  </Accordion>
</AccordionGroup>

## Ví dụ cấu hình

<Tabs>
  <Tab title="Mô hình dùng chung + ghi đè">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
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

Khi tính năng hiểu media chạy, `/status` bao gồm một dòng tóm tắt ngắn:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Dòng này hiển thị kết quả theo từng capability và nhà cung cấp/mô hình đã chọn khi có áp dụng.

## Ghi chú

- Tính năng hiểu hoạt động theo kiểu **nỗ lực tối đa**. Lỗi không chặn câu trả lời.
- Tệp đính kèm vẫn được truyền tới mô hình ngay cả khi tính năng hiểu bị tắt.
- Dùng `scope` để giới hạn nơi tính năng hiểu chạy (ví dụ: chỉ DM).

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Hỗ trợ hình ảnh & media](/vi/nodes/images)
