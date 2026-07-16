---
read_when:
    - Ghép nối hoặc kết nối lại Node iOS
    - Bật hoặc khắc phục sự cố Node Apple Watch trực tiếp
    - Chạy ứng dụng iOS từ mã nguồn
    - Gỡ lỗi phát hiện Gateway hoặc các lệnh canvas
summary: 'Ứng dụng Node trên iOS: kết nối với Gateway, ghép đôi, canvas và khắc phục sự cố'
title: Ứng dụng iOS
x-i18n:
    generated_at: "2026-07-16T14:48:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Tính khả dụng: các bản dựng ứng dụng iPhone được phân phối qua các kênh của Apple khi được bật cho một bản phát hành. Các bản dựng phát triển cục bộ cũng có thể chạy từ mã nguồn.

## Chức năng

- Kết nối với Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp các khả năng của node: Canvas, ảnh chụp Màn hình, chụp ảnh bằng Camera, Vị trí, chế độ Trò chuyện, kích hoạt bằng giọng nói và bản tóm tắt Sức khỏe tùy chọn.
- Nhận các lệnh `node.invoke` và báo cáo các sự kiện trạng thái của node.
- Duyệt không gian làm việc của agent đã chọn ở chế độ chỉ đọc từ giao diện Agent (Tệp): đi sâu vào thư mục, xem trước văn bản có tô sáng cú pháp, xem trước hình ảnh và xuất qua bảng chia sẻ. Không có thao tác ghi; kích thước bản xem trước bị giới hạn bởi gateway.
- Duy trì một bộ nhớ đệm ngoại tuyến nhỏ, chỉ đọc cho các phiên trò chuyện và bản ghi gần đây trên từng gateway đã ghép đôi: khi khởi động nguội, bản ghi gần nhất đã biết sẽ hiển thị ngay lập tức rồi được làm mới khi gateway phản hồi; vẫn có thể duyệt các cuộc trò chuyện gần đây khi mất kết nối; thao tác đặt lại/quên sẽ xóa bộ nhớ đệm cục bộ được bảo vệ.
- Xếp hàng các tin nhắn văn bản được gửi khi mất kết nối trong hộp thư đi bền vững riêng cho từng gateway (tối đa 50): bong bóng đang chờ được hiển thị trong bản ghi, được gửi theo thứ tự khi kết nối lại với cơ chế thử lại lũy đẳng, tiếp tục được lưu bền vững cho đến khi lịch sử chuẩn xác nhận việc gửi, thử lại với thời gian chờ tăng dần trước khi hiển thị thao tác thử lại/xóa và hết hạn thay vì gửi sau 48 giờ ngoại tuyến; thao tác đặt lại/quên sẽ xóa hàng đợi cùng bộ nhớ đệm.
- Đọc thành tiếng tin nhắn của trợ lý theo yêu cầu: nhấn giữ một tin nhắn trong Trò chuyện và chọn **Nghe**. Ứng dụng phát các đoạn âm thanh `tts.speak` được gateway hỗ trợ bằng nhà cung cấp TTS đã cấu hình và chuyển sang giọng nói trên thiết bị khi âm thanh từ gateway không khả dụng hoặc không thể phát. Việc phát dừng khi chuyển phiên hoặc đưa ứng dụng xuống nền.

## Yêu cầu

- Gateway đang chạy trên một thiết bị khác (macOS, Linux hoặc Windows qua WSL2).
- Đường dẫn mạng:
  - Cùng LAN qua Bonjour, **hoặc**
  - Tailnet qua DNS-SD unicast (tên miền ví dụ: `openclaw.internal.`), **hoặc**
  - Máy chủ/cổng thủ công (dự phòng).

## Bắt đầu nhanh (ghép đôi + kết nối)

Ở lần khởi chạy đầu tiên, ứng dụng sẽ hướng dẫn ngắn gọn về việc ghép đôi và hiển thị
trang quyền truy cập (thông báo, camera, micrô, ảnh, danh bạ,
lịch, lời nhắc, vị trí). Mọi quyền đều là tùy chọn và có thể được thay đổi
sau trong **Cài đặt** -> **Quyền**, hoặc trong ứng dụng Cài đặt của iOS.

1. Khởi động một Gateway đã xác thực với tuyến đường mà điện thoại có thể truy cập. Tailscale
   Serve là đường dẫn từ xa được khuyến nghị:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Đối với thiết lập đáng tin cậy trên cùng LAN, hãy sử dụng một `gateway.bind: "lan"` đã xác thực
thay thế. Liên kết loopback mặc định không thể truy cập từ điện thoại. Nếu
Gateway chưa được cấu hình, hãy chạy `openclaw onboard` trước để quá trình tạo mã thiết lập
có đường dẫn xác thực bằng token hoặc mật khẩu.

2. Mở [Giao diện điều khiển](/vi/web/control-ui), chọn **Node** và nhấp vào
   **Ghép đôi thiết bị di động** trên trang **Thiết bị**. Quyền truy cập đầy đủ được khuyến nghị
   và được chọn theo mặc định; chỉ chọn Quyền truy cập giới hạn khi muốn loại bỏ
   các chức năng điều khiển Gateway dành cho quản trị viên, sau đó nhấp vào **Tạo mã thiết lập**.

3. Trong ứng dụng iOS, mở **Cài đặt** -> **Gateway**, quét mã QR (hoặc dán
   mã thiết lập) và kết nối.

   Nếu mã thiết lập chứa cả tuyến LAN và Tailscale Serve, ứng dụng
   sẽ lần lượt kiểm tra chúng và lưu điểm cuối đầu tiên có thể truy cập.

4. Ứng dụng chính thức tự động kết nối. Nếu **Đang chờ phê duyệt** hiển thị một
   yêu cầu, hãy xem xét vai trò và phạm vi của yêu cầu đó trước khi phê duyệt.

   **Cài đặt → Gateway** cho biết kết nối người vận hành đã lưu có quyền truy cập
   **Đầy đủ** hay **Giới hạn**. Thiết lập `ws://` LAN văn bản thuần được tự động
   giới hạn để bảo vệ bearer token. Nếu bị giới hạn, hãy cấu hình `wss://` hoặc
   Tailscale Serve, quét mã quyền truy cập đầy đủ mới từ Giao diện điều khiển hoặc `openclaw qr`,
   rồi kết nối lại để bật cài đặt và nâng cấp.

Nút Giao diện điều khiển yêu cầu một phiên đã ghép đôi với `operator.admin`.
Để dùng phương án dự phòng trong terminal, hãy chọn một gateway đã được phát hiện trong ứng dụng iOS (hoặc bật
Máy chủ thủ công và nhập máy chủ/cổng), sau đó phê duyệt yêu cầu trên máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử ghép đôi lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ được thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Tùy chọn: nếu node iOS luôn kết nối từ một mạng con được kiểm soát chặt chẽ, bạn có thể chủ động bật tính năng tự động phê duyệt node lần đầu bằng các CIDR rõ ràng hoặc địa chỉ IP chính xác:

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

Tính năng này mặc định bị tắt. Tính năng chỉ áp dụng cho việc ghép đôi `role: node` mới mà không yêu cầu phạm vi nào. Việc ghép đôi người vận hành/trình duyệt và mọi thay đổi về vai trò, phạm vi, siêu dữ liệu hoặc khóa công khai vẫn cần được phê duyệt thủ công.

5. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Bản tóm tắt sức khỏe

Node iOS có thể trả về dữ liệu tổng hợp HealthKit chỉ đọc, tùy chọn cho ngày
dương lịch hiện tại. Sự đồng ý trên iPhone và quyền thực thi lệnh Gateway rõ ràng là
hai điều kiện độc lập. Xem [Bản tóm tắt HealthKit](/platforms/ios-healthkit) để biết
cách thiết lập, gọi lệnh, các trường tải trọng, cơ chế bảo mật và khắc phục sự cố.

Theo mặc định, ứng dụng đồng hành trên Apple Watch tiếp tục sử dụng bộ chuyển tiếp iPhone hiện có và
không cần ghép đôi Gateway riêng. Ghép đôi Watch với iPhone trong
ứng dụng Watch của Apple, cài đặt OpenClaw từ **Watch app -> My Watch -> Available
Apps**, sau đó mở OpenClaw một lần trên cả hai thiết bị.

## Xem xét phê duyệt lệnh

Kết nối người vận hành có `operator.admin`, hoặc kết nối
`operator.approvals` đã ghép đôi được Gateway nhắm đến rõ ràng, có thể xem xét
các yêu cầu thực thi đang chờ trên iPhone. Thẻ phê duyệt hiển thị bản xem trước lệnh đã được
Gateway làm sạch, cảnh báo, ngữ cảnh máy chủ, thời điểm hết hạn và chỉ những
quyết định mà yêu cầu đó cung cấp. Apple Watch đã ghép đôi nhận cùng một
lời nhắc an toàn cho người xem xét qua bộ chuyển tiếp iPhone hiện có và cung cấp tập hợp con
quyết định cho phép một lần/từ chối nhỏ gọn. Chế độ Gateway trực tiếp trên Watch không truyền
lời nhắc phê duyệt.

Trạng thái phê duyệt được chia sẻ với Giao diện điều khiển và các giao diện trò chuyện được hỗ trợ.
Câu trả lời được ghi nhận đầu tiên sẽ có hiệu lực. iPhone và Watch truy xuất bản ghi
kết thúc chuẩn của Gateway sau khi một giao diện khác giải quyết yêu cầu, sau một
thông báo giải quyết từ xa và bất cứ khi nào xác nhận giải quyết có thể đã bị
mất. Các thao tác vẫn không khả dụng cho đến khi lần đọc lại đó xác nhận liệu
yêu cầu còn đang chờ hay không.

Quyền sở hữu phê duyệt được ràng buộc với Gateway đã chọn. Việc chuyển đổi gateway không thể
áp dụng lời nhắc cũ cho kết nối thay thế. Các Gateway có trước
các phương thức phê duyệt hợp nhất sẽ chuyển về các phương thức dành riêng cho thực thi đã phát hành;
trạng thái kết thúc được lưu giữ và kết quả đa giao diện phong phú hơn yêu cầu
Gateway đã được cập nhật.

## Node Apple Watch trực tiếp tùy chọn

Chế độ trực tiếp cung cấp cho đồng hồ danh tính node đã ký và kết nối Gateway riêng.
Các lệnh node được hỗ trợ tiếp tục hoạt động qua Wi-Fi hoặc mạng di động của đồng hồ khi
OpenClaw đang hoạt động, ngay cả khi iPhone đã ghép đôi không khả dụng.

Yêu cầu:

- iPhone được kết nối với Gateway bằng phạm vi `operator.admin`.
- Mã thiết lập quảng bá một điểm cuối Gateway `wss://` có chứng chỉ được
  watchOS tin cậy; đồng hồ thăm dò nguồn `https://` tương ứng. HTTP văn bản thuần và
  độ tin cậy chỉ dựa trên chứng chỉ tự ký hoặc vân tay không được hỗ trợ. Xem [Ghép đôi do Gateway quản lý
  ](/vi/gateway/pairing) để biết cấu hình điểm cuối. Các tuyến loopback, chỉ dành cho iPhone
  và chỉ dành cho tailnet không thể được đồng hồ truy cập độc lập.
- Việc sử dụng mạng di động yêu cầu Apple Watch hỗ trợ mạng di động với dịch vụ đang hoạt động.
- OpenClaw đang hoạt động trên đồng hồ. Apple không cho phép các ứng dụng watchOS thông thường
  duy trì kết nối WebSocket/TCP chung, vì vậy node trực tiếp sử dụng các lượt thăm dò HTTPS
  ngắn và kết nối lại khi ứng dụng trở về nền trước. Xem
  [hướng dẫn về mạng cấp thấp trên watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS) của Apple.

Thiết lập:

1. Trên iPhone, mở **Cài đặt -> Apple Watch**.
2. Chạm vào **Bật kết nối Gateway trực tiếp**.
3. Mở OpenClaw trên đồng hồ trước khi mã thiết lập có thời hạn ngắn hết hạn.
4. Xác minh hàng Apple Watch riêng biệt bằng `openclaw nodes status`.

Mã thiết lập chứa thông tin xác thực khởi động ngắn hạn chỉ dành cho node; hãy coi nó
như mật khẩu cho đến khi hết hạn. Mã này không bao giờ chứa mật khẩu hoặc token Gateway
đã lưu của iPhone. Sau khi ghép đôi, đồng hồ lưu token thiết bị riêng và
xóa thông tin xác thực khởi động. Chế độ trực tiếp chỉ hỗ trợ các lệnh bên dưới.
Trò chuyện, Trò chuyện bằng giọng nói, phê duyệt và luồng thông báo `watch.*` hiện có vẫn là
các tính năng chuyển tiếp qua iPhone và vẫn yêu cầu iPhone đã ghép đôi.

Các lệnh node watchOS trực tiếp:

| Giao diện     | Lệnh                           | Ghi chú                                                     |
| ------------- | ------------------------------ | ----------------------------------------------------------- |
| Thiết bị      | `device.info`, `device.status` | Danh tính Watch, pin, nhiệt độ, bộ nhớ và mạng.              |
| Thông báo     | `system.notify`                | Khi ứng dụng đang hoạt động; yêu cầu quyền trên đồng hồ.     |

watchOS không cung cấp WebKit cho ứng dụng của bên thứ ba, vì vậy node đồng hồ trực tiếp
không quảng bá các lệnh Canvas.

## Thông báo đẩy dựa trên bộ chuyển tiếp cho các bản dựng chính thức

Các bản dựng iOS chính thức được phân phối sử dụng một bộ chuyển tiếp thông báo đẩy bên ngoài thay vì công bố token APNs thô cho gateway. Các bản dựng App Store chính thức từ luồng phát hành công khai sử dụng bộ chuyển tiếp được lưu trữ tại `https://ios-push-relay.openclaw.ai`; URL cơ sở này được mã hóa cứng cho việc phân phối qua App Store và không đọc bất kỳ giá trị ghi đè nào.

Các bản triển khai bộ chuyển tiếp tùy chỉnh yêu cầu một đường dẫn xây dựng/triển khai iOS riêng biệt có chủ đích, trong đó URL bộ chuyển tiếp khớp với URL bộ chuyển tiếp của gateway. Luồng phát hành App Store không bao giờ chấp nhận URL bộ chuyển tiếp tùy chỉnh. Nếu đang sử dụng bản dựng bộ chuyển tiếp tùy chỉnh, hãy đặt URL bộ chuyển tiếp tương ứng cho gateway:

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

Cách hoạt động của luồng:

- Ứng dụng iOS đăng ký với bộ chuyển tiếp bằng App Attest và JWS giao dịch ứng dụng StoreKit.
- Bộ chuyển tiếp trả về một định danh bộ chuyển tiếp không trong suốt cùng với quyền gửi có phạm vi theo đăng ký.
- Ứng dụng iOS truy xuất danh tính gateway đã ghép đôi (`gateway.identity.get`) và đưa danh tính đó vào đăng ký bộ chuyển tiếp, vì vậy đăng ký dựa trên bộ chuyển tiếp được ủy quyền cho chính gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên bộ chuyển tiếp đó đến gateway đã ghép đôi bằng `push.apns.register`.
- Gateway sử dụng định danh bộ chuyển tiếp đã lưu đó cho `push.test`, đánh thức trong nền và tín hiệu thúc đẩy đánh thức.
- Nếu sau đó ứng dụng kết nối với một gateway khác hoặc một bản dựng có URL cơ sở bộ chuyển tiếp khác, ứng dụng sẽ làm mới đăng ký bộ chuyển tiếp thay vì tái sử dụng liên kết cũ.

Những gì gateway **không** cần cho đường dẫn này: không cần token bộ chuyển tiếp dùng chung cho toàn bộ bản triển khai, không cần khóa APNs trực tiếp cho các lượt gửi dựa trên bộ chuyển tiếp chính thức của App Store.

Luồng dự kiến cho người vận hành:

1. Cài đặt ứng dụng iOS chính thức.
2. Tùy chọn: chỉ đặt `gateway.push.apns.relay.baseUrl` trên gateway khi sử dụng một bản dựng bộ chuyển tiếp tùy chỉnh riêng biệt có chủ đích.
3. Ghép đôi ứng dụng với gateway và để ứng dụng hoàn tất kết nối.
4. Ứng dụng công bố `push.apns.register` sau khi có token APNs, phiên người vận hành đã kết nối và đăng ký bộ chuyển tiếp thành công.
5. Sau đó, `push.test`, thao tác đánh thức để kết nối lại và tín hiệu thúc đẩy đánh thức có thể sử dụng đăng ký dựa trên bộ chuyển tiếp đã lưu.

## Beacon duy trì hoạt động trong nền

Khi iOS đánh thức ứng dụng do thông báo đẩy im lặng, làm mới trong nền hoặc sự kiện thay đổi vị trí đáng kể, ứng dụng sẽ thử kết nối lại nhanh với node rồi gọi `node.event` bằng `event: "node.presence.alive"`. Gateway chỉ ghi nhận việc này dưới dạng `lastSeenAtMs`/`lastSeenReason` trong siêu dữ liệu của node/thiết bị đã ghép nối sau khi xác định được danh tính thiết bị node đã xác thực.

Ứng dụng chỉ coi một lần đánh thức trong nền là đã được ghi nhận thành công khi phản hồi của Gateway chứa `handled: true`. Các Gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó tương thích nhưng không được tính là một lần cập nhật thời điểm hoạt động gần nhất có tính bền vững.

Lưu ý về khả năng tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một giá trị ghi đè tạm thời bằng biến môi trường cho Gateway (`gateway.push.apns.relay.baseUrl` là đường dẫn ưu tiên cấu hình).
- Chế độ thông báo đẩy của bản dựng phát hành trên App Store mã hóa cứng máy chủ chuyển tiếp được lưu trữ và không bao giờ đọc giá trị ghi đè URL chuyển tiếp — biến môi trường lúc dựng `OPENCLAW_PUSH_RELAY_BASE_URL` chỉ ảnh hưởng đến các chế độ dựng iOS cục bộ/sandbox.

## Luồng xác thực và tin cậy

Dịch vụ chuyển tiếp tồn tại để thực thi hai ràng buộc mà việc kết nối APNs trực tiếp trên Gateway không thể cung cấp cho các bản dựng iOS chính thức:

- Chỉ các bản dựng OpenClaw iOS chính hãng được phân phối qua Apple mới có thể sử dụng dịch vụ chuyển tiếp được lưu trữ.
- Gateway chỉ có thể gửi thông báo đẩy qua dịch vụ chuyển tiếp đến các thiết bị iOS đã ghép nối với chính Gateway đó.

Theo từng chặng:

1. `iOS app -> gateway`: ứng dụng ghép nối với Gateway thông qua luồng xác thực Gateway thông thường, nhờ đó có một phiên node đã xác thực cùng một phiên người vận hành đã xác thực. Phiên người vận hành gọi `gateway.identity.get`.
2. `iOS app -> relay`: ứng dụng gọi các điểm cuối đăng ký chuyển tiếp qua HTTPS bằng bằng chứng App Attest cùng với JWS giao dịch ứng dụng StoreKit. Dịch vụ chuyển tiếp xác thực ID gói, bằng chứng App Attest và bằng chứng phân phối của Apple, đồng thời yêu cầu đường dẫn phân phối chính thức/production — điều này ngăn các bản dựng Xcode/dev cục bộ sử dụng dịch vụ chuyển tiếp được lưu trữ, vì bản dựng cục bộ không thể đáp ứng bằng chứng phân phối chính thức của Apple.
3. `gateway identity delegation`: trước khi đăng ký chuyển tiếp, ứng dụng lấy danh tính Gateway đã ghép nối từ `gateway.identity.get` và đưa danh tính đó vào tải trọng đăng ký chuyển tiếp. Dịch vụ chuyển tiếp trả về một định danh chuyển tiếp và quyền gửi giới hạn trong phạm vi đăng ký được ủy quyền cho danh tính Gateway đó.
4. `gateway -> relay`: Gateway lưu định danh chuyển tiếp và quyền gửi từ `push.apns.register`. Khi `push.test`, đánh thức để kết nối lại và nhắc đánh thức, Gateway ký yêu cầu gửi bằng danh tính thiết bị của chính nó; dịch vụ chuyển tiếp xác minh cả quyền gửi đã lưu và chữ ký Gateway dựa trên danh tính Gateway được ủy quyền khi đăng ký. Gateway khác không thể tái sử dụng đăng ký đã lưu đó, ngay cả khi bằng cách nào đó có được định danh.
5. `relay -> APNs`: dịch vụ chuyển tiếp sở hữu thông tin xác thực APNs production và mã thông báo APNs thô cho bản dựng chính thức. Gateway không bao giờ lưu mã thông báo APNs thô cho các bản dựng chính thức sử dụng dịch vụ chuyển tiếp; dịch vụ chuyển tiếp gửi thông báo đẩy cuối cùng đến APNs thay mặt cho Gateway đã ghép nối.

Lý do thiết kế này được tạo ra: giữ thông tin xác thực APNs production bên ngoài Gateway của người dùng, tránh lưu mã thông báo APNs thô của bản dựng chính thức trên Gateway, chỉ cho phép các bản dựng OpenClaw iOS chính thức sử dụng dịch vụ chuyển tiếp được lưu trữ và ngăn một Gateway gửi thông báo đẩy đánh thức đến các thiết bị iOS thuộc về Gateway khác.

Các bản dựng cục bộ/thủ công vẫn sử dụng APNs trực tiếp. Nếu bạn đang kiểm thử các bản dựng đó mà không dùng dịch vụ chuyển tiếp, Gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Đây là các biến môi trường thời gian chạy trên máy chủ Gateway, không phải cài đặt Fastlane. `apps/ios/fastlane/.env` chỉ lưu thông tin xác thực App Store Connect như `APP_STORE_CONNECT_KEY_ID` và `APP_STORE_CONNECT_ISSUER_ID`; nó không cấu hình việc phân phối APNs trực tiếp cho các bản dựng iOS cục bộ.

Cách lưu trữ được khuyến nghị trên máy chủ Gateway, nhất quán với các thông tin xác thực nhà cung cấp khác trong `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Không commit tệp `.p8` hoặc đặt tệp đó trong bản checkout của kho mã nguồn.

## Các đường dẫn khám phá

### Bonjour (LAN)

Ứng dụng iOS duyệt `_openclaw-gw._tcp` trên `local.` và, khi được cấu hình, cùng miền khám phá DNS-SD diện rộng. Các Gateway trong cùng mạng LAN tự động xuất hiện từ `local.`; tính năng khám phá xuyên mạng có thể sử dụng miền diện rộng đã cấu hình mà không cần thay đổi loại beacon.

### Tailnet (xuyên mạng)

Nếu mDNS bị chặn, hãy sử dụng một vùng DNS-SD unicast (chọn một miền; ví dụ: `openclaw.internal.`) và DNS phân tách của Tailscale. Xem [Bonjour](/vi/gateway/bonjour) để biết ví dụ CoreDNS.

### Máy chủ/cổng thủ công

Trong Settings, bật **Manual Host** và nhập máy chủ + cổng của Gateway (mặc định `18789`).

## Nhiều Gateway

Ứng dụng duy trì sổ đăng ký của mọi Gateway đã ghép nối để bạn có thể chuyển đổi giữa chúng mà không cần ghép nối lại:

- **Settings -> Gateway** hiển thị danh sách **Paired Gateways**, trong đó Gateway đang hoạt động được đánh dấu. Chạm vào một mục để chuyển đổi; ứng dụng đóng các phiên hiện tại và kết nối lại với Gateway đã chọn. Menu chuyển đổi nhanh xuất hiện bên cạnh hàng kết nối khi có nhiều hơn một Gateway đã ghép nối.
- Thông tin xác thực, quyết định tin cậy TLS, tùy chọn riêng cho từng Gateway và lịch sử trò chuyện được lưu đệm đều được lưu riêng theo từng Gateway. Việc chuyển đổi không bao giờ trộn lẫn trạng thái giữa các Gateway và đăng ký thông báo đẩy luôn theo Gateway đang hoạt động.
- Vuốt một Gateway đã ghép nối (hoặc sử dụng menu ngữ cảnh của Gateway đó) để **Forget** Gateway, thao tác này sẽ xóa thông tin xác thực, mã thông báo thiết bị, mã ghim TLS và các cuộc trò chuyện đã lưu đệm của Gateway đó.
- Các Gateway được khám phá phải hiển thị trên mạng để có thể chuyển sang; các Gateway thủ công kết nối lại bằng máy chủ và cổng đã lưu.

## Canvas + A2UI

Node iOS kết xuất canvas WKWebView. Sử dụng `node.invoke` để điều khiển:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Lưu ý:

- Máy chủ canvas của Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/` từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
- Node iOS giữ khung dựng sẵn làm chế độ xem mặc định khi đã kết nối. `canvas.a2ui.push` và `canvas.a2ui.reset` sử dụng trang A2UI đi kèm do ứng dụng sở hữu.
- Các trang A2UI của Gateway từ xa chỉ có thể kết xuất trên iOS; thao tác nút A2UI gốc chỉ được chấp nhận từ các trang đi kèm do ứng dụng sở hữu.
- Quay lại khung dựng sẵn bằng `canvas.navigate` và `{"url":""}`.

## Mối quan hệ với Computer Use

Ứng dụng iOS là một bề mặt node di động, không phải phần phụ trợ Codex Computer Use. Codex Computer Use và `cua-driver mcp` điều khiển máy tính macOS cục bộ thông qua các công cụ MCP; ứng dụng iOS cung cấp các khả năng của iPhone thông qua các lệnh node OpenClaw như `canvas.*`, `camera.*`, `screen.*`, `location.*` và `talk.*`.

Các tác nhân vẫn có thể vận hành ứng dụng iOS thông qua OpenClaw bằng cách gọi các lệnh node, nhưng những lệnh gọi này đi qua giao thức node của Gateway và tuân theo các giới hạn tiền cảnh/nền của iOS. Sử dụng [Codex Computer Use](/vi/plugins/codex-computer-use) để điều khiển máy tính cục bộ và trang này để tìm hiểu các khả năng của node iOS.

### Đánh giá / ảnh chụp nhanh Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Đánh thức bằng giọng nói + chế độ trò chuyện

- Tính năng đánh thức bằng giọng nói và chế độ trò chuyện có trong Settings.
- Talk thời gian thực của OpenAI sử dụng WebRTC do máy khách sở hữu khi `talk.realtime.transport` là `webrtc`; cấu hình `gateway-relay` rõ ràng vẫn thuộc quyền sở hữu của Gateway. Xem [Chế độ Talk](/vi/nodes/talk).
- Các node iOS hỗ trợ Talk quảng bá khả năng `talk` và có thể khai báo `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` và `talk.ptt.once`; theo mặc định, Gateway cho phép các lệnh nhấn để nói đó đối với các node hỗ trợ Talk đáng tin cậy.
- iOS có thể tạm dừng âm thanh nền; hãy coi các tính năng giọng nói là hoạt động theo khả năng tốt nhất khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS ra tiền cảnh (các lệnh canvas/camera/màn hình yêu cầu điều này).
- `A2UI_HOST_UNAVAILABLE`: không thể truy cập trang A2UI đi kèm trong WebView của ứng dụng; giữ ứng dụng ở tiền cảnh trên thẻ Screen rồi thử lại.
- Lời nhắc ghép nối không bao giờ xuất hiện: chạy `openclaw devices list` và phê duyệt thủ công.
- Watch không hiển thị trạng thái iPhone: xác nhận iPhone báo cáo `watchPaired: true`
  và `watchAppInstalled: true` trong `watch.status`. Nếu trạng thái ghép nối là false, hãy ghép nối
  Watch trong ứng dụng Watch của Apple. Nếu trạng thái cài đặt là false, hãy cài đặt ứng dụng đồng hành
  từ **My Watch -> Available Apps**. Sau một trong hai thay đổi, hãy mở OpenClaw trên
  Watch một lần; khả năng kết nối tức thời vẫn yêu cầu cả hai ứng dụng đang chạy,
  trong khi các bản cập nhật trong hàng đợi có thể đến sau ở chế độ nền.
- Kết nối lại thất bại sau khi cài đặt lại: mã thông báo ghép nối trong Keychain đã bị xóa; hãy ghép nối lại node.

## Tài liệu liên quan

- [Ghép nối](/vi/channels/pairing)
- [Khám phá](/vi/gateway/discovery)
- [Bonjour](/vi/gateway/bonjour)
