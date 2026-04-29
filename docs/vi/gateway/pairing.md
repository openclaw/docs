---
read_when:
    - Triển khai phê duyệt ghép nối node mà không cần giao diện người dùng macOS
    - Thêm các luồng CLI để phê duyệt các nút từ xa
    - Mở rộng giao thức Gateway với tính năng quản lý Node
summary: Ghép nối nút do Gateway quản lý (Tùy chọn B) cho iOS và các nút từ xa khác
title: Ghép nối do Gateway sở hữu
x-i18n:
    generated_at: "2026-04-29T22:45:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

Trong ghép đôi do Gateway sở hữu, **Gateway** là nguồn xác thực cho việc Node nào
được phép tham gia. UI (ứng dụng macOS, các client trong tương lai) chỉ là frontend
phê duyệt hoặc từ chối các yêu cầu đang chờ.

**Quan trọng:** Các Node WS dùng **ghép đôi thiết bị** (role `node`) trong quá trình `connect`.
`node.pair.*` là một kho ghép đôi riêng và **không** kiểm soát bắt tay WS.
Chỉ các client gọi tường minh `node.pair.*` mới dùng luồng này.

## Khái niệm

- **Yêu cầu đang chờ**: một Node đã yêu cầu tham gia; cần phê duyệt.
- **Node đã ghép đôi**: Node đã được phê duyệt với auth token đã cấp.
- **Transport**: endpoint WS của Gateway chuyển tiếp yêu cầu nhưng không quyết định
  tư cách thành viên. (Hỗ trợ cầu nối TCP cũ đã bị gỡ bỏ.)

## Cách ghép đôi hoạt động

1. Một Node kết nối tới WS của Gateway và yêu cầu ghép đôi.
2. Gateway lưu một **yêu cầu đang chờ** và phát `node.pair.requested`.
3. Bạn phê duyệt hoặc từ chối yêu cầu (CLI hoặc UI).
4. Khi phê duyệt, Gateway cấp một **token mới** (token được xoay vòng khi ghép đôi lại).
5. Node kết nối lại bằng token và lúc này đã “được ghép đôi”.

Các yêu cầu đang chờ tự động hết hạn sau **5 phút**.

## Quy trình CLI (phù hợp cho môi trường không giao diện)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` hiển thị các Node đã ghép đôi/đang kết nối và capability của chúng.

## Bề mặt API (giao thức Gateway)

Sự kiện:

- `node.pair.requested` — được phát khi một yêu cầu đang chờ mới được tạo.
- `node.pair.resolved` — được phát khi một yêu cầu được phê duyệt/từ chối/hết hạn.

Phương thức:

- `node.pair.request` — tạo hoặc tái sử dụng một yêu cầu đang chờ.
- `node.pair.list` — liệt kê các Node đang chờ + đã ghép đôi (`operator.pairing`).
- `node.pair.approve` — phê duyệt một yêu cầu đang chờ (cấp token).
- `node.pair.reject` — từ chối một yêu cầu đang chờ.
- `node.pair.remove` — xóa một mục Node đã ghép đôi cũ.
- `node.pair.verify` — xác minh `{ nodeId, token }`.

Ghi chú:

- `node.pair.request` là idempotent theo từng Node: các lần gọi lặp lại trả về cùng
  một yêu cầu đang chờ.
- Các yêu cầu lặp lại cho cùng một Node đang chờ cũng làm mới metadata Node đã lưu
  và ảnh chụp declared command mới nhất trong allowlist để operator có thể quan sát.
- Phê duyệt **luôn** tạo một token mới; không token nào từng được trả về từ
  `node.pair.request`.
- Yêu cầu có thể bao gồm `silent: true` như một gợi ý cho các luồng tự động phê duyệt.
- `node.pair.approve` dùng các command đã khai báo của yêu cầu đang chờ để áp dụng
  các scope phê duyệt bổ sung:
  - yêu cầu không có command: `operator.pairing`
  - yêu cầu command không phải exec: `operator.pairing` + `operator.write`
  - yêu cầu `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Ghép đôi Node là một luồng tin cậy và định danh cộng với cấp token. Nó **không** ghim bề mặt command Node trực tiếp theo từng Node.

- Command Node trực tiếp đến từ những gì Node khai báo khi connect sau khi chính sách command Node toàn cục của gateway (`gateway.nodes.allowCommands` và `denyCommands`) được áp dụng.
- Chính sách cho phép và hỏi theo từng Node cho `system.run` nằm trên Node trong `exec.approvals.node.*`, không nằm trong bản ghi ghép đôi.

</Warning>

## Kiểm soát command Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tương thích:** Bắt đầu từ `2026.3.31`, command Node bị tắt cho đến khi ghép đôi Node được phê duyệt. Chỉ ghép đôi thiết bị không còn đủ để lộ các command Node đã khai báo.
</Warning>

Khi một Node kết nối lần đầu, ghép đôi được yêu cầu tự động. Cho đến khi yêu cầu ghép đôi được phê duyệt, mọi command Node đang chờ từ Node đó đều bị lọc và sẽ không thực thi. Khi tin cậy được thiết lập thông qua phê duyệt ghép đôi, các command đã khai báo của Node sẽ khả dụng theo chính sách command thông thường.

Điều này có nghĩa là:

- Các Node trước đây chỉ dựa vào ghép đôi thiết bị để lộ command giờ phải hoàn tất ghép đôi Node.
- Các command được xếp hàng trước khi phê duyệt ghép đôi sẽ bị loại bỏ, không được trì hoãn.

## Ranh giới tin cậy sự kiện Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tương thích:** Các run bắt nguồn từ Node giờ nằm trên một bề mặt tin cậy thu hẹp.
</Warning>

Các bản tóm tắt bắt nguồn từ Node và những sự kiện session liên quan bị giới hạn trong bề mặt tin cậy dự kiến. Các luồng do thông báo điều khiển hoặc do Node kích hoạt trước đây dựa vào quyền truy cập công cụ host hoặc session rộng hơn có thể cần điều chỉnh. Việc gia cố này đảm bảo sự kiện Node không thể nâng cấp thành quyền truy cập công cụ cấp host vượt quá những gì ranh giới tin cậy của Node cho phép.

Các cập nhật hiện diện Node bền vững tuân theo cùng ranh giới định danh. Sự kiện `node.presence.alive` chỉ được
chấp nhận từ các session thiết bị Node đã xác thực và chỉ cập nhật metadata ghép đôi khi
định danh thiết bị/Node đã được ghép đôi. Các giá trị `client.id` tự khai báo không đủ để ghi
trạng thái last-seen.

## Tự động phê duyệt (ứng dụng macOS)

Ứng dụng macOS có thể tùy chọn thử **phê duyệt im lặng** khi:

- yêu cầu được đánh dấu `silent`, và
- ứng dụng có thể xác minh kết nối SSH tới host gateway bằng cùng người dùng.

Nếu phê duyệt im lặng thất bại, nó quay về lời nhắc “Phê duyệt/Từ chối” thông thường.

## Tự động phê duyệt thiết bị theo CIDR đáng tin cậy

Ghép đôi thiết bị WS cho `role: node` mặc định vẫn là thủ công. Với các mạng
Node riêng tư nơi Gateway đã tin cậy đường mạng, operator có thể
chọn tham gia bằng CIDR tường minh hoặc IP chính xác:

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

- Bị tắt khi `gateway.nodes.pairing.autoApproveCidrs` chưa được đặt.
- Không có chế độ tự động phê duyệt toàn bộ LAN hoặc mạng riêng tư.
- Chỉ ghép đôi thiết bị `role: node` mới không có scope được yêu cầu mới đủ điều kiện.
- Các client operator, trình duyệt, Control UI và WebChat vẫn là thủ công.
- Nâng cấp role, scope, metadata và public key vẫn là thủ công.
- Các đường dẫn header trusted-proxy local loopback cùng host không đủ điều kiện vì
  đường dẫn đó có thể bị giả mạo bởi caller cục bộ.

## Tự động phê duyệt nâng cấp metadata

Khi một thiết bị đã ghép đôi kết nối lại chỉ với các thay đổi metadata không nhạy cảm
(ví dụ: tên hiển thị hoặc gợi ý nền tảng client), OpenClaw xem đó là
`metadata-upgrade`. Tự động phê duyệt im lặng có phạm vi hẹp: chỉ áp dụng
cho các lần kết nối lại cục bộ không phải trình duyệt, đáng tin cậy, đã chứng minh sở hữu thông tin xác thực cục bộ
hoặc dùng chung, bao gồm các lần kết nối lại ứng dụng native cùng host sau thay đổi metadata
phiên bản OS. Client trình duyệt/Control UI và client từ xa vẫn
dùng luồng tái phê duyệt tường minh. Nâng cấp scope (read lên write/admin) và
thay đổi public key **không** đủ điều kiện cho tự động phê duyệt metadata-upgrade —
chúng vẫn là các yêu cầu tái phê duyệt tường minh.

## Trình trợ giúp ghép đôi QR

`/pair qr` render payload ghép đôi dưới dạng media có cấu trúc để client di động và
trình duyệt có thể quét trực tiếp.

Xóa một thiết bị cũng quét dọn mọi yêu cầu ghép đôi đang chờ cũ cho
device id đó, vì vậy `nodes pending` không hiển thị các hàng mồ côi sau khi thu hồi.

## Tính cục bộ và header được chuyển tiếp

Ghép đôi Gateway xem một kết nối là loopback chỉ khi cả socket thô
và mọi bằng chứng proxy upstream đều đồng thuận. Nếu một yêu cầu đi vào trên loopback nhưng
mang các header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
trỏ tới một nguồn gốc không cục bộ, bằng chứng forwarded-header đó làm mất hiệu lực
tuyên bố locality loopback. Khi đó đường ghép đôi yêu cầu phê duyệt tường minh
thay vì âm thầm xem yêu cầu là kết nối cùng host. Xem
[Trusted Proxy Auth](/vi/gateway/trusted-proxy-auth) để biết quy tắc tương đương về
xác thực operator.

## Lưu trữ (cục bộ, riêng tư)

Trạng thái ghép đôi được lưu dưới thư mục trạng thái Gateway (mặc định `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Nếu bạn ghi đè `OPENCLAW_STATE_DIR`, thư mục `nodes/` sẽ di chuyển theo.

Ghi chú bảo mật:

- Token là bí mật; hãy xem `paired.json` là nhạy cảm.
- Xoay vòng token yêu cầu tái phê duyệt (hoặc xóa mục Node).

## Hành vi transport

- Transport là **stateless**; nó không lưu tư cách thành viên.
- Nếu Gateway offline hoặc ghép đôi bị tắt, các Node không thể ghép đôi.
- Nếu Gateway ở chế độ từ xa, ghép đôi vẫn diễn ra với kho của Gateway từ xa.

## Liên quan

- [Ghép đôi kênh](/vi/channels/pairing)
- [Nodes](/vi/nodes)
- [CLI thiết bị](/vi/cli/devices)
