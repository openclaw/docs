---
read_when:
    - Thêm tự động hóa trình duyệt do agent điều khiển
    - Gỡ lỗi nguyên nhân openclaw can thiệp vào Chrome của bạn
    - Triển khai cài đặt trình duyệt + vòng đời trong ứng dụng macOS
summary: Dịch vụ điều khiển trình duyệt tích hợp + các lệnh hành động
title: Trình duyệt (do OpenClaw quản lý)
x-i18n:
    generated_at: "2026-06-27T18:13:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw có thể chạy một **hồ sơ Chrome/Brave/Edge/Chromium chuyên dụng** do agent điều khiển.
Nó được tách biệt khỏi trình duyệt cá nhân của bạn và được quản lý thông qua một dịch vụ điều khiển cục bộ nhỏ bên trong Gateway (chỉ loopback).

Góc nhìn cho người mới bắt đầu:

- Hãy xem nó như một **trình duyệt riêng, chỉ dành cho agent**.
- Hồ sơ `openclaw` **không** chạm vào hồ sơ trình duyệt cá nhân của bạn.
- Agent có thể **mở tab, đọc trang, nhấp và nhập** trong một làn an toàn.
- Hồ sơ `user` tích hợp sẵn gắn vào phiên Chrome thật đã đăng nhập của bạn thông qua Chrome MCP.

## Bạn nhận được gì

- Một hồ sơ trình duyệt riêng tên là **openclaw** (mặc định dùng điểm nhấn màu cam).
- Điều khiển tab xác định được (liệt kê/mở/tập trung/đóng).
- Hành động của agent (nhấp/nhập/kéo/chọn), snapshot, ảnh chụp màn hình, PDF.
- Một skill `browser-automation` đi kèm hướng dẫn agent về vòng lặp snapshot,
  tab ổn định, tham chiếu cũ và khôi phục khi có chặn thủ công khi Plugin
  trình duyệt được bật.
- Hỗ trợ nhiều hồ sơ tùy chọn (`openclaw`, `work`, `remote`, ...).

Trình duyệt này **không** phải trình duyệt dùng hằng ngày của bạn. Đây là một bề mặt an toàn, tách biệt cho
tự động hóa và xác minh của agent.

## Khởi động nhanh

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Nếu bạn gặp "Browser disabled", hãy bật nó trong cấu hình (xem bên dưới) và khởi động lại
Gateway.

Nếu `openclaw browser` hoàn toàn bị thiếu, hoặc agent nói công cụ trình duyệt
không khả dụng, hãy chuyển đến [Thiếu lệnh hoặc công cụ trình duyệt](/vi/tools/browser#missing-browser-command-or-tool).

## Điều khiển Plugin

Công cụ `browser` mặc định là một Plugin đi kèm. Tắt nó để thay bằng Plugin khác đăng ký cùng tên công cụ `browser`:

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

Mặc định cần cả `plugins.entries.browser.enabled` **và** `browser.enabled=true`. Chỉ tắt Plugin sẽ loại bỏ CLI `openclaw browser`, phương thức gateway `browser.request`, công cụ agent và dịch vụ điều khiển như một đơn vị; cấu hình `browser.*` của bạn vẫn được giữ nguyên để dùng cho phần thay thế.

Thay đổi cấu hình trình duyệt yêu cầu khởi động lại Gateway để Plugin có thể đăng ký lại dịch vụ của nó.

## Hướng dẫn cho agent

Ghi chú về hồ sơ công cụ: `tools.profile: "coding"` bao gồm `web_search` và
`web_fetch`, nhưng không bao gồm đầy đủ công cụ `browser`. Nếu agent hoặc một
sub-agent được tạo ra cần dùng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn
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
Chỉ `tools.subagents.tools.allow: ["browser"]` là chưa đủ vì chính sách sub-agent
được áp dụng sau bước lọc hồ sơ.

Plugin trình duyệt cung cấp hai cấp hướng dẫn cho agent:

- Mô tả công cụ `browser` mang hợp đồng ngắn gọn luôn bật: chọn
  đúng hồ sơ, giữ tham chiếu trên cùng một tab, dùng `tabId`/nhãn để nhắm mục tiêu
  tab, và tải skill trình duyệt cho công việc nhiều bước.
- Skill `browser-automation` đi kèm mang vòng lặp vận hành dài hơn:
  kiểm tra trạng thái/tab trước, gắn nhãn tab tác vụ, snapshot trước khi hành động, snapshot lại
  sau thay đổi UI, khôi phục tham chiếu cũ một lần, và báo cáo chặn đăng nhập/2FA/captcha hoặc
  camera/microphone là hành động thủ công thay vì đoán.

Skills đi kèm Plugin được liệt kê trong các Skills khả dụng của agent khi
Plugin được bật. Hướng dẫn skill đầy đủ được tải theo nhu cầu, nên các lượt
thông thường không phải trả toàn bộ chi phí token.

## Thiếu lệnh hoặc công cụ trình duyệt

Nếu `openclaw browser` không được nhận biết sau khi nâng cấp, `browser.request` bị thiếu, hoặc agent báo công cụ trình duyệt không khả dụng, nguyên nhân thường gặp là danh sách `plugins.allow` bỏ sót `browser` và không có khối cấu hình `browser` ở gốc. Hãy thêm nó:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Một khối `browser` rõ ràng ở gốc, ví dụ `browser.enabled=true` hoặc `browser.profiles.<name>`, sẽ kích hoạt Plugin trình duyệt đi kèm ngay cả khi `plugins.allow` hạn chế, khớp với hành vi cấu hình kênh. `plugins.entries.browser.enabled=true` và `tools.alsoAllow: ["browser"]` tự chúng không thay thế cho tư cách thành viên allowlist. Xóa hoàn toàn `plugins.allow` cũng khôi phục mặc định.

## Hồ sơ: `openclaw` so với `user`

- `openclaw`: trình duyệt được quản lý, tách biệt (không cần extension).
- `user`: hồ sơ gắn Chrome MCP tích hợp sẵn cho phiên **Chrome thật đã đăng nhập**
  của bạn.

Với các lệnh gọi công cụ trình duyệt của agent:

- Mặc định: dùng trình duyệt `openclaw` tách biệt.
- Ưu tiên `profile="user"` khi các phiên đã đăng nhập hiện có là quan trọng và người dùng
  đang ở máy tính để nhấp/phê duyệt mọi lời nhắc gắn.
- `profile` là ghi đè rõ ràng khi bạn muốn một chế độ trình duyệt cụ thể.

Đặt `browser.defaultProfile: "openclaw"` nếu bạn muốn mặc định dùng chế độ được quản lý.

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

### Thị giác ảnh chụp màn hình (hỗ trợ mô hình chỉ văn bản)

Khi mô hình chính chỉ hỗ trợ văn bản (không hỗ trợ thị giác/đa phương thức), ảnh chụp màn hình
trình duyệt trả về các khối ảnh mà mô hình không thể đọc. Ảnh chụp màn hình trình duyệt
tái sử dụng cấu hình hiểu ảnh hiện có, nên một mô hình ảnh
được cấu hình cho hiểu phương tiện có thể mô tả ảnh chụp màn hình dưới dạng văn bản mà không cần bất kỳ
thiết lập mô hình riêng cho trình duyệt nào.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Cách hoạt động:**

1. Agent gọi `browser screenshot` → ảnh được chụp vào ổ đĩa như thường lệ.
2. Công cụ trình duyệt hỏi runtime hiểu ảnh hiện có xem nó
   có thể mô tả ảnh chụp màn hình bằng các mô hình ảnh media đã cấu hình, mô hình media dùng chung,
   mặc định mô hình ảnh, hoặc một nhà cung cấp ảnh có xác thực hay không.
3. Mô hình thị giác trả về mô tả văn bản, được bọc bằng
   `wrapExternalContent` (rào chắn prompt injection) và trả về cho agent
   dưới dạng khối văn bản thay vì khối ảnh.
4. Nếu hiểu ảnh không khả dụng, bị bỏ qua, hoặc thất bại, trình duyệt sẽ
   quay lại trả về khối ảnh gốc.

Dùng các trường `tools.media.image` / `tools.media.models` hiện có cho
fallback mô hình, thời gian chờ, giới hạn byte, hồ sơ và thiết lập yêu cầu nhà cung cấp.

Nếu mô hình chính đang hoạt động đã hỗ trợ thị giác và không có mô hình
hiểu ảnh rõ ràng nào được cấu hình, OpenClaw giữ kết quả ảnh bình thường để
mô hình chính có thể đọc trực tiếp ảnh chụp màn hình.

<AccordionGroup>

<Accordion title="Ports and reachability">

- Dịch vụ điều khiển bind vào loopback trên một cổng suy ra từ `gateway.port` (mặc định `18791` = gateway + 2). Ghi đè `gateway.port` hoặc `OPENCLAW_GATEWAY_PORT` sẽ dịch chuyển các cổng suy ra trong cùng họ.
- Các hồ sơ `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl`; chỉ đặt các giá trị đó cho
  hồ sơ CDP từ xa hoặc gắn endpoint existing-session. `cdpUrl` mặc định là
  cổng CDP cục bộ được quản lý khi chưa đặt.
- `remoteCdpTimeoutMs` áp dụng cho kiểm tra khả năng truy cập CDP HTTP từ xa và `attachOnly`
  cũng như yêu cầu HTTP mở tab; `remoteCdpHandshakeTimeoutMs` áp dụng cho
  các bắt tay CDP WebSocket của chúng.
- `localLaunchTimeoutMs` là ngân sách cho một tiến trình Chrome được quản lý khởi chạy cục bộ
  để lộ endpoint CDP HTTP của nó. `localCdpReadyTimeoutMs` là
  ngân sách tiếp theo cho mức sẵn sàng CDP websocket sau khi tiến trình được phát hiện.
  Tăng các giá trị này trên Raspberry Pi, VPS cấu hình thấp, hoặc phần cứng cũ nơi Chromium
  khởi động chậm. Giá trị phải là số nguyên dương tối đa `120000` ms; giá trị
  cấu hình không hợp lệ sẽ bị từ chối.
- Các lỗi khởi chạy/sẵn sàng Chrome được quản lý lặp lại sẽ bị ngắt mạch theo từng
  hồ sơ. Sau nhiều lỗi liên tiếp, OpenClaw tạm dừng ngắn các lần thử khởi chạy mới
  thay vì sinh Chromium ở mọi lệnh gọi công cụ trình duyệt. Khắc phục
  sự cố khởi động, tắt trình duyệt nếu không cần, hoặc khởi động lại
  Gateway sau khi sửa.
- `actionTimeoutMs` là ngân sách mặc định cho yêu cầu `act` của trình duyệt khi bên gọi không truyền `timeoutMs`. Transport client thêm một cửa sổ đệm nhỏ để các lần chờ lâu có thể hoàn tất thay vì hết thời gian ở ranh giới HTTP.
- `tabCleanup` là dọn dẹp best-effort cho các tab được mở bởi phiên trình duyệt của agent chính. Việc dọn dẹp vòng đời subagent, cron và ACP vẫn đóng các tab được theo dõi rõ ràng của chúng khi kết thúc phiên; phiên chính giữ các tab đang hoạt động có thể tái sử dụng, rồi đóng các tab được theo dõi bị nhàn rỗi hoặc vượt mức trong nền.

</Accordion>

<Accordion title="SSRF policy">

- Điều hướng trình duyệt và mở tab được bảo vệ SSRF trước khi điều hướng, sau đó được kiểm tra lại theo khả năng tốt nhất trên URL `http(s)` cuối cùng.
- Trong chế độ SSRF nghiêm ngặt, việc khám phá endpoint CDP từ xa và các probe `/json/version` (`cdpUrl`) cũng được kiểm tra.
- Các biến môi trường Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và `NO_PROXY` không tự động proxy trình duyệt do OpenClaw quản lý. Chrome được quản lý khởi chạy trực tiếp theo mặc định, nên cài đặt proxy của provider không làm suy yếu kiểm tra SSRF của trình duyệt.
- Các probe sẵn sàng CDP local do OpenClaw quản lý và kết nối WebSocket DevTools bỏ qua proxy mạng được quản lý cho đúng endpoint loopback đã khởi chạy, nên `openclaw browser start` vẫn hoạt động khi proxy của operator chặn lưu lượng loopback đi ra.
- Để proxy chính trình duyệt được quản lý, truyền các cờ proxy Chrome rõ ràng qua `browser.extraArgs`, chẳng hạn như `--proxy-server=...` hoặc `--proxy-pac-url=...`. Chế độ SSRF nghiêm ngặt chặn định tuyến proxy trình duyệt rõ ràng trừ khi quyền truy cập trình duyệt mạng riêng được cố ý bật.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tắt theo mặc định; chỉ bật khi quyền truy cập trình duyệt mạng riêng được chủ ý tin cậy.
- `browser.ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ dưới dạng bí danh cũ.

</Accordion>

<Accordion title="Hành vi hồ sơ">

- `attachOnly: true` nghĩa là không bao giờ khởi chạy trình duyệt local; chỉ gắn vào nếu đã có một trình duyệt đang chạy.
- `headless` có thể được đặt toàn cục hoặc theo từng hồ sơ được quản lý local. Giá trị theo hồ sơ ghi đè `browser.headless`, nên một hồ sơ được khởi chạy local có thể chạy headless trong khi hồ sơ khác vẫn hiển thị.
- `POST /start?headless=true` và `openclaw browser start --headless` yêu cầu một lần khởi chạy headless cho các hồ sơ được quản lý local mà không ghi lại `browser.headless` hoặc cấu hình hồ sơ. Các hồ sơ phiên hiện có, chỉ gắn vào và CDP từ xa từ chối ghi đè này vì OpenClaw không khởi chạy các tiến trình trình duyệt đó.
- Trên các máy Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, các hồ sơ được quản lý local mặc định tự động sang headless khi cả môi trường lẫn cấu hình hồ sơ/toàn cục đều không chọn rõ chế độ có giao diện. `openclaw browser status --json` báo cáo `headlessSource` là `env`, `profile`, `config`, `request`, `linux-display-fallback` hoặc `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` buộc các lần khởi chạy được quản lý local chạy headless cho tiến trình hiện tại. `OPENCLAW_BROWSER_HEADLESS=0` buộc chế độ có giao diện cho các lần khởi động thông thường và trả về lỗi có thể hành động trên các máy Linux không có display server; yêu cầu rõ ràng `start --headless` vẫn thắng cho lần khởi chạy đó.
- `executablePath` có thể được đặt toàn cục hoặc theo từng hồ sơ được quản lý local. Giá trị theo hồ sơ ghi đè `browser.executablePath`, nên các hồ sơ được quản lý khác nhau có thể khởi chạy các trình duyệt dựa trên Chromium khác nhau. Cả hai dạng đều chấp nhận `~` cho thư mục home của hệ điều hành của bạn.
- `color` (cấp cao nhất và theo hồ sơ) tô màu UI trình duyệt để bạn có thể thấy hồ sơ nào đang hoạt động.
- Hồ sơ mặc định là `openclaw` (được quản lý độc lập). Dùng `defaultProfile: "user"` để chọn dùng trình duyệt người dùng đã đăng nhập.
- Thứ tự tự động phát hiện: trình duyệt mặc định của hệ thống nếu dựa trên Chromium; nếu không thì Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` dùng Chrome DevTools MCP thay vì CDP thô. Nó có thể gắn qua tự động kết nối Chrome MCP, hoặc qua `cdpUrl` khi bạn đã có endpoint DevTools cho trình duyệt đang chạy.
- Đặt `browser.profiles.<name>.userDataDir` khi hồ sơ phiên hiện có cần gắn vào một hồ sơ người dùng Chromium không mặc định (Brave, Edge, v.v.). Đường dẫn này cũng chấp nhận `~` cho thư mục home của hệ điều hành của bạn.

</Accordion>

</AccordionGroup>

## Dùng Brave hoặc trình duyệt dựa trên Chromium khác

Nếu trình duyệt **mặc định của hệ thống** của bạn dựa trên Chromium (Chrome/Brave/Edge/v.v.),
OpenClaw tự động dùng nó. Đặt `browser.executablePath` để ghi đè
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

`executablePath` theo hồ sơ chỉ ảnh hưởng đến các hồ sơ được quản lý local mà OpenClaw
khởi chạy. Các hồ sơ `existing-session` gắn vào một trình duyệt đã chạy sẵn
thay vào đó, và các hồ sơ CDP từ xa dùng trình duyệt phía sau `cdpUrl`.

## Điều khiển local và từ xa

- **Điều khiển local (mặc định):** Gateway khởi động dịch vụ điều khiển loopback và có thể khởi chạy trình duyệt local.
- **Điều khiển từ xa (máy chủ node):** chạy máy chủ node trên máy có trình duyệt; Gateway proxy các hành động trình duyệt tới đó.
- **CDP từ xa:** đặt `browser.profiles.<name>.cdpUrl` (hoặc `browser.cdpUrl`) để
  gắn vào một trình duyệt dựa trên Chromium từ xa. Trong trường hợp này, OpenClaw sẽ không khởi chạy trình duyệt local.
- Với các dịch vụ CDP được quản lý bên ngoài trên loopback (ví dụ Browserless trong
  Docker được publish tới `127.0.0.1`), cũng đặt `attachOnly: true`. CDP loopback
  không có `attachOnly` được xem là hồ sơ trình duyệt được OpenClaw quản lý local.
- `headless` chỉ ảnh hưởng đến các hồ sơ được quản lý local mà OpenClaw khởi chạy. Nó không khởi động lại hoặc thay đổi các trình duyệt phiên hiện có hoặc CDP từ xa.
- `executablePath` tuân theo cùng quy tắc hồ sơ được quản lý local. Việc thay đổi nó trên một
  hồ sơ được quản lý local đang chạy sẽ đánh dấu hồ sơ đó để khởi động lại/điều hòa, để lần
  khởi chạy tiếp theo dùng binary mới.

Hành vi dừng khác nhau theo chế độ hồ sơ:

- hồ sơ được quản lý local: `openclaw browser stop` dừng tiến trình trình duyệt mà
  OpenClaw đã khởi chạy
- hồ sơ chỉ gắn vào và CDP từ xa: `openclaw browser stop` đóng phiên điều khiển
  đang hoạt động và giải phóng các ghi đè mô phỏng Playwright/CDP (viewport,
  bảng màu, locale, múi giờ, chế độ offline và trạng thái tương tự), dù
  không có tiến trình trình duyệt nào được OpenClaw khởi chạy

URL CDP từ xa có thể bao gồm xác thực:

- Token truy vấn (ví dụ: `https://provider.example?token=<token>`)
- Xác thực HTTP Basic (ví dụ: `https://user:pass@provider.example`)

OpenClaw giữ nguyên xác thực khi gọi các endpoint `/json/*` và khi kết nối
tới WebSocket CDP. Ưu tiên biến môi trường hoặc trình quản lý bí mật cho
token thay vì commit chúng vào tệp cấu hình.

## Proxy trình duyệt Node (mặc định không cần cấu hình)

Nếu bạn chạy một **máy chủ node** trên máy có trình duyệt, OpenClaw có thể
tự động định tuyến các lệnh gọi công cụ trình duyệt tới node đó mà không cần cấu hình trình duyệt bổ sung.
Đây là đường dẫn mặc định cho các gateway từ xa.

Ghi chú:

- Máy chủ node phơi bày server điều khiển trình duyệt local của nó qua một **lệnh proxy**.
- Hồ sơ đến từ cấu hình `browser.profiles` riêng của node (giống local).
- `nodeHost.browserProxy.allowProfiles` là tùy chọn. Để trống để có hành vi cũ/mặc định: mọi hồ sơ đã cấu hình vẫn truy cập được qua proxy, bao gồm các tuyến tạo/xóa hồ sơ.
- Nếu bạn đặt `nodeHost.browserProxy.allowProfiles`, OpenClaw xem nó là ranh giới đặc quyền tối thiểu: chỉ các hồ sơ trong danh sách cho phép mới có thể được nhắm tới, và các tuyến tạo/xóa hồ sơ bền vững bị chặn trên bề mặt proxy.
- Tắt nếu bạn không muốn dùng:
  - Trên node: `nodeHost.browserProxy.enabled=false`
  - Trên gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP từ xa được lưu trữ)

[Browserless](https://browserless.io) là một dịch vụ Chromium được lưu trữ, phơi bày
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
- Chọn endpoint vùng khớp với tài khoản Browserless của bạn (xem tài liệu của họ).
- Nếu Browserless cung cấp cho bạn URL nền HTTPS, bạn có thể chuyển nó thành
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
đặt Browserless `EXTERNAL` thành cùng cơ sở WebSocket công khai-đến-OpenClaw đó, chẳng
hạn như `ws://127.0.0.1:3000`, `ws://browserless:3000` hoặc một địa chỉ mạng Docker
riêng ổn định. Nếu `/json/version` trả về `webSocketDebuggerUrl` trỏ tới
một địa chỉ OpenClaw không thể truy cập, CDP HTTP có thể trông vẫn ổn trong khi việc
gắn WebSocket vẫn thất bại.

Đừng để `attachOnly` chưa đặt cho hồ sơ Browserless loopback. Không có
`attachOnly`, OpenClaw xem cổng loopback là hồ sơ trình duyệt được quản lý local
và có thể báo rằng cổng đang được dùng nhưng không thuộc sở hữu của OpenClaw.

## Nhà cung cấp CDP WebSocket trực tiếp

Một số dịch vụ trình duyệt được lưu trữ phơi bày endpoint **WebSocket trực tiếp** thay vì
khám phá CDP chuẩn dựa trên HTTP (`/json/version`). OpenClaw chấp nhận ba
dạng URL CDP và tự động chọn chiến lược kết nối phù hợp:

- **Khám phá HTTP(S)** - `http://host[:port]` hoặc `https://host[:port]`.
  OpenClaw gọi `/json/version` để khám phá URL trình gỡ lỗi WebSocket, rồi
  kết nối. Không có fallback WebSocket.
- **Endpoint WebSocket trực tiếp** - `ws://host[:port]/devtools/<kind>/<id>` hoặc
  `wss://...` với đường dẫn `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw kết nối trực tiếp qua bắt tay WebSocket và bỏ qua
  `/json/version` hoàn toàn.
- **Gốc WebSocket trần** - `ws://host[:port]` hoặc `wss://host[:port]` không có
  đường dẫn `/devtools/...` (ví dụ: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw thử khám phá HTTP
  `/json/version` trước (chuẩn hóa scheme thành `http`/`https`);
  nếu khám phá trả về `webSocketDebuggerUrl` thì URL đó được dùng, nếu không OpenClaw
  fallback sang bắt tay WebSocket trực tiếp tại gốc trần. Nếu endpoint
  WebSocket được quảng bá từ chối bắt tay CDP nhưng gốc trần đã cấu hình
  chấp nhận, OpenClaw cũng fallback sang gốc đó. Điều này cho phép một `ws://` trần
  trỏ tới Chrome local vẫn kết nối, vì Chrome chỉ chấp nhận nâng cấp WebSocket
  trên đường dẫn riêng theo target từ `/json/version`, trong khi các provider
  được lưu trữ vẫn có thể dùng endpoint WebSocket gốc khi endpoint khám phá của họ
  quảng bá một URL ngắn hạn không phù hợp cho Playwright CDP.

`openclaw browser doctor` dùng cùng logic ưu tiên khám phá rồi fallback WebSocket
như khi runtime gắn vào, nên URL gốc trần kết nối thành công sẽ không bị
báo là không thể truy cập bởi chẩn đoán.

### Browserbase

[Browserbase](https://www.browserbase.com) là một nền tảng đám mây để chạy
trình duyệt headless với giải CAPTCHA tích hợp, chế độ stealth và proxy dân cư.

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
  từ [bảng điều khiển tổng quan](https://www.browserbase.com/overview).
- Thay `<BROWSERBASE_API_KEY>` bằng khóa API Browserbase thật của bạn.
- Browserbase tự động tạo một phiên trình duyệt khi kết nối WebSocket, vì vậy
  không cần bước tạo phiên thủ công.
- Gói miễn phí cho phép một phiên đồng thời và một giờ trình duyệt mỗi tháng.
  Xem [bảng giá](https://www.browserbase.com/pricing) để biết giới hạn của các gói trả phí.
- Xem [tài liệu Browserbase](https://docs.browserbase.com) để có tài liệu tham khảo API
  đầy đủ, hướng dẫn SDK và ví dụ tích hợp.

### Notte

[Notte](https://www.notte.cc) là một nền tảng đám mây để chạy trình duyệt
headless với stealth tích hợp sẵn, proxy dân cư và Gateway WebSocket
gốc CDP.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Ghi chú:

- [Đăng ký](https://console.notte.cc) và sao chép **API Key** của bạn từ
  trang cài đặt console.
- Thay `<NOTTE_API_KEY>` bằng khóa API Notte thật của bạn.
- Notte tự động tạo một phiên trình duyệt khi kết nối WebSocket, vì vậy không cần
  bước tạo phiên thủ công. Phiên sẽ bị hủy khi WebSocket ngắt kết nối.
- Gói miễn phí cho phép năm phiên đồng thời và tổng cộng 100 giờ trình duyệt
  trọn đời. Xem [bảng giá](https://www.notte.cc/#pricing) để biết giới hạn của các gói trả phí.
- Xem [tài liệu Notte](https://docs.notte.cc) để có tài liệu tham khảo API đầy đủ, hướng dẫn SDK
  và ví dụ tích hợp.

## Bảo mật

Ý chính:

- Điều khiển trình duyệt chỉ hoạt động qua loopback; quyền truy cập đi qua xác thực của Gateway hoặc ghép cặp node.
- API HTTP trình duyệt loopback độc lập chỉ dùng **xác thực bí mật dùng chung**:
  xác thực bearer bằng gateway token, `x-openclaw-password`, hoặc xác thực HTTP Basic với
  mật khẩu gateway đã cấu hình.
- Header danh tính Tailscale Serve và `gateway.auth.mode: "trusted-proxy"` **không**
  xác thực API trình duyệt loopback độc lập này.
- Nếu điều khiển trình duyệt được bật và chưa cấu hình xác thực bí mật dùng chung, OpenClaw
  sẽ tạo gateway token chỉ dùng trong runtime cho lần khởi động đó. Cấu hình
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, hoặc
  `OPENCLAW_GATEWAY_PASSWORD` một cách rõ ràng nếu client cần bí mật ổn định qua các lần
  khởi động lại.
- OpenClaw **không** tự động tạo token đó khi `gateway.auth.mode` đã là
  `password`, `none`, hoặc `trusted-proxy`.
- Giữ Gateway và mọi máy chủ node trong mạng riêng tư (Tailscale); tránh phơi bày công khai.
- Xem URL/token CDP từ xa là bí mật; ưu tiên biến môi trường hoặc trình quản lý bí mật.

Mẹo CDP từ xa:

- Ưu tiên endpoint được mã hóa (HTTPS hoặc WSS) và token ngắn hạn khi có thể.
- Tránh nhúng trực tiếp token dài hạn vào tệp cấu hình.

## Hồ sơ (đa trình duyệt)

OpenClaw hỗ trợ nhiều hồ sơ có tên (cấu hình định tuyến). Hồ sơ có thể là:

- **do openclaw quản lý**: một phiên bản trình duyệt dựa trên Chromium chuyên dụng, có thư mục dữ liệu người dùng riêng + cổng CDP riêng
- **từ xa**: một URL CDP rõ ràng (trình duyệt dựa trên Chromium chạy ở nơi khác)
- **phiên hiện có**: hồ sơ Chrome hiện có của bạn thông qua tự động kết nối Chrome DevTools MCP

Mặc định:

- Hồ sơ `openclaw` được tự động tạo nếu thiếu.
- Hồ sơ `user` được tích hợp sẵn để gắn vào phiên hiện có của Chrome MCP.
- Các hồ sơ phiên hiện có ngoài `user` là tùy chọn bật; tạo chúng bằng `--driver existing-session`.
- Cổng CDP cục bộ mặc định được cấp phát từ **18800-18899**.
- Xóa một hồ sơ sẽ chuyển thư mục dữ liệu cục bộ của hồ sơ đó vào Thùng rác.

Tất cả endpoint điều khiển đều chấp nhận `?profile=<name>`; CLI dùng `--browser-profile`.

## Phiên hiện có qua Chrome DevTools MCP

OpenClaw cũng có thể gắn vào một hồ sơ trình duyệt dựa trên Chromium đang chạy thông qua
máy chủ Chrome DevTools MCP chính thức. Cách này tái sử dụng các tab và trạng thái đăng nhập
đã mở trong hồ sơ trình duyệt đó.

Tài liệu nền và hướng dẫn thiết lập chính thức:

- [Chrome dành cho nhà phát triển: Sử dụng Chrome DevTools MCP với phiên trình duyệt của bạn](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Hồ sơ tích hợp sẵn:

- `user`

Tùy chọn: tạo hồ sơ phiên hiện có tùy chỉnh của riêng bạn nếu muốn một
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

1. Mở trang inspect của trình duyệt đó để gỡ lỗi từ xa.
2. Bật gỡ lỗi từ xa.
3. Giữ trình duyệt đang chạy và chấp thuận lời nhắc kết nối khi OpenClaw gắn vào.

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

Dấu hiệu thành công:

- `status` hiển thị `driver: existing-session`
- `status` hiển thị `transport: chrome-mcp`
- `status` hiển thị `running: true`
- `tabs` liệt kê các tab trình duyệt đã mở của bạn
- `snapshot` trả về ref từ tab trực tiếp đã chọn

Những điều cần kiểm tra nếu không gắn được:

- trình duyệt đích dựa trên Chromium là phiên bản `144+`
- gỡ lỗi từ xa đã được bật trong trang inspect của trình duyệt đó
- trình duyệt đã hiển thị và bạn đã chấp nhận lời nhắc đồng ý gắn vào
- nếu Chrome được khởi động với `--remote-debugging-port` rõ ràng, hãy đặt
  `browser.profiles.<name>.cdpUrl` thành endpoint DevTools đó thay vì dựa vào
  tự động kết nối Chrome MCP
- `openclaw doctor` di chuyển cấu hình trình duyệt cũ dựa trên tiện ích mở rộng và kiểm tra rằng
  Chrome đã được cài đặt cục bộ cho các hồ sơ tự động kết nối mặc định, nhưng nó không thể
  bật gỡ lỗi từ xa phía trình duyệt thay bạn

Cách agent sử dụng:

- Dùng `profile="user"` khi bạn cần trạng thái trình duyệt đã đăng nhập của người dùng.
- Nếu bạn dùng hồ sơ phiên hiện có tùy chỉnh, hãy truyền tên hồ sơ rõ ràng đó.
- Chỉ chọn chế độ này khi người dùng đang ở máy tính để chấp thuận lời nhắc
  gắn vào.
- Gateway hoặc máy chủ node có thể tạo `npx chrome-devtools-mcp@latest --autoConnect`

Ghi chú:

- Đường dẫn này có rủi ro cao hơn hồ sơ `openclaw` cô lập vì nó có thể
  thao tác bên trong phiên trình duyệt đã đăng nhập của bạn.
- OpenClaw không khởi chạy trình duyệt cho driver này; nó chỉ gắn vào.
- OpenClaw dùng luồng `--autoConnect` chính thức của Chrome DevTools MCP tại đây. Nếu
  `userDataDir` được đặt, giá trị đó được truyền qua để nhắm tới thư mục dữ liệu người dùng đó.
- Phiên hiện có có thể gắn trên máy chủ đã chọn hoặc thông qua một node trình duyệt
  đã kết nối. Nếu Chrome nằm ở nơi khác và không có node trình duyệt nào được kết nối, hãy dùng
  CDP từ xa hoặc một máy chủ node thay thế.

### Khởi chạy Chrome MCP tùy chỉnh

Ghi đè máy chủ Chrome DevTools MCP được tạo theo từng hồ sơ khi luồng mặc định
`npx chrome-devtools-mcp@latest` không phải điều bạn muốn (máy chủ ngoại tuyến,
phiên bản ghim, binary vendored):

| Trường       | Tác dụng                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Tệp thực thi để tạo thay cho `npx`. Được phân giải nguyên trạng; đường dẫn tuyệt đối được tôn trọng.                       |
| `mcpArgs`    | Mảng đối số được truyền nguyên văn cho `mcpCommand`. Thay thế các đối số mặc định `chrome-devtools-mcp@latest --autoConnect`. |

Khi `cdpUrl` được đặt trên hồ sơ phiên hiện có, OpenClaw bỏ qua
`--autoConnect` và tự động chuyển tiếp endpoint tới Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint khám phá HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket trực tiếp).

Không thể kết hợp cờ endpoint và `userDataDir`: khi `cdpUrl` được đặt,
`userDataDir` bị bỏ qua cho khởi chạy Chrome MCP, vì Chrome MCP gắn vào
trình duyệt đang chạy phía sau endpoint thay vì mở một thư mục hồ sơ.

<Accordion title="Giới hạn tính năng của phiên hiện có">

So với hồ sơ `openclaw` được quản lý, driver phiên hiện có bị hạn chế hơn:

- **Ảnh chụp màn hình** - chụp trang và chụp phần tử bằng `--ref` hoạt động; bộ chọn CSS `--element` thì không. `--full-page` không thể kết hợp với `--ref` hoặc `--element`. Không cần Playwright cho ảnh chụp trang hoặc phần tử dựa trên ref.
- **Hành động** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, và `select` yêu cầu ref snapshot (không dùng bộ chọn CSS). `click-coords` nhấp vào tọa độ viewport hiển thị và không yêu cầu ref snapshot. `click` chỉ dùng nút trái. `type` không hỗ trợ `slowly=true`; dùng `fill` hoặc `press`. `press` không hỗ trợ `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, và `evaluate` không hỗ trợ timeout theo từng lệnh gọi. `select` chấp nhận một giá trị duy nhất.
- **Chờ / tải lên / hộp thoại** - `wait --url` hỗ trợ mẫu chính xác, chuỗi con và glob; `wait --load networkidle` không được hỗ trợ trên hồ sơ phiên hiện có (nó hoạt động trên hồ sơ được quản lý và hồ sơ CDP thô/từ xa). Hook tải lên yêu cầu `ref` hoặc `inputRef`, mỗi lần một tệp, không có CSS `element`. Hook hộp thoại không hỗ trợ ghi đè timeout hoặc `dialogId`.
- **Khả năng hiển thị hộp thoại** - Phản hồi hành động của trình duyệt được quản lý bao gồm `blockedByDialog` và `browserState.dialogs.pending` khi một hành động mở hộp thoại modal; snapshot cũng bao gồm trạng thái hộp thoại đang chờ. Phản hồi bằng `browser dialog --accept/--dismiss --dialog-id <id>` khi hộp thoại đang chờ. Hộp thoại được xử lý bên ngoài OpenClaw xuất hiện dưới `browserState.dialogs.recent`.
- **Tính năng chỉ dành cho chế độ được quản lý** - hành động hàng loạt, xuất PDF, chặn tải xuống và `responsebody` vẫn yêu cầu đường dẫn trình duyệt được quản lý.

</Accordion>

## Đảm bảo cô lập

- **Thư mục dữ liệu người dùng chuyên dụng**: không bao giờ chạm vào hồ sơ trình duyệt cá nhân của bạn.
- **Cổng chuyên dụng**: tránh `9222` để ngăn xung đột với quy trình phát triển.
- **Điều khiển tab xác định**: `tabs` trả về `suggestedTargetId` trước, sau đó là
  handle `tabId` ổn định như `t1`, nhãn tùy chọn và `targetId` thô.
  Agent nên tái sử dụng `suggestedTargetId`; id thô vẫn sẵn có để
  gỡ lỗi và tương thích.

## Chọn trình duyệt

Khi khởi chạy cục bộ, OpenClaw chọn mục khả dụng đầu tiên:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bạn có thể ghi đè bằng `browser.executablePath`.

Nền tảng:

- macOS: kiểm tra `/Applications` và `~/Applications`.
- Linux: kiểm tra các vị trí Chrome/Brave/Edge/Chromium thường gặp trong `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, và
  `/usr/lib/chromium-browser`, cùng với Chromium do Playwright quản lý trong
  `PLAYWRIGHT_BROWSERS_PATH` hoặc `~/.cache/ms-playwright`.
- Windows: kiểm tra các vị trí cài đặt thường gặp.

## API điều khiển (tùy chọn)

Để viết script và gỡ lỗi, Gateway cung cấp một **API HTTP điều khiển chỉ qua loopback**
nhỏ cùng với CLI `openclaw browser` tương ứng (snapshot, ref, tăng cường chờ,
đầu ra JSON, quy trình gỡ lỗi). Xem
[API điều khiển trình duyệt](/vi/tools/browser-control) để có tài liệu tham khảo đầy đủ.

## Khắc phục sự cố

Đối với các sự cố riêng của Linux (đặc biệt là snap Chromium), xem
[Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting).

Đối với các thiết lập tách máy chủ WSL2 Gateway + Windows Chrome, xem
[Khắc phục sự cố WSL2 + Windows + Chrome CDP từ xa](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Lỗi khởi động CDP so với chặn SSRF khi điều hướng

Đây là các lớp lỗi khác nhau và chúng trỏ tới các đường dẫn mã khác nhau.

- **Lỗi khởi động hoặc trạng thái sẵn sàng của CDP** nghĩa là OpenClaw không thể xác nhận mặt phẳng điều khiển trình duyệt đang hoạt động tốt.
- **Chặn SSRF khi điều hướng** nghĩa là mặt phẳng điều khiển trình duyệt đang hoạt động tốt, nhưng mục tiêu điều hướng trang bị chính sách từ chối.

Ví dụ phổ biến:

- Lỗi khởi động hoặc trạng thái sẵn sàng của CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` khi một
    dịch vụ CDP bên ngoài dạng loopback được cấu hình mà không có `attachOnly: true`
- Chặn SSRF khi điều hướng:
  - Các luồng `open`, `navigate`, snapshot, hoặc mở thẻ thất bại với lỗi chính sách trình duyệt/mạng trong khi `start` và `tabs` vẫn hoạt động

Dùng chuỗi tối thiểu này để tách hai trường hợp:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cách đọc kết quả:

- Nếu `start` thất bại với `not reachable after start`, hãy khắc phục trạng thái sẵn sàng của CDP trước.
- Nếu `start` thành công nhưng `tabs` thất bại, mặt phẳng điều khiển vẫn không khỏe. Hãy xem đây là vấn đề khả năng truy cập CDP, không phải vấn đề điều hướng trang.
- Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt đã chạy và lỗi nằm ở chính sách điều hướng hoặc trang mục tiêu.
- Nếu `start`, `tabs`, và `open` đều thành công, đường dẫn điều khiển trình duyệt được quản lý cơ bản đang hoạt động tốt.

Chi tiết hành vi quan trọng:

- Cấu hình trình duyệt mặc định dùng đối tượng chính sách SSRF fail-closed ngay cả khi bạn không cấu hình `browser.ssrfPolicy`.
- Đối với hồ sơ được quản lý `openclaw` local loopback, các kiểm tra sức khỏe CDP cố ý bỏ qua việc thực thi khả năng truy cập SSRF của trình duyệt cho chính mặt phẳng điều khiển cục bộ của OpenClaw.
- Bảo vệ điều hướng là riêng biệt. Kết quả `start` hoặc `tabs` thành công không có nghĩa là mục tiêu `open` hoặc `navigate` sau đó được cho phép.

Hướng dẫn bảo mật:

- **Không** nới lỏng chính sách SSRF của trình duyệt theo mặc định.
- Ưu tiên các ngoại lệ máy chủ hẹp như `hostnameAllowlist` hoặc `allowedHostnames` thay vì quyền truy cập mạng riêng rộng.
- Chỉ dùng `dangerouslyAllowPrivateNetwork: true` trong các môi trường được tin cậy có chủ ý, nơi quyền truy cập trình duyệt vào mạng riêng là bắt buộc và đã được rà soát.

## Công cụ tác tử + cách điều khiển hoạt động

Tác tử nhận **một công cụ** để tự động hóa trình duyệt:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cách ánh xạ:

- `browser snapshot` trả về cây UI ổn định (AI hoặc ARIA).
- `browser act` dùng các ID `ref` của snapshot để nhấp/nhập/kéo/chọn.
- `browser screenshot` chụp pixel (toàn trang, phần tử, hoặc các ref có nhãn).
- `browser doctor` kiểm tra trạng thái sẵn sàng của Gateway, Plugin, hồ sơ, trình duyệt, và thẻ.
- `browser` chấp nhận:
  - `profile` để chọn một hồ sơ trình duyệt có tên (openclaw, chrome, hoặc CDP từ xa).
  - `target` (`sandbox` | `host` | `node`) để chọn nơi trình duyệt chạy.
  - Trong các phiên sandbox, `target: "host"` yêu cầu `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Nếu bỏ qua `target`: các phiên sandbox mặc định là `sandbox`, các phiên không sandbox mặc định là `host`.
  - Nếu một node có khả năng trình duyệt đã kết nối, công cụ có thể tự động định tuyến tới node đó trừ khi bạn ghim `target="host"` hoặc `target="node"`.

Điều này giữ cho tác tử có tính xác định và tránh các bộ chọn dễ vỡ.

## Liên quan

- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ tác tử có sẵn
- [Sandboxing](/vi/gateway/sandboxing) - điều khiển trình duyệt trong môi trường sandbox
- [Bảo mật](/vi/gateway/security) - rủi ro điều khiển trình duyệt và gia cố bảo mật
