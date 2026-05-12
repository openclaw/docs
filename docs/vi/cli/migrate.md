---
read_when:
    - Bạn muốn chuyển đổi từ Hermes hoặc một hệ thống tác tử khác sang OpenClaw
    - Bạn đang thêm một trình cung cấp di trú do Plugin sở hữu
summary: Tham chiếu CLI cho `openclaw migrate` (nhập trạng thái từ một hệ thống tác tử khác)
title: Di chuyển
x-i18n:
    generated_at: "2026-05-12T23:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ một hệ thống tác tử khác thông qua một nhà cung cấp di chuyển do plugin sở hữu. Các nhà cung cấp đi kèm bao phủ trạng thái Codex CLI, [Claude](/vi/install/migrating-claude) và [Hermes](/vi/install/migrating-hermes); các plugin bên thứ ba có thể đăng ký thêm nhà cung cấp.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude) và [Di chuyển từ Hermes](/vi/install/migrating-hermes). [Trung tâm di chuyển](/vi/install/migrating) liệt kê tất cả các lộ trình.
</Tip>

## Lệnh

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Tên của một nhà cung cấp di chuyển đã đăng ký, ví dụ `hermes`. Chạy `openclaw migrate list` để xem các nhà cung cấp đã cài đặt.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Tạo kế hoạch rồi thoát mà không thay đổi trạng thái.
</ParamField>
<ParamField path="--from <path>" type="string">
  Ghi đè thư mục trạng thái nguồn. Hermes mặc định là `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Nhập thông tin xác thực được hỗ trợ. Mặc định tắt.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Cho phép apply thay thế các đích hiện có khi kế hoạch báo cáo xung đột.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bỏ qua lời nhắc xác nhận. Bắt buộc trong chế độ không tương tác.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Chọn một mục sao chép skill theo tên skill hoặc id mục. Lặp lại cờ này để di chuyển nhiều skill. Khi bỏ qua, các lần di chuyển Codex tương tác hiển thị bộ chọn hộp kiểm và các lần di chuyển không tương tác giữ lại tất cả skill đã lên kế hoạch.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Chọn một mục cài đặt plugin Codex theo tên plugin hoặc id mục. Lặp lại cờ này để di chuyển nhiều plugin Codex. Khi bỏ qua, các lần di chuyển Codex tương tác hiển thị bộ chọn hộp kiểm plugin Codex gốc và các lần di chuyển không tương tác giữ lại tất cả plugin đã lên kế hoạch. Điều này chỉ áp dụng cho các plugin Codex `openai-curated` được cài đặt ở nguồn và được phát hiện bởi kho ứng dụng app-server của Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Chỉ Codex. Buộc duyệt mới `app/list` trên app-server Codex nguồn trước khi lập kế hoạch kích hoạt plugin gốc. Mặc định tắt để giữ cho việc lập kế hoạch di chuyển nhanh.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Bỏ qua bản sao lưu trước khi apply. Yêu cầu `--force` khi trạng thái OpenClaw cục bộ tồn tại.
</ParamField>
<ParamField path="--force" type="boolean">
  Bắt buộc cùng với `--no-backup` khi apply nếu không sẽ từ chối bỏ qua sao lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In kế hoạch hoặc kết quả apply dưới dạng JSON. Với `--json` và không có `--yes`, apply in kế hoạch và không thay đổi trạng thái.
</ParamField>

## Mô hình an toàn

`openclaw migrate` ưu tiên xem trước.

<AccordionGroup>
  <Accordion title="Xem trước trước khi apply">
    Nhà cung cấp trả về một kế hoạch theo từng mục trước khi có bất kỳ thay đổi nào, bao gồm xung đột, mục bị bỏ qua và mục nhạy cảm. Kế hoạch JSON, đầu ra apply và báo cáo di chuyển sẽ che các khóa lồng nhau trông giống bí mật như khóa API, token, tiêu đề ủy quyền, cookie và mật khẩu.

    `openclaw migrate apply <provider>` xem trước kế hoạch và nhắc xác nhận trước khi thay đổi trạng thái, trừ khi đặt `--yes`. Trong chế độ không tương tác, apply yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Bản sao lưu">
    Apply tạo và xác minh một bản sao lưu OpenClaw trước khi áp dụng quá trình di chuyển. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu được bỏ qua và quá trình di chuyển có thể tiếp tục. Để bỏ qua sao lưu khi trạng thái tồn tại, truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Xung đột">
    Apply từ chối tiếp tục khi kế hoạch có xung đột. Xem lại kế hoạch, rồi chạy lại với `--overwrite` nếu việc thay thế các đích hiện có là có chủ ý. Nhà cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
  </Accordion>
  <Accordion title="Bí mật">
    Bí mật không bao giờ được nhập theo mặc định. Dùng `--include-secrets` để nhập thông tin xác thực được hỗ trợ.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp Claude

Nhà cung cấp Claude đi kèm mặc định phát hiện trạng thái Claude Code tại `~/.claude`. Dùng `--from <path>` để nhập một thư mục home Claude Code hoặc thư mục gốc dự án cụ thể.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude).
</Tip>

### Claude nhập những gì

- `CLAUDE.md` của dự án và `.claude/CLAUDE.md` vào không gian làm việc tác tử OpenClaw.
- `~/.claude/CLAUDE.md` của người dùng được nối thêm vào `USER.md` của không gian làm việc.
- Định nghĩa máy chủ MCP từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code và `claude_desktop_config.json` của Claude Desktop.
- Các thư mục skill Claude có bao gồm `SKILL.md`.
- Các tệp Markdown lệnh Claude được chuyển đổi thành skill OpenClaw chỉ với gọi thủ công.

### Trạng thái lưu trữ và cần xem xét thủ công

Hook, quyền, mặc định môi trường, bộ nhớ cục bộ, quy tắc theo phạm vi đường dẫn, subagent, bộ nhớ đệm, kế hoạch và lịch sử dự án của Claude được bảo tồn trong báo cáo di chuyển hoặc được báo cáo dưới dạng mục cần xem xét thủ công. OpenClaw không thực thi hook, sao chép allowlist rộng, hoặc tự động nhập trạng thái thông tin xác thực OAuth/Desktop.

## Nhà cung cấp Codex

Nhà cung cấp Codex đi kèm mặc định phát hiện trạng thái Codex CLI tại `~/.codex`, hoặc
tại `CODEX_HOME` khi biến môi trường đó được đặt. Dùng `--from <path>` để
kiểm kê một thư mục home Codex cụ thể.

Dùng nhà cung cấp này khi chuyển sang harness Codex của OpenClaw và bạn muốn
chủ động nâng cấp các tài sản Codex CLI cá nhân hữu ích. Các lần khởi chạy app-server
Codex cục bộ dùng thư mục `CODEX_HOME` và `HOME` theo từng tác tử, nên mặc định
chúng không đọc trạng thái Codex CLI cá nhân của bạn.

Chạy `openclaw migrate codex` trong một terminal tương tác sẽ xem trước toàn bộ
kế hoạch, rồi mở các bộ chọn hộp kiểm trước xác nhận apply cuối cùng. Các mục
sao chép skill được nhắc trước. Dùng `Toggle all on` hoặc `Toggle all off` để
chọn hàng loạt. Nhấn Space để bật/tắt các hàng, hoặc nhấn Enter để kích hoạt
hàng đang được tô sáng và tiếp tục. Các skill đã lên kế hoạch bắt đầu ở trạng thái được chọn, các skill
xung đột bắt đầu ở trạng thái không chọn, và `Skip for now` bỏ qua các bản sao skill cho lần chạy này trong khi vẫn tiếp tục đến bước
chọn plugin. Khi có thể di chuyển các plugin Codex curated được cài đặt ở nguồn và
`--plugin` chưa được cung cấp, quá trình di chuyển sau đó nhắc kích hoạt plugin
Codex gốc theo tên plugin. Các mục plugin
bắt đầu ở trạng thái được chọn trừ khi cấu hình plugin Codex OpenClaw đích đã có
plugin đó. Các plugin đích hiện có bắt đầu ở trạng thái không chọn và hiển thị gợi ý xung đột như
`conflict: plugin exists`; chọn `Toggle all off` để không di chuyển plugin Codex
gốc nào trong lần chạy đó, hoặc `Skip for now` để dừng trước khi apply. Đối với các lần chạy theo script hoặc
chính xác, truyền `--skill <name>` một lần cho mỗi skill, ví dụ:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Dùng `--plugin <name>` để giới hạn di chuyển plugin Codex gốc theo cách không tương tác
vào một hoặc nhiều plugin curated được cài đặt ở nguồn:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex nhập những gì

- Các thư mục skill Codex CLI trong `$CODEX_HOME/skills`, loại trừ bộ nhớ đệm
  `.system` của Codex.
- AgentSkills cá nhân trong `$HOME/.agents/skills`, được sao chép vào không gian làm việc
  tác tử OpenClaw hiện tại khi bạn muốn quyền sở hữu theo từng tác tử.
- Các plugin Codex `openai-curated` được cài đặt ở nguồn, được phát hiện thông qua
  `plugin/list` của app-server Codex. Việc lập kế hoạch đọc `plugin/read` cho từng plugin
  đã cài đặt và đang bật. Các plugin dựa trên ứng dụng yêu cầu phản hồi tài khoản
  app-server Codex nguồn là tài khoản đăng ký ChatGPT; phản hồi tài khoản không phải ChatGPT hoặc thiếu
  sẽ bị bỏ qua với `codex_subscription_required`. Theo mặc định,
  quá trình di chuyển không gọi `app/list` nguồn, nên các plugin dựa trên ứng dụng vượt qua
  cổng tài khoản được lên kế hoạch mà không xác minh khả năng truy cập ứng dụng nguồn, và
  lỗi vận chuyển tra cứu tài khoản bị bỏ qua với `codex_account_unavailable`. Truyền
  `--verify-plugin-apps` khi bạn muốn quá trình di chuyển buộc tạo snapshot
  `app/list` nguồn mới và yêu cầu mọi ứng dụng thuộc sở hữu phải hiện diện, được bật và
  truy cập được trước khi lập kế hoạch kích hoạt gốc. Trong chế độ đó, lỗi vận chuyển
  tra cứu tài khoản sẽ chuyển tiếp sang xác minh kho ứng dụng nguồn. Snapshot
  kho ứng dụng nguồn được giữ trong bộ nhớ cho tiến trình hiện tại; nó
  không được ghi vào đầu ra di chuyển hoặc cấu hình đích. Plugin bị tắt,
  chi tiết plugin không đọc được, tài khoản nguồn bị chặn bởi đăng ký và, khi
  yêu cầu xác minh, ứng dụng thiếu, ứng dụng bị tắt, ứng dụng không truy cập được hoặc
  lỗi kho ứng dụng nguồn trở thành các mục thủ công bị bỏ qua với lý do có kiểu
  thay vì mục cấu hình đích.
  Apply gọi `plugin/install` của app-server cho từng plugin đủ điều kiện đã chọn,
  ngay cả khi app-server đích đã báo cáo plugin đó là đã cài đặt và
  đang bật. Các plugin Codex đã di chuyển chỉ dùng được trong các phiên chọn
  harness Codex gốc; chúng không được hiển thị cho Pi, các lần chạy nhà cung cấp OpenAI thông thường,
  liên kết hội thoại ACP hoặc các harness khác.

### Trạng thái Codex cần xem xét thủ công

`config.toml` của Codex, `hooks/hooks.json` gốc, marketplace không curated, các gói
plugin được lưu đệm không phải plugin curated được cài đặt ở nguồn, và các plugin được cài đặt ở nguồn
không vượt qua cổng đăng ký nguồn sẽ không được kích hoạt tự động.
Khi đặt `--verify-plugin-apps`, các plugin không vượt qua cổng kho ứng dụng nguồn
cũng bị bỏ qua. Chúng được sao chép hoặc báo cáo trong báo cáo di chuyển để
xem xét thủ công.

Đối với các plugin curated được cài đặt ở nguồn đã di chuyển, apply ghi:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- một mục plugin rõ ràng với `marketplaceName: "openai-curated"` và
  `pluginName` cho mỗi plugin đã chọn

Di chuyển không bao giờ ghi `plugins["*"]` và không bao giờ lưu các đường dẫn bộ nhớ đệm marketplace
cục bộ. Lỗi đăng ký phía nguồn được báo cáo trên các mục thủ công với lý do
có kiểu như `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled`, hoặc `plugin_read_unavailable`. Với `--verify-plugin-apps`,
lỗi kho ứng dụng nguồn cũng có thể xuất hiện dưới dạng `app_inaccessible`,
`app_disabled`, `app_missing`, hoặc `app_inventory_unavailable`. Plugin bị bỏ qua
không được ghi vào cấu hình đích.
Các cài đặt phía đích yêu cầu xác thực được báo cáo trên mục plugin bị ảnh hưởng với
`status: "skipped"`, `reason: "auth_required"` và mã định danh ứng dụng đã làm sạch.
Các mục cấu hình rõ ràng của chúng được ghi ở trạng thái tắt cho đến khi bạn ủy quyền lại và
bật chúng. Các lỗi cài đặt khác là kết quả `error` theo phạm vi mục.

Nếu kho plugin app-server Codex không khả dụng trong quá trình lập kế hoạch, quá trình di chuyển
quay về các mục tư vấn gói được lưu đệm thay vì làm lỗi toàn bộ
quá trình di chuyển.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes đi kèm mặc định phát hiện trạng thái tại `~/.hermes`. Dùng `--from <path>` khi Hermes nằm ở nơi khác.

### Hermes nhập những gì

- Cấu hình mô hình mặc định từ `config.yaml`.
- Các nhà cung cấp mô hình đã cấu hình và endpoint tùy chỉnh tương thích với OpenAI từ `providers` và `custom_providers`.
- Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
- `SOUL.md` và `AGENTS.md` vào không gian làm việc của tác nhân OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối thêm vào các tệp bộ nhớ của không gian làm việc.
- Các giá trị mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cùng với các mục lưu trữ hoặc cần xem xét thủ công cho nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Skills bao gồm tệp `SKILL.md` trong `skills/<name>/`.
- Các giá trị cấu hình theo từng Skill từ `skills.config`.
- Các khóa API được hỗ trợ từ `.env`, chỉ với `--include-secrets`.

### Các khóa `.env` được hỗ trợ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn sẽ được sao chép vào báo cáo di chuyển để xem xét thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động. Điều này giữ lại trạng thái mờ hoặc không an toàn mà không giả vờ rằng OpenClaw có thể tự động thực thi hoặc tin cậy trạng thái đó:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Sau khi áp dụng

```bash
openclaw doctor
```

## Hợp đồng Plugin

Nguồn di chuyển là các Plugin. Một Plugin khai báo id nhà cung cấp của nó trong `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Khi chạy, Plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan` và `apply`. Phần lõi sở hữu việc điều phối CLI, chính sách sao lưu, lời nhắc, đầu ra JSON và kiểm tra xung đột trước. Phần lõi truyền kế hoạch đã được xem xét vào `apply(ctx, plan)`, và các nhà cung cấp chỉ có thể dựng lại kế hoạch khi đối số đó vắng mặt để tương thích.

Các Plugin nhà cung cấp có thể dùng `openclaw/plugin-sdk/migration` để tạo mục và đếm tóm tắt, cùng với `openclaw/plugin-sdk/migration-runtime` để sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, trình bao bọc config-runtime được lưu trong bộ nhớ đệm và báo cáo di chuyển.

## Tích hợp nhập môn

Quy trình nhập môn có thể đề xuất di chuyển khi một nhà cung cấp phát hiện nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều dùng cùng nhà cung cấp di chuyển Plugin và vẫn hiển thị bản xem trước trước khi áp dụng.

<Note>
Nhập trong quy trình nhập môn yêu cầu một thiết lập OpenClaw mới. Trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc nếu bạn đã có trạng thái cục bộ. Nhập theo kiểu sao lưu kèm ghi đè hoặc hợp nhất được kiểm soát bằng cờ tính năng cho các thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn từng bước dành cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn từng bước dành cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi áp dụng một lần di chuyển.
- [Plugin](/vi/tools/plugin): cài đặt và đăng ký Plugin.
