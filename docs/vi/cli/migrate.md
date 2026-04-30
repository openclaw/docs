---
read_when:
    - Bạn muốn di chuyển từ Hermes hoặc một hệ thống tác nhân khác sang OpenClaw
    - Bạn đang thêm một trình cung cấp di chuyển do Plugin sở hữu
summary: Tài liệu tham chiếu CLI cho `openclaw migrate` (nhập trạng thái từ một hệ thống tác tử khác)
title: Di chuyển
x-i18n:
    generated_at: "2026-04-30T20:05:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ một hệ thống agent khác thông qua nhà cung cấp di chuyển do Plugin sở hữu. Các nhà cung cấp đi kèm bao phủ trạng thái Codex CLI, [Claude](/vi/install/migrating-claude) và [Hermes](/vi/install/migrating-hermes); các Plugin bên thứ ba có thể đăng ký thêm nhà cung cấp.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude) và [Di chuyển từ Hermes](/vi/install/migrating-hermes). [Trung tâm di chuyển](/vi/install/migrating) liệt kê tất cả các đường dẫn.
</Tip>

## Lệnh

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
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
  Nhập thông tin xác thực được hỗ trợ. Mặc định là tắt.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Cho phép áp dụng thay thế các mục tiêu hiện có khi kế hoạch báo cáo xung đột.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bỏ qua lời nhắc xác nhận. Bắt buộc trong chế độ không tương tác.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Chọn một mục sao chép Skills theo tên Skills hoặc id mục. Lặp lại cờ này để di chuyển nhiều Skills. Khi bỏ qua, các lần di chuyển Codex tương tác hiển thị bộ chọn hộp kiểm và các lần di chuyển không tương tác giữ lại tất cả Skills đã lên kế hoạch.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Bỏ qua bản sao lưu trước khi áp dụng. Yêu cầu `--force` khi trạng thái OpenClaw cục bộ tồn tại.
</ParamField>
<ParamField path="--force" type="boolean">
  Bắt buộc cùng với `--no-backup` khi thao tác áp dụng nếu không sẽ từ chối bỏ qua sao lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In kế hoạch hoặc kết quả áp dụng dưới dạng JSON. Với `--json` và không có `--yes`, thao tác áp dụng in kế hoạch và không thay đổi trạng thái.
</ParamField>

## Mô hình an toàn

`openclaw migrate` ưu tiên xem trước.

<AccordionGroup>
  <Accordion title="Preview before apply">
    Nhà cung cấp trả về một kế hoạch theo từng mục trước khi bất kỳ thứ gì thay đổi, bao gồm xung đột, mục bị bỏ qua và mục nhạy cảm. Kế hoạch JSON, đầu ra áp dụng và báo cáo di chuyển sẽ che các khóa lồng nhau trông giống bí mật như khóa API, token, tiêu đề ủy quyền, cookie và mật khẩu.

    `openclaw migrate apply <provider>` xem trước kế hoạch và nhắc trước khi thay đổi trạng thái, trừ khi đã đặt `--yes`. Trong chế độ không tương tác, thao tác áp dụng yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Thao tác áp dụng tạo và xác minh một bản sao lưu OpenClaw trước khi áp dụng di chuyển. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu được bỏ qua và quá trình di chuyển có thể tiếp tục. Để bỏ qua sao lưu khi trạng thái tồn tại, truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Conflicts">
    Thao tác áp dụng từ chối tiếp tục khi kế hoạch có xung đột. Xem lại kế hoạch, sau đó chạy lại với `--overwrite` nếu việc thay thế các mục tiêu hiện có là có chủ đích. Nhà cung cấp vẫn có thể ghi bản sao lưu ở cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
  </Accordion>
  <Accordion title="Secrets">
    Bí mật không bao giờ được nhập theo mặc định. Dùng `--include-secrets` để nhập thông tin xác thực được hỗ trợ.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp Claude

Nhà cung cấp Claude đi kèm mặc định phát hiện trạng thái Claude Code tại `~/.claude`. Dùng `--from <path>` để nhập một thư mục chính Claude Code hoặc thư mục gốc dự án cụ thể.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude).
</Tip>

### Claude nhập những gì

- `CLAUDE.md` của dự án và `.claude/CLAUDE.md` vào workspace agent OpenClaw.
- `~/.claude/CLAUDE.md` của người dùng được nối thêm vào `USER.md` của workspace.
- Định nghĩa máy chủ MCP từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code và `claude_desktop_config.json` của Claude Desktop.
- Thư mục Skills của Claude có chứa `SKILL.md`.
- Các tệp Markdown lệnh Claude được chuyển đổi thành Skills OpenClaw chỉ với lệnh gọi thủ công.

### Trạng thái lưu trữ và cần xem xét thủ công

Hook, quyền, mặc định môi trường, bộ nhớ cục bộ, quy tắc theo phạm vi đường dẫn, subagent, bộ nhớ đệm, kế hoạch và lịch sử dự án của Claude được giữ trong báo cáo di chuyển hoặc được báo cáo là các mục cần xem xét thủ công. OpenClaw không tự động thực thi hook, sao chép allowlist rộng hoặc nhập trạng thái thông tin xác thực OAuth/Desktop.

## Nhà cung cấp Codex

Nhà cung cấp Codex đi kèm mặc định phát hiện trạng thái Codex CLI tại `~/.codex`, hoặc tại `CODEX_HOME` khi biến môi trường đó được đặt. Dùng `--from <path>` để kiểm kê một thư mục chính Codex cụ thể.

Dùng nhà cung cấp này khi chuyển sang harness Codex của OpenClaw và bạn muốn chủ động đưa các tài sản Codex CLI cá nhân hữu ích vào. Các lần khởi chạy app-server Codex cục bộ dùng các thư mục `CODEX_HOME` và `HOME` theo từng agent, vì vậy mặc định chúng không đọc trạng thái Codex CLI cá nhân của bạn.

Chạy `openclaw migrate codex` trong terminal tương tác sẽ xem trước toàn bộ kế hoạch, sau đó mở bộ chọn hộp kiểm cho các mục sao chép Skills trước xác nhận áp dụng cuối cùng. Tất cả Skills ban đầu đều được chọn; bỏ chọn bất kỳ Skills nào bạn không muốn sao chép vào agent này. Đối với các lần chạy theo script hoặc chính xác, truyền `--skill <name>` một lần cho mỗi Skills, ví dụ:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex nhập những gì

- Thư mục Skills của Codex CLI dưới `$CODEX_HOME/skills`, ngoại trừ bộ nhớ đệm `.system` của Codex.
- AgentSkills cá nhân dưới `$HOME/.agents/skills`, được sao chép vào workspace agent OpenClaw hiện tại khi bạn muốn quyền sở hữu theo từng agent.

### Trạng thái Codex cần xem xét thủ công

Plugin gốc của Codex, `config.toml` và `hooks/hooks.json` gốc không được kích hoạt tự động. Plugin có thể phơi bày máy chủ MCP, ứng dụng, hook hoặc hành vi thực thi khác, vì vậy nhà cung cấp báo cáo chúng để xem xét thay vì tải chúng vào OpenClaw. Các tệp cấu hình và hook được sao chép vào báo cáo di chuyển để xem xét thủ công.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes đi kèm mặc định phát hiện trạng thái tại `~/.hermes`. Dùng `--from <path>` khi Hermes nằm ở nơi khác.

### Hermes nhập những gì

- Cấu hình mô hình mặc định từ `config.yaml`.
- Các nhà cung cấp mô hình đã cấu hình và endpoint tùy chỉnh tương thích OpenAI từ `providers` và `custom_providers`.
- Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
- `SOUL.md` và `AGENTS.md` vào workspace agent OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối thêm vào các tệp bộ nhớ workspace.
- Mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cùng các mục lưu trữ hoặc cần xem xét thủ công cho nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Skills có chứa tệp `SKILL.md` dưới `skills/<name>/`.
- Giá trị cấu hình theo từng Skills từ `skills.config`.
- Các khóa API được hỗ trợ từ `.env`, chỉ với `--include-secrets`.

### Các khóa `.env` được hỗ trợ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn được sao chép vào báo cáo di chuyển để xem xét thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động. Điều này bảo toàn trạng thái không rõ hoặc không an toàn mà không giả vờ rằng OpenClaw có thể tự động thực thi hoặc tin cậy nó:

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

Nguồn di chuyển là Plugin. Một Plugin khai báo các id nhà cung cấp của nó trong `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Trong runtime, Plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan` và `apply`. Core sở hữu điều phối CLI, chính sách sao lưu, lời nhắc, đầu ra JSON và kiểm tra trước xung đột. Core truyền kế hoạch đã được xem xét vào `apply(ctx, plan)`, và nhà cung cấp chỉ có thể xây dựng lại kế hoạch khi đối số đó vắng mặt vì lý do tương thích.

Plugin nhà cung cấp có thể dùng `openclaw/plugin-sdk/migration` để xây dựng mục và đếm tóm tắt, cùng `openclaw/plugin-sdk/migration-runtime` để sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, wrapper config-runtime được lưu đệm và báo cáo di chuyển.

## Tích hợp onboarding

Onboarding có thể đề xuất di chuyển khi một nhà cung cấp phát hiện nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều dùng cùng nhà cung cấp di chuyển Plugin và vẫn hiển thị bản xem trước trước khi áp dụng.

<Note>
Nhập trong onboarding yêu cầu một thiết lập OpenClaw mới. Hãy đặt lại cấu hình, thông tin xác thực, phiên và workspace trước nếu bạn đã có trạng thái cục bộ. Nhập theo kiểu sao lưu cộng ghi đè hoặc hợp nhất được kiểm soát bằng cờ tính năng cho các thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn từng bước dành cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn từng bước dành cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau khi áp dụng di chuyển.
- [Plugin](/vi/tools/plugin): cài đặt và đăng ký Plugin.
