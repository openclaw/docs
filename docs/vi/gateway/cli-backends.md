---
read_when:
    - Bạn muốn có phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp lỗi
    - Bạn đang chạy các CLI AI cục bộ và muốn tái sử dụng chúng
    - Bạn muốn hiểu cầu nối loopback MCP để truy cập công cụ backend CLI
summary: 'CLI backends: phương án dự phòng AI CLI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các backend CLI
x-i18n:
    generated_at: "2026-06-27T17:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy **CLI AI cục bộ** như một **phương án dự phòng chỉ văn bản** khi các nhà cung cấp API bị ngừng hoạt động,
bị giới hạn tốc độ, hoặc tạm thời hoạt động bất thường. Cách này được thiết kế thận trọng có chủ đích:

- **Các công cụ OpenClaw không được chèn trực tiếp**, nhưng các backend có `bundleMcp: true`
  có thể nhận công cụ Gateway qua một cầu nối MCP local loopback.
- **Truyền phát JSONL** cho các CLI hỗ trợ.
- **Phiên được hỗ trợ** (để các lượt tiếp theo vẫn mạch lạc).
- **Hình ảnh có thể được chuyển tiếp** nếu CLI chấp nhận đường dẫn hình ảnh.

Cơ chế này được thiết kế như một **lưới an toàn** thay vì đường dẫn chính. Hãy dùng khi bạn
muốn phản hồi văn bản "luôn hoạt động" mà không phụ thuộc vào API bên ngoài.

Nếu bạn muốn một runtime harness đầy đủ với điều khiển phiên ACP, tác vụ nền,
liên kết luồng/cuộc trò chuyện, và các phiên lập trình bên ngoài bền vững, hãy dùng
[ACP Agents](/vi/tools/acp-agents) thay thế. Backend CLI không phải là ACP.

<Tip>
  Đang xây dựng Plugin backend mới? Hãy dùng
  [Plugin backend CLI](/vi/plugins/cli-backend-plugins). Trang này dành cho người dùng
  cấu hình và vận hành một backend đã được đăng ký.
</Tip>

## Bắt đầu nhanh thân thiện với người mới

Bạn có thể dùng Claude Code CLI **mà không cần cấu hình nào** (Plugin Anthropic đi kèm
đăng ký một backend mặc định):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` là id tác nhân mặc định khi không cấu hình danh sách tác nhân rõ ràng. Nếu
bạn dùng nhiều tác nhân, hãy thay bằng id tác nhân bạn muốn chạy.

Nếu Gateway của bạn chạy dưới launchd/systemd và PATH ở mức tối thiểu, chỉ cần thêm
đường dẫn lệnh:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Chỉ vậy thôi. Không cần khóa, không cần cấu hình xác thực bổ sung ngoài chính CLI.

Nếu bạn dùng backend CLI đi kèm làm **nhà cung cấp tin nhắn chính** trên một
máy chủ Gateway, OpenClaw hiện tự động tải Plugin đi kèm sở hữu backend đó khi cấu hình của bạn
tham chiếu rõ ràng đến backend đó trong một model ref hoặc bên dưới
`agents.defaults.cliBackends`.

## Dùng làm phương án dự phòng

Thêm một backend CLI vào danh sách dự phòng để nó chỉ chạy khi các mô hình chính thất bại:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
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

Mỗi mục được đặt khóa bằng một **id nhà cung cấp** (ví dụ `claude-cli`, `my-cli`).
Id nhà cung cấp trở thành vế trái của model ref:

```
<provider>/<model>
```

### Cấu hình ví dụ

```json5
{
  agents: {
    defaults: {
      cliBackends: {
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
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cách hoạt động

1. **Chọn một backend** dựa trên tiền tố nhà cung cấp (`claude-cli/...`).
2. **Xây dựng system prompt** bằng cùng prompt OpenClaw + ngữ cảnh workspace.
3. **Thực thi CLI** với id phiên (nếu được hỗ trợ) để lịch sử vẫn nhất quán.
   Backend `claude-cli` đi kèm giữ một tiến trình Claude stdio hoạt động cho từng
   phiên OpenClaw và gửi các lượt tiếp theo qua stdin stream-json.
4. **Phân tích đầu ra** (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. **Lưu bền vững id phiên** theo từng backend, để các lượt tiếp theo tái sử dụng cùng phiên CLI.

<Note>
Backend Anthropic `claude-cli` đi kèm lại được hỗ trợ. Nhân viên Anthropic
đã cho chúng tôi biết rằng việc sử dụng Claude CLI kiểu OpenClaw lại được phép, vì vậy OpenClaw xem
việc dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố
một chính sách mới.
</Note>

Backend Anthropic `claude-cli` đi kèm ưu tiên bộ phân giải skill gốc của Claude Code
cho OpenClaw skills. Khi ảnh chụp nhanh skills hiện tại có ít nhất
một skill được chọn với đường dẫn đã hiện thực hóa, OpenClaw truyền một Plugin Claude
Code tạm thời bằng `--plugin-dir` và bỏ qua catalog kỹ năng OpenClaw trùng lặp
khỏi system prompt được nối thêm. Nếu ảnh chụp nhanh không có skill Plugin
đã hiện thực hóa, OpenClaw giữ catalog prompt làm dự phòng. Các ghi đè env/khóa API của skill
vẫn được OpenClaw áp dụng vào môi trường tiến trình con cho lượt chạy.

Claude CLI cũng có chế độ quyền không tương tác riêng. OpenClaw ánh xạ chế độ đó
vào chính sách exec hiện có thay vì thêm cấu hình chính sách riêng cho Claude.
Đối với các phiên Claude live do OpenClaw quản lý, chính sách exec OpenClaw hiệu lực là
nguồn có thẩm quyền: YOLO (`tools.exec.security: "full"` và
`tools.exec.ask: "off"`) khởi chạy Claude với
`--permission-mode bypassPermissions`, còn chính sách exec hiệu lực hạn chế
khởi chạy Claude với `--permission-mode default`. Thiết lập theo tác nhân
`agents.list[].tools.exec` ghi đè `tools.exec` toàn cục cho tác nhân đó.
Đối số backend Claude thô vẫn có thể chứa `--permission-mode`, nhưng các lần khởi chạy Claude live
sẽ chuẩn hóa cờ đó để khớp với chính sách exec OpenClaw hiệu lực.

Backend Anthropic `claude-cli` đi kèm cũng ánh xạ các mức `/think` của OpenClaw
sang cờ `--effort` gốc của Claude Code cho các mức không phải off. `minimal` và
`low` ánh xạ sang `low`, `adaptive` và `medium` ánh xạ sang `medium`, còn `high`,
`xhigh`, và `max` ánh xạ trực tiếp. Các backend CLI khác cần Plugin sở hữu chúng
khai báo một bộ ánh xạ argv tương đương trước khi `/think` có thể ảnh hưởng đến CLI được sinh.

Trước khi OpenClaw có thể dùng backend `claude-cli` đi kèm, bản thân Claude Code
phải đã đăng nhập trên cùng máy chủ:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bản cài Docker cần Claude Code được cài đặt và đăng nhập bên trong home container
được lưu bền vững, không chỉ trên máy chủ. Xem
[Backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).

Chỉ dùng `agents.defaults.cliBackends.claude-cli.command` khi binary `claude`
chưa có sẵn trên `PATH`.

## Phiên

- Nếu CLI hỗ trợ phiên, đặt `sessionArg` (ví dụ `--session-id`) hoặc
  `sessionArgs` (placeholder `{sessionId}`) khi ID cần được chèn
  vào nhiều cờ.
- Nếu CLI dùng một **lệnh con resume** với các cờ khác, đặt
  `resumeArgs` (thay thế `args` khi resume) và tùy chọn `resumeOutput`
  (cho resume không phải JSON).
- `sessionMode`:
  - `always`: luôn gửi id phiên (UUID mới nếu chưa lưu).
  - `existing`: chỉ gửi id phiên nếu trước đó đã có id được lưu.
  - `none`: không bao giờ gửi id phiên.
- `claude-cli` mặc định là `liveSession: "claude-stdio"`, `output: "jsonl"`,
  và `input: "stdin"` để các lượt tiếp theo tái sử dụng tiến trình Claude live trong khi
  nó còn hoạt động. Stdio ấm hiện là mặc định, kể cả với cấu hình tùy chỉnh
  bỏ qua các trường transport. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi
  thoát, OpenClaw resume từ id phiên Claude đã lưu. Id phiên đã lưu
  được xác minh với transcript dự án hiện có và đọc được trước khi
  resume, để các ràng buộc ảo được xóa với `reason=transcript-missing`
  thay vì âm thầm bắt đầu một phiên Claude CLI mới dưới `--resume`.
- Phiên Claude live giữ các giới hạn đầu ra JSONL có chặn biên. Mặc định cho phép tối đa
  8 MiB và 20.000 dòng JSONL thô mỗi lượt. Các lượt Claude dùng nhiều công cụ có thể tăng
  giới hạn theo backend bằng
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  và `maxTurnLines`; OpenClaw kẹp các thiết lập đó ở 64 MiB và 100.000
  dòng.
- Phiên CLI đã lưu là tính liên tục do nhà cung cấp sở hữu. Việc đặt lại phiên hằng ngày ngầm định
  không cắt chúng; `/reset` và chính sách `session.reset` rõ ràng vẫn
  cắt.
- Phiên CLI mới thường chỉ gieo lại từ tóm tắt Compaction của OpenClaw
  cộng với phần đuôi sau Compaction. Để khôi phục các phiên ngắn bị vô hiệu
  trước Compaction, một backend có thể chọn tham gia bằng
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw vẫn giữ việc gieo lại
  transcript thô trong giới hạn và chỉ giới hạn ở các vô hiệu hóa an toàn như thiếu
  transcript CLI, thay đổi system-prompt/MCP, hoặc thử lại do phiên hết hạn; thay đổi
  hồ sơ xác thực hoặc credential-epoch không bao giờ gieo lại lịch sử transcript thô.

Ghi chú về tuần tự hóa:

- `serialize: true` giữ các lượt chạy cùng lane theo đúng thứ tự.
- Hầu hết CLI tuần tự hóa trên một lane nhà cung cấp.
- OpenClaw bỏ tái sử dụng phiên CLI đã lưu khi danh tính xác thực được chọn thay đổi,
  bao gồm thay đổi id hồ sơ xác thực, khóa API tĩnh, token tĩnh, hoặc danh tính
  tài khoản OAuth khi CLI phơi bày. Việc xoay vòng access token và refresh token OAuth
  không cắt phiên CLI đã lưu. Nếu một CLI không phơi bày id tài khoản OAuth
  ổn định, OpenClaw để CLI đó tự thực thi quyền resume.

## Prelude dự phòng từ các phiên claude-cli

Khi một lần thử `claude-cli` chuyển lỗi sang một ứng viên không phải CLI trong
[`agents.defaults.model.fallbacks`](/vi/concepts/model-failover), OpenClaw gieo
lần thử tiếp theo bằng một prelude ngữ cảnh thu thập từ transcript JSONL cục bộ
của Claude Code tại `~/.claude/projects/`. Nếu không có seed này, nhà cung cấp
dự phòng sẽ bắt đầu lạnh vì transcript phiên riêng của OpenClaw trống
đối với các lượt chạy `claude-cli`.

- Prelude ưu tiên tóm tắt `/compact` mới nhất hoặc marker `compact_boundary`,
  rồi nối thêm các lượt gần đây nhất sau ranh giới trong giới hạn ngân sách ký tự.
  Các lượt trước ranh giới bị bỏ vì tóm tắt đã đại diện cho chúng.
- Các khối công cụ được gộp thành gợi ý nhỏ gọn `(tool call: name)` và
  `(tool result: …)` để giữ ngân sách prompt trung thực. Tóm tắt được
  gắn nhãn `(truncated)` nếu vượt giới hạn.
- Dự phòng cùng nhà cung cấp từ `claude-cli` sang `claude-cli` dựa vào
  `--resume` của chính Claude và bỏ qua prelude.
- Seed tái sử dụng xác thực đường dẫn tệp phiên Claude hiện có, nên
  không thể đọc đường dẫn tùy ý.

## Hình ảnh (chuyển tiếp)

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw sẽ ghi hình ảnh base64 vào tệp tạm. Nếu `imageArg` được đặt, các
đường dẫn đó được truyền làm đối số CLI. Nếu thiếu `imageArg`, OpenClaw nối thêm
đường dẫn tệp vào prompt (chèn đường dẫn), đủ cho các CLI tự động
tải tệp cục bộ từ đường dẫn thuần.

## Đầu vào / đầu ra

- `output: "json"` (mặc định) cố phân tích JSON và trích xuất văn bản + id phiên.
- Đối với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản trả lời từ `response` và usage
  từ `stats` khi `usage` bị thiếu hoặc trống. Mặc định Gemini CLI đi kèm
  dùng `stream-json`, nhưng các ghi đè `--output-format json` cũ vẫn dùng
  bộ phân tích JSON.
- `output: "jsonl"` phân tích luồng JSONL và trích xuất tin nhắn tác nhân cuối cùng cùng
  mã định danh phiên khi có.
- `output: "text"` xem stdout là phản hồi cuối cùng.

Chế độ đầu vào:

- `input: "arg"` (mặc định) truyền prompt làm đối số CLI cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được dùng.

## Mặc định (do plugin sở hữu)

Các mặc định backend CLI đi kèm nằm cùng Plugin sở hữu chúng. Ví dụ,
Anthropic sở hữu `claude-cli` và Google sở hữu `google-gemini-cli`. Các lượt chạy agent OpenAI Codex
dùng harness app-server Codex thông qua `openai/*`; OpenClaw không
còn đăng ký backend `codex-cli` đi kèm nữa.

Plugin Anthropic đi kèm đăng ký một mặc định cho `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Plugin Google đi kèm cũng đăng ký một mặc định cho `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Điều kiện tiên quyết: Gemini CLI cục bộ phải được cài đặt và có sẵn dưới dạng
`gemini` trên `PATH` (`brew install gemini-cli` hoặc
`npm install -g @google/gemini-cli`).

Ghi chú về đầu ra Gemini CLI:

- Bộ phân tích cú pháp `stream-json` mặc định đọc các sự kiện `message` của assistant, sự kiện công cụ,
  mức sử dụng `result` cuối cùng và các sự kiện lỗi Gemini nghiêm trọng.
- Nếu bạn ghi đè đối số Gemini thành `--output-format json`, OpenClaw chuẩn hóa
  backend đó trở lại `output: "json"` và đọc văn bản trả lời từ trường JSON `response`.
- Mức sử dụng chuyển sang dùng `stats` khi `usage` không có hoặc trống.
- `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
- Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
  `stats.input_tokens - stats.cached`.

Chỉ ghi đè khi cần (thường gặp: đường dẫn `command` tuyệt đối).

## Mặc định do Plugin sở hữu

Các mặc định backend CLI hiện là một phần của bề mặt Plugin:

- Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- `id` của backend trở thành tiền tố provider trong model ref.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè mặc định của Plugin.
- Dọn dẹp cấu hình theo backend vẫn do Plugin sở hữu thông qua hook tùy chọn
  `normalizeConfig`.

Các Plugin cần shim tương thích prompt/tin nhắn nhỏ có thể khai báo
biến đổi văn bản hai chiều mà không thay thế provider hoặc backend CLI:

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
các marker điều khiển và phân phối kênh của riêng nó.

Đối với các CLI phát sự kiện JSONL dành riêng cho provider, hãy đặt `jsonlDialect` trên cấu hình
của backend đó. Các dialect được hỗ trợ là `claude-stream-json` cho stream tương thích Claude
Code và `gemini-stream-json` cho sự kiện `stream-json` của Gemini CLI.

## Quyền sở hữu Compaction gốc

Một số backend CLI chạy agent tự compact transcript **của chính nó**, nên OpenClaw không được
chạy bộ tóm tắt bảo vệ của mình với chúng - làm vậy sẽ xung đột với compaction riêng của backend
và có thể khiến lượt chạy lỗi cứng.

`claude-cli` không có endpoint harness - Claude Code compact nội bộ - nên nó khai báo
`ownsNativeCompaction: true`, và OpenClaw trả về no-op từ đường dẫn compaction.
Các phiên native-harness như Codex vẫn được định tuyến tới endpoint compaction của harness
thay vào đó.

Vì backend sở hữu compaction, cách chặn tạm cũ là đặt
`contextTokens: 1_000_000` chỉ để ngăn bảo vệ của OpenClaw kích hoạt trên một phiên
claude-cli **không còn cần thiết** - opt-out này thay thế nó.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Chỉ khai báo `ownsNativeCompaction` cho backend thực sự sở hữu compaction của nó: backend đó
phải giới hạn transcript của chính nó một cách tin cậy khi gần tới cửa sổ ngữ cảnh và lưu bền một
phiên có thể tiếp tục (ví dụ `--resume` / `--session-id`); nếu không, một phiên bị hoãn có thể
vẫn vượt ngân sách. Các phiên `agentHarnessId` khớp vẫn định tuyến tới endpoint harness.

## Lớp phủ MCP gói

Các backend CLI **không** nhận trực tiếp lệnh gọi công cụ OpenClaw, nhưng một backend có thể
chọn dùng lớp phủ cấu hình MCP được tạo với `bundleMcp: true`.

Hành vi đi kèm hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo
- `google-gemini-cli`: tệp cài đặt hệ thống Gemini được tạo

Khi bundle MCP được bật, OpenClaw:

- tạo một máy chủ HTTP MCP local loopback cung cấp các công cụ gateway cho tiến trình CLI
- xác thực bridge bằng token theo phiên (`OPENCLAW_MCP_TOKEN`)
- giới hạn quyền truy cập công cụ theo ngữ cảnh phiên, tài khoản và kênh hiện tại
- tải các máy chủ bundle-MCP đã bật cho workspace hiện tại
- hợp nhất chúng với mọi dạng cấu hình/cài đặt MCP backend hiện có
- viết lại cấu hình khởi chạy bằng chế độ tích hợp do backend sở hữu từ extension sở hữu

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn chèn một cấu hình nghiêm ngặt khi một
backend chọn bundle MCP để các lượt chạy nền vẫn được cô lập.

Runtime MCP đi kèm theo phạm vi phiên được cache để tái sử dụng trong một phiên, rồi
được thu hồi sau `mcp.sessionIdleTtlMs` mili giây nhàn rỗi (mặc định 10
phút; đặt `0` để tắt). Các lượt chạy nhúng một lần như probe xác thực,
tạo slug và truy hồi active-memory yêu cầu dọn dẹp khi lượt chạy kết thúc để các tiến trình con stdio
và stream Streamable HTTP/SSE không sống lâu hơn lượt chạy.

## Giới hạn lịch sử reseed

Khi một phiên CLI mới được seed từ transcript OpenClaw trước đó (ví dụ
sau một lần thử lại `session_expired`), khối
`<conversation_history>` được render sẽ bị giới hạn để tránh prompt reseed
phình to. Mặc định là `12288` ký tự (khoảng 3000 token).

Các backend Claude CLI tự động dùng giới hạn lớn hơn được suy ra từ tầng ngữ cảnh
Claude đã phân giải. Các lượt chạy Claude chuẩn 200K-token giữ một phần transcript
lớn hơn, và các lượt chạy Claude 1M-token lại giữ phần lớn hơn nữa, trong khi các backend CLI
khác giữ mặc định thận trọng.

- Giới hạn này chỉ điều chỉnh khối lịch sử trước đó của prompt reseed. Các giới hạn đầu ra
  phiên trực tiếp được tinh chỉnh riêng trong `reliability.outputLimits`
  (xem [Phiên](#sessions)).

## Giới hạn

- **Không có lệnh gọi công cụ OpenClaw trực tiếp.** OpenClaw không chèn lệnh gọi công cụ vào
  giao thức backend CLI. Backend chỉ thấy công cụ gateway khi chúng chọn
  `bundleMcp: true`.
- **Streaming tùy theo backend.** Một số backend stream JSONL; các backend khác buffer
  cho đến khi thoát.
- **Đầu ra có cấu trúc** phụ thuộc vào định dạng JSON của CLI.

## Khắc phục sự cố

- **Không tìm thấy CLI**: đặt `command` thành đường dẫn đầy đủ.
- **Tên model sai**: dùng `modelAliases` để ánh xạ `provider/model` → model CLI.
- **Không có tính liên tục phiên**: bảo đảm `sessionArg` được đặt và `sessionMode` không phải
  `none`.
- **Hình ảnh bị bỏ qua**: đặt `imageArg` (và xác minh CLI hỗ trợ đường dẫn tệp).

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Model cục bộ](/vi/gateway/local-models)
