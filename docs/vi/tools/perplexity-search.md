---
read_when:
    - Bạn muốn sử dụng Perplexity Search để tìm kiếm trên web
    - Bạn cần thiết lập PERPLEXITY_API_KEY hoặc OPENROUTER_API_KEY
summary: API Tìm kiếm Perplexity và khả năng tương thích Sonar/OpenRouter cho web_search
title: Tìm kiếm Perplexity
x-i18n:
    generated_at: "2026-07-12T08:31:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw hỗ trợ Perplexity Search API làm nhà cung cấp `web_search`. API này trả về các kết quả có cấu trúc với các trường `title`, `url` và `snippet`.

Để đảm bảo khả năng tương thích, OpenClaw cũng hỗ trợ các cấu hình Perplexity Sonar/OpenRouter cũ. Nếu bạn sử dụng `OPENROUTER_API_KEY`, khóa `sk-or-...` trong `plugins.entries.perplexity.config.webSearch.apiKey`, hoặc đặt `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, nhà cung cấp sẽ chuyển sang luồng hoàn tất trò chuyện và trả về câu trả lời do AI tổng hợp kèm trích dẫn thay vì các kết quả có cấu trúc từ Search API.

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Lấy khóa API Perplexity

1. Tạo tài khoản Perplexity tại [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Tạo khóa API trong bảng điều khiển.
3. Lưu khóa vào cấu hình hoặc đặt `PERPLEXITY_API_KEY` trong môi trường Gateway.

## Khả năng tương thích với OpenRouter

Nếu bạn đã sử dụng OpenRouter cho Perplexity Sonar, hãy giữ nguyên `provider: "perplexity"` và đặt `OPENROUTER_API_KEY` trong môi trường Gateway, hoặc lưu khóa `sk-or-...` trong `plugins.entries.perplexity.config.webSearch.apiKey`.

Các tùy chọn kiểm soát tương thích:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Ví dụ cấu hình

### Perplexity Search API nguyên bản

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Khả năng tương thích với OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Nơi đặt khóa

**Qua cấu hình:** chạy `openclaw configure --section web`. Lệnh này lưu khóa trong `~/.openclaw/openclaw.json` tại `plugins.entries.perplexity.config.webSearch.apiKey`. Trường đó cũng chấp nhận các đối tượng SecretRef.

**Qua môi trường:** đặt `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY` trong môi trường tiến trình Gateway. Đối với bản cài đặt Gateway, hãy đặt khóa trong `~/.openclaw/.env` (hoặc môi trường dịch vụ của bạn). Xem [Biến môi trường](/vi/help/faq#env-vars-and-env-loading).

Nếu đã cấu hình `provider: "perplexity"` nhưng SecretRef của khóa Perplexity không được phân giải và không có giá trị dự phòng từ môi trường, quá trình khởi động/tải lại sẽ thất bại ngay lập tức.

## Tham số công cụ

Các tham số này áp dụng cho luồng Perplexity Search API nguyên bản.

<ParamField path="query" type="string" required>
Truy vấn tìm kiếm.
</ParamField>

<ParamField path="count" type="number" default="5">
Số lượng kết quả cần trả về (1-10).
</ParamField>

<ParamField path="country" type="string">
Mã quốc gia ISO gồm 2 chữ cái (ví dụ: `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Mã ngôn ngữ ISO 639-1 (ví dụ: `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Bộ lọc thời gian — `day` tương ứng với 24 giờ.
</ParamField>

<ParamField path="date_after" type="string">
Chỉ lấy kết quả được xuất bản sau ngày này (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Chỉ lấy kết quả được xuất bản trước ngày này (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Mảng danh sách miền cho phép/từ chối (tối đa 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Tổng hạn mức nội dung (tối đa 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Giới hạn token trên mỗi trang.
</ParamField>

Đối với luồng tương thích Sonar/OpenRouter cũ:

- Chấp nhận `query`, `count` và `freshness`.
- Tại đây, `count` chỉ dành cho khả năng tương thích; phản hồi vẫn là một câu trả lời tổng hợp duy nhất kèm trích dẫn thay vì danh sách gồm N kết quả.
- Các bộ lọc chỉ dành cho Search API (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) sẽ trả về lỗi rõ ràng.

**Ví dụ:**

```javascript
// Tìm kiếm theo quốc gia và ngôn ngữ
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Kết quả gần đây (tuần vừa qua)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Tìm kiếm theo khoảng ngày
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Lọc miền (danh sách cho phép)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Lọc miền (danh sách từ chối — thêm tiền tố -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Trích xuất thêm nội dung
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Quy tắc lọc miền

- Tối đa 20 miền cho mỗi bộ lọc.
- Không thể kết hợp các mục thuộc danh sách cho phép và danh sách từ chối trong cùng một yêu cầu.
- Dùng tiền tố `-` cho các mục thuộc danh sách từ chối (ví dụ: `["-reddit.com"]`).

## Lưu ý

- Perplexity Search API trả về các kết quả tìm kiếm web có cấu trúc (`title`, `url`, `snippet`).
- OpenRouter hoặc việc đặt rõ ràng `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` sẽ chuyển Perplexity trở lại luồng hoàn tất trò chuyện Sonar để đảm bảo khả năng tương thích.
- Chế độ tương thích Sonar/OpenRouter trả về một câu trả lời tổng hợp duy nhất kèm trích dẫn, không phải các hàng kết quả có cấu trúc.
- Theo mặc định, kết quả được lưu vào bộ nhớ đệm trong 15 phút (có thể cấu hình qua `cacheTtlMinutes`).

## Liên quan

<CardGroup cols={2}>
  <Card title="Tổng quan về tìm kiếm web" href="/vi/tools/web" icon="globe">
    Tất cả nhà cung cấp và các quy tắc tự động phát hiện.
  </Card>
  <Card title="Tìm kiếm Brave" href="/vi/tools/brave-search" icon="shield">
    Kết quả có cấu trúc với bộ lọc quốc gia và ngôn ngữ.
  </Card>
  <Card title="Tìm kiếm Exa" href="/vi/tools/exa-search" icon="magnifying-glass">
    Tìm kiếm ngữ nghĩa bằng mạng nơ-ron với khả năng trích xuất nội dung.
  </Card>
  <Card title="Tài liệu Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Hướng dẫn bắt đầu nhanh và tài liệu tham khảo chính thức của Perplexity Search API.
  </Card>
</CardGroup>
