---
read_when:
    - Bạn muốn sử dụng bộ khung app-server Codex đi kèm
    - Bạn cần các ví dụ cấu hình bộ chạy Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác nhân nhúng của OpenClaw qua bộ khung app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-05T01:48:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt tác nhân nhúng thông qua
Codex app-server thay vì harness PI tích hợp sẵn.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên tác nhân cấp thấp: khám phá
mô hình, tiếp tục luồng gốc, compaction gốc và thực thi app-server.
OpenClaw vẫn sở hữu các kênh chat, tệp phiên, lựa chọn mô hình, công cụ,
phê duyệt, gửi phương tiện và bản sao transcript hiển thị.

Khi một lượt chat nguồn chạy qua harness Codex, các phản hồi hiển thị mặc định
dùng công cụ OpenClaw `message` nếu bản triển khai chưa cấu hình rõ
`messages.visibleReplies`. Tác nhân vẫn có thể hoàn tất lượt Codex của nó một
cách riêng tư; nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ phản hồi cuối của chat trực tiếp
trên đường gửi tự động cũ.

Các lượt Codex heartbeat cũng nhận công cụ `heartbeat_respond` theo mặc định, để
tác nhân có thể ghi lại việc lần đánh thức nên giữ im lặng hay thông báo mà
không mã hóa luồng điều khiển đó trong văn bản cuối.

Hướng dẫn chủ động dành riêng cho Heartbeat được gửi dưới dạng chỉ dẫn developer
ở chế độ cộng tác Codex trên chính lượt heartbeat đó. Các lượt chat thông thường
khôi phục chế độ Codex Default thay vì mang triết lý heartbeat trong prompt
runtime bình thường của chúng.

Nếu bạn đang cố định hướng, hãy bắt đầu với
[Runtime tác nhân](/vi/concepts/agent-runtimes). Bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, còn Telegram,
Discord, Slack hoặc kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Hầu hết người dùng muốn "Codex trong OpenClaw" sẽ muốn tuyến này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, rồi chạy các lượt tác nhân nhúng thông qua runtime
Codex app-server gốc. Tham chiếu mô hình vẫn giữ chuẩn là
`openai/gpt-*`; xác thực gói đăng ký đến từ tài khoản/hồ sơ Codex, không đến từ
tiền tố mô hình `openai-codex/*`.

Trước tiên đăng nhập bằng Codex OAuth nếu bạn chưa làm:

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

Đừng dùng `openai-codex/gpt-*` khi ý bạn là runtime Codex gốc. Tiền tố đó là
tuyến "Codex OAuth thông qua PI" rõ ràng. Thay đổi cấu hình áp dụng cho phiên
mới hoặc phiên được đặt lại; các phiên hiện có giữ runtime đã ghi nhận của chúng.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số năng lực riêng biệt:

| Năng lực                          | Cách bạn dùng                                      | Việc nó làm                                                                    |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime nhúng gốc                 | `agentRuntime.id: "codex"`                          | Chạy các lượt tác nhân nhúng OpenClaw thông qua Codex app-server.              |
| Lệnh điều khiển chat gốc          | `/codex bind`, `/codex resume`, `/codex steer`, ... | Liên kết và điều khiển các luồng Codex app-server từ một cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục Codex app-server | nội bộ `codex`, được bộc lộ qua harness        | Cho phép runtime khám phá và xác thực các mô hình app-server.                  |
| Đường hiểu phương tiện Codex      | đường tương thích mô hình hình ảnh `codex/*`        | Chạy các lượt Codex app-server có giới hạn cho mô hình hiểu hình ảnh được hỗ trợ. |
| Chuyển tiếp hook gốc              | Hook Plugin quanh các sự kiện Codex gốc             | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất gốc của Codex được hỗ trợ. |

Bật Plugin sẽ làm các năng lực đó khả dụng. Nó **không**:

- bắt đầu dùng Codex cho mọi mô hình OpenAI
- chuyển đổi tham chiếu mô hình `openai-codex/*` thành runtime gốc
- đặt ACP/acpx làm đường Codex mặc định
- hot-switch các phiên hiện có vốn đã ghi nhận runtime PI
- thay thế việc gửi kênh OpenClaw, tệp phiên, lưu trữ hồ sơ xác thực hoặc
  định tuyến tin nhắn

Cùng Plugin này cũng sở hữu bề mặt lệnh điều khiển chat `/codex` gốc. Nếu
Plugin được bật và người dùng yêu cầu liên kết, tiếp tục, điều hướng, dừng hoặc
kiểm tra các luồng Codex từ chat, tác nhân nên ưu tiên `/codex ...` thay vì ACP.
ACP vẫn là phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang
kiểm thử bộ chuyển đổi ACP Codex.

Các lượt Codex gốc giữ hook Plugin OpenClaw làm lớp tương thích công khai.
Đây là các hook OpenClaw trong tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho bản ghi transcript được phản chiếu
- `before_agent_finalize` thông qua chuyển tiếp Codex `Stop`
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập với runtime để
viết lại kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và
trước khi kết quả được trả về Codex. Điều này tách biệt với hook Plugin công khai
`tool_result_persist`, vốn biến đổi các lần ghi kết quả công cụ trong transcript
do OpenClaw sở hữu.

Để biết chính ngữ nghĩa hook Plugin, xem [hook Plugin](/vi/plugins/hooks)
và [hành vi bảo vệ Plugin](/vi/tools/plugin).

Harness bị tắt theo mặc định. Cấu hình mới nên giữ tham chiếu mô hình OpenAI
theo chuẩn là `openai/gpt-*` và ép rõ
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi muốn
thực thi app-server gốc. Tham chiếu mô hình cũ `codex/*` vẫn tự động chọn
harness để tương thích, nhưng các tiền tố nhà cung cấp cũ được runtime hậu thuẫn
không được hiển thị như lựa chọn mô hình/nhà cung cấp bình thường.

Nếu Plugin `codex` được bật nhưng mô hình chính vẫn là
`openai-codex/*`, `openclaw doctor` sẽ cảnh báo thay vì thay đổi tuyến. Điều đó
là có chủ ý: `openai-codex/*` vẫn là đường PI Codex OAuth/gói đăng ký, còn thực
thi app-server gốc vẫn là một lựa chọn runtime rõ ràng.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                                  | Tham chiếu mô hình        | Cấu hình runtime                       | Tuyến xác thực/hồ sơ        | Nhãn trạng thái kỳ vọng        |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth hoặc tài khoản Codex | `Runtime: OpenAI Codex`    |
| OpenAI API thông qua runner OpenClaw bình thường   | `openai/gpt-*`             | bỏ qua hoặc `runtime: "pi"`            | Khóa OpenAI API             | `Runtime: OpenClaw Pi Default` |
| Gói đăng ký ChatGPT/Codex thông qua PI             | `openai-codex/gpt-*`       | bỏ qua hoặc `runtime: "pi"`            | Nhà cung cấp OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Nhiều nhà cung cấp với chế độ tự động thận trọng   | tham chiếu theo nhà cung cấp | `agentRuntime.id: "auto"`            | Theo nhà cung cấp được chọn | Phụ thuộc runtime được chọn    |
| Phiên bộ chuyển đổi Codex ACP rõ ràng              | phụ thuộc prompt/mô hình ACP | `sessions_spawn` với `runtime: "acp"` | Xác thực backend ACP        | Trạng thái tác vụ/phiên ACP    |

Điểm tách quan trọng là nhà cung cấp so với runtime:

- `openai-codex/*` trả lời "PI nên dùng tuyến nhà cung cấp/xác thực nào?"
- `agentRuntime.id: "codex"` trả lời "vòng lặp nào nên thực thi lượt nhúng này?"
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào nên được chat này liên kết
  hoặc điều khiển?"
- ACP trả lời "tiến trình harness bên ngoài nào nên được acpx khởi chạy?"

## Chọn đúng tiền tố mô hình

Các tuyến họ OpenAI phụ thuộc vào tiền tố. Với thiết lập phổ biến gồm gói đăng
ký cộng với runtime Codex gốc, dùng `openai/*` với `agentRuntime.id: "codex"`.
Chỉ dùng `openai-codex/*` khi bạn cố ý muốn Codex OAuth thông qua PI:

| Tham chiếu mô hình                           | Đường runtime                                | Dùng khi                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Nhà cung cấp OpenAI qua hệ thống OpenClaw/PI | Bạn muốn truy cập OpenAI Platform API trực tiếp hiện tại bằng `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth qua OpenClaw/PI           | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với runner PI mặc định.       |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness Codex app-server                     | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với thực thi Codex gốc.       |

GPT-5.5 có thể xuất hiện trên cả tuyến khóa API OpenAI trực tiếp và tuyến gói
đăng ký Codex khi tài khoản của bạn bộc lộ chúng. Dùng `openai/gpt-5.5` với
harness Codex app-server cho runtime Codex gốc, `openai-codex/gpt-5.5` cho PI
OAuth, hoặc `openai/gpt-5.5` không có ghi đè runtime Codex cho lưu lượng khóa API
trực tiếp.

Tham chiếu cũ `codex/gpt-*` vẫn được chấp nhận làm bí danh tương thích. Di trú
tương thích của Doctor viết lại tham chiếu runtime chính cũ thành tham chiếu mô
hình chuẩn và ghi chính sách runtime riêng, còn các tham chiếu cũ chỉ dùng dự
phòng được giữ nguyên vì runtime được cấu hình cho toàn bộ container tác nhân.
Cấu hình PI Codex OAuth mới nên dùng `openai-codex/gpt-*`; cấu hình harness
app-server gốc mới nên dùng `openai/gpt-*` cộng với
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng
`openai-codex/gpt-*` khi hiểu hình ảnh nên chạy qua đường nhà cung cấp OpenAI
Codex OAuth. Dùng `codex/gpt-*` khi hiểu hình ảnh nên chạy qua một lượt Codex
app-server có giới hạn. Mô hình Codex app-server phải quảng bá hỗ trợ đầu vào
hình ảnh; các mô hình Codex chỉ văn bản sẽ thất bại trước khi lượt phương tiện
bắt đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn gây
ngạc nhiên, hãy bật ghi nhật ký debug cho phân hệ `agents/harness` và kiểm tra
bản ghi có cấu trúc `agent harness selected` của Gateway. Bản ghi này bao gồm id
harness được chọn, lý do chọn, chính sách runtime/dự phòng và, trong chế độ
`auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Cảnh báo doctor có nghĩa là gì

`openclaw doctor` cảnh báo khi tất cả điều sau đều đúng:

- Plugin `codex` đi kèm được bật hoặc được cho phép
- mô hình chính của một tác nhân là `openai-codex/*`
- runtime hiệu lực của tác nhân đó không phải `codex`

Cảnh báo đó tồn tại vì người dùng thường kỳ vọng "Plugin Codex được bật" hàm ý
"runtime Codex app-server gốc." OpenClaw không tự thực hiện bước nhảy đó. Cảnh
báo có nghĩa là:

- **Không cần thay đổi** nếu bạn định dùng ChatGPT/Codex OAuth thông qua PI.
- Đổi mô hình thành `openai/<model>` và đặt
  `agentRuntime.id: "codex"` nếu bạn định dùng thực thi app-server
  gốc.
- Các phiên hiện có vẫn cần `/new` hoặc `/reset` sau một thay đổi runtime,
  vì ghim runtime của phiên có tính bám dính.

Chọn harness không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng chạy,
OpenClaw ghi id harness được chọn trên phiên đó và tiếp tục dùng nó cho các lượt
sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng harness khác;
dùng `/new` hoặc `/reset` để bắt đầu một phiên mới trước khi chuyển một cuộc trò
chuyện hiện có giữa PI và Codex. Điều này tránh phát lại một transcript qua hai
hệ thống phiên gốc không tương thích.

Các phiên cũ được tạo trước khi có ghim harness được xem là đã ghim theo PI sau khi
có lịch sử bản ghi. Dùng `/new` hoặc `/reset` để chọn đưa cuộc trò chuyện đó vào
Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình hiệu lực. Harness PI mặc định xuất hiện là
`Runtime: OpenClaw Pi Default`, và harness app-server Codex xuất hiện là
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- Codex app-server `0.125.0` trở lên. Theo mặc định, Plugin đi kèm quản lý một
  binary Codex app-server tương thích, nên các lệnh `codex` cục bộ trên `PATH` sẽ
  không ảnh hưởng đến quá trình khởi động harness thông thường.
- Xác thực Codex có sẵn cho tiến trình app-server hoặc cho cầu nối xác thực
  Codex của OpenClaw. Các lần khởi chạy app-server cục bộ dùng một thư mục home
  Codex do OpenClaw quản lý cho từng agent và một `HOME` con cô lập, vì vậy theo
  mặc định chúng không đọc tài khoản, skills, Plugin, cấu hình, trạng thái thread
  cá nhân trong `~/.codex` của bạn, hoặc `$HOME/.agents/skills` gốc.

Plugin chặn các handshake app-server cũ hơn hoặc không có phiên bản. Điều đó giữ
OpenClaw trên bề mặt giao thức đã được kiểm thử.

Đối với các kiểm thử smoke live và Docker, xác thực thường đến từ tài khoản Codex CLI
hoặc một hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy app-server
stdio cục bộ cũng có thể fallback sang `CODEX_API_KEY` / `OPENAI_API_KEY` khi
không có tài khoản nào.

## Tệp bootstrap workspace

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án gốc. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào tên tệp
fallback của Codex cho các tệp persona, vì fallback của Codex chỉ áp dụng khi
thiếu `AGENTS.md`.

Để giữ parity workspace OpenClaw, harness Codex phân giải các tệp bootstrap khác
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, và `MEMORY.md` khi có) và chuyển tiếp chúng qua chỉ dẫn cấu hình
Codex trên `thread/start` và `thread/resume`. Điều này giữ cho `SOUL.md` và ngữ
cảnh persona/hồ sơ workspace liên quan vẫn hiển thị mà không nhân bản
`AGENTS.md`.

## Thêm Codex cùng với các mô hình khác

Không đặt `agentRuntime.id: "codex"` toàn cục nếu cùng agent đó cần tự do chuyển
đổi giữa Codex và các mô hình provider không phải Codex. Một runtime bị ép buộc
áp dụng cho mọi lượt nhúng của agent hoặc phiên đó. Nếu bạn chọn một mô hình
Anthropic trong khi runtime đó đang bị ép buộc, OpenClaw vẫn thử harness Codex và
đóng thất bại thay vì âm thầm định tuyến lượt đó qua PI.

Thay vào đó, hãy dùng một trong các dạng sau:

- Đặt Codex trên một agent chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ agent mặc định trên `agentRuntime.id: "auto"` và PI fallback cho việc sử
  dụng provider hỗn hợp thông thường.
- Chỉ dùng các ref cũ `codex/*` để tương thích. Cấu hình mới nên ưu tiên
  `openai/*` cùng với một chính sách runtime Codex rõ ràng.

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

- Agent `main` mặc định dùng đường dẫn provider thông thường và fallback tương thích PI.
- Agent `codex` dùng harness app-server Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho agent `codex`, lượt đó thất bại
  thay vì lặng lẽ dùng PI.

## Định tuyến lệnh agent

Agent nên định tuyến yêu cầu của người dùng theo ý định, không chỉ theo riêng từ "Codex":

| Người dùng yêu cầu...                                  | Agent nên dùng...                                |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Gắn chat này với Codex"                               | `/codex bind`                                    |
| "Tiếp tục thread Codex `<id>` ở đây"                   | `/codex resume <id>`                             |
| "Hiển thị các thread Codex"                            | `/codex threads`                                 |
| "Gửi báo cáo hỗ trợ cho một lần chạy Codex lỗi"        | `/diagnostics [note]`                            |
| "Chỉ gửi phản hồi Codex cho thread đính kèm này"       | `/codex diagnostics [note]`                      |
| "Dùng đăng ký ChatGPT/Codex của tôi với runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Dùng đăng ký ChatGPT/Codex của tôi qua PI"            | `openai-codex/*` model refs                      |
| "Chạy Codex qua ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Khởi động Claude Code/Gemini/OpenCode/Cursor trong thread" | ACP/acpx, không phải `/codex` và không phải sub-agent gốc |

OpenClaw chỉ quảng bá hướng dẫn spawn ACP cho agent khi ACP được bật, có thể
dispatch, và được hỗ trợ bởi một backend runtime đã tải. Nếu ACP không khả dụng,
system prompt và Plugin skills không nên dạy agent về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép dùng harness Codex khi bạn cần chứng minh rằng mọi lượt agent nhúng đều dùng
Codex. Runtime Plugin rõ ràng sẽ đóng thất bại và không bao giờ được âm thầm thử
lại qua PI:

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

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu Plugin Codex bị tắt,
app-server quá cũ, hoặc app-server không thể khởi động.

## Codex theo từng agent

Bạn có thể làm cho một agent chỉ dùng Codex trong khi agent mặc định vẫn giữ
cơ chế tự chọn thông thường:

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

Dùng các lệnh phiên thông thường để chuyển agent và mô hình. `/new` tạo một
phiên OpenClaw mới và harness Codex tạo hoặc tiếp tục thread app-server sidecar
của nó khi cần. `/reset` xóa binding phiên OpenClaw cho thread đó và cho phép
lượt tiếp theo phân giải harness từ cấu hình hiện tại lần nữa.

## Khám phá mô hình

Theo mặc định, Plugin Codex hỏi app-server về các mô hình khả dụng. Nếu khám phá
thất bại hoặc hết thời gian, nó dùng catalog fallback đi kèm cho:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Bạn có thể điều chỉnh khám phá trong `plugins.entries.codex.config.discovery`:

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

Binary được quản lý được đóng gói cùng gói Plugin `codex`. Điều này giữ phiên
bản app-server gắn với Plugin đi kèm thay vì bất kỳ Codex CLI riêng nào tình cờ
được cài đặt cục bộ. Chỉ đặt `appServer.command` khi bạn cố ý muốn chạy một tệp
thực thi khác.

Theo mặc định, OpenClaw khởi động các phiên harness Codex cục bộ ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ đáng tin cậy được
dùng cho Heartbeat tự động: Codex có thể dùng shell và công cụ mạng mà không
dừng ở các prompt phê duyệt gốc khi không có ai ở đó để trả lời.

Để chọn dùng phê duyệt do guardian của Codex rà soát, đặt `appServer.mode:
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

Chế độ Guardian dùng đường dẫn phê duyệt auto-review gốc của Codex. Khi Codex
yêu cầu rời sandbox, ghi bên ngoài workspace, hoặc thêm quyền như truy cập mạng,
Codex định tuyến yêu cầu phê duyệt đó tới reviewer gốc thay vì prompt cho con
người. Reviewer áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối yêu cầu
cụ thể. Dùng Guardian khi bạn muốn nhiều rào chắn hơn chế độ YOLO nhưng vẫn cần
agent không có người giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`.
Các trường chính sách riêng lẻ vẫn ghi đè `mode`, vì vậy các triển khai nâng cao
có thể kết hợp preset với lựa chọn rõ ràng. Giá trị reviewer cũ
`guardian_subagent` vẫn được chấp nhận như một alias tương thích, nhưng cấu hình
mới nên dùng `auto_review`.

Đối với app-server đã chạy, dùng transport WebSocket:

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

Các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của OpenClaw
theo mặc định, nhưng OpenClaw sở hữu cầu nối tài khoản Codex app-server và đặt cả
`CODEX_HOME` lẫn `HOME` thành các thư mục theo từng agent dưới trạng thái
OpenClaw của agent đó. Trình tải skill riêng của Codex đọc `$CODEX_HOME/skills`
và `$HOME/.agents/skills`, nên cả hai giá trị đều được cô lập cho các lần khởi
chạy app-server cục bộ. Điều đó giữ skills, Plugin, cấu hình, tài khoản và trạng
thái thread gốc của Codex trong phạm vi agent OpenClaw thay vì rò rỉ từ home
Codex CLI cá nhân của operator.

Các Plugin OpenClaw và snapshot skill OpenClaw vẫn đi qua registry Plugin và
trình tải skill riêng của OpenClaw. Tài sản Codex CLI cá nhân thì không. Nếu bạn
có skills hoặc Plugin Codex CLI hữu ích nên trở thành một phần của agent
OpenClaw, hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Provider di trú Codex sao chép skills vào workspace agent OpenClaw hiện tại.
Plugin gốc của Codex, hook và tệp cấu hình được báo cáo hoặc lưu trữ để rà soát
thủ công thay vì được kích hoạt tự động, vì chúng có thể thực thi lệnh, phơi bày
máy chủ MCP, hoặc mang thông tin xác thực.

Xác thực được chọn theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw Codex rõ ràng cho agent.
2. Tài khoản hiện có của app-server trong home Codex của agent đó.
3. Chỉ đối với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và xác thực OpenAI vẫn
   được yêu cầu.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu đăng ký ChatGPT, nó loại bỏ
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được spawn. Điều đó
giữ các khóa API cấp Gateway khả dụng cho embeddings hoặc mô hình OpenAI trực
tiếp mà không vô tình khiến các lượt app-server Codex gốc tính phí qua API. Hồ
sơ khóa API Codex rõ ràng và fallback env-key stdio cục bộ dùng đăng nhập
app-server thay vì env tiến trình con được kế thừa. Kết nối app-server WebSocket
không nhận fallback khóa API env của Gateway; hãy dùng một hồ sơ xác thực rõ ràng
hoặc tài khoản riêng của app-server từ xa.

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

Các công cụ động của Codex mặc định dùng hồ sơ `native-first`. Ở chế độ đó,
OpenClaw không hiển thị các công cụ động trùng lặp với các thao tác không gian làm việc
gốc của Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, và
`update_plan`. Các công cụ tích hợp OpenClaw như nhắn tin, phiên, phương tiện,
cron, trình duyệt, nút, Gateway, `heartbeat_respond`, và `web_search` vẫn
khả dụng.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định         | Ý nghĩa                                                                                         |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Dùng `"openclaw-compat"` để hiển thị toàn bộ bộ công cụ động OpenClaw cho app-server Codex.     |
| `codexDynamicToolsExclude` | `[]`             | Tên công cụ động OpenClaw bổ sung cần bỏ qua trong các lượt của app-server Codex.               |

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                | Ý nghĩa                                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                              | `"stdio"` sinh ra Codex; `"websocket"` kết nối đến `url`.                                                                                                                                                                                              |
| `command`           | tệp nhị phân Codex được quản lý        | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt trường này khi cần ghi đè rõ ràng.                                                                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                                                                                                                                           |
| `url`               | chưa đặt                               | URL app-server WebSocket.                                                                                                                                                                                                                              |
| `authToken`         | chưa đặt                               | Mã Bearer token cho transport WebSocket.                                                                                                                                                                                                               |
| `headers`           | `{}`                                   | Header WebSocket bổ sung.                                                                                                                                                                                                                              |
| `clearEnv`          | `[]`                                   | Tên biến môi trường bổ sung được xóa khỏi tiến trình app-server stdio được sinh ra sau khi OpenClaw dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cơ chế cô lập Codex theo từng tác nhân của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`  | `60000`                                | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                           |
| `mode`              | `"yolo"`                               | Thiết lập sẵn cho thực thi YOLO hoặc thực thi được guardian đánh giá.                                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                              | Chính sách phê duyệt Codex gốc được gửi đến thao tác bắt đầu/tiếp tục/lượt của luồng.                                                                                                                                                                  |
| `sandbox`           | `"danger-full-access"`                 | Chế độ sandbox Codex gốc được gửi đến thao tác bắt đầu/tiếp tục luồng.                                                                                                                                                                                  |
| `approvalsReviewer` | `"user"`                               | Dùng `"auto_review"` để cho Codex đánh giá các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là bí danh cũ.                                                                                                                                         |
| `serviceTier`       | chưa đặt                               | Tầng dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị cũ không hợp lệ sẽ bị bỏ qua.                                                                                                                                    |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận được
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín hiệu
công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex để
lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt của Codex, harness
cũng kỳ vọng Codex hoàn tất lượt gốc bằng `turn/completed`. Nếu app-server im lặng
trong 60 giây sau phản hồi đó, OpenClaw cố gắng ngắt lượt Codex, ghi lại chẩn đoán
hết thời gian chờ, và giải phóng làn phiên OpenClaw để các tin nhắn trò chuyện tiếp theo
không bị xếp hàng sau một lượt gốc đã cũ.

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

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
cùng tệp đã được đánh giá với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Computer Use được trình bày trong hướng dẫn thiết lập riêng:
[Codex Computer Use](/vi/plugins/codex-computer-use).

Tóm tắt: OpenClaw không vendor ứng dụng điều khiển máy tính để bàn hoặc tự thực thi
các hành động trên máy tính để bàn. Nó chuẩn bị app-server Codex, xác minh rằng
máy chủ MCP `computer-use` khả dụng, rồi để Codex xử lý các lệnh gọi công cụ MCP
gốc trong các lượt chế độ Codex.

Để truy cập trực tiếp driver TryCua bên ngoài luồng marketplace Codex, hãy đăng ký
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

Computer Use dành riêng cho macOS và có thể yêu cầu quyền hệ điều hành cục bộ trước khi
máy chủ MCP Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là true và máy chủ MCP
không khả dụng, các lượt chế độ Codex sẽ thất bại trước khi luồng bắt đầu thay vì
âm thầm chạy mà không có các công cụ Computer Use gốc. Xem
[Codex Computer Use](/vi/plugins/codex-computer-use) để biết các lựa chọn marketplace,
giới hạn danh mục từ xa, lý do trạng thái, và cách khắc phục sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace
Codex Desktop đóng gói tiêu chuẩn từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi thay đổi
cấu hình runtime hoặc Computer Use để các phiên hiện có không giữ liên kết PI
hoặc luồng Codex cũ.

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

Phê duyệt Codex được guardian đánh giá:

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
vào một luồng Codex hiện có, lượt tiếp theo sẽ gửi lại mô hình OpenAI, nhà cung cấp,
chính sách phê duyệt, sandbox, và tầng dịch vụ hiện được chọn đến app-server.
Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ liên kết luồng nhưng yêu cầu
Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin đóng gói đăng ký `/codex` làm lệnh gạch chéo được ủy quyền. Lệnh này có
tính tổng quát và hoạt động trên mọi kênh hỗ trợ lệnh văn bản OpenClaw.

Các dạng phổ biến:

- `/codex status` hiển thị kết nối máy chủ ứng dụng trực tiếp, mô hình, tài khoản, giới hạn tốc độ, máy chủ MCP và Skills.
- `/codex models` liệt kê các mô hình máy chủ ứng dụng Codex trực tiếp.
- `/codex threads [filter]` liệt kê các luồng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex compact luồng đã gắn.
- `/codex review` bắt đầu quy trình đánh giá gốc của Codex cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho luồng đã gắn.
- `/codex computer-use status` kiểm tra Plugin Computer Use và máy chủ MCP đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Computer Use đã cấu hình và tải lại các máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê Skills của máy chủ ứng dụng Codex.

Khi Codex báo lỗi giới hạn mức sử dụng, OpenClaw sẽ bao gồm thời điểm đặt lại
tiếp theo của máy chủ ứng dụng nếu Codex cung cấp. Dùng `/codex account` trong cùng
cuộc trò chuyện để kiểm tra tài khoản hiện tại và các khoảng giới hạn tốc độ.

### Quy trình gỡ lỗi phổ biến

Khi một agent dùng Codex làm điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu từ cuộc trò chuyện nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả điều bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt sẽ tạo tệp zip chẩn đoán
   Gateway cục bộ và, vì phiên đang dùng harness Codex, cũng gửi gói phản hồi
   Codex liên quan đến máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc luồng hỗ trợ.
   Phản hồi này bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id luồng Codex và một dòng `Inspect locally` cho mỗi luồng Codex.
4. Nếu bạn muốn tự gỡ lỗi lượt chạy, hãy chạy lệnh `Inspect locally` được in ra
   trong terminal. Lệnh trông giống `codex resume <thread-id>` và mở luồng Codex
   gốc để bạn có thể kiểm tra cuộc trò chuyện, tiếp tục nó cục bộ,
   hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho luồng hiện đang gắn mà không có toàn bộ gói chẩn đoán Gateway của OpenClaw.
Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là điểm bắt đầu tốt hơn vì nó
gắn trạng thái Gateway cục bộ và id luồng Codex với nhau trong một phản hồi. Xem
[Xuất chẩn đoán](/vi/gateway/diagnostics) để biết đầy đủ mô hình quyền riêng tư và
hành vi trong nhóm trò chuyện.

Phần lõi OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu như
lệnh chẩn đoán Gateway chung. Lời nhắc phê duyệt của lệnh hiển thị phần mở đầu về
dữ liệu nhạy cảm, liên kết đến [Xuất chẩn đoán](/vi/gateway/diagnostics), và yêu cầu
`openclaw gateway diagnostics export --json` thông qua phê duyệt thực thi rõ ràng
mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê duyệt,
OpenClaw gửi một báo cáo có thể dán lại với đường dẫn gói cục bộ và tóm tắt manifest.
Khi phiên OpenClaw đang hoạt động dùng harness Codex, cùng phê duyệt đó cũng cho phép
gửi các gói phản hồi Codex liên quan đến máy chủ OpenAI. Lời nhắc phê duyệt nói rằng
phản hồi Codex sẽ được gửi, nhưng không liệt kê id phiên hoặc luồng Codex trước khi
phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong nhóm trò chuyện, OpenClaw giữ kênh
chung gọn gàng: nhóm chỉ nhận một thông báo ngắn, còn phần mở đầu chẩn đoán, lời nhắc
phê duyệt và id phiên/luồng Codex được gửi cho chủ sở hữu qua tuyến phê duyệt riêng.
Nếu không có tuyến riêng cho chủ sở hữu, OpenClaw từ chối yêu cầu trong nhóm và yêu cầu
chủ sở hữu chạy lệnh đó từ DM.

Lần tải Codex đã phê duyệt sẽ gọi `feedback/upload` của máy chủ ứng dụng Codex và yêu cầu
máy chủ ứng dụng đưa vào nhật ký cho từng luồng được liệt kê và các luồng con Codex đã tạo
khi có sẵn. Việc tải lên đi qua đường phản hồi bình thường của Codex đến máy chủ OpenAI;
nếu phản hồi Codex bị tắt trong máy chủ ứng dụng đó, lệnh trả về lỗi máy chủ ứng dụng.
Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh, id phiên OpenClaw, id luồng Codex và
các lệnh `codex resume <thread-id>` cục bộ cho những luồng đã được gửi. Nếu bạn từ chối
hoặc bỏ qua phê duyệt, OpenClaw không in các id Codex đó. Việc tải lên này không thay thế
bản xuất chẩn đoán Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà harness dùng cho các lượt bình thường.
Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền mô hình OpenClaw hiện được chọn
vào máy chủ ứng dụng, và giữ lịch sử mở rộng được bật.

### Kiểm tra một luồng Codex từ CLI

Cách nhanh nhất để hiểu một lượt chạy Codex lỗi thường là mở trực tiếp luồng Codex gốc:

```sh
codex resume <thread-id>
```

Dùng cách này khi bạn nhận thấy lỗi trong một cuộc trò chuyện kênh và muốn kiểm tra
phiên Codex có vấn đề, tiếp tục nó cục bộ, hoặc hỏi Codex vì sao nó đưa ra một lựa chọn
công cụ hoặc suy luận cụ thể. Đường đi dễ nhất thường là chạy `/diagnostics [note]` trước:
sau khi bạn phê duyệt, báo cáo hoàn tất sẽ liệt kê từng luồng Codex và in một lệnh
`Inspect locally`, ví dụ `codex resume <thread-id>`. Bạn có thể sao chép trực tiếp lệnh đó
vào terminal.

Bạn cũng có thể lấy id luồng từ `/codex binding` cho cuộc trò chuyện hiện tại hoặc
`/codex threads [filter]` cho các luồng máy chủ ứng dụng Codex gần đây, rồi chạy cùng lệnh
`codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu máy chủ ứng dụng Codex `0.125.0` trở lên. Các phương thức điều khiển
riêng lẻ được báo cáo là `unsupported by this Codex app-server` nếu một máy chủ ứng dụng
tùy chỉnh hoặc trong tương lai không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Harness Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Tương thích sản phẩm/Plugin trên các harness PI và Codex.           |
| Middleware phần mở rộng máy chủ ứng dụng Codex | Plugin đi kèm OpenClaw | Hành vi bộ chuyển đổi theo lượt quanh công cụ động OpenClaw.        |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` của dự án hoặc toàn cục Codex để định tuyến
hành vi Plugin OpenClaw. Với cầu nối công cụ gốc và quyền được hỗ trợ, OpenClaw tiêm
cấu hình Codex theo luồng cho `PreToolUse`, `PostToolUse`, `PermissionRequest`, và `Stop`.
Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là điều khiển cấp Codex;
chúng không được cung cấp dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu lệnh gọi,
vì vậy OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong bộ chuyển đổi
harness. Với công cụ gốc Codex, Codex sở hữu bản ghi công cụ chuẩn. OpenClaw có thể phản chiếu
một số sự kiện được chọn, nhưng không thể viết lại luồng Codex gốc trừ khi Codex cung cấp
thao tác đó qua máy chủ ứng dụng hoặc callback hook gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo của máy chủ ứng dụng Codex
và trạng thái bộ chuyển đổi OpenClaw, không phải lệnh hook Codex gốc. Các sự kiện
`before_compaction`, `after_compaction`, `llm_input`, và `llm_output` của OpenClaw là
quan sát ở cấp bộ chuyển đổi, không phải bản chụp từng byte của yêu cầu nội bộ hoặc
payload Compaction của Codex.

Thông báo máy chủ ứng dụng `hook/started` và `hook/completed` gốc Codex được chiếu thành
sự kiện agent `codex_app_server.hook` để phục vụ quỹ đạo và gỡ lỗi. Chúng không gọi
hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác nằm bên dưới. Codex sở hữu nhiều hơn
vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt Plugin và phiên của mình quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                       | Hỗ trợ                                  | Lý do                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI qua Codex            | Được hỗ trợ                             | Máy chủ ứng dụng Codex sở hữu lượt OpenAI, tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                |
| Định tuyến và phân phối kênh OpenClaw        | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác vẫn nằm ngoài runtime mô hình.                                                                                                          |
| Công cụ động OpenClaw                        | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường thực thi.                                                                                                           |
| Plugin nhắc lệnh và ngữ cảnh                 | Được hỗ trợ                             | OpenClaw xây dựng các lớp phủ nhắc lệnh và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                       |
| Vòng đời công cụ ngữ cảnh                    | Được hỗ trợ                             | Lắp ráp, nạp hoặc bảo trì sau lượt, và phối hợp Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                              |
| Hook công cụ động                            | Được hỗ trợ                             | `before_tool_call`, `after_tool_call`, và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                  |
| Hook vòng đời                                | Được hỗ trợ dưới dạng quan sát bộ chuyển đổi | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, và `after_compaction` kích hoạt với payload trung thực của chế độ Codex.                                                                  |
| Cổng sửa câu trả lời cuối                    | Được hỗ trợ qua relay hook gốc          | `Stop` của Codex được relay đến `before_agent_finalize`; `revise` yêu cầu Codex thêm một lượt mô hình nữa trước khi hoàn tất.                                                                         |
| Chặn hoặc quan sát shell, bản vá và MCP gốc  | Được hỗ trợ qua relay hook gốc          | `PreToolUse` và `PostToolUse` của Codex được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên máy chủ ứng dụng Codex `0.125.0` trở lên. Hỗ trợ chặn; không hỗ trợ viết lại đối số. |
| Chính sách quyền gốc                         | Được hỗ trợ qua relay hook gốc          | `PermissionRequest` của Codex có thể được định tuyến qua chính sách OpenClaw nơi runtime cung cấp. Nếu OpenClaw không trả về quyết định, Codex tiếp tục qua đường guardian bình thường hoặc phê duyệt của người dùng. |
| Ghi lại quỹ đạo máy chủ ứng dụng             | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu đã gửi đến máy chủ ứng dụng và các thông báo máy chủ ứng dụng nhận được.                                                                                                      |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Lộ trình tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Biến đổi đối số công cụ native                       | Hook trước công cụ native của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ native của Codex.                                               | Cần Codex hỗ trợ hook/schema để thay thế đầu vào công cụ.                            |
| Lịch sử transcript native của Codex có thể chỉnh sửa            | Codex sở hữu lịch sử thread native chính tắc. OpenClaw sở hữu một bản sao phản chiếu và có thể chiếu ngữ cảnh trong tương lai, nhưng không nên biến đổi các phần nội bộ không được hỗ trợ. | Thêm API app-server rõ ràng của Codex nếu cần can thiệp thread native.                    |
| `tool_result_persist` cho bản ghi công cụ native của Codex | Hook đó biến đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ native của Codex.                                                           | Có thể phản chiếu các bản ghi đã biến đổi, nhưng việc viết lại chính tắc cần Codex hỗ trợ.              |
| Siêu dữ liệu Compaction native phong phú                     | OpenClaw quan sát thời điểm Compaction bắt đầu và hoàn tất, nhưng không nhận được danh sách giữ lại/loại bỏ ổn định, chênh lệch token, hoặc payload tóm tắt.            | Cần các sự kiện Compaction phong phú hơn từ Codex.                                                     |
| Can thiệp Compaction                             | Các hook Compaction hiện tại của OpenClaw ở cấp thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau Compaction của Codex nếu Plugin cần phủ quyết hoặc viết lại Compaction native. |
| Ghi lại yêu cầu API mô hình chính xác từng byte             | OpenClaw có thể ghi lại yêu cầu và thông báo của app-server, nhưng lõi Codex tự xây dựng yêu cầu API OpenAI cuối cùng ở nội bộ.                      | Cần sự kiện truy vết yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Công cụ, media và Compaction

Harness Codex chỉ thay đổi executor agent nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw thông thường.

Relay hook native được chủ ý thiết kế tổng quát, nhưng hợp đồng hỗ trợ v1
chỉ giới hạn ở các đường dẫn công cụ và quyền native của Codex mà OpenClaw kiểm thử. Trong
runtime Codex, điều đó bao gồm các payload shell, patch và MCP `PreToolUse`,
`PostToolUse` và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
đều là bề mặt Plugin của OpenClaw cho đến khi hợp đồng runtime nêu tên
nó.

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xử lý nó như không có
quyết định hook và chuyển tiếp sang đường dẫn guardian hoặc phê duyệt người dùng của chính nó.

Các yêu cầu phê duyệt công cụ MCP của Codex được định tuyến qua luồng phê duyệt
Plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Prompt `request_user_input` của Codex được gửi lại về
cuộc trò chuyện gốc, và tin nhắn tiếp theo trong hàng đợi sẽ trả lời yêu cầu native server đó
thay vì được điều hướng làm ngữ cảnh bổ sung. Các yêu cầu gợi mở MCP khác
vẫn đóng khi thất bại.

Điều hướng hàng đợi khi lượt đang hoạt động ánh xạ vào `turn/steer` của app-server Codex. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom các tin nhắn trò chuyện trong hàng đợi
trong khoảng thời gian yên lặng đã cấu hình và gửi chúng thành một yêu cầu `turn/steer` theo
thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
review và Compaction thủ công của Codex có thể từ chối điều hướng cùng lượt, trong trường hợp đó
OpenClaw dùng hàng đợi followup khi chế độ đã chọn cho phép fallback. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng harness Codex, Compaction thread native được
ủy quyền cho app-server Codex. OpenClaw giữ một bản sao transcript cho lịch sử
kênh, tìm kiếm, `/new`, `/reset` và việc chuyển đổi mô hình hoặc harness trong tương lai. Bản sao
bao gồm prompt của người dùng, văn bản assistant cuối cùng và các bản ghi reasoning hoặc plan nhẹ của Codex
khi app-server phát ra chúng. Hiện nay, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất Compaction native. Nó chưa cung cấp
bản tóm tắt Compaction dễ đọc cho con người hoặc danh sách có thể kiểm toán về những mục Codex
đã giữ lại sau Compaction.

Vì Codex sở hữu thread native chính tắc, `tool_result_persist` hiện không
viết lại các bản ghi kết quả công cụ native của Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ transcript phiên do OpenClaw sở hữu.

Tạo media không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và
hiểu media tiếp tục dùng các thiết lập provider/mô hình tương ứng như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` bình thường:** điều này là dự kiến đối với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc một ref `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra liệu `plugins.allow` có loại trừ
`codex` không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex trong khi kiểm thử. Một
runtime Codex bị buộc sẽ thất bại thay vì fallback về PI. Sau khi app-server Codex
được chọn, lỗi của nó sẽ hiển thị trực tiếp.

**App-server bị từ chối:** nâng cấp Codex để bắt tay app-server
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các bản prerelease cùng phiên bản hoặc phiên bản có hậu tố build
như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
ngưỡng giao thức ổn định `0.125.0` là mức OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo app-server từ xa nói cùng phiên bản giao thức app-server Codex.

**Một mô hình không phải Codex dùng PI:** điều này là dự kiến trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho agent đó hoặc chọn một ref
`codex/*` cũ. Các ref `openai/gpt-*` thuần và provider khác vẫn ở trên
đường dẫn provider bình thường của chúng trong chế độ `auto`. Nếu bạn buộc `agentRuntime.id: "codex"`, mọi lượt nhúng
cho agent đó phải là mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo cáo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn, khởi động lại
gateway để xóa các đăng ký hook native cũ. Nếu `computer-use.list_apps`
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
