---
read_when:
    - Bạn muốn sử dụng bộ khung máy chủ ứng dụng Codex đi kèm
    - Bạn cần các ví dụ về cấu hình bộ khung của Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác nhân nhúng OpenClaw thông qua bộ khung app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-04-29T22:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8eba5cb48c94fe38392d85c9d5c79a7829a2fa7eaba81715f4449d39d7d0dea
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt tác nhân nhúng thông qua
máy chủ ứng dụng Codex thay vì harness PI tích hợp sẵn.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên tác nhân cấp thấp: khám phá
mô hình, tiếp tục luồng gốc, compaction gốc và thực thi trên máy chủ ứng dụng.
OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình, công cụ,
phê duyệt, phân phối phương tiện và bản phản chiếu transcript hiển thị.

Nếu bạn đang tìm cách định hướng, hãy bắt đầu với
[Runtime của tác nhân](/vi/concepts/agent-runtimes). Bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, còn Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số khả năng riêng biệt:

| Khả năng                          | Cách bạn dùng                                      | Việc nó làm                                                                    |
| --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime nhúng gốc                 | `agentRuntime.id: "codex"`                        | Chạy các lượt tác nhân nhúng của OpenClaw thông qua máy chủ ứng dụng Codex.    |
| Lệnh điều khiển trò chuyện gốc    | `/codex bind`, `/codex resume`, `/codex steer`, ... | Liên kết và điều khiển các luồng máy chủ ứng dụng Codex từ cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục máy chủ ứng dụng Codex | nội bộ `codex`, được hiển thị thông qua harness | Cho phép runtime khám phá và xác thực các mô hình máy chủ ứng dụng.            |
| Đường dẫn hiểu phương tiện Codex  | đường dẫn tương thích mô hình ảnh `codex/*`       | Chạy các lượt máy chủ ứng dụng Codex có giới hạn cho các mô hình hiểu ảnh được hỗ trợ. |
| Chuyển tiếp hook gốc              | Hook Plugin quanh các sự kiện gốc của Codex       | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất gốc của Codex được hỗ trợ. |

Bật Plugin sẽ làm các khả năng đó sẵn dùng. Việc này **không**:

- bắt đầu dùng Codex cho mọi mô hình OpenAI
- chuyển các tham chiếu mô hình `openai-codex/*` sang runtime gốc
- đặt ACP/acpx làm đường dẫn Codex mặc định
- chuyển nóng các phiên hiện có đã ghi nhận runtime PI
- thay thế việc phân phối kênh, tệp phiên, lưu trữ hồ sơ xác thực hoặc
  định tuyến tin nhắn của OpenClaw

Plugin này cũng sở hữu bề mặt lệnh điều khiển trò chuyện gốc `/codex`. Nếu
Plugin được bật và người dùng yêu cầu liên kết, tiếp tục, điều hướng, dừng hoặc
kiểm tra các luồng Codex từ trò chuyện, tác nhân nên ưu tiên `/codex ...` hơn
ACP. ACP vẫn là phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc
đang kiểm thử bộ chuyển đổi ACP Codex.

Các lượt Codex gốc giữ hook Plugin OpenClaw làm lớp tương thích công khai.
Đây là các hook OpenClaw trong tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho các bản ghi transcript phản chiếu
- `before_agent_finalize` thông qua chuyển tiếp `Stop` của Codex
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập runtime để viết
lại kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và trước
khi kết quả được trả về Codex. Điều này tách biệt với hook Plugin công khai
`tool_result_persist`, vốn chuyển đổi các lần ghi kết quả công cụ transcript do
OpenClaw sở hữu.

Để biết ngữ nghĩa của chính các hook Plugin, xem [Hook Plugin](/vi/plugins/hooks)
và [Hành vi bảo vệ Plugin](/vi/tools/plugin).

Harness bị tắt theo mặc định. Cấu hình mới nên giữ tham chiếu mô hình OpenAI
chuẩn tắc là `openai/gpt-*` và buộc rõ ràng
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi muốn thực thi
gốc trên máy chủ ứng dụng. Các tham chiếu mô hình `codex/*` cũ vẫn tự động chọn
harness để tương thích, nhưng các tiền tố nhà cung cấp cũ được runtime hỗ trợ
không được hiển thị như lựa chọn mô hình/nhà cung cấp thông thường.

Nếu Plugin `codex` được bật nhưng mô hình chính vẫn là `openai-codex/*`,
`openclaw doctor` sẽ cảnh báo thay vì thay đổi tuyến. Đây là chủ ý:
`openai-codex/*` vẫn là đường dẫn OAuth/thuê bao PI Codex, còn thực thi gốc trên
máy chủ ứng dụng vẫn là lựa chọn runtime rõ ràng.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                          | Tham chiếu mô hình       | Cấu hình runtime                       | Yêu cầu Plugin              | Nhãn trạng thái dự kiến        |
| ------------------------------------------ | ------------------------ | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API thông qua trình chạy OpenClaw bình thường | `openai/gpt-*`             | bỏ qua hoặc `runtime: "pi"`            | Nhà cung cấp OpenAI         | `Runtime: OpenClaw Pi Default` |
| OAuth/thuê bao Codex thông qua PI          | `openai-codex/gpt-*`     | bỏ qua hoặc `runtime: "pi"`            | Nhà cung cấp OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Lượt nhúng máy chủ ứng dụng Codex gốc      | `openai/gpt-*`           | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Nhiều nhà cung cấp với chế độ tự động thận trọng | tham chiếu riêng theo nhà cung cấp | `agentRuntime.id: "auto"`              | Runtime Plugin tùy chọn     | Phụ thuộc vào runtime đã chọn  |
| Phiên bộ chuyển đổi Codex ACP rõ ràng      | phụ thuộc prompt/mô hình ACP | `sessions_spawn` với `runtime: "acp"` | backend `acpx` khỏe mạnh    | Trạng thái tác vụ/phiên ACP    |

Phần tách quan trọng là nhà cung cấp so với runtime:

- `openai-codex/*` trả lời "PI nên dùng tuyến nhà cung cấp/xác thực nào?"
- `agentRuntime.id: "codex"` trả lời "vòng lặp nào nên thực thi lượt nhúng này?"
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào nên được trò chuyện này
  liên kết hoặc điều khiển?"
- ACP trả lời "tiến trình harness bên ngoài nào acpx nên khởi chạy?"

## Chọn đúng tiền tố mô hình

Các tuyến họ OpenAI phụ thuộc vào tiền tố. Dùng `openai-codex/*` khi bạn muốn
OAuth Codex thông qua PI; dùng `openai/*` khi bạn muốn truy cập trực tiếp OpenAI
API hoặc khi bạn đang buộc harness máy chủ ứng dụng Codex gốc:

| Tham chiếu mô hình                          | Đường dẫn runtime                            | Dùng khi                                                                    |
| ------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | Nhà cung cấp OpenAI thông qua hệ thống OpenClaw/PI | Bạn muốn truy cập OpenAI Platform API trực tiếp hiện tại bằng `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | OAuth OpenAI Codex thông qua OpenClaw/PI     | Bạn muốn xác thực thuê bao ChatGPT/Codex với trình chạy PI mặc định.        |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness máy chủ ứng dụng Codex               | Bạn muốn thực thi gốc trên máy chủ ứng dụng Codex cho lượt tác nhân nhúng.  |

GPT-5.5 hiện chỉ dùng được qua thuê bao/OAuth trong OpenClaw. Dùng
`openai-codex/gpt-5.5` cho OAuth PI, hoặc `openai/gpt-5.5` với harness máy chủ
ứng dụng Codex. Truy cập bằng khóa API trực tiếp cho `openai/gpt-5.5` được hỗ trợ
khi OpenAI bật GPT-5.5 trên API công khai.

Các tham chiếu `codex/gpt-*` cũ vẫn được chấp nhận làm bí danh tương thích. Di
chuyển tương thích của Doctor viết lại các tham chiếu runtime chính cũ thành
tham chiếu mô hình chuẩn tắc và ghi chính sách runtime riêng, còn các tham chiếu
cũ chỉ dùng làm dự phòng được giữ nguyên vì runtime được cấu hình cho toàn bộ
vùng chứa tác nhân. Cấu hình OAuth PI Codex mới nên dùng `openai-codex/gpt-*`;
cấu hình harness máy chủ ứng dụng gốc mới nên dùng `openai/gpt-*` cộng với
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng
`openai-codex/gpt-*` khi hiểu ảnh nên chạy qua đường dẫn nhà cung cấp OAuth
OpenAI Codex. Dùng `codex/gpt-*` khi hiểu ảnh nên chạy qua một lượt máy chủ ứng
dụng Codex có giới hạn. Mô hình máy chủ ứng dụng Codex phải quảng bá hỗ trợ đầu
vào ảnh; các mô hình Codex chỉ văn bản sẽ thất bại trước khi lượt phương tiện bắt
đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn gây
bất ngờ, hãy bật ghi nhật ký gỡ lỗi cho phân hệ `agents/harness` và kiểm tra bản
ghi có cấu trúc `agent harness selected` của Gateway. Nó bao gồm id harness đã
chọn, lý do lựa chọn, chính sách runtime/dự phòng và, trong chế độ `auto`, kết
quả hỗ trợ của từng ứng viên Plugin.

### Ý nghĩa cảnh báo của doctor

`openclaw doctor` cảnh báo khi tất cả điều sau đều đúng:

- Plugin `codex` đi kèm được bật hoặc được cho phép
- mô hình chính của một tác nhân là `openai-codex/*`
- runtime hiệu lực của tác nhân đó không phải là `codex`

Cảnh báo đó tồn tại vì người dùng thường kỳ vọng "Plugin Codex đã bật" đồng nghĩa
với "runtime máy chủ ứng dụng Codex gốc." OpenClaw không tự suy diễn như vậy.
Cảnh báo có nghĩa là:

- **Không cần thay đổi** nếu bạn dự định dùng OAuth ChatGPT/Codex thông qua PI.
- Đổi mô hình thành `openai/<model>` và đặt
  `agentRuntime.id: "codex"` nếu bạn dự định thực thi gốc trên máy chủ ứng dụng.
- Các phiên hiện có vẫn cần `/new` hoặc `/reset` sau khi thay đổi runtime,
  vì ghim runtime của phiên là cố định.

Lựa chọn harness không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng
chạy, OpenClaw ghi id harness đã chọn vào phiên đó và tiếp tục dùng nó cho các
lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng harness khác; dùng
`/new` hoặc `/reset` để bắt đầu phiên mới trước khi chuyển một cuộc trò chuyện
hiện có giữa PI và Codex. Điều này tránh phát lại một transcript qua hai hệ
thống phiên gốc không tương thích.

Các phiên cũ được tạo trước khi có ghim harness được xem là đã ghim PI sau khi
chúng có lịch sử transcript. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó
vào Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình hiệu lực. Harness PI mặc định xuất hiện là
`Runtime: OpenClaw Pi Default`, và harness máy chủ ứng dụng Codex xuất hiện là
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có Plugin `codex` đi kèm sẵn dùng.
- Máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Plugin đi kèm quản lý mặc định
  một tệp nhị phân máy chủ ứng dụng Codex tương thích, nên các lệnh `codex` cục
  bộ trên `PATH` không ảnh hưởng đến khởi động harness bình thường.
- Xác thực Codex sẵn dùng cho tiến trình máy chủ ứng dụng hoặc cho cầu nối xác
  thực Codex của OpenClaw.

Plugin chặn các bắt tay máy chủ ứng dụng cũ hơn hoặc không có phiên bản. Điều đó
giữ OpenClaw trên bề mặt giao thức đã được kiểm thử.

Đối với kiểm thử smoke trực tiếp và Docker, xác thực thường đến từ tài khoản CLI
Codex hoặc hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy máy chủ
ứng dụng stdio cục bộ cũng có thể dự phòng sang `CODEX_API_KEY` /
`OPENAI_API_KEY` khi không có tài khoản.

## Cấu hình tối thiểu

Dùng `openai/gpt-5.5`, bật Plugin đi kèm và buộc harness `codex`:

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

Nếu cấu hình của bạn dùng `plugins.allow`, hãy thêm `codex` vào đó nữa:

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

Các cấu hình cũ đặt `agents.defaults.model` hoặc mô hình tác nhân thành
`codex/<model>` vẫn tự động bật Plugin `codex` đi kèm. Cấu hình mới nên ưu tiên
`openai/<model>` cộng với mục `agentRuntime` rõ ràng ở trên.

## Thêm Codex cùng với các mô hình khác

Không đặt `agentRuntime.id: "codex"` toàn cục nếu cùng một tác nhân cần tự do
chuyển đổi giữa Codex và các mô hình nhà cung cấp không phải Codex. Runtime bị
buộc áp dụng cho mọi lượt nhúng của tác nhân hoặc phiên đó. Nếu bạn chọn một mô
hình Anthropic trong khi runtime đó đang bị buộc, OpenClaw vẫn thử harness Codex
và đóng lỗi thay vì âm thầm định tuyến lượt đó qua PI.

Thay vào đó, hãy dùng một trong các dạng này:

- Đặt Codex trên một tác tử chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ tác tử mặc định trên `agentRuntime.id: "auto"` và phương án dự phòng PI cho cách dùng nhà cung cấp hỗn hợp thông thường.
- Chỉ dùng các tham chiếu `codex/*` cũ để tương thích. Cấu hình mới nên ưu tiên `openai/*` cùng một chính sách runtime Codex rõ ràng.

Ví dụ, cấu hình này giữ tác tử mặc định dùng lựa chọn tự động thông thường và thêm một tác tử Codex riêng:

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

- Tác tử `main` mặc định dùng đường dẫn nhà cung cấp thông thường và phương án dự phòng tương thích PI.
- Tác tử `codex` dùng harness app-server Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho tác tử `codex`, lượt chạy sẽ thất bại thay vì âm thầm dùng PI.

## Định tuyến lệnh tác tử

Tác tử nên định tuyến yêu cầu của người dùng theo ý định, không chỉ theo riêng từ "Codex":

| Người dùng yêu cầu...                                    | Tác tử nên dùng...                                |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Gắn cuộc trò chuyện này với Codex"                       | `/codex bind`                                    |
| "Tiếp tục luồng Codex `<id>` tại đây"                    | `/codex resume <id>`                             |
| "Hiển thị các luồng Codex"                               | `/codex threads`                                 |
| "Gửi báo cáo hỗ trợ cho một lượt chạy Codex lỗi"         | `/diagnostics [note]`                            |
| "Chỉ gửi phản hồi Codex cho luồng được đính kèm này"     | `/codex diagnostics [note]`                      |
| "Dùng Codex làm runtime cho tác tử này"                  | thay đổi cấu hình sang `agentRuntime.id`         |
| "Dùng đăng ký ChatGPT/Codex của tôi với OpenClaw thường" | các tham chiếu mô hình `openai-codex/*`          |
| "Chạy Codex qua ACP/acpx"                                | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Khởi động Claude Code/Gemini/OpenCode/Cursor trong luồng" | ACP/acpx, không phải `/codex` và không phải tác tử con gốc |

OpenClaw chỉ quảng bá hướng dẫn spawn ACP cho tác tử khi ACP được bật, có thể điều phối, và được hỗ trợ bởi một backend runtime đã tải. Nếu ACP không khả dụng, system prompt và Skills của plugin không nên hướng dẫn tác tử về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép dùng harness Codex khi bạn cần chứng minh rằng mọi lượt tác tử nhúng đều dùng Codex. Runtime plugin rõ ràng mặc định không có phương án dự phòng PI, nên `fallback: "none"` là tùy chọn nhưng thường hữu ích như tài liệu:

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

Khi Codex bị ép dùng, OpenClaw thất bại sớm nếu plugin Codex bị tắt, app-server quá cũ, hoặc app-server không thể khởi động. Chỉ đặt `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nếu bạn chủ ý muốn PI xử lý trường hợp thiếu lựa chọn harness.

## Codex theo từng tác tử

Bạn có thể làm cho một tác tử chỉ dùng Codex trong khi tác tử mặc định vẫn giữ lựa chọn tự động thông thường:

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

Dùng các lệnh phiên thông thường để chuyển đổi tác tử và mô hình. `/new` tạo một phiên OpenClaw mới và harness Codex tạo hoặc tiếp tục luồng app-server sidecar của nó khi cần. `/reset` xóa liên kết phiên OpenClaw cho luồng đó và cho phép lượt tiếp theo phân giải harness lại từ cấu hình hiện tại.

## Khám phá mô hình

Theo mặc định, plugin Codex hỏi app-server về các mô hình khả dụng. Nếu khám phá thất bại hoặc hết thời gian chờ, nó dùng danh mục dự phòng đi kèm cho:

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

Theo mặc định, plugin khởi động nhị phân Codex được OpenClaw quản lý cục bộ với:

```bash
codex app-server --listen stdio://
```

Nhị phân được quản lý được khai báo là một phụ thuộc runtime plugin đi kèm và được stage cùng phần còn lại của các phụ thuộc plugin `codex`. Điều này giữ phiên bản app-server gắn với plugin đi kèm thay vì bất kỳ Codex CLI riêng nào đang được cài cục bộ. Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một executable khác.

Theo mặc định, OpenClaw khởi động các phiên harness Codex cục bộ ở chế độ YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"`, và `sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ đáng tin cậy dùng cho các Heartbeat tự chủ: Codex có thể dùng công cụ shell và mạng mà không dừng lại ở các lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

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

Chế độ Guardian dùng đường dẫn phê duyệt tự động xem xét gốc của Codex. Khi Codex yêu cầu rời sandbox, ghi bên ngoài workspace, hoặc thêm quyền như truy cập mạng, Codex định tuyến yêu cầu phê duyệt đó đến reviewer gốc thay vì lời nhắc con người. Reviewer áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối yêu cầu cụ thể. Dùng Guardian khi bạn muốn nhiều rào chắn hơn chế độ YOLO nhưng vẫn cần tác tử không có người giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`. Các trường chính sách riêng lẻ vẫn ghi đè `mode`, nên các triển khai nâng cao có thể kết hợp preset với lựa chọn rõ ràng. Giá trị reviewer cũ hơn `guardian_subagent` vẫn được chấp nhận như một bí danh tương thích, nhưng cấu hình mới nên dùng `auto_review`.

Với app-server đã chạy sẵn, dùng transport WebSocket:

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

Các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của OpenClaw theo mặc định, nhưng OpenClaw sở hữu cầu nối tài khoản app-server Codex. Xác thực được chọn theo thứ tự này:

1. Hồ sơ xác thực OpenClaw Codex rõ ràng cho tác tử.
2. Tài khoản hiện có của app-server, chẳng hạn như một lần đăng nhập ChatGPT Codex CLI cục bộ.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, sau đó `OPENAI_API_KEY`, khi không có tài khoản app-server và xác thực OpenAI vẫn được yêu cầu.

Khi OpenClaw thấy hồ sơ xác thực Codex kiểu đăng ký ChatGPT, nó xóa `CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được spawn. Điều đó giữ các khóa API cấp Gateway khả dụng cho embeddings hoặc mô hình OpenAI trực tiếp mà không khiến các lượt app-server Codex gốc vô tình tính phí qua API. Hồ sơ khóa API Codex rõ ràng và phương án dự phòng khóa môi trường stdio cục bộ dùng đăng nhập app-server thay vì môi trường tiến trình con được kế thừa. Kết nối app-server WebSocket không nhận phương án dự phòng khóa API môi trường Gateway; hãy dùng hồ sơ xác thực rõ ràng hoặc tài khoản riêng của app-server từ xa.

Nếu một triển khai cần cách ly môi trường bổ sung, hãy thêm các biến đó vào `appServer.clearEnv`:

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex được spawn.

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                 | Ý nghĩa                                                                                                                             |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` sinh Codex; `"websocket"` kết nối tới `url`.                                                                              |
| `command`           | tệp nhị phân Codex được quản lý          | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                         |
| `url`               | chưa đặt                                 | URL app-server WebSocket.                                                                                                           |
| `authToken`         | chưa đặt                                 | Bearer token cho transport WebSocket.                                                                                               |
| `headers`           | `{}`                                     | Header WebSocket bổ sung.                                                                                                           |
| `clearEnv`          | `[]`                                     | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được sinh sau khi OpenClaw dựng môi trường kế thừa của nó.      |
| `requestTimeoutMs`  | `60000`                                  | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển app-server.                                                                     |
| `mode`              | `"yolo"`                                 | Thiết lập sẵn cho thực thi YOLO hoặc thực thi được guardian xem xét.                                                                |
| `approvalPolicy`    | `"never"`                                | Chính sách phê duyệt Codex gốc được gửi tới thread start/resume/turn.                                                               |
| `sandbox`           | `"danger-full-access"`                   | Chế độ sandbox Codex gốc được gửi tới thread start/resume.                                                                          |
| `approvalsReviewer` | `"user"`                                 | Dùng `"auto_review"` để cho Codex xem xét các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là bí danh cũ.                        |
| `serviceTier`       | chưa đặt                                 | Tầng dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị cũ không hợp lệ sẽ bị bỏ qua.                  |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín
hiệu công cụ nếu được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex
để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt của Codex,
harness cũng kỳ vọng Codex kết thúc lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong 60 giây sau phản hồi đó, OpenClaw cố gắng ngắt lượt
Codex, ghi lại thời gian chờ chẩn đoán, và giải phóng làn phiên OpenClaw để các
tin nhắn trò chuyện tiếp theo không bị xếp hàng sau một lượt gốc đã cũ.

Các ghi đè môi trường vẫn có sẵn cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị xóa. Thay vào đó hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được xem xét với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Computer Use được trình bày trong hướng dẫn thiết lập riêng:
[Codex Computer Use](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không đóng gói ứng dụng điều khiển máy tính để bàn
hoặc tự thực thi các thao tác trên máy tính để bàn. Nó chuẩn bị app-server Codex,
xác minh rằng máy chủ MCP `computer-use` có sẵn, rồi để Codex xử lý các lệnh gọi
công cụ MCP gốc trong các lượt chế độ Codex.

Để truy cập trực tiếp driver TryCua bên ngoài luồng marketplace của Codex, hãy đăng ký
`cua-driver mcp` bằng `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Xem [Codex Computer Use](/vi/plugins/codex-computer-use) để biết sự khác biệt
giữa Computer Use do Codex sở hữu và đăng ký MCP trực tiếp.

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

Computer Use dành riêng cho macOS và có thể yêu cầu quyền hệ điều hành cục bộ
trước khi máy chủ MCP Codex có thể điều khiển ứng dụng. Nếu
`computerUse.enabled` là true và máy chủ MCP không có sẵn, các lượt chế độ Codex
sẽ thất bại trước khi thread bắt đầu thay vì âm thầm chạy mà không có công cụ
Computer Use gốc. Xem [Codex Computer Use](/vi/plugins/codex-computer-use) để biết
các lựa chọn marketplace, giới hạn danh mục từ xa, lý do trạng thái và cách khắc
phục sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace
Codex Desktop chuẩn được đóng gói từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi thay đổi
cấu hình runtime hoặc Computer Use để các phiên hiện có không giữ liên kết Pi
hoặc thread Codex cũ.

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

Xác thực harness chỉ dành cho Codex:

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

Việc chuyển đổi mô hình vẫn do OpenClaw kiểm soát. Khi một phiên OpenClaw được
gắn vào một thread Codex hiện có, lượt tiếp theo lại gửi mô hình OpenAI, provider,
chính sách phê duyệt, sandbox và tầng dịch vụ hiện được chọn tới app-server.
Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ nguyên liên kết thread nhưng
yêu cầu Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin được đóng gói đăng ký `/codex` làm lệnh gạch chéo được ủy quyền. Lệnh này
có tính chung và hoạt động trên bất kỳ kênh nào hỗ trợ lệnh văn bản OpenClaw.

Các dạng thường dùng:

- `/codex status` hiển thị kết nối app-server trực tiếp, mô hình, tài khoản, giới hạn tốc độ, máy chủ MCP và skills.
- `/codex models` liệt kê các mô hình app-server Codex trực tiếp.
- `/codex threads [filter]` liệt kê các thread Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một thread Codex hiện có.
- `/codex compact` yêu cầu app-server Codex nén thread đã gắn.
- `/codex review` bắt đầu đánh giá gốc của Codex cho thread đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho thread đã gắn.
- `/codex computer-use status` kiểm tra Plugin Computer Use và máy chủ MCP đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Computer Use đã cấu hình và tải lại máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của app-server Codex.
- `/codex skills` liệt kê các skills của app-server Codex.

### Quy trình gỡ lỗi thường dùng

Khi một agent dựa trên Codex làm điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu từ cuộc trò chuyện nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả điều bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán Gateway
   cục bộ và, vì phiên đang dùng harness Codex, cũng gửi gói phản hồi Codex liên quan
   tới máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc thread hỗ trợ.
   Phản hồi bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id thread Codex và một dòng `Inspect locally` cho từng thread Codex.
4. Nếu bạn muốn tự gỡ lỗi lần chạy, hãy chạy lệnh `Inspect locally` được in ra
   trong terminal. Lệnh này có dạng `codex resume <thread-id>` và mở thread Codex
   gốc để bạn có thể kiểm tra cuộc trò chuyện, tiếp tục cục bộ, hoặc hỏi Codex vì
   sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex lên
cho thread hiện được gắn mà không cần toàn bộ gói chẩn đoán Gateway của OpenClaw.
Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là điểm bắt đầu tốt hơn vì nó
liên kết trạng thái Gateway cục bộ và id thread Codex trong một phản hồi. Xem
[Diagnostics export](/vi/gateway/diagnostics) để biết đầy đủ mô hình quyền riêng tư
và hành vi trò chuyện nhóm.

Lõi OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho owner dưới dạng lệnh
chẩn đoán Gateway chung. Lời nhắc phê duyệt của lệnh này hiển thị phần mở đầu về
dữ liệu nhạy cảm, liên kết tới [Diagnostics Export](/vi/gateway/diagnostics), và yêu
cầu `openclaw gateway diagnostics export --json` thông qua phê duyệt exec rõ ràng
mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê duyệt,
OpenClaw gửi một báo cáo có thể dán với đường dẫn gói cục bộ và tóm tắt manifest.
Khi phiên OpenClaw đang hoạt động dùng harness Codex, cùng phê duyệt đó cũng cho
phép gửi các gói phản hồi Codex liên quan tới máy chủ OpenAI. Lời nhắc phê duyệt
nói rằng phản hồi Codex sẽ được gửi, nhưng không liệt kê id phiên hoặc thread
Codex trước khi phê duyệt.

Nếu `/diagnostics` được một owner gọi trong trò chuyện nhóm, OpenClaw giữ cho kênh
chung gọn gàng: nhóm chỉ nhận một thông báo ngắn, trong khi phần mở đầu chẩn đoán,
lời nhắc phê duyệt và id phiên/thread Codex được gửi tới owner qua tuyến phê duyệt
riêng tư. Nếu không có tuyến owner riêng tư, OpenClaw từ chối yêu cầu nhóm và yêu
cầu owner chạy lệnh từ DM.

Các lệnh tải lên Codex đã được phê duyệt gọi `feedback/upload` của máy chủ ứng dụng Codex và yêu cầu
máy chủ ứng dụng bao gồm nhật ký cho từng luồng được liệt kê và các luồng con Codex đã sinh
khi có sẵn. Quá trình tải lên đi qua đường dẫn phản hồi thông thường của Codex tới các máy chủ
OpenAI; nếu phản hồi Codex bị tắt trong máy chủ ứng dụng đó, lệnh sẽ trả về
lỗi của máy chủ ứng dụng. Phản hồi chẩn đoán hoàn tất liệt kê các kênh,
id phiên OpenClaw, id luồng Codex và các lệnh `codex resume <thread-id>`
cục bộ cho các luồng đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không in các id Codex đó. Lần tải lên này không thay thế bản xuất
chẩn đoán Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết đi kèm mà bộ kiểm thử dùng cho
các lượt thông thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền
mô hình OpenClaw hiện được chọn vào máy chủ ứng dụng, và giữ lịch sử mở rộng
ở trạng thái bật.

### Kiểm tra một luồng Codex từ CLI

Cách nhanh nhất để hiểu một lần chạy Codex lỗi thường là mở trực tiếp
luồng Codex gốc:

```sh
codex resume <thread-id>
```

Dùng cách này khi bạn nhận thấy lỗi trong một cuộc trò chuyện kênh và muốn kiểm tra
phiên Codex có vấn đề, tiếp tục phiên đó cục bộ, hoặc hỏi Codex vì sao nó đã chọn
một công cụ hoặc hướng suy luận cụ thể. Đường dẫn dễ nhất thường là chạy
`/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo hoàn tất sẽ liệt kê
từng luồng Codex và in một lệnh `Inspect locally`, ví dụ
`codex resume <thread-id>`. Bạn có thể sao chép lệnh đó trực tiếp vào terminal.

Bạn cũng có thể lấy id luồng từ `/codex binding` cho cuộc trò chuyện hiện tại hoặc
`/codex threads [filter]` cho các luồng máy chủ ứng dụng Codex gần đây, rồi chạy cùng
lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Từng
phương thức điều khiển được báo cáo là `unsupported by this Codex app-server` nếu một
máy chủ ứng dụng trong tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Bộ kiểm thử Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Khả năng tương thích sản phẩm/plugin giữa bộ kiểm thử PI và Codex.  |
| Middleware mở rộng máy chủ ứng dụng Codex | Các plugin đi kèm OpenClaw | Hành vi bộ chuyển đổi theo từng lượt quanh các công cụ động OpenClaw. |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin OpenClaw. Với cầu nối công cụ gốc và quyền được hỗ trợ,
OpenClaw tiêm cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest`, và `Stop`. Các hook Codex khác như `SessionStart` và
`UserPromptSubmit` vẫn là các điều khiển cấp Codex; chúng không được phơi bày dưới dạng
hook Plugin OpenClaw trong hợp đồng v1.

Với các công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, nên OpenClaw kích hoạt hành vi plugin và middleware mà nó sở hữu trong
bộ chuyển đổi kiểm thử. Với các công cụ gốc Codex, Codex sở hữu bản ghi công cụ chuẩn.
OpenClaw có thể phản chiếu một số sự kiện được chọn, nhưng không thể viết lại luồng Codex
gốc trừ khi Codex phơi bày thao tác đó qua máy chủ ứng dụng hoặc callback hook
gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo máy chủ ứng dụng Codex
và trạng thái bộ chuyển đổi OpenClaw, không phải từ các lệnh hook Codex gốc.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và
`llm_output` của OpenClaw là các quan sát cấp bộ chuyển đổi, không phải bản chụp
từng byte của yêu cầu nội bộ hoặc payload Compaction của Codex.

Thông báo máy chủ ứng dụng `hook/started` và `hook/completed` gốc của Codex được
chiếu thành các sự kiện tác nhân `codex_app_server.hook` để theo dõi quỹ đạo và gỡ lỗi.
Chúng không gọi các hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác ở bên dưới. Codex sở hữu nhiều hơn
vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt plugin và phiên của nó
quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                        | Hỗ trợ                                  | Lý do                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI qua Codex             | Được hỗ trợ                             | Máy chủ ứng dụng Codex sở hữu lượt OpenAI, tiếp tục luồng gốc, và tiếp tục công cụ gốc.                                                                                                             |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage, và các kênh khác nằm ngoài runtime mô hình.                                                                                                           |
| Công cụ động OpenClaw                         | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                     |
| Plugin lời nhắc và ngữ cảnh                   | Được hỗ trợ                             | OpenClaw xây dựng các lớp phủ lời nhắc và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                      |
| Vòng đời công cụ ngữ cảnh                     | Được hỗ trợ                             | Việc lắp ráp, nạp hoặc bảo trì sau lượt, và phối hợp Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                       |
| Hook công cụ động                             | Được hỗ trợ                             | `before_tool_call`, `after_tool_call`, và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                |
| Hook vòng đời                                 | Được hỗ trợ dưới dạng quan sát bộ chuyển đổi | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, và `after_compaction` kích hoạt với các payload chế độ Codex trung thực.                                                               |
| Cổng sửa đáp án cuối                          | Được hỗ trợ qua chuyển tiếp hook gốc    | Codex `Stop` được chuyển tiếp tới `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                               |
| Chặn hoặc quan sát shell, patch, và MCP gốc   | Được hỗ trợ qua chuyển tiếp hook gốc    | Codex `PreToolUse` và `PostToolUse` được chuyển tiếp cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Hỗ trợ chặn; không hỗ trợ viết lại đối số. |
| Chính sách quyền gốc                          | Được hỗ trợ qua chuyển tiếp hook gốc    | Codex `PermissionRequest` có thể được định tuyến qua chính sách OpenClaw khi runtime phơi bày nó. Nếu OpenClaw không trả về quyết định nào, Codex tiếp tục qua đường dẫn bảo vệ hoặc phê duyệt người dùng thông thường của nó. |
| Ghi lại quỹ đạo máy chủ ứng dụng              | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu nó đã gửi tới máy chủ ứng dụng và các thông báo máy chủ ứng dụng mà nó nhận được.                                                                                           |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                               | Ranh giới V1                                                                                                                                      | Đường hướng tương lai                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                          | Hook trước công cụ gốc Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc Codex.                                                 | Cần Codex hỗ trợ hook/schema cho đầu vào công cụ thay thế.                                  |
| Lịch sử bản ghi Codex gốc có thể chỉnh sửa           | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên đột biến nội bộ không được hỗ trợ. | Thêm API máy chủ ứng dụng Codex rõ ràng nếu cần chỉnh sửa luồng gốc.                        |
| `tool_result_persist` cho bản ghi công cụ gốc Codex  | Hook đó biến đổi các lần ghi bản ghi do OpenClaw sở hữu, không phải bản ghi công cụ gốc Codex.                                                     | Có thể phản chiếu các bản ghi đã biến đổi, nhưng việc viết lại chuẩn cần Codex hỗ trợ.      |
| Siêu dữ liệu Compaction gốc phong phú                | OpenClaw quan sát bắt đầu và hoàn tất Compaction, nhưng không nhận được danh sách giữ/bỏ ổn định, chênh lệch token, hoặc payload tóm tắt.          | Cần các sự kiện Compaction Codex phong phú hơn.                                             |
| Can thiệp Compaction                                 | Các hook Compaction OpenClaw hiện tại ở chế độ Codex là cấp thông báo.                                                                            | Thêm hook trước/sau Compaction của Codex nếu plugin cần phủ quyết hoặc viết lại Compaction gốc. |
| Ghi lại yêu cầu API mô hình từng byte                | OpenClaw có thể ghi lại yêu cầu và thông báo máy chủ ứng dụng, nhưng lõi Codex xây dựng yêu cầu API OpenAI cuối cùng ở bên trong.                  | Cần một sự kiện truy vết yêu cầu mô hình hoặc API gỡ lỗi Codex.                             |

## Công cụ, phương tiện, và Compaction

Bộ kiểm thử Codex chỉ thay đổi bộ thực thi tác nhân nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
bộ kiểm thử. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt, và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw thông thường.

Chuyển tiếp hook gốc được cố ý thiết kế chung, nhưng hợp đồng hỗ trợ v1
bị giới hạn ở các đường dẫn công cụ gốc Codex và quyền mà OpenClaw kiểm thử. Trong
runtime Codex, phần đó bao gồm các payload shell, patch, và MCP `PreToolUse`,
`PostToolUse`, và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
đều là bề mặt Plugin OpenClaw cho đến khi hợp đồng runtime nêu tên nó.

Với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xem đó là
không có quyết định hook và rơi về đường dẫn bảo vệ hoặc phê duyệt người dùng của chính nó.

Các yêu cầu phê duyệt công cụ MCP của Codex được định tuyến qua luồng phê duyệt
plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Các lời nhắc `request_user_input` của Codex được gửi lại về
cuộc trò chuyện xuất phát, và tin nhắn theo dõi tiếp theo trong hàng đợi sẽ trả lời yêu cầu
máy chủ gốc đó thay vì bị điều hướng như ngữ cảnh bổ sung. Các yêu cầu gợi mở MCP
khác vẫn thất bại đóng.

Khi mô hình được chọn sử dụng harness Codex, Compaction luồng gốc được
ủy quyền cho Codex app-server. OpenClaw giữ một bản sao biên bản hội thoại cho
lịch sử kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc harness
trong tương lai. Bản sao này bao gồm lời nhắc của người dùng, văn bản trả lời
cuối cùng của trợ lý, và các bản ghi lý luận hoặc kế hoạch nhẹ của Codex khi
app-server phát ra chúng. Hiện tại, OpenClaw chỉ ghi lại các tín hiệu bắt đầu và
hoàn tất Compaction gốc. OpenClaw chưa hiển thị bản tóm tắt Compaction mà con
người có thể đọc được hoặc danh sách có thể kiểm toán về những mục mà Codex
giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không ghi lại các
bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi OpenClaw đang ghi một
kết quả công cụ trong biên bản phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và hiểu phương
tiện tiếp tục dùng các cài đặt nhà cung cấp/mô hình phù hợp như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một nhà cung cấp `/model` thông thường:** điều đó là
dự kiến đối với cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc một tham chiếu `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra xem `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận lần chạy đó. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex trong khi kiểm thử. Runtime Codex
bị buộc hiện sẽ thất bại thay vì quay về PI, trừ khi bạn đặt rõ
`agentRuntime.fallback: "pi"`. Khi Codex app-server đã được chọn, các lỗi của nó
sẽ hiện trực tiếp mà không cần cấu hình fallback bổ sung.

**app-server bị từ chối:** nâng cấp Codex để quá trình bắt tay app-server
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các bản phát hành trước cùng phiên bản
hoặc phiên bản có hậu tố bản dựng như `0.125.0-alpha.2` hoặc `0.125.0+custom`
bị từ chối vì mức sàn giao thức ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Truyền tải WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo app-server từ xa dùng cùng phiên bản giao thức Codex app-server.

**Một mô hình không phải Codex dùng PI:** điều đó là dự kiến trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho tác tử đó hoặc chọn một tham chiếu `codex/*` cũ.
`openai/gpt-*` thuần và các tham chiếu nhà cung cấp khác vẫn đi theo đường dẫn
nhà cung cấp thông thường của chúng trong chế độ `auto`. Nếu bạn buộc
`agentRuntime.id: "codex"`, mọi lượt nhúng cho tác tử đó phải là mô hình OpenAI
được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, hãy dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn,
khởi động lại Gateway để xóa các đăng ký móc gốc cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, hãy khởi động lại Codex Computer Use hoặc Codex Desktop rồi thử lại.

## Liên quan

- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Móc Plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
