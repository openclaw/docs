---
read_when:
    - Ghép nối hoặc kết nối lại Node Android
    - Gỡ lỗi việc phát hiện Gateway hoặc xác thực trên Android
    - Xác minh tính tương đương của lịch sử trò chuyện trên các máy khách
summary: 'Ứng dụng Android (nút): sổ tay vận hành kết nối + bề mặt lệnh Connect/Chat/Voice/Canvas'
title: Ứng dụng Android
x-i18n:
    generated_at: "2026-04-29T22:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Ứng dụng Android chưa được phát hành công khai. Mã nguồn có sẵn trong [kho lưu trữ OpenClaw](https://github.com/openclaw/openclaw) dưới `apps/android`. Bạn có thể tự build bằng Java 17 và Android SDK (`./gradlew :app:assemblePlayDebug`). Xem [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) để biết hướng dẫn build.
</Note>

## Ảnh chụp nhanh hỗ trợ

- Vai trò: ứng dụng node đồng hành (Android không host Gateway).
- Yêu cầu Gateway: có (chạy trên macOS, Linux, hoặc Windows qua WSL2).
- Cài đặt: [Bắt đầu](/vi/start/getting-started) + [Ghép đôi](/vi/channels/pairing).
- Gateway: [Sổ tay vận hành](/vi/gateway) + [Cấu hình](/vi/gateway/configuration).
  - Giao thức: [Giao thức Gateway](/vi/gateway/protocol) (node + control plane).

## Điều khiển hệ thống

Điều khiển hệ thống (launchd/systemd) nằm trên host Gateway. Xem [Gateway](/vi/gateway).

## Sổ tay kết nối

Ứng dụng node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android kết nối trực tiếp tới Gateway WebSocket và dùng ghép đôi thiết bị (`role: node`).

Với Tailscale hoặc host công khai, Android yêu cầu một endpoint bảo mật:

- Ưu tiên: Tailscale Serve / Funnel với `https://<magicdns>` / `wss://<magicdns>`
- Cũng được hỗ trợ: bất kỳ URL Gateway `wss://` nào khác với endpoint TLS thật
- Văn bản rõ `ws://` vẫn được hỗ trợ trên địa chỉ LAN riêng / host `.local`, cùng với `localhost`, `127.0.0.1`, và cầu nối trình giả lập Android (`10.0.2.2`)

### Điều kiện tiên quyết

- Bạn có thể chạy Gateway trên máy “master”.
- Thiết bị/trình giả lập Android có thể truy cập WebSocket gateway:
  - Cùng LAN với mDNS/NSD, **hoặc**
  - Cùng tailnet Tailscale bằng Wide-Area Bonjour / unicast DNS-SD (xem bên dưới), **hoặc**
  - Host/cổng gateway thủ công (dự phòng)
- Ghép đôi di động qua tailnet/công khai **không** dùng endpoint IP tailnet thô `ws://`. Thay vào đó hãy dùng Tailscale Serve hoặc một URL `wss://` khác.
- Bạn có thể chạy CLI (`openclaw`) trên máy gateway (hoặc qua SSH).

### 1) Khởi động Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Xác nhận trong nhật ký bạn thấy nội dung tương tự:

- `listening on ws://0.0.0.0:18789`

Để truy cập Android từ xa qua Tailscale, hãy ưu tiên Serve/Funnel thay vì bind tailnet thô:

```bash
openclaw gateway --tailscale serve
```

Điều này cung cấp cho Android một endpoint `wss://` / `https://` bảo mật. Thiết lập `gateway.bind: "tailnet"` thuần túy là chưa đủ cho lần ghép đôi Android từ xa đầu tiên, trừ khi bạn cũng kết thúc TLS riêng.

### 2) Xác minh khám phá (tùy chọn)

Từ máy gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Ghi chú gỡ lỗi thêm: [Bonjour](/vi/gateway/bonjour).

Nếu bạn cũng đã cấu hình một miền khám phá diện rộng, hãy so sánh với:

```bash
openclaw gateway discover --json
```

Lệnh đó hiển thị `local.` cùng miền diện rộng đã cấu hình trong một lượt và dùng endpoint dịch vụ đã phân giải thay vì chỉ các gợi ý TXT.

#### Khám phá tailnet (Vienna ⇄ London) qua unicast DNS-SD

Khám phá Android NSD/mDNS sẽ không đi xuyên mạng. Nếu node Android và gateway của bạn ở các mạng khác nhau nhưng được kết nối qua Tailscale, hãy dùng Wide-Area Bonjour / unicast DNS-SD thay thế.

Chỉ khám phá thôi là chưa đủ cho ghép đôi Android qua tailnet/công khai. Tuyến đã khám phá vẫn cần một endpoint bảo mật (`wss://` hoặc Tailscale Serve):

1. Thiết lập một vùng DNS-SD (ví dụ `openclaw.internal.`) trên host gateway và xuất bản bản ghi `_openclaw-gw._tcp`.
2. Cấu hình Tailscale split DNS cho miền bạn chọn trỏ tới máy chủ DNS đó.

Chi tiết và cấu hình CoreDNS ví dụ: [Bonjour](/vi/gateway/bonjour).

### 3) Kết nối từ Android

Trong ứng dụng Android:

- Ứng dụng giữ kết nối gateway còn sống qua một **foreground service** (thông báo thường trực).
- Mở tab **Connect**.
- Dùng chế độ **Setup Code** hoặc **Manual**.
- Nếu khám phá bị chặn, dùng host/cổng thủ công trong **Advanced controls**. Với host LAN riêng, `ws://` vẫn hoạt động. Với host Tailscale/công khai, bật TLS và dùng endpoint `wss://` / Tailscale Serve.

Sau lần ghép đôi thành công đầu tiên, Android tự động kết nối lại khi khởi chạy:

- Endpoint thủ công (nếu đã bật), nếu không thì
- Gateway được khám phá lần cuối (nỗ lực tối đa).

### Beacon báo còn sống của presence

Sau khi phiên node đã xác thực kết nối, và khi ứng dụng chuyển sang nền trong khi foreground service vẫn đang kết nối, Android gọi `node.event` với `event: "node.presence.alive"`. Gateway ghi nhận thông tin này dưới dạng `lastSeenAtMs`/`lastSeenReason` trong siêu dữ liệu node/thiết bị đã ghép đôi chỉ sau khi danh tính thiết bị node đã xác thực được biết.

Ứng dụng chỉ tính beacon là đã được ghi thành công khi phản hồi gateway bao gồm `handled: true`. Gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó tương thích nhưng không được tính là một cập nhật last-seen bền vững.

### 4) Phê duyệt ghép đôi (CLI)

Trên máy gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Chi tiết ghép đôi: [Ghép đôi](/vi/channels/pairing).

Tùy chọn: nếu node Android luôn kết nối từ một subnet được kiểm soát chặt chẽ, bạn có thể chọn tự động phê duyệt node lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

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

Tính năng này bị tắt theo mặc định. Nó chỉ áp dụng cho ghép đôi `role: node` mới không có scope được yêu cầu. Ghép đôi operator/trình duyệt và mọi thay đổi về vai trò, scope, siêu dữ liệu, hoặc khóa công khai vẫn yêu cầu phê duyệt thủ công.

### 5) Xác minh node đã kết nối

- Qua trạng thái node:

  ```bash
  openclaw nodes status
  ```

- Qua Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + lịch sử

Tab Chat của Android hỗ trợ chọn phiên (mặc định `main`, cùng các phiên hiện có khác):

- Lịch sử: `chat.history` (được chuẩn hóa để hiển thị; các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn) cùng token điều khiển mô hình ASCII/full-width bị rò rỉ đều bị loại bỏ, các hàng assistant chỉ chứa token im lặng như đúng `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder)
- Gửi: `chat.send`
- Cập nhật đẩy (nỗ lực tối đa): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host (khuyến nghị cho nội dung web)

Nếu bạn muốn node hiển thị HTML/CSS/JS thật mà agent có thể chỉnh sửa trên đĩa, hãy trỏ node tới Gateway canvas host.

<Note>
Node tải canvas từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
</Note>

1. Tạo `~/.openclaw/workspace/canvas/index.html` trên host gateway.

2. Điều hướng node tới đó (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (tùy chọn): nếu cả hai thiết bị đều trên Tailscale, dùng tên MagicDNS hoặc IP tailnet thay vì `.local`, ví dụ `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Máy chủ này chèn client live-reload vào HTML và tải lại khi tệp thay đổi.
Host A2UI nằm tại `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Lệnh Canvas (chỉ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (dùng `{"url":""}` hoặc `{"url":"/"}` để quay lại scaffold mặc định). `canvas.snapshot` trả về `{ format, base64 }` (mặc định `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (bí danh legacy `canvas.a2ui.pushJSONL`)

Lệnh camera (chỉ foreground; có cổng quyền):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Xem [Node camera](/vi/nodes/camera) để biết tham số và helper CLI.

### 8) Giọng nói + bề mặt lệnh Android mở rộng

- Tab Voice: Android có hai chế độ ghi âm rõ ràng. **Mic** là một phiên tab Voice thủ công, gửi mỗi quãng dừng thành một lượt chat và dừng khi ứng dụng rời foreground hoặc người dùng rời tab Voice. **Talk** là Talk Mode liên tục và tiếp tục nghe cho đến khi được tắt hoặc node ngắt kết nối.
- Talk Mode nâng cấp foreground service hiện có từ `dataSync` lên `dataSync|microphone` trước khi bắt đầu ghi âm, rồi hạ cấp khi Talk Mode dừng. Android 14+ yêu cầu khai báo `FOREGROUND_SERVICE_MICROPHONE`, quyền runtime `RECORD_AUDIO`, và kiểu dịch vụ microphone tại runtime.
- Phản hồi được đọc dùng `talk.speak` thông qua nhà cung cấp Talk đã cấu hình của gateway. TTS hệ thống cục bộ chỉ được dùng khi `talk.speak` không khả dụng.
- Voice wake vẫn bị tắt trong UX/runtime Android.
- Các nhóm lệnh Android bổ sung (tính khả dụng phụ thuộc vào thiết bị + quyền):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (xem [Chuyển tiếp thông báo](#notification-forwarding) bên dưới)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Điểm vào assistant

Android hỗ trợ khởi chạy OpenClaw từ trình kích hoạt assistant của hệ thống (Google Assistant). Khi được cấu hình, giữ nút home hoặc nói "Hey Google, ask OpenClaw..." sẽ mở ứng dụng và chuyển prompt vào trình soạn chat.

Tính năng này dùng siêu dữ liệu **App Actions** của Android được khai báo trong manifest ứng dụng. Không cần cấu hình thêm ở phía gateway -- intent assistant được ứng dụng Android xử lý hoàn toàn và chuyển tiếp như một tin nhắn chat bình thường.

<Note>
Tính khả dụng của App Actions phụ thuộc vào thiết bị, phiên bản Google Play Services, và việc người dùng đã đặt OpenClaw làm ứng dụng assistant mặc định hay chưa.
</Note>

## Chuyển tiếp thông báo

Android có thể chuyển tiếp thông báo thiết bị tới gateway dưới dạng sự kiện. Một số điều khiển cho phép bạn giới hạn thông báo nào được chuyển tiếp và khi nào.

| Khóa                             | Kiểu           | Mô tả                                                                                              |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Chỉ chuyển tiếp thông báo từ các tên package này. Nếu được đặt, mọi package khác sẽ bị bỏ qua.     |
| `notifications.denyPackages`     | string[]       | Không bao giờ chuyển tiếp thông báo từ các tên package này. Được áp dụng sau `allowPackages`.      |
| `notifications.quietHours.start` | string (HH:mm) | Bắt đầu khung giờ yên lặng (giờ thiết bị cục bộ). Thông báo bị chặn trong khung giờ này.           |
| `notifications.quietHours.end`   | string (HH:mm) | Kết thúc khung giờ yên lặng.                                                                       |
| `notifications.rateLimit`        | number         | Số thông báo được chuyển tiếp tối đa cho mỗi package mỗi phút. Thông báo vượt mức sẽ bị loại bỏ.   |

Bộ chọn thông báo cũng dùng hành vi an toàn hơn cho các sự kiện thông báo được chuyển tiếp, ngăn vô tình chuyển tiếp thông báo hệ thống nhạy cảm.

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
- [Node](/vi/nodes)
- [Khắc phục sự cố node Android](/vi/nodes/troubleshooting)
