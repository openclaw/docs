---
read_when:
    - Viết kịch bản hoặc gỡ lỗi trình duyệt tác nhân qua API điều khiển cục bộ
    - Đang tìm tài liệu tham chiếu CLI `openclaw browser`
    - Thêm tự động hóa trình duyệt tùy chỉnh với snapshot và refs
summary: API điều khiển trình duyệt OpenClaw, tài liệu tham khảo CLI và các hành động viết tập lệnh
title: API điều khiển trình duyệt
x-i18n:
    generated_at: "2026-05-02T10:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

Để thiết lập, cấu hình và khắc phục sự cố, xem [Trình duyệt](/vi/tools/browser).
Trang này là tài liệu tham khảo cho API HTTP điều khiển cục bộ, CLI `openclaw browser`
và các mẫu kịch bản (ảnh chụp nhanh, ref, chờ, luồng gỡ lỗi).

## API Điều khiển (tùy chọn)

Chỉ dành cho tích hợp cục bộ, Gateway cung cấp một API HTTP loopback nhỏ:

- Trạng thái/khởi động/dừng: `GET /`, `POST /start`, `POST /stop`
- Thẻ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Ảnh chụp nhanh/ảnh chụp màn hình: `GET /snapshot`, `POST /screenshot`
- Hành động: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Tải xuống: `POST /download`, `POST /wait/download`
- Quyền: `POST /permissions/grant`
- Gỡ lỗi: `GET /console`, `POST /pdf`
- Gỡ lỗi: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Mạng: `POST /response/body`
- Trạng thái: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Trạng thái: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Cài đặt: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tất cả endpoint chấp nhận `?profile=<name>`. `POST /start?headless=true` yêu cầu
một lần khởi chạy headless duy nhất cho các hồ sơ được quản lý cục bộ mà không thay đổi
cấu hình trình duyệt đã lưu; các hồ sơ chỉ gắn kèm, CDP từ xa và phiên hiện có sẽ từ chối
ghi đè đó vì OpenClaw không khởi chạy các tiến trình trình duyệt đó.

Nếu xác thực Gateway bằng bí mật dùng chung được cấu hình, các route HTTP của trình duyệt cũng yêu cầu xác thực:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` hoặc xác thực HTTP Basic với mật khẩu đó

Ghi chú:

- API trình duyệt loopback độc lập này **không** sử dụng header danh tính trusted-proxy hoặc
  Tailscale Serve.
- Nếu `gateway.auth.mode` là `none` hoặc `trusted-proxy`, các route trình duyệt loopback
  này không kế thừa các chế độ mang danh tính đó; hãy giữ chúng chỉ trên loopback.

### Hợp đồng lỗi `/act`

`POST /act` dùng phản hồi lỗi có cấu trúc cho lỗi xác thực ở cấp route và
lỗi chính sách:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Các giá trị `code` hiện tại:

- `ACT_KIND_REQUIRED` (HTTP 400): thiếu hoặc không nhận diện được `kind`.
- `ACT_INVALID_REQUEST` (HTTP 400): payload hành động không chuẩn hóa hoặc xác thực được.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` được dùng với loại hành động không được hỗ trợ.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (hoặc `wait --fn`) bị cấu hình tắt.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` cấp cao nhất hoặc theo lô xung đột với đích yêu cầu.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): hành động không được hỗ trợ cho hồ sơ phiên hiện có.

Các lỗi runtime khác vẫn có thể trả về `{ "error": "<message>" }` mà không có trường
`code`.

### Yêu cầu Playwright

Một số tính năng (điều hướng/hành động/ảnh chụp nhanh AI/ảnh chụp nhanh vai trò, ảnh chụp màn hình phần tử,
PDF) yêu cầu Playwright. Nếu chưa cài Playwright, các endpoint đó trả về
lỗi 501 rõ ràng.

Những tính năng vẫn hoạt động không cần Playwright:

- Ảnh chụp nhanh ARIA
- Ảnh chụp nhanh trợ năng kiểu vai trò (`--interactive`, `--compact`,
  `--depth`, `--efficient`) khi có WebSocket CDP theo từng thẻ. Đây là
  phương án dự phòng để kiểm tra và khám phá ref; Playwright vẫn là công cụ
  hành động chính.
- Ảnh chụp màn hình trang cho trình duyệt `openclaw` được quản lý khi có
  WebSocket CDP theo từng thẻ
- Ảnh chụp màn hình trang cho hồ sơ `existing-session` / Chrome MCP
- Ảnh chụp màn hình dựa trên ref của `existing-session` (`--ref`) từ đầu ra ảnh chụp nhanh

Những tính năng vẫn cần Playwright:

- `navigate`
- `act`
- Ảnh chụp nhanh AI phụ thuộc vào định dạng ảnh chụp nhanh AI gốc của Playwright
- Ảnh chụp màn hình phần tử bằng CSS selector (`--element`)
- xuất PDF toàn bộ trình duyệt

Ảnh chụp màn hình phần tử cũng từ chối `--full-page`; route trả về `fullPage is
not supported for element screenshots`.

Nếu bạn thấy `Playwright is not available in this gateway build`, Gateway đã đóng gói
thiếu phụ thuộc runtime trình duyệt lõi. Cài đặt lại hoặc cập nhật
OpenClaw, rồi khởi động lại Gateway. Với Docker, cũng cài đặt các binary trình duyệt
Chromium như hiển thị bên dưới.

#### Cài đặt Playwright trong Docker

Nếu Gateway của bạn chạy trong Docker, tránh `npx playwright` (xung đột override npm).
Thay vào đó, dùng CLI đi kèm:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Để lưu giữ các bản tải xuống của trình duyệt, đặt `PLAYWRIGHT_BROWSERS_PATH` (ví dụ,
`/home/node/.cache/ms-playwright`) và bảo đảm `/home/node` được lưu qua
`OPENCLAW_HOME_VOLUME` hoặc bind mount. Xem [Docker](/vi/install/docker).

## Cách hoạt động (nội bộ)

Một máy chủ điều khiển loopback nhỏ nhận yêu cầu HTTP và kết nối tới các trình duyệt dựa trên Chromium qua CDP. Các hành động nâng cao (nhấp/gõ/ảnh chụp nhanh/PDF) đi qua Playwright trên nền CDP; khi thiếu Playwright, chỉ các thao tác không dùng Playwright mới khả dụng. Agent thấy một giao diện ổn định trong khi các trình duyệt và hồ sơ cục bộ/từ xa được hoán đổi tự do bên dưới.

## Tham chiếu nhanh CLI

Tất cả lệnh chấp nhận `--browser-profile <name>` để nhắm tới một hồ sơ cụ thể, và `--json` để xuất dữ liệu máy đọc được.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Ghi chú:

- `upload` và `dialog` là các lệnh **kích hoạt chờ sẵn**; chạy chúng trước thao tác nhấp/nhấn kích hoạt trình chọn/hộp thoại.
- `click`/`type`/v.v. yêu cầu một `ref` từ `snapshot` (số `12`, ref vai trò `e12`, hoặc ref ARIA có thể hành động `ax12`). CSS selector cố ý không được hỗ trợ cho hành động. Dùng `click-coords` khi vị trí viewport hiển thị là mục tiêu đáng tin cậy duy nhất.
- Đường dẫn tải xuống, trace và tải lên bị giới hạn trong các thư mục tạm của OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (dự phòng: `${os.tmpdir()}/openclaw/...`).
- `upload` cũng có thể đặt trực tiếp input tệp qua `--input-ref` hoặc `--element`.

ID thẻ ổn định và nhãn vẫn tồn tại qua việc thay thế raw-target Chromium khi OpenClaw
có thể chứng minh thẻ thay thế, chẳng hạn cùng URL hoặc một thẻ cũ duy nhất trở thành
một thẻ mới duy nhất sau khi gửi biểu mẫu. ID raw target vẫn không ổn định; ưu tiên
`suggestedTargetId` từ `tabs` trong kịch bản.

Tổng quan nhanh về cờ ảnh chụp nhanh:

- `--format ai` (mặc định với Playwright): ảnh chụp nhanh AI với ref dạng số (`aria-ref="<n>"`).
- `--format aria`: cây trợ năng với ref `axN`. Khi có Playwright, OpenClaw liên kết ref với ID DOM backend tới trang đang chạy để các hành động tiếp theo có thể dùng chúng; nếu không, hãy xem đầu ra chỉ để kiểm tra.
- `--efficient` (hoặc `--mode efficient`): preset ảnh chụp nhanh vai trò gọn. Đặt `browser.snapshotDefaults.mode: "efficient"` để biến đây thành mặc định (xem [cấu hình Gateway](/vi/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` buộc dùng ảnh chụp nhanh vai trò với ref `ref=e12`. `--frame "<iframe>"` giới hạn phạm vi ảnh chụp nhanh vai trò vào một iframe.
- `--labels` thêm ảnh chụp màn hình chỉ trong viewport với nhãn ref phủ lên trên (in ra `MEDIA:<path>`).
- `--urls` thêm các đích liên kết đã phát hiện vào ảnh chụp nhanh AI.

## Ảnh chụp nhanh và ref

OpenClaw hỗ trợ hai kiểu “ảnh chụp nhanh”:

- **Ảnh chụp nhanh AI (ref dạng số)**: `openclaw browser snapshot` (mặc định; `--format ai`)
  - Đầu ra: ảnh chụp nhanh dạng văn bản có ref dạng số.
  - Hành động: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Nội bộ, ref được phân giải qua `aria-ref` của Playwright.

- **Ảnh chụp nhanh vai trò (ref vai trò như `e12`)**: `openclaw browser snapshot --interactive` (hoặc `--compact`, `--depth`, `--selector`, `--frame`)
  - Đầu ra: danh sách/cây dựa trên vai trò với `[ref=e12]` (và tùy chọn `[nth=1]`).
  - Hành động: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Nội bộ, ref được phân giải qua `getByRole(...)` (cộng với `nth()` cho các mục trùng lặp).
  - Thêm `--labels` để bao gồm ảnh chụp màn hình viewport với nhãn `e12` phủ lên trên.
  - Thêm `--urls` khi văn bản liên kết mơ hồ và agent cần các
    mục tiêu điều hướng cụ thể.

- **Ảnh chụp nhanh ARIA (ref ARIA như `ax12`)**: `openclaw browser snapshot --format aria`
  - Đầu ra: cây trợ năng dưới dạng các node có cấu trúc.
  - Hành động: `openclaw browser click ax12` hoạt động khi đường dẫn ảnh chụp nhanh có thể liên kết
    ref qua Playwright và ID DOM backend của Chrome.
- Nếu không có Playwright, ảnh chụp nhanh ARIA vẫn có thể hữu ích để
  kiểm tra, nhưng ref có thể không hành động được. Chụp lại bằng `--format ai`
  hoặc `--interactive` khi bạn cần ref hành động.
- Bằng chứng Docker cho đường dẫn dự phòng raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  khởi động Chromium với CDP, chạy `browser doctor --deep`, và xác minh ảnh chụp nhanh vai trò
  bao gồm URL liên kết, các mục có thể nhấp được thăng cấp từ con trỏ, và metadata iframe.

Hành vi ref:

- Ref **không ổn định qua các lần điều hướng**; nếu có lỗi, hãy chạy lại `snapshot` và dùng một ref mới.
- `/act` trả về `targetId` thô hiện tại sau khi thay thế do hành động kích hoạt
  khi nó có thể chứng minh tab thay thế. Tiếp tục dùng id/nhãn tab ổn định cho
  các lệnh tiếp theo.
- Nếu snapshot vai trò được lấy bằng `--frame`, các ref vai trò được giới hạn trong iframe đó cho đến snapshot vai trò tiếp theo.
- Ref `axN` không xác định hoặc đã cũ sẽ lỗi nhanh thay vì rơi tiếp xuống
  selector `aria-ref` của Playwright. Hãy chạy snapshot mới trên cùng tab khi
  điều đó xảy ra.

## Tăng cường khả năng chờ

Bạn có thể chờ nhiều thứ hơn là chỉ thời gian/văn bản:

- Chờ URL (hỗ trợ glob của Playwright):
  - `openclaw browser wait --url "**/dash"`
- Chờ trạng thái tải:
  - `openclaw browser wait --load networkidle`
- Chờ một vị từ JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Chờ một selector trở nên hiển thị:
  - `openclaw browser wait "#main"`

Có thể kết hợp các tùy chọn này:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Quy trình gỡ lỗi

Khi một hành động thất bại (ví dụ: “không hiển thị”, “vi phạm chế độ nghiêm ngặt”, “bị che phủ”):

1. `openclaw browser snapshot --interactive`
2. Dùng `click <ref>` / `type <ref>` (ưu tiên ref vai trò trong chế độ tương tác)
3. Nếu vẫn thất bại: `openclaw browser highlight <ref>` để xem Playwright đang nhắm tới gì
4. Nếu trang hoạt động bất thường:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Để gỡ lỗi sâu: ghi lại trace:
   - `openclaw browser trace start`
   - tái hiện sự cố
   - `openclaw browser trace stop` (in ra `TRACE:<path>`)

## Đầu ra JSON

`--json` dùng cho scripting và công cụ có cấu trúc.

Ví dụ:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshot vai trò trong JSON bao gồm `refs` cùng một khối `stats` nhỏ (lines/chars/refs/interactive) để công cụ có thể suy luận về kích thước và mật độ payload.

## Các núm chỉnh trạng thái và môi trường

Những núm này hữu ích cho các quy trình “làm trang web hoạt động như X”:

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Lưu trữ: `storage local|session get|set|clear`
- Ngoại tuyến: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (`set headers --json '{"X-Debug":"1"}'` kiểu cũ vẫn được hỗ trợ)
- Xác thực HTTP basic: `set credentials user pass` (hoặc `--clear`)
- Vị trí địa lý: `set geo <lat> <lon> --origin "https://example.com"` (hoặc `--clear`)
- Media: `set media dark|light|no-preference|none`
- Múi giờ / locale: `set timezone ...`, `set locale ...`
- Thiết bị / viewport:
  - `set device "iPhone 14"` (preset thiết bị của Playwright)
  - `set viewport 1280 720`

## Bảo mật và quyền riêng tư

- Hồ sơ trình duyệt openclaw có thể chứa phiên đã đăng nhập; hãy coi nó là nhạy cảm.
- `browser act kind=evaluate` / `openclaw browser evaluate` và `wait --fn`
  thực thi JavaScript tùy ý trong ngữ cảnh trang. Prompt injection có thể điều hướng
  việc này. Tắt bằng `browser.evaluateEnabled=false` nếu bạn không cần.
- Với ghi chú về đăng nhập và chống bot (X/Twitter, v.v.), xem [Đăng nhập trình duyệt + đăng bài X/Twitter](/vi/tools/browser-login).
- Giữ máy chủ Gateway/node ở chế độ riêng tư (loopback hoặc chỉ tailnet).
- Các endpoint CDP từ xa rất mạnh; hãy tunnel và bảo vệ chúng.

Ví dụ chế độ nghiêm ngặt (chặn đích riêng tư/nội bộ theo mặc định):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Liên quan

- [Trình duyệt](/vi/tools/browser) — tổng quan, cấu hình, hồ sơ, bảo mật
- [Đăng nhập trình duyệt](/vi/tools/browser-login) — đăng nhập vào các trang web
- [Khắc phục sự cố Browser Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố Browser WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
