---
read_when:
    - Bạn muốn bật hoặc cấu hình `code_execution`
    - Bạn muốn phân tích từ xa mà không cần quyền truy cập shell cục bộ
    - Bạn muốn kết hợp x_search hoặc web_search với việc phân tích Python từ xa
summary: 'code_execution: chạy phân tích Python từ xa trong sandbox bằng xAI'
title: Thực thi mã
x-i18n:
    generated_at: "2026-07-12T08:29:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` chạy phân tích Python từ xa trong môi trường cách ly trên Responses API của xAI
(`https://api.x.ai/v1/responses`, cùng điểm cuối mà `x_search` sử dụng). Công cụ này được
Plugin `xai` đi kèm đăng ký theo hợp đồng `tools`.

<Warning>
  `code_execution` chạy trên máy chủ của xAI. xAI tính phí 5 USD cho mỗi 1.000 lượt gọi công cụ,
  cộng thêm token đầu vào và đầu ra của mô hình.
</Warning>

| Thuộc tính          | Giá trị                                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| Tên công cụ         | `code_execution`                                                                   |
| Plugin nhà cung cấp | `xai` (đi kèm, `enabledByDefault: true`)                                           |
| Xác thực            | Hồ sơ xác thực xAI, `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey` |
| Mô hình mặc định    | `grok-4.3`                                                                         |
| Thời gian chờ mặc định | 30 giây                                                                         |
| `maxTurns` mặc định | chưa đặt (xAI áp dụng giới hạn nội bộ riêng)                                       |

Dùng công cụ này cho các phép tính, lập bảng, thống kê nhanh và phân tích
dạng biểu đồ, bao gồm dữ liệu do `x_search` hoặc `web_search` trả về. Công cụ
không thể truy cập tệp cục bộ, shell, kho mã nguồn hoặc thiết bị đã ghép nối
của bạn và không duy trì trạng thái giữa các lượt gọi, vì vậy hãy coi mỗi lượt
gọi là một phiên phân tích tạm thời, không phải phiên sổ tay. Để lấy dữ liệu X
mới nhất, trước tiên hãy chạy [`x_search`](/vi/tools/web#x_search) rồi chuyển kết
quả vào.

Để thực thi cục bộ, hãy dùng [`exec`](/vi/tools/exec) thay thế.

## Thiết lập

<Steps>
  <Step title="Cung cấp thông tin xác thực xAI">
    OAuth yêu cầu gói đăng ký SuperGrok hoặc X Premium đủ điều kiện
    (xác minh bằng mã thiết bị, vì vậy có thể hoạt động từ máy chủ từ xa mà
    không cần callback localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Trong quá trình cài đặt mới, lựa chọn tương tự có sẵn ở bước hướng dẫn thiết lập:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Hoặc dùng khóa API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Hoặc qua cấu hình:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

    Bất kỳ phương thức nào trong ba phương thức này cũng cung cấp quyền hoạt động cho `x_search` và `web_search` của Grok.

  </Step>

  <Step title="Bật và tinh chỉnh code_execution">
    Khi bỏ qua `enabled`, `code_execution` chỉ được cung cấp khi nhà cung cấp
    của mô hình đang hoạt động là `xai` và thông tin xác thực xAI được phân
    giải thành công. Đối với mô hình đang hoạt động có nhà cung cấp không phải
    xAI đã biết, hãy đặt `plugins.entries.xai.config.codeExecution.enabled`
    thành `true` để chủ động bật việc sử dụng giữa các nhà cung cấp. Nếu nhà
    cung cấp của mô hình đang hoạt động bị thiếu hoặc không thể phân giải,
    công cụ vẫn bị ẩn. Đặt `enabled` thành `false` để tắt công cụ cho mọi
    nhà cung cấp. Thông tin xác thực xAI luôn là bắt buộc.

    Dùng cùng khối cấu hình để ghi đè mô hình, giới hạn lượt hoặc thời gian chờ:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // bắt buộc đối với nhà cung cấp mô hình không phải xAI đã biết
                model: "grok-4.3", // ghi đè mô hình thực thi mã xAI mặc định
                maxTurns: 2,            // giới hạn tùy chọn cho các lượt công cụ nội bộ
                timeoutSeconds: 30,     // thời gian chờ yêu cầu (mặc định: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Khởi động lại Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` xuất hiện trong danh sách công cụ của tác tử sau khi Plugin
    xAI đăng ký lại và các bước kiểm tra nhà cung cấp, trạng thái bật và xác
    thực ở trên đều đạt yêu cầu.

  </Step>
</Steps>

## Cách sử dụng

Hãy nêu rõ mục đích phân tích; công cụ nhận một tham số `task` duy nhất,
vì vậy hãy gửi toàn bộ yêu cầu và mọi dữ liệu nội tuyến trong một lời nhắc:

```text
Dùng code_execution để tính trung bình động 7 ngày cho các số sau: ...
```

```text
Dùng x_search để tìm các bài đăng đề cập đến OpenClaw trong tuần này, sau đó dùng code_execution để đếm chúng theo ngày.
```

```text
Dùng web_search để thu thập các số liệu chuẩn đánh giá AI mới nhất, sau đó dùng code_execution để so sánh mức thay đổi phần trăm.
```

## Lỗi

Khi không có thông tin xác thực, công cụ trả về lỗi JSON có cấu trúc (không
ném ngoại lệ), vì vậy tác tử có thể tự sửa lỗi:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution cần thông tin xác thực xAI. Chạy `openclaw onboard --auth-choice xai-oauth` để đăng nhập bằng Grok, chạy `openclaw onboard --auth-choice xai-api-key`, đặt `XAI_API_KEY` trong môi trường Gateway hoặc cấu hình `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ Exec" href="/vi/tools/exec" icon="terminal">
    Thực thi shell cục bộ trên máy của bạn hoặc Node đã ghép nối.
  </Card>
  <Card title="Phê duyệt Exec" href="/vi/tools/exec-approvals" icon="shield">
    Chính sách cho phép/từ chối thực thi shell.
  </Card>
  <Card title="Công cụ web" href="/vi/tools/web" icon="globe">
    `web_search`, `x_search` và `web_fetch`.
  </Card>
  <Card title="Nhà cung cấp xAI" href="/vi/providers/xai" icon="microchip">
    Các mô hình Grok, tìm kiếm web/X và cấu hình thực thi mã.
  </Card>
</CardGroup>
