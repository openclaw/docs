---
read_when:
    - Bạn muốn bật hoặc cấu hình code_execution
    - Bạn muốn phân tích từ xa mà không cần truy cập shell cục bộ
    - Bạn muốn kết hợp x_search hoặc web_search với phân tích Python từ xa
summary: code_execution -- chạy phân tích Python từ xa trong môi trường cô lập bằng xAI
title: Thực thi mã
x-i18n:
    generated_at: "2026-04-29T23:17:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` chạy phân tích Python từ xa trong sandbox trên Responses API của xAI.
Điều này khác với [`exec`](/vi/tools/exec) cục bộ:

- `exec` chạy các lệnh shell trên máy hoặc node của bạn
- `code_execution` chạy Python trong sandbox từ xa của xAI

Dùng `code_execution` cho:

- tính toán
- lập bảng
- thống kê nhanh
- phân tích dạng biểu đồ
- phân tích dữ liệu được `x_search` hoặc `web_search` trả về

**Không** dùng công cụ này khi bạn cần tệp cục bộ, shell của bạn, repo của bạn, hoặc các thiết bị đã ghép đôi. Hãy dùng [`exec`](/vi/tools/exec) cho việc đó.

## Thiết lập

Bạn cần khóa API xAI. Bất kỳ mục nào sau đây đều dùng được:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Ví dụ:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

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

Công cụ này nhận một tham số `task` duy nhất ở bên trong, vì vậy agent nên gửi toàn bộ yêu cầu phân tích và mọi dữ liệu nội tuyến trong một prompt.

## Giới hạn

- Đây là thực thi từ xa của xAI, không phải thực thi tiến trình cục bộ.
- Công cụ này nên được xem là phân tích tạm thời, không phải notebook lưu trữ lâu dài.
- Đừng giả định có quyền truy cập vào tệp cục bộ hoặc workspace của bạn.
- Với dữ liệu X mới, hãy dùng [`x_search`](/vi/tools/web#x_search) trước.

## Liên quan

- [Công cụ Exec](/vi/tools/exec)
- [Phê duyệt Exec](/vi/tools/exec-approvals)
- [Công cụ apply_patch](/vi/tools/apply-patch)
- [Công cụ Web](/vi/tools/web)
- [xAI](/vi/providers/xai)
