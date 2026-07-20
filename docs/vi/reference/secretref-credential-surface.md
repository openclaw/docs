---
read_when:
    - Xác minh phạm vi bao phủ thông tin xác thực SecretRef
    - Kiểm tra xem thông tin xác thực có đủ điều kiện cho `secrets configure` hoặc `secrets apply` hay không
    - Xác minh lý do thông tin xác thực nằm ngoài phạm vi được hỗ trợ
summary: Bề mặt thông tin xác thực SecretRef được hỗ trợ và không được hỗ trợ chính thức
title: Bề mặt thông tin xác thực SecretRef
x-i18n:
    generated_at: "2026-07-20T04:43:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8409060dd08d8cdb9bde59bc1857da7e2c6273d10e148a3de35b23bd3cd3b1ab
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Trang này xác định bề mặt thông tin xác thực SecretRef chuẩn tắc: những trường thông tin xác thực nào chấp nhận `SecretRef` (tham chiếu dựa trên env/file/exec) thay vì giá trị bí mật thô.

Phạm vi:

- Trong phạm vi: chỉ những thông tin xác thực do người dùng cung cấp mà OpenClaw không tạo hoặc luân phiên.
- Ngoài phạm vi: thông tin xác thực do runtime tạo hoặc luân phiên, dữ liệu làm mới OAuth và các tạo tác dạng phiên.

Các danh sách bên dưới được tạo từ sổ đăng ký đích trong mã nguồn và được kiểm tra đối chiếu với `docs/reference/secretref-user-supplied-credentials-matrix.json` trong CI; không chỉnh sửa thủ công các mục.

## Thông tin xác thực được hỗ trợ

### Đích `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webFetch.apiKey`
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
- `plugins.entries.webhooks.config.routes.*.secret`
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
- `channels.clickclack.token`
- `channels.clickclack.accounts.*.token`
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

### Đích `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; không được hỗ trợ khi `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; không được hỗ trợ khi `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Ghi chú:

- Các đích trong kế hoạch hồ sơ xác thực yêu cầu `agentId`; các mục kế hoạch nhắm đến `profiles.*.key` / `profiles.*.token` và ghi các tham chiếu cùng cấp (`keyRef` / `tokenRef`). Các tham chiếu hồ sơ xác thực được bao gồm trong quá trình phân giải runtime và phạm vi kiểm tra.
- Trong `openclaw.json`, SecretRef phải sử dụng các đối tượng có cấu trúc như `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Các chuỗi dấu hiệu `secretref-env:<ENV_VAR>` cũ bị từ chối trên các đường dẫn thông tin xác thực SecretRef; chạy `openclaw doctor --fix` để di chuyển các dấu hiệu hợp lệ.
- Chốt chính sách OAuth: không thể kết hợp `auth.profiles.<id>.mode = "oauth"` với đầu vào SecretRef cho hồ sơ đó. Quá trình khởi động/tải lại và phân giải hồ sơ xác thực sẽ thất bại ngay khi chính sách này bị vi phạm.
- Đối với các nhà cung cấp mô hình do SecretRef quản lý, các mục `agents/*/agent/models.json` được tạo sẽ lưu các dấu hiệu không bí mật (không phải giá trị bí mật đã phân giải) cho các bề mặt `apiKey`/header. Việc lưu dấu hiệu lấy nguồn làm căn cứ có thẩm quyền: OpenClaw ghi dấu hiệu từ ảnh chụp nhanh cấu hình nguồn đang hoạt động (trước khi phân giải), không phải từ các giá trị bí mật runtime đã phân giải.
- Quá trình khởi động nguội Gateway có thể cô lập các lỗi phân giải có thể thử lại đối với các chủ sở hữu đã ánh xạ không phải Gateway. Các lớp đã ánh xạ hiện tại bao gồm nhà cung cấp mô hình và skills, nhà cung cấp phương tiện/TTS/cron, hồ sơ xác thực đủ điều kiện, bộ nhớ theo từng tác nhân, SSH sandbox, tài khoản kênh và các tuyến Plugin được khai báo trong manifest. Quá trình khởi động giữ các tham chiếu tường minh của từng chủ sở hữu bị lỗi trong ảnh chụp nhanh runtime, báo cáo chủ sở hữu qua trạng thái và doctor, đồng thời từ chối yêu cầu cho chủ sở hữu đó mà không thử thông tin xác thực có mức ưu tiên thấp hơn. Bước kiểm tra trước khi tải lại và ghi cấu hình sử dụng cùng chính sách nhận biết chủ sở hữu: các chủ sở hữu lành mạnh được làm mới; một chủ sở hữu đủ điều kiện bị lỗi chỉ giữ trạng thái cũ khi danh tính tham chiếu, định nghĩa nhà cung cấp và toàn bộ hợp đồng chủ sở hữu không bí mật của nó không thay đổi; lỗi mới hoặc đã thay đổi sẽ chuyển thành trạng thái nguội. Xác thực đầu vào Gateway, tham chiếu hoặc giá trị không hợp lệ về cấu trúc, chủ sở hữu đóng khi lỗi và các chủ sở hữu hiện chưa được ánh xạ vẫn áp dụng chế độ nghiêm ngặt.
- Đối với tìm kiếm web: trong chế độ nhà cung cấp tường minh (đã đặt `tools.web.search.provider`), chỉ khóa của nhà cung cấp được chọn là hoạt động. Trong chế độ tự động (chưa đặt `tools.web.search.provider`), chỉ khóa nhà cung cấp đầu tiên được phân giải theo thứ tự ưu tiên là hoạt động, còn các tham chiếu nhà cung cấp không được chọn được coi là không hoạt động cho đến khi được chọn. Thông tin xác thực nhà cung cấp sử dụng `plugins.entries.<plugin>.config.webSearch.*`.
- `identity: "user"` của Slack sử dụng `channels.slack.userToken` cùng với `channels.slack.appToken` cho Socket Mode hoặc `channels.slack.signingSecret` cho chế độ HTTP. Cặp tương tự cũng áp dụng trong `channels.slack.accounts.*`; danh tính này không yêu cầu token bot.

## Thông tin xác thực không được hỗ trợ

Các thông tin xác thực này thuộc các lớp được tạo, luân phiên, mang phiên hoặc tồn tại lâu dài theo OAuth, không phù hợp với cơ chế phân giải SecretRef bên ngoài chỉ đọc:

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
