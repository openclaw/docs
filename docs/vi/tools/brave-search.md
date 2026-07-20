---
read_when:
    - Bạn muốn sử dụng Brave Search cho web_search
    - Bạn cần BRAVE_API_KEY hoặc thông tin chi tiết về gói dịch vụ
summary: Thiết lập Brave Search API cho web_search
title: Tìm kiếm Brave
x-i18n:
    generated_at: "2026-07-20T04:32:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52168db93abb564eda5868584261e0530ce3cff57c3463a2fc1eded351df30f2
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw hỗ trợ API Brave Search làm nhà cung cấp `web_search`.

## Lấy khóa API

1. Tạo tài khoản API Brave Search tại [https://brave.com/search/api/](https://brave.com/search/api/)
2. Trong bảng điều khiển, chọn gói **Search** và tạo khóa API.
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
            mode: "web", // hoặc "llm-context"
            baseUrl: "https://api.search.brave.com", // tùy chọn ghi đè URL proxy/URL cơ sở
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

Các cài đặt tìm kiếm dành riêng cho nhà cung cấp Brave nằm trong `plugins.entries.brave.config.webSearch.*`; đây là đường dẫn cấu hình chuẩn.

`webSearch.mode` điều khiển phương thức truyền tải của Brave:

- `web` (mặc định): tìm kiếm web Brave thông thường với tiêu đề, URL và đoạn trích
- `llm-context`: API Brave LLM Context với các đoạn văn bản và nguồn được trích xuất sẵn để làm căn cứ

`webSearch.baseUrl` có thể chuyển các yêu cầu Brave đến một proxy tương thích với Brave đáng tin cậy
hoặc gateway. OpenClaw nối thêm `/res/v1/web/search` hoặc `/res/v1/llm/context` vào
URL cơ sở đã cấu hình và đưa URL cơ sở vào khóa bộ nhớ đệm. Các điểm cuối
công khai phải sử dụng `https://`; `http://` chỉ được chấp nhận cho các máy chủ proxy loopback đáng tin cậy
hoặc thuộc mạng riêng.

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
Mã ngôn ngữ tìm kiếm của Brave (ví dụ: `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Mã ngôn ngữ ISO cho các thành phần giao diện người dùng.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Bộ lọc thời gian — `day` là 24 giờ.
</ParamField>

<ParamField path="date_after" type="string">
Chỉ lấy kết quả được xuất bản sau ngày này (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Chỉ lấy kết quả được xuất bản trước ngày này (`YYYY-MM-DD`).
</ParamField>

**Ví dụ:**

```javascript
// Tìm kiếm theo quốc gia và ngôn ngữ
await web_search({
  query: "năng lượng tái tạo",
  country: "DE",
  language: "de",
});

// Kết quả gần đây (tuần qua)
await web_search({
  query: "tin tức AI",
  freshness: "week",
});

// Tìm kiếm theo khoảng ngày
await web_search({
  query: "các phát triển về AI",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Ghi chú

- OpenClaw sử dụng gói **Search** của Brave. Nếu bạn có gói đăng ký cũ (ví dụ: gói Free ban đầu với 2.000 truy vấn/tháng), gói đó vẫn hợp lệ nhưng không bao gồm các tính năng mới hơn như LLM Context hoặc giới hạn tốc độ cao hơn.
- Mỗi gói Brave bao gồm **\$5 tín dụng miễn phí mỗi tháng** (được gia hạn). Gói Search có giá \$5 cho mỗi 1.000 yêu cầu, nên khoản tín dụng này chi trả cho 1.000 truy vấn/tháng. Hãy đặt giới hạn sử dụng trong bảng điều khiển Brave để tránh các khoản phí ngoài dự kiến. Xem [cổng thông tin API Brave](https://brave.com/search/api/) để biết các gói hiện tại.
- Gói Search bao gồm điểm cuối LLM Context và quyền suy luận AI. Việc lưu trữ kết quả để huấn luyện hoặc tinh chỉnh mô hình yêu cầu một gói có quyền lưu trữ rõ ràng. Xem [Điều khoản dịch vụ](https://api-dashboard.search.brave.com/terms-of-service) của Brave.
- Chế độ `llm-context` trả về các mục nguồn có căn cứ thay vì cấu trúc đoạn trích tìm kiếm web thông thường.
- Chế độ `llm-context` hỗ trợ `freshness` và các khoảng `date_after` + `date_before` có giới hạn. Chế độ này không hỗ trợ `ui_lang`; `date_before` không có `date_after` sẽ bị từ chối vì Brave yêu cầu các khoảng thời gian tùy chỉnh phải bao gồm cả ngày bắt đầu và ngày kết thúc.
- `ui_lang` phải bao gồm một thẻ phụ khu vực như `en-US`.
- Theo mặc định, kết quả được lưu vào bộ nhớ đệm trong 15 phút (có thể cấu hình qua `cacheTtlMinutes`).
- Các giá trị `webSearch.baseUrl` tùy chỉnh được đưa vào định danh bộ nhớ đệm Brave, nên
  các phản hồi dành riêng cho proxy không xung đột với nhau.
- Bật cờ chẩn đoán `brave.http` để ghi nhật ký URL/tham số truy vấn của yêu cầu Brave, trạng thái/thời gian phản hồi và các sự kiện trúng/trượt/ghi bộ nhớ đệm tìm kiếm khi khắc phục sự cố. Cờ này không bao giờ ghi nhật ký khóa API hoặc nội dung phản hồi, nhưng truy vấn tìm kiếm có thể chứa thông tin nhạy cảm.

## Liên quan

- [Tổng quan về Tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [Tìm kiếm Perplexity](/vi/tools/perplexity-search) -- kết quả có cấu trúc với tính năng lọc miền
- [Tìm kiếm Exa](/vi/tools/exa-search) -- tìm kiếm nơ-ron với tính năng trích xuất nội dung
