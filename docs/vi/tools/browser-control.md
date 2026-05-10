---
read_when:
    - Viết kịch bản hoặc gỡ lỗi trình duyệt của tác tử thông qua API điều khiển cục bộ
    - Đang tìm tài liệu tham chiếu CLI `openclaw browser`
    - Thêm tự động hóa trình duyệt tùy chỉnh bằng bản chụp nhanh và tham chiếu
summary: API điều khiển trình duyệt OpenClaw, tài liệu tham khảo CLI và các hành động tạo tập lệnh
title: API điều khiển trình duyệt
x-i18n:
    generated_at: "2026-05-10T19:52:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: eec952e6befed8911b83fc554b1c08cc5f20d3deff9c6cc791cb8a009bb9e7f3
    source_path: tools/browser-control.md
    workflow: 16
---

Để thiết lập, cấu hình và khắc phục sự cố, xem [Trình duyệt](/vi/tools/browser).
Trang này là tài liệu tham khảo cho API HTTP điều khiển cục bộ, CLI `openclaw browser`
và các mẫu scripting (snapshot, ref, wait, luồng gỡ lỗi).

## API điều khiển (tùy chọn)

Chỉ dành cho tích hợp cục bộ, Gateway cung cấp một API HTTP loopback nhỏ:

- Trạng thái/khởi động/dừng: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/ảnh chụp màn hình: `GET /snapshot`, `POST /screenshot`
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

Tất cả endpoint chấp nhận `?profile=<name>`. `POST /start?headless=true` yêu cầu một
lần khởi chạy headless dùng một lần cho các profile cục bộ do OpenClaw quản lý mà không thay đổi cấu hình
trình duyệt đã lưu; các profile attach-only, CDP từ xa và existing-session sẽ từ chối
ghi đè đó vì OpenClaw không khởi chạy các tiến trình trình duyệt đó.

Nếu cấu hình xác thực Gateway bằng shared-secret, các route HTTP của trình duyệt cũng yêu cầu xác thực:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` hoặc xác thực HTTP Basic bằng mật khẩu đó

Ghi chú:

- API trình duyệt loopback độc lập này **không** tiêu thụ header định danh trusted-proxy hoặc
  Tailscale Serve.
- Nếu `gateway.auth.mode` là `none` hoặc `trusted-proxy`, các route trình duyệt loopback
  này không kế thừa các chế độ mang định danh đó; hãy giữ chúng chỉ trên loopback.

### Hợp đồng lỗi `/act`

`POST /act` dùng phản hồi lỗi có cấu trúc cho lỗi xác thực cấp route và
lỗi chính sách:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Các giá trị `code` hiện tại:

- `ACT_KIND_REQUIRED` (HTTP 400): thiếu `kind` hoặc không nhận diện được.
- `ACT_INVALID_REQUEST` (HTTP 400): payload hành động không vượt qua chuẩn hóa hoặc xác thực.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` được dùng với một loại hành động không được hỗ trợ.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (hoặc `wait --fn`) bị vô hiệu hóa bởi cấu hình.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` cấp cao nhất hoặc theo batch xung đột với target của yêu cầu.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): hành động không được hỗ trợ cho profile existing-session.

Các lỗi runtime khác vẫn có thể trả về `{ "error": "<message>" }` mà không có
trường `code`.

### Yêu cầu Playwright

Một số tính năng (navigate/act/snapshot AI/snapshot role, ảnh chụp màn hình phần tử,
PDF) yêu cầu Playwright. Nếu Playwright chưa được cài đặt, các endpoint đó trả về
lỗi 501 rõ ràng.

Những gì vẫn hoạt động khi không có Playwright:

- Snapshot ARIA
- Snapshot trợ năng kiểu role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) khi có WebSocket CDP theo từng tab. Đây là
  phương án dự phòng để kiểm tra và khám phá ref; Playwright vẫn là engine hành động
  chính.
- Ảnh chụp màn hình trang cho trình duyệt `openclaw` được quản lý khi có
  WebSocket CDP theo từng tab
- Ảnh chụp màn hình trang cho profile `existing-session` / Chrome MCP
- Ảnh chụp màn hình dựa trên ref của `existing-session` (`--ref`) từ đầu ra snapshot

Những gì vẫn cần Playwright:

- `navigate`
- `act`
- Snapshot AI phụ thuộc vào định dạng snapshot AI native của Playwright
- Ảnh chụp màn hình phần tử bằng CSS-selector (`--element`)
- xuất PDF toàn bộ trình duyệt

Ảnh chụp màn hình phần tử cũng từ chối `--full-page`; route trả về `fullPage is
not supported for element screenshots`.

Nếu bạn thấy `Playwright is not available in this gateway build`, Gateway được đóng gói
đang thiếu phụ thuộc runtime trình duyệt cốt lõi. Cài đặt lại hoặc cập nhật
OpenClaw, rồi khởi động lại gateway. Với Docker, cũng cài đặt các binary trình duyệt
Chromium như minh họa bên dưới.

#### Cài đặt Playwright cho Docker

Nếu Gateway của bạn chạy trong Docker, tránh `npx playwright` (xung đột ghi đè npm).
Dùng CLI được đóng gói thay thế:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Để lưu bền các bản tải xuống trình duyệt, đặt `PLAYWRIGHT_BROWSERS_PATH` (ví dụ,
`/home/node/.cache/ms-playwright`) và bảo đảm `/home/node` được lưu bền qua
`OPENCLAW_HOME_VOLUME` hoặc bind mount. OpenClaw tự động phát hiện Chromium đã lưu bền
trên Linux. Xem [Docker](/vi/install/docker).

## Cách hoạt động (nội bộ)

Một máy chủ điều khiển loopback nhỏ chấp nhận yêu cầu HTTP và kết nối tới các trình duyệt dựa trên Chromium qua CDP. Các hành động nâng cao (click/type/snapshot/PDF) đi qua Playwright trên CDP; khi thiếu Playwright, chỉ các thao tác không dùng Playwright là khả dụng. Agent thấy một giao diện ổn định trong khi trình duyệt và profile cục bộ/từ xa có thể thay đổi tự do bên dưới.

## Tham khảo nhanh CLI

Tất cả lệnh chấp nhận `--browser-profile <name>` để nhắm đến một profile cụ thể, và `--json` cho đầu ra máy đọc được.

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

- `upload` và `dialog` là các lệnh **arming**; chạy chúng trước thao tác click/press kích hoạt chooser/dialog.
- `click`/`type`/v.v. yêu cầu một `ref` từ `snapshot` (số `12`, role ref `e12`, hoặc ref ARIA có thể hành động `ax12`). CSS selector cố ý không được hỗ trợ cho hành động. Dùng `click-coords` khi vị trí viewport hiển thị là target đáng tin cậy duy nhất.
- Đường dẫn download, trace và upload bị giới hạn trong các thư mục tạm của OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (dự phòng: `${os.tmpdir()}/openclaw/...`).
- `upload` cũng có thể đặt file input trực tiếp qua `--input-ref` hoặc `--element`.

ID tab ổn định và nhãn tồn tại qua việc thay thế raw-target của Chromium khi OpenClaw
có thể chứng minh tab thay thế, chẳng hạn cùng URL hoặc một tab cũ duy nhất trở thành
một tab mới duy nhất sau khi gửi biểu mẫu. Raw target id vẫn dễ thay đổi; ưu tiên
`suggestedTargetId` từ `tabs` trong script.

Tổng quan nhanh về các cờ snapshot:

- `--format ai` (mặc định với Playwright): snapshot AI với ref dạng số (`aria-ref="<n>"`).
- `--format aria`: cây trợ năng với ref `axN`. Khi Playwright khả dụng, OpenClaw bind ref bằng backend DOM id vào trang live để các hành động tiếp theo có thể dùng chúng; nếu không, hãy coi đầu ra chỉ dùng để kiểm tra.
- `--efficient` (hoặc `--mode efficient`): preset snapshot role nhỏ gọn. Đặt `browser.snapshotDefaults.mode: "efficient"` để biến đây thành mặc định (xem [Cấu hình Gateway](/vi/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` buộc dùng snapshot role với ref `ref=e12`. `--frame "<iframe>"` giới hạn phạm vi snapshot role vào một iframe.
- `--labels` thêm ảnh chụp màn hình chỉ viewport với nhãn ref phủ lên (in `MEDIA:<path>`).
- `--urls` nối thêm các đích liên kết đã phát hiện vào snapshot AI.

## Snapshot và ref

OpenClaw hỗ trợ hai kiểu "snapshot":

- **Snapshot AI (ref dạng số)**: `openclaw browser snapshot` (mặc định; `--format ai`)
  - Đầu ra: một snapshot dạng văn bản bao gồm ref dạng số.
  - Hành động: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Nội bộ, ref được phân giải qua `aria-ref` của Playwright.

- **Snapshot role (role ref như `e12`)**: `openclaw browser snapshot --interactive` (hoặc `--compact`, `--depth`, `--selector`, `--frame`)
  - Đầu ra: một danh sách/cây dựa trên role với `[ref=e12]` (và tùy chọn `[nth=1]`).
  - Hành động: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Nội bộ, ref được phân giải qua `getByRole(...)` (cộng thêm `nth()` cho các mục trùng lặp).
  - Thêm `--labels` để bao gồm ảnh chụp màn hình viewport với nhãn `e12` phủ lên.
  - Thêm `--urls` khi văn bản liên kết không rõ ràng và agent cần
    target điều hướng cụ thể.

- **Snapshot ARIA (ref ARIA như `ax12`)**: `openclaw browser snapshot --format aria`
  - Đầu ra: cây trợ năng dưới dạng các node có cấu trúc.
  - Hành động: `openclaw browser click ax12` hoạt động khi đường dẫn snapshot có thể bind
    ref thông qua Playwright và Chrome backend DOM id.
- Nếu Playwright không khả dụng, snapshot ARIA vẫn có thể hữu ích để
  kiểm tra, nhưng ref có thể không hành động được. Chụp lại snapshot với `--format ai`
  hoặc `--interactive` khi bạn cần ref hành động.
- Bằng chứng Docker cho đường dẫn dự phòng raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  khởi động Chromium với CDP, chạy `browser doctor --deep`, và xác minh snapshot role
  bao gồm URL liên kết, mục có thể click được thăng cấp từ con trỏ, và metadata iframe.

Hành vi ref:

- Refs **không ổn định qua các lần điều hướng**; nếu có gì đó thất bại, hãy chạy lại `snapshot` và dùng ref mới.
- `/act` trả về `targetId` thô hiện tại sau thao tác thay thế do hành động kích hoạt
  khi có thể chứng minh tab thay thế. Tiếp tục dùng id/nhãn tab ổn định cho
  các lệnh tiếp theo.
- Nếu snapshot vai trò được lấy với `--frame`, các ref vai trò sẽ bị giới hạn trong iframe đó cho đến snapshot vai trò tiếp theo.
- Các ref `axN` không xác định hoặc đã cũ sẽ thất bại nhanh thay vì rơi tiếp xuống
  selector `aria-ref` của Playwright. Hãy chạy snapshot mới trên cùng tab khi
  điều đó xảy ra.

## Tăng cường khả năng chờ

Bạn có thể chờ nhiều thứ hơn là chỉ thời gian/văn bản:

- Chờ URL (Playwright hỗ trợ glob):
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

Khi một hành động thất bại (ví dụ: "không hiển thị", "vi phạm chế độ strict", "bị che phủ"):

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

`--json` dành cho scripting và công cụ có cấu trúc.

Ví dụ:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshot vai trò ở dạng JSON bao gồm `refs` cùng một khối `stats` nhỏ (lines/chars/refs/interactive) để công cụ có thể suy luận về kích thước và mật độ payload.

## Trạng thái và nút chỉnh môi trường

Các mục này hữu ích cho quy trình "làm cho trang web hoạt động giống X":

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (bản cũ `set headers --json '{"X-Debug":"1"}'` vẫn được hỗ trợ)
- Xác thực HTTP basic: `set credentials user pass` (hoặc `--clear`)
- Vị trí địa lý: `set geo <lat> <lon> --origin "https://example.com"` (hoặc `--clear`)
- Media: `set media dark|light|no-preference|none`
- Múi giờ / locale: `set timezone ...`, `set locale ...`
- Thiết bị / viewport:
  - `set device "iPhone 14"` (preset thiết bị Playwright)
  - `set viewport 1280 720`

## Bảo mật và quyền riêng tư

- Hồ sơ trình duyệt openclaw có thể chứa các phiên đã đăng nhập; hãy xem nó là dữ liệu nhạy cảm.
- `browser act kind=evaluate` / `openclaw browser evaluate` và `wait --fn`
  thực thi JavaScript tùy ý trong ngữ cảnh trang. Prompt injection có thể điều hướng
  việc này. Tắt bằng `browser.evaluateEnabled=false` nếu bạn không cần.
- Với ghi chú về đăng nhập và chống bot (X/Twitter, v.v.), xem [Đăng nhập trình duyệt + đăng bài X/Twitter](/vi/tools/browser-login).
- Giữ máy chủ Gateway/node ở chế độ riêng tư (local loopback hoặc chỉ tailnet).
- Endpoint CDP từ xa rất mạnh; hãy tunnel và bảo vệ chúng.

Ví dụ chế độ strict (chặn đích riêng tư/nội bộ theo mặc định):

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

- [Trình duyệt](/vi/tools/browser) - tổng quan, cấu hình, hồ sơ, bảo mật
- [Đăng nhập trình duyệt](/vi/tools/browser-login) - đăng nhập vào các trang web
- [Khắc phục sự cố Trình duyệt Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố Trình duyệt WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
