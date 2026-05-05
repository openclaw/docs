---
read_when:
    - Bạn muốn có một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp lỗi
    - Bạn đang chạy Codex CLI hoặc các CLI AI cục bộ khác và muốn tái sử dụng chúng
    - Bạn muốn tìm hiểu cầu nối loopback MCP để truy cập công cụ backend của CLI
summary: 'Các phần phụ trợ CLI: phương án dự phòng CLI AI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các phần phụ trợ CLI
x-i18n:
    generated_at: "2026-05-05T01:46:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy **CLI AI cục bộ** như một **phương án dự phòng chỉ văn bản** khi các nhà cung cấp API ngừng hoạt động,
bị giới hạn tốc độ, hoặc tạm thời hoạt động bất thường. Thiết kế này có chủ ý thận trọng:

- **Các công cụ OpenClaw không được chèn trực tiếp**, nhưng các backend có `bundleMcp: true`
  có thể nhận công cụ Gateway qua một cầu nối MCP loopback.
- **Phát trực tuyến JSONL** cho các CLI hỗ trợ tính năng này.
- **Hỗ trợ phiên** (để các lượt tiếp theo vẫn mạch lạc).
- **Có thể truyền hình ảnh xuyên suốt** nếu CLI chấp nhận đường dẫn hình ảnh.

Thiết kế này là một **lưới an toàn** hơn là đường dẫn chính. Hãy dùng nó khi bạn
muốn phản hồi văn bản “luôn hoạt động” mà không phụ thuộc vào API bên ngoài.

Nếu bạn muốn một runtime harness đầy đủ với điều khiển phiên ACP, tác vụ nền,
liên kết chuỗi/cuộc hội thoại, và các phiên lập trình bên ngoài bền vững, hãy dùng
[ACP Agents](/vi/tools/acp-agents) thay thế. Backend CLI không phải là ACP.

## Khởi động nhanh thân thiện với người mới

Bạn có thể dùng Codex CLI **mà không cần cấu hình nào** (Plugin OpenAI đi kèm
đăng ký một backend mặc định):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Nếu gateway của bạn chạy dưới launchd/systemd và PATH là tối thiểu, chỉ cần thêm
đường dẫn lệnh:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Chỉ vậy thôi. Không cần khóa, không cần cấu hình xác thực bổ sung ngoài chính CLI.

Nếu bạn dùng một backend CLI đi kèm làm **nhà cung cấp tin nhắn chính** trên một
máy chủ gateway, OpenClaw hiện tự động tải Plugin đi kèm sở hữu backend đó khi cấu hình của bạn
tham chiếu rõ ràng đến backend đó trong tham chiếu mô hình hoặc dưới
`agents.defaults.cliBackends`.

## Dùng làm phương án dự phòng

Thêm một backend CLI vào danh sách dự phòng để nó chỉ chạy khi các mô hình chính thất bại:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Ghi chú:

- Nếu bạn dùng `agents.defaults.models` (danh sách cho phép), bạn cũng phải đưa các mô hình backend CLI của mình vào đó.
- Nếu nhà cung cấp chính thất bại (xác thực, giới hạn tốc độ, hết thời gian chờ), OpenClaw sẽ
  thử backend CLI tiếp theo.

## Tổng quan cấu hình

Tất cả backend CLI nằm dưới:

```
agents.defaults.cliBackends
```

Mỗi mục được khóa bằng một **id nhà cung cấp** (ví dụ `codex-cli`, `my-cli`).
id nhà cung cấp trở thành vế trái của tham chiếu mô hình của bạn:

```
<provider>/<model>
```

### Cấu hình ví dụ

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Cách hoạt động

1. **Chọn một backend** dựa trên tiền tố nhà cung cấp (`codex-cli/...`).
2. **Tạo system prompt** bằng cùng prompt OpenClaw + ngữ cảnh workspace.
3. **Thực thi CLI** với id phiên (nếu được hỗ trợ) để lịch sử luôn nhất quán.
   Backend `claude-cli` đi kèm giữ một tiến trình Claude stdio còn sống cho mỗi
   phiên OpenClaw và gửi các lượt tiếp theo qua stream-json stdin.
4. **Phân tích đầu ra** (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. **Lưu bền vững id phiên** theo từng backend, để các lượt tiếp theo tái sử dụng cùng phiên CLI.

<Note>
Backend Anthropic `claude-cli` đi kèm đã được hỗ trợ lại. Nhân viên Anthropic
cho chúng tôi biết việc sử dụng Claude CLI theo kiểu OpenClaw đã được cho phép trở lại, vì vậy OpenClaw xem
việc dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố
một chính sách mới.
</Note>

Backend OpenAI `codex-cli` đi kèm truyền system prompt của OpenClaw qua
ghi đè cấu hình `model_instructions_file` của Codex (`-c
model_instructions_file="..."`). Codex không cung cấp cờ kiểu Claude
`--append-system-prompt`, vì vậy OpenClaw ghi prompt đã lắp ráp vào một
tệp tạm thời cho mỗi phiên Codex CLI mới.

Backend Anthropic `claude-cli` đi kèm nhận snapshot skills của OpenClaw
theo hai cách: catalog skills OpenClaw nhỏ gọn trong system prompt được nối thêm, và
một Plugin Claude Code tạm thời được truyền bằng `--plugin-dir`. Plugin chỉ chứa
các skills đủ điều kiện cho agent/phiên đó, vì vậy bộ phân giải skill gốc của Claude Code
thấy cùng tập đã lọc mà OpenClaw nếu không sẽ quảng bá trong
prompt. Các ghi đè env/khóa API của skill vẫn được OpenClaw áp dụng vào
môi trường tiến trình con cho lần chạy.

Claude CLI cũng có chế độ quyền không tương tác riêng. OpenClaw ánh xạ chế độ đó
vào chính sách exec hiện có thay vì thêm cấu hình riêng cho Claude: khi
chính sách exec hiệu lực được yêu cầu là YOLO (`tools.exec.security: "full"` và
`tools.exec.ask: "off"`), OpenClaw thêm `--permission-mode bypassPermissions`.
Thiết lập `agents.list[].tools.exec` theo từng agent ghi đè `tools.exec` toàn cục cho
agent đó. Để buộc một chế độ Claude khác, hãy đặt đối số backend thô rõ ràng
như `--permission-mode default` hoặc `--permission-mode acceptEdits` dưới
`agents.defaults.cliBackends.claude-cli.args` và `resumeArgs` tương ứng.

Backend Anthropic `claude-cli` đi kèm cũng ánh xạ các mức OpenClaw `/think`
sang cờ gốc `--effort` của Claude Code cho các mức không phải off. `minimal` và
`low` ánh xạ sang `low`, `adaptive` và `medium` ánh xạ sang `medium`, còn `high`,
`xhigh`, và `max` ánh xạ trực tiếp. Các backend CLI khác cần Plugin sở hữu của chúng
khai báo một bộ ánh xạ argv tương đương trước khi `/think` có thể ảnh hưởng đến CLI được sinh ra.

Trước khi OpenClaw có thể dùng backend `claude-cli` đi kèm, bản thân Claude Code
phải đã đăng nhập trên cùng máy chủ:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Chỉ dùng `agents.defaults.cliBackends.claude-cli.command` khi binary `claude`
chưa có sẵn trên `PATH`.

## Phiên

- Nếu CLI hỗ trợ phiên, đặt `sessionArg` (ví dụ `--session-id`) hoặc
  `sessionArgs` (placeholder `{sessionId}`) khi ID cần được chèn
  vào nhiều cờ.
- Nếu CLI dùng một **lệnh con resume** với các cờ khác, đặt
  `resumeArgs` (thay thế `args` khi tiếp tục) và tùy chọn `resumeOutput`
  (cho các lần tiếp tục không phải JSON).
- `sessionMode`:
  - `always`: luôn gửi id phiên (UUID mới nếu chưa có lưu trữ).
  - `existing`: chỉ gửi id phiên nếu trước đó đã có lưu trữ.
  - `none`: không bao giờ gửi id phiên.
- `claude-cli` mặc định là `liveSession: "claude-stdio"`, `output: "jsonl"`,
  và `input: "stdin"` để các lượt tiếp theo tái sử dụng tiến trình Claude đang chạy khi
  nó còn hoạt động. Stdio ấm hiện là mặc định, kể cả với các cấu hình tùy chỉnh
  bỏ qua các trường transport. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi
  thoát, OpenClaw tiếp tục từ id phiên Claude đã lưu. Các id phiên đã lưu
  được xác minh với transcript dự án có thể đọc hiện có trước khi
  tiếp tục, nên các liên kết ảo bị xóa với `reason=transcript-missing`
  thay vì âm thầm bắt đầu một phiên Claude CLI mới dưới `--resume`.
- Các phiên Claude trực tiếp giữ các bộ bảo vệ đầu ra JSONL có giới hạn. Mặc định cho phép tối đa
  8 MiB và 20.000 dòng JSONL thô mỗi lượt. Các lượt Claude dùng nhiều công cụ có thể tăng
  chúng theo từng backend bằng
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  và `maxTurnLines`; OpenClaw kẹp các thiết lập đó ở 64 MiB và 100.000
  dòng.
- Các phiên CLI đã lưu là tính liên tục do nhà cung cấp sở hữu. Việc đặt lại phiên hằng ngày ngầm định
  không cắt chúng; `/reset` và các chính sách `session.reset` rõ ràng vẫn
  có hiệu lực.

Ghi chú tuần tự hóa:

- `serialize: true` giữ các lần chạy cùng lane theo đúng thứ tự.
- Hầu hết CLI tuần tự hóa trên một lane nhà cung cấp.
- OpenClaw bỏ tái sử dụng phiên CLI đã lưu khi danh tính xác thực đã chọn thay đổi,
  bao gồm id hồ sơ xác thực đã thay đổi, khóa API tĩnh, token tĩnh, hoặc
  danh tính tài khoản OAuth khi CLI cung cấp danh tính đó. Việc xoay vòng token truy cập và làm mới OAuth
  không cắt phiên CLI đã lưu. Nếu một CLI không cung cấp
  id tài khoản OAuth ổn định, OpenClaw để CLI đó thực thi quyền tiếp tục.

## Prelude dự phòng từ các phiên claude-cli

Khi một lần thử `claude-cli` chuyển lỗi sang một ứng viên không phải CLI trong
[`agents.defaults.model.fallbacks`](/vi/concepts/model-failover), OpenClaw gieo ngữ cảnh ban đầu
cho lần thử tiếp theo bằng một prelude được thu thập từ transcript JSONL cục bộ của Claude Code
tại `~/.claude/projects/`. Nếu không có seed này, nhà cung cấp dự phòng
sẽ bắt đầu lạnh vì transcript phiên riêng của OpenClaw trống
cho các lần chạy `claude-cli`.

- Prelude ưu tiên bản tóm tắt `/compact` mới nhất hoặc marker `compact_boundary`,
  rồi nối thêm các lượt mới nhất sau ranh giới đến hết ngân sách ký tự.
  Các lượt trước ranh giới bị bỏ vì bản tóm tắt đã đại diện cho
  chúng.
- Các khối công cụ được gộp thành gợi ý nhỏ gọn `(tool call: name)` và
  `(tool result: …)` để giữ ngân sách prompt trung thực. Bản tóm tắt được
  gắn nhãn `(truncated)` nếu vượt quá giới hạn.
- Các dự phòng cùng nhà cung cấp từ `claude-cli` sang `claude-cli` dựa vào
  `--resume` riêng của Claude và bỏ qua prelude.
- Seed tái sử dụng kiểm tra xác thực đường dẫn tệp phiên Claude hiện có, nên
  không thể đọc các đường dẫn tùy ý.

## Hình ảnh (truyền xuyên suốt)

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw sẽ ghi hình ảnh base64 vào các tệp tạm. Nếu `imageArg` được đặt, các
đường dẫn đó được truyền làm đối số CLI. Nếu thiếu `imageArg`, OpenClaw nối thêm
đường dẫn tệp vào prompt (path injection), điều này đủ cho các CLI tự động
tải tệp cục bộ từ đường dẫn thuần.

## Đầu vào / đầu ra

- `output: "json"` (mặc định) cố phân tích JSON và trích xuất văn bản + id phiên.
- Với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản trả lời từ `response` và
  mức sử dụng từ `stats` khi `usage` bị thiếu hoặc trống.
- `output: "jsonl"` phân tích các luồng JSONL (ví dụ Codex CLI `--json`) và trích xuất thông điệp agent cuối cùng cùng các định danh phiên
  khi có.
- `output: "text"` xem stdout là phản hồi cuối cùng.

Chế độ đầu vào:

- `input: "arg"` (mặc định) truyền prompt làm đối số CLI cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được dùng.

## Mặc định (do Plugin sở hữu)

Plugin OpenAI đi kèm cũng đăng ký một mặc định cho `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google đi kèm cũng đăng ký một mặc định cho `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Điều kiện tiên quyết: Gemini CLI cục bộ phải được cài đặt và có sẵn dưới dạng
`gemini` trên `PATH` (`brew install gemini-cli` hoặc
`npm install -g @google/gemini-cli`).

Ghi chú JSON của Gemini CLI:

- Văn bản trả lời được đọc từ trường JSON `response`.
- Usage dự phòng về `stats` khi `usage` vắng mặt hoặc trống.
- `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
- Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
  `stats.input_tokens - stats.cached`.

Chỉ ghi đè nếu cần (thường gặp: đường dẫn `command` tuyệt đối).

## Mặc định do Plugin sở hữu

Các mặc định backend CLI hiện là một phần của bề mặt Plugin:

- Các Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- `id` của backend trở thành tiền tố provider trong tham chiếu model.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè mặc định của Plugin.
- Dọn dẹp cấu hình dành riêng cho backend vẫn do Plugin sở hữu thông qua hook
  `normalizeConfig` tùy chọn.

Các Plugin cần shim tương thích prompt/tin nhắn nhỏ có thể khai báo
các phép biến đổi văn bản hai chiều mà không cần thay thế provider hoặc backend CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` viết lại system prompt và user prompt được truyền cho CLI. `output`
viết lại các delta assistant được stream và văn bản cuối cùng đã phân tích trước khi OpenClaw xử lý
các marker điều khiển và việc gửi kênh của riêng nó.

Đối với các CLI phát ra JSONL tương thích với Claude Code stream-json, đặt
`jsonlDialect: "claude-stream-json"` trong cấu hình của backend đó.

## Lớp phủ MCP bundle

Các backend CLI **không** nhận trực tiếp lệnh gọi công cụ OpenClaw, nhưng một backend có thể
chọn dùng lớp phủ cấu hình MCP được tạo với `bundleMcp: true`.

Hành vi được bundle hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo
- `codex-cli`: ghi đè cấu hình inline cho `mcp_servers`; máy chủ loopback
  OpenClaw được tạo được đánh dấu bằng chế độ phê duyệt công cụ theo từng máy chủ của Codex
  để các lệnh gọi MCP không thể bị kẹt ở lời nhắc phê duyệt cục bộ
- `google-gemini-cli`: tệp thiết lập hệ thống Gemini được tạo

Khi bundle MCP được bật, OpenClaw:

- khởi chạy một máy chủ MCP HTTP loopback để cung cấp công cụ Gateway cho tiến trình CLI
- xác thực cầu nối bằng token theo từng phiên (`OPENCLAW_MCP_TOKEN`)
- giới hạn quyền truy cập công cụ trong phạm vi phiên, tài khoản và ngữ cảnh kênh hiện tại
- tải các máy chủ bundle-MCP đã bật cho workspace hiện tại
- hợp nhất chúng với mọi dạng cấu hình/thiết lập MCP backend hiện có
- viết lại cấu hình khởi chạy bằng chế độ tích hợp do backend sở hữu từ extension sở hữu

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn tiêm cấu hình nghiêm ngặt khi một
backend chọn dùng bundle MCP để các lượt chạy nền vẫn được cô lập.

Runtime MCP được bundle theo phạm vi phiên được lưu vào cache để tái sử dụng trong một phiên, sau đó
được thu dọn sau `mcp.sessionIdleTtlMs` mili giây nhàn rỗi (mặc định 10
phút; đặt `0` để tắt). Các lượt chạy nhúng một lần như dò auth,
tạo slug và truy xuất Active Memory yêu cầu dọn dẹp khi lượt chạy kết thúc để các tiến trình con
stdio và luồng Streamable HTTP/SSE không tồn tại lâu hơn lượt chạy.

## Hạn chế

- **Không có lệnh gọi công cụ OpenClaw trực tiếp.** OpenClaw không tiêm lệnh gọi công cụ vào
  giao thức backend CLI. Backend chỉ thấy công cụ Gateway khi chọn dùng
  `bundleMcp: true`.
- **Streaming phụ thuộc vào backend.** Một số backend stream JSONL; các backend khác đệm
  cho đến khi thoát.
- **Đầu ra có cấu trúc** phụ thuộc vào định dạng JSON của CLI.
- **Phiên Codex CLI** tiếp tục qua đầu ra văn bản (không có JSONL), kém
  cấu trúc hơn lượt chạy `--json` ban đầu. Các phiên OpenClaw vẫn hoạt động
  bình thường.

## Khắc phục sự cố

- **Không tìm thấy CLI**: đặt `command` thành đường dẫn đầy đủ.
- **Sai tên model**: dùng `modelAliases` để ánh xạ `provider/model` → model CLI.
- **Không có tính liên tục của phiên**: đảm bảo `sessionArg` được đặt và `sessionMode` không phải là
  `none` (Codex CLI hiện chưa thể tiếp tục với đầu ra JSON).
- **Hình ảnh bị bỏ qua**: đặt `imageArg` (và xác minh CLI hỗ trợ đường dẫn tệp).

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Model cục bộ](/vi/gateway/local-models)
