---
read_when:
    - Triển khai phê duyệt ghép nối Node mà không cần giao diện người dùng macOS
    - Thêm các luồng CLI để phê duyệt các nút từ xa
    - Mở rộng giao thức gateway với quản lý node
summary: Ghép cặp nút do Gateway sở hữu (Tùy chọn B) cho iOS và các nút từ xa khác
title: Gateway sở hữu ghép đôi
x-i18n:
    generated_at: "2026-06-27T17:31:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

Trong quá trình ghép đôi do Gateway sở hữu, **Gateway** là nguồn dữ liệu xác thực về những nút
được phép tham gia. UI (ứng dụng macOS, các máy khách tương lai) chỉ là các giao diện
phê duyệt hoặc từ chối yêu cầu đang chờ.

**Quan trọng:** Các nút WS dùng **ghép đôi thiết bị** (vai trò `node`) trong lúc `connect`.
`node.pair.*` là một kho ghép đôi riêng và **không** chặn bắt tay WS.
Chỉ những máy khách gọi tường minh `node.pair.*` mới dùng luồng này.

## Khái niệm

- **Yêu cầu đang chờ**: một nút đã yêu cầu tham gia; cần được phê duyệt.
- **Nút đã ghép đôi**: nút đã được phê duyệt với token xác thực đã cấp.
- **Transport**: điểm cuối WS của Gateway chuyển tiếp yêu cầu nhưng không quyết định
  tư cách thành viên. (Hỗ trợ cầu nối TCP cũ đã bị gỡ bỏ.)

## Cách ghép đôi hoạt động

1. Một nút kết nối tới WS của Gateway và yêu cầu ghép đôi.
2. Gateway lưu một **yêu cầu đang chờ** và phát ra `node.pair.requested`.
3. Bạn phê duyệt hoặc từ chối yêu cầu (CLI hoặc UI).
4. Khi được phê duyệt, Gateway cấp một **token mới** (token được xoay vòng khi ghép đôi lại).
5. Nút kết nối lại bằng token và giờ đã được "ghép đôi".

Yêu cầu đang chờ tự động hết hạn sau **5 phút**.

## Quy trình CLI (thân thiện với môi trường không có giao diện)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` hiển thị các nút đã ghép đôi/đã kết nối và năng lực của chúng.

## Bề mặt API (giao thức gateway)

Sự kiện:

- `node.pair.requested` - được phát ra khi một yêu cầu đang chờ mới được tạo.
- `node.pair.resolved` - được phát ra khi một yêu cầu được phê duyệt/từ chối/hết hạn.

Phương thức:

- `node.pair.request` - tạo hoặc tái sử dụng một yêu cầu đang chờ.
- `node.pair.list` - liệt kê các nút đang chờ + đã ghép đôi (`operator.pairing`).
- `node.pair.approve` - phê duyệt một yêu cầu đang chờ (cấp token).
- `node.pair.reject` - từ chối một yêu cầu đang chờ.
- `node.pair.remove` - gỡ bỏ một nút đã ghép đôi. Với các ghép đôi dựa trên thiết bị, thao tác này
  thu hồi vai trò `node` của thiết bị: nó sửa đổi `devices/paired.json` và
  vô hiệu hóa/ngắt kết nối các phiên vai trò nút của thiết bị đó. Một thiết bị **nhiều vai trò**
  (ví dụ: cũng giữ `operator`) vẫn giữ hàng của nó và chỉ mất vai trò `node`;
  hàng của thiết bị chỉ có nút sẽ bị xóa. Nó cũng gỡ mọi mục ghép đôi nút cũ do Gateway sở hữu khớp tương ứng. Authz: `operator.pairing` có thể gỡ bỏ
  các hàng nút không phải operator; một bên gọi bằng device-token thu hồi vai trò nút **của chính nó** trên
  thiết bị nhiều vai trò còn cần thêm `operator.admin`.
- `node.pair.verify` - xác minh `{ nodeId, token }`.

Ghi chú:

- `node.pair.request` là lũy đẳng theo từng nút: các lần gọi lặp lại trả về cùng
  yêu cầu đang chờ.
- Các yêu cầu lặp lại cho cùng một nút đang chờ cũng làm mới siêu dữ liệu nút đã lưu
  và ảnh chụp lệnh đã khai báo mới nhất trong danh sách cho phép để operator quan sát.
- Phê duyệt **luôn** tạo token mới; không token nào từng được trả về từ
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
Ghép đôi nút là một luồng tin cậy và định danh cùng với việc cấp token. Nó **không** ghim bề mặt lệnh nút trực tiếp theo từng nút.

- Lệnh nút trực tiếp đến từ những gì nút khai báo khi kết nối sau khi chính sách lệnh nút toàn cục của gateway (`gateway.nodes.allowCommands` và `denyCommands`) được áp dụng.
- Chính sách cho phép và hỏi theo từng nút cho `system.run` nằm trên nút trong `exec.approvals.node.*`, không nằm trong bản ghi ghép đôi.

</Warning>

## Chặn lệnh nút (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tương thích:** Bắt đầu từ `2026.3.31`, lệnh nút bị tắt cho đến khi ghép đôi nút được phê duyệt. Chỉ ghép đôi thiết bị thôi không còn đủ để phơi bày các lệnh nút đã khai báo.
</Warning>

Khi một nút kết nối lần đầu, ghép đôi được yêu cầu tự động. Cho đến khi yêu cầu ghép đôi được phê duyệt, mọi lệnh nút đang chờ từ nút đó đều bị lọc và sẽ không thực thi. Sau khi niềm tin được thiết lập thông qua phê duyệt ghép đôi, các lệnh đã khai báo của nút sẽ khả dụng theo chính sách lệnh thông thường.

Điều này có nghĩa là:

- Các nút trước đây chỉ dựa vào ghép đôi thiết bị để phơi bày lệnh giờ phải hoàn tất ghép đôi nút.
- Các lệnh được xếp hàng trước khi phê duyệt ghép đôi sẽ bị loại bỏ, không được trì hoãn.

## Ranh giới tin cậy sự kiện nút (2026.3.31+)

<Warning>
**Thay đổi phá vỡ tương thích:** Các lần chạy khởi phát từ nút giờ nằm trên một bề mặt tin cậy bị thu hẹp.
</Warning>

Các bản tóm tắt khởi phát từ nút và sự kiện phiên liên quan bị giới hạn trong bề mặt tin cậy dự kiến. Các luồng do thông báo điều khiển hoặc do nút kích hoạt trước đây dựa vào quyền truy cập công cụ rộng hơn ở cấp host hoặc phiên có thể cần điều chỉnh. Việc gia cố này đảm bảo sự kiện nút không thể leo thang thành quyền truy cập công cụ cấp host vượt quá những gì ranh giới tin cậy của nút cho phép.

Các cập nhật hiện diện nút bền vững tuân theo cùng ranh giới định danh. Sự kiện `node.presence.alive` được
chấp nhận chỉ từ các phiên thiết bị nút đã xác thực và chỉ cập nhật siêu dữ liệu ghép đôi khi
định danh thiết bị/nút đã được ghép đôi. Các giá trị `client.id` tự khai báo không đủ để ghi
trạng thái lần thấy gần nhất.

## Tự động phê duyệt (ứng dụng macOS)

Ứng dụng macOS có thể tùy chọn thử **phê duyệt im lặng** khi:

- yêu cầu được đánh dấu `silent`, và
- ứng dụng có thể xác minh kết nối SSH tới máy chủ gateway bằng cùng người dùng.

Nếu phê duyệt im lặng thất bại, nó quay về lời nhắc "Phê duyệt/Từ chối" thông thường.

## Tự động phê duyệt thiết bị theo CIDR tin cậy

Ghép đôi thiết bị WS cho `role: node` mặc định vẫn là thủ công. Với các mạng
nút riêng tư nơi Gateway đã tin cậy đường mạng, operator có thể
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
- Không có chế độ tự động phê duyệt toàn bộ LAN hoặc mạng riêng.
- Chỉ ghép đôi thiết bị `role: node` mới, không có phạm vi được yêu cầu, mới đủ điều kiện.
- Các máy khách operator, trình duyệt, Control UI và WebChat vẫn thủ công.
- Nâng cấp vai trò, phạm vi, siêu dữ liệu và khóa công khai vẫn thủ công.
- Các đường dẫn header trusted-proxy local loopback cùng host không đủ điều kiện vì đường dẫn đó
  có thể bị bên gọi cục bộ giả mạo.

## Tự động phê duyệt nâng cấp siêu dữ liệu

Khi một thiết bị đã ghép đôi kết nối lại chỉ với các thay đổi siêu dữ liệu không nhạy cảm
(ví dụ: tên hiển thị hoặc gợi ý nền tảng máy khách), OpenClaw xem
đó là `metadata-upgrade`. Tự động phê duyệt im lặng rất hẹp: nó chỉ áp dụng
cho các lần kết nối lại cục bộ không phải trình duyệt đáng tin cậy đã chứng minh quyền sở hữu thông tin xác thực cục bộ
hoặc dùng chung, bao gồm các lần kết nối lại ứng dụng gốc cùng host sau thay đổi siêu dữ liệu
phiên bản OS. Máy khách trình duyệt/Control UI và máy khách từ xa vẫn
dùng luồng phê duyệt lại tường minh. Nâng cấp phạm vi (read sang write/admin) và
thay đổi khóa công khai **không** đủ điều kiện cho tự động phê duyệt metadata-upgrade -
chúng vẫn là yêu cầu phê duyệt lại tường minh.

## Trợ giúp ghép đôi QR

`/pair qr` kết xuất payload ghép đôi dưới dạng phương tiện có cấu trúc để máy khách di động và
trình duyệt có thể quét trực tiếp.

Xóa một thiết bị cũng quét sạch mọi yêu cầu ghép đôi đang chờ đã cũ cho
id thiết bị đó, nên `nodes pending` không hiển thị hàng mồ côi sau khi thu hồi.

## Tính cục bộ và header được chuyển tiếp

Ghép đôi Gateway chỉ xem một kết nối là loopback khi cả socket thô
và mọi bằng chứng proxy thượng nguồn đều thống nhất. Nếu một yêu cầu đến trên loopback nhưng
mang bằng chứng header `Forwarded`, bất kỳ `X-Forwarded-*`, hoặc `X-Real-IP`, bằng chứng
header được chuyển tiếp đó sẽ làm mất hiệu lực tuyên bố tính cục bộ loopback. Đường dẫn ghép đôi
khi đó yêu cầu phê duyệt tường minh thay vì âm thầm xem yêu cầu là
kết nối cùng host. Xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth) để biết
quy tắc tương đương trên xác thực operator.

## Lưu trữ (cục bộ, riêng tư)

Trạng thái ghép đôi được lưu dưới thư mục trạng thái Gateway (mặc định `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Nếu bạn ghi đè `OPENCLAW_STATE_DIR`, thư mục `nodes/` sẽ di chuyển theo nó.

Ghi chú bảo mật:

- Token là bí mật; hãy xem `paired.json` là nhạy cảm.
- Xoay vòng token yêu cầu phê duyệt lại (hoặc xóa mục nút).

## Hành vi transport

- Transport là **phi trạng thái**; nó không lưu trữ tư cách thành viên.
- Nếu Gateway ngoại tuyến hoặc ghép đôi bị tắt, các nút không thể ghép đôi.
- Nếu Gateway ở chế độ từ xa, ghép đôi vẫn diễn ra với kho của Gateway từ xa.

## Liên quan

- [Ghép đôi kênh](/vi/channels/pairing)
- [Nút](/vi/nodes)
- [CLI thiết bị](/vi/cli/devices)
