---
read_when:
    - Bạn muốn di chuyển từ Hermes hoặc một hệ thống tác tử khác sang OpenClaw
    - Bạn đang thêm một trình cung cấp di chuyển do plugin sở hữu
summary: Tài liệu tham khảo CLI cho `openclaw migrate` (nhập trạng thái từ một hệ thống tác tử khác)
title: Di chuyển dữ liệu
x-i18n:
    generated_at: "2026-07-12T07:50:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ một hệ thống tác nhân khác thông qua trình cung cấp di chuyển do plugin sở hữu. Các trình cung cấp đi kèm hỗ trợ Claude, Codex CLI và [Hermes](/vi/install/migrating-hermes); các plugin có thể đăng ký thêm trình cung cấp.

<Tip>
Để xem hướng dẫn dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude) và [Di chuyển từ Hermes](/vi/install/migrating-hermes). [Trung tâm di chuyển](/vi/install/migrating) liệt kê tất cả các lộ trình.
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

Chạy `openclaw migrate <provider>` mà không có cờ nào khác sẽ lập kế hoạch, hiển thị bản xem trước và (trong TTY) yêu cầu xác nhận trước khi áp dụng. `openclaw migrate plan <provider>` và `openclaw migrate apply <provider>` tách bước xem trước và áp dụng thành các lệnh con riêng biệt với cùng các cờ.

<ParamField path="<provider>" type="string">
  Tên của trình cung cấp di chuyển đã đăng ký, ví dụ `hermes`. Chạy `openclaw migrate list` để xem các trình cung cấp đã cài đặt.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Tạo kế hoạch rồi thoát mà không thay đổi trạng thái.
</ParamField>
<ParamField path="--from <path>" type="string">
  Ghi đè thư mục trạng thái nguồn. Hermes mặc định dùng `~/.hermes`, Codex mặc định dùng `~/.codex` (hoặc `$CODEX_HOME`), Claude mặc định dùng `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Nhập thông tin xác thực được hỗ trợ mà không yêu cầu xác nhận. Khi áp dụng tương tác, hệ thống sẽ hỏi trước khi nhập thông tin xác thực đăng nhập phát hiện được, với lựa chọn có được chọn mặc định; khi chạy không tương tác, `--yes` yêu cầu `--include-secrets` để nhập chúng.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Bỏ qua việc nhập thông tin xác thực đăng nhập, bao gồm cả lời nhắc tương tác.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Cho phép bước áp dụng thay thế các đích hiện có khi kế hoạch báo cáo xung đột.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bỏ qua lời nhắc xác nhận. Bắt buộc trong chế độ không tương tác.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Chọn một mục sao chép skill theo tên skill hoặc mã mục. Lặp lại cờ để di chuyển nhiều skill. Khi bỏ qua, quá trình di chuyển Codex tương tác sẽ hiển thị bộ chọn hộp kiểm, còn quá trình di chuyển không tương tác sẽ giữ lại tất cả skill đã lên kế hoạch.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Chọn một mục cài đặt plugin Codex theo tên plugin hoặc mã mục. Lặp lại cờ để di chuyển nhiều plugin Codex. Khi bỏ qua, quá trình di chuyển Codex tương tác sẽ hiển thị bộ chọn hộp kiểm plugin Codex gốc, còn quá trình di chuyển không tương tác sẽ giữ lại tất cả plugin đã lên kế hoạch. Chỉ áp dụng cho các plugin Codex `openai-curated` được cài đặt từ nguồn và do kho kiểm kê app-server Codex phát hiện.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Chỉ dành cho Codex. Buộc duyệt mới `app/list` trên app-server Codex nguồn trước khi lên kế hoạch kích hoạt plugin gốc. Mặc định tắt để giữ cho việc lập kế hoạch di chuyển diễn ra nhanh.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Đường dẫn hoặc thư mục lưu trữ bản sao lưu trước khi di chuyển. Được chuyển tiếp đến `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Bỏ qua bản sao lưu trước khi áp dụng. Yêu cầu `--force` khi trạng thái OpenClaw cục bộ tồn tại.
</ParamField>
<ParamField path="--force" type="boolean">
  Bắt buộc cùng với `--no-backup` khi bước áp dụng lẽ ra sẽ từ chối bỏ qua bản sao lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In kế hoạch hoặc kết quả áp dụng dưới dạng JSON. Với `--json` nhưng không có `--yes`, bước áp dụng sẽ in kế hoạch và không thay đổi trạng thái.
</ParamField>

## Mô hình an toàn

`openclaw migrate` ưu tiên xem trước.

<AccordionGroup>
  <Accordion title="Xem trước khi áp dụng">
    Trình cung cấp trả về kế hoạch chi tiết theo từng mục trước khi có bất kỳ thay đổi nào, bao gồm xung đột, mục bị bỏ qua và mục nhạy cảm. Các kế hoạch JSON, đầu ra áp dụng và báo cáo di chuyển sẽ che các khóa lồng nhau có vẻ chứa bí mật, chẳng hạn như khóa API, token, tiêu đề ủy quyền, cookie và mật khẩu.

    `openclaw migrate apply <provider>` hiển thị bản xem trước kế hoạch và yêu cầu xác nhận trước khi thay đổi trạng thái, trừ khi đặt `--yes`. Trong chế độ không tương tác, bước áp dụng yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Bản sao lưu">
    Bước áp dụng tạo và xác minh bản sao lưu OpenClaw trước khi thực hiện di chuyển. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu sẽ bị bỏ qua và quá trình di chuyển tiếp tục. Để bỏ qua bản sao lưu khi có trạng thái, hãy truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Xung đột">
    Bước áp dụng từ chối tiếp tục khi kế hoạch có xung đột. Hãy xem lại kế hoạch, sau đó chạy lại với `--overwrite` nếu bạn chủ ý thay thế các đích hiện có. Trình cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè vào thư mục báo cáo di chuyển.
  </Accordion>
  <Accordion title="Bí mật">
    Khi áp dụng tương tác, hệ thống hỏi có nhập thông tin xác thực đăng nhập phát hiện được hay không, với lựa chọn có được chọn mặc định. Dùng `--no-auth-credentials` để bỏ qua chúng hoặc `--include-secrets` để nhập thông tin xác thực không cần giám sát cùng với `--yes`.
  </Accordion>
</AccordionGroup>

## Trình cung cấp Claude

Trình cung cấp Claude đi kèm mặc định phát hiện trạng thái Claude Code tại `~/.claude`. Dùng `--from <path>` để nhập một thư mục chính hoặc thư mục gốc dự án Claude Code cụ thể.

<Tip>
Để xem hướng dẫn dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude).
</Tip>

### Nội dung Claude nhập

- `CLAUDE.md` và `.claude/CLAUDE.md` của dự án vào không gian làm việc của tác nhân OpenClaw (`AGENTS.md`).
- `~/.claude/CLAUDE.md` của người dùng được nối thêm vào `USER.md` trong không gian làm việc.
- Định nghĩa máy chủ MCP từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code (bao gồm các mục riêng theo từng dự án) và `claude_desktop_config.json` của Claude Desktop.
- Các thư mục skill Claude có chứa `SKILL.md` (`~/.claude/skills` của người dùng và `.claude/skills` của dự án).
- Các tệp Markdown lệnh Claude (`~/.claude/commands` của người dùng và `.claude/commands` của dự án) được chuyển đổi thành skill OpenClaw chỉ cho phép gọi thủ công.

### Trạng thái lưu trữ và cần xem xét thủ công

Hook, quyền, giá trị mặc định của môi trường, `CLAUDE.local.md` của dự án, `.claude/rules`, các thư mục `agents/` của người dùng và dự án, cùng lịch sử dự án (`projects`, `cache`, `plans` trong `~/.claude`) được bảo tồn trong báo cáo di chuyển hoặc được báo cáo là các mục cần xem xét thủ công. OpenClaw không tự động thực thi hook, sao chép danh sách cho phép phạm vi rộng hoặc nhập trạng thái thông tin xác thực OAuth/Desktop.

## Trình cung cấp Codex

Trình cung cấp Codex đi kèm mặc định phát hiện trạng thái Codex CLI tại `~/.codex`, hoặc tại `CODEX_HOME` khi biến môi trường đó được đặt. Dùng `--from <path>` để kiểm kê một thư mục chính Codex cụ thể.

Dùng trình cung cấp này khi chuyển sang bộ khung Codex của OpenClaw và muốn chủ động đưa các tài sản Codex CLI cá nhân hữu ích vào sử dụng. Các lần khởi chạy app-server Codex cục bộ sử dụng `CODEX_HOME` riêng cho từng tác nhân, vì vậy mặc định chúng không đọc `~/.codex` cá nhân của bạn. Tiến trình vẫn kế thừa `HOME` thông thường, nên Codex có thể thấy các skill/mục chợ plugin dùng chung trong `$HOME/.agents/*`, còn các tiến trình con có thể tìm thấy cấu hình và token trong thư mục chính của người dùng.

Chạy `openclaw migrate codex` trong thiết bị đầu cuối tương tác sẽ hiển thị bản xem trước của toàn bộ kế hoạch, sau đó mở các bộ chọn hộp kiểm trước bước xác nhận áp dụng cuối cùng. Các mục sao chép skill được hỏi trước. Dùng `Toggle all on` hoặc `Toggle all off` để chọn hàng loạt. Nhấn phím Cách để chuyển đổi các hàng hoặc Enter để kích hoạt hàng đang được tô sáng và tiếp tục. Các skill đã lên kế hoạch ban đầu được chọn, các skill xung đột ban đầu không được chọn, còn `Skip for now` sẽ bỏ qua việc sao chép skill trong lần chạy này nhưng vẫn tiếp tục đến bước chọn plugin. Khi có thể di chuyển các plugin Codex tuyển chọn được cài đặt từ nguồn và không cung cấp `--plugin`, quá trình di chuyển tiếp theo sẽ yêu cầu kích hoạt plugin Codex gốc theo tên plugin. Các mục plugin ban đầu được chọn, trừ khi cấu hình plugin Codex OpenClaw đích đã có plugin đó. Các plugin đã tồn tại ở đích ban đầu không được chọn và hiển thị gợi ý xung đột như `conflict: plugin exists`; chọn `Toggle all off` để không di chuyển plugin Codex gốc nào trong lần chạy đó hoặc `Skip for now` để dừng trước khi áp dụng.

Đối với các lần chạy theo tập lệnh hoặc yêu cầu chính xác, hãy chọn rõ một hoặc nhiều skill hay plugin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Nội dung Codex nhập

- Các thư mục skill Codex CLI trong `$CODEX_HOME/skills`, ngoại trừ bộ nhớ đệm `.system` của Codex.
- AgentSkills cá nhân trong `$HOME/.agents/skills`, được sao chép vào không gian làm việc của tác nhân OpenClaw hiện tại để mỗi tác nhân sở hữu riêng.
- Các plugin Codex `openai-curated` được cài đặt từ nguồn và phát hiện qua `plugin/list` của app-server Codex. Việc lập kế hoạch đọc `plugin/read` cho từng plugin đã cài đặt và bật.

Quá trình di chuyển plugin có ứng dụng hỗ trợ có thêm các điều kiện kiểm soát:

- Plugin có ứng dụng hỗ trợ yêu cầu tài khoản app-server Codex nguồn phải là tài khoản đăng ký ChatGPT. Phản hồi không phải tài khoản ChatGPT hoặc thiếu tài khoản sẽ bị bỏ qua với `codex_subscription_required`.
- Theo mặc định, quá trình di chuyển không gọi `app/list` nguồn, vì vậy các plugin có ứng dụng hỗ trợ vượt qua điều kiện tài khoản sẽ được lên kế hoạch mà không xác minh khả năng truy cập ứng dụng nguồn, còn lỗi truyền tải khi tra cứu tài khoản sẽ bị bỏ qua với `codex_account_unavailable`.
- Truyền `--verify-plugin-apps` để buộc tạo ảnh chụp mới từ `app/list` nguồn và yêu cầu mọi ứng dụng được sở hữu đều phải hiện diện, được bật và có thể truy cập trước khi lên kế hoạch kích hoạt gốc. Trong chế độ đó, lỗi truyền tải khi tra cứu tài khoản sẽ chuyển sang bước xác minh kho ứng dụng nguồn. Ảnh chụp chỉ được giữ trong bộ nhớ cho tiến trình hiện tại; nó không bao giờ được ghi vào đầu ra di chuyển hoặc cấu hình đích.

Các plugin bị tắt, chi tiết plugin không thể đọc, tài khoản nguồn bị giới hạn bởi gói đăng ký và (khi đặt `--verify-plugin-apps`) ứng dụng bị thiếu, bị tắt hoặc không thể truy cập sẽ trở thành các mục bị bỏ qua thủ công với lý do có kiểu thay vì thành mục cấu hình đích. Bước áp dụng gọi `plugin/install` trên app-server cho từng plugin đủ điều kiện đã chọn, ngay cả khi app-server đích đã báo cáo plugin đó được cài đặt và bật. Các plugin Codex đã di chuyển chỉ dùng được trong những phiên chọn bộ khung Codex gốc; chúng không được cung cấp cho các lần chạy trình cung cấp OpenClaw, liên kết cuộc hội thoại ACP hoặc các bộ khung khác.

### Trạng thái Codex cần xem xét thủ công

`config.toml` của Codex, `hooks/hooks.json` gốc, các chợ không được tuyển chọn, các gói plugin lưu trong bộ nhớ đệm không phải plugin tuyển chọn được cài đặt từ nguồn và các plugin được cài đặt từ nguồn nhưng không vượt qua điều kiện đăng ký nguồn sẽ không được kích hoạt tự động. Khi đặt `--verify-plugin-apps`, các plugin không vượt qua điều kiện kho ứng dụng nguồn cũng bị bỏ qua. Tất cả những mục này được sao chép hoặc báo cáo trong báo cáo di chuyển để xem xét thủ công.

Đối với các plugin tuyển chọn được cài đặt từ nguồn đã di chuyển, bước áp dụng ghi:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- một mục plugin rõ ràng có `marketplaceName: "openai-curated"` và `pluginName` cho mỗi plugin đã chọn

Quá trình di chuyển không bao giờ ghi `plugins["*"]` và không bao giờ lưu đường dẫn bộ nhớ đệm chợ cục bộ.

Các plugin bị bỏ qua sẽ không được ghi vào cấu hình đích. Lỗi đăng ký thuê bao ở phía nguồn được báo cáo trên các mục thủ công với lý do có kiểu: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` hoặc `plugin_read_unavailable`. Với `--verify-plugin-apps`, lỗi kiểm kê ứng dụng nguồn cũng có thể xuất hiện dưới dạng `app_inaccessible`, `app_disabled`, `app_missing` hoặc `app_inventory_unavailable`. Các lượt cài đặt yêu cầu xác thực ở phía đích được báo cáo trên mục plugin bị ảnh hưởng với `status: "skipped"`, `reason: "auth_required"` và mã định danh ứng dụng đã được làm sạch; các mục cấu hình tường minh của chúng được ghi ở trạng thái tắt cho đến khi bạn ủy quyền lại và bật chúng. Các lỗi cài đặt khác được trả về dưới dạng kết quả `error` theo từng mục.

Nếu kiểm kê plugin của máy chủ ứng dụng Codex không khả dụng trong quá trình lập kế hoạch, quá trình di chuyển sẽ chuyển sang dùng các mục tư vấn từ gói được lưu trong bộ nhớ đệm thay vì làm thất bại toàn bộ quá trình di chuyển.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes đi kèm mặc định phát hiện trạng thái tại `~/.hermes`. Dùng `--from <path>` khi Hermes nằm ở nơi khác.

### Những nội dung Hermes nhập

- Cấu hình mô hình mặc định từ `config.yaml`.
- Các nhà cung cấp mô hình đã cấu hình và điểm cuối tùy chỉnh tương thích với OpenAI từ `providers` và `custom_providers`.
- Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
- `SOUL.md` và `AGENTS.md` vào không gian làm việc của tác nhân OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối thêm vào các tệp bộ nhớ của không gian làm việc.
- Giá trị mặc định của cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cùng với các mục lưu trữ hoặc xem xét thủ công dành cho nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Skills có tệp `SKILL.md` trong `skills/<name>/`.
- Giá trị cấu hình riêng cho từng Skills từ `skills.config`.
- Thông tin xác thực OAuth OpenAI của OpenCode từ `auth.json` của OpenCode khi việc di chuyển thông tin xác thực tương tác được chấp nhận hoặc khi đặt `--include-secrets`. Các mục OAuth trong `auth.json` của Hermes là trạng thái cũ được báo cáo để xác thực lại OpenAI theo cách thủ công hoặc sửa chữa bằng doctor.
- Các khóa API và token được hỗ trợ từ `.env` của Hermes và `auth.json` của OpenCode khi việc di chuyển thông tin xác thực tương tác được chấp nhận hoặc khi đặt `--include-secrets`.

### Các khóa `.env` được hỗ trợ

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn sẽ được sao chép vào báo cáo di chuyển để xem xét thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động. Điều này bảo toàn trạng thái không rõ ràng hoặc không an toàn mà không giả vờ rằng OpenClaw có thể tự động thực thi hoặc tin cậy trạng thái đó: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Sau khi áp dụng

```bash
openclaw doctor
```

## Hợp đồng Plugin

Các nguồn di chuyển là plugin. Một plugin khai báo mã định danh nhà cung cấp trong `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Trong thời gian chạy, plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan` và `apply`. Phần lõi sở hữu việc điều phối CLI, chính sách sao lưu, lời nhắc, đầu ra JSON và kiểm tra xung đột trước. Phần lõi truyền kế hoạch đã được xem xét vào `apply(ctx, plan)` và nhà cung cấp chỉ có thể dựng lại kế hoạch khi đối số đó không có mặt nhằm đảm bảo tính tương thích.

Plugin nhà cung cấp có thể dùng `openclaw/plugin-sdk/migration` để tạo mục và đếm số liệu tóm tắt, cùng với `openclaw/plugin-sdk/migration-runtime` để sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, dùng trình bao bọc thời gian chạy cấu hình được lưu trong bộ nhớ đệm và tạo báo cáo di chuyển.

## Tích hợp quy trình thiết lập ban đầu

Quy trình thiết lập ban đầu có thể đề xuất di chuyển khi một nhà cung cấp phát hiện nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều dùng cùng một nhà cung cấp di chuyển của plugin và vẫn hiển thị bản xem trước trước khi áp dụng.

<Note>
Việc nhập trong quy trình thiết lập ban đầu yêu cầu một thiết lập OpenClaw mới. Trước tiên, hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc nếu bạn đã có trạng thái cục bộ. Các thao tác nhập theo kiểu sao lưu rồi ghi đè hoặc hợp nhất đều bị giới hạn bởi cờ tính năng đối với các thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn dành cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn dành cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi áp dụng quá trình di chuyển.
- [Plugin](/vi/tools/plugin): cài đặt và đăng ký plugin.
