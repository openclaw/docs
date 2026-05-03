---
read_when:
    - Bạn muốn sử dụng bộ khung app-server Codex đi kèm
    - Bạn cần các ví dụ cấu hình bộ khung Codex
    - Bạn muốn các bản triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác nhân nhúng của OpenClaw thông qua bộ khung app-server Codex được đóng gói kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-03T10:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt tác tử nhúng thông qua
app-server Codex thay vì harness PI tích hợp sẵn.

Dùng tùy chọn này khi bạn muốn Codex sở hữu phiên tác tử cấp thấp: khám phá
mô hình, tiếp tục luồng gốc, compaction gốc và thực thi app-server.
OpenClaw vẫn sở hữu các kênh chat, tệp phiên, lựa chọn mô hình, công cụ,
phê duyệt, phân phối phương tiện và bản sao transcript hiển thị.

Khi một lượt chat nguồn chạy qua harness Codex, các phản hồi hiển thị mặc định
dùng công cụ `message` của OpenClaw nếu bản triển khai chưa cấu hình rõ ràng
`messages.visibleReplies`. Tác tử vẫn có thể hoàn tất lượt Codex riêng tư;
nó chỉ đăng lên kênh khi gọi `message(action="send")`. Đặt
`messages.visibleReplies: "automatic"` để giữ các phản hồi cuối của chat trực tiếp trên
đường phân phối tự động cũ.

Các lượt heartbeat Codex cũng mặc định có công cụ `heartbeat_respond`, để
tác tử có thể ghi lại liệu lần đánh thức có nên giữ im lặng hay thông báo mà
không mã hóa luồng điều khiển đó trong văn bản cuối.

Nếu bạn đang cố định hướng, hãy bắt đầu với
[Runtime tác tử](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là ref mô hình, `codex` là runtime, và Telegram,
Discord, Slack hoặc kênh khác vẫn là bề mặt giao tiếp.

## Cấu hình nhanh

Hầu hết người dùng muốn "Codex trong OpenClaw" sẽ muốn tuyến này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, rồi chạy các lượt tác tử nhúng thông qua runtime
app-server Codex gốc. Ref mô hình vẫn giữ dạng chuẩn là
`openai/gpt-*`; xác thực gói đăng ký đến từ tài khoản/hồ sơ Codex, không phải
từ tiền tố mô hình `openai-codex/*`.

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

Đừng dùng `openai-codex/gpt-*` khi ý bạn là runtime Codex gốc. Tiền tố đó
là tuyến rõ ràng "Codex OAuth qua PI". Thay đổi cấu hình áp dụng cho phiên mới
hoặc phiên đã đặt lại; các phiên hiện có giữ runtime đã ghi lại.

## Plugin này thay đổi gì

Plugin `codex` đi kèm đóng góp một số năng lực riêng biệt:

| Năng lực                          | Cách bạn dùng                                       | Chức năng                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime nhúng gốc                 | `agentRuntime.id: "codex"`                          | Chạy các lượt tác tử nhúng của OpenClaw thông qua app-server Codex.           |
| Lệnh điều khiển chat gốc          | `/codex bind`, `/codex resume`, `/codex steer`, ... | Liên kết và điều khiển các luồng app-server Codex từ một cuộc trò chuyện nhắn tin. |
| Nhà cung cấp/danh mục app-server Codex | nội bộ `codex`, được hiển thị qua harness           | Cho phép runtime khám phá và xác thực các mô hình app-server.                 |
| Đường hiểu phương tiện Codex      | đường tương thích mô hình hình ảnh `codex/*`        | Chạy các lượt app-server Codex có giới hạn cho các mô hình hiểu hình ảnh được hỗ trợ. |
| Chuyển tiếp hook gốc              | Hook Plugin quanh các sự kiện gốc của Codex         | Cho phép OpenClaw quan sát/chặn các sự kiện công cụ/hoàn tất gốc của Codex được hỗ trợ. |

Bật Plugin sẽ làm các năng lực đó khả dụng. Nó **không**:

- bắt đầu dùng Codex cho mọi mô hình OpenAI
- chuyển các ref mô hình `openai-codex/*` thành runtime gốc
- biến ACP/acpx thành đường Codex mặc định
- chuyển nóng các phiên hiện có đã ghi runtime PI
- thay thế phân phối kênh, tệp phiên, lưu trữ hồ sơ xác thực hoặc
  định tuyến tin nhắn của OpenClaw

Cùng Plugin này cũng sở hữu bề mặt lệnh điều khiển chat `/codex` gốc. Nếu
Plugin được bật và người dùng yêu cầu liên kết, tiếp tục, điều hướng, dừng hoặc kiểm tra
các luồng Codex từ chat, tác tử nên ưu tiên `/codex ...` hơn ACP. ACP vẫn là
dự phòng rõ ràng khi người dùng yêu cầu ACP/acpx hoặc đang kiểm thử bộ chuyển đổi
ACP Codex.

Các lượt Codex gốc giữ hook Plugin OpenClaw làm lớp tương thích công khai.
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
kết quả được trả về cho Codex. Phần này tách biệt với hook Plugin công khai
`tool_result_persist`, vốn chuyển đổi các lần ghi kết quả công cụ trong transcript
do OpenClaw sở hữu.

Để biết ngữ nghĩa hook Plugin, xem [Hook Plugin](/vi/plugins/hooks)
và [Hành vi guard Plugin](/vi/tools/plugin).

Harness tắt theo mặc định. Các cấu hình mới nên giữ ref mô hình OpenAI
ở dạng chuẩn `openai/gpt-*` và ép rõ ràng
`agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex` khi chúng
muốn thực thi app-server gốc. Các ref mô hình `codex/*` cũ vẫn tự động chọn
harness để tương thích, nhưng các tiền tố nhà cung cấp cũ được runtime hỗ trợ
không được hiển thị như lựa chọn mô hình/nhà cung cấp thông thường.

Nếu Plugin `codex` được bật nhưng mô hình chính vẫn là
`openai-codex/*`, `openclaw doctor` sẽ cảnh báo thay vì thay đổi tuyến. Điều đó
là có chủ ý: `openai-codex/*` vẫn là đường Codex OAuth/gói đăng ký qua PI, còn
thực thi app-server gốc vẫn là lựa chọn runtime rõ ràng.

## Bản đồ tuyến

Dùng bảng này trước khi thay đổi cấu hình:

| Hành vi mong muốn                                  | Ref mô hình                | Cấu hình runtime                       | Tuyến xác thực/hồ sơ          | Nhãn trạng thái dự kiến        |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ----------------------------- | ------------------------------ |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth hoặc tài khoản Codex | `Runtime: OpenAI Codex`        |
| OpenAI API qua runner OpenClaw bình thường         | `openai/gpt-*`             | bỏ qua hoặc `runtime: "pi"`            | Khóa OpenAI API               | `Runtime: OpenClaw Pi Default` |
| Gói đăng ký ChatGPT/Codex qua PI                   | `openai-codex/gpt-*`       | bỏ qua hoặc `runtime: "pi"`            | Nhà cung cấp OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Nhiều nhà cung cấp với chế độ tự động thận trọng   | ref theo nhà cung cấp      | `agentRuntime.id: "auto"`              | Theo nhà cung cấp đã chọn     | Tùy runtime đã chọn            |
| Phiên bộ chuyển đổi Codex ACP rõ ràng              | phụ thuộc prompt/mô hình ACP | `sessions_spawn` với `runtime: "acp"` | Xác thực backend ACP          | Trạng thái tác vụ/phiên ACP    |

Điểm phân tách quan trọng là nhà cung cấp so với runtime:

- `openai-codex/*` trả lời "PI nên dùng tuyến nhà cung cấp/xác thực nào?"
- `agentRuntime.id: "codex"` trả lời "vòng lặp nào nên thực thi lượt
  nhúng này?"
- `/codex ...` trả lời "cuộc trò chuyện Codex gốc nào mà chat này nên liên kết
  hoặc điều khiển?"
- ACP trả lời "quy trình harness bên ngoài nào mà acpx nên khởi chạy?"

## Chọn đúng tiền tố mô hình

Các tuyến họ OpenAI phụ thuộc vào tiền tố. Với thiết lập phổ biến gồm gói đăng ký cộng
runtime Codex gốc, dùng `openai/*` với `agentRuntime.id: "codex"`.
Chỉ dùng `openai-codex/*` khi bạn cố ý muốn Codex OAuth qua PI:

| Ref mô hình                                   | Đường runtime                                | Dùng khi                                                                   |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Nhà cung cấp OpenAI qua hệ thống OpenClaw/PI | Bạn muốn quyền truy cập OpenAI Platform API trực tiếp hiện tại với `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth qua OpenClaw/PI           | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với runner PI mặc định.        |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Bạn muốn xác thực gói đăng ký ChatGPT/Codex với thực thi Codex gốc.        |

GPT-5.5 có thể xuất hiện trên cả tuyến khóa API OpenAI trực tiếp và tuyến gói đăng ký Codex
khi tài khoản của bạn mở các tuyến đó. Dùng `openai/gpt-5.5` với harness app-server
Codex cho runtime Codex gốc, `openai-codex/gpt-5.5` cho PI OAuth, hoặc
`openai/gpt-5.5` không có ghi đè runtime Codex cho lưu lượng khóa API trực tiếp.

Các ref `codex/gpt-*` cũ vẫn được chấp nhận làm bí danh tương thích. Migration
tương thích của doctor viết lại các ref runtime chính cũ thành ref mô hình chuẩn
và ghi chính sách runtime riêng, còn các ref cũ chỉ dùng làm dự phòng
được giữ nguyên vì runtime được cấu hình cho toàn bộ container tác tử.
Cấu hình PI Codex OAuth mới nên dùng `openai-codex/gpt-*`; cấu hình harness
app-server gốc mới nên dùng `openai/gpt-*` cộng
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng
`openai-codex/gpt-*` khi hiểu hình ảnh nên chạy qua đường nhà cung cấp OpenAI
Codex OAuth. Dùng `codex/gpt-*` khi hiểu hình ảnh nên chạy
qua một lượt app-server Codex có giới hạn. Mô hình app-server Codex phải
quảng bá hỗ trợ đầu vào hình ảnh; mô hình Codex chỉ văn bản sẽ thất bại trước khi lượt phương tiện
bắt đầu.

Dùng `/status` để xác nhận harness hiệu lực cho phiên hiện tại. Nếu lựa chọn
gây bất ngờ, bật ghi log gỡ lỗi cho hệ thống con `agents/harness`
và kiểm tra bản ghi có cấu trúc `agent harness selected` của gateway. Nó
bao gồm id harness đã chọn, lý do lựa chọn, chính sách runtime/dự phòng và,
ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

### Ý nghĩa của cảnh báo doctor

`openclaw doctor` cảnh báo khi tất cả điều kiện sau đúng:

- Plugin `codex` đi kèm được bật hoặc được cho phép
- mô hình chính của một tác tử là `openai-codex/*`
- runtime hiệu lực của tác tử đó không phải `codex`

Cảnh báo đó tồn tại vì người dùng thường kỳ vọng "đã bật Plugin Codex" sẽ ngụ ý
"runtime app-server Codex gốc." OpenClaw không tự suy diễn như vậy. Cảnh báo
có nghĩa là:

- **Không cần thay đổi** nếu bạn đã định dùng ChatGPT/Codex OAuth qua PI.
- Đổi mô hình thành `openai/<model>` và đặt
  `agentRuntime.id: "codex"` nếu bạn đã định dùng thực thi app-server
  gốc.
- Các phiên hiện có vẫn cần `/new` hoặc `/reset` sau khi thay đổi runtime,
  vì pin runtime phiên là cố định.

Lựa chọn harness không phải là điều khiển phiên trực tiếp. Khi một lượt nhúng chạy,
OpenClaw ghi id harness đã chọn vào phiên đó và tiếp tục dùng nó cho
các lượt sau trong cùng id phiên. Thay đổi cấu hình `agentRuntime` hoặc
`OPENCLAW_AGENT_RUNTIME` khi bạn muốn các phiên tương lai dùng harness khác;
dùng `/new` hoặc `/reset` để bắt đầu phiên mới trước khi chuyển một cuộc trò chuyện hiện có
giữa PI và Codex. Điều này tránh phát lại một transcript qua
hai hệ thống phiên gốc không tương thích.

Các phiên cũ được tạo trước khi có pin harness được xem là đã pin PI khi chúng
có lịch sử transcript. Dùng `/new` hoặc `/reset` để đưa cuộc trò chuyện đó vào
Codex sau khi thay đổi cấu hình.

`/status` hiển thị runtime mô hình thực tế. Harness PI mặc định xuất hiện dưới dạng
`Runtime: OpenClaw Pi Default`, và harness app-server Codex xuất hiện dưới dạng
`Runtime: OpenAI Codex`.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- App-server Codex `0.125.0` trở lên. Plugin đi kèm mặc định quản lý một tệp nhị phân
  app-server Codex tương thích, nên các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến quá trình khởi động harness thông thường.
- Xác thực Codex khả dụng cho tiến trình app-server hoặc cho cầu nối xác thực
  Codex của OpenClaw. Các lần khởi chạy app-server cục bộ sử dụng thư mục home
  Codex do OpenClaw quản lý cho từng tác tử và một `HOME` con tách biệt, nên
  theo mặc định chúng không đọc tài khoản, Skills, Plugin, cấu hình, trạng thái
  luồng, hoặc `$HOME/.agents/skills` gốc trong `~/.codex` cá nhân của bạn.

Plugin chặn các bắt tay app-server cũ hơn hoặc không có phiên bản. Điều đó giữ
OpenClaw trên bề mặt giao thức đã được kiểm thử.

Đối với kiểm thử khói trực tiếp và Docker, xác thực thường đến từ tài khoản CLI
Codex hoặc hồ sơ xác thực `openai-codex` của OpenClaw. Các lần khởi chạy
app-server stdio cục bộ cũng có thể dùng dự phòng `CODEX_API_KEY` /
`OPENAI_API_KEY` khi không có tài khoản.

## Tệp khởi tạo workspace

Codex tự xử lý `AGENTS.md` thông qua cơ chế phát hiện tài liệu dự án gốc. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào tên tệp dự phòng
của Codex cho các tệp persona, vì dự phòng Codex chỉ áp dụng khi thiếu
`AGENTS.md`.

Để bảo đảm tương đương workspace OpenClaw, harness Codex phân giải các tệp khởi tạo
khác (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, và `MEMORY.md` khi có) rồi chuyển tiếp chúng qua hướng dẫn cấu hình
Codex trên `thread/start` và `thread/resume`. Điều này giữ cho ngữ cảnh persona/hồ sơ
workspace của `SOUL.md` và các tệp liên quan vẫn hiển thị mà không nhân bản
`AGENTS.md`.

## Thêm Codex cùng các mô hình khác

Không đặt `agentRuntime.id: "codex"` toàn cục nếu cùng một tác tử cần tự do chuyển đổi
giữa Codex và các mô hình nhà cung cấp không phải Codex. Runtime bị ép buộc áp dụng
cho mọi lượt nhúng của tác tử hoặc phiên đó. Nếu bạn chọn một mô hình Anthropic trong khi
runtime đó bị ép buộc, OpenClaw vẫn thử harness Codex và đóng lỗi thay vì âm thầm
định tuyến lượt đó qua PI.

Thay vào đó, hãy dùng một trong các dạng sau:

- Đặt Codex trên một tác tử chuyên dụng với `agentRuntime.id: "codex"`.
- Giữ tác tử mặc định ở `agentRuntime.id: "auto"` và dự phòng PI cho cách dùng nhà cung cấp
  hỗn hợp thông thường.
- Chỉ dùng các tham chiếu `codex/*` cũ để tương thích. Cấu hình mới nên ưu tiên
  `openai/*` cộng với một chính sách runtime Codex rõ ràng.

Ví dụ, cấu hình này giữ tác tử mặc định ở chế độ chọn tự động thông thường và
thêm một tác tử Codex riêng:

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
- Tác tử `codex` dùng harness app-server Codex.
- Nếu Codex bị thiếu hoặc không được hỗ trợ cho tác tử `codex`, lượt đó sẽ lỗi
  thay vì âm thầm dùng PI.

## Định tuyến lệnh tác tử

Tác tử nên định tuyến yêu cầu người dùng theo ý định, không chỉ theo từ "Codex":

| Người dùng yêu cầu...                                  | Tác tử nên dùng...                               |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Gắn cuộc trò chuyện này với Codex"                    | `/codex bind`                                    |
| "Tiếp tục luồng Codex `<id>` tại đây"                  | `/codex resume <id>`                             |
| "Hiển thị các luồng Codex"                             | `/codex threads`                                 |
| "Gửi báo cáo hỗ trợ cho một lần chạy Codex lỗi"        | `/diagnostics [note]`                            |
| "Chỉ gửi phản hồi Codex cho luồng đính kèm này"        | `/codex diagnostics [note]`                      |
| "Dùng gói đăng ký ChatGPT/Codex của tôi với runtime Codex" | `openai/*` cộng với `agentRuntime.id: "codex"` |
| "Dùng gói đăng ký ChatGPT/Codex của tôi thông qua PI"  | tham chiếu mô hình `openai-codex/*`              |
| "Chạy Codex qua ACP/acpx"                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Khởi động Claude Code/Gemini/OpenCode/Cursor trong một luồng" | ACP/acpx, không phải `/codex` và không phải tác tử con gốc |

OpenClaw chỉ quảng bá hướng dẫn spawn ACP cho tác tử khi ACP được bật,
có thể dispatch và được hỗ trợ bởi một backend runtime đã tải. Nếu ACP không khả dụng,
system prompt và Skills của Plugin không nên dạy tác tử về định tuyến ACP.

## Triển khai chỉ dùng Codex

Ép dùng harness Codex khi bạn cần chứng minh rằng mọi lượt tác tử nhúng đều
dùng Codex. Runtime Plugin rõ ràng sẽ đóng lỗi và không bao giờ được âm thầm thử lại
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

Khi Codex bị ép buộc, OpenClaw lỗi sớm nếu Plugin Codex bị tắt, app-server quá cũ,
hoặc app-server không thể khởi động.

## Codex theo từng tác tử

Bạn có thể đặt một tác tử chỉ dùng Codex trong khi tác tử mặc định vẫn giữ
chế độ tự chọn thông thường:

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

Dùng các lệnh phiên thông thường để chuyển đổi tác tử và mô hình. `/new` tạo một
phiên OpenClaw mới và harness Codex tạo hoặc tiếp tục luồng app-server sidecar của nó
khi cần. `/reset` xóa liên kết phiên OpenClaw cho luồng đó và cho phép lượt tiếp theo
phân giải harness lại từ cấu hình hiện tại.

## Khám phá mô hình

Theo mặc định, Plugin Codex hỏi app-server về các mô hình khả dụng. Nếu
khám phá lỗi hoặc hết thời gian, nó dùng danh mục dự phòng đi kèm cho:

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

Tắt khám phá khi bạn muốn quá trình khởi động tránh dò Codex và chỉ dùng
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

## Kết nối và chính sách app-server

Theo mặc định, Plugin khởi động tệp nhị phân Codex do OpenClaw quản lý cục bộ với:

```bash
codex app-server --listen stdio://
```

Tệp nhị phân được quản lý được phát hành cùng gói Plugin `codex`. Điều này giữ phiên bản
app-server gắn với Plugin đi kèm thay vì bất kỳ CLI Codex riêng biệt nào tình cờ
được cài cục bộ. Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một tệp thực thi khác.

Theo mặc định, OpenClaw khởi động các phiên harness Codex cục bộ ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Đây là tư thế vận hành cục bộ tin cậy dùng
cho các Heartbeat tự chủ: Codex có thể dùng công cụ shell và mạng mà không
dừng ở các lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

Để bật phê duyệt do guardian của Codex xem xét, đặt `appServer.mode:
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

Chế độ guardian dùng đường dẫn phê duyệt tự động xem xét gốc của Codex. Khi Codex yêu cầu
rời sandbox, ghi bên ngoài workspace, hoặc thêm quyền như truy cập mạng,
Codex định tuyến yêu cầu phê duyệt đó tới bộ xem xét gốc thay vì lời nhắc cho
con người. Bộ xem xét áp dụng khung rủi ro của Codex và phê duyệt hoặc từ chối
yêu cầu cụ thể. Dùng Guardian khi bạn muốn nhiều rào chắn hơn chế độ YOLO
nhưng vẫn cần các tác tử không giám sát tiếp tục tiến triển.

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"`.
Các trường chính sách riêng lẻ vẫn ghi đè `mode`, nên các triển khai nâng cao có thể kết hợp
preset với lựa chọn rõ ràng. Giá trị bộ xem xét cũ `guardian_subagent` vẫn
được chấp nhận như bí danh tương thích, nhưng cấu hình mới nên dùng
`auto_review`.

Với app-server đã chạy, dùng truyền tải WebSocket:

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
`CODEX_HOME` lẫn `HOME` thành thư mục theo từng tác tử trong trạng thái OpenClaw
của tác tử đó. Trình tải skill riêng của Codex đọc `$CODEX_HOME/skills` và
`$HOME/.agents/skills`, nên cả hai giá trị đều được tách biệt cho các lần khởi chạy
app-server cục bộ. Điều đó giữ Skills, Plugin, cấu hình, tài khoản và trạng thái luồng
gốc của Codex nằm trong phạm vi tác tử OpenClaw thay vì rò rỉ từ home CLI Codex
cá nhân của người vận hành.

Plugin OpenClaw và ảnh chụp nhanh skill OpenClaw vẫn đi qua registry Plugin và trình tải
skill riêng của OpenClaw. Tài sản CLI Codex cá nhân thì không. Nếu bạn có
Skills hoặc Plugin CLI Codex hữu ích nên trở thành một phần của tác tử OpenClaw,
hãy kiểm kê chúng rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Nhà cung cấp di chuyển Codex sao chép Skills vào workspace tác tử OpenClaw hiện tại.
Plugin, hook và tệp cấu hình gốc của Codex được báo cáo hoặc lưu trữ
để xem xét thủ công thay vì được kích hoạt tự động, vì chúng có thể
thực thi lệnh, phơi bày máy chủ MCP hoặc mang thông tin xác thực.

Xác thực được chọn theo thứ tự sau:

1. Hồ sơ xác thực Codex OpenClaw rõ ràng cho tác tử.
2. Tài khoản hiện có của app-server trong home Codex của tác tử đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và xác thực OpenAI
   vẫn cần thiết.

Khi OpenClaw thấy hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được spawn. Điều đó
giữ các khóa API cấp Gateway khả dụng cho embedding hoặc mô hình OpenAI trực tiếp
mà không vô tình khiến các lượt app-server Codex gốc bị tính phí qua API.
Hồ sơ khóa API Codex rõ ràng và dự phòng khóa môi trường stdio cục bộ dùng đăng nhập
app-server thay vì môi trường tiến trình con kế thừa. Kết nối app-server WebSocket
không nhận dự phòng khóa API môi trường Gateway; hãy dùng hồ sơ xác thực rõ ràng hoặc
tài khoản riêng của app-server từ xa.

Nếu một triển khai cần tách biệt môi trường bổ sung, thêm các biến đó vào
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

Các công cụ động của Codex mặc định dùng hồ sơ `native-first`. Ở chế độ đó,
OpenClaw không hiển thị các công cụ động trùng lặp với các thao tác không gian làm việc
gốc của Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` và
`update_plan`. Các công cụ tích hợp OpenClaw như nhắn tin, phiên, phương tiện,
Cron, trình duyệt, Node, Gateway, `heartbeat_respond` và `web_search` vẫn
khả dụng.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định         | Ý nghĩa                                                                                         |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Dùng `"openclaw-compat"` để hiển thị toàn bộ bộ công cụ động OpenClaw cho Codex app-server.     |
| `codexDynamicToolsExclude` | `[]`             | Các tên công cụ động OpenClaw bổ sung cần bỏ qua trong các lượt Codex app-server.               |

Các trường `appServer` được hỗ trợ:

| Trường              | Mặc định                                 | Ý nghĩa                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` khởi chạy Codex; `"websocket"` kết nối đến `url`.                                                                                                                                                                                  |
| `command`           | tệp nhị phân Codex được quản lý          | Tệp thực thi cho giao thức truyền stdio. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | Đối số cho giao thức truyền stdio.                                                                                                                                                                                                           |
| `url`               | chưa đặt                                 | URL app-server WebSocket.                                                                                                                                                                                                                    |
| `authToken`         | chưa đặt                                 | Mã Bearer cho giao thức truyền WebSocket.                                                                                                                                                                                                    |
| `headers`           | `{}`                                     | Header WebSocket bổ sung.                                                                                                                                                                                                                    |
| `clearEnv`          | `[]`                                     | Các tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cô lập Codex theo từng agent của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`  | `60000`                                  | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển app-server.                                                                                                                                                                              |
| `mode`              | `"yolo"`                                 | Thiết lập sẵn cho thực thi YOLO hoặc do guardian xét duyệt.                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                                | Chính sách phê duyệt Codex gốc được gửi đến lúc bắt đầu/tiếp tục/lượt của luồng.                                                                                                                                                            |
| `sandbox`           | `"danger-full-access"`                   | Chế độ sandbox Codex gốc được gửi đến lúc bắt đầu/tiếp tục luồng.                                                                                                                                                                            |
| `approvalsReviewer` | `"user"`                                 | Dùng `"auto_review"` để để Codex xét duyệt các lời nhắc phê duyệt gốc. `guardian_subagent` vẫn là bí danh cũ.                                                                                                                               |
| `serviceTier`       | chưa đặt                                 | Cấp dịch vụ Codex app-server tùy chọn: `"fast"`, `"flex"` hoặc `null`. Các giá trị cũ không hợp lệ bị bỏ qua.                                                                                                                               |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: mỗi yêu cầu Codex `item/tool/call` phải nhận được
phản hồi OpenClaw trong vòng 30 giây. Khi hết thời gian chờ, OpenClaw hủy tín hiệu
công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex để
lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server trong phạm vi lượt của Codex, harness
cũng kỳ vọng Codex hoàn tất lượt gốc bằng `turn/completed`. Nếu app-server im lặng
trong 60 giây sau phản hồi đó, OpenClaw cố gắng ngắt lượt Codex, ghi lại thời gian
chờ chẩn đoán và giải phóng làn phiên OpenClaw để các tin nhắn trò chuyện tiếp theo
không bị xếp hàng sau một lượt gốc đã cũ.

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị gỡ bỏ. Thay vào đó, hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong cùng
một tệp đã được xét duyệt với phần còn lại của thiết lập harness Codex.

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Sử dụng máy tính của Codex](/vi/plugins/codex-computer-use).

Tóm tắt: OpenClaw không đóng gói ứng dụng điều khiển máy tính để bàn hoặc tự thực thi
các hành động máy tính để bàn. Nó chuẩn bị Codex app-server, xác minh rằng máy chủ MCP
`computer-use` khả dụng, rồi để Codex xử lý các lệnh gọi công cụ MCP gốc trong các
lượt chế độ Codex.

Để truy cập trực tiếp trình điều khiển TryCua bên ngoài luồng marketplace của Codex, hãy đăng ký
`cua-driver mcp` bằng `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Xem [Sử dụng máy tính của Codex](/vi/plugins/codex-computer-use) để biết sự khác biệt
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

Sử dụng máy tính chỉ dành cho macOS và có thể yêu cầu quyền hệ điều hành cục bộ trước khi
máy chủ MCP của Codex có thể điều khiển ứng dụng. Nếu `computerUse.enabled` là true và máy chủ MCP
không khả dụng, các lượt chế độ Codex sẽ thất bại trước khi luồng bắt đầu thay vì
âm thầm chạy mà không có các công cụ Sử dụng máy tính gốc. Xem
[Sử dụng máy tính của Codex](/vi/plugins/codex-computer-use) để biết các lựa chọn marketplace,
giới hạn danh mục từ xa, lý do trạng thái và cách khắc phục sự cố.

Khi `computerUse.autoInstall` là true, OpenClaw có thể đăng ký marketplace Codex Desktop
chuẩn được đóng gói từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` nếu Codex
chưa phát hiện marketplace cục bộ. Dùng `/new` hoặc `/reset` sau khi thay đổi
cấu hình runtime hoặc Sử dụng máy tính để các phiên hiện có không giữ liên kết
PI hoặc luồng Codex cũ.

## Công thức thường dùng

Codex cục bộ với giao thức truyền stdio mặc định:

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

Phê duyệt Codex do guardian xét duyệt:

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

Chuyển đổi mô hình vẫn do OpenClaw kiểm soát. Khi một phiên OpenClaw được gắn vào
một luồng Codex hiện có, lượt tiếp theo gửi lại mô hình OpenAI, nhà cung cấp,
chính sách phê duyệt, sandbox và cấp dịch vụ hiện được chọn đến app-server.
Chuyển từ `openai/gpt-5.5` sang `openai/gpt-5.2` giữ liên kết luồng nhưng yêu cầu
Codex tiếp tục với mô hình mới được chọn.

## Lệnh Codex

Plugin được đóng gói đăng ký `/codex` làm lệnh gạch chéo được ủy quyền. Lệnh này
mang tính chung và hoạt động trên mọi kênh hỗ trợ lệnh văn bản OpenClaw.

Các dạng thường dùng:

- `/codex status` hiển thị kết nối app-server trực tiếp, mô hình, tài khoản, giới hạn tốc độ, máy chủ MCP và Skills.
- `/codex models` liệt kê các mô hình Codex app-server trực tiếp.
- `/codex threads [filter]` liệt kê các luồng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một luồng Codex hiện có.
- `/codex compact` yêu cầu Codex app-server thu gọn luồng đã gắn.
- `/codex review` bắt đầu xét duyệt gốc Codex cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi chẩn đoán Codex cho luồng đã gắn.
- `/codex computer-use status` kiểm tra Plugin Sử dụng máy tính và máy chủ MCP đã cấu hình.
- `/codex computer-use install` cài đặt Plugin Sử dụng máy tính đã cấu hình và tải lại máy chủ MCP.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của Codex app-server.
- `/codex skills` liệt kê Skills của Codex app-server.

### Quy trình gỡ lỗi thường dùng

Khi một agent dựa trên Codex làm điều gì đó bất ngờ trong Telegram, Discord, Slack,
hoặc một kênh khác, hãy bắt đầu với cuộc trò chuyện nơi sự cố xảy ra:

1. Chạy `/diagnostics bad tool choice after image upload` hoặc một ghi chú ngắn khác
   mô tả những gì bạn đã thấy.
2. Phê duyệt yêu cầu chẩn đoán một lần. Việc phê duyệt tạo tệp zip chẩn đoán
   Gateway cục bộ và, vì phiên đang dùng khung chạy Codex, cũng gửi gói phản hồi
   Codex liên quan đến máy chủ OpenAI.
3. Sao chép phản hồi chẩn đoán đã hoàn tất vào báo cáo lỗi hoặc chuỗi hỗ trợ.
   Phản hồi này bao gồm đường dẫn gói cục bộ, tóm tắt quyền riêng tư, id phiên
   OpenClaw, id chuỗi Codex và một dòng `Inspect locally` cho từng chuỗi Codex.
4. Nếu bạn muốn tự gỡ lỗi lượt chạy, hãy chạy lệnh `Inspect locally` được in ra
   trong terminal. Lệnh này trông giống `codex resume <thread-id>` và mở chuỗi
   Codex gốc để bạn có thể kiểm tra cuộc trò chuyện, tiếp tục cục bộ, hoặc hỏi
   Codex vì sao nó chọn một công cụ hoặc kế hoạch cụ thể.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex lên
cho chuỗi hiện đang được đính kèm mà không cần toàn bộ gói chẩn đoán Gateway
OpenClaw. Với hầu hết báo cáo hỗ trợ, `/diagnostics [note]` là điểm bắt đầu tốt
hơn vì nó liên kết trạng thái Gateway cục bộ và id chuỗi Codex trong một phản hồi.
Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết đầy đủ mô hình quyền riêng tư
và hành vi trong cuộc trò chuyện nhóm.

Lõi OpenClaw cũng cung cấp `/diagnostics [note]` chỉ dành cho chủ sở hữu dưới dạng
lệnh chẩn đoán Gateway chung. Lời nhắc phê duyệt của lệnh này hiển thị phần mở đầu
về dữ liệu nhạy cảm, liên kết đến [Xuất chẩn đoán](/vi/gateway/diagnostics), và yêu
cầu `openclaw gateway diagnostics export --json` thông qua phê duyệt exec rõ ràng
mỗi lần. Không phê duyệt chẩn đoán bằng quy tắc cho phép tất cả. Sau khi phê
duyệt, OpenClaw gửi một báo cáo có thể dán với đường dẫn gói cục bộ và tóm tắt
manifest. Khi phiên OpenClaw đang hoạt động dùng khung chạy Codex, cùng phê duyệt
đó cũng cho phép gửi các gói phản hồi Codex liên quan đến máy chủ OpenAI. Lời nhắc
phê duyệt nói rằng phản hồi Codex sẽ được gửi, nhưng không liệt kê id phiên hoặc
id chuỗi Codex trước khi phê duyệt.

Nếu `/diagnostics` được một chủ sở hữu gọi trong cuộc trò chuyện nhóm, OpenClaw
giữ kênh chung gọn gàng: nhóm chỉ nhận một thông báo ngắn, còn phần mở đầu chẩn
đoán, lời nhắc phê duyệt và id phiên/chuỗi Codex được gửi cho chủ sở hữu qua
đường phê duyệt riêng tư. Nếu không có đường riêng cho chủ sở hữu, OpenClaw từ
chối yêu cầu nhóm và yêu cầu chủ sở hữu chạy lệnh đó từ tin nhắn trực tiếp.

Lượt tải Codex lên đã được phê duyệt gọi `feedback/upload` của máy chủ ứng dụng
Codex và yêu cầu máy chủ ứng dụng bao gồm nhật ký cho từng chuỗi đã liệt kê và các
chuỗi con Codex được sinh ra khi có sẵn. Lượt tải lên đi qua đường phản hồi thông
thường của Codex đến máy chủ OpenAI; nếu phản hồi Codex bị tắt trong máy chủ ứng
dụng đó, lệnh trả về lỗi của máy chủ ứng dụng. Phản hồi chẩn đoán hoàn tất liệt kê
các kênh, id phiên OpenClaw, id chuỗi Codex và các lệnh `codex resume <thread-id>`
cục bộ cho những chuỗi đã được gửi. Nếu bạn từ chối hoặc bỏ qua phê duyệt,
OpenClaw không in các id Codex đó. Lượt tải lên này không thay thế bản xuất chẩn
đoán Gateway cục bộ.

`/codex resume` ghi cùng tệp liên kết sidecar mà khung chạy dùng cho các lượt bình
thường. Ở tin nhắn tiếp theo, OpenClaw tiếp tục chuỗi Codex đó, chuyển mô hình
OpenClaw hiện được chọn vào máy chủ ứng dụng, và tiếp tục bật lịch sử mở rộng.

### Kiểm tra một chuỗi Codex từ CLI

Cách nhanh nhất để hiểu một lượt chạy Codex lỗi thường là mở trực tiếp chuỗi Codex
gốc:

```sh
codex resume <thread-id>
```

Dùng cách này khi bạn nhận thấy lỗi trong một cuộc trò chuyện kênh và muốn kiểm
tra phiên Codex có vấn đề, tiếp tục phiên đó cục bộ, hoặc hỏi Codex vì sao nó đã
chọn một công cụ hoặc lựa chọn suy luận cụ thể. Đường dẫn dễ nhất thường là chạy
`/diagnostics [note]` trước: sau khi bạn phê duyệt, báo cáo hoàn tất liệt kê từng
chuỗi Codex và in một lệnh `Inspect locally`, ví dụ `codex resume <thread-id>`.
Bạn có thể sao chép lệnh đó trực tiếp vào terminal.

Bạn cũng có thể lấy id chuỗi từ `/codex binding` cho cuộc trò chuyện hiện tại
hoặc `/codex threads [filter]` cho các chuỗi máy chủ ứng dụng Codex gần đây, rồi
chạy cùng lệnh `codex resume` trong shell của bạn.

Bề mặt lệnh yêu cầu máy chủ ứng dụng Codex `0.125.0` trở lên. Các phương thức điều
khiển riêng lẻ được báo cáo là `unsupported by this Codex app-server` nếu một máy
chủ ứng dụng tương lai hoặc tùy chỉnh không cung cấp phương thức JSON-RPC đó.

## Ranh giới hook

Khung chạy Codex có ba lớp hook:

| Lớp                                  | Chủ sở hữu              | Mục đích                                                            |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                | Tương thích sản phẩm/Plugin trên các khung chạy PI và Codex.        |
| Phần mềm trung gian tiện ích mở rộng của máy chủ ứng dụng Codex | Plugin được đóng gói cùng OpenClaw | Hành vi bộ chuyển đổi theo từng lượt quanh các công cụ động OpenClaw. |
| Hook gốc Codex                       | Codex                   | Vòng đời Codex cấp thấp và chính sách công cụ gốc từ cấu hình Codex. |

OpenClaw không dùng các tệp `hooks.json` Codex của dự án hoặc toàn cục để định
tuyến hành vi Plugin OpenClaw. Với cầu nối quyền và công cụ gốc được hỗ trợ,
OpenClaw chèn cấu hình Codex theo từng chuỗi cho `PreToolUse`, `PostToolUse`,
`PermissionRequest`, và `Stop`. Các hook Codex khác như `SessionStart` và
`UserPromptSubmit` vẫn là các điều khiển cấp Codex; chúng không được cung cấp dưới
dạng hook Plugin OpenClaw trong hợp đồng v1.

Với công cụ động OpenClaw, OpenClaw thực thi công cụ sau khi Codex yêu cầu lệnh
gọi, vì vậy OpenClaw kích hoạt hành vi Plugin và phần mềm trung gian mà nó sở hữu
trong bộ chuyển đổi khung chạy. Với công cụ gốc Codex, Codex sở hữu bản ghi công
cụ chuẩn. OpenClaw có thể phản chiếu một số sự kiện được chọn, nhưng không thể ghi
lại chuỗi Codex gốc trừ khi Codex cung cấp thao tác đó qua máy chủ ứng dụng hoặc
callback hook gốc.

Các phép chiếu Compaction và vòng đời LLM đến từ thông báo máy chủ ứng dụng Codex
và trạng thái bộ chuyển đổi OpenClaw, không phải các lệnh hook Codex gốc. Các sự
kiện `before_compaction`, `after_compaction`, `llm_input`, và `llm_output` của
OpenClaw là quan sát cấp bộ chuyển đổi, không phải bản chụp từng byte của yêu cầu
nội bộ hoặc payload Compaction của Codex.

Thông báo máy chủ ứng dụng Codex gốc `hook/started` và `hook/completed` được chiếu
thành sự kiện tác tử `codex_app_server.hook` để theo dõi quỹ đạo và gỡ lỗi. Chúng
không gọi hook Plugin OpenClaw.

## Hợp đồng hỗ trợ V1

Chế độ Codex không phải là PI với một lệnh gọi mô hình khác ở bên dưới. Codex sở
hữu nhiều hơn trong vòng lặp mô hình gốc, và OpenClaw điều chỉnh các bề mặt Plugin
và phiên của mình quanh ranh giới đó.

Được hỗ trợ trong runtime Codex v1:

| Bề mặt                                        | Hỗ trợ                                  | Lý do                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vòng lặp mô hình OpenAI thông qua Codex       | Được hỗ trợ                             | Máy chủ ứng dụng Codex sở hữu lượt OpenAI, tiếp tục chuỗi gốc, và tiếp tục công cụ gốc.                                                                                                               |
| Định tuyến và phân phối kênh OpenClaw         | Được hỗ trợ                             | Telegram, Discord, Slack, WhatsApp, iMessage, và các kênh khác vẫn nằm ngoài runtime mô hình.                                                                                                         |
| Công cụ động OpenClaw                         | Được hỗ trợ                             | Codex yêu cầu OpenClaw thực thi các công cụ này, vì vậy OpenClaw vẫn nằm trong đường thực thi.                                                                                                        |
| Plugin ngữ cảnh và prompt                     | Được hỗ trợ                             | OpenClaw xây dựng các lớp phủ prompt và chiếu ngữ cảnh vào lượt Codex trước khi bắt đầu hoặc tiếp tục chuỗi.                                                                                          |
| Vòng đời công cụ ngữ cảnh                     | Được hỗ trợ                             | Việc lắp ráp, nhập hoặc bảo trì sau lượt, và phối hợp Compaction của công cụ ngữ cảnh chạy cho các lượt Codex.                                                                                        |
| Hook công cụ động                             | Được hỗ trợ                             | `before_tool_call`, `after_tool_call`, và phần mềm trung gian kết quả công cụ chạy quanh các công cụ động do OpenClaw sở hữu.                                                                         |
| Hook vòng đời                                 | Được hỗ trợ dưới dạng quan sát bộ chuyển đổi | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, và `after_compaction` kích hoạt với các payload chế độ Codex trung thực.                                                                 |
| Cổng sửa đổi câu trả lời cuối cùng            | Được hỗ trợ thông qua tiếp vận hook gốc | Codex `Stop` được tiếp vận đến `before_agent_finalize`; `revise` yêu cầu Codex thực hiện thêm một lượt mô hình trước khi hoàn tất.                                                                    |
| Chặn hoặc quan sát shell, patch, và MCP gốc   | Được hỗ trợ thông qua tiếp vận hook gốc | Codex `PreToolUse` và `PostToolUse` được tiếp vận cho các bề mặt công cụ gốc đã cam kết, bao gồm payload MCP trên máy chủ ứng dụng Codex `0.125.0` trở lên. Hỗ trợ chặn; không hỗ trợ ghi lại đối số. |
| Chính sách quyền gốc                          | Được hỗ trợ thông qua tiếp vận hook gốc | Codex `PermissionRequest` có thể được định tuyến qua chính sách OpenClaw nơi runtime cung cấp nó. Nếu OpenClaw không trả về quyết định nào, Codex tiếp tục qua đường bảo vệ hoặc phê duyệt người dùng thông thường của nó. |
| Ghi lại quỹ đạo máy chủ ứng dụng              | Được hỗ trợ                             | OpenClaw ghi lại yêu cầu mà nó gửi đến máy chủ ứng dụng và các thông báo máy chủ ứng dụng mà nó nhận được.                                                                                            |

Không được hỗ trợ trong runtime Codex v1:

| Bề mặt                                             | Ranh giới V1                                                                                                                                     | Lộ trình tương lai                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Đột biến đối số công cụ gốc                         | Các hook tiền công cụ gốc của Codex có thể chặn, nhưng OpenClaw không ghi lại đối số công cụ gốc của Codex.                                               | Cần Codex hỗ trợ hook/schema cho dữ liệu đầu vào công cụ thay thế.                            |
| Lịch sử transcript gốc Codex có thể chỉnh sửa       | Codex sở hữu lịch sử luồng gốc chuẩn. OpenClaw sở hữu một bản phản chiếu và có thể chiếu ngữ cảnh tương lai, nhưng không nên đột biến các phần nội bộ không được hỗ trợ. | Thêm các API app-server Codex rõ ràng nếu cần phẫu thuật luồng gốc.                    |
| `tool_result_persist` cho bản ghi công cụ gốc Codex | Hook đó chuyển đổi các lần ghi transcript do OpenClaw sở hữu, không phải bản ghi công cụ gốc Codex.                                                           | Có thể phản chiếu các bản ghi đã chuyển đổi, nhưng việc ghi lại chuẩn cần Codex hỗ trợ.              |
| Siêu dữ liệu Compaction gốc phong phú               | OpenClaw quan sát thời điểm Compaction bắt đầu và hoàn tất, nhưng không nhận danh sách giữ/bỏ ổn định, chênh lệch token, hoặc payload tóm tắt.            | Cần sự kiện Compaction Codex phong phú hơn.                                                     |
| Can thiệp Compaction                                | Các hook Compaction hiện tại của OpenClaw ở mức thông báo trong chế độ Codex.                                                                         | Thêm hook trước/sau Compaction của Codex nếu plugins cần phủ quyết hoặc ghi lại Compaction gốc. |
| Ghi lại yêu cầu API mô hình từng byte một           | OpenClaw có thể ghi lại các yêu cầu và thông báo app-server, nhưng lõi Codex tự xây dựng yêu cầu API OpenAI cuối cùng bên trong.                      | Cần một sự kiện truy vết yêu cầu mô hình Codex hoặc API gỡ lỗi.                                   |

## Công cụ, phương tiện và Compaction

Bộ khung Codex chỉ thay đổi trình thực thi tác nhân nhúng cấp thấp.

OpenClaw vẫn xây dựng danh sách công cụ và nhận kết quả công cụ động từ
bộ khung. Văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và đầu ra công cụ nhắn tin
tiếp tục đi qua đường dẫn phân phối OpenClaw bình thường.

Bộ chuyển tiếp hook gốc được cố ý thiết kế tổng quát, nhưng hợp đồng hỗ trợ v1
giới hạn ở các đường dẫn công cụ gốc Codex và quyền mà OpenClaw kiểm thử. Trong
runtime Codex, điều đó bao gồm các payload shell, patch và MCP `PreToolUse`,
`PostToolUse`, và `PermissionRequest`. Đừng giả định mọi sự kiện hook Codex trong tương lai
là một bề mặt Plugin OpenClaw cho đến khi hợp đồng runtime nêu tên
nó.

Với `PermissionRequest`, OpenClaw chỉ trả về quyết định cho phép hoặc từ chối rõ ràng
khi chính sách quyết định. Kết quả không có quyết định không phải là cho phép. Codex xử lý nó như không có
quyết định hook và chuyển tiếp sang đường dẫn guardian hoặc phê duyệt người dùng riêng.

Các lời gợi phê duyệt công cụ MCP của Codex được định tuyến qua luồng
phê duyệt Plugin của OpenClaw khi Codex đánh dấu `_meta.codex_approval_kind` là
`"mcp_tool_call"`. Các prompt `request_user_input` của Codex được gửi lại về
cuộc trò chuyện gốc, và tin nhắn tiếp theo trong hàng đợi trả lời yêu cầu máy chủ gốc đó
thay vì được điều hướng như ngữ cảnh bổ sung. Các yêu cầu gợi MCP khác
vẫn thất bại đóng.

Điều hướng hàng đợi lượt đang hoạt động ánh xạ vào `turn/steer` của app-server Codex. Với
mặc định `messages.queue.mode: "steer"`, OpenClaw gom nhóm các tin nhắn trò chuyện trong hàng đợi
trong khoảng thời gian yên lặng đã cấu hình và gửi chúng thành một yêu cầu `turn/steer`
theo thứ tự đến. Chế độ `queue` cũ gửi các yêu cầu `turn/steer` riêng biệt. Các lượt
xem xét Codex và Compaction thủ công có thể từ chối điều hướng cùng lượt, trong trường hợp đó
OpenClaw dùng hàng đợi followup khi chế độ đã chọn cho phép fallback. Xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Khi mô hình đã chọn dùng bộ khung Codex, Compaction luồng gốc được
ủy quyền cho app-server Codex. OpenClaw giữ một bản phản chiếu transcript cho lịch sử kênh,
tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc bộ khung trong tương lai. Bản
phản chiếu bao gồm prompt của người dùng, văn bản trợ lý cuối cùng và các bản ghi lập luận hoặc kế hoạch
nhẹ của Codex khi app-server phát ra chúng. Hiện nay, OpenClaw chỉ
ghi lại tín hiệu bắt đầu và hoàn tất Compaction gốc. Nó chưa phơi bày
bản tóm tắt Compaction dễ đọc cho con người hoặc danh sách có thể kiểm toán về những mục Codex
giữ lại sau Compaction.

Vì Codex sở hữu luồng gốc chuẩn, `tool_result_persist` hiện không
ghi lại các bản ghi kết quả công cụ gốc Codex. Nó chỉ áp dụng khi
OpenClaw đang ghi kết quả công cụ transcript phiên do OpenClaw sở hữu.

Tạo phương tiện không yêu cầu PI. Hình ảnh, video, nhạc, PDF, TTS và hiểu phương tiện
tiếp tục dùng các thiết lập nhà cung cấp/mô hình khớp như
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, và
`messages.tts`.

## Khắc phục sự cố

**Codex không xuất hiện như một nhà cung cấp `/model` bình thường:** điều đó là dự kiến với
cấu hình mới. Chọn một mô hình `openai/gpt-*` với
`agentRuntime.id: "codex"` (hoặc tham chiếu `codex/*` cũ), bật
`plugins.entries.codex.enabled`, và kiểm tra liệu `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** `agentRuntime.id: "auto"` vẫn có thể dùng PI làm
backend tương thích khi không có bộ khung Codex nào nhận lượt chạy. Đặt
`agentRuntime.id: "codex"` để buộc chọn Codex khi kiểm thử. Một
runtime Codex bị ép buộc sẽ thất bại thay vì fallback sang PI. Sau khi app-server Codex
được chọn, lỗi của nó hiển thị trực tiếp.

**app-server bị từ chối:** nâng cấp Codex để bắt tay app-server
báo phiên bản `0.125.0` hoặc mới hơn. Các bản prerelease cùng phiên bản hoặc phiên bản có hậu tố build
như `0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì
ngưỡng giao thức ổn định `0.125.0` là thứ OpenClaw kiểm thử.

**Khám phá mô hình chậm:** giảm `plugins.entries.codex.config.discovery.timeoutMs`
hoặc tắt khám phá.

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
và đảm bảo app-server từ xa nói cùng phiên bản giao thức app-server Codex.

**Một mô hình không phải Codex dùng PI:** điều đó là dự kiến trừ khi bạn đã buộc
`agentRuntime.id: "codex"` cho tác nhân đó hoặc chọn một tham chiếu
`codex/*` cũ. Các tham chiếu `openai/gpt-*` thuần và nhà cung cấp khác vẫn đi theo
đường dẫn nhà cung cấp bình thường của chúng trong chế độ `auto`. Nếu bạn buộc `agentRuntime.id: "codex"`, mọi lượt nhúng
cho tác nhân đó phải là một mô hình OpenAI được Codex hỗ trợ.

**Computer Use đã được cài nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn, khởi động lại
gateway để xóa các đăng ký hook gốc cũ. Nếu `computer-use.list_apps`
hết thời gian chờ, khởi động lại Codex Computer Use hoặc Codex Desktop và thử lại.

## Liên quan

- [Plugins bộ khung tác nhân](/vi/plugins/sdk-agent-harness)
- [Runtime tác nhân](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Trạng thái](/vi/cli/status)
- [Hook Plugin](/vi/plugins/hooks)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
