---
read_when:
    - Triển khai phê duyệt ghép đôi Node mà không cần giao diện người dùng macOS
    - Thêm các luồng CLI để phê duyệt các node từ xa
    - Mở rộng giao thức Gateway với tính năng quản lý Node
summary: 'Phê duyệt khả năng của Node: cách các Node được cấp quyền truy cập lệnh sau khi ghép nối thiết bị'
title: Ghép nối Node
x-i18n:
    generated_at: "2026-07-16T14:32:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

Ghép đôi Node có hai lớp, cả hai đều được lưu trên bản ghi thiết bị đã ghép đôi trong cơ sở dữ liệu trạng thái SQLite của Gateway:

- **Ghép đôi thiết bị** (vai trò `node`) kiểm soát quá trình bắt tay `connect`. Xem
  [Tự động phê duyệt thiết bị theo CIDR tin cậy](#trusted-cidr-device-auto-approval)
  bên dưới và [Ghép đôi kênh](/vi/channels/pairing).
- **Phê duyệt khả năng của Node** (`node.pair.*`) kiểm soát các
  khả năng/lệnh đã khai báo mà Node được kết nối có thể cung cấp. Gateway là
  nguồn thông tin xác thực; các giao diện người dùng (ứng dụng macOS, giao diện điều khiển) là các frontend dùng để phê duyệt hoặc
  từ chối các yêu cầu đang chờ xử lý.

Kho lưu trữ ghép đôi Node độc lập trước đây (`nodes/paired.json` với một token riêng cho mỗi Node,
đã bị loại khỏi đường dẫn kết nối vào tháng 1 năm 2026) không còn tồn tại: khi khởi động, các Gateway hợp nhất
mọi hàng còn lại vào bản ghi thiết bị một lần và lưu trữ các
tệp cũ với hậu tố `.migrated`. Hỗ trợ cầu nối TCP cũ đã bị
loại bỏ.

## Cách hoạt động của việc phê duyệt khả năng

1. Một Node kết nối với WS của Gateway (việc ghép đôi thiết bị kiểm soát bước này).
2. Gateway so sánh bề mặt khả năng/lệnh đã khai báo với bề mặt
   đã được phê duyệt; các bề mặt mới hoặc được mở rộng sẽ lưu một **yêu cầu đang chờ xử lý** trên
   bản ghi thiết bị và phát `node.pair.requested`.
3. Bạn phê duyệt hoặc từ chối yêu cầu (CLI hoặc giao diện người dùng).
4. Cho đến khi được phê duyệt, các lệnh của Node vẫn bị lọc; việc phê duyệt sẽ cung cấp bề mặt
   đã khai báo, tuân theo chính sách lệnh thông thường.

Các yêu cầu đang chờ xử lý tự động hết hạn **5 phút sau lần
thử lại cuối cùng của Node** — một Node đang chủ động kết nối lại sẽ duy trì yêu cầu đang chờ xử lý duy nhất của mình
thay vì tạo yêu cầu mới (và lời nhắc phê duyệt) cho mỗi lần thử.

## Quy trình CLI (thân thiện với môi trường không giao diện)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` hiển thị các Node đã ghép đôi/đang kết nối và khả năng của chúng.

## Bề mặt API (giao thức Gateway)

Sự kiện:

- `node.pair.requested` - được phát khi một yêu cầu đang chờ xử lý mới được tạo.
- `node.pair.resolved` - được phát khi một yêu cầu được phê duyệt, bị từ chối hoặc
  hết hạn.

Phương thức:

- `node.pair.list` - liệt kê các Node đang chờ xử lý và đã ghép đôi (`operator.pairing`).
- `node.pair.approve` - phê duyệt một yêu cầu đang chờ xử lý.
- `node.pair.reject` - từ chối một yêu cầu đang chờ xử lý.
- `node.pair.remove` - xóa một Node đã ghép đôi. Thao tác này thu hồi vai trò `node`
  của thiết bị trong kho thiết bị đã ghép đôi, đồng thời loại bỏ bề mặt Node đã được phê duyệt và
  vô hiệu hóa/ngắt kết nối các phiên có vai trò Node của thiết bị đó. Một thiết bị **có nhiều vai trò**
  (ví dụ: thiết bị cũng có `operator`) vẫn giữ hàng của mình và chỉ
  mất vai trò `node`; hàng của thiết bị chỉ có vai trò Node sẽ bị xóa. Phân quyền:
  `operator.pairing` có thể xóa các hàng Node không phải người vận hành; bên gọi bằng token thiết bị
  thu hồi vai trò Node của **chính mình** trên một thiết bị có nhiều vai trò còn cần thêm
  `operator.admin`.
- `node.rename` - đổi tên hiển thị dành cho người vận hành của một Node đã ghép đôi.

Đã bị loại bỏ trong phiên bản 2026.7: `node.pair.request` và `node.pair.verify`. Các yêu cầu đang chờ xử lý
được chính Gateway tạo trong quá trình Node kết nối, và
token độc lập cho từng Node mà chúng phục vụ không còn tồn tại; cơ chế xác thực Node sử dụng
token ghép đôi thiết bị.

Lưu ý:

- Các lần kết nối lại với bề mặt không đổi sẽ tái sử dụng yêu cầu đang chờ xử lý; các yêu cầu
  lặp lại làm mới siêu dữ liệu Node đã lưu và ảnh chụp nhanh mới nhất của các lệnh đã khai báo
  nằm trong danh sách cho phép để người vận hành có thể quan sát.
- Các cấp phạm vi của người vận hành và kiểm tra tại thời điểm phê duyệt được tóm tắt trong
  [Phạm vi của người vận hành](/vi/gateway/operator-scopes).
- `node.pair.approve` sử dụng các lệnh đã khai báo của yêu cầu đang chờ xử lý để thực thi
  các phạm vi phê duyệt bổ sung:
  - yêu cầu không có lệnh: `operator.pairing`
  - yêu cầu lệnh thông thường: `operator.pairing` + `operator.write`
  - yêu cầu nhạy cảm về quản trị chứa `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` hoặc
    `system.execApprovals.get/set`: `operator.pairing` + `operator.admin`

<Warning>
Việc phê duyệt ghép đôi Node ghi lại bề mặt khả năng tin cậy. Việc này **không** cố định bề mặt lệnh Node đang hoạt động cho từng Node.

- Các lệnh Node đang hoạt động đến từ nội dung Node khai báo khi kết nối, được lọc theo
  chính sách lệnh Node toàn cục của Gateway (`gateway.nodes.allowCommands` và
  `denyCommands`).
- Chính sách cho phép và yêu cầu `system.run` theo từng Node nằm trên Node trong
  `exec.approvals.node.*`, không nằm trong bản ghi ghép đôi.

</Warning>

## Kiểm soát lệnh Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ khả năng tương thích:** bắt đầu từ `2026.3.31`, các lệnh Node bị vô hiệu hóa cho đến khi việc ghép đôi Node được phê duyệt. Chỉ ghép đôi thiết bị không còn đủ để cung cấp các lệnh Node đã khai báo.
</Warning>

Khi một Node kết nối lần đầu tiên, yêu cầu ghép đôi được tạo tự động.
Cho đến khi yêu cầu đó được phê duyệt, mọi lệnh Node đang chờ xử lý từ Node đó đều bị
lọc và sẽ không được thực thi. Sau khi việc ghép đôi được phê duyệt, các lệnh
đã khai báo của Node sẽ khả dụng, tuân theo chính sách lệnh thông thường.

Điều này có nghĩa là:

- Các Node trước đây chỉ dựa vào việc ghép đôi thiết bị để cung cấp lệnh thì giờ đây
  cũng phải hoàn tất việc ghép đôi Node.
- Các lệnh được đưa vào hàng đợi trước khi phê duyệt ghép đôi sẽ bị loại bỏ, không bị trì hoãn.

## Ranh giới tin cậy của sự kiện Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ khả năng tương thích:** các lượt chạy bắt nguồn từ Node giờ đây chỉ nằm trên một bề mặt tin cậy hạn chế.
</Warning>

Các bản tóm tắt bắt nguồn từ Node và những sự kiện phiên liên quan bị giới hạn trong
bề mặt tin cậy dự kiến. Các luồng do thông báo hoặc Node kích hoạt mà
trước đây phụ thuộc vào quyền truy cập rộng hơn đối với công cụ máy chủ hoặc phiên có thể cần được điều chỉnh.
Việc gia cố này ngăn các sự kiện Node leo thang thành quyền truy cập công cụ cấp máy chủ
vượt quá phạm vi ranh giới tin cậy của Node.

Các cập nhật trạng thái hiện diện bền vững của Node tuân theo cùng ranh giới danh tính:
sự kiện `node.presence.alive` chỉ được chấp nhận từ các phiên thiết bị Node
đã xác thực và chỉ cập nhật siêu dữ liệu ghép đôi khi danh tính thiết bị/Node
đã được ghép đôi. Giá trị `client.id` tự khai báo không đủ để ghi
trạng thái nhìn thấy lần cuối.

## Tự động phê duyệt thiết bị được xác minh bằng SSH (mặc định)

Việc ghép đôi thiết bị `role: node` lần đầu từ một địa chỉ riêng/CGNAT được
tự động phê duyệt khi Gateway có thể **chứng minh quyền sở hữu máy qua SSH**: Gateway
kết nối ngược lại với máy chủ ghép đôi (`BatchMode`, `StrictHostKeyChecking=yes`),
chạy `openclaw node identity --json` tại đó và chỉ phê duyệt khi
ID thiết bị từ xa và khóa công khai khớp chính xác với yêu cầu đang chờ xử lý. Việc đối chiếu khóa là
yếu tố bảo đảm an toàn: chỉ có khả năng kết nối sẽ không bao giờ được phê duyệt, vì vậy các bên cùng sử dụng NAT,
những người dùng khác trên máy chủ dùng chung và hành vi giả mạo LAN đều chuyển sang lời nhắc
thông thường.

Được bật theo mặc định. Các yêu cầu để cơ chế này kích hoạt:

- Người dùng chạy tiến trình Gateway (hoặc `sshVerify.user`) có thể SSH tới máy chủ Node
  theo cách không tương tác (khóa/tác nhân; Tailscale SSH cũng hoạt động) và khóa máy chủ
  đã được tin cậy.
- `openclaw` phân giải trên `PATH` từ xa cho `sh -lc` không tương tác.
- IP kết nối là một địa chỉ riêng, ULA,
  liên kết cục bộ hoặc CGNAT trực tiếp (không qua proxy, không phải loopback), hoặc khớp với `sshVerify.cidrs` khi được đặt.
- Ngưỡng đủ điều kiện giống như phê duyệt CIDR tin cậy: chỉ việc ghép đôi Node
  mới, không có phạm vi; các nâng cấp, trình duyệt, giao diện điều khiển và WebChat luôn hiển thị lời nhắc.

Trong khi một phép thăm dò đang chạy, ứng dụng khách Node được yêu cầu tiếp tục thử lại
(`wait_then_retry`) thay vì tạm dừng để chờ phê duyệt thủ công; nếu phép thăm dò
thất bại, lần thử tiếp theo sẽ chuyển sang luồng lời nhắc thông thường. Các mục tiêu thất bại
có thời gian chờ ngắn (5 phút sau khi khóa không khớp).

Các thiết bị được phê duyệt ghi lại `approvedVia: "ssh-verified"` và bề mặt
khả năng được khai báo đầu tiên của chúng được phê duyệt trong cùng bước — việc khóa khớp đã chứng minh
Node chạy bằng tài khoản của người vận hành trên máy do họ sở hữu, đây cũng chính là
khẳng định mà việc phê duyệt khả năng thủ công xác nhận. Các lần nâng cấp bề mặt sau đó vẫn
hiển thị lời nhắc.

Gia cố hoặc vô hiệu hóa:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Vô hiệu hóa hoàn toàn:
        sshVerify: false,
        // ...hoặc giới hạn/điều chỉnh phép thăm dò:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Tự động phê duyệt (ứng dụng macOS)

Ứng dụng macOS có thể thử **phê duyệt ngầm** các yêu cầu về khả năng của Node
khi:

- yêu cầu được đánh dấu `silent` (Gateway đánh dấu bề mặt khả năng đầu tiên
  là ngầm khi việc ghép đôi thiết bị được phê duyệt theo cách không tương tác), và
- ứng dụng có thể xác minh kết nối SSH tới máy chủ Gateway bằng cùng
  người dùng.

Nếu phê duyệt ngầm thất bại, ứng dụng sẽ chuyển sang lời nhắc Approve/Reject thông thường.

## Tự động phê duyệt thiết bị theo CIDR tin cậy

Việc ghép đôi thiết bị WS cho `role: node` mặc định vẫn được thực hiện thủ công. Đối với các mạng Node
riêng mà Gateway đã tin cậy đường dẫn mạng, người vận hành có thể chủ động bật
bằng các CIDR hoặc IP chính xác:

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

- Bị vô hiệu hóa khi `gateway.nodes.pairing.autoApproveCidrs` chưa được đặt.
- Không tồn tại chế độ tự động phê duyệt toàn bộ LAN hoặc mạng riêng; cơ chế tự động phê duyệt
  được xác minh bằng SSH (ở trên) yêu cầu đối chiếu khóa thiết bị bằng mật mã, tuyệt đối không chỉ dựa vào
  vị trí mạng.
- Chỉ yêu cầu ghép đôi thiết bị `role: node` mới, không yêu cầu phạm vi,
  mới đủ điều kiện.
- Ứng dụng khách dành cho người vận hành, trình duyệt, giao diện điều khiển và WebChat vẫn phải thực hiện thủ công.
- Các nâng cấp vai trò, phạm vi, siêu dữ liệu và khóa công khai vẫn phải thực hiện thủ công.
- Các đường dẫn tiêu đề proxy tin cậy loopback trên cùng máy chủ không đủ điều kiện vì
  đường dẫn đó có thể bị các bên gọi cục bộ giả mạo.

## Dọn dẹp mục bị thay thế khi ghép đôi ngầm

Các phê duyệt không tương tác ghi lại nguồn gốc trên hàng thiết bị đã ghép đôi:
các phê duyệt theo chính sách cục bộ trên cùng máy chủ dưới dạng `silent`, các phê duyệt Node theo CIDR tin cậy dưới dạng
`trusted-cidr`, các phê duyệt Node được xác minh bằng SSH dưới dạng `ssh-verified`. Các ứng dụng khách có thư mục trạng thái tạm thời (thư mục chính tạm thời,
vùng chứa, sandbox theo từng lượt chạy) tạo một cặp khóa thiết bị mới trong mỗi lượt chạy, và mỗi
lượt chạy lại ghép đôi ngầm dưới dạng một thiết bị hoàn toàn mới — nếu không dọn dẹp, danh sách đã ghép đôi
sẽ tăng thêm một hàng cũ cho mỗi lượt chạy.

Khi Gateway phê duyệt ngầm việc ghép đôi một thiết bị **cục bộ**, Gateway loại bỏ
các bản ghi được phê duyệt bằng `silent` cũ hơn thuộc cùng cụm ứng dụng khách
(khớp `clientId`, `clientMode` và tên hiển thị) và hiện không
được kết nối. Các ứng dụng khách cục bộ chạy ngay trên máy chủ Gateway, vì vậy khóa cụm
không thể khớp với một máy khác. Các hàng bị loại bỏ mất token ngay lập tức;
mọi mục ghép đôi Node cũ tương ứng đều bị xóa và sự kiện xóa `node.pair.resolved`
được phát rộng rãi.

Ranh giới:

- Chỉ những bản ghi có lần phê duyệt gần nhất là cục bộ trên cùng máy (`silent`) mới
  đủ điều kiện, cả với vai trò kích hoạt lẫn mục tiêu. Các ghép nối được xác minh bằng CIDR đáng tin cậy và SSH
  đi qua nhiều máy, nơi siêu dữ liệu hiển thị không phải là danh tính máy, vì vậy chúng
  không bao giờ bị tự động xóa — hãy dùng chức năng dọn dẹp trong giao diện điều khiển hoặc
  `openclaw nodes remove` cho các trường hợp đó.
- Các ghép nối được chủ sở hữu phê duyệt và ghép nối bằng mã QR/mã thiết lập (khởi tạo) không bao giờ bị
  tự động xóa. Các bản ghi được phê duyệt trước khi có thông tin nguồn gốc vẫn được bảo vệ,
  ngay cả sau lần tái phê duyệt âm thầm sau đó cho cùng một mã định danh thiết bị.
- Các thiết bị hiện đang kết nối sẽ được bỏ qua, nên các phiên cục bộ đồng thời có
  thư mục trạng thái riêng vẫn giữ token của mình khi đang hoạt động. Các bản ghi được phê duyệt
  trong phút vừa qua cũng được bỏ qua, để các quy trình bắt tay ghép nối đồng thời
  không thể loại bỏ lẫn nhau trước khi kết nối của chúng được ghi nhận.
- Theo thiết kế, các máy khách bị ảnh hưởng đều là cục bộ, nên chúng sẽ âm thầm ghép nối lại
  trong lần kết nối tiếp theo.

## Tự động phê duyệt khi nâng cấp siêu dữ liệu

Khi một thiết bị đã ghép nối kết nối lại mà chỉ có các thay đổi siêu dữ liệu
không nhạy cảm (ví dụ: tên hiển thị hoặc gợi ý về nền tảng máy khách), OpenClaw coi
đó là một `metadata-upgrade`. Phạm vi tự động phê duyệt âm thầm rất hẹp: chỉ áp dụng
cho các lần kết nối lại cục bộ đáng tin cậy không qua trình duyệt, đã chứng minh quyền sở hữu
thông tin xác thực cục bộ hoặc dùng chung, bao gồm các lần kết nối lại của ứng dụng gốc trên cùng máy sau
khi siêu dữ liệu phiên bản hệ điều hành thay đổi. Các máy khách trình duyệt/giao diện điều khiển và máy khách từ xa
vẫn sử dụng quy trình tái phê duyệt rõ ràng. Việc nâng cấp phạm vi (từ quyền đọc lên
ghi/quản trị) và thay đổi khóa công khai **không** đủ điều kiện để
tự động phê duyệt khi nâng cấp siêu dữ liệu; chúng vẫn là các yêu cầu tái phê duyệt rõ ràng.

## Trình hỗ trợ ghép nối bằng mã QR

`/pair qr` kết xuất tải trọng ghép nối dưới dạng phương tiện có cấu trúc để máy khách di động và
trình duyệt có thể quét trực tiếp.

Việc xóa một thiết bị cũng dọn sạch mọi yêu cầu ghép nối đang chờ đã lỗi thời cho
mã định danh thiết bị đó, nên `nodes pending` không hiển thị các hàng mồ côi sau khi thu hồi.

## Tính cục bộ và các tiêu đề được chuyển tiếp

Quy trình ghép nối của Gateway chỉ coi một kết nối là loopback khi cả socket thô
và mọi bằng chứng từ proxy thượng nguồn đều thống nhất. Nếu một yêu cầu đến qua loopback nhưng
mang bằng chứng tiêu đề `Forwarded`, bất kỳ `X-Forwarded-*` nào hoặc `X-Real-IP`, thì
bằng chứng tiêu đề được chuyển tiếp đó sẽ bác bỏ tuyên bố về tính cục bộ của loopback, và
đường dẫn ghép nối yêu cầu phê duyệt rõ ràng thay vì âm thầm coi
yêu cầu là kết nối từ cùng máy. Xem
[Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth) để biết quy tắc tương đương đối với
xác thực người vận hành.

## Lưu trữ (cục bộ, riêng tư)

Trạng thái ghép nối nằm trong các bản ghi thiết bị đã ghép nối trong cơ sở dữ liệu trạng thái SQLite
dùng chung, bên dưới thư mục trạng thái Gateway (mặc định là `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (các thiết bị đã ghép nối có xác thực thiết bị,
  các bề mặt Node đã được phê duyệt, các yêu cầu bề mặt đang chờ, các yêu cầu ghép nối thiết bị
  đang chờ và các token khởi tạo)

Nếu bạn ghi đè `OPENCLAW_STATE_DIR`, cơ sở dữ liệu sẽ di chuyển theo. Các Gateway
được nâng cấp từ những bản phát hành sử dụng kho lưu trữ JSON sẽ nhập chúng khi khởi động và để lại
các tệp lưu trữ `devices/*.json.migrated` và `nodes/*.json.migrated`.

Lưu ý bảo mật:

- Token thiết bị là thông tin bí mật; hãy coi cơ sở dữ liệu trạng thái là dữ liệu nhạy cảm.
- Việc xoay vòng token thiết bị sử dụng `openclaw devices rotate` /
  `device.token.rotate`.

## Hành vi truyền tải

- Lớp truyền tải **không lưu trạng thái**; nó không lưu tư cách thành viên.
- Nếu Gateway ngoại tuyến hoặc tính năng ghép nối bị tắt, các Node không thể ghép nối.
- Ở chế độ từ xa, việc ghép nối diễn ra với kho lưu trữ của Gateway từ xa.

## Liên quan

- [Ghép nối kênh](/vi/channels/pairing)
- [CLI Node](/vi/cli/nodes)
- [CLI thiết bị](/vi/cli/devices)
