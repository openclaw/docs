---
read_when:
    - Ghép đôi hoặc kết nối lại Node iOS
    - Chạy ứng dụng iOS từ mã nguồn
    - Gỡ lỗi phát hiện Gateway hoặc các lệnh khung vẽ
summary: 'Ứng dụng node iOS: kết nối với Gateway, ghép đôi, canvas và khắc phục sự cố'
title: Ứng dụng iOS
x-i18n:
    generated_at: "2026-04-29T22:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Tình trạng: bản xem trước nội bộ. Ứng dụng iOS chưa được phân phối công khai.

## Chức năng

- Kết nối tới Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp các khả năng của Node: Canvas, ảnh chụp màn hình, chụp Camera, Vị trí, chế độ Talk, đánh thức bằng giọng nói.
- Nhận lệnh `node.invoke` và báo cáo các sự kiện trạng thái Node.

## Yêu cầu

- Gateway đang chạy trên một thiết bị khác (macOS, Linux hoặc Windows qua WSL2).
- Đường mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua unicast DNS-SD (miền ví dụ: `openclaw.internal.`), **hoặc**
  - Máy chủ/cổng thủ công (dự phòng).

## Bắt đầu nhanh (ghép nối + kết nối)

1. Khởi động Gateway:

```bash
openclaw gateway --port 18789
```

2. Trong ứng dụng iOS, mở Cài đặt và chọn một Gateway đã được phát hiện (hoặc bật Máy chủ thủ công và nhập máy chủ/cổng).

3. Phê duyệt yêu cầu ghép nối trên máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử ghép nối lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Tùy chọn: nếu Node iOS luôn kết nối từ một subnet được kiểm soát chặt chẽ, bạn
có thể chọn tự động phê duyệt Node lần đầu bằng CIDR tường minh hoặc IP chính xác:

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
không yêu cầu phạm vi. Ghép nối operator/trình duyệt và mọi thay đổi về vai trò, phạm vi, siêu dữ liệu hoặc
khóa công khai vẫn cần phê duyệt thủ công.

4. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push dựa trên relay cho bản dựng chính thức

Các bản dựng iOS được phân phối chính thức dùng relay push bên ngoài thay vì công bố token APNs thô
cho Gateway.

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
- Relay trả về một định danh relay mờ cùng quyền gửi giới hạn theo đăng ký.
- Ứng dụng iOS lấy danh tính Gateway đã ghép nối và đưa nó vào đăng ký relay, vì vậy đăng ký dựa trên relay được ủy quyền cho Gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó tới Gateway đã ghép nối bằng `push.apns.register`.
- Gateway dùng định danh relay đã lưu đó cho `push.test`, đánh thức nền và nhắc đánh thức.
- URL cơ sở relay của Gateway phải khớp với URL relay được nhúng trong bản dựng iOS chính thức/TestFlight.
- Nếu sau đó ứng dụng kết nối tới Gateway khác hoặc một bản dựng có URL cơ sở relay khác, nó sẽ làm mới đăng ký relay thay vì tái sử dụng liên kết cũ.

Những gì Gateway **không** cần cho đường dẫn này:

- Không cần token relay dùng chung cho toàn bộ triển khai.
- Không cần khóa APNs trực tiếp cho các lượt gửi dựa trên relay của bản chính thức/TestFlight.

Luồng operator dự kiến:

1. Cài đặt bản dựng iOS chính thức/TestFlight.
2. Đặt `gateway.push.apns.relay.baseUrl` trên Gateway.
3. Ghép nối ứng dụng với Gateway và để ứng dụng hoàn tất kết nối.
4. Ứng dụng tự động công bố `push.apns.register` sau khi có token APNs, phiên operator đã kết nối và đăng ký relay thành công.
5. Sau đó, `push.test`, đánh thức kết nối lại và nhắc đánh thức có thể dùng đăng ký dựa trên relay đã lưu.

## Tín hiệu alive trong nền

Khi iOS đánh thức ứng dụng bằng silent push, làm mới nền hoặc sự kiện vị trí quan trọng, ứng dụng
thử kết nối lại Node trong thời gian ngắn rồi gọi `node.event` với `event: "node.presence.alive"`.
Gateway ghi lại điều này dưới dạng `lastSeenAtMs`/`lastSeenReason` trong siêu dữ liệu Node/thiết bị đã ghép nối chỉ
sau khi danh tính thiết bị Node đã xác thực được biết.

Ứng dụng chỉ xem một lần đánh thức nền là đã được ghi nhận thành công khi phản hồi từ Gateway bao gồm
`handled: true`. Các Gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó
tương thích nhưng không được tính là cập nhật lần thấy gần nhất bền vững.

Ghi chú tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một biến môi trường ghi đè tạm thời cho Gateway.

## Luồng xác thực và tin cậy

Relay tồn tại để thực thi hai ràng buộc mà APNs trực tiếp trên Gateway không thể cung cấp cho
các bản dựng iOS chính thức:

- Chỉ các bản dựng iOS OpenClaw chính hãng được phân phối qua Apple mới có thể dùng relay lưu trữ.
- Một Gateway chỉ có thể gửi push dựa trên relay cho các thiết bị iOS đã ghép nối với chính
  Gateway đó.

Từng chặng:

1. `iOS app -> gateway`
   - Ứng dụng trước tiên ghép nối với Gateway qua luồng xác thực Gateway thông thường.
   - Việc đó cấp cho ứng dụng một phiên Node đã xác thực cùng một phiên operator đã xác thực.
   - Phiên operator được dùng để gọi `gateway.identity.get`.

2. `iOS app -> relay`
   - Ứng dụng gọi các endpoint đăng ký relay qua HTTPS.
   - Đăng ký bao gồm bằng chứng App Attest cùng một JWS giao dịch ứng dụng StoreKit.
   - Relay xác thực ID gói, bằng chứng App Attest và bằng chứng phân phối Apple, đồng thời yêu cầu
     đường dẫn phân phối chính thức/sản xuất.
   - Đây là cơ chế chặn các bản dựng Xcode/dev cục bộ dùng relay lưu trữ. Một bản dựng cục bộ có thể được
     ký, nhưng nó không đáp ứng bằng chứng phân phối Apple chính thức mà relay mong đợi.

3. `gateway identity delegation`
   - Trước khi đăng ký relay, ứng dụng lấy danh tính Gateway đã ghép nối từ
     `gateway.identity.get`.
   - Ứng dụng đưa danh tính Gateway đó vào payload đăng ký relay.
   - Relay trả về một định danh relay và một quyền gửi giới hạn theo đăng ký được ủy quyền cho
     danh tính Gateway đó.

4. `gateway -> relay`
   - Gateway lưu định danh relay và quyền gửi từ `push.apns.register`.
   - Khi `push.test`, đánh thức kết nối lại và nhắc đánh thức, Gateway ký yêu cầu gửi bằng
     danh tính thiết bị của chính nó.
   - Relay xác minh cả quyền gửi đã lưu và chữ ký Gateway đối chiếu với danh tính
     Gateway được ủy quyền từ đăng ký.
   - Gateway khác không thể tái sử dụng đăng ký đã lưu đó, ngay cả khi bằng cách nào đó lấy được định danh.

5. `relay -> APNs`
   - Relay sở hữu thông tin xác thực APNs sản xuất và token APNs thô cho bản dựng chính thức.
   - Gateway không bao giờ lưu token APNs thô cho các bản dựng chính thức dựa trên relay.
   - Relay gửi push cuối cùng tới APNs thay mặt Gateway đã ghép nối.

Lý do thiết kế này được tạo ra:

- Để giữ thông tin xác thực APNs sản xuất khỏi các Gateway của người dùng.
- Để tránh lưu token APNs thô của bản dựng chính thức trên Gateway.
- Để chỉ cho phép dùng relay lưu trữ với các bản dựng OpenClaw chính thức/TestFlight.
- Để ngăn một Gateway gửi push đánh thức tới thiết bị iOS thuộc một Gateway khác.

Các bản dựng cục bộ/thủ công vẫn dùng APNs trực tiếp. Nếu bạn đang kiểm thử các bản dựng đó mà không dùng relay,
Gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Đây là các biến môi trường thời gian chạy trên máy chủ Gateway, không phải cài đặt Fastlane. `apps/ios/fastlane/.env` chỉ lưu
xác thực App Store Connect / TestFlight như `ASC_KEY_ID` và `ASC_ISSUER_ID`; nó không cấu hình
phân phối APNs trực tiếp cho các bản dựng iOS cục bộ.

Lưu trữ khuyến nghị trên máy chủ Gateway:

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
miền phát hiện DNS-SD diện rộng. Các Gateway cùng LAN tự động xuất hiện từ `local.`;
phát hiện xuyên mạng có thể dùng miền diện rộng đã cấu hình mà không cần thay đổi loại beacon.

### Tailnet (xuyên mạng)

Nếu mDNS bị chặn, hãy dùng một vùng unicast DNS-SD (chọn một miền; ví dụ:
`openclaw.internal.`) và Tailscale split DNS.
Xem [Bonjour](/vi/gateway/bonjour) để biết ví dụ CoreDNS.

### Máy chủ/cổng thủ công

Trong Cài đặt, bật **Máy chủ thủ công** và nhập máy chủ Gateway + cổng (mặc định `18789`).

## Canvas + A2UI

Node iOS hiển thị canvas WKWebView. Dùng `node.invoke` để điều khiển nó:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Ghi chú:

- Máy chủ canvas của Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/`.
- Nó được phục vụ từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
- Node iOS tự động điều hướng tới A2UI khi kết nối nếu URL máy chủ canvas được quảng bá.
- Quay lại scaffold tích hợp bằng `canvas.navigate` và `{"url":""}`.

## Quan hệ với Computer Use

Ứng dụng iOS là một bề mặt Node di động, không phải backend Codex Computer Use. Codex
Computer Use và `cua-driver mcp` điều khiển một desktop macOS cục bộ qua công cụ MCP;
ứng dụng iOS cung cấp các khả năng iPhone qua lệnh Node OpenClaw
như `canvas.*`, `camera.*`, `screen.*`, `location.*` và `talk.*`.

Agent vẫn có thể vận hành ứng dụng iOS qua OpenClaw bằng cách gọi lệnh Node,
nhưng các lời gọi đó đi qua giao thức Node của Gateway và tuân theo giới hạn tiền cảnh/nền của iOS.
Dùng [Codex Computer Use](/vi/plugins/codex-computer-use)
để điều khiển desktop cục bộ và dùng trang này cho các khả năng Node iOS.

### Eval / ảnh chụp Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Đánh thức bằng giọng nói + chế độ Talk

- Đánh thức bằng giọng nói và chế độ Talk có trong Cài đặt.
- iOS có thể tạm dừng âm thanh nền; hãy xem các tính năng giọng nói là nỗ lực tốt nhất khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS ra tiền cảnh (các lệnh canvas/camera/screen yêu cầu điều này).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway không quảng bá URL máy chủ canvas; kiểm tra `canvasHost` trong [cấu hình Gateway](/vi/gateway/configuration).
- Lời nhắc ghép nối không bao giờ xuất hiện: chạy `openclaw devices list` và phê duyệt thủ công.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép nối Keychain đã bị xóa; hãy ghép nối lại Node.

## Tài liệu liên quan

- [Ghép nối](/vi/channels/pairing)
- [Phát hiện](/vi/gateway/discovery)
- [Bonjour](/vi/gateway/bonjour)
