---
read_when:
    - Cài đặt hoặc cấu hình bộ khung acpx cho Claude Code / Codex / Gemini CLI
    - Bật cầu nối MCP plugin-tools hoặc OpenClaw-tools
    - Cấu hình các chế độ quyền ACP
summary: 'Thiết lập tác nhân ACP: cấu hình bộ khung acpx, thiết lập Plugin, quyền truy cập'
title: Tác tử ACP — thiết lập
x-i18n:
    generated_at: "2026-07-12T08:24:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Để xem tổng quan, sổ tay vận hành và các khái niệm, hãy xem [tác tử ACP](/vi/tools/acp-agents).

Trang này trình bày cấu hình bộ thực thi acpx, thiết lập Plugin cho các cầu nối MCP và cấu hình quyền.

Chỉ sử dụng trang này khi bạn đang thiết lập tuyến ACP/acpx. Đối với cấu hình thời gian chạy app-server Codex gốc, hãy sử dụng [bộ thực thi Codex](/vi/plugins/codex-harness). Đối với khóa API OpenAI hoặc cấu hình nhà cung cấp mô hình OAuth của Codex, hãy sử dụng [OpenAI](/vi/providers/openai).

Codex có hai tuyến OpenClaw:

| Tuyến                         | Cấu hình/lệnh                                           | Trang thiết lập                             |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| App-server Codex gốc          | `/codex ...`, tham chiếu tác tử `openai/gpt-*`          | [Bộ thực thi Codex](/vi/plugins/codex-harness) |
| Bộ chuyển đổi Codex ACP tường minh | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Trang này                                   |

Ưu tiên tuyến gốc trừ khi bạn thực sự cần hành vi ACP/acpx.

## Hỗ trợ bộ thực thi acpx (hiện tại)

Các bí danh bộ thực thi acpx tích hợp sẵn (từ phần phụ thuộc `acpx` được ghim phiên bản):

| Bí danh      | Bao bọc                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Cầu nối ACP của OpenClaw (`openclaw acp` gốc)                                                                  |
| `pi`         | [Tác tử lập trình Pi](https://github.com/mariozechner/pi)                                                       |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` và `factorydroid` cũng được phân giải thành bộ chuyển đổi `droid` tích hợp sẵn.

Khi OpenClaw sử dụng backend acpx, hãy ưu tiên các giá trị này cho `agentId`, trừ khi cấu hình acpx của bạn định nghĩa các bí danh tác tử tùy chỉnh.
Nếu bản cài đặt Cursor cục bộ của bạn vẫn cung cấp ACP dưới dạng `agent acp`, hãy ghi đè lệnh tác tử `cursor` trong cấu hình acpx thay vì thay đổi giá trị mặc định tích hợp sẵn.

Việc sử dụng trực tiếp CLI acpx cũng có thể nhắm đến các bộ chuyển đổi tùy ý thông qua `--agent <command>`, nhưng lối thoát thô này là một tính năng của CLI acpx (không phải đường dẫn `agentId` thông thường của OpenClaw).

Khả năng kiểm soát mô hình phụ thuộc vào năng lực của bộ chuyển đổi. Các tham chiếu mô hình Codex ACP được OpenClaw chuẩn hóa trước khi khởi động. Các bộ thực thi khác cần hỗ trợ `models` của ACP cùng với `session/set_model`; nếu một bộ thực thi không cung cấp năng lực ACP đó cũng như cờ mô hình khởi động riêng, OpenClaw/acpx không thể buộc chọn mô hình.

## Cấu hình bắt buộc

Cấu hình cơ sở ACP lõi:

```json5
{
  acp: {
    enabled: true,
    // Không bắt buộc. Mặc định là true; đặt thành false để tạm dừng điều phối ACP trong khi vẫn giữ các điều khiển /acp.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Giá trị mặc định là coalesceIdleMs: 350, maxChunkChars: 1800; được hiển thị tường minh tại đây.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Cấu hình liên kết luồng phụ thuộc vào từng bộ chuyển đổi kênh. Ví dụ cho Discord:

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
        // Giá trị mặc định đã là true; được hiển thị tường minh tại đây.
        spawnSessions: true,
      },
    },
  },
}
```

Nếu việc tạo ACP liên kết với luồng không hoạt động, trước tiên hãy xác minh cờ tính năng của bộ chuyển đổi:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Các liên kết với cuộc trò chuyện hiện tại không yêu cầu tạo luồng con. Chúng yêu cầu ngữ cảnh cuộc trò chuyện đang hoạt động và một bộ chuyển đổi kênh cung cấp liên kết cuộc trò chuyện ACP.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Thiết lập Plugin cho backend acpx

Các bản cài đặt đóng gói sử dụng Plugin thời gian chạy chính thức `@openclaw/acpx` cho ACP.
Hãy cài đặt và bật Plugin này trước khi sử dụng các phiên bộ thực thi ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các bản checkout mã nguồn cũng có thể sử dụng Plugin workspace cục bộ sau khi chạy `pnpm install`.

Bắt đầu bằng:

```text
/acp doctor
```

Nếu bạn đã tắt `acpx`, từ chối nó thông qua `plugins.allow` / `plugins.deny`, hoặc muốn chuyển lại sang Plugin đóng gói, hãy sử dụng đường dẫn gói tường minh:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Cài đặt workspace cục bộ trong quá trình phát triển:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Sau đó xác minh tình trạng của backend:

```text
/acp doctor
```

### Phép dò khởi động thời gian chạy acpx

Plugin `acpx` nhúng trực tiếp thời gian chạy ACP (không có tệp nhị phân `acpx` hoặc phiên bản riêng cần cấu hình). Theo mặc định, Plugin đăng ký backend nhúng trong quá trình khởi động Gateway và chờ phép dò khởi động hoàn tất trước tín hiệu `ready` của Gateway. Chỉ đặt `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` hoặc `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` cho các tập lệnh hoặc môi trường cố ý tắt phép dò khởi động. Chạy `/acp doctor` để thực hiện phép dò theo yêu cầu một cách tường minh.

Ghi đè lệnh của một tác tử ACP riêng lẻ bằng các đối số có cấu trúc khi đường dẫn hoặc giá trị cờ cần được giữ nguyên dưới dạng một token argv:

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

- `agents.<id>.command` là tệp thực thi hoặc chuỗi lệnh hiện có dành cho tác tử ACP đó.
- `agents.<id>.args` là tùy chọn. Mỗi phần tử mảng được đặt trong dấu nháy shell trước khi OpenClaw chuyển nó qua sổ đăng ký chuỗi lệnh acpx hiện tại.

Xem [Plugin](/vi/tools/plugin).

### Tự động tải xuống bộ chuyển đổi

`acpx` tự động tải xuống các bộ chuyển đổi ACP (ví dụ: các cầu nối ACP của Claude và Codex) thông qua `npx` trong lần sử dụng đầu tiên. Bạn không cần cài đặt thủ công các gói bộ chuyển đổi và không có bước postinstall riêng cho chính OpenClaw. Nếu quá trình tải xuống hoặc khởi tạo bộ chuyển đổi thất bại, `/acp doctor` sẽ báo cáo lỗi.

### Cầu nối MCP cho công cụ Plugin

Theo mặc định, các phiên ACPX **không** cung cấp các công cụ do Plugin OpenClaw đăng ký cho bộ thực thi ACP.

Nếu bạn muốn các tác tử ACP như Codex hoặc Claude Code gọi những công cụ của Plugin OpenClaw đã cài đặt, chẳng hạn như truy xuất/lưu trữ bộ nhớ, hãy bật cầu nối chuyên dụng:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Tác dụng:

- Chèn một máy chủ MCP tích hợp sẵn có tên `openclaw-plugin-tools` vào quá trình khởi tạo phiên ACPX.
- Cung cấp các công cụ Plugin đã được đăng ký bởi những Plugin OpenClaw đã cài đặt và bật.
- Giữ tính năng này ở trạng thái tường minh và tắt theo mặc định.

Lưu ý về bảo mật và độ tin cậy:

- Việc này mở rộng bề mặt công cụ của bộ thực thi ACP.
- Các tác tử ACP chỉ có quyền truy cập vào những công cụ Plugin đã hoạt động trong Gateway.
- Hãy coi đây là cùng một ranh giới tin cậy với việc cho phép các Plugin đó thực thi trong chính OpenClaw.
- Xem xét các Plugin đã cài đặt trước khi bật tính năng này.

Các `mcpServers` tùy chỉnh vẫn hoạt động như trước. Cầu nối công cụ Plugin tích hợp sẵn là một tiện ích bổ sung cần chủ động bật, không phải phương án thay thế cho cấu hình máy chủ MCP chung.

### Cầu nối MCP cho công cụ OpenClaw

Theo mặc định, các phiên ACPX cũng **không** cung cấp các công cụ OpenClaw tích hợp sẵn thông qua MCP. Hãy bật cầu nối công cụ lõi riêng biệt khi một tác tử ACP cần các công cụ tích hợp sẵn được chọn, chẳng hạn như `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Tác dụng:

- Chèn một máy chủ MCP tích hợp sẵn có tên `openclaw-tools` vào quá trình khởi tạo phiên ACPX.
- Cung cấp các công cụ OpenClaw tích hợp sẵn được chọn. Máy chủ ban đầu cung cấp `cron`.
- Giữ việc cung cấp công cụ lõi ở trạng thái tường minh và tắt theo mặc định.

### Cấu hình thời gian chờ thao tác thời gian chạy

Theo mặc định, Plugin `acpx` dành 120 giây cho các thao tác khởi động và điều khiển thời gian chạy nhúng. Điều này cho phép các bộ thực thi chậm hơn, chẳng hạn như Gemini CLI, có đủ thời gian để hoàn tất quá trình khởi động và khởi tạo ACP. Hãy ghi đè nếu máy chủ của bạn cần giới hạn thao tác khác:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Các lượt thời gian chạy sử dụng thời gian chờ tác tử/lần chạy của OpenClaw, bao gồm `/acp timeout`.
`sessions_spawn` không chấp nhận ghi đè thời gian chờ theo từng lần gọi; đường dẫn dành cho người vận hành là `agents.defaults.subagents.runTimeoutSeconds`. Khởi động lại Gateway sau khi thay đổi `timeoutSeconds`.

### Cấu hình tác tử dò tình trạng

Khi `/acp doctor` hoặc phép dò khởi động kiểm tra backend, Plugin `acpx` đi kèm sẽ dò một tác tử bộ thực thi. Nếu `acp.allowedAgents` được đặt, giá trị mặc định là tác tử được phép đầu tiên; nếu không, giá trị mặc định là `codex`. Nếu việc triển khai của bạn cần một tác tử ACP khác để kiểm tra tình trạng, hãy đặt tác tử dò một cách tường minh:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Khởi động lại Gateway sau khi thay đổi giá trị này.

## Cấu hình quyền

Các phiên ACP chạy không tương tác — không có TTY để phê duyệt hoặc từ chối lời nhắc quyền ghi tệp và thực thi shell. Plugin acpx cung cấp hai khóa cấu hình kiểm soát cách xử lý quyền:

Các quyền của bộ thực thi ACPX này tách biệt với phê duyệt thực thi của OpenClaw và tách biệt với các cờ bỏ qua của nhà cung cấp backend CLI, chẳng hạn như `--permission-mode bypassPermissions` của Claude CLI. `approve-all` của ACPX là công tắc khẩn cấp ở cấp bộ thực thi dành cho các phiên ACP.

Để xem phần so sánh rộng hơn giữa `tools.exec.mode` của OpenClaw, phê duyệt Codex Guardian và quyền của bộ thực thi ACPX, hãy xem [Chế độ quyền](/vi/tools/permission-modes).

### `permissionMode`

Kiểm soát những thao tác mà tác tử bộ thực thi có thể thực hiện mà không cần nhắc.

| Giá trị         | Hành vi                                                          |
| --------------- | ----------------------------------------------------------------- |
| `approve-all`   | Tự động phê duyệt mọi thao tác ghi tệp và lệnh shell.             |
| `approve-reads` | Chỉ tự động phê duyệt thao tác đọc; ghi và thực thi cần xác nhận. |
| `deny-all`      | Từ chối mọi yêu cầu cấp quyền.                                    |

### `nonInteractivePermissions`

Kiểm soát điều gì xảy ra khi lẽ ra một yêu cầu cấp quyền được hiển thị nhưng không có TTY tương tác (điều này luôn đúng đối với các phiên ACP).

| Giá trị | Hành vi                                                                    |
| ------- | -------------------------------------------------------------------------- |
| `fail`  | Hủy phiên với `PermissionPromptUnavailableError`. **(mặc định)**           |
| `deny`  | Âm thầm từ chối quyền và tiếp tục (suy giảm chức năng một cách nhẹ nhàng). |

### Cấu hình

Thiết lập thông qua cấu hình Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Khởi động lại Gateway sau khi thay đổi các giá trị này.

<Warning>
OpenClaw mặc định sử dụng `permissionMode=approve-reads` và `nonInteractivePermissions=fail`. Trong các phiên ACP không tương tác, mọi thao tác ghi hoặc thực thi kích hoạt yêu cầu cấp quyền đều có thể thất bại với `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Nếu cần hạn chế quyền, hãy đặt `nonInteractivePermissions` thành `deny` để các phiên suy giảm chức năng một cách nhẹ nhàng thay vì gặp sự cố.
</Warning>

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents) — tổng quan, cẩm nang vận hành, khái niệm
- [Tác nhân phụ](/vi/tools/subagents)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
