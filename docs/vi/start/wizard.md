---
read_when:
    - Chạy hoặc cấu hình quy trình thiết lập ban đầu của CLI
    - Thiết lập một máy mới
sidebarTitle: 'Onboarding: CLI'
summary: 'Thiết lập ban đầu CLI: quy trình thiết lập có hướng dẫn cho Gateway, không gian làm việc, kênh và Skills'
title: Hướng dẫn thiết lập ban đầu (CLI)
x-i18n:
    generated_at: "2026-05-06T09:31:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding là cách **được khuyến nghị** để thiết lập OpenClaw trên macOS,
Linux hoặc Windows (qua WSL2; rất khuyến nghị).
Nó cấu hình Gateway cục bộ hoặc kết nối Gateway từ xa, cùng với kênh, skills,
và mặc định workspace trong một luồng hướng dẫn duy nhất.

```bash
openclaw onboard
```

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
CLI onboarding bao gồm một bước tìm kiếm web, nơi bạn có thể chọn nhà cung cấp
như Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG hoặc Tavily. Một số nhà cung cấp yêu cầu
API key, trong khi những nhà cung cấp khác không cần key. Bạn cũng có thể cấu hình phần này sau bằng
`openclaw configure --section web`. Tài liệu: [Công cụ web](/vi/tools/web).
</Tip>

## Khởi động nhanh và Nâng cao

Onboarding bắt đầu với **Khởi động nhanh** (mặc định) hoặc **Nâng cao** (toàn quyền kiểm soát).

<Tabs>
  <Tab title="Khởi động nhanh (mặc định)">
    - Gateway cục bộ (loopback)
    - Mặc định workspace (hoặc workspace hiện có)
    - Cổng Gateway **18789**
    - Xác thực Gateway **Token** (tự động tạo, kể cả trên loopback)
    - Mặc định chính sách công cụ cho thiết lập cục bộ mới: `tools.profile: "coding"` (hồ sơ rõ ràng hiện có được giữ nguyên)
    - Mặc định cô lập DM: onboarding cục bộ ghi `session.dmScope: "per-channel-peer"` khi chưa đặt. Chi tiết: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals)
    - Phơi bày Tailscale **Tắt**
    - DM Telegram + WhatsApp mặc định dùng **allowlist** (bạn sẽ được nhắc nhập số điện thoại)

  </Tab>
  <Tab title="Nâng cao (toàn quyền kiểm soát)">
    - Hiển thị mọi bước (chế độ, workspace, Gateway, kênh, daemon, skills).

  </Tab>
</Tabs>

## Onboarding cấu hình những gì

**Chế độ cục bộ (mặc định)** hướng dẫn bạn qua các bước sau:

1. **Mô hình/Xác thực** — chọn bất kỳ nhà cung cấp/luồng xác thực được hỗ trợ nào (API key, OAuth hoặc xác thực thủ công riêng theo nhà cung cấp), bao gồm Nhà cung cấp tùy chỉnh
   (tương thích OpenAI, tương thích Anthropic hoặc tự động phát hiện Unknown). Chọn một mô hình mặc định.
   Lưu ý bảo mật: nếu agent này sẽ chạy công cụ hoặc xử lý nội dung webhook/hooks, hãy ưu tiên mô hình thế hệ mới nhất mạnh nhất hiện có và giữ chính sách công cụ nghiêm ngặt. Các tầng yếu hơn/cũ hơn dễ bị prompt-inject hơn.
   Với các lần chạy không tương tác, `--secret-input-mode ref` lưu các ref dựa trên env trong hồ sơ xác thực thay vì giá trị API key dạng văn bản thuần.
   Trong chế độ không tương tác `ref`, biến env của nhà cung cấp phải được đặt; truyền cờ key trực tiếp mà không có biến env đó sẽ thất bại ngay.
   Trong các lần chạy tương tác, việc chọn chế độ tham chiếu bí mật cho phép bạn trỏ đến biến môi trường hoặc ref nhà cung cấp đã cấu hình (`file` hoặc `exec`), với xác thực preflight nhanh trước khi lưu.
   Với Anthropic, onboarding/configure tương tác cung cấp **Anthropic Claude CLI** làm đường dẫn cục bộ ưu tiên và **Anthropic API key** làm đường dẫn production được khuyến nghị. Anthropic setup-token cũng vẫn có sẵn như một đường dẫn xác thực bằng token được hỗ trợ.
2. **Workspace** — Vị trí cho tệp agent (mặc định `~/.openclaw/workspace`). Gieo các tệp bootstrap.
3. **Gateway** — Cổng, địa chỉ bind, chế độ xác thực, phơi bày Tailscale.
   Trong chế độ token tương tác, chọn lưu trữ token văn bản thuần mặc định hoặc chọn dùng SecretRef.
   Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kênh** — các kênh trò chuyện tích hợp sẵn và đi kèm như BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, v.v.
5. **Daemon** — Cài đặt LaunchAgent (macOS), systemd user unit (Linux/WSL2) hoặc Windows Scheduled Task gốc với phương án dự phòng thư mục Startup theo người dùng.
   Nếu xác thực token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt daemon sẽ xác thực token đó nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ supervisor.
   Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, cài đặt daemon bị chặn kèm hướng dẫn có thể hành động.
   Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt daemon bị chặn cho đến khi mode được đặt rõ ràng.
6. **Kiểm tra sức khỏe** — Khởi động Gateway và xác minh nó đang chạy.
7. **Skills** — Cài đặt các skills được khuyến nghị và phụ thuộc tùy chọn.

<Note>
Chạy lại onboarding **không** xóa bất cứ thứ gì trừ khi bạn chọn rõ **Đặt lại** (hoặc truyền `--reset`).
CLI `--reset` mặc định áp dụng cho cấu hình, thông tin xác thực và phiên; dùng `--reset-scope full` để bao gồm workspace.
Nếu cấu hình không hợp lệ hoặc chứa khóa cũ, onboarding sẽ yêu cầu bạn chạy `openclaw doctor` trước.
</Note>

**Chế độ từ xa** chỉ cấu hình client cục bộ để kết nối tới Gateway ở nơi khác.
Nó **không** cài đặt hoặc thay đổi bất cứ thứ gì trên máy chủ từ xa.

## Thêm agent khác

Dùng `openclaw agents add <name>` để tạo một agent riêng với workspace,
phiên và hồ sơ xác thực riêng. Chạy không có `--workspace` sẽ khởi chạy onboarding.

Nội dung được đặt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Ghi chú:

- Workspace mặc định theo `~/.openclaw/workspace-<agentId>`.
- Thêm `bindings` để định tuyến tin nhắn đến (onboarding có thể làm việc này).
- Cờ không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham chiếu đầy đủ

Để xem phân tích từng bước chi tiết và đầu ra cấu hình, hãy xem
[Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference).
Để xem ví dụ không tương tác, hãy xem [Tự động hóa CLI](/vi/start/wizard-cli-automation).
Để xem tham chiếu kỹ thuật sâu hơn, bao gồm chi tiết RPC, hãy xem
[Tham chiếu Onboarding](/vi/reference/wizard).

## Tài liệu liên quan

- Tham chiếu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)
- Tổng quan onboarding: [Tổng quan Onboarding](/vi/start/onboarding-overview)
- Onboarding ứng dụng macOS: [Onboarding](/vi/start/onboarding)
- Nghi thức chạy lần đầu của agent: [Khởi tạo Agent](/vi/start/bootstrapping)
