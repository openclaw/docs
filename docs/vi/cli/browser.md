---
read_when:
    - Bạn sử dụng `openclaw browser` và muốn xem ví dụ cho các tác vụ phổ biến
    - Bạn muốn điều khiển một trình duyệt đang chạy trên một máy khác thông qua một máy chủ Node
    - Bạn muốn kết nối vào Chrome cục bộ đã đăng nhập của mình thông qua Chrome MCP
summary: Tài liệu tham khảo CLI cho `openclaw browser` (vòng đời, hồ sơ, tab, hành động, trạng thái và gỡ lỗi)
title: Trình duyệt
x-i18n:
    generated_at: "2026-04-29T22:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Quản lý giao diện điều khiển trình duyệt của OpenClaw và chạy các thao tác trình duyệt (vòng đời, hồ sơ, tab, bản chụp, ảnh chụp màn hình, điều hướng, nhập liệu, mô phỏng trạng thái và gỡ lỗi).

Liên quan:

- Công cụ trình duyệt + API: [Công cụ trình duyệt](/vi/tools/browser)

## Cờ phổ biến

- `--url <gatewayWsUrl>`: URL WebSocket của Gateway (mặc định theo cấu hình).
- `--token <token>`: token Gateway (nếu bắt buộc).
- `--timeout <ms>`: thời gian chờ yêu cầu (ms).
- `--expect-final`: chờ phản hồi Gateway cuối cùng.
- `--browser-profile <name>`: chọn một hồ sơ trình duyệt (mặc định từ cấu hình).
- `--json`: đầu ra máy đọc được (khi được hỗ trợ).

## Bắt đầu nhanh (cục bộ)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agent có thể chạy cùng kiểm tra sẵn sàng bằng `browser({ action: "doctor" })`.

## Khắc phục sự cố nhanh

Nếu `start` thất bại với `not reachable after start`, hãy khắc phục trạng thái sẵn sàng CDP trước. Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt đang hoạt động bình thường và lỗi thường là do chính sách SSRF điều hướng.

Chuỗi tối thiểu:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Hướng dẫn chi tiết: [Khắc phục sự cố trình duyệt](/vi/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Vòng đời

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Ghi chú:

- `doctor --deep` thêm một phép thăm dò bản chụp trực tiếp. Điều này hữu ích khi trạng thái sẵn sàng CDP cơ bản đã xanh nhưng bạn muốn bằng chứng rằng tab hiện tại có thể được kiểm tra.
- Với hồ sơ `attachOnly` và CDP từ xa, `openclaw browser stop` đóng phiên điều khiển đang hoạt động và xóa các ghi đè mô phỏng tạm thời ngay cả khi OpenClaw không tự khởi chạy tiến trình trình duyệt.
- Với hồ sơ cục bộ do hệ thống quản lý, `openclaw browser stop` dừng tiến trình trình duyệt đã được sinh ra.
- `openclaw browser start --headless` chỉ áp dụng cho yêu cầu khởi động đó và chỉ khi OpenClaw khởi chạy một trình duyệt cục bộ do hệ thống quản lý. Nó không ghi lại `browser.headless` hoặc cấu hình hồ sơ, và không có tác dụng với trình duyệt đã đang chạy.
- Trên máy chủ Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, hồ sơ cục bộ do hệ thống quản lý tự động chạy headless trừ khi `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false`, hoặc `browser.profiles.<name>.headless=false` yêu cầu rõ ràng một trình duyệt hiển thị được.

## Nếu thiếu lệnh

Nếu `openclaw browser` là lệnh không xác định, hãy kiểm tra `plugins.allow` trong `~/.openclaw/openclaw.json`.

Khi có `plugins.allow`, hãy liệt kê rõ ràng Plugin trình duyệt đi kèm, trừ khi cấu hình đã có khối `browser` ở gốc:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Một khối `browser` rõ ràng ở gốc, ví dụ `browser.enabled=true` hoặc `browser.profiles.<name>`, cũng kích hoạt Plugin trình duyệt đi kèm trong một danh sách cho phép Plugin hạn chế.

Liên quan: [Công cụ trình duyệt](/vi/tools/browser#missing-browser-command-or-tool)

## Hồ sơ

Hồ sơ là các cấu hình định tuyến trình duyệt có tên. Trong thực tế:

- `openclaw`: khởi chạy hoặc gắn vào một phiên Chrome chuyên dụng do OpenClaw quản lý (thư mục dữ liệu người dùng tách biệt).
- `user`: điều khiển phiên Chrome hiện có đã đăng nhập của bạn thông qua Chrome DevTools MCP.
- hồ sơ CDP tùy chỉnh: trỏ tới một điểm cuối CDP cục bộ hoặc từ xa.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Dùng một hồ sơ cụ thể:

```bash
openclaw browser --browser-profile work tabs
```

## Tab

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` trả về `suggestedTargetId` trước, rồi đến `tabId` ổn định như `t1`, nhãn tùy chọn, và `targetId` thô. Agent nên truyền `suggestedTargetId` trở lại vào `focus`, `close`, bản chụp và thao tác. Bạn có thể gán nhãn bằng `open --label`, `tab new --label`, hoặc `tab label`; nhãn, id tab, id đích thô và tiền tố id đích duy nhất đều được chấp nhận. Khi Chromium thay thế đích thô bên dưới trong lúc điều hướng hoặc gửi biểu mẫu, OpenClaw giữ `tabId`/nhãn ổn định gắn với tab thay thế khi có thể chứng minh khớp. Id đích thô vẫn không ổn định; ưu tiên `suggestedTargetId`.

## Bản chụp / ảnh chụp màn hình / thao tác

Bản chụp:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Ảnh chụp màn hình:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Ghi chú:

- `--full-page` chỉ dành cho chụp trang; không thể kết hợp với `--ref` hoặc `--element`.
- Hồ sơ `existing-session` / `user` hỗ trợ ảnh chụp màn hình trang và ảnh chụp màn hình `--ref` từ đầu ra bản chụp, nhưng không hỗ trợ ảnh chụp màn hình CSS `--element`.
- `--labels` phủ các ref bản chụp hiện tại lên ảnh chụp màn hình.
- `snapshot --urls` thêm các đích liên kết đã phát hiện vào bản chụp AI để agent có thể chọn đích điều hướng trực tiếp thay vì chỉ đoán từ văn bản liên kết.

Điều hướng/nhấp/gõ (tự động hóa UI dựa trên ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Phản hồi thao tác trả về `targetId` thô hiện tại sau khi trang bị thay thế do thao tác kích hoạt, khi OpenClaw có thể chứng minh tab thay thế. Script vẫn nên lưu và truyền `suggestedTargetId`/nhãn cho các quy trình làm việc dài hạn.

Trình trợ giúp tệp + hộp thoại:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Hồ sơ Chrome do hệ thống quản lý lưu các bản tải xuống thông thường được kích hoạt bằng nhấp chuột vào thư mục tải xuống của OpenClaw (`/tmp/openclaw/downloads` theo mặc định, hoặc thư mục tạm gốc đã cấu hình). Dùng `waitfordownload` hoặc `download` khi agent cần chờ một tệp cụ thể và trả về đường dẫn của tệp đó; các trình chờ rõ ràng đó sở hữu bản tải xuống kế tiếp.

## Trạng thái và lưu trữ

Viewport + mô phỏng:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie + lưu trữ:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Gỡ lỗi

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome hiện có qua MCP

Dùng hồ sơ `user` tích hợp sẵn, hoặc tạo hồ sơ `existing-session` của riêng bạn:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Đường dẫn này chỉ dành cho máy chủ lưu trữ. Với Docker, máy chủ headless, Browserless hoặc các thiết lập từ xa khác, hãy dùng hồ sơ CDP thay thế.

Giới hạn hiện tại của existing-session:

- thao tác dựa trên bản chụp dùng ref, không dùng bộ chọn CSS
- `browser.actionTimeoutMs` đặt mặc định các yêu cầu `act` được hỗ trợ thành 60000 ms khi bên gọi bỏ qua `timeoutMs`; `timeoutMs` theo từng lệnh gọi vẫn được ưu tiên.
- `click` chỉ là nhấp chuột trái
- `type` không hỗ trợ `slowly=true`
- `press` không hỗ trợ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, và `evaluate` từ chối ghi đè thời gian chờ theo từng lệnh gọi
- `select` chỉ hỗ trợ một giá trị
- `wait --load networkidle` không được hỗ trợ
- tải tệp lên yêu cầu `--ref` / `--input-ref`, không hỗ trợ CSS `--element`, và hiện chỉ hỗ trợ một tệp mỗi lần
- hook hộp thoại không hỗ trợ `--timeout`
- ảnh chụp màn hình hỗ trợ chụp trang và `--ref`, nhưng không hỗ trợ CSS `--element`
- `responsebody`, chặn tải xuống, xuất PDF và thao tác hàng loạt vẫn yêu cầu trình duyệt do hệ thống quản lý hoặc hồ sơ CDP thô

## Điều khiển trình duyệt từ xa (proxy máy chủ Node)

Nếu Gateway chạy trên một máy khác với trình duyệt, hãy chạy một **máy chủ Node** trên máy có Chrome/Brave/Edge/Chromium. Gateway sẽ proxy các thao tác trình duyệt tới Node đó (không cần máy chủ điều khiển trình duyệt riêng).

Dùng `gateway.nodes.browser.mode` để điều khiển định tuyến tự động và `gateway.nodes.browser.node` để ghim một Node cụ thể nếu có nhiều Node được kết nối.

Bảo mật + thiết lập từ xa: [Công cụ trình duyệt](/vi/tools/browser), [Truy cập từ xa](/vi/gateway/remote), [Tailscale](/vi/gateway/tailscale), [Bảo mật](/vi/gateway/security)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Trình duyệt](/vi/tools/browser)
