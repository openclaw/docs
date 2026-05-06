---
read_when:
    - Thêm tự động hóa trình duyệt do tác nhân điều khiển
    - Gỡ lỗi vì sao OpenClaw đang can thiệp vào Chrome của chính bạn
    - Triển khai cài đặt trình duyệt + vòng đời trong ứng dụng macOS
summary: Dịch vụ điều khiển trình duyệt tích hợp + các lệnh hành động
title: Trình duyệt (do OpenClaw quản lý)
x-i18n:
    generated_at: "2026-05-06T17:59:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw có thể chạy một **hồ sơ Chrome/Brave/Edge/Chromium chuyên dụng** do tác nhân điều khiển.
Nó được tách biệt khỏi trình duyệt cá nhân của bạn và được quản lý thông qua một dịch vụ điều khiển cục bộ nhỏ bên trong Gateway (chỉ loopback).

Góc nhìn cho người mới bắt đầu:

- Hãy xem nó như một **trình duyệt riêng, chỉ dành cho tác nhân**.
- Hồ sơ `openclaw` **không** chạm vào hồ sơ trình duyệt cá nhân của bạn.
- Tác nhân có thể **mở tab, đọc trang, nhấp và nhập** trong một luồng an toàn.
- Hồ sơ `user` tích hợp sẵn gắn vào phiên Chrome thật đã đăng nhập của bạn thông qua Chrome MCP.

## Bạn nhận được gì

- Một hồ sơ trình duyệt riêng tên là **openclaw** (mặc định có điểm nhấn màu cam).
- Điều khiển tab xác định được (liệt kê/mở/tập trung/đóng).
- Hành động của tác nhân (nhấp/nhập/kéo/chọn), snapshot, ảnh chụp màn hình, PDF.
- Một skill `browser-automation` đi kèm, hướng dẫn tác nhân về snapshot,
  tab ổn định, tham chiếu lỗi thời và vòng lặp khôi phục khi có chặn thủ công
  khi Plugin trình duyệt được bật.
- Hỗ trợ nhiều hồ sơ tùy chọn (`openclaw`, `work`, `remote`, ...).

Trình duyệt này **không** phải trình duyệt dùng hằng ngày của bạn. Nó là một bề mặt an toàn, tách biệt cho
tự động hóa và xác minh của tác nhân.

## Bắt đầu nhanh

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Nếu bạn nhận được "Browser disabled", hãy bật nó trong cấu hình (xem bên dưới) và khởi động lại
Gateway.

Nếu `openclaw browser` hoàn toàn không có, hoặc tác nhân nói rằng công cụ trình duyệt
không khả dụng, hãy chuyển đến [Thiếu lệnh hoặc công cụ trình duyệt](/vi/tools/browser#missing-browser-command-or-tool).

## Kiểm soát Plugin

Công cụ `browser` mặc định là một Plugin đi kèm. Tắt nó để thay bằng một Plugin khác đăng ký cùng tên công cụ `browser`:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Mặc định cần cả `plugins.entries.browser.enabled` **và** `browser.enabled=true`. Chỉ tắt Plugin sẽ loại bỏ CLI `openclaw browser`, phương thức Gateway `browser.request`, công cụ tác nhân và dịch vụ điều khiển như một đơn vị; cấu hình `browser.*` của bạn vẫn được giữ nguyên cho phần thay thế.

Các thay đổi cấu hình trình duyệt yêu cầu khởi động lại Gateway để Plugin có thể đăng ký lại dịch vụ của nó.

## Hướng dẫn cho tác nhân

Ghi chú về hồ sơ công cụ: `tools.profile: "coding"` bao gồm `web_search` và
`web_fetch`, nhưng không bao gồm đầy đủ công cụ `browser`. Nếu tác nhân hoặc một
tác nhân con được tạo cần dùng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn
hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Đối với một tác nhân đơn, dùng `agents.list[].tools.alsoAllow: ["browser"]`.
Chỉ riêng `tools.subagents.tools.allow: ["browser"]` là chưa đủ vì chính sách tác nhân con
được áp dụng sau khi lọc hồ sơ.

Plugin trình duyệt cung cấp hai cấp hướng dẫn cho tác nhân:

- Mô tả công cụ `browser` mang hợp đồng nhỏ gọn luôn bật: chọn
  đúng hồ sơ, giữ tham chiếu trên cùng một tab, dùng `tabId`/nhãn để nhắm mục tiêu
  tab, và tải skill trình duyệt cho công việc nhiều bước.
- Skill `browser-automation` đi kèm mang vòng lặp vận hành dài hơn:
  kiểm tra trạng thái/tab trước, gắn nhãn tab tác vụ, snapshot trước khi hành động, snapshot lại
  sau các thay đổi UI, khôi phục tham chiếu lỗi thời một lần, và báo cáo đăng nhập/2FA/captcha hoặc
  chặn camera/microphone là hành động thủ công thay vì đoán.

Skills đi kèm Plugin được liệt kê trong các Skills khả dụng của tác nhân khi
Plugin được bật. Hướng dẫn đầy đủ của skill được tải theo nhu cầu, nên các lượt
thường ngày không phải trả toàn bộ chi phí token.

## Thiếu lệnh hoặc công cụ trình duyệt

Nếu `openclaw browser` không được nhận biết sau khi nâng cấp, `browser.request` bị thiếu, hoặc tác nhân báo cáo công cụ trình duyệt không khả dụng, nguyên nhân thường gặp là danh sách `plugins.allow` bỏ sót `browser` và không có khối cấu hình gốc `browser`. Hãy thêm nó:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Một khối `browser` gốc rõ ràng, ví dụ `browser.enabled=true` hoặc `browser.profiles.<name>`, kích hoạt Plugin trình duyệt đi kèm ngay cả dưới một `plugins.allow` hạn chế, khớp với hành vi cấu hình kênh. Bản thân `plugins.entries.browser.enabled=true` và `tools.alsoAllow: ["browser"]` không thay thế tư cách thành viên trong danh sách cho phép. Xóa hẳn `plugins.allow` cũng khôi phục mặc định.

## Hồ sơ: `openclaw` so với `user`

- `openclaw`: trình duyệt được quản lý, tách biệt (không yêu cầu extension).
- `user`: hồ sơ gắn Chrome MCP tích hợp sẵn cho phiên **Chrome thật đã đăng nhập**
  của bạn.

Đối với lệnh gọi công cụ trình duyệt của tác nhân:

- Mặc định: dùng trình duyệt `openclaw` tách biệt.
- Ưu tiên `profile="user"` khi các phiên đã đăng nhập hiện có là quan trọng và người dùng
  đang ở máy tính để nhấp/phê duyệt mọi lời nhắc gắn kết.
- `profile` là phần ghi đè rõ ràng khi bạn muốn một chế độ trình duyệt cụ thể.

Đặt `browser.defaultProfile: "openclaw"` nếu bạn muốn chế độ được quản lý là mặc định.

## Cấu hình

Thiết lập trình duyệt nằm trong `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Ports and reachability">

- Dịch vụ điều khiển bind vào loopback trên một cổng được suy ra từ `gateway.port` (mặc định `18791` = gateway + 2). Ghi đè `gateway.port` hoặc `OPENCLAW_GATEWAY_PORT` sẽ dịch chuyển các cổng được suy ra trong cùng nhóm.
- Các hồ sơ `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl`; chỉ đặt các giá trị đó cho CDP từ xa. `cdpUrl` mặc định là cổng CDP cục bộ được quản lý khi chưa đặt.
- `remoteCdpTimeoutMs` áp dụng cho các kiểm tra khả năng truy cập HTTP CDP từ xa và `attachOnly`
  cũng như các yêu cầu HTTP mở tab; `remoteCdpHandshakeTimeoutMs` áp dụng cho
  các bắt tay CDP WebSocket của chúng.
- `localLaunchTimeoutMs` là ngân sách thời gian để một tiến trình Chrome được quản lý khởi chạy cục bộ
  phơi bày endpoint HTTP CDP của nó. `localCdpReadyTimeoutMs` là
  ngân sách tiếp theo cho độ sẵn sàng websocket CDP sau khi tiến trình được phát hiện.
  Tăng các giá trị này trên Raspberry Pi, VPS cấu hình thấp hoặc phần cứng cũ hơn nơi Chromium
  khởi động chậm. Giá trị phải là số nguyên dương tối đa `120000` ms; các giá trị
  cấu hình không hợp lệ sẽ bị từ chối.
- Các lỗi khởi chạy/sẵn sàng Chrome được quản lý lặp lại được ngắt mạch theo từng
  hồ sơ. Sau vài lỗi liên tiếp, OpenClaw tạm dừng các lần thử khởi chạy mới
  trong thời gian ngắn thay vì spawn Chromium trên mọi lệnh gọi công cụ trình duyệt. Hãy sửa
  vấn đề khởi động, tắt trình duyệt nếu không cần, hoặc khởi động lại
  Gateway sau khi sửa.
- `actionTimeoutMs` là ngân sách mặc định cho các yêu cầu `act` của trình duyệt khi bên gọi không truyền `timeoutMs`. Lớp truyền tải client thêm một khoảng dư nhỏ để các lượt chờ dài có thể hoàn tất thay vì hết thời gian ở ranh giới HTTP.
- `tabCleanup` là dọn dẹp best-effort cho các tab được mở bởi phiên trình duyệt tác nhân chính. Dọn dẹp vòng đời của tác nhân con, cron và ACP vẫn đóng các tab được theo dõi rõ ràng của chúng khi kết thúc phiên; các phiên chính giữ tab đang hoạt động để có thể tái sử dụng, rồi đóng các tab được theo dõi đang nhàn rỗi hoặc vượt mức trong nền.

</Accordion>

<Accordion title="SSRF policy">

- Điều hướng trình duyệt và mở tab được bảo vệ SSRF trước khi điều hướng và được kiểm tra lại best-effort trên URL `http(s)` cuối cùng sau đó.
- Trong chế độ SSRF nghiêm ngặt, phát hiện endpoint CDP từ xa và các probe `/json/version` (`cdpUrl`) cũng được kiểm tra.
- Các biến môi trường Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và `NO_PROXY` không tự động proxy trình duyệt do OpenClaw quản lý. Chrome được quản lý mặc định khởi chạy trực tiếp để thiết lập proxy của provider không làm suy yếu các kiểm tra SSRF của trình duyệt.
- Để proxy chính trình duyệt được quản lý, truyền các cờ proxy Chrome rõ ràng qua `browser.extraArgs`, chẳng hạn `--proxy-server=...` hoặc `--proxy-pac-url=...`. Chế độ SSRF nghiêm ngặt chặn định tuyến proxy trình duyệt rõ ràng trừ khi quyền truy cập trình duyệt vào mạng riêng được bật có chủ ý.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` mặc định tắt; chỉ bật khi quyền truy cập trình duyệt vào mạng riêng được tin cậy có chủ ý.
- `browser.ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ như một bí danh cũ.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` nghĩa là không bao giờ khởi chạy trình duyệt cục bộ; chỉ gắn vào nếu đã có một trình duyệt đang chạy.
- `headless` có thể được đặt toàn cục hoặc theo từng hồ sơ được quản lý cục bộ. Giá trị theo hồ sơ ghi đè `browser.headless`, nên một hồ sơ được khởi chạy cục bộ có thể duy trì chế độ headless trong khi hồ sơ khác vẫn hiển thị.
- `POST /start?headless=true` và `openclaw browser start --headless` yêu cầu một lần khởi chạy headless
  cho các hồ sơ được quản lý cục bộ mà không ghi lại
  `browser.headless` hoặc cấu hình hồ sơ. Các hồ sơ phiên hiện có, chỉ gắn vào, và
  CDP từ xa từ chối ghi đè vì OpenClaw không khởi chạy các
  tiến trình trình duyệt đó.
- Trên máy chủ Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, các hồ sơ được quản lý cục bộ
  mặc định tự động dùng headless khi cả môi trường lẫn cấu hình hồ sơ/toàn cục
  đều không chọn rõ chế độ có giao diện. `openclaw browser status --json`
  báo cáo `headlessSource` là `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, hoặc `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` buộc các lần khởi chạy được quản lý cục bộ dùng headless cho
  tiến trình hiện tại. `OPENCLAW_BROWSER_HEADLESS=0` buộc chế độ có giao diện cho các lần
  khởi động thông thường và trả về lỗi có hướng xử lý trên máy chủ Linux không có máy chủ hiển thị;
  một yêu cầu `start --headless` rõ ràng vẫn được ưu tiên cho riêng lần khởi chạy đó.
- `executablePath` có thể được đặt toàn cục hoặc theo từng hồ sơ được quản lý cục bộ. Giá trị theo hồ sơ ghi đè `browser.executablePath`, nên các hồ sơ được quản lý khác nhau có thể khởi chạy các trình duyệt dựa trên Chromium khác nhau. Cả hai dạng đều chấp nhận `~` cho thư mục home của hệ điều hành của bạn.
- `color` (cấp cao nhất và theo hồ sơ) tô màu giao diện người dùng của trình duyệt để bạn có thể biết hồ sơ nào đang hoạt động.
- Hồ sơ mặc định là `openclaw` (độc lập được quản lý). Dùng `defaultProfile: "user"` để chọn dùng trình duyệt người dùng đã đăng nhập.
- Thứ tự tự động phát hiện: trình duyệt mặc định của hệ thống nếu dựa trên Chromium; nếu không thì Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` dùng Chrome DevTools MCP thay vì CDP thô. Không đặt `cdpUrl` cho driver đó.
- Đặt `browser.profiles.<name>.userDataDir` khi một hồ sơ phiên hiện có cần gắn vào một hồ sơ người dùng Chromium không mặc định (Brave, Edge, v.v.). Đường dẫn này cũng chấp nhận `~` cho thư mục home của hệ điều hành của bạn.

</Accordion>

</AccordionGroup>

## Dùng Brave hoặc một trình duyệt dựa trên Chromium khác

Nếu trình duyệt **mặc định của hệ thống** của bạn dựa trên Chromium (Chrome/Brave/Edge/v.v.),
OpenClaw sẽ tự động dùng trình duyệt đó. Đặt `browser.executablePath` để ghi đè
tự động phát hiện. Giá trị `executablePath` cấp cao nhất và theo hồ sơ chấp nhận `~`
cho thư mục home của hệ điều hành của bạn:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Hoặc đặt trong cấu hình, theo từng nền tảng:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` theo hồ sơ chỉ ảnh hưởng đến các hồ sơ được quản lý cục bộ mà OpenClaw
khởi chạy. Các hồ sơ `existing-session` thay vào đó gắn vào một trình duyệt đang chạy sẵn,
và các hồ sơ CDP từ xa dùng trình duyệt đứng sau `cdpUrl`.

## Điều khiển cục bộ so với từ xa

- **Điều khiển cục bộ (mặc định):** Gateway khởi động dịch vụ điều khiển local loopback và có thể khởi chạy trình duyệt cục bộ.
- **Điều khiển từ xa (máy chủ Node):** chạy máy chủ Node trên máy có trình duyệt; Gateway chuyển tiếp hành động trình duyệt đến máy đó.
- **CDP từ xa:** đặt `browser.profiles.<name>.cdpUrl` (hoặc `browser.cdpUrl`) để
  gắn vào một trình duyệt dựa trên Chromium từ xa. Trong trường hợp này, OpenClaw sẽ không khởi chạy trình duyệt cục bộ.
- Với các dịch vụ CDP được quản lý bên ngoài trên loopback (ví dụ Browserless trong
  Docker được publish tới `127.0.0.1`), cũng đặt `attachOnly: true`. CDP loopback
  không có `attachOnly` được xem là hồ sơ trình duyệt được OpenClaw quản lý cục bộ.
- `headless` chỉ ảnh hưởng đến các hồ sơ được quản lý cục bộ mà OpenClaw khởi chạy. Nó không khởi động lại hoặc thay đổi các trình duyệt phiên hiện có hoặc CDP từ xa.
- `executablePath` tuân theo cùng quy tắc hồ sơ được quản lý cục bộ. Việc thay đổi nó trên một
  hồ sơ được quản lý cục bộ đang chạy sẽ đánh dấu hồ sơ đó để khởi động lại/đồng bộ, để
  lần khởi chạy tiếp theo dùng binary mới.

Hành vi dừng khác nhau theo chế độ hồ sơ:

- hồ sơ được quản lý cục bộ: `openclaw browser stop` dừng tiến trình trình duyệt mà
  OpenClaw đã khởi chạy
- hồ sơ chỉ gắn vào và CDP từ xa: `openclaw browser stop` đóng phiên điều khiển
  đang hoạt động và giải phóng các ghi đè mô phỏng Playwright/CDP (viewport,
  bảng màu, locale, timezone, chế độ ngoại tuyến, và trạng thái tương tự), dù
  không có tiến trình trình duyệt nào được OpenClaw khởi chạy

URL CDP từ xa có thể bao gồm thông tin xác thực:

- Token truy vấn (ví dụ: `https://provider.example?token=<token>`)
- Xác thực HTTP Basic (ví dụ: `https://user:pass@provider.example`)

OpenClaw giữ nguyên thông tin xác thực khi gọi các endpoint `/json/*` và khi kết nối
tới CDP WebSocket. Ưu tiên biến môi trường hoặc trình quản lý bí mật cho
token thay vì commit chúng vào các tệp cấu hình.

## Proxy trình duyệt Node (mặc định không cần cấu hình)

Nếu bạn chạy một **máy chủ Node** trên máy có trình duyệt của bạn, OpenClaw có thể
tự động định tuyến các lệnh gọi công cụ trình duyệt đến Node đó mà không cần cấu hình trình duyệt bổ sung.
Đây là đường dẫn mặc định cho các gateway từ xa.

Ghi chú:

- Máy chủ Node cung cấp máy chủ điều khiển trình duyệt cục bộ của nó qua một **lệnh proxy**.
- Hồ sơ lấy từ cấu hình `browser.profiles` riêng của Node (giống như cục bộ).
- `nodeHost.browserProxy.allowProfiles` là tùy chọn. Để trống để dùng hành vi cũ/mặc định: tất cả hồ sơ đã cấu hình vẫn truy cập được qua proxy, bao gồm các route tạo/xóa hồ sơ.
- Nếu bạn đặt `nodeHost.browserProxy.allowProfiles`, OpenClaw xem đó là ranh giới đặc quyền tối thiểu: chỉ các hồ sơ trong danh sách cho phép mới có thể được nhắm tới, và các route tạo/xóa hồ sơ lâu dài bị chặn trên bề mặt proxy.
- Tắt nếu bạn không muốn dùng:
  - Trên Node: `nodeHost.browserProxy.enabled=false`
  - Trên gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP từ xa được lưu trữ)

[Browserless](https://browserless.io) là một dịch vụ Chromium được lưu trữ, cung cấp
URL kết nối CDP qua HTTPS và WebSocket. OpenClaw có thể dùng một trong hai dạng, nhưng
với hồ sơ trình duyệt từ xa, tùy chọn đơn giản nhất là URL WebSocket trực tiếp
từ tài liệu kết nối của Browserless.

Ví dụ:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Ghi chú:

- Thay `<BROWSERLESS_API_KEY>` bằng token Browserless thật của bạn.
- Chọn endpoint khu vực khớp với tài khoản Browserless của bạn (xem tài liệu của họ).
- Nếu Browserless cung cấp cho bạn một URL cơ sở HTTPS, bạn có thể chuyển đổi nó thành
  `wss://` cho kết nối CDP trực tiếp hoặc giữ URL HTTPS và để OpenClaw
  khám phá `/json/version`.

### Browserless Docker trên cùng máy chủ

Khi Browserless tự lưu trữ trong Docker và OpenClaw chạy trên máy chủ, hãy xem
Browserless là một dịch vụ CDP được quản lý bên ngoài:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Địa chỉ trong `browser.profiles.browserless.cdpUrl` phải truy cập được từ
tiến trình OpenClaw. Browserless cũng phải quảng bá một endpoint tương ứng có thể truy cập được;
đặt `EXTERNAL` của Browserless thành cùng cơ sở WebSocket công khai-đến-OpenClaw đó, chẳng hạn
như `ws://127.0.0.1:3000`, `ws://browserless:3000`, hoặc một địa chỉ mạng Docker
riêng ổn định. Nếu `/json/version` trả về `webSocketDebuggerUrl` trỏ tới
một địa chỉ OpenClaw không thể truy cập, CDP HTTP có thể trông khỏe mạnh trong khi việc
gắn WebSocket vẫn thất bại.

Đừng để `attachOnly` chưa đặt cho hồ sơ Browserless loopback. Nếu không có
`attachOnly`, OpenClaw xem cổng loopback là một hồ sơ trình duyệt được quản lý cục bộ
và có thể báo rằng cổng đang được dùng nhưng không thuộc sở hữu của OpenClaw.

## Nhà cung cấp CDP WebSocket trực tiếp

Một số dịch vụ trình duyệt được lưu trữ cung cấp endpoint **WebSocket trực tiếp** thay vì
khám phá CDP dựa trên HTTP tiêu chuẩn (`/json/version`). OpenClaw chấp nhận ba
dạng URL CDP và tự động chọn chiến lược kết nối phù hợp:

- **Khám phá HTTP(S)** - `http://host[:port]` hoặc `https://host[:port]`.
  OpenClaw gọi `/json/version` để khám phá URL trình gỡ lỗi WebSocket, rồi
  kết nối. Không có dự phòng WebSocket.
- **Endpoint WebSocket trực tiếp** - `ws://host[:port]/devtools/<kind>/<id>` hoặc
  `wss://...` với đường dẫn `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw kết nối trực tiếp qua bắt tay WebSocket và bỏ qua hoàn toàn
  `/json/version`.
- **Gốc WebSocket trần** - `ws://host[:port]` hoặc `wss://host[:port]` không có
  đường dẫn `/devtools/...` (ví dụ: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw thử khám phá HTTP
  `/json/version` trước (chuẩn hóa scheme thành `http`/`https`);
  nếu khám phá trả về `webSocketDebuggerUrl` thì nó được dùng, nếu không OpenClaw
  dự phòng sang bắt tay WebSocket trực tiếp tại gốc trần. Nếu endpoint WebSocket
  được quảng bá từ chối bắt tay CDP nhưng gốc trần đã cấu hình
  chấp nhận nó, OpenClaw cũng dự phòng sang gốc đó. Điều này cho phép một `ws://` trần
  trỏ tới Chrome cục bộ vẫn kết nối, vì Chrome chỉ chấp nhận nâng cấp WebSocket
  trên đường dẫn theo target cụ thể từ `/json/version`, trong khi các nhà cung cấp
  được lưu trữ vẫn có thể dùng endpoint WebSocket gốc của họ khi endpoint khám phá
  quảng bá một URL ngắn hạn không phù hợp cho Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) là một nền tảng đám mây để chạy
trình duyệt headless với khả năng giải CAPTCHA tích hợp, chế độ tàng hình, và proxy
dân cư.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Ghi chú:

- [Đăng ký](https://www.browserbase.com/sign-up) và sao chép **API Key** của bạn
  từ [bảng điều khiển Tổng quan](https://www.browserbase.com/overview).
- Thay `<BROWSERBASE_API_KEY>` bằng khóa API Browserbase thật của bạn.
- Browserbase tự động tạo phiên trình duyệt khi kết nối WebSocket, nên không cần
  bước tạo phiên thủ công.
- Gói miễn phí cho phép một phiên đồng thời và một giờ trình duyệt mỗi tháng.
  Xem [giá](https://www.browserbase.com/pricing) để biết giới hạn của gói trả phí.
- Xem [tài liệu Browserbase](https://docs.browserbase.com) để có tham chiếu API
  đầy đủ, hướng dẫn SDK, và ví dụ tích hợp.

## Bảo mật

Ý tưởng chính:

- Điều khiển trình duyệt chỉ dành cho loopback; các luồng truy cập đi qua xác thực của Gateway hoặc ghép nối node.
- API HTTP trình duyệt loopback độc lập chỉ dùng **xác thực bằng bí mật chia sẻ**:
  xác thực bearer bằng token gateway, `x-openclaw-password`, hoặc xác thực HTTP Basic bằng
  mật khẩu gateway đã cấu hình.
- Header nhận dạng Tailscale Serve và `gateway.auth.mode: "trusted-proxy"`
  **không** xác thực API trình duyệt loopback độc lập này.
- Nếu điều khiển trình duyệt được bật và chưa cấu hình xác thực bằng bí mật chia sẻ, OpenClaw
  tạo một token gateway chỉ dùng trong thời gian chạy cho lần khởi động đó. Hãy cấu hình
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, hoặc
  `OPENCLAW_GATEWAY_PASSWORD` một cách tường minh nếu máy khách cần một bí mật ổn định qua các
  lần khởi động lại.
- OpenClaw **không** tự động tạo token đó khi `gateway.auth.mode` đã là
  `password`, `none`, hoặc `trusted-proxy`.
- Giữ Gateway và mọi máy chủ node trên mạng riêng (Tailscale); tránh để lộ công khai.
- Xem URL/token CDP từ xa là bí mật; ưu tiên biến môi trường hoặc trình quản lý bí mật.

Mẹo CDP từ xa:

- Ưu tiên endpoint được mã hóa (HTTPS hoặc WSS) và token ngắn hạn khi có thể.
- Tránh nhúng token dài hạn trực tiếp trong tệp cấu hình.

## Hồ sơ (nhiều trình duyệt)

OpenClaw hỗ trợ nhiều hồ sơ được đặt tên (cấu hình định tuyến). Hồ sơ có thể là:

- **openclaw-managed**: một phiên bản trình duyệt chuyên dụng dựa trên Chromium với thư mục dữ liệu người dùng riêng + cổng CDP riêng
- **remote**: một URL CDP tường minh (trình duyệt dựa trên Chromium chạy ở nơi khác)
- **existing session**: hồ sơ Chrome hiện có của bạn thông qua tự động kết nối Chrome DevTools MCP

Mặc định:

- Hồ sơ `openclaw` được tự động tạo nếu thiếu.
- Hồ sơ `user` được tích hợp sẵn để gắn vào phiên hiện có bằng Chrome MCP.
- Hồ sơ phiên hiện có ngoài `user` là tùy chọn tham gia; tạo chúng bằng `--driver existing-session`.
- Cổng CDP cục bộ mặc định được cấp phát từ **18800-18899**.
- Xóa một hồ sơ sẽ chuyển thư mục dữ liệu cục bộ của hồ sơ đó vào Thùng rác.

Tất cả endpoint điều khiển chấp nhận `?profile=<name>`; CLI dùng `--browser-profile`.

## Phiên hiện có qua Chrome DevTools MCP

OpenClaw cũng có thể gắn vào một hồ sơ trình duyệt đang chạy dựa trên Chromium thông qua
máy chủ Chrome DevTools MCP chính thức. Cách này tái sử dụng các thẻ và trạng thái đăng nhập
đang mở trong hồ sơ trình duyệt đó.

Tài liệu nền và thiết lập chính thức:

- [Chrome for Developers: Sử dụng Chrome DevTools MCP với phiên trình duyệt của bạn](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Hồ sơ tích hợp sẵn:

- `user`

Tùy chọn: tạo hồ sơ phiên hiện có tùy chỉnh của riêng bạn nếu muốn có
tên, màu hoặc thư mục dữ liệu trình duyệt khác.

Hành vi mặc định:

- Hồ sơ tích hợp sẵn `user` dùng tự động kết nối Chrome MCP, nhắm tới
  hồ sơ Google Chrome cục bộ mặc định.

Dùng `userDataDir` cho Brave, Edge, Chromium hoặc một hồ sơ Chrome không mặc định.
`~` mở rộng thành thư mục home của hệ điều hành của bạn:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Sau đó trong trình duyệt tương ứng:

1. Mở trang inspect của trình duyệt đó cho gỡ lỗi từ xa.
2. Bật gỡ lỗi từ xa.
3. Giữ trình duyệt chạy và phê duyệt lời nhắc kết nối khi OpenClaw gắn vào.

Các trang inspect phổ biến:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Kiểm thử nhanh gắn trực tiếp:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Thành công trông như sau:

- `status` hiển thị `driver: existing-session`
- `status` hiển thị `transport: chrome-mcp`
- `status` hiển thị `running: true`
- `tabs` liệt kê các thẻ trình duyệt đã mở của bạn
- `snapshot` trả về ref từ thẻ trực tiếp đã chọn

Cần kiểm tra gì nếu không gắn được:

- trình duyệt mục tiêu dựa trên Chromium có phiên bản `144+`
- gỡ lỗi từ xa đã được bật trong trang inspect của trình duyệt đó
- trình duyệt đã hiển thị và bạn đã chấp nhận lời nhắc đồng ý gắn vào
- `openclaw doctor` di chuyển cấu hình trình duyệt cũ dựa trên Plugin và kiểm tra rằng
  Chrome đã được cài đặt cục bộ cho các hồ sơ tự động kết nối mặc định, nhưng không thể
  bật gỡ lỗi từ xa phía trình duyệt cho bạn

Cách tác nhân sử dụng:

- Dùng `profile="user"` khi bạn cần trạng thái trình duyệt đã đăng nhập của người dùng.
- Nếu bạn dùng hồ sơ phiên hiện có tùy chỉnh, hãy truyền tên hồ sơ tường minh đó.
- Chỉ chọn chế độ này khi người dùng đang ở máy tính để phê duyệt lời nhắc
  gắn vào.
- Gateway hoặc máy chủ node có thể sinh `npx chrome-devtools-mcp@latest --autoConnect`

Ghi chú:

- Đường dẫn này có rủi ro cao hơn hồ sơ `openclaw` cô lập vì nó có thể
  thao tác bên trong phiên trình duyệt đã đăng nhập của bạn.
- OpenClaw không khởi chạy trình duyệt cho driver này; nó chỉ gắn vào.
- OpenClaw dùng luồng Chrome DevTools MCP `--autoConnect` chính thức ở đây. Nếu
  `userDataDir` được đặt, giá trị này được truyền qua để nhắm tới thư mục dữ liệu người dùng đó.
- Phiên hiện có có thể gắn vào máy chủ đã chọn hoặc thông qua một node trình duyệt
  đã kết nối. Nếu Chrome nằm ở nơi khác và không có node trình duyệt nào được kết nối, hãy dùng
  CDP từ xa hoặc một máy chủ node thay thế.

### Khởi chạy Chrome MCP tùy chỉnh

Ghi đè máy chủ Chrome DevTools MCP được sinh theo từng hồ sơ khi luồng mặc định
`npx chrome-devtools-mcp@latest` không phải là thứ bạn muốn (máy chủ ngoại tuyến,
phiên bản được ghim, tệp nhị phân vendored):

| Trường       | Chức năng                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Tệp thực thi để sinh thay vì `npx`. Được phân giải nguyên trạng; đường dẫn tuyệt đối được tôn trọng.                       |
| `mcpArgs`    | Mảng đối số được truyền nguyên văn cho `mcpCommand`. Thay thế các đối số mặc định `chrome-devtools-mcp@latest --autoConnect`. |

Khi `cdpUrl` được đặt trên hồ sơ phiên hiện có, OpenClaw bỏ qua
`--autoConnect` và tự động chuyển tiếp endpoint tới Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint khám phá HTTP của DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket trực tiếp).

Không thể kết hợp cờ endpoint và `userDataDir`: khi `cdpUrl` được đặt,
`userDataDir` bị bỏ qua cho khởi chạy Chrome MCP, vì Chrome MCP gắn vào
trình duyệt đang chạy phía sau endpoint thay vì mở một thư mục
hồ sơ.

<Accordion title="Hạn chế tính năng của phiên hiện có">

So với hồ sơ `openclaw` được quản lý, driver phiên hiện có bị giới hạn hơn:

- **Ảnh chụp màn hình** - chụp trang và chụp phần tử bằng `--ref` hoạt động; bộ chọn CSS `--element` thì không. `--full-page` không thể kết hợp với `--ref` hoặc `--element`. Không cần Playwright cho ảnh chụp màn hình trang hoặc phần tử dựa trên ref.
- **Hành động** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, và `select` yêu cầu ref từ snapshot (không có bộ chọn CSS). `click-coords` nhấp vào tọa độ viewport nhìn thấy được và không cần ref snapshot. `click` chỉ dùng nút trái. `type` không hỗ trợ `slowly=true`; dùng `fill` hoặc `press`. `press` không hỗ trợ `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, và `evaluate` không hỗ trợ timeout theo từng lệnh gọi. `select` chấp nhận một giá trị duy nhất.
- **Chờ / tải lên / hộp thoại** - `wait --url` hỗ trợ mẫu chính xác, chuỗi con và glob; `wait --load networkidle` không được hỗ trợ. Hook tải lên yêu cầu `ref` hoặc `inputRef`, mỗi lần một tệp, không có CSS `element`. Hook hộp thoại không hỗ trợ ghi đè timeout.
- **Tính năng chỉ dành cho chế độ được quản lý** - hành động theo lô, xuất PDF, chặn tải xuống và `responsebody` vẫn yêu cầu đường dẫn trình duyệt được quản lý.

</Accordion>

## Bảo đảm cô lập

- **Thư mục dữ liệu người dùng chuyên dụng**: không bao giờ chạm vào hồ sơ trình duyệt cá nhân của bạn.
- **Cổng chuyên dụng**: tránh `9222` để ngăn xung đột với quy trình phát triển.
- **Điều khiển thẻ xác định**: `tabs` trả về `suggestedTargetId` trước, sau đó là
  các handle `tabId` ổn định như `t1`, nhãn tùy chọn và `targetId` thô.
  Tác nhân nên tái sử dụng `suggestedTargetId`; id thô vẫn có sẵn cho
  gỡ lỗi và tương thích.

## Chọn trình duyệt

Khi khởi chạy cục bộ, OpenClaw chọn mục đầu tiên có sẵn:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bạn có thể ghi đè bằng `browser.executablePath`.

Nền tảng:

- macOS: kiểm tra `/Applications` và `~/Applications`.
- Linux: kiểm tra các vị trí Chrome/Brave/Edge/Chromium phổ biến dưới `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, và
  `/usr/lib/chromium-browser`.
- Windows: kiểm tra các vị trí cài đặt phổ biến.

## API điều khiển (tùy chọn)

Để viết script và gỡ lỗi, Gateway cung cấp một **API điều khiển HTTP chỉ dành cho loopback**
nhỏ cùng với CLI `openclaw browser` tương ứng (snapshot, ref, tăng cường wait,
đầu ra JSON, quy trình gỡ lỗi). Xem
[API điều khiển trình duyệt](/vi/tools/browser-control) để biết tài liệu tham khảo đầy đủ.

## Khắc phục sự cố

Đối với các vấn đề riêng của Linux (đặc biệt là snap Chromium), xem
[Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting).

Đối với thiết lập Gateway WSL2 + Chrome Windows trên hai máy chủ, xem
[Khắc phục sự cố WSL2 + Windows + CDP Chrome từ xa](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Lỗi khởi động CDP so với chặn SSRF điều hướng

Đây là các lớp lỗi khác nhau và chúng trỏ tới các đường dẫn mã khác nhau.

- **Lỗi khởi động hoặc sẵn sàng CDP** nghĩa là OpenClaw không thể xác nhận rằng mặt phẳng điều khiển trình duyệt đang khỏe mạnh.
- **Chặn SSRF điều hướng** nghĩa là mặt phẳng điều khiển trình duyệt đang khỏe mạnh, nhưng mục tiêu điều hướng trang bị chính sách từ chối.

Ví dụ phổ biến:

- Lỗi khởi động hoặc sẵn sàng CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` khi một
    dịch vụ CDP ngoài loopback được cấu hình mà không có `attachOnly: true`
- Chặn SSRF điều hướng:
  - Các luồng `open`, `navigate`, snapshot hoặc mở thẻ thất bại với lỗi chính sách trình duyệt/mạng trong khi `start` và `tabs` vẫn hoạt động

Dùng chuỗi tối thiểu này để tách hai trường hợp:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cách đọc kết quả:

- Nếu `start` thất bại với `not reachable after start`, trước tiên hãy khắc phục sự cố sẵn sàng CDP.
- Nếu `start` thành công nhưng `tabs` thất bại, mặt phẳng điều khiển vẫn không khỏe mạnh. Hãy xem đây là vấn đề về khả năng tiếp cận CDP, không phải vấn đề điều hướng trang.
- Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt đã hoạt động và lỗi nằm ở chính sách điều hướng hoặc trang mục tiêu.
- Nếu `start`, `tabs`, và `open` đều thành công, đường dẫn điều khiển trình duyệt được quản lý cơ bản đang khỏe mạnh.

Chi tiết hành vi quan trọng:

- Cấu hình trình duyệt mặc định là một đối tượng chính sách SSRF fail-closed ngay cả khi bạn không cấu hình `browser.ssrfPolicy`.
- Đối với hồ sơ được quản lý `openclaw` local loopback, kiểm tra sức khỏe CDP cố ý bỏ qua thực thi khả năng tiếp cận SSRF của trình duyệt cho mặt phẳng điều khiển cục bộ riêng của OpenClaw.
- Bảo vệ điều hướng là riêng biệt. Kết quả `start` hoặc `tabs` thành công không có nghĩa là mục tiêu `open` hoặc `navigate` sau đó được cho phép.

Hướng dẫn bảo mật:

- **Không** nới lỏng chính sách SSRF của trình duyệt theo mặc định.
- Ưu tiên ngoại lệ máy chủ hẹp như `hostnameAllowlist` hoặc `allowedHostnames` thay vì truy cập mạng riêng rộng.
- Chỉ dùng `dangerouslyAllowPrivateNetwork: true` trong các môi trường tin cậy có chủ ý, nơi truy cập trình duyệt vào mạng riêng là bắt buộc và đã được rà soát.

## Công cụ tác nhân + cách hoạt động của điều khiển

Tác nhân nhận **một công cụ** để tự động hóa trình duyệt:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cách ánh xạ:

- `browser snapshot` trả về một cây giao diện người dùng ổn định (AI hoặc ARIA).
- `browser act` sử dụng các ID `ref` của snapshot để nhấp/nhập/kéo/chọn.
- `browser screenshot` chụp pixel (toàn trang, phần tử hoặc các tham chiếu có nhãn).
- `browser doctor` kiểm tra mức sẵn sàng của Gateway, plugin, hồ sơ, trình duyệt và tab.
- `browser` chấp nhận:
  - `profile` để chọn một hồ sơ trình duyệt được đặt tên (openclaw, chrome hoặc CDP từ xa).
  - `target` (`sandbox` | `host` | `node`) để chọn nơi trình duyệt chạy.
  - Trong các phiên chạy trong sandbox, `target: "host"` yêu cầu `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Nếu bỏ qua `target`: các phiên chạy trong sandbox mặc định là `sandbox`, các phiên không trong sandbox mặc định là `host`.
  - Nếu một Node hỗ trợ trình duyệt được kết nối, công cụ có thể tự động định tuyến đến đó trừ khi bạn cố định `target="host"` hoặc `target="node"`.

Điều này giúp tác nhân có tính xác định và tránh các bộ chọn dễ lỗi.

## Liên quan

- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ tác nhân hiện có
- [Sandboxing](/vi/gateway/sandboxing) - điều khiển trình duyệt trong môi trường sandbox
- [Bảo mật](/vi/gateway/security) - rủi ro và gia cố khi điều khiển trình duyệt
