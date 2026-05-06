---
read_when:
    - Bạn muốn sử dụng bộ khung app-server Codex đi kèm
    - Bạn cần các ví dụ cấu hình harness của Codex
    - Bạn muốn các bản triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt của tác tử nhúng OpenClaw thông qua bộ chạy app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-06T09:23:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt agent nhúng thông qua
app-server Codex thay vì PI harness tích hợp sẵn.

Dùng lựa chọn này khi bạn muốn Codex sở hữu phiên agent cấp thấp: khám phá
model, tiếp tục thread gốc, Compaction gốc và thực thi app-server.
OpenClaw vẫn sở hữu các kênh chat, tệp phiên, lựa chọn model, công cụ,
phê duyệt, phân phối media và bản sao transcript hiển thị.

Khi một lượt chat nguồn chạy qua Codex harness, các phản hồi hiển thị mặc định
dùng công cụ `message` của OpenClaw nếu deployment chưa cấu hình rõ
`messages.visibleReplies`. Agent vẫn có thể kết thúc lượt Codex của nó một cách riêng tư;
nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các phản hồi cuối cùng trong chat trực tiếp trên
đường dẫn phân phối tự động legacy.

Các lượt Codex Heartbeat cũng nhận công cụ `heartbeat_respond` theo mặc định, để
agent có thể ghi lại liệu lần đánh thức nên giữ yên lặng hay thông báo mà không mã hóa
luồng điều khiển đó trong văn bản cuối cùng.

Hướng dẫn sáng kiến dành riêng cho Heartbeat được gửi dưới dạng chỉ dẫn developer
ở chế độ cộng tác Codex trên chính lượt Heartbeat. Các lượt chat thông thường khôi phục
chế độ Codex Default thay vì mang triết lý Heartbeat trong prompt runtime
bình thường của chúng.

Nếu bạn đang cố định hướng, hãy bắt đầu với
[Runtime của agent](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là model ref, `codex` là runtime, còn Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Hầu hết người dùng muốn "Codex trong OpenClaw" sẽ muốn tuyến này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, rồi chạy các lượt agent nhúng thông qua runtime
app-server Codex gốc. Model ref vẫn giữ dạng chuẩn là
`openai/gpt-*`; xác thực gói đăng ký đến từ tài khoản/hồ sơ Codex, không phải
từ tiền tố model `openai-codex/*`.

Trước tiên đăng nhập bằng Codex OAuth nếu bạn chưa làm:

```bash
openclaw models auth login --provider openai-codex
```

Sau đó bật Plugin `codex` đi kèm và buộc dùng runtime Codex:

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

Đừng dùng `openai-codex/gpt-*` trong cấu hình. Tiền tố đó là một tuyến legacy mà
`openclaw doctor --fix` sẽ viết lại thành `openai/gpt-*` trên các model chính,
fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè kênh
và các ghim tuyến phiên đã lưu lỗi thời.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp nhiều khả năng riêng biệt:

| Khả năng                          | Cách bạn dùng                                       | Chức năng                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime nhúng gốc                 | `agentRuntime.id: "codex"`                          | Chạy các lượt agent nhúng của OpenClaw thông qua app-server Codex.            |
| Lệnh điều khiển chat gốc          | `/codex bind`, `/codex resume`, `/codex steer`, ... | Liên kết và điều khiển các thread app-server Codex từ cuộc trò chuyện nhắn tin. |
| Provider/catalog app-server Codex | nội bộ `codex`, được bộc lộ qua harness             | Cho phép runtime khám phá và xác thực các model app-server.                   |
| Đường dẫn hiểu media của Codex    | các đường dẫn tương thích model ảnh `codex/*`       | Chạy các lượt app-server Codex có giới hạn cho các model hiểu ảnh được hỗ trợ. |
| Relay hook gốc                    | Hook Plugin quanh các sự kiện Codex-native          | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất Codex-native được hỗ trợ. |

Bật Plugin làm cho các khả năng đó khả dụng. Việc này **không**:

- bắt đầu dùng Codex cho mọi model OpenAI
- chuyển đổi model ref `openai-codex/*` sang runtime gốc mà không cần doctor
  xác minh rằng Codex đã được cài đặt, bật, đóng góp harness `codex`,
  và sẵn sàng OAuth
- biến ACP/acpx thành đường dẫn Codex mặc định
- chuyển nóng các phiên hiện có đã ghi nhận runtime PI
- thay thế phân phối kênh OpenClaw, tệp phiên, lưu trữ auth-profile hoặc
  định tuyến tin nhắn

Plugin này cũng sở hữu bề mặt lệnh điều khiển chat gốc `/codex`. Nếu
Plugin được bật và người dùng yêu cầu liên kết, tiếp tục, điều hướng, dừng hoặc kiểm tra
các thread Codex từ chat, agent nên ưu tiên `/codex ...` thay vì ACP. ACP vẫn là
fallback rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử adapter ACP
Codex.

Các lượt Codex gốc giữ hook Plugin OpenClaw làm lớp tương thích công khai.
Đây là các hook OpenClaw trong tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho các bản ghi transcript được phản chiếu
- `before_agent_finalize` thông qua relay `Stop` của Codex
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập runtime để viết lại
kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và trước khi
kết quả được trả về Codex. Việc này tách biệt với hook Plugin công khai
`tool_result_persist`, vốn chuyển đổi các lần ghi kết quả công cụ vào transcript
do OpenClaw sở hữu.

Để biết ngữ nghĩa hook Plugin, hãy xem [Hook Plugin](/vi/plugins/hooks)
và [Hành vi bảo vệ Plugin](/vi/tools/plugin).

Harness mặc định tắt. Cấu hình mới nên giữ model ref OpenAI ở dạng chuẩn
`openai/gpt-*` và buộc rõ
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi chúng
muốn thực thi app-server gốc. Các model ref legacy `codex/*` vẫn tự động chọn
harness để tương thích, nhưng các tiền tố provider legacy được hậu thuẫn bằng runtime
không được hiển thị như lựa chọn model/provider thông thường.

Nếu bất kỳ tuyến model đã cấu hình nào vẫn là `openai-codex/*`, `openclaw doctor --fix`
sẽ viết lại nó thành `openai/*`. Với các tuyến agent khớp, nó chỉ đặt runtime agent
thành `codex` khi Plugin Codex đã được cài đặt, bật, đóng góp harness
`codex` và có OAuth dùng được; nếu không, nó đặt runtime thành `pi`.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                                  | Model ref                  | Cấu hình runtime                       | Tuyến auth/profile           | Nhãn trạng thái kỳ vọng        |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth hoặc tài khoản Codex | `Runtime: OpenAI Codex`     |
| OpenAI API qua runner OpenClaw thông thường        | `openai/gpt-*`             | bỏ qua hoặc `runtime: "pi"`            | Khóa OpenAI API              | `Runtime: OpenClaw Pi Default` |
| Cấu hình legacy cần doctor sửa                     | `openai-codex/gpt-*`       | được sửa thành `codex` hoặc `pi`       | Auth đã cấu hình hiện có     | Kiểm tra lại sau `doctor --fix` |
| Provider hỗn hợp với chế độ tự động thận trọng     | ref riêng theo provider    | `agentRuntime.id: "auto"`              | Theo provider được chọn      | Phụ thuộc runtime được chọn    |
| Phiên adapter Codex ACP rõ ràng                    | phụ thuộc prompt/model ACP | `sessions_spawn` với `runtime: "acp"`  | Auth backend ACP             | Trạng thái tác vụ/phiên ACP    |

Điểm tách biệt quan trọng là provider so với runtime:

- `openai-codex/*` là một tuyến legacy mà doctor sẽ viết lại.
- `agentRuntime.id: "codex"` yêu cầu Codex harness và đóng kín nếu nó
  không khả dụng.
- `agentRuntime.id: "auto"` cho phép các harness đã đăng ký nhận các tuyến provider
  khớp, nhưng ref OpenAI chuẩn vẫn do PI sở hữu trừ khi một harness hỗ trợ
  cặp provider/model đó.
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào nên được chat này liên kết
  hoặc điều khiển?"
- ACP trả lời "quy trình harness bên ngoài nào acpx nên khởi chạy?"

## Chọn đúng tiền tố model

Các tuyến họ OpenAI phụ thuộc vào tiền tố. Với thiết lập phổ biến gồm gói đăng ký cộng
runtime Codex gốc, hãy dùng `openai/*` với `agentRuntime.id: "codex"`.
Xem `openai-codex/*` là cấu hình legacy mà doctor nên viết lại:

| Model ref                                     | Đường dẫn runtime                            | Dùng khi                                                                   |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI qua hệ thống OpenClaw/PI     | Bạn muốn truy cập OpenAI Platform API trực tiếp hiện tại với `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Tuyến legacy được doctor sửa                 | Bạn đang dùng cấu hình cũ; chạy `openclaw doctor --fix` để viết lại nó.    |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | Bạn muốn auth gói đăng ký ChatGPT/Codex với thực thi Codex gốc.            |

GPT-5.5 có thể xuất hiện trên cả tuyến khóa API OpenAI trực tiếp và tuyến gói đăng ký Codex
khi tài khoản của bạn cung cấp chúng. Dùng `openai/gpt-5.5` với Codex app-server
harness cho runtime Codex gốc, hoặc `openai/gpt-5.5` không có ghi đè runtime Codex
cho lưu lượng khóa API trực tiếp.

Các ref legacy `codex/gpt-*` vẫn được chấp nhận dưới dạng alias tương thích. Migration
tương thích của doctor viết lại các ref runtime legacy thành model ref chuẩn
và ghi chính sách runtime riêng. Cấu hình harness app-server gốc mới
nên dùng `openai/gpt-*` cộng `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` theo cùng cách tách tiền tố. Dùng
`openai/gpt-*` cho tuyến OpenAI bình thường và `codex/gpt-*` khi tác vụ hiểu ảnh
nên chạy qua một lượt app-server Codex có giới hạn. Đừng dùng
`openai-codex/gpt-*`; doctor viết lại tiền tố legacy đó thành `openai/gpt-*`. Model
app-server Codex phải quảng bá hỗ trợ đầu vào ảnh; các model Codex chỉ văn bản
sẽ thất bại trước khi lượt media bắt đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn
gây bất ngờ, hãy bật ghi log debug cho subsystem `agents/harness`
và kiểm tra bản ghi có cấu trúc `agent harness selected` của gateway. Nó
bao gồm id harness được chọn, lý do lựa chọn, chính sách runtime/fallback, và,
ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Cảnh báo doctor có nghĩa gì

`openclaw doctor` cảnh báo khi các model ref đã cấu hình hoặc trạng thái tuyến phiên đã lưu
vẫn dùng `openai-codex/*`. `openclaw doctor --fix` viết lại các tuyến đó
thành:

- `openai/<model>`
- `agentRuntime.id: "codex"` khi Codex đã được cài đặt, bật, đóng góp
  harness `codex` và có OAuth dùng được
- `agentRuntime.id: "pi"` trong các trường hợp khác

Tuyến `codex` buộc dùng Codex harness gốc. Tuyến `pi` giữ
agent trên runner OpenClaw mặc định thay vì bật hoặc cài đặt Codex như
một tác dụng phụ của việc dọn dẹp tuyến legacy.
Doctor cũng sửa các ghim phiên đã lưu lỗi thời trên các kho phiên agent được phát hiện
để các cuộc trò chuyện cũ không bị kẹt trên tuyến đã bị loại bỏ.

Việc chọn bộ chạy không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng chạy,
OpenClaw ghi lại id bộ chạy đã chọn trên phiên đó và tiếp tục dùng nó cho
các lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng bộ chạy khác;
dùng `/new` hoặc `/reset` để bắt đầu một phiên mới trước khi chuyển một cuộc
trò chuyện hiện có giữa PI và Codex. Điều này tránh phát lại một bản ghi hội thoại
qua hai hệ thống phiên native không tương thích.

Các phiên legacy được tạo trước khi có ghim bộ chạy sẽ được coi là ghim PI sau khi
chúng có lịch sử bản ghi hội thoại. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó sang
Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình hiệu lực. Bộ chạy PI mặc định xuất hiện là
`Runtime: OpenClaw Pi Default`, và bộ chạy app-server Codex xuất hiện là
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có Plugin `codex` đi kèm.
- App-server Codex `0.125.0` hoặc mới hơn. Plugin đi kèm mặc định quản lý một
  binary app-server Codex tương thích, nên các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến quá trình khởi động bộ chạy thông thường.
- Xác thực Codex có sẵn cho tiến trình app-server hoặc cho cầu nối xác thực Codex của OpenClaw.
  Các lần khởi chạy app-server cục bộ dùng một home Codex do OpenClaw quản lý cho từng
  agent và một `HOME` con cô lập, nên mặc định chúng không đọc tài khoản
  `~/.codex` cá nhân, skills, plugins, cấu hình, trạng thái thread, hoặc
  `$HOME/.agents/skills` native của bạn.

Plugin chặn các handshake app-server cũ hơn hoặc không có phiên bản. Điều đó giữ
OpenClaw trên bề mặt giao thức đã được kiểm thử.

Đối với kiểm thử smoke trực tiếp và Docker, xác thực thường đến từ tài khoản Codex CLI
hoặc một hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy app-server stdio cục bộ
cũng có thể fallback sang `CODEX_API_KEY` / `OPENAI_API_KEY` khi không có tài khoản.

## Tệp bootstrap workspace

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án native. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào tên tệp fallback của Codex
cho tệp persona, vì fallback của Codex chỉ áp dụng khi
thiếu `AGENTS.md`.

Để giữ tương đương workspace OpenClaw, bộ chạy Codex phân giải các tệp bootstrap khác
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, và `MEMORY.md` khi có) và chuyển tiếp chúng qua chỉ dẫn developer của Codex
trên `thread/start` và `thread/resume`. Điều này giữ
`SOUL.md` và ngữ cảnh persona/hồ sơ workspace liên quan hiển thị trên lane native
định hình hành vi Codex mà không sao chép `AGENTS.md`.

## Thêm Codex bên cạnh các mô hình khác

Không đặt `agentRuntime.id: "codex"` toàn cục nếu cùng một agent cần tự do chuyển đổi
giữa Codex và các mô hình nhà cung cấp không phải Codex. Runtime bị ép buộc áp dụng cho mọi
lượt nhúng của agent hoặc phiên đó. Nếu bạn chọn một mô hình Anthropic trong khi
runtime đó bị ép buộc, OpenClaw vẫn thử bộ chạy Codex và đóng thất bại
thay vì âm thầm định tuyến lượt đó qua PI.

Thay vào đó, hãy dùng một trong các hình dạng sau:

- Đặt Codex trên một agent chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ agent mặc định trên `agentRuntime.id: "auto"` và fallback PI cho cách dùng nhà cung cấp hỗn hợp thông thường.
- Chỉ dùng các ref legacy `codex/*` để tương thích. Cấu hình mới nên ưu tiên
  `openai/*` cộng với một chính sách runtime Codex rõ ràng.

Ví dụ, cấu hình này giữ agent mặc định trên lựa chọn tự động thông thường và
thêm một agent Codex riêng:

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

Với hình dạng này:

- Agent `main` mặc định dùng đường dẫn nhà cung cấp thông thường và fallback tương thích PI.
- Agent `codex` dùng bộ chạy app-server Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho agent `codex`, lượt sẽ thất bại
  thay vì lặng lẽ dùng PI.

## Định tuyến lệnh agent

Agent nên định tuyến yêu cầu của người dùng theo ý định, không chỉ theo riêng từ "Codex":

| Người dùng yêu cầu...                                  | Agent nên dùng...                                  |
| ------------------------------------------------------ | -------------------------------------------------- |
| "Gắn cuộc chat này với Codex"                          | `/codex bind`                                      |
| "Tiếp tục thread Codex `<id>` ở đây"                   | `/codex resume <id>`                               |
| "Hiển thị các thread Codex"                            | `/codex threads`                                   |
| "Gửi báo cáo hỗ trợ cho một lần chạy Codex lỗi"        | `/diagnostics [note]`                              |
| "Chỉ gửi phản hồi Codex cho thread đính kèm này"       | `/codex diagnostics [note]`                        |
| "Dùng gói đăng ký ChatGPT/Codex của tôi với runtime Codex" | `openai/*` cộng với `agentRuntime.id: "codex"` |
| "Sửa các ghim cấu hình/phiên `openai-codex/*` cũ"      | `openclaw doctor --fix`                            |
| "Chạy Codex qua ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`      |
| "Khởi động Claude Code/Gemini/OpenCode/Cursor trong một thread" | ACP/acpx, không phải `/codex` và không phải sub-agent native |

OpenClaw chỉ quảng bá hướng dẫn spawn ACP cho agent khi ACP được bật,
có thể dispatch, và được hỗ trợ bởi một backend runtime đã tải. Nếu ACP không khả dụng,
system prompt và Skills của Plugin không nên dạy agent về định tuyến ACP.

## Triển khai chỉ Codex

Ép dùng bộ chạy Codex khi bạn cần chứng minh rằng mọi lượt agent nhúng
đều dùng Codex. Runtime Plugin rõ ràng sẽ đóng thất bại và không bao giờ được lặng lẽ thử lại
qua PI:

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
}
```

Ghi đè bằng môi trường:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu Plugin Codex bị tắt, nếu
app-server quá cũ, hoặc nếu app-server không thể khởi động.

## Codex theo từng agent

Bạn có thể biến một agent thành chỉ Codex trong khi agent mặc định giữ cơ chế
tự động chọn thông thường:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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

Dùng các lệnh phiên thông thường để chuyển đổi agent và mô hình. `/new` tạo một phiên
OpenClaw mới và bộ chạy Codex tạo hoặc tiếp tục thread app-server sidecar của nó
khi cần. `/reset` xóa ràng buộc phiên OpenClaw cho thread đó
và cho phép lượt tiếp theo phân giải bộ chạy từ cấu hình hiện tại một lần nữa.

## Khám phá mô hình

Theo mặc định, Plugin Codex hỏi app-server về các mô hình có sẵn. Nếu
khám phá thất bại hoặc hết thời gian, nó dùng catalog fallback đi kèm cho:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Bạn có thể tinh chỉnh khám phá dưới `plugins.entries.codex.config.discovery`:

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

Tắt khám phá khi bạn muốn quá trình khởi động tránh dò Codex và bám theo
catalog fallback:

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

Theo mặc định, Plugin khởi động binary Codex do OpenClaw quản lý cục bộ với:

```bash
codex app-server --listen stdio://
```

Binary được quản lý được gửi kèm với gói Plugin `codex`. Điều này giữ phiên bản
app-server gắn với Plugin đi kèm thay vì bất kỳ Codex CLI riêng biệt nào
đang được cài cục bộ. Chỉ đặt `appServer.command` khi
bạn cố ý muốn chạy một executable khác.

Theo mặc định, OpenClaw khởi động các phiên bộ chạy Codex cục bộ ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ đáng tin cậy dùng
cho Heartbeat tự trị: Codex có thể dùng công cụ shell và mạng mà không
dừng lại ở lời nhắc phê duyệt native khi không có ai ở đó để trả lời.

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

Chế độ Guardian dùng đường dẫn phê duyệt tự động native của Codex. Khi Codex yêu cầu
rời khỏi sandbox, ghi ngoài workspace, hoặc thêm quyền như truy cập mạng,
Codex định tuyến yêu cầu phê duyệt đó đến reviewer native thay vì một
lời nhắc cho con người. Reviewer áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối
yêu cầu cụ thể. Dùng Guardian khi bạn muốn nhiều rào chắn hơn chế độ YOLO
nhưng vẫn cần agent không có người giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`.
Các trường chính sách riêng lẻ vẫn ghi đè `mode`, nên các triển khai nâng cao có thể kết hợp
preset với các lựa chọn rõ ràng. Giá trị reviewer cũ `guardian_subagent`
vẫn được chấp nhận như một alias tương thích, nhưng cấu hình mới nên dùng
`auto_review`.

Đối với một app-server đang chạy sẵn, dùng transport WebSocket:

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

Các lần khởi chạy app-server stdio mặc định kế thừa môi trường tiến trình của OpenClaw,
nhưng OpenClaw sở hữu cầu nối tài khoản app-server Codex và đặt cả
`CODEX_HOME` lẫn `HOME` thành các thư mục theo từng agent dưới trạng thái OpenClaw
của agent đó. Bộ tải skill riêng của Codex đọc `$CODEX_HOME/skills` và
`$HOME/.agents/skills`, nên cả hai giá trị đều được cô lập cho các lần khởi chạy app-server
cục bộ. Điều đó giữ skills, plugins, cấu hình, tài khoản, và trạng thái thread native của Codex
nằm trong phạm vi agent OpenClaw thay vì rò vào từ home Codex CLI
cá nhân của operator.

Các Plugin OpenClaw và snapshot skill OpenClaw vẫn đi qua registry Plugin và bộ tải skill
riêng của OpenClaw. Tài sản Codex CLI cá nhân thì không. Nếu bạn có
skills hoặc plugins Codex CLI hữu ích cần trở thành một phần của agent OpenClaw,
hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Nhà cung cấp di trú Codex sao chép skills vào workspace agent OpenClaw hiện tại.
Plugins native, hooks, và tệp cấu hình Codex được báo cáo hoặc lưu trữ
để xem xét thủ công thay vì được kích hoạt tự động, vì chúng có thể
thực thi lệnh, phơi bày máy chủ MCP, hoặc mang thông tin xác thực.

Xác thực được chọn theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw Codex rõ ràng cho agent.
2. Tài khoản hiện có của app-server trong home Codex của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và xác thực OpenAI
   vẫn được yêu cầu.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó sẽ xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều
đó giữ cho các khóa API cấp Gateway vẫn khả dụng cho embeddings hoặc các mô hình
OpenAI trực tiếp mà không vô tình khiến các lượt app-server Codex gốc bị tính
phí qua API. Các hồ sơ khóa API Codex rõ ràng và phương án dự phòng khóa môi
trường stdio cục bộ dùng đăng nhập app-server thay vì môi trường tiến trình con
được kế thừa. Kết nối app-server WebSocket không nhận phương án dự phòng khóa
API môi trường Gateway; hãy dùng một hồ sơ xác thực rõ ràng hoặc tài khoản riêng
của app-server từ xa.

Nếu một triển khai cần cô lập môi trường bổ sung, hãy thêm các biến đó vào
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
OpenClaw không hiển thị các công cụ động trùng lặp với các thao tác workspace
gốc của Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, và
`update_plan`. Các công cụ tích hợp OpenClaw như nhắn tin, phiên, phương tiện,
cron, trình duyệt, node, gateway, `heartbeat_respond`, và `web_search` vẫn khả dụng.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định        | Ý nghĩa                                                                                  |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Dùng `"openclaw-compat"` để hiển thị toàn bộ bộ công cụ động OpenClaw cho app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Tên công cụ động OpenClaw bổ sung cần bỏ qua trong các lượt app-server Codex.              |

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                | Ý nghĩa                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` sinh ra Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                            |
| `command`           | binary Codex được quản lý                | Tệp thực thi cho transport stdio. Để trống để dùng binary được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                                                                                                                          |
| `url`               | chưa đặt                                 | URL app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | chưa đặt                                 | Bearer token cho transport WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Header WebSocket bổ sung.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Tên biến môi trường bổ sung được xóa khỏi tiến trình app-server stdio được sinh ra sau khi OpenClaw xây dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cô lập Codex theo từng agent của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`  | `60000`                                  | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển app-server.                                                                                                                                                                      |
| `mode`              | `"yolo"`                                 | Cài đặt sẵn cho thực thi YOLO hoặc được guardian xem xét.                                                                                                                                                                            |
| `approvalPolicy`    | `"never"`                                | Chính sách phê duyệt Codex gốc được gửi tới thread start/resume/turn.                                                                                                                                                                |
| `sandbox`           | `"danger-full-access"`                   | Chế độ sandbox Codex gốc được gửi tới thread start/resume.                                                                                                                                                                           |
| `approvalsReviewer` | `"user"`                                 | Dùng `"auto_review"` để cho Codex xem xét các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là alias cũ.                                                                                                                          |
| `serviceTier`       | chưa đặt                                 | Tầng dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị cũ không hợp lệ bị bỏ qua.                                                                                                                     |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận được
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín
hiệu công cụ nếu được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex
để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt Codex, harness
cũng kỳ vọng Codex hoàn tất lượt gốc bằng `turn/completed`. Nếu app-server im
lặng trong 60 giây sau phản hồi đó, OpenClaw sẽ cố gắng ngắt lượt Codex, ghi lại
thời gian chờ chẩn đoán, và giải phóng lane phiên OpenClaw để các tin nhắn chat
tiếp theo không bị xếp hàng sau một lượt gốc đã cũ.

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua binary được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị xóa. Thay vào đó hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Nên ưu
tiên cấu hình cho các triển khai lặp lại vì nó giữ hành vi Plugin trong cùng tệp
đã được xem xét với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use).

Tóm tắt ngắn gọn: OpenClaw không vendor ứng dụng điều khiển desktop hoặc tự thực
thi hành động desktop. Nó chuẩn bị app-server Codex, xác minh rằng MCP server
`computer-use` khả dụng, rồi để Codex xử lý các lệnh gọi công cụ MCP gốc trong
các lượt chế độ Codex.

Để truy cập driver TryCua trực tiếp bên ngoài luồng marketplace Codex, hãy đăng
ký `cua-driver mcp` bằng `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
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

Sử dụng máy tính chỉ dành cho macOS và có thể cần quyền hệ điều hành cục bộ trước
khi MCP server Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là
true và MCP server không khả dụng, các lượt chế độ Codex sẽ thất bại trước khi
thread bắt đầu thay vì âm thầm chạy mà không có các công cụ Sử dụng máy tính gốc.
Xem [Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use) để biết các lựa
chọn marketplace, giới hạn catalog từ xa, lý do trạng thái, và khắc phục sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace Codex
Desktop bundled tiêu chuẩn từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi thay đổi
cấu hình runtime hoặc Sử dụng máy tính để các phiên hiện có không giữ binding
thread PI hoặc Codex cũ.

## Công thức phổ biến

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

Xác thực harness chỉ Codex:

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

Phê duyệt Codex được guardian xem xét:

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

Chuyển đổi mô hình vẫn do OpenClaw kiểm soát. Khi một phiên OpenClaw được gắn
vào một thread Codex hiện có, lượt tiếp theo sẽ gửi lại mô hình OpenAI, provider,
chính sách phê duyệt, sandbox, và tầng dịch vụ hiện được chọn tới app-server.
Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ binding thread nhưng yêu
cầu Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin bundled đăng ký `/codex` làm lệnh slash được ủy quyền. Lệnh này mang tính
chung và hoạt động trên bất kỳ kênh nào hỗ trợ lệnh văn bản OpenClaw.

Các dạng phổ biến:

- `/codex status` hiển thị kết nối app-server trực tiếp, mô hình, tài khoản, giới hạn tốc độ, máy chủ MCP và skills.
- `/codex models` liệt kê các mô hình app-server Codex trực tiếp.
- `/codex threads [filter]` liệt kê các thread Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một thread Codex hiện có.
- `/codex compact` yêu cầu app-server Codex compact thread đã gắn.
- `/codex review` bắt đầu review gốc của Codex cho thread đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho thread đã gắn.
- `/codex computer-use status` kiểm tra Plugin Computer Use và máy chủ MCP đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Computer Use đã cấu hình và tải lại các máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của app-server Codex.
- `/codex skills` liệt kê skills của app-server Codex.

Khi Codex báo lỗi giới hạn sử dụng, OpenClaw bao gồm thời điểm đặt lại
app-server tiếp theo nếu Codex đã cung cấp. Dùng `/codex account` trong cùng
cuộc trò chuyện để xem tài khoản hiện tại và các cửa sổ giới hạn tốc độ.

### Quy trình gỡ lỗi phổ biến

Khi một agent dựa trên Codex làm điều bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu với cuộc trò chuyện nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả những gì bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán Gateway
   cục bộ và, vì phiên đang dùng harness Codex, cũng
   gửi gói phản hồi Codex liên quan đến máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc thread hỗ trợ.
   Nội dung này bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id thread Codex và một dòng `Inspect locally` cho từng thread Codex.
4. Nếu bạn muốn tự gỡ lỗi lần chạy, hãy chạy lệnh `Inspect locally`
   đã in trong terminal. Lệnh trông như `codex resume <thread-id>` và mở
   thread Codex gốc để bạn có thể kiểm tra cuộc trò chuyện, tiếp tục cục bộ,
   hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho thread hiện đang gắn mà không có toàn bộ gói chẩn đoán Gateway
của OpenClaw. Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là
điểm bắt đầu tốt hơn vì nó liên kết trạng thái Gateway cục bộ và id thread Codex
trong một phản hồi. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics)
để biết đầy đủ mô hình quyền riêng tư và hành vi trong nhóm chat.

Lõi OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho owner như lệnh chẩn đoán
Gateway chung. Prompt phê duyệt của lệnh này hiển thị phần mở đầu về dữ liệu nhạy cảm,
liên kết đến [Xuất chẩn đoán](/vi/gateway/diagnostics), và yêu cầu
`openclaw gateway diagnostics export --json` thông qua phê duyệt exec rõ ràng
mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê duyệt,
OpenClaw gửi một báo cáo có thể dán với đường dẫn gói cục bộ và tóm tắt manifest.
Khi phiên OpenClaw đang hoạt động dùng harness Codex, cùng
phê duyệt đó cũng cho phép gửi các gói phản hồi Codex liên quan đến
máy chủ OpenAI. Prompt phê duyệt nói rằng phản hồi Codex sẽ được gửi, nhưng
không liệt kê id phiên hoặc thread Codex trước khi phê duyệt.

Nếu `/diagnostics` được một owner gọi trong nhóm chat, OpenClaw giữ cho
kênh chung gọn gàng: nhóm chỉ nhận một thông báo ngắn, còn
phần mở đầu chẩn đoán, prompt phê duyệt và id phiên/thread Codex được gửi đến
owner qua tuyến phê duyệt riêng. Nếu không có tuyến owner riêng,
OpenClaw từ chối yêu cầu trong nhóm và yêu cầu owner chạy lệnh từ DM.

Lượt tải lên Codex đã được phê duyệt gọi `feedback/upload` của app-server Codex và yêu cầu
app-server bao gồm log cho từng thread đã liệt kê và các subthread Codex đã spawn
khi có. Lượt tải lên đi qua đường phản hồi thông thường của Codex đến máy chủ OpenAI;
nếu phản hồi Codex bị tắt trong app-server đó, lệnh trả về
lỗi app-server. Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh,
id phiên OpenClaw, id thread Codex và các lệnh `codex resume <thread-id>`
cục bộ cho những thread đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không in các id Codex đó. Lượt tải lên này không thay thế bản xuất chẩn đoán
Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà harness dùng cho
các lượt bình thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục thread Codex đó, truyền
mô hình OpenClaw hiện được chọn vào app-server, và tiếp tục bật lịch sử mở rộng.

### Kiểm tra một thread Codex từ CLI

Cách nhanh nhất để hiểu một lần chạy Codex lỗi thường là mở trực tiếp
thread Codex gốc:

```sh
codex resume <thread-id>
```

Dùng cách này khi bạn thấy lỗi trong cuộc trò chuyện kênh và muốn kiểm tra
phiên Codex có vấn đề, tiếp tục cục bộ, hoặc hỏi Codex vì sao nó đưa ra
một lựa chọn công cụ hoặc suy luận cụ thể. Đường dẫn dễ nhất thường là chạy
`/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo hoàn tất liệt kê
từng thread Codex và in một lệnh `Inspect locally`, ví dụ
`codex resume <thread-id>`. Bạn có thể sao chép trực tiếp lệnh đó vào terminal.

Bạn cũng có thể lấy id thread từ `/codex binding` cho chat hiện tại hoặc
`/codex threads [filter]` cho các thread app-server Codex gần đây, rồi chạy cùng
lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu app-server Codex `0.125.0` hoặc mới hơn. Từng
phương thức điều khiển được báo cáo là `unsupported by this Codex app-server` nếu một
app-server tùy chỉnh hoặc trong tương lai không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Harness Codex có ba lớp hook:

| Lớp                                  | Owner                    | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Tương thích sản phẩm/Plugin giữa các harness PI và Codex.           |
| Middleware extension app-server Codex | Plugin đi kèm OpenClaw   | Hành vi adapter theo từng lượt quanh các công cụ động của OpenClaw. |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin OpenClaw. Với cầu nối công cụ gốc và quyền được hỗ trợ,
OpenClaw chèn cấu hình Codex theo từng thread cho `PreToolUse`, `PostToolUse`,
`PermissionRequest` và `Stop`. Các hook Codex khác như `SessionStart` và
`UserPromptSubmit` vẫn là điều khiển cấp Codex; chúng không được cung cấp dưới dạng
hook Plugin OpenClaw trong hợp đồng v1.

Với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, nên OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong
adapter harness. Với công cụ gốc của Codex, Codex sở hữu bản ghi công cụ chuẩn.
OpenClaw có thể phản chiếu một số sự kiện được chọn, nhưng không thể ghi lại thread Codex
gốc trừ khi Codex cung cấp thao tác đó qua app-server hoặc callback hook gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo app-server Codex
và trạng thái adapter OpenClaw, không phải các lệnh hook Codex gốc.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input` và
`llm_output` của OpenClaw là quan sát ở cấp adapter, không phải bản chụp từng byte
của yêu cầu nội bộ hoặc payload Compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` gốc của Codex được
chiếu thành sự kiện agent `codex_app_server.hook` để ghi quỹ đạo và gỡ lỗi.
Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác ở bên dưới. Codex sở hữu nhiều hơn
trong vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt Plugin và phiên của nó
quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                        | Hỗ trợ                                  | Lý do                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI qua Codex             | Được hỗ trợ                             | App-server Codex sở hữu lượt OpenAI, tiếp tục thread gốc và tiếp tục công cụ gốc.                                                                                                                     |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác vẫn nằm ngoài runtime mô hình.                                                                                                         |
| Công cụ động OpenClaw                         | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường thực thi.                                                                                                           |
| Plugin prompt và ngữ cảnh                     | Được hỗ trợ                             | OpenClaw xây dựng các overlay prompt và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục thread.                                                                                        |
| Vòng đời công cụ ngữ cảnh                     | Được hỗ trợ                             | Việc lắp ráp, nạp hoặc bảo trì sau lượt, và phối hợp Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                        |
| Hook công cụ động                             | Được hỗ trợ                             | `before_tool_call`, `after_tool_call` và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                  |
| Hook vòng đời                                 | Được hỗ trợ dưới dạng quan sát adapter  | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` kích hoạt với payload trung thực của chế độ Codex.                                                                  |
| Cổng sửa đổi câu trả lời cuối                 | Được hỗ trợ qua relay hook gốc          | Codex `Stop` được relay đến `before_agent_finalize`; `revise` yêu cầu Codex chạy thêm một lượt mô hình trước khi hoàn tất.                                                                            |
| Chặn hoặc quan sát shell, patch và MCP gốc    | Được hỗ trợ qua relay hook gốc          | Codex `PreToolUse` và `PostToolUse` được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên app-server Codex `0.125.0` hoặc mới hơn. Hỗ trợ chặn; không hỗ trợ viết lại đối số. |
| Chính sách quyền gốc                          | Được hỗ trợ qua relay hook gốc          | Codex `PermissionRequest` có thể được định tuyến qua chính sách OpenClaw khi runtime cung cấp. Nếu OpenClaw không trả về quyết định, Codex tiếp tục qua guardian thông thường hoặc đường phê duyệt của người dùng. |
| Ghi quỹ đạo app-server                        | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu đã gửi đến app-server và các thông báo app-server mà nó nhận được.                                                                                                          |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Lộ trình tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Biến đổi đối số công cụ gốc                       | Các hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Cần Codex hỗ trợ hook/schema để thay thế đầu vào công cụ.                            |
| Lịch sử transcript gốc của Codex có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên biến đổi các phần nội bộ không được hỗ trợ. | Thêm API app-server Codex rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc của Codex | Hook đó biến đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc của Codex.                                                           | Có thể phản chiếu các bản ghi đã biến đổi, nhưng việc viết lại chuẩn cần Codex hỗ trợ.              |
| Siêu dữ liệu Compaction gốc phong phú                     | OpenClaw quan sát thời điểm Compaction bắt đầu và hoàn tất, nhưng không nhận được danh sách giữ/bỏ ổn định, chênh lệch token, hay payload tóm tắt.            | Cần các sự kiện Compaction phong phú hơn từ Codex.                                                     |
| Can thiệp Compaction                             | Các hook Compaction hiện tại của OpenClaw ở mức thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau Compaction của Codex nếu plugins cần phủ quyết hoặc viết lại Compaction gốc. |
| Chụp yêu cầu API mô hình từng byte một             | OpenClaw có thể chụp các yêu cầu và thông báo app-server, nhưng lõi Codex tự xây dựng yêu cầu API OpenAI cuối cùng ở bên trong.                      | Cần một sự kiện truy vết yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Công cụ, phương tiện và Compaction

Bộ harness Codex chỉ thay đổi trình thực thi tác tử nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw bình thường.

Relay hook gốc được cố ý thiết kế tổng quát, nhưng hợp đồng hỗ trợ v1
chỉ giới hạn ở các đường dẫn công cụ và quyền gốc của Codex mà OpenClaw kiểm thử. Trong
runtime Codex, điều đó bao gồm các payload shell, patch và MCP `PreToolUse`,
`PostToolUse`, và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex
trong tương lai đều là bề mặt plugin OpenClaw cho đến khi hợp đồng runtime gọi tên
nó.

Với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex coi đó là không có
quyết định hook và chuyển tiếp sang đường dẫn guardian hoặc phê duyệt người dùng của riêng nó.

Các yêu cầu phê duyệt công cụ MCP của Codex được định tuyến qua luồng
phê duyệt plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Các prompt `request_user_input` của Codex được gửi lại về
cuộc trò chuyện khởi tạo, và tin nhắn theo sau tiếp theo trong hàng đợi sẽ trả lời yêu cầu
máy chủ gốc đó thay vì được điều hướng làm ngữ cảnh bổ sung. Các yêu cầu elicitation MCP
khác vẫn thất bại theo hướng đóng.

Điều hướng hàng đợi chạy đang hoạt động ánh xạ vào `turn/steer` của app-server Codex. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom các tin nhắn trò chuyện trong hàng đợi
trong khoảng lặng đã cấu hình và gửi chúng thành một yêu cầu `turn/steer` theo
thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
review và Compaction thủ công của Codex có thể từ chối điều hướng trong cùng lượt, khi đó
OpenClaw dùng hàng đợi theo sau khi chế độ đã chọn cho phép fallback. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng harness Codex, Compaction luồng gốc được
ủy quyền cho app-server Codex. OpenClaw giữ một bản phản chiếu transcript cho lịch sử
kênh, tìm kiếm, `/new`, `/reset`, và chuyển đổi mô hình hoặc harness trong tương lai. Bản
phản chiếu bao gồm prompt người dùng, văn bản trợ lý cuối cùng và các bản ghi lập luận
hoặc kế hoạch Codex nhẹ khi app-server phát ra chúng. Hiện nay, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa phơi bày bản
tóm tắt Compaction có thể đọc được cho con người hoặc danh sách có thể kiểm toán về những mục Codex
đã giữ sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không
viết lại các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi một kết quả công cụ transcript phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và hiểu phương tiện
tiếp tục dùng cài đặt provider/mô hình tương ứng như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` bình thường:** điều này là đúng với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc ref `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra liệu `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex trong khi kiểm thử. Một
runtime Codex bị ép buộc sẽ thất bại thay vì fallback về PI. Khi app-server Codex
đã được chọn, các lỗi của nó sẽ hiển thị trực tiếp.

**app-server bị từ chối:** nâng cấp Codex để handshake app-server
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các bản prerelease cùng phiên bản hoặc phiên bản có hậu tố build
như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
mức sàn giao thức ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và việc app-server từ xa dùng cùng phiên bản giao thức app-server Codex.

**Một mô hình không phải Codex dùng PI:** điều này là đúng trừ khi bạn đã ép
`agentRuntime.id: "codex"` cho tác tử đó hoặc chọn một ref
`codex/*` cũ. `openai/gpt-*` thuần và các ref provider khác vẫn ở trên đường dẫn
provider bình thường của chúng trong chế độ `auto`. Nếu bạn ép `agentRuntime.id: "codex"`, mọi lượt nhúng
cho tác tử đó phải là một mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu lỗi vẫn tiếp diễn, khởi động lại
gateway để xóa các đăng ký hook gốc cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, khởi động lại Codex Computer Use hoặc Codex Desktop và thử lại.

## Liên quan

- [Plugins harness tác tử](/vi/plugins/sdk-agent-harness)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Provider mô hình](/vi/concepts/model-providers)
- [Provider OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
