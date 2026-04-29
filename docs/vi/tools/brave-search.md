---
read_when:
    - Bạn muốn sử dụng Brave Search cho web_search
    - Bạn cần BRAVE_API_KEY hoặc thông tin chi tiết về gói
summary: Thiết lập Brave Search API cho web_search
title: Tìm kiếm Brave
x-i18n:
    generated_at: "2026-04-29T23:16:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw hỗ trợ Brave Search API dưới dạng nhà cung cấp `web_search`.

## Lấy API key

1. Tạo tài khoản Brave Search API tại [https://brave.com/search/api/](https://brave.com/search/api/)
2. Trong bảng điều khiển, chọn gói **Search** và tạo một API key.
3. Lưu khóa trong cấu hình hoặc đặt `BRAVE_API_KEY` trong môi trường Gateway.

## Ví dụ cấu hình

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Các thiết lập tìm kiếm Brave dành riêng cho nhà cung cấp hiện nằm trong `plugins.entries.brave.config.webSearch.*`.
`tools.web.search.apiKey` cũ vẫn được tải qua lớp tương thích, nhưng không còn là đường dẫn cấu hình chuẩn nữa.

`webSearch.mode` kiểm soát phương thức truyền Brave:

- `web` (mặc định): tìm kiếm web Brave thông thường với tiêu đề, URL và đoạn trích
- `llm-context`: Brave LLM Context API với các đoạn văn bản và nguồn đã được trích xuất trước để làm căn cứ

## Tham số công cụ

<ParamField path="query" type="string" required>
Truy vấn tìm kiếm.
</ParamField>

<ParamField path="count" type="number" default="5">
Số lượng kết quả cần trả về (1–10).
</ParamField>

<ParamField path="country" type="string">
Mã quốc gia ISO gồm 2 chữ cái (ví dụ: `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Mã ngôn ngữ ISO 639-1 cho kết quả tìm kiếm (ví dụ: `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Mã ngôn ngữ tìm kiếm Brave (ví dụ: `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Mã ngôn ngữ ISO cho các thành phần UI.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Bộ lọc thời gian — `day` là 24 giờ.
</ParamField>

<ParamField path="date_after" type="string">
Chỉ các kết quả được xuất bản sau ngày này (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Chỉ các kết quả được xuất bản trước ngày này (`YYYY-MM-DD`).
</ParamField>

**Ví dụ:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Ghi chú

- OpenClaw sử dụng gói Brave **Search**. Nếu bạn có gói đăng ký cũ (ví dụ: gói Free ban đầu với 2.000 truy vấn/tháng), gói đó vẫn hợp lệ nhưng không bao gồm các tính năng mới hơn như LLM Context hoặc giới hạn tốc độ cao hơn.
- Mỗi gói Brave bao gồm **\$5/tháng tín dụng miễn phí** (gia hạn định kỳ). Gói Search có giá \$5 cho mỗi 1.000 yêu cầu, vì vậy khoản tín dụng bao gồm 1.000 truy vấn/tháng. Đặt giới hạn sử dụng trong bảng điều khiển Brave để tránh chi phí ngoài dự kiến. Xem [cổng Brave API](https://brave.com/search/api/) để biết các gói hiện tại.
- Gói Search bao gồm điểm cuối LLM Context và quyền suy luận AI. Việc lưu trữ kết quả để huấn luyện hoặc tinh chỉnh mô hình yêu cầu gói có quyền lưu trữ rõ ràng. Xem [Điều khoản Dịch vụ](https://api-dashboard.search.brave.com/terms-of-service) của Brave.
- Chế độ `llm-context` trả về các mục nguồn có căn cứ thay vì dạng đoạn trích tìm kiếm web thông thường.
- Chế độ `llm-context` không hỗ trợ `ui_lang`, `freshness`, `date_after` hoặc `date_before`.
- `ui_lang` phải bao gồm một thẻ phụ vùng như `en-US`.
- Kết quả được lưu vào bộ nhớ đệm trong 15 phút theo mặc định (có thể cấu hình qua `cacheTtlMinutes`).

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Perplexity Search](/vi/tools/perplexity-search) -- kết quả có cấu trúc với lọc miền
- [Exa Search](/vi/tools/exa-search) -- tìm kiếm neural với trích xuất nội dung
