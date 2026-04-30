---
read_when:
    - Bạn muốn sử dụng bộ harness app-server Codex đi kèm
    - Bạn cần các ví dụ cấu hình bộ chạy Codex
    - Bạn muốn các bản triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác tử nhúng của OpenClaw thông qua bộ khung app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-04-30T20:05:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt tác tử nhúng thông qua
app-server Codex thay vì bộ chạy PI tích hợp.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên tác tử cấp thấp: khám phá mô hình,
tiếp tục luồng gốc, Compaction gốc và thực thi app-server.
OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình, công cụ,
phê duyệt, phân phối phương tiện và bản sao bản ghi hiển thị.

Nếu bạn đang cố định hướng, hãy bắt đầu với
[Runtime tác tử](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là môi trường chạy, còn Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số năng lực riêng biệt:

| Năng lực                           | Cách bạn dùng                                      | Chức năng                                                                      |
| ---------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Môi trường chạy nhúng gốc          | `agentRuntime.id: "codex"`                         | Chạy các lượt tác tử nhúng của OpenClaw thông qua app-server Codex.            |
| Lệnh điều khiển trò chuyện gốc     | `/codex bind`, `/codex resume`, `/codex steer`, ... | Liên kết và điều khiển các luồng app-server Codex từ một cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục app-server Codex | nội bộ `codex`, được hiển thị qua bộ chạy       | Cho phép môi trường chạy khám phá và xác thực các mô hình app-server.          |
| Đường dẫn hiểu phương tiện Codex   | các đường dẫn tương thích mô hình hình ảnh `codex/*` | Chạy các lượt app-server Codex có giới hạn cho các mô hình hiểu hình ảnh được hỗ trợ. |
| Chuyển tiếp hook gốc               | Plugin hook quanh các sự kiện Codex gốc            | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất Codex gốc được hỗ trợ. |

Bật Plugin sẽ làm các năng lực đó khả dụng. Nó **không**:

- bắt đầu dùng Codex cho mọi mô hình OpenAI
- chuyển các tham chiếu mô hình `openai-codex/*` thành môi trường chạy gốc
- đặt ACP/acpx làm đường dẫn Codex mặc định
- chuyển nóng các phiên hiện có đã ghi nhận một môi trường chạy PI
- thay thế phân phối kênh, tệp phiên, lưu trữ hồ sơ xác thực hoặc
  định tuyến tin nhắn của OpenClaw

Cùng Plugin này cũng sở hữu bề mặt lệnh điều khiển trò chuyện `/codex` gốc. Nếu
Plugin được bật và người dùng yêu cầu liên kết, tiếp tục, điều hướng, dừng hoặc kiểm tra
các luồng Codex từ trò chuyện, tác tử nên ưu tiên `/codex ...` thay vì ACP. ACP vẫn
là phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử bộ
chuyển đổi Codex ACP.

Các lượt Codex gốc giữ OpenClaw plugin hooks làm lớp tương thích công khai.
Đây là các OpenClaw hook trong tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho các bản ghi bản sao bản ghi
- `before_agent_finalize` thông qua chuyển tiếp Codex `Stop`
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập với môi trường chạy để viết lại
kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và trước khi
kết quả được trả về cho Codex. Điều này tách biệt với Plugin hook công khai
`tool_result_persist`, vốn biến đổi các lượt ghi kết quả công cụ trong bản ghi do OpenClaw sở hữu.

Để xem ngữ nghĩa của chính Plugin hook, hãy xem [Plugin hook](/vi/plugins/hooks)
và [Hành vi guard của Plugin](/vi/tools/plugin).

Bộ chạy tắt theo mặc định. Cấu hình mới nên giữ các tham chiếu mô hình OpenAI
chuẩn tắc là `openai/gpt-*` và ép rõ ràng
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi muốn
thực thi app-server gốc. Các tham chiếu mô hình `codex/*` cũ vẫn tự động chọn
bộ chạy để tương thích, nhưng các tiền tố nhà cung cấp cũ có môi trường chạy hỗ trợ
không được hiển thị như lựa chọn mô hình/nhà cung cấp thông thường.

Nếu Plugin `codex` được bật nhưng mô hình chính vẫn là
`openai-codex/*`, `openclaw doctor` sẽ cảnh báo thay vì thay đổi tuyến. Điều đó là
có chủ ý: `openai-codex/*` vẫn là đường dẫn OAuth/đăng ký PI Codex, và
thực thi app-server gốc vẫn là lựa chọn môi trường chạy rõ ràng.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                           | Tham chiếu mô hình         | Cấu hình môi trường chạy              | Yêu cầu Plugin              | Nhãn trạng thái dự kiến        |
| ------------------------------------------- | -------------------------- | ------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API qua trình chạy OpenClaw thông thường | `openai/gpt-*`          | bỏ qua hoặc `runtime: "pi"`           | Nhà cung cấp OpenAI         | `Runtime: OpenClaw Pi Default` |
| OAuth/đăng ký Codex qua PI                  | `openai-codex/gpt-*`       | bỏ qua hoặc `runtime: "pi"`           | Nhà cung cấp OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Lượt nhúng app-server Codex gốc             | `openai/gpt-*`             | `agentRuntime.id: "codex"`            | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Nhà cung cấp hỗn hợp với chế độ tự động thận trọng | tham chiếu theo nhà cung cấp | `agentRuntime.id: "auto"`         | Môi trường chạy Plugin tùy chọn | Phụ thuộc vào môi trường chạy đã chọn |
| Phiên bộ chuyển đổi ACP Codex rõ ràng       | phụ thuộc lời nhắc/mô hình ACP | `sessions_spawn` với `runtime: "acp"` | backend `acpx` khỏe mạnh | Trạng thái tác vụ/phiên ACP    |

Phần tách biệt quan trọng là nhà cung cấp so với môi trường chạy:

- `openai-codex/*` trả lời "PI nên dùng tuyến nhà cung cấp/xác thực nào?"
- `agentRuntime.id: "codex"` trả lời "vòng lặp nào nên thực thi lượt
  nhúng này?"
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào nên được trò chuyện này
  liên kết hoặc điều khiển?"
- ACP trả lời "tiến trình bộ chạy ngoài nào acpx nên khởi chạy?"

## Chọn đúng tiền tố mô hình

Các tuyến họ OpenAI phụ thuộc vào tiền tố. Dùng `openai-codex/*` khi bạn muốn
OAuth Codex qua PI; dùng `openai/*` khi bạn muốn truy cập OpenAI API trực tiếp hoặc
khi bạn đang ép bộ chạy app-server Codex gốc:

| Tham chiếu mô hình                            | Đường dẫn môi trường chạy                  | Dùng khi                                                                    |
| --------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Nhà cung cấp OpenAI qua hệ thống OpenClaw/PI | Bạn muốn truy cập OpenAI Platform API trực tiếp hiện tại với `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth qua OpenClaw/PI         | Bạn muốn xác thực đăng ký ChatGPT/Codex với trình chạy PI mặc định.         |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Bộ chạy app-server Codex                   | Bạn muốn thực thi app-server Codex gốc cho lượt tác tử nhúng.               |

GPT-5.5 hiện chỉ hỗ trợ đăng ký/OAuth trong OpenClaw. Dùng
`openai-codex/gpt-5.5` cho OAuth PI, hoặc `openai/gpt-5.5` với bộ chạy
app-server Codex. Truy cập khóa API trực tiếp cho `openai/gpt-5.5` được hỗ trợ
khi OpenAI bật GPT-5.5 trên API công khai.

Các tham chiếu `codex/gpt-*` cũ vẫn được chấp nhận dưới dạng bí danh tương thích. Di chuyển
tương thích của doctor viết lại các tham chiếu môi trường chạy chính cũ thành tham chiếu mô hình
chuẩn tắc và ghi nhận riêng chính sách môi trường chạy, trong khi các tham chiếu cũ chỉ dùng dự phòng
được giữ nguyên vì môi trường chạy được cấu hình cho toàn bộ bộ chứa tác tử.
Cấu hình PI Codex OAuth mới nên dùng `openai-codex/gpt-*`; cấu hình bộ chạy
app-server gốc mới nên dùng `openai/gpt-*` cộng với
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng
`openai-codex/gpt-*` khi hiểu hình ảnh nên chạy qua đường dẫn nhà cung cấp
OpenAI Codex OAuth. Dùng `codex/gpt-*` khi hiểu hình ảnh nên chạy
qua một lượt app-server Codex có giới hạn. Mô hình app-server Codex phải
quảng bá hỗ trợ đầu vào hình ảnh; mô hình Codex chỉ văn bản sẽ thất bại trước khi lượt phương tiện
bắt đầu.

Dùng `/status` để xác nhận bộ chạy hiệu lực cho phiên hiện tại. Nếu lựa chọn
gây bất ngờ, hãy bật ghi nhật ký gỡ lỗi cho hệ thống con `agents/harness`
và kiểm tra bản ghi có cấu trúc `agent harness selected` của Gateway. Nó
bao gồm id bộ chạy đã chọn, lý do chọn, chính sách môi trường chạy/dự phòng và,
trong chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Cảnh báo doctor có nghĩa gì

`openclaw doctor` cảnh báo khi tất cả điều sau đúng:

- Plugin `codex` đi kèm được bật hoặc được cho phép
- mô hình chính của một tác tử là `openai-codex/*`
- môi trường chạy hiệu lực của tác tử đó không phải `codex`

Cảnh báo đó tồn tại vì người dùng thường kỳ vọng "Plugin Codex được bật" đồng nghĩa
"môi trường chạy app-server Codex gốc." OpenClaw không tự suy diễn như vậy. Cảnh báo
có nghĩa là:

- **Không cần thay đổi** nếu bạn chủ định dùng OAuth ChatGPT/Codex qua PI.
- Đổi mô hình thành `openai/<model>` và đặt
  `agentRuntime.id: "codex"` nếu bạn chủ định thực thi app-server
  gốc.
- Các phiên hiện có vẫn cần `/new` hoặc `/reset` sau khi thay đổi môi trường chạy,
  vì ghim môi trường chạy của phiên là cố định.

Lựa chọn bộ chạy không phải điều khiển phiên trực tiếp. Khi một lượt nhúng chạy,
OpenClaw ghi id bộ chạy đã chọn vào phiên đó và tiếp tục dùng nó cho
các lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng bộ chạy khác;
dùng `/new` hoặc `/reset` để bắt đầu một phiên mới trước khi chuyển một cuộc trò chuyện hiện có
giữa PI và Codex. Điều này tránh phát lại một bản ghi qua
hai hệ thống phiên gốc không tương thích.

Các phiên cũ được tạo trước khi có ghim bộ chạy được coi là đã ghim PI sau khi chúng
có lịch sử bản ghi. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó vào
Codex sau khi thay đổi cấu hình.

`/status` hiển thị môi trường chạy mô hình hiệu lực. Bộ chạy PI mặc định xuất hiện là
`Runtime: OpenClaw Pi Default`, còn bộ chạy app-server Codex xuất hiện là
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- App-server Codex `0.125.0` hoặc mới hơn. Plugin đi kèm quản lý mặc định một
  tệp nhị phân app-server Codex tương thích, nên các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến khởi động bộ chạy thông thường.
- Xác thực Codex khả dụng cho tiến trình app-server hoặc cho cầu nối xác thực Codex của OpenClaw.
  Các lần khởi chạy app-server stdio cục bộ dùng thư mục home Codex do OpenClaw quản lý cho từng
  tác tử và một `HOME` con tách biệt, nên mặc định chúng không đọc tài khoản
  `~/.codex`, skills, plugins, cấu hình, trạng thái luồng hoặc
  `$HOME/.agents/skills` gốc cá nhân của bạn.

Plugin chặn các bắt tay app-server cũ hơn hoặc không có phiên bản. Điều đó giữ
OpenClaw trên bề mặt giao thức đã được kiểm thử.

Với kiểm thử khói trực tiếp và Docker, xác thực thường đến từ tài khoản Codex CLI
hoặc hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy app-server stdio cục bộ cũng có thể
dự phòng sang `CODEX_API_KEY` / `OPENAI_API_KEY` khi không có tài khoản.

## Cấu hình tối thiểu

Dùng `openai/gpt-5.5`, bật Plugin đi kèm và ép bộ chạy `codex`:

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

Các cấu hình cũ đặt `agents.defaults.model` hoặc mô hình tác tử thành
`codex/<model>` vẫn tự động bật Plugin `codex` đi kèm. Cấu hình mới nên
ưu tiên `openai/<model>` cộng với mục `agentRuntime` rõ ràng ở trên.

## Thêm Codex bên cạnh các mô hình khác

Không đặt `agentRuntime.id: "codex"` trên toàn cục nếu cùng một agent cần tự do chuyển đổi
giữa Codex và các model provider không phải Codex. Runtime bị ép buộc áp dụng cho mọi
lượt nhúng của agent hoặc phiên đó. Nếu bạn chọn một model Anthropic trong khi
runtime đó bị ép buộc, OpenClaw vẫn thử harness Codex và đóng lỗi
thay vì âm thầm định tuyến lượt đó qua PI.

Thay vào đó, hãy dùng một trong các dạng sau:

- Đặt Codex trên một agent chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ agent mặc định ở `agentRuntime.id: "auto"` và PI fallback cho cách dùng provider hỗn hợp
  thông thường.
- Chỉ dùng các tham chiếu `codex/*` cũ để tương thích. Cấu hình mới nên ưu tiên
  `openai/*` cùng với một chính sách runtime Codex rõ ràng.

Ví dụ, cấu hình này giữ agent mặc định ở chế độ chọn tự động bình thường và
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

- Agent `main` mặc định dùng đường dẫn provider thông thường và PI compatibility fallback.
- Agent `codex` dùng harness app-server của Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho agent `codex`, lượt sẽ lỗi
  thay vì âm thầm dùng PI.

## Định tuyến lệnh agent

Agent nên định tuyến yêu cầu người dùng theo ý định, không chỉ theo riêng từ "Codex":

| Người dùng yêu cầu...                                    | Agent nên dùng...                                 |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Gắn cuộc trò chuyện này với Codex"                      | `/codex bind`                                    |
| "Tiếp tục luồng Codex `<id>` ở đây"                      | `/codex resume <id>`                             |
| "Hiển thị các luồng Codex"                               | `/codex threads`                                 |
| "Gửi báo cáo hỗ trợ cho một lần chạy Codex lỗi"          | `/diagnostics [note]`                            |
| "Chỉ gửi phản hồi Codex cho luồng đính kèm này"          | `/codex diagnostics [note]`                      |
| "Dùng Codex làm runtime cho agent này"                   | thay đổi cấu hình thành `agentRuntime.id`        |
| "Dùng gói đăng ký ChatGPT/Codex của tôi với OpenClaw bình thường" | tham chiếu model `openai-codex/*`       |
| "Chạy Codex qua ACP/acpx"                                | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Khởi động Claude Code/Gemini/OpenCode/Cursor trong một luồng" | ACP/acpx, không phải `/codex` và không phải sub-agent gốc |

OpenClaw chỉ quảng bá hướng dẫn spawn ACP cho agent khi ACP được bật,
có thể dispatch và được hỗ trợ bởi một backend runtime đã tải. Nếu ACP không khả dụng,
system prompt và plugin skills không nên dạy agent về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép buộc harness Codex khi bạn cần chứng minh rằng mọi lượt agent nhúng
đều dùng Codex. Runtime plugin rõ ràng mặc định không có PI fallback, nên
`fallback: "none"` là tùy chọn nhưng thường hữu ích để làm tài liệu:

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

Khi Codex bị ép buộc, OpenClaw lỗi sớm nếu plugin Codex bị tắt, app-server
quá cũ, hoặc app-server không thể khởi động. Chỉ đặt
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nếu bạn cố ý muốn PI xử lý
trường hợp thiếu lựa chọn harness.

## Codex theo từng agent

Bạn có thể đặt một agent chỉ dùng Codex trong khi agent mặc định vẫn giữ
chế độ chọn tự động bình thường:

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

Dùng các lệnh phiên bình thường để chuyển đổi agent và model. `/new` tạo một
phiên OpenClaw mới và harness Codex tạo hoặc tiếp tục luồng app-server sidecar
khi cần. `/reset` xóa liên kết phiên OpenClaw cho luồng đó
và cho phép lượt tiếp theo phân giải harness từ cấu hình hiện tại lần nữa.

## Khám phá model

Theo mặc định, plugin Codex hỏi app-server về các model khả dụng. Nếu
khám phá thất bại hoặc hết thời gian chờ, nó dùng danh mục fallback được đóng gói cho:

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

Tắt khám phá khi bạn muốn quá trình khởi động tránh thăm dò Codex và giữ nguyên
danh mục fallback:

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

## Kết nối app-server và chính sách

Theo mặc định, plugin khởi động binary Codex do OpenClaw quản lý cục bộ với:

```bash
codex app-server --listen stdio://
```

Binary được quản lý được khai báo là dependency runtime plugin đóng gói và được stage
cùng với phần còn lại của các dependency plugin `codex`. Điều này giữ phiên bản app-server
gắn với plugin được đóng gói thay vì bất kỳ Codex CLI riêng nào
tình cờ được cài đặt cục bộ. Chỉ đặt `appServer.command` khi bạn
cố ý muốn chạy một tệp thực thi khác.

Theo mặc định, OpenClaw khởi động các phiên harness Codex cục bộ ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ đáng tin cậy được dùng
cho Heartbeat tự động: Codex có thể dùng công cụ shell và mạng mà không
dừng lại ở các lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

Để chọn dùng phê duyệt do guardian Codex review, đặt `appServer.mode:
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

Chế độ Guardian dùng đường dẫn phê duyệt auto-review gốc của Codex. Khi Codex yêu cầu
rời sandbox, ghi bên ngoài workspace, hoặc thêm quyền như truy cập mạng,
Codex định tuyến yêu cầu phê duyệt đó đến reviewer gốc thay vì một
lời nhắc cho con người. Reviewer áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối
yêu cầu cụ thể. Dùng Guardian khi bạn muốn nhiều rào chắn hơn chế độ YOLO
nhưng vẫn cần agent không giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`.
Các trường chính sách riêng lẻ vẫn ghi đè `mode`, vì vậy các triển khai nâng cao có thể kết hợp
preset với lựa chọn rõ ràng. Giá trị reviewer cũ `guardian_subagent` vẫn
được chấp nhận làm alias tương thích, nhưng cấu hình mới nên dùng
`auto_review`.

Với app-server đã chạy, dùng WebSocket transport:

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

Các lần khởi chạy stdio app-server mặc định kế thừa môi trường tiến trình của OpenClaw,
nhưng OpenClaw sở hữu cầu nối tài khoản app-server Codex và đặt cả
`CODEX_HOME` lẫn `HOME` thành các thư mục theo từng agent trong trạng thái OpenClaw
của agent đó. Trình tải skill riêng của Codex đọc `$CODEX_HOME/skills` và
`$HOME/.agents/skills`, nên cả hai giá trị đều được cô lập cho các lần khởi chạy app-server
cục bộ. Điều đó giữ skills gốc Codex, plugins, cấu hình, tài khoản và trạng thái luồng
được giới hạn trong agent OpenClaw thay vì rò rỉ từ home Codex CLI
cá nhân của operator.

Plugin OpenClaw và snapshot skill OpenClaw vẫn đi qua registry plugin và
trình tải skill riêng của OpenClaw. Tài sản Codex CLI cá nhân thì không. Nếu bạn có
skills hoặc plugins Codex CLI hữu ích cần trở thành một phần của agent OpenClaw,
hãy inventory chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Provider migration Codex sao chép skills vào workspace agent OpenClaw hiện tại.
Plugin gốc Codex, hook và tệp cấu hình được báo cáo hoặc lưu trữ
để review thủ công thay vì được kích hoạt tự động, vì chúng có thể
thực thi lệnh, phơi bày máy chủ MCP, hoặc mang thông tin xác thực.

Auth được chọn theo thứ tự này:

1. Một hồ sơ auth OpenClaw Codex rõ ràng cho agent.
2. Tài khoản hiện có của app-server trong home Codex của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và OpenAI auth
   vẫn còn cần thiết.

Khi OpenClaw thấy một hồ sơ auth Codex kiểu gói đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được spawn. Điều đó
giữ khóa API cấp Gateway sẵn dùng cho embeddings hoặc model OpenAI trực tiếp
mà không khiến các lượt app-server Codex gốc vô tình tính phí qua API.
Hồ sơ Codex API-key rõ ràng và fallback env-key stdio cục bộ dùng đăng nhập app-server
thay vì env kế thừa của tiến trình con. Kết nối WebSocket app-server
không nhận fallback API-key env của Gateway; dùng một hồ sơ auth rõ ràng hoặc
tài khoản riêng của app-server từ xa.

Nếu một triển khai cần cô lập môi trường bổ sung, thêm các biến đó vào
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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex được spawn.

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                 | Ý nghĩa                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                                               |
| `command`           | binary Codex được quản lý                | Tệp thực thi cho transport stdio. Để trống để dùng binary được quản lý; chỉ đặt giá trị này khi cần ghi đè rõ ràng.                                                                                                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                                                                                                                                                               |
| `url`               | chưa đặt                                 | URL app-server WebSocket.                                                                                                                                                                                                                                                 |
| `authToken`         | chưa đặt                                 | Bearer token cho transport WebSocket.                                                                                                                                                                                                                                     |
| `headers`           | `{}`                                     | Header WebSocket bổ sung.                                                                                                                                                                                                                                                 |
| `clearEnv`          | `[]`                                     | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa của nó. `CODEX_HOME` và `HOME` được dành riêng cho việc cô lập Codex theo từng agent của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`  | `60000`                                  | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                                              |
| `mode`              | `"yolo"`                                 | Preset cho thực thi YOLO hoặc do guardian xem xét.                                                                                                                                                                                                                        |
| `approvalPolicy`    | `"never"`                                | Chính sách phê duyệt gốc của Codex được gửi tới thread start/resume/turn.                                                                                                                                                                                                 |
| `sandbox`           | `"danger-full-access"`                   | Chế độ sandbox gốc của Codex được gửi tới thread start/resume.                                                                                                                                                                                                            |
| `approvalsReviewer` | `"user"`                                 | Dùng `"auto_review"` để cho Codex xem xét các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là bí danh cũ.                                                                                                                                                             |
| `serviceTier`       | chưa đặt                                 | Tầng dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị cũ không hợp lệ sẽ bị bỏ qua.                                                                                                                                                       |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận được
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín
hiệu công cụ khi được hỗ trợ và trả về phản hồi dynamic-tool thất bại cho Codex để
turn có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi turn của Codex,
harness cũng kỳ vọng Codex kết thúc turn gốc bằng `turn/completed`. Nếu
app-server im lặng trong 60 giây sau phản hồi đó, OpenClaw sẽ nỗ lực tối đa để
ngắt turn Codex, ghi lại chẩn đoán hết thời gian chờ, và giải phóng lane phiên
OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng phía sau một turn gốc
đã cũ.

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua binary được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị xóa. Thay vào đó, hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho triển khai có thể lặp lại vì nó giữ hành vi Plugin trong cùng
tệp đã được xem xét với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không đóng gói ứng dụng điều khiển desktop hoặc tự
thực thi các hành động desktop. Nó chuẩn bị app-server Codex, xác minh rằng MCP
server `computer-use` khả dụng, rồi để Codex xử lý các lệnh gọi công cụ MCP gốc
trong các turn chế độ Codex.

Để truy cập trực tiếp driver TryCua ngoài luồng marketplace Codex, hãy đăng ký
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

Có thể kiểm tra hoặc cài đặt phần thiết lập từ bề mặt lệnh:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Sử dụng máy tính chỉ dành cho macOS và có thể cần quyền hệ điều hành cục bộ trước khi
MCP server Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là true và MCP
server không khả dụng, các turn chế độ Codex sẽ thất bại trước khi thread bắt đầu thay vì
âm thầm chạy mà không có công cụ Sử dụng máy tính gốc. Xem
[Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use) để biết các lựa chọn marketplace,
giới hạn catalog từ xa, lý do trạng thái và cách khắc phục sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace Codex Desktop
được đóng gói tiêu chuẩn từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi thay đổi
cấu hình runtime hoặc Sử dụng máy tính để các phiên hiện có không giữ liên kết
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

Phê duyệt Codex do guardian xem xét:

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
với thread Codex hiện có, turn tiếp theo sẽ gửi lại model OpenAI, provider,
chính sách phê duyệt, sandbox và tầng dịch vụ hiện được chọn tới app-server.
Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ nguyên liên kết thread
nhưng yêu cầu Codex tiếp tục bằng model mới được chọn.

## Lệnh Codex

Plugin được đóng gói đăng ký `/codex` làm slash command được ủy quyền. Lệnh này
mang tính tổng quát và hoạt động trên mọi channel hỗ trợ lệnh văn bản OpenClaw.

Các dạng phổ biến:

- `/codex status` hiển thị kết nối app-server trực tiếp, model, tài khoản, giới hạn tốc độ, MCP server và skills.
- `/codex models` liệt kê các model app-server Codex trực tiếp.
- `/codex threads [filter]` liệt kê các thread Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại với một thread Codex hiện có.
- `/codex compact` yêu cầu app-server Codex compact thread đã gắn.
- `/codex review` bắt đầu review gốc của Codex cho thread đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho thread đã gắn.
- `/codex computer-use status` kiểm tra Plugin Sử dụng máy tính và MCP server đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Sử dụng máy tính đã cấu hình và tải lại MCP server.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái MCP server app-server Codex.
- `/codex skills` liệt kê skills của app-server Codex.

### Quy trình gỡ lỗi phổ biến

Khi một agent dùng Codex làm việc bất ngờ trong Telegram, Discord, Slack,
hoặc một channel khác, hãy bắt đầu từ cuộc trò chuyện nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả điều bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán Gateway
   cục bộ và, vì phiên đang dùng harness Codex, cũng gửi gói phản hồi Codex liên quan
   tới máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc thread hỗ trợ.
   Nó bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id thread Codex và dòng `Inspect locally` cho từng thread Codex.
4. Nếu bạn muốn tự gỡ lỗi lần chạy, hãy chạy lệnh `Inspect locally` đã in trong terminal.
   Lệnh trông như `codex resume <thread-id>` và mở thread Codex gốc để bạn có thể kiểm tra
   cuộc trò chuyện, tiếp tục cục bộ, hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex lên cho luồng hiện đang được đính kèm mà không kèm toàn bộ gói chẩn đoán OpenClaw Gateway. Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là điểm bắt đầu tốt hơn vì lệnh này liên kết trạng thái Gateway cục bộ và các ID luồng Codex trong một phản hồi. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết đầy đủ mô hình quyền riêng tư và hành vi trong cuộc trò chuyện nhóm.

Lõi OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu dưới dạng lệnh chẩn đoán Gateway tổng quát. Lời nhắc phê duyệt của lệnh này hiển thị phần mở đầu về dữ liệu nhạy cảm, liên kết đến [Xuất chẩn đoán](/vi/gateway/diagnostics), và yêu cầu `openclaw gateway diagnostics export --json` thông qua phê duyệt thực thi rõ ràng mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê duyệt, OpenClaw gửi một báo cáo có thể dán được cùng với đường dẫn gói cục bộ và bản tóm tắt manifest. Khi phiên OpenClaw đang hoạt động dùng harness Codex, cùng phê duyệt đó cũng cho phép gửi các gói phản hồi Codex liên quan đến máy chủ OpenAI. Lời nhắc phê duyệt nói rằng phản hồi Codex sẽ được gửi, nhưng không liệt kê ID phiên hoặc ID luồng Codex trước khi phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong cuộc trò chuyện nhóm, OpenClaw giữ kênh chung gọn sạch: nhóm chỉ nhận một thông báo ngắn, còn phần mở đầu chẩn đoán, lời nhắc phê duyệt, và ID phiên/luồng Codex được gửi cho chủ sở hữu qua tuyến phê duyệt riêng tư. Nếu không có tuyến chủ sở hữu riêng tư, OpenClaw từ chối yêu cầu nhóm và yêu cầu chủ sở hữu chạy lệnh đó từ DM.

Lượt tải Codex đã phê duyệt gọi `feedback/upload` của Codex app-server và yêu cầu app-server đưa vào nhật ký cho từng luồng được liệt kê và các luồng con Codex được sinh ra khi có sẵn. Lượt tải đi qua đường dẫn phản hồi bình thường của Codex đến máy chủ OpenAI; nếu phản hồi Codex bị tắt trong app-server đó, lệnh sẽ trả về lỗi app-server. Phản hồi chẩn đoán hoàn tất liệt kê các kênh, ID phiên OpenClaw, ID luồng Codex, và các lệnh `codex resume <thread-id>` cục bộ cho những luồng đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không in các ID Codex đó. Lượt tải này không thay thế bản xuất chẩn đoán Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà harness dùng cho các lượt bình thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền mô hình OpenClaw hiện được chọn vào app-server, và giữ lịch sử mở rộng ở trạng thái bật.

### Kiểm tra một luồng Codex từ CLI

Cách nhanh nhất để hiểu một lượt chạy Codex lỗi thường là mở trực tiếp luồng Codex gốc:

```sh
codex resume <thread-id>
```

Dùng lệnh này khi bạn nhận thấy lỗi trong một cuộc trò chuyện kênh và muốn kiểm tra phiên Codex có vấn đề, tiếp tục phiên đó cục bộ, hoặc hỏi Codex vì sao nó đã chọn một công cụ hoặc cách suy luận cụ thể. Đường dẫn dễ nhất thường là chạy `/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo hoàn tất sẽ liệt kê từng luồng Codex và in một lệnh `Kiểm tra cục bộ`, ví dụ `codex resume <thread-id>`. Bạn có thể sao chép lệnh đó trực tiếp vào terminal.

Bạn cũng có thể lấy ID luồng từ `/codex binding` cho cuộc trò chuyện hiện tại hoặc `/codex threads [filter]` cho các luồng Codex app-server gần đây, rồi chạy cùng lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu Codex app-server `0.125.0` trở lên. Các phương thức điều khiển riêng lẻ được báo cáo là `unsupported by this Codex app-server` nếu một app-server tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Harness Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu              | Mục đích                                                            |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                | Tương thích sản phẩm/Plugin trên các harness PI và Codex.           |
| Middleware mở rộng Codex app-server  | Plugin đi kèm OpenClaw  | Hành vi bộ chuyển đổi theo từng lượt quanh các công cụ động OpenClaw. |
| Hook gốc Codex                       | Codex                   | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex cấp dự án hoặc toàn cục để định tuyến hành vi Plugin OpenClaw. Với cầu nối công cụ gốc và quyền được hỗ trợ, OpenClaw tiêm cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`, `PermissionRequest`, và `Stop`. Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là điều khiển cấp Codex; chúng không được cung cấp dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Với các công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu lệnh gọi, nên OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong bộ chuyển đổi harness. Với các công cụ gốc của Codex, Codex sở hữu bản ghi công cụ chuẩn. OpenClaw có thể phản chiếu các sự kiện được chọn, nhưng không thể viết lại luồng Codex gốc trừ khi Codex cung cấp thao tác đó qua app-server hoặc callback hook gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo Codex app-server và trạng thái bộ chuyển đổi OpenClaw, không phải các lệnh hook Codex gốc. Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và `llm_output` của OpenClaw là quan sát cấp bộ chuyển đổi, không phải bản chụp từng byte của yêu cầu nội bộ hoặc tải trọng Compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` gốc của Codex được chiếu thành sự kiện tác nhân `codex_app_server.hook` để phục vụ quỹ đạo và gỡ lỗi. Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác ở bên dưới. Codex sở hữu nhiều hơn vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt Plugin và phiên quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                        | Hỗ trợ                                  | Lý do                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI qua Codex             | Được hỗ trợ                             | Codex app-server sở hữu lượt OpenAI, tiếp tục luồng gốc, và tiếp tục công cụ gốc.                                                                                                                     |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage, và các kênh khác nằm ngoài runtime mô hình.                                                                                                             |
| Công cụ động OpenClaw                         | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                       |
| Plugin prompt và ngữ cảnh                     | Được hỗ trợ                             | OpenClaw xây dựng các lớp phủ prompt và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                          |
| Vòng đời công cụ ngữ cảnh                     | Được hỗ trợ                             | Việc lắp ráp, nạp hoặc bảo trì sau lượt, và phối hợp Compaction công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                             |
| Hook công cụ động                             | Được hỗ trợ                             | `before_tool_call`, `after_tool_call`, và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                  |
| Hook vòng đời                                 | Được hỗ trợ dưới dạng quan sát bộ chuyển đổi | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, và `after_compaction` kích hoạt với tải trọng chế độ Codex trung thực.                                                                    |
| Cổng sửa đổi câu trả lời cuối cùng            | Được hỗ trợ qua relay hook gốc          | Codex `Stop` được relay đến `before_agent_finalize`; `revise` yêu cầu Codex chạy thêm một lượt mô hình nữa trước khi hoàn tất.                                                                         |
| Chặn hoặc quan sát shell, patch, và MCP gốc   | Được hỗ trợ qua relay hook gốc          | Codex `PreToolUse` và `PostToolUse` được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm tải trọng MCP trên Codex app-server `0.125.0` trở lên. Có hỗ trợ chặn; không hỗ trợ viết lại đối số. |
| Chính sách quyền gốc                          | Được hỗ trợ qua relay hook gốc          | Codex `PermissionRequest` có thể được định tuyến qua chính sách OpenClaw tại nơi runtime cung cấp nó. Nếu OpenClaw không trả về quyết định nào, Codex tiếp tục qua đường dẫn guardian hoặc phê duyệt người dùng bình thường. |
| Ghi lại quỹ đạo app-server                    | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu mà nó gửi đến app-server và các thông báo app-server mà nó nhận.                                                                                                             |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Lộ trình tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                       | Các hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không ghi lại đối số công cụ gốc của Codex.                                               | Cần hỗ trợ hook/schema của Codex cho đầu vào công cụ thay thế.                            |
| Lịch sử transcript Codex-native có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn tắc. OpenClaw sở hữu một bản sao và có thể chiếu ngữ cảnh tương lai, nhưng không nên đột biến các nội bộ không được hỗ trợ. | Thêm API app-server Codex rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ Codex-native | Hook đó chuyển đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ Codex-native.                                                           | Có thể phản chiếu các bản ghi đã chuyển đổi, nhưng ghi lại chuẩn tắc cần hỗ trợ từ Codex.              |
| Siêu dữ liệu Compaction gốc phong phú                     | OpenClaw quan sát lúc bắt đầu và hoàn tất Compaction, nhưng không nhận được danh sách giữ/bỏ ổn định, chênh lệch token, hoặc tải trọng tóm tắt.            | Cần sự kiện Compaction Codex phong phú hơn.                                                     |
| Can thiệp Compaction                             | Các hook Compaction hiện tại của OpenClaw ở cấp độ thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau Compaction của Codex nếu Plugin cần phủ quyết hoặc ghi lại Compaction gốc. |
| Ghi lại yêu cầu API mô hình từng byte một             | OpenClaw có thể ghi lại yêu cầu và thông báo app-server, nhưng lõi Codex tự xây dựng yêu cầu OpenAI API cuối cùng ở bên trong.                      | Cần sự kiện theo dõi yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Công cụ, phương tiện và Compaction

Codex harness chỉ thay đổi trình thực thi agent nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw bình thường.

Relay hook gốc được thiết kế có chủ ý để mang tính tổng quát, nhưng hợp đồng hỗ trợ v1
chỉ giới hạn ở các đường dẫn công cụ và quyền Codex-native mà OpenClaw kiểm thử. Trong
runtime Codex, điều đó bao gồm shell, patch và các tải trọng MCP `PreToolUse`,
`PostToolUse` và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
đều là bề mặt Plugin OpenClaw cho đến khi hợp đồng runtime nêu tên nó.

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xem đó là không có
quyết định hook và chuyển tiếp sang guardian riêng hoặc đường dẫn phê duyệt của người dùng.

Các yêu cầu phê duyệt công cụ MCP của Codex được định tuyến qua luồng phê duyệt Plugin của OpenClaw
khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Prompt `request_user_input` của Codex được gửi lại về
cuộc trò chuyện gốc, và tin nhắn theo sau được xếp hàng tiếp theo sẽ trả lời yêu cầu native
server đó thay vì được điều hướng như ngữ cảnh bổ sung. Các yêu cầu gợi ý MCP khác
vẫn thất bại đóng.

Điều hướng hàng đợi lượt đang hoạt động ánh xạ tới `turn/steer` của app-server Codex. Với
`messages.queue.mode: "steer"` mặc định, OpenClaw gom các tin nhắn chat đã xếp hàng
trong khoảng thời gian yên lặng đã cấu hình và gửi chúng thành một yêu cầu `turn/steer`
theo thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
review Codex và Compaction thủ công có thể từ chối điều hướng cùng lượt, trong trường hợp đó
OpenClaw dùng hàng đợi followup khi chế độ đã chọn cho phép fallback. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng Codex harness, Compaction luồng gốc được
ủy quyền cho app-server Codex. OpenClaw giữ một bản sao transcript cho lịch sử kênh,
tìm kiếm, `/new`, `/reset` và việc chuyển đổi mô hình hoặc harness trong tương lai. Bản sao
bao gồm prompt người dùng, văn bản assistant cuối cùng và các bản ghi lý luận hoặc kế hoạch Codex
nhẹ khi app-server phát ra chúng. Hiện tại, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa phơi bày
bản tóm tắt Compaction dễ đọc cho con người hoặc danh sách có thể kiểm toán về các mục Codex
đã giữ sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn tắc, `tool_result_persist` hiện không
ghi lại các bản ghi kết quả công cụ Codex-native. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ transcript phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và
hiểu phương tiện tiếp tục dùng các cài đặt provider/mô hình tương ứng như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` bình thường:** đây là điều được mong đợi với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc một tham chiếu `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra xem `plugins.allow` có loại trừ
`codex` không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có Codex harness nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex trong khi kiểm thử. Một
runtime Codex bắt buộc hiện sẽ thất bại thay vì fallback về PI trừ khi bạn
đặt rõ `agentRuntime.fallback: "pi"`. Sau khi app-server Codex được
chọn, lỗi của nó hiển thị trực tiếp mà không cần cấu hình fallback bổ sung.

**app-server bị từ chối:** nâng cấp Codex để handshake app-server
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các prerelease cùng phiên bản hoặc phiên bản có hậu tố build
như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
mức sàn giao thức ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo app-server từ xa nói cùng phiên bản giao thức app-server Codex.

**Một mô hình không phải Codex dùng PI:** đây là điều được mong đợi trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho agent đó hoặc đã chọn một tham chiếu
`codex/*` cũ. Các tham chiếu `openai/gpt-*` thuần và provider khác vẫn đi theo
đường dẫn provider bình thường của chúng trong chế độ `auto`. Nếu bạn buộc `agentRuntime.id: "codex"`, mọi lượt nhúng
cho agent đó phải là mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn, khởi động lại
gateway để xóa các đăng ký hook gốc cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, khởi động lại Codex Computer Use hoặc Codex Desktop rồi thử lại.

## Liên quan

- [Plugin harness agent](/vi/plugins/sdk-agent-harness)
- [Runtime agent](/vi/concepts/agent-runtimes)
- [Provider mô hình](/vi/concepts/model-providers)
- [Provider OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook Plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
