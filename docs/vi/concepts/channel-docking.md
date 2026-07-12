---
read_when:
    - Bạn muốn chuyển các phản hồi của một phiên đang hoạt động từ Telegram sang Discord, Slack, Mattermost hoặc một kênh được liên kết khác
    - Bạn đang cấu hình `session.identityLinks` cho tin nhắn trực tiếp xuyên kênh
    - Lệnh /dock cho biết người gửi chưa được liên kết hoặc không có phiên hoạt động nào tồn tại
summary: Chuyển tuyến trả lời của một phiên OpenClaw giữa các kênh trò chuyện đã liên kết
title: Ghép nối kênh
x-i18n:
    generated_at: "2026-07-12T07:52:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

Gắn kênh là hình thức chuyển tiếp cuộc gọi cho một phiên OpenClaw. Tính năng này giữ nguyên
ngữ cảnh hội thoại nhưng thay đổi nơi nhận các phản hồi tiếp theo của phiên đó.
Việc gắn kênh chỉ hoạt động từ cuộc trò chuyện trực tiếp; không hoạt động từ cuộc
trò chuyện nhóm.

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

Nếu Alice gửi lệnh này từ cuộc trò chuyện trực tiếp trên Telegram:

```text
/dock_discord
```

OpenClaw giữ nguyên ngữ cảnh phiên hiện tại và thay đổi tuyến phản hồi:

| Trước khi gắn kênh                | Sau `/dock_discord`           |
| --------------------------------- | ----------------------------- |
| Phản hồi được gửi đến Telegram `123` | Phản hồi được gửi đến Discord `456` |

Phiên không được tạo lại. Lịch sử bản ghi hội thoại vẫn được gắn với
chính phiên đó.

## Lý do sử dụng

Sử dụng tính năng gắn kênh khi một tác vụ bắt đầu trong một ứng dụng trò chuyện nhưng các phản hồi tiếp theo
cần được gửi đến nơi khác.

Quy trình thường gặp:

1. Bắt đầu một tác vụ tác nhân từ Telegram.
2. Chuyển sang Discord, nơi bạn đang điều phối công việc.
3. Gửi `/dock_discord` từ cuộc trò chuyện trực tiếp trên Telegram.
4. Giữ nguyên phiên OpenClaw nhưng nhận các phản hồi tiếp theo trong Discord.

## Cấu hình bắt buộc

Tính năng gắn kênh yêu cầu `session.identityLinks`. Người gửi nguồn và đối tượng đích
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

Các giá trị là mã định danh đối tượng có tiền tố kênh:

| Giá trị        | Ý nghĩa                              |
| -------------- | ------------------------------------ |
| `telegram:123` | Mã định danh người gửi Telegram `123` |
| `discord:456`  | Mã định danh đối tượng trực tiếp Discord `456` |
| `slack:U123`   | Mã định danh người dùng Slack `U123` |

Khóa chính tắc (`alice` ở trên) chỉ là tên nhóm danh tính dùng chung. Các lệnh
gắn kênh sử dụng những giá trị có tiền tố kênh để xác minh rằng người gửi nguồn và
đối tượng đích là cùng một người.

## Lệnh

OpenClaw tạo một lệnh `/dock-<channel>` cho mỗi Plugin kênh đã tải
có hỗ trợ lệnh gốc, vì vậy danh sách sẽ dài thêm khi các Plugin được thêm vào. Các
Plugin đi kèm hiện hỗ trợ tính năng này:

| Kênh đích  | Lệnh               | Bí danh            |
| ---------- | ------------------ | ------------------ |
| Discord    | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack      | `/dock-slack`      | `/dock_slack`      |
| Telegram   | `/dock-telegram`   | `/dock_telegram`   |

Dạng dùng dấu gạch dưới cũng là tên lệnh gốc trên các nền tảng như Telegram,
nơi cung cấp trực tiếp các lệnh dấu gạch chéo.

## Những gì thay đổi

Việc gắn kênh cập nhật các trường phân phối của phiên đang hoạt động:

| Trường phiên    | Ví dụ sau `/dock_discord`               |
| --------------- | --------------------------------------- |
| `lastChannel`   | `discord`                               |
| `lastTo`        | `456`                                   |
| `lastAccountId` | tài khoản của kênh đích hoặc `default`  |

Các trường này được lưu bền vững trong kho phiên và được sử dụng để phân phối
các phản hồi sau đó cho phiên đó.

## Những gì không thay đổi

Việc gắn kênh không:

- tạo tài khoản kênh
- kết nối bot Discord, Telegram, Slack hoặc Mattermost mới
- cấp quyền truy cập cho người dùng
- bỏ qua danh sách cho phép của kênh hoặc chính sách tin nhắn trực tiếp
- chuyển lịch sử bản ghi hội thoại sang phiên khác
- khiến những người dùng không liên quan dùng chung một phiên

Tính năng này chỉ thay đổi tuyến phân phối của phiên hiện tại.

## Khắc phục sự cố

**Lệnh thông báo người gửi chưa được liên kết.**

Thêm cả người gửi hiện tại và đối tượng đích vào cùng một nhóm
`session.identityLinks`. Ví dụ: nếu người gửi Telegram `123` cần gắn kênh
với đối tượng Discord `456`, hãy bao gồm cả `telegram:123` và `discord:456`.

**Lệnh thông báo tính năng gắn kênh chỉ khả dụng từ cuộc trò chuyện trực tiếp.**

Gửi lệnh gắn kênh từ cuộc trò chuyện trực tiếp với OpenClaw, không phải từ cuộc trò chuyện nhóm.

**Lệnh thông báo không có phiên đang hoạt động.**

Thực hiện gắn kênh từ một phiên trò chuyện trực tiếp hiện có. Lệnh cần một mục phiên đang hoạt động
để có thể lưu bền vững tuyến mới.

**Phản hồi vẫn được gửi đến kênh cũ.**

Kiểm tra xem lệnh có phản hồi bằng thông báo thành công hay không, đồng thời xác nhận mã định danh
đối tượng đích khớp với mã định danh mà kênh đó sử dụng. Việc gắn kênh chỉ thay đổi tuyến của
phiên đang hoạt động; một phiên khác vẫn có thể định tuyến đến nơi khác.

**Tôi cần chuyển lại.**

Gửi lệnh tương ứng với kênh ban đầu, chẳng hạn như `/dock_telegram` hoặc
`/dock-telegram`, từ một người gửi đã được liên kết.
