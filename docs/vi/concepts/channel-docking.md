---
read_when:
    - Bạn muốn các phản hồi cho một phiên đang hoạt động chuyển từ Telegram sang Discord, Slack, Mattermost hoặc một kênh đã liên kết khác
    - Bạn đang cấu hình session.identityLinks cho tin nhắn trực tiếp liên kênh
    - Lệnh /dock cho biết người gửi chưa được liên kết hoặc không có phiên hoạt động nào tồn tại
summary: Chuyển tuyến trả lời của một phiên OpenClaw giữa các kênh trò chuyện được liên kết
title: Gắn kênh
x-i18n:
    generated_at: "2026-04-29T22:36:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

Ghép nối kênh là chuyển tiếp cuộc gọi cho một phiên OpenClaw.

Nó giữ nguyên ngữ cảnh hội thoại, nhưng thay đổi nơi các phản hồi trong tương lai cho
phiên đó được gửi đến.

## Ví dụ

Alice có thể nhắn tin cho OpenClaw trên Telegram và Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Nếu Alice gửi nội dung này từ Telegram:

```text
/dock_discord
```

OpenClaw giữ ngữ cảnh phiên hiện tại và thay đổi tuyến phản hồi:

| Trước khi ghép nối            | Sau `/dock_discord`           |
| ----------------------------- | ----------------------------- |
| Phản hồi đi tới Telegram `123` | Phản hồi đi tới Discord `456` |

Phiên không được tạo lại. Lịch sử bản ghi hội thoại vẫn được gắn với
cùng một phiên.

## Lý do sử dụng

Dùng ghép nối khi một tác vụ bắt đầu trong một ứng dụng chat nhưng các phản hồi tiếp theo nên được gửi tới
nơi khác.

Luồng thường gặp:

1. Bắt đầu một tác vụ agent từ Telegram.
2. Chuyển sang Discord nơi bạn đang phối hợp công việc.
3. Gửi `/dock_discord` từ phiên Telegram.
4. Giữ nguyên phiên OpenClaw, nhưng nhận các phản hồi trong tương lai ở Discord.

## Cấu hình bắt buộc

Ghép nối yêu cầu `session.identityLinks`. Người gửi nguồn và peer đích
phải nằm trong cùng một nhóm danh tính:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Các giá trị là ID peer có tiền tố kênh:

| Giá trị        | Ý nghĩa                        |
| -------------- | ------------------------------ |
| `telegram:123` | ID người gửi Telegram `123`    |
| `discord:456`  | ID peer trực tiếp Discord `456` |
| `slack:U123`   | ID người dùng Slack `U123`     |

Khóa chuẩn (`alice` ở trên) chỉ là tên nhóm danh tính dùng chung. Các lệnh ghép nối
dùng giá trị có tiền tố kênh để chứng minh rằng người gửi nguồn và
peer đích là cùng một người.

## Lệnh

Các lệnh ghép nối được tạo từ những plugin kênh đã tải có hỗ trợ
lệnh gốc. Các lệnh được đóng gói hiện tại:

| Kênh đích  | Lệnh               | Bí danh            |
| ---------- | ------------------ | ------------------ |
| Discord    | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack      | `/dock-slack`      | `/dock_slack`      |
| Telegram   | `/dock-telegram`   | `/dock_telegram`   |

Các bí danh dùng dấu gạch dưới hữu ích trên những bề mặt lệnh gốc như Telegram.

## Nội dung thay đổi

Ghép nối cập nhật các trường gửi của phiên đang hoạt động:

| Trường phiên   | Ví dụ sau `/dock_discord`              |
| -------------- | -------------------------------------- |
| `lastChannel`  | `discord`                              |
| `lastTo`       | `456`                                  |
| `lastAccountId` | tài khoản kênh đích, hoặc `default`  |

Các trường đó được lưu bền trong kho phiên và được dùng cho việc gửi phản hồi
sau này của phiên đó.

## Nội dung không thay đổi

Ghép nối không:

- tạo tài khoản kênh
- kết nối một bot Discord, Telegram, Slack hoặc Mattermost mới
- cấp quyền truy cập cho người dùng
- bỏ qua danh sách cho phép của kênh hoặc chính sách tin nhắn trực tiếp
- di chuyển lịch sử bản ghi hội thoại sang phiên khác
- khiến những người dùng không liên quan dùng chung một phiên

Nó chỉ thay đổi tuyến gửi cho phiên hiện tại.

## Khắc phục sự cố

**Lệnh báo rằng người gửi chưa được liên kết.**

Thêm cả người gửi hiện tại và peer đích vào cùng một nhóm
`session.identityLinks`. Ví dụ, nếu người gửi Telegram `123` cần ghép nối
tới peer Discord `456`, hãy bao gồm cả `telegram:123` và `discord:456`.

**Lệnh báo rằng không có phiên đang hoạt động.**

Ghép nối từ một phiên chat trực tiếp hiện có. Lệnh cần một mục phiên đang hoạt động
để có thể lưu bền tuyến mới.

**Phản hồi vẫn đi tới kênh cũ.**

Kiểm tra rằng lệnh đã trả lời bằng thông báo thành công, và xác nhận ID
peer đích khớp với ID mà kênh đó sử dụng. Ghép nối chỉ thay đổi tuyến
phiên đang hoạt động; một phiên khác vẫn có thể định tuyến tới nơi khác.

**Tôi cần chuyển lại.**

Gửi lệnh tương ứng cho kênh ban đầu, chẳng hạn `/dock_telegram` hoặc
`/dock-telegram`, từ một người gửi đã liên kết.
