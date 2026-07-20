---
read_when:
    - Xây dựng trình vận hành, bảng điều khiển hoặc ứng dụng khách WebChat bên ngoài kho lưu trữ OpenClaw
    - Triển khai kết nối lại Gateway, lịch sử, phê duyệt hoặc ghép nối thiết bị
    - Cập nhật ứng dụng khách bên thứ ba cho phiên bản giao thức truyền dẫn Gateway mới
summary: Xây dựng trình vận hành bên thứ ba hoặc ứng dụng WebChat cho giao thức WebSocket của Gateway
title: Xây dựng ứng dụng khách Gateway
x-i18n:
    generated_at: "2026-07-20T14:37:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fa24b196ff1fa28fb3b64d49ac25597f22cf1945aea56029e78e4375f1bdddb7
    source_path: gateway/clients.md
    workflow: 16
---

Sử dụng các gói Gateway đã phát hành để xây dựng bảng điều khiển dành cho người vận hành, ứng dụng WebChat
và các ứng dụng bên thứ ba khác. Hướng dẫn này trình bày vòng đời của máy khách xoay quanh
hợp đồng truyền dẫn: xác thực, khả năng, khôi phục sau khi kết nối lại, lịch sử,
đăng ký theo dõi và nâng cấp phiên bản.

Để biết cấu trúc khung, quy trình bắt tay, lỗi và toàn bộ bề mặt phương thức, hãy đọc
[đặc tả giao thức Gateway](https://docs.openclaw.ai/gateway/protocol).

## Cài đặt các gói

```bash
npm install @openclaw/gateway-client @openclaw/gateway-protocol
```

<Note>
Các gói này được phát hành cùng các đợt phát hành OpenClaw. Trong lần triển khai ban đầu, npm
có thể trả về `E404` cho đến khi bản phát hành OpenClaw đầu tiên chứa các gói này được phát hành;
chỉ cài đặt sau khi các trang registry bên dưới truy cập được.
</Note>

- [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol)
  cung cấp schema, trình xác thực khi chạy, kiểu TypeScript, registry danh tính và
  khả năng của máy khách, trình đọc lỗi có cấu trúc và hằng số phiên bản giao thức.
  Tarball npm của gói cũng bao gồm hợp đồng
  [`protocol.schema.json`](https://unpkg.com/@openclaw/gateway-protocol/protocol.schema.json)
  có thể đọc bằng máy được tạo tự động.
- [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client)
  là triển khai kết nối tham chiếu. Nhập từ gốc gói cho máy khách Node
  và `@openclaw/gateway-client/browser` cho các trình trợ giúp giao thức,
  xác thực thiết bị và kết nối lại an toàn cho trình duyệt.

Điểm vào Node sở hữu lớp truyền tải WebSocket. Máy chủ trình duyệt cung cấp bộ điều hợp WebSocket
cùng bộ nhớ bền vững và các callback ký cho danh tính thiết bị và
token thiết bị.

## Chọn phạm vi và ghép nối thiết bị

Một máy khách trò chuyện tương tác đầy đủ có hiển thị cả lời nhắc phê duyệt nên yêu cầu
`role: "operator"` với các phạm vi sau:

| Phạm vi              | Dùng cho                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `operator.read`      | `chat.history`, `sessions.list`, `sessions.subscribe`, trạng thái mô hình và các sự kiện chỉ đọc |
| `operator.write`     | `chat.send` và các thay đổi phiên thông thường                                            |
| `operator.approvals` | Liệt kê, hiển thị và xử lý phê duyệt exec hoặc plugin                                     |

Chỉ thêm `operator.questions` nếu máy khách xử lý câu hỏi tương tác,
chỉ thêm `operator.pairing` nếu máy khách quản lý thiết bị hoặc node đã ghép nối và
chỉ thêm `operator.admin` cho các thao tác quản trị như `config.patch`.
[Tài liệu tham khảo về phạm vi người vận hành](https://docs.openclaw.ai/gateway/operator-scopes)
định nghĩa đầy đủ các quy tắc về phương thức và thời điểm phê duyệt.

Không tạo thủ công token mang cho từng máy khách bằng cách chỉnh sửa `openclaw.json`. Cấu hình
xác thực bootstrap dùng chung của Gateway bằng `openclaw configure --section
gateway` hoặc các tùy chọn `openclaw onboard --gateway-auth ...`, sau đó để quy trình
ghép nối thiết bị tạo token máy khách:

1. Lưu bền vững danh tính thiết bị Ed25519 trong máy khách.
2. Chờ `connect.challenge`, ký payload thiết bị được ràng buộc với thử thách rồi gửi
   `connect` cùng vai trò người vận hành, các phạm vi được yêu cầu và token Gateway dùng chung
   hoặc mật khẩu để xác thực bootstrap.
3. Nếu Gateway trả về chi tiết `PAIRING_REQUIRED` có cấu trúc, hãy hiển thị ID yêu cầu
   và tạm dừng hoặc thử lại theo `error.details.recommendedNextStep`.
4. Trên máy chủ Gateway, xem xét yêu cầu bằng `openclaw devices list`, sau đó
   phê duyệt chính xác yêu cầu hiện tại đó bằng `openclaw devices approve <requestId>`.
5. Kết nối lại và lưu bền vững `hello-ok.auth.deviceToken` cùng vai trò và
   phạm vi đã thương lượng. Sử dụng token thiết bị đó cho các kết nối sau.

Việc nâng cấp phạm vi hoặc vai trò tạo một yêu cầu ghép nối mới đang chờ xử lý. Xoay vòng token không thể
mở rộng hợp đồng ghép nối đã được phê duyệt. Xem
[CLI thiết bị](https://docs.openclaw.ai/cli/devices) để biết các lệnh phê duyệt, xoay vòng và
thu hồi.

## Công bố khả năng của máy khách

`connect.params.caps` mô tả hành vi tùy chọn mà máy khách có thể sử dụng. Nó
không cấp quyền. Nhập tên từ `GATEWAY_CLIENT_CAPS` thay vì
lặp lại các chuỗi ký tự:

```ts
import { GATEWAY_CLIENT_CAPS } from "@openclaw/gateway-protocol/client-info";

const caps = [GATEWAY_CLIENT_CAPS.TOOL_EVENTS];
```

Registry hiện tại chứa `approvals`, `exec-approvals`, `inline-widgets`,
`run-tool-bindings`, `session-scoped-events`, `plugin-approvals`,
`task-suggestions`, `terminal-offset-seq`, `tool-events` và `ui-commands`.
Chỉ công bố những khả năng mà máy khách thực sự triển khai.

<Warning>
`tool-events` kiểm soát luồng trực tiếp của quá trình thực thi công cụ. Gateway chỉ đăng ký
các kết nối công bố khả năng này làm bên nhận sự kiện công cụ có cấu trúc của một lượt chạy.
Nếu không có khả năng này, kết nối sẽ không nhận được sự kiện công cụ trực tiếp và
quy trình bắt tay không báo lỗi.
</Warning>

Các công cụ tác nhân bị kiểm soát theo khả năng là một cách sử dụng riêng biệt của cùng khai báo này. Nếu một
công cụ tác nhân yêu cầu khả năng của máy khách, Gateway sẽ bỏ qua công cụ đó trừ khi
máy khách khởi tạo đã công bố mọi khả năng bắt buộc.

## Khôi phục trạng thái sau khi kết nối lại

Xem mỗi lần kết nối lại thành công là một phép chiếu mới dựa trên lịch sử bền vững và
trạng thái lượt chạy hiện tại trong bộ nhớ:

1. Thiết lập lại `sessions.subscribe` và đăng ký theo dõi
   `sessions.messages.subscribe` của phiên đã chọn.
2. Gọi `chat.history` cho `sessionKey` đã chọn và thay thế các hàng được lưu bền vững cục bộ
   bằng phép chiếu `messages` được trả về.
3. Nếu có `inFlightRun`, hãy tiếp nhận `runId`, `text` đã được đệm và
   `plan` tùy chọn của nó. Tiếp nhận lượt chạy ngay cả khi `text` trống.
4. Đọc `sessionInfo.hasActiveRun` và `sessionInfo.activeRunIds`. Ưu tiên tư cách thành viên
   chính xác trong `activeRunIds` khi quyết định liệu một lượt chạy được giữ lại có còn sở hữu
   giao diện người dùng phát luồng hay không. `hasActiveRun` là true nhưng không có ID nào được liệt kê có thể đại diện cho một
   phép chiếu runtime đang hoạt động khác.
5. Đối soát các sự kiện `agent` tiếp theo theo `payload.runId` và `payload.seq`.
   Duy trì độc lập số thứ tự cao nhất đã chấp nhận cho từng lượt chạy, bỏ qua
   số thứ tự đã thấy hoặc thấp hơn và xem khoảng trống tiến về phía trước là lý do để tải lại
   lịch sử có thẩm quyền.

Khung sự kiện bên ngoài cũng có `seq` tùy chọn, dùng để sắp thứ tự các sự kiện trên
kết nối WebSocket hiện tại. Giá trị này được đặt lại khi có kết nối mới. `seq` bên trong
payload sự kiện `agent` được gán theo từng lượt chạy và sắp thứ tự các sự kiện về vòng đời,
trợ lý, kế hoạch, công cụ và các luồng khác của lượt chạy đó.

## Sử dụng siêu dữ liệu lịch sử và neo ổn định

Các hàng do `chat.history` trả về có thể mang một phong bì siêu dữ liệu `__openclaw`:

- `id` là danh tính của mục bản ghi hội thoại. Sử dụng nó cho các yêu cầu lịch sử có neo,
  nhưng không dùng làm khóa hàng hiển thị duy nhất.
- `seq` là số thứ tự dương của bản ghi hội thoại. Một bản ghi được lưu trữ có thể được chiếu
  thành nhiều hàng hiển thị, vì vậy hãy giữ các hàng cùng nhóm có cùng `id` và số thứ tự
  cạnh nhau.
- `kind` xác định các hàng tổng hợp. Một ranh giới Compaction sử dụng
  `kind: "compaction"` và có thể bao gồm `tokensBefore` cùng `tokensAfter` khi một
  checkpoint khớp đã ghi lại các chỉ số đó.

Phân trang lùi bằng các giá trị `hasMore` và `nextOffset` của phản hồi. Các độ lệch
dạng số mô tả phép chiếu bản ghi hội thoại hiện tại, vì vậy không lưu bền vững chúng dưới dạng
dấu trang dài hạn qua các lần đặt lại hoặc Compaction. Thay vào đó, hãy lưu bền vững `__openclaw.id`.
Để khôi phục quanh một hàng đã biết, hãy gọi `chat.history` với `messageId` và
`sessionId` đã trả về hàng đó. Gateway có thể phân giải neo đó từ lịch sử lưu trữ
sau khi đặt lại; các phản hồi có neo chủ ý bỏ qua siêu dữ liệu phân trang dạng số.

## Đăng ký theo dõi thay vì thăm dò mức sử dụng

Tải danh mục ban đầu bằng `sessions.list`, sau đó gọi `sessions.subscribe` một lần
cho mỗi kết nối. Hợp nhất các sự kiện `sessions.changed` theo `sessionKey`. Payload thay đổi phiên
có thể mang `inputTokens`, `outputTokens`, `totalTokens`,
`totalTokensFresh`, `contextTokens`, `estimatedCostUsd` trực tiếp, các thiết lập mức sử dụng phản hồi
và trạng thái lượt chạy đang hoạt động.

Một số thông báo thay đổi chỉ là tín hiệu vô hiệu hóa. Nếu một sự kiện bỏ qua các
trường hàng mà chế độ xem cần, hãy làm mới `sessions.list`. Không thăm dò `usage.cost` hoặc
`sessions.usage` để duy trì danh sách phiên trực tiếp luôn cập nhật; chỉ dùng các phương thức đó cho
báo cáo tổng hợp hoặc chi tiết theo yêu cầu.

## Điền bù phê duyệt exec

Máy khách có `operator.approvals` nên cài đặt trình lắng nghe sự kiện ngay khi
`hello-ok` hoàn tất, sau đó gọi `exec.approval.list` để điền bù các yêu cầu có trước
kết nối. Đối soát danh sách và các sự kiện trực tiếp
`exec.approval.requested` / `exec.approval.resolved` theo ID phê duyệt để một
chuyển đổi xảy ra đồng thời với yêu cầu danh sách không bị mất hoặc khôi phục nhầm.

## Theo dõi phiên bản giao thức

Phiên bản truyền dẫn hiện tại là `4`. Các máy khách WebChat và máy khách người vận hành thông thường phải
thương lượng chính xác phiên bản hiện tại bằng `minProtocol: 4` và `maxProtocol: 4`.
Chỉ các máy khách node đã xác thực và trình thăm dò nhẹ mới có khoảng chấp nhận N-1,
hiện từ giao thức `3` đến `4`.

Các thay đổi giao thức ưu tiên tính bổ sung. `protocol.schema.json` bao gồm siêu dữ liệu
`since` về đời bản phát hành và siêu dữ liệu phạm vi bắt buộc cho các phương thức cốt lõi, nhưng việc tăng
phiên bản truyền dẫn vẫn là một sự kiện phá vỡ tương thích rõ ràng đối với máy khách bên thứ ba. Ghim các
phiên bản gói đã kiểm thử, nâng cấp máy khách và Gateway cùng lúc khi phiên bản truyền dẫn
thay đổi và xem lại
[nhật ký thay đổi OpenClaw](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)
trước mỗi lần nâng cấp.

## Liên quan

- [Giao thức Gateway](https://docs.openclaw.ai/gateway/protocol)
- [Nhúng OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [Tài liệu tham khảo RPC của Gateway](https://docs.openclaw.ai/reference/rpc)
- [Tích hợp Gateway cho ứng dụng bên ngoài](https://docs.openclaw.ai/gateway/external-apps)
