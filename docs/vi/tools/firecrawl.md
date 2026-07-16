---
read_when:
    - Bạn muốn trích xuất nội dung web bằng Firecrawl
    - Bạn muốn dùng Firecrawl Search không cần khóa (Miễn phí) hoặc web_fetch không cần khóa
    - Bạn cần khóa API Firecrawl để tìm kiếm hoặc có giới hạn cao hơn
    - Bạn muốn dùng Firecrawl làm nhà cung cấp web_search
    - Bạn muốn trích xuất có khả năng chống bot cho web_fetch
summary: Tìm kiếm, thu thập dữ liệu bằng Firecrawl và phương án dự phòng cho web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T15:19:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw có thể sử dụng **Firecrawl** theo ba cách:

- làm nhà cung cấp `web_search`
- làm các công cụ plugin tường minh: `firecrawl_search` và `firecrawl_scrape`
- làm trình trích xuất dự phòng cho `web_fetch`

Đây là dịch vụ tìm kiếm/trích xuất được lưu trữ, hỗ trợ vượt qua cơ chế chống bot và lưu vào bộ nhớ đệm, hữu ích với các trang phụ thuộc nhiều vào JS hoặc chặn các yêu cầu tìm nạp HTTP thông thường.

## Cài đặt plugin

Cài đặt plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Truy cập không cần khóa và khóa API

Firecrawl đăng ký hai nhà cung cấp `web_search`:

- **Firecrawl Search** (`firecrawl`) — sử dụng API `/v2/search` được lưu trữ cùng với
  khóa của bạn; được tự động phát hiện khi có khóa.
- **Firecrawl Search (Free)** (`firecrawl-free`) — sử dụng gói khởi đầu không cần khóa
  được lưu trữ, không yêu cầu khóa API. Gói này **chỉ được bật khi chủ động chọn** và không bao giờ được tự động chọn, vì
  việc chọn gói này sẽ gửi các truy vấn tìm kiếm của bạn đến gói miễn phí của Firecrawl.

Phương án dự phòng `web_fetch` của Firecrawl được chọn tường minh cũng không cần khóa. Các
công cụ `firecrawl_search` và `firecrawl_scrape` tường minh yêu cầu khóa API. Thêm
`FIRECRAWL_API_KEY` vào môi trường gateway hoặc cấu hình khóa này để có giới hạn cao hơn.

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

- Việc chọn Firecrawl trong quy trình thiết lập ban đầu hoặc `openclaw configure --section web` sẽ tự động bật plugin Firecrawl đã cài đặt.
- Chọn **Firecrawl Search (Free)** trong quy trình thiết lập ban đầu (hoặc đặt `provider: "firecrawl-free"`) để chạy không cần khóa API. Nhà cung cấp **Firecrawl Search** có khóa sẽ gửi `plugins.entries.firecrawl.config.webSearch.apiKey` hoặc `FIRECRAWL_API_KEY`.
- `web_search` với Firecrawl hỗ trợ `query` và `count`.
- Để sử dụng các tùy chọn điều khiển dành riêng cho Firecrawl như `sources`, `categories` hoặc thu thập dữ liệu từ kết quả, hãy dùng `firecrawl_search`.
- `baseUrl` mặc định sử dụng Firecrawl được lưu trữ tại `https://api.firecrawl.dev`. Chỉ được phép ghi đè bằng dịch vụ tự lưu trữ đối với các điểm cuối riêng tư/nội bộ; HTTP chỉ được chấp nhận cho các đích riêng tư đó.
- `FIRECRAWL_BASE_URL` là biến môi trường dự phòng dùng chung cho URL cơ sở của thao tác tìm kiếm và thu thập dữ liệu Firecrawl.
- Các yêu cầu tìm kiếm Firecrawl mặc định có thời gian chờ là 30 giây; tham số `timeoutSeconds` của `firecrawl_search` sẽ ghi đè giá trị này cho từng lần gọi.

## Cấu hình phương án dự phòng Firecrawl cho web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // lựa chọn tường minh sẽ bật phương án dự phòng không cần khóa
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
- Việc chọn Firecrawl trong quá trình thiết lập ban đầu hoặc `openclaw configure --section web` sẽ bật plugin và chọn Firecrawl cho `web_fetch`, trừ khi đã cấu hình một nhà cung cấp tìm nạp khác.
- `firecrawl_scrape` yêu cầu khóa API.
- `maxAgeMs` kiểm soát độ cũ tối đa của kết quả được lưu vào bộ nhớ đệm (ms). Giá trị mặc định là 172,800,000 ms (2 ngày).
- `onlyMainContent` mặc định là `true`; `timeoutSeconds` mặc định là 60.
- Cấu hình `tools.web.fetch.firecrawl.*` và `tools.web.search.firecrawl.*` cũ được `openclaw doctor --fix` tự động di chuyển.
- Các giá trị ghi đè URL cơ sở/thu thập dữ liệu của Firecrawl tuân theo cùng quy tắc dịch vụ được lưu trữ/riêng tư như tìm kiếm: lưu lượng được lưu trữ công khai sử dụng `https://api.firecrawl.dev`; các giá trị ghi đè tự lưu trữ phải phân giải thành điểm cuối riêng tư/nội bộ.
- `firecrawl_scrape` từ chối các URL đích rõ ràng là riêng tư, loopback, siêu dữ liệu và không phải HTTP(S) trước khi chuyển tiếp chúng đến Firecrawl, phù hợp với hợp đồng an toàn đích `web_fetch` dành cho các lệnh gọi thu thập dữ liệu Firecrawl tường minh.

`firecrawl_scrape` tái sử dụng cùng các thiết lập `plugins.entries.firecrawl.config.webFetch.*` và biến môi trường, bao gồm khóa API bắt buộc của nó.

### Firecrawl tự lưu trữ

Đặt `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` hoặc `FIRECRAWL_BASE_URL` khi bạn tự vận hành Firecrawl. OpenClaw chỉ chấp nhận `http://` cho các đích loopback, mạng riêng, `.local`, `.internal` hoặc `.localhost`. Các máy chủ tùy chỉnh công khai bị từ chối để tránh vô tình gửi khóa API Firecrawl đến các điểm cuối tùy ý.

## Công cụ plugin Firecrawl

### `firecrawl_search`

Sử dụng công cụ này khi bạn muốn các tùy chọn điều khiển tìm kiếm dành riêng cho Firecrawl thay vì `web_search` chung. Yêu cầu khóa API.

Tham số:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (chỉ tên máy chủ; loại trừ lẫn nhau)
- `tbs` (bộ lọc thời gian, ví dụ `qdr:d`, `qdr:w`, `sbd:1`)
- `location` và `country` (nhắm mục tiêu theo địa lý)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Sử dụng công cụ này cho các trang phụ thuộc nhiều vào JS hoặc được bảo vệ chống bot mà `web_fetch` thông thường xử lý không hiệu quả.

Tham số:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Chế độ ẩn mình / vượt qua cơ chế chống bot

`firecrawl_scrape` và phương án dự phòng Firecrawl `web_fetch` mặc định sử dụng `proxy: "auto"` cùng với `storeInCache: true`, trừ khi bên gọi ghi đè các tham số đó. `firecrawl_search` và nhà cung cấp Firecrawl `web_search` không có các tùy chọn điều khiển `proxy`/`storeInCache`; chế độ proxy ẩn mình chỉ áp dụng cho các yêu cầu thu thập/tìm nạp dữ liệu.

Chế độ `proxy` của Firecrawl kiểm soát việc vượt qua cơ chế chống bot (`basic`, `stealth` hoặc `auto`). `auto` thử lại bằng proxy ẩn mình nếu lần thử cơ bản thất bại, việc này có thể sử dụng nhiều tín dụng hơn so với chỉ thu thập dữ liệu cơ bản.

## Cách `web_fetch` sử dụng Firecrawl

Thứ tự trích xuất của `web_fetch`:

1. Readability (cục bộ)
2. Nhà cung cấp tìm nạp đã cấu hình, chẳng hạn như Firecrawl (khi được chọn hoặc tự động phát hiện từ thông tin xác thực đã cấu hình)
3. Dọn dẹp HTML cơ bản (phương án dự phòng cuối cùng)

Tùy chọn lựa chọn là `tools.web.fetch.provider`. Nếu bỏ qua tùy chọn này, OpenClaw sẽ tự động phát hiện nhà cung cấp tìm nạp web sẵn sàng đầu tiên từ thông tin xác thực hiện có. Plugin Firecrawl chính thức cung cấp phương án dự phòng đó.

## Liên quan

- [Tổng quan về Tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và cơ chế tự động phát hiện
- [Tìm nạp web](/vi/tools/web-fetch) -- công cụ web_fetch với phương án dự phòng Firecrawl
- [Tavily](/vi/tools/tavily) -- công cụ tìm kiếm + trích xuất
