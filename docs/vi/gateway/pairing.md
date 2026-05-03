---
read_when:
    - Triển khai phê duyệt ghép nối Node mà không cần giao diện người dùng macOS
    - Thêm các luồng CLI để phê duyệt các nút từ xa
    - Mở rộng giao thức Gateway với quản lý Node
summary: Ghép cặp Node do Gateway sở hữu (Tùy chọn B) cho iOS và các Node từ xa khác
title: Ghép nối do Gateway quản lý
x-i18n:
    generated_at: "2026-05-03T10:37:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

Trong ghép nối do Gateway sở hữu, **Gateway** là nguồn sự thật cho việc node nào
được phép tham gia. Các giao diện người dùng (ứng dụng macOS, ứng dụng khách trong tương lai) chỉ là frontend
phê duyệt hoặc từ chối các yêu cầu đang chờ.  

**Quan trọng:** Các node WS dùng **ghép nối thiết bị** (role `node`) trong lúc `connect`.
`node.pair.*` là một kho ghép nối riêng và **không** chặn bước bắt tay WS.
Chỉ các ứng dụng khách gọi rõ ràng `node.pair.*` mới dùng luồng này.

## Khái niệm

- **Yêu cầu đang chờ**: một node đã yêu cầu tham gia; cần phê duyệt.
- **Node đã ghép nối**: node đã được phê duyệt với token xác thực đã cấp.
- **Lớp truyền tải**: endpoint WS của Gateway chuyển tiếp yêu cầu nhưng không quyết định
  tư cách thành viên. (Hỗ trợ cầu nối TCP cũ đã bị gỡ bỏ.)

## Cách ghép nối hoạt động

1. Một node kết nối đến WS của Gateway và yêu cầu ghép nối.
2. Gateway lưu một **yêu cầu đang chờ** và phát `node.pair.requested`.
3. Bạn phê duyệt hoặc từ chối yêu cầu (CLI hoặc giao diện người dùng).
4. Khi phê duyệt, Gateway cấp một **token mới** (token được xoay vòng khi ghép nối lại).
5. Node kết nối lại bằng token và lúc này đã “được ghép nối”.

Các yêu cầu đang chờ tự động hết hạn sau **5 phút**.

## Quy trình CLI (thân thiện với headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` hiển thị các node đã ghép nối/đã kết nối và capability của chúng.

## Bề mặt API (giao thức Gateway)

Sự kiện:

- `node.pair.requested` — được phát khi một yêu cầu đang chờ mới được tạo.
- `node.pair.resolved` — được phát khi một yêu cầu được phê duyệt/từ chối/hết hạn.

Phương thức:

- `node.pair.request` — tạo hoặc tái sử dụng một yêu cầu đang chờ.
- `node.pair.list` — liệt kê node đang chờ + đã ghép nối (`operator.pairing`).
- `node.pair.approve` — phê duyệt một yêu cầu đang chờ (cấp token).
- `node.pair.reject` — từ chối một yêu cầu đang chờ.
- `node.pair.remove` — xóa một mục node đã ghép nối cũ.
- `node.pair.verify` — xác minh `{ nodeId, token }`.

Ghi chú:

- `node.pair.request` là idempotent theo từng node: các lần gọi lặp lại trả về cùng
  một yêu cầu đang chờ.
- Các yêu cầu lặp lại cho cùng một node đang chờ cũng làm mới metadata node đã lưu
  và snapshot lệnh đã khai báo được allowlist mới nhất để operator có thể quan sát.
- Việc phê duyệt **luôn** tạo token mới; không token nào từng được trả về từ
  `node.pair.request`.
- Các mức phạm vi operator và kiểm tra tại thời điểm phê duyệt được tóm tắt trong
  [Phạm vi operator](/vi/gateway/operator-scopes).
- Yêu cầu có thể bao gồm `silent: true` như một gợi ý cho các luồng tự động phê duyệt.
- `node.pair.approve` dùng các lệnh đã khai báo của yêu cầu đang chờ để thực thi
  các phạm vi phê duyệt bổ sung:
  - yêu cầu không có lệnh: `operator.pairing`
  - yêu cầu lệnh không phải exec: `operator.pairing` + `operator.write`
  - yêu cầu `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Ghép nối Node là một luồng tin cậy và định danh cộng với cấp token. Nó **không** ghim bề mặt lệnh node trực tiếp theo từng node.

- Lệnh node trực tiếp đến từ những gì node khai báo khi kết nối sau khi chính sách lệnh node toàn cục của gateway (`gateway.nodes.allowCommands` và `denyCommands`) được áp dụng.
- Chính sách allow và ask cho `system.run` theo từng node nằm trên node trong `exec.approvals.node.*`, không nằm trong bản ghi ghép nối.

</Warning>

## Chặn lệnh Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tương thích:** Bắt đầu từ `2026.3.31`, lệnh node bị vô hiệu hóa cho đến khi ghép nối node được phê duyệt. Chỉ ghép nối thiết bị thôi không còn đủ để lộ các lệnh node đã khai báo.
</Warning>

Khi một node kết nối lần đầu, việc ghép nối được yêu cầu tự động. Cho đến khi yêu cầu ghép nối được phê duyệt, mọi lệnh node đang chờ từ node đó đều bị lọc và sẽ không được thực thi. Khi niềm tin được thiết lập thông qua phê duyệt ghép nối, các lệnh đã khai báo của node sẽ có sẵn tùy theo chính sách lệnh thông thường.

Điều này có nghĩa là:

- Các node trước đây chỉ dựa vào ghép nối thiết bị để lộ lệnh giờ phải hoàn tất ghép nối node.
- Các lệnh được xếp hàng trước khi phê duyệt ghép nối sẽ bị bỏ, không được trì hoãn.

## Ranh giới tin cậy sự kiện Node (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tương thích:** Các lần chạy bắt nguồn từ node giờ nằm trên một bề mặt tin cậy thu hẹp.
</Warning>

Các bản tóm tắt bắt nguồn từ node và các sự kiện phiên liên quan bị giới hạn trong bề mặt tin cậy dự định. Các luồng do thông báo điều khiển hoặc do node kích hoạt trước đây dựa vào quyền truy cập công cụ host hoặc phiên rộng hơn có thể cần điều chỉnh. Biện pháp gia cố này bảo đảm sự kiện node không thể leo thang thành quyền truy cập công cụ cấp host vượt quá những gì ranh giới tin cậy của node cho phép.

Các cập nhật hiện diện node bền vững tuân theo cùng ranh giới định danh. Sự kiện `node.presence.alive` chỉ được
chấp nhận từ các phiên thiết bị node đã xác thực và chỉ cập nhật metadata ghép nối khi
định danh thiết bị/node đã được ghép nối. Các giá trị `client.id` tự khai báo không đủ để ghi
trạng thái lần thấy gần nhất.

## Tự động phê duyệt (ứng dụng macOS)

Ứng dụng macOS có thể tùy chọn thử **phê duyệt im lặng** khi:

- yêu cầu được đánh dấu `silent`, và
- ứng dụng có thể xác minh kết nối SSH đến host gateway bằng cùng người dùng.

Nếu phê duyệt im lặng thất bại, nó quay về lời nhắc “Phê duyệt/Từ chối” thông thường.

## Tự động phê duyệt thiết bị bằng CIDR tin cậy

Ghép nối thiết bị WS cho `role: node` mặc định vẫn là thủ công. Với các mạng
node riêng nơi Gateway đã tin cậy đường dẫn mạng, operator có thể
bật bằng CIDR rõ ràng hoặc IP chính xác:

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
- Không có chế độ tự động phê duyệt LAN hoặc mạng riêng bao trùm.
- Chỉ ghép nối thiết bị `role: node` mới, không yêu cầu phạm vi, mới đủ điều kiện.
- Các ứng dụng khách operator, trình duyệt, Control UI và WebChat vẫn là thủ công.
- Nâng cấp role, scope, metadata và public-key vẫn là thủ công.
- Các đường dẫn header proxy tin cậy same-host loopback không đủ điều kiện vì
  đường dẫn đó có thể bị giả mạo bởi caller cục bộ.

## Tự động phê duyệt nâng cấp metadata

Khi một thiết bị đã ghép nối kết nối lại chỉ với các thay đổi metadata không nhạy cảm
(ví dụ tên hiển thị hoặc gợi ý nền tảng ứng dụng khách), OpenClaw xem
đó là một `metadata-upgrade`. Tự động phê duyệt im lặng có phạm vi hẹp: nó chỉ áp dụng
cho các lần kết nối lại cục bộ không phải trình duyệt đáng tin cậy đã chứng minh quyền sở hữu thông tin xác thực cục bộ
hoặc chia sẻ, bao gồm các lần kết nối lại của ứng dụng native same-host sau khi metadata phiên bản OS
thay đổi. Ứng dụng khách trình duyệt/Control UI và ứng dụng khách từ xa vẫn
dùng luồng phê duyệt lại rõ ràng. Nâng cấp scope (read lên write/admin) và
thay đổi public key **không** đủ điều kiện để tự động phê duyệt metadata-upgrade —
chúng vẫn là các yêu cầu phê duyệt lại rõ ràng.

## Trình trợ giúp ghép nối QR

`/pair qr` kết xuất payload ghép nối dưới dạng media có cấu trúc để ứng dụng khách di động và
trình duyệt có thể quét trực tiếp.

Việc xóa thiết bị cũng quét sạch mọi yêu cầu ghép nối đang chờ cũ cho
id thiết bị đó, nên `nodes pending` không hiển thị các hàng mồ côi sau khi thu hồi.

## Tính cục bộ và header được chuyển tiếp

Ghép nối Gateway chỉ xem một kết nối là loopback khi cả socket thô
và mọi bằng chứng proxy upstream đều đồng ý. Nếu một yêu cầu đến trên loopback nhưng
mang header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
trỏ đến một nguồn gốc không cục bộ, bằng chứng forwarded-header đó sẽ loại bỏ
tuyên bố locality loopback. Khi đó đường dẫn ghép nối yêu cầu phê duyệt rõ ràng
thay vì âm thầm xem yêu cầu là kết nối same-host. Xem
[Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth) để biết quy tắc tương đương về
xác thực operator.

## Lưu trữ (cục bộ, riêng tư)

Trạng thái ghép nối được lưu trong thư mục trạng thái Gateway (mặc định `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Nếu bạn ghi đè `OPENCLAW_STATE_DIR`, thư mục `nodes/` sẽ di chuyển theo.

Ghi chú bảo mật:

- Token là bí mật; hãy xem `paired.json` là nhạy cảm.
- Xoay vòng token yêu cầu phê duyệt lại (hoặc xóa mục node).

## Hành vi lớp truyền tải

- Lớp truyền tải là **stateless**; nó không lưu tư cách thành viên.
- Nếu Gateway offline hoặc ghép nối bị vô hiệu hóa, node không thể ghép nối.
- Nếu Gateway ở chế độ từ xa, ghép nối vẫn diễn ra với kho của Gateway từ xa.

## Liên quan

- [Ghép nối kênh](/vi/channels/pairing)
- [Nodes](/vi/nodes)
- [CLI thiết bị](/vi/cli/devices)
