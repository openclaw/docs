---
read_when:
    - Bạn muốn di chuyển từ Hermes hoặc một hệ thống tác tử khác sang OpenClaw
    - Bạn đang thêm một trình cung cấp migration do Plugin sở hữu
summary: Tham chiếu CLI cho `openclaw migrate` (nhập trạng thái từ một hệ thống agent khác)
title: Di chuyển
x-i18n:
    generated_at: "2026-06-27T17:18:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ một hệ thống tác tử khác thông qua nhà cung cấp di chuyển do Plugin sở hữu. Các nhà cung cấp đi kèm bao gồm trạng thái Codex CLI, [Claude](/vi/install/migrating-claude) và [Hermes](/vi/install/migrating-hermes); các Plugin bên thứ ba có thể đăng ký thêm nhà cung cấp.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude) và [Di chuyển từ Hermes](/vi/install/migrating-hermes). [Trung tâm di chuyển](/vi/install/migrating) liệt kê tất cả đường dẫn.
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
  Nhập thông tin xác thực được hỗ trợ mà không nhắc. Áp dụng ở chế độ tương tác sẽ hỏi trước khi nhập thông tin xác thực auth được phát hiện, với lựa chọn có được chọn theo mặc định; `--yes` không tương tác yêu cầu `--include-secrets` để nhập các thông tin đó.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Bỏ qua việc nhập thông tin xác thực auth, bao gồm cả lời nhắc tương tác.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Cho phép apply thay thế các đích hiện có khi kế hoạch báo cáo xung đột.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bỏ qua lời nhắc xác nhận. Bắt buộc trong chế độ không tương tác.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Chọn một mục sao chép skill theo tên skill hoặc mã mục. Lặp lại cờ này để di chuyển nhiều skill. Khi bỏ qua, các lượt di chuyển Codex tương tác hiển thị bộ chọn hộp kiểm và các lượt di chuyển không tương tác giữ tất cả skill đã lên kế hoạch.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Chọn một mục cài đặt Plugin Codex theo tên Plugin hoặc mã mục. Lặp lại cờ này để di chuyển nhiều Plugin Codex. Khi bỏ qua, các lượt di chuyển Codex tương tác hiển thị bộ chọn hộp kiểm Plugin Codex gốc và các lượt di chuyển không tương tác giữ tất cả Plugin đã lên kế hoạch. Điều này chỉ áp dụng cho các Plugin Codex `openai-curated` được cài đặt từ nguồn, do kho ứng dụng Codex app-server phát hiện.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Chỉ Codex. Buộc duyệt `app/list` mới từ Codex app-server nguồn trước khi lập kế hoạch kích hoạt Plugin gốc. Tắt theo mặc định để giữ quá trình lập kế hoạch di chuyển nhanh.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Bỏ qua bản sao lưu trước khi áp dụng. Yêu cầu `--force` khi trạng thái OpenClaw cục bộ tồn tại.
</ParamField>
<ParamField path="--force" type="boolean">
  Bắt buộc đi kèm `--no-backup` khi apply nếu không sẽ từ chối bỏ qua sao lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In kế hoạch hoặc kết quả apply dưới dạng JSON. Với `--json` và không có `--yes`, apply in kế hoạch và không thay đổi trạng thái.
</ParamField>

## Mô hình an toàn

`openclaw migrate` ưu tiên xem trước.

<AccordionGroup>
  <Accordion title="Preview before apply">
    Nhà cung cấp trả về kế hoạch được liệt kê theo từng mục trước khi có bất cứ thay đổi nào, bao gồm xung đột, mục bị bỏ qua và mục nhạy cảm. Kế hoạch JSON, đầu ra apply và báo cáo di chuyển sẽ che các khóa lồng nhau trông giống bí mật như khóa API, token, tiêu đề ủy quyền, cookie và mật khẩu.

    `openclaw migrate apply <provider>` xem trước kế hoạch và nhắc trước khi thay đổi trạng thái trừ khi đặt `--yes`. Trong chế độ không tương tác, apply yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Apply tạo và xác minh một bản sao lưu OpenClaw trước khi áp dụng di chuyển. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu sẽ được bỏ qua và quá trình di chuyển có thể tiếp tục. Để bỏ qua bản sao lưu khi trạng thái tồn tại, truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Conflicts">
    Apply từ chối tiếp tục khi kế hoạch có xung đột. Xem lại kế hoạch, rồi chạy lại với `--overwrite` nếu việc thay thế các đích hiện có là có chủ ý. Nhà cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
  </Accordion>
  <Accordion title="Secrets">
    Apply tương tác hỏi có nhập thông tin xác thực auth được phát hiện hay không, với lựa chọn có được chọn theo mặc định. Dùng `--no-auth-credentials` để bỏ qua chúng, hoặc dùng `--include-secrets` để nhập thông tin xác thực không cần giám sát với `--yes`.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp Claude

Nhà cung cấp Claude đi kèm phát hiện trạng thái Claude Code tại `~/.claude` theo mặc định. Dùng `--from <path>` để nhập một thư mục home hoặc gốc dự án Claude Code cụ thể.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude).
</Tip>

### Claude nhập những gì

- `CLAUDE.md` của dự án và `.claude/CLAUDE.md` vào không gian làm việc tác tử OpenClaw.
- `~/.claude/CLAUDE.md` của người dùng được nối vào `USER.md` của không gian làm việc.
- Định nghĩa máy chủ MCP từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code và `claude_desktop_config.json` của Claude Desktop.
- Các thư mục skill Claude có chứa `SKILL.md`.
- Các tệp Markdown lệnh Claude được chuyển đổi thành skill OpenClaw chỉ gọi thủ công.

### Trạng thái lưu trữ và cần xem xét thủ công

Hook Claude, quyền, mặc định môi trường, bộ nhớ cục bộ, quy tắc theo phạm vi đường dẫn, tác tử con, cache, kế hoạch và lịch sử dự án được giữ trong báo cáo di chuyển hoặc được báo cáo là mục cần xem xét thủ công. OpenClaw không tự động thực thi hook, sao chép danh sách cho phép rộng, hoặc nhập trạng thái thông tin xác thực OAuth/Desktop.

## Nhà cung cấp Codex

Nhà cung cấp Codex đi kèm phát hiện trạng thái Codex CLI tại `~/.codex` theo mặc định, hoặc
tại `CODEX_HOME` khi biến môi trường đó được đặt. Dùng `--from <path>` để
kiểm kê một thư mục home Codex cụ thể.

Dùng nhà cung cấp này khi chuyển sang bộ khung Codex của OpenClaw và bạn muốn
chủ động đưa các tài sản Codex CLI cá nhân hữu ích vào sử dụng. Các lần khởi chạy Codex app-server cục bộ
dùng `CODEX_HOME` theo từng tác tử, nên theo mặc định chúng không đọc
`~/.codex` cá nhân của bạn. Quy trình thông thường vẫn kế thừa `HOME`, vì vậy Codex
có thể thấy các mục marketplace skill/Plugin dùng chung trong `$HOME/.agents/*` và
tiến trình con có thể tìm thấy cấu hình và token trong thư mục home người dùng.

Chạy `openclaw migrate codex` trong terminal tương tác sẽ xem trước toàn bộ
kế hoạch, rồi mở các bộ chọn hộp kiểm trước xác nhận apply cuối cùng. Các mục
sao chép skill được nhắc trước. Dùng `Toggle all on` hoặc `Toggle all off` để chọn hàng loạt.
Nhấn Space để bật/tắt các hàng, hoặc nhấn Enter để kích hoạt hàng đang được tô sáng
và tiếp tục. Các skill đã lên kế hoạch bắt đầu ở trạng thái được chọn, các skill xung đột bắt đầu không được chọn, và
`Skip for now` bỏ qua các bản sao skill cho lần chạy này trong khi vẫn tiếp tục đến phần chọn Plugin.
Khi các Plugin Codex curated được cài đặt từ nguồn có thể di chuyển được và
chưa cung cấp `--plugin`, di chuyển sau đó nhắc kích hoạt Plugin Codex gốc
theo tên Plugin. Các mục Plugin
bắt đầu ở trạng thái được chọn trừ khi cấu hình Plugin Codex của OpenClaw đích đã có
Plugin đó. Các Plugin đích hiện có bắt đầu không được chọn và hiển thị gợi ý xung đột như
`conflict: plugin exists`; chọn `Toggle all off` để không di chuyển Plugin Codex gốc nào
trong lần chạy đó, hoặc `Skip for now` để dừng trước khi áp dụng. Với các lần chạy có kịch bản hoặc
chính xác, truyền `--skill <name>` một lần cho mỗi skill, ví dụ:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Dùng `--plugin <name>` để giới hạn di chuyển Plugin Codex gốc không tương tác
ở một hoặc nhiều Plugin curated được cài đặt từ nguồn:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex nhập những gì

- Các thư mục skill Codex CLI dưới `$CODEX_HOME/skills`, loại trừ cache
  `.system` của Codex.
- AgentSkills cá nhân dưới `$HOME/.agents/skills`, được sao chép vào không gian làm việc
  tác tử OpenClaw hiện tại khi bạn muốn quyền sở hữu theo từng tác tử.
- Các Plugin Codex `openai-curated` được cài đặt từ nguồn, phát hiện qua
  `plugin/list` của Codex app-server. Việc lập kế hoạch đọc `plugin/read` cho từng
  Plugin đã cài đặt được bật. Plugin dựa trên ứng dụng yêu cầu phản hồi tài khoản
  Codex app-server nguồn là tài khoản đăng ký ChatGPT; phản hồi tài khoản không phải ChatGPT hoặc bị thiếu
  sẽ bị bỏ qua với `codex_subscription_required`. Theo mặc định,
  di chuyển không gọi `app/list` nguồn, nên các Plugin dựa trên ứng dụng vượt qua
  cổng tài khoản được lên kế hoạch mà không xác minh khả năng truy cập ứng dụng nguồn, và
  lỗi truyền tải tra cứu tài khoản bị bỏ qua với `codex_account_unavailable`. Truyền
  `--verify-plugin-apps` khi bạn muốn di chuyển buộc tạo ảnh chụp nhanh
  `app/list` nguồn mới và yêu cầu mọi ứng dụng thuộc sở hữu phải có mặt, được bật và
  có thể truy cập trước khi lập kế hoạch kích hoạt gốc. Trong chế độ đó, lỗi truyền tải
  tra cứu tài khoản sẽ rơi qua bước xác minh kho ứng dụng nguồn. Ảnh chụp nhanh
  kho ứng dụng nguồn được giữ trong bộ nhớ cho quy trình hiện tại; nó
  không được ghi vào đầu ra di chuyển hoặc cấu hình đích. Plugin bị tắt,
  chi tiết Plugin không đọc được, tài khoản nguồn bị chặn bởi đăng ký, và khi
  yêu cầu xác minh, ứng dụng bị thiếu, ứng dụng bị tắt, ứng dụng không truy cập được, hoặc
  lỗi kho ứng dụng nguồn sẽ trở thành các mục thủ công bị bỏ qua với lý do có kiểu
  thay vì các mục cấu hình đích.
  Apply gọi `plugin/install` của app-server cho từng Plugin đủ điều kiện đã chọn,
  ngay cả khi app-server đích đã báo cáo Plugin đó là đã cài đặt và
  được bật. Các Plugin Codex đã di chuyển chỉ có thể dùng trong các phiên chọn
  bộ khung Codex gốc; chúng không được hiển thị cho các lần chạy nhà cung cấp OpenClaw,
  liên kết hội thoại ACP, hoặc các bộ khung khác.

### Trạng thái Codex cần xem xét thủ công

Codex `config.toml`, `hooks/hooks.json` gốc, marketplace không curated, các gói
Plugin được cache không phải Plugin curated được cài đặt từ nguồn, và các Plugin được cài đặt từ nguồn
không vượt qua cổng đăng ký nguồn sẽ không được tự động kích hoạt.
Khi đặt `--verify-plugin-apps`, các Plugin không vượt qua cổng kiểm kê ứng dụng nguồn
cũng bị bỏ qua. Chúng được sao chép hoặc báo cáo trong báo cáo di chuyển để
xem xét thủ công.

Đối với các Plugin curated được cài đặt từ nguồn đã di chuyển, apply ghi:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- một mục Plugin rõ ràng với `marketplaceName: "openai-curated"` và
  `pluginName` cho từng Plugin đã chọn

Quá trình di chuyển không bao giờ ghi `plugins["*"]` và không bao giờ lưu các đường dẫn bộ nhớ đệm marketplace cục bộ. Các lỗi đăng ký ở phía nguồn được báo cáo trên các mục thủ công với lý do có kiểu như `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled`, hoặc `plugin_read_unavailable`. Với `--verify-plugin-apps`, lỗi kiểm kê ứng dụng nguồn cũng có thể xuất hiện dưới dạng `app_inaccessible`, `app_disabled`, `app_missing`, hoặc `app_inventory_unavailable`. Các Plugin bị bỏ qua sẽ không được ghi vào cấu hình đích.
Các cài đặt yêu cầu xác thực ở phía đích được báo cáo trên mục Plugin bị ảnh hưởng với `status: "skipped"`, `reason: "auth_required"`, và mã định danh ứng dụng đã được làm sạch. Các mục cấu hình tường minh của chúng được ghi ở trạng thái tắt cho đến khi bạn ủy quyền lại và bật chúng. Các lỗi cài đặt khác là kết quả `error` theo phạm vi từng mục.

Nếu kiểm kê Plugin máy chủ ứng dụng Codex không khả dụng trong lúc lập kế hoạch, quá trình di chuyển sẽ chuyển sang các mục tư vấn bundle đã lưu trong bộ nhớ đệm thay vì làm hỏng toàn bộ quá trình di chuyển.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes được đóng gói sẵn mặc định phát hiện trạng thái tại `~/.hermes`. Dùng `--from <path>` khi Hermes nằm ở nơi khác.

### Hermes nhập những gì

- Cấu hình mô hình mặc định từ `config.yaml`.
- Các nhà cung cấp mô hình đã cấu hình và endpoint tùy chỉnh tương thích OpenAI từ `providers` và `custom_providers`.
- Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
- `SOUL.md` và `AGENTS.md` vào không gian làm việc agent OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối thêm vào các tệp bộ nhớ không gian làm việc.
- Giá trị mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cùng các mục lưu trữ hoặc cần rà soát thủ công cho nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Skills có tệp `SKILL.md` trong `skills/<name>/`.
- Giá trị cấu hình theo từng Skills từ `skills.config`.
- Thông tin xác thực OAuth OpenAI của OpenCode từ `auth.json` của OpenCode khi chấp nhận di chuyển thông tin xác thực tương tác, hoặc khi đặt `--include-secrets`. Các mục OAuth trong `auth.json` của Hermes là trạng thái cũ được báo cáo để xác thực lại OpenAI thủ công hoặc sửa chữa bằng doctor.
- Các khóa API và token được hỗ trợ từ `.env` của Hermes và `auth.json` của OpenCode khi chấp nhận di chuyển thông tin xác thực tương tác, hoặc khi đặt `--include-secrets`.

### Các khóa `.env` được hỗ trợ

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn được sao chép vào báo cáo di chuyển để rà soát thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động. Điều này bảo toàn trạng thái mờ hoặc không an toàn mà không giả vờ rằng OpenClaw có thể tự động thực thi hoặc tin cậy trạng thái đó:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### Sau khi áp dụng

```bash
openclaw doctor
```

## Hợp đồng Plugin

Nguồn di chuyển là các Plugin. Một Plugin khai báo ID nhà cung cấp của mình trong `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Trong runtime, Plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan`, và `apply`. Core sở hữu điều phối CLI, chính sách sao lưu, prompt, đầu ra JSON, và kiểm tra xung đột trước. Core truyền kế hoạch đã rà soát vào `apply(ctx, plan)`, và nhà cung cấp chỉ có thể dựng lại kế hoạch khi đối số đó vắng mặt vì lý do tương thích.

Plugin nhà cung cấp có thể dùng `openclaw/plugin-sdk/migration` để tạo mục và đếm tóm tắt, cùng `openclaw/plugin-sdk/migration-runtime` để sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, wrapper config-runtime đã lưu trong bộ nhớ đệm, và báo cáo di chuyển.

## Tích hợp hướng dẫn thiết lập

Hướng dẫn thiết lập có thể đề xuất di chuyển khi một nhà cung cấp phát hiện nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều dùng cùng nhà cung cấp di chuyển Plugin và vẫn hiển thị bản xem trước trước khi áp dụng.

<Note>
Nhập trong hướng dẫn thiết lập yêu cầu một thiết lập OpenClaw mới. Hãy đặt lại cấu hình, thông tin xác thực, phiên, và không gian làm việc trước nếu bạn đã có trạng thái cục bộ. Nhập theo kiểu sao lưu rồi ghi đè hoặc nhập hợp nhất được đặt sau cờ tính năng cho các thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn từng bước cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn từng bước cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau khi áp dụng di chuyển.
- [Plugins](/vi/tools/plugin): cài đặt và đăng ký Plugin.
