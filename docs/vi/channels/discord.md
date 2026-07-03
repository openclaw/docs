---
read_when:
    - Làm việc với các tính năng kênh Discord
summary: Trạng thái hỗ trợ, khả năng và cấu hình bot Discord
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:49:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

Sẵn sàng cho DM và kênh guild thông qua Discord gateway chính thức.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM Discord mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Quy trình chẩn đoán và sửa chữa đa kênh.
  </Card>
</CardGroup>

## Thiết lập nhanh

Bạn sẽ cần tạo một ứng dụng mới có bot, thêm bot vào máy chủ của bạn, rồi ghép nối bot đó với OpenClaw. Chúng tôi khuyên bạn nên thêm bot vào máy chủ riêng của mình. Nếu bạn chưa có, hãy [tạo một máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng Discord và bot">
    Vào [Discord Developer Portal](https://discord.com/developers/applications) và nhấp **New Application**. Đặt tên kiểu như "OpenClaw".

    Nhấp **Bot** trên thanh bên. Đặt **Username** thành bất kỳ tên nào bạn gọi tác tử OpenClaw của mình.

  </Step>

  <Step title="Bật privileged intents">
    Vẫn trên trang **Bot**, cuộn xuống **Privileged Gateway Intents** và bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; bắt buộc cho danh sách cho phép theo vai trò và khớp tên với ID)
    - **Presence Intent** (tùy chọn; chỉ cần cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Sao chép token bot của bạn">
    Cuộn lên lại trên trang **Bot** và nhấp **Reset Token**.

    <Note>
    Dù tên là vậy, thao tác này tạo token đầu tiên của bạn — không có gì đang được "đặt lại".
    </Note>

    Sao chép token và lưu ở đâu đó. Đây là **Bot Token** của bạn và bạn sẽ cần nó trong chốc lát.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào máy chủ của bạn">
    Nhấp **OAuth2** trên thanh bên. Bạn sẽ tạo một URL mời với đúng quyền để thêm bot vào máy chủ của mình.

    Cuộn xuống **OAuth2 URL Generator** và bật:

    - `bot`
    - `applications.commands`

    Một phần **Bot Permissions** sẽ xuất hiện bên dưới. Bật tối thiểu:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (tùy chọn)

    Đây là bộ cơ sở cho các kênh văn bản thông thường. Nếu bạn định đăng trong thread Discord, bao gồm quy trình kênh forum hoặc media tạo hoặc tiếp tục một thread, hãy bật thêm **Send Messages in Threads**.
    Sao chép URL được tạo ở cuối, dán vào trình duyệt, chọn máy chủ của bạn, rồi nhấp **Continue** để kết nối. Bây giờ bạn sẽ thấy bot trong máy chủ Discord.

  </Step>

  <Step title="Bật Developer Mode và thu thập ID của bạn">
    Quay lại ứng dụng Discord, bạn cần bật Developer Mode để có thể sao chép ID nội bộ.

    1. Nhấp **User Settings** (biểu tượng bánh răng cạnh ảnh đại diện của bạn) → Cuộn đến **Developer** trong thanh bên → bật **Developer Mode**

        *(Lưu ý: Trên ứng dụng di động Discord, Developer Mode nằm dưới **App Settings** → **Advanced**)*

    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trong thanh bên → **Copy Server ID**
    3. Nhấp chuột phải vào **ảnh đại diện của chính bạn** → **Copy User ID**

    Lưu **Server ID** và **User ID** cùng với Bot Token của bạn — bạn sẽ gửi cả ba cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Cho phép DM từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord cần cho phép bot gửi DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn → **Privacy Settings** → bật **Direct Messages**.

    Thiết lập này cho phép thành viên máy chủ (bao gồm bot) gửi DM cho bạn. Giữ bật nếu bạn muốn dùng DM Discord với OpenClaw. Nếu bạn chỉ định dùng kênh guild, bạn có thể tắt DM sau khi ghép nối.

  </Step>

  <Step title="Đặt token bot của bạn một cách bảo mật (không gửi trong chat)">
    Token bot Discord của bạn là bí mật (như mật khẩu). Đặt nó trên máy đang chạy OpenClaw trước khi nhắn tin cho tác tử của bạn.

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
    Với cài đặt dịch vụ được quản lý, chạy `openclaw gateway install` từ shell có `DISCORD_BOT_TOKEN`, hoặc lưu biến trong `~/.openclaw/.env`, để dịch vụ có thể phân giải SecretRef env sau khi khởi động lại.
    Nếu máy chủ của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/client Discord từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó. Dùng `channels.discord.applicationId` cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.applicationId` khi bạn chạy nhiều bot Discord.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Hỏi tác tử của bạn">
        Chat với tác tử OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ Telegram) và nói với nó. Nếu Discord là kênh đầu tiên của bạn, hãy dùng tab CLI / cấu hình thay thế.

        > "Tôi đã đặt token bot Discord trong cấu hình. Vui lòng hoàn tất thiết lập Discord với User ID `<user_id>` và Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / cấu hình">
        Nếu bạn thích cấu hình dựa trên tệp, đặt:

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

        Env dự phòng cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Với thiết lập bằng script hoặc từ xa, ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run` rồi chạy lại không có `--dry-run`. Giá trị `token` dạng văn bản thuần được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các provider env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Với nhiều bot Discord, giữ mỗi token bot và ID ứng dụng dưới tài khoản của nó. `channels.discord.applicationId` cấp cao nhất được các tài khoản kế thừa, vì vậy chỉ đặt ở đó khi mọi tài khoản đều nên dùng cùng một ID ứng dụng.

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
    Chờ đến khi Gateway đang chạy, rồi DM bot của bạn trong Discord. Bot sẽ phản hồi bằng một mã ghép nối.

    <Tabs>
      <Tab title="Hỏi tác tử của bạn">
        Gửi mã ghép nối cho tác tử của bạn trên kênh hiện có:

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

    Bây giờ bạn sẽ có thể chat với tác tử của mình trong Discord qua DM.

  </Step>
</Steps>

<Note>
Việc phân giải token có nhận biết tài khoản. Giá trị token trong cấu hình thắng env dự phòng. `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord đã bật phân giải về cùng một token bot, OpenClaw chỉ khởi động một trình giám sát Gateway cho token đó. Token có nguồn từ cấu hình thắng env dự phòng mặc định; nếu không thì tài khoản đã bật đầu tiên thắng và tài khoản trùng lặp được báo cáo là đã tắt.
Với các lệnh gọi gửi đi nâng cao (công cụ tin nhắn/hành động kênh), `token` tường minh theo từng lệnh gọi được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và đọc/thăm dò (ví dụ read/search/fetch/thread/pins/permissions). Chính sách tài khoản/thiết lập thử lại vẫn đến từ tài khoản được chọn trong snapshot runtime đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập workspace guild

Sau khi DM hoạt động, bạn có thể thiết lập máy chủ Discord của mình thành một workspace đầy đủ, nơi mỗi kênh có phiên tác tử riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho máy chủ riêng, nơi chỉ có bạn và bot của bạn.

<Steps>
  <Step title="Thêm máy chủ của bạn vào danh sách cho phép guild">
    Thiết lập này cho phép tác tử của bạn phản hồi trong bất kỳ kênh nào trên máy chủ của bạn, không chỉ DM.

    <Tabs>
      <Tab title="Hỏi tác tử của bạn">
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
    Theo mặc định, tác tử của bạn chỉ phản hồi trong kênh guild khi được @mention. Với máy chủ riêng, có thể bạn muốn nó phản hồi mọi tin nhắn.

    Trong kênh guild, trả lời thông thường mặc định được đăng tự động. Với các phòng chung luôn bật, hãy chọn `messages.groupChat.visibleReplies: "message_tool"` để tác tử có thể theo dõi âm thầm và chỉ đăng khi nó quyết định rằng một phản hồi trong kênh là hữu ích. Điều này hoạt động tốt nhất với các model thế hệ mới nhất, đáng tin cậy về công cụ, chẳng hạn GPT 5.5. Sự kiện phòng xung quanh giữ im lặng trừ khi công cụ gửi. Xem [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events) để biết cấu hình chế độ theo dõi âm thầm đầy đủ.

    Nếu Discord hiển thị đang nhập và log hiển thị mức dùng token nhưng không có tin nhắn được đăng, hãy kiểm tra xem lượt đó có được cấu hình là sự kiện phòng xung quanh hoặc đã chọn trả lời hiển thị bằng công cụ tin nhắn hay không.

    <Tabs>
      <Tab title="Hỏi tác tử của bạn">
        > "Cho phép tác tử của tôi phản hồi trên máy chủ này mà không cần được @mention"
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

        Để yêu cầu gửi bằng công cụ tin nhắn cho các phản hồi nhóm/kênh hiển thị, đặt `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Lập kế hoạch cho bộ nhớ trong kênh guild">
    Theo mặc định, bộ nhớ dài hạn (MEMORY.md) chỉ được tải trong phiên DM. Kênh guild không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Hỏi tác tử của bạn">
        > "Khi tôi đặt câu hỏi trong kênh Discord, hãy dùng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Nếu bạn cần ngữ cảnh chung trong mọi kênh, hãy đặt các chỉ dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được chèn vào mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập chúng khi cần bằng công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo một số kênh trên máy chủ Discord của bạn và bắt đầu chat. Tác tử của bạn có thể thấy tên kênh, và mỗi kênh có phiên tách biệt riêng — vì vậy bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất kỳ cách nào phù hợp với quy trình làm việc của bạn.

## Model runtime

- Gateway sở hữu kết nối Discord.
- Định tuyến phản hồi mang tính xác định: phản hồi đầu vào từ Discord sẽ quay lại Discord.
- Siêu dữ liệu guild/kênh Discord được thêm vào prompt của mô hình dưới dạng ngữ cảnh
  không đáng tin cậy, không phải tiền tố phản hồi hiển thị với người dùng. Nếu mô hình sao chép phong bì đó
  trở lại, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi phản hồi đi và khỏi
  ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), cuộc trò chuyện trực tiếp dùng chung phiên chính của agent (`agent:main:main`).
- Kênh guild là các khóa phiên biệt lập (`agent:<agentId>:discord:channel:<channelId>`).
- DM nhóm bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Lệnh slash gốc chạy trong các phiên lệnh biệt lập (`agent:<agentId>:discord:slash:<userId>`), trong khi vẫn mang `CommandTargetSessionKey` tới phiên hội thoại đã định tuyến.
- Việc gửi thông báo cron/heartbeat chỉ có văn bản tới Discord dùng câu trả lời cuối cùng
  hiển thị với assistant một lần. Payload phương tiện và thành phần có cấu trúc vẫn là
  nhiều tin nhắn khi agent phát ra nhiều payload có thể gửi.

## Kênh diễn đàn

Kênh diễn đàn và kênh phương tiện của Discord chỉ chấp nhận bài đăng trong luồng. OpenClaw hỗ trợ hai cách tạo chúng:

- Gửi tin nhắn tới cha diễn đàn (`channel:<forumId>`) để tự động tạo luồng. Tiêu đề luồng dùng dòng không rỗng đầu tiên trong tin nhắn của bạn.
- Dùng `openclaw message thread create` để tạo luồng trực tiếp. Không truyền `--message-id` cho kênh diễn đàn.

Ví dụ: gửi tới cha diễn đàn để tạo luồng

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ví dụ: tạo luồng diễn đàn một cách tường minh

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Cha diễn đàn không chấp nhận thành phần Discord. Nếu bạn cần thành phần, hãy gửi tới chính luồng đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ bộ chứa thành phần Discord v2 cho tin nhắn của agent. Dùng công cụ tin nhắn với payload `components`. Kết quả tương tác được định tuyến trở lại agent như tin nhắn đầu vào bình thường và tuân theo các thiết lập Discord `replyToMode` hiện có.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Loại chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép nút, lựa chọn và biểu mẫu được dùng nhiều lần cho đến khi hết hạn.

Để giới hạn ai có thể bấm nút, đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận thông báo từ chối tạm thời.

Callback thành phần hết hạn sau 30 phút theo mặc định. Đặt `channels.discord.agentComponents.ttlMs` để thay đổi vòng đời sổ đăng ký callback đó cho tài khoản Discord mặc định, hoặc `channels.discord.accounts.<accountId>.agentComponents.ttlMs` để ghi đè một tài khoản trong thiết lập nhiều tài khoản. Giá trị tính bằng mili giây, phải là số nguyên dương và bị giới hạn ở `86400000` (24 giờ). TTL dài hơn hữu ích cho quy trình đánh giá hoặc phê duyệt cần các nút vẫn có thể dùng, nhưng chúng cũng kéo dài khoảng thời gian mà một tin nhắn Discord cũ vẫn có thể kích hoạt hành động. Ưu tiên TTL ngắn nhất phù hợp với quy trình, và giữ mặc định khi callback cũ sẽ gây bất ngờ.

Các lệnh slash `/model` và `/models` mở một bộ chọn mô hình tương tác với menu thả xuống nhà cung cấp, mô hình và runtime tương thích cùng bước Gửi. `/models add` đã bị loại bỏ dần và giờ trả về thông báo loại bỏ dần thay vì đăng ký mô hình từ chat. Phản hồi của bộ chọn là tạm thời và chỉ người dùng gọi lệnh mới có thể dùng. Menu chọn Discord bị giới hạn ở 25 tùy chọn, vì vậy hãy thêm các mục `provider/*` vào `agents.defaults.models` khi bạn muốn bộ chọn chỉ hiển thị các mô hình được phát hiện động cho những nhà cung cấp đã chọn như `openai` hoặc `vllm`.

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
    - Tài khoản có tên kế thừa `channels.discord.allowFrom` khi `allowFrom` riêng của chúng và `dm.allowFrom` cũ chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Định dạng đích DM để gửi:

    - `user:<id>`
    - đề cập `<@id>`

    ID số trần thường phân giải thành ID kênh khi mặc định kênh đang hoạt động, nhưng ID được liệt kê trong DM `allowFrom` hiệu lực của tài khoản được xử lý như đích DM người dùng để tương thích.

  </Tab>

  <Tab title="Access groups">
    DM Discord và ủy quyền lệnh văn bản có thể dùng các mục động `accessGroup:<name>` trong `channels.discord.allowFrom`.

    Tên nhóm truy cập được chia sẻ trên các kênh tin nhắn. Dùng `type: "message.senders"` cho nhóm tĩnh có thành viên được biểu thị bằng cú pháp `allowFrom` bình thường của từng kênh, hoặc `type: "discord.channelAudience"` khi đối tượng `ViewChannel` hiện tại của một kênh Discord nên xác định tư cách thành viên một cách động. Hành vi nhóm truy cập dùng chung được ghi lại tại đây: [Nhóm truy cập](/vi/channels/access-groups).

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

    Ví dụ: cho phép bất kỳ ai có thể xem `#maintainers` DM bot, trong khi vẫn đóng DM với mọi người khác.

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

    Bạn có thể trộn mục động và tĩnh:

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

    Bật **Server Members Intent** trong Discord Developer Portal cho bot khi dùng nhóm truy cập theo đối tượng kênh. DM không bao gồm trạng thái thành viên guild, vì vậy OpenClaw phân giải thành viên qua Discord REST tại thời điểm ủy quyền.

  </Tab>

  <Tab title="Guild policy">
    Việc xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Đường cơ sở bảo mật khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được phép khi họ khớp với `users` HOẶC `roles`
    - khớp tên/thẻ trực tiếp bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` như chế độ tương thích khẩn cấp
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng mục tên/thẻ
    - nếu guild có `channels` được cấu hình, các kênh không được liệt kê sẽ bị từ chối
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

    Nếu bạn chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, fallback runtime là `groupPolicy="allowlist"` (kèm cảnh báo trong log), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Tin nhắn guild được kiểm soát bằng đề cập theo mặc định.

    Phát hiện đề cập bao gồm:

    - đề cập bot tường minh
    - mẫu đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm tới bot trong các trường hợp được hỗ trợ

    Khi viết tin nhắn Discord gửi đi, dùng cú pháp đề cập chính tắc: `<@USER_ID>` cho người dùng, `<#CHANNEL_ID>` cho kênh và `<@&ROLE_ID>` cho vai trò. Không dùng dạng đề cập biệt danh cũ `<@!USER_ID>`.

    `requireMention` được cấu hình theo từng guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn loại bỏ tin nhắn đề cập một người dùng/vai trò khác nhưng không đề cập bot (không tính @everyone/@here).

    DM nhóm:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến agent dựa trên vai trò

Sử dụng `bindings[].match.roles` để định tuyến thành viên guild Discord đến các tác tử khác nhau theo ID vai trò. Các liên kết dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau liên kết peer hoặc parent-peer và trước liên kết chỉ dành cho guild. Nếu một liên kết cũng đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả trường đã cấu hình đều phải khớp.

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
- Ghi đè theo kênh: `channels.discord.commands.native`.
- `commands.native=false` bỏ qua việc đăng ký và dọn dẹp lệnh slash Discord trong khi khởi động. Các lệnh đã đăng ký trước đó có thể vẫn hiển thị trong Discord cho đến khi bạn xóa chúng khỏi ứng dụng Discord.
- Xác thực lệnh gốc dùng cùng danh sách cho phép/chính sách Discord như xử lý tin nhắn thông thường.
- Lệnh vẫn có thể hiển thị trong giao diện Discord với người dùng chưa được ủy quyền; khi thực thi vẫn áp dụng xác thực OpenClaw và trả về "not authorized".

Xem [Lệnh slash](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

Cài đặt lệnh slash mặc định:

- `ephemeral: true`

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Thẻ trả lời và trả lời gốc">
    Discord hỗ trợ thẻ trả lời trong đầu ra của tác tử:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được điều khiển bởi `channels.discord.replyToMode`:

    - `off` (mặc định)
    - `first`
    - `all`
    - `batched`

    Lưu ý: `off` tắt phân luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` tường minh vẫn được tôn trọng.
    `first` luôn gắn tham chiếu trả lời gốc ngầm định vào tin nhắn Discord đầu tiên gửi ra cho lượt đó.
    `batched` chỉ gắn tham chiếu trả lời gốc ngầm định của Discord khi sự kiện đến là một lô đã debounce gồm nhiều tin nhắn. Điều này hữu ích khi bạn muốn trả lời gốc chủ yếu cho các cuộc trò chuyện bùng nổ dễ mơ hồ, không phải mọi lượt chỉ có một tin nhắn.

    ID tin nhắn được đưa vào ngữ cảnh/lịch sử để tác tử có thể nhắm đến tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Xem trước liên kết">
    Discord mặc định tạo các embed liên kết phong phú cho URL. OpenClaw mặc định chặn các embed được tạo đó trên tin nhắn Discord gửi ra, nên URL do tác tử gửi sẽ giữ dạng liên kết thuần trừ khi bạn chọn bật:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Đặt `channels.discord.accounts.<id>.suppressEmbeds` để ghi đè một tài khoản. Các lần gửi bằng công cụ tin nhắn của tác tử cũng có thể truyền `suppressEmbeds: false` cho một tin nhắn duy nhất. Payload `embeds` tường minh của Discord không bị chặn bởi cài đặt xem trước liên kết mặc định.

  </Accordion>

  <Accordion title="Xem trước luồng trực tiếp">
    OpenClaw có thể stream bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa khi văn bản đến. `channels.discord.streaming` nhận `off` | `partial` | `block` | `progress` (mặc định). `progress` giữ một bản nháp trạng thái có thể chỉnh sửa và cập nhật bằng tiến độ công cụ cho đến khi gửi cuối cùng; nhãn khởi đầu dùng chung là một dòng cuộn, nên nó sẽ trôi đi như phần còn lại khi có đủ công việc xuất hiện. `streamMode` là bí danh runtime cũ. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu sang khóa chính tắc.

    Đặt `channels.discord.streaming.mode` thành `off` để tắt chỉnh sửa xem trước Discord. Nếu streaming theo khối Discord được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh stream hai lần.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` chỉnh sửa một tin nhắn xem trước duy nhất khi token đến.
    - `block` phát các đoạn cỡ bản nháp (dùng `draftChunk` để tinh chỉnh kích thước và điểm ngắt, được giới hạn theo `textChunkLimit`).
    - Nội dung media, lỗi và kết quả cuối cùng có trả lời tường minh sẽ hủy các chỉnh sửa xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) điều khiển việc cập nhật công cụ/tiến độ có tái sử dụng tin nhắn xem trước hay không.
    - Các hàng công cụ/tiến độ hiển thị dưới dạng emoji + tiêu đề + chi tiết gọn khi có, ví dụ `🛠️ Bash: run tests` hoặc `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (mặc định `false`) chọn đưa văn bản bình luận/mở đầu của trợ lý vào bản nháp tiến độ tạm thời. Bình luận được dọn trước khi hiển thị, vẫn là tạm thời và không thay đổi cách gửi câu trả lời cuối cùng.
    - `streaming.progress.maxLineChars` điều khiển ngân sách xem trước tiến độ theo từng dòng. Văn xuôi được rút gọn theo ranh giới từ; chi tiết lệnh và đường dẫn giữ các hậu tố hữu ích.
    - `streaming.preview.commandText` / `streaming.progress.commandText` điều khiển chi tiết lệnh/thực thi trong các dòng tiến độ gọn: `raw` (mặc định) hoặc `status` (chỉ nhãn công cụ).

    Ẩn văn bản lệnh/thực thi thô trong khi vẫn giữ các dòng tiến độ gọn:

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

    Streaming xem trước chỉ hỗ trợ văn bản; trả lời media quay về cách gửi thông thường. Khi streaming `block` được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh stream hai lần.

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

    - Luồng Discord được định tuyến như phiên kênh và kế thừa cấu hình kênh cha trừ khi được ghi đè.
    - Phiên luồng kế thừa lựa chọn `/model` cấp phiên của kênh cha dưới dạng dự phòng chỉ cho mô hình; lựa chọn `/model` cục bộ của luồng vẫn được ưu tiên và lịch sử bản ghi kênh cha không được sao chép trừ khi kế thừa bản ghi được bật.
    - `channels.discord.thread.inheritParent` (mặc định `false`) chọn cho các luồng tự động mới được gieo từ bản ghi cha. Ghi đè theo tài khoản nằm dưới `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng từ công cụ tin nhắn có thể phân giải đích DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong dự phòng kích hoạt ở giai đoạn trả lời.

    Chủ đề kênh được chèn vào làm ngữ cảnh **không đáng tin cậy**. Danh sách cho phép kiểm soát ai có thể kích hoạt tác tử, không phải là ranh giới biên tập lại ngữ cảnh bổ sung đầy đủ.

  </Accordion>

  <Accordion title="Phiên gắn với luồng cho tác tử phụ">
    Discord có thể gắn một luồng với đích phiên để các tin nhắn tiếp theo trong luồng đó tiếp tục định tuyến đến cùng phiên (bao gồm phiên tác tử phụ).

    Lệnh:

    - `/focus <target>` gắn luồng hiện tại/mới với đích tác tử phụ/phiên
    - `/unfocus` xóa liên kết luồng hiện tại
    - `/agents` hiển thị các lượt chạy đang hoạt động và trạng thái liên kết
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động bỏ focus khi không hoạt động cho liên kết đã focus
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng cho liên kết đã focus

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
    - `spawnSessions` điều khiển tự động tạo/gắn luồng cho `sessions_spawn({ thread: true })` và lượt sinh luồng ACP. Mặc định: `true`.
    - `defaultSpawnContext` điều khiển ngữ cảnh tác tử phụ gốc cho lượt sinh gắn với luồng. Mặc định: `"fork"`.
    - Các khóa `spawnSubagentSessions`/`spawnAcpSessions` đã lỗi thời được di chuyển bởi `openclaw doctor --fix`.
    - Nếu liên kết luồng bị tắt cho một tài khoản, `/focus` và các thao tác liên kết luồng liên quan sẽ không khả dụng.

    Xem [Tác tử phụ](/vi/tools/subagents), [Tác tử ACP](/vi/tools/acp-agents), và [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liên kết kênh ACP bền vững">
    Với workspace ACP ổn định "always-on", hãy cấu hình các liên kết ACP định kiểu cấp cao nhất nhắm đến cuộc trò chuyện Discord.

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

    - `/acp spawn codex --bind here` gắn kênh hoặc luồng hiện tại tại chỗ và giữ các tin nhắn trong tương lai trên cùng phiên ACP. Tin nhắn luồng kế thừa liên kết kênh cha.
    - Trong một kênh hoặc luồng đã gắn, `/new` và `/reset` đặt lại cùng phiên ACP tại chỗ. Liên kết luồng tạm thời có thể ghi đè phân giải đích khi đang hoạt động.
    - `spawnSessions` kiểm soát việc tạo/gắn luồng con qua `--thread auto|here`.

    Xem [Tác tử ACP](/vi/tools/acp-agents) để biết chi tiết hành vi liên kết.

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Chế độ thông báo phản ứng theo guild:

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (dùng `guilds.<id>.users`)

    Sự kiện phản ứng được chuyển thành sự kiện hệ thống và gắn vào phiên Discord đã định tuyến.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - dự phòng emoji danh tính tác tử (`agents.list[].identity.emoji`, nếu không có thì "👀")

    Ghi chú:

    - Discord chấp nhận emoji unicode hoặc tên emoji tùy chỉnh.
    - Dùng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

  </Accordion>

  <Accordion title="Ghi cấu hình">
    Ghi cấu hình do kênh khởi tạo được bật mặc định.

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
    Định tuyến lưu lượng WebSocket Gateway Discord và các tra cứu REST khi khởi động (ID ứng dụng + phân giải danh sách cho phép) qua proxy HTTP(S) với `channels.discord.proxy`.
    Proxy WebSocket Discord Gateway là tường minh; kết nối WebSocket không kế thừa biến môi trường proxy xung quanh từ tiến trình Gateway. Các tra cứu REST khi khởi động dùng proxy này khi `channels.discord.proxy` được cấu hình.

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
    Bật phân giải PluralKit để ánh xạ tin nhắn được proxy sang danh tính thành viên hệ thống:

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
    - nếu tra cứu thất bại, tin nhắn được proxy được xem là tin nhắn bot và bị bỏ trừ khi `allowBots=true`

  </Accordion>

  <Accordion title="Bí danh đề cập gửi đi">
    Dùng `mentionAliases` khi agent cần các lượt đề cập gửi đi có tính xác định cho người dùng Discord đã biết. Khóa là handle không có `@` ở đầu; giá trị là ID người dùng Discord. Các handle không xác định, `@everyone`, `@here`, và các lượt đề cập bên trong code span Markdown được giữ nguyên.

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

    Ví dụ phát trực tiếp:

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

    Bảng ánh xạ loại hoạt động:

    - 0: Đang chơi
    - 1: Đang phát trực tiếp (yêu cầu `activityUrl`)
    - 2: Đang nghe
    - 3: Đang xem
    - 4: Tùy chỉnh (dùng văn bản hoạt động làm trạng thái; emoji là tùy chọn)
    - 5: Đang thi đấu

    Ví dụ hiện diện tự động (tín hiệu sức khỏe runtime):

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

    Hiện diện tự động ánh xạ trạng thái khả dụng của runtime sang trạng thái Discord: khỏe mạnh => online, suy giảm hoặc không xác định => idle, cạn kiệt hoặc không khả dụng => dnd. Ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Phê duyệt trong Discord">
    Discord hỗ trợ xử lý phê duyệt bằng nút trong DM và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh khởi tạo.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt exec gốc khi `enabled` chưa được đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt, từ `execApprovals.approvers` hoặc từ `commands.ownerAllowFrom`. Discord không suy luận người phê duyệt exec từ `allowFrom` của kênh, `dm.allowFrom` cũ, hoặc `defaultTo` của tin nhắn trực tiếp. Đặt `enabled: false` để tắt rõ ràng Discord làm ứng dụng phê duyệt gốc.

    Với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi lời nhắc phê duyệt và kết quả cuối cùng riêng tư. Trước tiên nó thử DM Discord khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không có, nó quay về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ những người phê duyệt đã phân giải mới có thể dùng các nút; người dùng khác nhận từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật gửi qua kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw quay về gửi qua DM.

    Discord cũng hiển thị các nút phê duyệt dùng chung được các kênh chat khác sử dụng. Bộ điều hợp Discord gốc chủ yếu bổ sung định tuyến DM cho người phê duyệt và phân phối tới kênh.
    Khi các nút đó có mặt, chúng là UX phê duyệt chính; OpenClaw
    chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết
    phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là đường duy nhất.
    Nếu runtime phê duyệt gốc của Discord không hoạt động, OpenClaw giữ
    lời nhắc `/approve <id> <decision>` cục bộ có tính xác định hiển thị. Nếu
    runtime đang hoạt động nhưng không thể gửi thẻ gốc tới bất kỳ đích nào,
    OpenClaw gửi thông báo dự phòng trong cùng chat với lệnh `/approve`
    chính xác từ phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng ứng dụng khách Gateway dùng chung (ID `plugin:` phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Phê duyệt hết hạn sau 30 phút theo mặc định.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Công cụ và cổng hành động

Hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, kiểm duyệt, hiện diện, và hành động siêu dữ liệu.

Ví dụ lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- kiểm duyệt: `timeout`, `kick`, `ban`
- hiện diện: `setPresence`

Hành động `event-create` chấp nhận tham số `image` tùy chọn (URL hoặc đường dẫn tệp cục bộ) để đặt ảnh bìa sự kiện đã lên lịch.

Cổng hành động nằm dưới `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                           | Mặc định |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | bật      |
| roles                                                                                                                                                                    | tắt      |
| moderation                                                                                                                                                               | tắt      |
| presence                                                                                                                                                                 | tắt      |

## UI components v2

OpenClaw dùng Discord components v2 cho phê duyệt exec và dấu mốc xuyên ngữ cảnh. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho UI tùy chỉnh (nâng cao; yêu cầu xây dựng payload component qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn được các container component Discord sử dụng (hex).
- Đặt theo từng tài khoản với `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` kiểm soát thời gian các callback component Discord đã gửi còn được đăng ký (mặc định `1800000`, tối đa `86400000`). Đặt theo từng tài khoản với `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` bị bỏ qua khi components v2 có mặt.
- Bản xem trước URL thuần bị tắt theo mặc định. Đặt `suppressEmbeds: false` trên một hành động tin nhắn khi một liên kết gửi đi duy nhất nên được mở rộng.

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

Danh sách thiết lập:

1. Bật Message Content Intent trong Discord Developer Portal.
2. Bật Server Members Intent khi dùng danh sách cho phép theo vai trò/người dùng.
3. Mời bot với phạm vi `bot` và `applications.commands`.
4. Cấp Connect, Speak, Send Messages, và Read Message History trong kênh thoại đích.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Dùng `/vc join|leave|status` để điều khiển phiên. Lệnh dùng agent mặc định của tài khoản và tuân theo cùng các quy tắc danh sách cho phép và chính sách nhóm như các lệnh Discord khác.

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
        model: "openai/gpt-5.5",
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Ghi chú:

- `voice.tts` chỉ ghi đè `messages.tts` cho phát giọng nói `stt-tts`. Các chế độ realtime dùng `voice.realtime.speakerVoice`.
- `voice.mode` điều khiển đường dẫn hội thoại. Mặc định là `agent-proxy`: một giao diện giọng nói realtime xử lý thời điểm lượt nói, ngắt lời và phát lại, ủy quyền công việc thực chất cho OpenClaw agent được định tuyến thông qua `openclaw_agent_consult`, rồi xử lý kết quả như một lời nhắc Discord được nhập từ người nói đó. `stt-tts` giữ luồng STT theo lô cũ cộng với TTS. `bidi` cho phép mô hình realtime trò chuyện trực tiếp trong khi vẫn cung cấp `openclaw_agent_consult` cho bộ não OpenClaw.
- `voice.agentSession` điều khiển cuộc hội thoại OpenClaw nào nhận các lượt giọng nói. Để trống để dùng phiên riêng của kênh thoại, hoặc đặt `{ mode: "target", target: "channel:<text-channel-id>" }` để kênh thoại hoạt động như phần mở rộng micrô/loa của một phiên kênh văn bản Discord hiện có, chẳng hạn `#maintainers`.
- `voice.model` ghi đè bộ não OpenClaw agent cho phản hồi thoại Discord và các lượt tham vấn realtime. Để trống để kế thừa mô hình agent được định tuyến. Trường này tách biệt với `voice.realtime.model`.
- `voice.followUsers` cho phép bot tham gia, di chuyển và rời thoại Discord cùng các người dùng đã chọn. Xem [Theo dõi người dùng trong thoại](#follow-users-in-voice) để biết quy tắc hành vi và ví dụ.
- `agent-proxy` định tuyến lời nói qua `discord-voice`, giữ nguyên quyền chủ sở hữu/công cụ thông thường cho người nói và phiên đích nhưng ẩn công cụ `tts` của agent vì thoại Discord sở hữu việc phát lại. Theo mặc định, `agent-proxy` cấp cho lượt tham vấn quyền truy cập công cụ tương đương đầy đủ với chủ sở hữu đối với người nói là chủ sở hữu (`voice.realtime.toolPolicy: "owner"`) và ưu tiên mạnh việc tham vấn OpenClaw agent trước các câu trả lời thực chất (`voice.realtime.consultPolicy: "always"`). Trong chế độ `always` mặc định đó, lớp realtime không tự động nói phần đệm trước câu trả lời tham vấn; nó thu và phiên âm lời nói, rồi nói câu trả lời OpenClaw đã định tuyến. Nếu nhiều câu trả lời tham vấn bắt buộc hoàn tất khi Discord vẫn đang phát câu trả lời đầu tiên, các câu trả lời có lời nói chính xác sau đó sẽ được xếp hàng cho đến khi phát lại rảnh, thay vì thay thế lời nói giữa câu.
- Trong chế độ `stt-tts`, STT dùng `tools.media.audio`; `voice.model` không ảnh hưởng đến việc phiên âm.
- Trong các chế độ realtime, `voice.realtime.provider`, `voice.realtime.model` và `voice.realtime.speakerVoice` cấu hình phiên âm thanh realtime. Với OpenAI Realtime 2 cộng với bộ não Codex, dùng `voice.realtime.model: "gpt-realtime-2"` và `voice.model: "openai/gpt-5.5"`.
- Các chế độ giọng nói realtime mặc định đưa các tệp hồ sơ nhỏ `IDENTITY.md`, `USER.md` và `SOUL.md` vào hướng dẫn của nhà cung cấp realtime để các lượt trực tiếp nhanh giữ cùng danh tính, nền tảng người dùng và persona như OpenClaw agent được định tuyến. Đặt `voice.realtime.bootstrapContextFiles` thành một tập con để tùy chỉnh điều này, hoặc `[]` để tắt. Các tệp bootstrap realtime được hỗ trợ chỉ giới hạn ở những tệp hồ sơ đó; `AGENTS.md` vẫn ở trong ngữ cảnh agent thông thường. Ngữ cảnh hồ sơ được chèn không thay thế `openclaw_agent_consult` cho công việc workspace, dữ kiện hiện tại, tra cứu bộ nhớ hoặc hành động có công cụ hỗ trợ.
- Trong chế độ realtime `agent-proxy` của OpenAI, đặt `voice.realtime.requireWakeName: true` để giữ thoại realtime Discord im lặng cho đến khi bản phiên âm bắt đầu hoặc kết thúc bằng tên đánh thức. Các tên đánh thức được cấu hình phải gồm một hoặc hai từ. Nếu `voice.realtime.wakeNames` chưa được đặt, OpenClaw dùng `name` của agent được định tuyến cộng với `OpenClaw`, rồi dự phòng về id agent cộng với `OpenClaw`. Cổng tên đánh thức tắt tự động phản hồi của nhà cung cấp realtime, định tuyến các lượt được chấp nhận qua đường dẫn tham vấn OpenClaw agent, và đưa ra một lời xác nhận ngắn khi tên đánh thức ở đầu được nhận diện từ phiên âm từng phần trước khi bản phiên âm cuối cùng đến.
- Nhà cung cấp realtime OpenAI chấp nhận tên sự kiện Realtime 2 hiện tại và các alias cũ tương thích với Codex cho sự kiện âm thanh đầu ra và phiên âm, nên các snapshot nhà cung cấp tương thích có thể lệch mà không làm mất âm thanh trợ lý.
- `voice.realtime.bargeIn` điều khiển việc các sự kiện bắt đầu nói của người nói Discord có ngắt phát lại realtime đang hoạt động hay không. Nếu chưa đặt, nó tuân theo thiết lập ngắt âm thanh đầu vào của nhà cung cấp realtime.
- `voice.realtime.minBargeInAudioEndMs` điều khiển thời lượng phát lại trợ lý tối thiểu trước khi barge-in realtime của OpenAI cắt ngắn âm thanh. Mặc định: `250`. Đặt `0` để ngắt ngay trong phòng ít vọng, hoặc tăng lên cho thiết lập loa nhiều vọng.
- Với giọng OpenAI khi phát lại trên Discord, đặt `voice.tts.provider: "openai"` và chọn một giọng Text-to-speech trong `voice.tts.providers.openai.speakerVoice`. `cedar` là một lựa chọn có âm sắc nam tính tốt trên mô hình TTS OpenAI hiện tại.
- Các ghi đè `systemPrompt` theo kênh của Discord áp dụng cho lượt bản phiên âm thoại của kênh thoại đó.
- Các lượt bản phiên âm thoại suy ra trạng thái chủ sở hữu từ `allowFrom` của Discord (hoặc `dm.allowFrom`) cho các lệnh bị chặn theo chủ sở hữu và hành động kênh. Khả năng hiển thị công cụ agent tuân theo chính sách công cụ đã cấu hình cho phiên được định tuyến.
- Thoại Discord là tùy chọn bật cho cấu hình chỉ văn bản; đặt `channels.discord.voice.enabled=true` (hoặc giữ một khối `channels.discord.voice` hiện có) để bật lệnh `/vc`, runtime thoại và Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng việc đăng ký intent trạng thái thoại. Để trống để intent tuân theo trạng thái bật thoại hiệu lực.
- Nếu `voice.autoJoin` có nhiều mục cho cùng một guild, OpenClaw tham gia kênh được cấu hình cuối cùng cho guild đó.
- `voice.allowedChannels` là một allowlist cư trú tùy chọn. Để trống để cho phép `/vc join` vào bất kỳ kênh thoại Discord được ủy quyền nào. Khi được đặt, `/vc join`, tự động tham gia khi khởi động và các lần di chuyển trạng thái thoại của bot bị giới hạn trong các mục `{ guildId, channelId }` đã liệt kê. Đặt thành mảng rỗng để từ chối mọi lượt tham gia thoại Discord. Nếu Discord di chuyển bot ra ngoài allowlist, OpenClaw rời kênh đó và tham gia lại đích auto-join đã cấu hình khi có sẵn.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được truyền qua các tùy chọn tham gia của `@discordjs/voice`.
- Mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu chưa đặt.
- OpenClaw dùng codec `libopus-wasm` đi kèm để nhận thoại Discord và phát lại PCM thô realtime. Nó phân phối một bản dựng WebAssembly libopus được ghim và không yêu cầu addon opus native.
- `voice.connectTimeoutMs` điều khiển thời gian chờ Ready ban đầu của `@discordjs/voice` cho các lần thử `/vc join` và auto-join. Mặc định: `30000`.
- `voice.reconnectGraceMs` điều khiển thời gian OpenClaw chờ một phiên thoại đã ngắt kết nối bắt đầu kết nối lại trước khi hủy nó. Mặc định: `15000`.
- Trong chế độ `stt-tts`, phát lại giọng nói không dừng chỉ vì một người dùng khác bắt đầu nói. Để tránh vòng lặp phản hồi âm thanh, OpenClaw bỏ qua việc thu giọng nói mới trong khi TTS đang phát; hãy nói sau khi phát lại kết thúc cho lượt tiếp theo. Các chế độ realtime chuyển tiếp sự kiện người nói bắt đầu nói dưới dạng tín hiệu barge-in đến nhà cung cấp realtime.
- Trong các chế độ realtime, tiếng vọng từ loa vào mic mở có thể trông giống barge-in và ngắt phát lại. Với các phòng Discord nhiều vọng, đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` để ngăn OpenAI tự động ngắt khi có âm thanh đầu vào. Thêm `voice.realtime.bargeIn: true` nếu bạn vẫn muốn sự kiện bắt đầu nói của người nói Discord ngắt phát lại đang hoạt động. Cầu nối realtime OpenAI bỏ qua các lần cắt ngắn phát lại ngắn hơn `voice.realtime.minBargeInAudioEndMs` vì nhiều khả năng là vọng/nhiễu và ghi log là đã bỏ qua thay vì xóa phát lại Discord.
- `voice.captureSilenceGraceMs` điều khiển thời gian OpenClaw chờ sau khi Discord báo người nói đã dừng trước khi hoàn tất đoạn âm thanh đó cho STT. Mặc định: `2000`; tăng giá trị này nếu Discord tách các khoảng ngừng bình thường thành bản phiên âm từng phần rời rạc.
- Khi ElevenLabs là nhà cung cấp TTS đã chọn, phát lại thoại Discord dùng TTS streaming và bắt đầu từ luồng phản hồi của nhà cung cấp. Nhà cung cấp không hỗ trợ streaming sẽ dự phòng về đường dẫn tệp tạm đã tổng hợp.
- OpenClaw cũng theo dõi lỗi giải mã khi nhận và tự động khôi phục bằng cách rời/tham gia lại kênh thoại sau nhiều lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu log nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và log. Dòng `@discordjs/voice` đi kèm bao gồm bản sửa padding upstream từ PR discord.js #11449, đã đóng issue discord.js #11419.
- Các sự kiện nhận `The operation was aborted` là dự kiến khi OpenClaw hoàn tất một đoạn người nói đã thu; chúng là chẩn đoán chi tiết, không phải cảnh báo.
- Log thoại Discord chi tiết bao gồm bản xem trước bản phiên âm STT một dòng có giới hạn cho mỗi đoạn người nói được chấp nhận, nên việc gỡ lỗi hiển thị cả phía người dùng và phía phản hồi agent mà không đổ văn bản phiên âm không giới hạn.
- Trong chế độ `agent-proxy`, dự phòng tham vấn bắt buộc bỏ qua các mảnh bản phiên âm có khả năng chưa hoàn chỉnh, chẳng hạn văn bản kết thúc bằng `...` hoặc một từ nối ở cuối như `and`, cộng với các câu kết rõ ràng không cần hành động như “be right back” hoặc “bye”. Log hiển thị `forced agent consult skipped reason=...` khi điều này ngăn một câu trả lời xếp hàng đã cũ.

### Theo dõi người dùng trong thoại

Dùng `voice.followUsers` khi bạn muốn bot thoại Discord ở cùng một hoặc nhiều người dùng Discord đã biết thay vì tham gia một kênh cố định khi khởi động hoặc chờ `/vc join`.

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

- `followUsers` chấp nhận ID người dùng Discord thô và các giá trị `discord:<id>`. OpenClaw chuẩn hóa cả hai dạng trước khi khớp sự kiện trạng thái thoại.
- `followUsersEnabled` mặc định là `true` khi `followUsers` được cấu hình. Đặt thành `false` để giữ danh sách đã lưu nhưng dừng theo dõi thoại tự động.
- Khi một người dùng được theo dõi tham gia kênh thoại được phép, OpenClaw tham gia kênh đó. Khi người dùng di chuyển, OpenClaw di chuyển cùng họ. Khi người dùng được theo dõi đang hoạt động ngắt kết nối, OpenClaw rời đi.
- Nếu nhiều người dùng được theo dõi ở cùng một guild và người dùng được theo dõi đang hoạt động rời đi, OpenClaw chuyển đến kênh của một người dùng được theo dõi khác trước khi rời guild. Nếu vài người dùng được theo dõi di chuyển cùng lúc, sự kiện trạng thái thoại được quan sát mới nhất sẽ thắng.
- `allowedChannels` vẫn áp dụng. Một người dùng được theo dõi trong kênh không được phép sẽ bị bỏ qua, và phiên do follow sở hữu sẽ chuyển đến một người dùng được theo dõi khác hoặc rời đi.
- OpenClaw đối chiếu các sự kiện trạng thái thoại bị bỏ lỡ khi khởi động và theo một khoảng thời gian có giới hạn. Đối chiếu lấy mẫu các guild đã cấu hình và giới hạn số lượt tra cứu REST mỗi lần chạy, nên các danh sách `followUsers` rất lớn có thể cần nhiều hơn một khoảng thời gian để hội tụ.
- Nếu Discord hoặc quản trị viên di chuyển bot trong khi nó đang theo dõi một người dùng, OpenClaw dựng lại phiên thoại và giữ quyền sở hữu follow khi đích đến được phép. Nếu bot bị di chuyển ra ngoài `allowedChannels`, OpenClaw rời đi và tham gia lại đích đã cấu hình khi có.
- Khôi phục nhận DAVE có thể rời và tham gia lại cùng kênh sau nhiều lỗi giải mã lặp lại. Các phiên do follow sở hữu giữ quyền sở hữu follow qua đường dẫn khôi phục đó, nên một lần ngắt kết nối sau đó của người dùng được theo dõi vẫn sẽ rời kênh.

Chọn giữa các chế độ tham gia:

- Dùng `followUsers` cho thiết lập cá nhân hoặc vận hành viên nơi bot nên tự động ở trong thoại khi bạn ở đó.
- Dùng `autoJoin` cho bot phòng cố định cần hiện diện ngay cả khi không có người dùng được theo dõi nào ở trong thoại.
- Dùng `/vc join` cho các lần tham gia một lần hoặc phòng nơi sự hiện diện thoại tự động sẽ gây bất ngờ.

Codec thoại Discord:

- Nhật ký nhận giọng nói hiển thị `discord voice: opus decoder: libopus-wasm`.
- Phát lại thời gian thực mã hóa PCM stereo thô 48 kHz sang Opus bằng cùng gói `libopus-wasm` được đóng gói kèm trước khi chuyển các gói tin cho `@discordjs/voice`.
- Phát lại tệp và luồng nhà cung cấp chuyển mã sang PCM stereo thô 48 kHz bằng ffmpeg, sau đó dùng `libopus-wasm` cho luồng gói Opus gửi đến Discord.

Pipeline STT cộng TTS:

- Bản ghi PCM của Discord được chuyển đổi thành tệp tạm WAV.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản chép lời được gửi qua luồng vào và định tuyến Discord trong khi LLM phản hồi chạy với chính sách đầu ra giọng nói ẩn công cụ `tts` của agent và yêu cầu trả về văn bản, vì giọng nói Discord sở hữu phát lại TTS cuối cùng.
- `voice.model`, khi được đặt, chỉ ghi đè LLM phản hồi cho lượt kênh thoại này.
- `voice.tts` được hợp nhất đè lên `messages.tts`; các nhà cung cấp hỗ trợ phát trực tiếp cấp dữ liệu trực tiếp cho trình phát, nếu không tệp âm thanh tạo ra sẽ được phát trong kênh đã tham gia.

Ví dụ phiên kênh thoại agent-proxy mặc định:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Khi không có khối `voice.agentSession`, mỗi kênh thoại sẽ có phiên OpenClaw được định tuyến riêng. Ví dụ, `/vc join channel:234567890123456789` nói chuyện với phiên cho kênh thoại Discord đó. Mô hình thời gian thực chỉ là giao diện giọng nói phía trước; các yêu cầu thực chất được chuyển cho agent OpenClaw đã cấu hình. Nếu mô hình thời gian thực tạo bản chép lời cuối cùng mà không gọi công cụ tham vấn, OpenClaw buộc tham vấn như một phương án dự phòng để mặc định vẫn hoạt động như đang nói chuyện với agent.

Ví dụ STT cộng TTS cũ:

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

Ví dụ bidi thời gian thực:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Ở chế độ `agent-proxy`, bot tham gia kênh thoại đã cấu hình, nhưng các lượt agent OpenClaw sử dụng phiên và agent được định tuyến bình thường của kênh đích. Phiên giọng nói thời gian thực đọc kết quả trả về lại vào kênh thoại. Agent giám sát vẫn có thể dùng các công cụ nhắn tin bình thường theo chính sách công cụ của nó, bao gồm gửi một tin nhắn Discord riêng nếu đó là hành động phù hợp.

Trong khi một lượt chạy OpenClaw được ủy quyền đang hoạt động, các bản chép lời giọng nói Discord mới được xử lý như điều khiển lượt chạy trực tiếp trước khi bắt đầu một lượt agent khác. Các cụm từ như "status", "cancel that", "use the smaller fix", hoặc "when you're done also check tests" được phân loại là trạng thái, hủy, điều hướng, hoặc đầu vào theo dõi cho phiên đang hoạt động. Các kết quả trạng thái, hủy, điều hướng được chấp nhận, và theo dõi được đọc lại vào kênh thoại để người gọi biết OpenClaw đã xử lý yêu cầu hay chưa.

Các dạng đích hữu ích:

- `target: "channel:123456789012345678"` định tuyến qua một phiên kênh văn bản Discord.
- `target: "123456789012345678"` được xử lý như một đích kênh.
- `target: "dm:123456789012345678"` hoặc `target: "user:123456789012345678"` định tuyến qua phiên tin nhắn trực tiếp đó.

Ví dụ OpenAI Realtime có nhiều tiếng vọng:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
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

Dùng cấu hình này khi mô hình nghe thấy phần phát lại Discord của chính nó qua mic mở, nhưng bạn vẫn muốn ngắt nó bằng cách nói. OpenClaw ngăn OpenAI tự động ngắt trên âm thanh đầu vào thô, trong khi `bargeIn: true` cho phép sự kiện bắt đầu nói của loa Discord và âm thanh loa đã hoạt động hủy các phản hồi thời gian thực đang hoạt động trước khi lượt đã ghi tiếp theo tới OpenAI. Các tín hiệu chen ngang rất sớm có `audioEndMs` thấp hơn `minBargeInAudioEndMs` được xử lý là có khả năng là tiếng vọng/nhiễu và bị bỏ qua để mô hình không bị cắt ở khung phát lại đầu tiên.

Nhật ký giọng nói kỳ vọng:

- Khi tham gia: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Khi bắt đầu thời gian thực: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Khi có âm thanh loa: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, và `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Khi bỏ qua lời nói cũ: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` hoặc `reason=non-actionable-closing ...`
- Khi hoàn tất phản hồi thời gian thực: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Khi dừng/đặt lại phát lại: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Khi tham vấn thời gian thực: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Khi agent trả lời: `discord voice: agent turn answer ...`
- Khi xếp hàng lời nói chính xác: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, tiếp theo là `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Khi phát hiện chen ngang: `discord voice: realtime barge-in detected source=speaker-start ...` hoặc `discord voice: realtime barge-in detected source=active-speaker-audio ...`, tiếp theo là `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Khi ngắt thời gian thực: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, tiếp theo là `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` hoặc `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Khi bỏ qua tiếng vọng/nhiễu: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Khi chen ngang bị tắt: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Khi phát lại nhàn rỗi: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Để gỡ lỗi âm thanh bị cắt, đọc nhật ký giọng nói thời gian thực như một dòng thời gian:

1. `realtime audio playback started` nghĩa là Discord đã bắt đầu phát âm thanh của trợ lý. Cầu nối bắt đầu đếm các đoạn đầu ra của trợ lý, byte PCM Discord, byte thời gian thực của nhà cung cấp, và thời lượng âm thanh tổng hợp từ thời điểm này.
2. `realtime speaker turn opened` đánh dấu một người nói Discord trở nên hoạt động. Nếu phát lại đã hoạt động và `bargeIn` được bật, điều này có thể được theo sau bởi `barge-in detected source=speaker-start`.
3. `realtime input audio started` đánh dấu khung âm thanh thực tế đầu tiên nhận được cho lượt nói đó. `outputActive=true` hoặc `outputAudioMs` khác không ở đây nghĩa là mic đang gửi đầu vào trong khi phát lại của trợ lý vẫn đang hoạt động.
4. `barge-in detected source=active-speaker-audio` nghĩa là OpenClaw thấy âm thanh người nói trực tiếp trong khi phát lại của trợ lý đang hoạt động. Điều này hữu ích để phân biệt một lần ngắt thật với một sự kiện bắt đầu nói của Discord không có âm thanh hữu ích.
5. `barge-in requested reason=...` nghĩa là OpenClaw đã yêu cầu nhà cung cấp thời gian thực hủy hoặc cắt ngắn phản hồi đang hoạt động. Nó bao gồm `outputAudioMs`, `outputActive`, và `playbackChunks` để bạn có thể thấy lượng âm thanh trợ lý thực sự đã phát trước khi bị ngắt.
6. `realtime audio playback stopped reason=...` là điểm đặt lại phát lại Discord cục bộ. Lý do cho biết ai đã dừng phát lại: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, hoặc `session-close`.
7. `realtime speaker turn closed` tóm tắt lượt đầu vào đã ghi. `chunks=0` hoặc `hasAudio=false` nghĩa là lượt nói đã mở nhưng không có âm thanh dùng được nào tới được cầu nối thời gian thực. `interruptedPlayback=true` nghĩa là lượt đầu vào đó chồng lấp với đầu ra trợ lý và kích hoạt logic chen ngang.

Các trường hữu ích:

- `outputAudioMs`: thời lượng âm thanh trợ lý do nhà cung cấp thời gian thực tạo trước dòng nhật ký.
- `audioMs`: thời lượng âm thanh trợ lý mà OpenClaw đã đếm trước khi phát lại dừng.
- `elapsedMs`: thời gian đồng hồ thực giữa lúc mở và đóng luồng phát lại hoặc lượt nói.
- `discordBytes`: byte PCM stereo 48 kHz được gửi đến hoặc nhận từ giọng nói Discord.
- `realtimeBytes`: byte PCM theo định dạng nhà cung cấp được gửi đến hoặc nhận từ nhà cung cấp thời gian thực.
- `playbackChunks`: các đoạn âm thanh trợ lý được chuyển tiếp đến Discord cho phản hồi đang hoạt động.
- `sinceLastAudioMs`: khoảng cách giữa khung âm thanh người nói được ghi cuối cùng và lúc lượt nói đóng.

Các mẫu phổ biến:

- Bị cắt ngay lập tức với `source=active-speaker-audio`, `outputAudioMs` nhỏ, và cùng người dùng ở gần thường chỉ ra tiếng vọng loa đi vào mic. Tăng `voice.realtime.minBargeInAudioEndMs`, giảm âm lượng loa, dùng tai nghe, hoặc đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` theo sau bởi `speaker turn closed ... hasAudio=false` nghĩa là Discord đã báo một lần bắt đầu nói nhưng không có âm thanh nào tới OpenClaw. Đó có thể là sự kiện giọng nói Discord nhất thời, hành vi cổng nhiễu, hoặc một client bật mic trong chốc lát.
- `audio playback stopped reason=stream-close` mà không có chen ngang gần đó hoặc `provider-clear-audio` nghĩa là luồng phát lại Discord cục bộ đã kết thúc ngoài dự kiến. Kiểm tra các nhật ký nhà cung cấp và trình phát Discord trước đó.
- `capture ignored during playback (barge-in disabled)` nghĩa là OpenClaw cố ý loại bỏ đầu vào trong khi âm thanh trợ lý đang hoạt động. Bật `voice.realtime.bargeIn` nếu bạn muốn lời nói ngắt phát lại.
- `barge-in ignored ... outputActive=false` nghĩa là VAD của Discord hoặc nhà cung cấp đã báo có lời nói, nhưng OpenClaw không có phát lại đang hoạt động để ngắt. Điều này không nên cắt âm thanh.

Thông tin xác thực được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, xác thực TTS cho `messages.tts`/`voice.tts`, và xác thực nhà cung cấp thời gian thực cho `voice.realtime.providers` hoặc cấu hình xác thực bình thường của nhà cung cấp.

### Tin nhắn thoại

Tin nhắn thoại Discord hiển thị bản xem trước dạng sóng và yêu cầu âm thanh OGG/Opus. OpenClaw tự động tạo dạng sóng, nhưng cần `ffmpeg` và `ffprobe` trên máy chủ Gateway để kiểm tra và chuyển đổi.

- Cung cấp **đường dẫn tệp cục bộ** (URL sẽ bị từ chối).
- Bỏ qua nội dung văn bản (Discord từ chối văn bản + tin nhắn thoại trong cùng một payload).
- Mọi định dạng âm thanh đều được chấp nhận; OpenClaw chuyển đổi sang OGG/Opus khi cần.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào phân giải người dùng/thành viên
    - khởi động lại gateway sau khi thay đổi intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép guild trong `channels.discord.guilds`
    - nếu bản đồ `channels` của guild tồn tại, chỉ các kênh được liệt kê mới được phép
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
    - `requireMention` được cấu hình sai vị trí (phải nằm trong `channels.discord.guilds` hoặc mục kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của guild/kênh

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Các núm điều chỉnh hàng đợi Discord gateway:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - mục này chỉ kiểm soát công việc listener của Discord gateway, không phải thời lượng lượt agent

    Discord không áp dụng timeout do kênh sở hữu cho các lượt agent đang xếp hàng. Message listener bàn giao ngay lập tức, và các lần chạy Discord đang xếp hàng giữ nguyên thứ tự theo phiên cho đến khi vòng đời phiên/công cụ/runtime hoàn tất hoặc hủy bỏ công việc.

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
    OpenClaw lấy metadata `/gateway/bot` của Discord trước khi kết nối. Các lỗi tạm thời sẽ quay về URL Gateway mặc định của Discord và được giới hạn tần suất trong nhật ký.

    Các núm điều chỉnh timeout metadata:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback khi chưa đặt cấu hình: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw chờ sự kiện `READY` của Gateway Discord trong khi khởi động và sau khi runtime kết nối lại. Thiết lập nhiều tài khoản có giãn cách khởi động có thể cần cửa sổ READY khi khởi động dài hơn mặc định.

    Các núm điều chỉnh timeout READY:

    - khởi động một tài khoản: `channels.discord.gatewayReadyTimeoutMs`
    - khởi động nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - env fallback khi khởi động nếu chưa đặt cấu hình: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - mặc định khi khởi động: `15000` (15 giây), tối đa: `120000`
    - runtime một tài khoản: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - env fallback của runtime khi chưa đặt cấu hình: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - mặc định runtime: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Kiểm tra quyền `channels status --probe` chỉ hoạt động với ID kênh dạng số.

    Nếu bạn dùng khóa slug, khớp runtime vẫn có thể hoạt động, nhưng probe không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM bị tắt: `channels.discord.dm.enabled=false`
    - chính sách DM bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép nối trong chế độ `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Theo mặc định, tin nhắn do bot tạo sẽ bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng quy tắc mention và danh sách cho phép nghiêm ngặt để tránh hành vi vòng lặp.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn bot có mention bot.

    OpenClaw cũng cung cấp [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung. Bất cứ khi nào `allowBots` cho phép tin nhắn do bot tạo đến được dispatch, Discord ánh xạ sự kiện inbound thành các dữ kiện `(account, channel, bot pair)` và bộ bảo vệ cặp chung sẽ chặn cặp đó sau khi vượt ngân sách sự kiện đã cấu hình. Bộ bảo vệ ngăn các vòng lặp hai bot vượt kiểm soát vốn trước đây phải dừng bằng giới hạn tần suất của Discord; nó không ảnh hưởng đến triển khai một bot hoặc phản hồi bot một lần còn nằm trong ngân sách.

    Thiết lập mặc định (hoạt động khi `allowBots` được đặt):

    - `maxEventsPerWindow: 20` -- cặp bot có thể trao đổi 20 tin nhắn trong cửa sổ trượt
    - `windowSeconds: 60` -- độ dài cửa sổ trượt
    - `cooldownSeconds: 60` -- khi ngân sách bị vượt, mọi tin nhắn bot-sang-bot bổ sung theo cả hai chiều sẽ bị bỏ trong một phút

    Cấu hình mặc định dùng chung một lần trong `channels.defaults.botLoopProtection`, rồi ghi đè Discord khi một workflow hợp lệ cần thêm khoảng trống. Thứ tự ưu tiên là:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - mặc định tích hợp sẵn

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
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - giữ OpenClaw ở phiên bản hiện tại (`openclaw update`) để có logic khôi phục nhận thoại Discord
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

<Accordion title="High-signal Discord fields">

- khởi động/xác thực: `enabled`, `token`, `accounts.*`, `allowBots`
- chính sách: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- lệnh: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- hàng đợi sự kiện: `eventQueue.listenerTimeout` (ngân sách listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- trả lời/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- gửi: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (bí danh cũ: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/thử lại: `mediaMaxMb` (giới hạn upload Discord outbound, mặc định `100MB`), `retry`
- hành động: `actions.*`
- hiện diện: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là bí mật (ưu tiên `DISCORD_BOT_TOKEN` trong môi trường được giám sát).
- Cấp quyền Discord theo nguyên tắc đặc quyền tối thiểu.
- Nếu triển khai/trạng thái lệnh đã cũ, hãy khởi động lại Gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Discord với Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/vi/channels/groups">
    Hành vi trò chuyện nhóm và danh sách cho phép.
  </Card>
  <Card title="Channel routing" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn inbound đến agent.
  </Card>
  <Card title="Security" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và tăng cường bảo mật.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ guild và kênh tới agent.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh native.
  </Card>
</CardGroup>
