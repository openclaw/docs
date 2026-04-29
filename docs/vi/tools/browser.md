---
read_when:
    - Thêm tự động hóa trình duyệt do tác tử điều khiển
    - Gỡ lỗi nguyên nhân OpenClaw can thiệp vào Chrome của chính bạn
    - Triển khai cài đặt trình duyệt + vòng đời trong ứng dụng macOS
summary: Dịch vụ điều khiển trình duyệt tích hợp + các lệnh hành động
title: Trình duyệt (do OpenClaw quản lý)
x-i18n:
    generated_at: "2026-04-29T23:16:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw có thể chạy một **hồ sơ Chrome/Brave/Edge/Chromium chuyên dụng** do agent điều khiển.
Nó được tách biệt khỏi trình duyệt cá nhân của bạn và được quản lý thông qua một dịch vụ điều khiển cục bộ nhỏ bên trong Gateway (chỉ loopback).

Góc nhìn cho người mới bắt đầu:

- Hãy xem nó như một **trình duyệt riêng, chỉ dành cho agent**.
- Hồ sơ `openclaw` **không** chạm vào hồ sơ trình duyệt cá nhân của bạn.
- Agent có thể **mở tab, đọc trang, nhấp và nhập** trong một vùng an toàn.
- Hồ sơ `user` tích hợp sẵn gắn vào phiên Chrome đã đăng nhập thật của bạn qua Chrome MCP.

## Bạn nhận được gì

- Một hồ sơ trình duyệt riêng có tên **openclaw** (mặc định dùng điểm nhấn màu cam).
- Điều khiển tab xác định được (liệt kê/mở/tập trung/đóng).
- Hành động của agent (nhấp/nhập/kéo/chọn), snapshot, ảnh chụp màn hình, PDF.
- Một skill `browser-automation` được đóng gói sẵn, hướng dẫn agent vòng lặp khôi phục snapshot,
  tab ổn định, tham chiếu cũ và chặn thủ công khi browser
  plugin được bật.
- Hỗ trợ nhiều hồ sơ tùy chọn (`openclaw`, `work`, `remote`, ...).

Trình duyệt này **không** phải trình duyệt dùng hằng ngày của bạn. Đây là bề mặt an toàn, tách biệt cho
tự động hóa và xác minh của agent.

## Bắt đầu nhanh

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Nếu bạn nhận được “Browser disabled”, hãy bật nó trong cấu hình (xem bên dưới) và khởi động lại
Gateway.

Nếu `openclaw browser` hoàn toàn bị thiếu, hoặc agent nói công cụ trình duyệt
không khả dụng, hãy chuyển đến [Thiếu lệnh hoặc công cụ trình duyệt](/vi/tools/browser#missing-browser-command-or-tool).

## Điều khiển Plugin

Công cụ `browser` mặc định là một plugin được đóng gói sẵn. Tắt nó để thay bằng plugin khác đăng ký cùng tên công cụ `browser`:

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

Mặc định cần cả `plugins.entries.browser.enabled` **và** `browser.enabled=true`. Chỉ tắt plugin sẽ loại bỏ CLI `openclaw browser`, phương thức gateway `browser.request`, công cụ agent và dịch vụ điều khiển như một đơn vị; cấu hình `browser.*` của bạn vẫn được giữ nguyên cho phần thay thế.

Thay đổi cấu hình trình duyệt yêu cầu khởi động lại Gateway để plugin có thể đăng ký lại dịch vụ của nó.

## Hướng dẫn cho agent

Ghi chú về hồ sơ công cụ: `tools.profile: "coding"` bao gồm `web_search` và
`web_fetch`, nhưng không bao gồm đầy đủ công cụ `browser`. Nếu agent hoặc một
sub-agent được sinh ra cần dùng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn
hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Với một agent đơn lẻ, dùng `agents.list[].tools.alsoAllow: ["browser"]`.
Chỉ riêng `tools.subagents.tools.allow: ["browser"]` là chưa đủ vì chính sách sub-agent
được áp dụng sau khi lọc hồ sơ.

Browser plugin cung cấp hai cấp hướng dẫn cho agent:

- Mô tả công cụ `browser` mang hợp đồng ngắn gọn luôn bật: chọn
  đúng hồ sơ, giữ các tham chiếu trên cùng tab, dùng `tabId`/nhãn để nhắm mục tiêu
  tab, và tải browser skill cho công việc nhiều bước.
- Skill `browser-automation` được đóng gói sẵn mang vòng vận hành dài hơn:
  kiểm tra trạng thái/tab trước, gắn nhãn tab tác vụ, snapshot trước khi hành động, chụp lại snapshot
  sau thay đổi UI, khôi phục tham chiếu cũ một lần, và báo cáo đăng nhập/2FA/captcha hoặc
  bộ chặn camera/microphone là hành động thủ công thay vì đoán.

Skills được đóng gói cùng plugin được liệt kê trong các Skills khả dụng của agent khi
plugin được bật. Hướng dẫn skill đầy đủ được tải theo yêu cầu, nên các lượt thông thường
không phải trả toàn bộ chi phí token.

## Thiếu lệnh hoặc công cụ trình duyệt

Nếu `openclaw browser` không được nhận diện sau khi nâng cấp, `browser.request` bị thiếu, hoặc agent báo công cụ trình duyệt không khả dụng, nguyên nhân thường là danh sách `plugins.allow` bỏ sót `browser` và không có khối cấu hình `browser` ở gốc. Thêm nó:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Một khối `browser` gốc rõ ràng, ví dụ `browser.enabled=true` hoặc `browser.profiles.<name>`, kích hoạt browser plugin được đóng gói sẵn ngay cả dưới `plugins.allow` hạn chế, khớp với hành vi cấu hình kênh. `plugins.entries.browser.enabled=true` và `tools.alsoAllow: ["browser"]` tự chúng không thay thế được tư cách thành viên allowlist. Loại bỏ hoàn toàn `plugins.allow` cũng khôi phục mặc định.

## Hồ sơ: `openclaw` và `user`

- `openclaw`: trình duyệt được quản lý, tách biệt (không cần extension).
- `user`: hồ sơ gắn Chrome MCP tích hợp sẵn cho phiên **Chrome đã đăng nhập thật**
  của bạn.

Đối với các lệnh gọi công cụ trình duyệt của agent:

- Mặc định: dùng trình duyệt `openclaw` tách biệt.
- Ưu tiên `profile="user"` khi các phiên đã đăng nhập hiện có là quan trọng và người dùng
  đang ở máy tính để nhấp/phê duyệt mọi lời nhắc gắn.
- `profile` là ghi đè rõ ràng khi bạn muốn một chế độ trình duyệt cụ thể.

Đặt `browser.defaultProfile: "openclaw"` nếu bạn muốn chế độ được quản lý làm mặc định.

## Cấu hình

Cài đặt trình duyệt nằm trong `~/.openclaw/openclaw.json`.

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

<Accordion title="Cổng và khả năng truy cập">

- Dịch vụ điều khiển bind vào loopback trên một cổng được suy ra từ `gateway.port` (mặc định `18791` = gateway + 2). Ghi đè `gateway.port` hoặc `OPENCLAW_GATEWAY_PORT` sẽ dịch chuyển các cổng được suy ra trong cùng nhóm.
- Hồ sơ `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl`; chỉ đặt các giá trị đó cho CDP từ xa. `cdpUrl` mặc định là cổng CDP cục bộ được quản lý khi chưa đặt.
- `remoteCdpTimeoutMs` áp dụng cho các kiểm tra khả năng truy cập CDP HTTP từ xa và `attachOnly`
  cùng các yêu cầu HTTP mở tab; `remoteCdpHandshakeTimeoutMs` áp dụng cho
  các handshake CDP WebSocket của chúng.
- `localLaunchTimeoutMs` là ngân sách thời gian để một tiến trình Chrome được quản lý khởi chạy cục bộ
  phơi bày endpoint CDP HTTP của nó. `localCdpReadyTimeoutMs` là
  ngân sách tiếp theo cho độ sẵn sàng websocket CDP sau khi phát hiện tiến trình.
  Tăng các giá trị này trên Raspberry Pi, VPS cấu hình thấp hoặc phần cứng cũ nơi Chromium
  khởi động chậm. Giá trị phải là số nguyên dương tối đa `120000` ms; các giá trị
  cấu hình không hợp lệ sẽ bị từ chối.
- Các lỗi khởi chạy/sẵn sàng Chrome được quản lý lặp lại sẽ bị ngắt mạch theo từng
  hồ sơ. Sau nhiều lỗi liên tiếp, OpenClaw tạm dừng các lần thử khởi chạy mới
  trong thời gian ngắn thay vì sinh Chromium trên mọi lệnh gọi công cụ trình duyệt. Sửa
  sự cố khởi động, tắt trình duyệt nếu không cần, hoặc khởi động lại
  Gateway sau khi sửa.
- `actionTimeoutMs` là ngân sách mặc định cho các yêu cầu `act` của trình duyệt khi bên gọi không truyền `timeoutMs`. Giao vận client thêm một khoảng đệm nhỏ để các lần chờ dài có thể hoàn tất thay vì hết thời gian ở biên HTTP.
- `tabCleanup` là dọn dẹp theo nỗ lực tối đa cho các tab được mở bởi phiên trình duyệt agent chính. Dọn dẹp vòng đời subagent, cron và ACP vẫn đóng các tab được theo dõi rõ ràng của chúng khi kết thúc phiên; các phiên chính giữ các tab đang hoạt động để tái sử dụng, rồi đóng các tab được theo dõi nhàn rỗi hoặc vượt mức trong nền.

</Accordion>

<Accordion title="Chính sách SSRF">

- Điều hướng trình duyệt và mở tab được SSRF bảo vệ trước khi điều hướng và được kiểm tra lại theo nỗ lực tối đa trên URL `http(s)` cuối cùng sau đó.
- Ở chế độ SSRF nghiêm ngặt, phát hiện endpoint CDP từ xa và các probe `/json/version` (`cdpUrl`) cũng được kiểm tra.
- Các biến môi trường `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và `NO_PROXY` của Gateway/nhà cung cấp không tự động proxy trình duyệt do OpenClaw quản lý. Chrome được quản lý khởi chạy trực tiếp theo mặc định để cài đặt proxy của nhà cung cấp không làm yếu các kiểm tra SSRF của trình duyệt.
- Để proxy chính trình duyệt được quản lý, truyền các cờ proxy Chrome rõ ràng qua `browser.extraArgs`, chẳng hạn `--proxy-server=...` hoặc `--proxy-pac-url=...`. Chế độ SSRF nghiêm ngặt chặn định tuyến proxy trình duyệt rõ ràng trừ khi quyền truy cập trình duyệt private-network được chủ ý bật.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tắt theo mặc định; chỉ bật khi quyền truy cập trình duyệt private-network được chủ ý tin cậy.
- `browser.ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ như một bí danh kế thừa.

</Accordion>

<Accordion title="Hành vi hồ sơ">

- `attachOnly: true` nghĩa là không bao giờ khởi chạy trình duyệt cục bộ; chỉ đính kèm nếu đã có một trình duyệt đang chạy.
- `headless` có thể được đặt toàn cục hoặc theo từng hồ sơ được quản lý cục bộ. Giá trị theo hồ sơ ghi đè `browser.headless`, nên một hồ sơ được khởi chạy cục bộ có thể chạy headless trong khi hồ sơ khác vẫn hiển thị.
- `POST /start?headless=true` và `openclaw browser start --headless` yêu cầu một lần khởi chạy headless
  dùng một lần cho các hồ sơ được quản lý cục bộ mà không ghi lại
  `browser.headless` hoặc cấu hình hồ sơ. Các hồ sơ phiên hiện có, chỉ đính kèm và
  CDP từ xa sẽ từ chối ghi đè vì OpenClaw không khởi chạy các
  tiến trình trình duyệt đó.
- Trên máy chủ Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, các hồ sơ được quản lý cục bộ
  mặc định tự động chuyển sang headless khi cả môi trường lẫn cấu hình hồ sơ/toàn cục
  đều không chọn rõ chế độ có giao diện. `openclaw browser status --json`
  báo cáo `headlessSource` là `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, hoặc `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` buộc các lần khởi chạy được quản lý cục bộ chạy headless cho
  tiến trình hiện tại. `OPENCLAW_BROWSER_HEADLESS=0` buộc chế độ có giao diện cho các lần
  khởi động thông thường và trả về lỗi có thể hành động trên máy chủ Linux không có máy chủ hiển thị;
  một yêu cầu `start --headless` rõ ràng vẫn được ưu tiên cho riêng lần khởi chạy đó.
- `executablePath` có thể được đặt toàn cục hoặc theo từng hồ sơ được quản lý cục bộ. Giá trị theo hồ sơ ghi đè `browser.executablePath`, nên các hồ sơ được quản lý khác nhau có thể khởi chạy các trình duyệt dựa trên Chromium khác nhau. Cả hai dạng đều chấp nhận `~` cho thư mục home của hệ điều hành của bạn.
- `color` (cấp cao nhất và theo hồ sơ) tô màu giao diện trình duyệt để bạn có thể thấy hồ sơ nào đang hoạt động.
- Hồ sơ mặc định là `openclaw` (được quản lý độc lập). Dùng `defaultProfile: "user"` để chọn dùng trình duyệt người dùng đã đăng nhập.
- Thứ tự tự động phát hiện: trình duyệt mặc định của hệ thống nếu dựa trên Chromium; nếu không thì Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` dùng Chrome DevTools MCP thay vì CDP thô. Không đặt `cdpUrl` cho driver đó.
- Đặt `browser.profiles.<name>.userDataDir` khi hồ sơ phiên hiện có cần đính kèm vào một hồ sơ người dùng Chromium không mặc định (Brave, Edge, v.v.). Đường dẫn này cũng chấp nhận `~` cho thư mục home của hệ điều hành của bạn.

</Accordion>

</AccordionGroup>

## Dùng Brave hoặc một trình duyệt dựa trên Chromium khác

Nếu trình duyệt **mặc định của hệ thống** của bạn dựa trên Chromium (Chrome/Brave/Edge/v.v.),
OpenClaw sẽ tự động dùng nó. Đặt `browser.executablePath` để ghi đè
tự động phát hiện. Các giá trị `executablePath` cấp cao nhất và theo hồ sơ chấp nhận `~`
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
khởi chạy. Các hồ sơ `existing-session` đính kèm vào một trình duyệt đã chạy sẵn
thay vào đó, và các hồ sơ CDP từ xa dùng trình duyệt phía sau `cdpUrl`.

## Điều khiển cục bộ so với từ xa

- **Điều khiển cục bộ (mặc định):** Gateway khởi động dịch vụ điều khiển local loopback và có thể khởi chạy trình duyệt cục bộ.
- **Điều khiển từ xa (máy chủ node):** chạy một máy chủ node trên máy có trình duyệt; Gateway ủy quyền các thao tác trình duyệt đến nó.
- **CDP từ xa:** đặt `browser.profiles.<name>.cdpUrl` (hoặc `browser.cdpUrl`) để
  đính kèm vào trình duyệt dựa trên Chromium từ xa. Trong trường hợp này, OpenClaw sẽ không khởi chạy trình duyệt cục bộ.
- Với các dịch vụ CDP được quản lý bên ngoài trên loopback (ví dụ Browserless trong
  Docker được xuất bản tới `127.0.0.1`), cũng đặt `attachOnly: true`. CDP loopback
  không có `attachOnly` được xem là hồ sơ trình duyệt được OpenClaw quản lý cục bộ.
- `headless` chỉ ảnh hưởng đến các hồ sơ được quản lý cục bộ mà OpenClaw khởi chạy. Nó không khởi động lại hoặc thay đổi các trình duyệt phiên hiện có hoặc CDP từ xa.
- `executablePath` tuân theo cùng quy tắc hồ sơ được quản lý cục bộ. Việc thay đổi nó trên một
  hồ sơ được quản lý cục bộ đang chạy sẽ đánh dấu hồ sơ đó để khởi động lại/đối chiếu, để lần
  khởi chạy tiếp theo dùng binary mới.

Hành vi dừng khác nhau theo chế độ hồ sơ:

- hồ sơ được quản lý cục bộ: `openclaw browser stop` dừng tiến trình trình duyệt mà
  OpenClaw đã khởi chạy
- hồ sơ chỉ đính kèm và CDP từ xa: `openclaw browser stop` đóng phiên điều khiển
  đang hoạt động và giải phóng các ghi đè mô phỏng Playwright/CDP (viewport,
  bảng màu, locale, múi giờ, chế độ ngoại tuyến và trạng thái tương tự), dù
  không có tiến trình trình duyệt nào được OpenClaw khởi chạy

URL CDP từ xa có thể bao gồm xác thực:

- Token truy vấn (ví dụ: `https://provider.example?token=<token>`)
- Xác thực HTTP Basic (ví dụ: `https://user:pass@provider.example`)

OpenClaw giữ nguyên thông tin xác thực khi gọi các endpoint `/json/*` và khi kết nối
đến CDP WebSocket. Nên dùng biến môi trường hoặc trình quản lý bí mật cho
token thay vì commit chúng vào tệp cấu hình.

## Proxy trình duyệt Node (mặc định không cần cấu hình)

Nếu bạn chạy một **máy chủ node** trên máy có trình duyệt của bạn, OpenClaw có thể
tự động định tuyến các lệnh gọi công cụ trình duyệt đến node đó mà không cần cấu hình trình duyệt bổ sung.
Đây là đường dẫn mặc định cho các gateway từ xa.

Ghi chú:

- Máy chủ node công bố máy chủ điều khiển trình duyệt cục bộ của nó qua một **lệnh proxy**.
- Hồ sơ đến từ cấu hình `browser.profiles` của chính node (giống cục bộ).
- `nodeHost.browserProxy.allowProfiles` là tùy chọn. Để trống cho hành vi kế thừa/mặc định: tất cả hồ sơ đã cấu hình vẫn có thể truy cập qua proxy, bao gồm các tuyến tạo/xóa hồ sơ.
- Nếu bạn đặt `nodeHost.browserProxy.allowProfiles`, OpenClaw xem đó là ranh giới đặc quyền tối thiểu: chỉ các hồ sơ trong danh sách cho phép mới có thể được nhắm đến, và các tuyến tạo/xóa hồ sơ bền vững bị chặn trên bề mặt proxy.
- Tắt nếu bạn không muốn dùng:
  - Trên node: `nodeHost.browserProxy.enabled=false`
  - Trên gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP từ xa được lưu trữ)

[Browserless](https://browserless.io) là một dịch vụ Chromium được lưu trữ, cung cấp
URL kết nối CDP qua HTTPS và WebSocket. OpenClaw có thể dùng cả hai dạng, nhưng
với một hồ sơ trình duyệt từ xa, tùy chọn đơn giản nhất là URL WebSocket trực tiếp
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
- Nếu Browserless cung cấp cho bạn URL cơ sở HTTPS, bạn có thể chuyển nó thành
  `wss://` cho kết nối CDP trực tiếp hoặc giữ URL HTTPS và để OpenClaw
  khám phá `/json/version`.

### Browserless Docker trên cùng máy chủ

Khi Browserless được tự lưu trữ trong Docker và OpenClaw chạy trên máy chủ, hãy xem
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

Địa chỉ trong `browser.profiles.browserless.cdpUrl` phải truy cập được từ tiến trình
OpenClaw. Browserless cũng phải quảng bá một endpoint khớp và có thể truy cập được;
đặt Browserless `EXTERNAL` thành cùng cơ sở WebSocket công khai tới OpenClaw đó, chẳng hạn
`ws://127.0.0.1:3000`, `ws://browserless:3000`, hoặc một địa chỉ mạng Docker
riêng tư ổn định. Nếu `/json/version` trả về `webSocketDebuggerUrl` trỏ tới
một địa chỉ OpenClaw không thể truy cập, CDP HTTP có thể trông khỏe mạnh trong khi việc
đính kèm WebSocket vẫn thất bại.

Không để `attachOnly` chưa đặt cho hồ sơ Browserless loopback. Nếu không có
`attachOnly`, OpenClaw xem cổng loopback là hồ sơ trình duyệt được quản lý cục bộ
và có thể báo cáo rằng cổng đang được dùng nhưng không thuộc sở hữu của OpenClaw.

## Nhà cung cấp CDP WebSocket trực tiếp

Một số dịch vụ trình duyệt được lưu trữ cung cấp endpoint **WebSocket trực tiếp** thay vì
cơ chế khám phá CDP dựa trên HTTP chuẩn (`/json/version`). OpenClaw chấp nhận ba
dạng URL CDP và tự động chọn chiến lược kết nối phù hợp:

- **Khám phá HTTP(S)** — `http://host[:port]` hoặc `https://host[:port]`.
  OpenClaw gọi `/json/version` để khám phá URL trình gỡ lỗi WebSocket, rồi
  kết nối. Không có dự phòng WebSocket.
- **Endpoint WebSocket trực tiếp** — `ws://host[:port]/devtools/<kind>/<id>` hoặc
  `wss://...` với đường dẫn `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw kết nối trực tiếp qua bắt tay WebSocket và bỏ qua
  `/json/version` hoàn toàn.
- **Gốc WebSocket trần** — `ws://host[:port]` hoặc `wss://host[:port]` không có
  đường dẫn `/devtools/...` (ví dụ [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw thử khám phá HTTP
  `/json/version` trước (chuẩn hóa scheme thành `http`/`https`);
  nếu khám phá trả về `webSocketDebuggerUrl` thì URL đó được dùng, nếu không OpenClaw
  dự phòng bằng bắt tay WebSocket trực tiếp tại gốc trần. Nếu endpoint
  WebSocket được quảng bá từ chối bắt tay CDP nhưng gốc trần đã cấu hình
  chấp nhận, OpenClaw cũng dự phòng về gốc đó. Điều này cho phép một `ws://` trần
  trỏ vào Chrome cục bộ vẫn kết nối được, vì Chrome chỉ chấp nhận nâng cấp WebSocket
  trên đường dẫn theo mục tiêu cụ thể từ `/json/version`, trong khi các nhà cung cấp
  được lưu trữ vẫn có thể dùng endpoint WebSocket gốc của họ khi endpoint khám phá
  quảng bá một URL ngắn hạn không phù hợp cho Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) là một nền tảng đám mây để chạy
trình duyệt headless với tính năng giải CAPTCHA tích hợp, chế độ tàng hình và proxy
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
  từ [bảng điều khiển Overview](https://www.browserbase.com/overview).
- Thay `<BROWSERBASE_API_KEY>` bằng khóa API Browserbase thật của bạn.
- Browserbase tự động tạo phiên trình duyệt khi kết nối WebSocket, nên không
  cần bước tạo phiên thủ công.
- Gói miễn phí cho phép một phiên đồng thời và một giờ trình duyệt mỗi tháng.
  Xem [bảng giá](https://www.browserbase.com/pricing) để biết giới hạn gói trả phí.
- Xem [tài liệu Browserbase](https://docs.browserbase.com) để có tham chiếu API
  đầy đủ, hướng dẫn SDK và ví dụ tích hợp.

## Bảo mật

Ý chính:

- Điều khiển trình duyệt chỉ dành cho loopback; các luồng truy cập đi qua xác thực của Gateway hoặc ghép cặp node.
- API HTTP trình duyệt loopback độc lập chỉ dùng **xác thực bằng bí mật dùng chung**:
  xác thực bearer bằng token Gateway, `x-openclaw-password`, hoặc xác thực HTTP Basic bằng
  mật khẩu Gateway đã cấu hình.
- Các header danh tính của Tailscale Serve và `gateway.auth.mode: "trusted-proxy"`
  **không** xác thực API trình duyệt loopback độc lập này.
- Nếu điều khiển trình duyệt được bật và chưa cấu hình xác thực bằng bí mật dùng chung, OpenClaw
  tự động tạo `gateway.auth.token` khi khởi động và lưu nó vào cấu hình.
- OpenClaw **không** tự động tạo token đó khi `gateway.auth.mode` đã là
  `password`, `none`, hoặc `trusted-proxy`.
- Giữ Gateway và mọi máy chủ node trong mạng riêng (Tailscale); tránh phơi bày công khai.
- Xem URL/token CDP từ xa là bí mật; ưu tiên biến môi trường hoặc trình quản lý bí mật.

Mẹo CDP từ xa:

- Ưu tiên endpoint được mã hóa (HTTPS hoặc WSS) và token ngắn hạn khi có thể.
- Tránh nhúng token dài hạn trực tiếp trong các tệp cấu hình.

## Hồ sơ (đa trình duyệt)

OpenClaw hỗ trợ nhiều hồ sơ có tên (cấu hình định tuyến). Hồ sơ có thể là:

- **do OpenClaw quản lý**: một phiên bản trình duyệt chuyên dụng dựa trên Chromium với thư mục dữ liệu người dùng riêng + cổng CDP riêng
- **từ xa**: một URL CDP tường minh (trình duyệt dựa trên Chromium đang chạy ở nơi khác)
- **phiên hiện có**: hồ sơ Chrome hiện có của bạn qua tự động kết nối Chrome DevTools MCP

Mặc định:

- Hồ sơ `openclaw` được tự động tạo nếu thiếu.
- Hồ sơ `user` được tích hợp sẵn để Chrome MCP gắn vào phiên hiện có.
- Các hồ sơ phiên hiện có ngoài `user` là tùy chọn bật thêm; tạo chúng bằng `--driver existing-session`.
- Theo mặc định, các cổng CDP cục bộ được cấp phát từ **18800–18899**.
- Xóa một hồ sơ sẽ chuyển thư mục dữ liệu cục bộ của hồ sơ đó vào Thùng rác.

Tất cả endpoint điều khiển chấp nhận `?profile=<name>`; CLI dùng `--browser-profile`.

## Phiên hiện có qua Chrome DevTools MCP

OpenClaw cũng có thể gắn vào một hồ sơ trình duyệt dựa trên Chromium đang chạy thông qua
máy chủ Chrome DevTools MCP chính thức. Cách này tái sử dụng các tab và trạng thái đăng nhập
đã mở trong hồ sơ trình duyệt đó.

Tài liệu nền và thiết lập chính thức:

- [Chrome for Developers: Dùng Chrome DevTools MCP với phiên trình duyệt của bạn](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Hồ sơ tích hợp sẵn:

- `user`

Tùy chọn: tạo hồ sơ phiên hiện có tùy chỉnh của riêng bạn nếu bạn muốn
tên, màu, hoặc thư mục dữ liệu trình duyệt khác.

Hành vi mặc định:

- Hồ sơ `user` tích hợp sẵn dùng tự động kết nối Chrome MCP, nhắm tới
  hồ sơ Google Chrome cục bộ mặc định.

Dùng `userDataDir` cho Brave, Edge, Chromium, hoặc hồ sơ Chrome không mặc định.
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

1. Mở trang inspect của trình duyệt đó để gỡ lỗi từ xa.
2. Bật gỡ lỗi từ xa.
3. Giữ trình duyệt đang chạy và phê duyệt lời nhắc kết nối khi OpenClaw gắn vào.

Các trang inspect thường dùng:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Kiểm thử khói gắn trực tiếp:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Kết quả thành công trông như sau:

- `status` hiển thị `driver: existing-session`
- `status` hiển thị `transport: chrome-mcp`
- `status` hiển thị `running: true`
- `tabs` liệt kê các tab trình duyệt đã mở của bạn
- `snapshot` trả về refs từ tab trực tiếp đã chọn

Cần kiểm tra gì nếu không gắn được:

- trình duyệt mục tiêu dựa trên Chromium là phiên bản `144+`
- gỡ lỗi từ xa được bật trong trang inspect của trình duyệt đó
- trình duyệt đã hiển thị và bạn đã chấp nhận lời nhắc đồng ý gắn vào
- `openclaw doctor` di trú cấu hình trình duyệt cũ dựa trên Plugin và kiểm tra rằng
  Chrome đã được cài đặt cục bộ cho các hồ sơ tự động kết nối mặc định, nhưng không thể
  bật gỡ lỗi từ xa phía trình duyệt thay bạn

Cách agent dùng:

- Dùng `profile="user"` khi bạn cần trạng thái trình duyệt đã đăng nhập của người dùng.
- Nếu bạn dùng hồ sơ phiên hiện có tùy chỉnh, truyền tên hồ sơ tường minh đó.
- Chỉ chọn chế độ này khi người dùng đang ở máy tính để phê duyệt lời nhắc
  gắn vào.
- Gateway hoặc máy chủ node có thể tạo `npx chrome-devtools-mcp@latest --autoConnect`

Ghi chú:

- Đường dẫn này có rủi ro cao hơn hồ sơ `openclaw` cô lập vì nó có thể
  thao tác bên trong phiên trình duyệt đã đăng nhập của bạn.
- OpenClaw không khởi chạy trình duyệt cho driver này; nó chỉ gắn vào.
- OpenClaw dùng luồng Chrome DevTools MCP `--autoConnect` chính thức ở đây. Nếu
  đặt `userDataDir`, giá trị đó được truyền tiếp để nhắm tới thư mục dữ liệu người dùng đó.
- Phiên hiện có có thể gắn trên máy chủ đã chọn hoặc qua một node trình duyệt
  đã kết nối. Nếu Chrome nằm ở nơi khác và không có node trình duyệt nào được kết nối, hãy dùng
  CDP từ xa hoặc máy chủ node thay thế.

### Khởi chạy Chrome MCP tùy chỉnh

Ghi đè máy chủ Chrome DevTools MCP được tạo theo từng hồ sơ khi luồng
`npx chrome-devtools-mcp@latest` mặc định không phải điều bạn muốn (máy chủ ngoại tuyến,
phiên bản ghim, binary vendored):

| Trường       | Chức năng                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Tệp thực thi để tạo thay vì `npx`. Được phân giải nguyên trạng; đường dẫn tuyệt đối được tôn trọng.                       |
| `mcpArgs`    | Mảng đối số được truyền nguyên văn cho `mcpCommand`. Thay thế các đối số `chrome-devtools-mcp@latest --autoConnect` mặc định. |

Khi đặt `cdpUrl` trên hồ sơ phiên hiện có, OpenClaw bỏ qua
`--autoConnect` và tự động chuyển tiếp endpoint tới Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint khám phá HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket trực tiếp).

Không thể kết hợp cờ endpoint và `userDataDir`: khi đặt `cdpUrl`,
`userDataDir` bị bỏ qua cho khởi chạy Chrome MCP, vì Chrome MCP gắn vào
trình duyệt đang chạy phía sau endpoint thay vì mở một thư mục
hồ sơ.

<Accordion title="Giới hạn tính năng của phiên hiện có">

So với hồ sơ `openclaw` được quản lý, các driver phiên hiện có bị ràng buộc hơn:

- **Ảnh chụp màn hình** — chụp trang và chụp phần tử `--ref` hoạt động; bộ chọn CSS `--element` thì không. `--full-page` không thể kết hợp với `--ref` hoặc `--element`. Playwright không bắt buộc cho ảnh chụp màn hình trang hoặc phần tử dựa trên ref.
- **Hành động** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, và `select` yêu cầu snapshot refs (không dùng bộ chọn CSS). `click-coords` nhấp vào tọa độ viewport hiển thị và không yêu cầu snapshot ref. `click` chỉ dùng nút trái. `type` không hỗ trợ `slowly=true`; dùng `fill` hoặc `press`. `press` không hỗ trợ `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, và `evaluate` không hỗ trợ timeout theo từng lệnh gọi. `select` chấp nhận một giá trị duy nhất.
- **Chờ / tải lên / hộp thoại** — `wait --url` hỗ trợ mẫu chính xác, chuỗi con, và glob; `wait --load networkidle` không được hỗ trợ. Hook tải lên yêu cầu `ref` hoặc `inputRef`, mỗi lần một tệp, không có CSS `element`. Hook hộp thoại không hỗ trợ ghi đè timeout.
- **Tính năng chỉ dành cho trình được quản lý** — hành động theo lô, xuất PDF, chặn tải xuống, và `responsebody` vẫn yêu cầu đường dẫn trình duyệt được quản lý.

</Accordion>

## Bảo đảm cô lập

- **Thư mục dữ liệu người dùng chuyên dụng**: không bao giờ chạm vào hồ sơ trình duyệt cá nhân của bạn.
- **Cổng chuyên dụng**: tránh `9222` để ngăn xung đột với quy trình phát triển.
- **Điều khiển tab xác định**: `tabs` trả về `suggestedTargetId` trước, rồi
  các handle `tabId` ổn định như `t1`, nhãn tùy chọn, và `targetId` thô.
  Agent nên tái sử dụng `suggestedTargetId`; id thô vẫn có sẵn để
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
- Linux: kiểm tra các vị trí Chrome/Brave/Edge/Chromium thường gặp dưới `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, và
  `/usr/lib/chromium-browser`.
- Windows: kiểm tra các vị trí cài đặt thường gặp.

## API điều khiển (tùy chọn)

Để viết script và gỡ lỗi, Gateway cung cấp một **API HTTP điều khiển chỉ dành cho loopback**
nhỏ cùng với CLI `openclaw browser` tương ứng (snapshot, refs, tăng cường wait,
đầu ra JSON, quy trình gỡ lỗi). Xem
[API điều khiển trình duyệt](/vi/tools/browser-control) để biết tài liệu tham khảo đầy đủ.

## Khắc phục sự cố

Với các vấn đề riêng của Linux (đặc biệt là snap Chromium), xem
[Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting).

Với các thiết lập chia tách máy chủ WSL2 Gateway + Windows Chrome, xem
[Khắc phục sự cố WSL2 + Windows + CDP Chrome từ xa](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Lỗi khởi động CDP so với chặn SSRF điều hướng

Đây là các loại lỗi khác nhau và chúng trỏ tới các đường dẫn mã khác nhau.

- **Lỗi khởi động hoặc sẵn sàng CDP** nghĩa là OpenClaw không thể xác nhận rằng mặt phẳng điều khiển trình duyệt đang khỏe mạnh.
- **Chặn SSRF điều hướng** nghĩa là mặt phẳng điều khiển trình duyệt đang khỏe mạnh, nhưng mục tiêu điều hướng trang bị chính sách từ chối.

Ví dụ thường gặp:

- Lỗi khởi động hoặc sẵn sàng CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` khi một
    dịch vụ CDP bên ngoài qua loopback được cấu hình mà không có `attachOnly: true`
- Chặn SSRF điều hướng:
  - các luồng `open`, `navigate`, snapshot, hoặc mở tab thất bại với lỗi chính sách trình duyệt/mạng trong khi `start` và `tabs` vẫn hoạt động

Dùng chuỗi tối thiểu này để tách hai trường hợp:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cách đọc kết quả:

- Nếu `start` thất bại với `not reachable after start`, hãy khắc phục sẵn sàng CDP trước.
- Nếu `start` thành công nhưng `tabs` thất bại, mặt phẳng điều khiển vẫn chưa khỏe mạnh. Xem đây là vấn đề khả năng truy cập CDP, không phải vấn đề điều hướng trang.
- Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt đã hoạt động và lỗi nằm ở chính sách điều hướng hoặc trang mục tiêu.
- Nếu `start`, `tabs`, và `open` đều thành công, đường dẫn điều khiển trình duyệt được quản lý cơ bản đang khỏe mạnh.

Chi tiết hành vi quan trọng:

- Cấu hình trình duyệt mặc định dùng một đối tượng chính sách SSRF đóng khi lỗi ngay cả khi bạn không cấu hình `browser.ssrfPolicy`.
- Với hồ sơ `openclaw` được quản lý qua local loopback, kiểm tra sức khỏe CDP cố ý bỏ qua thực thi khả năng truy cập SSRF của trình duyệt cho mặt phẳng điều khiển cục bộ riêng của OpenClaw.
- Bảo vệ điều hướng là riêng biệt. Kết quả `start` hoặc `tabs` thành công không có nghĩa là mục tiêu `open` hoặc `navigate` sau đó được phép.

Hướng dẫn bảo mật:

- **Không** nới lỏng chính sách SSRF của trình duyệt theo mặc định.
- Ưu tiên ngoại lệ máy chủ hẹp như `hostnameAllowlist` hoặc `allowedHostnames` thay vì truy cập mạng riêng rộng.
- Chỉ dùng `dangerouslyAllowPrivateNetwork: true` trong các môi trường được tin cậy có chủ đích, nơi quyền truy cập trình duyệt vào mạng riêng là bắt buộc và đã được rà soát.

## Công cụ agent + cách điều khiển hoạt động

Agent nhận **một công cụ** để tự động hóa trình duyệt:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cách ánh xạ:

- `browser snapshot` trả về một cây UI ổn định (AI hoặc ARIA).
- `browser act` dùng ID `ref` của snapshot để nhấp/nhập/kéo/chọn.
- `browser screenshot` chụp pixel (toàn trang, phần tử, hoặc các ref có nhãn).
- `browser doctor` kiểm tra mức sẵn sàng của Gateway, Plugin, hồ sơ, trình duyệt và thẻ.
- `browser` chấp nhận:
  - `profile` để chọn một hồ sơ trình duyệt có tên (openclaw, chrome, hoặc CDP từ xa).
  - `target` (`sandbox` | `host` | `node`) để chọn nơi trình duyệt chạy.
  - Trong các phiên sandbox, `target: "host"` yêu cầu `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Nếu bỏ qua `target`: các phiên sandbox mặc định là `sandbox`, các phiên không sandbox mặc định là `host`.
  - Nếu một node có khả năng chạy trình duyệt được kết nối, công cụ có thể tự động định tuyến đến đó trừ khi bạn ghim `target="host"` hoặc `target="node"`.

Điều này giữ cho tác nhân có tính xác định và tránh các selector dễ vỡ.

## Liên quan

- [Tổng quan về công cụ](/vi/tools) — tất cả công cụ tác nhân hiện có
- [Sandboxing](/vi/gateway/sandboxing) — điều khiển trình duyệt trong môi trường sandbox
- [Bảo mật](/vi/gateway/security) — rủi ro và gia cố khi điều khiển trình duyệt
