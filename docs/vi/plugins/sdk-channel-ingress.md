---
read_when:
    - Xây dựng hoặc di chuyển Plugin kênh nhắn tin
    - Thay đổi danh sách cho phép đối với tin nhắn trực tiếp hoặc nhóm, cổng định tuyến, xác thực lệnh, xác thực sự kiện hoặc kích hoạt bằng lượt đề cập
    - Rà soát việc che giấu dữ liệu nhạy cảm khi tiếp nhận từ kênh hoặc các ranh giới tương thích của SDK
sidebarTitle: Channel Ingress
summary: API tiếp nhận kênh thử nghiệm để cấp quyền cho tin nhắn đến
title: API tiếp nhận kênh
x-i18n:
    generated_at: "2026-07-12T08:11:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Channel ingress là ranh giới kiểm soát truy cập thử nghiệm dành cho các sự kiện kênh đi vào.
Các Plugin sở hữu thông tin thực tế và tác dụng phụ dành riêng cho nền tảng; phần lõi sở hữu
chính sách chung: danh sách cho phép của tin nhắn trực tiếp/nhóm, các mục tin nhắn trực tiếp
trong kho ghép nối, cổng định tuyến, cổng lệnh, xác thực sự kiện, kích hoạt bằng lượt đề cập,
chẩn đoán đã biên tập và tiếp nhận.

Dùng `openclaw/plugin-sdk/channel-ingress-runtime` cho các đường dẫn tiếp nhận mới. Đường dẫn con
`openclaw/plugin-sdk/channel-ingress` cũ hơn vẫn được xuất dưới dạng một facade tương thích
đã lỗi thời dành cho các Plugin bên thứ ba.

## Bộ phân giải thời gian chạy

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

Không tính toán trước danh sách cho phép hiệu lực, chủ sở hữu lệnh hoặc nhóm lệnh.
Bộ phân giải suy ra chúng từ danh sách cho phép thô, callback của kho, bộ mô tả
định tuyến, nhóm truy cập, chính sách và loại cuộc trò chuyện.

## Kết quả

Các Plugin đi kèm nên trực tiếp sử dụng các phép chiếu hiện đại:

| Trường             | Ý nghĩa                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `ingress`          | quyết định theo thứ tự của các cổng và trạng thái tiếp nhận              |
| `senderAccess`     | chỉ cho phép người gửi/cuộc trò chuyện                                   |
| `routeAccess`      | phép chiếu định tuyến và người gửi theo định tuyến                       |
| `commandAccess`    | cho phép lệnh; `requested: false` khi không có cổng lệnh nào được chạy   |
| `activationAccess` | kết quả đề cập/kích hoạt                                                 |

Khả năng cho phép sự kiện vẫn có trên `ingress.graph` theo thứ tự và
`ingress.reasonCode` mang tính quyết định; không phát ra phép chiếu sự kiện riêng.

Các trình trợ giúp SDK bên thứ ba đã lỗi thời có thể tái tạo nội bộ các cấu trúc cũ hơn.
Các đường dẫn tiếp nhận đi kèm mới không nên chuyển đổi kết quả hiện đại trở lại thành
các DTO cục bộ.

## Nhóm truy cập

Các mục `accessGroup:<name>` vẫn được biên tập. Phần lõi tự phân giải các nhóm
`message.senders` tĩnh và chỉ gọi `resolveAccessGroupMembership` đối với
các nhóm động yêu cầu tra cứu trên nền tảng. Các nhóm bị thiếu, không được hỗ trợ
hoặc gặp lỗi đều mặc định từ chối.

## Chế độ sự kiện

| `authMode`       | Ý nghĩa                                                       |
| ---------------- | ------------------------------------------------------------- |
| `inbound`        | các cổng người gửi thông thường cho sự kiện đi vào            |
| `command`        | các cổng lệnh dành cho callback hoặc nút có phạm vi            |
| `origin-subject` | tác nhân phải khớp với chủ thể của tin nhắn gốc                |
| `route-only`     | chỉ dùng cổng định tuyến cho sự kiện tin cậy theo định tuyến   |
| `none`           | sự kiện nội bộ do Plugin sở hữu bỏ qua xác thực dùng chung     |

Dùng `mayPair: false` cho phản ứng, nút, callback và lệnh gốc của nền tảng.

## Định tuyến và kích hoạt

Dùng bộ mô tả định tuyến cho chính sách phòng, chủ đề, máy chủ, luồng hoặc định tuyến lồng nhau:

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

Dùng `channelIngressRoutes(...)` khi một Plugin có nhiều bộ mô tả định tuyến
tùy chọn; hàm này lọc các nhánh bị vô hiệu hóa trong khi giữ thông tin định tuyến
ở dạng chung và sắp xếp theo `precedence` của từng bộ mô tả.

Kiểm tra lượt đề cập là một cổng kích hoạt. Khi không có lượt đề cập, kết quả trả về
`admission: "skip"` để hạt nhân lượt chạy không xử lý một lượt chỉ quan sát.
Hầu hết các kênh nên đặt bước kích hoạt sau các cổng người gửi và lệnh. Những bề mặt
trò chuyện công khai cần loại bỏ lưu lượng không đề cập trước khi phát sinh nhiễu từ
danh sách cho phép người gửi có thể chọn `activation.order: "before-sender"` khi tính năng
bỏ qua bằng lệnh văn bản bị vô hiệu hóa. Các kênh có kích hoạt ngầm, chẳng hạn như câu trả lời
trong luồng của bot, có thể truyền `activation.allowedImplicitMentionKinds`; phép chiếu
`activationAccess.shouldBypassMention` sau đó cho biết khi nào lệnh hoặc kích hoạt ngầm
đã bỏ qua yêu cầu đề cập tường minh.

## Biên tập dữ liệu nhạy cảm

Giá trị người gửi thô và mục danh sách cho phép thô chỉ là dữ liệu đầu vào của bộ phân giải.
Chúng không được xuất hiện trong trạng thái đã phân giải, quyết định, chẩn đoán, bản chụp nhanh
hoặc thông tin tương thích. Hãy dùng mã định danh chủ thể, mã định danh mục, mã định danh
định tuyến và mã định danh chẩn đoán dạng không minh bạch.

## Xác minh

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
