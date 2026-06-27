---
read_when:
    - Định cấu hình cập nhật tiến độ hiển thị cho các lượt trò chuyện chạy lâu
    - Chọn giữa các chế độ truyền phát một phần, khối và tiến trình
    - Giải thích cách OpenClaw cập nhật một tin nhắn kênh trong khi công việc đang diễn ra
    - Khắc phục sự cố bản nháp tiến trình, thông báo tiến trình độc lập hoặc phương án dự phòng khi hoàn tất
summary: 'Bản nháp tiến độ: một thông báo đang xử lý hiển thị, được cập nhật trong khi một agent đang chạy'
title: Bản nháp tiến độ
x-i18n:
    generated_at: "2026-06-27T17:25:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Bản nháp tiến trình làm cho các lượt agent chạy lâu có cảm giác đang hoạt động trong chat mà không biến cuộc trò chuyện thành một chồng phản hồi trạng thái tạm thời.

Khi bật bản nháp tiến trình, OpenClaw chỉ tạo một tin nhắn công việc đang xử lý hiển thị sau khi lượt đó chứng minh rằng nó đang thực sự làm việc, cập nhật tin nhắn đó trong khi agent đọc, lập kế hoạch, gọi công cụ hoặc chờ phê duyệt, rồi chuyển bản nháp đó thành câu trả lời cuối cùng khi kênh có thể làm việc đó một cách an toàn.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Dùng bản nháp tiến trình khi bạn muốn một tin nhắn trạng thái gọn gàng trong lúc làm việc nhiều bằng công cụ và câu trả lời cuối cùng khi lượt hoàn tất.

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

Thông thường như vậy là đủ. OpenClaw sẽ chọn một nhãn một từ tự động, chờ đến khi công việc kéo dài ít nhất năm giây hoặc phát ra sự kiện công việc thứ hai, thêm các dòng tiến trình ngắn gọn trong khi công việc hữu ích diễn ra, và chặn các thông báo tiến trình độc lập bị trùng lặp cho lượt đó.

## Người dùng thấy gì

Một bản nháp tiến trình có hai phần:

| Phần | Mục đích |
| -------------- | ------------------------------------------------------------------------------------- |
| Nhãn | Một dòng bắt đầu/trạng thái ngắn như `Working` hoặc `Shelling`. |
| Dòng tiến trình | Các cập nhật chạy ngắn gọn dùng cùng biểu tượng công cụ và bộ định dạng chi tiết như đầu ra chi tiết. |

Nhãn xuất hiện sau khi agent bắt đầu công việc có ý nghĩa và tiếp tục bận trong năm giây hoặc phát ra sự kiện công việc thứ hai. Nó là một phần của danh sách dòng tiến trình cuộn, nên trạng thái bắt đầu sẽ cuộn đi khi có đủ công việc cụ thể xuất hiện. Các phản hồi chỉ có văn bản thuần không hiển thị bản nháp tiến trình. Dòng tiến trình chỉ được thêm khi agent phát ra các cập nhật công việc hữu ích, ví dụ `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`, hoặc `✍️ Write: to /tmp/file`.
Theo mặc định, chúng dùng cùng chế độ giải thích ngắn gọn như `/verbose`; đặt `agents.defaults.toolProgressDetail: "raw"` khi gỡ lỗi và bạn cũng muốn nối thêm lệnh/chi tiết thô.
Câu trả lời cuối cùng sẽ thay thế bản nháp khi có thể; nếu không, OpenClaw gửi câu trả lời cuối cùng như bình thường và dọn dẹp hoặc ngừng cập nhật bản nháp theo cơ chế truyền tải của kênh.

## Chọn chế độ

`channels.<channel>.streaming.mode` kiểm soát hành vi đang xử lý hiển thị:

| Chế độ | Phù hợp nhất cho | Nội dung xuất hiện trong chat |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | Kênh yên tĩnh | Chỉ câu trả lời cuối cùng. |
| `partial` | Theo dõi văn bản câu trả lời xuất hiện | Một bản nháp được chỉnh sửa với văn bản câu trả lời mới nhất. |
| `block` | Các đoạn xem trước câu trả lời lớn hơn | Một bản xem trước được cập nhật hoặc nối thêm theo các đoạn lớn hơn. |
| `progress` | Lượt dùng nhiều công cụ hoặc chạy lâu | Một bản nháp trạng thái, rồi đến câu trả lời cuối cùng. |

Chọn `progress` khi người dùng quan tâm nhiều hơn đến "điều gì đang xảy ra" thay vì xem văn bản câu trả lời được truyền từng token.

Chọn `partial` khi chính câu trả lời là tín hiệu tiến trình.

Chọn `block` khi bạn muốn các cập nhật xem trước bản nháp theo các đoạn văn bản lớn hơn. Trên Discord và Telegram, `streaming.mode: "block"` vẫn là truyền bản xem trước, không phải phân phối khối thông thường. Dùng `streaming.block.enabled` hoặc `blockStreaming` cũ khi bạn muốn phản hồi khối thông thường.

## Cấu hình nhãn

Nhãn tiến trình nằm dưới `channels.<channel>.streaming.progress`.

Nhãn mặc định là `auto`, chọn từ nhóm nhãn một từ tích hợp sẵn của OpenClaw:

```text
Working
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

Dòng tiến trình được bật mặc định trong chế độ tiến trình. Chúng đến từ các sự kiện chạy thật: bắt đầu công cụ, cập nhật mục, kế hoạch tác vụ, phê duyệt, đầu ra lệnh, tóm tắt bản vá và hoạt động agent tương tự.

Công cụ cũng có thể phát tiến trình có kiểu trong khi một lần gọi công cụ vẫn đang chạy. Đây là cách một lượt tìm nạp hoặc tìm kiếm chậm có thể cập nhật bản nháp hiển thị trước khi công cụ trả về kết quả cuối cùng. Cập nhật tiến trình là một kết quả công cụ một phần với nội dung model rỗng và siêu dữ liệu kênh công khai rõ ràng:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw chỉ kết xuất `progress.text` trong giao diện tiến trình của kênh. Kết quả công cụ thông thường vẫn đến sau dưới dạng `content` và `details`, và là phần duy nhất được trả về cho model.

Khi thêm tiến trình vào một công cụ, hãy dùng thông báo ngắn, chung chung và trì hoãn nó cho đến khi thao tác đã chờ đủ lâu để trở nên hữu ích:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Mẫu này nghĩa là các lần gọi nhanh không hiển thị dòng tiến trình, các lần gọi dài hiển thị một dòng khi chúng vẫn đang chờ, và các lần gọi bị hủy sẽ xóa bộ hẹn giờ trước khi tiến trình cũ có thể xuất hiện. Văn bản tiến trình là một kênh phụ giao diện công khai, nên không được bao gồm bí mật, đối số thô, nội dung đã tìm nạp, đầu ra lệnh hoặc văn bản trang.

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

`"explain"` là mặc định và giữ bản nháp ổn định với các nhãn súc tích như `🛠️ check JS syntax for /tmp/app.js`. `"raw"` nối thêm lệnh/chi tiết bên dưới khi có, hữu ích khi gỡ lỗi nhưng gây nhiều nhiễu hơn trong chat.

Ví dụ, cùng một lệnh hiển thị khác nhau tùy chế độ chi tiết:

| Chế độ | Dòng tiến trình |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js` |
| `raw` | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Dòng tiến trình được nén tự động để giảm việc bố cục bong bóng chat thay đổi trong khi bản nháp được chỉnh sửa.

OpenClaw cắt ngắn các dòng tiến trình dài theo mặc định để các lần chỉnh sửa bản nháp lặp lại không xuống dòng khác nhau ở mỗi lần cập nhật. Ngân sách mặc định cho mỗi dòng là 120 ký tự. Văn xuôi được cắt ở ranh giới từ, còn các chi tiết dài như đường dẫn hoặc lệnh thô được rút ngắn bằng dấu ba chấm ở giữa để phần hậu tố vẫn hiển thị.

Điều chỉnh ngân sách cho mỗi dòng:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack có thể kết xuất các dòng tiến trình dưới dạng trường Block Kit có cấu trúc thay vì một thân văn bản duy nhất:

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

Kết xuất phong phú giữ cùng dự phòng văn bản thuần để các kênh và ứng dụng khách không hỗ trợ hình dạng phong phú hơn vẫn có thể hiển thị văn bản tiến trình ngắn gọn.

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

Mỗi kênh dùng cơ chế truyền tải sạch nhất mà nó hỗ trợ:

| Kênh | Cơ chế truyền tiến trình | Ghi chú |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord | Gửi một tin nhắn, rồi chỉnh sửa nó. | Văn bản cuối cùng được chỉnh sửa tại chỗ khi vừa trong một tin nhắn xem trước an toàn. |
| Matrix | Gửi một sự kiện, rồi chỉnh sửa nó. | Cấu hình truyền ở cấp tài khoản kiểm soát bản nháp cấp tài khoản. |
| Microsoft Teams | Luồng Teams gốc trong chat cá nhân. | `streaming.mode: "block"` ánh xạ sang phân phối khối của Teams. |
| Slack | Luồng gốc hoặc bài đăng bản nháp có thể chỉnh sửa. | Tính sẵn có của thread ảnh hưởng đến việc có thể dùng luồng gốc hay không. |
| Telegram | Gửi một tin nhắn, rồi chỉnh sửa nó. | Các bản nháp hiển thị cũ hơn có thể được thay thế để dấu thời gian cuối cùng vẫn hữu ích. |
| Mattermost | Bài đăng bản nháp có thể chỉnh sửa. | Hoạt động công cụ được gộp vào cùng bài đăng kiểu bản nháp. |

Các kênh không hỗ trợ chỉnh sửa an toàn thường dự phòng về chỉ báo đang nhập hoặc phân phối chỉ câu trả lời cuối cùng.

## Hoàn tất

Khi câu trả lời cuối cùng sẵn sàng, OpenClaw cố giữ chat sạch sẽ:

- Nếu bản nháp có thể an toàn trở thành câu trả lời cuối cùng, OpenClaw chỉnh sửa nó tại chỗ.
- Nếu kênh dùng truyền tiến trình gốc, OpenClaw hoàn tất luồng đó khi cơ chế truyền tải gốc chấp nhận văn bản cuối cùng.
- Nếu câu trả lời cuối cùng có media, lời nhắc phê duyệt, mục tiêu trả lời rõ ràng, quá nhiều đoạn, hoặc chỉnh sửa/gửi thất bại, OpenClaw gửi câu trả lời cuối cùng qua đường phân phối kênh thông thường.

Đường dự phòng là có chủ đích. Gửi một câu trả lời cuối cùng mới tốt hơn là làm mất văn bản, ghép sai thread của phản hồi, hoặc ghi đè bản nháp bằng một payload mà kênh không thể biểu diễn an toàn.

## Khắc phục sự cố

**Tôi chỉ thấy câu trả lời cuối cùng.**

Kiểm tra rằng `channels.<channel>.streaming.mode` được đặt thành `progress` cho tài khoản hoặc kênh đã xử lý tin nhắn. Một số đường dẫn nhóm hoặc trả lời trích dẫn có thể tắt xem trước bản nháp cho một lượt khi kênh không thể chỉnh sửa đúng tin nhắn một cách an toàn.

**Tôi thấy nhãn nhưng không thấy dòng công cụ.**

Kiểm tra `streaming.progress.toolProgress`. Nếu nó là `false`, OpenClaw giữ hành vi một bản nháp duy nhất nhưng ẩn các dòng tiến trình công cụ và tác vụ.

**Tôi thấy một tin nhắn cuối cùng mới thay vì một bản nháp đã chỉnh sửa.**

Đó là dự phòng an toàn. Điều này có thể xảy ra với phản hồi media, câu trả lời dài, mục tiêu trả lời rõ ràng, bản nháp Telegram cũ, thiếu mục tiêu thread Slack, tin nhắn xem trước đã bị xóa, hoặc hoàn tất luồng gốc thất bại.

**Tôi vẫn thấy các tin nhắn tiến trình độc lập.**

Chế độ tiến trình chặn các tin nhắn tiến trình công cụ độc lập mặc định khi một bản nháp đang hoạt động. Nếu tin nhắn độc lập vẫn xuất hiện, hãy xác minh rằng lượt đó thực sự đang dùng chế độ tiến trình chứ không phải `streaming.mode: "off"` hoặc một đường dẫn kênh không thể tạo bản nháp cho tin nhắn đó.

**Teams hoạt động khác với Discord hoặc Telegram.**

Microsoft Teams sử dụng một luồng gốc trong các cuộc trò chuyện cá nhân thay vì cơ chế truyền tải xem trước gửi-và-chỉnh sửa chung. Teams cũng coi `streaming.mode: "block"` là phương thức gửi khối của Teams vì nó không có cùng chế độ khối xem trước bản nháp được Discord và Telegram sử dụng.

## Liên quan

- [Truyền phát và chia nhỏ](/vi/concepts/streaming)
- [Tin nhắn](/vi/concepts/messages)
- [Cấu hình kênh](/vi/gateway/config-channels)
- [Discord](/vi/channels/discord)
- [Matrix](/vi/channels/matrix)
- [Microsoft Teams](/vi/channels/msteams)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
