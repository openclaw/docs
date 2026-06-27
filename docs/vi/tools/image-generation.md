---
read_when:
    - Tạo hoặc chỉnh sửa hình ảnh thông qua agent
    - Cấu hình nhà cung cấp và mô hình tạo hình ảnh
    - Tìm hiểu các tham số của công cụ image_generate
sidebarTitle: Image generation
summary: Tạo và chỉnh sửa hình ảnh qua image_generate trên OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Tạo hình ảnh
x-i18n:
    generated_at: "2026-06-27T18:16:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

Công cụ `image_generate` cho phép tác tử tạo và chỉnh sửa hình ảnh bằng các
nhà cung cấp đã cấu hình của bạn. Trong các phiên trò chuyện, việc tạo hình ảnh chạy bất đồng bộ:
OpenClaw ghi lại một tác vụ nền, trả về mã tác vụ ngay lập tức và đánh thức
tác tử khi nhà cung cấp hoàn tất. Tác tử hoàn tất tuân theo chế độ trả lời hiển thị
bình thường của phiên: tự động gửi câu trả lời cuối cùng khi được
cấu hình, hoặc `message(action="send")` khi phiên yêu cầu công cụ
tin nhắn. Nếu phiên yêu cầu không hoạt động hoặc lần đánh thức đang hoạt động của phiên thất bại, và một số
hình ảnh đã tạo vẫn còn thiếu trong câu trả lời hoàn tất, OpenClaw gửi một
phương án dự phòng trực tiếp có tính lũy đẳng chỉ với các hình ảnh còn thiếu.

<Note>
Công cụ chỉ xuất hiện khi có ít nhất một nhà cung cấp tạo hình ảnh
khả dụng. Nếu bạn không thấy `image_generate` trong các công cụ của tác tử,
hãy cấu hình `agents.defaults.imageGenerationModel`, thiết lập khóa API của nhà cung cấp,
hoặc đăng nhập bằng OpenAI ChatGPT/Codex OAuth.
</Note>

## Bắt đầu nhanh

<Steps>
  <Step title="Cấu hình xác thực">
    Đặt khóa API cho ít nhất một nhà cung cấp (ví dụ `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) hoặc đăng nhập bằng OpenAI Codex OAuth.
  </Step>
  <Step title="Chọn mô hình mặc định (tùy chọn)">
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

    ChatGPT/Codex OAuth dùng cùng tham chiếu mô hình `openai/gpt-image-2`. Khi một
    hồ sơ OAuth `openai` được cấu hình, OpenClaw định tuyến các yêu cầu hình ảnh
    qua hồ sơ OAuth đó thay vì thử
    `OPENAI_API_KEY` trước. Cấu hình `models.providers.openai` rõ ràng (khóa API,
    URL cơ sở tùy chỉnh/Azure) chọn lại tuyến OpenAI Images API trực tiếp.

  </Step>
  <Step title="Yêu cầu tác tử">
    _"Tạo một hình ảnh về linh vật robot thân thiện."_

    Tác tử tự động gọi `image_generate`. Không cần đưa công cụ vào danh sách cho phép
    - công cụ này được bật theo mặc định khi có nhà cung cấp khả dụng. Công cụ
    trả về một mã tác vụ nền, sau đó tác tử hoàn tất gửi tệp đính kèm đã tạo
    qua công cụ `message` khi sẵn sàng.

  </Step>
</Steps>

<Warning>
Đối với các điểm cuối LAN tương thích OpenAI như LocalAI, hãy giữ
`models.providers.openai.baseUrl` tùy chỉnh và chủ động chọn dùng với
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Các điểm cuối hình ảnh riêng tư và
nội bộ vẫn bị chặn theo mặc định.
</Warning>

## Các tuyến phổ biến

| Mục tiêu                                             | Tham chiếu mô hình                                | Xác thực                               |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Tạo hình ảnh OpenAI với tính phí API                 | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Tạo hình ảnh OpenAI với xác thực thuê bao Codex      | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP nền trong suốt của OpenAI                   | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` hoặc OpenAI Codex OAuth |
| Tạo hình ảnh DeepInfra                               | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 tạo hình biểu cảm/theo phong cách         | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Tạo hình ảnh OpenRouter                              | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Tạo hình ảnh LiteLLM                                 | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Tạo hình ảnh Microsoft Foundry MAI                   | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` hoặc Entra ID   |
| Tạo hình ảnh Google Gemini                           | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` |

Cùng công cụ `image_generate` xử lý tạo hình từ văn bản và chỉnh sửa
bằng hình ảnh tham chiếu. Dùng `image` cho một hình ảnh tham chiếu hoặc `images` cho nhiều hình ảnh tham chiếu.
Đối với các mô hình Krea 2 trên fal, các tham chiếu đó được gửi dưới dạng tham chiếu phong cách
thay vì đầu vào chỉnh sửa.
Các gợi ý đầu ra được nhà cung cấp hỗ trợ như `quality`, `outputFormat` và
`background` được chuyển tiếp khi khả dụng và được báo cáo là bị bỏ qua khi một
nhà cung cấp không hỗ trợ chúng. Hỗ trợ nền trong suốt đi kèm chỉ
dành riêng cho OpenAI; các nhà cung cấp khác vẫn có thể giữ alpha PNG nếu
backend của họ phát ra alpha đó.

## Nhà cung cấp được hỗ trợ

| Nhà cung cấp      | Mô hình mặc định                        | Hỗ trợ chỉnh sửa                   | Xác thực                                               |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Có (1 hình ảnh, do workflow cấu hình) | `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY` cho đám mây |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Có (1 hình ảnh)                    | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Có (giới hạn tùy theo mô hình)     | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Có                                 | `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`                |
| LiteLLM           | `gpt-image-2`                           | Có (tối đa 5 hình ảnh đầu vào)     | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Có (chỉ mô hình MAI-Image-2.5)     | `AZURE_OPENAI_API_KEY` hoặc Entra ID (`az login`)     |
| MiniMax           | `image-01`                              | Có (tham chiếu chủ thể)            | `MINIMAX_API_KEY` hoặc MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Có (tối đa 4 hình ảnh)             | `OPENAI_API_KEY` hoặc OpenAI ChatGPT/Codex OAuth      |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Có (tối đa 5 hình ảnh đầu vào)     | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Không                              | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Có (tối đa 5 hình ảnh)             | `XAI_API_KEY`                                         |

Dùng `action: "list"` để kiểm tra các nhà cung cấp và mô hình khả dụng khi chạy:

```text
/tool image_generate action=list
```

Dùng `action: "status"` để kiểm tra tác vụ tạo hình ảnh đang hoạt động cho
phiên hiện tại:

```text
/tool image_generate action=status
```

## Khả năng của nhà cung cấp

| Khả năng              | ComfyUI             | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Tạo (số lượng tối đa) | Do workflow xác định | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Chỉnh sửa / tham chiếu | 1 hình ảnh (workflow) | 1 hình ảnh | Flux: 1; GPT: 10; tham chiếu phong cách Krea: 10; NB2: 14 | Tối đa 5 hình ảnh | 1 hình ảnh       | 1 hình ảnh (tham chiếu chủ thể) | Tối đa 5 hình ảnh | -     | Tối đa 5 hình ảnh |
| Kiểm soát kích thước  | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Tối đa 4K      | -     | -              |
| Tỷ lệ khung hình      | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Độ phân giải (1K/2K/4K) | -                | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Tham số công cụ

<ParamField path="prompt" type="string" required>
  Lời nhắc tạo hình ảnh. Bắt buộc cho `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Dùng `"status"` để kiểm tra tác vụ phiên đang hoạt động hoặc `"list"` để kiểm tra
  các nhà cung cấp và mô hình khả dụng khi chạy.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè nhà cung cấp/mô hình (ví dụ `openai/gpt-image-2`). Dùng
  `openai/gpt-image-1.5` cho nền OpenAI trong suốt.
</ParamField>
<ParamField path="image" type="string">
  Đường dẫn hoặc URL hình ảnh tham chiếu đơn cho chế độ chỉnh sửa.
</ParamField>
<ParamField path="images" type="string[]">
  Nhiều hình ảnh tham chiếu cho chế độ chỉnh sửa hoặc mô hình tham chiếu phong cách (tối đa 10
  qua công cụ dùng chung; giới hạn riêng của nhà cung cấp vẫn áp dụng).
</ParamField>
<ParamField path="size" type="string">
  Gợi ý kích thước: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Tỷ lệ khung hình: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Các nhà cung cấp
  xác thực tập con riêng theo mô hình của họ.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Gợi ý độ phân giải.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Gợi ý chất lượng khi nhà cung cấp hỗ trợ.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Gợi ý định dạng đầu ra khi nhà cung cấp hỗ trợ.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Gợi ý nền khi nhà cung cấp hỗ trợ. Dùng `transparent` với
  `outputFormat: "png"` hoặc `"webp"` cho các nhà cung cấp có khả năng trong suốt.
</ParamField>
<ParamField path="count" type="number">Số hình ảnh cần tạo (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Thời gian chờ yêu cầu nhà cung cấp tùy chọn, tính bằng mili giây. Khi Codex gọi
  `image_generate` qua công cụ động, giá trị theo từng lần gọi này vẫn ghi đè
  mặc định đã cấu hình và bị giới hạn ở 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Gợi ý tên tệp đầu ra.</ParamField>
<ParamField path="openai" type="object">
  Gợi ý chỉ dành cho OpenAI: `background`, `moderation`, `outputCompression` và `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Kiểm soát sáng tạo fal Krea 2. Mặc định là `medium`.
</ParamField>

<Note>
Không phải mọi nhà cung cấp đều hỗ trợ tất cả tham số. Khi một nhà cung cấp dự phòng hỗ trợ một
tùy chọn hình học gần tương tự thay vì đúng tùy chọn được yêu cầu, OpenClaw ánh xạ lại sang
kích thước, tỷ lệ khung hình hoặc độ phân giải được hỗ trợ gần nhất trước khi gửi.
Các gợi ý đầu ra không được hỗ trợ sẽ bị loại bỏ đối với các nhà cung cấp không khai báo
hỗ trợ và được báo cáo trong kết quả công cụ. Kết quả công cụ báo cáo các
thiết lập đã áp dụng; `details.normalization` ghi lại mọi chuyển đổi
từ yêu cầu sang áp dụng.
</Note>

## Cấu hình

### Chọn mô hình

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Thứ tự chọn nhà cung cấp

OpenClaw thử các nhà cung cấp theo thứ tự này:

1. Tham số **`model`** từ lệnh gọi công cụ (nếu agent chỉ định).
2. **`imageGenerationModel.primary`** từ cấu hình.
3. **`imageGenerationModel.fallbacks`** theo thứ tự.
4. **Tự động phát hiện** - chỉ các mặc định của nhà cung cấp dựa trên xác thực:
   - nhà cung cấp mặc định hiện tại trước;
   - các nhà cung cấp tạo ảnh đã đăng ký còn lại theo thứ tự provider-id.

Nếu một nhà cung cấp thất bại (lỗi xác thực, giới hạn tốc độ, v.v.), ứng viên
đã cấu hình tiếp theo sẽ được thử tự động. Nếu tất cả đều thất bại, lỗi sẽ bao
gồm chi tiết từ từng lần thử.

<AccordionGroup>
  <Accordion title="Các ghi đè mô hình theo từng lệnh gọi là chính xác">
    Một ghi đè `model` theo từng lệnh gọi chỉ thử nhà cung cấp/mô hình đó và
    không tiếp tục sang primary/fallback đã cấu hình hoặc các nhà cung cấp được
    tự động phát hiện.
  </Accordion>
  <Accordion title="Tự động phát hiện có nhận biết xác thực">
    Một mặc định của nhà cung cấp chỉ được đưa vào danh sách ứng viên khi OpenClaw
    thực sự có thể xác thực nhà cung cấp đó. Đặt
    `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ dùng các
    mục `model`, `primary` và `fallbacks` rõ ràng.
  </Accordion>
  <Accordion title="Thời gian chờ">
    Đặt `agents.defaults.imageGenerationModel.timeoutMs` cho các backend tạo ảnh
    chậm. Tham số công cụ `timeoutMs` theo từng lệnh gọi ghi đè mặc định đã cấu hình,
    và các mặc định đã cấu hình ghi đè các mặc định của nhà cung cấp do Plugin tạo.
    Các nhà cung cấp ảnh được lưu trữ trên Google và OpenRouter dùng mặc định 180 giây;
    tạo ảnh Microsoft Foundry MAI, xAI và Azure OpenAI dùng 600 giây. Các lệnh gọi
    công cụ động của Codex dùng mặc định bridge `image_generate` 120 giây và tôn trọng
    cùng ngân sách thời gian chờ khi được cấu hình, bị giới hạn bởi mức tối đa bridge
    công cụ động 600000 ms của OpenClaw.
  </Accordion>
  <Accordion title="Kiểm tra lúc chạy">
    Dùng `action: "list"` để kiểm tra các nhà cung cấp hiện đang được đăng ký,
    mô hình mặc định của chúng và các gợi ý biến môi trường xác thực.
  </Accordion>
</AccordionGroup>

### Chỉnh sửa ảnh

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI và xAI hỗ trợ chỉnh sửa ảnh tham chiếu. Các mô hình Krea 2 trên fal dùng
cùng các trường `image` / `images` làm tham chiếu phong cách thay vì đầu vào chỉnh sửa.
Truyền vào đường dẫn hoặc URL ảnh tham chiếu:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google và xAI hỗ trợ tối đa 5 ảnh tham chiếu qua tham số
`images`. fal hỗ trợ 1 ảnh tham chiếu cho Flux image-to-image, tối đa 10 cho
chỉnh sửa GPT Image 2, tối đa 10 tham chiếu phong cách cho Krea 2, và tối đa
14 cho chỉnh sửa Nano Banana 2. Microsoft Foundry, MiniMax và ComfyUI hỗ trợ 1.

## Phân tích sâu theo nhà cung cấp

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (và gpt-image-1.5)">
    Tạo ảnh OpenAI mặc định dùng `openai/gpt-image-2`. Nếu một hồ sơ OAuth
    `openai` được cấu hình, OpenClaw tái sử dụng cùng hồ sơ OAuth mà các mô hình
    chat thuê bao Codex dùng và gửi yêu cầu ảnh qua backend Codex Responses.
    Các URL cơ sở Codex cũ như `https://chatgpt.com/backend-api` được chuẩn hóa
    thành `https://chatgpt.com/backend-api/codex` cho yêu cầu ảnh. OpenClaw
    **không** âm thầm chuyển dự phòng sang `OPENAI_API_KEY` cho yêu cầu đó -
    để buộc định tuyến trực tiếp qua OpenAI Images API, hãy cấu hình rõ ràng
    `models.providers.openai` với API key, URL cơ sở tùy chỉnh hoặc endpoint Azure.

    Các mô hình `openai/gpt-image-1.5`, `openai/gpt-image-1` và
    `openai/gpt-image-1-mini` vẫn có thể được chọn rõ ràng. Dùng
    `gpt-image-1.5` cho đầu ra PNG/WebP nền trong suốt; API `gpt-image-2`
    hiện tại từ chối `background: "transparent"`.

    `gpt-image-2` hỗ trợ cả tạo ảnh từ văn bản và chỉnh sửa ảnh tham chiếu qua
    cùng công cụ `image_generate`. OpenClaw chuyển tiếp `prompt`, `count`, `size`,
    `quality`, `outputFormat` và ảnh tham chiếu tới OpenAI. OpenAI **không** nhận
    trực tiếp `aspectRatio` hoặc `resolution`; khi có thể, OpenClaw ánh xạ chúng
    vào một `size` được hỗ trợ, nếu không công cụ sẽ báo chúng là các ghi đè bị bỏ qua.

    Các tùy chọn riêng của OpenAI nằm dưới đối tượng `openai`:

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
    đầu ra trong suốt yêu cầu `outputFormat` là `png` hoặc `webp` và một mô hình
    ảnh OpenAI có khả năng trong suốt. OpenClaw định tuyến các yêu cầu nền trong
    suốt mặc định `gpt-image-2` sang `gpt-image-1.5`.
    `openai.outputCompression` áp dụng cho đầu ra JPEG/WebP và bị bỏ qua
    cho đầu ra PNG.

    Gợi ý `background` cấp cao nhất là trung lập với nhà cung cấp và hiện ánh xạ
    tới cùng trường yêu cầu `background` của OpenAI khi nhà cung cấp OpenAI được chọn.
    Các nhà cung cấp không khai báo hỗ trợ nền sẽ trả nó trong `ignoredOverrides`
    thay vì nhận tham số không được hỗ trợ.

    Để định tuyến tạo ảnh OpenAI qua một deployment Azure OpenAI thay vì
    `api.openai.com`, xem
    [endpoint Azure OpenAI](/vi/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Các mô hình ảnh Microsoft Foundry MAI">
    Tạo ảnh Microsoft Foundry dùng tên deployment ảnh MAI đã triển khai dưới
    tiền tố nhà cung cấp `microsoft-foundry/`. Không có mô hình mặc định cấp
    nhà cung cấp vì MAI API yêu cầu tên deployment của bạn trong trường `model`:

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

    Nhà cung cấp dùng MAI API của Microsoft Foundry, không phải OpenAI Images API:

    - Endpoint tạo: `/mai/v1/images/generations`
    - Endpoint chỉnh sửa: `/mai/v1/images/edits`
    - Xác thực: `AZURE_OPENAI_API_KEY` / API key của nhà cung cấp, hoặc Entra ID qua `az login`
    - Đầu ra: một ảnh PNG
    - Kích thước: mặc định `1024x1024`; chiều rộng và chiều cao mỗi chiều phải ít nhất 768 px,
      và tổng số pixel tối đa là 1.048.576
    - Chỉnh sửa: một ảnh tham chiếu PNG hoặc JPEG, chỉ được hỗ trợ bởi các deployment
      `MAI-Image-2.5-Flash` và `MAI-Image-2.5`

    Tạo chỉ từ prompt có thể dùng tên deployment tùy chỉnh chỉ với endpoint
    Foundry được cấu hình. Chỉnh sửa bằng tên deployment tùy chỉnh cần metadata
    onboarding/mô hình để OpenClaw có thể xác minh rằng deployment được hỗ trợ bởi
    `MAI-Image-2.5-Flash` hoặc `MAI-Image-2.5`.

    Các mô hình ảnh MAI hiện tại là `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` và `MAI-Image-2`. Xem
    [Plugin Microsoft Foundry](/vi/plugins/reference/microsoft-foundry) để biết thiết lập
    và hành vi mô hình chat.

  </Accordion>
  <Accordion title="Các mô hình ảnh OpenRouter">
    Tạo ảnh OpenRouter dùng cùng `OPENROUTER_API_KEY` và định tuyến qua image API
    chat completions của OpenRouter. Chọn các mô hình ảnh OpenRouter bằng tiền tố
    `openrouter/`:

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

    OpenClaw chuyển tiếp `prompt`, `count`, ảnh tham chiếu và các gợi ý
    `aspectRatio` / `resolution` tương thích Gemini tới OpenRouter.
    Các lối tắt mô hình ảnh OpenRouter tích hợp hiện tại gồm
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` và `openai/gpt-5.4-image-2`. Dùng
    `action: "list"` để xem Plugin đã cấu hình của bạn cung cấp những gì.

  </Accordion>
  <Accordion title="fal Krea 2">
    Các mô hình Krea 2 trên fal dùng schema Krea gốc của fal thay vì schema
    `image_size` chung mà Flux dùng. OpenClaw gửi:

    - `aspect_ratio` cho các gợi ý tỷ lệ khung hình
    - `creativity`, mặc định là `medium`
    - `image_style_references` khi `image` hoặc `images` được cung cấp

    Chọn Krea 2 Medium để có minh họa biểu cảm nhanh hơn và Krea 2 Large
    để có giao diện chân thực và nhiều chi tiết/kết cấu hơn nhưng chậm hơn:

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
    Krea; OpenClaw ánh xạ `size` sang tỷ lệ khung hình Krea được hỗ trợ gần nhất
    và từ chối `resolution` cho Krea thay vì bỏ qua nó. Dùng `fal.creativity`
    khi bạn muốn mức độ sáng tạo Krea gốc:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Xác thực kép MiniMax">
    Tạo ảnh MiniMax khả dụng qua cả hai đường dẫn xác thực MiniMax được đóng gói:

    - `minimax/image-01` cho các thiết lập API key
    - `minimax-portal/image-01` cho các thiết lập OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Nhà cung cấp xAI được đóng gói dùng `/v1/images/generations` cho các yêu cầu
    chỉ có prompt và `/v1/images/edits` khi có `image` hoặc `images`.

    - Mô hình: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Số lượng: tối đa 4
    - Tham chiếu: một `image` hoặc tối đa năm `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Độ phân giải: `1K`, `2K`
    - Đầu ra: được trả về dưới dạng tệp đính kèm ảnh do OpenClaw quản lý

    OpenClaw cố ý không phơi bày `quality`, `mask`, `user` hoặc các tỷ lệ khung hình
    chỉ gốc bổ sung của xAI cho đến khi các điều khiển đó tồn tại trong hợp đồng
    `image_generate` dùng chung xuyên nhà cung cấp.

  </Accordion>
</AccordionGroup>

## Ví dụ

<Tabs>
  <Tab title="Tạo (phong cảnh 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Tạo (PNG trong suốt)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI tương đương:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Tạo (OpenAI chất lượng thấp)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI tương đương:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Các cờ `--output-format`, `--background`, `--quality` và
`--openai-moderation` tương tự cũng có trên `openclaw infer image edit`;
`--openai-background` vẫn là bí danh dành riêng cho OpenAI. Các nhà cung cấp đi kèm
khác ngoài OpenAI hiện không khai báo điều khiển nền rõ ràng, nên
`background: "transparent"` được báo cáo là bị bỏ qua đối với chúng.

## Liên quan

- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ agent hiện có
- [ComfyUI](/vi/providers/comfy) - thiết lập quy trình làm việc ComfyUI cục bộ và Comfy Cloud
- [fal](/vi/providers/fal) - thiết lập nhà cung cấp hình ảnh và video fal
- [Google (Gemini)](/vi/providers/google) - thiết lập nhà cung cấp hình ảnh Gemini
- [Plugin Microsoft Foundry](/vi/plugins/reference/microsoft-foundry) - thiết lập chat Microsoft Foundry và hình ảnh MAI
- [MiniMax](/vi/providers/minimax) - thiết lập nhà cung cấp hình ảnh MiniMax
- [OpenAI](/vi/providers/openai) - thiết lập nhà cung cấp OpenAI Images
- [Vydra](/vi/providers/vydra) - thiết lập hình ảnh, video và giọng nói Vydra
- [xAI](/vi/providers/xai) - thiết lập hình ảnh, video, tìm kiếm, thực thi mã và TTS Grok
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - cấu hình `imageGenerationModel`
- [Mô hình](/vi/concepts/models) - cấu hình mô hình và chuyển đổi dự phòng
