---
read_when:
    - Làm việc với các tính năng Telegram hoặc Webhook
summary: Trạng thái hỗ trợ, năng lực và cấu hình của bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:12:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Sẵn sàng cho môi trường production cho DM bot và nhóm qua grammY. Long polling là chế độ mặc định; chế độ webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa lỗi.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Create the bot token in BotFather">
    Mở Telegram và trò chuyện với **@BotFather** (xác nhận handle chính xác là `@BotFather`).

    Chạy `/newbot`, làm theo lời nhắc và lưu token.

  </Step>

  <Step title="Configure token and DM policy">

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

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (chỉ tài khoản mặc định).
    Telegram **không** dùng `openclaw channels login telegram`; cấu hình token trong config/env, rồi khởi động gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Mã ghép nối hết hạn sau 1 giờ.

  </Step>

  <Step title="Add the bot to a group">
    Thêm bot vào nhóm của bạn, rồi lấy cả hai ID mà quyền truy cập nhóm cần:

    - ID người dùng Telegram của bạn, dùng trong `allowFrom` / `groupAllowFrom`
    - ID chat nhóm Telegram, dùng làm khóa dưới `channels.telegram.groups`

    Với lần thiết lập đầu tiên, lấy ID chat nhóm từ `openclaw logs --follow`, bot chuyển tiếp ID hoặc Bot API `getUpdates`. Sau khi nhóm được cho phép, `/whoami@<bot_username>` có thể xác nhận ID người dùng và ID nhóm.

    ID supergroup Telegram âm bắt đầu bằng `-100` là ID chat nhóm. Đặt chúng dưới `channels.telegram.groups`, không đặt dưới `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Thứ tự phân giải token có nhận biết tài khoản. Trong thực tế, giá trị config được ưu tiên hơn env fallback, và `TELEGRAM_BOT_TOKEN` chỉ áp dụng cho tài khoản mặc định.
Sau khi khởi động thành công, OpenClaw lưu cache danh tính bot trong thư mục trạng thái tối đa 24 giờ để các lần khởi động lại có thể tránh thêm một lệnh gọi Telegram `getMe`; việc thay đổi hoặc xóa token sẽ xóa cache đó.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Bot Telegram mặc định dùng **Privacy Mode**, giới hạn các tin nhắn nhóm mà chúng nhận được.

    Nếu bot phải thấy mọi tin nhắn nhóm, hãy:

    - tắt privacy mode qua `/setprivacy`, hoặc
    - đặt bot làm quản trị viên nhóm.

    Khi bật/tắt privacy mode, hãy xóa rồi thêm lại bot trong từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Group permissions">
    Trạng thái quản trị viên được kiểm soát trong cài đặt nhóm Telegram.

    Bot quản trị viên nhận mọi tin nhắn nhóm, hữu ích cho hành vi nhóm luôn bật.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` để cho phép/từ chối thêm vào nhóm
    - `/setprivacy` cho hành vi hiển thị trong nhóm

  </Accordion>
</AccordionGroup>

## Kiểm soát truy cập và kích hoạt

### Danh tính bot trong nhóm

Trong nhóm Telegram và chủ đề diễn đàn, việc nhắc rõ handle bot đã cấu hình (ví dụ `@my_bot`) được xem là đang gọi agent OpenClaw đã chọn, ngay cả khi tên persona của agent khác với tên người dùng Telegram. Chính sách im lặng trong nhóm vẫn áp dụng cho lưu lượng nhóm không liên quan, nhưng chính handle bot không được xem là "người khác."

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` kiểm soát quyền truy cập tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một ID người gửi trong `allowFrom`)
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `dmPolicy: "open"` với `allowFrom: ["*"]` cho phép bất kỳ tài khoản Telegram nào tìm thấy hoặc đoán được tên người dùng bot điều khiển bot. Chỉ dùng cho bot công khai có chủ đích với công cụ bị giới hạn chặt chẽ; bot một chủ sở hữu nên dùng `allowlist` với ID người dùng dạng số.

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    Trong cấu hình nhiều tài khoản, `channels.telegram.allowFrom` cấp cao nhất mang tính hạn chế được xem là ranh giới an toàn: các mục `allowFrom: ["*"]` ở cấp tài khoản không làm tài khoản đó công khai trừ khi allowlist hiệu lực của tài khoản vẫn chứa wildcard rõ ràng sau khi hợp nhất.
    `dmPolicy: "allowlist"` với `allowFrom` rỗng sẽ chặn mọi DM và bị xác thực cấu hình từ chối.
    Thiết lập chỉ yêu cầu ID người dùng dạng số.
    Nếu bạn đã nâng cấp và config của bạn chứa mục allowlist `@username`, hãy chạy `openclaw doctor --fix` để phân giải chúng (best-effort; yêu cầu token bot Telegram).
    Nếu trước đây bạn dựa vào tệp allowlist của pairing-store, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` trong luồng allowlist (ví dụ khi `dmPolicy: "allowlist"` chưa có ID rõ ràng).

    Với bot một chủ sở hữu, ưu tiên `dmPolicy: "allowlist"` với ID `allowFrom` dạng số rõ ràng để giữ chính sách truy cập bền vững trong config (thay vì phụ thuộc vào các phê duyệt ghép nối trước đó).

    Nhầm lẫn thường gặp: phê duyệt ghép nối DM không có nghĩa là "người gửi này được ủy quyền ở mọi nơi".
    Ghép nối cấp quyền truy cập DM. Nếu chưa có chủ sở hữu lệnh, lần ghép nối được phê duyệt đầu tiên cũng đặt `commands.ownerAllowFrom` để lệnh chỉ dành cho chủ sở hữu và phê duyệt exec có tài khoản vận hành rõ ràng.
    Ủy quyền người gửi trong nhóm vẫn đến từ allowlist cấu hình rõ ràng.
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

  <Tab title="Group policy and allowlists">
    Hai cơ chế kiểm soát áp dụng cùng nhau:

    1. **Những nhóm nào được cho phép** (`channels.telegram.groups`)
       - không có config `groups`:
         - với `groupPolicy: "open"`: bất kỳ nhóm nào cũng có thể vượt qua kiểm tra ID nhóm
         - với `groupPolicy: "allowlist"` (mặc định): các nhóm bị chặn cho đến khi bạn thêm mục `groups` (hoặc `"*"`)
       - đã cấu hình `groups`: hoạt động như allowlist (ID rõ ràng hoặc `"*"`)

    2. **Những người gửi nào được cho phép trong nhóm** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (mặc định)
       - `disabled`

    `groupAllowFrom` được dùng để lọc người gửi trong nhóm. Nếu chưa đặt, Telegram fallback về `allowFrom`.
    Mục `groupAllowFrom` nên là ID người dùng Telegram dạng số (tiền tố `telegram:` / `tg:` được chuẩn hóa).
    Không đặt ID chat nhóm hoặc supergroup Telegram trong `groupAllowFrom`. ID chat âm thuộc về `channels.telegram.groups`.
    Mục không phải số bị bỏ qua khi ủy quyền người gửi.
    Ranh giới bảo mật (`2026.2.25+`): xác thực người gửi trong nhóm **không** kế thừa phê duyệt pairing-store của DM.
    Ghép nối chỉ dành cho DM. Với nhóm, đặt `groupAllowFrom` hoặc `allowFrom` theo nhóm/theo chủ đề.
    Nếu chưa đặt `groupAllowFrom`, Telegram fallback về config `allowFrom`, không phải pairing store.
    Mẫu thực tế cho bot một chủ sở hữu: đặt ID người dùng của bạn trong `channels.telegram.allowFrom`, để `groupAllowFrom` chưa đặt, và cho phép các nhóm mục tiêu dưới `channels.telegram.groups`.
    Ghi chú runtime: nếu `channels.telegram` hoàn toàn thiếu, runtime mặc định fail-closed `groupPolicy="allowlist"` trừ khi `channels.defaults.groupPolicy` được đặt rõ ràng.

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

    Ví dụ: cho phép mọi thành viên trong một nhóm cụ thể:

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
      Lỗi thường gặp: `groupAllowFrom` không phải allowlist nhóm Telegram.

      - Đặt ID chat nhóm hoặc supergroup Telegram âm như `-1001234567890` dưới `channels.telegram.groups`.
      - Đặt ID người dùng Telegram như `8734062810` dưới `groupAllowFrom` khi bạn muốn giới hạn những người trong một nhóm đã được cho phép có thể kích hoạt bot.
      - Chỉ dùng `groupAllowFrom: ["*"]` khi bạn muốn bất kỳ thành viên nào của một nhóm đã được cho phép đều có thể nói chuyện với bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Trả lời trong nhóm mặc định yêu cầu nhắc đến.

    Việc nhắc đến có thể đến từ:

    - nhắc `@botusername` nguyên gốc, hoặc
    - mẫu nhắc trong:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Công tắc lệnh cấp phiên:

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

    Ngữ cảnh lịch sử nhóm mặc định là `mention-only`: các tin nhắn nhóm trước đó chỉ được
    bao gồm khi chúng được gửi đến bot, là phản hồi cho bot,
    hoặc là tin nhắn của chính bot. Đặt `includeGroupHistoryContext: "recent"` để
    bao gồm lịch sử phòng gần đây cho các nhóm đáng tin cậy. Đặt
    `includeGroupHistoryContext: "none"` để không gửi lịch sử nhóm Telegram trước đó
    trong lượt tiếp theo.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Lấy ID chat nhóm:

    - chuyển tiếp một tin nhắn nhóm đến `@userinfobot` / `@getidsbot`
    - hoặc đọc `chat.id` từ `openclaw logs --follow`
    - hoặc kiểm tra Bot API `getUpdates`
    - sau khi nhóm được cho phép, chạy `/whoami@<bot_username>` nếu lệnh nguyên gốc được bật

  </Tab>
</Tabs>

## Hành vi runtime

- Telegram do tiến trình gateway sở hữu.
- Định tuyến mang tính xác định: phản hồi đến từ Telegram sẽ trả lời lại qua Telegram (mô hình không chọn kênh).
- Tin nhắn đến được chuẩn hóa vào phong bì kênh dùng chung với siêu dữ liệu trả lời, placeholder phương tiện, và ngữ cảnh chuỗi trả lời được lưu bền vững cho các trả lời Telegram mà gateway đã quan sát.
- Phiên nhóm được cô lập theo ID nhóm. Chủ đề diễn đàn nối thêm `:topic:<threadId>` để giữ các chủ đề tách biệt.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw giữ lại giá trị này cho các trả lời. Phiên chủ đề DM chỉ tách khi Telegram `getMe` báo cáo `has_topics_enabled: true` cho bot; nếu không, DM vẫn ở phiên phẳng.
- Long polling dùng grammY runner với trình tự theo từng cuộc trò chuyện/từng luồng. Đồng thời sink tổng thể của runner dùng `agents.defaults.maxConcurrent`.
- Khởi động đa tài khoản giới hạn các probe Telegram `getMe` đồng thời để các đội bot lớn không bung toàn bộ probe tài khoản cùng lúc.
- Long polling được bảo vệ bên trong mỗi tiến trình gateway để mỗi lần chỉ một poller đang hoạt động có thể dùng một bot token. Nếu bạn vẫn thấy xung đột `getUpdates` 409, có khả năng một gateway OpenClaw, script, hoặc poller bên ngoài khác đang dùng cùng token.
- Watchdog long-polling kích hoạt khởi động lại mặc định sau 120 giây không có liveness `getUpdates` hoàn tất. Chỉ tăng `channels.telegram.pollingStallThresholdMs` nếu triển khai của bạn vẫn thấy các lần khởi động lại polling-stall giả trong khi công việc chạy lâu. Giá trị tính bằng mili giây và được phép từ `30000` đến `600000`; hỗ trợ ghi đè theo từng tài khoản.
- Telegram Bot API không hỗ trợ biên nhận đã đọc (`sendReadReceipts` không áp dụng).

<Note>
  `channels.telegram.dm.threadReplies` và `channels.telegram.direct.<chatId>.threadReplies` đã bị xóa. Chạy `openclaw doctor --fix` sau khi nâng cấp nếu cấu hình của bạn vẫn có các khóa đó. Định tuyến chủ đề DM giờ tuân theo năng lực bot từ Telegram `getMe.has_topics_enabled`, được kiểm soát bởi chế độ luồng của BotFather: bot bật chủ đề dùng phiên DM theo phạm vi luồng khi Telegram gửi `message_thread_id`; các DM khác vẫn ở phiên phẳng.
</Note>

## Tham chiếu tính năng

<AccordionGroup>
  <Accordion title="Xem trước luồng trực tiếp (chỉnh sửa tin nhắn)">
    OpenClaw có thể truyền các trả lời từng phần theo thời gian thực:

    - cuộc trò chuyện trực tiếp: tin nhắn xem trước + `editMessageText`
    - nhóm/chủ đề: tin nhắn xem trước + `editMessageText`

    Yêu cầu:

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - các bản xem trước câu trả lời ban đầu ngắn được debounce, rồi được hiện thực hóa sau một độ trễ có giới hạn nếu lượt chạy vẫn đang hoạt động
    - `progress` giữ một bản nháp trạng thái có thể chỉnh sửa cho tiến độ công cụ, hiển thị nhãn trạng thái ổn định khi hoạt động trả lời đến trước tiến độ công cụ, xóa nó khi hoàn tất, và gửi câu trả lời cuối cùng dưới dạng tin nhắn bình thường
    - `streaming.preview.toolProgress` kiểm soát việc cập nhật công cụ/tiến độ có dùng lại cùng tin nhắn xem trước đã chỉnh sửa hay không (mặc định: `true` khi streaming xem trước đang hoạt động)
    - `streaming.preview.commandText` kiểm soát chi tiết lệnh/exec bên trong các dòng tiến độ công cụ đó: `raw` (mặc định, giữ nguyên hành vi đã phát hành) hoặc `status` (chỉ nhãn công cụ)
    - `streaming.progress.commentary` (mặc định: `false`) chọn tham gia văn bản bình luận/mở đầu của trợ lý trong bản nháp tiến độ tạm thời
    - `channels.telegram.streamMode` cũ, các giá trị boolean `streaming`, và các khóa xem trước bản nháp native đã nghỉ hưu được phát hiện; chạy `openclaw doctor --fix` để di chuyển chúng sang cấu hình streaming hiện tại

    Cập nhật xem trước tiến độ công cụ là các dòng trạng thái ngắn hiển thị trong khi công cụ chạy, ví dụ thực thi lệnh, đọc tệp, cập nhật kế hoạch, tóm tắt bản vá, hoặc văn bản mở đầu/bình luận Codex trong chế độ app-server Codex. Telegram bật mặc định các dòng này để khớp hành vi OpenClaw đã phát hành từ `v2026.4.22` trở về sau.

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

    Dùng chế độ `progress` khi bạn muốn thấy tiến độ công cụ mà không chỉnh sửa câu trả lời cuối cùng vào cùng tin nhắn đó. Đặt chính sách văn bản lệnh bên dưới `streaming.progress`:

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

    Chỉ dùng `streaming.mode: "off"` khi bạn muốn chỉ gửi kết quả cuối cùng: chỉnh sửa xem trước Telegram bị tắt và đoạn trao đổi công cụ/tiến độ chung bị triệt tiêu thay vì được gửi dưới dạng tin nhắn trạng thái độc lập. Lời nhắc phê duyệt, payload phương tiện, và lỗi vẫn định tuyến qua cơ chế gửi cuối cùng bình thường. Dùng `streaming.preview.toolProgress: false` khi bạn chỉ muốn giữ chỉnh sửa xem trước câu trả lời trong khi ẩn các dòng trạng thái tiến độ công cụ.

    <Note>
      Trả lời trích dẫn được chọn của Telegram là ngoại lệ. Khi `replyToMode` là `"first"`, `"all"`, hoặc `"batched"` và tin nhắn đến bao gồm văn bản trích dẫn được chọn, OpenClaw gửi câu trả lời cuối cùng qua đường trả lời trích dẫn native của Telegram thay vì chỉnh sửa bản xem trước câu trả lời, nên `streaming.preview.toolProgress` không thể hiển thị các dòng trạng thái ngắn cho lượt đó. Trả lời tin nhắn hiện tại không có văn bản trích dẫn được chọn vẫn giữ streaming xem trước. Đặt `replyToMode: "off"` khi khả năng thấy tiến độ công cụ quan trọng hơn trả lời trích dẫn native, hoặc đặt `streaming.preview.toolProgress: false` để chấp nhận đánh đổi này.
    </Note>

    Với trả lời chỉ có văn bản:

    - bản xem trước ngắn trong DM/nhóm/chủ đề: OpenClaw giữ cùng tin nhắn xem trước và thực hiện chỉnh sửa cuối cùng tại chỗ
    - kết quả văn bản dài bị tách thành nhiều tin nhắn Telegram sẽ dùng lại bản xem trước hiện có làm đoạn kết quả đầu tiên khi có thể, rồi chỉ gửi các đoạn còn lại
    - kết quả cuối cùng ở chế độ progress xóa bản nháp trạng thái và dùng cơ chế gửi cuối cùng bình thường thay vì chỉnh sửa bản nháp thành câu trả lời
    - nếu chỉnh sửa cuối cùng thất bại trước khi văn bản hoàn tất được xác nhận, OpenClaw dùng cơ chế gửi cuối cùng bình thường và dọn bản xem trước cũ

    Với trả lời phức tạp (ví dụ payload phương tiện), OpenClaw rơi về cơ chế gửi cuối cùng bình thường rồi dọn tin nhắn xem trước.

    Streaming xem trước tách biệt với streaming theo khối. Khi streaming theo khối được bật rõ ràng cho Telegram, OpenClaw bỏ qua luồng xem trước để tránh streaming hai lần.

    Hành vi luồng suy luận:

    - `/reasoning stream` dùng đường xem trước suy luận của kênh được hỗ trợ; trên Telegram, nó truyền suy luận vào bản xem trước trực tiếp trong khi tạo
    - bản xem trước suy luận bị xóa sau khi gửi cuối cùng; dùng `/reasoning on` khi suy luận cần vẫn hiển thị
    - câu trả lời cuối cùng được gửi không kèm văn bản suy luận

  </Accordion>

  <Accordion title="Định dạng tin nhắn phong phú">
    Văn bản gửi đi mặc định dùng tin nhắn HTML Telegram chuẩn để các trả lời vẫn dễ đọc trên các client Telegram hiện tại. Chế độ tương thích này hỗ trợ in đậm, in nghiêng, liên kết, code, spoiler, và trích dẫn thông thường, nhưng không hỗ trợ các khối chỉ có trong định dạng phong phú của Bot API 10.1 như bảng native, chi tiết, phương tiện phong phú, và công thức.

    Đặt `channels.telegram.richMessages: true` để chọn dùng tin nhắn phong phú của Bot API 10.1:

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

    - Agent được thông báo rằng tin nhắn phong phú Telegram khả dụng cho bot/tài khoản này.
    - Văn bản Markdown được kết xuất qua Markdown IR của OpenClaw và gửi dưới dạng HTML phong phú Telegram.
    - Payload HTML phong phú rõ ràng giữ lại các thẻ Bot API 10.1 được hỗ trợ như heading, bảng, chi tiết, phương tiện phong phú, và công thức.
    - Chú thích phương tiện vẫn dùng chú thích HTML Telegram vì tin nhắn phong phú không thay thế chú thích.

    Điều này giữ văn bản mô hình tránh xa các ký hiệu Telegram Rich Markdown, nên tiền tệ như `$400-600K` không bị phân tích thành toán học. Văn bản phong phú dài được tự động tách theo giới hạn văn bản phong phú và khối phong phú của Telegram. Bảng vượt giới hạn cột của Telegram được gửi dưới dạng khối code.

    Mặc định: tắt để tương thích với client. Tin nhắn phong phú yêu cầu các client Telegram tương thích; một số client Desktop, Web, Android, và bên thứ ba hiện tại hiển thị tin nhắn phong phú đã được chấp nhận là không được hỗ trợ. Giữ tùy chọn này tắt trừ khi mọi client dùng với bot đều có thể kết xuất chúng. `/status` hiển thị phiên Telegram hiện tại bật hay tắt tin nhắn phong phú.

    Xem trước liên kết được bật mặc định. `channels.telegram.linkPreview: false` bỏ qua phát hiện thực thể tự động cho văn bản phong phú.

  </Accordion>

  <Accordion title="Lệnh native và lệnh tùy chỉnh">
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

    - tên được chuẩn hóa (bỏ `/` đứng đầu, chuyển chữ thường)
    - mẫu hợp lệ: `a-z`, `0-9`, `_`, độ dài `1..32`
    - lệnh tùy chỉnh không thể ghi đè lệnh native
    - xung đột/trùng lặp bị bỏ qua và ghi log

    Ghi chú:

    - lệnh tùy chỉnh chỉ là mục menu; chúng không tự triển khai hành vi
    - lệnh plugin/skill vẫn có thể hoạt động khi được nhập, ngay cả khi không hiển thị trong menu Telegram

    Nếu lệnh native bị tắt, các lệnh tích hợp bị xóa. Lệnh tùy chỉnh/plugin vẫn có thể đăng ký nếu được cấu hình.

    Lỗi thiết lập thường gặp:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu Telegram vẫn bị tràn sau khi cắt bớt; giảm lệnh plugin/skill/tùy chỉnh hoặc tắt `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands`, hoặc `setMyCommands` thất bại với `404: Not Found` trong khi lệnh curl trực tiếp tới Bot API hoạt động có thể nghĩa là `channels.telegram.apiRoot` đã được đặt thành endpoint đầy đủ `/bot<TOKEN>`. `apiRoot` chỉ được là root của Bot API, và `openclaw doctor --fix` xóa phần `/bot<TOKEN>` vô tình ở cuối.
    - `getMe returned 401` nghĩa là Telegram đã từ chối bot token được cấu hình. Cập nhật `botToken`, `tokenFile`, hoặc `TELEGRAM_BOT_TOKEN` bằng token BotFather hiện tại; OpenClaw dừng trước khi polling nên lỗi này không được báo cáo là lỗi dọn webhook.
    - `setMyCommands failed` với lỗi network/fetch thường nghĩa là DNS/HTTPS đi ra `api.telegram.org` bị chặn.

    ### Lệnh ghép đôi thiết bị (plugin `device-pair`)

    Khi plugin `device-pair` được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ (bao gồm vai trò/phạm vi)
    4. phê duyệt yêu cầu:
       - `/pair approve <requestId>` để phê duyệt rõ ràng
       - `/pair approve` khi chỉ có một yêu cầu đang chờ
       - `/pair approve latest` cho yêu cầu gần đây nhất

    Mã thiết lập mang một bootstrap token tồn tại ngắn hạn. Bootstrap mã thiết lập tích hợp chỉ dành cho node: lần kết nối đầu tiên tạo một yêu cầu node đang chờ, và sau khi phê duyệt Gateway trả về một node token bền vững với `scopes: []`. Nó không trả về operator token được bàn giao; quyền truy cập operator yêu cầu một quy trình ghép đôi operator hoặc luồng token được phê duyệt riêng.

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (ví dụ vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó bị thay thế và yêu cầu mới dùng `requestId` khác. Chạy lại `/pair pending` trước khi phê duyệt.

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

    `capabilities: ["inlineButtons"]` kiểu cũ ánh xạ tới `inlineButtons: "all"`.

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

    Các nút Telegram `web_app` chỉ hoạt động trong cuộc trò chuyện riêng giữa người dùng và
    bot.

    Các lần nhấp callback được chuyển cho tác tử dưới dạng văn bản:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Hành động tin nhắn Telegram cho tác tử và tự động hóa">
    Các hành động công cụ Telegram bao gồm:

    - `sendMessage` (`to`, `content`, `mediaUrl` tùy chọn, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` hoặc `caption`, các nút nội tuyến `presentation` tùy chọn; chỉnh sửa chỉ nút sẽ cập nhật reply markup)
    - `createForumTopic` (`chatId`, `name`, `iconColor` tùy chọn, `iconCustomEmojiId`)

    Các hành động tin nhắn kênh cung cấp những bí danh tiện dụng (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kiểm soát điều kiện kích hoạt:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (mặc định: tắt)

    Lưu ý: `edit` và `topic-create` hiện được bật theo mặc định và không có công tắc `channels.telegram.actions.*` riêng.
    Các lần gửi khi chạy dùng ảnh chụp cấu hình/bí mật đang hoạt động (khởi động/tải lại), vì vậy các đường dẫn hành động không thực hiện phân giải lại SecretRef tùy ý cho từng lần gửi.

    Ngữ nghĩa gỡ phản ứng: [/tools/reactions](/vi/tools/reactions)

  </Accordion>

  <Accordion title="Thẻ luồng trả lời">
    Telegram hỗ trợ các thẻ luồng trả lời rõ ràng trong đầu ra được tạo:

    - `[[reply_to_current]]` trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` trả lời một ID tin nhắn Telegram cụ thể

    `channels.telegram.replyToMode` kiểm soát cách xử lý:

    - `off` (mặc định)
    - `first`
    - `all`

    Khi luồng trả lời được bật và có văn bản hoặc chú thích Telegram gốc, OpenClaw tự động bao gồm một đoạn trích dẫn Telegram gốc. Telegram giới hạn văn bản trích dẫn gốc ở 1024 đơn vị mã UTF-16, nên các tin nhắn dài hơn sẽ được trích từ đầu và quay về trả lời thường nếu Telegram từ chối trích dẫn.

    Lưu ý: `off` tắt luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được áp dụng.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi luồng">
    Siêu nhóm diễn đàn:

    - khóa phiên chủ đề nối thêm `:topic:<threadId>`
    - phản hồi và trạng thái đang nhập nhắm tới luồng chủ đề
    - đường dẫn cấu hình chủ đề:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Trường hợp đặc biệt của chủ đề chung (`threadId=1`):

    - gửi tin nhắn bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)`)
    - hành động đang nhập vẫn bao gồm `message_thread_id`

    Kế thừa chủ đề: mục nhập chủ đề kế thừa thiết lập nhóm trừ khi bị ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` chỉ thuộc chủ đề và không kế thừa từ mặc định của nhóm.
    `topics."*"` đặt mặc định cho mọi chủ đề trong nhóm đó; ID chủ đề chính xác vẫn ưu tiên hơn `"*"`.

    **Định tuyến tác tử theo từng chủ đề**: Mỗi chủ đề có thể định tuyến tới một tác tử khác bằng cách đặt `agentId` trong cấu hình chủ đề. Điều này cho mỗi chủ đề một không gian làm việc, bộ nhớ và phiên biệt lập riêng. Ví dụ:

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

    **Liên kết chủ đề ACP bền vững**: Chủ đề diễn đàn có thể ghim phiên harness ACP thông qua các liên kết ACP có kiểu ở cấp cao nhất (`bindings[]` với `type: "acp"` và `match.channel: "telegram"`, `peer.kind: "group"`, cùng ID có định danh chủ đề như `-1001234567890:topic:42`). Hiện được giới hạn cho chủ đề diễn đàn trong nhóm/siêu nhóm. Xem [Tác tử ACP](/vi/tools/acp-agents).

    **Tạo ACP gắn với luồng từ chat**: `/acp spawn <agent> --thread here|auto` liên kết chủ đề hiện tại với một phiên ACP mới; các lượt tiếp theo được định tuyến trực tiếp tới đó. OpenClaw ghim xác nhận tạo trong chủ đề. Yêu cầu `channels.telegram.threadBindings.spawnSessions` vẫn được bật (mặc định: `true`).

    Ngữ cảnh mẫu cung cấp `MessageThreadId` và `IsForum`. Chat DM có `message_thread_id` giữ siêu dữ liệu trả lời; chúng chỉ dùng khóa phiên nhận biết luồng khi Telegram `getMe` báo cáo `has_topics_enabled: true` cho bot.
    Các ghi đè `dm.threadReplies` và `direct.*.threadReplies` trước đây đã được chủ ý loại bỏ; dùng chế độ luồng của BotFather làm nguồn sự thật duy nhất và chạy `openclaw doctor --fix` để xóa các khóa cấu hình cũ.

  </Accordion>

  <Accordion title="Âm thanh, video và nhãn dán">
    ### Tin nhắn âm thanh

    Telegram phân biệt ghi chú thoại và tệp âm thanh.

    - mặc định: hành vi tệp âm thanh
    - thẻ `[[audio_as_voice]]` trong phản hồi của tác tử để buộc gửi ghi chú thoại
    - bản ghi lời nói của ghi chú thoại gửi đến được đóng khung là văn bản do máy tạo,
      không đáng tin cậy trong ngữ cảnh tác tử; phát hiện nhắc tên vẫn dùng bản ghi thô
      nên tin nhắn thoại bị chặn theo nhắc tên vẫn tiếp tục hoạt động.

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

    Mô tả sticker được lưu trong bộ nhớ đệm trong trạng thái Plugin SQLite của OpenClaw để giảm các lần gọi thị giác lặp lại.

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
    Phản ứng Telegram đến dưới dạng các bản cập nhật `message_reaction` (tách riêng với payload tin nhắn).

    Khi được bật, OpenClaw xếp hàng các sự kiện hệ thống như:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Cấu hình:

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    Ghi chú:

    - `own` nghĩa là chỉ phản ứng của người dùng với tin nhắn do bot gửi (nỗ lực tối đa thông qua bộ nhớ đệm tin nhắn đã gửi).
    - Sự kiện phản ứng vẫn tuân theo các kiểm soát truy cập của Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được ủy quyền sẽ bị loại bỏ.
    - Telegram không cung cấp ID chuỗi trong các bản cập nhật phản ứng.
      - nhóm không phải forum được định tuyến tới phiên trò chuyện nhóm
      - nhóm forum được định tuyến tới phiên chủ đề chung của nhóm (`:topic:1`), không phải chủ đề gốc chính xác

    `allowed_updates` cho polling/webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Phản ứng ack">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn gửi đến. `ackReactionScope` quyết định *khi nào* emoji đó thực sự được gửi.

    **Thứ tự phân giải emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji dự phòng từ danh tính agent (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Telegram mong đợi emoji unicode (ví dụ "👀").
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

    **Phạm vi (`messages.ackReactionScope`):**

    Nhà cung cấp Telegram đọc phạm vi từ `messages.ackReactionScope` (mặc định `"group-mentions"`). Hiện nay không có ghi đè ở cấp tài khoản Telegram hoặc cấp kênh Telegram.

    Giá trị: `"all"` (DM + nhóm), `"direct"` (chỉ DM), `"group-all"` (mọi tin nhắn nhóm, không có DM), `"group-mentions"` (nhóm khi bot được nhắc đến; **không có DM** — đây là mặc định), `"off"` / `"none"` (đã tắt).

    <Note>
    Phạm vi mặc định (`"group-mentions"`) không kích hoạt phản ứng ack trong tin nhắn trực tiếp. Để nhận phản ứng ack trên DM Telegram gửi đến, đặt `messages.ackReactionScope` thành `"direct"` hoặc `"all"`. Giá trị được đọc khi nhà cung cấp Telegram khởi động, vì vậy cần khởi động lại Gateway để thay đổi có hiệu lực.
    </Note>

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
    Mặc định là long polling. Đối với chế độ Webhook, đặt `channels.telegram.webhookUrl` và `channels.telegram.webhookSecret`; tùy chọn `webhookPath`, `webhookHost`, `webhookPort` (mặc định `/telegram-webhook`, `127.0.0.1`, `8787`).

    Ở chế độ long-polling, OpenClaw chỉ duy trì watermark khởi động lại sau khi một bản cập nhật được điều phối thành công. Nếu handler thất bại, bản cập nhật đó vẫn có thể được thử lại trong cùng tiến trình và không được ghi là đã hoàn tất để khử trùng lặp khi khởi động lại.

    Listener cục bộ bind tới `127.0.0.1:8787`. Đối với ingress công khai, hãy đặt reverse proxy phía trước cổng cục bộ hoặc chủ đích đặt `webhookHost: "0.0.0.0"`.

    Chế độ Webhook xác thực các guard của yêu cầu, token bí mật Telegram và thân JSON trước khi trả về `200` cho Telegram.
    Sau đó OpenClaw xử lý bản cập nhật bất đồng bộ thông qua cùng các làn bot theo từng cuộc trò chuyện/từng chủ đề được long polling sử dụng, nên các lượt agent chậm không giữ ACK giao hàng của Telegram.

  </Accordion>

  <Accordion title="Giới hạn, thử lại và mục tiêu CLI">
    - Giá trị mặc định của `channels.telegram.textChunkLimit` là 4000.
    - `channels.telegram.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi tách theo độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước phương tiện Telegram gửi đến và gửi đi.
    - `channels.telegram.mediaGroupFlushMs` (mặc định 500) kiểm soát thời gian album/nhóm phương tiện Telegram được đệm trước khi OpenClaw gửi chúng dưới dạng một tin nhắn đầu vào. Tăng giá trị này nếu các phần album đến muộn; giảm giá trị này để giảm độ trễ trả lời album.
    - `channels.telegram.timeoutSeconds` ghi đè thời gian chờ của máy khách API Telegram (nếu không đặt, mặc định grammY sẽ áp dụng). Máy khách bot kẹp các giá trị đã cấu hình thấp hơn ngưỡng bảo vệ yêu cầu văn bản/đang nhập gửi đi 60 giây để grammY không hủy việc gửi phản hồi hiển thị trước khi ngưỡng bảo vệ truyền tải và cơ chế dự phòng của OpenClaw có thể chạy. Long polling vẫn dùng ngưỡng bảo vệ yêu cầu `getUpdates` 45 giây để các lần thăm dò nhàn rỗi không bị bỏ vô thời hạn.
    - `channels.telegram.pollingStallThresholdMs` mặc định là `120000`; chỉ điều chỉnh trong khoảng `30000` đến `600000` cho các lần khởi động lại do phát hiện sai tình trạng thăm dò bị kẹt.
    - lịch sử ngữ cảnh nhóm dùng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` sẽ tắt.
    - ngữ cảnh bổ sung từ trả lời/trích dẫn/chuyển tiếp được chuẩn hóa vào một cửa sổ ngữ cảnh hội thoại đã chọn khi Gateway đã quan sát các tin nhắn cha; bộ nhớ đệm tin nhắn đã quan sát nằm trong trạng thái Plugin SQLite của OpenClaw, và `openclaw doctor --fix` nhập các sidecar cũ. Telegram chỉ bao gồm một `reply_to_message` nông trong các bản cập nhật, nên các chuỗi cũ hơn bộ nhớ đệm bị giới hạn bởi tải trọng cập nhật hiện tại của Telegram.
    - danh sách cho phép của Telegram chủ yếu kiểm soát ai có thể kích hoạt agent, không phải là ranh giới biên tập ngữ cảnh bổ sung đầy đủ.
    - Điều khiển lịch sử DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Cấu hình `channels.telegram.retry` áp dụng cho các trình trợ giúp gửi Telegram (CLI/công cụ/hành động) đối với lỗi API gửi đi có thể khôi phục. Việc gửi phản hồi cuối cùng đầu vào cũng dùng cơ chế thử lại gửi an toàn có giới hạn cho lỗi trước khi kết nối Telegram, nhưng không thử lại các phong bì mạng mơ hồ sau khi gửi vì có thể nhân đôi tin nhắn hiển thị.

    Mục tiêu gửi của CLI và công cụ tin nhắn có thể là ID trò chuyện dạng số, tên người dùng, hoặc mục tiêu chủ đề diễn đàn:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Các cuộc thăm dò Telegram dùng `openclaw message poll` và hỗ trợ chủ đề diễn đàn:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Cờ thăm dò chỉ dành cho Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` cho chủ đề diễn đàn (hoặc dùng mục tiêu `:topic:`)

    Gửi Telegram cũng hỗ trợ:

    - `--presentation` với các khối `buttons` cho bàn phím nội tuyến khi `channels.telegram.capabilities.inlineButtons` cho phép
    - `--pin` hoặc `--delivery '{"pin":true}'` để yêu cầu gửi được ghim khi bot có thể ghim trong cuộc trò chuyện đó
    - `--force-document` để gửi hình ảnh, GIF và video gửi đi dưới dạng tài liệu thay vì ảnh nén, phương tiện động hoặc tệp tải lên video

    Kiểm soát hành động:

    - `channels.telegram.actions.sendMessage=false` tắt tin nhắn Telegram gửi đi, bao gồm cả cuộc thăm dò
    - `channels.telegram.actions.poll=false` tắt tạo cuộc thăm dò Telegram trong khi vẫn bật gửi thông thường

  </Accordion>

  <Accordion title="Phê duyệt thực thi trong Telegram">
    Telegram hỗ trợ phê duyệt thực thi trong DM của người phê duyệt và có thể tùy chọn đăng lời nhắc trong cuộc trò chuyện hoặc chủ đề gốc. Người phê duyệt phải là ID người dùng Telegram dạng số.

    Đường dẫn cấu hình:

    - `channels.telegram.execApprovals.enabled` (tự động bật khi có thể phân giải ít nhất một người phê duyệt)
    - `channels.telegram.execApprovals.approvers` (dự phòng về ID chủ sở hữu dạng số từ `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (mặc định) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, và `defaultTo` kiểm soát ai có thể trò chuyện với bot và nơi bot gửi phản hồi thông thường. Chúng không biến ai đó thành người phê duyệt thực thi. Ghép cặp DM được phê duyệt đầu tiên sẽ khởi tạo `commands.ownerAllowFrom` khi chưa có chủ sở hữu lệnh nào, nên thiết lập một chủ sở hữu vẫn hoạt động mà không cần lặp lại ID trong `execApprovals.approvers`.

    Gửi qua kênh sẽ hiển thị văn bản lệnh trong cuộc trò chuyện; chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi lời nhắc đến một chủ đề diễn đàn, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và phần theo sau. Phê duyệt thực thi mặc định hết hạn sau 30 phút.

    Các nút phê duyệt nội tuyến cũng yêu cầu `channels.telegram.capabilities.inlineButtons` cho phép bề mặt đích (`dm`, `group`, hoặc `all`). ID phê duyệt có tiền tố `plugin:` được phân giải qua phê duyệt Plugin; các ID khác được phân giải qua phê duyệt thực thi trước.

    Xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Điều khiển phản hồi lỗi

Khi agent gặp lỗi gửi hoặc lỗi nhà cung cấp, Telegram có thể trả lời bằng văn bản lỗi hoặc chặn văn bản đó. Hai khóa cấu hình kiểm soát hành vi này:

| Khóa                                | Giá trị           | Mặc định | Mô tả                                                                                              |
| ----------------------------------- | ----------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` gửi một tin nhắn lỗi thân thiện đến cuộc trò chuyện. `silent` chặn hoàn toàn phản hồi lỗi. |
| `channels.telegram.errorCooldownMs` | số (ms)           | `60000`  | Thời gian tối thiểu giữa các phản hồi lỗi đến cùng một cuộc trò chuyện. Ngăn spam lỗi khi sự cố.   |

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

    - Nếu `requireMention=false`, chế độ quyền riêng tư của Telegram phải cho phép hiển thị đầy đủ.
      - BotFather: `/setprivacy` -> Disable
      - sau đó xóa + thêm lại bot vào nhóm
    - `openclaw channels status` cảnh báo khi cấu hình kỳ vọng tin nhắn nhóm không được đề cập.
    - `openclaw channels status --probe` có thể kiểm tra ID nhóm dạng số rõ ràng; ký tự đại diện `"*"` không thể được thăm dò tư cách thành viên.
    - kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot hoàn toàn không thấy tin nhắn nhóm">

    - khi `channels.telegram.groups` tồn tại, nhóm phải được liệt kê (hoặc bao gồm `"*"`)
    - xác minh tư cách thành viên của bot trong nhóm
    - xem lại nhật ký: `openclaw logs --follow` để biết lý do bỏ qua

  </Accordion>

  <Accordion title="Lệnh hoạt động một phần hoặc hoàn toàn không hoạt động">

    - cấp quyền cho danh tính người gửi của bạn (ghép cặp và/hoặc `allowFrom` dạng số)
    - ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`
    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` nghĩa là menu gốc có quá nhiều mục; giảm lệnh plugin/kỹ năng/tùy chỉnh hoặc tắt menu gốc
    - Các lệnh khởi động `deleteMyCommands` / `setMyCommands` và lệnh đang nhập `sendChatAction` được giới hạn và thử lại một lần qua cơ chế dự phòng truyền tải của Telegram khi yêu cầu hết thời gian chờ. Lỗi mạng/tìm nạp kéo dài thường cho thấy vấn đề khả năng truy cập DNS/HTTPS đến `api.telegram.org`

  </Accordion>

  <Accordion title="Khởi động báo token không được ủy quyền">

    - `getMe returned 401` là lỗi xác thực Telegram cho token bot đã cấu hình.
    - Sao chép lại hoặc tạo lại token bot trong BotFather, sau đó cập nhật `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, hoặc `TELEGRAM_BOT_TOKEN` cho tài khoản mặc định.
    - `deleteWebhook 401 Unauthorized` trong khi khởi động cũng là lỗi xác thực; coi nó là "không có webhook tồn tại" sẽ chỉ trì hoãn cùng lỗi token xấu đó đến các lệnh gọi API sau.

  </Accordion>

  <Accordion title="Thăm dò hoặc mạng không ổn định">

    - Node 22+ + fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy ngay lập tức nếu kiểu AbortSignal không khớp.
    - Một số máy chủ phân giải `api.telegram.org` sang IPv6 trước; đường ra IPv6 bị hỏng có thể gây lỗi API Telegram gián đoạn.
    - Nếu nhật ký bao gồm `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!`, OpenClaw hiện thử lại các lỗi này như lỗi mạng có thể khôi phục.
    - Trong khi khởi động thăm dò, OpenClaw tái sử dụng lần dò `getMe` khởi động thành công cho grammY để trình chạy không cần `getMe` thứ hai trước `getUpdates` đầu tiên.
    - Nếu `deleteWebhook` thất bại với lỗi mạng tạm thời trong khi khởi động thăm dò, OpenClaw tiếp tục vào long polling thay vì thực hiện một lệnh gọi mặt phẳng điều khiển trước thăm dò khác. Webhook vẫn hoạt động sẽ xuất hiện dưới dạng xung đột `getUpdates`; OpenClaw sau đó dựng lại truyền tải Telegram và thử lại dọn dẹp webhook.
    - Nếu socket Telegram được tái chế theo nhịp cố định ngắn, hãy kiểm tra `channels.telegram.timeoutSeconds` thấp; máy khách bot kẹp các giá trị đã cấu hình thấp hơn ngưỡng bảo vệ yêu cầu gửi đi và `getUpdates`, nhưng các bản phát hành cũ hơn có thể hủy mọi lần thăm dò hoặc phản hồi khi giá trị này được đặt thấp hơn các ngưỡng bảo vệ đó.
    - Nếu nhật ký bao gồm `Polling stall detected`, OpenClaw khởi động lại thăm dò và dựng lại truyền tải Telegram sau 120 giây không có tín hiệu sống long-poll hoàn tất theo mặc định.
    - `openclaw channels status --probe` và `openclaw doctor` cảnh báo khi một tài khoản thăm dò đang chạy chưa hoàn tất `getUpdates` sau thời gian gia hạn khởi động, khi một tài khoản webhook đang chạy chưa hoàn tất `setWebhook` sau thời gian gia hạn khởi động, hoặc khi hoạt động truyền tải thăm dò thành công cuối cùng đã cũ.
    - Chỉ tăng `channels.telegram.pollingStallThresholdMs` khi các lệnh gọi `getUpdates` chạy lâu vẫn khỏe nhưng máy chủ của bạn vẫn báo cáo sai các lần khởi động lại do thăm dò bị kẹt. Tình trạng kẹt kéo dài thường chỉ ra vấn đề proxy, DNS, IPv6 hoặc đường ra TLS giữa máy chủ và `api.telegram.org`.
    - Telegram cũng tôn trọng biến môi trường proxy của tiến trình cho truyền tải Bot API, bao gồm `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và các biến chữ thường tương ứng. `NO_PROXY` / `no_proxy` vẫn có thể bỏ qua `api.telegram.org`.
    - Nếu proxy do OpenClaw quản lý được cấu hình qua `OPENCLAW_PROXY_URL` cho môi trường dịch vụ và không có biến môi trường proxy chuẩn nào, Telegram cũng dùng URL đó cho truyền tải Bot API.
    - Trên máy chủ VPS có đường ra/TLS trực tiếp không ổn định, định tuyến các lệnh gọi API Telegram qua `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định là `autoSelectFamily=true` (trừ WSL2). Thứ tự kết quả DNS Telegram tôn trọng `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, rồi `channels.telegram.network.dnsResultOrder`, rồi mặc định tiến trình như `NODE_OPTIONS=--dns-result-order=ipv4first`; nếu không cái nào áp dụng, Node 22+ dự phòng về `ipv4first`.
    - Nếu máy chủ của bạn là WSL2 hoặc rõ ràng hoạt động tốt hơn với hành vi chỉ IPv4, hãy ép chọn họ địa chỉ:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Các câu trả lời trong dải benchmark RFC 2544 (`198.18.0.0/15`) đã được cho phép
      mặc định đối với tải xuống phương tiện Telegram. Nếu một fake-IP đáng tin cậy hoặc
      proxy trong suốt ghi lại `api.telegram.org` thành một địa chỉ
      riêng tư/nội bộ/dành cho mục đích đặc biệt khác trong khi tải xuống phương tiện, bạn có thể bật
      bỏ qua chỉ dành cho Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Tùy chọn bật tương tự có sẵn theo từng tài khoản tại
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Nếu proxy của bạn phân giải máy chủ phương tiện Telegram thành `198.18.x.x`, trước tiên hãy để
      cờ nguy hiểm tắt. Phương tiện Telegram đã cho phép dải
      benchmark RFC 2544 theo mặc định.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` làm suy yếu các biện pháp bảo vệ SSRF
      cho phương tiện Telegram. Chỉ dùng tùy chọn này cho môi trường proxy đáng tin cậy
      do người vận hành kiểm soát, chẳng hạn như định tuyến fake-IP của Clash, Mihomo hoặc Surge khi chúng
      tổng hợp các câu trả lời riêng tư hoặc dành cho mục đích đặc biệt nằm ngoài dải
      benchmark RFC 2544. Hãy để tắt đối với truy cập Telegram qua internet công cộng thông thường.
    </Warning>

    - Ghi đè bằng biến môi trường (tạm thời):
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

<Accordion title="Các trường Telegram tín hiệu cao">

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` phải trỏ đến một tệp thông thường; liên kết tượng trưng bị từ chối)
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- mặc định chủ đề: `groups.<chatId>.topics."*"` áp dụng cho các chủ đề diễn đàn không khớp; ID chủ đề chính xác sẽ ghi đè nó
- phê duyệt exec: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- luồng hội thoại/trả lời: `replyToMode`
- truyền phát: `streaming` (xem trước), `streaming.preview.toolProgress`, `blockStreaming`
- định dạng/gửi: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- phương tiện/mạng: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- gốc API tùy chỉnh: `apiRoot` (chỉ gốc Bot API; không bao gồm `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- hành động/năng lực: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- phản ứng: `reactionNotifications`, `reactionLevel`
- lỗi: `errorPolicy`, `errorCooldownMs`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Thứ tự ưu tiên nhiều tài khoản: khi cấu hình hai ID tài khoản trở lên, hãy đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để làm rõ định tuyến mặc định. Nếu không, OpenClaw sẽ quay về ID tài khoản đã chuẩn hóa đầu tiên và `openclaw doctor` sẽ cảnh báo. Các tài khoản có tên kế thừa `channels.telegram.allowFrom` / `groupAllowFrom`, nhưng không kế thừa các giá trị `accounts.default.*`.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối một người dùng Telegram với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi danh sách cho phép nhóm và chủ đề.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến vào tác nhân.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Định tuyến đa tác nhân" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ nhóm và chủ đề tới tác nhân.
  </Card>
  <Card title="Khắc phục sự cố" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh.
  </Card>
</CardGroup>
