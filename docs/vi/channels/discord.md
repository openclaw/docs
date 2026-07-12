---
read_when:
    - Phát triển các tính năng của kênh Discord
summary: Thiết lập bot Discord, khóa cấu hình, thành phần, giọng nói và khắc phục sự cố
title: Discord
x-i18n:
    generated_at: "2026-07-12T07:42:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw kết nối với Discord dưới dạng bot thông qua gateway chính thức của Discord. Hỗ trợ tin nhắn trực tiếp và các kênh máy chủ.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Tin nhắn trực tiếp trên Discord mặc định sử dụng chế độ ghép nối.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Quy trình chẩn đoán và sửa chữa liên kênh.
  </Card>
</CardGroup>

## Thiết lập nhanh

Tạo một ứng dụng Discord có bot, thêm bot vào máy chủ của bạn và ghép nối bot với OpenClaw. Nếu có thể, hãy sử dụng máy chủ riêng tư; nếu cần, hãy [tạo máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng Discord và bot">
    Trong [Discord Developer Portal](https://discord.com/developers/applications), nhấp vào **New Application** và đặt tên cho ứng dụng (ví dụ: "OpenClaw").

    Mở **Bot** trong thanh bên và đặt **Username** thành tên tác tử của bạn.

  </Step>

  <Step title="Bật các intent đặc quyền">
    Vẫn trên trang **Bot**, trong phần **Privileged Gateway Intents**, hãy bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (khuyến nghị; bắt buộc đối với danh sách cho phép theo vai trò, ánh xạ tên sang ID và các nhóm truy cập theo đối tượng của kênh)
    - **Presence Intent** (không bắt buộc; chỉ dành cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Sao chép mã thông báo bot">
    Trên trang **Bot**, nhấp vào **Reset Token** và sao chép mã thông báo.

    <Note>
    Dù tên gọi là vậy, thao tác này tạo mã thông báo đầu tiên của bạn — không có gì đang bị "đặt lại".
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
      - Add Reactions (không bắt buộc)

    Đây là cấu hình cơ sở cho các kênh văn bản thông thường. Nếu bot sẽ đăng trong luồng — bao gồm quy trình làm việc của kênh diễn đàn hoặc kênh phương tiện tạo hoặc tiếp tục một luồng — hãy bật thêm **Send Messages in Threads**.

    Sao chép URL được tạo, mở URL đó trong trình duyệt, chọn máy chủ của bạn rồi nhấp vào **Continue**. Bot giờ sẽ xuất hiện trong máy chủ của bạn.

  </Step>

  <Step title="Bật Chế độ nhà phát triển và thu thập các ID">
    Trong ứng dụng Discord, hãy bật Chế độ nhà phát triển để có thể sao chép các ID:

    1. **User Settings** (biểu tượng bánh răng) → **Developer** → bật **Developer Mode**
       *(trên thiết bị di động: **App Settings** → **Advanced**)*
    2. Nhấp chuột phải vào **biểu tượng máy chủ** → **Copy Server ID**
    3. Nhấp chuột phải vào **ảnh đại diện của bạn** → **Copy User ID**

    Giữ ID máy chủ và ID người dùng cùng với mã thông báo bot; bạn sẽ cần cả ba ở bước tiếp theo.

  </Step>

  <Step title="Cho phép tin nhắn trực tiếp từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord phải cho phép bot gửi tin nhắn trực tiếp cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** → **Privacy Settings** → bật **Direct Messages**.

    Hãy tiếp tục bật tùy chọn này nếu bạn sử dụng tin nhắn trực tiếp trên Discord với OpenClaw. Nếu chỉ sử dụng các kênh máy chủ, bạn có thể tắt tùy chọn này sau khi ghép nối.

  </Step>

  <Step title="Đặt mã thông báo bot một cách an toàn (không gửi mã này trong cuộc trò chuyện)">
    Mã thông báo bot là một bí mật. Hãy đặt mã này trên máy chạy OpenClaw trước khi nhắn tin cho tác tử:

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
    Đối với các bản cài đặt dịch vụ được quản lý, hãy chạy `openclaw gateway install` từ một shell đã đặt `DISCORD_BOT_TOKEN`, hoặc lưu biến trong `~/.openclaw/.env` để dịch vụ có thể phân giải SecretRef môi trường sau khi khởi động lại.
    Nếu máy chủ của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/máy khách từ Developer Portal để có thể bỏ qua lệnh gọi REST đó khi khởi động: `channels.discord.applicationId` cho tài khoản mặc định hoặc `channels.discord.accounts.<accountId>.applicationId` cho từng bot.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Yêu cầu tác tử">
        Trò chuyện với tác tử OpenClaw trên một kênh hiện có (ví dụ: Telegram) và yêu cầu tác tử thực hiện việc này. Nếu Discord là kênh đầu tiên của bạn, hãy sử dụng thẻ CLI / cấu hình thay thế.

        > "Tôi đã đặt mã thông báo bot Discord trong cấu hình. Vui lòng hoàn tất thiết lập Discord với ID người dùng `<user_id>` và ID máy chủ `<server_id>`."
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

        Phương án dự phòng bằng biến môi trường cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Đối với thiết lập bằng tập lệnh hoặc từ xa, hãy ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run`, sau đó chạy lại mà không có `--dry-run`. Chuỗi `token` dạng văn bản thuần cũng hoạt động và các giá trị SecretRef được hỗ trợ cho `channels.discord.token` trên các trình cung cấp môi trường/tệp/thực thi. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Đối với nhiều bot Discord, hãy lưu mã thông báo bot và ID ứng dụng của từng bot trong tài khoản tương ứng. `channels.discord.applicationId` ở cấp cao nhất được các tài khoản kế thừa, vì vậy chỉ đặt giá trị tại đó khi mọi tài khoản đều sử dụng cùng một ID ứng dụng.

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

  <Step title="Phê duyệt lần ghép nối qua tin nhắn trực tiếp đầu tiên">
    Sau khi gateway chạy, hãy gửi tin nhắn trực tiếp cho bot trong Discord. Bot sẽ phản hồi bằng mã ghép nối.

    <Tabs>
      <Tab title="Yêu cầu tác tử">
        Gửi mã ghép nối cho tác tử trên kênh hiện có:

        > "Phê duyệt mã ghép nối Discord này: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Mã ghép nối hết hạn sau 1 giờ. Sau khi phê duyệt, hãy trò chuyện với tác tử qua tin nhắn trực tiếp trên Discord.

  </Step>
</Steps>

<Note>
Việc phân giải mã thông báo có nhận biết tài khoản. Giá trị mã thông báo trong cấu hình được ưu tiên hơn phương án dự phòng bằng biến môi trường, và `DISCORD_BOT_TOKEN` chỉ được sử dụng cho tài khoản mặc định.
Nếu hai tài khoản Discord đang bật được phân giải thành cùng một mã thông báo bot, OpenClaw chỉ khởi động một trình giám sát gateway cho mã thông báo đó: mã thông báo từ cấu hình được ưu tiên hơn phương án dự phòng bằng biến môi trường; nếu không, tài khoản được bật đầu tiên sẽ được ưu tiên và tài khoản trùng lặp được báo cáo là đã tắt với lý do `duplicate bot token`.
Đối với các lệnh gọi đi nâng cao (công cụ tin nhắn/hành động kênh), `token` được chỉ định rõ cho từng lệnh gọi sẽ được sử dụng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và kiểu đọc/thăm dò (đọc/tìm kiếm/tìm nạp/luồng/ghim/quyền). Chính sách tài khoản/cài đặt thử lại vẫn đến từ tài khoản đã chọn trong ảnh chụp nhanh môi trường thời gian chạy đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập không gian làm việc trên máy chủ

Sau khi tin nhắn trực tiếp hoạt động, bạn có thể biến máy chủ thành một không gian làm việc đầy đủ, trong đó mỗi kênh có phiên tác tử và ngữ cảnh riêng. Khuyến nghị cho máy chủ riêng tư chỉ có bạn và bot.

<Steps>
  <Step title="Thêm máy chủ vào danh sách cho phép máy chủ">
    Điều này cho phép tác tử phản hồi trong bất kỳ kênh nào trên máy chủ, không chỉ trong tin nhắn trực tiếp.

    <Tabs>
      <Tab title="Yêu cầu tác tử">
        > "Thêm ID máy chủ Discord `<server_id>` của tôi vào danh sách cho phép máy chủ"
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
    Theo mặc định, tác tử chỉ phản hồi trong các kênh máy chủ khi được @đề cập. Trên máy chủ riêng tư, có thể bạn muốn tác tử phản hồi mọi tin nhắn.

    Trong các kênh máy chủ, theo mặc định, các phản hồi thông thường được đăng tự động. Đối với các phòng dùng chung luôn hoạt động, hãy chọn sử dụng `messages.groupChat.visibleReplies: "message_tool"` để tác tử có thể âm thầm theo dõi và chỉ đăng khi xác định rằng phản hồi trong kênh là hữu ích. Cách này hoạt động tốt nhất với các mô hình thế hệ mới nhất có độ tin cậy cao khi dùng công cụ, chẳng hạn như GPT-5.6 Sol. Các sự kiện phòng xung quanh sẽ không tạo phản hồi trừ khi công cụ gửi. Xem [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events) để biết cấu hình đầy đủ cho chế độ âm thầm theo dõi.

    Nếu Discord hiển thị trạng thái đang nhập và nhật ký cho thấy có sử dụng mã thông báo nhưng không có tin nhắn nào được đăng, hãy kiểm tra xem lượt đó có được cấu hình là sự kiện phòng xung quanh hoặc được thiết lập dùng công cụ tin nhắn cho các phản hồi hiển thị hay không.

    <Tabs>
      <Tab title="Yêu cầu tác tử">
        > "Cho phép tác tử của tôi phản hồi trên máy chủ này mà không cần được @đề cập"
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

        Để bắt buộc gửi bằng công cụ tin nhắn đối với các phản hồi nhóm/kênh hiển thị, hãy đặt `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Lập kế hoạch sử dụng bộ nhớ trong các kênh máy chủ">
    Bộ nhớ dài hạn (MEMORY.md) chỉ tự động tải trong các phiên tin nhắn trực tiếp; các kênh máy chủ không tải bộ nhớ này.

    <Tabs>
      <Tab title="Yêu cầu tác tử">
        > "Khi tôi đặt câu hỏi trong các kênh Discord, hãy sử dụng memory_search hoặc memory_get nếu cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Để chia sẻ ngữ cảnh trong mọi kênh, hãy đặt các chỉ dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (được chèn vào mọi phiên). Lưu các ghi chú dài hạn trong `MEMORY.md` và truy cập khi cần bằng các công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo các kênh và bắt đầu trò chuyện. Tác tử nhìn thấy tên kênh và mỗi kênh là một phiên biệt lập — hãy thiết lập `#coding`, `#home`, `#research` hoặc bất kỳ tên nào phù hợp với quy trình làm việc của bạn.

## Mô hình thời gian chạy

- Gateway quản lý kết nối Discord.
- Việc định tuyến phản hồi mang tính xác định: phản hồi cho dữ liệu đến từ Discord sẽ được gửi lại Discord.
- Siêu dữ liệu máy chủ/kênh Discord được thêm vào lời nhắc mô hình dưới dạng ngữ cảnh không đáng tin cậy, không phải dưới dạng tiền tố phản hồi hiển thị cho người dùng. Nếu mô hình sao chép lại lớp bao này, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi các phản hồi gửi đi và khỏi ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), các cuộc trò chuyện trực tiếp dùng chung phiên chính của tác tử (`agent:main:main`).
- Các kênh máy chủ có khóa phiên biệt lập (`agent:<agentId>:discord:channel:<channelId>`).
- Tin nhắn trực tiếp nhóm mặc định bị bỏ qua (`channels.discord.dm.groupEnabled=false`).
- Các lệnh gạch chéo gốc chạy trong các phiên lệnh biệt lập (`agent:<agentId>:discord:slash:<userId>`), đồng thời vẫn mang `CommandTargetSessionKey` đến phiên hội thoại được định tuyến.
- Việc gửi thông báo Cron/Heartbeat chỉ có văn bản đến Discord được thu gọn thành câu trả lời cuối cùng hiển thị từ trợ lý và chỉ gửi một lần. Nội dung phương tiện và tải thành phần có cấu trúc vẫn được gửi thành nhiều tin nhắn khi tác tử tạo ra nhiều tải có thể gửi.

## Kênh diễn đàn

Các kênh diễn đàn và phương tiện của Discord chỉ chấp nhận bài đăng theo luồng. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn đến kênh cha của diễn đàn (`channel:<forumId>`) để tự động tạo một luồng. Tiêu đề luồng là dòng không trống đầu tiên của tin nhắn (được cắt ngắn theo giới hạn 100 ký tự của Discord đối với tên luồng).
- Dùng `openclaw message thread create` để tạo trực tiếp một luồng. Không truyền `--message-id` cho các kênh diễn đàn.

Gửi đến kênh cha của diễn đàn để tạo một luồng:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Tạo một luồng diễn đàn một cách tường minh:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Kênh cha của diễn đàn không chấp nhận các thành phần Discord. Nếu cần các thành phần, hãy gửi đến chính luồng đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ các vùng chứa thành phần v2 của Discord cho tin nhắn của tác tử. Dùng công cụ tin nhắn với tải trọng `components`. Kết quả tương tác được định tuyến trở lại tác tử như tin nhắn đến thông thường và tuân theo các cài đặt `replyToMode` hiện có của Discord.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Các loại lựa chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, các thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép dùng nút, lựa chọn và biểu mẫu nhiều lần cho đến khi hết hạn.

Để giới hạn người có thể nhấp vào một nút, hãy đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ hoặc `*`). Người dùng không khớp sẽ nhận được thông báo từ chối chỉ hiển thị với họ.

Theo mặc định, lệnh gọi lại của thành phần hết hạn sau 30 phút. Đặt `channels.discord.agentComponents.ttlMs` để thay đổi thời gian tồn tại của sổ đăng ký lệnh gọi lại cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.agentComponents.ttlMs` cho từng tài khoản. Giá trị tính bằng mili giây, phải là số nguyên dương và bị giới hạn tối đa ở `86400000` (24 giờ). TTL dài hơn phù hợp với quy trình xem xét/phê duyệt cần duy trì khả năng sử dụng của các nút, nhưng cũng kéo dài khoảng thời gian mà một tin nhắn Discord cũ vẫn có thể kích hoạt hành động. Hãy ưu tiên TTL ngắn nhất đáp ứng nhu cầu và giữ giá trị mặc định nếu các lệnh gọi lại cũ có thể gây bất ngờ.

Các lệnh gạch chéo `/model` và `/models` mở trình chọn mô hình tương tác với các danh sách thả xuống cho nhà cung cấp, mô hình và môi trường chạy tương thích, cùng một bước Submit. `/models add` đã lỗi thời và trả về thông báo lỗi thời thay vì đăng ký mô hình từ cuộc trò chuyện. Phản hồi của trình chọn chỉ hiển thị với người dùng gọi lệnh và chỉ người đó mới có thể sử dụng. Menu chọn của Discord bị giới hạn ở 25 tùy chọn, vì vậy hãy thêm các mục `provider/*` vào `agents.defaults.models` khi bạn muốn trình chọn chỉ hiển thị các mô hình được phát hiện động cho những nhà cung cấp đã chọn như `openai` hoặc `vllm`.

Tệp đính kèm:

- Các khối `file` phải trỏ đến một tham chiếu tệp đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); dùng `media-gallery` cho nhiều tệp
- Dùng `filename` để ghi đè tên tải lên khi tên đó cần khớp với tham chiếu tệp đính kèm

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
  <Tab title="Chính sách tin nhắn trực tiếp">
    `channels.discord.dmPolicy` kiểm soát quyền truy cập tin nhắn trực tiếp. `channels.discord.allowFrom` là danh sách cho phép chuẩn cho tin nhắn trực tiếp.

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một người gửi trong `allowFrom`)
    - `open` (yêu cầu `channels.discord.allowFrom` chứa `"*"`)
    - `disabled`

    Nếu chính sách tin nhắn trực tiếp không phải là mở, người dùng không xác định sẽ bị chặn (hoặc được nhắc ghép nối trong chế độ `pairing`).

    Thứ tự ưu tiên cho nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Đối với một tài khoản, `allowFrom` được ưu tiên hơn `dm.allowFrom` cũ.
    - Các tài khoản có tên kế thừa `channels.discord.allowFrom` khi cả `allowFrom` riêng và `dm.allowFrom` cũ đều chưa được đặt.
    - Các tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để bảo đảm khả năng tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể thực hiện mà không thay đổi quyền truy cập.

    Định dạng đích tin nhắn trực tiếp để chuyển phát:

    - `user:<id>`
    - lượt đề cập `<@id>`

    ID chỉ gồm chữ số thường được phân giải thành ID kênh khi có giá trị mặc định cho kênh, nhưng các ID được liệt kê trong `allowFrom` tin nhắn trực tiếp có hiệu lực của tài khoản được xử lý như đích tin nhắn trực tiếp của người dùng để bảo đảm khả năng tương thích.

  </Tab>

  <Tab title="Nhóm truy cập">
    Tin nhắn trực tiếp Discord và việc ủy quyền lệnh văn bản có thể dùng các mục `accessGroup:<name>` động trong `channels.discord.allowFrom`.

    Tên nhóm truy cập được dùng chung giữa các kênh nhắn tin. Dùng `type: "message.senders"` cho một nhóm tĩnh có các thành viên được biểu diễn theo cú pháp `allowFrom` thông thường của từng kênh, hoặc `type: "discord.channelAudience"` khi đối tượng hiện có quyền `ViewChannel` của một kênh Discord cần xác định thành viên một cách động. Hành vi dùng chung của nhóm truy cập: [Nhóm truy cập](/vi/channels/access-groups).

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

    Một kênh văn bản Discord không có danh sách thành viên riêng. `type: "discord.channelAudience"` mô hình hóa tư cách thành viên như sau: người gửi tin nhắn trực tiếp là thành viên của máy chủ được cấu hình và hiện có quyền `ViewChannel` hiệu lực trên kênh được cấu hình sau khi áp dụng vai trò và các ghi đè của kênh.

    Ví dụ: cho phép bất kỳ ai có thể xem `#maintainers` gửi tin nhắn trực tiếp cho bot, trong khi vẫn đóng tin nhắn trực tiếp với tất cả những người khác.

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

    Việc tra cứu sẽ từ chối theo mặc định khi gặp lỗi. Nếu Discord trả về `Missing Access`, việc tra cứu thành viên thất bại hoặc kênh thuộc một máy chủ khác, người gửi tin nhắn trực tiếp được xem là không được ủy quyền.

    Bật **Server Members Intent** trong Discord Developer Portal khi dùng nhóm truy cập theo đối tượng của kênh. Tin nhắn trực tiếp không bao gồm trạng thái thành viên máy chủ, vì vậy OpenClaw phân giải thành viên qua Discord REST tại thời điểm ủy quyền.

  </Tab>

  <Tab title="Chính sách máy chủ">
    Việc xử lý máy chủ được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Mức cơ sở an toàn khi `channels.discord` tồn tại là `allowlist`.

    Hành vi của `allowlist`:

    - máy chủ phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị dùng ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được cho phép khi khớp với `users` HOẶC `roles`
    - tính năng khớp trực tiếp theo tên/thẻ bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` như chế độ tương thích dùng trong tình huống khẩn cấp
    - `users` hỗ trợ tên/thẻ, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng mục tên/thẻ
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

    Nếu bạn chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, giá trị dự phòng khi chạy là `groupPolicy="allowlist"` (kèm cảnh báo trong nhật ký), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Lượt đề cập và tin nhắn trực tiếp nhóm">
    Theo mặc định, tin nhắn trong máy chủ phải đề cập đến bot.

    Việc phát hiện lượt đề cập bao gồm:

    - đề cập trực tiếp đến bot
    - các mẫu đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng là `messages.groupChat.mentionPatterns`)
    - hành vi ngầm định khi trả lời bot trong các trường hợp được hỗ trợ

    Khi viết tin nhắn Discord gửi đi, hãy dùng cú pháp đề cập chuẩn: `<@USER_ID>` cho người dùng, `<#CHANNEL_ID>` cho kênh và `<@&ROLE_ID>` cho vai trò. Không dùng dạng đề cập biệt danh cũ `<@!USER_ID>`.

    `requireMention` được cấu hình theo từng máy chủ/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn loại bỏ các tin nhắn đề cập đến người dùng/vai trò khác nhưng không đề cập đến bot (không tính @everyone/@here).

    Tin nhắn trực tiếp nhóm:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến tác tử dựa trên vai trò

Dùng `bindings[].match.roles` để định tuyến các thành viên máy chủ Discord đến các tác tử khác nhau theo ID vai trò. Các liên kết dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau các liên kết ngang hàng hoặc ngang hàng cha, nhưng trước các liên kết chỉ dành cho máy chủ. Nếu một liên kết còn đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả các trường đã cấu hình đều phải khớp.

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

## Lệnh gốc và ủy quyền lệnh

- `commands.native` mặc định là `"auto"` và được bật cho Discord.
- Ghi đè theo từng kênh: `channels.discord.commands.native`.
- `commands.native=false` bỏ qua việc đăng ký và dọn dẹp lệnh gạch chéo của Discord khi khởi động. Các lệnh đã đăng ký trước đó có thể vẫn hiển thị trong Discord cho đến khi bạn xóa chúng khỏi ứng dụng Discord.
- Việc xác thực lệnh gốc sử dụng cùng danh sách cho phép/chính sách Discord như khi xử lý tin nhắn thông thường.
- Các lệnh vẫn có thể hiển thị trong giao diện Discord đối với người dùng không được cấp quyền; khi thực thi, OpenClaw áp dụng xác thực và trả lời "không được cấp quyền".
- Cài đặt lệnh gạch chéo mặc định: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Xem [Lệnh gạch chéo](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Thẻ trả lời và phản hồi gốc">
    Discord hỗ trợ thẻ trả lời trong đầu ra của tác nhân:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được kiểm soát bởi `channels.discord.replyToMode`:

    - `off` (mặc định): không ngầm tạo luồng trả lời; các thẻ `[[reply_to_*]]` tường minh vẫn được tuân thủ
    - `first`: gắn tham chiếu trả lời gốc ngầm định vào tin nhắn Discord gửi đi đầu tiên của lượt
    - `all`: gắn tham chiếu đó vào mọi tin nhắn gửi đi
    - `batched`: chỉ gắn tham chiếu khi sự kiện đến là một lô nhiều tin nhắn đã được chống dội — hữu ích khi bạn chủ yếu muốn phản hồi gốc cho các cuộc trò chuyện dồn dập, khó phân định, thay vì mọi lượt chỉ có một tin nhắn

    ID tin nhắn được đưa vào ngữ cảnh/lịch sử để tác nhân có thể nhắm đến các tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Bản xem trước liên kết">
    Theo mặc định, Discord tạo nội dung nhúng liên kết phong phú cho các URL. Theo mặc định, OpenClaw chặn các nội dung nhúng được tạo này trên tin nhắn Discord gửi đi, vì vậy URL do tác nhân gửi vẫn là liên kết thuần túy, trừ khi bạn chủ động bật:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Đặt `channels.discord.accounts.<id>.suppressEmbeds` để ghi đè cho một tài khoản. Các lần gửi bằng công cụ tin nhắn của tác nhân cũng có thể truyền `suppressEmbeds: false` cho một tin nhắn duy nhất. Các tải trọng `embeds` tường minh của Discord không bị chặn bởi cài đặt bản xem trước liên kết mặc định.

  </Accordion>

  <Accordion title="Bản xem trước luồng trực tiếp">
    OpenClaw có thể truyền phát bản nháp phản hồi bằng cách gửi một tin nhắn tạm thời và chỉnh sửa khi văn bản được nhận. `channels.discord.streaming.mode` nhận `off` | `partial` | `block` | `progress` (mặc định khi không đặt khóa `streaming`/`streamMode` cũ). `streamMode` là bí danh cũ; chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu sang cấu trúc `streaming` lồng nhau chuẩn.

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

    - `off` tắt các chỉnh sửa bản xem trước trên Discord.
    - `partial` chỉnh sửa một tin nhắn xem trước duy nhất khi các token được nhận.
    - `block` phát ra các phần có kích thước bản nháp; điều chỉnh kích thước và điểm ngắt bằng `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), được giới hạn theo `textChunkLimit`. Khi truyền phát theo khối được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh truyền phát kép.
    - `progress` duy trì một bản nháp trạng thái có thể chỉnh sửa và cập nhật bản nháp đó với tiến trình công cụ cho đến khi gửi kết quả cuối cùng; nhãn khởi đầu dùng chung là một dòng cuộn, vì vậy nó sẽ cuộn khỏi màn hình như phần còn lại khi có đủ nội dung công việc xuất hiện.
    - Kết quả cuối có phương tiện, lỗi hoặc trả lời tường minh sẽ hủy các chỉnh sửa bản xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) kiểm soát việc các cập nhật công cụ/tiến trình có tái sử dụng tin nhắn xem trước hay không.
    - Các hàng công cụ/tiến trình được hiển thị dưới dạng biểu tượng cảm xúc + tiêu đề + chi tiết nhỏ gọn khi có, ví dụ `🛠️ Bash: run tests` hoặc `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (mặc định `false`) cho phép đưa văn bản bình luận/mở đầu của trợ lý vào bản nháp tiến trình tạm thời. Phần bình luận được làm sạch trước khi hiển thị, chỉ tồn tại tạm thời và không thay đổi cách gửi câu trả lời cuối cùng.
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

    Truyền phát bản xem trước chỉ hỗ trợ văn bản; phản hồi có phương tiện sẽ quay về cách gửi thông thường.

  </Accordion>

  <Accordion title="Lịch sử, ngữ cảnh và hành vi luồng">
    Ngữ cảnh lịch sử máy chủ:

    - `channels.discord.historyLimit` mặc định là `20`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` sẽ tắt

    Điều khiển lịch sử tin nhắn trực tiếp:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi luồng:

    - Các luồng Discord được định tuyến dưới dạng phiên kênh và kế thừa cấu hình kênh cha trừ khi bị ghi đè.
    - Phiên luồng kế thừa lựa chọn `/model` cấp phiên của kênh cha làm phương án dự phòng chỉ dành cho mô hình; lựa chọn `/model` cục bộ của luồng được ưu tiên và lịch sử bản ghi của kênh cha không được sao chép trừ khi bật kế thừa bản ghi.
    - `channels.discord.thread.inheritParent` (mặc định `false`) cho phép các luồng tự động mới được khởi tạo từ bản ghi của kênh cha. Ghi đè theo tài khoản: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng từ công cụ tin nhắn có thể phân giải đích tin nhắn trực tiếp `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong quá trình dự phòng kích hoạt ở giai đoạn trả lời.

    Chủ đề kênh được chèn dưới dạng ngữ cảnh **không đáng tin cậy**. Danh sách cho phép giới hạn người có thể kích hoạt tác nhân, chứ không phải là ranh giới biên tập ngữ cảnh bổ sung toàn diện.

  </Accordion>

  <Accordion title="Phiên gắn với luồng dành cho tác nhân phụ">
    Discord có thể gắn một luồng với đích phiên để các tin nhắn tiếp theo trong luồng đó tiếp tục được định tuyến đến cùng một phiên (bao gồm cả phiên tác nhân phụ).

    Lệnh:

    - `/focus <target>` gắn luồng hiện tại/mới với đích tác nhân phụ/phiên
    - `/unfocus` xóa liên kết của luồng hiện tại
    - `/agents` hiển thị các lượt chạy đang hoạt động và trạng thái liên kết
    - `/session idle <duration|off>` kiểm tra/cập nhật thời gian không hoạt động trước khi tự động bỏ tập trung đối với các liên kết đang được tập trung
    - `/session max-age <duration|off>` kiểm tra/cập nhật tuổi tối đa cứng đối với các liên kết đang được tập trung

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
    - `spawnSessions` kiểm soát việc tự động tạo/gắn luồng cho `sessions_spawn({ thread: true })` và các lần tạo luồng ACP. Mặc định: `true`.
    - `defaultSpawnContext` kiểm soát ngữ cảnh tác nhân phụ gốc cho các lần tạo gắn với luồng. Mặc định: `"fork"`.
    - Các khóa `spawnSubagentSessions`/`spawnAcpSessions` không còn được khuyến nghị sẽ được di chuyển bởi `openclaw doctor --fix`.
    - Nếu liên kết luồng bị tắt cho một tài khoản, `/focus` và các thao tác liên kết luồng liên quan sẽ không khả dụng.

    Xem [Tác nhân phụ](/vi/tools/subagents), [Tác nhân ACP](/vi/tools/acp-agents) và [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liên kết kênh ACP bền vững">
    Đối với không gian làm việc ACP "luôn bật" ổn định, hãy cấu hình các liên kết ACP có kiểu ở cấp cao nhất, nhắm đến các cuộc trò chuyện Discord.

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

    - `/acp spawn codex --bind here` gắn kênh hoặc luồng hiện tại tại chỗ và giữ các tin nhắn trong tương lai trên cùng một phiên ACP. Tin nhắn luồng kế thừa liên kết của kênh cha.
    - Trong kênh hoặc luồng đã gắn, `/new` và `/reset` đặt lại cùng một phiên ACP tại chỗ. Các liên kết luồng tạm thời có thể ghi đè việc phân giải đích trong khi hoạt động.
    - `spawnSessions` kiểm soát việc tạo/gắn luồng con thông qua `--thread auto|here`.

    Xem [Tác nhân ACP](/vi/tools/acp-agents) để biết chi tiết về hành vi liên kết.

  </Accordion>

  <Accordion title="Thông báo phản ứng">
    Chế độ thông báo phản ứng theo từng máy chủ (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (sử dụng `guilds.<id>.users`)

    Các sự kiện phản ứng được chuyển thành sự kiện hệ thống và gắn vào phiên Discord đã định tuyến.

  </Accordion>

  <Accordion title="Phản ứng xác nhận">
    `ackReaction` gửi một biểu tượng cảm xúc xác nhận trong khi OpenClaw xử lý tin nhắn đến.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - dự phòng bằng biểu tượng cảm xúc nhận dạng tác nhân (`agents.list[].identity.emoji`, nếu không thì "👀")

    Ghi chú:

    - Discord chấp nhận biểu tượng cảm xúc unicode hoặc tên biểu tượng cảm xúc tùy chỉnh.
    - Sử dụng `""` để tắt phản ứng cho một kênh hoặc tài khoản.

    **Phạm vi (`messages.ackReactionScope`):**

    Giá trị: `"all"` (tin nhắn trực tiếp + nhóm, bao gồm sự kiện phòng nền), `"direct"` (chỉ tin nhắn trực tiếp), `"group-all"` (mọi tin nhắn nhóm ngoại trừ sự kiện phòng nền, không có tin nhắn trực tiếp), `"group-mentions"` (nhóm khi bot được nhắc đến; **không có tin nhắn trực tiếp**, mặc định), `"off"` / `"none"` (đã tắt).

    <Note>
    Phạm vi mặc định (`"group-mentions"`) không kích hoạt phản ứng xác nhận trong tin nhắn trực tiếp hoặc sự kiện phòng nền. Để nhận phản ứng xác nhận đối với tin nhắn trực tiếp Discord đến và sự kiện phòng yên lặng, hãy đặt `messages.ackReactionScope` thành `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Ghi cấu hình">
    Theo mặc định, việc ghi cấu hình do kênh khởi tạo được bật. Điều này ảnh hưởng đến các luồng `/config set|unset` (khi tính năng lệnh được bật).

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
    Định tuyến lưu lượng WebSocket của Gateway Discord và các truy vấn REST khi khởi động (ID ứng dụng + phân giải danh sách cho phép) qua proxy HTTP(S) bằng `channels.discord.proxy`.
    Việc dùng proxy cho WebSocket của Gateway Discord phải được cấu hình tường minh; các kết nối WebSocket không kế thừa biến môi trường proxy xung quanh từ tiến trình Gateway. Các truy vấn REST khi khởi động sử dụng proxy này khi `channels.discord.proxy` được cấu hình.

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
    Bật phân giải PluralKit để ánh xạ tin nhắn được chuyển tiếp đến danh tính thành viên hệ thống:

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

    - danh sách cho phép có thể sử dụng `pk:<memberId>`
    - tên hiển thị của thành viên chỉ được đối chiếu theo tên/slug khi `channels.discord.dangerouslyAllowNameMatching: true`
    - các truy vấn tra cứu gọi API PluralKit bằng ID tin nhắn gốc
    - nếu tra cứu thất bại, tin nhắn được proxy sẽ bị coi là tin nhắn bot và bị loại bỏ, trừ khi `allowBots` cho phép chúng đi qua

  </Accordion>

  <Accordion title="Bí danh đề cập gửi đi">
    Sử dụng `mentionAliases` khi tác tử cần đề cập gửi đi mang tính xác định cho những người dùng Discord đã biết. Khóa là tên định danh không có ký tự `@` ở đầu; giá trị là ID người dùng Discord. Các tên định danh không xác định, `@everyone`, `@here` và các đề cập bên trong đoạn mã Markdown được giữ nguyên.

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
    Các cập nhật trạng thái hiện diện được áp dụng khi bạn đặt trường trạng thái hoặc hoạt động, hoặc khi bật trạng thái hiện diện tự động.

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

    Hoạt động (trạng thái tùy chỉnh là loại hoạt động mặc định khi đặt `activity`):

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

    Bảng ánh xạ loại hoạt động:

    - 0: Đang chơi
    - 1: Đang phát trực tiếp (yêu cầu `activityUrl`; đến lượt `activityUrl` yêu cầu `activityType: 1`)
    - 2: Đang nghe
    - 3: Đang xem
    - 4: Tùy chỉnh (sử dụng nội dung hoạt động làm trạng thái; biểu tượng cảm xúc là tùy chọn)
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
        exhaustedText: "token đã cạn",
      },
    },
  },
}
```

    Trạng thái hiện diện tự động ánh xạ mức độ sẵn sàng của thời gian chạy sang trạng thái Discord: bình thường => trực tuyến, suy giảm hoặc không xác định => không hoạt động, cạn kiệt hoặc không khả dụng => không làm phiền. Giá trị mặc định: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (phải nhỏ hơn hoặc bằng `intervalMs`). Các nội dung ghi đè tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ phần giữ chỗ `{reason}`)

  </Accordion>

  <Accordion title="Phê duyệt trong Discord">
    Discord hỗ trợ xử lý phê duyệt bằng nút trong tin nhắn trực tiếp và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh khởi nguồn.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; dùng `commands.ownerAllowFrom` làm phương án dự phòng khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt thực thi gốc khi `enabled` chưa được đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt từ `execApprovals.approvers` hoặc `commands.ownerAllowFrom`. Discord không suy ra người phê duyệt thực thi từ `allowFrom` của kênh, `dm.allowFrom` cũ hoặc `defaultTo` của tin nhắn trực tiếp. Đặt `enabled: false` để vô hiệu hóa rõ ràng Discord với vai trò ứng dụng phê duyệt gốc.

    Đối với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi riêng tư lời nhắc phê duyệt và kết quả cuối cùng. Trước tiên, hệ thống thử gửi tin nhắn trực tiếp Discord khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không, hệ thống dùng tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom` làm phương án dự phòng, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt sẽ hiển thị trong kênh. Chỉ những người phê duyệt đã được phân giải mới có thể sử dụng các nút; người dùng khác nhận được thông báo từ chối tạm thời chỉ họ thấy. Lời nhắc phê duyệt bao gồm nội dung lệnh, vì vậy chỉ bật gửi đến kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw dùng gửi tin nhắn trực tiếp làm phương án dự phòng.

    Discord hiển thị các nút phê duyệt dùng chung với những kênh trò chuyện khác; bộ điều hợp Discord gốc chủ yếu bổ sung định tuyến tin nhắn trực tiếp đến người phê duyệt và phân phối đến nhiều kênh. Khi có các nút này, chúng là trải nghiệm phê duyệt chính; OpenClaw chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là con đường duy nhất. Nếu môi trường thời gian chạy phê duyệt gốc của Discord không hoạt động, OpenClaw giữ hiển thị lời nhắc cục bộ mang tính xác định `/approve <id> <decision>`. Nếu môi trường thời gian chạy đang hoạt động nhưng không thể gửi thẻ gốc đến bất kỳ đích nào, OpenClaw gửi thông báo dự phòng trong cùng cuộc trò chuyện kèm lệnh `/approve` chính xác từ yêu cầu phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng ứng dụng Gateway dùng chung (các ID `plugin:` được phân giải thông qua `plugin.approval.resolve`; các ID khác thông qua `exec.approval.resolve`). Theo mặc định, phê duyệt hết hạn sau 30 phút.

    Xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Công cụ và cổng kiểm soát hành động

Các hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, kiểm duyệt, trạng thái hiện diện và siêu dữ liệu.

Ví dụ cốt lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- kiểm duyệt: `timeout`, `kick`, `ban`
- trạng thái hiện diện: `setPresence`

Hành động `event-create` chấp nhận tham số `image` tùy chọn (URL hoặc đường dẫn tệp cục bộ) để đặt ảnh bìa cho sự kiện đã lên lịch.

Các cổng kiểm soát hành động nằm dưới `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                            | Mặc định     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | đã bật       |
| roles                                                                                                                                                                    | đã tắt       |
| moderation                                                                                                                                                               | đã tắt       |
| presence                                                                                                                                                                 | đã tắt       |

## Giao diện người dùng components v2

OpenClaw sử dụng Discord components v2 cho phê duyệt thực thi và dấu mốc xuyên ngữ cảnh. Các hành động tin nhắn Discord cũng có thể chấp nhận `components` cho giao diện người dùng tùy chỉnh (nâng cao; yêu cầu tạo tải trọng thành phần thông qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn được các vùng chứa thành phần Discord sử dụng (hệ thập lục phân). Theo từng tài khoản: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` kiểm soát khoảng thời gian các lệnh gọi lại thành phần Discord đã gửi tiếp tục được đăng ký (mặc định `1800000`, tối đa `86400000`). Theo từng tài khoản: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` bị bỏ qua khi có components v2.
- Theo mặc định, bản xem trước URL thuần túy bị ẩn. Đặt `suppressEmbeds: false` trên một hành động tin nhắn khi cần mở rộng một liên kết gửi đi duy nhất.

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

Discord có hai bề mặt thoại riêng biệt: **kênh thoại** thời gian thực (các cuộc trò chuyện liên tục) và **tệp đính kèm tin nhắn thoại** (định dạng xem trước dạng sóng). Gateway hỗ trợ cả hai.

### Kênh thoại

Danh sách kiểm tra thiết lập:

1. Bật Message Content Intent trong Discord Developer Portal.
2. Bật Server Members Intent khi sử dụng danh sách cho phép theo vai trò/người dùng.
3. Mời bot với các phạm vi `bot` và `applications.commands`.
4. Cấp quyền Connect, Speak, Send Messages và Read Message History trong kênh thoại đích.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Sử dụng `/vc join|leave|status` để điều khiển phiên. Lệnh sử dụng tác tử mặc định của tài khoản và tuân theo cùng các quy tắc danh sách cho phép và chính sách nhóm như các lệnh Discord khác.

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

Lưu ý:

- Giọng nói Discord là tính năng tùy chọn đối với các cấu hình chỉ dùng văn bản; đặt `channels.discord.voice.enabled=true` (hoặc giữ lại khối `channels.discord.voice` hiện có) để bật các lệnh `/vc`, môi trường chạy giọng nói và gateway intent `GuildVoiceStates`. `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng việc đăng ký intent; để không đặt nhằm tuân theo trạng thái bật giọng nói có hiệu lực.
- `voice.mode` kiểm soát luồng hội thoại. Mặc định là `agent-proxy`: một giao diện giọng nói thời gian thực xử lý thời điểm chuyển lượt, ngắt lời và phát âm thanh, ủy quyền công việc thực chất cho tác nhân OpenClaw được định tuyến thông qua `openclaw_agent_consult`, đồng thời xử lý kết quả như một lời nhắc Discord được người nói đó nhập bằng văn bản. `stt-tts` giữ lại luồng STT theo lô cộng với TTS cũ hơn. `bidi` cho phép mô hình thời gian thực hội thoại trực tiếp, đồng thời cung cấp `openclaw_agent_consult` để sử dụng bộ não OpenClaw.
- `voice.agentSession` kiểm soát cuộc hội thoại OpenClaw nào nhận các lượt giọng nói. Để không đặt nếu muốn dùng phiên riêng của kênh thoại, hoặc đặt `{ mode: "target", target: "channel:<text-channel-id>" }` để kênh thoại hoạt động như phần mở rộng micrô/loa của một phiên kênh văn bản Discord hiện có, chẳng hạn như `#maintainers`.
- `voice.model` ghi đè bộ não tác nhân OpenClaw dùng cho phản hồi giọng nói Discord và các lượt tham vấn thời gian thực. Để không đặt nhằm kế thừa mô hình tác nhân được định tuyến. Thiết lập này tách biệt với `voice.realtime.model`.
- `voice.followUsers` cho phép bot tham gia, di chuyển và rời khỏi kênh thoại Discord cùng những người dùng được chọn. Xem [Theo dõi người dùng trong kênh thoại](#follow-users-in-voice).
- `agent-proxy` định tuyến lời nói qua `discord-voice`, cơ chế này duy trì việc ủy quyền công cụ/chủ sở hữu thông thường cho người nói và phiên đích nhưng ẩn công cụ `tts` của tác nhân vì giọng nói Discord chịu trách nhiệm phát âm thanh. Theo mặc định, `agent-proxy` cấp cho lượt tham vấn quyền truy cập công cụ đầy đủ tương đương chủ sở hữu đối với người nói là chủ sở hữu (`voice.realtime.toolPolicy: "owner"`) và đặc biệt ưu tiên tham vấn tác nhân OpenClaw trước khi đưa ra câu trả lời có nội dung thực chất (`voice.realtime.consultPolicy: "always"`). Trong chế độ `always` mặc định đó, lớp thời gian thực không tự động phát lời đệm trước câu trả lời tham vấn; nó thu và chuyển lời nói thành văn bản, sau đó phát câu trả lời OpenClaw đã được định tuyến. Nếu nhiều câu trả lời tham vấn bắt buộc hoàn tất trong khi Discord vẫn đang phát câu trả lời đầu tiên, các câu trả lời lời nói chính xác tiếp theo sẽ được xếp hàng cho đến khi quá trình phát rảnh, thay vì thay thế lời nói giữa câu.
- Trong chế độ `stt-tts`, STT sử dụng `tools.media.audio`; `voice.model` không ảnh hưởng đến việc chuyển lời nói thành văn bản.
- Trong các chế độ thời gian thực, `voice.realtime.provider`, `voice.realtime.model` và `voice.realtime.speakerVoice` cấu hình phiên âm thanh thời gian thực. Để sử dụng OpenAI Realtime 2.1 cùng bộ não Codex, hãy dùng `voice.realtime.model: "gpt-realtime-2.1"` và `voice.model: "openai/gpt-5.6-sol"`.
- Theo mặc định, các chế độ giọng nói thời gian thực đưa những tệp hồ sơ nhỏ `IDENTITY.md`, `USER.md` và `SOUL.md` vào chỉ dẫn của nhà cung cấp thời gian thực, để các lượt trực tiếp nhanh duy trì cùng danh tính, nền tảng thông tin người dùng và cá tính như tác nhân OpenClaw được định tuyến. Đặt `voice.realtime.bootstrapContextFiles` thành một tập con để tùy chỉnh, hoặc `[]` để tắt. Chỉ các tệp hồ sơ đó được hỗ trợ; `AGENTS.md` vẫn nằm trong ngữ cảnh tác nhân thông thường. Ngữ cảnh hồ sơ được chèn không thay thế `openclaw_agent_consult` cho công việc trong không gian làm việc, dữ kiện hiện tại, tra cứu bộ nhớ hoặc hành động dựa trên công cụ.
- Trong chế độ thời gian thực `agent-proxy` của OpenAI, đặt `voice.realtime.requireWakeName: true` để giữ giọng nói thời gian thực Discord im lặng cho đến khi bản chép lời bắt đầu hoặc kết thúc bằng một tên đánh thức. Tên đánh thức được cấu hình phải dài một hoặc hai từ. Nếu không đặt `voice.realtime.wakeNames`, OpenClaw sử dụng `name` của tác nhân được định tuyến cộng với `OpenClaw`, và dự phòng bằng mã định danh tác nhân cộng với `OpenClaw`. Cơ chế kiểm soát bằng tên đánh thức sẽ tắt tính năng tự động phản hồi của nhà cung cấp thời gian thực, định tuyến các lượt được chấp nhận qua luồng tham vấn tác nhân OpenClaw và phát một lời xác nhận ngắn khi tên đánh thức ở đầu được nhận diện từ bản chép lời một phần trước khi bản chép lời cuối cùng đến.
- Nhà cung cấp thời gian thực OpenAI chấp nhận tên sự kiện Realtime 2 hiện tại và các bí danh cũ tương thích với Codex cho sự kiện âm thanh đầu ra và bản chép lời, nhờ đó các bản chụp nhanh tương thích của nhà cung cấp có thể thay đổi mà không làm mất âm thanh của trợ lý.
- `voice.realtime.bargeIn` kiểm soát việc các sự kiện bắt đầu nói của người nói trên Discord có ngắt quá trình phát thời gian thực đang hoạt động hay không. Nếu không đặt, thiết lập này tuân theo cài đặt ngắt do âm thanh đầu vào của nhà cung cấp thời gian thực.
- `voice.realtime.minBargeInAudioEndMs` kiểm soát thời lượng phát tối thiểu của trợ lý trước khi một lượt ngắt lời thời gian thực OpenAI cắt ngắn âm thanh. Mặc định: `250`. Đặt `0` để ngắt ngay lập tức trong phòng ít tiếng vọng, hoặc tăng giá trị này cho các thiết lập loa có nhiều tiếng vọng.
- `voice.tts` chỉ ghi đè `messages.tts` cho việc phát giọng nói ở chế độ `stt-tts`; các chế độ thời gian thực sử dụng `voice.realtime.speakerVoice` thay thế. Để dùng một giọng OpenAI khi phát trên Discord, hãy đặt `voice.tts.provider: "openai"` và chọn một giọng chuyển văn bản thành lời nói trong `voice.tts.providers.openai.speakerVoice`. `cedar` là một lựa chọn có chất giọng nam phù hợp trên mô hình TTS OpenAI hiện tại.
- Các giá trị ghi đè `systemPrompt` theo từng kênh Discord áp dụng cho các lượt bản chép lời giọng nói của kênh thoại đó.
- Các lượt bản chép lời giọng nói suy ra trạng thái chủ sở hữu từ `allowFrom` (hoặc `dm.allowFrom`) của Discord cho các lệnh và hành động kênh bị giới hạn cho chủ sở hữu. Khả năng hiển thị công cụ của tác nhân tuân theo chính sách công cụ được cấu hình cho phiên được định tuyến.
- Nếu `voice.autoJoin` có nhiều mục cho cùng một máy chủ, OpenClaw sẽ tham gia kênh được cấu hình cuối cùng cho máy chủ đó.
- `voice.allowedChannels` là một danh sách cho phép lưu trú tùy chọn. Để không đặt nhằm cho phép `/vc join` tham gia bất kỳ kênh thoại Discord nào được ủy quyền. Khi được đặt, `/vc join`, tự động tham gia lúc khởi động và việc di chuyển trạng thái thoại của bot bị giới hạn ở các mục `{ guildId, channelId }` đã liệt kê. Đặt thành một mảng rỗng để từ chối mọi lượt tham gia kênh thoại Discord. Nếu Discord di chuyển bot ra ngoài danh sách cho phép, OpenClaw sẽ rời kênh đó và tham gia lại đích tự động tham gia đã cấu hình khi có sẵn.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được chuyển trực tiếp đến các tùy chọn tham gia của `@discordjs/voice`; giá trị mặc định từ thượng nguồn là `daveEncryption=true` và `decryptionFailureTolerance=24`.
- OpenClaw sử dụng codec `libopus-wasm` đi kèm để nhận giọng nói Discord và phát PCM thô theo thời gian thực. Gói này cung cấp một bản dựng WebAssembly libopus được cố định phiên bản và không yêu cầu phần bổ trợ opus gốc.
- `voice.connectTimeoutMs` kiểm soát thời gian chờ trạng thái Ready ban đầu của `@discordjs/voice` cho `/vc join` và các lần thử tự động tham gia. Mặc định: `30000`.
- `voice.reconnectGraceMs` kiểm soát khoảng thời gian OpenClaw chờ một phiên thoại đã ngắt kết nối bắt đầu kết nối lại trước khi hủy phiên đó. Mặc định: `15000`.
- Trong chế độ `stt-tts`, quá trình phát giọng nói không dừng chỉ vì người dùng khác bắt đầu nói. Để tránh vòng lặp phản hồi âm thanh, OpenClaw bỏ qua việc thu giọng nói mới trong khi TTS đang phát; hãy nói sau khi phát xong để bắt đầu lượt tiếp theo. Các chế độ thời gian thực chuyển tiếp sự kiện bắt đầu nói dưới dạng tín hiệu ngắt lời đến nhà cung cấp thời gian thực.
- Trong các chế độ thời gian thực, tiếng vọng từ loa vào micrô đang mở có thể bị coi là ngắt lời và làm gián đoạn quá trình phát. Đối với phòng Discord có nhiều tiếng vọng, hãy đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` để ngăn OpenAI tự động ngắt khi có âm thanh đầu vào. Thêm `voice.realtime.bargeIn: true` nếu bạn vẫn muốn các sự kiện bắt đầu nói của người nói trên Discord ngắt quá trình phát đang hoạt động. Cầu nối thời gian thực OpenAI bỏ qua các lần cắt ngắn quá trình phát có thời lượng ngắn hơn `voice.realtime.minBargeInAudioEndMs` vì có khả năng là tiếng vọng/tiếng ồn và ghi nhật ký rằng chúng đã bị bỏ qua, thay vì xóa quá trình phát Discord.
- `voice.captureSilenceGraceMs` kiểm soát khoảng thời gian OpenClaw chờ sau khi Discord báo rằng người nói đã dừng trước khi hoàn tất đoạn âm thanh đó để STT xử lý. Mặc định: `2000`; hãy tăng giá trị này nếu Discord chia các khoảng dừng thông thường thành những bản chép lời một phần rời rạc.
- Khi ElevenLabs là nhà cung cấp TTS được chọn, quá trình phát giọng nói Discord sử dụng TTS truyền phát và bắt đầu từ luồng phản hồi của nhà cung cấp. Các nhà cung cấp không hỗ trợ truyền phát sẽ dự phòng về luồng dùng tệp tạm đã tổng hợp.
- OpenClaw theo dõi các lỗi giải mã khi nhận và tự động khôi phục bằng cách rời rồi tham gia lại kênh thoại sau nhiều lần lỗi trong một khoảng thời gian ngắn.
- Nếu nhật ký nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và nhật ký. Phiên bản `@discordjs/voice` đi kèm bao gồm bản sửa lỗi phần đệm từ PR #11449 của discord.js, bản sửa này đã đóng vấn đề #11419 của discord.js.
- Các sự kiện nhận `The operation was aborted` là bình thường khi OpenClaw hoàn tất một đoạn âm thanh đã thu của người nói; đây là thông tin chẩn đoán chi tiết, không phải cảnh báo.
- Nhật ký giọng nói Discord chi tiết bao gồm bản xem trước bản chép lời STT một dòng có giới hạn cho mỗi đoạn âm thanh người nói được chấp nhận, nhờ đó quá trình gỡ lỗi hiển thị cả phía người dùng lẫn phía phản hồi của tác nhân mà không xuất văn bản bản chép lời không giới hạn.
- Trong chế độ `agent-proxy`, cơ chế dự phòng tham vấn bắt buộc bỏ qua các đoạn bản chép lời có khả năng chưa hoàn chỉnh, chẳng hạn như văn bản kết thúc bằng `...` hoặc một từ nối ở cuối như "và", cùng những lời kết thúc rõ ràng không cần hành động như "tôi quay lại ngay" hoặc "tạm biệt". Nhật ký hiển thị `forced agent consult skipped reason=...` khi cơ chế này ngăn một câu trả lời cũ đang xếp hàng.

### Theo dõi người dùng trong kênh thoại

Sử dụng `voice.followUsers` khi bạn muốn bot thoại Discord ở cùng một hoặc nhiều người dùng Discord đã biết, thay vì tham gia một kênh cố định lúc khởi động hoặc chờ `/vc join`.

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

- `followUsers` chấp nhận mã định danh người dùng Discord thô và các giá trị `discord:<id>`. OpenClaw chuẩn hóa cả hai dạng trước khi đối chiếu các sự kiện trạng thái thoại.
- `followUsersEnabled` mặc định là `true` khi `followUsers` được cấu hình. Đặt thành `false` để giữ danh sách đã lưu nhưng dừng việc tự động theo dõi bằng giọng nói.
- Khi một người dùng được theo dõi tham gia kênh thoại được phép, OpenClaw tham gia kênh đó. Khi người dùng di chuyển, OpenClaw di chuyển theo họ. Khi người dùng được theo dõi đang hoạt động ngắt kết nối, OpenClaw rời kênh.
- Nếu nhiều người dùng được theo dõi ở trong cùng một máy chủ và người dùng được theo dõi đang hoạt động rời đi, OpenClaw sẽ chuyển sang kênh của một người dùng được theo dõi khác đang được theo dõi trước khi rời máy chủ. Nếu nhiều người dùng được theo dõi di chuyển cùng lúc, sự kiện trạng thái thoại được quan sát gần nhất sẽ được ưu tiên.
- `allowedChannels` vẫn được áp dụng. Người dùng được theo dõi trong một kênh không được phép sẽ bị bỏ qua, và phiên do tính năng theo dõi sở hữu sẽ chuyển sang một người dùng được theo dõi khác hoặc rời đi.
- OpenClaw đối soát các sự kiện trạng thái thoại bị bỏ lỡ khi khởi động và theo một khoảng thời gian có giới hạn. Quá trình đối soát lấy mẫu các máy chủ đã cấu hình và giới hạn số lượt tra cứu REST trong mỗi lần chạy, vì vậy danh sách `followUsers` rất lớn có thể cần nhiều hơn một khoảng thời gian để hội tụ.
- Nếu Discord hoặc quản trị viên di chuyển bot trong khi bot đang theo dõi một người dùng, OpenClaw sẽ dựng lại phiên thoại và duy trì quyền sở hữu của tính năng theo dõi khi đích đến được phép. Nếu bot bị di chuyển ra ngoài `allowedChannels`, OpenClaw sẽ rời đi và tham gia lại đích đã cấu hình khi có đích đó.
- Cơ chế khôi phục nhận DAVE có thể rời rồi tham gia lại cùng một kênh sau nhiều lần giải mã thất bại. Các phiên do tính năng theo dõi sở hữu vẫn duy trì quyền sở hữu của tính năng theo dõi trong suốt luồng khôi phục đó, vì vậy việc người dùng được theo dõi ngắt kết nối sau đó vẫn khiến bot rời kênh.

Chọn giữa các chế độ tham gia:

- Sử dụng `followUsers` cho các thiết lập cá nhân hoặc dành cho người vận hành, trong đó bot cần tự động có mặt trong kênh thoại khi bạn ở đó.
- Sử dụng `autoJoin` cho các bot phòng cố định cần hiện diện ngay cả khi không có người dùng được theo dõi nào trong kênh thoại.
- Sử dụng `/vc join` cho các lượt tham gia một lần hoặc những phòng mà sự hiện diện giọng nói tự động có thể gây bất ngờ.

Codec giọng nói Discord:

- Nhật ký nhận giọng nói hiển thị `discord voice: opus decoder: libopus-wasm`.
- Quá trình phát thời gian thực mã hóa PCM stereo thô 48 kHz thành Opus bằng cùng gói `libopus-wasm` đi kèm trước khi chuyển các gói tin cho `@discordjs/voice`.
- Quá trình phát tệp và luồng của nhà cung cấp chuyển mã thành PCM stereo thô 48 kHz bằng ffmpeg, sau đó sử dụng `libopus-wasm` cho luồng gói tin Opus được gửi đến Discord.

Quy trình STT cộng với TTS:

- Luồng thu PCM của Discord được chuyển đổi thành một tệp WAV tạm thời.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản chép lời được gửi qua luồng tiếp nhận và định tuyến của Discord trong khi LLM phản hồi chạy với chính sách đầu ra giọng nói, chính sách này ẩn công cụ `tts` của tác tử và yêu cầu trả về văn bản, vì kênh thoại Discord chịu trách nhiệm phát TTS cuối cùng.
- Khi được đặt, `voice.model` chỉ ghi đè LLM phản hồi cho lượt kênh thoại này.
- `voice.tts` được hợp nhất lên trên `messages.tts`; các nhà cung cấp hỗ trợ truyền phát đưa dữ liệu trực tiếp vào trình phát, nếu không thì tệp âm thanh kết quả sẽ được phát trong kênh đã tham gia.

Ví dụ về phiên kênh thoại proxy tác tử mặc định:

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

Khi không có khối `voice.agentSession`, mỗi kênh thoại sẽ có một phiên OpenClaw được định tuyến riêng. Ví dụ, `/vc join channel:234567890123456789` giao tiếp với phiên của kênh thoại Discord đó. Mô hình thời gian thực chỉ là giao diện giọng nói; các yêu cầu thực chất được chuyển cho tác tử OpenClaw đã cấu hình. Nếu mô hình thời gian thực tạo ra bản chép lời cuối cùng mà không gọi công cụ tham vấn, OpenClaw sẽ buộc thực hiện tham vấn như một phương án dự phòng để hành vi mặc định vẫn giống như đang nói chuyện với tác tử.

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

Ví dụ hai chiều thời gian thực:

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

Giọng nói như phần mở rộng của một phiên kênh Discord hiện có:

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

Ở chế độ `agent-proxy`, bot tham gia kênh thoại đã cấu hình, nhưng các lượt của tác tử OpenClaw sử dụng tác tử và phiên được định tuyến thông thường của kênh đích. Phiên giọng nói thời gian thực đọc kết quả trả về trong kênh thoại. Tác tử giám sát vẫn có thể sử dụng các công cụ nhắn tin thông thường theo chính sách công cụ của nó, bao gồm gửi một tin nhắn Discord riêng nếu đó là hành động phù hợp.

Trong khi một lượt chạy OpenClaw được ủy quyền đang hoạt động, các bản chép lời giọng nói Discord mới được xem là lệnh điều khiển trực tiếp cho lượt chạy trước khi bắt đầu một lượt tác tử khác. Các cụm từ như "trạng thái", "hủy việc đó", "dùng bản sửa nhỏ hơn" hoặc "khi xong cũng hãy kiểm tra các bài kiểm thử" được phân loại là đầu vào trạng thái, hủy, điều hướng hoặc tiếp nối cho phiên đang hoạt động. Kết quả trạng thái, hủy, điều hướng được chấp nhận và tiếp nối được đọc lại trong kênh thoại để người gọi biết OpenClaw có xử lý yêu cầu hay không.

Các dạng đích hữu ích:

- `target: "channel:123456789012345678"` định tuyến qua phiên của một kênh văn bản Discord.
- `target: "123456789012345678"` được xem là đích kênh.
- `target: "dm:123456789012345678"` hoặc `target: "user:123456789012345678"` định tuyến qua phiên tin nhắn trực tiếp tương ứng.

Ví dụ OpenAI Realtime có nhiều tiếng vọng:

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

Dùng cấu hình này khi mô hình nghe thấy âm thanh Discord do chính nó phát qua micrô đang mở, nhưng bạn vẫn muốn ngắt lời bằng cách nói. OpenClaw ngăn OpenAI tự động ngắt khi nhận âm thanh đầu vào thô, trong khi `bargeIn: true` cho phép các sự kiện bắt đầu nói của người dùng Discord và âm thanh của người nói đang hoạt động hủy các phản hồi thời gian thực đang hoạt động trước khi lượt thu tiếp theo đến OpenAI. Các tín hiệu ngắt lời quá sớm có `audioEndMs` thấp hơn `minBargeInAudioEndMs` được xem là tiếng vọng hoặc nhiễu có khả năng xảy ra và bị bỏ qua để mô hình không bị ngắt ngay ở khung phát đầu tiên.

Nhật ký giọng nói dự kiến:

- Khi tham gia: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Khi bắt đầu thời gian thực: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Khi có âm thanh người nói: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` và `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Khi bỏ qua lời nói cũ: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` hoặc `reason=non-actionable-closing ...`
- Khi hoàn tất phản hồi thời gian thực: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Khi dừng/đặt lại phát âm thanh: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Khi tham vấn thời gian thực: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Khi tác tử trả lời: `discord voice: agent turn answer ...`
- Khi xếp hàng lời nói chính xác: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, tiếp theo là `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Khi phát hiện ngắt lời: `discord voice: realtime barge-in detected source=speaker-start ...` hoặc `discord voice: realtime barge-in detected source=active-speaker-audio ...`, tiếp theo là `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Khi ngắt thời gian thực: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, tiếp theo là `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` hoặc `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Khi bỏ qua tiếng vọng/nhiễu: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Khi tính năng ngắt lời bị tắt: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Khi phát âm thanh ở trạng thái chờ: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Để gỡ lỗi âm thanh bị ngắt, hãy đọc nhật ký giọng nói thời gian thực theo trình tự thời gian:

1. `realtime audio playback started` nghĩa là Discord đã bắt đầu phát âm thanh của trợ lý. Từ thời điểm này, cầu nối bắt đầu đếm các đoạn đầu ra của trợ lý, số byte PCM của Discord, số byte thời gian thực của nhà cung cấp và thời lượng âm thanh tổng hợp.
2. `realtime speaker turn opened` đánh dấu một người nói trên Discord bắt đầu hoạt động. Nếu quá trình phát âm thanh đã hoạt động và `bargeIn` được bật, sau đó có thể xuất hiện `barge-in detected source=speaker-start`.
3. `realtime input audio started` đánh dấu khung âm thanh thực tế đầu tiên nhận được cho lượt nói đó. `outputActive=true` hoặc `outputAudioMs` khác 0 tại đây nghĩa là micrô đang gửi đầu vào trong khi âm thanh của trợ lý vẫn đang được phát.
4. `barge-in detected source=active-speaker-audio` nghĩa là OpenClaw phát hiện âm thanh trực tiếp của người nói trong khi âm thanh của trợ lý đang được phát. Điều này hữu ích để phân biệt một lần ngắt thực sự với sự kiện bắt đầu nói của Discord nhưng không có âm thanh hữu ích.
5. `barge-in requested reason=...` nghĩa là OpenClaw đã yêu cầu nhà cung cấp thời gian thực hủy hoặc cắt ngắn phản hồi đang hoạt động. Dòng này bao gồm `outputAudioMs`, `outputActive` và `playbackChunks` để bạn có thể biết lượng âm thanh trợ lý thực sự đã được phát trước khi bị ngắt.
6. `realtime audio playback stopped reason=...` là thời điểm đặt lại quá trình phát cục bộ trên Discord. Lý do cho biết tác nhân đã dừng phát: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` hoặc `session-close`.
7. `realtime speaker turn closed` tóm tắt lượt đầu vào đã thu. `chunks=0` hoặc `hasAudio=false` nghĩa là lượt nói đã mở nhưng không có âm thanh sử dụng được nào đến cầu nối thời gian thực. `interruptedPlayback=true` nghĩa là lượt đầu vào đó trùng với đầu ra của trợ lý và kích hoạt logic ngắt lời.

Các trường hữu ích:

- `outputAudioMs`: thời lượng âm thanh trợ lý do nhà cung cấp thời gian thực tạo ra trước dòng nhật ký.
- `audioMs`: thời lượng âm thanh trợ lý mà OpenClaw đã đếm trước khi dừng phát.
- `elapsedMs`: thời gian thực tế trôi qua giữa lúc mở và đóng luồng phát hoặc lượt nói.
- `discordBytes`: số byte PCM stereo 48 kHz được gửi đến hoặc nhận từ kênh thoại Discord.
- `realtimeBytes`: số byte PCM theo định dạng của nhà cung cấp được gửi đến hoặc nhận từ nhà cung cấp thời gian thực.
- `playbackChunks`: các đoạn âm thanh trợ lý được chuyển tiếp đến Discord cho phản hồi đang hoạt động.
- `sinceLastAudioMs`: khoảng thời gian giữa khung âm thanh cuối cùng thu được từ người nói và lúc đóng lượt nói.

Các mẫu thường gặp:

- Việc bị ngắt ngay lập tức với `source=active-speaker-audio`, `outputAudioMs` nhỏ và cùng người dùng ở gần thường cho thấy tiếng vọng từ loa đi vào micrô. Hãy tăng `voice.realtime.minBargeInAudioEndMs`, giảm âm lượng loa, dùng tai nghe hoặc đặt `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` theo sau bởi `speaker turn closed ... hasAudio=false` nghĩa là Discord đã báo bắt đầu có người nói nhưng không có âm thanh nào đến OpenClaw. Đây có thể là một sự kiện thoại Discord tạm thời, hành vi của cổng nhiễu hoặc máy khách kích hoạt micrô trong thời gian rất ngắn.
- `audio playback stopped reason=stream-close` mà không có lần ngắt lời hoặc `provider-clear-audio` gần đó nghĩa là luồng phát Discord cục bộ đã kết thúc ngoài dự kiến. Hãy kiểm tra các nhật ký trước đó của nhà cung cấp và trình phát Discord.
- `capture ignored during playback (barge-in disabled)` nghĩa là OpenClaw cố ý bỏ đầu vào trong khi âm thanh của trợ lý đang hoạt động. Bật `voice.realtime.bargeIn` nếu bạn muốn lời nói ngắt quá trình phát.
- `barge-in ignored ... outputActive=false` nghĩa là VAD của Discord hoặc nhà cung cấp đã báo có lời nói, nhưng OpenClaw không có quá trình phát nào đang hoạt động để ngắt. Điều này không được làm âm thanh bị ngắt.

Thông tin xác thực được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, xác thực TTS cho `messages.tts`/`voice.tts` và xác thực nhà cung cấp thời gian thực cho `voice.realtime.providers` hoặc cấu hình xác thực thông thường của nhà cung cấp.

### Tin nhắn thoại

Tin nhắn thoại Discord hiển thị bản xem trước dạng sóng và yêu cầu âm thanh OGG/Opus. OpenClaw tự động tạo dạng sóng, nhưng cần có `ffmpeg` và `ffprobe` trên máy chủ Gateway để kiểm tra và chuyển đổi.

- Cung cấp một **đường dẫn tệp cục bộ** (URL bị từ chối).
- Bỏ qua nội dung văn bản (Discord từ chối văn bản và tin nhắn thoại trong cùng một tải trọng).
- Mọi định dạng âm thanh đều được chấp nhận; OpenClaw chuyển đổi sang OGG/Opus khi cần.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Đã sử dụng các intent không được phép hoặc bot không thấy tin nhắn nào trong máy chủ">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào việc phân giải người dùng/thành viên
    - khởi động lại Gateway sau khi thay đổi các intent

  </Accordion>

  <Accordion title="Tin nhắn bang hội bị chặn ngoài dự kiến">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép của bang hội trong `channels.discord.guilds`
    - nếu tồn tại ánh xạ `channels` của bang hội, chỉ các kênh được liệt kê mới được phép
    - xác minh hành vi của `requireMention` và các mẫu đề cập

    Các bước kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Không yêu cầu đề cập nhưng vẫn bị chặn">
    Các nguyên nhân thường gặp:

    - `groupPolicy="allowlist"` nhưng không có danh sách cho phép bang hội/kênh tương ứng
    - `requireMention` được cấu hình sai vị trí (phải nằm trong `channels.discord.guilds` hoặc một mục kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của bang hội/kênh

  </Accordion>

  <Accordion title="Lượt Discord chạy lâu hoặc phản hồi trùng lặp">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Các tham số điều chỉnh hàng đợi Gateway Discord:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - tham số này chỉ kiểm soát công việc của trình lắng nghe Gateway Discord, không kiểm soát thời gian tồn tại của lượt tác tử

    Discord không áp dụng thời gian chờ do kênh sở hữu cho các lượt tác tử trong hàng đợi. Trình lắng nghe tin nhắn bàn giao ngay lập tức, còn các lần chạy Discord trong hàng đợi duy trì thứ tự theo từng phiên cho đến khi vòng đời phiên/công cụ/môi trường chạy hoàn tất hoặc hủy công việc.

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

  <Accordion title="Cảnh báo hết thời gian chờ khi tra cứu siêu dữ liệu Gateway">
    OpenClaw tìm nạp siêu dữ liệu `/gateway/bot` của Discord trước khi kết nối. Khi xảy ra lỗi tạm thời, hệ thống chuyển sang URL Gateway mặc định của Discord và giới hạn tần suất ghi nhật ký.

    Các tham số điều chỉnh thời gian chờ siêu dữ liệu:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - giá trị dự phòng từ biến môi trường khi chưa đặt cấu hình: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Khởi động lại do hết thời gian chờ READY của Gateway">
    OpenClaw chờ sự kiện `READY` của Gateway Discord trong lúc khởi động và sau khi môi trường chạy kết nối lại. Các thiết lập nhiều tài khoản có khởi động lệch thời điểm có thể cần khoảng chờ READY khi khởi động dài hơn giá trị mặc định.

    Các tham số điều chỉnh thời gian chờ READY:

    - khởi động với một tài khoản: `channels.discord.gatewayReadyTimeoutMs`
    - khởi động với nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - giá trị dự phòng khi khởi động từ biến môi trường nếu chưa đặt cấu hình: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - giá trị mặc định khi khởi động: `15000` (15 giây), tối đa: `120000`
    - môi trường chạy với một tài khoản: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - môi trường chạy với nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - giá trị dự phòng khi chạy từ biến môi trường nếu chưa đặt cấu hình: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - giá trị mặc định khi chạy: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Kết quả kiểm tra quyền không khớp">
    Hoạt động kiểm tra quyền của `channels status --probe` chỉ dùng được với ID kênh dạng số.

    Nếu bạn dùng khóa dạng slug, việc đối chiếu trong môi trường chạy vẫn có thể hoạt động, nhưng phép thăm dò không thể xác minh đầy đủ các quyền.

  </Accordion>

  <Accordion title="Sự cố tin nhắn trực tiếp và ghép cặp">

    - tin nhắn trực tiếp bị tắt: `channels.discord.dm.enabled=false`
    - chính sách tin nhắn trực tiếp bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép cặp trong chế độ `pairing`

  </Accordion>

  <Accordion title="Vòng lặp giữa các bot">
    Theo mặc định, các tin nhắn do bot gửi sẽ bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng các quy tắc đề cập và danh sách cho phép nghiêm ngặt để tránh hành vi lặp.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn của bot có đề cập đến bot này.

    OpenClaw cũng cung cấp sẵn cơ chế dùng chung [bảo vệ khỏi vòng lặp bot](/vi/channels/bot-loop-protection). Bất cứ khi nào `allowBots` cho phép tin nhắn do bot gửi đi đến bước điều phối, Discord ánh xạ sự kiện đến thành các dữ kiện `(tài khoản, kênh, cặp bot)`, và bộ bảo vệ cặp dùng chung sẽ chặn cặp đó sau khi vượt quá ngân sách sự kiện đã cấu hình. Bộ bảo vệ ngăn các vòng lặp mất kiểm soát giữa hai bot mà trước đây chỉ có thể dừng bằng giới hạn tốc độ của Discord; cơ chế này không ảnh hưởng đến các bản triển khai một bot hoặc các phản hồi bot một lần vẫn nằm trong ngân sách.

    Thiết lập mặc định (hoạt động khi đã đặt `allowBots`):

    - `maxEventsPerWindow: 20` -- cặp bot có thể trao đổi 20 tin nhắn trong cửa sổ trượt
    - `windowSeconds: 60` -- độ dài cửa sổ trượt
    - `cooldownSeconds: 60` -- sau khi vượt ngân sách, mọi tin nhắn bổ sung giữa hai bot theo bất kỳ chiều nào đều bị loại bỏ trong một phút

    Cấu hình giá trị mặc định dùng chung một lần trong `channels.defaults.botLoopProtection`, sau đó ghi đè cho Discord khi một quy trình làm việc hợp lệ cần thêm dư địa. Thứ tự ưu tiên là:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - các giá trị mặc định tích hợp sẵn

    Discord sử dụng các khóa dùng chung `maxEventsPerWindow`, `windowSeconds` và `cooldownSeconds`.

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
      // Ghi đè tùy chọn trên toàn Discord. Các khối tài khoản ghi đè từng
      // trường và kế thừa các trường bị lược bỏ từ đây.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha chỉ lắng nghe các bot khác khi chúng đề cập đến nó.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo lắng nghe tất cả tin nhắn Discord do bot gửi.
          allowBots: true,
          mentionAliases: {
            // Cho phép Bravo viết một đề cập Discord đến Alpha bằng ID người dùng đã cấu hình.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Cho phép tối đa năm tin nhắn mỗi phút trước khi chặn cặp.
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

  <Accordion title="STT thoại bị gián đoạn với DecryptionFailed(...)">

    - duy trì OpenClaw ở phiên bản mới nhất (`openclaw update`) để có logic khôi phục nhận thoại Discord
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu với `channels.discord.voice.decryptionFailureTolerance=24` (giá trị mặc định của nguồn thượng nguồn) và chỉ điều chỉnh nếu cần
    - theo dõi nhật ký để tìm:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi vẫn tiếp diễn sau khi tự động tham gia lại, hãy thu thập nhật ký và đối chiếu với lịch sử nhận DAVE từ nguồn thượng nguồn trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) và [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Discord](/vi/gateway/config-channels#discord).

<Accordion title="Các trường Discord quan trọng">

- khởi động/xác thực: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- chính sách: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- lệnh: `commands.native`, `commands.useAccessGroups` (toàn cục), `configWrites`, `slashCommand.ephemeral`
- hàng đợi sự kiện: `eventQueue.listenerTimeout` (ngân sách trình lắng nghe, mặc định `120000`), `eventQueue.maxQueueSize` (mặc định `10000`), `eventQueue.maxConcurrency` (mặc định `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- phản hồi/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- gửi tin: `textChunkLimit` (mặc định `2000`), `maxLinesPerMessage` (mặc định `17`)
- truyền phát: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (các khóa phẳng cũ `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` được `openclaw doctor --fix` di chuyển vào `streaming.*`)
- phương tiện/thử lại: `mediaMaxMb` (giới hạn nội dung tải lên Discord ở đầu ra, mặc định `100`), `retry`
- hành động: `actions.*`
- trạng thái hiện diện: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- giao diện người dùng: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là thông tin bí mật (ưu tiên `DISCORD_BOT_TOKEN` trong các môi trường được giám sát).
- Chỉ cấp các quyền Discord tối thiểu cần thiết.
- Nếu trạng thái/triển khai lệnh đã lỗi thời, hãy khởi động lại Gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Ghép cặp" icon="link" href="/vi/channels/pairing">
    Ghép cặp người dùng Discord với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi trò chuyện nhóm và danh sách cho phép.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến cho các tác tử.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và tăng cường bảo mật.
  </Card>
  <Card title="Định tuyến đa tác tử" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ các bang hội và kênh tới các tác tử.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc.
  </Card>
</CardGroup>
