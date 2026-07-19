---
read_when:
    - Bạn muốn truy xuất một URL và trích xuất nội dung dễ đọc
    - Bạn cần cấu hình web_fetch hoặc phương án dự phòng Firecrawl của nó
    - Bạn muốn tìm hiểu các giới hạn và cơ chế lưu vào bộ nhớ đệm của web_fetch
sidebarTitle: Web Fetch
summary: Công cụ web_fetch -- tìm nạp HTTP với tính năng trích xuất nội dung dễ đọc
title: Tìm nạp từ web
x-i18n:
    generated_at: "2026-07-19T06:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ddf312245064672dcf489e8714740fa3e034827e16b33be8fb6a87db04f19ef8
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` thực hiện một yêu cầu HTTP GET thông thường và trích xuất nội dung dễ đọc (HTML thành
markdown hoặc văn bản). Công cụ này **không** thực thi JavaScript. Đối với các trang phụ thuộc nhiều vào JS hoặc
các trang được bảo vệ bằng đăng nhập, hãy dùng [Trình duyệt web](/vi/tools/browser).

## Bắt đầu nhanh

Được bật theo mặc định, không cần cấu hình:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Tham số công cụ

<ParamField path="url" type="string" required>
URL cần truy xuất. Chỉ `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Định dạng đầu ra sau khi trích xuất nội dung chính.
</ParamField>

<ParamField path="maxChars" type="number">
Cắt ngắn đầu ra còn số ký tự này. Được giới hạn ở `tools.web.fetch.maxCharsCap`.
</ParamField>

## Kết quả

`web_fetch` trả về một kết quả có cấu trúc khép kín với các trường sau:

- Siêu dữ liệu yêu cầu: `url`, `finalUrl`, `status`, `extractMode` và `extractor`
- Siêu dữ liệu phản hồi tùy chọn: `contentType`, `title` và `warning` (được bỏ qua khi không có)
- Siêu dữ liệu nội dung đã bọc: `externalContent`, `truncated`, `length`, `rawLength`,
  `fetchedAt`, `tookMs` và `text`
- `cached: true` tùy chọn khi truy cập bộ nhớ đệm thành công
- `spill: { path, chars, truncated? }` tùy chọn khi nội dung bị cắt ngắn được ghi
  vào một tệp tạm thời riêng tư; `truncated` chỉ xuất hiện khi tệp đó chứa
  một phần nội dung nguồn

`length` là độ dài `text` đã bọc. `rawLength` là độ dài nội dung được trích xuất
trước khi bọc nội dung bên ngoài.

## Cách hoạt động

<Steps>
  <Step title="Truy xuất">
    Gửi một yêu cầu HTTP GET với User-Agent giống Chrome và header `Accept-Language`.
    Chặn tên máy chủ riêng tư/nội bộ và kiểm tra lại các chuyển hướng.
  </Step>
  <Step title="Trích xuất">
    Chạy Readability (trích xuất nội dung chính) trên phản hồi HTML.
  </Step>
  <Step title="Phương án dự phòng (tùy chọn)">
    Nếu Readability thất bại và có nhà cung cấp truy xuất khả dụng, thử lại thông qua
    nhà cung cấp đó (ví dụ: chế độ tránh bot của Firecrawl).
  </Step>
  <Step title="Bộ nhớ đệm">
    Kết quả được lưu vào bộ nhớ đệm trong 15 phút (có thể cấu hình) để giảm số lần
    truy xuất lặp lại cùng một URL.
  </Step>
</Steps>

## Cập nhật tiến trình

`web_fetch` chỉ phát ra một dòng tiến trình công khai khi yêu cầu truy xuất vẫn đang chờ xử lý
sau năm giây:

```text
Đang truy xuất nội dung trang...
```

Các lần truy cập bộ nhớ đệm nhanh và phản hồi mạng nhanh hoàn tất trước khi bộ hẹn giờ kích hoạt, vì vậy
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
        readability: true, // sử dụng tính năng trích xuất Readability
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

Nếu quá trình trích xuất bằng Readability thất bại, `web_fetch` có thể chuyển sang
[Firecrawl](/vi/tools/firecrawl) để tránh bot và trích xuất tốt hơn:

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
            // apiKey: "fc-...", // tùy chọn; bỏ qua để dùng quyền truy cập khởi đầu không cần khóa
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
Cấu hình `tools.web.fetch.firecrawl.*` cũ tự động di chuyển sang
`plugins.entries.firecrawl.config.webFetch` thông qua `openclaw doctor --fix`.

<Note>
  Nếu bạn cấu hình SecretRef cho khóa API Firecrawl nhưng tham chiếu này không được phân giải và không có
  biến môi trường `FIRECRAWL_API_KEY` dự phòng, quá trình khởi động Gateway sẽ thất bại ngay lập tức.
</Note>

<Note>
  Các giá trị ghi đè `baseUrl` của Firecrawl bị giới hạn nghiêm ngặt: lưu lượng được lưu trữ sử dụng
  `https://api.firecrawl.dev`; các giá trị ghi đè tự lưu trữ phải nhắm đến điểm cuối riêng tư hoặc
  nội bộ, và `http://` chỉ được chấp nhận cho các đích riêng tư đó.
</Note>

Hành vi runtime hiện tại:

- `tools.web.fetch.provider` chọn rõ ràng nhà cung cấp dự phòng cho hoạt động truy xuất.
- Nếu bỏ qua `provider`, OpenClaw tự động phát hiện nhà cung cấp truy xuất web sẵn sàng đầu tiên
  từ thông tin xác thực đã cấu hình. `web_fetch` không nằm trong sandbox có thể sử dụng
  các plugin đã cài đặt khai báo `contracts.webFetchProviders` và đăng ký một
  nhà cung cấp tương ứng tại runtime. Plugin Firecrawl chính thức hiện cung cấp
  phương án dự phòng này.
- Các lệnh gọi `web_fetch` trong sandbox cho phép các nhà cung cấp đi kèm cùng các nhà cung cấp đã cài đặt
  có nguồn gốc npm chính thức hoặc ClawHub đã được xác minh. Hiện tại, điều này cho phép
  plugin Firecrawl chính thức; các plugin truy xuất bên ngoài của bên thứ ba vẫn bị loại trừ.
- Nếu Readability bị tắt, `web_fetch` chuyển thẳng sang phương án dự phòng của
  nhà cung cấp đã chọn. Nếu không có nhà cung cấp nào khả dụng, lệnh gọi sẽ thất bại theo cơ chế đóng an toàn.

## Proxy môi trường đáng tin cậy

Nếu quá trình triển khai yêu cầu `web_fetch` đi qua một proxy HTTP(S) đầu ra
đáng tin cậy, hãy đặt `tools.web.fetch.useTrustedEnvProxy: true`.

Trong chế độ này, OpenClaw vẫn áp dụng các bước kiểm tra SSRF dựa trên tên máy chủ trước khi gửi
yêu cầu, nhưng cho phép proxy phân giải DNS thay vì ghim DNS cục bộ.
Chỉ bật chế độ này khi proxy do đơn vị vận hành kiểm soát và thực thi
chính sách đầu ra sau khi phân giải DNS.

<Note>
  Nếu không có biến môi trường proxy HTTP(S) nào được cấu hình hoặc máy chủ đích bị loại trừ bởi
  `NO_PROXY`, `web_fetch` chuyển về đường dẫn nghiêm ngặt thông thường với cơ chế ghim DNS
  cục bộ.
</Note>

## Giới hạn và an toàn

- `maxChars` được giới hạn ở `tools.web.fetch.maxCharsCap` (mặc định `20000`)
- Nội dung phản hồi bị giới hạn ở `maxResponseBytes` (mặc định `750000`, được giới hạn trong
  32000-10000000) trước khi phân tích cú pháp; các phản hồi quá lớn bị cắt ngắn kèm cảnh báo
- Tên máy chủ riêng tư/nội bộ bị chặn
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` là các tùy chọn chủ động bật có phạm vi hẹp
  dành cho ngăn xếp proxy IP giả đáng tin cậy; không đặt chúng trừ khi proxy của bạn sở hữu
  các dải tổng hợp đó và thực thi chính sách đích riêng
- Các chuyển hướng được kiểm tra và giới hạn bởi `maxRedirects` (mặc định `3`)
- `useTrustedEnvProxy` là một tùy chọn chủ động bật rõ ràng và chỉ nên được bật cho
  các proxy do đơn vị vận hành kiểm soát, vẫn thực thi chính sách đầu ra sau khi phân giải
  DNS
- `web_fetch` hoạt động theo nỗ lực tối đa -- một số trang cần [Trình duyệt web](/vi/tools/browser)

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
- [Trình duyệt web](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang phụ thuộc nhiều vào JS
- [Firecrawl](/vi/tools/firecrawl) -- các công cụ tìm kiếm và thu thập dữ liệu của Firecrawl
