---
read_when:
    - Cấu hình các bản cập nhật tiến độ hiển thị cho các lượt trò chuyện kéo dài
    - Chọn giữa các chế độ truyền phát một phần, theo khối và theo tiến độ
    - Giải thích cách OpenClaw cập nhật một tin nhắn kênh trong khi công việc đang diễn ra
    - Khắc phục sự cố bản nháp tiến trình, thông báo tiến trình độc lập hoặc phương án dự phòng khi hoàn tất
summary: 'Bản nháp tiến trình: một thông báo công việc đang thực hiện hiển thị rõ và cập nhật trong khi một tác nhân đang chạy'
title: Bản nháp tiến độ
x-i18n:
    generated_at: "2026-05-04T02:23:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Bản nháp tiến trình giúp các lượt tác nhân chạy lâu tạo cảm giác đang diễn ra trong chat mà không biến cuộc hội thoại thành một chồng phản hồi trạng thái tạm thời.

Khi bật bản nháp tiến trình, OpenClaw chỉ tạo một thông báo công việc đang thực hiện hiển thị sau khi lượt xử lý chứng minh rằng nó đang làm việc thật, cập nhật thông báo đó trong lúc tác nhân đọc, lập kế hoạch, gọi công cụ hoặc chờ phê duyệt, rồi chuyển bản nháp đó thành câu trả lời cuối cùng khi kênh có thể làm điều đó một cách an toàn.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Dùng bản nháp tiến trình khi bạn muốn có một thông báo trạng thái gọn gàng trong quá trình làm việc nặng về công cụ và câu trả lời cuối cùng khi lượt xử lý hoàn tất.

## Bắt đầu nhanh

Bật bản nháp tiến trình theo từng kênh với `streaming.mode: "progress"`:

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

Thường như vậy là đủ. OpenClaw sẽ chọn một nhãn một từ tự động, chờ đến khi công việc kéo dài ít nhất năm giây hoặc phát ra sự kiện công việc thứ hai, thêm các dòng tiến trình gọn khi có công việc hữu ích diễn ra, và chặn phần tán gẫu tiến trình độc lập bị trùng lặp cho lượt đó.

## Người dùng nhìn thấy gì

Một bản nháp tiến trình có hai phần:

| Phần           | Mục đích                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| Nhãn          | Một tiêu đề ngắn như `Thinking...` hoặc `Shelling...`.                       |
| Dòng tiến trình | Các cập nhật chạy gọn, dùng cùng nhãn công cụ và biểu tượng như đầu ra chi tiết. |

Nhãn xuất hiện sau khi tác nhân bắt đầu công việc có ý nghĩa và hoặc vẫn bận trong năm giây, hoặc phát ra sự kiện công việc thứ hai. Các phản hồi chỉ có văn bản thuần không hiển thị bản nháp tiến trình. Dòng tiến trình chỉ được thêm khi tác nhân phát ra các cập nhật công việc hữu ích, ví dụ `🛠️ Exec`, `🔎 Web Search`, hoặc `✍️ Write: to /tmp/file`. Theo mặc định, chúng dùng cùng chế độ giải thích gọn như `/verbose`; đặt `agents.defaults.toolProgressDetail: "raw"` khi gỡ lỗi và bạn cũng muốn nối thêm lệnh/chi tiết thô.
Câu trả lời cuối cùng thay thế bản nháp khi có thể; nếu không, OpenClaw gửi câu trả lời cuối cùng như bình thường và dọn dẹp hoặc dừng cập nhật bản nháp theo cơ chế truyền tải của kênh.

## Chọn một chế độ

`channels.<channel>.streaming.mode` kiểm soát hành vi đang thực hiện hiển thị:

| Chế độ       | Phù hợp nhất cho                         | Nội dung xuất hiện trong chat                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Các kênh yên tĩnh                   | Chỉ có câu trả lời cuối cùng.                            |
| `partial`  | Theo dõi văn bản câu trả lời xuất hiện      | Một bản nháp được chỉnh sửa bằng văn bản câu trả lời mới nhất.     |
| `block`    | Các đoạn xem trước câu trả lời lớn hơn     | Một bản xem trước được cập nhật hoặc nối thêm theo các đoạn lớn hơn. |
| `progress` | Các lượt nặng về công cụ hoặc chạy lâu | Một bản nháp trạng thái, rồi đến câu trả lời cuối cùng.          |

Chọn `progress` khi người dùng quan tâm đến "điều gì đang diễn ra" hơn là xem văn bản câu trả lời phát trực tuyến từng token.

Chọn `partial` khi bản thân câu trả lời là tín hiệu tiến trình.

Chọn `block` khi bạn muốn cập nhật bản xem trước nháp theo các đoạn văn bản lớn hơn. Trên Discord và Telegram, `streaming.mode: "block"` vẫn là phát trực tuyến bản xem trước, không phải phát theo block thông thường. Dùng `streaming.block.enabled` hoặc `blockStreaming` cũ khi bạn muốn phản hồi block thông thường.

## Cấu hình nhãn

Nhãn tiến trình nằm trong `channels.<channel>.streaming.progress`.

Nhãn mặc định là `auto`, chọn từ nhóm nhãn tích hợp sẵn của OpenClaw dạng một từ kèm dấu ba chấm:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
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

Ẩn nhãn và chỉ hiển thị các dòng tiến trình:

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

## Kiểm soát dòng tiến trình

Các dòng tiến trình được bật theo mặc định trong chế độ tiến trình. Chúng đến từ các sự kiện chạy thật: công cụ bắt đầu, cập nhật mục, kế hoạch tác vụ, phê duyệt, đầu ra lệnh, tóm tắt bản vá và hoạt động tương tự của tác nhân.

OpenClaw dùng cùng bộ định dạng cho bản nháp tiến trình và `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` là mặc định và giữ bản nháp ổn định với các nhãn ngắn gọn như `🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` nối thêm lệnh/chi tiết bên dưới khi có, hữu ích khi gỡ lỗi nhưng ồn hơn trong chat.

Ví dụ, cùng một lệnh sẽ hiển thị khác nhau tùy vào chế độ chi tiết:

| Chế độ      | Dòng tiến trình                                                        |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Giữ một bản nháp tiến trình duy nhất nhưng ẩn các dòng công cụ và tác vụ:

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

Với `toolProgress: false`, OpenClaw vẫn chặn các thông báo tiến trình công cụ độc lập cũ hơn cho lượt đó. Kênh vẫn yên tĩnh về mặt hiển thị cho đến câu trả lời cuối cùng, ngoại trừ nhãn nếu có cấu hình.

## Hành vi theo kênh

Mỗi kênh dùng cơ chế truyền tải gọn nhất mà nó hỗ trợ:

| Kênh         | Cơ chế truyền tải tiến trình                     | Ghi chú                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Gửi một thông báo, rồi chỉnh sửa thông báo đó.        | Văn bản cuối cùng được chỉnh sửa tại chỗ khi vừa một thông báo xem trước an toàn.      |
| Matrix          | Gửi một sự kiện, rồi chỉnh sửa sự kiện đó.          | Cấu hình phát trực tuyến cấp tài khoản kiểm soát bản nháp cấp tài khoản.         |
| Microsoft Teams | Luồng Teams gốc trong chat cá nhân. | `streaming.mode: "block"` ánh xạ tới phát theo block của Teams.               |
| Slack           | Luồng gốc hoặc bài đăng nháp có thể chỉnh sửa.  | Tình trạng có thread ảnh hưởng đến việc có thể dùng phát trực tuyến gốc hay không.     |
| Telegram        | Gửi một thông báo, rồi chỉnh sửa thông báo đó.        | Các bản nháp hiển thị cũ hơn có thể được thay thế để dấu thời gian cuối cùng vẫn hữu ích. |
| Mattermost      | Bài đăng nháp có thể chỉnh sửa.                   | Hoạt động công cụ được gộp vào cùng bài đăng kiểu bản nháp.               |

Các kênh không có hỗ trợ chỉnh sửa an toàn thường quay về chỉ báo đang nhập hoặc chỉ gửi câu trả lời cuối cùng.

## Hoàn tất

Khi câu trả lời cuối cùng đã sẵn sàng, OpenClaw cố giữ chat gọn gàng:

- Nếu bản nháp có thể an toàn trở thành câu trả lời cuối cùng, OpenClaw chỉnh sửa nó tại chỗ.
- Nếu kênh dùng phát trực tuyến tiến trình gốc, OpenClaw hoàn tất luồng đó khi cơ chế truyền tải gốc chấp nhận văn bản cuối cùng.
- Nếu câu trả lời cuối cùng có phương tiện, lời nhắc phê duyệt, đích trả lời rõ ràng, quá nhiều đoạn, hoặc chỉnh sửa/gửi thất bại, OpenClaw gửi câu trả lời cuối cùng qua đường gửi kênh thông thường.

Đường dự phòng là có chủ đích. Gửi một câu trả lời cuối cùng mới tốt hơn là mất văn bản, đưa phản hồi vào sai thread, hoặc ghi đè bản nháp bằng một tải trọng mà kênh không thể biểu diễn an toàn.

## Khắc phục sự cố

**Tôi chỉ thấy câu trả lời cuối cùng.**

Kiểm tra rằng `channels.<channel>.streaming.mode` được đặt thành `progress` cho tài khoản hoặc kênh đã xử lý thông báo. Một số đường dẫn nhóm hoặc trả lời trích dẫn có thể tắt xem trước bản nháp cho một lượt khi kênh không thể chỉnh sửa an toàn đúng thông báo.

**Tôi thấy nhãn nhưng không có dòng công cụ.**

Kiểm tra `streaming.progress.toolProgress`. Nếu là `false`, OpenClaw giữ hành vi một bản nháp duy nhất nhưng ẩn các dòng tiến trình công cụ và tác vụ.

**Tôi thấy một thông báo cuối cùng mới thay vì bản nháp được chỉnh sửa.**

Đó là cơ chế dự phòng an toàn. Điều này có thể xảy ra với phản hồi có phương tiện, câu trả lời dài, đích trả lời rõ ràng, bản nháp Telegram cũ, thiếu đích thread Slack, thông báo xem trước đã bị xóa, hoặc hoàn tất luồng gốc thất bại.

**Tôi vẫn thấy các thông báo tiến trình độc lập.**

Chế độ tiến trình chặn các thông báo tiến trình công cụ độc lập mặc định khi có bản nháp đang hoạt động. Nếu thông báo độc lập vẫn xuất hiện, hãy xác minh rằng lượt xử lý thực sự đang dùng chế độ tiến trình chứ không phải `streaming.mode: "off"` hoặc một đường dẫn kênh không thể tạo bản nháp cho thông báo đó.

**Teams hoạt động khác Discord hoặc Telegram.**

Microsoft Teams dùng một luồng gốc trong chat cá nhân thay vì cơ chế truyền tải xem trước gửi-và-chỉnh-sửa chung. Teams cũng xem `streaming.mode: "block"` là phát theo block của Teams vì nó không có cùng chế độ block xem trước nháp được Discord và Telegram dùng.

## Liên quan

- [Phát trực tuyến và chia đoạn](/vi/concepts/streaming)
- [Thông báo](/vi/concepts/messages)
- [Cấu hình kênh](/vi/gateway/config-channels)
- [Discord](/vi/channels/discord)
- [Matrix](/vi/channels/matrix)
- [Microsoft Teams](/vi/channels/msteams)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
