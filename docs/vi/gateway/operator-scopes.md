---
read_when:
    - Gỡ lỗi thiếu phạm vi người vận hành
    - Xem xét phê duyệt ghép cặp thiết bị hoặc Node
    - Thêm hoặc phân loại các phương thức RPC của Gateway
summary: Vai trò người vận hành, phạm vi và các bước kiểm tra tại thời điểm phê duyệt dành cho máy khách Gateway
title: Phạm vi của người vận hành
x-i18n:
    generated_at: "2026-07-12T07:55:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Phạm vi của toán tử giới hạn những gì một máy khách Gateway có thể thực hiện sau khi xác thực.
Đây là rào chắn mặt phẳng điều khiển trong một miền toán tử Gateway đáng tin cậy,
không phải cơ chế cô lập đa đối tượng thuê có khả năng chống lại tác nhân thù địch. Để phân tách chặt chẽ giữa người dùng,
nhóm hoặc máy, hãy chạy các Gateway riêng biệt dưới các người dùng hệ điều hành hoặc máy chủ riêng biệt.

Liên quan: [Bảo mật](/vi/gateway/security), [Giao thức Gateway](/vi/gateway/protocol),
[Ghép đôi Gateway](/vi/gateway/pairing), [CLI thiết bị](/vi/cli/devices).

## Vai trò

Mỗi máy khách WebSocket của Gateway kết nối với một vai trò:

- `operator`: các máy khách mặt phẳng điều khiển như CLI, giao diện điều khiển, tác vụ tự động hóa và
  các tiến trình hỗ trợ đáng tin cậy.
- `node`: các máy chủ cung cấp khả năng (macOS, iOS, Android, không giao diện) công khai
  các lệnh thông qua `node.invoke`.

Các phương thức RPC của toán tử yêu cầu vai trò `operator`; các phương thức bắt nguồn từ Node
yêu cầu vai trò `node`.

## Cấp độ phạm vi

| Phạm vi                 | Ý nghĩa                                                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Trạng thái, danh sách, danh mục, nhật ký, thao tác đọc phiên và các lệnh gọi không thay đổi dữ liệu khác ở chế độ chỉ đọc.                                                          |
| `operator.write`        | Các thao tác thay đổi dữ liệu của toán tử: gửi tin nhắn, gọi công cụ, cập nhật cài đặt trò chuyện/giọng nói, chuyển tiếp lệnh Node. Đồng thời đáp ứng `operator.read`.               |
| `operator.admin`        | Quyền truy cập quản trị. Đáp ứng mọi phạm vi `operator.*`. Bắt buộc để thay đổi cấu hình, cập nhật, dùng hook gốc, không gian tên dành riêng và phê duyệt có rủi ro cao.             |
| `operator.pairing`      | Quản lý ghép đôi thiết bị và Node: liệt kê, phê duyệt, từ chối, xóa, luân chuyển, thu hồi.                                                                                          |
| `operator.approvals`    | Các API phê duyệt thực thi và Plugin.                                                                                                                                              |
| `operator.talk.secrets` | Đọc cấu hình Talk, bao gồm cả thông tin bí mật.                                                                                                                                    |

Các phạm vi `operator.*` chưa xác định trong tương lai yêu cầu khớp chính xác, trừ khi bên gọi
đã có `operator.admin`.

## Phạm vi phương thức chỉ là cổng kiểm tra đầu tiên

Mỗi RPC của Gateway có một phạm vi phương thức theo nguyên tắc đặc quyền tối thiểu để quyết định liệu
yêu cầu có được chuyển đến trình xử lý hay không. Sau đó, một số trình xử lý áp dụng các bước kiểm tra nghiêm ngặt hơn dựa trên
đối tượng cụ thể đang được phê duyệt hoặc thay đổi:

- Có thể truy cập `device.pair.approve` bằng `operator.pairing`, nhưng khi phê duyệt một
  thiết bị của toán tử, chỉ có thể cấp mới hoặc giữ nguyên các phạm vi mà bên gọi đã có.
- Có thể truy cập `node.pair.approve` bằng `operator.pairing`, sau đó phương thức này suy ra các
  phạm vi phê duyệt bổ sung từ danh sách lệnh đã khai báo của Node đang chờ xử lý.
- `chat.send` là phương thức có phạm vi ghi, nhưng các lệnh trò chuyện `/config set` và
  `/config unset` còn yêu cầu thêm `operator.admin`,
  bất kể phạm vi gửi trò chuyện của bên gọi.

Điều này cho phép các toán tử có phạm vi thấp hơn thực hiện thao tác ghép đôi ít rủi ro mà không
khiến mọi phê duyệt ghép đôi đều chỉ dành cho quản trị viên.

## Phê duyệt ghép đôi thiết bị

Bản ghi ghép đôi thiết bị là nguồn lưu trữ lâu dài của các vai trò và phạm vi đã được phê duyệt.
Một thiết bị đã ghép đôi không âm thầm nhận quyền truy cập rộng hơn: một lần kết nối lại
yêu cầu vai trò hoặc phạm vi rộng hơn sẽ tạo yêu cầu nâng cấp mới đang chờ xử lý.

Khi phê duyệt một yêu cầu thiết bị:

- Yêu cầu không có vai trò toán tử không cần phê duyệt phạm vi toán tử.
- Yêu cầu vai trò thiết bị không phải toán tử (ví dụ `node`) cần
  `operator.admin`, mặc dù bản thân `device.pair.approve` chỉ cần
  `operator.pairing`.
- Yêu cầu `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` hoặc `operator.talk.secrets` yêu cầu bên gọi phải
  đã có phạm vi đó hoặc có `operator.admin`.
- Yêu cầu `operator.admin` cần `operator.admin`.
- Yêu cầu sửa chữa không có phạm vi tường minh có thể kế thừa các phạm vi của token toán tử
  hiện có; nếu token đó có phạm vi quản trị, việc phê duyệt vẫn cần
  `operator.admin`.

Các phiên dùng thông tin bí mật dùng chung không có quyền quản trị và các phiên proxy đáng tin cậy chỉ có thể phê duyệt
yêu cầu thiết bị toán tử trong phạm vi toán tử đã khai báo của chính chúng; việc phê duyệt
vai trò không phải toán tử chỉ dành cho quản trị viên, ngay cả khi các phiên đó vẫn có thể sử dụng
`operator.pairing` cho mục đích khác.

Đối với các phiên dùng token của thiết bị đã ghép đôi, việc quản lý bị giới hạn trong phạm vi của chính thiết bị đó, trừ khi bên gọi
có `operator.admin`: bên gọi không phải quản trị viên chỉ thấy các mục ghép đôi của chính mình và
chỉ có thể phê duyệt, từ chối, luân chuyển, thu hồi hoặc xóa mục thiết bị của chính mình.

## Phê duyệt ghép đôi Node

Các phương thức `node.pair.*` cũ sử dụng một kho ghép đôi Node riêng do Gateway sở hữu.
Các Node WS sử dụng ghép đôi thiết bị (`role: node`) thay thế, nhưng vẫn áp dụng cùng
hệ thuật ngữ phê duyệt. Xem [Ghép đôi Gateway](/vi/gateway/pairing) để biết mối liên hệ giữa hai
kho này.

`node.pair.approve` suy ra các phạm vi bắt buộc bổ sung từ danh sách lệnh của
yêu cầu đang chờ xử lý:

| Lệnh đã khai báo                                      | Phạm vi bắt buộc                       |
| ----------------------------------------------------- | -------------------------------------- |
| không có                                              | `operator.pairing`                     |
| các lệnh Node không thực thi                          | `operator.pairing` + `operator.write`  |
| `system.run`, `system.run.prepare` hoặc `system.which` | `operator.pairing` + `operator.admin`  |

Việc phê duyệt khai báo của Node không bật các lệnh có cổng danh sách cho phép
thời gian chạy riêng. Ví dụ, phê duyệt một Node khai báo
`computer.act` yêu cầu phạm vi ghép đôi cộng với phạm vi ghi, nhưng chỉ ghi nhận bề mặt khả năng đó.
Quản trị viên hoặc chủ sở hữu vẫn phải kích hoạt `computer.act`. Trong thời gian tính năng này vẫn
được kích hoạt, việc gọi nó thông qua phương thức `node.invoke` có phạm vi ghi không
yêu cầu phạm vi quản trị cho từng thao tác.

Ghép đôi Node thiết lập danh tính và độ tin cậy; nó không thay thế chính sách phê duyệt thực thi
`system.run` riêng của Node.

## Xác thực bằng thông tin bí mật dùng chung

Xác thực bằng token/mật khẩu Gateway dùng chung được coi là quyền truy cập toán tử đáng tin cậy đối với
Gateway đó. Các bề mặt HTTP tương thích với OpenAI, `/tools/invoke` và các điểm cuối HTTP
lịch sử phiên khôi phục đầy đủ tập phạm vi toán tử mặc định cho xác thực bearer bằng thông tin bí mật dùng chung,
ngay cả khi bên gọi gửi các phạm vi khai báo hẹp hơn.

Các chế độ có gắn danh tính, chẳng hạn như xác thực proxy đáng tin cậy hoặc `none` qua cổng vào riêng tư,
vẫn có thể tuân theo các phạm vi được khai báo tường minh. Hãy sử dụng các Gateway riêng biệt để thực sự
phân tách ranh giới tin cậy.
