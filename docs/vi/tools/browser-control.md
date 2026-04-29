---
read_when:
    - Viết script hoặc gỡ lỗi trình duyệt của tác tử thông qua API điều khiển cục bộ
    - Đang tìm tài liệu tham khảo CLI `openclaw browser`
    - Thêm tự động hóa trình duyệt tùy chỉnh bằng ảnh chụp nhanh và tham chiếu
summary: API điều khiển trình duyệt, tài liệu tham chiếu CLI và các hành động tạo tập lệnh của OpenClaw
title: API điều khiển trình duyệt
x-i18n:
    generated_at: "2026-04-29T23:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 16
---

Để thiết lập, cấu hình và khắc phục sự cố, xem [Browser](/vi/tools/browser).
Trang này là tài liệu tham khảo cho API HTTP điều khiển cục bộ, CLI `openclaw browser`
và các mẫu script (ảnh chụp nhanh, ref, chờ, luồng gỡ lỗi).

## API điều khiển (tùy chọn)

Chỉ dành cho tích hợp cục bộ, Gateway cung cấp một API HTTP loopback nhỏ:

- Trạng thái/khởi động/dừng: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
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

Tất cả endpoint chấp nhận `?profile=<name>`. `POST /start?headless=true` yêu cầu một lần khởi chạy headless
cho các hồ sơ được quản lý cục bộ mà không thay đổi cấu hình trình duyệt đã lưu;
các hồ sơ chỉ gắn kết, CDP từ xa và phiên hiện có sẽ từ chối ghi đè đó vì OpenClaw không khởi chạy các tiến trình trình duyệt đó.

Nếu auth Gateway bằng bí mật dùng chung được cấu hình, các route HTTP của trình duyệt cũng yêu cầu auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` hoặc HTTP Basic auth bằng mật khẩu đó

Ghi chú:

- API trình duyệt loopback độc lập này **không** sử dụng các header danh tính trusted-proxy hoặc
  Tailscale Serve.
- Nếu `gateway.auth.mode` là `none` hoặc `trusted-proxy`, các route trình duyệt loopback này
  không kế thừa các chế độ mang danh tính đó; hãy giữ chúng chỉ dành cho loopback.

### Hợp đồng lỗi `/act`

`POST /act` dùng phản hồi lỗi có cấu trúc cho xác thực cấp route và
các lỗi chính sách:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Các giá trị `code` hiện tại:

- `ACT_KIND_REQUIRED` (HTTP 400): thiếu `kind` hoặc không nhận dạng được.
- `ACT_INVALID_REQUEST` (HTTP 400): payload hành động không vượt qua chuẩn hóa hoặc xác thực.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` được dùng với một loại hành động không được hỗ trợ.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (hoặc `wait --fn`) bị tắt bởi cấu hình.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` cấp cao nhất hoặc theo lô xung đột với mục tiêu yêu cầu.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): hành động không được hỗ trợ cho hồ sơ phiên hiện có.

Các lỗi runtime khác vẫn có thể trả về `{ "error": "<message>" }` mà không có
trường `code`.

### Yêu cầu Playwright

Một số tính năng (điều hướng/hành động/ảnh chụp nhanh AI/ảnh chụp nhanh vai trò, ảnh chụp màn hình phần tử,
PDF) yêu cầu Playwright. Nếu Playwright chưa được cài đặt, các endpoint đó trả về
lỗi 501 rõ ràng.

Những gì vẫn hoạt động khi không có Playwright:

- Ảnh chụp nhanh ARIA
- Ảnh chụp nhanh trợ năng kiểu vai trò (`--interactive`, `--compact`,
  `--depth`, `--efficient`) khi có WebSocket CDP theo từng tab. Đây là
  phương án dự phòng để kiểm tra và khám phá ref; Playwright vẫn là engine hành động chính.
- Ảnh chụp màn hình trang cho trình duyệt `openclaw` được quản lý khi có WebSocket CDP
  theo từng tab
- Ảnh chụp màn hình trang cho hồ sơ `existing-session` / Chrome MCP
- Ảnh chụp màn hình dựa trên ref của `existing-session` (`--ref`) từ đầu ra ảnh chụp nhanh

Những gì vẫn cần Playwright:

- `navigate`
- `act`
- Ảnh chụp nhanh AI phụ thuộc vào định dạng ảnh chụp nhanh AI gốc của Playwright
- Ảnh chụp màn hình phần tử bằng CSS-selector (`--element`)
- xuất PDF toàn bộ trình duyệt

Ảnh chụp màn hình phần tử cũng từ chối `--full-page`; route trả về `fullPage is
not supported for element screenshots`.

Nếu bạn thấy `Playwright is not available in this gateway build`, hãy sửa
các phụ thuộc runtime của Plugin trình duyệt đi kèm để `playwright-core` được cài đặt,
rồi khởi động lại Gateway. Với bản cài đặt đóng gói, chạy `openclaw doctor --fix`.
Với Docker, cũng cài đặt các binary trình duyệt Chromium như bên dưới.

#### Cài đặt Docker Playwright

Nếu Gateway của bạn chạy trong Docker, tránh `npx playwright` (xung đột ghi đè npm).
Hãy dùng CLI đi kèm thay vào đó:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Để lưu bền vững các bản tải xuống của trình duyệt, đặt `PLAYWRIGHT_BROWSERS_PATH` (ví dụ,
`/home/node/.cache/ms-playwright`) và bảo đảm `/home/node` được lưu bền vững qua
`OPENCLAW_HOME_VOLUME` hoặc bind mount. Xem [Docker](/vi/install/docker).

## Cách hoạt động (nội bộ)

Một máy chủ điều khiển loopback nhỏ chấp nhận các yêu cầu HTTP và kết nối tới trình duyệt dựa trên Chromium qua CDP. Các hành động nâng cao (nhấp/gõ/ảnh chụp nhanh/PDF) đi qua Playwright trên CDP; khi thiếu Playwright, chỉ các thao tác không dùng Playwright khả dụng. Tác nhân thấy một giao diện ổn định trong khi trình duyệt và hồ sơ cục bộ/từ xa có thể hoán đổi tự do bên dưới.

## Tham khảo nhanh CLI

Tất cả lệnh chấp nhận `--browser-profile <name>` để nhắm tới một hồ sơ cụ thể, và `--json` cho đầu ra máy có thể đọc.

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

- `upload` và `dialog` là các lệnh **chuẩn bị**; chạy chúng trước cú nhấp/phím bấm kích hoạt bộ chọn/hộp thoại.
- `click`/`type`/v.v. yêu cầu một `ref` từ `snapshot` (số `12`, ref vai trò `e12`, hoặc ref ARIA có thể hành động `ax12`). CSS selector được chủ ý không hỗ trợ cho hành động. Dùng `click-coords` khi vị trí viewport hiển thị là mục tiêu đáng tin cậy duy nhất.
- Đường dẫn tải xuống, trace và tải lên bị giới hạn trong các thư mục tạm OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (dự phòng: `${os.tmpdir()}/openclaw/...`).
- `upload` cũng có thể đặt trực tiếp file input qua `--input-ref` hoặc `--element`.

ID tab ổn định và nhãn vẫn tồn tại qua việc thay thế raw-target Chromium khi OpenClaw
có thể chứng minh tab thay thế, chẳng hạn cùng URL hoặc một tab cũ duy nhất trở thành
một tab mới duy nhất sau khi gửi biểu mẫu. Raw target id vẫn biến động; ưu tiên
`suggestedTargetId` từ `tabs` trong script.

Tổng quan các cờ ảnh chụp nhanh:

- `--format ai` (mặc định với Playwright): ảnh chụp nhanh AI với ref dạng số (`aria-ref="<n>"`).
- `--format aria`: cây trợ năng với ref `axN`. Khi Playwright khả dụng, OpenClaw gắn ref bằng backend DOM id vào trang đang chạy để các hành động tiếp theo có thể dùng chúng; nếu không, hãy xem đầu ra chỉ để kiểm tra.
- `--efficient` (hoặc `--mode efficient`): preset ảnh chụp nhanh vai trò thu gọn. Đặt `browser.snapshotDefaults.mode: "efficient"` để biến đây thành mặc định (xem [Cấu hình Gateway](/vi/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` buộc ảnh chụp nhanh vai trò với ref `ref=e12`. `--frame "<iframe>"` giới hạn ảnh chụp nhanh vai trò trong một iframe.
- `--labels` thêm ảnh chụp màn hình chỉ viewport với nhãn ref phủ lên (in `MEDIA:<path>`).
- `--urls` nối thêm các đích liên kết đã phát hiện vào ảnh chụp nhanh AI.

## Ảnh chụp nhanh và ref

OpenClaw hỗ trợ hai kiểu “ảnh chụp nhanh”:

- **Ảnh chụp nhanh AI (ref dạng số)**: `openclaw browser snapshot` (mặc định; `--format ai`)
  - Đầu ra: ảnh chụp nhanh dạng văn bản có bao gồm ref dạng số.
  - Hành động: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Nội bộ, ref được phân giải qua `aria-ref` của Playwright.

- **Ảnh chụp nhanh vai trò (ref vai trò như `e12`)**: `openclaw browser snapshot --interactive` (hoặc `--compact`, `--depth`, `--selector`, `--frame`)
  - Đầu ra: danh sách/cây dựa trên vai trò với `[ref=e12]` (và tùy chọn `[nth=1]`).
  - Hành động: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Nội bộ, ref được phân giải qua `getByRole(...)` (cộng thêm `nth()` cho các mục trùng).
  - Thêm `--labels` để bao gồm ảnh chụp màn hình viewport với nhãn `e12` phủ lên.
  - Thêm `--urls` khi văn bản liên kết mơ hồ và tác nhân cần các mục tiêu
    điều hướng cụ thể.

- **Ảnh chụp nhanh ARIA (ref ARIA như `ax12`)**: `openclaw browser snapshot --format aria`
  - Đầu ra: cây trợ năng dưới dạng các nút có cấu trúc.
  - Hành động: `openclaw browser click ax12` hoạt động khi đường dẫn ảnh chụp nhanh có thể gắn
    ref thông qua Playwright và backend DOM id của Chrome.
- Nếu Playwright không khả dụng, ảnh chụp nhanh ARIA vẫn có thể hữu ích để
  kiểm tra, nhưng ref có thể không thể hành động. Chụp lại bằng `--format ai`
  hoặc `--interactive` khi bạn cần ref hành động.
- Bằng chứng Docker cho đường dự phòng raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  khởi động Chromium với CDP, chạy `browser doctor --deep`, và xác minh ảnh chụp nhanh vai trò
  bao gồm URL liên kết, mục có thể nhấp được thăng cấp từ con trỏ, và metadata iframe.

Hành vi ref:

- Ref **không ổn định qua các lần điều hướng**; nếu có gì đó thất bại, hãy chạy lại `snapshot` và dùng một ref mới.
- `/act` trả về `targetId` thô hiện tại sau khi thay thế do hành động kích hoạt
  khi có thể chứng minh tab thay thế. Hãy tiếp tục dùng id/nhãn tab ổn định cho
  các lệnh tiếp theo.
- Nếu role snapshot được chụp với `--frame`, role ref được giới hạn trong iframe đó cho đến role snapshot tiếp theo.
- Ref `axN` không xác định hoặc đã lỗi thời sẽ thất bại nhanh thay vì rơi tiếp xuống
  bộ chọn `aria-ref` của Playwright. Hãy chạy snapshot mới trên cùng tab khi
  điều đó xảy ra.

## Các tăng cường cho chờ

Bạn có thể chờ nhiều thứ hơn chỉ là thời gian/văn bản:

- Chờ URL (hỗ trợ glob bởi Playwright):
  - `openclaw browser wait --url "**/dash"`
- Chờ trạng thái tải:
  - `openclaw browser wait --load networkidle`
- Chờ một JS predicate:
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
2. Dùng `click <ref>` / `type <ref>` (ưu tiên role ref trong chế độ tương tác)
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

Role snapshot trong JSON bao gồm `refs` cùng một khối `stats` nhỏ (lines/chars/refs/interactive) để công cụ có thể suy luận về kích thước và mật độ payload.

## Các núm chỉnh trạng thái và môi trường

Các mục này hữu ích cho quy trình “làm cho trang hoạt động như X”:

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Ngoại tuyến: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` vẫn được hỗ trợ)
- Xác thực HTTP basic: `set credentials user pass` (hoặc `--clear`)
- Vị trí địa lý: `set geo <lat> <lon> --origin "https://example.com"` (hoặc `--clear`)
- Media: `set media dark|light|no-preference|none`
- Múi giờ / ngôn ngữ: `set timezone ...`, `set locale ...`
- Thiết bị / viewport:
  - `set device "iPhone 14"` (preset thiết bị của Playwright)
  - `set viewport 1280 720`

## Bảo mật và quyền riêng tư

- Profile trình duyệt openclaw có thể chứa các phiên đã đăng nhập; hãy coi nó là dữ liệu nhạy cảm.
- `browser act kind=evaluate` / `openclaw browser evaluate` và `wait --fn`
  thực thi JavaScript tùy ý trong ngữ cảnh trang. Prompt injection có thể điều hướng
  điều này. Tắt bằng `browser.evaluateEnabled=false` nếu bạn không cần.
- Với ghi chú về đăng nhập và chống bot (X/Twitter, v.v.), xem [Đăng nhập trình duyệt + đăng bài X/Twitter](/vi/tools/browser-login).
- Giữ máy chủ Gateway/node ở chế độ riêng tư (loopback hoặc chỉ tailnet).
- Endpoint CDP từ xa rất mạnh; hãy tunnel và bảo vệ chúng.

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

- [Trình duyệt](/vi/tools/browser) — tổng quan, cấu hình, profile, bảo mật
- [Đăng nhập trình duyệt](/vi/tools/browser-login) — đăng nhập vào các trang
- [Khắc phục sự cố Browser trên Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố Browser WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
