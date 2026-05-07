---
read_when:
    - Bạn muốn sử dụng bộ khung app-server Codex đi kèm
    - Bạn cần các ví dụ cấu hình bộ khung Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì quay về PI
summary: Chạy các lượt tác nhân nhúng của OpenClaw thông qua bộ khung app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-07T13:22:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt tác nhân nhúng thông qua
Codex app-server thay vì PI harness tích hợp sẵn.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên tác nhân cấp thấp: khám phá
mô hình, tiếp tục luồng nguyên bản, compaction nguyên bản và thực thi app-server.
OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình, công cụ,
phê duyệt, phân phối phương tiện và bản sao bản ghi hiển thị.

Khi một lượt trò chuyện nguồn chạy qua Codex harness, các phản hồi hiển thị mặc định
dùng công cụ OpenClaw `message` nếu bản triển khai chưa cấu hình rõ
`messages.visibleReplies`. Tác nhân vẫn có thể kết thúc lượt Codex của nó một cách riêng tư;
nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các phản hồi cuối trong trò chuyện trực tiếp trên
đường dẫn phân phối tự động cũ.

Các lượt Codex heartbeat cũng nhận công cụ `heartbeat_respond` theo mặc định, để
tác nhân có thể ghi lại liệu lần đánh thức nên giữ im lặng hay thông báo mà không mã hóa
luồng điều khiển đó trong văn bản cuối.

Hướng dẫn chủ động riêng cho heartbeat được gửi dưới dạng chỉ dẫn nhà phát triển
chế độ cộng tác Codex trên chính lượt heartbeat. Các lượt trò chuyện thông thường khôi phục
chế độ Codex Default thay vì mang triết lý heartbeat trong prompt runtime
thông thường của chúng.

Nếu bạn đang cố định hướng, hãy bắt đầu với
[Runtime tác nhân](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, và Telegram,
Discord, Slack, hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Hầu hết người dùng muốn "Codex trong OpenClaw" sẽ muốn tuyến này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, rồi chạy các lượt tác nhân nhúng qua runtime
Codex app-server nguyên bản. Tham chiếu mô hình vẫn giữ dạng chuẩn là
`openai/gpt-*`; xác thực đăng ký đến từ tài khoản/hồ sơ Codex, không phải
từ tiền tố mô hình `openai-codex/*`.

Trước tiên đăng nhập bằng Codex OAuth nếu bạn chưa đăng nhập:

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

Không dùng `openai-codex/gpt-*` trong cấu hình. Tiền tố đó là một tuyến cũ mà
`openclaw doctor --fix` viết lại thành `openai/gpt-*` trên các mô hình chính,
dự phòng, ghi đè heartbeat/subagent/compaction, hook, ghi đè kênh,
và các ghim tuyến phiên đã lưu cũ.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số năng lực riêng biệt:

| Năng lực                          | Cách bạn dùng                                       | Nó làm gì                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime nhúng nguyên bản          | `agentRuntime.id: "codex"`                          | Chạy các lượt tác nhân nhúng OpenClaw thông qua Codex app-server.             |
| Lệnh điều khiển trò chuyện nguyên bản | `/codex bind`, `/codex resume`, `/codex steer`, ... | Ràng buộc và điều khiển các luồng Codex app-server từ một cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục Codex app-server | Nội bộ `codex`, được bộc lộ qua harness             | Cho phép runtime khám phá và xác thực các mô hình app-server.                 |
| Đường dẫn hiểu phương tiện của Codex | Đường dẫn tương thích mô hình ảnh `codex/*`         | Chạy các lượt Codex app-server có giới hạn cho các mô hình hiểu ảnh được hỗ trợ. |
| Chuyển tiếp hook nguyên bản       | Hook Plugin quanh các sự kiện nguyên bản của Codex  | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/kết thúc nguyên bản của Codex được hỗ trợ. |

Bật Plugin sẽ làm cho các năng lực đó khả dụng. Nó **không**:

- thay thế các bề mặt khóa API OpenAI trực tiếp như ảnh, embedding, giọng nói, hoặc
  realtime
- chuyển đổi tham chiếu mô hình `openai-codex/*` nếu không có `openclaw doctor --fix`
- biến ACP/acpx thành đường dẫn Codex mặc định
- chuyển nóng các phiên hiện có đã ghi nhận một runtime PI
- thay thế phân phối kênh OpenClaw, tệp phiên, lưu trữ hồ sơ xác thực, hoặc
  định tuyến tin nhắn

Cùng Plugin đó cũng sở hữu bề mặt lệnh điều khiển trò chuyện `/codex` nguyên bản. Nếu
Plugin được bật và người dùng yêu cầu ràng buộc, tiếp tục, điều hướng, dừng, hoặc kiểm tra
các luồng Codex từ trò chuyện, tác nhân nên ưu tiên `/codex ...` thay vì ACP. ACP vẫn là
phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử adapter
Codex ACP.

Các lượt Codex nguyên bản giữ các hook Plugin OpenClaw làm lớp tương thích công khai.
Đây là các hook OpenClaw trong tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho các bản ghi transcript được phản chiếu
- `before_agent_finalize` thông qua chuyển tiếp `Stop` của Codex
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập runtime để viết lại
kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và trước khi
kết quả được trả về Codex. Phần này tách biệt với hook Plugin công khai
`tool_result_persist`, vốn biến đổi các lượt ghi kết quả công cụ vào transcript do OpenClaw sở hữu.

Về chính ngữ nghĩa hook Plugin, xem [Hook Plugin](/vi/plugins/hooks)
và [Hành vi bảo vệ Plugin](/vi/tools/plugin).

Tham chiếu mô hình tác nhân OpenAI mặc định dùng harness. Cấu hình mới nên giữ
tham chiếu mô hình OpenAI ở dạng chuẩn `openai/gpt-*`; `agentRuntime.id: "codex"` vẫn
hợp lệ nhưng không còn bắt buộc cho các lượt tác nhân OpenAI. Tham chiếu mô hình `codex/*`
cũ vẫn tự động chọn harness để tương thích, nhưng các tiền tố nhà cung cấp cũ được
runtime hậu thuẫn không được hiển thị như lựa chọn mô hình/nhà cung cấp thông thường.

Nếu bất kỳ tuyến mô hình đã cấu hình nào vẫn là `openai-codex/*`, `openclaw doctor --fix`
sẽ viết lại thành `openai/*`. Với các tuyến tác nhân khớp, nó đặt runtime tác nhân
thành `codex` và giữ nguyên các ghi đè hồ sơ xác thực `openai-codex` hiện có.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                                  | Tham chiếu mô hình        | Cấu hình runtime                       | Tuyến xác thực/hồ sơ           | Nhãn trạng thái mong đợi     |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------ | ---------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex nguyên bản | `openai/gpt-*`             | bỏ qua hoặc `agentRuntime.id: "codex"` | Codex OAuth hoặc tài khoản Codex | `Runtime: OpenAI Codex`      |
| Xác thực khóa API OpenAI cho mô hình tác nhân      | `openai/gpt-*`             | bỏ qua hoặc `agentRuntime.id: "codex"` | Hồ sơ khóa API `openai-codex`  | `Runtime: OpenAI Codex`      |
| Cấu hình cũ cần doctor sửa                         | `openai-codex/gpt-*`       | được sửa thành `codex`                 | Xác thực đã cấu hình hiện có   | Kiểm tra lại sau `doctor --fix` |
| Nhà cung cấp hỗn hợp với chế độ tự động thận trọng | tham chiếu riêng theo nhà cung cấp | `agentRuntime.id: "auto"`              | Theo nhà cung cấp đã chọn      | Phụ thuộc vào runtime đã chọn |
| Phiên adapter Codex ACP rõ ràng                    | phụ thuộc prompt/mô hình ACP | `sessions_spawn` với `runtime: "acp"`  | Xác thực backend ACP           | Trạng thái tác vụ/phiên ACP  |

Phần tách quan trọng là nhà cung cấp so với runtime:

- `openai-codex/*` là một tuyến cũ mà doctor viết lại.
- `agentRuntime.id: "codex"` yêu cầu Codex harness và đóng lỗi nếu nó
  không khả dụng.
- `agentRuntime.id: "auto"` cho phép các harness đã đăng ký nhận các tuyến nhà cung cấp
  khớp; tham chiếu tác nhân OpenAI phân giải sang Codex thay vì PI.
- `/codex ...` trả lời "cuộc trò chuyện Codex nguyên bản nào nên được trò chuyện này ràng buộc
  hoặc điều khiển?"
- ACP trả lời "quy trình harness bên ngoài nào acpx nên khởi chạy?"

## Chọn đúng tiền tố mô hình

Các tuyến họ OpenAI phụ thuộc vào tiền tố. Với thiết lập phổ biến gồm gói đăng ký cộng với
runtime Codex nguyên bản, dùng `openai/*`.
Xem `openai-codex/*` là cấu hình cũ mà doctor nên viết lại:

| Tham chiếu mô hình                                | Đường dẫn runtime                         | Dùng khi                                                           |
| ------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `openai/gpt-5.4`                                  | Codex app-server harness cho lượt tác nhân | Bạn muốn mô hình tác nhân OpenAI thông qua Codex.                  |
| `openai-codex/gpt-5.5`                            | Tuyến cũ được doctor sửa                  | Bạn đang dùng cấu hình cũ; chạy `openclaw doctor --fix` để viết lại nó. |
| `openai/gpt-5.5` + hồ sơ khóa API `openai-codex`  | Codex app-server harness                  | Bạn muốn xác thực khóa API cho một mô hình tác nhân OpenAI.        |

GPT-5.5 có thể xuất hiện trên cả tuyến khóa API OpenAI trực tiếp và tuyến đăng ký Codex
khi tài khoản của bạn cung cấp chúng. Dùng `openai/gpt-5.5` với Codex app-server
harness cho runtime Codex nguyên bản, hoặc `openai/gpt-5.5` không có ghi đè runtime
Codex cho lưu lượng khóa API trực tiếp.

Tham chiếu `codex/gpt-*` cũ vẫn được chấp nhận như bí danh tương thích. Di chuyển
tương thích bằng doctor viết lại tham chiếu runtime cũ thành tham chiếu mô hình chuẩn
và ghi chính sách runtime riêng. Cấu hình native app-server harness mới
nên dùng `openai/gpt-*` cùng với `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng phân tách tiền tố. Dùng
`openai/gpt-*` cho tuyến OpenAI thông thường và `codex/gpt-*` khi việc hiểu ảnh
nên chạy qua một lượt Codex app-server có giới hạn. Không dùng
`openai-codex/gpt-*`; doctor viết lại tiền tố cũ đó thành `openai/gpt-*`. Mô hình
Codex app-server phải quảng bá hỗ trợ đầu vào ảnh; các mô hình Codex chỉ văn bản
sẽ lỗi trước khi lượt phương tiện bắt đầu.

Dùng `/status` để xác nhận harness hiệu dụng cho phiên hiện tại. Nếu lựa chọn
gây bất ngờ, bật ghi nhật ký gỡ lỗi cho phân hệ `agents/harness`
và kiểm tra bản ghi có cấu trúc `agent harness selected` của gateway. Nó
bao gồm id harness đã chọn, lý do chọn, chính sách runtime/dự phòng, và,
ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Cảnh báo doctor có nghĩa là gì

`openclaw doctor` cảnh báo khi tham chiếu mô hình đã cấu hình hoặc trạng thái tuyến phiên đã lưu
vẫn dùng `openai-codex/*`. `openclaw doctor --fix` viết lại các tuyến đó
thành:

- `openai/<model>`
- `agentRuntime.id: "codex"`

Tuyến `codex` buộc dùng Codex harness nguyên bản. Cấu hình runtime PI không
được phép cho các lượt mô hình tác nhân OpenAI.
Doctor cũng sửa các ghim phiên đã lưu cũ trên các kho phiên tác nhân được phát hiện
để các cuộc trò chuyện cũ không bị kẹt trên tuyến đã bị gỡ bỏ.

Lựa chọn harness không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng chạy,
OpenClaw ghi id harness đã chọn trên phiên đó và tiếp tục dùng nó cho
các lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng harness khác;
dùng `/new` hoặc `/reset` để bắt đầu phiên mới trước khi chuyển một cuộc trò chuyện hiện có
giữa PI và Codex. Điều này tránh phát lại một transcript qua
hai hệ thống phiên nguyên bản không tương thích.

Các phiên cũ được tạo trước khi có ghim harness được xem là đã ghim PI sau khi chúng
có lịch sử transcript. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó vào
Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình hiệu dụng. PI harness mặc định xuất hiện dưới dạng
`Runtime: OpenClaw Pi Default`, và Codex app-server harness xuất hiện dưới dạng
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- Codex app-server `0.125.0` hoặc mới hơn. Theo mặc định, Plugin đi kèm quản lý một tệp nhị phân Codex app-server tương thích, nên các lệnh `codex` cục bộ trên `PATH` không ảnh hưởng đến quá trình khởi động harness thông thường.
- Xác thực Codex khả dụng cho tiến trình app-server hoặc cho cầu nối xác thực Codex của OpenClaw. Các lần khởi chạy app-server cục bộ sử dụng thư mục home Codex do OpenClaw quản lý cho từng tác tử và một `HOME` con tách biệt, nên theo mặc định chúng không đọc tài khoản `~/.codex`, skills, plugin, cấu hình, trạng thái luồng, hoặc `$HOME/.agents/skills` gốc cá nhân của bạn.

Plugin chặn các app-server handshake cũ hơn hoặc không có phiên bản. Điều đó giữ OpenClaw trên bề mặt giao thức đã được kiểm thử.

Đối với các bài kiểm thử smoke trực tiếp và Docker, xác thực thường đến từ tài khoản Codex CLI hoặc một hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy app-server stdio cục bộ cũng có thể dự phòng về `CODEX_API_KEY` / `OPENAI_API_KEY` khi không có tài khoản.

## Tệp bootstrap của không gian làm việc

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án gốc. OpenClaw không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào tên tệp dự phòng của Codex cho các tệp persona, vì các dự phòng của Codex chỉ áp dụng khi thiếu `AGENTS.md`.

Để đạt tính tương đương không gian làm việc OpenClaw, harness Codex phân giải các tệp bootstrap khác (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, và `MEMORY.md` khi có) rồi chuyển tiếp chúng qua chỉ dẫn nhà phát triển của Codex trên `thread/start` và `thread/resume`. Điều này giữ `SOUL.md` và ngữ cảnh persona/hồ sơ không gian làm việc liên quan hiển thị trên làn định hình hành vi Codex gốc mà không sao chép `AGENTS.md`.

## Thêm Codex cùng với các mô hình khác

Không đặt `agentRuntime.id: "codex"` trên toàn cục nếu cùng một tác tử cần tự do chuyển đổi giữa Codex và các mô hình nhà cung cấp không phải Codex. Runtime bị ép buộc áp dụng cho mọi lượt nhúng của tác tử hoặc phiên đó. Nếu bạn chọn một mô hình Anthropic trong khi runtime đó bị ép buộc, OpenClaw vẫn thử harness Codex và đóng lỗi thay vì âm thầm định tuyến lượt đó qua PI.

Thay vào đó, hãy dùng một trong các dạng sau:

- Đặt Codex trên một tác tử chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ tác tử mặc định trên `agentRuntime.id: "auto"` và PI fallback cho việc sử dụng nhà cung cấp hỗn hợp thông thường.
- Chỉ dùng các tham chiếu `codex/*` cũ để tương thích. Cấu hình mới nên ưu tiên `openai/*` cộng với một chính sách runtime Codex rõ ràng.

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
- Tác tử `codex` dùng harness Codex app-server.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho tác tử `codex`, lượt đó sẽ thất bại thay vì âm thầm dùng PI.

## Định tuyến lệnh tác tử

Tác tử nên định tuyến yêu cầu người dùng theo ý định, không chỉ theo riêng từ "Codex":

| Người dùng yêu cầu...                                  | Tác tử nên dùng...                                |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind this chat to Codex"                              | `/codex bind`                                    |
| "Resume Codex thread `<id>` here"                      | `/codex resume <id>`                             |
| "Show Codex threads"                                   | `/codex threads`                                 |
| "File a support report for a bad Codex run"            | `/diagnostics [note]`                            |
| "Only send Codex feedback for this attached thread"    | `/codex diagnostics [note]`                      |
| "Use my ChatGPT/Codex subscription with Codex runtime" | `openai/*`                                       |
| "Repair old `openai-codex/*` config/session pins"      | `openclaw doctor --fix`                          |
| "Run Codex through ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in a thread" | ACP/acpx, không phải `/codex` và không phải sub-agent gốc |

OpenClaw chỉ quảng bá hướng dẫn spawn ACP cho tác tử khi ACP được bật, có thể dispatch, và được hỗ trợ bởi một backend runtime đã tải. Nếu ACP không khả dụng, lời nhắc hệ thống và plugin skills không nên dạy tác tử về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép buộc harness Codex khi bạn cần chứng minh rằng mọi lượt tác tử nhúng đều dùng Codex. Runtime Plugin rõ ràng sẽ đóng lỗi và không bao giờ âm thầm thử lại qua PI:

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

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu Plugin Codex bị tắt, app-server quá cũ, hoặc app-server không thể khởi động.

## Codex theo từng tác tử

Bạn có thể đặt một tác tử chỉ dùng Codex trong khi tác tử mặc định vẫn giữ lựa chọn tự động thông thường:

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

Dùng các lệnh phiên thông thường để chuyển đổi tác tử và mô hình. `/new` tạo một phiên OpenClaw mới và harness Codex tạo hoặc tiếp tục luồng app-server sidecar của nó khi cần. `/reset` xóa liên kết phiên OpenClaw cho luồng đó và cho phép lượt tiếp theo phân giải harness lại từ cấu hình hiện tại.

## Khám phá mô hình

Theo mặc định, Plugin Codex yêu cầu app-server cung cấp các mô hình khả dụng. Nếu khám phá thất bại hoặc hết thời gian chờ, nó dùng danh mục dự phòng đi kèm cho:

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

Tắt khám phá khi bạn muốn quá trình khởi động tránh thăm dò Codex và bám vào danh mục dự phòng:

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

Theo mặc định, Plugin khởi động tệp nhị phân Codex do OpenClaw quản lý cục bộ với:

```bash
codex app-server --listen stdio://
```

Tệp nhị phân được quản lý được phát hành cùng gói Plugin `codex`. Điều này giữ phiên bản app-server gắn với Plugin đi kèm thay vì bất kỳ Codex CLI riêng biệt nào tình cờ được cài đặt cục bộ. Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một tệp thực thi khác.

Theo mặc định, OpenClaw khởi động các phiên harness Codex cục bộ ở chế độ YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"`, và `sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ tin cậy dùng cho heartbeat tự trị: Codex có thể dùng công cụ shell và mạng mà không dừng ở lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

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

Chế độ Guardian dùng đường dẫn phê duyệt auto-review gốc của Codex. Khi Codex yêu cầu rời khỏi sandbox, ghi ra ngoài không gian làm việc, hoặc thêm quyền như truy cập mạng, Codex định tuyến yêu cầu phê duyệt đó đến reviewer gốc thay vì lời nhắc con người. Reviewer áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối yêu cầu cụ thể. Dùng Guardian khi bạn muốn nhiều rào chắn hơn chế độ YOLO nhưng vẫn cần các tác tử không người giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`. Các trường chính sách riêng lẻ vẫn ghi đè `mode`, nên các triển khai nâng cao có thể trộn preset với lựa chọn rõ ràng. Giá trị reviewer cũ hơn `guardian_subagent` vẫn được chấp nhận như một bí danh tương thích, nhưng cấu hình mới nên dùng `auto_review`.

Đối với một app-server đã chạy, dùng transport WebSocket:

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

Các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của OpenClaw theo mặc định, nhưng OpenClaw sở hữu cầu nối tài khoản Codex app-server và đặt cả `CODEX_HOME` lẫn `HOME` thành các thư mục theo từng tác tử dưới trạng thái OpenClaw của tác tử đó. Bộ tải skill riêng của Codex đọc `$CODEX_HOME/skills` và `$HOME/.agents/skills`, nên cả hai giá trị đều được tách biệt cho các lần khởi chạy app-server cục bộ. Điều đó giữ skills, plugin, cấu hình, tài khoản và trạng thái luồng gốc của Codex nằm trong phạm vi tác tử OpenClaw thay vì rò rỉ từ home Codex CLI cá nhân của người vận hành.

Plugin OpenClaw và snapshot skill OpenClaw vẫn đi qua registry plugin và bộ tải skill riêng của OpenClaw. Tài sản Codex CLI cá nhân thì không. Nếu bạn có skills hoặc plugin Codex CLI hữu ích cần trở thành một phần của tác tử OpenClaw, hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Nhà cung cấp di trú Codex sao chép skills vào không gian làm việc tác tử OpenClaw hiện tại. Plugin gốc Codex, hook và tệp cấu hình được báo cáo hoặc lưu trữ để rà soát thủ công thay vì được kích hoạt tự động, vì chúng có thể thực thi lệnh, phơi bày máy chủ MCP, hoặc mang thông tin xác thực.

Xác thực được chọn theo thứ tự này:

1. Một hồ sơ xác thực Codex OpenClaw rõ ràng cho tác tử.
2. Tài khoản hiện có của app-server trong home Codex của tác tử đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi `OPENAI_API_KEY`, khi không có tài khoản app-server và xác thực OpenAI vẫn được yêu cầu.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu đăng ký ChatGPT, nó loại bỏ `CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được spawn. Điều đó giữ các khóa API cấp Gateway khả dụng cho embeddings hoặc các mô hình OpenAI trực tiếp mà không vô tình khiến các lượt app-server Codex gốc bị tính phí qua API. Hồ sơ khóa API Codex rõ ràng và dự phòng khóa môi trường stdio cục bộ dùng đăng nhập app-server thay vì môi trường tiến trình con kế thừa. Kết nối app-server WebSocket không nhận dự phòng khóa API môi trường Gateway; hãy dùng một hồ sơ xác thực rõ ràng hoặc tài khoản riêng của app-server từ xa.

Nếu một triển khai cần tách biệt môi trường bổ sung, hãy thêm các biến đó vào `appServer.clearEnv`:

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con Codex app-server được spawn.

Codex dynamic tools mặc định dùng hồ sơ `native-first`. Trong chế độ đó,
OpenClaw không hiển thị các dynamic tools trùng lặp với thao tác workspace gốc
của Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, và
`update_plan`. Các công cụ tích hợp OpenClaw như nhắn tin, phiên, phương tiện,
Cron, trình duyệt, Node, Gateway, `heartbeat_respond`, và `web_search` vẫn
khả dụng.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định        | Ý nghĩa                                                                                              |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Dùng `"openclaw-compat"` để hiển thị toàn bộ bộ dynamic tool OpenClaw cho Codex app-server.          |
| `codexDynamicToolsExclude` | `[]`             | Tên dynamic tool OpenClaw bổ sung cần bỏ qua khỏi các lượt Codex app-server.                         |

Các trường `appServer` được hỗ trợ:

| Trường                        | Mặc định                                 | Ý nghĩa                                                                                                                                                                                                                                      |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                  |
| `command`                     | binary Codex được quản lý                | Tệp thực thi cho transport stdio. Để trống để dùng binary được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                                     |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                                                                                                                                 |
| `url`                         | chưa đặt                                 | URL WebSocket app-server.                                                                                                                                                                                                                    |
| `authToken`                   | chưa đặt                                 | Bearer token cho transport WebSocket.                                                                                                                                                                                                       |
| `headers`                     | `{}`                                     | Header WebSocket bổ sung.                                                                                                                                                                                                                   |
| `clearEnv`                    | `[]`                                     | Tên biến môi trường bổ sung bị xóa khỏi tiến trình stdio app-server được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cách ly Codex theo từng agent của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`            | `60000`                                  | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | Khoảng lặng sau một yêu cầu Codex app-server theo phạm vi lượt trong khi OpenClaw chờ `turn/completed`. Tăng giá trị này cho các pha tổng hợp chậm sau công cụ hoặc chỉ trạng thái.                                                         |
| `mode`                        | `"yolo"`                                 | Preset cho thực thi YOLO hoặc được guardian duyệt.                                                                                                                                                                                          |
| `approvalPolicy`              | `"never"`                                | Chính sách phê duyệt Codex gốc được gửi tới thread start/resume/turn.                                                                                                                                                                       |
| `sandbox`                     | `"danger-full-access"`                   | Chế độ sandbox Codex gốc được gửi tới thread start/resume.                                                                                                                                                                                  |
| `approvalsReviewer`           | `"user"`                                 | Dùng `"auto_review"` để cho Codex duyệt các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là alias kế thừa.                                                                                                                               |
| `serviceTier`                 | chưa đặt                                 | Tầng dịch vụ Codex app-server tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị kế thừa không hợp lệ bị bỏ qua.                                                                                                                        |

Các lệnh gọi dynamic tool do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận được
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín
hiệu công cụ khi được hỗ trợ và trả về phản hồi dynamic-tool thất bại cho Codex
để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt của Codex,
harness cũng kỳ vọng Codex hoàn tất lượt gốc với `turn/completed`. Nếu
app-server im lặng trong `appServer.turnCompletionIdleTimeoutMs` sau phản hồi
đó, OpenClaw sẽ cố gắng ngắt lượt Codex, ghi lại chẩn đoán timeout, và giải
phóng lane phiên OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau
một lượt gốc đã cũ. Bất kỳ thông báo chưa kết thúc nào cho cùng lượt đó, bao
gồm `rawResponseItem/completed`, sẽ vô hiệu hóa watchdog ngắn đó vì Codex đã
chứng minh lượt vẫn còn hoạt động; watchdog kết thúc dài hơn tiếp tục bảo vệ
các lượt thực sự bị kẹt. Chẩn đoán timeout bao gồm phương thức thông báo
app-server cuối cùng và, với các mục phản hồi assistant thô, loại mục, vai trò,
id, và bản xem trước văn bản assistant có giới hạn.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được duyệt như phần còn lại của thiết lập harness Codex.

## Computer use

Computer Use được trình bày trong hướng dẫn thiết lập riêng:
[Codex Computer Use](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không vendoring ứng dụng điều khiển desktop hoặc
tự thực thi thao tác desktop. Nó chuẩn bị Codex app-server, xác minh rằng máy
chủ MCP `computer-use` khả dụng, rồi để Codex xử lý các lệnh gọi công cụ MCP
gốc trong các lượt chế độ Codex.

Để truy cập trực tiếp driver TryCua bên ngoài luồng marketplace Codex, hãy đăng
ký `cua-driver mcp` bằng `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
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

Computer Use chỉ dành cho macOS và có thể yêu cầu quyền OS cục bộ trước khi
máy chủ MCP Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là true
và máy chủ MCP không khả dụng, các lượt chế độ Codex sẽ thất bại trước khi
thread bắt đầu thay vì âm thầm chạy mà không có công cụ Computer Use gốc. Xem
[Codex Computer Use](/vi/plugins/codex-computer-use) để biết các lựa chọn
marketplace, giới hạn catalog từ xa, lý do trạng thái, và xử lý sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace
Codex Desktop được đóng gói tiêu chuẩn từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi thay đổi
cấu hình runtime hoặc Computer Use để các phiên hiện có không giữ liên kết PI
hoặc thread Codex cũ.

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

Chuyển đổi mô hình vẫn do OpenClaw kiểm soát. Khi một phiên OpenClaw được gắn
vào một thread Codex hiện có, lượt tiếp theo gửi lại mô hình OpenAI, provider,
chính sách phê duyệt, sandbox, và tầng dịch vụ đang được chọn tới app-server.
Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ liên kết thread nhưng yêu
cầu Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin được đóng gói đăng ký `/codex` làm lệnh slash được ủy quyền. Lệnh này
mang tính tổng quát và hoạt động trên bất kỳ kênh nào hỗ trợ lệnh văn bản
OpenClaw.

Các dạng phổ biến:

- `/codex status` hiển thị kết nối máy chủ ứng dụng trực tiếp, mô hình, tài khoản, giới hạn tần suất, máy chủ MCP và skills.
- `/codex models` liệt kê các mô hình máy chủ ứng dụng Codex trực tiếp.
- `/codex threads [filter]` liệt kê các luồng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex thu gọn luồng đã gắn.
- `/codex review` bắt đầu quy trình đánh giá gốc của Codex cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho luồng đã gắn.
- `/codex computer-use status` kiểm tra Plugin Computer Use và máy chủ MCP đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Computer Use đã cấu hình và tải lại các máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tần suất.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê skills của máy chủ ứng dụng Codex.

Khi Codex báo lỗi giới hạn sử dụng, OpenClaw bao gồm thời điểm đặt lại tiếp theo
của máy chủ ứng dụng nếu Codex cung cấp. Dùng `/codex account` trong cùng
cuộc trò chuyện để kiểm tra tài khoản hiện tại và các khoảng thời gian giới hạn tần suất.

### Quy trình gỡ lỗi phổ biến

Khi một tác nhân dựa trên Codex làm điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu từ cuộc trò chuyện nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả những gì bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán Gateway
   cục bộ và, vì phiên đang dùng bộ khai thác Codex, cũng
   gửi gói phản hồi Codex liên quan đến máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc luồng hỗ trợ.
   Phản hồi này bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id luồng Codex và một dòng `Inspect locally` cho từng luồng Codex.
4. Nếu muốn tự gỡ lỗi lượt chạy, hãy chạy lệnh `Inspect locally` được in ra
   trong terminal. Lệnh trông giống `codex resume <thread-id>` và mở
   luồng Codex gốc để bạn có thể kiểm tra cuộc trò chuyện, tiếp tục cục bộ,
   hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho luồng hiện đang gắn mà không có đầy đủ gói chẩn đoán Gateway của OpenClaw.
Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là điểm bắt đầu tốt hơn
vì nó liên kết trạng thái Gateway cục bộ và id luồng Codex trong một phản hồi.
Xem [Xuất chẩn đoán](/vi/gateway/diagnostics)
để biết đầy đủ mô hình quyền riêng tư và hành vi trong trò chuyện nhóm.

Nhân OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu dưới dạng lệnh
chẩn đoán Gateway chung. Lời nhắc phê duyệt của lệnh này hiển thị phần mở đầu về dữ liệu nhạy cảm,
liên kết tới [Xuất chẩn đoán](/vi/gateway/diagnostics), và yêu cầu
`openclaw gateway diagnostics export --json` thông qua phê duyệt thực thi rõ ràng
mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê duyệt,
OpenClaw gửi một báo cáo có thể dán với đường dẫn gói cục bộ và tóm tắt manifest.
Khi phiên OpenClaw đang hoạt động dùng bộ khai thác Codex, cùng
phê duyệt đó cũng cho phép gửi các gói phản hồi Codex liên quan đến
máy chủ OpenAI. Lời nhắc phê duyệt nói rằng phản hồi Codex sẽ được gửi, nhưng
không liệt kê id phiên hoặc luồng Codex trước khi phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong trò chuyện nhóm, OpenClaw giữ cho
kênh chung gọn sạch: nhóm chỉ nhận một thông báo ngắn, trong khi
phần mở đầu chẩn đoán, lời nhắc phê duyệt và id phiên/luồng Codex được gửi tới
chủ sở hữu qua tuyến phê duyệt riêng tư. Nếu không có tuyến chủ sở hữu riêng tư,
OpenClaw từ chối yêu cầu nhóm và yêu cầu chủ sở hữu chạy lệnh từ DM.

Lượt tải Codex đã phê duyệt gọi `feedback/upload` của máy chủ ứng dụng Codex và yêu cầu
máy chủ ứng dụng bao gồm nhật ký cho từng luồng được liệt kê và các luồng con Codex được sinh ra
khi có sẵn. Lượt tải đi qua đường dẫn phản hồi bình thường của Codex tới máy chủ
OpenAI; nếu phản hồi Codex bị tắt trong máy chủ ứng dụng đó, lệnh trả về
lỗi máy chủ ứng dụng. Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh,
id phiên OpenClaw, id luồng Codex và các lệnh `codex resume <thread-id>` cục bộ
cho các luồng đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không in các id Codex đó. Lượt tải này không thay thế bản xuất
chẩn đoán Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết phụ mà bộ khai thác dùng cho
các lượt bình thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền
mô hình OpenClaw hiện được chọn vào máy chủ ứng dụng, và giữ bật lịch sử mở rộng.

### Kiểm tra một luồng Codex từ CLI

Cách nhanh nhất để hiểu một lượt chạy Codex lỗi thường là mở trực tiếp luồng Codex
gốc:

```sh
codex resume <thread-id>
```

Dùng cách này khi bạn nhận thấy lỗi trong một cuộc trò chuyện kênh và muốn kiểm tra
phiên Codex có vấn đề, tiếp tục phiên đó cục bộ, hoặc hỏi Codex vì sao nó đưa ra
một lựa chọn công cụ hoặc suy luận cụ thể. Đường dẫn dễ nhất thường là chạy
`/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo đã hoàn tất liệt kê
từng luồng Codex và in một lệnh `Inspect locally`, ví dụ
`codex resume <thread-id>`. Bạn có thể sao chép lệnh đó trực tiếp vào terminal.

Bạn cũng có thể lấy id luồng từ `/codex binding` cho cuộc trò chuyện hiện tại hoặc
`/codex threads [filter]` cho các luồng máy chủ ứng dụng Codex gần đây, rồi chạy cùng
lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Từng
phương thức điều khiển được báo là `unsupported by this Codex app-server` nếu một
máy chủ ứng dụng tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Bộ khai thác Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                             |
| ------------------------------------ | ------------------------ | -------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Khả năng tương thích sản phẩm/plugin giữa các bộ khai thác PI và Codex. |
| Phần mềm trung gian mở rộng máy chủ ứng dụng Codex | Các plugin đóng gói của OpenClaw | Hành vi bộ chuyển đổi theo từng lượt quanh các công cụ động OpenClaw. |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` của dự án hoặc toàn cục Codex để định tuyến
hành vi Plugin OpenClaw. Đối với cầu nối công cụ gốc và quyền được hỗ trợ,
OpenClaw tiêm cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest`, và `Stop`. Khi phê duyệt máy chủ ứng dụng Codex được bật
(`approvalPolicy` không phải `"never"`), cấu hình hook gốc được tiêm mặc định
bỏ qua `PermissionRequest` để trình đánh giá máy chủ ứng dụng của Codex và cầu nối phê duyệt của OpenClaw
xử lý các yêu cầu leo thang thực sự sau khi đánh giá. Người vận hành vẫn có thể thêm rõ ràng
`permission_request` vào `nativeHookRelay.events` khi cần rơ-le tương thích.
Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là
các điều khiển cấp Codex; chúng không được cung cấp dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Đối với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, nên OpenClaw kích hoạt hành vi plugin và phần mềm trung gian mà nó sở hữu trong
bộ chuyển đổi bộ khai thác. Đối với công cụ gốc Codex, Codex sở hữu bản ghi công cụ chuẩn.
OpenClaw có thể phản chiếu các sự kiện được chọn, nhưng nó không thể ghi lại luồng Codex
gốc trừ khi Codex cung cấp thao tác đó thông qua máy chủ ứng dụng hoặc callback
hook gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo máy chủ ứng dụng Codex
và trạng thái bộ chuyển đổi OpenClaw, không phải các lệnh hook Codex gốc.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và
`llm_output` của OpenClaw là quan sát cấp bộ chuyển đổi, không phải bản chụp từng byte
của yêu cầu nội bộ hoặc payload compaction của Codex.

Thông báo máy chủ ứng dụng `hook/started` và `hook/completed` gốc của Codex được
chiếu thành sự kiện tác nhân `codex_app_server.hook` để theo dõi quỹ đạo và gỡ lỗi.
Chúng không gọi các hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác bên dưới. Codex sở hữu nhiều hơn
vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt plugin và phiên của mình
quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                       | Hỗ trợ                                                                              | Lý do                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI thông qua Codex               | Được hỗ trợ                                                                            | Codex app-server sở hữu lượt OpenAI, tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                 |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                                                                            | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác nằm ngoài runtime mô hình.                                                                                                           |
| Công cụ động của OpenClaw                        | Được hỗ trợ                                                                            | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                                       |
| Plugin lời nhắc và ngữ cảnh                    | Được hỗ trợ                                                                            | OpenClaw xây dựng các lớp phủ lời nhắc và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                           |
| Vòng đời công cụ ngữ cảnh                      | Được hỗ trợ                                                                            | Việc lắp ráp, nhập hoặc bảo trì sau lượt, và phối hợp Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                                |
| Hook công cụ động                            | Được hỗ trợ                                                                            | `before_tool_call`, `after_tool_call` và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                                 |
| Hook vòng đời                               | Được hỗ trợ dưới dạng quan sát của adapter                                                    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` kích hoạt với payload chế độ Codex trung thực.                                                                                  |
| Cổng sửa đổi câu trả lời cuối                    | Được hỗ trợ thông qua relay hook gốc                                              | Codex `Stop` được relay tới `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                                                       |
| Shell, patch và MCP gốc chặn hoặc quan sát | Được hỗ trợ thông qua relay hook gốc                                              | Codex `PreToolUse` và `PostToolUse` được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên Codex app-server `0.125.0` hoặc mới hơn. Chặn được hỗ trợ; viết lại đối số thì không.      |
| Chính sách quyền gốc                      | Được hỗ trợ thông qua phê duyệt Codex app-server và relay hook gốc tương thích | Yêu cầu phê duyệt Codex app-server định tuyến qua OpenClaw sau khi Codex xét duyệt. Relay hook gốc `PermissionRequest` là tùy chọn tham gia cho các chế độ phê duyệt gốc vì Codex phát nó trước khi guardian xét duyệt. |
| Ghi lại quỹ đạo app-server                 | Được hỗ trợ                                                                            | OpenClaw ghi lại yêu cầu mà nó gửi tới app-server và các thông báo app-server mà nó nhận được.                                                                                                           |

Không được hỗ trợ trong Codex runtime v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Hướng tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                       | Hook trước công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc Codex.                                               | Cần hỗ trợ hook/schema của Codex cho đầu vào công cụ thay thế.                            |
| Lịch sử transcript gốc Codex có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản sao và có thể chiếu ngữ cảnh tương lai, nhưng không nên đột biến các phần nội bộ không được hỗ trợ. | Thêm API Codex app-server rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc Codex | Hook đó biến đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc Codex.                                                           | Có thể phản chiếu các bản ghi đã biến đổi, nhưng viết lại chuẩn cần Codex hỗ trợ.              |
| Siêu dữ liệu Compaction gốc phong phú                     | OpenClaw quan sát bắt đầu và hoàn tất Compaction, nhưng không nhận được danh sách giữ/bỏ ổn định, chênh lệch token hoặc payload tóm tắt.            | Cần sự kiện Compaction Codex phong phú hơn.                                                     |
| Can thiệp Compaction                             | Các hook Compaction hiện tại của OpenClaw ở cấp thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau Compaction của Codex nếu Plugin cần phủ quyết hoặc viết lại Compaction gốc. |
| Ghi lại yêu cầu API mô hình từng byte             | OpenClaw có thể ghi lại yêu cầu và thông báo app-server, nhưng lõi Codex xây dựng yêu cầu API OpenAI cuối cùng ở bên trong.                      | Cần một sự kiện truy vết yêu cầu mô hình Codex hoặc API gỡ lỗi.                                   |

## Công cụ, phương tiện và Compaction

Harness Codex chỉ thay đổi executor tác tử nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw thông thường.

Relay hook gốc được chủ ý thiết kế chung, nhưng hợp đồng hỗ trợ v1
giới hạn ở các đường dẫn công cụ gốc và quyền của Codex mà OpenClaw kiểm thử. Trong
Codex runtime, điều đó bao gồm shell, patch và các payload MCP `PreToolUse`,
`PostToolUse` và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
là một bề mặt Plugin OpenClaw cho đến khi hợp đồng runtime nêu tên nó.

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex coi nó như không có
quyết định hook và chuyển tiếp tới đường dẫn guardian hoặc phê duyệt người dùng của riêng nó.
Các chế độ phê duyệt Codex app-server mặc định bỏ qua hook gốc này; đoạn này
áp dụng khi `permission_request` được bao gồm rõ ràng trong
`nativeHookRelay.events` hoặc một runtime tương thích cài đặt nó.
Khi một operator chọn `allow-always` cho yêu cầu quyền gốc Codex,
OpenClaw ghi nhớ dấu vân tay chính xác của provider/session/tool input/cwd đó trong một
cửa sổ phiên có giới hạn. Quyết định được ghi nhớ chủ ý chỉ khớp chính xác:
một lệnh, đối số, payload công cụ hoặc cwd đã thay đổi sẽ tạo một
phê duyệt mới.

Các yêu cầu gợi mở phê duyệt công cụ MCP của Codex được định tuyến qua luồng phê duyệt
Plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Các lời nhắc `request_user_input` của Codex được gửi lại tới
cuộc trò chuyện khởi tạo, và tin nhắn theo dõi tiếp theo trong hàng đợi trả lời yêu cầu
máy chủ gốc đó thay vì được điều hướng như ngữ cảnh bổ sung. Các yêu cầu gợi mở MCP khác
vẫn fail closed.

Điều hướng hàng đợi active-run ánh xạ vào `turn/steer` của Codex app-server. Với
`messages.queue.mode: "steer"` mặc định, OpenClaw gom các tin nhắn trò chuyện trong hàng đợi
cho cửa sổ yên lặng đã cấu hình và gửi chúng như một yêu cầu `turn/steer` duy nhất theo
thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
xét duyệt Codex và Compaction thủ công có thể từ chối điều hướng cùng lượt, trong trường hợp đó
OpenClaw dùng hàng đợi theo dõi khi chế độ đã chọn cho phép fallback. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng harness Codex, Compaction luồng gốc được
ủy quyền cho Codex app-server. OpenClaw giữ một bản sao transcript cho lịch sử kênh,
tìm kiếm, `/new`, `/reset` và việc chuyển đổi mô hình hoặc harness trong tương lai. Bản sao
bao gồm lời nhắc của người dùng, văn bản trợ lý cuối cùng và các bản ghi lập luận hoặc kế hoạch Codex
nhẹ khi app-server phát chúng. Hiện nay, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa phơi bày một
tóm tắt Compaction con người đọc được hoặc danh sách có thể kiểm toán về các mục Codex
đã giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không
viết lại các bản ghi kết quả công cụ gốc Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ transcript phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và hiểu phương tiện
tiếp tục dùng các thiết lập provider/mô hình phù hợp như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` thông thường:** đây là điều được mong đợi với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc một ref `codex/*` cũ), bật
`plugins.entries.codex.enabled` và kiểm tra xem `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex khi kiểm thử. Một
runtime Codex bị ép buộc sẽ thất bại thay vì fallback về PI. Sau khi Codex app-server
được chọn, lỗi của nó hiển thị trực tiếp.

**app-server bị từ chối:** nâng cấp Codex để quá trình bắt tay app-server
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các prerelease cùng phiên bản hoặc
phiên bản có hậu tố build như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
mốc sàn giao thức ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Truyền tải WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và việc app-server từ xa nói cùng phiên bản giao thức Codex app-server.

**Một mô hình không phải Codex dùng PI:** đây là điều được mong đợi trừ khi bạn đã ép buộc
`agentRuntime.id: "codex"` cho tác tử đó hoặc chọn một ref
`codex/*` cũ. `openai/gpt-*` thuần và các ref provider khác vẫn đi trên
đường dẫn provider thông thường của chúng trong chế độ `auto`. Nếu bạn ép buộc `agentRuntime.id: "codex"`, mọi lượt nhúng
cho tác tử đó phải là mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng các công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, hãy dùng `/new` hoặc `/reset`; nếu tình trạng vẫn tiếp diễn, hãy khởi động lại
Gateway để xóa các đăng ký native hook đã cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, hãy khởi động lại Codex Computer Use hoặc Codex Desktop rồi thử lại.

## Liên quan

- [Plugin bộ điều khiển agent](/vi/plugins/sdk-agent-harness)
- [Thời gian chạy agent](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook Plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
