---
read_when:
    - Bạn muốn truy xuất một URL và trích xuất nội dung dễ đọc
    - Bạn cần cấu hình web_fetch hoặc cơ chế dự phòng Firecrawl của nó
    - Bạn muốn hiểu các giới hạn của web_fetch và cơ chế lưu vào bộ nhớ đệm
sidebarTitle: Web Fetch
summary: Công cụ web_fetch -- tìm nạp HTTP với trích xuất nội dung dễ đọc
title: Tìm nạp web
x-i18n:
    generated_at: "2026-04-29T23:22:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

Công cụ `web_fetch` thực hiện HTTP GET thuần túy và trích xuất nội dung có thể đọc được
(HTML sang markdown hoặc văn bản). Nó **không** thực thi JavaScript.

Đối với các trang phụ thuộc nhiều vào JS hoặc các trang được bảo vệ bằng đăng nhập, hãy dùng
[Trình duyệt Web](/vi/tools/browser) thay thế.

## Bắt đầu nhanh

`web_fetch` được **bật theo mặc định** -- không cần cấu hình. Agent có thể
gọi ngay:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Tham số công cụ

<ParamField path="url" type="string" required>
URL cần fetch. Chỉ `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Định dạng đầu ra sau khi trích xuất nội dung chính.
</ParamField>

<ParamField path="maxChars" type="number">
Cắt ngắn đầu ra đến số ký tự này.
</ParamField>

## Cách hoạt động

<Steps>
  <Step title="Fetch">
    Gửi một HTTP GET với header User-Agent giống Chrome và `Accept-Language`.
    Chặn tên máy chủ riêng tư/nội bộ và kiểm tra lại các chuyển hướng.
  </Step>
  <Step title="Extract">
    Chạy Readability (trích xuất nội dung chính) trên phản hồi HTML.
  </Step>
  <Step title="Fallback (optional)">
    Nếu Readability thất bại và Firecrawl đã được cấu hình, thử lại thông qua
    API Firecrawl với chế độ né tránh bot.
  </Step>
  <Step title="Cache">
    Kết quả được lưu vào bộ nhớ đệm trong 15 phút (có thể cấu hình) để giảm số lần
    fetch lặp lại cùng một URL.
  </Step>
</Steps>

## Cấu hình

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Phương án dự phòng Firecrawl

Nếu trích xuất bằng Readability thất bại, `web_fetch` có thể chuyển sang dùng
[Firecrawl](/vi/tools/firecrawl) để né tránh bot và trích xuất tốt hơn:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` hỗ trợ các đối tượng SecretRef.
Cấu hình `tools.web.fetch.firecrawl.*` cũ được `openclaw doctor --fix` tự động di trú.

<Note>
  Nếu Firecrawl được bật và SecretRef của nó không được phân giải mà không có phương án dự phòng
  env `FIRECRAWL_API_KEY`, quá trình khởi động Gateway sẽ thất bại ngay.
</Note>

<Note>
  Các ghi đè Firecrawl `baseUrl` bị khóa chặt: chúng phải dùng `https://` và
  máy chủ Firecrawl chính thức (`api.firecrawl.dev`).
</Note>

Hành vi thời gian chạy hiện tại:

- `tools.web.fetch.provider` chọn rõ ràng nhà cung cấp dự phòng cho fetch.
- Nếu bỏ qua `provider`, OpenClaw tự động phát hiện nhà cung cấp web-fetch sẵn sàng đầu tiên
  từ thông tin xác thực có sẵn. Hiện nay nhà cung cấp đi kèm là Firecrawl.
- Nếu Readability bị tắt, `web_fetch` sẽ bỏ qua trực tiếp đến phương án dự phòng
  của nhà cung cấp đã chọn. Nếu không có nhà cung cấp nào khả dụng, nó sẽ thất bại đóng.

## Giới hạn và an toàn

- `maxChars` bị giới hạn theo `tools.web.fetch.maxCharsCap`
- Phần thân phản hồi bị giới hạn ở `maxResponseBytes` trước khi phân tích cú pháp; các phản hồi
  quá lớn sẽ bị cắt ngắn kèm cảnh báo
- Tên máy chủ riêng tư/nội bộ bị chặn
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` là các tùy chọn opt-in hẹp
  cho các ngăn xếp proxy IP giả đáng tin cậy; hãy để trống trừ khi proxy của bạn sở hữu
  các dải tổng hợp đó và thực thi chính sách đích riêng của nó
- Chuyển hướng được kiểm tra và giới hạn bởi `maxRedirects`
- `web_fetch` là nỗ lực tối đa -- một số trang cần [Trình duyệt Web](/vi/tools/browser)

## Hồ sơ công cụ

Nếu bạn dùng hồ sơ công cụ hoặc danh sách cho phép, hãy thêm `web_fetch` hoặc `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Liên quan

- [Tìm kiếm Web](/vi/tools/web) -- tìm kiếm web bằng nhiều nhà cung cấp
- [Trình duyệt Web](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang phụ thuộc nhiều vào JS
- [Firecrawl](/vi/tools/firecrawl) -- công cụ tìm kiếm và scrape của Firecrawl
