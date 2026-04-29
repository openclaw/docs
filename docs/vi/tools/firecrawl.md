---
read_when:
    - Bạn muốn trích xuất web dựa trên Firecrawl
    - Bạn cần khóa API Firecrawl
    - Bạn muốn Firecrawl làm nhà cung cấp web_search
    - Bạn muốn tính năng trích xuất chống bot cho web_fetch
summary: Tìm kiếm, thu thập dữ liệu và phương án dự phòng web_fetch của Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-04-29T23:18:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw có thể dùng **Firecrawl** theo ba cách:

- làm provider `web_search`
- làm công cụ Plugin rõ ràng: `firecrawl_search` và `firecrawl_scrape`
- làm trình trích xuất dự phòng cho `web_fetch`

Đây là dịch vụ trích xuất/tìm kiếm được lưu trữ hỗ trợ vượt qua cơ chế chặn bot và lưu bộ nhớ đệm,
giúp xử lý các trang nặng JS hoặc các trang chặn fetch HTTP thuần.

## Lấy API key

1. Tạo tài khoản Firecrawl và tạo API key.
2. Lưu trong cấu hình hoặc đặt `FIRECRAWL_API_KEY` trong môi trường Gateway.

## Cấu hình tìm kiếm Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Ghi chú:

- Chọn Firecrawl trong quy trình thiết lập ban đầu hoặc `openclaw configure --section web` sẽ tự động bật Plugin Firecrawl đi kèm.
- `web_search` với Firecrawl hỗ trợ `query` và `count`.
- Với các điều khiển riêng của Firecrawl như `sources`, `categories`, hoặc cào dữ liệu kết quả, hãy dùng `firecrawl_search`.
- Ghi đè `baseUrl` phải giữ ở `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` là env dự phòng dùng chung cho URL cơ sở của tìm kiếm và scrape Firecrawl.

## Cấu hình Firecrawl scrape + dự phòng web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Ghi chú:

- Các lần thử dự phòng Firecrawl chỉ chạy khi có API key (`plugins.entries.firecrawl.config.webFetch.apiKey` hoặc `FIRECRAWL_API_KEY`).
- `maxAgeMs` kiểm soát kết quả được lưu trong bộ nhớ đệm có thể cũ bao lâu (ms). Mặc định là 2 ngày.
- Cấu hình cũ `tools.web.fetch.firecrawl.*` được tự động di chuyển bởi `openclaw doctor --fix`.
- Ghi đè URL scrape/cơ sở của Firecrawl bị giới hạn ở `https://api.firecrawl.dev`.

`firecrawl_scrape` dùng lại cùng các thiết lập `plugins.entries.firecrawl.config.webFetch.*` và env vars.

## Công cụ Plugin Firecrawl

### `firecrawl_search`

Dùng mục này khi bạn muốn các điều khiển tìm kiếm riêng của Firecrawl thay vì `web_search` chung.

Tham số cốt lõi:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Dùng mục này cho các trang nặng JS hoặc được bảo vệ chống bot, nơi `web_fetch` thuần hoạt động yếu.

Tham số cốt lõi:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Ẩn mình / vượt qua cơ chế chặn bot

Firecrawl cung cấp tham số **chế độ proxy** để vượt qua cơ chế chặn bot (`basic`, `stealth`, hoặc `auto`).
OpenClaw luôn dùng `proxy: "auto"` cộng với `storeInCache: true` cho các yêu cầu Firecrawl.
Nếu bỏ qua proxy, Firecrawl mặc định là `auto`. `auto` sẽ thử lại bằng proxy ẩn mình nếu lần thử cơ bản thất bại, điều này có thể dùng nhiều credit hơn
so với scrape chỉ dùng basic.

## Cách `web_fetch` dùng Firecrawl

Thứ tự trích xuất của `web_fetch`:

1. Readability (cục bộ)
2. Firecrawl (nếu được chọn hoặc tự động phát hiện là dự phòng web-fetch đang hoạt động)
3. Dọn dẹp HTML cơ bản (dự phòng cuối cùng)

Núm chọn là `tools.web.fetch.provider`. Nếu bạn bỏ qua, OpenClaw
sẽ tự động phát hiện provider web-fetch sẵn sàng đầu tiên từ thông tin xác thực hiện có.
Hiện tại provider đi kèm là Firecrawl.

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả provider và tự động phát hiện
- [Web Fetch](/vi/tools/web-fetch) -- công cụ web_fetch với dự phòng Firecrawl
- [Tavily](/vi/tools/tavily) -- công cụ tìm kiếm + trích xuất
