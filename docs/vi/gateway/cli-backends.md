---
read_when:
    - Bạn muốn có một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp sự cố
    - Bạn đang chạy các CLI AI cục bộ và muốn tái sử dụng chúng
    - Bạn muốn tìm hiểu cầu nối loopback MCP để truy cập công cụ backend CLI
summary: 'Backend CLI: phương án dự phòng dùng CLI AI cục bộ với cầu nối công cụ MCP tùy chọn'
title: Các backend CLI
x-i18n:
    generated_at: "2026-07-20T04:37:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d71300fa7383b021ee12bdeafedfc48cb9f0d7746a02efff5e609544c7b4b081
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw có thể chạy một CLI AI cục bộ làm phương án dự phòng chỉ có văn bản khi các nhà cung cấp API ngừng hoạt động, bị giới hạn tốc độ hoặc hoạt động không đúng. Cơ chế này được thiết kế thận trọng:

- Các công cụ OpenClaw không được chèn trực tiếp, nhưng một backend có `bundleMcp: true` có thể nhận các công cụ Gateway thông qua cầu nối MCP loopback.
- Truyền trực tuyến JSONL cho các CLI hỗ trợ định dạng này.
- Có hỗ trợ phiên, vì vậy các lượt tiếp theo vẫn duy trì được tính nhất quán.
- Hình ảnh được chuyển tiếp nếu CLI chấp nhận đường dẫn hình ảnh.

Hãy dùng cơ chế này làm mạng lưới an toàn cho các phản hồi văn bản "luôn hoạt động", không phải làm đường dẫn chính. Đối với một runtime harness đầy đủ có các điều khiển phiên ACP, tác vụ nền, liên kết luồng/cuộc hội thoại và các phiên lập trình bên ngoài bền vững, hãy dùng [ACP Agents](/vi/tools/acp-agents); các backend CLI không phải là ACP.

<Tip>
  Bạn đang xây dựng một plugin backend mới? Xem [Plugin backend CLI](/vi/plugins/cli-backend-plugins). Trang này trình bày cách cấu hình và vận hành một backend đã được đăng ký.
</Tip>

## Bắt đầu nhanh

Plugin Anthropic đi kèm đăng ký một backend `claude-cli` mặc định, vì vậy backend này hoạt động mà không cần cấu hình ngoài việc đã cài đặt và đăng nhập Claude Code:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` là mã định danh tác nhân mặc định khi không cấu hình danh sách tác nhân rõ ràng; nếu không, hãy thay bằng mã định danh tác nhân của bạn.

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

Nếu bạn dùng một backend CLI đi kèm làm nhà cung cấp thông báo chính trên máy chủ Gateway, OpenClaw sẽ tự động tải plugin đi kèm sở hữu backend đó khi cấu hình của bạn tham chiếu backend trong một tham chiếu mô hình hoặc dưới `agents.defaults.cliBackends`.

## Sử dụng làm phương án dự phòng

Thêm backend CLI vào danh sách dự phòng để backend này chỉ chạy khi các mô hình chính thất bại:

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

Các phương án dự phòng đã cấu hình vẫn đủ điều kiện khi nhà cung cấp chính thất bại (xác thực, giới hạn tốc độ, hết thời gian chờ), ngay cả khi chúng không nằm trong `agents.defaults.modelPolicy.allow`. Chỉ thêm mô hình backend CLI vào chính sách đó khi người dùng cũng cần có khả năng chọn trực tiếp mô hình này thông qua `/model`, ghi đè phiên hoặc `--model`. `agents.defaults.models` chỉ quản lý bí danh, tham số và siêu dữ liệu theo từng mô hình.

## Cấu hình

Tất cả backend CLI nằm dưới `agents.defaults.cliBackends`, được định danh bằng mã nhà cung cấp (ví dụ: `claude-cli`, `my-cli`). Mã nhà cung cấp trở thành phần bên trái của tham chiếu mô hình: `<provider>/<model>`.

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
          // Chỉ bật nếu backend này có thể gieo lại các phiên đã mất hiệu lực từ
          // lịch sử bản chép lời OpenClaw thô có giới hạn trước khi Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cách thức hoạt động

1. Chọn một backend theo tiền tố nhà cung cấp (`claude-cli/...`).
2. Tạo lời nhắc hệ thống bằng cùng lời nhắc OpenClaw và ngữ cảnh không gian làm việc.
3. Thực thi CLI với mã phiên (nếu được hỗ trợ) để duy trì tính nhất quán của lịch sử. Backend `claude-cli` đi kèm duy trì một tiến trình stdio Claude hoạt động cho mỗi phiên OpenClaw và gửi các lượt tiếp theo qua stdin stream-json.
4. Phân tích đầu ra (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. Duy trì mã phiên theo từng backend để các lượt tiếp theo tái sử dụng cùng một phiên CLI.

## Thời gian chờ và công việc chạy dài

Các backend CLI có hai giới hạn độc lập:

- `agents.defaults.timeoutSeconds` giới hạn toàn bộ lượt tác nhân. Các lượt Gateway thông thường kế thừa giá trị mặc định 48 giờ; `0` đặt ngân sách lượt thành không giới hạn. Một giá trị ghi đè đã lưu, chẳng hạn `600`, sẽ thay thế giá trị mặc định đó.
- Bộ giám sát không có đầu ra của CLI dừng một tiến trình con nếu tiến trình đó liên tục im lặng. Bộ giám sát sử dụng các hồ sơ mới/tiếp tục riêng biệt dưới `agents.defaults.cliBackends.<id>.reliability.watchdog` và vẫn hoạt động ngay cả khi ngân sách tổng thể của lượt là không giới hạn.

Xóa giá trị ghi đè thời gian chờ tổng thể ngắn để quay lại giá trị mặc định 48 giờ, hoặc đặt một ngân sách rõ ràng, chẳng hạn 12 giờ:

```bash
# Quay lại giá trị mặc định 48 giờ:
openclaw config unset agents.defaults.timeoutSeconds

# Hoặc chọn giới hạn rõ ràng là 12 giờ:
openclaw config set agents.defaults.timeoutSeconds 43200
```

Công việc nền được bắt đầu bên trong CLI vẫn là một phần của tiến trình con CLI đó. Nếu lượt cha đạt giới hạn tổng thể, OpenClaw sẽ dừng đồng thời tiến trình con và các tác vụ nền nội bộ của CLI. Đối với công việc dài cần duy trì bền vững, hãy dùng một [tác nhân con](/vi/tools/subagents) OpenClaw tách rời hoặc [tác nhân ACP](/vi/tools/acp-agents); tác nhân con tách rời mặc định không có thời gian chờ chạy.

Lệnh `openclaw agent` cũng có thời hạn yêu cầu riêng. Giá trị dự phòng mặc định 600 giây của lệnh này áp dụng cho lần gọi lệnh đó, không áp dụng cho các lượt Gateway thông thường; xem [`openclaw agent`](/vi/cli/agent).

### Chi tiết riêng của Claude CLI

Backend `claude-cli` đi kèm ưu tiên trình phân giải kỹ năng gốc của Claude Code. Khi ảnh chụp nhanh kỹ năng hiện tại có ít nhất một kỹ năng được chọn với đường dẫn đã hiện thực hóa, OpenClaw chuyển một plugin Claude Code tạm thời qua `--plugin-dir` và bỏ danh mục kỹ năng OpenClaw trùng lặp khỏi lời nhắc hệ thống được nối thêm. Khi không có kỹ năng plugin đã hiện thực hóa, OpenClaw giữ lại danh mục lời nhắc làm phương án dự phòng. Các giá trị ghi đè biến môi trường/khóa API của kỹ năng vẫn áp dụng cho môi trường tiến trình con trong lần chạy.

Claude CLI có chế độ quyền không tương tác riêng; OpenClaw ánh xạ chế độ đó sang chính sách thực thi hiện có thay vì thêm cấu hình riêng cho Claude. Đối với các phiên Claude trực tiếp do OpenClaw quản lý, chính sách thực thi có hiệu lực là nguồn có thẩm quyền: YOLO (`tools.exec.security: "full"` và `tools.exec.ask: "off"`) thường khởi chạy Claude với `--permission-mode bypassPermissions`, còn chính sách hạn chế sẽ khởi chạy với `--permission-mode default`. Các Gateway chạy bằng root cũng dùng `default` vì Claude Code từ chối chế độ bỏ qua đối với root; OpenClaw vẫn trả lời các yêu cầu điều khiển công cụ stdio của Claude theo chính sách thực thi đã cấu hình. Các thiết lập `agents.list[].tools.exec` theo từng tác nhân ghi đè `tools.exec` toàn cục cho tác nhân đó. Các đối số backend thô vẫn có thể bao gồm `--permission-mode`, nhưng các lần khởi chạy Claude trực tiếp sẽ chuẩn hóa cờ đó để khớp với chính sách có hiệu lực và giới hạn của máy chủ.

Backend này cũng ánh xạ các mức `/think` của OpenClaw sang cờ `--effort` gốc của Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, còn `high`/`xhigh`/`max` được chuyển qua trực tiếp. Điều này duy trì 5 mức nỗ lực Fable được hỗ trợ giống nhau cho Claude CLI dựa trên gói đăng ký và các tuyến dùng khóa API. `adaptive` xóa các cờ `--effort` đã cấu hình và không cung cấp cờ thay thế, vì vậy Claude Code xác định mức nỗ lực có hiệu lực từ môi trường, thiết lập và giá trị mặc định của mô hình. Các backend CLI khác cần plugin sở hữu chúng khai báo một trình ánh xạ argv tương đương trước khi `/think` ảnh hưởng đến CLI được khởi tạo.

Trước khi OpenClaw có thể dùng `claude-cli`, chính Claude Code phải được đăng nhập trên cùng máy chủ:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Các bản cài đặt Docker cần cài đặt và đăng nhập Claude Code bên trong thư mục chính được duy trì của vùng chứa, không chỉ trên máy chủ; xem [Backend Claude CLI trong Docker](/vi/install/docker#claude-cli-backend-in-docker).

Chỉ đặt `agents.defaults.cliBackends.claude-cli.command` khi tệp nhị phân `claude` chưa có trên `PATH`.

## Phiên

- Nếu CLI hỗ trợ phiên, hãy đặt `sessionArg` (ví dụ: `--session-id`), hoặc `sessionArgs` (phần giữ chỗ `{sessionId}`) khi mã cần xuất hiện trong nhiều cờ.
- Nếu CLI dùng một lệnh con tiếp tục với các cờ khác, hãy đặt `resumeArgs` (thay thế `args` khi tiếp tục) và tùy chọn `resumeOutput` cho các lần tiếp tục không dùng JSON.
- `sessionMode`:
  - `always`: luôn gửi một mã phiên (UUID mới nếu chưa lưu mã nào).
  - `existing`: chỉ gửi mã phiên nếu trước đó đã lưu một mã.
  - `none`: không bao giờ gửi mã phiên.
- `claude-cli` mặc định là `liveSession: "claude-stdio"`, `output: "jsonl"` và `input: "stdin"`, vì vậy các lượt tiếp theo tái sử dụng tiến trình Claude trực tiếp khi tiến trình đó còn hoạt động, kể cả với các cấu hình tùy chỉnh bỏ qua trường vận chuyển. Nếu Gateway khởi động lại hoặc tiến trình nhàn rỗi thoát, OpenClaw sẽ tiếp tục từ mã phiên Claude đã lưu. Mã phiên đã lưu được xác minh dựa trên một bản chép lời dự án có thể đọc trước khi tiếp tục; nếu thiếu bản chép lời, liên kết sẽ bị xóa (được ghi nhật ký là `reason=transcript-missing`) thay vì âm thầm bắt đầu một phiên mới dưới `--resume`.
- Các phiên Claude trực tiếp duy trì giới hạn bảo vệ đầu ra JSONL: 8 MiB và 20,000 dòng JSONL thô cho mỗi lượt.
- Các phiên CLI đã lưu là tính liên tục do nhà cung cấp sở hữu. Tự động đặt lại bị tắt theo mặc định; `/reset` và các chính sách `session.reset` theo ngày hoặc thời gian nhàn rỗi được đặt rõ ràng vẫn ngắt các phiên này.
- Các phiên CLI mới thường chỉ được gieo lại từ bản tóm tắt Compaction của OpenClaw cùng phần đuôi sau Compaction. Để khôi phục các phiên ngắn bị mất hiệu lực trước Compaction, backend có thể chọn tham gia bằng `reseedFromRawTranscriptWhenUncompacted: true`. Việc gieo lại bản chép lời thô vẫn có giới hạn và chỉ áp dụng cho các trường hợp mất hiệu lực an toàn, chẳng hạn thiếu bản chép lời CLI, phần đuôi sử dụng công cụ bị mất phần liên kết, thay đổi chính sách thông báo/lời nhắc hệ thống/cwd/MCP hoặc thử lại do phiên hết hạn; thay đổi hồ sơ xác thực hoặc kỷ nguyên thông tin xác thực không bao giờ gieo lại lịch sử bản chép lời thô.

Tuần tự hóa: `serialize: true` duy trì thứ tự các lần chạy trên cùng làn (hầu hết CLI tuần tự hóa trên một làn nhà cung cấp). OpenClaw cũng ngừng tái sử dụng phiên CLI đã lưu khi danh tính xác thực được chọn thay đổi, bao gồm thay đổi mã hồ sơ xác thực, khóa API tĩnh, token tĩnh hoặc danh tính tài khoản OAuth khi CLI cung cấp danh tính đó; riêng việc luân chuyển token truy cập/làm mới OAuth không ngắt phiên. Nếu CLI không có mã tài khoản OAuth ổn định, OpenClaw để CLI đó tự thực thi các quyền tiếp tục của mình.

## Phần mở đầu dự phòng từ các phiên claude-cli

Khi một lần thử `claude-cli` chuyển sang ứng viên không phải CLI trong [`agents.defaults.model.fallbacks`](/vi/concepts/model-failover), OpenClaw gieo cho lần thử tiếp theo một phần mở đầu ngữ cảnh được thu thập từ bản chép lời JSONL cục bộ của Claude Code (dưới `~/.claude/projects/`, được định danh theo từng không gian làm việc). Nếu không có dữ liệu gieo này, nhà cung cấp dự phòng sẽ khởi động mà không có ngữ cảnh, vì bản chép lời phiên của chính OpenClaw trống đối với các lần chạy `claude-cli`.

- Phần mở đầu ưu tiên bản tóm tắt `/compact` mới nhất hoặc dấu mốc `compact_boundary`, sau đó nối thêm các lượt gần đây nhất sau ranh giới cho đến khi đạt giới hạn ký tự. Các lượt trước ranh giới bị loại bỏ vì bản tóm tắt đã đại diện cho chúng.
- Các khối công cụ được hợp nhất thành các gợi ý `(tool call: name)` và `(tool result: …)` nhỏ gọn để phản ánh trung thực ngân sách prompt; bản tóm tắt quá lớn sẽ bị cắt ngắn và gắn nhãn `(truncated)`.
- Các phương án dự phòng cùng nhà cung cấp từ `claude-cli` sang `claude-cli` dựa vào `--resume` riêng của Claude và bỏ qua phần mở đầu.
- Dữ liệu khởi tạo tái sử dụng quy trình xác thực đường dẫn tệp phiên Claude hiện có, nên không thể đọc các đường dẫn tùy ý.

## Hình ảnh

Nếu CLI chấp nhận đường dẫn hình ảnh, hãy đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw ghi hình ảnh base64 vào các tệp tạm thời. Nếu `imageArg` được đặt, các đường dẫn đó sẽ được truyền dưới dạng đối số CLI; nếu không, OpenClaw sẽ nối đường dẫn tệp vào prompt (chèn đường dẫn), cách này hoạt động với các CLI tự động tải tệp cục bộ từ đường dẫn văn bản thuần túy.

## Đầu vào và đầu ra

- `output: "text"` (mặc định) coi stdout là phản hồi cuối cùng.
- `output: "json"` cố gắng phân tích JSON và trích xuất văn bản cùng mã định danh phiên.
- `output: "jsonl"` phân tích luồng JSONL và trích xuất thông điệp cuối cùng của tác nhân cùng các mã định danh phiên nếu có.
- Đối với đầu ra JSON của Gemini CLI, OpenClaw đọc văn bản phản hồi từ `response` và mức sử dụng từ `stats` khi `usage` bị thiếu hoặc trống. Cấu hình mặc định của Gemini CLI đi kèm sử dụng `stream-json`; các giá trị ghi đè `--output-format json` cũ vẫn sử dụng bộ phân tích JSON.

Các chế độ đầu vào:

- `input: "arg"` (mặc định) truyền prompt dưới dạng đối số CLI cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được sử dụng thay thế.

## Giá trị mặc định do Plugin sở hữu

Các giá trị mặc định của backend CLI là một phần của bề mặt Plugin:

- Các Plugin đăng ký chúng bằng `api.registerCliBackend(...)`.
- `id` của backend trở thành tiền tố nhà cung cấp trong các tham chiếu mô hình.
- Cấu hình người dùng trong `agents.defaults.cliBackends.<id>` vẫn ghi đè giá trị mặc định của Plugin.
- Việc dọn dẹp cấu hình riêng cho backend vẫn do Plugin sở hữu thông qua hook `normalizeConfig` tùy chọn.

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

Ghi chú về đầu ra của Gemini CLI:

- Bộ phân tích `stream-json` mặc định đọc các sự kiện `message` của trợ lý, các sự kiện công cụ, mức sử dụng `result` cuối cùng và các sự kiện lỗi nghiêm trọng của Gemini.
- Nếu bạn ghi đè các đối số Gemini thành `--output-format json`, OpenClaw sẽ chuẩn hóa backend đó trở lại `output: "json"` và đọc văn bản phản hồi từ trường `response` của JSON.
- Mức sử dụng dự phòng về `stats` khi `usage` không tồn tại hoặc trống; `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw, và nếu thiếu `stats.input`, số token đầu vào được suy ra từ `stats.input_tokens - stats.cached`.

Chỉ ghi đè các giá trị mặc định khi cần thiết (thường gặp nhất là đường dẫn `command` tuyệt đối).

## Lớp phủ biến đổi văn bản

Các Plugin cần những shim tương thích nhỏ cho prompt/thông điệp có thể khai báo phép biến đổi văn bản hai chiều mà không cần thay thế nhà cung cấp hoặc backend CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` viết lại prompt hệ thống và prompt người dùng được truyền cho CLI. `output` viết lại văn bản trợ lý được truyền theo luồng và văn bản cuối cùng đã phân tích trước khi OpenClaw xử lý các dấu kiểm soát riêng và phân phối tới kênh; đối với các lệnh gọi mô hình dựa trên nhà cung cấp, nó cũng khôi phục các giá trị chuỗi bên trong đối số lệnh gọi công cụ có cấu trúc sau khi sửa luồng và trước khi thực thi công cụ. Các mảnh JSON thô của nhà cung cấp được giữ nguyên; thành phần sử dụng nên dùng payload từng phần, kết thúc hoặc kết quả có cấu trúc.

Đối với các CLI phát ra sự kiện JSONL riêng của nhà cung cấp, hãy đặt `jsonlDialect` trong cấu hình của backend đó: `claude-stream-json` cho các luồng tương thích với Claude Code, `gemini-stream-json` cho các sự kiện `stream-json` của Gemini CLI.

## Quyền sở hữu Compaction gốc

Một số backend CLI chạy tác nhân tự Compaction bản ghi hội thoại của mình, vì vậy OpenClaw không được chạy trình tóm tắt bảo vệ trên chúng — làm vậy sẽ xung đột với quá trình Compaction riêng của backend và có thể khiến lượt chạy thất bại hoàn toàn.

`claude-cli` không có endpoint bộ khung (Claude Code thực hiện Compaction nội bộ), vì vậy nó khai báo `ownsNativeCompaction: true` và đường dẫn Compaction của OpenClaw trả về mục nhập phiên mà không thay đổi. OpenClaw truyền ngân sách ngữ cảnh hiệu dụng của lượt chạy qua [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) được Claude Code ghi lại, giúp quá trình tự động Compaction gốc phù hợp với các giới hạn `contextTokens` của Anthropic đã cấu hình. Thay vào đó, các phiên dùng bộ khung gốc như Codex vẫn được định tuyến đến endpoint Compaction của bộ khung tương ứng.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Chỉ khai báo `ownsNativeCompaction` cho backend thực sự sở hữu quá trình Compaction: backend đó phải giới hạn bản ghi hội thoại của mình một cách đáng tin cậy gần cửa sổ ngữ cảnh và duy trì phiên có thể tiếp tục (ví dụ: `--resume` / `--session-id`), nếu không phiên bị trì hoãn có thể vẫn vượt ngân sách.

## Lớp phủ MCP đi kèm

Các backend CLI không trực tiếp nhận lệnh gọi công cụ OpenClaw, nhưng backend có thể chọn tham gia lớp phủ cấu hình MCP được tạo bằng `bundleMcp: true`. Hành vi đi kèm hiện tại:

- `claude-cli`: tệp cấu hình MCP nghiêm ngặt được tạo.
- `google-gemini-cli`: tệp cài đặt hệ thống Gemini được tạo.

Khi MCP đi kèm được bật, OpenClaw:

- khởi chạy máy chủ MCP HTTP loopback, cung cấp các công cụ Gateway cho tiến trình CLI, được xác thực bằng quyền cấp ngữ cảnh theo từng lượt chạy (`OPENCLAW_MCP_TOKEN`) chỉ hoạt động cho lần thử thực thi hiện tại;
- ràng buộc quyền truy cập công cụ với ngữ cảnh phiên, tài khoản và kênh do Gateway chọn thay vì tin tưởng các header của tiến trình con;
- tải các máy chủ MCP đi kèm đã bật cho workspace hiện tại và hợp nhất chúng với mọi cấu hình/hình dạng cài đặt MCP hiện có của backend;
- viết lại cấu hình khởi chạy bằng chế độ tích hợp do backend sở hữu từ Plugin sở hữu backend đó.

Nếu không có máy chủ MCP nào được bật, OpenClaw vẫn chèn cấu hình nghiêm ngặt khi backend chọn tham gia MCP đi kèm, nhờ đó các lượt chạy nền vẫn được cô lập.

Các runtime MCP đi kèm theo phạm vi phiên được lưu vào bộ nhớ đệm để tái sử dụng trong một phiên, sau đó bị thu hồi sau 10 phút không hoạt động. Các lượt chạy nhúng một lần như kiểm tra xác thực, tạo slug và truy xuất Active Memory yêu cầu dọn dẹp khi lượt chạy kết thúc để các tiến trình con stdio và luồng HTTP/SSE có thể truyền không tồn tại lâu hơn lượt chạy.

## Giới hạn lịch sử gieo lại

Khi một phiên CLI mới được khởi tạo từ bản ghi OpenClaw trước đó (ví dụ: sau khi thử lại `session_expired`), khối `<conversation_history>` được kết xuất sẽ bị giới hạn để tránh lời nhắc khởi tạo lại tăng kích thước quá mức. Giá trị mặc định là 12.288 ký tự (khoảng 3.000 token).

Thay vào đó, các backend Claude CLI điều chỉnh giới hạn này theo cửa sổ ngữ cảnh Claude đã phân giải: cửa sổ ngữ cảnh lớn hơn sẽ nhận được phần lịch sử trước đó lớn hơn, tối đa đến một mức trần cố định; các backend CLI khác vẫn giữ giá trị mặc định thận trọng. Giới hạn này chỉ chi phối khối lịch sử trước đó trong lời nhắc khởi tạo lại.

## Hạn chế

- Không có lệnh gọi công cụ OpenClaw trực tiếp: OpenClaw không chèn lệnh gọi công cụ vào giao thức backend CLI. Các backend chỉ thấy công cụ Gateway khi chúng chọn sử dụng `bundleMcp: true`.
- Khả năng truyền phát phụ thuộc vào backend: một số backend truyền phát JSONL, trong khi các backend khác lưu vào bộ đệm cho đến khi thoát.
- Đầu ra có cấu trúc phụ thuộc vào định dạng JSON riêng của CLI.

## Khắc phục sự cố

| Triệu chứng               | Cách khắc phục                                                               |
| --------------------- | ----------------------------------------------------------------- |
| Không tìm thấy CLI         | Đặt `command` thành một đường dẫn đầy đủ.                                     |
| Sai tên mô hình      | Dùng `modelAliases` để ánh xạ `provider/model` sang mã định danh mô hình của CLI. |
| Không duy trì phiên liên tục | Đảm bảo `sessionArg` được đặt và `sessionMode` không phải là `none`.       |
| Hình ảnh bị bỏ qua        | Đặt `imageArg` và xác minh rằng CLI hỗ trợ đường dẫn tệp.            |

## Liên quan

- [Cẩm nang vận hành Gateway](/vi/gateway)
- [Mô hình cục bộ](/vi/gateway/local-models)
