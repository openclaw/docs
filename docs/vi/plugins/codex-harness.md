---
read_when:
    - Bạn muốn sử dụng bộ khung app-server đi kèm của Codex
    - Bạn cần các ví dụ cấu hình bộ điều phối Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác nhân nhúng của OpenClaw thông qua bộ khung app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-02T23:39:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` được đóng gói cho phép OpenClaw chạy các lượt agent nhúng thông qua
app-server Codex thay vì harness PI tích hợp sẵn.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên agent cấp thấp: khám phá mô hình,
tiếp tục luồng gốc, compaction gốc và thực thi app-server.
OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình, công cụ,
phê duyệt, phân phối phương tiện và bản sao transcript hiển thị.

Khi một lượt trò chuyện nguồn chạy qua harness Codex, các phản hồi hiển thị mặc định
dùng công cụ OpenClaw `message` nếu bản triển khai chưa cấu hình rõ
`messages.visibleReplies`. Agent vẫn có thể hoàn tất lượt Codex của nó một cách riêng tư;
nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các phản hồi cuối của trò chuyện trực tiếp trên
đường phân phối tự động cũ.

Các lượt heartbeat Codex cũng nhận công cụ `heartbeat_respond` theo mặc định, để
agent có thể ghi lại liệu lần đánh thức nên giữ im lặng hay thông báo mà không mã hóa
luồng điều khiển đó trong văn bản cuối.

Nếu bạn đang cố định hướng, hãy bắt đầu với
[Thời gian chạy agent](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là thời gian chạy, còn Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Hầu hết người dùng muốn "Codex trong OpenClaw" sẽ muốn tuyến này: đăng nhập bằng một
gói đăng ký ChatGPT/Codex, rồi chạy các lượt agent nhúng qua thời gian chạy
app-server Codex gốc. Tham chiếu mô hình vẫn giữ dạng chuẩn là
`openai/gpt-*`; xác thực gói đăng ký đến từ tài khoản/hồ sơ Codex, không phải
từ tiền tố mô hình `openai-codex/*`.

Trước tiên đăng nhập bằng Codex OAuth nếu bạn chưa làm:

```bash
openclaw models auth login --provider openai-codex
```

Sau đó bật Plugin `codex` được đóng gói và ép dùng thời gian chạy Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Nếu cấu hình của bạn dùng `plugins.allow`, hãy thêm cả `codex` vào đó:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Đừng dùng `openai-codex/gpt-*` khi bạn muốn thời gian chạy Codex gốc. Tiền tố đó
là tuyến rõ ràng "Codex OAuth qua PI". Các thay đổi cấu hình áp dụng cho phiên mới hoặc
phiên được đặt lại; các phiên hiện có giữ thời gian chạy đã ghi nhận của chúng.

## Plugin này thay đổi gì

Plugin `codex` được đóng gói đóng góp nhiều năng lực riêng biệt:

| Năng lực                         | Cách bạn dùng                                       | Nó làm gì                                                                      |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Thời gian chạy nhúng gốc         | `agentRuntime.id: "codex"`                          | Chạy các lượt agent nhúng của OpenClaw qua app-server Codex.                  |
| Lệnh điều khiển trò chuyện gốc   | `/codex bind`, `/codex resume`, `/codex steer`, ... | Liên kết và điều khiển các luồng app-server Codex từ một cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục app-server Codex | nội bộ `codex`, được hiển thị qua harness           | Cho phép thời gian chạy khám phá và xác thực các mô hình app-server.          |
| Đường hiểu phương tiện Codex     | các đường tương thích mô hình hình ảnh `codex/*`    | Chạy các lượt app-server Codex có giới hạn cho những mô hình hiểu hình ảnh được hỗ trợ. |
| Chuyển tiếp hook gốc             | Hook Plugin quanh các sự kiện gốc của Codex         | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất gốc của Codex được hỗ trợ. |

Bật Plugin sẽ làm cho các năng lực đó khả dụng. Việc này **không**:

- bắt đầu dùng Codex cho mọi mô hình OpenAI
- chuyển đổi các tham chiếu mô hình `openai-codex/*` thành thời gian chạy gốc
- đặt ACP/acpx làm đường Codex mặc định
- chuyển nóng các phiên hiện có đã ghi nhận thời gian chạy PI
- thay thế việc phân phối kênh, tệp phiên, lưu trữ hồ sơ xác thực hoặc
  định tuyến tin nhắn của OpenClaw

Cùng Plugin đó cũng sở hữu bề mặt lệnh điều khiển trò chuyện `/codex` gốc. Nếu
Plugin được bật và người dùng yêu cầu liên kết, tiếp tục, điều hướng, dừng hoặc kiểm tra
các luồng Codex từ trò chuyện, agent nên ưu tiên `/codex ...` thay vì ACP. ACP vẫn là
phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử bộ chuyển đổi
ACP Codex.

Các lượt Codex gốc giữ các hook Plugin OpenClaw làm lớp tương thích công khai.
Đây là các hook OpenClaw trong tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho các bản ghi transcript được sao chép
- `before_agent_finalize` thông qua chuyển tiếp `Stop` của Codex
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập với thời gian chạy để viết lại
kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và trước khi
kết quả được trả về Codex. Việc này tách biệt với hook Plugin công khai
`tool_result_persist`, vốn biến đổi các lần ghi kết quả công cụ vào transcript do OpenClaw sở hữu.

Về chính ngữ nghĩa hook Plugin, xem [Hook Plugin](/vi/plugins/hooks)
và [Hành vi bảo vệ Plugin](/vi/tools/plugin).

Harness tắt theo mặc định. Cấu hình mới nên giữ tham chiếu mô hình OpenAI
ở dạng chuẩn `openai/gpt-*` và ép rõ
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi muốn
thực thi app-server gốc. Các tham chiếu mô hình `codex/*` cũ vẫn tự động chọn
harness để tương thích, nhưng các tiền tố nhà cung cấp cũ được hỗ trợ bởi thời gian chạy
không hiển thị như lựa chọn mô hình/nhà cung cấp bình thường.

Nếu Plugin `codex` được bật nhưng mô hình chính vẫn là
`openai-codex/*`, `openclaw doctor` sẽ cảnh báo thay vì thay đổi tuyến. Điều đó là
có chủ ý: `openai-codex/*` vẫn là đường Codex OAuth/gói đăng ký qua PI, còn
thực thi app-server gốc vẫn là một lựa chọn thời gian chạy rõ ràng.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                                   | Tham chiếu mô hình        | Cấu hình thời gian chạy                 | Tuyến xác thực/hồ sơ        | Nhãn trạng thái kỳ vọng        |
| --------------------------------------------------- | ------------------------- | --------------------------------------- | --------------------------- | ------------------------------ |
| Gói đăng ký ChatGPT/Codex với thời gian chạy Codex gốc | `openai/gpt-*`             | `agentRuntime.id: "codex"`              | Codex OAuth hoặc tài khoản Codex | `Runtime: OpenAI Codex`        |
| OpenAI API qua trình chạy OpenClaw thông thường     | `openai/gpt-*`             | bỏ qua hoặc `runtime: "pi"`             | Khóa OpenAI API             | `Runtime: OpenClaw Pi Default` |
| Gói đăng ký ChatGPT/Codex qua PI                    | `openai-codex/gpt-*`       | bỏ qua hoặc `runtime: "pi"`             | Nhà cung cấp OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Nhiều nhà cung cấp với chế độ tự động thận trọng     | tham chiếu theo nhà cung cấp | `agentRuntime.id: "auto"`               | Theo nhà cung cấp đã chọn   | Phụ thuộc vào thời gian chạy đã chọn |
| Phiên bộ chuyển đổi Codex ACP rõ ràng               | phụ thuộc prompt/mô hình ACP | `sessions_spawn` với `runtime: "acp"`   | Xác thực backend ACP        | Trạng thái tác vụ/phiên ACP    |

Điểm phân tách quan trọng là nhà cung cấp so với thời gian chạy:

- `openai-codex/*` trả lời "PI nên dùng tuyến nhà cung cấp/xác thực nào?"
- `agentRuntime.id: "codex"` trả lời "vòng lặp nào nên thực thi lượt
  nhúng này?"
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào mà trò chuyện này nên liên kết
  hoặc điều khiển?"
- ACP trả lời "acpx nên khởi chạy tiến trình harness bên ngoài nào?"

## Chọn đúng tiền tố mô hình

Các tuyến thuộc họ OpenAI phụ thuộc vào tiền tố. Với thiết lập phổ biến là gói đăng ký cộng
thời gian chạy Codex gốc, dùng `openai/*` với `agentRuntime.id: "codex"`.
Chỉ dùng `openai-codex/*` khi bạn cố ý muốn Codex OAuth qua PI:

| Tham chiếu mô hình                            | Đường thời gian chạy                         | Dùng khi                                                                    |
| --------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Nhà cung cấp OpenAI qua hệ thống OpenClaw/PI | Bạn muốn truy cập OpenAI Platform API trực tiếp hiện tại với `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth qua OpenClaw/PI           | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với trình chạy PI mặc định.     |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với thực thi Codex gốc.         |

GPT-5.5 có thể xuất hiện trên cả tuyến khóa API OpenAI trực tiếp và tuyến gói đăng ký Codex
khi tài khoản của bạn cung cấp chúng. Dùng `openai/gpt-5.5` với harness app-server Codex
cho thời gian chạy Codex gốc, `openai-codex/gpt-5.5` cho PI OAuth, hoặc
`openai/gpt-5.5` không có ghi đè thời gian chạy Codex cho lưu lượng khóa API trực tiếp.

Các tham chiếu `codex/gpt-*` cũ vẫn được chấp nhận như bí danh tương thích. Di chuyển
tương thích của doctor viết lại các tham chiếu thời gian chạy chính cũ thành tham chiếu mô hình
chuẩn và ghi chính sách thời gian chạy riêng, trong khi các tham chiếu cũ chỉ dùng dự phòng
được giữ nguyên vì thời gian chạy được cấu hình cho toàn bộ vùng chứa agent.
Cấu hình PI Codex OAuth mới nên dùng `openai-codex/gpt-*`; cấu hình harness
app-server gốc mới nên dùng `openai/gpt-*` cộng
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng
`openai-codex/gpt-*` khi hiểu hình ảnh nên chạy qua đường nhà cung cấp OpenAI
Codex OAuth. Dùng `codex/gpt-*` khi hiểu hình ảnh nên chạy qua
một lượt app-server Codex có giới hạn. Mô hình app-server Codex phải
quảng bá hỗ trợ đầu vào hình ảnh; các mô hình Codex chỉ văn bản sẽ lỗi trước khi lượt phương tiện
bắt đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn
gây bất ngờ, bật ghi nhật ký gỡ lỗi cho hệ thống con `agents/harness`
và kiểm tra bản ghi có cấu trúc `agent harness selected` của gateway. Nó
bao gồm id harness đã chọn, lý do lựa chọn, chính sách thời gian chạy/dự phòng và,
ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Ý nghĩa của cảnh báo doctor

`openclaw doctor` cảnh báo khi tất cả điều sau là đúng:

- Plugin `codex` được đóng gói được bật hoặc được cho phép
- mô hình chính của một agent là `openai-codex/*`
- thời gian chạy hiệu lực của agent đó không phải `codex`

Cảnh báo đó tồn tại vì người dùng thường kỳ vọng "Plugin Codex được bật" đồng nghĩa với
"thời gian chạy app-server Codex gốc." OpenClaw không tự suy ra như vậy. Cảnh báo
có nghĩa là:

- **Không cần thay đổi** nếu bạn dự định dùng ChatGPT/Codex OAuth qua PI.
- Đổi mô hình thành `openai/<model>` và đặt
  `agentRuntime.id: "codex"` nếu bạn dự định thực thi
  app-server gốc.
- Các phiên hiện có vẫn cần `/new` hoặc `/reset` sau khi thay đổi thời gian chạy,
  vì các ghim thời gian chạy của phiên là cố định.

Lựa chọn harness không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng chạy,
OpenClaw ghi id harness đã chọn trên phiên đó và tiếp tục dùng nó cho
các lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng một harness khác;
dùng `/new` hoặc `/reset` để bắt đầu một phiên mới trước khi chuyển một cuộc trò chuyện hiện có
giữa PI và Codex. Việc này tránh phát lại một transcript qua
hai hệ thống phiên gốc không tương thích.

Các phiên cũ được tạo trước khi có ghim harness sẽ được xem là đã ghim PI sau khi chúng
có lịch sử transcript. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó vào
Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình hiệu lực. Harness PI mặc định xuất hiện dưới dạng
`Runtime: OpenClaw Pi Default`, còn harness app-server Codex xuất hiện dưới dạng
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có sẵn plugin `codex` được đóng gói kèm.
- App-server Codex `0.125.0` trở lên. Theo mặc định, plugin được đóng gói kèm quản lý một tệp nhị phân app-server Codex tương thích, vì vậy các lệnh `codex` cục bộ trên `PATH` không ảnh hưởng đến quá trình khởi động harness thông thường.
- Auth Codex có sẵn cho tiến trình app-server hoặc cho bridge auth Codex của OpenClaw. Các lần khởi chạy app-server cục bộ dùng một home Codex do OpenClaw quản lý cho từng agent và một `HOME` con tách biệt, nên theo mặc định chúng không đọc tài khoản `~/.codex`, skills, plugins, cấu hình, trạng thái thread hoặc `$HOME/.agents/skills` native cá nhân của bạn.

Plugin chặn các handshake app-server cũ hơn hoặc không có phiên bản. Điều đó giữ OpenClaw trên bề mặt protocol đã được kiểm thử.

Đối với các kiểm thử smoke live và Docker, auth thường đến từ tài khoản CLI Codex hoặc một hồ sơ auth `openai-codex` của OpenClaw. Các lần khởi chạy app-server stdio cục bộ cũng có thể fallback sang `CODEX_API_KEY` / `OPENAI_API_KEY` khi không có tài khoản nào.

## Tệp bootstrap workspace

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án native. OpenClaw không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào các tên tệp fallback của Codex cho tệp persona, vì fallback của Codex chỉ áp dụng khi thiếu `AGENTS.md`.

Để đạt parity workspace OpenClaw, harness Codex phân giải các tệp bootstrap khác (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, và `MEMORY.md` khi có) rồi chuyển tiếp chúng qua hướng dẫn cấu hình Codex trên `thread/start` và `thread/resume`. Điều này giữ cho `SOUL.md` và ngữ cảnh persona/hồ sơ workspace liên quan hiển thị mà không nhân bản `AGENTS.md`.

## Thêm Codex cùng các mô hình khác

Không đặt `agentRuntime.id: "codex"` toàn cục nếu cùng một agent cần tự do chuyển đổi giữa Codex và các mô hình provider không phải Codex. Runtime bị ép buộc áp dụng cho mọi lượt nhúng của agent hoặc session đó. Nếu bạn chọn một mô hình Anthropic trong khi runtime đó bị ép buộc, OpenClaw vẫn thử harness Codex và fail closed thay vì âm thầm định tuyến lượt đó qua PI.

Hãy dùng một trong các dạng sau:

- Đặt Codex trên một agent chuyên biệt với `agentRuntime.id: "codex"`.
- Giữ agent mặc định trên `agentRuntime.id: "auto"` và PI fallback cho cách dùng provider hỗn hợp thông thường.
- Chỉ dùng các ref `codex/*` legacy để tương thích. Cấu hình mới nên ưu tiên `openai/*` cùng một chính sách runtime Codex rõ ràng.

Ví dụ, cấu hình này giữ agent mặc định trên lựa chọn tự động thông thường và thêm một agent Codex riêng:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Với dạng này:

- Agent `main` mặc định dùng đường dẫn provider thông thường và fallback tương thích PI.
- Agent `codex` dùng harness app-server Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho agent `codex`, lượt đó thất bại thay vì lặng lẽ dùng PI.

## Định tuyến lệnh agent

Agent nên định tuyến yêu cầu của người dùng theo ý định, không chỉ theo riêng từ “Codex”:

| Người dùng yêu cầu...                                  | Agent nên dùng...                                |
| ------------------------------------------------------ | ------------------------------------------------ |
| “Bind this chat to Codex”                              | `/codex bind`                                    |
| “Resume Codex thread `<id>` here”                      | `/codex resume <id>`                             |
| “Show Codex threads”                                   | `/codex threads`                                 |
| “File a support report for a bad Codex run”            | `/diagnostics [note]`                            |
| “Only send Codex feedback for this attached thread”    | `/codex diagnostics [note]`                      |
| “Use my ChatGPT/Codex subscription with Codex runtime” | `openai/*` cộng với `agentRuntime.id: "codex"`   |
| “Use my ChatGPT/Codex subscription through PI”         | ref mô hình `openai-codex/*`                     |
| “Run Codex through ACP/acpx”                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| “Start Claude Code/Gemini/OpenCode/Cursor in a thread” | ACP/acpx, không phải `/codex` và không phải sub-agent native |

OpenClaw chỉ quảng bá hướng dẫn spawn ACP cho agent khi ACP được bật, có thể dispatch, và được hậu thuẫn bởi một backend runtime đã tải. Nếu ACP không khả dụng, system prompt và plugin skills không nên dạy agent về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép buộc harness Codex khi bạn cần chứng minh rằng mọi lượt agent nhúng đều dùng Codex. Runtime plugin tường minh mặc định không có PI fallback, nên `fallback: "none"` là tùy chọn nhưng thường hữu ích như tài liệu:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Ghi đè bằng môi trường:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu plugin Codex bị tắt, app-server quá cũ, hoặc app-server không thể khởi động. Chỉ đặt `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nếu bạn chủ ý muốn PI xử lý khi thiếu lựa chọn harness.

## Codex theo từng agent

Bạn có thể đặt một agent chỉ dùng Codex trong khi agent mặc định giữ lựa chọn tự động thông thường:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Dùng các lệnh session thông thường để chuyển agent và mô hình. `/new` tạo một session OpenClaw mới và harness Codex tạo hoặc tiếp tục thread app-server sidecar của nó khi cần. `/reset` xóa binding session OpenClaw cho thread đó và cho phép lượt tiếp theo phân giải harness lại từ cấu hình hiện tại.

## Khám phá mô hình

Theo mặc định, plugin Codex yêu cầu app-server cung cấp các mô hình khả dụng. Nếu khám phá thất bại hoặc hết thời gian chờ, nó dùng catalog fallback được đóng gói kèm cho:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Bạn có thể tinh chỉnh khám phá trong `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Tắt khám phá khi bạn muốn quá trình khởi động tránh probe Codex và chỉ dùng catalog fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Kết nối và chính sách app-server

Theo mặc định, plugin khởi động tệp nhị phân Codex do OpenClaw quản lý ở cục bộ với:

```bash
codex app-server --listen stdio://
```

Tệp nhị phân được quản lý được phát hành cùng gói plugin `codex`. Điều này giữ phiên bản app-server gắn với plugin được đóng gói kèm thay vì bất kỳ CLI Codex riêng nào tình cờ được cài đặt cục bộ. Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một executable khác.

Theo mặc định, OpenClaw khởi động các session harness Codex cục bộ ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Đây là tư thế operator cục bộ đáng tin cậy dùng cho Heartbeat tự trị: Codex có thể dùng shell và công cụ mạng mà không dừng ở các prompt phê duyệt native không có ai ở đó để trả lời.

Để chọn tham gia phê duyệt do guardian của Codex xem xét, đặt `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Chế độ Guardian dùng đường dẫn phê duyệt auto-review native của Codex. Khi Codex yêu cầu rời sandbox, ghi ngoài workspace, hoặc thêm quyền như truy cập mạng, Codex định tuyến yêu cầu phê duyệt đó tới reviewer native thay vì prompt cho con người. Reviewer áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối yêu cầu cụ thể. Dùng Guardian khi bạn muốn nhiều guardrail hơn chế độ YOLO nhưng vẫn cần agent không có người giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`.
Các trường chính sách riêng lẻ vẫn ghi đè `mode`, vì vậy các triển khai nâng cao có thể trộn preset với lựa chọn tường minh. Giá trị reviewer cũ hơn `guardian_subagent` vẫn được chấp nhận như một alias tương thích, nhưng cấu hình mới nên dùng `auto_review`.

Với app-server đang chạy sẵn, dùng transport WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của OpenClaw theo mặc định, nhưng OpenClaw sở hữu bridge tài khoản app-server Codex và đặt cả `CODEX_HOME` lẫn `HOME` thành các thư mục theo từng agent dưới trạng thái OpenClaw của agent đó. Bộ tải skill riêng của Codex đọc `$CODEX_HOME/skills` và `$HOME/.agents/skills`, nên cả hai giá trị đều được tách biệt cho các lần khởi chạy app-server cục bộ. Điều đó giữ cho skills, plugins, cấu hình, tài khoản và trạng thái thread native của Codex nằm trong phạm vi agent OpenClaw thay vì rò rỉ từ home CLI Codex cá nhân của operator.

Plugin OpenClaw và snapshot skill OpenClaw vẫn đi qua registry plugin và bộ tải skill riêng của OpenClaw. Tài sản CLI Codex cá nhân thì không. Nếu bạn có skills hoặc plugins CLI Codex hữu ích nên trở thành một phần của agent OpenClaw, hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Provider di trú Codex sao chép skills vào workspace agent OpenClaw hiện tại. Plugins, hooks và tệp cấu hình native của Codex được báo cáo hoặc lưu trữ để xem xét thủ công thay vì được kích hoạt tự động, vì chúng có thể thực thi lệnh, phơi bày máy chủ MCP hoặc mang thông tin xác thực.

Auth được chọn theo thứ tự sau:

1. Một hồ sơ auth Codex OpenClaw tường minh cho agent.
2. Tài khoản hiện có của app-server trong home Codex của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server nào và auth OpenAI vẫn được yêu cầu.

Khi OpenClaw thấy một hồ sơ auth Codex kiểu đăng ký ChatGPT, nó xóa `CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được spawn. Điều đó giữ các khóa API cấp Gateway khả dụng cho embeddings hoặc mô hình OpenAI trực tiếp mà không vô tình khiến các lượt app-server Codex native tính phí qua API. Hồ sơ khóa API Codex tường minh và fallback khóa môi trường stdio cục bộ dùng đăng nhập app-server thay vì env tiến trình con được kế thừa. Kết nối app-server WebSocket không nhận fallback khóa API env của Gateway; hãy dùng một hồ sơ auth tường minh hoặc tài khoản riêng của app-server từ xa.

Nếu một triển khai cần tách biệt môi trường bổ sung, hãy thêm các biến đó vào
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex được sinh ra.

Các công cụ động của Codex mặc định dùng hồ sơ `native-first`. Trong chế độ đó,
OpenClaw không hiển thị các công cụ động trùng lặp với các thao tác không gian làm việc
gốc của Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, và
`update_plan`. Các công cụ tích hợp OpenClaw như nhắn tin, phiên, phương tiện,
cron, trình duyệt, nút, gateway, `heartbeat_respond`, và `web_search` vẫn
khả dụng.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định        | Ý nghĩa                                                                                   |
| -------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Dùng `"openclaw-compat"` để hiển thị toàn bộ bộ công cụ động OpenClaw cho app-server Codex. |
| `codexDynamicToolsExclude` | `[]`            | Tên công cụ động OpenClaw bổ sung cần bỏ qua trong các lượt app-server Codex.             |

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                | Ý nghĩa                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` sinh Codex; `"websocket"` kết nối đến `url`.                                                                                                                                                                               |
| `command`           | tệp nhị phân Codex được quản lý          | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                                                                                                                          |
| `url`               | chưa đặt                                 | URL app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | chưa đặt                                 | Token Bearer cho transport WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Header WebSocket bổ sung.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được sinh ra sau khi OpenClaw xây dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cách ly Codex theo từng tác tử của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`  | `60000`                                  | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                         |
| `mode`              | `"yolo"`                                 | Thiết lập sẵn cho thực thi YOLO hoặc có guardian duyệt.                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | Chính sách phê duyệt Codex gốc được gửi đến lúc bắt đầu/tiếp tục/lượt của luồng.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Chế độ sandbox Codex gốc được gửi đến lúc bắt đầu/tiếp tục luồng.                                                                                                                                                                    |
| `approvalsReviewer` | `"user"`                                 | Dùng `"auto_review"` để cho Codex duyệt các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là bí danh cũ.                                                                                                                          |
| `serviceTier`       | chưa đặt                                 | Tầng dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị cũ không hợp lệ sẽ bị bỏ qua.                                                                                                                  |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu `item/tool/call` của Codex phải nhận
được phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín hiệu
công cụ nếu được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex để
lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt của Codex, harness
cũng kỳ vọng Codex kết thúc lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong 60 giây sau phản hồi đó, OpenClaw sẽ cố gắng
ngắt lượt Codex, ghi lại chẩn đoán hết thời gian chờ, và giải phóng làn phiên
OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một lượt gốc đã cũ.

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị gỡ bỏ. Thay vào đó, dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho triển khai có thể lặp lại vì nó giữ hành vi Plugin trong cùng
tệp đã được duyệt với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Sử dụng máy tính được đề cập trong hướng dẫn thiết lập riêng:
[Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không đóng gói ứng dụng điều khiển desktop hoặc tự
thực thi hành động desktop. Nó chuẩn bị app-server Codex, xác minh rằng máy chủ MCP
`computer-use` khả dụng, rồi để Codex xử lý các lệnh gọi công cụ MCP gốc
trong các lượt chế độ Codex.

Để truy cập trực tiếp driver TryCua ngoài luồng marketplace Codex, đăng ký
`cua-driver mcp` bằng `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Xem [Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use) để biết sự khác biệt
giữa Sử dụng máy tính do Codex sở hữu và đăng ký MCP trực tiếp.

Cấu hình tối thiểu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Có thể kiểm tra hoặc cài đặt thiết lập từ bề mặt lệnh:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Sử dụng máy tính là tính năng riêng cho macOS và có thể cần quyền hệ điều hành cục bộ trước khi
máy chủ MCP Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là true và máy chủ MCP
không khả dụng, các lượt chế độ Codex sẽ thất bại trước khi luồng bắt đầu thay vì
âm thầm chạy mà không có các công cụ Sử dụng máy tính gốc. Xem
[Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use) để biết các lựa chọn marketplace,
giới hạn danh mục từ xa, lý do trạng thái, và khắc phục sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace
Codex Desktop đóng gói chuẩn từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi
thay đổi cấu hình runtime hoặc Sử dụng máy tính để các phiên hiện có không giữ
ràng buộc luồng PI hoặc Codex cũ.

## Công thức thường dùng

Codex cục bộ với transport stdio mặc định:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Xác thực harness chỉ dùng Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Phê duyệt Codex có guardian duyệt:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server từ xa với header rõ ràng:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Việc chuyển đổi mô hình vẫn do OpenClaw kiểm soát. Khi một phiên OpenClaw được gắn
vào một luồng Codex hiện có, lượt tiếp theo sẽ gửi lại mô hình OpenAI, nhà cung cấp,
chính sách phê duyệt, sandbox, và tầng dịch vụ hiện được chọn đến
app-server. Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ ràng buộc
luồng nhưng yêu cầu Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin đóng gói đăng ký `/codex` làm lệnh gạch chéo được ủy quyền. Lệnh này
mang tính tổng quát và hoạt động trên mọi kênh hỗ trợ lệnh văn bản OpenClaw.

Các dạng thường dùng:

- `/codex status` hiển thị kết nối máy chủ ứng dụng trực tiếp, model, tài khoản, giới hạn tốc độ, máy chủ MCP và Skills.
- `/codex models` liệt kê các model máy chủ ứng dụng Codex trực tiếp.
- `/codex threads [filter]` liệt kê các luồng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex nén luồng đã gắn.
- `/codex review` bắt đầu quy trình đánh giá gốc của Codex cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho luồng đã gắn.
- `/codex computer-use status` kiểm tra Plugin Computer Use và máy chủ MCP đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Computer Use đã cấu hình và tải lại máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê Skills của máy chủ ứng dụng Codex.

### Quy trình gỡ lỗi phổ biến

Khi một tác nhân dựa trên Codex thực hiện điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu từ cuộc trò chuyện nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả những gì bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán Gateway
   cục bộ và, vì phiên đang dùng harness Codex, cũng
   gửi gói phản hồi Codex liên quan đến máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc luồng hỗ trợ.
   Phản hồi này bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id luồng Codex và một dòng `Inspect locally` cho từng luồng Codex.
4. Nếu bạn muốn tự gỡ lỗi lần chạy, hãy chạy lệnh `Inspect locally`
   đã in trong terminal. Lệnh này trông như `codex resume <thread-id>` và mở
   luồng Codex gốc để bạn có thể kiểm tra cuộc trò chuyện, tiếp tục cục bộ,
   hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho luồng hiện đang gắn mà không có toàn bộ gói chẩn đoán OpenClaw
Gateway. Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là
điểm bắt đầu tốt hơn vì nó liên kết trạng thái Gateway cục bộ và id luồng Codex
với nhau trong một phản hồi. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics)
để biết đầy đủ mô hình quyền riêng tư và hành vi trò chuyện nhóm.

OpenClaw lõi cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu làm lệnh
chẩn đoán Gateway chung. Lời nhắc phê duyệt của lệnh này hiển thị phần mở đầu
về dữ liệu nhạy cảm, liên kết đến [Xuất chẩn đoán](/vi/gateway/diagnostics), và yêu cầu
`openclaw gateway diagnostics export --json` thông qua phê duyệt exec rõ ràng
mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê duyệt,
OpenClaw gửi một báo cáo có thể dán được với đường dẫn gói cục bộ và tóm tắt
manifest. Khi phiên OpenClaw đang hoạt động dùng harness Codex, chính
phê duyệt đó cũng cho phép gửi các gói phản hồi Codex liên quan đến
máy chủ OpenAI. Lời nhắc phê duyệt nói rằng phản hồi Codex sẽ được gửi, nhưng
không liệt kê id phiên hoặc id luồng Codex trước khi phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong cuộc trò chuyện nhóm, OpenClaw giữ cho
kênh chung gọn gàng: nhóm chỉ nhận một thông báo ngắn, còn phần mở đầu
chẩn đoán, lời nhắc phê duyệt và id phiên/luồng Codex được gửi đến
chủ sở hữu qua tuyến phê duyệt riêng tư. Nếu không có tuyến riêng tư cho chủ sở hữu,
OpenClaw từ chối yêu cầu nhóm và yêu cầu chủ sở hữu chạy lệnh đó từ DM.

Lần tải Codex đã phê duyệt gọi `feedback/upload` của máy chủ ứng dụng Codex và yêu cầu
máy chủ ứng dụng bao gồm nhật ký cho từng luồng đã liệt kê và các luồng con Codex
được sinh ra khi có sẵn. Việc tải lên đi qua đường phản hồi thông thường của Codex đến
máy chủ OpenAI; nếu phản hồi Codex bị tắt trong máy chủ ứng dụng đó, lệnh trả về
lỗi máy chủ ứng dụng. Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh,
id phiên OpenClaw, id luồng Codex và các lệnh `codex resume <thread-id>`
cục bộ cho những luồng đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không in các id Codex đó. Lần tải lên này không thay thế bản xuất
chẩn đoán Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà harness dùng cho
các lượt thông thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền
model OpenClaw hiện được chọn vào máy chủ ứng dụng, và giữ bật lịch sử mở rộng.

### Kiểm tra luồng Codex từ CLI

Cách nhanh nhất để hiểu một lần chạy Codex lỗi thường là mở trực tiếp luồng Codex
gốc:

```sh
codex resume <thread-id>
```

Dùng cách này khi bạn nhận thấy lỗi trong một cuộc trò chuyện kênh và muốn kiểm tra
phiên Codex có vấn đề, tiếp tục cục bộ, hoặc hỏi Codex vì sao nó đưa ra
một lựa chọn công cụ hoặc suy luận cụ thể. Đường dẫn dễ nhất thường là chạy
`/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo đã hoàn tất liệt kê
từng luồng Codex và in một lệnh `Inspect locally`, ví dụ
`codex resume <thread-id>`. Bạn có thể sao chép trực tiếp lệnh đó vào terminal.

Bạn cũng có thể lấy id luồng từ `/codex binding` cho cuộc trò chuyện hiện tại hoặc
`/codex threads [filter]` cho các luồng máy chủ ứng dụng Codex gần đây, rồi chạy cùng
lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Từng
phương thức điều khiển được báo là `unsupported by this Codex app-server` nếu một
máy chủ ứng dụng trong tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Harness Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Tương thích sản phẩm/Plugin trên các harness PI và Codex.           |
| Middleware mở rộng máy chủ ứng dụng Codex | Plugin được đóng gói cùng OpenClaw | Hành vi bộ chuyển đổi theo từng lượt quanh công cụ động OpenClaw. |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin OpenClaw. Với cầu nối công cụ gốc và quyền được hỗ trợ,
OpenClaw chèn cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest`, và `Stop`. Các hook Codex khác như `SessionStart` và
`UserPromptSubmit` vẫn là điều khiển cấp Codex; chúng không được cung cấp làm
hook Plugin OpenClaw trong hợp đồng v1.

Đối với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, nên OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong
bộ chuyển đổi harness. Đối với công cụ gốc Codex, Codex sở hữu bản ghi công cụ chuẩn.
OpenClaw có thể phản chiếu một số sự kiện được chọn, nhưng không thể viết lại luồng Codex
gốc trừ khi Codex cung cấp thao tác đó thông qua máy chủ ứng dụng hoặc callback
hook gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo của máy chủ ứng dụng Codex
và trạng thái bộ chuyển đổi OpenClaw, không phải lệnh hook Codex gốc.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và
`llm_output` của OpenClaw là quan sát ở cấp bộ chuyển đổi, không phải bản chụp
từng byte của yêu cầu nội bộ hoặc payload Compaction của Codex.

Thông báo `hook/started` và `hook/completed` máy chủ ứng dụng gốc Codex được
chiếu thành sự kiện tác nhân `codex_app_server.hook` cho quỹ đạo và gỡ lỗi.
Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi model khác bên dưới. Codex sở hữu nhiều hơn
vòng lặp model gốc, và OpenClaw điều chỉnh các bề mặt Plugin và phiên của nó
quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                        | Hỗ trợ                                  | Lý do                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp model OpenAI qua Codex               | Được hỗ trợ                             | Máy chủ ứng dụng Codex sở hữu lượt OpenAI, tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác vẫn nằm ngoài runtime model.                                                                                                           |
| Công cụ động OpenClaw                         | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường thực thi.                                                                                                           |
| Plugin prompt và ngữ cảnh                     | Được hỗ trợ                             | OpenClaw xây dựng các lớp phủ prompt và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                          |
| Vòng đời công cụ ngữ cảnh                     | Được hỗ trợ                             | Việc lắp ráp, nạp hoặc bảo trì sau lượt, và điều phối Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                        |
| Hook công cụ động                             | Được hỗ trợ                             | `before_tool_call`, `after_tool_call`, và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                  |
| Hook vòng đời                                 | Được hỗ trợ dưới dạng quan sát bộ chuyển đổi | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, và `after_compaction` kích hoạt với payload chế độ Codex trung thực.                                                                      |
| Cổng sửa đổi câu trả lời cuối                 | Được hỗ trợ thông qua relay hook gốc    | `Stop` của Codex được relay đến `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt model trước khi hoàn tất.                                                                      |
| Chặn hoặc quan sát shell, patch và MCP gốc    | Được hỗ trợ thông qua relay hook gốc    | `PreToolUse` và `PostToolUse` của Codex được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Hỗ trợ chặn; không hỗ trợ viết lại đối số. |
| Chính sách quyền gốc                          | Được hỗ trợ thông qua relay hook gốc    | `PermissionRequest` của Codex có thể được định tuyến qua chính sách OpenClaw ở nơi runtime cung cấp. Nếu OpenClaw không trả về quyết định, Codex tiếp tục qua đường guardian hoặc phê duyệt người dùng thông thường. |
| Ghi lại quỹ đạo máy chủ ứng dụng              | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu đã gửi đến máy chủ ứng dụng và các thông báo máy chủ ứng dụng mà nó nhận.                                                                                                    |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Lộ trình tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                         | Hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Cần Codex hỗ trợ hook/schema để thay thế đầu vào công cụ.                            |
| Lịch sử transcript gốc của Codex có thể chỉnh sửa   | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên đột biến các phần nội bộ không được hỗ trợ. | Thêm API app-server Codex rõ ràng nếu cần can thiệp luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc của Codex | Hook đó chuyển đổi các lượt ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc của Codex.                                                           | Có thể phản chiếu các bản ghi đã chuyển đổi, nhưng việc viết lại chuẩn cần Codex hỗ trợ.              |
| Siêu dữ liệu compaction gốc phong phú               | OpenClaw quan sát thời điểm bắt đầu và hoàn tất compaction, nhưng không nhận được danh sách giữ/bỏ ổn định, chênh lệch token, hoặc tải trọng tóm tắt.            | Cần các sự kiện compaction Codex phong phú hơn.                                                     |
| Can thiệp compaction                                | Các hook compaction OpenClaw hiện tại ở cấp thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau compaction của Codex nếu plugin cần phủ quyết hoặc viết lại compaction gốc. |
| Ghi lại yêu cầu API mô hình từng byte một           | OpenClaw có thể ghi lại các yêu cầu và thông báo app-server, nhưng lõi Codex tự xây dựng yêu cầu OpenAI API cuối cùng ở bên trong.                      | Cần một sự kiện theo dõi yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Công cụ, phương tiện và compaction

Harness Codex chỉ thay đổi trình thực thi tác tử nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw thông thường.

Relay hook gốc được thiết kế có chủ đích là tổng quát, nhưng hợp đồng hỗ trợ v1
chỉ giới hạn ở các đường dẫn công cụ gốc của Codex và quyền mà OpenClaw kiểm thử. Trong
runtime Codex, điều đó bao gồm các payload shell, patch và MCP `PreToolUse`,
`PostToolUse` và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
là một bề mặt plugin OpenClaw cho đến khi hợp đồng runtime nêu tên
nó.

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xem đó là không có
quyết định hook và chuyển tiếp sang đường dẫn bảo vệ hoặc phê duyệt người dùng riêng của nó.

Các yêu cầu phê duyệt công cụ MCP của Codex được định tuyến qua luồng phê duyệt
plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Lời nhắc `request_user_input` của Codex được gửi lại về
cuộc trò chuyện gốc, và tin nhắn theo sau tiếp theo trong hàng đợi sẽ trả lời yêu cầu
máy chủ gốc đó thay vì được điều hướng như ngữ cảnh bổ sung. Các yêu cầu MCP elicitation
khác vẫn đóng lỗi an toàn.

Điều hướng hàng đợi lượt đang hoạt động ánh xạ sang `turn/steer` của app-server Codex. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom nhóm các tin nhắn trò chuyện đã xếp hàng
trong khoảng thời gian yên lặng được cấu hình và gửi chúng dưới dạng một yêu cầu `turn/steer`
theo thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
review Codex và compaction thủ công có thể từ chối điều hướng cùng lượt, trong trường hợp đó
OpenClaw dùng hàng đợi theo sau khi chế độ đã chọn cho phép dự phòng. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng harness Codex, compaction luồng gốc được
ủy quyền cho app-server Codex. OpenClaw giữ một bản phản chiếu transcript cho lịch sử
kênh, tìm kiếm, `/new`, `/reset` và việc chuyển đổi mô hình hoặc harness trong tương lai. Bản
phản chiếu bao gồm lời nhắc người dùng, văn bản trợ lý cuối cùng và các bản ghi suy luận
hoặc kế hoạch Codex nhẹ khi app-server phát ra chúng. Hiện nay, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất compaction gốc. Nó chưa hiển thị
bản tóm tắt compaction mà con người có thể đọc hoặc danh sách có thể kiểm tra về những mục Codex
đã giữ lại sau compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không
viết lại các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ transcript phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và hiểu
phương tiện tiếp tục dùng các cài đặt nhà cung cấp/mô hình tương ứng như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một nhà cung cấp `/model` thông thường:** điều đó là bình thường với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc một tham chiếu `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra xem `plugins.allow` có loại trừ
`codex` không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex trong khi kiểm thử. Một
runtime Codex bị ép buộc hiện sẽ thất bại thay vì rơi về PI trừ khi bạn
đặt rõ `agentRuntime.fallback: "pi"`. Sau khi app-server Codex được
chọn, lỗi của nó sẽ hiển thị trực tiếp mà không cần cấu hình dự phòng bổ sung.

**app-server bị từ chối:** nâng cấp Codex để quá trình bắt tay app-server
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các bản prerelease cùng phiên bản hoặc phiên bản có hậu tố build
như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
ngưỡng giao thức ổn định `0.125.0` là mức OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo app-server từ xa dùng cùng phiên bản giao thức app-server Codex.

**Một mô hình không phải Codex dùng PI:** điều đó là bình thường trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho tác tử đó hoặc chọn một tham chiếu `codex/*`
cũ. Các tham chiếu `openai/gpt-*` thuần và tham chiếu nhà cung cấp khác vẫn ở đường dẫn
nhà cung cấp thông thường trong chế độ `auto`. Nếu bạn buộc `agentRuntime.id: "codex"`, mọi lượt
nhúng cho tác tử đó phải là mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn, khởi động lại
gateway để xóa các đăng ký hook gốc cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, khởi động lại Codex Computer Use hoặc Codex Desktop rồi thử lại.

## Liên quan

- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
