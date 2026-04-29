---
read_when:
    - Bạn muốn chuyển từ Hermes hoặc một hệ thống tác tử khác sang OpenClaw
    - Bạn đang thêm một nhà cung cấp chuyển đổi do Plugin sở hữu
summary: Tham chiếu CLI cho `openclaw migrate` (nhập trạng thái từ một hệ thống tác nhân khác)
title: Di chuyển
x-i18n:
    generated_at: "2026-04-29T22:32:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ một hệ thống tác tử khác thông qua nhà cung cấp di chuyển do Plugin sở hữu. Các nhà cung cấp được đóng gói sẵn hỗ trợ [Claude](/vi/install/migrating-claude) và [Hermes](/vi/install/migrating-hermes); các Plugin bên thứ ba có thể đăng ký thêm nhà cung cấp.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude) và [Di chuyển từ Hermes](/vi/install/migrating-hermes). [Trung tâm di chuyển](/vi/install/migrating) liệt kê tất cả các lộ trình.
</Tip>

## Lệnh

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  Cho phép thao tác áp dụng thay thế các đích hiện có khi kế hoạch báo cáo xung đột.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bỏ qua lời nhắc xác nhận. Bắt buộc trong chế độ không tương tác.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Bỏ qua bản sao lưu trước khi áp dụng. Yêu cầu `--force` khi có trạng thái OpenClaw cục bộ.
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
    Nhà cung cấp trả về một kế hoạch theo từng mục trước khi có bất kỳ thay đổi nào, bao gồm xung đột, mục bị bỏ qua và mục nhạy cảm. Kế hoạch JSON, đầu ra áp dụng và báo cáo di chuyển sẽ che các khóa lồng nhau trông giống bí mật, chẳng hạn như khóa API, token, tiêu đề ủy quyền, cookie và mật khẩu.

    `openclaw migrate apply <provider>` xem trước kế hoạch và nhắc xác nhận trước khi thay đổi trạng thái, trừ khi đặt `--yes`. Trong chế độ không tương tác, thao tác áp dụng yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Bản sao lưu">
    Thao tác áp dụng tạo và xác minh một bản sao lưu OpenClaw trước khi áp dụng di chuyển. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu sẽ được bỏ qua và quá trình di chuyển có thể tiếp tục. Để bỏ qua sao lưu khi có trạng thái, hãy truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Xung đột">
    Thao tác áp dụng từ chối tiếp tục khi kế hoạch có xung đột. Xem lại kế hoạch, rồi chạy lại với `--overwrite` nếu bạn cố ý thay thế các đích hiện có. Nhà cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
  </Accordion>
  <Accordion title="Bí mật">
    Bí mật không bao giờ được nhập theo mặc định. Dùng `--include-secrets` để nhập thông tin xác thực được hỗ trợ.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp Claude

Nhà cung cấp Claude được đóng gói sẵn phát hiện trạng thái Claude Code tại `~/.claude` theo mặc định. Dùng `--from <path>` để nhập một thư mục chính Claude Code hoặc gốc dự án cụ thể.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude).
</Tip>

### Claude nhập những gì

- `CLAUDE.md` của dự án và `.claude/CLAUDE.md` vào không gian làm việc tác tử OpenClaw.
- `~/.claude/CLAUDE.md` của người dùng được nối thêm vào `USER.md` của không gian làm việc.
- Định nghĩa máy chủ MCP từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code và `claude_desktop_config.json` của Claude Desktop.
- Các thư mục kỹ năng Claude có chứa `SKILL.md`.
- Các tệp Markdown lệnh Claude được chuyển đổi thành kỹ năng OpenClaw chỉ với lời gọi thủ công.

### Trạng thái lưu trữ và cần xem xét thủ công

Hook, quyền, mặc định môi trường, bộ nhớ cục bộ, quy tắc theo phạm vi đường dẫn, tác tử phụ, bộ đệm, kế hoạch và lịch sử dự án của Claude được giữ trong báo cáo di chuyển hoặc được báo cáo là các mục cần xem xét thủ công. OpenClaw không thực thi hook, sao chép allowlist rộng, hoặc tự động nhập trạng thái thông tin xác thực OAuth/Desktop.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes được đóng gói sẵn phát hiện trạng thái tại `~/.hermes` theo mặc định. Dùng `--from <path>` khi Hermes nằm ở nơi khác.

### Hermes nhập những gì

- Cấu hình mô hình mặc định từ `config.yaml`.
- Các nhà cung cấp mô hình đã cấu hình và endpoint tùy chỉnh tương thích OpenAI từ `providers` và `custom_providers`.
- Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
- `SOUL.md` và `AGENTS.md` vào không gian làm việc tác tử OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối thêm vào các tệp bộ nhớ của không gian làm việc.
- Mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cộng với các mục lưu trữ hoặc cần xem xét thủ công cho nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Skills có chứa tệp `SKILL.md` trong `skills/<name>/`.
- Giá trị cấu hình theo từng kỹ năng từ `skills.config`.
- Các khóa API được hỗ trợ từ `.env`, chỉ với `--include-secrets`.

### Các khóa `.env` được hỗ trợ

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn sẽ được sao chép vào báo cáo di chuyển để xem xét thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động. Điều này bảo toàn trạng thái mờ hoặc không an toàn mà không giả vờ rằng OpenClaw có thể tự động thực thi hoặc tin cậy trạng thái đó:

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

Trong thời gian chạy, Plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan` và `apply`. Core sở hữu điều phối CLI, chính sách sao lưu, lời nhắc, đầu ra JSON và kiểm tra trước xung đột. Core truyền kế hoạch đã được xem xét vào `apply(ctx, plan)`, và nhà cung cấp chỉ có thể dựng lại kế hoạch khi thiếu đối số đó để tương thích.

Plugin nhà cung cấp có thể dùng `openclaw/plugin-sdk/migration` để tạo mục và đếm tóm tắt, cộng với `openclaw/plugin-sdk/migration-runtime` để sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, wrapper config-runtime được lưu đệm và báo cáo di chuyển.

## Tích hợp onboarding

Onboarding có thể đề xuất di chuyển khi nhà cung cấp phát hiện một nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều dùng cùng nhà cung cấp di chuyển Plugin và vẫn hiển thị bản xem trước trước khi áp dụng.

<Note>
Nhập bằng onboarding yêu cầu một thiết lập OpenClaw mới. Hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc trước nếu bạn đã có trạng thái cục bộ. Nhập theo kiểu sao lưu-cộng-ghi đè hoặc hợp nhất được kiểm soát bằng cờ tính năng cho các thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn từng bước dành cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn từng bước dành cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang một máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi áp dụng di chuyển.
- [Plugins](/vi/tools/plugin): cài đặt và đăng ký Plugin.
