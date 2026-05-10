---
read_when:
    - Cấu hình cập nhật tiến trình hiển thị cho các lượt trò chuyện kéo dài
    - Chọn giữa các chế độ truyền phát partial, block và progress
    - Giải thích cách OpenClaw cập nhật một tin nhắn kênh trong khi công việc đang diễn ra
    - Khắc phục sự cố về bản nháp tiến trình, thông báo tiến trình độc lập hoặc cơ chế dự phòng khi hoàn tất
summary: 'Bản nháp tiến trình: một thông báo công việc đang thực hiện hiển thị duy nhất, cập nhật trong khi tác tử chạy'
title: Bản nháp tiến độ
x-i18n:
    generated_at: "2026-05-10T19:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d84027a412a2c62ea9a5698d015c7aeb8a7f27d9db79112bb2c1c10f97ebd88
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Bản nháp tiến trình giúp các lượt agent chạy lâu có cảm giác đang hoạt động trong cuộc trò chuyện mà không biến
cuộc hội thoại thành một chồng phản hồi trạng thái tạm thời.

Khi bật bản nháp tiến trình, OpenClaw tạo một thông điệp công việc đang thực hiện
hiển thị duy nhất chỉ sau khi lượt đó chứng minh rằng nó đang làm việc thật, cập nhật thông điệp đó trong khi
agent đọc, lập kế hoạch, gọi công cụ hoặc chờ phê duyệt, rồi chuyển bản nháp đó
thành câu trả lời cuối cùng khi kênh có thể làm việc đó an toàn.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Dùng bản nháp tiến trình khi bạn muốn một thông điệp trạng thái gọn gàng trong lúc làm việc nhiều với công cụ
và câu trả lời cuối cùng khi lượt hoàn tất.

## Bắt đầu nhanh

Bật bản nháp tiến trình cho từng kênh bằng `streaming.mode: "progress"`:

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

Như vậy thường là đủ. OpenClaw sẽ chọn một nhãn một từ tự động, chờ
đến khi công việc kéo dài ít nhất năm giây hoặc phát ra sự kiện công việc thứ hai, thêm các dòng
tiến trình ngắn gọn khi có công việc hữu ích diễn ra, và chặn phần tán gẫu tiến trình độc lập
bị trùng lặp cho lượt đó.

## Người dùng thấy gì

Một bản nháp tiến trình có hai phần:

| Phần           | Mục đích                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| Nhãn          | Một dòng bắt đầu/trạng thái ngắn như `Thinking...` hoặc `Shelling...`.                   |
| Dòng tiến trình | Các cập nhật chạy ngắn gọn dùng cùng biểu tượng công cụ và bộ định dạng chi tiết như đầu ra dài dòng. |

Nhãn xuất hiện sau khi agent bắt đầu công việc có ý nghĩa và vẫn bận
trong năm giây hoặc phát ra sự kiện công việc thứ hai. Nó là một phần của danh sách dòng tiến trình
cuộn, nên trạng thái khởi đầu sẽ cuộn đi khi đã có đủ công việc cụ thể xuất hiện.
Các phản hồi chỉ có văn bản thuần không hiển thị bản nháp tiến trình. Các dòng tiến trình chỉ được thêm
khi agent phát ra cập nhật công việc hữu ích, ví dụ `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"`, hoặc `✍️ Write: to /tmp/file`.
Theo mặc định, chúng dùng cùng chế độ giải thích ngắn gọn như `/verbose`; đặt
`agents.defaults.toolProgressDetail: "raw"` khi gỡ lỗi và bạn cũng muốn thêm
lệnh/chi tiết thô.
Câu trả lời cuối cùng thay thế bản nháp khi có thể; nếu không
OpenClaw gửi câu trả lời cuối cùng như bình thường và dọn dẹp hoặc ngừng cập nhật
bản nháp theo phương thức truyền tải của kênh.

## Chọn chế độ

`channels.<channel>.streaming.mode` kiểm soát hành vi đang thực hiện hiển thị:

| Chế độ       | Phù hợp nhất cho                         | Nội dung xuất hiện trong trò chuyện                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Kênh yên lặng                   | Chỉ câu trả lời cuối cùng.                            |
| `partial`  | Theo dõi văn bản câu trả lời xuất hiện      | Một bản nháp được chỉnh sửa với văn bản câu trả lời mới nhất.     |
| `block`    | Các đoạn xem trước câu trả lời lớn hơn     | Một bản xem trước được cập nhật hoặc nối thêm theo các đoạn lớn hơn. |
| `progress` | Các lượt nặng về công cụ hoặc chạy lâu | Một bản nháp trạng thái, rồi câu trả lời cuối cùng.          |

Chọn `progress` khi người dùng quan tâm đến "đang xảy ra việc gì" hơn là xem
văn bản câu trả lời được phát trực tuyến từng token.

Chọn `partial` khi chính câu trả lời là tín hiệu tiến trình.

Chọn `block` khi bạn muốn cập nhật bản nháp xem trước theo các đoạn văn bản lớn hơn. Trên
Discord và Telegram, `streaming.mode: "block"` vẫn là phát trực tuyến bản xem trước, không phải
phân phối khối thông thường. Dùng `streaming.block.enabled` hoặc
`blockStreaming` cũ khi bạn muốn phản hồi khối thông thường.

## Cấu hình nhãn

Nhãn tiến trình nằm dưới `channels.<channel>.streaming.progress`.

Nhãn mặc định là `auto`, chọn từ nhóm nhãn tích hợp sẵn của OpenClaw
dạng một từ kèm dấu ba chấm:

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

## Kiểm soát các dòng tiến trình

Các dòng tiến trình được bật theo mặc định trong chế độ tiến trình. Chúng đến từ các sự kiện chạy thực:
công cụ bắt đầu, cập nhật mục, kế hoạch tác vụ, phê duyệt, đầu ra lệnh, tóm tắt bản vá,
và hoạt động agent tương tự.

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

`"explain"` là mặc định và giữ bản nháp ổn định với các nhãn ngắn gọn như
`🛠️ check JS syntax for /tmp/app.js`. `"raw"` thêm lệnh/chi tiết bên dưới
khi có, hữu ích khi gỡ lỗi nhưng nhiễu hơn trong trò chuyện.

Ví dụ, cùng một lệnh xuất hiện khác nhau tùy theo chế độ chi tiết:

| Chế độ      | Dòng tiến trình                                                  |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Các dòng tiến trình được nén tự động để giảm việc bong bóng trò chuyện đổi luồng trong khi bản nháp được chỉnh sửa.

OpenClaw cắt ngắn các dòng tiến trình dài theo mặc định để các lần chỉnh sửa bản nháp lặp lại không
xuống dòng khác nhau ở mỗi lần cập nhật. Phần tiền tố vẫn dễ đọc, và các chi tiết dài
như đường dẫn hoặc lệnh thô được rút ngắn bằng dấu ba chấm.

Slack có thể hiển thị các dòng tiến trình dưới dạng trường Block Kit có cấu trúc thay vì một
nội dung văn bản duy nhất:

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

Kết xuất phong phú giữ cùng phương án dự phòng văn bản thuần để các kênh và ứng dụng khách
không hỗ trợ dạng phong phú hơn vẫn có thể hiển thị văn bản tiến trình ngắn gọn.

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

Với `toolProgress: false`, OpenClaw vẫn chặn các thông điệp
tiến trình công cụ độc lập cũ hơn cho lượt đó. Kênh giữ trạng thái trực quan yên tĩnh cho đến
câu trả lời cuối cùng, ngoại trừ nhãn nếu có cấu hình.

## Hành vi kênh

Mỗi kênh dùng phương thức truyền tải gọn nhất mà nó hỗ trợ:

| Kênh         | Phương thức truyền tải tiến trình                     | Ghi chú                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Gửi một thông điệp, rồi chỉnh sửa nó.        | Văn bản cuối cùng được chỉnh sửa tại chỗ khi nó vừa trong một thông điệp xem trước an toàn.      |
| Matrix          | Gửi một sự kiện, rồi chỉnh sửa nó.          | Cấu hình phát trực tuyến cấp tài khoản kiểm soát bản nháp cấp tài khoản.         |
| Microsoft Teams | Luồng Teams gốc trong trò chuyện cá nhân. | `streaming.mode: "block"` ánh xạ sang phân phối khối của Teams.               |
| Slack           | Luồng gốc hoặc bài đăng bản nháp có thể chỉnh sửa.  | Tính khả dụng của luồng hội thoại ảnh hưởng đến việc có thể dùng phát trực tuyến gốc hay không.     |
| Telegram        | Gửi một thông điệp, rồi chỉnh sửa nó.        | Các bản nháp hiển thị cũ hơn có thể bị thay thế để dấu thời gian cuối cùng vẫn hữu ích. |
| Mattermost      | Bài đăng bản nháp có thể chỉnh sửa.                   | Hoạt động công cụ được gộp vào cùng bài đăng kiểu bản nháp.               |

Các kênh không có hỗ trợ chỉnh sửa an toàn thường quay về chỉ báo đang nhập hoặc
chỉ phân phối câu trả lời cuối cùng.

## Hoàn tất

Khi câu trả lời cuối cùng đã sẵn sàng, OpenClaw cố giữ cuộc trò chuyện sạch:

- Nếu bản nháp có thể an toàn trở thành câu trả lời cuối cùng, OpenClaw chỉnh sửa nó tại chỗ.
- Nếu kênh dùng phát trực tuyến tiến trình gốc, OpenClaw hoàn tất luồng đó
  khi phương thức truyền tải gốc chấp nhận văn bản cuối cùng.
- Nếu câu trả lời cuối cùng có phương tiện, lời nhắc phê duyệt, mục tiêu trả lời rõ ràng,
  quá nhiều đoạn, hoặc chỉnh sửa/gửi thất bại, OpenClaw gửi câu trả lời cuối cùng qua
  đường dẫn phân phối kênh thông thường.

Đường dẫn dự phòng là có chủ đích. Gửi một câu trả lời cuối cùng mới tốt hơn
việc mất văn bản, trả lời sai luồng, hoặc ghi đè bản nháp bằng tải trọng mà kênh
không thể biểu diễn an toàn.

## Khắc phục sự cố

**Tôi chỉ thấy câu trả lời cuối cùng.**

Kiểm tra rằng `channels.<channel>.streaming.mode` được đặt thành `progress` cho
tài khoản hoặc kênh đã xử lý thông điệp. Một số đường dẫn nhóm hoặc trích dẫn-trả lời có thể
tắt bản xem trước nháp cho một lượt khi kênh không thể chỉnh sửa an toàn đúng
thông điệp.

**Tôi thấy nhãn nhưng không có dòng công cụ.**

Kiểm tra `streaming.progress.toolProgress`. Nếu nó là `false`, OpenClaw giữ
hành vi một bản nháp duy nhất nhưng ẩn các dòng tiến trình công cụ và tác vụ.

**Tôi thấy một thông điệp cuối cùng mới thay vì một bản nháp đã chỉnh sửa.**

Đó là phương án dự phòng an toàn. Điều này có thể xảy ra với phản hồi có phương tiện, câu trả lời dài,
mục tiêu trả lời rõ ràng, bản nháp Telegram cũ, thiếu mục tiêu luồng Slack,
thông điệp xem trước đã bị xóa, hoặc hoàn tất luồng gốc thất bại.

**Tôi vẫn thấy các thông điệp tiến trình độc lập.**

Chế độ tiến trình chặn các thông điệp tiến trình công cụ độc lập mặc định khi có bản nháp
đang hoạt động. Nếu thông điệp độc lập vẫn xuất hiện, hãy xác minh rằng lượt đó thật sự
đang dùng chế độ tiến trình chứ không phải `streaming.mode: "off"` hoặc một đường dẫn kênh
không thể tạo bản nháp cho thông điệp đó.

**Teams hoạt động khác Discord hoặc Telegram.**

Microsoft Teams dùng luồng gốc trong trò chuyện cá nhân thay vì phương thức truyền tải xem trước
gửi-rồi-chỉnh-sửa chung. Teams cũng coi `streaming.mode: "block"` là
phân phối khối của Teams vì nó không có cùng chế độ khối xem trước nháp
mà Discord và Telegram dùng.

## Liên quan

- [Phát trực tuyến và chia đoạn](/vi/concepts/streaming)
- [Thông điệp](/vi/concepts/messages)
- [Cấu hình kênh](/vi/gateway/config-channels)
- [Discord](/vi/channels/discord)
- [Matrix](/vi/channels/matrix)
- [Microsoft Teams](/vi/channels/msteams)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
