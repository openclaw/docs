---
read_when:
    - Thiết kế hoặc tái cấu trúc khả năng hiểu phương tiện
    - Điều chỉnh tiền xử lý âm thanh/video/hình ảnh đến
sidebarTitle: Media understanding
summary: Hiểu hình ảnh/âm thanh/video đầu vào (tùy chọn) với phương án dự phòng qua nhà cung cấp + CLI
title: Hiểu nội dung đa phương tiện
x-i18n:
    generated_at: "2026-06-28T06:22:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw có thể **tóm tắt phương tiện đến** (hình ảnh/âm thanh/video) trước khi pipeline phản hồi chạy. Nó tự động phát hiện khi có công cụ cục bộ hoặc khóa nhà cung cấp, và có thể được tắt hoặc tùy chỉnh. Nếu tính năng hiểu bị tắt, các mô hình vẫn nhận tệp/URL gốc như thường lệ.

Hành vi phương tiện theo từng nhà cung cấp được đăng ký bởi các plugin nhà cung cấp, còn lõi OpenClaw sở hữu cấu hình `tools.media` dùng chung, thứ tự dự phòng và tích hợp pipeline phản hồi.

## Mục tiêu

- Tùy chọn: tiền xử lý phương tiện đến thành văn bản ngắn để định tuyến nhanh hơn + phân tích lệnh tốt hơn.
- Luôn giữ nguyên việc gửi phương tiện gốc đến mô hình.
- Hỗ trợ **API nhà cung cấp** và **dự phòng CLI**.
- Cho phép nhiều mô hình với thứ tự dự phòng (lỗi/kích thước/hết thời gian).

## Hành vi cấp cao

<Steps>
  <Step title="Thu thập tệp đính kèm">
    Thu thập tệp đính kèm đến (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Chọn theo từng khả năng">
    Với mỗi khả năng được bật (hình ảnh/âm thanh/video), chọn tệp đính kèm theo chính sách (mặc định: **đầu tiên**).
  </Step>
  <Step title="Chọn mô hình">
    Chọn mục mô hình đủ điều kiện đầu tiên (kích thước + khả năng + xác thực).
  </Step>
  <Step title="Dự phòng khi lỗi">
    Nếu một mô hình lỗi hoặc phương tiện quá lớn, **dự phòng sang mục tiếp theo**.
  </Step>
  <Step title="Áp dụng khối thành công">
    Khi thành công:

    - `Body` trở thành khối `[Image]`, `[Audio]`, hoặc `[Video]`.
    - Âm thanh đặt `{{Transcript}}`; phân tích lệnh dùng văn bản chú thích khi có, nếu không thì dùng bản chép lời.
    - Chú thích được giữ dưới dạng `User text:` bên trong khối.

  </Step>
</Steps>

Nếu việc hiểu thất bại hoặc bị tắt, **luồng phản hồi vẫn tiếp tục** với nội dung gốc + tệp đính kèm.

## Tổng quan cấu hình

`tools.media` hỗ trợ **mô hình dùng chung** cùng với ghi đè theo từng khả năng:

<AccordionGroup>
  <Accordion title="Khóa cấp cao nhất">
    - `tools.media.models`: danh sách mô hình dùng chung (dùng `capabilities` để kiểm soát).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - mặc định (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - ghi đè nhà cung cấp (`baseUrl`, `headers`, `providerOptions`)
      - tùy chọn âm thanh Deepgram qua `tools.media.audio.providerOptions.deepgram`
      - điều khiển lặp lại bản chép lời âm thanh (`echoTranscript`, mặc định `false`; `echoFormat`)
      - danh sách **`models` theo từng khả năng** tùy chọn (được ưu tiên trước mô hình dùng chung)
      - chính sách `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (kiểm soát tùy chọn theo kênh/chatType/khóa phiên)
    - `tools.media.concurrency`: số lần chạy khả năng đồng thời tối đa (mặc định **2**).

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
    - `{{OutputDir}}` (thư mục nháp được tạo cho lần chạy này)
    - `{{OutputBase}}` (đường dẫn cơ sở của tệp nháp, không có phần mở rộng)

  </Tab>
</Tabs>

### Thông tin xác thực nhà cung cấp (`apiKey`)

Tính năng hiểu phương tiện của nhà cung cấp dùng cùng cơ chế phân giải xác thực nhà cung cấp như các lệnh gọi mô hình thông thường: hồ sơ xác thực, biến môi trường, rồi `models.providers.<providerId>.apiKey`.

Các mục `tools.media.*.models[]` không chấp nhận trường `apiKey` nội tuyến. Giá trị `provider` trong mục mô hình phương tiện, chẳng hạn `openai` hoặc `moonshot`, phải có thông tin xác thực khả dụng qua một trong các nguồn xác thực nhà cung cấp tiêu chuẩn.

Ví dụ tối thiểu:

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

Để xem tham chiếu xác thực nhà cung cấp đầy đủ, bao gồm hồ sơ, biến môi trường và URL cơ sở tùy chỉnh, hãy xem [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

## Mặc định và giới hạn

Mặc định khuyến nghị:

- `maxChars`: **500** cho hình ảnh/video (ngắn, thân thiện với lệnh)
- `maxChars`: **chưa đặt** cho âm thanh (bản chép lời đầy đủ trừ khi bạn đặt giới hạn)
- `maxBytes`:
  - hình ảnh: **10MB**
  - âm thanh: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Quy tắc">
    - Nếu phương tiện vượt quá `maxBytes`, mô hình đó bị bỏ qua và **mô hình tiếp theo được thử**.
    - Tệp âm thanh nhỏ hơn **1024 byte** được xem là rỗng/hỏng và bị bỏ qua trước khi chép lời bằng nhà cung cấp/CLI; ngữ cảnh phản hồi đến nhận một bản chép lời giữ chỗ xác định để tác tử biết ghi chú quá nhỏ.
    - Nếu mô hình trả về nhiều hơn `maxChars`, đầu ra sẽ được cắt bớt.
    - `prompt` mặc định là câu đơn giản "Describe the {media}." cộng với hướng dẫn `maxChars` (chỉ hình ảnh/video).
    - Nếu mô hình hình ảnh chính đang hoạt động đã hỗ trợ thị giác nguyên bản, OpenClaw bỏ qua khối tóm tắt `[Image]` và thay vào đó truyền hình ảnh gốc vào mô hình.
    - Nếu mô hình chính Gateway/WebChat chỉ hỗ trợ văn bản, tệp đính kèm hình ảnh được giữ dưới dạng tham chiếu `media://inbound/*` đã giảm tải để công cụ hình ảnh/PDF hoặc mô hình hình ảnh đã cấu hình vẫn có thể kiểm tra chúng thay vì làm mất tệp đính kèm.
    - Các yêu cầu `openclaw infer image describe --model <provider/model>` rõ ràng thì khác: chúng chạy trực tiếp nhà cung cấp/mô hình có khả năng xử lý hình ảnh đó, bao gồm tham chiếu Ollama như `ollama/qwen2.5vl:7b`.
    - Nếu `<capability>.enabled: true` nhưng chưa cấu hình mô hình nào, OpenClaw thử **mô hình phản hồi đang hoạt động** khi nhà cung cấp của mô hình đó hỗ trợ khả năng này.

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
    Ưu tiên tham chiếu `provider/model`. Tham chiếu trần chỉ được định danh từ các mục mô hình nhà cung cấp có khả năng xử lý hình ảnh đã cấu hình khi kết quả khớp là duy nhất.
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
    - Các mục `models.providers.*` đã cấu hình có hỗ trợ khả năng này được thử trước thứ tự dự phòng đi kèm.
    - Nhà cung cấp cấu hình chỉ dành cho hình ảnh với mô hình có khả năng xử lý hình ảnh sẽ tự động đăng ký cho tính năng hiểu phương tiện ngay cả khi chúng không phải là plugin nhà cung cấp đi kèm.
    - Tính năng hiểu hình ảnh Ollama khả dụng khi được chọn rõ ràng, ví dụ qua `agents.defaults.imageModel` hoặc `openclaw infer image describe --model ollama/<vision-model>`.

    Thứ tự dự phòng đi kèm:

    - Âm thanh: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
Phát hiện tệp nhị phân là nỗ lực tốt nhất trên macOS/Linux/Windows; hãy đảm bảo CLI nằm trong `PATH` (chúng tôi mở rộng `~`), hoặc đặt một mô hình CLI rõ ràng với đường dẫn lệnh đầy đủ.
</Note>

### Hỗ trợ môi trường proxy (mô hình nhà cung cấp)

Khi tính năng hiểu phương tiện **âm thanh** và **video** dựa trên nhà cung cấp được bật, OpenClaw tôn trọng các biến môi trường proxy gửi ra tiêu chuẩn cho lệnh gọi HTTP đến nhà cung cấp:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Nếu không đặt biến môi trường proxy nào, tính năng hiểu phương tiện dùng kết nối đi trực tiếp. Nếu giá trị proxy không đúng định dạng, OpenClaw ghi cảnh báo và quay về tải trực tiếp.

## Khả năng (tùy chọn)

Nếu bạn đặt `capabilities`, mục đó chỉ chạy cho các loại phương tiện đó. Với danh sách dùng chung, OpenClaw có thể suy ra mặc định:

- `openai`, `anthropic`, `minimax`: **hình ảnh**
- `minimax-portal`: **hình ảnh**
- `moonshot`: **hình ảnh + video**
- `openrouter`: **hình ảnh + âm thanh**
- `google` (Gemini API): **hình ảnh + âm thanh + video**
- `qwen`: **hình ảnh + video**
- `mistral`: **âm thanh**
- `zai`: **hình ảnh**
- `groq`: **âm thanh**
- `xai`: **âm thanh**
- `deepgram`: **âm thanh**
- Bất kỳ danh mục `models.providers.<id>.models[]` nào có mô hình có khả năng xử lý hình ảnh: **hình ảnh**

Với các mục CLI, **hãy đặt `capabilities` rõ ràng** để tránh khớp ngoài dự kiến. Nếu bạn bỏ qua `capabilities`, mục đó đủ điều kiện cho danh sách nơi nó xuất hiện.

## Ma trận hỗ trợ nhà cung cấp (tích hợp OpenClaw)

| Khả năng | Tích hợp nhà cung cấp                                                                                                        | Ghi chú                                                                                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hình ảnh      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, nhà cung cấp cấu hình | Plugin nhà cung cấp đăng ký hỗ trợ hình ảnh; `openai/*` có thể dùng định tuyến khóa API hoặc Codex OAuth; `codex/*` dùng một lượt Codex app-server có giới hạn; MiniMax và MiniMax OAuth đều dùng `MiniMax-VL-01`; nhà cung cấp cấu hình có khả năng xử lý hình ảnh sẽ tự động đăng ký. |
| Âm thanh      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Chép lời qua nhà cung cấp (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Video      | Google, Qwen, Moonshot                                                                                                       | Hiểu video qua nhà cung cấp thông qua plugin nhà cung cấp; tính năng hiểu video Qwen dùng các điểm cuối Standard DashScope.                                                                                                                            |

<Note>
**Ghi chú về MiniMax**

- Khả năng hiểu hình ảnh của `minimax`, `minimax-cn`, `minimax-portal` và `minimax-portal-cn` đến từ nhà cung cấp phương tiện `MiniMax-VL-01` do plugin sở hữu.
- Định tuyến hình ảnh tự động tiếp tục dùng `MiniMax-VL-01` ngay cả khi siêu dữ liệu trò chuyện MiniMax M2.x cũ tuyên bố hỗ trợ đầu vào hình ảnh.

</Note>

## Hướng dẫn chọn mô hình

- Ưu tiên mô hình thế hệ mới nhất mạnh nhất hiện có cho từng khả năng phương tiện khi chất lượng và an toàn là quan trọng.
- Với các agent hỗ trợ công cụ xử lý đầu vào không đáng tin cậy, tránh các mô hình phương tiện cũ/yếu hơn.
- Giữ ít nhất một phương án dự phòng cho mỗi khả năng để bảo đảm tính sẵn sàng (mô hình chất lượng + mô hình nhanh hơn/rẻ hơn).
- Các phương án dự phòng CLI (`whisper-cli`, `whisper`, `gemini`) hữu ích khi API của nhà cung cấp không khả dụng.
- Ghi chú về `parakeet-mlx`: với `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi định dạng đầu ra là `txt` (hoặc không được chỉ định); các định dạng không phải `txt` sẽ dùng stdout làm phương án dự phòng.

## Chính sách tệp đính kèm

`attachments` theo từng khả năng kiểm soát những tệp đính kèm nào được xử lý:

<ParamField path="mode" type='"first" | "all"' default="first">
  Xử lý tệp đính kèm được chọn đầu tiên hay tất cả.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Giới hạn số lượng được xử lý.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Tùy chọn ưu tiên lựa chọn trong số các tệp đính kèm ứng viên.
</ParamField>

Khi `mode: "all"`, đầu ra được gắn nhãn `[Image 1/2]`, `[Audio 2/2]`, v.v.

<AccordionGroup>
  <Accordion title="Hành vi trích xuất tệp đính kèm">
    - Văn bản tệp được trích xuất được bọc dưới dạng **nội dung bên ngoài không đáng tin cậy** trước khi được thêm vào prompt phương tiện.
    - Khối được chèn sử dụng các dấu ranh giới rõ ràng như `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` và bao gồm một dòng siêu dữ liệu `Source: External`.
    - Đường dẫn trích xuất tệp đính kèm này cố ý bỏ qua banner dài `SECURITY NOTICE:` để tránh làm phình prompt phương tiện; các dấu ranh giới và siêu dữ liệu vẫn được giữ lại.
    - Nếu tệp không có văn bản có thể trích xuất, OpenClaw chèn `[No extractable text]`.
    - Nếu PDF dùng phương án dự phòng là hình ảnh trang được render trong đường dẫn này, OpenClaw chuyển tiếp các hình ảnh trang đó đến các mô hình trả lời có khả năng thị giác và giữ placeholder `[PDF content rendered to images]` trong khối tệp.

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

Khi tính năng hiểu phương tiện chạy, `/status` bao gồm một dòng tóm tắt ngắn:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Dòng này hiển thị kết quả theo từng khả năng và nhà cung cấp/mô hình đã chọn khi áp dụng.

## Ghi chú

- Việc hiểu nội dung là **nỗ lực tối đa**. Lỗi không chặn câu trả lời.
- Tệp đính kèm vẫn được truyền đến mô hình ngay cả khi tính năng hiểu bị tắt.
- Dùng `scope` để giới hạn nơi tính năng hiểu chạy (ví dụ: chỉ DM).

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Hỗ trợ hình ảnh & phương tiện](/vi/nodes/images)
