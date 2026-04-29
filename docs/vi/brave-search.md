---
read_when:
    - Bạn muốn sử dụng Brave Search cho web_search
    - Bạn cần BRAVE_API_KEY hoặc thông tin chi tiết về gói
summary: Thiết lập Brave Search API cho web_search
title: Tìm kiếm Brave (đường dẫn cũ)
x-i18n:
    generated_at: "2026-04-29T22:24:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw hỗ trợ Brave Search API làm nhà cung cấp `web_search`.

## Lấy khóa API

1. Tạo tài khoản Brave Search API tại [https://brave.com/search/api/](https://brave.com/search/api/)
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

Các cài đặt tìm kiếm Brave dành riêng cho nhà cung cấp hiện nằm dưới `plugins.entries.brave.config.webSearch.*`.
`tools.web.search.apiKey` cũ vẫn tải thông qua lớp tương thích, nhưng không còn là đường dẫn cấu hình chuẩn nữa.

`webSearch.mode` điều khiển phương thức truyền tải Brave:

- `web` (mặc định): tìm kiếm web Brave thông thường với tiêu đề, URL và đoạn trích
- `llm-context`: Brave LLM Context API với các đoạn văn bản đã trích xuất sẵn và nguồn để neo căn cứ

## Tham số công cụ

| Tham số       | Mô tả                                                               |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Truy vấn tìm kiếm (bắt buộc)                                        |
| `count`       | Số lượng kết quả cần trả về (1-10, mặc định: 5)                     |
| `country`     | Mã quốc gia ISO 2 chữ cái (ví dụ: "US", "DE")                       |
| `language`    | Mã ngôn ngữ ISO 639-1 cho kết quả tìm kiếm (ví dụ: "en", "de", "fr") |
| `search_lang` | Mã ngôn ngữ tìm kiếm Brave (ví dụ: `en`, `en-gb`, `zh-hans`)        |
| `ui_lang`     | Mã ngôn ngữ ISO cho các thành phần UI                               |
| `freshness`   | Bộ lọc thời gian: `day` (24 giờ), `week`, `month`, hoặc `year`      |
| `date_after`  | Chỉ các kết quả được xuất bản sau ngày này (YYYY-MM-DD)             |
| `date_before` | Chỉ các kết quả được xuất bản trước ngày này (YYYY-MM-DD)           |

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
- Mỗi gói Brave bao gồm **\$5/tháng tín dụng miễn phí** (gia hạn định kỳ). Gói Search có giá \$5 cho mỗi 1.000 yêu cầu, nên khoản tín dụng này bao phủ 1.000 truy vấn/tháng. Đặt giới hạn sử dụng trong bảng điều khiển Brave để tránh phí phát sinh ngoài dự kiến. Xem [cổng Brave API](https://brave.com/search/api/) để biết các gói hiện tại.
- Gói Search bao gồm điểm cuối LLM Context và quyền suy luận AI. Việc lưu trữ kết quả để huấn luyện hoặc tinh chỉnh mô hình yêu cầu một gói có quyền lưu trữ rõ ràng. Xem [Điều khoản dịch vụ](https://api-dashboard.search.brave.com/terms-of-service) của Brave.
- Chế độ `llm-context` trả về các mục nguồn có căn cứ thay vì hình dạng đoạn trích tìm kiếm web thông thường.
- Chế độ `llm-context` không hỗ trợ `ui_lang`, `freshness`, `date_after`, hoặc `date_before`.
- `ui_lang` phải bao gồm một thẻ phụ vùng như `en-US`.
- Kết quả được lưu vào bộ nhớ đệm trong 15 phút theo mặc định (có thể cấu hình qua `cacheTtlMinutes`).

Xem [Công cụ web](/vi/tools/web) để biết cấu hình web_search đầy đủ.

## Liên quan

- [Tìm kiếm Brave](/vi/tools/brave-search)
