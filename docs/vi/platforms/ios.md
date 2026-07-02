---
read_when:
    - Ghép nối hoặc kết nối lại nút iOS
    - Chạy ứng dụng iOS từ mã nguồn
    - Gỡ lỗi phát hiện Gateway hoặc lệnh canvas
summary: 'Ứng dụng nút iOS: kết nối với Gateway, ghép đôi, canvas và khắc phục sự cố'
title: ứng dụng iOS
x-i18n:
    generated_at: "2026-07-02T08:27:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

Tình trạng khả dụng: các bản dựng ứng dụng iPhone được phân phối qua các kênh của Apple khi được bật cho một bản phát hành. Các bản dựng phát triển cục bộ cũng có thể chạy từ mã nguồn.

## Chức năng

- Kết nối tới Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp các năng lực của nút: Canvas, ảnh chụp nhanh màn hình, chụp Camera, vị trí, chế độ Talk, đánh thức bằng giọng nói.
- Nhận các lệnh `node.invoke` và báo cáo sự kiện trạng thái nút.

## Yêu cầu

- Gateway đang chạy trên một thiết bị khác (macOS, Linux, hoặc Windows qua WSL2).
- Đường mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua DNS-SD unicast (miền ví dụ: `openclaw.internal.`), **hoặc**
  - Máy chủ/cổng thủ công (dự phòng).

## Khởi động nhanh (ghép đôi + kết nối)

1. Khởi động Gateway:

```bash
openclaw gateway --port 18789
```

2. Trong ứng dụng iOS, mở Settings và chọn một gateway đã phát hiện (hoặc bật Manual Host và nhập máy chủ/cổng).

3. Phê duyệt yêu cầu ghép đôi trên máy chủ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử ghép đôi lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Tùy chọn: nếu nút iOS luôn kết nối từ một subnet được kiểm soát chặt chẽ, bạn
có thể chọn tự động phê duyệt nút lần đầu bằng các CIDR rõ ràng hoặc IP chính xác:

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

4. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push dựa trên relay cho bản dựng chính thức

Các bản dựng iOS được phân phối chính thức dùng relay push bên ngoài thay vì công bố token APNs thô
cho gateway.

Các bản dựng App Store chính thức từ luồng phát hành công khai dùng relay được lưu trữ tại `https://ios-push-relay.openclaw.ai`.

Triển khai relay tùy chỉnh yêu cầu một đường dẫn dựng/triển khai iOS được tách riêng có chủ ý, trong đó URL relay khớp với URL relay của gateway. Luồng phát hành App Store công khai không chấp nhận ghi đè URL relay tùy chỉnh. Nếu bạn đang dùng bản dựng relay tùy chỉnh, hãy đặt URL relay gateway tương ứng:

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

- Ứng dụng iOS đăng ký với relay bằng App Attest và một JWS giao dịch ứng dụng StoreKit.
- Relay trả về một handle relay mờ cùng với một quyền gửi theo phạm vi đăng ký.
- Ứng dụng iOS lấy danh tính gateway đã ghép đôi và đưa nó vào đăng ký relay, vì vậy đăng ký dựa trên relay được ủy quyền cho gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó tới gateway đã ghép đôi bằng `push.apns.register`.
- Gateway dùng handle relay đã lưu đó cho `push.test`, đánh thức nền và nhắc đánh thức.
- URL relay gateway tùy chỉnh phải khớp với URL relay được nhúng trong bản dựng iOS.
- Nếu sau đó ứng dụng kết nối tới một gateway khác hoặc một bản dựng có URL cơ sở relay khác, ứng dụng sẽ làm mới đăng ký relay thay vì dùng lại ràng buộc cũ.

Những thứ gateway **không** cần cho đường dẫn này:

- Không cần token relay toàn triển khai.
- Không cần khóa APNs trực tiếp cho các lượt gửi dựa trên relay của App Store chính thức.

Luồng dự kiến cho operator:

1. Cài đặt ứng dụng iOS chính thức.
2. Tùy chọn: đặt `gateway.push.apns.relay.baseUrl` trên gateway chỉ khi dùng một bản dựng relay tùy chỉnh được tách riêng có chủ ý.
3. Ghép đôi ứng dụng với gateway và để ứng dụng hoàn tất kết nối.
4. Ứng dụng tự động công bố `push.apns.register` sau khi có token APNs, phiên operator đã kết nối và đăng ký relay thành công.
5. Sau đó, `push.test`, đánh thức kết nối lại và nhắc đánh thức có thể dùng đăng ký dựa trên relay đã lưu.

## Beacon báo còn hoạt động trong nền

Khi iOS đánh thức ứng dụng vì push im lặng, làm mới nền hoặc sự kiện vị trí quan trọng, ứng dụng
thử kết nối lại nút trong thời gian ngắn rồi gọi `node.event` với `event: "node.presence.alive"`.
Gateway chỉ ghi nhận thông tin này dưới dạng `lastSeenAtMs`/`lastSeenReason` trong siêu dữ liệu nút/thiết bị đã ghép đôi
sau khi danh tính thiết bị nút đã xác thực được biết.

Ứng dụng chỉ xem một lần đánh thức nền là đã được ghi nhận thành công khi phản hồi của gateway có
`handled: true`. Các gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó
tương thích nhưng không được tính là một bản cập nhật last-seen bền vững.

Ghi chú tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một env ghi đè tạm thời cho gateway.
- Luồng phát hành App Store công khai từ chối `OPENCLAW_PUSH_RELAY_BASE_URL` cho các bản dựng iOS.

## Luồng xác thực và tin cậy

Relay tồn tại để thực thi hai ràng buộc mà APNs trực tiếp trên gateway không thể cung cấp cho
các bản dựng iOS chính thức:

- Chỉ các bản dựng iOS OpenClaw thật được phân phối qua Apple mới có thể dùng relay được lưu trữ.
- Một gateway chỉ có thể gửi push dựa trên relay cho các thiết bị iOS đã ghép đôi với gateway cụ thể đó.

Từng chặng:

1. `iOS app -> gateway`
   - Trước tiên ứng dụng ghép đôi với gateway qua luồng xác thực Gateway thông thường.
   - Việc đó cấp cho ứng dụng một phiên nút đã xác thực cùng với một phiên operator đã xác thực.
   - Phiên operator được dùng để gọi `gateway.identity.get`.

2. `iOS app -> relay`
   - Ứng dụng gọi các endpoint đăng ký relay qua HTTPS.
   - Đăng ký bao gồm bằng chứng App Attest cùng với JWS giao dịch ứng dụng StoreKit.
   - Relay xác thực bundle ID, bằng chứng App Attest và bằng chứng phân phối Apple, đồng thời yêu cầu
     đường dẫn phân phối chính thức/production.
   - Đây là cơ chế chặn các bản dựng Xcode/dev cục bộ dùng relay được lưu trữ. Một bản dựng cục bộ có thể được
     ký, nhưng không thỏa mãn bằng chứng phân phối Apple chính thức mà relay mong đợi.

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
   - Relay xác minh cả quyền gửi đã lưu và chữ ký gateway theo danh tính
     gateway được ủy quyền từ đăng ký.
   - Một gateway khác không thể dùng lại đăng ký đã lưu đó, ngay cả khi bằng cách nào đó có được handle.

5. `relay -> APNs`
   - Relay sở hữu thông tin xác thực APNs production và token APNs thô cho bản dựng chính thức.
   - Gateway không bao giờ lưu token APNs thô cho các bản dựng chính thức dựa trên relay.
   - Relay gửi push cuối cùng tới APNs thay mặt gateway đã ghép đôi.

Lý do thiết kế này được tạo ra:

- Để giữ thông tin xác thực APNs production bên ngoài gateway của người dùng.
- Để tránh lưu token APNs thô của bản dựng chính thức trên gateway.
- Để chỉ cho phép các bản dựng iOS OpenClaw chính thức dùng relay được lưu trữ.
- Để ngăn một gateway gửi push đánh thức tới các thiết bị iOS thuộc về một gateway khác.

Các bản dựng cục bộ/thủ công vẫn dùng APNs trực tiếp. Nếu bạn đang kiểm thử các bản dựng đó mà không dùng relay,
gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Đây là các env var runtime trên máy chủ gateway, không phải thiết lập Fastlane. `apps/ios/fastlane/.env` chỉ lưu
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

Không commit tệp `.p8` hoặc đặt nó trong checkout repo.

## Đường dẫn phát hiện

### Bonjour (LAN)

Ứng dụng iOS duyệt `_openclaw-gw._tcp` trên `local.` và, khi được cấu hình, cùng
miền phát hiện DNS-SD diện rộng. Các gateway cùng LAN tự động xuất hiện từ `local.`;
phát hiện liên mạng có thể dùng miền diện rộng đã cấu hình mà không thay đổi loại beacon.

### Tailnet (liên mạng)

Nếu mDNS bị chặn, hãy dùng một vùng DNS-SD unicast (chọn một miền; ví dụ:
`openclaw.internal.`) và Tailscale split DNS.
Xem [Bonjour](/vi/gateway/bonjour) để biết ví dụ CoreDNS.

### Máy chủ/cổng thủ công

Trong Settings, bật **Manual Host** và nhập máy chủ gateway + cổng (mặc định `18789`).

## Canvas + A2UI

Nút iOS hiển thị một canvas WKWebView. Dùng `node.invoke` để điều khiển nó:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Ghi chú:

- Máy chủ Canvas của Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/`.
- Nó được phục vụ từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
- Nút iOS giữ scaffold tích hợp làm chế độ xem mặc định khi đã kết nối. `canvas.a2ui.push` và `canvas.a2ui.reset` dùng trang A2UI thuộc sở hữu ứng dụng được đóng gói.
- Các trang A2UI Gateway từ xa chỉ được render trên iOS; hành động nút A2UI native chỉ được chấp nhận từ các trang thuộc sở hữu ứng dụng được đóng gói.
- Quay lại scaffold tích hợp bằng `canvas.navigate` và `{"url":""}`.

## Quan hệ với Computer Use

Ứng dụng iOS là một bề mặt nút di động, không phải backend Codex Computer Use. Codex
Computer Use và `cua-driver mcp` điều khiển desktop macOS cục bộ qua các công cụ MCP;
ứng dụng iOS cung cấp năng lực iPhone qua các lệnh nút OpenClaw
như `canvas.*`, `camera.*`, `screen.*`, `location.*` và `talk.*`.

Agent vẫn có thể vận hành ứng dụng iOS qua OpenClaw bằng cách gọi các lệnh
nút, nhưng các lệnh gọi đó đi qua giao thức nút gateway và tuân theo giới hạn
foreground/background của iOS. Dùng [Codex Computer Use](/vi/plugins/codex-computer-use)
để điều khiển desktop cục bộ và dùng trang này cho các năng lực nút iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Đánh thức bằng giọng nói + chế độ Talk

- Đánh thức bằng giọng nói và chế độ Talk có trong Settings.
- Các nút iOS hỗ trợ Talk quảng bá năng lực `talk` và có thể khai báo
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` và `talk.ptt.once`;
  Gateway cho phép các lệnh push-to-talk đó theo mặc định đối với các
  nút đáng tin cậy có hỗ trợ Talk.
- iOS có thể tạm dừng âm thanh nền; hãy xem các tính năng giọng nói là best-effort khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS ra foreground (các lệnh canvas/camera/screen yêu cầu điều này).
- `A2UI_HOST_UNAVAILABLE`: trang A2UI được đóng gói không truy cập được trong WebView của ứng dụng; giữ ứng dụng ở foreground trên tab Screen và thử lại.
- Lời nhắc ghép đôi không bao giờ xuất hiện: chạy `openclaw devices list` và phê duyệt thủ công.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép đôi trong Keychain đã bị xóa; ghép đôi lại nút.

## Tài liệu liên quan

- [Ghép đôi](/vi/channels/pairing)
- [Phát hiện](/vi/gateway/discovery)
- [Bonjour](/vi/gateway/bonjour)
