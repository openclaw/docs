---
read_when:
    - Làm việc với các tính năng Telegram hoặc Webhook
summary: Trạng thái hỗ trợ, khả năng và cấu hình bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-12T12:48:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 185ac6051d3da2037b2727a6afca98bef946bc62c3f2b22cc9afe9831669297b
    source_path: channels/telegram.md
    workflow: 16
---

Sẵn sàng cho môi trường production đối với DM bot và nhóm qua grammY. Long polling là chế độ mặc định; chế độ webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và các playbook sửa chữa.
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

  <Step title="Thêm bot vào nhóm">
    Thêm bot vào nhóm của bạn, rồi lấy cả hai ID mà quyền truy cập nhóm cần:

    - ID người dùng Telegram của bạn, được dùng trong `allowFrom` / `groupAllowFrom`
    - ID cuộc trò chuyện nhóm Telegram, được dùng làm khóa dưới `channels.telegram.groups`

    Đối với thiết lập lần đầu, lấy ID cuộc trò chuyện nhóm từ `openclaw logs --follow`, một bot chuyển tiếp ID, hoặc Bot API `getUpdates`. Sau khi nhóm được cho phép, `/whoami@<bot_username>` có thể xác nhận ID người dùng và nhóm.

    ID siêu nhóm Telegram âm bắt đầu bằng `-100` là ID cuộc trò chuyện nhóm. Đặt chúng dưới `channels.telegram.groups`, không đặt dưới `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Thứ tự phân giải token có nhận biết tài khoản. Trong thực tế, giá trị config thắng dự phòng env, và `TELEGRAM_BOT_TOKEN` chỉ áp dụng cho tài khoản mặc định.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị trong nhóm">
    Bot Telegram mặc định dùng **Privacy Mode**, chế độ này giới hạn các tin nhắn nhóm mà chúng nhận được.

    Nếu bot phải thấy tất cả tin nhắn nhóm, hãy:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - đặt bot làm quản trị viên nhóm.

    Khi bật/tắt chế độ riêng tư, hãy gỡ + thêm lại bot trong từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền nhóm">
    Trạng thái quản trị viên được điều khiển trong cài đặt nhóm Telegram.

    Bot quản trị viên nhận tất cả tin nhắn nhóm, điều này hữu ích cho hành vi nhóm luôn bật.

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

    `dmPolicy: "open"` với `allowFrom: ["*"]` cho phép bất kỳ tài khoản Telegram nào tìm thấy hoặc đoán được tên người dùng bot ra lệnh cho bot. Chỉ dùng cho bot công khai có chủ đích với công cụ bị giới hạn chặt chẽ; bot một chủ sở hữu nên dùng `allowlist` với ID người dùng dạng số.

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    Trong cấu hình nhiều tài khoản, `channels.telegram.allowFrom` cấp cao nhất mang tính hạn chế được xem là ranh giới an toàn: các mục `allowFrom: ["*"]` ở cấp tài khoản không làm tài khoản đó thành công khai trừ khi allowlist hiệu dụng của tài khoản vẫn chứa ký tự đại diện rõ ràng sau khi hợp nhất.
    `dmPolicy: "allowlist"` với `allowFrom` trống chặn mọi DM và bị xác thực cấu hình từ chối.
    Thiết lập chỉ yêu cầu ID người dùng dạng số.
    Nếu bạn đã nâng cấp và config của bạn chứa các mục allowlist `@username`, hãy chạy `openclaw doctor --fix` để phân giải chúng (nỗ lực tối đa; yêu cầu token bot Telegram).
    Nếu trước đây bạn dựa vào tệp allowlist của kho ghép nối, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` trong luồng allowlist (ví dụ khi `dmPolicy: "allowlist"` chưa có ID rõ ràng nào).

    Đối với bot một chủ sở hữu, ưu tiên `dmPolicy: "allowlist"` với ID `allowFrom` dạng số rõ ràng để giữ chính sách truy cập bền vững trong config (thay vì phụ thuộc vào các phê duyệt ghép nối trước đó).

    Nhầm lẫn thường gặp: phê duyệt ghép nối DM không có nghĩa là "người gửi này được ủy quyền ở mọi nơi".
    Ghép nối cấp quyền truy cập DM. Nếu chưa có chủ sở hữu lệnh, ghép nối được phê duyệt đầu tiên cũng đặt `commands.ownerAllowFrom` để các lệnh chỉ dành cho chủ sở hữu và phê duyệt exec có một tài khoản vận hành rõ ràng.
    Ủy quyền người gửi trong nhóm vẫn đến từ các allowlist cấu hình rõ ràng.
    Nếu bạn muốn "tôi được ủy quyền một lần và cả DM lẫn lệnh nhóm đều hoạt động", hãy đặt ID người dùng Telegram dạng số của bạn trong `channels.telegram.allowFrom`; đối với lệnh chỉ dành cho chủ sở hữu, hãy đảm bảo `commands.ownerAllowFrom` chứa `telegram:<your user id>`.

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
    Hai điều khiển áp dụng cùng nhau:

    1. **Nhóm nào được cho phép** (`channels.telegram.groups`)
       - không có config `groups`:
         - với `groupPolicy: "open"`: bất kỳ nhóm nào cũng có thể vượt qua kiểm tra ID nhóm
         - với `groupPolicy: "allowlist"` (mặc định): các nhóm bị chặn cho đến khi bạn thêm mục `groups` (hoặc `"*"`)
       - đã cấu hình `groups`: hoạt động như allowlist (ID rõ ràng hoặc `"*"`)

    2. **Người gửi nào được cho phép trong nhóm** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (mặc định)
       - `disabled`

    `groupAllowFrom` được dùng để lọc người gửi trong nhóm. Nếu không đặt, Telegram quay về `allowFrom`.
    Các mục `groupAllowFrom` nên là ID người dùng Telegram dạng số (tiền tố `telegram:` / `tg:` được chuẩn hóa).
    Không đặt ID cuộc trò chuyện nhóm hoặc siêu nhóm Telegram trong `groupAllowFrom`. ID cuộc trò chuyện âm thuộc dưới `channels.telegram.groups`.
    Các mục không phải dạng số bị bỏ qua khi ủy quyền người gửi.
    Ranh giới bảo mật (`2026.2.25+`): xác thực người gửi trong nhóm **không** kế thừa phê duyệt từ kho ghép nối DM.
    Ghép nối chỉ dành cho DM. Đối với nhóm, đặt `groupAllowFrom` hoặc `allowFrom` theo nhóm/theo chủ đề.
    Nếu `groupAllowFrom` chưa đặt, Telegram quay về config `allowFrom`, không phải kho ghép nối.
    Mẫu thực tế cho bot một chủ sở hữu: đặt ID người dùng của bạn trong `channels.telegram.allowFrom`, để trống `groupAllowFrom`, và cho phép các nhóm mục tiêu dưới `channels.telegram.groups`.
    Ghi chú runtime: nếu `channels.telegram` hoàn toàn bị thiếu, runtime mặc định fail-closed `groupPolicy="allowlist"` trừ khi `channels.defaults.groupPolicy` được đặt rõ ràng.

    Thiết lập nhóm chỉ dành cho chủ sở hữu:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Kiểm tra từ nhóm bằng `@<bot_username> ping`. Tin nhắn nhóm thuần túy không kích hoạt bot khi `requireMention: true`.

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

    Ví dụ: chỉ cho phép người dùng cụ thể trong một nhóm cụ thể:

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

      - Đặt ID cuộc trò chuyện nhóm hoặc siêu nhóm Telegram âm như `-1001234567890` dưới `channels.telegram.groups`.
      - Đặt ID người dùng Telegram như `8734062810` dưới `groupAllowFrom` khi bạn muốn giới hạn những người trong một nhóm được cho phép có thể kích hoạt bot.
      - Chỉ dùng `groupAllowFrom: ["*"]` khi bạn muốn bất kỳ thành viên nào của một nhóm được cho phép có thể nói chuyện với bot.

    </Warning>

  </Tab>

  <Tab title="Hành vi nhắc đến">
    Theo mặc định, phản hồi nhóm yêu cầu nhắc đến.

    Nhắc đến có thể đến từ:

    - nhắc đến `@botusername` gốc, hoặc
    - mẫu nhắc đến trong:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Công tắc lệnh cấp phiên:

    - `/activation always`
    - `/activation mention`

    Những lệnh này chỉ cập nhật trạng thái phiên. Dùng config để duy trì lâu dài.

    Ví dụ cấu hình bền vững:

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

    Lấy ID cuộc trò chuyện nhóm:

    - chuyển tiếp một tin nhắn nhóm tới `@userinfobot` / `@getidsbot`
    - hoặc đọc `chat.id` từ `openclaw logs --follow`
    - hoặc kiểm tra Bot API `getUpdates`
    - sau khi nhóm được cho phép, chạy `/whoami@<bot_username>` nếu lệnh gốc được bật

  </Tab>
</Tabs>

## Hành vi runtime

- Telegram thuộc sở hữu của tiến trình gateway.
- Định tuyến mang tính xác định: tin nhắn vào từ Telegram trả lời lại Telegram (mô hình không chọn kênh).
- Tin nhắn vào được chuẩn hóa vào phong bì kênh dùng chung với siêu dữ liệu trả lời, placeholder phương tiện và ngữ cảnh chuỗi trả lời được lưu giữ cho các phản hồi Telegram mà gateway đã quan sát.
- Phiên nhóm được cô lập theo ID nhóm. Chủ đề diễn đàn thêm `:topic:<threadId>` để giữ các chủ đề cô lập.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw bảo toàn ID luồng cho phản hồi nhưng mặc định giữ DM trên phiên phẳng. Cấu hình `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, hoặc config chủ đề khớp khi bạn chủ ý muốn cô lập phiên chủ đề DM.
- Long polling dùng grammY runner với trình tự theo từng cuộc trò chuyện/từng luồng. Mức đồng thời sink runner tổng thể dùng `agents.defaults.maxConcurrent`.
- Long polling được bảo vệ bên trong từng tiến trình gateway để chỉ một poller hoạt động có thể dùng token bot tại một thời điểm. Nếu bạn vẫn thấy xung đột `getUpdates` 409, có khả năng một OpenClaw gateway, script hoặc poller bên ngoài khác đang dùng cùng token.
- Khởi động lại watchdog long-polling được kích hoạt sau 120 giây không có liveness `getUpdates` hoàn tất theo mặc định. Chỉ tăng `channels.telegram.pollingStallThresholdMs` nếu triển khai của bạn vẫn gặp khởi động lại do polling-stall giả trong lúc chạy tác vụ lâu. Giá trị tính bằng mili giây và được phép từ `30000` đến `600000`; hỗ trợ ghi đè theo tài khoản.
- Telegram Bot API không hỗ trợ xác nhận đã đọc (`sendReadReceipts` không áp dụng).

## Tham chiếu tính năng

<AccordionGroup>
  <Accordion title="Xem trước phát trực tiếp (chỉnh sửa tin nhắn)">
    OpenClaw có thể stream phản hồi từng phần theo thời gian thực:

    - trò chuyện trực tiếp: tin nhắn xem trước + `editMessageText`
    - nhóm/chủ đề: tin nhắn xem trước + `editMessageText`

    Yêu cầu:

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - `progress` giữ một bản nháp trạng thái có thể chỉnh sửa cho tiến độ công cụ, xóa nó khi hoàn tất và gửi câu trả lời cuối cùng dưới dạng tin nhắn bình thường
    - `streaming.preview.toolProgress` kiểm soát việc các cập nhật công cụ/tiến độ có dùng lại cùng một tin nhắn xem trước đã chỉnh sửa hay không (mặc định: `true` khi phát trực tuyến bản xem trước đang hoạt động)
    - `streaming.preview.commandText` kiểm soát chi tiết lệnh/thực thi bên trong các dòng tiến độ công cụ đó: `raw` (mặc định, giữ nguyên hành vi đã phát hành) hoặc `status` (chỉ nhãn công cụ)
    - các giá trị cũ `channels.telegram.streamMode` và boolean `streaming` được phát hiện; chạy `openclaw doctor --fix` để di chuyển chúng sang `channels.telegram.streaming.mode`

    Các cập nhật bản xem trước tiến độ công cụ là những dòng trạng thái ngắn hiển thị trong khi công cụ chạy, ví dụ như thực thi lệnh, đọc tệp, cập nhật kế hoạch hoặc tóm tắt bản vá. Telegram bật mặc định các cập nhật này để khớp với hành vi OpenClaw đã phát hành từ `v2026.4.22` trở đi. Để giữ bản xem trước đã chỉnh sửa cho văn bản câu trả lời nhưng ẩn các dòng tiến độ công cụ, hãy đặt:

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

    Để giữ tiến độ công cụ hiển thị nhưng ẩn văn bản lệnh/thực thi, hãy đặt:

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

    Dùng chế độ `progress` khi bạn muốn tiến độ công cụ hiển thị mà không chỉnh sửa câu trả lời cuối cùng vào chính tin nhắn đó. Đặt chính sách văn bản lệnh dưới `streaming.progress`:

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

    Chỉ dùng `streaming.mode: "off"` khi bạn muốn chỉ gửi kết quả cuối cùng: các chỉnh sửa bản xem trước Telegram bị tắt và phần trao đổi chung về công cụ/tiến độ bị chặn thay vì được gửi dưới dạng tin nhắn trạng thái độc lập. Lời nhắc phê duyệt, payload phương tiện và lỗi vẫn được định tuyến qua cơ chế gửi cuối cùng bình thường. Dùng `streaming.preview.toolProgress: false` khi bạn chỉ muốn giữ các chỉnh sửa bản xem trước câu trả lời trong khi ẩn các dòng trạng thái tiến độ công cụ.

    <Note>
      Các phản hồi trích dẫn được chọn của Telegram là ngoại lệ. Khi `replyToMode` là `"first"`, `"all"` hoặc `"batched"` và tin nhắn đến bao gồm văn bản trích dẫn đã chọn, OpenClaw gửi câu trả lời cuối cùng qua đường dẫn phản hồi trích dẫn gốc của Telegram thay vì chỉnh sửa bản xem trước câu trả lời, vì vậy `streaming.preview.toolProgress` không thể hiển thị các dòng trạng thái ngắn cho lượt đó. Các phản hồi tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ phát trực tuyến bản xem trước. Đặt `replyToMode: "off"` khi khả năng hiển thị tiến độ công cụ quan trọng hơn phản hồi trích dẫn gốc, hoặc đặt `streaming.preview.toolProgress: false` để chấp nhận đánh đổi này.
    </Note>

    Đối với phản hồi chỉ có văn bản:

    - bản xem trước ngắn trong DM/nhóm/chủ đề: OpenClaw giữ cùng một tin nhắn xem trước và thực hiện chỉnh sửa cuối cùng tại chỗ
    - các kết quả văn bản dài bị chia thành nhiều tin nhắn Telegram sẽ dùng lại bản xem trước hiện có làm phần kết quả đầu tiên khi có thể, rồi chỉ gửi các phần còn lại
    - kết quả ở chế độ tiến độ sẽ xóa bản nháp trạng thái và dùng cơ chế gửi cuối cùng bình thường thay vì chỉnh sửa bản nháp thành câu trả lời
    - nếu chỉnh sửa cuối cùng thất bại trước khi văn bản hoàn tất được xác nhận, OpenClaw dùng cơ chế gửi cuối cùng bình thường và dọn dẹp bản xem trước cũ

    Đối với phản hồi phức tạp (ví dụ payload phương tiện), OpenClaw chuyển về cơ chế gửi cuối cùng bình thường rồi dọn dẹp tin nhắn xem trước.

    Phát trực tuyến bản xem trước tách biệt với phát trực tuyến theo khối. Khi phát trực tuyến theo khối được bật rõ ràng cho Telegram, OpenClaw bỏ qua luồng bản xem trước để tránh phát trực tuyến hai lần.

    Luồng suy luận chỉ dành cho Telegram:

    - `/reasoning stream` gửi suy luận tới bản xem trước trực tiếp trong khi tạo
    - bản xem trước suy luận bị xóa sau khi gửi kết quả cuối cùng; dùng `/reasoning on` khi suy luận cần tiếp tục hiển thị
    - câu trả lời cuối cùng được gửi không kèm văn bản suy luận

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    Văn bản gửi ra dùng Telegram `parse_mode: "HTML"`.

    - Văn bản kiểu Markdown được kết xuất thành HTML an toàn cho Telegram.
    - Các thẻ HTML được Telegram hỗ trợ được giữ nguyên; HTML không được hỗ trợ sẽ được escape.
    - Nếu Telegram từ chối HTML đã phân tích, OpenClaw thử lại dưới dạng văn bản thuần.

    Bản xem trước liên kết được bật mặc định và có thể tắt bằng `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
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

    - tên được chuẩn hóa (bỏ `/` ở đầu, chuyển thành chữ thường)
    - mẫu hợp lệ: `a-z`, `0-9`, `_`, độ dài `1..32`
    - lệnh tùy chỉnh không thể ghi đè lệnh gốc
    - xung đột/trùng lặp bị bỏ qua và ghi log

    Ghi chú:

    - lệnh tùy chỉnh chỉ là mục menu; chúng không tự động triển khai hành vi
    - lệnh Plugin/skill vẫn có thể hoạt động khi được gõ, ngay cả khi không hiển thị trong menu Telegram

    Nếu lệnh gốc bị tắt, các lệnh tích hợp sẽ bị xóa. Lệnh tùy chỉnh/Plugin vẫn có thể đăng ký nếu được cấu hình.

    Các lỗi thiết lập thường gặp:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu Telegram vẫn vượt giới hạn sau khi cắt bớt; hãy giảm lệnh Plugin/skill/tùy chỉnh hoặc tắt `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands` hoặc `setMyCommands` thất bại với `404: Not Found` trong khi các lệnh curl trực tiếp tới Bot API vẫn hoạt động có thể nghĩa là `channels.telegram.apiRoot` đã được đặt thành endpoint đầy đủ `/bot<TOKEN>`. `apiRoot` phải chỉ là gốc Bot API, và `openclaw doctor --fix` sẽ xóa phần đuôi `/bot<TOKEN>` vô tình thêm vào.
    - `getMe returned 401` nghĩa là Telegram đã từ chối token bot đã cấu hình. Cập nhật `botToken`, `tokenFile` hoặc `TELEGRAM_BOT_TOKEN` bằng token BotFather hiện tại; OpenClaw dừng trước khi polling nên điều này không được báo cáo như lỗi dọn dẹp webhook.
    - `setMyCommands failed` với lỗi mạng/fetch thường nghĩa là DNS/HTTPS gửi ra tới `api.telegram.org` đang bị chặn.

    ### Lệnh ghép nối thiết bị (Plugin `device-pair`)

    Khi Plugin `device-pair` được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ (bao gồm vai trò/phạm vi)
    4. phê duyệt yêu cầu:
       - `/pair approve <requestId>` để phê duyệt rõ ràng
       - `/pair approve` khi chỉ có một yêu cầu đang chờ
       - `/pair approve latest` cho yêu cầu gần đây nhất

    Mã thiết lập mang một token bootstrap ngắn hạn. Chuyển giao bootstrap tích hợp giữ token nút chính ở `scopes: []`; mọi token người vận hành được chuyển giao vẫn bị giới hạn trong `operator.approvals`, `operator.read`, `operator.talk.secrets` và `operator.write`. Kiểm tra phạm vi bootstrap có tiền tố vai trò, vì vậy danh sách cho phép người vận hành đó chỉ thỏa mãn yêu cầu của người vận hành; các vai trò không phải người vận hành vẫn cần phạm vi dưới tiền tố vai trò riêng của chúng.

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (ví dụ vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và yêu cầu mới dùng một `requestId` khác. Chạy lại `/pair pending` trước khi phê duyệt.

    Chi tiết thêm: [Ghép nối](/vi/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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

    Ghi đè theo tài khoản:

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

    Các lần bấm callback được chuyển cho agent dưới dạng văn bản:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Hành động công cụ Telegram bao gồm:

    - `sendMessage` (`to`, `content`, tùy chọn `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, tùy chọn `iconColor`, `iconCustomEmojiId`)

    Hành động tin nhắn kênh cung cấp các bí danh tiện dụng (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Điều khiển cổng kiểm soát:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (mặc định: tắt)

    Lưu ý: `edit` và `topic-create` hiện được bật mặc định và không có công tắc `channels.telegram.actions.*` riêng.
    Các lần gửi runtime dùng ảnh chụp nhanh cấu hình/bí mật đang hoạt động (khởi động/tải lại), vì vậy các đường dẫn hành động không thực hiện phân giải lại SecretRef tùy biến cho từng lần gửi.

    Ngữ nghĩa gỡ phản ứng: [/tools/reactions](/vi/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram hỗ trợ các thẻ luồng phản hồi rõ ràng trong đầu ra được tạo:

    - `[[reply_to_current]]` phản hồi tin nhắn kích hoạt
    - `[[reply_to:<id>]]` phản hồi một ID tin nhắn Telegram cụ thể

    `channels.telegram.replyToMode` kiểm soát cách xử lý:

    - `off` (mặc định)
    - `first`
    - `all`

    Khi luồng phản hồi được bật và văn bản hoặc chú thích Telegram gốc có sẵn, OpenClaw tự động bao gồm một đoạn trích dẫn Telegram gốc. Telegram giới hạn văn bản trích dẫn gốc ở 1024 đơn vị mã UTF-16, vì vậy các tin nhắn dài hơn được trích dẫn từ phần đầu và chuyển về phản hồi thuần nếu Telegram từ chối trích dẫn.

    Lưu ý: `off` tắt luồng phản hồi ngầm định. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Siêu nhóm diễn đàn:

    - khóa phiên chủ đề thêm `:topic:<threadId>`
    - phản hồi và trạng thái đang nhập nhắm tới luồng chủ đề
    - đường dẫn cấu hình chủ đề:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Trường hợp đặc biệt chủ đề chung (`threadId=1`):

    - gửi tin nhắn bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)`)
    - hành động đang nhập vẫn bao gồm `message_thread_id`

    Kế thừa chủ đề: mục chủ đề kế thừa cài đặt nhóm trừ khi bị ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` chỉ thuộc chủ đề và không kế thừa từ mặc định nhóm.

    **Định tuyến agent theo chủ đề**: Mỗi chủ đề có thể định tuyến tới một agent khác bằng cách đặt `agentId` trong cấu hình chủ đề. Điều này cung cấp cho mỗi chủ đề workspace, bộ nhớ và phiên riêng biệt. Ví dụ:

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

    Mỗi chủ đề sau đó có khóa phiên riêng: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liên kết chủ đề ACP bền vững**: Các chủ đề diễn đàn có thể ghim phiên harness ACP thông qua các liên kết ACP có kiểu ở cấp cao nhất (`bindings[]` với `type: "acp"` và `match.channel: "telegram"`, `peer.kind: "group"`, cùng một id đủ điều kiện theo chủ đề như `-1001234567890:topic:42`). Hiện chỉ giới hạn cho các chủ đề diễn đàn trong nhóm/siêu nhóm. Xem [Tác tử ACP](/vi/tools/acp-agents).

    **Sinh ACP gắn với luồng từ cuộc trò chuyện**: `/acp spawn <agent> --thread here|auto` liên kết chủ đề hiện tại với một phiên ACP mới; các lượt theo dõi sẽ được định tuyến trực tiếp đến đó. OpenClaw ghim xác nhận sinh trong chủ đề. Yêu cầu `channels.telegram.threadBindings.spawnSessions` vẫn được bật (mặc định: `true`).

    Ngữ cảnh mẫu hiển thị `MessageThreadId` và `IsForum`. Các cuộc trò chuyện DM có `message_thread_id` mặc định vẫn giữ định tuyến DM và siêu dữ liệu trả lời trên phiên phẳng; chúng chỉ dùng khóa phiên nhận biết luồng khi được cấu hình với `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, hoặc một cấu hình chủ đề khớp. Dùng `channels.telegram.dm.threadReplies` ở cấp cao nhất cho mặc định của tài khoản, hoặc `direct.<chatId>.threadReplies` cho một DM.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Tin nhắn âm thanh

    Telegram phân biệt ghi chú thoại và tệp âm thanh.

    - mặc định: hành vi tệp âm thanh
    - thẻ `[[audio_as_voice]]` trong phản hồi tác tử để buộc gửi dưới dạng ghi chú thoại
    - bản chép lời ghi chú thoại đến được đóng khung là văn bản do máy tạo,
      không đáng tin cậy trong ngữ cảnh tác tử; phát hiện nhắc tên vẫn dùng bản chép lời
      thô nên tin nhắn thoại bị kiểm soát bằng nhắc tên vẫn tiếp tục hoạt động.

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

    ### Nhãn dán

    Xử lý nhãn dán đến:

    - WEBP tĩnh: được tải xuống và xử lý (placeholder `<media:sticker>`)
    - TGS động: bỏ qua
    - WEBM video: bỏ qua

    Các trường ngữ cảnh nhãn dán:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Tệp bộ nhớ đệm nhãn dán:

    - `~/.openclaw/telegram/sticker-cache.json`

    Nhãn dán được mô tả một lần (khi có thể) và được lưu vào bộ nhớ đệm để giảm các lần gọi thị giác lặp lại.

    Bật hành động nhãn dán:

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

    Hành động gửi nhãn dán:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Tìm kiếm nhãn dán đã lưu trong bộ nhớ đệm:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction notifications">
    Phản ứng Telegram đến dưới dạng cập nhật `message_reaction` (tách biệt với payload tin nhắn).

    Khi được bật, OpenClaw đưa các sự kiện hệ thống như sau vào hàng đợi:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Cấu hình:

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    Ghi chú:

    - `own` nghĩa là chỉ phản ứng của người dùng đối với tin nhắn do bot gửi (nỗ lực tối đa thông qua bộ nhớ đệm tin nhắn đã gửi).
    - Sự kiện phản ứng vẫn tuân theo kiểm soát truy cập Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được phép sẽ bị loại bỏ.
    - Telegram không cung cấp ID luồng trong cập nhật phản ứng.
      - nhóm không phải diễn đàn định tuyến đến phiên trò chuyện nhóm
      - nhóm diễn đàn định tuyến đến phiên chủ đề chung của nhóm (`:topic:1`), không phải đúng chủ đề gốc

    `allowed_updates` cho polling/webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn đến.

    Thứ tự phân giải:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - dự phòng emoji danh tính tác tử (`agents.list[].identity.emoji`, nếu không thì "👀")

    Ghi chú:

    - Telegram yêu cầu emoji unicode (ví dụ "👀").
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
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

  <Accordion title="Long polling vs webhook">
    Mặc định là long polling. Đối với chế độ webhook, đặt `channels.telegram.webhookUrl` và `channels.telegram.webhookSecret`; tùy chọn `webhookPath`, `webhookHost`, `webhookPort` (mặc định `/telegram-webhook`, `127.0.0.1`, `8787`).

    Ở chế độ long-polling, OpenClaw chỉ lưu watermark khởi động lại sau khi một cập nhật được điều phối thành công. Nếu một handler thất bại, cập nhật đó vẫn có thể được thử lại trong cùng tiến trình và không được ghi là đã hoàn tất để khử trùng lặp khi khởi động lại.

    Bộ lắng nghe cục bộ liên kết với `127.0.0.1:8787`. Đối với lưu lượng vào công khai, hãy đặt reverse proxy phía trước cổng cục bộ hoặc chủ ý đặt `webhookHost: "0.0.0.0"`.

    Chế độ webhook xác thực các guard yêu cầu, token bí mật Telegram và thân JSON trước khi trả về `200` cho Telegram.
    Sau đó OpenClaw xử lý cập nhật bất đồng bộ qua cùng các làn bot theo từng cuộc trò chuyện/từng chủ đề được long polling sử dụng, nên các lượt tác tử chậm không giữ ACK giao hàng của Telegram.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - Mặc định của `channels.telegram.textChunkLimit` là 4000.
    - `channels.telegram.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi chia theo độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước phương tiện Telegram đến và đi.
    - `channels.telegram.mediaGroupFlushMs` (mặc định 500) kiểm soát thời gian album/nhóm phương tiện Telegram được đệm trước khi OpenClaw điều phối chúng thành một tin nhắn đến. Tăng giá trị này nếu các phần album đến muộn; giảm để giảm độ trễ phản hồi album.
    - `channels.telegram.timeoutSeconds` ghi đè thời gian chờ của client API Telegram (nếu không đặt, mặc định grammY được áp dụng). Client bot kẹp các giá trị được cấu hình thấp hơn guard yêu cầu văn bản/đang nhập chiều đi 60 giây để grammY không hủy giao hàng phản hồi hiển thị trước khi guard vận chuyển và dự phòng của OpenClaw có thể chạy. Long polling vẫn dùng guard yêu cầu `getUpdates` 45 giây để các lượt polling nhàn rỗi không bị bỏ mặc vô thời hạn.
    - `channels.telegram.pollingStallThresholdMs` mặc định là `120000`; chỉ tinh chỉnh trong khoảng `30000` đến `600000` cho các lần khởi động lại do polling bị kẹt dương tính giả.
    - lịch sử ngữ cảnh nhóm dùng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` sẽ tắt.
    - ngữ cảnh bổ sung trả lời/trích dẫn/chuyển tiếp được chuẩn hóa vào một cửa sổ ngữ cảnh hội thoại được chọn khi Gateway đã quan sát các tin nhắn cha; bộ nhớ đệm tin nhắn đã quan sát được lưu bền vững bên cạnh kho phiên. Telegram chỉ bao gồm một `reply_to_message` nông trong cập nhật, nên các chuỗi cũ hơn bộ nhớ đệm bị giới hạn bởi payload cập nhật hiện tại của Telegram.
    - allowlist Telegram chủ yếu kiểm soát ai có thể kích hoạt tác tử, không phải là ranh giới biên tập ngữ cảnh bổ sung đầy đủ.
    - Điều khiển lịch sử DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - cấu hình `channels.telegram.retry` áp dụng cho các helper gửi Telegram (CLI/công cụ/hành động) đối với lỗi API chiều đi có thể khôi phục. Giao hàng phản hồi cuối cùng cho tin nhắn đến cũng dùng cơ chế thử lại gửi an toàn có giới hạn cho lỗi trước khi kết nối Telegram, nhưng không thử lại các phong bì mạng mơ hồ sau khi gửi vì có thể nhân đôi tin nhắn hiển thị.

    Mục tiêu gửi của CLI và công cụ tin nhắn có thể là ID trò chuyện số, username, hoặc mục tiêu chủ đề diễn đàn:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Poll Telegram dùng `openclaw message poll` và hỗ trợ chủ đề diễn đàn:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Các cờ poll chỉ dành cho Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` cho chủ đề diễn đàn (hoặc dùng mục tiêu `:topic:`)

    Gửi Telegram cũng hỗ trợ:

    - `--presentation` với các khối `buttons` cho bàn phím inline khi `channels.telegram.capabilities.inlineButtons` cho phép
    - `--pin` hoặc `--delivery '{"pin":true}'` để yêu cầu giao hàng được ghim khi bot có thể ghim trong cuộc trò chuyện đó
    - `--force-document` để gửi hình ảnh, GIF và video chiều đi dưới dạng tài liệu thay vì tải lên dưới dạng ảnh nén, phương tiện động, hoặc video

    Kiểm soát hành động:

    - `channels.telegram.actions.sendMessage=false` tắt tin nhắn Telegram chiều đi, bao gồm cả poll
    - `channels.telegram.actions.poll=false` tắt tạo poll Telegram nhưng vẫn bật gửi thông thường

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram hỗ trợ phê duyệt exec trong DM của người phê duyệt và có thể tùy chọn đăng lời nhắc trong cuộc trò chuyện hoặc chủ đề gốc. Người phê duyệt phải là ID người dùng Telegram dạng số.

    Đường dẫn cấu hình:

    - `channels.telegram.execApprovals.enabled` (tự động bật khi ít nhất một người phê duyệt có thể phân giải được)
    - `channels.telegram.execApprovals.approvers` (dự phòng sang ID chủ sở hữu dạng số từ `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (mặc định) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, và `defaultTo` kiểm soát ai có thể nói chuyện với bot và bot gửi phản hồi thông thường ở đâu. Chúng không biến ai đó thành người phê duyệt exec. Cặp DM được phê duyệt đầu tiên khởi tạo `commands.ownerAllowFrom` khi chưa có chủ sở hữu lệnh, nên thiết lập một chủ sở hữu vẫn hoạt động mà không cần lặp ID trong `execApprovals.approvers`.

    Giao hàng kênh hiển thị văn bản lệnh trong cuộc trò chuyện; chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi lời nhắc đến một chủ đề diễn đàn, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và lượt theo dõi. Phê duyệt exec hết hạn sau 30 phút theo mặc định.

    Nút phê duyệt inline cũng yêu cầu `channels.telegram.capabilities.inlineButtons` cho phép bề mặt đích (`dm`, `group`, hoặc `all`). ID phê duyệt có tiền tố `plugin:` phân giải qua phê duyệt plugin; các ID khác phân giải qua phê duyệt exec trước.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Điều khiển trả lời lỗi

Khi agent gặp lỗi phân phối hoặc lỗi nhà cung cấp, Telegram có thể trả lời bằng văn bản lỗi hoặc ẩn lỗi đó. Hai khóa cấu hình kiểm soát hành vi này:

| Khóa                                | Giá trị           | Mặc định | Mô tả                                                                                           |
| ----------------------------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` gửi một thông báo lỗi thân thiện tới cuộc trò chuyện. `silent` ẩn hoàn toàn trả lời lỗi. |
| `channels.telegram.errorCooldownMs` | số (ms)           | `60000`  | Thời gian tối thiểu giữa các trả lời lỗi tới cùng một cuộc trò chuyện. Ngăn spam lỗi khi có sự cố ngừng hoạt động. |

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
  <Accordion title="Bot does not respond to non mention group messages">

    - Nếu `requireMention=false`, chế độ quyền riêng tư của Telegram phải cho phép hiển thị đầy đủ.
      - BotFather: `/setprivacy` -> Disable
      - sau đó xóa + thêm lại bot vào nhóm
    - `openclaw channels status` cảnh báo khi cấu hình mong đợi tin nhắn nhóm không nhắc tên.
    - `openclaw channels status --probe` có thể kiểm tra ID nhóm dạng số rõ ràng; ký tự đại diện `"*"` không thể được kiểm tra tư cách thành viên.
    - kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - khi có `channels.telegram.groups`, nhóm phải được liệt kê (hoặc bao gồm `"*"`)
    - xác minh tư cách thành viên của bot trong nhóm
    - xem lại nhật ký: `openclaw logs --follow` để biết lý do bỏ qua

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - ủy quyền danh tính người gửi của bạn (ghép đôi và/hoặc `allowFrom` dạng số)
    - ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`
    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu gốc có quá nhiều mục; giảm lệnh plugin/skill/tùy chỉnh hoặc tắt menu gốc
    - Các lệnh khởi động `deleteMyCommands` / `setMyCommands` và các lệnh nhập trạng thái `sendChatAction` đều có giới hạn thời gian và thử lại một lần qua phương án dự phòng truyền tải của Telegram khi yêu cầu hết thời gian chờ. Lỗi mạng/fetch kéo dài thường cho thấy vấn đề khả dụng DNS/HTTPS tới `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` là lỗi xác thực Telegram cho token bot đã cấu hình.
    - Sao chép lại hoặc tạo lại token bot trong BotFather, rồi cập nhật `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, hoặc `TELEGRAM_BOT_TOKEN` cho tài khoản mặc định.
    - `deleteWebhook 401 Unauthorized` trong lúc khởi động cũng là lỗi xác thực; coi nó như "không có webhook tồn tại" chỉ trì hoãn cùng lỗi token sai đó sang các lệnh gọi API sau.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy ngay lập tức nếu kiểu AbortSignal không khớp.
    - Một số máy chủ phân giải `api.telegram.org` sang IPv6 trước; egress IPv6 bị lỗi có thể gây ra lỗi API Telegram không liên tục.
    - Nếu nhật ký bao gồm `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!`, OpenClaw hiện thử lại các lỗi này như lỗi mạng có thể khôi phục.
    - Trong lúc khởi động polling, OpenClaw tái sử dụng probe `getMe` khởi động thành công cho grammY để runner không cần một `getMe` thứ hai trước `getUpdates` đầu tiên.
    - Nếu `deleteWebhook` thất bại với lỗi mạng tạm thời trong lúc khởi động polling, OpenClaw tiếp tục vào long polling thay vì thực hiện một lệnh gọi control-plane trước polling khác. Webhook vẫn còn hoạt động sẽ xuất hiện dưới dạng xung đột `getUpdates`; khi đó OpenClaw dựng lại truyền tải Telegram và thử lại dọn dẹp webhook.
    - Nếu socket Telegram được tái tạo theo một chu kỳ cố định ngắn, hãy kiểm tra `channels.telegram.timeoutSeconds` thấp; bot client kẹp các giá trị đã cấu hình thấp hơn các bộ bảo vệ yêu cầu outbound và `getUpdates`, nhưng các bản phát hành cũ hơn có thể hủy mọi lượt polling hoặc trả lời khi giá trị này thấp hơn các bộ bảo vệ đó.
    - Nếu nhật ký bao gồm `Polling stall detected`, OpenClaw khởi động lại polling và dựng lại truyền tải Telegram sau 120 giây không có liveness long-poll hoàn tất theo mặc định.
    - `openclaw channels status --probe` và `openclaw doctor` cảnh báo khi một tài khoản polling đang chạy chưa hoàn tất `getUpdates` sau thời gian gia hạn khởi động, khi một tài khoản webhook đang chạy chưa hoàn tất `setWebhook` sau thời gian gia hạn khởi động, hoặc khi hoạt động truyền tải polling thành công gần nhất đã cũ.
    - Chỉ tăng `channels.telegram.pollingStallThresholdMs` khi các lệnh gọi `getUpdates` chạy lâu vẫn khỏe mạnh nhưng máy chủ của bạn vẫn báo nhầm các lần khởi động lại do polling-stall. Tình trạng stall kéo dài thường chỉ ra vấn đề proxy, DNS, IPv6 hoặc TLS egress giữa máy chủ và `api.telegram.org`.
    - Telegram cũng tôn trọng env proxy của tiến trình cho truyền tải Bot API, bao gồm `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và các biến chữ thường tương ứng. `NO_PROXY` / `no_proxy` vẫn có thể bỏ qua `api.telegram.org`.
    - Nếu proxy do OpenClaw quản lý được cấu hình qua `OPENCLAW_PROXY_URL` cho môi trường dịch vụ và không có env proxy tiêu chuẩn, Telegram cũng dùng URL đó cho truyền tải Bot API.
    - Trên máy chủ VPS có egress/TLS trực tiếp không ổn định, định tuyến các lệnh gọi API Telegram qua `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định là `autoSelectFamily=true` (trừ WSL2). Thứ tự kết quả DNS của Telegram tôn trọng `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sau đó `channels.telegram.network.dnsResultOrder`, sau đó mặc định của tiến trình như `NODE_OPTIONS=--dns-result-order=ipv4first`; nếu không áp dụng mục nào, Node 22+ quay về `ipv4first`.
    - Nếu máy chủ của bạn là WSL2 hoặc rõ ràng hoạt động tốt hơn với hành vi chỉ IPv4, hãy buộc chọn family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Câu trả lời dải benchmark RFC 2544 (`198.18.0.0/15`) đã được cho phép
      cho tải xuống media Telegram theo mặc định. Nếu một fake-IP đáng tin cậy hoặc
      proxy trong suốt ghi lại `api.telegram.org` thành một địa chỉ
      riêng tư/nội bộ/dùng đặc biệt khác trong lúc tải xuống media, bạn có thể chọn
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
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` làm suy yếu các biện pháp bảo vệ SSRF
      cho media Telegram. Chỉ dùng nó cho môi trường proxy đáng tin cậy do operator kiểm soát
      như định tuyến fake-IP của Clash, Mihomo hoặc Surge khi chúng
      tổng hợp các câu trả lời riêng tư hoặc dùng đặc biệt ngoài dải benchmark RFC 2544.
      Hãy để tắt cho truy cập Telegram internet công cộng thông thường.
    </Warning>

    - Ghi đè môi trường (tạm thời):
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

<Accordion title="High-signal Telegram fields">

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` phải trỏ tới một tệp thông thường; symlink bị từ chối)
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- phê duyệt thực thi: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- luồng/trả lời: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (bản xem trước), `streaming.preview.toolProgress`, `blockStreaming`
- định dạng/phân phối: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/mạng: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- gốc API tùy chỉnh: `apiRoot` (chỉ gốc Bot API; không bao gồm `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- hành động/capability: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- lỗi: `errorPolicy`, `errorCooldownMs`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Thứ tự ưu tiên nhiều tài khoản: khi hai ID tài khoản trở lên được cấu hình, hãy đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để làm rõ định tuyến mặc định. Nếu không, OpenClaw quay về ID tài khoản đã chuẩn hóa đầu tiên và `openclaw doctor` cảnh báo. Tài khoản được đặt tên kế thừa `channels.telegram.allowFrom` / `groupAllowFrom`, nhưng không kế thừa các giá trị `accounts.default.*`.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Ghép đôi người dùng Telegram với gateway.
  </Card>
  <Card title="Groups" icon="users" href="/vi/channels/groups">
    Hành vi allowlist nhóm và chủ đề.
  </Card>
  <Card title="Channel routing" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến vào agent.
  </Card>
  <Card title="Security" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ nhóm và chủ đề tới agent.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh.
  </Card>
</CardGroup>
