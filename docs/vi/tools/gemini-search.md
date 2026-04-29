---
read_when:
    - Bạn muốn sử dụng Gemini cho web_search
    - Bạn cần GEMINI_API_KEY
    - Bạn muốn grounding bằng Google Search
summary: Tìm kiếm trên mạng bằng Gemini với Google Search làm nền tảng
title: Tìm kiếm bằng Gemini
x-i18n:
    generated_at: "2026-04-29T23:19:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw hỗ trợ các mô hình Gemini với tính năng
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
tích hợp sẵn, trả về các câu trả lời do AI tổng hợp, được hỗ trợ bởi kết quả
Google Search trực tiếp kèm trích dẫn.

## Lấy khóa API

<Steps>
  <Step title="Tạo khóa">
    Truy cập [Google AI Studio](https://aistudio.google.com/apikey) và tạo một
    khóa API.
  </Step>
  <Step title="Lưu khóa">
    Đặt `GEMINI_API_KEY` trong môi trường Gateway, hoặc cấu hình qua:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Cấu hình

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Phương án thay thế bằng biến môi trường:** đặt `GEMINI_API_KEY` trong môi trường Gateway.
Đối với bản cài đặt gateway, hãy đặt khóa trong `~/.openclaw/.env`.

## Cách hoạt động

Không giống các nhà cung cấp tìm kiếm truyền thống trả về danh sách liên kết và đoạn trích,
Gemini sử dụng Google Search grounding để tạo các câu trả lời do AI tổng hợp với
trích dẫn nội tuyến. Kết quả bao gồm cả câu trả lời đã tổng hợp và các URL nguồn.

- URL trích dẫn từ Gemini grounding được tự động phân giải từ URL chuyển hướng của Google
  thành URL trực tiếp.
- Việc phân giải chuyển hướng sử dụng đường dẫn bảo vệ SSRF (HEAD + kiểm tra chuyển hướng +
  xác thực http/https) trước khi trả về URL trích dẫn cuối cùng.
- Việc phân giải chuyển hướng sử dụng các mặc định SSRF nghiêm ngặt, nên các chuyển hướng đến
  đích riêng tư/nội bộ sẽ bị chặn.

## Tham số được hỗ trợ

Tìm kiếm Gemini hỗ trợ `query`.

`count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng Gemini grounding
vẫn trả về một câu trả lời tổng hợp kèm trích dẫn thay vì danh sách N kết quả.

Các bộ lọc dành riêng cho nhà cung cấp như `country`, `language`, `freshness` và
`domain_filter` không được hỗ trợ.

## Lựa chọn mô hình

Mô hình mặc định là `gemini-2.5-flash` (nhanh và tiết kiệm chi phí). Có thể dùng bất kỳ
mô hình Gemini nào hỗ trợ grounding thông qua
`plugins.entries.google.config.webSearch.model`.

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc kèm đoạn trích
- [Perplexity Search](/vi/tools/perplexity-search) -- kết quả có cấu trúc + trích xuất nội dung
