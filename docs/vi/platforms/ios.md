---
read_when:
    - Ghép nối hoặc kết nối lại Node iOS
    - Chạy ứng dụng iOS từ mã nguồn
    - Gỡ lỗi khám phá gateway hoặc lệnh canvas
summary: 'Ứng dụng node iOS: kết nối với Gateway, ghép đôi, canvas và khắc phục sự cố'
title: ứng dụng iOS
x-i18n:
    generated_at: "2026-07-04T18:06:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

Tính khả dụng: các bản dựng ứng dụng iPhone được phân phối qua các kênh của Apple khi được bật cho một bản phát hành. Các bản dựng phát triển cục bộ cũng có thể chạy từ mã nguồn.

## Chức năng

- Kết nối tới Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp các khả năng của node: Canvas, ảnh chụp màn hình, chụp Camera, Vị trí, chế độ trò chuyện, đánh thức bằng giọng nói.
- Nhận các lệnh `node.invoke` và báo cáo sự kiện trạng thái node.

## Yêu cầu

- Gateway đang chạy trên một thiết bị khác (macOS, Linux, hoặc Windows qua WSL2).
- Đường dẫn mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua DNS-SD unicast (miền ví dụ: `openclaw.internal.`), **hoặc**
  - Máy chủ/cổng thủ công (dự phòng).

## Bắt đầu nhanh (ghép đôi + kết nối)

1. Khởi động một Gateway đã xác thực với một tuyến mà điện thoại của bạn có thể truy cập. Tailscale
   Serve là đường dẫn từ xa được khuyến nghị:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Với thiết lập cùng LAN đáng tin cậy, hãy dùng `gateway.bind: "lan"` đã xác thực
thay thế. Bind local loopback mặc định không thể truy cập từ điện thoại. Nếu
Gateway chưa được cấu hình, hãy chạy `openclaw onboard` trước để việc tạo setup-code
có đường dẫn xác thực bằng token hoặc mật khẩu.

2. Mở [Giao diện điều khiển](/vi/web/control-ui), chọn **Node**, rồi nhấp
   **Ghép đôi thiết bị di động** trong thẻ **Thiết bị**.

3. Trong ứng dụng iOS, mở **Cài đặt** → **Gateway**, quét mã QR (hoặc dán
   mã thiết lập), rồi kết nối.

4. Ứng dụng chính thức tự động kết nối. Nếu **Thiết bị** hiển thị một yêu cầu
   đang chờ xử lý, hãy xem xét vai trò và phạm vi của yêu cầu đó trước khi phê duyệt.

Nút trong Giao diện điều khiển yêu cầu một phiên đã ghép đôi sẵn với `operator.admin`.
Làm phương án dự phòng trong terminal, hãy chọn một gateway được phát hiện trong ứng dụng iOS (hoặc bật
Máy chủ thủ công và nhập máy chủ/cổng), rồi phê duyệt yêu cầu trên máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử lại ghép đôi với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Tùy chọn: nếu node iOS luôn kết nối từ một subnet được kiểm soát chặt chẽ, bạn
có thể chọn bật tự động phê duyệt node lần đầu bằng CIDR rõ ràng hoặc IP chính xác:

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

Tính năng này mặc định bị tắt. Nó chỉ áp dụng cho ghép đôi `role: node` mới
không yêu cầu phạm vi nào. Ghép đôi operator/trình duyệt và mọi thay đổi về vai trò, phạm vi, siêu dữ liệu hoặc
khóa công khai vẫn cần phê duyệt thủ công.

5. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push dựa trên relay cho bản dựng chính thức

Các bản dựng iOS được phân phối chính thức dùng relay push bên ngoài thay vì công bố token APNs thô
cho gateway.

Các bản dựng App Store chính thức từ làn phát hành công khai dùng relay được lưu trữ tại `https://ios-push-relay.openclaw.ai`.

Triển khai relay tùy chỉnh yêu cầu một đường dẫn bản dựng/triển khai iOS tách biệt có chủ đích, trong đó URL relay khớp với URL relay của gateway. Làn phát hành App Store công khai không chấp nhận ghi đè URL relay tùy chỉnh. Nếu bạn đang dùng bản dựng relay tùy chỉnh, hãy đặt URL relay gateway tương ứng:

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

- Ứng dụng iOS đăng ký với relay bằng App Attest và một JWS giao dịch ứng dụng StoreKit.
- Relay trả về một handle relay mờ cùng một quyền gửi theo phạm vi đăng ký.
- Ứng dụng iOS lấy danh tính gateway đã ghép đôi và đưa nó vào đăng ký relay, để đăng ký dựa trên relay được ủy quyền cho gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó tới gateway đã ghép đôi bằng `push.apns.register`.
- Gateway dùng handle relay đã lưu đó cho `push.test`, đánh thức nền và nhắc đánh thức.
- URL relay gateway tùy chỉnh phải khớp với URL relay được nhúng vào bản dựng iOS.
- Nếu sau đó ứng dụng kết nối tới một gateway khác hoặc một bản dựng có URL cơ sở relay khác, ứng dụng sẽ làm mới đăng ký relay thay vì dùng lại liên kết cũ.

Gateway **không** cần những gì cho đường dẫn này:

- Không cần token relay toàn triển khai.
- Không cần khóa APNs trực tiếp cho các lần gửi dựa trên relay của App Store chính thức.

Luồng vận hành dự kiến:

1. Cài đặt ứng dụng iOS chính thức.
2. Tùy chọn: đặt `gateway.push.apns.relay.baseUrl` trên gateway chỉ khi dùng một bản dựng relay tùy chỉnh tách biệt có chủ đích.
3. Ghép đôi ứng dụng với gateway và để ứng dụng kết nối xong.
4. Ứng dụng tự động công bố `push.apns.register` sau khi có token APNs, phiên operator đã kết nối và đăng ký relay thành công.
5. Sau đó, `push.test`, đánh thức kết nối lại và nhắc đánh thức có thể dùng đăng ký dựa trên relay đã lưu.

## Tín hiệu alive nền

Khi iOS đánh thức ứng dụng bằng một silent push, làm mới nền hoặc sự kiện vị trí quan trọng, ứng dụng
thử kết nối lại node trong thời gian ngắn rồi gọi `node.event` với `event: "node.presence.alive"`.
Gateway ghi nhận điều này dưới dạng `lastSeenAtMs`/`lastSeenReason` trên siêu dữ liệu node/thiết bị đã ghép đôi chỉ
sau khi danh tính thiết bị node đã xác thực được biết.

Ứng dụng chỉ xem một lần đánh thức nền là đã được ghi nhận thành công khi phản hồi của gateway chứa
`handled: true`. Các gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó
tương thích nhưng không được tính là một cập nhật last-seen bền vững.

Ghi chú tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một ghi đè env tạm thời cho gateway.
- Làn phát hành App Store công khai từ chối `OPENCLAW_PUSH_RELAY_BASE_URL` cho các bản dựng iOS.

## Xác thực và luồng tin cậy

Relay tồn tại để thực thi hai ràng buộc mà APNs trực tiếp trên gateway không thể cung cấp cho
các bản dựng iOS chính thức:

- Chỉ các bản dựng iOS OpenClaw chính hãng được phân phối qua Apple mới có thể dùng relay được lưu trữ.
- Gateway chỉ có thể gửi push dựa trên relay cho các thiết bị iOS đã ghép đôi với đúng
  gateway đó.

Từng bước:

1. `iOS app -> gateway`
   - Ứng dụng trước tiên ghép đôi với gateway qua luồng xác thực Gateway thông thường.
   - Điều đó cấp cho ứng dụng một phiên node đã xác thực cùng một phiên operator đã xác thực.
   - Phiên operator được dùng để gọi `gateway.identity.get`.

2. `iOS app -> relay`
   - Ứng dụng gọi các endpoint đăng ký relay qua HTTPS.
   - Đăng ký bao gồm bằng chứng App Attest cùng một JWS giao dịch ứng dụng StoreKit.
   - Relay xác thực bundle ID, bằng chứng App Attest và bằng chứng phân phối Apple, đồng thời yêu cầu
     đường dẫn phân phối chính thức/sản xuất.
   - Đây là cơ chế chặn các bản dựng Xcode/dev cục bộ dùng relay được lưu trữ. Một bản dựng cục bộ có thể được
     ký, nhưng nó không đáp ứng bằng chứng phân phối Apple chính thức mà relay kỳ vọng.

3. `gateway identity delegation`
   - Trước khi đăng ký relay, ứng dụng lấy danh tính gateway đã ghép đôi từ
     `gateway.identity.get`.
   - Ứng dụng đưa danh tính gateway đó vào payload đăng ký relay.
   - Relay trả về một handle relay và một quyền gửi theo phạm vi đăng ký được ủy quyền cho
     danh tính gateway đó.

4. `gateway -> relay`
   - Gateway lưu handle relay và quyền gửi từ `push.apns.register`.
   - Khi `push.test`, đánh thức kết nối lại và nhắc đánh thức, gateway ký yêu cầu gửi bằng
     danh tính thiết bị của chính nó.
   - Relay xác minh cả quyền gửi đã lưu và chữ ký gateway với danh tính
     gateway được ủy quyền từ đăng ký.
   - Gateway khác không thể dùng lại đăng ký đã lưu đó, ngay cả khi bằng cách nào đó lấy được handle.

5. `relay -> APNs`
   - Relay sở hữu thông tin xác thực APNs sản xuất và token APNs thô cho bản dựng chính thức.
   - Gateway không bao giờ lưu token APNs thô cho các bản dựng chính thức dựa trên relay.
   - Relay gửi push cuối cùng tới APNs thay mặt cho gateway đã ghép đôi.

Lý do thiết kế này được tạo ra:

- Để giữ thông tin xác thực APNs sản xuất nằm ngoài gateway của người dùng.
- Để tránh lưu token APNs thô của bản dựng chính thức trên gateway.
- Để chỉ cho phép bản dựng iOS OpenClaw chính thức dùng relay được lưu trữ.
- Để ngăn một gateway gửi push đánh thức tới các thiết bị iOS thuộc về gateway khác.

Các bản dựng cục bộ/thủ công vẫn dùng APNs trực tiếp. Nếu bạn đang kiểm thử các bản dựng đó mà không dùng relay,
gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Đây là các env var runtime trên máy chủ gateway, không phải cài đặt Fastlane. `apps/ios/fastlane/.env` chỉ lưu
xác thực App Store Connect như `APP_STORE_CONNECT_KEY_ID` và
`APP_STORE_CONNECT_ISSUER_ID`; nó không cấu hình phân phối APNs trực tiếp cho các bản dựng iOS cục bộ.

Lưu trữ được khuyến nghị trên máy chủ gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Đừng commit tệp `.p8` hoặc đặt nó dưới checkout của repo.

## Đường dẫn khám phá

### Bonjour (LAN)

Ứng dụng iOS duyệt `_openclaw-gw._tcp` trên `local.` và, khi được cấu hình, cùng
miền khám phá DNS-SD diện rộng. Các gateway cùng LAN tự động xuất hiện từ `local.`;
khám phá liên mạng có thể dùng miền diện rộng đã cấu hình mà không thay đổi loại beacon.

### Tailnet (liên mạng)

Nếu mDNS bị chặn, hãy dùng một vùng DNS-SD unicast (chọn một miền; ví dụ:
`openclaw.internal.`) và Tailscale split DNS.
Xem [Bonjour](/vi/gateway/bonjour) để biết ví dụ CoreDNS.

### Máy chủ/cổng thủ công

Trong Cài đặt, bật **Máy chủ thủ công** và nhập máy chủ gateway + cổng (mặc định `18789`).

## Canvas + A2UI

Node iOS render một canvas WKWebView. Dùng `node.invoke` để điều khiển nó:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Ghi chú:

- Máy chủ Canvas của Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/`.
- Nó được phục vụ từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
- Node iOS giữ scaffold tích hợp làm chế độ xem mặc định khi đã kết nối. `canvas.a2ui.push` và `canvas.a2ui.reset` dùng trang A2UI do ứng dụng sở hữu được đóng gói.
- Các trang A2UI Gateway từ xa chỉ render trên iOS; hành động nút A2UI native chỉ được chấp nhận từ các trang do ứng dụng sở hữu được đóng gói.
- Quay lại scaffold tích hợp bằng `canvas.navigate` và `{"url":""}`.

## Quan hệ với Computer Use

Ứng dụng iOS là một bề mặt node di động, không phải backend Codex Computer Use. Codex
Computer Use và `cua-driver mcp` điều khiển desktop macOS cục bộ qua các công cụ
MCP; ứng dụng iOS cung cấp các khả năng iPhone qua lệnh node của OpenClaw
như `canvas.*`, `camera.*`, `screen.*`, `location.*`, và `talk.*`.

Agent vẫn có thể vận hành ứng dụng iOS qua OpenClaw bằng cách gọi các lệnh
node, nhưng các lệnh gọi đó đi qua giao thức node của gateway và tuân theo
giới hạn foreground/background của iOS. Dùng [Codex Computer Use](/vi/plugins/codex-computer-use)
để điều khiển desktop cục bộ và dùng trang này cho các khả năng node iOS.

### Eval / snapshot Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Đánh thức bằng giọng nói + chế độ trò chuyện

- Đánh thức bằng giọng nói và chế độ trò chuyện có trong Settings.
- Talk thời gian thực của OpenAI sử dụng WebRTC do client sở hữu khi `talk.realtime.transport` là `webrtc`; cấu hình `gateway-relay` rõ ràng vẫn do Gateway sở hữu. Xem [chế độ Talk](/vi/nodes/talk).
- Các Node iOS hỗ trợ Talk quảng bá capability `talk` và có thể khai báo
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, và `talk.ptt.once`;
  Gateway mặc định cho phép các lệnh nhấn-để-nói đó đối với các Node
  hỗ trợ Talk đáng tin cậy.
- iOS có thể tạm dừng âm thanh nền; hãy xem các tính năng giọng nói là nỗ lực tối đa khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS lên foreground (các lệnh canvas/camera/screen yêu cầu điều này).
- `A2UI_HOST_UNAVAILABLE`: không thể truy cập trang A2UI đi kèm trong WebView của ứng dụng; giữ ứng dụng ở foreground trên tab Screen rồi thử lại.
- Lời nhắc ghép nối không bao giờ xuất hiện: chạy `openclaw devices list` và phê duyệt thủ công.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép nối Keychain đã bị xóa; hãy ghép nối lại Node.

## Tài liệu liên quan

- [Ghép nối](/vi/channels/pairing)
- [Khám phá](/vi/gateway/discovery)
- [Bonjour](/vi/gateway/bonjour)
