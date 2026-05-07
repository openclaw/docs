---
read_when:
    - Ghép đôi hoặc kết nối lại Node iOS
    - Chạy ứng dụng iOS từ mã nguồn
    - Gỡ lỗi phát hiện Gateway hoặc các lệnh canvas
summary: 'Ứng dụng Node trên iOS: kết nối với Gateway, ghép đôi, khung vẽ và khắc phục sự cố'
title: Ứng dụng iOS
x-i18n:
    generated_at: "2026-05-07T13:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Tình trạng khả dụng: bản xem trước nội bộ. Ứng dụng iOS chưa được phân phối công khai.

## Chức năng

- Kết nối với Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp các khả năng của node: Canvas, ảnh chụp nhanh màn hình, chụp ảnh camera, vị trí, chế độ trò chuyện, đánh thức bằng giọng nói.
- Nhận các lệnh `node.invoke` và báo cáo sự kiện trạng thái node.

## Yêu cầu

- Gateway đang chạy trên một thiết bị khác (macOS, Linux hoặc Windows qua WSL2).
- Đường mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua DNS-SD unicast (miền ví dụ: `openclaw.internal.`), **hoặc**
  - Máy chủ/cổng thủ công (dự phòng).

## Khởi động nhanh (ghép nối + kết nối)

1. Khởi động Gateway:

```bash
openclaw gateway --port 18789
```

2. Trong ứng dụng iOS, mở Settings và chọn một gateway đã được phát hiện (hoặc bật Manual Host rồi nhập máy chủ/cổng).

3. Phê duyệt yêu cầu ghép nối trên máy chủ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử ghép nối lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới sẽ được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Tùy chọn: nếu node iOS luôn kết nối từ một mạng con được kiểm soát chặt chẽ, bạn
có thể chọn tự động phê duyệt node lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

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

Tính năng này bị tắt theo mặc định. Nó chỉ áp dụng cho ghép nối mới `role: node` mà
không yêu cầu phạm vi nào. Ghép nối người vận hành/trình duyệt và mọi thay đổi về vai trò, phạm vi, siêu dữ liệu hoặc
khóa công khai vẫn yêu cầu phê duyệt thủ công.

4. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Đẩy dựa trên relay cho bản dựng chính thức

Các bản dựng iOS được phân phối chính thức dùng relay đẩy bên ngoài thay vì công bố token APNs thô
cho gateway.

Yêu cầu phía Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Luồng hoạt động:

- Ứng dụng iOS đăng ký với relay bằng App Attest và JWS giao dịch ứng dụng StoreKit.
- Relay trả về một handle relay mờ cùng với quyền gửi theo phạm vi đăng ký.
- Ứng dụng iOS lấy danh tính gateway đã ghép nối và đưa nó vào đăng ký relay, để đăng ký dựa trên relay được ủy quyền cho đúng gateway đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó đến gateway đã ghép nối bằng `push.apns.register`.
- Gateway dùng handle relay đã lưu đó cho `push.test`, đánh thức nền và nhắc đánh thức.
- URL cơ sở relay của gateway phải khớp với URL relay được nhúng trong bản dựng iOS chính thức/TestFlight.
- Nếu sau đó ứng dụng kết nối với một gateway khác hoặc một bản dựng có URL cơ sở relay khác, ứng dụng sẽ làm mới đăng ký relay thay vì tái sử dụng ràng buộc cũ.

Những gì gateway **không** cần cho đường dẫn này:

- Không cần token relay toàn triển khai.
- Không cần khóa APNs trực tiếp cho các lần gửi chính thức/TestFlight dựa trên relay.

Luồng dự kiến cho người vận hành:

1. Cài đặt bản dựng iOS chính thức/TestFlight.
2. Đặt `gateway.push.apns.relay.baseUrl` trên gateway.
3. Ghép nối ứng dụng với gateway và để ứng dụng kết nối xong.
4. Ứng dụng tự động công bố `push.apns.register` sau khi có token APNs, phiên người vận hành đã kết nối và đăng ký relay thành công.
5. Sau đó, `push.test`, đánh thức kết nối lại và nhắc đánh thức có thể dùng đăng ký dựa trên relay đã lưu.

## Beacon báo còn sống trong nền

Khi iOS đánh thức ứng dụng vì một silent push, làm mới nền hoặc sự kiện vị trí đáng kể, ứng dụng
thử kết nối lại node trong thời gian ngắn rồi gọi `node.event` với `event: "node.presence.alive"`.
Gateway ghi nhận điều này dưới dạng `lastSeenAtMs`/`lastSeenReason` trên siêu dữ liệu node/thiết bị đã ghép nối chỉ
sau khi biết danh tính thiết bị node đã xác thực.

Ứng dụng chỉ xem một lần đánh thức nền là đã được ghi nhận thành công khi phản hồi của gateway bao gồm
`handled: true`. Các gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó
tương thích nhưng không được tính là một cập nhật last-seen bền vững.

Ghi chú tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một biến môi trường ghi đè tạm thời cho gateway.

## Luồng xác thực và tin cậy

Relay tồn tại để thực thi hai ràng buộc mà APNs trực tiếp trên gateway không thể cung cấp cho
các bản dựng iOS chính thức:

- Chỉ các bản dựng OpenClaw iOS thật được phân phối qua Apple mới có thể dùng relay được lưu trữ.
- Một gateway chỉ có thể gửi push dựa trên relay cho các thiết bị iOS đã ghép nối với đúng
  gateway đó.

Theo từng chặng:

1. `iOS app -> gateway`
   - Trước tiên ứng dụng ghép nối với gateway qua luồng xác thực Gateway thông thường.
   - Việc đó cấp cho ứng dụng một phiên node đã xác thực cùng với một phiên người vận hành đã xác thực.
   - Phiên người vận hành được dùng để gọi `gateway.identity.get`.

2. `iOS app -> relay`
   - Ứng dụng gọi các endpoint đăng ký relay qua HTTPS.
   - Đăng ký bao gồm bằng chứng App Attest cùng với JWS giao dịch ứng dụng StoreKit.
   - Relay xác thực bundle ID, bằng chứng App Attest và bằng chứng phân phối Apple, đồng thời yêu cầu
     đường phân phối chính thức/sản xuất.
   - Đây là cơ chế chặn các bản dựng Xcode/dev cục bộ dùng relay được lưu trữ. Một bản dựng cục bộ có thể được
     ký, nhưng nó không đáp ứng bằng chứng phân phối Apple chính thức mà relay mong đợi.

3. `gateway identity delegation`
   - Trước khi đăng ký relay, ứng dụng lấy danh tính gateway đã ghép nối từ
     `gateway.identity.get`.
   - Ứng dụng đưa danh tính gateway đó vào payload đăng ký relay.
   - Relay trả về một handle relay và quyền gửi theo phạm vi đăng ký được ủy quyền cho
     danh tính gateway đó.

4. `gateway -> relay`
   - Gateway lưu handle relay và quyền gửi từ `push.apns.register`.
   - Khi `push.test`, đánh thức kết nối lại và nhắc đánh thức, gateway ký yêu cầu gửi bằng
     danh tính thiết bị của chính nó.
   - Relay xác minh cả quyền gửi đã lưu và chữ ký gateway dựa trên danh tính
     gateway được ủy quyền từ đăng ký.
   - Một gateway khác không thể tái sử dụng đăng ký đã lưu đó, ngay cả khi bằng cách nào đó nó có được handle.

5. `relay -> APNs`
   - Relay sở hữu thông tin xác thực APNs sản xuất và token APNs thô cho bản dựng chính thức.
   - Gateway không bao giờ lưu token APNs thô cho các bản dựng chính thức dựa trên relay.
   - Relay gửi push cuối cùng đến APNs thay mặt cho gateway đã ghép nối.

Lý do thiết kế này được tạo ra:

- Để giữ thông tin xác thực APNs sản xuất bên ngoài gateway của người dùng.
- Để tránh lưu token APNs thô của bản dựng chính thức trên gateway.
- Để chỉ cho phép sử dụng relay được lưu trữ với các bản dựng OpenClaw chính thức/TestFlight.
- Để ngăn một gateway gửi push đánh thức đến các thiết bị iOS thuộc về một gateway khác.

Các bản dựng cục bộ/thủ công vẫn dùng APNs trực tiếp. Nếu bạn đang kiểm thử các bản dựng đó mà không có relay,
gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Đây là biến môi trường runtime của máy chủ gateway, không phải cài đặt Fastlane. `apps/ios/fastlane/.env` chỉ lưu
xác thực App Store Connect / TestFlight như `ASC_KEY_ID` và `ASC_ISSUER_ID`; nó không cấu hình
phân phối APNs trực tiếp cho các bản dựng iOS cục bộ.

Nơi lưu trữ được khuyến nghị trên máy chủ gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Không commit tệp `.p8` hoặc đặt nó trong bản checkout repo.

## Đường dẫn phát hiện

### Bonjour (LAN)

Ứng dụng iOS duyệt `_openclaw-gw._tcp` trên `local.` và, khi được cấu hình, cùng
miền phát hiện DNS-SD diện rộng. Các gateway cùng LAN tự động xuất hiện từ `local.`;
phát hiện qua mạng có thể dùng miền diện rộng đã cấu hình mà không thay đổi loại beacon.

### Tailnet (liên mạng)

Nếu mDNS bị chặn, hãy dùng một vùng DNS-SD unicast (chọn một miền; ví dụ:
`openclaw.internal.`) và Tailscale split DNS.
Xem [Bonjour](/vi/gateway/bonjour) để biết ví dụ CoreDNS.

### Máy chủ/cổng thủ công

Trong Settings, bật **Manual Host** và nhập máy chủ gateway + cổng (mặc định `18789`).

## Canvas + A2UI

Node iOS kết xuất một canvas WKWebView. Dùng `node.invoke` để điều khiển nó:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Ghi chú:

- Máy chủ Canvas của Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/`.
- Nó được phục vụ từ máy chủ HTTP Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
- Node iOS tự động điều hướng đến A2UI khi kết nối nếu URL máy chủ canvas được quảng bá.
- Quay lại scaffold tích hợp bằng `canvas.navigate` và `{"url":""}`.

## Quan hệ với Computer Use

Ứng dụng iOS là một bề mặt node di động, không phải backend Codex Computer Use. Codex
Computer Use và `cua-driver mcp` điều khiển một desktop macOS cục bộ qua các công cụ MCP;
ứng dụng iOS cung cấp khả năng iPhone qua các lệnh node OpenClaw
như `canvas.*`, `camera.*`, `screen.*`, `location.*` và `talk.*`.

Agents vẫn có thể vận hành ứng dụng iOS qua OpenClaw bằng cách gọi các lệnh
node, nhưng các lệnh gọi đó đi qua giao thức node gateway và tuân theo giới hạn
tiền cảnh/nền của iOS. Dùng [Codex Computer Use](/vi/plugins/codex-computer-use)
để điều khiển desktop cục bộ và dùng trang này cho các khả năng node iOS.

### Đánh giá / ảnh chụp nhanh Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Đánh thức bằng giọng nói + chế độ trò chuyện

- Đánh thức bằng giọng nói và chế độ trò chuyện có trong Settings.
- Các node iOS hỗ trợ trò chuyện quảng bá khả năng `talk` và có thể khai báo
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` và `talk.ptt.once`;
  Gateway cho phép các lệnh nhấn để nói đó theo mặc định cho các
  node hỗ trợ Talk đáng tin cậy.
- iOS có thể tạm ngưng âm thanh nền; hãy xem các tính năng giọng nói là nỗ lực tối đa khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS ra tiền cảnh (các lệnh canvas/camera/screen yêu cầu điều này).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway không quảng bá URL bề mặt Plugin Canvas; kiểm tra `plugins.entries.canvas.config.host` trong [cấu hình Gateway](/vi/gateway/configuration).
- Lời nhắc ghép nối không bao giờ xuất hiện: chạy `openclaw devices list` và phê duyệt thủ công.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép nối Keychain đã bị xóa; hãy ghép nối lại node.

## Tài liệu liên quan

- [Ghép nối](/vi/channels/pairing)
- [Phát hiện](/vi/gateway/discovery)
- [Bonjour](/vi/gateway/bonjour)
