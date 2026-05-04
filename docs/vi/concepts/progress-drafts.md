---
read_when:
    - Cấu hình các cập nhật tiến độ hiển thị cho các lượt trò chuyện chạy lâu
    - Chọn giữa các chế độ truyền luồng một phần, theo khối và tiến trình
    - Giải thích cách OpenClaw cập nhật một tin nhắn kênh trong khi công việc đang diễn ra
    - Khắc phục sự cố bản nháp tiến trình, thông báo tiến trình độc lập hoặc phương án dự phòng khi hoàn tất
summary: 'Bản nháp tiến độ: một thông báo công việc đang thực hiện hiển thị, được cập nhật trong khi một tác nhân đang chạy'
title: Bản nháp tiến độ
x-i18n:
    generated_at: "2026-05-04T07:04:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Bản nháp tiến trình giúp các lượt agent chạy lâu tạo cảm giác sống động trong chat mà không biến
cuộc trò chuyện thành một chồng phản hồi trạng thái tạm thời.

Khi bật bản nháp tiến trình, OpenClaw tạo một thông báo công việc đang thực hiện
hiển thị duy nhất chỉ sau khi lượt đó chứng minh rằng nó đang thực sự làm việc, cập nhật thông báo đó trong khi
agent đọc, lập kế hoạch, gọi công cụ hoặc chờ phê duyệt, rồi biến bản nháp đó
thành câu trả lời cuối cùng khi kênh có thể làm việc đó an toàn.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Dùng bản nháp tiến trình khi bạn muốn một thông báo trạng thái gọn gàng trong quá trình làm việc nhiều công cụ
và câu trả lời cuối cùng khi lượt đó hoàn tất.

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

Như vậy thường là đủ. OpenClaw sẽ chọn một nhãn tự động một từ, chờ
đến khi công việc kéo dài ít nhất năm giây hoặc phát ra sự kiện công việc thứ hai, thêm các dòng
tiến trình ngắn gọn khi có công việc hữu ích diễn ra, và chặn các lời nhắn tiến trình độc lập
trùng lặp cho lượt đó.

## Người dùng thấy gì

Một bản nháp tiến trình có hai phần:

| Phần           | Mục đích                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| Nhãn           | Một tiêu đề ngắn như `Thinking...` hoặc `Shelling...`.                       |
| Dòng tiến trình | Các cập nhật chạy ngắn gọn dùng cùng nhãn công cụ và biểu tượng như đầu ra chi tiết. |

Nhãn xuất hiện sau khi agent bắt đầu công việc có ý nghĩa và hoặc vẫn bận
trong năm giây hoặc phát ra sự kiện công việc thứ hai. Các phản hồi chỉ có văn bản thuần túy không
hiển thị bản nháp tiến trình. Dòng tiến trình chỉ được thêm khi agent phát ra các
cập nhật công việc hữu ích, ví dụ `🛠️ Exec`, `🔎 Web Search`, hoặc `✍️ Write: to /tmp/file`.
Theo mặc định, chúng dùng cùng chế độ giải thích ngắn gọn như `/verbose`; đặt
`agents.defaults.toolProgressDetail: "raw"` khi gỡ lỗi và bạn cũng muốn nối thêm
lệnh/chi tiết thô.
Câu trả lời cuối cùng thay thế bản nháp khi có thể; nếu không,
OpenClaw gửi câu trả lời cuối cùng theo cách thông thường và dọn dẹp hoặc dừng cập nhật
bản nháp theo cơ chế vận chuyển của kênh.

## Chọn một chế độ

`channels.<channel>.streaming.mode` kiểm soát hành vi đang thực hiện hiển thị:

| Chế độ     | Phù hợp nhất cho                  | Nội dung xuất hiện trong chat                       |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Các kênh yên tĩnh                | Chỉ câu trả lời cuối cùng.                         |
| `partial`  | Theo dõi văn bản câu trả lời xuất hiện | Một bản nháp được chỉnh sửa với văn bản câu trả lời mới nhất. |
| `block`    | Các đoạn xem trước câu trả lời lớn hơn | Một bản xem trước được cập nhật hoặc nối thêm theo các đoạn lớn hơn. |
| `progress` | Các lượt nhiều công cụ hoặc chạy lâu | Một bản nháp trạng thái, rồi câu trả lời cuối cùng. |

Chọn `progress` khi người dùng quan tâm đến "điều gì đang xảy ra" hơn là xem
văn bản câu trả lời truyền token theo từng token.

Chọn `partial` khi bản thân câu trả lời là tín hiệu tiến trình.

Chọn `block` khi bạn muốn các cập nhật xem trước bản nháp theo các đoạn văn bản lớn hơn. Trên
Discord và Telegram, `streaming.mode: "block"` vẫn là truyền xem trước, không phải
phân phối khối thông thường. Dùng `streaming.block.enabled` hoặc
`blockStreaming` cũ khi bạn muốn phản hồi khối thông thường.

## Cấu hình nhãn

Nhãn tiến trình nằm trong `channels.<channel>.streaming.progress`.

Nhãn mặc định là `auto`, chọn từ nhóm nhãn một từ có dấu ba chấm tích hợp sẵn của OpenClaw:

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

Dòng tiến trình được bật theo mặc định trong chế độ tiến trình. Chúng đến từ các sự kiện chạy
thực: khởi động công cụ, cập nhật mục, kế hoạch tác vụ, phê duyệt, đầu ra lệnh, tóm tắt
bản vá, và hoạt động agent tương tự.

OpenClaw dùng cùng trình định dạng cho bản nháp tiến trình và `/verbose`:

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
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` nối thêm
lệnh/chi tiết bên dưới khi có, hữu ích khi gỡ lỗi nhưng ồn hơn trong
chat.

Ví dụ, cùng một lệnh xuất hiện khác nhau tùy vào chế độ chi tiết:

| Chế độ    | Dòng tiến trình                                                      |
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

Dòng tiến trình được tự động nén để giảm việc bố cục lại bong bóng chat trong khi bản nháp được chỉnh sửa.

OpenClaw cắt ngắn các dòng tiến trình dài theo mặc định để các lần chỉnh sửa bản nháp lặp lại không
xuống dòng khác nhau ở mỗi lần cập nhật. Tiền tố vẫn dễ đọc, và các chi tiết dài
như đường dẫn hoặc lệnh thô được rút ngắn bằng dấu ba chấm.

Slack có thể hiển thị dòng tiến trình dưới dạng các trường Block Kit có cấu trúc thay vì một
thân văn bản duy nhất:

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

Kết xuất phong phú giữ cùng phương án dự phòng văn bản thuần túy để các kênh và client không
hỗ trợ hình dạng phong phú hơn vẫn có thể hiển thị văn bản tiến trình ngắn gọn.

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

Với `toolProgress: false`, OpenClaw vẫn chặn các thông báo
tiến trình công cụ độc lập cũ hơn cho lượt đó. Kênh vẫn yên tĩnh về mặt hiển thị cho đến
câu trả lời cuối cùng, ngoại trừ nhãn nếu được cấu hình.

## Hành vi kênh

Mỗi kênh dùng cơ chế vận chuyển sạch nhất mà nó hỗ trợ:

| Kênh            | Cơ chế vận chuyển tiến trình           | Ghi chú                                                               |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Gửi một thông báo, rồi chỉnh sửa nó.   | Văn bản cuối cùng được chỉnh sửa tại chỗ khi vừa một thông báo xem trước an toàn. |
| Matrix          | Gửi một sự kiện, rồi chỉnh sửa nó.     | Cấu hình streaming cấp tài khoản kiểm soát bản nháp cấp tài khoản.     |
| Microsoft Teams | Luồng Teams gốc trong chat cá nhân.    | `streaming.mode: "block"` ánh xạ tới phân phối khối của Teams.         |
| Slack           | Luồng gốc hoặc bài đăng bản nháp có thể chỉnh sửa. | Tính sẵn có của chuỗi ảnh hưởng đến việc có thể dùng streaming gốc hay không. |
| Telegram        | Gửi một thông báo, rồi chỉnh sửa nó.   | Bản nháp hiển thị cũ hơn có thể được thay thế để mốc thời gian cuối cùng vẫn hữu ích. |
| Mattermost      | Bài đăng bản nháp có thể chỉnh sửa.    | Hoạt động công cụ được gộp vào cùng bài đăng kiểu bản nháp.            |

Các kênh không có hỗ trợ chỉnh sửa an toàn thường quay về chỉ báo đang nhập hoặc
phân phối chỉ câu trả lời cuối cùng.

## Hoàn tất

Khi câu trả lời cuối cùng đã sẵn sàng, OpenClaw cố giữ chat gọn gàng:

- Nếu bản nháp có thể an toàn trở thành câu trả lời cuối cùng, OpenClaw chỉnh sửa nó tại chỗ.
- Nếu kênh dùng streaming tiến trình gốc, OpenClaw hoàn tất luồng đó
  khi cơ chế vận chuyển gốc chấp nhận văn bản cuối cùng.
- Nếu câu trả lời cuối cùng có media, lời nhắc phê duyệt, mục tiêu trả lời rõ ràng,
  quá nhiều đoạn, hoặc chỉnh sửa/gửi thất bại, OpenClaw gửi câu trả lời cuối cùng qua
  đường phân phối kênh thông thường.

Đường dự phòng là có chủ ý. Gửi một câu trả lời cuối cùng mới tốt hơn là
làm mất văn bản, đưa phản hồi vào sai chuỗi, hoặc ghi đè bản nháp bằng payload mà kênh
không thể biểu diễn an toàn.

## Khắc phục sự cố

**Tôi chỉ thấy câu trả lời cuối cùng.**

Kiểm tra rằng `channels.<channel>.streaming.mode` được đặt thành `progress` cho
tài khoản hoặc kênh đã xử lý thông báo. Một số đường nhóm hoặc trả lời trích dẫn có thể
tắt xem trước bản nháp cho một lượt khi kênh không thể chỉnh sửa đúng thông báo một cách an toàn.

**Tôi thấy nhãn nhưng không có dòng công cụ.**

Kiểm tra `streaming.progress.toolProgress`. Nếu nó là `false`, OpenClaw giữ
hành vi một bản nháp nhưng ẩn các dòng tiến trình công cụ và tác vụ.

**Tôi thấy một thông báo cuối cùng mới thay vì bản nháp đã chỉnh sửa.**

Đó là dự phòng an toàn. Điều này có thể xảy ra với phản hồi media, câu trả lời dài,
mục tiêu trả lời rõ ràng, bản nháp Telegram cũ, thiếu mục tiêu chuỗi Slack,
thông báo xem trước đã bị xóa, hoặc hoàn tất luồng gốc thất bại.

**Tôi vẫn thấy các thông báo tiến trình độc lập.**

Chế độ tiến trình chặn các thông báo tiến trình công cụ độc lập mặc định khi một bản nháp
đang hoạt động. Nếu thông báo độc lập vẫn xuất hiện, hãy xác minh rằng lượt đó thực sự
đang dùng chế độ tiến trình chứ không phải `streaming.mode: "off"` hoặc một đường kênh
không thể tạo bản nháp cho thông báo đó.

**Teams hoạt động khác Discord hoặc Telegram.**

Microsoft Teams dùng một luồng gốc trong chat cá nhân thay vì cơ chế vận chuyển xem trước
gửi-rồi-chỉnh-sửa chung. Teams cũng xem `streaming.mode: "block"` là
phân phối khối của Teams vì nó không có cùng chế độ khối xem trước bản nháp
được Discord và Telegram dùng.

## Liên quan

- [Streaming và chia đoạn](/vi/concepts/streaming)
- [Thông báo](/vi/concepts/messages)
- [Cấu hình kênh](/vi/gateway/config-channels)
- [Discord](/vi/channels/discord)
- [Matrix](/vi/channels/matrix)
- [Microsoft Teams](/vi/channels/msteams)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
