---
read_when:
    - Gỡ lỗi các lỗi thiếu phạm vi của người vận hành
    - Xem xét các phê duyệt ghép nối thiết bị hoặc Node
    - Thêm hoặc phân loại các phương thức RPC của Gateway
summary: Vai trò, phạm vi và kiểm tra tại thời điểm phê duyệt của người vận hành cho các ứng dụng khách Gateway
title: Phạm vi của người vận hành
x-i18n:
    generated_at: "2026-05-04T02:24:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Các phạm vi của người vận hành xác định những gì một máy khách Gateway có thể làm sau khi xác thực.
Chúng là rào chắn control-plane bên trong một miền người vận hành Gateway đáng tin cậy,
không phải cơ chế cô lập đa bên thuê thù địch. Nếu bạn cần tách biệt mạnh giữa
người dùng, nhóm hoặc máy, hãy chạy các Gateway riêng biệt dưới các người dùng OS hoặc
máy chủ riêng biệt.

Liên quan: [Bảo mật](/vi/gateway/security), [Giao thức Gateway](/vi/gateway/protocol),
[Ghép nối Gateway](/vi/gateway/pairing), [CLI thiết bị](/vi/cli/devices).

## Vai trò

Máy khách WebSocket của Gateway kết nối bằng một vai trò:

- `operator`: các máy khách control-plane như CLI, Giao diện điều khiển, tự động hóa và
  các tiến trình trợ giúp đáng tin cậy.
- `node`: máy chủ năng lực như macOS, iOS, Android hoặc các node không giao diện, vốn
  cung cấp lệnh thông qua `node.invoke`.

Các phương thức RPC của người vận hành yêu cầu vai trò `operator`. Các phương thức bắt nguồn từ node
yêu cầu vai trò `node`.

## Cấp phạm vi

| Phạm vi                 | Ý nghĩa                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Trạng thái chỉ đọc, danh sách, danh mục, nhật ký, đọc phiên và các lệnh gọi control-plane không làm thay đổi khác.                                                                                    |
| `operator.write`        | Các hành động người vận hành có thay đổi thông thường như gửi tin nhắn, gọi công cụ, cập nhật cài đặt nói/giọng nói và chuyển tiếp lệnh node. Cũng thỏa mãn `operator.read`.                      |
| `operator.admin`        | Quyền truy cập control-plane quản trị. Thỏa mãn mọi phạm vi `operator.*`. Bắt buộc để thay đổi cấu hình, cập nhật, hook native, namespace dành riêng nhạy cảm và phê duyệt rủi ro cao. |
| `operator.pairing`      | Quản lý ghép nối thiết bị và node, bao gồm liệt kê, phê duyệt, từ chối, xóa, xoay vòng và thu hồi bản ghi ghép nối hoặc token thiết bị.                                       |
| `operator.approvals`    | API phê duyệt exec và plugin.                                                                                                                                                        |
| `operator.talk.secrets` | Đọc cấu hình Talk kèm theo bí mật.                                                                                                                                     |

Các phạm vi `operator.*` tương lai chưa biết yêu cầu khớp chính xác trừ khi bên gọi có
`operator.admin`.

## Phạm vi phương thức chỉ là cổng đầu tiên

Mỗi RPC Gateway có một phạm vi phương thức đặc quyền tối thiểu. Phạm vi phương thức đó quyết định
liệu yêu cầu có thể tới handler hay không. Sau đó, một số handler áp dụng các kiểm tra nghiêm ngặt hơn
tại thời điểm phê duyệt dựa trên thứ cụ thể đang được phê duyệt hoặc thay đổi.

Ví dụ:

- `device.pair.approve` có thể truy cập bằng `operator.pairing`, nhưng việc phê duyệt một
  thiết bị người vận hành chỉ có thể cấp hoặc giữ lại các phạm vi mà bên gọi đã có.
- `node.pair.approve` có thể truy cập bằng `operator.pairing`, sau đó suy ra các
  phạm vi phê duyệt bổ sung từ danh sách lệnh node đang chờ.
- `chat.send` thường là phương thức có phạm vi ghi, nhưng `/config set` và `/config unset`
  bền vững yêu cầu `operator.admin` ở cấp lệnh.

Điều này cho phép người vận hành có phạm vi thấp hơn thực hiện các hành động ghép nối rủi ro thấp mà không biến
mọi phê duyệt ghép nối thành chỉ dành cho quản trị viên.

## Phê duyệt ghép nối thiết bị

Bản ghi ghép nối thiết bị là nguồn bền vững của các vai trò và phạm vi đã được phê duyệt.
Các thiết bị đã ghép nối không âm thầm nhận quyền truy cập rộng hơn: các lần kết nối lại yêu cầu
vai trò rộng hơn hoặc phạm vi rộng hơn sẽ tạo một yêu cầu nâng cấp mới đang chờ.

Khi phê duyệt yêu cầu thiết bị:

- Yêu cầu không có vai trò người vận hành không cần phê duyệt phạm vi token người vận hành.
- Yêu cầu cho `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` hoặc `operator.talk.secrets` yêu cầu bên gọi phải có
  các phạm vi đó, hoặc `operator.admin`.
- Yêu cầu cho `operator.admin` yêu cầu `operator.admin`.
- Yêu cầu sửa chữa không có phạm vi rõ ràng có thể kế thừa các phạm vi token người vận hành
  hiện có. Nếu token hiện có đó có phạm vi quản trị, việc phê duyệt vẫn yêu cầu
  `operator.admin`.

Đối với các phiên token thiết bị đã ghép nối, việc quản lý được tự giới hạn phạm vi trừ khi bên gọi
cũng có `operator.admin`: bên gọi không phải quản trị viên chỉ thấy các mục ghép nối của chính họ,
chỉ có thể phê duyệt hoặc từ chối yêu cầu đang chờ của chính họ, và chỉ có thể xoay vòng, thu hồi hoặc
xóa mục thiết bị của chính họ.

## Phê duyệt ghép nối node

`node.pair.*` cũ dùng một kho ghép nối node riêng do Gateway sở hữu. Các node WS
dùng ghép nối thiết bị với `role: node`, nhưng cùng bộ thuật ngữ cấp phê duyệt
vẫn được áp dụng.

`node.pair.approve` dùng danh sách lệnh của yêu cầu đang chờ để suy ra các
phạm vi bắt buộc bổ sung:

- Yêu cầu không có lệnh: `operator.pairing`
- Lệnh node không phải exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

Ghép nối node thiết lập danh tính và độ tin cậy. Nó không thay thế chính sách
phê duyệt exec `system.run` riêng của node.

## Xác thực bằng bí mật dùng chung

Xác thực bằng token/mật khẩu gateway dùng chung được xem là quyền truy cập người vận hành đáng tin cậy cho
Gateway đó. Các bề mặt HTTP tương thích OpenAI và `/tools/invoke` khôi phục
tập phạm vi mặc định đầy đủ bình thường của người vận hành cho xác thực bearer bằng bí mật dùng chung, ngay cả khi
bên gọi gửi các phạm vi khai báo hẹp hơn.

Các chế độ mang danh tính, chẳng hạn như xác thực proxy đáng tin cậy hoặc `none` qua private ingress,
vẫn có thể tôn trọng các phạm vi khai báo rõ ràng. Hãy dùng các Gateway riêng biệt để tách biệt
ranh giới tin cậy thực sự.
