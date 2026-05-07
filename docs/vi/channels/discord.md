---
read_when:
    - Đang phát triển các tính năng kênh Discord
summary: Trạng thái hỗ trợ chương trình tự động Discord, khả năng và cấu hình
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

Sẵn sàng cho DM và kênh guild thông qua Gateway Discord chính thức.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    DM Discord mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và luồng sửa chữa.
  </Card>
</CardGroup>

## Thiết lập nhanh

Bạn cần tạo một ứng dụng mới có bot, thêm bot vào máy chủ của bạn và ghép nối bot với OpenClaw. Chúng tôi khuyên bạn nên thêm bot vào máy chủ riêng của chính bạn. Nếu bạn chưa có máy chủ, hãy [tạo một máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Tạo của riêng tôi > Cho tôi và bạn bè của tôi**).

<Steps>
  <Step title="Create a Discord application and bot">
    Vào [Discord Developer Portal](https://discord.com/developers/applications) và bấm **Ứng dụng mới**. Đặt tên kiểu như "OpenClaw".

    Bấm **Bot** trên thanh bên. Đặt **Tên người dùng** thành tên bạn muốn gọi tác nhân OpenClaw của mình.

  </Step>

  <Step title="Enable privileged intents">
    Vẫn trên trang **Bot**, cuộn xuống **Privileged Gateway Intents** và bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; bắt buộc cho danh sách cho phép theo vai trò và khớp tên với ID)
    - **Presence Intent** (tùy chọn; chỉ cần cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Copy your bot token">
    Cuộn ngược lên trên trang **Bot** và bấm **Reset Token**.

    <Note>
    Dù tên là vậy, thao tác này tạo token đầu tiên của bạn — không có gì đang bị "đặt lại".
    </Note>

    Sao chép token và lưu ở đâu đó. Đây là **Bot Token** của bạn và bạn sẽ cần nó ngay sau đây.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Bấm **OAuth2** trên thanh bên. Bạn sẽ tạo URL mời với các quyền phù hợp để thêm bot vào máy chủ của mình.

    Cuộn xuống **OAuth2 URL Generator** và bật:

    - `bot`
    - `applications.commands`

    Phần **Bot Permissions** sẽ xuất hiện bên dưới. Bật ít nhất:

    **Quyền chung**
      - Xem kênh
    **Quyền văn bản**
      - Gửi tin nhắn
      - Đọc lịch sử tin nhắn
      - Nhúng liên kết
      - Đính kèm tệp
      - Thêm phản ứng (tùy chọn)

    Đây là bộ cơ sở cho các kênh văn bản thông thường. Nếu bạn định đăng trong các luồng Discord, bao gồm quy trình kênh diễn đàn hoặc kênh media tạo hoặc tiếp tục một luồng, hãy bật thêm **Gửi tin nhắn trong luồng**.
    Sao chép URL được tạo ở cuối trang, dán vào trình duyệt của bạn, chọn máy chủ của bạn và bấm **Tiếp tục** để kết nối. Bây giờ bạn sẽ thấy bot của mình trong máy chủ Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Quay lại ứng dụng Discord, bạn cần bật Chế độ nhà phát triển để có thể sao chép ID nội bộ.

    1. Bấm **Cài đặt người dùng** (biểu tượng bánh răng cạnh ảnh đại diện của bạn) → **Nâng cao** → bật **Chế độ nhà phát triển**
    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trong thanh bên → **Sao chép ID máy chủ**
    3. Nhấp chuột phải vào **ảnh đại diện của chính bạn** → **Sao chép ID người dùng**

    Lưu **Server ID** và **User ID** cùng với Bot Token của bạn — bạn sẽ gửi cả ba cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Allow DMs from server members">
    Để ghép nối hoạt động, Discord cần cho phép bot nhắn DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn → **Cài đặt quyền riêng tư** → bật **Tin nhắn trực tiếp**.

    Điều này cho phép thành viên máy chủ (bao gồm bot) gửi DM cho bạn. Giữ tùy chọn này bật nếu bạn muốn dùng DM Discord với OpenClaw. Nếu bạn chỉ định dùng kênh guild, bạn có thể tắt DM sau khi ghép nối.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Token bot Discord của bạn là bí mật (như mật khẩu). Thiết lập nó trên máy đang chạy OpenClaw trước khi nhắn tin cho tác nhân của bạn.

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

    Nếu OpenClaw đã chạy dưới dạng dịch vụ nền, hãy khởi động lại qua ứng dụng OpenClaw Mac hoặc bằng cách dừng và khởi động lại tiến trình `openclaw gateway run`.
    Với cài đặt dịch vụ được quản lý, chạy `openclaw gateway install` từ shell có `DISCORD_BOT_TOKEN`, hoặc lưu biến trong `~/.openclaw/.env`, để dịch vụ có thể phân giải env SecretRef sau khi khởi động lại.
    Nếu máy chủ của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/client Discord từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó. Dùng `channels.discord.applicationId` cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.applicationId` khi bạn chạy nhiều bot Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Trò chuyện với tác nhân OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ Telegram) và nói cho nó biết. Nếu Discord là kênh đầu tiên của bạn, hãy dùng tab CLI / cấu hình thay thế.

        > "Tôi đã đặt token bot Discord trong cấu hình. Vui lòng hoàn tất thiết lập Discord với User ID `<user_id>` và Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Nếu bạn thích cấu hình dựa trên tệp, hãy đặt:

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

        Dự phòng env cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Với thiết lập bằng script hoặc từ xa, ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run` rồi chạy lại không có `--dry-run`. Giá trị `token` dạng văn bản thuần được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các provider env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Với nhiều bot Discord, giữ từng token bot và ID ứng dụng trong tài khoản của bot đó. `channels.discord.applicationId` cấp cao nhất được các tài khoản kế thừa, vì vậy chỉ đặt nó ở đó khi mọi tài khoản nên dùng cùng ID ứng dụng.

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

  <Step title="Approve first DM pairing">
    Chờ đến khi Gateway đang chạy, rồi nhắn DM cho bot của bạn trong Discord. Bot sẽ phản hồi bằng mã ghép nối.

    <Tabs>
      <Tab title="Ask your agent">
        Gửi mã ghép nối cho tác nhân của bạn trên kênh hiện có:

        > "Phê duyệt mã ghép nối Discord này: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Mã ghép nối hết hạn sau 1 giờ.

    Bây giờ bạn có thể trò chuyện với tác nhân của mình trong Discord qua DM.

  </Step>
</Steps>

<Note>
Phân giải token có nhận biết tài khoản. Giá trị token trong cấu hình thắng dự phòng env. `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord đã bật phân giải về cùng một token bot, OpenClaw chỉ khởi động một trình giám sát Gateway cho token đó. Token có nguồn từ cấu hình thắng dự phòng env mặc định; nếu không, tài khoản đã bật đầu tiên thắng và tài khoản trùng lặp được báo cáo là đã tắt.
Với các lệnh gọi đi nâng cao (công cụ tin nhắn/hành động kênh), `token` tường minh theo từng lệnh gọi được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và đọc/thăm dò (ví dụ read/search/fetch/thread/pins/permissions). Chính sách tài khoản/cài đặt thử lại vẫn đến từ tài khoản đã chọn trong ảnh chụp nhanh runtime đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập không gian làm việc guild

Sau khi DM hoạt động, bạn có thể thiết lập máy chủ Discord của mình làm không gian làm việc đầy đủ, nơi mỗi kênh có phiên tác nhân riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho máy chủ riêng chỉ có bạn và bot của bạn.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Điều này cho phép tác nhân của bạn phản hồi trong bất kỳ kênh nào trên máy chủ của bạn, không chỉ DM.

    <Tabs>
      <Tab title="Ask your agent">
        > "Thêm Discord Server ID `<server_id>` của tôi vào danh sách cho phép guild"
      </Tab>
      <Tab title="Config">

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

  <Step title="Allow responses without @mention">
    Theo mặc định, tác nhân của bạn chỉ phản hồi trong kênh guild khi được @nhắc đến. Với máy chủ riêng, có thể bạn muốn tác nhân phản hồi mọi tin nhắn.

    Trong kênh guild, các phản hồi cuối bình thường của trợ lý mặc định vẫn ở chế độ riêng tư. Đầu ra Discord hiển thị phải được gửi rõ ràng bằng công cụ `message`, để tác nhân có thể mặc định quan sát âm thầm và chỉ đăng khi nó quyết định phản hồi trong kênh là hữu ích.

    Điều này nghĩa là mô hình được chọn phải gọi công cụ đáng tin cậy. Nếu Discord hiển thị trạng thái đang nhập và nhật ký hiển thị mức dùng token nhưng không có tin nhắn nào được đăng, hãy kiểm tra nhật ký phiên để tìm văn bản trợ lý có `didSendViaMessagingTool: false`. Điều đó nghĩa là mô hình đã tạo câu trả lời cuối riêng tư thay vì gọi `message(action=send)`. Chuyển sang mô hình gọi công cụ mạnh hơn, hoặc dùng cấu hình bên dưới để khôi phục phản hồi cuối tự động kiểu cũ.

    <Tabs>
      <Tab title="Ask your agent">
        > "Cho phép tác nhân của tôi phản hồi trên máy chủ này mà không cần được @nhắc đến"
      </Tab>
      <Tab title="Config">
        Đặt `requireMention: false` trong cấu hình guild của bạn:

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

        Để khôi phục phản hồi cuối tự động kiểu cũ cho phòng nhóm/kênh, đặt `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    Theo mặc định, bộ nhớ dài hạn (MEMORY.md) chỉ tải trong phiên DM. Kênh guild không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Ask your agent">
        > "Khi tôi hỏi câu hỏi trong kênh Discord, hãy dùng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Nếu bạn cần ngữ cảnh dùng chung trong mọi kênh, hãy đặt các hướng dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được chèn vào mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập chúng khi cần bằng công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo một số kênh trên máy chủ Discord của bạn và bắt đầu trò chuyện. Tác nhân của bạn có thể thấy tên kênh, và mỗi kênh có phiên cô lập riêng — vì vậy bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất cứ thứ gì phù hợp với quy trình làm việc của bạn.

## Mô hình runtime

- Gateway sở hữu kết nối Discord.
- Định tuyến trả lời có tính xác định: các phản hồi đến từ Discord sẽ trả lại Discord.
- Siêu dữ liệu guild/channel của Discord được thêm vào lời nhắc mô hình dưới dạng ngữ cảnh không đáng tin cậy, không phải là tiền tố trả lời hiển thị với người dùng. Nếu mô hình sao chép phong bì đó trở lại, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi các phản hồi gửi đi và khỏi ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), các cuộc trò chuyện trực tiếp chia sẻ phiên chính của agent (`agent:main:main`).
- Các kênh guild là các khóa phiên được cô lập (`agent:<agentId>:discord:channel:<channelId>`).
- DM nhóm bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Các lệnh slash gốc chạy trong các phiên lệnh được cô lập (`agent:<agentId>:discord:slash:<userId>`), trong khi vẫn mang `CommandTargetSessionKey` tới phiên hội thoại đã định tuyến.
- Việc gửi thông báo cron/heartbeat chỉ văn bản tới Discord dùng câu trả lời cuối cùng hiển thị với assistant một lần. Payload phương tiện và thành phần có cấu trúc vẫn là nhiều tin nhắn khi agent phát ra nhiều payload có thể gửi.

## Kênh diễn đàn

Kênh diễn đàn và kênh phương tiện của Discord chỉ chấp nhận bài đăng luồng. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn tới diễn đàn cha (`channel:<forumId>`) để tự động tạo một luồng. Tiêu đề luồng dùng dòng không rỗng đầu tiên trong tin nhắn của bạn.
- Dùng `openclaw message thread create` để tạo trực tiếp một luồng. Không truyền `--message-id` cho kênh diễn đàn.

Ví dụ: gửi tới diễn đàn cha để tạo một luồng

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ví dụ: tạo một luồng diễn đàn một cách tường minh

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Diễn đàn cha không chấp nhận thành phần Discord. Nếu bạn cần thành phần, hãy gửi tới chính luồng đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ vùng chứa thành phần Discord v2 cho tin nhắn của agent. Dùng công cụ tin nhắn với payload `components`. Kết quả tương tác được định tuyến trở lại agent như các tin nhắn đến bình thường và tuân theo các cài đặt `replyToMode` hiện có của Discord.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Loại chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép nút, menu chọn và biểu mẫu được dùng nhiều lần cho đến khi hết hạn.

Để giới hạn ai có thể bấm nút, đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận một thông báo từ chối tạm thời.

Các lệnh slash `/model` và `/models` mở một bộ chọn mô hình tương tác với các danh sách thả xuống nhà cung cấp, mô hình và runtime tương thích, cộng thêm bước Submit. `/models add` đã ngừng dùng và giờ trả về thông báo ngừng dùng thay vì đăng ký mô hình từ trò chuyện. Phản hồi của bộ chọn là tạm thời và chỉ người dùng gọi lệnh mới có thể dùng nó.

Tệp đính kèm:

- Các khối `file` phải trỏ tới tham chiếu tệp đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); dùng `media-gallery` cho nhiều tệp
- Dùng `filename` để ghi đè tên tải lên khi tên đó cần khớp với tham chiếu tệp đính kèm

Biểu mẫu modal:

- Thêm `components.modal` với tối đa 5 trường
- Loại trường: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw tự động thêm một nút kích hoạt

Ví dụ:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` kiểm soát quyền truy cập DM. `channels.discord.allowFrom` là danh sách cho phép DM chuẩn tắc.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.discord.allowFrom` bao gồm `"*"`)
    - `disabled`

    Nếu chính sách DM không mở, người dùng không xác định sẽ bị chặn (hoặc được nhắc ghép đôi trong chế độ `pairing`).

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Với một tài khoản, `allowFrom` được ưu tiên hơn `dm.allowFrom` cũ.
    - Tài khoản có tên kế thừa `channels.discord.allowFrom` khi `allowFrom` riêng của chúng và `dm.allowFrom` cũ đều chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Định dạng mục tiêu DM để gửi:

    - `user:<id>`
    - nhắc đến `<@id>`

    ID số trần thường được phân giải thành ID kênh khi mặc định kênh đang hoạt động, nhưng các ID được liệt kê trong DM `allowFrom` hiệu lực của tài khoản được xử lý như mục tiêu DM người dùng để tương thích.

  </Tab>

  <Tab title="DM access groups">
    DM Discord có thể dùng các mục `accessGroup:<name>` động trong `channels.discord.allowFrom`.

    Tên nhóm truy cập được chia sẻ trên các kênh tin nhắn. Dùng `type: "message.senders"` cho nhóm tĩnh có thành viên được biểu diễn bằng cú pháp `allowFrom` bình thường của từng kênh, hoặc `type: "discord.channelAudience"` khi đối tượng `ViewChannel` hiện tại của một kênh Discord nên xác định tư cách thành viên một cách động. Hành vi nhóm truy cập dùng chung được ghi lại tại đây: [Nhóm truy cập](/vi/channels/access-groups).

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

    Một kênh văn bản Discord không có danh sách thành viên riêng. `type: "discord.channelAudience"` mô hình hóa tư cách thành viên như sau: người gửi DM là thành viên của guild đã cấu hình và hiện có quyền `ViewChannel` hiệu lực trên kênh đã cấu hình sau khi vai trò và ghi đè kênh được áp dụng.

    Ví dụ: cho phép bất kỳ ai có thể xem `#maintainers` gửi DM cho bot, trong khi vẫn đóng DM với mọi người khác.

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

    Bạn có thể trộn các mục động và tĩnh:

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

    Tra cứu mặc định thất bại đóng. Nếu Discord trả về `Missing Access`, tra cứu thành viên thất bại, hoặc kênh thuộc một guild khác, người gửi DM được coi là không được phép.

    Bật **Server Members Intent** trong Discord Developer Portal cho bot khi dùng nhóm truy cập theo đối tượng kênh. DM không bao gồm trạng thái thành viên guild, vì vậy OpenClaw phân giải thành viên thông qua Discord REST tại thời điểm ủy quyền.

  </Tab>

  <Tab title="Guild policy">
    Xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Đường cơ sở bảo mật khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được cho phép khi họ khớp với `users` HOẶC `roles`
    - khớp trực tiếp theo tên/thẻ bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` như chế độ tương thích phá kính trong tình huống khẩn cấp
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng mục tên/thẻ
    - nếu một guild có `channels` được cấu hình, các kênh không được liệt kê sẽ bị từ chối
    - nếu một guild không có khối `channels`, tất cả kênh trong guild đã được đưa vào danh sách cho phép đó đều được cho phép

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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Nếu bạn chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, dự phòng runtime là `groupPolicy="allowlist"` (kèm cảnh báo trong nhật ký), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Tin nhắn guild được kiểm soát bằng nhắc đến theo mặc định.

    Phát hiện nhắc đến bao gồm:

    - nhắc đến bot một cách tường minh
    - mẫu nhắc đến đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm tới bot trong các trường hợp được hỗ trợ

    Khi viết tin nhắn Discord gửi đi, hãy dùng cú pháp nhắc đến chuẩn tắc: `<@USER_ID>` cho người dùng, `<#CHANNEL_ID>` cho kênh và `<@&ROLE_ID>` cho vai trò. Không dùng dạng nhắc đến biệt danh cũ `<@!USER_ID>`.

    `requireMention` được cấu hình theo từng guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn bỏ qua các tin nhắn nhắc đến người dùng/vai trò khác nhưng không nhắc đến bot (không tính @everyone/@here).

    DM nhóm:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến agent dựa trên vai trò

Dùng `bindings[].match.roles` để định tuyến thành viên guild Discord tới các agent khác nhau theo ID vai trò. Binding dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau binding peer hoặc parent-peer và trước binding chỉ guild. Nếu một binding cũng đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả trường đã cấu hình đều phải khớp.

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
- `commands.native=false` bỏ qua việc đăng ký và dọn dẹp slash command của Discord trong quá trình khởi động. Các lệnh đã đăng ký trước đó có thể vẫn hiển thị trong Discord cho đến khi bạn xóa chúng khỏi ứng dụng Discord.
- Xác thực lệnh gốc dùng cùng allowlist/chính sách Discord như xử lý tin nhắn thông thường.
- Các lệnh vẫn có thể hiển thị trong giao diện Discord đối với người dùng không được cấp quyền; việc thực thi vẫn áp dụng xác thực OpenClaw và trả về "không được phép".

Xem [Slash commands](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

Cài đặt slash command mặc định:

- `ephemeral: true`

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Thẻ trả lời và trả lời gốc">
    Discord hỗ trợ thẻ trả lời trong đầu ra của agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được kiểm soát bởi `channels.discord.replyToMode`:

    - `off` (mặc định)
    - `first`
    - `all`
    - `batched`

    Lưu ý: `off` tắt phân luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` tường minh vẫn được tôn trọng.
    `first` luôn gắn tham chiếu trả lời gốc ngầm định vào tin nhắn Discord đi đầu tiên trong lượt.
    `batched` chỉ gắn tham chiếu trả lời gốc ngầm định của Discord khi lượt
    đầu vào là một lô đã debounce gồm nhiều tin nhắn. Điều này hữu ích
    khi bạn muốn trả lời gốc chủ yếu cho các cuộc trò chuyện bùng phát dễ mơ hồ, không phải mọi
    lượt một tin nhắn đơn lẻ.

    ID tin nhắn được đưa vào ngữ cảnh/lịch sử để agent có thể nhắm tới các tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Xem trước luồng trực tiếp">
    OpenClaw có thể truyền trực tuyến bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa nó khi văn bản tới. `channels.discord.streaming` nhận `off` | `partial` | `block` | `progress` (mặc định). `progress` giữ một bản nháp trạng thái có thể chỉnh sửa và cập nhật nó với tiến trình công cụ cho đến khi gửi bản cuối; `streamMode` là bí danh runtime cũ. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu sang khóa chuẩn.

    Đặt `channels.discord.streaming.mode` thành `off` để tắt các chỉnh sửa xem trước Discord. Nếu truyền trực tuyến khối Discord được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh truyền trực tuyến hai lần.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` chỉnh sửa một tin nhắn xem trước duy nhất khi token tới.
    - `block` phát các đoạn có kích thước bản nháp (dùng `draftChunk` để tinh chỉnh kích thước và điểm ngắt, được giới hạn theo `textChunkLimit`).
    - Các bản cuối có media, lỗi và trả lời tường minh sẽ hủy các chỉnh sửa xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) kiểm soát liệu cập nhật công cụ/tiến trình có tái sử dụng tin nhắn xem trước hay không.
    - `streaming.preview.commandText` / `streaming.progress.commandText` kiểm soát chi tiết lệnh/exec trong các dòng tiến trình gọn: `raw` (mặc định) hoặc `status` (chỉ nhãn công cụ).

    Ẩn văn bản lệnh/exec thô trong khi vẫn giữ các dòng tiến trình gọn:

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

    Truyền trực tuyến xem trước chỉ hỗ trợ văn bản; trả lời có media quay về cách gửi thông thường. Khi truyền trực tuyến `block` được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh truyền trực tuyến hai lần.

  </Accordion>

  <Accordion title="Lịch sử, ngữ cảnh và hành vi luồng">
    Ngữ cảnh lịch sử guild:

    - `channels.discord.historyLimit` mặc định `20`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` tắt

    Điều khiển lịch sử DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi luồng:

    - Các luồng Discord định tuyến như phiên kênh và kế thừa cấu hình kênh cha trừ khi bị ghi đè.
    - Phiên luồng kế thừa lựa chọn `/model` cấp phiên của kênh cha làm dự phòng chỉ dành cho model; các lựa chọn `/model` cục bộ của luồng vẫn được ưu tiên và lịch sử transcript của cha không được sao chép trừ khi bật kế thừa transcript.
    - `channels.discord.thread.inheritParent` (mặc định `false`) cho phép các auto-thread mới khởi tạo từ transcript cha. Ghi đè theo tài khoản nằm trong `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng của công cụ tin nhắn có thể phân giải mục tiêu DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong dự phòng kích hoạt ở giai đoạn trả lời.

    Chủ đề kênh được chèn làm ngữ cảnh **không đáng tin cậy**. Allowlists kiểm soát ai có thể kích hoạt agent, không phải là ranh giới biên tập lại ngữ cảnh bổ sung đầy đủ.

  </Accordion>

  <Accordion title="Phiên gắn với luồng cho subagent">
    Discord có thể gắn một luồng với mục tiêu phiên để các tin nhắn tiếp theo trong luồng đó tiếp tục định tuyến tới cùng phiên (bao gồm cả phiên subagent).

    Lệnh:

    - `/focus <target>` gắn luồng hiện tại/mới với mục tiêu subagent/phiên
    - `/unfocus` xóa liên kết luồng hiện tại
    - `/agents` hiển thị các lượt chạy đang hoạt động và trạng thái liên kết
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động hủy focus do không hoạt động cho các liên kết đã focus
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng cho các liên kết đã focus

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

    - `session.threadBindings.*` đặt mặc định toàn cục.
    - `channels.discord.threadBindings.*` ghi đè hành vi Discord.
    - `spawnSessions` kiểm soát việc tự động tạo/gắn luồng cho `sessions_spawn({ thread: true })` và các lượt spawn luồng ACP. Mặc định: `true`.
    - `defaultSpawnContext` kiểm soát ngữ cảnh subagent gốc cho các lượt spawn gắn với luồng. Mặc định: `"fork"`.
    - Các khóa `spawnSubagentSessions`/`spawnAcpSessions` không còn dùng được di chuyển bởi `openclaw doctor --fix`.
    - Nếu liên kết luồng bị tắt cho một tài khoản, `/focus` và các thao tác liên kết luồng liên quan sẽ không khả dụng.

    Xem [Sub-agents](/vi/tools/subagents), [ACP Agents](/vi/tools/acp-agents) và [Configuration Reference](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liên kết kênh ACP bền vững">
    Với các không gian làm việc ACP "luôn bật" ổn định, hãy cấu hình các liên kết ACP có kiểu ở cấp cao nhất nhắm tới cuộc trò chuyện Discord.

    Đường dẫn cấu hình:

    - `bindings[]` với `type: "acp"` và `match.channel: "discord"`

    Ví dụ:

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

    - `/acp spawn codex --bind here` gắn kênh hoặc luồng hiện tại tại chỗ và giữ các tin nhắn tương lai trên cùng phiên ACP. Tin nhắn luồng kế thừa liên kết kênh cha.
    - Trong một kênh hoặc luồng đã liên kết, `/new` và `/reset` đặt lại cùng phiên ACP tại chỗ. Các liên kết luồng tạm thời có thể ghi đè phân giải mục tiêu khi đang hoạt động.
    - `spawnSessions` kiểm soát việc tạo/gắn luồng con qua `--thread auto|here`.

    Xem [ACP Agents](/vi/tools/acp-agents) để biết chi tiết hành vi liên kết.

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Chế độ thông báo phản ứng theo từng guild:

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (dùng `guilds.<id>.users`)

    Sự kiện phản ứng được chuyển thành sự kiện hệ thống và gắn vào phiên Discord đã định tuyến.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đầu vào.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - dự phòng emoji danh tính agent (`agents.list[].identity.emoji`, nếu không thì "👀")

    Ghi chú:

    - Discord chấp nhận emoji unicode hoặc tên emoji tùy chỉnh.
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình">
    Các thao tác ghi cấu hình do kênh khởi tạo được bật theo mặc định.

    Điều này ảnh hưởng đến luồng `/config set|unset` (khi tính năng lệnh được bật).

    Tắt:

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
    Định tuyến lưu lượng WebSocket Gateway của Discord và tra cứu REST khi khởi động (ID ứng dụng + phân giải allowlist) qua proxy HTTP(S) với `channels.discord.proxy`.

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
    Bật phân giải PluralKit để ánh xạ tin nhắn được proxy tới danh tính thành viên hệ thống:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Ghi chú:

    - allowlist có thể dùng `pk:<memberId>`
    - tên hiển thị thành viên chỉ được khớp theo tên/slug khi `channels.discord.dangerouslyAllowNameMatching: true`
    - tra cứu dùng ID tin nhắn gốc và bị giới hạn theo cửa sổ thời gian
    - nếu tra cứu thất bại, tin nhắn được proxy được xem là tin nhắn bot và bị loại bỏ trừ khi `allowBots=true`

  </Accordion>

  <Accordion title="Bí danh nhắc đến khi gửi ra">
    Dùng `mentionAliases` khi agent cần các lượt nhắc đến gửi ra có tính xác định cho người dùng Discord đã biết. Khóa là handle không có `@` ở đầu; giá trị là ID người dùng Discord. Các handle không xác định, `@everyone`, `@here` và lượt nhắc đến bên trong code span Markdown được giữ nguyên.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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

  <Accordion title="Cấu hình hiện diện">
    Cập nhật hiện diện được áp dụng khi bạn đặt trường trạng thái hoặc hoạt động, hoặc khi bạn bật tự động hiện diện.

    Ví dụ chỉ trạng thái:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Ví dụ hoạt động (trạng thái tùy chỉnh là kiểu hoạt động mặc định):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Ví dụ truyền trực tuyến:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Bản đồ kiểu hoạt động:

    - 0: Đang chơi
    - 1: Đang truyền trực tuyến (yêu cầu `activityUrl`)
    - 2: Đang nghe
    - 3: Đang xem
    - 4: Tùy chỉnh (dùng văn bản hoạt động làm trạng thái; emoji là tùy chọn)
    - 5: Đang thi đấu

    Ví dụ tự động hiện diện (tín hiệu sức khỏe runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Tự động hiện diện ánh xạ trạng thái sẵn sàng của runtime sang trạng thái Discord: khỏe mạnh => trực tuyến, suy giảm hoặc không xác định => rảnh, cạn kiệt hoặc không khả dụng => không làm phiền. Có thể ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Phê duyệt trong Discord">
    Discord hỗ trợ xử lý phê duyệt bằng nút trong DM và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh khởi nguồn.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt exec gốc khi `enabled` chưa được đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt, từ `execApprovals.approvers` hoặc từ `commands.ownerAllowFrom`. Discord không suy luận người phê duyệt exec từ `allowFrom` của kênh, `dm.allowFrom` cũ, hoặc `defaultTo` của tin nhắn trực tiếp. Đặt `enabled: false` để tắt Discord như một client phê duyệt gốc một cách tường minh.

    Với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi lời nhắc phê duyệt và kết quả cuối cùng một cách riêng tư. Trước tiên nó thử DM Discord khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không có, nó quay về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ những người phê duyệt đã phân giải mới dùng được các nút; người dùng khác nhận được từ chối tạm thời. Lời nhắc phê duyệt có kèm văn bản lệnh, vì vậy chỉ bật gửi tới kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw quay về gửi qua DM.

    Discord cũng hiển thị các nút phê duyệt dùng chung được các kênh trò chuyện khác sử dụng. Bộ điều hợp Discord gốc chủ yếu thêm định tuyến DM tới người phê duyệt và phát tán tới kênh.
    Khi các nút đó xuất hiện, chúng là UX phê duyệt chính; OpenClaw
    chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết
    phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là đường duy nhất.
    Nếu runtime phê duyệt gốc của Discord không hoạt động, OpenClaw giữ
    lời nhắc `/approve <id> <decision>` xác định cục bộ ở trạng thái hiển thị. Nếu
    runtime hoạt động nhưng không thể gửi thẻ gốc tới bất kỳ đích nào,
    OpenClaw gửi thông báo dự phòng trong cùng cuộc trò chuyện với lệnh `/approve`
    chính xác từ phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng client Gateway dùng chung (ID `plugin:` phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Theo mặc định, phê duyệt hết hạn sau 30 phút.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Công cụ và cổng hành động

Hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, kiểm duyệt, hiện diện và hành động siêu dữ liệu.

Ví dụ cốt lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- kiểm duyệt: `timeout`, `kick`, `ban`
- hiện diện: `setPresence`

Hành động `event-create` chấp nhận tham số `image` tùy chọn (URL hoặc đường dẫn tệp cục bộ) để đặt ảnh bìa cho sự kiện đã lên lịch.

Cổng hành động nằm dưới `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                          | Mặc định |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | bật      |
| roles                                                                                                                                                                    | tắt      |
| moderation                                                                                                                                                               | tắt      |
| presence                                                                                                                                                                 | tắt      |

## UI Components v2

OpenClaw dùng Discord components v2 cho phê duyệt exec và dấu mốc xuyên ngữ cảnh. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho UI tùy chỉnh (nâng cao; yêu cầu tạo payload component qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn dùng bởi container component Discord (hex).
- Đặt theo từng tài khoản với `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` bị bỏ qua khi components v2 xuất hiện.

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

Discord có hai bề mặt thoại riêng biệt: **kênh thoại** thời gian thực (cuộc trò chuyện liên tục) và **tệp đính kèm tin nhắn thoại** (định dạng xem trước dạng sóng). Gateway hỗ trợ cả hai.

### Kênh thoại

Danh sách thiết lập:

1. Bật Message Content Intent trong Discord Developer Portal.
2. Bật Server Members Intent khi dùng danh sách cho phép theo vai trò/người dùng.
3. Mời bot với phạm vi `bot` và `applications.commands`.
4. Cấp Connect, Speak, Send Messages và Read Message History trong kênh thoại đích.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Dùng `/vc join|leave|status` để điều khiển phiên. Lệnh dùng agent mặc định của tài khoản và tuân theo cùng quy tắc danh sách cho phép và chính sách nhóm như các lệnh Discord khác.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Ví dụ tự động tham gia:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Ghi chú:

- `voice.tts` chỉ ghi đè `messages.tts` cho phát lại thoại.
- `voice.model` chỉ ghi đè LLM dùng cho phản hồi kênh thoại Discord. Để trống để kế thừa mô hình agent đã định tuyến.
- STT dùng `tools.media.audio`; `voice.model` không ảnh hưởng đến phiên âm.
- Ghi đè `systemPrompt` theo từng kênh Discord áp dụng cho lượt bản ghi thoại của kênh thoại đó.
- Lượt bản ghi thoại suy ra trạng thái chủ sở hữu từ `allowFrom` của Discord (hoặc `dm.allowFrom`); người nói không phải chủ sở hữu không thể truy cập công cụ chỉ dành cho chủ sở hữu (ví dụ `gateway` và `cron`).
- Thoại Discord là tùy chọn bật riêng với cấu hình chỉ văn bản; đặt `channels.discord.voice.enabled=true` (hoặc giữ khối `channels.discord.voice` hiện có) để bật lệnh `/vc`, runtime thoại và intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng đăng ký intent trạng thái thoại. Để trống để intent đi theo trạng thái bật thoại hiệu lực.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được truyền qua tùy chọn join của `@discordjs/voice`.
- Mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu chưa đặt.
- `voice.connectTimeoutMs` kiểm soát thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần tự động tham gia. Mặc định: `30000`.
- `voice.reconnectGraceMs` kiểm soát thời gian OpenClaw chờ một phiên thoại bị ngắt kết nối bắt đầu kết nối lại trước khi hủy phiên đó. Mặc định: `15000`.
- OpenClaw cũng theo dõi lỗi giải mã khi nhận và tự động phục hồi bằng cách rời/tham gia lại kênh thoại sau các lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu nhật ký nhận nhiều lần hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và nhật ký. Dòng `@discordjs/voice` đi kèm bao gồm bản sửa padding upstream từ discord.js PR #11449, vốn đã đóng discord.js issue #11419.

Pipeline kênh thoại:

- Thu âm PCM của Discord được chuyển đổi thành tệp tạm WAV.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản ghi được gửi qua ingress và định tuyến Discord trong khi LLM phản hồi chạy với chính sách đầu ra thoại ẩn công cụ `tts` của agent và yêu cầu trả về văn bản, vì thoại Discord sở hữu phát lại TTS cuối cùng.
- `voice.model`, khi được đặt, chỉ ghi đè LLM phản hồi cho lượt kênh thoại này.
- `voice.tts` được hợp nhất đè lên `messages.tts`; âm thanh kết quả được phát trong kênh đã tham gia.

Thông tin xác thực được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, và xác thực TTS cho `messages.tts`/`voice.tts`.

### Tin nhắn thoại

Tin nhắn thoại Discord hiển thị bản xem trước dạng sóng và yêu cầu âm thanh OGG/Opus. OpenClaw tự động tạo dạng sóng, nhưng cần `ffmpeg` và `ffprobe` trên máy chủ Gateway để kiểm tra và chuyển đổi.

- Cung cấp **đường dẫn tệp cục bộ** (URL bị từ chối).
- Bỏ qua nội dung văn bản (Discord từ chối văn bản + tin nhắn thoại trong cùng payload).
- Chấp nhận mọi định dạng âm thanh; OpenClaw chuyển đổi sang OGG/Opus khi cần.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Đã dùng intent không được phép hoặc bot không thấy tin nhắn guild">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào phân giải người dùng/thành viên
    - khởi động lại gateway sau khi thay đổi intent

  </Accordion>

  <Accordion title="Tin nhắn guild bị chặn ngoài dự kiến">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép guild dưới `channels.discord.guilds`
    - nếu bản đồ `channels` của guild tồn tại, chỉ các kênh được liệt kê mới được phép
    - xác minh hành vi `requireMention` và mẫu nhắc tên

    Kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false nhưng vẫn bị chặn">
    Nguyên nhân thường gặp:

    - `groupPolicy="allowlist"` không có danh sách cho phép guild/kênh khớp
    - `requireMention` được cấu hình sai chỗ (phải nằm dưới `channels.discord.guilds` hoặc mục nhập kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của guild/kênh

  </Accordion>

  <Accordion title="Lượt Discord chạy lâu hoặc phản hồi trùng lặp">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Núm điều chỉnh hàng đợi Gateway Discord:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - mục này chỉ kiểm soát công việc listener Gateway Discord, không kiểm soát thời lượng lượt agent

    Discord không áp dụng timeout do kênh sở hữu cho các lượt agent trong hàng đợi. Listener tin nhắn bàn giao ngay lập tức, và các lần chạy Discord trong hàng đợi giữ thứ tự theo từng phiên cho đến khi vòng đời phiên/công cụ/runtime hoàn tất hoặc hủy công việc.

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
    OpenClaw lấy siêu dữ liệu `/gateway/bot` của Discord trước khi kết nối. Các lỗi tạm thời sẽ chuyển sang URL Gateway mặc định của Discord và được giới hạn tần suất trong nhật ký.

    Các núm điều chỉnh thời gian chờ siêu dữ liệu:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - dự phòng env khi chưa đặt cấu hình: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Khởi động lại khi hết thời gian chờ READY của Gateway">
    OpenClaw chờ sự kiện `READY` của Gateway Discord trong lúc khởi động và sau các lần kết nối lại khi chạy. Thiết lập nhiều tài khoản có khởi động lệch pha có thể cần cửa sổ READY khi khởi động dài hơn mặc định.

    Các núm điều chỉnh thời gian chờ READY:

    - khởi động một tài khoản: `channels.discord.gatewayReadyTimeoutMs`
    - khởi động nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - dự phòng env khi khởi động nếu chưa đặt cấu hình: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - mặc định khi khởi động: `15000` (15 giây), tối đa: `120000`
    - khi chạy một tài khoản: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - khi chạy nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - dự phòng env khi chạy nếu chưa đặt cấu hình: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - mặc định khi chạy: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Không khớp khi kiểm tra quyền">
    Các kiểm tra quyền của `channels status --probe` chỉ hoạt động với ID kênh dạng số.

    Nếu bạn dùng khóa slug, việc khớp khi chạy vẫn có thể hoạt động, nhưng probe không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="Sự cố DM và ghép đôi">

    - DM bị tắt: `channels.discord.dm.enabled=false`
    - chính sách DM bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép đôi trong chế độ `pairing`

  </Accordion>

  <Accordion title="Vòng lặp bot với bot">
    Theo mặc định, tin nhắn do bot tạo sẽ bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng quy tắc nhắc đến và danh sách cho phép nghiêm ngặt để tránh hành vi lặp.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn của bot có nhắc đến bot.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="STT thoại bị rớt với DecryptionFailed(...)">

    - giữ OpenClaw luôn ở bản hiện tại (`openclaw update`) để có logic phục hồi nhận thoại Discord
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu từ `channels.discord.voice.decryptionFailureTolerance=24` (mặc định upstream) và chỉ tinh chỉnh nếu cần
    - theo dõi nhật ký để tìm:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi tiếp diễn sau khi tự động tham gia lại, hãy thu thập nhật ký và so sánh với lịch sử nhận DAVE upstream trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) và [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Discord](/vi/gateway/config-channels#discord).

<Accordion title="Các trường Discord tín hiệu cao">

- khởi động/xác thực: `enabled`, `token`, `accounts.*`, `allowBots`
- chính sách: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- lệnh: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- hàng đợi sự kiện: `eventQueue.listenerTimeout` (ngân sách listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- trả lời/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- phân phối: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- truyền trực tuyến: `streaming` (bí danh cũ: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/thử lại: `mediaMaxMb` (giới hạn tải lên Discord gửi ra, mặc định `100MB`), `retry`
- hành động: `actions.*`
- hiện diện: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là bí mật (ưu tiên `DISCORD_BOT_TOKEN` trong môi trường được giám sát).
- Cấp quyền Discord theo nguyên tắc đặc quyền tối thiểu.
- Nếu trạng thái/triển khai lệnh đã cũ, hãy khởi động lại Gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép đôi" icon="link" href="/vi/channels/pairing">
    Ghép đôi người dùng Discord với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi trò chuyện nhóm và danh sách cho phép.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến cho agent.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Định tuyến đa tác nhân" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ guild và kênh tới agent.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc.
  </Card>
</CardGroup>
