---
read_when:
    - Ghép đôi hoặc kết nối lại node iOS
    - Chạy ứng dụng iOS từ mã nguồn
    - Gỡ lỗi phát hiện Gateway hoặc các lệnh khung vẽ
summary: 'ứng dụng node iOS: kết nối với Gateway, ghép đôi, canvas và khắc phục sự cố'
title: Ứng dụng iOS
x-i18n:
    generated_at: "2026-06-27T17:41:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

Tình trạng khả dụng: các bản dựng ứng dụng iPhone được phân phối qua các kênh của Apple khi được bật cho một bản phát hành. Các bản dựng phát triển cục bộ cũng có thể chạy từ mã nguồn.

## Chức năng

- Kết nối tới Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp các năng lực của node: Canvas, ảnh chụp Screen, chụp Camera, Location, chế độ Talk, đánh thức bằng Voice.
- Nhận các lệnh `node.invoke` và báo cáo sự kiện trạng thái node.

## Yêu cầu

- Gateway đang chạy trên thiết bị khác (macOS, Linux, hoặc Windows qua WSL2).
- Đường truyền mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua DNS-SD unicast (miền ví dụ: `openclaw.internal.`), **hoặc**
  - Máy chủ/cổng thủ công (dự phòng).

## Bắt đầu nhanh (ghép đôi + kết nối)

1. Khởi động Gateway:

```bash
openclaw gateway --port 18789
```

2. Trong ứng dụng iOS, mở Settings và chọn một gateway đã được phát hiện (hoặc bật Manual Host và nhập máy chủ/cổng).

3. Phê duyệt yêu cầu ghép đôi trên máy chủ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử ghép đôi lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Tùy chọn: nếu node iOS luôn kết nối từ một subnet được kiểm soát chặt chẽ, bạn
có thể chọn tự động phê duyệt node lần đầu với các CIDR rõ ràng hoặc IP chính xác:

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

Tính năng này bị tắt theo mặc định. Nó chỉ áp dụng cho ghép đôi `role: node` mới
không có phạm vi được yêu cầu. Ghép đôi operator/browser và mọi thay đổi về vai trò, phạm vi, siêu dữ liệu hoặc
khóa công khai vẫn cần phê duyệt thủ công.

4. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push dựa trên relay cho các bản dựng chính thức

Các bản dựng iOS được phân phối chính thức sử dụng relay push bên ngoài thay vì công bố token APNs thô
cho gateway.

Các bản dựng chính thức/TestFlight từ tuyến phát hành App Store công khai sử dụng relay được lưu trữ tại `https://ios-push-relay.openclaw.ai`.

Các triển khai relay tùy chỉnh cần một đường dẫn bản dựng/triển khai iOS tách biệt có chủ ý, trong đó URL relay khớp với URL relay của gateway. Tuyến phát hành App Store công khai không chấp nhận ghi đè URL relay tùy chỉnh. Nếu bạn đang dùng bản dựng relay tùy chỉnh, hãy đặt URL relay gateway tương ứng:

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

Luồng hoạt động như sau:

- Ứng dụng iOS đăng ký với relay bằng App Attest và một StoreKit app transaction JWS.
- Relay trả về một relay handle mờ đục cùng với một quyền gửi theo phạm vi đăng ký.
- Ứng dụng iOS lấy danh tính gateway đã ghép đôi và đưa danh tính đó vào đăng ký relay, để đăng ký dựa trên relay được ủy quyền cho gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó tới gateway đã ghép đôi bằng `push.apns.register`.
- Gateway dùng relay handle đã lưu đó cho `push.test`, đánh thức nền và các tín hiệu đánh thức nhẹ.
- URL relay gateway tùy chỉnh phải khớp với URL relay được nhúng trong bản dựng iOS.
- Nếu sau đó ứng dụng kết nối tới một gateway khác hoặc một bản dựng có URL cơ sở relay khác, nó sẽ làm mới đăng ký relay thay vì dùng lại liên kết cũ.

Những thứ gateway **không** cần cho đường dẫn này:

- Không có token relay trên toàn bộ triển khai.
- Không có khóa APNs trực tiếp cho các lần gửi dựa trên relay chính thức/TestFlight.

Luồng operator dự kiến:

1. Cài đặt bản dựng iOS chính thức/TestFlight.
2. Tùy chọn: chỉ đặt `gateway.push.apns.relay.baseUrl` trên gateway khi dùng một bản dựng relay tùy chỉnh tách biệt có chủ ý.
3. Ghép đôi ứng dụng với gateway và để nó kết nối xong.
4. Ứng dụng tự động công bố `push.apns.register` sau khi có token APNs, phiên operator đã kết nối và đăng ký relay thành công.
5. Sau đó, `push.test`, đánh thức khi kết nối lại và các tín hiệu đánh thức nhẹ có thể dùng đăng ký dựa trên relay đã lưu.

## Beacon báo còn hoạt động trong nền

Khi iOS đánh thức ứng dụng cho silent push, làm mới nền hoặc sự kiện vị trí quan trọng, ứng dụng
thử kết nối lại node trong thời gian ngắn rồi gọi `node.event` với `event: "node.presence.alive"`.
Gateway ghi nhận điều này dưới dạng `lastSeenAtMs`/`lastSeenReason` trên siêu dữ liệu node/thiết bị đã ghép đôi chỉ
sau khi danh tính thiết bị node đã xác thực được biết.

Ứng dụng chỉ coi một lần đánh thức nền là đã được ghi nhận thành công khi phản hồi gateway bao gồm
`handled: true`. Các gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó
tương thích nhưng không được tính là một cập nhật last-seen bền vững.

Ghi chú tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một ghi đè env tạm thời cho gateway.
- Tuyến phát hành App Store công khai từ chối `OPENCLAW_PUSH_RELAY_BASE_URL` cho các bản dựng iOS.

## Xác thực và luồng tin cậy

Relay tồn tại để thực thi hai ràng buộc mà APNs trực tiếp trên gateway không thể cung cấp cho
các bản dựng iOS chính thức:

- Chỉ các bản dựng iOS OpenClaw chính hãng được phân phối qua Apple mới có thể dùng relay được lưu trữ.
- Một gateway chỉ có thể gửi push dựa trên relay cho các thiết bị iOS đã ghép đôi với chính
  gateway đó.

Từng chặng:

1. `iOS app -> gateway`
   - Trước tiên ứng dụng ghép đôi với gateway thông qua luồng xác thực Gateway thông thường.
   - Điều đó cấp cho ứng dụng một phiên node đã xác thực cùng với một phiên operator đã xác thực.
   - Phiên operator được dùng để gọi `gateway.identity.get`.

2. `iOS app -> relay`
   - Ứng dụng gọi các endpoint đăng ký relay qua HTTPS.
   - Đăng ký bao gồm bằng chứng App Attest cùng với StoreKit app transaction JWS.
   - Relay xác thực bundle ID, bằng chứng App Attest và bằng chứng phân phối của Apple, đồng thời yêu cầu
     đường dẫn phân phối chính thức/production.
   - Đây là điều chặn các bản dựng Xcode/dev cục bộ dùng relay được lưu trữ. Một bản dựng cục bộ có thể được
     ký, nhưng nó không đáp ứng bằng chứng phân phối Apple chính thức mà relay mong đợi.

3. `gateway identity delegation`
   - Trước khi đăng ký relay, ứng dụng lấy danh tính gateway đã ghép đôi từ
     `gateway.identity.get`.
   - Ứng dụng đưa danh tính gateway đó vào payload đăng ký relay.
   - Relay trả về một relay handle và quyền gửi theo phạm vi đăng ký được ủy quyền cho
     danh tính gateway đó.

4. `gateway -> relay`
   - Gateway lưu relay handle và quyền gửi từ `push.apns.register`.
   - Khi `push.test`, đánh thức khi kết nối lại và các tín hiệu đánh thức nhẹ, gateway ký yêu cầu gửi bằng
     danh tính thiết bị của chính nó.
   - Relay xác minh cả quyền gửi đã lưu và chữ ký gateway dựa trên danh tính
     gateway được ủy quyền từ đăng ký.
   - Gateway khác không thể dùng lại đăng ký đã lưu đó, ngay cả khi bằng cách nào đó lấy được handle.

5. `relay -> APNs`
   - Relay sở hữu thông tin xác thực APNs production và token APNs thô cho bản dựng chính thức.
   - Gateway không bao giờ lưu token APNs thô cho các bản dựng chính thức dựa trên relay.
   - Relay gửi push cuối cùng tới APNs thay mặt gateway đã ghép đôi.

Lý do thiết kế này được tạo ra:

- Để giữ thông tin xác thực APNs production khỏi các gateway của người dùng.
- Để tránh lưu token APNs thô của bản dựng chính thức trên gateway.
- Để chỉ cho phép sử dụng relay được lưu trữ đối với các bản dựng OpenClaw chính thức/TestFlight.
- Để ngăn một gateway gửi push đánh thức tới các thiết bị iOS thuộc về một gateway khác.

Các bản dựng cục bộ/thủ công vẫn dùng APNs trực tiếp. Nếu bạn đang kiểm thử các bản dựng đó không qua relay, thì
gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Đây là các biến env runtime trên máy chủ gateway, không phải cài đặt Fastlane. `apps/ios/fastlane/.env` chỉ lưu
xác thực App Store Connect / TestFlight như `APP_STORE_CONNECT_KEY_ID` và
`APP_STORE_CONNECT_ISSUER_ID`; nó không cấu hình phân phối APNs trực tiếp cho các bản dựng iOS cục bộ.

Lưu trữ khuyến nghị trên máy chủ gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Không commit tệp `.p8` hoặc đặt nó trong repo checkout.

## Đường dẫn phát hiện

### Bonjour (LAN)

Ứng dụng iOS duyệt `_openclaw-gw._tcp` trên `local.` và, khi được cấu hình, cùng
miền phát hiện DNS-SD wide-area. Các gateway cùng LAN xuất hiện tự động từ `local.`;
phát hiện xuyên mạng có thể dùng miền wide-area đã cấu hình mà không thay đổi loại beacon.

### Tailnet (xuyên mạng)

Nếu mDNS bị chặn, hãy dùng một vùng DNS-SD unicast (chọn một miền; ví dụ:
`openclaw.internal.`) và Tailscale split DNS.
Xem [Bonjour](/vi/gateway/bonjour) để biết ví dụ CoreDNS.

### Máy chủ/cổng thủ công

Trong Settings, bật **Manual Host** và nhập máy chủ gateway + cổng (mặc định `18789`).

## Canvas + A2UI

Node iOS hiển thị canvas WKWebView. Dùng `node.invoke` để điều khiển:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Ghi chú:

- Máy chủ canvas Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/`.
- Nó được phục vụ từ máy chủ HTTP Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
- Node iOS giữ scaffold tích hợp làm chế độ xem mặc định khi đã kết nối. `canvas.a2ui.push` và `canvas.a2ui.reset` dùng trang A2UI đi kèm do ứng dụng sở hữu.
- Các trang A2UI Gateway từ xa chỉ được render trên iOS; hành động nút A2UI native chỉ được chấp nhận từ các trang đi kèm do ứng dụng sở hữu.
- Quay lại scaffold tích hợp bằng `canvas.navigate` và `{"url":""}`.

## Quan hệ với Computer Use

Ứng dụng iOS là một bề mặt node di động, không phải backend Codex Computer Use. Codex
Computer Use và `cua-driver mcp` điều khiển desktop macOS cục bộ qua các công cụ MCP;
ứng dụng iOS cung cấp các năng lực iPhone qua lệnh node OpenClaw
như `canvas.*`, `camera.*`, `screen.*`, `location.*`, và `talk.*`.

Các agent vẫn có thể vận hành ứng dụng iOS qua OpenClaw bằng cách gọi các lệnh
node, nhưng các lệnh gọi đó đi qua giao thức node gateway và tuân theo giới hạn
foreground/background của iOS. Dùng [Codex Computer Use](/vi/plugins/codex-computer-use)
để điều khiển desktop cục bộ và trang này cho các năng lực node iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Đánh thức bằng Voice + chế độ talk

- Đánh thức bằng Voice và chế độ talk có trong Settings.
- Các node iOS hỗ trợ talk quảng bá năng lực `talk` và có thể khai báo
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, và `talk.ptt.once`;
  Gateway cho phép các lệnh push-to-talk đó theo mặc định đối với các node
  đáng tin cậy có hỗ trợ Talk.
- iOS có thể tạm dừng âm thanh nền; hãy coi các tính năng giọng nói là nỗ lực tốt nhất khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS ra foreground (các lệnh canvas/camera/screen cần điều đó).
- `A2UI_HOST_UNAVAILABLE`: trang A2UI đi kèm không truy cập được trong WebView của ứng dụng; giữ ứng dụng ở foreground trên tab Screen và thử lại.
- Lời nhắc ghép đôi không bao giờ xuất hiện: chạy `openclaw devices list` và phê duyệt thủ công.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép đôi trong Keychain đã bị xóa; ghép đôi lại node.

## Tài liệu liên quan

- [Pairing](/vi/channels/pairing)
- [Discovery](/vi/gateway/discovery)
- [Bonjour](/vi/gateway/bonjour)
