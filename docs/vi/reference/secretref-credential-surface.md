---
read_when:
    - Xác minh phạm vi bao phủ thông tin xác thực SecretRef
    - Kiểm tra xem thông tin xác thực có đủ điều kiện cho `secrets configure` hoặc `secrets apply` hay không
    - Xác minh lý do thông tin xác thực nằm ngoài phạm vi được hỗ trợ
summary: Bề mặt thông tin xác thực SecretRef được hỗ trợ và không được hỗ trợ chính thức
title: Bề mặt thông tin xác thực SecretRef
x-i18n:
    generated_at: "2026-07-12T08:21:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Trang này xác định bề mặt thông tin xác thực SecretRef chuẩn tắc: những trường thông tin xác thực nào chấp nhận `SecretRef` (tham chiếu dựa trên env/file/exec) thay cho giá trị bí mật thô.

Phạm vi:

- Trong phạm vi: chỉ những thông tin xác thực do người dùng cung cấp mà OpenClaw không cấp phát hoặc xoay vòng.
- Ngoài phạm vi: thông tin xác thực được cấp phát hoặc xoay vòng trong thời gian chạy, dữ liệu làm mới OAuth và các thành phần tương tự phiên.

Các danh sách bên dưới được tạo từ sổ đăng ký đích nguồn và được kiểm tra đối chiếu với `docs/reference/secretref-user-supplied-credentials-matrix.json` trong CI; không chỉnh sửa thủ công các mục.

## Thông tin xác thực được hỗ trợ

### Các đích `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `talk.realtime.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google-meet.config.realtime.providers.*.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.parallel.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
- `tools.web.search.*.apiKey`
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
- `channels.slack.relay.authToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.relay.authToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.sms.authToken`
- `channels.sms.accounts.*.authToken`
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
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.qqbot.clientSecret`
- `channels.qqbot.accounts.*.clientSecret`
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
- `channels.googlechat.serviceAccount` thông qua `serviceAccountRef` cùng cấp (ngoại lệ tương thích)
- `channels.googlechat.accounts.*.serviceAccount` thông qua `serviceAccountRef` cùng cấp (ngoại lệ tương thích)

### Các đích `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; không được hỗ trợ khi `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; không được hỗ trợ khi `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Ghi chú:

- Các đích kế hoạch hồ sơ xác thực yêu cầu `agentId`; các mục kế hoạch nhắm đến `profiles.*.key` / `profiles.*.token` và ghi các tham chiếu cùng cấp (`keyRef` / `tokenRef`). Các tham chiếu hồ sơ xác thực được bao gồm trong quá trình phân giải thời gian chạy và phạm vi kiểm tra.
- Trong `openclaw.json`, SecretRef phải sử dụng các đối tượng có cấu trúc như `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Các chuỗi đánh dấu `secretref-env:<ENV_VAR>` kiểu cũ bị từ chối trên các đường dẫn thông tin xác thực SecretRef; chạy `openclaw doctor --fix` để di chuyển các dấu đánh hợp lệ.
- Cơ chế bảo vệ chính sách OAuth: không thể kết hợp `auth.profiles.<id>.mode = "oauth"` với đầu vào SecretRef cho hồ sơ đó. Quá trình khởi động/tải lại và phân giải hồ sơ xác thực sẽ dừng ngay khi chính sách này bị vi phạm.
- Đối với các nhà cung cấp mô hình do SecretRef quản lý, các mục `agents/*/agent/models.json` được tạo sẽ lưu các dấu đánh không chứa bí mật (không phải giá trị bí mật đã phân giải) cho các bề mặt `apiKey`/tiêu đề. Việc lưu dấu đánh lấy nguồn làm căn cứ chính thức: OpenClaw ghi các dấu đánh từ ảnh chụp nhanh cấu hình nguồn đang hoạt động (trước khi phân giải), không phải từ các giá trị bí mật thời gian chạy đã phân giải.
- Đối với tìm kiếm web: trong chế độ nhà cung cấp tường minh (đã đặt `tools.web.search.provider`), chỉ khóa của nhà cung cấp đã chọn là hoạt động. Trong chế độ tự động (chưa đặt `tools.web.search.provider`), chỉ khóa nhà cung cấp đầu tiên được phân giải theo thứ tự ưu tiên là hoạt động, còn các tham chiếu nhà cung cấp không được chọn được xem là không hoạt động cho đến khi được chọn. Các đường dẫn nhà cung cấp `tools.web.search.*` kiểu cũ vẫn được phân giải trong thời hạn tương thích, nhưng bề mặt SecretRef chuẩn tắc là `plugins.entries.<plugin>.config.webSearch.*`.

## Thông tin xác thực không được hỗ trợ

Các thông tin xác thực này thuộc những lớp được cấp phát, xoay vòng, mang dữ liệu phiên hoặc tồn tại lâu dài cho OAuth, không phù hợp với cơ chế phân giải SecretRef bên ngoài chỉ đọc:

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

## Liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [Ngữ nghĩa thông tin xác thực](/vi/auth-credential-semantics)
