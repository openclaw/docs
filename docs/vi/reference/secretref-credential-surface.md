---
read_when:
    - Xác minh phạm vi bao phủ thông tin xác thực SecretRef
    - Kiểm tra xem thông tin xác thực có đủ điều kiện cho `secrets configure` hoặc `secrets apply` hay không
    - Đang xác minh lý do thông tin xác thực nằm ngoài phạm vi được hỗ trợ
summary: Phạm vi thông tin xác thực SecretRef chuẩn được hỗ trợ và không được hỗ trợ
title: Bề mặt thông tin xác thực SecretRef
x-i18n:
    generated_at: "2026-05-01T10:52:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41111ac82142c906005e0f585c86f2ff0b454afdaec07343c295e6b83571718e
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Trang này định nghĩa bề mặt thông tin xác thực SecretRef chuẩn tắc.

Ý định phạm vi:

- Trong phạm vi: chỉ những thông tin xác thực do người dùng cung cấp mà OpenClaw không phát hành hoặc xoay vòng.
- Ngoài phạm vi: thông tin xác thực được phát hành tại runtime hoặc xoay vòng, vật liệu làm mới OAuth và các tạo tác giống phiên.

## Thông tin xác thực được hỗ trợ

### Mục tiêu `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].tts.providers.*.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` thông qua trường cùng cấp `serviceAccountRef` (ngoại lệ tương thích)
- `channels.googlechat.accounts.*.serviceAccount` thông qua trường cùng cấp `serviceAccountRef` (ngoại lệ tương thích)

### Mục tiêu `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; không được hỗ trợ khi `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; không được hỗ trợ khi `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Ghi chú:

- Mục tiêu kế hoạch hồ sơ xác thực yêu cầu `agentId`.
- Các mục kế hoạch nhắm tới `profiles.*.key` / `profiles.*.token` và ghi các ref cùng cấp (`keyRef` / `tokenRef`).
- Ref hồ sơ xác thực được đưa vào phạm vi phân giải runtime và kiểm tra audit.
- Trong `openclaw.json`, SecretRef phải dùng các đối tượng có cấu trúc như `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Chuỗi đánh dấu cũ `secretref-env:<ENV_VAR>` bị từ chối trên các đường dẫn thông tin xác thực SecretRef; chạy `openclaw doctor --fix` để di chuyển các marker hợp lệ.
- Biện pháp bảo vệ chính sách OAuth: `auth.profiles.<id>.mode = "oauth"` không thể kết hợp với đầu vào SecretRef cho hồ sơ đó. Khởi động/tải lại và phân giải hồ sơ xác thực sẽ lỗi nhanh khi chính sách này bị vi phạm.
- Đối với các nhà cung cấp mô hình do SecretRef quản lý, các mục `agents/*/agent/models.json` được tạo sẽ lưu marker không phải bí mật (không phải giá trị bí mật đã phân giải) cho các bề mặt `apiKey`/header.
- Việc lưu marker lấy nguồn làm chuẩn: OpenClaw ghi marker từ snapshot cấu hình nguồn đang hoạt động (trước phân giải), không phải từ các giá trị bí mật runtime đã phân giải.
- Đối với tìm kiếm web:
  - Ở chế độ nhà cung cấp tường minh (`tools.web.search.provider` được đặt), chỉ khóa của nhà cung cấp đã chọn là hoạt động.
  - Ở chế độ tự động (`tools.web.search.provider` không được đặt), chỉ khóa nhà cung cấp đầu tiên phân giải theo thứ tự ưu tiên là hoạt động.
  - Ở chế độ tự động, ref của các nhà cung cấp không được chọn được xem là không hoạt động cho đến khi được chọn.
  - Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn phân giải trong giai đoạn tương thích, nhưng bề mặt SecretRef chuẩn tắc là `plugins.entries.<plugin>.config.webSearch.*`.

## Thông tin xác thực không được hỗ trợ

Thông tin xác thực ngoài phạm vi bao gồm:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

Lý do:

- Những thông tin xác thực này thuộc các lớp được phát hành, xoay vòng, mang phiên hoặc bền vững OAuth, không phù hợp với phân giải SecretRef bên ngoài chỉ đọc.

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Ngữ nghĩa thông tin xác thực xác thực](/vi/auth-credential-semantics)
