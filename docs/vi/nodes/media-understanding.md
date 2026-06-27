---
read_when:
    - Thiết kế hoặc tái cấu trúc khả năng hiểu phương tiện
    - Tinh chỉnh tiền xử lý âm thanh/video/hình ảnh đầu vào
sidebarTitle: Media understanding
summary: Hiểu hình ảnh/âm thanh/video đầu vào (tùy chọn) với phương án dự phòng qua nhà cung cấp + CLI
title: Hiểu phương tiện
x-i18n:
    generated_at: "2026-06-27T17:39:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw có thể **tóm tắt phương tiện đến** (hình ảnh/âm thanh/video) trước khi quy trình phản hồi chạy. Nó tự phát hiện khi có công cụ cục bộ hoặc khóa nhà cung cấp, và có thể bị tắt hoặc tùy chỉnh. Nếu tính năng hiểu bị tắt, các mô hình vẫn nhận tệp/URL gốc như bình thường.

Hành vi phương tiện riêng theo nhà cung cấp được đăng ký bởi các Plugin nhà cung cấp, trong khi lõi OpenClaw sở hữu cấu hình `tools.media` dùng chung, thứ tự dự phòng và phần tích hợp quy trình phản hồi.

## Mục tiêu

- Tùy chọn: tiền xử lý phương tiện đến thành văn bản ngắn để định tuyến nhanh hơn + phân tích lệnh tốt hơn.
- Luôn giữ việc chuyển phương tiện gốc đến mô hình.
- Hỗ trợ **API nhà cung cấp** và **phương án dự phòng CLI**.
- Cho phép nhiều mô hình với thứ tự dự phòng (lỗi/kích thước/hết thời gian).

## Hành vi cấp cao

<Steps>
  <Step title="Collect attachments">
    Thu thập tệp đính kèm đến (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    Với mỗi năng lực đã bật (hình ảnh/âm thanh/video), chọn tệp đính kèm theo chính sách (mặc định: **đầu tiên**).
  </Step>
  <Step title="Choose model">
    Chọn mục mô hình đủ điều kiện đầu tiên (kích thước + năng lực + xác thực).
  </Step>
  <Step title="Fallback on failure">
    Nếu một mô hình thất bại hoặc phương tiện quá lớn, **chuyển sang mục tiếp theo**.
  </Step>
  <Step title="Apply success block">
    Khi thành công:

    - `Body` trở thành khối `[Image]`, `[Audio]`, hoặc `[Video]`.
    - Âm thanh đặt `{{Transcript}}`; phân tích lệnh dùng văn bản chú thích khi có, nếu không thì dùng bản chép lời.
    - Chú thích được giữ dưới dạng `User text:` bên trong khối.

  </Step>
</Steps>

Nếu tính năng hiểu thất bại hoặc bị tắt, **luồng phản hồi vẫn tiếp tục** với phần thân gốc + tệp đính kèm.

## Tổng quan cấu hình

`tools.media` hỗ trợ **mô hình dùng chung** cùng với ghi đè theo từng năng lực:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: danh sách mô hình dùng chung (dùng `capabilities` để giới hạn).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - mặc định (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - ghi đè nhà cung cấp (`baseUrl`, `headers`, `providerOptions`)
      - tùy chọn âm thanh Deepgram qua `tools.media.audio.providerOptions.deepgram`
      - điều khiển phản hồi bản chép lời âm thanh (`echoTranscript`, mặc định `false`; `echoFormat`)
      - **danh sách `models` theo từng năng lực** tùy chọn (được ưu tiên trước mô hình dùng chung)
      - chính sách `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (giới hạn tùy chọn theo channel/chatType/session key)
    - `tools.media.concurrency`: số lượt chạy năng lực đồng thời tối đa (mặc định **2**).

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
  <Tab title="Provider entry">
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
  <Tab title="CLI entry">
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

### Thông tin xác thực nhà cung cấp (`apiKey`)

Tính năng hiểu phương tiện qua nhà cung cấp dùng cùng cơ chế phân giải xác thực nhà cung cấp như các lệnh gọi mô hình thông thường: hồ sơ xác thực, biến môi trường, rồi đến `models.providers.<providerId>.apiKey`.

Các mục `tools.media.*.models[]` không chấp nhận trường `apiKey` nội tuyến. Giá trị `provider` trong một mục mô hình phương tiện, chẳng hạn `openai` hoặc `moonshot`, phải có thông tin xác thực thông qua một trong các nguồn xác thực nhà cung cấp tiêu chuẩn.

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

Mặc định được khuyến nghị:

- `maxChars`: **500** cho hình ảnh/video (ngắn, thân thiện với lệnh)
- `maxChars`: **không đặt** cho âm thanh (bản chép lời đầy đủ trừ khi bạn đặt giới hạn)
- `maxBytes`:
  - hình ảnh: **10MB**
  - âm thanh: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - Nếu phương tiện vượt quá `maxBytes`, mô hình đó bị bỏ qua và **mô hình tiếp theo được thử**.
    - Tệp âm thanh nhỏ hơn **1024 byte** được xem là rỗng/hỏng và bị bỏ qua trước khi chép lời bằng nhà cung cấp/CLI; ngữ cảnh phản hồi đến nhận một bản chép lời giữ chỗ có tính xác định để tác tử biết ghi chú quá nhỏ.
    - Nếu mô hình trả về nhiều hơn `maxChars`, đầu ra sẽ bị cắt bớt.
    - `prompt` mặc định là câu đơn giản "Describe the {media}." cộng với hướng dẫn `maxChars` (chỉ hình ảnh/video).
    - Nếu mô hình hình ảnh chính đang hoạt động đã hỗ trợ thị giác nguyên bản, OpenClaw bỏ qua khối tóm tắt `[Image]` và truyền hình ảnh gốc vào mô hình thay thế.
    - Nếu mô hình chính Gateway/WebChat chỉ hỗ trợ văn bản, tệp đính kèm hình ảnh được giữ dưới dạng tham chiếu `media://inbound/*` đã chuyển tải để công cụ hình ảnh/PDF hoặc mô hình hình ảnh đã cấu hình vẫn có thể kiểm tra chúng thay vì mất tệp đính kèm.
    - Các yêu cầu rõ ràng `openclaw infer image describe --model <provider/model>` thì khác: chúng chạy trực tiếp nhà cung cấp/mô hình có năng lực hình ảnh đó, bao gồm tham chiếu Ollama như `ollama/qwen2.5vl:7b`.
    - Nếu `<capability>.enabled: true` nhưng chưa cấu hình mô hình nào, OpenClaw thử **mô hình phản hồi đang hoạt động** khi nhà cung cấp của nó hỗ trợ năng lực đó.

  </Accordion>
</AccordionGroup>

### Tự phát hiện tính năng hiểu phương tiện (mặc định)

Nếu `tools.media.<capability>.enabled` **không** được đặt thành `false` và bạn chưa cấu hình mô hình, OpenClaw tự phát hiện theo thứ tự này và **dừng ở tùy chọn đầu tiên hoạt động**:

<Steps>
  <Step title="Active reply model">
    Mô hình phản hồi đang hoạt động khi nhà cung cấp của nó hỗ trợ năng lực đó.
  </Step>
  <Step title="agents.defaults.imageModel">
    Tham chiếu chính/dự phòng `agents.defaults.imageModel` (chỉ hình ảnh).
    Ưu tiên tham chiếu `provider/model`. Tham chiếu trần chỉ được định danh từ các mục mô hình nhà cung cấp có năng lực hình ảnh đã cấu hình khi kết quả khớp là duy nhất.
  </Step>
  <Step title="Local CLIs (audio only)">
    CLI cục bộ (nếu đã cài đặt):

    - `sherpa-onnx-offline` (yêu cầu `SHERPA_ONNX_MODEL_DIR` với encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; dùng `WHISPER_CPP_MODEL` hoặc mô hình tiny đi kèm)
    - `whisper` (CLI Python; tự động tải xuống mô hình)

  </Step>
  <Step title="Gemini CLI">
    `gemini` dùng `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - Các mục `models.providers.*` đã cấu hình hỗ trợ năng lực này được thử trước thứ tự dự phòng đi kèm.
    - Nhà cung cấp cấu hình chỉ dành cho hình ảnh với mô hình có năng lực hình ảnh sẽ tự đăng ký cho tính năng hiểu phương tiện ngay cả khi chúng không phải là Plugin nhà cung cấp đi kèm.
    - Tính năng hiểu hình ảnh Ollama có sẵn khi được chọn rõ ràng, ví dụ qua `agents.defaults.imageModel` hoặc `openclaw infer image describe --model ollama/<vision-model>`.

    Thứ tự dự phòng đi kèm:

    - Âm thanh: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Hình ảnh: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

Để tắt tự phát hiện, đặt:

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
Phát hiện nhị phân là nỗ lực tốt nhất trên macOS/Linux/Windows; hãy đảm bảo CLI nằm trong `PATH` (chúng tôi mở rộng `~`), hoặc đặt một mô hình CLI rõ ràng với đường dẫn lệnh đầy đủ.
</Note>

### Hỗ trợ môi trường proxy (mô hình nhà cung cấp)

Khi tính năng hiểu phương tiện **âm thanh** và **video** dựa trên nhà cung cấp được bật, OpenClaw tôn trọng các biến môi trường proxy đầu ra tiêu chuẩn cho lệnh gọi HTTP đến nhà cung cấp:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Nếu không đặt biến môi trường proxy nào, tính năng hiểu phương tiện dùng kết nối trực tiếp ra ngoài. Nếu giá trị proxy sai định dạng, OpenClaw ghi cảnh báo và quay về tải trực tiếp.

## Năng lực (tùy chọn)

Nếu bạn đặt `capabilities`, mục đó chỉ chạy cho các loại phương tiện đó. Với danh sách dùng chung, OpenClaw có thể suy luận mặc định:

- `openai`, `anthropic`, `minimax`: **hình ảnh**
- `minimax-portal`: **hình ảnh**
- `moonshot`: **hình ảnh + video**
- `openrouter`: **hình ảnh + âm thanh**
- `google` (API Gemini): **hình ảnh + âm thanh + video**
- `qwen`: **hình ảnh + video**
- `mistral`: **âm thanh**
- `zai`: **hình ảnh**
- `groq`: **âm thanh**
- `xai`: **âm thanh**
- `deepgram`: **âm thanh**
- Bất kỳ danh mục `models.providers.<id>.models[]` nào có mô hình có năng lực hình ảnh: **hình ảnh**

Với mục CLI, **hãy đặt `capabilities` rõ ràng** để tránh khớp bất ngờ. Nếu bạn bỏ qua `capabilities`, mục đó đủ điều kiện cho danh sách nơi nó xuất hiện.

## Ma trận hỗ trợ nhà cung cấp (tích hợp OpenClaw)

| Năng lực | Tích hợp nhà cung cấp                                                                                                         | Ghi chú                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hình ảnh      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, nhà cung cấp cấu hình | Plugin nhà cung cấp đăng ký hỗ trợ hình ảnh; `openai/*` có thể dùng khóa API hoặc định tuyến Codex OAuth; `codex/*` dùng một lượt Codex app-server có giới hạn; MiniMax và MiniMax OAuth đều dùng `MiniMax-VL-01`; nhà cung cấp cấu hình có năng lực hình ảnh tự đăng ký. |
| Âm thanh      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Chép lời qua nhà cung cấp (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Video      | Google, Qwen, Moonshot                                                                                                       | Hiểu video qua nhà cung cấp bằng Plugin nhà cung cấp; hiểu video Qwen dùng các endpoint Standard DashScope.                                                                                                                            |

<Note>
**Ghi chú MiniMax**

- Khả năng hiểu hình ảnh của `minimax`, `minimax-cn`, `minimax-portal` và `minimax-portal-cn` đến từ nhà cung cấp phương tiện `MiniMax-VL-01` do plugin sở hữu.
- Định tuyến hình ảnh tự động vẫn tiếp tục dùng `MiniMax-VL-01` ngay cả khi siêu dữ liệu trò chuyện MiniMax M2.x cũ tuyên bố hỗ trợ đầu vào hình ảnh.

</Note>

## Hướng dẫn chọn mô hình

- Ưu tiên mô hình thế hệ mới nhất mạnh nhất hiện có cho từng năng lực phương tiện khi chất lượng và an toàn là quan trọng.
- Với các tác nhân có bật công cụ xử lý đầu vào không đáng tin cậy, tránh các mô hình phương tiện cũ hơn/yếu hơn.
- Giữ ít nhất một phương án dự phòng cho mỗi năng lực để bảo đảm khả dụng (mô hình chất lượng + mô hình nhanh hơn/rẻ hơn).
- Các phương án dự phòng CLI (`whisper-cli`, `whisper`, `gemini`) hữu ích khi API của nhà cung cấp không khả dụng.
- Ghi chú về `parakeet-mlx`: với `--output-dir`, OpenClaw đọc `<output-dir>/<media-basename>.txt` khi định dạng đầu ra là `txt` (hoặc không được chỉ định); các định dạng không phải `txt` sẽ quay về stdout.

## Chính sách tệp đính kèm

`attachments` theo từng năng lực kiểm soát tệp đính kèm nào được xử lý:

<ParamField path="mode" type='"first" | "all"' default="first">
  Xử lý tệp đính kèm được chọn đầu tiên hay tất cả.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Giới hạn số lượng được xử lý.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Ưu tiên lựa chọn giữa các tệp đính kèm ứng viên.
</ParamField>

Khi `mode: "all"`, đầu ra được gắn nhãn `[Image 1/2]`, `[Audio 2/2]`, v.v.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Văn bản tệp được trích xuất được bọc dưới dạng **nội dung bên ngoài không đáng tin cậy** trước khi được thêm vào prompt phương tiện.
    - Khối được chèn dùng các dấu ranh giới rõ ràng như `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` và bao gồm một dòng siêu dữ liệu `Source: External`.
    - Đường dẫn trích xuất tệp đính kèm này cố ý bỏ qua banner dài `SECURITY NOTICE:` để tránh làm prompt phương tiện phình to; các dấu ranh giới và siêu dữ liệu vẫn được giữ lại.
    - Nếu một tệp không có văn bản có thể trích xuất, OpenClaw chèn `[No extractable text]`.
    - Nếu PDF quay về dùng hình ảnh trang đã kết xuất trong đường dẫn này, prompt phương tiện giữ placeholder `[PDF content rendered to images; images not forwarded to model]` vì bước trích xuất tệp đính kèm này chuyển tiếp các khối văn bản, không phải hình ảnh PDF đã kết xuất.

  </Accordion>
</AccordionGroup>

## Ví dụ cấu hình

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

Khi khả năng hiểu phương tiện chạy, `/status` bao gồm một dòng tóm tắt ngắn:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Dòng này hiển thị kết quả theo từng năng lực và nhà cung cấp/mô hình được chọn khi áp dụng.

## Ghi chú

- Khả năng hiểu là **nỗ lực tối đa**. Lỗi không chặn phản hồi.
- Tệp đính kèm vẫn được truyền cho mô hình ngay cả khi khả năng hiểu bị tắt.
- Dùng `scope` để giới hạn nơi khả năng hiểu chạy (ví dụ: chỉ DM).

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Hỗ trợ hình ảnh và phương tiện](/vi/nodes/images)
