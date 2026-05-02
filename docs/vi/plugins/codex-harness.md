---
read_when:
    - Bạn muốn dùng bộ khung app-server Codex đi kèm
    - Bạn cần các ví dụ về cấu hình bộ chạy Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác nhân nhúng của OpenClaw thông qua harness app-server Codex được đóng gói kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-02T10:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt agent nhúng thông qua
máy chủ ứng dụng Codex thay vì harness PI tích hợp sẵn.

Dùng cách này khi bạn muốn Codex sở hữu phiên agent cấp thấp: khám phá model,
tiếp tục thread gốc, Compaction gốc và thực thi trên máy chủ ứng dụng.
OpenClaw vẫn sở hữu các kênh chat, tệp phiên, lựa chọn model, công cụ,
phê duyệt, phân phối phương tiện và bản sao transcript hiển thị.

Khi một lượt chat nguồn chạy qua harness Codex, các câu trả lời hiển thị mặc định
dùng công cụ `message` của OpenClaw nếu bản triển khai chưa cấu hình rõ
`messages.visibleReplies`. Agent vẫn có thể hoàn tất lượt Codex của mình một cách riêng tư;
nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các câu trả lời cuối cùng trong chat trực tiếp trên
đường phân phối tự động cũ.

Các lượt Heartbeat của Codex cũng mặc định nhận công cụ `heartbeat_respond`, để
agent có thể ghi lại việc lần đánh thức nên giữ im lặng hay thông báo mà không mã hóa
luồng điều khiển đó trong văn bản cuối cùng.

Nếu bạn đang cố định hướng, hãy bắt đầu với
[Runtime của agent](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu model, `codex` là runtime, còn Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Hầu hết người dùng muốn "Codex trong OpenClaw" sẽ muốn lộ trình này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, rồi chạy các lượt agent nhúng thông qua runtime
máy chủ ứng dụng Codex gốc. Tham chiếu model vẫn giữ dạng chuẩn là
`openai/gpt-*`; xác thực gói đăng ký đến từ tài khoản/hồ sơ Codex, không phải
từ tiền tố model `openai-codex/*`.

Trước tiên, đăng nhập bằng Codex OAuth nếu bạn chưa đăng nhập:

```bash
openclaw models auth login --provider openai-codex
```

Sau đó bật Plugin `codex` đi kèm và ép dùng runtime Codex:

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

Không dùng `openai-codex/gpt-*` khi ý bạn là runtime Codex gốc. Tiền tố đó
là lộ trình rõ ràng "Codex OAuth thông qua PI". Các thay đổi cấu hình áp dụng cho phiên mới hoặc
phiên được đặt lại; các phiên hiện có giữ runtime đã ghi lại của chúng.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số năng lực riêng biệt:

| Năng lực                          | Cách bạn dùng                                       | Chức năng                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime nhúng gốc                 | `agentRuntime.id: "codex"`                          | Chạy các lượt agent nhúng của OpenClaw thông qua máy chủ ứng dụng Codex.       |
| Lệnh điều khiển chat gốc          | `/codex bind`, `/codex resume`, `/codex steer`, ... | Liên kết và điều khiển các thread máy chủ ứng dụng Codex từ cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục máy chủ ứng dụng Codex | phần nội bộ `codex`, được bộc lộ thông qua harness | Cho phép runtime khám phá và xác thực các model máy chủ ứng dụng.              |
| Đường hiểu phương tiện Codex      | đường tương thích model hình ảnh `codex/*`          | Chạy các lượt máy chủ ứng dụng Codex có giới hạn cho các model hiểu hình ảnh được hỗ trợ. |
| Chuyển tiếp hook gốc              | Hook của Plugin quanh các sự kiện Codex gốc         | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất Codex gốc được hỗ trợ. |

Bật Plugin sẽ làm các năng lực đó sẵn dùng. Nó **không**:

- bắt đầu dùng Codex cho mọi model OpenAI
- chuyển đổi tham chiếu model `openai-codex/*` thành runtime gốc
- đặt ACP/acpx làm đường Codex mặc định
- chuyển nóng các phiên hiện có đã ghi lại runtime PI
- thay thế phân phối kênh của OpenClaw, tệp phiên, lưu trữ hồ sơ xác thực hoặc
  định tuyến tin nhắn

Cùng Plugin đó cũng sở hữu bề mặt lệnh điều khiển chat `/codex` gốc. Nếu
Plugin được bật và người dùng yêu cầu liên kết, tiếp tục, điều hướng, dừng hoặc kiểm tra
các thread Codex từ chat, agent nên ưu tiên `/codex ...` thay vì ACP. ACP vẫn là
phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử bộ chuyển đổi
Codex ACP.

Các lượt Codex gốc giữ hook Plugin OpenClaw làm lớp tương thích công khai.
Đây là các hook OpenClaw trong cùng tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho các bản ghi transcript được sao chiếu
- `before_agent_finalize` thông qua chuyển tiếp `Stop` của Codex
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập với runtime để viết lại
kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và trước khi
kết quả được trả về Codex. Điều này tách biệt với hook Plugin công khai
`tool_result_persist`, vốn chuyển đổi các lượt ghi kết quả công cụ trong transcript do OpenClaw sở hữu.

Để biết ngữ nghĩa của chính các hook Plugin, xem [Hook của Plugin](/vi/plugins/hooks)
và [Hành vi guard của Plugin](/vi/tools/plugin).

Harness tắt theo mặc định. Cấu hình mới nên giữ tham chiếu model OpenAI
ở dạng chuẩn là `openai/gpt-*` và ép rõ
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi chúng
muốn thực thi trên máy chủ ứng dụng gốc. Các tham chiếu model `codex/*` cũ vẫn tự động chọn
harness để tương thích, nhưng các tiền tố nhà cung cấp cũ được runtime hậu thuẫn
không được hiển thị như các lựa chọn model/nhà cung cấp thông thường.

Nếu Plugin `codex` được bật nhưng model chính vẫn là
`openai-codex/*`, `openclaw doctor` sẽ cảnh báo thay vì thay đổi lộ trình. Điều đó là
có chủ ý: `openai-codex/*` vẫn là đường PI Codex OAuth/gói đăng ký, và
thực thi máy chủ ứng dụng gốc vẫn là một lựa chọn runtime rõ ràng.

## Bản đồ lộ trình

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                                  | Tham chiếu model           | Cấu hình runtime                       | Lộ trình xác thực/hồ sơ       | Nhãn trạng thái dự kiến        |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ----------------------------- | ------------------------------ |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth hoặc tài khoản Codex | `Runtime: OpenAI Codex`        |
| OpenAI API qua trình chạy OpenClaw thông thường    | `openai/gpt-*`             | bỏ qua hoặc `runtime: "pi"`            | Khóa OpenAI API               | `Runtime: OpenClaw Pi Default` |
| Gói đăng ký ChatGPT/Codex thông qua PI             | `openai-codex/gpt-*`       | bỏ qua hoặc `runtime: "pi"`            | Nhà cung cấp OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Nhiều nhà cung cấp với chế độ tự động thận trọng   | tham chiếu theo nhà cung cấp | `agentRuntime.id: "auto"`              | Theo nhà cung cấp được chọn   | Tùy runtime được chọn          |
| Phiên bộ chuyển đổi Codex ACP rõ ràng              | phụ thuộc prompt/model ACP | `sessions_spawn` với `runtime: "acp"`  | Xác thực backend ACP          | Trạng thái tác vụ/phiên ACP    |

Phân tách quan trọng là nhà cung cấp so với runtime:

- `openai-codex/*` trả lời "PI nên dùng nhà cung cấp/lộ trình xác thực nào?"
- `agentRuntime.id: "codex"` trả lời "vòng lặp nào nên thực thi lượt nhúng này?"
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào mà chat này nên liên kết
  hoặc điều khiển?"
- ACP trả lời "quy trình harness bên ngoài nào mà acpx nên khởi chạy?"

## Chọn đúng tiền tố model

Các lộ trình thuộc họ OpenAI phụ thuộc vào tiền tố. Với thiết lập phổ biến gồm gói đăng ký cộng
runtime Codex gốc, dùng `openai/*` với `agentRuntime.id: "codex"`.
Chỉ dùng `openai-codex/*` khi bạn cố ý muốn Codex OAuth thông qua PI:

| Tham chiếu model                              | Đường runtime                                | Dùng khi                                                                    |
| --------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Nhà cung cấp OpenAI qua hệ thống OpenClaw/PI | Bạn muốn truy cập OpenAI Platform API trực tiếp hiện tại với `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth thông qua OpenClaw/PI     | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với trình chạy PI mặc định.     |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness máy chủ ứng dụng Codex               | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với thực thi Codex gốc.         |

GPT-5.5 có thể xuất hiện trên cả lộ trình khóa API OpenAI trực tiếp và gói đăng ký Codex
khi tài khoản của bạn cung cấp chúng. Dùng `openai/gpt-5.5` với harness máy chủ ứng dụng Codex
cho runtime Codex gốc, `openai-codex/gpt-5.5` cho PI OAuth, hoặc
`openai/gpt-5.5` không có ghi đè runtime Codex cho lưu lượng khóa API trực tiếp.

Các tham chiếu `codex/gpt-*` cũ vẫn được chấp nhận làm bí danh tương thích. Di chuyển
tương thích của Doctor viết lại các tham chiếu runtime chính cũ thành tham chiếu model chuẩn
và ghi lại chính sách runtime riêng, còn các tham chiếu cũ chỉ dùng làm dự phòng
được giữ nguyên vì runtime được cấu hình cho toàn bộ vùng chứa agent.
Cấu hình PI Codex OAuth mới nên dùng `openai-codex/gpt-*`; cấu hình harness
máy chủ ứng dụng gốc mới nên dùng `openai/gpt-*` cộng
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng phân tách tiền tố. Dùng
`openai-codex/gpt-*` khi việc hiểu hình ảnh nên chạy qua đường nhà cung cấp
OpenAI Codex OAuth. Dùng `codex/gpt-*` khi việc hiểu hình ảnh nên chạy
qua một lượt máy chủ ứng dụng Codex có giới hạn. Model máy chủ ứng dụng Codex phải
quảng bá hỗ trợ đầu vào hình ảnh; các model Codex chỉ văn bản thất bại trước khi lượt phương tiện
bắt đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn
gây bất ngờ, hãy bật ghi nhật ký gỡ lỗi cho hệ thống con `agents/harness`
và kiểm tra bản ghi có cấu trúc `agent harness selected` của Gateway. Nó
bao gồm id harness được chọn, lý do lựa chọn, chính sách runtime/dự phòng, và,
ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Cảnh báo doctor có nghĩa gì

`openclaw doctor` cảnh báo khi tất cả điều sau là đúng:

- Plugin `codex` đi kèm được bật hoặc được cho phép
- model chính của một agent là `openai-codex/*`
- runtime hiệu lực của agent đó không phải `codex`

Cảnh báo đó tồn tại vì người dùng thường kỳ vọng "Plugin Codex được bật" sẽ hàm ý
"runtime máy chủ ứng dụng Codex gốc." OpenClaw không tự suy luận như vậy. Cảnh báo
có nghĩa là:

- **Không cần thay đổi** nếu bạn chủ định dùng ChatGPT/Codex OAuth thông qua PI.
- Đổi model thành `openai/<model>` và đặt
  `agentRuntime.id: "codex"` nếu bạn chủ định thực thi trên máy chủ ứng dụng
  gốc.
- Các phiên hiện có vẫn cần `/new` hoặc `/reset` sau khi thay đổi runtime,
  vì ghim runtime của phiên là bám dính.

Lựa chọn harness không phải điều khiển phiên trực tiếp. Khi một lượt nhúng chạy,
OpenClaw ghi lại id harness đã chọn trên phiên đó và tiếp tục dùng nó cho
các lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên trong tương lai dùng harness khác;
dùng `/new` hoặc `/reset` để bắt đầu phiên mới trước khi chuyển một cuộc trò chuyện hiện có
giữa PI và Codex. Điều này tránh phát lại một transcript qua
hai hệ thống phiên gốc không tương thích.

Các phiên cũ được tạo trước khi có ghim harness được xem là đã ghim PI sau khi chúng
có lịch sử transcript. Dùng `/new` hoặc `/reset` để chọn cho cuộc trò chuyện đó vào
Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình có hiệu lực. Harness PI mặc định xuất hiện dưới dạng
`Runtime: OpenClaw Pi Default`, và harness app-server Codex xuất hiện dưới dạng
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` được đóng gói kèm.
- App-server Codex `0.125.0` trở lên. Theo mặc định, Plugin được đóng gói kèm quản lý một tệp nhị phân app-server Codex tương thích, vì vậy các lệnh `codex` cục bộ trên `PATH` không ảnh hưởng đến quá trình khởi động harness thông thường.
- Xác thực Codex có sẵn cho tiến trình app-server hoặc cho cầu nối xác thực Codex của OpenClaw. Các lần khởi chạy app-server cục bộ sử dụng một home Codex do OpenClaw quản lý cho từng tác tử và một `HOME` con biệt lập, vì vậy theo mặc định chúng không đọc tài khoản `~/.codex` cá nhân, Skills, plugins, cấu hình, trạng thái luồng hoặc `$HOME/.agents/skills` gốc của bạn.

Plugin chặn các lần bắt tay app-server cũ hơn hoặc không có phiên bản. Điều đó giữ OpenClaw trên bề mặt giao thức mà OpenClaw đã được kiểm thử.

Đối với các bài kiểm thử smoke trực tiếp và Docker, xác thực thường đến từ tài khoản CLI Codex hoặc hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy app-server stdio cục bộ cũng có thể dự phòng sang `CODEX_API_KEY` / `OPENAI_API_KEY` khi không có tài khoản nào.

## Thêm Codex bên cạnh các mô hình khác

Không đặt `agentRuntime.id: "codex"` trên toàn cục nếu cùng một tác tử cần tự do chuyển đổi giữa Codex và các mô hình nhà cung cấp không phải Codex. Runtime bị ép buộc áp dụng cho mọi lượt nhúng của tác tử hoặc phiên đó. Nếu bạn chọn một mô hình Anthropic trong khi runtime đó bị ép buộc, OpenClaw vẫn thử harness Codex và thất bại đóng thay vì âm thầm định tuyến lượt đó qua PI.

Thay vào đó, hãy dùng một trong các dạng sau:

- Đặt Codex trên một tác tử chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ tác tử mặc định trên `agentRuntime.id: "auto"` và dự phòng PI cho việc sử dụng nhà cung cấp hỗn hợp thông thường.
- Chỉ dùng các tham chiếu `codex/*` cũ để tương thích. Cấu hình mới nên ưu tiên `openai/*` cùng một chính sách runtime Codex rõ ràng.

Ví dụ, cấu hình này giữ tác tử mặc định trên lựa chọn tự động thông thường và thêm một tác tử Codex riêng:

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

- Tác tử `main` mặc định dùng đường dẫn nhà cung cấp thông thường và dự phòng tương thích PI.
- Tác tử `codex` dùng harness app-server Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho tác tử `codex`, lượt sẽ thất bại thay vì âm thầm dùng PI.

## Định tuyến lệnh tác tử

Tác tử nên định tuyến yêu cầu của người dùng theo ý định, không chỉ theo từ "Codex":

| Người dùng yêu cầu...                                  | Tác tử nên dùng...                                |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind this chat to Codex"                              | `/codex bind`                                    |
| "Resume Codex thread `<id>` here"                      | `/codex resume <id>`                             |
| "Show Codex threads"                                   | `/codex threads`                                 |
| "File a support report for a bad Codex run"            | `/diagnostics [note]`                            |
| "Only send Codex feedback for this attached thread"    | `/codex diagnostics [note]`                      |
| "Use my ChatGPT/Codex subscription with Codex runtime" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Use my ChatGPT/Codex subscription through PI"         | `openai-codex/*` model refs                      |
| "Run Codex through ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in a thread" | ACP/acpx, not `/codex` and not native sub-agents |

OpenClaw chỉ quảng bá hướng dẫn sinh ACP cho tác tử khi ACP được bật, có thể điều phối và được một backend runtime đã tải hỗ trợ. Nếu ACP không khả dụng, prompt hệ thống và Skills của Plugin không nên dạy tác tử về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép dùng harness Codex khi bạn cần chứng minh rằng mọi lượt tác tử nhúng đều dùng Codex. Runtime Plugin rõ ràng mặc định không có dự phòng PI, vì vậy `fallback: "none"` là tùy chọn nhưng thường hữu ích như tài liệu:

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

Ghi đè môi trường:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu Plugin Codex bị tắt, app-server quá cũ hoặc app-server không thể khởi động. Chỉ đặt `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nếu bạn cố ý muốn PI xử lý khi không chọn được harness.

## Codex theo từng tác tử

Bạn có thể đặt một tác tử chỉ dùng Codex trong khi tác tử mặc định giữ cơ chế tự động chọn thông thường:

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

Dùng các lệnh phiên thông thường để chuyển đổi tác tử và mô hình. `/new` tạo một phiên OpenClaw mới và harness Codex tạo hoặc tiếp tục luồng app-server sidecar của nó khi cần. `/reset` xóa ràng buộc phiên OpenClaw cho luồng đó và cho phép lượt tiếp theo phân giải harness lại từ cấu hình hiện tại.

## Khám phá mô hình

Theo mặc định, Plugin Codex hỏi app-server về các mô hình khả dụng. Nếu khám phá thất bại hoặc hết thời gian, nó dùng danh mục dự phòng được đóng gói kèm cho:

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

Tắt khám phá khi bạn muốn quá trình khởi động tránh thăm dò Codex và chỉ dùng danh mục dự phòng:

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

Theo mặc định, Plugin khởi động tệp nhị phân Codex do OpenClaw quản lý cục bộ với:

```bash
codex app-server --listen stdio://
```

Tệp nhị phân được quản lý được phát hành cùng gói Plugin `codex`. Điều này giữ phiên bản app-server gắn với Plugin được đóng gói kèm thay vì bất kỳ CLI Codex riêng biệt nào tình cờ được cài đặt cục bộ. Chỉ đặt `appServer.command` khi bạn cố ý muốn chạy một tệp thực thi khác.

Theo mặc định, OpenClaw khởi động các phiên harness Codex cục bộ ở chế độ YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` và `sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ đáng tin cậy được dùng cho Heartbeat tự trị: Codex có thể dùng công cụ shell và mạng mà không dừng ở các prompt phê duyệt gốc khi không có ai ở đó để trả lời.

Để chọn dùng phê duyệt do guardian của Codex xem xét, đặt `appServer.mode:
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

Chế độ guardian dùng đường dẫn phê duyệt tự động xem xét gốc của Codex. Khi Codex yêu cầu rời sandbox, ghi ngoài workspace hoặc thêm quyền như truy cập mạng, Codex định tuyến yêu cầu phê duyệt đó đến bộ xem xét gốc thay vì prompt cho con người. Bộ xem xét áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối yêu cầu cụ thể. Dùng guardian khi bạn muốn nhiều rào chắn hơn chế độ YOLO nhưng vẫn cần các tác tử không có người giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` và `sandbox: "workspace-write"`. Các trường chính sách riêng lẻ vẫn ghi đè `mode`, vì vậy các triển khai nâng cao có thể trộn preset với các lựa chọn rõ ràng. Giá trị bộ xem xét `guardian_subagent` cũ hơn vẫn được chấp nhận như một bí danh tương thích, nhưng cấu hình mới nên dùng `auto_review`.

Đối với app-server đang chạy sẵn, dùng transport WebSocket:

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

Theo mặc định, các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của OpenClaw, nhưng OpenClaw sở hữu cầu nối tài khoản app-server Codex và đặt cả `CODEX_HOME` lẫn `HOME` thành các thư mục theo từng tác tử dưới trạng thái OpenClaw của tác tử đó. Trình tải skill riêng của Codex đọc `$CODEX_HOME/skills` và `$HOME/.agents/skills`, vì vậy cả hai giá trị đều được biệt lập cho các lần khởi chạy app-server cục bộ. Điều đó giữ Skills gốc Codex, plugins, cấu hình, tài khoản và trạng thái luồng nằm trong phạm vi tác tử OpenClaw thay vì rò rỉ từ home CLI Codex cá nhân của người vận hành.

Plugins OpenClaw và snapshot skill OpenClaw vẫn đi qua registry Plugin và trình tải skill riêng của OpenClaw. Tài sản CLI Codex cá nhân thì không. Nếu bạn có Skills CLI Codex hoặc plugins hữu ích cần trở thành một phần của tác tử OpenClaw, hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Nhà cung cấp di chuyển Codex sao chép Skills vào workspace tác tử OpenClaw hiện tại. Plugins gốc Codex, hooks và tệp cấu hình được báo cáo hoặc lưu trữ để xem xét thủ công thay vì được kích hoạt tự động, vì chúng có thể thực thi lệnh, phơi bày máy chủ MCP hoặc mang thông tin xác thực.

Xác thực được chọn theo thứ tự này:

1. Hồ sơ xác thực Codex OpenClaw rõ ràng cho tác tử.
2. Tài khoản hiện có của app-server trong home Codex của tác tử đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, sau đó `OPENAI_API_KEY`, khi không có tài khoản app-server nào và xác thực OpenAI vẫn được yêu cầu.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó xóa `CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều đó giữ các khóa API cấp Gateway khả dụng cho embeddings hoặc các mô hình OpenAI trực tiếp mà không vô tình làm các lượt app-server Codex gốc bị tính phí qua API. Hồ sơ khóa API Codex rõ ràng và dự phòng khóa môi trường stdio cục bộ dùng đăng nhập app-server thay vì môi trường tiến trình con được kế thừa. Kết nối app-server WebSocket không nhận dự phòng khóa API môi trường Gateway; hãy dùng một hồ sơ xác thực rõ ràng hoặc tài khoản riêng của app-server từ xa.

Nếu một triển khai cần thêm cách ly môi trường, thêm các biến đó vào `appServer.clearEnv`:

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

Công cụ động Codex mặc định dùng hồ sơ `native-first`. Trong chế độ đó, OpenClaw không phơi bày các công cụ động trùng lặp với thao tác workspace gốc Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` và `update_plan`. Các công cụ tích hợp OpenClaw như nhắn tin, phiên, phương tiện, cron, trình duyệt, nút, gateway, `heartbeat_respond` và `web_search` vẫn khả dụng.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định         | Ý nghĩa                                                                                           |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Dùng `"openclaw-compat"` để hiển thị toàn bộ bộ công cụ động OpenClaw cho app-server Codex.       |
| `codexDynamicToolsExclude` | `[]`             | Tên công cụ động OpenClaw bổ sung cần bỏ qua khỏi các lượt app-server Codex.                      |

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                 | Ý nghĩa                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                  |
| `command`           | tệp nhị phân Codex được quản lý          | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                                                                                                                                  |
| `url`               | chưa đặt                                 | URL app-server WebSocket.                                                                                                                                                                                                                    |
| `authToken`         | chưa đặt                                 | Token Bearer cho transport WebSocket.                                                                                                                                                                                                        |
| `headers`           | `{}`                                     | Header WebSocket bổ sung.                                                                                                                                                                                                                    |
| `clearEnv`          | `[]`                                     | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được sinh ra sau khi OpenClaw xây dựng môi trường kế thừa của nó. `CODEX_HOME` và `HOME` được dành riêng cho cô lập Codex theo từng agent của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`  | `60000`                                  | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                 |
| `mode`              | `"yolo"`                                 | Preset cho thực thi YOLO hoặc thực thi được guardian xem xét.                                                                                                                                                                                |
| `approvalPolicy`    | `"never"`                                | Chính sách phê duyệt Codex gốc được gửi tới lượt bắt đầu/tiếp tục/lượt.                                                                                                                                                                      |
| `sandbox`           | `"danger-full-access"`                   | Chế độ sandbox Codex gốc được gửi tới lượt bắt đầu/tiếp tục.                                                                                                                                                                                 |
| `approvalsReviewer` | `"user"`                                 | Dùng `"auto_review"` để Codex xem xét các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là bí danh kế thừa.                                                                                                                               |
| `serviceTier`       | chưa đặt                                 | Bậc dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị kế thừa không hợp lệ sẽ bị bỏ qua.                                                                                                                       |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín
hiệu công cụ nếu được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex
để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt của Codex,
harness cũng kỳ vọng Codex hoàn tất lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong 60 giây sau phản hồi đó, OpenClaw cố gắng hết mức để
ngắt lượt Codex, ghi lại chẩn đoán hết thời gian chờ, và giải phóng lane phiên
OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một lượt gốc đã
cũ.

Các ghi đè môi trường vẫn có sẵn cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị xóa. Thay vào đó, dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được xem xét với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Sử dụng máy tính của Codex](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không đóng gói ứng dụng điều khiển desktop hoặc tự
thực thi hành động desktop. Nó chuẩn bị app-server Codex, xác minh rằng MCP
server `computer-use` có sẵn, rồi để Codex xử lý các lệnh gọi công cụ MCP gốc
trong các lượt chế độ Codex.

Để truy cập trực tiếp driver TryCua bên ngoài luồng marketplace Codex, đăng ký
`cua-driver mcp` bằng `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Xem [Sử dụng máy tính của Codex](/vi/plugins/codex-computer-use) để biết điểm khác
biệt giữa Sử dụng máy tính do Codex sở hữu và đăng ký MCP trực tiếp.

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

Có thể kiểm tra hoặc cài đặt phần thiết lập từ bề mặt lệnh:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Sử dụng máy tính chỉ dành cho macOS và có thể yêu cầu quyền OS cục bộ trước khi
MCP server Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là true
và MCP server không có sẵn, các lượt chế độ Codex sẽ thất bại trước khi thread
bắt đầu thay vì âm thầm chạy mà không có các công cụ Sử dụng máy tính gốc. Xem
[Sử dụng máy tính của Codex](/vi/plugins/codex-computer-use) để biết các lựa chọn
marketplace, giới hạn catalog từ xa, lý do trạng thái và cách khắc phục sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace
Codex Desktop tiêu chuẩn được đóng gói từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi thay đổi
cấu hình runtime hoặc Sử dụng máy tính để các phiên hiện có không giữ ràng buộc
PI hoặc thread Codex cũ.

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

Việc chuyển đổi model vẫn do OpenClaw kiểm soát. Khi một phiên OpenClaw được gắn
vào một thread Codex hiện có, lượt tiếp theo lại gửi model OpenAI, provider,
chính sách phê duyệt, sandbox và bậc dịch vụ đang được chọn tới app-server.
Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ ràng buộc thread nhưng yêu
cầu Codex tiếp tục với model mới được chọn.

## Lệnh Codex

Plugin được đóng gói đăng ký `/codex` làm lệnh slash được ủy quyền. Lệnh này
mang tính chung và hoạt động trên bất kỳ kênh nào hỗ trợ lệnh văn bản OpenClaw.

Các dạng phổ biến:

- `/codex status` hiển thị kết nối app-server trực tiếp, model, tài khoản, giới hạn tốc độ, MCP server và skills.
- `/codex models` liệt kê các model app-server Codex trực tiếp.
- `/codex threads [filter]` liệt kê các thread Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một thread Codex hiện có.
- `/codex compact` yêu cầu app-server Codex nén thread đã gắn.
- `/codex review` bắt đầu đánh giá gốc của Codex cho thread đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho thread đã gắn.
- `/codex computer-use status` kiểm tra Plugin Sử dụng máy tính đã cấu hình và MCP server.
- `/codex computer-use install` cài đặt Plugin Sử dụng máy tính đã cấu hình và tải lại các MCP server.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái MCP server của app-server Codex.
- `/codex skills` liệt kê skills của app-server Codex.

### Quy trình gỡ lỗi phổ biến

Khi một agent dựa trên Codex làm điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu với cuộc trò chuyện nơi vấn đề xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả những gì bạn thấy.
2. Phê duyệt yêu cầu diagnostics một lần. Việc phê duyệt tạo tệp zip diagnostics Gateway
   cục bộ và, vì phiên đang dùng harness Codex, cũng gửi gói phản hồi Codex liên quan
   đến máy chủ OpenAI.
3. Sao chép phản hồi diagnostics đã hoàn tất vào báo cáo lỗi hoặc luồng hỗ trợ.
   Phản hồi này bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id luồng Codex, và một dòng `Inspect locally` cho từng luồng Codex.
4. Nếu bạn muốn tự gỡ lỗi lần chạy, hãy chạy lệnh `Inspect locally` đã in ra
   trong terminal. Lệnh trông giống như `codex resume <thread-id>` và mở luồng
   Codex gốc để bạn có thể kiểm tra cuộc hội thoại, tiếp tục nó cục bộ,
   hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho luồng hiện đang được gắn mà không có đầy đủ gói diagnostics Gateway
OpenClaw. Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là điểm bắt đầu
tốt hơn vì nó liên kết trạng thái Gateway cục bộ và id luồng Codex với nhau
trong một phản hồi. Xem [Xuất diagnostics](/vi/gateway/diagnostics)
để biết đầy đủ mô hình quyền riêng tư và hành vi trong trò chuyện nhóm.

Lõi OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu như lệnh
diagnostics Gateway chung. Lời nhắc phê duyệt của lệnh này hiển thị phần mở đầu
về dữ liệu nhạy cảm, liên kết đến [Xuất Diagnostics](/vi/gateway/diagnostics), và yêu cầu
`openclaw gateway diagnostics export --json` thông qua phê duyệt exec tường minh
mỗi lần. Không phê duyệt diagnostics bằng quy tắc cho phép tất cả. Sau khi phê duyệt,
OpenClaw gửi một báo cáo có thể dán với đường dẫn gói cục bộ và tóm tắt manifest.
Khi phiên OpenClaw đang hoạt động dùng harness Codex, cùng phê duyệt đó cũng
ủy quyền gửi các gói phản hồi Codex liên quan đến máy chủ OpenAI. Lời nhắc phê duyệt
nói rằng phản hồi Codex sẽ được gửi, nhưng không liệt kê id phiên hoặc luồng Codex
trước khi phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong trò chuyện nhóm, OpenClaw giữ
kênh chia sẻ gọn gàng: nhóm chỉ nhận một thông báo ngắn, còn phần mở đầu
diagnostics, lời nhắc phê duyệt, và id phiên/luồng Codex được gửi cho chủ sở hữu
qua tuyến phê duyệt riêng tư. Nếu không có tuyến chủ sở hữu riêng tư, OpenClaw
từ chối yêu cầu nhóm và yêu cầu chủ sở hữu chạy lệnh này từ DM.

Tải lên Codex đã được phê duyệt gọi `feedback/upload` của app-server Codex và yêu cầu
app-server bao gồm nhật ký cho từng luồng được liệt kê và các luồng con Codex
đã sinh ra khi có. Việc tải lên đi qua đường dẫn phản hồi bình thường của Codex
đến máy chủ OpenAI; nếu phản hồi Codex bị tắt trong app-server đó, lệnh trả về
lỗi app-server. Phản hồi diagnostics đã hoàn tất liệt kê các kênh,
id phiên OpenClaw, id luồng Codex, và các lệnh `codex resume <thread-id>`
cục bộ cho những luồng đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không in các id Codex đó. Việc tải lên này không thay thế bản xuất
diagnostics Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà harness dùng cho các lượt bình thường.
Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền mô hình OpenClaw
đang được chọn vào app-server, và giữ bật lịch sử mở rộng.

### Kiểm tra một luồng Codex từ CLI

Cách nhanh nhất để hiểu một lần chạy Codex lỗi thường là mở trực tiếp luồng Codex
gốc:

```sh
codex resume <thread-id>
```

Dùng lệnh này khi bạn nhận thấy lỗi trong một cuộc hội thoại kênh và muốn kiểm tra
phiên Codex có vấn đề, tiếp tục nó cục bộ, hoặc hỏi Codex vì sao nó đưa ra một
lựa chọn công cụ hoặc suy luận cụ thể. Đường dẫn dễ nhất thường là chạy
`/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo hoàn tất liệt kê
từng luồng Codex và in một lệnh `Inspect locally`, ví dụ
`codex resume <thread-id>`. Bạn có thể sao chép lệnh đó trực tiếp vào terminal.

Bạn cũng có thể lấy id luồng từ `/codex binding` cho cuộc trò chuyện hiện tại hoặc
`/codex threads [filter]` cho các luồng app-server Codex gần đây, rồi chạy cùng
lệnh `codex resume` trong shell.

Bề mặt lệnh yêu cầu app-server Codex `0.125.0` hoặc mới hơn. Các phương thức
điều khiển riêng lẻ được báo cáo là `unsupported by this Codex app-server` nếu
một app-server tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Harness Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook plugin OpenClaw                 | OpenClaw                 | Khả năng tương thích sản phẩm/plugin trên các harness PI và Codex.  |
| Middleware tiện ích mở rộng app-server Codex | Plugin tích hợp OpenClaw | Hành vi bộ chuyển đổi theo từng lượt quanh các công cụ động OpenClaw. |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex cấp dự án hoặc toàn cục để định tuyến
hành vi plugin OpenClaw. Đối với cầu nối công cụ gốc và quyền được hỗ trợ,
OpenClaw chèn cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest`, và `Stop`. Các hook Codex khác như `SessionStart` và
`UserPromptSubmit` vẫn là điều khiển cấp Codex; chúng không được cung cấp như
hook plugin OpenClaw trong hợp đồng v1.

Đối với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
cuộc gọi, nên OpenClaw kích hoạt hành vi plugin và middleware mà nó sở hữu trong
bộ chuyển đổi harness. Đối với công cụ gốc Codex, Codex sở hữu bản ghi công cụ
chuẩn. OpenClaw có thể phản chiếu các sự kiện được chọn, nhưng không thể ghi lại
luồng Codex gốc trừ khi Codex cung cấp thao tác đó thông qua app-server hoặc
callback hook gốc.

Compaction và các phép chiếu vòng đời LLM đến từ thông báo app-server Codex
và trạng thái bộ chuyển đổi OpenClaw, không phải từ lệnh hook Codex gốc.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và
`llm_output` của OpenClaw là các quan sát cấp bộ chuyển đổi, không phải bản chụp
từng byte của yêu cầu nội bộ hoặc payload compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` gốc Codex được chiếu thành
sự kiện agent `codex_app_server.hook` để theo dõi quỹ đạo và gỡ lỗi.
Chúng không gọi hook plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác bên dưới. Codex sở hữu
nhiều hơn trong vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt plugin
và phiên của nó quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                        | Hỗ trợ                                  | Lý do                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vòng lặp mô hình OpenAI thông qua Codex        | Được hỗ trợ                             | App-server Codex sở hữu lượt OpenAI, tiếp tục luồng gốc, và tiếp tục công cụ gốc.                                                                                                                       |
| Định tuyến và phân phối kênh OpenClaw          | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage, và các kênh khác vẫn nằm ngoài runtime mô hình.                                                                                                           |
| Công cụ động OpenClaw                         | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                         |
| Plugin prompt và ngữ cảnh                     | Được hỗ trợ                             | OpenClaw xây dựng các lớp phủ prompt và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                            |
| Vòng đời engine ngữ cảnh                      | Được hỗ trợ                             | Việc lắp ráp, nạp hoặc bảo trì sau lượt, và phối hợp compaction engine ngữ cảnh chạy cho các lượt Codex.                                                                                                |
| Hook công cụ động                             | Được hỗ trợ                             | `before_tool_call`, `after_tool_call`, và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                    |
| Hook vòng đời                                 | Được hỗ trợ dưới dạng quan sát bộ chuyển đổi | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, và `after_compaction` kích hoạt với payload trung thực ở chế độ Codex.                                                                     |
| Cổng sửa đổi câu trả lời cuối                 | Được hỗ trợ thông qua relay hook gốc    | `Stop` của Codex được relay đến `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                                     |
| Chặn hoặc quan sát shell, patch, và MCP gốc   | Được hỗ trợ thông qua relay hook gốc    | `PreToolUse` và `PostToolUse` của Codex được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên app-server Codex `0.125.0` hoặc mới hơn. Hỗ trợ chặn; không hỗ trợ ghi lại đối số. |
| Chính sách quyền gốc                          | Được hỗ trợ thông qua relay hook gốc    | `PermissionRequest` của Codex có thể được định tuyến qua chính sách OpenClaw ở nơi runtime cung cấp. Nếu OpenClaw không trả về quyết định, Codex tiếp tục qua đường dẫn guardian hoặc phê duyệt người dùng bình thường. |
| Ghi lại quỹ đạo app-server                    | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu nó đã gửi đến app-server và các thông báo app-server mà nó nhận.                                                                                                               |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Lộ trình tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                       | Các hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Cần hỗ trợ hook/schema của Codex để thay thế đầu vào công cụ.                            |
| Lịch sử transcript gốc Codex có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn tắc. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên đột biến nội bộ không được hỗ trợ. | Thêm API app-server Codex rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc Codex | Hook đó chuyển đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc Codex.                                                           | Có thể phản chiếu các bản ghi đã chuyển đổi, nhưng việc viết lại chuẩn tắc cần hỗ trợ từ Codex.              |
| Siêu dữ liệu Compaction gốc phong phú                     | OpenClaw quan sát điểm bắt đầu và hoàn tất Compaction, nhưng không nhận danh sách giữ/bỏ ổn định, chênh lệch token, hoặc payload tóm tắt.            | Cần các sự kiện Compaction phong phú hơn của Codex.                                                     |
| Can thiệp Compaction                             | Các hook Compaction hiện tại của OpenClaw ở mức thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau Compaction của Codex nếu Plugin cần phủ quyết hoặc viết lại Compaction gốc. |
| Ghi lại yêu cầu API mô hình chính xác từng byte             | OpenClaw có thể ghi lại yêu cầu và thông báo app-server, nhưng lõi Codex tự xây dựng yêu cầu API OpenAI cuối cùng ở bên trong.                      | Cần một sự kiện truy vết yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Công cụ, phương tiện và Compaction

Bộ harness Codex chỉ thay đổi executor tác tử nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw thông thường.

Relay hook gốc được cố ý thiết kế chung, nhưng hợp đồng hỗ trợ v1
giới hạn trong các đường dẫn công cụ và quyền gốc Codex mà OpenClaw kiểm thử. Trong
runtime Codex, điều đó bao gồm các payload shell, patch và MCP `PreToolUse`,
`PostToolUse` và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
là một bề mặt Plugin OpenClaw cho đến khi hợp đồng runtime nêu tên
nó.

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xem đó là không có
quyết định hook và chuyển tiếp đến guardian riêng hoặc đường dẫn phê duyệt của người dùng.

Các yêu cầu khơi gợi phê duyệt công cụ MCP của Codex được định tuyến qua luồng
phê duyệt Plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Các lời nhắc `request_user_input` của Codex được gửi lại tới
cuộc trò chuyện khởi nguồn, và tin nhắn theo sau tiếp theo trong hàng đợi sẽ trả lời yêu cầu
máy chủ gốc đó thay vì bị điều hướng như ngữ cảnh bổ sung. Các yêu cầu khơi gợi MCP khác
vẫn đóng lỗi an toàn.

Điều hướng hàng đợi lượt chạy đang hoạt động ánh xạ vào `turn/steer` app-server Codex. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom các tin nhắn trò chuyện trong hàng đợi
trong khoảng lặng đã cấu hình và gửi chúng dưới dạng một yêu cầu `turn/steer` theo
thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
review và Compaction thủ công của Codex có thể từ chối điều hướng cùng lượt, trong trường hợp đó
OpenClaw dùng hàng đợi theo sau khi chế độ đã chọn cho phép dự phòng. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng harness Codex, Compaction luồng gốc được
ủy quyền cho app-server Codex. OpenClaw giữ một bản phản chiếu transcript cho lịch sử
kênh, tìm kiếm, `/new`, `/reset` và việc chuyển đổi mô hình hoặc harness trong tương lai. Bản
phản chiếu bao gồm prompt của người dùng, văn bản trợ lý cuối cùng và các bản ghi suy luận hoặc kế hoạch
Codex nhẹ khi app-server phát ra chúng. Hiện nay, OpenClaw chỉ
ghi nhận tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa hiển thị
tóm tắt Compaction dạng người đọc được hoặc danh sách có thể kiểm toán về những mục Codex
đã giữ sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn tắc, `tool_result_persist` hiện không
viết lại các bản ghi kết quả công cụ gốc Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ transcript phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và hiểu phương tiện
tiếp tục dùng các thiết lập nhà cung cấp/mô hình tương ứng như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một nhà cung cấp `/model` thông thường:** điều đó là dự kiến đối với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc một tham chiếu `codex/*` cũ), bật
`plugins.entries.codex.enabled` và kiểm tra liệu `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex khi kiểm thử. Một
runtime Codex bắt buộc hiện sẽ thất bại thay vì quay về PI trừ khi bạn
đặt rõ `agentRuntime.fallback: "pi"`. Khi app-server Codex được
chọn, lỗi của nó sẽ hiển thị trực tiếp mà không cần cấu hình dự phòng bổ sung.

**app-server bị từ chối:** nâng cấp Codex để quá trình bắt tay app-server
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các bản prerelease cùng phiên bản hoặc bản có hậu tố build
như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
sàn giao thức ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo app-server từ xa nói cùng phiên bản giao thức app-server Codex.

**Một mô hình không phải Codex dùng PI:** điều đó là dự kiến trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho tác tử đó hoặc chọn một tham chiếu
`codex/*` cũ. Các tham chiếu `openai/gpt-*` thuần và nhà cung cấp khác vẫn đi theo
đường dẫn nhà cung cấp thông thường trong chế độ `auto`. Nếu bạn buộc `agentRuntime.id: "codex"`, mọi lượt nhúng
cho tác tử đó phải là mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu vẫn còn, khởi động lại
gateway để xóa các đăng ký hook gốc cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, khởi động lại Codex Computer Use hoặc Codex Desktop rồi thử lại.

## Liên quan

- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook Plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
