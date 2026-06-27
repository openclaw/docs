---
read_when:
    - Bạn muốn bật hoặc cấu hình code_execution
    - Bạn muốn phân tích từ xa mà không cần quyền truy cập shell cục bộ
    - Bạn muốn kết hợp x_search hoặc web_search với phân tích Python từ xa
summary: 'code_execution: chạy phân tích Python từ xa trong sandbox với xAI'
title: Thực thi mã
x-i18n:
    generated_at: "2026-06-27T18:14:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` chạy phân tích Python từ xa trong sandbox trên Responses API của xAI. Công cụ này được đăng ký bởi plugin `xai` đi kèm (theo hợp đồng `tools`) và chuyển tiếp đến cùng endpoint `https://api.x.ai/v1/responses` mà `x_search` sử dụng.

| Thuộc tính            | Giá trị                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Tên công cụ           | `code_execution`                                                                         |
| Plugin nhà cung cấp   | `xai` (đi kèm, `enabledByDefault: true`)                                                 |
| Xác thực              | hồ sơ xác thực xAI, `XAI_API_KEY`, hoặc `plugins.entries.xai.config.webSearch.apiKey`    |
| Mô hình mặc định      | `grok-4-1-fast`                                                                          |
| Thời gian chờ mặc định | 30 giây                                                                                 |
| `maxTurns` mặc định   | chưa đặt (xAI áp dụng giới hạn nội bộ riêng)                                             |

Công cụ này khác với [`exec`](/vi/tools/exec) cục bộ:

- `exec` chạy lệnh shell trên máy của bạn hoặc nút được ghép nối.
- `code_execution` chạy Python trong sandbox từ xa của xAI.

Dùng `code_execution` cho:

- Tính toán.
- Lập bảng.
- Thống kê nhanh.
- Phân tích kiểu biểu đồ.
- Phân tích dữ liệu do `x_search` hoặc `web_search` trả về.

**Không** dùng công cụ này khi bạn cần tệp cục bộ, shell của bạn, repo của bạn hoặc thiết bị được ghép nối. Hãy dùng [`exec`](/vi/tools/exec) cho việc đó.

## Thiết lập

<Steps>
  <Step title="Cung cấp thông tin xác thực xAI">
    Đăng nhập bằng Grok OAuth với gói đăng ký SuperGrok hoặc X Premium đủ điều kiện,
    hoặc lưu trữ khóa API. xAI OAuth dùng xác minh bằng mã thiết bị, nên hoạt động
    từ máy chủ từ xa mà không cần callback localhost. OAuth hoạt động cho
    `code_execution` và `x_search`; `XAI_API_KEY` hoặc cấu hình web-search của plugin
    cũng có thể cấp quyền cho Grok `web_search`.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Trong lần cài đặt mới, các lựa chọn xác thực tương tự có sẵn trong
    quy trình onboarding:

    ```bash
    openclaw onboard --install-daemon
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

  </Step>

  <Step title="Bật và tinh chỉnh code_execution">
    `code_execution` khả dụng khi thông tin xác thực xAI khả dụng. Đặt
    `plugins.entries.xai.config.codeExecution.enabled` thành `false` để tắt,
    hoặc dùng cùng khối này để tinh chỉnh mô hình và thời gian chờ.

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

    `code_execution` xuất hiện trong danh sách công cụ của agent sau khi plugin xAI đăng ký lại với `enabled: true`.

  </Step>
</Steps>

## Cách sử dụng

Hãy hỏi một cách tự nhiên và nêu rõ ý định phân tích:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Công cụ này nội bộ nhận một tham số `task`, nên agent nên gửi toàn bộ yêu cầu phân tích và mọi dữ liệu nội tuyến trong một prompt.

## Lỗi

Khi công cụ chạy mà không có xác thực, nó trả về lỗi có cấu trúc `missing_xai_api_key` trỏ đến các tùy chọn hồ sơ xác thực, biến môi trường và cấu hình. Lỗi ở dạng JSON, không phải ngoại lệ được ném ra, nên agent có thể tự sửa:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Giới hạn

- Đây là thực thi từ xa của xAI, không phải thực thi tiến trình cục bộ.
- Xem kết quả là phân tích tạm thời, không phải phiên notebook liên tục.
- Đừng giả định có quyền truy cập vào tệp cục bộ hoặc workspace của bạn.
- Với dữ liệu X mới, trước tiên hãy dùng [`x_search`](/vi/tools/web#x_search), rồi chuyển kết quả vào `code_execution`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ Exec" href="/vi/tools/exec" icon="terminal">
    Thực thi shell cục bộ trên máy của bạn hoặc nút được ghép nối.
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
