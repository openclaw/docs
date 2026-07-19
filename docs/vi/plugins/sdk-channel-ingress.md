---
read_when:
    - Xây dựng hoặc di chuyển Plugin kênh nhắn tin
    - Thay đổi danh sách cho phép của tin nhắn riêng hoặc nhóm, cổng định tuyến, xác thực lệnh, xác thực sự kiện hoặc kích hoạt bằng lượt đề cập
    - Review việc che thông tin nhạy cảm ở đầu vào kênh hoặc các ranh giới tương thích của SDK
sidebarTitle: Channel Ingress
summary: API đầu vào kênh thử nghiệm để ủy quyền tin nhắn đến
title: API tiếp nhận của kênh
x-i18n:
    generated_at: "2026-07-19T05:54:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 60feecb7bcf203cf37d2543a7855e89b5bfb2eb9d8263d804219e140facb8fc6
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Luồng vào của kênh là ranh giới kiểm soát truy cập thử nghiệm cho các sự kiện
kênh gửi đến. Plugin sở hữu các dữ kiện nền tảng và tác dụng phụ; phần lõi sở hữu
chính sách dùng chung: danh sách cho phép DM/nhóm, mục DM trong kho ghép nối, cổng tuyến,
cổng lệnh, xác thực sự kiện, kích hoạt bằng lượt nhắc, chẩn đoán đã che thông tin, và
tiếp nhận.

Sử dụng `openclaw/plugin-sdk/channel-ingress-runtime` cho các đường dẫn nhận.

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

Không tính toán trước danh sách cho phép có hiệu lực, chủ sở hữu lệnh hoặc nhóm lệnh.
Bộ phân giải suy ra chúng từ danh sách cho phép thô, callback của kho, bộ mô tả tuyến,
nhóm truy cập, chính sách và loại cuộc trò chuyện.

## Kết quả

Các Plugin đi kèm nên sử dụng trực tiếp các phép chiếu hiện đại:

| Trường              | Ý nghĩa                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | quyết định cổng theo thứ tự và việc tiếp nhận                                |
| `senderAccess`     | chỉ xác thực người gửi/cuộc trò chuyện                             |
| `routeAccess`      | phép chiếu tuyến và người gửi theo tuyến                                  |
| `commandAccess`    | xác thực lệnh; `requested: false` khi không có cổng lệnh nào được chạy |
| `activationAccess` | kết quả lượt nhắc/kích hoạt                                          |

Xác thực sự kiện vẫn có sẵn trên `ingress.graph` theo thứ tự và
`ingress.reasonCode` mang tính quyết định; không phát ra phép chiếu sự kiện riêng.

Các trình trợ giúp SDK bên thứ ba đã lỗi thời có thể tái tạo các dạng cũ trong nội bộ. Các
đường dẫn nhận đi kèm mới không nên chuyển đổi kết quả hiện đại trở lại thành DTO
cục bộ.

## Nhóm truy cập

Các mục `accessGroup:<name>` vẫn được che thông tin. Phần lõi tự phân giải các nhóm
`message.senders` tĩnh và chỉ gọi `resolveAccessGroupMembership`
cho các nhóm động cần tra cứu nền tảng. Các nhóm bị thiếu, không được hỗ trợ và
không thành công đều từ chối theo chế độ đóng.

## Chế độ sự kiện

| `authMode`       | Ý nghĩa                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | cổng người gửi đến thông thường                      |
| `command`        | cổng lệnh cho callback hoặc nút có phạm vi    |
| `origin-subject` | tác nhân phải khớp với chủ thể của tin nhắn gốc    |
| `route-only`     | chỉ áp dụng cổng tuyến cho các sự kiện đáng tin cậy có phạm vi tuyến |
| `none`           | sự kiện nội bộ do Plugin sở hữu bỏ qua xác thực dùng chung  |

Sử dụng `mayPair: false` cho phản ứng, nút, callback và lệnh gốc.

## Tuyến và kích hoạt

Sử dụng bộ mô tả tuyến cho chính sách phòng, chủ đề, guild, luồng hoặc tuyến lồng nhau:

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

Sử dụng `channelIngressRoutes(...)` khi một Plugin có nhiều bộ mô tả tuyến
tùy chọn; nó lọc các nhánh bị tắt trong khi giữ dữ kiện tuyến ở dạng dùng chung
và sắp xếp theo `precedence` của từng bộ mô tả.

Cổng lượt nhắc là một cổng kích hoạt. Khi không có lượt nhắc, nó trả về
`admission: "skip"` để nhân lượt không xử lý một lượt chỉ quan sát.
Hầu hết các kênh nên đặt kích hoạt sau cổng người gửi và cổng lệnh. Các bề mặt
trò chuyện công khai phải giảm lưu lượng không được nhắc trước khi phát sinh nhiễu từ danh sách
cho phép người gửi có thể chọn `activation.order: "before-sender"` khi tính năng bỏ qua bằng lệnh văn bản
bị tắt. Các kênh có kích hoạt ngầm định, chẳng hạn như câu trả lời trong
luồng của bot, phân giải `channels.defaults.implicitMentions` cùng các giá trị ghi đè của kênh và tài khoản
bằng `resolveChannelImplicitMentions(...)`, rồi truyền kết quả dưới dạng
`activation.implicitMentions`. Phép chiếu
`activationAccess.shouldBypassMention` báo cáo khi lệnh hoặc kích hoạt ngầm định
đã bỏ qua yêu cầu lượt nhắc tường minh.

## Che thông tin

Giá trị người gửi thô và mục danh sách cho phép thô chỉ là đầu vào của bộ phân giải. Chúng
không được xuất hiện trong trạng thái đã phân giải, quyết định, chẩn đoán, ảnh chụp trạng thái hoặc
dữ kiện tương thích. Sử dụng mã định danh chủ thể, mã định danh mục, mã định danh tuyến và
mã định danh chẩn đoán dạng bất minh.

## Xác minh

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
