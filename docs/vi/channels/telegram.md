---
read_when:
    - Làm việc với các tính năng Telegram hoặc Webhook
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

Sẵn sàng cho production cho DM bot và nhóm thông qua grammY. Long polling là chế độ mặc định; chế độ webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán xuyên kênh và playbook sửa chữa.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Tạo token bot trong BotFather">
    Mở Telegram và trò chuyện với **@BotFather** (xác nhận handle chính xác là `@BotFather`).

    Chạy `/newbot`, làm theo lời nhắc và lưu token.

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

    Dự phòng env: `TELEGRAM_BOT_TOKEN=...` (chỉ tài khoản mặc định).
    Telegram **không** dùng `openclaw channels login telegram`; hãy cấu hình token trong config/env, rồi khởi động gateway.

  </Step>

  <Step title="Khởi động gateway và phê duyệt DM đầu tiên">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Mã ghép nối hết hạn sau 1 giờ.

  </Step>

  <Step title="Thêm bot vào một nhóm">
    Thêm bot vào nhóm của bạn, rồi đặt `channels.telegram.groups` và `groupPolicy` để khớp với mô hình truy cập của bạn.
  </Step>
</Steps>

<Note>
Thứ tự phân giải token nhận biết theo tài khoản. Trên thực tế, giá trị config được ưu tiên hơn dự phòng env, và `TELEGRAM_BOT_TOKEN` chỉ áp dụng cho tài khoản mặc định.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị trong nhóm">
    Bot Telegram mặc định dùng **Privacy Mode**, giới hạn các tin nhắn nhóm mà chúng nhận được.

    Nếu bot phải thấy tất cả tin nhắn nhóm, hãy:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - đặt bot làm quản trị viên nhóm.

    Khi bật/tắt chế độ riêng tư, hãy xóa + thêm lại bot trong từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền nhóm">
    Trạng thái quản trị viên được kiểm soát trong cài đặt nhóm Telegram.

    Bot quản trị viên nhận tất cả tin nhắn nhóm, hữu ích cho hành vi nhóm luôn bật.

  </Accordion>

  <Accordion title="Các công tắc BotFather hữu ích">

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

    `dmPolicy: "open"` với `allowFrom: ["*"]` cho phép bất kỳ tài khoản Telegram nào tìm thấy hoặc đoán được tên người dùng bot có thể ra lệnh cho bot. Chỉ dùng tùy chọn này cho các bot công khai có chủ đích với công cụ bị hạn chế chặt chẽ; bot một chủ sở hữu nên dùng `allowlist` với ID người dùng dạng số.

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    Trong cấu hình nhiều tài khoản, `channels.telegram.allowFrom` cấp cao nhất có tính hạn chế được xem là ranh giới an toàn: các mục `allowFrom: ["*"]` cấp tài khoản không làm tài khoản đó công khai trừ khi allowlist hiệu lực của tài khoản vẫn chứa wildcard rõ ràng sau khi hợp nhất.
    `dmPolicy: "allowlist"` với `allowFrom` rỗng sẽ chặn tất cả DM và bị xác thực cấu hình từ chối.
    Thiết lập chỉ yêu cầu ID người dùng dạng số.
    Nếu bạn đã nâng cấp và cấu hình của bạn chứa các mục allowlist `@username`, hãy chạy `openclaw doctor --fix` để phân giải chúng (nỗ lực tối đa; yêu cầu token bot Telegram).
    Nếu trước đây bạn dựa vào các tệp allowlist của kho ghép nối, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` trong các luồng allowlist (ví dụ khi `dmPolicy: "allowlist"` chưa có ID rõ ràng).

    Với bot một chủ sở hữu, nên dùng `dmPolicy: "allowlist"` với ID `allowFrom` dạng số rõ ràng để giữ chính sách truy cập bền vững trong config (thay vì phụ thuộc vào các phê duyệt ghép nối trước đó).

    Nhầm lẫn thường gặp: phê duyệt ghép nối DM không có nghĩa là "người gửi này được ủy quyền ở mọi nơi".
    Ghép nối cấp quyền truy cập DM. Nếu chưa có chủ sở hữu lệnh, lần ghép nối được phê duyệt đầu tiên cũng đặt `commands.ownerAllowFrom` để các lệnh chỉ dành cho chủ sở hữu và phê duyệt exec có tài khoản vận hành rõ ràng.
    Ủy quyền người gửi trong nhóm vẫn đến từ các allowlist cấu hình rõ ràng.
    Nếu bạn muốn "Tôi được ủy quyền một lần và cả DM lẫn lệnh nhóm đều hoạt động", hãy đặt ID người dùng Telegram dạng số của bạn trong `channels.telegram.allowFrom`; với các lệnh chỉ dành cho chủ sở hữu, hãy đảm bảo `commands.ownerAllowFrom` chứa `telegram:<your user id>`.

    ### Tìm ID người dùng Telegram của bạn

    An toàn hơn (không dùng bot bên thứ ba):

    1. DM bot của bạn.
    2. Chạy `openclaw logs --follow`.
    3. Đọc `from.id`.

    Phương thức Bot API chính thức:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Phương thức bên thứ ba (ít riêng tư hơn): `@userinfobot` hoặc `@getidsbot`.

  </Tab>

  <Tab title="Chính sách nhóm và allowlist">
    Hai kiểm soát áp dụng cùng nhau:

    1. **Những nhóm nào được phép** (`channels.telegram.groups`)
       - không có config `groups`:
         - với `groupPolicy: "open"`: bất kỳ nhóm nào cũng có thể vượt qua kiểm tra ID nhóm
         - với `groupPolicy: "allowlist"` (mặc định): các nhóm bị chặn cho đến khi bạn thêm mục `groups` (hoặc `"*"`)
       - đã cấu hình `groups`: hoạt động như allowlist (ID rõ ràng hoặc `"*"`)

    2. **Những người gửi nào được phép trong nhóm** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (mặc định)
       - `disabled`

    `groupAllowFrom` được dùng để lọc người gửi trong nhóm. Nếu không đặt, Telegram quay về dùng `allowFrom`.
    Các mục `groupAllowFrom` nên là ID người dùng Telegram dạng số (tiền tố `telegram:` / `tg:` được chuẩn hóa).
    Không đặt ID chat nhóm hoặc siêu nhóm Telegram trong `groupAllowFrom`. ID chat âm thuộc về `channels.telegram.groups`.
    Các mục không phải dạng số bị bỏ qua cho ủy quyền người gửi.
    Ranh giới bảo mật (`2026.2.25+`): xác thực người gửi nhóm **không** kế thừa phê duyệt kho ghép nối DM.
    Ghép nối vẫn chỉ dành cho DM. Với nhóm, đặt `groupAllowFrom` hoặc `allowFrom` theo nhóm/theo topic.
    Nếu `groupAllowFrom` chưa đặt, Telegram quay về dùng config `allowFrom`, không dùng kho ghép nối.
    Mẫu thực tế cho bot một chủ sở hữu: đặt ID người dùng của bạn trong `channels.telegram.allowFrom`, để `groupAllowFrom` chưa đặt, và cho phép các nhóm mục tiêu trong `channels.telegram.groups`.
    Ghi chú runtime: nếu `channels.telegram` hoàn toàn thiếu, runtime mặc định fail-closed `groupPolicy="allowlist"` trừ khi `channels.defaults.groupPolicy` được đặt rõ ràng.

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
      Lỗi thường gặp: `groupAllowFrom` không phải là allowlist nhóm Telegram.

      - Đặt ID chat nhóm hoặc siêu nhóm Telegram dạng âm như `-1001234567890` dưới `channels.telegram.groups`.
      - Đặt ID người dùng Telegram như `8734062810` dưới `groupAllowFrom` khi bạn muốn giới hạn những người bên trong một nhóm được phép có thể kích hoạt bot.
      - Chỉ dùng `groupAllowFrom: ["*"]` khi bạn muốn bất kỳ thành viên nào của một nhóm được phép đều có thể nói chuyện với bot.

    </Warning>

  </Tab>

  <Tab title="Hành vi mention">
    Trả lời trong nhóm mặc định yêu cầu mention.

    Mention có thể đến từ:

    - mention gốc `@botusername`, hoặc
    - các mẫu mention trong:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Các công tắc lệnh cấp phiên:

    - `/activation always`
    - `/activation mention`

    Những lệnh này chỉ cập nhật trạng thái phiên. Dùng config để duy trì lâu dài.

    Ví dụ config duy trì lâu dài:

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

- Telegram do quy trình gateway sở hữu.
- Định tuyến là xác định: tin nhắn vào từ Telegram trả lời lại Telegram (model không chọn kênh).
- Tin nhắn vào được chuẩn hóa thành phong bì kênh dùng chung với siêu dữ liệu trả lời và placeholder media.
- Phiên nhóm được cô lập theo ID nhóm. Topic diễn đàn thêm `:topic:<threadId>` để giữ các topic cô lập.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw giữ nguyên ID thread cho trả lời nhưng mặc định vẫn giữ DM trên phiên phẳng. Cấu hình `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, hoặc config topic khớp khi bạn chủ ý muốn cô lập phiên topic DM.
- Long polling dùng grammY runner với sắp trình tự theo từng chat/từng thread. Đồng thời tổng thể của runner sink dùng `agents.defaults.maxConcurrent`.
- Long polling được bảo vệ bên trong từng quy trình gateway để chỉ một poller đang hoạt động có thể dùng một token bot tại một thời điểm. Nếu bạn vẫn thấy xung đột `getUpdates` 409, có thể một gateway OpenClaw khác, script, hoặc poller bên ngoài đang dùng cùng token.
- Khởi động lại watchdog long-polling được kích hoạt mặc định sau 120 giây không có liveness `getUpdates` hoàn tất. Chỉ tăng `channels.telegram.pollingStallThresholdMs` nếu deployment của bạn vẫn thấy khởi động lại do polling-stall giả trong khi công việc chạy lâu. Giá trị tính bằng mili giây và được phép từ `30000` đến `600000`; hỗ trợ ghi đè theo tài khoản.
- Telegram Bot API không hỗ trợ biên nhận đã đọc (`sendReadReceipts` không áp dụng).

## Tham chiếu tính năng

<AccordionGroup>
  <Accordion title="Xem trước luồng trực tiếp (chỉnh sửa tin nhắn)">
    OpenClaw có thể stream trả lời từng phần theo thời gian thực:

    - chat trực tiếp: tin nhắn xem trước + `editMessageText`
    - nhóm/topic: tin nhắn xem trước + `editMessageText`

    Yêu cầu:

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - `progress` giữ một bản nháp trạng thái có thể chỉnh sửa và cập nhật nó với tiến trình công cụ cho đến khi gửi cuối cùng
    - `streaming.preview.toolProgress` kiểm soát việc cập nhật công cụ/tiến trình có tái sử dụng cùng tin nhắn xem trước đã chỉnh sửa hay không (mặc định: `true` khi stream xem trước đang hoạt động)
    - `streaming.preview.commandText` kiểm soát chi tiết command/exec bên trong các dòng tiến trình công cụ đó: `raw` (mặc định, giữ nguyên hành vi đã phát hành) hoặc `status` (chỉ nhãn công cụ)
    - `channels.telegram.streamMode` kế thừa và giá trị boolean `streaming` được phát hiện; chạy `openclaw doctor --fix` để di chuyển chúng sang `channels.telegram.streaming.mode`

    Cập nhật xem trước tiến trình công cụ là các dòng trạng thái ngắn hiển thị trong khi công cụ chạy, ví dụ thực thi lệnh, đọc tệp, cập nhật lập kế hoạch, hoặc tóm tắt patch. Telegram giữ chúng bật theo mặc định để khớp hành vi OpenClaw đã phát hành từ `v2026.4.22` trở về sau. Để giữ bản xem trước đã chỉnh sửa cho văn bản câu trả lời nhưng ẩn các dòng tiến trình công cụ, hãy đặt:

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

    Để giữ tiến trình công cụ hiển thị nhưng ẩn văn bản command/exec, hãy đặt:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Với chế độ bản nháp tiến trình, hãy đặt cùng chính sách văn bản lệnh trong `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Chỉ dùng `streaming.mode: "off"` khi bạn muốn chỉ phân phối kết quả cuối cùng: các chỉnh sửa xem trước của Telegram bị tắt và thông tin trò chuyện chung về công cụ/tiến trình bị chặn thay vì được gửi dưới dạng các thông báo trạng thái độc lập. Lời nhắc phê duyệt, payload phương tiện và lỗi vẫn đi qua luồng phân phối cuối cùng bình thường. Dùng `streaming.preview.toolProgress: false` khi bạn chỉ muốn giữ các chỉnh sửa xem trước câu trả lời trong khi ẩn các dòng trạng thái tiến trình công cụ.

    <Note>
      Trả lời trích dẫn đã chọn của Telegram là ngoại lệ. Khi `replyToMode` là `"first"`, `"all"` hoặc `"batched"` và tin nhắn đến có văn bản trích dẫn đã chọn, OpenClaw gửi câu trả lời cuối cùng qua đường dẫn trả lời trích dẫn gốc của Telegram thay vì chỉnh sửa bản xem trước câu trả lời, nên `streaming.preview.toolProgress` không thể hiển thị các dòng trạng thái ngắn cho lượt đó. Các trả lời cho tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ phát trực tuyến bản xem trước. Đặt `replyToMode: "off"` khi khả năng nhìn thấy tiến trình công cụ quan trọng hơn trả lời trích dẫn gốc, hoặc đặt `streaming.preview.toolProgress: false` để chấp nhận đánh đổi này.
    </Note>

    Với trả lời chỉ có văn bản:

    - bản xem trước ngắn trong DM/nhóm/chủ đề: OpenClaw giữ cùng một tin nhắn xem trước và thực hiện chỉnh sửa cuối cùng tại chỗ, trừ khi một tin nhắn hiển thị không phải bản xem trước đã được gửi sau khi bản xem trước xuất hiện
    - bản xem trước theo sau bởi đầu ra hiển thị không phải bản xem trước: OpenClaw gửi câu trả lời hoàn chỉnh dưới dạng tin nhắn cuối cùng mới và dọn dẹp bản xem trước cũ hơn, để câu trả lời cuối cùng xuất hiện sau đầu ra trung gian
    - bản xem trước cũ hơn khoảng một phút: OpenClaw gửi câu trả lời hoàn chỉnh dưới dạng tin nhắn cuối cùng mới rồi dọn dẹp bản xem trước, để dấu thời gian hiển thị của Telegram phản ánh thời điểm hoàn tất thay vì thời điểm tạo bản xem trước

    Với các trả lời phức tạp (ví dụ payload phương tiện), OpenClaw quay về phân phối cuối cùng bình thường rồi dọn dẹp tin nhắn xem trước.

    Phát trực tuyến bản xem trước tách biệt với phát trực tuyến khối. Khi phát trực tuyến khối được bật rõ ràng cho Telegram, OpenClaw bỏ qua luồng xem trước để tránh phát trực tuyến hai lần.

    Luồng suy luận chỉ dành cho Telegram:

    - `/reasoning stream` gửi suy luận vào bản xem trước trực tiếp trong khi tạo
    - bản xem trước suy luận bị xóa sau khi phân phối cuối cùng; dùng `/reasoning on` khi suy luận cần tiếp tục hiển thị
    - câu trả lời cuối cùng được gửi không kèm văn bản suy luận

  </Accordion>

  <Accordion title="Định dạng và phương án dự phòng HTML">
    Văn bản gửi ra dùng Telegram `parse_mode: "HTML"`.

    - Văn bản kiểu Markdown được kết xuất thành HTML an toàn cho Telegram.
    - HTML thô từ mô hình được thoát ký tự để giảm lỗi phân tích cú pháp của Telegram.
    - Nếu Telegram từ chối HTML đã phân tích, OpenClaw thử lại dưới dạng văn bản thuần.

    Xem trước liên kết được bật theo mặc định và có thể tắt bằng `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Lệnh gốc và lệnh tùy chỉnh">
    Việc đăng ký menu lệnh Telegram được xử lý khi khởi động bằng `setMyCommands`.

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

    - tên được chuẩn hóa (bỏ `/` ở đầu, chuyển thành chữ thường)
    - mẫu hợp lệ: `a-z`, `0-9`, `_`, độ dài `1..32`
    - lệnh tùy chỉnh không thể ghi đè lệnh gốc
    - xung đột/trùng lặp bị bỏ qua và ghi log

    Ghi chú:

    - lệnh tùy chỉnh chỉ là mục menu; chúng không tự động triển khai hành vi
    - lệnh plugin/skill vẫn có thể hoạt động khi được nhập, ngay cả khi không hiển thị trong menu Telegram

    Nếu lệnh gốc bị tắt, các lệnh tích hợp sẽ bị gỡ bỏ. Lệnh tùy chỉnh/plugin vẫn có thể đăng ký nếu được cấu hình.

    Lỗi thiết lập thường gặp:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu Telegram vẫn vượt giới hạn sau khi cắt bớt; hãy giảm lệnh plugin/skill/tùy chỉnh hoặc tắt `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands` hoặc `setMyCommands` lỗi với `404: Not Found` trong khi lệnh curl trực tiếp tới Bot API hoạt động có thể nghĩa là `channels.telegram.apiRoot` đã được đặt thành toàn bộ endpoint `/bot<TOKEN>`. `apiRoot` chỉ được là gốc Bot API, và `openclaw doctor --fix` sẽ xóa phần đuôi `/bot<TOKEN>` vô tình thêm vào.
    - `getMe returned 401` nghĩa là Telegram đã từ chối token bot đã cấu hình. Cập nhật `botToken`, `tokenFile` hoặc `TELEGRAM_BOT_TOKEN` bằng token BotFather hiện tại; OpenClaw dừng trước khi polling nên lỗi này không được báo cáo như lỗi dọn dẹp Webhook.
    - `setMyCommands failed` với lỗi mạng/fetch thường nghĩa là DNS/HTTPS đi ra tới `api.telegram.org` bị chặn.

    ### Lệnh ghép nối thiết bị (plugin `device-pair`)

    Khi plugin `device-pair` được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ (bao gồm vai trò/phạm vi)
    4. phê duyệt yêu cầu:
       - `/pair approve <requestId>` để phê duyệt rõ ràng
       - `/pair approve` khi chỉ có một yêu cầu đang chờ
       - `/pair approve latest` cho yêu cầu gần đây nhất

    Mã thiết lập mang token bootstrap tồn tại ngắn hạn. Bàn giao bootstrap tích hợp giữ token nút chính ở `scopes: []`; mọi token toán tử được bàn giao vẫn bị giới hạn trong `operator.approvals`, `operator.read`, `operator.talk.secrets` và `operator.write`. Kiểm tra phạm vi bootstrap có tiền tố vai trò, nên danh sách cho phép toán tử đó chỉ đáp ứng các yêu cầu toán tử; các vai trò không phải toán tử vẫn cần phạm vi dưới tiền tố vai trò riêng của chúng.

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (ví dụ vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và yêu cầu mới dùng một `requestId` khác. Chạy lại `/pair pending` trước khi phê duyệt.

    Chi tiết khác: [Ghép nối](/vi/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    `capabilities: ["inlineButtons"]` cũ ánh xạ sang `inlineButtons: "all"`.

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

    Lượt bấm callback được chuyển cho agent dưới dạng văn bản:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Hành động tin nhắn Telegram cho agent và tự động hóa">
    Hành động công cụ Telegram bao gồm:

    - `sendMessage` (`to`, `content`, tùy chọn `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, tùy chọn `iconColor`, `iconCustomEmojiId`)

    Hành động tin nhắn kênh cung cấp các bí danh tiện dụng (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Điều khiển chặn:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (mặc định: tắt)

    Ghi chú: `edit` và `topic-create` hiện được bật theo mặc định và không có công tắc `channels.telegram.actions.*` riêng.
    Lệnh gửi lúc chạy dùng ảnh chụp nhanh cấu hình/bí mật đang hoạt động (khởi động/tải lại), nên các đường dẫn hành động không thực hiện phân giải lại SecretRef ad-hoc cho từng lần gửi.

    Ngữ nghĩa gỡ phản ứng: [/tools/reactions](/vi/tools/reactions)

  </Accordion>

  <Accordion title="Thẻ luồng trả lời">
    Telegram hỗ trợ thẻ luồng trả lời rõ ràng trong đầu ra được tạo:

    - `[[reply_to_current]]` trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` trả lời một ID tin nhắn Telegram cụ thể

    `channels.telegram.replyToMode` kiểm soát cách xử lý:

    - `off` (mặc định)
    - `first`
    - `all`

    Khi luồng trả lời được bật và văn bản hoặc chú thích Telegram gốc có sẵn, OpenClaw tự động bao gồm một đoạn trích dẫn Telegram gốc. Telegram giới hạn văn bản trích dẫn gốc ở 1024 đơn vị mã UTF-16, nên các tin nhắn dài hơn được trích dẫn từ đầu và quay về trả lời thuần nếu Telegram từ chối trích dẫn.

    Ghi chú: `off` tắt luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi luồng">
    Siêu nhóm diễn đàn:

    - khóa phiên chủ đề thêm `:topic:<threadId>`
    - trả lời và trạng thái đang nhập nhắm tới luồng chủ đề
    - đường dẫn cấu hình chủ đề:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Trường hợp đặc biệt của chủ đề chung (`threadId=1`):

    - lệnh gửi tin nhắn bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)`)
    - hành động đang nhập vẫn bao gồm `message_thread_id`

    Kế thừa chủ đề: các mục chủ đề kế thừa cài đặt nhóm trừ khi được ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` chỉ thuộc chủ đề và không kế thừa từ mặc định nhóm.

    **Định tuyến agent theo từng chủ đề**: Mỗi chủ đề có thể định tuyến tới một agent khác bằng cách đặt `agentId` trong cấu hình chủ đề. Điều này cấp cho mỗi chủ đề workspace, bộ nhớ và phiên riêng biệt. Ví dụ:

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

    Sau đó mỗi chủ đề có khóa phiên riêng: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liên kết chủ đề ACP bền vững**: Chủ đề diễn đàn có thể ghim phiên harness ACP thông qua liên kết ACP có kiểu ở cấp cao nhất (`bindings[]` với `type: "acp"` và `match.channel: "telegram"`, `peer.kind: "group"` và id đủ điều kiện theo chủ đề như `-1001234567890:topic:42`). Hiện được giới hạn trong các chủ đề diễn đàn trong nhóm/siêu nhóm. Xem [Agent ACP](/vi/tools/acp-agents).

    **Sinh ACP gắn với luồng từ chat**: `/acp spawn <agent> --thread here|auto` liên kết chủ đề hiện tại với một phiên ACP mới; các lượt tiếp theo định tuyến trực tiếp tới đó. OpenClaw ghim xác nhận sinh trong chủ đề. Yêu cầu `channels.telegram.threadBindings.spawnSessions` vẫn được bật (mặc định: `true`).

    Ngữ cảnh mẫu hiển thị `MessageThreadId` và `IsForum`. Các cuộc trò chuyện DM có `message_thread_id` giữ định tuyến DM và siêu dữ liệu trả lời trên phiên phẳng theo mặc định; chúng chỉ dùng khóa phiên nhận biết luồng khi được cấu hình với `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, hoặc cấu hình chủ đề khớp. Dùng `channels.telegram.dm.threadReplies` cấp cao nhất cho mặc định của tài khoản, hoặc `direct.<chatId>.threadReplies` cho một DM.

  </Accordion>

  <Accordion title="Âm thanh, video và sticker">
    ### Tin nhắn âm thanh

    Telegram phân biệt ghi âm thoại và tệp âm thanh.

    - mặc định: hành vi tệp âm thanh
    - thẻ `[[audio_as_voice]]` trong phản hồi của agent để buộc gửi dạng ghi âm thoại
    - bản chép lời ghi âm thoại đầu vào được đóng khung là văn bản do máy tạo,
      không đáng tin cậy trong ngữ cảnh agent; phát hiện đề cập vẫn dùng bản chép lời
      thô nên tin nhắn thoại có cổng đề cập vẫn tiếp tục hoạt động.

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

    Telegram phân biệt tệp video và ghi chú video.

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

    Xử lý sticker đầu vào:

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

    Sticker được mô tả một lần (khi có thể) và được lưu vào bộ nhớ đệm để giảm các lệnh gọi thị giác lặp lại.

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
    Phản ứng Telegram đến dưới dạng bản cập nhật `message_reaction` (tách biệt với payload tin nhắn).

    Khi được bật, OpenClaw đưa các sự kiện hệ thống vào hàng đợi, ví dụ:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Cấu hình:

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    Ghi chú:

    - `own` nghĩa là chỉ phản ứng của người dùng đối với tin nhắn do bot gửi (nỗ lực tốt nhất thông qua bộ nhớ đệm tin nhắn đã gửi).
    - Sự kiện phản ứng vẫn tuân thủ kiểm soát truy cập Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được phép sẽ bị loại bỏ.
    - Telegram không cung cấp ID luồng trong bản cập nhật phản ứng.
      - nhóm không phải diễn đàn định tuyến đến phiên trò chuyện nhóm
      - nhóm diễn đàn định tuyến đến phiên chủ đề chung của nhóm (`:topic:1`), không phải đúng chủ đề gốc

    `allowed_updates` cho polling/webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Phản ứng ack">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đầu vào.

    Thứ tự phân giải:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - dự phòng emoji danh tính agent (`agents.list[].identity.emoji`, nếu không thì "👀")

    Ghi chú:

    - Telegram mong đợi emoji unicode (ví dụ "👀").
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình từ sự kiện và lệnh Telegram">
    Ghi cấu hình kênh được bật theo mặc định (`configWrites !== false`).

    Các thao tác ghi do Telegram kích hoạt bao gồm:

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

    Trình nghe cục bộ bind vào `127.0.0.1:8787`. Đối với ingress công khai, hãy đặt reverse proxy trước cổng cục bộ hoặc chủ ý đặt `webhookHost: "0.0.0.0"`.

    Chế độ webhook xác thực các guard yêu cầu, token bí mật Telegram và thân JSON trước khi trả về `200` cho Telegram.
    Sau đó OpenClaw xử lý bản cập nhật bất đồng bộ thông qua cùng các làn bot theo từng cuộc trò chuyện/từng chủ đề được long polling dùng, nên lượt agent chậm không giữ ACK giao hàng của Telegram.

  </Accordion>

  <Accordion title="Giới hạn, thử lại và đích CLI">
    - `channels.telegram.textChunkLimit` mặc định là 4000.
    - `channels.telegram.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi chia theo độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước media Telegram đầu vào và đầu ra.
    - `channels.telegram.mediaGroupFlushMs` (mặc định 500) kiểm soát thời gian album/nhóm media Telegram được đệm trước khi OpenClaw dispatch chúng thành một tin nhắn đầu vào. Tăng giá trị này nếu các phần album đến muộn; giảm giá trị này để giảm độ trễ phản hồi album.
    - `channels.telegram.timeoutSeconds` ghi đè thời gian chờ của client Telegram API (nếu chưa đặt, mặc định grammY được áp dụng). Client bot kẹp các giá trị đã cấu hình thấp hơn guard yêu cầu văn bản/typing đầu ra 60 giây để grammY không hủy giao hàng phản hồi hiển thị trước khi guard vận chuyển và dự phòng của OpenClaw có thể chạy. Long polling vẫn dùng guard yêu cầu `getUpdates` 45 giây để các poll nhàn rỗi không bị bỏ mặc vô thời hạn.
    - `channels.telegram.pollingStallThresholdMs` mặc định là `120000`; chỉ tinh chỉnh trong khoảng `30000` đến `600000` cho các lần khởi động lại do polling bị kẹt dương tính giả.
    - lịch sử ngữ cảnh nhóm dùng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` sẽ tắt.
    - ngữ cảnh bổ sung trả lời/trích dẫn/chuyển tiếp hiện được truyền như đã nhận.
    - allowlist Telegram chủ yếu kiểm soát ai có thể kích hoạt agent, không phải ranh giới biên tập lại ngữ cảnh bổ sung đầy đủ.
    - Điều khiển lịch sử DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - cấu hình `channels.telegram.retry` áp dụng cho helper gửi Telegram (CLI/công cụ/hành động) đối với lỗi API đầu ra có thể khôi phục. Giao hàng phản hồi cuối đầu vào cũng dùng một lần thử lại gửi an toàn có giới hạn cho lỗi Telegram trước khi kết nối, nhưng không thử lại các envelope mạng mơ hồ sau khi gửi có thể nhân đôi tin nhắn hiển thị.

    Đích gửi CLI có thể là ID cuộc trò chuyện dạng số hoặc tên người dùng:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Poll Telegram dùng `openclaw message poll` và hỗ trợ chủ đề diễn đàn:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Cờ poll chỉ dành cho Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` cho chủ đề diễn đàn (hoặc dùng đích `:topic:`)

    Gửi Telegram cũng hỗ trợ:

    - `--presentation` với khối `buttons` cho bàn phím inline khi `channels.telegram.capabilities.inlineButtons` cho phép
    - `--pin` hoặc `--delivery '{"pin":true}'` để yêu cầu giao hàng được ghim khi bot có thể ghim trong cuộc trò chuyện đó
    - `--force-document` để gửi hình ảnh và GIF đầu ra dưới dạng tài liệu thay vì tải lên ảnh nén hoặc media động

    Kiểm soát hành động:

    - `channels.telegram.actions.sendMessage=false` tắt tin nhắn Telegram đầu ra, bao gồm cả poll
    - `channels.telegram.actions.poll=false` tắt tạo poll Telegram trong khi vẫn bật gửi thông thường

  </Accordion>

  <Accordion title="Phê duyệt exec trong Telegram">
    Telegram hỗ trợ phê duyệt exec trong DM của người phê duyệt và có thể tùy chọn đăng prompt trong cuộc trò chuyện hoặc chủ đề gốc. Người phê duyệt phải là ID người dùng Telegram dạng số.

    Đường dẫn cấu hình:

    - `channels.telegram.execApprovals.enabled` (tự động bật khi ít nhất một người phê duyệt có thể phân giải)
    - `channels.telegram.execApprovals.approvers` (dự phòng về ID chủ sở hữu dạng số từ `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (mặc định) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` và `defaultTo` kiểm soát ai có thể nói chuyện với bot và nơi bot gửi phản hồi thông thường. Chúng không biến ai đó thành người phê duyệt exec. Ghép cặp DM được phê duyệt đầu tiên bootstrap `commands.ownerAllowFrom` khi chưa có chủ sở hữu lệnh nào, nên thiết lập một chủ sở hữu vẫn hoạt động mà không cần sao chép ID trong `execApprovals.approvers`.

    Giao hàng kênh hiển thị văn bản lệnh trong cuộc trò chuyện; chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi prompt đến trong một chủ đề diễn đàn, OpenClaw giữ nguyên chủ đề cho prompt phê duyệt và phần theo dõi. Phê duyệt exec hết hạn sau 30 phút theo mặc định.

    Nút phê duyệt inline cũng yêu cầu `channels.telegram.capabilities.inlineButtons` cho phép bề mặt đích (`dm`, `group`, hoặc `all`). ID phê duyệt có tiền tố `plugin:` phân giải qua phê duyệt plugin; các ID khác phân giải qua phê duyệt exec trước.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Điều khiển phản hồi lỗi

Khi agent gặp lỗi giao hàng hoặc lỗi provider, Telegram có thể trả lời bằng văn bản lỗi hoặc chặn lỗi đó. Hai khóa cấu hình kiểm soát hành vi này:

| Khóa                                | Giá trị           | Mặc định | Mô tả                                                                                           |
| ----------------------------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` gửi tin nhắn lỗi thân thiện đến cuộc trò chuyện. `silent` chặn hoàn toàn phản hồi lỗi. |
| `channels.telegram.errorCooldownMs` | số (ms)           | `60000`  | Thời gian tối thiểu giữa các phản hồi lỗi đến cùng một cuộc trò chuyện. Ngăn spam lỗi khi có sự cố mất dịch vụ. |

Hỗ trợ ghi đè theo từng tài khoản, từng nhóm và từng chủ đề (cùng cơ chế kế thừa như các khóa cấu hình Telegram khác).

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
  <Accordion title="Bot không phản hồi tin nhắn nhóm không đề cập">

    - Nếu `requireMention=false`, chế độ riêng tư Telegram phải cho phép hiển thị đầy đủ.
      - BotFather: `/setprivacy` -> Disable
      - sau đó xóa + thêm lại bot vào nhóm
    - `openclaw channels status` cảnh báo khi cấu hình mong đợi tin nhắn nhóm không được đề cập.
    - `openclaw channels status --probe` có thể kiểm tra ID nhóm dạng số rõ ràng; wildcard `"*"` không thể được probe tư cách thành viên.
    - kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot hoàn toàn không thấy tin nhắn nhóm">

    - khi `channels.telegram.groups` tồn tại, nhóm phải được liệt kê (hoặc bao gồm `"*"`)
    - xác minh bot là thành viên trong nhóm
    - xem lại nhật ký: `openclaw logs --follow` để biết lý do bỏ qua

  </Accordion>

  <Accordion title="Lệnh hoạt động một phần hoặc hoàn toàn không hoạt động">

    - ủy quyền danh tính người gửi của bạn (ghép nối và/hoặc `allowFrom` dạng số)
    - ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`
    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu gốc có quá nhiều mục; giảm số lượng lệnh plugin/skill/tùy chỉnh hoặc tắt menu gốc
    - các lệnh khởi động `deleteMyCommands` / `setMyCommands` và lệnh hiển thị đang nhập `sendChatAction` được giới hạn thời gian và thử lại một lần qua phương án dự phòng truyền tải của Telegram khi yêu cầu hết thời gian chờ. Lỗi mạng/fetch kéo dài thường cho thấy vấn đề về khả năng truy cập DNS/HTTPS tới `api.telegram.org`

  </Accordion>

  <Accordion title="Khởi động báo cáo token chưa được ủy quyền">

    - `getMe returned 401` là lỗi xác thực Telegram đối với token bot đã cấu hình.
    - Sao chép lại hoặc tạo lại token bot trong BotFather, rồi cập nhật `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, hoặc `TELEGRAM_BOT_TOKEN` cho tài khoản mặc định.
    - `deleteWebhook 401 Unauthorized` trong quá trình khởi động cũng là lỗi xác thực; coi nó là "không có webhook nào tồn tại" sẽ chỉ trì hoãn cùng lỗi token sai đó sang các lệnh gọi API sau.

  </Accordion>

  <Accordion title="Polling hoặc mạng không ổn định">

    - Node 22+ + fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy ngay lập tức nếu kiểu AbortSignal không khớp.
    - Một số máy chủ phân giải `api.telegram.org` sang IPv6 trước; đầu ra IPv6 bị lỗi có thể gây lỗi Telegram API gián đoạn.
    - Nếu nhật ký bao gồm `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!`, OpenClaw hiện thử lại các lỗi này như lỗi mạng có thể khôi phục.
    - Trong quá trình khởi động polling, OpenClaw tái sử dụng probe `getMe` khởi động thành công cho grammY để runner không cần `getMe` lần thứ hai trước `getUpdates` đầu tiên.
    - Nếu `deleteWebhook` thất bại với lỗi mạng tạm thời trong quá trình khởi động polling, OpenClaw tiếp tục vào long polling thay vì thực hiện một lệnh gọi control-plane trước poll khác. Webhook vẫn đang hoạt động sẽ xuất hiện dưới dạng xung đột `getUpdates`; sau đó OpenClaw dựng lại truyền tải Telegram và thử lại dọn dẹp webhook.
    - Nếu socket Telegram tái tạo theo chu kỳ cố định ngắn, hãy kiểm tra `channels.telegram.timeoutSeconds` thấp; client bot kẹp các giá trị đã cấu hình thấp hơn các guard yêu cầu outbound và `getUpdates`, nhưng các bản phát hành cũ hơn có thể hủy mọi poll hoặc phản hồi khi giá trị này được đặt thấp hơn các guard đó.
    - Nếu nhật ký bao gồm `Polling stall detected`, OpenClaw khởi động lại polling và dựng lại truyền tải Telegram sau 120 giây không có liveness long-poll hoàn tất theo mặc định.
    - `openclaw channels status --probe` và `openclaw doctor` cảnh báo khi một tài khoản polling đang chạy chưa hoàn tất `getUpdates` sau thời gian gia hạn khởi động, khi một tài khoản webhook đang chạy chưa hoàn tất `setWebhook` sau thời gian gia hạn khởi động, hoặc khi hoạt động truyền tải polling thành công gần nhất đã cũ.
    - Chỉ tăng `channels.telegram.pollingStallThresholdMs` khi các lệnh gọi `getUpdates` chạy lâu vẫn khỏe mạnh nhưng máy chủ của bạn vẫn báo cáo sai các lần khởi động lại do polling bị đình trệ. Đình trệ kéo dài thường chỉ ra vấn đề proxy, DNS, IPv6 hoặc đầu ra TLS giữa máy chủ và `api.telegram.org`.
    - Telegram cũng tôn trọng env proxy của tiến trình cho truyền tải Bot API, bao gồm `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, và các biến chữ thường tương ứng. `NO_PROXY` / `no_proxy` vẫn có thể bỏ qua `api.telegram.org`.
    - Nếu proxy do OpenClaw quản lý được cấu hình qua `OPENCLAW_PROXY_URL` cho môi trường dịch vụ và không có env proxy chuẩn nào, Telegram cũng dùng URL đó cho truyền tải Bot API.
    - Trên máy chủ VPS có đầu ra/TLS trực tiếp không ổn định, định tuyến các lệnh gọi Telegram API qua `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định là `autoSelectFamily=true` (trừ WSL2). Thứ tự kết quả DNS của Telegram tôn trọng `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, rồi `channels.telegram.network.dnsResultOrder`, rồi mặc định của tiến trình như `NODE_OPTIONS=--dns-result-order=ipv4first`; nếu không có cấu hình nào áp dụng, Node 22+ quay về `ipv4first`.
    - Nếu máy chủ của bạn là WSL2 hoặc rõ ràng hoạt động tốt hơn với hành vi chỉ IPv4, hãy ép chọn họ địa chỉ:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Các phản hồi thuộc dải benchmark RFC 2544 (`198.18.0.0/15`) đã được cho phép
      cho tải xuống media Telegram theo mặc định. Nếu một proxy fake-IP hoặc
      proxy trong suốt đáng tin cậy ghi lại `api.telegram.org` thành một địa chỉ
      private/internal/special-use khác trong quá trình tải xuống media, bạn có thể chọn
      tham gia cơ chế bỏ qua chỉ dành cho Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Tùy chọn tham gia tương tự có sẵn theo từng tài khoản tại
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Nếu proxy của bạn phân giải máy chủ media Telegram thành `198.18.x.x`, trước tiên hãy để
      cờ nguy hiểm tắt. Media Telegram đã cho phép dải benchmark RFC 2544
      theo mặc định.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` làm yếu các biện pháp
      bảo vệ SSRF cho media Telegram. Chỉ dùng nó cho các môi trường proxy do
      operator đáng tin cậy kiểm soát như định tuyến fake-IP Clash, Mihomo hoặc Surge khi chúng
      tổng hợp các phản hồi private hoặc special-use ngoài dải benchmark RFC 2544.
      Hãy để tắt cho truy cập Telegram qua internet công cộng thông thường.
    </Warning>

    - Ghi đè môi trường (tạm thời):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Xác thực phản hồi DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Trợ giúp thêm: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Telegram](/vi/gateway/config-channels#telegram).

<Accordion title="Các trường Telegram tín hiệu cao">

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` phải trỏ tới một tệp thông thường; symlink bị từ chối)
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- phê duyệt exec: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- luồng/phản hồi: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- định dạng/phân phối: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/mạng: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- gốc API tùy chỉnh: `apiRoot` (chỉ gốc Bot API; không bao gồm `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- hành động/năng lực: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- lỗi: `errorPolicy`, `errorCooldownMs`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Độ ưu tiên nhiều tài khoản: khi hai hoặc nhiều ID tài khoản được cấu hình, hãy đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để định tuyến mặc định rõ ràng. Nếu không, OpenClaw quay về ID tài khoản đã chuẩn hóa đầu tiên và `openclaw doctor` cảnh báo. Tài khoản có tên kế thừa `channels.telegram.allowFrom` / `groupAllowFrom`, nhưng không kế thừa các giá trị `accounts.default.*`.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Telegram với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi danh sách cho phép của nhóm và chủ đề.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến vào các agent.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố.
  </Card>
  <Card title="Định tuyến nhiều agent" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ nhóm và chủ đề tới các agent.
  </Card>
  <Card title="Khắc phục sự cố" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh.
  </Card>
</CardGroup>
