---
read_when:
    - Triển khai phê duyệt ghép đôi Node mà không cần giao diện người dùng macOS
    - Thêm các luồng CLI để phê duyệt các Node từ xa
    - Mở rộng giao thức Gateway với chức năng quản lý Node
summary: 'Phê duyệt khả năng của Node: cách các Node được phép cung cấp lệnh sau khi ghép đôi thiết bị'
title: Ghép cặp Node
x-i18n:
    generated_at: "2026-07-12T07:59:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Việc ghép đôi Node có hai lớp, cả hai đều được lưu trong bản ghi thiết bị đã ghép đôi trong cơ sở dữ liệu trạng thái SQLite của Gateway:

- **Ghép đôi thiết bị** (vai trò `node`) kiểm soát quy trình bắt tay `connect`. Xem
  [Tự động phê duyệt thiết bị theo CIDR tin cậy](#trusted-cidr-device-auto-approval)
  bên dưới và [Ghép đôi kênh](/vi/channels/pairing).
- **Phê duyệt khả năng của Node** (`node.pair.*`) kiểm soát các
  khả năng/lệnh đã khai báo mà một Node đã kết nối có thể cung cấp. Gateway là
  nguồn thông tin chuẩn xác; các giao diện người dùng (ứng dụng macOS, Control UI) là phần giao diện đầu cuối dùng để phê duyệt hoặc
  từ chối các yêu cầu đang chờ xử lý.

Kho lưu trữ ghép đôi Node độc lập trước đây (`nodes/paired.json` với token riêng cho từng Node,
đã ngừng sử dụng trong luồng kết nối từ tháng 1 năm 2026) không còn nữa: khi khởi động, Gateway sẽ hợp nhất một lần
mọi hàng còn lại vào các bản ghi thiết bị và lưu trữ các
tệp cũ với hậu tố `.migrated`. Hỗ trợ cầu nối TCP cũ đã bị
loại bỏ.

## Cách hoạt động của việc phê duyệt khả năng

1. Một Node kết nối với WS của Gateway (việc ghép đôi thiết bị kiểm soát bước này).
2. Gateway so sánh tập hợp khả năng/lệnh đã khai báo với tập hợp
   đã được phê duyệt; các tập hợp mới hoặc được mở rộng sẽ lưu một **yêu cầu đang chờ xử lý** trong
   bản ghi thiết bị và phát `node.pair.requested`.
3. Bạn phê duyệt hoặc từ chối yêu cầu (CLI hoặc giao diện người dùng).
4. Cho đến khi được phê duyệt, các lệnh của Node vẫn bị lọc; sau khi phê duyệt, tập hợp đã khai báo sẽ được cung cấp,
   tuân theo chính sách lệnh thông thường.

Các yêu cầu đang chờ xử lý sẽ tự động hết hạn **5 phút sau lần
thử lại gần nhất của Node** — một Node đang chủ động kết nối lại sẽ giữ cho yêu cầu đang chờ duy nhất của nó
tiếp tục có hiệu lực, thay vì tạo một yêu cầu mới (và lời nhắc phê duyệt) cho mỗi lần thử.

## Quy trình CLI (phù hợp với môi trường không giao diện)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` hiển thị các Node đã ghép đôi/đang kết nối và các khả năng của chúng.

## Bề mặt API (giao thức Gateway)

Sự kiện:

- `node.pair.requested` - được phát khi một yêu cầu đang chờ xử lý mới được tạo.
- `node.pair.resolved` - được phát khi một yêu cầu được phê duyệt, bị từ chối hoặc
  hết hạn.

Phương thức:

- `node.pair.list` - liệt kê các Node đang chờ xử lý và đã ghép đôi (`operator.pairing`).
- `node.pair.approve` - phê duyệt một yêu cầu đang chờ xử lý.
- `node.pair.reject` - từ chối một yêu cầu đang chờ xử lý.
- `node.pair.remove` - xóa một Node đã ghép đôi. Thao tác này thu hồi vai trò `node` của thiết bị
  trong kho thiết bị đã ghép đôi, đồng thời loại bỏ bề mặt Node đã được phê duyệt và
  vô hiệu hóa/ngắt kết nối các phiên mang vai trò Node của thiết bị đó. Một thiết bị **đa vai trò**
  (ví dụ: thiết bị cũng có vai trò `operator`) vẫn giữ hàng dữ liệu của mình và chỉ
  mất vai trò `node`; hàng dữ liệu của thiết bị chỉ có vai trò Node sẽ bị xóa. Phân quyền:
  `operator.pairing` có thể xóa các hàng Node không có vai trò operator; bên gọi bằng token thiết bị
  khi thu hồi vai trò Node **của chính mình** trên một thiết bị đa vai trò còn cần thêm
  `operator.admin`.
- `node.rename` - đổi tên hiển thị dành cho operator của một Node đã ghép đôi.

Đã loại bỏ trong phiên bản 2026.7: `node.pair.request` và `node.pair.verify`. Các yêu cầu đang chờ xử lý
do chính Gateway tạo trong khi Node kết nối, còn token độc lập riêng cho từng Node mà các phương thức này phục vụ
không còn tồn tại; xác thực Node sử dụng token ghép đôi
thiết bị.

Lưu ý:

- Các lần kết nối lại với bề mặt không thay đổi sẽ dùng lại yêu cầu đang chờ xử lý; các yêu cầu lặp lại
  làm mới siêu dữ liệu Node đã lưu và ảnh chụp nhanh mới nhất của các lệnh khai báo
  nằm trong danh sách cho phép để operator có thể theo dõi.
- Các cấp phạm vi operator và kiểm tra tại thời điểm phê duyệt được tóm tắt trong
  [Phạm vi operator](/vi/gateway/operator-scopes).
- `node.pair.approve` sử dụng các lệnh đã khai báo trong yêu cầu đang chờ xử lý để thực thi
  các phạm vi phê duyệt bổ sung:
  - yêu cầu không có lệnh: `operator.pairing`
  - yêu cầu lệnh không thực thi: `operator.pairing` + `operator.write`
  - yêu cầu `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Việc phê duyệt ghép đôi Node ghi lại bề mặt khả năng tin cậy. Việc này **không** cố định bề mặt lệnh Node đang hoạt động cho từng Node.

- Các lệnh Node đang hoạt động bắt nguồn từ nội dung Node khai báo khi kết nối, được lọc theo
  chính sách lệnh Node toàn cục của Gateway (`gateway.nodes.allowCommands` và
  `denyCommands`).
- Chính sách cho phép và hỏi đối với `system.run` theo từng Node nằm trên Node trong
  `exec.approvals.node.*`, không nằm trong bản ghi ghép đôi.

</Warning>

## Kiểm soát lệnh Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tính tương thích:** kể từ `2026.3.31`, các lệnh Node bị vô hiệu hóa cho đến khi việc ghép đôi Node được phê duyệt. Chỉ ghép đôi thiết bị không còn đủ để cung cấp các lệnh Node đã khai báo.
</Warning>

Khi một Node kết nối lần đầu, yêu cầu ghép đôi sẽ tự động được tạo.
Cho đến khi yêu cầu đó được phê duyệt, mọi lệnh Node đang chờ xử lý từ Node đó đều
bị lọc và sẽ không được thực thi. Sau khi việc ghép đôi được phê duyệt, các lệnh đã khai báo của Node
sẽ khả dụng, tuân theo chính sách lệnh thông thường.

Điều này có nghĩa là:

- Các Node trước đây chỉ dựa vào việc ghép đôi thiết bị để cung cấp lệnh giờ đây
  cũng phải hoàn tất việc ghép đôi Node.
- Các lệnh được xếp hàng trước khi phê duyệt ghép đôi sẽ bị loại bỏ, không được trì hoãn.

## Ranh giới tin cậy của sự kiện Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tính tương thích:** các lượt chạy bắt nguồn từ Node giờ đây chỉ hoạt động trên một bề mặt tin cậy bị thu hẹp.
</Warning>

Các bản tóm tắt bắt nguồn từ Node và những sự kiện phiên liên quan bị giới hạn trong
bề mặt tin cậy dự kiến. Các luồng được kích hoạt bởi thông báo hoặc Node từng
dựa vào quyền truy cập rộng hơn tới công cụ của máy chủ hoặc phiên có thể cần được điều chỉnh.
Biện pháp tăng cường bảo mật này ngăn sự kiện Node leo thang thành quyền truy cập công cụ cấp máy chủ
vượt quá giới hạn tin cậy mà Node được phép.

Các bản cập nhật trạng thái hiện diện bền vững của Node tuân theo cùng ranh giới danh tính:
sự kiện `node.presence.alive` chỉ được chấp nhận từ các phiên thiết bị Node
đã xác thực và chỉ cập nhật siêu dữ liệu ghép đôi khi danh tính thiết bị/Node
đã được ghép đôi. Giá trị `client.id` do thiết bị tự khai báo không đủ để ghi
trạng thái lần cuối được nhìn thấy.

## Tự động phê duyệt thiết bị được xác minh qua SSH (mặc định)

Việc ghép đôi thiết bị `role: node` lần đầu từ một địa chỉ riêng/CGNAT sẽ
tự động được phê duyệt khi Gateway có thể **chứng minh quyền sở hữu máy qua SSH**: Gateway
kết nối ngược lại máy chủ đang ghép đôi (`BatchMode`, `StrictHostKeyChecking=yes`),
chạy `openclaw node identity --json` tại đó và chỉ phê duyệt khi mã định danh
thiết bị từ xa cùng khóa công khai khớp chính xác với yêu cầu đang chờ xử lý. Việc khớp khóa
là yếu tố bảo đảm an toàn: chỉ có khả năng kết nối không bao giờ đủ để phê duyệt, vì vậy các bên cùng sử dụng NAT,
người dùng khác trên máy chủ dùng chung và hành vi giả mạo trong mạng LAN đều được chuyển sang
lời nhắc thông thường.

Được bật theo mặc định. Các yêu cầu để cơ chế này kích hoạt:

- Người dùng chạy tiến trình Gateway (hoặc `sshVerify.user`) có thể SSH tới máy chủ Node
  mà không cần tương tác (khóa/tác nhân; Tailscale SSH cũng hoạt động), đồng thời khóa máy chủ
  đã được tin cậy.
- `openclaw` được phân giải trên `PATH` từ xa cho `sh -lc` không tương tác.
- IP kết nối là một địa chỉ riêng, ULA,
  link-local hoặc CGNAT trực tiếp (không qua proxy, không phải local loopback), hoặc khớp với `sshVerify.cidrs` nếu được thiết lập.
- Cùng điều kiện đủ tối thiểu như phê duyệt theo CIDR tin cậy: chỉ áp dụng cho yêu cầu ghép đôi Node mới
  không có phạm vi; các lượt nâng cấp, trình duyệt, Control UI và WebChat luôn hiển thị lời nhắc.

Trong khi phép thăm dò đang chạy, máy khách Node được yêu cầu tiếp tục thử lại
(`wait_then_retry`) thay vì tạm dừng để chờ phê duyệt thủ công; nếu phép thăm dò
thất bại, lần thử tiếp theo sẽ quay về luồng lời nhắc thông thường. Các đích thất bại
sẽ có thời gian chờ ngắn (5 phút sau khi khóa không khớp).

Các thiết bị được phê duyệt sẽ ghi `approvedVia: "ssh-verified"` và bề mặt khả năng
được khai báo đầu tiên của chúng cũng được phê duyệt trong cùng bước — việc khớp khóa đã chứng minh
Node chạy dưới tài khoản của operator trên máy thuộc sở hữu của họ, tương đương với
điều được xác nhận qua phê duyệt khả năng thủ công. Các lần nâng cấp bề mặt sau đó vẫn
hiển thị lời nhắc.

Tăng cường bảo mật hoặc vô hiệu hóa:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Vô hiệu hóa hoàn toàn:
        sshVerify: false,
        // ...hoặc giới hạn phạm vi/điều chỉnh phép thăm dò:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Tự động phê duyệt (ứng dụng macOS)

Ứng dụng macOS có thể thử **phê duyệt ngầm** các yêu cầu về khả năng của Node
khi:

- yêu cầu được đánh dấu `silent` (Gateway đánh dấu bề mặt khả năng đầu tiên là ngầm
  khi việc ghép đôi thiết bị được phê duyệt không tương tác), và
- ứng dụng có thể xác minh kết nối SSH tới máy chủ Gateway bằng cùng
  người dùng.

Nếu phê duyệt ngầm thất bại, ứng dụng sẽ quay về lời nhắc Approve/Reject thông thường.

## Tự động phê duyệt thiết bị theo CIDR tin cậy

Theo mặc định, việc ghép đôi thiết bị WS cho `role: node` vẫn được thực hiện thủ công. Đối với các mạng Node
riêng mà Gateway đã tin cậy đường truyền mạng, operator có thể chủ động
bật cơ chế này bằng CIDR hoặc IP chính xác:

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

Ranh giới bảo mật:

- Bị vô hiệu hóa khi `gateway.nodes.pairing.autoApproveCidrs` chưa được thiết lập.
- Không có chế độ tự động phê duyệt toàn bộ mạng LAN hoặc mạng riêng; cơ chế tự động phê duyệt
  được xác minh qua SSH (bên trên) yêu cầu khóa thiết bị khớp bằng mật mã, tuyệt đối không chỉ
  dựa vào vị trí mạng.
- Chỉ yêu cầu ghép đôi thiết bị `role: node` mới, không yêu cầu phạm vi nào, mới
  đủ điều kiện.
- Các máy khách operator, trình duyệt, Control UI và WebChat vẫn cần xử lý thủ công.
- Các lượt nâng cấp vai trò, phạm vi, siêu dữ liệu và khóa công khai vẫn cần xử lý thủ công.
- Các đường dẫn tiêu đề proxy tin cậy qua local loopback trên cùng máy chủ không đủ điều kiện, vì đường dẫn đó
  có thể bị các bên gọi cục bộ giả mạo.

## Dọn dẹp bản ghi bị thay thế sau ghép đôi ngầm

Các lượt phê duyệt không tương tác ghi lại nguồn gốc trong hàng thiết bị đã ghép đôi:
các lượt phê duyệt theo chính sách cục bộ trên cùng máy chủ là `silent`, các lượt phê duyệt Node theo CIDR tin cậy là
`trusted-cidr`, còn các lượt phê duyệt Node được xác minh qua SSH là `ssh-verified`. Các máy khách có thư mục trạng thái tạm thời (thư mục chính tạm,
container, môi trường cô lập cho từng lượt chạy) tạo một cặp khóa thiết bị mới cho mỗi lượt chạy, và mỗi
lượt chạy đều âm thầm ghép đôi lại như một thiết bị hoàn toàn mới — nếu không dọn dẹp, danh sách đã ghép đôi
sẽ tăng thêm một hàng cũ cho mỗi lượt chạy.

Khi Gateway âm thầm phê duyệt việc ghép đôi thiết bị **cục bộ**, Gateway sẽ loại bỏ
các bản ghi được phê duyệt bằng `silent` cũ hơn, thuộc cùng cụm máy khách
(khớp `clientId`, `clientMode` và tên hiển thị) và hiện không
được kết nối. Các máy khách cục bộ chạy ngay trên máy chủ Gateway, do đó khóa cụm
không thể khớp với một máy khác. Các hàng đã loại bỏ sẽ mất token ngay lập tức;
mọi mục ghép đôi Node cũ tương ứng sẽ bị xóa và một sự kiện xóa `node.pair.resolved`
sẽ được phát rộng rãi.

Ranh giới:

- Chỉ các bản ghi có lần phê duyệt gần nhất là cục bộ trên cùng máy chủ (`silent`) mới
  đủ điều kiện, cả với vai trò tác nhân kích hoạt lẫn mục tiêu. Các lượt ghép đôi theo CIDR tin cậy và được xác minh qua SSH
  diễn ra giữa các máy chủ, nơi siêu dữ liệu hiển thị không phải là danh tính máy, nên chúng
  không bao giờ bị tự động xóa — hãy dùng tính năng dọn dẹp trong Control UI hoặc
  `openclaw nodes remove` cho các trường hợp đó.
- Các lượt ghép đôi do chủ sở hữu phê duyệt và qua mã QR/mã thiết lập (khởi tạo) không bao giờ bị
  tự động xóa. Các bản ghi được phê duyệt trước khi có thông tin nguồn gốc vẫn được bảo vệ,
  ngay cả sau một lần phê duyệt ngầm lại cùng mã định danh thiết bị.
- Các thiết bị hiện đang kết nối được bỏ qua, vì vậy những phiên cục bộ đồng thời với
  các thư mục trạng thái riêng biệt vẫn giữ token khi đang hoạt động. Các bản ghi được phê duyệt
  trong vòng một phút gần nhất cũng được bỏ qua, để các quy trình bắt tay ghép đôi đồng thời
  không thể loại bỏ lẫn nhau trước khi kết nối được đăng ký.
- Các máy khách bị ảnh hưởng vốn là máy khách cục bộ, nên chúng sẽ âm thầm ghép đôi lại trong
  lần kết nối tiếp theo.

## Tự động phê duyệt nâng cấp siêu dữ liệu

Khi một thiết bị đã ghép đôi kết nối lại chỉ với các thay đổi siêu dữ liệu
không nhạy cảm (ví dụ: tên hiển thị hoặc gợi ý nền tảng máy khách), OpenClaw xem
đó là một `metadata-upgrade`. Phê duyệt ngầm được giới hạn chặt chẽ: cơ chế này chỉ áp dụng
cho các lượt kết nối lại cục bộ, tin cậy và không qua trình duyệt đã chứng minh quyền sở hữu
thông tin xác thực cục bộ hoặc dùng chung, bao gồm các lượt kết nối lại của ứng dụng gốc trên cùng máy chủ sau
khi siêu dữ liệu phiên bản hệ điều hành thay đổi. Máy khách trình duyệt/Control UI và máy khách từ xa
vẫn sử dụng luồng phê duyệt lại rõ ràng. Các lượt nâng cấp phạm vi (từ đọc lên
ghi/quản trị) và thay đổi khóa công khai **không** đủ điều kiện để
tự động phê duyệt nâng cấp siêu dữ liệu; chúng vẫn là các yêu cầu phê duyệt lại rõ ràng.

## Trình trợ giúp ghép đôi bằng mã QR

`/pair qr` hiển thị tải trọng ghép nối dưới dạng phương tiện có cấu trúc để các ứng dụng khách trên thiết bị di động và trình duyệt có thể quét trực tiếp.

Việc xóa một thiết bị cũng dọn sạch mọi yêu cầu ghép nối đang chờ đã lỗi thời của id thiết bị đó, vì vậy `nodes pending` không hiển thị các hàng mồ côi sau khi thu hồi.

## Tính cục bộ và các tiêu đề được chuyển tiếp

Quy trình ghép nối Gateway chỉ coi một kết nối là local loopback khi cả socket thô và mọi bằng chứng từ proxy phía trước đều nhất quán. Nếu một yêu cầu đến qua local loopback nhưng chứa bằng chứng từ tiêu đề `Forwarded`, bất kỳ tiêu đề `X-Forwarded-*` nào hoặc `X-Real-IP`, bằng chứng từ tiêu đề được chuyển tiếp đó sẽ vô hiệu hóa tuyên bố về tính cục bộ của local loopback, và quy trình ghép nối yêu cầu phê duyệt rõ ràng thay vì ngầm coi yêu cầu là kết nối từ cùng máy chủ. Xem
[Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth) để biết quy tắc tương đương đối với xác thực của người vận hành.

## Lưu trữ (cục bộ, riêng tư)

Trạng thái ghép nối nằm trong các bản ghi thiết bị đã ghép nối trong cơ sở dữ liệu trạng thái SQLite dùng chung thuộc thư mục trạng thái Gateway (mặc định là `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (các thiết bị đã ghép nối cùng thông tin xác thực thiết bị,
  các bề mặt Node đã được phê duyệt, các yêu cầu bề mặt đang chờ, các yêu cầu ghép nối thiết bị
  đang chờ và các token khởi tạo)

Nếu bạn ghi đè `OPENCLAW_STATE_DIR`, cơ sở dữ liệu sẽ được chuyển theo. Các Gateway
được nâng cấp từ những bản phát hành sử dụng kho lưu trữ JSON sẽ nhập chúng khi khởi động và để lại
các tệp lưu trữ `devices/*.json.migrated` và `nodes/*.json.migrated`.

Lưu ý bảo mật:

- Token thiết bị là thông tin bí mật; hãy coi cơ sở dữ liệu trạng thái là dữ liệu nhạy cảm.
- Việc xoay vòng token thiết bị sử dụng `openclaw devices rotate` /
  `device.token.rotate`.

## Hoạt động của phương thức truyền tải

- Phương thức truyền tải **không lưu trạng thái**; nó không lưu trữ thông tin thành viên.
- Nếu Gateway ngoại tuyến hoặc tính năng ghép nối bị tắt, các Node không thể ghép nối.
- Ở chế độ từ xa, việc ghép nối được thực hiện với kho lưu trữ của Gateway từ xa.

## Liên quan

- [Ghép nối kênh](/vi/channels/pairing)
- [CLI Node](/vi/cli/nodes)
- [CLI thiết bị](/vi/cli/devices)
