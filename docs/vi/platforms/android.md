---
read_when:
    - Ghép nối hoặc kết nối lại Node Android
    - Gỡ lỗi việc khám phá hoặc xác thực Gateway trên Android
    - Phản chiếu hoặc điều khiển thiết bị Android từ máy Mac từ xa
    - Xác minh tính nhất quán của lịch sử trò chuyện giữa các ứng dụng khách
summary: 'Ứng dụng Android (node): hướng dẫn vận hành kết nối + bề mặt lệnh Kết nối/Trò chuyện/Giọng nói/Canvas'
title: Ứng dụng Android
x-i18n:
    generated_at: "2026-07-19T06:01:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a505b449c140eee63d3e587df82c8730f1e076570f00f2e0c699b0f967b1f7f8
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Ứng dụng Android chính thức hiện có trên [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) và dưới dạng APK độc lập có chữ ký trong các [Bản phát hành GitHub](https://github.com/openclaw/openclaw/releases) được hỗ trợ. Đây là một node đồng hành và yêu cầu Gateway OpenClaw đang chạy. Mã nguồn: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([hướng dẫn build](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Tổng quan hỗ trợ

- Vai trò: ứng dụng node đồng hành (Android không lưu trữ Gateway).
- Yêu cầu Gateway: có (chạy trên macOS, Linux hoặc Windows qua WSL2).
- Cài đặt: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) hoặc `OpenClaw-Android.apk` từ một [Bản phát hành GitHub](https://github.com/openclaw/openclaw/releases) được hỗ trợ, xem [Bắt đầu](/vi/start/getting-started) cho Gateway, sau đó xem [Ghép nối](/vi/channels/pairing).
- Gateway: [Runbook](/vi/gateway) + [Cấu hình](/vi/gateway/configuration).
  - Giao thức: [Giao thức Gateway](/vi/gateway/protocol) (các node + mặt phẳng điều khiển).

Điều khiển hệ thống (launchd/systemd) nằm trên máy chủ Gateway — xem [Gateway](/vi/gateway).

## Ứng dụng đồng hành Wear OS

Ứng dụng đồng hành Wear OS sử dụng kết nối Gateway đã xác thực của điện thoại Android được ghép nối; đồng hồ không bao giờ nhận hoặc lưu trữ thông tin xác thực Gateway. Ứng dụng có thể chọn tác nhân và phiên, đọc bản chép lời có giới hạn, gửi văn bản hoặc câu trả lời được đọc chính tả, hủy một lượt chạy đang hoạt động, bắt đầu Talk theo thời gian thực trong phiên đã chọn và kết nối hoặc ngắt kết nối Gateway của điện thoại được ghép nối. Ứng dụng cũng cung cấp thông báo trả lời cục bộ, giao diện tối hoặc sáng và tùy chọn tự động đọc câu trả lời. Các chế độ điều khiển tác nhân và Gateway được thương lượng theo khả năng để hỗ trợ việc cập nhật điện thoại/đồng hồ không đồng thời. Talk theo thời gian thực truyền phát âm thanh micrô và âm thanh phát lại qua một kênh Wear OS Data Layer tạm thời, đồng thời dừng khi mất kết nối với điện thoại đã chọn, Gateway hoặc kênh âm thanh.

## Cài đặt ngoài Google Play

Các Bản phát hành GitHub chính thức và bản sửa lỗi thông thường bao gồm một `OpenClaw-Android.apk` phổ quát và `OpenClaw-Android-SHA256SUMS.txt`. APK được build từ thẻ phát hành, ký bằng khóa phát hành Android của OpenClaw và mang thông tin nguồn gốc từ GitHub Actions.

Chọn một [bản phát hành](https://github.com/openclaw/openclaw/releases) có liệt kê cả hai tài sản, sau đó tải xuống và xác minh chính xác thẻ đó trước khi cài đặt ngoài:

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
Các bản cài đặt từ Google Play và APK độc lập sử dụng các kênh cập nhật khác nhau và có thể có danh tính ký khác nhau. Android có thể yêu cầu gỡ cài đặt ứng dụng hiện có trước khi chuyển kênh, thao tác này sẽ xóa dữ liệu cục bộ của ứng dụng. Hãy duy trì một kênh cho các bản cập nhật thông thường.
</Warning>

## Phản chiếu và điều khiển Android từ máy Mac từ xa

[scrcpy](https://github.com/Genymobile/scrcpy) phản chiếu màn hình Android trong một cửa sổ macOS và
chuyển tiếp đầu vào bàn phím và con trỏ qua Android Debug Bridge (ADB). Đây là quy trình phía người vận hành,
tách biệt với kết nối node OpenClaw. Quy trình này hữu ích khi thiết bị Android và
máy Mac ở các vị trí khác nhau nhưng dùng chung một mạng Tailscale riêng tư.

### Trước khi bắt đầu

- Cài đặt Tailscale trên thiết bị Android và máy Mac, đồng thời kết nối cả hai vào cùng một tailnet.
- Trên Android, bật **Developer options** và **USB debugging**. Android 16 đặt **Wireless
  debugging** trong **Settings > System > Developer options**. Xem [Tùy chọn dành cho nhà phát triển Android
  ](https://developer.android.com/studio/debug/dev-options).
- Cài đặt scrcpy và ADB trên máy Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Đảm bảo thiết bị Android khả dụng cho lần kết nối đầu tiên. Android phải phê duyệt khóa ADB
  của từng máy Mac trước khi máy Mac đó có thể điều khiển thiết bị.

### Bật ADB qua TCP

Để thiết lập ban đầu, kết nối thiết bị Android bằng USB với một máy tính đáng tin cậy và phê duyệt
lời nhắc gỡ lỗi. Sau đó chạy:

```bash
adb devices
adb tcpip 5555
```

Giờ đây bạn có thể ngắt kết nối USB. Nếu cổng 5555 ngừng lắng nghe sau khi thiết bị khởi động lại hoặc thiết lập gỡ lỗi được đặt lại,
hãy lặp lại bước thiết lập cục bộ này. Android 11 trở lên cũng có thể thiết lập độ tin cậy ban đầu bằng
**Wireless debugging > Pair device with pairing code** và `adb pair`.

### Chỉ cho phép máy Mac điều khiển

Các tailnet có quyền cấp hạn chế phải cho phép rõ ràng máy Mac điều khiển truy cập cổng TCP 5555
trên thiết bị Android. Thêm một quy tắc hẹp vào chính sách tailnet, thay các địa chỉ ví dụ
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

Xem [quyền cấp Tailscale](https://tailscale.com/docs/reference/syntax/grants) để biết bí danh máy chủ và các
bộ chọn khác. Không cấp quyền truy cập cổng này từ internet công cộng hoặc để lộ cổng bằng Funnel: một máy khách ADB
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
đáng tin cậy. Mục `adb devices` thành công kết thúc bằng `device`; `unauthorized` nghĩa là lời nhắc trên thiết bị
chưa được phê duyệt.

Sau khi cửa sổ scrcpy mở, hãy sử dụng trực tiếp hoặc nhắm đến cửa sổ đó bằng một công cụ tự động hóa màn hình macOS như
[Peekaboo](https://peekaboo.sh/). scrcpy truyền màn hình và đầu vào; Tailscale chỉ cung cấp
đường dẫn mạng riêng tư.

### Khắc phục sự cố

- `Connection timed out`: xác minh quyền cấp tailnet cho TCP 5555. Một `tailscale ping` thành công chứng minh
  khả năng kết nối ngang hàng, không chứng minh rằng chính sách cho phép cổng TCP này. Kiểm tra bằng
  `nc -vz <android-tailnet-ip> 5555` từ máy Mac.
- `unauthorized`: mở khóa Android và phê duyệt khóa ADB của máy Mac từ xa hoặc xóa máy trạm cũ
  trong **Wireless debugging > Paired devices** rồi ghép nối lại.
- `Connection refused`: kết nối lại cục bộ và chạy lại `adb tcpip 5555`.
- Có nhiều thiết bị được liệt kê: giữ đối số `--serial <android-tailnet-ip>:5555` tường minh.

Khi hoàn tất, đóng scrcpy và ngắt kết nối ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Runbook kết nối

Ứng dụng node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android kết nối trực tiếp với WebSocket của Gateway và sử dụng ghép nối thiết bị (`role: node`).

Đối với Tailscale hoặc máy chủ công khai, Android yêu cầu một điểm cuối bảo mật:

- Ưu tiên: Tailscale Serve / Funnel với `https://<magicdns>` / `wss://<magicdns>`
- Cũng được hỗ trợ: bất kỳ URL Gateway `wss://` nào khác có điểm cuối TLS thực
- `ws://` dạng văn bản thuần vẫn được hỗ trợ trên các địa chỉ LAN riêng tư / máy chủ `.local`, cùng với `localhost`, `127.0.0.1` và cầu nối trình giả lập Android (`10.0.2.2`); thiết lập không phải loopback tự động sử dụng quyền truy cập người vận hành hạn chế

### Điều kiện tiên quyết

- Gateway đang chạy trên một máy khác (hoặc có thể truy cập qua SSH).
- Thiết bị/trình giả lập Android có thể truy cập WebSocket của Gateway:
  - Cùng mạng LAN với mDNS/NSD, **hoặc**
  - Cùng tailnet Tailscale sử dụng Wide-Area Bonjour / DNS-SD đơn hướng (xem bên dưới), **hoặc**
  - Máy chủ/cổng Gateway thủ công (phương án dự phòng)
- Ghép nối trên tailnet/thiết bị di động công khai **không** sử dụng các điểm cuối IP tailnet `ws://` thô. Thay vào đó, hãy sử dụng Tailscale Serve hoặc một URL `wss://` khác.
- CLI `openclaw` có sẵn trên máy Gateway (hoặc qua SSH) để phê duyệt yêu cầu ghép nối.

### 1. Khởi động Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Xác nhận trong nhật ký rằng bạn thấy nội dung tương tự:

- `listening on ws://0.0.0.0:18789`

Để truy cập Android từ xa qua Tailscale, ưu tiên Serve/Funnel thay vì liên kết tailnet thô:

```bash
openclaw gateway --tailscale serve
```

Thao tác này cung cấp cho Android một điểm cuối `wss://` / `https://` bảo mật. Chỉ thiết lập `gateway.bind: "tailnet"` là không đủ để ghép nối Android từ xa lần đầu, trừ khi bạn cũng kết thúc TLS riêng biệt.

### 2. Xác minh khả năng khám phá (không bắt buộc)

Từ máy Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Xem thêm ghi chú gỡ lỗi: [Bonjour](/vi/gateway/bonjour).

Nếu bạn cũng đã cấu hình miền khám phá diện rộng, hãy so sánh với:

```bash
openclaw gateway discover --json
```

Lệnh này hiển thị `local.` cùng miền diện rộng đã cấu hình trong một lần chạy, sử dụng điểm cuối dịch vụ đã phân giải thay vì các gợi ý chỉ có TXT.

#### Khám phá xuyên mạng qua DNS-SD đơn hướng

Khả năng khám phá NSD/mDNS của Android không hoạt động xuyên mạng. Nếu node Android và Gateway nằm trên các mạng khác nhau nhưng được kết nối qua Tailscale, hãy sử dụng Wide-Area Bonjour / DNS-SD đơn hướng. Chỉ khám phá thôi là chưa đủ để ghép nối Android qua tailnet/công khai — tuyến đường được khám phá vẫn cần một điểm cuối bảo mật (`wss://` hoặc Tailscale Serve):

1. Thiết lập vùng DNS-SD (ví dụ `openclaw.internal.`) trên máy chủ Gateway và công bố các bản ghi `_openclaw-gw._tcp`.
2. Cấu hình DNS phân tách của Tailscale cho miền đã chọn, trỏ đến máy chủ DNS đó.

Chi tiết và cấu hình CoreDNS mẫu: [Bonjour](/vi/gateway/bonjour).

### 3. Kết nối từ Android

Trong ứng dụng Android:

- Ứng dụng duy trì kết nối Gateway thông qua một **foreground service** (thông báo thường trực).
- Mở thẻ **Connect**.
- Sử dụng chế độ **Setup Code** hoặc **Manual**.
- Nếu khả năng khám phá bị chặn, hãy sử dụng máy chủ/cổng thủ công trong **Advanced controls**. Đối với máy chủ LAN riêng tư, `ws://` vẫn hoạt động. Đối với máy chủ Tailscale/công khai, hãy bật TLS và sử dụng điểm cuối `wss://` / Tailscale Serve.

Sau lần ghép nối thành công đầu tiên, Android tự động kết nối lại khi khởi chạy với Gateway đã ghép nối đang hoạt động (nỗ lực tối đa đối với các Gateway được khám phá, vốn phải hiển thị trên mạng).

Theo mặc định, mã thiết lập chính thức kết nối Android dưới dạng node và cấp toàn quyền truy cập người vận hành Gateway
qua `wss://`. Thiết lập `ws://` không phải loopback ở dạng văn bản thuần
tự động sử dụng quyền truy cập hạn chế để bảo vệ bearer token. **Settings → Gateway**
hiển thị quyền truy cập **Full** hoặc **Limited**. Đối với kết nối hạn chế, hãy cấu hình
`wss://` hoặc Tailscale Serve, tạo mã toàn quyền truy cập mới trong Control UI hoặc
bằng `openclaw qr`, sau đó quét hoặc dán mã trên trang đó và kết nối lại. Người vận hành
muốn dùng hồ sơ hạn chế có thể chọn **Limited access** trong Control UI hoặc chạy
`openclaw qr --limited`.

### Nhiều Gateway

Ứng dụng duy trì sổ đăng ký của mọi Gateway đã ghép nối, vì vậy bạn có thể chuyển đổi giữa chúng mà không cần ghép nối lại:

- **Settings -> Gateways** liệt kê các Gateway đã ghép đôi và đánh dấu Gateway đang hoạt động. Chạm vào một mục để chuyển đổi; ứng dụng sẽ ngắt các phiên hiện tại và kết nối lại với Gateway đã chọn.
- Tab **Connect** hiển thị trình chuyển đổi nhanh khi có nhiều hơn một Gateway được ghép đôi.
- Thông tin xác thực, token thiết bị, độ tin cậy TLS, lịch sử trò chuyện và tin nhắn ngoại tuyến đang chờ được lưu riêng cho từng Gateway. Việc chuyển đổi không bao giờ trộn lẫn trạng thái giữa các Gateway, và tin nhắn được xếp hàng khi ngoại tuyến chỉ được gửi đến Gateway đích ban đầu.
- **Forget** xóa mục đăng ký của Gateway cùng với thông tin xác thực, token thiết bị, mã ghim TLS và các cuộc trò chuyện đã lưu đệm.

### Beacon duy trì trạng thái hiện diện

Sau khi phiên Node đã xác thực kết nối, và khi ứng dụng chuyển sang nền trong lúc dịch vụ tiền cảnh vẫn được kết nối, Android gọi `node.event` với `event: "node.presence.alive"`. Gateway chỉ ghi nhận sự kiện này dưới dạng `lastSeenAtMs`/`lastSeenReason` trong siêu dữ liệu của Node/thiết bị đã ghép đôi sau khi xác định được danh tính thiết bị Node đã xác thực.

Ứng dụng chỉ tính beacon là đã được ghi nhận thành công khi phản hồi của Gateway chứa `handled: true`. Các Gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó tương thích nhưng không được tính là một bản cập nhật thời điểm nhìn thấy gần nhất có tính bền vững.

### 4. Phê duyệt ghép đôi (CLI)

Trên máy chạy Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Chi tiết ghép đôi: [Ghép đôi](/vi/channels/pairing).

Tùy chọn: nếu Node Android luôn kết nối từ một mạng con được kiểm soát chặt chẽ, bạn có thể chọn tự động phê duyệt lần ghép đôi Node đầu tiên bằng các CIDR hoặc địa chỉ IP chính xác:

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

Tính năng này bị tắt theo mặc định. Tính năng chỉ áp dụng cho lần ghép đôi `role: node` mới, không yêu cầu phạm vi nào. Ghép đôi qua trình vận hành/trình duyệt và mọi thay đổi về vai trò, phạm vi, siêu dữ liệu hoặc khóa công khai vẫn cần được phê duyệt thủ công.

### 5. Xác minh Node đã kết nối

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Trò chuyện + lịch sử

Tab Chat trên Android hỗ trợ chọn phiên (mặc định là `main`, cùng với các phiên hiện có khác):

- Lịch sử: `chat.history` (được chuẩn hóa để hiển thị — các thẻ chỉ thị nội dòng, payload XML dạng văn bản thuần của lệnh gọi công cụ (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` và các biến thể bị cắt ngắn), cũng như các token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ sẽ bị loại bỏ; các hàng của trợ lý chỉ chứa token im lặng, chẳng hạn chính xác `NO_REPLY` / `no_reply`, sẽ bị bỏ qua; các hàng quá lớn có thể được thay bằng phần giữ chỗ)
- Gửi: `chat.send`
- Gửi bền vững: mọi lượt gửi (văn bản, hình ảnh đã chọn và ghi chú thoại) đều được ghi vào hộp thư đi trên thiết bị dành riêng cho từng Gateway trước bất kỳ lần thử kết nối mạng nào, vì vậy việc ứng dụng bị chấm dứt không thể làm mất nội dung đã gửi. Các lượt gửi được xếp hàng khi ngoại tuyến sẽ được chuyển theo thứ tự khi kết nối lại với khóa idempotency ổn định, và một lượt gửi chỉ được loại khỏi hàng đợi sau khi lượt đó hiển thị trong `chat.history` chuẩn — chỉ một xác nhận không được coi là bằng chứng đã chuyển thành công. Các kết quả không rõ ràng (mất xác nhận, ứng dụng bị đóng giữa lúc gửi, Gateway khởi động lại trước khi ghi bản ghi hội thoại) được hiển thị dưới dạng các hàng với tùy chọn **Thử lại**/**Xóa** rõ ràng thay vì tự động gửi lại. Các lệnh gạch chéo không bao giờ tự động phát lại sau khi kết nối lại; chúng được giữ lại để người dùng chủ động thử lại. Hàng đợi có giới hạn (50 tin nhắn và 48 MB dữ liệu tệp đính kèm cho mỗi Gateway), còn các hàng chưa gửi sẽ hết hạn sau 48 giờ. Bản nháp trong trình soạn thảo chưa từng được gửi không được duy trì bền vững qua vòng đời tiến trình.
- Cập nhật đẩy (nỗ lực tối đa): `chat.subscribe` -> `event:"chat"`
- Nghe: nhấn giữ một tin nhắn của trợ lý và chọn **Nghe** để phát âm thanh; âm thanh được kết xuất qua `tts.speak` của Gateway bằng chuỗi nhà cung cấp TTS đã cấu hình, và TTS hệ thống trên thiết bị được dùng khi Gateway không thể kết xuất âm thanh. Việc phát dừng khi chuyển phiên, bắt đầu cuộc trò chuyện mới, đưa ứng dụng xuống nền hoặc đóng cuộc trò chuyện.

### 7. Canvas + camera

#### Máy chủ Canvas của Gateway (được khuyến nghị cho nội dung web)

Để Node hiển thị HTML/CSS/JS thực mà tác tử có thể chỉnh sửa trên đĩa, hãy trỏ Node đến máy chủ Canvas của Gateway.

<Note>
Các Node tải Canvas từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định là `18789`).
</Note>

1. Tạo `~/.openclaw/workspace/canvas/index.html` trên máy chủ Gateway.
2. Điều hướng Node đến đó (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (tùy chọn): nếu cả hai thiết bị đều dùng Tailscale, hãy sử dụng tên MagicDNS hoặc IP tailnet thay cho `.local`, ví dụ `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Máy chủ này chèn một máy khách tải lại trực tiếp vào HTML và tải lại khi tệp thay đổi. Gateway cũng phục vụ `/__openclaw__/a2ui/`, nhưng ứng dụng Android xem các trang A2UI từ xa là chỉ để kết xuất. Các lệnh A2UI có khả năng thực hiện hành động sử dụng trang A2UI tích hợp sẵn do ứng dụng sở hữu.

Các lệnh Canvas (chỉ ở tiền cảnh):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (sử dụng `{"url":""}` hoặc `{"url":"/"}` để quay lại khung mặc định). `canvas.snapshot` trả về `{ format, base64 }` (mặc định là `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (bí danh cũ `canvas.a2ui.pushJSONL`). Các lệnh này sử dụng trang A2UI tích hợp sẵn do ứng dụng sở hữu để kết xuất có khả năng thực hiện hành động.

Các lệnh camera (chỉ ở tiền cảnh; cần quyền): `camera.snap` (jpg), `camera.clip` (mp4). Xem [Node camera](/vi/nodes/camera) để biết các tham số và trình hỗ trợ CLI.

### 8. Giọng nói + bề mặt lệnh Android mở rộng

- Thanh điều hướng chính của Android gồm **Trang chủ**, **Trò chuyện** và **Cài đặt**. Tính năng nhập liệu bằng giọng nói
  nằm trong trình soạn thảo Chat; không có tab Voice riêng.
- Chạm vào micrô của trình soạn thảo để nhận dạng giọng nói trên thiết bị và chèn
  bản ghi lời nói vào bản nháp. Nhấn giữ micrô để ghi một tệp đính kèm
  ghi chú thoại. Giao diện người dùng thông báo khi tính năng nhận dạng không khả dụng, thiếu quyền,
  gặp lỗi bận/mạng hoặc không phát hiện lời nói, thay vì âm thầm bỏ qua
  lần thử.
- Bắt đầu **Talk** liên tục từ dạng sóng trong Chat. Đọc chính tả, ghi
  ghi chú thoại và Talk là các luồng sử dụng micrô loại trừ lẫn nhau.
- Talk Mode nâng cấp dịch vụ tiền cảnh hiện có từ `connectedDevice` lên `connectedDevice|microphone` trước khi bắt đầu thu âm, sau đó hạ cấp khi Talk Mode dừng. Dịch vụ Node khai báo `FOREGROUND_SERVICE_CONNECTED_DEVICE` với `CHANGE_NETWORK_STATE`; Android 14+ cũng yêu cầu khai báo `FOREGROUND_SERVICE_MICROPHONE`, cấp quyền lúc chạy `RECORD_AUDIO` và loại dịch vụ micrô trong thời gian chạy.
- Theo mặc định, Android Talk sử dụng tính năng nhận dạng giọng nói gốc, Chat qua Gateway và `talk.speak` thông qua nhà cung cấp Talk của Gateway đã cấu hình. TTS hệ thống cục bộ chỉ được sử dụng khi `talk.speak` không khả dụng.
- Android Talk chỉ sử dụng chuyển tiếp Gateway theo thời gian thực khi `talk.realtime.mode` là `realtime` và `talk.realtime.transport` là `gateway-relay`.
- Android không quảng bá khả năng `voiceWake`. Hãy sử dụng tính năng đọc chính tả trong Chat,
  ghi chú thoại hoặc Talk để nhập bằng giọng nói.
- Các nhóm lệnh Android bổ sung (khả năng sử dụng phụ thuộc vào thiết bị, quyền và cài đặt người dùng):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` chỉ khi bật **Settings > Phone Capabilities > Installed Apps**; theo mặc định, lệnh này liệt kê các ứng dụng hiển thị trong trình khởi chạy (truyền `includeNonLaunchable` để lấy danh sách đầy đủ).
  - `notifications.list`, `notifications.actions` (xem phần [Chuyển tiếp thông báo](#notification-forwarding) bên dưới)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Tệp trong không gian làm việc (chỉ đọc)

Phần tổng quan Trang chủ có thẻ **Tệp** để duyệt không gian làm việc của tác tử đang hoạt động thông qua các RPC Gateway chỉ đọc `agents.workspace.list` / `agents.workspace.get`: đi sâu vào thư mục, xem trước văn bản và hình ảnh, cũng như xuất qua bảng chia sẻ của Android. Không có thao tác ghi và kích thước bản xem trước bị Gateway giới hạn.

## Xem xét phê duyệt lệnh

Một kết nối của trình vận hành với `operator.admin`, hoặc một kết nối
`operator.approvals` đã ghép đôi được Gateway chỉ định rõ ràng, có thể xem xét
các yêu cầu thực thi đang chờ trong **Cài đặt -> Phê duyệt**. Ứng dụng tải
bản ghi phê duyệt đã được làm sạch của Gateway trước khi bật các nút, hiển thị mọi
cảnh báo bảo mật và các quyết định chính xác mà yêu cầu đó cung cấp, đồng thời gửi
ID phê duyệt và loại chủ sở hữu trở lại Gateway.

Trạng thái phê duyệt được chia sẻ với Control UI và các bề mặt trò chuyện được hỗ trợ.
Câu trả lời được cam kết đầu tiên sẽ thắng; Android hiển thị kết quả chuẩn đó ngay cả khi
một bề mặt khác trả lời trước. Nếu phản hồi giải quyết bị mất hoặc Gateway
ngắt kết nối, ứng dụng giữ thao tác ở trạng thái khóa và đọc lại phê duyệt
trước khi đưa ra một quyết định khác.

Các Gateway có trước phương thức phê duyệt hợp nhất sẽ chuyển về sử dụng các
phương thức dành riêng cho thực thi đã phát hành. Việc xem xét yêu cầu đang chờ vẫn hoạt động, nhưng trạng thái đầu cuối
được giữ lại và kết quả đa bề mặt phong phú hơn yêu cầu Gateway đã được cập nhật.

## Trả lời câu hỏi của tác tử

Chat hiển thị các câu hỏi Gateway đang chờ dưới dạng thẻ gốc cho các kết nối của trình vận hành
với `operator.questions` (hoặc `operator.admin`). Thẻ hỗ trợ các tùy chọn chọn một và
chọn nhiều, mô tả tùy chọn, câu trả lời **Khác** dạng văn bản tự do và bộ đếm ngược
hết hạn. Việc kết nối lại sẽ tải lại các câu hỏi đang chờ từ Gateway. Thẻ
sẽ khóa khi thiết bị này trả lời, một bề mặt khác trả lời trước, hoặc
câu hỏi hết hạn hay bị hủy.

## Điểm vào của trợ lý

Android hỗ trợ khởi chạy OpenClaw từ trình kích hoạt trợ lý hệ thống (Google Assistant). Nhấn giữ nút trang chủ (hoặc một trình kích hoạt `ACTION_ASSIST` khác) sẽ mở ứng dụng; nói "Hey Google, ask OpenClaw `<prompt>`" sẽ khớp với mẫu truy vấn App Actions đã khai báo của ứng dụng và chuyển lời nhắc vào trình soạn thảo trò chuyện mà không tự động gửi.

Tính năng này sử dụng **App Actions** của Android (khả năng `shortcuts.xml`) được khai báo trong tệp manifest của ứng dụng. Không cần cấu hình phía Gateway — ý định trợ lý được xử lý hoàn toàn bởi ứng dụng Android.

<Note>
Khả năng sử dụng App Actions phụ thuộc vào thiết bị, phiên bản Google Play Services và việc người dùng có đặt OpenClaw làm ứng dụng trợ lý mặc định hay không.
</Note>

## Chuyển tiếp thông báo

Android có thể chuyển tiếp thông báo của thiết bị đến Gateway dưới dạng các mục `node.event`. Tính năng này được cấu hình **trên thiết bị**, trong bảng Settings của ứng dụng — không phải trong cấu hình gateway/`openclaw.json`.

| Cài đặt                     | Mô tả                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chuyển tiếp sự kiện thông báo | Công tắc chính. Mặc định tắt; trước tiên phải cấp quyền truy cập trình nghe thông báo.                                                                                                              |
| Bộ lọc gói              | **Danh sách cho phép** (chỉ chuyển tiếp các ID gói được liệt kê) hoặc **Danh sách chặn** (mặc định: tất cả gói ngoại trừ các ID được liệt kê). Gói của chính OpenClaw luôn bị loại trừ trong chế độ Danh sách chặn để ngăn vòng lặp chuyển tiếp. |
| Giờ yên lặng                 | Khoảng thời gian bắt đầu/kết thúc theo giờ địa phương ở định dạng HH:mm, trong đó việc chuyển tiếp bị tạm ngưng. Mặc định bị tắt; sau khi bật, giá trị mặc định là `22:00`-`07:00`.                                                                                |
| Số sự kiện tối đa / phút         | Giới hạn tốc độ thông báo được chuyển tiếp trên mỗi thiết bị. Mặc định là 20.                                                                                                                                          |
| Khóa phiên định tuyến           | Tùy chọn. Ghim các sự kiện thông báo được chuyển tiếp vào một phiên cụ thể thay vì tuyến thông báo mặc định của thiết bị.                                                                               |

<Note>
Tính năng chuyển tiếp thông báo yêu cầu quyền Trình nghe thông báo của Android. Ứng dụng sẽ nhắc cấp quyền này trong quá trình thiết lập.
</Note>

Thông báo từ WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord và Signal luôn bị loại trừ. Tin nhắn của chúng đã được các phiên kênh OpenClaw gốc quản lý; việc chuyển tiếp thông báo Android dưới dạng một sự kiện node riêng biệt có thể khiến câu trả lời được định tuyến qua nhầm cuộc trò chuyện.

## Liên quan

- [Ứng dụng iOS](/vi/platforms/ios)
- [Node](/vi/nodes)
- [Khắc phục sự cố node Android](/vi/nodes/troubleshooting)
