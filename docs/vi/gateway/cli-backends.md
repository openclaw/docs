---
read_when:
    - Bạn muốn một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp sự cố
    - Bạn đang chạy Codex CLI hoặc các CLI AI cục bộ khác và muốn tái sử dụng chúng
    - Bạn muốn hiểu cầu nối loopback MCP để truy cập công cụ phần phụ trợ CLI
summary: 'Các phần phụ trợ CLI: phương án dự phòng CLI AI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các phần phụ trợ CLI
x-i18n:
    generated_at: "2026-05-10T19:33:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy **CLI AI cục bộ** dưới dạng **phương án dự phòng chỉ văn bản** khi các nhà cung cấp API bị ngừng hoạt động,
bị giới hạn tốc độ, hoặc tạm thời hoạt động không đúng. Thiết kế này cố ý thận trọng:

- **Các công cụ OpenClaw không được chèn trực tiếp**, nhưng các backend có `bundleMcp: true`
  có thể nhận công cụ gateway qua một cầu nối MCP loopback.
- **Truyền luồng JSONL** cho các CLI hỗ trợ tính năng này.
- **Hỗ trợ phiên** (để các lượt tiếp theo vẫn mạch lạc).
- **Có thể truyền qua hình ảnh** nếu CLI chấp nhận đường dẫn hình ảnh.

Tính năng này được thiết kế như một **lưới an toàn** thay vì đường dẫn chính. Dùng nó khi bạn
muốn phản hồi văn bản "luôn hoạt động" mà không phụ thuộc vào API bên ngoài.

Nếu bạn muốn một runtime harness đầy đủ với điều khiển phiên ACP, tác vụ nền,
liên kết luồng/cuộc trò chuyện, và các phiên lập trình bên ngoài bền vững, hãy dùng
[ACP Agents](/vi/tools/acp-agents) thay thế. Backend CLI không phải là ACP.

<Tip>
  Đang xây dựng một backend plugin mới? Hãy dùng
  [CLI backend plugins](/vi/plugins/cli-backend-plugins). Trang này dành cho người dùng
  cấu hình và vận hành một backend đã được đăng ký.
</Tip>

## Khởi động nhanh thân thiện với người mới

Bạn có thể dùng Codex CLI **mà không cần cấu hình nào** (plugin OpenAI đi kèm
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

Vậy là xong. Không cần khóa, không cần cấu hình xác thực bổ sung ngoài chính CLI.

Nếu bạn dùng một backend CLI đi kèm làm **nhà cung cấp thông điệp chính** trên một
máy chủ gateway, OpenClaw giờ đây tự động tải plugin đi kèm sở hữu backend đó khi cấu hình của bạn
tham chiếu rõ ràng backend đó trong model ref hoặc dưới
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

Mỗi mục được định khóa bằng một **provider id** (ví dụ `codex-cli`, `my-cli`).
provider id trở thành vế trái của model ref của bạn:

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

1. **Chọn một backend** dựa trên tiền tố nhà cung cấp (`codex-cli/...`).
2. **Tạo system prompt** bằng cùng prompt OpenClaw + ngữ cảnh workspace.
3. **Thực thi CLI** với một session id (nếu được hỗ trợ) để lịch sử luôn nhất quán.
   Backend `claude-cli` đi kèm giữ một tiến trình Claude stdio sống cho mỗi
   phiên OpenClaw và gửi các lượt tiếp theo qua stream-json stdin.
4. **Phân tích đầu ra** (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. **Lưu bền vững session id** cho từng backend, để các lượt tiếp theo dùng lại cùng phiên CLI.

<Note>
Backend Anthropic `claude-cli` đi kèm lại được hỗ trợ. Nhân viên Anthropic
đã cho chúng tôi biết rằng việc sử dụng Claude CLI theo kiểu OpenClaw lại được cho phép, vì vậy OpenClaw xem
việc dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố
một chính sách mới.
</Note>

Backend OpenAI `codex-cli` đi kèm truyền system prompt của OpenClaw qua
ghi đè cấu hình `model_instructions_file` của Codex (`-c
model_instructions_file="..."`). Codex không cung cấp cờ kiểu Claude
`--append-system-prompt`, nên OpenClaw ghi prompt đã lắp ráp vào một
tệp tạm thời cho mỗi phiên Codex CLI mới.

Backend Anthropic `claude-cli` đi kèm nhận snapshot Skills của OpenClaw
theo hai cách: danh mục Skills OpenClaw gọn trong system prompt được nối thêm, và
một plugin Claude Code tạm thời được truyền bằng `--plugin-dir`. Plugin chỉ chứa
các Skills đủ điều kiện cho agent/phiên đó, nên bộ phân giải skill gốc của Claude Code
thấy cùng tập đã lọc mà OpenClaw nếu không sẽ quảng bá trong
prompt. Các ghi đè env/API key của skill vẫn được OpenClaw áp dụng cho
môi trường tiến trình con trong lần chạy.

Claude CLI cũng có chế độ quyền không tương tác riêng. OpenClaw ánh xạ chế độ đó
vào chính sách exec hiện có thay vì thêm cấu hình riêng cho Claude: khi
chính sách exec được yêu cầu hiệu lực là YOLO (`tools.exec.security: "full"` và
`tools.exec.ask: "off"`), OpenClaw thêm `--permission-mode bypassPermissions`.
Thiết lập theo agent `agents.list[].tools.exec` ghi đè `tools.exec` toàn cục cho
agent đó. Để buộc một chế độ Claude khác, hãy đặt các đối số backend thô rõ ràng
như `--permission-mode default` hoặc `--permission-mode acceptEdits` dưới
`agents.defaults.cliBackends.claude-cli.args` và `resumeArgs` tương ứng.

Backend Anthropic `claude-cli` đi kèm cũng ánh xạ các mức `/think` của OpenClaw
vào cờ `--effort` gốc của Claude Code cho các mức không phải off. `minimal` và
`low` ánh xạ thành `low`, `adaptive` và `medium` ánh xạ thành `medium`, còn `high`,
`xhigh`, và `max` ánh xạ trực tiếp. Các backend CLI khác cần plugin sở hữu chúng
khai báo một trình ánh xạ argv tương đương trước khi `/think` có thể ảnh hưởng đến CLI được sinh.

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
  (cho resume không phải JSON).
- `sessionMode`:
  - `always`: luôn gửi một session id (UUID mới nếu chưa có gì được lưu).
  - `existing`: chỉ gửi session id nếu trước đó đã có một id được lưu.
  - `none`: không bao giờ gửi session id.
- `claude-cli` mặc định là `liveSession: "claude-stdio"`, `output: "jsonl"`,
  và `input: "stdin"` để các lượt tiếp theo dùng lại tiến trình Claude đang sống trong khi
  nó còn hoạt động. Warm stdio hiện là mặc định, kể cả với cấu hình tùy chỉnh
  bỏ qua các trường transport. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi
  thoát, OpenClaw tiếp tục từ session id Claude đã lưu. Các session
  id đã lưu được xác minh với một bản ghi dự án hiện có có thể đọc được trước khi
  resume, nên các liên kết ảo bị xóa với `reason=transcript-missing`
  thay vì âm thầm khởi động một phiên Claude CLI mới dưới `--resume`.
- Phiên Claude sống giữ các bộ bảo vệ đầu ra JSONL có giới hạn. Mặc định cho phép tối đa
  8 MiB và 20.000 dòng JSONL thô mỗi lượt. Các lượt Claude nhiều công cụ có thể tăng
  giới hạn cho từng backend bằng
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  và `maxTurnLines`; OpenClaw kẹp các thiết lập đó ở 64 MiB và 100.000
  dòng.
- Phiên CLI đã lưu là tính liên tục do nhà cung cấp sở hữu. Đặt lại phiên hằng ngày ngầm định
  không cắt chúng; `/reset` và các chính sách `session.reset` rõ ràng vẫn
  cắt.
- Phiên CLI mới thường chỉ gieo lại từ tóm tắt compaction của OpenClaw
  cộng với phần đuôi sau compaction. Để khôi phục các phiên ngắn bị vô hiệu hóa
  trước compaction, một backend có thể chọn tham gia bằng
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw vẫn giữ việc gieo lại bản ghi thô
  có giới hạn và giới hạn nó ở các trường hợp vô hiệu hóa an toàn như thiếu
  bản ghi CLI, thay đổi system-prompt/MCP, hoặc thử lại do phiên hết hạn; thay đổi
  hồ sơ xác thực hoặc credential-epoch không bao giờ gieo lại lịch sử bản ghi thô.

Ghi chú về tuần tự hóa:

- `serialize: true` giữ các lần chạy cùng làn theo đúng thứ tự.
- Hầu hết CLI tuần tự hóa trên một làn nhà cung cấp.
- OpenClaw bỏ dùng lại phiên CLI đã lưu khi danh tính xác thực được chọn thay đổi,
  bao gồm auth profile id, static API key, static token, hoặc danh tính tài khoản OAuth
  đã thay đổi khi CLI cung cấp danh tính đó. Luân chuyển access token và refresh token OAuth
  không cắt phiên CLI đã lưu. Nếu một CLI không cung cấp một
  OAuth account id ổn định, OpenClaw để CLI đó tự thực thi quyền resume.

## Dẫn nhập dự phòng từ các phiên claude-cli

Khi một lần thử `claude-cli` chuyển lỗi sang một ứng viên không phải CLI trong
[`agents.defaults.model.fallbacks`](/vi/concepts/model-failover), OpenClaw gieo
lần thử tiếp theo bằng một dẫn nhập ngữ cảnh thu hoạch từ bản ghi JSONL cục bộ
của Claude Code tại `~/.claude/projects/`. Không có phần gieo này, nhà cung cấp
dự phòng sẽ bắt đầu lạnh vì bản ghi phiên riêng của OpenClaw trống
cho các lần chạy `claude-cli`.

- Phần dẫn nhập ưu tiên tóm tắt `/compact` mới nhất hoặc marker `compact_boundary`,
  rồi nối thêm các lượt gần đây nhất sau ranh giới đến một ngân sách ký tự.
  Các lượt trước ranh giới bị bỏ vì tóm tắt đã đại diện cho chúng.
- Các khối công cụ được gộp thành các gợi ý gọn `(tool call: name)` và
  `(tool result: …)` để giữ ngân sách prompt trung thực. Tóm tắt được
  gắn nhãn `(truncated)` nếu vượt giới hạn.
- Các dự phòng `claude-cli` sang `claude-cli` cùng nhà cung cấp dựa vào
  `--resume` riêng của Claude và bỏ qua phần dẫn nhập.
- Phần gieo dùng lại xác thực đường dẫn tệp phiên Claude hiện có, nên
  không thể đọc đường dẫn tùy ý.

## Hình ảnh (truyền qua)

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw sẽ ghi hình ảnh base64 vào tệp tạm thời. Nếu `imageArg` được đặt, các
đường dẫn đó được truyền làm đối số CLI. Nếu thiếu `imageArg`, OpenClaw nối thêm
đường dẫn tệp vào prompt (chèn đường dẫn), điều này đủ cho các CLI tự động
tải tệp cục bộ từ đường dẫn thuần.

## Đầu vào / đầu ra

- `output: "json"` (mặc định) cố gắng phân tích JSON và trích xuất văn bản + session id.
- Với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản trả lời từ `response` và
  mức sử dụng từ `stats` khi thiếu hoặc trống `usage`.
- `output: "jsonl"` phân tích các luồng JSONL (ví dụ Codex CLI `--json`) và trích xuất thông điệp agent cuối cùng cộng với
  các định danh phiên khi có.
- `output: "text"` xem stdout là phản hồi cuối cùng.

Chế độ đầu vào:

- `input: "arg"` (mặc định) truyền prompt làm đối số CLI cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được dùng.

## Mặc định (do plugin sở hữu)

Plugin OpenAI đi kèm cũng đăng ký mặc định cho `codex-cli`:

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

Điều kiện tiên quyết: Gemini CLI cục bộ phải được cài đặt và có sẵn dưới tên
`gemini` trên `PATH` (`brew install gemini-cli` hoặc
`npm install -g @google/gemini-cli`).

Ghi chú JSON của Gemini CLI:

- Văn bản trả lời được đọc từ trường JSON `response`.
- Usage dùng dự phòng `stats` khi `usage` vắng mặt hoặc rỗng.
- `stats.cached` được chuẩn hóa thành OpenClaw `cacheRead`.
- Nếu thiếu `stats.input`, OpenClaw suy ra token đầu vào từ
  `stats.input_tokens - stats.cached`.

Chỉ ghi đè khi cần (thường gặp: đường dẫn tuyệt đối của `command`).

## Mặc định do Plugin sở hữu

Các mặc định backend CLI hiện là một phần của bề mặt Plugin:

- Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- Backend `id` trở thành tiền tố provider trong model refs.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè mặc định của Plugin.
- Việc dọn dẹp cấu hình riêng cho backend vẫn do Plugin sở hữu thông qua hook
  `normalizeConfig` tùy chọn.

Các Plugin cần shim tương thích prompt/thông điệp nhỏ có thể khai báo
các phép biến đổi văn bản hai chiều mà không cần thay provider hoặc backend CLI:

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
các dấu điều khiển và việc gửi qua kênh của riêng nó.

Đối với các CLI phát ra JSONL tương thích Claude Code stream-json, đặt
`jsonlDialect: "claude-stream-json"` trên cấu hình của backend đó.

## Lớp phủ MCP đóng gói

Backend CLI **không** nhận trực tiếp các lệnh gọi công cụ OpenClaw, nhưng một backend có thể
chọn dùng lớp phủ cấu hình MCP được tạo bằng `bundleMcp: true`.

Hành vi đi kèm hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo
- `codex-cli`: các ghi đè cấu hình nội tuyến cho `mcp_servers`; máy chủ
  loopback OpenClaw được tạo được đánh dấu bằng chế độ phê duyệt công cụ theo từng máy chủ của Codex
  để các lệnh gọi MCP không thể bị kẹt ở prompt phê duyệt cục bộ
- `google-gemini-cli`: tệp cài đặt hệ thống Gemini được tạo

Khi MCP đóng gói được bật, OpenClaw:

- sinh ra một máy chủ MCP HTTP loopback để phơi bày các công cụ Gateway cho tiến trình CLI
- xác thực bridge bằng token theo từng phiên (`OPENCLAW_MCP_TOKEN`)
- giới hạn quyền truy cập công cụ theo phiên hiện tại, tài khoản và ngữ cảnh kênh
- tải các máy chủ bundle-MCP đã bật cho workspace hiện tại
- hợp nhất chúng với mọi dạng cấu hình/cài đặt MCP backend hiện có
- viết lại cấu hình khởi chạy bằng chế độ tích hợp do backend sở hữu từ phần mở rộng sở hữu

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn chèn một cấu hình nghiêm ngặt khi một
backend chọn dùng MCP đóng gói để các lần chạy nền vẫn được cô lập.

Runtime MCP đóng gói theo phạm vi phiên được lưu vào bộ nhớ đệm để tái sử dụng trong một phiên, rồi
được thu dọn sau `mcp.sessionIdleTtlMs` mili giây nhàn rỗi (mặc định 10
phút; đặt `0` để tắt). Các lần chạy nhúng một lần như thăm dò xác thực,
tạo slug và truy xuất Active Memory yêu cầu dọn dẹp ở cuối lần chạy để các tiến trình con stdio
và stream Streamable HTTP/SSE không tồn tại lâu hơn lần chạy.

## Hạn chế

- **Không có lệnh gọi công cụ OpenClaw trực tiếp.** OpenClaw không chèn lệnh gọi công cụ vào
  giao thức backend CLI. Backend chỉ thấy các công cụ Gateway khi chúng chọn dùng
  `bundleMcp: true`.
- **Streaming tùy thuộc vào backend.** Một số backend stream JSONL; những backend khác đệm
  cho đến khi thoát.
- **Đầu ra có cấu trúc** phụ thuộc vào định dạng JSON của CLI.
- **Phiên Codex CLI** tiếp tục qua đầu ra văn bản (không có JSONL), vốn ít
  cấu trúc hơn lần chạy `--json` ban đầu. Phiên OpenClaw vẫn hoạt động
  bình thường.

## Khắc phục sự cố

- **Không tìm thấy CLI**: đặt `command` thành đường dẫn đầy đủ.
- **Sai tên model**: dùng `modelAliases` để ánh xạ `provider/model` → model CLI.
- **Không có tính liên tục của phiên**: bảo đảm `sessionArg` được đặt và `sessionMode` không phải là
  `none` (Codex CLI hiện không thể tiếp tục với đầu ra JSON).
- **Hình ảnh bị bỏ qua**: đặt `imageArg` (và xác minh CLI hỗ trợ đường dẫn tệp).

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Model cục bộ](/vi/gateway/local-models)
