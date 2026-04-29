---
read_when:
    - Tạo hoặc chỉnh sửa hình ảnh thông qua tác tử
    - Cấu hình nhà cung cấp và mô hình tạo hình ảnh
    - Tìm hiểu các tham số của công cụ image_generate
sidebarTitle: Image generation
summary: Tạo và chỉnh sửa hình ảnh qua image_generate trên OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Tạo hình ảnh
x-i18n:
    generated_at: "2026-04-29T23:19:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

Công cụ `image_generate` cho phép tác tử tạo và chỉnh sửa hình ảnh bằng các
nhà cung cấp bạn đã cấu hình. Hình ảnh được tạo sẽ tự động được gửi dưới dạng
tệp đính kèm media trong phản hồi của tác tử.

<Note>
Công cụ này chỉ xuất hiện khi có ít nhất một nhà cung cấp tạo hình ảnh
khả dụng. Nếu bạn không thấy `image_generate` trong các công cụ của tác tử,
hãy cấu hình `agents.defaults.imageGenerationModel`, thiết lập khóa API của
nhà cung cấp, hoặc đăng nhập bằng OpenAI Codex OAuth.
</Note>

## Bắt đầu nhanh

<Steps>
  <Step title="Configure auth">
    Đặt khóa API cho ít nhất một nhà cung cấp (ví dụ `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) hoặc đăng nhập bằng OpenAI Codex OAuth.
  </Step>
  <Step title="Pick a default model (optional)">
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

    Codex OAuth dùng cùng tham chiếu mô hình `openai/gpt-image-2`. Khi một
    hồ sơ OAuth `openai-codex` được cấu hình, OpenClaw định tuyến các yêu cầu
    hình ảnh qua hồ sơ OAuth đó thay vì thử `OPENAI_API_KEY` trước.
    Cấu hình `models.providers.openai` rõ ràng (khóa API, URL cơ sở tùy chỉnh/Azure)
    sẽ chuyển lại sang tuyến OpenAI Images API trực tiếp.

  </Step>
  <Step title="Ask the agent">
    _"Tạo hình ảnh một linh vật robot thân thiện."_

    Tác tử tự động gọi `image_generate`. Không cần danh sách cho phép công cụ
    — công cụ này được bật theo mặc định khi có nhà cung cấp khả dụng.

  </Step>
</Steps>

<Warning>
Với các endpoint LAN tương thích OpenAI như LocalAI, hãy giữ
`models.providers.openai.baseUrl` tùy chỉnh và chủ động chọn tham gia bằng
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Các endpoint hình ảnh
riêng tư và nội bộ vẫn bị chặn theo mặc định.
</Warning>

## Tuyến phổ biến

| Mục tiêu                                             | Tham chiếu mô hình                                | Xác thực                               |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Tạo hình ảnh OpenAI với thanh toán qua API           | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Tạo hình ảnh OpenAI với xác thực đăng ký Codex       | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP nền trong suốt                       | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` hoặc OpenAI Codex OAuth |
| Tạo hình ảnh DeepInfra                               | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Tạo hình ảnh OpenRouter                              | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Tạo hình ảnh LiteLLM                                 | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Tạo hình ảnh Google Gemini                           | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` |

Cùng công cụ `image_generate` xử lý tạo hình từ văn bản và chỉnh sửa bằng
hình ảnh tham chiếu. Dùng `image` cho một tham chiếu hoặc `images` cho nhiều
tham chiếu. Các gợi ý đầu ra được nhà cung cấp hỗ trợ như `quality`,
`outputFormat` và `background` sẽ được chuyển tiếp khi khả dụng và được báo cáo
là đã bỏ qua khi nhà cung cấp không hỗ trợ. Hỗ trợ nền trong suốt đi kèm chỉ
dành riêng cho OpenAI; các nhà cung cấp khác vẫn có thể giữ alpha PNG nếu
backend của họ xuất ra định dạng đó.

## Nhà cung cấp được hỗ trợ

| Nhà cung cấp | Mô hình mặc định                       | Hỗ trợ chỉnh sửa                  | Xác thực                                              |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Có (1 hình ảnh, do workflow cấu hình) | `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY` cho cloud  |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Có (1 hình ảnh)                   | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Có                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Có                                | `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`                |
| LiteLLM    | `gpt-image-2`                           | Có (tối đa 5 hình ảnh đầu vào)    | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Có (tham chiếu chủ thể)           | `MINIMAX_API_KEY` hoặc MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Có (tối đa 4 hình ảnh)            | `OPENAI_API_KEY` hoặc OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Có (tối đa 5 hình ảnh đầu vào)    | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Không                             | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Có (tối đa 5 hình ảnh)            | `XAI_API_KEY`                                         |

Dùng `action: "list"` để kiểm tra các nhà cung cấp và mô hình khả dụng khi chạy:

```text
/tool image_generate action=list
```

## Khả năng của nhà cung cấp

| Khả năng              | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Tạo (số lượng tối đa) | Do workflow xác định | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Chỉnh sửa / tham chiếu | 1 hình ảnh (workflow) | 1 hình ảnh | 1 hình ảnh        | Tối đa 5 hình ảnh | 1 hình ảnh (tham chiếu chủ thể) | Tối đa 5 hình ảnh | —     | Tối đa 5 hình ảnh |
| Kiểm soát kích thước  | —                  | ✓         | ✓                 | ✓              | —                     | Tối đa 4K      | —     | —              |
| Tỷ lệ khung hình      | —                  | —         | ✓ (chỉ tạo)       | ✓              | ✓                     | —              | —     | ✓              |
| Độ phân giải (1K/2K/4K) | —                  | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Tham số công cụ

<ParamField path="prompt" type="string" required>
  Prompt tạo hình ảnh. Bắt buộc cho `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Dùng `"list"` để kiểm tra các nhà cung cấp và mô hình khả dụng khi chạy.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè nhà cung cấp/mô hình (ví dụ `openai/gpt-image-2`). Dùng
  `openai/gpt-image-1.5` cho nền OpenAI trong suốt.
</ParamField>
<ParamField path="image" type="string">
  Đường dẫn hoặc URL hình ảnh tham chiếu đơn cho chế độ chỉnh sửa.
</ParamField>
<ParamField path="images" type="string[]">
  Nhiều hình ảnh tham chiếu cho chế độ chỉnh sửa (tối đa 5 trên các nhà cung cấp hỗ trợ).
</ParamField>
<ParamField path="size" type="string">
  Gợi ý kích thước: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Tỷ lệ khung hình: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
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
  `outputFormat: "png"` hoặc `"webp"` cho các nhà cung cấp có khả năng hỗ trợ trong suốt.
</ParamField>
<ParamField path="count" type="number">Số hình ảnh cần tạo (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Thời gian chờ yêu cầu nhà cung cấp tùy chọn, tính bằng mili giây.</ParamField>
<ParamField path="filename" type="string">Gợi ý tên tệp đầu ra.</ParamField>
<ParamField path="openai" type="object">
  Gợi ý chỉ dành cho OpenAI: `background`, `moderation`, `outputCompression` và `user`.
</ParamField>

<Note>
Không phải mọi nhà cung cấp đều hỗ trợ tất cả tham số. Khi một nhà cung cấp
dự phòng hỗ trợ một tùy chọn hình học gần đúng thay vì tùy chọn chính xác được
yêu cầu, OpenClaw ánh xạ lại sang kích thước, tỷ lệ khung hình hoặc độ phân giải
được hỗ trợ gần nhất trước khi gửi. Các gợi ý đầu ra không được hỗ trợ sẽ bị
loại bỏ đối với những nhà cung cấp không khai báo hỗ trợ và được báo cáo trong
kết quả công cụ. Kết quả công cụ báo cáo các thiết lập đã áp dụng;
`details.normalization` ghi lại mọi chuyển đổi từ yêu cầu sang áp dụng.
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

1. Tham số **`model`** từ lệnh gọi công cụ (nếu tác tử chỉ định).
2. **`imageGenerationModel.primary`** từ cấu hình.
3. **`imageGenerationModel.fallbacks`** theo thứ tự.
4. **Tự động phát hiện** — chỉ các mặc định nhà cung cấp có xác thực:
   - nhà cung cấp mặc định hiện tại trước;
   - các nhà cung cấp tạo hình ảnh đã đăng ký còn lại theo thứ tự provider-id.

Nếu một nhà cung cấp thất bại (lỗi xác thực, giới hạn tốc độ, v.v.), ứng viên
đã cấu hình tiếp theo sẽ tự động được thử. Nếu tất cả đều thất bại, lỗi sẽ bao
gồm chi tiết từ từng lần thử.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Ghi đè `model` cho từng lệnh gọi chỉ thử đúng nhà cung cấp/mô hình đó và
    không tiếp tục sang primary/fallback đã cấu hình hoặc các nhà cung cấp được tự động phát hiện.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Một mặc định nhà cung cấp chỉ được đưa vào danh sách ứng viên khi OpenClaw
    thực sự có thể xác thực nhà cung cấp đó. Đặt
    `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ dùng
    các mục `model`, `primary` và `fallbacks` rõ ràng.
  </Accordion>
  <Accordion title="Timeouts">
    Đặt `agents.defaults.imageGenerationModel.timeoutMs` cho các backend hình ảnh
    chậm. Tham số công cụ `timeoutMs` cho từng lệnh gọi sẽ ghi đè mặc định đã cấu hình.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Dùng `action: "list"` để kiểm tra các nhà cung cấp hiện đã đăng ký,
    mô hình mặc định của chúng và gợi ý biến môi trường xác thực.
  </Accordion>
</AccordionGroup>

### Chỉnh sửa hình ảnh

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI và xAI hỗ trợ chỉnh sửa
hình ảnh tham chiếu. Truyền đường dẫn hoặc URL hình ảnh tham chiếu:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google và xAI hỗ trợ tối đa 5 hình ảnh tham chiếu qua
tham số `images`. fal, MiniMax và ComfyUI hỗ trợ 1.

## Tìm hiểu sâu về nhà cung cấp

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    Tạo ảnh bằng OpenAI mặc định dùng `openai/gpt-image-2`. Nếu một hồ sơ OAuth
    `openai-codex` đã được cấu hình, OpenClaw sẽ dùng lại cùng hồ sơ
    OAuth mà các mô hình chat đăng ký Codex sử dụng và gửi yêu cầu
    ảnh qua phần phụ trợ Codex Responses. Các URL cơ sở Codex cũ
    như `https://chatgpt.com/backend-api` được chuẩn hóa thành
    `https://chatgpt.com/backend-api/codex` cho các yêu cầu ảnh. OpenClaw
    **không** âm thầm chuyển dự phòng sang `OPENAI_API_KEY` cho yêu cầu đó —
    để buộc định tuyến trực tiếp qua OpenAI Images API, hãy cấu hình
    `models.providers.openai` rõ ràng bằng khóa API, URL cơ sở tùy chỉnh,
    hoặc điểm cuối Azure.

    Các mô hình `openai/gpt-image-1.5`, `openai/gpt-image-1`, và
    `openai/gpt-image-1-mini` vẫn có thể được chọn rõ ràng. Dùng
    `gpt-image-1.5` cho đầu ra PNG/WebP nền trong suốt; API
    `gpt-image-2` hiện tại từ chối `background: "transparent"`.

    `gpt-image-2` hỗ trợ cả tạo ảnh từ văn bản và
    chỉnh sửa ảnh tham chiếu qua cùng công cụ `image_generate`.
    OpenClaw chuyển tiếp `prompt`, `count`, `size`, `quality`, `outputFormat`,
    và ảnh tham chiếu đến OpenAI. OpenAI **không** nhận trực tiếp
    `aspectRatio` hoặc `resolution`; khi có thể, OpenClaw ánh xạ
    chúng thành một `size` được hỗ trợ, nếu không công cụ sẽ báo chúng là
    các ghi đè bị bỏ qua.

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

    `openai.background` chấp nhận `transparent`, `opaque`, hoặc `auto`;
    đầu ra trong suốt yêu cầu `outputFormat` là `png` hoặc `webp` và một
    mô hình ảnh OpenAI có khả năng trong suốt. OpenClaw định tuyến các
    yêu cầu nền trong suốt mặc định của `gpt-image-2` đến `gpt-image-1.5`.
    `openai.outputCompression` áp dụng cho đầu ra JPEG/WebP.

    Gợi ý `background` cấp cao nhất là trung lập với nhà cung cấp và hiện ánh xạ
    đến cùng trường yêu cầu `background` của OpenAI khi nhà cung cấp OpenAI
    được chọn. Các nhà cung cấp không khai báo hỗ trợ nền sẽ trả về
    nó trong `ignoredOverrides` thay vì nhận tham số không được hỗ trợ.

    Để định tuyến việc tạo ảnh OpenAI qua một triển khai Azure OpenAI
    thay vì `api.openai.com`, xem
    [điểm cuối Azure OpenAI](/vi/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="OpenRouter image models">
    Tạo ảnh bằng OpenRouter dùng cùng `OPENROUTER_API_KEY` và
    định tuyến qua API ảnh chat completions của OpenRouter. Chọn
    các mô hình ảnh OpenRouter với tiền tố `openrouter/`:

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

    OpenClaw chuyển tiếp `prompt`, `count`, ảnh tham chiếu, và
    các gợi ý `aspectRatio` / `resolution` tương thích với Gemini đến OpenRouter.
    Các lối tắt mô hình ảnh OpenRouter tích hợp hiện tại bao gồm
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview`, và `openai/gpt-5.4-image-2`. Dùng
    `action: "list"` để xem Plugin đã cấu hình của bạn cung cấp những gì.

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    Tạo ảnh MiniMax có sẵn qua cả hai đường dẫn xác thực MiniMax
    được đóng gói:

    - `minimax/image-01` cho thiết lập khóa API
    - `minimax-portal/image-01` cho thiết lập OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Nhà cung cấp xAI được đóng gói dùng `/v1/images/generations` cho các yêu cầu
    chỉ có prompt và `/v1/images/edits` khi có `image` hoặc `images`.

    - Mô hình: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Số lượng: tối đa 4
    - Tham chiếu: một `image` hoặc tối đa năm `images`
    - Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Độ phân giải: `1K`, `2K`
    - Đầu ra: được trả về dưới dạng tệp đính kèm ảnh do OpenClaw quản lý

    OpenClaw cố ý không phơi bày `quality`, `mask`,
    `user` gốc của xAI, hoặc các tỷ lệ khung hình bổ sung chỉ có trong xAI cho đến khi
    các điều khiển đó tồn tại trong hợp đồng `image_generate` dùng chung giữa các nhà cung cấp.

  </Accordion>
</AccordionGroup>

## Ví dụ

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
</Tabs>

Cùng các cờ `--output-format` và `--background` có sẵn trên
`openclaw infer image edit`; `--openai-background` vẫn là một bí danh
dành riêng cho OpenAI. Các nhà cung cấp được đóng gói khác ngoài OpenAI hiện không khai báo
điều khiển nền rõ ràng, nên `background: "transparent"` được báo cáo
là bị bỏ qua đối với chúng.

## Liên quan

- [Tổng quan công cụ](/vi/tools) — tất cả công cụ agent có sẵn
- [ComfyUI](/vi/providers/comfy) — thiết lập quy trình làm việc ComfyUI cục bộ và Comfy Cloud
- [fal](/vi/providers/fal) — thiết lập nhà cung cấp ảnh và video fal
- [Google (Gemini)](/vi/providers/google) — thiết lập nhà cung cấp ảnh Gemini
- [MiniMax](/vi/providers/minimax) — thiết lập nhà cung cấp ảnh MiniMax
- [OpenAI](/vi/providers/openai) — thiết lập nhà cung cấp OpenAI Images
- [Vydra](/vi/providers/vydra) — thiết lập ảnh, video và giọng nói Vydra
- [xAI](/vi/providers/xai) — thiết lập ảnh Grok, video, tìm kiếm, thực thi mã và TTS
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — cấu hình `imageGenerationModel`
- [Mô hình](/vi/concepts/models) — cấu hình mô hình và chuyển đổi dự phòng
