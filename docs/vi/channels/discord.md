---
read_when:
    - Phát triển các tính năng kênh Discord
summary: Thiết lập bot Discord, khóa cấu hình, thành phần, thoại và khắc phục sự cố
title: Discord
x-i18n:
    generated_at: "2026-07-19T05:36:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 28bf01ed58a342c6ac549280ced7a212d8dff2ef6fc00c40f5c9b0b62cc1519f
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw kết nối với Discord dưới dạng bot thông qua gateway chính thức của Discord. Hỗ trợ tin nhắn trực tiếp và các kênh máy chủ.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Tin nhắn trực tiếp Discord mặc định sử dụng chế độ ghép nối.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi của lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Luồng chẩn đoán và sửa chữa trên nhiều kênh.
  </Card>
</CardGroup>

## Thiết lập nhanh

Tạo một ứng dụng Discord có bot, thêm bot vào máy chủ của bạn rồi ghép nối bot với OpenClaw. Nếu có thể, hãy dùng máy chủ riêng tư; [trước tiên hãy tạo một máy chủ](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) nếu cần.

<Steps>
  <Step title="Tạo ứng dụng và bot Discord">
    Trong [Discord Developer Portal](https://discord.com/developers/applications), nhấp vào **New Application** và đặt tên cho ứng dụng (ví dụ: "OpenClaw").

    Mở **Bot** trong thanh bên và đặt **Username** thành tên của agent.

  </Step>

  <Step title="Bật các intent đặc quyền">
    Vẫn trên trang **Bot**, trong mục **Privileged Gateway Intents**, hãy bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; bắt buộc đối với danh sách cho phép theo vai trò, ánh xạ tên sang ID và các nhóm truy cập theo đối tượng của kênh)
    - **Presence Intent** (tùy chọn; chỉ dành cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Sao chép token bot">
    Trên trang **Bot**, nhấp vào **Reset Token** rồi sao chép token.

    <Note>
    Dù có tên như vậy, thao tác này tạo token đầu tiên của bạn — không có gì đang bị "đặt lại".
    </Note>

  </Step>

  <Step title="Tạo URL lời mời và thêm bot vào máy chủ">
    Mở **OAuth2** trong thanh bên. Trong **OAuth2 URL Generator**, hãy bật các phạm vi:

    - `bot`
    - `applications.commands`

    Trong phần **Bot Permissions** xuất hiện, hãy bật ít nhất:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (tùy chọn)

    Đây là mức cơ bản cho các kênh văn bản thông thường. Nếu bot sẽ đăng trong luồng — bao gồm quy trình của kênh diễn đàn hoặc kênh nội dung đa phương tiện có tạo hoặc tiếp tục một luồng — hãy bật cả **Send Messages in Threads**.

    Sao chép URL đã tạo, mở URL đó trong trình duyệt, chọn máy chủ của bạn rồi nhấp vào **Continue**. Bot giờ sẽ xuất hiện trong máy chủ.

  </Step>

  <Step title="Bật Developer Mode và thu thập các ID">
    Trong ứng dụng Discord, hãy bật Developer Mode để có thể sao chép ID:

    1. **User Settings** (biểu tượng bánh răng) → **Developer** → bật **Developer Mode**
       *(trên thiết bị di động: **App Settings** → **Advanced**)*
    2. Nhấp chuột phải vào **biểu tượng máy chủ** → **Copy Server ID**
    3. Nhấp chuột phải vào **ảnh đại diện của bạn** → **Copy User ID**

    Giữ Server ID và User ID cùng với token bot; bạn sẽ cần cả ba ở bước tiếp theo.

  </Step>

  <Step title="Cho phép tin nhắn trực tiếp từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord phải cho phép bot gửi tin nhắn trực tiếp cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** → **Privacy Settings** → bật **Direct Messages**.

    Hãy giữ tùy chọn này nếu bạn dùng tin nhắn trực tiếp Discord với OpenClaw. Nếu chỉ dùng các kênh máy chủ, bạn có thể tắt sau khi ghép nối.

  </Step>

  <Step title="Đặt token bot một cách an toàn (không gửi token trong cuộc trò chuyện)">
    Token bot là một bí mật. Hãy đặt token trên máy đang chạy OpenClaw trước khi nhắn tin cho agent:

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Nếu OpenClaw đã chạy dưới dạng dịch vụ nền, hãy khởi động lại thông qua ứng dụng OpenClaw trên Mac hoặc bằng cách dừng rồi khởi động lại tiến trình `openclaw gateway run`.
    Với các bản cài đặt dịch vụ được quản lý, hãy chạy `openclaw gateway install` từ một shell nơi `DISCORD_BOT_TOKEN` đã được đặt, hoặc lưu biến trong `~/.openclaw/.env` để dịch vụ có thể phân giải SecretRef môi trường sau khi khởi động lại.
    Nếu máy chủ của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/máy khách từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó: `channels.discord.applicationId` cho tài khoản mặc định hoặc `channels.discord.accounts.<accountId>.applicationId` cho từng bot.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Yêu cầu agent">
        Trò chuyện với agent OpenClaw trên một kênh hiện có (ví dụ Telegram) và đưa ra yêu cầu. Nếu Discord là kênh đầu tiên của bạn, hãy dùng thẻ CLI / cấu hình.

        > "Tôi đã đặt token bot Discord trong cấu hình. Vui lòng hoàn tất thiết lập Discord với User ID `<user_id>` và Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / cấu hình">
        Cấu hình dựa trên tệp:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Giá trị dự phòng từ môi trường cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Đối với thiết lập theo tập lệnh hoặc từ xa, hãy ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run`, sau đó chạy lại mà không có `--dry-run`. Chuỗi `token` dạng văn bản thuần cũng hoạt động và các giá trị SecretRef được hỗ trợ cho `channels.discord.token` trên các nhà cung cấp env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Đối với nhiều bot Discord, hãy lưu token bot và ID ứng dụng của từng bot trong tài khoản tương ứng. `channels.discord.applicationId` cấp cao nhất được các tài khoản kế thừa, vì vậy chỉ đặt tại đó khi mọi tài khoản đều dùng cùng một ID ứng dụng.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Phê duyệt lần ghép nối tin nhắn trực tiếp đầu tiên">
    Sau khi gateway chạy, hãy gửi tin nhắn trực tiếp cho bot trong Discord. Bot sẽ trả lời bằng mã ghép nối.

    <Tabs>
      <Tab title="Yêu cầu agent">
        Gửi mã ghép nối cho agent trên kênh hiện có của bạn:

        > "Phê duyệt mã ghép nối Discord này: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Mã ghép nối hết hạn sau 1 giờ. Sau khi được phê duyệt, hãy trò chuyện với agent trong tin nhắn trực tiếp Discord.

  </Step>
</Steps>

<Note>
Việc phân giải token có nhận biết tài khoản. Giá trị token trong cấu hình được ưu tiên hơn giá trị dự phòng từ môi trường và `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord đang bật phân giải thành cùng một token bot, OpenClaw chỉ khởi động một trình giám sát gateway cho token đó: token lấy từ cấu hình được ưu tiên hơn giá trị dự phòng từ môi trường; nếu không, tài khoản được bật đầu tiên sẽ được ưu tiên và tài khoản trùng lặp được báo cáo là đã tắt với lý do `duplicate bot token`.
Đối với các lệnh gọi đi nâng cao (công cụ tin nhắn/hành động kênh), `token` được chỉ định rõ ràng cho từng lệnh gọi sẽ được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi cũng như đọc/thăm dò (đọc/tìm kiếm/tải/luồng/ghim/quyền). Chính sách tài khoản/cài đặt thử lại vẫn lấy từ tài khoản đã chọn trong ảnh chụp nhanh thời gian chạy đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập không gian làm việc trong máy chủ

Sau khi tin nhắn trực tiếp hoạt động, bạn có thể biến máy chủ thành một không gian làm việc đầy đủ, trong đó mỗi kênh có phiên agent riêng với ngữ cảnh riêng. Khuyến nghị cho máy chủ riêng tư chỉ có bạn và bot.

<Steps>
  <Step title="Thêm máy chủ vào danh sách cho phép của máy chủ">
    Điều này cho phép agent phản hồi trong bất kỳ kênh nào trên máy chủ, không chỉ trong tin nhắn trực tiếp.

    <Tabs>
      <Tab title="Yêu cầu agent">
        > "Thêm Discord Server ID `<server_id>` của tôi vào danh sách cho phép của máy chủ"
      </Tab>
      <Tab title="Cấu hình">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Cho phép phản hồi mà không cần @đề cập">
    Theo mặc định, agent chỉ phản hồi trong các kênh máy chủ khi được @đề cập. Trên máy chủ riêng tư, có thể bạn muốn agent phản hồi mọi tin nhắn.

    Trong các kênh máy chủ, câu trả lời thông thường mặc định được đăng tự động. Đối với các phòng dùng chung luôn hoạt động, hãy chọn dùng `messages.groupChat.visibleReplies: "message_tool"` để agent có thể âm thầm theo dõi và chỉ đăng khi xác định rằng phản hồi trong kênh là hữu ích. Chế độ này hoạt động tốt nhất với các mô hình thế hệ mới nhất, sử dụng công cụ đáng tin cậy như GPT-5.6 Sol. Các sự kiện phòng nền sẽ giữ im lặng trừ khi công cụ gửi nội dung. Xem [Sự kiện phòng nền](/vi/channels/ambient-room-events) để biết cấu hình đầy đủ cho chế độ âm thầm theo dõi.

    Nếu Discord hiển thị trạng thái đang nhập và nhật ký cho thấy có sử dụng token nhưng không đăng tin nhắn nào, hãy kiểm tra xem lượt đó có được cấu hình làm sự kiện phòng nền hoặc chọn phản hồi hiển thị thông qua công cụ tin nhắn hay không.

    <Tabs>
      <Tab title="Yêu cầu agent">
        > "Cho phép agent của tôi phản hồi trên máy chủ này mà không cần được @đề cập"
      </Tab>
      <Tab title="Cấu hình">
        Đặt `requireMention: false` trong cấu hình máy chủ:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        Để bắt buộc dùng công cụ tin nhắn khi gửi các phản hồi hiển thị trong nhóm/kênh, hãy đặt `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Lập kế hoạch sử dụng bộ nhớ trong các kênh máy chủ">
    Bộ nhớ dài hạn (MEMORY.md) chỉ tự động tải trong các phiên tin nhắn trực tiếp; các kênh máy chủ không tải bộ nhớ này.

    <Tabs>
      <Tab title="Yêu cầu agent">
        > "Khi tôi đặt câu hỏi trong các kênh Discord, hãy dùng memory_search hoặc memory_get nếu cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Đối với ngữ cảnh dùng chung trong mọi kênh, hãy đặt các hướng dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (được chèn vào mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập theo nhu cầu bằng các công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ, hãy tạo các kênh và bắt đầu trò chuyện. Agent thấy tên kênh và mỗi kênh là một phiên biệt lập — hãy thiết lập `#coding`, `#home`, `#research` hoặc bất kỳ cấu trúc nào phù hợp với quy trình làm việc của bạn.

## Mô hình thời gian chạy

- Gateway quản lý kết nối Discord.
- Định tuyến phản hồi mang tính xác định: nội dung gửi đến từ Discord sẽ được phản hồi về Discord.
- Siêu dữ liệu máy chủ/kênh Discord được thêm vào lời nhắc mô hình dưới dạng ngữ cảnh không đáng tin cậy, không phải tiền tố phản hồi hiển thị cho người dùng. Nếu mô hình sao chép lại lớp bao đó, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi các phản hồi gửi đi và khỏi ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), các cuộc trò chuyện trực tiếp dùng chung phiên chính của agent (`agent:main:main`).
- Các kênh máy chủ sử dụng khóa phiên biệt lập (`agent:<agentId>:discord:channel:<channelId>`).
- Tin nhắn trực tiếp nhóm mặc định bị bỏ qua (`channels.discord.dm.groupEnabled=false`).
- Các lệnh gạch chéo gốc chạy trong các phiên lệnh biệt lập (`agent:<agentId>:discord:slash:<userId>`), đồng thời vẫn chuyển `CommandTargetSessionKey` đến phiên hội thoại được định tuyến.
- Nội dung thông báo cron/heartbeat chỉ có văn bản được gửi đến Discord sẽ được thu gọn thành câu trả lời cuối cùng hiển thị cho trợ lý và chỉ gửi một lần. Nội dung đa phương tiện và tải trọng thành phần có cấu trúc vẫn được gửi thành nhiều tin nhắn khi agent phát ra nhiều tải trọng có thể chuyển phát.

## Kênh diễn đàn

Các kênh diễn đàn và phương tiện của Discord chỉ chấp nhận bài đăng trong luồng. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn đến kênh diễn đàn cha (`channel:<forumId>`) để tự động tạo một luồng. Tiêu đề luồng là dòng không trống đầu tiên của tin nhắn (được cắt ngắn theo giới hạn 100 ký tự của Discord đối với tên luồng).
- Sử dụng `openclaw message thread create` để tạo luồng trực tiếp. Không truyền `--message-id` cho các kênh diễn đàn.

Gửi đến kênh diễn đàn cha để tạo luồng:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Tiêu đề chủ đề\nNội dung bài đăng"
```

Tạo luồng diễn đàn một cách tường minh:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Tiêu đề chủ đề" --message "Nội dung bài đăng"
```

Các kênh diễn đàn cha không chấp nhận thành phần Discord. Nếu cần thành phần, hãy gửi đến chính luồng đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ các vùng chứa thành phần v2 của Discord cho tin nhắn từ tác nhân. Sử dụng công cụ tin nhắn với payload `components`. Kết quả tương tác được định tuyến trở lại tác nhân dưới dạng tin nhắn đến thông thường và tuân theo các cài đặt Discord `replyToMode` hiện có.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Các loại lựa chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, các thành phần chỉ được sử dụng một lần. Đặt `components.reusable=true` để cho phép sử dụng nút, menu chọn và biểu mẫu nhiều lần cho đến khi hết hạn.

Để giới hạn người có thể nhấp vào một nút, hãy đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ hoặc `*`). Người dùng không khớp sẽ nhận được thông báo từ chối tạm thời chỉ họ nhìn thấy.

Theo mặc định, callback của thành phần hết hạn sau 30 phút. Đặt `channels.discord.agentComponents.ttlMs` để thay đổi thời gian tồn tại của sổ đăng ký callback cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.agentComponents.ttlMs` cho từng tài khoản. Giá trị tính bằng mili giây, phải là số nguyên dương và bị giới hạn tối đa ở `86400000` (24 giờ). TTL dài hơn phù hợp với các quy trình review/phê duyệt cần duy trì khả năng sử dụng của nút, nhưng cũng kéo dài khoảng thời gian mà một tin nhắn Discord cũ vẫn có thể kích hoạt hành động. Ưu tiên TTL ngắn nhất đáp ứng nhu cầu và giữ nguyên giá trị mặc định nếu callback cũ có thể gây bất ngờ.

Các lệnh gạch chéo `/model` và `/models` mở bộ chọn mô hình tương tác với các danh sách thả xuống cho nhà cung cấp, mô hình và runtime tương thích, cùng một bước Submit. `/models add` đã lỗi thời và trả về thông báo ngừng hỗ trợ thay vì đăng ký mô hình từ cuộc trò chuyện. Phản hồi của bộ chọn là tạm thời, chỉ người dùng đã gọi bộ chọn mới có thể sử dụng. Menu chọn Discord bị giới hạn ở 25 tùy chọn, vì vậy hãy thêm các mục `provider/*` vào `agents.defaults.modelPolicy.allow` khi muốn bộ chọn chỉ hiển thị các mô hình được phát hiện động cho những nhà cung cấp đã chọn như `openai` hoặc `vllm`.

Tệp đính kèm:

- Các khối `file` phải trỏ đến tham chiếu tệp đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); sử dụng `media-gallery` cho nhiều tệp
- Sử dụng `filename` để ghi đè tên tải lên khi tên đó cần khớp với tham chiếu tệp đính kèm

Biểu mẫu hộp thoại:

- Thêm `components.modal` với tối đa 5 trường
- Các loại trường: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw tự động thêm nút kích hoạt

Ví dụ:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Văn bản dự phòng tùy chọn",
  components: {
    reusable: true,
    text: "Chọn một hướng",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Phê duyệt",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Từ chối", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Chọn một tùy chọn",
          options: [
            { label: "Tùy chọn A", value: "a" },
            { label: "Tùy chọn B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Chi tiết",
      triggerLabel: "Mở biểu mẫu",
      fields: [
        { type: "text", label: "Người yêu cầu" },
        {
          type: "select",
          label: "Mức ưu tiên",
          options: [
            { label: "Thấp", value: "low" },
            { label: "Cao", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
    `channels.discord.dmPolicy` kiểm soát quyền truy cập DM. `channels.discord.allowFrom` là danh sách cho phép DM chuẩn.

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một người gửi `allowFrom`)
    - `open` (yêu cầu `channels.discord.allowFrom` bao gồm `"*"`)
    - `disabled`

    Nếu chính sách DM không ở chế độ mở, người dùng không xác định sẽ bị chặn (hoặc được nhắc ghép nối trong chế độ `pairing`).

    Thứ tự ưu tiên khi dùng nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Đối với một tài khoản, `allowFrom` được ưu tiên hơn `dm.allowFrom` cũ.
    - Các tài khoản có tên kế thừa `channels.discord.allowFrom` khi cả `allowFrom` riêng và `dm.allowFrom` cũ của chúng đều chưa được đặt.
    - Các tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để đảm bảo khả năng tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể thực hiện mà không thay đổi quyền truy cập.

    Định dạng đích DM để gửi:

    - `user:<id>`
    - lượt đề cập `<@id>`

    ID chỉ gồm chữ số thường được phân giải thành ID kênh khi có giá trị mặc định cho kênh, nhưng các ID được liệt kê trong `allowFrom` DM hiệu lực của tài khoản được coi là đích DM người dùng để đảm bảo khả năng tương thích.

  </Tab>

  <Tab title="Nhóm truy cập">
    DM Discord và việc cấp quyền cho lệnh văn bản có thể sử dụng các mục `accessGroup:<name>` động trong `channels.discord.allowFrom`.

    Tên nhóm truy cập được dùng chung giữa các kênh tin nhắn. Sử dụng `type: "message.senders"` cho một nhóm tĩnh có thành viên được biểu diễn bằng cú pháp `allowFrom` thông thường của từng kênh, hoặc `type: "discord.channelAudience"` khi đối tượng `ViewChannel` hiện tại của một kênh Discord cần xác định thành viên theo cách động. Hành vi dùng chung của nhóm truy cập: [Nhóm truy cập](/vi/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Kênh văn bản Discord không có danh sách thành viên riêng. `type: "discord.channelAudience"` mô hình hóa tư cách thành viên như sau: người gửi DM là thành viên của máy chủ được cấu hình và hiện có quyền `ViewChannel` hiệu lực trên kênh được cấu hình sau khi áp dụng vai trò và các thiết lập ghi đè của kênh.

    Ví dụ: cho phép bất kỳ ai có thể thấy `#maintainers` gửi DM cho bot, đồng thời giữ DM đóng với tất cả những người khác.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Có thể kết hợp các mục động và tĩnh:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Việc tra cứu sẽ từ chối quyền truy cập khi thất bại. Nếu Discord trả về `Missing Access`, việc tra cứu thành viên thất bại hoặc kênh thuộc một máy chủ khác, người gửi DM sẽ bị coi là không được cấp quyền.

    Bật **Server Members Intent** trong Discord Developer Portal khi sử dụng nhóm truy cập dựa trên đối tượng của kênh. DM không chứa trạng thái thành viên máy chủ, vì vậy OpenClaw phân giải thành viên thông qua Discord REST tại thời điểm cấp quyền.

  </Tab>

  <Tab title="Chính sách máy chủ">
    Việc xử lý máy chủ được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Mức cơ sở bảo mật khi `channels.discord` tồn tại là `allowlist`.

    Hành vi của `allowlist`:

    - máy chủ phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị dùng ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được cho phép khi khớp với `users` HOẶC `roles`
    - tính năng khớp trực tiếp tên/thẻ bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` làm chế độ tương thích khẩn cấp
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi sử dụng mục tên/thẻ
    - nếu một máy chủ đã cấu hình `channels`, các kênh không được liệt kê sẽ bị từ chối
    - nếu một máy chủ không có khối `channels`, tất cả các kênh trong máy chủ thuộc danh sách cho phép đó đều được cho phép

    Ví dụ:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Khóa `allow` cũ theo từng kênh được `openclaw doctor --fix` di chuyển sang `enabled`.

    Nếu chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, giá trị dự phòng của runtime là `groupPolicy="allowlist"` (kèm cảnh báo trong nhật ký), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Lượt đề cập và DM nhóm">
    Theo mặc định, tin nhắn máy chủ yêu cầu đề cập.

    Việc phát hiện lượt đề cập bao gồm:

    - đề cập bot một cách tường minh
    - các mẫu đề cập được cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm cho bot trong các trường hợp được hỗ trợ

    Khi viết tin nhắn Discord gửi đi, hãy sử dụng cú pháp đề cập chuẩn: `<@USER_ID>` cho người dùng, `<#CHANNEL_ID>` cho kênh và `<@&ROLE_ID>` cho vai trò. Không sử dụng dạng đề cập biệt danh `<@!USER_ID>` cũ.

    `requireMention` được cấu hình theo từng máy chủ/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` có thể loại bỏ các tin nhắn đề cập người dùng/vai trò khác nhưng không đề cập bot (không bao gồm @everyone/@here).

    DM nhóm:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến tác nhân dựa trên vai trò

Sử dụng `bindings[].match.roles` để định tuyến thành viên máy chủ Discord đến các tác nhân khác nhau theo ID vai trò. Các liên kết dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau các liên kết ngang hàng hoặc ngang hàng cha, nhưng trước các liên kết chỉ dành cho máy chủ. Nếu một liên kết cũng đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả các trường đã cấu hình đều phải khớp.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Lệnh gốc và xác thực lệnh

- `commands.native` mặc định là `"auto"` và được bật cho Discord.
- Ghi đè theo từng kênh: `channels.discord.commands.native`.
- `commands.native=false` bỏ qua việc đăng ký và dọn dẹp lệnh gạch chéo Discord khi khởi động. Các lệnh đã đăng ký trước đó có thể vẫn hiển thị trong Discord cho đến khi bạn xóa chúng khỏi ứng dụng Discord.
- Xác thực lệnh gốc sử dụng cùng danh sách cho phép/chính sách Discord như khi xử lý tin nhắn thông thường.
- Các lệnh vẫn có thể hiển thị trong giao diện Discord đối với người dùng không được cấp quyền; khi thực thi, OpenClaw sẽ áp dụng xác thực và trả lời "không được cấp quyền".
- Cài đặt lệnh gạch chéo mặc định: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Xem [Lệnh gạch chéo](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Thẻ trả lời và câu trả lời gốc">
    Discord hỗ trợ thẻ trả lời trong đầu ra của agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được kiểm soát bởi `channels.discord.replyToMode`:

    - `off` (mặc định): không ngầm tạo luồng trả lời; các thẻ `[[reply_to_*]]` tường minh vẫn được tuân theo
    - `first`: đính kèm tham chiếu trả lời gốc ngầm định vào tin nhắn Discord gửi đi đầu tiên của lượt
    - `all`: đính kèm tham chiếu đó vào mọi tin nhắn gửi đi
    - `batched`: chỉ đính kèm tham chiếu đó khi sự kiện đến là một lô nhiều tin nhắn đã được chống dội — hữu ích khi bạn chủ yếu muốn dùng câu trả lời gốc cho các cuộc trò chuyện dồn dập, khó phân biệt, thay vì mọi lượt chỉ có một tin nhắn

    ID tin nhắn được đưa vào ngữ cảnh/lịch sử để agent có thể nhắm đến các tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Bản xem trước liên kết">
    Theo mặc định, Discord tạo nội dung nhúng liên kết phong phú cho URL. Theo mặc định, OpenClaw chặn các nội dung nhúng được tạo đó trên tin nhắn Discord gửi đi, vì vậy URL do agent gửi vẫn là liên kết thuần túy trừ khi bạn chủ động bật:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Đặt `channels.discord.accounts.<id>.suppressEmbeds` để ghi đè cho một tài khoản. Các lần gửi bằng công cụ nhắn tin của agent cũng có thể truyền `suppressEmbeds: false` cho một tin nhắn duy nhất. Payload Discord `embeds` tường minh không bị chặn bởi cài đặt xem trước liên kết mặc định.

  </Accordion>

  <Accordion title="Bản xem trước luồng trực tiếp">
    OpenClaw có thể truyền trực tiếp bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa tin nhắn đó khi văn bản đến. `channels.discord.streaming.mode` nhận `off` | `partial` | `block` | `progress` (mặc định khi không đặt khóa `streaming`/khóa cũ `streamMode`). `streamMode` là bí danh cũ; chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu thành cấu trúc `streaming` lồng nhau chính tắc.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: false,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` tắt các chỉnh sửa bản xem trước Discord.
    - `partial` chỉnh sửa một tin nhắn xem trước duy nhất khi token đến.
    - `block` phát ra các đoạn có kích thước bản nháp; điều chỉnh kích thước và điểm ngắt bằng `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), được giới hạn ở `textChunkLimit`. Khi truyền trực tiếp theo khối được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh truyền trực tiếp hai lần.
    - `progress` duy trì một bản nháp trạng thái có thể chỉnh sửa cho đến khi phân phối bản cuối. Theo mặc định, bản nháp hiển thị một dòng lời mở đầu hoặc lời tường thuật mới nhất của agent, không có nhãn được tạo, khoảng cách hoặc hàng công cụ.
    - Nội dung đa phương tiện, lỗi và bản cuối trả lời tường minh sẽ hủy các chỉnh sửa bản xem trước đang chờ.
    - `streaming.preview.toolProgress` mặc định là `true` trong chế độ `partial`/`block`. Chế độ tiến trình Discord mặc định không có hàng công cụ; đặt `streaming.progress.toolProgress: true` để chủ động bật.
    - Đặt `streaming.progress.toolProgress: true` để thêm các hàng công cụ/tiến trình nhỏ gọn như `🛠️ Bash: run tests` hoặc `🔎 Web Search: for "query"`. Để tương thích, cấu hình `progress.label` hoặc `progress.labels` hiện có vẫn giữ giá trị mặc định trước đây của hàng công cụ; đặt `toolProgress: false` để dùng nhãn tùy chỉnh mà không có hàng.
    - `streaming.progress.commentary` (mặc định `false`) chủ động đưa lời bình luận thô của trợ lý vào bản nháp tiến trình tạm thời. Dòng trạng thái lời mở đầu/lời tường thuật mặc định độc lập với tùy chọn này. Lời bình luận được làm sạch trước khi hiển thị, chỉ tồn tại tạm thời và không thay đổi việc phân phối câu trả lời cuối cùng.
    - `streaming.progress.maxLineChars` kiểm soát dung lượng bản xem trước tiến trình trên mỗi dòng. Văn xuôi được rút gọn tại ranh giới từ; chi tiết lệnh và đường dẫn giữ lại các hậu tố hữu ích.
    - `streaming.preview.commandText` / `streaming.progress.commandText` kiểm soát chi tiết lệnh/thực thi trong các dòng tiến trình nhỏ gọn: `raw` (mặc định) hoặc `status` (chỉ nhãn công cụ).

    Ẩn văn bản lệnh/thực thi thô trong khi vẫn giữ các dòng tiến trình nhỏ gọn:

    ```json
    {
      "channels": {
        "discord": {
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

    Truyền trực tiếp bản xem trước chỉ hỗ trợ văn bản; câu trả lời đa phương tiện sẽ quay về cơ chế phân phối thông thường.

  </Accordion>

  <Accordion title="Lịch sử, ngữ cảnh và hành vi luồng">
    Ngữ cảnh lịch sử máy chủ:

    - `channels.discord.historyLimit` mặc định `20`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Điều khiển lịch sử tin nhắn trực tiếp:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi luồng:

    - Các luồng Discord được định tuyến dưới dạng phiên kênh và kế thừa cấu hình kênh cha trừ khi bị ghi đè.
    - Các phiên luồng kế thừa lựa chọn `/model` ở cấp phiên của kênh cha làm phương án dự phòng chỉ dành cho mô hình; các lựa chọn `/model` cục bộ của luồng được ưu tiên, và lịch sử bản ghi của kênh cha không được sao chép trừ khi bật kế thừa bản ghi.
    - `channels.discord.thread.inheritParent` (mặc định `false`) cho phép các luồng tự động mới khởi tạo từ bản ghi của kênh cha. Ghi đè theo từng tài khoản: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng của công cụ nhắn tin có thể phân giải các đích tin nhắn trực tiếp `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong quá trình dự phòng kích hoạt giai đoạn trả lời.

    Chủ đề kênh được đưa vào dưới dạng ngữ cảnh **không đáng tin cậy**. Danh sách cho phép giới hạn người có thể kích hoạt agent, chứ không phải là ranh giới che giấu ngữ cảnh bổ sung toàn diện.

  </Accordion>

  <Accordion title="Phiên gắn với luồng cho agent con">
    Discord có thể liên kết một luồng với đích phiên để các tin nhắn tiếp theo trong luồng đó tiếp tục được định tuyến đến cùng một phiên (bao gồm cả phiên agent con).

    Lệnh:

    - `/focus <target>` liên kết luồng hiện tại/mới với đích agent con/phiên
    - `/unfocus` xóa liên kết luồng hiện tại
    - `/agents` hiển thị các lượt chạy đang hoạt động và trạng thái liên kết
    - `/session idle <duration|off>` kiểm tra/cập nhật thời gian không hoạt động trước khi tự động bỏ lấy nét đối với các liên kết đang được lấy nét
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa tuyệt đối đối với các liên kết đang được lấy nét

    Cấu hình:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Ghi chú:

    - `session.threadBindings.*` đặt giá trị mặc định toàn cục; `channels.discord.threadBindings.*` ghi đè hành vi Discord.
    - `spawnSessions` kiểm soát việc tự động tạo/liên kết luồng cho `sessions_spawn({ thread: true })` và các lần tạo luồng ACP. Mặc định: `true`.
    - `defaultSpawnContext` kiểm soát ngữ cảnh agent con gốc cho các lần tạo gắn với luồng. Mặc định: `"fork"`.
    - Các khóa `spawnSubagentSessions`/`spawnAcpSessions` không còn được khuyến nghị sẽ được di chuyển bởi `openclaw doctor --fix`.
    - Nếu liên kết luồng bị tắt cho một tài khoản, `/focus` và các thao tác liên kết luồng liên quan sẽ không khả dụng.

    Xem [Agent con](/vi/tools/subagents), [Agent ACP](/vi/tools/acp-agents) và [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Tiến trình agent con trên tin nhắn nguồn">
    Đặt `channels.discord.subagentProgress: true` để hiển thị hoạt động của tiến trình con chạy nền trên tin nhắn Discord đã bắt đầu lượt chạy cha.

```json5
{
  channels: {
    discord: {
      subagentProgress: true,
    },
  },
}
```

    Trong khi các lượt chạy con đang hoạt động, OpenClaw duy trì trạng thái đang nhập của Discord trong tối đa một giờ và thay thế một phản ứng đếm (`1️⃣` đến `🔟`) khi số lượng đồng thời thay đổi; `🔟` cũng đại diện cho 10 trở lên. Phản ứng đếm được xóa sau khi tiến trình con cuối cùng kết thúc. Một tiến trình con thất bại, hết thời gian hoặc bị kết thúc sẽ để lại phản ứng `🔴`.

    Tính năng này yêu cầu chủ động bật và sử dụng thời gian cùng emoji mặc định cố định nội bộ. Bot cần quyền **Add Reactions** để cung cấp phản hồi bằng phản ứng. `channels.discord.accounts.<id>.subagentProgress` ở cấp tài khoản ghi đè giá trị cấp cao nhất.

  </Accordion>

  <Accordion title="Liên kết kênh ACP bền vững">
    Đối với không gian làm việc ACP "luôn bật" ổn định, hãy cấu hình các liên kết ACP có kiểu ở cấp cao nhất nhắm đến các cuộc trò chuyện Discord.

    Đường dẫn cấu hình: `bindings[]` với `type: "acp"` và `match.channel: "discord"`.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Ghi chú:

    - `/acp spawn codex --bind here` liên kết tại chỗ kênh hoặc luồng hiện tại và duy trì các tin nhắn sau này trên cùng một phiên ACP. Tin nhắn trong luồng kế thừa liên kết của kênh cha.
    - Trong kênh hoặc luồng đã liên kết, `/new` và `/reset` đặt lại tại chỗ cùng một phiên ACP. Các liên kết luồng tạm thời có thể ghi đè việc phân giải đích trong khi đang hoạt động.
    - `spawnSessions` kiểm soát việc tạo/liên kết luồng con thông qua `--thread auto|here`.

    Xem [Agent ACP](/vi/tools/acp-agents) để biết chi tiết về hành vi liên kết.

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Chế độ thông báo phản ứng theo từng máy chủ (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (sử dụng `guilds.<id>.users`)

    Các sự kiện phản ứng được chuyển thành sự kiện hệ thống và đính kèm vào phiên Discord được định tuyến.

  </Accordion>

  <Accordion title="Sự kiện trạng thái trực tuyến">
    Cho phép một máy chủ đánh thức agent được định tuyến khi một thành viên là con người chuyển từ ngoại tuyến sang trực tuyến:

    ```json5
    {
      channels: {
        discord: {
          intents: { presence: true },
          guilds: {
            "111111111111111111": {
              presenceEvents: {
                channelId: "222222222222222222",
                users: ["333333333333333333"], // tùy chọn; thu hẹp thêm những người xem kênh
                reconnectSuppressSeconds: 300, // tùy chọn; khoảng thời gian im lặng của phiên mới (0 sẽ vô hiệu hóa)
                burstLimit: 8, // tùy chọn; số sự kiện tối đa trong mỗi cửa sổ bùng phát
                burstWindowSeconds: 60, // tùy chọn; cửa sổ trượt phát hiện bùng phát
              },
            },
          },
        },
      },
    }
    ```

    `presenceEvents` yêu cầu Heartbeat được bật cho agent được định tuyến và **Presence Intent** đặc quyền trên trang Bot của ứng dụng trong Discord Developer Portal. OpenClaw khởi tạo danh sách thành viên hiện đang trực tuyến từ mỗi ảnh chụp nhanh `GUILD_CREATE` hoàn chỉnh, định tuyến các chuyển đổi từ ngoại tuyến sang trực tuyến quan sát được, đồng thời cũng coi tín hiệu trực tuyến đầu tiên xuất hiện sau đó của một thành viên chưa từng thấy là mới khả dụng. Thành viên đó có thể đã trực tuyến hoặc tham gia sau thời điểm chụp nhanh, vì vậy sự kiện không khẳng định chính xác trạng thái trước đó. Chỉ những người dùng là con người có thể xem `channelId` mới đủ điều kiện: kênh và luồng công khai yêu cầu **View Channel** trên kênh hoặc kênh cha, còn luồng riêng tư yêu cầu thêm tư cách thành viên hoặc **Manage Threads**. `users` có thể thu hẹp thêm đối tượng đó. OpenClaw bỏ qua bot và các trạng thái trực tuyến không thay đổi, đồng thời duy trì thời gian chờ tám giờ cho mỗi người dùng qua các lần khởi động lại Gateway. Khi Discord thiết lập một phiên Gateway mới và gửi `READY`, OpenClaw chặn các sự kiện phát sinh từ trạng thái hiện diện trong `reconnectSuppressSeconds` (mặc định 300, `0` sẽ vô hiệu hóa) trong khi trạng thái hiện diện của máy chủ được xây dựng lại, để các thành viên được quan sát lại không thể lần lượt đánh thức agent. Ngoài ra, hệ thống giới hạn tốc độ các sự kiện được đưa vào hàng đợi thành công trên mỗi máy chủ ở mức `burstLimit` sự kiện (mặc định 8) trong mỗi cửa sổ trượt `burstWindowSeconds` (mặc định 60), đồng thời chỉ ghi nhật ký một lần cho mỗi đợt chặn của từng máy chủ. Phiên được tiếp tục không được coi là phiên mới. Discord giới hạn ảnh chụp nhanh đối với các máy chủ có trên 75,000 thành viên; tại đó, OpenClaw yêu cầu một bản cập nhật ngoại tuyến rõ ràng trước khi chào hỏi. Sự kiện hệ thống chứa ID bất biến của người dùng, máy chủ và kênh mà không nhúng tên hiển thị có thể thay đổi. Agent quyết định có chào hỏi hay không và chào hỏi như thế nào.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw xử lý tin nhắn đến.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - emoji nhận diện agent dự phòng (`agents.list[].identity.emoji`, nếu không thì "👀")

    Lưu ý:

    - Discord chấp nhận emoji unicode hoặc tên emoji tùy chỉnh.
    - Dùng `""` để vô hiệu hóa phản ứng cho một kênh hoặc tài khoản.

    **Phạm vi (`messages.ackReactionScope`):**

    Giá trị: `"all"` (tin nhắn trực tiếp + nhóm, bao gồm các sự kiện phòng nền), `"direct"` (chỉ tin nhắn trực tiếp), `"group-all"` (mọi tin nhắn nhóm ngoại trừ sự kiện phòng nền, không có tin nhắn trực tiếp), `"group-mentions"` (nhóm khi bot được nhắc đến; **không có tin nhắn trực tiếp**, mặc định), `"off"` / `"none"` (đã vô hiệu hóa).

    <Note>
    Phạm vi mặc định (`"group-mentions"`) không kích hoạt phản ứng xác nhận trong tin nhắn trực tiếp hoặc sự kiện phòng nền. Để nhận phản ứng xác nhận đối với tin nhắn trực tiếp Discord đến và các sự kiện phòng yên lặng, hãy đặt `messages.ackReactionScope` thành `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Ghi cấu hình">
    Tính năng ghi cấu hình do kênh khởi tạo được bật theo mặc định. Điều này ảnh hưởng đến các luồng `/config set|unset` (khi tính năng lệnh được bật).

    Vô hiệu hóa:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy Gateway">
    Định tuyến lưu lượng WebSocket của Gateway Discord và các truy vấn REST khi khởi động (ID ứng dụng + phân giải danh sách cho phép) qua proxy HTTP(S) bằng `channels.discord.proxy`.
    Việc dùng proxy cho WebSocket của Gateway Discord phải được cấu hình rõ ràng; các kết nối WebSocket không kế thừa biến môi trường proxy xung quanh từ tiến trình Gateway. Các truy vấn REST khi khởi động sử dụng proxy này khi `channels.discord.proxy` được cấu hình.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Ghi đè theo tài khoản:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Hỗ trợ PluralKit">
    Bật phân giải PluralKit để ánh xạ tin nhắn được ủy quyền sang danh tính thành viên hệ thống:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // tùy chọn; cần thiết cho các hệ thống riêng tư
      },
    },
  },
}
```

    Lưu ý:

    - danh sách cho phép có thể dùng `pk:<memberId>`
    - tên hiển thị của thành viên chỉ được khớp theo tên/slug khi `channels.discord.dangerouslyAllowNameMatching: true`
    - các truy vấn tra cứu gọi API PluralKit bằng ID tin nhắn gốc
    - nếu tra cứu thất bại, tin nhắn được ủy quyền sẽ được coi là tin nhắn bot và bị loại bỏ, trừ khi `allowBots` cho phép chúng đi qua

  </Accordion>

  <Accordion title="Bí danh lượt nhắc gửi đi">
    Dùng `mentionAliases` khi agent cần lượt nhắc gửi đi có tính xác định dành cho người dùng Discord đã biết. Khóa là tên định danh không có `@` ở đầu; giá trị là ID người dùng Discord. Các tên định danh không xác định, `@everyone`, `@here` và lượt nhắc bên trong các đoạn mã Markdown được giữ nguyên.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Cấu hình trạng thái hiện diện">
    Các bản cập nhật trạng thái hiện diện được áp dụng khi bạn đặt trường trạng thái hoặc hoạt động, hoặc khi bật trạng thái hiện diện tự động.

    Chỉ trạng thái:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Hoạt động (trạng thái tùy chỉnh là loại hoạt động mặc định khi `activity` được đặt):

```json5
{
  channels: {
    discord: {
      activity: "Thời gian tập trung",
      activityType: 4,
    },
  },
}
```

    Phát trực tiếp:

```json5
{
  channels: {
    discord: {
      activity: "Lập trình trực tiếp",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Ánh xạ loại hoạt động:

    - 0: Đang chơi
    - 1: Đang phát trực tiếp (yêu cầu `activityUrl`; đến lượt `activityUrl` yêu cầu `activityType: 1`)
    - 2: Đang nghe
    - 3: Đang xem
    - 4: Tùy chỉnh (dùng văn bản hoạt động làm trạng thái; emoji là tùy chọn)
    - 5: Đang thi đấu

    Trạng thái hiện diện tự động (tín hiệu tình trạng thời gian chạy):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "đã cạn token",
      },
    },
  },
}
```

    Trạng thái hiện diện tự động ánh xạ tính khả dụng của thời gian chạy sang trạng thái Discord: khỏe mạnh => trực tuyến, suy giảm hoặc không xác định => không hoạt động, cạn kiệt hoặc không khả dụng => không làm phiền. Giá trị mặc định: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (phải nhỏ hơn hoặc bằng `intervalMs`). Các giá trị ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ phần giữ chỗ `{reason}`)

  </Accordion>

  <Accordion title="Phê duyệt trong Discord">
    Discord hỗ trợ xử lý phê duyệt bằng nút trong tin nhắn trực tiếp và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh khởi nguồn.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt thực thi gốc khi `enabled` chưa được đặt hoặc là `"auto"`, và có thể phân giải ít nhất một người phê duyệt từ `execApprovals.approvers` hoặc `commands.ownerAllowFrom`. Discord không suy luận người phê duyệt thực thi từ `allowFrom` của kênh, `dm.allowFrom` cũ hoặc `defaultTo` của tin nhắn trực tiếp. Đặt `enabled: false` để vô hiệu hóa rõ ràng Discord với vai trò ứng dụng phê duyệt gốc.

    Đối với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi riêng tư lời nhắc phê duyệt và kết quả cuối cùng. Trước tiên, hệ thống thử tin nhắn trực tiếp Discord khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không, hệ thống quay về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ những người phê duyệt đã được phân giải mới có thể dùng các nút; người dùng khác nhận thông báo từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật gửi qua kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw quay về gửi qua tin nhắn trực tiếp.

    Discord hiển thị các nút phê duyệt dùng chung với các kênh trò chuyện khác; bộ điều hợp Discord gốc chủ yếu bổ sung định tuyến tin nhắn trực tiếp cho người phê duyệt và phân phối đến nhiều kênh. Khi các nút đó xuất hiện, chúng là trải nghiệm phê duyệt chính; OpenClaw chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là con đường duy nhất. Nếu thời gian chạy phê duyệt gốc của Discord không hoạt động, OpenClaw giữ lời nhắc `/approve <id> <decision>` xác định cục bộ ở trạng thái hiển thị. Nếu thời gian chạy đang hoạt động nhưng không thể gửi thẻ gốc đến bất kỳ đích nào, OpenClaw gửi thông báo dự phòng trong cùng cuộc trò chuyện kèm lệnh `/approve` chính xác từ yêu cầu phê duyệt đang chờ.

    Việc xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng ứng dụng Gateway dùng chung (ID `plugin:` được phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Theo mặc định, phê duyệt hết hạn sau 30 phút.

    Xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Công cụ và cổng hành động

Các hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, kiểm duyệt, trạng thái hiện diện và siêu dữ liệu.

Ví dụ cốt lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- kiểm duyệt: `timeout`, `kick`, `ban`
- trạng thái hiện diện: `setPresence`

Hành động `event-create` chấp nhận tham số `image` tùy chọn (URL hoặc đường dẫn tệp cục bộ) để đặt ảnh bìa cho sự kiện đã lên lịch.

Các cổng hành động nằm dưới `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                            | Mặc định    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | đã bật      |
| roles                                                                                                                                                                    | đã tắt      |
| moderation                                                                                                                                                               | đã tắt      |
| presence                                                                                                                                                                 | đã tắt      |

## Giao diện thành phần v2

OpenClaw sử dụng các thành phần Discord v2 cho việc phê duyệt thực thi và các dấu mốc xuyên ngữ cảnh. Các hành động tin nhắn Discord cũng có thể chấp nhận `components` cho giao diện tùy chỉnh (nâng cao; yêu cầu tạo payload thành phần thông qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn được các vùng chứa thành phần Discord sử dụng (hex). Theo từng tài khoản: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` kiểm soát khoảng thời gian các callback của thành phần Discord đã gửi tiếp tục được đăng ký (mặc định `1800000`, tối đa `86400000`). Theo từng tài khoản: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` bị bỏ qua khi có các thành phần v2.
- Theo mặc định, bản xem trước URL thuần túy bị ẩn. Đặt `suppressEmbeds: false` trên một hành động tin nhắn khi cần mở rộng một liên kết đi duy nhất.

Ví dụ:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Thoại

Discord có hai bề mặt thoại riêng biệt: **kênh thoại** theo thời gian thực (các cuộc trò chuyện liên tục) và **tệp đính kèm tin nhắn thoại** (định dạng xem trước dạng sóng). Gateway hỗ trợ cả hai.

### Kênh thoại

Danh sách kiểm tra thiết lập:

1. Bật Message Content Intent trong Discord Developer Portal.
2. Bật Server Members Intent khi sử dụng danh sách cho phép theo vai trò/người dùng.
3. Mời bot với các phạm vi `bot` và `applications.commands`.
4. Cấp quyền Connect, Speak, Send Messages và Read Message History trong kênh thoại đích.
5. Bật các lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Sử dụng `/vc join|leave|status` để kiểm soát các phiên. Lệnh này sử dụng agent mặc định của tài khoản và tuân theo cùng các quy tắc về danh sách cho phép và chính sách nhóm như các lệnh Discord khác.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Để kiểm tra các quyền có hiệu lực của bot trước khi tham gia:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Ví dụ tự động tham gia:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Ghi chú:

- Tính năng thoại Discord là tùy chọn bật đối với cấu hình chỉ có văn bản; đặt `channels.discord.voice.enabled=true` (hoặc giữ nguyên khối `channels.discord.voice` hiện có) để bật các lệnh `/vc`, runtime thoại và gateway intent `GuildVoiceStates`. `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng việc đăng ký intent; để nguyên không đặt để tuân theo trạng thái bật thoại có hiệu lực.
- `voice.mode` kiểm soát luồng hội thoại. Mặc định là `agent-proxy`: một giao diện thoại thời gian thực xử lý thời điểm lượt nói, việc ngắt lời và phát lại, ủy quyền công việc thực chất cho tác tử OpenClaw được định tuyến thông qua `openclaw_agent_consult`, đồng thời xử lý kết quả như một lời nhắc Discord được người nói đó nhập bằng văn bản. `stt-tts` giữ nguyên luồng STT theo lô cộng với TTS cũ hơn. `bidi` cho phép mô hình thời gian thực hội thoại trực tiếp trong khi cung cấp `openclaw_agent_consult` cho bộ não OpenClaw.
- `voice.agentSession` kiểm soát hội thoại OpenClaw nào nhận các lượt thoại. Để nguyên không đặt để dùng phiên riêng của kênh thoại, hoặc đặt `{ mode: "target", target: "channel:<text-channel-id>" }` để kênh thoại hoạt động như phần mở rộng micrô/loa của một phiên kênh văn bản Discord hiện có, chẳng hạn như `#maintainers`.
- `voice.model` ghi đè bộ não tác tử OpenClaw cho các phản hồi thoại Discord và các lần tham vấn thời gian thực. Để nguyên không đặt để kế thừa mô hình tác tử được định tuyến. Thiết lập này tách biệt với `voice.realtime.model`.
- `voice.followUsers` cho phép bot tham gia, di chuyển và rời khỏi thoại Discord cùng những người dùng đã chọn. Xem [Theo người dùng trong thoại](#follow-users-in-voice).
- `agent-proxy` định tuyến lời nói qua `discord-voice`, qua đó giữ nguyên việc ủy quyền chủ sở hữu/công cụ thông thường cho người nói và phiên đích nhưng ẩn công cụ `tts` của tác tử vì thoại Discord sở hữu việc phát lại. Theo mặc định, `agent-proxy` cấp cho lượt tham vấn quyền truy cập công cụ đầy đủ tương đương chủ sở hữu đối với người nói là chủ sở hữu (`voice.realtime.toolPolicy: "owner"`) và đặc biệt ưu tiên tham vấn tác tử OpenClaw trước khi đưa ra câu trả lời thực chất (`voice.realtime.consultPolicy: "always"`). Trong chế độ `always` mặc định đó, lớp thời gian thực không tự động phát lời lấp chỗ trước câu trả lời tham vấn; lớp này thu và phiên âm lời nói, sau đó phát câu trả lời OpenClaw được định tuyến. Nếu nhiều câu trả lời tham vấn bắt buộc hoàn tất trong khi Discord vẫn đang phát câu trả lời đầu tiên, các câu trả lời lời nói chính xác đến sau sẽ được xếp hàng đợi cho đến khi quá trình phát ở trạng thái rảnh thay vì thay thế lời nói giữa câu.
- Trong chế độ `stt-tts`, STT sử dụng `tools.media.audio`; `voice.model` không ảnh hưởng đến việc phiên âm.
- Trong các chế độ thời gian thực, `voice.realtime.provider`, `voice.realtime.model` và `voice.realtime.speakerVoice` cấu hình phiên âm thanh thời gian thực. Đối với OpenAI Realtime 2.1 cùng bộ não Codex, hãy sử dụng `voice.realtime.model: "gpt-realtime-2.1"` và `voice.model: "openai/gpt-5.6-sol"`.
- Theo mặc định, các chế độ thoại thời gian thực đưa những tệp hồ sơ nhỏ `IDENTITY.md`, `USER.md` và `SOUL.md` vào chỉ dẫn của nhà cung cấp thời gian thực để các lượt trực tiếp nhanh giữ nguyên danh tính, nền tảng thông tin về người dùng và tính cách như tác tử OpenClaw được định tuyến. Đặt `voice.realtime.bootstrapContextFiles` thành một tập con để tùy chỉnh điều này, hoặc `[]` để tắt. Chỉ những tệp hồ sơ đó được hỗ trợ; `AGENTS.md` vẫn nằm trong ngữ cảnh tác tử thông thường. Ngữ cảnh hồ sơ được chèn không thay thế `openclaw_agent_consult` cho công việc trong không gian làm việc, dữ kiện hiện tại, tra cứu bộ nhớ hoặc các hành động dựa trên công cụ.
- Trong chế độ thời gian thực `agent-proxy` của OpenAI, cơ chế kiểm soát bằng tên đánh thức mặc định thích ứng với phòng: một người có thể trò chuyện tự nhiên mà không cần tên đánh thức, trong khi hai người trở lên phải bắt đầu hoặc kết thúc một lượt bằng tên đánh thức. Các bot khác không được tính là người. Đặt `voice.realtime.requireWakeName: true` để luôn yêu cầu tên đánh thức hoặc `false` để không bao giờ yêu cầu. Tên đánh thức được cấu hình phải gồm một hoặc hai từ. Nếu `voice.realtime.wakeNames` không được đặt, OpenClaw sử dụng `name` của tác tử được định tuyến cộng với `OpenClaw`, và dự phòng bằng id tác tử cộng với `OpenClaw`. Cổng tên đánh thức đang hoạt động sẽ tắt tính năng tự động phản hồi của nhà cung cấp thời gian thực, định tuyến các lượt được chấp nhận qua đường dẫn tham vấn tác tử OpenClaw và phát một lời xác nhận ngắn khi tên đánh thức đứng đầu được nhận dạng từ bản phiên âm một phần trước khi bản phiên âm cuối cùng đến. Chính sách này tuân theo các lượt tham gia và rời đi trực tiếp mà không cần kết nối lại thoại.
- Nhà cung cấp thời gian thực OpenAI chấp nhận tên sự kiện Realtime 2 hiện tại và các bí danh cũ tương thích với Codex cho sự kiện âm thanh đầu ra và bản phiên âm, nhờ đó các ảnh chụp nhanh tương thích của nhà cung cấp có thể thay đổi mà không làm mất âm thanh của trợ lý.
- `voice.realtime.bargeIn` kiểm soát việc các sự kiện bắt đầu nói của người nói trên Discord có ngắt quá trình phát thời gian thực đang hoạt động hay không. Nếu không được đặt, thiết lập này tuân theo cài đặt ngắt âm thanh đầu vào của nhà cung cấp thời gian thực.
- `voice.realtime.minBargeInAudioEndMs` kiểm soát thời lượng phát tối thiểu của trợ lý trước khi một lần chen lời thời gian thực của OpenAI cắt ngắn âm thanh. Mặc định: `250`. Đặt `0` để ngắt ngay lập tức trong các phòng ít tiếng vọng, hoặc tăng giá trị này cho các thiết lập loa có nhiều tiếng vọng.
- `voice.tts` chỉ ghi đè `messages.tts` cho việc phát thoại `stt-tts`; các chế độ thời gian thực sử dụng `voice.realtime.speakerVoice` thay thế. Đối với giọng OpenAI khi phát trên Discord, hãy đặt `voice.tts.provider: "openai"` và chọn một giọng chuyển văn bản thành lời nói trong `voice.tts.providers.openai.speakerVoice`. `cedar` là một lựa chọn có âm sắc nam tính phù hợp trên mô hình TTS OpenAI hiện tại.
- Các ghi đè `systemPrompt` Discord theo từng kênh áp dụng cho các lượt bản phiên âm thoại của kênh thoại đó.
- Khi OpenClaw tham gia một kênh thoại, phiên tác tử được định tuyến nhận một sự kiện hệ thống im lặng chứa danh sách người tham gia hiện tại. Các lượt người tham gia vào và rời đi sau đó cập nhật phiên đó mà không kích hoạt phản hồi bằng lời nói ngoài yêu cầu; tên hiển thị Discord được coi là nhãn không đáng tin cậy. Các lượt thoại được ủy quyền cũng nhận một ảnh chụp nhanh mới của danh sách người tham gia.
- Các lượt bản phiên âm thoại và lệnh `/vc` sử dụng các mục Discord trong `commands.ownerAllowFrom` để xác định trạng thái chủ sở hữu. Khi không cấu hình chủ sở hữu lệnh Discord, `allowFrom` (hoặc `dm.allowFrom` cũ) của tài khoản Discord đã chọn vẫn có thể cấp quyền truy cập thoại mà không cấp trạng thái chủ sở hữu. Khả năng hiển thị công cụ tác tử tuân theo chính sách công cụ đã cấu hình cho phiên được định tuyến.
- Nếu `voice.autoJoin` có nhiều mục cho cùng một máy chủ, OpenClaw sẽ tham gia kênh được cấu hình cuối cùng cho máy chủ đó.
- `voice.allowedChannels` là một danh sách cho phép hiện diện tùy chọn. Để nguyên không đặt nhằm cho phép `/vc join` vào bất kỳ kênh thoại Discord được ủy quyền nào. Khi được đặt, `/vc join`, việc tự động tham gia khi khởi động và các lần di chuyển trạng thái thoại của bot bị giới hạn ở các mục `{ guildId, channelId }` được liệt kê. Đặt thành một mảng rỗng để từ chối mọi lượt tham gia thoại Discord. Nếu Discord di chuyển bot ra ngoài danh sách cho phép, OpenClaw sẽ rời kênh đó và tham gia lại đích tự động tham gia đã cấu hình khi có đích khả dụng.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được truyền trực tiếp đến các tùy chọn tham gia `@discordjs/voice`; giá trị mặc định ở thượng nguồn là `daveEncryption=true` và `decryptionFailureTolerance=24`.
- OpenClaw sử dụng codec `libopus-wasm` đi kèm để nhận thoại Discord và phát PCM thô theo thời gian thực. Codec này đi kèm một bản dựng WebAssembly libopus được ghim phiên bản và không yêu cầu tiện ích bổ sung opus gốc.
- `voice.connectTimeoutMs` kiểm soát thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần thử tự động tham gia. Mặc định: `30000`.
- `voice.reconnectGraceMs` kiểm soát khoảng thời gian OpenClaw chờ một phiên thoại bị ngắt kết nối bắt đầu kết nối lại trước khi hủy phiên đó. Mặc định: `15000`.
- Trong chế độ `stt-tts`, quá trình phát thoại không dừng chỉ vì người dùng khác bắt đầu nói. Để tránh vòng lặp phản hồi âm thanh, OpenClaw bỏ qua việc thu thoại mới trong khi TTS đang phát; hãy nói sau khi quá trình phát hoàn tất để bắt đầu lượt tiếp theo. Các chế độ thời gian thực chuyển tiếp thời điểm người nói bắt đầu dưới dạng tín hiệu chen lời đến nhà cung cấp thời gian thực.
- Trong các chế độ thời gian thực, tiếng vọng từ loa vào micrô đang mở có thể trông giống như một lần chen lời và làm gián đoạn quá trình phát. Đối với các phòng Discord có nhiều tiếng vọng, hãy đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` để ngăn OpenAI tự động ngắt khi có âm thanh đầu vào. Thêm `voice.realtime.bargeIn: true` nếu bạn vẫn muốn các sự kiện bắt đầu nói của Discord ngắt quá trình phát đang hoạt động. Cầu nối thời gian thực OpenAI bỏ qua các lần cắt ngắn phát lại ngắn hơn `voice.realtime.minBargeInAudioEndMs` vì có khả năng là tiếng vọng/tiếng ồn, đồng thời ghi chúng là đã bỏ qua thay vì xóa quá trình phát Discord.
- `voice.captureSilenceGraceMs` kiểm soát khoảng thời gian OpenClaw chờ sau khi Discord báo cáo rằng người nói đã dừng trước khi hoàn tất đoạn âm thanh đó cho STT. Mặc định: `2000`; hãy tăng giá trị này nếu Discord chia các khoảng dừng thông thường thành những bản phiên âm một phần rời rạc.
- Khi ElevenLabs là nhà cung cấp TTS được chọn, tính năng phát thoại Discord sử dụng TTS truyền phát và bắt đầu từ luồng phản hồi của nhà cung cấp. Các nhà cung cấp không hỗ trợ truyền phát sẽ dự phòng về đường dẫn tệp tạm đã tổng hợp.
- OpenClaw theo dõi các lỗi giải mã khi nhận và tự động khôi phục bằng cách rời rồi tham gia lại kênh thoại sau khi xảy ra nhiều lỗi trong một khoảng thời gian ngắn.
- Nếu nhật ký nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và nhật ký. Dòng `@discordjs/voice` đi kèm bao gồm bản sửa lỗi phần đệm ở thượng nguồn từ PR discord.js #11449, bản sửa đã đóng issue discord.js #11419.
- Các sự kiện nhận `The operation was aborted` là bình thường khi OpenClaw hoàn tất một đoạn âm thanh người nói đã thu; đây là thông tin chẩn đoán chi tiết, không phải cảnh báo.
- Nhật ký thoại Discord chi tiết bao gồm bản xem trước một dòng có giới hạn của bản phiên âm STT cho từng đoạn người nói được chấp nhận, nhờ đó quá trình gỡ lỗi hiển thị cả phía người dùng và phía phản hồi của tác tử mà không kết xuất văn bản phiên âm không giới hạn.
- Trong chế độ `agent-proxy`, phương án dự phòng tham vấn bắt buộc bỏ qua các đoạn bản phiên âm có khả năng chưa hoàn chỉnh, chẳng hạn như văn bản kết thúc bằng `...` hoặc một từ nối ở cuối như "và", cũng như các câu kết thúc rõ ràng không thể hành động như "quay lại ngay" hoặc "tạm biệt". Nhật ký hiển thị `forced agent consult skipped reason=...` khi điều này ngăn một câu trả lời cũ trong hàng đợi.

### Theo người dùng trong thoại

Sử dụng `voice.followUsers` khi bạn muốn bot thoại Discord ở cùng một hoặc nhiều người dùng Discord đã biết thay vì tham gia một kênh cố định khi khởi động hoặc chờ `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Hành vi:

- `followUsers` chấp nhận ID người dùng Discord thô và các giá trị `discord:<id>`. OpenClaw chuẩn hóa cả hai dạng trước khi đối chiếu các sự kiện trạng thái thoại.
- `followUsersEnabled` mặc định là `true` khi `followUsers` được cấu hình. Đặt thành `false` để giữ danh sách đã lưu nhưng dừng tự động đi theo người dùng trong kênh thoại.
- `followUsers` chỉ kiểm soát việc duy trì hiện diện trong kênh thoại. Nó không cấp quyền phát biểu hoặc thẩm quyền chủ sở hữu; hãy cấu hình riêng `commands.ownerAllowFrom` cùng người dùng và vai trò của máy chủ hoặc kênh.
- Khi người dùng được theo dõi tham gia một kênh thoại được phép, OpenClaw sẽ tham gia kênh đó. Khi người dùng chuyển kênh, OpenClaw sẽ chuyển theo. Khi người dùng được theo dõi đang hoạt động ngắt kết nối, OpenClaw sẽ rời đi.
- Nếu nhiều người dùng được theo dõi ở trong cùng một máy chủ và người dùng được theo dõi đang hoạt động rời đi, OpenClaw sẽ chuyển sang kênh của một người dùng được theo dõi khác đang được giám sát trước khi rời máy chủ. Nếu nhiều người dùng được theo dõi chuyển kênh cùng lúc, sự kiện trạng thái thoại được quan sát gần nhất sẽ được ưu tiên.
- `allowedChannels` vẫn được áp dụng. Người dùng được theo dõi trong một kênh không được phép sẽ bị bỏ qua, và phiên do tính năng theo dõi sở hữu sẽ chuyển sang một người dùng được theo dõi khác hoặc rời đi.
- OpenClaw đối soát các sự kiện trạng thái thoại bị bỏ lỡ khi khởi động và theo khoảng thời gian có giới hạn. Quá trình đối soát lấy mẫu các máy chủ đã cấu hình và giới hạn số lượt tra cứu REST trong mỗi lần chạy, vì vậy các danh sách `followUsers` rất lớn có thể cần nhiều hơn một khoảng thời gian để hội tụ.
- Nếu Discord hoặc quản trị viên di chuyển bot trong khi bot đang theo dõi một người dùng, OpenClaw sẽ tái tạo phiên thoại và giữ nguyên quyền sở hữu của tính năng theo dõi khi đích đến được phép. Nếu bot bị di chuyển ra ngoài `allowedChannels`, OpenClaw sẽ rời đi và tham gia lại đích đã cấu hình khi có đích đó.
- Quá trình khôi phục nhận DAVE có thể rời rồi tham gia lại cùng một kênh sau nhiều lần giải mã thất bại. Các phiên do tính năng theo dõi sở hữu vẫn giữ quyền sở hữu đó trong suốt quy trình khôi phục, vì vậy nếu người dùng được theo dõi ngắt kết nối sau đó thì phiên vẫn sẽ rời kênh.

Chọn một trong các chế độ tham gia:

- Sử dụng `followUsers` cho thiết lập cá nhân hoặc dành cho người vận hành, trong đó bot cần tự động có mặt trong kênh thoại khi bạn có mặt.
- Sử dụng `autoJoin` cho bot trong phòng cố định cần hiện diện ngay cả khi không có người dùng được giám sát nào trong kênh thoại.
- Sử dụng `/vc join` cho các lần tham gia riêng lẻ hoặc các phòng mà việc tự động hiện diện trong kênh thoại có thể gây bất ngờ.

Bộ codec thoại Discord:

- Nhật ký nhận thoại hiển thị `discord voice: opus decoder: libopus-wasm`.
- Tính năng phát theo thời gian thực mã hóa PCM stereo thô 48 kHz thành Opus bằng cùng gói `libopus-wasm` đi kèm trước khi chuyển các gói tin cho `@discordjs/voice`.
- Tính năng phát tệp và luồng từ nhà cung cấp chuyển mã thành PCM stereo thô 48 kHz bằng ffmpeg, sau đó sử dụng `libopus-wasm` cho luồng gói tin Opus được gửi tới Discord.

Pipeline STT kết hợp TTS:

- Dữ liệu PCM thu từ Discord được chuyển đổi thành tệp WAV tạm thời.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản chép lời được gửi qua luồng tiếp nhận và định tuyến của Discord trong khi LLM phản hồi chạy với chính sách đầu ra thoại ẩn công cụ `tts` của tác nhân và yêu cầu trả về văn bản, vì thoại Discord chịu trách nhiệm phát TTS cuối cùng.
- `voice.model`, khi được đặt, chỉ ghi đè LLM phản hồi cho lượt trong kênh thoại này.
- `voice.tts` được hợp nhất đè lên `messages.tts`; các nhà cung cấp hỗ trợ phát trực tuyến cấp dữ liệu trực tiếp cho trình phát, nếu không thì tệp âm thanh kết quả sẽ được phát trong kênh đã tham gia.

Ví dụ về phiên kênh thoại proxy tác nhân mặc định:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Khi không có khối `voice.agentSession`, mỗi kênh thoại sẽ có một phiên OpenClaw được định tuyến riêng. Ví dụ, `/vc join channel:234567890123456789` giao tiếp với phiên dành cho kênh thoại Discord đó. Mô hình thời gian thực chỉ là giao diện thoại phía trước; các yêu cầu thực chất được chuyển cho tác nhân OpenClaw đã cấu hình. Nếu mô hình thời gian thực tạo ra bản chép lời cuối cùng mà không gọi công cụ tham vấn, OpenClaw sẽ buộc thực hiện tham vấn như một phương án dự phòng để chế độ mặc định vẫn hoạt động như đang trò chuyện với tác nhân.

Ví dụ STT kết hợp TTS cũ:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Ví dụ bidi theo thời gian thực:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Thoại như một phần mở rộng của phiên kênh Discord hiện có:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Trong chế độ `agent-proxy`, bot tham gia kênh thoại đã cấu hình, nhưng các lượt tác nhân OpenClaw sử dụng tác nhân và phiên được định tuyến thông thường của kênh đích. Phiên thoại thời gian thực phát lại kết quả được trả về trong kênh thoại. Tác nhân giám sát vẫn có thể sử dụng các công cụ nhắn tin thông thường theo chính sách công cụ của mình, bao gồm gửi một tin nhắn Discord riêng nếu đó là hành động phù hợp.

Trong khi một lượt chạy OpenClaw được ủy quyền đang hoạt động, các bản chép lời thoại Discord mới được xử lý như lệnh điều khiển lượt chạy trực tiếp trước khi bắt đầu một lượt tác nhân khác. Các cụm từ như "trạng thái", "hủy việc đó", "dùng bản sửa nhỏ hơn" hoặc "khi hoàn tất cũng kiểm tra các bài kiểm thử" được phân loại thành dữ liệu đầu vào về trạng thái, hủy, điều hướng hoặc việc tiếp theo cho phiên đang hoạt động. Các kết quả về trạng thái, hủy, điều hướng được chấp nhận và việc tiếp theo được phát lại trong kênh thoại để người gọi biết OpenClaw có xử lý yêu cầu hay không.

Các dạng đích hữu ích:

- `target: "channel:123456789012345678"` định tuyến qua một phiên kênh văn bản Discord.
- `target: "123456789012345678"` được xử lý như một đích kênh.
- `target: "dm:123456789012345678"` hoặc `target: "user:123456789012345678"` định tuyến qua phiên tin nhắn trực tiếp đó.

Ví dụ OpenAI Realtime trong môi trường có nhiều tiếng vọng:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Sử dụng cấu hình này khi mô hình nghe thấy âm thanh Discord do chính nó phát qua micrô đang mở nhưng bạn vẫn muốn ngắt lời bằng cách nói. OpenClaw ngăn OpenAI tự động ngắt lời khi có âm thanh đầu vào thô, trong khi `bargeIn: true` cho phép các sự kiện bắt đầu phát biểu của người nói trên Discord và âm thanh của người nói đang hoạt động hủy các phản hồi thời gian thực đang chạy trước khi lượt thu tiếp theo đến OpenAI. Các tín hiệu ngắt lời quá sớm có `audioEndMs` thấp hơn `minBargeInAudioEndMs` được coi là tiếng vọng hoặc nhiễu có khả năng cao và bị bỏ qua để mô hình không bị ngắt ngay tại khung phát đầu tiên.

Nhật ký thoại dự kiến:

- Khi tham gia: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Khi bắt đầu thời gian thực: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Khi có âm thanh của người nói: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` và `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Khi bỏ qua lời nói cũ: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` hoặc `reason=non-actionable-closing ...`
- Khi hoàn tất phản hồi thời gian thực: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Khi dừng/đặt lại phát: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Khi tham vấn thời gian thực: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Khi tác nhân trả lời: `discord voice: agent turn answer ...`
- Khi xếp hàng lời nói chính xác: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, tiếp theo là `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Khi phát hiện ngắt lời: `discord voice: realtime barge-in detected source=speaker-start ...` hoặc `discord voice: realtime barge-in detected source=active-speaker-audio ...`, tiếp theo là `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Khi ngắt phản hồi thời gian thực: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, tiếp theo là `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` hoặc `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Khi bỏ qua tiếng vọng/nhiễu: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Khi tính năng ngắt lời bị tắt: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Khi phát ở trạng thái nhàn rỗi: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Để gỡ lỗi âm thanh bị cắt, hãy đọc nhật ký thoại thời gian thực dưới dạng dòng thời gian:

1. `realtime audio playback started` có nghĩa là Discord đã bắt đầu phát âm thanh của trợ lý. Từ thời điểm này, cầu nối bắt đầu đếm các đoạn đầu ra của trợ lý, số byte PCM Discord, số byte thời gian thực của nhà cung cấp và thời lượng âm thanh tổng hợp.
2. `realtime speaker turn opened` đánh dấu một người nói trên Discord bắt đầu hoạt động. Nếu quá trình phát đã hoạt động và `bargeIn` được bật, sau đó có thể xuất hiện `barge-in detected source=speaker-start`.
3. `realtime input audio started` đánh dấu khung âm thanh thực tế đầu tiên nhận được cho lượt nói đó. `outputActive=true` hoặc giá trị `outputAudioMs` khác 0 tại đây có nghĩa là micrô đang gửi dữ liệu đầu vào trong khi quá trình phát của trợ lý vẫn hoạt động.
4. `barge-in detected source=active-speaker-audio` có nghĩa là OpenClaw phát hiện âm thanh trực tiếp của người nói trong khi quá trình phát của trợ lý đang hoạt động. Điều này hữu ích để phân biệt một lần ngắt lời thực sự với một sự kiện bắt đầu phát biểu của người nói trên Discord nhưng không có âm thanh hữu ích.
5. `barge-in requested reason=...` có nghĩa là OpenClaw đã yêu cầu nhà cung cấp thời gian thực hủy hoặc cắt ngắn phản hồi đang hoạt động. Nó bao gồm `outputAudioMs`, `outputActive` và `playbackChunks` để bạn có thể biết lượng âm thanh của trợ lý đã thực sự được phát trước khi bị ngắt.
6. `realtime audio playback stopped reason=...` là điểm đặt lại cục bộ cho quá trình phát Discord. Lý do cho biết bên nào đã dừng quá trình phát: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` hoặc `session-close`.
7. `realtime speaker turn closed` tóm tắt lượt đầu vào đã thu. `chunks=0` hoặc `hasAudio=false` có nghĩa là lượt nói đã mở nhưng không có âm thanh khả dụng nào đến được cầu nối thời gian thực. `interruptedPlayback=true` có nghĩa là lượt đầu vào đó trùng với đầu ra của trợ lý và kích hoạt logic ngắt lời.

Các trường hữu ích:

- `outputAudioMs`: thời lượng âm thanh của trợ lý do nhà cung cấp thời gian thực tạo ra trước dòng nhật ký này.
- `audioMs`: thời lượng âm thanh của trợ lý mà OpenClaw đã đếm trước khi quá trình phát dừng.
- `elapsedMs`: thời gian theo đồng hồ thực giữa lúc mở và đóng luồng phát hoặc lượt nói.
- `discordBytes`: số byte PCM stereo 48 kHz được gửi tới hoặc nhận từ thoại Discord.
- `realtimeBytes`: số byte PCM theo định dạng của nhà cung cấp được gửi tới hoặc nhận từ nhà cung cấp thời gian thực.
- `playbackChunks`: số đoạn âm thanh của trợ lý được chuyển tiếp tới Discord cho phản hồi đang hoạt động.
- `sinceLastAudioMs`: khoảng thời gian giữa khung âm thanh cuối cùng thu được từ người nói và lúc đóng lượt nói.

Các mẫu thường gặp:

- Việc bị ngắt ngay lập tức với `source=active-speaker-audio`, `outputAudioMs` nhỏ và cùng người dùng ở gần thường cho thấy tiếng vọng từ loa lọt vào micrô. Tăng `voice.realtime.minBargeInAudioEndMs`, giảm âm lượng loa, dùng tai nghe hoặc đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` rồi đến `speaker turn closed ... hasAudio=false` có nghĩa là Discord đã báo người dùng bắt đầu nói nhưng không có âm thanh nào truyền đến OpenClaw. Nguyên nhân có thể là một sự kiện thoại Discord tạm thời, hoạt động của cổng nhiễu hoặc ứng dụng khách kích hoạt micrô trong chốc lát.
- `audio playback stopped reason=stream-close` mà không có thao tác ngắt lời hoặc `provider-clear-audio` ở gần đó có nghĩa là luồng phát lại Discord cục bộ đã kết thúc ngoài dự kiến. Kiểm tra các nhật ký trước đó của nhà cung cấp và trình phát Discord.
- `capture ignored during playback (barge-in disabled)` có nghĩa là OpenClaw đã chủ động loại bỏ đầu vào trong khi âm thanh của trợ lý đang phát. Bật `voice.realtime.bargeIn` nếu bạn muốn lời nói làm gián đoạn quá trình phát lại.
- `barge-in ignored ... outputActive=false` có nghĩa là Discord hoặc VAD của nhà cung cấp đã báo có giọng nói, nhưng OpenClaw không có lượt phát lại nào đang hoạt động để ngắt. Điều này không được làm âm thanh bị ngắt.

Thông tin xác thực được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, xác thực TTS cho `messages.tts`/`voice.tts` và xác thực nhà cung cấp thời gian thực cho `voice.realtime.providers` hoặc cấu hình xác thực thông thường của nhà cung cấp.

### Tin nhắn thoại

Tin nhắn thoại Discord hiển thị bản xem trước dạng sóng và yêu cầu âm thanh OGG/Opus. OpenClaw tự động tạo dạng sóng nhưng cần `ffmpeg` và `ffprobe` trên máy chủ Gateway để kiểm tra và chuyển đổi.

- Cung cấp **đường dẫn tệp cục bộ** (URL sẽ bị từ chối).
- Bỏ qua nội dung văn bản (Discord từ chối văn bản và tin nhắn thoại trong cùng một payload).
- Mọi định dạng âm thanh đều được chấp nhận; OpenClaw sẽ chuyển đổi sang OGG/Opus khi cần.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Đã dùng intent không được phép hoặc bot không thấy tin nhắn máy chủ">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào việc phân giải người dùng/thành viên
    - khởi động lại Gateway sau khi thay đổi intent

  </Accordion>

  <Accordion title="Tin nhắn máy chủ bị chặn ngoài dự kiến">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép của máy chủ trong `channels.discord.guilds`
    - nếu có ánh xạ `channels` của máy chủ, chỉ các kênh được liệt kê mới được phép
    - xác minh hoạt động của `requireMention` và các mẫu đề cập

    Các bước kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Không yêu cầu đề cập nhưng vẫn bị chặn">
    Các nguyên nhân thường gặp:

    - `groupPolicy="allowlist"` không có danh sách cho phép máy chủ/kênh tương ứng
    - `requireMention` được cấu hình sai vị trí (phải nằm trong `channels.discord.guilds` hoặc một mục kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của máy chủ/kênh

  </Accordion>

  <Accordion title="Lượt Discord chạy lâu hoặc phản hồi trùng lặp">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Các tham số hàng đợi Gateway Discord:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - tham số này chỉ kiểm soát công việc của trình lắng nghe Gateway Discord, không kiểm soát thời gian tồn tại của lượt tác tử

    Discord không áp dụng thời gian chờ do kênh sở hữu cho các lượt tác tử trong hàng đợi. Trình lắng nghe tin nhắn bàn giao ngay lập tức và các lượt chạy Discord trong hàng đợi duy trì thứ tự theo phiên cho đến khi vòng đời của phiên/công cụ/runtime hoàn tất hoặc hủy công việc.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Cảnh báo hết thời gian tra cứu siêu dữ liệu Gateway">
    OpenClaw tải siêu dữ liệu `/gateway/bot` của Discord trước khi kết nối. Khi xảy ra lỗi tạm thời, hệ thống dùng URL Gateway mặc định của Discord làm phương án dự phòng và giới hạn tần suất ghi nhật ký.

    Các tham số thời gian chờ siêu dữ liệu:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - giá trị dự phòng từ môi trường khi chưa đặt cấu hình: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Khởi động lại do hết thời gian chờ READY của Gateway">
    OpenClaw chờ sự kiện `READY` của Gateway Discord trong khi khởi động và sau khi runtime kết nối lại. Các thiết lập nhiều tài khoản có khởi động lệch thời điểm có thể cần khoảng chờ READY lúc khởi động dài hơn giá trị mặc định.

    Các tham số thời gian chờ READY:

    - một tài khoản lúc khởi động: `channels.discord.gatewayReadyTimeoutMs`
    - nhiều tài khoản lúc khởi động: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - giá trị dự phòng từ môi trường lúc khởi động khi chưa đặt cấu hình: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - mặc định lúc khởi động: `15000` (15 giây), tối đa: `120000`
    - một tài khoản lúc runtime: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - nhiều tài khoản lúc runtime: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - giá trị dự phòng từ môi trường lúc runtime khi chưa đặt cấu hình: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - mặc định lúc runtime: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Kết quả kiểm tra quyền không khớp">
    Việc kiểm tra quyền `channels status --probe` chỉ hoạt động với ID kênh dạng số.

    Nếu dùng khóa slug, việc đối chiếu lúc runtime vẫn có thể hoạt động, nhưng phép dò không thể xác minh đầy đủ các quyền.

  </Accordion>

  <Accordion title="Sự cố DM và ghép nối">

    - DM bị tắt: `channels.discord.dm.enabled=false`
    - chính sách DM bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép nối trong chế độ `pairing`

  </Accordion>

  <Accordion title="Vòng lặp giữa các bot">
    Theo mặc định, các tin nhắn do bot tạo sẽ bị bỏ qua.

    Nếu đặt `channels.discord.allowBots=true`, hãy dùng các quy tắc đề cập và danh sách cho phép nghiêm ngặt để tránh hành vi lặp.
    Nên dùng `channels.discord.allowBots="mentions"` để chỉ chấp nhận các tin nhắn bot có đề cập đến bot.

    OpenClaw cũng cung cấp tính năng dùng chung [bảo vệ khỏi vòng lặp bot](/vi/channels/bot-loop-protection). Bất cứ khi nào `allowBots` cho phép tin nhắn do bot tạo đi đến bước điều phối, Discord ánh xạ sự kiện đầu vào thành các dữ kiện `(account, channel, bot pair)` và bộ bảo vệ cặp chung sẽ chặn cặp đó sau khi vượt quá ngân sách sự kiện đã cấu hình. Bộ bảo vệ ngăn các vòng lặp mất kiểm soát giữa hai bot mà trước đây phải dựa vào giới hạn tốc độ của Discord để dừng lại; tính năng này không ảnh hưởng đến các triển khai một bot hoặc phản hồi bot một lần nằm trong ngân sách.

    Cài đặt mặc định (hoạt động khi đặt `allowBots`):

    - `maxEventsPerWindow: 20` -- cặp bot có thể trao đổi 20 tin nhắn trong cửa sổ trượt
    - `windowSeconds: 60` -- độ dài cửa sổ trượt
    - `cooldownSeconds: 60` -- sau khi vượt ngân sách, mọi tin nhắn bổ sung giữa hai bot theo cả hai chiều sẽ bị loại bỏ trong một phút

    Cấu hình giá trị mặc định dùng chung một lần trong `channels.defaults.botLoopProtection`, sau đó ghi đè cho Discord khi một quy trình làm việc hợp lệ cần dư địa lớn hơn. Thứ tự ưu tiên là:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - các giá trị mặc định tích hợp sẵn

    Discord dùng các khóa chung `maxEventsPerWindow`, `windowSeconds` và `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Ghi đè tùy chọn cho toàn bộ Discord. Các khối tài khoản ghi đè từng
      // trường và kế thừa các trường bị bỏ qua từ đây.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha chỉ lắng nghe các bot khác khi chúng đề cập đến nó.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo lắng nghe mọi tin nhắn Discord do bot tạo.
          allowBots: true,
          mentionAliases: {
            // Cho phép Bravo viết lời đề cập Discord đến Alpha bằng ID người dùng đã cấu hình.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Cho phép tối đa năm tin nhắn mỗi phút trước khi chặn cặp bot.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="STT thoại bị mất dữ liệu với DecryptionFailed(...)">

    - duy trì OpenClaw ở phiên bản hiện tại (`openclaw update`) để có logic khôi phục nhận thoại Discord
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu với `channels.discord.voice.decryptionFailureTolerance=24` (mặc định thượng nguồn) và chỉ tinh chỉnh nếu cần
    - theo dõi nhật ký để tìm:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi vẫn tiếp diễn sau khi tự động tham gia lại, hãy thu thập nhật ký và so sánh với lịch sử nhận DAVE thượng nguồn trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) và [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Discord](/vi/gateway/config-channels#discord).

<Accordion title="Các trường Discord quan trọng nhất">

- khởi động/xác thực: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- chính sách: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- lệnh: `commands.native`, `commands.useAccessGroups` (toàn cục), `configWrites`, `slashCommand.ephemeral`
- hàng đợi sự kiện: `eventQueue.listenerTimeout` (ngân sách trình lắng nghe, mặc định `120000`), `eventQueue.maxQueueSize` (mặc định `10000`), `eventQueue.maxConcurrency` (mặc định `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- phản hồi/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- phân phối: `textChunkLimit` (mặc định `2000`), `maxLinesPerMessage` (mặc định `17`)
- truyền phát: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (các khóa phẳng cũ `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` được `openclaw doctor --fix` di chuyển vào `streaming.*`)
- phương tiện/thử lại: `mediaMaxMb` (giới hạn nội dung tải lên Discord gửi đi, mặc định `100`), `retry`
- hành động: `actions.*`
- trạng thái hiện diện: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- giao diện người dùng: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `activities`, `heartbeat`, `responsePrefix`

</Accordion>

### Discord Activities

Đặt `channels.discord.activities` để cho phép tác tử đăng các tiện ích HTML độc lập có thể mở bên trong Discord. Khối này là tùy chọn tham gia; khi không có, OpenClaw không đăng ký tuyến Activity, công cụ hoặc trình xử lý tương tác nào. Xem [Discord Activities](/channels/discord-activities) để biết cách thiết lập Developer Portal, đường hầm, bảo mật và khắc phục sự cố.

- `activities.clientSecret`: bí mật ứng dụng khách OAuth2 cho ứng dụng Discord; dùng `DISCORD_CLIENT_SECRET` làm giá trị dự phòng
- `activities.applicationId`: ID ứng dụng Activity tùy chọn; mặc định là ID ứng dụng bot được xác định khi Gateway khởi động

## An toàn và vận hành

- Hãy coi token bot là thông tin bí mật (`DISCORD_BOT_TOKEN` được ưu tiên trong các môi trường có giám sát).
- Cấp các quyền Discord theo nguyên tắc đặc quyền tối thiểu.
- Nếu trạng thái/việc triển khai lệnh đã lỗi thời, hãy khởi động lại Gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Hoạt động Discord" icon="window" href="/channels/discord-activities">
    Khởi chạy các tiện ích HTML tương tác bên trong Discord.
  </Card>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Discord với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi của trò chuyện nhóm và danh sách cho phép.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến cho các tác tử.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Định tuyến đa tác tử" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ máy chủ và kênh với các tác tử.
  </Card>
  <Card title="Lệnh dấu gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi của lệnh gốc.
  </Card>
</CardGroup>
