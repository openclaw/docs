---
read_when:
    - Gỡ lỗi thiếu phạm vi operator
    - Xem xét phê duyệt ghép đôi thiết bị hoặc Node
    - Thêm hoặc phân loại các phương thức RPC của Gateway
summary: Vai trò của người vận hành, phạm vi và các bước kiểm tra tại thời điểm phê duyệt dành cho máy khách Gateway
title: Phạm vi của người vận hành
x-i18n:
    generated_at: "2026-07-19T05:44:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40053793bb5a80afab28fdfcdcac6565abde6bca988389b03a407272c70043e2
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Phạm vi operator giới hạn những gì một client Gateway có thể làm sau khi xác thực.
Chúng là rào chắn của mặt phẳng điều khiển trong một miền operator Gateway đáng tin cậy,
không phải cơ chế cô lập đa đối tượng thuê có khả năng chống lại tác nhân thù địch. Để phân tách chặt chẽ giữa người dùng,
nhóm hoặc máy móc, hãy chạy các Gateway riêng biệt dưới các người dùng hệ điều hành hoặc máy chủ riêng biệt.

Liên quan: [Bảo mật](/vi/gateway/security), [Giao thức Gateway](/vi/gateway/protocol),
[Ghép nối Gateway](/vi/gateway/pairing), [CLI thiết bị](/vi/cli/devices).

## Vai trò

Mỗi client WebSocket của Gateway kết nối với một vai trò:

- `operator`: các client mặt phẳng điều khiển như CLI, giao diện điều khiển, tự động hóa và
  các tiến trình trợ giúp đáng tin cậy.
- `node`: các máy chủ khả năng (macOS, iOS, Android, không giao diện) cung cấp
  lệnh thông qua `node.invoke`.

Các phương thức RPC của operator yêu cầu vai trò `operator`; các phương thức bắt nguồn từ node
yêu cầu vai trò `node`.

## Cấp độ phạm vi

| Phạm vi                | Ý nghĩa                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Trạng thái chỉ đọc, danh sách, danh mục, nhật ký, đọc phiên và các lệnh gọi không thay đổi dữ liệu khác.                                                       |
| `operator.write`        | Các hành động operator có thay đổi dữ liệu: gửi tin nhắn, gọi công cụ, cập nhật cài đặt trò chuyện/giọng nói, chuyển tiếp lệnh node. Đồng thời đáp ứng `operator.read`. |
| `operator.admin`        | Quyền truy cập quản trị. Đáp ứng mọi phạm vi `operator.*`. Bắt buộc để thay đổi cấu hình, cập nhật, hook gốc, không gian tên dành riêng và phê duyệt có rủi ro cao. |
| `operator.pairing`      | Quản lý ghép nối thiết bị và node: liệt kê, phê duyệt, từ chối, xóa, luân chuyển, thu hồi.                                                                     |
| `operator.approvals`    | Các API phê duyệt thực thi và plugin.                                                                                                                         |
| `operator.questions`    | Liệt kê, đọc, trả lời và giải quyết các câu hỏi tương tác.                                                                                                    |
| `operator.talk.secrets` | Đọc cấu hình Talk, bao gồm cả các bí mật.                                                                                                                      |

Các phạm vi `operator.*` chưa xác định trong tương lai yêu cầu khớp chính xác, trừ khi bên gọi
đã có `operator.admin`.

## Phạm vi phương thức chỉ là cổng kiểm tra đầu tiên

Mỗi RPC của Gateway có một phạm vi phương thức theo nguyên tắc đặc quyền tối thiểu để quyết định liệu
yêu cầu có được chuyển đến trình xử lý hay không. Các phương thức có xét tham số sẽ xác định phạm vi đó trước khi
điều phối để mọi lỗi ủy quyền có một phản hồi có cấu trúc chuẩn duy nhất:

- `agent` cần `operator.write` cho các lượt thông thường và `operator.admin` cho
  các lệnh vòng đời phiên `/new` hoặc `/reset`.
- `node.invoke` cần `operator.write` cho các lệnh chuyển tiếp thông thường và
  `operator.admin` cho `browser.proxy`, `fs.listDir` và `terminal.upload`.
- `talk.config` cần `operator.read`; `includeSecrets: true` cũng cần
  `operator.talk.secrets`.

Sau đó, một số trình xử lý áp dụng các bước kiểm tra nghiêm ngặt hơn dựa trên đối tượng cụ thể
đang được phê duyệt hoặc thay đổi:

- `device.pair.approve` có thể được truy cập bằng `operator.pairing`, nhưng việc phê duyệt một
  thiết bị operator chỉ có thể cấp hoặc giữ lại các phạm vi mà bên gọi đã có.
- `node.pair.approve` có thể được truy cập bằng `operator.pairing`, sau đó xác định các
  phạm vi phê duyệt bổ sung từ danh sách lệnh đã khai báo của node đang chờ xử lý.
- `chat.send` là một phương thức có phạm vi ghi, nhưng các lệnh trò chuyện
  `/config set` và `/config unset` còn yêu cầu thêm `operator.admin`,
  bất kể phạm vi gửi trò chuyện của bên gọi.

Điều này cho phép các operator có phạm vi thấp hơn thực hiện những hành động ghép nối ít rủi ro
mà không buộc mọi phê duyệt ghép nối chỉ dành cho quản trị viên.

Các RPC thay đổi phiên được ủy quyền theo phạm vi operator đã thương lượng,
độc lập với `client.id` hoặc `client.mode` của client đang kết nối. Danh tính client
vẫn có thể ảnh hưởng đến chính sách kết nối và xác thực thiết bị, nhưng không
cấp hoặc loại bỏ quyền thay đổi phiên.

## Phê duyệt ghép nối thiết bị

Các bản ghi ghép nối thiết bị là nguồn bền vững lưu trữ các vai trò và phạm vi đã được phê duyệt.
Một thiết bị đã ghép nối không được âm thầm cấp quyền truy cập rộng hơn: một lần kết nối lại
yêu cầu vai trò hoặc phạm vi rộng hơn sẽ tạo một yêu cầu nâng cấp mới đang chờ xử lý.

Khi phê duyệt một yêu cầu thiết bị:

- Yêu cầu không có vai trò operator thì không cần phê duyệt phạm vi operator.
- Yêu cầu vai trò thiết bị không phải operator (ví dụ `node`) yêu cầu
  `operator.admin`, mặc dù bản thân `device.pair.approve` chỉ cần
  `operator.pairing`.
- Yêu cầu `operator.read`, `operator.write`, `operator.approvals`,
  `operator.questions`, `operator.pairing` hoặc `operator.talk.secrets` yêu cầu
  bên gọi đã có phạm vi đó hoặc có `operator.admin`.
- Yêu cầu `operator.admin` cần `operator.admin`.
- Yêu cầu sửa chữa không có phạm vi tường minh có thể kế thừa các phạm vi của token
  operator hiện có; nếu token đó có phạm vi quản trị, việc phê duyệt vẫn yêu cầu
  `operator.admin`.

Các phiên dùng bí mật dùng chung và proxy đáng tin cậy nhưng không có quyền quản trị chỉ có thể phê duyệt
yêu cầu thiết bị operator trong phạm vi operator mà chúng đã khai báo; việc phê duyệt
vai trò không phải operator chỉ dành cho quản trị viên, ngay cả khi các phiên đó có thể sử dụng
`operator.pairing` cho mục đích khác.

Đối với các phiên token của thiết bị đã ghép nối, quyền quản lý chỉ giới hạn ở chính thiết bị đó, trừ khi bên gọi
có `operator.admin`: bên gọi không phải quản trị viên chỉ thấy các mục ghép nối của chính mình và
chỉ có thể phê duyệt, từ chối, luân chuyển, thu hồi hoặc xóa mục thiết bị của chính mình.

## Phê duyệt ghép nối node

Các phương thức `node.pair.*` cũ sử dụng một kho ghép nối node riêng do Gateway sở hữu.
Các node WS sử dụng ghép nối thiết bị (`role: node`) thay thế, nhưng cùng một hệ thuật ngữ
phê duyệt vẫn được áp dụng. Xem [Ghép nối Gateway](/vi/gateway/pairing) để biết mối quan hệ giữa hai
kho này.

`node.pair.approve` xác định các phạm vi bắt buộc bổ sung từ danh sách lệnh của
yêu cầu đang chờ xử lý:

| Các lệnh đã khai báo                                                                                                  | Phạm vi bắt buộc                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| không có                                                                                                             | `operator.pairing`                    |
| các lệnh node thông thường                                                                                           | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` hoặc `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Việc phê duyệt khai báo của node không bật các lệnh có cổng danh sách cho phép
thời gian chạy riêng. Ví dụ, việc phê duyệt một node khai báo
`computer.act` yêu cầu phạm vi ghép nối và ghi, nhưng chỉ ghi nhận bề mặt đó.
Quản trị viên hoặc chủ sở hữu vẫn phải kích hoạt `computer.act`. Trong khi tính năng này vẫn
được kích hoạt, việc gọi nó thông qua `node.invoke` yêu cầu phạm vi ghi, nhưng không cần phạm vi
quản trị cho từng hành động.

Ghép nối node thiết lập danh tính và độ tin cậy; nó không thay thế chính sách phê duyệt
thực thi `system.run` của chính node đó.

## Xác thực bằng bí mật dùng chung

Xác thực bằng token/mật khẩu Gateway dùng chung được xem là quyền truy cập operator đáng tin cậy cho
Gateway đó. Các bề mặt HTTP tương thích với OpenAI, `/tools/invoke` và các endpoint HTTP
lịch sử phiên sẽ khôi phục tập phạm vi operator mặc định đầy đủ cho
xác thực bearer bằng bí mật dùng chung, ngay cả khi bên gọi gửi phạm vi khai báo hẹp hơn.

Các chế độ mang danh tính, chẳng hạn như xác thực proxy đáng tin cậy hoặc `none` qua cổng vào riêng tư,
vẫn có thể tuân theo các phạm vi được khai báo tường minh. Hãy sử dụng các Gateway riêng biệt để
phân tách ranh giới tin cậy thực sự.
