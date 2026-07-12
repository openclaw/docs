---
read_when:
    - Bạn muốn tái sử dụng các cơ chế truyền tải mô hình của OpenClaw trong một ứng dụng khác
    - Bạn đang thay đổi `packages/ai` hoặc các cổng máy chủ vận chuyển AI
    - Bạn đang xem xét những gì bản phát hành OpenClaw xuất bản lên npm ngoài gói gốc.
summary: 'Gói npm @openclaw/ai: các phương thức truyền tải mô hình có thể tái sử dụng, môi trường chạy biệt lập và các cổng chính sách máy chủ'
title: Gói @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T08:21:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` là dạng thư viện có thể phát hành của lớp thực thi mô hình trong OpenClaw: các hợp đồng thông điệp/công cụ/luồng phát trực tuyến trung lập với nhà cung cấp, xác thực, chẩn đoán, luồng sự kiện, sổ đăng ký thời gian chạy biệt lập và các bộ điều hợp tải lười cho tám họ API tích hợp sẵn (Anthropic Messages, OpenAI Completions, OpenAI Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative AI, Google Vertex, Mistral Conversations).

Thư viện này được phát hành cùng gói `openclaw` gốc trong mỗi bản phát hành, được ghim ở cùng phiên bản và có `npm-shrinkwrap.json` riêng để khóa cây phụ thuộc bắc cầu tại thời điểm cài đặt. Việc cài đặt `openclaw` sẽ tự động cài đặt phiên bản `@openclaw/ai` tương ứng; người dùng thư viện có thể phụ thuộc trực tiếp vào gói này mà không cần bất kỳ mã ứng dụng OpenClaw nào.

## Bắt đầu nhanh

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

Một phiên bản có thể chạy nằm trong kho lưu trữ tại `examples/ai-chat`.

## Hợp đồng thiết kế

- **Theo phạm vi thực thể theo mặc định.** Việc nhập gói không đăng ký bất kỳ thứ gì trên toàn cục. `createApiRegistry()` / `createLlmRuntime()` trả về các thực thể biệt lập; `registerBuiltInApiProviders(registry)` chủ động bật các cơ chế truyền tải tích hợp sẵn cho một sổ đăng ký. Các mô-đun SDK của nhà cung cấp được tải lười trong lần sử dụng đầu tiên.
- **Chính sách của máy chủ được đưa vào, không được đóng gói kèm.** Cơ chế bảo vệ thao tác tìm nạp yêu cầu (ví dụ: chính sách SSRF), che giấu bí mật trong văn bản phát lại kết quả công cụ, các giá trị mặc định về công cụ nghiêm ngặt của OpenAI và ghi nhật ký chẩn đoán là các cổng `AiTransportHost` được cấu hình bằng `configureAiTransportHost`. Các giá trị mặc định của thư viện không thực hiện hành động nào; OpenClaw cài đặt các phần triển khai thực tế trong giao diện luồng phát trực tuyến của mình.
- **Một định danh luồng sự kiện.** `@openclaw/ai/event-stream` là hàm khởi tạo `EventStream` chuẩn tắc được chia sẻ bởi lõi OpenClaw, agent-core và người dùng bên ngoài.
- **Các đường dẫn con `internal/*` không phải là API.** Chúng tồn tại cho chính ứng dụng OpenClaw và không có bảo đảm về semver.
- ID nhà cung cấp, thông tin xác thực, danh mục mô hình, cơ chế thử lại và chuyển đổi dự phòng vẫn thuộc phạm vi xử lý của ứng dụng. OpenClaw bổ sung các lớp xử lý đó xung quanh gói này; người dùng thư viện cung cấp trực tiếp một đối tượng `Model` và các tùy chọn.

## Các mục xuất theo đường dẫn con

| Đường dẫn con    | Nội dung                                                                        |
| ---------------- | ------------------------------------------------------------------------------- |
| `.`              | Các hợp đồng, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                              |
| `./types`        | Các kiểu mô hình/thông điệp/công cụ/luồng phát trực tuyến                       |
| `./validation`   | Xác thực đối số công cụ                                                         |
| `./diagnostics`  | Các hợp đồng chẩn đoán                                                          |
| `./event-stream` | Phần triển khai `EventStream` dùng chung                                         |
| `./internal/*`   | Nội bộ OpenClaw, không có bảo đảm về semver                                     |
