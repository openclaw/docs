---
read_when:
    - Làm việc với các tính năng Telegram hoặc Webhook
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:40:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Sẵn sàng cho môi trường production cho DM và nhóm của bot qua grammY. Chế độ mặc định là thăm dò dài; chế độ Webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và sổ tay sửa chữa.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Mẫu và ví dụ cấu hình kênh đầy đủ.
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

    Env dự phòng: `TELEGRAM_BOT_TOKEN=...` (chỉ tài khoản mặc định).
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

    - ID người dùng Telegram của bạn, dùng trong `allowFrom` / `groupAllowFrom`
    - ID cuộc trò chuyện nhóm Telegram, dùng làm khóa trong `channels.telegram.groups`

    Với thiết lập lần đầu, lấy ID cuộc trò chuyện nhóm từ `openclaw logs --follow`, bot forwarded-ID, hoặc Bot API `getUpdates`. Sau khi nhóm được cho phép, `/whoami@<bot_username>` có thể xác nhận ID người dùng và ID nhóm.

    ID supergroup Telegram âm bắt đầu bằng `-100` là ID cuộc trò chuyện nhóm. Đặt chúng trong `channels.telegram.groups`, không đặt trong `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Thứ tự phân giải token có nhận biết tài khoản. Trong thực tế, giá trị config thắng env dự phòng, và `TELEGRAM_BOT_TOKEN` chỉ áp dụng cho tài khoản mặc định.
Sau khi khởi động thành công, OpenClaw lưu cache danh tính bot trong thư mục trạng thái tối đa 24 giờ để các lần khởi động lại có thể tránh thêm một lệnh gọi Telegram `getMe`; thay đổi hoặc xóa token sẽ xóa cache đó.
</Note>

## Thiết lập phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị trong nhóm">
    Bot Telegram mặc định dùng **Chế độ riêng tư**, giới hạn những tin nhắn nhóm mà chúng nhận được.

    Nếu bot phải thấy tất cả tin nhắn nhóm, hãy:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - đặt bot làm quản trị viên nhóm.

    Khi bật/tắt chế độ riêng tư, hãy xóa rồi thêm lại bot trong từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền nhóm">
    Trạng thái quản trị viên được kiểm soát trong phần thiết lập nhóm Telegram.

    Bot quản trị viên nhận tất cả tin nhắn nhóm, hữu ích cho hành vi nhóm luôn bật.

  </Accordion>

  <Accordion title="Các nút bật/tắt BotFather hữu ích">

    - `/setjoingroups` để cho phép/từ chối thêm vào nhóm
    - `/setprivacy` cho hành vi hiển thị trong nhóm

  </Accordion>
</AccordionGroup>

## Kiểm soát truy cập và kích hoạt

### Danh tính bot trong nhóm

Trong nhóm Telegram và chủ đề diễn đàn, việc nhắc rõ handle bot đã cấu hình (ví dụ `@my_bot`) được xem là đang gọi agent OpenClaw đã chọn, ngay cả khi tên persona của agent khác với tên người dùng Telegram. Chính sách im lặng trong nhóm vẫn áp dụng cho lưu lượng nhóm không liên quan, nhưng chính handle bot không được xem là "người khác."

<Tabs>
  <Tab title="Chính sách DM">
    `channels.telegram.dmPolicy` kiểm soát quyền truy cập tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một ID người gửi trong `allowFrom`)
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `dmPolicy: "open"` với `allowFrom: ["*"]` cho phép bất kỳ tài khoản Telegram nào tìm thấy hoặc đoán được tên người dùng bot ra lệnh cho bot. Chỉ dùng tùy chọn này cho bot công khai có chủ đích với công cụ được hạn chế chặt chẽ; bot một chủ sở hữu nên dùng `allowlist` với ID người dùng dạng số.

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    Trong config nhiều tài khoản, `channels.telegram.allowFrom` cấp cao nhất có tính hạn chế được xem là ranh giới an toàn: các mục `allowFrom: ["*"]` cấp tài khoản không làm tài khoản đó thành công khai trừ khi allowlist hiệu dụng của tài khoản vẫn chứa wildcard rõ ràng sau khi hợp nhất.
    `dmPolicy: "allowlist"` với `allowFrom` trống sẽ chặn tất cả DM và bị kiểm định config từ chối.
    Thiết lập chỉ yêu cầu ID người dùng dạng số.
    Nếu bạn đã nâng cấp và config của bạn chứa các mục allowlist `@username`, hãy chạy `openclaw doctor --fix` để phân giải chúng (best-effort; yêu cầu token bot Telegram).
    Nếu trước đây bạn dựa vào tệp allowlist của kho ghép nối, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` trong luồng allowlist (ví dụ khi `dmPolicy: "allowlist"` chưa có ID rõ ràng nào).

    Với bot một chủ sở hữu, ưu tiên `dmPolicy: "allowlist"` với ID `allowFrom` dạng số rõ ràng để giữ chính sách truy cập bền vững trong config (thay vì phụ thuộc vào các phê duyệt ghép nối trước đó).

    Nhầm lẫn thường gặp: phê duyệt ghép nối DM không có nghĩa là "người gửi này được ủy quyền ở mọi nơi".
    Ghép nối cấp quyền truy cập DM. Nếu chưa có chủ sở hữu lệnh, lần ghép nối được phê duyệt đầu tiên cũng đặt `commands.ownerAllowFrom` để các lệnh chỉ dành cho chủ sở hữu và phê duyệt exec có một tài khoản vận hành rõ ràng.
    Ủy quyền người gửi trong nhóm vẫn đến từ allowlist config rõ ràng.
    Nếu bạn muốn "tôi được ủy quyền một lần và cả DM lẫn lệnh nhóm đều hoạt động", hãy đặt ID người dùng Telegram dạng số của bạn trong `channels.telegram.allowFrom`; với lệnh chỉ dành cho chủ sở hữu, hãy đảm bảo `commands.ownerAllowFrom` chứa `telegram:<your user id>`.

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

    `groupAllowFrom` được dùng để lọc người gửi trong nhóm. Nếu chưa đặt, Telegram dùng dự phòng `allowFrom`.
    Các mục `groupAllowFrom` nên là ID người dùng Telegram dạng số (tiền tố `telegram:` / `tg:` được chuẩn hóa).
    Không đặt ID cuộc trò chuyện nhóm hoặc supergroup Telegram trong `groupAllowFrom`. ID cuộc trò chuyện âm thuộc về `channels.telegram.groups`.
    Các mục không phải dạng số bị bỏ qua khi ủy quyền người gửi.
    Ranh giới bảo mật (`2026.2.25+`): xác thực người gửi trong nhóm **không** kế thừa phê duyệt từ kho ghép nối DM.
    Ghép nối chỉ dành cho DM. Với nhóm, hãy đặt `groupAllowFrom` hoặc `allowFrom` theo nhóm/theo chủ đề.
    Nếu `groupAllowFrom` chưa được đặt, Telegram dùng dự phòng config `allowFrom`, không phải kho ghép nối.
    Mẫu thực tế cho bot một chủ sở hữu: đặt ID người dùng của bạn trong `channels.telegram.allowFrom`, để trống `groupAllowFrom`, và cho phép các nhóm đích trong `channels.telegram.groups`.
    Ghi chú runtime: nếu `channels.telegram` hoàn toàn không có, runtime mặc định fail-closed `groupPolicy="allowlist"` trừ khi `channels.defaults.groupPolicy` được đặt rõ ràng.

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

    Kiểm tra từ nhóm bằng `@<bot_username> ping`. Tin nhắn nhóm thông thường không kích hoạt bot khi `requireMention: true`.

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

      - Đặt ID cuộc trò chuyện nhóm hoặc supergroup Telegram âm như `-1001234567890` trong `channels.telegram.groups`.
      - Đặt ID người dùng Telegram như `8734062810` trong `groupAllowFrom` khi bạn muốn giới hạn những người trong một nhóm được cho phép có thể kích hoạt bot.
      - Chỉ dùng `groupAllowFrom: ["*"]` khi bạn muốn bất kỳ thành viên nào của một nhóm được cho phép đều có thể nói chuyện với bot.

    </Warning>

  </Tab>

  <Tab title="Hành vi nhắc đến">
    Trả lời trong nhóm mặc định yêu cầu nhắc đến.

    Lời nhắc đến có thể đến từ:

    - nhắc đến `@botusername` gốc, hoặc
    - mẫu nhắc đến trong:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Nút bật/tắt lệnh cấp phiên:

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

    Ngữ cảnh lịch sử nhóm luôn bật cho nhóm và bị giới hạn bởi
    `historyLimit`. Đặt `channels.telegram.historyLimit: 0` để tắt cửa sổ
    lịch sử nhóm Telegram. Khóa đã loại bỏ `includeGroupHistoryContext`
    được `openclaw doctor --fix` xóa.

    Lấy ID cuộc trò chuyện nhóm:

    - chuyển tiếp một tin nhắn nhóm tới `@userinfobot` / `@getidsbot`
    - hoặc đọc `chat.id` từ `openclaw logs --follow`
    - hoặc kiểm tra Bot API `getUpdates`
    - sau khi nhóm được cho phép, chạy `/whoami@<bot_username>` nếu lệnh gốc được bật

  </Tab>
</Tabs>

## Hành vi runtime

- Telegram thuộc quyền sở hữu của tiến trình gateway.
- Định tuyến có tính xác định: phản hồi gửi đến từ Telegram sẽ trả lời lại Telegram (mô hình không chọn kênh).
- Tin nhắn gửi đến được chuẩn hóa vào envelope kênh dùng chung với siêu dữ liệu trả lời, placeholder phương tiện, và ngữ cảnh chuỗi trả lời được lưu bền vững cho các phản hồi Telegram mà gateway đã quan sát.
- Phiên nhóm được cô lập theo ID nhóm. Chủ đề diễn đàn thêm `:topic:<threadId>` để giữ các chủ đề tách biệt.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw giữ nguyên trường này cho phản hồi. Phiên chủ đề DM chỉ tách khi Telegram `getMe` báo cáo `has_topics_enabled: true` cho bot; nếu không, DM vẫn ở phiên phẳng.
- Long polling dùng grammY runner với tuần tự hóa theo từng chat/từng thread. Mức đồng thời tổng thể của runner sink dùng `agents.defaults.maxConcurrent`.
- Khởi động đa tài khoản giới hạn các probe Telegram `getMe` đồng thời để đội bot lớn không bung tất cả probe tài khoản cùng lúc.
- Long polling được bảo vệ bên trong từng tiến trình gateway để mỗi lần chỉ một poller đang hoạt động có thể dùng một token bot. Nếu bạn vẫn thấy xung đột `getUpdates` 409, có thể một OpenClaw gateway, script, hoặc poller bên ngoài khác đang dùng cùng token.
- Watchdog long-polling mặc định kích hoạt khởi động lại sau 120 giây không có liveness `getUpdates` hoàn tất. Chỉ tăng `channels.telegram.pollingStallThresholdMs` nếu deployment của bạn vẫn gặp các lần khởi động lại do polling-stall giả trong khi chạy tác vụ lâu. Giá trị tính bằng mili giây và được phép từ `30000` đến `600000`; hỗ trợ ghi đè theo từng tài khoản.
- Telegram Bot API không hỗ trợ biên nhận đã đọc (`sendReadReceipts` không áp dụng).

<Note>
  `channels.telegram.dm.threadReplies` và `channels.telegram.direct.<chatId>.threadReplies` đã bị gỡ bỏ. Chạy `openclaw doctor --fix` sau khi nâng cấp nếu cấu hình của bạn vẫn có các khóa đó. Định tuyến chủ đề DM hiện đi theo khả năng của bot từ Telegram `getMe.has_topics_enabled`, được kiểm soát bởi chế độ threaded của BotFather: bot bật topics dùng phiên DM theo phạm vi thread khi Telegram gửi `message_thread_id`; các DM khác vẫn ở phiên phẳng.
</Note>

## Tham chiếu tính năng

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw có thể stream phản hồi một phần theo thời gian thực:

    - chat trực tiếp: tin nhắn xem trước + `editMessageText`
    - nhóm/chủ đề: tin nhắn xem trước + `editMessageText`

    Yêu cầu:

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - bản xem trước câu trả lời ban đầu ngắn được debounce, rồi được hiện thực hóa sau một khoảng trễ có giới hạn nếu lượt chạy vẫn đang hoạt động
    - `progress` giữ một bản nháp trạng thái có thể chỉnh sửa cho tiến độ công cụ, hiển thị nhãn trạng thái ổn định khi hoạt động trả lời đến trước tiến độ công cụ, xóa nó khi hoàn tất, và gửi câu trả lời cuối cùng như một tin nhắn bình thường
    - `streaming.preview.toolProgress` kiểm soát việc các cập nhật công cụ/tiến độ có dùng lại cùng tin nhắn xem trước đã chỉnh sửa hay không (mặc định: `true` khi preview streaming đang hoạt động)
    - `streaming.preview.commandText` kiểm soát chi tiết lệnh/exec bên trong các dòng tiến độ công cụ đó: `raw` (mặc định, giữ nguyên hành vi đã phát hành) hoặc `status` (chỉ nhãn công cụ)
    - `streaming.progress.commentary` (mặc định: `false`) bật văn bản bình luận/mở đầu của trợ lý trong bản nháp tiến độ tạm thời
    - `channels.telegram.streamMode` cũ, giá trị boolean `streaming`, và các khóa xem trước bản nháp native đã nghỉ hưu được phát hiện; chạy `openclaw doctor --fix` để di chuyển chúng sang cấu hình streaming hiện tại

    Các cập nhật xem trước tiến độ công cụ là những dòng trạng thái ngắn hiển thị khi công cụ chạy, ví dụ thực thi lệnh, đọc tệp, cập nhật lập kế hoạch, tóm tắt patch, hoặc văn bản mở đầu/bình luận Codex trong chế độ Codex app-server. Telegram mặc định bật các mục này để khớp hành vi OpenClaw đã phát hành từ `v2026.4.22` trở về sau.

    Để giữ bản xem trước đã chỉnh sửa cho văn bản trả lời nhưng ẩn các dòng tiến độ công cụ, đặt:

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

    Để giữ tiến độ công cụ hiển thị nhưng ẩn văn bản lệnh/exec, đặt:

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

    Dùng chế độ `progress` khi bạn muốn tiến độ công cụ hiển thị mà không chỉnh sửa câu trả lời cuối cùng vào cùng tin nhắn đó. Đặt chính sách văn bản lệnh dưới `streaming.progress`:

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

    Chỉ dùng `streaming.mode: "off"` khi bạn muốn chỉ gửi kết quả cuối: chỉnh sửa bản xem trước Telegram bị tắt và các trao đổi công cụ/tiến độ chung bị chặn thay vì được gửi như tin nhắn trạng thái độc lập. Prompt phê duyệt, payload phương tiện, và lỗi vẫn đi qua luồng gửi cuối bình thường. Dùng `streaming.preview.toolProgress: false` khi bạn chỉ muốn giữ chỉnh sửa bản xem trước câu trả lời trong khi ẩn các dòng trạng thái tiến độ công cụ.

    <Note>
      Phản hồi trích dẫn đã chọn của Telegram là ngoại lệ. Khi `replyToMode` là `"first"`, `"all"`, hoặc `"batched"` và tin nhắn gửi đến bao gồm văn bản trích dẫn đã chọn, OpenClaw gửi câu trả lời cuối cùng qua đường dẫn quote-reply native của Telegram thay vì chỉnh sửa bản xem trước câu trả lời, nên `streaming.preview.toolProgress` không thể hiển thị các dòng trạng thái ngắn cho lượt đó. Phản hồi tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ preview streaming. Đặt `replyToMode: "off"` khi khả năng hiển thị tiến độ công cụ quan trọng hơn phản hồi trích dẫn native, hoặc đặt `streaming.preview.toolProgress: false` để chấp nhận đánh đổi này.
    </Note>

    Với phản hồi chỉ có văn bản:

    - bản xem trước ngắn trong DM/nhóm/chủ đề: OpenClaw giữ cùng tin nhắn xem trước và thực hiện chỉnh sửa cuối tại chỗ
    - kết quả văn bản dài bị tách thành nhiều tin nhắn Telegram sẽ tái sử dụng bản xem trước hiện có làm phần kết quả đầu tiên khi có thể, rồi chỉ gửi các phần còn lại
    - kết quả ở chế độ tiến độ xóa bản nháp trạng thái và dùng luồng gửi cuối bình thường thay vì chỉnh sửa bản nháp thành câu trả lời
    - nếu chỉnh sửa cuối thất bại trước khi văn bản hoàn tất được xác nhận, OpenClaw dùng luồng gửi cuối bình thường và dọn bản xem trước cũ

    Với phản hồi phức tạp (ví dụ payload phương tiện), OpenClaw quay về luồng gửi cuối bình thường rồi dọn tin nhắn xem trước.

    Preview streaming tách biệt với block streaming. Khi block streaming được bật rõ ràng cho Telegram, OpenClaw bỏ qua preview stream để tránh stream hai lần.

    Hành vi stream reasoning:

    - `/reasoning stream` dùng đường dẫn xem trước reasoning của một kênh được hỗ trợ; trên Telegram, nó stream reasoning vào bản xem trước trực tiếp trong khi tạo
    - bản xem trước reasoning bị xóa sau khi gửi kết quả cuối; dùng `/reasoning on` khi reasoning cần vẫn hiển thị
    - câu trả lời cuối cùng được gửi không kèm văn bản reasoning

  </Accordion>

  <Accordion title="Rich message formatting">
    Văn bản gửi ra mặc định dùng tin nhắn Telegram HTML tiêu chuẩn để phản hồi vẫn dễ đọc trên các client Telegram hiện tại. Chế độ tương thích này hỗ trợ in đậm, in nghiêng, liên kết, code, spoiler, và trích dẫn thông thường, nhưng không hỗ trợ các khối chỉ có ở rich của Bot API 10.1 như bảng native, chi tiết, phương tiện phong phú, và công thức.

    Đặt `channels.telegram.richMessages: true` để bật tin nhắn rich của Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Khi bật:

    - Agent được thông báo rằng tin nhắn rich của Telegram khả dụng cho bot/tài khoản này.
    - Văn bản Markdown được kết xuất qua Markdown IR của OpenClaw và gửi dưới dạng Telegram rich HTML.
    - Payload rich HTML rõ ràng giữ lại các tag Bot API 10.1 được hỗ trợ như heading, bảng, chi tiết, phương tiện phong phú, và công thức.
    - Chú thích phương tiện vẫn dùng chú thích Telegram HTML vì tin nhắn rich không thay thế chú thích.

    Điều này giữ văn bản của mô hình tránh xa các ký hiệu Telegram Rich Markdown, để tiền tệ như `$400-600K` không bị phân tích thành toán học. Văn bản rich dài được tự động tách theo giới hạn văn bản rich và khối rich của Telegram. Bảng vượt giới hạn cột của Telegram được gửi dưới dạng khối code.

    Mặc định: tắt để tương thích client. Tin nhắn rich yêu cầu client Telegram tương thích; một số client Desktop, Web, Android, và bên thứ ba hiện tại hiển thị tin nhắn rich đã chấp nhận là không được hỗ trợ. Giữ tùy chọn này tắt trừ khi mọi client dùng với bot đều có thể render chúng. `/status` hiển thị phiên Telegram hiện tại đang bật hay tắt tin nhắn rich.

    Xem trước liên kết được bật mặc định. `channels.telegram.linkPreview: false` bỏ qua phát hiện entity tự động cho văn bản rich.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Việc đăng ký menu lệnh Telegram được xử lý khi khởi động bằng `setMyCommands`.

    Mặc định lệnh native:

    - `commands.native: "auto"` bật lệnh native cho Telegram

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
    - lệnh tùy chỉnh không thể ghi đè lệnh native
    - xung đột/trùng lặp bị bỏ qua và được ghi log

    Ghi chú:

    - lệnh tùy chỉnh chỉ là mục menu; chúng không tự triển khai hành vi
    - lệnh Plugin/skill vẫn có thể hoạt động khi được nhập dù không hiển thị trong menu Telegram

    Nếu lệnh native bị tắt, các lệnh tích hợp sẵn sẽ bị gỡ. Lệnh tùy chỉnh/Plugin vẫn có thể đăng ký nếu được cấu hình.

    Lỗi thiết lập thường gặp:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu Telegram vẫn bị tràn sau khi cắt bớt; giảm lệnh Plugin/skill/tùy chỉnh hoặc tắt `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands`, hoặc `setMyCommands` thất bại với `404: Not Found` trong khi lệnh curl Bot API trực tiếp hoạt động có thể nghĩa là `channels.telegram.apiRoot` đã được đặt thành endpoint đầy đủ `/bot<TOKEN>`. `apiRoot` chỉ được là root của Bot API, và `openclaw doctor --fix` gỡ một `/bot<TOKEN>` ở cuối do vô tình thêm vào.
    - `getMe returned 401` nghĩa là Telegram đã từ chối token bot được cấu hình. Cập nhật `botToken`, `tokenFile`, hoặc `TELEGRAM_BOT_TOKEN` bằng token BotFather hiện tại; OpenClaw dừng trước khi polling nên điều này không được báo cáo như lỗi dọn webhook.
    - `setMyCommands failed` với lỗi network/fetch thường nghĩa là DNS/HTTPS outbound tới `api.telegram.org` bị chặn.

    ### Lệnh ghép đôi thiết bị (Plugin `device-pair`)

    Khi Plugin `device-pair` được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã trong ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ (bao gồm vai trò/phạm vi)
    4. phê duyệt yêu cầu:
       - `/pair approve <requestId>` để phê duyệt rõ ràng
       - `/pair approve` khi chỉ có một yêu cầu đang chờ
       - `/pair approve latest` cho yêu cầu gần đây nhất

    Mã thiết lập mang một token bootstrap tồn tại ngắn hạn. Bootstrap mã thiết lập tích hợp sẵn chỉ dành cho node: lần kết nối đầu tiên tạo một yêu cầu node đang chờ, và sau khi phê duyệt Gateway trả về một token node bền vững với `scopes: []`. Nó không trả về token operator được chuyển giao; quyền truy cập operator yêu cầu một luồng ghép đôi operator được phê duyệt hoặc token riêng.

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (ví dụ vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó bị thay thế và yêu cầu mới dùng một `requestId` khác. Chạy lại `/pair pending` trước khi phê duyệt.

    Chi tiết hơn: [Ghép nối](/vi/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Ví dụ nút Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Nút `web_app` của Telegram chỉ hoạt động trong cuộc trò chuyện riêng giữa người dùng và
    bot.

    Các lượt bấm callback không được trình xử lý tương tác Plugin đã đăng ký
    nhận xử lý sẽ được chuyển cho tác tử dưới dạng văn bản:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Hành động tin nhắn Telegram cho tác tử và tự động hóa">
    Hành động công cụ Telegram bao gồm:

    - `sendMessage` (`to`, `content`, tùy chọn `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` hoặc `caption`, tùy chọn nút nội tuyến `presentation`; chỉnh sửa chỉ nút sẽ cập nhật dấu đánh dấu trả lời)
    - `createForumTopic` (`chatId`, `name`, tùy chọn `iconColor`, `iconCustomEmojiId`)

    Hành động tin nhắn kênh cung cấp các bí danh tiện dụng (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Điều khiển cổng kiểm soát:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (mặc định: tắt)

    Lưu ý: `edit` và `topic-create` hiện được bật theo mặc định và không có nút bật/tắt `channels.telegram.actions.*` riêng.
    Các lượt gửi khi chạy sử dụng ảnh chụp nhanh cấu hình/bí mật đang hoạt động (khởi động/tải lại), vì vậy các đường dẫn hành động không thực hiện phân giải lại SecretRef tùy biến cho từng lượt gửi.

    Ngữ nghĩa gỡ phản ứng: [/tools/reactions](/vi/tools/reactions)

  </Accordion>

  <Accordion title="Thẻ luồng trả lời">
    Telegram hỗ trợ thẻ luồng trả lời tường minh trong đầu ra được tạo:

    - `[[reply_to_current]]` trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` trả lời một ID tin nhắn Telegram cụ thể

    `channels.telegram.replyToMode` kiểm soát cách xử lý:

    - `off` (mặc định)
    - `first`
    - `all`

    Khi bật luồng trả lời và có sẵn văn bản hoặc chú thích Telegram gốc, OpenClaw tự động bao gồm một trích đoạn trích dẫn Telegram gốc. Telegram giới hạn văn bản trích dẫn gốc ở 1024 đơn vị mã UTF-16, vì vậy tin nhắn dài hơn sẽ được trích dẫn từ đầu và quay về trả lời thường nếu Telegram từ chối trích dẫn.

    Lưu ý: `off` tắt luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` tường minh vẫn được tôn trọng.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi luồng">
    Siêu nhóm diễn đàn:

    - khóa phiên chủ đề nối thêm `:topic:<threadId>`
    - trả lời và trạng thái đang nhập nhắm tới luồng chủ đề
    - đường dẫn cấu hình chủ đề:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Trường hợp đặc biệt của chủ đề chung (`threadId=1`):

    - lượt gửi tin nhắn bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)`)
    - hành động đang nhập vẫn bao gồm `message_thread_id`

    Kế thừa chủ đề: mục chủ đề kế thừa cài đặt nhóm trừ khi bị ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` chỉ áp dụng cho chủ đề và không kế thừa từ mặc định của nhóm.
    `topics."*"` đặt mặc định cho mọi chủ đề trong nhóm đó; ID chủ đề chính xác vẫn thắng `"*"`.

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

    Sau đó mỗi chủ đề có khóa phiên riêng: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liên kết chủ đề ACP bền vững**: Chủ đề diễn đàn có thể ghim phiên harness ACP thông qua liên kết ACP có kiểu ở cấp cao nhất (`bindings[]` với `type: "acp"` và `match.channel: "telegram"`, `peer.kind: "group"`, cùng ID có định danh chủ đề như `-1001234567890:topic:42`). Hiện được giới hạn cho chủ đề diễn đàn trong nhóm/siêu nhóm. Xem [Tác tử ACP](/vi/tools/acp-agents).

    **Sinh ACP ràng buộc theo luồng từ trò chuyện**: `/acp spawn <agent> --thread here|auto` liên kết chủ đề hiện tại với một phiên ACP mới; các lượt tiếp theo được định tuyến trực tiếp tới đó. OpenClaw ghim xác nhận sinh trong chủ đề. Yêu cầu `channels.telegram.threadBindings.spawnSessions` vẫn được bật (mặc định: `true`).

    Ngữ cảnh mẫu cung cấp `MessageThreadId` và `IsForum`. Trò chuyện DM có `message_thread_id` giữ lại siêu dữ liệu trả lời; chúng chỉ dùng khóa phiên nhận biết luồng khi Telegram `getMe` báo cáo `has_topics_enabled: true` cho bot.
    Các ghi đè `dm.threadReplies` và `direct.*.threadReplies` trước đây đã được loại bỏ có chủ đích; dùng chế độ luồng của BotFather làm nguồn sự thật duy nhất và chạy `openclaw doctor --fix` để gỡ các khóa cấu hình cũ.

  </Accordion>

  <Accordion title="Âm thanh, video và nhãn dán">
    ### Tin nhắn âm thanh

    Telegram phân biệt ghi chú thoại với tệp âm thanh.

    - mặc định: hành vi tệp âm thanh
    - thẻ `[[audio_as_voice]]` trong trả lời của tác tử để buộc gửi ghi chú thoại
    - bản chép lời ghi chú thoại gửi đến được đóng khung là văn bản do máy tạo,
      không đáng tin trong ngữ cảnh tác tử; phát hiện nhắc tên vẫn dùng bản chép lời
      thô để tin nhắn thoại có kiểm soát bằng nhắc tên tiếp tục hoạt động.

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

    Telegram phân biệt tệp video với video note.

    Ví dụ về hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video note không hỗ trợ chú thích; văn bản tin nhắn được cung cấp sẽ được gửi riêng.

    ### Sticker

    Xử lý sticker gửi đến:

    - WEBP tĩnh: được tải xuống và xử lý (placeholder `<media:sticker>`)
    - TGS động: bỏ qua
    - WEBM video: bỏ qua

    Các trường ngữ cảnh sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Mô tả sticker được lưu trong bộ nhớ đệm ở trạng thái Plugin SQLite của OpenClaw để giảm các lệnh gọi thị giác lặp lại.

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

  <Accordion title="Reaction notifications">
    Reaction của Telegram đến dưới dạng các bản cập nhật `message_reaction` (tách biệt với payload tin nhắn).

    Khi được bật, OpenClaw xếp hàng các sự kiện hệ thống như:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Cấu hình:

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    Ghi chú:

    - `own` nghĩa là chỉ reaction của người dùng đối với tin nhắn do bot gửi (cố gắng tối đa thông qua bộ nhớ đệm tin nhắn đã gửi).
    - Sự kiện reaction vẫn tuân thủ các kiểm soát truy cập của Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được phép sẽ bị loại bỏ.
    - Telegram không cung cấp ID luồng trong các bản cập nhật reaction.
      - nhóm không phải diễn đàn được định tuyến đến phiên trò chuyện nhóm
      - nhóm diễn đàn được định tuyến đến phiên chủ đề chung của nhóm (`:topic:1`), không phải chủ đề gốc chính xác

    `allowed_updates` cho polling/Webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn gửi đến. `ackReactionScope` quyết định emoji đó thực sự được gửi *khi nào*.

    **Thứ tự phân giải emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - phương án dự phòng emoji danh tính tác nhân (`agents.list[].identity.emoji`, nếu không thì "👀")

    Ghi chú:

    - Telegram yêu cầu emoji unicode (ví dụ "👀").
    - Dùng `""` để tắt reaction cho một kênh hoặc tài khoản.

    **Phạm vi (`messages.ackReactionScope`):**

    Nhà cung cấp Telegram đọc phạm vi từ `messages.ackReactionScope` (mặc định `"group-mentions"`). Hiện không có ghi đè ở cấp tài khoản Telegram hoặc cấp kênh Telegram.

    Giá trị: `"all"` (DM + nhóm), `"direct"` (chỉ DM), `"group-all"` (mọi tin nhắn nhóm, không có DM), `"group-mentions"` (nhóm khi bot được nhắc đến; **không có DM** — đây là mặc định), `"off"` / `"none"` (đã tắt).

    <Note>
    Phạm vi mặc định (`"group-mentions"`) không kích hoạt ack reaction trong tin nhắn trực tiếp. Để có ack reaction trên DM Telegram gửi đến, hãy đặt `messages.ackReactionScope` thành `"direct"` hoặc `"all"`. Giá trị được đọc khi nhà cung cấp Telegram khởi động, nên cần khởi động lại Gateway để thay đổi có hiệu lực.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Ghi cấu hình kênh được bật theo mặc định (`configWrites !== false`).

    Các thao tác ghi được Telegram kích hoạt bao gồm:

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
    Mặc định là long polling. Đối với chế độ Webhook, đặt `channels.telegram.webhookUrl` và `channels.telegram.webhookSecret`; tùy chọn `webhookPath`, `webhookHost`, `webhookPort` (mặc định `/telegram-webhook`, `127.0.0.1`, `8787`).

    Ở chế độ long-polling, OpenClaw chỉ duy trì watermark khởi động lại sau khi một bản cập nhật được dispatch thành công. Nếu một handler thất bại, bản cập nhật đó vẫn có thể được thử lại trong cùng tiến trình và không được ghi là đã hoàn tất để khử trùng lặp khi khởi động lại.

    Trình lắng nghe cục bộ bind vào `127.0.0.1:8787`. Đối với ingress công khai, hãy đặt một reverse proxy phía trước cổng cục bộ hoặc cố ý đặt `webhookHost: "0.0.0.0"`.

    Chế độ Webhook xác thực các request guard, token bí mật Telegram và thân JSON trước khi trả về `200` cho Telegram.
    Sau đó OpenClaw xử lý bản cập nhật bất đồng bộ thông qua cùng các lane bot theo từng cuộc trò chuyện/từng chủ đề được long polling sử dụng, vì vậy các lượt tác nhân chậm không giữ ACK phân phối của Telegram.

  </Accordion>

  <Accordion title="Giới hạn, thử lại và mục tiêu CLI">
    - Mặc định của `channels.telegram.textChunkLimit` là 4000.
    - `channels.telegram.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi tách theo độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước media Telegram gửi đến và gửi đi.
    - `channels.telegram.mediaGroupFlushMs` (mặc định 500) kiểm soát thời gian bộ nhớ đệm album/nhóm media Telegram trước khi OpenClaw điều phối chúng thành một tin nhắn gửi đến duy nhất. Tăng giá trị này nếu các phần album đến muộn; giảm để rút ngắn độ trễ phản hồi album.
    - `channels.telegram.timeoutSeconds` ghi đè thời gian chờ của client Telegram API (nếu không đặt, dùng mặc định của grammY). Client bot kẹp các giá trị được cấu hình dưới ngưỡng bảo vệ yêu cầu văn bản/typing gửi đi 60 giây để grammY không hủy việc gửi phản hồi hiển thị trước khi ngưỡng bảo vệ transport và fallback của OpenClaw có thể chạy. Long polling vẫn dùng ngưỡng bảo vệ yêu cầu `getUpdates` 45 giây để các lượt poll nhàn rỗi không bị bỏ mặc vô thời hạn.
    - `channels.telegram.pollingStallThresholdMs` mặc định là `120000`; chỉ điều chỉnh trong khoảng `30000` đến `600000` cho các lần khởi động lại do polling-stall dương tính giả.
    - lịch sử ngữ cảnh nhóm dùng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` vô hiệu hóa.
    - ngữ cảnh bổ sung của phản hồi/trích dẫn/chuyển tiếp được chuẩn hóa vào một cửa sổ ngữ cảnh cuộc trò chuyện đã chọn khi gateway đã quan sát các tin nhắn cha; bộ nhớ đệm tin nhắn đã quan sát nằm trong trạng thái Plugin SQLite của OpenClaw, và `openclaw doctor --fix` nhập các sidecar cũ. Telegram chỉ đưa một `reply_to_message` nông vào các bản cập nhật, nên các chuỗi cũ hơn bộ nhớ đệm bị giới hạn bởi payload cập nhật hiện tại của Telegram.
    - danh sách cho phép của Telegram chủ yếu kiểm soát ai có thể kích hoạt agent, không phải là ranh giới biên tập lại toàn bộ ngữ cảnh bổ sung.
    - Điều khiển lịch sử DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Cấu hình `channels.telegram.retry` áp dụng cho các helper gửi Telegram (CLI/công cụ/hành động) đối với lỗi API gửi đi có thể khôi phục. Việc gửi phản hồi cuối cùng gửi đến cũng dùng cơ chế thử lại safe-send có giới hạn cho lỗi trước kết nối Telegram, nhưng không thử lại các phong bì mạng mơ hồ sau khi gửi vì có thể nhân đôi tin nhắn hiển thị.

    Mục tiêu gửi của CLI và công cụ tin nhắn có thể là ID chat dạng số, username, hoặc mục tiêu chủ đề diễn đàn:

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
    - `--pin` hoặc `--delivery '{"pin":true}'` để yêu cầu gửi dạng ghim khi bot có thể ghim trong chat đó
    - `--force-document` để gửi hình ảnh, GIF và video gửi đi dưới dạng tài liệu thay vì ảnh nén, media động hoặc bản tải lên video

    Kiểm soát hành động:

    - `channels.telegram.actions.sendMessage=false` vô hiệu hóa tin nhắn Telegram gửi đi, bao gồm poll
    - `channels.telegram.actions.poll=false` vô hiệu hóa việc tạo poll Telegram trong khi vẫn bật gửi thông thường

  </Accordion>

  <Accordion title="Phê duyệt exec trong Telegram">
    Telegram hỗ trợ phê duyệt exec trong DM của người phê duyệt và có thể tùy chọn đăng lời nhắc trong chat hoặc chủ đề gốc. Người phê duyệt phải là ID người dùng Telegram dạng số.

    Đường dẫn cấu hình:

    - `channels.telegram.execApprovals.enabled` (tự động bật khi có thể phân giải ít nhất một người phê duyệt)
    - `channels.telegram.execApprovals.approvers` (fallback về ID owner dạng số từ `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (mặc định) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` và `defaultTo` kiểm soát ai có thể nói chuyện với bot và nơi bot gửi phản hồi thông thường. Chúng không biến ai đó thành người phê duyệt exec. Cặp DM được phê duyệt đầu tiên khởi tạo `commands.ownerAllowFrom` khi chưa có owner lệnh, nên thiết lập một owner vẫn hoạt động mà không cần nhân đôi ID trong `execApprovals.approvers`.

    Gửi qua kênh hiển thị văn bản lệnh trong chat; chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi lời nhắc xuất hiện trong một chủ đề diễn đàn, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và phần tiếp theo. Phê duyệt exec hết hạn sau 30 phút theo mặc định.

    Các nút phê duyệt inline cũng yêu cầu `channels.telegram.capabilities.inlineButtons` cho phép bề mặt mục tiêu (`dm`, `group` hoặc `all`). ID phê duyệt có tiền tố `plugin:` được phân giải thông qua phê duyệt plugin; các ID khác được phân giải qua phê duyệt exec trước.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Điều khiển phản hồi lỗi

Khi agent gặp lỗi gửi hoặc lỗi provider, chính sách lỗi kiểm soát liệu thông báo lỗi có được gửi đến chat Telegram hay không:

| Khóa                                | Giá trị                    | Mặc định        | Mô tả                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — gửi mọi thông báo lỗi đến chat. `once` — gửi mỗi thông báo lỗi duy nhất một lần cho mỗi cửa sổ cooldown (chặn các lỗi giống hệt lặp lại). `silent` — không bao giờ gửi thông báo lỗi đến chat. |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | Cửa sổ cooldown cho chính sách `once`. Sau khi một lỗi được gửi, cùng thông báo lỗi đó sẽ bị chặn cho đến khi khoảng thời gian này trôi qua. Ngăn spam lỗi trong thời gian gián đoạn.                 |

Hỗ trợ ghi đè theo tài khoản, theo nhóm và theo chủ đề (cùng cơ chế kế thừa như các khóa cấu hình Telegram khác).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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

    - Nếu `requireMention=false`, chế độ riêng tư Telegram phải cho phép khả năng hiển thị đầy đủ.
      - BotFather: `/setprivacy` -> Disable
      - sau đó xóa + thêm lại bot vào nhóm
    - `openclaw channels status` cảnh báo khi cấu hình mong đợi tin nhắn nhóm không nhắc đến bot.
    - `openclaw channels status --probe` có thể kiểm tra ID nhóm dạng số rõ ràng; wildcard `"*"` không thể được kiểm tra tư cách thành viên.
    - kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot hoàn toàn không thấy tin nhắn nhóm">

    - khi `channels.telegram.groups` tồn tại, nhóm phải được liệt kê (hoặc bao gồm `"*"`)
    - xác minh tư cách thành viên của bot trong nhóm
    - xem lại log: `openclaw logs --follow` để biết lý do bỏ qua

  </Accordion>

  <Accordion title="Lệnh hoạt động một phần hoặc hoàn toàn không hoạt động">

    - cấp quyền cho danh tính người gửi của bạn (ghép cặp và/hoặc `allowFrom` dạng số)
    - ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`
    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu gốc có quá nhiều mục; giảm lệnh plugin/skill/tùy chỉnh hoặc vô hiệu hóa menu gốc
    - các lệnh gọi khởi động `deleteMyCommands` / `setMyCommands` và lệnh gọi typing `sendChatAction` có giới hạn và thử lại một lần thông qua fallback transport của Telegram khi yêu cầu hết thời gian chờ. Lỗi mạng/fetch kéo dài thường cho thấy vấn đề về khả năng truy cập DNS/HTTPS đến `api.telegram.org`

  </Accordion>

  <Accordion title="Khởi động báo token không được ủy quyền">

    - `getMe returned 401` là lỗi xác thực Telegram đối với token bot đã cấu hình.
    - Sao chép lại hoặc tạo lại token bot trong BotFather, sau đó cập nhật `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, hoặc `TELEGRAM_BOT_TOKEN` cho tài khoản mặc định.
    - `deleteWebhook 401 Unauthorized` trong quá trình khởi động cũng là lỗi xác thực; xem nó như "không có webhook tồn tại" sẽ chỉ trì hoãn cùng lỗi token sai đó sang các lệnh gọi API sau.

  </Accordion>

  <Accordion title="Polling hoặc mạng không ổn định">

    - Node 22+ + fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy ngay lập tức nếu kiểu AbortSignal không khớp.
    - Một số host phân giải `api.telegram.org` sang IPv6 trước; egress IPv6 bị hỏng có thể gây lỗi Telegram API gián đoạn.
    - Nếu log bao gồm `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!`, OpenClaw hiện thử lại những lỗi này như lỗi mạng có thể khôi phục.
    - Trong quá trình khởi động polling, OpenClaw tái sử dụng probe `getMe` khởi động thành công cho grammY để runner không cần `getMe` lần thứ hai trước `getUpdates` đầu tiên.
    - Nếu `deleteWebhook` thất bại với lỗi mạng tạm thời trong quá trình khởi động polling, OpenClaw tiếp tục vào long polling thay vì thực hiện một lệnh gọi control-plane trước poll khác. Webhook vẫn đang hoạt động sẽ xuất hiện dưới dạng xung đột `getUpdates`; sau đó OpenClaw dựng lại transport Telegram và thử lại việc dọn dẹp webhook.
    - Nếu socket Telegram được tái chế theo một nhịp cố định ngắn, kiểm tra `channels.telegram.timeoutSeconds` thấp; client bot kẹp các giá trị được cấu hình dưới các ngưỡng bảo vệ yêu cầu gửi đi và `getUpdates`, nhưng các bản phát hành cũ hơn có thể hủy mọi poll hoặc phản hồi khi giá trị này được đặt dưới các ngưỡng bảo vệ đó.
    - Nếu log bao gồm `Polling stall detected`, OpenClaw khởi động lại polling và dựng lại transport Telegram sau 120 giây không có liveness long-poll hoàn tất theo mặc định.
    - `openclaw channels status --probe` và `openclaw doctor` cảnh báo khi một tài khoản polling đang chạy chưa hoàn tất `getUpdates` sau thời gian gia hạn khởi động, khi một tài khoản webhook đang chạy chưa hoàn tất `setWebhook` sau thời gian gia hạn khởi động, hoặc khi hoạt động transport polling thành công gần nhất đã cũ.
    - Chỉ tăng `channels.telegram.pollingStallThresholdMs` khi các lệnh gọi `getUpdates` chạy lâu vẫn khỏe mạnh nhưng host của bạn vẫn báo các lần khởi động lại polling-stall dương tính giả. Stall kéo dài thường chỉ ra vấn đề proxy, DNS, IPv6 hoặc egress TLS giữa host và `api.telegram.org`.
    - Telegram cũng tôn trọng env proxy của tiến trình cho transport Bot API, bao gồm `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và các biến chữ thường tương ứng. `NO_PROXY` / `no_proxy` vẫn có thể bỏ qua `api.telegram.org`.
    - Nếu proxy do OpenClaw quản lý được cấu hình qua `OPENCLAW_PROXY_URL` cho môi trường dịch vụ và không có env proxy chuẩn nào, Telegram cũng dùng URL đó cho transport Bot API.
    - Trên host VPS có egress/TLS trực tiếp không ổn định, định tuyến các lệnh gọi Telegram API qua `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định là `autoSelectFamily=true` (ngoại trừ WSL2). Thứ tự kết quả DNS của Telegram ưu tiên `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sau đó `channels.telegram.network.dnsResultOrder`, rồi mặc định của tiến trình như `NODE_OPTIONS=--dns-result-order=ipv4first`; nếu không có mục nào áp dụng, Node 22+ sẽ dùng dự phòng `ipv4first`.
    - Nếu máy chủ của bạn là WSL2 hoặc rõ ràng hoạt động tốt hơn với hành vi chỉ IPv4, hãy ép chọn family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Các câu trả lời thuộc dải benchmark RFC 2544 (`198.18.0.0/15`) đã được cho phép
      mặc định cho tải xuống media Telegram. Nếu một fake-IP đáng tin cậy hoặc
      proxy trong suốt ghi lại `api.telegram.org` thành một địa chỉ
      riêng tư/nội bộ/dùng đặc biệt khác trong khi tải xuống media, bạn có thể bật
      bỏ qua chỉ dành cho Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Tùy chọn bật tương tự có sẵn theo từng tài khoản tại
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Nếu proxy của bạn phân giải các máy chủ media Telegram thành `198.18.x.x`, trước tiên hãy để
      cờ nguy hiểm tắt. Media Telegram đã cho phép dải benchmark RFC 2544
      theo mặc định.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` làm suy yếu các biện pháp bảo vệ SSRF
      cho media Telegram. Chỉ dùng nó cho các môi trường proxy đáng tin cậy do người vận hành kiểm soát
      như định tuyến fake-IP của Clash, Mihomo hoặc Surge khi chúng
      tổng hợp các câu trả lời riêng tư hoặc dùng đặc biệt nằm ngoài dải benchmark RFC 2544.
      Hãy tắt nó đối với truy cập Telegram internet công cộng thông thường.
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

<Accordion title="High-signal Telegram fields">

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` phải trỏ tới một tệp thông thường; symlink bị từ chối)
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- mặc định chủ đề: `groups.<chatId>.topics."*"` áp dụng cho các chủ đề diễn đàn không khớp; ID chủ đề chính xác sẽ ghi đè nó
- phê duyệt exec: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- luồng/phản hồi: `replyToMode`
- streaming: `streaming` (bản xem trước), `streaming.preview.toolProgress`, `blockStreaming`
- định dạng/phân phối: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- media/mạng: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- gốc API tùy chỉnh: `apiRoot` (chỉ gốc Bot API; không bao gồm `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- hành động/khả năng: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- phản ứng: `reactionNotifications`, `reactionLevel`
- lỗi: `errorPolicy`, `errorCooldownMs`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Thứ tự ưu tiên nhiều tài khoản: khi cấu hình hai hoặc nhiều ID tài khoản, hãy đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để định tuyến mặc định rõ ràng. Nếu không, OpenClaw dùng dự phòng ID tài khoản đã chuẩn hóa đầu tiên và `openclaw doctor` sẽ cảnh báo. Các tài khoản có tên kế thừa `channels.telegram.allowFrom` / `groupAllowFrom`, nhưng không kế thừa các giá trị `accounts.default.*`.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Ghép đôi người dùng Telegram với Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/vi/channels/groups">
    Hành vi danh sách cho phép của nhóm và chủ đề.
  </Card>
  <Card title="Channel routing" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến vào các agent.
  </Card>
  <Card title="Security" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ nhóm và chủ đề tới các agent.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh.
  </Card>
</CardGroup>
