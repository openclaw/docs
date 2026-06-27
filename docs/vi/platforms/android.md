---
read_when:
    - Ghép nối hoặc kết nối lại node Android
    - Gỡ lỗi phát hiện Gateway hoặc xác thực trên Android
    - Xác minh tính tương đương của lịch sử trò chuyện trên các máy khách
summary: 'Ứng dụng Android (nút): sổ tay vận hành kết nối + giao diện lệnh Kết nối/Trò chuyện/Giọng nói/Canvas'
title: Ứng dụng Android
x-i18n:
    generated_at: "2026-06-27T17:41:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Ứng dụng Android chính thức có trên [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Đây là một nút đồng hành và yêu cầu một OpenClaw Gateway đang chạy. Mã nguồn cũng có trong [kho lưu trữ OpenClaw](https://github.com/openclaw/openclaw) dưới `apps/android`; xem [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) để biết hướng dẫn build.
</Note>

## Ảnh chụp hỗ trợ

- Vai trò: ứng dụng nút đồng hành (Android không host Gateway).
- Yêu cầu Gateway: có (chạy trên macOS, Linux hoặc Windows qua WSL2).
- Cài đặt: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) cho ứng dụng, [Bắt đầu](/vi/start/getting-started) cho Gateway, sau đó [Ghép nối](/vi/channels/pairing).
- Gateway: [Runbook](/vi/gateway) + [Cấu hình](/vi/gateway/configuration).
  - Giao thức: [Giao thức Gateway](/vi/gateway/protocol) (các nút + mặt phẳng điều khiển).

## Điều khiển hệ thống

Điều khiển hệ thống (launchd/systemd) nằm trên máy host Gateway. Xem [Gateway](/vi/gateway).

## Runbook kết nối

Ứng dụng nút Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android kết nối trực tiếp tới Gateway WebSocket và dùng ghép nối thiết bị (`role: node`).

Đối với Tailscale hoặc host công khai, Android yêu cầu một endpoint bảo mật:

- Ưu tiên: Tailscale Serve / Funnel với `https://<magicdns>` / `wss://<magicdns>`
- Cũng được hỗ trợ: bất kỳ URL Gateway `wss://` nào khác với endpoint TLS thật
- `ws://` dạng cleartext vẫn được hỗ trợ trên địa chỉ LAN riêng / host `.local`, cùng với `localhost`, `127.0.0.1`, và cầu nối trình giả lập Android (`10.0.2.2`)

### Điều kiện tiên quyết

- Bạn có thể chạy Gateway trên máy "master".
- Thiết bị/trình giả lập Android có thể truy cập WebSocket của gateway:
  - Cùng LAN với mDNS/NSD, **hoặc**
  - Cùng tailnet Tailscale bằng Wide-Area Bonjour / unicast DNS-SD (xem bên dưới), **hoặc**
  - Host/cổng gateway thủ công (phương án dự phòng)
- Ghép nối di động qua tailnet/công khai **không** dùng endpoint IP tailnet thô `ws://`. Thay vào đó hãy dùng Tailscale Serve hoặc URL `wss://` khác.
- Bạn có thể chạy CLI (`openclaw`) trên máy gateway (hoặc qua SSH).

### 1) Khởi động Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Xác nhận trong log rằng bạn thấy nội dung như:

- `listening on ws://0.0.0.0:18789`

Để Android truy cập từ xa qua Tailscale, ưu tiên Serve/Funnel thay vì bind tailnet thô:

```bash
openclaw gateway --tailscale serve
```

Việc này cung cấp cho Android một endpoint `wss://` / `https://` bảo mật. Thiết lập `gateway.bind: "tailnet"` thuần túy là chưa đủ cho lần ghép nối Android từ xa đầu tiên, trừ khi bạn cũng kết thúc TLS riêng.

### 2) Xác minh khám phá (tùy chọn)

Từ máy gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Ghi chú gỡ lỗi thêm: [Bonjour](/vi/gateway/bonjour).

Nếu bạn cũng đã cấu hình miền khám phá diện rộng, hãy so sánh với:

```bash
openclaw gateway discover --json
```

Lệnh đó hiển thị `local.` cùng miền diện rộng đã cấu hình trong một lượt và dùng endpoint dịch vụ đã phân giải thay vì chỉ các gợi ý TXT.

#### Khám phá tailnet (Vienna ⇄ London) qua unicast DNS-SD

Khám phá Android NSD/mDNS sẽ không đi qua các mạng. Nếu nút Android và gateway của bạn ở các mạng khác nhau nhưng được kết nối qua Tailscale, hãy dùng Wide-Area Bonjour / unicast DNS-SD thay thế.

Chỉ khám phá thôi là chưa đủ để ghép nối Android qua tailnet/công khai. Tuyến đã khám phá vẫn cần endpoint bảo mật (`wss://` hoặc Tailscale Serve):

1. Thiết lập một vùng DNS-SD (ví dụ `openclaw.internal.`) trên host gateway và publish bản ghi `_openclaw-gw._tcp`.
2. Cấu hình split DNS của Tailscale cho miền bạn chọn, trỏ tới máy chủ DNS đó.

Chi tiết và cấu hình CoreDNS mẫu: [Bonjour](/vi/gateway/bonjour).

### 3) Kết nối từ Android

Trong ứng dụng Android:

- Ứng dụng giữ kết nối gateway hoạt động bằng **foreground service** (thông báo liên tục).
- Mở tab **Connect**.
- Dùng chế độ **Setup Code** hoặc **Manual**.
- Nếu khám phá bị chặn, dùng host/cổng thủ công trong **Advanced controls**. Với host LAN riêng, `ws://` vẫn hoạt động. Với host Tailscale/công khai, bật TLS và dùng endpoint `wss://` / Tailscale Serve.

Sau lần ghép nối thành công đầu tiên, Android tự động kết nối lại khi khởi chạy:

- Endpoint thủ công (nếu bật), nếu không thì
- Gateway được khám phá gần nhất (best-effort).

### Beacon trạng thái hiện diện còn sống

Sau khi phiên nút đã xác thực kết nối, và khi ứng dụng chuyển sang nền trong khi
foreground service vẫn đang kết nối, Android gọi `node.event` với
`event: "node.presence.alive"`. Gateway ghi nhận điều này thành `lastSeenAtMs`/`lastSeenReason` trên
metadata nút/thiết bị đã ghép nối chỉ sau khi biết danh tính thiết bị nút đã xác thực.

Ứng dụng chỉ tính beacon là đã được ghi nhận thành công khi phản hồi gateway bao gồm
`handled: true`. Gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó
tương thích nhưng không được tính là bản cập nhật last-seen bền vững.

### 4) Phê duyệt ghép nối (CLI)

Trên máy gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Chi tiết ghép nối: [Ghép nối](/vi/channels/pairing).

Tùy chọn: nếu nút Android luôn kết nối từ một subnet được kiểm soát chặt chẽ,
bạn có thể chọn bật tự động phê duyệt nút lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

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

Tính năng này mặc định bị tắt. Nó chỉ áp dụng cho ghép nối `role: node` mới
không yêu cầu scope nào. Ghép nối operator/browser và mọi thay đổi về vai trò, scope, metadata hoặc
khóa công khai vẫn yêu cầu phê duyệt thủ công.

### 5) Xác minh nút đã kết nối

- Qua trạng thái nodes:

  ```bash
  openclaw nodes status
  ```

- Qua Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + lịch sử

Tab Chat của Android hỗ trợ chọn phiên (mặc định `main`, cùng các phiên hiện có khác):

- Lịch sử: `chat.history` (được chuẩn hóa để hiển thị; các thẻ chỉ thị inline được
  loại khỏi văn bản hiển thị, payload XML lời gọi công cụ dạng plain-text (bao gồm
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và
  các khối lời gọi công cụ bị cắt ngắn) và token điều khiển mô hình ASCII/full-width bị rò rỉ
  được loại bỏ, các hàng assistant chỉ chứa token im lặng thuần túy như đúng `NO_REPLY` /
  `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder)
- Gửi: `chat.send`
- Cập nhật push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Host Canvas Gateway (khuyến nghị cho nội dung web)

Nếu bạn muốn nút hiển thị HTML/CSS/JS thật mà agent có thể chỉnh sửa trên ổ đĩa, hãy trỏ nút tới host canvas của Gateway.

<Note>
Các nút tải canvas từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
</Note>

1. Tạo `~/.openclaw/workspace/canvas/index.html` trên host gateway.

2. Điều hướng nút tới đó (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (tùy chọn): nếu cả hai thiết bị đều ở trên Tailscale, hãy dùng tên MagicDNS hoặc IP tailnet thay cho `.local`, ví dụ `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Máy chủ này chèn client live-reload vào HTML và tải lại khi tệp thay đổi.
Gateway cũng phục vụ `/__openclaw__/a2ui/`, nhưng ứng dụng Android coi các trang A2UI từ xa là chỉ để render. Các lệnh A2UI có khả năng hành động dùng trang A2UI do ứng dụng sở hữu và được bundle trước khi áp dụng tin nhắn.

Lệnh Canvas (chỉ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (dùng `{"url":""}` hoặc `{"url":"/"}` để quay lại scaffold mặc định). `canvas.snapshot` trả về `{ format, base64 }` (mặc định `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` là alias legacy). Các lệnh này dùng trang A2UI do ứng dụng sở hữu và được bundle để render có khả năng hành động.

Lệnh camera (chỉ foreground; có cổng quyền):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Xem [Nút camera](/vi/nodes/camera) để biết tham số và helper CLI.

### 8) Giọng nói + bề mặt lệnh Android mở rộng

- Tab Voice: Android có hai chế độ thu rõ ràng. **Mic** là phiên tab Voice thủ công, gửi mỗi khoảng tạm dừng thành một lượt chat và dừng khi ứng dụng rời foreground hoặc người dùng rời tab Voice. **Talk** là Talk Mode liên tục và tiếp tục lắng nghe cho đến khi được tắt hoặc nút ngắt kết nối.
- Talk Mode nâng foreground service hiện có từ `connectedDevice` lên `connectedDevice|microphone` trước khi bắt đầu thu, rồi hạ xuống khi Talk Mode dừng. Dịch vụ nút khai báo `FOREGROUND_SERVICE_CONNECTED_DEVICE` với `CHANGE_NETWORK_STATE`; Android 14+ cũng yêu cầu khai báo `FOREGROUND_SERVICE_MICROPHONE`, quyền runtime `RECORD_AUDIO`, và loại dịch vụ microphone tại runtime.
- Theo mặc định, Android Talk dùng nhận dạng giọng nói native, Gateway chat, và `talk.speak` thông qua provider Talk gateway đã cấu hình. TTS hệ thống cục bộ chỉ được dùng khi `talk.speak` không khả dụng.
- Android Talk chỉ dùng relay Gateway realtime khi `talk.realtime.mode` là `realtime` và `talk.realtime.transport` là `gateway-relay`.
- Voice wake vẫn bị tắt trong UX/runtime Android.
- Các họ lệnh Android bổ sung (khả dụng tùy thuộc vào thiết bị, quyền và cài đặt người dùng):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` chỉ khi bật **Settings > Phone Capabilities > Installed Apps**; mặc định nó liệt kê các ứng dụng hiển thị trong launcher.
  - `notifications.list`, `notifications.actions` (xem [Chuyển tiếp thông báo](#notification-forwarding) bên dưới)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Điểm vào assistant

Android hỗ trợ khởi chạy OpenClaw từ trình kích hoạt assistant hệ thống (Google
Assistant). Khi được cấu hình, giữ nút home hoặc nói "Hey Google, ask
OpenClaw..." sẽ mở ứng dụng và chuyển prompt vào trình soạn chat.

Tính năng này dùng metadata **App Actions** của Android được khai báo trong manifest ứng dụng. Không
cần cấu hình bổ sung ở phía gateway -- intent assistant được
ứng dụng Android xử lý hoàn toàn và chuyển tiếp như một tin nhắn chat bình thường.

<Note>
Khả dụng của App Actions phụ thuộc vào thiết bị, phiên bản Google Play Services,
và việc người dùng đã đặt OpenClaw làm ứng dụng assistant mặc định hay chưa.
</Note>

## Chuyển tiếp thông báo

Android có thể chuyển tiếp thông báo thiết bị tới gateway dưới dạng sự kiện. Một số điều khiển cho phép bạn giới hạn thông báo nào được chuyển tiếp và khi nào.

| Khóa                             | Loại           | Mô tả                                                                                             |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Chỉ chuyển tiếp thông báo từ các tên package này. Nếu được đặt, mọi package khác sẽ bị bỏ qua.    |
| `notifications.denyPackages`     | string[]       | Không bao giờ chuyển tiếp thông báo từ các tên package này. Áp dụng sau `allowPackages`.          |
| `notifications.quietHours.start` | string (HH:mm) | Bắt đầu khoảng thời gian yên lặng (giờ thiết bị cục bộ). Thông báo bị chặn trong khoảng này.      |
| `notifications.quietHours.end`   | string (HH:mm) | Kết thúc khoảng thời gian yên lặng.                                                               |
| `notifications.rateLimit`        | number         | Số thông báo được chuyển tiếp tối đa cho mỗi package mỗi phút. Thông báo vượt mức sẽ bị loại bỏ.  |

Trình chọn thông báo cũng dùng hành vi an toàn hơn cho các sự kiện thông báo được chuyển tiếp, ngăn vô tình chuyển tiếp thông báo hệ thống nhạy cảm.

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
- [Các Node](/vi/nodes)
- [Khắc phục sự cố Node Android](/vi/nodes/troubleshooting)
