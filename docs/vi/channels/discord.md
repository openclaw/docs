---
read_when:
    - Phát triển các tính năng kênh Discord
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Sẵn sàng cho DM và các kênh guild thông qua Gateway chính thức của Discord.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM Discord mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Quy trình chẩn đoán và sửa lỗi xuyên kênh.
  </Card>
</CardGroup>

## Thiết lập nhanh

Bạn cần tạo một ứng dụng mới có bot, thêm bot vào máy chủ của bạn, rồi ghép nối bot đó với OpenClaw. Chúng tôi khuyến nghị thêm bot vào máy chủ riêng của chính bạn. Nếu bạn chưa có máy chủ, hãy [tạo một máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng và bot Discord">
    Truy cập [Discord Developer Portal](https://discord.com/developers/applications) và nhấp **New Application**. Đặt tên kiểu như "OpenClaw".

    Nhấp **Bot** trên thanh bên. Đặt **Username** thành tên bạn dùng để gọi agent OpenClaw của mình.

  </Step>

  <Step title="Bật privileged intents">
    Vẫn trên trang **Bot**, cuộn xuống **Privileged Gateway Intents** và bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; bắt buộc cho danh sách cho phép theo vai trò và khớp tên với ID)
    - **Presence Intent** (không bắt buộc; chỉ cần cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Sao chép token bot của bạn">
    Cuộn lại lên trên trang **Bot** và nhấp **Reset Token**.

    <Note>
    Dù tên là vậy, thao tác này tạo token đầu tiên của bạn — không có gì đang được "đặt lại."
    </Note>

    Sao chép token và lưu ở đâu đó. Đây là **Bot Token** của bạn và bạn sẽ cần nó ngay sau đây.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào máy chủ của bạn">
    Nhấp **OAuth2** trên thanh bên. Bạn sẽ tạo URL mời với đúng quyền để thêm bot vào máy chủ của mình.

    Cuộn xuống **OAuth2 URL Generator** và bật:

    - `bot`
    - `applications.commands`

    Phần **Bot Permissions** sẽ xuất hiện bên dưới. Bật ít nhất:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (không bắt buộc)

    Đây là tập quyền cơ sở cho các kênh văn bản thông thường. Nếu bạn dự định đăng trong các thread Discord, bao gồm quy trình kênh forum hoặc media tạo hoặc tiếp tục một thread, hãy bật cả **Send Messages in Threads**.
    Sao chép URL được tạo ở cuối, dán vào trình duyệt, chọn máy chủ của bạn, rồi nhấp **Continue** để kết nối. Bây giờ bạn sẽ thấy bot của mình trong máy chủ Discord.

  </Step>

  <Step title="Bật Developer Mode và thu thập ID của bạn">
    Quay lại ứng dụng Discord, bạn cần bật Developer Mode để có thể sao chép ID nội bộ.

    1. Nhấp **User Settings** (biểu tượng bánh răng cạnh ảnh đại diện của bạn) → **Advanced** → bật **Developer Mode**
    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trên thanh bên → **Copy Server ID**
    3. Nhấp chuột phải vào **ảnh đại diện của chính bạn** → **Copy User ID**

    Lưu **Server ID** và **User ID** cùng với Bot Token của bạn — bạn sẽ gửi cả ba cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Cho phép DM từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord cần cho phép bot gửi DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn → **Privacy Settings** → bật **Direct Messages**.

    Điều này cho phép thành viên máy chủ (bao gồm bot) gửi DM cho bạn. Giữ bật thiết lập này nếu bạn muốn dùng DM Discord với OpenClaw. Nếu bạn chỉ định dùng kênh guild, bạn có thể tắt DM sau khi ghép nối.

  </Step>

  <Step title="Thiết lập token bot an toàn (không gửi trong chat)">
    Token bot Discord của bạn là bí mật (giống mật khẩu). Thiết lập nó trên máy đang chạy OpenClaw trước khi nhắn tin cho agent của bạn.

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
    Với bản cài đặt dịch vụ được quản lý, chạy `openclaw gateway install` từ shell có `DISCORD_BOT_TOKEN`, hoặc lưu biến này trong `~/.openclaw/.env`, để dịch vụ có thể phân giải SecretRef env sau khi khởi động lại.
    Nếu host của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/client Discord từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó. Dùng `channels.discord.applicationId` cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.applicationId` khi bạn chạy nhiều bot Discord.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Chat với agent OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ Telegram) và nói với nó. Nếu Discord là kênh đầu tiên của bạn, hãy dùng tab CLI / cấu hình thay thế.

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

        Dự phòng env cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Với thiết lập bằng script hoặc từ xa, ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run` rồi chạy lại không có `--dry-run`. Giá trị `token` dạng văn bản thuần được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các provider env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Với nhiều bot Discord, giữ từng token bot và ID ứng dụng trong tài khoản tương ứng. `channels.discord.applicationId` cấp cao nhất được các tài khoản kế thừa, nên chỉ đặt nó ở đó khi mọi tài khoản đều nên dùng cùng một ID ứng dụng.

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

  <Step title="Phê duyệt lần ghép nối DM đầu tiên">
    Đợi đến khi Gateway đang chạy, rồi DM cho bot của bạn trong Discord. Bot sẽ phản hồi bằng mã ghép nối.

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

    Bây giờ bạn có thể chat với agent của mình trong Discord qua DM.

  </Step>
</Steps>

<Note>
Việc phân giải token nhận biết theo tài khoản. Giá trị token trong cấu hình thắng dự phòng env. `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord đang bật phân giải thành cùng một token bot, OpenClaw chỉ khởi động một trình giám sát Gateway cho token đó. Token từ cấu hình thắng dự phòng env mặc định; nếu không, tài khoản đang bật đầu tiên thắng và tài khoản trùng lặp được báo là đã tắt.
Với các lệnh gọi outbound nâng cao (hành động công cụ message/kênh), `token` rõ ràng theo từng lệnh gọi được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và đọc/thăm dò (ví dụ read/search/fetch/thread/pins/permissions). Thiết lập chính sách/thử lại của tài khoản vẫn đến từ tài khoản được chọn trong ảnh chụp runtime đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập workspace guild

Sau khi DM hoạt động, bạn có thể thiết lập máy chủ Discord của mình như một workspace đầy đủ, nơi mỗi kênh có phiên agent riêng với ngữ cảnh riêng. Cách này được khuyến nghị cho máy chủ riêng chỉ có bạn và bot của bạn.

<Steps>
  <Step title="Thêm máy chủ của bạn vào danh sách cho phép guild">
    Điều này cho phép agent của bạn phản hồi trong bất kỳ kênh nào trên máy chủ của bạn, không chỉ DM.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Thêm Discord Server ID `<server_id>` của tôi vào danh sách cho phép guild"
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
    Theo mặc định, agent của bạn chỉ phản hồi trong các kênh guild khi được @mention. Với máy chủ riêng, có lẽ bạn muốn agent phản hồi mọi tin nhắn.

    Trong các kênh guild, phản hồi cuối thông thường của assistant mặc định vẫn ở chế độ riêng tư. Đầu ra Discord hiển thị phải được gửi rõ ràng bằng công cụ `message`, để agent có thể mặc định theo dõi âm thầm và chỉ đăng khi quyết định phản hồi kênh là hữu ích.

    Điều này có nghĩa model được chọn phải gọi công cụ một cách đáng tin cậy. Nếu Discord hiển thị đang nhập và log cho thấy có dùng token nhưng không có tin nhắn được đăng, hãy kiểm tra log phiên để tìm văn bản assistant có `didSendViaMessagingTool: false`. Điều đó có nghĩa model đã tạo câu trả lời cuối riêng tư thay vì gọi `message(action=send)`. Chuyển sang model gọi công cụ mạnh hơn, hoặc dùng cấu hình bên dưới để khôi phục phản hồi cuối tự động kiểu cũ.

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
    Theo mặc định, bộ nhớ dài hạn (MEMORY.md) chỉ tải trong phiên DM. Kênh guild không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Khi tôi đặt câu hỏi trong các kênh Discord, hãy dùng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Nếu bạn cần ngữ cảnh dùng chung trong mọi kênh, hãy đặt các chỉ dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được chèn vào mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập chúng theo nhu cầu bằng công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo một vài kênh trên máy chủ Discord của bạn và bắt đầu chat. Agent của bạn có thể thấy tên kênh, và mỗi kênh có phiên cô lập riêng — nên bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất kỳ thứ gì phù hợp với quy trình làm việc của mình.

## Model runtime

- Gateway sở hữu kết nối Discord.
- Định tuyến trả lời có tính xác định: các phản hồi đầu vào từ Discord được trả về Discord.
- Siêu dữ liệu guild/kênh Discord được thêm vào lời nhắc mô hình dưới dạng ngữ cảnh không đáng tin cậy, không phải tiền tố trả lời hiển thị với người dùng. Nếu mô hình sao chép lại phần bao này, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi các phản hồi gửi đi và khỏi ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), các cuộc trò chuyện trực tiếp dùng chung phiên chính của tác nhân (`agent:main:main`).
- Kênh guild là các khóa phiên tách biệt (`agent:<agentId>:discord:channel:<channelId>`).
- DM nhóm bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Các lệnh slash gốc chạy trong các phiên lệnh tách biệt (`agent:<agentId>:discord:slash:<userId>`), trong khi vẫn mang `CommandTargetSessionKey` đến phiên hội thoại được định tuyến.
- Việc gửi thông báo Cron/Heartbeat chỉ có văn bản đến Discord sử dụng câu trả lời cuối cùng hiển thị với trợ lý một lần. Các tải phương tiện và thành phần có cấu trúc vẫn là nhiều tin nhắn khi tác nhân phát ra nhiều tải có thể gửi.

## Kênh diễn đàn

Kênh diễn đàn và kênh phương tiện của Discord chỉ chấp nhận bài đăng trong luồng. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn đến diễn đàn cha (`channel:<forumId>`) để tự động tạo một luồng. Tiêu đề luồng dùng dòng không trống đầu tiên trong tin nhắn của bạn.
- Dùng `openclaw message thread create` để tạo luồng trực tiếp. Không truyền `--message-id` cho kênh diễn đàn.

Ví dụ: gửi đến diễn đàn cha để tạo một luồng

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ví dụ: tạo một luồng diễn đàn rõ ràng

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Diễn đàn cha không chấp nhận thành phần Discord. Nếu bạn cần thành phần, hãy gửi đến chính luồng đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ vùng chứa thành phần Discord v2 cho tin nhắn của tác nhân. Dùng công cụ tin nhắn với tải `components`. Kết quả tương tác được định tuyến trở lại tác nhân dưới dạng tin nhắn đầu vào thông thường và tuân theo các cài đặt Discord `replyToMode` hiện có.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Kiểu chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép nút, menu chọn và biểu mẫu được dùng nhiều lần cho đến khi chúng hết hạn.

Để giới hạn người có thể nhấp một nút, hãy đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận một thông báo từ chối tạm thời.

Các lệnh slash `/model` và `/models` mở một bộ chọn mô hình tương tác với các danh sách thả xuống nhà cung cấp, mô hình và runtime tương thích, cộng với một bước Gửi. `/models add` đã không còn được khuyến nghị và giờ trả về thông báo ngừng dùng thay vì đăng ký mô hình từ chat. Phản hồi của bộ chọn là tạm thời và chỉ người dùng gọi lệnh mới có thể sử dụng. Menu chọn của Discord bị giới hạn ở 25 tùy chọn, vì vậy hãy thêm các mục `provider/*` vào `agents.defaults.models` khi bạn muốn bộ chọn chỉ hiển thị các mô hình được khám phá động cho những nhà cung cấp đã chọn, chẳng hạn như `openai-codex` hoặc `vllm`.

Tệp đính kèm:

- Khối `file` phải trỏ đến một tham chiếu tệp đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); dùng `media-gallery` cho nhiều tệp
- Dùng `filename` để ghi đè tên tải lên khi tên đó cần khớp với tham chiếu tệp đính kèm

Biểu mẫu modal:

- Thêm `components.modal` với tối đa 5 trường
- Kiểu trường: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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
    `channels.discord.dmPolicy` kiểm soát quyền truy cập DM. `channels.discord.allowFrom` là danh sách cho phép DM chuẩn.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.discord.allowFrom` bao gồm `"*"`)
    - `disabled`

    Nếu chính sách DM không mở, người dùng không xác định sẽ bị chặn (hoặc được nhắc ghép nối trong chế độ `pairing`).

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Với một tài khoản, `allowFrom` có ưu tiên hơn `dm.allowFrom` cũ.
    - Tài khoản có tên kế thừa `channels.discord.allowFrom` khi `allowFrom` riêng của chúng và `dm.allowFrom` cũ chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Định dạng mục tiêu DM để gửi:

    - `user:<id>`
    - lượt nhắc `<@id>`

    ID số trần thường được phân giải thành ID kênh khi một mặc định kênh đang hoạt động, nhưng các ID được liệt kê trong DM `allowFrom` hiệu lực của tài khoản được xử lý như mục tiêu DM người dùng để tương thích.

  </Tab>

  <Tab title="Access groups">
    DM Discord và ủy quyền lệnh văn bản có thể dùng các mục `accessGroup:<name>` động trong `channels.discord.allowFrom`.

    Tên nhóm truy cập được chia sẻ giữa các kênh tin nhắn. Dùng `type: "message.senders"` cho một nhóm tĩnh có thành viên được biểu diễn theo cú pháp `allowFrom` thông thường của từng kênh, hoặc `type: "discord.channelAudience"` khi đối tượng `ViewChannel` hiện tại của một kênh Discord nên xác định tư cách thành viên động. Hành vi nhóm truy cập dùng chung được ghi lại tại đây: [Nhóm truy cập](/vi/channels/access-groups).

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

    Ví dụ: cho phép bất kỳ ai có thể thấy `#maintainers` gửi DM cho bot, trong khi vẫn đóng DM với tất cả những người khác.

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

    Bạn có thể kết hợp các mục động và tĩnh:

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

    Bật **Server Members Intent** trong Discord Developer Portal cho bot khi dùng nhóm truy cập theo đối tượng kênh. DM không bao gồm trạng thái thành viên guild, nên OpenClaw phân giải thành viên qua Discord REST tại thời điểm ủy quyền.

  </Tab>

  <Tab title="Guild policy">
    Việc xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Đường cơ sở bảo mật khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được cho phép khi họ khớp với `users` HOẶC `roles`
    - khớp trực tiếp theo tên/thẻ bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` như chế độ tương thích phá kính khi cần
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng mục tên/thẻ
    - nếu một guild có cấu hình `channels`, các kênh không được liệt kê sẽ bị từ chối
    - nếu một guild không có khối `channels`, tất cả các kênh trong guild đã được đưa vào danh sách cho phép đó đều được cho phép

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

    Nếu bạn chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, dự phòng runtime là `groupPolicy="allowlist"` (có cảnh báo trong nhật ký), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Tin nhắn guild mặc định được kiểm soát bằng lượt nhắc.

    Phát hiện lượt nhắc bao gồm:

    - lượt nhắc bot rõ ràng
    - mẫu lượt nhắc đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm đến bot trong các trường hợp được hỗ trợ

    Khi viết tin nhắn Discord gửi đi, hãy dùng cú pháp lượt nhắc chuẩn: `<@USER_ID>` cho người dùng, `<#CHANNEL_ID>` cho kênh và `<@&ROLE_ID>` cho vai trò. Không dùng dạng lượt nhắc biệt danh cũ `<@!USER_ID>`.

    `requireMention` được cấu hình theo từng guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn loại bỏ tin nhắn có nhắc người dùng/vai trò khác nhưng không nhắc bot (không tính @everyone/@here).

    DM nhóm:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến tác nhân dựa trên vai trò

Dùng `bindings[].match.roles` để định tuyến thành viên guild Discord đến các tác nhân khác nhau theo ID vai trò. Binding dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau binding ngang hàng hoặc cha-ngang hàng và trước binding chỉ theo guild. Nếu một binding cũng đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả các trường đã cấu hình phải khớp.

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
- `commands.native=false` bỏ qua việc đăng ký và dọn dẹp lệnh slash của Discord trong quá trình khởi động. Các lệnh đã đăng ký trước đó có thể vẫn hiển thị trong Discord cho đến khi bạn xóa chúng khỏi ứng dụng Discord.
- Xác thực lệnh gốc dùng cùng danh sách cho phép/chính sách Discord như xử lý tin nhắn thông thường.
- Các lệnh vẫn có thể hiển thị trong UI Discord với người dùng không được ủy quyền; việc thực thi vẫn áp dụng xác thực OpenClaw và trả về "không được ủy quyền".

Xem [Lệnh slash](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

Cài đặt lệnh slash mặc định:

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

    Lưu ý: `off` tắt phân luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.
    `first` luôn gắn tham chiếu trả lời gốc ngầm định vào tin nhắn Discord gửi đi đầu tiên cho lượt đó.
    `batched` chỉ gắn tham chiếu trả lời gốc ngầm định của Discord khi
    lượt đến là một lô đã khử dội gồm nhiều tin nhắn. Điều này hữu ích
    khi bạn muốn trả lời gốc chủ yếu cho các cuộc trò chuyện bùng phát khó phân biệt, không phải mọi
    lượt một tin nhắn.

    ID tin nhắn được đưa vào ngữ cảnh/lịch sử để agent có thể nhắm tới các tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Bản xem trước phát trực tiếp">
    OpenClaw có thể stream bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa nó khi văn bản đến. `channels.discord.streaming` nhận `off` | `partial` | `block` | `progress` (mặc định). `progress` giữ một bản nháp trạng thái có thể chỉnh sửa và cập nhật nó với tiến trình công cụ cho đến khi gửi bản cuối; nhãn khởi đầu dùng chung là một dòng cuộn, nên nó sẽ cuộn đi như phần còn lại khi có đủ công việc xuất hiện. `streamMode` là alias runtime kế thừa. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu về khóa chuẩn.

    Đặt `channels.discord.streaming.mode` thành `off` để tắt chỉnh sửa bản xem trước Discord. Nếu stream khối Discord được bật rõ ràng, OpenClaw bỏ qua stream xem trước để tránh stream hai lần.

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
    - `block` phát các khối cỡ bản nháp (dùng `draftChunk` để tinh chỉnh kích thước và điểm ngắt, được giới hạn bởi `textChunkLimit`).
    - Media, lỗi và bản cuối trả lời rõ ràng sẽ hủy các chỉnh sửa xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) kiểm soát việc cập nhật công cụ/tiến trình có dùng lại tin nhắn xem trước hay không.
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

    Stream xem trước chỉ hỗ trợ văn bản; trả lời media quay về cách gửi thông thường. Khi stream `block` được bật rõ ràng, OpenClaw bỏ qua stream xem trước để tránh stream hai lần.

  </Accordion>

  <Accordion title="Lịch sử, ngữ cảnh và hành vi thread">
    Ngữ cảnh lịch sử guild:

    - `channels.discord.historyLimit` mặc định `20`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` tắt

    Điều khiển lịch sử DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi thread:

    - Thread Discord được định tuyến như các phiên kênh và kế thừa cấu hình kênh cha trừ khi bị ghi đè.
    - Phiên thread kế thừa lựa chọn `/model` cấp phiên của kênh cha làm dự phòng chỉ cho model; lựa chọn `/model` cục bộ của thread vẫn được ưu tiên và lịch sử transcript cha không được sao chép trừ khi bật kế thừa transcript.
    - `channels.discord.thread.inheritParent` (mặc định `false`) cho phép các auto-thread mới khởi tạo từ transcript cha. Ghi đè theo từng tài khoản nằm dưới `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng của công cụ tin nhắn có thể phân giải mục tiêu DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong dự phòng kích hoạt giai đoạn trả lời.

    Chủ đề kênh được đưa vào dưới dạng ngữ cảnh **không đáng tin cậy**. Danh sách cho phép kiểm soát ai có thể kích hoạt agent, không phải là ranh giới biên tập lại ngữ cảnh bổ sung đầy đủ.

  </Accordion>

  <Accordion title="Phiên ràng buộc với thread cho subagent">
    Discord có thể ràng buộc một thread với mục tiêu phiên để các tin nhắn tiếp theo trong thread đó tiếp tục được định tuyến đến cùng phiên (bao gồm cả phiên subagent).

    Lệnh:

    - `/focus <target>` ràng buộc thread hiện tại/mới với mục tiêu subagent/phiên
    - `/unfocus` xóa ràng buộc thread hiện tại
    - `/agents` hiển thị các lượt chạy đang hoạt động và trạng thái ràng buộc
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động bỏ tập trung khi không hoạt động cho ràng buộc đã tập trung
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng cho ràng buộc đã tập trung

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
    - `spawnSessions` kiểm soát việc tự động tạo/ràng buộc thread cho `sessions_spawn({ thread: true })` và các lần sinh thread ACP. Mặc định: `true`.
    - `defaultSpawnContext` kiểm soát ngữ cảnh subagent gốc cho các lần sinh ràng buộc với thread. Mặc định: `"fork"`.
    - Các khóa `spawnSubagentSessions`/`spawnAcpSessions` không còn dùng được di chuyển bởi `openclaw doctor --fix`.
    - Nếu ràng buộc thread bị tắt cho một tài khoản, `/focus` và các thao tác ràng buộc thread liên quan sẽ không khả dụng.

    Xem [Sub-agent](/vi/tools/subagents), [Agent ACP](/vi/tools/acp-agents) và [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Ràng buộc kênh ACP bền vững">
    Với các workspace ACP ổn định "luôn bật", hãy cấu hình ràng buộc ACP có kiểu ở cấp cao nhất nhắm tới các cuộc trò chuyện Discord.

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

    - `/acp spawn codex --bind here` ràng buộc kênh hoặc thread hiện tại tại chỗ và giữ các tin nhắn tương lai trên cùng phiên ACP. Tin nhắn thread kế thừa ràng buộc kênh cha.
    - Trong một kênh hoặc thread đã ràng buộc, `/new` và `/reset` đặt lại cùng phiên ACP tại chỗ. Ràng buộc thread tạm thời có thể ghi đè phân giải mục tiêu khi đang hoạt động.
    - `spawnSessions` kiểm soát việc tạo/ràng buộc thread con qua `--thread auto|here`.

    Xem [Agent ACP](/vi/tools/acp-agents) để biết chi tiết hành vi ràng buộc.

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
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn đến.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - emoji nhận diện agent dự phòng (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Discord chấp nhận emoji unicode hoặc tên emoji tùy chỉnh.
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình">
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

  <Accordion title="Proxy Gateway">
    Định tuyến lưu lượng WebSocket Gateway Discord và tra cứu REST khi khởi động (ID ứng dụng + phân giải danh sách cho phép) qua proxy HTTP(S) với `channels.discord.proxy`.

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

    - danh sách cho phép có thể dùng `pk:<memberId>`
    - tên hiển thị của thành viên chỉ được khớp theo tên/slug khi `channels.discord.dangerouslyAllowNameMatching: true`
    - tra cứu dùng ID tin nhắn gốc và bị giới hạn theo cửa sổ thời gian
    - nếu tra cứu thất bại, tin nhắn được proxy được xử lý như tin nhắn bot và bị bỏ trừ khi `allowBots=true`

  </Accordion>

  <Accordion title="Alias đề cập gửi đi">
    Dùng `mentionAliases` khi agent cần các lượt đề cập gửi đi xác định cho người dùng Discord đã biết. Khóa là handle không có `@` ở đầu; giá trị là ID người dùng Discord. Handle không xác định, `@everyone`, `@here` và đề cập bên trong code span Markdown được giữ nguyên.

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

    Ví dụ stream:

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
    - 1: Đang phát trực tiếp (yêu cầu `activityUrl`)
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

    Tự động hiện diện ánh xạ mức khả dụng của runtime sang trạng thái Discord: healthy => online, degraded hoặc unknown => idle, exhausted hoặc unavailable => dnd. Ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ phần giữ chỗ `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord hỗ trợ xử lý phê duyệt bằng nút trong DM và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh gốc.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt thực thi gốc khi `enabled` chưa được đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt, từ `execApprovals.approvers` hoặc từ `commands.ownerAllowFrom`. Discord không suy luận người phê duyệt thực thi từ kênh `allowFrom`, `dm.allowFrom` cũ, hoặc tin nhắn trực tiếp `defaultTo`. Đặt `enabled: false` để tắt rõ ràng Discord dưới dạng ứng dụng phê duyệt gốc.

    Với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi lời nhắc phê duyệt và kết quả cuối cùng ở chế độ riêng tư. Trước tiên, OpenClaw thử DM Discord khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không có, OpenClaw quay về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt sẽ hiển thị trong kênh. Chỉ những người phê duyệt đã được phân giải mới có thể dùng các nút; người dùng khác nhận thông báo từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật gửi qua kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw quay về gửi qua DM.

    Discord cũng hiển thị các nút phê duyệt dùng chung được các kênh trò chuyện khác sử dụng. Bộ điều hợp Discord gốc chủ yếu bổ sung định tuyến DM cho người phê duyệt và phát tán ra kênh.
    Khi các nút đó xuất hiện, chúng là UX phê duyệt chính; OpenClaw
    chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết
    phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.
    Nếu runtime phê duyệt gốc của Discord không hoạt động, OpenClaw giữ cho
    lời nhắc `/approve <id> <decision>` xác định cục bộ hiển thị. Nếu
    runtime đang hoạt động nhưng không thể gửi thẻ gốc tới bất kỳ đích nào,
    OpenClaw gửi thông báo dự phòng trong cùng cuộc trò chuyện với lệnh `/approve`
    chính xác từ phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng máy khách Gateway dùng chung (`plugin:` ID phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Phê duyệt hết hạn sau 30 phút theo mặc định.

    Xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

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

| Nhóm hành động                                                                                                                                                           | Mặc định  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | đã bật   |
| roles                                                                                                                                                                    | đã tắt   |
| moderation                                                                                                                                                               | đã tắt   |
| presence                                                                                                                                                                 | đã tắt   |

## UI Components v2

OpenClaw dùng Discord components v2 cho phê duyệt thực thi và dấu mốc xuyên ngữ cảnh. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho UI tùy chỉnh (nâng cao; yêu cầu dựng payload component qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn được các container component của Discord sử dụng (hex).
- Đặt theo từng tài khoản bằng `channels.discord.accounts.<id>.ui.components.accentColor`.
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

## Giọng nói

Discord có hai bề mặt giọng nói riêng biệt: **kênh thoại** thời gian thực (cuộc trò chuyện liên tục) và **tệp đính kèm tin nhắn thoại** (định dạng xem trước dạng sóng). Gateway hỗ trợ cả hai.

### Kênh thoại

Danh sách kiểm tra thiết lập:

1. Bật Message Content Intent trong Discord Developer Portal.
2. Bật Server Members Intent khi dùng danh sách cho phép theo vai trò/người dùng.
3. Mời bot với phạm vi `bot` và `applications.commands`.
4. Cấp Connect, Speak, Send Messages và Read Message History trong kênh thoại đích.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Dùng `/vc join|leave|status` để điều khiển phiên. Lệnh sử dụng tác tử mặc định của tài khoản và tuân theo cùng các quy tắc danh sách cho phép và chính sách nhóm như các lệnh Discord khác.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Để kiểm tra quyền hiệu dụng của bot trước khi tham gia, chạy:

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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Ghi chú:

- `voice.tts` chỉ ghi đè `messages.tts` cho phát lại giọng nói `stt-tts`. Các chế độ thời gian thực dùng `voice.realtime.voice`.
- `voice.mode` kiểm soát luồng hội thoại. Mặc định là `agent-proxy`: một giao diện giọng nói thời gian thực xử lý thời điểm lượt nói, ngắt lời và phát lại, ủy quyền công việc nội dung cho tác tử OpenClaw được định tuyến thông qua `openclaw_agent_consult`, và xử lý kết quả như một lời nhắc Discord được nhập từ người nói đó. `stt-tts` giữ luồng STT theo lô cũ cộng với TTS. `bidi` cho phép mô hình thời gian thực trò chuyện trực tiếp đồng thời cung cấp `openclaw_agent_consult` cho bộ não OpenClaw.
- `voice.agentSession` kiểm soát cuộc hội thoại OpenClaw nào nhận các lượt thoại. Để trống để dùng phiên riêng của kênh thoại, hoặc đặt `{ mode: "target", target: "channel:<text-channel-id>" }` để biến kênh thoại thành phần mở rộng micrô/loa của một phiên kênh văn bản Discord hiện có, chẳng hạn như `#maintainers`.
- `voice.model` ghi đè bộ não tác tử OpenClaw cho phản hồi thoại Discord và các lượt tham vấn thời gian thực. Để trống để kế thừa mô hình tác tử được định tuyến. Nó tách biệt với `voice.realtime.model`.
- `agent-proxy` định tuyến lời nói qua `discord-voice`, giúp giữ nguyên ủy quyền chủ sở hữu/công cụ bình thường cho người nói và phiên đích nhưng ẩn công cụ `tts` của tác tử vì thoại Discord sở hữu việc phát lại. Theo mặc định, `agent-proxy` cấp cho lượt tham vấn quyền truy cập công cụ tương đương đầy đủ với chủ sở hữu đối với người nói là chủ sở hữu (`voice.realtime.toolPolicy: "owner"`) và ưu tiên mạnh việc tham vấn tác tử OpenClaw trước các câu trả lời có nội dung (`voice.realtime.consultPolicy: "always"`). Trong chế độ mặc định `always` đó, lớp thời gian thực không tự động nói phần đệm trước câu trả lời tham vấn; nó ghi lại và phiên âm lời nói, sau đó nói câu trả lời OpenClaw đã được định tuyến. Nếu nhiều câu trả lời tham vấn bắt buộc hoàn tất trong khi Discord vẫn đang phát câu trả lời đầu tiên, các câu trả lời lời nói chính xác sau đó được xếp hàng cho đến khi phát lại rảnh thay vì thay thế lời nói giữa câu.
- Trong chế độ `stt-tts`, STT dùng `tools.media.audio`; `voice.model` không ảnh hưởng đến phiên âm.
- Trong các chế độ thời gian thực, `voice.realtime.provider`, `voice.realtime.model` và `voice.realtime.voice` cấu hình phiên âm thanh thời gian thực. Với OpenAI Realtime 2 cộng với bộ não Codex, dùng `voice.realtime.model: "gpt-realtime-2"` và `voice.model: "openai-codex/gpt-5.5"`.
- Nhà cung cấp thời gian thực OpenAI chấp nhận tên sự kiện Realtime 2 hiện tại và các bí danh tương thích Codex kiểu cũ cho sự kiện âm thanh đầu ra và bản phiên âm, để các bản chụp nhà cung cấp tương thích có thể lệch mà không làm mất âm thanh trợ lý.
- `voice.realtime.bargeIn` kiểm soát việc sự kiện bắt đầu nói của người nói Discord có ngắt phát lại thời gian thực đang hoạt động hay không. Nếu chưa đặt, nó làm theo thiết lập ngắt âm thanh đầu vào của nhà cung cấp thời gian thực.
- `voice.realtime.minBargeInAudioEndMs` kiểm soát thời lượng phát lại tối thiểu của trợ lý trước khi một lần chen lời thời gian thực OpenAI cắt ngắn âm thanh. Mặc định: `250`. Đặt `0` để ngắt ngay trong phòng ít vọng, hoặc tăng giá trị này cho các thiết lập loa nhiều vọng.
- Đối với giọng OpenAI khi phát lại trên Discord, đặt `voice.tts.provider: "openai"` và chọn một giọng Text-to-speech trong `voice.tts.openai.voice` hoặc `voice.tts.providers.openai.voice`. `cedar` là một lựa chọn nghe nam tính tốt trên mô hình TTS OpenAI hiện tại.
- Các ghi đè `systemPrompt` Discord theo từng kênh áp dụng cho các lượt bản phiên âm thoại của kênh thoại đó.
- Các lượt bản phiên âm thoại suy ra trạng thái chủ sở hữu từ Discord `allowFrom` (hoặc `dm.allowFrom`); người nói không phải chủ sở hữu không thể truy cập các công cụ chỉ dành cho chủ sở hữu (ví dụ `gateway` và `cron`).
- Thoại Discord là tùy chọn bật thêm đối với cấu hình chỉ văn bản; đặt `channels.discord.voice.enabled=true` (hoặc giữ một khối `channels.discord.voice` hiện có) để bật lệnh `/vc`, runtime thoại và ý định Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng việc đăng ký ý định trạng thái thoại. Để trống để ý định đi theo trạng thái bật thoại hiệu lực.
- Nếu `voice.autoJoin` có nhiều mục cho cùng một guild, OpenClaw sẽ tham gia kênh được cấu hình cuối cùng cho guild đó.
- `voice.allowedChannels` là một danh sách cho phép cư trú tùy chọn. Để trống để cho phép `/vc join` vào bất kỳ kênh thoại Discord được ủy quyền nào. Khi được đặt, `/vc join`, tự động tham gia lúc khởi động và các lần di chuyển trạng thái thoại của bot bị giới hạn trong các mục `{ guildId, channelId }` được liệt kê. Đặt thành mảng rỗng để từ chối mọi lần tham gia thoại Discord. Nếu Discord di chuyển bot ra ngoài danh sách cho phép, OpenClaw rời kênh đó và tham gia lại đích tự động tham gia đã cấu hình khi có.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được truyền qua các tùy chọn tham gia của `@discordjs/voice`.
- Mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu chưa đặt.
- OpenClaw mặc định dùng bộ giải mã `opusscript` thuần JS cho nhận thoại Discord. Gói gốc tùy chọn `@discordjs/opus` bị bỏ qua theo chính sách cài đặt pnpm của repo để các cài đặt thông thường, các làn Docker và các bài kiểm thử không liên quan không biên dịch addon gốc. Các máy chủ hiệu năng thoại chuyên dụng có thể chọn dùng bằng `OPENCLAW_DISCORD_OPUS_DECODER=native` sau khi cài đặt addon gốc.
- `voice.connectTimeoutMs` kiểm soát thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần tự động tham gia. Mặc định: `30000`.
- `voice.reconnectGraceMs` kiểm soát thời gian OpenClaw chờ một phiên thoại đã ngắt kết nối bắt đầu kết nối lại trước khi hủy nó. Mặc định: `15000`.
- Trong chế độ `stt-tts`, phát lại thoại không dừng chỉ vì một người dùng khác bắt đầu nói. Để tránh vòng lặp phản hồi, OpenClaw bỏ qua việc thu giọng nói mới trong khi TTS đang phát; hãy nói sau khi phát lại hoàn tất cho lượt tiếp theo. Các chế độ thời gian thực chuyển tiếp lượt bắt đầu nói của người nói dưới dạng tín hiệu chen lời đến nhà cung cấp thời gian thực.
- Trong các chế độ thời gian thực, tiếng vọng từ loa vào micrô đang mở có thể trông giống như chen lời và ngắt phát lại. Với các phòng Discord nhiều vọng, đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` để ngăn OpenAI tự động ngắt khi có âm thanh đầu vào. Thêm `voice.realtime.bargeIn: true` nếu bạn vẫn muốn các sự kiện bắt đầu nói của người nói Discord ngắt phát lại đang hoạt động. Cầu nối thời gian thực OpenAI bỏ qua các lần cắt ngắn phát lại ngắn hơn `voice.realtime.minBargeInAudioEndMs` vì nhiều khả năng là vọng/nhiễu và ghi log là đã bỏ qua thay vì xóa phát lại Discord.
- `voice.captureSilenceGraceMs` kiểm soát thời gian OpenClaw chờ sau khi Discord báo rằng một người nói đã dừng trước khi hoàn tất phân đoạn âm thanh đó cho STT. Mặc định: `2500`; tăng giá trị này nếu Discord tách các khoảng dừng bình thường thành các bản phiên âm từng phần bị ngắt đoạn.
- Khi ElevenLabs là nhà cung cấp TTS được chọn, phát lại thoại Discord dùng TTS truyền phát và bắt đầu từ luồng phản hồi của nhà cung cấp. Các nhà cung cấp không hỗ trợ truyền phát sẽ quay lại đường dẫn tệp tạm đã tổng hợp.
- OpenClaw cũng theo dõi các lỗi giải mã khi nhận và tự động khôi phục bằng cách rời/tham gia lại kênh thoại sau nhiều lần lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu log nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và log. Dòng `@discordjs/voice` được đóng gói bao gồm bản sửa padding thượng nguồn từ PR discord.js #11449, đã đóng issue discord.js #11419.
- Các sự kiện nhận `The operation was aborted` là bình thường khi OpenClaw hoàn tất một phân đoạn người nói đã thu; chúng là chẩn đoán chi tiết, không phải cảnh báo.
- Log thoại Discord chi tiết bao gồm bản xem trước phiên âm STT một dòng có giới hạn cho mỗi phân đoạn người nói được chấp nhận, để việc gỡ lỗi hiển thị cả phía người dùng và phía phản hồi của tác tử mà không đổ văn bản phiên âm không giới hạn.
- Trong chế độ `agent-proxy`, phương án dự phòng tham vấn bắt buộc bỏ qua các mảnh bản phiên âm có khả năng chưa hoàn chỉnh, chẳng hạn như văn bản kết thúc bằng `...` hoặc một từ nối ở cuối như `and`, cộng với các câu kết rõ ràng không yêu cầu hành động như “quay lại ngay” hoặc “tạm biệt”. Log hiển thị `forced agent consult skipped reason=...` khi điều này ngăn một câu trả lời cũ trong hàng đợi.

Thiết lập opus gốc cho bản checkout từ mã nguồn:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Dùng Node 22 cho Gateway khi bạn muốn addon gốc dựng sẵn macOS arm64 từ thượng nguồn. Nếu bạn dùng runtime Node khác, trình cài đặt chọn dùng có thể cần chuỗi công cụ dựng từ nguồn `node-gyp` cục bộ.

Sau khi cài đặt addon gốc, khởi động Gateway bằng:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Log thoại chi tiết sẽ hiển thị `discord voice: opus decoder: @discordjs/opus`. Nếu không có env chọn dùng, hoặc nếu addon gốc bị thiếu hoặc không thể tải trên máy chủ, OpenClaw ghi log `discord voice: opus decoder: opusscript` và tiếp tục nhận thoại qua phương án dự phòng thuần JS.

Pipeline STT cộng với TTS:

- Thu PCM Discord được chuyển đổi thành tệp tạm WAV.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản phiên âm được gửi qua đường vào và định tuyến Discord trong khi LLM phản hồi chạy với chính sách đầu ra thoại ẩn công cụ `tts` của tác tử và yêu cầu văn bản trả về, vì thoại Discord sở hữu việc phát lại TTS cuối cùng.
- `voice.model`, khi được đặt, chỉ ghi đè LLM phản hồi cho lượt kênh thoại này.
- `voice.tts` được hợp nhất đè lên `messages.tts`; các nhà cung cấp có khả năng truyền phát sẽ cấp trực tiếp cho trình phát, nếu không tệp âm thanh kết quả sẽ được phát trong kênh đã tham gia.

Ví dụ phiên kênh thoại agent-proxy mặc định:

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

Khi không có khối `voice.agentSession`, mỗi kênh thoại sẽ có phiên OpenClaw được định tuyến riêng. Ví dụ, `/vc join channel:234567890123456789` nói chuyện với phiên của kênh thoại Discord đó. Mô hình thời gian thực chỉ là giao diện thoại phía trước; các yêu cầu nội dung được chuyển cho tác tử OpenClaw đã cấu hình. Nếu mô hình thời gian thực tạo bản phiên âm cuối cùng mà không gọi công cụ tham vấn, OpenClaw buộc tham vấn như một phương án dự phòng để mặc định vẫn hoạt động như đang nói chuyện với tác tử.

Ví dụ STT cộng với TTS kiểu cũ:

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

Ví dụ bidi thời gian thực:

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

Thoại dưới dạng phần mở rộng của một phiên kênh Discord hiện có:

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

Trong chế độ `agent-proxy`, bot tham gia kênh thoại đã cấu hình, nhưng các lượt tác tử OpenClaw dùng phiên và tác tử được định tuyến bình thường của kênh đích. Phiên thoại thời gian thực nói kết quả trả về vào lại kênh thoại. Tác tử giám sát vẫn có thể dùng các công cụ tin nhắn bình thường theo chính sách công cụ của nó, bao gồm gửi một tin nhắn Discord riêng nếu đó là hành động phù hợp.

Các dạng đích hữu ích:

- `target: "channel:123456789012345678"` định tuyến qua một phiên kênh văn bản Discord.
- `target: "123456789012345678"` được xử lý như một đích kênh.
- `target: "dm:123456789012345678"` hoặc `target: "user:123456789012345678"` định tuyến qua phiên tin nhắn trực tiếp đó.

Ví dụ OpenAI Realtime nhiều vọng:

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

Dùng cấu hình này khi mô hình nghe thấy âm thanh phát lại của chính nó trên Discord qua mic đang mở, nhưng bạn vẫn muốn ngắt nó bằng cách nói. OpenClaw ngăn OpenAI tự động ngắt khi có âm thanh đầu vào thô, trong khi `bargeIn: true` cho phép các sự kiện bắt đầu nói của loa Discord và âm thanh của người nói đã hoạt động hủy các phản hồi thời gian thực đang hoạt động trước khi lượt thu âm tiếp theo đến OpenAI. Các tín hiệu ngắt lời rất sớm có `audioEndMs` thấp hơn `minBargeInAudioEndMs` được xem là có khả năng là tiếng vọng/nhiễu và bị bỏ qua để mô hình không bị ngắt ngay ở khung phát lại đầu tiên.

Nhật ký thoại dự kiến:

- Khi tham gia: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Khi thời gian thực khởi động: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Khi có âm thanh từ người nói: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, và `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Khi bỏ qua lời nói cũ: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` hoặc `reason=non-actionable-closing ...`
- Khi phản hồi thời gian thực hoàn tất: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Khi dừng/đặt lại phát lại: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Khi tham vấn thời gian thực: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Khi agent trả lời: `discord voice: agent turn answer ...`
- Khi xếp hàng lời nói chính xác: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, theo sau là `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Khi phát hiện ngắt lời: `discord voice: realtime barge-in detected source=speaker-start ...` hoặc `discord voice: realtime barge-in detected source=active-speaker-audio ...`, theo sau là `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Khi ngắt thời gian thực: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, theo sau là `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` hoặc `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Khi bỏ qua tiếng vọng/nhiễu: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Khi tắt ngắt lời: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Khi phát lại đang rảnh: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Để gỡ lỗi âm thanh bị cắt, hãy đọc nhật ký thoại thời gian thực như một dòng thời gian:

1. `realtime audio playback started` nghĩa là Discord đã bắt đầu phát âm thanh của trợ lý. Từ thời điểm này, cầu nối bắt đầu đếm các đoạn đầu ra của trợ lý, byte PCM của Discord, byte thời gian thực của nhà cung cấp và thời lượng âm thanh tổng hợp.
2. `realtime speaker turn opened` đánh dấu một người nói Discord trở nên hoạt động. Nếu phát lại đã hoạt động và `bargeIn` được bật, điều này có thể được theo sau bởi `barge-in detected source=speaker-start`.
3. `realtime input audio started` đánh dấu khung âm thanh thực tế đầu tiên nhận được cho lượt nói đó. `outputActive=true` hoặc `outputAudioMs` khác 0 tại đây nghĩa là mic đang gửi đầu vào trong khi phát lại của trợ lý vẫn đang hoạt động.
4. `barge-in detected source=active-speaker-audio` nghĩa là OpenClaw đã thấy âm thanh người nói trực tiếp trong khi phát lại của trợ lý đang hoạt động. Điều này hữu ích để phân biệt một lần ngắt thực sự với sự kiện bắt đầu nói của Discord không có âm thanh hữu ích.
5. `barge-in requested reason=...` nghĩa là OpenClaw đã yêu cầu nhà cung cấp thời gian thực hủy hoặc cắt ngắn phản hồi đang hoạt động. Nhật ký này bao gồm `outputAudioMs`, `outputActive`, và `playbackChunks` để bạn có thể thấy thực tế đã phát bao nhiêu âm thanh của trợ lý trước khi bị ngắt.
6. `realtime audio playback stopped reason=...` là điểm đặt lại phát lại Discord cục bộ. Lý do cho biết ai đã dừng phát lại: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, hoặc `session-close`.
7. `realtime speaker turn closed` tóm tắt lượt đầu vào đã thu. `chunks=0` hoặc `hasAudio=false` nghĩa là lượt nói đã mở nhưng không có âm thanh dùng được đến cầu nối thời gian thực. `interruptedPlayback=true` nghĩa là lượt đầu vào đó chồng lấp với đầu ra của trợ lý và kích hoạt logic ngắt lời.

Các trường hữu ích:

- `outputAudioMs`: thời lượng âm thanh của trợ lý do nhà cung cấp thời gian thực tạo ra trước dòng nhật ký.
- `audioMs`: thời lượng âm thanh của trợ lý mà OpenClaw đã đếm trước khi phát lại dừng.
- `elapsedMs`: thời gian theo đồng hồ thực giữa lúc mở và đóng luồng phát lại hoặc lượt nói.
- `discordBytes`: byte PCM stereo 48 kHz được gửi đến hoặc nhận từ thoại Discord.
- `realtimeBytes`: byte PCM theo định dạng nhà cung cấp được gửi đến hoặc nhận từ nhà cung cấp thời gian thực.
- `playbackChunks`: các đoạn âm thanh của trợ lý được chuyển tiếp đến Discord cho phản hồi đang hoạt động.
- `sinceLastAudioMs`: khoảng cách giữa khung âm thanh người nói được thu cuối cùng và lúc lượt nói đóng.

Các mẫu thường gặp:

- Bị cắt ngay lập tức với `source=active-speaker-audio`, `outputAudioMs` nhỏ và cùng người dùng ở gần thường cho thấy tiếng vọng loa đi vào mic. Tăng `voice.realtime.minBargeInAudioEndMs`, giảm âm lượng loa, dùng tai nghe, hoặc đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` theo sau bởi `speaker turn closed ... hasAudio=false` nghĩa là Discord đã báo bắt đầu nói nhưng không có âm thanh nào đến OpenClaw. Đó có thể là sự kiện thoại Discord tạm thời, hành vi cổng nhiễu, hoặc một client bật mic trong chốc lát.
- `audio playback stopped reason=stream-close` mà không có ngắt lời gần đó hoặc `provider-clear-audio` nghĩa là luồng phát lại Discord cục bộ kết thúc ngoài dự kiến. Kiểm tra các nhật ký nhà cung cấp và trình phát Discord ngay trước đó.
- `capture ignored during playback (barge-in disabled)` nghĩa là OpenClaw cố ý bỏ đầu vào trong khi âm thanh của trợ lý đang hoạt động. Bật `voice.realtime.bargeIn` nếu bạn muốn lời nói ngắt phát lại.
- `barge-in ignored ... outputActive=false` nghĩa là VAD của Discord hoặc nhà cung cấp đã báo có lời nói, nhưng OpenClaw không có phát lại đang hoạt động để ngắt. Điều này không nên cắt âm thanh.

Thông tin xác thực được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, xác thực TTS cho `messages.tts`/`voice.tts`, và xác thực nhà cung cấp thời gian thực cho `voice.realtime.providers` hoặc cấu hình xác thực thông thường của nhà cung cấp.

### Tin nhắn thoại

Tin nhắn thoại Discord hiển thị bản xem trước dạng sóng và yêu cầu âm thanh OGG/Opus. OpenClaw tự động tạo dạng sóng, nhưng cần `ffmpeg` và `ffprobe` trên máy chủ Gateway để kiểm tra và chuyển đổi.

- Cung cấp **đường dẫn tệp cục bộ** (URL bị từ chối).
- Bỏ qua nội dung văn bản (Discord từ chối văn bản + tin nhắn thoại trong cùng payload).
- Mọi định dạng âm thanh đều được chấp nhận; OpenClaw chuyển đổi sang OGG/Opus khi cần.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào việc phân giải người dùng/thành viên
    - khởi động lại Gateway sau khi thay đổi intent

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép guild trong `channels.discord.guilds`
    - nếu tồn tại ánh xạ `channels` của guild, chỉ các kênh được liệt kê mới được phép
    - xác minh hành vi `requireMention` và các mẫu mention

    Các kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Nguyên nhân thường gặp:

    - `groupPolicy="allowlist"` không có danh sách cho phép guild/kênh khớp
    - `requireMention` được cấu hình sai vị trí (phải nằm dưới `channels.discord.guilds` hoặc mục kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của guild/kênh

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Các núm chỉnh hàng đợi Gateway Discord:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - mục này chỉ kiểm soát công việc listener của Gateway Discord, không kiểm soát thời lượng lượt agent

    Discord không áp dụng thời hạn chờ thuộc sở hữu kênh cho các lượt agent đang xếp hàng. Listener tin nhắn bàn giao ngay lập tức, và các lần chạy Discord đang xếp hàng giữ nguyên thứ tự theo phiên cho đến khi vòng đời phiên/công cụ/runtime hoàn tất hoặc hủy công việc.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw lấy metadata `/gateway/bot` của Discord trước khi kết nối. Lỗi tạm thời sẽ quay về URL Gateway mặc định của Discord và được giới hạn tần suất trong nhật ký.

    Các núm chỉnh thời hạn chờ metadata:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - dự phòng env khi cấu hình chưa đặt: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw đợi sự kiện Gateway `READY` của Discord trong lúc khởi động và sau các lần kết nối lại runtime. Thiết lập nhiều tài khoản có giãn cách khởi động có thể cần cửa sổ READY khi khởi động dài hơn mặc định.

    Các núm chỉnh thời hạn chờ READY:

    - khởi động một tài khoản: `channels.discord.gatewayReadyTimeoutMs`
    - khởi động nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - dự phòng env khi cấu hình khởi động chưa đặt: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - mặc định khởi động: `15000` (15 giây), tối đa: `120000`
    - runtime một tài khoản: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - dự phòng env runtime khi cấu hình chưa đặt: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - mặc định runtime: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Kiểm tra quyền của `channels status --probe` chỉ hoạt động với ID kênh dạng số.

    Nếu bạn dùng khóa slug, khớp runtime vẫn có thể hoạt động, nhưng probe không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM bị tắt: `channels.discord.dm.enabled=false`
    - chính sách DM bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép cặp trong chế độ `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Theo mặc định, các tin nhắn do bot tạo sẽ bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng các quy tắc nhắc đến và danh sách cho phép nghiêm ngặt để tránh hành vi lặp vòng.
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

  <Accordion title="STT giọng nói bị rớt với DecryptionFailed(...)">

    - giữ OpenClaw luôn cập nhật (`openclaw update`) để có logic khôi phục nhận giọng nói Discord
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu từ `channels.discord.voice.decryptionFailureTolerance=24` (mặc định upstream) và chỉ tinh chỉnh nếu cần
    - theo dõi nhật ký để tìm:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi vẫn tiếp diễn sau khi tự động tham gia lại, hãy thu thập nhật ký và so sánh với lịch sử nhận DAVE upstream trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) và [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Tài liệu tham khảo cấu hình

Tài liệu tham khảo chính: [Tài liệu tham khảo cấu hình - Discord](/vi/gateway/config-channels#discord).

<Accordion title="Các trường Discord tín hiệu cao">

- khởi động/xác thực: `enabled`, `token`, `accounts.*`, `allowBots`
- chính sách: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- lệnh: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- hàng đợi sự kiện: `eventQueue.listenerTimeout` (ngân sách listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- trả lời/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- phân phối: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- truyền phát: `streaming` (bí danh kế thừa: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- phương tiện/thử lại: `mediaMaxMb` (giới hạn lượt tải lên Discord đi ra, mặc định `100MB`), `retry`
- hành động: `actions.*`
- hiện diện: `activity`, `status`, `activityType`, `activityUrl`
- giao diện: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là bí mật (ưu tiên `DISCORD_BOT_TOKEN` trong môi trường được giám sát).
- Cấp quyền Discord theo nguyên tắc ít đặc quyền nhất.
- Nếu triển khai/trạng thái lệnh đã cũ, hãy khởi động lại Gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Discord với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi nhóm chat và danh sách cho phép.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến tới tác nhân.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Định tuyến đa tác nhân" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ guild và kênh tới tác nhân.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc.
  </Card>
</CardGroup>
