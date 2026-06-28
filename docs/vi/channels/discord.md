---
read_when:
    - Phát triển các tính năng kênh Discord
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Discord
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:41:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

Sẵn sàng cho DM và kênh máy chủ thông qua Discord gateway chính thức.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM Discord mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán và quy trình sửa lỗi liên kênh.
  </Card>
</CardGroup>

## Thiết lập nhanh

Bạn sẽ cần tạo một ứng dụng mới với bot, thêm bot vào máy chủ của mình và ghép nối nó với OpenClaw. Chúng tôi khuyên bạn nên thêm bot vào máy chủ riêng của bạn. Nếu bạn chưa có máy chủ, hãy [tạo một máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng Discord và bot">
    Đi tới [Discord Developer Portal](https://discord.com/developers/applications) và nhấp **New Application**. Đặt tên đại loại như "OpenClaw".

    Nhấp **Bot** trên thanh bên. Đặt **Username** thành bất kỳ tên nào bạn gọi tác nhân OpenClaw của mình.

  </Step>

  <Step title="Bật các intent đặc quyền">
    Vẫn trên trang **Bot**, cuộn xuống **Privileged Gateway Intents** và bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; bắt buộc cho danh sách cho phép theo vai trò và khớp tên sang ID)
    - **Presence Intent** (tùy chọn; chỉ cần cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Sao chép token bot của bạn">
    Cuộn lại lên trên trang **Bot** và nhấp **Reset Token**.

    <Note>
    Dù tên là vậy, thao tác này tạo token đầu tiên của bạn — không có gì bị "đặt lại".
    </Note>

    Sao chép token và lưu ở đâu đó. Đây là **Bot Token** của bạn và bạn sẽ cần nó ngay sau đây.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào máy chủ của bạn">
    Nhấp **OAuth2** trên thanh bên. Bạn sẽ tạo một URL mời với đúng quyền để thêm bot vào máy chủ của mình.

    Cuộn xuống **OAuth2 URL Generator** và bật:

    - `bot`
    - `applications.commands`

    Một phần **Bot Permissions** sẽ xuất hiện bên dưới. Bật ít nhất:

    **General Permissions**
      - Xem kênh
    **Text Permissions**
      - Gửi tin nhắn
      - Đọc lịch sử tin nhắn
      - Nhúng liên kết
      - Đính kèm tệp
      - Thêm phản ứng (tùy chọn)

    Đây là bộ quyền nền tảng cho các kênh văn bản thông thường. Nếu bạn dự định đăng trong các luồng Discord, bao gồm các quy trình kênh diễn đàn hoặc kênh media tạo hoặc tiếp tục một luồng, hãy bật cả **Send Messages in Threads**.
    Sao chép URL đã tạo ở dưới cùng, dán vào trình duyệt, chọn máy chủ của bạn và nhấp **Continue** để kết nối. Giờ bạn sẽ thấy bot của mình trong máy chủ Discord.

  </Step>

  <Step title="Bật Developer Mode và thu thập ID của bạn">
    Quay lại ứng dụng Discord, bạn cần bật Developer Mode để có thể sao chép ID nội bộ.

    1. Nhấp **User Settings** (biểu tượng bánh răng cạnh ảnh đại diện của bạn) → Cuộn đến **Developer** trong thanh bên → bật **Developer Mode**

        *(Lưu ý: Trên ứng dụng di động Discord, Developer Mode nằm trong **App Settings** → **Advanced**)*

    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trong thanh bên → **Copy Server ID**
    3. Nhấp chuột phải vào **ảnh đại diện của chính bạn** → **Copy User ID**

    Lưu **Server ID** và **User ID** cùng với Bot Token của bạn — bạn sẽ gửi cả ba cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Cho phép DM từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord cần cho phép bot gửi DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn → **Privacy Settings** → bật **Direct Messages**.

    Thao tác này cho phép thành viên máy chủ (bao gồm bot) gửi DM cho bạn. Giữ bật nếu bạn muốn dùng DM Discord với OpenClaw. Nếu bạn chỉ định dùng kênh máy chủ, bạn có thể tắt DM sau khi ghép nối.

  </Step>

  <Step title="Đặt token bot của bạn một cách an toàn (không gửi trong chat)">
    Token bot Discord của bạn là bí mật (giống mật khẩu). Đặt nó trên máy đang chạy OpenClaw trước khi nhắn tin cho tác nhân của bạn.

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
    Với các cài đặt dịch vụ được quản lý, chạy `openclaw gateway install` từ shell có `DISCORD_BOT_TOKEN`, hoặc lưu biến trong `~/.openclaw/.env`, để dịch vụ có thể phân giải env SecretRef sau khi khởi động lại.
    Nếu máy chủ của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/client Discord từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó. Dùng `channels.discord.applicationId` cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.applicationId` khi bạn chạy nhiều bot Discord.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Hỏi tác nhân của bạn">
        Chat với tác nhân OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ Telegram) và nói với nó. Nếu Discord là kênh đầu tiên của bạn, hãy dùng tab CLI / cấu hình thay thế.

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

        Để thiết lập bằng script hoặc từ xa, ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run` rồi chạy lại mà không có `--dry-run`. Các giá trị `token` dạng văn bản thuần được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các provider env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Với nhiều bot Discord, giữ mỗi token bot và ID ứng dụng dưới tài khoản của nó. `channels.discord.applicationId` cấp cao nhất được các tài khoản kế thừa, nên chỉ đặt ở đó khi mọi tài khoản nên dùng cùng một ID ứng dụng.

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
    Chờ đến khi gateway đang chạy, rồi gửi DM cho bot của bạn trong Discord. Nó sẽ phản hồi bằng mã ghép nối.

    <Tabs>
      <Tab title="Hỏi tác nhân của bạn">
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

    Giờ bạn có thể chat với tác nhân của mình trong Discord qua DM.

  </Step>
</Steps>

<Note>
Phân giải token có nhận biết tài khoản. Giá trị token trong cấu hình thắng env fallback. `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord đã bật phân giải về cùng một token bot, OpenClaw chỉ khởi động một trình giám sát gateway cho token đó. Token từ cấu hình thắng env fallback mặc định; nếu không, tài khoản đã bật đầu tiên thắng và tài khoản trùng lặp được báo cáo là đã tắt.
Đối với các lệnh gọi đi nâng cao (công cụ tin nhắn/hành động kênh), `token` rõ ràng theo từng lệnh gọi được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và đọc/thăm dò (ví dụ read/search/fetch/thread/pins/permissions). Chính sách tài khoản/cài đặt thử lại vẫn lấy từ tài khoản đã chọn trong ảnh chụp nhanh runtime đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập không gian làm việc máy chủ

Sau khi DM hoạt động, bạn có thể thiết lập máy chủ Discord làm không gian làm việc đầy đủ, nơi mỗi kênh có phiên tác nhân riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho máy chủ riêng chỉ có bạn và bot của bạn.

<Steps>
  <Step title="Thêm máy chủ của bạn vào danh sách cho phép máy chủ">
    Thao tác này cho phép tác nhân của bạn phản hồi trong bất kỳ kênh nào trên máy chủ, không chỉ DM.

    <Tabs>
      <Tab title="Hỏi tác nhân của bạn">
        > "Thêm Discord Server ID `<server_id>` của tôi vào danh sách cho phép máy chủ"
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

  <Step title="Cho phép phản hồi mà không cần @mention">
    Theo mặc định, tác nhân của bạn chỉ phản hồi trong kênh máy chủ khi được @mention. Với máy chủ riêng, có lẽ bạn muốn nó phản hồi mọi tin nhắn.

    Trong kênh máy chủ, các phản hồi thông thường mặc định sẽ tự động đăng. Với các phòng chia sẻ luôn bật, hãy chọn `messages.groupChat.visibleReplies: "message_tool"` để tác nhân có thể theo dõi thầm lặng và chỉ đăng khi nó quyết định phản hồi trong kênh là hữu ích. Điều này hoạt động tốt nhất với các mô hình thế hệ mới nhất, đáng tin cậy với công cụ, như GPT 5.5. Các sự kiện phòng nền vẫn im lặng trừ khi công cụ gửi. Xem [Sự kiện phòng nền](/vi/channels/ambient-room-events) để biết cấu hình đầy đủ của chế độ theo dõi thầm lặng.

    Nếu Discord hiển thị đang nhập và nhật ký cho thấy có sử dụng token nhưng không có tin nhắn được đăng, hãy kiểm tra xem lượt đó có được cấu hình là sự kiện phòng nền hay đã chọn phản hồi hiển thị bằng công cụ tin nhắn hay không.

    <Tabs>
      <Tab title="Hỏi tác nhân của bạn">
        > "Cho phép tác nhân của tôi phản hồi trên máy chủ này mà không cần được @mention"
      </Tab>
      <Tab title="Cấu hình">
        Đặt `requireMention: false` trong cấu hình máy chủ của bạn:

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

        Để yêu cầu gửi bằng công cụ tin nhắn cho phản hồi nhóm/kênh hiển thị, đặt `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Lập kế hoạch cho bộ nhớ trong kênh máy chủ">
    Theo mặc định, bộ nhớ dài hạn (MEMORY.md) chỉ tải trong phiên DM. Kênh máy chủ không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Hỏi tác nhân của bạn">
        > "Khi tôi đặt câu hỏi trong kênh Discord, hãy dùng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Nếu bạn cần ngữ cảnh dùng chung trong mọi kênh, hãy đặt các hướng dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được chèn cho mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập chúng theo nhu cầu bằng công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Giờ hãy tạo vài kênh trên máy chủ Discord của bạn và bắt đầu chat. Tác nhân của bạn có thể thấy tên kênh, và mỗi kênh có phiên cô lập riêng — nên bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất kỳ thứ gì phù hợp với quy trình làm việc của bạn.

## Mô hình runtime

- Gateway sở hữu kết nối Discord.
- Định tuyến trả lời là xác định: phản hồi gửi vào từ Discord sẽ trả lời lại Discord.
- Siêu dữ liệu guild/kênh Discord được thêm vào prompt của mô hình dưới dạng ngữ cảnh
  không đáng tin cậy, không phải tiền tố trả lời hiển thị với người dùng. Nếu mô hình sao chép phong bì đó
  trở lại, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi phản hồi gửi ra và khỏi
  ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), trò chuyện trực tiếp dùng chung phiên chính của tác nhân (`agent:main:main`).
- Kênh guild là các khóa phiên biệt lập (`agent:<agentId>:discord:channel:<channelId>`).
- DM nhóm bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Lệnh slash gốc chạy trong các phiên lệnh biệt lập (`agent:<agentId>:discord:slash:<userId>`), trong khi vẫn mang `CommandTargetSessionKey` tới phiên hội thoại được định tuyến.
- Việc gửi thông báo cron/heartbeat chỉ văn bản tới Discord dùng câu trả lời cuối cùng
  hiển thị với trợ lý một lần. Payload phương tiện và thành phần có cấu trúc vẫn là
  nhiều tin nhắn khi tác nhân phát ra nhiều payload có thể gửi được.

## Kênh diễn đàn

Kênh diễn đàn và kênh phương tiện của Discord chỉ chấp nhận bài đăng trong thread. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn tới diễn đàn cha (`channel:<forumId>`) để tự động tạo thread. Tiêu đề thread dùng dòng không rỗng đầu tiên trong tin nhắn của bạn.
- Dùng `openclaw message thread create` để tạo thread trực tiếp. Không truyền `--message-id` cho kênh diễn đàn.

Ví dụ: gửi tới diễn đàn cha để tạo thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ví dụ: tạo rõ ràng một thread diễn đàn

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Diễn đàn cha không chấp nhận thành phần Discord. Nếu bạn cần thành phần, hãy gửi tới chính thread đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ container thành phần Discord v2 cho tin nhắn của tác nhân. Dùng công cụ tin nhắn với payload `components`. Kết quả tương tác được định tuyến trở lại tác nhân như tin nhắn gửi vào thông thường và tuân theo các thiết lập Discord `replyToMode` hiện có.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Kiểu chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép nút, lựa chọn và biểu mẫu được dùng nhiều lần cho đến khi hết hạn.

Để giới hạn người có thể bấm nút, đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ, hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận thông báo từ chối tạm thời.

Callback thành phần hết hạn sau 30 phút theo mặc định. Đặt `channels.discord.agentComponents.ttlMs` để thay đổi thời gian tồn tại của registry callback đó cho tài khoản Discord mặc định, hoặc `channels.discord.accounts.<accountId>.agentComponents.ttlMs` để ghi đè một tài khoản trong thiết lập nhiều tài khoản. Giá trị tính bằng mili giây, phải là số nguyên dương, và bị giới hạn ở `86400000` (24 giờ). TTL dài hơn hữu ích cho quy trình review hoặc phê duyệt cần nút tiếp tục dùng được, nhưng chúng cũng kéo dài khoảng thời gian mà một tin nhắn Discord cũ vẫn có thể kích hoạt hành động. Ưu tiên TTL ngắn nhất phù hợp với quy trình, và giữ mặc định khi callback cũ có thể gây bất ngờ.

Các lệnh slash `/model` và `/models` mở một bộ chọn mô hình tương tác với danh sách thả xuống nhà cung cấp, mô hình và runtime tương thích, cộng thêm bước Submit. `/models add` đã bị loại bỏ dần và giờ trả về thông báo ngừng dùng thay vì đăng ký mô hình từ trò chuyện. Phản hồi của bộ chọn là tạm thời và chỉ người dùng đã gọi lệnh mới có thể dùng. Menu chọn của Discord bị giới hạn ở 25 tùy chọn, vì vậy hãy thêm các mục `provider/*` vào `agents.defaults.models` khi bạn muốn bộ chọn chỉ hiển thị các mô hình được phát hiện động cho những nhà cung cấp được chọn như `openai` hoặc `vllm`.

Tệp đính kèm:

- Khối `file` phải trỏ tới một tham chiếu tệp đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); dùng `media-gallery` cho nhiều tệp
- Dùng `filename` để ghi đè tên tải lên khi nó cần khớp với tham chiếu tệp đính kèm

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
  <Tab title="Chính sách DM">
    `channels.discord.dmPolicy` kiểm soát quyền truy cập DM. `channels.discord.allowFrom` là danh sách cho phép DM chuẩn.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.discord.allowFrom` bao gồm `"*"`)
    - `disabled`

    Nếu chính sách DM không mở, người dùng không xác định sẽ bị chặn (hoặc được nhắc ghép đôi trong chế độ `pairing`).

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Với một tài khoản, `allowFrom` có ưu tiên hơn `dm.allowFrom` cũ.
    - Tài khoản có tên kế thừa `channels.discord.allowFrom` khi `allowFrom` riêng và `dm.allowFrom` cũ của chúng chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Định dạng đích DM để gửi:

    - `user:<id>`
    - đề cập `<@id>`

    ID số trần thường được phân giải như ID kênh khi mặc định kênh đang hoạt động, nhưng các ID được liệt kê trong `allowFrom` DM hiệu lực của tài khoản được coi là đích DM người dùng để tương thích.

  </Tab>

  <Tab title="Nhóm truy cập">
    DM Discord và ủy quyền lệnh văn bản có thể dùng các mục `accessGroup:<name>` động trong `channels.discord.allowFrom`.

    Tên nhóm truy cập được chia sẻ giữa các kênh tin nhắn. Dùng `type: "message.senders"` cho một nhóm tĩnh có thành viên được biểu diễn bằng cú pháp `allowFrom` bình thường của từng kênh, hoặc `type: "discord.channelAudience"` khi đối tượng `ViewChannel` hiện tại của một kênh Discord nên xác định tư cách thành viên một cách động. Hành vi nhóm truy cập dùng chung được ghi lại tại đây: [Nhóm truy cập](/vi/channels/access-groups).

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

    Kênh văn bản Discord không có danh sách thành viên riêng. `type: "discord.channelAudience"` mô hình hóa tư cách thành viên như sau: người gửi DM là thành viên của guild được cấu hình và hiện có quyền `ViewChannel` hiệu lực trên kênh được cấu hình sau khi áp dụng vai trò và ghi đè kênh.

    Ví dụ: cho phép bất kỳ ai có thể thấy `#maintainers` gửi DM cho bot, đồng thời vẫn đóng DM với mọi người khác.

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

    Tra cứu thất bại theo hướng đóng. Nếu Discord trả về `Missing Access`, tra cứu thành viên thất bại, hoặc kênh thuộc về guild khác, người gửi DM được coi là không được ủy quyền.

    Bật **Server Members Intent** trong Discord Developer Portal cho bot khi dùng nhóm truy cập theo đối tượng kênh. DM không bao gồm trạng thái thành viên guild, vì vậy OpenClaw phân giải thành viên qua Discord REST tại thời điểm ủy quyền.

  </Tab>

  <Tab title="Chính sách guild">
    Xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Mức nền an toàn khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được cho phép khi họ khớp với `users` HOẶC `roles`
    - khớp trực tiếp tên/thẻ bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` như chế độ tương thích phá kính khẩn cấp
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng mục tên/thẻ
    - nếu một guild có cấu hình `channels`, các kênh không được liệt kê sẽ bị từ chối
    - nếu một guild không có khối `channels`, tất cả kênh trong guild được đưa vào danh sách cho phép đó đều được phép

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

  <Tab title="Đề cập và DM nhóm">
    Tin nhắn guild được chặn theo đề cập theo mặc định.

    Phát hiện đề cập bao gồm:

    - đề cập bot rõ ràng
    - mẫu đề cập được cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - hành vi trả lời-ngầm-tới-bot trong các trường hợp được hỗ trợ

    Khi viết tin nhắn Discord gửi ra, dùng cú pháp đề cập chuẩn: `<@USER_ID>` cho người dùng, `<#CHANNEL_ID>` cho kênh, và `<@&ROLE_ID>` cho vai trò. Không dùng dạng đề cập biệt danh cũ `<@!USER_ID>`.

    `requireMention` được cấu hình theo từng guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn bỏ qua tin nhắn đề cập người dùng/vai trò khác nhưng không đề cập bot (không tính @everyone/@here).

    DM nhóm:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến tác nhân dựa trên vai trò

Sử dụng `bindings[].match.roles` để định tuyến thành viên guild Discord tới các tác nhân khác nhau theo ID vai trò. Các binding dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau các binding peer hoặc parent-peer và trước các binding chỉ theo guild. Nếu một binding cũng đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả các trường đã cấu hình đều phải khớp.

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
- `commands.native=false` bỏ qua việc đăng ký và dọn dẹp lệnh slash của Discord trong quá trình khởi động. Các lệnh đã đăng ký trước đó có thể vẫn hiển thị trong Discord cho đến khi bạn xóa chúng khỏi ứng dụng Discord.
- Xác thực lệnh gốc sử dụng cùng danh sách cho phép/chính sách Discord như xử lý tin nhắn thông thường.
- Lệnh vẫn có thể hiển thị trong giao diện Discord cho người dùng không được cấp quyền; quá trình thực thi vẫn áp dụng xác thực OpenClaw và trả về "không được cấp quyền".

Xem [Lệnh slash](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

Cài đặt lệnh slash mặc định:

- `ephemeral: true`

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Thẻ trả lời và trả lời gốc">
    Discord hỗ trợ thẻ trả lời trong đầu ra của tác nhân:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được điều khiển bởi `channels.discord.replyToMode`:

    - `off` (mặc định)
    - `first`
    - `all`
    - `batched`

    Lưu ý: `off` tắt luồng trả lời ngầm định. Các thẻ `[[reply_to_*]]` tường minh vẫn được tôn trọng.
    `first` luôn gắn tham chiếu trả lời gốc ngầm định vào tin nhắn Discord gửi ra đầu tiên cho lượt đó.
    `batched` chỉ gắn tham chiếu trả lời gốc ngầm định của Discord khi sự kiện
    đầu vào là một lô đã được debounce gồm nhiều tin nhắn. Điều này hữu ích
    khi bạn muốn trả lời gốc chủ yếu cho các cuộc trò chuyện bùng nổ khó phân định, không phải mọi
    lượt một tin nhắn đơn lẻ.

    ID tin nhắn được hiển thị trong ngữ cảnh/lịch sử để tác nhân có thể nhắm tới các tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Xem trước liên kết">
    Discord mặc định tạo embed liên kết phong phú cho URL. OpenClaw mặc định chặn các embed được tạo đó trên tin nhắn Discord gửi ra, để URL do tác nhân gửi vẫn là liên kết thuần trừ khi bạn bật:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Đặt `channels.discord.accounts.<id>.suppressEmbeds` để ghi đè một tài khoản. Các lần gửi bằng công cụ tin nhắn của tác nhân cũng có thể truyền `suppressEmbeds: false` cho một tin nhắn đơn lẻ. Payload Discord `embeds` tường minh không bị chặn bởi cài đặt xem trước liên kết mặc định.

  </Accordion>

  <Accordion title="Xem trước luồng trực tiếp">
    OpenClaw có thể stream bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa nó khi văn bản đến. `channels.discord.streaming` nhận `off` | `partial` | `block` | `progress` (mặc định). `progress` giữ một bản nháp trạng thái có thể chỉnh sửa và cập nhật nó với tiến trình công cụ cho đến khi gửi cuối cùng; nhãn khởi đầu dùng chung là một dòng cuộn, nên nó sẽ cuộn đi như phần còn lại khi có đủ công việc xuất hiện. `streamMode` là bí danh runtime cũ. Chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu sang khóa chuẩn.

    Đặt `channels.discord.streaming.mode` thành `off` để tắt các chỉnh sửa xem trước Discord. Nếu streaming khối của Discord được bật tường minh, OpenClaw sẽ bỏ qua luồng xem trước để tránh streaming hai lần.

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
    - `block` phát các đoạn có kích thước bản nháp (dùng `draftChunk` để tinh chỉnh kích thước và điểm ngắt, bị giới hạn bởi `textChunkLimit`).
    - Kết quả cuối có media, lỗi và trả lời tường minh sẽ hủy các chỉnh sửa xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) kiểm soát việc cập nhật công cụ/tiến trình có tái sử dụng tin nhắn xem trước hay không.
    - Các hàng công cụ/tiến trình được hiển thị dưới dạng biểu tượng cảm xúc + tiêu đề + chi tiết gọn khi có, ví dụ `🛠️ Bash: run tests` hoặc `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (mặc định `false`) chọn đưa văn bản bình luận/mở đầu của assistant vào bản nháp tiến trình tạm thời. Bình luận được dọn trước khi hiển thị, vẫn là tạm thời và không thay đổi cách gửi câu trả lời cuối cùng.
    - `streaming.progress.maxLineChars` kiểm soát ngân sách xem trước tiến trình theo từng dòng. Văn xuôi được rút ngắn theo ranh giới từ; chi tiết lệnh và đường dẫn giữ các hậu tố hữu ích.
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

    Streaming xem trước chỉ hỗ trợ văn bản; trả lời có media quay về cách gửi thông thường. Khi streaming `block` được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh streaming hai lần.

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
    - Phiên luồng kế thừa lựa chọn `/model` cấp phiên của kênh cha làm dự phòng chỉ theo mô hình; lựa chọn `/model` cục bộ của luồng vẫn được ưu tiên và lịch sử bản ghi kênh cha không được sao chép trừ khi bật kế thừa bản ghi.
    - `channels.discord.thread.inheritParent` (mặc định `false`) chọn cho các auto-thread mới được khởi tạo từ bản ghi cha. Ghi đè theo tài khoản nằm dưới `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng của công cụ tin nhắn có thể phân giải mục tiêu DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong dự phòng kích hoạt giai đoạn trả lời.

    Chủ đề kênh được đưa vào làm ngữ cảnh **không đáng tin cậy**. Danh sách cho phép kiểm soát ai có thể kích hoạt tác nhân, không phải ranh giới biên tập lại ngữ cảnh bổ sung đầy đủ.

  </Accordion>

  <Accordion title="Phiên gắn với luồng cho tác nhân phụ">
    Discord có thể gắn một luồng với mục tiêu phiên để các tin nhắn tiếp theo trong luồng đó tiếp tục định tuyến tới cùng phiên (bao gồm phiên tác nhân phụ).

    Lệnh:

    - `/focus <target>` gắn luồng hiện tại/mới với mục tiêu tác nhân phụ/phiên
    - `/unfocus` xóa binding luồng hiện tại
    - `/agents` hiển thị các lượt chạy đang hoạt động và trạng thái binding
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động unfocus khi không hoạt động cho các binding đã focus
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng cho các binding đã focus

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
    - `spawnSessions` kiểm soát việc tự động tạo/gắn luồng cho `sessions_spawn({ thread: true })` và các lần spawn luồng ACP. Mặc định: `true`.
    - `defaultSpawnContext` kiểm soát ngữ cảnh tác nhân phụ gốc cho các lần spawn gắn với luồng. Mặc định: `"fork"`.
    - Các khóa `spawnSubagentSessions`/`spawnAcpSessions` không còn được khuyến nghị được di chuyển bởi `openclaw doctor --fix`.
    - Nếu binding luồng bị tắt cho một tài khoản, `/focus` và các thao tác binding luồng liên quan sẽ không khả dụng.

    Xem [Tác nhân phụ](/vi/tools/subagents), [Tác nhân ACP](/vi/tools/acp-agents), và [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding kênh ACP bền vững">
    Đối với các workspace ACP "luôn bật" ổn định, hãy cấu hình binding ACP có kiểu ở cấp cao nhất nhắm tới các cuộc trò chuyện Discord.

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

    - `/acp spawn codex --bind here` gắn kênh hoặc luồng hiện tại tại chỗ và giữ các tin nhắn tương lai trên cùng phiên ACP. Tin nhắn luồng kế thừa binding kênh cha.
    - Trong một kênh hoặc luồng đã gắn, `/new` và `/reset` đặt lại cùng phiên ACP tại chỗ. Binding luồng tạm thời có thể ghi đè phân giải mục tiêu khi đang hoạt động.
    - `spawnSessions` kiểm soát việc tạo/gắn luồng con qua `--thread auto|here`.

    Xem [Tác nhân ACP](/vi/tools/acp-agents) để biết chi tiết hành vi binding.

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Chế độ thông báo phản ứng theo từng guild:

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (sử dụng `guilds.<id>.users`)

    Sự kiện phản ứng được chuyển thành sự kiện hệ thống và gắn vào phiên Discord đã định tuyến.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đầu vào.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - dự phòng emoji định danh tác nhân (`agents.list[].identity.emoji`, nếu không thì "👀")

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
    Định tuyến lưu lượng WebSocket gateway Discord và các tra cứu REST khi khởi động (ID ứng dụng + phân giải danh sách cho phép) qua proxy HTTP(S) với `channels.discord.proxy`.

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
    - tên hiển thị của thành viên chỉ được khớp theo tên/slug khi `channels.discord.dangerouslyAllowNameMatching: true`
    - việc tra cứu dùng ID tin nhắn gốc và bị giới hạn theo khung thời gian
    - nếu tra cứu thất bại, tin nhắn được proxy sẽ được xem là tin nhắn bot và bị loại bỏ trừ khi `allowBots=true`

  </Accordion>

  <Accordion title="Bí danh đề cập gửi đi">
    Dùng `mentionAliases` khi agent cần các đề cập gửi đi có tính xác định cho người dùng Discord đã biết. Khóa là handle không có ký tự `@` ở đầu; giá trị là ID người dùng Discord. Các handle không xác định, `@everyone`, `@here`, và đề cập bên trong code span Markdown được giữ nguyên.

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
    Các cập nhật hiện diện được áp dụng khi bạn đặt trường trạng thái hoặc hoạt động, hoặc khi bạn bật hiện diện tự động.

    Ví dụ chỉ có trạng thái:

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

    Hiện diện tự động ánh xạ khả dụng runtime sang trạng thái Discord: khỏe mạnh => online, suy giảm hoặc không xác định => idle, cạn kiệt hoặc không khả dụng => dnd. Các ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Phê duyệt trong Discord">
    Discord hỗ trợ xử lý phê duyệt dựa trên nút trong DM và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh khởi nguồn.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt exec gốc khi `enabled` không được đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt, từ `execApprovals.approvers` hoặc từ `commands.ownerAllowFrom`. Discord không suy luận người phê duyệt exec từ `allowFrom` của kênh, `dm.allowFrom` cũ, hoặc `defaultTo` của tin nhắn trực tiếp. Đặt `enabled: false` để tắt Discord rõ ràng với vai trò client phê duyệt gốc.

    Với các lệnh nhóm nhạy cảm chỉ dành cho owner như `/diagnostics` và `/export-trajectory`, OpenClaw gửi lời nhắc phê duyệt và kết quả cuối cùng một cách riêng tư. Hệ thống thử DM Discord trước khi owner gọi lệnh có tuyến owner Discord; nếu không có, hệ thống quay về tuyến owner khả dụng đầu tiên từ `commands.ownerAllowFrom`, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ những người phê duyệt đã phân giải mới có thể dùng các nút; người dùng khác nhận một từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, nên chỉ bật gửi qua kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw quay về gửi qua DM.

    Discord cũng hiển thị các nút phê duyệt dùng chung được các kênh chat khác sử dụng. Adapter Discord gốc chủ yếu bổ sung định tuyến DM cho người phê duyệt và fanout kênh.
    Khi các nút đó xuất hiện, chúng là UX phê duyệt chính; OpenClaw
    chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết
    phê duyệt chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.
    Nếu runtime phê duyệt gốc của Discord không hoạt động, OpenClaw giữ
    lời nhắc `/approve <id> <decision>` xác định cục bộ ở trạng thái hiển thị. Nếu
    runtime đang hoạt động nhưng không thể gửi thẻ gốc đến bất kỳ mục tiêu nào,
    OpenClaw gửi một thông báo dự phòng trong cùng chat với lệnh `/approve`
    chính xác từ phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng client Gateway dùng chung (ID `plugin:` phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Theo mặc định, phê duyệt hết hạn sau 30 phút.

    Xem [Phê duyệt exec](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Công cụ và cổng hành động

Hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, điều phối, hiện diện và hành động metadata.

Ví dụ cốt lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- điều phối: `timeout`, `kick`, `ban`
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

## Giao diện Components v2

OpenClaw dùng Discord components v2 cho phê duyệt exec và marker xuyên ngữ cảnh. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho giao diện tùy chỉnh (nâng cao; yêu cầu tạo payload component qua công cụ Discord), trong khi `embeds` cũ vẫn có sẵn nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn được dùng bởi các container component của Discord (hex).
- Đặt theo từng tài khoản với `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` kiểm soát thời gian các callback component Discord đã gửi còn được đăng ký (mặc định `1800000`, tối đa `86400000`). Đặt theo từng tài khoản với `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` bị bỏ qua khi components v2 xuất hiện.
- Bản xem trước URL thuần được tắt theo mặc định. Đặt `suppressEmbeds: false` trên một hành động tin nhắn khi một liên kết gửi đi duy nhất cần được mở rộng.

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

Danh sách kiểm tra thiết lập:

1. Bật Message Content Intent trong Discord Developer Portal.
2. Bật Server Members Intent khi dùng allowlist vai trò/người dùng.
3. Mời bot với scope `bot` và `applications.commands`.
4. Cấp quyền Connect, Speak, Send Messages và Read Message History trong kênh thoại mục tiêu.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Dùng `/vc join|leave|status` để điều khiển phiên. Lệnh dùng agent mặc định của tài khoản và tuân theo cùng các quy tắc allowlist và chính sách nhóm như các lệnh Discord khác.

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

- `voice.tts` chỉ ghi đè `messages.tts` cho phát lại giọng nói `stt-tts`. Các chế độ thời gian thực dùng `voice.realtime.speakerVoice`.
- `voice.mode` điều khiển đường dẫn hội thoại. Mặc định là `agent-proxy`: một giao diện giọng nói thời gian thực xử lý thời điểm theo lượt, ngắt lời và phát lại, ủy quyền công việc nội dung cho agent OpenClaw được định tuyến qua `openclaw_agent_consult`, rồi xử lý kết quả như một lời nhắc Discord dạng văn bản từ người nói đó. `stt-tts` giữ luồng STT theo lô cũ cộng với TTS. `bidi` cho phép mô hình thời gian thực trò chuyện trực tiếp trong khi vẫn cung cấp `openclaw_agent_consult` cho bộ não OpenClaw.
- `voice.agentSession` điều khiển hội thoại OpenClaw nào nhận các lượt giọng nói. Để trống để dùng phiên riêng của kênh thoại, hoặc đặt `{ mode: "target", target: "channel:<text-channel-id>" }` để kênh thoại hoạt động như phần mở rộng micro/loa của một phiên kênh văn bản Discord hiện có, chẳng hạn `#maintainers`.
- `voice.model` ghi đè bộ não agent OpenClaw cho phản hồi giọng nói Discord và các lượt consult thời gian thực. Để trống để kế thừa mô hình agent được định tuyến. Trường này tách biệt với `voice.realtime.model`.
- `voice.followUsers` cho phép bot tham gia, di chuyển và rời khỏi giọng nói Discord cùng những người dùng được chọn. Xem [Theo dõi người dùng trong giọng nói](#follow-users-in-voice) để biết quy tắc hành vi và ví dụ.
- `agent-proxy` định tuyến lời nói qua `discord-voice`, giữ nguyên ủy quyền owner/tool bình thường cho người nói và phiên đích nhưng ẩn tool `tts` của agent vì giọng nói Discord sở hữu việc phát lại. Theo mặc định, `agent-proxy` cấp cho lượt consult quyền truy cập tool đầy đủ tương đương owner đối với người nói là owner (`voice.realtime.toolPolicy: "owner"`) và ưu tiên mạnh việc consult agent OpenClaw trước khi trả lời nội dung (`voice.realtime.consultPolicy: "always"`). Trong chế độ mặc định `always` đó, lớp thời gian thực không tự nói câu đệm trước câu trả lời consult; nó thu và phiên âm lời nói, rồi nói câu trả lời OpenClaw được định tuyến. Nếu nhiều câu trả lời consult bắt buộc hoàn tất trong khi Discord vẫn đang phát câu trả lời đầu tiên, các câu trả lời lời nói chính xác về sau sẽ được xếp hàng cho đến khi phát lại rảnh thay vì thay thế lời nói giữa câu.
- Ở chế độ `stt-tts`, STT dùng `tools.media.audio`; `voice.model` không ảnh hưởng đến phiên âm.
- Trong các chế độ thời gian thực, `voice.realtime.provider`, `voice.realtime.model` và `voice.realtime.speakerVoice` cấu hình phiên âm thanh thời gian thực. Với OpenAI Realtime 2 cộng với bộ não Codex, dùng `voice.realtime.model: "gpt-realtime-2"` và `voice.model: "openai/gpt-5.5"`.
- Các chế độ giọng nói thời gian thực mặc định đưa các tệp hồ sơ nhỏ `IDENTITY.md`, `USER.md` và `SOUL.md` vào chỉ dẫn của provider thời gian thực để các lượt trực tiếp nhanh giữ cùng danh tính, nền tảng người dùng và persona như agent OpenClaw được định tuyến. Đặt `voice.realtime.bootstrapContextFiles` thành một tập con để tùy chỉnh, hoặc `[]` để tắt. Các tệp bootstrap thời gian thực được hỗ trợ chỉ giới hạn ở các tệp hồ sơ đó; `AGENTS.md` vẫn nằm trong ngữ cảnh agent bình thường. Ngữ cảnh hồ sơ được chèn không thay thế `openclaw_agent_consult` cho công việc trong workspace, dữ kiện hiện tại, tra cứu bộ nhớ hoặc hành động có tool hỗ trợ.
- Trong chế độ thời gian thực OpenAI `agent-proxy`, đặt `voice.realtime.requireWakeName: true` để giữ giọng nói thời gian thực Discord im lặng cho đến khi bản phiên âm bắt đầu hoặc kết thúc bằng tên đánh thức. Tên đánh thức đã cấu hình phải gồm một hoặc hai từ. Nếu `voice.realtime.wakeNames` không được đặt, OpenClaw dùng `name` của agent được định tuyến cộng với `OpenClaw`, rồi dự phòng sang id agent cộng với `OpenClaw`. Cổng tên đánh thức tắt tự phản hồi của provider thời gian thực, định tuyến các lượt được chấp nhận qua đường dẫn consult agent OpenClaw, và đưa ra một xác nhận bằng giọng nói ngắn khi nhận ra tên đánh thức ở đầu từ phiên âm một phần trước khi bản phiên âm cuối cùng đến.
- Provider thời gian thực OpenAI chấp nhận tên sự kiện Realtime 2 hiện tại và các bí danh cũ tương thích với Codex cho sự kiện âm thanh đầu ra và phiên âm, nên các snapshot provider tương thích có thể trôi lệch mà không làm mất âm thanh assistant.
- `voice.realtime.bargeIn` điều khiển việc các sự kiện bắt đầu nói của người nói Discord có ngắt phát lại thời gian thực đang hoạt động hay không. Nếu không đặt, trường này theo thiết lập ngắt âm thanh đầu vào của provider thời gian thực.
- `voice.realtime.minBargeInAudioEndMs` điều khiển thời lượng phát lại assistant tối thiểu trước khi barge-in thời gian thực OpenAI cắt ngắn âm thanh. Mặc định: `250`. Đặt `0` để ngắt ngay trong phòng ít tiếng vọng, hoặc tăng lên cho các thiết lập loa nhiều tiếng vọng.
- Với giọng OpenAI trên phát lại Discord, đặt `voice.tts.provider: "openai"` và chọn một giọng Text-to-speech dưới `voice.tts.providers.openai.speakerVoice`. `cedar` là một lựa chọn nghe nam tính tốt trên mô hình TTS OpenAI hiện tại.
- Các ghi đè `systemPrompt` Discord theo kênh áp dụng cho các lượt phiên âm giọng nói của kênh thoại đó.
- Các lượt phiên âm giọng nói suy ra trạng thái owner từ Discord `allowFrom` (hoặc `dm.allowFrom`) cho các lệnh và hành động kênh bị chặn theo owner. Khả năng hiển thị tool của agent theo chính sách tool đã cấu hình cho phiên được định tuyến.
- Giọng nói Discord là tùy chọn bật cho cấu hình chỉ văn bản; đặt `channels.discord.voice.enabled=true` (hoặc giữ một khối `channels.discord.voice` hiện có) để bật lệnh `/vc`, runtime giọng nói và Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` có thể ghi đè tường minh đăng ký intent trạng thái giọng nói. Để trống để intent theo trạng thái bật giọng nói hiệu lực.
- Nếu `voice.autoJoin` có nhiều mục cho cùng guild, OpenClaw tham gia kênh được cấu hình cuối cùng cho guild đó.
- `voice.allowedChannels` là một allowlist cư trú tùy chọn. Để trống để cho phép `/vc join` vào bất kỳ kênh thoại Discord được ủy quyền nào. Khi đặt, `/vc join`, tự động tham gia khi khởi động và các lượt di chuyển trạng thái giọng nói của bot bị giới hạn trong các mục `{ guildId, channelId }` được liệt kê. Đặt thành mảng rỗng để từ chối mọi lượt tham gia giọng nói Discord. Nếu Discord di chuyển bot ra ngoài allowlist, OpenClaw rời kênh đó và tham gia lại mục tiêu tự động tham gia đã cấu hình khi có sẵn.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được truyền thẳng tới tùy chọn tham gia `@discordjs/voice`.
- Mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu không đặt.
- OpenClaw dùng codec `libopus-wasm` được đóng gói sẵn để nhận giọng nói Discord và phát lại PCM thô thời gian thực. Nó đi kèm một bản dựng libopus WebAssembly được ghim và không yêu cầu addon opus native.
- `voice.connectTimeoutMs` điều khiển thời gian chờ Ready ban đầu của `@discordjs/voice` cho các nỗ lực `/vc join` và tự động tham gia. Mặc định: `30000`.
- `voice.reconnectGraceMs` điều khiển thời gian OpenClaw chờ một phiên giọng nói đã ngắt kết nối bắt đầu kết nối lại trước khi hủy phiên đó. Mặc định: `15000`.
- Ở chế độ `stt-tts`, phát lại giọng nói không dừng chỉ vì người dùng khác bắt đầu nói. Để tránh vòng lặp phản hồi, OpenClaw bỏ qua thu giọng nói mới trong khi TTS đang phát; hãy nói sau khi phát lại kết thúc cho lượt tiếp theo. Các chế độ thời gian thực chuyển tiếp việc người nói bắt đầu nói như tín hiệu barge-in tới provider thời gian thực.
- Trong các chế độ thời gian thực, tiếng vọng từ loa vào micro đang mở có thể giống barge-in và ngắt phát lại. Với phòng Discord nhiều tiếng vọng, đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` để ngăn OpenAI tự ngắt khi có âm thanh đầu vào. Thêm `voice.realtime.bargeIn: true` nếu bạn vẫn muốn các sự kiện bắt đầu nói của người nói Discord ngắt phát lại đang hoạt động. Cầu nối thời gian thực OpenAI bỏ qua các lượt cắt ngắn phát lại ngắn hơn `voice.realtime.minBargeInAudioEndMs` vì có khả năng là tiếng vọng/nhiễu và ghi log là đã bỏ qua thay vì xóa phát lại Discord.
- `voice.captureSilenceGraceMs` điều khiển thời gian OpenClaw chờ sau khi Discord báo người nói đã dừng trước khi hoàn tất đoạn âm thanh đó cho STT. Mặc định: `2000`; tăng giá trị này nếu Discord tách các khoảng dừng bình thường thành bản phiên âm từng phần bị vụn.
- Khi ElevenLabs là provider TTS được chọn, phát lại giọng nói Discord dùng TTS streaming và bắt đầu từ luồng phản hồi của provider. Các provider không hỗ trợ streaming dự phòng về đường dẫn tệp tạm đã tổng hợp.
- OpenClaw cũng theo dõi lỗi giải mã nhận và tự khôi phục bằng cách rời/tham gia lại kênh thoại sau nhiều lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu log nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và log. Dòng `@discordjs/voice` được đóng gói bao gồm bản sửa padding upstream từ discord.js PR #11449, vốn đã đóng discord.js issue #11419.
- Các sự kiện nhận `The operation was aborted` là điều được kỳ vọng khi OpenClaw hoàn tất một đoạn người nói đã thu; chúng là chẩn đoán chi tiết, không phải cảnh báo.
- Log giọng nói Discord chi tiết bao gồm bản xem trước phiên âm STT một dòng có giới hạn cho mỗi đoạn người nói được chấp nhận, nên việc gỡ lỗi hiển thị cả phía người dùng và phía phản hồi agent mà không đổ văn bản phiên âm không giới hạn.
- Trong chế độ `agent-proxy`, dự phòng consult bắt buộc bỏ qua các mảnh phiên âm có khả năng chưa hoàn chỉnh, chẳng hạn văn bản kết thúc bằng `...` hoặc một từ nối ở cuối như `and`, cộng với các câu kết rõ ràng không cần hành động như “be right back” hoặc “bye”. Log hiển thị `forced agent consult skipped reason=...` khi việc này ngăn một câu trả lời đã xếp hàng bị cũ.

### Theo dõi người dùng trong giọng nói

Dùng `voice.followUsers` khi bạn muốn bot giọng nói Discord ở cùng một hoặc nhiều người dùng Discord đã biết thay vì tham gia một kênh cố định khi khởi động hoặc chờ `/vc join`.

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

- `followUsers` chấp nhận ID người dùng Discord thô và các giá trị `discord:<id>`. OpenClaw chuẩn hóa cả hai dạng trước khi khớp sự kiện trạng thái giọng nói.
- `followUsersEnabled` mặc định là `true` khi `followUsers` được cấu hình. Đặt thành `false` để giữ danh sách đã lưu nhưng dừng tự động theo dõi giọng nói.
- Khi một người dùng được theo dõi tham gia kênh thoại được phép, OpenClaw tham gia kênh đó. Khi người dùng di chuyển, OpenClaw di chuyển cùng họ. Khi người dùng được theo dõi đang hoạt động ngắt kết nối, OpenClaw rời đi.
- Nếu nhiều người dùng được theo dõi ở trong cùng guild và người dùng được theo dõi đang hoạt động rời đi, OpenClaw di chuyển đến kênh của một người dùng được theo dõi khác đang được theo dõi trước khi rời guild. Nếu nhiều người dùng được theo dõi di chuyển cùng lúc, sự kiện trạng thái giọng nói được quan sát mới nhất sẽ thắng.
- `allowedChannels` vẫn áp dụng. Người dùng được theo dõi trong kênh không được phép sẽ bị bỏ qua, và một phiên thuộc quyền sở hữu follow sẽ di chuyển đến người dùng được theo dõi khác hoặc rời đi.
- OpenClaw đối soát các sự kiện trạng thái giọng nói bị bỏ lỡ khi khởi động và theo một khoảng thời gian có giới hạn. Việc đối soát lấy mẫu các guild đã cấu hình và giới hạn lượt tra cứu REST mỗi lần chạy, nên danh sách `followUsers` rất lớn có thể cần hơn một khoảng thời gian để hội tụ.
- Nếu Discord hoặc quản trị viên di chuyển bot trong khi nó đang theo dõi một người dùng, OpenClaw xây dựng lại phiên giọng nói và giữ quyền sở hữu follow khi đích đến được phép. Nếu bot bị di chuyển ra ngoài `allowedChannels`, OpenClaw rời đi và tham gia lại mục tiêu đã cấu hình khi có.
- Khôi phục nhận DAVE có thể rời và tham gia lại cùng kênh sau nhiều lỗi giải mã lặp lại. Các phiên thuộc quyền sở hữu follow giữ quyền sở hữu follow của chúng qua đường dẫn khôi phục đó, nên một lần ngắt kết nối của người dùng được theo dõi sau này vẫn rời khỏi kênh.

Chọn giữa các chế độ tham gia:

- Dùng `followUsers` cho thiết lập cá nhân hoặc vận hành nơi bot nên tự động có mặt trong giọng nói khi bạn có mặt.
- Dùng `autoJoin` cho bot phòng cố định cần có mặt ngay cả khi không có người dùng được theo dõi nào trong giọng nói.
- Dùng `/vc join` cho các lượt tham gia một lần hoặc các phòng nơi sự hiện diện giọng nói tự động sẽ gây bất ngờ.

Codec giọng nói Discord:

- Nhật ký nhận thoại hiển thị `discord voice: opus decoder: libopus-wasm`.
- Phát lại thời gian thực mã hóa PCM stereo thô 48 kHz sang Opus bằng cùng gói `libopus-wasm` được đóng gói sẵn trước khi chuyển gói tin cho `@discordjs/voice`.
- Phát lại tệp và luồng từ provider chuyển mã sang PCM stereo thô 48 kHz bằng ffmpeg, rồi dùng `libopus-wasm` cho luồng gói Opus gửi tới Discord.

Quy trình STT cộng TTS:

- Bản ghi PCM của Discord được chuyển đổi thành tệp tạm WAV.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản chép lời được gửi qua luồng vào và định tuyến của Discord trong khi LLM phản hồi chạy với chính sách đầu ra thoại ẩn công cụ `tts` của agent và yêu cầu trả về văn bản, vì thoại Discord sở hữu phần phát lại TTS cuối cùng.
- `voice.model`, khi được đặt, chỉ ghi đè LLM phản hồi cho lượt kênh thoại này.
- `voice.tts` được hợp nhất đè lên `messages.tts`; các provider hỗ trợ streaming cấp dữ liệu trực tiếp cho trình phát, nếu không thì tệp âm thanh kết quả sẽ được phát trong kênh đã tham gia.

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

Khi không có khối `voice.agentSession`, mỗi kênh thoại sẽ có phiên OpenClaw được định tuyến riêng. Ví dụ, `/vc join channel:234567890123456789` nói chuyện với phiên dành cho kênh thoại Discord đó. Mô hình thời gian thực chỉ là giao diện thoại phía trước; các yêu cầu thực chất được chuyển cho agent OpenClaw đã cấu hình. Nếu mô hình thời gian thực tạo bản chép lời cuối cùng mà không gọi công cụ consult, OpenClaw buộc consult làm phương án dự phòng để mặc định vẫn hoạt động như đang nói chuyện với agent.

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

Thoại như phần mở rộng của một phiên kênh Discord hiện có:

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

Ở chế độ `agent-proxy`, bot tham gia kênh thoại đã cấu hình, nhưng các lượt agent OpenClaw dùng phiên và agent được định tuyến bình thường của kênh đích. Phiên thoại thời gian thực nói kết quả được trả về lại vào kênh thoại. Agent giám sát vẫn có thể dùng các công cụ tin nhắn bình thường theo chính sách công cụ của nó, bao gồm gửi một tin nhắn Discord riêng nếu đó là hành động phù hợp.

Trong khi một lượt chạy OpenClaw được ủy quyền đang hoạt động, các bản chép lời thoại Discord mới được xử lý như điều khiển lượt chạy trực tiếp trước khi bắt đầu một lượt agent khác. Các cụm từ như "status", "cancel that", "use the smaller fix", hoặc "when you're done also check tests" được phân loại là trạng thái, hủy, điều hướng, hoặc đầu vào theo dõi cho phiên đang hoạt động. Kết quả trạng thái, hủy, điều hướng được chấp nhận, và theo dõi được nói lại vào kênh thoại để người gọi biết OpenClaw đã xử lý yêu cầu hay chưa.

Các dạng đích hữu ích:

- `target: "channel:123456789012345678"` định tuyến qua phiên kênh văn bản Discord.
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

Dùng cấu hình này khi mô hình nghe thấy phần phát lại Discord của chính nó qua mic đang mở, nhưng bạn vẫn muốn ngắt nó bằng cách nói. OpenClaw ngăn OpenAI tự động ngắt trên âm thanh đầu vào thô, trong khi `bargeIn: true` cho phép các sự kiện bắt đầu nói của loa Discord và âm thanh người nói đã hoạt động hủy phản hồi thời gian thực đang hoạt động trước khi lượt ghi tiếp theo đến OpenAI. Các tín hiệu barge-in rất sớm với `audioEndMs` thấp hơn `minBargeInAudioEndMs` được xem là có khả năng là tiếng vọng/nhiễu và bị bỏ qua để mô hình không bị cắt ngay ở khung phát lại đầu tiên.

Nhật ký thoại mong đợi:

- Khi tham gia: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Khi bắt đầu thời gian thực: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Khi có âm thanh người nói: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, và `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Khi bỏ qua lời nói cũ: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` hoặc `reason=non-actionable-closing ...`
- Khi hoàn tất phản hồi thời gian thực: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Khi dừng/đặt lại phát lại: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Khi consult thời gian thực: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Khi agent trả lời: `discord voice: agent turn answer ...`
- Khi xếp hàng lời nói chính xác: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, tiếp theo là `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Khi phát hiện barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` hoặc `discord voice: realtime barge-in detected source=active-speaker-audio ...`, tiếp theo là `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Khi ngắt thời gian thực: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, tiếp theo là `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` hoặc `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Khi bỏ qua tiếng vọng/nhiễu: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Khi tắt barge-in: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Khi phát lại rảnh: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Để gỡ lỗi âm thanh bị cắt, hãy đọc nhật ký thoại thời gian thực như một dòng thời gian:

1. `realtime audio playback started` nghĩa là Discord đã bắt đầu phát âm thanh của assistant. Cầu nối bắt đầu đếm các khối đầu ra của assistant, byte PCM Discord, byte thời gian thực của provider, và thời lượng âm thanh tổng hợp từ thời điểm này.
2. `realtime speaker turn opened` đánh dấu một người nói Discord trở nên hoạt động. Nếu phát lại đã hoạt động và `bargeIn` được bật, điều này có thể được theo sau bởi `barge-in detected source=speaker-start`.
3. `realtime input audio started` đánh dấu khung âm thanh thực tế đầu tiên nhận được cho lượt người nói đó. `outputActive=true` hoặc `outputAudioMs` khác không ở đây nghĩa là mic đang gửi đầu vào trong khi phát lại của assistant vẫn đang hoạt động.
4. `barge-in detected source=active-speaker-audio` nghĩa là OpenClaw đã thấy âm thanh người nói trực tiếp trong khi phát lại của assistant đang hoạt động. Điều này hữu ích để phân biệt một lần ngắt thực sự với sự kiện bắt đầu nói của Discord không có âm thanh hữu ích.
5. `barge-in requested reason=...` nghĩa là OpenClaw đã yêu cầu provider thời gian thực hủy hoặc cắt ngắn phản hồi đang hoạt động. Nó bao gồm `outputAudioMs`, `outputActive`, và `playbackChunks` để bạn có thể thấy thực tế đã phát bao nhiêu âm thanh của assistant trước khi bị ngắt.
6. `realtime audio playback stopped reason=...` là điểm đặt lại phát lại Discord cục bộ. Lý do cho biết ai đã dừng phát lại: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, hoặc `session-close`.
7. `realtime speaker turn closed` tóm tắt lượt đầu vào đã ghi. `chunks=0` hoặc `hasAudio=false` nghĩa là lượt người nói đã mở nhưng không có âm thanh dùng được nào đến cầu nối thời gian thực. `interruptedPlayback=true` nghĩa là lượt đầu vào đó chồng lên đầu ra của assistant và kích hoạt logic barge-in.

Các trường hữu ích:

- `outputAudioMs`: thời lượng âm thanh assistant do provider thời gian thực tạo trước dòng nhật ký.
- `audioMs`: thời lượng âm thanh assistant mà OpenClaw đã đếm trước khi phát lại dừng.
- `elapsedMs`: thời gian thực trôi qua giữa lúc mở và đóng luồng phát lại hoặc lượt người nói.
- `discordBytes`: byte PCM stereo 48 kHz được gửi tới hoặc nhận từ thoại Discord.
- `realtimeBytes`: byte PCM theo định dạng provider được gửi tới hoặc nhận từ provider thời gian thực.
- `playbackChunks`: các khối âm thanh assistant được chuyển tiếp tới Discord cho phản hồi đang hoạt động.
- `sinceLastAudioMs`: khoảng cách giữa khung âm thanh người nói được ghi gần nhất và lúc lượt người nói đóng.

Các mẫu thường gặp:

- Bị cắt ngay với `source=active-speaker-audio`, `outputAudioMs` nhỏ, và cùng người dùng ở gần thường cho thấy tiếng vọng từ loa đi vào mic. Tăng `voice.realtime.minBargeInAudioEndMs`, giảm âm lượng loa, dùng tai nghe, hoặc đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` theo sau bởi `speaker turn closed ... hasAudio=false` nghĩa là Discord đã báo một lần bắt đầu nói nhưng không có âm thanh nào đến OpenClaw. Đó có thể là sự kiện thoại Discord thoáng qua, hành vi cổng nhiễu, hoặc client bật mic rất ngắn.
- `audio playback stopped reason=stream-close` mà không có barge-in gần đó hoặc `provider-clear-audio` nghĩa là luồng phát lại Discord cục bộ đã kết thúc ngoài dự kiến. Kiểm tra các nhật ký provider và trình phát Discord trước đó.
- `capture ignored during playback (barge-in disabled)` nghĩa là OpenClaw cố ý bỏ đầu vào trong khi âm thanh assistant đang hoạt động. Bật `voice.realtime.bargeIn` nếu bạn muốn lời nói ngắt phát lại.
- `barge-in ignored ... outputActive=false` nghĩa là VAD của Discord hoặc provider đã báo có lời nói, nhưng OpenClaw không có phát lại đang hoạt động để ngắt. Điều này không nên cắt âm thanh.

Thông tin xác thực được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, xác thực TTS cho `messages.tts`/`voice.tts`, và xác thực provider thời gian thực cho `voice.realtime.providers` hoặc cấu hình xác thực bình thường của provider.

### Tin nhắn thoại

Tin nhắn thoại Discord hiển thị bản xem trước dạng sóng và yêu cầu âm thanh OGG/Opus. OpenClaw tự động tạo dạng sóng, nhưng cần `ffmpeg` và `ffprobe` trên máy chủ Gateway để kiểm tra và chuyển đổi.

- Cung cấp **đường dẫn tệp cục bộ** (URL sẽ bị từ chối).
- Bỏ qua nội dung văn bản (Discord từ chối văn bản + tin nhắn thoại trong cùng payload).
- Chấp nhận mọi định dạng âm thanh; OpenClaw chuyển đổi sang OGG/Opus khi cần.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Đã dùng intent không được phép hoặc bot không thấy tin nhắn guild">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào việc phân giải người dùng/thành viên
    - khởi động lại gateway sau khi thay đổi intent

  </Accordion>

  <Accordion title="Tin nhắn guild bị chặn ngoài dự kiến">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép guild trong `channels.discord.guilds`
    - nếu có ánh xạ `channels` của guild, chỉ các kênh được liệt kê mới được cho phép
    - xác minh hành vi `requireMention` và mẫu mention

    Các kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention là false nhưng vẫn bị chặn">
    Nguyên nhân thường gặp:

    - `groupPolicy="allowlist"` mà không có danh sách cho phép guild/kênh khớp
    - `requireMention` được cấu hình sai vị trí (phải nằm dưới `channels.discord.guilds` hoặc mục kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của guild/kênh

  </Accordion>

  <Accordion title="Lượt Discord chạy lâu hoặc trả lời trùng lặp">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Các tùy chọn điều chỉnh hàng đợi Discord gateway:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - tùy chọn này chỉ kiểm soát công việc listener của Discord gateway, không kiểm soát thời lượng lượt agent

    Discord không áp dụng timeout do kênh sở hữu cho các lượt agent đã xếp hàng. Message listener bàn giao ngay lập tức, và các lần chạy Discord đã xếp hàng giữ nguyên thứ tự theo phiên cho đến khi vòng đời phiên/công cụ/runtime hoàn tất hoặc hủy bỏ công việc.

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

  <Accordion title="Cảnh báo timeout khi tra cứu metadata Gateway">
    OpenClaw lấy metadata Discord `/gateway/bot` trước khi kết nối. Lỗi tạm thời sẽ fallback về URL gateway mặc định của Discord và được giới hạn tần suất trong nhật ký.

    Các tùy chọn timeout metadata:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback khi chưa đặt cấu hình: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout khởi động lại">
    OpenClaw chờ sự kiện gateway `READY` của Discord trong khi khởi động và sau khi runtime kết nối lại. Thiết lập nhiều tài khoản với khởi động lệch thời điểm có thể cần cửa sổ READY khi khởi động dài hơn mặc định.

    Các tùy chọn READY timeout:

    - khởi động một tài khoản: `channels.discord.gatewayReadyTimeoutMs`
    - khởi động nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - env fallback khi khởi động nếu chưa đặt cấu hình: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - mặc định khi khởi động: `15000` (15 giây), tối đa: `120000`
    - runtime một tài khoản: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - env fallback runtime khi chưa đặt cấu hình: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - mặc định runtime: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Không khớp khi kiểm tra quyền">
    Kiểm tra quyền `channels status --probe` chỉ hoạt động với ID kênh dạng số.

    Nếu bạn dùng khóa slug, việc khớp runtime vẫn có thể hoạt động, nhưng probe không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="Sự cố DM và ghép cặp">

    - DM bị tắt: `channels.discord.dm.enabled=false`
    - chính sách DM bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép cặp trong chế độ `pairing`

  </Accordion>

  <Accordion title="Vòng lặp bot với bot">
    Theo mặc định, tin nhắn do bot tạo sẽ bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng quy tắc mention và danh sách cho phép nghiêm ngặt để tránh hành vi vòng lặp.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn bot có mention bot.

    OpenClaw cũng cung cấp [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung. Bất cứ khi nào `allowBots` cho phép tin nhắn do bot tạo đi tới dispatch, Discord ánh xạ sự kiện đầu vào thành các thông tin `(account, channel, bot pair)` và bộ bảo vệ cặp chung sẽ chặn cặp đó sau khi nó vượt quá ngân sách sự kiện đã cấu hình. Bộ bảo vệ ngăn các vòng lặp hai bot mất kiểm soát vốn trước đây phải bị dừng bởi giới hạn tần suất của Discord; nó không ảnh hưởng đến triển khai một bot hoặc các trả lời bot một lần vẫn nằm dưới ngân sách.

    Thiết lập mặc định (hoạt động khi đặt `allowBots`):

    - `maxEventsPerWindow: 20` -- cặp bot có thể trao đổi 20 tin nhắn trong cửa sổ trượt
    - `windowSeconds: 60` -- độ dài cửa sổ trượt
    - `cooldownSeconds: 60` -- sau khi ngân sách bị vượt, mọi tin nhắn bot-với-bot bổ sung theo cả hai chiều sẽ bị bỏ trong một phút

    Cấu hình mặc định dùng chung một lần dưới `channels.defaults.botLoopProtection`, rồi ghi đè Discord khi một workflow hợp lệ cần thêm dư địa. Thứ tự ưu tiên là:

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

  <Accordion title="Voice STT bị rớt với DecryptionFailed(...)">

    - giữ OpenClaw ở phiên bản hiện tại (`openclaw update`) để có logic khôi phục nhận thoại Discord
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu từ `channels.discord.voice.decryptionFailureTolerance=24` (mặc định upstream) và chỉ tinh chỉnh khi cần
    - theo dõi nhật ký cho:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi vẫn tiếp diễn sau khi tự động tham gia lại, thu thập nhật ký và so sánh với lịch sử nhận DAVE upstream trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) và [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Discord](/vi/gateway/config-channels#discord).

<Accordion title="Các trường Discord quan trọng">

- khởi động/xác thực: `enabled`, `token`, `accounts.*`, `allowBots`
- chính sách: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- lệnh: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- hàng đợi sự kiện: `eventQueue.listenerTimeout` (ngân sách listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- trả lời/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- gửi: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (bí danh cũ: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/thử lại: `mediaMaxMb` (giới hạn upload Discord đi, mặc định `100MB`), `retry`
- hành động: `actions.*`
- hiện diện: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là bí mật (ưu tiên `DISCORD_BOT_TOKEN` trong môi trường được giám sát).
- Cấp quyền Discord theo nguyên tắc ít đặc quyền nhất.
- Nếu triển khai/trạng thái lệnh đã cũ, hãy khởi động lại gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép cặp" icon="link" href="/vi/channels/pairing">
    Ghép cặp người dùng Discord với gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi trò chuyện nhóm và danh sách cho phép.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đầu vào tới agent.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Định tuyến nhiều agent" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ guild và kênh tới agent.
  </Card>
  <Card title="Slash command" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh native.
  </Card>
</CardGroup>
