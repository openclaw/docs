---
read_when:
    - Tạo tập lệnh hoặc gỡ lỗi trình duyệt của tác nhân thông qua API điều khiển cục bộ
    - Đang tìm tài liệu tham khảo CLI `openclaw browser`
    - Thêm tính năng tự động hóa trình duyệt tùy chỉnh bằng snapshot và tham chiếu
summary: API điều khiển trình duyệt OpenClaw, tài liệu tham khảo CLI và các thao tác tạo tập lệnh
title: API điều khiển trình duyệt
x-i18n:
    generated_at: "2026-07-16T15:18:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Để thiết lập, cấu hình và khắc phục sự cố, xem [Trình duyệt](/vi/tools/browser).
Trang này là tài liệu tham khảo cho API HTTP điều khiển cục bộ, `openclaw browser`
CLI và các mẫu tạo tập lệnh (ảnh chụp trạng thái, tham chiếu, chờ, luồng gỡ lỗi).

## API điều khiển (tùy chọn)

Chỉ dành cho các tích hợp cục bộ, Gateway cung cấp một API HTTP loopback nhỏ.
Máy chủ độc lập này phải được chủ động bật — đặt biến môi trường
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` trong môi trường dịch vụ Gateway
và khởi động lại Gateway trước khi các điểm cuối HTTP khả dụng. Khi không có
biến này, runtime điều khiển trình duyệt vẫn hoạt động thông qua CLI và
các công cụ tác nhân, nhưng không có tiến trình nào lắng nghe trên cổng điều khiển loopback.

- Trạng thái/khởi động/dừng: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Hồ sơ: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Thẻ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Ảnh chụp trạng thái/ảnh chụp màn hình: `GET /snapshot`, `POST /screenshot`
- Hành động: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Tệp tải xuống: `POST /download`, `POST /wait/download`
- Quyền: `POST /permissions/grant`
- Gỡ lỗi: `GET /console`, `POST /pdf`
- Gỡ lỗi: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Mạng: `POST /response/body`
- Trạng thái: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Trạng thái: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Cài đặt: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` là dạng xử lý theo lô mà CLI sử dụng nội bộ cho
các lệnh con `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
khi trực tiếp viết tập lệnh, nên ưu tiên các tuyến thẻ chuyên biệt ở trên.

Tất cả điểm cuối đều chấp nhận `?profile=<name>`. `POST /start?headless=true` yêu cầu
khởi chạy không giao diện một lần cho các hồ sơ được quản lý cục bộ mà không thay đổi cấu hình
trình duyệt đã lưu; các hồ sơ chỉ đính kèm, CDP từ xa và phiên hiện có từ chối
ghi đè đó vì OpenClaw không khởi chạy các tiến trình trình duyệt này.

Đối với các điểm cuối thẻ, `targetId` là tên trường tương thích. Nên truyền
`suggestedTargetId` từ `GET /tabs` hoặc `POST /tabs/open`; nhãn và các định danh `tabId`
như `t1` cũng được chấp nhận. ID đích CDP thô và tiền tố ID đích thô
duy nhất vẫn hoạt động, nhưng chúng là các định danh chẩn đoán không ổn định.

Nếu xác thực Gateway bằng bí mật dùng chung được cấu hình, các tuyến HTTP của trình duyệt cũng yêu cầu xác thực:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` hoặc xác thực HTTP Basic bằng mật khẩu đó

Lưu ý:

- API trình duyệt loopback độc lập này **không** sử dụng các tiêu đề danh tính của proxy đáng tin cậy hoặc
  Tailscale Serve.
- Nếu `gateway.auth.mode` là `none` hoặc `trusted-proxy`, các tuyến trình duyệt loopback này
  không kế thừa các chế độ mang danh tính đó; chỉ cho phép truy cập qua loopback.

### Hợp đồng lỗi `/act`

`POST /act` sử dụng phản hồi lỗi có cấu trúc cho các lỗi xác thực ở cấp tuyến và
lỗi chính sách:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Các giá trị `code` hiện tại:

- `ACT_KIND_REQUIRED` (HTTP 400): thiếu hoặc không nhận diện được `kind`.
- `ACT_INVALID_REQUEST` (HTTP 400): tải trọng hành động không chuẩn hóa hoặc xác thực được.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` được dùng với loại hành động không được hỗ trợ.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (hoặc `wait --fn`) bị cấu hình vô hiệu hóa.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` cấp cao nhất hoặc theo lô xung đột với đích yêu cầu.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): hành động không được hỗ trợ cho các hồ sơ phiên hiện có.

Các lỗi runtime khác vẫn có thể trả về `{ "error": "<message>" }` mà không có
trường `code`.

### Yêu cầu về Playwright

Một số tính năng (điều hướng/hành động/ảnh chụp trạng thái AI/ảnh chụp trạng thái theo vai trò, ảnh chụp màn hình phần tử,
PDF) yêu cầu Playwright. Nếu chưa cài đặt Playwright, các điểm cuối đó trả về
lỗi 501 rõ ràng.

Những gì vẫn hoạt động khi không có Playwright:

- Ảnh chụp trạng thái ARIA
- Ảnh chụp trạng thái khả năng truy cập kiểu vai trò (`--interactive`, `--compact`,
  `--depth`, `--efficient`) khi có WebSocket CDP riêng cho từng thẻ. Đây là
  phương án dự phòng để kiểm tra và khám phá tham chiếu; Playwright vẫn là công cụ
  hành động chính.
- Ảnh chụp màn hình trang cho trình duyệt `openclaw` được quản lý khi có WebSocket
  CDP riêng cho từng thẻ
- Ảnh chụp màn hình trang cho các hồ sơ `existing-session` / Chrome MCP
- Ảnh chụp màn hình dựa trên tham chiếu `existing-session` (`--ref`) từ đầu ra ảnh chụp trạng thái

Những gì vẫn cần Playwright:

- `navigate`
- `act`
- Ảnh chụp trạng thái AI phụ thuộc vào định dạng ảnh chụp trạng thái AI gốc của Playwright
- Ảnh chụp màn hình phần tử bằng bộ chọn CSS (`--element`)
- Xuất toàn bộ trình duyệt sang PDF

Ảnh chụp màn hình phần tử cũng từ chối `--full-page`; tuyến trả về `fullPage is
not supported for element screenshots`.

Nếu thấy `Playwright is not available in this gateway build`, gói
Gateway đang thiếu phần phụ thuộc runtime trình duyệt cốt lõi. Cài đặt lại hoặc cập nhật
OpenClaw, sau đó khởi động lại Gateway. Đối với Docker, cũng cài đặt các tệp nhị phân
trình duyệt Chromium như minh họa bên dưới.

#### Cài đặt Playwright trên Docker

Nếu Gateway chạy trong Docker, tránh `npx playwright` (xung đột ghi đè npm).
Đối với ảnh tùy chỉnh, tích hợp Chromium vào ảnh:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Đối với ảnh hiện có, hãy cài đặt thông qua CLI đi kèm:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Để duy trì các tệp trình duyệt đã tải xuống, đặt `PLAYWRIGHT_BROWSERS_PATH` (ví dụ:
`/home/node/.cache/ms-playwright`) và bảo đảm `/home/node` được duy trì thông qua
`OPENCLAW_HOME_VOLUME` hoặc một bind mount. OpenClaw tự động phát hiện Chromium
được duy trì trên Linux. Xem [Docker](/vi/install/docker).

## Cách hoạt động (nội bộ)

Một máy chủ điều khiển loopback nhỏ chấp nhận các yêu cầu HTTP và kết nối với các trình duyệt dựa trên Chromium qua CDP. Các hành động nâng cao (nhấp/nhập/ảnh chụp trạng thái/PDF) đi qua Playwright trên CDP; khi thiếu Playwright, chỉ các thao tác không dùng Playwright mới khả dụng. Tác nhân sử dụng một giao diện ổn định duy nhất trong khi có thể tự do hoán đổi các trình duyệt và hồ sơ cục bộ/từ xa bên dưới.

## Tham khảo nhanh CLI

Tất cả lệnh đều chấp nhận `--browser-profile <name>` để nhắm đến một hồ sơ cụ thể và `--json` để tạo đầu ra có thể đọc bằng máy.

<AccordionGroup>

<Accordion title="Cơ bản: trạng thái, thẻ, mở/chuyển tiêu điểm/đóng">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # thêm phép dò ảnh chụp trạng thái trực tiếp
openclaw browser start
openclaw browser start --headless # khởi chạy không giao diện một lần, được quản lý cục bộ
openclaw browser stop            # cũng xóa mô phỏng trên CDP chỉ đính kèm/từ xa
openclaw browser reset-profile   # chuyển dữ liệu trình duyệt của hồ sơ vào Thùng rác
openclaw browser tabs
openclaw browser tab             # lối tắt cho thẻ hiện tại
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Hồ sơ: liệt kê, tạo, xóa">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Kiểm tra: ảnh chụp màn hình, ảnh chụp trạng thái, bảng điều khiển, lỗi, yêu cầu">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # hoặc --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Hành động: điều hướng, nhấp, nhập, kéo, chờ, đánh giá">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # hoặc e12 cho tham chiếu vai trò
openclaw browser click-coords 120 340        # tọa độ khung nhìn
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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

<Accordion title="Trạng thái: cookie, bộ nhớ, ngoại tuyến, tiêu đề, vị trí địa lý, thiết bị">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # dùng --clear để xóa
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Lưu ý:

- Công cụ `browser` dành cho tác nhân cung cấp `action=download` (`ref` và
  `path` bắt buộc) cùng `action=waitfordownload` (`path` tùy chọn). Cả hai đều trả về URL
  tải xuống đã lưu, tên tệp được đề xuất và đường dẫn cục bộ được bảo vệ. Tính năng chặn tải xuống
  rõ ràng khả dụng cho các hồ sơ Playwright được quản lý; hồ sơ dùng phiên hiện có
  trả về lỗi thao tác không được hỗ trợ.
- Ưu tiên tải lên nguyên tử qua trình chọn: truyền trình kích hoạt `--ref` cùng với nội dung tải lên để OpenClaw chuẩn bị và nhấp trong một yêu cầu. `upload` chỉ chứa đường dẫn vẫn được hỗ trợ khi chủ ý kích hoạt sau đó. Dùng `--input-ref` hoặc `--element` để đặt trực tiếp đầu vào tệp. `dialog` là lệnh chuẩn bị; chạy lệnh này trước thao tác nhấp/nhấn kích hoạt hộp thoại. Nếu một hành động mở hộp thoại phương thức, phản hồi hành động sẽ bao gồm `blockedByDialog` và `browserState.dialogs.pending`; truyền `dialogId` đó để phản hồi trực tiếp. Các hộp thoại được xử lý bên ngoài OpenClaw xuất hiện trong `browserState.dialogs.recent`.
- `click`/`type`/v.v. yêu cầu một `ref` từ `snapshot` (`12` dạng số, tham chiếu vai trò `e12` hoặc tham chiếu ARIA có thể thao tác `ax12`). Bộ chọn CSS được chủ ý không hỗ trợ cho các hành động. Dùng `click-coords` khi vị trí trong vùng hiển thị là mục tiêu đáng tin cậy duy nhất.
- Đường dẫn tải xuống và dấu vết bị giới hạn trong các thư mục tạm gốc của OpenClaw: `/tmp/openclaw{,/downloads}` (dự phòng: `${os.tmpdir()}/openclaw/...`).
- `upload` chấp nhận các tệp từ thư mục gốc tải lên tạm thời của OpenClaw và
  phương tiện đầu vào do OpenClaw quản lý. Có thể tham chiếu phương tiện đầu vào được quản lý dưới dạng
  `media://inbound/<id>`, `media/inbound/<id>` tương đối với sandbox hoặc một đường dẫn đã phân giải
  bên trong thư mục phương tiện đầu vào được quản lý. Tham chiếu phương tiện lồng nhau,
  duyệt xuyên thư mục, liên kết tượng trưng, liên kết cứng và đường dẫn cục bộ tùy ý vẫn bị từ chối.
- `upload` cũng có thể đặt trực tiếp đầu vào tệp qua `--input-ref` hoặc `--element`.

ID và nhãn thẻ ổn định vẫn tồn tại sau khi mục tiêu thô của Chromium bị thay thế nếu OpenClaw
có thể xác minh thẻ thay thế, chẳng hạn như một cặp cũ/mới duy nhất cho cùng URL hoặc
một thẻ cũ duy nhất trở thành một thẻ mới duy nhất sau khi gửi biểu mẫu. Các trường hợp thay thế
có URL trùng lặp và không rõ ràng sẽ nhận handle mới. ID mục tiêu thô vẫn
không ổn định; ưu tiên `suggestedTargetId` từ `tabs` trong tập lệnh.

Tổng quan nhanh về các cờ ảnh chụp:

- `--format ai` (mặc định với Playwright): ảnh chụp AI với tham chiếu dạng số (`aria-ref="<n>"`).
- `--format aria`: cây khả năng truy cập với tham chiếu `axN`. Khi có Playwright, OpenClaw liên kết các tham chiếu bằng ID DOM phía backend với trang đang hoạt động để các hành động tiếp theo có thể sử dụng chúng; nếu không, chỉ xem đầu ra là dữ liệu để kiểm tra.
- `--efficient` (hoặc `--mode efficient`): cấu hình sẵn ảnh chụp vai trò dạng gọn. Đặt `browser.snapshotDefaults.mode: "efficient"` để dùng cấu hình này làm mặc định (xem [cấu hình Gateway](/vi/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` buộc tạo ảnh chụp vai trò với tham chiếu `ref=e12`. `--frame "<iframe>"` giới hạn ảnh chụp vai trò trong một iframe.
- Với Playwright, `--labels` thêm ảnh chụp màn hình có nhãn tham chiếu phủ lên
  (in `MEDIA:<path>`) cùng một mảng `annotations` chứa hộp giới hạn của từng tham chiếu.
  Trên `screenshot`, các nhãn do Playwright hỗ trợ hoạt động với `--full-page`,
  `--ref` và `--element`; trên `snapshot`, ảnh chụp màn hình đi kèm vẫn
  chỉ bao gồm vùng hiển thị. Các hồ sơ phiên hiện có/chrome-mcp hiển thị nhãn phủ trên
  ảnh chụp màn hình trang nhưng không trả về `annotations` hoặc sử dụng trình trợ giúp chiếu
  toàn trang/tham chiếu/phần tử của Playwright. Nếu không có Playwright hoặc chrome-mcp,
  ảnh chụp màn hình có nhãn không khả dụng.
- `--urls` nối thêm các đích liên kết đã phát hiện vào ảnh chụp AI.

## Ảnh chụp và tham chiếu

OpenClaw hỗ trợ hai kiểu "ảnh chụp":

- **Ảnh chụp AI (tham chiếu dạng số)**: `openclaw browser snapshot` (mặc định; `--format ai`)
  - Đầu ra: ảnh chụp dạng văn bản bao gồm các tham chiếu dạng số.
  - Hành động: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Trong nội bộ, tham chiếu được phân giải qua `aria-ref` của Playwright.

- **Ảnh chụp vai trò (tham chiếu vai trò như `e12`)**: `openclaw browser snapshot --interactive` (hoặc `--compact`, `--depth`, `--selector`, `--frame`)
  - Đầu ra: danh sách/cây dựa trên vai trò với `[ref=e12]` (và `[nth=1]` tùy chọn).
  - Hành động: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Trong nội bộ, tham chiếu được phân giải qua `getByRole(...)` (cộng thêm `nth()` cho các mục trùng lặp).
  - Thêm `--labels` để bao gồm ảnh chụp màn hình có các nhãn `e12` phủ lên. Trên
    các hồ sơ do Playwright hỗ trợ, thao tác này cũng trả về siêu dữ liệu hộp giới hạn cho từng tham chiếu
    (`annotations[]`).
  - Thêm `--urls` khi văn bản liên kết không rõ ràng và tác nhân cần các
    đích điều hướng cụ thể.

- **Ảnh chụp ARIA (tham chiếu ARIA như `ax12`)**: `openclaw browser snapshot --format aria`
  - Đầu ra: cây khả năng truy cập dưới dạng các nút có cấu trúc.
  - Hành động: `openclaw browser click ax12` hoạt động khi đường dẫn ảnh chụp có thể liên kết
    tham chiếu thông qua Playwright và ID DOM phía backend của Chrome.
- Nếu Playwright không khả dụng, ảnh chụp ARIA vẫn có thể hữu ích để
  kiểm tra, nhưng các tham chiếu có thể không thao tác được. Chụp lại bằng `--format ai`
  hoặc `--interactive` khi cần tham chiếu hành động.
- Bằng chứng Docker cho đường dẫn dự phòng CDP thô: `pnpm test:docker:browser-cdp-snapshot`
  khởi động Chromium với CDP, chạy `browser doctor --deep` và xác minh rằng ảnh chụp vai trò
  bao gồm URL liên kết, các phần tử có thể nhấp được suy ra từ con trỏ và siêu dữ liệu iframe.

Hành vi của tham chiếu:

- Các tham chiếu **không ổn định qua các lần điều hướng**; nếu có lỗi, hãy chạy lại `snapshot` và dùng tham chiếu mới.
- `/act` trả về `targetId` thô hiện tại sau khi có thay thế do hành động kích hoạt
  nếu có thể xác minh thẻ thay thế. Tiếp tục dùng ID/nhãn thẻ ổn định cho
  các lệnh tiếp theo.
- Nếu ảnh chụp vai trò được tạo bằng `--frame`, các tham chiếu vai trò bị giới hạn trong iframe đó cho đến ảnh chụp vai trò tiếp theo.
- Các tham chiếu `axN` không xác định hoặc đã cũ sẽ thất bại ngay thay vì chuyển tiếp sang
  bộ chọn `aria-ref` của Playwright. Khi điều đó xảy ra, hãy tạo ảnh chụp mới trên cùng thẻ.

## Khả năng chờ nâng cao

Bạn có thể chờ nhiều điều hơn ngoài thời gian/văn bản:

- Chờ URL (Playwright hỗ trợ glob):
  - `openclaw browser wait --url "**/dash"`
- Chờ trạng thái tải:
  - `openclaw browser wait --load networkidle`
  - Được hỗ trợ trên `openclaw` được quản lý và các hồ sơ CDP thô/từ xa. Các hồ sơ dùng trình điều khiển `existing-session` (bao gồm hồ sơ `user` mặc định) từ chối `networkidle`; tại đó, hãy dùng `--url`, `--text`, một bộ chọn hoặc thời gian chờ `--fn`.
- Chờ một biểu thức điều kiện JS:
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

Khi một hành động thất bại (ví dụ: "không hiển thị", "vi phạm chế độ nghiêm ngặt", "bị che"):

1. `openclaw browser snapshot --interactive`
2. Dùng `click <ref>` / `type <ref>` (ưu tiên tham chiếu vai trò trong chế độ tương tác)
3. Nếu vẫn thất bại: dùng `openclaw browser highlight <ref>` để xem Playwright đang nhắm đến đối tượng nào
4. Nếu trang hoạt động bất thường:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Để gỡ lỗi chuyên sâu: ghi lại dấu vết:
   - `openclaw browser trace start`
   - tái hiện sự cố
   - `openclaw browser trace stop` (in `TRACE:<path>`)

## Đầu ra JSON

`--json` dành cho tập lệnh và công cụ có cấu trúc.

Ví dụ:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Ảnh chụp vai trò trong JSON bao gồm `refs` cùng một khối `stats` nhỏ (dòng/ký tự/tham chiếu/tương tác) để các công cụ có thể suy luận về kích thước và mật độ tải trọng.

## Các tùy chọn điều chỉnh trạng thái và môi trường

Các tùy chọn này hữu ích cho quy trình "làm cho trang web hoạt động giống X":

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Bộ nhớ: `storage local|session get|set|clear`
- Ngoại tuyến: `set offline on|off`
- Tiêu đề: `set headers --headers-json '{"X-Debug":"1"}'` (hoặc dạng theo vị trí `set headers '{"X-Debug":"1"}'`)
- Xác thực HTTP cơ bản: `set credentials user pass` (hoặc `--clear`)
- Vị trí địa lý: `set geo <lat> <lon> --origin "https://example.com"` (hoặc `--clear`)
- Phương tiện: `set media dark|light|no-preference|none`
- Múi giờ / ngôn ngữ: `set timezone ...`, `set locale ...`
- Thiết bị / vùng hiển thị:
  - `set device "iPhone 14"` (cấu hình thiết bị sẵn có của Playwright)
  - `set viewport 1280 720`

## Bảo mật và quyền riêng tư

- Hồ sơ trình duyệt openclaw có thể chứa các phiên đã đăng nhập; hãy coi hồ sơ này là dữ liệu nhạy cảm.
- `browser act kind=evaluate` / `openclaw browser evaluate` và `wait --fn`
  thực thi JavaScript tùy ý trong ngữ cảnh trang. Tấn công chèn câu lệnh có thể điều hướng
  hành vi này. Vô hiệu hóa bằng `browser.evaluateEnabled=false` nếu không cần.
- `openclaw browser evaluate --fn` chấp nhận mã nguồn hàm, biểu thức hoặc
  thân câu lệnh. Thân câu lệnh được bọc thành hàm bất đồng bộ, vì vậy hãy dùng
  `return` cho giá trị muốn nhận lại. Dùng `--timeout-ms <ms>` khi hàm
  phía trang có thể cần nhiều thời gian hơn thời gian chờ đánh giá mặc định.
- Để biết ghi chú về đăng nhập và chống bot (X/Twitter, v.v.), xem [Đăng nhập trình duyệt + đăng bài lên X/Twitter](/vi/tools/browser-login).
- Giữ máy chủ Gateway/node ở chế độ riêng tư (chỉ loopback hoặc tailnet).
- Các điểm cuối CDP từ xa có quyền năng lớn; hãy tạo đường hầm và bảo vệ chúng.

Ví dụ chế độ nghiêm ngặt (mặc định chặn các đích riêng tư/nội bộ):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // tùy chọn cho phép khớp chính xác
    },
  },
}
```

## Liên quan

- [Trình duyệt](/vi/tools/browser) - tổng quan, cấu hình, hồ sơ, bảo mật
- [Đăng nhập trình duyệt](/vi/tools/browser-login) - đăng nhập vào các trang web
- [Khắc phục sự cố trình duyệt trên Linux](/vi/tools/browser-linux-troubleshooting)
- [Khắc phục sự cố trình duyệt trên WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
