---
read_when:
    - Bạn muốn di chuyển từ Hermes hoặc một hệ thống tác tử khác sang OpenClaw
    - Bạn đang thêm một trình cung cấp di chuyển do plugin sở hữu
summary: Tài liệu tham khảo CLI cho `openclaw migrate` (nhập trạng thái từ một hệ thống agent khác)
title: Di chuyển dữ liệu
x-i18n:
    generated_at: "2026-07-19T05:47:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdedb1bf6c9def52079c021e4e77fe008c9394ee352bec299bf154687f62e514
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Nhập trạng thái từ một hệ thống tác nhân khác thông qua nhà cung cấp di chuyển do plugin sở hữu. Các nhà cung cấp đi kèm hỗ trợ Claude, Codex CLI và [Hermes](/vi/install/migrating-hermes); các plugin có thể đăng ký thêm nhà cung cấp.

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

Chạy `openclaw migrate <provider>` mà không có cờ nào khác sẽ lập kế hoạch, hiển thị bản xem trước và (trong TTY) nhắc xác nhận trước khi áp dụng. `openclaw migrate plan <provider>` và `openclaw migrate apply <provider>` tách bước xem trước và áp dụng thành các lệnh con riêng biệt với cùng các cờ.

<ParamField path="<provider>" type="string">
  Tên của một nhà cung cấp di chuyển đã đăng ký, ví dụ `hermes`. Chạy `openclaw migrate list` để xem các nhà cung cấp đã cài đặt.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Tạo kế hoạch và thoát mà không thay đổi trạng thái.
</ParamField>
<ParamField path="--from <path>" type="string">
  Ghi đè thư mục trạng thái nguồn. Hermes tuân theo `$HERMES_HOME` và hồ sơ đang hoạt động, sau đó sử dụng giá trị mặc định của nền tảng (`~/.hermes` hoặc `%LOCALAPPDATA%\hermes`). Codex mặc định dùng `~/.codex` (hoặc `$CODEX_HOME`), Claude mặc định dùng `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Nhập thông tin xác thực được hỗ trợ mà không cần nhắc. Khi áp dụng tương tác, hệ thống sẽ hỏi trước khi nhập thông tin xác thực được phát hiện, với lựa chọn có được chọn theo mặc định; trong chế độ không tương tác, `--yes` yêu cầu `--include-secrets` để nhập chúng.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Bỏ qua việc nhập thông tin xác thực, bao gồm cả lời nhắc tương tác.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Cho phép bước áp dụng thay thế các đích hiện có khi kế hoạch báo cáo xung đột.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bỏ qua lời nhắc xác nhận. Bắt buộc trong chế độ không tương tác.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Chọn một mục sao chép skill theo tên skill hoặc ID mục. Lặp lại cờ để di chuyển nhiều skill. Khi bỏ qua, các lần di chuyển Codex tương tác sẽ hiển thị bộ chọn hộp kiểm và các lần di chuyển không tương tác sẽ giữ lại tất cả các skill đã lập kế hoạch.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Chọn một mục cài đặt plugin Codex theo tên plugin hoặc ID mục. Lặp lại cờ để di chuyển nhiều plugin Codex. Khi bỏ qua, các lần di chuyển Codex tương tác sẽ hiển thị bộ chọn hộp kiểm plugin Codex gốc và các lần di chuyển không tương tác sẽ giữ lại tất cả các plugin đã lập kế hoạch. Chỉ áp dụng cho các plugin Codex `openai-curated` được cài đặt từ nguồn và được kho ứng dụng app-server của Codex phát hiện.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Chỉ dành cho Codex. Buộc thực hiện lại quá trình duyệt `app/list` trên app-server Codex nguồn trước khi lập kế hoạch kích hoạt plugin gốc. Tắt theo mặc định để giữ cho việc lập kế hoạch di chuyển diễn ra nhanh chóng.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Đường dẫn hoặc thư mục lưu trữ bản sao lưu trước khi di chuyển. Được chuyển tiếp đến `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Bỏ qua bản sao lưu trước khi áp dụng. Yêu cầu `--force` khi có trạng thái OpenClaw cục bộ.
</ParamField>
<ParamField path="--force" type="boolean">
  Bắt buộc cùng với `--no-backup` khi bước áp dụng lẽ ra sẽ từ chối bỏ qua bản sao lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In kế hoạch hoặc kết quả áp dụng dưới dạng JSON. Khi có `--json` nhưng không có `--yes`, bước áp dụng sẽ in kế hoạch và không thay đổi trạng thái.
</ParamField>

## Mô hình an toàn

`openclaw migrate` ưu tiên xem trước.

<AccordionGroup>
  <Accordion title="Xem trước khi áp dụng">
    Nhà cung cấp trả về một kế hoạch chi tiết theo từng mục trước khi có bất kỳ thay đổi nào, bao gồm các xung đột, mục bị bỏ qua và mục nhạy cảm. Các kế hoạch JSON, đầu ra áp dụng và báo cáo di chuyển sẽ che các khóa lồng nhau có vẻ chứa bí mật, chẳng hạn như khóa API, token, tiêu đề ủy quyền, cookie và mật khẩu.

    `openclaw migrate apply <provider>` hiển thị bản xem trước kế hoạch và nhắc xác nhận trước khi thay đổi trạng thái, trừ khi đặt `--yes`. Trong chế độ không tương tác, bước áp dụng yêu cầu `--yes`.

  </Accordion>
  <Accordion title="Bản sao lưu">
    Bước áp dụng tạo và xác minh bản sao lưu OpenClaw trước khi áp dụng quá trình di chuyển. Nếu chưa có trạng thái OpenClaw cục bộ, bước sao lưu sẽ bị bỏ qua và quá trình di chuyển tiếp tục. Để bỏ qua bản sao lưu khi có trạng thái, hãy truyền cả `--no-backup` và `--force`.
  </Accordion>
  <Accordion title="Xung đột">
    Bước áp dụng từ chối tiếp tục khi kế hoạch có xung đột. Hãy xem lại kế hoạch, sau đó chạy lại với `--overwrite` nếu chủ ý thay thế các đích hiện có. Nhà cung cấp vẫn có thể ghi bản sao lưu ở cấp mục cho các tệp bị ghi đè vào thư mục báo cáo di chuyển.
  </Accordion>
  <Accordion title="Bí mật">
    Khi áp dụng tương tác, hệ thống sẽ hỏi có nhập thông tin xác thực được phát hiện hay không, với lựa chọn có được chọn theo mặc định. Dùng `--no-auth-credentials` để bỏ qua chúng hoặc `--include-secrets` để nhập thông tin xác thực không cần giám sát cùng với `--yes`.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp Claude

Nhà cung cấp Claude đi kèm mặc định phát hiện trạng thái Claude Code tại `~/.claude`. Dùng `--from <path>` để nhập một thư mục chính hoặc thư mục gốc dự án Claude Code cụ thể.

<Tip>
Để xem hướng dẫn từng bước dành cho người dùng, hãy xem [Di chuyển từ Claude](/vi/install/migrating-claude).
</Tip>

### Nội dung Claude nhập

- Markdown bộ nhớ tự động của Claude Code từ `~/.claude/projects/*/memory` và một
  `autoMemoryDirectory` do người dùng cấu hình, được sao chép vào
  `memory/imports/claude-code/` để truy xuất có lập chỉ mục.
- `CLAUDE.md` và `.claude/CLAUDE.md` của dự án vào không gian làm việc của tác nhân OpenClaw (`AGENTS.md`).
- `~/.claude/CLAUDE.md` của người dùng được nối thêm vào `USER.md` của không gian làm việc.
- Các định nghĩa máy chủ MCP từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code (bao gồm các mục theo từng dự án) và `claude_desktop_config.json` của Claude Desktop.
- Các thư mục skill Claude có chứa `SKILL.md` (`~/.claude/skills` của người dùng và `.claude/skills` của dự án).
- Các tệp Markdown lệnh Claude (`~/.claude/commands` của người dùng và `.claude/commands` của dự án) được chuyển đổi thành các skill OpenClaw chỉ cho phép gọi thủ công.

### Trạng thái lưu trữ và xem xét thủ công

Các hook, quyền, giá trị môi trường mặc định của Claude, `CLAUDE.local.md`, `.claude/rules` của dự án, các thư mục `agents/` của người dùng và dự án, cùng lịch sử dự án (`projects`, `cache`, `plans` trong `~/.claude`) được giữ lại trong báo cáo di chuyển hoặc được báo cáo dưới dạng các mục cần xem xét thủ công. OpenClaw không tự động thực thi hook, sao chép các danh sách cho phép diện rộng hoặc nhập trạng thái thông tin xác thực OAuth/Desktop.

## Nhà cung cấp Codex

Nhà cung cấp Codex đi kèm mặc định phát hiện trạng thái Codex CLI tại `~/.codex`, hoặc tại `CODEX_HOME` khi biến môi trường đó được đặt. Dùng `--from <path>` để kiểm kê một thư mục chính Codex cụ thể.

Dùng nhà cung cấp này khi chuyển sang bộ khung Codex của OpenClaw và muốn chủ động đưa các tài sản Codex CLI cá nhân hữu ích vào sử dụng. Các lần khởi chạy app-server Codex cục bộ sử dụng `CODEX_HOME` riêng cho từng tác nhân, vì vậy theo mặc định chúng không đọc `~/.codex` cá nhân của bạn. `HOME` của tiến trình thông thường vẫn được kế thừa, vì vậy Codex có thể thấy các mục skill/thị trường plugin `$HOME/.agents/*` dùng chung và các tiến trình con có thể tìm thấy cấu hình cùng token trong thư mục chính của người dùng.

Chạy `openclaw migrate codex` trong một thiết bị đầu cuối tương tác sẽ hiển thị bản xem trước toàn bộ kế hoạch, sau đó mở các bộ chọn hộp kiểm trước lời nhắc xác nhận áp dụng cuối cùng. Các mục sao chép skill được nhắc trước. Dùng `Toggle all on` hoặc `Toggle all off` để chọn hàng loạt. Nhấn Space để bật hoặc tắt các hàng, hoặc Enter để kích hoạt hàng đang được tô sáng và tiếp tục. Các skill đã lập kế hoạch ban đầu được chọn, các skill xung đột ban đầu không được chọn, và `Skip for now` bỏ qua việc sao chép skill trong lần chạy này nhưng vẫn tiếp tục đến bước chọn plugin. Khi có thể di chuyển các plugin Codex tuyển chọn được cài đặt từ nguồn và chưa cung cấp `--plugin`, quá trình di chuyển sau đó sẽ nhắc kích hoạt plugin Codex gốc theo tên plugin. Các mục plugin ban đầu được chọn, trừ khi cấu hình plugin Codex OpenClaw đích đã có plugin đó. Các plugin hiện có ở đích ban đầu không được chọn và hiển thị gợi ý xung đột như `conflict: plugin exists`; chọn `Toggle all off` để không di chuyển plugin Codex gốc nào trong lần chạy đó, hoặc `Skip for now` để dừng trước khi áp dụng.

Đối với các lần chạy theo tập lệnh hoặc cần độ chính xác tuyệt đối, hãy chọn rõ ràng một hoặc nhiều skill hay plugin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Nội dung Codex nhập

- `MEMORY.md` và `memory_summary.md` Codex đã hợp nhất từ
  `$CODEX_HOME/memories`, được sao chép vào `memory/imports/codex/` để truy xuất
  có lập chỉ mục. Bộ nhớ triển khai thô không được nhập.
- Các thư mục skill Codex CLI trong `$CODEX_HOME/skills`, không bao gồm bộ nhớ đệm `.system` của Codex.
- Các AgentSkills cá nhân trong `$HOME/.agents/skills`, được sao chép vào không gian làm việc của tác nhân OpenClaw hiện tại để sở hữu theo từng tác nhân.
- Các plugin Codex `openai-curated` được cài đặt từ nguồn và phát hiện thông qua `plugin/list` của app-server Codex. Quá trình lập kế hoạch đọc `plugin/read` cho từng plugin đã cài đặt và bật.

Việc di chuyển plugin dựa trên ứng dụng có thêm các điều kiện kiểm soát:

- Các plugin dựa trên ứng dụng yêu cầu tài khoản app-server Codex nguồn phải là tài khoản đăng ký ChatGPT. Các phản hồi cho tài khoản không phải ChatGPT hoặc thiếu tài khoản sẽ bị bỏ qua với `codex_subscription_required`.
- Theo mặc định, quá trình di chuyển không gọi `app/list` nguồn, vì vậy các plugin dựa trên ứng dụng vượt qua điều kiện tài khoản sẽ được lập kế hoạch mà không xác minh khả năng truy cập ứng dụng nguồn, và các lỗi truyền tải khi tra cứu tài khoản sẽ bị bỏ qua với `codex_account_unavailable`.
- Truyền `--verify-plugin-apps` để buộc tạo ảnh chụp nhanh `app/list` nguồn mới và yêu cầu mọi ứng dụng được sở hữu phải hiện diện, được bật và có thể truy cập trước khi lập kế hoạch kích hoạt gốc. Trong chế độ đó, lỗi truyền tải khi tra cứu tài khoản sẽ chuyển sang xác minh kho ứng dụng nguồn. Ảnh chụp nhanh chỉ được giữ trong bộ nhớ cho tiến trình hiện tại; không bao giờ được ghi vào đầu ra di chuyển hoặc cấu hình đích.

Các plugin bị tắt, thông tin chi tiết plugin không đọc được, tài khoản nguồn bị giới hạn theo gói đăng ký và (khi đặt `--verify-plugin-apps`) các ứng dụng bị thiếu, bị tắt hoặc không thể truy cập sẽ trở thành các mục bỏ qua thủ công với lý do được định kiểu thay vì các mục cấu hình đích. Bước áp dụng gọi `plugin/install` của app-server cho từng plugin đủ điều kiện đã chọn, ngay cả khi app-server đích đã báo cáo plugin đó được cài đặt và bật. Các plugin Codex đã di chuyển chỉ có thể sử dụng trong những phiên chọn bộ khung Codex gốc; chúng không được cung cấp cho các lần chạy nhà cung cấp OpenClaw, liên kết cuộc hội thoại ACP hoặc các bộ khung khác.

### Trạng thái Codex cần xem xét thủ công

Codex `config.toml`, `hooks/hooks.json` gốc, các marketplace không được tuyển chọn, các gói plugin được lưu vào bộ nhớ đệm nhưng không phải là plugin được tuyển chọn cài đặt từ nguồn, và các plugin cài đặt từ nguồn không vượt qua cổng kiểm tra đăng ký nguồn sẽ không được kích hoạt tự động. Khi đặt `--verify-plugin-apps`, các plugin không vượt qua cổng kiểm tra danh mục ứng dụng nguồn cũng bị bỏ qua. Tất cả các mục này được sao chép hoặc ghi nhận trong báo cáo di chuyển để review thủ công.

Đối với các plugin được tuyển chọn cài đặt từ nguồn đã di chuyển, áp dụng các thao tác ghi:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- một mục plugin tường minh có `marketplaceName: "openai-curated"` và `pluginName` cho mỗi plugin đã chọn

Quá trình di chuyển không bao giờ ghi `plugins["*"]` và không bao giờ lưu trữ các đường dẫn bộ nhớ đệm marketplace cục bộ.

Các plugin bị bỏ qua không được ghi vào cấu hình đích. Lỗi đăng ký phía nguồn được báo cáo trong các mục thủ công với lý do có kiểu: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` hoặc `plugin_read_unavailable`. Với `--verify-plugin-apps`, lỗi danh mục ứng dụng nguồn cũng có thể xuất hiện dưới dạng `app_inaccessible`, `app_disabled`, `app_missing` hoặc `app_inventory_unavailable`. Các lượt cài đặt phía đích yêu cầu xác thực được báo cáo trong mục plugin bị ảnh hưởng với `status: "skipped"`, `reason: "auth_required"` và các mã định danh ứng dụng đã được làm sạch; các mục cấu hình tường minh của chúng được ghi ở trạng thái tắt cho đến khi bạn cấp quyền lại và bật chúng. Các lỗi cài đặt khác là kết quả `error` có phạm vi theo từng mục.

Nếu danh mục plugin của Codex app-server không khả dụng trong khi lập kế hoạch, quá trình di chuyển sẽ chuyển sang dùng các mục tư vấn từ gói được lưu vào bộ nhớ đệm thay vì làm thất bại toàn bộ quá trình di chuyển.

## Nhà cung cấp Hermes

Nhà cung cấp Hermes đi kèm tuân theo `$HERMES_HOME` và hồ sơ đang hoạt động, sau đó sử dụng giá trị mặc định của nền tảng (`~/.hermes` hoặc `%LOCALAPPDATA%\hermes`). Sử dụng `--from <path>` để ghi đè quá trình khám phá.

### Nội dung Hermes nhập

- Cấu hình mô hình mặc định từ `config.yaml`.
- Các nhà cung cấp mô hình đã cấu hình và các điểm cuối tùy chỉnh tương thích với OpenAI từ `model`, `providers` và `custom_providers`.
- Các định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`. Ánh xạ OpenClaw chính xác bao gồm định tuyến Streamable HTTP mặc định, phạm vi OAuth, xác minh TLS dạng boolean, các đường dẫn chứng chỉ/khóa máy khách riêng biệt và chính sách công cụ gốc/tài nguyên/prompt của Hermes. Các trường thông tin xác thực hoặc runtime chỉ dành cho Hermes nhưng không được hỗ trợ sẽ được báo cáo để review thủ công.
- `SOUL.md` và `AGENTS.md` vào không gian làm việc của agent OpenClaw.
- `memories/MEMORY.md` và `memories/USER.md` được nối thêm vào các tệp bộ nhớ của không gian làm việc.
  Thay vào đó, các bề mặt chỉ dành cho bộ nhớ (trang bộ nhớ khi bắt đầu sử dụng và trang nhập Memory
  của Control UI) sao chép các tệp này vào `memory/imports/hermes/` để
  truy hồi theo chỉ mục mà không tác động đến bộ nhớ hiện có của không gian làm việc.
- Các giá trị mặc định của cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw, cùng với các mục lưu trữ hoặc review thủ công dành cho các nhà cung cấp bộ nhớ bên ngoài như Honcho.
- Các Skills có chứa tệp `SKILL.md` ở bất kỳ đâu bên dưới `skills/`; các skill lồng nhau được làm phẳng vào thư mục skill của không gian làm việc.
- Các giá trị cấu hình theo từng skill từ `skills.config`.
- Thông tin xác thực OAuth OpenAI Codex hiện tại của Hermes và thông tin xác thực OAuth OpenAI của OpenCode khi việc di chuyển thông tin xác thực tương tác được chấp nhận hoặc khi đặt `--include-secrets`. Không để Hermes và OpenClaw sử dụng cùng một quyền cấp làm mới đã nhập.
- Các khóa API và token được hỗ trợ từ Hermes `.env` và OpenCode `auth.json` khi việc di chuyển thông tin xác thực tương tác được chấp nhận hoặc khi đặt `--include-secrets`.

### Các khóa `.env` được hỗ trợ

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `KIMI_CODING_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Trạng thái chỉ lưu trữ

Trạng thái Hermes mà OpenClaw không thể diễn giải an toàn được sao chép vào báo cáo di chuyển để review thủ công, nhưng không được tải vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động. Trạng thái này bao gồm `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `plans/`, `workspace/`, `skins/`, `kanban/`, trạng thái ghép nối/nền tảng, trạng thái định tuyến/tiến trình Gateway và các cơ sở dữ liệu SQLite Hermes được phát hiện.

### Sau khi áp dụng

```bash
openclaw doctor
```

## Hợp đồng plugin

Các nguồn di chuyển là plugin. Một plugin khai báo mã định danh nhà cung cấp của mình trong `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Trong thời gian chạy, plugin gọi `api.registerMigrationProvider(...)`. Nhà cung cấp triển khai `detect`, `plan` và `apply`. Phần lõi sở hữu việc điều phối CLI, chính sách sao lưu, prompt, đầu ra JSON và kiểm tra trước xung đột. Phần lõi truyền kế hoạch đã được review vào `apply(ctx, plan)`, và nhà cung cấp chỉ có thể xây dựng lại kế hoạch khi thiếu đối số đó nhằm đảm bảo tính tương thích.

Các plugin nhà cung cấp có thể sử dụng `openclaw/plugin-sdk/migration` để xây dựng mục và đếm phần tóm tắt, cùng với `openclaw/plugin-sdk/migration-runtime` để sao chép tệp có nhận biết xung đột, sao chép báo cáo chỉ lưu trữ, các trình bao bọc runtime cấu hình được lưu vào bộ nhớ đệm và báo cáo di chuyển.

## Tích hợp quá trình bắt đầu sử dụng

Quá trình bắt đầu sử dụng có thể đề xuất di chuyển khi một nhà cung cấp phát hiện nguồn đã biết. Cả `openclaw onboard --flow import` và `openclaw setup --wizard --import-from hermes` đều sử dụng cùng một nhà cung cấp di chuyển plugin và vẫn hiển thị bản xem trước trước khi áp dụng.

<Note>
Việc nhập trong quá trình bắt đầu sử dụng yêu cầu một thiết lập OpenClaw mới. Trước tiên, hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc nếu bạn đã có trạng thái cục bộ. Các lượt nhập theo phương thức sao lưu rồi ghi đè hoặc hợp nhất bị giới hạn bằng cờ tính năng đối với những thiết lập hiện có.
</Note>

## Liên quan

- [Di chuyển từ Hermes](/vi/install/migrating-hermes): hướng dẫn từng bước dành cho người dùng.
- [Di chuyển từ Claude](/vi/install/migrating-claude): hướng dẫn từng bước dành cho người dùng.
- [Di chuyển](/vi/install/migrating): chuyển OpenClaw sang một máy mới.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi áp dụng quá trình di chuyển.
- [Plugin](/vi/tools/plugin): cài đặt và đăng ký plugin.
