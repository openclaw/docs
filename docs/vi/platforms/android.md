---
read_when:
    - Ghép nối hoặc kết nối lại Node Android
    - Gỡ lỗi việc phát hiện Gateway Android hoặc xác thực
    - Xác minh tính tương đương của lịch sử trò chuyện giữa các ứng dụng khách
summary: 'Ứng dụng Android (node): sổ tay vận hành kết nối + bề mặt lệnh Kết nối/Trò chuyện/Thoại/Khung vẽ'
title: Ứng dụng Android
x-i18n:
    generated_at: "2026-05-06T09:20:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Ứng dụng Android chưa được phát hành công khai. Mã nguồn có sẵn trong [kho lưu trữ OpenClaw](https://github.com/openclaw/openclaw) dưới `apps/android`. Bạn có thể tự build bằng Java 17 và Android SDK (`./gradlew :app:assemblePlayDebug`). Xem [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) để biết hướng dẫn build.
</Note>

## Ảnh chụp trạng thái hỗ trợ

- Vai trò: ứng dụng nút đồng hành (Android không host Gateway).
- Yêu cầu Gateway: có (chạy trên macOS, Linux hoặc Windows qua WSL2).
- Cài đặt: [Bắt đầu](/vi/start/getting-started) + [Ghép nối](/vi/channels/pairing).
- Gateway: [Runbook](/vi/gateway) + [Cấu hình](/vi/gateway/configuration).
  - Giao thức: [Giao thức Gateway](/vi/gateway/protocol) (các nút + mặt phẳng điều khiển).

## Điều khiển hệ thống

Điều khiển hệ thống (launchd/systemd) nằm trên máy chủ Gateway. Xem [Gateway](/vi/gateway).

## Runbook kết nối

Ứng dụng nút Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android kết nối trực tiếp tới Gateway WebSocket và dùng ghép nối thiết bị (`role: node`).

Với Tailscale hoặc host công khai, Android yêu cầu một endpoint bảo mật:

- Ưu tiên: Tailscale Serve / Funnel với `https://<magicdns>` / `wss://<magicdns>`
- Cũng được hỗ trợ: bất kỳ URL Gateway `wss://` nào khác có endpoint TLS thật
- `ws://` dạng cleartext vẫn được hỗ trợ trên địa chỉ LAN riêng / host `.local`, cùng với `localhost`, `127.0.0.1` và cầu nối trình giả lập Android (`10.0.2.2`)

### Điều kiện tiên quyết

- Bạn có thể chạy Gateway trên máy "master".
- Thiết bị/trình giả lập Android có thể truy cập gateway WebSocket:
  - Cùng LAN với mDNS/NSD, **hoặc**
  - Cùng tailnet Tailscale bằng Wide-Area Bonjour / unicast DNS-SD (xem bên dưới), **hoặc**
  - Host/cổng gateway thủ công (dự phòng)
- Ghép nối di động qua tailnet/công khai **không** dùng endpoint IP tailnet thô `ws://`. Thay vào đó hãy dùng Tailscale Serve hoặc URL `wss://` khác.
- Bạn có thể chạy CLI (`openclaw`) trên máy gateway (hoặc qua SSH).

### 1) Khởi động Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Xác nhận trong nhật ký rằng bạn thấy nội dung tương tự:

- `listening on ws://0.0.0.0:18789`

Để truy cập Android từ xa qua Tailscale, ưu tiên Serve/Funnel thay vì bind tailnet thô:

```bash
openclaw gateway --tailscale serve
```

Cách này cung cấp cho Android endpoint `wss://` / `https://` bảo mật. Thiết lập `gateway.bind: "tailnet"` thuần túy là chưa đủ cho lần đầu ghép nối Android từ xa, trừ khi bạn cũng terminate TLS riêng.

### 2) Xác minh discovery (tùy chọn)

Từ máy gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Ghi chú gỡ lỗi thêm: [Bonjour](/vi/gateway/bonjour).

Nếu bạn cũng đã cấu hình miền discovery diện rộng, hãy so sánh với:

```bash
openclaw gateway discover --json
```

Lệnh đó hiển thị `local.` cùng với miền diện rộng đã cấu hình trong một lần chạy và dùng
endpoint dịch vụ đã phân giải thay vì chỉ các gợi ý TXT.

#### Discovery qua tailnet (Vienna ⇄ London) bằng unicast DNS-SD

Discovery NSD/mDNS của Android sẽ không đi xuyên mạng. Nếu nút Android và gateway ở các mạng khác nhau nhưng được kết nối qua Tailscale, hãy dùng Wide-Area Bonjour / unicast DNS-SD thay thế.

Chỉ discovery là chưa đủ cho ghép nối Android qua tailnet/công khai. Tuyến được phát hiện vẫn cần endpoint bảo mật (`wss://` hoặc Tailscale Serve):

1. Thiết lập một vùng DNS-SD (ví dụ `openclaw.internal.`) trên host gateway và publish bản ghi `_openclaw-gw._tcp`.
2. Cấu hình Tailscale split DNS cho miền bạn chọn, trỏ tới máy chủ DNS đó.

Chi tiết và cấu hình CoreDNS ví dụ: [Bonjour](/vi/gateway/bonjour).

### 3) Kết nối từ Android

Trong ứng dụng Android:

- Ứng dụng duy trì kết nối gateway bằng **foreground service** (thông báo thường trực).
- Mở thẻ **Kết nối**.
- Dùng chế độ **Mã thiết lập** hoặc **Thủ công**.
- Nếu discovery bị chặn, dùng host/cổng thủ công trong **Điều khiển nâng cao**. Với host LAN riêng, `ws://` vẫn hoạt động. Với host Tailscale/công khai, bật TLS và dùng endpoint `wss://` / Tailscale Serve.

Sau lần ghép nối thành công đầu tiên, Android tự động kết nối lại khi khởi chạy:

- Endpoint thủ công (nếu được bật), nếu không thì
- Gateway được phát hiện gần nhất (nỗ lực tối đa).

### Beacon báo hiện diện còn sống

Sau khi phiên nút đã xác thực kết nối, và khi ứng dụng chuyển xuống nền trong khi
foreground service vẫn đang kết nối, Android gọi `node.event` với
`event: "node.presence.alive"`. Gateway ghi nhận thông tin này dưới dạng `lastSeenAtMs`/`lastSeenReason` trên
metadata nút/thiết bị đã ghép nối chỉ sau khi biết danh tính thiết bị nút đã xác thực.

Ứng dụng chỉ tính beacon là đã được ghi nhận thành công khi phản hồi từ gateway bao gồm
`handled: true`. Gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó
tương thích nhưng không được tính là cập nhật lần thấy gần nhất bền vững.

### 4) Phê duyệt ghép nối (CLI)

Trên máy gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Chi tiết ghép nối: [Ghép nối](/vi/channels/pairing).

Tùy chọn: nếu nút Android luôn kết nối từ một subnet được kiểm soát chặt,
bạn có thể bật tự động phê duyệt nút lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Tính năng này bị tắt theo mặc định. Nó chỉ áp dụng cho ghép nối `role: node` mới
không có scope được yêu cầu. Ghép nối operator/trình duyệt và mọi thay đổi về vai trò, scope, metadata hoặc
khóa công khai vẫn yêu cầu phê duyệt thủ công.

### 5) Xác minh nút đã kết nối

- Qua trạng thái nút:

  ```bash
  openclaw nodes status
  ```

- Qua Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + lịch sử

Thẻ Chat của Android hỗ trợ chọn phiên (mặc định `main`, cùng các phiên hiện có khác):

- Lịch sử: `chat.history` (đã chuẩn hóa để hiển thị; thẻ chỉ thị inline bị
  loại khỏi văn bản hiển thị, payload XML gọi công cụ dạng văn bản thuần (bao gồm
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và
  các khối gọi công cụ bị cắt ngắn) cùng token điều khiển mô hình ASCII/full-width bị lộ
  bị loại bỏ, các hàng assistant chỉ chứa token im lặng như chính xác `NO_REPLY` /
  `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder)
- Gửi: `chat.send`
- Cập nhật push (nỗ lực tối đa): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Host Canvas Gateway (khuyến nghị cho nội dung web)

Nếu bạn muốn nút hiển thị HTML/CSS/JS thật mà agent có thể chỉnh sửa trên đĩa, hãy trỏ nút tới host canvas của Gateway.

<Note>
Các nút tải canvas từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
</Note>

1. Tạo `~/.openclaw/workspace/canvas/index.html` trên host gateway.

2. Điều hướng nút tới đó (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (tùy chọn): nếu cả hai thiết bị đều ở trên Tailscale, dùng tên MagicDNS hoặc IP tailnet thay vì `.local`, ví dụ `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Máy chủ này inject client live-reload vào HTML và tải lại khi tệp thay đổi.
Host A2UI nằm tại `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Lệnh Canvas (chỉ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (dùng `{"url":""}` hoặc `{"url":"/"}` để trở về scaffold mặc định). `canvas.snapshot` trả về `{ format, base64 }` (mặc định `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` là alias cũ)

Lệnh camera (chỉ foreground; được kiểm soát bằng quyền):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Xem [Nút camera](/vi/nodes/camera) để biết tham số và helper CLI.

### 8) Voice + bề mặt lệnh Android mở rộng

- Thẻ Voice: Android có hai chế độ thu âm rõ ràng. **Mic** là phiên thủ công trong thẻ Voice, gửi mỗi khoảng dừng thành một lượt chat và dừng khi ứng dụng rời foreground hoặc người dùng rời thẻ Voice. **Talk** là Chế độ Talk liên tục và tiếp tục nghe cho tới khi bị tắt hoặc nút ngắt kết nối.
- Chế độ Talk nâng foreground service hiện có từ `dataSync` lên `dataSync|microphone` trước khi bắt đầu thu âm, rồi hạ xuống khi Chế độ Talk dừng. Android 14+ yêu cầu khai báo `FOREGROUND_SERVICE_MICROPHONE`, quyền runtime `RECORD_AUDIO` và loại dịch vụ microphone tại runtime.
- Phản hồi bằng giọng nói dùng `talk.speak` thông qua nhà cung cấp Talk đã cấu hình của gateway. TTS hệ thống cục bộ chỉ được dùng khi `talk.speak` không khả dụng.
- Voice wake vẫn bị tắt trong UX/runtime của Android.
- Các nhóm lệnh Android bổ sung (mức khả dụng phụ thuộc vào thiết bị + quyền):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (xem [Chuyển tiếp thông báo](#notification-forwarding) bên dưới)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Điểm vào assistant

Android hỗ trợ khởi chạy OpenClaw từ trigger assistant hệ thống (Google
Assistant). Khi được cấu hình, giữ nút home hoặc nói "Hey Google, ask
OpenClaw..." sẽ mở ứng dụng và chuyển prompt vào trình soạn chat.

Tính năng này dùng metadata **App Actions** của Android được khai báo trong manifest ứng dụng. Không
cần cấu hình thêm ở phía gateway -- intent assistant được
ứng dụng Android xử lý hoàn toàn và chuyển tiếp như một tin nhắn chat bình thường.

<Note>
Mức khả dụng của App Actions phụ thuộc vào thiết bị, phiên bản Google Play Services,
và việc người dùng đã đặt OpenClaw làm ứng dụng assistant mặc định hay chưa.
</Note>

## Chuyển tiếp thông báo

Android có thể chuyển tiếp thông báo thiết bị tới gateway dưới dạng sự kiện. Một số điều khiển cho phép bạn giới hạn thông báo nào được chuyển tiếp và khi nào.

| Khóa                             | Loại           | Mô tả                                                                                             |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Chỉ chuyển tiếp thông báo từ các tên package này. Nếu được đặt, mọi package khác sẽ bị bỏ qua.    |
| `notifications.denyPackages`     | string[]       | Không bao giờ chuyển tiếp thông báo từ các tên package này. Áp dụng sau `allowPackages`.          |
| `notifications.quietHours.start` | string (HH:mm) | Bắt đầu khung giờ yên lặng (giờ thiết bị cục bộ). Thông báo bị chặn trong khoảng thời gian này.   |
| `notifications.quietHours.end`   | string (HH:mm) | Kết thúc khung giờ yên lặng.                                                                      |
| `notifications.rateLimit`        | number         | Số thông báo tối đa được chuyển tiếp trên mỗi package mỗi phút. Thông báo vượt quá sẽ bị bỏ.      |

Trình chọn thông báo cũng dùng hành vi an toàn hơn cho các sự kiện thông báo được chuyển tiếp, ngăn việc vô tình chuyển tiếp thông báo hệ thống nhạy cảm.

Cấu hình ví dụ:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Chuyển tiếp thông báo yêu cầu quyền Android Notification Listener. Ứng dụng sẽ nhắc cấp quyền này trong quá trình thiết lập.
</Note>

## Liên quan

- [Ứng dụng iOS](/vi/platforms/ios)
- [Nút](/vi/nodes)
- [Khắc phục sự cố nút Android](/vi/nodes/troubleshooting)
