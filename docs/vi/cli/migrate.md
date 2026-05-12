---
read_when:
    - Bạn muốn chuyển từ Hermes hoặc một hệ thống tác nhân khác sang OpenClaw
    - Bạn đang thêm một trình cung cấp di chuyển do plugin sở hữu
summary: Tài liệu tham chiếu CLI cho `openclaw migrate` (nhập trạng thái từ hệ thống agent khác)
title: Di chuyển
x-i18n:
    generated_at: "2026-05-12T00:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ hệ thống tác nhân khác thông qua nhà cung cấp di trú do Plugin sở hữu. Các nhà cung cấp đi kèm bao gồm trạng thái Codex CLI, [Claude](/vi/install/migrating-claude) và [Hermes](/vi/install/migrating-hermes); Plugin của bên thứ ba có thể đăng ký thêm nhà cung cấp.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di trú từ Claude](/vi/install/migrating-claude) và [Di trú từ Hermes](/vi/install/migrating-hermes). [Trung tâm di trú](/vi/install/migrating) liệt kê tất cả các đường dẫn.
</Tip>

## Lệnh

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
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
  Tên của một nhà cung cấp di trú đã đăng ký, ví dụ `hermes`. Chạy `openclaw migrate list` để xem các nhà cung cấp đã cài đặt.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Tạo kế hoạch rồi thoát mà không thay đổi trạng thái.
</ParamField>
<ParamField path="--from <path>" type="string">
  Ghi đè thư mục trạng thái nguồn. Hermes mặc định dùng `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Nhập các thông tin xác thực được hỗ trợ. Mặc định tắt.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Cho phép áp dụng thay thế các đích hiện có khi kế hoạch báo cáo xung đột.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bỏ qua lời nhắc xác nhận. Bắt buộc trong chế độ không tương tác.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Chọn một mục sao chép skill theo tên skill hoặc mã mục. Lặp lại cờ này để di trú nhiều skill. Khi bị bỏ qua, các lần di trú Codex tương tác sẽ hiển thị bộ chọn hộp kiểm, còn các lần di trú không tương tác sẽ giữ tất cả skill đã lên kế hoạch.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Chọn một mục cài đặt Plugin Codex theo tên Plugin hoặc mã mục. Lặp lại cờ này để di trú nhiều Plugin Codex. Khi bị bỏ qua, các lần di trú Codex tương tác sẽ hiển thị bộ chọn hộp kiểm Plugin Codex gốc, còn các lần di trú không tương tác sẽ giữ tất cả Plugin đã lên kế hoạch. Điều này chỉ áp dụng cho các Plugin Codex `openai-curated` được cài đặt từ nguồn do kho ứng dụng của máy chủ ứng dụng Codex phát hiện.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Bỏ qua bản sao lưu trước khi áp dụng. Yêu cầu `--force` khi trạng thái OpenClaw cục bộ tồn tại.
</ParamField>
<ParamField path="--force" type="boolean">
  Bắt buộc dùng cùng `--no-backup` khi thao tác áp dụng nếu không sẽ từ chối bỏ qua sao lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In kế hoạch hoặc kết quả áp dụng dưới dạng JSON. Với `--json` và không có `--yes`, thao tác áp dụng sẽ in kế hoạch và không thay đổi trạng thái.
</ParamField>

## Mô hình an toàn

`openclaw migrate` ưu tiên xem trước.

<AccordionGroup>
  <Accordion title="Xem trước trước khi áp dụng">
    Nhà cung cấp trả về kế hoạch theo từng mục trước khi có bất kỳ thay đổi nào, bao gồm xung đột, mục bị bỏ qua và mục nhạy cảm. Kế hoạch JSON, đầu ra áp dụng và báo cáo di trú sẽ biên tập lại các khóa lồng nhau trông giống bí mật, chẳng hạn như khóa API, token, tiêu đề ủy quyền, cookie và mật khẩu.

    `openclaw migrate apply <provider>` xem trước kế hoạch và nhắc xác nhận trước khi thay đổi trạng thái, trừ khi đặt `--yes`. Trong chế độ không tương tác, thao tác áp dụng yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Bản sao lưu">
    Thao tác áp dụng tạo và xác minh một bản sao lưu OpenClaw trước khi áp dụng di trú. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu sẽ bị bỏ qua và quá trình di trú có thể tiếp tục. Để bỏ qua sao lưu khi trạng thái tồn tại, truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Xung đột">
    Thao tác áp dụng từ chối tiếp tục khi kế hoạch có xung đột. Xem lại kế hoạch, rồi chạy lại với `--overwrite` nếu việc thay thế các đích hiện có là có chủ ý. Nhà cung cấp vẫn có thể ghi các bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di trú.
  </Accordion>
  <Accordion title="Bí mật">
    Bí mật mặc định không bao giờ được nhập. Dùng `--include-secrets` để nhập các thông tin xác thực được hỗ trợ.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp Claude

Nhà cung cấp Claude đi kèm mặc định phát hiện trạng thái Claude Code tại `~/.claude`. Dùng `--from <path>` để nhập một thư mục home Claude Code hoặc gốc dự án cụ thể.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di trú từ Claude](/vi/install/migrating-claude).
</Tip>

### Claude nhập những gì

- `CLAUDE.md` của dự án và `.claude/CLAUDE.md` vào không gian làm việc tác nhân OpenClaw.
- `~/.claude/CLAUDE.md` của người dùng được nối vào `USER.md` của không gian làm việc.
- Định nghĩa máy chủ MCP từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code và `claude_desktop_config.json` của Claude Desktop.
- Thư mục skill Claude có chứa `SKILL.md`.
- Tệp Markdown lệnh Claude được chuyển đổi thành skill OpenClaw chỉ với cách gọi thủ công.

### Trạng thái lưu trữ và cần xem xét thủ công

Hook Claude, quyền, mặc định môi trường, bộ nhớ cục bộ, quy tắc theo phạm vi đường dẫn, tác nhân phụ, bộ nhớ đệm, kế hoạch và lịch sử dự án được giữ lại trong báo cáo di trú hoặc báo cáo dưới dạng các mục cần xem xét thủ công. OpenClaw không tự động thực thi hook, sao chép danh sách cho phép rộng, hoặc nhập trạng thái thông tin xác thực OAuth/Desktop.

## Nhà cung cấp Codex

Nhà cung cấp Codex đi kèm mặc định phát hiện trạng thái Codex CLI tại `~/.codex`, hoặc
tại `CODEX_HOME` khi biến môi trường đó được đặt. Dùng `--from <path>` để
kiểm kê một thư mục home Codex cụ thể.

Dùng nhà cung cấp này khi chuyển sang OpenClaw Codex harness và bạn muốn
chủ động đưa các tài sản Codex CLI cá nhân hữu ích vào sử dụng. Các lần khởi chạy
máy chủ ứng dụng Codex cục bộ dùng thư mục `CODEX_HOME` và `HOME` theo từng tác nhân,
nên mặc định chúng không đọc trạng thái Codex CLI cá nhân của bạn.

Chạy `openclaw migrate codex` trong một terminal tương tác sẽ xem trước toàn bộ
kế hoạch, rồi mở các bộ chọn hộp kiểm trước lời nhắc xác nhận áp dụng cuối cùng. Các mục
sao chép skill được nhắc trước. Dùng `Toggle all on` hoặc `Toggle all off` để chọn hàng loạt;
skill đã lên kế hoạch bắt đầu ở trạng thái được chọn, skill xung đột bắt đầu ở trạng thái bỏ chọn, và
`Skip for now` bỏ qua việc sao chép skill cho lần chạy này trong khi vẫn tiếp tục đến bước chọn Plugin.
Khi các Plugin Codex tuyển chọn được cài đặt từ nguồn có thể di trú và
`--plugin` không được cung cấp, quá trình di trú sau đó nhắc kích hoạt Plugin Codex gốc
theo tên Plugin. Các mục Plugin
bắt đầu ở trạng thái được chọn, trừ khi cấu hình Plugin OpenClaw Codex đích đã có
Plugin đó. Các Plugin đích hiện có bắt đầu ở trạng thái bỏ chọn và hiển thị gợi ý xung đột như
`conflict: plugin exists`; chọn `Toggle all off` để không di trú Plugin Codex gốc nào
trong lần chạy đó, hoặc `Skip for now` để dừng trước khi áp dụng. Với các lần chạy theo kịch bản hoặc
chính xác, truyền `--skill <name>` một lần cho mỗi skill, ví dụ:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Dùng `--plugin <name>` để giới hạn quá trình di trú Plugin Codex gốc không tương tác
vào một hoặc nhiều Plugin tuyển chọn được cài đặt từ nguồn:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex nhập những gì

- Thư mục skill Codex CLI dưới `$CODEX_HOME/skills`, ngoại trừ bộ nhớ đệm
  `.system` của Codex.
- AgentSkills cá nhân dưới `$HOME/.agents/skills`, được sao chép vào không gian làm việc
  tác nhân OpenClaw hiện tại khi bạn muốn sở hữu theo từng tác nhân.
- Các Plugin Codex `openai-curated` được cài đặt từ nguồn, phát hiện thông qua
  `plugin/list` của máy chủ ứng dụng Codex. Thao tác áp dụng gọi `plugin/install` của máy chủ ứng dụng cho từng
  Plugin đã chọn, ngay cả khi máy chủ ứng dụng đích đã báo cáo Plugin đó
  đã được cài đặt và bật. Các Plugin Codex đã di trú chỉ dùng được trong các phiên
  chọn native Codex harness; chúng không được đưa ra cho Pi, các lần chạy
  nhà cung cấp OpenAI thông thường, liên kết hội thoại ACP hoặc các harness khác.

### Trạng thái Codex cần xem xét thủ công

`config.toml` của Codex, `hooks/hooks.json` gốc, marketplace không tuyển chọn và
các gói Plugin đã lưu đệm không phải Plugin tuyển chọn được cài đặt từ nguồn sẽ không
được kích hoạt tự động. Chúng được sao chép hoặc báo cáo trong báo cáo di trú để
xem xét thủ công.

Đối với các Plugin tuyển chọn được cài đặt từ nguồn đã di trú, thao tác áp dụng ghi:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- một mục Plugin rõ ràng với `marketplaceName: "openai-curated"` và
  `pluginName` cho từng Plugin đã chọn

Di trú không bao giờ ghi `plugins["*"]` và không bao giờ lưu trữ đường dẫn bộ nhớ đệm
marketplace cục bộ. Các cài đặt yêu cầu xác thực được báo cáo trên mục Plugin bị ảnh hưởng với
`status: "skipped"`, `reason: "auth_required"` và mã định danh ứng dụng đã được làm sạch.
Các mục cấu hình rõ ràng của chúng được ghi ở trạng thái tắt cho đến khi bạn ủy quyền lại và
bật chúng. Các lỗi cài đặt khác là kết quả `error` theo phạm vi mục.

Nếu kho Plugin của máy chủ ứng dụng Codex không khả dụng trong lúc lập kế hoạch, quá trình di trú
sẽ quay về các mục tư vấn gói đã lưu đệm thay vì làm hỏng toàn bộ
quá trình di trú.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes đi kèm mặc định phát hiện trạng thái tại `~/.hermes`. Dùng `--from <path>` khi Hermes nằm ở nơi khác.

### Hermes nhập những gì

- Cấu hình mô hình mặc định từ `config.yaml`.
- Nhà cung cấp mô hình đã cấu hình và endpoint tương thích OpenAI tùy chỉnh từ `providers` và `custom_providers`.
- Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
- `SOUL.md` và `AGENTS.md` vào không gian làm việc tác nhân OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối vào các tệp bộ nhớ không gian làm việc.
- Mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cùng với các mục lưu trữ hoặc cần xem xét thủ công cho nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Skills có chứa tệp `SKILL.md` dưới `skills/<name>/`.
- Giá trị cấu hình theo từng skill từ `skills.config`.
- Khóa API được hỗ trợ từ `.env`, chỉ với `--include-secrets`.

### Các khóa `.env` được hỗ trợ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn được sao chép vào báo cáo di trú để xem xét thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động. Điều này giữ lại trạng thái mờ hoặc không an toàn mà không giả vờ rằng OpenClaw có thể tự động thực thi hoặc tin cậy trạng thái đó:

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

Nguồn di trú là Plugin. Một Plugin khai báo mã nhà cung cấp trong `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Ở thời gian chạy, Plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan` và `apply`. Core sở hữu điều phối CLI, chính sách sao lưu, lời nhắc, đầu ra JSON và kiểm tra trước xung đột. Core truyền kế hoạch đã xem xét vào `apply(ctx, plan)`, và nhà cung cấp chỉ có thể xây dựng lại kế hoạch khi đối số đó vắng mặt để tương thích.

Plugin nhà cung cấp có thể dùng `openclaw/plugin-sdk/migration` để tạo mục và đếm tổng kết, cùng `openclaw/plugin-sdk/migration-runtime` cho sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, wrapper config-runtime đã lưu đệm và báo cáo di trú.

## Tích hợp onboarding

Onboarding có thể đề xuất di trú khi một nhà cung cấp phát hiện nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều dùng cùng nhà cung cấp di trú Plugin và vẫn hiển thị bản xem trước trước khi áp dụng.

<Note>
Việc nhập trong quá trình onboarding yêu cầu một thiết lập OpenClaw mới. Trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và workspace nếu bạn đã có trạng thái cục bộ. Nhập theo kiểu sao lưu rồi ghi đè hoặc hợp nhất đang được giới hạn bằng cờ tính năng đối với các thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn dành cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn dành cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang một máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi áp dụng di chuyển.
- [Plugin](/vi/tools/plugin): cài đặt và đăng ký Plugin.
