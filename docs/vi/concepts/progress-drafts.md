---
read_when:
    - Cấu hình các cập nhật tiến độ hiển thị cho các lượt trò chuyện kéo dài
    - Chọn giữa các chế độ truyền phát một phần, theo khối và tiến trình
    - Giải thích cách OpenClaw cập nhật một tin nhắn trên kênh trong khi công việc đang diễn ra
    - Khắc phục sự cố bản nháp tiến trình, thông báo tiến trình độc lập hoặc phương án dự phòng khi hoàn tất
summary: 'Bản nháp tiến độ: một thông báo đang xử lý hiển thị duy nhất được cập nhật trong khi tác nhân chạy'
title: Bản nháp tiến độ
x-i18n:
    generated_at: "2026-05-06T09:09:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Bản nháp tiến trình giúp các lượt agent chạy lâu có cảm giác đang hoạt động trong cuộc trò chuyện mà không biến cuộc hội thoại thành một chồng phản hồi trạng thái tạm thời.

Khi bản nháp tiến trình được bật, OpenClaw chỉ tạo một tin nhắn đang xử lý hiển thị sau khi lượt đó chứng minh rằng nó đang thực sự làm việc, cập nhật tin nhắn đó trong khi agent đọc, lập kế hoạch, gọi công cụ hoặc chờ phê duyệt, rồi chuyển bản nháp đó thành câu trả lời cuối cùng khi kênh có thể làm việc đó một cách an toàn.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Dùng bản nháp tiến trình khi bạn muốn có một tin nhắn trạng thái gọn gàng trong lúc thực hiện công việc dùng nhiều công cụ và câu trả lời cuối cùng khi lượt đó hoàn tất.

## Bắt đầu nhanh

Bật bản nháp tiến trình theo từng kênh bằng `streaming.mode: "progress"`:

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

Thông thường như vậy là đủ. OpenClaw sẽ chọn một nhãn một từ tự động, chờ đến khi công việc kéo dài ít nhất năm giây hoặc phát ra sự kiện công việc thứ hai, thêm các dòng tiến trình ngắn gọn khi có công việc hữu ích diễn ra và chặn các thông báo tiến trình độc lập trùng lặp cho lượt đó.

## Người dùng nhìn thấy gì

Bản nháp tiến trình có hai phần:

| Phần           | Mục đích                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| Nhãn          | Tiêu đề ngắn như `Thinking...` hoặc `Shelling...`.                       |
| Dòng tiến trình | Các cập nhật chạy ngắn gọn dùng cùng nhãn và biểu tượng công cụ như đầu ra chi tiết. |

Nhãn xuất hiện sau khi agent bắt đầu công việc có ý nghĩa và hoặc vẫn bận trong năm giây, hoặc phát ra sự kiện công việc thứ hai. Các phản hồi chỉ có văn bản thuần sẽ không hiển thị bản nháp tiến trình. Các dòng tiến trình chỉ được thêm khi agent phát ra cập nhật công việc hữu ích, ví dụ `🛠️ Exec`, `🔎 Web Search`, hoặc `✍️ Write: to /tmp/file`. Theo mặc định, chúng dùng cùng chế độ giải thích ngắn gọn như `/verbose`; đặt `agents.defaults.toolProgressDetail: "raw"` khi gỡ lỗi và bạn cũng muốn thêm lệnh/chi tiết thô.
Câu trả lời cuối cùng sẽ thay thế bản nháp khi có thể; nếu không, OpenClaw gửi câu trả lời cuối cùng theo cách thông thường và dọn dẹp hoặc ngừng cập nhật bản nháp tùy theo cơ chế truyền tải của kênh.

## Chọn chế độ

`channels.<channel>.streaming.mode` điều khiển hành vi đang xử lý hiển thị:

| Chế độ       | Phù hợp nhất cho                         | Nội dung xuất hiện trong cuộc trò chuyện                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Kênh yên tĩnh                   | Chỉ câu trả lời cuối cùng.                            |
| `partial`  | Theo dõi văn bản câu trả lời xuất hiện      | Một bản nháp được chỉnh sửa với văn bản câu trả lời mới nhất.     |
| `block`    | Các đoạn xem trước câu trả lời lớn hơn     | Một bản xem trước được cập nhật hoặc nối thêm theo các đoạn lớn hơn. |
| `progress` | Các lượt dùng nhiều công cụ hoặc chạy lâu | Một bản nháp trạng thái, sau đó là câu trả lời cuối cùng.          |

Chọn `progress` khi người dùng quan tâm đến “điều gì đang xảy ra” hơn là theo dõi văn bản câu trả lời được truyền từng token.

Chọn `partial` khi chính câu trả lời là tín hiệu tiến trình.

Chọn `block` khi bạn muốn cập nhật bản xem trước nháp theo các đoạn văn bản lớn hơn. Trên Discord và Telegram, `streaming.mode: "block"` vẫn là truyền trực tuyến bản xem trước, không phải phân phối block thông thường. Dùng `streaming.block.enabled` hoặc `blockStreaming` cũ khi bạn muốn phản hồi block thông thường.

## Cấu hình nhãn

Nhãn tiến trình nằm trong `channels.<channel>.streaming.progress`.

Nhãn mặc định là `auto`, chọn từ nhóm nhãn một từ kèm dấu ba chấm tích hợp của OpenClaw:

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

Dùng nhãn cố định:

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

## Điều khiển dòng tiến trình

Các dòng tiến trình được bật theo mặc định trong chế độ tiến trình. Chúng đến từ các sự kiện chạy thực: công cụ bắt đầu, cập nhật mục, kế hoạch tác vụ, phê duyệt, đầu ra lệnh, tóm tắt bản vá và hoạt động tương tự của agent.

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

`"explain"` là mặc định và giữ bản nháp ổn định bằng các nhãn ngắn gọn như `🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` thêm lệnh/chi tiết bên dưới khi có, hữu ích khi gỡ lỗi nhưng gây nhiễu hơn trong cuộc trò chuyện.

Ví dụ, cùng một lệnh sẽ hiển thị khác nhau tùy theo chế độ chi tiết:

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

Các dòng tiến trình được nén tự động để giảm việc bố cục lại bong bóng trò chuyện trong khi bản nháp được chỉnh sửa.

OpenClaw cắt ngắn các dòng tiến trình dài theo mặc định để các lần chỉnh sửa bản nháp lặp lại không xuống dòng khác nhau ở mỗi lần cập nhật. Phần tiền tố vẫn dễ đọc, còn các chi tiết dài như đường dẫn hoặc lệnh thô được rút gọn bằng dấu ba chấm.

Slack có thể hiển thị các dòng tiến trình dưới dạng trường Block Kit có cấu trúc thay vì một thân văn bản duy nhất:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

Hiển thị phong phú vẫn giữ cùng phương án dự phòng văn bản thuần để các kênh và ứng dụng khách không hỗ trợ dạng phong phú hơn vẫn có thể hiển thị văn bản tiến trình ngắn gọn.

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

Với `toolProgress: false`, OpenClaw vẫn chặn các tin nhắn tiến trình công cụ độc lập cũ hơn cho lượt đó. Kênh vẫn yên tĩnh về mặt hiển thị cho đến câu trả lời cuối cùng, ngoại trừ nhãn nếu có cấu hình.

## Hành vi kênh

Mỗi kênh dùng cơ chế truyền tải gọn nhất mà nó hỗ trợ:

| Kênh         | Cơ chế truyền tải tiến trình                     | Ghi chú                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Gửi một tin nhắn, rồi chỉnh sửa nó.        | Văn bản cuối cùng được chỉnh sửa tại chỗ khi vừa trong một tin nhắn xem trước an toàn.      |
| Matrix          | Gửi một sự kiện, rồi chỉnh sửa nó.          | Cấu hình truyền trực tuyến cấp tài khoản điều khiển bản nháp cấp tài khoản.         |
| Microsoft Teams | Luồng Teams gốc trong cuộc trò chuyện cá nhân. | `streaming.mode: "block"` ánh xạ tới phân phối block của Teams.               |
| Slack           | Luồng gốc hoặc bài đăng bản nháp có thể chỉnh sửa.  | Khả dụng của chuỗi ảnh hưởng đến việc có thể dùng truyền trực tuyến gốc hay không.     |
| Telegram        | Gửi một tin nhắn, rồi chỉnh sửa nó.        | Các bản nháp hiển thị cũ hơn có thể được thay thế để dấu thời gian cuối cùng vẫn hữu ích. |
| Mattermost      | Bài đăng bản nháp có thể chỉnh sửa.                   | Hoạt động công cụ được gộp vào cùng bài đăng kiểu bản nháp.               |

Các kênh không hỗ trợ chỉnh sửa an toàn thường quay về chỉ báo đang nhập hoặc chỉ gửi câu trả lời cuối cùng.

## Hoàn tất

Khi câu trả lời cuối cùng đã sẵn sàng, OpenClaw cố giữ cuộc trò chuyện gọn gàng:

- Nếu bản nháp có thể an toàn trở thành câu trả lời cuối cùng, OpenClaw chỉnh sửa nó tại chỗ.
- Nếu kênh dùng truyền trực tuyến tiến trình gốc, OpenClaw hoàn tất luồng đó khi cơ chế truyền tải gốc chấp nhận văn bản cuối cùng.
- Nếu câu trả lời cuối cùng có phương tiện, lời nhắc phê duyệt, đích trả lời rõ ràng, quá nhiều đoạn, hoặc lần chỉnh sửa/gửi thất bại, OpenClaw gửi câu trả lời cuối cùng qua đường phân phối kênh thông thường.

Đường dự phòng này là có chủ ý. Gửi một câu trả lời cuối cùng mới tốt hơn là mất văn bản, đưa phản hồi vào sai chuỗi, hoặc ghi đè bản nháp bằng một payload mà kênh không thể biểu diễn an toàn.

## Khắc phục sự cố

**Tôi chỉ thấy câu trả lời cuối cùng.**

Kiểm tra rằng `channels.<channel>.streaming.mode` được đặt thành `progress` cho tài khoản hoặc kênh đã xử lý tin nhắn. Một số đường dẫn nhóm hoặc trả lời trích dẫn có thể tắt bản xem trước nháp cho một lượt khi kênh không thể chỉnh sửa đúng tin nhắn một cách an toàn.

**Tôi thấy nhãn nhưng không thấy dòng công cụ.**

Kiểm tra `streaming.progress.toolProgress`. Nếu giá trị là `false`, OpenClaw giữ hành vi một bản nháp duy nhất nhưng ẩn các dòng tiến trình công cụ và tác vụ.

**Tôi thấy một tin nhắn cuối cùng mới thay vì bản nháp đã chỉnh sửa.**

Đó là phương án dự phòng an toàn. Điều này có thể xảy ra với phản hồi có phương tiện, câu trả lời dài, đích trả lời rõ ràng, bản nháp Telegram cũ, thiếu đích chuỗi Slack, tin nhắn xem trước đã bị xóa, hoặc hoàn tất luồng gốc thất bại.

**Tôi vẫn thấy các tin nhắn tiến trình độc lập.**

Chế độ tiến trình chặn các tin nhắn tiến trình công cụ độc lập mặc định khi có bản nháp đang hoạt động. Nếu các tin nhắn độc lập vẫn xuất hiện, hãy xác minh rằng lượt đó thực sự đang dùng chế độ tiến trình chứ không phải `streaming.mode: "off"` hoặc một đường dẫn kênh không thể tạo bản nháp cho tin nhắn đó.

**Teams hoạt động khác Discord hoặc Telegram.**

Microsoft Teams dùng luồng gốc trong cuộc trò chuyện cá nhân thay vì cơ chế truyền tải xem trước gửi-rồi-sửa chung. Teams cũng xem `streaming.mode: "block"` là phân phối block của Teams vì nó không có cùng chế độ block xem trước nháp mà Discord và Telegram dùng.

## Liên quan

- [Truyền trực tuyến và chia đoạn](/vi/concepts/streaming)
- [Tin nhắn](/vi/concepts/messages)
- [Cấu hình kênh](/vi/gateway/config-channels)
- [Discord](/vi/channels/discord)
- [Matrix](/vi/channels/matrix)
- [Microsoft Teams](/vi/channels/msteams)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
