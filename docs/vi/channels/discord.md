---
read_when:
    - Làm việc trên các tính năng của kênh Discord
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Discord
title: Discord
x-i18n:
    generated_at: "2026-04-30T09:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

Sẵn sàng cho DM và kênh guild qua Gateway Discord chính thức.

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

Bạn sẽ cần tạo một ứng dụng mới kèm bot, thêm bot vào máy chủ của bạn, và ghép nối bot với OpenClaw. Chúng tôi khuyên bạn nên thêm bot vào máy chủ riêng của mình. Nếu bạn chưa có, hãy [tạo một máy chủ trước](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (chọn **Tạo của riêng tôi > Cho tôi và bạn bè của tôi**).

<Steps>
  <Step title="Tạo ứng dụng Discord và bot">
    Truy cập [Discord Developer Portal](https://discord.com/developers/applications) và nhấp vào **Ứng dụng mới**. Đặt tên kiểu như "OpenClaw".

    Nhấp vào **Bot** trong thanh bên. Đặt **Tên người dùng** thành bất kỳ tên nào bạn gọi agent OpenClaw của mình.

  </Step>

  <Step title="Bật intent đặc quyền">
    Vẫn ở trang **Bot**, cuộn xuống **Intent Gateway đặc quyền** và bật:

    - **Intent nội dung tin nhắn** (bắt buộc)
    - **Intent thành viên máy chủ** (khuyến nghị; bắt buộc cho danh sách cho phép theo vai trò và khớp tên sang ID)
    - **Intent hiện diện** (tùy chọn; chỉ cần cho cập nhật hiện diện)

  </Step>

  <Step title="Sao chép token bot của bạn">
    Cuộn trở lại phía trên trang **Bot** và nhấp vào **Đặt lại token**.

    <Note>
    Bất chấp tên gọi, thao tác này tạo token đầu tiên của bạn — không có gì đang bị "đặt lại".
    </Note>

    Sao chép token và lưu lại ở đâu đó. Đây là **Token bot** của bạn và bạn sẽ cần dùng ngay sau đây.

  </Step>

  <Step title="Tạo URL mời và thêm bot vào máy chủ của bạn">
    Nhấp vào **OAuth2** trong thanh bên. Bạn sẽ tạo URL mời với quyền phù hợp để thêm bot vào máy chủ của mình.

    Cuộn xuống **Trình tạo URL OAuth2** và bật:

    - `bot`
    - `applications.commands`

    Một mục **Quyền bot** sẽ xuất hiện bên dưới. Bật ít nhất:

    **Quyền chung**
      - Xem kênh
    **Quyền văn bản**
      - Gửi tin nhắn
      - Đọc lịch sử tin nhắn
      - Nhúng liên kết
      - Đính kèm tệp
      - Thêm phản ứng (tùy chọn)

    Đây là bộ quyền cơ sở cho các kênh văn bản thông thường. Nếu bạn định đăng trong các luồng Discord, bao gồm quy trình kênh diễn đàn hoặc kênh media tạo hoặc tiếp tục một luồng, cũng hãy bật **Gửi tin nhắn trong luồng**.
    Sao chép URL được tạo ở phía dưới, dán vào trình duyệt, chọn máy chủ của bạn, rồi nhấp **Tiếp tục** để kết nối. Bây giờ bạn sẽ thấy bot của mình trong máy chủ Discord.

  </Step>

  <Step title="Bật Chế độ nhà phát triển và thu thập ID của bạn">
    Quay lại ứng dụng Discord, bạn cần bật Chế độ nhà phát triển để có thể sao chép ID nội bộ.

    1. Nhấp **Cài đặt người dùng** (biểu tượng bánh răng cạnh avatar của bạn) → **Nâng cao** → bật **Chế độ nhà phát triển**
    2. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn trong thanh bên → **Sao chép ID máy chủ**
    3. Nhấp chuột phải vào **avatar của chính bạn** → **Sao chép ID người dùng**

    Lưu **ID máy chủ** và **ID người dùng** cùng với Token bot của bạn — bạn sẽ gửi cả ba thông tin này cho OpenClaw ở bước tiếp theo.

  </Step>

  <Step title="Cho phép DM từ thành viên máy chủ">
    Để ghép nối hoạt động, Discord cần cho phép bot gửi DM cho bạn. Nhấp chuột phải vào **biểu tượng máy chủ** của bạn → **Cài đặt quyền riêng tư** → bật **Tin nhắn trực tiếp**.

    Điều này cho phép thành viên máy chủ (bao gồm cả bot) gửi DM cho bạn. Giữ tùy chọn này bật nếu bạn muốn dùng DM Discord với OpenClaw. Nếu bạn chỉ định dùng kênh guild, bạn có thể tắt DM sau khi ghép nối.

  </Step>

  <Step title="Thiết lập token bot của bạn một cách an toàn (không gửi trong chat)">
    Token bot Discord của bạn là bí mật (giống như mật khẩu). Thiết lập token này trên máy đang chạy OpenClaw trước khi nhắn tin cho agent của bạn.

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

    Nếu OpenClaw đã chạy dưới dạng dịch vụ nền, hãy khởi động lại qua ứng dụng OpenClaw trên Mac hoặc bằng cách dừng rồi khởi động lại tiến trình `openclaw gateway run`.
    Với các bản cài đặt dịch vụ được quản lý, hãy chạy `openclaw gateway install` từ shell có `DISCORD_BOT_TOKEN`, hoặc lưu biến trong `~/.openclaw/.env`, để dịch vụ có thể phân giải SecretRef môi trường sau khi khởi động lại.
    Nếu máy chủ của bạn bị Discord chặn hoặc giới hạn tần suất khi tra cứu ứng dụng lúc khởi động, hãy thiết lập ID ứng dụng/client Discord từ Developer Portal để quá trình khởi động có thể bỏ qua lệnh gọi REST đó. Dùng `channels.discord.applicationId` cho tài khoản mặc định, hoặc `channels.discord.accounts.<accountId>.applicationId` khi bạn chạy nhiều bot Discord.

  </Step>

  <Step title="Cấu hình OpenClaw và ghép nối">

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        Chat với agent OpenClaw của bạn trên bất kỳ kênh hiện có nào (ví dụ: Telegram) và nói cho agent biết. Nếu Discord là kênh đầu tiên của bạn, hãy dùng tab CLI / cấu hình thay thế.

        > "Tôi đã thiết lập token bot Discord trong cấu hình. Vui lòng hoàn tất thiết lập Discord với ID người dùng `<user_id>` và ID máy chủ `<server_id>`."
      </Tab>
      <Tab title="CLI / cấu hình">
        Nếu bạn thích cấu hình dựa trên tệp, hãy thiết lập:

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

        Fallback môi trường cho tài khoản mặc định:

```bash
DISCORD_BOT_TOKEN=...
```

        Với thiết lập bằng script hoặc từ xa, ghi cùng khối JSON5 bằng `openclaw config patch --file ./discord.patch.json5 --dry-run` rồi chạy lại không có `--dry-run`. Giá trị `token` dạng văn bản thuần được hỗ trợ. Giá trị SecretRef cũng được hỗ trợ cho `channels.discord.token` trên các provider env/file/exec. Xem [Quản lý bí mật](/vi/gateway/secrets).

        Với nhiều bot Discord, hãy giữ token bot và ID ứng dụng của từng bot trong tài khoản tương ứng. `channels.discord.applicationId` cấp cao nhất được các tài khoản kế thừa, vì vậy chỉ thiết lập ở đó khi mọi tài khoản đều nên dùng cùng một ID ứng dụng.

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
    Chờ đến khi gateway đang chạy, rồi gửi DM cho bot của bạn trong Discord. Bot sẽ phản hồi bằng mã ghép nối.

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

    Bây giờ bạn sẽ có thể chat với agent của mình trong Discord qua DM.

  </Step>
</Steps>

<Note>
Việc phân giải token nhận biết theo tài khoản. Giá trị token trong cấu hình thắng fallback môi trường. `DISCORD_BOT_TOKEN` chỉ được dùng cho tài khoản mặc định.
Nếu hai tài khoản Discord đã bật phân giải về cùng một token bot, OpenClaw chỉ khởi động một trình giám sát gateway cho token đó. Token từ cấu hình thắng fallback môi trường mặc định; nếu không, tài khoản đã bật đầu tiên thắng và tài khoản trùng lặp được báo là đã tắt.
Với các lệnh gọi outbound nâng cao (công cụ tin nhắn/hành động kênh), `token` rõ ràng theo từng lệnh gọi sẽ được dùng cho lệnh gọi đó. Điều này áp dụng cho các hành động gửi và đọc/thăm dò (ví dụ: read/search/fetch/thread/pins/permissions). Chính sách tài khoản/thiết lập thử lại vẫn lấy từ tài khoản được chọn trong ảnh chụp runtime đang hoạt động.
</Note>

## Khuyến nghị: Thiết lập không gian làm việc guild

Khi DM đã hoạt động, bạn có thể thiết lập máy chủ Discord của mình thành một không gian làm việc đầy đủ, nơi mỗi kênh có phiên agent riêng với ngữ cảnh riêng. Điều này được khuyến nghị cho các máy chủ riêng chỉ có bạn và bot của bạn.

<Steps>
  <Step title="Thêm máy chủ của bạn vào danh sách cho phép guild">
    Điều này cho phép agent của bạn phản hồi trong bất kỳ kênh nào trên máy chủ của bạn, không chỉ DM.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Thêm ID máy chủ Discord `<server_id>` của tôi vào danh sách cho phép guild"
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
    Theo mặc định, agent của bạn chỉ phản hồi trong kênh guild khi được @mention. Với máy chủ riêng, có thể bạn sẽ muốn agent phản hồi mọi tin nhắn.

    Trong kênh guild, các phản hồi cuối thông thường của trợ lý mặc định vẫn ở chế độ riêng tư. Đầu ra Discord hiển thị phải được gửi rõ ràng bằng công cụ `message`, để agent có thể mặc định quan sát âm thầm và chỉ đăng khi quyết định rằng phản hồi trong kênh là hữu ích.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Cho phép agent của tôi phản hồi trên máy chủ này mà không cần được @mention"
      </Tab>
      <Tab title="Cấu hình">
        Thiết lập `requireMention: false` trong cấu hình guild của bạn:

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

        Để khôi phục phản hồi cuối tự động kiểu cũ cho phòng nhóm/kênh, hãy thiết lập `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Lên kế hoạch cho bộ nhớ trong kênh guild">
    Theo mặc định, bộ nhớ dài hạn (MEMORY.md) chỉ tải trong phiên DM. Kênh guild không tự động tải MEMORY.md.

    <Tabs>
      <Tab title="Hỏi agent của bạn">
        > "Khi tôi hỏi trong các kênh Discord, hãy dùng memory_search hoặc memory_get nếu bạn cần ngữ cảnh dài hạn từ MEMORY.md."
      </Tab>
      <Tab title="Thủ công">
        Nếu bạn cần ngữ cảnh dùng chung trong mọi kênh, hãy đặt các hướng dẫn ổn định trong `AGENTS.md` hoặc `USER.md` (chúng được chèn vào mọi phiên). Giữ ghi chú dài hạn trong `MEMORY.md` và truy cập khi cần bằng công cụ bộ nhớ.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Bây giờ hãy tạo một vài kênh trên máy chủ Discord của bạn và bắt đầu chat. Agent của bạn có thể thấy tên kênh, và mỗi kênh có phiên cô lập riêng — vì vậy bạn có thể thiết lập `#coding`, `#home`, `#research`, hoặc bất kỳ thứ gì phù hợp với quy trình làm việc của bạn.

## Mô hình runtime

- Gateway sở hữu kết nối Discord.
- Định tuyến trả lời có tính xác định: các câu trả lời đến từ Discord sẽ quay lại Discord.
- Siêu dữ liệu guild/kênh Discord được thêm vào prompt của mô hình dưới dạng ngữ cảnh không đáng tin cậy, không phải dưới dạng tiền tố trả lời hiển thị cho người dùng. Nếu một mô hình sao chép phong bì đó trở lại, OpenClaw sẽ loại bỏ siêu dữ liệu đã sao chép khỏi các câu trả lời đi và khỏi ngữ cảnh phát lại trong tương lai.
- Theo mặc định (`session.dmScope=main`), các cuộc trò chuyện trực tiếp dùng chung phiên chính của agent (`agent:main:main`).
- Các kênh guild là các khóa phiên tách biệt (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM bị bỏ qua theo mặc định (`channels.discord.dm.groupEnabled=false`).
- Lệnh slash gốc chạy trong các phiên lệnh tách biệt (`agent:<agentId>:discord:slash:<userId>`), trong khi vẫn mang `CommandTargetSessionKey` đến phiên hội thoại đã định tuyến.
- Việc gửi thông báo cron/heartbeat chỉ có văn bản đến Discord dùng câu trả lời cuối cùng hiển thị cho assistant một lần. Các tải phương tiện và thành phần có cấu trúc vẫn là nhiều tin nhắn khi agent phát ra nhiều tải có thể gửi.

## Kênh diễn đàn

Kênh diễn đàn và kênh phương tiện Discord chỉ chấp nhận bài đăng dạng luồng. OpenClaw hỗ trợ hai cách để tạo chúng:

- Gửi tin nhắn đến diễn đàn cha (`channel:<forumId>`) để tự động tạo một luồng. Tiêu đề luồng dùng dòng không rỗng đầu tiên trong tin nhắn của bạn.
- Dùng `openclaw message thread create` để tạo trực tiếp một luồng. Không truyền `--message-id` cho kênh diễn đàn.

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

OpenClaw hỗ trợ vùng chứa thành phần Discord v2 cho tin nhắn của agent. Dùng công cụ tin nhắn với tải `components`. Kết quả tương tác được định tuyến lại cho agent như tin nhắn đến bình thường và tuân theo các thiết lập Discord `replyToMode` hiện có.

Các khối được hỗ trợ:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Hàng hành động cho phép tối đa 5 nút hoặc một menu chọn duy nhất
- Loại lựa chọn: `string`, `user`, `role`, `mentionable`, `channel`

Theo mặc định, các thành phần chỉ dùng một lần. Đặt `components.reusable=true` để cho phép nút, lựa chọn và biểu mẫu được dùng nhiều lần cho đến khi hết hạn.

Để giới hạn ai có thể nhấp vào nút, đặt `allowedUsers` trên nút đó (ID người dùng Discord, thẻ, hoặc `*`). Khi được cấu hình, người dùng không khớp sẽ nhận một thông báo từ chối tạm thời.

Các lệnh slash `/model` và `/models` mở một bộ chọn mô hình tương tác với các menu thả xuống nhà cung cấp, mô hình và runtime tương thích, cùng với bước Submit. `/models add` đã bị ngừng dùng và hiện trả về thông báo ngừng dùng thay vì đăng ký mô hình từ cuộc trò chuyện. Câu trả lời của bộ chọn là tạm thời và chỉ người dùng gọi lệnh mới có thể dùng.

Tệp đính kèm:

- Khối `file` phải trỏ đến tham chiếu đính kèm (`attachment://<filename>`)
- Cung cấp tệp đính kèm qua `media`/`path`/`filePath` (một tệp); dùng `media-gallery` cho nhiều tệp
- Dùng `filename` để ghi đè tên tải lên khi tên đó cần khớp với tham chiếu đính kèm

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

    Nếu chính sách DM không mở, người dùng không xác định sẽ bị chặn (hoặc được nhắc ghép nối trong chế độ `pairing`).

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.discord.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Với một tài khoản, `allowFrom` được ưu tiên hơn `dm.allowFrom` cũ.
    - Tài khoản được đặt tên kế thừa `channels.discord.allowFrom` khi `allowFrom` riêng của chúng và `dm.allowFrom` cũ chưa được đặt.
    - Tài khoản được đặt tên không kế thừa `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` và `channels.discord.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Định dạng đích DM để gửi:

    - `user:<id>`
    - đề cập `<@id>`

    ID số trần thường được phân giải thành ID kênh khi mặc định kênh đang hoạt động, nhưng các ID được liệt kê trong DM `allowFrom` hiệu dụng của tài khoản được xử lý là đích DM người dùng để tương thích.

  </Tab>

  <Tab title="Guild policy">
    Việc xử lý guild được kiểm soát bởi `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Đường cơ sở bảo mật khi `channels.discord` tồn tại là `allowlist`.

    Hành vi `allowlist`:

    - guild phải khớp với `channels.discord.guilds` (ưu tiên `id`, chấp nhận slug)
    - danh sách cho phép người gửi tùy chọn: `users` (khuyến nghị ID ổn định) và `roles` (chỉ ID vai trò); nếu một trong hai được cấu hình, người gửi được cho phép khi khớp với `users` HOẶC `roles`
    - đối sánh trực tiếp theo tên/thẻ bị tắt theo mặc định; chỉ bật `channels.discord.dangerouslyAllowNameMatching: true` như chế độ tương thích khẩn cấp
    - tên/thẻ được hỗ trợ cho `users`, nhưng ID an toàn hơn; `openclaw security audit` cảnh báo khi dùng mục tên/thẻ
    - nếu một guild có cấu hình `channels`, các kênh không được liệt kê sẽ bị từ chối
    - nếu một guild không có khối `channels`, tất cả kênh trong guild nằm trong danh sách cho phép đó đều được cho phép

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

    Nếu bạn chỉ đặt `DISCORD_BOT_TOKEN` và không tạo khối `channels.discord`, fallback runtime là `groupPolicy="allowlist"` (với cảnh báo trong nhật ký), ngay cả khi `channels.defaults.groupPolicy` là `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Tin nhắn guild được chặn theo cơ chế yêu cầu đề cập theo mặc định.

    Phát hiện đề cập bao gồm:

    - đề cập bot rõ ràng
    - mẫu đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - hành vi trả lời ngầm cho bot trong các trường hợp được hỗ trợ

    `requireMention` được cấu hình cho từng guild/kênh (`channels.discord.guilds...`).
    `ignoreOtherMentions` tùy chọn bỏ qua tin nhắn đề cập người dùng/vai trò khác nhưng không đề cập bot (ngoại trừ @everyone/@here).

    Group DM:

    - mặc định: bị bỏ qua (`dm.groupEnabled=false`)
    - danh sách cho phép tùy chọn qua `dm.groupChannels` (ID kênh hoặc slug)

  </Tab>
</Tabs>

### Định tuyến agent dựa trên vai trò

Dùng `bindings[].match.roles` để định tuyến thành viên guild Discord đến các agent khác nhau theo ID vai trò. Binding dựa trên vai trò chỉ chấp nhận ID vai trò và được đánh giá sau binding peer hoặc parent-peer và trước binding chỉ guild. Nếu một binding cũng đặt các trường đối sánh khác (ví dụ `peer` + `guildId` + `roles`), tất cả trường đã cấu hình phải khớp.

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
- `commands.native=false` xóa rõ ràng các lệnh gốc Discord đã đăng ký trước đó.
- Xác thực lệnh gốc dùng cùng danh sách cho phép/chính sách Discord như xử lý tin nhắn bình thường.
- Lệnh vẫn có thể hiển thị trong giao diện Discord cho người dùng không được ủy quyền; việc thực thi vẫn áp dụng xác thực OpenClaw và trả về "not authorized".

Xem [Lệnh slash](/vi/tools/slash-commands) để biết danh mục lệnh và hành vi.

Thiết lập lệnh slash mặc định:

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

    Lưu ý: `off` tắt phân luồng trả lời ngầm. Các thẻ `[[reply_to_*]]` rõ ràng vẫn được tôn trọng.
    `first` luôn gắn tham chiếu trả lời gốc ngầm vào tin nhắn Discord đi đầu tiên của lượt.
    `batched` chỉ gắn tham chiếu trả lời gốc ngầm của Discord khi lượt đến là một lô đã debounce gồm nhiều tin nhắn. Điều này hữu ích khi bạn muốn trả lời gốc chủ yếu cho các cuộc trò chuyện bùng phát dễ mơ hồ, không phải mọi lượt một tin nhắn.

    ID tin nhắn được đưa vào ngữ cảnh/lịch sử để agent có thể nhắm tới các tin nhắn cụ thể.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw có thể phát trực tuyến bản nháp trả lời bằng cách gửi một tin nhắn tạm thời và chỉnh sửa tin nhắn đó khi văn bản đến. `channels.discord.streaming` nhận `off` (mặc định) | `partial` | `block` | `progress`. `progress` ánh xạ sang `partial` trên Discord; `streamMode` là bí danh cũ và được tự động di chuyển.

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
    - Kết quả cuối có phương tiện, lỗi và trả lời rõ ràng sẽ hủy các chỉnh sửa xem trước đang chờ.
    - `streaming.preview.toolProgress` (mặc định `true`) kiểm soát liệu cập nhật công cụ/tiến trình có dùng lại tin nhắn xem trước hay không.

    Phát trực tuyến xem trước chỉ hỗ trợ văn bản; câu trả lời phương tiện fallback về cách gửi bình thường. Khi phát trực tuyến `block` được bật rõ ràng, OpenClaw bỏ qua luồng xem trước để tránh phát trực tuyến hai lần.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Ngữ cảnh lịch sử guild:

    - `channels.discord.historyLimit` mặc định `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` tắt

    Điều khiển lịch sử DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Hành vi luồng:

    - Các luồng Discord được định tuyến như phiên kênh và kế thừa cấu hình kênh cha trừ khi bị ghi đè.
    - Phiên luồng kế thừa lựa chọn `/model` cấp phiên của kênh cha làm phương án dự phòng chỉ dành cho mô hình; các lựa chọn `/model` cục bộ của luồng vẫn được ưu tiên và lịch sử bản ghi của kênh cha không được sao chép trừ khi tính năng kế thừa bản ghi được bật.
    - `channels.discord.thread.inheritParent` (mặc định `false`) cho phép các luồng tự động mới khởi tạo dữ liệu từ bản ghi của kênh cha. Ghi đè theo từng tài khoản nằm trong `channels.discord.accounts.<id>.thread.inheritParent`.
    - Phản ứng của công cụ tin nhắn có thể phân giải đích DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` được giữ nguyên trong dự phòng kích hoạt ở giai đoạn trả lời.

    Chủ đề kênh được chèn dưới dạng ngữ cảnh **không đáng tin cậy**. Danh sách cho phép kiểm soát ai có thể kích hoạt agent, không phải là ranh giới biên tập ngữ cảnh bổ sung đầy đủ.

  </Accordion>

  <Accordion title="Phiên gắn với luồng cho subagent">
    Discord có thể gắn một luồng với một đích phiên để các tin nhắn tiếp theo trong luồng đó tiếp tục định tuyến đến cùng một phiên (bao gồm cả phiên subagent).

    Lệnh:

    - `/focus <target>` gắn luồng hiện tại/mới với một đích subagent/phiên
    - `/unfocus` xóa liên kết luồng hiện tại
    - `/agents` hiển thị các lần chạy đang hoạt động và trạng thái liên kết
    - `/session idle <duration|off>` kiểm tra/cập nhật tự động bỏ tập trung khi không hoạt động cho các liên kết đã tập trung
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
    - `spawnSubagentSessions` phải là true để tự động tạo/gắn luồng cho `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` phải là true để tự động tạo/gắn luồng cho ACP (`/acp spawn ... --thread ...` hoặc `sessions_spawn({ runtime: "acp", thread: true })`).
    - Nếu liên kết luồng bị tắt cho một tài khoản, `/focus` và các thao tác liên kết luồng liên quan sẽ không khả dụng.

    Xem [Sub-agent](/vi/tools/subagents), [Agent ACP](/vi/tools/acp-agents), và [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liên kết kênh ACP bền vững">
    Đối với các không gian làm việc ACP ổn định "luôn bật", hãy cấu hình các liên kết ACP có kiểu ở cấp cao nhất nhắm đến các cuộc trò chuyện Discord.

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
    - `spawnAcpSessions` chỉ bắt buộc khi OpenClaw cần tạo/gắn một luồng con qua `--thread auto|here`.

    Xem [Agent ACP](/vi/tools/acp-agents) để biết chi tiết về hành vi liên kết.

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
    `ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

    Thứ tự phân giải:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - phương án dự phòng emoji danh tính agent (`agents.list[].identity.emoji`, nếu không thì "👀")

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
    Định tuyến lưu lượng WebSocket của Gateway Discord và các tra cứu REST lúc khởi động (ID ứng dụng + phân giải danh sách cho phép) qua proxy HTTP(S) bằng `channels.discord.proxy`.

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
    - tra cứu sử dụng ID tin nhắn gốc và bị ràng buộc bởi cửa sổ thời gian
    - nếu tra cứu thất bại, tin nhắn được proxy được xem là tin nhắn bot và bị loại bỏ trừ khi `allowBots=true`

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

    Ví dụ phát trực tuyến:

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
    - 1: Đang phát trực tuyến (yêu cầu `activityUrl`)
    - 2: Đang nghe
    - 3: Đang xem
    - 4: Tùy chỉnh (sử dụng văn bản hoạt động làm trạng thái; emoji là tùy chọn)
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

    Hiện diện tự động ánh xạ khả dụng runtime sang trạng thái Discord: khỏe mạnh => trực tuyến, suy giảm hoặc không xác định => rảnh, cạn kiệt hoặc không khả dụng => dnd. Ghi đè văn bản tùy chọn:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (hỗ trợ placeholder `{reason}`)

  </Accordion>

  <Accordion title="Phê duyệt trong Discord">
    Discord hỗ trợ xử lý phê duyệt dựa trên nút trong DM và tùy chọn đăng lời nhắc phê duyệt trong kênh gốc.

    Đường dẫn cấu hình:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (tùy chọn; dự phòng về `commands.ownerAllowFrom` khi có thể)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord tự động bật phê duyệt exec gốc khi `enabled` chưa đặt hoặc là `"auto"` và có thể phân giải ít nhất một người phê duyệt, từ `execApprovals.approvers` hoặc từ `commands.ownerAllowFrom`. Discord không suy ra người phê duyệt exec từ `allowFrom` của kênh, `dm.allowFrom` cũ, hoặc `defaultTo` của tin nhắn trực tiếp. Đặt `enabled: false` để tắt rõ ràng Discord với vai trò client phê duyệt gốc.

    Đối với các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory`, OpenClaw gửi lời nhắc phê duyệt và kết quả cuối cùng riêng tư. Trước tiên nó thử DM Discord khi chủ sở hữu gọi lệnh có tuyến chủ sở hữu Discord; nếu không có, nó dự phòng về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, chẳng hạn Telegram.

    Khi `target` là `channel` hoặc `both`, lời nhắc phê duyệt hiển thị trong kênh. Chỉ những người phê duyệt đã phân giải mới có thể dùng nút; người dùng khác nhận thông báo từ chối tạm thời. Lời nhắc phê duyệt bao gồm văn bản lệnh, vì vậy chỉ bật gửi tới kênh trong các kênh đáng tin cậy. Nếu không thể suy ra ID kênh từ khóa phiên, OpenClaw dự phòng sang gửi qua DM.

    Discord cũng kết xuất các nút phê duyệt dùng chung được các kênh chat khác sử dụng. Adapter Discord gốc chủ yếu thêm định tuyến DM cho người phê duyệt và phân phối tới kênh.
    Khi các nút đó hiện diện, chúng là UX phê duyệt chính; OpenClaw
    chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết
    phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là đường duy nhất.
    Nếu runtime phê duyệt gốc của Discord không hoạt động, OpenClaw giữ
    lời nhắc `/approve <id> <decision>` tất định cục bộ hiển thị. Nếu
    runtime đang hoạt động nhưng thẻ gốc không thể được gửi đến bất kỳ đích nào,
    OpenClaw gửi thông báo dự phòng trong cùng cuộc chat với lệnh `/approve`
    chính xác từ phê duyệt đang chờ.

    Xác thực Gateway và phân giải phê duyệt tuân theo hợp đồng client Gateway dùng chung (ID `plugin:` phân giải qua `plugin.approval.resolve`; các ID khác qua `exec.approval.resolve`). Phê duyệt hết hạn sau 30 phút theo mặc định.

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

Hành động `event-create` chấp nhận tham số `image` tùy chọn (URL hoặc đường dẫn tệp cục bộ) để đặt ảnh bìa sự kiện đã lên lịch.

Cổng hành động nằm trong `channels.discord.actions.*`.

Hành vi cổng mặc định:

| Nhóm hành động                                                                                                                                                          | Mặc định |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | đã bật   |
| roles                                                                                                                                                                    | đã tắt   |
| moderation                                                                                                                                                               | đã tắt   |
| presence                                                                                                                                                                 | đã tắt   |

## Giao diện người dùng thành phần v2

OpenClaw dùng các thành phần v2 của Discord cho phê duyệt thực thi và dấu mốc xuyên ngữ cảnh. Hành động tin nhắn Discord cũng có thể chấp nhận `components` cho giao diện người dùng tùy chỉnh (nâng cao; yêu cầu tạo payload thành phần qua công cụ discord), trong khi `embeds` cũ vẫn khả dụng nhưng không được khuyến nghị.

- `channels.discord.ui.components.accentColor` đặt màu nhấn dùng bởi các vùng chứa thành phần Discord (hex).
- Đặt theo từng tài khoản bằng `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` bị bỏ qua khi có thành phần v2.

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
2. Bật Server Members Intent khi dùng danh sách cho phép vai trò/người dùng.
3. Mời bot với phạm vi `bot` và `applications.commands`.
4. Cấp quyền Connect, Speak, Send Messages và Read Message History trong kênh thoại đích.
5. Bật lệnh gốc (`commands.native` hoặc `channels.discord.commands.native`).
6. Cấu hình `channels.discord.voice`.

Dùng `/vc join|leave|status` để điều khiển phiên. Lệnh dùng tác tử mặc định của tài khoản và tuân theo cùng các quy tắc danh sách cho phép và chính sách nhóm như các lệnh Discord khác.

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
- `voice.model` chỉ ghi đè LLM dùng cho phản hồi kênh thoại Discord. Để trống để kế thừa mô hình tác tử đã định tuyến.
- STT dùng `tools.media.audio`; `voice.model` không ảnh hưởng đến phiên âm.
- Các lượt bản chép giọng nói suy ra trạng thái chủ sở hữu từ `allowFrom` của Discord (hoặc `dm.allowFrom`); người nói không phải chủ sở hữu không thể truy cập công cụ chỉ dành cho chủ sở hữu (ví dụ `gateway` và `cron`).
- Giọng nói được bật mặc định; đặt `channels.discord.voice.enabled=false` để tắt runtime giọng nói và intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` có thể ghi đè rõ ràng đăng ký intent trạng thái giọng nói. Để trống để intent đi theo `voice.enabled`.
- `voice.daveEncryption` và `voice.decryptionFailureTolerance` được truyền qua các tùy chọn tham gia của `@discordjs/voice`.
- Mặc định của `@discordjs/voice` là `daveEncryption=true` và `decryptionFailureTolerance=24` nếu chưa đặt.
- OpenClaw cũng theo dõi lỗi giải mã khi nhận và tự động khôi phục bằng cách rời/tham gia lại kênh thoại sau các lỗi lặp lại trong một khoảng thời gian ngắn.
- Nếu nhật ký nhận liên tục hiển thị `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` sau khi cập nhật, hãy thu thập báo cáo phụ thuộc và nhật ký. Dòng `@discordjs/voice` đi kèm bao gồm bản sửa padding thượng nguồn từ PR discord.js #11449, đã đóng issue discord.js #11419.

Pipeline kênh thoại:

- Thu PCM từ Discord được chuyển đổi thành tệp tạm WAV.
- `tools.media.audio` xử lý STT, ví dụ `openai/gpt-4o-mini-transcribe`.
- Bản chép được gửi qua luồng nhận và định tuyến Discord bình thường.
- `voice.model`, khi được đặt, chỉ ghi đè LLM phản hồi cho lượt kênh thoại này.
- `voice.tts` được hợp nhất đè lên `messages.tts`; âm thanh kết quả được phát trong kênh đã tham gia.

Thông tin xác thực được phân giải theo từng thành phần: xác thực tuyến LLM cho `voice.model`, xác thực STT cho `tools.media.audio`, và xác thực TTS cho `messages.tts`/`voice.tts`.

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
  <Accordion title="Đã dùng intent không được phép hoặc bot không thấy tin nhắn guild">

    - bật Message Content Intent
    - bật Server Members Intent khi bạn phụ thuộc vào phân giải người dùng/thành viên
    - khởi động lại Gateway sau khi thay đổi intent

  </Accordion>

  <Accordion title="Tin nhắn guild bị chặn ngoài dự kiến">

    - xác minh `groupPolicy`
    - xác minh danh sách cho phép guild dưới `channels.discord.guilds`
    - nếu có ánh xạ `channels` của guild, chỉ các kênh được liệt kê mới được cho phép
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

    - `groupPolicy="allowlist"` mà không có danh sách cho phép guild/kênh khớp
    - `requireMention` được cấu hình sai vị trí (phải nằm dưới `channels.discord.guilds` hoặc mục nhập kênh)
    - người gửi bị chặn bởi danh sách cho phép `users` của guild/kênh

  </Accordion>

  <Accordion title="Lượt Discord chạy lâu hoặc phản hồi trùng lặp">

    Nhật ký điển hình:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Núm điều chỉnh hàng đợi Gateway Discord:

    - tài khoản đơn: `channels.discord.eventQueue.listenerTimeout`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - tùy chọn này chỉ kiểm soát công việc listener Gateway Discord, không phải thời lượng lượt tác tử

    Discord không áp dụng thời gian chờ do kênh sở hữu cho các lượt tác tử được xếp hàng. Listener tin nhắn bàn giao ngay lập tức, và các lần chạy Discord được xếp hàng giữ nguyên thứ tự theo phiên cho đến khi vòng đời phiên/công cụ/runtime hoàn tất hoặc hủy bỏ công việc.

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

  <Accordion title="Cảnh báo hết thời gian tra cứu metadata Gateway">
    OpenClaw lấy metadata `/gateway/bot` của Discord trước khi kết nối. Lỗi thoáng qua sẽ fallback về URL Gateway mặc định của Discord và bị giới hạn tần suất trong nhật ký.

    Núm điều chỉnh thời gian chờ metadata:

    - tài khoản đơn: `channels.discord.gatewayInfoTimeoutMs`
    - nhiều tài khoản: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback khi cấu hình chưa đặt: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
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
    Theo mặc định, tin nhắn do bot tạo sẽ bị bỏ qua.

    Nếu bạn đặt `channels.discord.allowBots=true`, hãy dùng quy tắc nhắc đến và danh sách cho phép nghiêm ngặt để tránh hành vi vòng lặp.
    Ưu tiên `channels.discord.allowBots="mentions"` để chỉ chấp nhận tin nhắn bot có nhắc đến bot.

  </Accordion>

  <Accordion title="STT giọng nói bị rớt với DecryptionFailed(...)">

    - giữ OpenClaw hiện hành (`openclaw update`) để có logic khôi phục nhận giọng nói Discord
    - xác nhận `channels.discord.voice.daveEncryption=true` (mặc định)
    - bắt đầu từ `channels.discord.voice.decryptionFailureTolerance=24` (mặc định thượng nguồn) và chỉ tinh chỉnh nếu cần
    - theo dõi nhật ký cho:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - nếu lỗi tiếp tục sau khi tự động tham gia lại, thu thập nhật ký và so sánh với lịch sử nhận DAVE thượng nguồn trong [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) và [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- phân phối: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (bí danh cũ: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/thử lại: `mediaMaxMb` (giới hạn tải lên Discord đi, mặc định `100MB`), `retry`
- hành động: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- giao diện người dùng: `ui.components.accentColor`
- tính năng: `threadBindings`, cấp cao nhất `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## An toàn và vận hành

- Xem token bot là bí mật (`DISCORD_BOT_TOKEN` được ưu tiên trong môi trường có giám sát).
- Cấp quyền Discord theo nguyên tắc đặc quyền tối thiểu.
- Nếu triển khai/trạng thái lệnh bị cũ, hãy khởi động lại Gateway và kiểm tra lại bằng `openclaw channels status --probe`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Discord với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Trò chuyện nhóm và hành vi danh sách cho phép.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn gửi đến tới các tác tử.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và tăng cường bảo mật.
  </Card>
  <Card title="Định tuyến đa tác tử" icon="sitemap" href="/vi/concepts/multi-agent">
    Ánh xạ máy chủ và kênh tới các tác tử.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc.
  </Card>
</CardGroup>
