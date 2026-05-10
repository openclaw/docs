---
read_when:
    - Bạn muốn chuyển từ Hermes hoặc một hệ thống tác tử khác sang OpenClaw
    - Bạn đang thêm một nhà cung cấp di trú do Plugin sở hữu
summary: Tham chiếu CLI cho `openclaw migrate` (nhập trạng thái từ một hệ thống tác nhân khác)
title: Di chuyển
x-i18n:
    generated_at: "2026-05-10T19:28:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ một hệ thống agent khác thông qua nhà cung cấp di chuyển do plugin sở hữu. Các nhà cung cấp đi kèm bao gồm trạng thái Codex CLI, [Claude](/vi/install/migrating-claude), và [Hermes](/vi/install/migrating-hermes); các plugin bên thứ ba có thể đăng ký thêm nhà cung cấp.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, xem [Di chuyển từ Claude](/vi/install/migrating-claude) và [Di chuyển từ Hermes](/vi/install/migrating-hermes). [Trung tâm di chuyển](/vi/install/migrating) liệt kê tất cả các đường dẫn.
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
  Tên của một nhà cung cấp di chuyển đã đăng ký, ví dụ `hermes`. Chạy `openclaw migrate list` để xem các nhà cung cấp đã cài đặt.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Xây dựng kế hoạch rồi thoát mà không thay đổi trạng thái.
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
  Bỏ qua lời nhắc xác nhận. Bắt buộc ở chế độ không tương tác.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Chọn một mục sao chép skill theo tên skill hoặc id mục. Lặp lại cờ này để di chuyển nhiều skills. Khi bỏ qua, các lần di chuyển Codex tương tác hiển thị bộ chọn hộp kiểm và các lần di chuyển không tương tác giữ tất cả skills đã lên kế hoạch.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Chọn một mục cài đặt plugin Codex theo tên plugin hoặc id mục. Lặp lại cờ này để di chuyển nhiều plugin Codex. Khi bỏ qua, các lần di chuyển Codex tương tác hiển thị bộ chọn hộp kiểm plugin Codex gốc và các lần di chuyển không tương tác giữ tất cả plugin đã lên kế hoạch. Điều này chỉ áp dụng cho các plugin Codex `openai-curated` được cài từ nguồn và được phát hiện bởi kho app-server Codex.
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
    Nhà cung cấp trả về kế hoạch theo từng mục trước khi có bất kỳ thay đổi nào, bao gồm xung đột, mục bị bỏ qua và mục nhạy cảm. Kế hoạch JSON, đầu ra apply và báo cáo di chuyển sẽ biên tập các khóa lồng nhau trông giống bí mật như khóa API, token, tiêu đề ủy quyền, cookie và mật khẩu.

    `openclaw migrate apply <provider>` xem trước kế hoạch và nhắc trước khi thay đổi trạng thái, trừ khi đặt `--yes`. Ở chế độ không tương tác, apply yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Bản sao lưu">
    Apply tạo và xác minh một bản sao lưu OpenClaw trước khi áp dụng di chuyển. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu sẽ bị bỏ qua và quá trình di chuyển có thể tiếp tục. Để bỏ qua sao lưu khi trạng thái tồn tại, truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Xung đột">
    Apply từ chối tiếp tục khi kế hoạch có xung đột. Xem lại kế hoạch, sau đó chạy lại với `--overwrite` nếu việc thay thế các đích hiện có là có chủ ý. Nhà cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
  </Accordion>
  <Accordion title="Bí mật">
    Theo mặc định, bí mật không bao giờ được nhập. Dùng `--include-secrets` để nhập thông tin xác thực được hỗ trợ.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp Claude

Nhà cung cấp Claude đi kèm mặc định phát hiện trạng thái Claude Code tại `~/.claude`. Dùng `--from <path>` để nhập một thư mục home hoặc thư mục gốc dự án Claude Code cụ thể.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, xem [Di chuyển từ Claude](/vi/install/migrating-claude).
</Tip>

### Claude nhập những gì

- `CLAUDE.md` của dự án và `.claude/CLAUDE.md` vào không gian làm việc agent OpenClaw.
- `~/.claude/CLAUDE.md` của người dùng được nối vào `USER.md` của không gian làm việc.
- Định nghĩa máy chủ MCP từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code và `claude_desktop_config.json` của Claude Desktop.
- Các thư mục skill Claude có bao gồm `SKILL.md`.
- Các tệp Markdown lệnh Claude được chuyển thành skills OpenClaw chỉ với gọi thủ công.

### Trạng thái lưu trữ và cần xem xét thủ công

Hooks, quyền, mặc định môi trường, bộ nhớ cục bộ, quy tắc theo phạm vi đường dẫn, subagents, cache, kế hoạch và lịch sử dự án của Claude được giữ trong báo cáo di chuyển hoặc được báo cáo là các mục cần xem xét thủ công. OpenClaw không tự động thực thi hooks, sao chép allowlist rộng hoặc nhập trạng thái thông tin xác thực OAuth/Desktop.

## Nhà cung cấp Codex

Nhà cung cấp Codex đi kèm mặc định phát hiện trạng thái Codex CLI tại `~/.codex`, hoặc
tại `CODEX_HOME` khi biến môi trường đó được đặt. Dùng `--from <path>` để
kiểm kê một Codex home cụ thể.

Dùng nhà cung cấp này khi chuyển sang harness Codex của OpenClaw và bạn muốn
chủ động đưa các tài sản Codex CLI cá nhân hữu ích lên. Các lần khởi chạy app-server
Codex cục bộ dùng thư mục `CODEX_HOME` và `HOME` theo từng agent, nên theo mặc định
chúng không đọc trạng thái Codex CLI cá nhân của bạn.

Chạy `openclaw migrate codex` trong terminal tương tác sẽ xem trước toàn bộ
kế hoạch, sau đó mở bộ chọn hộp kiểm trước xác nhận apply cuối cùng. Các mục
sao chép skill được nhắc trước. Dùng `Toggle all on` hoặc `Toggle all off` để
chọn hàng loạt; skills đã lên kế hoạch bắt đầu được chọn, skills xung đột bắt đầu bỏ chọn, và
`Skip for now` bỏ qua sao chép skill cho lần chạy này trong khi vẫn tiếp tục đến phần chọn
plugin. Khi các plugin Codex curated được cài từ nguồn có thể di chuyển và
chưa cung cấp `--plugin`, quá trình di chuyển sau đó nhắc kích hoạt plugin
Codex gốc theo tên plugin. Các mục plugin
bắt đầu được chọn trừ khi cấu hình plugin Codex OpenClaw đích đã có
plugin đó. Các plugin đích hiện có bắt đầu bỏ chọn và hiển thị gợi ý xung đột như
`conflict: plugin exists`; chọn `Toggle all off` để không di chuyển plugin Codex
gốc nào trong lần chạy đó, hoặc `Skip for now` để dừng trước khi apply. Với các lần chạy theo script hoặc
chính xác, truyền `--skill <name>` một lần cho mỗi skill, ví dụ:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Dùng `--plugin <name>` để giới hạn di chuyển plugin Codex gốc không tương tác
vào một hoặc nhiều plugin curated được cài từ nguồn:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex nhập những gì

- Các thư mục skill Codex CLI trong `$CODEX_HOME/skills`, ngoại trừ cache
  `.system` của Codex.
- AgentSkills cá nhân trong `$HOME/.agents/skills`, được sao chép vào không gian làm việc
  agent OpenClaw hiện tại khi bạn muốn quyền sở hữu theo từng agent.
- Các plugin Codex `openai-curated` được cài từ nguồn và phát hiện qua
  `plugin/list` của app-server Codex. Apply gọi `plugin/install` của app-server cho từng
  plugin đã chọn, ngay cả khi app-server đích đã báo cáo plugin đó
  đã cài đặt và bật. Các plugin Codex đã di chuyển chỉ dùng được trong phiên
  chọn harness Codex gốc; chúng không được hiển thị cho Pi, các lần chạy nhà cung cấp OpenAI
  thông thường, ràng buộc hội thoại ACP hoặc các harness khác.

### Trạng thái Codex cần xem xét thủ công

`config.toml` của Codex, `hooks/hooks.json` gốc, marketplace không phải curated và
các gói plugin cache không phải plugin curated được cài từ nguồn sẽ không được
kích hoạt tự động. Chúng được sao chép hoặc báo cáo trong báo cáo di chuyển để
xem xét thủ công.

Đối với các plugin curated được cài từ nguồn đã di chuyển, apply ghi:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- một mục plugin tường minh với `marketplaceName: "openai-curated"` và
  `pluginName` cho từng plugin đã chọn

Di chuyển không bao giờ ghi `plugins["*"]` và không bao giờ lưu đường dẫn cache
marketplace cục bộ. Các lần cài đặt yêu cầu xác thực được báo cáo trên mục plugin bị ảnh hưởng với
`status: "skipped"`, `reason: "auth_required"`, và mã định danh ứng dụng đã làm sạch.
Các mục cấu hình tường minh của chúng được ghi ở trạng thái tắt cho đến khi bạn ủy quyền lại và
bật chúng. Các lỗi cài đặt khác là kết quả `error` theo phạm vi mục.

Nếu kho plugin app-server Codex không khả dụng trong lúc lập kế hoạch, quá trình di chuyển
chuyển sang các mục tư vấn gói cache thay vì làm hỏng toàn bộ
quá trình di chuyển.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes đi kèm mặc định phát hiện trạng thái tại `~/.hermes`. Dùng `--from <path>` khi Hermes nằm ở nơi khác.

### Hermes nhập những gì

- Cấu hình model mặc định từ `config.yaml`.
- Các nhà cung cấp model đã cấu hình và endpoint tương thích OpenAI tùy chỉnh từ `providers` và `custom_providers`.
- Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
- `SOUL.md` và `AGENTS.md` vào không gian làm việc agent OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối vào các tệp bộ nhớ của không gian làm việc.
- Mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cộng với các mục lưu trữ hoặc cần xem xét thủ công cho nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Skills có bao gồm tệp `SKILL.md` trong `skills/<name>/`.
- Giá trị cấu hình theo từng skill từ `skills.config`.
- Các khóa API được hỗ trợ từ `.env`, chỉ với `--include-secrets`.

### Khóa `.env` được hỗ trợ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn được sao chép vào báo cáo di chuyển để xem xét thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw trực tiếp. Điều này bảo toàn trạng thái mờ hoặc không an toàn mà không giả vờ OpenClaw có thể tự động thực thi hoặc tin cậy nó:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Sau khi apply

```bash
openclaw doctor
```

## Hợp đồng plugin

Nguồn di chuyển là plugin. Một plugin khai báo id nhà cung cấp của nó trong `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Trong runtime, plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan`, và `apply`. Core sở hữu điều phối CLI, chính sách sao lưu, lời nhắc, đầu ra JSON và kiểm tra trước xung đột. Core truyền kế hoạch đã được xem xét vào `apply(ctx, plan)`, và nhà cung cấp chỉ có thể xây dựng lại kế hoạch khi đối số đó vắng mặt vì lý do tương thích.

Plugin nhà cung cấp có thể dùng `openclaw/plugin-sdk/migration` để xây dựng mục và đếm tóm tắt, cộng với `openclaw/plugin-sdk/migration-runtime` cho sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, wrapper config-runtime cache và báo cáo di chuyển.

## Tích hợp onboarding

Onboarding có thể đề xuất di chuyển khi một nhà cung cấp phát hiện nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều dùng cùng nhà cung cấp di chuyển plugin và vẫn hiển thị bản xem trước trước khi apply.

<Note>
Nhập dữ liệu trong quá trình onboarding yêu cầu một thiết lập OpenClaw mới. Trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và workspace nếu bạn đã có trạng thái cục bộ. Nhập theo kiểu sao lưu-rồi-ghi đè hoặc hợp nhất đang được kiểm soát bằng cờ tính năng cho các thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn dành cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn dành cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi áp dụng một quá trình di chuyển.
- [Plugin](/vi/tools/plugin): cài đặt và đăng ký plugin.
