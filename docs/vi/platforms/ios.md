---
read_when:
    - Ghép nối hoặc kết nối lại Node iOS
    - Bật hoặc khắc phục sự cố Node Apple Watch trực tiếp
    - Chạy ứng dụng iOS từ mã nguồn
    - Gỡ lỗi tính năng khám phá Gateway hoặc các lệnh canvas
summary: 'Ứng dụng Node trên iOS: kết nối với Gateway, ghép đôi, canvas và khắc phục sự cố'
title: Ứng dụng iOS
x-i18n:
    generated_at: "2026-07-19T05:50:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: edd6a59edb656355e8b524cbd796452c0877264e28ca75f02a564929bcfa89b1
    source_path: platforms/ios.md
    workflow: 16
---

Tính khả dụng: các bản dựng ứng dụng iPhone được phân phối qua các kênh của Apple khi được bật cho một bản phát hành. Các bản dựng phát triển cục bộ cũng có thể chạy từ mã nguồn.

## Chức năng

- Kết nối với Gateway qua WebSocket (LAN hoặc tailnet).
- Cung cấp các khả năng của node: Canvas, ảnh chụp màn hình, chụp ảnh bằng camera, vị trí, chế độ Talk, kích hoạt bằng giọng nói và bản tóm tắt Sức khỏe tùy chọn.
- Nhận các lệnh `node.invoke` và báo cáo các sự kiện trạng thái của node.
- Duyệt không gian làm việc của agent đã chọn ở chế độ chỉ đọc từ giao diện Agent (Files): đi sâu vào thư mục, xem trước văn bản có tô sáng cú pháp, xem trước hình ảnh và xuất qua bảng chia sẻ. Không có thao tác ghi; kích thước bản xem trước bị Gateway giới hạn.
- Duy trì một bộ nhớ đệm ngoại tuyến nhỏ, chỉ đọc, chứa các phiên trò chuyện và bản chép lời gần đây cho từng Gateway đã ghép đôi: khi khởi động nguội, ứng dụng hiển thị ngay bản chép lời đã biết gần nhất và làm mới sau khi Gateway phản hồi; vẫn có thể duyệt các cuộc trò chuyện gần đây khi mất kết nối; thao tác đặt lại/quên sẽ xóa bộ nhớ đệm cục bộ được bảo vệ.
- Xếp hàng các tin nhắn văn bản được gửi khi mất kết nối trong một hộp thư đi bền vững riêng cho từng Gateway (tối đa 50): các bong bóng đang chờ được hiển thị trong bản chép lời, được gửi lần lượt khi kết nối lại với cơ chế thử lại có tính lũy đẳng, được lưu bền vững cho đến khi lịch sử chính tắc xác nhận việc gửi, thử lại với thời gian chờ tăng dần trước khi hiển thị thao tác thử lại/xóa, và hết hạn thay vì gửi sau 48 giờ ngoại tuyến; thao tác đặt lại/quên sẽ xóa hàng đợi cùng bộ nhớ đệm.
- Chat là giao diện văn bản và giọng nói duy nhất. Các thao tác trong Chat có thể mở màn hình Sessions đầy đủ mà không rời Chat, đồng thời có thể hiển thị hoặc ẩn quá trình suy luận của trợ lý và hoạt động của công cụ. Chạm vào micrô để đọc chính tả thành bản nháp, mở menu của micrô để ghi ghi chú thoại hoặc dùng điều khiển Talk nội tuyến cho giọng nói thời gian thực; điều khiển Talk chuyển động theo mức micrô trực tiếp hoặc mức phát lại khi đang nghe hoặc nói.
- Phát lời các tin nhắn của trợ lý theo yêu cầu: nhấn giữ một tin nhắn trong Chat và chọn **Listen**. Ứng dụng phát các đoạn âm thanh `tts.speak` được Gateway hỗ trợ bằng nhà cung cấp TTS đã cấu hình và chuyển sang giọng nói trên thiết bị khi âm thanh từ Gateway không khả dụng hoặc không thể phát. Việc phát sẽ dừng khi chuyển phiên hoặc đưa ứng dụng xuống nền.

## Yêu cầu

- Gateway đang chạy trên một thiết bị khác (macOS, Linux hoặc Windows qua WSL2).
- Đường dẫn mạng:
  - Cùng mạng LAN qua Bonjour, **hoặc**
  - Tailnet qua DNS-SD đơn hướng (tên miền ví dụ: `openclaw.internal.`), **hoặc**
  - Máy chủ/cổng thủ công (dự phòng).

## Bắt đầu nhanh (ghép đôi + kết nối)

Trong lần khởi chạy đầu tiên, ứng dụng hướng dẫn qua phần giải thích ngắn về ghép đôi và một
trang quyền (thông báo, camera, micrô, ảnh, danh bạ,
lịch, lời nhắc, vị trí). Mọi quyền cấp đều là tùy chọn và có thể thay đổi
sau trong **Settings** -> **Permissions** hoặc trong ứng dụng Settings của iOS.

1. Khởi động một Gateway đã xác thực với tuyến đường mà điện thoại có thể truy cập. Tailscale
   Serve là đường dẫn từ xa được khuyến nghị:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Đối với thiết lập đáng tin cậy trên cùng mạng LAN, hãy dùng một `gateway.bind: "lan"` đã xác thực
thay thế. Liên kết loopback mặc định không thể truy cập từ điện thoại. Nếu
Gateway chưa được cấu hình, trước tiên hãy chạy `openclaw onboard` để quá trình tạo
mã thiết lập có đường dẫn xác thực bằng token hoặc mật khẩu.

2. Mở [giao diện điều khiển](/vi/web/control-ui), chọn **Nodes** và nhấp vào
   **Pair mobile device** trên trang **Devices**. Quyền truy cập đầy đủ được khuyến nghị
   và được chọn theo mặc định; chỉ chọn Limited access khi bạn muốn bỏ qua
   các điều khiển quản trị Gateway, sau đó nhấp vào **Create setup code**.

3. Trong ứng dụng iOS, mở **Settings** -> **Gateway**, quét mã QR (hoặc dán
   mã thiết lập) và kết nối.

   Nếu mã thiết lập chứa cả tuyến LAN và Tailscale Serve, ứng dụng
   sẽ thăm dò chúng theo thứ tự và lưu điểm cuối có thể truy cập đầu tiên.

4. Ứng dụng chính thức tự động kết nối. Nếu **Pending approval** hiển thị một
   yêu cầu, hãy xem xét vai trò và phạm vi của yêu cầu trước khi phê duyệt.

   **Settings → Gateway** cho biết kết nối người vận hành đã lưu có quyền truy cập
   **Full** hay **Limited**. Thiết lập `ws://` LAN dạng văn bản thuần túy tự động
   bị giới hạn để bảo vệ token mang. Nếu bị giới hạn, hãy cấu hình `wss://` hoặc
   Tailscale Serve, quét mã mới có quyền truy cập đầy đủ từ giao diện điều khiển hoặc `openclaw qr`,
   sau đó kết nối lại để bật phần cài đặt và nâng cấp.

Nút giao diện điều khiển yêu cầu một phiên đã được ghép đôi với `operator.admin`.
Để dùng phương án dự phòng trên terminal, hãy chọn một Gateway được phát hiện trong ứng dụng iOS (hoặc bật
Manual Host và nhập máy chủ/cổng), sau đó phê duyệt yêu cầu trên máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nếu ứng dụng thử ghép đôi lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Tùy chọn: nếu node iOS luôn kết nối từ một mạng con được kiểm soát chặt chẽ, bạn có thể chọn tự động phê duyệt node trong lần đầu bằng các CIDR rõ ràng hoặc địa chỉ IP chính xác:

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

Tính năng này bị tắt theo mặc định. Tính năng chỉ áp dụng cho lần ghép đôi `role: node` mới không yêu cầu phạm vi nào. Việc ghép đôi người vận hành/trình duyệt và mọi thay đổi về vai trò, phạm vi, siêu dữ liệu hoặc khóa công khai vẫn yêu cầu phê duyệt thủ công.

5. Xác minh kết nối:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Bản tóm tắt Sức khỏe

Node iOS có thể trả về dữ liệu tổng hợp HealthKit chỉ đọc, tùy chọn, cho ngày
dương lịch hiện tại. Sự đồng ý trên thiết bị iOS và việc cấp quyền rõ ràng cho lệnh Gateway là
các cổng kiểm soát độc lập. Xem [bản tóm tắt HealthKit](/vi/platforms/ios-healthkit) để biết
cách thiết lập, gọi lệnh, các trường tải dữ liệu, hành vi quyền riêng tư và cách khắc phục sự cố.

Theo mặc định, ứng dụng đồng hành trên Apple Watch tiếp tục sử dụng cơ chế chuyển tiếp hiện có của iPhone và
không cần ghép đôi Gateway riêng. Ghép đôi Watch với iPhone trong
ứng dụng Watch của Apple, cài đặt OpenClaw từ **Watch app -> My Watch -> Available
Apps**, sau đó mở OpenClaw một lần trên cả hai thiết bị.

## Xem xét phê duyệt lệnh

Một kết nối người vận hành có `operator.admin`, hoặc một kết nối
`operator.approvals` đã ghép đôi được Gateway nhắm mục tiêu rõ ràng, có thể xem xét
các yêu cầu thực thi đang chờ trên iPhone. Thẻ phê duyệt hiển thị bản xem trước lệnh đã được
Gateway làm sạch, cảnh báo, ngữ cảnh máy chủ, thời điểm hết hạn và chỉ các
quyết định được yêu cầu đó cung cấp. Apple Watch đã ghép đôi nhận cùng
lời nhắc an toàn cho người xem xét thông qua cơ chế chuyển tiếp hiện có của iPhone và cung cấp tập hợp con
quyết định cho phép một lần/từ chối dạng thu gọn. Chế độ Gateway trực tiếp trên Watch không truyền
lời nhắc phê duyệt.

Trạng thái phê duyệt được chia sẻ với giao diện điều khiển và các giao diện trò chuyện được hỗ trợ. Câu trả lời
được ghi nhận đầu tiên sẽ có hiệu lực. iPhone và Watch lấy bản ghi
kết thúc chính tắc của Gateway sau khi một giao diện khác xử lý yêu cầu, sau thông báo
đã xử lý từ xa và bất cứ khi nào xác nhận xử lý có thể đã
bị mất. Các thao tác vẫn không khả dụng cho đến khi việc đọc lại xác nhận liệu
yêu cầu còn đang chờ hay không.

Quyền sở hữu phê duyệt được liên kết với Gateway đã chọn. Việc chuyển Gateway không thể
áp dụng lời nhắc cũ cho kết nối thay thế. Các Gateway có từ trước
các phương thức phê duyệt hợp nhất sẽ chuyển về các phương thức dành riêng cho thực thi đã phát hành;
trạng thái kết thúc được lưu giữ và kết quả liên giao diện phong phú hơn yêu cầu
Gateway đã được cập nhật.

## Trả lời câu hỏi của agent

Chat hiển thị các câu hỏi Gateway đang chờ dưới dạng thẻ gốc cho các kết nối người vận hành
có `operator.questions` (hoặc `operator.admin`). Các thẻ hỗ trợ tùy chọn chọn một hoặc
nhiều mục, mô tả tùy chọn, câu trả lời **Other** dạng văn bản tự do và
đếm ngược thời gian hết hạn. Khi kết nối lại, các câu hỏi đang chờ được tải lại từ Gateway. Thẻ
sẽ khóa khi thiết bị này trả lời, một giao diện khác trả lời trước hoặc
câu hỏi hết hạn hay bị hủy.

## Node Apple Watch trực tiếp tùy chọn

Chế độ trực tiếp cung cấp cho Watch danh tính node có chữ ký và kết nối Gateway riêng.
Các lệnh node được hỗ trợ tiếp tục hoạt động qua Wi-Fi hoặc mạng di động của Watch trong khi
OpenClaw đang hoạt động, ngay cả khi iPhone đã ghép đôi không khả dụng.

Yêu cầu:

- iPhone được kết nối với Gateway bằng phạm vi `operator.admin`.
- Mã thiết lập quảng bá một điểm cuối Gateway `wss://` có chứng chỉ được
  watchOS tin cậy; Watch thăm dò nguồn `https://` tương ứng. HTTP thuần túy và
  chứng chỉ tự ký hoặc cơ chế tin cậy chỉ dựa trên dấu vân tay không được hỗ trợ. Xem [ghép đôi do Gateway
  quản lý](/vi/gateway/pairing) để biết cách cấu hình điểm cuối. Các tuyến loopback, chỉ dành cho iPhone
  và chỉ dành cho tailnet không thể được Watch truy cập độc lập.
- Việc sử dụng mạng di động yêu cầu Apple Watch hỗ trợ mạng di động với dịch vụ đang hoạt động.
- OpenClaw đang hoạt động trên Watch. Apple không cho phép các ứng dụng watchOS thông thường
  duy trì kết nối WebSocket/TCP chung, vì vậy node trực tiếp sử dụng các lượt thăm dò HTTPS ngắn
  và kết nối lại khi ứng dụng trở về tiền cảnh. Xem
  [hướng dẫn mạng cấp thấp của watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS) từ Apple.

Thiết lập:

1. Trên iPhone, mở **Settings -> Apple Watch**.
2. Chạm vào **Enable Direct Gateway Connection**.
3. Mở OpenClaw trên Watch trước khi mã thiết lập có thời hạn ngắn hết hạn.
4. Xác minh hàng Apple Watch riêng biệt bằng `openclaw nodes status`.

Mã thiết lập chứa thông tin xác thực khởi tạo chỉ dành cho node, có thời hạn ngắn; hãy coi nó
như mật khẩu cho đến khi hết hạn. Mã không bao giờ chứa mật khẩu hoặc token Gateway
đã lưu của iPhone. Sau khi ghép đôi, Watch lưu token thiết bị riêng và
xóa thông tin xác thực khởi tạo. Chế độ trực tiếp chỉ hỗ trợ các lệnh bên dưới.
Chat, Talk, phê duyệt và luồng thông báo `watch.*` hiện có vẫn là
các tính năng chuyển tiếp qua iPhone và vẫn yêu cầu iPhone đã ghép đôi.

Các lệnh node watchOS trực tiếp:

| Giao diện      | Lệnh                           | Ghi chú                                                 |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Thiết bị       | `device.info`, `device.status` | Danh tính Watch, pin, nhiệt độ, bộ nhớ và mạng.          |
| Thông báo      | `system.notify`                | Khi ứng dụng đang hoạt động; yêu cầu quyền trên Watch.   |

watchOS không cung cấp WebKit cho ứng dụng bên thứ ba, vì vậy node Watch trực tiếp
không quảng bá các lệnh Canvas.

## Push dựa trên chuyển tiếp cho các bản dựng chính thức

Các bản dựng iOS chính thức được phân phối sử dụng một dịch vụ chuyển tiếp push bên ngoài thay vì công bố token APNs thô cho Gateway. Các bản dựng App Store chính thức từ luồng phát hành công khai sử dụng dịch vụ chuyển tiếp được lưu trữ tại `https://ios-push-relay.openclaw.ai`; URL cơ sở này được mã hóa cứng cho việc phân phối qua App Store và không đọc bất kỳ giá trị ghi đè nào.

Các triển khai dịch vụ chuyển tiếp tùy chỉnh yêu cầu một đường dẫn bản dựng/triển khai iOS riêng biệt có chủ đích, trong đó URL dịch vụ chuyển tiếp khớp với URL dịch vụ chuyển tiếp của Gateway. Luồng phát hành App Store không bao giờ chấp nhận URL dịch vụ chuyển tiếp tùy chỉnh. Nếu bạn đang sử dụng bản dựng dịch vụ chuyển tiếp tùy chỉnh, hãy đặt URL dịch vụ chuyển tiếp Gateway tương ứng:

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

Cách thức hoạt động của luồng:

- Ứng dụng iOS đăng ký với relay bằng App Attest và một JWS giao dịch ứng dụng StoreKit.
- Relay trả về một định danh relay không trong suốt cùng với quyền gửi có phạm vi đăng ký.
- Ứng dụng iOS lấy danh tính gateway đã ghép đôi (`gateway.identity.get`) và đưa danh tính đó vào quá trình đăng ký relay, nhờ đó đăng ký dựa trên relay được ủy quyền cho gateway cụ thể đó.
- Ứng dụng chuyển tiếp đăng ký dựa trên relay đó đến gateway đã ghép đôi bằng `push.apns.register`.
- Gateway sử dụng định danh relay đã lưu đó cho `push.test`, các lần đánh thức trong nền và các tín hiệu nhắc đánh thức.
- Nếu sau đó ứng dụng kết nối với một gateway khác hoặc một bản dựng có URL cơ sở relay khác, ứng dụng sẽ làm mới đăng ký relay thay vì tái sử dụng liên kết cũ.

Những gì gateway **không** cần cho đường dẫn này: không cần token relay dùng cho toàn bộ triển khai, không cần khóa APNs trực tiếp cho các lượt gửi chính thức dựa trên relay của App Store.

Luồng dự kiến dành cho người vận hành:

1. Cài đặt ứng dụng iOS chính thức.
2. Tùy chọn: chỉ đặt `gateway.push.apns.relay.baseUrl` trên gateway khi sử dụng một bản dựng relay tùy chỉnh được chủ ý tách riêng.
3. Ghép đôi ứng dụng với gateway và để ứng dụng hoàn tất kết nối.
4. Ứng dụng công bố `push.apns.register` sau khi có token APNs, phiên của người vận hành đã kết nối và đăng ký relay thành công.
5. Sau đó, `push.test`, các lần đánh thức khi kết nối lại và các tín hiệu nhắc đánh thức có thể sử dụng đăng ký dựa trên relay đã lưu.

## Tín hiệu duy trì hoạt động trong nền

Khi iOS đánh thức ứng dụng bằng thông báo đẩy im lặng, làm mới trong nền hoặc sự kiện thay đổi vị trí đáng kể, ứng dụng thử kết nối lại Node trong thời gian ngắn rồi gọi `node.event` với `event: "node.presence.alive"`. Gateway chỉ ghi nhận thông tin này dưới dạng `lastSeenAtMs`/`lastSeenReason` trong siêu dữ liệu Node/thiết bị đã ghép đôi sau khi xác định được danh tính thiết bị Node đã xác thực.

Ứng dụng chỉ coi một lần đánh thức trong nền là đã được ghi nhận thành công khi phản hồi của gateway bao gồm `handled: true`. Các gateway cũ hơn có thể xác nhận `node.event` bằng `{ "ok": true }`; phản hồi đó tương thích nhưng không được tính là một lần cập nhật thời điểm nhìn thấy gần nhất có tính bền vững.

Lưu ý về khả năng tương thích:

- `OPENCLAW_APNS_RELAY_BASE_URL` vẫn hoạt động như một biến môi trường ghi đè tạm thời cho gateway (`gateway.push.apns.relay.baseUrl` là đường dẫn ưu tiên cấu hình).
- Chế độ thông báo đẩy của bản dựng phát hành trên App Store mã hóa cố định máy chủ relay được lưu trữ và không bao giờ đọc giá trị ghi đè URL relay — biến môi trường lúc dựng `OPENCLAW_PUSH_RELAY_BASE_URL` chỉ ảnh hưởng đến các chế độ dựng iOS cục bộ/sandbox.

## Luồng xác thực và tin cậy

Relay tồn tại để thực thi hai ràng buộc mà việc dùng APNs trực tiếp trên gateway không thể cung cấp cho các bản dựng iOS chính thức:

- Chỉ các bản dựng iOS OpenClaw chính hãng được phân phối qua Apple mới có thể sử dụng relay được lưu trữ.
- Một gateway chỉ có thể gửi thông báo đẩy dựa trên relay đến các thiết bị iOS đã ghép đôi với chính gateway đó.

Theo từng chặng:

1. `iOS app -> gateway`: ứng dụng ghép đôi với gateway thông qua luồng xác thực Gateway thông thường, nhờ đó có một phiên Node đã xác thực cùng một phiên người vận hành đã xác thực. Phiên người vận hành gọi `gateway.identity.get`.
2. `iOS app -> relay`: ứng dụng gọi các điểm cuối đăng ký relay qua HTTPS bằng bằng chứng App Attest cùng với một JWS giao dịch ứng dụng StoreKit. Relay xác thực ID gói, bằng chứng App Attest và bằng chứng phân phối của Apple, đồng thời yêu cầu đường dẫn phân phối chính thức/sản xuất — đây là cơ chế ngăn các bản dựng Xcode/phát triển cục bộ sử dụng relay được lưu trữ, vì bản dựng cục bộ không thể đáp ứng bằng chứng phân phối chính thức của Apple.
3. `gateway identity delegation`: trước khi đăng ký relay, ứng dụng lấy danh tính gateway đã ghép đôi từ `gateway.identity.get` và đưa danh tính đó vào tải trọng đăng ký relay. Relay trả về một định danh relay và một quyền gửi có phạm vi đăng ký được ủy quyền cho danh tính gateway đó.
4. `gateway -> relay`: gateway lưu định danh relay và quyền gửi từ `push.apns.register`. Khi thực hiện `push.test`, đánh thức khi kết nối lại và tín hiệu nhắc đánh thức, gateway ký yêu cầu gửi bằng danh tính thiết bị của chính nó; relay xác minh cả quyền gửi đã lưu lẫn chữ ký của gateway dựa trên danh tính gateway được ủy quyền từ lúc đăng ký. Một gateway khác không thể tái sử dụng đăng ký đã lưu đó, ngay cả khi bằng cách nào đó lấy được định danh.
5. `relay -> APNs`: relay sở hữu thông tin xác thực APNs sản xuất và token APNs thô cho bản dựng chính thức. Gateway không bao giờ lưu token APNs thô cho các bản dựng chính thức dựa trên relay; relay thay mặt gateway đã ghép đôi gửi thông báo đẩy cuối cùng đến APNs.

Lý do thiết kế này được tạo ra: để giữ thông tin xác thực APNs sản xuất bên ngoài gateway của người dùng, tránh lưu token APNs thô của bản dựng chính thức trên gateway, chỉ cho phép các bản dựng iOS OpenClaw chính thức sử dụng relay được lưu trữ và ngăn một gateway gửi thông báo đẩy đánh thức đến các thiết bị iOS thuộc sở hữu của một gateway khác.

Các bản dựng cục bộ/thủ công vẫn sử dụng APNs trực tiếp. Nếu bạn đang kiểm thử các bản dựng đó mà không dùng relay, gateway vẫn cần thông tin xác thực APNs trực tiếp:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Đây là các biến môi trường thời gian chạy trên máy chủ gateway, không phải cài đặt Fastlane. `apps/ios/fastlane/.env` chỉ lưu thông tin xác thực App Store Connect như `APP_STORE_CONNECT_KEY_ID` và `APP_STORE_CONNECT_ISSUER_ID`; nó không cấu hình việc phân phối APNs trực tiếp cho các bản dựng iOS cục bộ.

Cách lưu trữ khuyến nghị trên máy chủ gateway, nhất quán với các thông tin xác thực nhà cung cấp khác trong `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Không commit tệp `.p8` hoặc đặt tệp đó trong bản checkout của kho mã.

## Các đường dẫn khám phá

### Bonjour (LAN)

Ứng dụng iOS duyệt `_openclaw-gw._tcp` trên `local.` và, khi được cấu hình, cùng một miền khám phá DNS-SD diện rộng. Các gateway trong cùng LAN tự động xuất hiện từ `local.`; hoạt động khám phá xuyên mạng có thể sử dụng miền diện rộng đã cấu hình mà không cần thay đổi loại tín hiệu.

### Tailnet (xuyên mạng)

Nếu mDNS bị chặn, hãy sử dụng một vùng DNS-SD unicast (chọn một miền; ví dụ: `openclaw.internal.`) và DNS phân tách của Tailscale. Xem [Bonjour](/vi/gateway/bonjour) để biết ví dụ CoreDNS.

### Máy chủ/cổng thủ công

Trong Settings, bật **Manual Host** và nhập máy chủ + cổng của gateway (mặc định `18789`).

## Nhiều gateway

Ứng dụng duy trì sổ đăng ký của mọi gateway đã ghép đôi, vì vậy bạn có thể chuyển đổi giữa chúng mà không cần ghép đôi lại:

- **Settings -> Gateway** hiển thị danh sách **Paired Gateways**, trong đó gateway đang hoạt động được đánh dấu. Chạm vào một mục để chuyển đổi; ứng dụng ngắt các phiên hiện tại và kết nối lại với gateway đã chọn. Một trình đơn chuyển nhanh xuất hiện bên cạnh hàng kết nối khi có nhiều hơn một gateway đã ghép đôi.
- Thông tin xác thực, quyết định tin cậy TLS, tùy chọn riêng cho từng gateway và lịch sử trò chuyện được lưu trong bộ nhớ đệm được lưu riêng theo từng gateway. Việc chuyển đổi không bao giờ trộn lẫn trạng thái giữa các gateway và đăng ký thông báo đẩy đi theo gateway đang hoạt động.
- Vuốt một gateway đã ghép đôi (hoặc sử dụng trình đơn ngữ cảnh của gateway đó) để **Forget** gateway, thao tác này sẽ xóa thông tin xác thực, token thiết bị, ghim TLS và các cuộc trò chuyện được lưu trong bộ nhớ đệm của gateway đó.
- Các gateway được khám phá phải hiển thị trên mạng thì mới có thể chuyển sang; các gateway thủ công kết nối lại bằng máy chủ và cổng đã lưu.

## Canvas + A2UI

Node iOS kết xuất một canvas WKWebView. Sử dụng `node.invoke` để điều khiển canvas:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Lưu ý:

- Máy chủ canvas của Gateway phục vụ `/__openclaw__/canvas/` và `/__openclaw__/a2ui/` từ máy chủ HTTP của Gateway (cùng cổng với `gateway.port`, mặc định `18789`).
- Node iOS giữ khung dựng sẵn làm chế độ xem mặc định khi đã kết nối. `canvas.a2ui.push` và `canvas.a2ui.reset` sử dụng trang A2UI đi kèm thuộc sở hữu của ứng dụng.
- Các trang A2UI của Gateway từ xa chỉ được kết xuất trên iOS; các hành động nút A2UI gốc chỉ được chấp nhận từ các trang đi kèm thuộc sở hữu của ứng dụng.
- Quay lại khung dựng sẵn bằng `canvas.navigate` và `{"url":""}`.

## Mối quan hệ với Computer Use

Ứng dụng iOS là một bề mặt Node di động, không phải backend Codex Computer Use. Codex Computer Use và `cua-driver mcp` điều khiển máy tính để bàn macOS cục bộ thông qua các công cụ MCP; ứng dụng iOS cung cấp các khả năng của iPhone thông qua các lệnh Node OpenClaw như `canvas.*`, `camera.*`, `screen.*`, `location.*` và `talk.*`.

Các agent vẫn có thể vận hành ứng dụng iOS thông qua OpenClaw bằng cách gọi các lệnh Node, nhưng các lệnh gọi đó đi qua giao thức Node của gateway và tuân theo các giới hạn tiền cảnh/nền của iOS. Sử dụng [Codex Computer Use](/vi/plugins/codex-computer-use) để điều khiển máy tính để bàn cục bộ và trang này để tìm hiểu các khả năng của Node iOS.

### Đánh giá / ảnh chụp nhanh Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Đánh thức bằng giọng nói + chế độ trò chuyện

- Tính năng đánh thức bằng giọng nói và chế độ trò chuyện có trong Settings.
- Talk thời gian thực của OpenAI sử dụng WebRTC do máy khách sở hữu khi `talk.realtime.transport` là `webrtc`; cấu hình `gateway-relay` tường minh vẫn do Gateway sở hữu. Xem [Chế độ Talk](/vi/nodes/talk).
- Các Node iOS hỗ trợ Talk quảng bá khả năng `talk` và có thể khai báo `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` và `talk.ptt.once`; theo mặc định, Gateway cho phép các lệnh nhấn để nói đó đối với các Node đáng tin cậy có hỗ trợ Talk.
- iOS có thể tạm ngưng âm thanh nền; hãy coi các tính năng giọng nói là hoạt động theo khả năng tốt nhất khi ứng dụng không hoạt động.

## Lỗi thường gặp

- `NODE_BACKGROUND_UNAVAILABLE`: đưa ứng dụng iOS ra tiền cảnh (các lệnh canvas/camera/màn hình yêu cầu điều này).
- `A2UI_HOST_UNAVAILABLE`: không thể truy cập trang A2UI đi kèm trong WebView của ứng dụng; giữ ứng dụng ở tiền cảnh trên tab Screen rồi thử lại.
- Lời nhắc ghép đôi không bao giờ xuất hiện: chạy `openclaw devices list` và phê duyệt thủ công.
- Watch không hiển thị trạng thái iPhone: xác nhận iPhone báo cáo `watchPaired: true`
  và `watchAppInstalled: true` trong `watch.status`. Nếu trạng thái ghép đôi là false, hãy ghép đôi
  Watch trong ứng dụng Watch của Apple. Nếu trạng thái cài đặt là false, hãy cài đặt ứng dụng đồng hành
  từ **My Watch -> Available Apps**. Sau một trong hai thay đổi, hãy mở OpenClaw trên
  Watch một lần; khả năng truy cập ngay lập tức vẫn yêu cầu cả hai ứng dụng đang chạy,
  trong khi các bản cập nhật đã xếp hàng có thể đến sau trong nền.
- Kết nối lại thất bại sau khi cài đặt lại: token ghép đôi trong Keychain đã bị xóa; hãy ghép đôi lại Node.

## Tài liệu liên quan

- [Ghép đôi](/vi/channels/pairing)
- [Khám phá](/vi/gateway/discovery)
- [Bonjour](/vi/gateway/bonjour)
