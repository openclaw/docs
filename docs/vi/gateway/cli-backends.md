---
read_when:
    - Bạn muốn có một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp lỗi
    - Bạn đang chạy Codex CLI hoặc các CLI trí tuệ nhân tạo cục bộ khác và muốn tái sử dụng chúng
    - Bạn muốn hiểu cầu nối vòng lặp ngược MCP để truy cập công cụ của phần phụ trợ CLI
summary: 'Các phần phụ trợ CLI: phương án dự phòng CLI AI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các phần phụ trợ CLI
x-i18n:
    generated_at: "2026-05-02T10:40:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy **CLI AI cục bộ** như một **phương án dự phòng chỉ văn bản** khi các nhà cung cấp API bị ngừng hoạt động,
bị giới hạn tốc độ, hoặc tạm thời hoạt động không đúng. Điều này được thiết kế có chủ ý theo hướng thận trọng:

- **Các công cụ OpenClaw không được chèn trực tiếp**, nhưng các backend có `bundleMcp: true`
  có thể nhận công cụ gateway qua một cầu nối MCP loopback.
- **Streaming JSONL** cho các CLI hỗ trợ.
- **Có hỗ trợ phiên** (để các lượt tiếp theo vẫn mạch lạc).
- **Có thể truyền hình ảnh qua** nếu CLI chấp nhận đường dẫn hình ảnh.

Thiết kế này là một **lưới an toàn** hơn là một đường dẫn chính. Dùng nó khi bạn
muốn phản hồi văn bản “luôn hoạt động” mà không phụ thuộc vào API bên ngoài.

Nếu bạn muốn một runtime harness đầy đủ với điều khiển phiên ACP, tác vụ nền,
liên kết luồng/cuộc trò chuyện, và các phiên lập trình bên ngoài bền vững, hãy dùng
[ACP Agents](/vi/tools/acp-agents) thay thế. Các backend CLI không phải là ACP.

## Bắt đầu nhanh thân thiện với người mới

Bạn có thể dùng Codex CLI **mà không cần cấu hình nào** (Plugin OpenAI đi kèm
đăng ký một backend mặc định):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Nếu gateway của bạn chạy dưới launchd/systemd và PATH tối giản, chỉ cần thêm
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

Nếu bạn dùng một backend CLI đi kèm làm **nhà cung cấp thông điệp chính** trên
máy chủ gateway, OpenClaw hiện tự động tải Plugin đi kèm sở hữu backend đó khi cấu hình của bạn
tham chiếu rõ ràng đến backend đó trong một model ref hoặc dưới
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

- Nếu bạn dùng `agents.defaults.models` (danh sách cho phép), bạn cũng phải bao gồm các mô hình backend CLI của mình ở đó.
- Nếu nhà cung cấp chính thất bại (xác thực, giới hạn tốc độ, hết thời gian chờ), OpenClaw sẽ
  thử backend CLI tiếp theo.

## Tổng quan cấu hình

Tất cả backend CLI nằm dưới:

```
agents.defaults.cliBackends
```

Mỗi mục được khóa bằng một **provider id** (ví dụ: `codex-cli`, `my-cli`).
Provider id trở thành phía bên trái của model ref:

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
2. **Xây dựng system prompt** bằng cùng prompt OpenClaw + ngữ cảnh workspace.
3. **Thực thi CLI** với session id (nếu được hỗ trợ) để lịch sử vẫn nhất quán.
   Backend `claude-cli` đi kèm giữ một tiến trình Claude stdio hoạt động cho mỗi
   phiên OpenClaw và gửi các lượt tiếp theo qua stream-json stdin.
4. **Phân tích đầu ra** (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. **Lưu giữ session id** theo backend, để các lượt tiếp theo tái sử dụng cùng phiên CLI.

<Note>
Backend Anthropic `claude-cli` đi kèm đã được hỗ trợ trở lại. Nhân viên Anthropic
đã cho chúng tôi biết rằng cách dùng Claude CLI kiểu OpenClaw lại được phép, vì vậy OpenClaw coi
việc dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố
chính sách mới.
</Note>

Backend OpenAI `codex-cli` đi kèm truyền system prompt của OpenClaw qua
ghi đè cấu hình `model_instructions_file` của Codex (`-c
model_instructions_file="..."`). Codex không cung cấp cờ kiểu Claude
`--append-system-prompt`, nên OpenClaw ghi prompt đã lắp ráp vào một
tệp tạm thời cho mỗi phiên Codex CLI mới.

Backend Anthropic `claude-cli` đi kèm nhận ảnh chụp nhanh Skills của OpenClaw
theo hai cách: danh mục Skills OpenClaw gọn trong system prompt được nối thêm, và
một Plugin Claude Code tạm thời được truyền bằng `--plugin-dir`. Plugin chỉ chứa
các Skills đủ điều kiện cho agent/phiên đó, nên bộ phân giải skill gốc của Claude Code
thấy cùng tập đã lọc mà nếu không OpenClaw sẽ quảng bá trong prompt.
Các ghi đè env/API key của skill vẫn được OpenClaw áp dụng cho
môi trường tiến trình con của lần chạy.

Claude CLI cũng có chế độ quyền không tương tác riêng. OpenClaw ánh xạ chế độ đó
vào chính sách exec hiện có thay vì thêm cấu hình riêng cho Claude: khi
chính sách exec được yêu cầu hiệu lực là YOLO (`tools.exec.security: "full"` và
`tools.exec.ask: "off"`), OpenClaw thêm `--permission-mode bypassPermissions`.
Thiết lập `agents.list[].tools.exec` theo agent ghi đè `tools.exec` toàn cục cho
agent đó. Để ép một chế độ Claude khác, đặt các đối số backend thô rõ ràng
như `--permission-mode default` hoặc `--permission-mode acceptEdits` dưới
`agents.defaults.cliBackends.claude-cli.args` và `resumeArgs` tương ứng.

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
  - `always`: luôn gửi session id (UUID mới nếu chưa lưu).
  - `existing`: chỉ gửi session id nếu trước đó đã lưu.
  - `none`: không bao giờ gửi session id.
- `claude-cli` mặc định là `liveSession: "claude-stdio"`, `output: "jsonl"`,
  và `input: "stdin"` để các lượt tiếp theo tái sử dụng tiến trình Claude đang hoạt động khi
  nó còn hoạt động. Stdio ấm hiện là mặc định, bao gồm cả cấu hình tùy chỉnh
  bỏ qua các trường transport. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi
  thoát, OpenClaw tiếp tục từ session id Claude đã lưu. Các session
  id đã lưu được xác minh với một transcript dự án hiện có có thể đọc trước khi
  tiếp tục, nên các liên kết ảo bị xóa với `reason=transcript-missing`
  thay vì âm thầm khởi động một phiên Claude CLI mới dưới `--resume`.
- Phiên Claude live giữ các giới hạn đầu ra JSONL có chặn. Mặc định cho phép tối đa
  8 MiB và 20.000 dòng JSONL thô mỗi lượt. Các lượt Claude dùng nhiều công cụ có thể tăng
  chúng theo backend với
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  và `maxTurnLines`; OpenClaw giới hạn các thiết lập đó ở 64 MiB và 100.000
  dòng.
- Các phiên CLI đã lưu là tính liên tục do nhà cung cấp sở hữu. Việc đặt lại phiên hằng ngày ngầm định
  không cắt chúng; `/reset` và các chính sách `session.reset` rõ ràng vẫn
  có hiệu lực.

Ghi chú về tuần tự hóa:

- `serialize: true` giữ các lần chạy cùng lane theo thứ tự.
- Hầu hết CLI tuần tự hóa trên một lane nhà cung cấp.
- OpenClaw bỏ tái sử dụng phiên CLI đã lưu khi danh tính xác thực được chọn thay đổi,
  bao gồm auth profile id, API key tĩnh, token tĩnh, hoặc danh tính tài khoản OAuth
  đã thay đổi khi CLI cung cấp. Việc xoay vòng access token và refresh token OAuth
  không cắt phiên CLI đã lưu. Nếu một CLI không cung cấp
  OAuth account id ổn định, OpenClaw để CLI đó thực thi quyền tiếp tục.

## Prelude dự phòng từ các phiên claude-cli

Khi một lần thử `claude-cli` chuyển dự phòng sang một ứng viên không phải CLI trong
[`agents.defaults.model.fallbacks`](/vi/concepts/model-failover), OpenClaw gieo
lần thử tiếp theo bằng một prelude ngữ cảnh thu thập từ transcript JSONL cục bộ của Claude Code
tại `~/.claude/projects/`. Nếu không có seed này, nhà cung cấp dự phòng
sẽ bắt đầu lạnh vì transcript phiên riêng của OpenClaw trống
cho các lần chạy `claude-cli`.

- Prelude ưu tiên bản tóm tắt `/compact` mới nhất hoặc dấu mốc `compact_boundary`,
  rồi nối các lượt sau ranh giới gần nhất đến giới hạn ký tự.
  Các lượt trước ranh giới bị bỏ vì bản tóm tắt đã đại diện cho
  chúng.
- Các khối công cụ được gộp thành gợi ý gọn `(tool call: name)` và
  `(tool result: …)` để giữ ngân sách prompt trung thực. Bản tóm tắt được
  gắn nhãn `(truncated)` nếu bị tràn.
- Các dự phòng cùng nhà cung cấp từ `claude-cli` sang `claude-cli` dựa vào
  `--resume` riêng của Claude và bỏ qua prelude.
- Seed tái sử dụng xác thực đường dẫn tệp phiên Claude hiện có, nên
  không thể đọc các đường dẫn tùy ý.

## Hình ảnh (truyền qua)

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw sẽ ghi hình ảnh base64 vào tệp tạm. Nếu `imageArg` được đặt, các
đường dẫn đó được truyền làm đối số CLI. Nếu thiếu `imageArg`, OpenClaw nối
đường dẫn tệp vào prompt (chèn đường dẫn), điều này đủ cho các CLI tự động
tải tệp cục bộ từ đường dẫn thuần.

## Đầu vào / đầu ra

- `output: "json"` (mặc định) cố phân tích JSON và trích xuất văn bản + session id.
- Với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản trả lời từ `response` và
  usage từ `stats` khi `usage` bị thiếu hoặc trống.
- `output: "jsonl"` phân tích các luồng JSONL (ví dụ Codex CLI `--json`) và trích xuất thông điệp agent cuối cùng cùng với các định danh phiên
  khi có.
- `output: "text"` coi stdout là phản hồi cuối cùng.

Chế độ đầu vào:

- `input: "arg"` (mặc định) truyền prompt làm đối số CLI cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được dùng.

## Mặc định (do Plugin sở hữu)

Plugin OpenAI đi kèm cũng đăng ký mặc định cho `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google đi kèm cũng đăng ký mặc định cho `google-gemini-cli`:

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
- Usage dùng dự phòng từ `stats` khi `usage` vắng mặt hoặc trống.
- `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
- Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
  `stats.input_tokens - stats.cached`.

Chỉ ghi đè nếu cần (thường gặp: đường dẫn `command` tuyệt đối).

## Mặc định do Plugin sở hữu

Các mặc định backend CLI hiện là một phần của bề mặt Plugin:

- Các Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- Backend `id` trở thành tiền tố nhà cung cấp trong các tham chiếu mô hình.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè mặc định của Plugin.
- Việc dọn dẹp cấu hình riêng cho backend vẫn do Plugin sở hữu thông qua hook
  `normalizeConfig` tùy chọn.

Các Plugin cần các shim tương thích prompt/tin nhắn rất nhỏ có thể khai báo
các phép biến đổi văn bản hai chiều mà không cần thay thế nhà cung cấp hoặc backend CLI:

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
viết lại các delta assistant được stream và văn bản cuối cùng đã phân tích cú pháp trước khi OpenClaw xử lý
các marker điều khiển riêng và phân phối kênh.

Đối với các CLI phát ra JSONL tương thích stream-json của Claude Code, đặt
`jsonlDialect: "claude-stream-json"` trên cấu hình của backend đó.

## Lớp phủ MCP gói kèm

Các backend CLI **không** nhận lệnh gọi công cụ OpenClaw trực tiếp, nhưng một backend có thể
chọn dùng lớp phủ cấu hình MCP được tạo bằng `bundleMcp: true`.

Hành vi gói kèm hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo
- `codex-cli`: ghi đè cấu hình inline cho `mcp_servers`; máy chủ
  local loopback OpenClaw được tạo được đánh dấu bằng chế độ phê duyệt công cụ theo từng máy chủ của Codex
  để các lệnh gọi MCP không thể bị dừng vì prompt phê duyệt cục bộ
- `google-gemini-cli`: tệp thiết lập hệ thống Gemini được tạo

Khi MCP gói kèm được bật, OpenClaw:

- sinh một máy chủ MCP HTTP loopback để cung cấp công cụ Gateway cho tiến trình CLI
- xác thực cầu nối bằng token theo từng phiên (`OPENCLAW_MCP_TOKEN`)
- giới hạn quyền truy cập công cụ theo phiên, tài khoản và ngữ cảnh kênh hiện tại
- tải các máy chủ bundle-MCP đã bật cho workspace hiện tại
- hợp nhất chúng với mọi dạng cấu hình/thiết lập MCP hiện có của backend
- viết lại cấu hình khởi chạy bằng chế độ tích hợp do backend sở hữu từ extension sở hữu

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn tiêm một cấu hình nghiêm ngặt khi một
backend chọn dùng MCP gói kèm để các lần chạy nền vẫn được cô lập.

Các runtime MCP gói kèm theo phạm vi phiên được lưu vào bộ nhớ đệm để tái sử dụng trong một phiên, rồi
được thu hồi sau `mcp.sessionIdleTtlMs` mili giây không hoạt động (mặc định 10
phút; đặt `0` để tắt). Các lần chạy nhúng một lần như thăm dò xác thực,
tạo slug và yêu cầu gọi lại Active Memory sẽ dọn dẹp khi kết thúc lần chạy để các tiến trình con stdio
và stream Streamable HTTP/SSE không tồn tại lâu hơn lần chạy.

## Giới hạn

- **Không có lệnh gọi công cụ OpenClaw trực tiếp.** OpenClaw không tiêm lệnh gọi công cụ vào
  giao thức backend CLI. Backend chỉ thấy công cụ Gateway khi chúng chọn dùng
  `bundleMcp: true`.
- **Streaming phụ thuộc vào backend.** Một số backend stream JSONL; các backend khác đệm
  cho đến khi thoát.
- **Đầu ra có cấu trúc** phụ thuộc vào định dạng JSON của CLI.
- **Phiên Codex CLI** tiếp tục qua đầu ra văn bản (không có JSONL), vốn kém
  cấu trúc hơn lần chạy `--json` ban đầu. Các phiên OpenClaw vẫn hoạt động
  bình thường.

## Khắc phục sự cố

- **Không tìm thấy CLI**: đặt `command` thành đường dẫn đầy đủ.
- **Sai tên mô hình**: dùng `modelAliases` để ánh xạ `provider/model` → mô hình CLI.
- **Không có tính liên tục phiên**: đảm bảo `sessionArg` được đặt và `sessionMode` không phải
  `none` (Codex CLI hiện chưa thể tiếp tục với đầu ra JSON).
- **Hình ảnh bị bỏ qua**: đặt `imageArg` (và xác minh CLI hỗ trợ đường dẫn tệp).

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Mô hình cục bộ](/vi/gateway/local-models)
