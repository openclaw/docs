---
read_when:
    - Chạy hoặc cấu hình quy trình thiết lập ban đầu của CLI
    - Thiết lập một máy mới
sidebarTitle: 'Onboarding: CLI'
summary: 'Thiết lập ban đầu bằng CLI: hướng dẫn thiết lập Gateway, không gian làm việc, kênh và Skills'
title: Thiết lập ban đầu (CLI)
x-i18n:
    generated_at: "2026-04-29T23:15:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

Onboarding bằng CLI là cách **được khuyến nghị** để thiết lập OpenClaw trên macOS,
Linux hoặc Windows (thông qua WSL2; rất khuyến nghị).
Quy trình này cấu hình một Gateway cục bộ hoặc kết nối Gateway từ xa, cùng với các kênh, skills,
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
`--json` không có nghĩa là chế độ không tương tác. Với script, hãy dùng `--non-interactive`.
</Note>

<Tip>
Onboarding bằng CLI bao gồm một bước tìm kiếm web, nơi bạn có thể chọn nhà cung cấp
như Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG hoặc Tavily. Một số nhà cung cấp yêu cầu
API key, trong khi những nhà cung cấp khác không cần khóa. Bạn cũng có thể cấu hình mục này sau bằng
`openclaw configure --section web`. Tài liệu: [Công cụ web](/vi/tools/web).
</Tip>

## Bắt đầu nhanh so với Nâng cao

Onboarding bắt đầu bằng **Bắt đầu nhanh** (mặc định) so với **Nâng cao** (toàn quyền kiểm soát).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway cục bộ (loopback)
    - Mặc định workspace (hoặc workspace hiện có)
    - Cổng Gateway **18789**
    - Xác thực Gateway **Token** (tự động tạo, ngay cả trên loopback)
    - Chính sách công cụ mặc định cho thiết lập cục bộ mới: `tools.profile: "coding"` (profile tường minh hiện có được giữ nguyên)
    - Mặc định cách ly DM: onboarding cục bộ ghi `session.dmScope: "per-channel-peer"` khi chưa được đặt. Chi tiết: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals)
    - Phơi bày Tailscale **Tắt**
    - DM Telegram + WhatsApp mặc định dùng **danh sách cho phép** (bạn sẽ được hỏi số điện thoại)

  </Tab>
  <Tab title="Advanced (full control)">
    - Hiển thị mọi bước (chế độ, workspace, gateway, kênh, daemon, skills).

  </Tab>
</Tabs>

## Onboarding cấu hình những gì

**Chế độ cục bộ (mặc định)** hướng dẫn bạn qua các bước sau:

1. **Mô hình/Xác thực** — chọn bất kỳ nhà cung cấp/luồng xác thực được hỗ trợ nào (API key, OAuth hoặc xác thực thủ công riêng theo nhà cung cấp), bao gồm Custom Provider
   (tương thích OpenAI, tương thích Anthropic hoặc tự động phát hiện Unknown). Chọn một mô hình mặc định.
   Ghi chú bảo mật: nếu agent này sẽ chạy công cụ hoặc xử lý nội dung webhook/hook, hãy ưu tiên mô hình thế hệ mới nhất mạnh nhất hiện có và giữ chính sách công cụ nghiêm ngặt. Các bậc yếu hơn/cũ hơn dễ bị prompt-inject hơn.
   Với các lần chạy không tương tác, `--secret-input-mode ref` lưu các tham chiếu dựa trên env trong profile xác thực thay vì giá trị API key dạng văn bản thuần.
   Trong chế độ `ref` không tương tác, biến env của nhà cung cấp phải được đặt; truyền cờ khóa trực tiếp mà không có biến env đó sẽ thất bại nhanh.
   Trong các lần chạy tương tác, chọn chế độ tham chiếu bí mật cho phép bạn trỏ tới biến môi trường hoặc ref nhà cung cấp đã cấu hình (`file` hoặc `exec`), kèm xác thực preflight nhanh trước khi lưu.
   Với Anthropic, onboarding/configure tương tác cung cấp **Anthropic Claude CLI** làm đường dẫn cục bộ ưu tiên và **Anthropic API key** làm đường dẫn production được khuyến nghị. Anthropic setup-token cũng vẫn có sẵn dưới dạng đường dẫn xác thực bằng token được hỗ trợ.
2. **Workspace** — Vị trí cho các tệp agent (mặc định `~/.openclaw/workspace`). Khởi tạo các tệp bootstrap.
3. **Gateway** — Cổng, địa chỉ bind, chế độ xác thực, phơi bày Tailscale.
   Trong chế độ token tương tác, chọn lưu trữ token dạng văn bản thuần mặc định hoặc chọn dùng SecretRef.
   Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kênh** — các kênh chat tích hợp sẵn và đi kèm như BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, v.v.
5. **Daemon** — Cài đặt LaunchAgent (macOS), systemd user unit (Linux/WSL2) hoặc Windows Scheduled Task gốc với phương án dự phòng Startup-folder theo từng người dùng.
   Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt daemon sẽ xác thực token đó nhưng không lưu token đã phân giải vào metadata môi trường dịch vụ supervisor.
   Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, cài đặt daemon sẽ bị chặn với hướng dẫn có thể hành động.
   Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt daemon sẽ bị chặn cho đến khi mode được đặt tường minh.
6. **Kiểm tra sức khỏe** — Khởi động Gateway và xác minh nó đang chạy.
7. **Skills** — Cài đặt skills được khuyến nghị và các phụ thuộc tùy chọn.

<Note>
Chạy lại onboarding **không** xóa bất cứ thứ gì trừ khi bạn chọn tường minh **Đặt lại** (hoặc truyền `--reset`).
CLI `--reset` mặc định áp dụng cho cấu hình, credentials và phiên; dùng `--reset-scope full` để bao gồm workspace.
Nếu cấu hình không hợp lệ hoặc chứa khóa legacy, onboarding sẽ yêu cầu bạn chạy `openclaw doctor` trước.
</Note>

**Chế độ từ xa** chỉ cấu hình client cục bộ để kết nối tới một Gateway ở nơi khác.
Nó **không** cài đặt hoặc thay đổi bất cứ thứ gì trên host từ xa.

## Thêm một agent khác

Dùng `openclaw agents add <name>` để tạo một agent riêng với workspace,
phiên và profile xác thực riêng. Chạy mà không có `--workspace` sẽ khởi chạy onboarding.

Những gì được đặt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Ghi chú:

- Workspace mặc định theo mẫu `~/.openclaw/workspace-<agentId>`.
- Thêm `bindings` để định tuyến tin nhắn đến (onboarding có thể làm việc này).
- Cờ không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham chiếu đầy đủ

Để xem phân tích chi tiết từng bước và đầu ra cấu hình, hãy xem
[Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference).
Để xem ví dụ không tương tác, hãy xem [Tự động hóa CLI](/vi/start/wizard-cli-automation).
Để xem tham chiếu kỹ thuật sâu hơn, bao gồm chi tiết RPC, hãy xem
[Tham chiếu onboarding](/vi/reference/wizard).

## Tài liệu liên quan

- Tham chiếu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)
- Tổng quan onboarding: [Tổng quan onboarding](/vi/start/onboarding-overview)
- Onboarding ứng dụng macOS: [Onboarding](/vi/start/onboarding)
- Nghi thức chạy lần đầu của agent: [Khởi tạo agent](/vi/start/bootstrapping)
