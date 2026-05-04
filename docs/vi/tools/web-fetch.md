---
read_when:
    - Bạn muốn tìm nạp một URL và trích xuất nội dung dễ đọc
    - Bạn cần cấu hình web_fetch hoặc phương án dự phòng Firecrawl của nó
    - Bạn muốn hiểu các giới hạn và cơ chế lưu vào bộ nhớ đệm của web_fetch
sidebarTitle: Web Fetch
summary: công cụ web_fetch -- tìm nạp HTTP với khả năng trích xuất nội dung dễ đọc
title: Tìm nạp web
x-i18n:
    generated_at: "2026-05-04T02:26:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

Công cụ `web_fetch` thực hiện HTTP GET thuần túy và trích xuất nội dung có thể đọc được
(HTML thành markdown hoặc văn bản). Công cụ này **không** thực thi JavaScript.

Đối với các trang dùng nhiều JS hoặc các trang được bảo vệ bằng đăng nhập, hãy dùng
[Trình duyệt Web](/vi/tools/browser) thay thế.

## Bắt đầu nhanh

`web_fetch` được **bật theo mặc định** -- không cần cấu hình. Agent có thể
gọi công cụ này ngay lập tức:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Tham số công cụ

<ParamField path="url" type="string" required>
URL cần tải. Chỉ `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Định dạng đầu ra sau khi trích xuất nội dung chính.
</ParamField>

<ParamField path="maxChars" type="number">
Cắt ngắn đầu ra xuống số ký tự này.
</ParamField>

## Cách hoạt động

<Steps>
  <Step title="Fetch">
    Gửi HTTP GET với User-Agent giống Chrome và header `Accept-Language`.
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
    tải lặp lại cùng một URL.
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

## Dự phòng Firecrawl

Nếu trích xuất Readability thất bại, `web_fetch` có thể chuyển sang dự phòng bằng
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
Cấu hình cũ `tools.web.fetch.firecrawl.*` được `openclaw doctor --fix` tự động di chuyển.

<Note>
  Nếu Firecrawl được bật và SecretRef của nó không được phân giải, đồng thời không có dự phòng env
  `FIRECRAWL_API_KEY`, Gateway sẽ khởi động thất bại nhanh.
</Note>

<Note>
  Các ghi đè `baseUrl` của Firecrawl bị khóa chặt: lưu lượng được lưu trữ dùng
  `https://api.firecrawl.dev`; ghi đè tự lưu trữ phải nhắm tới endpoint riêng tư hoặc
  nội bộ, và `http://` chỉ được chấp nhận cho các mục tiêu riêng tư đó.
</Note>

Hành vi runtime hiện tại:

- `tools.web.fetch.provider` chọn rõ ràng nhà cung cấp dự phòng cho việc tải.
- Nếu bỏ qua `provider`, OpenClaw tự động phát hiện nhà cung cấp web-fetch sẵn sàng đầu tiên
  từ các thông tin xác thực có sẵn. `web_fetch` không sandbox có thể dùng
  Plugin đã cài đặt khai báo `contracts.webFetchProviders` và đăng ký một
  nhà cung cấp khớp tại runtime. Hiện tại nhà cung cấp được đóng gói là Firecrawl.
- Các lệnh gọi `web_fetch` được sandbox vẫn bị giới hạn ở những nhà cung cấp được đóng gói.
- Nếu Readability bị tắt, `web_fetch` bỏ qua trực tiếp tới dự phòng
  nhà cung cấp đã chọn. Nếu không có nhà cung cấp nào khả dụng, công cụ sẽ thất bại theo hướng đóng.

## Proxy Env Tin cậy

Nếu bản triển khai của bạn yêu cầu `web_fetch` đi qua một proxy đi ra
HTTP(S) đáng tin cậy, hãy đặt `tools.web.fetch.useTrustedEnvProxy: true`.

Ở chế độ này, OpenClaw vẫn áp dụng kiểm tra SSRF dựa trên tên máy chủ trước khi gửi
yêu cầu, nhưng để proxy phân giải DNS thay vì thực hiện ghim DNS cục bộ.
Chỉ bật tùy chọn này khi proxy do người vận hành kiểm soát và thực thi
chính sách đi ra sau khi phân giải DNS.

<Note>
  Nếu không có biến env proxy HTTP(S) nào được cấu hình, hoặc máy chủ đích bị loại trừ bởi
  `NO_PROXY`, `web_fetch` sẽ quay về đường dẫn nghiêm ngặt thông thường với ghim DNS
  cục bộ.
</Note>

## Giới hạn và an toàn

- `maxChars` bị giới hạn ở `tools.web.fetch.maxCharsCap`
- Phần thân phản hồi bị giới hạn ở `maxResponseBytes` trước khi phân tích cú pháp; các
  phản hồi quá lớn sẽ bị cắt ngắn kèm cảnh báo
- Tên máy chủ riêng tư/nội bộ bị chặn
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` là các tùy chọn bật hẹp
  cho các ngăn xếp proxy IP giả đáng tin cậy; để chúng chưa đặt trừ khi proxy của bạn sở hữu
  các dải tổng hợp đó và thực thi chính sách đích riêng của nó
- Chuyển hướng được kiểm tra và giới hạn bởi `maxRedirects`
- `useTrustedEnvProxy` là một tùy chọn bật rõ ràng và chỉ nên được bật cho
  các proxy do người vận hành kiểm soát vẫn thực thi chính sách đi ra sau khi
  phân giải DNS
- `web_fetch` hoạt động theo nỗ lực tối đa -- một số trang cần [Trình duyệt Web](/vi/tools/browser)

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

- [Tìm kiếm Web](/vi/tools/web) -- tìm kiếm trên web với nhiều nhà cung cấp
- [Trình duyệt Web](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang dùng nhiều JS
- [Firecrawl](/vi/tools/firecrawl) -- công cụ tìm kiếm và thu thập Firecrawl
