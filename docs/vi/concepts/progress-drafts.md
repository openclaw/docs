---
read_when:
    - Cấu hình các cập nhật tiến độ hiển thị cho những lượt trò chuyện kéo dài
    - Lựa chọn giữa các chế độ truyền phát từng phần, theo khối và tiến trình
    - Giải thích cách OpenClaw cập nhật một tin nhắn kênh trong khi công việc đang được xử lý
    - Bản nháp tiến độ khắc phục sự cố, thông báo tiến độ độc lập hoặc phương án dự phòng khi hoàn tất
summary: 'Bản nháp tiến độ: một thông báo công việc đang thực hiện hiển thị và được cập nhật trong khi tác tử chạy'
title: Bản nháp tiến độ
x-i18n:
    generated_at: "2026-07-16T14:21:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Bản nháp tiến trình biến một tin nhắn trong kênh thành dòng trạng thái trực tiếp khi
tác nhân làm việc, thay vì một loạt phản hồi tạm thời kiểu "vẫn đang làm việc". Đặt
`channels.<channel>.streaming.mode: "progress"` và OpenClaw sẽ tạo
tin nhắn sau khi công việc thực sự bắt đầu, chỉnh sửa tin nhắn khi tác nhân đọc, lập kế hoạch, gọi
công cụ hoặc chờ phê duyệt, rồi biến tin nhắn đó thành câu trả lời cuối cùng.

```text
Đang làm việc...
📖 từ docs/concepts/progress-drafts.md
🔎 Tìm kiếm trên web: cho "discord edit message"
🛠️ Bash: chạy kiểm thử
```

<Note>
  Discord đã mặc định dùng `streaming.mode: "progress"` khi
  `channels.discord.streaming` chưa được đặt, vì vậy bản nháp tiến trình
  xuất hiện tại đó mà không cần cấu hình. Mọi kênh khác mặc định dùng `partial`
  hoặc `off`; xem [Truyền phát và chia đoạn](/vi/concepts/streaming#channel-mapping)
  để biết bảng giá trị mặc định đầy đủ cho từng kênh.
</Note>

## Bắt đầu nhanh

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

Các giá trị mặc định từ đây: độ trễ bắt đầu là 5 giây, các dòng tiến trình ngắn gọn khi
công việc hữu ích diễn ra, và ẩn các tin nhắn tiến trình độc lập kiểu cũ
cho lượt đó. Bản nháp dòng công cụ thô sử dụng
nhãn một từ tự động; tiêu đề trạng thái bỏ qua tiêu đề thừa đó
trừ khi bạn cấu hình rõ ràng.

Trang này trình bày trải nghiệm bản nháp tiến trình và các tùy chọn cấu hình. Để biết
ma trận đầy đủ về chế độ truyền phát, ghi chú thời gian chạy theo từng kênh và cách di chuyển
khóa cũ, hãy xem [Truyền phát và chia đoạn](/vi/concepts/streaming).

## Những gì người dùng thấy

| Phần            | Mục đích                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| Tiêu đề trạng thái | Trên Discord và Telegram, phần mở đầu của mô hình; Discord thêm nội dung đệm tiện ích.       |
| Nhãn           | Dòng khởi đầu/trạng thái tùy chọn, chẳng hạn như `Working`.                                   |
| Dòng tiến trình  | Bản cập nhật lượt chạy ngắn gọn sử dụng cùng biểu tượng công cụ và bộ định dạng chi tiết như `/verbose`. |

Đối với tiến trình công cụ thô, nhãn xuất hiện sau khi tác nhân bắt đầu công việc có ý nghĩa
và tiếp tục bận trong khoảng thời gian trễ ban đầu.
Nhãn nằm ở đầu danh sách dòng tiến trình cuộn, vì vậy sẽ cuộn khỏi màn hình khi
đủ số dòng công việc cụ thể xuất hiện. Tiêu đề trạng thái chỉ hiển thị trạng thái
bằng ngôn ngữ thông thường của tác nhân, trừ khi nhãn được cấu hình rõ ràng. Các
phản hồi chỉ có văn bản thuần túy không bao giờ hiển thị bản nháp tiến trình; một dòng chỉ xuất hiện cho
các bản cập nhật công việc thực tế, ví dụ `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`,
hoặc `✍️ Write: to /tmp/file`.

Câu trả lời cuối cùng thay thế bản nháp tại chỗ khi kênh có thể thực hiện việc đó
một cách an toàn; nếu không, OpenClaw gửi câu trả lời cuối cùng qua cơ chế gửi thông thường và
dọn dẹp hoặc ngừng cập nhật bản nháp (xem [Hoàn tất](#finalization)).

## Chọn chế độ

`channels.<channel>.streaming.mode` kiểm soát hành vi hiển thị trong khi đang xử lý:

| Chế độ       | Phù hợp nhất với                         | Nội dung xuất hiện trong cuộc trò chuyện                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Các kênh yên tĩnh                   | Chỉ câu trả lời cuối cùng.                            |
| `partial`  | Theo dõi văn bản câu trả lời xuất hiện      | Một bản nháp được chỉnh sửa bằng văn bản câu trả lời mới nhất.     |
| `block`    | Các đoạn xem trước câu trả lời lớn hơn     | Một bản xem trước được cập nhật hoặc nối thêm theo các đoạn lớn hơn. |
| `progress` | Các lượt dùng nhiều công cụ hoặc chạy lâu | Một bản nháp trạng thái, sau đó là câu trả lời cuối cùng.          |

Chọn `progress` khi người dùng quan tâm đến "đang có chuyện gì xảy ra" hơn là theo dõi
văn bản câu trả lời được truyền từng token; chọn `partial` khi chính văn bản câu trả lời là
tín hiệu tiến trình; chọn `block` cho các đoạn xem trước lớn hơn. Trên Discord và
Telegram, `streaming.mode: "block"` vẫn là truyền phát bản xem trước, không phải
cơ chế gửi phản hồi theo khối thông thường — hãy dùng `streaming.block.enabled` cho trường hợp đó.

## Cấu hình nhãn

Nhãn tiến trình nằm trong `channels.<channel>.streaming.progress`. Nhãn
dòng công cụ thô mặc định là `"auto"`, sử dụng nhãn tích hợp thuần túy `Working`.
Tiêu đề trạng thái ẩn nhãn ngầm định đó; hãy đặt
`label: "auto"` rõ ràng nếu bạn cũng muốn có nhãn phía trên:

```text
Đang làm việc
```

Sử dụng nhãn cố định:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Đang điều tra",
        },
      },
    },
  },
}
```

Sử dụng nhóm nhãn riêng (vẫn được chọn ngẫu nhiên/theo hạt giống khi `label: "auto"`):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Đang kiểm tra", "Đang đọc", "Đang kiểm thử", "Đang hoàn tất"],
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

Các dòng tiến trình đến từ sự kiện lượt chạy thực tế: lúc công cụ bắt đầu, cập nhật mục, kế hoạch
tác vụ, phê duyệt, đầu ra lệnh, bản tóm tắt bản vá và hoạt động tương tự của tác nhân.
Chúng được bật theo mặc định (`progress.toolProgress`, mặc định `true`).

Các công cụ cũng có thể phát tiến trình có kiểu trong khi một lệnh gọi duy nhất vẫn đang chạy. Đây
là cách một thao tác tìm nạp hoặc tìm kiếm chậm cập nhật bản nháp hiển thị trước khi công cụ
trả về kết quả cuối cùng. Bản cập nhật tiến trình là kết quả công cụ một phần với
nội dung mô hình trống và siêu dữ liệu kênh công khai rõ ràng:

```json
{
  "content": [],
  "progress": {
    "text": "Đang tìm nạp nội dung trang...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw chỉ hiển thị `progress.text` trong giao diện người dùng tiến trình của kênh. Kết quả
công cụ thông thường vẫn đến sau dưới dạng `content`/`details` và là phần duy nhất
được trả về cho mô hình.

Khi thêm tiến trình vào một công cụ, hãy phát một thông báo ngắn, chung chung và trì hoãn thông báo đó
cho đến khi thao tác đã chờ đủ lâu để thông báo trở nên hữu ích. `web_fetch`
thực hiện chính xác việc này với độ trễ 5 giây:

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

Các lệnh gọi nhanh không hiển thị dòng tiến trình; các lệnh gọi lâu hiển thị một dòng trong khi vẫn đang chờ;
các lệnh gọi bị hủy sẽ xóa bộ hẹn giờ trước khi tiến trình cũ có thể xuất hiện. Văn bản tiến trình
là kênh phụ công khai của giao diện người dùng, vì vậy tuyệt đối không được chứa thông tin bí mật, đối số thô,
nội dung đã tìm nạp, đầu ra lệnh hoặc văn bản trang.

### Chế độ chi tiết

OpenClaw sử dụng cùng một bộ định dạng cho bản nháp tiến trình và `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` là giá trị mặc định và giữ cho bản nháp ổn định bằng các nhãn ngắn gọn.
`"raw"` nối thêm lệnh cơ sở khi có, hữu ích trong khi
gỡ lỗi nhưng gây nhiễu hơn trong cuộc trò chuyện. Ví dụ, một lệnh gọi `node --check /tmp/app.js`
được hiển thị khác nhau tùy theo chế độ:

| Chế độ      | Dòng tiến trình                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Văn bản lệnh/exec

`streaming.progress.commandText` (mặc định `"raw"`) kiểm soát lượng chi tiết lệnh
hiển thị bên cạnh các dòng tiến trình exec/bash, độc lập với chế độ chi tiết
ở trên. Đặt thành `"status"` để giữ dòng tiến trình công cụ hiển thị trong khi ẩn
hoàn toàn văn bản lệnh:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Luồng bình luận

`streaming.progress.commentary` (mặc định `false`) xen kẽ phần
tường thuật bình luận/mở đầu trước công cụ của mô hình (💬, ví dụ "Tôi sẽ kiểm tra... rồi
...") với các dòng công cụ trong bản nháp. Xem
[Truyền phát và chia đoạn](/vi/concepts/streaming#commentary-progress-lane) để biết
dạng cấu hình dùng chung giữa các kênh.

Khi luồng bình luận được bật, phần mở đầu chỉ hiển thị dưới dạng các dòng 💬 xen kẽ đó;
tiêu đề trạng thái bên dưới không xuất hiện để luồng giữ nguyên
dạng đã được tài liệu hóa.

### Tiêu đề trạng thái

Trên Discord và Telegram ở chế độ tiến trình, phần mở đầu trước công cụ có kiểu của mô hình
trở thành tiêu đề trạng thái của bản nháp khi có sẵn. Các kênh
ở chế độ tiến trình khác giữ nguyên hành vi trạng thái hiện tại. Tiêu đề được
bật theo mặc định và không bỏ qua cổng hoạt động thông thường đối với các lượt ngắn;
việc bật `streaming.progress.commentary` sẽ chuyển phần mở đầu sang
luồng bình luận xen kẽ.

Trên Discord, khi một mô hình tiện ích được phân giải cho tác nhân — một
[`utilityModel`](/vi/gateway/config-agents#utilitymodel) rõ ràng, hoặc giá trị mặc định
mô hình nhỏ do nhà cung cấp chính khai báo (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — mô hình đó cung cấp một đoạn đệm ngắn bằng ngôn ngữ thông thường
khi mô hình không phát phần mở đầu hoặc đã im lặng khoảng 20 giây
(tiêu đề của Telegram hiện chỉ dùng phần mở đầu):

```text
Đang cập nhật mô hình mặc định trong cấu hình của bạn, sau đó khởi động lại Gateway để áp dụng
thay đổi. Một lệnh gọi liệt kê tác nhân đã thất bại và đang được thử lại.
```

Tường thuật tiện ích được bật theo mặc định (`streaming.progress.narration`, mặc định
`true`) và không bao giờ dự phòng về mô hình chính: nó chỉ chạy với
`utilityModel` rõ ràng hoặc giá trị mặc định do nhà cung cấp khai báo cho nhà cung cấp
chính của tác nhân. Đặt `utilityModel: ""` để tắt hoàn toàn định tuyến tiện ích. Các dòng công cụ
tiếp tục tích lũy bên dưới và xuất hiện trở lại nếu cả hai nguồn trạng thái dừng. Các lần chỉnh sửa
bản nháp vẫn chờ cổng hoạt động thông thường và một thay đổi văn bản
thực tế, giúp tránh nhấp nháy ở các lượt nhanh và giảm số lần chỉnh sửa trong các kênh
bận rộn. Đặt `narration: false` để chỉ tắt đoạn đệm của mô hình tiện ích; tiêu đề
phần mở đầu của mô hình vẫn được bật:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

Đầu vào tường thuật được giới hạn và biên tập: mô hình tiện ích nhận
văn bản yêu cầu đầu vào cùng các bản tóm tắt công cụ ngắn gọn, đã biên tập giống như bản nháp
sẽ hiển thị — tuyệt đối không nhận đầu ra lệnh thô hoặc kết quả công cụ. Với
`commandText: "status"`, đầu vào tường thuật cũng bỏ qua văn bản lệnh exec/bash,
khớp với nội dung bản nháp hiển thị.

### Giới hạn dòng

Giới hạn số dòng được giữ hiển thị (mặc định 8):

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

Các dòng tiến trình được tự động thu gọn để giảm việc bố trí lại bong bóng trò chuyện trong khi
bản nháp được chỉnh sửa, và OpenClaw cắt ngắn các dòng dài để các lần chỉnh sửa bản nháp lặp lại
không xuống dòng khác nhau ở mỗi lần cập nhật. Ngân sách mặc định cho mỗi dòng là 120
ký tự; văn xuôi được cắt tại ranh giới từ, còn các chi tiết dài như đường dẫn hoặc
lệnh thô được rút ngắn bằng dấu chấm lửng ở giữa để phần hậu tố vẫn hiển thị.

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

### Hiển thị phong phú (Slack)

Slack có thể hiển thị các dòng tiến trình dưới dạng trường Block Kit có cấu trúc thay vì
văn bản thuần túy:

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

Chế độ hiển thị phong phú luôn gửi cùng nội dung văn bản thuần túy bên cạnh các trường Block Kit,
vì vậy các máy khách không thể hiển thị dạng phong phú hơn vẫn hiển thị văn bản
tiến trình ngắn gọn.

### Ẩn các dòng công cụ/tác vụ

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

Với `toolProgress: false`, OpenClaw vẫn ẩn các thông báo tiến trình công cụ độc lập kiểu cũ
cho lượt đó — kênh vẫn yên tĩnh về mặt hiển thị cho đến khi có câu trả lời cuối cùng,
ngoại trừ nhãn nếu đã được cấu hình.

## Hành vi của kênh

| Kênh            | Cách truyền tiến trình                 | Ghi chú                                                                                                                                                   |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Gửi một tin nhắn, rồi chỉnh sửa.       | Mặc định dùng chế độ `progress`; câu trả lời cuối cùng kèm một biên nhận hoạt động `-#` và bản nháp trạng thái bị xóa sau khi câu trả lời được gửi. |
| Matrix          | Gửi một sự kiện, rồi chỉnh sửa.        | Cấu hình phát trực tiếp ở cấp tài khoản kiểm soát các bản nháp ở cấp tài khoản.                                                                           |
| Microsoft Teams | Luồng Teams gốc trong cuộc trò chuyện cá nhân. | `streaming.mode: "block"` được ánh xạ sang hình thức gửi theo khối của Teams.                                                                            |
| Slack           | Luồng gốc hoặc bài đăng nháp có thể chỉnh sửa. | Cần một đích luồng trả lời; các tin nhắn trực tiếp cấp cao nhất không có đích vẫn nhận được bài đăng xem trước bản nháp và các bản chỉnh sửa.          |
| Telegram        | Gửi một tin nhắn, rồi chỉnh sửa.       | Nếu có tin nhắn xuất hiện giữa bản nháp tiến trình và câu trả lời, bản nháp sẽ được đăng lại bên dưới tin nhắn đó (đăng mới rồi xóa cũ) thay vì làm ứng dụng khách nhảy vị trí cuộn. |
| Mattermost      | Bài đăng nháp có thể chỉnh sửa.        | Chế độ `block` luân phiên giữa văn bản đã hoàn tất và các bài đăng hoạt động công cụ; các chế độ khác gộp hoạt động công cụ vào cùng bài đăng kiểu bản nháp. |

Các kênh không hỗ trợ chỉnh sửa an toàn sẽ quay về dùng chỉ báo đang nhập hoặc
chỉ gửi kết quả cuối cùng. Xem [Phát trực tiếp và chia đoạn](/vi/concepts/streaming) để biết
phân tích đầy đủ về hành vi thời gian chạy theo từng kênh.

## Hoàn tất

Khi câu trả lời cuối cùng đã sẵn sàng, OpenClaw cố gắng giữ cuộc trò chuyện gọn gàng:

- Ở chế độ `progress` trên Discord, câu trả lời cuối cùng được gửi dưới dạng tin nhắn mới
  kèm một biên nhận hoạt động `-#` nhỏ ở cuối (ví dụ:
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), và bản nháp trạng thái sẽ
  bị xóa sau khi câu trả lời đó được gửi. Các kênh bận rộn không để lại nhật ký công cụ
  mồ côi phía trên câu trả lời; khi kết thúc bằng lỗi, bản nháp được giữ lại làm bản ghi hiển thị
  của lượt thất bại.
- Nếu bản nháp có thể trở thành câu trả lời cuối cùng một cách an toàn (các chế độ `partial`/`block`),
  OpenClaw sẽ chỉnh sửa trực tiếp bản nháp đó.
- Nếu kênh sử dụng luồng tiến trình gốc, OpenClaw sẽ hoàn tất
  luồng đó khi phương thức truyền gốc chấp nhận văn bản cuối cùng.
- Trong các trường hợp khác (nội dung đa phương tiện, lời nhắc phê duyệt, đích trả lời tường minh, quá nhiều
  đoạn hoặc chỉnh sửa/gửi thất bại), OpenClaw gửi câu trả lời cuối cùng qua
  đường dẫn gửi thông thường của kênh thay vì ghi đè lên bản nháp.

Việc chuyển sang phương án dự phòng là có chủ đích: gửi một câu trả lời cuối cùng mới tốt hơn việc làm mất văn bản,
đặt câu trả lời sai luồng hoặc ghi đè bản nháp bằng một tải dữ liệu mà kênh
không thể biểu diễn an toàn.

## Khắc phục sự cố

**Tôi chỉ thấy câu trả lời cuối cùng.**

Kiểm tra xem `channels.<channel>.streaming.mode` có phải là `progress` đối với tài khoản
hoặc kênh đã xử lý tin nhắn hay không. Một số đường dẫn nhóm hoặc trả lời trích dẫn sẽ tắt
phần xem trước bản nháp cho một lượt khi kênh không thể chỉnh sửa đúng
tin nhắn một cách an toàn.

**Tôi thấy nhãn nhưng không thấy các dòng công cụ.**

Kiểm tra `streaming.progress.toolProgress`. Nếu giá trị là `false`, OpenClaw vẫn giữ
hành vi dùng một bản nháp nhưng ẩn các dòng tiến trình của công cụ và tác vụ.

**Tôi thấy một tin nhắn cuối cùng mới thay vì bản nháp đã được chỉnh sửa.**

Đó là phương án dự phòng an toàn được mô tả trong phần [Hoàn tất](#finalization). Điều này có thể
xảy ra với câu trả lời có nội dung đa phương tiện, câu trả lời dài, đích trả lời tường minh, bản nháp Telegram
cũ, thiếu đích luồng Slack, tin nhắn xem trước đã bị xóa hoặc không thể
hoàn tất luồng gốc.

**Tôi vẫn thấy các thông báo tiến trình độc lập.**

Chế độ tiến trình ẩn các thông báo tiến trình công cụ độc lập mặc định bất cứ khi nào
có bản nháp đang hoạt động. Nếu các thông báo độc lập vẫn xuất hiện, hãy xác nhận lượt đó
thực sự đang sử dụng chế độ `progress`, chứ không phải `streaming.mode: "off"` hoặc một đường dẫn
kênh không thể tạo bản nháp cho tin nhắn đó.

**Teams hoạt động khác với Discord hoặc Telegram.**

Microsoft Teams sử dụng luồng gốc trong các cuộc trò chuyện cá nhân thay vì phương thức truyền xem trước
gửi rồi chỉnh sửa dùng chung, đồng thời ánh xạ `streaming.mode: "block"` sang hình thức
gửi theo khối của Teams vì nền tảng này không có chế độ khối xem trước bản nháp như Discord và
Telegram.

## Liên quan

- [Phát trực tiếp và chia đoạn](/vi/concepts/streaming)
- [Tin nhắn](/vi/concepts/messages)
- [Cấu hình kênh](/vi/gateway/config-channels)
- [Discord](/vi/channels/discord)
- [Matrix](/vi/channels/matrix)
- [Microsoft Teams](/vi/channels/msteams)
- [Slack](/vi/channels/slack)
- [Telegram](/vi/channels/telegram)
- [Mattermost](/vi/channels/mattermost)
