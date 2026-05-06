---
read_when:
    - Triển khai phê duyệt ghép nối Node mà không cần giao diện người dùng macOS
    - Thêm các luồng CLI để phê duyệt các nút từ xa
    - Mở rộng giao thức Gateway với quản lý Node
summary: Ghép nối Node do Gateway quản lý (Tùy chọn B) cho iOS và các Node từ xa khác
title: Ghép nối do Gateway sở hữu
x-i18n:
    generated_at: "2026-05-06T09:14:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

Trong ghép đôi do Gateway quản lý, **Gateway** là nguồn sự thật cho việc các node nào
được phép tham gia. UI (ứng dụng macOS, các client tương lai) chỉ là frontend
phê duyệt hoặc từ chối các yêu cầu đang chờ.

**Quan trọng:** Các node WS dùng **ghép đôi thiết bị** (role `node`) trong quá trình `connect`.
`node.pair.*` là một kho ghép đôi riêng và **không** kiểm soát WS handshake.
Chỉ các client gọi rõ ràng `node.pair.*` mới dùng luồng này.

## Khái niệm

- **Yêu cầu đang chờ**: một node đã yêu cầu tham gia; cần phê duyệt.
- **Node đã ghép đôi**: node đã được phê duyệt với auth token đã cấp.
- **Transport**: endpoint WS của Gateway chuyển tiếp yêu cầu nhưng không quyết định
  tư cách thành viên. (Hỗ trợ TCP bridge cũ đã bị gỡ bỏ.)

## Cách ghép đôi hoạt động

1. Một node kết nối tới WS của Gateway và yêu cầu ghép đôi.
2. Gateway lưu một **yêu cầu đang chờ** và phát `node.pair.requested`.
3. Bạn phê duyệt hoặc từ chối yêu cầu (CLI hoặc UI).
4. Khi phê duyệt, Gateway cấp một **token mới** (token được xoay vòng khi ghép đôi lại).
5. Node kết nối lại bằng token và lúc này đã được "ghép đôi".

Các yêu cầu đang chờ tự động hết hạn sau **5 phút**.

## Quy trình CLI (thân thiện với môi trường headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` hiển thị các node đã ghép đôi/đã kết nối và capability của chúng.

## Bề mặt API (gateway protocol)

Sự kiện:

- `node.pair.requested` - được phát khi một yêu cầu đang chờ mới được tạo.
- `node.pair.resolved` - được phát khi một yêu cầu được phê duyệt/từ chối/hết hạn.

Phương thức:

- `node.pair.request` - tạo hoặc dùng lại một yêu cầu đang chờ.
- `node.pair.list` - liệt kê các node đang chờ + đã ghép đôi (`operator.pairing`).
- `node.pair.approve` - phê duyệt một yêu cầu đang chờ (cấp token).
- `node.pair.reject` - từ chối một yêu cầu đang chờ.
- `node.pair.remove` - xóa một mục node đã ghép đôi đã cũ.
- `node.pair.verify` - xác minh `{ nodeId, token }`.

Ghi chú:

- `node.pair.request` có tính idempotent theo từng node: các lần gọi lặp lại trả về cùng
  yêu cầu đang chờ.
- Các yêu cầu lặp lại cho cùng một node đang chờ cũng làm mới metadata node đã lưu
  và ảnh chụp declared command mới nhất trong danh sách cho phép để operator quan sát.
- Phê duyệt **luôn** tạo một token mới; không token nào từng được trả về từ
  `node.pair.request`.
- Các cấp độ phạm vi operator và kiểm tra tại thời điểm phê duyệt được tóm tắt trong
  [Phạm vi operator](/vi/gateway/operator-scopes).
- Yêu cầu có thể bao gồm `silent: true` như một gợi ý cho các luồng tự động phê duyệt.
- `node.pair.approve` dùng các command đã khai báo của yêu cầu đang chờ để áp đặt
  các phạm vi phê duyệt bổ sung:
  - yêu cầu không có command: `operator.pairing`
  - yêu cầu command không exec: `operator.pairing` + `operator.write`
  - yêu cầu `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Ghép đôi Node là một luồng tin cậy và danh tính cùng với việc cấp token. Nó **không** ghim bề mặt command node trực tiếp theo từng node.

- Các command node trực tiếp đến từ những gì node khai báo khi kết nối sau khi chính sách command node toàn cục của gateway (`gateway.nodes.allowCommands` và `denyCommands`) được áp dụng.
- Chính sách cho phép và hỏi của `system.run` theo từng node nằm trên node trong `exec.approvals.node.*`, không nằm trong bản ghi ghép đôi.

</Warning>

## Kiểm soát command Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tương thích:** Bắt đầu từ `2026.3.31`, các command node bị vô hiệu hóa cho đến khi ghép đôi node được phê duyệt. Chỉ ghép đôi thiết bị thôi không còn đủ để phơi bày các command node đã khai báo.
</Warning>

Khi một node kết nối lần đầu, việc ghép đôi được yêu cầu tự động. Cho đến khi yêu cầu ghép đôi được phê duyệt, tất cả command node đang chờ từ node đó đều bị lọc và sẽ không thực thi. Sau khi niềm tin được thiết lập thông qua phê duyệt ghép đôi, các command đã khai báo của node sẽ khả dụng theo chính sách command thông thường.

Điều này có nghĩa là:

- Các node trước đây chỉ dựa vào ghép đôi thiết bị để phơi bày command giờ phải hoàn tất ghép đôi node.
- Các command được xếp hàng trước khi phê duyệt ghép đôi sẽ bị loại bỏ, không được trì hoãn.

## Ranh giới tin cậy sự kiện Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tương thích:** Các lượt chạy bắt nguồn từ Node giờ ở trên một bề mặt tin cậy rút gọn.
</Warning>

Các bản tóm tắt bắt nguồn từ Node và các sự kiện session liên quan bị giới hạn trong bề mặt tin cậy dự kiến. Các luồng do thông báo điều khiển hoặc do node kích hoạt trước đây dựa vào quyền truy cập công cụ host hoặc session rộng hơn có thể cần điều chỉnh. Việc gia cố này bảo đảm rằng các sự kiện node không thể leo thang thành quyền truy cập công cụ cấp host vượt quá phạm vi ranh giới tin cậy của node cho phép.

Các bản cập nhật hiện diện node bền vững tuân theo cùng ranh giới danh tính. Sự kiện `node.presence.alive` chỉ
được chấp nhận từ các session thiết bị node đã xác thực và chỉ cập nhật metadata ghép đôi khi
danh tính thiết bị/node đã được ghép đôi. Các giá trị `client.id` tự khai báo không đủ để ghi
trạng thái nhìn-thấy-lần-cuối.

## Tự động phê duyệt (ứng dụng macOS)

Ứng dụng macOS có thể tùy chọn thử **phê duyệt im lặng** khi:

- yêu cầu được đánh dấu `silent`, và
- ứng dụng có thể xác minh một kết nối SSH tới host gateway bằng cùng người dùng.

Nếu phê duyệt im lặng thất bại, nó rơi về lời nhắc "Approve/Reject" thông thường.

## Tự động phê duyệt thiết bị theo CIDR tin cậy

Ghép đôi thiết bị WS cho `role: node` mặc định vẫn là thủ công. Với các mạng
node riêng tư nơi Gateway đã tin cậy đường dẫn mạng, operator có thể
chọn tham gia bằng các CIDR rõ ràng hoặc IP chính xác:

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
- Không có chế độ tự động phê duyệt LAN hoặc mạng riêng tư toàn cục.
- Chỉ ghép đôi thiết bị `role: node` mới, không có phạm vi được yêu cầu, mới đủ điều kiện.
- Các client operator, browser, Control UI và WebChat vẫn là thủ công.
- Nâng cấp role, phạm vi, metadata và public-key vẫn là thủ công.
- Các đường dẫn header trusted-proxy loopback cùng host không đủ điều kiện vì
  đường dẫn đó có thể bị giả mạo bởi các caller cục bộ.

## Tự động phê duyệt nâng cấp metadata

Khi một thiết bị đã ghép đôi kết nối lại chỉ với các thay đổi metadata không nhạy cảm
(ví dụ: tên hiển thị hoặc gợi ý nền tảng client), OpenClaw xem đó là một `metadata-upgrade`. Tự động phê duyệt im lặng có phạm vi hẹp: nó chỉ áp dụng
cho các lần kết nối lại cục bộ không phải browser, đáng tin cậy, vốn đã chứng minh quyền sở hữu thông tin xác thực cục bộ
hoặc dùng chung, bao gồm các lần kết nối lại ứng dụng native cùng host sau khi metadata phiên bản OS thay đổi. Các client Browser/Control UI và client từ xa vẫn
dùng luồng tái phê duyệt rõ ràng. Nâng cấp phạm vi (read sang write/admin) và
thay đổi public key **không** đủ điều kiện cho tự động phê duyệt metadata-upgrade -
chúng vẫn là các yêu cầu tái phê duyệt rõ ràng.

## Trình hỗ trợ ghép đôi QR

`/pair qr` kết xuất payload ghép đôi dưới dạng media có cấu trúc để các client mobile và
browser có thể quét trực tiếp.

Việc xóa một thiết bị cũng quét sạch mọi yêu cầu ghép đôi đang chờ đã cũ cho
device id đó, nên `nodes pending` không hiển thị các hàng mồ côi sau khi thu hồi.

## Locality và header được chuyển tiếp

Ghép đôi Gateway chỉ xem một kết nối là loopback khi cả raw socket
và mọi bằng chứng proxy upstream đều đồng ý. Nếu một yêu cầu đến trên loopback nhưng
mang các header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
trỏ tới một nguồn gốc không cục bộ, bằng chứng forwarded-header đó sẽ loại bỏ
tuyên bố locality loopback. Đường dẫn ghép đôi khi đó yêu cầu phê duyệt rõ ràng
thay vì âm thầm xem yêu cầu là kết nối cùng host. Xem
[Trusted Proxy Auth](/vi/gateway/trusted-proxy-auth) để biết quy tắc tương đương về
operator auth.

## Lưu trữ (cục bộ, riêng tư)

Trạng thái ghép đôi được lưu dưới thư mục trạng thái Gateway (mặc định `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Nếu bạn ghi đè `OPENCLAW_STATE_DIR`, thư mục `nodes/` sẽ di chuyển theo.

Ghi chú bảo mật:

- Token là bí mật; hãy xem `paired.json` là nhạy cảm.
- Xoay vòng token yêu cầu tái phê duyệt (hoặc xóa mục node).

## Hành vi transport

- Transport là **stateless**; nó không lưu tư cách thành viên.
- Nếu Gateway offline hoặc ghép đôi bị vô hiệu hóa, node không thể ghép đôi.
- Nếu Gateway ở chế độ từ xa, ghép đôi vẫn diễn ra trên kho của Gateway từ xa.

## Liên quan

- [Ghép đôi kênh](/vi/channels/pairing)
- [Nodes](/vi/nodes)
- [CLI thiết bị](/vi/cli/devices)
