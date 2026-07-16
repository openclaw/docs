---
read_when:
    - Ghép nối hoặc kết nối lại Node Android
    - Gỡ lỗi quá trình khám phá hoặc xác thực Gateway trên Android
    - Phản chiếu hoặc điều khiển thiết bị Android từ máy Mac ở xa
    - Xác minh tính nhất quán của lịch sử trò chuyện giữa các ứng dụng khách
summary: 'Ứng dụng Android (node): cẩm nang vận hành kết nối + bề mặt lệnh Kết nối/Trò chuyện/Giọng nói/Canvas'
title: Ứng dụng Android
x-i18n:
    generated_at: "2026-07-16T14:45:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Ứng dụng Android chính thức có trên [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) và dưới dạng APK độc lập đã ký trong các [Bản phát hành GitHub](https://github.com/openclaw/openclaw/releases) được hỗ trợ. Đây là một Node đồng hành và yêu cầu Gateway OpenClaw đang chạy. Mã nguồn: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([hướng dẫn xây dựng](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Tổng quan hỗ trợ

- Vai trò: ứng dụng Node đồng hành (Android không lưu trữ Gateway).
- Yêu cầu Gateway: có (chạy trên macOS, Linux hoặc Windows qua WSL2).
- Cài đặt: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) hoặc `OpenClaw-Android.apk` từ một [Bản phát hành GitHub](https://github.com/openclaw/openclaw/releases) được hỗ trợ, xem [Bắt đầu](/vi/start/getting-started) cho Gateway, sau đó xem [Ghép nối](/vi/channels/pairing).
- Gateway: [Sổ tay vận hành](/vi/gateway) + [Cấu hình](/vi/gateway/configuration).
  - Giao thức: [Giao thức Gateway](/vi/gateway/protocol) (các Node + mặt phẳng điều khiển).

Việc điều khiển hệ thống (launchd/systemd) nằm trên máy chủ Gateway — xem [Gateway](/vi/gateway).

## Cài đặt ngoài Google Play

Các Bản phát hành GitHub chính thức và bản sửa lỗi thông thường bao gồm một `OpenClaw-Android.apk` dùng chung và `OpenClaw-Android-SHA256SUMS.txt`. APK được xây dựng từ thẻ phát hành, ký bằng khóa phát hành Android của OpenClaw và có chứng thực nguồn gốc từ GitHub Actions.

Chọn một [bản phát hành](https://github.com/openclaw/openclaw/releases) liệt kê cả hai tài sản, sau đó tải xuống và xác minh chính xác thẻ đó trước khi cài đặt thủ công:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Bản cài đặt từ Google Play và APK độc lập sử dụng các kênh cập nhật khác nhau và có thể có danh tính chữ ký khác nhau. Android có thể yêu cầu gỡ cài đặt ứng dụng hiện có trước khi chuyển kênh, thao tác này sẽ xóa dữ liệu ứng dụng cục bộ. Hãy duy trì một kênh cho các bản cập nhật thông thường.
</Warning>

## Phản chiếu và điều khiển Android từ máy Mac từ xa

[scrcpy](https://github.com/Genymobile/scrcpy) phản chiếu màn hình Android trong cửa sổ macOS và
chuyển tiếp đầu vào bàn phím cùng con trỏ qua Android Debug Bridge (ADB). Đây là quy trình phía người vận hành,
tách biệt với kết nối Node OpenClaw. Quy trình này hữu ích khi thiết bị Android và
máy Mac ở các vị trí khác nhau nhưng dùng chung một mạng Tailscale riêng tư.

### Trước khi bắt đầu

- Cài đặt Tailscale trên thiết bị Android và máy Mac, rồi kết nối cả hai vào cùng một tailnet.
- Trên Android, bật **Developer options** và **USB debugging**. Android 16 đặt **Wireless
  debugging** trong **Settings > System > Developer options**. Xem [Tùy chọn dành cho nhà phát triển Android
  ](https://developer.android.com/studio/debug/dev-options).
- Cài đặt scrcpy và ADB trên máy Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Giữ thiết bị Android ở trạng thái sẵn dùng cho lần kết nối đầu tiên. Android phải phê duyệt khóa ADB
  của từng máy Mac trước khi máy Mac đó có thể điều khiển thiết bị.

### Bật ADB qua TCP

Để thiết lập ban đầu, kết nối thiết bị Android qua USB với một máy tính đáng tin cậy và phê duyệt
lời nhắc gỡ lỗi. Sau đó chạy:

```bash
adb devices
adb tcpip 5555
```

Bây giờ bạn có thể ngắt kết nối USB. Nếu cổng 5555 ngừng lắng nghe sau khi thiết bị khởi động lại hoặc đặt lại chế độ gỡ lỗi,
hãy lặp lại bước thiết lập cục bộ này. Android 11 trở lên cũng có thể thiết lập độ tin cậy ban đầu bằng
**Wireless debugging > Pair device with pairing code** và `adb pair`.

### Chỉ cho phép máy Mac điều khiển

Các tailnet có quy tắc cấp quyền hạn chế phải cho phép rõ ràng máy Mac điều khiển truy cập cổng TCP 5555
trên thiết bị Android. Thêm một quy tắc có phạm vi hẹp vào chính sách tailnet, thay các địa chỉ ví dụ
bằng IP Tailscale ổn định của hai thiết bị:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Xem [quy tắc cấp quyền Tailscale](https://tailscale.com/docs/reference/syntax/grants) để biết bí danh máy chủ và các
bộ chọn khác. Không cấp quyền truy cập cổng này cho Internet công cộng hoặc đưa nó ra ngoài bằng Funnel: một máy khách ADB
được ủy quyền có quyền kiểm soát rộng đối với thiết bị.

### Kết nối và bắt đầu phản chiếu

Trên máy Mac từ xa:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

Lần `adb connect` đầu tiên từ máy Mac này sẽ hiển thị hộp thoại ủy quyền trên Android. Mở khóa thiết bị,
xác nhận dấu vân tay của khóa và chỉ chọn **Always allow from this computer** khi máy Mac
đáng tin cậy. Mục `adb devices` thành công kết thúc bằng `device`; `unauthorized` có nghĩa là lời nhắc trên thiết bị
chưa được phê duyệt.

Sau khi cửa sổ scrcpy mở, hãy sử dụng trực tiếp hoặc nhắm đến cửa sổ đó bằng một công cụ tự động hóa màn hình macOS như
[Peekaboo](https://peekaboo.sh/). scrcpy truyền màn hình và đầu vào; Tailscale chỉ cung cấp
đường dẫn mạng riêng tư.

### Khắc phục sự cố

- `Connection timed out`: xác minh quy tắc cấp quyền tailnet cho TCP 5555. Một `tailscale ping` thành công chứng minh
  khả năng kết nối ngang hàng, chứ không chứng minh chính sách cho phép cổng TCP này. Kiểm tra bằng
  `nc -vz <android-tailnet-ip> 5555` từ máy Mac.
- `unauthorized`: mở khóa Android và phê duyệt khóa ADB của máy Mac từ xa hoặc xóa máy trạm cũ
  trong **Wireless debugging > Paired devices** rồi ghép nối lại.
- `Connection refused`: kết nối lại cục bộ và chạy lại `adb tcpip 5555`.
- Có nhiều thiết bị được liệt kê: giữ đối số `--serial <android-tailnet-ip>:5555` tường minh.

Khi hoàn tất, đóng scrcpy và ngắt kết nối ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Sổ tay vận hành kết nối

Ứng dụng Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android kết nối trực tiếp với WebSocket của Gateway và sử dụng tính năng ghép nối thiết bị (`role: node`).

Đối với Tailscale hoặc máy chủ công cộng, Android yêu cầu một điểm cuối bảo mật:

- Ưu tiên: Tailscale Serve / Funnel với `https://<magicdns>` / `wss://<magicdns>`
- Cũng hỗ trợ: mọi URL Gateway `wss://` khác có điểm cuối TLS thực
- `ws://` văn bản thuần vẫn được hỗ trợ trên các địa chỉ LAN riêng tư / máy chủ `.local`, cùng với `localhost`, `127.0.0.1` và cầu nối trình giả lập Android (`10.0.2.2`); thiết lập không phải loopback tự động sử dụng quyền truy cập hạn chế của người vận hành

### Điều kiện tiên quyết

- Gateway đang chạy trên máy khác (hoặc có thể truy cập qua SSH).
- Thiết bị/trình giả lập Android có thể truy cập WebSocket của Gateway:
  - Cùng LAN với mDNS/NSD, **hoặc**
  - Cùng tailnet Tailscale bằng Wide-Area Bonjour / DNS-SD đơn hướng (xem bên dưới), **hoặc**
  - Máy chủ/cổng Gateway thủ công (phương án dự phòng)
- Ghép nối qua tailnet/di động công cộng **không** sử dụng các điểm cuối IP tailnet thô `ws://`. Thay vào đó, hãy sử dụng Tailscale Serve hoặc một URL `wss://` khác.
- CLI `openclaw` có sẵn trên máy Gateway (hoặc qua SSH) để phê duyệt yêu cầu ghép nối.

### 1. Khởi động Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Xác nhận trong nhật ký rằng bạn thấy nội dung tương tự:

- `listening on ws://0.0.0.0:18789`

Để truy cập Android từ xa qua Tailscale, ưu tiên Serve/Funnel thay vì liên kết trực tiếp với tailnet:

```bash
openclaw gateway --tailscale serve
```

Cách này cung cấp cho Android một điểm cuối `wss://` / `https://` bảo mật. Thiết lập `gateway.bind: "tailnet"` thuần túy không đủ cho lần ghép nối Android từ xa đầu tiên, trừ khi bạn cũng kết thúc TLS riêng biệt.

### 2. Xác minh phát hiện (tùy chọn)

Từ máy Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Các ghi chú gỡ lỗi khác: [Bonjour](/vi/gateway/bonjour).

Nếu bạn cũng đã cấu hình miền phát hiện diện rộng, hãy so sánh với:

```bash
openclaw gateway discover --json
```

Lệnh này hiển thị `local.` cùng miền diện rộng đã cấu hình trong một lần chạy, sử dụng điểm cuối dịch vụ đã phân giải thay vì chỉ dùng các gợi ý TXT.

#### Phát hiện liên mạng qua DNS-SD đơn hướng

Tính năng phát hiện NSD/mDNS của Android không hoạt động xuyên mạng. Nếu Node Android và Gateway nằm trên các mạng khác nhau nhưng được kết nối qua Tailscale, hãy sử dụng Wide-Area Bonjour / DNS-SD đơn hướng. Chỉ riêng tính năng phát hiện là chưa đủ để ghép nối Android qua tailnet/mạng công cộng — tuyến đường được phát hiện vẫn cần một điểm cuối bảo mật (`wss://` hoặc Tailscale Serve):

1. Thiết lập một vùng DNS-SD (ví dụ `openclaw.internal.`) trên máy chủ Gateway và công bố các bản ghi `_openclaw-gw._tcp`.
2. Cấu hình DNS phân tách của Tailscale cho miền đã chọn, trỏ đến máy chủ DNS đó.

Chi tiết và cấu hình CoreDNS mẫu: [Bonjour](/vi/gateway/bonjour).

### 3. Kết nối từ Android

Trong ứng dụng Android:

- Ứng dụng duy trì kết nối Gateway bằng một **foreground service** (thông báo liên tục).
- Mở thẻ **Connect**.
- Sử dụng chế độ **Setup Code** hoặc **Manual**.
- Nếu tính năng phát hiện bị chặn, hãy sử dụng máy chủ/cổng thủ công trong **Advanced controls**. Đối với máy chủ LAN riêng tư, `ws://` vẫn hoạt động. Đối với máy chủ Tailscale/công cộng, hãy bật TLS và sử dụng điểm cuối `wss://` / Tailscale Serve.

Sau lần ghép nối thành công đầu tiên, Android tự động kết nối lại khi khởi chạy với Gateway đã ghép nối đang hoạt động (theo khả năng tốt nhất đối với các Gateway được phát hiện, vốn phải hiển thị trên mạng).

Mã thiết lập chính thức kết nối Android dưới dạng Node và mặc định cấp toàn quyền truy cập của người vận hành Gateway
qua `wss://`. Thiết lập `ws://` không phải loopback bằng văn bản thuần
tự động sử dụng quyền truy cập hạn chế để bảo vệ token mang. **Settings → Gateway**
hiển thị quyền truy cập **Full** hoặc **Limited**. Đối với kết nối hạn chế, hãy cấu hình
`wss://` hoặc Tailscale Serve, tạo mã toàn quyền truy cập mới trong Control UI hoặc
bằng `openclaw qr`, sau đó quét hoặc dán mã đó trên trang này và kết nối lại. Người vận hành
muốn dùng hồ sơ hạn chế có thể chọn **Limited access** trong Control UI hoặc chạy
`openclaw qr --limited`.

### Nhiều Gateway

Ứng dụng lưu một sổ đăng ký của mọi Gateway đã ghép nối, vì vậy bạn có thể chuyển đổi giữa chúng mà không cần ghép nối lại:

- **Settings -> Gateways** liệt kê các Gateway đã ghép nối và đánh dấu Gateway đang hoạt động. Nhấn vào một mục để chuyển đổi; ứng dụng đóng các phiên hiện tại và kết nối lại với Gateway đã chọn.
- Thẻ **Connect** hiển thị bộ chuyển đổi nhanh khi có nhiều hơn một Gateway được ghép nối.
- Thông tin xác thực, token thiết bị, độ tin cậy TLS, lịch sử trò chuyện và tin nhắn ngoại tuyến đang chờ được lưu riêng cho từng Gateway. Việc chuyển đổi không bao giờ trộn lẫn trạng thái giữa các Gateway và các tin nhắn được xếp hàng khi ngoại tuyến chỉ được gửi đến Gateway mà chúng được tạo cho.
- **Forget** xóa mục đăng ký của Gateway cùng với thông tin xác thực, token thiết bị, ghim TLS và các cuộc trò chuyện đã lưu vào bộ nhớ đệm.

### Beacon duy trì hiện diện

Sau khi phiên Node đã xác thực kết nối và khi ứng dụng chuyển sang chạy nền trong lúc foreground service vẫn kết nối, Android gọi `node.event` với `event: "node.presence.alive"`. Gateway chỉ ghi nhận điều này dưới dạng `lastSeenAtMs`/`lastSeenReason` trong siêu dữ liệu của Node/thiết bị đã ghép nối sau khi biết danh tính thiết bị Node đã xác thực.

Ứng dụng chỉ tính beacon là được ghi nhận thành công khi phản hồi của Gateway bao gồm `handled: true`. Các Gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó tương thích nhưng không được tính là một lần cập nhật thời điểm nhìn thấy gần nhất lâu dài.

### 4. Phê duyệt ghép nối (CLI)

Trên máy Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Chi tiết ghép nối: [Ghép nối](/vi/channels/pairing).

Tùy chọn: nếu Node Android luôn kết nối từ một mạng con được kiểm soát chặt chẽ, bạn có thể chọn tự động phê duyệt Node trong lần đầu bằng các CIDR rõ ràng hoặc địa chỉ IP chính xác:

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

Tính năng này bị tắt theo mặc định. Tính năng chỉ áp dụng cho lần ghép nối `role: node` mới, không yêu cầu phạm vi nào. Việc ghép nối của người vận hành/trình duyệt và mọi thay đổi về vai trò, phạm vi, siêu dữ liệu hoặc khóa công khai vẫn cần được phê duyệt thủ công.

### 5. Xác minh Node đã kết nối

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Trò chuyện + lịch sử

Thẻ Chat trên Android hỗ trợ chọn phiên (mặc định là `main`, cùng các phiên hiện có khác):

- Lịch sử: `chat.history` (được chuẩn hóa để hiển thị — các thẻ chỉ thị nội tuyến, payload XML dạng văn bản thuần của lệnh gọi công cụ (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` và các biến thể bị cắt ngắn), cũng như các token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ đều bị loại bỏ; các hàng của trợ lý chỉ chứa token im lặng như chính xác `NO_REPLY` / `no_reply` sẽ bị bỏ qua; các hàng quá lớn có thể được thay bằng phần giữ chỗ)
- Gửi: `chat.send`
- Gửi bền vững: mọi lần gửi (văn bản, hình ảnh đã chọn và ghi chú thoại) đều được ghi nhật ký vào hộp thư đi trên thiết bị theo từng Gateway trước bất kỳ lần thử kết nối mạng nào, vì vậy việc ứng dụng bị chấm dứt không thể làm mất dữ liệu đầu vào đã gửi. Các nội dung gửi được xếp hàng khi ngoại tuyến sẽ được chuyển theo thứ tự sau khi kết nối lại, với khóa đảm bảo tính lũy đẳng ổn định; một nội dung gửi chỉ được loại khỏi hàng đợi sau khi lượt đó hiển thị trong `chat.history` chính tắc — chỉ riêng xác nhận không được xem là bằng chứng đã chuyển thành công. Các kết quả không rõ ràng (mất xác nhận, ứng dụng bị đóng giữa lúc gửi, Gateway khởi động lại trước khi ghi bản chép lời) hiển thị thành các hàng dễ thấy với tùy chọn **Thử lại**/**Xóa** rõ ràng thay vì tự động gửi lại. Các lệnh gạch chéo không bao giờ tự động phát lại sau khi kết nối lại; chúng được giữ lại để người dùng chủ động thử lại. Hàng đợi có giới hạn (50 tin nhắn và 48 MB dữ liệu tệp đính kèm trên mỗi Gateway), còn các hàng chưa gửi sẽ hết hạn sau 48 giờ. Các bản nháp trong trình soạn thảo chưa từng được gửi không được duy trì bền vững qua vòng đời tiến trình.
- Cập nhật đẩy (nỗ lực tối đa): `chat.subscribe` -> `event:"chat"`
- Nghe: nhấn giữ một tin nhắn của trợ lý và chọn **Nghe** để nghe nội dung; âm thanh được kết xuất qua `tts.speak` của Gateway bằng chuỗi nhà cung cấp TTS đã cấu hình, đồng thời TTS hệ thống trên thiết bị được sử dụng khi Gateway không thể kết xuất âm thanh. Việc phát sẽ dừng khi chuyển phiên, bắt đầu cuộc trò chuyện mới, đưa ứng dụng xuống nền hoặc đóng cuộc trò chuyện.

### 7. Canvas + camera

#### Máy chủ Canvas của Gateway (khuyên dùng cho nội dung web)

Để Node hiển thị HTML/CSS/JS thực mà tác nhân có thể chỉnh sửa trên ổ đĩa, hãy trỏ Node đến máy chủ Canvas của Gateway.

<Note>
Các Node tải Canvas từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định là `18789`).
</Note>

1. Tạo `~/.openclaw/workspace/canvas/index.html` trên máy chủ Gateway.
2. Điều hướng Node đến đó (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (tùy chọn): nếu cả hai thiết bị đều dùng Tailscale, hãy sử dụng tên MagicDNS hoặc IP tailnet thay cho `.local`, ví dụ: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Máy chủ này chèn một máy khách tải lại trực tiếp vào HTML và tải lại khi tệp thay đổi. Gateway cũng phục vụ `/__openclaw__/a2ui/`, nhưng ứng dụng Android coi các trang A2UI từ xa là chỉ để kết xuất. Các lệnh A2UI có khả năng thực hiện hành động sử dụng trang A2UI đi kèm do ứng dụng sở hữu.

Các lệnh Canvas (chỉ khi ở tiền cảnh):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (sử dụng `{"url":""}` hoặc `{"url":"/"}` để quay lại khung mặc định). `canvas.snapshot` trả về `{ format, base64 }` (mặc định là `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (bí danh cũ `canvas.a2ui.pushJSONL`). Các lệnh này sử dụng trang A2UI đi kèm do ứng dụng sở hữu để kết xuất có khả năng thực hiện hành động.

Các lệnh camera (chỉ khi ở tiền cảnh; bị kiểm soát bằng quyền): `camera.snap` (jpg), `camera.clip` (mp4). Xem [Node camera](/vi/nodes/camera) để biết các tham số và trình trợ giúp CLI.

### 8. Giọng nói + bề mặt lệnh Android mở rộng

- Thẻ Voice: Android có hai chế độ thu âm rõ ràng. **Mic** là một phiên thủ công trên thẻ Voice, gửi mỗi khoảng dừng thành một lượt trò chuyện và dừng khi ứng dụng rời tiền cảnh hoặc người dùng rời thẻ Voice. **Talk** là Chế độ Talk liên tục và tiếp tục lắng nghe cho đến khi bị tắt hoặc Node ngắt kết nối.
- Chế độ Talk nâng cấp dịch vụ tiền cảnh hiện có từ `connectedDevice` lên `connectedDevice|microphone` trước khi bắt đầu thu âm, sau đó hạ cấp dịch vụ khi Chế độ Talk dừng. Dịch vụ Node khai báo `FOREGROUND_SERVICE_CONNECTED_DEVICE` với `CHANGE_NETWORK_STATE`; Android 14+ cũng yêu cầu khai báo `FOREGROUND_SERVICE_MICROPHONE`, cấp quyền khi chạy `RECORD_AUDIO` và loại dịch vụ micrô khi chạy.
- Theo mặc định, Android Talk sử dụng tính năng nhận dạng giọng nói gốc, trò chuyện qua Gateway và `talk.speak` thông qua nhà cung cấp Talk đã cấu hình của Gateway. TTS hệ thống cục bộ chỉ được sử dụng khi `talk.speak` không khả dụng.
- Android Talk chỉ sử dụng chuyển tiếp Gateway theo thời gian thực khi `talk.realtime.mode` là `realtime` và `talk.realtime.transport` là `gateway-relay`.
- Android không quảng bá khả năng `voiceWake`. Sử dụng **Mic** hoặc **Talk** để nhập bằng giọng nói.
- Các nhóm lệnh Android bổ sung (tính khả dụng phụ thuộc vào thiết bị, quyền và cài đặt của người dùng):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` chỉ khi **Settings > Phone Capabilities > Installed Apps** được bật; theo mặc định, lệnh này liệt kê các ứng dụng hiển thị trong trình khởi chạy (truyền `includeNonLaunchable` để lấy danh sách đầy đủ).
  - `notifications.list`, `notifications.actions` (xem [Chuyển tiếp thông báo](#notification-forwarding) bên dưới)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Tệp trong không gian làm việc (chỉ đọc)

Phần tổng quan Trang chủ có một thẻ **Tệp** để duyệt không gian làm việc của tác nhân đang hoạt động thông qua các RPC Gateway chỉ đọc `agents.workspace.list` / `agents.workspace.get`: đi sâu vào thư mục, xem trước văn bản và hình ảnh, cũng như xuất qua bảng chia sẻ của Android. Không có thao tác ghi và kích thước bản xem trước bị Gateway giới hạn.

## Xem xét phê duyệt lệnh

Một kết nối người vận hành với `operator.admin`, hoặc một kết nối
`operator.approvals` đã ghép nối được Gateway chỉ định rõ ràng, có thể xem xét
các yêu cầu thực thi đang chờ trong **Settings -> Approvals**. Ứng dụng tải
bản ghi phê duyệt đã được làm sạch của Gateway trước khi bật các nút, hiển thị
mọi cảnh báo bảo mật và chính xác các quyết định mà yêu cầu đó cung cấp, rồi gửi
ID phê duyệt và loại chủ sở hữu trở lại Gateway.

Trạng thái phê duyệt được chia sẻ với Giao diện điều khiển và các bề mặt trò chuyện được hỗ trợ. Câu trả lời được xác nhận đầu tiên sẽ có hiệu lực; Android hiển thị kết quả chính tắc đó ngay cả khi một bề mặt khác đã trả lời trước. Nếu phản hồi giải quyết bị mất hoặc Gateway ngắt kết nối, ứng dụng giữ hành động ở trạng thái khóa và đọc lại phê duyệt trước khi đưa ra một quyết định khác.

Các Gateway có trước những phương thức phê duyệt hợp nhất sẽ dự phòng về các phương thức dành riêng cho thao tác thực thi đã phát hành. Việc xem xét đang chờ vẫn hoạt động, nhưng trạng thái thiết bị đầu cuối được duy trì và kết quả phong phú hơn trên nhiều bề mặt yêu cầu Gateway đã cập nhật.

## Điểm khởi chạy trợ lý

Android hỗ trợ khởi chạy OpenClaw từ trình kích hoạt trợ lý hệ thống (Google Assistant). Nhấn giữ nút trang chủ (hoặc một trình kích hoạt `ACTION_ASSIST` khác) sẽ mở ứng dụng; nói "Hey Google, ask OpenClaw `<prompt>`" sẽ khớp với mẫu truy vấn App Actions mà ứng dụng khai báo và chuyển lời nhắc vào trình soạn thảo trò chuyện mà không tự động gửi.

Tính năng này sử dụng **App Actions** của Android (khả năng `shortcuts.xml`) được khai báo trong tệp kê khai ứng dụng. Không cần cấu hình phía Gateway — ý định của trợ lý được ứng dụng Android xử lý hoàn toàn.

<Note>
Tính khả dụng của App Actions phụ thuộc vào thiết bị, phiên bản Google Play Services và việc người dùng đã đặt OpenClaw làm ứng dụng trợ lý mặc định hay chưa.
</Note>

## Chuyển tiếp thông báo

Android có thể chuyển tiếp thông báo của thiết bị đến Gateway dưới dạng các mục `node.event`. Tính năng này được cấu hình **trên thiết bị**, trong trang Cài đặt của ứng dụng — không phải trong cấu hình Gateway/`openclaw.json`.

| Cài đặt                     | Mô tả                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Forward Notification Events | Công tắc chính. Tắt theo mặc định; trước tiên phải cấp quyền Notification Listener Access.                                                                                                              |
| Package Filter              | **Allowlist** (chỉ chuyển tiếp các ID gói được liệt kê) hoặc **Blocklist** (mặc định: tất cả các gói ngoại trừ các ID được liệt kê). Gói của chính OpenClaw luôn bị loại trừ trong chế độ Blocklist để ngăn vòng lặp chuyển tiếp. |
| Quiet Hours                 | Khoảng thời gian bắt đầu/kết thúc cục bộ theo định dạng HH:mm, trong đó việc chuyển tiếp bị chặn. Tắt theo mặc định; sau khi bật, giá trị mặc định là `22:00`-`07:00`.                                                                                |
| Max Events / Minute         | Giới hạn tốc độ thông báo được chuyển tiếp trên mỗi thiết bị. Mặc định là 20.                                                                                                                                          |
| Route Session Key           | Tùy chọn. Ghim các sự kiện thông báo được chuyển tiếp vào một phiên cụ thể thay vì tuyến thông báo mặc định của thiết bị.                                                                               |

<Note>
Chuyển tiếp thông báo yêu cầu quyền Notification Listener của Android. Ứng dụng sẽ nhắc cấp quyền này trong quá trình thiết lập.
</Note>

Thông báo của WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord và Signal luôn bị loại trừ. Tin nhắn của chúng đã thuộc quyền quản lý của các phiên kênh OpenClaw gốc; việc chuyển tiếp thông báo Android dưới dạng một sự kiện Node riêng biệt có thể định tuyến câu trả lời qua sai cuộc trò chuyện.

## Liên quan

- [Ứng dụng iOS](/vi/platforms/ios)
- [Các Node](/vi/nodes)
- [Khắc phục sự cố Node Android](/vi/nodes/troubleshooting)
