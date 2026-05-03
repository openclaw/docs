---
read_when:
    - Bạn muốn sử dụng bộ harness app-server đi kèm của Codex
    - Bạn cần các ví dụ về cấu hình bộ khung Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác nhân nhúng OpenClaw thông qua bộ khung app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-03T21:34:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt agent nhúng thông qua
Codex app-server thay vì harness PI tích hợp sẵn.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên agent cấp thấp: khám phá mô
hình, tiếp tục luồng gốc, compaction gốc và thực thi app-server. OpenClaw vẫn sở
hữu các kênh chat, tệp phiên, lựa chọn mô hình, công cụ, phê duyệt, phân phối
phương tiện và bản sao transcript hiển thị.

Khi một lượt chat nguồn chạy qua harness Codex, các phản hồi hiển thị mặc định
dùng công cụ `message` của OpenClaw nếu bản triển khai chưa cấu hình rõ
`messages.visibleReplies`. Agent vẫn có thể hoàn tất lượt Codex của nó một cách
riêng tư; nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các phản hồi cuối trong chat trực
tiếp trên đường dẫn phân phối tự động cũ.

Các lượt heartbeat của Codex cũng mặc định có công cụ `heartbeat_respond`, để
agent có thể ghi lại liệu lần đánh thức nên giữ im lặng hay thông báo mà không
mã hóa luồng điều khiển đó trong văn bản cuối.

Hướng dẫn chủ động dành riêng cho Heartbeat được gửi dưới dạng chỉ thị dành cho
nhà phát triển ở chế độ cộng tác của Codex trên chính lượt heartbeat đó. Các
lượt chat thông thường khôi phục chế độ mặc định của Codex thay vì mang triết lý
heartbeat trong prompt runtime thông thường.

Nếu bạn đang cố định hướng, hãy bắt đầu với
[Runtime agent](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, và Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Hầu hết người dùng muốn "Codex trong OpenClaw" sẽ muốn tuyến này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, rồi chạy các lượt agent nhúng thông qua runtime Codex
app-server gốc. Tham chiếu mô hình vẫn giữ dạng chuẩn là `openai/gpt-*`; xác thực
gói đăng ký đến từ tài khoản/hồ sơ Codex, không phải từ tiền tố mô hình
`openai-codex/*`.

Trước tiên đăng nhập bằng Codex OAuth nếu bạn chưa đăng nhập:

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
      },
    },
  },
}
```

Nếu cấu hình của bạn dùng `plugins.allow`, cũng hãy thêm `codex` vào đó:

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

Không dùng `openai-codex/gpt-*` khi bạn muốn runtime Codex gốc. Tiền tố đó là
tuyến rõ ràng "Codex OAuth thông qua PI". Thay đổi cấu hình áp dụng cho các
phiên mới hoặc đã đặt lại; các phiên hiện có giữ runtime đã được ghi lại.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số khả năng riêng biệt:

| Khả năng                          | Cách bạn dùng                                      | Tác dụng                                                                      |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime nhúng gốc                 | `agentRuntime.id: "codex"`                         | Chạy các lượt agent nhúng của OpenClaw thông qua Codex app-server.            |
| Lệnh điều khiển chat gốc          | `/codex bind`, `/codex resume`, `/codex steer`, ... | Liên kết và điều khiển các luồng Codex app-server từ một cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục Codex app-server | nội bộ `codex`, được hiển thị qua harness          | Cho phép runtime khám phá và xác thực các mô hình app-server.                 |
| Đường dẫn hiểu phương tiện Codex  | đường dẫn tương thích mô hình ảnh `codex/*`        | Chạy các lượt Codex app-server có giới hạn cho các mô hình hiểu ảnh được hỗ trợ. |
| Relay hook gốc                    | Hook Plugin quanh các sự kiện Codex gốc            | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất Codex gốc được hỗ trợ. |

Bật Plugin sẽ làm các khả năng đó khả dụng. Nó **không**:

- bắt đầu dùng Codex cho mọi mô hình OpenAI
- chuyển đổi các tham chiếu mô hình `openai-codex/*` thành runtime gốc
- đặt ACP/acpx làm đường dẫn Codex mặc định
- chuyển nóng các phiên hiện có đã ghi nhận runtime PI
- thay thế phân phối kênh, tệp phiên, lưu trữ hồ sơ xác thực hoặc định tuyến tin
  nhắn của OpenClaw

Cùng Plugin này cũng sở hữu bề mặt lệnh điều khiển chat `/codex` gốc. Nếu Plugin
được bật và người dùng yêu cầu liên kết, tiếp tục, điều hướng, dừng hoặc kiểm tra
các luồng Codex từ chat, agent nên ưu tiên `/codex ...` thay vì ACP. ACP vẫn là
phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử bộ
chuyển đổi Codex ACP.

Các lượt Codex gốc giữ các hook Plugin của OpenClaw làm lớp tương thích công
khai. Đây là các hook OpenClaw trong tiến trình, không phải hook lệnh
`hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho các bản ghi transcript được phản chiếu
- `before_agent_finalize` thông qua relay `Stop` của Codex
- `agent_end`

Các Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập runtime để
viết lại kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và
trước khi kết quả được trả về Codex. Điều này tách biệt với hook Plugin công
khai `tool_result_persist`, vốn biến đổi các lần ghi kết quả công cụ trong
transcript do OpenClaw sở hữu.

Về chính ngữ nghĩa hook Plugin, xem [Hook Plugin](/vi/plugins/hooks)
và [Hành vi bảo vệ Plugin](/vi/tools/plugin).

Harness mặc định tắt. Cấu hình mới nên giữ tham chiếu mô hình OpenAI ở dạng
chuẩn là `openai/gpt-*` và ép rõ
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi muốn thực thi
app-server gốc. Các tham chiếu mô hình cũ `codex/*` vẫn tự động chọn harness để
tương thích, nhưng các tiền tố nhà cung cấp cũ có runtime phía sau không được
hiển thị như lựa chọn mô hình/nhà cung cấp thông thường.

Nếu Plugin `codex` được bật nhưng mô hình chính vẫn là
`openai-codex/*`, `openclaw doctor` sẽ cảnh báo thay vì thay đổi tuyến. Điều đó
là chủ ý: `openai-codex/*` vẫn là đường dẫn Codex OAuth/gói đăng ký qua PI, và
thực thi app-server gốc vẫn là lựa chọn runtime rõ ràng.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                                  | Tham chiếu mô hình       | Cấu hình runtime                       | Tuyến xác thực/hồ sơ         | Nhãn trạng thái mong đợi       |
| -------------------------------------------------- | ------------------------ | -------------------------------------- | ---------------------------- | ------------------------------ |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc    | `openai/gpt-*`           | `agentRuntime.id: "codex"`             | Codex OAuth hoặc tài khoản Codex | `Runtime: OpenAI Codex`        |
| OpenAI API thông qua runner OpenClaw thông thường  | `openai/gpt-*`           | bỏ qua hoặc `runtime: "pi"`            | Khóa OpenAI API              | `Runtime: OpenClaw Pi Default` |
| Gói đăng ký ChatGPT/Codex thông qua PI             | `openai-codex/gpt-*`     | bỏ qua hoặc `runtime: "pi"`            | Nhà cung cấp OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Nhiều nhà cung cấp với chế độ tự động thận trọng   | tham chiếu riêng theo nhà cung cấp | `agentRuntime.id: "auto"`              | Theo nhà cung cấp đã chọn    | Tùy runtime đã chọn            |
| Phiên bộ chuyển đổi Codex ACP rõ ràng              | phụ thuộc prompt/mô hình ACP | `sessions_spawn` với `runtime: "acp"` | Xác thực backend ACP         | Trạng thái tác vụ/phiên ACP    |

Phần phân tách quan trọng là nhà cung cấp so với runtime:

- `openai-codex/*` trả lời "PI nên dùng tuyến nhà cung cấp/xác thực nào?"
- `agentRuntime.id: "codex"` trả lời "vòng lặp nào nên thực thi lượt nhúng này?"
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào mà chat này nên liên kết
  hoặc điều khiển?"
- ACP trả lời "acpx nên khởi chạy tiến trình harness bên ngoài nào?"

## Chọn đúng tiền tố mô hình

Các tuyến thuộc họ OpenAI phụ thuộc vào tiền tố. Với thiết lập phổ biến là gói
đăng ký cộng với runtime Codex gốc, dùng `openai/*` với
`agentRuntime.id: "codex"`. Chỉ dùng `openai-codex/*` khi bạn chủ ý muốn Codex
OAuth thông qua PI:

| Tham chiếu mô hình                          | Đường dẫn runtime                           | Dùng khi                                                                   |
| ------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | Nhà cung cấp OpenAI qua hệ thống OpenClaw/PI | Bạn muốn truy cập OpenAI Platform API trực tiếp hiện tại với `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | OpenAI Codex OAuth qua OpenClaw/PI          | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với runner PI mặc định.        |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness Codex app-server                    | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với thực thi Codex gốc.        |

GPT-5.5 có thể xuất hiện trên cả tuyến khóa API OpenAI trực tiếp và tuyến gói
đăng ký Codex khi tài khoản của bạn cung cấp chúng. Dùng `openai/gpt-5.5` với
harness Codex app-server cho runtime Codex gốc, `openai-codex/gpt-5.5` cho PI
OAuth, hoặc `openai/gpt-5.5` không có ghi đè runtime Codex cho lưu lượng dùng
khóa API trực tiếp.

Các tham chiếu cũ `codex/gpt-*` vẫn được chấp nhận làm bí danh tương thích. Di
chuyển tương thích của doctor viết lại các tham chiếu runtime chính cũ thành
tham chiếu mô hình chuẩn và ghi chính sách runtime riêng, trong khi các tham
chiếu cũ chỉ dùng làm dự phòng được giữ nguyên vì runtime được cấu hình cho toàn
bộ vùng chứa agent. Cấu hình PI Codex OAuth mới nên dùng `openai-codex/gpt-*`;
cấu hình harness app-server gốc mới nên dùng `openai/gpt-*` cộng với
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng phân tách tiền tố. Dùng
`openai-codex/gpt-*` khi hiểu ảnh nên chạy qua đường dẫn nhà cung cấp OpenAI
Codex OAuth. Dùng `codex/gpt-*` khi hiểu ảnh nên chạy qua một lượt Codex
app-server có giới hạn. Mô hình Codex app-server phải công bố hỗ trợ đầu vào
hình ảnh; các mô hình Codex chỉ văn bản sẽ thất bại trước khi lượt phương tiện
bắt đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn
gây bất ngờ, hãy bật ghi log debug cho phân hệ `agents/harness` và kiểm tra bản
ghi có cấu trúc `agent harness selected` của gateway. Bản ghi đó bao gồm id
harness đã chọn, lý do lựa chọn, chính sách runtime/dự phòng và, ở chế độ
`auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Cảnh báo doctor nghĩa là gì

`openclaw doctor` cảnh báo khi tất cả các điều kiện sau đều đúng:

- Plugin `codex` đi kèm được bật hoặc được phép
- mô hình chính của một agent là `openai-codex/*`
- runtime hiệu lực của agent đó không phải `codex`

Cảnh báo đó tồn tại vì người dùng thường kỳ vọng "Plugin Codex đã bật" đồng
nghĩa với "runtime Codex app-server gốc." OpenClaw không tự suy diễn như vậy.
Cảnh báo có nghĩa là:

- **Không cần thay đổi** nếu bạn chủ ý dùng ChatGPT/Codex OAuth thông qua PI.
- Đổi mô hình thành `openai/<model>` và đặt
  `agentRuntime.id: "codex"` nếu bạn chủ ý muốn thực thi app-server gốc.
- Các phiên hiện có vẫn cần `/new` hoặc `/reset` sau khi thay đổi runtime,
  vì ghim runtime của phiên có tính bám dính.

Lựa chọn harness không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng
chạy, OpenClaw ghi id harness đã chọn trên phiên đó và tiếp tục dùng nó cho các
lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên trong tương lai dùng harness
khác; dùng `/new` hoặc `/reset` để bắt đầu một phiên mới trước khi chuyển một
cuộc trò chuyện hiện có giữa PI và Codex. Điều này tránh phát lại một transcript
qua hai hệ thống phiên gốc không tương thích.

Các phiên kế thừa được tạo trước khi ghim harness được xem là đã ghim PI sau khi
chúng có lịch sử transcript. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó
vào Codex sau khi đổi cấu hình.

`/status` hiển thị runtime mô hình hiệu lực. Harness PI mặc định xuất hiện dưới dạng
`Runtime: OpenClaw Pi Default`, và harness app-server Codex xuất hiện dưới dạng
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- App-server Codex `0.125.0` hoặc mới hơn. Plugin đi kèm mặc định quản lý một
  binary app-server Codex tương thích, nên các lệnh `codex` cục bộ trên `PATH`
  không ảnh hưởng đến việc khởi động harness thông thường.
- Xác thực Codex khả dụng cho tiến trình app-server hoặc cho cầu nối xác thực
  Codex của OpenClaw. Các lần khởi chạy app-server cục bộ dùng một home Codex do
  OpenClaw quản lý cho từng agent và một `HOME` con biệt lập, nên mặc định chúng
  không đọc tài khoản, skills, plugins, cấu hình, trạng thái thread cá nhân trong
  `~/.codex`, hoặc `$HOME/.agents/skills` gốc của bạn.

Plugin chặn các lần bắt tay app-server cũ hơn hoặc không có phiên bản. Điều đó giữ
OpenClaw trên bề mặt giao thức đã được kiểm thử.

Đối với kiểm thử smoke trực tiếp và Docker, xác thực thường đến từ tài khoản Codex CLI
hoặc một hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy app-server
stdio cục bộ cũng có thể dự phòng về `CODEX_API_KEY` / `OPENAI_API_KEY` khi không
có tài khoản nào hiện diện.

## Tệp khởi động workspace

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án gốc. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào tên tệp dự phòng
của Codex cho tệp persona, vì các dự phòng Codex chỉ áp dụng khi thiếu
`AGENTS.md`.

Để giữ tương đương workspace trong OpenClaw, harness Codex phân giải các tệp khởi động
khác (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, và `MEMORY.md` khi có) và chuyển tiếp chúng qua chỉ dẫn cấu hình
Codex trên `thread/start` và `thread/resume`. Việc này giữ cho `SOUL.md` và ngữ cảnh
persona/hồ sơ workspace liên quan hiển thị mà không nhân bản `AGENTS.md`.

## Thêm Codex cùng với các mô hình khác

Đừng đặt `agentRuntime.id: "codex"` toàn cục nếu cùng một agent cần tự do chuyển đổi
giữa Codex và các mô hình nhà cung cấp không phải Codex. Runtime bị ép buộc áp dụng
cho mọi lượt nhúng của agent hoặc phiên đó. Nếu bạn chọn một mô hình Anthropic trong
khi runtime đó bị ép buộc, OpenClaw vẫn thử harness Codex và đóng lỗi thay vì âm thầm
định tuyến lượt đó qua PI.

Thay vào đó, dùng một trong các dạng sau:

- Đặt Codex trên một agent chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ agent mặc định trên `agentRuntime.id: "auto"` và dự phòng PI cho cách dùng
  nhà cung cấp hỗn hợp thông thường.
- Chỉ dùng các tham chiếu `codex/*` kế thừa để tương thích. Cấu hình mới nên ưu tiên
  `openai/*` cùng một chính sách runtime Codex rõ ràng.

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

Với dạng này:

- Agent `main` mặc định dùng đường dẫn nhà cung cấp thông thường và dự phòng tương thích PI.
- Agent `codex` dùng harness app-server Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho agent `codex`, lượt sẽ thất bại
  thay vì lặng lẽ dùng PI.

## Định tuyến lệnh agent

Agent nên định tuyến yêu cầu người dùng theo ý định, không chỉ theo riêng từ "Codex":

| Người dùng yêu cầu...                                  | Agent nên dùng...                                |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Gắn chat này với Codex"                               | `/codex bind`                                    |
| "Tiếp tục thread Codex `<id>` tại đây"                 | `/codex resume <id>`                             |
| "Hiển thị các thread Codex"                            | `/codex threads`                                 |
| "Gửi báo cáo hỗ trợ cho một lần chạy Codex lỗi"        | `/diagnostics [note]`                            |
| "Chỉ gửi phản hồi Codex cho thread đính kèm này"       | `/codex diagnostics [note]`                      |
| "Dùng gói đăng ký ChatGPT/Codex của tôi với runtime Codex" | `openai/*` cộng với `agentRuntime.id: "codex"` |
| "Dùng gói đăng ký ChatGPT/Codex của tôi qua PI"        | tham chiếu mô hình `openai-codex/*`              |
| "Chạy Codex qua ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Khởi động Claude Code/Gemini/OpenCode/Cursor trong một thread" | ACP/acpx, không phải `/codex` và không phải sub-agent gốc |

OpenClaw chỉ quảng bá hướng dẫn spawn ACP cho agent khi ACP được bật,
có thể dispatch, và được hỗ trợ bởi một runtime backend đã tải. Nếu ACP không khả dụng,
system prompt và plugin skills không nên dạy agent về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép dùng harness Codex khi bạn cần chứng minh rằng mọi lượt agent nhúng đều
dùng Codex. Runtime Plugin rõ ràng đóng lỗi và không bao giờ được âm thầm thử lại
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

Ghi đè môi trường:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu Plugin Codex bị tắt, app-server
quá cũ, hoặc app-server không thể khởi động.

## Codex theo từng agent

Bạn có thể biến một agent thành chỉ dùng Codex trong khi agent mặc định giữ
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

Dùng các lệnh phiên thông thường để chuyển agent và mô hình. `/new` tạo một phiên
OpenClaw mới và harness Codex tạo hoặc tiếp tục thread app-server sidecar của nó
khi cần. `/reset` xóa ràng buộc phiên OpenClaw cho thread đó và cho phép lượt tiếp theo
phân giải harness lại từ cấu hình hiện tại.

## Khám phá mô hình

Theo mặc định, Plugin Codex hỏi app-server về các mô hình khả dụng. Nếu việc khám phá
thất bại hoặc hết thời gian, nó dùng danh mục dự phòng đi kèm cho:

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

Tắt khám phá khi bạn muốn khởi động tránh thăm dò Codex và bám theo danh mục
dự phòng:

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

Binary được quản lý được phát hành cùng gói Plugin `codex`. Điều này giữ phiên bản
app-server gắn với Plugin đi kèm thay vì bất kỳ Codex CLI riêng nào tình cờ được
cài cục bộ. Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một executable khác.

Theo mặc định, OpenClaw khởi động các phiên harness Codex cục bộ ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ đáng tin cậy dùng
cho Heartbeat tự trị: Codex có thể dùng công cụ shell và mạng mà không dừng lại ở
các lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

Để chọn dùng phê duyệt do guardian của Codex xét duyệt, đặt `appServer.mode:
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
rời sandbox, ghi ra ngoài workspace, hoặc thêm quyền như truy cập mạng, Codex định tuyến
yêu cầu phê duyệt đó đến reviewer gốc thay vì lời nhắc cho con người. Reviewer áp dụng
khung rủi ro của Codex và phê duyệt hoặc từ chối yêu cầu cụ thể. Dùng Guardian khi bạn
muốn nhiều hàng rào bảo vệ hơn chế độ YOLO nhưng vẫn cần agent không người giám sát
tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`.
Các trường chính sách riêng lẻ vẫn ghi đè `mode`, nên triển khai nâng cao có thể kết hợp
preset với lựa chọn rõ ràng. Giá trị reviewer cũ hơn `guardian_subagent` vẫn được chấp nhận
như một bí danh tương thích, nhưng cấu hình mới nên dùng `auto_review`.

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

Các lần khởi chạy app-server stdio mặc định kế thừa môi trường tiến trình của OpenClaw,
nhưng OpenClaw sở hữu cầu nối tài khoản app-server Codex và đặt cả
`CODEX_HOME` lẫn `HOME` thành thư mục theo từng agent dưới trạng thái OpenClaw của agent đó.
Bộ nạp skill riêng của Codex đọc `$CODEX_HOME/skills` và
`$HOME/.agents/skills`, nên cả hai giá trị đều được biệt lập cho các lần khởi chạy
app-server cục bộ. Điều đó giữ skills gốc của Codex, plugins, cấu hình, tài khoản và
trạng thái thread nằm trong phạm vi agent OpenClaw thay vì rò rỉ từ home Codex CLI
cá nhân của người vận hành.

OpenClaw plugins và snapshot skill OpenClaw vẫn đi qua registry Plugin và bộ nạp skill
riêng của OpenClaw. Tài sản Codex CLI cá nhân thì không. Nếu bạn có skills hoặc plugins
Codex CLI hữu ích cần trở thành một phần của agent OpenClaw, hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Provider di trú Codex sao chép skills vào workspace agent OpenClaw hiện tại.
Plugins gốc của Codex, hooks và tệp cấu hình được báo cáo hoặc lưu trữ để xem xét thủ công
thay vì được kích hoạt tự động, vì chúng có thể thực thi lệnh, phơi bày máy chủ MCP,
hoặc mang thông tin xác thực.

Xác thực được chọn theo thứ tự này:

1. Một hồ sơ xác thực Codex OpenClaw rõ ràng cho agent.
2. Tài khoản hiện có của app-server trong home Codex của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server nào hiện diện và xác thực OpenAI
   vẫn bắt buộc.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó loại bỏ
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được spawn. Điều đó giữ
các khóa API cấp Gateway khả dụng cho embeddings hoặc mô hình OpenAI trực tiếp
mà không vô tình khiến các lượt app-server Codex gốc bị tính phí qua API.
Hồ sơ khóa API Codex rõ ràng và dự phòng env-key stdio cục bộ dùng đăng nhập app-server
thay vì env tiến trình con kế thừa. Các kết nối app-server WebSocket không nhận dự phòng
khóa API env của Gateway; hãy dùng một hồ sơ xác thực rõ ràng hoặc tài khoản riêng của
app-server từ xa.

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex được tạo ra.

Các công cụ động của Codex mặc định dùng hồ sơ `native-first`. Ở chế độ đó,
OpenClaw không hiển thị các công cụ động trùng lặp với các thao tác workspace
gốc của Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` và
`update_plan`. Các công cụ tích hợp OpenClaw như nhắn tin, phiên, phương tiện,
cron, trình duyệt, node, gateway, `heartbeat_respond` và `web_search` vẫn
khả dụng.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định         | Ý nghĩa                                                                                       |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Dùng `"openclaw-compat"` để hiển thị toàn bộ bộ công cụ động OpenClaw cho app-server Codex.   |
| `codexDynamicToolsExclude` | `[]`             | Tên các công cụ động OpenClaw bổ sung cần bỏ qua trong các lượt app-server Codex.             |

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                | Ý nghĩa                                                                                                                                                                                                                                              |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                               | `"stdio"` tạo Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                               |
| `command`           | tệp nhị phân Codex được quản lý         | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt trường này khi cần ghi đè rõ ràng.                                                                                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                                                                                                                                         |
| `url`               | chưa đặt                                | URL app-server WebSocket.                                                                                                                                                                                                                            |
| `authToken`         | chưa đặt                                | Bearer token cho transport WebSocket.                                                                                                                                                                                                                |
| `headers`           | `{}`                                    | Header WebSocket bổ sung.                                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                    | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được tạo sau khi OpenClaw xây dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cô lập Codex theo từng agent của OpenClaw khi khởi chạy cục bộ.              |
| `requestTimeoutMs`  | `60000`                                 | Thời gian chờ cho các lệnh gọi control plane app-server.                                                                                                                                                                                             |
| `mode`              | `"yolo"`                                | Cấu hình sẵn cho thực thi YOLO hoặc được guardian duyệt.                                                                                                                                                                                             |
| `approvalPolicy`    | `"never"`                               | Chính sách phê duyệt Codex gốc được gửi tới lúc bắt đầu/tiếp tục/lượt của luồng.                                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                  | Chế độ sandbox Codex gốc được gửi tới lúc bắt đầu/tiếp tục luồng.                                                                                                                                                                                    |
| `approvalsReviewer` | `"user"`                                | Dùng `"auto_review"` để cho Codex xem xét các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là bí danh cũ.                                                                                                                                       |
| `serviceTier`       | chưa đặt                                | Tầng dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"` hoặc `null`. Các giá trị cũ không hợp lệ sẽ bị bỏ qua.                                                                                                                                   |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu `item/tool/call` của Codex phải nhận
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín
hiệu công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho
Codex để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt của Codex,
harness cũng kỳ vọng Codex kết thúc lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong 60 giây sau phản hồi đó, OpenClaw sẽ cố gắng hết mức
để ngắt lượt Codex, ghi lại chẩn đoán hết thời gian chờ và giải phóng làn phiên
OpenClaw để các tin nhắn trò chuyện tiếp theo không bị xếp hàng sau một lượt
gốc đã cũ.

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị xóa. Thay vào đó, hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được duyệt như phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Codex sử dụng máy tính](/vi/plugins/codex-computer-use).

Bản ngắn gọn: OpenClaw không đóng gói ứng dụng điều khiển desktop hoặc tự thực
thi các hành động desktop. OpenClaw chuẩn bị app-server Codex, xác minh rằng
MCP server `computer-use` khả dụng, rồi để Codex xử lý các lệnh gọi công cụ MCP
gốc trong các lượt chế độ Codex.

Để truy cập trực tiếp driver TryCua bên ngoài luồng marketplace Codex, hãy đăng
ký `cua-driver mcp` bằng `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Xem [Codex sử dụng máy tính](/vi/plugins/codex-computer-use) để biết sự khác biệt
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

Sử dụng máy tính chỉ dành cho macOS và có thể cần quyền hệ điều hành cục bộ
trước khi MCP server Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled`
là true và MCP server không khả dụng, các lượt chế độ Codex sẽ thất bại trước
khi luồng bắt đầu thay vì âm thầm chạy mà không có các công cụ Sử dụng máy tính
gốc. Xem [Codex sử dụng máy tính](/vi/plugins/codex-computer-use) để biết các lựa
chọn marketplace, giới hạn catalog từ xa, lý do trạng thái và cách khắc phục sự
cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace
Codex Desktop chuẩn được đóng gói từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi thay đổi
cấu hình runtime hoặc Sử dụng máy tính để các phiên hiện có không giữ ràng buộc
PI hoặc luồng Codex cũ.

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

Phê duyệt Codex được guardian duyệt:

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
gắn với một luồng Codex hiện có, lượt tiếp theo gửi lại mô hình OpenAI, nhà
cung cấp, chính sách phê duyệt, sandbox và tầng dịch vụ hiện được chọn tới
app-server. Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ ràng buộc
luồng nhưng yêu cầu Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin được đóng gói đăng ký `/codex` làm lệnh gạch chéo được ủy quyền. Lệnh
này mang tính chung và hoạt động trên bất kỳ kênh nào hỗ trợ lệnh văn bản
OpenClaw.

Các dạng phổ biến:

- `/codex status` hiển thị kết nối máy chủ ứng dụng trực tiếp, mô hình, tài khoản, giới hạn tốc độ, máy chủ MCP và skills.
- `/codex models` liệt kê các mô hình máy chủ ứng dụng Codex trực tiếp.
- `/codex threads [filter]` liệt kê các luồng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex compact luồng đã gắn.
- `/codex review` bắt đầu đánh giá gốc của Codex cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho luồng đã gắn.
- `/codex computer-use status` kiểm tra Plugin Computer Use đã cấu hình và máy chủ MCP.
- `/codex computer-use install` cài đặt Plugin Computer Use đã cấu hình và tải lại các máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê skills của máy chủ ứng dụng Codex.

### Quy trình gỡ lỗi phổ biến

Khi một agent dựa trên Codex làm điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu với cuộc hội thoại nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả điều bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán Gateway
   cục bộ và, vì phiên đang dùng harness Codex, cũng
   gửi gói phản hồi Codex liên quan đến máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc luồng hỗ trợ.
   Phản hồi này bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id luồng Codex và một dòng `Inspect locally` cho mỗi luồng Codex.
4. Nếu bạn muốn tự gỡ lỗi lần chạy, hãy chạy lệnh `Inspect locally` được in ra
   trong terminal. Lệnh trông giống `codex resume <thread-id>` và mở
   luồng Codex gốc để bạn có thể kiểm tra cuộc hội thoại, tiếp tục cục bộ,
   hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho luồng hiện đang gắn mà không có toàn bộ gói chẩn đoán OpenClaw
Gateway. Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là
điểm bắt đầu tốt hơn vì nó liên kết trạng thái Gateway cục bộ và id luồng Codex
trong cùng một phản hồi. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics)
để biết đầy đủ mô hình quyền riêng tư và hành vi trong nhóm chat.

OpenClaw lõi cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu làm lệnh chẩn đoán
Gateway chung. Lời nhắc phê duyệt của lệnh hiển thị phần mở đầu về dữ liệu nhạy cảm,
liên kết đến [Xuất Chẩn Đoán](/vi/gateway/diagnostics), và yêu cầu
`openclaw gateway diagnostics export --json` thông qua phê duyệt thực thi rõ ràng
mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê duyệt,
OpenClaw gửi một báo cáo có thể dán với đường dẫn gói cục bộ và tóm tắt
manifest. Khi phiên OpenClaw đang hoạt động dùng harness Codex, cùng
phê duyệt đó cũng cho phép gửi các gói phản hồi Codex liên quan đến
máy chủ OpenAI. Lời nhắc phê duyệt nói rằng phản hồi Codex sẽ được gửi, nhưng
không liệt kê id phiên hoặc luồng Codex trước khi phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong nhóm chat, OpenClaw giữ cho
kênh chung gọn gàng: nhóm chỉ nhận một thông báo ngắn, trong khi
phần mở đầu chẩn đoán, lời nhắc phê duyệt, và id phiên/luồng Codex được gửi đến
chủ sở hữu qua tuyến phê duyệt riêng tư. Nếu không có tuyến riêng tư đến chủ sở hữu,
OpenClaw từ chối yêu cầu trong nhóm và yêu cầu chủ sở hữu chạy lệnh từ DM.

Lần tải Codex đã được phê duyệt gọi `feedback/upload` của máy chủ ứng dụng Codex và yêu cầu
máy chủ ứng dụng bao gồm nhật ký cho từng luồng được liệt kê và các luồng con Codex đã sinh
khi có. Lần tải đi qua đường dẫn phản hồi bình thường của Codex đến máy chủ OpenAI;
nếu phản hồi Codex bị tắt trong máy chủ ứng dụng đó, lệnh trả về
lỗi máy chủ ứng dụng. Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh,
id phiên OpenClaw, id luồng Codex, và các lệnh `codex resume <thread-id>`
cục bộ cho các luồng đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không in các id Codex đó. Lần tải này không thay thế bản xuất chẩn đoán
Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà harness dùng cho
các lượt bình thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền
mô hình OpenClaw hiện được chọn vào máy chủ ứng dụng, và giữ lịch sử mở rộng
được bật.

### Kiểm tra một luồng Codex từ CLI

Cách nhanh nhất để hiểu một lần chạy Codex lỗi thường là mở trực tiếp luồng Codex
gốc:

```sh
codex resume <thread-id>
```

Dùng cách này khi bạn nhận thấy lỗi trong một cuộc hội thoại kênh và muốn kiểm tra
phiên Codex có vấn đề, tiếp tục phiên đó cục bộ, hoặc hỏi Codex vì sao nó đưa ra
một lựa chọn công cụ hoặc suy luận cụ thể. Đường đi dễ nhất thường là chạy
`/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo đã hoàn tất liệt kê
từng luồng Codex và in một lệnh `Inspect locally`, ví dụ
`codex resume <thread-id>`. Bạn có thể sao chép trực tiếp lệnh đó vào terminal.

Bạn cũng có thể lấy id luồng từ `/codex binding` cho chat hiện tại hoặc
`/codex threads [filter]` cho các luồng máy chủ ứng dụng Codex gần đây, rồi chạy cùng
lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Từng
phương thức điều khiển được báo cáo là `unsupported by this Codex app-server` nếu một
máy chủ ứng dụng tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Harness Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Khả năng tương thích sản phẩm/Plugin trên các harness PI và Codex.  |
| Middleware tiện ích mở rộng máy chủ ứng dụng Codex | Plugin đi kèm OpenClaw | Hành vi adapter theo từng lượt quanh các công cụ động OpenClaw.     |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin OpenClaw. Với cầu nối công cụ gốc và quyền được hỗ trợ,
OpenClaw tiêm cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest`, và `Stop`. Các hook Codex khác như `SessionStart` và
`UserPromptSubmit` vẫn là điều khiển cấp Codex; chúng không được cung cấp như
hook Plugin OpenClaw trong hợp đồng v1.

Với các công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, nên OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong
adapter harness. Với các công cụ gốc của Codex, Codex sở hữu bản ghi công cụ chuẩn.
OpenClaw có thể phản chiếu một số sự kiện được chọn, nhưng không thể ghi lại luồng Codex
gốc trừ khi Codex cung cấp thao tác đó qua máy chủ ứng dụng hoặc callback hook gốc.

Các phép chiếu vòng đời Compaction và LLM đến từ thông báo máy chủ ứng dụng Codex
và trạng thái adapter OpenClaw, không phải từ lệnh hook Codex gốc.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và
`llm_output` của OpenClaw là quan sát cấp adapter, không phải bản ghi từng byte
của yêu cầu nội bộ hoặc payload Compaction của Codex.

Thông báo máy chủ ứng dụng `hook/started` và `hook/completed` gốc của Codex
được chiếu thành sự kiện agent `codex_app_server.hook` để phục vụ quỹ đạo và gỡ lỗi.
Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác bên dưới. Codex sở hữu nhiều hơn
vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt Plugin và phiên của mình
quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                       | Hỗ trợ                                  | Lý do                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI qua Codex            | Được hỗ trợ                             | Máy chủ ứng dụng Codex sở hữu lượt OpenAI, tiếp tục luồng gốc, và tiếp tục công cụ gốc.                                                                                                               |
| Định tuyến và phân phối kênh OpenClaw        | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage, và các kênh khác nằm ngoài runtime mô hình.                                                                                                             |
| Công cụ động OpenClaw                        | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                      |
| Plugin prompt và ngữ cảnh                    | Được hỗ trợ                             | OpenClaw xây dựng các lớp phủ prompt và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                          |
| Vòng đời công cụ ngữ cảnh                    | Được hỗ trợ                             | Tập hợp, nạp hoặc bảo trì sau lượt, và phối hợp Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                              |
| Hook công cụ động                            | Được hỗ trợ                             | `before_tool_call`, `after_tool_call`, và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                  |
| Hook vòng đời                                | Được hỗ trợ dưới dạng quan sát adapter  | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, và `after_compaction` kích hoạt với payload trung thực ở chế độ Codex.                                                                   |
| Cổng chỉnh sửa câu trả lời cuối              | Được hỗ trợ qua relay hook gốc          | `Stop` của Codex được relay đến `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                                    |
| Chặn hoặc quan sát shell, patch và MCP gốc   | Được hỗ trợ qua relay hook gốc          | `PreToolUse` và `PostToolUse` của Codex được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Hỗ trợ chặn; không hỗ trợ ghi lại đối số. |
| Chính sách quyền gốc                         | Được hỗ trợ qua relay hook gốc          | `PermissionRequest` của Codex có thể được định tuyến qua chính sách OpenClaw khi runtime cung cấp nó. Nếu OpenClaw không trả về quyết định nào, Codex tiếp tục qua guardian bình thường hoặc đường dẫn phê duyệt của người dùng. |
| Thu thập quỹ đạo máy chủ ứng dụng            | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu nó đã gửi đến máy chủ ứng dụng và các thông báo máy chủ ứng dụng mà nó nhận được.                                                                                            |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Hướng đi tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                       | Các hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Cần hỗ trợ hook/schema của Codex cho đầu vào công cụ thay thế.                            |
| Lịch sử bản ghi luồng gốc của Codex có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên thay đổi nội bộ không được hỗ trợ. | Thêm API máy chủ ứng dụng Codex rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc của Codex | Hook đó biến đổi các lần ghi bản ghi do OpenClaw sở hữu, không phải bản ghi công cụ gốc của Codex.                                                           | Có thể phản chiếu các bản ghi đã biến đổi, nhưng việc viết lại chuẩn cần hỗ trợ từ Codex.              |
| Siêu dữ liệu Compaction gốc phong phú                     | OpenClaw quan sát thời điểm bắt đầu và hoàn tất Compaction, nhưng không nhận được danh sách giữ/lược bỏ ổn định, delta token, hoặc payload tóm tắt.            | Cần sự kiện Compaction phong phú hơn từ Codex.                                                     |
| Can thiệp Compaction                             | Các hook Compaction hiện tại của OpenClaw ở mức thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau Compaction của Codex nếu Plugin cần phủ quyết hoặc viết lại Compaction gốc. |
| Ghi lại yêu cầu API mô hình chính xác từng byte             | OpenClaw có thể ghi lại các yêu cầu và thông báo của máy chủ ứng dụng, nhưng lõi Codex tự xây dựng yêu cầu API OpenAI cuối cùng ở bên trong.                      | Cần sự kiện truy vết yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Công cụ, phương tiện và Compaction

Harness Codex chỉ thay đổi executor tác nhân nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw bình thường.

Relay hook gốc được cố ý thiết kế tổng quát, nhưng hợp đồng hỗ trợ v1
chỉ giới hạn ở các đường dẫn công cụ gốc của Codex và quyền mà OpenClaw kiểm thử. Trong
runtime Codex, điều đó bao gồm các payload shell, patch và MCP `PreToolUse`,
`PostToolUse`, và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
là một bề mặt Plugin OpenClaw cho đến khi hợp đồng runtime nêu tên
nó.

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xem đó là không có
quyết định hook và rơi xuống đường dẫn guardian hoặc phê duyệt người dùng của chính nó.

Các yêu cầu phê duyệt công cụ Codex MCP được định tuyến qua luồng phê duyệt Plugin
của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Các prompt `request_user_input` của Codex được gửi lại tới
cuộc trò chuyện gốc, và tin nhắn theo dõi tiếp theo trong hàng đợi trả lời yêu cầu máy chủ
gốc đó thay vì được điều hướng như ngữ cảnh bổ sung. Các yêu cầu elicitation MCP khác
vẫn thất bại theo hướng đóng.

Điều hướng hàng đợi lượt đang hoạt động ánh xạ vào `turn/steer` của máy chủ ứng dụng Codex. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom các tin nhắn trò chuyện đã xếp hàng
trong khoảng lặng được cấu hình và gửi chúng thành một yêu cầu `turn/steer` duy nhất theo
thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
review và Compaction thủ công của Codex có thể từ chối điều hướng trong cùng lượt, trong trường hợp đó
OpenClaw dùng hàng đợi theo dõi khi chế độ đã chọn cho phép fallback. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng harness Codex, Compaction luồng gốc được
ủy quyền cho máy chủ ứng dụng Codex. OpenClaw giữ một bản phản chiếu bản ghi cho lịch sử
kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc harness trong tương lai. Bản
phản chiếu bao gồm prompt của người dùng, văn bản trợ lý cuối cùng, và các bản ghi lập luận hoặc kế hoạch
nhẹ của Codex khi máy chủ ứng dụng phát ra chúng. Hiện tại, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa hiển thị
bản tóm tắt Compaction dễ đọc cho con người hoặc danh sách có thể kiểm toán về những mục Codex
giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không
viết lại các bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ vào bản ghi phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS, và khả năng
hiểu phương tiện tiếp tục dùng các thiết lập provider/mô hình tương ứng như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` bình thường:** điều đó là dự kiến với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc một ref `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra liệu `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex trong khi kiểm thử. Runtime
Codex bị ép buộc sẽ thất bại thay vì fallback về PI. Sau khi máy chủ ứng dụng Codex
được chọn, các lỗi của nó sẽ hiển thị trực tiếp.

**Máy chủ ứng dụng bị từ chối:** nâng cấp Codex để quá trình bắt tay máy chủ ứng dụng
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các prerelease cùng phiên bản hoặc phiên bản có hậu tố build
như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì ngưỡng giao thức
ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Truyền tải WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo máy chủ ứng dụng từ xa nói cùng phiên bản giao thức máy chủ ứng dụng Codex.

**Một mô hình không phải Codex dùng PI:** điều đó là dự kiến trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho tác nhân đó hoặc chọn một ref
`codex/*` cũ. Các ref `openai/gpt-*` thuần và provider khác vẫn ở trên đường dẫn
provider bình thường của chúng trong chế độ `auto`. Nếu bạn buộc `agentRuntime.id: "codex"`, mọi lượt
nhúng cho tác nhân đó phải là mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu lỗi vẫn còn, khởi động lại
gateway để xóa các đăng ký hook gốc cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, khởi động lại Codex Computer Use hoặc Codex Desktop và thử lại.

## Liên quan

- [Plugin harness tác nhân](/vi/plugins/sdk-agent-harness)
- [Runtime tác nhân](/vi/concepts/agent-runtimes)
- [Provider mô hình](/vi/concepts/model-providers)
- [Provider OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook Plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
