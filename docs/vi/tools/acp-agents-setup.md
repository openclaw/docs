---
read_when:
    - Cài đặt hoặc cấu hình bộ harness acpx cho Claude Code / Codex / Gemini CLI
    - Kích hoạt cầu nối MCP plugin-tools hoặc OpenClaw-tools
    - Cấu hình các chế độ quyền ACP
summary: 'Thiết lập tác tử ACP: cấu hình bộ chạy thử acpx, thiết lập Plugin, quyền'
title: Tác tử ACP — thiết lập
x-i18n:
    generated_at: "2026-05-02T10:53:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Để xem tổng quan, sổ tay vận hành và các khái niệm, hãy xem [ACP agents](/vi/tools/acp-agents).

Các phần bên dưới trình bày cấu hình harness acpx, thiết lập plugin cho các cầu nối MCP và cấu hình quyền.

Chỉ dùng trang này khi bạn đang thiết lập tuyến ACP/acpx. Đối với cấu hình runtime native Codex app-server, hãy dùng [Codex harness](/vi/plugins/codex-harness). Đối với khóa API OpenAI hoặc cấu hình model-provider Codex OAuth, hãy dùng [OpenAI](/vi/providers/openai).

Codex có hai tuyến OpenClaw:

| Tuyến                      | Cấu hình/lệnh                                         | Trang thiết lập                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native Codex app-server    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/vi/plugins/codex-harness) |
| Adapter Codex ACP tường minh | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Trang này                               |

Ưu tiên tuyến native trừ khi bạn cần rõ hành vi ACP/acpx.

## Hỗ trợ harness acpx (hiện tại)

Các bí danh harness tích hợp sẵn hiện tại của acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Khi OpenClaw dùng backend acpx, hãy ưu tiên các giá trị này cho `agentId` trừ khi cấu hình acpx của bạn định nghĩa bí danh tác nhân tùy chỉnh.
Nếu bản cài Cursor cục bộ của bạn vẫn hiển thị ACP dưới dạng `agent acp`, hãy ghi đè lệnh tác nhân `cursor` trong cấu hình acpx thay vì thay đổi mặc định tích hợp sẵn.

Việc dùng trực tiếp acpx CLI cũng có thể nhắm tới các adapter tùy ý qua `--agent <command>`, nhưng lối thoát thô này là một tính năng của acpx CLI (không phải đường dẫn `agentId` OpenClaw thông thường).

Điều khiển mô hình phụ thuộc vào năng lực của adapter. Các tham chiếu mô hình Codex ACP được OpenClaw chuẩn hóa trước khi khởi động. Các harness khác cần ACP `models` cộng với hỗ trợ `session/set_model`; nếu một harness không cung cấp năng lực ACP đó cũng như cờ mô hình khởi động riêng, OpenClaw/acpx không thể ép chọn mô hình.

## Cấu hình bắt buộc

ACP cơ sở của core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Cấu hình ràng buộc luồng phụ thuộc vào adapter kênh. Ví dụ cho Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

Nếu spawn ACP gắn với luồng không hoạt động, trước tiên hãy xác minh cờ tính năng của adapter:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Các ràng buộc hội thoại hiện tại không yêu cầu tạo luồng con. Chúng yêu cầu một ngữ cảnh hội thoại đang hoạt động và một adapter kênh có cung cấp ràng buộc hội thoại ACP.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Thiết lập plugin cho backend acpx

Các bản cài đóng gói dùng plugin runtime `@openclaw/acpx` chính thức cho ACP.
Hãy cài đặt và bật plugin này trước khi dùng phiên harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các checkout từ mã nguồn cũng có thể dùng plugin workspace cục bộ sau khi chạy `pnpm install`.

Bắt đầu bằng:

```text
/acp doctor
```

Nếu bạn đã tắt `acpx`, chặn nó qua `plugins.allow` / `plugins.deny`, hoặc muốn chuyển lại sang plugin đóng gói, hãy dùng đường dẫn gói tường minh:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Cài workspace cục bộ trong quá trình phát triển:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Sau đó xác minh sức khỏe backend:

```text
/acp doctor
```

### Cấu hình lệnh và phiên bản acpx

Theo mặc định, plugin `acpx` đăng ký backend ACP nhúng mà không spawn tác nhân ACP trong khi Gateway khởi động. Chạy `/acp doctor` để thăm dò live tường minh. Chỉ đặt `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` khi bạn cần Gateway thăm dò tác nhân đã cấu hình lúc khởi động.

Ghi đè lệnh hoặc phiên bản trong cấu hình plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` chấp nhận đường dẫn tuyệt đối, đường dẫn tương đối (được phân giải từ workspace OpenClaw), hoặc tên lệnh.
- `expectedVersion: "any"` tắt khớp phiên bản nghiêm ngặt.
- Các đường dẫn `command` tùy chỉnh sẽ tắt tự động cài đặt cục bộ của plugin.

Xem [Plugins](/vi/tools/plugin).

### Tự động cài đặt dependency

Khi bạn cài OpenClaw toàn cục bằng `npm install -g openclaw`, các dependency runtime acpx (binary theo từng nền tảng) được cài tự động qua hook postinstall. Nếu cài đặt tự động thất bại, gateway vẫn khởi động bình thường và báo dependency bị thiếu qua `openclaw acp doctor`.

### Cầu nối MCP cho công cụ plugin

Theo mặc định, các phiên ACPX **không** hiển thị công cụ do plugin OpenClaw đăng ký cho harness ACP.

Nếu bạn muốn các tác nhân ACP như Codex hoặc Claude Code gọi các công cụ plugin OpenClaw đã cài đặt như nhớ lại/lưu trữ bộ nhớ, hãy bật cầu nối chuyên dụng:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Việc này làm gì:

- Chèn một máy chủ MCP tích hợp sẵn tên là `openclaw-plugin-tools` vào quá trình bootstrap phiên ACPX.
- Hiển thị các công cụ plugin đã được đăng ký bởi các plugin OpenClaw đã cài đặt và bật.
- Giữ tính năng này tường minh và mặc định tắt.

Ghi chú về bảo mật và độ tin cậy:

- Việc này mở rộng bề mặt công cụ của harness ACP.
- Các tác nhân ACP chỉ có quyền truy cập vào các công cụ plugin đã hoạt động trong gateway.
- Hãy xem đây là cùng ranh giới tin cậy như khi cho phép các plugin đó thực thi trong chính OpenClaw.
- Xem xét các plugin đã cài đặt trước khi bật tính năng này.

`mcpServers` tùy chỉnh vẫn hoạt động như trước. Cầu nối plugin-tools tích hợp sẵn là một tiện ích chọn bật bổ sung, không phải thay thế cho cấu hình máy chủ MCP chung.

### Cầu nối MCP cho công cụ OpenClaw

Theo mặc định, các phiên ACPX cũng **không** hiển thị công cụ OpenClaw tích hợp sẵn qua MCP. Bật cầu nối core-tools riêng khi một tác nhân ACP cần các công cụ tích hợp sẵn được chọn như `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Việc này làm gì:

- Chèn một máy chủ MCP tích hợp sẵn tên là `openclaw-tools` vào quá trình bootstrap phiên ACPX.
- Hiển thị các công cụ OpenClaw tích hợp sẵn được chọn. Máy chủ ban đầu hiển thị `cron`.
- Giữ việc hiển thị công cụ core là tường minh và mặc định tắt.

### Cấu hình thời gian chờ runtime

Plugin `acpx` mặc định đặt thời gian chờ cho các lượt runtime nhúng là 120 giây. Điều này cho các harness chậm hơn như Gemini CLI đủ thời gian để hoàn tất khởi động và khởi tạo ACP. Ghi đè giá trị này nếu máy chủ của bạn cần giới hạn runtime khác:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Khởi động lại gateway sau khi thay đổi giá trị này.

### Cấu hình tác nhân thăm dò sức khỏe

Khi `/acp doctor` hoặc thăm dò khởi động chọn bật kiểm tra backend, plugin `acpx` đi kèm sẽ thăm dò một tác nhân harness. Nếu `acp.allowedAgents` được đặt, mặc định nó dùng tác nhân được phép đầu tiên; nếu không, mặc định là `codex`. Nếu deployment của bạn cần tác nhân ACP khác cho kiểm tra sức khỏe, hãy đặt tác nhân thăm dò một cách tường minh:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Khởi động lại gateway sau khi thay đổi giá trị này.

## Cấu hình quyền

Các phiên ACP chạy không tương tác — không có TTY để phê duyệt hoặc từ chối lời nhắc quyền ghi tệp và thực thi shell. Plugin acpx cung cấp hai khóa cấu hình kiểm soát cách xử lý quyền:

Các quyền harness ACPX này tách biệt với phê duyệt exec của OpenClaw và tách biệt với các cờ bỏ qua của nhà cung cấp backend CLI như Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` là công tắc khẩn cấp cấp harness cho các phiên ACP.

### `permissionMode`

Kiểm soát những thao tác mà tác nhân harness có thể thực hiện mà không cần nhắc.

| Giá trị           | Hành vi                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tự động phê duyệt mọi lệnh ghi tệp và shell.          |
| `approve-reads` | Chỉ tự động phê duyệt đọc; ghi và exec cần lời nhắc. |
| `deny-all`      | Từ chối mọi lời nhắc quyền.                              |

### `nonInteractivePermissions`

Kiểm soát điều gì xảy ra khi lẽ ra một lời nhắc quyền sẽ hiển thị nhưng không có TTY tương tác khả dụng (điều này luôn đúng với các phiên ACP).

| Giá trị  | Hành vi                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Hủy phiên với `AcpRuntimeError`. **(mặc định)**           |
| `deny` | Âm thầm từ chối quyền và tiếp tục (suy giảm nhẹ nhàng). |

### Cấu hình

Đặt qua cấu hình plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Khởi động lại gateway sau khi thay đổi các giá trị này.

<Warning>
OpenClaw mặc định dùng `permissionMode=approve-reads` và `nonInteractivePermissions=fail`. Trong các phiên ACP không tương tác, mọi thao tác ghi hoặc exec kích hoạt lời nhắc quyền đều có thể thất bại với `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Nếu bạn cần hạn chế quyền, hãy đặt `nonInteractivePermissions` thành `deny` để các phiên suy giảm nhẹ nhàng thay vì gặp sự cố.
</Warning>

## Liên quan

- [ACP agents](/vi/tools/acp-agents) — tổng quan, sổ tay vận hành, khái niệm
- [Sub-agents](/vi/tools/subagents)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
