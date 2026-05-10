---
read_when:
    - Làm việc với các tính năng Telegram hoặc Webhook
summary: Trạng thái hỗ trợ, khả năng và cấu hình bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

Sẵn sàng cho production cho DM bot và nhóm qua grammY. Long polling là chế độ mặc định; chế độ webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán đa kênh và playbook sửa lỗi.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Tạo bot token trong BotFather">
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

    Dự phòng bằng env: `TELEGRAM_BOT_TOKEN=...` (chỉ tài khoản mặc định).
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
Thứ tự phân giải token có nhận biết tài khoản. Trong thực tế, giá trị config thắng dự phòng env, và `TELEGRAM_BOT_TOKEN` chỉ áp dụng cho tài khoản mặc định.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị nhóm">
    Bot Telegram mặc định dùng **Privacy Mode**, giới hạn những tin nhắn nhóm mà chúng nhận được.

    Nếu bot phải thấy tất cả tin nhắn nhóm, hãy:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - đặt bot làm quản trị viên nhóm.

    Khi bật/tắt chế độ riêng tư, hãy gỡ + thêm lại bot trong từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền nhóm">
    Trạng thái quản trị viên được kiểm soát trong cài đặt nhóm Telegram.

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
    `channels.telegram.dmPolicy` kiểm soát truy cập tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một ID người gửi trong `allowFrom`)
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `dmPolicy: "open"` với `allowFrom: ["*"]` cho phép bất kỳ tài khoản Telegram nào tìm thấy hoặc đoán được tên người dùng bot điều khiển bot. Chỉ dùng cho các bot công khai có chủ đích với công cụ bị giới hạn chặt chẽ; bot một chủ sở hữu nên dùng `allowlist` với ID người dùng dạng số.

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    Trong cấu hình nhiều tài khoản, `channels.telegram.allowFrom` cấp cao nhất có tính hạn chế được xử lý như một ranh giới an toàn: các mục `allowFrom: ["*"]` ở cấp tài khoản không làm tài khoản đó thành công khai trừ khi allowlist hiệu dụng của tài khoản vẫn chứa wildcard tường minh sau khi hợp nhất.
    `dmPolicy: "allowlist"` với `allowFrom` trống sẽ chặn tất cả DM và bị xác thực config từ chối.
    Thiết lập chỉ yêu cầu ID người dùng dạng số.
    Nếu bạn đã nâng cấp và config của bạn chứa các mục allowlist `@username`, hãy chạy `openclaw doctor --fix` để phân giải chúng (nỗ lực tối đa; yêu cầu token bot Telegram).
    Nếu trước đây bạn dựa vào các tệp allowlist của kho ghép nối, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` trong các luồng allowlist (ví dụ khi `dmPolicy: "allowlist"` chưa có ID tường minh).

    Với bot một chủ sở hữu, nên dùng `dmPolicy: "allowlist"` với ID `allowFrom` dạng số tường minh để giữ chính sách truy cập bền vững trong config (thay vì phụ thuộc vào các phê duyệt ghép nối trước đó).

    Nhầm lẫn thường gặp: phê duyệt ghép nối DM không có nghĩa là "người gửi này được ủy quyền ở mọi nơi".
    Ghép nối cấp quyền truy cập DM. Nếu chưa có chủ sở hữu lệnh, lần ghép nối được phê duyệt đầu tiên cũng đặt `commands.ownerAllowFrom` để các lệnh chỉ dành cho chủ sở hữu và phê duyệt exec có tài khoản vận hành tường minh.
    Ủy quyền người gửi trong nhóm vẫn đến từ allowlist config tường minh.
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

    Phương thức bên thứ ba (ít riêng tư hơn): `@userinfobot` hoặc `@getidsbot`.

  </Tab>

  <Tab title="Chính sách nhóm và allowlist">
    Hai cơ chế kiểm soát áp dụng cùng nhau:

    1. **Những nhóm nào được phép** (`channels.telegram.groups`)
       - không có config `groups`:
         - với `groupPolicy: "open"`: bất kỳ nhóm nào cũng có thể vượt qua kiểm tra group-ID
         - với `groupPolicy: "allowlist"` (mặc định): các nhóm bị chặn cho đến khi bạn thêm mục `groups` (hoặc `"*"`)
       - đã cấu hình `groups`: hoạt động như allowlist (ID tường minh hoặc `"*"`)

    2. **Những người gửi nào được phép trong nhóm** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (mặc định)
       - `disabled`

    `groupAllowFrom` được dùng để lọc người gửi trong nhóm. Nếu chưa đặt, Telegram quay về dùng `allowFrom`.
    Các mục `groupAllowFrom` nên là ID người dùng Telegram dạng số (tiền tố `telegram:` / `tg:` được chuẩn hóa).
    Không đặt ID chat nhóm hoặc siêu nhóm Telegram trong `groupAllowFrom`. ID chat âm thuộc về `channels.telegram.groups`.
    Các mục không phải dạng số bị bỏ qua khi ủy quyền người gửi.
    Ranh giới bảo mật (`2026.2.25+`): xác thực người gửi trong nhóm **không** kế thừa các phê duyệt từ kho ghép nối DM.
    Ghép nối chỉ dành cho DM. Với nhóm, hãy đặt `groupAllowFrom` hoặc `allowFrom` theo từng nhóm/từng chủ đề.
    Nếu `groupAllowFrom` chưa đặt, Telegram quay về dùng config `allowFrom`, không phải kho ghép nối.
    Mẫu thực tế cho bot một chủ sở hữu: đặt ID người dùng của bạn trong `channels.telegram.allowFrom`, để `groupAllowFrom` chưa đặt, và cho phép các nhóm mục tiêu dưới `channels.telegram.groups`.
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

      - Đặt ID chat nhóm hoặc siêu nhóm Telegram âm như `-1001234567890` dưới `channels.telegram.groups`.
      - Đặt ID người dùng Telegram như `8734062810` dưới `groupAllowFrom` khi bạn muốn giới hạn những người trong một nhóm được phép có thể kích hoạt bot.
      - Chỉ dùng `groupAllowFrom: ["*"]` khi bạn muốn bất kỳ thành viên nào của một nhóm được phép cũng có thể nói chuyện với bot.

    </Warning>

  </Tab>

  <Tab title="Hành vi nhắc đến">
    Trả lời trong nhóm mặc định yêu cầu nhắc đến.

    Nhắc đến có thể đến từ:

    - nhắc đến `@botusername` gốc, hoặc
    - mẫu nhắc đến trong:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Các nút bật/tắt lệnh cấp phiên:

    - `/activation always`
    - `/activation mention`

    Các lệnh này chỉ cập nhật trạng thái phiên. Dùng config để duy trì lâu dài.

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

- Telegram thuộc quyền sở hữu của quy trình gateway.
- Định tuyến có tính xác định: trả lời inbound của Telegram quay lại Telegram (model không chọn kênh).
- Tin nhắn inbound được chuẩn hóa vào phong bì kênh dùng chung với metadata trả lời, placeholder phương tiện và ngữ cảnh chuỗi trả lời đã lưu cho các trả lời Telegram mà gateway đã quan sát.
- Phiên nhóm được cô lập theo ID nhóm. Chủ đề forum thêm `:topic:<threadId>` để giữ chủ đề cô lập.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw giữ nguyên ID luồng cho các trả lời nhưng mặc định giữ DM trên phiên phẳng. Cấu hình `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, hoặc config chủ đề khớp khi bạn cố ý muốn cô lập phiên chủ đề DM.
- Long polling dùng grammY runner với sắp xếp tuần tự theo từng chat/từng luồng. Mức đồng thời tổng thể của runner sink dùng `agents.defaults.maxConcurrent`.
- Long polling được bảo vệ bên trong từng quy trình gateway để mỗi lần chỉ một poller hoạt động có thể dùng một bot token. Nếu bạn vẫn thấy xung đột `getUpdates` 409, một OpenClaw gateway, script, hoặc poller bên ngoài khác có khả năng đang dùng cùng token.
- Watchdog long-polling khởi động lại mặc định được kích hoạt sau 120 giây không có liveness `getUpdates` hoàn tất. Chỉ tăng `channels.telegram.pollingStallThresholdMs` nếu triển khai của bạn vẫn thấy các lần khởi động lại do polling-stall giả trong lúc chạy tác vụ lâu. Giá trị tính bằng mili giây và được phép từ `30000` đến `600000`; hỗ trợ ghi đè theo từng tài khoản.
- Telegram Bot API không hỗ trợ biên nhận đã đọc (`sendReadReceipts` không áp dụng).

## Tham chiếu tính năng

<AccordionGroup>
  <Accordion title="Xem trước luồng trực tiếp (chỉnh sửa tin nhắn)">
    OpenClaw có thể stream trả lời từng phần theo thời gian thực:

    - chat trực tiếp: tin nhắn xem trước + `editMessageText`
    - nhóm/chủ đề: tin nhắn xem trước + `editMessageText`

    Yêu cầu:

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - `progress` giữ một bản nháp trạng thái có thể chỉnh sửa cho tiến độ công cụ, xóa nó khi hoàn tất, và gửi câu trả lời cuối cùng như một tin nhắn bình thường
    - `streaming.preview.toolProgress` kiểm soát việc cập nhật công cụ/tiến độ có tái sử dụng cùng tin nhắn xem trước đã chỉnh sửa hay không (mặc định: `true` khi stream xem trước đang hoạt động)
    - `streaming.preview.commandText` kiểm soát chi tiết lệnh/exec bên trong các dòng tiến độ công cụ đó: `raw` (mặc định, giữ nguyên hành vi đã phát hành) hoặc `status` (chỉ nhãn công cụ)
    - các giá trị cũ `channels.telegram.streamMode` và `streaming` dạng boolean được phát hiện; chạy `openclaw doctor --fix` để di chuyển chúng sang `channels.telegram.streaming.mode`

    Cập nhật xem trước tiến độ công cụ là các dòng trạng thái ngắn hiển thị trong khi công cụ chạy, ví dụ thực thi lệnh, đọc tệp, cập nhật lập kế hoạch, hoặc tóm tắt patch. Telegram giữ các cập nhật này bật theo mặc định để khớp với hành vi OpenClaw đã phát hành từ `v2026.4.22` trở về sau. Để giữ phần xem trước đã chỉnh sửa cho văn bản câu trả lời nhưng ẩn các dòng tiến độ công cụ, hãy đặt:

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

    Dùng chế độ `progress` khi bạn muốn tiến trình công cụ hiển thị mà không chỉnh sửa câu trả lời cuối cùng vào cùng tin nhắn đó. Đặt chính sách văn bản lệnh dưới `streaming.progress`:

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

    Chỉ dùng `streaming.mode: "off"` khi bạn muốn chỉ gửi kết quả cuối cùng: các chỉnh sửa bản xem trước Telegram bị tắt và đoạn tán gẫu chung về công cụ/tiến trình bị chặn thay vì được gửi dưới dạng tin nhắn trạng thái riêng. Lời nhắc phê duyệt, payload phương tiện và lỗi vẫn đi qua luồng gửi cuối cùng thông thường. Dùng `streaming.preview.toolProgress: false` khi bạn chỉ muốn giữ các chỉnh sửa bản xem trước câu trả lời trong khi ẩn các dòng trạng thái tiến trình công cụ.

    <Note>
      Các trả lời trích dẫn đã chọn của Telegram là ngoại lệ. Khi `replyToMode` là `"first"`, `"all"`, hoặc `"batched"` và tin nhắn đến có văn bản trích dẫn đã chọn, OpenClaw gửi câu trả lời cuối cùng qua đường dẫn trả lời trích dẫn gốc của Telegram thay vì chỉnh sửa bản xem trước câu trả lời, nên `streaming.preview.toolProgress` không thể hiển thị các dòng trạng thái ngắn cho lượt đó. Các trả lời cho tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ truyền phát bản xem trước. Đặt `replyToMode: "off"` khi khả năng hiển thị tiến trình công cụ quan trọng hơn trả lời trích dẫn gốc, hoặc đặt `streaming.preview.toolProgress: false` để chấp nhận đánh đổi này.
    </Note>

    Với trả lời chỉ có văn bản:

    - bản xem trước ngắn trong DM/nhóm/chủ đề: OpenClaw giữ nguyên tin nhắn xem trước đó và thực hiện chỉnh sửa cuối cùng tại chỗ
    - các kết quả cuối cùng dạng văn bản dài được tách thành nhiều tin nhắn Telegram sẽ tái sử dụng bản xem trước hiện có làm phần cuối cùng đầu tiên khi có thể, rồi chỉ gửi các phần còn lại
    - các kết quả cuối cùng ở chế độ tiến trình sẽ xóa bản nháp trạng thái và dùng luồng gửi cuối cùng thông thường thay vì chỉnh sửa bản nháp thành câu trả lời
    - nếu chỉnh sửa cuối cùng thất bại trước khi văn bản hoàn tất được xác nhận, OpenClaw dùng luồng gửi cuối cùng thông thường và dọn dẹp bản xem trước cũ

    Với trả lời phức tạp (ví dụ payload phương tiện), OpenClaw quay về luồng gửi cuối cùng thông thường rồi dọn dẹp tin nhắn xem trước.

    Truyền phát bản xem trước tách biệt với truyền phát khối. Khi truyền phát khối được bật rõ ràng cho Telegram, OpenClaw bỏ qua luồng bản xem trước để tránh truyền phát hai lần.

    Luồng lập luận chỉ dành cho Telegram:

    - `/reasoning stream` gửi phần lập luận tới bản xem trước trực tiếp trong khi tạo
    - bản xem trước lập luận bị xóa sau khi gửi kết quả cuối cùng; dùng `/reasoning on` khi phần lập luận cần được giữ hiển thị
    - câu trả lời cuối cùng được gửi mà không có văn bản lập luận

  </Accordion>

  <Accordion title="Định dạng và cơ chế dự phòng HTML">
    Văn bản gửi ra dùng Telegram `parse_mode: "HTML"`.

    - Văn bản kiểu Markdown được render thành HTML an toàn cho Telegram.
    - HTML thô từ mô hình được escape để giảm lỗi phân tích cú pháp Telegram.
    - Nếu Telegram từ chối HTML đã phân tích cú pháp, OpenClaw thử lại dưới dạng văn bản thuần.

    Bản xem trước liên kết được bật theo mặc định và có thể tắt bằng `channels.telegram.linkPreview: false`.

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
    - xung đột/trùng lặp bị bỏ qua và được ghi log

    Ghi chú:

    - lệnh tùy chỉnh chỉ là mục menu; chúng không tự triển khai hành vi
    - lệnh Plugin/kỹ năng vẫn có thể hoạt động khi được nhập ngay cả khi không hiển thị trong menu Telegram

    Nếu lệnh gốc bị tắt, các lệnh tích hợp sẽ bị xóa. Lệnh tùy chỉnh/Plugin vẫn có thể đăng ký nếu được cấu hình.

    Các lỗi thiết lập thường gặp:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu Telegram vẫn vượt giới hạn sau khi cắt bớt; hãy giảm lệnh Plugin/kỹ năng/tùy chỉnh hoặc tắt `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands`, hoặc `setMyCommands` thất bại với `404: Not Found` trong khi các lệnh curl trực tiếp tới Bot API hoạt động có thể nghĩa là `channels.telegram.apiRoot` đã được đặt thành endpoint đầy đủ `/bot<TOKEN>`. `apiRoot` chỉ được là gốc Bot API, và `openclaw doctor --fix` sẽ xóa phần đuôi `/bot<TOKEN>` vô tình có.
    - `getMe returned 401` nghĩa là Telegram đã từ chối token bot đã cấu hình. Cập nhật `botToken`, `tokenFile`, hoặc `TELEGRAM_BOT_TOKEN` bằng token BotFather hiện tại; OpenClaw dừng trước khi polling nên lỗi này không được báo cáo là lỗi dọn dẹp Webhook.
    - `setMyCommands failed` với lỗi network/fetch thường nghĩa là DNS/HTTPS đi ra tới `api.telegram.org` bị chặn.

    ### Lệnh ghép đôi thiết bị (Plugin `device-pair`)

    Khi Plugin `device-pair` được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ (bao gồm vai trò/phạm vi)
    4. phê duyệt yêu cầu:
       - `/pair approve <requestId>` để phê duyệt rõ ràng
       - `/pair approve` khi chỉ có một yêu cầu đang chờ
       - `/pair approve latest` cho yêu cầu gần đây nhất

    Mã thiết lập mang một token bootstrap tồn tại trong thời gian ngắn. Cơ chế bàn giao bootstrap tích hợp giữ token node chính ở `scopes: []`; mọi token operator được bàn giao vẫn bị giới hạn trong `operator.approvals`, `operator.read`, `operator.talk.secrets`, và `operator.write`. Kiểm tra phạm vi bootstrap có tiền tố vai trò, nên danh sách cho phép operator đó chỉ đáp ứng các yêu cầu operator; các vai trò không phải operator vẫn cần phạm vi dưới tiền tố vai trò riêng của chúng.

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (ví dụ vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và yêu cầu mới dùng một `requestId` khác. Chạy lại `/pair pending` trước khi phê duyệt.

    Chi tiết khác: [Ghép đôi](/vi/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    `capabilities: ["inlineButtons"]` cũ ánh xạ thành `inlineButtons: "all"`.

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

    Các lượt bấm callback được chuyển tới tác tử dưới dạng văn bản:
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

    Điều khiển cổng kiểm soát:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (mặc định: tắt)

    Ghi chú: `edit` và `topic-create` hiện được bật theo mặc định và không có công tắc `channels.telegram.actions.*` riêng.
    Các lần gửi khi chạy dùng ảnh chụp nhanh cấu hình/secret đang hoạt động (khởi động/tải lại), nên các đường dẫn hành động không thực hiện phân giải lại SecretRef đột xuất cho từng lần gửi.

    Ngữ nghĩa xóa phản ứng: [/tools/reactions](/vi/tools/reactions)

  </Accordion>

  <Accordion title="Thẻ luồng trả lời">
    Telegram hỗ trợ thẻ luồng trả lời rõ ràng trong đầu ra được tạo:

    - `[[reply_to_current]]` trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` trả lời một ID tin nhắn Telegram cụ thể

    `channels.telegram.replyToMode` kiểm soát cách xử lý:

    - `off` (mặc định)
    - `first`
    - `all`

    Khi luồng trả lời được bật và văn bản hoặc chú thích Telegram gốc có sẵn, OpenClaw tự động bao gồm một trích đoạn trích dẫn Telegram gốc. Telegram giới hạn văn bản trích dẫn gốc ở 1024 đơn vị mã UTF-16, nên các tin nhắn dài hơn được trích dẫn từ đầu và quay về trả lời thuần nếu Telegram từ chối trích dẫn.

    Ghi chú: `off` tắt luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi luồng">
    Siêu nhóm diễn đàn:

    - khóa phiên chủ đề thêm `:topic:<threadId>`
    - trả lời và trạng thái đang nhập nhắm tới luồng chủ đề
    - đường dẫn cấu hình chủ đề:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Trường hợp đặc biệt của chủ đề chung (`threadId=1`):

    - gửi tin nhắn bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)`)
    - hành động đang nhập vẫn bao gồm `message_thread_id`

    Kế thừa chủ đề: các mục chủ đề kế thừa thiết lập nhóm trừ khi được ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` chỉ dành cho chủ đề và không kế thừa từ mặc định nhóm.

    **Định tuyến tác tử theo chủ đề**: Mỗi chủ đề có thể định tuyến tới một tác tử khác bằng cách đặt `agentId` trong cấu hình chủ đề. Điều này cho mỗi chủ đề không gian làm việc, bộ nhớ và phiên riêng biệt. Ví dụ:

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

    **Liên kết chủ đề ACP bền vững**: Chủ đề diễn đàn có thể ghim phiên harness ACP thông qua liên kết ACP có kiểu ở cấp cao nhất (`bindings[]` với `type: "acp"` và `match.channel: "telegram"`, `peer.kind: "group"`, cùng ID có định danh chủ đề như `-1001234567890:topic:42`). Hiện chỉ giới hạn cho chủ đề diễn đàn trong nhóm/siêu nhóm. Xem [Tác tử ACP](/vi/tools/acp-agents).

    **Sinh ACP gắn với luồng từ chat**: `/acp spawn <agent> --thread here|auto` liên kết chủ đề hiện tại với một phiên ACP mới; các lượt theo dõi được định tuyến trực tiếp tới đó. OpenClaw ghim xác nhận sinh trong chủ đề. Yêu cầu `channels.telegram.threadBindings.spawnSessions` vẫn được bật (mặc định: `true`).

    Ngữ cảnh mẫu hiển thị `MessageThreadId` và `IsForum`. Các cuộc trò chuyện DM có `message_thread_id` giữ định tuyến DM và siêu dữ liệu trả lời trên các phiên phẳng theo mặc định; chúng chỉ dùng khóa phiên nhận biết luồng khi được cấu hình với `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, hoặc một cấu hình chủ đề khớp. Dùng `channels.telegram.dm.threadReplies` cấp cao nhất cho mặc định của tài khoản, hoặc `direct.<chatId>.threadReplies` cho một DM.

  </Accordion>

  <Accordion title="Âm thanh, video và sticker">
    ### Tin nhắn âm thanh

    Telegram phân biệt ghi chú thoại và tệp âm thanh.

    - mặc định: hành vi tệp âm thanh
    - thẻ `[[audio_as_voice]]` trong trả lời của tác nhân để buộc gửi ghi chú thoại
    - bản chép lời ghi chú thoại đầu vào được đóng khung là văn bản do máy tạo,
      không đáng tin cậy trong ngữ cảnh tác nhân; phát hiện lượt nhắc vẫn dùng bản chép lời thô
      nên tin nhắn thoại được kiểm soát bằng lượt nhắc tiếp tục hoạt động.

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

    - WEBP tĩnh: được tải xuống và xử lý (phần giữ chỗ `<media:sticker>`)
    - TGS động: bị bỏ qua
    - WEBM video: bị bỏ qua

    Trường ngữ cảnh sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Tệp bộ nhớ đệm sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker được mô tả một lần (khi có thể) và được lưu vào bộ nhớ đệm để giảm các lần gọi thị giác lặp lại.

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

    Gửi hành động sticker:

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

    Khi được bật, OpenClaw đưa các sự kiện hệ thống như sau vào hàng đợi:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Cấu hình:

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    Ghi chú:

    - `own` nghĩa là chỉ phản ứng của người dùng với tin nhắn do bot gửi (nỗ lực tối đa qua bộ nhớ đệm tin nhắn đã gửi).
    - Sự kiện phản ứng vẫn tuân thủ kiểm soát truy cập của Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được phép sẽ bị loại bỏ.
    - Telegram không cung cấp ID luồng trong bản cập nhật phản ứng.
      - nhóm không phải diễn đàn định tuyến tới phiên trò chuyện nhóm
      - nhóm diễn đàn định tuyến tới phiên chủ đề chung của nhóm (`:topic:1`), không phải chủ đề gốc chính xác

    `allowed_updates` cho polling/webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đầu vào.

    Thứ tự phân giải:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji dự phòng từ danh tính tác nhân (`agents.list[].identity.emoji`, nếu không thì "👀")

    Ghi chú:

    - Telegram yêu cầu emoji unicode (ví dụ "👀").
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình từ sự kiện và lệnh Telegram">
    Ghi cấu hình kênh được bật theo mặc định (`configWrites !== false`).

    Các lần ghi do Telegram kích hoạt bao gồm:

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
    Mặc định là long polling. Với chế độ webhook, đặt `channels.telegram.webhookUrl` và `channels.telegram.webhookSecret`; tùy chọn `webhookPath`, `webhookHost`, `webhookPort` (mặc định `/telegram-webhook`, `127.0.0.1`, `8787`).

    Trong chế độ long-polling, OpenClaw chỉ lưu dấu mốc khởi động lại sau khi một bản cập nhật được dispatch thành công. Nếu một handler thất bại, bản cập nhật đó vẫn có thể được thử lại trong cùng tiến trình và không được ghi là đã hoàn tất để khử trùng lặp khi khởi động lại.

    Listener cục bộ bind tới `127.0.0.1:8787`. Đối với ingress công khai, hãy đặt reverse proxy phía trước cổng cục bộ hoặc cố ý đặt `webhookHost: "0.0.0.0"`.

    Chế độ webhook xác thực các guard yêu cầu, token bí mật Telegram và thân JSON trước khi trả về `200` cho Telegram.
    Sau đó OpenClaw xử lý bản cập nhật bất đồng bộ qua cùng các lane bot theo từng cuộc trò chuyện/từng chủ đề được dùng bởi long polling, nên các lượt tác nhân chậm không giữ ACK gửi của Telegram.

  </Accordion>

  <Accordion title="Giới hạn, thử lại và đích CLI">
    - `channels.telegram.textChunkLimit` mặc định là 4000.
    - `channels.telegram.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi tách theo độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước media Telegram đầu vào và đầu ra.
    - `channels.telegram.mediaGroupFlushMs` (mặc định 500) kiểm soát thời gian album/nhóm media Telegram được buffer trước khi OpenClaw dispatch chúng thành một tin nhắn đầu vào. Tăng giá trị này nếu các phần album đến muộn; giảm giá trị để giảm độ trễ trả lời album.
    - `channels.telegram.timeoutSeconds` ghi đè thời gian chờ client API Telegram (nếu không đặt, mặc định grammY được áp dụng). Client bot kẹp các giá trị được cấu hình thấp hơn guard yêu cầu văn bản/typing đầu ra 60 giây để grammY không hủy gửi trả lời hiển thị trước khi guard transport và dự phòng của OpenClaw có thể chạy. Long polling vẫn dùng guard yêu cầu `getUpdates` 45 giây để các lần poll nhàn rỗi không bị bỏ mặc vô thời hạn.
    - `channels.telegram.pollingStallThresholdMs` mặc định là `120000`; chỉ tinh chỉnh trong khoảng `30000` đến `600000` cho các lần khởi động lại do polling-stall dương tính giả.
    - lịch sử ngữ cảnh nhóm dùng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` để tắt.
    - ngữ cảnh bổ sung trả lời/trích dẫn/chuyển tiếp được chuẩn hóa vào một cửa sổ ngữ cảnh hội thoại được chọn khi Gateway đã quan sát các tin nhắn cha; bộ nhớ đệm tin nhắn đã quan sát được lưu bền cạnh kho phiên. Telegram chỉ bao gồm một `reply_to_message` nông trong bản cập nhật, nên các chuỗi cũ hơn bộ nhớ đệm bị giới hạn bởi payload cập nhật hiện tại của Telegram.
    - allowlist Telegram chủ yếu kiểm soát ai có thể kích hoạt tác nhân, không phải một ranh giới biên tập lại toàn bộ ngữ cảnh bổ sung.
    - Điều khiển lịch sử DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Cấu hình `channels.telegram.retry` áp dụng cho các helper gửi Telegram (CLI/tools/actions) đối với lỗi API đầu ra có thể khôi phục. Gửi trả lời cuối cùng đầu vào cũng dùng thử lại safe-send có giới hạn cho lỗi trước khi kết nối Telegram, nhưng không thử lại các phong bì mạng mơ hồ sau khi gửi có thể nhân đôi tin nhắn hiển thị.

    Đích gửi CLI và message-tool có thể là ID trò chuyện dạng số, tên người dùng, hoặc đích chủ đề diễn đàn:

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

    Flag poll chỉ dành cho Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` cho chủ đề diễn đàn (hoặc dùng một đích `:topic:`)

    Gửi Telegram cũng hỗ trợ:

    - `--presentation` với các khối `buttons` cho bàn phím inline khi `channels.telegram.capabilities.inlineButtons` cho phép
    - `--pin` hoặc `--delivery '{"pin":true}'` để yêu cầu gửi ghim khi bot có thể ghim trong cuộc trò chuyện đó
    - `--force-document` để gửi ảnh và GIF đầu ra dưới dạng tài liệu thay vì tải lên dạng ảnh nén hoặc media động

    Kiểm soát hành động:

    - `channels.telegram.actions.sendMessage=false` tắt tin nhắn Telegram đầu ra, bao gồm poll
    - `channels.telegram.actions.poll=false` tắt tạo poll Telegram trong khi vẫn bật gửi thông thường

  </Accordion>

  <Accordion title="Phê duyệt exec trong Telegram">
    Telegram hỗ trợ phê duyệt exec trong DM của người phê duyệt và tùy chọn có thể đăng lời nhắc trong cuộc trò chuyện hoặc chủ đề gốc. Người phê duyệt phải là ID người dùng Telegram dạng số.

    Đường dẫn cấu hình:

    - `channels.telegram.execApprovals.enabled` (tự động bật khi có ít nhất một người phê duyệt có thể phân giải)
    - `channels.telegram.execApprovals.approvers` (dự phòng về ID chủ sở hữu dạng số từ `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (mặc định) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, và `defaultTo` kiểm soát ai có thể nói chuyện với bot và nơi bot gửi trả lời thông thường. Chúng không biến ai đó thành người phê duyệt exec. Ghép cặp DM được phê duyệt đầu tiên bootstrap `commands.ownerAllowFrom` khi chưa có chủ sở hữu lệnh nào, nên thiết lập một chủ sở hữu vẫn hoạt động mà không cần sao chép ID dưới `execApprovals.approvers`.

    Gửi qua kênh hiển thị văn bản lệnh trong cuộc trò chuyện; chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi lời nhắc đến trong một chủ đề diễn đàn, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và phần theo dõi. Phê duyệt exec hết hạn sau 30 phút theo mặc định.

    Nút phê duyệt inline cũng yêu cầu `channels.telegram.capabilities.inlineButtons` cho phép bề mặt đích (`dm`, `group`, hoặc `all`). ID phê duyệt có tiền tố `plugin:` phân giải qua phê duyệt plugin; các ID khác phân giải qua phê duyệt exec trước.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Điều khiển trả lời lỗi

Khi tác nhân gặp lỗi gửi hoặc lỗi nhà cung cấp, Telegram có thể trả lời bằng văn bản lỗi hoặc ẩn nó. Hai khóa cấu hình kiểm soát hành vi này:

| Khóa                                | Giá trị           | Mặc định | Mô tả                                                                                          |
| ----------------------------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` gửi một tin nhắn lỗi thân thiện tới cuộc trò chuyện. `silent` ẩn hoàn toàn trả lời lỗi. |
| `channels.telegram.errorCooldownMs` | số (ms)           | `60000`  | Thời gian tối thiểu giữa các trả lời lỗi tới cùng một cuộc trò chuyện. Ngăn spam lỗi khi sự cố. |

Hỗ trợ ghi đè theo tài khoản, theo nhóm và theo chủ đề (cùng cơ chế kế thừa như các khóa cấu hình Telegram khác).

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

    - Nếu `requireMention=false`, chế độ riêng tư của Telegram phải cho phép hiển thị đầy đủ.
      - BotFather: `/setprivacy` -> Tắt
      - sau đó xóa + thêm lại bot vào nhóm
    - `openclaw channels status` cảnh báo khi cấu hình kỳ vọng tin nhắn nhóm không nhắc đến bot.
    - `openclaw channels status --probe` có thể kiểm tra ID nhóm dạng số rõ ràng; ký tự đại diện `"*"` không thể được kiểm tra tư cách thành viên.
    - kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot hoàn toàn không thấy tin nhắn nhóm">

    - khi `channels.telegram.groups` tồn tại, nhóm phải được liệt kê (hoặc bao gồm `"*"`)
    - xác minh tư cách thành viên của bot trong nhóm
    - xem lại nhật ký: `openclaw logs --follow` để biết lý do bỏ qua

  </Accordion>

  <Accordion title="Lệnh hoạt động một phần hoặc hoàn toàn không hoạt động">

    - cấp quyền cho danh tính người gửi của bạn (ghép nối và/hoặc `allowFrom` dạng số)
    - ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`
    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu gốc có quá nhiều mục; giảm số lệnh Plugin/skill/tùy chỉnh hoặc tắt menu gốc
    - các lệnh gọi khởi động `deleteMyCommands` / `setMyCommands` và các lệnh gọi nhập liệu `sendChatAction` có giới hạn thời gian và thử lại một lần thông qua cơ chế dự phòng truyền tải của Telegram khi yêu cầu hết thời gian chờ. Lỗi mạng/fetch kéo dài thường cho thấy vấn đề về khả năng truy cập DNS/HTTPS tới `api.telegram.org`

  </Accordion>

  <Accordion title="Khởi động báo token không được ủy quyền">

    - `getMe returned 401` là lỗi xác thực Telegram cho token bot đã cấu hình.
    - Sao chép lại hoặc tạo lại token bot trong BotFather, sau đó cập nhật `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, hoặc `TELEGRAM_BOT_TOKEN` cho tài khoản mặc định.
    - `deleteWebhook 401 Unauthorized` trong lúc khởi động cũng là lỗi xác thực; xem nó như "không có webhook tồn tại" sẽ chỉ trì hoãn cùng lỗi token sai đó tới các lệnh gọi API sau này.

  </Accordion>

  <Accordion title="Polling hoặc mạng không ổn định">

    - Node 22+ + fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy ngay lập tức nếu kiểu AbortSignal không khớp.
    - Một số máy chủ phân giải `api.telegram.org` sang IPv6 trước; đường ra IPv6 bị lỗi có thể gây lỗi Telegram API gián đoạn.
    - Nếu nhật ký bao gồm `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!`, OpenClaw hiện thử lại các lỗi này như lỗi mạng có thể khôi phục.
    - Trong lúc khởi động polling, OpenClaw tái sử dụng lần thăm dò `getMe` khởi động thành công cho grammY để runner không cần `getMe` lần thứ hai trước `getUpdates` đầu tiên.
    - Nếu `deleteWebhook` thất bại với lỗi mạng tạm thời trong lúc khởi động polling, OpenClaw tiếp tục vào long polling thay vì thực hiện một lệnh gọi mặt phẳng điều khiển trước polling khác. Webhook vẫn đang hoạt động sẽ xuất hiện dưới dạng xung đột `getUpdates`; khi đó OpenClaw dựng lại truyền tải Telegram và thử lại việc dọn dẹp webhook.
    - Nếu socket Telegram được tái chế theo một chu kỳ cố định ngắn, hãy kiểm tra `channels.telegram.timeoutSeconds` thấp; client bot kẹp các giá trị cấu hình thấp hơn các bộ bảo vệ yêu cầu outbound và `getUpdates`, nhưng các bản phát hành cũ hơn có thể hủy mọi poll hoặc phản hồi khi giá trị này được đặt thấp hơn các bộ bảo vệ đó.
    - Nếu nhật ký bao gồm `Polling stall detected`, OpenClaw khởi động lại polling và dựng lại truyền tải Telegram sau 120 giây không có liveness long-poll hoàn tất theo mặc định.
    - `openclaw channels status --probe` và `openclaw doctor` cảnh báo khi một tài khoản polling đang chạy chưa hoàn tất `getUpdates` sau thời gian gia hạn khởi động, khi một tài khoản webhook đang chạy chưa hoàn tất `setWebhook` sau thời gian gia hạn khởi động, hoặc khi hoạt động truyền tải polling thành công gần nhất đã cũ.
    - Chỉ tăng `channels.telegram.pollingStallThresholdMs` khi các lệnh gọi `getUpdates` chạy lâu vẫn khỏe mạnh nhưng máy chủ của bạn vẫn báo khởi động lại do polling-stall giả. Tình trạng stall kéo dài thường chỉ ra vấn đề proxy, DNS, IPv6, hoặc đường ra TLS giữa máy chủ và `api.telegram.org`.
    - Telegram cũng tôn trọng env proxy của tiến trình cho truyền tải Bot API, bao gồm `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, và các biến chữ thường tương ứng. `NO_PROXY` / `no_proxy` vẫn có thể bỏ qua `api.telegram.org`.
    - Nếu proxy do OpenClaw quản lý được cấu hình thông qua `OPENCLAW_PROXY_URL` cho môi trường dịch vụ và không có env proxy tiêu chuẩn nào, Telegram cũng dùng URL đó cho truyền tải Bot API.
    - Trên máy chủ VPS có đường ra trực tiếp/TLS không ổn định, định tuyến các lệnh gọi Telegram API qua `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định là `autoSelectFamily=true` (ngoại trừ WSL2). Thứ tự kết quả DNS của Telegram tôn trọng `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sau đó `channels.telegram.network.dnsResultOrder`, rồi mặc định của tiến trình như `NODE_OPTIONS=--dns-result-order=ipv4first`; nếu không có cấu hình nào áp dụng, Node 22+ sẽ dự phòng về `ipv4first`.
    - Nếu máy chủ của bạn là WSL2 hoặc hoạt động tốt hơn rõ ràng với hành vi chỉ IPv4, hãy buộc lựa chọn family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Các câu trả lời thuộc dải benchmark RFC 2544 (`198.18.0.0/15`) đã được cho phép
      mặc định cho tải xuống media Telegram. Nếu một proxy fake-IP đáng tin cậy hoặc
      proxy trong suốt viết lại `api.telegram.org` thành một địa chỉ
      riêng tư/nội bộ/dùng mục đích đặc biệt khác trong khi tải xuống media, bạn có thể chọn tham gia
      bypass chỉ dành cho Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Tùy chọn tham gia tương tự có sẵn cho từng tài khoản tại
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Nếu proxy của bạn phân giải máy chủ media Telegram thành `198.18.x.x`, trước tiên hãy để
      cờ nguy hiểm ở trạng thái tắt. Media Telegram đã cho phép dải benchmark
      RFC 2544 theo mặc định.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` làm yếu các biện pháp bảo vệ SSRF
      cho media Telegram. Chỉ dùng nó cho các môi trường proxy do operator đáng tin cậy kiểm soát
      như định tuyến fake-IP Clash, Mihomo, hoặc Surge khi chúng
      tổng hợp câu trả lời riêng tư hoặc dùng mục đích đặc biệt ngoài dải benchmark
      RFC 2544. Để tắt cho truy cập Telegram qua internet công cộng thông thường.
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

<Accordion title="Các trường Telegram có tín hiệu cao">

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` phải trỏ tới một tệp thông thường; symlink bị từ chối)
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- phê duyệt thực thi: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- phân luồng/trả lời: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (bản xem trước), `streaming.preview.toolProgress`, `blockStreaming`
- định dạng/gửi: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/mạng: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- gốc API tùy chỉnh: `apiRoot` (chỉ gốc Bot API; không bao gồm `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- hành động/capability: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- lỗi: `errorPolicy`, `errorCooldownMs`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Thứ tự ưu tiên nhiều tài khoản: khi cấu hình hai ID tài khoản trở lên, hãy đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để làm rõ định tuyến mặc định. Nếu không, OpenClaw dự phòng về ID tài khoản đã chuẩn hóa đầu tiên và `openclaw doctor` sẽ cảnh báo. Tài khoản có tên kế thừa `channels.telegram.allowFrom` / `groupAllowFrom`, nhưng không kế thừa các giá trị `accounts.default.*`.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối một người dùng Telegram với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi allowlist của nhóm và chủ đề.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến tới agent.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Định tuyến đa agent" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ nhóm và chủ đề tới agent.
  </Card>
  <Card title="Khắc phục sự cố" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh.
  </Card>
</CardGroup>
