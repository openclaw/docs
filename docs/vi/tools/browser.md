---
read_when:
    - Thêm tính năng tự động hóa trình duyệt do agent điều khiển
    - Gỡ lỗi nguyên nhân OpenClaw can thiệp vào Chrome của bạn
    - Triển khai cài đặt trình duyệt và vòng đời trong ứng dụng macOS
summary: Dịch vụ điều khiển trình duyệt tích hợp + các lệnh hành động
title: Trình duyệt (do OpenClaw quản lý)
x-i18n:
    generated_at: "2026-07-20T04:34:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f87da83e30a15e4899b352c81a666d9e3324124781d103f443a75bc384382d36
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw có thể chạy một **hồ sơ Chrome/Brave/Edge/Chromium chuyên dụng** do tác nhân kiểm soát. Hồ sơ này hoạt động thông qua một dịch vụ điều khiển cục bộ nhỏ bên trong Gateway (chỉ loopback) và được tách biệt khỏi trình duyệt cá nhân của bạn.

- Hãy xem đây là một **trình duyệt riêng chỉ dành cho tác nhân**. Hồ sơ `openclaw` không bao giờ tác động đến hồ sơ trình duyệt cá nhân của bạn.
- Tác nhân mở tab, đọc trang, nhấp và nhập nội dung trong môi trường tách biệt này.
- Thay vào đó, hồ sơ `user` tích hợp sẵn sẽ kết nối với phiên Chrome thực đã đăng nhập của bạn thông qua Chrome DevTools MCP.

## Những gì bạn nhận được

- Một hồ sơ trình duyệt riêng có tên **openclaw** (mặc định dùng màu nhấn cam).
- Khả năng điều khiển tab có tính xác định (liệt kê/mở/chuyển tiêu điểm/đóng).
- Các thao tác của tác nhân (nhấp/nhập/kéo/chọn), ảnh chụp nhanh, ảnh chụp màn hình, PDF.
- Các hồ sơ dựa trên Playwright lưu nội dung tải xuống từ thao tác điều hướng trực tiếp đến tệp đính kèm trong thư mục tải xuống được quản lý và trả về siêu dữ liệu `{ url, suggestedFilename, path }` sau khi xác thực chính sách URL cuối cùng.
- Các thao tác của tác nhân dựa trên Playwright trả về một mảng `downloads` có cùng siêu dữ liệu được quản lý khi thao tác đó ngay lập tức bắt đầu một hoặc nhiều lượt tải xuống.
- Một skill `browser-automation` đi kèm hướng dẫn tác nhân về vòng lặp khôi phục ảnh chụp nhanh,
  tab ổn định, tham chiếu hết hạn và chướng ngại cần xử lý thủ công khi Plugin trình duyệt
  được bật.
- Hỗ trợ tùy chọn nhiều hồ sơ (`openclaw`, `work`, `remote`, ...).

Trình duyệt này **không phải** trình duyệt bạn dùng hằng ngày. Đây là một bề mặt
an toàn, tách biệt dành cho việc tự động hóa và xác minh của tác nhân.

Trên macOS, bạn có thể sao chép rõ ràng cookie từ một hồ sơ hệ thống thuộc họ Chrome vào một hồ sơ được quản lý riêng. Trình duyệt được quản lý vẫn sử dụng thư mục dữ liệu người dùng riêng; chỉ các cookie đã chọn được sao chép, còn bộ nhớ cục bộ và IndexedDB không được sao chép. Xem [Hồ sơ](#profiles-multi-browser) hoặc [tài liệu tham khảo CLI `openclaw browser`](/vi/cli/browser) để biết các lệnh nhập và giới hạn.

## Bắt đầu nhanh

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Trình duyệt bị tắt" có nghĩa là Plugin hoặc `browser.enabled` đang tắt; xem
[Cấu hình](#configuration) và [Điều khiển Plugin](#plugin-control).

Nếu `openclaw browser` hoàn toàn không tồn tại hoặc tác nhân cho biết công cụ trình duyệt
không khả dụng, hãy chuyển đến [Thiếu lệnh hoặc công cụ trình duyệt](#missing-browser-command-or-tool).

## Điều khiển Plugin

Công cụ `browser` mặc định là một Plugin đi kèm. Hãy tắt Plugin này để thay thế bằng một Plugin khác đăng ký cùng tên công cụ `browser`:

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

Thiết lập mặc định cần cả `plugins.entries.browser.enabled` **và** `browser.enabled=true`. Nếu chỉ tắt Plugin, CLI `openclaw browser`, phương thức gateway `browser.request`, công cụ tác nhân và dịch vụ điều khiển sẽ bị loại bỏ như một đơn vị; cấu hình `browser.*` của bạn vẫn được giữ nguyên để dùng với thành phần thay thế.

Các thay đổi cấu hình trình duyệt yêu cầu khởi động lại Gateway để Plugin có thể đăng ký lại dịch vụ.

## Hướng dẫn dành cho tác nhân

Lưu ý về hồ sơ công cụ: `tools.profile: "coding"` bao gồm `web_search` và
`web_fetch`, nhưng không bao gồm toàn bộ công cụ `browser`. Để cho phép tác nhân hoặc
tác nhân con được tạo sử dụng tính năng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn
hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Đối với một tác nhân duy nhất, hãy dùng `agents.list[].tools.alsoAllow: ["browser"]`.
Chỉ `tools.subagents.tools.allow: ["browser"]` là chưa đủ vì chính sách tác nhân con
được áp dụng sau bước lọc hồ sơ.

Plugin trình duyệt cung cấp hai cấp độ hướng dẫn dành cho tác nhân:

- Mô tả công cụ `browser` chứa quy ước ngắn gọn luôn được áp dụng: chọn
  đúng hồ sơ, giữ các tham chiếu trên cùng một tab, dùng `tabId`/nhãn để nhắm mục tiêu
  tab và tải skill trình duyệt cho công việc nhiều bước.
- Skill `browser-automation` đi kèm chứa vòng lặp vận hành dài hơn:
  kiểm tra trạng thái/tab trước, gắn nhãn cho các tab tác vụ, chụp ảnh nhanh trước khi thao tác, chụp lại
  sau các thay đổi giao diện, khôi phục tham chiếu hết hạn một lần và báo cáo các chướng ngại về đăng nhập/2FA/captcha hoặc
  camera/micrô là thao tác thủ công thay vì phỏng đoán.

Các skill đi kèm Plugin được liệt kê trong các skill khả dụng của tác nhân khi
Plugin được bật. Toàn bộ hướng dẫn của skill được tải theo yêu cầu, vì vậy các
lượt xử lý thông thường không phải chịu toàn bộ chi phí token.

## Thiếu lệnh hoặc công cụ trình duyệt

Nếu `openclaw browser` không được nhận dạng sau khi nâng cấp, `browser.request` bị thiếu hoặc tác nhân báo cáo công cụ trình duyệt không khả dụng, nguyên nhân thường gặp là danh sách `plugins.allow` bỏ sót `browser` và không tồn tại khối cấu hình `browser` ở cấp gốc. Hãy thêm khối này:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Một khối `browser` rõ ràng ở cấp gốc (bất kỳ khóa nào bên dưới `browser`, chẳng hạn như
`browser.enabled=true` hoặc `browser.profiles.<name>`) sẽ kích hoạt Plugin
trình duyệt đi kèm ngay cả khi `plugins.allow` hạn chế, tương ứng với hành vi
cấu hình kênh đi kèm. Bản thân `plugins.entries.browser.enabled=true` và
`tools.alsoAllow: ["browser"]` không thể thay thế tư cách thành viên trong danh sách cho phép.
Việc xóa hoàn toàn `plugins.allow` cũng khôi phục thiết lập mặc định.

## Hồ sơ: `openclaw`, `user`, `chrome`

- `openclaw`: trình duyệt được quản lý, tách biệt (không yêu cầu tiện ích mở rộng).
- `user`: hồ sơ kết nối Chrome DevTools MCP tích hợp sẵn dành cho phiên **Chrome thực
  đã đăng nhập** của bạn. Chrome hiển thị lời nhắc chặn "Allow remote debugging?"
  trong lần đầu OpenClaw kết nối, vì vậy phải có người ở máy tính.
- `chrome`: hồ sơ [tiện ích mở rộng Chrome](/vi/tools/chrome-extension) tích hợp sẵn dành cho
  phiên **Chrome thực đã đăng nhập** của bạn. Hoạt động từ điện thoại mà không cần có người tại
  bàn làm việc vì hồ sơ này điều khiển các tab thông qua tiện ích mở rộng trình duyệt OpenClaw thay vì
  cổng gỡ lỗi từ xa, nên không có lời nhắc "Allow remote debugging?".

Đối với các lệnh gọi công cụ trình duyệt của tác nhân:

- Mặc định: sử dụng trình duyệt `openclaw` tách biệt.
- Ưu tiên `profile="chrome"` (tiện ích mở rộng) khi cần các phiên đăng nhập hiện có
  và người dùng **không ở cạnh máy tính** (Telegram, WhatsApp, v.v.).
- Ưu tiên `profile="user"` (Chrome MCP) khi cần các phiên đăng nhập hiện có
  và người dùng **đang ở cạnh máy tính** để phê duyệt lời nhắc kết nối.
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
      // dangerouslyAllowPrivateNetwork: true, // chỉ chủ động bật để truy cập mạng riêng đáng tin cậy
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // ghi đè hồ sơ đơn kiểu cũ
    tabCleanup: {
      enabled: true, // mặc định: true
    },
    // snapshotDefaults: { mode: "efficient" }, // chế độ ảnh chụp nhanh mặc định khi bên gọi không chỉ định
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

`browser.snapshotDefaults.mode: "efficient"` thay đổi chế độ trích xuất `snapshot`
mặc định khi bên gọi không truyền `snapshotFormat` hoặc
`mode` rõ ràng; xem [API điều khiển trình duyệt](/vi/tools/browser-control) để biết các tùy chọn
ảnh chụp nhanh cho từng lệnh gọi.

### Quyền sở hữu việc dọn dẹp tab

Việc dọn dẹp tab phiên chỉ áp dụng cho các tab được công cụ trình duyệt OpenClaw
tạo bằng `action: "open"`. OpenClaw không tiếp quản các tab đã mở sẵn,
do người dùng mở hoặc có quyền sở hữu không xác định. Khối
`browser.tabCleanup` kiểm soát các lượt quét định kỳ theo thời gian nhàn rỗi và giới hạn cho các phiên
chính; việc tắt khối này không vô hiệu hóa hoạt động dọn dẹp vòng đời phiên rõ ràng.

Đối với các lượt mở cục bộ trên máy chủ, quyền sở hữu có mục tiêu CDP gốc ổn định và danh tính
trình duyệt được lưu trong trạng thái SQLite dùng chung. Các bản ghi này tồn tại sau khi Gateway
khởi động lại và vẫn đủ điều kiện cho `/new` cùng các hoạt động dọn dẹp vòng đời phiên khác;
hoạt động dọn dẹp vòng đời phiên bao gồm việc kết thúc phiên của tác nhân con, cron và ACP.
Các bản ghi có mục tiêu hiển thị với công cụ là mục tiêu CDP gốc cũng tiếp tục đủ điều kiện
cho các lượt quét theo thời gian nhàn rỗi và giới hạn theo phiên sau khi khởi động lại. Các mã định danh mục tiêu Chrome MCP
chỉ tồn tại cục bộ trong tiến trình, vì vậy các bản ghi phiên hiện có ở trạng thái nguội sẽ chờ dọn dẹp vòng đời
thay vì mạo hiểm thực hiện lượt quét nhàn rỗi đối với hoạt động không thể được quy thuộc
một cách an toàn sau khi khởi động lại. Đường dẫn bền vững này có thể bao phủ các hồ sơ do OpenClaw quản lý,
các hồ sơ CDP từ xa thông thường và các hồ sơ phiên hiện có có `cdpUrl`
rõ ràng, miễn là OpenClaw có thể phân giải cả mục tiêu gốc lẫn một danh tính trình duyệt
ổn định. Trước khi đóng một bản ghi bền vững, OpenClaw xác minh rằng
hồ sơ đã cấu hình và phiên bản trình duyệt vẫn khớp.

Các `--autoConnect` của Chrome MCP, những điểm cuối CDP có phản hồi `/json/version` thiếu
danh tính trình duyệt ổn định và các lượt mở không thể phân giải mục tiêu gốc
vẫn sử dụng cơ chế theo dõi nỗ lực tối đa cục bộ trong tiến trình. Chúng có thể được dọn dẹp khi
tiến trình Gateway đó đang chạy, nhưng không tự động bị đóng sau khi
Gateway khởi động lại. Các tab còn mở trước khi tính năng theo dõi bền vững khả dụng sẽ không
được tiếp quản hồi tố; hãy đóng các tab đó theo cách thủ công.

Việc dọn dẹp được thực hiện theo nỗ lực tối đa, không đảm bảo mọi tab đủ điều kiện đều đóng
ngay lập tức. Lỗi tạm thời khi kiểm tra quyền sở hữu hoặc đóng tab sẽ khiến hoạt động dọn dẹp
bền vững tiếp tục chờ lần thử lại sau.

### Khả năng thị giác qua ảnh chụp màn hình (hỗ trợ mô hình chỉ có văn bản)

Khi mô hình chính chỉ hỗ trợ văn bản (không hỗ trợ thị giác/đa phương thức), ảnh chụp màn hình
trình duyệt trả về các khối hình ảnh mà mô hình không thể đọc. Ảnh chụp màn hình trình duyệt
tái sử dụng cấu hình nhận hiểu hình ảnh hiện có, vì vậy một mô hình hình ảnh
được cấu hình để hiểu nội dung đa phương tiện có thể mô tả ảnh chụp màn hình dưới dạng văn bản mà không cần
bất kỳ thiết lập mô hình riêng cho trình duyệt nào.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Thêm các ứng viên dự phòng; lần thành công đầu tiên sẽ được dùng
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Các mô hình đa phương tiện dùng chung cũng hoạt động khi được gắn thẻ hỗ trợ hình ảnh.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Các thiết lập mặc định của mô hình hình ảnh hiện có cũng được áp dụng.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Cách hoạt động:**

1. Agent gọi `browser screenshot` và một hình ảnh được chụp vào ổ đĩa như thường lệ.
2. Công cụ trình duyệt hỏi runtime hiểu hình ảnh hiện có liệu runtime đó
   có thể mô tả ảnh chụp màn hình bằng các mô hình hình ảnh đa phương tiện đã cấu hình, các mô hình đa phương tiện
   dùng chung, giá trị mặc định của mô hình hình ảnh hoặc nhà cung cấp hình ảnh có xác thực hay không.
3. Mô hình thị giác trả về phần mô tả bằng văn bản, phần này được bao bọc bằng
   `wrapExternalContent` (biện pháp bảo vệ chống chèn prompt) và được trả về cho agent
   dưới dạng khối văn bản thay vì khối hình ảnh.
4. Nếu chức năng hiểu hình ảnh không khả dụng, bị bỏ qua hoặc thất bại, trình duyệt sẽ
   dự phòng bằng cách trả về khối hình ảnh ban đầu.

Các khối ảnh chụp màn hình là kết quả công cụ riêng tư: agent có thể kiểm tra chúng,
nhưng OpenClaw không tự động đính kèm chúng vào phản hồi trên kênh. Để chia sẻ
ảnh chụp màn hình, hãy yêu cầu agent gửi ảnh đó một cách rõ ràng bằng công cụ tin nhắn.

Sử dụng các trường `tools.media.image` / `tools.media.models` hiện có cho các mô hình
dự phòng, thời gian chờ, giới hạn byte, hồ sơ và thiết lập yêu cầu của nhà cung cấp.

Nếu mô hình chính đang hoạt động đã hỗ trợ thị giác và không có mô hình
hiểu hình ảnh rõ ràng nào được cấu hình, OpenClaw giữ nguyên kết quả hình ảnh thông thường để
mô hình chính có thể đọc trực tiếp ảnh chụp màn hình.

<AccordionGroup>

<Accordion title="Cổng và khả năng truy cập">

- Dịch vụ điều khiển liên kết với loopback trên một cổng được suy ra từ `gateway.port` (mặc định `18791` = gateway + 2). `OPENCLAW_GATEWAY_PORT` được ưu tiên hơn `gateway.port`; cả hai đều dịch chuyển các cổng được suy ra trong cùng một nhóm.
- Các hồ sơ `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl` từ một dải bắt đầu ở vị trí cao hơn cổng điều khiển 9 cổng (mặc định `18800`-`18899`); chỉ đặt các giá trị đó cho
  hồ sơ CDP từ xa hoặc khi kết nối với endpoint của phiên hiện có. `cdpUrl` mặc định là
  cổng CDP cục bộ được quản lý khi chưa được đặt.
- Khả năng truy cập CDP từ xa và `attachOnly`, các bước bắt tay WebSocket và quá trình khởi động
  Chrome cục bộ được quản lý sử dụng thời hạn tích hợp sẵn.
- Các lỗi khởi chạy/sẵn sàng lặp lại của Chrome được quản lý sẽ bị ngắt mạch theo từng
  hồ sơ. Sau vài lần thất bại liên tiếp, OpenClaw tạm dừng các lần thử khởi chạy
  mới trong thời gian ngắn thay vì tạo Chromium sau mỗi lần gọi công cụ trình duyệt. Hãy khắc phục
  sự cố khởi động, vô hiệu hóa trình duyệt nếu không cần thiết hoặc khởi động lại
  Gateway sau khi sửa chữa.

</Accordion>

<Accordion title="Chính sách SSRF">

- Các yêu cầu điều hướng trình duyệt và mở thẻ được kiểm tra trước. Trong khi thực hiện hành động và khoảng thời gian gia hạn có giới hạn sau hành động, các tương tác Playwright được bảo vệ (nhấp, nhấp theo tọa độ, di chuột, kéo, cuộn, chọn, nhấn, nhập, điền biểu mẫu và đánh giá) chặn các lần tải tài liệu cấp cao nhất và trong khung con bị chính sách từ chối trước khi gửi byte yêu cầu HTTP, sau đó cố gắng kiểm tra lại URL `http(s)` cuối cùng.
- Trước mỗi lần khởi chạy mới Chrome do OpenClaw quản lý, OpenClaw cố gắng vô hiệu hóa tính năng dự đoán mạng, qua đó ngăn kết nối trước mang tính suy đoán đã quan sát thấy của Chromium đối với các lần tải bị từ chối đó. Đây là biện pháp phòng thủ nhiều lớp, không phải ranh giới chính sách: một trình duyệt được tái sử dụng sau khi dịch vụ điều khiển khởi động lại và các backend trình duyệt khác có thể không áp dụng biện pháp gia cố này. Định tuyến Playwright vẫn không phải là tường lửa mạng và không chặn các bước chuyển hướng, yêu cầu đầu tiên của cửa sổ bật lên, lưu lượng Service Worker, mã trang chạy sau khoảng thời gian bảo vệ có giới hạn hoặc mọi đường dẫn nền/tài nguyên phụ. Việc cô lập hoàn toàn lưu lượng đi ra yêu cầu cô lập ở phía chủ sở hữu hoặc proxy thực thi chính sách.
- Trong chế độ SSRF nghiêm ngặt, việc khám phá endpoint CDP từ xa và các phép thăm dò `/json/version` (`cdpUrl`) cũng được kiểm tra.
- Các biến môi trường `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và `NO_PROXY` của Gateway/nhà cung cấp không tự động chuyển tiếp trình duyệt do OpenClaw quản lý qua proxy. Chrome được quản lý mặc định khởi chạy trực tiếp để thiết lập proxy của nhà cung cấp không làm suy yếu các bước kiểm tra SSRF của trình duyệt.
- Các phép thăm dò mức độ sẵn sàng của CDP cục bộ do OpenClaw quản lý và kết nối WebSocket DevTools bỏ qua proxy mạng được quản lý đối với chính xác endpoint loopback đã khởi chạy, vì vậy `openclaw browser start` vẫn hoạt động khi proxy của người vận hành chặn lưu lượng loopback đi ra.
- Để chuyển tiếp chính trình duyệt được quản lý qua proxy, hãy truyền các cờ proxy Chrome rõ ràng thông qua `browser.extraArgs`, chẳng hạn như `--proxy-server=...` hoặc `--proxy-pac-url=...`. Chế độ SSRF nghiêm ngặt chặn định tuyến proxy rõ ràng của trình duyệt trừ khi quyền truy cập trình duyệt vào mạng riêng được chủ ý bật.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` mặc định bị tắt; chỉ bật khi quyền truy cập trình duyệt vào mạng riêng được chủ ý tin cậy.
- `browser.ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ dưới dạng bí danh cũ.

</Accordion>

<Accordion title="Hành vi của hồ sơ">

- `attachOnly: true` có nghĩa là không bao giờ khởi chạy trình duyệt cục bộ; chỉ kết nối nếu đã có trình duyệt đang chạy.
- `headless` có thể được đặt trên toàn cục hoặc theo từng hồ sơ được quản lý cục bộ. Giá trị theo hồ sơ ghi đè `browser.headless`, vì vậy một hồ sơ được khởi chạy cục bộ có thể tiếp tục chạy không giao diện trong khi hồ sơ khác vẫn hiển thị.
- `POST /start?headless=true` và `openclaw browser start --headless` yêu cầu
  khởi chạy không giao diện một lần cho các hồ sơ được quản lý cục bộ mà không ghi lại
  `browser.headless` hoặc cấu hình hồ sơ. Hồ sơ phiên hiện có, chỉ kết nối và
  CDP từ xa từ chối giá trị ghi đè vì OpenClaw không khởi chạy các
  tiến trình trình duyệt đó.
- Trên các máy chủ Linux không có `DISPLAY` hoặc `WAYLAND_DISPLAY`, các hồ sơ được quản lý cục bộ
  tự động mặc định chạy không giao diện khi cả môi trường lẫn cấu hình hồ sơ/toàn cục
  đều không chọn rõ ràng chế độ có giao diện. Sử dụng dạng rõ ràng ở cấp trình duyệt
  `openclaw browser --json status`; `openclaw browser status --json` ở cuối
  cũng hoạt động vì `status` không định nghĩa `--json` riêng. Lệnh báo cáo
  `headlessSource` là `env`, `profile`, `config`,
  `request`, `linux-display-fallback` hoặc `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` buộc các lần khởi chạy được quản lý cục bộ chạy không giao diện cho
  tiến trình hiện tại. `OPENCLAW_BROWSER_HEADLESS=0` buộc chế độ có giao diện cho các lần
  khởi động thông thường và trả về lỗi có hướng xử lý trên máy chủ Linux không có máy chủ hiển thị;
  yêu cầu `start --headless` rõ ràng vẫn được ưu tiên cho lần khởi chạy đó.
- Tuyến điều khiển trình duyệt và máy khách lập trình giữ nguyên
  `error` mà con người có thể đọc được của lỗi không có màn hình và cung cấp lý do ổn định
  `no_display_for_headed_profile`. `details` của lý do này chỉ chứa `profile`,
  `requestedHeadless`, `headlessSource` và `displayPresent`, để máy khách API có thể
  chọn cách khắc phục đúng mà không cần đối chiếu văn bản thông báo.
- Đối với hồ sơ được quản lý cục bộ đang chạy, trạng thái và doctor truy vấn
  endpoint CDP cấp trình duyệt của Chrome để lấy thông tin về trình kết xuất, backend, thiết bị/trình điều khiển, trạng thái
  tính năng, giải pháp khắc phục cho trình điều khiển và khả năng video tăng tốc. Kết quả được
  lưu vào bộ nhớ đệm cho tiến trình trình duyệt đó và được cung cấp đầy đủ qua
  `openclaw browser --json status`. Lệnh gọi trạng thái thụ động không khởi chạy Chrome.
  Các trình duyệt phiên hiện có, tiện ích mở rộng, CDP từ xa và sandbox vẫn tách biệt
  và không được kiểm tra qua đường dẫn máy chủ được quản lý này.
- Chrome được quản lý chạy không giao diện vẫn sử dụng giá trị mặc định thận trọng `--disable-gpu`.
  Chẩn đoán không bật tăng tốc, thêm thiết lập tăng tốc toàn cục
  hoặc cấp quyền truy cập thiết bị cho trình duyệt sandbox.
- `executablePath` có thể được đặt trên toàn cục hoặc theo từng hồ sơ được quản lý cục bộ. Giá trị theo hồ sơ ghi đè `browser.executablePath`, vì vậy các hồ sơ được quản lý khác nhau có thể khởi chạy các trình duyệt dựa trên Chromium khác nhau. Cả hai dạng đều chấp nhận `~` cho thư mục chính của hệ điều hành.
- `color` (cấp cao nhất và theo từng hồ sơ) tô màu giao diện trình duyệt để bạn có thể nhận biết hồ sơ nào đang hoạt động.
- Hồ sơ mặc định là `openclaw` (độc lập được quản lý). Sử dụng `defaultProfile: "user"` để chọn dùng trình duyệt người dùng đã đăng nhập.
- Thứ tự tự động phát hiện: trình duyệt mặc định của hệ thống nếu dựa trên Chromium; nếu không thì Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` sử dụng Chrome DevTools MCP thay vì CDP thô. Hồ sơ này có thể kết nối thông qua tính năng tự động kết nối của Chrome MCP hoặc thông qua `cdpUrl` khi đã có endpoint DevTools cho trình duyệt đang chạy.
- `driver: "extension"` điều khiển Chrome đã đăng nhập của bạn thông qua [tiện ích Chrome của OpenClaw](/vi/tools/chrome-extension). Relay sở hữu endpoint loopback của nó, vì vậy các hồ sơ này không chấp nhận `cdpUrl`. Đây là chế độ trình duyệt đã đăng nhập duy nhất hoạt động khi không có ai ở trước máy tính.
- Đặt `browser.profiles.<name>.userDataDir` khi hồ sơ phiên hiện có cần kết nối với hồ sơ người dùng Chromium không mặc định (Brave, Edge, v.v.). Đường dẫn này cũng chấp nhận `~` cho thư mục chính của hệ điều hành.

</Accordion>

</AccordionGroup>

## Sử dụng Brave hoặc trình duyệt khác dựa trên Chromium

Nếu trình duyệt **mặc định của hệ thống** dựa trên Chromium (Chrome/Brave/Edge/v.v.),
OpenClaw sẽ tự động sử dụng trình duyệt đó. Đặt `browser.executablePath` để ghi đè
tính năng tự động phát hiện. Các giá trị `executablePath` cấp cao nhất và theo hồ sơ chấp nhận `~`
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

`executablePath` theo hồ sơ chỉ ảnh hưởng đến các hồ sơ được quản lý cục bộ mà OpenClaw
khởi chạy. Thay vào đó, các hồ sơ `existing-session` kết nối với một trình duyệt đang chạy,
còn các hồ sơ CDP từ xa sử dụng trình duyệt phía sau `cdpUrl`.

## Điều khiển cục bộ và từ xa

- **Điều khiển cục bộ (mặc định):** Gateway khởi động dịch vụ điều khiển loopback và có thể khởi chạy trình duyệt cục bộ.
- **Điều khiển từ xa (máy chủ node):** chạy một máy chủ node trên máy có trình duyệt; Gateway chuyển tiếp các hành động trình duyệt đến máy đó.
- **CDP từ xa:** đặt `browser.profiles.<name>.cdpUrl` (hoặc `browser.cdpUrl`) để
  kết nối với trình duyệt dựa trên Chromium từ xa. Trong trường hợp này, OpenClaw sẽ không khởi chạy trình duyệt cục bộ.
- Đối với các dịch vụ CDP được quản lý bên ngoài trên loopback (ví dụ Browserless trong
  Docker được xuất bản tại `127.0.0.1`), hãy đặt thêm `attachOnly: true`. CDP loopback
  không có `attachOnly` được coi là hồ sơ trình duyệt cục bộ do OpenClaw quản lý.
- `headless` chỉ ảnh hưởng đến các hồ sơ được quản lý cục bộ mà OpenClaw khởi chạy. Giá trị này không khởi động lại hoặc thay đổi trình duyệt của phiên hiện có hay CDP từ xa.
- `executablePath` tuân theo cùng quy tắc dành cho hồ sơ được quản lý cục bộ. Việc thay đổi giá trị này trên
  một hồ sơ được quản lý cục bộ đang chạy sẽ đánh dấu hồ sơ đó để khởi động lại/đồng bộ, nhờ đó
  lần khởi chạy tiếp theo sử dụng tệp nhị phân mới.

Hành vi dừng khác nhau tùy theo chế độ hồ sơ:

- hồ sơ được quản lý cục bộ: `openclaw browser stop` dừng tiến trình trình duyệt mà
  OpenClaw đã khởi chạy
- hồ sơ chỉ kết nối và CDP từ xa: `openclaw browser stop` đóng phiên
  điều khiển đang hoạt động và giải phóng các giá trị ghi đè mô phỏng Playwright/CDP (khung nhìn,
  bảng màu, ngôn ngữ, múi giờ, chế độ ngoại tuyến và trạng thái tương tự), ngay cả
  khi OpenClaw không khởi chạy tiến trình trình duyệt nào

URL CDP từ xa có thể bao gồm thông tin xác thực:

- Token truy vấn (ví dụ: `https://provider.example?token=<token>`)
- Xác thực HTTP Basic (ví dụ: `https://user:pass@provider.example`)

OpenClaw giữ nguyên thông tin xác thực khi gọi các endpoint `/json/*` và khi kết nối
với CDP WebSocket. Nên dùng biến môi trường hoặc trình quản lý bí mật cho
token thay vì lưu chúng vào tệp cấu hình.

## Proxy trình duyệt trên Node (mặc định không cần cấu hình)

Nếu chạy một **máy chủ node** trên máy có trình duyệt, OpenClaw có thể
tự động định tuyến các lệnh gọi công cụ trình duyệt đến node đó mà không cần cấu hình trình duyệt bổ sung.
Đây là đường dẫn mặc định cho các gateway từ xa.

Lưu ý:

- Máy chủ node cung cấp máy chủ điều khiển trình duyệt cục bộ thông qua một **lệnh proxy**.
- Các hồ sơ đến từ cấu hình `browser.profiles` của chính node (giống như cục bộ).
- Lệnh proxy không bao giờ cho phép sửa đổi hồ sơ lâu dài (`create-profile`, `delete-profile`, `reset-profile`), bất kể `allowProfiles`; hãy thực hiện trực tiếp những thay đổi đó trên node.
- `nodeHost.browserProxy.allowProfiles` là tùy chọn. Để trống để dùng hành vi cũ/mặc định: tất cả hồ sơ đã cấu hình vẫn có thể được truy cập qua proxy.
- Nếu đặt `nodeHost.browserProxy.allowProfiles`, OpenClaw sẽ coi đây là ranh giới đặc quyền tối thiểu, giới hạn các tên hồ sơ mà proxy có thể nhắm đến.
- Tắt tính năng này nếu không muốn sử dụng:
  - Trên node: `nodeHost.browserProxy.enabled=false`
  - Trên gateway: `gateway.nodes.browser.mode="off"` (cũng chấp nhận `"auto"` để chọn một node trình duyệt duy nhất đang kết nối, hoặc `"manual"` để yêu cầu tham số node rõ ràng)

## Browserless (CDP từ xa được lưu trữ)

[Browserless](https://browserless.io) là dịch vụ Chromium được lưu trữ, cung cấp
các URL kết nối CDP qua HTTPS và WebSocket. OpenClaw có thể sử dụng cả hai dạng, nhưng
đối với hồ sơ trình duyệt từ xa, tùy chọn đơn giản nhất là URL WebSocket trực tiếp
từ tài liệu kết nối của Browserless.

Ví dụ:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
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

- Thay `<BROWSERLESS_API_KEY>` bằng token Browserless thực tế của bạn.
- Chọn endpoint khu vực khớp với tài khoản Browserless của bạn (xem tài liệu của họ).
- Nếu Browserless cung cấp URL cơ sở HTTPS, bạn có thể chuyển đổi URL đó thành
  `wss://` để kết nối CDP trực tiếp hoặc giữ URL HTTPS và để OpenClaw
  khám phá `/json/version`.

### Browserless Docker trên cùng máy chủ

Khi Browserless được tự lưu trữ trong Docker và OpenClaw chạy trên máy chủ, hãy coi
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

Địa chỉ trong `browser.profiles.browserless.cdpUrl` phải có thể truy cập được từ
tiến trình OpenClaw. Browserless cũng phải quảng bá một endpoint tương ứng có thể truy cập;
đặt `EXTERNAL` của Browserless thành cùng URL cơ sở WebSocket công khai đối với OpenClaw, chẳng hạn
như `ws://127.0.0.1:3000`, `ws://browserless:3000` hoặc một địa chỉ mạng Docker riêng
ổn định. Nếu `/json/version` trả về `webSocketDebuggerUrl` trỏ đến
một địa chỉ mà OpenClaw không thể truy cập, CDP HTTP có thể trông vẫn hoạt động bình thường trong khi
việc đính kèm WebSocket vẫn thất bại.

Không để trống `attachOnly` đối với hồ sơ Browserless dùng địa chỉ loopback. Nếu không có
`attachOnly`, OpenClaw sẽ coi cổng loopback là một hồ sơ trình duyệt cục bộ
do OpenClaw quản lý và có thể báo rằng cổng đang được sử dụng nhưng không thuộc quyền quản lý của OpenClaw.

## Nhà cung cấp CDP WebSocket trực tiếp

Một số dịch vụ trình duyệt được lưu trữ cung cấp endpoint **WebSocket trực tiếp** thay vì
cơ chế khám phá CDP tiêu chuẩn dựa trên HTTP (`/json/version`). OpenClaw chấp nhận ba
dạng URL CDP và tự động chọn chiến lược kết nối phù hợp:

- **Khám phá HTTP(S)** - `http://host[:port]` hoặc `https://host[:port]`.
  OpenClaw gọi `/json/version` để khám phá URL trình gỡ lỗi WebSocket, sau đó
  kết nối. Không dự phòng sang WebSocket.
- **Endpoint WebSocket trực tiếp** - `ws://host[:port]/devtools/<kind>/<id>` hoặc
  `wss://...` có đường dẫn `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw kết nối trực tiếp qua quy trình bắt tay WebSocket và bỏ qua hoàn toàn
  `/json/version`.
- **Gốc WebSocket thuần** - `ws://host[:port]` hoặc `wss://host[:port]` không có
  đường dẫn `/devtools/...` (ví dụ: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). Trước tiên, OpenClaw thử khám phá HTTP
  `/json/version` (chuẩn hóa lược đồ thành `http`/`https`);
  nếu quá trình khám phá trả về `webSocketDebuggerUrl`, giá trị đó sẽ được sử dụng; nếu không, OpenClaw
  dự phòng sang quy trình bắt tay WebSocket trực tiếp tại gốc thuần. Nếu endpoint
  WebSocket được quảng bá từ chối quy trình bắt tay CDP nhưng gốc thuần đã cấu hình
  chấp nhận, OpenClaw cũng dự phòng sang gốc đó. Điều này cho phép một `ws://` thuần
  trỏ đến Chrome cục bộ vẫn kết nối được, vì Chrome chỉ chấp nhận nâng cấp WebSocket
  trên đường dẫn cụ thể theo từng đích từ `/json/version`, trong khi các nhà cung cấp
  được lưu trữ vẫn có thể sử dụng endpoint WebSocket gốc khi endpoint khám phá của họ
  quảng bá một URL tồn tại trong thời gian ngắn và không phù hợp với Playwright CDP.

`openclaw browser doctor` sử dụng cùng logic ưu tiên khám phá và dự phòng WebSocket
như khi đính kèm lúc chạy, vì vậy URL gốc thuần kết nối thành công sẽ không
bị chẩn đoán là không thể truy cập.

### Browserbase

[Browserbase](https://www.browserbase.com) là nền tảng đám mây để chạy
trình duyệt không giao diện, tích hợp sẵn khả năng giải CAPTCHA, chế độ ẩn mình và proxy
dân cư.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
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
  từ [Overview dashboard](https://www.browserbase.com/overview).
- Thay `<BROWSERBASE_API_KEY>` bằng khóa API Browserbase thực tế của bạn.
- Browserbase tự động tạo một phiên trình duyệt khi WebSocket kết nối, vì vậy không cần
  bước tạo phiên thủ công.
- Xem [bảng giá](https://www.browserbase.com/pricing) để biết giới hạn hiện tại của gói miễn phí và các gói trả phí.
- Xem [tài liệu Browserbase](https://docs.browserbase.com) để tham khảo đầy đủ API,
  hướng dẫn SDK và ví dụ tích hợp.

### Notte

[Notte](https://www.notte.cc) là nền tảng đám mây để chạy trình duyệt không giao diện,
tích hợp sẵn chế độ ẩn mình, proxy dân cư và gateway WebSocket
hỗ trợ CDP nguyên bản.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
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
- Thay `<NOTTE_API_KEY>` bằng khóa API Notte thực tế của bạn.
- Notte tự động tạo một phiên trình duyệt khi WebSocket kết nối, vì vậy không cần
  bước tạo phiên thủ công. Phiên sẽ bị hủy khi
  WebSocket ngắt kết nối.
- Xem [bảng giá](https://www.notte.cc/#pricing) để biết giới hạn hiện tại của gói miễn phí và các gói trả phí.
- Xem [tài liệu Notte](https://docs.notte.cc) để tham khảo đầy đủ API, hướng dẫn
  SDK và ví dụ tích hợp.

## Bảo mật

Các ý chính:

- Điều khiển trình duyệt chỉ khả dụng qua loopback; quyền truy cập đi qua cơ chế xác thực của Gateway hoặc ghép cặp node.
- API HTTP trình duyệt loopback độc lập **chỉ sử dụng xác thực bằng bí mật dùng chung**:
  xác thực bearer bằng token gateway, `x-openclaw-password`, hoặc xác thực HTTP Basic bằng
  mật khẩu gateway đã cấu hình.
- Các header danh tính Tailscale Serve và `gateway.auth.mode: "trusted-proxy"`
  **không** xác thực API trình duyệt loopback độc lập này.
- Nếu điều khiển trình duyệt được bật và chưa cấu hình xác thực bằng bí mật dùng chung, OpenClaw
  sẽ tự động tạo và lưu lâu dài thông tin xác thực điều khiển trình duyệt khi khởi động:
  một token khi `gateway.auth.mode` là `none`, hoặc một mật khẩu khi giá trị đó là
  `trusted-proxy` (được lưu lâu dài thông qua `gateway.auth.password` để các máy khách loopback
  ngoài tiến trình có thể phân giải). Việc tự động tạo sẽ bị bỏ qua khi đã cấu hình rõ ràng
  thông tin xác thực dạng chuỗi cho chế độ đó, hoặc khi
  `gateway.auth.mode` là `password`.
- Hãy cấu hình rõ ràng `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` hoặc
  `OPENCLAW_GATEWAY_PASSWORD` nếu muốn dùng một bí mật ổn định do bạn kiểm soát
  thay vì bí mật được tạo tự động.

Mẹo về CDP từ xa:

- Nên ưu tiên endpoint được mã hóa (HTTPS hoặc WSS) và token tồn tại trong thời gian ngắn nếu có thể.
- Tránh nhúng trực tiếp token tồn tại lâu dài vào tệp cấu hình.
- Giữ Gateway và mọi máy chủ node trong mạng riêng (Tailscale); tránh công khai chúng.
- Coi URL/token CDP từ xa là bí mật; nên dùng biến môi trường hoặc trình quản lý bí mật.

## Hồ sơ (nhiều trình duyệt)

OpenClaw hỗ trợ nhiều hồ sơ được đặt tên (cấu hình định tuyến). Hồ sơ có thể là:

- **do OpenClaw quản lý**: một phiên bản trình duyệt dựa trên Chromium chuyên dụng, có thư mục dữ liệu người dùng và cổng CDP riêng
- **từ xa**: một URL CDP rõ ràng (trình duyệt dựa trên Chromium chạy ở nơi khác)
- **phiên hiện có**: hồ sơ Chrome hiện có của bạn thông qua tính năng tự động kết nối Chrome DevTools MCP

Mặc định:

- Hồ sơ `openclaw` được tự động tạo nếu chưa tồn tại.
- Hồ sơ `user` được tích hợp sẵn để đính kèm phiên hiện có qua Chrome MCP.
- Ngoài `user`, các hồ sơ phiên hiện có phải được chủ động bật; tạo chúng bằng `--driver existing-session`.
- Theo mặc định, các cổng CDP cục bộ được phân bổ trong khoảng **18800-18899**.
- Khi xóa một hồ sơ, thư mục dữ liệu cục bộ của hồ sơ đó sẽ được chuyển vào Thùng rác.

Tất cả endpoint điều khiển đều chấp nhận `?profile=<name>`; CLI sử dụng `--browser-profile`.

## Phiên hiện có qua Chrome DevTools MCP

OpenClaw cũng có thể đính kèm vào một hồ sơ trình duyệt dựa trên Chromium đang chạy thông qua
máy chủ Chrome DevTools MCP chính thức. Cách này tái sử dụng các tab và trạng thái đăng nhập
đã mở trong hồ sơ trình duyệt đó.

Tài liệu tham khảo chính thức về bối cảnh và thiết lập:

- [Chrome dành cho nhà phát triển: Sử dụng Chrome DevTools MCP với phiên trình duyệt của bạn](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README của Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Hồ sơ tích hợp sẵn: `user`. Hãy tạo hồ sơ phiên hiện có tùy chỉnh nếu
muốn dùng tên, màu hoặc thư mục dữ liệu trình duyệt khác.

Theo mặc định, hồ sơ `user` tích hợp sẵn sử dụng tính năng tự động kết nối Chrome MCP,
nhắm đến hồ sơ Google Chrome cục bộ mặc định. Sử dụng `userDataDir` cho Brave,
Edge, Chromium hoặc một hồ sơ Chrome không mặc định. `~` được mở rộng thành thư mục chính
trên hệ điều hành của bạn:

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

1. Mở trang kiểm tra gỡ lỗi từ xa của trình duyệt đó.
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
- `tabs` liệt kê các tab trình duyệt đang mở của bạn
- `snapshot` trả về các ref từ tab trực tiếp đã chọn

Những điều cần kiểm tra nếu thao tác đính kèm không hoạt động:

- trình duyệt dựa trên Chromium đích là phiên bản `144+`
- tính năng gỡ lỗi từ xa được bật trong trang kiểm tra của trình duyệt đó
- trình duyệt đã hiển thị lời nhắc đồng ý đính kèm và bạn đã chấp nhận
- nếu Chrome được khởi động với một `--remote-debugging-port` rõ ràng, hãy đặt
  `browser.profiles.<name>.cdpUrl` thành điểm cuối DevTools đó thay vì dựa vào
  khả năng tự động kết nối của Chrome MCP
- `openclaw doctor` di chuyển cấu hình trình duyệt cũ dựa trên tiện ích mở rộng và kiểm tra rằng
  Chrome đã được cài đặt cục bộ cho các hồ sơ tự động kết nối mặc định, nhưng không thể
  bật tính năng gỡ lỗi từ xa phía trình duyệt thay cho bạn

Cách agent sử dụng:

- Sử dụng `profile="user"` khi cần trạng thái trình duyệt đã đăng nhập của người dùng.
- Nếu sử dụng một hồ sơ phiên hiện có tùy chỉnh, hãy truyền rõ tên hồ sơ đó.
- Chỉ chọn chế độ này khi người dùng đang ở máy tính để phê duyệt lời nhắc
  đính kèm.
- Máy chủ Gateway hoặc Node có thể khởi tạo `npx chrome-devtools-mcp@latest --autoConnect`.

Lưu ý:

- Đường dẫn này có rủi ro cao hơn hồ sơ `openclaw` được cô lập vì nó có thể
  thực hiện thao tác bên trong phiên trình duyệt đã đăng nhập của bạn.
- OpenClaw không khởi chạy trình duyệt cho trình điều khiển này; OpenClaw chỉ đính kèm.
- OpenClaw sử dụng luồng `--autoConnect` chính thức của Chrome DevTools MCP tại đây. Nếu
  `userDataDir` được đặt, giá trị này được chuyển tiếp để nhắm đến thư mục dữ liệu người dùng đó.
- Chế độ phiên hiện có có thể đính kèm trên máy chủ đã chọn hoặc thông qua một
  Node trình duyệt đã kết nối. Nếu Chrome nằm ở nơi khác và không có Node trình duyệt nào được kết nối, hãy sử dụng
  CDP từ xa hoặc một máy chủ Node thay thế.
- Các đích Chrome MCP và ref ảnh chụp nhanh được giới hạn trong một tiến trình con MCP. Sau khi
  tiến trình đó khởi động lại, hãy chạy lại `browser tabs`, chọn rõ một
  đích mới trước khi thực hiện công việc dành riêng cho đích và tạo ảnh chụp nhanh mới trước khi sử dụng các ref.
  Mỗi ref chỉ hợp lệ với đích của nó và ảnh chụp nhanh mới nhất. Các bí danh cũ không được
  chuyển sang tab thay thế, ngay cả khi URL trùng khớp.
- Chrome DevTools MCP hiện định tuyến các công cụ trang theo ID trang dạng số cục bộ
  của tiến trình. Các handle theo phạm vi tiến trình ngăn việc tái sử dụng khi thay thế tiến trình con, nhưng
  việc thay thế ngữ cảnh trình duyệt trong cùng tiến trình giữa hai lệnh gọi công cụ liền kề vẫn có thể
  chuyển một thao tác sang đích khác. Việc định tuyến hoàn toàn nguyên tử đòi hỏi hỗ trợ từ công cụ trang thượng nguồn
  đối với ID đích ổn định.

### Khởi chạy Chrome MCP tùy chỉnh

Ghi đè máy chủ Chrome DevTools MCP được khởi tạo theo từng hồ sơ khi luồng
`npx chrome-devtools-mcp@latest` mặc định không phù hợp với nhu cầu (máy chủ ngoại tuyến,
phiên bản được cố định, tệp thực thi được đóng gói kèm):

| Trường        | Chức năng                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Tệp thực thi cần khởi tạo thay cho `npx`. Được phân giải nguyên trạng; đường dẫn tuyệt đối được tôn trọng.                                          |
| `mcpArgs`    | Mảng đối số được truyền nguyên trạng đến `mcpCommand`. Thay thế các đối số `chrome-devtools-mcp@latest --autoConnect` mặc định. |

Khi `cdpUrl` được đặt trên một hồ sơ phiên hiện có, OpenClaw bỏ qua
`--autoConnect` và tự động chuyển tiếp điểm cuối đến Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (điểm cuối khám phá HTTP của DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket trực tiếp).

Không thể kết hợp các cờ điểm cuối với `userDataDir`: khi `cdpUrl` được đặt,
`userDataDir` bị bỏ qua khi khởi chạy Chrome MCP, vì Chrome MCP đính kèm vào
trình duyệt đang chạy phía sau điểm cuối thay vì mở một thư mục
hồ sơ.

<Accordion title="Giới hạn của tính năng phiên hiện có">

So với hồ sơ `openclaw` được quản lý, các trình điều khiển phiên hiện có bị hạn chế hơn:

- **Ảnh chụp màn hình** - tính năng chụp trang và chụp phần tử `--ref` hoạt động; bộ chọn CSS `--element` không hoạt động. Không cần Playwright để chụp ảnh trang hoặc phần tử dựa trên ref. (`--full-page` không thể kết hợp với `--ref` hoặc `--element` trên bất kỳ hồ sơ nào, không chỉ hồ sơ phiên hiện có.)
- **Thao tác** - `click`, `type`, `hover`, `scrollIntoView`, `drag` và `select` yêu cầu ref ảnh chụp nhanh (không hỗ trợ bộ chọn CSS). `click-coords` nhấp vào tọa độ hiển thị trong khung nhìn và không yêu cầu ref ảnh chụp nhanh. `click` chỉ hỗ trợ nút trái (không hỗ trợ ghi đè nút hoặc phím bổ trợ). `type` không hỗ trợ `slowly=true`; hãy sử dụng `fill` hoặc `press`. `press` không hỗ trợ `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` và `fill` không hỗ trợ ghi đè `timeoutMs` theo từng lệnh gọi; `evaluate` có hỗ trợ. `select` chấp nhận một giá trị duy nhất. `batch` không được hỗ trợ; hãy gửi từng thao tác riêng lẻ.
- **Chờ / tải lên / hộp thoại** - `wait --url` hỗ trợ mẫu khớp chính xác, chuỗi con và glob (giống chế độ được quản lý); `wait --load networkidle` không được hỗ trợ trên hồ sơ phiên hiện có (tính năng này hoạt động trên hồ sơ được quản lý và hồ sơ CDP thô/từ xa). Hook tải lên yêu cầu `ref` hoặc `inputRef`, mỗi lần một tệp, không hỗ trợ CSS `element`. Hook hộp thoại không hỗ trợ ghi đè thời gian chờ hoặc `dialogId`.
- **Khả năng hiển thị hộp thoại** - Phản hồi thao tác trình duyệt được quản lý bao gồm `blockedByDialog` và `browserState.dialogs.pending` khi một thao tác mở hộp thoại phương thức; ảnh chụp nhanh cũng bao gồm trạng thái hộp thoại đang chờ xử lý. Phản hồi bằng `browser dialog --accept/--dismiss --dialog-id <id>` trong khi hộp thoại đang chờ xử lý. Các hộp thoại được xử lý bên ngoài OpenClaw xuất hiện trong `browserState.dialogs.recent`.
- **Các tính năng chỉ dành cho chế độ được quản lý** - Xuất PDF, chặn tải xuống và `responsebody` vẫn yêu cầu đường dẫn trình duyệt được quản lý.

</Accordion>

## Bảo đảm cô lập

- **Thư mục dữ liệu người dùng chuyên dụng**: không bao giờ tác động đến hồ sơ trình duyệt cá nhân của bạn.
- **Cổng chuyên dụng**: tránh `9222` để ngăn xung đột với quy trình phát triển.
- **Điều khiển tab xác định**: `tabs` trả về `suggestedTargetId` trước, sau đó là
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
  `/usr/lib/chromium-browser`, cùng với Chromium do Playwright quản lý trong
  `PLAYWRIGHT_BROWSERS_PATH` hoặc `~/.cache/ms-playwright`.
- Windows: kiểm tra các vị trí cài đặt phổ biến.

## API điều khiển (tùy chọn)

Để tạo tập lệnh và gỡ lỗi, Gateway cung cấp một **API điều khiển HTTP chỉ dành cho
loopback** nhỏ cùng một CLI `openclaw browser` tương ứng (ảnh chụp nhanh, ref, khả năng
chờ nâng cao, đầu ra JSON, quy trình gỡ lỗi). Xem
[API điều khiển trình duyệt](/vi/tools/browser-control) để biết tài liệu tham khảo đầy đủ.

## Khắc phục sự cố

Đối với các sự cố dành riêng cho Linux (đặc biệt là snap Chromium), hãy xem
[Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting).

Đối với cấu hình chia tách máy chủ giữa WSL2 Gateway và Chrome trên Windows, hãy xem
[Khắc phục sự cố WSL2 + Windows + CDP Chrome từ xa](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Lỗi khởi động CDP và chặn SSRF điều hướng

Đây là các loại lỗi khác nhau và chúng chỉ đến các đường dẫn mã khác nhau.

- **Lỗi khởi động hoặc trạng thái sẵn sàng của CDP** nghĩa là OpenClaw không thể xác nhận rằng mặt phẳng điều khiển trình duyệt hoạt động bình thường.
- **Chặn SSRF điều hướng** nghĩa là mặt phẳng điều khiển trình duyệt hoạt động bình thường, nhưng đích điều hướng trang bị chính sách từ chối.

Các ví dụ phổ biến:

- Lỗi khởi động hoặc trạng thái sẵn sàng của CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` khi một
    dịch vụ CDP bên ngoài trên loopback được cấu hình mà không có `attachOnly: true`
- Chặn SSRF điều hướng:
  - Các luồng `open`, `navigate`, ảnh chụp nhanh hoặc mở tab gặp lỗi chính sách trình duyệt/mạng trong khi `start` và `tabs` vẫn hoạt động

Sử dụng trình tự tối thiểu sau để phân biệt hai trường hợp:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cách đọc kết quả:

- Nếu `start` thất bại với `not reachable after start`, trước tiên hãy khắc phục trạng thái sẵn sàng của CDP.
- Nếu `start` thành công nhưng `tabs` thất bại, mặt phẳng điều khiển vẫn không hoạt động bình thường. Hãy coi đây là sự cố khả năng truy cập CDP, không phải sự cố điều hướng trang.
- Nếu `start` và `tabs` thành công nhưng `open` hoặc `navigate` thất bại, mặt phẳng điều khiển trình duyệt đang hoạt động và lỗi nằm ở chính sách điều hướng hoặc trang đích.
- Nếu `start`, `tabs` và `open` đều thành công, đường dẫn điều khiển trình duyệt được quản lý cơ bản đang hoạt động bình thường.

Chi tiết hành vi quan trọng:

- Cấu hình trình duyệt mặc định sử dụng một đối tượng chính sách SSRF đóng khi lỗi ngay cả khi bạn không cấu hình `browser.ssrfPolicy`.
- Đối với hồ sơ được quản lý `openclaw` trên loopback cục bộ, các bước kiểm tra trạng thái CDP chủ ý bỏ qua việc thực thi khả năng truy cập SSRF của trình duyệt đối với mặt phẳng điều khiển cục bộ của chính OpenClaw.
- Biện pháp bảo vệ điều hướng là riêng biệt. Kết quả `start` hoặc `tabs` thành công không có nghĩa là đích `open` hoặc `navigate` sau đó được phép.

Hướng dẫn bảo mật:

- Theo mặc định, **không** nới lỏng chính sách SSRF của trình duyệt.
- Ưu tiên các ngoại lệ máy chủ hẹp như `hostnameAllowlist` hoặc `allowedHostnames` thay vì quyền truy cập mạng riêng rộng.
- Chỉ sử dụng `dangerouslyAllowPrivateNetwork: true` trong các môi trường được chủ ý tin cậy, nơi quyền truy cập trình duyệt vào mạng riêng là bắt buộc và đã được xem xét.

## Công cụ agent + cách thức điều khiển hoạt động

Agent nhận được **một công cụ** để tự động hóa trình duyệt:

- `browser` - chẩn đoán/trạng thái/khởi động/dừng/tab/mở/tập trung/đóng/ảnh chụp nhanh/ảnh chụp màn hình/điều hướng/thao tác

Cách ánh xạ:

- `browser snapshot` trả về một cây giao diện người dùng ổn định (AI hoặc ARIA).
- `browser act` sử dụng các ID `ref` của ảnh chụp trạng thái để nhấp/nhập/kéo/chọn.
- `browser screenshot` chụp các pixel (toàn trang, phần tử hoặc các tham chiếu có nhãn).
- `browser doctor` kiểm tra trạng thái sẵn sàng của Gateway, plugin, hồ sơ, trình duyệt và thẻ.
- `browser` chấp nhận:
  - `profile` để chọn một hồ sơ trình duyệt có tên (openclaw, chrome hoặc CDP từ xa).
  - `target` (`sandbox` | `host` | `node`) để chọn nơi trình duyệt hoạt động.
  - Trong các phiên chạy trong sandbox, `target: "host"` yêu cầu `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Nếu bỏ qua `target`: các phiên chạy trong sandbox mặc định dùng `sandbox`, các phiên không chạy trong sandbox mặc định dùng `host`.
  - Nếu một node có khả năng chạy trình duyệt được kết nối, công cụ có thể tự động định tuyến đến node đó, trừ khi bạn cố định `target="host"` hoặc `target="node"`.

Điều này giúp tác nhân hoạt động một cách xác định và tránh các bộ chọn dễ hỏng.

## Liên quan

- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ tác nhân hiện có
- [Sandbox](/vi/gateway/sandboxing) - điều khiển trình duyệt trong các môi trường chạy trong sandbox
- [Bảo mật](/vi/gateway/security) - các rủi ro khi điều khiển trình duyệt và biện pháp tăng cường bảo mật
