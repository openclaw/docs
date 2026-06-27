---
read_when:
    - Bạn muốn sử dụng Gemini cho web_search
    - Bạn cần `GEMINI_API_KEY` hoặc `models.providers.google.apiKey`
    - Bạn muốn nền tảng dựa trên Google Search
summary: Tìm kiếm web bằng Gemini với căn cứ Google Search
title: Tìm kiếm Gemini
x-i18n:
    generated_at: "2026-06-27T18:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw hỗ trợ các mô hình Gemini với
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding) tích hợp sẵn,
trả về các câu trả lời do AI tổng hợp, được hỗ trợ bởi kết quả Google Search trực tiếp kèm
trích dẫn.

## Lấy API key

<Steps>
  <Step title="Tạo khóa">
    Truy cập [Google AI Studio](https://aistudio.google.com/apikey) và tạo một
    API key.
  </Step>
  <Step title="Lưu khóa">
    Đặt `GEMINI_API_KEY` trong môi trường Gateway, dùng lại
    `models.providers.google.apiKey`, hoặc cấu hình một khóa tìm kiếm web chuyên dụng qua:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
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

**Thứ tự ưu tiên thông tin xác thực:** Tìm kiếm web Gemini dùng
`plugins.entries.google.config.webSearch.apiKey` trước, sau đó đến `GEMINI_API_KEY`,
rồi `models.providers.google.apiKey`. Với URL cơ sở, cấu hình chuyên dụng
`plugins.entries.google.config.webSearch.baseUrl` được ưu tiên trước
`models.providers.google.baseUrl`.

Với một bản cài đặt Gateway, đặt các khóa môi trường trong `~/.openclaw/.env`.

## Cách hoạt động

Khác với các nhà cung cấp tìm kiếm truyền thống trả về danh sách liên kết và đoạn trích,
Gemini dùng Google Search grounding để tạo câu trả lời do AI tổng hợp với
trích dẫn nội tuyến. Kết quả bao gồm cả câu trả lời đã tổng hợp và các URL nguồn.

- URL trích dẫn từ Gemini grounding được tự động phân giải từ URL chuyển hướng của Google
  thành URL trực tiếp.
- Việc phân giải chuyển hướng dùng đường dẫn bảo vệ SSRF (HEAD + kiểm tra chuyển hướng +
  xác thực http/https) trước khi trả về URL trích dẫn cuối cùng.
- Việc phân giải chuyển hướng dùng các mặc định SSRF nghiêm ngặt, vì vậy các chuyển hướng đến
  mục tiêu riêng tư/nội bộ sẽ bị chặn.

## Tham số được hỗ trợ

Tìm kiếm Gemini hỗ trợ `query`, `freshness`, `date_after` và `date_before`.

`count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng Gemini grounding
vẫn trả về một câu trả lời đã tổng hợp kèm trích dẫn thay vì danh sách N kết quả.

`freshness` chấp nhận `day`, `week`, `month`, `year` và các lối tắt dùng chung
`pd`, `pw`, `pm` và `py`. `day`/`pd` thêm hướng dẫn về độ mới vào truy vấn Gemini
thay vì một phạm vi cứng 24 giờ. `week`, `month`, `year` và các phạm vi tường minh
`date_after`/`date_before` đặt `timeRangeFilter` của Gemini Google Search grounding.
`country`, `language` và `domain_filter` không được hỗ trợ.

## Chọn mô hình

Mô hình mặc định là `gemini-2.5-flash` (nhanh và tiết kiệm chi phí). Có thể dùng bất kỳ
mô hình Gemini nào hỗ trợ grounding thông qua
`plugins.entries.google.config.webSearch.model`.

## Ghi đè URL cơ sở

Đặt `plugins.entries.google.config.webSearch.baseUrl` khi tìm kiếm web Gemini
phải định tuyến qua proxy của người vận hành hoặc điểm cuối tùy chỉnh tương thích với Gemini. Nếu
chưa đặt giá trị đó, tìm kiếm web Gemini sẽ dùng lại `models.providers.google.baseUrl`. Giá trị thuần
`https://generativelanguage.googleapis.com` được chuẩn hóa thành
`https://generativelanguage.googleapis.com/v1beta`; các đường dẫn proxy tùy chỉnh được giữ nguyên
như đã cung cấp sau khi cắt bỏ dấu gạch chéo ở cuối.

## Liên quan

- [Tổng quan về Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc kèm đoạn trích
- [Perplexity Search](/vi/tools/perplexity-search) -- kết quả có cấu trúc + trích xuất nội dung
