---
read_when:
    - Cài đặt hoặc cấu hình bộ kiểm thử acpx cho Claude Code / Codex / Gemini CLI
    - Kích hoạt cầu nối MCP plugin-tools hoặc OpenClaw-tools
    - Cấu hình các chế độ quyền ACP
summary: 'Thiết lập tác nhân ACP: cấu hình bộ chạy acpx, thiết lập Plugin, quyền'
title: Tác tử ACP — thiết lập
x-i18n:
    generated_at: "2026-04-29T23:15:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Để xem tổng quan, runbook vận hành và khái niệm, xem [tác nhân ACP](/vi/tools/acp-agents).

Các phần bên dưới bao gồm cấu hình acpx harness, thiết lập Plugin cho các cầu nối MCP và cấu hình quyền.

Chỉ sử dụng trang này khi bạn đang thiết lập tuyến ACP/acpx. Đối với cấu hình runtime app-server Codex gốc, hãy dùng [Codex harness](/vi/plugins/codex-harness). Đối với khóa OpenAI API hoặc cấu hình nhà cung cấp mô hình Codex OAuth, hãy dùng [OpenAI](/vi/providers/openai).

Codex có hai tuyến OpenClaw:

| Tuyến                      | Cấu hình/lệnh                                         | Trang thiết lập                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server Codex gốc    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/vi/plugins/codex-harness) |
| Bộ chuyển đổi ACP Codex tường minh | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Trang này                               |

Ưu tiên tuyến gốc trừ khi bạn cần rõ hành vi ACP/acpx.

## Hỗ trợ acpx harness (hiện tại)

Các bí danh harness tích hợp hiện tại của acpx:

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

Khi OpenClaw sử dụng backend acpx, hãy ưu tiên các giá trị này cho `agentId` trừ khi cấu hình acpx của bạn định nghĩa bí danh tác nhân tùy chỉnh.
Nếu bản cài đặt Cursor cục bộ của bạn vẫn cung cấp ACP dưới dạng `agent acp`, hãy ghi đè lệnh tác nhân `cursor` trong cấu hình acpx của bạn thay vì thay đổi mặc định tích hợp.

Việc sử dụng trực tiếp acpx CLI cũng có thể nhắm đến các bộ chuyển đổi tùy ý thông qua `--agent <command>`, nhưng lối thoát thô này là một tính năng của acpx CLI (không phải đường dẫn `agentId` OpenClaw thông thường).

Điều khiển mô hình phụ thuộc vào khả năng của bộ chuyển đổi. Các tham chiếu mô hình Codex ACP được OpenClaw chuẩn hóa trước khi khởi động. Các harness khác cần ACP `models` cùng hỗ trợ `session/set_model`; nếu một harness không cung cấp cả khả năng ACP đó lẫn cờ mô hình khởi động riêng, OpenClaw/acpx không thể ép buộc lựa chọn mô hình.

## Cấu hình bắt buộc

Đường cơ sở ACP lõi:

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

Cấu hình liên kết luồng phụ thuộc vào bộ chuyển đổi kênh. Ví dụ cho Discord:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Nếu việc tạo ACP gắn với luồng không hoạt động, trước tiên hãy xác minh cờ tính năng của bộ chuyển đổi:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Các liên kết cuộc trò chuyện hiện tại không yêu cầu tạo luồng con. Chúng yêu cầu ngữ cảnh cuộc trò chuyện đang hoạt động và bộ chuyển đổi kênh có cung cấp liên kết cuộc trò chuyện ACP.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Thiết lập Plugin cho backend acpx

Các bản cài đặt mới đi kèm Plugin runtime `acpx` được đóng gói và bật theo mặc định, nên ACP thường hoạt động mà không cần bước cài đặt Plugin thủ công.

Bắt đầu với:

```text
/acp doctor
```

Nếu bạn đã tắt `acpx`, từ chối nó qua `plugins.allow` / `plugins.deny`, hoặc muốn chuyển sang một checkout phát triển cục bộ, hãy dùng đường dẫn Plugin tường minh:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Cài đặt workspace cục bộ trong quá trình phát triển:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Sau đó xác minh tình trạng backend:

```text
/acp doctor
```

### Cấu hình lệnh và phiên bản acpx

Theo mặc định, Plugin `acpx` được đóng gói đăng ký backend ACP nhúng mà không tạo tác nhân ACP trong quá trình khởi động Gateway. Chạy `/acp doctor` để thăm dò trực tiếp tường minh. Chỉ đặt `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` khi bạn cần Gateway thăm dò tác nhân đã cấu hình lúc khởi động.

Ghi đè lệnh hoặc phiên bản trong cấu hình Plugin:

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
- Các đường dẫn `command` tùy chỉnh tắt tự động cài đặt cục bộ theo Plugin.

Xem [Plugins](/vi/tools/plugin).

### Cài đặt phụ thuộc tự động

Khi bạn cài đặt OpenClaw toàn cục bằng `npm install -g openclaw`, các phụ thuộc runtime acpx (binary theo nền tảng) được cài đặt tự động qua hook postinstall. Nếu cài đặt tự động thất bại, gateway vẫn khởi động bình thường và báo cáo phụ thuộc bị thiếu qua `openclaw acp doctor`.

### Cầu nối MCP cho công cụ Plugin

Theo mặc định, các phiên ACPX **không** cung cấp công cụ do Plugin OpenClaw đăng ký cho ACP harness.

Nếu bạn muốn các tác nhân ACP như Codex hoặc Claude Code gọi các công cụ Plugin OpenClaw đã cài đặt như recall/store bộ nhớ, hãy bật cầu nối chuyên dụng:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Việc này làm gì:

- Chèn một MCP server tích hợp tên là `openclaw-plugin-tools` vào bootstrap phiên ACPX.
- Cung cấp các công cụ Plugin đã được đăng ký bởi các Plugin OpenClaw đã cài đặt và đang bật.
- Giữ tính năng này là tường minh và tắt mặc định.

Ghi chú về bảo mật và độ tin cậy:

- Việc này mở rộng bề mặt công cụ của ACP harness.
- Tác nhân ACP chỉ có quyền truy cập vào các công cụ Plugin đã hoạt động trong gateway.
- Hãy xem đây là cùng ranh giới tin cậy với việc cho phép các Plugin đó thực thi trong chính OpenClaw.
- Xem lại các Plugin đã cài đặt trước khi bật tính năng này.

`mcpServers` tùy chỉnh vẫn hoạt động như trước. Cầu nối plugin-tools tích hợp là một tiện ích bổ sung chọn tham gia, không thay thế cấu hình MCP server chung.

### Cầu nối MCP cho công cụ OpenClaw

Theo mặc định, các phiên ACPX cũng **không** cung cấp công cụ OpenClaw tích hợp thông qua MCP. Bật cầu nối core-tools riêng khi một tác nhân ACP cần các công cụ tích hợp đã chọn như `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Việc này làm gì:

- Chèn một MCP server tích hợp tên là `openclaw-tools` vào bootstrap phiên ACPX.
- Cung cấp các công cụ OpenClaw tích hợp đã chọn. Server ban đầu cung cấp `cron`.
- Giữ việc lộ công cụ lõi là tường minh và tắt mặc định.

### Cấu hình thời gian chờ runtime

Plugin `acpx` được đóng gói mặc định đặt thời gian chờ cho các lượt runtime nhúng là 120 giây. Điều này cho các harness chậm hơn như Gemini CLI đủ thời gian để hoàn tất khởi động và khởi tạo ACP. Hãy ghi đè nếu host của bạn cần giới hạn runtime khác:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Khởi động lại gateway sau khi thay đổi giá trị này.

### Cấu hình tác nhân thăm dò tình trạng

Khi `/acp doctor` hoặc thăm dò khởi động chọn tham gia kiểm tra backend, Plugin `acpx` được đóng gói sẽ thăm dò một tác nhân harness. Nếu `acp.allowedAgents` được đặt, mặc định là tác nhân được phép đầu tiên; nếu không, mặc định là `codex`. Nếu triển khai của bạn cần tác nhân ACP khác cho kiểm tra tình trạng, hãy đặt tác nhân thăm dò một cách tường minh:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Khởi động lại gateway sau khi thay đổi giá trị này.

## Cấu hình quyền

Các phiên ACP chạy không tương tác — không có TTY để phê duyệt hoặc từ chối lời nhắc quyền ghi tệp và thực thi shell. Plugin acpx cung cấp hai khóa cấu hình điều khiển cách xử lý quyền:

Các quyền ACPX harness này tách biệt với phê duyệt exec của OpenClaw và tách biệt với các cờ bỏ qua của nhà cung cấp backend CLI như Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` là công tắc khẩn cấp ở cấp harness cho các phiên ACP.

### `permissionMode`

Điều khiển các thao tác mà tác nhân harness có thể thực hiện mà không cần nhắc.

| Giá trị           | Hành vi                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tự động phê duyệt mọi ghi tệp và lệnh shell.          |
| `approve-reads` | Chỉ tự động phê duyệt đọc; ghi và exec yêu cầu lời nhắc. |
| `deny-all`      | Từ chối mọi lời nhắc quyền.                              |

### `nonInteractivePermissions`

Điều khiển điều gì xảy ra khi một lời nhắc quyền sẽ được hiển thị nhưng không có TTY tương tác khả dụng (điều này luôn đúng với các phiên ACP).

| Giá trị  | Hành vi                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Hủy phiên với `AcpRuntimeError`. **(mặc định)**           |
| `deny` | Âm thầm từ chối quyền và tiếp tục (suy giảm nhẹ nhàng). |

### Cấu hình

Đặt qua cấu hình Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Khởi động lại gateway sau khi thay đổi các giá trị này.

<Warning>
OpenClaw mặc định là `permissionMode=approve-reads` và `nonInteractivePermissions=fail`. Trong các phiên ACP không tương tác, mọi thao tác ghi hoặc exec kích hoạt lời nhắc quyền đều có thể thất bại với `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Nếu bạn cần hạn chế quyền, hãy đặt `nonInteractivePermissions` thành `deny` để các phiên suy giảm nhẹ nhàng thay vì sập.
</Warning>

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents) — tổng quan, runbook vận hành, khái niệm
- [Tác nhân phụ](/vi/tools/subagents)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
