---
read_when:
    - Ghép đôi hoặc kết nối lại node iOS
    - Chạy ứng dụng iOS từ mã nguồn
    - Gỡ lỗi khám phá Gateway hoặc lệnh canvas
summary: 'Ứng dụng Node trên iOS: kết nối với Gateway, ghép đôi, canvas và khắc phục sự cố'
title: ứng dụng iOS
x-i18n:
    generated_at: "2026-07-02T22:37:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

Tính khả dụng: các bản dựng ứng dụng iPhone được phân phối qua các kênh của Apple khi được bật cho một bản phát hành. Các bản dựng phát triển cục bộ cũng có thể chạy từ mã nguồn.

## Chức năng

- Kết nối tới Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp các khả năng của node: Canvas, ảnh chụp Screen, chụp Camera, Location, Talk mode, Voice wake.
- Nhận lệnh `node.invoke` và báo cáo các sự kiện trạng thái node.

## Yêu cầu

- Gateway đang chạy trên thiết bị khác (macOS, Linux, hoặc Windows qua WSL2).
- Đường mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua unicast DNS-SD (miền ví dụ: `openclaw.internal.`), **hoặc**
  - Host/port thủ công (phương án dự phòng).

## Bắt đầu nhanh (ghép đôi + kết nối)

1. Khởi động Gateway:

```bash
openclaw gateway --port 18789
```

2. Trong ứng dụng iOS, mở Settings và chọn một gateway đã được phát hiện (hoặc bật Manual Host và nhập host/port).

3. Phê duyệt yêu cầu ghép đôi trên máy chủ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử ghép đôi lại với thông tin xác thực đã thay đổi (role/scopes/public key),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Tùy chọn: nếu node iOS luôn kết nối từ một subnet được kiểm soát chặt chẽ, bạn
có thể chọn tự động phê duyệt node lần đầu với CIDR hoặc IP chính xác được khai báo rõ:

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
không có scope được yêu cầu. Ghép đôi operator/browser và mọi thay đổi về role, scope, metadata hoặc
public-key vẫn cần phê duyệt thủ công.

4. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push dựa trên relay cho bản dựng chính thức

Các bản dựng iOS được phân phối chính thức dùng relay push bên ngoài thay vì công bố token APNs thô
cho gateway.

Các bản dựng App Store chính thức từ luồng phát hành công khai dùng relay được lưu trữ tại `https://ios-push-relay.openclaw.ai`.

Triển khai relay tùy chỉnh cần một đường dẫn dựng/triển khai iOS được tách riêng có chủ đích, trong đó URL relay khớp với URL relay của gateway. Luồng phát hành App Store công khai không chấp nhận ghi đè URL relay tùy chỉnh. Nếu bạn đang dùng bản dựng relay tùy chỉnh, hãy đặt URL relay gateway tương ứng:

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

Cách luồng hoạt động:

- Ứng dụng iOS đăng ký với relay bằng App Attest và StoreKit app transaction JWS.
- Relay trả về một relay handle mờ đục cùng một send grant theo phạm vi đăng ký.
- Ứng dụng iOS lấy danh tính gateway đã ghép đôi và đưa nó vào đăng ký relay, để đăng ký dựa trên relay được ủy quyền cho gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó tới gateway đã ghép đôi bằng `push.apns.register`.
- Gateway dùng relay handle đã lưu đó cho `push.test`, các lần đánh thức nền, và các gợi ý đánh thức.
- URL relay gateway tùy chỉnh phải khớp với URL relay được nhúng trong bản dựng iOS.
- Nếu sau đó ứng dụng kết nối tới một gateway khác hoặc một bản dựng có URL cơ sở relay khác, nó sẽ làm mới đăng ký relay thay vì dùng lại ràng buộc cũ.

Những gì gateway **không** cần cho đường dẫn này:

- Không cần token relay trên toàn bộ triển khai.
- Không cần khóa APNs trực tiếp cho các lần gửi chính thức từ App Store dựa trên relay.

Luồng dự kiến cho operator:

1. Cài đặt ứng dụng iOS chính thức.
2. Tùy chọn: chỉ đặt `gateway.push.apns.relay.baseUrl` trên gateway khi dùng một bản dựng relay tùy chỉnh được tách riêng có chủ đích.
3. Ghép đôi ứng dụng với gateway và để ứng dụng kết nối xong.
4. Ứng dụng tự động công bố `push.apns.register` sau khi có token APNs, phiên operator đã kết nối, và đăng ký relay thành công.
5. Sau đó, `push.test`, các lần đánh thức để kết nối lại, và gợi ý đánh thức có thể dùng đăng ký dựa trên relay đã lưu.

## Beacon báo còn sống trong nền

Khi iOS đánh thức ứng dụng cho silent push, làm mới nền, hoặc sự kiện vị trí quan trọng, ứng dụng
cố gắng kết nối lại node trong thời gian ngắn rồi gọi `node.event` với `event: "node.presence.alive"`.
Gateway ghi nhận điều này dưới dạng `lastSeenAtMs`/`lastSeenReason` trên metadata node/thiết bị đã ghép đôi chỉ
sau khi biết danh tính thiết bị node đã xác thực.

Ứng dụng chỉ xem một lần đánh thức nền là đã được ghi nhận thành công khi phản hồi của gateway bao gồm
`handled: true`. Các gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó
tương thích nhưng không được tính là một cập nhật last-seen bền vững.

Ghi chú tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một ghi đè env tạm thời cho gateway.
- Luồng phát hành App Store công khai từ chối `OPENCLAW_PUSH_RELAY_BASE_URL` cho các bản dựng iOS.

## Luồng xác thực và tin cậy

Relay tồn tại để thực thi hai ràng buộc mà APNs trực tiếp trên gateway không thể cung cấp cho
các bản dựng iOS chính thức:

- Chỉ các bản dựng iOS OpenClaw chính hãng được phân phối qua Apple mới có thể dùng relay được lưu trữ.
- Gateway chỉ có thể gửi push dựa trên relay cho các thiết bị iOS đã ghép đôi với đúng gateway
  đó.

Theo từng chặng:

1. `iOS app -> gateway`
   - Trước tiên ứng dụng ghép đôi với gateway qua luồng xác thực Gateway thông thường.
   - Việc đó cấp cho ứng dụng một phiên node đã xác thực cùng một phiên operator đã xác thực.
   - Phiên operator được dùng để gọi `gateway.identity.get`.

2. `iOS app -> relay`
   - Ứng dụng gọi các endpoint đăng ký relay qua HTTPS.
   - Đăng ký bao gồm bằng chứng App Attest cùng một StoreKit app transaction JWS.
   - Relay xác thực bundle ID, bằng chứng App Attest, và bằng chứng phân phối Apple, đồng thời yêu cầu
     đường dẫn phân phối chính thức/production.
   - Đây là điều chặn các bản dựng Xcode/dev cục bộ dùng relay được lưu trữ. Một bản dựng cục bộ có thể được
     ký, nhưng nó không thỏa mãn bằng chứng phân phối Apple chính thức mà relay mong đợi.

3. `gateway identity delegation`
   - Trước khi đăng ký relay, ứng dụng lấy danh tính gateway đã ghép đôi từ
     `gateway.identity.get`.
   - Ứng dụng đưa danh tính gateway đó vào payload đăng ký relay.
   - Relay trả về một relay handle và một send grant theo phạm vi đăng ký được ủy quyền cho
     danh tính gateway đó.

4. `gateway -> relay`
   - Gateway lưu relay handle và send grant từ `push.apns.register`.
   - Khi `push.test`, đánh thức để kết nối lại, và gợi ý đánh thức, gateway ký yêu cầu gửi bằng
     danh tính thiết bị của chính nó.
   - Relay xác minh cả send grant đã lưu và chữ ký gateway dựa trên danh tính
     gateway được ủy quyền từ đăng ký.
   - Gateway khác không thể dùng lại đăng ký đã lưu đó, ngay cả khi bằng cách nào đó lấy được handle.

5. `relay -> APNs`
   - Relay sở hữu thông tin xác thực APNs production và token APNs thô cho bản dựng chính thức.
   - Gateway không bao giờ lưu token APNs thô cho các bản dựng chính thức dựa trên relay.
   - Relay gửi push cuối cùng tới APNs thay mặt gateway đã ghép đôi.

Lý do thiết kế này được tạo ra:

- Để giữ thông tin xác thực APNs production bên ngoài gateway của người dùng.
- Để tránh lưu token APNs thô của bản dựng chính thức trên gateway.
- Để chỉ cho phép bản dựng iOS OpenClaw chính thức dùng relay được lưu trữ.
- Để ngăn một gateway gửi push đánh thức tới các thiết bị iOS thuộc gateway khác.

Các bản dựng cục bộ/thủ công vẫn dùng APNs trực tiếp. Nếu bạn đang kiểm thử các bản dựng đó không qua relay,
gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Đây là các biến env runtime trên máy chủ gateway, không phải cài đặt Fastlane. `apps/ios/fastlane/.env` chỉ lưu
xác thực App Store Connect như `APP_STORE_CONNECT_KEY_ID` và
`APP_STORE_CONNECT_ISSUER_ID`; nó không cấu hình phân phối APNs trực tiếp cho các bản dựng iOS cục bộ.

Lưu trữ khuyến nghị trên máy chủ gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Không commit tệp `.p8` hoặc đặt nó trong checkout repo.

## Đường dẫn khám phá

### Bonjour (LAN)

Ứng dụng iOS duyệt `_openclaw-gw._tcp` trên `local.` và, khi được cấu hình, cùng
miền khám phá DNS-SD diện rộng. Các gateway cùng LAN tự động xuất hiện từ `local.`;
khám phá xuyên mạng có thể dùng miền diện rộng đã cấu hình mà không thay đổi loại beacon.

### Tailnet (xuyên mạng)

Nếu mDNS bị chặn, hãy dùng một vùng unicast DNS-SD (chọn một miền; ví dụ:
`openclaw.internal.`) và Tailscale split DNS.
Xem [Bonjour](/vi/gateway/bonjour) để biết ví dụ CoreDNS.

### Host/port thủ công

Trong Settings, bật **Manual Host** và nhập host gateway + port (mặc định `18789`).

## Canvas + A2UI

Node iOS hiển thị canvas WKWebView. Dùng `node.invoke` để điều khiển nó:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Ghi chú:

- Máy chủ canvas của Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/`.
- Nó được phục vụ từ máy chủ HTTP của Gateway (cùng port với `gateway.port`, mặc định `18789`).
- Node iOS giữ scaffold tích hợp làm chế độ xem mặc định khi đã kết nối. `canvas.a2ui.push` và `canvas.a2ui.reset` dùng trang A2UI đi kèm thuộc sở hữu ứng dụng.
- Các trang A2UI Gateway từ xa chỉ được render trên iOS; các hành động nút A2UI native chỉ được chấp nhận từ các trang đi kèm thuộc sở hữu ứng dụng.
- Quay lại scaffold tích hợp bằng `canvas.navigate` và `{"url":""}`.

## Quan hệ với Computer Use

Ứng dụng iOS là một bề mặt node di động, không phải backend Codex Computer Use. Codex
Computer Use và `cua-driver mcp` điều khiển desktop macOS cục bộ qua các công cụ
MCP; ứng dụng iOS cung cấp các khả năng iPhone qua lệnh node của OpenClaw
như `canvas.*`, `camera.*`, `screen.*`, `location.*`, và `talk.*`.

Agent vẫn có thể vận hành ứng dụng iOS qua OpenClaw bằng cách gọi các lệnh
node, nhưng các lời gọi đó đi qua giao thức node của gateway và tuân theo các giới hạn
foreground/background của iOS. Dùng [Codex Computer Use](/vi/plugins/codex-computer-use)
để điều khiển desktop cục bộ và trang này cho các khả năng node iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake và talk mode có sẵn trong Settings.
- OpenAI realtime Talk dùng WebRTC do client sở hữu khi `talk.realtime.transport` là `webrtc`; cấu hình `gateway-relay` rõ ràng vẫn do Gateway sở hữu. Xem [Talk mode](/vi/nodes/talk).
- Các node iOS hỗ trợ Talk quảng bá khả năng `talk` và có thể khai báo
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, và `talk.ptt.once`;
  Gateway mặc định cho phép các lệnh push-to-talk đó với các node đáng tin cậy
  có hỗ trợ Talk.
- iOS có thể tạm ngưng âm thanh nền; hãy xem các tính năng giọng nói là best-effort khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS ra foreground (các lệnh canvas/camera/screen yêu cầu điều này).
- `A2UI_HOST_UNAVAILABLE`: trang A2UI đi kèm không truy cập được trong WebView của ứng dụng; giữ ứng dụng ở foreground trên tab Screen và thử lại.
- Prompt ghép đôi không bao giờ xuất hiện: chạy `openclaw devices list` và phê duyệt thủ công.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép đôi Keychain đã bị xóa; ghép đôi lại node.

## Tài liệu liên quan

- [Ghép nối](/vi/channels/pairing)
- [Khám phá](/vi/gateway/discovery)
- [Bonjour](/vi/gateway/bonjour)
