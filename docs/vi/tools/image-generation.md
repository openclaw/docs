---
read_when:
    - Tạo hoặc chỉnh sửa hình ảnh thông qua tác nhân
    - Cấu hình nhà cung cấp và mô hình tạo hình ảnh
    - Tìm hiểu các tham số của công cụ image_generate
sidebarTitle: Image generation
summary: Tạo và chỉnh sửa hình ảnh thông qua image_generate trên OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Tạo hình ảnh
x-i18n:
    generated_at: "2026-07-19T06:04:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: add6114760bef9e137b2888b7610c8866253bb6638f6957f7a09a33cdf4d0d22
    source_path: tools/image-generation.md
    workflow: 16
---

Công cụ `image_generate` tạo và chỉnh sửa hình ảnh thông qua các nhà cung cấp đã cấu hình.
Trong các phiên trò chuyện, công cụ này chạy bất đồng bộ: OpenClaw ghi lại một
tác vụ nền, trả về mã tác vụ ngay lập tức và đánh thức tác tử khi
nhà cung cấp hoàn tất. Tác tử hoàn tất tuân theo chế độ
phản hồi hiển thị thông thường của phiên: tự động gửi phản hồi cuối cùng khi được cấu hình, hoặc
`message(action="send")` khi phiên yêu cầu công cụ tin nhắn. Nếu
phiên của bên yêu cầu không hoạt động hoặc lần đánh thức đang hoạt động thất bại, OpenClaw sẽ gửi một
phương án dự phòng trực tiếp có tính lũy đẳng kèm theo các hình ảnh đã tạo để kết quả không bị
mất.

<Note>
Công cụ chỉ xuất hiện khi có ít nhất một nhà cung cấp tạo hình ảnh
khả dụng. Nếu bạn không thấy `image_generate` trong các công cụ của tác tử,
hãy cấu hình `agents.defaults.imageGenerationModel`, thiết lập khóa API của nhà cung cấp
hoặc đăng nhập bằng OpenAI ChatGPT/Codex OAuth.
</Note>

## Bắt đầu nhanh

<Steps>
  <Step title="Cấu hình xác thực">
    Đặt khóa API cho ít nhất một nhà cung cấp (ví dụ: `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) hoặc đăng nhập bằng OpenAI Codex OAuth.
  </Step>
  <Step title="Chọn mô hình mặc định (không bắt buộc)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    ChatGPT/Codex OAuth sử dụng cùng tham chiếu mô hình `openai/gpt-image-2`. Khi một
    hồ sơ OAuth `openai` được cấu hình, OpenClaw định tuyến các yêu cầu hình ảnh
    qua hồ sơ OAuth đó thay vì thử `OPENAI_API_KEY` trước.
    Cấu hình `models.providers.openai` tường minh (khóa API, URL cơ sở tùy chỉnh/Azure)
    sẽ chọn lại tuyến OpenAI Images API trực tiếp.

  </Step>
  <Step title="Yêu cầu tác tử">
    _"Tạo hình ảnh một linh vật rô-bốt thân thiện."_

    Tác tử tự động gọi `image_generate`. Không cần đưa công cụ vào danh sách cho phép
    — công cụ được bật theo mặc định khi có nhà cung cấp khả dụng. Công cụ
    trả về mã tác vụ nền, sau đó tác tử hoàn tất gửi
    tệp đính kèm đã tạo thông qua công cụ `message` khi tệp sẵn sàng.

  </Step>
</Steps>

<Warning>
Đối với các điểm cuối LAN tương thích với OpenAI như LocalAI, hãy giữ
`models.providers.openai.baseUrl` tùy chỉnh và chủ động cho phép bằng
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Các điểm cuối hình ảnh riêng tư và
nội bộ vẫn bị chặn theo mặc định.
</Warning>

## Các tuyến phổ biến

| Mục tiêu                                              | Tham chiếu mô hình                                 | Xác thực                                |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Tạo hình ảnh bằng OpenAI với tính phí qua API         | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Tạo hình ảnh bằng OpenAI với xác thực gói đăng ký Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP nền trong suốt bằng OpenAI                   | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` hoặc OpenAI Codex OAuth |
| Tạo hình ảnh bằng DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Tạo hình ảnh biểu cảm/theo phong cách bằng fal Krea 2 | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Tạo hình ảnh bằng OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Tạo hình ảnh bằng LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Tạo hình ảnh MAI bằng Microsoft Foundry               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` hoặc Entra ID     |
| Tạo hình ảnh bằng Google Gemini                       | `google/gemini-3.1-flash-image`                    | `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`   |

Cùng một công cụ xử lý cả chuyển văn bản thành hình ảnh và chỉnh sửa bằng hình ảnh tham chiếu. Sử dụng `image`
cho một hình ảnh tham chiếu hoặc `images` cho nhiều hình ảnh. Đối với các mô hình Krea 2 trên fal, những
hình ảnh tham chiếu này được gửi dưới dạng tham chiếu phong cách thay vì đầu vào chỉnh sửa.
Các gợi ý đầu ra được nhà cung cấp hỗ trợ như `quality`, `outputFormat` và
`background` sẽ được chuyển tiếp khi khả dụng và được báo cáo là bị bỏ qua khi
nhà cung cấp không khai báo hỗ trợ. Khả năng hỗ trợ nền trong suốt đi kèm
chỉ dành riêng cho OpenAI; các nhà cung cấp khác vẫn có thể giữ lại kênh alpha của PNG nếu
hệ thống phụ trợ của họ xuất kênh này.

## Nhà cung cấp được hỗ trợ

| Nhà cung cấp      | Mô hình mặc định                         | Hỗ trợ chỉnh sửa                    | Xác thực                                               |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Có (1 hình ảnh, do quy trình làm việc cấu hình) | `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY` cho đám mây |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Có (1 hình ảnh)                    | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Có (giới hạn tùy theo mô hình)      | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image`                | Có (tối đa 5 hình ảnh)              | `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Có (tối đa 5 hình ảnh đầu vào)      | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Có (chỉ các mô hình MAI-Image-2.5)  | `AZURE_OPENAI_API_KEY` hoặc Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Có (tham chiếu chủ thể)             | `MINIMAX_API_KEY` hoặc MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Có (tối đa 5 hình ảnh)              | `OPENAI_API_KEY` hoặc OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Có (tối đa 5 hình ảnh đầu vào)      | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Không                              | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Có (tối đa 3 hình ảnh)              | `XAI_API_KEY`                                         |

Sử dụng `action: "list"` để kiểm tra các nhà cung cấp và mô hình khả dụng trong thời gian chạy:

```text
/tool image_generate action=list
```

Sử dụng `action: "status"` để kiểm tra tác vụ tạo hình ảnh đang hoạt động cho
phiên hiện tại:

```text
/tool image_generate action=status
```

## Khả năng của nhà cung cấp

| Khả năng               | ComfyUI                    | DeepInfra   | fal                                                | Google             | Microsoft Foundry | MiniMax                         | OpenAI             | Vydra | xAI                |
| --------------------- | -------------------------- | ----------- | -------------------------------------------------- | ------------------ | ----------------- | ------------------------------- | ------------------ | ----- | ------------------ |
| Tạo (số lượng tối đa) | 1                          | 4           | 4                                                  | 4                  | 1                 | 9                               | 4                  | 1     | 4                  |
| Chỉnh sửa / tham chiếu | 1 hình ảnh (quy trình làm việc) | 1 hình ảnh | Flux: 1; GPT: 10; tham chiếu phong cách Krea: 10; NB2: 14 | Tối đa 5 hình ảnh | 1 hình ảnh        | 1 hình ảnh (tham chiếu chủ thể) | Tối đa 5 hình ảnh | -     | Tối đa 3 hình ảnh |
| Điều khiển kích thước | -                          | ✓           | ✓                                                  | ✓                  | ✓                 | -                               | Tối đa 4K          | -     | -                  |
| Tỷ lệ khung hình      | -                          | -           | ✓                                                  | ✓                  | -                 | ✓                               | -                  | -     | ✓                  |
| Độ phân giải (1K/2K/4K) | -                        | -           | ✓                                                  | ✓                  | -                 | -                               | -                  | -     | 1K, 2K             |

## Tham số công cụ

<ParamField path="prompt" type="string" required>
  Lời nhắc tạo hình ảnh. Bắt buộc đối với `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Sử dụng `"status"` để kiểm tra tác vụ phiên đang hoạt động hoặc `"list"` để kiểm tra
  các nhà cung cấp và mô hình khả dụng trong thời gian chạy.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè nhà cung cấp/mô hình (ví dụ: `openai/gpt-image-2`). Sử dụng
  `openai/gpt-image-1.5` cho nền OpenAI trong suốt.
</ParamField>
<ParamField path="image" type="string">
  Đường dẫn hoặc URL của một hình ảnh tham chiếu cho chế độ chỉnh sửa.
</ParamField>
<ParamField path="images" type="string[]">
  Nhiều hình ảnh tham chiếu cho chế độ chỉnh sửa hoặc các mô hình tham chiếu phong cách (tối đa 14
  thông qua công cụ dùng chung; các giới hạn riêng của nhà cung cấp vẫn được áp dụng).
</ParamField>
<ParamField path="size" type="string">
  Gợi ý kích thước: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Tỷ lệ khung hình: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Các nhà cung cấp xác thực tập con riêng của mô hình.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Gợi ý độ phân giải.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Gợi ý chất lượng khi nhà cung cấp hỗ trợ.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Gợi ý định dạng đầu ra khi nhà cung cấp hỗ trợ.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Gợi ý nền khi nhà cung cấp hỗ trợ. Sử dụng `transparent` với
  `outputFormat: "png"` hoặc `"webp"` cho các nhà cung cấp hỗ trợ nền trong suốt.
</ParamField>
<ParamField path="count" type="number">Số lượng hình ảnh cần tạo (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Thời gian chờ yêu cầu nhà cung cấp không bắt buộc, tính bằng mili giây. Khi Codex gọi
  `image_generate` thông qua các công cụ động, giá trị cho mỗi lần gọi này vẫn ghi đè
  giá trị mặc định đã cấu hình và bị giới hạn ở mức 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Gợi ý tên tệp đầu ra.</ParamField>
<ParamField path="openai" type="object">
  Các gợi ý chỉ dành cho OpenAI: `background`, `moderation`, `outputCompression` và `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Điều khiển độ sáng tạo của fal Krea 2. Mặc định là `medium`.
</ParamField>

<Note>
Không phải tất cả nhà cung cấp đều hỗ trợ mọi tham số. Khi một nhà cung cấp dự phòng hỗ trợ một
tùy chọn hình học gần tương đương thay vì tùy chọn được yêu cầu chính xác, OpenClaw sẽ ánh xạ lại sang
kích thước, tỷ lệ khung hình hoặc độ phân giải được hỗ trợ gần nhất trước khi gửi.
Các gợi ý đầu ra không được hỗ trợ sẽ bị loại bỏ đối với những nhà cung cấp không khai báo
hỗ trợ và được báo cáo trong kết quả công cụ. Kết quả công cụ báo cáo các
thiết lập đã áp dụng; `details.normalization` ghi lại mọi phép chuyển đổi
từ giá trị được yêu cầu sang giá trị được áp dụng.
</Note>

## Cấu hình

### Lựa chọn mô hình

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Thứ tự chọn nhà cung cấp

OpenClaw thử các nhà cung cấp theo thứ tự sau:

1. **Tham số `model`** từ lệnh gọi công cụ (nếu agent chỉ định).
2. **`imageGenerationModel.primary`** từ cấu hình.
3. **`imageGenerationModel.fallbacks`** theo thứ tự.
4. **Tự động phát hiện** - chỉ các giá trị mặc định của nhà cung cấp có thông tin xác thực:
   - nhà cung cấp mặc định hiện tại trước;
   - các nhà cung cấp tạo ảnh đã đăng ký còn lại theo thứ tự mã định danh nhà cung cấp.

Nếu một nhà cung cấp gặp lỗi (lỗi xác thực, giới hạn tốc độ, v.v.), ứng viên
được cấu hình tiếp theo sẽ tự động được thử. Nếu tất cả đều thất bại, lỗi sẽ bao gồm chi tiết
từ từng lần thử.

<AccordionGroup>
  <Accordion title="Giá trị ghi đè mô hình cho từng lệnh gọi là chính xác">
    Giá trị ghi đè `model` cho từng lệnh gọi chỉ thử nhà cung cấp/mô hình đó và
    không tiếp tục tới nhà cung cấp chính/dự phòng đã cấu hình hoặc các nhà cung cấp được tự động phát hiện.
  </Accordion>
  <Accordion title="Tự động phát hiện có nhận biết xác thực">
    Giá trị mặc định của một nhà cung cấp chỉ được đưa vào danh sách ứng viên khi OpenClaw thực sự có thể
    xác thực với nhà cung cấp đó. Đặt
    `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ sử dụng
    các mục `model`, `primary` và `fallbacks` được chỉ định rõ ràng.
  </Accordion>
  <Accordion title="Thời gian chờ">
    Đặt `agents.defaults.imageGenerationModel.timeoutMs` cho các phần phụ trợ tạo ảnh
    chậm. Tham số công cụ `timeoutMs` cho từng lệnh gọi sẽ ghi đè giá trị mặc định đã cấu hình,
    và các giá trị mặc định đã cấu hình sẽ ghi đè giá trị mặc định của nhà cung cấp
    do plugin tạo. Các nhà cung cấp ảnh được lưu trữ trên Google và OpenRouter sử dụng giá trị mặc định
    180 giây; tính năng tạo ảnh của Microsoft Foundry MAI, xAI và Azure OpenAI sử dụng
    600 giây. Các lệnh gọi công cụ động của Codex sử dụng giá trị mặc định cầu nối `image_generate`
    là 120 giây và tuân theo cùng ngân sách thời gian chờ khi được cấu hình, với giới hạn
    tối đa 600000 ms của cầu nối công cụ động OpenClaw.
  </Accordion>
  <Accordion title="Kiểm tra khi chạy">
    Sử dụng `action: "list"` để kiểm tra các nhà cung cấp hiện đã đăng ký,
    mô hình mặc định của chúng và gợi ý về biến môi trường xác thực.
  </Accordion>
</AccordionGroup>

### Chỉnh sửa ảnh

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI và xAI hỗ trợ chỉnh sửa ảnh tham chiếu. Các mô hình Krea 2 trên fal sử dụng
cùng các trường `image` / `images` làm tham chiếu phong cách thay vì đầu vào
chỉnh sửa. Truyền đường dẫn hoặc URL của ảnh tham chiếu:

```text
"Tạo phiên bản màu nước của bức ảnh này" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter và Google hỗ trợ tối đa 5 ảnh tham chiếu qua tham số
`images`; xAI hỗ trợ tối đa 3. fal hỗ trợ 1 ảnh tham chiếu cho
Flux chuyển ảnh thành ảnh, tối đa 10 ảnh cho chỉnh sửa GPT Image 2, tối đa 10 tham chiếu phong cách
cho Krea 2 và tối đa 14 ảnh cho chỉnh sửa Nano Banana 2. Microsoft Foundry, MiniMax
và ComfyUI hỗ trợ 1 ảnh.

## Tìm hiểu chuyên sâu về nhà cung cấp

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (và gpt-image-1.5)">
    Tính năng tạo ảnh của OpenAI mặc định sử dụng `openai/gpt-image-2`. Nếu hồ sơ OAuth
    `openai` được cấu hình, OpenClaw sẽ tái sử dụng cùng hồ sơ
    OAuth mà các mô hình trò chuyện theo gói đăng ký Codex sử dụng và gửi
    yêu cầu ảnh qua phần phụ trợ Codex Responses. Các URL cơ sở Codex cũ
    như `https://chatgpt.com/backend-api` được chuẩn hóa thành
    `https://chatgpt.com/backend-api/codex` cho các yêu cầu ảnh. OpenClaw
    **không** âm thầm chuyển dự phòng sang `OPENAI_API_KEY` cho yêu cầu đó -
    để buộc định tuyến trực tiếp qua OpenAI Images API, hãy cấu hình
    `models.providers.openai` một cách rõ ràng bằng khóa API, URL cơ sở tùy chỉnh
    hoặc điểm cuối Azure.

    Các mô hình `openai/gpt-image-1.5`, `openai/gpt-image-1` và
    `openai/gpt-image-1-mini` vẫn có thể được chọn rõ ràng. Sử dụng
    `gpt-image-1.5` để xuất PNG/WebP với nền trong suốt; API
    `gpt-image-2` hiện tại từ chối `background: "transparent"`.

    `gpt-image-2` hỗ trợ cả tạo ảnh từ văn bản và
    chỉnh sửa ảnh tham chiếu thông qua cùng công cụ `image_generate`.
    OpenClaw chuyển tiếp `prompt`, `count`, `size`, `quality`, `outputFormat`
    và các ảnh tham chiếu tới OpenAI. OpenAI **không** trực tiếp nhận
    `aspectRatio` hoặc `resolution`; khi có thể, OpenClaw ánh xạ
    chúng sang một `size` được hỗ trợ, nếu không công cụ sẽ báo cáo chúng là
    các giá trị ghi đè bị bỏ qua.

    Các tùy chọn dành riêng cho OpenAI nằm trong đối tượng `openai`:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` chấp nhận `transparent`, `opaque` hoặc `auto`;
    đầu ra trong suốt yêu cầu `outputFormat` `png` hoặc `webp` và một
    mô hình ảnh OpenAI có khả năng hỗ trợ độ trong suốt. OpenClaw định tuyến các yêu cầu
    nền trong suốt `gpt-image-2` mặc định tới `gpt-image-1.5`.
    `openai.outputCompression` áp dụng cho đầu ra JPEG/WebP và bị bỏ qua
    đối với đầu ra PNG.

    Gợi ý `background` cấp cao nhất không phụ thuộc nhà cung cấp và hiện được ánh xạ
    tới cùng trường yêu cầu `background` của OpenAI khi nhà cung cấp OpenAI
    được chọn. Các nhà cung cấp không khai báo hỗ trợ nền sẽ trả về
    giá trị này trong `ignoredOverrides` thay vì nhận tham số không được hỗ trợ.

    Để định tuyến tính năng tạo ảnh OpenAI qua một bản triển khai Azure OpenAI
    thay vì `api.openai.com`, hãy xem
    [Các điểm cuối Azure OpenAI](/vi/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Các mô hình ảnh Microsoft Foundry MAI">
    Tính năng tạo ảnh Microsoft Foundry sử dụng tên bản triển khai ảnh MAI đã triển khai
    dưới tiền tố nhà cung cấp `microsoft-foundry/`. Không có mô hình mặc định
    ở cấp nhà cung cấp vì API MAI yêu cầu tên bản triển khai của bạn trong
    trường `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Nhà cung cấp sử dụng API MAI của Microsoft Foundry, không phải OpenAI Images API:

    - Điểm cuối tạo ảnh: `/mai/v1/images/generations`
    - Điểm cuối chỉnh sửa: `/mai/v1/images/edits`
    - Xác thực: `AZURE_OPENAI_API_KEY` / khóa API của nhà cung cấp, hoặc Entra ID thông qua `az login`
    - Đầu ra: một ảnh PNG
    - Kích thước: mặc định `1024x1024`; chiều rộng và chiều cao đều phải ít nhất là 768 px,
      và tổng số pixel không được vượt quá 1,048,576
    - Chỉnh sửa: một ảnh tham chiếu PNG hoặc JPEG, chỉ được hỗ trợ bởi
      các bản triển khai `MAI-Image-2.5-Flash` và `MAI-Image-2.5`

    Việc tạo ảnh chỉ từ câu lệnh có thể sử dụng tên bản triển khai tùy chỉnh khi chỉ
    cấu hình điểm cuối Foundry. Chỉnh sửa bằng tên bản triển khai tùy chỉnh cần
    siêu dữ liệu hướng dẫn ban đầu/mô hình để OpenClaw có thể xác minh rằng bản triển khai
    được hỗ trợ bởi `MAI-Image-2.5-Flash` hoặc `MAI-Image-2.5`.

    Các mô hình ảnh MAI hiện tại là `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` và `MAI-Image-2`. Xem
    [Plugin Microsoft Foundry](/vi/plugins/reference/microsoft-foundry) để biết cách thiết lập
    và hành vi của mô hình trò chuyện.

  </Accordion>
  <Accordion title="Các mô hình ảnh OpenRouter">
    Tính năng tạo ảnh OpenRouter sử dụng cùng `OPENROUTER_API_KEY` và
    định tuyến qua API ảnh hoàn thành trò chuyện của OpenRouter. Chọn
    các mô hình ảnh OpenRouter bằng tiền tố `openrouter/`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw chuyển tiếp `prompt`, `count`, các ảnh tham chiếu và
    gợi ý `aspectRatio` / `resolution` tương thích với Gemini tới OpenRouter.
    Các lối tắt tích hợp sẵn hiện tại cho mô hình ảnh OpenRouter bao gồm
    `google/gemini-3.1-flash-image`,
    `google/gemini-3-pro-image` và `openai/gpt-5.4-image-2`. Sử dụng
    `action: "list"` để xem plugin đã cấu hình của bạn cung cấp những gì.

  </Accordion>
  <Accordion title="fal Krea 2">
    Các mô hình Krea 2 trên fal sử dụng lược đồ Krea gốc của fal thay vì lược đồ
    `image_size` chung mà Flux sử dụng. OpenClaw gửi:

    - `aspect_ratio` cho các gợi ý về tỷ lệ khung hình
    - `creativity`, mặc định là `medium`
    - `image_style_references` khi `image` hoặc `images` được cung cấp

    Chọn Krea 2 Medium để có hình minh họa giàu biểu cảm nhanh hơn và Krea 2 Large
    để có hình ảnh chân thực và nhiều kết cấu, chi tiết hơn nhưng chậm hơn:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 hiện trả về một ảnh cho mỗi yêu cầu. Ưu tiên `aspectRatio` cho
    Krea; OpenClaw ánh xạ `size` tới tỷ lệ khung hình Krea được hỗ trợ gần nhất và
    từ chối `resolution` đối với Krea thay vì bỏ qua nó. Sử dụng `fal.creativity`
    khi bạn muốn mức độ sáng tạo gốc của Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "Chân dung tạp chí cyber với kết cấu in risograph",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Xác thực kép MiniMax">
    Tính năng tạo ảnh MiniMax khả dụng qua cả hai
    phương thức xác thực MiniMax đi kèm:

    - `minimax/image-01` cho thiết lập bằng khóa API
    - `minimax-portal/image-01` cho thiết lập bằng OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Nhà cung cấp xAI đi kèm sử dụng `/v1/images/generations` cho các yêu cầu
    chỉ có câu lệnh và `/v1/images/edits` khi có `image` hoặc `images`.

    - Mô hình: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Số lượng: tối đa 4
    - Tham chiếu: một `image` hoặc tối đa ba `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Độ phân giải: `1K`, `2K`
    - Đầu ra: được trả về dưới dạng tệp đính kèm ảnh do OpenClaw quản lý

    OpenClaw chủ ý không cung cấp `quality`, `mask`,
    `user` gốc của xAI hoặc tỷ lệ khung hình `auto` cho đến khi các điều khiển đó tồn tại trong
    hợp đồng `image_generate` dùng chung giữa các nhà cung cấp.

  </Accordion>
</AccordionGroup>

## Ví dụ

<Tabs>
  <Tab title="Tạo (phong cảnh 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Áp phích biên tập gọn gàng cho tính năng tạo ảnh OpenClaw" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Tạo (PNG trong suốt)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="Nhãn dán hình tròn màu đỏ đơn giản trên nền trong suốt" outputFormat=png background=transparent
```

CLI tương đương:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Nhãn dán hình tròn màu đỏ đơn giản trên nền trong suốt" \
  --json
```

  </Tab>
  <Tab title="Tạo (OpenAI chất lượng thấp)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Bản nháp áp phích chi phí thấp cho một ứng dụng năng suất yên tĩnh" quality=low openai='{"moderation":"low"}'
```

CLI tương đương:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Bản nháp áp phích chi phí thấp cho một ứng dụng năng suất yên tĩnh" \
  --json
```

  </Tab>
  <Tab title="Tạo (hai ảnh vuông)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Hai định hướng hình ảnh cho biểu tượng của một ứng dụng năng suất nhẹ nhàng" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Chỉnh sửa (một ảnh tham chiếu)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Giữ nguyên chủ thể, thay nền bằng bối cảnh studio sáng" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Chỉnh sửa (nhiều ảnh tham chiếu)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Kết hợp đặc điểm nhận diện nhân vật từ ảnh đầu tiên với bảng màu từ ảnh thứ hai" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Tham chiếu phong cách Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Một bức chân dung biên tập giàu biểu cảm sử dụng bảng màu và họa tiết in này" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Các cờ `--output-format`, `--background`, `--quality` và
`--openai-moderation` tương tự cũng có trên `openclaw infer image edit`;
`--openai-background` vẫn là bí danh dành riêng cho OpenAI. Hiện tại, các nhà cung cấp
đi kèm ngoài OpenAI không khai báo rõ khả năng kiểm soát nền, vì vậy
`background: "transparent"` được báo cáo là bị bỏ qua đối với chúng.

## Liên quan

- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ tác tử hiện có
- [ComfyUI](/vi/providers/comfy) - thiết lập quy trình làm việc cho ComfyUI cục bộ và Comfy Cloud
- [fal](/vi/providers/fal) - thiết lập nhà cung cấp hình ảnh và video fal
- [Google (Gemini)](/vi/providers/google) - thiết lập nhà cung cấp hình ảnh Gemini
- [Plugin Microsoft Foundry](/vi/plugins/reference/microsoft-foundry) - thiết lập trò chuyện Microsoft Foundry và hình ảnh MAI
- [MiniMax](/vi/providers/minimax) - thiết lập nhà cung cấp hình ảnh MiniMax
- [OpenAI](/vi/providers/openai) - thiết lập nhà cung cấp OpenAI Images
- [Vydra](/vi/providers/vydra) - thiết lập hình ảnh, video và giọng nói Vydra
- [xAI](/vi/providers/xai) - thiết lập hình ảnh, video, tìm kiếm, thực thi mã và TTS Grok
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - cấu hình `imageGenerationModel`
- [Mô hình](/vi/concepts/models) - cấu hình mô hình và chuyển đổi dự phòng
