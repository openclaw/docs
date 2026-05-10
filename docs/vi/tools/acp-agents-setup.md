---
read_when:
    - Cài đặt hoặc cấu hình bộ khung acpx cho Claude Code / Codex / Gemini CLI
    - Bật cầu nối MCP plugin-tools hoặc OpenClaw-tools
    - Cấu hình các chế độ quyền ACP
summary: 'Thiết lập tác tử ACP: cấu hình harness acpx, thiết lập Plugin, quyền'
title: Tác nhân ACP — thiết lập
x-i18n:
    generated_at: "2026-05-10T19:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Để xem phần tổng quan, sổ tay vận hành và các khái niệm, hãy xem [tác tử ACP](/vi/tools/acp-agents).

Các phần dưới đây trình bày cấu hình harness acpx, thiết lập plugin cho các cầu nối MCP và cấu hình quyền.

Chỉ dùng trang này khi bạn đang thiết lập tuyến ACP/acpx. Với cấu hình runtime app-server Codex gốc, hãy dùng [harness Codex](/vi/plugins/codex-harness). Với khóa API OpenAI hoặc cấu hình nhà cung cấp mô hình OAuth của Codex, hãy dùng [OpenAI](/vi/providers/openai).

Codex có hai tuyến OpenClaw:

| Tuyến                      | Cấu hình/lệnh                                         | Trang thiết lập                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server Codex gốc    | `/codex ...`, tham chiếu tác tử `openai/gpt-*`                | [harness Codex](/vi/plugins/codex-harness) |
| Bộ điều hợp ACP Codex rõ ràng | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Trang này                               |

Ưu tiên tuyến gốc trừ khi bạn cần rõ ràng hành vi ACP/acpx.

## Hỗ trợ harness acpx (hiện tại)

Các bí danh harness tích hợp sẵn của acpx hiện tại:

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

Khi OpenClaw dùng backend acpx, hãy ưu tiên các giá trị này cho `agentId` trừ khi cấu hình acpx của bạn định nghĩa bí danh tác tử tùy chỉnh.
Nếu bản cài đặt Cursor cục bộ của bạn vẫn cung cấp ACP dưới dạng `agent acp`, hãy ghi đè lệnh tác tử `cursor` trong cấu hình acpx thay vì thay đổi mặc định tích hợp sẵn.

Việc dùng acpx CLI trực tiếp cũng có thể nhắm tới các bộ điều hợp tùy ý qua `--agent <command>`, nhưng lối thoát thô đó là một tính năng của acpx CLI (không phải đường dẫn `agentId` OpenClaw thông thường).

Việc điều khiển mô hình phụ thuộc vào năng lực của bộ điều hợp. Tham chiếu mô hình ACP của Codex được OpenClaw chuẩn hóa trước khi khởi động. Các harness khác cần ACP `models` cùng hỗ trợ `session/set_model`; nếu harness không cung cấp năng lực ACP đó lẫn cờ mô hình khởi động riêng, OpenClaw/acpx không thể bắt buộc chọn mô hình.

## Cấu hình bắt buộc

Nền tảng ACP cốt lõi:

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

Cấu hình liên kết luồng tùy thuộc vào bộ điều hợp kênh. Ví dụ cho Discord:

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

Nếu spawn ACP gắn với luồng không hoạt động, trước tiên hãy kiểm tra cờ tính năng của bộ điều hợp:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Liên kết cuộc trò chuyện hiện tại không yêu cầu tạo luồng con. Chúng yêu cầu ngữ cảnh cuộc trò chuyện đang hoạt động và bộ điều hợp kênh cung cấp liên kết cuộc trò chuyện ACP.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Thiết lập plugin cho backend acpx

Các bản cài đặt đóng gói dùng plugin runtime `@openclaw/acpx` chính thức cho ACP.
Cài đặt và bật plugin này trước khi dùng các phiên harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các checkout mã nguồn cũng có thể dùng plugin workspace cục bộ sau `pnpm install`.

Bắt đầu với:

```text
/acp doctor
```

Nếu bạn đã tắt `acpx`, từ chối nó qua `plugins.allow` / `plugins.deny`, hoặc muốn chuyển lại về plugin đóng gói, hãy dùng đường dẫn gói rõ ràng:

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

Theo mặc định, plugin `acpx` thăm dò backend ACP nhúng trong khi Gateway khởi động và chờ thăm dò đó trước tín hiệu `ready` của gateway. Đặt `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` để bỏ qua thăm dò khởi động và đăng ký backend theo kiểu lazy. Chạy `/acp doctor` để thăm dò theo yêu cầu rõ ràng.

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
- Đường dẫn `command` tùy chỉnh tắt tự động cài đặt cục bộ của plugin.

Ghi đè một lệnh tác tử ACP riêng lẻ bằng đối số có cấu trúc khi một đường dẫn hoặc giá trị cờ cần giữ nguyên là một token argv:

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

- `agents.<id>.command` là tệp thực thi hoặc chuỗi lệnh hiện có cho tác tử ACP đó.
- `agents.<id>.args` là tùy chọn. Mỗi mục mảng được shell-quote trước khi OpenClaw truyền nó qua registry chuỗi lệnh acpx hiện tại.

Xem [Plugin](/vi/tools/plugin).

### Tự động cài đặt phụ thuộc

Khi bạn cài đặt OpenClaw toàn cục bằng `npm install -g openclaw`, các phụ thuộc runtime acpx (nhị phân theo nền tảng) được cài đặt tự động qua hook postinstall. Nếu cài đặt tự động thất bại, gateway vẫn khởi động bình thường và báo phụ thuộc bị thiếu qua `openclaw acp doctor`.

### Cầu nối MCP công cụ plugin

Theo mặc định, các phiên ACPX **không** cung cấp công cụ do plugin OpenClaw đăng ký cho harness ACP.

Nếu bạn muốn các tác tử ACP như Codex hoặc Claude Code gọi các công cụ plugin OpenClaw đã cài đặt như recall/store bộ nhớ, hãy bật cầu nối chuyên dụng:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Việc này làm gì:

- Chèn một máy chủ MCP tích hợp sẵn tên là `openclaw-plugin-tools` vào bootstrap phiên ACPX.
- Cung cấp các công cụ plugin đã được đăng ký bởi các plugin OpenClaw đã cài đặt và đang bật.
- Giữ tính năng này là rõ ràng và mặc định tắt.

Ghi chú về bảo mật và tin cậy:

- Điều này mở rộng bề mặt công cụ của harness ACP.
- Tác tử ACP chỉ có quyền truy cập các công cụ plugin đã hoạt động trong gateway.
- Hãy xem đây là cùng ranh giới tin cậy như việc cho phép các plugin đó thực thi trong chính OpenClaw.
- Xem xét các plugin đã cài đặt trước khi bật tính năng này.

`mcpServers` tùy chỉnh vẫn hoạt động như trước. Cầu nối plugin-tools tích hợp sẵn là một tiện ích chọn bật bổ sung, không phải thay thế cho cấu hình máy chủ MCP chung.

### Cầu nối MCP công cụ OpenClaw

Theo mặc định, các phiên ACPX cũng **không** cung cấp công cụ OpenClaw tích hợp sẵn thông qua MCP. Bật cầu nối công cụ lõi riêng khi một tác tử ACP cần các công cụ tích hợp sẵn đã chọn như `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Việc này làm gì:

- Chèn một máy chủ MCP tích hợp sẵn tên là `openclaw-tools` vào bootstrap phiên ACPX.
- Cung cấp các công cụ OpenClaw tích hợp sẵn đã chọn. Máy chủ ban đầu cung cấp `cron`.
- Giữ việc phơi bày công cụ lõi là rõ ràng và mặc định tắt.

### Cấu hình thời gian chờ runtime

Plugin `acpx` mặc định đặt thời gian chờ các lượt runtime nhúng là 120 giây. Điều này cho các harness chậm hơn như Gemini CLI đủ thời gian để hoàn tất khởi động và khởi tạo ACP. Ghi đè giá trị này nếu máy chủ của bạn cần giới hạn runtime khác:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Khởi động lại gateway sau khi thay đổi giá trị này.

### Cấu hình tác tử thăm dò tình trạng

Khi `/acp doctor` hoặc thăm dò khởi động kiểm tra backend, plugin `acpx` đi kèm sẽ thăm dò một tác tử harness. Nếu `acp.allowedAgents` được đặt, nó mặc định là tác tử được phép đầu tiên; nếu không, mặc định là `codex`. Nếu triển khai của bạn cần một tác tử ACP khác cho kiểm tra tình trạng, hãy đặt tác tử thăm dò rõ ràng:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Khởi động lại gateway sau khi thay đổi giá trị này.

## Cấu hình quyền

Các phiên ACP chạy không tương tác — không có TTY để phê duyệt hoặc từ chối lời nhắc quyền ghi tệp và thực thi shell. Plugin acpx cung cấp hai khóa cấu hình kiểm soát cách xử lý quyền:

Các quyền harness ACPX này tách biệt với phê duyệt exec của OpenClaw và tách biệt với các cờ bỏ qua của nhà cung cấp backend CLI như Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` là công tắc khẩn cấp cấp harness cho các phiên ACP.

### `permissionMode`

Kiểm soát những thao tác tác tử harness có thể thực hiện mà không cần nhắc.

| Giá trị           | Hành vi                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tự động phê duyệt mọi lệnh ghi tệp và lệnh shell.          |
| `approve-reads` | Chỉ tự động phê duyệt thao tác đọc; ghi và exec cần lời nhắc. |
| `deny-all`      | Từ chối mọi lời nhắc quyền.                              |

### `nonInteractivePermissions`

Kiểm soát điều xảy ra khi lẽ ra lời nhắc quyền sẽ hiển thị nhưng không có TTY tương tác khả dụng (điều này luôn đúng với các phiên ACP).

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
OpenClaw mặc định dùng `permissionMode=approve-reads` và `nonInteractivePermissions=fail`. Trong các phiên ACP không tương tác, bất kỳ thao tác ghi hoặc exec nào kích hoạt lời nhắc quyền đều có thể thất bại với `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Nếu bạn cần hạn chế quyền, hãy đặt `nonInteractivePermissions` thành `deny` để các phiên suy giảm nhẹ nhàng thay vì bị crash.
</Warning>

## Liên quan

- [tác tử ACP](/vi/tools/acp-agents) — tổng quan, sổ tay vận hành, khái niệm
- [Tác tử phụ](/vi/tools/subagents)
- [Định tuyến đa tác tử](/vi/concepts/multi-agent)
