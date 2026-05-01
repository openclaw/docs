---
read_when:
    - Làm việc với các tính năng của kênh Discord
summary: Trạng thái hỗ trợ bot Discord, khả năng và cấu hình
title: Discord
x-i18n:
    generated_at: "2026-05-01T10:45:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0d40792bf83a8d44dba3c70a94d888fb57af25bf240185265fd3a5edb207cb
    source_path: channels/discord.md
    workflow: 16
---

Sẵn sàng cho DM và kênh guild qua Discord gateway chính thức.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM trên Discord mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và luồng sửa chữa.
  </Card>
</CardGroup>

## Thiết lập nhanh

Bạn cần tạo một ứng dụng mới có bot, thêm bot vào máy chủ của bạn, rồi ghép nối bot với OpenClaw. Chúng tôi khuyên bạn nên thêm bot vào máy chủ riêng của chính bạn. Nếu chưa có, hãy [tạo một máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Create My Own > For me and my friends**).

<Steps>
  <Step title="Tạo ứng dụng Discord và bot">
    Đi tới [Discord Developer Portal](https://discord.com/developers/applications) rồi nhấp vào **New Application**. Đặt tên kiểu như "OpenClaw".

    Nhấp vào **Bot** trên thanh bên. Đặt **Username** thành tên bạn dùng để gọi agent OpenClaw của mình.

  </Step>

  <Step title="Bật privileged intents">
    Vẫn ở trang **Bot**, cuộn xuống **Privileged Gateway Intents** và bật:

    - **Message Content Intent** (bắt buộc)
    - **Server Members Intent** (được khuyến nghị; bắt buộc cho danh sách cho phép theo vai trò và khớp tên với ID)
    - **Presence Intent** (tùy chọn; chỉ cần cho cập nhật trạng thái hiện diện)

  </Step>

  <Step title="Sao chép token bot của bạn">
    Cuộn lại lên trên trang **Bot** và nhấp vào **Reset Token**.

    <Note>
    Dù tên là vậy, thao tác này tạo token đầu tiên của bạn — không có gì bị "đặt lại".
    </Note>

    Sao chép token và lưu lại ở đâu đó. Đây là **Bot Token** của bạn và bạn sẽ cần dùng ngay sau đây.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào máy chủ của bạn">
    Nhấp vào **OAuth2** trên thanh bên. Bạn sẽ tạo một URL mời với đúng quyền để thêm bot vào máy chủ của mình.

    Cuộn xuống **OAuth2 URL Generator** và bật:

    - `bot`
    - `applications.commands`

    Một phần **Bot Permissions** sẽ xuất hiện bên dưới. Bật tối thiểu:

    **Quyền chung**
      - Xem kênh
    **Quyền văn bản**
      - Gửi tin nhắn
      - Đọc lịch sử tin nhắn
      - Nhúng liên kết
      - Đính kèm tệp
      - Thêm phản ứng (tùy chọn)

    Đây là bộ quyền nền tảng cho các kênh văn bản thông thường. Nếu bạn định đăng trong thread Discord, bao gồm quy trình kênh diễn đàn hoặc kênh media tạo hoặc tiếp tục một thread, hãy bật thêm **Send Messages in Threads**.
    Sao chép URL được tạo ở dưới cùng, dán vào trình duyệt, chọn máy chủ của bạn và nhấp **Continue** để kết nối. Bây giờ bạn sẽ thấy bot của mình trong máy chủ Discord.

  </Step>

  <Step title="Bật Developer Mode và thu thập ID của bạn">
    Quay lại ứng dụng Discord, bạn cần bật Developer Mode để có thể sao chép ID nội bộ.

    1. Nhấp **User Settings** (biểu tượng bánh răng cạnh ảnh đại diện của bạn) → **Advanced** → bật **Developer Mode**
    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trong thanh bên → **Copy Server ID**
    3. Nhấp chuột phải vào **ảnh đại diện của chính bạn** → **Copy User ID**

    Lưu **Server ID** và **User ID** cùng với Bot Token của bạn — bạn sẽ gửi cả ba cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Cho phép DM từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord cần cho phép bot gửi DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn → **Privacy Settings** → bật **Direct Messages**.

    Điều này cho phép thành viên máy chủ (bao gồm bot) gửi DM cho bạn. Giữ thiết lập này bật nếu bạn muốn dùng DM Discord với OpenClaw. Nếu bạn chỉ định dùng kênh guild, bạn có thể tắt DM sau khi ghép nối.

  </Step>

  <Step title="Đặt token bot của bạn một cách an toàn (không gửi trong chat)">
    Token bot Discord của bạn là bí mật (giống mật khẩu). Đặt token trên máy đang chạy OpenClaw trước khi nhắn tin cho agent của bạn.

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
    Với các bản cài đặt dịch vụ được quản lý, hãy chạy `openclaw gateway install` từ shell nơi có `DISCORD_BOT_TOKEN`, hoặc lưu biến trong `~/.openclaw/.env`, để dịch vụ có thể phân giải env SecretRef sau khi khởi động lại.
    Nếu máy chủ của bạn bị Discord chặn hoặc giới hạn tốc độ khi tra cứu ứng dụng lúc khởi động, hãy đặt ID ứng dụng/client Discord từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó. Dùng `channels.discord.applicationId` cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.applicationId` khi bạn chạy nhiều bot Discord.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Chat với agent OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ: Telegram) và báo cho agent. Nếu Discord là kênh đầu tiên của bạn, hãy dùng tab CLI / cấu hình thay thế.

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

        Env dự phòng cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Với thiết lập bằng script hoặc từ xa, ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run` rồi chạy lại không có `--dry-run`. Các giá trị `token` dạng văn bản thuần được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các provider env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Với nhiều bot Discord, hãy giữ từng token bot và ID ứng dụng trong tài khoản của nó. `channels.discord.applicationId` cấp cao nhất được các tài khoản kế thừa, nên chỉ đặt ở đó khi mọi tài khoản đều dùng cùng một ID ứng dụng.

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
    Chờ đến khi gateway đang chạy, rồi DM bot của bạn trong Discord. Bot sẽ phản hồi bằng mã ghép nối.

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
Quá trình phân giải token nhận biết tài khoản. Giá trị token trong cấu hình thắng env dự phòng. `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord đang bật phân giải ra cùng một token bot, OpenClaw chỉ khởi động một gateway monitor cho token đó. Token lấy từ cấu hình thắng env dự phòng mặc định; nếu không, tài khoản đang bật đầu tiên thắng và tài khoản trùng lặp được báo là đã tắt.
Với các lệnh gọi outbound nâng cao (hành động công cụ tin nhắn/kênh), `token` rõ ràng theo từng lệnh gọi được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và đọc/thăm dò (ví dụ read/search/fetch/thread/pins/permissions). Chính sách tài khoản/thiết lập thử lại vẫn đến từ tài khoản được chọn trong snapshot runtime đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập workspace guild

Sau khi DM hoạt động, bạn có thể thiết lập máy chủ Discord của mình thành một workspace đầy đủ, nơi mỗi kênh có phiên agent riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho máy chủ riêng chỉ có bạn và bot của bạn.

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
    Theo mặc định, agent của bạn chỉ phản hồi trong kênh guild khi được @mention. Với máy chủ riêng, có lẽ bạn muốn agent phản hồi mọi tin nhắn.

    Trong kênh guild, các phản hồi cuối bình thường của trợ lý mặc định vẫn ở chế độ riêng tư. Đầu ra Discord hiển thị phải được gửi rõ ràng bằng công cụ `message`, để agent có thể mặc định quan sát thầm lặng và chỉ đăng khi quyết định rằng phản hồi trong kênh là hữu ích.

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

        Để khôi phục phản hồi cuối tự động kiểu cũ cho phòng nhóm/kênh, hãy đặt `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Lập kế hoạch cho bộ nhớ trong kênh guild">
    Theo mặc định, bộ nhớ dài hạn (MEMORY.md) chỉ được tải trong phiên DM. Kênh guild không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Khi tôi hỏi trong kênh Discord, hãy dùng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Nếu bạn cần ngữ cảnh dùng chung trong mọi kênh, hãy đặt các chỉ dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được chèn vào mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập chúng theo nhu cầu bằng công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo vài kênh trên máy chủ Discord của bạn và bắt đầu chat. Agent của bạn có thể thấy tên kênh, và mỗi kênh có phiên biệt lập riêng — vì vậy bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất cứ gì phù hợp với quy trình làm việc của bạn.

## Mô hình runtime

- Gateway sở hữu kết nối Discord.
- Định tuyến trả lời có tính xác định: các trả lời đến từ Discord sẽ quay lại Discord.
- Siêu dữ liệu máy chủ/kênh Discord được thêm vào lời nhắc mô hình dưới dạng ngữ cảnh không đáng tin cậy, không phải tiền tố trả lời hiển thị cho người dùng. Nếu mô hình sao chép lại lớp bao đó, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi các trả lời gửi đi và khỏi ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), các cuộc trò chuyện trực tiếp dùng chung phiên chính của tác nhân (`agent:main:main`).
- Các kênh máy chủ là khóa phiên tách biệt (`agent:<agentId>:discord:channel:<channelId>`).
- DM nhóm bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Các lệnh gạch chéo gốc chạy trong những phiên lệnh tách biệt (`agent:<agentId>:discord:slash:<userId>`), trong khi vẫn mang `CommandTargetSessionKey` đến phiên hội thoại được định tuyến.
- Việc gửi thông báo cron/heartbeat chỉ có văn bản đến Discord sử dụng câu trả lời cuối cùng hiển thị cho trợ lý một lần. Các tải trọng phương tiện và thành phần có cấu trúc vẫn là nhiều tin nhắn khi tác nhân phát ra nhiều tải trọng có thể gửi.

## Kênh diễn đàn

Các kênh diễn đàn và phương tiện của Discord chỉ chấp nhận bài đăng luồng. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn đến diễn đàn cha (`channel:<forumId>`) để tự động tạo một luồng. Tiêu đề luồng dùng dòng không trống đầu tiên trong tin nhắn của bạn.
- Dùng `openclaw message thread create` để tạo luồng trực tiếp. Không truyền `--message-id` cho kênh diễn đàn.

Ví dụ: gửi đến diễn đàn cha để tạo luồng

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ví dụ: tạo một luồng diễn đàn một cách tường minh

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Diễn đàn cha không chấp nhận thành phần Discord. Nếu bạn cần thành phần, hãy gửi đến chính luồng đó (`channel:<threadId>`).

## Thành phần tương tác

OpenClaw hỗ trợ vùng chứa thành phần Discord v2 cho tin nhắn của tác nhân. Dùng công cụ tin nhắn với tải trọng `components`. Kết quả tương tác được định tuyến trở lại tác nhân như tin nhắn đến bình thường và tuân theo các thiết lập Discord `replyToMode` hiện có.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Kiểu chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép dùng nút, lựa chọn và biểu mẫu nhiều lần cho đến khi chúng hết hạn.

Để giới hạn ai có thể nhấp vào một nút, đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ, hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận thông báo từ chối tạm thời.

Các lệnh gạch chéo `/model` và `/models` mở bộ chọn mô hình tương tác với các danh sách thả xuống nhà cung cấp, mô hình và thời gian chạy tương thích, cộng thêm bước Gửi. `/models add` đã lỗi thời và hiện trả về thông báo ngừng dùng thay vì đăng ký mô hình từ trò chuyện. Trả lời của bộ chọn là tạm thời và chỉ người dùng gọi lệnh mới có thể dùng.

Tệp đính kèm:

- Các khối `file` phải trỏ đến tham chiếu tệp đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); dùng `media-gallery` cho nhiều tệp
- Dùng `filename` để ghi đè tên tải lên khi tên đó phải khớp với tham chiếu tệp đính kèm

Biểu mẫu hộp thoại:

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
    - Với một tài khoản, `allowFrom` được ưu tiên hơn `dm.allowFrom` cũ.
    - Tài khoản có tên kế thừa `channels.discord.allowFrom` khi `allowFrom` của chính chúng và `dm.allowFrom` cũ chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Định dạng đích DM để gửi:

    - `user:<id>`
    - đề cập `<@id>`

    ID số trần thường được phân giải như ID kênh khi có mặc định kênh đang hoạt động, nhưng các ID được liệt kê trong `allowFrom` DM hiệu lực của tài khoản được xem là đích DM người dùng để tương thích.

  </Tab>

  <Tab title="Chính sách máy chủ">
    Việc xử lý máy chủ được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Đường cơ sở bảo mật khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - máy chủ phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được cho phép khi họ khớp với `users` HOẶC `roles`
    - khớp tên/thẻ trực tiếp bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` như chế độ tương thích khẩn cấp
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng mục nhập tên/thẻ
    - nếu một máy chủ có cấu hình `channels`, các kênh không được liệt kê sẽ bị từ chối
    - nếu một máy chủ không có khối `channels`, tất cả kênh trong máy chủ thuộc danh sách cho phép đó đều được cho phép

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

    Nếu bạn chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, dự phòng thời gian chạy là `groupPolicy="allowlist"` (có cảnh báo trong nhật ký), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Đề cập và DM nhóm">
    Tin nhắn máy chủ bị chặn bằng đề cập theo mặc định.

    Phát hiện đề cập bao gồm:

    - đề cập bot tường minh
    - mẫu đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm đến bot trong các trường hợp được hỗ trợ

    `requireMention` được cấu hình theo từng máy chủ/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn bỏ các tin nhắn đề cập người dùng/vai trò khác nhưng không đề cập bot (không tính @everyone/@here).

    DM nhóm:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến tác nhân dựa trên vai trò

Dùng `bindings[].match.roles` để định tuyến thành viên máy chủ Discord đến các tác nhân khác nhau theo ID vai trò. Liên kết dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau liên kết ngang hàng hoặc cha-ngang hàng, và trước liên kết chỉ theo máy chủ. Nếu một liên kết cũng đặt các trường khớp khác (ví dụ `peer` + `guildId` + `roles`), tất cả trường đã cấu hình phải khớp.

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
- `commands.native=false` xóa tường minh các lệnh gốc Discord đã đăng ký trước đó.
- Xác thực lệnh gốc dùng cùng danh sách cho phép/chính sách Discord như xử lý tin nhắn bình thường.
- Lệnh vẫn có thể hiển thị trong giao diện Discord với người dùng không được cấp quyền; việc thực thi vẫn áp dụng xác thực OpenClaw và trả về "không được cấp quyền".

Xem [Lệnh gạch chéo](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

Thiết lập lệnh gạch chéo mặc định:

- `ephemeral: true`

## Chi tiết tính năng

<AccordionGroup>
  <Accordion title="Thẻ trả lời và trả lời gốc">
    Discord hỗ trợ thẻ trả lời trong đầu ra của tác nhân:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Được kiểm soát bởi `channels.discord.replyToMode`:

    - `off` (mặc định)
    - `first`
    - `all`
    - `batched`

    Lưu ý: `off` tắt phân luồng trả lời ngầm. Các thẻ `[[reply_to_*]]` tường minh vẫn được tôn trọng.
    `first` luôn gắn tham chiếu trả lời gốc ngầm vào tin nhắn Discord gửi đi đầu tiên của lượt.
    `batched` chỉ gắn tham chiếu trả lời gốc ngầm của Discord khi lượt đến là một lô nhiều tin nhắn đã được gom trễ. Điều này hữu ích khi bạn chủ yếu muốn trả lời gốc cho các cuộc trò chuyện bùng phát dễ mơ hồ, không phải mọi lượt một tin nhắn.

    ID tin nhắn được hiển thị trong ngữ cảnh/lịch sử để tác nhân có thể nhắm đến tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Xem trước luồng trực tiếp">
    OpenClaw có thể truyền trực tuyến bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa nó khi văn bản đến. `channels.discord.streaming` nhận `off` (mặc định) | `partial` | `block` | `progress`. `progress` ánh xạ sang `partial` trên Discord; `streamMode` là bí danh cũ và được tự động di chuyển.

    Mặc định vẫn là `off` vì các chỉnh sửa xem trước Discord nhanh chóng chạm giới hạn tốc độ khi nhiều bot hoặc Gateway dùng chung một tài khoản.

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
    - `block` phát ra các đoạn có kích thước bản nháp (dùng `draftChunk` để tinh chỉnh kích thước và điểm ngắt, bị kẹp theo `textChunkLimit`).
    - Phương tiện, lỗi và kết quả cuối có trả lời tường minh sẽ hủy các chỉnh sửa xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) kiểm soát việc các cập nhật công cụ/tiến trình có tái sử dụng tin nhắn xem trước hay không.

    Truyền trực tuyến xem trước chỉ hỗ trợ văn bản; trả lời phương tiện quay về cơ chế gửi bình thường. Khi truyền trực tuyến `block` được bật tường minh, OpenClaw bỏ qua luồng xem trước để tránh truyền hai lần.

  </Accordion>

  <Accordion title="Lịch sử, ngữ cảnh và hành vi luồng">
    Ngữ cảnh lịch sử máy chủ:

    - `channels.discord.historyLimit` mặc định `20`
    - dự phòng: `messages.groupChat.historyLimit`
    - `0` tắt

    Điều khiển lịch sử DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi luồng:

    - Các luồng Discord định tuyến như phiên kênh và kế thừa cấu hình kênh cha trừ khi được ghi đè.
    - Phiên luồng kế thừa lựa chọn `/model` cấp phiên của kênh cha làm phương án dự phòng chỉ dành cho mô hình; lựa chọn `/model` cục bộ của luồng vẫn được ưu tiên và lịch sử bản ghi của kênh cha không được sao chép trừ khi tính năng kế thừa bản ghi được bật.
    - `channels.discord.thread.inheritParent` (mặc định `false`) chọn cho các luồng tự động mới được khởi tạo từ bản ghi của luồng cha. Ghi đè theo từng tài khoản nằm dưới `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng công cụ tin nhắn có thể phân giải mục tiêu DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong phương án dự phòng kích hoạt ở giai đoạn trả lời.

    Chủ đề kênh được chèn làm ngữ cảnh **không đáng tin cậy**. Danh sách cho phép kiểm soát ai có thể kích hoạt agent, không phải là ranh giới biên tập ngữ cảnh bổ sung đầy đủ.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord có thể liên kết một luồng với một mục tiêu phiên để các tin nhắn tiếp theo trong luồng đó tiếp tục định tuyến đến cùng một phiên (bao gồm cả phiên subagent).

    Lệnh:

    - `/focus <target>` liên kết luồng hiện tại/mới với một mục tiêu subagent/phiên
    - `/unfocus` xóa liên kết luồng hiện tại
    - `/agents` hiển thị các lượt chạy đang hoạt động và trạng thái liên kết
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Ghi chú:

    - `session.threadBindings.*` đặt mặc định toàn cục.
    - `channels.discord.threadBindings.*` ghi đè hành vi Discord.
    - `spawnSubagentSessions` phải là true để tự động tạo/liên kết luồng cho `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` phải là true để tự động tạo/liên kết luồng cho ACP (`/acp spawn ... --thread ...` hoặc `sessions_spawn({ runtime: "acp", thread: true })`).
    - Nếu liên kết luồng bị tắt cho một tài khoản, `/focus` và các thao tác liên kết luồng liên quan sẽ không khả dụng.

    Xem [Sub-agents](/vi/tools/subagents), [ACP Agents](/vi/tools/acp-agents), và [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Đối với không gian làm việc ACP “luôn bật” ổn định, hãy cấu hình các liên kết ACP có kiểu ở cấp cao nhất nhắm đến các cuộc hội thoại Discord.

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

    - `/acp spawn codex --bind here` liên kết kênh hoặc luồng hiện tại tại chỗ và giữ các tin nhắn trong tương lai trên cùng một phiên ACP. Tin nhắn luồng kế thừa liên kết kênh cha.
    - Trong một kênh hoặc luồng đã liên kết, `/new` và `/reset` đặt lại cùng một phiên ACP tại chỗ. Liên kết luồng tạm thời có thể ghi đè phân giải mục tiêu khi đang hoạt động.
    - `spawnAcpSessions` chỉ bắt buộc khi OpenClaw cần tạo/liên kết một luồng con qua `--thread auto|here`.

    Xem [ACP Agents](/vi/tools/acp-agents) để biết chi tiết về hành vi liên kết.

  </Accordion>

  <Accordion title="Reaction notifications">
    Chế độ thông báo phản ứng theo từng guild:

    - `off`
    - `own` (mặc định)
    - `all`
    - `allowlist` (sử dụng `guilds.<id>.users`)

    Sự kiện phản ứng được chuyển thành sự kiện hệ thống và gắn vào phiên Discord đã định tuyến.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - phương án dự phòng emoji nhận dạng agent (`agents.list[].identity.emoji`, nếu không thì "👀")

    Ghi chú:

    - Discord chấp nhận emoji unicode hoặc tên emoji tùy chỉnh.
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
    Định tuyến lưu lượng WebSocket của Discord Gateway và các tra cứu REST khi khởi động (ID ứng dụng + phân giải danh sách cho phép) qua proxy HTTP(S) bằng `channels.discord.proxy`.

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
    - tên hiển thị của thành viên chỉ được khớp theo tên/slug khi `channels.discord.dangerouslyAllowNameMatching: true`
    - tra cứu sử dụng ID tin nhắn gốc và bị giới hạn theo cửa sổ thời gian
    - nếu tra cứu thất bại, tin nhắn được proxy được xử lý như tin nhắn bot và bị loại bỏ trừ khi `allowBots=true`

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

    Bản đồ loại hoạt động:

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

    Hiện diện tự động ánh xạ mức khả dụng của runtime sang trạng thái Discord: khỏe mạnh => online, suy giảm hoặc không xác định => idle, cạn kiệt hoặc không khả dụng => dnd. Ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord hỗ trợ xử lý phê duyệt dựa trên nút trong DM và có thể tùy chọn đăng lời nhắc phê duyệt trong kênh gốc.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; dự phòng về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt thực thi gốc khi `enabled` chưa được đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt, từ `execApprovals.approvers` hoặc từ `commands.ownerAllowFrom`. Discord không suy luận người phê duyệt thực thi từ `allowFrom` của kênh, `dm.allowFrom` cũ, hoặc `defaultTo` của tin nhắn trực tiếp. Đặt `enabled: false` để tắt Discord một cách rõ ràng với vai trò client phê duyệt gốc.

    Đối với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi lời nhắc phê duyệt và kết quả cuối cùng một cách riêng tư. Trước tiên, nó thử Discord DM khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không có, nó dự phòng về tuyến chủ sở hữu đầu tiên có sẵn từ `commands.ownerAllowFrom`, chẳng hạn như Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ người phê duyệt đã phân giải mới có thể dùng các nút; người dùng khác nhận thông báo từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật gửi qua kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw sẽ dự phòng sang gửi qua DM.

    Discord cũng hiển thị các nút phê duyệt dùng chung được các kênh chat khác sử dụng. Bộ điều hợp Discord gốc chủ yếu thêm định tuyến DM cho người phê duyệt và phát tán ra kênh.
    Khi các nút đó hiện diện, chúng là UX phê duyệt chính; OpenClaw
    chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết
    phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.
    Nếu runtime phê duyệt gốc của Discord không hoạt động, OpenClaw giữ
    lời nhắc `/approve <id> <decision>` xác định cục bộ ở trạng thái hiển thị. Nếu
    runtime đang hoạt động nhưng không thể gửi thẻ gốc tới bất kỳ mục tiêu nào,
    OpenClaw gửi thông báo dự phòng trong cùng chat kèm lệnh `/approve`
    chính xác từ phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng client Gateway dùng chung (ID `plugin:` phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Phê duyệt hết hạn sau 30 phút theo mặc định.

    Xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Công cụ và cổng hành động

Hành động tin nhắn Discord bao gồm nhắn tin, quản trị kênh, điều phối, hiện diện và hành động siêu dữ liệu.

Ví dụ lõi:

- nhắn tin: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- phản ứng: `react`, `reactions`, `emojiList`
- điều phối: `timeout`, `kick`, `ban`
- hiện diện: `setPresence`

Hành động `event-create` chấp nhận tham số `image` tùy chọn (URL hoặc đường dẫn tệp cục bộ) để đặt ảnh bìa sự kiện đã lên lịch.

Cổng hành động nằm dưới `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                           | Mặc định  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | bật       |
| roles                                                                                                                                                                    | tắt       |
| moderation                                                                                                                                                               | tắt       |
| presence                                                                                                                                                                 | tắt       |

## Giao diện người dùng Components v2

OpenClaw dùng Discord components v2 cho phê duyệt exec và dấu mốc xuyên ngữ cảnh. Các hành động tin nhắn Discord cũng có thể chấp nhận `components` cho giao diện người dùng tùy chỉnh (nâng cao; yêu cầu dựng payload thành phần qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn dùng bởi các vùng chứa thành phần Discord (hex).
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

Discord có hai bề mặt giọng nói riêng biệt: **kênh thoại** thời gian thực (hội thoại liên tục) và **tệp đính kèm tin nhắn thoại** (định dạng xem trước dạng sóng). Gateway hỗ trợ cả hai.

### Kênh thoại

Danh sách kiểm tra thiết lập:

1. Bật Message Content Intent trong Discord Developer Portal.
2. Bật Server Members Intent khi dùng allowlist vai trò/người dùng.
3. Mời bot với phạm vi `bot` và `applications.commands`.
4. Cấp Connect, Speak, Send Messages và Read Message History trong kênh thoại đích.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Dùng `/vc join|leave|status` để điều khiển phiên. Lệnh dùng agent mặc định của tài khoản và tuân theo cùng các quy tắc allowlist và chính sách nhóm như các lệnh Discord khác.

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
- `voice.model` chỉ ghi đè LLM dùng cho phản hồi kênh thoại Discord. Để trống để kế thừa mô hình agent được định tuyến.
- STT dùng `tools.media.audio`; `voice.model` không ảnh hưởng đến phiên âm.
- Các ghi đè `systemPrompt` theo kênh Discord áp dụng cho lượt bản ghi thoại của kênh thoại đó.
- Các lượt bản ghi thoại suy ra trạng thái chủ sở hữu từ `allowFrom` của Discord (hoặc `dm.allowFrom`); người nói không phải chủ sở hữu không thể truy cập công cụ chỉ dành cho chủ sở hữu (ví dụ `gateway` và `cron`).
- Giọng nói được bật theo mặc định; đặt `channels.discord.voice.enabled=false` để tắt runtime giọng nói và Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng việc đăng ký voice-state intent. Để trống để intent đi theo `voice.enabled`.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được chuyển tiếp tới tùy chọn tham gia của `@discordjs/voice`.
- Giá trị mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu không đặt.
- OpenClaw cũng theo dõi lỗi giải mã khi nhận và tự phục hồi bằng cách rời/tham gia lại kênh thoại sau nhiều lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu nhật ký nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và nhật ký. Dòng `@discordjs/voice` đi kèm bao gồm bản sửa padding upstream từ discord.js PR #11449, đã đóng discord.js issue #11419.

Pipeline kênh thoại:

- Bản ghi PCM của Discord được chuyển đổi thành tệp tạm WAV.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản ghi được gửi qua luồng vào và định tuyến Discord trong khi LLM phản hồi chạy với chính sách đầu ra giọng nói ẩn công cụ `tts` của agent và yêu cầu trả về văn bản, vì giọng nói Discord sở hữu bước phát lại TTS cuối cùng.
- `voice.model`, khi được đặt, chỉ ghi đè LLM phản hồi cho lượt kênh thoại này.
- `voice.tts` được hợp nhất trên `messages.tts`; âm thanh kết quả được phát trong kênh đã tham gia.

Thông tin xác thực được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, và xác thực TTS cho `messages.tts`/`voice.tts`.

### Tin nhắn thoại

Tin nhắn thoại Discord hiển thị bản xem trước dạng sóng và yêu cầu âm thanh OGG/Opus. OpenClaw tự động tạo dạng sóng, nhưng cần `ffmpeg` và `ffprobe` trên máy chủ Gateway để kiểm tra và chuyển đổi.

- Cung cấp **đường dẫn tệp cục bộ** (URL bị từ chối).
- Bỏ nội dung văn bản (Discord từ chối văn bản + tin nhắn thoại trong cùng payload).
- Chấp nhận mọi định dạng âm thanh; OpenClaw chuyển đổi sang OGG/Opus khi cần.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Đã dùng intent không được phép hoặc bot không thấy tin nhắn guild">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào phân giải người dùng/thành viên
    - khởi động lại Gateway sau khi thay đổi intent

  </Accordion>

  <Accordion title="Tin nhắn guild bị chặn ngoài dự kiến">

    - xác minh `groupPolicy`
    - xác minh allowlist guild trong `channels.discord.guilds`
    - nếu map `channels` của guild tồn tại, chỉ các kênh được liệt kê mới được phép
    - xác minh hành vi `requireMention` và mẫu mention

    Kiểm tra hữu ích:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false nhưng vẫn bị chặn">
    Nguyên nhân thường gặp:

    - `groupPolicy="allowlist"` mà không có allowlist guild/kênh khớp
    - `requireMention` được cấu hình sai vị trí (phải nằm dưới `channels.discord.guilds` hoặc mục kênh)
    - người gửi bị chặn bởi allowlist `users` của guild/kênh

  </Accordion>

  <Accordion title="Lượt Discord chạy lâu hoặc phản hồi trùng lặp">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Núm điều chỉnh hàng đợi Discord Gateway:

    - một tài khoản: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - mục này chỉ kiểm soát công việc listener của Discord Gateway, không kiểm soát vòng đời lượt agent

    Discord không áp dụng timeout do kênh sở hữu cho các lượt agent đang xếp hàng. Message listener bàn giao ngay lập tức, và các lần chạy Discord đã xếp hàng giữ thứ tự theo phiên cho đến khi vòng đời phiên/công cụ/runtime hoàn tất hoặc hủy công việc.

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
    OpenClaw lấy metadata `/gateway/bot` của Discord trước khi kết nối. Lỗi tạm thời sẽ fallback về URL Gateway mặc định của Discord và được giới hạn tốc độ trong nhật ký.

    Núm điều chỉnh timeout metadata:

    - một tài khoản: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env khi cấu hình chưa đặt: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - mặc định: `30000` (30 giây), tối đa: `120000`

  </Accordion>

  <Accordion title="Sai lệch kiểm tra quyền">
    Kiểm tra quyền `channels status --probe` chỉ hoạt động với ID kênh dạng số.

    Nếu bạn dùng khóa slug, khớp runtime vẫn có thể hoạt động, nhưng probe không thể xác minh đầy đủ quyền.

  </Accordion>

  <Accordion title="Sự cố DM và ghép đôi">

    - DM bị tắt: `channels.discord.dm.enabled=false`
    - chính sách DM bị tắt: `channels.discord.dmPolicy="disabled"` (cũ: `channels.discord.dm.policy`)
    - đang chờ phê duyệt ghép đôi ở chế độ `pairing`

  </Accordion>

  <Accordion title="Vòng lặp bot với bot">
    Theo mặc định, các tin nhắn do bot tạo bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng quy tắc mention và allowlist nghiêm ngặt để tránh hành vi vòng lặp.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn bot có mention bot.

  </Accordion>

  <Accordion title="Voice STT bị rơi với DecryptionFailed(...)">

    - giữ OpenClaw ở phiên bản hiện tại (`openclaw update`) để có logic phục hồi khi nhận giọng nói Discord
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu từ `channels.discord.voice.decryptionFailureTolerance=24` (mặc định upstream) và chỉ tinh chỉnh nếu cần
    - xem nhật ký để tìm:
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
- metadata Gateway: `gatewayInfoTimeoutMs`
- phản hồi/lịch sử: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- gửi: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (bí danh cũ: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/thử lại: `mediaMaxMb` (giới hạn tải lên Discord đi, mặc định `100MB`), `retry`
- hành động: `actions.*`
- hiện diện: `activity`, `status`, `activityType`, `activityUrl`
- giao diện người dùng: `ui.components.accentColor`
- tính năng: `threadBindings`, `bindings[]` cấp cao nhất (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là bí mật (`DISCORD_BOT_TOKEN` được ưu tiên trong môi trường được giám sát).
- Cấp quyền Discord theo nguyên tắc đặc quyền tối thiểu.
- Nếu trạng thái/triển khai lệnh đã cũ, hãy khởi động lại Gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Discord với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi trò chuyện nhóm và danh sách cho phép.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến tới các tác nhân.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Định tuyến đa tác nhân" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ guild và kênh tới các tác nhân.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc.
  </Card>
</CardGroup>
