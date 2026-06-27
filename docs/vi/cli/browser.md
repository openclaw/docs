---
read_when:
    - Bạn sử dụng `openclaw browser` và muốn có ví dụ cho các tác vụ phổ biến
    - Bạn muốn điều khiển một trình duyệt đang chạy trên máy khác thông qua một máy chủ Node
    - Bạn muốn kết nối với Chrome cục bộ đã đăng nhập của mình qua Chrome MCP
summary: Tham khảo CLI cho `openclaw browser` (vòng đời, hồ sơ, thẻ, hành động, trạng thái và gỡ lỗi)
title: Trình duyệt
x-i18n:
    generated_at: "2026-06-27T17:17:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Quản lý bề mặt điều khiển trình duyệt của OpenClaw và chạy các hành động trình duyệt (vòng đời, hồ sơ, thẻ, snapshot, ảnh chụp màn hình, điều hướng, nhập liệu, mô phỏng trạng thái và gỡ lỗi).

Liên quan:

- Công cụ trình duyệt + API: [Công cụ trình duyệt](/vi/tools/browser)

## Cờ thường dùng

- `--url <gatewayWsUrl>`: URL WebSocket của Gateway (mặc định lấy từ cấu hình).
- `--token <token>`: token Gateway (nếu cần).
- `--timeout <ms>`: thời gian chờ yêu cầu (ms).
- `--expect-final`: chờ phản hồi Gateway cuối cùng.
- `--browser-profile <name>`: chọn hồ sơ trình duyệt (mặc định lấy từ cấu hình).
- `--json`: đầu ra máy đọc được (ở nơi được hỗ trợ).

## Bắt đầu nhanh (cục bộ)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agent có thể chạy cùng kiểm tra sẵn sàng bằng `browser({ action: "doctor" })`.

## Khắc phục sự cố nhanh

Nếu `start` thất bại với `not reachable after start`, hãy khắc phục trạng thái sẵn sàng của CDP trước. Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt vẫn hoạt động bình thường và lỗi thường là do chính sách SSRF khi điều hướng.

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

- `doctor --deep` thêm một phép dò snapshot trực tiếp. Nó hữu ích khi trạng thái sẵn sàng CDP cơ bản
  đã xanh nhưng bạn muốn bằng chứng rằng thẻ hiện tại có thể được kiểm tra.
- Đối với hồ sơ `attachOnly` và CDP từ xa, `openclaw browser stop` đóng
  phiên điều khiển đang hoạt động và xóa các ghi đè mô phỏng tạm thời ngay cả khi
  OpenClaw không tự khởi chạy tiến trình trình duyệt.
- Đối với hồ sơ cục bộ được quản lý, `openclaw browser stop` dừng tiến trình trình duyệt
  đã được sinh ra.
- `openclaw browser start --headless` chỉ áp dụng cho yêu cầu start đó và
  chỉ khi OpenClaw khởi chạy trình duyệt cục bộ được quản lý. Nó không ghi lại
  `browser.headless` hay cấu hình hồ sơ, và không có tác dụng với trình duyệt
  đang chạy sẵn.
- Trên máy chủ Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, hồ sơ cục bộ được quản lý
  tự động chạy headless trừ khi `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false`, hoặc `browser.profiles.<name>.headless=false`
  yêu cầu rõ ràng một trình duyệt hiển thị.

## Nếu thiếu lệnh

Nếu `openclaw browser` là lệnh không xác định, hãy kiểm tra `plugins.allow` trong
`~/.openclaw/openclaw.json`.

Khi có `plugins.allow`, hãy liệt kê rõ Plugin trình duyệt tích hợp
trừ khi cấu hình đã có khối gốc `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Một khối gốc `browser` rõ ràng, ví dụ `browser.enabled=true` hoặc
`browser.profiles.<name>`, cũng kích hoạt Plugin trình duyệt tích hợp trong
allowlist Plugin hạn chế.

Liên quan: [Công cụ trình duyệt](/vi/tools/browser#missing-browser-command-or-tool)

## Hồ sơ

Hồ sơ là các cấu hình định tuyến trình duyệt có tên. Trong thực tế:

- `openclaw`: khởi chạy hoặc gắn vào một phiên bản Chrome chuyên dụng do OpenClaw quản lý (thư mục dữ liệu người dùng cô lập).
- `user`: điều khiển phiên Chrome hiện có đã đăng nhập của bạn thông qua Chrome DevTools MCP.
- hồ sơ CDP tùy chỉnh: trỏ tới một endpoint CDP cục bộ hoặc từ xa.

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

## Thẻ

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

`tabs` trả về `suggestedTargetId` trước, sau đó là `tabId` ổn định như `t1`,
nhãn tùy chọn, và `targetId` thô. Agent nên truyền
`suggestedTargetId` trở lại vào `focus`, `close`, snapshot và hành động. Bạn có thể
gán nhãn bằng `open --label`, `tab new --label`, hoặc `tab label`; nhãn,
id thẻ, id target thô, và tiền tố target-id duy nhất đều được chấp nhận.
Trường yêu cầu vẫn có tên `targetId` để tương thích, nhưng nó chấp nhận
các tham chiếu thẻ này. Hãy xem id target thô là tay cầm chẩn đoán, không phải
bộ nhớ agent bền vững.
Khi Chromium thay thế target thô bên dưới trong lúc điều hướng hoặc gửi biểu mẫu,
OpenClaw giữ `tabId`/nhãn ổn định gắn với thẻ thay thế
khi có thể chứng minh khớp. Id target thô vẫn dễ thay đổi; ưu tiên
`suggestedTargetId`.

## Snapshot / ảnh chụp màn hình / hành động

Snapshot:

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

- `--full-page` chỉ dành cho chụp trang; không thể kết hợp với `--ref`
  hoặc `--element`.
- Hồ sơ `existing-session` / `user` hỗ trợ ảnh chụp màn hình trang và ảnh chụp `--ref`
  từ đầu ra snapshot, nhưng không hỗ trợ ảnh chụp CSS `--element`.
- `--labels` phủ các ref snapshot hiện tại lên ảnh chụp màn hình. Trên
  hồ sơ dùng Playwright làm nền, nó hoạt động với `--full-page` (lớp phủ nhãn toàn trang),
  `--ref` (lớp phủ nhãn cắt theo phần tử bằng ref ARIA), và `--element`
  (lớp phủ nhãn cắt theo phần tử bằng bộ chọn CSS); trong các chế độ cắt theo phần tử, nhãn
  được chiếu tương đối với phần tử. Phản hồi cũng bao gồm một mảng
  `annotations` với hộp bao của từng ref. Mỗi mục có `ref`,
  `number`, `role`, `name` tùy chọn, và `box: {x, y, width, height}`;
  tọa độ nằm trong không gian của ảnh đã chụp (viewport / fullpage /
  tương đối với phần tử). Trường này bị bỏ qua khi rỗng.
  Hồ sơ `existing-session` hiển thị lớp phủ chrome-mcp trên ảnh chụp màn hình trang
  nhưng không dùng helper chiếu của Playwright và không bao gồm
  `annotations`; ảnh chụp CSS `--element` không được hỗ trợ ở đó. Không có
  Playwright hoặc chrome-mcp thì không có ảnh chụp màn hình có nhãn. Các bản phát hành trước
  đã bỏ qua `--full-page`, `--ref`, và `--element` trên ảnh chụp màn hình Playwright có nhãn
  và luôn trả về ảnh chụp viewport; ảnh chụp màn hình có nhãn hiện tôn trọng các phạm vi đó.
- `snapshot --urls` thêm các đích liên kết đã phát hiện vào snapshot AI để
  agent có thể chọn đích điều hướng trực tiếp thay vì chỉ đoán từ
  văn bản liên kết.

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` chấp nhận nguồn hàm, biểu thức, hoặc thân câu lệnh.
Thân câu lệnh được bọc thành hàm async, vì vậy hãy dùng `return` cho giá trị
bạn muốn nhận lại. Dùng `evaluate --timeout-ms <ms>` khi hàm phía trang có thể
cần lâu hơn thời gian chờ evaluate mặc định.

Phản hồi hành động trả về `targetId` thô hiện tại sau khi trang bị thay thế
do hành động kích hoạt, khi OpenClaw có thể chứng minh thẻ thay thế. Script vẫn nên
lưu và truyền `suggestedTargetId`/nhãn cho các quy trình chạy dài.

Helper tệp + hộp thoại:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Hồ sơ Chrome được quản lý lưu các bản tải xuống do nhấp thông thường kích hoạt vào thư mục
downloads của OpenClaw (`/tmp/openclaw/downloads` theo mặc định, hoặc temp root đã cấu hình).
Dùng `waitfordownload` hoặc `download` khi agent cần chờ một
tệp cụ thể và trả về đường dẫn của tệp đó; các bộ chờ rõ ràng đó sở hữu lần tải xuống kế tiếp.
Tải lên chấp nhận tệp từ temp uploads root của OpenClaw và media inbound
do OpenClaw quản lý, bao gồm tham chiếu `media://inbound/<id>` và tham chiếu
`media/inbound/<id>` tương đối với sandbox. Ref media lồng nhau, traversal, và đường dẫn
cục bộ tùy ý vẫn bị từ chối.
Khi một hành động mở hộp thoại modal, phản hồi hành động trả về
`blockedByDialog` cùng với `browserState.dialogs.pending`; truyền `--dialog-id` để
trả lời trực tiếp. Hộp thoại được xử lý bên ngoài OpenClaw xuất hiện dưới
`browserState.dialogs.recent`.

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

Dùng hồ sơ `user` tích hợp, hoặc tạo hồ sơ `existing-session` của riêng bạn:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Đường dẫn existing-session mặc định là tự động kết nối Chrome MCP chỉ trên máy chủ. Nếu trình duyệt đã
chạy với endpoint DevTools, hãy truyền `--cdp-url` để Chrome MCP gắn vào endpoint đó thay thế.
Đối với Docker, Browserless, hoặc các thiết lập từ xa khác nơi không cần ngữ nghĩa Chrome MCP, hãy dùng
hồ sơ CDP.

Giới hạn existing-session hiện tại:

- các hành động dựa trên ảnh chụp trạng thái sử dụng ref, không dùng bộ chọn CSS
- `browser.actionTimeoutMs` mặc định đặt các yêu cầu `act` được hỗ trợ thành 60000 ms khi
  bên gọi bỏ qua `timeoutMs`; `timeoutMs` theo từng lệnh gọi vẫn được ưu tiên.
- `click` chỉ là nhấp chuột trái
- `type` không hỗ trợ `slowly=true`
- `press` không hỗ trợ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, và `evaluate` từ chối
  ghi đè thời gian chờ theo từng lệnh gọi
- `select` chỉ hỗ trợ một giá trị
- `wait --load networkidle` không được hỗ trợ trên các hồ sơ phiên hiện có (hoạt động trên CDP được quản lý và thô/từ xa)
- tải tệp lên yêu cầu `--ref` / `--input-ref`, không hỗ trợ CSS
  `--element`, và hiện chỉ hỗ trợ một tệp mỗi lần
- hook hộp thoại không hỗ trợ `--timeout`
- ảnh chụp màn hình hỗ trợ chụp trang và `--ref`, nhưng không hỗ trợ CSS `--element`
- `responsebody`, chặn tải xuống, xuất PDF, và hành động hàng loạt vẫn
  yêu cầu một hồ sơ trình duyệt được quản lý hoặc CDP thô

## Điều khiển trình duyệt từ xa (proxy máy chủ node)

Nếu Gateway chạy trên một máy khác với trình duyệt, hãy chạy một **máy chủ node** trên máy có Chrome/Brave/Edge/Chromium. Gateway sẽ proxy các hành động trình duyệt đến node đó (không cần máy chủ điều khiển trình duyệt riêng).

Dùng `gateway.nodes.browser.mode` để kiểm soát tự động định tuyến và `gateway.nodes.browser.node` để ghim một node cụ thể nếu có nhiều node được kết nối.

Bảo mật + thiết lập từ xa: [Công cụ trình duyệt](/vi/tools/browser), [Truy cập từ xa](/vi/gateway/remote), [Tailscale](/vi/gateway/tailscale), [Bảo mật](/vi/gateway/security)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Trình duyệt](/vi/tools/browser)
