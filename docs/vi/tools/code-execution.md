---
read_when:
    - Bạn muốn bật hoặc cấu hình code_execution
    - Bạn muốn phân tích từ xa mà không cần quyền truy cập shell cục bộ
    - Bạn muốn kết hợp x_search hoặc web_search với phân tích Python từ xa
summary: 'code_execution: chạy phân tích Python từ xa trong sandbox với xAI'
title: Thực thi mã
x-i18n:
    generated_at: "2026-05-10T19:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` chạy phân tích Python từ xa trong sandbox trên Responses API của xAI. Công cụ này được đăng ký bởi Plugin `xai` được đóng gói kèm (theo hợp đồng `tools`) và gửi yêu cầu đến cùng endpoint `https://api.x.ai/v1/responses` được `x_search` sử dụng.

| Thuộc tính         | Giá trị                                                                           |
| ------------------ | --------------------------------------------------------------------------------- |
| Tên công cụ        | `code_execution`                                                                  |
| Plugin nhà cung cấp | `xai` (được đóng gói kèm, `enabledByDefault: true`)                              |
| Xác thực           | hồ sơ xác thực xAI, `XAI_API_KEY`, hoặc `plugins.entries.xai.config.webSearch.apiKey` |
| Mô hình mặc định   | `grok-4-1-fast`                                                                   |
| Thời gian chờ mặc định | 30 giây                                                                      |
| `maxTurns` mặc định | chưa đặt (xAI áp dụng giới hạn nội bộ riêng)                                     |

Công cụ này khác với [`exec`](/vi/tools/exec) cục bộ:

- `exec` chạy lệnh shell trên máy của bạn hoặc Node đã ghép nối.
- `code_execution` chạy Python trong sandbox từ xa của xAI.

Dùng `code_execution` cho:

- Tính toán.
- Lập bảng.
- Thống kê nhanh.
- Phân tích kiểu biểu đồ.
- Phân tích dữ liệu do `x_search` hoặc `web_search` trả về.

**Không** dùng công cụ này khi bạn cần tệp cục bộ, shell của bạn, repo của bạn, hoặc thiết bị đã ghép nối. Hãy dùng [`exec`](/vi/tools/exec) cho việc đó.

## Thiết lập

<Steps>
  <Step title="Cung cấp khóa API xAI">
    Chạy `openclaw onboard --auth-choice xai-api-key` cho `code_execution` và
    `x_search`, hoặc đặt `XAI_API_KEY` / cấu hình khóa trong Plugin xAI
    khi bạn cũng muốn tìm kiếm web Grok dùng cùng thông tin xác thực:

    ```bash
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

  </Step>

  <Step title="Bật và tinh chỉnh code_execution">
    Công cụ này được kiểm soát bởi `plugins.entries.xai.config.codeExecution.enabled`. Mặc định là tắt.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
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

    `code_execution` xuất hiện trong danh sách công cụ của agent sau khi Plugin xAI đăng ký lại với `enabled: true`.

  </Step>
</Steps>

## Cách sử dụng

Hỏi một cách tự nhiên và nêu rõ ý định phân tích:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Công cụ nhận một tham số `task` duy nhất ở bên trong, nên agent nên gửi toàn bộ yêu cầu phân tích và mọi dữ liệu nội tuyến trong một prompt.

## Lỗi

Khi công cụ chạy mà không có xác thực, nó trả về lỗi `missing_xai_api_key` có cấu trúc, trỏ đến các tùy chọn hồ sơ xác thực, biến môi trường và cấu hình. Lỗi là JSON, không phải ngoại lệ được ném ra, nên agent có thể tự sửa:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Giới hạn

- Đây là thực thi từ xa của xAI, không phải thực thi tiến trình cục bộ.
- Xem kết quả là phân tích tạm thời, không phải một phiên notebook bền vững.
- Đừng giả định có quyền truy cập tệp cục bộ hoặc workspace của bạn.
- Đối với dữ liệu X mới, trước tiên hãy dùng [`x_search`](/vi/tools/web#x_search) rồi chuyển kết quả vào `code_execution`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ Exec" href="/vi/tools/exec" icon="terminal">
    Thực thi shell cục bộ trên máy của bạn hoặc Node đã ghép nối.
  </Card>
  <Card title="Phê duyệt Exec" href="/vi/tools/exec-approvals" icon="shield">
    Chính sách cho phép/từ chối đối với thực thi shell.
  </Card>
  <Card title="Công cụ web" href="/vi/tools/web" icon="globe">
    `web_search`, `x_search`, và `web_fetch`.
  </Card>
  <Card title="Nhà cung cấp xAI" href="/vi/providers/xai" icon="microchip">
    Mô hình Grok, tìm kiếm web/X và cấu hình thực thi mã.
  </Card>
</CardGroup>
