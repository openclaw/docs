---
read_when:
    - Bạn muốn di chuyển từ Hermes hoặc một hệ thống tác nhân khác sang OpenClaw
    - Bạn đang thêm một trình cung cấp di chuyển do Plugin sở hữu
summary: Tham chiếu CLI cho `openclaw migrate` (nhập trạng thái từ một hệ thống tác tử khác)
title: Di chuyển
x-i18n:
    generated_at: "2026-05-06T09:05:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ một hệ thống tác tử khác thông qua nhà cung cấp di chuyển do Plugin sở hữu. Các nhà cung cấp đi kèm bao phủ trạng thái Codex CLI, [Claude](/vi/install/migrating-claude), và [Hermes](/vi/install/migrating-hermes); Plugin bên thứ ba có thể đăng ký các nhà cung cấp bổ sung.

<Tip>
Để xem hướng dẫn dành cho người dùng, xem [Di chuyển từ Claude](/vi/install/migrating-claude) và [Di chuyển từ Hermes](/vi/install/migrating-hermes). [Trung tâm di chuyển](/vi/install/migrating) liệt kê tất cả đường dẫn.
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
  Tạo kế hoạch và thoát mà không thay đổi trạng thái.
</ParamField>
<ParamField path="--from <path>" type="string">
  Ghi đè thư mục trạng thái nguồn. Hermes mặc định là `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Nhập thông tin xác thực được hỗ trợ. Mặc định tắt.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Cho phép áp dụng thay thế các đích hiện có khi kế hoạch báo cáo xung đột.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bỏ qua lời nhắc xác nhận. Bắt buộc trong chế độ không tương tác.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Chọn một mục sao chép skill theo tên skill hoặc id mục. Lặp lại cờ này để di chuyển nhiều skills. Khi bỏ qua, các lần di chuyển Codex tương tác hiển thị bộ chọn hộp kiểm và các lần di chuyển không tương tác giữ tất cả skills đã lên kế hoạch.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Bỏ qua bản sao lưu trước khi áp dụng. Yêu cầu `--force` khi trạng thái OpenClaw cục bộ tồn tại.
</ParamField>
<ParamField path="--force" type="boolean">
  Bắt buộc cùng với `--no-backup` khi việc áp dụng nếu không sẽ từ chối bỏ qua sao lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In kế hoạch hoặc kết quả áp dụng dưới dạng JSON. Với `--json` và không có `--yes`, apply in kế hoạch và không thay đổi trạng thái.
</ParamField>

## Mô hình an toàn

`openclaw migrate` ưu tiên xem trước.

<AccordionGroup>
  <Accordion title="Xem trước trước khi áp dụng">
    Nhà cung cấp trả về một kế hoạch được liệt kê theo mục trước khi có bất kỳ thay đổi nào, bao gồm xung đột, mục bị bỏ qua, và mục nhạy cảm. Kế hoạch JSON, đầu ra áp dụng, và báo cáo di chuyển che các khóa lồng nhau trông giống bí mật như khóa API, token, tiêu đề ủy quyền, cookie, và mật khẩu.

    `openclaw migrate apply <provider>` xem trước kế hoạch và nhắc trước khi thay đổi trạng thái trừ khi `--yes` được đặt. Trong chế độ không tương tác, apply yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Bản sao lưu">
    Apply tạo và xác minh một bản sao lưu OpenClaw trước khi áp dụng quá trình di chuyển. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu bị bỏ qua và quá trình di chuyển có thể tiếp tục. Để bỏ qua sao lưu khi trạng thái tồn tại, truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Xung đột">
    Apply từ chối tiếp tục khi kế hoạch có xung đột. Xem lại kế hoạch, sau đó chạy lại với `--overwrite` nếu việc thay thế các đích hiện có là có chủ đích. Nhà cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
  </Accordion>
  <Accordion title="Bí mật">
    Bí mật không bao giờ được nhập theo mặc định. Dùng `--include-secrets` để nhập thông tin xác thực được hỗ trợ.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp Claude

Nhà cung cấp Claude đi kèm phát hiện trạng thái Claude Code tại `~/.claude` theo mặc định. Dùng `--from <path>` để nhập một thư mục chính hoặc gốc dự án Claude Code cụ thể.

<Tip>
Để xem hướng dẫn dành cho người dùng, xem [Di chuyển từ Claude](/vi/install/migrating-claude).
</Tip>

### Claude nhập những gì

- `CLAUDE.md` của dự án và `.claude/CLAUDE.md` vào không gian làm việc tác tử OpenClaw.
- `~/.claude/CLAUDE.md` của người dùng được nối vào `USER.md` của không gian làm việc.
- Định nghĩa máy chủ MCP từ `.mcp.json` của dự án, Claude Code `~/.claude.json`, và Claude Desktop `claude_desktop_config.json`.
- Thư mục skill Claude bao gồm `SKILL.md`.
- Tệp Markdown lệnh Claude được chuyển đổi thành skills OpenClaw chỉ với cách gọi thủ công.

### Trạng thái lưu trữ và cần xem xét thủ công

Hooks, quyền, giá trị mặc định môi trường, bộ nhớ cục bộ, quy tắc theo phạm vi đường dẫn, tác tử con, bộ nhớ đệm, kế hoạch, và lịch sử dự án của Claude được giữ trong báo cáo di chuyển hoặc được báo cáo là mục cần xem xét thủ công. OpenClaw không thực thi hooks, sao chép allowlists rộng, hoặc tự động nhập trạng thái thông tin xác thực OAuth/Desktop.

## Nhà cung cấp Codex

Nhà cung cấp Codex đi kèm phát hiện trạng thái Codex CLI tại `~/.codex` theo mặc định, hoặc
tại `CODEX_HOME` khi biến môi trường đó được đặt. Dùng `--from <path>` để
kiểm kê một thư mục chính Codex cụ thể.

Dùng nhà cung cấp này khi chuyển sang OpenClaw Codex harness và bạn muốn
chủ đích đưa các tài sản Codex CLI cá nhân hữu ích lên dùng. Các lần khởi chạy máy chủ ứng dụng Codex cục bộ
dùng các thư mục `CODEX_HOME` và `HOME` theo từng tác tử, nên mặc định chúng không đọc
trạng thái Codex CLI cá nhân của bạn.

Chạy `openclaw migrate codex` trong terminal tương tác sẽ xem trước toàn bộ
kế hoạch, sau đó mở bộ chọn hộp kiểm cho các mục sao chép skill trước xác nhận
áp dụng cuối cùng. Dùng `Toggle all on` hoặc `Toggle all off` để chọn hàng loạt;
skills đã lên kế hoạch bắt đầu ở trạng thái được chọn, skills xung đột bắt đầu ở trạng thái không chọn, và `Skip for now`
để nguyên skills mà không áp dụng. Đối với các lần chạy theo script hoặc chính xác, truyền
`--skill <name>` một lần cho mỗi skill, ví dụ:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex nhập những gì

- Thư mục skill Codex CLI dưới `$CODEX_HOME/skills`, loại trừ bộ nhớ đệm
  `.system` của Codex.
- AgentSkills cá nhân dưới `$HOME/.agents/skills`, được sao chép vào không gian làm việc
  tác tử OpenClaw hiện tại khi bạn muốn quyền sở hữu theo từng tác tử.

### Trạng thái Codex cần xem xét thủ công

Plugin gốc của Codex, `config.toml`, và `hooks/hooks.json` gốc không được
kích hoạt tự động. Plugin có thể phơi bày máy chủ MCP, ứng dụng, hooks, hoặc hành vi
thực thi khác, nên nhà cung cấp báo cáo chúng để xem xét thay vì tải
chúng vào OpenClaw. Tệp cấu hình và hook được sao chép vào báo cáo di chuyển
để xem xét thủ công.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes đi kèm phát hiện trạng thái tại `~/.hermes` theo mặc định. Dùng `--from <path>` khi Hermes nằm ở nơi khác.

### Hermes nhập những gì

- Cấu hình mô hình mặc định từ `config.yaml`.
- Các nhà cung cấp mô hình đã cấu hình và endpoint tương thích OpenAI tùy chỉnh từ `providers` và `custom_providers`.
- Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
- `SOUL.md` và `AGENTS.md` vào không gian làm việc tác tử OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối vào các tệp bộ nhớ không gian làm việc.
- Giá trị mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cùng với các mục lưu trữ hoặc cần xem xét thủ công cho nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Skills bao gồm tệp `SKILL.md` dưới `skills/<name>/`.
- Giá trị cấu hình theo từng skill từ `skills.config`.
- Các khóa API được hỗ trợ từ `.env`, chỉ với `--include-secrets`.

### Khóa `.env` được hỗ trợ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn được sao chép vào báo cáo di chuyển để xem xét thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động. Điều này bảo toàn trạng thái mờ hoặc không an toàn mà không giả vờ OpenClaw có thể tự động thực thi hoặc tin cậy nó:

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

Nguồn di chuyển là Plugin. Một Plugin khai báo id nhà cung cấp của nó trong `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Khi chạy, Plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan`, và `apply`. Core sở hữu điều phối CLI, chính sách sao lưu, lời nhắc, đầu ra JSON, và kiểm tra trước xung đột. Core truyền kế hoạch đã xem xét vào `apply(ctx, plan)`, và nhà cung cấp chỉ có thể tạo lại kế hoạch khi đối số đó vắng mặt để tương thích.

Plugin nhà cung cấp có thể dùng `openclaw/plugin-sdk/migration` để xây dựng mục và đếm tóm tắt, cùng với `openclaw/plugin-sdk/migration-runtime` để sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, wrapper config-runtime được lưu đệm, và báo cáo di chuyển.

## Tích hợp onboarding

Onboarding có thể đề xuất di chuyển khi một nhà cung cấp phát hiện nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều dùng cùng nhà cung cấp di chuyển Plugin và vẫn hiển thị bản xem trước trước khi áp dụng.

<Note>
Nhập qua onboarding yêu cầu một thiết lập OpenClaw mới. Đặt lại cấu hình, thông tin xác thực, phiên, và không gian làm việc trước nếu bạn đã có trạng thái cục bộ. Nhập với sao lưu kèm ghi đè hoặc hợp nhất đang được giới hạn bằng feature gate cho các thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn dành cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn dành cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau khi áp dụng di chuyển.
- [Plugins](/vi/tools/plugin): cài đặt và đăng ký Plugin.
