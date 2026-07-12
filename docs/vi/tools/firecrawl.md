---
read_when:
    - Bạn muốn trích xuất nội dung web bằng Firecrawl
    - Bạn muốn dùng Firecrawl `web_fetch` không cần khóa API
    - Bạn cần khóa API Firecrawl để tìm kiếm hoặc có hạn mức cao hơn
    - Bạn muốn dùng Firecrawl làm nhà cung cấp `web_search`
    - Bạn muốn trích xuất nội dung có khả năng chống bot cho web_fetch
summary: Tìm kiếm và thu thập dữ liệu bằng Firecrawl, cùng phương án dự phòng cho `web_fetch`
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T08:30:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw có thể sử dụng **Firecrawl** theo ba cách:

- làm nhà cung cấp `web_search`
- làm các công cụ Plugin tường minh: `firecrawl_search` và `firecrawl_scrape`
- làm trình trích xuất dự phòng cho `web_fetch`

Đây là dịch vụ tìm kiếm/trích xuất được lưu trữ, hỗ trợ vượt qua cơ chế chống bot và lưu vào bộ nhớ đệm, nhờ đó hữu ích với các trang web phụ thuộc nhiều vào JS hoặc chặn các yêu cầu tìm nạp HTTP thông thường.

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## `web_fetch` không cần khóa và khóa API

Phương án dự phòng `web_fetch` sử dụng Firecrawl được lưu trữ và được chọn tường minh hỗ trợ quyền truy cập khởi đầu mà không cần khóa API. Thêm `FIRECRAWL_API_KEY` vào môi trường Gateway hoặc cấu hình khóa này khi bạn cần giới hạn cao hơn. `web_search` và `firecrawl_scrape` của Firecrawl yêu cầu khóa API.

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

Lưu ý:

- Việc chọn Firecrawl trong quy trình thiết lập ban đầu hoặc `openclaw configure --section web` sẽ tự động bật Plugin Firecrawl đã cài đặt.
- `web_search` với Firecrawl hỗ trợ `query` và `count`.
- Đối với các tùy chọn điều khiển riêng của Firecrawl như `sources`, `categories` hoặc thu thập dữ liệu từ kết quả, hãy sử dụng `firecrawl_search`.
- `baseUrl` mặc định trỏ đến Firecrawl được lưu trữ tại `https://api.firecrawl.dev`. Chỉ được phép ghi đè bằng dịch vụ tự lưu trữ đối với các điểm cuối riêng tư/nội bộ; HTTP chỉ được chấp nhận cho các đích riêng tư đó.
- `FIRECRAWL_BASE_URL` là biến môi trường dự phòng dùng chung cho URL cơ sở của thao tác tìm kiếm và thu thập dữ liệu Firecrawl.
- Các yêu cầu tìm kiếm Firecrawl có thời gian chờ mặc định là 30 giây; tham số `timeoutSeconds` của `firecrawl_search` ghi đè giá trị này cho từng lệnh gọi.

## Cấu hình phương án dự phòng `web_fetch` của Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // việc chọn tường minh sẽ bật phương án dự phòng không cần khóa
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

Lưu ý:

- Phương án dự phòng `web_fetch` của Firecrawl được chọn tường minh hoạt động mà không cần khóa API. Khi được cấu hình, OpenClaw gửi `plugins.entries.firecrawl.config.webFetch.apiKey` hoặc `FIRECRAWL_API_KEY` để có giới hạn cao hơn.
- Việc chọn Firecrawl trong quy trình thiết lập ban đầu hoặc `openclaw configure --section web` sẽ bật Plugin và chọn Firecrawl cho `web_fetch`, trừ khi một nhà cung cấp tìm nạp khác đã được cấu hình.
- `firecrawl_scrape` yêu cầu khóa API.
- `maxAgeMs` kiểm soát độ cũ tối đa của kết quả được lưu vào bộ nhớ đệm (ms). Giá trị mặc định là 172.800.000 ms (2 ngày).
- `onlyMainContent` mặc định là `true`; `timeoutSeconds` mặc định là 60.
- Cấu hình cũ `tools.web.fetch.firecrawl.*` và `tools.web.search.firecrawl.*` được `openclaw doctor --fix` tự động di chuyển.
- Các giá trị ghi đè URL cơ sở/thu thập dữ liệu của Firecrawl tuân theo cùng quy tắc lưu trữ/riêng tư như tìm kiếm: lưu lượng công khai được lưu trữ sử dụng `https://api.firecrawl.dev`; các giá trị ghi đè tự lưu trữ phải phân giải thành điểm cuối riêng tư/nội bộ.
- `firecrawl_scrape` từ chối các URL đích rõ ràng là riêng tư, loopback, siêu dữ liệu hoặc không phải HTTP(S) trước khi chuyển tiếp chúng đến Firecrawl, tuân theo hợp đồng an toàn đích của `web_fetch` đối với các lệnh gọi thu thập dữ liệu Firecrawl tường minh.

`firecrawl_scrape` sử dụng lại cùng các thiết lập và biến môi trường `plugins.entries.firecrawl.config.webFetch.*`, bao gồm khóa API bắt buộc.

### Firecrawl tự lưu trữ

Đặt `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` hoặc `FIRECRAWL_BASE_URL` khi bạn tự vận hành Firecrawl. OpenClaw chỉ chấp nhận `http://` cho các đích loopback, mạng riêng, `.local`, `.internal` hoặc `.localhost`. Các máy chủ tùy chỉnh công khai bị từ chối để tránh vô tình gửi khóa API Firecrawl đến các điểm cuối tùy ý.

## Các công cụ của Plugin Firecrawl

### `firecrawl_search`

Sử dụng công cụ này khi bạn muốn các tùy chọn điều khiển tìm kiếm riêng của Firecrawl thay vì `web_search` dùng chung.

Tham số:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Sử dụng công cụ này cho các trang phụ thuộc nhiều vào JS hoặc được bảo vệ chống bot, nơi `web_fetch` thông thường hoạt động kém hiệu quả.

Tham số:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Chế độ ẩn mình/vượt qua cơ chế chống bot

`firecrawl_scrape` và phương án dự phòng Firecrawl của `web_fetch` mặc định sử dụng `proxy: "auto"` cùng với `storeInCache: true`, trừ khi bên gọi ghi đè các tham số đó. `firecrawl_search` và nhà cung cấp Firecrawl của `web_search` không có tùy chọn điều khiển `proxy`/`storeInCache`; chế độ proxy ẩn mình chỉ áp dụng cho các yêu cầu thu thập dữ liệu/tìm nạp.

Chế độ `proxy` của Firecrawl kiểm soát việc vượt qua cơ chế chống bot (`basic`, `stealth` hoặc `auto`). `auto` thử lại bằng proxy ẩn mình nếu lần thử cơ bản thất bại; cách này có thể sử dụng nhiều tín dụng hơn so với chỉ thu thập dữ liệu ở chế độ cơ bản.

## Cách `web_fetch` sử dụng Firecrawl

Thứ tự trích xuất của `web_fetch`:

1. Readability (cục bộ)
2. Nhà cung cấp tìm nạp đã cấu hình, chẳng hạn như Firecrawl (khi được chọn hoặc được tự động phát hiện từ thông tin xác thực đã cấu hình)
3. Dọn dẹp HTML cơ bản (phương án dự phòng cuối cùng)

Tùy chọn lựa chọn là `tools.web.fetch.provider`. Nếu bạn bỏ qua tùy chọn này, OpenClaw sẽ tự động phát hiện nhà cung cấp tìm nạp web sẵn sàng đầu tiên từ các thông tin xác thực hiện có. Plugin Firecrawl chính thức cung cấp phương án dự phòng đó.

## Nội dung liên quan

- [Tổng quan về tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và cơ chế tự động phát hiện
- [Tìm nạp web](/vi/tools/web-fetch) -- công cụ `web_fetch` với phương án dự phòng Firecrawl
- [Tavily](/vi/tools/tavily) -- các công cụ tìm kiếm + trích xuất
