---
read_when:
    - Bạn muốn sử dụng bộ khung app-server Codex được đóng gói kèm
    - Bạn cần các ví dụ cấu hình bộ kiểm thử Codex
    - Bạn muốn các triển khai chỉ dùng Codex bị lỗi thay vì chuyển dự phòng sang Pi
summary: Chạy các lượt tác nhân nhúng của OpenClaw thông qua bộ harness app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-07T01:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy lượt tác nhân nhúng thông qua
Codex app-server thay vì bộ harness PI tích hợp sẵn.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên tác nhân cấp thấp: khám phá
mô hình, tiếp tục luồng gốc, Compaction gốc và thực thi app-server.
OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình, công cụ,
phê duyệt, gửi phương tiện và bản sao transcript hiển thị.

Khi một lượt trò chuyện nguồn chạy qua harness Codex, các phản hồi hiển thị mặc
định dùng công cụ `message` của OpenClaw nếu bản triển khai chưa cấu hình rõ
`messages.visibleReplies`. Tác nhân vẫn có thể hoàn tất lượt Codex của nó một
cách riêng tư; nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các phản hồi cuối cùng trong trò
chuyện trực tiếp trên đường gửi tự động cũ.

Các lượt Heartbeat của Codex cũng nhận công cụ `heartbeat_respond` theo mặc
định, để tác nhân có thể ghi lại việc lần đánh thức nên giữ im lặng hay thông
báo mà không mã hóa luồng điều khiển đó trong văn bản cuối cùng.

Hướng dẫn chủ động dành riêng cho Heartbeat được gửi dưới dạng chỉ dẫn nhà phát
triển ở chế độ cộng tác của Codex trên chính lượt Heartbeat đó. Các lượt trò
chuyện thông thường khôi phục chế độ Codex Default thay vì mang triết lý
Heartbeat trong prompt runtime bình thường của chúng.

Nếu bạn đang cố tự định hướng, hãy bắt đầu với
[Runtime tác nhân](/vi/concepts/agent-runtimes). Bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, còn Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Hầu hết người dùng muốn "Codex trong OpenClaw" đều muốn tuyến này: đăng nhập
bằng gói đăng ký ChatGPT/Codex, rồi chạy các lượt tác nhân nhúng thông qua
runtime Codex app-server gốc. Tham chiếu mô hình vẫn giữ chuẩn là
`openai/gpt-*`; xác thực đăng ký đến từ tài khoản/hồ sơ Codex, không phải từ
tiền tố mô hình `openai-codex/*`.

Trước tiên hãy đăng nhập bằng Codex OAuth nếu bạn chưa làm:

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

Không dùng `openai-codex/gpt-*` trong cấu hình. Tiền tố đó là một tuyến cũ mà
`openclaw doctor --fix` viết lại thành `openai/gpt-*` trên các mô hình chính,
dự phòng, ghi đè Heartbeat/tác nhân phụ/Compaction, hook, ghi đè kênh và các
ghim tuyến phiên đã lưu cũ.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số năng lực riêng biệt:

| Năng lực                           | Cách bạn dùng                                       | Việc nó làm                                                                  |
| ---------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime nhúng gốc                  | `agentRuntime.id: "codex"`                          | Chạy các lượt tác nhân nhúng của OpenClaw thông qua Codex app-server.         |
| Lệnh điều khiển trò chuyện gốc     | `/codex bind`, `/codex resume`, `/codex steer`, ... | Gắn và điều khiển luồng Codex app-server từ một cuộc trò chuyện nhắn tin.     |
| Nhà cung cấp/danh mục Codex app-server | nội bộ `codex`, hiển thị qua harness             | Cho phép runtime khám phá và xác thực mô hình app-server.                    |
| Đường hiểu phương tiện Codex       | đường tương thích mô hình ảnh `codex/*`             | Chạy các lượt Codex app-server có giới hạn cho các mô hình hiểu ảnh được hỗ trợ. |
| Chuyển tiếp hook gốc               | Hook Plugin quanh các sự kiện gốc của Codex         | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất gốc của Codex được hỗ trợ. |

Bật Plugin sẽ làm các năng lực đó khả dụng. Nó **không**:

- bắt đầu dùng Codex cho mọi mô hình OpenAI
- chuyển các tham chiếu mô hình `openai-codex/*` thành runtime gốc nếu không có doctor
  xác minh rằng Codex đã được cài đặt, bật, đóng góp harness `codex`,
  và sẵn sàng OAuth
- đặt ACP/acpx làm đường Codex mặc định
- chuyển nóng các phiên hiện có đã ghi nhận runtime PI
- thay thế việc gửi qua kênh của OpenClaw, tệp phiên, lưu trữ hồ sơ xác thực hoặc
  định tuyến tin nhắn

Cùng Plugin này cũng sở hữu bề mặt lệnh điều khiển trò chuyện `/codex` gốc. Nếu
Plugin được bật và người dùng yêu cầu gắn, tiếp tục, điều hướng, dừng hoặc kiểm
tra luồng Codex từ trò chuyện, tác nhân nên ưu tiên `/codex ...` thay cho ACP. ACP vẫn là
phương án dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử bộ
chuyển đổi Codex ACP.

Các lượt Codex gốc giữ hook Plugin OpenClaw làm lớp tương thích công khai.
Đây là các hook OpenClaw trong tiến trình, không phải hook lệnh `hooks.json` của Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` cho bản ghi transcript được phản chiếu
- `before_agent_finalize` thông qua relay `Stop` của Codex
- `agent_end`

Plugin cũng có thể đăng ký middleware kết quả công cụ trung lập runtime để viết lại
kết quả công cụ động của OpenClaw sau khi OpenClaw thực thi công cụ và trước khi
kết quả được trả về Codex. Điều này tách biệt với hook Plugin công khai
`tool_result_persist`, vốn biến đổi các lần ghi kết quả công cụ vào transcript
do OpenClaw sở hữu.

Về chính ngữ nghĩa hook Plugin, xem [Hook Plugin](/vi/plugins/hooks)
và [Hành vi bảo vệ Plugin](/vi/tools/plugin).

Harness mặc định tắt. Cấu hình mới nên giữ tham chiếu mô hình OpenAI
chuẩn là `openai/gpt-*` và ép rõ
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi muốn
thực thi app-server gốc. Các tham chiếu mô hình cũ `codex/*` vẫn tự động chọn
harness để tương thích, nhưng các tiền tố nhà cung cấp cũ có runtime hỗ trợ
không được hiển thị như lựa chọn mô hình/nhà cung cấp bình thường.

Nếu bất kỳ tuyến mô hình đã cấu hình nào vẫn là `openai-codex/*`, `openclaw doctor --fix`
sẽ viết lại thành `openai/*`. Với các tuyến tác nhân khớp, nó đặt runtime tác nhân
thành `codex` chỉ khi Plugin Codex đã được cài đặt, bật, đóng góp
harness `codex` và có OAuth dùng được; nếu không, nó đặt runtime thành `pi`.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                                  | Tham chiếu mô hình        | Cấu hình runtime                       | Tuyến xác thực/hồ sơ          | Nhãn trạng thái dự kiến        |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth hoặc tài khoản Codex | `Runtime: OpenAI Codex`        |
| OpenAI API qua runner OpenClaw bình thường         | `openai/gpt-*`             | bỏ qua hoặc `runtime: "pi"`            | Khóa OpenAI API              | `Runtime: OpenClaw Pi Default` |
| Cấu hình cũ cần doctor sửa                         | `openai-codex/gpt-*`       | được sửa thành `codex` hoặc `pi`       | Xác thực hiện có đã cấu hình | Kiểm tra lại sau `doctor --fix` |
| Nhiều nhà cung cấp với chế độ tự động thận trọng   | tham chiếu riêng theo nhà cung cấp | `agentRuntime.id: "auto"`        | Theo nhà cung cấp đã chọn    | Phụ thuộc vào runtime đã chọn  |
| Phiên bộ chuyển đổi Codex ACP rõ ràng              | phụ thuộc prompt/mô hình ACP | `sessions_spawn` với `runtime: "acp"` | Xác thực backend ACP         | Trạng thái tác vụ/phiên ACP    |

Điểm phân tách quan trọng là nhà cung cấp so với runtime:

- `openai-codex/*` là tuyến cũ mà doctor viết lại.
- `agentRuntime.id: "codex"` yêu cầu harness Codex và đóng an toàn nếu nó
  không khả dụng.
- `agentRuntime.id: "auto"` cho phép các harness đã đăng ký nhận các tuyến nhà cung cấp
  khớp, nhưng các tham chiếu OpenAI chuẩn vẫn do PI sở hữu trừ khi một harness hỗ trợ
  cặp nhà cung cấp/mô hình đó.
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào nên được trò chuyện này gắn
  hoặc điều khiển?"
- ACP trả lời "tiến trình harness bên ngoài nào acpx nên khởi chạy?"

## Chọn đúng tiền tố mô hình

Các tuyến họ OpenAI phụ thuộc tiền tố. Với thiết lập phổ biến là gói đăng ký cộng
runtime Codex gốc, dùng `openai/*` với `agentRuntime.id: "codex"`.
Xem `openai-codex/*` là cấu hình cũ mà doctor nên viết lại:

| Tham chiếu mô hình                          | Đường runtime                                | Dùng khi                                                                  |
| ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | Nhà cung cấp OpenAI qua đường ống OpenClaw/PI | Bạn muốn truy cập OpenAI Platform API trực tiếp hiện tại với `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | Tuyến cũ được doctor sửa                     | Bạn đang dùng cấu hình cũ; chạy `openclaw doctor --fix` để viết lại nó.   |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness Codex app-server                   | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với thực thi Codex gốc.       |

GPT-5.5 có thể xuất hiện trên cả tuyến khóa API OpenAI trực tiếp và tuyến đăng ký Codex
khi tài khoản của bạn cung cấp chúng. Dùng `openai/gpt-5.5` với harness Codex app-server
cho runtime Codex gốc, hoặc `openai/gpt-5.5` không có ghi đè runtime Codex
cho lưu lượng khóa API trực tiếp.

Các tham chiếu cũ `codex/gpt-*` vẫn được chấp nhận làm bí danh tương thích. Di chuyển
tương thích của doctor viết lại các tham chiếu runtime cũ thành tham chiếu mô hình chuẩn
và ghi chính sách runtime riêng. Cấu hình harness app-server gốc mới
nên dùng `openai/gpt-*` cộng `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng
`openai/gpt-*` cho tuyến OpenAI bình thường và `codex/gpt-*` khi việc hiểu ảnh
nên chạy qua một lượt Codex app-server có giới hạn. Không dùng
`openai-codex/gpt-*`; doctor viết lại tiền tố cũ đó thành `openai/gpt-*`. Mô hình
Codex app-server phải khai báo hỗ trợ đầu vào ảnh; các mô hình Codex chỉ văn bản
sẽ lỗi trước khi lượt phương tiện bắt đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn
gây bất ngờ, hãy bật ghi log gỡ lỗi cho hệ thống con `agents/harness`
và kiểm tra bản ghi có cấu trúc `agent harness selected` của Gateway. Nó
bao gồm id harness đã chọn, lý do chọn, chính sách runtime/dự phòng và,
trong chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Cảnh báo doctor có nghĩa là gì

`openclaw doctor` cảnh báo khi tham chiếu mô hình đã cấu hình hoặc trạng thái tuyến phiên đã lưu
vẫn dùng `openai-codex/*`. `openclaw doctor --fix` viết lại các tuyến đó
thành:

- `openai/<model>`
- `agentRuntime.id: "codex"` khi Codex đã được cài đặt, bật, đóng góp
  harness `codex` và có OAuth dùng được
- `agentRuntime.id: "pi"` nếu không

Tuyến `codex` ép dùng harness Codex gốc. Tuyến `pi` giữ tác nhân trên runner
OpenClaw mặc định thay vì bật hoặc cài đặt Codex như một tác dụng phụ của việc
dọn dẹp tuyến cũ.
Doctor cũng sửa các ghim phiên đã lưu cũ trên các kho phiên tác nhân được phát hiện
để các cuộc trò chuyện cũ không bị kẹt trên tuyến đã bị xóa.

Việc chọn bộ thực thi không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng chạy,
OpenClaw ghi lại id bộ thực thi đã chọn trên phiên đó và tiếp tục dùng nó cho
các lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng bộ thực thi khác;
dùng `/new` hoặc `/reset` để bắt đầu phiên mới trước khi chuyển một cuộc trò chuyện
hiện có giữa Pi và Codex. Cách này tránh phát lại một bản ghi hội thoại qua
hai hệ thống phiên gốc không tương thích.

Các phiên cũ được tạo trước khi có ghim bộ thực thi được xem là đã ghim vào Pi sau khi
chúng có lịch sử bản ghi hội thoại. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó vào
Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình hiệu dụng. Bộ thực thi Pi mặc định xuất hiện dưới dạng
`Runtime: OpenClaw Pi Default`, và bộ thực thi máy chủ ứng dụng Codex xuất hiện dưới dạng
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có Plugin `codex` đi kèm khả dụng.
- Máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Plugin đi kèm quản lý một tệp nhị phân
  máy chủ ứng dụng Codex tương thích theo mặc định, nên các lệnh `codex` cục bộ trên `PATH` sẽ
  không ảnh hưởng đến quá trình khởi động bộ thực thi bình thường.
- Xác thực Codex khả dụng cho tiến trình máy chủ ứng dụng hoặc cho cầu nối xác thực Codex
  của OpenClaw. Các lần khởi chạy máy chủ ứng dụng stdio cục bộ dùng thư mục chính Codex do OpenClaw quản lý cho từng
  tác nhân và một `HOME` con tách biệt, nên theo mặc định chúng không đọc tài khoản
  `~/.codex`, Skills, Plugin, cấu hình, trạng thái luồng, hoặc
  `$HOME/.agents/skills` gốc cá nhân của bạn.

Plugin chặn các bắt tay máy chủ ứng dụng cũ hơn hoặc không có phiên bản. Điều đó giữ
OpenClaw trên bề mặt giao thức đã được kiểm thử.

Đối với kiểm thử khói trực tiếp và Docker, xác thực thường đến từ tài khoản CLI Codex
hoặc một hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy máy chủ ứng dụng stdio cục bộ
cũng có thể dự phòng sang `CODEX_API_KEY` / `OPENAI_API_KEY` khi không có tài khoản.

## Tệp khởi tạo workspace

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án gốc. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào tên tệp dự phòng
của Codex cho các tệp persona, vì dự phòng của Codex chỉ áp dụng khi
thiếu `AGENTS.md`.

Để tương đương workspace OpenClaw, bộ thực thi Codex phân giải các tệp khởi tạo
khác (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, và `MEMORY.md` khi có) và chuyển tiếp chúng qua chỉ dẫn nhà phát triển Codex
trên `thread/start` và `thread/resume`. Điều này giữ
`SOUL.md` và ngữ cảnh persona/hồ sơ workspace liên quan hiển thị trên làn định hình hành vi gốc
của Codex mà không sao chép `AGENTS.md`.

## Thêm Codex cùng các mô hình khác

Không đặt `agentRuntime.id: "codex"` toàn cục nếu cùng tác nhân đó cần tự do chuyển đổi
giữa Codex và các mô hình nhà cung cấp không phải Codex. Một runtime bị ép buộc áp dụng cho mọi
lượt nhúng của tác nhân hoặc phiên đó. Nếu bạn chọn một mô hình Anthropic trong khi
runtime đó bị ép buộc, OpenClaw vẫn thử bộ thực thi Codex và đóng lỗi
thay vì âm thầm định tuyến lượt đó qua Pi.

Thay vào đó, hãy dùng một trong các dạng sau:

- Đặt Codex trên một tác nhân riêng với `agentRuntime.id: "codex"`.
- Giữ tác nhân mặc định trên `agentRuntime.id: "auto"` và dự phòng Pi cho cách dùng hỗn hợp
  nhà cung cấp thông thường.
- Chỉ dùng các tham chiếu `codex/*` cũ để tương thích. Cấu hình mới nên ưu tiên
  `openai/*` cùng một chính sách runtime Codex rõ ràng.

Ví dụ, cấu hình này giữ tác nhân mặc định trên lựa chọn tự động bình thường và
thêm một tác nhân Codex riêng:

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

- Tác nhân `main` mặc định dùng đường dẫn nhà cung cấp bình thường và dự phòng tương thích Pi.
- Tác nhân `codex` dùng bộ thực thi máy chủ ứng dụng Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho tác nhân `codex`, lượt đó sẽ thất bại
  thay vì âm thầm dùng Pi.

## Định tuyến lệnh tác nhân

Tác nhân nên định tuyến yêu cầu người dùng theo ý định, không chỉ theo từ "Codex":

| Người dùng yêu cầu...                                  | Tác nhân nên dùng...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Ràng buộc cuộc trò chuyện này với Codex"              | `/codex bind`                                    |
| "Tiếp tục luồng Codex `<id>` tại đây"                  | `/codex resume <id>`                             |
| "Hiển thị các luồng Codex"                             | `/codex threads`                                 |
| "Gửi một báo cáo hỗ trợ cho lần chạy Codex lỗi"        | `/diagnostics [note]`                            |
| "Chỉ gửi phản hồi Codex cho luồng đính kèm này"        | `/codex diagnostics [note]`                      |
| "Dùng gói đăng ký ChatGPT/Codex của tôi với runtime Codex" | `openai/*` cộng với `agentRuntime.id: "codex"`   |
| "Sửa các ghim cấu hình/phiên `openai-codex/*` cũ"      | `openclaw doctor --fix`                          |
| "Chạy Codex qua ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Khởi động Claude Code/Gemini/OpenCode/Cursor trong một luồng" | ACP/acpx, không phải `/codex` và không phải tác nhân con gốc |

OpenClaw chỉ quảng bá hướng dẫn sinh ACP cho tác nhân khi ACP được bật,
có thể điều phối, và được hỗ trợ bởi một backend runtime đã tải. Nếu ACP không khả dụng,
lời nhắc hệ thống và Skills của Plugin không nên dạy tác nhân về định tuyến
ACP.

## Triển khai chỉ dùng Codex

Ép buộc bộ thực thi Codex khi bạn cần chứng minh rằng mọi lượt tác nhân nhúng
đều dùng Codex. Các runtime Plugin rõ ràng đóng lỗi và không bao giờ được âm thầm thử lại
qua Pi:

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

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu Plugin Codex bị tắt, máy chủ ứng dụng
quá cũ, hoặc máy chủ ứng dụng không thể khởi động.

## Codex theo từng tác nhân

Bạn có thể đặt một tác nhân chỉ dùng Codex trong khi tác nhân mặc định giữ
lựa chọn tự động bình thường:

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

Dùng các lệnh phiên bình thường để chuyển tác nhân và mô hình. `/new` tạo một phiên
OpenClaw mới và bộ thực thi Codex tạo hoặc tiếp tục luồng máy chủ ứng dụng sidecar
của nó khi cần. `/reset` xóa ràng buộc phiên OpenClaw cho luồng đó
và cho phép lượt tiếp theo phân giải bộ thực thi từ cấu hình hiện tại lần nữa.

## Khám phá mô hình

Theo mặc định, Plugin Codex hỏi máy chủ ứng dụng về các mô hình khả dụng. Nếu
khám phá thất bại hoặc hết thời gian chờ, nó dùng danh mục dự phòng đi kèm cho:

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

Tắt khám phá khi bạn muốn khởi động tránh thăm dò Codex và bám vào
danh mục dự phòng:

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

## Kết nối và chính sách máy chủ ứng dụng

Theo mặc định, Plugin khởi động tệp nhị phân Codex do OpenClaw quản lý cục bộ với:

```bash
codex app-server --listen stdio://
```

Tệp nhị phân được quản lý được phân phối cùng gói Plugin `codex`. Điều này giữ phiên bản
máy chủ ứng dụng gắn với Plugin đi kèm thay vì bất kỳ CLI Codex riêng nào
tình cờ được cài đặt cục bộ. Chỉ đặt `appServer.command` khi
bạn cố ý muốn chạy một tệp thực thi khác.

Theo mặc định, OpenClaw khởi động các phiên bộ thực thi Codex cục bộ ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ đáng tin cậy được dùng
cho Heartbeat tự trị: Codex có thể dùng công cụ shell và mạng mà không
dừng ở các lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

Để chọn dùng phê duyệt do bộ giám hộ Codex xem xét, đặt `appServer.mode:
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

Chế độ bộ giám hộ dùng đường dẫn phê duyệt tự động xem xét gốc của Codex. Khi Codex yêu cầu
rời khỏi sandbox, ghi ra ngoài workspace, hoặc thêm quyền như truy cập mạng,
Codex định tuyến yêu cầu phê duyệt đó tới bộ xem xét gốc thay vì
lời nhắc con người. Bộ xem xét áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối
yêu cầu cụ thể đó. Dùng bộ giám hộ khi bạn muốn nhiều rào chắn hơn chế độ YOLO
nhưng vẫn cần các tác nhân không có người giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`.
Các trường chính sách riêng lẻ vẫn ghi đè `mode`, nên các triển khai nâng cao có thể kết hợp
preset với lựa chọn rõ ràng. Giá trị bộ xem xét `guardian_subagent` cũ hơn
vẫn được chấp nhận như một bí danh tương thích, nhưng cấu hình mới nên dùng
`auto_review`.

Đối với máy chủ ứng dụng đã chạy, hãy dùng truyền tải WebSocket:

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

Các lần khởi chạy máy chủ ứng dụng stdio kế thừa môi trường tiến trình của OpenClaw theo mặc định,
nhưng OpenClaw sở hữu cầu nối tài khoản máy chủ ứng dụng Codex và đặt cả
`CODEX_HOME` lẫn `HOME` thành thư mục theo từng tác nhân dưới trạng thái OpenClaw
của tác nhân đó. Bộ tải Skills riêng của Codex đọc `$CODEX_HOME/skills` và
`$HOME/.agents/skills`, nên cả hai giá trị đều được tách biệt cho các lần khởi chạy máy chủ ứng dụng
cục bộ. Điều đó giữ Skills, Plugin, cấu hình, tài khoản và trạng thái luồng gốc của Codex
trong phạm vi tác nhân OpenClaw thay vì rò rỉ từ thư mục chính CLI Codex
cá nhân của người vận hành.

Plugin OpenClaw và ảnh chụp Skills OpenClaw vẫn đi qua sổ đăng ký Plugin và bộ tải Skills
riêng của OpenClaw. Tài sản CLI Codex cá nhân thì không. Nếu bạn có
Skills hoặc Plugin CLI Codex hữu ích cần trở thành một phần của tác nhân OpenClaw,
hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Nhà cung cấp di trú Codex sao chép Skills vào workspace tác nhân OpenClaw hiện tại.
Plugin, hook và tệp cấu hình gốc của Codex được báo cáo hoặc lưu trữ
để xem xét thủ công thay vì được kích hoạt tự động, vì chúng có thể
thực thi lệnh, phơi bày máy chủ MCP, hoặc mang thông tin xác thực.

Xác thực được chọn theo thứ tự này:

1. Một hồ sơ xác thực Codex OpenClaw rõ ràng cho tác nhân.
2. Tài khoản hiện có của máy chủ ứng dụng trong thư mục chính Codex của tác nhân đó.
3. Chỉ đối với các lần khởi chạy máy chủ ứng dụng stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản máy chủ ứng dụng và xác thực OpenAI
   vẫn được yêu cầu.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó sẽ xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều đó
giữ các khóa API cấp Gateway khả dụng cho embeddings hoặc các mô hình OpenAI trực tiếp
mà không vô tình khiến các lượt app-server Codex gốc được tính phí qua API.
Các hồ sơ khóa API Codex rõ ràng và cơ chế dự phòng khóa env stdio cục bộ dùng đăng nhập
app-server thay vì env kế thừa của tiến trình con. Các kết nối app-server WebSocket
không nhận cơ chế dự phòng khóa API env của Gateway; hãy dùng một hồ sơ xác thực rõ ràng hoặc
tài khoản riêng của app-server từ xa.

Nếu một bản triển khai cần cô lập môi trường bổ sung, hãy thêm các biến đó vào
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

Các công cụ động Codex mặc định dùng hồ sơ `native-first`. Trong chế độ đó,
OpenClaw không hiển thị các công cụ động trùng lặp với những thao tác không gian làm việc
gốc của Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, và
`update_plan`. Các công cụ tích hợp OpenClaw như nhắn tin, phiên, phương tiện,
cron, trình duyệt, nodes, gateway, `heartbeat_respond`, và `web_search` vẫn
khả dụng.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định         | Ý nghĩa                                                                                                      |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Dùng `"openclaw-compat"` để hiển thị toàn bộ bộ công cụ động OpenClaw cho app-server Codex.                  |
| `codexDynamicToolsExclude` | `[]`             | Các tên công cụ động OpenClaw bổ sung cần bỏ qua khỏi các lượt app-server Codex.                             |

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                 | Ý nghĩa                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` sinh Codex; `"websocket"` kết nối đến `url`.                                                                                                                                                                          |
| `command`           | tệp nhị phân Codex được quản lý          | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho transport stdio.                                                                                                                                                                                                      |
| `url`               | chưa đặt                                 | URL app-server WebSocket.                                                                                                                                                                                                        |
| `authToken`         | chưa đặt                                 | Bearer token cho transport WebSocket.                                                                                                                                                                                           |
| `headers`           | `{}`                                     | Các header WebSocket bổ sung.                                                                                                                                                                                                    |
| `clearEnv`          | `[]`                                     | Tên các biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được sinh ra sau khi OpenClaw xây dựng môi trường kế thừa của nó. `CODEX_HOME` và `HOME` được dành riêng cho việc cô lập Codex theo từng tác tử của OpenClaw trong các lần khởi chạy cục bộ. |
| `requestTimeoutMs`  | `60000`                                  | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển app-server.                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | Cấu hình đặt sẵn cho thực thi YOLO hoặc có guardian xem xét.                                                                                                                                                                     |
| `approvalPolicy`    | `"never"`                                | Chính sách phê duyệt Codex gốc được gửi đến khởi động/tiếp tục/lượt của luồng.                                                                                                                                                  |
| `sandbox`           | `"danger-full-access"`                   | Chế độ sandbox Codex gốc được gửi đến khởi động/tiếp tục luồng.                                                                                                                                                                  |
| `approvalsReviewer` | `"user"`                                 | Dùng `"auto_review"` để cho Codex xem xét các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là một bí danh kế thừa.                                                                                                           |
| `serviceTier`       | chưa đặt                                 | Cấp dịch vụ app-server Codex tùy chọn: `"fast"`, `"flex"`, hoặc `null`. Các giá trị kế thừa không hợp lệ bị bỏ qua.                                                                                                             |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận
một phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín hiệu công cụ
khi được hỗ trợ và trả về một phản hồi công cụ động thất bại cho Codex để
lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt Codex, harness
cũng kỳ vọng Codex kết thúc lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong 60 giây sau phản hồi đó, OpenClaw cố gắng hết mức
ngắt lượt Codex, ghi lại thời gian chờ chẩn đoán, và giải phóng làn phiên
OpenClaw để các tin nhắn trò chuyện tiếp theo không bị xếp hàng sau một lượt gốc
đã cũ.

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
được ưu tiên cho các bản triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng một tệp đã được xem xét với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không đóng gói ứng dụng điều khiển desktop hoặc tự thực thi
các hành động desktop. Nó chuẩn bị app-server Codex, xác minh rằng máy chủ MCP
`computer-use` khả dụng, rồi để Codex xử lý các lệnh gọi công cụ MCP gốc
trong các lượt chế độ Codex.

Để truy cập trực tiếp driver TryCua bên ngoài luồng marketplace Codex, hãy đăng ký
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

Sử dụng máy tính là riêng cho macOS và có thể yêu cầu quyền hệ điều hành cục bộ trước khi
máy chủ MCP Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là true và máy chủ MCP
không khả dụng, các lượt chế độ Codex sẽ thất bại trước khi luồng bắt đầu thay vì
âm thầm chạy mà không có các công cụ Sử dụng máy tính gốc. Xem
[Sử dụng máy tính với Codex](/vi/plugins/codex-computer-use) để biết các lựa chọn marketplace,
giới hạn catalog từ xa, lý do trạng thái, và xử lý sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace
Codex Desktop được đóng gói tiêu chuẩn từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi
thay đổi cấu hình runtime hoặc Sử dụng máy tính để các phiên hiện có không giữ một
liên kết PI hoặc luồng Codex cũ.

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

Phê duyệt Codex có guardian xem xét:

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
chính sách phê duyệt, sandbox, và cấp dịch vụ hiện được chọn đến
app-server. Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` vẫn giữ
liên kết luồng nhưng yêu cầu Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin được đóng gói đăng ký `/codex` làm lệnh gạch chéo được ủy quyền. Lệnh này
mang tính chung và hoạt động trên bất kỳ kênh nào hỗ trợ lệnh văn bản OpenClaw.

Các dạng thường dùng:

- `/codex status` hiển thị khả năng kết nối máy chủ ứng dụng trực tiếp, các mô hình, tài khoản, giới hạn tốc độ, máy chủ MCP và Skills.
- `/codex models` liệt kê các mô hình máy chủ ứng dụng Codex trực tiếp.
- `/codex threads [filter]` liệt kê các luồng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex nén gọn luồng đã gắn.
- `/codex review` bắt đầu quy trình đánh giá gốc của Codex cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho luồng đã gắn.
- `/codex computer-use status` kiểm tra Plugin Computer Use và máy chủ MCP đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Computer Use đã cấu hình và tải lại máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê Skills của máy chủ ứng dụng Codex.

Khi Codex báo lỗi giới hạn sử dụng, OpenClaw sẽ bao gồm thời điểm đặt lại tiếp theo của
máy chủ ứng dụng nếu Codex cung cấp. Dùng `/codex account` trong cùng
cuộc trò chuyện để kiểm tra tài khoản hiện tại và các cửa sổ giới hạn tốc độ.

### Quy trình gỡ lỗi thường gặp

Khi một tác tử dựa trên Codex làm điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu từ cuộc trò chuyện nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả những gì bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán Gateway
   cục bộ và, vì phiên đang dùng bộ điều phối Codex, cũng
   gửi gói phản hồi Codex liên quan đến máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc luồng hỗ trợ.
   Phản hồi này bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên OpenClaw,
   id luồng Codex và một dòng `Inspect locally` cho từng luồng Codex.
4. Nếu bạn muốn tự gỡ lỗi lượt chạy, hãy chạy lệnh `Inspect locally`
   được in ra trong terminal. Lệnh có dạng `codex resume <thread-id>` và mở
   luồng Codex gốc để bạn có thể kiểm tra cuộc trò chuyện, tiếp tục cục bộ,
   hoặc hỏi Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex lên
cho luồng hiện đang được gắn mà không cần toàn bộ gói chẩn đoán Gateway
của OpenClaw. Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là
điểm bắt đầu tốt hơn vì nó liên kết trạng thái Gateway cục bộ và id luồng Codex
trong một phản hồi. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics)
để biết đầy đủ mô hình quyền riêng tư và hành vi trong trò chuyện nhóm.

Lõi OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu dưới dạng lệnh
chẩn đoán Gateway chung. Lời nhắc phê duyệt của lệnh này hiển thị phần mở đầu về dữ liệu nhạy cảm,
liên kết đến [Xuất chẩn đoán](/vi/gateway/diagnostics), và yêu cầu
`openclaw gateway diagnostics export --json` thông qua phê duyệt thực thi rõ ràng
mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê duyệt,
OpenClaw gửi một báo cáo có thể dán, kèm đường dẫn gói cục bộ và tóm tắt
manifest. Khi phiên OpenClaw đang hoạt động sử dụng bộ điều phối Codex, chính
phê duyệt đó cũng cho phép gửi các gói phản hồi Codex liên quan đến
máy chủ OpenAI. Lời nhắc phê duyệt cho biết phản hồi Codex sẽ được gửi, nhưng
không liệt kê id phiên hoặc id luồng Codex trước khi phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong trò chuyện nhóm, OpenClaw giữ cho
kênh chung gọn gàng: nhóm chỉ nhận một thông báo ngắn, còn
phần mở đầu chẩn đoán, lời nhắc phê duyệt và id phiên/luồng Codex được gửi đến
chủ sở hữu qua tuyến phê duyệt riêng tư. Nếu không có tuyến chủ sở hữu riêng tư,
OpenClaw từ chối yêu cầu nhóm và yêu cầu chủ sở hữu chạy lệnh từ DM.

Quá trình tải Codex đã phê duyệt gọi `feedback/upload` của máy chủ ứng dụng Codex và yêu cầu
máy chủ ứng dụng bao gồm nhật ký cho từng luồng được liệt kê và các luồng con Codex được sinh ra
khi có sẵn. Quá trình tải lên đi qua đường dẫn phản hồi thông thường của Codex đến máy chủ
OpenAI; nếu phản hồi Codex bị tắt trong máy chủ ứng dụng đó, lệnh sẽ trả về
lỗi của máy chủ ứng dụng. Phản hồi chẩn đoán đã hoàn tất liệt kê các kênh,
id phiên OpenClaw, id luồng Codex và lệnh `codex resume <thread-id>`
cục bộ cho các luồng đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không in các id Codex đó. Việc tải lên này không thay thế bản xuất
chẩn đoán Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà bộ điều phối sử dụng cho
các lượt bình thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục luồng Codex đó, truyền
mô hình OpenClaw đang được chọn vào máy chủ ứng dụng, và giữ lịch sử mở rộng
ở trạng thái bật.

### Kiểm tra một luồng Codex từ CLI

Cách nhanh nhất để hiểu một lượt chạy Codex lỗi thường là mở trực tiếp
luồng Codex gốc:

```sh
codex resume <thread-id>
```

Dùng lệnh này khi bạn nhận thấy lỗi trong cuộc trò chuyện kênh và muốn kiểm tra
phiên Codex có vấn đề, tiếp tục phiên đó cục bộ, hoặc hỏi Codex vì sao nó đưa ra
một lựa chọn công cụ hoặc suy luận cụ thể. Đường đi dễ nhất thường là chạy
`/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo đã hoàn tất sẽ liệt kê
từng luồng Codex và in một lệnh `Inspect locally`, ví dụ
`codex resume <thread-id>`. Bạn có thể sao chép trực tiếp lệnh đó vào terminal.

Bạn cũng có thể lấy id luồng từ `/codex binding` cho cuộc trò chuyện hiện tại hoặc
`/codex threads [filter]` cho các luồng máy chủ ứng dụng Codex gần đây, rồi chạy cùng
lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Các
phương thức điều khiển riêng lẻ được báo là `unsupported by this Codex app-server` nếu một
máy chủ ứng dụng trong tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Bộ điều phối Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu               | Mục đích                                                            |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Tương thích sản phẩm/Plugin trên các bộ điều phối PI và Codex.      |
| Middleware mở rộng máy chủ ứng dụng Codex | Các Plugin đi kèm OpenClaw | Hành vi bộ chuyển đổi theo từng lượt quanh công cụ động OpenClaw. |
| Hook gốc Codex                       | Codex                    | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp Codex `hooks.json` cấp dự án hoặc toàn cục để định tuyến
hành vi Plugin OpenClaw. Với cầu nối công cụ gốc và quyền được hỗ trợ,
OpenClaw chèn cấu hình Codex theo từng luồng cho `PreToolUse`, `PostToolUse`,
`PermissionRequest`, và `Stop`. Khi phê duyệt máy chủ ứng dụng Codex được bật
(`approvalPolicy` không phải `"never"`), cấu hình hook gốc được chèn mặc định
bỏ qua `PermissionRequest` để trình đánh giá của máy chủ ứng dụng Codex và cầu nối phê duyệt
của OpenClaw xử lý các yêu cầu nâng quyền thật sau khi đánh giá. Người vận hành vẫn có thể thêm rõ ràng
`permission_request` vào `nativeHookRelay.events` khi cần cầu nối tương thích.
Các hook Codex khác như `SessionStart` và `UserPromptSubmit` vẫn là
các điều khiển cấp Codex; chúng không được cung cấp dưới dạng hook Plugin OpenClaw trong hợp đồng v1.

Với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu
lệnh gọi, nên OpenClaw kích hoạt hành vi Plugin và middleware mà nó sở hữu trong
bộ chuyển đổi điều phối. Với công cụ gốc Codex, Codex sở hữu bản ghi công cụ chuẩn.
OpenClaw có thể phản chiếu một số sự kiện được chọn, nhưng không thể viết lại luồng Codex
gốc trừ khi Codex cung cấp thao tác đó qua máy chủ ứng dụng hoặc callback hook
gốc.

Compaction và các phép chiếu vòng đời LLM đến từ thông báo máy chủ ứng dụng Codex
và trạng thái bộ chuyển đổi OpenClaw, không phải lệnh hook gốc Codex.
Các sự kiện `before_compaction`, `after_compaction`, `llm_input`, và
`llm_output` của OpenClaw là quan sát cấp bộ chuyển đổi, không phải bản chụp
từng byte của yêu cầu nội bộ hoặc tải trọng Compaction của Codex.

Thông báo máy chủ ứng dụng Codex gốc `hook/started` và `hook/completed` được
chiếu thành sự kiện tác tử `codex_app_server.hook` để phục vụ quỹ đạo và gỡ lỗi.
Chúng không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác bên dưới. Codex sở hữu nhiều hơn
vòng lặp mô hình gốc, và OpenClaw điều chỉnh bề mặt Plugin và phiên của mình
quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                       | Hỗ trợ                                                                              | Lý do                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI qua Codex               | Được hỗ trợ                                                                            | Codex app-server sở hữu lượt OpenAI, tiếp tục luồng gốc và tiếp tục công cụ gốc.                                                                                                                 |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                                                                            | Telegram, Discord, Slack, WhatsApp, iMessage và các kênh khác nằm ngoài môi trường chạy của mô hình.                                                                                                           |
| Công cụ động của OpenClaw                        | Được hỗ trợ                                                                            | Codex yêu cầu OpenClaw thực thi các công cụ này, nên OpenClaw vẫn nằm trong đường dẫn thực thi.                                                                                                                       |
| Plugin lời nhắc và ngữ cảnh                    | Được hỗ trợ                                                                            | OpenClaw xây dựng các lớp phủ lời nhắc và đưa ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục luồng.                                                                                           |
| Vòng đời engine ngữ cảnh                      | Được hỗ trợ                                                                            | Việc lắp ráp, nhập dữ liệu hoặc bảo trì sau lượt, và phối hợp Compaction của engine ngữ cảnh chạy cho các lượt Codex.                                                                                                |
| Hook công cụ động                            | Được hỗ trợ                                                                            | `before_tool_call`, `after_tool_call` và middleware kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                                                 |
| Hook vòng đời                               | Được hỗ trợ dưới dạng quan sát của adapter                                                    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` và `after_compaction` kích hoạt với payload trung thực ở chế độ Codex.                                                                                  |
| Cổng sửa đổi câu trả lời cuối                    | Được hỗ trợ thông qua relay hook gốc                                              | Codex `Stop` được relay tới `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                                                       |
| Chặn hoặc quan sát shell, patch và MCP gốc | Được hỗ trợ thông qua relay hook gốc                                              | Codex `PreToolUse` và `PostToolUse` được relay cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên Codex app-server `0.125.0` hoặc mới hơn. Việc chặn được hỗ trợ; việc viết lại đối số thì không.      |
| Chính sách quyền gốc                      | Được hỗ trợ thông qua phê duyệt của Codex app-server và relay hook gốc tương thích | Các yêu cầu phê duyệt của Codex app-server được định tuyến qua OpenClaw sau khi Codex xem xét. Relay hook gốc `PermissionRequest` là tùy chọn cho các chế độ phê duyệt gốc vì Codex phát ra nó trước khi guardian xem xét. |
| Ghi lại quỹ đạo app-server                 | Được hỗ trợ                                                                            | OpenClaw ghi lại yêu cầu đã gửi tới app-server và các thông báo app-server mà nó nhận được.                                                                                                           |

Không được hỗ trợ trong môi trường chạy Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Lộ trình tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Sửa đổi đối số công cụ gốc                       | Hook tiền công cụ gốc của Codex có thể chặn, nhưng OpenClaw không viết lại đối số công cụ gốc của Codex.                                               | Cần hỗ trợ hook/schema của Codex cho đầu vào công cụ thay thế.                            |
| Lịch sử bản ghi luồng Codex gốc có thể chỉnh sửa            | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên sửa đổi phần nội bộ không được hỗ trợ. | Thêm API Codex app-server rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc của Codex | Hook đó biến đổi các lần ghi bản ghi do OpenClaw sở hữu, không phải bản ghi công cụ gốc của Codex.                                                           | Có thể phản chiếu các bản ghi đã biến đổi, nhưng việc viết lại chuẩn cần Codex hỗ trợ.              |
| Siêu dữ liệu Compaction gốc phong phú                     | OpenClaw quan sát lúc bắt đầu và hoàn tất Compaction, nhưng không nhận được danh sách giữ/bỏ ổn định, chênh lệch token hoặc payload tóm tắt.            | Cần sự kiện Compaction phong phú hơn từ Codex.                                                     |
| Can thiệp Compaction                             | Các hook Compaction hiện tại của OpenClaw ở chế độ Codex chỉ ở mức thông báo.                                                                         | Thêm hook trước/sau Compaction của Codex nếu plugin cần phủ quyết hoặc viết lại Compaction gốc. |
| Ghi lại yêu cầu API mô hình từng byte chính xác             | OpenClaw có thể ghi lại yêu cầu app-server và thông báo, nhưng lõi Codex tự xây dựng yêu cầu API OpenAI cuối cùng bên trong.                      | Cần sự kiện theo dõi yêu cầu mô hình của Codex hoặc API gỡ lỗi.                                   |

## Công cụ, media và Compaction

Harness Codex chỉ thay đổi trình thực thi tác nhân nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
harness. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw bình thường.

Relay hook gốc được cố ý thiết kế chung, nhưng hợp đồng hỗ trợ v1
giới hạn ở các đường dẫn công cụ và quyền gốc của Codex mà OpenClaw kiểm thử. Trong
môi trường chạy Codex, điều đó bao gồm payload shell, patch và MCP `PreToolUse`,
`PostToolUse` và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex
trong tương lai là bề mặt plugin OpenClaw cho đến khi hợp đồng môi trường chạy nêu tên
nó.

Đối với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex coi đó là không có
quyết định hook và chuyển tiếp sang đường dẫn guardian hoặc phê duyệt của người dùng riêng.
Các chế độ phê duyệt Codex app-server mặc định bỏ qua hook gốc này; đoạn này
áp dụng khi `permission_request` được đưa rõ ràng vào
`nativeHookRelay.events` hoặc một môi trường chạy tương thích cài đặt nó.
Khi một operator chọn `allow-always` cho yêu cầu quyền gốc Codex,
OpenClaw ghi nhớ dấu vân tay provider/session/tool input/cwd chính xác đó trong một
cửa sổ phiên có giới hạn. Quyết định được ghi nhớ cố ý chỉ khớp chính xác:
một lệnh, đối số, payload công cụ hoặc cwd đã thay đổi sẽ tạo một
phê duyệt mới.

Các lời gọi phê duyệt công cụ MCP của Codex được định tuyến qua luồng phê duyệt
plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Lời nhắc `request_user_input` của Codex được gửi lại tới
cuộc trò chuyện gốc, và tin nhắn theo dõi tiếp theo trong hàng đợi trả lời yêu cầu
máy chủ gốc đó thay vì bị điều hướng như ngữ cảnh bổ sung. Các yêu cầu gọi MCP khác
vẫn thất bại đóng.

Điều hướng hàng đợi chạy hoạt động ánh xạ lên Codex app-server `turn/steer`. Với
`messages.queue.mode: "steer"` mặc định, OpenClaw gom các tin nhắn trò chuyện trong hàng đợi
trong khoảng lặng được cấu hình và gửi chúng thành một yêu cầu `turn/steer` theo
thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Lượt
xem xét Codex và Compaction thủ công có thể từ chối điều hướng trong cùng lượt, khi đó
OpenClaw dùng hàng đợi followup khi chế độ đã chọn cho phép dự phòng. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng harness Codex, Compaction luồng gốc được
ủy quyền cho Codex app-server. OpenClaw giữ một bản phản chiếu bản ghi cho lịch sử
kênh, tìm kiếm, `/new`, `/reset` và việc chuyển đổi mô hình hoặc harness trong tương lai. Bản
phản chiếu bao gồm lời nhắc của người dùng, văn bản trợ lý cuối cùng và các bản ghi
lý luận hoặc kế hoạch nhẹ của Codex khi app-server phát ra chúng. Hiện nay, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa phơi bày
bản tóm tắt Compaction dễ đọc cho con người hoặc danh sách có thể kiểm toán về những mục Codex
giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không
viết lại bản ghi kết quả công cụ gốc của Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ vào bản ghi phiên do OpenClaw sở hữu.

Tạo media không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và hiểu media
tiếp tục dùng các thiết lập provider/mô hình phù hợp như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` bình thường:** điều đó là dự kiến với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc ref `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra xem `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có harness Codex nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex khi kiểm thử. Một
môi trường chạy Codex bị buộc sẽ thất bại thay vì quay lại PI. Khi Codex app-server
được chọn, lỗi của nó hiển thị trực tiếp.

**app-server bị từ chối:** nâng cấp Codex để handshake app-server
báo cáo phiên bản `0.125.0` hoặc mới hơn. Các prerelease cùng phiên bản hoặc
phiên bản có hậu tố build như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
sàn giao thức ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Truyền tải WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo app-server từ xa nói cùng phiên bản giao thức Codex app-server.

**Một mô hình không phải Codex dùng PI:** điều đó là dự kiến trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho tác nhân đó hoặc chọn một ref
`codex/*` cũ. Các ref `openai/gpt-*` thuần và provider khác vẫn đi theo
đường dẫn provider bình thường trong chế độ `auto`. Nếu bạn buộc `agentRuntime.id: "codex"`, mọi lượt nhúng
cho tác nhân đó phải là mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài đặt nhưng các công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, hãy dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn, hãy khởi động lại
Gateway để xóa các đăng ký native hook đã cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, hãy khởi động lại Codex Computer Use hoặc Codex Desktop rồi thử lại.

## Liên quan

- [Plugin bộ khung agent](/vi/plugins/sdk-agent-harness)
- [Runtime của agent](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook Plugin](/vi/plugins/hooks)
- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
