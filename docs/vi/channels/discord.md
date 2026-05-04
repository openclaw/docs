---
read_when:
    - Làm việc với các tính năng kênh Discord
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-04T02:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: df4e045e39f8977f779fe409abf41dad0d950c92f1230c51ff356343513df812
    source_path: channels/discord.md
    workflow: 16
---

Sẵn sàng cho DM và kênh guild thông qua Gateway Discord chính thức.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM Discord mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và luồng sửa chữa.
  </Card>
</CardGroup>

## Thiết lập nhanh

Bạn sẽ cần tạo một ứng dụng mới với bot, thêm bot vào máy chủ của bạn, rồi ghép nối bot với OpenClaw. Chúng tôi khuyên bạn nên thêm bot vào máy chủ riêng tư của chính bạn. Nếu chưa có, hãy [tạo một máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng và bot Discord">
    Đi tới [Discord Developer Portal](https://discord.com/developers/applications) và nhấp vào **New Application**. Đặt tên kiểu như "OpenClaw".

    Nhấp vào **Bot** trên thanh bên. Đặt **Username** thành bất cứ tên nào bạn gọi agent OpenClaw của mình.

  </Step>

  <Step title="Bật privileged intents">
    Vẫn ở trang **Bot**, cuộn xuống **Privileged Gateway Intents** và bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; bắt buộc cho danh sách cho phép theo vai trò và khớp tên với ID)
    - **Presence Intent** (tùy chọn; chỉ cần cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Sao chép token bot của bạn">
    Cuộn lại lên đầu trang **Bot** và nhấp vào **Reset Token**.

    <Note>
    Dù tên là vậy, thao tác này tạo token đầu tiên của bạn — không có gì đang bị "đặt lại".
    </Note>

    Sao chép token và lưu ở đâu đó. Đây là **Bot Token** của bạn và bạn sẽ cần nó ngay sau đây.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào máy chủ của bạn">
    Nhấp vào **OAuth2** trên thanh bên. Bạn sẽ tạo URL mời với đúng quyền để thêm bot vào máy chủ của mình.

    Cuộn xuống **OAuth2 URL Generator** và bật:

    - `bot`
    - `applications.commands`

    Một mục **Bot Permissions** sẽ xuất hiện bên dưới. Bật ít nhất:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (tùy chọn)

    Đây là bộ quyền nền tảng cho các kênh văn bản thông thường. Nếu bạn dự định đăng trong các thread Discord, bao gồm quy trình kênh diễn đàn hoặc kênh media tạo hoặc tiếp tục một thread, hãy bật thêm **Send Messages in Threads**.
    Sao chép URL được tạo ở cuối trang, dán vào trình duyệt, chọn máy chủ của bạn, rồi nhấp **Continue** để kết nối. Bây giờ bạn sẽ thấy bot của mình trong máy chủ Discord.

  </Step>

  <Step title="Bật Developer Mode và thu thập ID của bạn">
    Quay lại ứng dụng Discord, bạn cần bật Developer Mode để có thể sao chép ID nội bộ.

    1. Nhấp vào **User Settings** (biểu tượng bánh răng cạnh avatar của bạn) → **Advanced** → bật **Developer Mode**
    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trong thanh bên → **Copy Server ID**
    3. Nhấp chuột phải vào **avatar của chính bạn** → **Copy User ID**

    Lưu **Server ID** và **User ID** cùng với Bot Token của bạn — bạn sẽ gửi cả ba cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Cho phép DM từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord cần cho phép bot DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn → **Privacy Settings** → bật **Direct Messages**.

    Điều này cho phép thành viên máy chủ (bao gồm bot) gửi DM cho bạn. Giữ tùy chọn này bật nếu bạn muốn dùng DM Discord với OpenClaw. Nếu bạn chỉ định dùng kênh guild, bạn có thể tắt DM sau khi ghép nối.

  </Step>

  <Step title="Thiết lập token bot của bạn an toàn (không gửi trong chat)">
    Token bot Discord của bạn là bí mật (giống như mật khẩu). Thiết lập nó trên máy đang chạy OpenClaw trước khi nhắn tin cho agent của bạn.

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
    Với cài đặt dịch vụ được quản lý, chạy `openclaw gateway install` từ shell có sẵn `DISCORD_BOT_TOKEN`, hoặc lưu biến trong `~/.openclaw/.env`, để dịch vụ có thể phân giải SecretRef env sau khi khởi động lại.
    Nếu host của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/client Discord từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó. Dùng `channels.discord.applicationId` cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.applicationId` khi bạn chạy nhiều bot Discord.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Chat với agent OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ Telegram) và nói cho nó biết. Nếu Discord là kênh đầu tiên của bạn, hãy dùng tab CLI / cấu hình thay thế.

        > "Tôi đã đặt token bot Discord trong cấu hình. Vui lòng hoàn tất thiết lập Discord với User ID `<user_id>` và Server ID `<server_id>`."
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

        Với thiết lập bằng script hoặc từ xa, ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run` rồi chạy lại không có `--dry-run`. Giá trị `token` dạng văn bản thuần được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các provider env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Với nhiều bot Discord, giữ từng token bot và ID ứng dụng dưới tài khoản tương ứng. `channels.discord.applicationId` cấp cao nhất được kế thừa bởi các tài khoản, vì vậy chỉ đặt ở đó khi mọi tài khoản đều nên dùng cùng ID ứng dụng.

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
    Chờ đến khi Gateway đang chạy, rồi DM bot của bạn trong Discord. Bot sẽ phản hồi bằng mã ghép nối.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
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

    Mã ghép nối hết hạn sau 1 giờ.

    Bây giờ bạn có thể chat với agent của mình trong Discord qua DM.

  </Step>
</Steps>

<Note>
Phân giải token có nhận biết tài khoản. Giá trị token trong cấu hình thắng env fallback. `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord đã bật phân giải thành cùng một token bot, OpenClaw chỉ khởi động một trình giám sát Gateway cho token đó. Token lấy từ cấu hình thắng env fallback mặc định; nếu không, tài khoản đã bật đầu tiên thắng và tài khoản trùng lặp được báo cáo là đã tắt.
Với các lệnh gọi outbound nâng cao (công cụ tin nhắn/hành động kênh), `token` tường minh theo từng lệnh gọi được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và đọc/thăm dò (ví dụ read/search/fetch/thread/pins/permissions). Thiết lập chính sách/thử lại của tài khoản vẫn đến từ tài khoản đã chọn trong snapshot runtime đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập workspace guild

Khi DM đã hoạt động, bạn có thể thiết lập máy chủ Discord của mình làm một workspace đầy đủ, nơi mỗi kênh có phiên agent riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho máy chủ riêng tư chỉ có bạn và bot của bạn.

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
    Theo mặc định, agent của bạn chỉ phản hồi trong kênh guild khi được @mention. Với máy chủ riêng tư, có lẽ bạn muốn nó phản hồi mọi tin nhắn.

    Trong kênh guild, phản hồi cuối thông thường của assistant mặc định vẫn ở chế độ riêng tư. Đầu ra Discord hiển thị phải được gửi tường minh bằng công cụ `message`, để agent có thể âm thầm theo dõi mặc định và chỉ đăng khi nó quyết định phản hồi trong kênh là hữu ích.

    Điều này nghĩa là model được chọn phải gọi công cụ một cách đáng tin cậy. Nếu Discord hiển thị đang nhập và log cho thấy có sử dụng token nhưng không có tin nhắn được đăng, hãy kiểm tra log phiên để tìm văn bản assistant với `didSendViaMessagingTool: false`. Điều đó nghĩa là model đã tạo câu trả lời cuối riêng tư thay vì gọi `message(action=send)`. Chuyển sang model gọi công cụ mạnh hơn, hoặc dùng cấu hình bên dưới để khôi phục phản hồi cuối tự động kiểu cũ.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Cho phép agent của tôi phản hồi trên máy chủ này mà không cần được @mention"
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
        > "Khi tôi đặt câu hỏi trong kênh Discord, hãy dùng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Nếu bạn cần ngữ cảnh dùng chung trong mọi kênh, hãy đặt các chỉ dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được đưa vào mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập chúng khi cần bằng công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo một số kênh trên máy chủ Discord của bạn và bắt đầu chat. Agent của bạn có thể thấy tên kênh, và mỗi kênh có phiên tách biệt riêng — vì vậy bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất cứ gì phù hợp với quy trình làm việc của bạn.

## Model runtime

- Gateway quản lý kết nối Discord.
- Định tuyến trả lời mang tính xác định: các trả lời đi vào từ Discord sẽ được trả lại Discord.
- Siêu dữ liệu guild/kênh Discord được thêm vào prompt mô hình dưới dạng ngữ cảnh không đáng tin cậy, không phải tiền tố trả lời hiển thị với người dùng. Nếu một mô hình sao chép lại lớp bao này, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi các trả lời gửi đi và khỏi ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), các cuộc trò chuyện trực tiếp dùng chung phiên chính của tác tử (`agent:main:main`).
- Các kênh guild là các khóa phiên tách biệt (`agent:<agentId>:discord:channel:<channelId>`).
- DM nhóm bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Các lệnh slash gốc chạy trong các phiên lệnh tách biệt (`agent:<agentId>:discord:slash:<userId>`), đồng thời vẫn mang `CommandTargetSessionKey` đến phiên hội thoại đã định tuyến.
- Việc chuyển phát thông báo cron/heartbeat chỉ có văn bản đến Discord sử dụng câu trả lời cuối cùng hiển thị với trợ lý đúng một lần. Các payload phương tiện và thành phần có cấu trúc vẫn là nhiều tin nhắn khi tác tử phát ra nhiều payload có thể chuyển phát.

## Kênh diễn đàn

Các kênh diễn đàn và phương tiện của Discord chỉ chấp nhận bài đăng trong luồng. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi một tin nhắn đến diễn đàn cha (`channel:<forumId>`) để tự động tạo một luồng. Tiêu đề luồng dùng dòng không rỗng đầu tiên trong tin nhắn của bạn.
- Dùng `openclaw message thread create` để tạo luồng trực tiếp. Không truyền `--message-id` cho các kênh diễn đàn.

Ví dụ: gửi đến diễn đàn cha để tạo một luồng

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ví dụ: tạo rõ ràng một luồng diễn đàn

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Diễn đàn cha không chấp nhận các thành phần Discord. Nếu bạn cần thành phần, hãy gửi đến chính luồng đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ vùng chứa thành phần Discord v2 cho tin nhắn tác tử. Dùng công cụ tin nhắn với payload `components`. Kết quả tương tác được định tuyến trở lại tác tử như các tin nhắn đi vào bình thường và tuân theo các cài đặt Discord `replyToMode` hiện có.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Loại chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, các thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép dùng nút, lựa chọn và biểu mẫu nhiều lần cho đến khi chúng hết hạn.

Để giới hạn ai có thể bấm một nút, đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận được thông báo từ chối tạm thời.

Các lệnh slash `/model` và `/models` mở một bộ chọn mô hình tương tác với các danh sách thả xuống nhà cung cấp, mô hình và runtime tương thích, cùng một bước Gửi. `/models add` đã bị ngừng dùng và giờ trả về thông báo ngừng dùng thay vì đăng ký mô hình từ trò chuyện. Trả lời của bộ chọn là tạm thời và chỉ người dùng gọi lệnh mới có thể sử dụng.

Tệp đính kèm:

- Các khối `file` phải trỏ đến một tham chiếu đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); dùng `media-gallery` cho nhiều tệp
- Dùng `filename` để ghi đè tên tải lên khi tên đó phải khớp với tham chiếu đính kèm

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
    `channels.discord.dmPolicy` kiểm soát quyền truy cập DM. `channels.discord.allowFrom` là danh sách cho phép DM chính tắc.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.discord.allowFrom` bao gồm `"*"`)
    - `disabled`

    Nếu chính sách DM không mở, người dùng không xác định sẽ bị chặn (hoặc được nhắc ghép nối trong chế độ `pairing`).

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Với một tài khoản, `allowFrom` được ưu tiên hơn `dm.allowFrom` cũ.
    - Tài khoản có tên kế thừa `channels.discord.allowFrom` khi `allowFrom` của chính chúng và `dm.allowFrom` cũ chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Định dạng đích DM để chuyển phát:

    - `user:<id>`
    - đề cập `<@id>`

    ID chỉ gồm số thường được phân giải thành ID kênh khi mặc định kênh đang hoạt động, nhưng các ID được liệt kê trong DM `allowFrom` hiệu lực của tài khoản được coi là đích DM người dùng để tương thích.

  </Tab>

  <Tab title="DM access groups">
    DM Discord có thể dùng các mục `accessGroup:<name>` động trong `channels.discord.allowFrom`.

    Tên nhóm truy cập được dùng chung giữa các kênh tin nhắn. Dùng `type: "message.senders"` cho một nhóm tĩnh có thành viên được biểu diễn bằng cú pháp `allowFrom` bình thường của từng kênh, hoặc `type: "discord.channelAudience"` khi đối tượng `ViewChannel` hiện tại của một kênh Discord nên xác định tư cách thành viên một cách động. Hành vi nhóm truy cập dùng chung được ghi tài liệu tại đây: [Nhóm truy cập](/vi/channels/access-groups).

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

    Ví dụ: cho phép bất kỳ ai có thể thấy `#maintainers` DM cho bot, trong khi vẫn đóng DM với mọi người khác.

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

    Tra cứu thất bại theo hướng đóng. Nếu Discord trả về `Missing Access`, tra cứu thành viên thất bại, hoặc kênh thuộc một guild khác, người gửi DM được coi là không được ủy quyền.

    Bật **Server Members Intent** trong Discord Developer Portal cho bot khi dùng nhóm truy cập theo đối tượng kênh. DM không bao gồm trạng thái thành viên guild, vì vậy OpenClaw phân giải thành viên qua Discord REST tại thời điểm ủy quyền.

  </Tab>

  <Tab title="Guild policy">
    Cách xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Đường cơ sở an toàn khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được phép khi họ khớp với `users` HOẶC `roles`
    - khớp trực tiếp tên/thẻ bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` dưới dạng chế độ tương thích khẩn cấp
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng các mục tên/thẻ
    - nếu một guild có cấu hình `channels`, các kênh không được liệt kê sẽ bị từ chối
    - nếu một guild không có khối `channels`, tất cả các kênh trong guild đã được cho phép đó đều được phép

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
    Tin nhắn guild mặc định được kiểm soát bằng đề cập.

    Phát hiện đề cập bao gồm:

    - đề cập bot rõ ràng
    - mẫu đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm định tới bot trong các trường hợp được hỗ trợ

    Khi viết tin nhắn Discord gửi đi, dùng cú pháp đề cập chính tắc: `<@USER_ID>` cho người dùng, `<#CHANNEL_ID>` cho kênh và `<@&ROLE_ID>` cho vai trò. Không dùng dạng đề cập biệt danh cũ `<@!USER_ID>`.

    `requireMention` được cấu hình theo từng guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn loại bỏ các tin nhắn đề cập người dùng/vai trò khác nhưng không đề cập bot (không tính @everyone/@here).

    DM nhóm:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến tác tử dựa trên vai trò

Dùng `bindings[].match.roles` để định tuyến thành viên guild Discord đến các tác tử khác nhau theo ID vai trò. Liên kết dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau liên kết peer hoặc parent-peer và trước liên kết chỉ guild. Nếu một liên kết cũng đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả các trường đã cấu hình phải khớp.

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
- `commands.native=false` bỏ qua việc đăng ký và dọn dẹp slash-command của Discord trong quá trình khởi động. Các lệnh đã đăng ký trước đó có thể vẫn hiển thị trong Discord cho đến khi bạn xóa chúng khỏi ứng dụng Discord.
- Xác thực lệnh gốc dùng cùng allowlist/chính sách Discord như xử lý tin nhắn thông thường.
- Lệnh vẫn có thể hiển thị trong UI Discord cho người dùng không được cấp quyền; quá trình thực thi vẫn áp dụng xác thực OpenClaw và trả về "not authorized".

Xem [Slash commands](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

Thiết lập slash command mặc định:

- `ephemeral: true`

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord hỗ trợ thẻ trả lời trong đầu ra của agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được kiểm soát bởi `channels.discord.replyToMode`:

    - `off` (mặc định)
    - `first`
    - `all`
    - `batched`

    Lưu ý: `off` tắt luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.
    `first` luôn gắn tham chiếu trả lời gốc ngầm định vào tin nhắn Discord đầu tiên gửi ra cho lượt đó.
    `batched` chỉ gắn tham chiếu trả lời gốc ngầm định của Discord khi
    lượt đến là một lô đã debounce gồm nhiều tin nhắn. Điều này hữu ích
    khi bạn muốn trả lời gốc chủ yếu cho các cuộc trò chuyện bùng phát dễ mơ hồ, không phải mọi
    lượt một tin nhắn.

    ID tin nhắn được đưa vào ngữ cảnh/lịch sử để agent có thể nhắm tới các tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw có thể stream bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa nó khi văn bản đến. `channels.discord.streaming` nhận `off` (mặc định) | `partial` | `block` | `progress`. `progress` giữ một bản nháp trạng thái có thể chỉnh sửa và cập nhật nó bằng tiến trình công cụ cho đến khi gửi kết quả cuối cùng; `streamMode` là alias kế thừa và được tự động di chuyển.

    Mặc định vẫn là `off` vì các lần chỉnh sửa bản xem trước của Discord nhanh chóng chạm giới hạn tốc độ khi nhiều bot hoặc Gateway dùng chung một tài khoản.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` chỉnh sửa một tin nhắn xem trước duy nhất khi token đến.
    - `block` phát các khối cỡ bản nháp (dùng `draftChunk` để tinh chỉnh kích thước và điểm ngắt, bị chặn tối đa ở `textChunkLimit`).
    - Kết quả cuối cùng có media, lỗi và trả lời rõ ràng sẽ hủy các chỉnh sửa bản xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) kiểm soát việc cập nhật công cụ/tiến trình có tái dùng tin nhắn xem trước hay không.

    Stream bản xem trước chỉ hỗ trợ văn bản; trả lời media quay về cách gửi thông thường. Khi stream `block` được bật rõ ràng, OpenClaw bỏ qua stream bản xem trước để tránh stream hai lần.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Ngữ cảnh lịch sử guild:

    - `channels.discord.historyLimit` mặc định `20`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` tắt

    Điều khiển lịch sử DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi thread:

    - Thread Discord được định tuyến như phiên kênh và kế thừa cấu hình kênh cha trừ khi bị ghi đè.
    - Phiên thread kế thừa lựa chọn `/model` cấp phiên của kênh cha làm dự phòng chỉ cho model; lựa chọn `/model` cục bộ của thread vẫn được ưu tiên và lịch sử transcript cha không được sao chép trừ khi bật kế thừa transcript.
    - `channels.discord.thread.inheritParent` (mặc định `false`) cho phép auto-thread mới được gieo dữ liệu từ transcript cha. Ghi đè theo từng tài khoản nằm dưới `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng từ message-tool có thể phân giải mục tiêu DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong dự phòng kích hoạt ở giai đoạn trả lời.

    Chủ đề kênh được chèn dưới dạng ngữ cảnh **không đáng tin cậy**. Allowlists kiểm soát ai có thể kích hoạt agent, không phải ranh giới biên tập ngữ cảnh bổ sung đầy đủ.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord có thể ràng buộc một thread với mục tiêu phiên để các tin nhắn tiếp theo trong thread đó tiếp tục định tuyến đến cùng phiên (bao gồm phiên subagent).

    Lệnh:

    - `/focus <target>` ràng buộc thread hiện tại/mới với mục tiêu subagent/phiên
    - `/unfocus` xóa ràng buộc thread hiện tại
    - `/agents` hiển thị các lượt chạy đang hoạt động và trạng thái ràng buộc
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động bỏ focus do không hoạt động cho các ràng buộc đã focus
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng cho các ràng buộc đã focus

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
    - `spawnSessions` kiểm soát việc tự động tạo/ràng buộc thread cho `sessions_spawn({ thread: true })` và các lần spawn thread ACP. Mặc định: `true`.
    - `defaultSpawnContext` kiểm soát ngữ cảnh subagent gốc cho các lần spawn ràng buộc thread. Mặc định: `"fork"`.
    - Các khóa `spawnSubagentSessions`/`spawnAcpSessions` không dùng nữa được di chuyển bởi `openclaw doctor --fix`.
    - Nếu ràng buộc thread bị tắt cho một tài khoản, `/focus` và các thao tác ràng buộc thread liên quan sẽ không khả dụng.

    Xem [Sub-agents](/vi/tools/subagents), [ACP Agents](/vi/tools/acp-agents), và [Configuration Reference](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Với các không gian làm việc ACP ổn định "always-on", hãy cấu hình các ràng buộc ACP có kiểu ở cấp cao nhất nhắm tới cuộc trò chuyện Discord.

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
    - Trong kênh hoặc thread đã ràng buộc, `/new` và `/reset` đặt lại cùng phiên ACP tại chỗ. Ràng buộc thread tạm thời có thể ghi đè phân giải mục tiêu khi đang hoạt động.
    - `spawnSessions` kiểm soát việc tạo/ràng buộc thread con thông qua `--thread auto|here`.

    Xem [ACP Agents](/vi/tools/acp-agents) để biết chi tiết hành vi ràng buộc.

  </Accordion>

  <Accordion title="Reaction notifications">
    Chế độ thông báo reaction theo từng guild:

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (dùng `guilds.<id>.users`)

    Sự kiện reaction được chuyển thành sự kiện hệ thống và gắn vào phiên Discord đã định tuyến.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` gửi emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - dự phòng emoji nhận diện agent (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Discord chấp nhận emoji unicode hoặc tên emoji tùy chỉnh.
    - Dùng `""` để tắt reaction cho một kênh hoặc tài khoản.

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
    Định tuyến lưu lượng WebSocket của Gateway Discord và các tra cứu REST khi khởi động (ID ứng dụng + phân giải allowlist) qua proxy HTTP(S) bằng `channels.discord.proxy`.

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

    - allowlists có thể dùng `pk:<memberId>`
    - tên hiển thị của thành viên chỉ được khớp theo tên/slug khi `channels.discord.dangerouslyAllowNameMatching: true`
    - tra cứu dùng ID tin nhắn gốc và bị giới hạn theo cửa sổ thời gian
    - nếu tra cứu thất bại, tin nhắn được proxy được coi là tin nhắn bot và bị bỏ qua trừ khi `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Dùng `mentionAliases` khi agent cần mention gửi ra có tính xác định cho người dùng Discord đã biết. Khóa là handle không có `@` ở đầu; giá trị là ID người dùng Discord. Handle không xác định, `@everyone`, `@here`, và mention bên trong code span Markdown được giữ nguyên.

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
    Cập nhật presence được áp dụng khi bạn đặt trường trạng thái hoặc hoạt động, hoặc khi bạn bật auto presence.

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

    Ví dụ streaming:

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

    - 0: Playing
    - 1: Streaming (yêu cầu `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (dùng văn bản hoạt động làm trạng thái; emoji là tùy chọn)
    - 5: Competing

    Ví dụ auto presence (tín hiệu sức khỏe runtime):

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

    Auto presence ánh xạ mức sẵn sàng của runtime sang trạng thái Discord: healthy => online, degraded hoặc unknown => idle, exhausted hoặc unavailable => dnd. Ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord hỗ trợ xử lý phê duyệt bằng nút trong DM và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh phát sinh.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt exec gốc khi `enabled` chưa được đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt, từ `execApprovals.approvers` hoặc từ `commands.ownerAllowFrom`. Discord không suy luận người phê duyệt exec từ `allowFrom` của kênh, `dm.allowFrom` cũ, hoặc `defaultTo` của tin nhắn trực tiếp. Đặt `enabled: false` để tắt rõ ràng Discord với vai trò ứng dụng khách phê duyệt gốc.

    Với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi lời nhắc phê duyệt và kết quả cuối cùng một cách riêng tư. OpenClaw thử DM Discord trước khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không có, OpenClaw quay về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt sẽ hiển thị trong kênh. Chỉ những người phê duyệt đã được phân giải mới có thể dùng các nút; người dùng khác nhận thông báo từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật gửi qua kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw quay về gửi bằng DM.

    Discord cũng hiển thị các nút phê duyệt dùng chung được các kênh trò chuyện khác sử dụng. Bộ chuyển đổi Discord gốc chủ yếu bổ sung định tuyến DM cho người phê duyệt và phát tán tới kênh.
    Khi các nút đó xuất hiện, chúng là trải nghiệm phê duyệt chính; OpenClaw
    chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết
    phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.
    Nếu runtime phê duyệt gốc của Discord không hoạt động, OpenClaw giữ cho
    lời nhắc cục bộ xác định `/approve <id> <decision>` hiển thị. Nếu
    runtime đang hoạt động nhưng không thể gửi thẻ gốc tới bất kỳ mục tiêu nào,
    OpenClaw gửi thông báo dự phòng trong cùng cuộc trò chuyện kèm lệnh `/approve`
    chính xác từ phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng ứng dụng khách Gateway dùng chung (ID `plugin:` phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Theo mặc định, phê duyệt hết hạn sau 30 phút.

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

## Giao diện người dùng Components v2

OpenClaw dùng components v2 của Discord cho phê duyệt exec và dấu đánh dấu xuyên ngữ cảnh. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho giao diện người dùng tùy chỉnh (nâng cao; yêu cầu xây dựng payload component qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn dùng bởi các vùng chứa component của Discord (hex).
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
4. Cấp quyền Connect, Speak, Send Messages và Read Message History trong kênh thoại mục tiêu.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Dùng `/vc join|leave|status` để điều khiển phiên. Lệnh dùng agent mặc định của tài khoản và tuân theo cùng các quy tắc danh sách cho phép và chính sách nhóm như các lệnh Discord khác.

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

- `voice.tts` chỉ ghi đè `messages.tts` cho phát lại giọng nói.
- `voice.model` chỉ ghi đè LLM dùng cho phản hồi trong kênh thoại Discord. Để trống để kế thừa mô hình agent đã định tuyến.
- STT dùng `tools.media.audio`; `voice.model` không ảnh hưởng đến phiên âm.
- Các ghi đè `systemPrompt` Discord theo kênh áp dụng cho các lượt bản ghi thoại của kênh thoại đó.
- Các lượt bản ghi thoại suy ra trạng thái chủ sở hữu từ `allowFrom` của Discord (hoặc `dm.allowFrom`); người nói không phải chủ sở hữu không thể truy cập công cụ chỉ dành cho chủ sở hữu (ví dụ `gateway` và `cron`).
- Giọng nói Discord là tùy chọn bật thêm đối với cấu hình chỉ văn bản; đặt `channels.discord.voice.enabled=true` (hoặc giữ một khối `channels.discord.voice` hiện có) để bật lệnh `/vc`, runtime giọng nói và intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng đăng ký intent trạng thái thoại. Để trống để intent tuân theo trạng thái bật giọng nói hiệu dụng.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được truyền qua các tùy chọn tham gia của `@discordjs/voice`.
- Mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu chưa đặt.
- `voice.connectTimeoutMs` kiểm soát thời gian chờ Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần tự động tham gia. Mặc định: `30000`.
- `voice.reconnectGraceMs` kiểm soát khoảng thời gian OpenClaw chờ một phiên thoại đã ngắt kết nối bắt đầu kết nối lại trước khi hủy phiên đó. Mặc định: `15000`.
- OpenClaw cũng theo dõi lỗi giải mã khi nhận và tự động khôi phục bằng cách rời/tham gia lại kênh thoại sau nhiều lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu nhật ký nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và nhật ký. Dòng `@discordjs/voice` được đóng gói bao gồm bản sửa lỗi đệm ngược dòng từ discord.js PR #11449, vốn đã đóng issue discord.js #11419.

Pipeline kênh thoại:

- Bản thu PCM Discord được chuyển đổi thành tệp tạm WAV.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản ghi được gửi qua luồng vào và định tuyến của Discord trong khi LLM phản hồi chạy với chính sách đầu ra giọng nói ẩn công cụ `tts` của agent và yêu cầu văn bản trả về, vì giọng nói Discord sở hữu phát lại TTS cuối cùng.
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
    - xác minh hành vi `requireMention` và mẫu nhắc đến

    Kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false nhưng vẫn bị chặn">
    Nguyên nhân phổ biến:

    - `groupPolicy="allowlist"` không có danh sách cho phép guild/kênh khớp
    - `requireMention` được cấu hình sai vị trí (phải nằm dưới `channels.discord.guilds` hoặc mục kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của guild/kênh

  </Accordion>

  <Accordion title="Lượt Discord chạy lâu hoặc phản hồi trùng lặp">

    Nhật ký thường gặp:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Núm điều chỉnh hàng đợi Gateway Discord:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - tùy chọn này chỉ kiểm soát công việc listener Gateway Discord, không kiểm soát vòng đời lượt agent

    Discord không áp dụng thời gian chờ do kênh sở hữu cho các lượt agent được xếp hàng. Listener tin nhắn bàn giao ngay lập tức, và các lần chạy Discord được xếp hàng giữ nguyên thứ tự theo phiên cho đến khi vòng đời phiên/công cụ/runtime hoàn tất hoặc hủy công việc.

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

  <Accordion title="Cảnh báo hết thời gian chờ tra cứu siêu dữ liệu Gateway">
    OpenClaw lấy siêu dữ liệu `/gateway/bot` của Discord trước khi kết nối. Lỗi tạm thời sẽ quay về URL gateway mặc định của Discord và được giới hạn tần suất trong nhật ký.

    Núm điều chỉnh thời gian chờ siêu dữ liệu:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - dự phòng env khi cấu hình chưa được đặt: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Khởi động lại khi Gateway hết thời gian chờ READY">
    OpenClaw chờ sự kiện `READY` của gateway Discord trong quá trình khởi động và sau các lần kết nối lại khi chạy. Thiết lập nhiều tài khoản có khởi động lệch nhau có thể cần khoảng thời gian chờ READY khi khởi động dài hơn mặc định.

    Các núm điều chỉnh thời gian chờ READY:

    - một tài khoản khi khởi động: `channels.discord.gatewayReadyTimeoutMs`
    - nhiều tài khoản khi khởi động: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - giá trị dự phòng từ môi trường khi cấu hình chưa đặt: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - mặc định khi khởi động: `15000` (15 giây), tối đa: `120000`
    - một tài khoản khi chạy: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - nhiều tài khoản khi chạy: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - giá trị dự phòng từ môi trường khi cấu hình chưa đặt: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - mặc định khi chạy: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Sai lệch khi kiểm tra quyền">
    Các kiểm tra quyền của `channels status --probe` chỉ hoạt động với ID kênh dạng số.

    Nếu bạn dùng khóa slug, việc khớp khi chạy vẫn có thể hoạt động, nhưng probe không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="Sự cố DM và ghép đôi">

    - DM bị tắt: `channels.discord.dm.enabled=false`
    - chính sách DM bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép đôi trong chế độ `pairing`

  </Accordion>

  <Accordion title="Vòng lặp bot với bot">
    Theo mặc định, các tin nhắn do bot tạo sẽ bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng các quy tắc nhắc đến và danh sách cho phép nghiêm ngặt để tránh hành vi lặp.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn bot có nhắc đến bot.

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

  <Accordion title="Voice STT bị rớt với DecryptionFailed(...)">

    - luôn cập nhật OpenClaw (`openclaw update`) để có logic khôi phục nhận thoại Discord
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
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- trả lời/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- phân phối: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (bí danh cũ: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- phương tiện/thử lại: `mediaMaxMb` (giới hạn lượt tải lên Discord đi, mặc định `100MB`), `retry`
- hành động: `actions.*`
- hiện diện: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- tính năng: `threadBindings`, cấp cao nhất `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là bí mật (ưu tiên `DISCORD_BOT_TOKEN` trong môi trường được giám sát).
- Cấp quyền Discord theo nguyên tắc đặc quyền tối thiểu.
- Nếu trạng thái/triển khai lệnh đã cũ, hãy khởi động lại gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép đôi" icon="link" href="/vi/channels/pairing">
    Ghép đôi người dùng Discord với gateway.
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
  <Card title="Định tuyến đa agent" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ guild và kênh tới agent.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc.
  </Card>
</CardGroup>
