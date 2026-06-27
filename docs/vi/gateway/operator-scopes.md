---
read_when:
    - Gỡ lỗi lỗi thiếu phạm vi người vận hành
    - Xem xét phê duyệt ghép nối thiết bị hoặc node
    - Thêm hoặc phân loại các phương thức RPC của Gateway
summary: Vai trò người vận hành, phạm vi và kiểm tra tại thời điểm phê duyệt cho các client Gateway
title: Phạm vi của người vận hành
x-i18n:
    generated_at: "2026-06-27T17:31:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Phạm vi operator xác định một client Gateway có thể làm gì sau khi xác thực.
Chúng là một biện pháp bảo vệ control plane bên trong một miền operator Gateway đáng tin cậy,
không phải cơ chế cô lập đa đối tượng thuê đối địch. Nếu bạn cần tách biệt mạnh giữa
người dùng, đội nhóm hoặc máy móc, hãy chạy các Gateway riêng dưới các người dùng OS hoặc
máy chủ riêng.

Liên quan: [Bảo mật](/vi/gateway/security), [Giao thức Gateway](/vi/gateway/protocol),
[Ghép đôi Gateway](/vi/gateway/pairing), [CLI thiết bị](/vi/cli/devices).

## Vai trò

Các client WebSocket Gateway kết nối với một vai trò:

- `operator`: các client control plane như CLI, Control UI, tự động hóa và
  các tiến trình trợ giúp đáng tin cậy.
- `node`: các máy chủ năng lực như macOS, iOS, Android hoặc các node không giao diện
  để lộ lệnh thông qua `node.invoke`.

Các phương thức RPC của operator yêu cầu vai trò `operator`. Các phương thức bắt nguồn từ node
yêu cầu vai trò `node`.

## Cấp độ phạm vi

| Phạm vi                 | Ý nghĩa                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Trạng thái chỉ đọc, danh sách, catalog, nhật ký, đọc phiên và các lệnh gọi control plane không thay đổi khác.                                                                       |
| `operator.write`        | Các hành động operator có thay đổi thông thường như gửi tin nhắn, gọi công cụ, cập nhật cài đặt talk/voice và chuyển tiếp lệnh node. Cũng thỏa mãn `operator.read`.                 |
| `operator.admin`        | Quyền truy cập control plane quản trị. Thỏa mãn mọi phạm vi `operator.*`. Bắt buộc để thay đổi cấu hình, cập nhật, native hooks, namespace dành riêng nhạy cảm và phê duyệt rủi ro cao. |
| `operator.pairing`      | Quản lý ghép đôi thiết bị và node, bao gồm liệt kê, phê duyệt, từ chối, xóa, xoay vòng và thu hồi bản ghi ghép đôi hoặc token thiết bị.                                             |
| `operator.approvals`    | API phê duyệt exec và plugin.                                                                                                                                                       |
| `operator.talk.secrets` | Đọc cấu hình Talk có bao gồm bí mật.                                                                                                                                                 |

Các phạm vi `operator.*` chưa biết trong tương lai yêu cầu khớp chính xác trừ khi bên gọi có
`operator.admin`.

## Phạm vi phương thức chỉ là cổng đầu tiên

Mỗi RPC Gateway có một phạm vi phương thức đặc quyền tối thiểu. Phạm vi phương thức đó quyết định
liệu yêu cầu có thể tới handler hay không. Sau đó, một số handler áp dụng các kiểm tra nghiêm ngặt hơn
tại thời điểm phê duyệt dựa trên đối tượng cụ thể đang được phê duyệt hoặc thay đổi.

Ví dụ:

- `device.pair.approve` có thể truy cập bằng `operator.pairing`, nhưng việc phê duyệt một
  thiết bị operator chỉ có thể tạo hoặc giữ lại các phạm vi mà bên gọi đã có.
- `node.pair.approve` có thể truy cập bằng `operator.pairing`, rồi suy ra các phạm vi
  phê duyệt bổ sung từ danh sách lệnh node đang chờ.
- `chat.send` thông thường là một phương thức thuộc phạm vi ghi, nhưng `/config set`
  và `/config unset` lâu dài yêu cầu `operator.admin` ở cấp lệnh.

Điều này cho phép các operator có phạm vi thấp hơn thực hiện các hành động ghép đôi rủi ro thấp mà không biến
mọi phê duyệt ghép đôi thành chỉ dành cho admin.

## Phê duyệt ghép đôi thiết bị

Bản ghi ghép đôi thiết bị là nguồn bền vững của các vai trò và phạm vi đã được phê duyệt.
Các thiết bị đã ghép đôi không âm thầm nhận quyền truy cập rộng hơn: các lần kết nối lại yêu cầu
vai trò rộng hơn hoặc phạm vi rộng hơn sẽ tạo một yêu cầu nâng cấp mới đang chờ.

Khi phê duyệt một yêu cầu thiết bị:

- Một yêu cầu không có vai trò operator không cần phê duyệt phạm vi token operator.
- Một yêu cầu cho vai trò thiết bị không phải operator, chẳng hạn như `node`, yêu cầu
  `operator.admin`, ngay cả khi `device.pair.approve` có thể truy cập bằng
  `operator.pairing`.
- Một yêu cầu cho `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing`, hoặc `operator.talk.secrets` yêu cầu bên gọi nắm giữ
  các phạm vi đó, hoặc `operator.admin`.
- Một yêu cầu cho `operator.admin` yêu cầu `operator.admin`.
- Một yêu cầu sửa chữa không có phạm vi rõ ràng có thể kế thừa các phạm vi token operator
  hiện có. Nếu token hiện có đó thuộc phạm vi admin, việc phê duyệt vẫn yêu cầu
  `operator.admin`.

Các phiên shared-secret và trusted-proxy không phải admin chỉ có thể phê duyệt các yêu cầu
thiết bị operator trong phạm vi operator đã khai báo của chính chúng. Phê duyệt các vai trò không phải operator
chỉ dành cho admin, ngay cả khi các phiên đó vẫn có thể dùng
`operator.pairing`.

Đối với các phiên token thiết bị đã ghép đôi, việc quản lý cũng bị giới hạn trong phạm vi của chính nó trừ khi
bên gọi có `operator.admin`: các bên gọi không phải admin chỉ thấy các mục ghép đôi của riêng mình,
chỉ có thể phê duyệt hoặc từ chối yêu cầu đang chờ của riêng mình, và chỉ có thể xoay vòng,
thu hồi hoặc xóa mục thiết bị của riêng mình.

## Phê duyệt ghép đôi node

`node.pair.*` legacy sử dụng một kho ghép đôi node riêng do Gateway sở hữu. Các node WS
sử dụng ghép đôi thiết bị với `role: node`, nhưng cùng bộ từ vựng cấp phê duyệt
vẫn được áp dụng.

`node.pair.approve` sử dụng danh sách lệnh trong yêu cầu đang chờ để suy ra các
phạm vi bắt buộc bổ sung:

- Yêu cầu không có lệnh: `operator.pairing`
- Lệnh node không phải exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, hoặc `system.which`:
  `operator.pairing` + `operator.admin`

Ghép đôi node thiết lập danh tính và niềm tin. Nó không thay thế chính sách phê duyệt exec
`system.run` riêng của node.

## Xác thực shared-secret

Xác thực bằng token/mật khẩu Gateway dùng chung được xem là quyền truy cập operator đáng tin cậy cho
Gateway đó. Các bề mặt HTTP tương thích OpenAI, `/tools/invoke`, và các endpoint lịch sử phiên HTTP
khôi phục bộ phạm vi mặc định operator đầy đủ thông thường cho xác thực bearer shared-secret,
ngay cả khi bên gọi gửi các phạm vi khai báo hẹp hơn.

Các chế độ mang danh tính, chẳng hạn như xác thực trusted proxy hoặc private-ingress `none`,
vẫn có thể tôn trọng các phạm vi khai báo rõ ràng. Hãy dùng các Gateway riêng cho việc tách biệt
ranh giới tin cậy thực sự.
