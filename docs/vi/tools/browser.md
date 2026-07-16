---
read_when:
    - Thêm tính năng tự động hóa trình duyệt do tác tử điều khiển
    - Gỡ lỗi nguyên nhân OpenClaw can thiệp vào Chrome của bạn
    - Triển khai cài đặt trình duyệt và vòng đời trong ứng dụng macOS
summary: Dịch vụ điều khiển trình duyệt tích hợp + các lệnh thao tác
title: Trình duyệt (do OpenClaw quản lý)
x-i18n:
    generated_at: "2026-07-16T15:07:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw có thể chạy một **hồ sơ Chrome/Brave/Edge/Chromium chuyên dụng** do tác tử điều khiển. Hồ sơ này hoạt động thông qua một dịch vụ điều khiển cục bộ nhỏ bên trong Gateway (chỉ loopback) và được cách ly khỏi trình duyệt cá nhân của bạn.

- Hãy coi đây là một **trình duyệt riêng chỉ dành cho tác tử**. Hồ sơ `openclaw` không bao giờ tác động đến hồ sơ trình duyệt cá nhân của bạn.
- Tác tử mở tab, đọc trang, nhấp và nhập liệu trong môi trường cách ly này.
- Thay vào đó, hồ sơ `user` tích hợp sẵn kết nối với phiên Chrome thực đã đăng nhập của bạn thông qua Chrome DevTools MCP.

## Những gì bạn nhận được

- Một hồ sơ trình duyệt riêng có tên **openclaw** (mặc định có màu nhấn cam).
- Điều khiển tab có tính xác định (liệt kê/mở/đưa vào tiêu điểm/đóng).
- Các thao tác của tác tử (nhấp/nhập/kéo/chọn), bản chụp trạng thái, ảnh chụp màn hình, PDF.
- Các hồ sơ dựa trên Playwright lưu nội dung tải xuống từ thao tác điều hướng trực tiếp đến tệp đính kèm trong thư mục tải xuống được quản lý và trả về siêu dữ liệu `{ url, suggestedFilename, path }` sau khi xác thực chính sách URL cuối cùng.
- Các thao tác của tác tử dựa trên Playwright trả về một mảng `downloads` chứa cùng siêu dữ liệu được quản lý khi thao tác ngay lập tức bắt đầu một hoặc nhiều lượt tải xuống.
- Một Skills `browser-automation` đi kèm hướng dẫn tác tử về vòng lặp khôi phục bản chụp trạng thái,
  tab ổn định, tham chiếu lỗi thời và trở ngại cần xử lý thủ công khi Plugin trình duyệt
  được bật.
- Hỗ trợ nhiều hồ sơ tùy chọn (`openclaw`, `work`, `remote`, ...).

Trình duyệt này **không phải** trình duyệt dùng hằng ngày của bạn. Đây là một bề mặt an toàn, cách ly dành cho
tự động hóa và xác minh của tác tử.

Trên macOS, bạn có thể sao chép rõ ràng cookie từ một hồ sơ hệ thống thuộc họ Chrome sang một hồ sơ được quản lý riêng. Trình duyệt được quản lý vẫn sử dụng thư mục dữ liệu người dùng riêng; chỉ các cookie đã chọn được sao chép, còn bộ nhớ cục bộ và IndexedDB vẫn được giữ lại. Xem [Hồ sơ](#profiles-multi-browser) hoặc [tham chiếu CLI `openclaw browser`](/vi/cli/browser) để biết các lệnh nhập và giới hạn.

## Bắt đầu nhanh

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Trình duyệt bị vô hiệu hóa" có nghĩa là Plugin hoặc `browser.enabled` đang tắt; xem
[Cấu hình](#configuration) và [Điều khiển Plugin](#plugin-control).

Nếu hoàn toàn không có `openclaw browser`, hoặc tác tử cho biết công cụ trình duyệt
không khả dụng, hãy chuyển đến [Thiếu lệnh hoặc công cụ trình duyệt](#missing-browser-command-or-tool).

## Điều khiển Plugin

Công cụ `browser` mặc định là một Plugin đi kèm. Hãy vô hiệu hóa công cụ này để thay thế bằng một Plugin khác đăng ký cùng tên công cụ `browser`:

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

Các giá trị mặc định cần cả `plugins.entries.browser.enabled` **và** `browser.enabled=true`. Nếu chỉ vô hiệu hóa Plugin, CLI `openclaw browser`, phương thức Gateway `browser.request`, công cụ tác tử và dịch vụ điều khiển sẽ bị loại bỏ như một đơn vị; cấu hình `browser.*` của bạn vẫn được giữ nguyên để dùng với thành phần thay thế.

Các thay đổi cấu hình trình duyệt yêu cầu khởi động lại Gateway để Plugin có thể đăng ký lại dịch vụ.

## Hướng dẫn cho tác tử

Lưu ý về hồ sơ công cụ: `tools.profile: "coding"` bao gồm `web_search` và
`web_fetch`, nhưng không bao gồm toàn bộ công cụ `browser`. Để cho phép tác tử hoặc
tác tử con được tạo sử dụng tính năng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn
hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Đối với một tác tử duy nhất, hãy dùng `agents.list[].tools.alsoAllow: ["browser"]`.
Chỉ riêng `tools.subagents.tools.allow: ["browser"]` là chưa đủ vì chính sách tác tử con
được áp dụng sau khi lọc hồ sơ.

Plugin trình duyệt cung cấp hai cấp độ hướng dẫn cho tác tử:

- Mô tả công cụ `browser` chứa hợp đồng cô đọng luôn bật: chọn
  đúng hồ sơ, giữ các tham chiếu trên cùng một tab, dùng `tabId`/nhãn để nhắm mục tiêu
  tab và tải Skills trình duyệt cho công việc nhiều bước.
- Skills `browser-automation` đi kèm chứa vòng lặp vận hành dài hơn:
  trước tiên kiểm tra trạng thái/tab, gắn nhãn các tab tác vụ, chụp trạng thái trước khi thao tác, chụp lại trạng thái
  sau khi giao diện thay đổi, khôi phục tham chiếu lỗi thời một lần và báo cáo các trở ngại về đăng nhập/2FA/captcha hoặc
  camera/micrô là thao tác thủ công thay vì phỏng đoán.

Skills đi kèm Plugin được liệt kê trong các Skills khả dụng của tác tử khi
Plugin được bật. Hướng dẫn đầy đủ của Skills được tải theo nhu cầu, vì vậy các lượt
thông thường không phải chịu toàn bộ chi phí token.

## Thiếu lệnh hoặc công cụ trình duyệt

Nếu `openclaw browser` không được nhận dạng sau khi nâng cấp, thiếu `browser.request`, hoặc tác tử báo cáo công cụ trình duyệt không khả dụng, nguyên nhân thường gặp là danh sách `plugins.allow` bỏ sót `browser` và không tồn tại khối cấu hình `browser` ở cấp gốc. Hãy thêm khối đó:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Một khối `browser` rõ ràng ở cấp gốc (bất kỳ khóa nào bên dưới `browser`, chẳng hạn như
`browser.enabled=true` hoặc `browser.profiles.<name>`) sẽ kích hoạt Plugin
trình duyệt đi kèm ngay cả khi `plugins.allow` hạn chế, phù hợp với hành vi
cấu hình kênh đi kèm. Bản thân `plugins.entries.browser.enabled=true` và
`tools.alsoAllow: ["browser"]` không thể thay thế tư cách thành viên trong danh sách cho phép.
Việc loại bỏ hoàn toàn `plugins.allow` cũng khôi phục giá trị mặc định.

## Hồ sơ: `openclaw`, `user`, `chrome`

- `openclaw`: trình duyệt được quản lý, cách ly (không yêu cầu tiện ích mở rộng).
- `user`: hồ sơ đính kèm Chrome DevTools MCP tích hợp sẵn dành cho phiên Chrome **thực
  đã đăng nhập** của bạn. Chrome hiển thị lời nhắc chặn "Allow remote debugging?"
  trong lần đầu OpenClaw đính kèm, vì vậy phải có người ở trước máy tính.
- `chrome`: hồ sơ [tiện ích mở rộng Chrome](/vi/tools/chrome-extension) tích hợp sẵn dành cho
  phiên Chrome **thực đã đăng nhập** của bạn. Hoạt động từ điện thoại khi không có ai
  ở trước máy tính vì hồ sơ này điều khiển các tab thông qua tiện ích mở rộng trình duyệt OpenClaw thay vì
  cổng gỡ lỗi từ xa, nên không có lời nhắc "Allow remote debugging?".

Đối với các lệnh gọi công cụ trình duyệt của tác tử:

- Mặc định: dùng trình duyệt `openclaw` cách ly.
- Ưu tiên `profile="chrome"` (tiện ích mở rộng) khi cần các phiên đăng nhập hiện có
  và người dùng **không ở trước máy tính** (Telegram, WhatsApp, v.v.).
- Ưu tiên `profile="user"` (Chrome MCP) khi cần các phiên đăng nhập hiện có
  và người dùng **đang ở trước máy tính** để phê duyệt lời nhắc đính kèm.
- `profile` là tùy chọn ghi đè rõ ràng khi bạn muốn một chế độ trình duyệt cụ thể.

Đặt `browser.defaultProfile: "openclaw"` nếu bạn muốn mặc định sử dụng chế độ được quản lý.

## Cấu hình

Các thiết lập trình duyệt nằm trong `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // mặc định: true
    evaluateEnabled: true, // mặc định: true; false vô hiệu hóa act:evaluate (JS tùy ý)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // chỉ chọn dùng để truy cập mạng riêng đáng tin cậy
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // ghi đè hồ sơ đơn kế thừa
    remoteCdpTimeoutMs: 1500, // thời gian chờ HTTP CDP từ xa (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // thời gian chờ bắt tay WebSocket CDP từ xa (ms)
    localLaunchTimeoutMs: 15000, // thời gian chờ phát hiện Chrome được quản lý cục bộ (ms)
    localCdpReadyTimeoutMs: 8000, // thời gian chờ CDP sẵn sàng sau khi khởi chạy cục bộ được quản lý (ms)
    actionTimeoutMs: 60000, // thời gian chờ mặc định cho thao tác trình duyệt (ms)
    tabCleanup: {
      enabled: true, // mặc định: true
      idleMinutes: 120, // đặt thành 0 để vô hiệu hóa việc dọn dẹp khi không hoạt động
      maxTabsPerSession: 8, // đặt thành 0 để vô hiệu hóa giới hạn theo phiên
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // chế độ chụp trạng thái mặc định khi bên gọi không chỉ định
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

`browser.snapshotDefaults.mode: "efficient"` thay đổi chế độ trích xuất `snapshot` mặc định
khi bên gọi không truyền `snapshotFormat` hoặc
`mode` rõ ràng; xem [API điều khiển trình duyệt](/vi/tools/browser-control) để biết các tùy chọn
chụp trạng thái theo từng lệnh gọi.

### Khả năng thị giác từ ảnh chụp màn hình (hỗ trợ mô hình chỉ có văn bản)

Khi mô hình chính chỉ có văn bản (không hỗ trợ thị giác/đa phương thức), ảnh chụp
màn hình trình duyệt trả về các khối hình ảnh mà mô hình không thể đọc. Ảnh chụp màn hình trình duyệt
tái sử dụng cấu hình hiểu hình ảnh hiện có, vì vậy một mô hình hình ảnh
được cấu hình để hiểu nội dung đa phương tiện có thể mô tả ảnh chụp màn hình dưới dạng văn bản mà không cần bất kỳ
thiết lập mô hình riêng cho trình duyệt nào.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Thêm các ứng viên dự phòng; lần thành công đầu tiên sẽ được sử dụng
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Các mô hình đa phương tiện dùng chung cũng hoạt động khi được gắn thẻ hỗ trợ hình ảnh.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Các giá trị mặc định của mô hình hình ảnh hiện có cũng được áp dụng.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Cách hoạt động:**

1. Tác tử gọi `browser screenshot` và hình ảnh được chụp vào đĩa như thường lệ.
2. Công cụ trình duyệt hỏi môi trường thực thi hiểu hình ảnh hiện có liệu nó
   có thể mô tả ảnh chụp màn hình bằng các mô hình hình ảnh đa phương tiện đã cấu hình, các mô hình đa phương tiện
   dùng chung, giá trị mặc định của mô hình hình ảnh hoặc nhà cung cấp hình ảnh có hỗ trợ xác thực hay không.
3. Mô hình thị giác trả về mô tả văn bản, được bao bọc bằng
   `wrapExternalContent` (cơ chế bảo vệ chống chèn lời nhắc) và trả về cho tác tử
   dưới dạng khối văn bản thay vì khối hình ảnh.
4. Nếu tính năng hiểu hình ảnh không khả dụng, bị bỏ qua hoặc gặp lỗi, trình duyệt
   sẽ quay lại trả về khối hình ảnh gốc.

Các khối hình ảnh chụp màn hình là kết quả công cụ riêng tư: tác tử có thể kiểm tra chúng,
nhưng OpenClaw không tự động đính kèm chúng vào phản hồi trên kênh. Để chia sẻ
ảnh chụp màn hình, hãy yêu cầu tác tử gửi ảnh đó một cách rõ ràng bằng công cụ tin nhắn.

Sử dụng các trường `tools.media.image` / `tools.media.models` hiện có cho các mô hình
dự phòng, thời gian chờ, giới hạn byte, hồ sơ và thiết lập yêu cầu của nhà cung cấp.

Nếu mô hình chính đang hoạt động đã hỗ trợ thị giác và không có mô hình
hiểu hình ảnh rõ ràng nào được cấu hình, OpenClaw giữ lại kết quả hình ảnh thông thường để
mô hình chính có thể đọc trực tiếp ảnh chụp màn hình.

<AccordionGroup>

<Accordion title="Cổng và khả năng truy cập">

- Dịch vụ điều khiển liên kết với địa chỉ loopback trên một cổng được suy ra từ `gateway.port` (mặc định `18791` = gateway + 2). `OPENCLAW_GATEWAY_PORT` được ưu tiên hơn `gateway.port`; cả hai đều dịch chuyển các cổng được suy ra trong cùng một nhóm.
- Các hồ sơ `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl` từ một dải bắt đầu cao hơn cổng điều khiển 9 cổng (mặc định `18800`-`18899`); chỉ đặt các giá trị đó cho
  hồ sơ CDP từ xa hoặc việc gắn vào điểm cuối của phiên hiện có. Khi chưa được đặt, `cdpUrl` mặc định là
  cổng CDP cục bộ được quản lý.
- `remoteCdpTimeoutMs` áp dụng cho các bước kiểm tra khả năng truy cập CDP HTTP từ xa và `attachOnly`
  cũng như các yêu cầu HTTP mở thẻ; `remoteCdpHandshakeTimeoutMs` áp dụng cho
  các quy trình bắt tay CDP WebSocket của chúng. Việc liệt kê thẻ Playwright từ xa lâu dài
  sử dụng giá trị lớn hơn trong hai giá trị làm thời hạn thao tác.
- `localLaunchTimeoutMs` là khoảng thời gian dành cho một tiến trình Chrome được quản lý và khởi chạy cục bộ
  để cung cấp điểm cuối CDP HTTP. `localCdpReadyTimeoutMs` là
  khoảng thời gian tiếp theo để CDP websocket sẵn sàng sau khi phát hiện tiến trình.
  Hãy tăng các giá trị này trên Raspberry Pi, VPS cấu hình thấp hoặc phần cứng cũ nơi Chromium
  khởi động chậm. Giá trị phải là số nguyên dương tối đa `120000` ms; các
  giá trị cấu hình không hợp lệ sẽ bị từ chối.
- Các lỗi khởi chạy/sẵn sàng lặp lại của Chrome được quản lý sẽ kích hoạt bộ ngắt mạch theo từng
  hồ sơ. Sau nhiều lỗi liên tiếp, OpenClaw tạm dừng các lần
  thử khởi chạy mới trong thời gian ngắn thay vì tạo Chromium cho mỗi lần gọi công cụ trình duyệt. Hãy khắc phục
  sự cố khởi động, vô hiệu hóa trình duyệt nếu không cần dùng hoặc khởi động lại
  Gateway sau khi sửa chữa.
- `actionTimeoutMs` là khoảng thời gian mặc định cho các yêu cầu `act` của trình duyệt khi bên gọi không truyền `timeoutMs`. Lớp truyền tải phía máy khách thêm một khoảng đệm nhỏ để các lần chờ dài có thể hoàn tất thay vì hết thời gian chờ tại ranh giới HTTP.
- `tabCleanup` là cơ chế dọn dẹp theo khả năng tốt nhất cho các thẻ được mở bởi phiên trình duyệt của tác tử chính. Việc dọn dẹp vòng đời của tác tử phụ, cron và ACP vẫn đóng các thẻ được theo dõi rõ ràng của chúng khi phiên kết thúc; phiên chính giữ các thẻ đang hoạt động để có thể tái sử dụng, sau đó đóng các thẻ được theo dõi đang nhàn rỗi hoặc dư thừa trong nền.

</Accordion>

<Accordion title="Chính sách SSRF">

- Các yêu cầu điều hướng trình duyệt và mở thẻ được kiểm tra trước. Trong thao tác và khoảng thời gian gia hạn có giới hạn sau thao tác, các tương tác Playwright được bảo vệ (nhấp, nhấp theo tọa độ, di chuột, kéo, cuộn, chọn, nhấn, nhập, điền biểu mẫu và đánh giá) chặn các lượt tải tài liệu cấp cao nhất và khung con bị chính sách từ chối trước khi gửi byte yêu cầu HTTP, sau đó kiểm tra lại URL `http(s)` cuối cùng theo khả năng tốt nhất.
- Trước mỗi lần khởi chạy mới Chrome do OpenClaw quản lý, OpenClaw cố gắng vô hiệu hóa dự đoán mạng, ngăn hoạt động kết nối trước mang tính suy đoán đã quan sát được của Chromium đối với các lượt tải bị từ chối đó. Đây là lớp phòng vệ chuyên sâu, không phải ranh giới chính sách: trình duyệt được tái sử dụng qua một lần khởi động lại dịch vụ điều khiển và các backend trình duyệt khác có thể không dùng chung cơ chế gia cố này. Định tuyến Playwright vẫn không phải là tường lửa mạng và không chặn các bước chuyển hướng, yêu cầu đầu tiên của cửa sổ bật lên, lưu lượng Service Worker, mã trang chạy sau khoảng thời gian bảo vệ có giới hạn hoặc mọi đường dẫn nền/tài nguyên phụ. Việc cô lập lưu lượng đi hoàn toàn yêu cầu cơ chế cô lập phía chủ sở hữu hoặc proxy thực thi chính sách.
- Trong chế độ SSRF nghiêm ngặt, việc khám phá điểm cuối CDP từ xa và các phép thăm dò `/json/version` (`cdpUrl`) cũng được kiểm tra.
- Các biến môi trường `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và `NO_PROXY` của Gateway/nhà cung cấp không tự động chuyển tiếp trình duyệt do OpenClaw quản lý qua proxy. Theo mặc định, Chrome được quản lý khởi chạy với kết nối trực tiếp để các cài đặt proxy của nhà cung cấp không làm suy yếu bước kiểm tra SSRF của trình duyệt.
- Các phép thăm dò mức độ sẵn sàng CDP cục bộ và kết nối DevTools WebSocket do OpenClaw quản lý bỏ qua proxy mạng được quản lý đối với chính xác điểm cuối loopback đã khởi chạy, vì vậy `openclaw browser start` vẫn hoạt động khi proxy của người vận hành chặn lưu lượng loopback đi.
- Để chuyển tiếp chính trình duyệt được quản lý qua proxy, hãy truyền các cờ proxy Chrome rõ ràng qua `browser.extraArgs`, chẳng hạn như `--proxy-server=...` hoặc `--proxy-pac-url=...`. Chế độ SSRF nghiêm ngặt chặn định tuyến proxy trình duyệt rõ ràng trừ khi quyền truy cập trình duyệt vào mạng riêng được chủ ý bật.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` bị tắt theo mặc định; chỉ bật khi quyền truy cập trình duyệt vào mạng riêng được chủ ý tin cậy.
- `browser.ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ dưới dạng bí danh cũ.

</Accordion>

<Accordion title="Hành vi của hồ sơ">

- `attachOnly: true` có nghĩa là không bao giờ khởi chạy trình duyệt cục bộ; chỉ gắn vào nếu một trình duyệt đã chạy.
- `headless` có thể được đặt toàn cục hoặc theo từng hồ sơ được quản lý cục bộ. Giá trị theo hồ sơ ghi đè `browser.headless`, vì vậy một hồ sơ được khởi chạy cục bộ có thể chạy không giao diện trong khi hồ sơ khác vẫn hiển thị.
- `POST /start?headless=true` và `openclaw browser start --headless` yêu cầu một lần
  khởi chạy không giao diện duy nhất cho các hồ sơ được quản lý cục bộ mà không ghi lại
  `browser.headless` hoặc cấu hình hồ sơ. Hồ sơ phiên hiện có, chỉ gắn vào và
  CDP từ xa từ chối giá trị ghi đè vì OpenClaw không khởi chạy các
  tiến trình trình duyệt đó.
- Trên máy chủ Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, các hồ sơ được quản lý cục bộ
  tự động mặc định chạy không giao diện khi cả môi trường lẫn cấu hình hồ sơ/toàn cục
  đều không chọn rõ ràng chế độ có giao diện. Hãy dùng dạng không gây nhầm lẫn ở cấp trình duyệt
  `openclaw browser --json status`; `openclaw browser status --json` ở cuối
  cũng hoạt động vì `status` không định nghĩa `--json` riêng. Lệnh báo cáo
  `headlessSource` là `env`, `profile`, `config`,
  `request`, `linux-display-fallback` hoặc `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` buộc các lần khởi chạy được quản lý cục bộ chạy không giao diện cho
  tiến trình hiện tại. `OPENCLAW_BROWSER_HEADLESS=0` buộc chế độ có giao diện cho các lần
  khởi động thông thường và trả về lỗi có hướng xử lý trên máy chủ Linux không có máy chủ hiển thị;
  yêu cầu `start --headless` rõ ràng vẫn được ưu tiên cho lần khởi chạy đó.
- Tuyến điều khiển trình duyệt và máy khách lập trình giữ nguyên
  `error` mà con người có thể đọc của lỗi không có màn hình và cung cấp lý do ổn định
  `no_display_for_headed_profile`. `details` của lỗi chỉ chứa `profile`,
  `requestedHeadless`, `headlessSource` và `displayPresent`, để máy khách API có thể
  chọn biện pháp khắc phục đúng mà không cần khớp văn bản thông báo.
- Đối với hồ sơ được quản lý cục bộ đang chạy, trạng thái và doctor truy vấn điểm cuối CDP
  cấp trình duyệt của Chrome để lấy thông tin về trình kết xuất, backend, thiết bị/trình điều khiển, trạng thái
  tính năng, biện pháp khắc phục cho trình điều khiển và khả năng video tăng tốc. Kết quả được
  lưu vào bộ nhớ đệm cho tiến trình trình duyệt đó và được cung cấp đầy đủ qua
  `openclaw browser --json status`. Lệnh gọi trạng thái thụ động không khởi chạy Chrome.
  Trình duyệt phiên hiện có, tiện ích mở rộng, CDP từ xa và sandbox vẫn tách biệt
  và không được kiểm tra qua đường dẫn máy chủ được quản lý này.
- Chrome được quản lý chạy không giao diện vẫn sử dụng giá trị mặc định bảo thủ `--disable-gpu`.
  Thông tin chẩn đoán không bật tăng tốc, thêm cài đặt tăng tốc toàn cục
  hoặc cấp quyền truy cập thiết bị cho trình duyệt sandbox.
- `executablePath` có thể được đặt toàn cục hoặc theo từng hồ sơ được quản lý cục bộ. Giá trị theo hồ sơ ghi đè `browser.executablePath`, vì vậy các hồ sơ được quản lý khác nhau có thể khởi chạy những trình duyệt dựa trên Chromium khác nhau. Cả hai dạng đều chấp nhận `~` cho thư mục chính của hệ điều hành.
- `color` (cấp cao nhất và theo từng hồ sơ) nhuộm màu giao diện trình duyệt để bạn có thể thấy hồ sơ nào đang hoạt động.
- Hồ sơ mặc định là `openclaw` (độc lập được quản lý). Dùng `defaultProfile: "user"` để chọn sử dụng trình duyệt người dùng đã đăng nhập.
- Thứ tự tự động phát hiện: trình duyệt mặc định của hệ thống nếu dựa trên Chromium; nếu không thì Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` sử dụng Chrome DevTools MCP thay cho CDP thô. Nó có thể gắn vào thông qua tính năng tự động kết nối của Chrome MCP hoặc thông qua `cdpUrl` khi bạn đã có điểm cuối DevTools cho trình duyệt đang chạy.
- `driver: "extension"` điều khiển Chrome đã đăng nhập của bạn thông qua [tiện ích Chrome của OpenClaw](/vi/tools/chrome-extension). Relay sở hữu điểm cuối loopback của nó, vì vậy các hồ sơ này không chấp nhận `cdpUrl`. Đây là chế độ trình duyệt đã đăng nhập duy nhất hoạt động khi không có ai ở máy tính.
- Đặt `browser.profiles.<name>.userDataDir` khi hồ sơ phiên hiện có cần gắn vào một hồ sơ người dùng Chromium không mặc định (Brave, Edge, v.v.). Đường dẫn này cũng chấp nhận `~` cho thư mục chính của hệ điều hành.

</Accordion>

</AccordionGroup>

## Sử dụng Brave hoặc một trình duyệt khác dựa trên Chromium

Nếu trình duyệt **mặc định của hệ thống** là trình duyệt dựa trên Chromium (Chrome/Brave/Edge/v.v.),
OpenClaw tự động sử dụng trình duyệt đó. Đặt `browser.executablePath` để ghi đè
tính năng tự động phát hiện. Các giá trị `executablePath` cấp cao nhất và theo từng hồ sơ chấp nhận `~`
cho thư mục chính của hệ điều hành:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Hoặc đặt trong cấu hình theo từng nền tảng:

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

`executablePath` theo từng hồ sơ chỉ ảnh hưởng đến các hồ sơ được quản lý cục bộ mà OpenClaw
khởi chạy. Các hồ sơ `existing-session` gắn vào một trình duyệt đang chạy
thay vì khởi chạy trình duyệt mới, còn hồ sơ CDP từ xa sử dụng trình duyệt phía sau `cdpUrl`.

## Điều khiển cục bộ và từ xa

- **Điều khiển cục bộ (mặc định):** Gateway khởi động dịch vụ điều khiển loopback và có thể khởi chạy trình duyệt cục bộ.
- **Điều khiển từ xa (máy chủ Node):** chạy một máy chủ Node trên máy có trình duyệt; Gateway chuyển tiếp các thao tác trình duyệt tới máy đó.
- **CDP từ xa:** đặt `browser.profiles.<name>.cdpUrl` (hoặc `browser.cdpUrl`) để
  gắn vào trình duyệt dựa trên Chromium từ xa. Trong trường hợp này, OpenClaw sẽ không khởi chạy trình duyệt cục bộ.
- Đối với các dịch vụ CDP được quản lý bên ngoài trên loopback (ví dụ Browserless trong
  Docker được xuất bản tới `127.0.0.1`), hãy đặt thêm `attachOnly: true`. CDP loopback
  không có `attachOnly` được xem là hồ sơ trình duyệt cục bộ do OpenClaw quản lý.
- `headless` chỉ ảnh hưởng đến các hồ sơ được quản lý cục bộ mà OpenClaw khởi chạy. Nó không khởi động lại hoặc thay đổi trình duyệt phiên hiện có hay CDP từ xa.
- `executablePath` tuân theo cùng quy tắc về hồ sơ được quản lý cục bộ. Việc thay đổi giá trị này trên một
  hồ sơ được quản lý cục bộ đang chạy sẽ đánh dấu hồ sơ đó để khởi động lại/đồng bộ, nhằm bảo đảm
  lần khởi chạy tiếp theo sử dụng tệp nhị phân mới.

Hành vi dừng khác nhau tùy theo chế độ hồ sơ:

- hồ sơ được quản lý cục bộ: `openclaw browser stop` dừng tiến trình trình duyệt mà
  OpenClaw đã khởi chạy
- hồ sơ chỉ gắn vào và CDP từ xa: `openclaw browser stop` đóng phiên
  điều khiển đang hoạt động và giải phóng các giá trị ghi đè mô phỏng Playwright/CDP (khung nhìn,
  bảng màu, ngôn ngữ, múi giờ, chế độ ngoại tuyến và trạng thái tương tự), mặc dù
  OpenClaw không khởi chạy tiến trình trình duyệt nào

URL CDP từ xa có thể bao gồm thông tin xác thực:

- Token truy vấn (ví dụ: `https://provider.example?token=<token>`)
- Xác thực HTTP Basic (ví dụ: `https://user:pass@provider.example`)

OpenClaw giữ nguyên thông tin xác thực khi gọi các điểm cuối `/json/*` và khi kết nối
với CDP WebSocket. Nên dùng biến môi trường hoặc trình quản lý bí mật cho
token thay vì cam kết chúng vào tệp cấu hình.

## Proxy trình duyệt Node (mặc định không cần cấu hình)

Nếu bạn chạy một **máy chủ node** trên máy có trình duyệt, OpenClaw có thể
tự động định tuyến các lệnh gọi công cụ trình duyệt đến node đó mà không cần cấu hình trình duyệt bổ sung.
Đây là đường dẫn mặc định cho các Gateway từ xa.

Lưu ý:

- Máy chủ node cung cấp máy chủ điều khiển trình duyệt cục bộ của nó thông qua một **lệnh proxy**.
- Các hồ sơ đến từ cấu hình `browser.profiles` của chính node (giống như cục bộ).
- Lệnh proxy không bao giờ cho phép thay đổi hồ sơ lâu dài (`create-profile`, `delete-profile`, `reset-profile`) bất kể `allowProfiles`; hãy thực hiện trực tiếp các thay đổi đó trên node.
- `nodeHost.browserProxy.allowProfiles` là tùy chọn. Để trống để dùng hành vi cũ/mặc định: mọi hồ sơ đã cấu hình vẫn có thể được truy cập qua proxy.
- Nếu bạn đặt `nodeHost.browserProxy.allowProfiles`, OpenClaw sẽ coi đó là ranh giới đặc quyền tối thiểu, giới hạn các tên hồ sơ mà proxy sẽ nhắm đến.
- Tắt nếu bạn không muốn dùng tính năng này:
  - Trên node: `nodeHost.browserProxy.enabled=false`
  - Trên Gateway: `gateway.nodes.browser.mode="off"` (cũng chấp nhận `"auto"` để chọn một node trình duyệt đang kết nối, hoặc `"manual"` để yêu cầu tham số node rõ ràng)

## Browserless (CDP từ xa được lưu trữ)

[Browserless](https://browserless.io) là dịch vụ Chromium được lưu trữ, cung cấp
các URL kết nối CDP qua HTTPS và WebSocket. OpenClaw có thể dùng cả hai dạng, nhưng
đối với hồ sơ trình duyệt từ xa, tùy chọn đơn giản nhất là URL WebSocket trực tiếp
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

Lưu ý:

- Thay `<BROWSERLESS_API_KEY>` bằng token Browserless thực của bạn.
- Chọn điểm cuối khu vực phù hợp với tài khoản Browserless của bạn (xem tài liệu của họ).
- Nếu Browserless cung cấp cho bạn URL cơ sở HTTPS, bạn có thể chuyển đổi nó thành
  `wss://` để kết nối CDP trực tiếp hoặc giữ URL HTTPS và để OpenClaw
  khám phá `/json/version`.

### Browserless Docker trên cùng máy chủ

Khi Browserless được tự lưu trữ trong Docker và OpenClaw chạy trên máy chủ, hãy coi
Browserless là dịch vụ CDP được quản lý bên ngoài:

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

Địa chỉ trong `browser.profiles.browserless.cdpUrl` phải có thể truy cập được từ
tiến trình OpenClaw. Browserless cũng phải quảng bá một điểm cuối tương ứng có thể truy cập;
đặt `EXTERNAL` của Browserless thành cùng cơ sở WebSocket công khai đối với OpenClaw đó, chẳng hạn
như `ws://127.0.0.1:3000`, `ws://browserless:3000`, hoặc một địa chỉ mạng Docker
riêng ổn định. Nếu `/json/version` trả về `webSocketDebuggerUrl` trỏ đến
một địa chỉ mà OpenClaw không thể truy cập, CDP HTTP có thể trông vẫn hoạt động tốt trong khi việc
đính kèm WebSocket vẫn thất bại.

Không để `attachOnly` chưa đặt cho hồ sơ Browserless dùng địa chỉ loopback. Nếu không có
`attachOnly`, OpenClaw sẽ coi cổng loopback là hồ sơ trình duyệt cục bộ được quản lý
và có thể báo rằng cổng đang được sử dụng nhưng không thuộc quyền quản lý của OpenClaw.

## Nhà cung cấp CDP WebSocket trực tiếp

Một số dịch vụ trình duyệt được lưu trữ cung cấp điểm cuối **WebSocket trực tiếp** thay vì
cơ chế khám phá CDP dựa trên HTTP tiêu chuẩn (`/json/version`). OpenClaw chấp nhận ba
dạng URL CDP và tự động chọn chiến lược kết nối phù hợp:

- **Khám phá HTTP(S)** - `http://host[:port]` hoặc `https://host[:port]`.
  OpenClaw gọi `/json/version` để khám phá URL trình gỡ lỗi WebSocket, sau đó
  kết nối. Không dự phòng bằng WebSocket.
- **Điểm cuối WebSocket trực tiếp** - `ws://host[:port]/devtools/<kind>/<id>` hoặc
  `wss://...` có đường dẫn `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw kết nối trực tiếp qua quá trình bắt tay WebSocket và bỏ qua hoàn toàn
  `/json/version`.
- **Gốc WebSocket thuần** - `ws://host[:port]` hoặc `wss://host[:port]` không có
  đường dẫn `/devtools/...` (ví dụ: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). Trước tiên, OpenClaw thử khám phá HTTP
  `/json/version` (chuẩn hóa lược đồ thành `http`/`https`);
  nếu quá trình khám phá trả về `webSocketDebuggerUrl`, giá trị đó sẽ được sử dụng; nếu không, OpenClaw
  dự phòng bằng quá trình bắt tay WebSocket trực tiếp tại gốc thuần. Nếu điểm cuối
  WebSocket được quảng bá từ chối quá trình bắt tay CDP nhưng gốc thuần đã cấu hình
  chấp nhận, OpenClaw cũng sẽ dự phòng về gốc đó. Điều này cho phép một `ws://` thuần
  trỏ đến Chrome cục bộ vẫn kết nối được, vì Chrome chỉ chấp nhận các yêu cầu nâng cấp WebSocket
  trên đường dẫn riêng cho từng đích từ `/json/version`, trong khi các nhà cung cấp
  được lưu trữ vẫn có thể dùng điểm cuối WebSocket gốc của họ khi điểm cuối khám phá
  quảng bá một URL tồn tại trong thời gian ngắn, không phù hợp với Playwright CDP.

`openclaw browser doctor` dùng cùng logic ưu tiên khám phá và dự phòng bằng WebSocket
như khi đính kèm lúc chạy, vì vậy URL gốc thuần kết nối thành công sẽ không
bị chẩn đoán báo là không thể truy cập.

### Browserbase

[Browserbase](https://www.browserbase.com) là nền tảng đám mây để chạy
trình duyệt không giao diện với khả năng giải CAPTCHA tích hợp, chế độ ẩn mình và proxy
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

Lưu ý:

- [Đăng ký](https://www.browserbase.com/sign-up) và sao chép **API Key**
  từ [bảng điều khiển Overview](https://www.browserbase.com/overview).
- Thay `<BROWSERBASE_API_KEY>` bằng khóa API Browserbase thực của bạn.
- Browserbase tự động tạo một phiên trình duyệt khi WebSocket kết nối, nên không
  cần bước tạo phiên thủ công.
- Xem [bảng giá](https://www.browserbase.com/pricing) để biết các giới hạn hiện tại của gói miễn phí và các gói trả phí.
- Xem [tài liệu Browserbase](https://docs.browserbase.com) để biết tài liệu tham khảo API đầy đủ,
  hướng dẫn SDK và các ví dụ tích hợp.

### Notte

[Notte](https://www.notte.cc) là nền tảng đám mây để chạy các trình duyệt
không giao diện, tích hợp khả năng ẩn mình, proxy dân cư và Gateway WebSocket
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

Lưu ý:

- [Đăng ký](https://console.notte.cc) và sao chép **API Key** từ
  trang cài đặt bảng điều khiển.
- Thay `<NOTTE_API_KEY>` bằng khóa API Notte thực của bạn.
- Notte tự động tạo một phiên trình duyệt khi WebSocket kết nối, nên không cần
  bước tạo phiên thủ công. Phiên sẽ bị hủy khi
  WebSocket ngắt kết nối.
- Xem [bảng giá](https://www.notte.cc/#pricing) để biết các giới hạn hiện tại của gói miễn phí và các gói trả phí.
- Xem [tài liệu Notte](https://docs.notte.cc) để biết tài liệu tham khảo API đầy đủ, hướng dẫn
  SDK và các ví dụ tích hợp.

## Bảo mật

Các ý chính:

- Điều khiển trình duyệt chỉ hoạt động qua loopback; quyền truy cập đi qua cơ chế xác thực của Gateway hoặc ghép cặp node.
- API HTTP trình duyệt loopback độc lập **chỉ sử dụng xác thực bằng bí mật dùng chung**:
  xác thực bearer bằng token Gateway, `x-openclaw-password`, hoặc xác thực HTTP Basic bằng
  mật khẩu Gateway đã cấu hình.
- Các tiêu đề danh tính Tailscale Serve và `gateway.auth.mode: "trusted-proxy"`
  **không** xác thực API trình duyệt loopback độc lập này.
- Nếu điều khiển trình duyệt được bật và chưa cấu hình xác thực bằng bí mật dùng chung, OpenClaw
  sẽ tự động tạo và lưu lâu dài thông tin xác thực điều khiển trình duyệt khi khởi động:
  token khi `gateway.auth.mode` là `none`, hoặc mật khẩu khi giá trị đó là
  `trusted-proxy` (được lưu lâu dài thông qua `gateway.auth.password` để các ứng dụng khách
  loopback ngoài tiến trình có thể phân giải). Việc tự động tạo sẽ bị bỏ qua khi đã cấu hình
  rõ ràng thông tin xác thực dạng chuỗi cho chế độ đó, hoặc khi
  `gateway.auth.mode` là `password`.
- Hãy cấu hình rõ ràng `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` hoặc
  `OPENCLAW_GATEWAY_PASSWORD` nếu bạn muốn dùng một bí mật ổn định do mình kiểm soát
  thay vì bí mật được tạo tự động.

Mẹo về CDP từ xa:

- Ưu tiên các điểm cuối được mã hóa (HTTPS hoặc WSS) và token có thời hạn ngắn khi có thể.
- Tránh nhúng trực tiếp token có thời hạn dài vào tệp cấu hình.
- Giữ Gateway và mọi máy chủ node trong mạng riêng (Tailscale); tránh công khai chúng.
- Coi các URL/token CDP từ xa là bí mật; ưu tiên biến môi trường hoặc trình quản lý bí mật.

## Hồ sơ (nhiều trình duyệt)

OpenClaw hỗ trợ nhiều hồ sơ có tên (cấu hình định tuyến). Hồ sơ có thể là:

- **do OpenClaw quản lý**: một phiên bản trình duyệt dựa trên Chromium chuyên dụng, có thư mục dữ liệu người dùng + cổng CDP riêng
- **từ xa**: một URL CDP rõ ràng (trình duyệt dựa trên Chromium chạy ở nơi khác)
- **phiên hiện có**: hồ sơ Chrome hiện có của bạn qua tính năng tự động kết nối Chrome DevTools MCP

Mặc định:

- Hồ sơ `openclaw` được tự động tạo nếu chưa có.
- Hồ sơ `user` được tích hợp sẵn để đính kèm phiên hiện có qua Chrome MCP.
- Ngoài `user`, các hồ sơ phiên hiện có phải được bật chủ động; hãy tạo chúng bằng `--driver existing-session`.
- Theo mặc định, các cổng CDP cục bộ được cấp phát trong khoảng **18800-18899**.
- Khi xóa hồ sơ, thư mục dữ liệu cục bộ của hồ sơ sẽ được chuyển vào Thùng rác.

Mọi điểm cuối điều khiển đều chấp nhận `?profile=<name>`; CLI sử dụng `--browser-profile`.

## Phiên hiện có qua Chrome DevTools MCP

OpenClaw cũng có thể đính kèm vào một hồ sơ trình duyệt dựa trên Chromium đang chạy thông qua
máy chủ Chrome DevTools MCP chính thức. Cách này tái sử dụng các thẻ và trạng thái đăng nhập
đang mở trong hồ sơ trình duyệt đó.

Tài liệu tham khảo chính thức về bối cảnh và thiết lập:

- [Chrome for Developers: Sử dụng Chrome DevTools MCP với phiên trình duyệt của bạn](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README của Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Hồ sơ tích hợp sẵn: `user`. Hãy tạo hồ sơ phiên hiện có tùy chỉnh của riêng bạn nếu
muốn dùng tên, màu hoặc thư mục dữ liệu trình duyệt khác.

Theo mặc định, hồ sơ `user` tích hợp sẵn dùng tính năng tự động kết nối Chrome MCP,
nhắm đến hồ sơ Google Chrome cục bộ mặc định. Dùng `userDataDir` cho Brave,
Edge, Chromium hoặc hồ sơ Chrome không mặc định. `~` mở rộng thành thư mục chính
của hệ điều hành:

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

Sau đó, trong trình duyệt tương ứng:

1. Mở trang kiểm tra của trình duyệt đó dành cho gỡ lỗi từ xa.
2. Bật gỡ lỗi từ xa.
3. Giữ trình duyệt chạy và chấp thuận lời nhắc kết nối khi OpenClaw đính kèm.

Các trang kiểm tra thường dùng:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Kiểm thử nhanh việc đính kèm trực tiếp:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Biểu hiện khi thành công:

- `status` hiển thị `driver: existing-session`
- `status` hiển thị `transport: chrome-mcp`
- `status` hiển thị `running: true`
- `tabs` liệt kê các tab trình duyệt bạn đã mở
- `snapshot` trả về các tham chiếu từ tab trực tiếp đã chọn

Những điều cần kiểm tra nếu không thể đính kèm:

- trình duyệt dựa trên Chromium đích có phiên bản `144+`
- tính năng gỡ lỗi từ xa được bật trong trang kiểm tra của trình duyệt đó
- trình duyệt đã hiển thị lời nhắc đồng ý đính kèm và bạn đã chấp nhận
- nếu Chrome được khởi động với `--remote-debugging-port` rõ ràng, hãy đặt
  `browser.profiles.<name>.cdpUrl` thành điểm cuối DevTools đó thay vì dựa vào
  tính năng tự động kết nối của Chrome MCP
- `openclaw doctor` di chuyển cấu hình trình duyệt cũ dựa trên tiện ích mở rộng và kiểm tra rằng
  Chrome được cài đặt cục bộ cho các hồ sơ tự động kết nối mặc định, nhưng không thể
  bật tính năng gỡ lỗi từ xa phía trình duyệt cho bạn

Cách agent sử dụng:

- Sử dụng `profile="user"` khi bạn cần trạng thái trình duyệt đã đăng nhập của người dùng.
- Nếu sử dụng hồ sơ phiên hiện có tùy chỉnh, hãy truyền tên hồ sơ rõ ràng đó.
- Chỉ chọn chế độ này khi người dùng đang ở máy tính để phê duyệt lời nhắc
  đính kèm.
- Máy chủ Gateway hoặc Node có thể khởi chạy `npx chrome-devtools-mcp@latest --autoConnect`.

Lưu ý:

- Đường dẫn này có rủi ro cao hơn hồ sơ `openclaw` được cô lập vì nó có thể
  thực hiện thao tác trong phiên trình duyệt đã đăng nhập của bạn.
- OpenClaw không khởi chạy trình duyệt cho trình điều khiển này; nó chỉ đính kèm.
- OpenClaw sử dụng luồng `--autoConnect` chính thức của Chrome DevTools MCP tại đây. Nếu
  `userDataDir` được đặt, giá trị này sẽ được chuyển tiếp để nhắm đến thư mục dữ liệu người dùng đó.
- Phiên hiện có có thể đính kèm trên máy chủ đã chọn hoặc thông qua một
  Node trình duyệt đã kết nối. Nếu Chrome nằm ở nơi khác và không có Node trình duyệt nào được kết nối, hãy sử dụng
  CDP từ xa hoặc một máy chủ Node.
- Các đích Chrome MCP và tham chiếu ảnh chụp nhanh có phạm vi trong một tiến trình con MCP. Sau khi
  tiến trình đó khởi động lại, hãy chạy lại `browser tabs`, chọn rõ ràng một
  đích mới trước khi thực hiện công việc dành riêng cho đích và tạo ảnh chụp nhanh mới trước khi sử dụng các tham chiếu.
  Mỗi tham chiếu chỉ hợp lệ cho đích của nó và ảnh chụp nhanh mới nhất. Các bí danh cũ không
  được chuyển sang tab thay thế, ngay cả khi URL của tab đó trùng khớp.
- Chrome DevTools MCP hiện định tuyến các công cụ trang bằng một ID trang dạng số
  cục bộ theo tiến trình. Các handle có phạm vi theo tiến trình ngăn việc tái sử dụng khi thay thế tiến trình con, nhưng việc
  thay thế ngữ cảnh trình duyệt trong cùng tiến trình giữa các lần gọi công cụ liền kề vẫn có thể
  chuyển thao tác sang đích khác. Việc định tuyến hoàn toàn nguyên tử yêu cầu công cụ trang thượng nguồn
  hỗ trợ ID đích ổn định.

### Khởi chạy Chrome MCP tùy chỉnh

Ghi đè máy chủ Chrome DevTools MCP được khởi chạy theo từng hồ sơ khi luồng
`npx chrome-devtools-mcp@latest` mặc định không phù hợp với nhu cầu của bạn (máy chủ ngoại tuyến,
phiên bản được cố định, tệp nhị phân được tích hợp sẵn):

| Trường        | Chức năng                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Tệp thực thi để khởi chạy thay cho `npx`. Được phân giải nguyên trạng; đường dẫn tuyệt đối được tôn trọng.                                          |
| `mcpArgs`    | Mảng đối số được truyền nguyên trạng cho `mcpCommand`. Thay thế các đối số `chrome-devtools-mcp@latest --autoConnect` mặc định. |

Khi `cdpUrl` được đặt trên hồ sơ phiên hiện có, OpenClaw bỏ qua
`--autoConnect` và tự động chuyển tiếp điểm cuối đến Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (điểm cuối khám phá HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP trực tiếp).

Không thể kết hợp các cờ điểm cuối với `userDataDir`: khi `cdpUrl` được đặt,
`userDataDir` bị bỏ qua khi khởi chạy Chrome MCP, vì Chrome MCP đính kèm vào
trình duyệt đang chạy phía sau điểm cuối thay vì mở một thư mục
hồ sơ.

<Accordion title="Các giới hạn của tính năng phiên hiện có">

So với hồ sơ `openclaw` được quản lý, các trình điều khiển phiên hiện có bị hạn chế hơn:

- **Ảnh chụp màn hình** - tính năng chụp trang và chụp phần tử `--ref` hoạt động; bộ chọn CSS `--element` thì không. Không cần Playwright để chụp ảnh trang hoặc phần tử dựa trên tham chiếu. (`--full-page` không thể kết hợp với `--ref` hoặc `--element` trên bất kỳ hồ sơ nào, không chỉ phiên hiện có.)
- **Thao tác** - `click`, `type`, `hover`, `scrollIntoView`, `drag` và `select` yêu cầu tham chiếu ảnh chụp nhanh (không hỗ trợ bộ chọn CSS). `click-coords` nhấp vào tọa độ hiển thị trong khung nhìn và không yêu cầu tham chiếu ảnh chụp nhanh. `click` chỉ hỗ trợ nút trái (không hỗ trợ ghi đè nút hoặc phím bổ trợ). `type` không hỗ trợ `slowly=true`; hãy sử dụng `fill` hoặc `press`. `press` không hỗ trợ `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` và `fill` không hỗ trợ ghi đè `timeoutMs` theo từng lần gọi; `evaluate` thì có. `select` chấp nhận một giá trị duy nhất. `batch` không được hỗ trợ; hãy gửi từng thao tác riêng lẻ.
- **Chờ / tải lên / hộp thoại** - `wait --url` hỗ trợ các mẫu khớp chính xác, chuỗi con và glob (giống như chế độ được quản lý); `wait --load networkidle` không được hỗ trợ trên hồ sơ phiên hiện có (tính năng này hoạt động trên hồ sơ được quản lý và hồ sơ CDP thô/từ xa). Các hook tải lên yêu cầu `ref` hoặc `inputRef`, mỗi lần một tệp, không hỗ trợ CSS `element`. Các hook hộp thoại không hỗ trợ ghi đè thời gian chờ hoặc `dialogId`.
- **Khả năng hiển thị hộp thoại** - Phản hồi thao tác của trình duyệt được quản lý bao gồm `blockedByDialog` và `browserState.dialogs.pending` khi một thao tác mở hộp thoại dạng phương thức; ảnh chụp nhanh cũng bao gồm trạng thái hộp thoại đang chờ xử lý. Phản hồi bằng `browser dialog --accept/--dismiss --dialog-id <id>` khi hộp thoại đang chờ xử lý. Các hộp thoại được xử lý bên ngoài OpenClaw xuất hiện trong `browserState.dialogs.recent`.
- **Tính năng chỉ dành cho chế độ được quản lý** - Xuất PDF, chặn lượt tải xuống và `responsebody` vẫn yêu cầu đường dẫn trình duyệt được quản lý.

</Accordion>

## Bảo đảm cô lập

- **Thư mục dữ liệu người dùng chuyên dụng**: không bao giờ tác động đến hồ sơ trình duyệt cá nhân của bạn.
- **Cổng chuyên dụng**: tránh `9222` để ngăn xung đột với quy trình phát triển.
- **Kiểm soát tab xác định**: `tabs` trả về `suggestedTargetId` trước, sau đó là
  các handle `tabId` ổn định như `t1`, nhãn tùy chọn và `targetId` thô.
  Agent nên tái sử dụng `suggestedTargetId`; ID thô vẫn khả dụng để
  gỡ lỗi và bảo đảm khả năng tương thích.

## Lựa chọn trình duyệt

Khi khởi chạy cục bộ, OpenClaw chọn trình duyệt khả dụng đầu tiên:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bạn có thể ghi đè bằng `browser.executablePath`.

Nền tảng:

- macOS: kiểm tra `/Applications` và `~/Applications`.
- Linux: kiểm tra các vị trí Chrome/Brave/Edge/Chromium phổ biến trong `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` và
  `/usr/lib/chromium-browser`, cùng Chromium do Playwright quản lý trong
  `PLAYWRIGHT_BROWSERS_PATH` hoặc `~/.cache/ms-playwright`.
- Windows: kiểm tra các vị trí cài đặt phổ biến.

## API điều khiển (tùy chọn)

Để viết tập lệnh và gỡ lỗi, Gateway cung cấp một **API điều khiển HTTP chỉ dành
cho loopback** nhỏ cùng với CLI `openclaw browser` tương ứng (ảnh chụp nhanh, tham chiếu, khả năng chờ
nâng cao, đầu ra JSON, quy trình gỡ lỗi). Xem
[API điều khiển trình duyệt](/vi/tools/browser-control) để biết tài liệu tham khảo đầy đủ.

## Khắc phục sự cố

Đối với các vấn đề riêng của Linux (đặc biệt là Chromium dạng snap), hãy xem
[Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting).

Đối với thiết lập chia tách máy chủ WSL2 Gateway + Chrome trên Windows, hãy xem
[Khắc phục sự cố WSL2 + Windows + CDP Chrome từ xa](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Lỗi khởi động CDP và chặn SSRF khi điều hướng

Đây là các loại lỗi khác nhau và chúng chỉ đến các đường dẫn mã khác nhau.

- **Lỗi khởi động hoặc sẵn sàng của CDP** nghĩa là OpenClaw không thể xác nhận rằng mặt phẳng điều khiển trình duyệt đang hoạt động bình thường.
- **Chặn SSRF khi điều hướng** nghĩa là mặt phẳng điều khiển trình duyệt đang hoạt động bình thường, nhưng đích điều hướng trang bị chính sách từ chối.

Các ví dụ phổ biến:

- Lỗi khởi động hoặc sẵn sàng của CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` khi một
    dịch vụ CDP bên ngoài qua loopback được cấu hình mà không có `attachOnly: true`
- Chặn SSRF khi điều hướng:
  - Các luồng `open`, `navigate`, ảnh chụp nhanh hoặc mở tab thất bại với lỗi chính sách trình duyệt/mạng trong khi `start` và `tabs` vẫn hoạt động

Sử dụng trình tự tối thiểu sau để phân biệt hai trường hợp:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cách diễn giải kết quả:

- Nếu `start` thất bại với `not reachable after start`, trước tiên hãy khắc phục sự cố về trạng thái sẵn sàng của CDP.
- Nếu `start` thành công nhưng `tabs` thất bại, mặt phẳng điều khiển vẫn không hoạt động bình thường. Hãy coi đây là vấn đề về khả năng tiếp cận CDP, không phải vấn đề điều hướng trang.
- Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt đang hoạt động và lỗi nằm trong chính sách điều hướng hoặc trang đích.
- Nếu `start`, `tabs` và `open` đều thành công, đường dẫn điều khiển trình duyệt được quản lý cơ bản đang hoạt động bình thường.

Chi tiết hành vi quan trọng:

- Cấu hình trình duyệt mặc định sử dụng một đối tượng chính sách SSRF từ chối khi lỗi ngay cả khi bạn không cấu hình `browser.ssrfPolicy`.
- Đối với hồ sơ được quản lý `openclaw` qua loopback cục bộ, các bước kiểm tra tình trạng CDP chủ ý bỏ qua việc thực thi khả năng tiếp cận SSRF của trình duyệt cho mặt phẳng điều khiển cục bộ của chính OpenClaw.
- Cơ chế bảo vệ điều hướng là riêng biệt. Kết quả `start` hoặc `tabs` thành công không có nghĩa là đích `open` hoặc `navigate` sau đó được phép.

Hướng dẫn bảo mật:

- Theo mặc định, **không** nới lỏng chính sách SSRF của trình duyệt.
- Ưu tiên các ngoại lệ máy chủ hẹp như `hostnameAllowlist` hoặc `allowedHostnames` thay vì quyền truy cập rộng vào mạng riêng.
- Chỉ sử dụng `dangerouslyAllowPrivateNetwork: true` trong các môi trường được chủ ý tin cậy, nơi quyền truy cập trình duyệt vào mạng riêng là bắt buộc và đã được xem xét.

## Công cụ agent + cách hoạt động của cơ chế điều khiển

Agent nhận được **một công cụ** để tự động hóa trình duyệt:

- `browser` - chẩn đoán/trạng thái/khởi động/dừng/tab/mở/tập trung/đóng/ảnh chụp nhanh/ảnh chụp màn hình/điều hướng/thao tác

Cách ánh xạ:

- `browser snapshot` trả về một cây giao diện người dùng ổn định (AI hoặc ARIA).
- `browser act` sử dụng các ID `ref` của ảnh chụp trạng thái để nhấp/nhập/kéo/chọn.
- `browser screenshot` chụp lại pixel (toàn trang, phần tử hoặc tham chiếu có nhãn).
- `browser doctor` kiểm tra trạng thái sẵn sàng của Gateway, plugin, hồ sơ, trình duyệt và thẻ.
- `browser` chấp nhận:
  - `profile` để chọn một hồ sơ trình duyệt có tên (openclaw, chrome hoặc CDP từ xa).
  - `target` (`sandbox` | `host` | `node`) để chọn nơi trình duyệt hoạt động.
  - Trong các phiên được sandbox, `target: "host"` yêu cầu `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Nếu bỏ qua `target`: các phiên được sandbox mặc định dùng `sandbox`, còn các phiên không được sandbox mặc định dùng `host`.
  - Nếu một node có khả năng chạy trình duyệt được kết nối, công cụ có thể tự động định tuyến đến node đó, trừ khi bạn cố định `target="host"` hoặc `target="node"`.

Điều này giúp agent hoạt động nhất quán và tránh các bộ chọn dễ hỏng.

## Liên quan

- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ dành cho agent hiện có
- [Sandbox](/vi/gateway/sandboxing) - điều khiển trình duyệt trong các môi trường được sandbox
- [Bảo mật](/vi/gateway/security) - các rủi ro khi điều khiển trình duyệt và biện pháp tăng cường bảo mật
