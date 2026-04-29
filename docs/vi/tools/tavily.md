---
read_when:
    - Bạn muốn tìm kiếm trên web do Tavily hỗ trợ
    - Bạn cần có khóa API Tavily
    - Bạn muốn sử dụng Tavily làm nhà cung cấp web_search
    - Bạn muốn trích xuất nội dung từ các URL
summary: Các công cụ tìm kiếm và trích xuất của Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-29T23:21:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 16
---

OpenClaw có thể sử dụng **Tavily** theo hai cách:

- làm nhà cung cấp `web_search`
- làm các công cụ Plugin rõ ràng: `tavily_search` và `tavily_extract`

Tavily là một API tìm kiếm được thiết kế cho các ứng dụng AI, trả về kết quả có cấu trúc
được tối ưu hóa để LLM sử dụng. Tavily hỗ trợ độ sâu tìm kiếm có thể cấu hình, lọc theo chủ đề,
bộ lọc miền, bản tóm tắt câu trả lời do AI tạo, và trích xuất nội dung
từ URL (bao gồm các trang được JavaScript kết xuất).

## Lấy API key

1. Tạo tài khoản Tavily tại [tavily.com](https://tavily.com/).
2. Tạo API key trong dashboard.
3. Lưu khóa đó trong cấu hình hoặc đặt `TAVILY_API_KEY` trong môi trường Gateway.

## Cấu hình tìm kiếm Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Ghi chú:

- Chọn Tavily trong onboarding hoặc `openclaw configure --section web` sẽ tự động bật
  Plugin Tavily được tích hợp sẵn.
- Lưu cấu hình Tavily trong `plugins.entries.tavily.config.webSearch.*`.
- `web_search` với Tavily hỗ trợ `query` và `count` (tối đa 20 kết quả).
- Với các điều khiển riêng của Tavily như `search_depth`, `topic`, `include_answer`,
  hoặc bộ lọc miền, hãy dùng `tavily_search`.

## Công cụ Plugin Tavily

### `tavily_search`

Dùng công cụ này khi bạn muốn các điều khiển tìm kiếm riêng của Tavily thay vì
`web_search` chung.

| Tham số           | Mô tả                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `query`           | Chuỗi truy vấn tìm kiếm (giữ dưới 400 ký tự)                            |
| `search_depth`    | `basic` (mặc định, cân bằng) hoặc `advanced` (độ liên quan cao nhất, chậm hơn) |
| `topic`           | `general` (mặc định), `news` (cập nhật theo thời gian thực), hoặc `finance` |
| `max_results`     | Số lượng kết quả, 1-20 (mặc định: 5)                                    |
| `include_answer`  | Bao gồm bản tóm tắt câu trả lời do AI tạo (mặc định: false)             |
| `time_range`      | Lọc theo độ mới: `day`, `week`, `month`, hoặc `year`                    |
| `include_domains` | Mảng các miền để giới hạn kết quả                                       |
| `exclude_domains` | Mảng các miền để loại khỏi kết quả                                      |

**Độ sâu tìm kiếm:**

| Độ sâu     | Tốc độ    | Độ liên quan | Phù hợp nhất cho                         |
| ---------- | --------- | ------------ | ---------------------------------------- |
| `basic`    | Nhanh hơn | Cao          | Truy vấn đa dụng (mặc định)              |
| `advanced` | Chậm hơn  | Cao nhất     | Độ chính xác, sự kiện cụ thể, nghiên cứu |

### `tavily_extract`

Dùng công cụ này để trích xuất nội dung sạch từ một hoặc nhiều URL. Xử lý
các trang được JavaScript kết xuất và hỗ trợ chia đoạn tập trung theo truy vấn để trích xuất
có mục tiêu.

| Tham số             | Mô tả                                                        |
| ------------------- | ------------------------------------------------------------ |
| `urls`              | Mảng URL cần trích xuất (1-20 mỗi yêu cầu)                   |
| `query`             | Xếp hạng lại các đoạn đã trích xuất theo độ liên quan với truy vấn này |
| `extract_depth`     | `basic` (mặc định, nhanh) hoặc `advanced` (cho các trang nhiều JS) |
| `chunks_per_source` | Số đoạn trên mỗi URL, 1-5 (yêu cầu `query`)                  |
| `include_images`    | Bao gồm URL hình ảnh trong kết quả (mặc định: false)         |

**Độ sâu trích xuất:**

| Độ sâu     | Khi nào nên dùng                          |
| ---------- | ----------------------------------------- |
| `basic`    | Trang đơn giản - hãy thử lựa chọn này trước |
| `advanced` | SPA được JS kết xuất, nội dung động, bảng |

Mẹo:

- Tối đa 20 URL mỗi yêu cầu. Chia danh sách lớn hơn thành nhiều lệnh gọi.
- Dùng `query` + `chunks_per_source` để chỉ lấy nội dung liên quan thay vì toàn bộ trang.
- Thử `basic` trước; chuyển sang `advanced` nếu nội dung bị thiếu hoặc không đầy đủ.

## Chọn công cụ phù hợp

| Nhu cầu                                      | Công cụ           |
| ------------------------------------------- | ----------------- |
| Tìm kiếm web nhanh, không có tùy chọn đặc biệt | `web_search`      |
| Tìm kiếm với độ sâu, chủ đề, câu trả lời AI | `tavily_search`   |
| Trích xuất nội dung từ URL cụ thể           | `tavily_extract`  |

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Firecrawl](/vi/tools/firecrawl) -- tìm kiếm + thu thập dữ liệu với trích xuất nội dung
- [Exa Search](/vi/tools/exa-search) -- tìm kiếm neural với trích xuất nội dung
