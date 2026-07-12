---
read_when:
    - Bạn muốn truy xuất một URL và trích xuất nội dung dễ đọc
    - Bạn cần cấu hình `web_fetch` hoặc phương án dự phòng Firecrawl của công cụ này
    - Bạn muốn tìm hiểu các giới hạn và cơ chế lưu vào bộ nhớ đệm của web_fetch
sidebarTitle: Web Fetch
summary: Công cụ web_fetch -- tìm nạp qua HTTP và trích xuất nội dung dễ đọc
title: Tìm nạp web
x-i18n:
    generated_at: "2026-07-12T08:32:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` thực hiện một yêu cầu HTTP GET thuần túy và trích xuất nội dung có thể đọc được (HTML thành
markdown hoặc văn bản). Công cụ này **không** thực thi JavaScript. Đối với các trang sử dụng nhiều JS hoặc
được bảo vệ bằng đăng nhập, hãy sử dụng [Trình duyệt web](/vi/tools/browser) thay thế.

## Bắt đầu nhanh

Được bật theo mặc định, không cần cấu hình:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Tham số công cụ

<ParamField path="url" type="string" required>
URL cần truy xuất. Chỉ hỗ trợ `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Định dạng đầu ra sau khi trích xuất nội dung chính.
</ParamField>

<ParamField path="maxChars" type="number">
Cắt ngắn đầu ra còn số ký tự này. Bị giới hạn ở `tools.web.fetch.maxCharsCap`.
</ParamField>

## Cách hoạt động

<Steps>
  <Step title="Truy xuất">
    Gửi một yêu cầu HTTP GET với User-Agent giống Chrome và tiêu đề
    `Accept-Language`. Chặn tên máy chủ riêng/nội bộ và kiểm tra lại các chuyển hướng.
  </Step>
  <Step title="Trích xuất">
    Chạy Readability (trích xuất nội dung chính) trên phản hồi HTML.
  </Step>
  <Step title="Phương án dự phòng (tùy chọn)">
    Nếu Readability thất bại và có nhà cung cấp truy xuất khả dụng, thử lại thông qua
    nhà cung cấp đó (ví dụ: chế độ vượt cơ chế chống bot của Firecrawl).
  </Step>
  <Step title="Bộ nhớ đệm">
    Kết quả được lưu vào bộ nhớ đệm trong 15 phút (có thể cấu hình) để giảm số lần
    truy xuất lặp lại cùng một URL.
  </Step>
</Steps>

## Cập nhật tiến trình

`web_fetch` chỉ phát một dòng tiến trình công khai khi việc truy xuất vẫn đang chờ
sau năm giây:

```text
Đang truy xuất nội dung trang...
```

Các lần trúng bộ nhớ đệm nhanh và phản hồi mạng nhanh sẽ hoàn tất trước khi bộ hẹn giờ kích hoạt, vì vậy
chúng không bao giờ hiển thị dòng tiến trình. Việc hủy lệnh gọi sẽ xóa bộ hẹn giờ. Dòng
tiến trình chỉ là trạng thái giao diện người dùng của kênh và không bao giờ chứa nội dung trang đã truy xuất.

## Cấu hình

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // mặc định: true
        provider: "firecrawl", // tùy chọn; bỏ qua để tự động phát hiện
        maxChars: 20000, // số ký tự đầu ra mặc định; bị giới hạn bởi maxCharsCap
        maxCharsCap: 20000, // giới hạn cứng cho tham số maxChars
        maxResponseBytes: 750000, // kích thước tải xuống tối đa trước khi cắt ngắn (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // cho phép proxy môi trường HTTP(S) đáng tin cậy phân giải DNS
        readability: true, // sử dụng trích xuất Readability
        userAgent: "Mozilla/5.0 ...", // ghi đè User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // chủ động bật cho proxy IP giả đáng tin cậy sử dụng 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // chủ động bật cho proxy IP giả đáng tin cậy sử dụng fc00::/7
        },
      },
    },
  },
}
```

## Phương án dự phòng Firecrawl

Nếu việc trích xuất bằng Readability thất bại, `web_fetch` có thể dùng
[Firecrawl](/vi/tools/firecrawl) làm phương án dự phòng để vượt cơ chế chống bot và trích xuất tốt hơn:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // tùy chọn; bỏ qua để tự động phát hiện từ thông tin xác thực khả dụng
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // tùy chọn; bỏ qua để sử dụng quyền truy cập khởi đầu không cần khóa
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // thời lượng bộ nhớ đệm (2 ngày)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` là tùy chọn và hỗ trợ các đối tượng SecretRef.
Cấu hình `tools.web.fetch.firecrawl.*` cũ được tự động di chuyển sang
`plugins.entries.firecrawl.config.webFetch` thông qua `openclaw doctor --fix`.

<Note>
  Nếu bạn cấu hình SecretRef cho khóa API Firecrawl nhưng không thể phân giải và không có
  biến môi trường `FIRECRAWL_API_KEY` dự phòng, quá trình khởi động Gateway sẽ thất bại ngay lập tức.
</Note>

<Note>
  Các giá trị ghi đè `baseUrl` của Firecrawl bị kiểm soát chặt chẽ: lưu lượng đến dịch vụ lưu trữ sử dụng
  `https://api.firecrawl.dev`; các giá trị ghi đè tự lưu trữ phải nhắm đến điểm cuối riêng hoặc
  nội bộ, và `http://` chỉ được chấp nhận cho các đích riêng đó.
</Note>

Hành vi thời gian chạy hiện tại:

- `tools.web.fetch.provider` chọn rõ ràng nhà cung cấp truy xuất dự phòng.
- Nếu bỏ qua `provider`, OpenClaw tự động phát hiện nhà cung cấp truy xuất web
  sẵn sàng đầu tiên từ thông tin xác thực đã cấu hình. `web_fetch` không nằm trong sandbox có thể sử dụng
  các plugin đã cài đặt khai báo `contracts.webFetchProviders` và đăng ký một
  nhà cung cấp tương ứng trong thời gian chạy. Plugin Firecrawl chính thức hiện cung cấp
  phương án dự phòng này.
- Các lệnh gọi `web_fetch` trong sandbox cho phép các nhà cung cấp đi kèm cùng với các nhà cung cấp đã cài đặt
  có nguồn gốc npm chính thức hoặc ClawHub đã được xác minh. Hiện tại, điều này cho phép
  Plugin Firecrawl chính thức; các plugin truy xuất bên ngoài của bên thứ ba vẫn bị loại trừ.
- Nếu Readability bị tắt, `web_fetch` chuyển thẳng sang nhà cung cấp
  dự phòng đã chọn. Nếu không có nhà cung cấp nào khả dụng, công cụ sẽ từ chối thực hiện.

## Proxy môi trường đáng tin cậy

Nếu hoạt động triển khai của bạn yêu cầu `web_fetch` đi qua proxy HTTP(S)
đầu ra đáng tin cậy, hãy đặt `tools.web.fetch.useTrustedEnvProxy: true`.

Trong chế độ này, OpenClaw vẫn áp dụng kiểm tra SSRF dựa trên tên máy chủ trước khi gửi
yêu cầu, nhưng cho phép proxy phân giải DNS thay vì ghim DNS
cục bộ. Chỉ bật tính năng này khi proxy do đơn vị vận hành kiểm soát và thực thi
chính sách đầu ra sau khi phân giải DNS.

<Note>
  Nếu không có biến môi trường proxy HTTP(S) nào được cấu hình hoặc máy chủ đích bị loại trừ bởi
  `NO_PROXY`, `web_fetch` sẽ quay lại đường dẫn nghiêm ngặt thông thường với cơ chế ghim DNS
  cục bộ.
</Note>

## Giới hạn và an toàn

- `maxChars` bị giới hạn ở `tools.web.fetch.maxCharsCap` (mặc định `20000`)
- Nội dung phản hồi bị giới hạn ở `maxResponseBytes` (mặc định `750000`, được giới hạn trong
  khoảng 32000-10000000) trước khi phân tích; phản hồi quá lớn sẽ bị cắt ngắn kèm cảnh báo
- Tên máy chủ riêng/nội bộ bị chặn
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` là các tùy chọn bật có phạm vi hẹp
  dành cho ngăn xếp proxy IP giả đáng tin cậy; hãy để chúng không được thiết lập trừ khi proxy của bạn sở hữu
  các dải tổng hợp đó và thực thi chính sách đích riêng
- Các chuyển hướng được kiểm tra và giới hạn bởi `maxRedirects` (mặc định `3`)
- `useTrustedEnvProxy` là tùy chọn chủ động bật rõ ràng và chỉ nên được bật cho
  các proxy do đơn vị vận hành kiểm soát, vẫn thực thi chính sách đầu ra sau khi phân giải
  DNS
- `web_fetch` hoạt động theo nguyên tắc nỗ lực tối đa -- một số trang web cần [Trình duyệt web](/vi/tools/browser)

## Hồ sơ công cụ

Nếu bạn sử dụng hồ sơ công cụ hoặc danh sách cho phép, hãy thêm `web_fetch` hoặc `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // hoặc: allow: ["group:web"]  (bao gồm web_fetch, web_search và x_search)
  },
}
```

## Liên quan

- [Tìm kiếm web](/vi/tools/web) -- tìm kiếm trên web bằng nhiều nhà cung cấp
- [Trình duyệt web](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang sử dụng nhiều JS
- [Firecrawl](/vi/tools/firecrawl) -- các công cụ tìm kiếm và thu thập dữ liệu của Firecrawl
