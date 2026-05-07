---
read_when:
    - Bạn muốn một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp lỗi
    - Bạn đang chạy Codex CLI hoặc các CLI AI cục bộ khác và muốn tái sử dụng chúng
    - Bạn muốn hiểu cầu nối loopback MCP để truy cập các công cụ phần phụ trợ của CLI
summary: 'Backend CLI: dự phòng CLI AI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các phần phụ trợ CLI
x-i18n:
    generated_at: "2026-05-07T13:16:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy **CLI AI cục bộ** dưới dạng **phương án dự phòng chỉ văn bản** khi các nhà cung cấp API gặp sự cố,
bị giới hạn tốc độ, hoặc tạm thời hoạt động không đúng. Thiết kế này có chủ ý thận trọng:

- **Các công cụ OpenClaw không được chèn trực tiếp**, nhưng các backend có `bundleMcp: true`
  có thể nhận công cụ Gateway thông qua cầu nối MCP loopback.
- **Phát trực tuyến JSONL** cho các CLI hỗ trợ.
- **Hỗ trợ phiên** (để các lượt tiếp theo vẫn mạch lạc).
- **Có thể truyền hình ảnh qua** nếu CLI chấp nhận đường dẫn hình ảnh.

Thiết kế này là **một phương án dự phòng an toàn** hơn là đường dẫn chính. Hãy dùng khi bạn
muốn phản hồi văn bản "luôn hoạt động" mà không phụ thuộc vào API bên ngoài.

Nếu bạn muốn một runtime harness đầy đủ với điều khiển phiên ACP, tác vụ nền,
liên kết luồng/cuộc trò chuyện, và phiên lập trình bên ngoài bền vững, hãy dùng
[ACP Agents](/vi/tools/acp-agents) thay thế. Backend CLI không phải là ACP.

<Tip>
  Đang xây dựng Plugin backend mới? Hãy dùng
  [Plugin backend CLI](/vi/plugins/cli-backend-plugins). Trang này dành cho người dùng
  đang cấu hình và vận hành một backend đã được đăng ký.
</Tip>

## Bắt đầu nhanh cho người mới

Bạn có thể dùng Codex CLI **mà không cần cấu hình nào** (Plugin OpenAI đi kèm
đăng ký một backend mặc định):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Nếu Gateway của bạn chạy dưới launchd/systemd và PATH tối giản, chỉ cần thêm
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

Vậy là xong. Không cần khóa, không cần cấu hình xác thực bổ sung ngoài chính CLI.

Nếu bạn dùng backend CLI đi kèm làm **nhà cung cấp thông điệp chính** trên một
máy chủ Gateway, OpenClaw hiện tự động tải Plugin đi kèm sở hữu backend đó khi cấu hình của bạn
tham chiếu rõ ràng đến backend đó trong một model ref hoặc dưới
`agents.defaults.cliBackends`.

## Dùng làm phương án dự phòng

Thêm backend CLI vào danh sách dự phòng để nó chỉ chạy khi các mô hình chính thất bại:

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

Mỗi mục được định khóa bằng **id nhà cung cấp** (ví dụ: `codex-cli`, `my-cli`).
Id nhà cung cấp trở thành vế trái của model ref:

```
<provider>/<model>
```

### Ví dụ cấu hình

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
   Backend `claude-cli` đi kèm giữ một tiến trình Claude stdio sống cho mỗi
   phiên OpenClaw và gửi các lượt tiếp theo qua stdin stream-json.
4. **Phân tích đầu ra** (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. **Lưu bền vững id phiên** theo từng backend, để các lượt tiếp theo dùng lại cùng phiên CLI.

<Note>
Backend Anthropic `claude-cli` đi kèm đã được hỗ trợ trở lại. Nhân viên Anthropic
cho chúng tôi biết cách sử dụng Claude CLI kiểu OpenClaw đã được phép trở lại, vì vậy OpenClaw xem
việc dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố
chính sách mới.
</Note>

Backend OpenAI `codex-cli` đi kèm truyền system prompt của OpenClaw thông qua
ghi đè cấu hình `model_instructions_file` của Codex (`-c
model_instructions_file="..."`). Codex không cung cấp cờ kiểu Claude
`--append-system-prompt`, nên OpenClaw ghi prompt đã lắp ráp vào một
tệp tạm thời cho mỗi phiên Codex CLI mới.

Backend Anthropic `claude-cli` đi kèm nhận snapshot Skills của OpenClaw
theo hai cách: catalog Skills OpenClaw rút gọn trong system prompt được nối thêm, và
một Plugin Claude Code tạm thời được truyền bằng `--plugin-dir`. Plugin chỉ chứa
các Skills đủ điều kiện cho agent/phiên đó, nên bộ phân giải skill gốc của Claude Code
thấy cùng tập đã lọc mà OpenClaw nếu không sẽ quảng bá trong
prompt. Các ghi đè env/API key của Skill vẫn được OpenClaw áp dụng cho
môi trường tiến trình con trong lần chạy.

Claude CLI cũng có chế độ quyền không tương tác riêng. OpenClaw ánh xạ chế độ đó
vào chính sách exec hiện có thay vì thêm cấu hình riêng cho Claude: khi
chính sách exec được yêu cầu hiệu dụng là YOLO (`tools.exec.security: "full"` và
`tools.exec.ask: "off"`), OpenClaw thêm `--permission-mode bypassPermissions`.
Thiết lập `agents.list[].tools.exec` theo từng agent ghi đè `tools.exec` toàn cục cho
agent đó. Để ép một chế độ Claude khác, hãy đặt raw backend args rõ ràng
như `--permission-mode default` hoặc `--permission-mode acceptEdits` dưới
`agents.defaults.cliBackends.claude-cli.args` và `resumeArgs` tương ứng.

Backend Anthropic `claude-cli` đi kèm cũng ánh xạ các mức OpenClaw `/think`
sang cờ `--effort` gốc của Claude Code cho các mức không phải off. `minimal` và
`low` ánh xạ sang `low`, `adaptive` và `medium` ánh xạ sang `medium`, còn `high`,
`xhigh`, và `max` ánh xạ trực tiếp. Các backend CLI khác cần Plugin sở hữu chúng
khai báo một trình ánh xạ argv tương đương trước khi `/think` có thể ảnh hưởng đến CLI được spawn.

Trước khi OpenClaw có thể dùng backend `claude-cli` đi kèm, bản thân Claude Code
phải đã được đăng nhập trên cùng máy chủ:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Chỉ dùng `agents.defaults.cliBackends.claude-cli.command` khi binary `claude`
chưa có trên `PATH`.

## Phiên

- Nếu CLI hỗ trợ phiên, hãy đặt `sessionArg` (ví dụ: `--session-id`) hoặc
  `sessionArgs` (placeholder `{sessionId}`) khi ID cần được chèn
  vào nhiều cờ.
- Nếu CLI dùng **lệnh con resume** với các cờ khác, hãy đặt
  `resumeArgs` (thay thế `args` khi resume) và tùy chọn `resumeOutput`
  (cho resume không phải JSON).
- `sessionMode`:
  - `always`: luôn gửi một id phiên (UUID mới nếu chưa lưu).
  - `existing`: chỉ gửi id phiên nếu đã lưu trước đó.
  - `none`: không bao giờ gửi id phiên.
- `claude-cli` mặc định là `liveSession: "claude-stdio"`, `output: "jsonl"`,
  và `input: "stdin"` để các lượt tiếp theo dùng lại tiến trình Claude sống khi
  nó đang hoạt động. Stdio ấm hiện là mặc định, bao gồm cả cấu hình tùy chỉnh
  bỏ qua các trường transport. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi
  thoát, OpenClaw resume từ id phiên Claude đã lưu. Id phiên
  đã lưu được xác minh với transcript dự án hiện có có thể đọc được trước khi
  resume, nên các liên kết ảo được xóa với `reason=transcript-missing`
  thay vì âm thầm khởi động một phiên Claude CLI mới dưới `--resume`.
- Phiên Claude sống giữ các guard đầu ra JSONL có giới hạn. Mặc định cho phép tối đa
  8 MiB và 20.000 dòng JSONL thô mỗi lượt. Các lượt Claude dùng nhiều công cụ có thể tăng
  giới hạn theo backend với
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  và `maxTurnLines`; OpenClaw kẹp các thiết lập đó ở 64 MiB và 100.000
  dòng.
- Phiên CLI đã lưu là tính liên tục do nhà cung cấp sở hữu. Việc đặt lại phiên
  hằng ngày ngầm định không cắt chúng; `/reset` và các chính sách `session.reset` rõ ràng vẫn
  có hiệu lực.

Ghi chú về tuần tự hóa:

- `serialize: true` giữ các lần chạy cùng lane theo đúng thứ tự.
- Hầu hết CLI tuần tự hóa trên một lane nhà cung cấp.
- OpenClaw bỏ việc dùng lại phiên CLI đã lưu khi danh tính xác thực được chọn thay đổi,
  bao gồm id hồ sơ xác thực thay đổi, khóa API tĩnh, token tĩnh, hoặc danh tính
  tài khoản OAuth khi CLI cung cấp. Việc xoay vòng access token và refresh token
  OAuth không cắt phiên CLI đã lưu. Nếu CLI không cung cấp
  id tài khoản OAuth ổn định, OpenClaw để CLI đó tự thực thi quyền resume.

## Prelude dự phòng từ phiên claude-cli

Khi một lần thử `claude-cli` chuyển lỗi sang một ứng viên không phải CLI trong
[`agents.defaults.model.fallbacks`](/vi/concepts/model-failover), OpenClaw gieo
lần thử tiếp theo bằng một prelude ngữ cảnh thu thập từ transcript JSONL cục bộ
của Claude Code tại `~/.claude/projects/`. Không có seed này, nhà cung cấp
dự phòng sẽ bắt đầu nguội vì transcript phiên riêng của OpenClaw trống
cho các lần chạy `claude-cli`.

- Prelude ưu tiên bản tóm tắt `/compact` mới nhất hoặc marker `compact_boundary`,
  rồi nối thêm các lượt sau ranh giới gần nhất đến mức giới hạn ký tự.
  Các lượt trước ranh giới bị bỏ vì bản tóm tắt đã đại diện cho chúng.
- Các khối công cụ được gộp thành gợi ý rút gọn `(tool call: name)` và
  `(tool result: …)` để giữ ngân sách prompt trung thực. Bản tóm tắt được
  gắn nhãn `(truncated)` nếu vượt quá giới hạn.
- Dự phòng cùng nhà cung cấp từ `claude-cli` sang `claude-cli` dựa vào
  `--resume` của chính Claude và bỏ qua prelude.
- Seed dùng lại xác thực đường dẫn tệp phiên Claude hiện có, nên
  không thể đọc đường dẫn tùy ý.

## Hình ảnh (truyền qua)

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, hãy đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw sẽ ghi hình ảnh base64 vào tệp tạm. Nếu `imageArg` được đặt, các
đường dẫn đó được truyền làm đối số CLI. Nếu thiếu `imageArg`, OpenClaw nối
đường dẫn tệp vào prompt (chèn đường dẫn), đủ cho các CLI tự động
tải tệp cục bộ từ đường dẫn thuần.

## Đầu vào / đầu ra

- `output: "json"` (mặc định) cố gắng phân tích JSON và trích xuất văn bản + id phiên.
- Với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản phản hồi từ `response` và
  usage từ `stats` khi `usage` bị thiếu hoặc trống.
- `output: "jsonl"` phân tích luồng JSONL (ví dụ Codex CLI `--json`) và trích xuất thông điệp agent cuối cùng cùng với
  các định danh phiên khi có.
- `output: "text"` xem stdout là phản hồi cuối cùng.

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

- Văn bản phản hồi được đọc từ trường JSON `response`.
- Mức sử dụng quay về `stats` khi `usage` không có hoặc trống.
- `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
- Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
  `stats.input_tokens - stats.cached`.

Chỉ ghi đè nếu cần (thường gặp: đường dẫn `command` tuyệt đối).

## Các mặc định do Plugin sở hữu

Các mặc định backend CLI hiện là một phần của bề mặt plugin:

- Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- `id` của backend trở thành tiền tố provider trong tham chiếu model.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè mặc định của plugin.
- Việc dọn dẹp cấu hình riêng cho backend vẫn do plugin sở hữu thông qua hook
  `normalizeConfig` tùy chọn.

Plugin cần các shim tương thích prompt/thông điệp nhỏ có thể khai báo
các phép biến đổi văn bản hai chiều mà không thay thế provider hoặc backend CLI:

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
viết lại các delta trợ lý được stream và văn bản cuối cùng đã phân tích trước khi OpenClaw xử lý
các marker điều khiển và việc gửi kênh của riêng nó.

Đối với các CLI phát ra JSONL tương thích với Claude Code stream-json, đặt
`jsonlDialect: "claude-stream-json"` trên cấu hình của backend đó.

## Lớp phủ MCP đóng gói

Backend CLI **không** nhận trực tiếp lệnh gọi công cụ OpenClaw, nhưng backend có thể
chọn dùng lớp phủ cấu hình MCP được tạo bằng `bundleMcp: true`.

Hành vi đóng gói hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo
- `codex-cli`: ghi đè cấu hình nội tuyến cho `mcp_servers`; máy chủ
  local loopback OpenClaw được tạo được đánh dấu bằng chế độ phê duyệt công cụ theo từng máy chủ của Codex
  để các lệnh gọi MCP không thể bị kẹt ở lời nhắc phê duyệt cục bộ
- `google-gemini-cli`: tệp cài đặt hệ thống Gemini được tạo

Khi MCP đóng gói được bật, OpenClaw:

- khởi chạy một máy chủ MCP HTTP loopback để cung cấp công cụ gateway cho tiến trình CLI
- xác thực cầu nối bằng token theo phiên (`OPENCLAW_MCP_TOKEN`)
- giới hạn quyền truy cập công cụ theo phiên, tài khoản và ngữ cảnh kênh hiện tại
- tải các máy chủ bundle-MCP đã bật cho workspace hiện tại
- hợp nhất chúng với mọi dạng cấu hình/cài đặt MCP backend hiện có
- viết lại cấu hình khởi chạy bằng chế độ tích hợp do backend sở hữu từ extension sở hữu

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn chèn cấu hình nghiêm ngặt khi một
backend chọn dùng MCP đóng gói để các lần chạy nền luôn được cô lập.

Runtime MCP đóng gói theo phạm vi phiên được lưu vào bộ nhớ đệm để tái sử dụng trong một phiên, sau đó
được thu dọn sau `mcp.sessionIdleTtlMs` mili giây nhàn rỗi (mặc định 10
phút; đặt `0` để tắt). Các lần chạy nhúng một lần như dò auth,
tạo slug và yêu cầu thu hồi active-memory sẽ dọn dẹp ở cuối lần chạy để các tiến trình con stdio
và luồng Streamable HTTP/SSE không tồn tại lâu hơn lần chạy.

## Giới hạn

- **Không có lệnh gọi công cụ OpenClaw trực tiếp.** OpenClaw không chèn lệnh gọi công cụ vào
  giao thức backend CLI. Backend chỉ thấy công cụ gateway khi chúng chọn dùng
  `bundleMcp: true`.
- **Streaming tùy thuộc vào backend.** Một số backend stream JSONL; số khác đệm
  cho đến khi thoát.
- **Đầu ra có cấu trúc** phụ thuộc vào định dạng JSON của CLI.
- **Phiên Codex CLI** tiếp tục qua đầu ra văn bản (không có JSONL), ít
  có cấu trúc hơn lần chạy `--json` ban đầu. Phiên OpenClaw vẫn hoạt động
  bình thường.

## Khắc phục sự cố

- **Không tìm thấy CLI**: đặt `command` thành đường dẫn đầy đủ.
- **Tên model sai**: dùng `modelAliases` để ánh xạ `provider/model` → model CLI.
- **Không có tính liên tục phiên**: đảm bảo `sessionArg` đã được đặt và `sessionMode` không phải là
  `none` (Codex CLI hiện chưa thể tiếp tục với đầu ra JSON).
- **Hình ảnh bị bỏ qua**: đặt `imageArg` (và xác minh CLI hỗ trợ đường dẫn tệp).

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Model cục bộ](/vi/gateway/local-models)
