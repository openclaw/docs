---
read_when:
    - Bạn muốn trích xuất web được hỗ trợ bởi Firecrawl
    - Bạn muốn Firecrawl web_fetch không cần khóa
    - Bạn cần khóa API Firecrawl để tìm kiếm hoặc có giới hạn cao hơn
    - Bạn muốn Firecrawl làm nhà cung cấp web_search
    - Bạn muốn trích xuất chống bot cho web_fetch
summary: Tìm kiếm, thu thập dữ liệu và dự phòng web_fetch của Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:16:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw có thể dùng **Firecrawl** theo ba cách:

- làm nhà cung cấp `web_search`
- làm các công cụ Plugin rõ ràng: `firecrawl_search` và `firecrawl_scrape`
- làm bộ trích xuất dự phòng cho `web_fetch`

Đây là dịch vụ trích xuất/tìm kiếm được lưu trữ, hỗ trợ né bot và lưu bộ nhớ đệm,
giúp xử lý các trang nặng JS hoặc các trang chặn truy xuất HTTP thuần.

## Cài đặt Plugin

Cài đặt Plugin chính thức, rồi khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch không cần khóa và khóa API

Dự phòng `web_fetch` Firecrawl được lưu trữ và được chọn rõ ràng hỗ trợ quyền
truy cập khởi đầu mà không cần khóa API. Thêm `FIRECRAWL_API_KEY` vào môi trường gateway
hoặc cấu hình khóa khi bạn cần giới hạn cao hơn. Firecrawl `web_search` và
`firecrawl_scrape` yêu cầu khóa API.

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

- Việc chọn Firecrawl trong quá trình onboarding hoặc `openclaw configure --section web` sẽ tự động bật Plugin Firecrawl đã cài đặt.
- `web_search` với Firecrawl hỗ trợ `query` và `count`.
- Với các điều khiển riêng của Firecrawl như `sources`, `categories` hoặc thu thập kết quả, hãy dùng `firecrawl_search`.
- `baseUrl` mặc định là Firecrawl được lưu trữ tại `https://api.firecrawl.dev`. Chỉ cho phép ghi đè tự lưu trữ đối với endpoint riêng tư/nội bộ; HTTP chỉ được chấp nhận cho các đích riêng tư đó.
- `FIRECRAWL_BASE_URL` là dự phòng env dùng chung cho URL cơ sở của tìm kiếm và thu thập Firecrawl.

## Cấu hình dự phòng Firecrawl web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- Dự phòng Firecrawl `web_fetch` được chọn rõ ràng hoạt động mà không cần khóa API. Khi được cấu hình, OpenClaw gửi `plugins.entries.firecrawl.config.webFetch.apiKey` hoặc `FIRECRAWL_API_KEY` để có giới hạn cao hơn.
- Việc chọn Firecrawl trong quá trình onboarding hoặc `openclaw configure --section web` sẽ bật Plugin và chọn Firecrawl cho `web_fetch`, trừ khi đã cấu hình nhà cung cấp fetch khác.
- `firecrawl_scrape` yêu cầu khóa API.
- `maxAgeMs` kiểm soát kết quả đã lưu bộ nhớ đệm có thể cũ đến mức nào (ms). Mặc định là 2 ngày.
- Cấu hình cũ `tools.web.fetch.firecrawl.*` được `openclaw doctor --fix` tự động di chuyển.
- Các ghi đè URL scrape/base của Firecrawl tuân theo cùng quy tắc lưu trữ/riêng tư như tìm kiếm: lưu lượng công khai được lưu trữ dùng `https://api.firecrawl.dev`; các ghi đè tự lưu trữ phải phân giải tới endpoint riêng tư/nội bộ.
- `firecrawl_scrape` từ chối các URL đích rõ ràng là riêng tư, loopback, metadata và không phải HTTP(S) trước khi chuyển tiếp chúng đến Firecrawl, khớp với hợp đồng an toàn đích của `web_fetch` cho các lệnh gọi thu thập Firecrawl rõ ràng.

`firecrawl_scrape` tái sử dụng cùng các cài đặt và biến env `plugins.entries.firecrawl.config.webFetch.*`, bao gồm cả khóa API bắt buộc.

### Firecrawl tự lưu trữ

Đặt `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl`, hoặc `FIRECRAWL_BASE_URL`
khi bạn tự chạy Firecrawl. OpenClaw chỉ chấp nhận `http://` cho các đích loopback,
mạng riêng, `.local`, `.internal`, hoặc `.localhost`. Các máy chủ tùy chỉnh công khai
bị từ chối để khóa API Firecrawl không bị vô tình gửi đến các endpoint tùy ý.

## Công cụ Plugin Firecrawl

### `firecrawl_search`

Dùng công cụ này khi bạn muốn các điều khiển tìm kiếm riêng của Firecrawl thay vì `web_search` chung.

Tham số chính:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Dùng công cụ này cho các trang nặng JS hoặc được bảo vệ khỏi bot, nơi `web_fetch` thuần hoạt động kém.

Tham số chính:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Ẩn mình / né bot

Firecrawl cung cấp tham số **chế độ proxy** để né bot (`basic`, `stealth`, hoặc `auto`).
OpenClaw luôn dùng `proxy: "auto"` cùng với `storeInCache: true` cho các yêu cầu Firecrawl.
Nếu bỏ qua proxy, Firecrawl mặc định là `auto`. `auto` thử lại bằng proxy ẩn mình nếu lần thử cơ bản thất bại, điều này có thể dùng nhiều credit hơn
so với thu thập chỉ dùng basic.

## Cách `web_fetch` dùng Firecrawl

Thứ tự trích xuất của `web_fetch`:

1. Readability (cục bộ)
2. Firecrawl (khi được chọn, hoặc được tự động phát hiện từ thông tin xác thực đã cấu hình)
3. Dọn dẹp HTML cơ bản (dự phòng cuối cùng)

Núm chọn là `tools.web.fetch.provider`. Nếu bạn bỏ qua nó, OpenClaw
tự động phát hiện nhà cung cấp web-fetch sẵn sàng đầu tiên từ thông tin xác thực khả dụng.
Plugin Firecrawl chính thức cung cấp dự phòng đó.

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Web Fetch](/vi/tools/web-fetch) -- công cụ web_fetch với dự phòng Firecrawl
- [Tavily](/vi/tools/tavily) -- công cụ tìm kiếm + trích xuất
