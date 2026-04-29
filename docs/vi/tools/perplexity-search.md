---
read_when:
    - Bạn muốn sử dụng Perplexity Search để tìm kiếm trên web
    - Bạn cần thiết lập PERPLEXITY_API_KEY hoặc OPENROUTER_API_KEY
summary: API Tìm kiếm Perplexity và khả năng tương thích Sonar/OpenRouter cho web_search
title: Tìm kiếm Perplexity
x-i18n:
    generated_at: "2026-04-29T23:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 16
---

# Perplexity Search API

OpenClaw hỗ trợ Perplexity Search API làm nhà cung cấp `web_search`.
API này trả về kết quả có cấu trúc với các trường `title`, `url` và `snippet`.

Để tương thích, OpenClaw cũng hỗ trợ các thiết lập Perplexity Sonar/OpenRouter cũ.
Nếu bạn dùng `OPENROUTER_API_KEY`, một khóa `sk-or-...` trong `plugins.entries.perplexity.config.webSearch.apiKey`, hoặc đặt `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, nhà cung cấp sẽ chuyển sang đường dẫn chat-completions và trả về câu trả lời do AI tổng hợp kèm trích dẫn thay vì kết quả Search API có cấu trúc.

## Lấy khóa Perplexity API

1. Tạo tài khoản Perplexity tại [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Tạo khóa API trong bảng điều khiển
3. Lưu khóa trong cấu hình hoặc đặt `PERPLEXITY_API_KEY` trong môi trường Gateway.

## Khả năng tương thích OpenRouter

Nếu bạn đã dùng OpenRouter cho Perplexity Sonar, hãy giữ `provider: "perplexity"` và đặt `OPENROUTER_API_KEY` trong môi trường Gateway, hoặc lưu một khóa `sk-or-...` trong `plugins.entries.perplexity.config.webSearch.apiKey`.

Các điều khiển tương thích tùy chọn:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Ví dụ cấu hình

### Perplexity Search API gốc

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

### Khả năng tương thích OpenRouter / Sonar

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

**Qua cấu hình:** chạy `openclaw configure --section web`. Lệnh này lưu khóa trong
`~/.openclaw/openclaw.json` dưới `plugins.entries.perplexity.config.webSearch.apiKey`.
Trường đó cũng chấp nhận các đối tượng SecretRef.

**Qua môi trường:** đặt `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY`
trong môi trường tiến trình Gateway. Với một bản cài đặt gateway, hãy đặt trong
`~/.openclaw/.env` (hoặc môi trường dịch vụ của bạn). Xem [Biến môi trường](/vi/help/faq#env-vars-and-env-loading).

Nếu `provider: "perplexity"` được cấu hình và SecretRef của khóa Perplexity không phân giải được mà không có env dự phòng, quá trình khởi động/tải lại sẽ thất bại nhanh.

## Tham số công cụ

Các tham số này áp dụng cho đường dẫn Perplexity Search API gốc.

<ParamField path="query" type="string" required>
Truy vấn tìm kiếm.
</ParamField>

<ParamField path="count" type="number" default="5">
Số kết quả cần trả về (1–10).
</ParamField>

<ParamField path="country" type="string">
Mã quốc gia ISO gồm 2 chữ cái (ví dụ `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Mã ngôn ngữ ISO 639-1 (ví dụ `en`, `de`, `fr`).
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

<ParamField path="domain_filter" type="string[]">
Mảng danh sách miền cho phép/chặn (tối đa 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Tổng ngân sách nội dung (tối đa 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Giới hạn token trên mỗi trang.
</ParamField>

Đối với đường dẫn tương thích Sonar/OpenRouter cũ:

- `query`, `count` và `freshness` được chấp nhận
- `count` chỉ dành cho khả năng tương thích ở đó; phản hồi vẫn là một câu trả lời
  được tổng hợp kèm trích dẫn thay vì danh sách N kết quả
- Các bộ lọc chỉ dành cho Search API như `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` và `max_tokens_per_page`
  trả về lỗi rõ ràng

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

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Quy tắc bộ lọc miền

- Tối đa 20 miền cho mỗi bộ lọc
- Không thể trộn danh sách cho phép và danh sách chặn trong cùng một yêu cầu
- Dùng tiền tố `-` cho các mục danh sách chặn (ví dụ `["-reddit.com"]`)

## Ghi chú

- Perplexity Search API trả về kết quả tìm kiếm web có cấu trúc (`title`, `url`, `snippet`)
- OpenRouter hoặc `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` rõ ràng sẽ chuyển Perplexity trở lại chat completions Sonar để tương thích
- Khả năng tương thích Sonar/OpenRouter trả về một câu trả lời được tổng hợp kèm trích dẫn, không phải các hàng kết quả có cấu trúc
- Kết quả được lưu trong bộ nhớ đệm trong 15 phút theo mặc định (có thể cấu hình qua `cacheTtlMinutes`)

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Tài liệu Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) -- tài liệu chính thức của Perplexity
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc với bộ lọc quốc gia/ngôn ngữ
- [Exa Search](/vi/tools/exa-search) -- tìm kiếm neural có trích xuất nội dung
