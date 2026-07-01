---
read_when:
    - Bạn muốn một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp lỗi
    - Bạn đang chạy các CLI AI cục bộ và muốn tái sử dụng chúng
    - Bạn muốn hiểu cầu nối local loopback MCP để truy cập công cụ backend CLI
summary: 'Các backend CLI: phương án dự phòng CLI AI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các phần phụ trợ CLI
x-i18n:
    generated_at: "2026-07-01T08:14:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy **CLI AI cục bộ** như một **phương án dự phòng chỉ văn bản** khi các nhà cung cấp API ngừng hoạt động,
bị giới hạn tốc độ, hoặc tạm thời hoạt động không ổn định. Thiết kế này có chủ ý thận trọng:

- **Các công cụ OpenClaw không được tiêm trực tiếp**, nhưng các backend có `bundleMcp: true`
  có thể nhận công cụ gateway qua một cầu nối MCP loopback.
- **Phát trực tuyến JSONL** cho các CLI hỗ trợ.
- **Có hỗ trợ phiên** (để các lượt tiếp theo vẫn mạch lạc).
- **Có thể truyền hình ảnh qua** nếu CLI chấp nhận đường dẫn hình ảnh.

Thiết kế này là một **lưới an toàn** thay vì đường dẫn chính. Hãy dùng khi bạn
muốn phản hồi văn bản "luôn hoạt động" mà không phụ thuộc vào API bên ngoài.

Nếu bạn muốn một runtime harness đầy đủ với điều khiển phiên ACP, tác vụ nền,
gắn kết luồng/cuộc trò chuyện, và các phiên lập trình bên ngoài bền vững, hãy dùng
[ACP Agents](/vi/tools/acp-agents) thay thế. Backend CLI không phải là ACP.

<Tip>
  Đang xây dựng một Plugin backend mới? Hãy dùng
  [Plugin backend CLI](/vi/plugins/cli-backend-plugins). Trang này dành cho người dùng
  cấu hình và vận hành một backend đã được đăng ký.
</Tip>

## Bắt đầu nhanh thân thiện với người mới

Bạn có thể dùng Claude Code CLI **mà không cần cấu hình nào** (Plugin Anthropic đi kèm
đăng ký một backend mặc định):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` là id tác tử mặc định khi không cấu hình danh sách tác tử rõ ràng. Nếu
bạn dùng nhiều tác tử, hãy thay bằng id tác tử bạn muốn chạy.

Nếu gateway của bạn chạy dưới launchd/systemd và PATH tối giản, chỉ cần thêm
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

Vậy là xong. Không cần khóa, không cần cấu hình xác thực bổ sung ngoài chính CLI.

Nếu bạn dùng backend CLI đi kèm làm **nhà cung cấp tin nhắn chính** trên một
máy chủ gateway, OpenClaw giờ đây tự động tải Plugin đi kèm sở hữu backend đó khi cấu hình của bạn
tham chiếu rõ ràng backend đó trong model ref hoặc dưới
`agents.defaults.cliBackends`.

## Dùng làm phương án dự phòng

Thêm backend CLI vào danh sách dự phòng để nó chỉ chạy khi các mô hình chính thất bại:

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

Mỗi mục được khóa bằng một **id nhà cung cấp** (ví dụ `claude-cli`, `my-cli`).
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
2. **Tạo system prompt** bằng cùng prompt OpenClaw + ngữ cảnh workspace.
3. **Thực thi CLI** với id phiên (nếu được hỗ trợ) để lịch sử vẫn nhất quán.
   Backend `claude-cli` đi kèm giữ một tiến trình Claude stdio sống cho mỗi
   phiên OpenClaw và gửi các lượt tiếp theo qua stdin stream-json.
4. **Phân tích đầu ra** (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. **Lưu bền vững id phiên** cho từng backend, để các lượt tiếp theo dùng lại cùng phiên CLI.

<Note>
Backend Anthropic `claude-cli` đi kèm lại được hỗ trợ. Nhân viên Anthropic
cho chúng tôi biết việc sử dụng Claude CLI kiểu OpenClaw đã được cho phép lại, nên OpenClaw xem việc dùng
`claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố
một chính sách mới.
</Note>

Backend Anthropic `claude-cli` đi kèm ưu tiên bộ phân giải skill gốc của Claude Code
cho OpenClaw skills. Khi snapshot skills hiện tại có ít nhất
một skill được chọn với đường dẫn đã được materialize, OpenClaw truyền một Plugin Claude
Code tạm thời bằng `--plugin-dir` và bỏ qua catalog OpenClaw skills trùng lặp
khỏi system prompt được nối thêm. Nếu snapshot không có Plugin
skill đã materialize, OpenClaw giữ catalog prompt làm phương án dự phòng. Các ghi đè env/API key
của skill vẫn được OpenClaw áp dụng cho môi trường tiến trình con cho
lượt chạy.

Claude CLI cũng có chế độ quyền không tương tác riêng. OpenClaw ánh xạ chế độ đó
vào chính sách exec hiện có thay vì thêm cấu hình chính sách riêng cho Claude.
Đối với các phiên Claude live do OpenClaw quản lý, chính sách exec OpenClaw hiệu lực là
có thẩm quyền: YOLO (`tools.exec.security: "full"` và
`tools.exec.ask: "off"`) khởi chạy Claude với
`--permission-mode bypassPermissions`, trong khi chính sách exec hiệu lực hạn chế
khởi chạy Claude với `--permission-mode default`. Thiết lập theo từng tác tử
`agents.list[].tools.exec` ghi đè `tools.exec` toàn cục cho tác tử đó.
Đối số backend Claude thô vẫn có thể bao gồm `--permission-mode`, nhưng các lần khởi chạy Claude
live sẽ chuẩn hóa cờ đó để khớp với chính sách exec OpenClaw hiệu lực.

Backend Anthropic `claude-cli` đi kèm cũng ánh xạ các mức OpenClaw `/think`
sang cờ `--effort` gốc của Claude Code cho các mức không tắt. `minimal` và
`low` ánh xạ thành `low`, `adaptive` và `medium` ánh xạ thành `medium`, còn `high`,
`xhigh`, và `max` ánh xạ trực tiếp. Các backend CLI khác cần Plugin sở hữu của chúng
khai báo một bộ ánh xạ argv tương đương trước khi `/think` có thể ảnh hưởng đến CLI được sinh ra.

Trước khi OpenClaw có thể dùng backend `claude-cli` đi kèm, bản thân Claude Code
phải đã đăng nhập trên cùng máy chủ:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bản cài đặt Docker cần Claude Code được cài đặt và đăng nhập bên trong home container
được lưu bền vững, không chỉ trên máy chủ. Xem
[Backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).

Chỉ dùng `agents.defaults.cliBackends.claude-cli.command` khi binary `claude`
chưa có sẵn trên `PATH`.

## Phiên

- Nếu CLI hỗ trợ phiên, đặt `sessionArg` (ví dụ `--session-id`) hoặc
  `sessionArgs` (placeholder `{sessionId}`) khi ID cần được chèn
  vào nhiều cờ.
- Nếu CLI dùng **lệnh con resume** với các cờ khác, đặt
  `resumeArgs` (thay thế `args` khi resume) và tùy chọn `resumeOutput`
  (cho resume không phải JSON).
- `sessionMode`:
  - `always`: luôn gửi id phiên (UUID mới nếu chưa có lưu trữ).
  - `existing`: chỉ gửi id phiên nếu trước đó đã lưu.
  - `none`: không bao giờ gửi id phiên.
- `claude-cli` mặc định là `liveSession: "claude-stdio"`, `output: "jsonl"`,
  và `input: "stdin"` để các lượt tiếp theo dùng lại tiến trình Claude live trong khi
  nó đang hoạt động. Stdio ấm giờ là mặc định, kể cả với cấu hình tùy chỉnh
  bỏ qua các trường transport. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi
  thoát, OpenClaw resume từ id phiên Claude đã lưu. Các id phiên đã lưu
  được xác minh với transcript dự án hiện có và có thể đọc trước khi
  resume, nên các binding ảo bị xóa với `reason=transcript-missing`
  thay vì âm thầm bắt đầu một phiên Claude CLI mới dưới `--resume`.
- Phiên Claude live giữ các bộ giới hạn đầu ra JSONL có biên. Mặc định cho phép tối đa
  8 MiB và 20.000 dòng JSONL thô mỗi lượt. Các lượt Claude dùng nhiều công cụ có thể tăng
  chúng theo từng backend bằng
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  và `maxTurnLines`; OpenClaw kẹp các thiết lập đó ở 64 MiB và 100.000
  dòng.
- Các phiên CLI đã lưu là tính liên tục do nhà cung cấp sở hữu. Việc đặt lại phiên hằng ngày ngầm định
  không cắt chúng; `/reset` và các chính sách `session.reset` rõ ràng vẫn
  cắt.
- Phiên CLI mới thường chỉ gieo lại từ tóm tắt Compaction của OpenClaw
  cộng với phần đuôi sau Compaction. Để khôi phục các phiên ngắn bị vô hiệu hóa
  trước Compaction, backend có thể chọn tham gia bằng
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw vẫn giữ việc gieo lại transcript thô
  trong giới hạn và chỉ giới hạn vào các vô hiệu hóa an toàn như thiếu
  transcript CLI, thay đổi system-prompt/MCP, hoặc thử lại do phiên hết hạn; thay đổi
  hồ sơ xác thực hoặc credential-epoch không bao giờ gieo lại lịch sử transcript thô.

Ghi chú về tuần tự hóa:

- `serialize: true` giữ các lượt chạy cùng làn theo đúng thứ tự.
- Hầu hết CLI tuần tự hóa trên một làn nhà cung cấp.
- OpenClaw bỏ việc dùng lại phiên CLI đã lưu khi danh tính xác thực được chọn thay đổi,
  bao gồm id hồ sơ xác thực đã thay đổi, API key tĩnh, token tĩnh, hoặc danh tính tài khoản
  OAuth khi CLI phơi bày một danh tính. Việc xoay vòng access token và refresh token OAuth
  không cắt phiên CLI đã lưu. Nếu CLI không phơi bày một
  id tài khoản OAuth ổn định, OpenClaw để CLI đó thực thi quyền resume.

## Phần mở đầu dự phòng từ phiên claude-cli

Khi một lần thử `claude-cli` chuyển lỗi sang một ứng viên không phải CLI trong
[`agents.defaults.model.fallbacks`](/vi/concepts/model-failover), OpenClaw gieo
lần thử tiếp theo bằng một phần mở đầu ngữ cảnh thu thập từ transcript JSONL cục bộ
của Claude Code tại `~/.claude/projects/`. Nếu không có seed này, nhà cung cấp
dự phòng sẽ bắt đầu lạnh vì transcript phiên riêng của OpenClaw trống
đối với các lượt chạy `claude-cli`.

- Phần mở đầu ưu tiên tóm tắt `/compact` mới nhất hoặc dấu mốc `compact_boundary`,
  rồi nối thêm các lượt sau ranh giới gần đây nhất đến giới hạn ký tự.
  Các lượt trước ranh giới bị bỏ vì tóm tắt đã đại diện cho chúng.
- Các khối công cụ được gộp thành gợi ý gọn `(tool call: name)` và
  `(tool result: …)` để giữ ngân sách prompt trung thực. Tóm tắt được
  gắn nhãn `(truncated)` nếu vượt quá giới hạn.
- Các dự phòng cùng nhà cung cấp từ `claude-cli` sang `claude-cli` dựa vào
  `--resume` riêng của Claude và bỏ qua phần mở đầu.
- Seed dùng lại cơ chế xác thực đường dẫn file phiên Claude hiện có, nên
  không thể đọc đường dẫn tùy ý.

## Hình ảnh (truyền qua)

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw sẽ ghi hình ảnh base64 vào các file tạm. Nếu `imageArg` được đặt, các
đường dẫn đó được truyền làm đối số CLI. Nếu thiếu `imageArg`, OpenClaw nối thêm
đường dẫn file vào prompt (tiêm đường dẫn), đủ cho các CLI tự động
tải file cục bộ từ đường dẫn thuần.

## Đầu vào / đầu ra

- `output: "json"` (mặc định) cố phân tích JSON và trích xuất văn bản + id phiên.
- Đối với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản trả lời từ `response` và usage
  từ `stats` khi `usage` bị thiếu hoặc rỗng. Mặc định Gemini CLI đi kèm
  dùng `stream-json`, nhưng các ghi đè `--output-format json` cũ vẫn dùng
  trình phân tích JSON.
- `output: "jsonl"` phân tích luồng JSONL và trích xuất tin nhắn tác tử cuối cùng cùng các định danh phiên
  khi có.
- `output: "text"` xem stdout là phản hồi cuối cùng.

Chế độ đầu vào:

- `input: "arg"` (mặc định) truyền prompt dưới dạng đối số CLI cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được dùng.

## Mặc định (do Plugin sở hữu)

Các mặc định backend CLI đi kèm nằm cùng Plugin sở hữu chúng. Ví dụ,
Anthropic sở hữu `claude-cli` và Google sở hữu `google-gemini-cli`. Các lượt chạy tác nhân OpenAI Codex
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

- Bộ phân tích cú pháp `stream-json` mặc định đọc các sự kiện `message` của trợ lý, sự kiện công cụ,
  mức sử dụng `result` cuối cùng, và các sự kiện lỗi Gemini nghiêm trọng.
- Nếu bạn ghi đè đối số Gemini thành `--output-format json`, OpenClaw chuẩn hóa
  backend đó trở lại `output: "json"` và đọc văn bản phản hồi từ trường JSON `response`.
- Mức sử dụng dùng dự phòng `stats` khi `usage` vắng mặt hoặc rỗng.
- `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.
- Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
  `stats.input_tokens - stats.cached`.

Chỉ ghi đè nếu cần (thường gặp: đường dẫn `command` tuyệt đối).

## Mặc định do Plugin sở hữu

Các mặc định backend CLI hiện là một phần của bề mặt Plugin:

- Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- `id` của backend trở thành tiền tố nhà cung cấp trong tham chiếu mô hình.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè mặc định của Plugin.
- Dọn dẹp cấu hình riêng cho backend vẫn do Plugin sở hữu thông qua hook tùy chọn
  `normalizeConfig`.

Plugin cần các shim tương thích prompt/tin nhắn nhỏ có thể khai báo
các phép biến đổi văn bản hai chiều mà không thay thế nhà cung cấp hay backend CLI:

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

`input` viết lại prompt hệ thống và prompt người dùng được truyền cho CLI. `output`
viết lại văn bản trợ lý được stream và văn bản cuối cùng đã phân tích cú pháp trước khi OpenClaw xử lý
các marker điều khiển riêng và phân phối kênh. Với các lệnh gọi mô hình có backend nhà cung cấp,
`output` cũng khôi phục các giá trị chuỗi bên trong đối số lệnh gọi công cụ có cấu trúc sau khi
sửa stream và trước khi thực thi công cụ. Các mảnh JSON thô của nhà cung cấp giữ nguyên;
bên tiêu thụ nên dùng payload một phần, kết thúc, hoặc kết quả có cấu trúc.

Với các CLI phát sự kiện JSONL riêng theo nhà cung cấp, đặt `jsonlDialect` trên cấu hình
của backend đó. Các dialect được hỗ trợ là `claude-stream-json` cho stream tương thích Claude
Code và `gemini-stream-json` cho sự kiện Gemini CLI `stream-json`.

## Quyền sở hữu Compaction gốc

Một số backend CLI chạy một tác nhân tự compact bản ghi của **chính nó**, nên OpenClaw
không được chạy trình tóm tắt bảo vệ của mình trên chúng - làm vậy sẽ xung đột với
Compaction riêng của backend và có thể khiến lượt chạy thất bại hẳn.

`claude-cli` không có endpoint harness - Claude Code compact nội bộ - nên nó khai báo
`ownsNativeCompaction: true`, và OpenClaw trả về no-op từ đường dẫn Compaction.
Các phiên native-harness như Codex vẫn định tuyến đến endpoint Compaction của harness.

Vì backend sở hữu Compaction, cách tạm thời cũ là đặt
`contextTokens: 1_000_000` chỉ để ngăn cơ chế bảo vệ của OpenClaw kích hoạt trên một
phiên claude-cli **không còn cần thiết** - tùy chọn opt-out thay thế nó.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Chỉ khai báo `ownsNativeCompaction` cho backend thật sự sở hữu Compaction của nó: backend đó
phải giới hạn đáng tin cậy bản ghi của chính nó khi gần chạm cửa sổ ngữ cảnh và lưu bền một
phiên có thể tiếp tục (ví dụ `--resume` / `--session-id`); nếu không, một phiên bị trì hoãn có thể
vẫn vượt ngân sách. Các phiên khớp `agentHarnessId` vẫn định tuyến đến endpoint harness.

## Lớp phủ MCP gói kèm

Backend CLI **không** nhận trực tiếp lệnh gọi công cụ OpenClaw, nhưng một backend có thể
chọn tham gia lớp phủ cấu hình MCP được tạo bằng `bundleMcp: true`.

Hành vi đi kèm hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo
- `google-gemini-cli`: tệp thiết lập hệ thống Gemini được tạo

Khi MCP gói kèm được bật, OpenClaw:

- khởi chạy một máy chủ MCP HTTP local loopback, phơi bày các công cụ Gateway cho tiến trình CLI
- xác thực cầu nối bằng token theo phiên (`OPENCLAW_MCP_TOKEN`)
- giới hạn quyền truy cập công cụ trong phạm vi phiên, tài khoản, và ngữ cảnh kênh hiện tại
- tải các máy chủ bundle-MCP đã bật cho workspace hiện tại
- hợp nhất chúng với mọi dạng cấu hình/thiết lập MCP backend hiện có
- viết lại cấu hình khởi chạy bằng chế độ tích hợp do backend sở hữu từ tiện ích mở rộng sở hữu nó

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn chèn một cấu hình nghiêm ngặt khi một
backend chọn dùng MCP gói kèm để các lượt chạy nền luôn được cô lập.

Runtime MCP đi kèm theo phạm vi phiên được cache để tái sử dụng trong một phiên, rồi
được thu hồi sau `mcp.sessionIdleTtlMs` mili giây không hoạt động (mặc định 10
phút; đặt `0` để tắt). Các lượt chạy nhúng một lần như thăm dò xác thực,
tạo slug, và truy hồi active-memory yêu cầu dọn dẹp khi kết thúc lượt chạy để các tiến trình con stdio
và stream Streamable HTTP/SSE không sống lâu hơn lượt chạy.

## Giới hạn lịch sử reseed

Khi một phiên CLI mới được gieo từ một bản ghi OpenClaw trước đó (ví dụ
sau lần thử lại `session_expired`), khối
`<conversation_history>` được render sẽ bị giới hạn để tránh prompt reseed
phình to. Mặc định là `12288` ký tự (khoảng 3000 token).

Backend Claude CLI tự động dùng giới hạn lớn hơn được suy ra từ
tầng ngữ cảnh Claude đã phân giải. Các lượt chạy Claude 200K-token tiêu chuẩn giữ một lát cắt bản ghi
lớn hơn, và các lượt chạy Claude 1M-token lại giữ lát cắt lớn hơn nữa, trong khi các backend CLI
khác giữ mặc định thận trọng.

- Giới hạn này chỉ quản lý khối lịch sử trước đó trong prompt reseed. Các giới hạn
  đầu ra phiên đang hoạt động được tinh chỉnh riêng trong `reliability.outputLimits`
  (xem [Phiên](#sessions)).

## Hạn chế

- **Không có lệnh gọi công cụ OpenClaw trực tiếp.** OpenClaw không chèn lệnh gọi công cụ vào
  giao thức backend CLI. Backend chỉ thấy công cụ Gateway khi chúng chọn dùng
  `bundleMcp: true`.
- **Streaming phụ thuộc vào backend.** Một số backend stream JSONL; các backend khác đệm
  cho đến khi thoát.
- **Đầu ra có cấu trúc** phụ thuộc vào định dạng JSON của CLI.

## Khắc phục sự cố

- **Không tìm thấy CLI**: đặt `command` thành đường dẫn đầy đủ.
- **Sai tên mô hình**: dùng `modelAliases` để ánh xạ `provider/model` → mô hình CLI.
- **Không có tính liên tục phiên**: bảo đảm `sessionArg` được đặt và `sessionMode` không phải
  `none`.
- **Ảnh bị bỏ qua**: đặt `imageArg` (và xác minh CLI hỗ trợ đường dẫn tệp).

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Mô hình cục bộ](/vi/gateway/local-models)
