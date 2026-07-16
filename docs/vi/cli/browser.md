---
read_when:
    - Bạn sử dụng `openclaw browser` và muốn xem các ví dụ về những tác vụ phổ biến
    - Bạn muốn điều khiển một trình duyệt đang chạy trên máy khác thông qua máy chủ Node
    - Bạn muốn kết nối với Chrome cục bộ đã đăng nhập của mình qua Chrome MCP
summary: Tài liệu tham khảo CLI cho `openclaw browser` (vòng đời, hồ sơ, tab, hành động, trạng thái và gỡ lỗi)
title: Trình duyệt
x-i18n:
    generated_at: "2026-07-16T14:12:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Quản lý bề mặt điều khiển trình duyệt của OpenClaw và chạy các thao tác trình duyệt: vòng đời, hồ sơ, tab, ảnh chụp trạng thái, ảnh chụp màn hình, điều hướng, nhập liệu, mô phỏng trạng thái và gỡ lỗi.

Liên quan: [Công cụ trình duyệt](/vi/tools/browser)

## Các cờ thường dùng

- `--url <gatewayWsUrl>`: URL WebSocket của Gateway (mặc định lấy từ cấu hình).
- `--token <token>`: token Gateway (nếu bắt buộc).
- `--timeout <ms>`: thời gian chờ yêu cầu tính bằng ms (mặc định: `30000`).
- `--expect-final`: chờ phản hồi cuối cùng từ Gateway.
- `--browser-profile <name>`: chọn hồ sơ trình duyệt (mặc định: `openclaw`, hoặc `browser.defaultProfile`).
- `--json`: đầu ra có thể đọc bằng máy (ở nơi được hỗ trợ). Đây là tùy chọn cấp trình duyệt, vì vậy
  hãy đặt tùy chọn này trước lệnh con để có dạng rõ ràng, chẳng hạn như
  `openclaw browser --json status`. Cách đặt ở cuối như
  `openclaw browser status --json` cũng hoạt động khi lệnh con đã chọn không
  định nghĩa `--json` riêng.

## Bắt đầu nhanh (cục bộ)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agent có thể chạy cùng phép kiểm tra mức độ sẵn sàng bằng `browser({ action: "doctor" })`.

## Khắc phục sự cố nhanh

Nếu `start` thất bại với `not reachable after start`, trước tiên hãy khắc phục sự cố về mức độ sẵn sàng của CDP. Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt vẫn hoạt động bình thường và lỗi thường do chính sách SSRF chặn điều hướng.

Trình tự tối thiểu:

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

- `doctor --deep` bổ sung phép thăm dò ảnh chụp trạng thái trực tiếp: hữu ích khi mức độ sẵn sàng cơ bản của CDP đang ở trạng thái tốt nhưng bạn muốn có bằng chứng rằng tab hiện tại có thể được kiểm tra.
- Đối với hồ sơ cục bộ được quản lý đang chạy, `status` và `doctor` báo cáo thông tin chẩn đoán
  đồ họa được lưu đệm từ Chrome: phân loại phần cứng/phần mềm, trình kết xuất,
  backend, thiết bị/trình điều khiển, chi tiết tính năng và trạng thái bị vô hiệu hóa, cùng các
  khả năng video tăng tốc. `openclaw browser --json status` trả về toàn bộ tải trọng có cấu trúc.
  Trạng thái thụ động không bao giờ khởi chạy Chrome chỉ để thu thập các thông tin này.
- `stop` đóng phiên điều khiển đang hoạt động và xóa các tùy chỉnh mô phỏng tạm thời ngay cả đối với `attachOnly` và các hồ sơ CDP từ xa mà OpenClaw không tự khởi chạy tiến trình trình duyệt. Đối với hồ sơ cục bộ được quản lý, `stop` cũng dừng tiến trình trình duyệt đã được tạo.
- `start --headless` chỉ áp dụng cho yêu cầu khởi động đó và chỉ khi OpenClaw khởi chạy một trình duyệt cục bộ được quản lý. Tùy chọn này không ghi lại `browser.headless` hoặc cấu hình hồ sơ và không có tác dụng đối với trình duyệt đang chạy.
- Trên các máy chủ Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, hồ sơ cục bộ được quản lý tự động chạy ở chế độ không giao diện, trừ khi `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` hoặc `browser.profiles.<name>.headless=false` yêu cầu rõ ràng một trình duyệt hiển thị.

## Nếu thiếu lệnh

Nếu `openclaw browser` là lệnh không xác định, hãy kiểm tra `plugins.allow` trong `~/.openclaw/openclaw.json`. Khi có `plugins.allow`, hãy liệt kê rõ Plugin trình duyệt đi kèm, trừ khi cấu hình đã có khối `browser` ở cấp gốc:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Khối `browser` rõ ràng ở cấp gốc (ví dụ `browser.enabled=true` hoặc `browser.profiles.<name>`) cũng kích hoạt Plugin trình duyệt đi kèm trong danh sách cho phép Plugin hạn chế.

Liên quan: [Công cụ trình duyệt](/vi/tools/browser#missing-browser-command-or-tool)

## Hồ sơ

Hồ sơ là các cấu hình định tuyến trình duyệt có tên:

- `openclaw` (mặc định): khởi chạy hoặc kết nối với một phiên bản Chrome chuyên dụng do OpenClaw quản lý (thư mục dữ liệu người dùng biệt lập).
- `user`: điều khiển phiên Chrome hiện có mà bạn đã đăng nhập thông qua Chrome DevTools MCP.
- hồ sơ CDP tùy chỉnh: trỏ đến điểm cuối CDP cục bộ hoặc từ xa.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Sử dụng một hồ sơ cụ thể với `--browser-profile <name>` trên bất kỳ lệnh con nào, ví dụ `openclaw browser --browser-profile work tabs`.

Trên macOS, `system-profiles` liệt kê các hồ sơ Chrome, Brave, Edge hoặc Chromium thực có trên máy chủ. `import-profile` giải mã cookie của chúng sau một lời nhắc đồng ý từ macOS Keychain/Touch ID và đưa chúng vào một hồ sơ mới do OpenClaw quản lý. Tính năng này chỉ nhập cookie; bộ nhớ cục bộ và IndexedDB không thay đổi. Một số phiên Google sử dụng thông tin xác thực phiên ràng buộc với thiết bị (DBSC) và vẫn có thể yêu cầu xác thực lại sau khi nhập.

Khi ứng dụng macOS sử dụng Gateway cục bộ, ứng dụng có thể đề xuất thao tác nhập này một lần và đặt hồ sơ nhập biệt lập làm mặc định cho hoạt động duyệt web của agent. Việc nhập luôn yêu cầu một lần nhấp rõ ràng; nhập thành công hoặc đóng lời nhắc sẽ ngăn các lời nhắc tự động sau đó, và **Settings → General → Browser login** vẫn khả dụng để nhập lại.

Tính năng nhập hồ sơ hệ thống được bật theo mặc định. Đặt `browser.allowSystemProfileImport=false` để tắt cả thao tác nhập do CLI và agent kích hoạt. Việc nhập chỉ diễn ra cục bộ trên máy chủ và không thể chạy qua proxy Node trình duyệt.

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

`tabs` trả về `suggestedTargetId` trước, sau đó là `tabId` ổn định (chẳng hạn `t1`), nhãn tùy chọn và `targetId` thô. Truyền lại `suggestedTargetId` vào `focus`, `close`, ảnh chụp trạng thái và các thao tác. Gán nhãn bằng `open --label`, `tab new --label` hoặc `tab label`; nhãn, ID tab, ID đích thô và tiền tố ID đích duy nhất đều được chấp nhận. Trường yêu cầu vẫn có tên `targetId` để tương thích, nhưng chấp nhận bất kỳ tham chiếu tab nào trong số này.

ID đích thô là các định danh chẩn đoán không ổn định, không phải bộ nhớ lâu dài của agent: khi Chromium thay thế đích thô bên dưới trong quá trình điều hướng hoặc gửi biểu mẫu, OpenClaw giữ `tabId`/nhãn ổn định gắn với tab thay thế khi có thể chứng minh sự khớp. Nên dùng `suggestedTargetId`.

## Ảnh chụp trạng thái / ảnh chụp màn hình / thao tác

Ảnh chụp trạng thái:

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

- `--full-page` chỉ dành cho ảnh chụp trang; không thể kết hợp với `--ref` hoặc `--element`.
- Các hồ sơ `existing-session` / `user` hỗ trợ ảnh chụp màn hình trang và ảnh chụp màn hình `--ref` từ đầu ra ảnh chụp trạng thái, nhưng không hỗ trợ ảnh chụp màn hình `--element` CSS.
- `--labels` phủ các tham chiếu ảnh chụp trạng thái hiện tại lên ảnh chụp màn hình. Trên các hồ sơ dựa trên Playwright, tùy chọn này hoạt động với `--full-page` (lớp phủ toàn trang), `--ref` (lớp phủ vùng cắt phần tử theo tham chiếu ARIA) và `--element` (lớp phủ vùng cắt phần tử theo bộ chọn CSS); trong các chế độ cắt phần tử, nhãn được chiếu tương đối so với phần tử. Phản hồi cũng bao gồm một mảng `annotations` (bị lược bỏ khi trống) chứa hộp giới hạn của từng tham chiếu: `ref`, `number`, `role`, `name` tùy chọn và `box: {x, y, width, height}` trong không gian tọa độ của ảnh đã chụp (khung nhìn / toàn trang / tương đối theo phần tử).
  Các hồ sơ `existing-session` kết xuất lớp phủ chrome-mcp trên ảnh chụp màn hình trang nhưng không sử dụng trình trợ giúp chiếu Playwright và không bao gồm `annotations`; ảnh chụp màn hình `--element` CSS không được hỗ trợ tại đó. Nếu không có Playwright hoặc chrome-mcp, ảnh chụp màn hình có nhãn sẽ không khả dụng.
- `snapshot --urls` nối thêm các đích liên kết đã phát hiện vào ảnh chụp trạng thái AI để agent có thể chọn đích điều hướng trực tiếp thay vì chỉ đoán từ văn bản liên kết.

Điều hướng/nhấp/nhập (tự động hóa giao diện dựa trên tham chiếu):

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

`evaluate --fn` chấp nhận mã nguồn hàm, biểu thức hoặc thân câu lệnh. Thân câu lệnh được bọc dưới dạng hàm bất đồng bộ, vì vậy hãy dùng `return` cho giá trị bạn muốn nhận lại. Dùng `--timeout-ms` khi hàm phía trang có thể cần nhiều thời gian hơn thời gian chờ đánh giá mặc định. `browser.evaluateEnabled=false` (mặc định: `true`) vô hiệu hóa cả `evaluate` và `wait --fn`.

Phản hồi thao tác trả về `targetId` thô hiện tại sau khi trang bị thay thế do thao tác kích hoạt, khi OpenClaw có thể chứng minh tab thay thế. Tập lệnh vẫn nên lưu trữ và truyền `suggestedTargetId`/nhãn cho các quy trình dài hạn.

Trình trợ giúp tệp + hộp thoại:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Các hồ sơ Chrome được quản lý lưu những tệp tải xuống thông thường do thao tác nhấp kích hoạt vào thư mục tải xuống của OpenClaw (mặc định là `/tmp/openclaw/downloads`, hoặc thư mục gốc tạm thời đã cấu hình). Dùng `waitfordownload` hoặc `download` khi agent cần chờ một tệp cụ thể và trả về đường dẫn của tệp đó; các trình chờ rõ ràng này sở hữu lượt tải xuống tiếp theo. Thao tác tải lên chấp nhận tệp từ thư mục gốc tải lên tạm thời của OpenClaw và phương tiện đầu vào do OpenClaw quản lý, bao gồm các tham chiếu `media://inbound/<id>` và `media/inbound/<id>` tương đối với sandbox. Các tham chiếu phương tiện lồng nhau, thao tác duyệt xuyên thư mục và đường dẫn cục bộ tùy ý đều bị từ chối.

Khi một thao tác mở hộp thoại phương thức, phản hồi thao tác trả về `blockedByDialog` cùng với `browserState.dialogs.pending`; truyền `--dialog-id` để trả lời trực tiếp. Các hộp thoại được xử lý bên ngoài OpenClaw xuất hiện dưới `browserState.dialogs.recent`.

## Trạng thái và bộ nhớ

Khung nhìn + mô phỏng:

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

Cookie + bộ nhớ:

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

Sử dụng hồ sơ `user` tích hợp sẵn hoặc tạo hồ sơ `existing-session` của riêng bạn:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Đường dẫn phiên hiện có mặc định là chế độ tự động kết nối Chrome MCP chỉ trên máy chủ. Nếu trình duyệt đã chạy với một điểm cuối DevTools, hãy truyền `--cdp-url` để Chrome MCP kết nối với điểm cuối đó. Đối với Docker, Browserless hoặc các thiết lập từ xa khác không cần ngữ nghĩa Chrome MCP, hãy sử dụng hồ sơ CDP thay thế.

Các giới hạn hiện tại của phiên hiện có:

- Các thao tác dựa trên ảnh chụp nhanh sử dụng tham chiếu, không sử dụng bộ chọn CSS.
- `browser.actionTimeoutMs` đặt mặc định các yêu cầu `act` được hỗ trợ thành 60000 ms khi bên gọi bỏ qua `timeoutMs`; `timeoutMs` theo từng lần gọi vẫn được ưu tiên.
- `click` chỉ hỗ trợ nhấp chuột trái.
- `type` không hỗ trợ `slowly=true`.
- `press` không hỗ trợ `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` và `fill` từ chối ghi đè thời gian chờ theo từng lần gọi; `evaluate` chấp nhận `--timeout-ms`.
- `select` chỉ hỗ trợ một giá trị.
- `wait --load networkidle` không được hỗ trợ (hoạt động trên các hồ sơ CDP được quản lý và CDP thô/từ xa).
- Việc tải tệp lên yêu cầu `--ref` / `--input-ref`, không hỗ trợ `--element` CSS và chỉ hỗ trợ mỗi lần một tệp.
- Các hook hộp thoại không hỗ trợ `--timeout`.
- Ảnh chụp màn hình hỗ trợ chụp trang và `--ref`, nhưng không hỗ trợ `--element` CSS.
- `responsebody`, chặn tải xuống, xuất PDF và các thao tác hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

## Điều khiển trình duyệt từ xa (proxy máy chủ node)

Nếu Gateway chạy trên một máy khác với trình duyệt, hãy chạy một **máy chủ node** trên máy có Chrome/Brave/Edge/Chromium. Gateway chuyển tiếp các thao tác trình duyệt đến node đó; không cần máy chủ điều khiển trình duyệt riêng biệt.

Sử dụng `gateway.nodes.browser.mode` để kiểm soát định tuyến tự động và `gateway.nodes.browser.node` để ghim một node cụ thể nếu có nhiều node được kết nối.

Bảo mật + thiết lập từ xa: [Công cụ trình duyệt](/vi/tools/browser), [Truy cập từ xa](/vi/gateway/remote), [Tailscale](/vi/gateway/tailscale), [Bảo mật](/vi/gateway/security)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Trình duyệt](/vi/tools/browser)
