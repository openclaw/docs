---
read_when:
    - Viết script hoặc gỡ lỗi trình duyệt agent thông qua API điều khiển cục bộ
    - Bạn đang tìm tài liệu tham khảo CLI `openclaw browser`
    - Thêm tự động hóa trình duyệt tùy chỉnh với snapshot và ref
summary: API điều khiển trình duyệt OpenClaw, tài liệu tham chiếu CLI và các hành động kịch bản
title: API điều khiển trình duyệt
x-i18n:
    generated_at: "2026-06-27T18:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Để thiết lập, cấu hình và khắc phục sự cố, xem [Trình duyệt](/vi/tools/browser).
Trang này là tài liệu tham chiếu cho API HTTP điều khiển cục bộ, CLI
`openclaw browser`, và các mẫu kịch bản (snapshot, ref, chờ, luồng gỡ lỗi).

## API điều khiển (tùy chọn)

Chỉ dành cho tích hợp cục bộ, Gateway cung cấp một API HTTP local loopback nhỏ.
Máy chủ độc lập này là tùy chọn bật — đặt biến môi trường
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` trong môi trường dịch vụ gateway
và khởi động lại gateway trước khi các endpoint HTTP khả dụng. Nếu không có
biến này, runtime điều khiển trình duyệt vẫn hoạt động thông qua CLI và
công cụ agent, nhưng không có gì lắng nghe trên cổng điều khiển loopback.

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

Tất cả endpoint chấp nhận `?profile=<name>`. `POST /start?headless=true` yêu cầu
một lần khởi chạy headless cho hồ sơ cục bộ do OpenClaw quản lý mà không thay đổi
cấu hình trình duyệt đã lưu; các hồ sơ chỉ đính kèm, CDP từ xa và phiên hiện có
sẽ từ chối ghi đè đó vì OpenClaw không khởi chạy các tiến trình trình duyệt đó.

Đối với endpoint tab, `targetId` là tên trường tương thích. Ưu tiên truyền
`suggestedTargetId` từ `GET /tabs` hoặc `POST /tabs/open`; nhãn và handle `tabId`
như `t1` cũng được chấp nhận. ID đích CDP thô và tiền tố ID đích thô duy nhất
vẫn hoạt động, nhưng chúng là các handle chẩn đoán dễ thay đổi.

Nếu xác thực gateway bằng bí mật dùng chung được cấu hình, các route HTTP trình duyệt cũng yêu cầu xác thực:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` hoặc xác thực HTTP Basic bằng mật khẩu đó

Ghi chú:

- API trình duyệt loopback độc lập này **không** dùng header danh tính trusted-proxy hoặc
  Tailscale Serve.
- Nếu `gateway.auth.mode` là `none` hoặc `trusted-proxy`, các route trình duyệt loopback này
  không kế thừa các chế độ mang danh tính đó; hãy giữ chúng chỉ dành cho loopback.

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
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (hoặc `wait --fn`) bị tắt bằng cấu hình.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` cấp cao nhất hoặc theo lô xung đột với đích yêu cầu.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): hành động không được hỗ trợ cho hồ sơ phiên hiện có.

Các lỗi runtime khác vẫn có thể trả về `{ "error": "<message>" }` mà không có
trường `code`.

### Yêu cầu Playwright

Một số tính năng (điều hướng/hành động/snapshot AI/snapshot vai trò, ảnh chụp phần tử,
PDF) yêu cầu Playwright. Nếu Playwright chưa được cài đặt, các endpoint đó trả về
lỗi 501 rõ ràng.

Những gì vẫn hoạt động khi không có Playwright:

- Snapshot ARIA
- Snapshot khả năng truy cập kiểu vai trò (`--interactive`, `--compact`,
  `--depth`, `--efficient`) khi WebSocket CDP theo từng tab khả dụng. Đây là
  phương án dự phòng để kiểm tra và khám phá ref; Playwright vẫn là engine hành động chính.
- Ảnh chụp trang cho trình duyệt `openclaw` được quản lý khi WebSocket CDP
  theo từng tab khả dụng
- Ảnh chụp trang cho hồ sơ `existing-session` / Chrome MCP
- Ảnh chụp dựa trên ref của `existing-session` (`--ref`) từ đầu ra snapshot

Những gì vẫn cần Playwright:

- `navigate`
- `act`
- Snapshot AI phụ thuộc vào định dạng snapshot AI gốc của Playwright
- Ảnh chụp phần tử bằng CSS selector (`--element`)
- xuất PDF toàn bộ trình duyệt

Ảnh chụp phần tử cũng từ chối `--full-page`; route trả về `fullPage is
not supported for element screenshots`.

Nếu bạn thấy `Playwright is not available in this gateway build`, Gateway đóng gói
đang thiếu phụ thuộc runtime trình duyệt lõi. Cài đặt lại hoặc cập nhật
OpenClaw, rồi khởi động lại gateway. Với Docker, cũng cài đặt các binary trình duyệt
Chromium như bên dưới.

#### Cài đặt Docker Playwright

Nếu Gateway của bạn chạy trong Docker, tránh `npx playwright` (xung đột ghi đè npm).
Với image tùy chỉnh, đưa Chromium vào image:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Với image hiện có, cài đặt thông qua CLI đi kèm thay vào đó:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Để lưu bền các bản tải xuống trình duyệt, đặt `PLAYWRIGHT_BROWSERS_PATH` (ví dụ,
`/home/node/.cache/ms-playwright`) và bảo đảm `/home/node` được lưu bền qua
`OPENCLAW_HOME_VOLUME` hoặc bind mount. OpenClaw tự động phát hiện Chromium đã lưu bền
trên Linux. Xem [Docker](/vi/install/docker).

## Cách hoạt động (nội bộ)

Một máy chủ điều khiển local loopback nhỏ chấp nhận yêu cầu HTTP và kết nối tới các trình duyệt dựa trên Chromium qua CDP. Các hành động nâng cao (nhấp/nhập/snapshot/PDF) đi qua Playwright trên CDP; khi thiếu Playwright, chỉ các thao tác không dùng Playwright khả dụng. Agent thấy một giao diện ổn định trong khi trình duyệt và hồ sơ cục bộ/từ xa được hoán đổi tự do bên dưới.

## Tham chiếu nhanh CLI

Tất cả lệnh chấp nhận `--browser-profile <name>` để nhắm tới một hồ sơ cụ thể, và `--json` cho đầu ra máy đọc được.

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
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
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

- `upload` và `dialog` là các lệnh gọi **arming**; chạy chúng trước thao tác nhấp/nhấn kích hoạt bộ chọn/hộp thoại. Nếu một hành động mở modal, phản hồi hành động bao gồm `blockedByDialog` và `browserState.dialogs.pending`; truyền `dialogId` đó để phản hồi trực tiếp. Hộp thoại được xử lý bên ngoài OpenClaw xuất hiện dưới `browserState.dialogs.recent`.
- `click`/`type`/v.v. yêu cầu một `ref` từ `snapshot` (số `12`, ref vai trò `e12`, hoặc ref ARIA có thể thao tác `ax12`). CSS selector cố ý không được hỗ trợ cho hành động. Dùng `click-coords` khi vị trí viewport hiển thị là đích đáng tin cậy duy nhất.
- Đường dẫn tải xuống và trace bị giới hạn trong các thư mục tạm của OpenClaw: `/tmp/openclaw{,/downloads}` (dự phòng: `${os.tmpdir()}/openclaw/...`).
- `upload` chấp nhận tệp từ thư mục gốc tải lên tạm của OpenClaw và
  media đến do OpenClaw quản lý. Media đến được quản lý có thể được tham chiếu dưới dạng
  `media://inbound/<id>`, `media/inbound/<id>` tương đối với sandbox, hoặc một đường dẫn đã phân giải
  bên trong thư mục media đến được quản lý. Ref media lồng nhau,
  traversal, symlink, hardlink và đường dẫn cục bộ tùy ý vẫn bị từ chối.
- `upload` cũng có thể đặt input tệp trực tiếp qua `--input-ref` hoặc `--element`.

ID tab ổn định và nhãn vẫn tồn tại sau khi thay thế raw-target Chromium khi OpenClaw
có thể chứng minh tab thay thế, chẳng hạn cùng URL hoặc một tab cũ duy nhất trở thành
một tab mới duy nhất sau khi gửi biểu mẫu. ID đích thô vẫn dễ thay đổi; ưu tiên
`suggestedTargetId` từ `tabs` trong script.

Tổng quan nhanh về cờ snapshot:

- `--format ai` (mặc định với Playwright): bản chụp AI với refs dạng số (`aria-ref="<n>"`).
- `--format aria`: cây khả năng truy cập với refs `axN`. Khi có Playwright, OpenClaw liên kết refs bằng backend DOM ids với trang trực tiếp để các hành động tiếp theo có thể dùng chúng; nếu không, hãy xem đầu ra chỉ dùng để kiểm tra.
- `--efficient` (hoặc `--mode efficient`): preset bản chụp vai trò gọn nhẹ. Đặt `browser.snapshotDefaults.mode: "efficient"` để dùng tùy chọn này làm mặc định (xem [Cấu hình Gateway](/vi/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` buộc dùng bản chụp vai trò với refs `ref=e12`. `--frame "<iframe>"` giới hạn phạm vi bản chụp vai trò vào một iframe.
- Với Playwright, `--labels` thêm một ảnh chụp màn hình có nhãn ref phủ lên
  (in `MEDIA:<path>`) cùng một mảng `annotations` chứa hộp giới hạn của từng
  ref. Trên `screenshot`, nhãn được Playwright hỗ trợ hoạt động với `--full-page`,
  `--ref`, và `--element`; trên `snapshot`, ảnh chụp màn hình đi kèm vẫn chỉ
  theo viewport. Hồ sơ existing-session/chrome-mcp hiển thị nhãn phủ trên
  ảnh chụp màn hình trang nhưng không trả về `annotations` hoặc dùng trình trợ giúp
  chiếu full-page/ref/element của Playwright. Không có Playwright hoặc chrome-mcp,
  ảnh chụp màn hình có nhãn sẽ không khả dụng.
- `--urls` nối thêm các đích liên kết đã phát hiện vào bản chụp AI.

## Bản chụp và refs

OpenClaw hỗ trợ hai kiểu "snapshot":

- **Bản chụp AI (refs dạng số)**: `openclaw browser snapshot` (mặc định; `--format ai`)
  - Đầu ra: một bản chụp văn bản bao gồm refs dạng số.
  - Hành động: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Nội bộ, ref được phân giải qua `aria-ref` của Playwright.

- **Bản chụp vai trò (role refs như `e12`)**: `openclaw browser snapshot --interactive` (hoặc `--compact`, `--depth`, `--selector`, `--frame`)
  - Đầu ra: một danh sách/cây dựa trên vai trò với `[ref=e12]` (và tùy chọn `[nth=1]`).
  - Hành động: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Nội bộ, ref được phân giải qua `getByRole(...)` (cộng thêm `nth()` cho các mục trùng lặp).
  - Thêm `--labels` để bao gồm ảnh chụp màn hình có nhãn `e12` phủ lên. Trên
    các hồ sơ được Playwright hỗ trợ, tùy chọn này cũng trả về metadata hộp giới hạn
    theo từng ref (`annotations[]`).
  - Thêm `--urls` khi văn bản liên kết mơ hồ và tác nhân cần các đích
    điều hướng cụ thể.

- **Bản chụp ARIA (ARIA refs như `ax12`)**: `openclaw browser snapshot --format aria`
  - Đầu ra: cây khả năng truy cập dưới dạng các nút có cấu trúc.
  - Hành động: `openclaw browser click ax12` hoạt động khi đường dẫn bản chụp có thể liên kết
    ref qua Playwright và Chrome backend DOM ids.
- Nếu Playwright không khả dụng, bản chụp ARIA vẫn có thể hữu ích cho
  việc kiểm tra, nhưng refs có thể không dùng để thao tác được. Chụp lại với `--format ai`
  hoặc `--interactive` khi bạn cần refs cho hành động.
- Bằng chứng Docker cho đường dẫn dự phòng raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  khởi động Chromium với CDP, chạy `browser doctor --deep`, và xác minh bản chụp vai trò
  bao gồm URL liên kết, các mục có thể bấm được nâng cấp từ con trỏ, và metadata iframe.

Hành vi ref:

- Refs **không ổn định qua các lần điều hướng**; nếu có lỗi, chạy lại `snapshot` và dùng ref mới.
- `/act` trả về `targetId` thô hiện tại sau khi thay thế do hành động kích hoạt
  khi có thể chứng minh tab thay thế. Tiếp tục dùng id/nhãn tab ổn định cho
  các lệnh tiếp theo.
- Nếu bản chụp vai trò được lấy với `--frame`, role refs được giới hạn trong iframe đó cho đến bản chụp vai trò tiếp theo.
- Refs `axN` không xác định hoặc đã cũ sẽ lỗi nhanh thay vì rơi tiếp sang
  selector `aria-ref` của Playwright. Chạy bản chụp mới trên cùng tab khi
  điều đó xảy ra.

## Tăng cường chờ

Bạn có thể chờ nhiều thứ hơn là chỉ thời gian/văn bản:

- Chờ URL (Playwright hỗ trợ globs):
  - `openclaw browser wait --url "**/dash"`
- Chờ trạng thái tải:
  - `openclaw browser wait --load networkidle`
  - Được hỗ trợ trên các hồ sơ `openclaw` được quản lý và raw/remote CDP. Các hồ sơ `user` và `existing-session` từ chối `networkidle`; ở đó hãy dùng `--url`, `--text`, một selector, hoặc chờ `--fn`.
- Chờ một predicate JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Chờ một selector trở nên hiển thị:
  - `openclaw browser wait "#main"`

Các tùy chọn này có thể kết hợp:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Quy trình debug

Khi một hành động thất bại (ví dụ: "không hiển thị", "vi phạm chế độ nghiêm ngặt", "bị che phủ"):

1. `openclaw browser snapshot --interactive`
2. Dùng `click <ref>` / `type <ref>` (ưu tiên role refs trong chế độ tương tác)
3. Nếu vẫn thất bại: `openclaw browser highlight <ref>` để xem Playwright đang nhắm vào gì
4. Nếu trang hoạt động bất thường:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Để debug sâu: ghi trace:
   - `openclaw browser trace start`
   - tái hiện sự cố
   - `openclaw browser trace stop` (in `TRACE:<path>`)

## Đầu ra JSON

`--json` dành cho scripting và công cụ có cấu trúc.

Ví dụ:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Bản chụp vai trò trong JSON bao gồm `refs` cùng một khối `stats` nhỏ (lines/chars/refs/interactive) để công cụ có thể suy luận về kích thước và mật độ payload.

## Núm chỉnh trạng thái và môi trường

Các tùy chọn này hữu ích cho quy trình "làm cho trang web hoạt động như X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (`set headers --json '{"X-Debug":"1"}'` cũ vẫn được hỗ trợ)
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
  thực thi JavaScript tùy ý trong ngữ cảnh trang. Prompt injection có thể điều khiển
  hành vi này. Tắt bằng `browser.evaluateEnabled=false` nếu bạn không cần.
- `openclaw browser evaluate --fn` nhận nguồn hàm, biểu thức, hoặc
  thân câu lệnh. Thân câu lệnh được bọc thành hàm async, vì vậy hãy dùng
  `return` cho giá trị bạn muốn nhận lại. Dùng `--timeout-ms <ms>` khi
  hàm phía trang có thể cần lâu hơn timeout evaluate mặc định.
- Với ghi chú về đăng nhập và chống bot (X/Twitter, v.v.), xem [Đăng nhập trình duyệt + đăng bài X/Twitter](/vi/tools/browser-login).
- Giữ máy chủ Gateway/node ở chế độ riêng tư (loopback hoặc chỉ tailnet).
- Remote CDP endpoints rất mạnh; hãy tunnel và bảo vệ chúng.

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
- [Khắc phục sự cố Browser Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố Browser WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
