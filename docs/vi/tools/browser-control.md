---
read_when:
    - Viết script hoặc gỡ lỗi trình duyệt tác nhân thông qua API điều khiển cục bộ
    - Tìm tài liệu tham khảo CLI `openclaw browser`
    - Thêm tự động hóa trình duyệt tùy chỉnh bằng ảnh chụp nhanh và tham chiếu
summary: API điều khiển trình duyệt OpenClaw, tài liệu tham chiếu CLI và các hành động viết kịch bản
title: API điều khiển trình duyệt
x-i18n:
    generated_at: "2026-05-06T09:31:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

Để thiết lập, cấu hình và khắc phục sự cố, hãy xem [Trình duyệt](/vi/tools/browser).
Trang này là tài liệu tham chiếu cho API HTTP điều khiển cục bộ, CLI `openclaw browser`
và các mẫu viết script (ảnh chụp trạng thái, refs, chờ, luồng gỡ lỗi).

## API điều khiển (tùy chọn)

Chỉ dành cho tích hợp cục bộ, Gateway cung cấp một API HTTP loopback nhỏ:

- Trạng thái/khởi động/dừng: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Ảnh chụp trạng thái/ảnh chụp màn hình: `GET /snapshot`, `POST /screenshot`
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

Tất cả endpoint đều chấp nhận `?profile=<name>`. `POST /start?headless=true` yêu cầu một
lần khởi chạy headless dùng một lần cho các hồ sơ cục bộ được quản lý mà không thay đổi cấu hình
trình duyệt đã lưu; các hồ sơ chỉ đính kèm, CDP từ xa và phiên hiện có sẽ từ chối
ghi đè đó vì OpenClaw không khởi chạy các tiến trình trình duyệt đó.

Nếu xác thực Gateway bằng bí mật dùng chung được cấu hình, các tuyến HTTP của trình duyệt cũng yêu cầu xác thực:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` hoặc xác thực HTTP Basic bằng mật khẩu đó

Ghi chú:

- API trình duyệt loopback độc lập này **không** dùng các header danh tính trusted-proxy hoặc
  Tailscale Serve.
- Nếu `gateway.auth.mode` là `none` hoặc `trusted-proxy`, các tuyến trình duyệt loopback
  này không kế thừa những chế độ mang danh tính đó; hãy giữ chúng chỉ dành cho loopback.

### Hợp đồng lỗi `/act`

`POST /act` dùng phản hồi lỗi có cấu trúc cho kiểm tra hợp lệ cấp tuyến và
lỗi chính sách:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Các giá trị `code` hiện tại:

- `ACT_KIND_REQUIRED` (HTTP 400): thiếu hoặc không nhận diện được `kind`.
- `ACT_INVALID_REQUEST` (HTTP 400): payload hành động không chuẩn hóa hoặc kiểm tra hợp lệ được.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` được dùng với một loại hành động không được hỗ trợ.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (hoặc `wait --fn`) bị tắt bởi cấu hình.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` cấp cao nhất hoặc theo lô xung đột với đích yêu cầu.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): hành động không được hỗ trợ cho hồ sơ phiên hiện có.

Các lỗi runtime khác vẫn có thể trả về `{ "error": "<message>" }` mà không có
trường `code`.

### Yêu cầu Playwright

Một số tính năng (điều hướng/hành động/ảnh chụp trạng thái AI/ảnh chụp trạng thái vai trò, ảnh chụp màn hình phần tử,
PDF) yêu cầu Playwright. Nếu Playwright chưa được cài đặt, các endpoint đó sẽ trả về
lỗi 501 rõ ràng.

Những gì vẫn hoạt động khi không có Playwright:

- Ảnh chụp trạng thái ARIA
- Ảnh chụp trạng thái khả năng truy cập kiểu vai trò (`--interactive`, `--compact`,
  `--depth`, `--efficient`) khi WebSocket CDP theo từng tab có sẵn. Đây là
  phương án dự phòng để kiểm tra và khám phá ref; Playwright vẫn là công cụ hành động chính.
- Ảnh chụp màn hình trang cho trình duyệt `openclaw` được quản lý khi WebSocket CDP
  theo từng tab có sẵn
- Ảnh chụp màn hình trang cho hồ sơ `existing-session` / Chrome MCP
- Ảnh chụp màn hình dựa trên ref của `existing-session` (`--ref`) từ đầu ra ảnh chụp trạng thái

Những gì vẫn cần Playwright:

- `navigate`
- `act`
- Ảnh chụp trạng thái AI phụ thuộc vào định dạng ảnh chụp trạng thái AI gốc của Playwright
- Ảnh chụp màn hình phần tử bằng bộ chọn CSS (`--element`)
- xuất PDF toàn bộ trình duyệt

Ảnh chụp màn hình phần tử cũng từ chối `--full-page`; tuyến trả về `fullPage is
not supported for element screenshots`.

Nếu bạn thấy `Playwright is not available in this gateway build`, Gateway đã đóng gói
đang thiếu dependency runtime trình duyệt lõi. Cài đặt lại hoặc cập nhật
OpenClaw, rồi khởi động lại Gateway. Với Docker, hãy cài đặt thêm các binary trình duyệt
Chromium như minh họa bên dưới.

#### Cài đặt Playwright trong Docker

Nếu Gateway của bạn chạy trong Docker, tránh dùng `npx playwright` (xung đột ghi đè npm).
Hãy dùng CLI được đóng gói thay thế:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Để lưu bền vững các bản tải xuống của trình duyệt, đặt `PLAYWRIGHT_BROWSERS_PATH` (ví dụ:
`/home/node/.cache/ms-playwright`) và đảm bảo `/home/node` được lưu bền vững qua
`OPENCLAW_HOME_VOLUME` hoặc bind mount. Xem [Docker](/vi/install/docker).

## Cách hoạt động (nội bộ)

Một máy chủ điều khiển loopback nhỏ nhận các yêu cầu HTTP và kết nối tới các trình duyệt dựa trên Chromium qua CDP. Các hành động nâng cao (click/nhập/ảnh chụp trạng thái/PDF) đi qua Playwright trên nền CDP; khi thiếu Playwright, chỉ các thao tác không dùng Playwright mới có sẵn. Agent thấy một giao diện ổn định trong khi các trình duyệt và hồ sơ cục bộ/từ xa được hoán đổi tự do bên dưới.

## Tham chiếu nhanh CLI

Tất cả lệnh đều chấp nhận `--browser-profile <name>` để nhắm tới một hồ sơ cụ thể, và `--json` cho đầu ra đọc được bằng máy.

<AccordionGroup>

<Accordion title="Cơ bản: trạng thái, tab, mở/focus/đóng">

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

<Accordion title="Kiểm tra: ảnh chụp màn hình, ảnh chụp trạng thái, console, lỗi, yêu cầu">

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

<Accordion title="Hành động: điều hướng, click, nhập, kéo, chờ, đánh giá">

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

<Accordion title="Trạng thái: cookie, bộ nhớ, ngoại tuyến, header, địa lý, thiết bị">

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

- `upload` và `dialog` là các lệnh gọi **arming**; chạy chúng trước thao tác click/nhấn kích hoạt bộ chọn/hộp thoại.
- `click`/`type`/v.v. yêu cầu một `ref` từ `snapshot` (số `12`, ref vai trò `e12`, hoặc ref ARIA có thể hành động `ax12`). Bộ chọn CSS cố ý không được hỗ trợ cho hành động. Dùng `click-coords` khi vị trí viewport hiển thị là đích đáng tin cậy duy nhất.
- Đường dẫn tải xuống, trace và upload bị giới hạn trong các thư mục tạm của OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (dự phòng: `${os.tmpdir()}/openclaw/...`).
- `upload` cũng có thể đặt trực tiếp input tệp qua `--input-ref` hoặc `--element`.

ID tab ổn định và nhãn vẫn tồn tại sau khi Chromium thay thế raw-target khi OpenClaw
có thể chứng minh tab thay thế, chẳng hạn cùng URL hoặc một tab cũ duy nhất trở thành
một tab mới duy nhất sau khi gửi biểu mẫu. ID raw target vẫn dễ thay đổi; ưu tiên
`suggestedTargetId` từ `tabs` trong script.

Sơ lược các cờ ảnh chụp trạng thái:

- `--format ai` (mặc định với Playwright): ảnh chụp trạng thái AI với ref dạng số (`aria-ref="<n>"`).
- `--format aria`: cây khả năng truy cập với ref `axN`. Khi Playwright có sẵn, OpenClaw liên kết ref bằng ID DOM backend với trang đang chạy để các hành động tiếp theo có thể dùng chúng; nếu không, hãy xem đầu ra chỉ dành cho kiểm tra.
- `--efficient` (hoặc `--mode efficient`): preset ảnh chụp trạng thái vai trò gọn. Đặt `browser.snapshotDefaults.mode: "efficient"` để biến đây thành mặc định (xem [Cấu hình Gateway](/vi/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` ép tạo ảnh chụp trạng thái vai trò với ref `ref=e12`. `--frame "<iframe>"` giới hạn ảnh chụp trạng thái vai trò trong một iframe.
- `--labels` thêm ảnh chụp màn hình chỉ trong viewport với nhãn ref phủ lên (in `MEDIA:<path>`).
- `--urls` nối thêm các đích liên kết đã phát hiện vào ảnh chụp trạng thái AI.

## Ảnh chụp trạng thái và refs

OpenClaw hỗ trợ hai kiểu "ảnh chụp trạng thái":

- **Ảnh chụp trạng thái AI (ref dạng số)**: `openclaw browser snapshot` (mặc định; `--format ai`)
  - Đầu ra: ảnh chụp trạng thái dạng văn bản bao gồm ref dạng số.
  - Hành động: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Nội bộ, ref được phân giải qua `aria-ref` của Playwright.

- **Ảnh chụp trạng thái vai trò (ref vai trò như `e12`)**: `openclaw browser snapshot --interactive` (hoặc `--compact`, `--depth`, `--selector`, `--frame`)
  - Đầu ra: danh sách/cây dựa trên vai trò với `[ref=e12]` (và tùy chọn `[nth=1]`).
  - Hành động: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Nội bộ, ref được phân giải qua `getByRole(...)` (cộng với `nth()` cho các mục trùng lặp).
  - Thêm `--labels` để bao gồm ảnh chụp màn hình viewport với nhãn `e12` phủ lên.
  - Thêm `--urls` khi văn bản liên kết mơ hồ và agent cần các
    đích điều hướng cụ thể.

- **Ảnh chụp trạng thái ARIA (ref ARIA như `ax12`)**: `openclaw browser snapshot --format aria`
  - Đầu ra: cây khả năng truy cập dưới dạng các node có cấu trúc.
  - Hành động: `openclaw browser click ax12` hoạt động khi đường dẫn ảnh chụp trạng thái có thể liên kết
    ref qua Playwright và ID DOM backend của Chrome.
- Nếu Playwright không có sẵn, ảnh chụp trạng thái ARIA vẫn có thể hữu ích để
  kiểm tra, nhưng ref có thể không hành động được. Chụp lại với `--format ai`
  hoặc `--interactive` khi bạn cần ref hành động.
- Bằng chứng Docker cho đường dẫn dự phòng raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  khởi động Chromium với CDP, chạy `browser doctor --deep`, và xác minh ảnh chụp trạng thái vai trò
  bao gồm URL liên kết, phần tử có thể click được nâng cấp bằng con trỏ, và metadata iframe.

Hành vi ref:

- Các tham chiếu **không ổn định qua các lần điều hướng**; nếu có gì đó thất bại, hãy chạy lại `snapshot` và dùng một tham chiếu mới.
- `/act` trả về `targetId` thô hiện tại sau khi có thay thế do hành động kích hoạt
  khi nó có thể chứng minh tab thay thế. Tiếp tục dùng id/nhãn tab ổn định cho
  các lệnh tiếp theo.
- Nếu ảnh chụp nhanh vai trò được lấy bằng `--frame`, tham chiếu vai trò được giới hạn trong iframe đó cho đến ảnh chụp nhanh vai trò tiếp theo.
- Các tham chiếu `axN` không xác định hoặc đã cũ sẽ thất bại nhanh thay vì rơi xuống
  bộ chọn `aria-ref` của Playwright. Hãy chạy ảnh chụp nhanh mới trên cùng tab khi
  điều đó xảy ra.

## Nâng cấp chờ

Bạn có thể chờ nhiều thứ hơn là chỉ thời gian/văn bản:

- Chờ URL (Playwright hỗ trợ glob):
  - `openclaw browser wait --url "**/dash"`
- Chờ trạng thái tải:
  - `openclaw browser wait --load networkidle`
- Chờ một vị từ JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Chờ một bộ chọn trở nên hiển thị:
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

Khi một hành động thất bại (ví dụ: "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Dùng `click <ref>` / `type <ref>` (ưu tiên tham chiếu vai trò trong chế độ tương tác)
3. Nếu vẫn thất bại: `openclaw browser highlight <ref>` để xem Playwright đang nhắm tới gì
4. Nếu trang hoạt động bất thường:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Để gỡ lỗi sâu: ghi lại một trace:
   - `openclaw browser trace start`
   - tái hiện vấn đề
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

Ảnh chụp nhanh vai trò trong JSON bao gồm `refs` cùng một khối `stats` nhỏ (lines/chars/refs/interactive) để công cụ có thể suy luận về kích thước và mật độ payload.

## Trạng thái và các núm điều chỉnh môi trường

Các mục này hữu ích cho quy trình "làm cho trang web hoạt động như X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Bộ nhớ: `storage local|session get|set|clear`
- Ngoại tuyến: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (`set headers --json '{"X-Debug":"1"}'` cũ vẫn được hỗ trợ)
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
- Về đăng nhập và ghi chú chống bot (X/Twitter, v.v.), xem [Đăng nhập trình duyệt + đăng bài X/Twitter](/vi/tools/browser-login).
- Giữ máy chủ Gateway/node ở chế độ riêng tư (loopback hoặc chỉ tailnet).
- Các endpoint CDP từ xa rất mạnh; hãy tạo đường hầm và bảo vệ chúng.

Ví dụ strict-mode (mặc định chặn các đích riêng tư/nội bộ):

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
- [Khắc phục sự cố trình duyệt trên Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố trình duyệt WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
