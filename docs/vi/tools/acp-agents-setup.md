---
read_when:
    - Cài đặt hoặc cấu hình bộ khung acpx cho Claude Code / Codex / Gemini CLI
    - Bật cầu nối MCP plugin-tools hoặc OpenClaw-tools
    - Cấu hình các chế độ quyền của ACP
summary: 'Thiết lập tác tử ACP: cấu hình bộ khung acpx, thiết lập plugin, quyền hạn'
title: Tác nhân ACP — thiết lập
x-i18n:
    generated_at: "2026-07-16T15:51:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Để xem tổng quan, sổ tay vận hành và các khái niệm, hãy xem [tác nhân ACP](/vi/tools/acp-agents).

Trang này trình bày cấu hình harness acpx, thiết lập plugin cho các cầu nối MCP và cấu hình quyền.

Chỉ sử dụng trang này khi bạn thiết lập tuyến ACP/acpx. Để cấu hình runtime app-server Codex gốc, hãy sử dụng [harness Codex](/vi/plugins/codex-harness). Để cấu hình khóa API OpenAI hoặc nhà cung cấp mô hình Codex OAuth, hãy sử dụng [OpenAI](/vi/providers/openai).

Codex có hai tuyến OpenClaw:

| Tuyến                      | Cấu hình/lệnh                                         | Trang thiết lập                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server Codex gốc    | tham chiếu tác nhân `/codex ...`, `openai/gpt-*`                | [Harness Codex](/vi/plugins/codex-harness) |
| Bộ điều hợp Codex ACP tường minh | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Trang này                               |

Ưu tiên tuyến gốc trừ khi bạn cần rõ ràng hành vi ACP/acpx.

## Hỗ trợ harness acpx (hiện tại)

Các bí danh harness acpx tích hợp sẵn (từ phần phụ thuộc `acpx` được ghim):

| Bí danh        | Bao bọc                                                                                                           |
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
| `openclaw`   | Cầu nối ACP của OpenClaw (`openclaw acp` gốc)                                                                     |
| `pi`         | [Tác nhân lập trình Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` và `factorydroid` cũng phân giải thành bộ điều hợp `droid` tích hợp sẵn.

Khi OpenClaw sử dụng backend acpx, hãy ưu tiên các giá trị này cho `agentId` trừ khi cấu hình acpx của bạn định nghĩa bí danh tác nhân tùy chỉnh.
Nếu bản cài đặt Cursor cục bộ của bạn vẫn cung cấp ACP dưới dạng `agent acp`, hãy ghi đè lệnh tác nhân `cursor` trong cấu hình acpx thay vì thay đổi giá trị mặc định tích hợp sẵn.

Việc sử dụng trực tiếp CLI acpx cũng có thể nhắm đến các bộ điều hợp tùy ý thông qua `--agent <command>`, nhưng lối thoát thô này là một tính năng của CLI acpx (không phải đường dẫn `agentId` thông thường của OpenClaw).

Khả năng điều khiển mô hình phụ thuộc vào năng lực của bộ điều hợp. Các tham chiếu mô hình Codex ACP được OpenClaw chuẩn hóa trước khi khởi động. Các harness khác cần ACP `models` cùng hỗ trợ `session/set_model`; nếu một harness không cung cấp năng lực ACP đó cũng như cờ mô hình khởi động riêng, OpenClaw/acpx không thể buộc chọn mô hình.

## Cấu hình bắt buộc

Đường cơ sở ACP lõi:

```json5
{
  acp: {
    enabled: true,
    // Tùy chọn. Mặc định là true; đặt thành false để tạm dừng điều phối ACP trong khi vẫn giữ các điều khiển /acp.
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
      // Các giá trị mặc định là coalesceIdleMs: 350, maxChunkChars: 1800; được hiển thị tường minh tại đây.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Cấu hình liên kết luồng phụ thuộc vào từng bộ điều hợp kênh. Ví dụ cho Discord:

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

Nếu việc tạo ACP liên kết với luồng không hoạt động, trước tiên hãy xác minh cờ tính năng của bộ điều hợp:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Các liên kết với cuộc trò chuyện hiện tại không yêu cầu tạo luồng con. Chúng yêu cầu ngữ cảnh cuộc trò chuyện đang hoạt động và một bộ điều hợp kênh cung cấp liên kết cuộc trò chuyện ACP.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Thiết lập plugin cho backend acpx

Các bản cài đặt đóng gói sử dụng plugin runtime `@openclaw/acpx` chính thức cho ACP.
Hãy cài đặt và bật plugin này trước khi sử dụng các phiên harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các bản checkout mã nguồn cũng có thể sử dụng plugin workspace cục bộ sau `pnpm install`.

Bắt đầu bằng:

```text
/acp doctor
```

Nếu bạn đã tắt `acpx`, từ chối nó thông qua `plugins.allow` / `plugins.deny`, hoặc muốn chuyển lại sang plugin đóng gói, hãy sử dụng đường dẫn gói tường minh:

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

### Phép thăm dò khởi động runtime acpx

Plugin `acpx` nhúng trực tiếp runtime ACP (không có tệp nhị phân hoặc phiên bản `acpx` riêng để cấu hình). Theo mặc định, plugin đăng ký backend nhúng trong lúc Gateway khởi động và chờ phép thăm dò khởi động trước tín hiệu `ready` của gateway. Chỉ đặt `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` hoặc `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` cho các tập lệnh hoặc môi trường chủ ý giữ phép thăm dò khởi động ở trạng thái tắt. Chạy `/acp doctor` để thực hiện phép thăm dò theo yêu cầu một cách tường minh.

Ghi đè lệnh của một tác nhân ACP riêng lẻ bằng các đối số có cấu trúc khi một đường dẫn hoặc giá trị cờ cần được giữ nguyên dưới dạng một token argv:

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
- `agents.<id>.args` là tùy chọn. Mỗi phần tử mảng được đặt trong dấu trích dẫn shell trước khi OpenClaw chuyển nó qua sổ đăng ký chuỗi lệnh acpx hiện tại.

Xem [Plugin](/vi/tools/plugin).

### Tự động tải xuống bộ điều hợp

`acpx` tự động tải xuống các bộ điều hợp ACP (ví dụ: các cầu nối ACP Claude và Codex) qua `npx` trong lần sử dụng đầu tiên. Bạn không cần cài đặt thủ công các gói bộ điều hợp và không có bước hậu cài đặt riêng cho chính OpenClaw. Nếu quá trình tải xuống hoặc tạo bộ điều hợp thất bại, `/acp doctor` sẽ báo cáo lỗi.

### Cầu nối MCP cho các công cụ plugin

Theo mặc định, các phiên ACPX **không** cung cấp những công cụ do plugin OpenClaw đăng ký cho harness ACP.

Nếu bạn muốn các tác nhân ACP như Codex hoặc Claude Code gọi những công cụ plugin OpenClaw đã cài đặt, chẳng hạn như truy hồi/lưu trữ bộ nhớ, hãy bật cầu nối chuyên dụng:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Tác dụng:

- Chèn một máy chủ MCP tích hợp sẵn có tên `openclaw-plugin-tools` vào quá trình khởi tạo phiên ACPX.
- Cung cấp các công cụ plugin đã được những plugin OpenClaw được cài đặt và bật đăng ký.
- Truyền danh tính phiên ACP đang hoạt động đến các hàm tạo công cụ plugin để các công cụ theo phạm vi tác nhân vẫn nằm trong không gian tên của tác nhân đó.
- Giữ tính năng này ở trạng thái tường minh và tắt theo mặc định.

Lưu ý về bảo mật và độ tin cậy:

- Điều này mở rộng bề mặt công cụ của harness ACP.
- Các tác nhân ACP chỉ có quyền truy cập vào những công cụ plugin đã hoạt động trong gateway.
- Hãy coi đây là cùng một ranh giới tin cậy như khi cho phép các plugin đó thực thi trong chính OpenClaw.
- Hãy xem xét các plugin đã cài đặt trước khi bật tính năng này.

Các `mcpServers` tùy chỉnh vẫn hoạt động như trước. Cầu nối công cụ plugin tích hợp sẵn là một tiện ích chọn bật bổ sung, không thay thế cấu hình máy chủ MCP chung.

### Cầu nối MCP cho các công cụ OpenClaw

Theo mặc định, các phiên ACPX cũng **không** cung cấp những công cụ tích hợp sẵn của OpenClaw qua MCP. Hãy bật cầu nối công cụ lõi riêng biệt khi một tác nhân ACP cần các công cụ tích hợp sẵn đã chọn, chẳng hạn như `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Tác dụng:

- Chèn một máy chủ MCP tích hợp sẵn có tên `openclaw-tools` vào quá trình khởi tạo phiên ACPX.
- Cung cấp các công cụ tích hợp sẵn đã chọn của OpenClaw. Máy chủ ban đầu cung cấp `cron`.
- Giữ việc cung cấp công cụ lõi ở trạng thái tường minh và tắt theo mặc định.

### Cấu hình thời gian chờ thao tác runtime

Theo mặc định, plugin `acpx` cấp 120 giây cho các thao tác khởi động và điều khiển runtime nhúng. Khoảng thời gian này cho phép các harness chậm hơn như Gemini CLI có đủ thời gian hoàn tất việc khởi động và khởi tạo ACP. Hãy ghi đè nếu máy chủ của bạn cần giới hạn thao tác khác:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Các lượt runtime sử dụng thời gian chờ tác nhân/lượt chạy của OpenClaw, bao gồm `/acp timeout`.
`sessions_spawn` không chấp nhận ghi đè thời gian chờ theo từng lệnh gọi; đường dẫn dành cho người vận hành là `agents.defaults.subagents.runTimeoutSeconds`. Khởi động lại gateway sau khi thay đổi `timeoutSeconds`.

### Cấu hình tác nhân thăm dò tình trạng

Khi `/acp doctor` hoặc phép thăm dò khởi động kiểm tra backend, plugin `acpx` đi kèm sẽ thăm dò một tác nhân harness. Nếu `acp.allowedAgents` được đặt, giá trị mặc định là tác nhân được phép đầu tiên; nếu không, giá trị mặc định là `codex`. Nếu bản triển khai của bạn cần một tác nhân ACP khác để kiểm tra tình trạng, hãy đặt tác nhân thăm dò một cách tường minh:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Khởi động lại gateway sau khi thay đổi giá trị này.

## Cấu hình quyền

Các phiên ACP chạy ở chế độ không tương tác — không có TTY để phê duyệt hoặc từ chối các lời nhắc cấp quyền ghi tệp và thực thi shell. Plugin acpx cung cấp hai khóa cấu hình kiểm soát cách xử lý quyền:

Các quyền của bộ điều phối ACPX này tách biệt với phê duyệt thực thi của OpenClaw và cũng tách biệt với các cờ bỏ qua của nhà cung cấp phần phụ trợ CLI, chẳng hạn như Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` là công tắc khẩn cấp ở cấp bộ điều phối dành cho các phiên ACP.

Để xem phần so sánh tổng quát hơn giữa OpenClaw `tools.exec.mode`, phê duyệt của Codex Guardian
và quyền của bộ điều phối ACPX, hãy xem
[Các chế độ quyền](/vi/tools/permission-modes).

### `permissionMode`

Kiểm soát những thao tác mà tác nhân của bộ điều phối có thể thực hiện mà không cần nhắc xác nhận.

| Giá trị           | Hành vi                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tự động phê duyệt mọi thao tác ghi tệp và lệnh shell.          |
| `approve-reads` | Chỉ tự động phê duyệt thao tác đọc; thao tác ghi và thực thi yêu cầu lời nhắc. |
| `deny-all`      | Từ chối mọi lời nhắc cấp quyền.                              |

### `nonInteractivePermissions`

Kiểm soát điều gì xảy ra khi đáng lẽ một lời nhắc cấp quyền được hiển thị nhưng không có TTY tương tác (điều này luôn đúng với các phiên ACP).

| Giá trị  | Hành vi                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Hủy phiên với `PermissionPromptUnavailableError`. **(mặc định)** |
| `deny` | Âm thầm từ chối quyền và tiếp tục (suy giảm chức năng nhẹ nhàng).        |

### Cấu hình

Thiết lập thông qua cấu hình Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Khởi động lại Gateway sau khi thay đổi các giá trị này.

<Warning>
OpenClaw mặc định sử dụng `permissionMode=approve-reads` và `nonInteractivePermissions=fail`. Trong các phiên ACP không tương tác, mọi thao tác ghi hoặc thực thi kích hoạt lời nhắc cấp quyền đều có thể thất bại với `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Nếu cần hạn chế quyền, hãy đặt `nonInteractivePermissions` thành `deny` để các phiên suy giảm chức năng nhẹ nhàng thay vì gặp sự cố.
</Warning>

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents) — tổng quan, cẩm nang vận hành, khái niệm
- [Tác nhân phụ](/vi/tools/subagents)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
