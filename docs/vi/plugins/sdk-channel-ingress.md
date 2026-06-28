---
read_when:
    - Xây dựng hoặc di chuyển Plugin kênh nhắn tin
    - Thay đổi danh sách cho phép DM hoặc nhóm, cổng kiểm soát định tuyến, xác thực lệnh, xác thực sự kiện hoặc kích hoạt khi được nhắc đến
    - Đánh giá việc che dữ liệu nhạy cảm ở đầu vào kênh hoặc các ranh giới tương thích SDK
sidebarTitle: Channel Ingress
summary: API tiếp nhận kênh thử nghiệm để ủy quyền tin nhắn đến
title: API tiếp nhận của kênh
x-i18n:
    generated_at: "2026-05-10T19:44:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# API nhận vào của kênh

Nhận vào của kênh là ranh giới kiểm soát truy cập thử nghiệm cho các sự kiện
kênh gửi đến. Dùng `openclaw/plugin-sdk/channel-ingress-runtime` cho các đường
dẫn nhận. Subpath cũ hơn `openclaw/plugin-sdk/channel-ingress` vẫn được xuất như
một facade tương thích đã lỗi thời cho Plugin bên thứ ba.

Plugin sở hữu dữ kiện nền tảng và hiệu ứng phụ. Core sở hữu chính sách chung:
danh sách cho phép DM/nhóm, mục DM trong kho ghép cặp, cổng tuyến, cổng lệnh,
xác thực sự kiện, kích hoạt bằng nhắc đến, chẩn đoán đã biên tập, và tiếp nhận.

## Bộ phân giải runtime

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

Không tính trước danh sách cho phép hiệu lực, chủ sở hữu lệnh, hoặc nhóm lệnh.
Bộ phân giải suy ra chúng từ danh sách cho phép thô, callback kho, bộ mô tả
tuyến, nhóm truy cập, chính sách, và loại cuộc trò chuyện.

## Kết quả

Các Plugin đi kèm nên dùng trực tiếp các phép chiếu hiện đại:

- `ingress`: quyết định cổng và tiếp nhận theo thứ tự
- `senderAccess`: chỉ ủy quyền người gửi/cuộc trò chuyện
- `routeAccess`: phép chiếu tuyến và người gửi theo tuyến
- `commandAccess`: ủy quyền lệnh; false khi không có cổng lệnh nào chạy
- `activationAccess`: kết quả nhắc đến/kích hoạt

Ủy quyền sự kiện vẫn có sẵn trên `ingress.graph` theo thứ tự và
`ingress.reasonCode` mang tính quyết định; không phát ra phép chiếu sự kiện
riêng.

Các helper SDK bên thứ ba đã lỗi thời có thể dựng lại các dạng cũ hơn nội bộ.
Các đường dẫn nhận đi kèm mới không nên dịch kết quả hiện đại ngược lại thành
DTO cục bộ.

## Nhóm truy cập

Các mục `accessGroup:<name>` vẫn được biên tập. Core tự phân giải các nhóm tĩnh
`message.senders` và chỉ gọi `resolveAccessGroupMembership` cho các nhóm động
cần tra cứu nền tảng. Nhóm bị thiếu, không được hỗ trợ, và thất bại đều đóng khi
lỗi.

## Chế độ sự kiện

| `authMode`       | Ý nghĩa                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | cổng người gửi gửi đến bình thường              |
| `command`        | cổng lệnh cho callback hoặc nút có phạm vi      |
| `origin-subject` | tác nhân phải khớp với chủ thể tin nhắn gốc     |
| `route-only`     | chỉ cổng tuyến cho sự kiện tin cậy theo tuyến   |
| `none`           | sự kiện nội bộ do Plugin sở hữu bỏ qua xác thực dùng chung |

Dùng `mayPair: false` cho phản ứng, nút, callback, và lệnh gốc.

## Tuyến và kích hoạt

Dùng bộ mô tả tuyến cho chính sách phòng, chủ đề, guild, luồng, hoặc tuyến lồng
nhau:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Dùng `channelIngressRoutes(...)` khi một Plugin có vài bộ mô tả tuyến tùy chọn;
nó lọc các nhánh đã tắt trong khi vẫn giữ dữ kiện tuyến ở dạng chung và được
sắp theo `precedence` của từng bộ mô tả.

Cổng nhắc đến là cổng kích hoạt. Một lần nhắc đến bị trượt trả về
`admission: "skip"` để kernel lượt không xử lý lượt chỉ quan sát. Hầu hết kênh
nên để kích hoạt sau cổng người gửi và cổng lệnh. Các bề mặt chat công khai cần
làm im lưu lượng không được nhắc đến trước nhiễu danh sách cho phép người gửi có
thể chọn `activation.order: "before-sender"` khi bỏ qua lệnh văn bản bị tắt. Các
kênh có kích hoạt ngầm định, chẳng hạn như trả lời trong luồng bot, có thể truyền
`activation.allowedImplicitMentionKinds`; `activationAccess.shouldBypassMention`
được chiếu sau đó báo cáo khi lệnh hoặc kích hoạt ngầm định đã bỏ qua một lần
nhắc đến rõ ràng.

## Biên tập

Giá trị người gửi thô và mục danh sách cho phép thô chỉ là đầu vào của bộ phân
giải. Chúng không được xuất hiện trong trạng thái đã phân giải, quyết định, chẩn
đoán, snapshot, hoặc dữ kiện tương thích. Dùng id chủ thể mờ, id mục, id tuyến,
và id chẩn đoán.

## Xác minh

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
