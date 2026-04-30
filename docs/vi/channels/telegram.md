---
read_when:
    - Làm việc với các tính năng Telegram hoặc Webhook
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

Sẵn sàng cho môi trường production với DM bot và nhóm qua grammY. Long polling là chế độ mặc định; chế độ Webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa chữa.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Tạo token bot trong BotFather">
    Mở Telegram và trò chuyện với **@BotFather** (xác nhận handle chính xác là `@BotFather`).

    Chạy `/newbot`, làm theo lời nhắc, rồi lưu token.

  </Step>

  <Step title="Cấu hình token và chính sách DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Phương án dự phòng env: `TELEGRAM_BOT_TOKEN=...` (chỉ tài khoản mặc định).
    Telegram **không** dùng `openclaw channels login telegram`; hãy cấu hình token trong config/env, rồi khởi động Gateway.

  </Step>

  <Step title="Khởi động Gateway và phê duyệt DM đầu tiên">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Mã ghép nối hết hạn sau 1 giờ.

  </Step>

  <Step title="Thêm bot vào một nhóm">
    Thêm bot vào nhóm của bạn, rồi đặt `channels.telegram.groups` và `groupPolicy` khớp với mô hình truy cập của bạn.
  </Step>
</Steps>

<Note>
Thứ tự phân giải token có nhận biết tài khoản. Trên thực tế, giá trị config thắng phương án dự phòng env, và `TELEGRAM_BOT_TOKEN` chỉ áp dụng cho tài khoản mặc định.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị trong nhóm">
    Bot Telegram mặc định dùng **Chế độ riêng tư**, giới hạn các tin nhắn nhóm mà chúng nhận được.

    Nếu bot phải thấy tất cả tin nhắn nhóm, hãy:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - đặt bot làm quản trị viên nhóm.

    Khi bật/tắt chế độ riêng tư, hãy xóa rồi thêm lại bot trong từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền trong nhóm">
    Trạng thái quản trị viên được kiểm soát trong phần cài đặt nhóm Telegram.

    Bot quản trị viên nhận tất cả tin nhắn nhóm, hữu ích cho hành vi nhóm luôn bật.

  </Accordion>

  <Accordion title="Các tùy chọn BotFather hữu ích">

    - `/setjoingroups` để cho phép/từ chối thêm vào nhóm
    - `/setprivacy` cho hành vi hiển thị trong nhóm

  </Accordion>
</AccordionGroup>

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.telegram.dmPolicy` kiểm soát quyền truy cập tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một ID người gửi trong `allowFrom`)
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `dmPolicy: "open"` với `allowFrom: ["*"]` cho phép mọi tài khoản Telegram tìm thấy hoặc đoán được tên người dùng bot ra lệnh cho bot. Chỉ dùng cho các bot công khai có chủ đích với công cụ bị giới hạn chặt chẽ; bot một chủ sở hữu nên dùng `allowlist` với ID người dùng dạng số.

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    Trong cấu hình nhiều tài khoản, `channels.telegram.allowFrom` cấp cao nhất có tính hạn chế được xem là ranh giới an toàn: các mục `allowFrom: ["*"]` cấp tài khoản không làm tài khoản đó công khai trừ khi allowlist hiệu lực của tài khoản vẫn chứa ký tự đại diện tường minh sau khi hợp nhất.
    `dmPolicy: "allowlist"` với `allowFrom` trống sẽ chặn tất cả DM và bị xác thực cấu hình từ chối.
    Thiết lập chỉ yêu cầu ID người dùng dạng số.
    Nếu bạn đã nâng cấp và cấu hình của bạn chứa các mục allowlist `@username`, hãy chạy `openclaw doctor --fix` để phân giải chúng (best-effort; yêu cầu token bot Telegram).
    Nếu trước đây bạn dựa vào các tệp allowlist trong kho ghép nối, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` trong luồng allowlist (ví dụ khi `dmPolicy: "allowlist"` chưa có ID tường minh nào).

    Với bot một chủ sở hữu, ưu tiên `dmPolicy: "allowlist"` với các ID `allowFrom` dạng số tường minh để giữ chính sách truy cập bền vững trong cấu hình (thay vì phụ thuộc vào các phê duyệt ghép nối trước đó).

    Nhầm lẫn phổ biến: phê duyệt ghép nối DM không có nghĩa là "người gửi này được ủy quyền ở mọi nơi".
    Ghép nối cấp quyền truy cập DM. Nếu chưa có chủ sở hữu lệnh, lượt ghép nối được phê duyệt đầu tiên cũng đặt `commands.ownerAllowFrom` để các lệnh chỉ dành cho chủ sở hữu và phê duyệt exec có tài khoản vận hành tường minh.
    Ủy quyền người gửi trong nhóm vẫn đến từ allowlist cấu hình tường minh.
    Nếu bạn muốn "tôi được ủy quyền một lần và cả DM lẫn lệnh nhóm đều hoạt động", hãy đặt ID người dùng Telegram dạng số của bạn trong `channels.telegram.allowFrom`; với lệnh chỉ dành cho chủ sở hữu, hãy bảo đảm `commands.ownerAllowFrom` chứa `telegram:<your user id>`.

    ### Tìm ID người dùng Telegram của bạn

    An toàn hơn (không dùng bot bên thứ ba):

    1. DM bot của bạn.
    2. Chạy `openclaw logs --follow`.
    3. Đọc `from.id`.

    Phương thức Bot API chính thức:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Phương thức bên thứ ba (kém riêng tư hơn): `@userinfobot` hoặc `@getidsbot`.

  </Tab>

  <Tab title="Chính sách nhóm và allowlist">
    Hai bộ điều khiển áp dụng cùng nhau:

    1. **Nhóm nào được phép** (`channels.telegram.groups`)
       - không có config `groups`:
         - với `groupPolicy: "open"`: bất kỳ nhóm nào cũng có thể vượt qua kiểm tra ID nhóm
         - với `groupPolicy: "allowlist"` (mặc định): các nhóm bị chặn cho đến khi bạn thêm mục `groups` (hoặc `"*"`)
       - đã cấu hình `groups`: hoạt động như allowlist (ID tường minh hoặc `"*"`)

    2. **Người gửi nào được phép trong nhóm** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (mặc định)
       - `disabled`

    `groupAllowFrom` được dùng để lọc người gửi trong nhóm. Nếu chưa đặt, Telegram sẽ dùng dự phòng `allowFrom`.
    Các mục `groupAllowFrom` nên là ID người dùng Telegram dạng số (tiền tố `telegram:` / `tg:` được chuẩn hóa).
    Không đặt ID chat nhóm hoặc supergroup Telegram trong `groupAllowFrom`. ID chat âm thuộc về `channels.telegram.groups`.
    Các mục không phải số bị bỏ qua khi ủy quyền người gửi.
    Ranh giới bảo mật (`2026.2.25+`): xác thực người gửi trong nhóm **không** kế thừa phê duyệt từ kho ghép nối DM.
    Ghép nối vẫn chỉ dành cho DM. Với nhóm, hãy đặt `groupAllowFrom` hoặc `allowFrom` theo từng nhóm/từng chủ đề.
    Nếu `groupAllowFrom` chưa đặt, Telegram dùng dự phòng `allowFrom` trong config, không phải kho ghép nối.
    Mẫu thực tế cho bot một chủ sở hữu: đặt ID người dùng của bạn trong `channels.telegram.allowFrom`, để `groupAllowFrom` chưa đặt, và cho phép các nhóm mục tiêu trong `channels.telegram.groups`.
    Ghi chú runtime: nếu `channels.telegram` hoàn toàn thiếu, runtime mặc định fail-closed `groupPolicy="allowlist"` trừ khi `channels.defaults.groupPolicy` được đặt tường minh.

    Ví dụ: cho phép bất kỳ thành viên nào trong một nhóm cụ thể:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Ví dụ: chỉ cho phép người dùng cụ thể bên trong một nhóm cụ thể:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Lỗi phổ biến: `groupAllowFrom` không phải là allowlist nhóm Telegram.

      - Đặt ID chat nhóm hoặc supergroup Telegram âm như `-1001234567890` trong `channels.telegram.groups`.
      - Đặt ID người dùng Telegram như `8734062810` trong `groupAllowFrom` khi bạn muốn giới hạn những người bên trong một nhóm được phép có thể kích hoạt bot.
      - Chỉ dùng `groupAllowFrom: ["*"]` khi bạn muốn bất kỳ thành viên nào của một nhóm được phép cũng có thể nói chuyện với bot.

    </Warning>

  </Tab>

  <Tab title="Hành vi đề cập">
    Trả lời trong nhóm mặc định yêu cầu đề cập.

    Đề cập có thể đến từ:

    - đề cập `@botusername` gốc, hoặc
    - các mẫu đề cập trong:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Các nút bật/tắt lệnh cấp phiên:

    - `/activation always`
    - `/activation mention`

    Các lệnh này chỉ cập nhật trạng thái phiên. Dùng config để duy trì lâu dài.

    Ví dụ cấu hình duy trì lâu dài:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Lấy ID chat nhóm:

    - chuyển tiếp một tin nhắn nhóm tới `@userinfobot` / `@getidsbot`
    - hoặc đọc `chat.id` từ `openclaw logs --follow`
    - hoặc kiểm tra Bot API `getUpdates`

  </Tab>
</Tabs>

## Hành vi runtime

- Telegram do tiến trình Gateway sở hữu.
- Định tuyến mang tính xác định: tin nhắn đến từ Telegram sẽ trả lời lại Telegram (model không chọn kênh).
- Tin nhắn đến được chuẩn hóa vào phong bì kênh dùng chung với siêu dữ liệu trả lời và placeholder phương tiện.
- Phiên nhóm được cô lập theo ID nhóm. Chủ đề diễn đàn thêm `:topic:<threadId>` để giữ các chủ đề cô lập.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw định tuyến chúng bằng khóa phiên có nhận biết luồng và giữ nguyên ID luồng cho phản hồi.
- Long polling dùng runner grammY với trình tự theo từng chat/từng luồng. Đồng thời sink tổng thể của runner dùng `agents.defaults.maxConcurrent`.
- Long polling được bảo vệ bên trong từng tiến trình Gateway để chỉ một poller đang hoạt động có thể dùng một token bot tại một thời điểm. Nếu bạn vẫn thấy xung đột `getUpdates` 409, có khả năng một Gateway OpenClaw khác, script khác, hoặc poller bên ngoài đang dùng cùng token.
- Các lần khởi động lại watchdog long-polling mặc định kích hoạt sau 120 giây không có tín hiệu liveness `getUpdates` hoàn tất. Chỉ tăng `channels.telegram.pollingStallThresholdMs` nếu triển khai của bạn vẫn thấy khởi động lại do polling-stall giả trong lúc chạy tác vụ lâu. Giá trị tính bằng mili giây và được phép từ `30000` đến `600000`; hỗ trợ ghi đè theo từng tài khoản.
- Telegram Bot API không hỗ trợ biên nhận đã đọc (`sendReadReceipts` không áp dụng).

## Tham chiếu tính năng

<AccordionGroup>
  <Accordion title="Xem trước luồng trực tiếp (sửa tin nhắn)">
    OpenClaw có thể stream phản hồi một phần theo thời gian thực:

    - chat trực tiếp: tin nhắn xem trước + `editMessageText`
    - nhóm/chủ đề: tin nhắn xem trước + `editMessageText`

    Yêu cầu:

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - `progress` ánh xạ thành `partial` trên Telegram (tương thích với cách đặt tên liên kênh)
    - `streaming.preview.toolProgress` kiểm soát việc cập nhật công cụ/tiến độ có tái sử dụng cùng tin nhắn xem trước đã sửa hay không (mặc định: `true` khi stream xem trước đang hoạt động)
    - các giá trị `channels.telegram.streamMode` cũ và `streaming` dạng boolean được phát hiện; chạy `openclaw doctor --fix` để di chuyển chúng sang `channels.telegram.streaming.mode`

    Cập nhật xem trước tiến độ công cụ là các dòng ngắn "Đang làm..." hiển thị khi công cụ chạy, ví dụ thực thi lệnh, đọc tệp, cập nhật kế hoạch, hoặc tóm tắt bản vá. Telegram bật các cập nhật này theo mặc định để khớp với hành vi OpenClaw đã phát hành từ `v2026.4.22` trở đi. Để giữ bản xem trước đã sửa cho văn bản câu trả lời nhưng ẩn các dòng tiến độ công cụ, hãy đặt:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Chỉ dùng `streaming.mode: "off"` khi bạn muốn chỉ gửi kết quả cuối cùng: các lần sửa bản xem trước Telegram bị tắt và nội dung trao đổi chung về công cụ/tiến độ bị chặn thay vì được gửi dưới dạng các tin nhắn "Đang làm..." độc lập. Lời nhắc phê duyệt, payload phương tiện, và lỗi vẫn định tuyến qua cơ chế gửi kết quả cuối cùng bình thường. Dùng `streaming.preview.toolProgress: false` khi bạn chỉ muốn giữ các lần sửa bản xem trước câu trả lời trong khi ẩn các dòng trạng thái tiến độ công cụ.

    Với phản hồi chỉ có văn bản:

    - bản xem trước ngắn cho DM/nhóm/chủ đề: OpenClaw giữ nguyên thông báo xem trước và thực hiện chỉnh sửa cuối cùng tại chỗ
    - bản xem trước cũ hơn khoảng một phút: OpenClaw gửi phản hồi hoàn chỉnh dưới dạng tin nhắn cuối mới rồi dọn dẹp bản xem trước, để dấu thời gian hiển thị của Telegram phản ánh thời điểm hoàn tất thay vì thời điểm tạo bản xem trước

    Với các phản hồi phức tạp (ví dụ payload phương tiện), OpenClaw chuyển về cơ chế gửi kết quả cuối bình thường rồi dọn dẹp thông báo xem trước.

    Luồng xem trước tách biệt với luồng khối. Khi luồng khối được bật rõ ràng cho Telegram, OpenClaw bỏ qua luồng xem trước để tránh phát luồng hai lần.

    Luồng suy luận chỉ dành cho Telegram:

    - `/reasoning stream` gửi suy luận vào bản xem trước trực tiếp trong khi tạo
    - câu trả lời cuối được gửi mà không có văn bản suy luận

  </Accordion>

  <Accordion title="Định dạng và phương án dự phòng HTML">
    Văn bản gửi đi dùng Telegram `parse_mode: "HTML"`.

    - Văn bản kiểu Markdown được kết xuất thành HTML an toàn cho Telegram.
    - HTML thô từ mô hình được escape để giảm lỗi phân tích cú pháp Telegram.
    - Nếu Telegram từ chối HTML đã phân tích cú pháp, OpenClaw thử lại dưới dạng văn bản thuần.

    Bản xem trước liên kết được bật theo mặc định và có thể tắt bằng `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Lệnh gốc và lệnh tùy chỉnh">
    Việc đăng ký menu lệnh Telegram được xử lý lúc khởi động bằng `setMyCommands`.

    Mặc định lệnh gốc:

    - `commands.native: "auto"` bật lệnh gốc cho Telegram

    Thêm mục menu lệnh tùy chỉnh:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Quy tắc:

    - tên được chuẩn hóa (loại bỏ `/` ở đầu, chuyển thành chữ thường)
    - mẫu hợp lệ: `a-z`, `0-9`, `_`, độ dài `1..32`
    - lệnh tùy chỉnh không thể ghi đè lệnh gốc
    - xung đột/trùng lặp bị bỏ qua và được ghi log

    Ghi chú:

    - lệnh tùy chỉnh chỉ là mục menu; chúng không tự triển khai hành vi
    - lệnh Plugin/Skills vẫn có thể hoạt động khi được nhập, kể cả khi không hiển thị trong menu Telegram

    Nếu lệnh gốc bị tắt, các lệnh tích hợp sẽ bị xóa. Lệnh tùy chỉnh/Plugin vẫn có thể được đăng ký nếu đã cấu hình.

    Lỗi thiết lập thường gặp:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu Telegram vẫn bị vượt giới hạn sau khi cắt bớt; hãy giảm lệnh Plugin/Skills/tùy chỉnh hoặc tắt `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands`, hoặc `setMyCommands` thất bại với `404: Not Found` trong khi lệnh curl Bot API trực tiếp hoạt động có thể nghĩa là `channels.telegram.apiRoot` đã được đặt thành endpoint đầy đủ `/bot<TOKEN>`. `apiRoot` chỉ được là gốc Bot API, và `openclaw doctor --fix` sẽ xóa phần `/bot<TOKEN>` vô tình bị thêm ở cuối.
    - `getMe returned 401` nghĩa là Telegram đã từ chối token bot đã cấu hình. Cập nhật `botToken`, `tokenFile`, hoặc `TELEGRAM_BOT_TOKEN` bằng token BotFather hiện tại; OpenClaw dừng trước khi polling nên lỗi này không được báo cáo như lỗi dọn dẹp Webhook.
    - `setMyCommands failed` với lỗi mạng/fetch thường nghĩa là DNS/HTTPS gửi ra tới `api.telegram.org` bị chặn.

    ### Lệnh ghép nối thiết bị (Plugin `device-pair`)

    Khi Plugin `device-pair` được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ (bao gồm vai trò/phạm vi)
    4. phê duyệt yêu cầu:
       - `/pair approve <requestId>` để phê duyệt rõ ràng
       - `/pair approve` khi chỉ có một yêu cầu đang chờ
       - `/pair approve latest` cho yêu cầu gần đây nhất

    Mã thiết lập mang một token bootstrap tồn tại ngắn hạn. Cơ chế chuyển giao bootstrap tích hợp giữ token node chính ở `scopes: []`; mọi token operator được chuyển giao vẫn bị giới hạn trong `operator.approvals`, `operator.read`, `operator.talk.secrets`, và `operator.write`. Kiểm tra phạm vi bootstrap có tiền tố vai trò, nên allowlist operator đó chỉ thỏa mãn yêu cầu operator; các vai trò không phải operator vẫn cần phạm vi dưới tiền tố vai trò riêng của chúng.

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (ví dụ vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó bị thay thế và yêu cầu mới dùng một `requestId` khác. Chạy lại `/pair pending` trước khi phê duyệt.

    Chi tiết thêm: [Ghép nối](/vi/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Nút nội tuyến">
    Cấu hình phạm vi bàn phím nội tuyến:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Ghi đè theo từng tài khoản:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Phạm vi:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (mặc định)

    `capabilities: ["inlineButtons"]` cũ ánh xạ tới `inlineButtons: "all"`.

    Ví dụ hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Lượt nhấp callback được truyền cho tác tử dưới dạng văn bản:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Hành động tin nhắn Telegram cho tác tử và tự động hóa">
    Hành động công cụ Telegram bao gồm:

    - `sendMessage` (`to`, `content`, tùy chọn `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, tùy chọn `iconColor`, `iconCustomEmojiId`)

    Hành động tin nhắn kênh cung cấp các bí danh tiện dụng (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Điều khiển chặn quyền:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (mặc định: tắt)

    Lưu ý: `edit` và `topic-create` hiện được bật theo mặc định và không có công tắc `channels.telegram.actions.*` riêng.
    Các lượt gửi runtime dùng ảnh chụp nhanh cấu hình/bí mật đang hoạt động (khởi động/tải lại), nên đường dẫn hành động không thực hiện phân giải lại SecretRef tùy biến theo từng lần gửi.

    Ngữ nghĩa xóa phản ứng: [/tools/reactions](/vi/tools/reactions)

  </Accordion>

  <Accordion title="Thẻ luồng phản hồi">
    Telegram hỗ trợ thẻ luồng phản hồi rõ ràng trong đầu ra được tạo:

    - `[[reply_to_current]]` trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` trả lời một ID tin nhắn Telegram cụ thể

    `channels.telegram.replyToMode` điều khiển cách xử lý:

    - `off` (mặc định)
    - `first`
    - `all`

    Khi luồng phản hồi được bật và văn bản hoặc chú thích Telegram gốc có sẵn, OpenClaw tự động bao gồm một đoạn trích dẫn Telegram gốc. Telegram giới hạn văn bản trích dẫn gốc ở 1024 đơn vị mã UTF-16, nên tin nhắn dài hơn được trích dẫn từ đầu và chuyển về phản hồi thuần nếu Telegram từ chối trích dẫn.

    Lưu ý: `off` tắt luồng phản hồi ngầm định. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi luồng">
    Siêu nhóm diễn đàn:

    - khóa phiên chủ đề thêm `:topic:<threadId>`
    - phản hồi và trạng thái đang nhập nhắm tới luồng chủ đề
    - đường dẫn cấu hình chủ đề:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Trường hợp đặc biệt chủ đề Chung (`threadId=1`):

    - lượt gửi tin nhắn bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)`)
    - hành động đang nhập vẫn bao gồm `message_thread_id`

    Kế thừa chủ đề: mục chủ đề kế thừa thiết lập nhóm trừ khi bị ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` chỉ dành cho chủ đề và không kế thừa từ mặc định nhóm.

    **Định tuyến tác tử theo từng chủ đề**: Mỗi chủ đề có thể định tuyến tới một tác tử khác nhau bằng cách đặt `agentId` trong cấu hình chủ đề. Điều này cho mỗi chủ đề workspace, bộ nhớ và phiên riêng biệt. Ví dụ:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Khi đó mỗi chủ đề có khóa phiên riêng: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liên kết chủ đề ACP bền vững**: Chủ đề diễn đàn có thể ghim phiên harness ACP thông qua liên kết ACP có kiểu ở cấp cao nhất (`bindings[]` với `type: "acp"` và `match.channel: "telegram"`, `peer.kind: "group"`, cùng một id đủ điều kiện theo chủ đề như `-1001234567890:topic:42`). Hiện được giới hạn cho chủ đề diễn đàn trong nhóm/siêu nhóm. Xem [Tác tử ACP](/vi/tools/acp-agents).

    **Sinh ACP gắn với luồng từ chat**: `/acp spawn <agent> --thread here|auto` liên kết chủ đề hiện tại với một phiên ACP mới; các lượt theo dõi được định tuyến trực tiếp tới đó. OpenClaw ghim xác nhận sinh trong chủ đề. Yêu cầu `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Ngữ cảnh mẫu cung cấp `MessageThreadId` và `IsForum`. Cuộc trò chuyện DM có `message_thread_id` vẫn giữ định tuyến DM nhưng dùng khóa phiên nhận biết luồng.

  </Accordion>

  <Accordion title="Âm thanh, video và sticker">
    ### Tin nhắn âm thanh

    Telegram phân biệt ghi chú thoại với tệp âm thanh.

    - mặc định: hành vi tệp âm thanh
    - thẻ `[[audio_as_voice]]` trong phản hồi tác tử để buộc gửi dạng ghi chú thoại
    - bản chép lời ghi chú thoại gửi vào được đóng khung là văn bản do máy tạo,
      không đáng tin cậy trong ngữ cảnh tác tử; phát hiện nhắc đến vẫn dùng bản chép lời
      thô nên tin nhắn thoại có chặn theo nhắc đến tiếp tục hoạt động.

    Ví dụ hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Tin nhắn video

    Telegram phân biệt tệp video với ghi chú video.

    Ví dụ hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Ghi chú video không hỗ trợ chú thích; văn bản tin nhắn được cung cấp sẽ được gửi riêng.

    ### Sticker

    Xử lý sticker gửi vào:

    - WEBP tĩnh: được tải xuống và xử lý (placeholder `<media:sticker>`)
    - TGS động: bỏ qua
    - WEBM video: bỏ qua

    Trường ngữ cảnh sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Tệp bộ nhớ đệm sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker được mô tả một lần (khi có thể) và được lưu vào bộ nhớ đệm để giảm các lượt gọi thị giác lặp lại.

    Bật hành động sticker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Hành động gửi sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Tìm kiếm sticker đã lưu trong bộ nhớ đệm:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Phản ứng Telegram đến dưới dạng cập nhật `message_reaction` (tách biệt với payload tin nhắn).

    Khi được bật, OpenClaw đưa các sự kiện hệ thống vào hàng đợi như:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Cấu hình:

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    Ghi chú:

    - `own` nghĩa là chỉ các phản ứng của người dùng với tin nhắn do bot gửi (nỗ lực tốt nhất qua bộ nhớ đệm tin nhắn đã gửi).
    - Sự kiện phản ứng vẫn tuân thủ kiểm soát truy cập Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được phép sẽ bị loại bỏ.
    - Telegram không cung cấp ID luồng trong bản cập nhật phản ứng.
      - nhóm không phải forum định tuyến đến phiên trò chuyện nhóm
      - nhóm forum định tuyến đến phiên chủ đề chung của nhóm (`:topic:1`), không phải đúng chủ đề gốc đã phát sinh

    `allowed_updates` cho polling/webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

    Thứ tự phân giải:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - phương án dự phòng emoji danh tính agent (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Telegram mong đợi emoji unicode (ví dụ "👀").
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình từ sự kiện và lệnh Telegram">
    Ghi cấu hình kênh được bật theo mặc định (`configWrites !== false`).

    Các lượt ghi do Telegram kích hoạt bao gồm:

    - sự kiện di chuyển nhóm (`migrate_to_chat_id`) để cập nhật `channels.telegram.groups`
    - `/config set` và `/config unset` (yêu cầu bật lệnh)

    Tắt:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling so với webhook">
    Mặc định là long polling. Đối với chế độ webhook, đặt `channels.telegram.webhookUrl` và `channels.telegram.webhookSecret`; tùy chọn `webhookPath`, `webhookHost`, `webhookPort` (mặc định `/telegram-webhook`, `127.0.0.1`, `8787`).

    Listener cục bộ bind tới `127.0.0.1:8787`. Đối với ingress công khai, hãy đặt reverse proxy phía trước cổng cục bộ hoặc chủ đích đặt `webhookHost: "0.0.0.0"`.

    Chế độ webhook xác thực các lớp bảo vệ yêu cầu, token bí mật Telegram và thân JSON trước khi trả về `200` cho Telegram.
    Sau đó OpenClaw xử lý bản cập nhật bất đồng bộ qua cùng các làn bot theo từng cuộc trò chuyện/từng chủ đề như long polling, nên các lượt agent chậm sẽ không giữ ACK giao hàng của Telegram.

  </Accordion>

  <Accordion title="Giới hạn, thử lại và đích CLI">
    - `channels.telegram.textChunkLimit` mặc định là 4000.
    - `channels.telegram.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi tách theo độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước media Telegram đến và đi.
    - `channels.telegram.timeoutSeconds` ghi đè thời gian chờ của client API Telegram (nếu chưa đặt, dùng mặc định grammY). Client bot long-polling kẹp các giá trị được cấu hình thấp hơn ngưỡng bảo vệ yêu cầu `getUpdates` 45 giây để các lượt poll nhàn rỗi không bị hủy trước khi cửa sổ poll 30 giây hoàn tất.
    - `channels.telegram.pollingStallThresholdMs` mặc định là `120000`; chỉ tinh chỉnh trong khoảng `30000` đến `600000` cho các lần khởi động lại do polling bị kẹt dương tính giả.
    - lịch sử ngữ cảnh nhóm dùng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` sẽ tắt.
    - ngữ cảnh bổ sung từ trả lời/trích dẫn/chuyển tiếp hiện được truyền nguyên như nhận được.
    - danh sách cho phép Telegram chủ yếu chặn ai có thể kích hoạt agent, không phải ranh giới biên tập lại toàn bộ ngữ cảnh bổ sung.
    - Điều khiển lịch sử DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - cấu hình `channels.telegram.retry` áp dụng cho các helper gửi Telegram (CLI/công cụ/hành động) đối với lỗi API gửi đi có thể khôi phục. Việc gửi phản hồi cuối cùng cho tin nhắn đến cũng dùng cơ chế thử lại safe-send có giới hạn cho lỗi Telegram trước khi kết nối, nhưng không thử lại các phong bì mạng mơ hồ sau khi gửi vì có thể nhân đôi tin nhắn hiển thị.

    Đích gửi CLI có thể là ID trò chuyện dạng số hoặc tên người dùng:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Poll Telegram dùng `openclaw message poll` và hỗ trợ chủ đề forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Các cờ chỉ dành cho poll Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` cho chủ đề forum (hoặc dùng đích `:topic:`)

    Gửi Telegram cũng hỗ trợ:

    - `--presentation` với các khối `buttons` cho bàn phím inline khi `channels.telegram.capabilities.inlineButtons` cho phép
    - `--pin` hoặc `--delivery '{"pin":true}'` để yêu cầu giao hàng được ghim khi bot có thể ghim trong cuộc trò chuyện đó
    - `--force-document` để gửi ảnh và GIF đi dưới dạng tài liệu thay vì ảnh nén hoặc tệp tải lên media động

    Chặn hành động:

    - `channels.telegram.actions.sendMessage=false` tắt tin nhắn Telegram đi, bao gồm poll
    - `channels.telegram.actions.poll=false` tắt tạo poll Telegram trong khi vẫn bật gửi thông thường

  </Accordion>

  <Accordion title="Phê duyệt exec trong Telegram">
    Telegram hỗ trợ phê duyệt exec trong DM của người phê duyệt và có thể tùy chọn đăng lời nhắc trong cuộc trò chuyện hoặc chủ đề gốc. Người phê duyệt phải là ID người dùng Telegram dạng số.

    Đường dẫn cấu hình:

    - `channels.telegram.execApprovals.enabled` (tự động bật khi có ít nhất một người phê duyệt có thể phân giải)
    - `channels.telegram.execApprovals.approvers` (dự phòng về ID chủ sở hữu dạng số từ `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (mặc định) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` và `defaultTo` kiểm soát ai có thể nói chuyện với bot và nơi bot gửi phản hồi bình thường. Chúng không biến ai đó thành người phê duyệt exec. Ghép cặp DM được phê duyệt đầu tiên sẽ khởi tạo `commands.ownerAllowFrom` khi chưa có chủ sở hữu lệnh nào, nên thiết lập một chủ sở hữu vẫn hoạt động mà không cần sao chép ID dưới `execApprovals.approvers`.

    Gửi qua kênh hiển thị văn bản lệnh trong cuộc trò chuyện; chỉ bật `channel` hoặc `both` trong nhóm/chủ đề đáng tin cậy. Khi lời nhắc đến một chủ đề forum, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và lượt theo dõi. Phê duyệt exec mặc định hết hạn sau 30 phút.

    Nút phê duyệt inline cũng yêu cầu `channels.telegram.capabilities.inlineButtons` cho phép bề mặt đích (`dm`, `group` hoặc `all`). ID phê duyệt có tiền tố `plugin:` phân giải qua phê duyệt plugin; các ID khác trước tiên phân giải qua phê duyệt exec.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Điều khiển phản hồi lỗi

Khi agent gặp lỗi giao hàng hoặc lỗi nhà cung cấp, Telegram có thể phản hồi bằng văn bản lỗi hoặc ẩn lỗi đó. Hai khóa cấu hình kiểm soát hành vi này:

| Khóa                                | Giá trị           | Mặc định | Mô tả                                                                                               |
| ----------------------------------- | ----------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` gửi tin nhắn lỗi thân thiện đến cuộc trò chuyện. `silent` ẩn hoàn toàn phản hồi lỗi.        |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`  | Thời gian tối thiểu giữa các phản hồi lỗi tới cùng một cuộc trò chuyện. Ngăn spam lỗi khi sự cố.    |

Hỗ trợ ghi đè theo tài khoản, theo nhóm và theo chủ đề (kế thừa giống các khóa cấu hình Telegram khác).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bot không phản hồi tin nhắn nhóm không nhắc đến bot">

    - Nếu `requireMention=false`, chế độ quyền riêng tư Telegram phải cho phép hiển thị đầy đủ.
      - BotFather: `/setprivacy` -> Disable
      - sau đó xóa + thêm lại bot vào nhóm
    - `openclaw channels status` cảnh báo khi cấu hình mong đợi tin nhắn nhóm không nhắc đến bot.
    - `openclaw channels status --probe` có thể kiểm tra ID nhóm dạng số rõ ràng; ký tự đại diện `"*"` không thể được kiểm tra tư cách thành viên.
    - kiểm thử phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot hoàn toàn không thấy tin nhắn nhóm">

    - khi `channels.telegram.groups` tồn tại, nhóm phải được liệt kê (hoặc bao gồm `"*"`)
    - xác minh tư cách thành viên của bot trong nhóm
    - xem nhật ký: `openclaw logs --follow` để biết lý do bỏ qua

  </Accordion>

  <Accordion title="Lệnh hoạt động một phần hoặc hoàn toàn không hoạt động">

    - cấp quyền cho danh tính người gửi của bạn (ghép cặp và/hoặc `allowFrom` dạng số)
    - ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`
    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu gốc có quá nhiều mục; giảm lệnh plugin/skill/tùy chỉnh hoặc tắt menu gốc
    - các lệnh khởi động `deleteMyCommands` / `setMyCommands` có giới hạn và thử lại một lần qua dự phòng truyền tải của Telegram khi yêu cầu hết thời gian chờ. Lỗi mạng/fetch kéo dài thường cho thấy sự cố khả năng truy cập DNS/HTTPS tới `api.telegram.org`

  </Accordion>

  <Accordion title="Khởi động báo cáo token không được phép">

    - `getMe returned 401` là lỗi xác thực Telegram đối với token bot đã cấu hình.
    - Sao chép lại hoặc tạo lại token bot trong BotFather, rồi cập nhật `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` hoặc `TELEGRAM_BOT_TOKEN` cho tài khoản mặc định.
    - `deleteWebhook 401 Unauthorized` trong khi khởi động cũng là lỗi xác thực; coi đó là "không có webhook tồn tại" sẽ chỉ trì hoãn cùng lỗi token sai sang các lệnh gọi API sau.
    - Nếu `deleteWebhook` thất bại với lỗi mạng tạm thời trong khi khởi động polling, OpenClaw kiểm tra `getWebhookInfo`; khi Telegram báo URL webhook trống, polling tiếp tục vì việc dọn dẹp đã thỏa mãn.

  </Accordion>

  <Accordion title="Polling hoặc mạng không ổn định">

    - Node 22+ + `fetch`/proxy tùy chỉnh có thể kích hoạt hành vi hủy ngay lập tức nếu kiểu AbortSignal không khớp.
    - Một số máy chủ phân giải `api.telegram.org` sang IPv6 trước; egress IPv6 bị lỗi có thể gây lỗi Telegram API gián đoạn.
    - Nếu log có `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!`, OpenClaw hiện thử lại các lỗi này như lỗi mạng có thể khôi phục.
    - Nếu socket Telegram tái tạo theo chu kỳ cố định ngắn, hãy kiểm tra `channels.telegram.timeoutSeconds` thấp; client bot long-polling giới hạn các giá trị cấu hình thấp hơn mức bảo vệ yêu cầu `getUpdates`, nhưng các bản phát hành cũ hơn có thể hủy mọi lượt poll khi giá trị này được đặt thấp hơn thời gian chờ long-poll.
    - Nếu log có `Polling stall detected`, OpenClaw khởi động lại polling và dựng lại lớp vận chuyển Telegram sau 120 giây không có long-poll liveness hoàn tất theo mặc định.
    - `openclaw channels status --probe` và `openclaw doctor` cảnh báo khi một tài khoản polling đang chạy chưa hoàn tất `getUpdates` sau khoảng gia hạn khởi động, khi một tài khoản webhook đang chạy chưa hoàn tất `setWebhook` sau khoảng gia hạn khởi động, hoặc khi hoạt động lớp vận chuyển polling thành công gần nhất đã quá cũ.
    - Chỉ tăng `channels.telegram.pollingStallThresholdMs` khi các lệnh gọi `getUpdates` chạy lâu vẫn khỏe mạnh nhưng máy chủ của bạn vẫn báo nhầm các lần khởi động lại do polling bị đình trệ. Tình trạng đình trệ kéo dài thường chỉ ra vấn đề proxy, DNS, IPv6 hoặc egress TLS giữa máy chủ và `api.telegram.org`.
    - Telegram cũng tuân theo biến môi trường proxy của tiến trình cho lớp vận chuyển Bot API, bao gồm `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và các biến chữ thường tương ứng. `NO_PROXY` / `no_proxy` vẫn có thể bỏ qua `api.telegram.org`.
    - Nếu proxy do OpenClaw quản lý được cấu hình qua `OPENCLAW_PROXY_URL` cho môi trường dịch vụ và không có biến môi trường proxy tiêu chuẩn nào, Telegram cũng dùng URL đó cho lớp vận chuyển Bot API.
    - Trên máy chủ VPS có egress/TLS trực tiếp không ổn định, hãy định tuyến các lệnh gọi Telegram API qua `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định dùng `autoSelectFamily=true` (trừ WSL2) và `dnsResultOrder=ipv4first`.
    - Nếu máy chủ của bạn là WSL2 hoặc hoạt động rõ ràng tốt hơn với hành vi chỉ IPv4, hãy buộc chọn family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Các câu trả lời trong dải benchmark RFC 2544 (`198.18.0.0/15`) đã được cho phép
      mặc định cho tải xuống phương tiện Telegram. Nếu một fake-IP đáng tin cậy hoặc
      proxy trong suốt viết lại `api.telegram.org` sang một địa chỉ riêng/nội bộ/dành cho mục đích đặc biệt khác
      trong khi tải xuống phương tiện, bạn có thể chọn bật bỏ qua chỉ dành cho Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Tùy chọn bật tương tự có sẵn cho từng tài khoản tại
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Nếu proxy của bạn phân giải máy chủ phương tiện Telegram thành `198.18.x.x`, trước tiên hãy để
      cờ nguy hiểm tắt. Phương tiện Telegram đã cho phép dải benchmark RFC 2544
      theo mặc định.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` làm suy yếu lớp bảo vệ SSRF cho
      phương tiện Telegram. Chỉ dùng tùy chọn này cho các môi trường proxy do operator kiểm soát và đáng tin cậy
      như định tuyến fake-IP của Clash, Mihomo hoặc Surge khi chúng
      tổng hợp các câu trả lời riêng tư hoặc dành cho mục đích đặc biệt nằm ngoài dải benchmark RFC 2544.
      Hãy để tắt cho truy cập Telegram qua internet công cộng thông thường.
    </Warning>

    - Ghi đè bằng môi trường (tạm thời):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Xác thực câu trả lời DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Trợ giúp thêm: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Telegram](/vi/gateway/config-channels#telegram).

<Accordion title="Các trường Telegram quan trọng">

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` phải trỏ đến một tệp thông thường; symlink bị từ chối)
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- phê duyệt thực thi: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- luồng/trả lời: `replyToMode`
- streaming: `streaming` (xem trước), `streaming.preview.toolProgress`, `blockStreaming`
- định dạng/phân phối: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- phương tiện/mạng: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- gốc API tùy chỉnh: `apiRoot` (chỉ gốc Bot API; không bao gồm `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- hành động/năng lực: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- lỗi: `errorPolicy`, `errorCooldownMs`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Độ ưu tiên đa tài khoản: khi hai ID tài khoản trở lên được cấu hình, hãy đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để định tuyến mặc định rõ ràng. Nếu không, OpenClaw quay về ID tài khoản đã chuẩn hóa đầu tiên và `openclaw doctor` sẽ cảnh báo. Tài khoản được đặt tên kế thừa `channels.telegram.allowFrom` / `groupAllowFrom`, nhưng không kế thừa các giá trị `accounts.default.*`.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối một người dùng Telegram với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi allowlist cho nhóm và chủ đề.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến vào agent.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Định tuyến đa agent" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ nhóm và chủ đề tới agent.
  </Card>
  <Card title="Khắc phục sự cố" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán trên nhiều kênh.
  </Card>
</CardGroup>
