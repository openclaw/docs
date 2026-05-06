---
read_when:
    - Bạn muốn bật hoặc cấu hình code_execution
    - Bạn muốn phân tích từ xa mà không cần quyền truy cập shell cục bộ
    - Bạn muốn kết hợp x_search hoặc web_search với phân tích Python từ xa
summary: 'code_execution: chạy phân tích Python từ xa trong sandbox bằng xAI'
title: Thực thi mã
x-i18n:
    generated_at: "2026-05-06T09:32:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` chạy phân tích Python từ xa trong sandbox trên Responses API của xAI. Công cụ này được đăng ký bởi Plugin `xai` được đóng gói kèm (theo hợp đồng `tools`) và gửi đến cùng endpoint `https://api.x.ai/v1/responses` mà `x_search` sử dụng.

| Thuộc tính         | Giá trị                                                        |
| ------------------ | -------------------------------------------------------------- |
| Tên công cụ        | `code_execution`                                               |
| Plugin nhà cung cấp | `xai` (được đóng gói kèm, `enabledByDefault: true`)           |
| Xác thực           | `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey` |
| Mô hình mặc định   | `grok-4-1-fast`                                                |
| Thời gian chờ mặc định | 30 giây                                                    |
| `maxTurns` mặc định | chưa đặt (xAI áp dụng giới hạn nội bộ riêng của mình)         |

Công cụ này khác với [`exec`](/vi/tools/exec) cục bộ:

- `exec` chạy lệnh shell trên máy của bạn hoặc node đã ghép nối.
- `code_execution` chạy Python trong sandbox từ xa của xAI.

Dùng `code_execution` cho:

- Tính toán.
- Lập bảng.
- Thống kê nhanh.
- Phân tích kiểu biểu đồ.
- Phân tích dữ liệu do `x_search` hoặc `web_search` trả về.

**Không** dùng công cụ này khi bạn cần tệp cục bộ, shell, repo hoặc thiết bị đã ghép nối. Hãy dùng [`exec`](/vi/tools/exec) cho việc đó.

## Thiết lập

<Steps>
  <Step title="Cung cấp khóa API xAI">
    Đặt `XAI_API_KEY` trong môi trường Gateway, hoặc cấu hình khóa trong Plugin xAI để cùng một thông tin xác thực áp dụng cho `code_execution`, `x_search`, tìm kiếm web và các công cụ xAI khác:

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

    `code_execution` xuất hiện trong danh sách công cụ của tác nhân sau khi Plugin xAI đăng ký lại với `enabled: true`.

  </Step>
</Steps>

## Cách sử dụng

Hãy hỏi tự nhiên và nêu rõ mục đích phân tích:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Công cụ này nhận nội bộ một tham số `task`, vì vậy tác nhân nên gửi đầy đủ yêu cầu phân tích và mọi dữ liệu nội tuyến trong một lời nhắc.

## Lỗi

Khi công cụ chạy mà không có xác thực, nó trả về lỗi có cấu trúc `missing_xai_api_key` trỏ đến biến môi trường và đường dẫn cấu hình. Lỗi là JSON, không phải ngoại lệ được ném ra, nên tác nhân có thể tự sửa:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Giới hạn

- Đây là thực thi từ xa của xAI, không phải thực thi tiến trình cục bộ.
- Xem kết quả là phân tích tạm thời, không phải một phiên notebook liên tục.
- Đừng giả định có quyền truy cập vào tệp cục bộ hoặc workspace của bạn.
- Để có dữ liệu X mới, trước tiên hãy dùng [`x_search`](/vi/tools/web#x_search) rồi chuyển kết quả vào `code_execution`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ Exec" href="/vi/tools/exec" icon="terminal">
    Thực thi shell cục bộ trên máy của bạn hoặc node đã ghép nối.
  </Card>
  <Card title="Phê duyệt Exec" href="/vi/tools/exec-approvals" icon="shield">
    Chính sách cho phép/từ chối đối với thực thi shell.
  </Card>
  <Card title="Công cụ web" href="/vi/tools/web" icon="globe">
    `web_search`, `x_search` và `web_fetch`.
  </Card>
  <Card title="Nhà cung cấp xAI" href="/vi/providers/xai" icon="microchip">
    Mô hình Grok, tìm kiếm web/X và cấu hình thực thi mã.
  </Card>
</CardGroup>
