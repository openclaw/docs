---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin microsoft-foundry
summary: Thêm hỗ trợ nhà cung cấp mô hình Microsoft Foundry cho OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T08:10:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Bổ sung hỗ trợ nhà cung cấp mô hình Microsoft Foundry cho OpenClaw.

## Phân phối

- Gói: `@openclaw/microsoft-foundry`
- Phương thức cài đặt: được tích hợp trong OpenClaw

## Bề mặt

nhà cung cấp: microsoft-foundry; hợp đồng: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Nhà cung cấp tạo hình ảnh: `microsoft-foundry`

## Yêu cầu

- Một tài nguyên Microsoft Foundry hoặc Azure AI Foundry có các bản triển khai.
- Xác thực bằng khóa API thông qua `AZURE_OPENAI_API_KEY` hoặc khóa API đã cấu hình cho nhà cung cấp.
- Để xác thực bằng Entra ID, hãy cài đặt Azure CLI và chạy `az login` trước khi
  thiết lập ban đầu. OpenClaw làm mới token thời gian chạy Microsoft Foundry thông qua
  `az account get-access-token`.

## Mô hình trò chuyện

Các bản triển khai trò chuyện Microsoft Foundry sử dụng tham chiếu mô hình của nhà cung cấp
`microsoft-foundry/<deployment-name>`. Quá trình thiết lập ban đầu phát hiện các tài nguyên
và bản triển khai Foundry bằng Azure CLI, sau đó ghi tên bản triển khai đã chọn vào
cấu hình mô hình.

OpenClaw sử dụng điểm cuối Foundry `/openai/v1` cho các API trò chuyện tương thích
với OpenAI được hỗ trợ:

- Các họ mô hình GPT, `o*`, `computer-use-preview` và DeepSeek-V4 mặc định sử dụng
  `openai-responses`.
- MAI-DS-R1 và các bản triển khai hoàn tất trò chuyện khác sử dụng `openai-completions`
  trừ khi một API được hỗ trợ được cấu hình rõ ràng.
- MAI-DS-R1 được ghi nhận là có khả năng suy luận thông qua nội dung suy luận, không phải
  thông qua `reasoning_effort`. Siêu dữ liệu về token ngữ cảnh và đầu ra của mô hình này là
  163.840 token.

Các bản triển khai Anthropic Claude trong Microsoft Foundry sử dụng định dạng API Anthropic Messages,
không phải định dạng tương thích với OpenAI `/openai/v1`. Hãy cấu hình chúng dưới dạng
nhà cung cấp `anthropic-messages` tùy chỉnh cho đến khi Plugin Microsoft Foundry có
thời gian chạy Anthropic nguyên bản. Khi tên bản triển khai Foundry khác với
ID mô hình Claude, hãy đặt `params.canonicalModelId` trong mục nhập mô hình để OpenClaw
có thể áp dụng các hợp đồng truyền dẫn dành riêng cho mô hình, ánh xạ chính xác `/think off` và
bảo toàn nội dung suy nghĩ đã ký một cách an toàn.

## Tạo hình ảnh bằng MAI

Plugin đăng ký `microsoft-foundry` cho `image_generate` với các
mô hình hình ảnh Microsoft AI hiện tại:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Sử dụng tên bản triển khai hình ảnh MAI đã triển khai làm tham chiếu mô hình. Nhà cung cấp
không khai báo mô hình hình ảnh mặc định vì API MAI yêu cầu tên bản triển khai của bạn
trong trường `model` của yêu cầu:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Quá trình tạo chỉ bằng câu lệnh gọi điểm cuối tạo hình ảnh MAI của Microsoft Foundry:
`/mai/v1/images/generations`. Các thao tác chỉnh sửa bằng hình ảnh tham chiếu gọi
`/mai/v1/images/edits` và chỉ hỗ trợ các bản triển khai `MAI-Image-2.5-Flash` và
`MAI-Image-2.5`.

Quá trình tạo chỉ bằng câu lệnh có thể sử dụng tên bản triển khai tùy chỉnh khi chỉ cần cấu hình
điểm cuối Foundry. Đối với chỉnh sửa hình ảnh bằng tên bản triển khai tùy chỉnh, hãy chọn
bản triển khai trong quá trình thiết lập ban đầu hoặc thêm siêu dữ liệu mô hình để OpenClaw có thể xác minh
rằng bản triển khai được hỗ trợ bởi `MAI-Image-2.5-Flash` hoặc `MAI-Image-2.5`.

Các ràng buộc về hình ảnh MAI:

- Đầu ra: một hình ảnh PNG cho mỗi yêu cầu.
- Kích thước: mặc định là `1024x1024`; cả chiều rộng và chiều cao phải ít nhất là 768 px.
- Tổng số pixel: chiều rộng × chiều cao không được vượt quá 1.048.576.
- Chỉnh sửa: một hình ảnh đầu vào PNG hoặc JPEG.
- Các gợi ý dùng chung không được hỗ trợ như `aspectRatio`, `resolution`, `quality`,
  `background` và `outputFormat` không phải PNG sẽ không được gửi tới Microsoft Foundry.

## Khắc phục sự cố

- `az: command not found`: cài đặt Azure CLI hoặc sử dụng xác thực bằng khóa API.
- `Microsoft Foundry endpoint missing for MAI image generation`: chọn một
  bản triển khai Foundry trong quá trình thiết lập ban đầu hoặc thêm `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: mô hình hình ảnh đã chọn trỏ đến một
  bản triển khai không phải MAI. Hãy sử dụng mô hình hình ảnh MAI đã triển khai cho `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
