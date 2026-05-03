---
read_when:
    - Gỡ lỗi các lỗi thiếu phạm vi người vận hành
    - Xem xét các phê duyệt ghép nối thiết bị hoặc Node
    - Thêm hoặc phân loại các phương thức RPC của Gateway
summary: Vai trò người vận hành, phạm vi và kiểm tra tại thời điểm phê duyệt cho các máy khách Gateway
title: Phạm vi của người vận hành
x-i18n:
    generated_at: "2026-05-03T10:37:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Phạm vi operator xác định một client Gateway có thể làm gì sau khi xác thực.
Chúng là một hàng rào bảo vệ mặt phẳng điều khiển bên trong một miền người vận hành Gateway đáng tin cậy,
không phải cách ly đa đối tượng thuê trong môi trường đối địch. Nếu bạn cần tách biệt mạnh giữa
người dùng, nhóm hoặc máy, hãy chạy các Gateway riêng biệt dưới các người dùng hệ điều hành hoặc
máy chủ riêng biệt.

Liên quan: [Bảo mật](/vi/gateway/security), [Giao thức Gateway](/vi/gateway/protocol),
[Ghép nối Gateway](/vi/gateway/pairing), [CLI thiết bị](/vi/cli/devices).

## Vai trò

Client WebSocket Gateway kết nối với một vai trò:

- `operator`: client mặt phẳng điều khiển như CLI, Control UI, tự động hóa và
  các tiến trình trợ giúp đáng tin cậy.
- `node`: máy chủ năng lực như macOS, iOS, Android hoặc Node không giao diện
  cung cấp lệnh thông qua `node.invoke`.

Các phương thức RPC operator yêu cầu vai trò `operator`. Các phương thức bắt nguồn từ Node
yêu cầu vai trò `node`.

## Cấp độ phạm vi

| Phạm vi                 | Ý nghĩa                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Trạng thái chỉ đọc, danh sách, catalog, nhật ký, đọc phiên và các lệnh gọi mặt phẳng điều khiển không thay đổi dữ liệu khác.                                                        |
| `operator.write`        | Các hành động operator thay đổi dữ liệu thông thường như gửi tin nhắn, gọi công cụ, cập nhật cài đặt nói/giọng nói và chuyển tiếp lệnh Node. Cũng đáp ứng `operator.read`.          |
| `operator.admin`        | Quyền truy cập quản trị mặt phẳng điều khiển. Đáp ứng mọi phạm vi `operator.*`. Bắt buộc để thay đổi cấu hình, cập nhật, hook native, namespace dành riêng nhạy cảm và phê duyệt rủi ro cao. |
| `operator.pairing`      | Quản lý ghép nối thiết bị và Node, bao gồm liệt kê, phê duyệt, từ chối, gỡ bỏ, xoay vòng và thu hồi bản ghi ghép nối hoặc token thiết bị.                                            |
| `operator.approvals`    | API phê duyệt exec và Plugin.                                                                                                                                                       |
| `operator.talk.secrets` | Đọc cấu hình Talk với secret được bao gồm.                                                                                                                                           |

Các phạm vi `operator.*` tương lai chưa biết yêu cầu khớp chính xác trừ khi bên gọi có
`operator.admin`.

## Phạm vi phương thức chỉ là cổng đầu tiên

Mỗi RPC Gateway có một phạm vi phương thức theo nguyên tắc đặc quyền tối thiểu. Phạm vi phương thức đó quyết định
liệu yêu cầu có thể đến handler hay không. Sau đó, một số handler áp dụng các kiểm tra
nghiêm ngặt hơn tại thời điểm phê duyệt dựa trên đối tượng cụ thể đang được phê duyệt hoặc thay đổi.

Ví dụ:

- `device.pair.approve` có thể truy cập với `operator.pairing`, nhưng việc phê duyệt một
  thiết bị operator chỉ có thể tạo hoặc giữ lại các phạm vi mà bên gọi đã có.
- `node.pair.approve` có thể truy cập với `operator.pairing`, sau đó suy ra các
  phạm vi phê duyệt bổ sung từ danh sách lệnh Node đang chờ.
- `chat.send` thông thường là phương thức trong phạm vi ghi, nhưng `/config set`
  và `/config unset` có tính bền vững yêu cầu `operator.admin` ở cấp lệnh.

Điều này cho phép operator có phạm vi thấp hơn thực hiện các hành động ghép nối rủi ro thấp mà không biến
mọi phê duyệt ghép nối thành chỉ dành cho admin.

## Phê duyệt ghép nối thiết bị

Bản ghi ghép nối thiết bị là nguồn bền vững cho các vai trò và phạm vi đã được phê duyệt.
Thiết bị đã ghép nối không nhận quyền truy cập rộng hơn một cách âm thầm: các lần kết nối lại yêu cầu
vai trò rộng hơn hoặc phạm vi rộng hơn sẽ tạo một yêu cầu nâng cấp mới đang chờ.

Khi phê duyệt yêu cầu thiết bị:

- Yêu cầu không có vai trò operator không cần phê duyệt phạm vi token operator.
- Yêu cầu cho `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` hoặc `operator.talk.secrets` yêu cầu bên gọi có
  các phạm vi đó, hoặc `operator.admin`.
- Yêu cầu cho `operator.admin` yêu cầu `operator.admin`.
- Yêu cầu sửa chữa không có phạm vi tường minh có thể kế thừa các phạm vi token operator
  hiện có. Nếu token hiện có đó có phạm vi admin, việc phê duyệt vẫn yêu cầu
  `operator.admin`.

Đối với phiên token thiết bị đã ghép nối, việc quản lý được tự giới hạn phạm vi trừ khi bên gọi
cũng có `operator.admin`: bên gọi không phải admin chỉ có thể xoay vòng, thu hồi hoặc gỡ bỏ
mục thiết bị của chính họ.

## Phê duyệt ghép nối Node

`node.pair.*` cũ sử dụng một kho ghép nối Node riêng do Gateway sở hữu. Node WS
sử dụng ghép nối thiết bị với `role: node`, nhưng cùng bộ từ vựng cấp phê duyệt
được áp dụng.

`node.pair.approve` sử dụng danh sách lệnh của yêu cầu đang chờ để suy ra các
phạm vi bắt buộc bổ sung:

- Yêu cầu không có lệnh: `operator.pairing`
- Lệnh Node không phải exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

Ghép nối Node thiết lập danh tính và độ tin cậy. Nó không thay thế chính sách phê duyệt exec
`system.run` riêng của Node.

## Xác thực bằng secret dùng chung

Xác thực bằng token/mật khẩu gateway dùng chung được xem là quyền truy cập operator đáng tin cậy cho
Gateway đó. Các bề mặt HTTP tương thích OpenAI và `/tools/invoke` khôi phục
bộ phạm vi mặc định đầy đủ thông thường của operator cho xác thực bearer bằng secret dùng chung, ngay cả khi
bên gọi gửi các phạm vi khai báo hẹp hơn.

Các chế độ mang danh tính, chẳng hạn như xác thực proxy đáng tin cậy hoặc `none` cho ingress riêng,
vẫn có thể tôn trọng các phạm vi khai báo tường minh. Hãy dùng các Gateway riêng biệt để tách biệt
ranh giới tin cậy thực sự.
