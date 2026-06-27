---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin microsoft-foundry
summary: Thêm hỗ trợ nhà cung cấp mô hình Microsoft Foundry cho OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T17:53:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Thêm hỗ trợ nhà cung cấp mô hình Microsoft Foundry cho OpenClaw.

## Phân phối

- Gói: `@openclaw/microsoft-foundry`
- Tuyến cài đặt: được bao gồm trong OpenClaw

## Bề mặt

providers: microsoft-foundry; contracts: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Nhà cung cấp tạo hình ảnh: `microsoft-foundry`

## Yêu cầu

- Một tài nguyên Microsoft Foundry hoặc Azure AI Foundry có các deployment.
- Xác thực bằng khóa API thông qua `AZURE_OPENAI_API_KEY` hoặc khóa API nhà cung cấp đã cấu hình.
- Với xác thực Entra ID, hãy cài đặt Azure CLI và chạy `az login` trước khi
  onboarding. OpenClaw làm mới các mã thông báo runtime Microsoft Foundry thông qua
  `az account get-access-token`.

## Mô hình chat

Các deployment chat của Microsoft Foundry dùng ref mô hình nhà cung cấp
`microsoft-foundry/<deployment-name>`. Onboarding phát hiện tài nguyên Foundry
và deployment bằng Azure CLI, sau đó ghi tên deployment đã chọn vào
cấu hình mô hình.

OpenClaw dùng endpoint `/openai/v1` của Foundry cho các API chat tương thích OpenAI
được hỗ trợ:

- Các họ mô hình GPT, `o*`, `computer-use-preview` và DeepSeek-V4 mặc định dùng
  `openai-responses`.
- MAI-DS-R1 và các deployment chat-completion khác dùng `openai-completions`
  trừ khi một API được hỗ trợ rõ ràng được cấu hình.
- MAI-DS-R1 được ghi nhận là có khả năng suy luận thông qua nội dung suy luận, không
  thông qua `reasoning_effort`. Siêu dữ liệu token ngữ cảnh và đầu ra của nó là
  163.840 token.

Các deployment Anthropic Claude trong Microsoft Foundry dùng dạng API Anthropic Messages,
không phải dạng tương thích OpenAI `/openai/v1`. Hãy cấu hình chúng dưới dạng
nhà cung cấp `anthropic-messages` tùy chỉnh cho đến khi Plugin Microsoft Foundry có
runtime Anthropic gốc. Khi tên deployment Foundry khác với ID mô hình
Claude, hãy đặt `params.canonicalModelId` trên mục mô hình để OpenClaw
có thể áp dụng các hợp đồng dây dẫn đặc thù theo mô hình, ánh xạ `/think off` chính xác và
bảo toàn signed thinking một cách an toàn.

## Tạo hình ảnh MAI

Plugin đăng ký `microsoft-foundry` cho `image_generate` với các mô hình hình ảnh
Microsoft AI hiện tại:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Dùng tên deployment hình ảnh MAI đã triển khai làm ref mô hình. Nhà cung cấp
không khai báo mô hình hình ảnh mặc định vì API MAI yêu cầu tên deployment của bạn
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

Các lệnh gọi tạo chỉ bằng prompt dùng endpoint generations MAI của Microsoft Foundry:
`/mai/v1/images/generations`. Các chỉnh sửa bằng hình ảnh tham chiếu gọi
`/mai/v1/images/edits` và chỉ giới hạn ở các deployment `MAI-Image-2.5-Flash` và
`MAI-Image-2.5`.

Tạo chỉ bằng prompt có thể dùng tên deployment tùy chỉnh chỉ với endpoint Foundry
được cấu hình. Với chỉnh sửa hình ảnh có tên deployment tùy chỉnh, hãy chọn
deployment thông qua onboarding hoặc đưa vào siêu dữ liệu mô hình để OpenClaw có thể xác minh
rằng deployment được hỗ trợ bởi `MAI-Image-2.5-Flash` hoặc `MAI-Image-2.5`.

Ràng buộc hình ảnh MAI:

- Đầu ra: một hình ảnh PNG cho mỗi yêu cầu.
- Kích thước: mặc định `1024x1024`; cả chiều rộng và chiều cao phải ít nhất 768 px.
- Tổng số pixel: chiều rộng × chiều cao tối đa là 1.048.576.
- Chỉnh sửa: một hình ảnh đầu vào PNG hoặc JPEG.
- Các gợi ý dùng chung không được hỗ trợ như `aspectRatio`, `resolution`, `quality`,
  `background` và `outputFormat` không phải PNG sẽ không được gửi đến Microsoft Foundry.

## Khắc phục sự cố

- `az: command not found`: cài đặt Azure CLI hoặc dùng xác thực bằng khóa API.
- `Microsoft Foundry endpoint missing for MAI image generation`: chọn một
  deployment Foundry thông qua onboarding hoặc thêm `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: mô hình hình ảnh đã chọn trỏ đến một
  deployment không phải MAI. Dùng một mô hình hình ảnh MAI đã triển khai cho `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
