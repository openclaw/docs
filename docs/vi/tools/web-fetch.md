---
read_when:
    - Bạn muốn tìm nạp một URL và trích xuất nội dung dễ đọc
    - Bạn cần cấu hình web_fetch hoặc phương án dự phòng Firecrawl của nó
    - Bạn muốn hiểu các giới hạn và bộ nhớ đệm của web_fetch
sidebarTitle: Web Fetch
summary: công cụ web_fetch -- truy xuất HTTP với trích xuất nội dung dễ đọc
title: Tìm nạp web
x-i18n:
    generated_at: "2026-06-27T18:20:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

Công cụ `web_fetch` thực hiện HTTP GET thuần và trích xuất nội dung dễ đọc
(HTML sang markdown hoặc văn bản). Công cụ này **không** thực thi JavaScript.

Đối với các trang phụ thuộc nhiều vào JS hoặc các trang được bảo vệ bằng đăng nhập, hãy dùng
[Trình duyệt Web](/vi/tools/browser) thay thế.

## Bắt đầu nhanh

`web_fetch` được **bật theo mặc định** -- không cần cấu hình. Agent có thể
gọi công cụ này ngay:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Tham số công cụ

<ParamField path="url" type="string" required>
URL cần tìm nạp. Chỉ `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Định dạng đầu ra sau khi trích xuất nội dung chính.
</ParamField>

<ParamField path="maxChars" type="number">
Cắt ngắn đầu ra còn số ký tự này.
</ParamField>

## Cách hoạt động

<Steps>
  <Step title="Tìm nạp">
    Gửi HTTP GET với User-Agent giống Chrome và header `Accept-Language`.
    Chặn tên máy chủ riêng tư/nội bộ và kiểm tra lại các chuyển hướng.
  </Step>
  <Step title="Trích xuất">
    Chạy Readability (trích xuất nội dung chính) trên phản hồi HTML.
  </Step>
  <Step title="Dự phòng (tùy chọn)">
    Nếu Readability thất bại và Firecrawl được chọn, thử lại qua
    Firecrawl API với chế độ vượt né bot.
  </Step>
  <Step title="Bộ nhớ đệm">
    Kết quả được lưu vào bộ nhớ đệm trong 15 phút (có thể cấu hình) để giảm
    số lần tìm nạp lặp lại cùng một URL.
  </Step>
</Steps>

## Cập nhật tiến trình

`web_fetch` chỉ phát một dòng tiến trình công khai khi lượt tìm nạp vẫn đang chờ
sau năm giây:

```text
Fetching page content...
```

Các lần trúng bộ nhớ đệm nhanh và phản hồi mạng nhanh sẽ hoàn tất trước khi bộ hẹn giờ kích hoạt, nên
chúng không hiển thị dòng tiến trình. Nếu lệnh gọi bị hủy, bộ hẹn giờ sẽ được xóa.
Khi lượt tìm nạp cuối cùng hoàn tất, agent nhận kết quả công cụ bình thường;
dòng tiến trình chỉ là trạng thái giao diện kênh và không bao giờ chứa nội dung
trang đã tìm nạp.

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

Nếu trích xuất Readability thất bại, `web_fetch` có thể dự phòng sang
[Firecrawl](/vi/tools/firecrawl) để vượt né bot và trích xuất tốt hơn:

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` là tùy chọn và hỗ trợ các đối tượng SecretRef.
Cấu hình `tools.web.fetch.firecrawl.*` cũ được tự động di chuyển bởi `openclaw doctor --fix`.

<Note>
  Nếu bạn cấu hình SecretRef khóa API Firecrawl và khóa đó không được phân giải mà không có
  dự phòng env `FIRECRAWL_API_KEY`, Gateway sẽ khởi động thất bại nhanh.
</Note>

<Note>
  Các ghi đè `baseUrl` của Firecrawl được khóa chặt: lưu lượng được lưu trữ dùng
  `https://api.firecrawl.dev`; các ghi đè tự lưu trữ phải trỏ tới endpoint riêng tư hoặc
  nội bộ, và `http://` chỉ được chấp nhận cho những đích riêng tư đó.
</Note>

Hành vi runtime hiện tại:

- `tools.web.fetch.provider` chọn rõ ràng provider dự phòng tìm nạp.
- Nếu bỏ qua `provider`, OpenClaw tự động phát hiện provider web-fetch sẵn sàng đầu tiên
  từ thông tin xác thực đã cấu hình. `web_fetch` không sandbox có thể dùng
  các Plugin đã cài đặt khai báo `contracts.webFetchProviders` và đăng ký
  provider khớp tại runtime. Plugin Firecrawl chính thức cung cấp
  dự phòng này.
- Các lệnh gọi `web_fetch` sandbox cho phép provider được đóng gói kèm cùng các provider đã cài đặt
  có nguồn gốc npm chính thức hoặc ClawHub đã được xác minh. Hiện tại điều đó cho phép
  Plugin Firecrawl chính thức; các Plugin tìm nạp bên ngoài của bên thứ ba vẫn bị loại trừ.
- Nếu Readability bị tắt, `web_fetch` bỏ qua thẳng tới
  dự phòng provider đã chọn. Nếu không có provider nào khả dụng, công cụ sẽ thất bại theo hướng đóng an toàn.

## Proxy env tin cậy

Nếu triển khai của bạn yêu cầu `web_fetch` đi qua một proxy HTTP(S) đi ra
tin cậy, hãy đặt `tools.web.fetch.useTrustedEnvProxy: true`.

Trong chế độ này, OpenClaw vẫn áp dụng các kiểm tra SSRF dựa trên tên máy chủ trước khi gửi
yêu cầu, nhưng cho phép proxy phân giải DNS thay vì thực hiện ghim DNS cục bộ.
Chỉ bật tùy chọn này khi proxy do operator kiểm soát và thực thi
chính sách đi ra sau khi phân giải DNS.

<Note>
  Nếu không có biến env proxy HTTP(S) nào được cấu hình, hoặc máy chủ đích bị loại trừ bởi
  `NO_PROXY`, `web_fetch` sẽ quay về đường dẫn nghiêm ngặt bình thường với
  ghim DNS cục bộ.
</Note>

## Giới hạn và an toàn

- `maxChars` bị giới hạn ở `tools.web.fetch.maxCharsCap`
- Phần thân phản hồi bị giới hạn ở `maxResponseBytes` trước khi phân tích; các phản hồi
  quá lớn bị cắt ngắn kèm cảnh báo
- Tên máy chủ riêng tư/nội bộ bị chặn
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` là các tùy chọn opt-in hẹp
  cho các ngăn xếp proxy IP giả tin cậy; hãy để chúng chưa đặt trừ khi proxy của bạn sở hữu
  các dải tổng hợp đó và thực thi chính sách đích riêng
- Chuyển hướng được kiểm tra và bị giới hạn bởi `maxRedirects`
- `useTrustedEnvProxy` là opt-in rõ ràng và chỉ nên được bật cho
  các proxy do operator kiểm soát vẫn thực thi chính sách đi ra sau khi
  phân giải DNS
- `web_fetch` hoạt động theo nỗ lực tốt nhất -- một số trang cần [Trình duyệt Web](/vi/tools/browser)

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

- [Tìm kiếm Web](/vi/tools/web) -- tìm kiếm web bằng nhiều provider
- [Trình duyệt Web](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang phụ thuộc nhiều vào JS
- [Firecrawl](/vi/tools/firecrawl) -- công cụ tìm kiếm và scrape của Firecrawl
