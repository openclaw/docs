---
read_when:
    - Cài đặt hoặc cấu hình harness acpx cho Claude Code / Codex / Gemini CLI
    - Bật cầu nối MCP plugin-tools hoặc OpenClaw-tools
    - Định cấu hình các chế độ quyền ACP
summary: 'Thiết lập tác nhân ACP: cấu hình bộ chạy acpx, thiết lập Plugin, quyền'
title: Tác nhân ACP — thiết lập
x-i18n:
    generated_at: "2026-06-27T18:13:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Để xem tổng quan, sổ tay vận hành và các khái niệm, hãy xem [tác nhân ACP](/vi/tools/acp-agents).

Các phần bên dưới trình bày cấu hình harness acpx, thiết lập plugin cho các cầu nối MCP và cấu hình quyền.

Chỉ dùng trang này khi bạn đang thiết lập tuyến ACP/acpx. Đối với cấu hình runtime app-server Codex gốc, hãy dùng [harness Codex](/vi/plugins/codex-harness). Đối với khóa API OpenAI hoặc cấu hình nhà cung cấp mô hình OAuth Codex, hãy dùng
[OpenAI](/vi/providers/openai).

Codex có hai tuyến OpenClaw:

| Tuyến                      | Cấu hình/lệnh                                         | Trang thiết lập                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server Codex gốc    | `/codex ...`, `openai/gpt-*` agent refs                | [harness Codex](/vi/plugins/codex-harness) |
| Bộ chuyển tiếp ACP Codex tường minh | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Trang này                               |

Ưu tiên tuyến gốc trừ khi bạn cần rõ ràng hành vi ACP/acpx.

## Hỗ trợ harness acpx (hiện tại)

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
- `qwen`

Khi OpenClaw dùng backend acpx, hãy ưu tiên các giá trị này cho `agentId` trừ khi cấu hình acpx của bạn định nghĩa bí danh tác nhân tùy chỉnh.
Nếu bản cài đặt Cursor cục bộ của bạn vẫn cung cấp ACP dưới dạng `agent acp`, hãy ghi đè lệnh tác nhân `cursor` trong cấu hình acpx thay vì thay đổi mặc định tích hợp.

Việc dùng trực tiếp CLI acpx cũng có thể nhắm đến các bộ chuyển tiếp tùy ý qua `--agent <command>`, nhưng lối thoát thô đó là một tính năng CLI acpx (không phải đường dẫn `agentId` OpenClaw thông thường).

Điều khiển mô hình phụ thuộc vào năng lực của bộ chuyển tiếp. Các tham chiếu mô hình Codex ACP được OpenClaw chuẩn hóa trước khi khởi động. Các harness khác cần ACP `models` cùng hỗ trợ `session/set_model`; nếu một harness không cung cấp năng lực ACP đó và cũng không có cờ mô hình khi khởi động riêng, OpenClaw/acpx không thể ép chọn mô hình.

## Cấu hình bắt buộc

Nền tảng ACP lõi:

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
      "openclaw",
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

Cấu hình ràng buộc luồng phụ thuộc vào bộ chuyển tiếp kênh. Ví dụ cho Discord:

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

Nếu spawn ACP gắn với luồng không hoạt động, trước tiên hãy xác minh cờ tính năng của bộ chuyển tiếp:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Các ràng buộc cuộc trò chuyện hiện tại không yêu cầu tạo luồng con. Chúng yêu cầu ngữ cảnh cuộc trò chuyện đang hoạt động và một bộ chuyển tiếp kênh cung cấp ràng buộc cuộc trò chuyện ACP.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Thiết lập Plugin cho backend acpx

Các bản cài đặt đóng gói dùng Plugin runtime chính thức `@openclaw/acpx` cho ACP.
Hãy cài đặt và bật nó trước khi dùng các phiên harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các checkout mã nguồn cũng có thể dùng Plugin workspace cục bộ sau `pnpm install`.

Bắt đầu với:

```text
/acp doctor
```

Nếu bạn đã tắt `acpx`, từ chối nó qua `plugins.allow` / `plugins.deny`, hoặc muốn chuyển lại sang Plugin đóng gói, hãy dùng đường dẫn gói tường minh:

```bash
openclaw plugins install @openclaw/acpx
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

Theo mặc định, Plugin `acpx` đăng ký backend ACP nhúng trong quá trình khởi động Gateway và chờ probe khởi động runtime nhúng trước tín hiệu `ready` của Gateway. Chỉ đặt `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` hoặc
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` cho các script hoặc môi trường cố ý tắt probe khởi động. Chạy `/acp doctor` để probe theo yêu cầu một cách tường minh.

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
- `expectedVersion: "any"` tắt so khớp phiên bản nghiêm ngặt.
- Các đường dẫn `command` tùy chỉnh tắt tự động cài đặt cục bộ của Plugin.

Ghi đè lệnh của một tác nhân ACP riêng lẻ bằng đối số có cấu trúc khi một đường dẫn hoặc giá trị cờ cần giữ nguyên là một token argv:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` là tệp thực thi hoặc chuỗi lệnh hiện có cho tác nhân ACP đó.
- `agents.<id>.args` là tùy chọn. Mỗi mục trong mảng được trích dẫn theo shell trước khi OpenClaw chuyển nó qua registry chuỗi lệnh acpx hiện tại.

Xem [Plugin](/vi/tools/plugin).

### Cài đặt phụ thuộc tự động

Khi bạn cài OpenClaw toàn cục bằng `npm install -g openclaw`, các phụ thuộc runtime acpx (nhị phân theo nền tảng) được cài đặt tự động qua hook postinstall. Nếu cài đặt tự động thất bại, Gateway vẫn khởi động bình thường và báo phụ thuộc bị thiếu qua `openclaw acp doctor`.

### Cầu nối MCP công cụ Plugin

Theo mặc định, các phiên ACPX **không** cung cấp các công cụ do Plugin OpenClaw đăng ký cho harness ACP.

Nếu bạn muốn các tác nhân ACP như Codex hoặc Claude Code gọi các công cụ Plugin OpenClaw đã cài đặt, chẳng hạn như ghi nhớ/lưu bộ nhớ, hãy bật cầu nối chuyên dụng:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Việc này làm gì:

- Tiêm một máy chủ MCP tích hợp có tên `openclaw-plugin-tools` vào bootstrap phiên ACPX.
- Cung cấp các công cụ Plugin đã được các Plugin OpenClaw đã cài đặt và bật đăng ký.
- Giữ tính năng này tường minh và mặc định tắt.

Ghi chú về bảo mật và tin cậy:

- Việc này mở rộng bề mặt công cụ của harness ACP.
- Các tác nhân ACP chỉ có quyền truy cập vào các công cụ Plugin đã hoạt động trong Gateway.
- Hãy xem đây là cùng ranh giới tin cậy với việc cho phép các Plugin đó thực thi trong chính OpenClaw.
- Rà soát các Plugin đã cài đặt trước khi bật tính năng này.

`mcpServers` tùy chỉnh vẫn hoạt động như trước. Cầu nối công cụ Plugin tích hợp là một tiện ích bổ sung cần chủ động bật, không phải thay thế cho cấu hình máy chủ MCP chung.

### Cầu nối MCP công cụ OpenClaw

Theo mặc định, các phiên ACPX cũng **không** cung cấp các công cụ OpenClaw tích hợp qua MCP. Bật cầu nối công cụ lõi riêng khi một tác nhân ACP cần các công cụ tích hợp được chọn, chẳng hạn như `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Việc này làm gì:

- Tiêm một máy chủ MCP tích hợp có tên `openclaw-tools` vào bootstrap phiên ACPX.
- Cung cấp các công cụ OpenClaw tích hợp được chọn. Máy chủ ban đầu cung cấp `cron`.
- Giữ việc lộ công cụ lõi là tường minh và mặc định tắt.

### Cấu hình thời gian chờ thao tác runtime

Plugin `acpx` mặc định cấp 120 giây cho quá trình khởi động runtime nhúng và các thao tác điều khiển. Điều này cho các harness chậm hơn như Gemini CLI đủ thời gian để hoàn tất khởi động và khởi tạo ACP. Ghi đè giá trị này nếu máy chủ của bạn cần giới hạn thao tác khác:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Các lượt runtime dùng thời gian chờ tác nhân/lần chạy của OpenClaw, bao gồm `/acp timeout`.
`sessions_spawn` không chấp nhận ghi đè thời gian chờ theo từng lệnh gọi. Khởi động lại Gateway sau khi thay đổi giá trị này.

### Cấu hình tác nhân probe tình trạng

Khi `/acp doctor` hoặc probe khởi động kiểm tra backend, Plugin `acpx` đi kèm sẽ probe một tác nhân harness. Nếu `acp.allowedAgents` được đặt, mặc định là tác nhân được phép đầu tiên; nếu không, mặc định là `codex`. Nếu triển khai của bạn cần một tác nhân ACP khác cho kiểm tra tình trạng, hãy đặt tác nhân probe tường minh:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Khởi động lại Gateway sau khi thay đổi giá trị này.

## Cấu hình quyền

Các phiên ACP chạy không tương tác — không có TTY để phê duyệt hoặc từ chối lời nhắc quyền ghi tệp và thực thi shell. Plugin acpx cung cấp hai khóa cấu hình kiểm soát cách xử lý quyền:

Các quyền harness ACPX này tách biệt với phê duyệt exec của OpenClaw và tách biệt với các cờ bỏ qua của nhà cung cấp backend CLI, chẳng hạn như Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` là công tắc khẩn cấp cấp harness cho các phiên ACP.

Để xem so sánh rộng hơn giữa OpenClaw `tools.exec.mode`, phê duyệt Codex Guardian và quyền harness ACPX, hãy xem
[Chế độ quyền](/vi/tools/permission-modes).

### `permissionMode`

Kiểm soát những thao tác mà tác nhân harness có thể thực hiện mà không cần nhắc.

| Giá trị           | Hành vi                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tự động phê duyệt tất cả lệnh ghi tệp và lệnh shell.          |
| `approve-reads` | Chỉ tự động phê duyệt đọc; ghi và exec yêu cầu lời nhắc. |
| `deny-all`      | Từ chối tất cả lời nhắc quyền.                              |

### `nonInteractivePermissions`

Kiểm soát điều gì xảy ra khi một lời nhắc quyền sẽ được hiển thị nhưng không có TTY tương tác khả dụng (điều này luôn đúng với các phiên ACP).

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

Khởi động lại Gateway sau khi thay đổi các giá trị này.

<Warning>
OpenClaw mặc định dùng `permissionMode=approve-reads` và `nonInteractivePermissions=fail`. Trong các phiên ACP không tương tác, mọi thao tác ghi hoặc exec kích hoạt lời nhắc quyền đều có thể thất bại với `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Nếu bạn cần hạn chế quyền, hãy đặt `nonInteractivePermissions` thành `deny` để các phiên suy giảm nhẹ nhàng thay vì gặp lỗi sập.
</Warning>

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents) — tổng quan, sổ tay vận hành, khái niệm
- [Tác nhân phụ](/vi/tools/subagents)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
