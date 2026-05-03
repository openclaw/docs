---
read_when:
    - Cấu hình các cập nhật tiến độ hiển thị cho các lượt trò chuyện chạy lâu
    - Chọn giữa các chế độ truyền phát từng phần, theo khối và tiến trình
    - Giải thích cách OpenClaw cập nhật một tin nhắn kênh trong khi công việc đang được xử lý
    - Khắc phục sự cố với bản nháp tiến trình, thông báo tiến trình độc lập hoặc phương án dự phòng khi hoàn tất
summary: 'Bản nháp tiến độ: một thông báo công việc đang tiến hành hiển thị duy nhất được cập nhật trong khi tác tử chạy'
title: Các bản nháp tiến độ
x-i18n:
    generated_at: "2026-05-03T21:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Các bản nháp tiến độ giúp các lượt agent chạy lâu tạo cảm giác sống động trong cuộc trò chuyện mà không biến cuộc hội thoại thành một chồng phản hồi trạng thái tạm thời.

Khi bật bản nháp tiến độ, OpenClaw tạo một thông báo công việc đang xử lý hiển thị được, cập nhật thông báo đó trong khi agent đọc, lập kế hoạch, gọi công cụ hoặc chờ phê duyệt, rồi chuyển bản nháp đó thành câu trả lời cuối cùng khi kênh có thể làm vậy một cách an toàn.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Dùng bản nháp tiến độ khi bạn muốn một thông báo trạng thái gọn gàng trong lúc thực hiện công việc dùng nhiều công cụ và câu trả lời cuối cùng khi lượt hoàn tất.

## Bắt đầu nhanh

Bật bản nháp tiến độ cho từng kênh bằng `streaming.mode: "progress"`:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

Như vậy thường là đủ. OpenClaw sẽ chọn một nhãn một từ tự động, thêm các dòng tiến độ ngắn gọn trong khi có công việc hữu ích diễn ra, và chặn các thông báo tiến độ độc lập bị trùng lặp cho lượt đó.

## Người dùng thấy gì

Một bản nháp tiến độ có hai phần:

| Phần           | Mục đích                                                          |
| -------------- | ----------------------------------------------------------------- |
| Nhãn           | Một tiêu đề ngắn như `Thinking` hoặc `Shelling`.                  |
| Dòng tiến độ   | Các cập nhật chạy ngắn gọn như lời gọi công cụ, bước tác vụ hoặc phê duyệt. |

Nhãn xuất hiện ngay khi agent bắt đầu trả lời. Các dòng tiến độ chỉ được thêm khi agent phát ra các cập nhật công việc hữu ích. Câu trả lời cuối cùng thay thế bản nháp khi có thể; nếu không, OpenClaw gửi câu trả lời cuối cùng theo cách thông thường và dọn dẹp hoặc ngừng cập nhật bản nháp tùy theo phương thức vận chuyển của kênh.

## Chọn chế độ

`channels.<channel>.streaming.mode` kiểm soát hành vi đang xử lý hiển thị được:

| Chế độ     | Phù hợp nhất cho                | Nội dung xuất hiện trong chat                       |
| ---------- | -------------------------------- | -------------------------------------------------- |
| `off`      | Kênh yên tĩnh                   | Chỉ câu trả lời cuối cùng.                         |
| `partial`  | Theo dõi văn bản câu trả lời xuất hiện | Một bản nháp được chỉnh sửa với văn bản câu trả lời mới nhất. |
| `block`    | Các đoạn xem trước câu trả lời lớn hơn | Một bản xem trước được cập nhật hoặc nối thêm theo các đoạn lớn hơn. |
| `progress` | Các lượt dùng nhiều công cụ hoặc chạy lâu | Một bản nháp trạng thái, rồi câu trả lời cuối cùng. |

Chọn `progress` khi người dùng quan tâm nhiều hơn đến “điều gì đang diễn ra” thay vì xem văn bản câu trả lời stream từng token.

Chọn `partial` khi chính câu trả lời là tín hiệu tiến độ.

Chọn `block` khi bạn muốn cập nhật bản nháp xem trước theo các đoạn văn bản lớn hơn. Trên Discord và Telegram, `streaming.mode: "block"` vẫn là stream xem trước, không phải phân phối block thông thường. Dùng `streaming.block.enabled` hoặc `blockStreaming` cũ khi bạn muốn phản hồi block thông thường.

## Cấu hình nhãn

Nhãn tiến độ nằm dưới `channels.<channel>.streaming.progress`.

Nhãn mặc định là `auto`, chọn từ nhóm nhãn một từ tích hợp sẵn của OpenClaw:

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

Dùng một nhãn cố định:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Dùng nhóm nhãn tự động của riêng bạn:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Ẩn nhãn và chỉ hiển thị các dòng tiến độ:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Kiểm soát dòng tiến độ

Các dòng tiến độ được bật mặc định trong chế độ tiến độ. Chúng đến từ các sự kiện chạy thực: bắt đầu công cụ, cập nhật mục, kế hoạch tác vụ, phê duyệt, đầu ra lệnh, tóm tắt bản vá và hoạt động agent tương tự.

Giới hạn số dòng còn hiển thị:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Giữ bản nháp tiến độ duy nhất nhưng ẩn các dòng công cụ và tác vụ:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Với `toolProgress: false`, OpenClaw vẫn chặn các thông báo tiến độ công cụ độc lập cũ hơn cho lượt đó. Kênh vẫn yên tĩnh về mặt hiển thị cho đến câu trả lời cuối cùng, ngoại trừ nhãn nếu có cấu hình.

## Hành vi kênh

Mỗi kênh dùng phương thức vận chuyển sạch nhất mà nó hỗ trợ:

| Kênh            | Phương thức vận chuyển tiến độ          | Ghi chú                                                               |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Gửi một thông báo, rồi chỉnh sửa nó.   | Văn bản cuối cùng được chỉnh sửa tại chỗ khi vừa trong một thông báo xem trước an toàn. |
| Matrix          | Gửi một sự kiện, rồi chỉnh sửa nó.     | Cấu hình streaming cấp tài khoản kiểm soát các bản nháp cấp tài khoản. |
| Microsoft Teams | Stream Teams gốc trong chat cá nhân.   | `streaming.mode: "block"` ánh xạ tới phân phối block của Teams.       |
| Slack           | Stream gốc hoặc bài đăng bản nháp có thể chỉnh sửa. | Tính khả dụng của luồng ảnh hưởng đến việc có thể dùng streaming gốc hay không. |
| Telegram        | Gửi một thông báo, rồi chỉnh sửa nó.   | Các bản nháp hiển thị cũ hơn có thể được thay thế để dấu thời gian cuối cùng vẫn hữu ích. |
| Mattermost      | Bài đăng bản nháp có thể chỉnh sửa.    | Hoạt động công cụ được gộp vào cùng bài đăng kiểu bản nháp.            |

Các kênh không có hỗ trợ chỉnh sửa an toàn thường quay về chỉ báo đang nhập hoặc chỉ phân phối câu trả lời cuối cùng.

## Hoàn tất

Khi câu trả lời cuối cùng đã sẵn sàng, OpenClaw cố giữ cuộc trò chuyện gọn gàng:

- Nếu bản nháp có thể an toàn trở thành câu trả lời cuối cùng, OpenClaw chỉnh sửa nó tại chỗ.
- Nếu kênh dùng streaming tiến độ gốc, OpenClaw hoàn tất stream đó khi phương thức vận chuyển gốc chấp nhận văn bản cuối cùng.
- Nếu câu trả lời cuối cùng có phương tiện, lời nhắc phê duyệt, mục tiêu trả lời rõ ràng, quá nhiều đoạn, hoặc chỉnh sửa/gửi thất bại, OpenClaw gửi câu trả lời cuối cùng qua đường phân phối kênh thông thường.

Đường dự phòng này là có chủ đích. Tốt hơn là gửi một câu trả lời cuối cùng mới thay vì làm mất văn bản, gắn nhầm luồng trả lời, hoặc ghi đè bản nháp bằng một payload mà kênh không thể biểu diễn an toàn.

## Khắc phục sự cố

**Tôi chỉ thấy câu trả lời cuối cùng.**

Kiểm tra rằng `channels.<channel>.streaming.mode` được đặt thành `progress` cho tài khoản hoặc kênh đã xử lý thông báo. Một số đường nhóm hoặc trích dẫn-trả lời có thể tắt xem trước bản nháp cho một lượt khi kênh không thể chỉnh sửa đúng thông báo một cách an toàn.

**Tôi thấy nhãn nhưng không có dòng công cụ.**

Kiểm tra `streaming.progress.toolProgress`. Nếu nó là `false`, OpenClaw giữ hành vi một bản nháp duy nhất nhưng ẩn các dòng tiến độ công cụ và tác vụ.

**Tôi thấy một thông báo cuối cùng mới thay vì một bản nháp đã chỉnh sửa.**

Đó là dự phòng an toàn. Điều này có thể xảy ra với phản hồi có phương tiện, câu trả lời dài, mục tiêu trả lời rõ ràng, bản nháp Telegram cũ, thiếu mục tiêu luồng Slack, thông báo xem trước đã bị xóa hoặc hoàn tất stream gốc thất bại.

**Tôi vẫn thấy các thông báo tiến độ độc lập.**

Chế độ tiến độ chặn các thông báo tiến độ công cụ độc lập mặc định khi có một bản nháp đang hoạt động. Nếu thông báo độc lập vẫn xuất hiện, hãy xác minh rằng lượt đó thực sự đang dùng chế độ tiến độ chứ không phải `streaming.mode: "off"` hoặc một đường kênh không thể tạo bản nháp cho thông báo đó.

**Teams hoạt động khác Discord hoặc Telegram.**

Microsoft Teams dùng stream gốc trong chat cá nhân thay vì phương thức vận chuyển xem trước gửi-và-chỉnh-sửa chung. Teams cũng coi `streaming.mode: "block"` là phân phối block của Teams vì nó không có cùng chế độ block xem trước bản nháp được Discord và Telegram dùng.

## Liên quan

- [Streaming và chia đoạn](/vi/concepts/streaming)
- [Thông báo](/vi/concepts/messages)
- [Cấu hình kênh](/vi/gateway/config-channels)
- [Discord](/vi/channels/discord)
- [Matrix](/vi/channels/matrix)
- [Microsoft Teams](/vi/channels/msteams)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
