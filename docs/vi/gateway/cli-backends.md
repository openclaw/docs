---
read_when:
    - Bạn muốn có một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp sự cố
    - Bạn đang chạy các CLI AI cục bộ và muốn tái sử dụng chúng
    - Bạn muốn tìm hiểu cầu nối MCP local loopback để truy cập công cụ backend CLI
summary: 'Các backend CLI: phương án dự phòng dùng CLI AI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các backend CLI
x-i18n:
    generated_at: "2026-07-12T07:54:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy một CLI AI cục bộ làm phương án dự phòng chỉ dùng văn bản khi các nhà cung cấp API ngừng hoạt động, bị giới hạn tốc độ hoặc hoạt động không đúng. Cơ chế này được thiết kế thận trọng:

- Các công cụ OpenClaw không được chèn trực tiếp, nhưng một backend có `bundleMcp: true` có thể nhận các công cụ Gateway thông qua cầu nối MCP local loopback.
- Truyền phát JSONL cho các CLI hỗ trợ định dạng này.
- Có hỗ trợ phiên, vì vậy các lượt trao đổi tiếp theo vẫn duy trì tính liền mạch.
- Hình ảnh được chuyển tiếp nếu CLI chấp nhận đường dẫn hình ảnh.

Hãy dùng cơ chế này như một mạng lưới an toàn để có phản hồi văn bản "luôn hoạt động", không phải làm đường dẫn chính. Để có môi trường chạy harness đầy đủ với khả năng điều khiển phiên ACP, tác vụ nền, liên kết luồng/cuộc hội thoại và các phiên lập trình bên ngoài liên tục, hãy dùng [Tác nhân ACP](/vi/tools/acp-agents); các backend CLI không phải là ACP.

<Tip>
  Bạn đang xây dựng Plugin backend mới? Hãy xem [Plugin backend CLI](/vi/plugins/cli-backend-plugins). Trang này trình bày cách cấu hình và vận hành một backend đã được đăng ký.
</Tip>

## Bắt đầu nhanh

Plugin Anthropic đi kèm đăng ký backend `claude-cli` mặc định, nên backend này hoạt động mà không cần cấu hình gì ngoài việc đã cài đặt và đăng nhập Claude Code:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` là mã định danh tác nhân mặc định khi không cấu hình danh sách tác nhân cụ thể; nếu không, hãy thay bằng mã định danh tác nhân của bạn.

Nếu Gateway chạy dưới launchd/systemd với `PATH` tối thiểu, hãy chỉ định rõ tệp nhị phân:

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

Nếu bạn dùng một backend CLI đi kèm làm nhà cung cấp thông báo chính trên máy chủ Gateway, OpenClaw sẽ tự động tải Plugin đi kèm sở hữu backend đó khi cấu hình của bạn tham chiếu đến backend trong một tham chiếu mô hình hoặc bên dưới `agents.defaults.cliBackends`.

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

Nếu bạn dùng `agents.defaults.models` làm danh sách cho phép, hãy đưa cả các mô hình backend CLI vào đó. Khi nhà cung cấp chính thất bại (xác thực, giới hạn tốc độ, hết thời gian chờ), OpenClaw sẽ thử backend CLI tiếp theo.

## Cấu hình

Tất cả backend CLI nằm dưới `agents.defaults.cliBackends`, với khóa là mã định danh nhà cung cấp (ví dụ: `claude-cli`, `my-cli`). Mã định danh nhà cung cấp trở thành vế trái của tham chiếu mô hình: `<provider>/<model>`.

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
          // Cờ dành riêng cho tệp lời nhắc:
          // systemPromptFileArg: "--system-file",
          // Hoặc cờ ghi đè cấu hình theo kiểu Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Chỉ chọn dùng nếu backend này có thể khởi tạo lại các phiên đã mất hiệu lực từ
          // lịch sử bản chép lời OpenClaw thô có giới hạn trước khi Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cách hoạt động

1. Chọn một backend theo tiền tố nhà cung cấp (`claude-cli/...`).
2. Tạo lời nhắc hệ thống bằng cùng lời nhắc OpenClaw và ngữ cảnh không gian làm việc.
3. Thực thi CLI với mã định danh phiên (nếu được hỗ trợ) để duy trì lịch sử nhất quán. Backend `claude-cli` đi kèm duy trì một tiến trình stdio Claude hoạt động cho mỗi phiên OpenClaw và gửi các lượt tiếp theo qua stdin stream-json.
4. Phân tích đầu ra (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. Lưu mã định danh phiên theo từng backend để các lượt tiếp theo tái sử dụng cùng phiên CLI.

### Chi tiết riêng của Claude CLI

Backend `claude-cli` đi kèm ưu tiên trình phân giải skill gốc của Claude Code. Khi ảnh chụp nhanh Skills hiện tại có ít nhất một skill được chọn với đường dẫn đã được hiện thực hóa, OpenClaw truyền một Plugin Claude Code tạm thời qua `--plugin-dir` và bỏ qua danh mục Skills OpenClaw trùng lặp khỏi lời nhắc hệ thống được nối thêm. Khi không có skill Plugin đã được hiện thực hóa, OpenClaw giữ lại danh mục lời nhắc làm phương án dự phòng. Các giá trị ghi đè biến môi trường/khóa API của skill vẫn được áp dụng cho môi trường tiến trình con trong lượt chạy.

Claude CLI có chế độ quyền không tương tác riêng; OpenClaw ánh xạ chế độ đó sang chính sách thực thi hiện có thay vì thêm cấu hình riêng cho Claude. Đối với các phiên Claude trực tiếp do OpenClaw quản lý, chính sách thực thi có hiệu lực là nguồn quyết định: YOLO (`tools.exec.security: "full"` và `tools.exec.ask: "off"`) khởi chạy Claude với `--permission-mode bypassPermissions`, còn chính sách hạn chế khởi chạy với `--permission-mode default`. Các thiết lập `agents.list[].tools.exec` theo từng tác nhân ghi đè `tools.exec` toàn cục cho tác nhân đó. Các đối số backend thô vẫn có thể chứa `--permission-mode`, nhưng các lần khởi chạy Claude trực tiếp sẽ chuẩn hóa cờ đó để khớp với chính sách có hiệu lực.

Backend này cũng ánh xạ các mức `/think` của OpenClaw sang cờ `--effort` gốc của Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, còn `high`/`xhigh`/`max` được chuyển tiếp trực tiếp. `adaptive` loại bỏ các cờ `--effort` đã cấu hình và không cung cấp giá trị thay thế, vì vậy Claude Code xác định mức nỗ lực có hiệu lực từ môi trường, thiết lập và giá trị mặc định của mô hình. Các backend CLI khác cần Plugin sở hữu chúng khai báo một trình ánh xạ argv tương đương trước khi `/think` tác động đến CLI được tạo.

Trước khi OpenClaw có thể dùng `claude-cli`, chính Claude Code phải được đăng nhập trên cùng máy chủ:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Các bản cài đặt Docker cần cài đặt và đăng nhập Claude Code bên trong thư mục chính được lưu liên tục của vùng chứa, không chỉ trên máy chủ; xem [Backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).

Chỉ đặt `agents.defaults.cliBackends.claude-cli.command` khi tệp nhị phân `claude` chưa có trong `PATH`.

## Phiên

- Nếu CLI hỗ trợ phiên, hãy đặt `sessionArg` (ví dụ: `--session-id`), hoặc `sessionArgs` (phần giữ chỗ `{sessionId}`) khi mã định danh cần xuất hiện trong nhiều cờ.
- Nếu CLI dùng lệnh con tiếp tục với các cờ khác, hãy đặt `resumeArgs` (thay thế `args` khi tiếp tục) và tùy chọn `resumeOutput` cho các lần tiếp tục không dùng JSON.
- `sessionMode`:
  - `always`: luôn gửi mã định danh phiên (UUID mới nếu chưa lưu mã nào).
  - `existing`: chỉ gửi mã định danh phiên nếu trước đó đã lưu một mã.
  - `none`: không bao giờ gửi mã định danh phiên.
- `claude-cli` mặc định dùng `liveSession: "claude-stdio"`, `output: "jsonl"` và `input: "stdin"`, vì vậy các lượt tiếp theo tái sử dụng tiến trình Claude trực tiếp khi tiến trình vẫn hoạt động, kể cả với cấu hình tùy chỉnh bỏ qua các trường truyền tải. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi thoát, OpenClaw tiếp tục từ mã định danh phiên Claude đã lưu. Mã định danh phiên đã lưu được xác minh dựa trên một bản chép lời dự án có thể đọc trước khi tiếp tục; nếu thiếu bản chép lời, liên kết sẽ bị xóa (được ghi nhật ký là `reason=transcript-missing`) thay vì âm thầm bắt đầu phiên mới dưới `--resume`.
- Các phiên Claude trực tiếp duy trì giới hạn bảo vệ đầu ra JSONL: mặc định là 8 MiB và 20.000 dòng JSONL thô mỗi lượt. Tăng chúng theo từng backend bằng `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` và `maxTurnLines`; OpenClaw giới hạn các thiết lập đó ở mức 64 MiB và 100.000 dòng.
- Các phiên CLI đã lưu là tính liên tục do nhà cung cấp sở hữu. Việc đặt lại phiên ngầm hằng ngày không ngắt chúng; `/reset` và các chính sách `session.reset` rõ ràng vẫn ngắt.
- Các phiên CLI mới thường chỉ khởi tạo lại từ bản tóm tắt Compaction của OpenClaw cộng với phần đuôi sau Compaction. Để khôi phục các phiên ngắn bị mất hiệu lực trước Compaction, backend có thể chọn dùng `reseedFromRawTranscriptWhenUncompacted: true`. Việc khởi tạo lại từ bản chép lời thô vẫn có giới hạn và chỉ áp dụng cho các trường hợp mất hiệu lực an toàn, chẳng hạn như thiếu bản chép lời CLI, phần đuôi sử dụng công cụ bị bỏ rơi, thay đổi chính sách thông báo/lời nhắc hệ thống/cwd/MCP hoặc thử lại do phiên hết hạn; thay đổi hồ sơ xác thực hoặc epoch thông tin xác thực không bao giờ khởi tạo lại lịch sử bản chép lời thô.

Tuần tự hóa: `serialize: true` giữ các lượt chạy trên cùng làn theo đúng thứ tự (hầu hết CLI tuần tự hóa trên một làn nhà cung cấp). OpenClaw cũng ngừng tái sử dụng phiên CLI đã lưu khi danh tính xác thực được chọn thay đổi, bao gồm thay đổi mã định danh hồ sơ xác thực, khóa API tĩnh, mã thông báo tĩnh hoặc danh tính tài khoản OAuth khi CLI công khai danh tính đó; riêng việc xoay vòng mã thông báo truy cập/làm mới OAuth không ngắt phiên. Nếu CLI không có mã định danh tài khoản OAuth ổn định, OpenClaw để CLI đó tự thực thi quyền tiếp tục phiên.

## Phần mở đầu dự phòng từ các phiên claude-cli

Khi một lần thử `claude-cli` chuyển sang ứng viên không phải CLI trong [`agents.defaults.model.fallbacks`](/vi/concepts/model-failover), OpenClaw khởi tạo lần thử tiếp theo bằng phần mở đầu ngữ cảnh thu thập từ bản chép lời JSONL cục bộ của Claude Code (trong `~/.claude/projects/`, được lập khóa theo từng không gian làm việc). Nếu không có dữ liệu khởi tạo này, nhà cung cấp dự phòng sẽ bắt đầu mà không có ngữ cảnh, vì bản chép lời phiên riêng của OpenClaw trống đối với các lượt chạy `claude-cli`.

- Phần mở đầu ưu tiên bản tóm tắt `/compact` hoặc dấu `compact_boundary` mới nhất, sau đó nối thêm các lượt gần đây nhất sau ranh giới trong giới hạn ký tự. Các lượt trước ranh giới bị loại bỏ vì bản tóm tắt đã đại diện cho chúng.
- Các khối công cụ được hợp nhất thành gợi ý ngắn gọn `(tool call: name)` và `(tool result: …)` để duy trì ngân sách lời nhắc chính xác; bản tóm tắt quá lớn sẽ bị cắt bớt và gắn nhãn `(truncated)`.
- Các phương án dự phòng từ `claude-cli` sang `claude-cli` cùng nhà cung cấp dựa vào `--resume` của chính Claude và bỏ qua phần mở đầu.
- Dữ liệu khởi tạo tái sử dụng quy trình xác thực đường dẫn tệp phiên Claude hiện có, nên không thể đọc các đường dẫn tùy ý.

## Hình ảnh

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, hãy đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw ghi hình ảnh base64 vào các tệp tạm thời. Nếu đặt `imageArg`, các đường dẫn đó được truyền dưới dạng đối số CLI; nếu không, OpenClaw nối các đường dẫn tệp vào lời nhắc (chèn đường dẫn), cách này hoạt động với các CLI tự động tải tệp cục bộ từ đường dẫn thuần.

## Đầu vào và đầu ra

- `output: "text"` (mặc định) coi stdout là phản hồi cuối cùng.
- `output: "json"` cố gắng phân tích JSON và trích xuất văn bản cùng mã định danh phiên.
- `output: "jsonl"` phân tích luồng JSONL và trích xuất thông báo cuối cùng của tác nhân cùng các mã định danh phiên khi có.
- Đối với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản phản hồi từ `response` và mức sử dụng từ `stats` khi `usage` bị thiếu hoặc trống. Giá trị mặc định Gemini CLI đi kèm sử dụng `stream-json`; các giá trị ghi đè `--output-format json` cũ vẫn dùng trình phân tích JSON.

Chế độ đầu vào:

- `input: "arg"` (mặc định) truyền lời nhắc làm đối số CLI cuối cùng.
- `input: "stdin"` gửi lời nhắc qua stdin.
- Nếu lời nhắc rất dài và đã đặt `maxPromptArgChars`, stdin sẽ được dùng thay thế.

## Giá trị mặc định do Plugin sở hữu

Các giá trị mặc định của backend CLI là một phần của bề mặt Plugin:

- Các Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- `id` của backend trở thành tiền tố nhà cung cấp trong các tham chiếu mô hình.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè giá trị mặc định của Plugin.
- Việc dọn dẹp cấu hình riêng cho backend vẫn do Plugin sở hữu thông qua hook `normalizeConfig` tùy chọn.

Anthropic sở hữu `claude-cli` và Google sở hữu `google-gemini-cli`. Các lượt chạy tác nhân OpenAI Codex dùng harness app-server Codex thông qua `openai/*`; OpenClaw không còn đăng ký backend `codex-cli` đi kèm.

Plugin Anthropic đi kèm đăng ký cho `claude-cli`:

| Khóa                  | Giá trị                                                                                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                       |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                        |
| `input`               | `stdin`                                                                                                                                                                                                        |
| `modelArg`            | `--model`                                                                                                                                                                                                      |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                 |
| `sessionMode`         | `always`                                                                                                                                                                                                       |
| `imageArg`            | `@`                                                                                                                                                                                                            |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                    |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                  |
| `systemPromptMode`    | `append`                                                                                                                                                                                                       |

Plugin Google đi kèm đăng ký cho `google-gemini-cli`:

| Khóa                      | Giá trị                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | tương tự, kèm `--resume {sessionId}`                                                    |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Điều kiện tiên quyết: Gemini CLI cục bộ phải được cài đặt và có trên `PATH` dưới tên `gemini` (`brew install gemini-cli` hoặc `npm install -g @google/gemini-cli`).

Ghi chú về đầu ra của Gemini CLI:

- Trình phân tích cú pháp `stream-json` mặc định đọc các sự kiện `message` của trợ lý, sự kiện công cụ, mức sử dụng trong `result` cuối cùng và các sự kiện lỗi Gemini nghiêm trọng.
- Nếu bạn ghi đè các đối số Gemini thành `--output-format json`, OpenClaw sẽ chuẩn hóa phần phụ trợ đó trở lại `output: "json"` và đọc văn bản phản hồi từ trường `response` trong JSON.
- Mức sử dụng sẽ dùng `stats` làm phương án dự phòng khi `usage` không tồn tại hoặc trống; `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw, và nếu thiếu `stats.input`, số token đầu vào được suy ra từ `stats.input_tokens - stats.cached`.

Chỉ ghi đè các giá trị mặc định khi cần thiết (phổ biến nhất là đường dẫn `command` tuyệt đối).

## Lớp phủ chuyển đổi văn bản

Các Plugin cần lớp đệm tương thích nhỏ cho lời nhắc/tin nhắn có thể khai báo các phép chuyển đổi văn bản hai chiều mà không cần thay thế nhà cung cấp hoặc phần phụ trợ CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` ghi lại lời nhắc hệ thống và lời nhắc người dùng được truyền cho CLI. `output` ghi lại văn bản trợ lý được truyền trực tuyến và văn bản cuối cùng đã phân tích trước khi OpenClaw xử lý các dấu điều khiển và phân phối qua kênh của riêng mình; đối với các lệnh gọi mô hình dựa trên nhà cung cấp, nó cũng khôi phục các giá trị chuỗi bên trong đối số lệnh gọi công cụ có cấu trúc sau khi sửa luồng và trước khi thực thi công cụ. Các phân đoạn JSON thô của nhà cung cấp được giữ nguyên; bên sử dụng nên dùng tải trọng có cấu trúc dạng từng phần, kết thúc hoặc kết quả.

Đối với các CLI phát ra sự kiện JSONL dành riêng cho nhà cung cấp, hãy đặt `jsonlDialect` trong cấu hình của phần phụ trợ đó: `claude-stream-json` cho các luồng tương thích với Claude Code, `gemini-stream-json` cho các sự kiện `stream-json` của Gemini CLI.

## Quyền sở hữu Compaction gốc

Một số phần phụ trợ CLI chạy một tác tử tự Compaction bản ghi hội thoại của mình, vì vậy OpenClaw không được chạy trình tóm tắt bảo vệ đối với chúng — làm như vậy sẽ xung đột với cơ chế Compaction riêng của phần phụ trợ và có thể khiến lượt xử lý thất bại hoàn toàn.

`claude-cli` không có điểm cuối bộ điều khiển (Claude Code tự Compaction nội bộ), vì vậy nó khai báo `ownsNativeCompaction: true` và đường dẫn Compaction của OpenClaw trả về mục phiên mà không thay đổi. Thay vào đó, các phiên có bộ điều khiển gốc như Codex tiếp tục được định tuyến đến điểm cuối Compaction của bộ điều khiển tương ứng.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Chỉ khai báo `ownsNativeCompaction` cho phần phụ trợ thực sự sở hữu Compaction: nó phải giới hạn đáng tin cậy bản ghi hội thoại của chính mình gần cửa sổ ngữ cảnh và lưu giữ một phiên có thể tiếp tục (ví dụ: `--resume` / `--session-id`), nếu không một phiên bị trì hoãn có thể vẫn vượt quá ngân sách.

## Lớp phủ MCP đi kèm

Các phần phụ trợ CLI không nhận trực tiếp lệnh gọi công cụ OpenClaw, nhưng một phần phụ trợ có thể chọn tham gia lớp phủ cấu hình MCP được tạo bằng `bundleMcp: true`. Hành vi đi kèm hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo.
- `google-gemini-cli`: tệp cài đặt hệ thống Gemini được tạo.

Khi MCP đi kèm được bật, OpenClaw:

- khởi tạo một máy chủ MCP HTTP local loopback để cung cấp các công cụ Gateway cho tiến trình CLI, được xác thực bằng quyền cấp ngữ cảnh riêng cho mỗi lần chạy (`OPENCLAW_MCP_TOKEN`) chỉ hoạt động trong lần thực thi hiện tại;
- ràng buộc quyền truy cập công cụ với ngữ cảnh phiên, tài khoản và kênh do Gateway chọn thay vì tin cậy các tiêu đề của tiến trình con;
- tải các máy chủ MCP đi kèm đã bật cho không gian làm việc hiện tại và hợp nhất chúng với mọi cấu hình/cấu trúc cài đặt MCP hiện có của phần phụ trợ;
- ghi lại cấu hình khởi chạy bằng chế độ tích hợp do phần phụ trợ sở hữu từ Plugin chủ quản.

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn chèn một cấu hình nghiêm ngặt khi phần phụ trợ chọn tham gia MCP đi kèm, để các lần chạy nền luôn được cách ly.

Các môi trường chạy MCP đi kèm theo phạm vi phiên được lưu vào bộ nhớ đệm để tái sử dụng trong một phiên, sau đó được thu hồi sau `mcp.sessionIdleTtlMs` mili giây không hoạt động (mặc định 10 phút; đặt `0` để vô hiệu hóa). Các lần chạy nhúng một lần như thăm dò xác thực, tạo slug và truy hồi active-memory yêu cầu dọn dẹp khi kết thúc lần chạy để các tiến trình con stdio và luồng HTTP/SSE có thể truyền trực tuyến không tồn tại lâu hơn lần chạy.

## Giới hạn lịch sử khởi tạo lại

Khi một phiên CLI mới được khởi tạo từ bản ghi hội thoại OpenClaw trước đó (ví dụ: sau khi thử lại do `session_expired`), khối `<conversation_history>` được kết xuất sẽ bị giới hạn để tránh lời nhắc khởi tạo lại phình to. Mặc định là 12.288 ký tự (khoảng 3.000 token).

Thay vào đó, các phần phụ trợ Claude CLI điều chỉnh giới hạn này theo cửa sổ ngữ cảnh Claude đã phân giải: cửa sổ ngữ cảnh lớn hơn nhận được phần lịch sử trước đó lớn hơn, tối đa đến một mức trần cố định; các phần phụ trợ CLI khác giữ nguyên giá trị mặc định thận trọng. Giới hạn này chỉ chi phối khối lịch sử trước đó của lời nhắc khởi tạo lại — giới hạn đầu ra của phiên đang hoạt động được tinh chỉnh riêng trong `reliability.outputLimits` (xem [Phiên](#sessions)).

## Hạn chế

- Không có lệnh gọi công cụ OpenClaw trực tiếp: OpenClaw không chèn lệnh gọi công cụ vào giao thức phần phụ trợ CLI. Các phần phụ trợ chỉ thấy công cụ Gateway khi chọn tham gia `bundleMcp: true`.
- Truyền trực tuyến phụ thuộc vào phần phụ trợ: một số phần phụ trợ truyền trực tuyến JSONL, số khác lưu vào bộ đệm cho đến khi thoát.
- Đầu ra có cấu trúc phụ thuộc vào định dạng JSON riêng của CLI.

## Khắc phục sự cố

| Triệu chứng                    | Cách khắc phục                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Không tìm thấy CLI             | Đặt `command` thành đường dẫn đầy đủ.                                            |
| Tên mô hình không đúng         | Dùng `modelAliases` để ánh xạ `provider/model` sang mã mô hình của CLI.          |
| Không duy trì liên tục phiên   | Đảm bảo `sessionArg` được đặt và `sessionMode` không phải là `none`.             |
| Hình ảnh bị bỏ qua             | Đặt `imageArg` và xác minh rằng CLI hỗ trợ đường dẫn tệp.                        |

## Liên quan

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Mô hình cục bộ](/vi/gateway/local-models)
