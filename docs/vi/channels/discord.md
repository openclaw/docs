---
read_when:
    - Làm việc với các tính năng kênh Discord
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:20:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

Sẵn sàng cho DM và kênh guild thông qua Discord gateway chính thức.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM Discord mặc định dùng chế độ ghép nối.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán đa kênh và luồng sửa lỗi.
  </Card>
</CardGroup>

## Thiết lập nhanh

Bạn cần tạo một ứng dụng mới có bot, thêm bot vào máy chủ của bạn, rồi ghép nối bot với OpenClaw. Chúng tôi khuyến nghị thêm bot vào máy chủ riêng của chính bạn. Nếu bạn chưa có, hãy [tạo một máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng Discord và bot">
    Truy cập [Discord Developer Portal](https://discord.com/developers/applications) và nhấp **New Application**. Đặt tên kiểu như "OpenClaw".

    Nhấp **Bot** trên thanh bên. Đặt **Username** thành bất kỳ tên nào bạn dùng để gọi agent OpenClaw của mình.

  </Step>

  <Step title="Bật privileged intents">
    Vẫn ở trang **Bot**, cuộn xuống **Privileged Gateway Intents** và bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; bắt buộc cho allowlist vai trò và khớp tên sang ID)
    - **Presence Intent** (tùy chọn; chỉ cần cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Sao chép token bot của bạn">
    Cuộn lại lên trên trang **Bot** và nhấp **Reset Token**.

    <Note>
    Bất chấp tên gọi, thao tác này tạo token đầu tiên của bạn — không có gì đang bị "đặt lại."
    </Note>

    Sao chép token và lưu ở đâu đó. Đây là **Bot Token** của bạn và bạn sẽ cần nó ngay sau đây.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào máy chủ của bạn">
    Nhấp **OAuth2** trên thanh bên. Bạn sẽ tạo một URL mời với các quyền phù hợp để thêm bot vào máy chủ của mình.

    Cuộn xuống **OAuth2 URL Generator** và bật:

    - `bot`
    - `applications.commands`

    Một phần **Bot Permissions** sẽ xuất hiện bên dưới. Bật ít nhất:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (tùy chọn)

    Đây là bộ quyền cơ sở cho các kênh văn bản thông thường. Nếu bạn dự định đăng trong các thread Discord, bao gồm quy trình kênh diễn đàn hoặc kênh media tạo hoặc tiếp tục một thread, hãy bật thêm **Send Messages in Threads**.
    Sao chép URL được tạo ở cuối, dán vào trình duyệt, chọn máy chủ của bạn, rồi nhấp **Continue** để kết nối. Bây giờ bạn sẽ thấy bot của mình trong máy chủ Discord.

  </Step>

  <Step title="Bật Developer Mode và thu thập ID của bạn">
    Quay lại ứng dụng Discord, bạn cần bật Developer Mode để có thể sao chép các ID nội bộ.

    1. Nhấp **User Settings** (biểu tượng bánh răng bên cạnh avatar của bạn) → **Advanced** → bật **Developer Mode**
    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trong thanh bên → **Copy Server ID**
    3. Nhấp chuột phải vào **avatar của chính bạn** → **Copy User ID**

    Lưu **Server ID** và **User ID** cùng với Bot Token của bạn — bạn sẽ gửi cả ba cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Cho phép DM từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord cần cho phép bot gửi DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn → **Privacy Settings** → bật **Direct Messages**.

    Việc này cho phép thành viên máy chủ (bao gồm bot) gửi DM cho bạn. Giữ tùy chọn này bật nếu bạn muốn dùng DM Discord với OpenClaw. Nếu bạn chỉ định dùng kênh guild, bạn có thể tắt DM sau khi ghép nối.

  </Step>

  <Step title="Thiết lập token bot của bạn một cách an toàn (không gửi trong chat)">
    Token bot Discord của bạn là bí mật (giống như mật khẩu). Thiết lập token trên máy đang chạy OpenClaw trước khi nhắn tin cho agent của bạn.

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

    Nếu OpenClaw đã chạy dưới dạng dịch vụ nền, hãy khởi động lại qua ứng dụng OpenClaw Mac hoặc bằng cách dừng rồi khởi động lại tiến trình `openclaw gateway run`.
    Với các bản cài đặt dịch vụ được quản lý, chạy `openclaw gateway install` từ một shell có `DISCORD_BOT_TOKEN`, hoặc lưu biến trong `~/.openclaw/.env`, để dịch vụ có thể phân giải SecretRef env sau khi khởi động lại.
    Nếu máy chủ của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/client Discord từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó. Dùng `channels.discord.applicationId` cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.applicationId` khi bạn chạy nhiều bot Discord.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Trò chuyện với agent OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ Telegram) và nói với nó. Nếu Discord là kênh đầu tiên của bạn, hãy dùng tab CLI / cấu hình thay thế.

        > "Tôi đã thiết lập token bot Discord trong cấu hình. Vui lòng hoàn tất thiết lập Discord với User ID `<user_id>` và Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / cấu hình">
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

        Env fallback cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Với thiết lập theo script hoặc từ xa, ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run` rồi chạy lại không có `--dry-run`. Giá trị `token` dạng văn bản thuần được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các provider env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Với nhiều bot Discord, giữ mỗi token bot và ID ứng dụng trong tài khoản tương ứng. `channels.discord.applicationId` cấp cao nhất được các tài khoản kế thừa, vì vậy chỉ đặt ở đó khi mọi tài khoản đều nên dùng cùng ID ứng dụng.

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

  <Step title="Phê duyệt ghép nối DM đầu tiên">
    Đợi đến khi gateway đang chạy, rồi DM bot của bạn trong Discord. Bot sẽ phản hồi bằng mã ghép nối.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Gửi mã ghép nối cho agent của bạn trên kênh hiện có:

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

    Bây giờ bạn sẽ có thể trò chuyện với agent của mình trong Discord qua DM.

  </Step>
</Steps>

<Note>
Việc phân giải token có nhận biết tài khoản. Giá trị token cấu hình thắng env fallback. `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord được bật phân giải về cùng một token bot, OpenClaw chỉ khởi động một trình giám sát gateway cho token đó. Token lấy từ cấu hình thắng env fallback mặc định; nếu không thì tài khoản được bật đầu tiên thắng và tài khoản trùng lặp được báo cáo là đã tắt.
Với các lệnh gọi outbound nâng cao (công cụ tin nhắn/hành động kênh), `token` tường minh theo từng lệnh gọi được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và đọc/thăm dò (ví dụ read/search/fetch/thread/pins/permissions). Thiết lập chính sách/thử lại của tài khoản vẫn lấy từ tài khoản đã chọn trong ảnh chụp runtime đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập workspace guild

Khi DM đã hoạt động, bạn có thể thiết lập máy chủ Discord của mình thành một workspace đầy đủ, nơi mỗi kênh có phiên agent riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho máy chủ riêng chỉ có bạn và bot của bạn.

<Steps>
  <Step title="Thêm máy chủ của bạn vào allowlist guild">
    Thao tác này cho phép agent phản hồi trong bất kỳ kênh nào trên máy chủ của bạn, không chỉ DM.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Thêm Discord Server ID `<server_id>` của tôi vào allowlist guild"
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

  <Step title="Cho phép phản hồi không cần @mention">
    Theo mặc định, agent của bạn chỉ phản hồi trong kênh guild khi được @mentioned. Với máy chủ riêng, có thể bạn muốn agent phản hồi mọi tin nhắn.

    Trong kênh guild, các phản hồi cuối thông thường của assistant mặc định vẫn ở chế độ riêng tư. Đầu ra Discord hiển thị phải được gửi tường minh bằng công cụ `message`, để agent có thể mặc định quan sát âm thầm và chỉ đăng khi quyết định rằng phản hồi trong kênh là hữu ích.

    Điều này có nghĩa là model được chọn phải gọi công cụ một cách đáng tin cậy. Nếu Discord hiển thị trạng thái đang nhập và log cho thấy có sử dụng token nhưng không có tin nhắn được đăng, hãy kiểm tra log phiên để tìm văn bản assistant có `didSendViaMessagingTool: false`. Điều đó có nghĩa là model đã tạo câu trả lời cuối riêng tư thay vì gọi `message(action=send)`. Chuyển sang một model gọi công cụ mạnh hơn, hoặc dùng cấu hình bên dưới để khôi phục phản hồi cuối tự động kiểu cũ.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Cho phép agent của tôi phản hồi trên máy chủ này mà không cần được @mentioned"
      </Tab>
      <Tab title="Cấu hình">
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

  <Step title="Lập kế hoạch cho bộ nhớ trong kênh guild">
    Theo mặc định, bộ nhớ dài hạn (MEMORY.md) chỉ được tải trong phiên DM. Kênh guild không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Khi tôi đặt câu hỏi trong kênh Discord, hãy dùng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Nếu bạn cần ngữ cảnh dùng chung trong mọi kênh, hãy đặt các chỉ dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được chèn vào mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập chúng theo nhu cầu bằng công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo một số kênh trên máy chủ Discord của bạn và bắt đầu trò chuyện. Agent của bạn có thể thấy tên kênh, và mỗi kênh có phiên cô lập riêng — vì vậy bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất kỳ thứ gì phù hợp với quy trình làm việc của bạn.

## Mô hình runtime

- Gateway sở hữu kết nối Discord.
- Định tuyến phản hồi có tính xác định: phản hồi gửi vào từ Discord sẽ trả về Discord.
- Siêu dữ liệu guild/kênh Discord được thêm vào prompt của mô hình dưới dạng ngữ cảnh không đáng tin cậy, không phải tiền tố phản hồi hiển thị với người dùng. Nếu mô hình sao chép phong bì đó trở lại, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi phản hồi gửi ra và khỏi ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), cuộc trò chuyện trực tiếp dùng chung phiên chính của agent (`agent:main:main`).
- Kênh guild là các khóa phiên được cô lập (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Lệnh slash gốc chạy trong các phiên lệnh cô lập (`agent:<agentId>:discord:slash:<userId>`), đồng thời vẫn mang `CommandTargetSessionKey` tới phiên hội thoại đã được định tuyến.
- Việc gửi thông báo cron/Heartbeat chỉ có văn bản tới Discord sử dụng câu trả lời cuối cùng hiển thị với assistant một lần. Payload media và thành phần có cấu trúc vẫn là nhiều tin nhắn khi agent phát ra nhiều payload có thể gửi.

## Kênh diễn đàn

Kênh diễn đàn và media của Discord chỉ chấp nhận bài đăng thread. OpenClaw hỗ trợ hai cách tạo chúng:

- Gửi tin nhắn tới diễn đàn cha (`channel:<forumId>`) để tự động tạo thread. Tiêu đề thread sử dụng dòng không trống đầu tiên trong tin nhắn của bạn.
- Dùng `openclaw message thread create` để tạo thread trực tiếp. Không truyền `--message-id` cho kênh diễn đàn.

Ví dụ: gửi tới diễn đàn cha để tạo thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ví dụ: tạo thread diễn đàn một cách tường minh

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Diễn đàn cha không chấp nhận thành phần Discord. Nếu bạn cần thành phần, hãy gửi tới chính thread đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ container thành phần Discord v2 cho tin nhắn của agent. Dùng công cụ message với payload `components`. Kết quả tương tác được định tuyến trở lại agent như tin nhắn gửi vào thông thường và tuân theo các cài đặt `replyToMode` hiện có của Discord.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Loại chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép nút, lựa chọn và biểu mẫu được dùng nhiều lần cho đến khi hết hạn.

Để hạn chế ai có thể nhấp vào một nút, đặt `allowedUsers` trên nút đó (ID người dùng Discord, tag hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận thông báo từ chối ephemeral.

Các lệnh slash `/model` và `/models` mở bộ chọn mô hình tương tác với menu thả xuống provider, mô hình và runtime tương thích cùng bước Submit. `/models add` đã bị loại bỏ dần và hiện trả về thông báo loại bỏ dần thay vì đăng ký mô hình từ chat. Phản hồi của bộ chọn là ephemeral và chỉ người dùng gọi lệnh mới có thể sử dụng. Menu chọn của Discord bị giới hạn ở 25 tùy chọn, nên hãy thêm các mục `provider/*` vào `agents.defaults.models` khi bạn muốn bộ chọn chỉ hiển thị các mô hình được phát hiện động cho những provider đã chọn như `openai-codex` hoặc `vllm`.

Tệp đính kèm:

- Khối `file` phải trỏ tới tham chiếu tệp đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); dùng `media-gallery` cho nhiều tệp
- Dùng `filename` để ghi đè tên tải lên khi tên đó cần khớp với tham chiếu tệp đính kèm

Biểu mẫu modal:

- Thêm `components.modal` với tối đa 5 trường
- Loại trường: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw tự động thêm nút kích hoạt

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
    `channels.discord.dmPolicy` kiểm soát quyền truy cập DM. `channels.discord.allowFrom` là danh sách cho phép DM chính tắc.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.discord.allowFrom` bao gồm `"*"`)
    - `disabled`

    Nếu chính sách DM không mở, người dùng không xác định sẽ bị chặn (hoặc được nhắc ghép đôi trong chế độ `pairing`).

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Với một tài khoản, `allowFrom` được ưu tiên hơn `dm.allowFrom` cũ.
    - Tài khoản được đặt tên kế thừa `channels.discord.allowFrom` khi `allowFrom` riêng và `dm.allowFrom` cũ của chúng chưa được đặt.
    - Tài khoản được đặt tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Định dạng mục tiêu DM để gửi:

    - `user:<id>`
    - đề cập `<@id>`

    ID số trần thường phân giải thành ID kênh khi một kênh mặc định đang hoạt động, nhưng các ID được liệt kê trong `allowFrom` DM hiệu lực của tài khoản được xem là mục tiêu DM người dùng để tương thích.

  </Tab>

  <Tab title="Access groups">
    DM Discord và ủy quyền lệnh văn bản có thể dùng các mục `accessGroup:<name>` động trong `channels.discord.allowFrom`.

    Tên nhóm truy cập được chia sẻ giữa các kênh tin nhắn. Dùng `type: "message.senders"` cho nhóm tĩnh có thành viên được biểu thị bằng cú pháp `allowFrom` thông thường của từng kênh, hoặc `type: "discord.channelAudience"` khi đối tượng `ViewChannel` hiện tại của một kênh Discord nên xác định tư cách thành viên một cách động. Hành vi nhóm truy cập dùng chung được ghi lại tại đây: [Nhóm truy cập](/vi/channels/access-groups).

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

    Một kênh văn bản Discord không có danh sách thành viên riêng. `type: "discord.channelAudience"` mô hình hóa tư cách thành viên như sau: người gửi DM là thành viên của guild đã cấu hình và hiện có quyền `ViewChannel` hiệu lực trên kênh đã cấu hình sau khi áp dụng vai trò và ghi đè kênh.

    Ví dụ: cho phép bất kỳ ai có thể xem `#maintainers` DM cho bot, trong khi vẫn đóng DM với mọi người khác.

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

    Tra cứu thất bại theo hướng đóng. Nếu Discord trả về `Missing Access`, tra cứu thành viên thất bại, hoặc kênh thuộc về một guild khác, người gửi DM được xem là không được ủy quyền.

    Bật **Server Members Intent** trong Discord Developer Portal cho bot khi dùng nhóm truy cập dựa trên đối tượng kênh. DM không bao gồm trạng thái thành viên guild, nên OpenClaw phân giải thành viên qua Discord REST tại thời điểm ủy quyền.

  </Tab>

  <Tab title="Guild policy">
    Xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Đường cơ sở bảo mật khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được phép khi khớp với `users` HOẶC `roles`
    - khớp trực tiếp tên/tag bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` như chế độ tương thích phá kính khi khẩn cấp
    - tên/tag được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng mục tên/tag
    - nếu guild có cấu hình `channels`, các kênh không được liệt kê sẽ bị từ chối
    - nếu guild không có khối `channels`, tất cả kênh trong guild thuộc danh sách cho phép đó đều được phép

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

    Nếu bạn chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, fallback runtime là `groupPolicy="allowlist"` (có cảnh báo trong log), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Tin nhắn guild mặc định được kiểm soát bằng đề cập.

    Phát hiện đề cập bao gồm:

    - đề cập bot tường minh
    - mẫu đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm tới bot trong các trường hợp được hỗ trợ

    Khi viết tin nhắn Discord gửi ra, hãy dùng cú pháp đề cập chính tắc: `<@USER_ID>` cho người dùng, `<#CHANNEL_ID>` cho kênh và `<@&ROLE_ID>` cho vai trò. Không dùng dạng đề cập biệt danh cũ `<@!USER_ID>`.

    `requireMention` được cấu hình theo từng guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn loại bỏ tin nhắn đề cập một người dùng/vai trò khác nhưng không đề cập bot (không tính @everyone/@here).

    Group DM:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến agent dựa trên vai trò

Dùng `bindings[].match.roles` để định tuyến thành viên guild Discord tới các agent khác nhau theo ID vai trò. Binding dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau binding peer hoặc parent-peer và trước binding chỉ guild. Nếu một binding cũng đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả trường đã cấu hình phải khớp.

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
- `commands.native=false` bỏ qua việc đăng ký lệnh gạch chéo của Discord và dọn dẹp trong quá trình khởi động. Các lệnh đã đăng ký trước đó có thể vẫn hiển thị trong Discord cho đến khi bạn xóa chúng khỏi ứng dụng Discord.
- Xác thực lệnh gốc sử dụng cùng danh sách cho phép/chính sách Discord như xử lý tin nhắn thông thường.
- Các lệnh có thể vẫn hiển thị trong giao diện Discord đối với người dùng chưa được ủy quyền; việc thực thi vẫn áp dụng xác thực OpenClaw và trả về "not authorized".

Xem [Lệnh gạch chéo](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

Thiết lập lệnh gạch chéo mặc định:

- `ephemeral: true`

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord hỗ trợ thẻ trả lời trong đầu ra của tác nhân:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được kiểm soát bởi `channels.discord.replyToMode`:

    - `off` (mặc định)
    - `first`
    - `all`
    - `batched`

    Lưu ý: `off` tắt phân luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` tường minh vẫn được tôn trọng.
    `first` luôn gắn tham chiếu trả lời gốc ngầm định vào tin nhắn Discord gửi đi đầu tiên của lượt đó.
    `batched` chỉ gắn tham chiếu trả lời gốc ngầm định của Discord khi
    lượt đến là một lô đã khử dội gồm nhiều tin nhắn. Điều này hữu ích
    khi bạn muốn trả lời gốc chủ yếu cho các cuộc trò chuyện bùng nổ dễ mơ hồ, không phải mọi
    lượt một tin nhắn.

    ID tin nhắn được đưa vào ngữ cảnh/lịch sử để tác nhân có thể nhắm tới tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw có thể truyền phát bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa nó khi văn bản đến. `channels.discord.streaming` nhận `off` | `partial` | `block` | `progress` (mặc định). `progress` giữ một bản nháp trạng thái có thể chỉnh sửa và cập nhật nó với tiến trình công cụ cho đến khi gửi cuối cùng; nhãn khởi đầu dùng chung là một dòng cuộn, nên nó sẽ trôi đi như phần còn lại khi có đủ công việc xuất hiện. `streamMode` là bí danh runtime kế thừa. Chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu sang khóa chuẩn.

    Đặt `channels.discord.streaming.mode` thành `off` để tắt chỉnh sửa bản xem trước Discord. Nếu truyền phát khối Discord được bật tường minh, OpenClaw sẽ bỏ qua luồng xem trước để tránh truyền phát kép.

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

    - `partial` chỉnh sửa một tin nhắn xem trước duy nhất khi token đến.
    - `block` phát các đoạn có kích thước bản nháp (dùng `draftChunk` để tinh chỉnh kích thước và điểm ngắt, được kẹp theo `textChunkLimit`).
    - Kết quả cuối có media, lỗi và trả lời tường minh sẽ hủy các chỉnh sửa xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) kiểm soát việc các cập nhật công cụ/tiến trình có dùng lại tin nhắn xem trước hay không.
    - Các hàng công cụ/tiến trình hiển thị dạng emoji + tiêu đề + chi tiết gọn khi có, ví dụ `🛠️ Bash: run tests` hoặc `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` kiểm soát chi tiết lệnh/thực thi trong các dòng tiến trình gọn: `raw` (mặc định) hoặc `status` (chỉ nhãn công cụ).

    Ẩn văn bản lệnh/thực thi thô trong khi vẫn giữ các dòng tiến trình gọn:

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

    Truyền phát xem trước chỉ hỗ trợ văn bản; trả lời media quay về cơ chế gửi thông thường. Khi truyền phát `block` được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh truyền phát kép.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Ngữ cảnh lịch sử máy chủ:

    - `channels.discord.historyLimit` mặc định `20`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` tắt

    Kiểm soát lịch sử DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi luồng:

    - Luồng Discord được định tuyến như phiên kênh và kế thừa cấu hình kênh cha trừ khi bị ghi đè.
    - Phiên luồng kế thừa lựa chọn `/model` cấp phiên của kênh cha làm dự phòng chỉ cho mô hình; lựa chọn `/model` cục bộ của luồng vẫn được ưu tiên và lịch sử bản ghi của kênh cha không được sao chép trừ khi bật kế thừa bản ghi.
    - `channels.discord.thread.inheritParent` (mặc định `false`) chọn cho các luồng tự động mới được khởi tạo từ bản ghi cha. Ghi đè theo từng tài khoản nằm dưới `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng từ công cụ tin nhắn có thể phân giải đích DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong dự phòng kích hoạt ở giai đoạn trả lời.

    Chủ đề kênh được chèn làm ngữ cảnh **không đáng tin cậy**. Danh sách cho phép kiểm soát ai có thể kích hoạt tác nhân, không phải là ranh giới biên tập ngữ cảnh bổ sung đầy đủ.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord có thể liên kết một luồng với đích phiên để các tin nhắn tiếp theo trong luồng đó tiếp tục định tuyến đến cùng phiên (bao gồm cả phiên tác nhân phụ).

    Lệnh:

    - `/focus <target>` liên kết luồng hiện tại/mới với đích tác nhân phụ/phiên
    - `/unfocus` xóa liên kết luồng hiện tại
    - `/agents` hiển thị các lần chạy đang hoạt động và trạng thái liên kết
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động bỏ tập trung do không hoạt động cho các liên kết đã tập trung
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng cho các liên kết đã tập trung

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
    - `spawnSessions` kiểm soát tự động tạo/liên kết luồng cho `sessions_spawn({ thread: true })` và lượt tạo luồng ACP. Mặc định: `true`.
    - `defaultSpawnContext` kiểm soát ngữ cảnh tác nhân phụ gốc cho lượt tạo có liên kết luồng. Mặc định: `"fork"`.
    - Các khóa `spawnSubagentSessions`/`spawnAcpSessions` đã ngừng dùng được di chuyển bởi `openclaw doctor --fix`.
    - Nếu liên kết luồng bị tắt cho một tài khoản, `/focus` và các thao tác liên kết luồng liên quan sẽ không khả dụng.

    Xem [Tác nhân phụ](/vi/tools/subagents), [Tác nhân ACP](/vi/tools/acp-agents), và [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Đối với không gian làm việc ACP "always-on" ổn định, hãy cấu hình các liên kết ACP có kiểu ở cấp cao nhất nhắm tới cuộc trò chuyện Discord.

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

    - `/acp spawn codex --bind here` liên kết kênh hoặc luồng hiện tại tại chỗ và giữ các tin nhắn sau này trên cùng phiên ACP. Tin nhắn luồng kế thừa liên kết kênh cha.
    - Trong một kênh hoặc luồng đã liên kết, `/new` và `/reset` đặt lại cùng phiên ACP tại chỗ. Liên kết luồng tạm thời có thể ghi đè phân giải đích khi đang hoạt động.
    - `spawnSessions` kiểm soát việc tạo/liên kết luồng con qua `--thread auto|here`.

    Xem [Tác nhân ACP](/vi/tools/acp-agents) để biết chi tiết hành vi liên kết.

  </Accordion>

  <Accordion title="Reaction notifications">
    Chế độ thông báo phản ứng theo từng máy chủ:

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (dùng `guilds.<id>.users`)

    Sự kiện phản ứng được chuyển thành sự kiện hệ thống và gắn vào phiên Discord đã định tuyến.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` gửi emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn đến.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - dự phòng emoji định danh tác nhân (`agents.list[].identity.emoji`, nếu không thì "👀")

    Ghi chú:

    - Discord chấp nhận emoji Unicode hoặc tên emoji tùy chỉnh.
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Config writes">
    Ghi cấu hình do kênh khởi tạo được bật theo mặc định.

    Điều này ảnh hưởng đến các luồng `/config set|unset` (khi tính năng lệnh được bật).

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

  <Accordion title="Gateway proxy">
    Định tuyến lưu lượng WebSocket Gateway Discord và các tra cứu REST khi khởi động (ID ứng dụng + phân giải danh sách cho phép) qua proxy HTTP(S) bằng `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Ghi đè theo từng tài khoản:

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

  <Accordion title="PluralKit support">
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

    - danh sách cho phép có thể dùng `pk:<memberId>`
    - tên hiển thị của thành viên được khớp theo tên/slug chỉ khi `channels.discord.dangerouslyAllowNameMatching: true`
    - tra cứu sử dụng ID tin nhắn gốc và bị ràng buộc bởi khung thời gian
    - nếu tra cứu thất bại, tin nhắn được proxy được coi là tin nhắn bot và bị bỏ trừ khi `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Dùng `mentionAliases` khi tác nhân cần mention gửi đi có tính xác định cho người dùng Discord đã biết. Khóa là handle không có `@` đứng đầu; giá trị là ID người dùng Discord. Các handle không xác định, `@everyone`, `@here`, và mention bên trong code span Markdown được giữ nguyên.

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

  <Accordion title="Presence configuration">
    Cập nhật hiện diện được áp dụng khi bạn đặt trường trạng thái hoặc hoạt động, hoặc khi bạn bật hiện diện tự động.

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

    Ví dụ hoạt động (trạng thái tùy chỉnh là loại hoạt động mặc định):

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

    Ví dụ truyền phát:

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

    Bản đồ loại hoạt động:

    - 0: Đang chơi
    - 1: Đang phát trực tiếp (yêu cầu `activityUrl`)
    - 2: Đang nghe
    - 3: Đang xem
    - 4: Tùy chỉnh (dùng văn bản hoạt động làm trạng thái; emoji là tùy chọn)
    - 5: Đang thi đấu

    Ví dụ về trạng thái hiện diện tự động (tín hiệu sức khỏe runtime):

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

    Trạng thái hiện diện tự động ánh xạ mức khả dụng của runtime sang trạng thái Discord: khỏe mạnh => online, suy giảm hoặc không xác định => idle, cạn kiệt hoặc không khả dụng => dnd. Các phần ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord hỗ trợ xử lý phê duyệt bằng nút trong DM và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh khởi tạo.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt exec gốc khi `enabled` chưa được đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt, từ `execApprovals.approvers` hoặc từ `commands.ownerAllowFrom`. Discord không suy luận người phê duyệt exec từ kênh `allowFrom`, `dm.allowFrom` cũ, hoặc tin nhắn trực tiếp `defaultTo`. Đặt `enabled: false` để tắt Discord một cách rõ ràng với vai trò máy khách phê duyệt gốc.

    Với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi lời nhắc phê duyệt và kết quả cuối cùng một cách riêng tư. Trước tiên, nó thử Discord DM khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không có, nó quay về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ những người phê duyệt đã được phân giải mới có thể dùng các nút; người dùng khác nhận được thông báo từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật gửi qua kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw quay về gửi qua DM.

    Discord cũng hiển thị các nút phê duyệt dùng chung được các kênh chat khác sử dụng. Adapter Discord gốc chủ yếu bổ sung định tuyến DM cho người phê duyệt và phát tán ra kênh.
    Khi các nút đó xuất hiện, chúng là UX phê duyệt chính; OpenClaw
    chỉ nên đưa vào lệnh `/approve` thủ công khi kết quả công cụ cho biết
    phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.
    Nếu runtime phê duyệt gốc của Discord không hoạt động, OpenClaw giữ
    lời nhắc cục bộ xác định `/approve <id> <decision>` hiển thị. Nếu
    runtime đang hoạt động nhưng không thể gửi thẻ gốc đến bất kỳ đích nào,
    OpenClaw gửi thông báo dự phòng trong cùng cuộc chat với lệnh `/approve`
    chính xác từ phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng máy khách Gateway dùng chung (ID `plugin:` phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Theo mặc định, phê duyệt hết hạn sau 30 phút.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Công cụ và cổng hành động

Hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, kiểm duyệt, trạng thái hiện diện và hành động siêu dữ liệu.

Ví dụ cốt lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- kiểm duyệt: `timeout`, `kick`, `ban`
- trạng thái hiện diện: `setPresence`

Hành động `event-create` chấp nhận tham số `image` tùy chọn (URL hoặc đường dẫn tệp cục bộ) để đặt ảnh bìa cho sự kiện đã lên lịch.

Cổng hành động nằm dưới `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                           | Mặc định |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | bật      |
| roles                                                                                                                                                                    | tắt      |
| moderation                                                                                                                                                               | tắt      |
| presence                                                                                                                                                                 | tắt      |

## Giao diện Components v2

OpenClaw dùng Discord components v2 cho phê duyệt exec và đánh dấu xuyên ngữ cảnh. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho giao diện tùy chỉnh (nâng cao; yêu cầu tạo payload thành phần thông qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn dùng bởi các vùng chứa thành phần Discord (hex).
- Đặt theo từng tài khoản bằng `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` bị bỏ qua khi có components v2.

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
2. Bật Server Members Intent khi dùng danh sách cho phép vai trò/người dùng.
3. Mời bot với phạm vi `bot` và `applications.commands`.
4. Cấp quyền Connect, Speak, Send Messages và Read Message History trong kênh thoại đích.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Dùng `/vc join|leave|status` để điều khiển phiên. Lệnh này dùng tác tử mặc định của tài khoản và tuân theo cùng quy tắc danh sách cho phép và chính sách nhóm như các lệnh Discord khác.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Để kiểm tra quyền hiệu lực của bot trước khi tham gia, chạy:

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
        model: "openai-codex/gpt-5.5",
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
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Ghi chú:

- `voice.tts` chỉ ghi đè `messages.tts` cho phát giọng nói `stt-tts`. Các chế độ realtime dùng `voice.realtime.voice`.
- `voice.mode` kiểm soát đường dẫn hội thoại. Mặc định là `agent-proxy`: một giao diện giọng nói realtime xử lý thời điểm lượt nói, ngắt lời và phát lại, ủy quyền công việc thực chất cho agent OpenClaw được định tuyến thông qua `openclaw_agent_consult`, và xử lý kết quả như một lời nhắc Discord đã nhập từ người nói đó. `stt-tts` giữ luồng STT theo lô cũ cộng với TTS. `bidi` cho phép mô hình realtime trò chuyện trực tiếp trong khi vẫn cung cấp `openclaw_agent_consult` cho bộ não OpenClaw.
- `voice.agentSession` kiểm soát cuộc hội thoại OpenClaw nào nhận các lượt giọng nói. Để trống để dùng phiên riêng của kênh giọng nói, hoặc đặt `{ mode: "target", target: "channel:<text-channel-id>" }` để kênh giọng nói hoạt động như phần mở rộng micrô/loa của một phiên kênh văn bản Discord hiện có, chẳng hạn `#maintainers`.
- `voice.model` ghi đè bộ não agent OpenClaw cho phản hồi giọng nói Discord và các lượt tham vấn realtime. Để trống để kế thừa mô hình agent được định tuyến. Mục này tách biệt với `voice.realtime.model`.
- `agent-proxy` định tuyến lời nói qua `discord-voice`, giữ nguyên ủy quyền owner/tool thông thường cho người nói và phiên đích nhưng ẩn công cụ agent `tts` vì giọng nói Discord sở hữu việc phát lại. Theo mặc định, `agent-proxy` cấp cho lượt tham vấn toàn quyền truy cập công cụ tương đương owner đối với người nói là owner (`voice.realtime.toolPolicy: "owner"`) và ưu tiên mạnh việc tham vấn agent OpenClaw trước các câu trả lời thực chất (`voice.realtime.consultPolicy: "always"`). Trong chế độ `always` mặc định đó, lớp realtime không tự động nói câu đệm trước câu trả lời tham vấn; nó thu và chuyển lời nói thành văn bản, sau đó nói câu trả lời OpenClaw đã định tuyến. Nếu nhiều câu trả lời tham vấn bắt buộc hoàn tất trong khi Discord vẫn đang phát câu trả lời đầu tiên, các câu trả lời dạng lời nói chính xác sau đó sẽ được xếp hàng cho đến khi phát lại rảnh, thay vì thay thế lời nói giữa chừng câu.
- Trong chế độ `stt-tts`, STT dùng `tools.media.audio`; `voice.model` không ảnh hưởng đến việc chuyển lời nói thành văn bản.
- Trong các chế độ realtime, `voice.realtime.provider`, `voice.realtime.model` và `voice.realtime.voice` cấu hình phiên âm thanh realtime. Với OpenAI Realtime 2 cộng với bộ não Codex, dùng `voice.realtime.model: "gpt-realtime-2"` và `voice.model: "openai-codex/gpt-5.5"`.
- Nhà cung cấp realtime OpenAI chấp nhận tên sự kiện Realtime 2 hiện tại và các bí danh cũ tương thích với Codex cho sự kiện âm thanh đầu ra và bản chép lời, nên các snapshot nhà cung cấp tương thích có thể thay đổi mà không làm mất âm thanh trợ lý.
- `voice.realtime.bargeIn` kiểm soát việc các sự kiện Discord báo người nói bắt đầu có ngắt phát lại realtime đang hoạt động hay không. Nếu không đặt, mục này đi theo thiết lập ngắt âm thanh đầu vào của nhà cung cấp realtime.
- `voice.realtime.minBargeInAudioEndMs` kiểm soát thời lượng phát lại tối thiểu của trợ lý trước khi một lần chen lời realtime OpenAI cắt ngắn âm thanh. Mặc định: `250`. Đặt `0` để ngắt ngay trong phòng ít vọng, hoặc tăng lên cho các thiết lập loa nhiều tiếng vọng.
- Với giọng OpenAI khi phát lại trên Discord, đặt `voice.tts.provider: "openai"` và chọn một giọng Chuyển văn bản thành giọng nói trong `voice.tts.openai.voice` hoặc `voice.tts.providers.openai.voice`. `cedar` là lựa chọn nghe nam tính tốt trên mô hình TTS OpenAI hiện tại.
- Các ghi đè `systemPrompt` Discord theo kênh áp dụng cho các lượt bản chép lời giọng nói của kênh giọng nói đó.
- Các lượt bản chép lời giọng nói suy ra trạng thái owner từ Discord `allowFrom` (hoặc `dm.allowFrom`); người nói không phải owner không thể truy cập các công cụ chỉ dành cho owner (ví dụ `gateway` và `cron`).
- Giọng nói Discord là opt-in đối với cấu hình chỉ văn bản; đặt `channels.discord.voice.enabled=true` (hoặc giữ một khối `channels.discord.voice` hiện có) để bật lệnh `/vc`, runtime giọng nói và intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng việc đăng ký intent trạng thái giọng nói. Để trống để intent đi theo việc bật giọng nói hiệu lực.
- Nếu `voice.autoJoin` có nhiều mục cho cùng một guild, OpenClaw tham gia kênh được cấu hình cuối cùng cho guild đó.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được truyền qua các tùy chọn tham gia của `@discordjs/voice`.
- Mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu không đặt.
- OpenClaw mặc định dùng bộ giải mã `opusscript` pure-JS để nhận giọng nói Discord. Gói native tùy chọn `@discordjs/opus` bị chính sách cài đặt pnpm của repo bỏ qua để các lượt cài đặt thông thường, Docker lane và các bài kiểm thử không liên quan không biên dịch native addon. Các máy chủ chuyên cho hiệu năng giọng nói có thể opt in bằng `OPENCLAW_DISCORD_OPUS_DECODER=native` sau khi cài native addon.
- `voice.connectTimeoutMs` kiểm soát thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần thử tự động tham gia. Mặc định: `30000`.
- `voice.reconnectGraceMs` kiểm soát thời gian OpenClaw chờ một phiên giọng nói đã ngắt kết nối bắt đầu kết nối lại trước khi hủy phiên đó. Mặc định: `15000`.
- Trong chế độ `stt-tts`, phát lại giọng nói không dừng chỉ vì người dùng khác bắt đầu nói. Để tránh vòng lặp phản hồi âm thanh, OpenClaw bỏ qua thu giọng nói mới trong khi TTS đang phát; hãy nói sau khi phát lại kết thúc cho lượt tiếp theo. Các chế độ realtime chuyển tiếp việc người nói bắt đầu như tín hiệu chen lời đến nhà cung cấp realtime.
- Trong các chế độ realtime, tiếng vọng từ loa vào mic đang mở có thể trông giống như chen lời và ngắt phát lại. Với các phòng Discord nhiều tiếng vọng, đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` để ngăn OpenAI tự động ngắt khi có âm thanh đầu vào. Thêm `voice.realtime.bargeIn: true` nếu bạn vẫn muốn sự kiện Discord báo người nói bắt đầu ngắt phát lại đang hoạt động. Cầu nối realtime OpenAI bỏ qua các lần cắt ngắn phát lại ngắn hơn `voice.realtime.minBargeInAudioEndMs` vì có khả năng là tiếng vọng/nhiễu, và ghi log chúng là đã bỏ qua thay vì xóa phát lại Discord.
- `voice.captureSilenceGraceMs` kiểm soát thời gian OpenClaw chờ sau khi Discord báo một người nói đã dừng trước khi hoàn tất phân đoạn âm thanh đó cho STT. Mặc định: `2500`; tăng giá trị này nếu Discord tách các quãng dừng bình thường thành các bản chép lời một phần bị vụn.
- Khi ElevenLabs là nhà cung cấp TTS được chọn, phát lại giọng nói Discord dùng TTS dạng streaming và bắt đầu từ stream phản hồi của nhà cung cấp. Các nhà cung cấp không hỗ trợ streaming sẽ quay về đường dẫn tệp tạm đã tổng hợp.
- OpenClaw cũng theo dõi lỗi giải mã nhận và tự động khôi phục bằng cách rời/tham gia lại kênh giọng nói sau các lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu log nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và log. Dòng `@discordjs/voice` đi kèm bao gồm bản sửa padding upstream từ PR discord.js #11449, đã đóng issue discord.js #11419.
- Các sự kiện nhận `The operation was aborted` là dự kiến khi OpenClaw hoàn tất một phân đoạn người nói đã thu; chúng là chẩn đoán chi tiết, không phải cảnh báo.
- Log giọng nói Discord chi tiết bao gồm bản xem trước bản chép lời STT một dòng có giới hạn cho từng phân đoạn người nói được chấp nhận, để việc gỡ lỗi hiển thị cả phía người dùng và phía phản hồi agent mà không đổ ra văn bản bản chép lời không giới hạn.
- Trong chế độ `agent-proxy`, fallback tham vấn bắt buộc bỏ qua các mảnh bản chép lời có khả năng chưa hoàn chỉnh, chẳng hạn văn bản kết thúc bằng `...` hoặc một từ nối ở cuối như `and`, cộng với các câu kết rõ ràng không thể hành động như “be right back” hoặc “bye”. Log hiển thị `forced agent consult skipped reason=...` khi việc này ngăn một câu trả lời đã xếp hàng bị cũ.

Thiết lập opus native cho checkout nguồn:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Dùng Node 22 cho Gateway khi bạn muốn native addon dựng sẵn upstream cho macOS arm64. Nếu dùng runtime Node khác, trình cài đặt opt-in có thể cần toolchain build từ nguồn `node-gyp` cục bộ.

Sau khi cài native addon, khởi động Gateway bằng:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Log giọng nói chi tiết sẽ hiển thị `discord voice: opus decoder: @discordjs/opus`. Nếu không opt in bằng env, hoặc nếu native addon bị thiếu hay không thể tải trên host, OpenClaw ghi log `discord voice: opus decoder: opusscript` và tiếp tục nhận giọng nói qua fallback pure-JS.

Pipeline STT cộng với TTS:

- Thu PCM Discord được chuyển thành tệp tạm WAV.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản chép lời được gửi qua ingress và định tuyến Discord trong khi LLM phản hồi chạy với chính sách đầu ra giọng nói ẩn công cụ agent `tts` và yêu cầu trả về văn bản, vì giọng nói Discord sở hữu lần phát TTS cuối cùng.
- `voice.model`, khi được đặt, chỉ ghi đè LLM phản hồi cho lượt kênh giọng nói này.
- `voice.tts` được hợp nhất đè lên `messages.tts`; các nhà cung cấp có khả năng streaming cấp trực tiếp cho trình phát, nếu không tệp âm thanh kết quả sẽ được phát trong kênh đã tham gia.

Ví dụ phiên kênh giọng nói agent-proxy mặc định:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Khi không có khối `voice.agentSession`, mỗi kênh giọng nói có phiên OpenClaw được định tuyến riêng. Ví dụ, `/vc join channel:234567890123456789` nói chuyện với phiên cho kênh giọng nói Discord đó. Mô hình realtime chỉ là giao diện giọng nói; các yêu cầu thực chất được chuyển cho agent OpenClaw đã cấu hình. Nếu mô hình realtime tạo bản chép lời cuối cùng mà không gọi công cụ tham vấn, OpenClaw bắt buộc tham vấn như một fallback để mặc định vẫn hoạt động như đang nói chuyện với agent.

Ví dụ STT cộng với TTS cũ:

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Ví dụ realtime bidi:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Giọng nói như phần mở rộng của một phiên kênh Discord hiện có:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Trong chế độ `agent-proxy`, bot tham gia kênh giọng nói đã cấu hình, nhưng các lượt agent OpenClaw dùng phiên và agent được định tuyến bình thường của kênh đích. Phiên giọng nói realtime nói kết quả trả về vào kênh giọng nói. Agent giám sát vẫn có thể dùng các công cụ nhắn tin bình thường theo chính sách công cụ của nó, bao gồm gửi một tin nhắn Discord riêng nếu đó là hành động đúng.

Các dạng đích hữu ích:

- `target: "channel:123456789012345678"` định tuyến qua một phiên kênh văn bản Discord.
- `target: "123456789012345678"` được xử lý như một đích kênh.
- `target: "dm:123456789012345678"` hoặc `target: "user:123456789012345678"` định tuyến qua phiên tin nhắn trực tiếp đó.

Ví dụ OpenAI Realtime nhiều tiếng vọng:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

Dùng cấu hình này khi mô hình nghe thấy âm thanh phát lại Discord của chính nó qua mic đang mở, nhưng bạn vẫn muốn ngắt nó bằng cách nói. OpenClaw ngăn OpenAI tự động ngắt theo âm thanh đầu vào thô, trong khi `bargeIn: true` cho phép các sự kiện bắt đầu nói của loa Discord và âm thanh của người nói đang hoạt động hủy các phản hồi thời gian thực đang hoạt động trước khi lượt được thu tiếp theo đến OpenAI. Các tín hiệu ngắt lời rất sớm có `audioEndMs` thấp hơn `minBargeInAudioEndMs` được xem là có khả năng là tiếng vọng/nhiễu và bị bỏ qua để mô hình không bị ngắt ngay ở khung phát lại đầu tiên.

Nhật ký thoại dự kiến:

- Khi tham gia: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Khi bắt đầu thời gian thực: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Khi có âm thanh người nói: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, và `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Khi bỏ qua lời nói cũ: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` hoặc `reason=non-actionable-closing ...`
- Khi hoàn tất phản hồi thời gian thực: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Khi dừng/đặt lại phát lại: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Khi tham vấn thời gian thực: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Khi tác tử trả lời: `discord voice: agent turn answer ...`
- Khi xếp hàng lời nói chính xác: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, theo sau là `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Khi phát hiện ngắt lời: `discord voice: realtime barge-in detected source=speaker-start ...` hoặc `discord voice: realtime barge-in detected source=active-speaker-audio ...`, theo sau là `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Khi gián đoạn thời gian thực: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, theo sau là `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` hoặc `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Khi bỏ qua tiếng vọng/nhiễu: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Khi ngắt lời bị tắt: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Khi phát lại đang rảnh: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Để gỡ lỗi âm thanh bị cắt, hãy đọc nhật ký thoại thời gian thực như một dòng thời gian:

1. `realtime audio playback started` nghĩa là Discord đã bắt đầu phát âm thanh của trợ lý. Cầu nối bắt đầu đếm các đoạn đầu ra của trợ lý, byte PCM Discord, byte thời gian thực của nhà cung cấp, và thời lượng âm thanh được tổng hợp từ thời điểm này.
2. `realtime speaker turn opened` đánh dấu một người nói Discord bắt đầu hoạt động. Nếu phát lại đã hoạt động và `bargeIn` được bật, sự kiện này có thể được theo sau bởi `barge-in detected source=speaker-start`.
3. `realtime input audio started` đánh dấu khung âm thanh thực tế đầu tiên nhận được cho lượt người nói đó. `outputActive=true` hoặc `outputAudioMs` khác 0 ở đây nghĩa là mic đang gửi đầu vào trong khi phát lại của trợ lý vẫn đang hoạt động.
4. `barge-in detected source=active-speaker-audio` nghĩa là OpenClaw thấy âm thanh người nói trực tiếp trong khi phát lại của trợ lý đang hoạt động. Điều này hữu ích để phân biệt một lần ngắt thật với một sự kiện bắt đầu nói của Discord không có âm thanh hữu ích.
5. `barge-in requested reason=...` nghĩa là OpenClaw đã yêu cầu nhà cung cấp thời gian thực hủy hoặc cắt ngắn phản hồi đang hoạt động. Dòng này bao gồm `outputAudioMs`, `outputActive`, và `playbackChunks` để bạn có thể thấy lượng âm thanh trợ lý đã thực sự phát trước khi bị ngắt.
6. `realtime audio playback stopped reason=...` là điểm đặt lại phát lại Discord cục bộ. Lý do cho biết ai đã dừng phát lại: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, hoặc `session-close`.
7. `realtime speaker turn closed` tóm tắt lượt đầu vào đã thu. `chunks=0` hoặc `hasAudio=false` nghĩa là lượt người nói đã mở nhưng không có âm thanh dùng được nào đến cầu nối thời gian thực. `interruptedPlayback=true` nghĩa là lượt đầu vào đó chồng lấn với đầu ra của trợ lý và kích hoạt logic ngắt lời.

Các trường hữu ích:

- `outputAudioMs`: thời lượng âm thanh trợ lý do nhà cung cấp thời gian thực tạo trước dòng nhật ký.
- `audioMs`: thời lượng âm thanh trợ lý mà OpenClaw đã đếm trước khi phát lại dừng.
- `elapsedMs`: thời gian đồng hồ thực giữa lúc mở và đóng luồng phát lại hoặc lượt người nói.
- `discordBytes`: byte PCM stereo 48 kHz được gửi đến hoặc nhận từ thoại Discord.
- `realtimeBytes`: byte PCM theo định dạng nhà cung cấp được gửi đến hoặc nhận từ nhà cung cấp thời gian thực.
- `playbackChunks`: các đoạn âm thanh trợ lý được chuyển tiếp đến Discord cho phản hồi đang hoạt động.
- `sinceLastAudioMs`: khoảng cách giữa khung âm thanh người nói được thu cuối cùng và lúc đóng lượt người nói.

Các mẫu thường gặp:

- Bị cắt ngay với `source=active-speaker-audio`, `outputAudioMs` nhỏ, và cùng người dùng ở gần thường cho thấy tiếng vọng loa lọt vào mic. Tăng `voice.realtime.minBargeInAudioEndMs`, giảm âm lượng loa, dùng tai nghe, hoặc đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` theo sau bởi `speaker turn closed ... hasAudio=false` nghĩa là Discord đã báo người nói bắt đầu nhưng không có âm thanh nào đến OpenClaw. Đó có thể là sự kiện thoại Discord thoáng qua, hành vi cổng nhiễu, hoặc một ứng dụng khách kích mic trong thời gian rất ngắn.
- `audio playback stopped reason=stream-close` mà không có ngắt lời gần đó hoặc `provider-clear-audio` nghĩa là luồng phát lại Discord cục bộ đã kết thúc ngoài dự kiến. Kiểm tra các nhật ký nhà cung cấp và trình phát Discord trước đó.
- `capture ignored during playback (barge-in disabled)` nghĩa là OpenClaw cố ý bỏ đầu vào trong khi âm thanh trợ lý đang hoạt động. Bật `voice.realtime.bargeIn` nếu bạn muốn lời nói ngắt phát lại.
- `barge-in ignored ... outputActive=false` nghĩa là Discord hoặc VAD của nhà cung cấp đã báo có lời nói, nhưng OpenClaw không có phát lại đang hoạt động để ngắt. Điều này không nên cắt âm thanh.

Thông tin đăng nhập được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, xác thực TTS cho `messages.tts`/`voice.tts`, và xác thực nhà cung cấp thời gian thực cho `voice.realtime.providers` hoặc cấu hình xác thực thông thường của nhà cung cấp.

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
  <Accordion title="Đã dùng intent không được phép hoặc bot không thấy tin nhắn guild nào">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào phân giải người dùng/thành viên
    - khởi động lại Gateway sau khi thay đổi intent

  </Accordion>

  <Accordion title="Tin nhắn guild bị chặn ngoài dự kiến">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép guild trong `channels.discord.guilds`
    - nếu bản đồ `channels` của guild tồn tại, chỉ các kênh được liệt kê mới được phép
    - xác minh hành vi `requireMention` và các mẫu nhắc đến

    Các kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Yêu cầu nhắc đến là false nhưng vẫn bị chặn">
    Nguyên nhân thường gặp:

    - `groupPolicy="allowlist"` mà không có danh sách cho phép guild/kênh khớp
    - `requireMention` được cấu hình sai vị trí (phải nằm dưới `channels.discord.guilds` hoặc mục nhập kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của guild/kênh

  </Accordion>

  <Accordion title="Lượt Discord chạy lâu hoặc trả lời trùng lặp">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Các núm chỉnh hàng đợi Gateway Discord:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - mục này chỉ kiểm soát công việc listener Gateway Discord, không kiểm soát thời lượng lượt tác tử

    Discord không áp dụng timeout thuộc sở hữu kênh cho các lượt tác tử đã xếp hàng. Listener tin nhắn bàn giao ngay lập tức, và các lần chạy Discord đã xếp hàng giữ thứ tự theo phiên cho đến khi vòng đời phiên/công cụ/runtime hoàn tất hoặc hủy bỏ công việc.

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

  <Accordion title="Cảnh báo timeout tra cứu metadata Gateway">
    OpenClaw lấy metadata `/gateway/bot` của Discord trước khi kết nối. Lỗi tạm thời sẽ dự phòng về URL Gateway mặc định của Discord và bị giới hạn tần suất trong nhật ký.

    Các núm chỉnh timeout metadata:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - dự phòng env khi cấu hình chưa được đặt: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Gateway khởi động lại do timeout READY">
    OpenClaw chờ sự kiện Gateway `READY` của Discord trong khi khởi động và sau các lần kết nối lại runtime. Các thiết lập nhiều tài khoản có giãn cách khởi động có thể cần cửa sổ READY khi khởi động dài hơn mặc định.

    Các núm chỉnh timeout READY:

    - khởi động một tài khoản: `channels.discord.gatewayReadyTimeoutMs`
    - khởi động nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - dự phòng env khi cấu hình khởi động chưa được đặt: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - mặc định khi khởi động: `15000` (15 giây), tối đa: `120000`
    - runtime một tài khoản: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - dự phòng env khi cấu hình runtime chưa được đặt: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - mặc định runtime: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Không khớp khi kiểm toán quyền">
    Các kiểm tra quyền `channels status --probe` chỉ hoạt động với ID kênh dạng số.

    Nếu bạn dùng khóa slug, đối sánh runtime vẫn có thể hoạt động, nhưng probe không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="Vấn đề DM và ghép cặp">

    - DM bị tắt: `channels.discord.dm.enabled=false`
    - chính sách DM bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép cặp ở chế độ `pairing`

  </Accordion>

  <Accordion title="Vòng lặp bot với bot">
    Theo mặc định, tin nhắn do bot tạo sẽ bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng quy tắc đề cập và danh sách cho phép nghiêm ngặt để tránh hành vi lặp vòng.
    Nên dùng `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn từ bot có đề cập đến bot đó.

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

  <Accordion title="Voice STT bị ngắt với DecryptionFailed(...)">

    - giữ OpenClaw ở phiên bản hiện tại (`openclaw update`) để có logic khôi phục nhận giọng nói Discord
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu từ `channels.discord.voice.decryptionFailureTolerance=24` (mặc định upstream) và chỉ tinh chỉnh nếu cần
    - theo dõi nhật ký để tìm:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi vẫn tiếp diễn sau khi tự động tham gia lại, hãy thu thập nhật ký và so sánh với lịch sử nhận DAVE upstream trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) và [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- phát trực tuyến: `streaming` (bí danh cũ: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- phương tiện/thử lại: `mediaMaxMb` (giới hạn tải lên Discord gửi ra, mặc định `100MB`), `retry`
- hành động: `actions.*`
- hiện diện: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là bí mật (nên dùng `DISCORD_BOT_TOKEN` trong môi trường được giám sát).
- Cấp quyền Discord theo nguyên tắc đặc quyền tối thiểu.
- Nếu triển khai/trạng thái lệnh đã cũ, hãy khởi động lại gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Discord với gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Trò chuyện nhóm và hành vi danh sách cho phép.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến tác tử.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình đe dọa và gia cố.
  </Card>
  <Card title="Định tuyến đa tác tử" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ guild và kênh tới tác tử.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh native.
  </Card>
</CardGroup>
