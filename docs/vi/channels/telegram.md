---
read_when:
    - Phát triển các tính năng hoặc webhook của Telegram
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-16T14:55:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Sẵn sàng cho môi trường production đối với tin nhắn riêng và nhóm của bot thông qua grammY. Long polling là phương thức truyền tải mặc định; chế độ webhook là tùy chọn.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách tin nhắn riêng mặc định cho Telegram là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Quy trình chẩn đoán và khắc phục trên nhiều kênh.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Tạo token bot trong BotFather">
    Cả hai quy trình đều cung cấp một token để bạn dán vào OpenClaw — hãy chọn một:

    - **Quy trình qua trò chuyện**: mở Telegram, trò chuyện với **@BotFather** (xác nhận tên tài khoản chính xác là `@BotFather`), chạy `/newbot`, làm theo lời nhắc và lưu token.
    - **Quy trình qua web**: mở [ứng dụng web của BotFather](https://t.me/BotFather?startapp) — ứng dụng này chạy trong mọi ứng dụng Telegram, bao gồm [web.telegram.org](https://web.telegram.org) — tạo bot trong giao diện và sao chép token của bot.

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

    Giá trị dự phòng từ môi trường: `TELEGRAM_BOT_TOKEN` (chỉ dành cho tài khoản mặc định; các tài khoản được đặt tên phải sử dụng `botToken` hoặc `tokenFile`).
    Telegram **không** sử dụng `openclaw channels login telegram`; hãy đặt token trong cấu hình/biến môi trường, sau đó khởi động Gateway.

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
    Thêm bot vào nhóm, sau đó lấy hai ID cần thiết để truy cập nhóm:

    - ID người dùng Telegram của bạn, cho `allowFrom` / `groupAllowFrom`
    - ID cuộc trò chuyện nhóm Telegram, làm khóa trong `channels.telegram.groups`

    Lấy ID cuộc trò chuyện nhóm từ `openclaw logs --follow`, một bot xác định ID từ tin nhắn chuyển tiếp hoặc `getUpdates` của Bot API. Sau khi nhóm được cho phép, `/whoami@<bot_username>` sẽ xác nhận ID người dùng và nhóm.

    Các ID siêu nhóm âm bắt đầu bằng `-100` là ID cuộc trò chuyện nhóm. Chúng phải nằm trong `channels.telegram.groups`, không phải `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Việc phân giải token có xét đến tài khoản: `tokenFile` được ưu tiên hơn `botToken`, rồi đến biến môi trường; cấu hình luôn được ưu tiên hơn `TELEGRAM_BOT_TOKEN` (chỉ được phân giải cho tài khoản mặc định). Sau khi khởi động thành công, OpenClaw lưu danh tính bot vào bộ nhớ đệm trong tối đa 24 giờ để các lần khởi động lại bỏ qua một lệnh gọi `getMe` bổ sung; việc thay đổi hoặc xóa token sẽ xóa bộ nhớ đệm đó.
</Note>

## Cài đặt phía Telegram

<AccordionGroup>
  <Accordion title="Chế độ riêng tư và khả năng hiển thị trong nhóm">
    Theo mặc định, bot Telegram sử dụng **Privacy Mode**, chế độ này giới hạn các tin nhắn nhóm mà bot nhận được.

    Để xem tất cả tin nhắn nhóm, hãy thực hiện một trong các cách sau:

    - tắt chế độ riêng tư qua `/setprivacy`, hoặc
    - đặt bot làm quản trị viên nhóm.

    Sau khi chuyển đổi chế độ riêng tư, hãy xóa rồi thêm lại bot vào từng nhóm để Telegram áp dụng thay đổi.

  </Accordion>

  <Accordion title="Quyền trong nhóm">
    Trạng thái quản trị viên được kiểm soát trong phần cài đặt nhóm Telegram. Bot quản trị viên nhận được tất cả tin nhắn nhóm, hữu ích cho hoạt động nhóm luôn bật.
  </Accordion>

  <Accordion title="Các tùy chọn BotFather hữu ích">

    - `/setjoingroups` — cho phép/từ chối thêm vào nhóm
    - `/setprivacy` — cách thức hiển thị trong nhóm

    Các cài đặt tương tự cũng có trong [ứng dụng web của BotFather](https://t.me/BotFather?startapp) nếu bạn thích dùng giao diện hơn các lệnh trò chuyện.

  </Accordion>
</AccordionGroup>

## Mini App bảng điều khiển

Chạy `/dashboard` trong tin nhắn riêng với bot để mở bảng điều khiển OpenClaw bên trong Telegram.

Yêu cầu:

- `gateway.tailscale.mode: "serve"` hoặc `"funnel"` cho URL Mini App HTTPS đã xuất bản.
- ID người dùng Telegram dạng số của bạn phải nằm trong `allowFrom` có hiệu lực của tài khoản đã chọn hoặc trong `commands.ownerAllowFrom`.
- Sử dụng tin nhắn riêng. Trong nhóm, `/dashboard` phản hồi bằng `open this in a DM with the bot` và không gửi nút nào.
- Bản cài đặt Docker: các chế độ Serve/Funnel yêu cầu Gateway liên kết với địa chỉ loopback bên cạnh `tailscaled`, điều mà mạng bridge với các cổng được công khai không thể đáp ứng. Chạy container Gateway với `network_mode: host` và gắn socket `tailscaled` của máy chủ (`/var/run/tailscale`) cùng CLI `tailscale` vào container.

Mini App là đường dẫn v1 chỉ dành cho Tailscale và không hỗ trợ iframe của Telegram Web.

## Kiểm soát quyền truy cập và kích hoạt

### Danh tính bot trong nhóm

Trong các nhóm và chủ đề diễn đàn, việc đề cập rõ ràng đến tên định danh bot đã cấu hình (ví dụ `@my_bot`) sẽ gọi tác tử OpenClaw đã chọn, ngay cả khi tên nhân dạng của tác tử khác với tên người dùng Telegram. Chính sách im lặng trong nhóm vẫn áp dụng cho lưu lượng không liên quan, nhưng tên định danh bot không bao giờ là "người khác".

<Tabs>
  <Tab title="Chính sách tin nhắn trực tiếp">
    `channels.telegram.dmPolicy` kiểm soát quyền truy cập tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một ID người gửi trong `allowFrom`)
    - `open` (yêu cầu `allowFrom` chứa `"*"`)
    - `disabled`

    `dmPolicy: "open"` cùng với `allowFrom: ["*"]` cho phép bất kỳ tài khoản Telegram nào tìm thấy hoặc đoán được tên người dùng của bot ra lệnh cho bot. Chỉ sử dụng cấu hình này cho các bot công khai có chủ đích với bộ công cụ bị hạn chế chặt chẽ; bot có một chủ sở hữu nên sử dụng `allowlist` với ID người dùng dạng số.

    `channels.telegram.allowFrom` chấp nhận ID người dùng Telegram dạng số. Các tiền tố `telegram:` / `tg:` được chấp nhận và chuẩn hóa.
    Trong cấu hình nhiều tài khoản, `channels.telegram.allowFrom` hạn chế ở cấp cao nhất là một ranh giới an toàn: `allowFrom: ["*"]` ở cấp tài khoản không làm cho tài khoản đó trở thành công khai, trừ khi danh sách cho phép hiệu dụng sau khi hợp nhất vẫn chứa ký tự đại diện rõ ràng.
    `dmPolicy: "allowlist"` với `allowFrom` trống sẽ chặn mọi tin nhắn trực tiếp và bị quy trình xác thực cấu hình từ chối.
    Quá trình thiết lập chỉ yêu cầu ID người dùng dạng số. Nếu cấu hình có các mục trong danh sách cho phép `@username` từ lần thiết lập cũ, hãy chạy `openclaw doctor --fix` để phân giải chúng thành ID dạng số (nỗ lực tối đa; yêu cầu token bot Telegram).
    Nếu trước đây bạn dựa vào các tệp danh sách cho phép của kho ghép cặp, `openclaw doctor --fix` có thể khôi phục các mục vào `channels.telegram.allowFrom` cho các luồng danh sách cho phép (ví dụ khi `dmPolicy: "allowlist"` chưa có ID rõ ràng nào).

    Đối với bot có một chủ sở hữu, nên dùng `dmPolicy: "allowlist"` với các ID `allowFrom` dạng số rõ ràng thay vì phụ thuộc vào các phê duyệt ghép cặp trước đó.

    Nhầm lẫn thường gặp: phê duyệt ghép cặp tin nhắn trực tiếp không có nghĩa là "người gửi này được cấp quyền ở mọi nơi". Việc ghép cặp chỉ cấp quyền truy cập tin nhắn trực tiếp. Nếu chưa có chủ sở hữu lệnh, lần ghép cặp được phê duyệt đầu tiên cũng đặt `commands.ownerAllowFrom`, qua đó chỉ định một tài khoản vận hành rõ ràng cho các lệnh chỉ dành cho chủ sở hữu và phê duyệt thực thi. Quyền của người gửi trong nhóm vẫn đến từ các danh sách cho phép được cấu hình rõ ràng.
    Để một danh tính được cấp quyền cho cả tin nhắn trực tiếp và lệnh nhóm: thêm ID người dùng Telegram dạng số của bạn vào `channels.telegram.allowFrom`, và đối với các lệnh chỉ dành cho chủ sở hữu, hãy đảm bảo `commands.ownerAllowFrom` chứa `telegram:<your user id>`.

    ### Tìm ID người dùng Telegram của bạn

    An toàn hơn (không dùng bot bên thứ ba): gửi tin nhắn trực tiếp cho bot của bạn, chạy `openclaw logs --follow`, đọc `from.id`.

    Phương thức Bot API chính thức:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Bên thứ ba (ít riêng tư hơn): `@userinfobot` hoặc `@getidsbot`.

  </Tab>

  <Tab title="Chính sách nhóm và danh sách cho phép">
    Hai cơ chế kiểm soát được áp dụng đồng thời:

    1. **Những nhóm nào được phép** (`channels.telegram.groups`)
       - không có cấu hình `groups`, `groupPolicy: "open"`: mọi nhóm đều vượt qua bước kiểm tra ID nhóm
       - không có cấu hình `groups`, `groupPolicy: "allowlist"` (mặc định): mọi nhóm đều bị chặn cho đến khi bạn thêm các mục `groups` (hoặc `"*"`)
       - `groups` đã được cấu hình: hoạt động như một danh sách cho phép (ID rõ ràng hoặc `"*"`)

    2. **Những người gửi nào được phép trong nhóm** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (mặc định) / `disabled`

    `groupAllowFrom` lọc người gửi trong nhóm; nếu chưa đặt, Telegram dùng dự phòng `allowFrom` (không phải kho ghép cặp — quyền của người gửi trong nhóm không bao giờ kế thừa các phê duyệt từ kho ghép cặp tin nhắn trực tiếp, đây là ranh giới bảo mật kể từ `2026.2.25`).
    Các mục `groupAllowFrom` phải là ID người dùng Telegram dạng số (các tiền tố `telegram:` / `tg:` được chuẩn hóa); các mục không phải dạng số sẽ bị bỏ qua. Không đặt ID cuộc trò chuyện nhóm hoặc siêu nhóm ở đây — ID cuộc trò chuyện âm thuộc `channels.telegram.groups`.
    Mẫu thực tế cho bot có một chủ sở hữu: đặt ID người dùng của bạn trong `channels.telegram.allowFrom`, để `groupAllowFrom` chưa được đặt và cho phép các nhóm mục tiêu trong `channels.telegram.groups`.
    Nếu `channels.telegram` hoàn toàn không có trong cấu hình, môi trường chạy mặc định đóng khi có lỗi bằng `groupPolicy="allowlist"`, trừ khi `channels.defaults.groupPolicy` được đặt rõ ràng.

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

      - ID cuộc trò chuyện nhóm/siêu nhóm Telegram dạng số âm (`-1001234567890`) thuộc `channels.telegram.groups`.
      - ID người dùng Telegram (`8734062810`) thuộc `groupAllowFrom` để giới hạn những người trong một nhóm được phép có thể kích hoạt bot.
      - Chỉ sử dụng `groupAllowFrom: ["*"]` để cho phép mọi thành viên của một nhóm được phép trò chuyện với bot.

    </Warning>

  </Tab>

  <Tab title="Hành vi đề cập">
    Theo mặc định, phản hồi trong nhóm yêu cầu đề cập. Đề cập có thể đến từ:

    - một lượt đề cập `@botusername` gốc, hoặc
    - một mẫu đề cập trong `agents.list[].groupChat.mentionPatterns` hoặc `messages.groupChat.mentionPatterns`

    Các nút chuyển ở cấp phiên (chỉ là trạng thái, không được lưu bền vững): `/activation always`, `/activation mention`. Sử dụng cấu hình để lưu bền vững:

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

    Cách lấy ID cuộc trò chuyện nhóm: chuyển tiếp một tin nhắn nhóm đến `@userinfobot` / `@getidsbot`, đọc `chat.id` từ `openclaw logs --follow`, kiểm tra `getUpdates` của Bot API hoặc (sau khi nhóm được cho phép) chạy `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Hành vi khi chạy

- Telegram chạy bên trong tiến trình gateway.
- Việc định tuyến mang tính xác định: phản hồi cho tin nhắn đến từ Telegram sẽ được gửi lại qua Telegram (mô hình không chọn kênh).
- Tin nhắn đến được chuẩn hóa vào phong bì kênh dùng chung cùng siêu dữ liệu phản hồi, phần giữ chỗ cho phương tiện và ngữ cảnh chuỗi phản hồi được lưu bền vững cho các phản hồi mà gateway đã quan sát.
- Các phiên nhóm được tách biệt theo ID nhóm. Chủ đề diễn đàn nối thêm `:topic:<threadId>`.
- Tin nhắn DM có thể mang `message_thread_id`; OpenClaw giữ nguyên giá trị này cho các phản hồi. Phiên chủ đề DM chỉ được tách khi Telegram `getMe` báo cáo `has_topics_enabled: true` cho bot; nếu không, DM vẫn nằm trong phiên phẳng.
- Long polling sử dụng runner grammY với trình tự theo từng cuộc trò chuyện/từng luồng. Mức đồng thời của sink runner sử dụng `agents.defaults.maxConcurrent`.
- Quá trình khởi động nhiều tài khoản giới hạn số phép thăm dò `getMe` đồng thời để các đội bot lớn không đồng loạt phân tán phép thăm dò cho mọi tài khoản.
- Mỗi tiến trình gateway bảo vệ long polling để mỗi lần chỉ một poller đang hoạt động có thể sử dụng một token bot. Xung đột 409 `getUpdates` kéo dài cho thấy một gateway OpenClaw, tập lệnh hoặc poller bên ngoài khác đang sử dụng cùng token.
- Theo mặc định, watchdog polling khởi động lại sau 120 giây mà không hoàn tất kiểm tra trạng thái hoạt động `getUpdates`. Chỉ tăng `channels.telegram.pollingStallThresholdMs` (30000-600000, hỗ trợ ghi đè theo tài khoản) nếu bản triển khai của bạn gặp các lần khởi động lại giả do polling bị đình trệ trong quá trình xử lý kéo dài.
- Telegram Bot API không hỗ trợ xác nhận đã đọc (`sendReadReceipts` không áp dụng).

<Note>
  `channels.telegram.dm.threadReplies` và `channels.telegram.direct.<chatId>.threadReplies` đã bị xóa. Chạy `openclaw doctor --fix` sau khi nâng cấp nếu cấu hình của bạn vẫn còn các khóa đó. Việc định tuyến chủ đề DM hiện tuân theo Telegram `getMe.has_topics_enabled` (do chế độ luồng của BotFather kiểm soát): bot đã bật chủ đề sử dụng phiên DM theo phạm vi luồng khi Telegram gửi `message_thread_id`; các DM khác vẫn nằm trong phiên phẳng.
</Note>

## Tham chiếu tính năng

<AccordionGroup>
  <Accordion title="Bản xem trước luồng trực tiếp (chỉnh sửa tin nhắn)">
    OpenClaw truyền trực tiếp các phản hồi từng phần theo thời gian thực trong cuộc trò chuyện trực tiếp, nhóm và chủ đề: gửi một tin nhắn xem trước, sau đó lặp lại `editMessageText`, rồi hoàn tất ngay tại chỗ.

    - `channels.telegram.streaming` là `off | partial | block | progress` (mặc định: `partial`)
    - các bản xem trước câu trả lời ban đầu ngắn được chống dội, sau đó được hiện thực hóa sau một khoảng trễ giới hạn nếu lượt chạy vẫn đang hoạt động
    - `progress` duy trì một bản nháp trạng thái có thể chỉnh sửa duy nhất cho tiến trình công cụ, hiển thị nhãn trạng thái ổn định khi hoạt động trả lời xuất hiện trước tiến trình công cụ, xóa bản nháp khi hoàn tất và gửi câu trả lời cuối cùng dưới dạng tin nhắn thông thường
    - `streaming.preview.toolProgress` kiểm soát việc các cập nhật công cụ/tiến trình có tái sử dụng cùng tin nhắn xem trước đã chỉnh sửa hay không (mặc định: `true` khi truyền trực tiếp bản xem trước đang hoạt động)
    - `streaming.preview.commandText` kiểm soát chi tiết lệnh/thực thi trong các dòng đó: `raw` (mặc định) hoặc `status` (chỉ nhãn công cụ)
    - `streaming.progress.commentary` (mặc định: `false`) cho phép đưa văn bản bình luận/mở đầu của trợ lý vào bản nháp tiến trình tạm thời
    - các giá trị `channels.telegram.streamMode` cũ, giá trị boolean `streaming` và các khóa xem trước bản nháp gốc đã ngừng sử dụng sẽ được phát hiện; chạy `openclaw doctor --fix` để di chuyển chúng

    Các dòng tiến trình công cụ là những cập nhật trạng thái ngắn được hiển thị trong khi công cụ chạy (thực thi lệnh, đọc tệp, cập nhật kế hoạch, tóm tắt bản vá, phần mở đầu/bình luận của Codex trong chế độ app-server). Telegram bật các dòng này theo mặc định (khớp với hành vi đã phát hành từ `v2026.4.22`+).

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

    `streaming.mode: "off"` tắt các chỉnh sửa bản xem trước và loại bỏ nội dung trao đổi chung về công cụ/tiến trình thay vì gửi chúng dưới dạng các tin nhắn trạng thái độc lập; lời nhắc phê duyệt, phương tiện và lỗi vẫn được định tuyến qua cơ chế gửi cuối cùng thông thường. `streaming.preview.toolProgress: false` chỉ giữ lại các chỉnh sửa bản xem trước câu trả lời.

    <Note>
      Phản hồi trích dẫn đã chọn là ngoại lệ. Khi `replyToMode` là `first`, `all` hoặc `batched` và tin nhắn đến có văn bản trích dẫn đã chọn, OpenClaw gửi câu trả lời cuối cùng qua đường dẫn phản hồi trích dẫn gốc của Telegram thay vì chỉnh sửa bản xem trước câu trả lời, vì vậy `streaming.preview.toolProgress` không thể hiển thị các dòng trạng thái trong lượt đó. Phản hồi cho tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn được truyền trực tiếp. Đặt `replyToMode: "off"` khi khả năng hiển thị tiến trình công cụ quan trọng hơn phản hồi trích dẫn gốc, hoặc `streaming.preview.toolProgress: false` để chấp nhận sự đánh đổi đó.
    </Note>

    Đối với phản hồi chỉ có văn bản: bản xem trước ngắn nhận chỉnh sửa cuối cùng ngay tại chỗ; phần cuối dài được chia thành nhiều tin nhắn sẽ tái sử dụng bản xem trước làm đoạn đầu tiên, sau đó chỉ gửi phần còn lại; phần cuối ở chế độ tiến trình sẽ xóa bản nháp trạng thái và sử dụng cơ chế gửi cuối cùng thông thường; nếu chỉnh sửa cuối cùng thất bại trước khi việc hoàn tất được xác nhận, OpenClaw chuyển sang cơ chế gửi cuối cùng thông thường và dọn dẹp bản xem trước cũ. Đối với phản hồi phức tạp (tải trọng phương tiện), OpenClaw luôn chuyển sang cơ chế gửi cuối cùng thông thường và dọn dẹp bản xem trước.

    Truyền trực tiếp bản xem trước và truyền trực tiếp theo khối loại trừ lẫn nhau — khi truyền trực tiếp theo khối được bật rõ ràng, OpenClaw bỏ qua luồng xem trước để tránh truyền trực tiếp hai lần.

    Lập luận: `/reasoning stream` truyền trực tiếp nội dung lập luận vào bản xem trước trực tiếp trong khi tạo, sau đó xóa bản xem trước lập luận sau khi gửi xong câu trả lời cuối cùng (sử dụng `/reasoning on` để giữ nội dung này hiển thị). Câu trả lời cuối cùng được gửi mà không có văn bản lập luận.

  </Accordion>

  <Accordion title="Định dạng tin nhắn phong phú">
    Theo mặc định, văn bản gửi đi sử dụng tin nhắn HTML tiêu chuẩn của Telegram, có thể đọc được trên các ứng dụng khách hiện tại: chữ đậm, chữ nghiêng, liên kết, mã, nội dung ẩn, trích dẫn — không phải các khối chỉ dành cho nội dung phong phú của Bot API 10.2 (bảng gốc, chi tiết, phương tiện phong phú, công thức).

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

    Khi được bật: tác nhân được thông báo rằng tin nhắn phong phú khả dụng cho bot/tài khoản này (cùng hợp đồng biên soạn Markdown + đảo HTML được hỗ trợ); văn bản Markdown được kết xuất qua IR Markdown của OpenClaw thành các khối phong phú có kiểu của Bot API 10.2 (tiêu đề, bảng, chi tiết, danh sách kiểm, phương tiện phong phú, công thức, bản đồ, ảnh ghép); chú thích phương tiện vẫn sử dụng chú thích HTML của Telegram (tin nhắn phong phú không thay thế chú thích và chú thích bị giới hạn ở 1024 ký tự).

    Điều này giúp văn bản của mô hình tránh các ký hiệu Markdown phong phú của Telegram, vì vậy tiền tệ như `$400-600K` không bị phân tích thành phép toán. Văn bản phong phú dài tự động được chia theo các giới hạn của Telegram. Bảng vượt quá giới hạn 20 cột sẽ chuyển về khối mã.

    Mặc định: tắt để đảm bảo khả năng tương thích với ứng dụng khách — một số ứng dụng khách Desktop, Web, Android và bên thứ ba hiện tại hiển thị các tin nhắn phong phú đã được chấp nhận dưới dạng không được hỗ trợ. Giữ tùy chọn này ở trạng thái tắt trừ khi mọi ứng dụng khách được sử dụng với bot đều có thể kết xuất chúng. `/status` cho biết phiên hiện tại đang bật hay tắt tin nhắn phong phú.

    Bản xem trước liên kết được bật theo mặc định. `channels.telegram.linkPreview: false` tắt tính năng tự động phát hiện thực thể cho văn bản phong phú.

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

    Lệnh tùy chỉnh chỉ là các mục menu — chúng không tự động triển khai hành vi. Các lệnh Plugin/skill vẫn có thể hoạt động khi được nhập ngay cả khi không hiển thị trong menu Telegram. Nếu lệnh gốc bị tắt, các lệnh tích hợp sẵn sẽ bị xóa; lệnh tùy chỉnh/Plugin vẫn có thể được đăng ký nếu đã cấu hình.

    Các lỗi thiết lập thường gặp:

    - `setMyCommands failed` với `BOT_COMMANDS_TOO_MUCH` sau lần thử lại cắt giảm có nghĩa là menu vẫn vượt quá giới hạn; hãy giảm số lệnh Plugin/skill/tùy chỉnh hoặc tắt `channels.telegram.commands.native`.
    - Nếu `deleteWebhook`, `deleteMyCommands` hoặc `setMyCommands` thất bại với `404: Not Found` trong khi các lệnh curl Bot API trực tiếp hoạt động, nguyên nhân thường là `channels.telegram.apiRoot` đã được đặt thành toàn bộ điểm cuối `/bot<TOKEN>`. `apiRoot` chỉ được là gốc Bot API; `openclaw doctor --fix` loại bỏ `/bot<TOKEN>` vô tình nằm ở cuối.
    - `getMe returned 401` có nghĩa là Telegram đã từ chối token bot được cấu hình. Cập nhật `botToken`, `tokenFile` hoặc `TELEGRAM_BOT_TOKEN` (tài khoản mặc định) bằng token BotFather hiện tại; OpenClaw dừng trước khi polling, vì vậy lỗi này không được báo cáo là lỗi dọn dẹp webhook.
    - `setMyCommands failed` kèm lỗi mạng/tìm nạp thường có nghĩa là DNS/HTTPS gửi đi tới `api.telegram.org` bị chặn.

    ### Lệnh ghép nối thiết bị (Plugin `device-pair`)

    Khi đã cài đặt:

    1. `/pair` tạo mã thiết lập
    2. dán mã vào ứng dụng iOS
    3. `/pair pending` liệt kê các yêu cầu đang chờ xử lý (bao gồm vai trò/phạm vi)
    4. phê duyệt: `/pair approve <requestId>`, `/pair approve` (chỉ yêu cầu đang chờ xử lý) hoặc `/pair approve latest`

    Nếu một thiết bị thử lại với chi tiết xác thực đã thay đổi (vai trò, phạm vi, khóa công khai), yêu cầu đang chờ xử lý trước đó sẽ được thay thế bằng một `requestId` mới; chạy lại `/pair pending` trước khi phê duyệt.

    Chi tiết thêm: [Ghép nối](/vi/channels/pairing#pair-via-telegram).

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

    Phạm vi: `off`, `dm`, `group`, `all`, `allowlist` (mặc định). `capabilities: ["inlineButtons"]` cũ ánh xạ tới `"all"`.

    Ví dụ về thao tác tin nhắn:

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

    Các lượt nhấp callback không được trình xử lý tương tác của plugin đã đăng ký nhận sẽ được chuyển tới agent dưới dạng văn bản: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Các hành động tin nhắn Telegram dành cho agent và tự động hóa">
    Các hành động:

    - `sendMessage` (`to`, `content`, `mediaUrl` tùy chọn, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` hoặc `caption`, các nút nội tuyến `presentation` tùy chọn; các chỉnh sửa chỉ có nút sẽ cập nhật phần đánh dấu trả lời)
    - `createForumTopic` (`chatId`, `name`, `iconColor` tùy chọn, `iconCustomEmojiId`)

    Các bí danh thuận tiện: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Kiểm soát bật/tắt: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (mặc định: tắt). `edit`, `createForumTopic` và `editForumTopic` được bật theo mặc định và không có nút bật/tắt riêng.
    Các lần gửi trong thời gian chạy sử dụng ảnh chụp nhanh cấu hình/bí mật đang hoạt động từ lúc khởi động/tải lại, vì vậy các đường dẫn hành động không phân giải lại giá trị `SecretRef` cho mỗi lần gửi.

    Ngữ nghĩa loại bỏ phản ứng: [/tools/reactions](/vi/tools/reactions).

  </Accordion>

  <Accordion title="Các thẻ luồng trả lời">
    Các thẻ luồng trả lời tường minh trong đầu ra được tạo:

    - `[[reply_to_current]]` — trả lời tin nhắn kích hoạt
    - `[[reply_to:<id>]]` — trả lời một ID tin nhắn cụ thể

    `channels.telegram.replyToMode`: `off` (mặc định), `first`, `all`.

    Khi luồng trả lời được bật và văn bản/chú thích gốc khả dụng, OpenClaw tự động thêm một đoạn trích dẫn nguyên bản. Telegram giới hạn văn bản trích dẫn nguyên bản ở 1024 đơn vị mã UTF-16; các tin nhắn dài hơn được trích dẫn từ đầu và chuyển về trả lời thuần túy nếu Telegram từ chối phần trích dẫn.

    `off` chỉ vô hiệu hóa luồng trả lời ngầm định; các thẻ `[[reply_to_*]]` tường minh vẫn được áp dụng.

  </Accordion>

  <Accordion title="Chủ đề diễn đàn và hành vi luồng">
    Siêu nhóm diễn đàn: khóa phiên chủ đề được nối thêm `:topic:<threadId>`; các lượt trả lời và trạng thái đang nhập nhắm đến luồng chủ đề; đường dẫn cấu hình chủ đề là `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Chủ đề chung (`threadId=1`) là trường hợp đặc biệt: khi gửi tin nhắn sẽ bỏ qua `message_thread_id` (Telegram từ chối `sendMessage(...thread_id=1)` với thông báo "không tìm thấy luồng"), nhưng các hành động đang nhập vẫn bao gồm `message_thread_id` (theo quan sát thực nghiệm, điều này là bắt buộc để chỉ báo đang nhập xuất hiện).

    Các mục chủ đề kế thừa cài đặt nhóm trừ khi bị ghi đè (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` chỉ áp dụng cho chủ đề và không kế thừa từ giá trị mặc định của nhóm. `topics."*"` đặt giá trị mặc định cho mọi chủ đề trong nhóm đó; ID chủ đề chính xác vẫn được ưu tiên hơn `"*"`.

    **Định tuyến agent theo từng chủ đề**: mỗi chủ đề có thể định tuyến đến một agent khác nhau thông qua `agentId` trong cấu hình chủ đề, cung cấp cho chủ đề không gian làm việc, bộ nhớ và phiên riêng:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Chủ đề chung -> agent chính
                "3": { agentId: "zu" },        // Chủ đề phát triển -> agent zu
                "5": { agentId: "coder" }      // Đánh giá mã -> agent coder
              }
            }
          }
        }
      }
    }
    ```

    Sau đó, mỗi chủ đề có khóa phiên riêng, ví dụ `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Liên kết chủ đề ACP lâu dài**: các chủ đề diễn đàn có thể ghim các phiên bộ điều khiển ACP thông qua liên kết định kiểu cấp cao nhất (`bindings[]` với `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` và một id có định danh chủ đề như `-1001234567890:topic:42`). Hiện chỉ áp dụng cho các chủ đề diễn đàn trong nhóm/siêu nhóm. Xem [Agent ACP](/vi/tools/acp-agents).

    **Khởi tạo ACP liên kết với luồng từ cuộc trò chuyện**: `/acp spawn <agent> --thread here|auto` liên kết chủ đề hiện tại với một phiên ACP mới; các lượt tiếp theo được định tuyến trực tiếp đến đó và OpenClaw ghim xác nhận khởi tạo trong chủ đề. Yêu cầu `channels.telegram.threadBindings.spawnSessions` (mặc định: `true`).

    Ngữ cảnh mẫu cung cấp `MessageThreadId` và `IsForum`. Các cuộc trò chuyện DM có `message_thread_id` giữ lại siêu dữ liệu trả lời nhưng chỉ sử dụng khóa phiên có nhận biết luồng khi `getMe` của Telegram báo cáo `has_topics_enabled: true`.
    Các tùy chọn ghi đè `dm.threadReplies` và `direct.*.threadReplies` đã ngừng sử dụng không còn tồn tại; chế độ luồng của BotFather là nguồn thông tin xác thực duy nhất. Chạy `openclaw doctor --fix` để xóa các khóa cấu hình cũ.

  </Accordion>

  <Accordion title="Âm thanh, video và nhãn dán">
    ### Tin nhắn âm thanh

    Telegram phân biệt ghi chú thoại với tệp âm thanh. Mặc định: hành vi tệp âm thanh; gắn thẻ `[[audio_as_voice]]` trong câu trả lời của agent để buộc gửi dưới dạng ghi chú thoại. Bản chép lời ghi chú thoại đầu vào được đóng khung là văn bản không đáng tin cậy do máy tạo trong ngữ cảnh agent, nhưng việc phát hiện lượt đề cập vẫn sử dụng bản chép lời thô để các tin nhắn thoại bị kiểm soát bằng lượt đề cập tiếp tục hoạt động.

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

    Sử dụng hành động `send` hiện có với một đối tượng `location` độc lập. Tọa độ sẽ gửi một ghim nguyên bản; thêm cả `name` và `address` sẽ gửi một thẻ địa điểm nguyên bản. Không thể kết hợp việc gửi vị trí với văn bản tin nhắn hoặc nội dung đa phương tiện.

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

    Đầu vào: WEBP tĩnh được tải xuống và xử lý (phần giữ chỗ `<media:sticker>`); TGS động và video WEBM bị bỏ qua.

    Các trường ngữ cảnh nhãn dán: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Mô tả được lưu vào bộ nhớ đệm trong trạng thái plugin SQLite của OpenClaw để giảm các lệnh gọi thị giác lặp lại.

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
    Các phản ứng Telegram xuất hiện dưới dạng bản cập nhật `message_reaction`, tách biệt với tải trọng tin nhắn. Khi được bật, OpenClaw đưa các sự kiện hệ thống như `Telegram reaction added: 👍 by Alice (@alice) on msg 42` vào hàng đợi.

    - `channels.telegram.reactionNotifications`: `off | own | all` (mặc định: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (mặc định: `minimal`)

    `own` có nghĩa là chỉ các phản ứng của người dùng đối với tin nhắn do bot gửi (nỗ lực tối đa thông qua bộ nhớ đệm tin nhắn đã gửi). Các sự kiện phản ứng vẫn tuân thủ các biện pháp kiểm soát truy cập Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); người gửi không được cấp quyền sẽ bị loại bỏ.

    Telegram không cung cấp ID luồng trong các bản cập nhật phản ứng: nhóm không phải diễn đàn định tuyến đến phiên trò chuyện nhóm; nhóm diễn đàn định tuyến đến phiên chủ đề chung (`:topic:1`), không phải chủ đề chính xác ban đầu.

    `allowed_updates` cho polling/webhook tự động bao gồm `message_reaction`.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw xử lý tin nhắn đầu vào. `messages.ackReactionScope` quyết định gửi phản ứng đó *khi nào*.

    **Thứ tự phân giải emoji:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji dự phòng của danh tính agent (`agents.list[].identity.emoji`, nếu không thì "👀")

    Telegram yêu cầu một emoji unicode (ví dụ "👀"); sử dụng `""` để vô hiệu hóa phản ứng cho một kênh hoặc tài khoản.

    **Phạm vi (`messages.ackReactionScope`, mặc định `"group-mentions"`; hiện không có tùy chọn ghi đè theo tài khoản Telegram hoặc kênh Telegram):**

    `all` (DM + nhóm, bao gồm sự kiện phòng không cần đề cập), `direct` (chỉ DM), `group-all` (mọi tin nhắn nhóm ngoại trừ sự kiện phòng không cần đề cập, không có DM), `group-mentions` (nhóm khi bot được đề cập; **không có DM** — mặc định), `off` / `none` (tắt).

    <Note>
    Phạm vi mặc định (`group-mentions`) không kích hoạt phản ứng xác nhận trong DM hoặc sự kiện phòng không cần đề cập. Sử dụng `direct` hoặc `all` cho DM; chỉ `all` xác nhận sự kiện phòng không cần đề cập. Giá trị này được đọc khi nhà cung cấp Telegram khởi động, vì vậy cần khởi động lại Gateway để thay đổi có hiệu lực.
    </Note>

  </Accordion>

  <Accordion title="Ghi cấu hình từ các sự kiện và lệnh Telegram">
    Tính năng ghi cấu hình kênh được bật theo mặc định (`configWrites !== false`). Các lượt ghi do Telegram kích hoạt bao gồm sự kiện di chuyển nhóm (`migrate_to_chat_id`, cập nhật `channels.telegram.groups`) và `/config set` / `/config unset` (yêu cầu bật lệnh).

    Vô hiệu hóa:

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
    Mặc định là long polling. Đối với chế độ webhook, đặt `channels.telegram.webhookUrl` và `channels.telegram.webhookSecret`; tùy chọn `webhookPath` (mặc định `/telegram-webhook`), `webhookHost` (mặc định `127.0.0.1`), `webhookPort` (mặc định `8787`), `webhookCertPath` (PEM chứng chỉ tự ký cho thiết lập IP trực tiếp hoặc không có tên miền).

    Trong chế độ long polling, OpenClaw chỉ lưu lâu dài mốc khởi động lại sau khi một bản cập nhật được gửi đi thành công; trình xử lý thất bại khiến bản cập nhật đó vẫn có thể được thử lại trong cùng tiến trình thay vì đánh dấu là đã hoàn thành.

    Theo mặc định, trình lắng nghe cục bộ liên kết với `127.0.0.1:8787`. Đối với lưu lượng truy cập công khai, hãy đặt một proxy ngược trước cổng cục bộ hoặc chủ ý đặt `webhookHost: "0.0.0.0"`.

    Chế độ webhook xác thực các điều kiện bảo vệ yêu cầu, token bí mật Telegram và phần thân JSON, sau đó xác nhận bản cập nhật vào hàng đợi đầu vào bền vững trước khi trả về `200` trống. Việc tiếp nhận bền vững thành công bao gồm `x-openclaw-delivery-accepted: durable`; các phản hồi về tình trạng, định tuyến, xác thực, kiểm tra tính hợp lệ và lỗi lưu trữ không có tiêu đề này. Proxy ngược và bộ điều khiển máy chủ có thể yêu cầu tiêu đề này để phân biệt việc OpenClaw tiếp nhận với một `200` trống chung chung mà không cần suy ra việc chấp nhận từ thời gian phản hồi.

    Sau đó, OpenClaw xử lý bản cập nhật không đồng bộ thông qua cùng các luồng bot theo từng cuộc trò chuyện/từng chủ đề được long polling sử dụng, vì vậy các lượt agent chậm không giữ ACK giao nhận của Telegram.

  </Accordion>

  <Accordion title="Giới hạn, thử lại và đích CLI">
    - `channels.telegram.textChunkLimit` mặc định là 4000; `streaming.chunkMode="newline"` ưu tiên ranh giới đoạn văn (dòng trống) trước khi chia theo độ dài.
    - `channels.telegram.mediaMaxMb` (mặc định 100) giới hạn kích thước phương tiện gửi đến và gửi đi.
    - `channels.telegram.mediaGroupFlushMs` (mặc định 500, phạm vi 10-60000) kiểm soát thời gian album/nhóm phương tiện được lưu đệm trước khi OpenClaw phân phối chúng dưới dạng một tin nhắn gửi đến. Tăng giá trị này nếu các phần của album đến muộn; giảm giá trị để giảm độ trễ phản hồi album.
    - `channels.telegram.timeoutSeconds` ghi đè thời gian chờ của máy khách API (áp dụng giá trị mặc định của grammY nếu không được đặt). Máy khách bot giới hạn các giá trị cấu hình thấp hơn cơ chế bảo vệ 60 giây cho yêu cầu văn bản/chỉ báo đang nhập gửi đi, để grammY không hủy việc gửi phản hồi hiển thị trước khi cơ chế bảo vệ truyền tải và phương án dự phòng của OpenClaw có thể chạy. Long polling vẫn sử dụng cơ chế bảo vệ yêu cầu `getUpdates` trong 45 giây để các lượt thăm dò không hoạt động không bị bỏ mặc vô thời hạn.
    - `channels.telegram.pollingStallThresholdMs` mặc định là 120000; chỉ điều chỉnh trong khoảng từ 30000 đến 600000 khi việc khởi động lại do phát hiện nhầm polling bị đình trệ.
    - lịch sử ngữ cảnh nhóm sử dụng `channels.telegram.historyLimit` hoặc `messages.groupChat.historyLimit` (mặc định 50); `0` sẽ vô hiệu hóa.
    - ngữ cảnh bổ sung từ phản hồi/trích dẫn/chuyển tiếp được chuẩn hóa thành một cửa sổ ngữ cảnh hội thoại đã chọn khi Gateway đã quan sát các tin nhắn cha; bộ nhớ đệm tin nhắn đã quan sát nằm trong trạng thái plugin SQLite của OpenClaw và `openclaw doctor --fix` nhập các tệp sidecar cũ. Telegram chỉ bao gồm một `reply_to_message` nông cho mỗi bản cập nhật, vì vậy các chuỗi cũ hơn bộ nhớ đệm bị giới hạn ở tải trọng đó.
    - danh sách cho phép của Telegram chủ yếu kiểm soát ai có thể kích hoạt tác nhân, chứ không phải là ranh giới che giấu đầy đủ cho ngữ cảnh bổ sung.
    - lịch sử DM: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` áp dụng cho các trình trợ giúp gửi của Telegram (CLI/công cụ/hành động) đối với lỗi API gửi đi có thể khôi phục. Việc gửi phản hồi cuối cùng cho tin nhắn đến sử dụng cơ chế thử lại gửi an toàn có giới hạn đối với lỗi trước khi kết nối, nhưng không thử lại các gói mạng không rõ trạng thái sau khi gửi vì có thể tạo tin nhắn hiển thị trùng lặp.

    Đích gửi của CLI và công cụ tin nhắn chấp nhận ID cuộc trò chuyện dạng số, tên người dùng hoặc đích chủ đề diễn đàn:

```bash
openclaw message send --channel telegram --target 123456789 --message "xin chào"
openclaw message send --channel telegram --target @name --message "xin chào"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "xin chào chủ đề"
```

    Cuộc thăm dò ý kiến sử dụng `openclaw message poll` và hỗ trợ chủ đề diễn đàn:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Phát hành chứ?" --poll-option "Có" --poll-option "Không"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Chọn thời gian" --poll-option "10 giờ sáng" --poll-option "2 giờ chiều" \
  --poll-duration-seconds 300 --poll-public
```

    Các cờ thăm dò ý kiến chỉ dành cho Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (hoặc đích `:topic:`). `--poll-option` lặp lại 2-12 lần (giới hạn tùy chọn của Telegram).

    Tính năng gửi của Telegram cũng hỗ trợ `--presentation` với các khối `buttons` cho bàn phím nội tuyến (khi `channels.telegram.capabilities.inlineButtons` cho phép), `--pin` hoặc `--delivery '{"pin":true}'` để yêu cầu ghim tin nhắn khi bot có thể ghim trong cuộc trò chuyện đó và `--force-document` để gửi hình ảnh, GIF và video dưới dạng tài liệu thay vì nội dung tải lên đã nén/hoạt ảnh/video.

    Kiểm soát hành động: `channels.telegram.actions.sendMessage=false` vô hiệu hóa tất cả tin nhắn gửi đi, bao gồm cả cuộc thăm dò ý kiến; `channels.telegram.actions.poll=false` vô hiệu hóa việc tạo cuộc thăm dò ý kiến trong khi vẫn cho phép gửi tin nhắn thông thường.

  </Accordion>

  <Accordion title="Phê duyệt thực thi trong Telegram">
    Telegram hỗ trợ phê duyệt thực thi trong DM của người phê duyệt và có thể tùy chọn đăng lời nhắc trong cuộc trò chuyện hoặc chủ đề ban đầu. Người phê duyệt phải là ID người dùng Telegram dạng số.

    - `channels.telegram.execApprovals.enabled` (`"auto"` bật khi có thể phân giải ít nhất một người phê duyệt)
    - `channels.telegram.execApprovals.approvers` (dùng ID chủ sở hữu dạng số từ `commands.ownerAllowFrom` làm phương án dự phòng)
    - `channels.telegram.execApprovals.target`: `dm` (mặc định) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` và `defaultTo` kiểm soát ai có thể giao tiếp với bot và nơi bot gửi phản hồi thông thường — chúng không biến một người thành người phê duyệt thực thi. Lần ghép đôi DM được phê duyệt đầu tiên sẽ khởi tạo `commands.ownerAllowFrom` khi chưa có chủ sở hữu lệnh, nhờ đó các thiết lập một chủ sở hữu hoạt động mà không cần lặp lại ID trong `execApprovals.approvers`.

    Việc gửi đến kênh hiển thị nội dung lệnh trong cuộc trò chuyện; chỉ bật `channel` hoặc `both` trong các nhóm/chủ đề đáng tin cậy. Khi lời nhắc được gửi vào một chủ đề diễn đàn, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và nội dung tiếp theo. Phê duyệt thực thi mặc định hết hạn sau 30 phút.

    Các nút phê duyệt nội tuyến cũng yêu cầu `channels.telegram.capabilities.inlineButtons` cho phép bề mặt đích (`dm`, `group` hoặc `all`). ID phê duyệt có tiền tố `plugin:` được phân giải thông qua phê duyệt plugin; các ID khác được phân giải thông qua phê duyệt thực thi trước.

    Xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kiểm soát phản hồi lỗi

Khi tác nhân gặp lỗi gửi hoặc lỗi nhà cung cấp, chính sách lỗi kiểm soát việc thông báo lỗi có được gửi đến cuộc trò chuyện Telegram hay không:

| Khóa                                 | Giá trị                     | Mặc định         | Mô tả                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` gửi mọi thông báo lỗi đến cuộc trò chuyện. `once` gửi mỗi thông báo lỗi duy nhất một lần trong mỗi khoảng thời gian chờ (chặn các lỗi giống nhau lặp lại). `silent` không bao giờ gửi thông báo lỗi đến cuộc trò chuyện. |
| `channels.telegram.errorCooldownMs` | số (ms)                | `14400000` (4h) | Khoảng thời gian chờ cho chính sách `once`. Sau khi một lỗi được gửi, thông báo tương tự sẽ bị chặn cho đến khi khoảng thời gian này trôi qua. Ngăn chặn tình trạng lỗi tràn ngập trong thời gian gián đoạn.                                           |

Hỗ trợ ghi đè theo từng tài khoản, từng nhóm và từng chủ đề (kế thừa giống như các khóa cấu hình Telegram khác).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // chặn lỗi trong nhóm này
        },
      },
    },
  },
}
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bot không phản hồi tin nhắn nhóm không đề cập đến bot">

    - Nếu `requireMention=false`, chế độ riêng tư của Telegram phải cho phép khả năng hiển thị đầy đủ: BotFather `/setprivacy` -> Disable, sau đó xóa rồi thêm lại bot vào nhóm.
    - `openclaw channels status` cảnh báo khi cấu hình yêu cầu xử lý tin nhắn nhóm không đề cập đến bot.
    - `openclaw channels status --probe` kiểm tra ID nhóm dạng số được chỉ định rõ ràng; ký tự đại diện `"*"` không thể được thăm dò tư cách thành viên.
    - Kiểm tra phiên nhanh: `/activation always`.

  </Accordion>

  <Accordion title="Bot hoàn toàn không nhận được tin nhắn nhóm">

    - Khi có `channels.telegram.groups`, nhóm phải được liệt kê (hoặc bao gồm `"*"`).
    - Xác minh tư cách thành viên của bot trong nhóm.
    - Xem lại `openclaw logs --follow` để biết lý do bỏ qua.

  </Accordion>

  <Accordion title="Lệnh chỉ hoạt động một phần hoặc hoàn toàn không hoạt động">

    - Cấp quyền cho danh tính người gửi của bạn (ghép đôi và/hoặc `allowFrom` dạng số); việc cấp quyền cho lệnh vẫn áp dụng ngay cả khi chính sách nhóm là `open`.
    - `setMyCommands failed` cùng với `BOT_COMMANDS_TOO_MUCH` có nghĩa là menu gốc có quá nhiều mục; hãy giảm số lệnh plugin/skill/tùy chỉnh hoặc vô hiệu hóa menu gốc.
    - Các lệnh gọi khởi động `deleteMyCommands` / `setMyCommands` và lệnh gọi chỉ báo đang nhập `sendChatAction` đều có giới hạn thời gian và được thử lại một lần thông qua phương án truyền tải dự phòng của Telegram khi yêu cầu hết thời gian chờ. Lỗi mạng/fetch kéo dài thường có nghĩa là không thể kết nối DNS/HTTPS đến `api.telegram.org`.

  </Accordion>

  <Accordion title="Khởi động báo cáo token không được cấp quyền">

    - `getMe returned 401` là lỗi xác thực Telegram đối với token bot đã cấu hình. Sao chép lại hoặc tạo lại token trong BotFather, sau đó cập nhật `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` hoặc `TELEGRAM_BOT_TOKEN` (tài khoản mặc định).
    - `deleteWebhook 401 Unauthorized` trong khi khởi động cũng là lỗi xác thực; việc coi đây là "không tồn tại webhook" chỉ trì hoãn cùng lỗi token không hợp lệ đến một lệnh gọi API sau đó.

  </Accordion>

  <Accordion title="Polling hoặc mạng không ổn định">

    - Node 22+ với fetch/proxy tùy chỉnh có thể kích hoạt hành vi hủy ngay lập tức nếu các kiểu `AbortSignal` không khớp.
    - Một số máy chủ phân giải `api.telegram.org` sang IPv6 trước; đường truyền IPv6 gửi đi bị lỗi gây ra các lỗi API gián đoạn.
    - Nhật ký chứa `TypeError: fetch failed` hoặc `Network request for 'getUpdates' failed!` được thử lại dưới dạng lỗi mạng có thể khôi phục.
    - Trong khi khởi động polling, OpenClaw tái sử dụng lần thăm dò `getMe` khởi động thành công cho grammY để trình chạy không cần thực hiện `getMe` lần thứ hai trước `getUpdates` đầu tiên.
    - Nếu `deleteWebhook` thất bại do lỗi mạng tạm thời trong khi khởi động polling, OpenClaw tiếp tục chuyển sang long polling thay vì thực hiện thêm một lệnh gọi mặt phẳng điều khiển trước polling. Khi đó, webhook vẫn còn hoạt động sẽ xuất hiện dưới dạng xung đột `getUpdates`; OpenClaw tái tạo lớp truyền tải và thử lại việc dọn dẹp webhook.
    - Nếu socket Telegram được tái tạo theo chu kỳ ngắn cố định, hãy kiểm tra xem `channels.telegram.timeoutSeconds` có thấp hay không — máy khách bot giới hạn các giá trị cấu hình thấp hơn cơ chế bảo vệ yêu cầu gửi đi và `getUpdates`, nhưng các bản phát hành cũ hơn có thể hủy mọi lượt polling hoặc phản hồi khi giá trị này được đặt thấp hơn các cơ chế bảo vệ đó.
    - `Polling stall detected` trong nhật ký có nghĩa là OpenClaw khởi động lại polling và tái tạo lớp truyền tải sau 120 giây mà không hoàn tất kiểm tra trạng thái hoạt động của long polling theo mặc định.
    - `openclaw channels status --probe` và `openclaw doctor` cảnh báo khi tài khoản polling đang chạy chưa hoàn tất `getUpdates` sau thời gian gia hạn khởi động, tài khoản webhook đang chạy chưa hoàn tất `setWebhook` sau thời gian gia hạn khởi động hoặc hoạt động truyền tải polling thành công gần nhất đã quá cũ.
    - Chỉ tăng `channels.telegram.pollingStallThresholdMs` khi các lệnh gọi `getUpdates` chạy dài vẫn ổn định nhưng máy chủ vẫn báo cáo nhầm polling bị đình trệ và khởi động lại. Tình trạng đình trệ kéo dài thường cho thấy sự cố proxy, DNS, IPv6 hoặc đường truyền TLS gửi đi đến `api.telegram.org`.
    - Telegram tuân theo biến môi trường proxy của tiến trình cho hoạt động truyền tải Bot API: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` và các biến thể viết thường. `NO_PROXY` / `no_proxy` vẫn có thể bỏ qua `api.telegram.org`.
    - Nếu `OPENCLAW_PROXY_URL` được đặt cho môi trường dịch vụ và không có biến môi trường proxy tiêu chuẩn, Telegram cũng sử dụng URL đó cho hoạt động truyền tải Bot API.
    - Trên máy chủ VPS có đường truyền trực tiếp/TLS không ổn định, hãy định tuyến các lệnh gọi API Telegram qua proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ mặc định dùng `autoSelectFamily=true` (ngoại trừ WSL2). Thứ tự kết quả DNS của Telegram tuân theo `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sau đó là `channels.telegram.network.dnsResultOrder`, rồi đến mặc định của tiến trình (ví dụ `NODE_OPTIONS=--dns-result-order=ipv4first`), và chuyển sang `ipv4first` trên Node 22+ nếu không có thiết lập nào áp dụng.
    - Trên WSL2, hoặc khi chế độ chỉ dùng IPv4 hoạt động tốt hơn, hãy buộc chọn họ địa chỉ:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Theo mặc định, các câu trả lời thuộc dải đo kiểm chuẩn RFC 2544 (`198.18.0.0/15`) đã được cho phép khi tải xuống nội dung đa phương tiện Telegram. Nếu một proxy fake-IP hoặc proxy trong suốt đáng tin cậy ánh xạ lại `api.telegram.org` thành một địa chỉ riêng tư/nội bộ/dành cho mục đích đặc biệt khác trong quá trình tải xuống nội dung đa phương tiện, hãy bật chế độ bỏ qua chỉ dành cho Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Tùy chọn bật tương tự có sẵn cho từng tài khoản tại `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Nếu proxy phân giải các máy chủ nội dung đa phương tiện Telegram thành `198.18.x.x`, trước tiên hãy để cờ nguy hiểm ở trạng thái tắt — dải đó đã được cho phép theo mặc định.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` làm suy yếu các biện pháp bảo vệ SSRF đối với nội dung đa phương tiện Telegram. Chỉ sử dụng tùy chọn này cho các môi trường proxy đáng tin cậy do người vận hành kiểm soát (định tuyến fake-IP của Clash, Mihomo, Surge) tạo ra các câu trả lời riêng tư hoặc dành cho mục đích đặc biệt nằm ngoài dải đo kiểm chuẩn RFC 2544. Hãy để tùy chọn này ở trạng thái tắt khi truy cập Telegram thông thường qua internet công cộng.
    </Warning>

    - Các giá trị ghi đè tạm thời bằng biến môi trường: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Xác thực các câu trả lời DNS:

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
- mặc định của chủ đề: `groups.<chatId>.topics."*"` áp dụng cho các chủ đề diễn đàn không khớp; ID chủ đề chính xác sẽ ghi đè giá trị này
- phê duyệt thực thi: `execApprovals`, `accounts.*.execApprovals`
- lệnh/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- luồng hội thoại/phản hồi: `replyToMode`, `threadBindings`
- truyền trực tuyến: `streaming` (các chế độ `off | partial | block | progress`), `streaming.preview.toolProgress`
- định dạng/phân phối: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- nội dung đa phương tiện/mạng: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- gốc API tùy chỉnh: `apiRoot` (chỉ gốc Bot API; không bao gồm `/bot<TOKEN>`), `trustedLocalFileRoots` (các gốc `file_path` tuyệt đối của Bot API tự lưu trữ)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- hành động/khả năng: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- cảm xúc: `reactionNotifications`, `reactionLevel`
- lỗi: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- ghi/lịch sử: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Thứ tự ưu tiên khi dùng nhiều tài khoản: khi cấu hình từ hai ID tài khoản trở lên, hãy đặt `channels.telegram.defaultAccount` (hoặc bao gồm `channels.telegram.accounts.default`) để chỉ định rõ định tuyến mặc định. Nếu không, OpenClaw sẽ dùng ID tài khoản đã chuẩn hóa đầu tiên làm phương án dự phòng và `openclaw doctor` sẽ đưa ra cảnh báo. Các tài khoản có tên kế thừa `channels.telegram.allowFrom` / `groupAllowFrom`, nhưng không kế thừa các giá trị `accounts.default.*`.
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
