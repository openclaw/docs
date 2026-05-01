---
read_when:
    - Bạn muốn sử dụng bộ harness app-server Codex đi kèm
    - Bạn cần các ví dụ về cấu hình khung chạy của Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác tử nhúng của OpenClaw thông qua bộ harness app-server Codex đi kèm
title: Khung Codex
x-i18n:
    generated_at: "2026-05-01T10:51:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt tác tử nhúng thông qua app-server Codex thay vì harness PI tích hợp sẵn.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên tác tử cấp thấp: khám phá mô hình, tiếp tục luồng gốc, compaction gốc và thực thi app-server. OpenClaw vẫn sở hữu các kênh chat, tệp phiên, chọn mô hình, công cụ, phê duyệt, phân phối media và bản phản chiếu bản ghi hiển thị.

Nếu bạn đang cố định hướng, hãy bắt đầu với [runtime tác tử](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là: `openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, và Telegram, Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Để dùng harness Codex cho các lượt tác tử GPT, hãy giữ tham chiếu mô hình chuẩn là `openai/gpt-*`, bật Plugin `codex` đi kèm và đặt `agentRuntime.id: "codex"`:

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

Nếu cấu hình của bạn dùng `plugins.allow`, hãy đưa cả `codex` vào đó:

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

Không dùng `openai-codex/gpt-*` cho đường dẫn này. Giá trị đó chọn OAuth Codex thông qua runner PI thông thường trừ khi bạn ép riêng một runtime. Thay đổi cấu hình áp dụng cho các phiên mới hoặc phiên đã đặt lại; các phiên hiện có giữ runtime đã ghi nhận.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số khả năng riêng biệt:

| Khả năng                         | Cách bạn dùng                                      | Chức năng                                                                      |
| -------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime nhúng gốc                | `agentRuntime.id: "codex"`                         | Chạy các lượt tác tử nhúng OpenClaw thông qua app-server Codex.                |
| Lệnh điều khiển chat gốc         | `/codex bind`, `/codex resume`, `/codex steer`, ... | Gắn kết và điều khiển các luồng app-server Codex từ một cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục app-server Codex | phần nội bộ `codex`, được hiển thị thông qua harness | Cho phép runtime khám phá và xác thực các mô hình app-server.                  |
| Đường dẫn hiểu media của Codex   | các đường dẫn tương thích mô hình hình ảnh `codex/*` | Chạy các lượt app-server Codex có giới hạn cho các mô hình hiểu hình ảnh được hỗ trợ. |
| Chuyển tiếp hook gốc             | Hook Plugin quanh các sự kiện gốc của Codex         | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất gốc của Codex được hỗ trợ. |

Bật Plugin sẽ làm các khả năng đó khả dụng. Nó **không**:

- bắt đầu dùng Codex cho mọi mô hình OpenAI
- chuyển đổi tham chiếu mô hình `openai-codex/*` thành runtime gốc
- đặt ACP/acpx làm đường dẫn Codex mặc định
- chuyển nóng các phiên hiện có đã ghi nhận runtime PI
- thay thế phân phối kênh, tệp phiên, lưu trữ hồ sơ xác thực hoặc định tuyến tin nhắn của OpenClaw

Cùng Plugin đó cũng sở hữu bề mặt lệnh điều khiển chat gốc `/codex`. Nếu Plugin được bật và người dùng yêu cầu gắn kết, tiếp tục, điều hướng, dừng hoặc kiểm tra các luồng Codex từ chat, tác tử nên ưu tiên `/codex ...` thay vì ACP. ACP vẫn là phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử adapter Codex ACP.

Các lượt Codex gốc giữ hook Plugin OpenClaw làm lớp tương thích công khai. Đây là các hook OpenClaw trong tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho các bản ghi bản ghi được phản chiếu
- `before_agent_finalize` thông qua chuyển tiếp `Stop` của Codex
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập với runtime để viết lại kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và trước khi kết quả được trả về Codex. Cơ chế này tách biệt với hook Plugin công khai `tool_result_persist`, vốn chuyển đổi các lần ghi kết quả công cụ vào bản ghi do OpenClaw sở hữu.

Để biết ngữ nghĩa hook Plugin, xem [Hook Plugin](/vi/plugins/hooks) và [Hành vi bảo vệ Plugin](/vi/tools/plugin).

Harness bị tắt theo mặc định. Cấu hình mới nên giữ tham chiếu mô hình OpenAI chuẩn là `openai/gpt-*` và ép rõ `agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi muốn thực thi app-server gốc. Các tham chiếu mô hình `codex/*` cũ vẫn tự động chọn harness để tương thích, nhưng tiền tố nhà cung cấp cũ được runtime hỗ trợ không được hiển thị như lựa chọn mô hình/nhà cung cấp thông thường.

Nếu Plugin `codex` được bật nhưng mô hình chính vẫn là `openai-codex/*`, `openclaw doctor` sẽ cảnh báo thay vì thay đổi tuyến. Đây là chủ ý: `openai-codex/*` vẫn là đường dẫn OAuth/thuê bao Codex PI, còn thực thi app-server gốc vẫn là lựa chọn runtime rõ ràng.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                         | Tham chiếu mô hình        | Cấu hình runtime                       | Yêu cầu Plugin                 | Nhãn trạng thái kỳ vọng          |
| ----------------------------------------- | ------------------------- | -------------------------------------- | ------------------------------ | -------------------------------- |
| API OpenAI qua runner OpenClaw thông thường | `openai/gpt-*`            | bỏ qua hoặc `runtime: "pi"`            | Nhà cung cấp OpenAI            | `Runtime: OpenClaw Pi Default`   |
| OAuth/thuê bao Codex qua PI               | `openai-codex/gpt-*`      | bỏ qua hoặc `runtime: "pi"`            | Nhà cung cấp OAuth Codex OpenAI | `Runtime: OpenClaw Pi Default`  |
| Lượt nhúng app-server Codex gốc           | `openai/gpt-*`            | `agentRuntime.id: "codex"`             | Plugin `codex`                 | `Runtime: OpenAI Codex`          |
| Nhà cung cấp hỗn hợp với chế độ tự động thận trọng | tham chiếu riêng theo nhà cung cấp | `agentRuntime.id: "auto"`              | Runtime Plugin tùy chọn        | Tùy thuộc runtime đã chọn        |
| Phiên adapter Codex ACP rõ ràng           | phụ thuộc prompt/mô hình ACP | `sessions_spawn` với `runtime: "acp"` | backend `acpx` khỏe mạnh       | Trạng thái tác vụ/phiên ACP      |

Điểm phân tách quan trọng là nhà cung cấp so với runtime:

- `openai-codex/*` trả lời "PI nên dùng tuyến nhà cung cấp/xác thực nào?"
- `agentRuntime.id: "codex"` trả lời "vòng lặp nào nên thực thi lượt nhúng này?"
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào mà chat này nên gắn kết hoặc điều khiển?"
- ACP trả lời "tiến trình harness bên ngoài nào mà acpx nên khởi chạy?"

## Chọn đúng tiền tố mô hình

Các tuyến họ OpenAI phụ thuộc vào tiền tố. Dùng `openai-codex/*` khi bạn muốn OAuth Codex qua PI; dùng `openai/*` khi bạn muốn truy cập trực tiếp API OpenAI hoặc khi bạn đang ép harness app-server Codex gốc:

| Tham chiếu mô hình                          | Đường dẫn runtime                           | Dùng khi                                                                  |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Nhà cung cấp OpenAI qua hệ thống OpenClaw/PI | Bạn muốn truy cập API OpenAI Platform trực tiếp hiện tại với `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OAuth Codex OpenAI qua OpenClaw/PI          | Bạn muốn xác thực thuê bao ChatGPT/Codex với runner PI mặc định.          |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                    | Bạn muốn thực thi app-server Codex gốc cho lượt tác tử nhúng.             |

GPT-5.5 hiện chỉ hỗ trợ thuê bao/OAuth trong OpenClaw. Dùng `openai-codex/gpt-5.5` cho OAuth PI, hoặc `openai/gpt-5.5` với harness app-server Codex. Truy cập khóa API trực tiếp cho `openai/gpt-5.5` được hỗ trợ khi OpenAI bật GPT-5.5 trên API công khai.

Các tham chiếu `codex/gpt-*` cũ vẫn được chấp nhận như bí danh tương thích. Di trú tương thích của doctor viết lại các tham chiếu runtime chính cũ thành tham chiếu mô hình chuẩn và ghi chính sách runtime riêng, còn các tham chiếu cũ chỉ dùng làm dự phòng được giữ nguyên vì runtime được cấu hình cho toàn bộ vùng chứa tác tử. Cấu hình OAuth Codex PI mới nên dùng `openai-codex/gpt-*`; cấu hình harness app-server gốc mới nên dùng `openai/gpt-*` cộng với `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng cách phân tách tiền tố. Dùng `openai-codex/gpt-*` khi hiểu hình ảnh nên chạy qua đường dẫn nhà cung cấp OAuth Codex OpenAI. Dùng `codex/gpt-*` khi hiểu hình ảnh nên chạy qua một lượt app-server Codex có giới hạn. Mô hình app-server Codex phải quảng bá hỗ trợ đầu vào hình ảnh; các mô hình Codex chỉ văn bản sẽ thất bại trước khi lượt media bắt đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn gây bất ngờ, hãy bật ghi log debug cho hệ con `agents/harness` và kiểm tra bản ghi có cấu trúc `agent harness selected` của Gateway. Bản ghi bao gồm id harness đã chọn, lý do chọn, chính sách runtime/dự phòng và, trong chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Cảnh báo doctor có nghĩa gì

`openclaw doctor` cảnh báo khi tất cả điều sau đều đúng:

- Plugin `codex` đi kèm được bật hoặc được cho phép
- mô hình chính của một tác tử là `openai-codex/*`
- runtime hiệu lực của tác tử đó không phải `codex`

Cảnh báo đó tồn tại vì người dùng thường kỳ vọng "Plugin Codex đã bật" đồng nghĩa với "runtime app-server Codex gốc." OpenClaw không tự thực hiện bước nhảy đó. Cảnh báo có nghĩa là:

- **Không cần thay đổi** nếu bạn chủ đích dùng OAuth ChatGPT/Codex qua PI.
- Đổi mô hình thành `openai/<model>` và đặt `agentRuntime.id: "codex"` nếu bạn chủ đích thực thi app-server gốc.
- Các phiên hiện có vẫn cần `/new` hoặc `/reset` sau khi thay đổi runtime, vì ghim runtime phiên là cố định.

Chọn harness không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng chạy, OpenClaw ghi id harness đã chọn trên phiên đó và tiếp tục dùng nó cho các lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc `OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng harness khác; dùng `/new` hoặc `/reset` để bắt đầu một phiên mới trước khi chuyển một cuộc trò chuyện hiện có giữa PI và Codex. Điều này tránh phát lại một bản ghi qua hai hệ thống phiên gốc không tương thích.

Các phiên cũ được tạo trước khi có ghim harness được xem là đã ghim PI khi chúng có lịch sử bản ghi. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó vào Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình hiệu lực. Harness PI mặc định xuất hiện là `Runtime: OpenClaw Pi Default`, và harness app-server Codex xuất hiện là `Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có Plugin `codex` đi kèm khả dụng.
- App-server Codex `0.125.0` hoặc mới hơn. Plugin đi kèm quản lý một binary app-server Codex tương thích theo mặc định, nên các lệnh `codex` cục bộ trên `PATH` không ảnh hưởng đến khởi động harness thông thường.
- Xác thực Codex khả dụng cho tiến trình app-server hoặc cho cầu nối xác thực Codex của OpenClaw. Các lần khởi chạy app-server stdio cục bộ dùng home Codex do OpenClaw quản lý cho từng tác tử và một `HOME` con cô lập, nên theo mặc định chúng không đọc tài khoản `~/.codex`, Skills, plugin, cấu hình, trạng thái luồng cá nhân của bạn hoặc `$HOME/.agents/skills` gốc.

Plugin chặn các bắt tay app-server cũ hơn hoặc không có phiên bản. Điều đó giữ OpenClaw trên bề mặt giao thức đã được kiểm thử.

Đối với kiểm thử smoke trực tiếp và Docker, xác thực thường đến từ tài khoản CLI Codex hoặc hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy app-server stdio cục bộ cũng có thể dự phòng về `CODEX_API_KEY` / `OPENAI_API_KEY` khi không có tài khoản nào hiện diện.

## Thêm Codex cùng các mô hình khác

Không đặt `agentRuntime.id: "codex"` ở phạm vi toàn cục nếu cùng một agent cần tự do chuyển đổi
giữa Codex và các mô hình nhà cung cấp không phải Codex. Runtime bị ép buộc áp dụng cho mọi
lượt nhúng của agent hoặc phiên đó. Nếu bạn chọn một mô hình Anthropic trong khi
runtime đó bị ép buộc, OpenClaw vẫn thử harness Codex và đóng lỗi
thay vì âm thầm định tuyến lượt đó qua PI.

Thay vào đó, hãy dùng một trong các dạng sau:

- Đặt Codex trên một agent chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ agent mặc định ở `agentRuntime.id: "auto"` và PI fallback cho cách dùng nhà cung cấp
  hỗn hợp thông thường.
- Chỉ dùng các tham chiếu `codex/*` cũ để tương thích. Cấu hình mới nên ưu tiên
  `openai/*` cùng với chính sách runtime Codex rõ ràng.

Ví dụ, cấu hình này giữ agent mặc định dùng lựa chọn tự động thông thường và
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

- Agent `main` mặc định dùng đường dẫn nhà cung cấp thông thường và PI fallback tương thích.
- Agent `codex` dùng harness app-server Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho agent `codex`, lượt đó sẽ thất bại
  thay vì lặng lẽ dùng PI.

## Định tuyến lệnh agent

Agent nên định tuyến yêu cầu của người dùng theo ý định, không chỉ theo từ "Codex":

| Người dùng yêu cầu...                                    | Agent nên dùng...                                |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Gắn cuộc trò chuyện này với Codex"                      | `/codex bind`                                    |
| "Tiếp tục luồng Codex `<id>` tại đây"                    | `/codex resume <id>`                             |
| "Hiển thị các luồng Codex"                               | `/codex threads`                                 |
| "Gửi báo cáo hỗ trợ cho một lần chạy Codex lỗi"          | `/diagnostics [note]`                            |
| "Chỉ gửi phản hồi Codex cho luồng đính kèm này"          | `/codex diagnostics [note]`                      |
| "Dùng Codex làm runtime cho agent này"                   | thay đổi cấu hình thành `agentRuntime.id`        |
| "Dùng gói đăng ký ChatGPT/Codex của tôi với OpenClaw thông thường" | tham chiếu mô hình `openai-codex/*`              |
| "Chạy Codex qua ACP/acpx"                                | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Khởi động Claude Code/Gemini/OpenCode/Cursor trong một luồng" | ACP/acpx, không phải `/codex` và không phải sub-agent gốc |

OpenClaw chỉ quảng bá hướng dẫn khởi tạo ACP cho agent khi ACP được bật,
có thể điều phối, và được hỗ trợ bởi một backend runtime đã tải. Nếu ACP không khả dụng,
system prompt và Skills của Plugin không nên dạy agent về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép dùng harness Codex khi bạn cần chứng minh rằng mọi lượt agent nhúng
đều dùng Codex. Runtime Plugin rõ ràng mặc định không có PI fallback, vì vậy
`fallback: "none"` là tùy chọn nhưng thường hữu ích như tài liệu:

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

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu Plugin Codex bị tắt,
app-server quá cũ, hoặc app-server không thể khởi động. Chỉ đặt
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nếu bạn cố ý muốn PI xử lý
việc thiếu lựa chọn harness.

## Codex theo từng agent

Bạn có thể biến một agent thành chỉ dùng Codex trong khi agent mặc định giữ
cơ chế tự động chọn thông thường:

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

Dùng các lệnh phiên thông thường để chuyển agent và mô hình. `/new` tạo một
phiên OpenClaw mới, và harness Codex tạo hoặc tiếp tục luồng app-server phụ trợ
của nó khi cần. `/reset` xóa ràng buộc phiên OpenClaw cho luồng đó
và cho phép lượt tiếp theo phân giải harness lại từ cấu hình hiện tại.

## Khám phá mô hình

Theo mặc định, Plugin Codex yêu cầu app-server cung cấp các mô hình khả dụng. Nếu
khám phá thất bại hoặc hết thời gian chờ, nó dùng danh mục fallback được đóng gói cho:

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

Tắt khám phá khi bạn muốn quá trình khởi động tránh thăm dò Codex và chỉ dùng
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

Theo mặc định, Plugin khởi động binary Codex do OpenClaw quản lý cục bộ bằng:

```bash
codex app-server --listen stdio://
```

Binary được quản lý được khai báo là phụ thuộc runtime Plugin đóng gói và được chuẩn bị
cùng phần còn lại của các phụ thuộc Plugin `codex`. Điều này giữ phiên bản app-server
gắn với Plugin đóng gói thay vì bất kỳ Codex CLI riêng nào tình cờ
được cài đặt cục bộ. Chỉ đặt `appServer.command` khi bạn
cố ý muốn chạy một tệp thực thi khác.

Theo mặc định, OpenClaw khởi động các phiên harness Codex cục bộ ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ đáng tin cậy dùng
cho Heartbeat tự động: Codex có thể dùng công cụ shell và mạng mà không
dừng lại ở các lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

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

Chế độ Guardian dùng đường dẫn phê duyệt tự động xét duyệt gốc của Codex. Khi Codex yêu cầu
rời sandbox, ghi ra ngoài workspace, hoặc thêm quyền như quyền truy cập mạng,
Codex định tuyến yêu cầu phê duyệt đó tới reviewer gốc thay vì một
lời nhắc cho con người. Reviewer áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối
yêu cầu cụ thể. Dùng Guardian khi bạn muốn có nhiều rào chắn hơn chế độ YOLO
nhưng vẫn cần agent không người giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`.
Các trường chính sách riêng lẻ vẫn ghi đè `mode`, vì vậy triển khai nâng cao có thể kết hợp
preset với lựa chọn rõ ràng. Giá trị reviewer cũ `guardian_subagent`
vẫn được chấp nhận như bí danh tương thích, nhưng cấu hình mới nên dùng
`auto_review`.

Với một app-server đã chạy, dùng giao thức WebSocket:

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

Các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của OpenClaw theo mặc định,
nhưng OpenClaw sở hữu cầu nối tài khoản app-server Codex và đặt cả
`CODEX_HOME` lẫn `HOME` thành các thư mục theo từng agent trong trạng thái OpenClaw
của agent đó. Trình tải Skills riêng của Codex đọc `$CODEX_HOME/skills` và
`$HOME/.agents/skills`, vì vậy cả hai giá trị đều được cô lập cho các lần khởi chạy app-server
cục bộ. Điều đó giữ Skills, Plugin, cấu hình, tài khoản và trạng thái luồng gốc Codex
nằm trong phạm vi agent OpenClaw thay vì rò rỉ từ thư mục gốc Codex CLI
cá nhân của người vận hành.

Plugin OpenClaw và snapshot Skills OpenClaw vẫn đi qua registry Plugin và trình tải Skills
riêng của OpenClaw. Tài sản Codex CLI cá nhân thì không. Nếu bạn có
Skills hoặc Plugin Codex CLI hữu ích nên trở thành một phần của agent OpenClaw,
hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Nhà cung cấp di trú Codex sao chép Skills vào workspace agent OpenClaw hiện tại.
Plugin gốc Codex, hook và tệp cấu hình được báo cáo hoặc lưu trữ
để xem xét thủ công thay vì được kích hoạt tự động, vì chúng có thể
thực thi lệnh, phơi bày máy chủ MCP, hoặc mang thông tin đăng nhập.

Xác thực được chọn theo thứ tự này:

1. Hồ sơ xác thực OpenClaw Codex rõ ràng cho agent.
2. Tài khoản hiện có của app-server trong thư mục Codex home của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và xác thực OpenAI
   vẫn cần thiết.

Khi OpenClaw thấy hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều đó
giữ API key cấp Gateway khả dụng cho embedding hoặc mô hình OpenAI trực tiếp
mà không làm các lượt app-server Codex gốc vô tình tính phí qua API.
Hồ sơ API key Codex rõ ràng và fallback khóa môi trường stdio cục bộ dùng đăng nhập app-server
thay vì môi trường tiến trình con được kế thừa. Kết nối app-server WebSocket
không nhận fallback API key môi trường Gateway; hãy dùng hồ sơ xác thực rõ ràng hoặc
tài khoản riêng của app-server từ xa.

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

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                 | Ý nghĩa                                                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                                              |
| `command`           | binary Codex được quản lý                | Tệp thực thi cho stdio transport. Để trống để dùng binary được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                                                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho stdio transport.                                                                                                                                                                                                                                              |
| `url`               | chưa đặt                                 | URL app-server WebSocket.                                                                                                                                                                                                                                                |
| `authToken`         | chưa đặt                                 | Bearer token cho WebSocket transport.                                                                                                                                                                                                                                    |
| `headers`           | `{}`                                     | Header WebSocket bổ sung.                                                                                                                                                                                                                                                |
| `clearEnv`          | `[]`                                     | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa của nó. `CODEX_HOME` và `HOME` được dành riêng cho cơ chế cô lập Codex theo từng agent của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`  | `60000`                                  | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                                             |
| `mode`              | `"yolo"`                                 | Cấu hình sẵn cho thực thi YOLO hoặc thực thi được guardian xét duyệt.                                                                                                                                                                                                     |
| `approvalPolicy`    | `"never"`                                | Chính sách phê duyệt Codex gốc được gửi tới thread start/resume/turn.                                                                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Chế độ sandbox Codex gốc được gửi tới thread start/resume.                                                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Dùng `"auto_review"` để cho Codex xét duyệt các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là bí danh cũ.                                                                                                                                                          |
| `serviceTier`       | chưa đặt                                 | Bậc dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị cũ không hợp lệ sẽ bị bỏ qua.                                                                                                                                                       |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận được
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín hiệu
công cụ khi được hỗ trợ và trả về phản hồi dynamic-tool thất bại cho Codex để
turn có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server trong phạm vi turn của Codex,
harness cũng kỳ vọng Codex hoàn tất turn gốc bằng `turn/completed`. Nếu
app-server im lặng trong 60 giây sau phản hồi đó, OpenClaw sẽ cố gắng ngắt
turn Codex, ghi lại chẩn đoán hết thời gian chờ, và giải phóng lane phiên
OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một turn gốc đã cũ.

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua binary được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị gỡ bỏ. Thay vào đó, hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Config
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được xét duyệt với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Computer Use được trình bày trong hướng dẫn thiết lập riêng:
[Codex Computer Use](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không vendor ứng dụng điều khiển máy tính để bàn
hoặc tự thực thi các hành động trên máy tính để bàn. Nó chuẩn bị app-server
Codex, xác minh rằng máy chủ MCP `computer-use` khả dụng, rồi để Codex xử lý
các lệnh gọi công cụ MCP gốc trong các turn chế độ Codex.

Để truy cập trực tiếp trình điều khiển TryCua ngoài luồng marketplace Codex, hãy đăng ký
`cua-driver mcp` bằng `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Xem [Codex Computer Use](/vi/plugins/codex-computer-use) để biết sự khác biệt
giữa Computer Use do Codex sở hữu và đăng ký MCP trực tiếp.

Config tối thiểu:

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

Computer Use chỉ dành cho macOS và có thể yêu cầu quyền hệ điều hành cục bộ trước khi
máy chủ MCP Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là true và máy chủ MCP
không khả dụng, các turn chế độ Codex sẽ thất bại trước khi thread bắt đầu thay vì
âm thầm chạy mà không có công cụ Computer Use gốc. Xem
[Codex Computer Use](/vi/plugins/codex-computer-use) để biết các lựa chọn marketplace,
giới hạn catalog từ xa, lý do trạng thái, và cách khắc phục sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace
Codex Desktop tiêu chuẩn được đóng gói từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi
thay đổi runtime hoặc config Computer Use để các phiên hiện có không giữ ràng buộc
PI hoặc thread Codex cũ.

## Công thức phổ biến

Codex cục bộ với stdio transport mặc định:

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

Phê duyệt Codex được guardian xét duyệt:

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
vào một thread Codex hiện có, turn tiếp theo sẽ gửi lại mô hình OpenAI, provider,
chính sách phê duyệt, sandbox, và bậc dịch vụ hiện được chọn tới app-server.
Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ nguyên ràng buộc thread
nhưng yêu cầu Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin được đóng gói đăng ký `/codex` làm lệnh gạch chéo được ủy quyền. Lệnh này
mang tính tổng quát và hoạt động trên mọi kênh hỗ trợ lệnh văn bản OpenClaw.

Các dạng phổ biến:

- `/codex status` hiển thị kết nối app-server trực tiếp, mô hình, tài khoản, giới hạn tốc độ, máy chủ MCP, và skills.
- `/codex models` liệt kê các mô hình app-server Codex trực tiếp.
- `/codex threads [filter]` liệt kê các thread Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một thread Codex hiện có.
- `/codex compact` yêu cầu app-server Codex compact thread đã gắn.
- `/codex review` bắt đầu review gốc của Codex cho thread đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho thread đã gắn.
- `/codex computer-use status` kiểm tra Plugin Computer Use và máy chủ MCP đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Computer Use đã cấu hình và tải lại máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của app-server Codex.
- `/codex skills` liệt kê skills của app-server Codex.

### Quy trình gỡ lỗi phổ biến

Khi một agent được Codex hỗ trợ thực hiện điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc kênh khác, hãy bắt đầu với cuộc trò chuyện nơi vấn đề xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả điều bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán Gateway
   cục bộ và, vì phiên đang dùng harness Codex, cũng gửi gói phản hồi Codex liên quan
   tới máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc thread hỗ trợ.
   Nó bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id thread Codex, và một dòng `Inspect locally` cho mỗi thread Codex.
4. Nếu bạn muốn tự gỡ lỗi lượt chạy, hãy chạy lệnh `Inspect locally` được in ra
   trong terminal. Lệnh trông giống như `codex resume <thread-id>` và mở
   thread Codex gốc để bạn có thể kiểm tra cuộc trò chuyện, tiếp tục cục bộ,
   hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Dùng `/codex diagnostics [note]` chỉ khi bạn muốn riêng bản tải lên phản hồi Codex cho luồng hiện đang được đính kèm mà không kèm gói chẩn đoán OpenClaw Gateway đầy đủ. Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là điểm bắt đầu tốt hơn vì nó liên kết trạng thái Gateway cục bộ và các ID luồng Codex trong một phản hồi. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết đầy đủ mô hình quyền riêng tư và hành vi trò chuyện nhóm.

Phần lõi OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu dưới dạng lệnh chẩn đoán Gateway chung. Lời nhắc phê duyệt của lệnh này hiển thị phần mở đầu về dữ liệu nhạy cảm, liên kết tới [Xuất chẩn đoán](/vi/gateway/diagnostics), và yêu cầu `openclaw gateway diagnostics export --json` thông qua phê duyệt thực thi rõ ràng mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi được phê duyệt, OpenClaw gửi một báo cáo có thể dán được, kèm đường dẫn gói cục bộ và tóm tắt manifest. Khi phiên OpenClaw đang hoạt động dùng harness Codex, cùng phê duyệt đó cũng cho phép gửi các gói phản hồi Codex liên quan tới máy chủ OpenAI. Lời nhắc phê duyệt nói rằng phản hồi Codex sẽ được gửi, nhưng không liệt kê ID phiên hoặc ID luồng Codex trước khi phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong trò chuyện nhóm, OpenClaw giữ kênh chung gọn gàng: nhóm chỉ nhận một thông báo ngắn, còn phần mở đầu chẩn đoán, lời nhắc phê duyệt, và ID phiên/luồng Codex được gửi tới chủ sở hữu qua tuyến phê duyệt riêng tư. Nếu không có tuyến chủ sở hữu riêng tư, OpenClaw từ chối yêu cầu trong nhóm và yêu cầu chủ sở hữu chạy lệnh đó từ DM.

Bản tải lên Codex đã được phê duyệt gọi `feedback/upload` của app-server Codex và yêu cầu app-server bao gồm nhật ký cho từng luồng được liệt kê cùng các luồng con Codex đã tạo, khi có. Bản tải lên đi qua đường phản hồi bình thường của Codex tới máy chủ OpenAI; nếu phản hồi Codex bị tắt trong app-server đó, lệnh trả về lỗi app-server. Phản hồi chẩn đoán hoàn tất liệt kê các kênh, ID phiên OpenClaw, ID luồng Codex, và các lệnh `codex resume <thread-id>` cục bộ cho những luồng đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt, OpenClaw không in các ID Codex đó. Bản tải lên này không thay thế bản xuất chẩn đoán Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà harness dùng cho các lượt bình thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền mô hình OpenClaw hiện được chọn vào app-server, và giữ lịch sử mở rộng được bật.

### Kiểm tra một luồng Codex từ CLI

Cách nhanh nhất để hiểu một lần chạy Codex lỗi thường là mở trực tiếp luồng Codex gốc:

```sh
codex resume <thread-id>
```

Dùng lệnh này khi bạn nhận thấy lỗi trong một cuộc trò chuyện trên kênh và muốn kiểm tra phiên Codex có vấn đề, tiếp tục phiên đó cục bộ, hoặc hỏi Codex vì sao nó chọn một công cụ hay cách lập luận cụ thể. Đường đi dễ nhất thường là chạy `/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo hoàn tất liệt kê từng luồng Codex và in một lệnh `Inspect locally`, ví dụ `codex resume <thread-id>`. Bạn có thể sao chép lệnh đó trực tiếp vào terminal.

Bạn cũng có thể lấy ID luồng từ `/codex binding` cho cuộc trò chuyện hiện tại hoặc `/codex threads [filter]` cho các luồng app-server Codex gần đây, rồi chạy cùng lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu app-server Codex `0.125.0` hoặc mới hơn. Từng phương thức điều khiển được báo cáo là `unsupported by this Codex app-server` nếu một app-server trong tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Harness Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                             |
| ------------------------------------ | ------------------------ | -------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Tương thích sản phẩm/Plugin trên các harness PI và Codex.            |
| Middleware tiện ích mở rộng app-server Codex | Các Plugin đi kèm OpenClaw | Hành vi bộ chuyển đổi theo từng lượt quanh công cụ động OpenClaw.    |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex cấp dự án hoặc toàn cục để định tuyến hành vi Plugin OpenClaw. Với cầu nối công cụ gốc và quyền được hỗ trợ, OpenClaw tiêm cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`, `PermissionRequest`, và `Stop`. Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là điều khiển cấp Codex; chúng không được cung cấp như hook Plugin OpenClaw trong hợp đồng v1.

Với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu lệnh gọi, nên OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong bộ chuyển đổi harness. Với công cụ gốc Codex, Codex sở hữu bản ghi công cụ chính tắc. OpenClaw có thể phản chiếu các sự kiện được chọn, nhưng không thể ghi lại luồng Codex gốc trừ khi Codex cung cấp thao tác đó qua app-server hoặc callback hook gốc.

Các phép chiếu vòng đời Compaction và LLM đến từ thông báo app-server Codex và trạng thái bộ chuyển đổi OpenClaw, không phải từ lệnh hook Codex gốc. Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và `llm_output` của OpenClaw là quan sát cấp bộ chuyển đổi, không phải bản chụp từng byte của yêu cầu nội bộ hay payload Compaction của Codex.

Thông báo app-server `hook/started` và `hook/completed` gốc của Codex được chiếu thành sự kiện tác nhân `codex_app_server.hook` để phục vụ quỹ đạo và gỡ lỗi. Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác bên dưới. Codex sở hữu nhiều hơn trong vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt Plugin và phiên của mình quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                       | Hỗ trợ                                  | Lý do                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI thông qua Codex      | Được hỗ trợ                             | App-server Codex sở hữu lượt OpenAI, tiếp tục luồng gốc, và tiếp tục công cụ gốc.                                                                                                                     |
| Định tuyến và phân phối kênh OpenClaw        | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage, và các kênh khác vẫn nằm ngoài runtime mô hình.                                                                                                         |
| Công cụ động OpenClaw                        | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường thực thi.                                                                                                           |
| Plugin lời nhắc và ngữ cảnh                  | Được hỗ trợ                             | OpenClaw xây dựng các lớp phủ lời nhắc và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                        |
| Vòng đời công cụ ngữ cảnh                    | Được hỗ trợ                             | Việc lắp ráp, nạp hoặc bảo trì sau lượt, và phối hợp Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                        |
| Hook công cụ động                            | Được hỗ trợ                             | `before_tool_call`, `after_tool_call`, và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                  |
| Hook vòng đời                                | Được hỗ trợ dưới dạng quan sát bộ chuyển đổi | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, và `after_compaction` kích hoạt với payload trung thực ở chế độ Codex.                                                                   |
| Cổng sửa đổi câu trả lời cuối                | Được hỗ trợ thông qua relay hook gốc    | Codex `Stop` được relay tới `before_agent_finalize`; `revise` yêu cầu Codex chạy thêm một lượt mô hình trước khi hoàn tất.                                                                            |
| Chặn hoặc quan sát shell, patch, và MCP gốc  | Được hỗ trợ thông qua relay hook gốc    | Codex `PreToolUse` và `PostToolUse` được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên app-server Codex `0.125.0` hoặc mới hơn. Hỗ trợ chặn; không hỗ trợ viết lại đối số. |
| Chính sách quyền gốc                         | Được hỗ trợ thông qua relay hook gốc    | Codex `PermissionRequest` có thể được định tuyến qua chính sách OpenClaw khi runtime cung cấp. Nếu OpenClaw không trả về quyết định nào, Codex tiếp tục qua đường guardian hoặc phê duyệt người dùng bình thường. |
| Ghi lại quỹ đạo app-server                   | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu mà nó đã gửi tới app-server và các thông báo app-server mà nó nhận được.                                                                                                     |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Lộ trình tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                         | Các hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Yêu cầu hỗ trợ hook/schema của Codex để thay thế đầu vào công cụ.                            |
| Lịch sử transcript gốc của Codex có thể chỉnh sửa   | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản sao và có thể chiếu ngữ cảnh tương lai, nhưng không nên đột biến các phần nội bộ không được hỗ trợ. | Thêm API app-server Codex rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc của Codex | Hook đó chuyển đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc của Codex.                                                           | Có thể sao chép bản ghi đã chuyển đổi, nhưng việc viết lại chuẩn cần Codex hỗ trợ.              |
| Siêu dữ liệu Compaction gốc phong phú               | OpenClaw quan sát thời điểm bắt đầu và hoàn tất compaction, nhưng không nhận được danh sách được giữ/bị loại ổn định, chênh lệch token, hoặc payload tóm tắt.            | Cần sự kiện compaction Codex phong phú hơn.                                                     |
| Can thiệp Compaction                                | Các hook compaction hiện tại của OpenClaw ở cấp thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau compaction của Codex nếu plugin cần phủ quyết hoặc viết lại compaction gốc. |
| Ghi lại yêu cầu API model từng byte một             | OpenClaw có thể ghi lại yêu cầu và thông báo app-server, nhưng lõi Codex tự xây dựng yêu cầu OpenAI API cuối cùng ở bên trong.                      | Cần sự kiện truy vết yêu cầu model Codex hoặc API gỡ lỗi.                                   |

## Công cụ, phương tiện và compaction

Harness Codex chỉ thay đổi executor agent nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw thông thường.

Relay hook gốc được cố ý thiết kế tổng quát, nhưng hợp đồng hỗ trợ v1
chỉ giới hạn ở các đường dẫn công cụ và quyền gốc của Codex mà OpenClaw kiểm thử. Trong
runtime Codex, điều đó bao gồm các payload shell, patch và MCP `PreToolUse`,
`PostToolUse` và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
là một bề mặt plugin OpenClaw cho đến khi hợp đồng runtime nêu tên
nó.

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xem nó là không có
quyết định hook và chuyển tiếp sang đường dẫn guardian hoặc phê duyệt người dùng của riêng nó.

Các yêu cầu phê duyệt công cụ Codex MCP được định tuyến qua luồng
phê duyệt plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Prompt `request_user_input` của Codex được gửi lại về
cuộc trò chuyện gốc, và tin nhắn follow-up tiếp theo trong hàng đợi sẽ trả lời yêu cầu server
gốc đó thay vì được điều hướng như ngữ cảnh bổ sung. Các yêu cầu khơi gợi MCP khác
vẫn fail closed.

Điều hướng hàng đợi phiên chạy đang hoạt động ánh xạ vào `turn/steer` của app-server Codex. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom các tin nhắn chat đã xếp hàng
trong khoảng lặng đã cấu hình và gửi chúng dưới dạng một yêu cầu `turn/steer` theo
thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
review Codex và compaction thủ công có thể từ chối điều hướng cùng lượt, khi đó
OpenClaw dùng hàng đợi followup khi chế độ đã chọn cho phép fallback. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi model đã chọn dùng harness Codex, compaction luồng gốc được
ủy quyền cho app-server Codex. OpenClaw giữ một bản sao transcript cho lịch sử
kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi model hoặc harness trong tương lai. Bản
sao bao gồm prompt người dùng, văn bản trợ lý cuối cùng, và các bản ghi suy luận hoặc kế hoạch Codex
gọn nhẹ khi app-server phát ra chúng. Hiện nay, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất compaction gốc. Nó chưa hiển thị
tóm tắt compaction dễ đọc cho con người hoặc danh sách có thể kiểm toán về các mục Codex
đã giữ sau compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không
viết lại các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ transcript phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và hiểu phương tiện
tiếp tục dùng cài đặt provider/model phù hợp như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` thông thường:** điều đó là bình thường với
cấu hình mới. Chọn một model `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc ref `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra liệu `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận phiên chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex trong khi kiểm thử. Runtime
Codex bị ép buộc hiện sẽ thất bại thay vì fallback về PI trừ khi bạn
đặt rõ `agentRuntime.fallback: "pi"`. Khi app-server Codex được
chọn, lỗi của nó hiển thị trực tiếp mà không cần cấu hình fallback bổ sung.

**app-server bị từ chối:** nâng cấp Codex để handshake app-server
báo phiên bản `0.125.0` hoặc mới hơn. Các bản prerelease cùng phiên bản hoặc bản
có hậu tố build như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
ngưỡng protocol ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá model chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo app-server từ xa nói cùng phiên bản protocol app-server Codex.

**Một model không phải Codex dùng PI:** điều đó là bình thường trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho agent đó hoặc chọn một ref
`codex/*` cũ. Các ref `openai/gpt-*` thuần và provider khác vẫn đi theo đường dẫn
provider thông thường của chúng trong chế độ `auto`. Nếu bạn buộc `agentRuntime.id: "codex"`, mọi lượt nhúng
cho agent đó phải là một model OpenAI được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu vẫn còn, khởi động lại
gateway để xóa các đăng ký hook gốc cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, khởi động lại Codex Computer Use hoặc Codex Desktop và thử lại.

## Liên quan

- [Plugin harness agent](/vi/plugins/sdk-agent-harness)
- [Runtime agent](/vi/concepts/agent-runtimes)
- [Provider model](/vi/concepts/model-providers)
- [Provider OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
