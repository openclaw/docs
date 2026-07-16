---
read_when:
    - Bạn muốn có một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp sự cố
    - Bạn đang chạy các CLI AI cục bộ và muốn tái sử dụng chúng
    - Bạn muốn tìm hiểu cầu nối loopback MCP để truy cập công cụ backend CLI
summary: 'Backend CLI: phương án dự phòng CLI AI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các backend CLI
x-i18n:
    generated_at: "2026-07-16T14:23:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy một AI CLI cục bộ làm phương án dự phòng chỉ dùng văn bản khi các nhà cung cấp API ngừng hoạt động, bị giới hạn tốc độ hoặc hoạt động không đúng. Cơ chế này được thiết kế thận trọng:

- Các công cụ OpenClaw không được đưa trực tiếp vào, nhưng một backend có `bundleMcp: true` có thể nhận các công cụ Gateway thông qua cầu nối MCP loopback.
- Phát trực tuyến JSONL cho các CLI hỗ trợ tính năng này.
- Có hỗ trợ phiên, vì vậy các lượt tiếp theo vẫn nhất quán.
- Hình ảnh được chuyển tiếp nếu CLI chấp nhận đường dẫn hình ảnh.

Hãy dùng cơ chế này như một mạng lưới an toàn cho các phản hồi văn bản "luôn hoạt động", không phải luồng chính. Để có runtime harness đầy đủ với các điều khiển phiên ACP, tác vụ nền, liên kết luồng/cuộc trò chuyện và các phiên lập trình bên ngoài lâu dài, hãy dùng [Tác nhân ACP](/vi/tools/acp-agents); các backend CLI không phải là ACP.

<Tip>
  Đang xây dựng một Plugin backend mới? Xem [Plugin backend CLI](/vi/plugins/cli-backend-plugins). Trang này trình bày cách cấu hình và vận hành một backend đã được đăng ký.
</Tip>

## Bắt đầu nhanh

Plugin Anthropic đi kèm đăng ký một backend `claude-cli` mặc định, vì vậy backend này hoạt động mà không cần cấu hình ngoài việc đã cài đặt và đăng nhập Claude Code:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` là id tác nhân mặc định khi không cấu hình danh sách tác nhân rõ ràng; nếu có, hãy thay bằng id tác nhân của riêng bạn.

Nếu Gateway chạy dưới launchd/systemd với `PATH` tối thiểu, hãy trỏ rõ ràng đến tệp nhị phân:

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

Nếu bạn dùng một backend CLI đi kèm làm nhà cung cấp thông báo chính trên máy chủ Gateway, OpenClaw sẽ tự động tải Plugin đi kèm sở hữu backend đó khi cấu hình tham chiếu đến backend trong tham chiếu mô hình hoặc dưới `agents.defaults.cliBackends`.

## Dùng làm phương án dự phòng

Thêm backend CLI vào danh sách dự phòng để nó chỉ chạy khi các mô hình chính gặp lỗi:

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

Nếu dùng `agents.defaults.models` làm danh sách cho phép, hãy thêm cả các mô hình backend CLI của bạn vào đó. Khi nhà cung cấp chính gặp lỗi (xác thực, giới hạn tốc độ, hết thời gian chờ), OpenClaw sẽ thử backend CLI tiếp theo.

## Cấu hình

Tất cả backend CLI nằm dưới `agents.defaults.cliBackends`, được định danh bằng id nhà cung cấp (ví dụ: `claude-cli`, `my-cli`). Id nhà cung cấp trở thành vế trái của tham chiếu mô hình: `<provider>/<model>`.

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
          // Hoặc cờ ghi đè cấu hình kiểu Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Chỉ chọn tham gia nếu backend này có thể khởi tạo lại các phiên đã mất hiệu lực từ
          // lịch sử bản chép lời OpenClaw thô có giới hạn trước Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cách hoạt động

1. Chọn backend theo tiền tố nhà cung cấp (`claude-cli/...`).
2. Tạo lời nhắc hệ thống bằng cùng lời nhắc OpenClaw và ngữ cảnh không gian làm việc.
3. Thực thi CLI với id phiên (nếu được hỗ trợ) để lịch sử luôn nhất quán. Backend `claude-cli` đi kèm duy trì một tiến trình stdio Claude hoạt động cho mỗi phiên OpenClaw và gửi các lượt tiếp theo qua stdin stream-json.
4. Phân tích đầu ra (JSON hoặc văn bản thuần túy) và trả về văn bản cuối cùng.
5. Lưu bền vững id phiên theo từng backend để các lượt tiếp theo tái sử dụng cùng phiên CLI.

### Chi tiết riêng của Claude CLI

Backend `claude-cli` đi kèm ưu tiên trình phân giải Skills gốc của Claude Code. Khi ảnh chụp nhanh Skills hiện tại có ít nhất một Skill được chọn với đường dẫn đã hiện thực hóa, OpenClaw chuyển một Plugin Claude Code tạm thời qua `--plugin-dir` và bỏ danh mục Skills OpenClaw trùng lặp khỏi phần lời nhắc hệ thống được nối thêm. Nếu không có Skill Plugin đã hiện thực hóa, OpenClaw giữ danh mục lời nhắc làm phương án dự phòng. Các giá trị ghi đè biến môi trường/khóa API của Skill vẫn áp dụng cho môi trường tiến trình con trong lần chạy.

Claude CLI có chế độ quyền không tương tác riêng; OpenClaw ánh xạ chế độ đó vào chính sách thực thi hiện có thay vì thêm cấu hình riêng cho Claude. Đối với các phiên Claude trực tiếp do OpenClaw quản lý, chính sách thực thi có hiệu lực là nguồn có thẩm quyền: YOLO (`tools.exec.security: "full"` và `tools.exec.ask: "off"`) thường khởi chạy Claude với `--permission-mode bypassPermissions`, còn chính sách hạn chế sẽ khởi chạy với `--permission-mode default`. Gateway chạy bằng root cũng dùng `default` vì Claude Code từ chối chế độ bỏ qua đối với root; OpenClaw vẫn phản hồi các yêu cầu điều khiển công cụ stdio của Claude theo chính sách thực thi đã cấu hình. Các thiết lập `agents.list[].tools.exec` theo từng tác nhân ghi đè `tools.exec` toàn cục cho tác nhân đó. Các đối số backend thô vẫn có thể chứa `--permission-mode`, nhưng các lần khởi chạy Claude trực tiếp sẽ chuẩn hóa cờ đó để khớp với chính sách có hiệu lực và giới hạn của máy chủ.

Backend cũng ánh xạ các cấp `/think` của OpenClaw sang cờ `--effort` gốc của Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, còn `high`/`xhigh`/`max` được chuyển qua trực tiếp. Điều này giữ nguyên các cấp độ nỗ lực Fable 5 được hỗ trợ cho Claude CLI dựa trên gói đăng ký và các luồng dùng khóa API. `adaptive` loại bỏ các cờ `--effort` đã cấu hình và không cung cấp giá trị thay thế, vì vậy Claude Code tự xác định mức nỗ lực có hiệu lực từ môi trường, thiết lập và giá trị mặc định của mô hình. Các backend CLI khác cần Plugin sở hữu chúng khai báo trình ánh xạ argv tương đương trước khi `/think` tác động đến CLI được tạo.

Trước khi OpenClaw có thể dùng `claude-cli`, bản thân Claude Code phải được đăng nhập trên cùng máy chủ:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Các bản cài đặt Docker cần cài đặt và đăng nhập Claude Code bên trong thư mục home được lưu bền vững của container, không chỉ trên máy chủ; xem [Backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).

Chỉ đặt `agents.defaults.cliBackends.claude-cli.command` khi tệp nhị phân `claude` chưa có trên `PATH`.

## Phiên

- Nếu CLI hỗ trợ phiên, hãy đặt `sessionArg` (ví dụ: `--session-id`), hoặc `sessionArgs` (phần giữ chỗ `{sessionId}`) khi id cần xuất hiện trong nhiều cờ.
- Nếu CLI dùng lệnh con tiếp tục với các cờ khác, hãy đặt `resumeArgs` (thay thế `args` khi tiếp tục) và có thể đặt `resumeOutput` cho các lần tiếp tục không dùng JSON.
- `sessionMode`:
  - `always`: luôn gửi id phiên (UUID mới nếu chưa lưu id nào).
  - `existing`: chỉ gửi id phiên nếu trước đó đã lưu một id.
  - `none`: không bao giờ gửi id phiên.
- `claude-cli` mặc định là `liveSession: "claude-stdio"`, `output: "jsonl"` và `input: "stdin"`, vì vậy các lượt tiếp theo tái sử dụng tiến trình Claude trực tiếp khi tiến trình đó còn hoạt động, kể cả với cấu hình tùy chỉnh không có các trường truyền tải. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi thoát, OpenClaw tiếp tục từ id phiên Claude đã lưu. Id phiên đã lưu được xác minh dựa trên một bản chép lời dự án có thể đọc trước khi tiếp tục; nếu thiếu bản chép lời, liên kết sẽ bị xóa (được ghi nhật ký là `reason=transcript-missing`) thay vì âm thầm bắt đầu phiên mới dưới `--resume`.
- Các phiên Claude trực tiếp duy trì giới hạn bảo vệ đầu ra JSONL: mặc định là 8 MiB và 20,000 dòng JSONL thô cho mỗi lượt. Tăng giới hạn theo từng backend bằng `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` và `maxTurnLines`; OpenClaw giới hạn các thiết lập đó ở mức 64 MiB và 100,000 dòng.
- Các phiên CLI đã lưu là tính liên tục thuộc sở hữu của nhà cung cấp. Việc đặt lại phiên ngầm định hằng ngày không ngắt chúng; các chính sách `/reset` và `session.reset` rõ ràng vẫn ngắt.
- Các phiên CLI mới thường chỉ được khởi tạo lại từ bản tóm tắt Compaction của OpenClaw cùng phần đuôi sau Compaction. Để khôi phục các phiên ngắn bị mất hiệu lực trước Compaction, backend có thể chọn tham gia bằng `reseedFromRawTranscriptWhenUncompacted: true`. Việc khởi tạo lại từ bản chép lời thô vẫn có giới hạn và chỉ áp dụng cho các trường hợp mất hiệu lực an toàn, chẳng hạn như thiếu bản chép lời CLI, phần đuôi sử dụng công cụ mồ côi, thay đổi chính sách thông báo/lời nhắc hệ thống/cwd/MCP hoặc thử lại sau khi phiên hết hạn; thay đổi hồ sơ xác thực hoặc kỷ nguyên thông tin xác thực không bao giờ khởi tạo lại từ lịch sử bản chép lời thô.

Tuần tự hóa: `serialize: true` giữ thứ tự các lần chạy trong cùng một luồng (hầu hết CLI tuần tự hóa trên một luồng nhà cung cấp). OpenClaw cũng ngừng tái sử dụng phiên CLI đã lưu khi danh tính xác thực được chọn thay đổi, bao gồm thay đổi id hồ sơ xác thực, khóa API tĩnh, token tĩnh hoặc danh tính tài khoản OAuth khi CLI cung cấp danh tính đó; việc luân chuyển token truy cập/làm mới OAuth riêng lẻ không ngắt phiên. Nếu CLI không có id tài khoản OAuth ổn định, OpenClaw để CLI đó tự thực thi các quyền tiếp tục của mình.

## Phần mở đầu dự phòng từ các phiên claude-cli

Khi một lần thử `claude-cli` chuyển sang ứng viên không phải CLI trong [`agents.defaults.model.fallbacks`](/vi/concepts/model-failover) sau khi thất bại, OpenClaw khởi tạo lần thử tiếp theo bằng phần mở đầu ngữ cảnh thu thập từ bản chép lời JSONL cục bộ của Claude Code (dưới `~/.claude/projects/`, được định danh theo từng không gian làm việc). Nếu không có dữ liệu khởi tạo này, nhà cung cấp dự phòng sẽ bắt đầu mà không có ngữ cảnh vì bản chép lời phiên của OpenClaw trống đối với các lần chạy `claude-cli`.

- Phần mở đầu ưu tiên bản tóm tắt `/compact` hoặc dấu mốc `compact_boundary` mới nhất, sau đó nối thêm các lượt gần đây nhất sau ranh giới đến giới hạn ký tự. Các lượt trước ranh giới bị loại bỏ vì bản tóm tắt đã đại diện cho chúng.
- Các khối công cụ được gộp thành gợi ý `(tool call: name)` và `(tool result: …)` ngắn gọn để phản ánh trung thực dung lượng lời nhắc; bản tóm tắt quá lớn sẽ bị cắt bớt và gắn nhãn `(truncated)`.
- Các phương án dự phòng cùng nhà cung cấp từ `claude-cli` sang `claude-cli` dựa vào `--resume` của chính Claude và bỏ qua phần mở đầu.
- Dữ liệu khởi tạo tái sử dụng quy trình xác thực đường dẫn tệp phiên Claude hiện có, vì vậy không thể đọc các đường dẫn tùy ý.

## Hình ảnh

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, hãy đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw ghi hình ảnh base64 vào các tệp tạm thời. Nếu đặt `imageArg`, các đường dẫn đó được truyền dưới dạng đối số CLI; nếu không, OpenClaw nối các đường dẫn tệp vào lời nhắc (chèn đường dẫn), cách này hoạt động với các CLI tự động tải tệp cục bộ từ đường dẫn thuần túy.

## Đầu vào và đầu ra

- `output: "text"` (mặc định) xem stdout là phản hồi cuối cùng.
- `output: "json"` cố gắng phân tích JSON và trích xuất văn bản cùng id phiên.
- `output: "jsonl"` phân tích luồng JSONL và trích xuất thông báo cuối cùng của tác nhân cùng các mã định danh phiên nếu có.
- Đối với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản phản hồi từ `response` và mức sử dụng từ `stats` khi `usage` bị thiếu hoặc trống. Mặc định Gemini CLI đi kèm dùng `stream-json`; các giá trị ghi đè `--output-format json` cũ vẫn dùng trình phân tích JSON.

Chế độ đầu vào:

- `input: "arg"` (mặc định) truyền prompt dưới dạng đối số CLI cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được sử dụng thay thế.

## Giá trị mặc định do Plugin sở hữu

Các giá trị mặc định của backend CLI là một phần của bề mặt Plugin:

- Các Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- `id` của backend trở thành tiền tố nhà cung cấp trong các tham chiếu mô hình.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè giá trị mặc định của Plugin.
- Việc dọn dẹp cấu hình dành riêng cho backend vẫn thuộc quyền sở hữu của Plugin thông qua hook `normalizeConfig` tùy chọn.

Anthropic sở hữu `claude-cli` và Google sở hữu `google-gemini-cli`. Các lượt chạy tác nhân OpenAI Codex sử dụng bộ khung app-server của Codex thông qua `openai/*`; OpenClaw không còn đăng ký backend `codex-cli` đi kèm.

Plugin Anthropic đi kèm đăng ký cho `claude-cli`:

| Khóa                   | Giá trị                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

Plugin Google đi kèm đăng ký cho `google-gemini-cli`:

| Khóa                       | Giá trị                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | tương tự, với `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Điều kiện tiên quyết: Gemini CLI cục bộ phải được cài đặt và có trên `PATH` dưới tên `gemini` (`brew install gemini-cli` hoặc `npm install -g @google/gemini-cli`).

Lưu ý về đầu ra của Gemini CLI:

- Trình phân tích `stream-json` mặc định đọc các sự kiện `message` của trợ lý, sự kiện công cụ, mức sử dụng `result` cuối cùng và các sự kiện lỗi Gemini nghiêm trọng.
- Nếu bạn ghi đè các đối số Gemini thành `--output-format json`, OpenClaw sẽ chuẩn hóa backend đó trở lại `output: "json"` và đọc văn bản phản hồi từ trường JSON `response`.
- Mức sử dụng sẽ dự phòng về `stats` khi `usage` không có hoặc rỗng; `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw, và nếu thiếu `stats.input`, số token đầu vào được suy ra từ `stats.input_tokens - stats.cached`.

Chỉ ghi đè các giá trị mặc định khi cần thiết (phổ biến nhất là đường dẫn `command` tuyệt đối).

## Lớp phủ biến đổi văn bản

Các Plugin cần shim tương thích nhỏ cho prompt/tin nhắn có thể khai báo các phép biến đổi văn bản hai chiều mà không cần thay thế nhà cung cấp hoặc backend CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` viết lại prompt hệ thống và prompt người dùng được truyền cho CLI. `output` viết lại văn bản trợ lý được truyền phát và văn bản cuối cùng đã phân tích trước khi OpenClaw xử lý các dấu điều khiển và việc phân phối qua kênh của riêng mình; đối với các lệnh gọi mô hình dựa trên nhà cung cấp, nó cũng khôi phục các giá trị chuỗi bên trong đối số lời gọi công cụ có cấu trúc sau khi sửa luồng và trước khi thực thi công cụ. Các mảnh JSON thô từ nhà cung cấp được giữ nguyên; bên sử dụng nên dùng tải trọng từng phần, kết thúc hoặc kết quả có cấu trúc.

Đối với các CLI phát ra sự kiện JSONL dành riêng cho nhà cung cấp, hãy đặt `jsonlDialect` trong cấu hình của backend đó: `claude-stream-json` cho các luồng tương thích với Claude Code, `gemini-stream-json` cho các sự kiện `stream-json` của Gemini CLI.

## Quyền sở hữu Compaction gốc

Một số backend CLI chạy tác nhân tự Compaction bản ghi của chính nó, vì vậy OpenClaw không được chạy trình tóm tắt bảo vệ trên các backend đó — làm vậy sẽ xung đột với Compaction riêng của backend và có thể khiến lượt chạy thất bại hoàn toàn.

`claude-cli` không có điểm cuối bộ khung (Claude Code Compaction nội bộ), vì vậy nó khai báo `ownsNativeCompaction: true` và đường dẫn Compaction của OpenClaw trả về mục phiên mà không thay đổi. OpenClaw truyền ngân sách ngữ cảnh hiệu dụng của lượt chạy qua [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) được Claude Code ghi nhận, giúp Compaction tự động gốc luôn phù hợp với các giới hạn `contextTokens` của Anthropic đã cấu hình. Thay vào đó, các phiên dùng bộ khung gốc như Codex vẫn được định tuyến đến điểm cuối Compaction của bộ khung.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Chỉ khai báo `ownsNativeCompaction` cho backend thực sự sở hữu Compaction: backend đó phải giới hạn đáng tin cậy bản ghi của chính mình gần cửa sổ ngữ cảnh và lưu bền vững một phiên có thể tiếp tục (ví dụ: `--resume` / `--session-id`), nếu không một phiên bị hoãn có thể vẫn vượt ngân sách.

## Lớp phủ MCP đi kèm

Các backend CLI không nhận trực tiếp lời gọi công cụ OpenClaw, nhưng backend có thể chọn sử dụng lớp phủ cấu hình MCP được tạo bằng `bundleMcp: true`. Hành vi đi kèm hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo.
- `google-gemini-cli`: tệp cài đặt hệ thống Gemini được tạo.

Khi MCP đi kèm được bật, OpenClaw:

- khởi chạy máy chủ MCP HTTP loopback cung cấp các công cụ Gateway cho tiến trình CLI, được xác thực bằng quyền cấp ngữ cảnh theo từng lượt chạy (`OPENCLAW_MCP_TOKEN`) chỉ hoạt động cho lần thử thực thi hiện tại;
- ràng buộc quyền truy cập công cụ với ngữ cảnh phiên, tài khoản và kênh do Gateway chọn thay vì tin tưởng các header của tiến trình con;
- tải các máy chủ MCP đi kèm đã bật cho không gian làm việc hiện tại và hợp nhất chúng với mọi dạng cấu hình/cài đặt MCP hiện có của backend;
- viết lại cấu hình khởi chạy bằng chế độ tích hợp do backend sở hữu từ Plugin chủ quản.

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn chèn cấu hình nghiêm ngặt khi backend chọn sử dụng MCP đi kèm, để các lượt chạy nền luôn được cô lập.

Các runtime MCP đi kèm theo phạm vi phiên được lưu đệm để tái sử dụng trong một phiên, sau đó bị thu hồi sau `mcp.sessionIdleTtlMs` mili giây không hoạt động (mặc định 10 phút; đặt `0` để tắt). Các lượt chạy nhúng một lần như thăm dò xác thực, tạo slug và truy hồi Active Memory yêu cầu dọn dẹp khi lượt chạy kết thúc để các tiến trình con stdio và luồng Streamable HTTP/SSE không tồn tại lâu hơn lượt chạy.

## Giới hạn lịch sử tái khởi tạo

Khi một phiên CLI mới được khởi tạo từ bản ghi OpenClaw trước đó (ví dụ sau lần thử lại `session_expired`), khối `<conversation_history>` được kết xuất sẽ bị giới hạn để tránh prompt tái khởi tạo phình to. Mặc định là 12,288 ký tự (khoảng 3,000 token).

Các backend Claude CLI thay vào đó điều chỉnh giới hạn này theo cửa sổ ngữ cảnh Claude đã phân giải: cửa sổ ngữ cảnh lớn hơn nhận được phần lịch sử trước đó lớn hơn, tối đa đến một mức trần cố định; các backend CLI khác giữ nguyên giá trị mặc định thận trọng. Giới hạn này chỉ điều chỉnh khối lịch sử trước đó của prompt tái khởi tạo — giới hạn đầu ra của phiên trực tiếp được tinh chỉnh riêng trong `reliability.outputLimits` (xem [Phiên](#sessions)).

## Hạn chế

- Không có lời gọi công cụ OpenClaw trực tiếp: OpenClaw không chèn lời gọi công cụ vào giao thức backend CLI. Các backend chỉ thấy công cụ Gateway khi chọn sử dụng `bundleMcp: true`.
- Việc truyền phát phụ thuộc vào backend: một số backend truyền phát JSONL, số khác lưu đệm cho đến khi thoát.
- Đầu ra có cấu trúc phụ thuộc vào định dạng JSON riêng của CLI.

## Khắc phục sự cố

| Triệu chứng               | Cách khắc phục                                                               |
| --------------------- | ----------------------------------------------------------------- |
| Không tìm thấy CLI         | Đặt `command` thành đường dẫn đầy đủ.                                     |
| Sai tên mô hình      | Dùng `modelAliases` để ánh xạ `provider/model` sang id mô hình của CLI. |
| Không duy trì tính liên tục của phiên | Đảm bảo `sessionArg` được đặt và `sessionMode` không phải là `none`.       |
| Hình ảnh bị bỏ qua        | Đặt `imageArg` và xác minh CLI hỗ trợ đường dẫn tệp.            |

## Liên quan

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Mô hình cục bộ](/vi/gateway/local-models)
