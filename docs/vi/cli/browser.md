---
read_when:
    - Bạn sử dụng `openclaw browser` và muốn xem các ví dụ cho những tác vụ phổ biến
    - Bạn muốn điều khiển trình duyệt đang chạy trên một máy khác thông qua máy chủ Node
    - Bạn muốn kết nối với Chrome cục bộ đã đăng nhập của mình qua Chrome MCP
summary: Tài liệu tham khảo CLI cho `openclaw browser` (vòng đời, hồ sơ, tab, hành động, trạng thái và gỡ lỗi)
title: Trình duyệt
x-i18n:
    generated_at: "2026-07-20T04:34:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1cb233c5060c19120ab24b13e166cbd40035c81e6dd6ef0e70a4877a852f3b9a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Quản lý bề mặt điều khiển trình duyệt của OpenClaw và chạy các thao tác trình duyệt: vòng đời, hồ sơ, tab, bản chụp, ảnh chụp màn hình, điều hướng, nhập liệu, mô phỏng trạng thái và gỡ lỗi.

Liên quan: [Công cụ trình duyệt](/vi/tools/browser)

## Các cờ thường dùng

- `--url <gatewayWsUrl>`: URL WebSocket của Gateway (mặc định lấy từ cấu hình).
- `--token <token>`: token Gateway (nếu được yêu cầu).
- `--timeout <ms>`: thời gian chờ yêu cầu tính bằng ms (mặc định: `30000`).
- `--expect-final`: chờ phản hồi cuối cùng từ Gateway.
- `--browser-profile <name>`: chọn một hồ sơ trình duyệt (mặc định: `openclaw` hoặc `browser.defaultProfile`).
- `--json`: đầu ra có thể đọc bằng máy (ở những nơi được hỗ trợ). Đây là tùy chọn ở cấp trình duyệt, vì vậy
  hãy đặt nó trước lệnh con để có dạng rõ ràng, chẳng hạn như
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

Các tác nhân có thể chạy cùng phép kiểm tra mức độ sẵn sàng bằng `browser({ action: "doctor" })`.

## Khắc phục sự cố nhanh

Nếu `start` thất bại với `not reachable after start`, trước tiên hãy khắc phục sự cố về mức độ sẵn sàng của CDP. Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt vẫn hoạt động bình thường và lỗi thường là do chính sách SSRF chặn điều hướng.

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

- `doctor --deep` bổ sung một phép thăm dò bản chụp trực tiếp: hữu ích khi mức độ sẵn sàng CDP cơ bản hiển thị tốt nhưng bạn muốn có bằng chứng rằng tab hiện tại có thể được kiểm tra.
- Đối với một hồ sơ cục bộ được quản lý đang chạy, `status` và `doctor` báo cáo dữ liệu chẩn đoán
  đồ họa được lưu vào bộ nhớ đệm từ Chrome: phân loại phần cứng/phần mềm, trình kết xuất,
  phần phụ trợ, thiết bị/trình điều khiển, chi tiết tính năng và trạng thái vô hiệu hóa, cùng các
  khả năng video tăng tốc. `openclaw browser --json status` trả về toàn bộ tải trọng có cấu trúc.
  Trạng thái thụ động không bao giờ khởi chạy Chrome chỉ để thu thập các dữ kiện này.
- `stop` đóng phiên điều khiển đang hoạt động và xóa các ghi đè mô phỏng tạm thời ngay cả đối với `attachOnly` và các hồ sơ CDP từ xa mà OpenClaw không tự khởi chạy tiến trình trình duyệt. Đối với các hồ sơ cục bộ được quản lý, `stop` cũng dừng tiến trình trình duyệt đã được tạo.
- `start --headless` chỉ áp dụng cho yêu cầu khởi động đó và chỉ khi OpenClaw khởi chạy một trình duyệt cục bộ được quản lý. Nó không ghi lại `browser.headless` hoặc cấu hình hồ sơ và không có tác dụng đối với trình duyệt đang chạy.
- Trên các máy chủ Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, các hồ sơ cục bộ được quản lý tự động chạy ở chế độ không giao diện, trừ khi `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` hoặc `browser.profiles.<name>.headless=false` yêu cầu rõ ràng một trình duyệt hiển thị.

## Nếu lệnh không tồn tại

Nếu `openclaw browser` là một lệnh không xác định, hãy kiểm tra `plugins.allow` trong `~/.openclaw/openclaw.json`. Khi có `plugins.allow`, hãy liệt kê rõ Plugin trình duyệt đi kèm, trừ khi cấu hình đã có khối `browser` ở cấp gốc:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Một khối `browser` ở cấp gốc được khai báo rõ ràng (ví dụ `browser.enabled=true` hoặc `browser.profiles.<name>`) cũng kích hoạt Plugin trình duyệt đi kèm khi áp dụng danh sách cho phép Plugin hạn chế.

Liên quan: [Công cụ trình duyệt](/vi/tools/browser#missing-browser-command-or-tool)

## Hồ sơ

Hồ sơ là các cấu hình định tuyến trình duyệt có tên:

- `openclaw` (mặc định): khởi chạy hoặc đính kèm vào một phiên bản Chrome chuyên dụng do OpenClaw quản lý (thư mục dữ liệu người dùng biệt lập).
- `user`: điều khiển phiên Chrome hiện có mà bạn đã đăng nhập thông qua Chrome DevTools MCP.
- hồ sơ CDP tùy chỉnh: trỏ đến một điểm cuối CDP cục bộ hoặc từ xa.

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

Sử dụng một hồ sơ cụ thể bằng `--browser-profile <name>` với bất kỳ lệnh con nào, ví dụ `openclaw browser --browser-profile work tabs`.

Trên macOS, `system-profiles` liệt kê các hồ sơ Chrome, Brave, Edge hoặc Chromium thực có sẵn trên máy chủ. `import-profile` giải mã cookie của chúng sau một lời nhắc đồng ý qua macOS Keychain/Touch ID và chèn cookie vào một hồ sơ mới do OpenClaw quản lý. Lệnh này chỉ nhập cookie; bộ nhớ cục bộ và IndexedDB không thay đổi. Một số phiên Google sử dụng thông tin xác thực phiên gắn với thiết bị (DBSC) và vẫn có thể yêu cầu xác thực lại sau khi nhập.

Khi ứng dụng macOS sử dụng Gateway cục bộ, ứng dụng có thể đề nghị nhập một lần và đặt hồ sơ nhập biệt lập làm mặc định cho hoạt động duyệt web của tác nhân. Việc nhập luôn yêu cầu một thao tác nhấp rõ ràng; nhập thành công hoặc bỏ qua sẽ ngăn các lời nhắc tự động về sau, và **Settings → General → Browser login** vẫn có sẵn để nhập lại.

Tính năng nhập hồ sơ hệ thống được bật theo mặc định. Đặt `browser.allowSystemProfileImport=false` để tắt cả thao tác nhập do CLI và tác nhân kích hoạt. Việc nhập chỉ diễn ra cục bộ trên máy chủ và không thể chạy qua proxy Node của trình duyệt.

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

`tabs` trả về `suggestedTargetId` trước, sau đó là `tabId` ổn định (chẳng hạn như `t1`), nhãn tùy chọn và `targetId` thô. Truyền `suggestedTargetId` trở lại `focus`, `close`, các bản chụp và các thao tác. Gán nhãn bằng `open --label`, `tab new --label` hoặc `tab label`; nhãn, ID tab, ID đích thô và tiền tố ID đích duy nhất đều được chấp nhận. Trường yêu cầu vẫn có tên `targetId` để tương thích, nhưng chấp nhận bất kỳ tham chiếu tab nào trong số này.

ID đích thô là các định danh chẩn đoán không ổn định, không phải bộ nhớ tác nhân lâu dài: khi Chromium thay thế đích thô nền tảng trong quá trình điều hướng hoặc gửi biểu mẫu, OpenClaw giữ `tabId`/nhãn ổn định gắn với tab thay thế khi có thể xác minh sự trùng khớp. Ưu tiên `suggestedTargetId`.

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

- `--full-page` chỉ dành cho ảnh chụp trang; không thể kết hợp với `--ref` hoặc `--element`.
- Các hồ sơ `existing-session` / `user` hỗ trợ ảnh chụp màn hình trang và ảnh chụp màn hình `--ref` từ đầu ra bản chụp, nhưng không hỗ trợ ảnh chụp màn hình `--element` CSS.
- `--labels` phủ các tham chiếu của bản chụp hiện tại lên ảnh chụp màn hình. Trên các hồ sơ dựa trên Playwright, tính năng này hoạt động với `--full-page` (lớp phủ toàn trang), `--ref` (lớp phủ vùng cắt phần tử theo tham chiếu ARIA) và `--element` (lớp phủ vùng cắt phần tử theo bộ chọn CSS); trong các chế độ vùng cắt phần tử, nhãn được chiếu tương đối so với phần tử. Phản hồi cũng bao gồm một mảng `annotations` (bị lược bỏ khi trống) chứa hộp giới hạn của từng tham chiếu: `ref`, `number`, `role`, `name` tùy chọn và `box: {x, y, width, height}` trong không gian tọa độ của ảnh được chụp (khung nhìn / toàn trang / tương đối với phần tử).
  Các hồ sơ `existing-session` kết xuất lớp phủ chrome-mcp trên ảnh chụp màn hình trang nhưng không sử dụng trình trợ giúp chiếu Playwright và không bao gồm `annotations`; ảnh chụp màn hình `--element` CSS không được hỗ trợ ở đó. Nếu không có Playwright hoặc chrome-mcp, ảnh chụp màn hình có nhãn sẽ không khả dụng.
- `snapshot --urls` nối thêm các đích liên kết được phát hiện vào bản chụp AI để tác nhân có thể chọn đích điều hướng trực tiếp thay vì chỉ đoán từ văn bản liên kết.

Điều hướng/nhấp/nhập (tự động hóa giao diện người dùng dựa trên tham chiếu):

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

`evaluate --fn` chấp nhận mã nguồn hàm, biểu thức hoặc thân câu lệnh. Thân câu lệnh được bọc thành hàm bất đồng bộ, vì vậy hãy dùng `return` cho giá trị bạn muốn nhận lại. Dùng `--timeout-ms` khi hàm phía trang có thể cần nhiều thời gian hơn thời gian chờ đánh giá mặc định. `browser.evaluateEnabled=false` (mặc định: `true`) vô hiệu hóa cả `evaluate` và `wait --fn`.

Phản hồi thao tác trả về `targetId` thô hiện tại sau khi trang bị thay thế do thao tác kích hoạt, nếu OpenClaw có thể xác minh tab thay thế. Các tập lệnh vẫn nên lưu và truyền `suggestedTargetId`/nhãn cho quy trình làm việc dài hạn.

Trình trợ giúp tệp + hộp thoại:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Các hồ sơ Chrome được quản lý lưu những tệp tải xuống thông thường do thao tác nhấp kích hoạt vào thư mục tải xuống của OpenClaw (`/tmp/openclaw/downloads` theo mặc định hoặc thư mục tạm gốc đã cấu hình). Dùng `waitfordownload` hoặc `download` khi tác nhân cần chờ một tệp cụ thể và trả về đường dẫn của tệp; các trình chờ tường minh này sở hữu lượt tải xuống tiếp theo. Thao tác tải lên chấp nhận tệp từ thư mục tải lên tạm thời gốc của OpenClaw và nội dung đa phương tiện đầu vào do OpenClaw quản lý, bao gồm các tham chiếu `media://inbound/<id>` và `media/inbound/<id>` tương đối với sandbox. Các tham chiếu nội dung đa phương tiện lồng nhau, thao tác duyệt xuyên thư mục và đường dẫn cục bộ tùy ý đều bị từ chối.

Khi một thao tác mở hộp thoại phương thức, phản hồi thao tác trả về `blockedByDialog` cùng với `browserState.dialogs.pending`; truyền `--dialog-id` để phản hồi trực tiếp. Các hộp thoại được xử lý bên ngoài OpenClaw xuất hiện trong `browserState.dialogs.recent`.

## Trạng thái và lưu trữ

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

Đường dẫn existing-session mặc định là tính năng tự động kết nối Chrome MCP chỉ dành cho máy chủ. Nếu trình duyệt đã chạy với một điểm cuối DevTools, hãy truyền `--cdp-url` để Chrome MCP kết nối với điểm cuối đó. Đối với Docker, Browserless hoặc các thiết lập từ xa khác không cần ngữ nghĩa Chrome MCP, hãy sử dụng hồ sơ CDP thay thế.

Các giới hạn hiện tại của existing-session:

- Các thao tác dựa trên ảnh chụp nhanh sử dụng tham chiếu, không dùng bộ chọn CSS.
- Các yêu cầu `act` được hỗ trợ sử dụng giá trị mặc định tích hợp là 60000 ms khi bên gọi bỏ qua `timeoutMs`; `timeoutMs` theo từng lệnh gọi vẫn được ưu tiên.
- `click` chỉ hỗ trợ nhấp chuột trái.
- `type` không hỗ trợ `slowly=true`.
- `press` không hỗ trợ `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` và `fill` từ chối ghi đè thời gian chờ theo từng lệnh gọi; `evaluate` chấp nhận `--timeout-ms`.
- `select` chỉ hỗ trợ một giá trị.
- `wait --load networkidle` không được hỗ trợ (hoạt động trên các hồ sơ CDP được quản lý và CDP thô/từ xa).
- Tải tệp lên yêu cầu `--ref` / `--input-ref`, không hỗ trợ `--element` CSS và chỉ hỗ trợ một tệp mỗi lần.
- Các hook hộp thoại không hỗ trợ `--timeout`.
- Ảnh chụp màn hình hỗ trợ chụp trang và `--ref`, nhưng không hỗ trợ `--element` CSS.
- `responsebody`, chặn tải xuống, xuất PDF và các thao tác hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

## Điều khiển trình duyệt từ xa (proxy máy chủ node)

Nếu Gateway chạy trên máy khác với trình duyệt, hãy chạy một **máy chủ node** trên máy có Chrome/Brave/Edge/Chromium. Gateway chuyển tiếp các thao tác trình duyệt đến node đó; không cần máy chủ điều khiển trình duyệt riêng.

Sử dụng `gateway.nodes.browser.mode` để điều khiển định tuyến tự động và `gateway.nodes.browser.node` để ghim một node cụ thể nếu có nhiều node được kết nối.

Thiết lập bảo mật + từ xa: [Công cụ trình duyệt](/vi/tools/browser), [Truy cập từ xa](/vi/gateway/remote), [Tailscale](/vi/gateway/tailscale), [Bảo mật](/vi/gateway/security)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Trình duyệt](/vi/tools/browser)
