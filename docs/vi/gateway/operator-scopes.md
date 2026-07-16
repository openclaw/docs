---
read_when:
    - Gỡ lỗi thiếu phạm vi operator
    - Xem xét phê duyệt ghép đôi thiết bị hoặc Node
    - Thêm hoặc phân loại các phương thức RPC của Gateway
summary: Vai trò của người vận hành, phạm vi và các bước kiểm tra tại thời điểm phê duyệt dành cho máy khách Gateway
title: Phạm vi của người vận hành
x-i18n:
    generated_at: "2026-07-16T15:17:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Phạm vi operator kiểm soát những gì một máy khách Gateway có thể thực hiện sau khi xác thực.
Chúng là cơ chế bảo vệ mặt phẳng điều khiển trong một miền operator Gateway đáng tin cậy,
không phải cơ chế cô lập nhiều bên thuê có tính đối kháng. Để phân tách mạnh giữa người dùng,
nhóm hoặc máy, hãy chạy các Gateway riêng biệt dưới các người dùng hệ điều hành hoặc máy chủ riêng biệt.

Liên quan: [Bảo mật](/vi/gateway/security), [Giao thức Gateway](/vi/gateway/protocol),
[Ghép nối Gateway](/vi/gateway/pairing), [CLI thiết bị](/vi/cli/devices).

## Vai trò

Mỗi máy khách WebSocket của Gateway kết nối với một vai trò:

- `operator`: các máy khách mặt phẳng điều khiển như CLI, giao diện điều khiển, quy trình tự động hóa và
  các tiến trình trợ giúp đáng tin cậy.
- `node`: các máy chủ cung cấp khả năng (macOS, iOS, Android, không giao diện) công khai
  các lệnh thông qua `node.invoke`.

Các phương thức RPC của operator yêu cầu vai trò `operator`; các phương thức bắt nguồn từ node
yêu cầu vai trò `node`.

## Các cấp phạm vi

| Phạm vi                   | Ý nghĩa                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Trạng thái, danh sách, danh mục, nhật ký, thao tác đọc phiên và các lệnh gọi không thay đổi dữ liệu khác ở chế độ chỉ đọc.                                                                          |
| `operator.write`        | Các hành động thay đổi dữ liệu của operator: gửi tin nhắn, gọi công cụ, cập nhật cài đặt trò chuyện/giọng nói, chuyển tiếp lệnh node. Đồng thời đáp ứng `operator.read`.                |
| `operator.admin`        | Quyền truy cập quản trị. Đáp ứng mọi phạm vi `operator.*`. Bắt buộc để thay đổi cấu hình, cập nhật, sử dụng hook gốc, không gian tên dành riêng và phê duyệt có rủi ro cao. |
| `operator.pairing`      | Quản lý ghép nối thiết bị và node: liệt kê, phê duyệt, từ chối, xóa, xoay vòng, thu hồi.                                                                            |
| `operator.approvals`    | Các API phê duyệt thực thi và plugin.                                                                                                                                |
| `operator.talk.secrets` | Đọc cấu hình Talk có bao gồm thông tin bí mật.                                                                                                             |

Các phạm vi `operator.*` chưa xác định trong tương lai yêu cầu khớp chính xác, trừ khi bên gọi
đã có `operator.admin`.

## Phạm vi phương thức chỉ là cổng đầu tiên

Mỗi RPC của Gateway có một phạm vi phương thức theo nguyên tắc đặc quyền tối thiểu để quyết định
yêu cầu có đến được trình xử lý hay không. Sau đó, một số trình xử lý áp dụng các kiểm tra nghiêm ngặt hơn dựa trên
đối tượng cụ thể đang được phê duyệt hoặc thay đổi:

- `device.pair.approve` có thể được truy cập bằng `operator.pairing`, nhưng việc phê duyệt một
  thiết bị operator chỉ có thể cấp hoặc giữ nguyên các phạm vi mà bên gọi đã có.
- `node.pair.approve` có thể được truy cập bằng `operator.pairing`, sau đó suy ra các
  phạm vi phê duyệt bổ sung từ danh sách lệnh đã khai báo của node đang chờ xử lý.
- `chat.send` là một phương thức có phạm vi ghi, nhưng các lệnh trò chuyện `/config set` và
  `/config unset` yêu cầu thêm `operator.admin`,
  bất kể phạm vi gửi trò chuyện của bên gọi.

Điều này cho phép các operator có phạm vi thấp hơn thực hiện các hành động ghép nối ít rủi ro mà không
biến mọi phê duyệt ghép nối thành thao tác chỉ dành cho quản trị viên.

## Phê duyệt ghép nối thiết bị

Bản ghi ghép nối thiết bị là nguồn lâu dài lưu trữ các vai trò và phạm vi đã được phê duyệt.
Thiết bị đã ghép nối không âm thầm nhận quyền truy cập rộng hơn: một lần kết nối lại
yêu cầu vai trò hoặc phạm vi rộng hơn sẽ tạo ra yêu cầu nâng cấp mới đang chờ xử lý.

Khi phê duyệt yêu cầu thiết bị:

- Yêu cầu không có vai trò operator không cần phê duyệt phạm vi operator.
- Yêu cầu vai trò thiết bị không phải operator (ví dụ `node`) cần
  `operator.admin`, mặc dù bản thân `device.pair.approve` chỉ cần
  `operator.pairing`.
- Yêu cầu `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` hoặc `operator.talk.secrets` đòi hỏi bên gọi đã
  có phạm vi đó hoặc `operator.admin`.
- Yêu cầu `operator.admin` cần `operator.admin`.
- Yêu cầu sửa chữa không có phạm vi tường minh có thể kế thừa các phạm vi của token operator
  hiện có; nếu token đó có phạm vi quản trị, việc phê duyệt vẫn cần
  `operator.admin`.

Các phiên dùng thông tin bí mật dùng chung và proxy đáng tin cậy không phải quản trị viên chỉ có thể phê duyệt
yêu cầu thiết bị operator trong phạm vi operator đã khai báo của chính chúng; việc phê duyệt
vai trò không phải operator chỉ dành cho quản trị viên, ngay cả khi các phiên đó vẫn có thể sử dụng
`operator.pairing`.

Đối với các phiên dùng token của thiết bị đã ghép nối, quyền quản lý chỉ giới hạn ở bản thân trừ khi bên gọi
có `operator.admin`: bên gọi không phải quản trị viên chỉ thấy các mục ghép nối của chính mình và
chỉ có thể phê duyệt, từ chối, xoay vòng, thu hồi hoặc xóa mục thiết bị của chính mình.

## Phê duyệt ghép nối node

Các phương thức `node.pair.*` cũ sử dụng một kho ghép nối node riêng do Gateway sở hữu.
Thay vào đó, các node WS sử dụng ghép nối thiết bị (`role: node`), nhưng cùng một thuật ngữ
phê duyệt vẫn được áp dụng. Xem [Ghép nối Gateway](/vi/gateway/pairing) để biết mối quan hệ giữa hai
kho.

`node.pair.approve` suy ra các phạm vi bắt buộc bổ sung từ danh sách lệnh của
yêu cầu đang chờ xử lý:

| Các lệnh đã khai báo                                                                                                    | Các phạm vi bắt buộc                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| không có                                                                                                                 | `operator.pairing`                    |
| các lệnh node thông thường                                                                                               | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` hoặc `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Việc phê duyệt khai báo node không bật các lệnh có cổng danh sách cho phép
riêng khi chạy. Ví dụ, việc phê duyệt một node khai báo
`computer.act` yêu cầu phạm vi ghép nối và ghi, nhưng chỉ ghi nhận bề mặt đó.
Quản trị viên hoặc chủ sở hữu vẫn phải kích hoạt `computer.act`. Trong khi nó vẫn
được kích hoạt, việc gọi nó thông qua phương thức có phạm vi ghi `node.invoke` không
yêu cầu phạm vi quản trị cho từng hành động.

Ghép nối node thiết lập danh tính và độ tin cậy; nó không thay thế chính sách phê duyệt thực thi
`system.run` của chính node.

## Xác thực bằng thông tin bí mật dùng chung

Xác thực bằng token/mật khẩu Gateway dùng chung được coi là quyền truy cập operator đáng tin cậy đối với
Gateway đó. Các bề mặt HTTP tương thích với OpenAI, `/tools/invoke` và các điểm cuối HTTP
lịch sử phiên sẽ khôi phục toàn bộ tập phạm vi operator mặc định cho
xác thực bearer bằng thông tin bí mật dùng chung, ngay cả khi bên gọi gửi các phạm vi khai báo hẹp hơn.

Các chế độ mang danh tính, chẳng hạn như xác thực proxy đáng tin cậy hoặc `none` qua cổng vào riêng tư,
vẫn có thể tuân theo các phạm vi được khai báo tường minh. Hãy sử dụng các Gateway riêng biệt để thực sự
phân tách ranh giới tin cậy.
