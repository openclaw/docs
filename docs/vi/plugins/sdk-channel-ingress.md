---
read_when:
    - Xây dựng hoặc di chuyển Plugin kênh nhắn tin
    - Thay đổi danh sách cho phép đối với tin nhắn trực tiếp hoặc nhóm, cổng định tuyến, xác thực lệnh, xác thực sự kiện hoặc kích hoạt bằng lượt đề cập
    - Rà soát việc che thông tin nhạy cảm ở đầu vào kênh hoặc các ranh giới tương thích của SDK
sidebarTitle: Channel Ingress
summary: API tiếp nhận thử nghiệm của kênh để cấp quyền cho tin nhắn đến
title: API tiếp nhận kênh
x-i18n:
    generated_at: "2026-07-16T15:02:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Ingress của kênh là ranh giới kiểm soát truy cập thử nghiệm cho các sự kiện
kênh đến. Plugin sở hữu các dữ kiện nền tảng và tác dụng phụ; phần lõi sở hữu
chính sách chung: danh sách cho phép DM/nhóm, các mục DM trong kho ghép nối, cổng tuyến,
cổng lệnh, xác thực sự kiện, kích hoạt bằng lượt đề cập, chẩn đoán đã biên tập và
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

Không tính trước các danh sách cho phép có hiệu lực, chủ sở hữu lệnh hoặc nhóm lệnh.
Bộ phân giải suy ra chúng từ danh sách cho phép thô, lệnh gọi lại của kho, bộ mô tả
tuyến, nhóm truy cập, chính sách và loại cuộc trò chuyện.

## Kết quả

Các Plugin đi kèm nên sử dụng trực tiếp các phép chiếu hiện đại:

| Trường              | Ý nghĩa                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | quyết định cổng theo thứ tự và việc tiếp nhận                                |
| `senderAccess`     | chỉ ủy quyền người gửi/cuộc trò chuyện                             |
| `routeAccess`      | phép chiếu tuyến và người gửi theo tuyến                                  |
| `commandAccess`    | ủy quyền lệnh; `requested: false` khi không có cổng lệnh nào chạy |
| `activationAccess` | kết quả đề cập/kích hoạt                                          |

Ủy quyền sự kiện vẫn có trên `ingress.graph` theo thứ tự và
`ingress.reasonCode` mang tính quyết định; không phát ra phép chiếu sự kiện riêng biệt.

Các trình trợ giúp SDK bên thứ ba đã lỗi thời có thể dựng lại các hình dạng cũ hơn ở nội bộ. Các
đường dẫn nhận đi kèm mới không nên chuyển đổi kết quả hiện đại trở lại thành DTO
cục bộ.

## Nhóm truy cập

Các mục `accessGroup:<name>` vẫn được biên tập. Phần lõi tự phân giải các nhóm
`message.senders` tĩnh và chỉ gọi `resolveAccessGroupMembership`
cho các nhóm động cần tra cứu trên nền tảng. Các nhóm bị thiếu, không được hỗ trợ và
thất bại đều bị từ chối theo mặc định.

## Chế độ sự kiện

| `authMode`       | Ý nghĩa                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | các cổng người gửi đến thông thường                      |
| `command`        | cổng lệnh cho lệnh gọi lại hoặc nút có phạm vi    |
| `origin-subject` | tác nhân phải khớp với chủ thể của tin nhắn gốc    |
| `route-only`     | chỉ áp dụng cổng tuyến cho các sự kiện tin cậy có phạm vi tuyến |
| `none`           | sự kiện nội bộ do Plugin sở hữu bỏ qua xác thực dùng chung  |

Sử dụng `mayPair: false` cho phản ứng, nút, lệnh gọi lại và lệnh gốc.

## Tuyến và kích hoạt

Sử dụng bộ mô tả tuyến cho chính sách phòng, chủ đề, máy chủ, luồng hoặc tuyến lồng nhau:

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
tùy chọn; nó lọc các nhánh đã tắt trong khi vẫn giữ các dữ kiện tuyến ở dạng chung
và được sắp xếp theo `precedence` của từng bộ mô tả.

Cổng đề cập là một cổng kích hoạt. Khi không khớp lượt đề cập, hệ thống trả về
`admission: "skip"` để hạt nhân lượt không xử lý một lượt chỉ quan sát.
Hầu hết các kênh nên đặt kích hoạt sau cổng người gửi và cổng lệnh. Các bề mặt
trò chuyện công khai phải làm im lưu lượng không được đề cập trước nhiễu từ danh sách
cho phép người gửi có thể chọn `activation.order: "before-sender"` khi tính năng
bỏ qua bằng lệnh văn bản bị tắt. Các kênh có kích hoạt ngầm định, chẳng hạn như phản hồi
trong các luồng của bot, có thể truyền `activation.allowedImplicitMentionKinds`; khi đó
`activationAccess.shouldBypassMention` được chiếu sẽ báo cáo thời điểm lệnh hoặc kích hoạt
ngầm định đã bỏ qua yêu cầu đề cập rõ ràng.

## Biên tập dữ liệu nhạy cảm

Giá trị người gửi thô và các mục danh sách cho phép thô chỉ là đầu vào của bộ phân giải. Chúng
không được xuất hiện trong trạng thái đã phân giải, quyết định, chẩn đoán, ảnh chụp nhanh hoặc
dữ kiện tương thích. Sử dụng mã định danh chủ thể, mã định danh mục, mã định danh tuyến và
mã định danh chẩn đoán dạng không trong suốt.

## Xác minh

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
