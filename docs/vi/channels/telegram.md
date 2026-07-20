---
read_when:
    - Phát triển các tính năng Telegram hoặc webhook
summary: Trạng thái hỗ trợ, tính năng và cấu hình bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-20T04:34:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d8fafa5a525aab0b6a79b76a10548423d147f6ec333b03b18fdacacacee34e3
    source_path: channels/telegram.md
    workflow: 16
---

Sẵn sàng cho môi trường production đối với tin nhắn riêng và nhóm của bot qua grammY. Long polling là phương thức truyền tải mặc định; chế độ webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách tin nhắn riêng mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Các quy trình chẩn đoán và sửa chữa trên nhiều kênh.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Tạo token bot trong BotFather">
    Cả hai luồng đều cung cấp một token để bạn dán vào OpenClaw — hãy chọn một:

    - **Luồng trò chuyện**: mở Telegram, trò chuyện với **@BotFather** (xác nhận tên người dùng chính xác là `@BotFather`), chạy `/newbot`, làm theo lời nhắc và lưu token.
    - **Luồng web**: mở [ứng dụng web của BotFather](https://t.me/BotFather?startapp) — ứng dụng này chạy trong mọi ứng dụng Telegram, bao gồm [web.telegram.org](https://web.telegram.org) — tạo bot trong giao diện người dùng và sao chép token của bot.

  </Step>

  <Step title="Cấu hình token và chính sách tin nhắn riêng">

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

    Biến môi trường dự phòng: `TELEGRAM_BOT_TOKEN` (chỉ dành cho tài khoản mặc định; các tài khoản có tên phải dùng `botToken` hoặc `tokenFile`).
    Telegram **không** dùng `openclaw channels login telegram`; hãy đặt token trong cấu hình/biến môi trường, sau đó khởi động Gateway.

  </Step>

  <Step title="Khởi động Gateway và phê duyệt tin nhắn riêng đầu tiên">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Mã ghép nối hết hạn sau 1 giờ.

  </Step>

  <Step title="Thêm bot vào nhóm">
    Thêm bot vào nhóm của bạn, sau đó lấy hai ID cần thiết để truy cập nhóm:

    - ID người dùng Telegram của bạn, dành cho `allowFrom` / `groupAllowFrom`
    - ID cuộc trò chuyện nhóm Telegram, làm khóa trong `channels.telegram.groups`

    Lấy ID cuộc trò chuyện nhóm từ `openclaw logs --follow`, một bot xác định ID từ tin nhắn chuyển tiếp hoặc `getUpdates` của Bot API. Sau khi nhóm được cho phép, `/whoami@<bot_username>` xác nhận ID người dùng và nhóm.

    Các ID siêu nhóm âm bắt đầu bằng `-100` là ID cuộc trò chuyện nhóm. Chúng nằm trong `channels.telegram.groups`, không phải `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Việc phân giải token có xét đến tài khoản: `tokenFile` được ưu tiên hơn `botToken`, rồi đến biến môi trường; cấu hình luôn được ưu tiên hơn `TELEGRAM_BOT_TOKEN` (chỉ được phân giải cho tài khoản mặc định). Sau khi khởi động thành công, OpenClaw lưu danh tính bot vào bộ nhớ đệm trong tối đa 24 giờ để các lần khởi động lại bỏ qua một lệnh gọi `getMe` bổ sung; việc thay đổi hoặc xóa token sẽ xóa bộ nhớ đệm đó.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị trong nhóm">
    Bot Telegram mặc định sử dụng **Privacy Mode**, chế độ này giới hạn những tin nhắn nhóm mà bot nhận được.

    Để xem tất cả tin nhắn nhóm, hãy thực hiện một trong các cách sau:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - đặt bot làm quản trị viên nhóm.

    Sau khi chuyển đổi chế độ riêng tư, hãy xóa rồi thêm lại bot vào từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền trong nhóm">
    Trạng thái quản trị viên được kiểm soát trong cài đặt nhóm Telegram. Bot quản trị viên nhận được tất cả tin nhắn nhóm, hữu ích cho hành vi luôn hoạt động trong nhóm.
  </Accordion>

  <Accordion title="Các tùy chọn BotFather hữu ích">

    - `/setjoingroups` — cho phép/từ chối thêm vào nhóm
    - `/setprivacy` — hành vi hiển thị trong nhóm

    Các cài đặt tương tự cũng có trong [ứng dụng web của BotFather](https://t.me/BotFather?startapp) nếu bạn muốn dùng giao diện người dùng thay vì lệnh trò chuyện.

  </Accordion>
</AccordionGroup>

## Mini App bảng điều khiển

Chạy `/dashboard` trong tin nhắn riêng với bot để mở bảng điều khiển OpenClaw bên trong Telegram.

Yêu cầu:

- `gateway.tailscale.mode: "serve"` hoặc `"funnel"` cho URL HTTPS đã xuất bản của Mini App.
- ID người dùng Telegram dạng số của bạn phải nằm trong `allowFrom` có hiệu lực của tài khoản đã chọn hoặc trong `commands.ownerAllowFrom`.
- Hãy dùng tin nhắn riêng. Trong nhóm, `/dashboard` phản hồi bằng `open this in a DM with the bot` và không gửi nút nào.
- Bản cài đặt Docker: Chế độ Serve/Funnel yêu cầu Gateway liên kết với loopback bên cạnh `tailscaled`, điều mà mạng bridge với các cổng được công khai không thể đáp ứng. Chạy container Gateway với `network_mode: host`, đồng thời gắn socket `tailscaled` của máy chủ (`/var/run/tailscale`) và CLI `tailscale` vào container.

Mini App là một đường dẫn v1 chỉ dành cho Tailscale và không hỗ trợ iframe Telegram Web.

## Kiểm soát truy cập và kích hoạt

### Danh tính bot trong nhóm

Trong nhóm và chủ đề diễn đàn, việc đề cập rõ ràng đến tên định danh bot đã cấu hình (ví dụ `@my_bot`) sẽ gọi tác nhân OpenClaw đã chọn, ngay cả khi tên nhân dạng của tác nhân khác với tên người dùng Telegram. Chính sách im lặng trong nhóm vẫn áp dụng cho lưu lượng không liên quan, nhưng tên định danh của bot không bao giờ là "người khác".

<Tabs>
  <Tab title="Chính sách tin nhắn riêng">
    `channels.telegram.dmPolicy` kiểm soát quyền truy cập tin nhắn riêng:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một ID người gửi trong `allowFrom`)
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    `dmPolicy: "open"` cùng với `allowFrom: ["*"]` cho phép bất kỳ tài khoản Telegram nào tìm thấy hoặc đoán được tên người dùng của bot ra lệnh cho bot. Chỉ sử dụng cấu hình này cho các bot công khai có chủ đích với bộ công cụ bị hạn chế nghiêm ngặt; bot một chủ sở hữu nên dùng `allowlist` với ID người dùng dạng số.

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Các tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    Trong cấu hình nhiều tài khoản, `channels.telegram.allowFrom` hạn chế ở cấp cao nhất là một ranh giới an toàn: `allowFrom: ["*"]` ở cấp tài khoản không làm tài khoản đó trở thành công khai, trừ khi danh sách cho phép hiệu lực sau khi hợp nhất vẫn chứa ký tự đại diện rõ ràng.
    `dmPolicy: "allowlist"` với `allowFrom` trống sẽ chặn mọi tin nhắn riêng và bị quy trình xác thực cấu hình từ chối.
    Quá trình thiết lập chỉ yêu cầu ID người dùng dạng số. Nếu cấu hình có các mục danh sách cho phép `@username` từ quy trình thiết lập cũ, hãy chạy `openclaw doctor --fix` để phân giải chúng thành ID dạng số (nỗ lực tối đa; yêu cầu token bot Telegram).
    Nếu trước đây bạn phụ thuộc vào các tệp danh sách cho phép của kho ghép cặp, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` cho các luồng danh sách cho phép (ví dụ khi `dmPolicy: "allowlist"` chưa có ID rõ ràng).

    Với bot một chủ sở hữu, nên dùng `dmPolicy: "allowlist"` với các ID `allowFrom` dạng số rõ ràng thay vì phụ thuộc vào các phê duyệt ghép cặp trước đó.

    Nhầm lẫn thường gặp: việc phê duyệt ghép cặp tin nhắn riêng không có nghĩa là "người gửi này được ủy quyền ở mọi nơi". Ghép cặp chỉ cấp quyền truy cập tin nhắn riêng. Nếu chưa có chủ sở hữu lệnh, lần ghép cặp được phê duyệt đầu tiên cũng thiết lập `commands.ownerAllowFrom`, qua đó chỉ định một tài khoản vận hành rõ ràng cho các lệnh chỉ dành cho chủ sở hữu và các phê duyệt thực thi. Việc ủy quyền người gửi trong nhóm vẫn đến từ các danh sách cho phép rõ ràng trong cấu hình.
    Để một danh tính được ủy quyền cho cả tin nhắn riêng và lệnh nhóm: hãy đặt ID người dùng Telegram dạng số của bạn vào `channels.telegram.allowFrom`, và đối với các lệnh chỉ dành cho chủ sở hữu, hãy bảo đảm `commands.ownerAllowFrom` chứa `telegram:<your user id>`.

    ### Tìm ID người dùng Telegram của bạn

    An toàn hơn (không dùng bot bên thứ ba): gửi tin nhắn riêng cho bot của bạn, chạy `openclaw logs --follow`, đọc `from.id`.

    Phương thức Bot API chính thức:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Bên thứ ba (kém riêng tư hơn): `@userinfobot` hoặc `@getidsbot`.

  </Tab>

  <Tab title="Chính sách nhóm và danh sách cho phép">
    Hai cơ chế kiểm soát được áp dụng cùng nhau:

    1. **Những nhóm nào được phép** (`channels.telegram.groups`)
       - không có cấu hình `groups`, `groupPolicy: "open"`: mọi nhóm đều vượt qua bước kiểm tra ID nhóm
       - không có cấu hình `groups`, `groupPolicy: "allowlist"` (mặc định): mọi nhóm đều bị chặn cho đến khi bạn thêm các mục `groups` (hoặc `"*"`)
       - `groups` đã được cấu hình: hoạt động như một danh sách cho phép (ID rõ ràng hoặc `"*"`)

    2. **Những người gửi nào được phép trong nhóm** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (mặc định) / `disabled`

    `groupAllowFrom` lọc người gửi trong nhóm; nếu chưa đặt, Telegram sẽ dùng dự phòng `allowFrom` (không phải kho ghép cặp — việc ủy quyền người gửi trong nhóm không bao giờ kế thừa các phê duyệt từ kho ghép cặp tin nhắn riêng, đây là ranh giới bảo mật kể từ `2026.2.25`).
    Các mục `groupAllowFrom` phải là ID người dùng Telegram dạng số (các tiền tố `telegram:` / `tg:` được chuẩn hóa); các mục không phải dạng số sẽ bị bỏ qua. Không đặt ID cuộc trò chuyện nhóm hoặc siêu nhóm ở đây — ID cuộc trò chuyện âm phải nằm trong `channels.telegram.groups`.
    Mẫu cấu hình thực tế cho bot một chủ sở hữu: đặt ID người dùng của bạn trong `channels.telegram.allowFrom`, không đặt `groupAllowFrom`, rồi cho phép các nhóm đích trong `channels.telegram.groups`.
    Nếu `channels.telegram` hoàn toàn không có trong cấu hình, môi trường chạy mặc định đóng khi có lỗi với `groupPolicy="allowlist"`, trừ khi `channels.defaults.groupPolicy` được đặt rõ ràng.

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

    Kiểm thử từ nhóm bằng `@<bot_username> ping`. Các tin nhắn nhóm thông thường không kích hoạt bot khi `requireMention: true`.

    Cho phép mọi thành viên trong một nhóm cụ thể:

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

    Chỉ cho phép những người dùng cụ thể trong một nhóm cụ thể:

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
      Lỗi thường gặp: `groupAllowFrom` không phải là danh sách cho phép nhóm.

      - ID cuộc trò chuyện nhóm/siêu nhóm Telegram dạng số âm (`-1001234567890`) nằm trong `channels.telegram.groups`.
      - ID người dùng Telegram (`8734062810`) nằm trong `groupAllowFrom` để giới hạn những người trong một nhóm được phép có thể kích hoạt bot.
      - Chỉ sử dụng `groupAllowFrom: ["*"]` để cho phép mọi thành viên của một nhóm được phép trò chuyện với bot.

    </Warning>

  </Tab>

  <Tab title="Hành vi đề cập">
    Theo mặc định, phản hồi trong nhóm yêu cầu đề cập. Một lượt đề cập có thể đến từ:

    - một lượt đề cập `@botusername` gốc, hoặc
    - một mẫu đề cập trong `agents.list[].groupChat.mentionPatterns` hoặc `messages.groupChat.mentionPatterns`

    Các nút chuyển đổi ở cấp phiên (chỉ là trạng thái, không được lưu bền vững): `/activation always`, `/activation mention`. Dùng cấu hình để lưu bền vững:

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

    Ngữ cảnh lịch sử nhóm luôn được bật và bị giới hạn bởi `historyLimit`. Đặt `channels.telegram.historyLimit: 0` để tắt cửa sổ lịch sử nhóm. `openclaw doctor --fix` loại bỏ khóa `includeGroupHistoryContext` đã ngừng sử dụng.

    Lấy ID cuộc trò chuyện nhóm: chuyển tiếp một tin nhắn nhóm đến `@userinfobot` / `@getidsbot`, đọc `chat.id` từ `openclaw logs --follow`, kiểm tra `getUpdates` của Bot API, hoặc (sau khi nhóm được cho phép) chạy `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Hành vi môi trường chạy

- Telegram chạy bên trong tiến trình Gateway.
- Việc định tuyến mang tính xác định: phản hồi cho tin nhắn đến từ Telegram sẽ được gửi lại Telegram (mô hình không chọn kênh).
- Tin nhắn đến được chuẩn hóa thành phong bì kênh dùng chung, bao gồm siêu dữ liệu phản hồi, phần giữ chỗ cho nội dung đa phương tiện và ngữ cảnh chuỗi phản hồi được lưu bền vững cho các phản hồi mà Gateway đã quan sát.
- Các phiên nhóm được cô lập theo ID nhóm. Chủ đề diễn đàn nối thêm `:topic:<threadId>`.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw giữ nguyên giá trị này cho các phản hồi. Phiên chủ đề DM chỉ được tách khi Telegram `getMe` báo cáo `has_topics_enabled: true` cho bot; nếu không, DM vẫn dùng phiên phẳng.
- Long polling sử dụng trình chạy grammY với trình tự theo từng cuộc trò chuyện/từng luồng. Mức đồng thời của sink trình chạy sử dụng `agents.defaults.maxConcurrent`.
- Quá trình khởi động nhiều tài khoản giới hạn số lượt thăm dò `getMe` đồng thời để các đội bot lớn không thực hiện thăm dò mọi tài khoản cùng lúc.
- Mỗi tiến trình Gateway bảo vệ long polling để mỗi lần chỉ có một poller đang hoạt động được dùng một token bot. Xung đột 409 `getUpdates` kéo dài cho thấy một Gateway OpenClaw, tập lệnh hoặc poller bên ngoài khác đang dùng cùng token.
- Bộ giám sát polling khởi động lại sau 120 giây nếu không hoàn tất kiểm tra khả dụng `getUpdates`.
- Telegram Bot API không hỗ trợ xác nhận đã đọc (`sendReadReceipts` không áp dụng).

<Note>
  `channels.telegram.dm.threadReplies` và `channels.telegram.direct.<chatId>.threadReplies` đã bị loại bỏ. Chạy `openclaw doctor --fix` sau khi nâng cấp nếu cấu hình vẫn còn các khóa đó. Việc định tuyến chủ đề DM hiện tuân theo Telegram `getMe.has_topics_enabled` (do chế độ luồng của BotFather kiểm soát): bot đã bật chủ đề sử dụng phiên DM theo phạm vi luồng khi Telegram gửi `message_thread_id`; các DM khác vẫn dùng phiên phẳng.
</Note>

## Tham chiếu tính năng

<AccordionGroup>
  <Accordion title="Bản xem trước luồng trực tiếp (chỉnh sửa tin nhắn)">
    OpenClaw truyền trực tiếp từng phần phản hồi theo thời gian thực trong cuộc trò chuyện trực tiếp, nhóm và chủ đề: gửi một tin nhắn xem trước, sau đó lặp lại `editMessageText`, rồi hoàn tất ngay tại chỗ.

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - các bản xem trước ngắn của câu trả lời ban đầu được chống dội, sau đó được hiện thực hóa sau một khoảng trễ có giới hạn nếu lượt chạy vẫn đang hoạt động
    - `progress` duy trì một bản nháp trạng thái có thể chỉnh sửa cho tiến trình công cụ, hiển thị nhãn trạng thái ổn định khi hoạt động trả lời xuất hiện trước tiến trình công cụ, xóa bản nháp khi hoàn tất và gửi câu trả lời cuối cùng dưới dạng tin nhắn thông thường
    - `streaming.preview.toolProgress` kiểm soát việc các cập nhật công cụ/tiến trình có tái sử dụng cùng tin nhắn xem trước đã chỉnh sửa hay không (mặc định: `true` khi truyền phát bản xem trước đang hoạt động)
    - `streaming.preview.commandText` kiểm soát mức chi tiết lệnh/thực thi trong các dòng đó: `raw` (mặc định) hoặc `status` (chỉ nhãn công cụ)
    - `streaming.progress.commentary` (mặc định: `false`) cho phép đưa văn bản bình luận/lời mở đầu của trợ lý vào bản nháp tiến trình tạm thời
    - `channels.telegram.streamMode` cũ, các giá trị boolean `streaming` và các khóa xem trước bản nháp gốc đã ngừng sử dụng sẽ được phát hiện; chạy `openclaw doctor --fix` để di chuyển chúng

    Các dòng tiến trình công cụ là những cập nhật trạng thái ngắn được hiển thị trong khi công cụ chạy (thực thi lệnh, đọc tệp, cập nhật kế hoạch, tóm tắt bản vá, lời mở đầu/bình luận của Codex trong chế độ máy chủ ứng dụng). Telegram bật các dòng này theo mặc định (khớp với hành vi đã phát hành từ `v2026.4.22`+).

    Giữ các chỉnh sửa bản xem trước câu trả lời nhưng ẩn các dòng tiến trình công cụ:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Giữ hiển thị tiến trình công cụ nhưng ẩn văn bản lệnh/thực thi:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    Chế độ `progress` hiển thị tiến trình công cụ mà không chỉnh sửa câu trả lời cuối cùng vào tin nhắn đó. Đặt chính sách văn bản lệnh dưới `streaming.progress`:

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

    `streaming.mode: "off"` vô hiệu hóa các chỉnh sửa bản xem trước và loại bỏ nội dung trò chuyện chung về công cụ/tiến trình thay vì gửi dưới dạng tin nhắn trạng thái độc lập; lời nhắc phê duyệt, nội dung đa phương tiện và lỗi vẫn được định tuyến qua cơ chế gửi cuối cùng thông thường. `streaming.preview.toolProgress: false` chỉ giữ lại các chỉnh sửa bản xem trước câu trả lời.

    <Note>
      Phản hồi trích dẫn đã chọn là ngoại lệ. Khi `replyToMode` là `first`, `all` hoặc `batched` và tin nhắn đến có văn bản trích dẫn đã chọn, OpenClaw gửi câu trả lời cuối cùng qua đường dẫn phản hồi trích dẫn gốc của Telegram thay vì chỉnh sửa bản xem trước câu trả lời, vì vậy `streaming.preview.toolProgress` không thể hiển thị các dòng trạng thái trong lượt đó. Phản hồi cho tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn được truyền trực tiếp. Đặt `replyToMode: "off"` khi khả năng hiển thị tiến trình công cụ quan trọng hơn phản hồi trích dẫn gốc, hoặc `streaming.preview.toolProgress: false` để chấp nhận sự đánh đổi đó.
    </Note>

    Với phản hồi chỉ có văn bản: bản xem trước ngắn được chỉnh sửa thành nội dung cuối cùng ngay tại chỗ; nội dung cuối dài được chia thành nhiều tin nhắn sẽ tái sử dụng bản xem trước làm đoạn đầu tiên, rồi chỉ gửi phần còn lại; nội dung cuối ở chế độ tiến trình sẽ xóa bản nháp trạng thái và dùng cơ chế gửi cuối cùng thông thường; nếu lần chỉnh sửa cuối thất bại trước khi xác nhận hoàn tất, OpenClaw chuyển sang cơ chế gửi cuối cùng thông thường và dọn dẹp bản xem trước cũ. Với phản hồi phức tạp (tải trọng đa phương tiện), OpenClaw luôn chuyển sang cơ chế gửi cuối cùng thông thường và dọn dẹp bản xem trước.

    Truyền phát bản xem trước và truyền phát theo khối loại trừ lẫn nhau — khi truyền phát theo khối được bật rõ ràng, OpenClaw bỏ qua luồng bản xem trước để tránh truyền phát kép.

    Lập luận: `/reasoning stream` truyền trực tiếp nội dung lập luận vào bản xem trước trong khi tạo, sau đó xóa bản xem trước lập luận sau khi gửi nội dung cuối cùng (dùng `/reasoning on` để giữ nội dung này hiển thị). Câu trả lời cuối cùng được gửi mà không có văn bản lập luận.

  </Accordion>

  <Accordion title="Định dạng tin nhắn phong phú">
    Theo mặc định, văn bản gửi đi sử dụng tin nhắn HTML tiêu chuẩn của Telegram, có thể đọc được trên các ứng dụng khách hiện tại: chữ đậm, chữ nghiêng, liên kết, mã, nội dung ẩn, trích dẫn — không phải các khối chỉ dành cho nội dung phong phú của Bot API 10.2 (bảng gốc, chi tiết, đa phương tiện phong phú, công thức).

    Bật sử dụng tin nhắn phong phú của Bot API 10.2:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Khi được bật: tác nhân được thông báo rằng tin nhắn phong phú khả dụng cho bot/tài khoản này (cùng hợp đồng biên soạn Markdown + đảo HTML được hỗ trợ); văn bản Markdown được kết xuất qua IR Markdown của OpenClaw thành các khối phong phú có kiểu của Bot API 10.2 (tiêu đề, bảng, chi tiết, danh sách kiểm, đa phương tiện phong phú, công thức, bản đồ, ảnh ghép); chú thích đa phương tiện vẫn sử dụng chú thích HTML của Telegram (tin nhắn phong phú không thay thế chú thích và chú thích bị giới hạn ở 1024 ký tự).

    Điều này giúp văn bản của mô hình tránh các ký hiệu Markdown phong phú của Telegram, nên tiền tệ như `$400-600K` không bị phân tích thành biểu thức toán học. Văn bản phong phú dài được tự động chia theo giới hạn của Telegram. Bảng vượt quá giới hạn 20 cột sẽ chuyển sang khối mã.

    Mặc định: tắt để đảm bảo khả năng tương thích với ứng dụng khách — một số ứng dụng khách Desktop, Web, Android và bên thứ ba hiện tại hiển thị các tin nhắn phong phú đã được chấp nhận dưới dạng không được hỗ trợ. Giữ tùy chọn này ở trạng thái tắt trừ khi mọi ứng dụng khách dùng với bot đều có thể kết xuất chúng. `/status` cho biết phiên hiện tại đang bật hay tắt tin nhắn phong phú.

    Bản xem trước liên kết được bật theo mặc định. `channels.telegram.linkPreview: false` vô hiệu hóa tính năng tự động phát hiện thực thể cho văn bản phong phú.

  </Accordion>

  <Accordion title="Lệnh gốc và lệnh tùy chỉnh">
    Menu lệnh của Telegram được đăng ký khi khởi động bằng `setMyCommands`. `commands.native: "auto"` bật các lệnh gốc cho Telegram.

    Thêm các mục menu lệnh tùy chỉnh:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Sao lưu Git" },
        { command: "generate", description: "Tạo hình ảnh" },
      ],
    },
  },
}
```

    Quy tắc: tên được chuẩn hóa (loại bỏ `/` ở đầu, chuyển thành chữ thường); mẫu hợp lệ `a-z`, `0-9`, `_`, độ dài 1-32; lệnh tùy chỉnh không thể ghi đè lệnh gốc; các mục xung đột/trùng lặp bị bỏ qua và ghi nhật ký.

    Lệnh tùy chỉnh chỉ là các mục menu — chúng không tự động triển khai hành vi. Lệnh Plugin/skill vẫn có thể hoạt động khi được nhập ngay cả khi không hiển thị trong menu Telegram. Nếu lệnh gốc bị vô hiệu hóa, các lệnh tích hợp sẵn sẽ bị xóa; lệnh tùy chỉnh/Plugin vẫn có thể được đăng ký nếu đã cấu hình.

    Các lỗi thiết lập thường gặp:

    - `setMyCommands failed` cùng `BOT_COMMANDS_TOO_MUCH` sau khi thử cắt gọn lại có nghĩa là menu vẫn vượt giới hạn; giảm số lệnh Plugin/skill/tùy chỉnh hoặc vô hiệu hóa `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands` hoặc `setMyCommands` thất bại với `404: Not Found` trong khi các lệnh curl Bot API trực tiếp hoạt động thường có nghĩa là `channels.telegram.apiRoot` đã được đặt thành endpoint `/bot<TOKEN>` đầy đủ. `apiRoot` chỉ được là gốc Bot API; `openclaw doctor --fix` loại bỏ `/bot<TOKEN>` vô tình nằm ở cuối.
    - `getMe returned 401` có nghĩa là Telegram từ chối token bot đã cấu hình. Cập nhật `botToken`, `tokenFile` hoặc `TELEGRAM_BOT_TOKEN` (tài khoản mặc định) bằng token BotFather hiện tại; OpenClaw dừng trước khi polling nên lỗi này không được báo cáo nhầm là lỗi dọn dẹp Webhook.
    - `setMyCommands failed` cùng lỗi mạng/fetch thường có nghĩa là DNS/HTTPS gửi đi tới `api.telegram.org` bị chặn.

    ### Lệnh ghép đôi thiết bị (Plugin `device-pair`)

    Khi được cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ xử lý (bao gồm vai trò/phạm vi)
    4. phê duyệt: `/pair approve <requestId>`, `/pair approve` (yêu cầu đang chờ xử lý duy nhất) hoặc `/pair approve latest`

    Nếu một thiết bị thử lại với thông tin xác thực đã thay đổi (vai trò, phạm vi, khóa công khai), yêu cầu đang chờ xử lý trước đó sẽ bị thay thế bằng một `requestId` mới; chạy lại `/pair pending` trước khi phê duyệt.

    Chi tiết thêm: [Ghép đôi](/vi/channels/pairing#pair-via-telegram).

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

    Phạm vi: `off`, `dm`, `group`, `all`, `allowlist` (mặc định). `capabilities: ["inlineButtons"]` cũ ánh xạ tới `"all"`.

    Ví dụ về hành động tin nhắn:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Chọn một tùy chọn:",
  buttons: [
    [
      { text: "Có", callback_data: "yes" },
      { text: "Không", callback_data: "no" },
    ],
    [{ text: "Hủy", callback_data: "cancel" }],
  ],
}
```

    Ví dụ về nút Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Mở ứng dụng:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Khởi chạy", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Các nút `web_app` chỉ hoạt động trong cuộc trò chuyện riêng tư giữa người dùng và bot.

    Các lượt nhấp callback không được trình xử lý tương tác của Plugin đã đăng ký nhận xử lý sẽ được chuyển cho tác nhân dưới dạng văn bản: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Hành động tin nhắn Telegram dành cho tác nhân và tự động hóa">
    Hành động:

    - `sendMessage` (`to`, `content`, `mediaUrl` tùy chọn, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` hoặc `caption`, các nút nội tuyến `presentation` tùy chọn; các chỉnh sửa chỉ dành cho nút sẽ cập nhật mã đánh dấu trả lời)
    - `createForumTopic` (`chatId`, `name`, `iconColor` tùy chọn, `iconCustomEmojiId`)

    Các bí danh tiện dụng: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Kiểm soát bật/tắt: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (mặc định: tắt). `edit`, `createForumTopic` và `editForumTopic` được bật theo mặc định mà không có công tắc chuyên dụng.
    Các lượt gửi trong thời gian chạy sử dụng ảnh chụp nhanh cấu hình/bí mật đang hoạt động từ lúc khởi động/tải lại, vì vậy các đường dẫn hành động không phân giải lại các giá trị `SecretRef` cho mỗi lượt gửi.

    Ngữ nghĩa xóa phản ứng: [/tools/reactions](/vi/tools/reactions).

  </Accordion>

  <Accordion title="Thẻ phân luồng trả lời">
    Các thẻ phân luồng trả lời tường minh trong đầu ra được tạo:

    - `[[reply_to_current]]` — trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` — trả lời một ID tin nhắn cụ thể

    `channels.telegram.replyToMode`: `off` (mặc định), `first`, `all`.

    Khi phân luồng trả lời được bật và có sẵn văn bản/chú thích gốc, OpenClaw tự động thêm một đoạn trích dẫn gốc. Telegram giới hạn văn bản trích dẫn gốc ở 1024 đơn vị mã UTF-16; các tin nhắn dài hơn được trích dẫn từ đầu và chuyển về trả lời thuần túy nếu Telegram từ chối trích dẫn.

    `off` chỉ tắt phân luồng trả lời ngầm định; các thẻ `[[reply_to_*]]` tường minh vẫn được tuân theo.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi luồng">
    Siêu nhóm diễn đàn: khóa phiên chủ đề nối thêm `:topic:<threadId>`; câu trả lời và trạng thái đang nhập nhắm đến luồng chủ đề; đường dẫn cấu hình chủ đề là `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Chủ đề chung (`threadId=1`) là một trường hợp đặc biệt: khi gửi tin nhắn sẽ bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)` với thông báo "không tìm thấy luồng"), nhưng các hành động đang nhập vẫn bao gồm `message_thread_id` (theo thực nghiệm là bắt buộc để chỉ báo đang nhập xuất hiện).

    Các mục chủ đề kế thừa cài đặt nhóm trừ khi bị ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` chỉ dành cho chủ đề và không kế thừa từ giá trị mặc định của nhóm. `topics."*"` đặt giá trị mặc định cho mọi chủ đề trong nhóm đó; ID chủ đề chính xác vẫn được ưu tiên hơn `"*"`.

    **Định tuyến tác nhân theo từng chủ đề**: mỗi chủ đề có thể định tuyến đến một tác nhân khác nhau thông qua `agentId` trong cấu hình chủ đề, cung cấp cho chủ đề không gian làm việc, bộ nhớ và phiên riêng:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Chủ đề chung -> tác nhân chính
                "3": { agentId: "zu" },        // Chủ đề phát triển -> tác nhân zu
                "5": { agentId: "coder" }      // Review mã -> tác nhân coder
              }
            }
          }
        }
      }
    }
    ```

    Sau đó, mỗi chủ đề có khóa phiên riêng, ví dụ `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Liên kết chủ đề ACP bền vững**: các chủ đề diễn đàn có thể ghim phiên bộ khung ACP thông qua các liên kết được định kiểu cấp cao nhất (`bindings[]` với `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` và một ID định danh theo chủ đề như `-1001234567890:topic:42`). Hiện chỉ áp dụng cho các chủ đề diễn đàn trong nhóm/siêu nhóm. Xem [Tác nhân ACP](/vi/tools/acp-agents).

    **Khởi tạo ACP gắn với luồng từ cuộc trò chuyện**: `/acp spawn <agent> --thread here|auto` liên kết chủ đề hiện tại với một phiên ACP mới; các lượt tiếp theo được định tuyến trực tiếp đến đó và OpenClaw ghim xác nhận khởi tạo trong chủ đề. Yêu cầu `channels.telegram.threadBindings.spawnSessions` (mặc định: `true`).

    Ngữ cảnh mẫu cung cấp `MessageThreadId` và `IsForum`. Các cuộc trò chuyện tin nhắn trực tiếp có `message_thread_id` giữ lại siêu dữ liệu trả lời nhưng chỉ sử dụng khóa phiên nhận biết luồng khi `getMe` của Telegram báo cáo `has_topics_enabled: true`.
    Các ghi đè `dm.threadReplies` và `direct.*.threadReplies` đã ngừng sử dụng nay đã bị loại bỏ; chế độ phân luồng của BotFather là nguồn thông tin đáng tin cậy duy nhất. Chạy `openclaw doctor --fix` để xóa các khóa cấu hình lỗi thời.

  </Accordion>

  <Accordion title="Âm thanh, video và nhãn dán">
    ### Tin nhắn âm thanh

    Telegram phân biệt ghi chú thoại với tệp âm thanh. Mặc định: hành vi tệp âm thanh; gắn thẻ `[[audio_as_voice]]` trong câu trả lời của tác nhân để buộc gửi dưới dạng ghi chú thoại. Bản chép lời ghi chú thoại nhận vào được đóng khung trong ngữ cảnh tác nhân dưới dạng văn bản không đáng tin cậy do máy tạo, nhưng việc phát hiện lượt nhắc vẫn sử dụng bản chép lời thô để các tin nhắn thoại có điều kiện lượt nhắc tiếp tục hoạt động.

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

    Telegram phân biệt tệp video với ghi chú video. Ghi chú video không hỗ trợ chú thích; văn bản tin nhắn được cung cấp sẽ được gửi riêng.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Vị trí và địa điểm

    Sử dụng hành động `send` hiện có với một đối tượng `location` độc lập. Tọa độ sẽ gửi một ghim gốc; thêm cả `name` và `address` sẽ gửi một thẻ địa điểm gốc. Không thể kết hợp lượt gửi vị trí với văn bản tin nhắn hoặc phương tiện.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Tháp Eiffel",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Nhãn dán

    Nhận vào: WEBP tĩnh được tải xuống và xử lý (phần giữ chỗ `<media:sticker>`); TGS động và WEBM video bị bỏ qua.

    Các trường ngữ cảnh nhãn dán: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Mô tả được lưu vào bộ nhớ đệm trong trạng thái Plugin SQLite của OpenClaw để giảm các lượt gọi thị giác lặp lại.

    Bật các hành động nhãn dán:

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

    Gửi:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Tìm kiếm nhãn dán đã lưu vào bộ nhớ đệm:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "mèo vẫy tay",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Phản ứng Telegram đến dưới dạng các bản cập nhật `message_reaction`, tách biệt với tải trọng tin nhắn. Khi được bật, OpenClaw đưa các sự kiện hệ thống như `Telegram reaction added: 👍 by Alice (@alice) on msg 42` vào hàng đợi.

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    `own` chỉ có nghĩa là phản ứng của người dùng đối với các tin nhắn do bot gửi (nỗ lực tối đa thông qua bộ nhớ đệm tin nhắn đã gửi). Các sự kiện phản ứng vẫn tuân thủ kiểm soát truy cập Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được phép sẽ bị loại bỏ.

    Telegram không cung cấp ID luồng trong các bản cập nhật phản ứng: nhóm không phải diễn đàn định tuyến đến phiên trò chuyện nhóm; nhóm diễn đàn định tuyến đến phiên chủ đề chung (`:topic:1`), không phải chủ đề gốc chính xác.

    `allowed_updates` dành cho polling/webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw xử lý tin nhắn nhận vào. `messages.ackReactionScope` quyết định *thời điểm* gửi.

    **Thứ tự phân giải emoji:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji danh tính tác nhân dự phòng (`agents.list[].identity.emoji`, nếu không thì "👀")

    Telegram yêu cầu một emoji unicode (ví dụ "👀"); sử dụng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

    **Phạm vi (`messages.ackReactionScope`, mặc định `"group-mentions"`; hiện không có ghi đè cấp tài khoản Telegram hoặc kênh Telegram):**

    `all` (tin nhắn trực tiếp + nhóm, bao gồm các sự kiện phòng nền), `direct` (chỉ tin nhắn trực tiếp), `group-all` (mọi tin nhắn nhóm ngoại trừ sự kiện phòng nền, không có tin nhắn trực tiếp), `group-mentions` (nhóm khi bot được nhắc đến; **không có tin nhắn trực tiếp** — mặc định), `off` / `none` (đã tắt).

    <Note>
    Phạm vi mặc định (`group-mentions`) không kích hoạt phản ứng xác nhận trong tin nhắn trực tiếp hoặc sự kiện phòng nền. Sử dụng `direct` hoặc `all` cho tin nhắn trực tiếp; chỉ `all` xác nhận các sự kiện phòng nền. Giá trị này được đọc khi nhà cung cấp Telegram khởi động, vì vậy cần khởi động lại Gateway để thay đổi có hiệu lực.
    </Note>

  </Accordion>

  <Accordion title="Ghi cấu hình từ sự kiện và lệnh Telegram">
    Tính năng ghi cấu hình kênh được bật theo mặc định (`configWrites !== false`). Các lượt ghi do Telegram kích hoạt bao gồm sự kiện di chuyển nhóm (`migrate_to_chat_id`, cập nhật `channels.telegram.groups`) và `/config set` / `/config unset` (yêu cầu bật lệnh).

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
    Mặc định là long polling. Đối với chế độ webhook, đặt `channels.telegram.webhookUrl` và `channels.telegram.webhookSecret`; `webhookPath` tùy chọn (mặc định `/telegram-webhook`), `webhookHost` (mặc định `127.0.0.1`), `webhookPort` (mặc định `8787`), `webhookCertPath` (PEM chứng chỉ tự ký dành cho thiết lập IP trực tiếp hoặc không có miền).

    Trong chế độ long polling, OpenClaw chỉ duy trì mốc khởi động lại sau khi một bản cập nhật được điều phối thành công; trình xử lý thất bại khiến bản cập nhật đó có thể được thử lại trong cùng tiến trình thay vì đánh dấu là đã hoàn tất.

    Trình lắng nghe cục bộ liên kết với `127.0.0.1:8787` theo mặc định. Đối với lưu lượng truy cập công khai, hãy đặt một proxy ngược phía trước cổng cục bộ hoặc chủ đích đặt `webhookHost: "0.0.0.0"`.

    Chế độ webhook xác thực các biện pháp bảo vệ yêu cầu, token bí mật Telegram và nội dung JSON, sau đó ghi nhận bản cập nhật vào hàng đợi tiếp nhận bền vững trước khi trả về một `200` trống. Việc tiếp nhận bền vững thành công bao gồm `x-openclaw-delivery-accepted: durable`; các phản hồi về tình trạng, định tuyến, xác thực, kiểm tra hợp lệ và lỗi lưu trữ sẽ bỏ qua tiêu đề này. Proxy ngược và bộ điều khiển máy chủ có thể yêu cầu tiêu đề này để phân biệt việc OpenClaw tiếp nhận với một `200` trống thông thường mà không phải suy luận sự chấp nhận từ thời gian phản hồi.

    Sau lượt ghi bền vững, OpenClaw nhận và xử lý các bản cập nhật thông qua cơ chế xả tiếp nhận kênh lõi (các làn theo từng cuộc trò chuyện/từng chủ đề, hoàn tất khi lượt được tiếp nhận, thời gian chờ đình trệ trước tiếp nhận). Các lượt tác nhân chậm không giữ ACK phân phối của Telegram.

  </Accordion>

  <Accordion title="Giới hạn và đích CLI">
    - `channels.telegram.textChunkLimit` mặc định là 4000; `streaming.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi chia theo độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước phương tiện đầu vào và đầu ra.
    - lịch sử ngữ cảnh nhóm sử dụng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` sẽ tắt tính năng này.
    - ngữ cảnh bổ sung từ trả lời/trích dẫn/chuyển tiếp được chuẩn hóa thành một cửa sổ ngữ cảnh hội thoại đã chọn khi Gateway đã quan sát các tin nhắn gốc; bộ nhớ đệm tin nhắn đã quan sát nằm trong trạng thái Plugin SQLite của OpenClaw và `openclaw doctor --fix` nhập các tệp phụ cũ. Telegram chỉ bao gồm một `reply_to_message` nông trong mỗi bản cập nhật, vì vậy các chuỗi cũ hơn bộ nhớ đệm bị giới hạn ở tải trọng đó.
    - danh sách cho phép của Telegram chủ yếu kiểm soát ai có thể kích hoạt tác nhân, chứ không phải là ranh giới biên tập đầy đủ cho ngữ cảnh bổ sung.
    - lịch sử DM: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.

    Đích gửi của CLI và công cụ nhắn tin chấp nhận ID cuộc trò chuyện dạng số, tên người dùng hoặc đích chủ đề diễn đàn:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Cuộc thăm dò sử dụng `openclaw message poll` và hỗ trợ chủ đề diễn đàn:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Các cờ thăm dò chỉ dành cho Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (hoặc một đích `:topic:`). `--poll-option` lặp lại 2-12 lần (giới hạn tùy chọn của Telegram).

    Tính năng gửi của Telegram cũng hỗ trợ `--presentation` với các khối `buttons` cho bàn phím nội tuyến (khi `channels.telegram.capabilities.inlineButtons` cho phép), `--pin` hoặc `--delivery '{"pin":true}'` để yêu cầu ghim nội dung gửi khi bot có thể ghim trong cuộc trò chuyện đó, và `--force-document` để gửi hình ảnh, GIF và video đầu ra dưới dạng tài liệu thay vì tải lên dưới dạng nén/ảnh động/video.

    Kiểm soát hành động: `channels.telegram.actions.sendMessage=false` tắt mọi tin nhắn đầu ra, bao gồm cả cuộc thăm dò; `channels.telegram.actions.poll=false` tắt việc tạo cuộc thăm dò nhưng vẫn bật tính năng gửi thông thường.

  </Accordion>

  <Accordion title="Phê duyệt thực thi trong Telegram">
    Telegram hỗ trợ phê duyệt thực thi trong DM của người phê duyệt và có thể tùy chọn đăng lời nhắc trong cuộc trò chuyện hoặc chủ đề khởi nguồn. Người phê duyệt phải là ID người dùng Telegram dạng số.

    - `channels.telegram.execApprovals.enabled` (`"auto"` bật khi có thể phân giải ít nhất một người phê duyệt)
    - `channels.telegram.execApprovals.approvers` (dự phòng về các ID chủ sở hữu dạng số từ `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (mặc định) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` và `defaultTo` kiểm soát ai có thể giao tiếp với bot và nơi bot gửi câu trả lời thông thường — chúng không biến một người thành người phê duyệt thực thi. Lần ghép đôi DM được phê duyệt đầu tiên sẽ khởi tạo `commands.ownerAllowFrom` khi chưa có chủ sở hữu lệnh, nhờ đó thiết lập một chủ sở hữu hoạt động mà không cần sao chép ID trong `execApprovals.approvers`.

    Nội dung gửi tới kênh hiển thị văn bản lệnh trong cuộc trò chuyện; chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi lời nhắc xuất hiện trong một chủ đề diễn đàn, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và nội dung tiếp theo. Theo mặc định, phê duyệt thực thi hết hạn sau 30 phút.

    Các nút phê duyệt nội tuyến cũng yêu cầu `channels.telegram.capabilities.inlineButtons` cho phép bề mặt đích (`dm`, `group` hoặc `all`). ID phê duyệt có tiền tố `plugin:` được phân giải thông qua phê duyệt Plugin; các ID khác được phân giải thông qua phê duyệt thực thi trước.

    Xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kiểm soát phản hồi lỗi

Khi tác nhân gặp lỗi gửi hoặc lỗi nhà cung cấp, chính sách lỗi kiểm soát việc thông báo lỗi có được gửi đến cuộc trò chuyện Telegram hay không:

| Khóa                             | Giá trị                     | Mặc định  | Mô tả                                                                                                                                                                |
| ------------------------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy` | `always`, `once`, `silent` | `always` | `always` gửi mọi thông báo lỗi đến cuộc trò chuyện. `once` gửi mỗi thông báo lỗi riêng biệt một lần trong mỗi khoảng chờ tích hợp sẵn. `silent` không bao giờ gửi thông báo lỗi đến cuộc trò chuyện. |

Hỗ trợ ghi đè theo tài khoản, theo nhóm và theo chủ đề (cùng cơ chế kế thừa như các khóa cấu hình Telegram khác).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // ẩn lỗi trong nhóm này
        },
      },
    },
  },
}
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bot không phản hồi tin nhắn nhóm không đề cập">

    - Nếu `requireMention=false`, chế độ riêng tư của Telegram phải cho phép khả năng hiển thị đầy đủ: BotFather `/setprivacy` -> Disable, sau đó xóa và thêm lại bot vào nhóm.
    - `openclaw channels status` cảnh báo khi cấu hình mong đợi tin nhắn nhóm không đề cập.
    - `openclaw channels status --probe` kiểm tra ID nhóm dạng số được chỉ định rõ; ký tự đại diện `"*"` không thể được thăm dò tư cách thành viên.
    - Kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot hoàn toàn không thấy tin nhắn nhóm">

    - Khi `channels.telegram.groups` tồn tại, nhóm phải được liệt kê (hoặc bao gồm `"*"`).
    - Xác minh bot là thành viên của nhóm.
    - Xem lại `openclaw logs --follow` để biết lý do bỏ qua.

  </Accordion>

  <Accordion title="Lệnh hoạt động một phần hoặc hoàn toàn không hoạt động">

    - Ủy quyền danh tính người gửi (ghép đôi và/hoặc `allowFrom` dạng số); việc ủy quyền lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`.
    - `setMyCommands failed` cùng `BOT_COMMANDS_TOO_MUCH` có nghĩa là menu gốc có quá nhiều mục; hãy giảm số lượng lệnh Plugin/skill/tùy chỉnh hoặc tắt menu gốc.
    - Các lệnh gọi khởi động `deleteMyCommands` / `setMyCommands` và lệnh gọi nhập liệu `sendChatAction` có giới hạn thời gian và thử lại một lần qua phương án dự phòng truyền tải của Telegram khi yêu cầu hết thời gian chờ. Lỗi mạng/tìm nạp kéo dài thường có nghĩa là không thể truy cập DNS/HTTPS tới `api.telegram.org`.

  </Accordion>

  <Accordion title="Khởi động báo cáo token không được ủy quyền">

    - `getMe returned 401` là lỗi xác thực Telegram đối với token bot đã cấu hình. Sao chép lại hoặc tạo lại token trong BotFather, sau đó cập nhật `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` hoặc `TELEGRAM_BOT_TOKEN` (tài khoản mặc định).
    - `deleteWebhook 401 Unauthorized` trong quá trình khởi động cũng là lỗi xác thực; coi đó là "không tồn tại webhook" chỉ trì hoãn cùng lỗi token không hợp lệ đến một lệnh gọi API sau đó.

  </Accordion>

  <Accordion title="Thăm dò hoặc mạng không ổn định">

    - Node 22+ với fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy ngay lập tức nếu các kiểu `AbortSignal` không khớp.
    - Một số máy chủ phân giải `api.telegram.org` sang IPv6 trước; kết nối đi IPv6 bị lỗi gây ra lỗi API gián đoạn.
    - Nhật ký có `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!` được thử lại dưới dạng lỗi mạng có thể khôi phục.
    - Trong quá trình khởi động thăm dò, OpenClaw tái sử dụng phép thăm dò `getMe` khởi động thành công cho grammY để trình chạy không cần thực hiện `getMe` lần thứ hai trước `getUpdates` đầu tiên.
    - Nếu `deleteWebhook` thất bại do lỗi mạng tạm thời trong quá trình khởi động thăm dò, OpenClaw tiếp tục chuyển sang thăm dò dài thay vì thực hiện một lệnh gọi mặt phẳng điều khiển khác trước khi thăm dò. Webhook vẫn còn hoạt động sau đó xuất hiện dưới dạng xung đột `getUpdates`; OpenClaw dựng lại lớp truyền tải và thử dọn dẹp webhook lần nữa.
    - `Polling stall detected` trong nhật ký có nghĩa là OpenClaw khởi động lại việc thăm dò và dựng lại lớp truyền tải sau 120 giây mà không hoàn tất kiểm tra khả năng hoạt động của thăm dò dài theo mặc định.
    - `openclaw channels status --probe` và `openclaw doctor` cảnh báo khi tài khoản thăm dò đang chạy chưa hoàn tất `getUpdates` sau thời gian gia hạn khởi động, tài khoản webhook đang chạy chưa hoàn tất `setWebhook` sau thời gian gia hạn khởi động hoặc hoạt động truyền tải thăm dò thành công gần nhất đã quá cũ.
    - Telegram tuân theo các biến môi trường proxy của tiến trình cho lớp truyền tải Bot API: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và các biến thể chữ thường. `NO_PROXY` / `no_proxy` vẫn có thể bỏ qua `api.telegram.org`.
    - Nếu `OPENCLAW_PROXY_URL` được đặt cho môi trường dịch vụ và không có biến môi trường proxy tiêu chuẩn, Telegram cũng sử dụng URL đó cho lớp truyền tải Bot API.
    - Trên các máy chủ VPS có kết nối đi trực tiếp/TLS không ổn định, hãy định tuyến các lệnh gọi API Telegram qua proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định sử dụng `autoSelectFamily=true` (ngoại trừ WSL2). Thứ tự kết quả DNS của Telegram tuân theo `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sau đó `channels.telegram.network.dnsResultOrder`, rồi đến giá trị mặc định của tiến trình (ví dụ `NODE_OPTIONS=--dns-result-order=ipv4first`), và dự phòng về `ipv4first` trên Node 22+ nếu không có giá trị nào áp dụng.
    - Trên WSL2 hoặc khi chế độ chỉ IPv4 hoạt động tốt hơn, hãy buộc lựa chọn họ địa chỉ:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Các kết quả thuộc dải đo kiểm RFC 2544 (`198.18.0.0/15`) đã được cho phép mặc định đối với việc tải xuống phương tiện Telegram. Nếu proxy fake-IP hoặc proxy trong suốt đáng tin cậy ghi lại `api.telegram.org` thành một địa chỉ riêng/nội bộ/dành cho mục đích đặc biệt khác trong quá trình tải xuống phương tiện, hãy chủ động bật chế độ bỏ qua chỉ dành cho Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Tùy chọn chủ động bật tương tự có sẵn theo từng tài khoản tại `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Nếu proxy phân giải máy chủ phương tiện Telegram thành `198.18.x.x`, trước tiên hãy để cờ nguy hiểm ở trạng thái tắt — dải đó đã được cho phép mặc định.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` làm suy yếu các biện pháp bảo vệ SSRF cho phương tiện Telegram. Chỉ sử dụng trong các môi trường proxy đáng tin cậy do người vận hành kiểm soát (định tuyến fake-IP của Clash, Mihomo, Surge), vốn tổng hợp các kết quả riêng tư hoặc dành cho mục đích đặc biệt nằm ngoài dải đo kiểm RFC 2544. Hãy để tùy chọn này tắt khi truy cập Telegram thông thường qua internet công cộng.
    </Warning>

    - Ghi đè môi trường tạm thời: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Xác thực kết quả DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Trợ giúp thêm: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Telegram](/vi/gateway/config-channels#telegram).

<Accordion title="Các trường Telegram quan trọng nhất">

- khởi động/xác thực: `enabled`, `botToken`, `tokenFile` (phải là tệp thông thường; liên kết tượng trưng bị từ chối), `accounts.*`
- kiểm soát truy cập: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` cấp cao nhất (`type: "acp"`)
- giá trị mặc định của chủ đề: `groups.<chatId>.topics."*"` áp dụng cho các chủ đề diễn đàn không khớp; ID chủ đề chính xác sẽ ghi đè giá trị này
- phê duyệt thực thi: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- luồng/phản hồi: `replyToMode`, `threadBindings`
- truyền trực tuyến: `streaming` (các chế độ `off | partial | block | progress`), `streaming.preview.toolProgress`
- định dạng/phân phối: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- phương tiện/mạng: `mediaMaxMb`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- gốc API tùy chỉnh: `apiRoot` (chỉ gốc Bot API; không bao gồm `/bot<TOKEN>`), `trustedLocalFileRoots` (các gốc `file_path` tuyệt đối của Bot API tự lưu trữ)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- hành động/khả năng: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- phản ứng: `reactionNotifications`, `reactionLevel`
- lỗi: `errorPolicy`, `silentErrorReplies`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Thứ tự ưu tiên khi dùng nhiều tài khoản: khi cấu hình hai ID tài khoản trở lên, hãy đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để chỉ định rõ định tuyến mặc định. Nếu không, OpenClaw sẽ dùng ID tài khoản đã chuẩn hóa đầu tiên và `openclaw doctor` sẽ đưa ra cảnh báo. Các tài khoản có tên kế thừa `channels.telegram.allowFrom` / `groupAllowFrom`, nhưng không kế thừa các giá trị `accounts.default.*`.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Telegram với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi của danh sách cho phép đối với nhóm và chủ đề.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến cho các tác nhân.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và tăng cường bảo mật.
  </Card>
  <Card title="Định tuyến đa tác nhân" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ nhóm và chủ đề tới các tác nhân.
  </Card>
  <Card title="Khắc phục sự cố" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán trên nhiều kênh.
  </Card>
</CardGroup>
