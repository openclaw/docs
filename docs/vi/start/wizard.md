---
read_when:
    - Chạy hoặc cấu hình quy trình hướng dẫn ban đầu qua CLI
    - Thiết lập một máy mới
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: thiết lập có hướng dẫn cho Gateway, không gian làm việc, kênh và Skills'
title: Thiết lập ban đầu (CLI)
x-i18n:
    generated_at: "2026-06-27T18:12:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding là đường dẫn thiết lập bằng terminal **được khuyến nghị** cho OpenClaw trên
macOS, Linux hoặc Windows. Người dùng desktop Windows cũng có thể bắt đầu với
[Windows Hub](/vi/platforms/windows).
Nó cấu hình một Gateway cục bộ hoặc kết nối Gateway từ xa, cùng với các kênh, Skills,
và mặc định workspace trong một luồng hướng dẫn duy nhất.

```bash
openclaw onboard
```

## Ngôn ngữ

Trình hướng dẫn CLI bản địa hóa nội dung onboarding cố định. Nó xác định ngôn ngữ từ
`OPENCLAW_LOCALE`, rồi `LC_ALL`, rồi `LC_MESSAGES`, rồi `LANG`, và quay về
tiếng Anh nếu không có. Các ngôn ngữ trình hướng dẫn được hỗ trợ là `en`, `zh-CN`, và `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Tên và định danh ổn định giữ nguyên dạng chữ: `OpenClaw`, `Gateway`, `Tailscale`,
lệnh, khóa cấu hình, URL, ID nhà cung cấp, ID mô hình, và nhãn Plugin/kênh
không được dịch.

<Info>
Cuộc trò chuyện đầu tiên nhanh nhất: mở Control UI (không cần thiết lập kênh). Chạy
`openclaw dashboard` và trò chuyện trong trình duyệt. Tài liệu: [Dashboard](/vi/web/dashboard).
</Info>

Để cấu hình lại sau:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` không ngụ ý chế độ không tương tác. Với script, hãy dùng `--non-interactive`.
</Note>

<Tip>
CLI onboarding bao gồm bước tìm kiếm web, nơi bạn có thể chọn một nhà cung cấp
như Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG hoặc Tavily. Một số nhà cung cấp yêu cầu
khóa API, trong khi những nhà cung cấp khác không cần khóa. Bạn cũng có thể cấu hình việc này sau bằng
`openclaw configure --section web`. Tài liệu: [Công cụ web](/vi/tools/web).
</Tip>

## QuickStart so với Advanced

Onboarding bắt đầu với **QuickStart** (mặc định) so với **Advanced** (toàn quyền kiểm soát).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway cục bộ (loopback)
    - Mặc định workspace (hoặc workspace hiện có)
    - Cổng Gateway **18789**
    - Xác thực Gateway **Token** (tự động tạo, ngay cả trên loopback)
    - Mặc định chính sách công cụ cho thiết lập cục bộ mới: `tools.profile: "coding"` (hồ sơ rõ ràng hiện có được giữ nguyên)
    - Mặc định cô lập DM: onboarding cục bộ ghi `session.dmScope: "per-channel-peer"` khi chưa đặt. Chi tiết: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals)
    - Phơi bày qua Tailscale **Tắt**
    - DM Telegram + WhatsApp mặc định là **allowlist** (bạn sẽ được nhắc nhập số điện thoại)

  </Tab>
  <Tab title="Advanced (full control)">
    - Hiển thị mọi bước (chế độ, workspace, Gateway, kênh, daemon, Skills).

  </Tab>
</Tabs>

## Onboarding cấu hình những gì

**Chế độ cục bộ (mặc định)** hướng dẫn bạn qua các bước sau:

1. **Mô hình/Xác thực** — chọn bất kỳ nhà cung cấp/luồng xác thực được hỗ trợ nào (khóa API, OAuth hoặc xác thực thủ công riêng theo nhà cung cấp), bao gồm Custom Provider
   (tương thích OpenAI, tương thích Anthropic hoặc tự động phát hiện Unknown). Chọn một mô hình mặc định.
   Ghi chú bảo mật: nếu agent này sẽ chạy công cụ hoặc xử lý nội dung Webhook/hooks, hãy ưu tiên mô hình thế hệ mới nhất mạnh nhất có sẵn và giữ chính sách công cụ nghiêm ngặt. Các bậc yếu hơn/cũ hơn dễ bị prompt-inject hơn.
   Với các lần chạy không tương tác, `--secret-input-mode ref` lưu ref dựa trên env trong hồ sơ xác thực thay vì giá trị khóa API dạng văn bản thuần.
   Trong chế độ `ref` không tương tác, biến env của nhà cung cấp phải được đặt; truyền cờ khóa inline mà không có biến env đó sẽ thất bại nhanh.
   Trong các lần chạy tương tác, chọn chế độ tham chiếu bí mật cho phép bạn trỏ tới một biến môi trường hoặc một ref nhà cung cấp đã cấu hình (`file` hoặc `exec`), với bước xác thực preflight nhanh trước khi lưu.
   Với Anthropic, onboarding/configure tương tác cung cấp **Anthropic Claude CLI** làm đường dẫn cục bộ được ưu tiên và **Anthropic API key** làm đường dẫn sản xuất được khuyến nghị. Anthropic setup-token cũng vẫn có sẵn như một đường dẫn xác thực bằng token được hỗ trợ.
2. **Workspace** — vị trí cho tệp agent (mặc định `~/.openclaw/workspace`). Tạo sẵn các tệp bootstrap.
3. **Gateway** — cổng, địa chỉ bind, chế độ xác thực, phơi bày qua Tailscale.
   Trong chế độ token tương tác, chọn lưu trữ token văn bản thuần mặc định hoặc chọn dùng SecretRef.
   Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kênh** — các kênh chat tích hợp sẵn và Plugin chính thức như iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp và hơn nữa.
5. **Daemon** — cài đặt LaunchAgent (macOS), systemd user unit (Linux/WSL2) hoặc Windows Scheduled Task gốc với phương án dự phòng thư mục Startup theo từng người dùng.
   Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt daemon sẽ xác thực nó nhưng không lưu token đã phân giải vào metadata môi trường dịch vụ supervisor.
   Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, cài đặt daemon sẽ bị chặn với hướng dẫn có thể hành động.
   Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, cài đặt daemon sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.
6. **Kiểm tra sức khỏe** — khởi động Gateway và xác minh nó đang chạy.
7. **Skills** — cài đặt Skills được khuyến nghị và các phụ thuộc tùy chọn.

<Note>
Chạy lại onboarding **không** xóa bất kỳ thứ gì trừ khi bạn chọn rõ ràng **Reset** (hoặc truyền `--reset`).
CLI `--reset` mặc định áp dụng cho cấu hình, thông tin xác thực và phiên; dùng `--reset-scope full` để bao gồm workspace.
Nếu cấu hình không hợp lệ hoặc chứa khóa cũ, onboarding sẽ yêu cầu bạn chạy `openclaw doctor` trước.
</Note>

**Chế độ từ xa** chỉ cấu hình client cục bộ để kết nối tới Gateway ở nơi khác.
Nó **không** cài đặt hoặc thay đổi bất kỳ thứ gì trên máy chủ từ xa.

## Thêm agent khác

Dùng `openclaw agents add <name>` để tạo một agent riêng với workspace,
phiên và hồ sơ xác thực riêng. Chạy mà không có `--workspace` sẽ khởi chạy onboarding.

Nó đặt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Ghi chú:

- Workspace mặc định theo `~/.openclaw/workspace-<agentId>`.
- Thêm `bindings` để định tuyến tin nhắn đến (onboarding có thể làm việc này).
- Cờ không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham chiếu đầy đủ

Để xem phân tích chi tiết từng bước và đầu ra cấu hình, hãy xem
[Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference).
Để xem ví dụ không tương tác, hãy xem [Tự động hóa CLI](/vi/start/wizard-cli-automation).
Để xem tham chiếu kỹ thuật sâu hơn, bao gồm chi tiết RPC, hãy xem
[Tham chiếu Onboarding](/vi/reference/wizard).

## Tài liệu liên quan

- Tham chiếu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)
- Tổng quan onboarding: [Tổng quan Onboarding](/vi/start/onboarding-overview)
- Onboarding ứng dụng macOS: [Onboarding](/vi/start/onboarding)
- Nghi thức chạy lần đầu của agent: [Khởi tạo Agent](/vi/start/bootstrapping)
