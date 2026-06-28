---
read_when:
    - Chạy hoặc cấu hình quy trình hướng dẫn thiết lập CLI
    - Thiết lập một máy mới
sidebarTitle: 'Onboarding: CLI'
summary: 'Thiết lập ban đầu CLI: thiết lập có hướng dẫn cho Gateway, không gian làm việc, kênh và Skills'
title: Thiết lập ban đầu (CLI)
x-i18n:
    generated_at: "2026-06-28T20:45:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

Thiết lập ban đầu qua CLI là đường dẫn thiết lập terminal **được khuyến nghị** cho OpenClaw trên
macOS, Linux hoặc Windows. Người dùng máy tính để bàn Windows cũng có thể bắt đầu với
[Windows Hub](/vi/platforms/windows).
Nó cấu hình một Gateway cục bộ hoặc kết nối Gateway từ xa, cùng với các kênh, Skills,
và mặc định workspace trong một luồng được hướng dẫn.

```bash
openclaw onboard
```

Khởi động nhanh thường chỉ mất vài phút, nhưng quá trình thiết lập ban đầu đầy đủ có thể lâu hơn
khi đăng nhập nhà cung cấp, ghép nối kênh, cài đặt daemon, tải xuống qua mạng,
Skills hoặc Plugin tùy chọn cần thiết lập thêm. Trình hướng dẫn hiển thị dòng thời gian này
ngay từ đầu, và các bước tùy chọn có thể được bỏ qua rồi quay lại sau bằng
`openclaw configure`.

## Ngôn ngữ

Trình hướng dẫn CLI bản địa hóa phần nội dung thiết lập ban đầu cố định. Nó xác định ngôn ngữ từ
`OPENCLAW_LOCALE`, sau đó `LC_ALL`, rồi `LC_MESSAGES`, rồi `LANG`, và quay về
tiếng Anh. Các ngôn ngữ trình hướng dẫn được hỗ trợ là `en`, `zh-CN` và `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Tên và định danh ổn định được giữ nguyên: `OpenClaw`, `Gateway`, `Tailscale`,
lệnh, khóa cấu hình, URL, ID nhà cung cấp, ID mô hình và nhãn Plugin/kênh
không được dịch.

<Info>
Cuộc trò chuyện đầu tiên nhanh nhất: mở Control UI (không cần thiết lập kênh). Chạy
`openclaw dashboard` và trò chuyện trong trình duyệt. Tài liệu: [Bảng điều khiển](/vi/web/dashboard).
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
Thiết lập ban đầu qua CLI bao gồm một bước tìm kiếm web, nơi bạn có thể chọn một nhà cung cấp
như Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG hoặc Tavily. Một số nhà cung cấp yêu cầu
khóa API, trong khi những nhà cung cấp khác không cần khóa. Bạn cũng có thể cấu hình mục này sau bằng
`openclaw configure --section web`. Tài liệu: [Công cụ web](/vi/tools/web).
</Tip>

## Khởi động nhanh và nâng cao

Thiết lập ban đầu bắt đầu bằng **Khởi động nhanh** (mặc định) hoặc **Nâng cao** (toàn quyền kiểm soát).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway cục bộ (loopback)
    - Mặc định workspace (hoặc workspace hiện có)
    - Cổng Gateway **18789**
    - Xác thực Gateway **Token** (được tự động tạo, kể cả trên loopback)
    - Mặc định chính sách công cụ cho thiết lập cục bộ mới: `tools.profile: "coding"` (hồ sơ rõ ràng hiện có được giữ nguyên)
    - Mặc định cô lập DM: thiết lập ban đầu cục bộ ghi `session.dmScope: "per-channel-peer"` khi chưa đặt. Chi tiết: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals)
    - Phơi bày Tailscale **Tắt**
    - DM Telegram + WhatsApp mặc định dùng **danh sách cho phép** (bạn sẽ được nhắc nhập số điện thoại)

  </Tab>
  <Tab title="Advanced (full control)">
    - Hiển thị mọi bước (chế độ, workspace, gateway, kênh, daemon, Skills).

  </Tab>
</Tabs>

## Những gì thiết lập ban đầu cấu hình

**Chế độ cục bộ (mặc định)** hướng dẫn bạn qua các bước sau:

1. **Mô hình/Xác thực** — chọn bất kỳ nhà cung cấp/luồng xác thực nào được hỗ trợ (khóa API, OAuth hoặc xác thực thủ công riêng theo nhà cung cấp), bao gồm Nhà cung cấp tùy chỉnh
   (tương thích OpenAI, tương thích Anthropic hoặc tự động phát hiện Không xác định). Chọn một mô hình mặc định.
   Ghi chú bảo mật: nếu agent này sẽ chạy công cụ hoặc xử lý nội dung webhook/hook, hãy ưu tiên mô hình thế hệ mới nhất mạnh nhất có sẵn và giữ chính sách công cụ nghiêm ngặt. Các tầng yếu hơn/cũ hơn dễ bị prompt injection hơn.
   Với lần chạy không tương tác, `--secret-input-mode ref` lưu các tham chiếu dựa trên env trong hồ sơ xác thực thay vì giá trị khóa API dạng văn bản thuần.
   Trong chế độ `ref` không tương tác, biến env của nhà cung cấp phải được đặt; truyền cờ khóa nội tuyến mà không có biến env đó sẽ lỗi nhanh.
   Trong lần chạy tương tác, chọn chế độ tham chiếu bí mật cho phép bạn trỏ tới một biến môi trường hoặc một tham chiếu nhà cung cấp đã cấu hình (`file` hoặc `exec`), với bước kiểm tra nhanh trước khi lưu.
   Với Anthropic, thiết lập ban đầu/cấu hình tương tác cung cấp **Anthropic Claude CLI** làm đường dẫn cục bộ ưu tiên và **khóa API Anthropic** làm đường dẫn sản xuất được khuyến nghị. Anthropic setup-token cũng vẫn có sẵn như một đường dẫn xác thực bằng token được hỗ trợ.
2. **Workspace** — vị trí cho tệp agent (mặc định `~/.openclaw/workspace`). Khởi tạo các tệp bootstrap.
3. **Gateway** — cổng, địa chỉ bind, chế độ xác thực, phơi bày Tailscale.
   Trong chế độ token tương tác, chọn lưu trữ token dạng văn bản thuần mặc định hoặc chọn dùng SecretRef.
   Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kênh** — các kênh trò chuyện tích hợp sẵn và Plugin chính thức như iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, và nhiều kênh khác.
5. **Daemon** — cài đặt LaunchAgent (macOS), systemd user unit (Linux/WSL2), hoặc Windows Scheduled Task gốc với phương án dự phòng thư mục Startup theo người dùng.
   Nếu xác thực token yêu cầu token và `gateway.auth.token` được SecretRef quản lý, quá trình cài đặt daemon sẽ xác thực nó nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ giám sát.
   Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, quá trình cài đặt daemon bị chặn kèm hướng dẫn có thể hành động.
   Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, quá trình cài đặt daemon bị chặn cho đến khi chế độ được đặt rõ ràng.
6. **Kiểm tra sức khỏe** — khởi động Gateway và xác minh nó đang chạy.
7. **Skills** — cài đặt Skills được khuyến nghị và các phụ thuộc tùy chọn.

<Note>
Chạy lại thiết lập ban đầu **không** xóa bất kỳ thứ gì trừ khi bạn chọn rõ ràng **Đặt lại** (hoặc truyền `--reset`).
CLI `--reset` mặc định áp dụng cho cấu hình, thông tin xác thực và phiên; dùng `--reset-scope full` để bao gồm workspace.
Nếu cấu hình không hợp lệ hoặc chứa khóa cũ, thiết lập ban đầu sẽ yêu cầu bạn chạy `openclaw doctor` trước.
</Note>

**Chế độ từ xa** chỉ cấu hình máy khách cục bộ để kết nối tới một Gateway ở nơi khác.
Nó **không** cài đặt hoặc thay đổi bất kỳ thứ gì trên máy chủ từ xa.

## Thêm agent khác

Dùng `openclaw agents add <name>` để tạo một agent riêng với workspace,
phiên và hồ sơ xác thực riêng. Chạy mà không có `--workspace` sẽ mở thiết lập ban đầu.

Nó đặt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Ghi chú:

- Workspace mặc định theo mẫu `~/.openclaw/workspace-<agentId>`.
- Thêm `bindings` để định tuyến tin nhắn đến (thiết lập ban đầu có thể làm việc này).
- Cờ không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tham chiếu đầy đủ

Để xem phân tích chi tiết từng bước và kết quả cấu hình, hãy xem
[Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference).
Để xem ví dụ không tương tác, hãy xem [Tự động hóa CLI](/vi/start/wizard-cli-automation).
Để xem tham chiếu kỹ thuật sâu hơn, bao gồm chi tiết RPC, hãy xem
[Tham chiếu thiết lập ban đầu](/vi/reference/wizard).

## Tài liệu liên quan

- Tham chiếu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)
- Tổng quan thiết lập ban đầu: [Tổng quan thiết lập ban đầu](/vi/start/onboarding-overview)
- Thiết lập ban đầu ứng dụng macOS: [Thiết lập ban đầu](/vi/start/onboarding)
- Nghi thức chạy lần đầu của agent: [Khởi tạo agent](/vi/start/bootstrapping)
