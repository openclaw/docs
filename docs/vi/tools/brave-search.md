---
read_when:
    - Bạn muốn sử dụng Brave Search cho web_search
    - Bạn cần có BRAVE_API_KEY hoặc thông tin chi tiết về gói
summary: Thiết lập Brave Search API cho web_search
title: Tìm kiếm Brave
x-i18n:
    generated_at: "2026-05-06T09:31:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw hỗ trợ Brave Search API làm nhà cung cấp `web_search`.

## Lấy API key

1. Tạo tài khoản Brave Search API tại [https://brave.com/search/api/](https://brave.com/search/api/)
2. Trong bảng điều khiển, chọn gói **Search** và tạo API key.
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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

Các thiết lập tìm kiếm Brave dành riêng cho nhà cung cấp hiện nằm dưới `plugins.entries.brave.config.webSearch.*`.
`tools.web.search.apiKey` cũ vẫn được tải qua shim tương thích, nhưng không còn là đường dẫn cấu hình chính tắc.

`webSearch.mode` kiểm soát cơ chế truyền tải Brave:

- `web` (mặc định): tìm kiếm web Brave thông thường với tiêu đề, URL và đoạn trích
- `llm-context`: Brave LLM Context API với các đoạn văn bản và nguồn đã được trích xuất sẵn để làm cơ sở

`webSearch.baseUrl` có thể trỏ các yêu cầu Brave tới proxy tương thích Brave đáng tin cậy
hoặc gateway. OpenClaw nối thêm `/res/v1/web/search` hoặc `/res/v1/llm/context` vào
URL cơ sở đã cấu hình và giữ URL cơ sở trong khóa bộ nhớ đệm. Các
endpoint công khai phải dùng `https://`; `http://` chỉ được chấp nhận cho loopback đáng tin cậy
hoặc máy chủ proxy mạng riêng.

## Tham số công cụ

<ParamField path="query" type="string" required>
Truy vấn tìm kiếm.
</ParamField>

<ParamField path="count" type="number" default="5">
Số lượng kết quả trả về (1–10).
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

- OpenClaw sử dụng gói **Search** của Brave. Nếu bạn có gói đăng ký cũ (ví dụ: gói Free ban đầu với 2.000 truy vấn/tháng), gói đó vẫn hợp lệ nhưng không bao gồm các tính năng mới hơn như LLM Context hoặc giới hạn tốc độ cao hơn.
- Mỗi gói Brave bao gồm **\$5/tháng tín dụng miễn phí** (gia hạn định kỳ). Gói Search có giá \$5 cho mỗi 1.000 yêu cầu, vì vậy tín dụng này bao phủ 1.000 truy vấn/tháng. Đặt giới hạn sử dụng trong bảng điều khiển Brave để tránh chi phí ngoài dự kiến. Xem [cổng Brave API](https://brave.com/search/api/) để biết các gói hiện tại.
- Gói Search bao gồm endpoint LLM Context và quyền suy luận AI. Việc lưu trữ kết quả để huấn luyện hoặc tinh chỉnh mô hình yêu cầu một gói có quyền lưu trữ rõ ràng. Xem [Điều khoản Dịch vụ](https://api-dashboard.search.brave.com/terms-of-service) của Brave.
- Chế độ `llm-context` trả về các mục nguồn có căn cứ thay vì dạng đoạn trích tìm kiếm web thông thường.
- Chế độ `llm-context` hỗ trợ `freshness` và các khoảng `date_after` + `date_before` có giới hạn. Chế độ này không hỗ trợ `ui_lang`; `date_before` không có `date_after` sẽ bị từ chối vì Brave yêu cầu các khoảng độ mới tùy chỉnh phải bao gồm cả ngày bắt đầu và ngày kết thúc.
- `ui_lang` phải bao gồm thẻ con khu vực như `en-US`.
- Theo mặc định, kết quả được lưu trong bộ nhớ đệm trong 15 phút (có thể cấu hình qua `cacheTtlMinutes`).
- Các giá trị `webSearch.baseUrl` tùy chỉnh được đưa vào danh tính bộ nhớ đệm Brave, nên
  các phản hồi riêng theo proxy không xung đột.
- Bật cờ chẩn đoán `brave.http` để ghi nhật ký URL/tham số truy vấn yêu cầu Brave, trạng thái/thời gian phản hồi và các sự kiện trúng/trượt/ghi bộ nhớ đệm tìm kiếm trong khi khắc phục sự cố. Cờ này không bao giờ ghi nhật ký API key hoặc nội dung phản hồi, nhưng truy vấn tìm kiếm có thể nhạy cảm.

## Liên quan

- [Tổng quan Tìm kiếm Web](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Tìm kiếm Perplexity](/vi/tools/perplexity-search) -- kết quả có cấu trúc với lọc theo miền
- [Tìm kiếm Exa](/vi/tools/exa-search) -- tìm kiếm neural với trích xuất nội dung
