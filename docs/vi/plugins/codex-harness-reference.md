---
read_when:
    - Bạn cần tất cả các trường cấu hình của bộ khung Codex
    - Bạn đang thay đổi hành vi truyền tải, xác thực, khám phá hoặc thời gian chờ của app-server
    - Bạn đang gỡ lỗi quá trình khởi động bộ khung Codex, phát hiện mô hình hoặc cô lập môi trường
summary: Tài liệu tham khảo về cấu hình, xác thực, khám phá và máy chủ ứng dụng cho bộ khung Codex
title: Tài liệu tham chiếu về bộ chạy Codex
x-i18n:
    generated_at: "2026-05-10T19:41:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Tham chiếu này bao quát cấu hình chi tiết cho Plugin `codex`
đi kèm. Đối với thiết lập và quyết định định tuyến, hãy bắt đầu với
[Codex harness](/vi/plugins/codex-harness).

## Bề mặt cấu hình Plugin

Tất cả cài đặt Codex harness nằm dưới `plugins.entries.codex.config`.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Các trường cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định                 | Ý nghĩa                                                                                                                                  |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | bật                      | Cài đặt khám phá mô hình cho Codex app-server `model/list`.                                                                              |
| `appServer`                | app-server stdio được quản lý | Cài đặt transport, lệnh, xác thực, phê duyệt, sandbox và thời gian chờ.                                                                 |
| `codexDynamicToolsLoading` | `"searchable"`           | Dùng `"direct"` để đặt trực tiếp các công cụ động của OpenClaw vào ngữ cảnh công cụ Codex ban đầu.                                       |
| `codexDynamicToolsExclude` | `[]`                     | Tên công cụ động OpenClaw bổ sung cần bỏ qua khỏi các lượt Codex app-server.                                                            |
| `codexPlugins`             | tắt                      | Hỗ trợ Plugin/ứng dụng Codex gốc cho các Plugin tuyển chọn được cài từ nguồn đã di chuyển. Xem [Plugin Codex gốc](/vi/plugins/codex-native-plugins). |
| `computerUse`              | tắt                      | Thiết lập Codex Computer Use. Xem [Codex Computer Use](/vi/plugins/codex-computer-use).                                                    |

## Transport app-server

Theo mặc định, OpenClaw khởi động binary Codex được quản lý đi kèm với Plugin
`codex`:

```bash
codex app-server --listen stdio://
```

Cách này giữ phiên bản app-server gắn với Plugin `codex` đi kèm thay vì
bất kỳ Codex CLI riêng nào tình cờ được cài cục bộ. Chỉ đặt
`appServer.command` khi bạn cố ý muốn chạy một executable khác.

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
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Các trường `appServer` được hỗ trợ:

| Trường                        | Mặc định                                               | Ý nghĩa                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` sinh tiến trình Codex; `"websocket"` kết nối tới `url`.                                                                                                                             |
| `command`                     | binary Codex được quản lý                              | Executable cho transport stdio. Để trống để dùng binary được quản lý.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho transport stdio.                                                                                                                                                                   |
| `url`                         | chưa đặt                                               | URL app-server WebSocket.                                                                                                                                                                      |
| `authToken`                   | chưa đặt                                               | Bearer token cho transport WebSocket.                                                                                                                                                          |
| `headers`                     | `{}`                                                   | Header WebSocket bổ sung.                                                                                                                                                                      |
| `clearEnv`                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được sinh sau khi OpenClaw xây dựng môi trường kế thừa của nó.                                                           |
| `requestTimeoutMs`            | `60000`                                                | Thời gian chờ cho các lệnh gọi control-plane app-server.                                                                                                                                       |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Khoảng lặng sau một yêu cầu app-server theo phạm vi lượt trong khi OpenClaw chờ `turn/completed`.                                                                                              |
| `mode`                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc thực thi được guardian xét duyệt.                                                                                                                               |
| `approvalPolicy`              | `"never"` hoặc một chính sách phê duyệt guardian được cho phép | Chính sách phê duyệt Codex gốc gửi tới lúc bắt đầu thread, tiếp tục thread và lượt.                                                                                                           |
| `sandbox`                     | `"danger-full-access"` hoặc một sandbox guardian được cho phép | Chế độ sandbox Codex gốc gửi tới lúc bắt đầu và tiếp tục thread.                                                                                                                              |
| `approvalsReviewer`           | `"user"` hoặc một reviewer guardian được cho phép       | Dùng `"auto_review"` để Codex xét duyệt prompt phê duyệt gốc khi được phép.                                                                                                                    |
| `defaultWorkspaceDir`         | thư mục tiến trình hiện tại                            | Workspace được `/codex bind` dùng khi bỏ qua `--cwd`.                                                                                                                                          |
| `serviceTier`                 | chưa đặt                                               | Tầng dịch vụ Codex app-server tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý linh hoạt, và `null` xóa ghi đè. `"fast"` cũ được chấp nhận như `"priority"`.        |

Plugin chặn các handshake app-server cũ hơn hoặc không có phiên bản. Codex app-server
phải báo cáo phiên bản ổn định `0.125.0` hoặc mới hơn.

## Chế độ phê duyệt và sandbox

Các phiên app-server stdio cục bộ mặc định ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` và
`sandbox: "danger-full-access"`. Trạng thái toán tử cục bộ đáng tin cậy này cho phép
các lượt OpenClaw không có người giám sát và Heartbeat tiếp tục tiến triển mà không có prompt phê duyệt gốc
khi không có ai ở đó để trả lời.

Nếu tệp yêu cầu hệ thống cục bộ của Codex không cho phép các giá trị phê duyệt,
reviewer hoặc sandbox YOLO ngầm định, OpenClaw sẽ xem mặc định ngầm định đó là guardian
và chọn quyền guardian được cho phép. Các mục
`[[remote_sandbox_config]]` khớp hostname trong cùng tệp yêu cầu được tôn trọng
cho quyết định mặc định sandbox.

Đặt `appServer.mode: "guardian"` cho các phê duyệt Codex được guardian xét duyệt:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Preset `guardian` mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` và `sandbox: "workspace-write"` khi các
giá trị đó được cho phép. Các trường chính sách riêng lẻ ghi đè `mode`. Giá trị reviewer
`guardian_subagent` cũ vẫn được chấp nhận như một bí danh tương thích,
nhưng cấu hình mới nên dùng `auto_review`.

## Xác thực và cô lập môi trường

Xác thực được chọn theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw Codex tường minh cho agent.
2. Tài khoản hiện có của app-server trong Codex home của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và xác thực OpenAI
   vẫn được yêu cầu.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh. Điều đó
giữ các khóa API cấp Gateway sẵn dùng cho embeddings hoặc các mô hình OpenAI trực tiếp
mà không vô tình để các lượt Codex app-server gốc tính phí qua API.

Các hồ sơ khóa API Codex tường minh và fallback khóa môi trường stdio cục bộ dùng đăng nhập app-server
thay vì env kế thừa của tiến trình con. Các kết nối app-server WebSocket
không nhận fallback khóa API env Gateway; hãy dùng một hồ sơ xác thực tường minh hoặc
tài khoản riêng của app-server từ xa.

Các lần khởi chạy app-server stdio mặc định kế thừa môi trường tiến trình của OpenClaw, nhưng
OpenClaw sở hữu cầu nối tài khoản Codex app-server và đặt cả `CODEX_HOME` lẫn
`HOME` thành các thư mục theo agent dưới trạng thái OpenClaw của agent đó. Trình tải
skill riêng của Codex đọc `$CODEX_HOME/skills` và `$HOME/.agents/skills`, nên cả hai
giá trị đều được cô lập cho các lần khởi chạy app-server cục bộ. Điều đó giữ Skills gốc Codex,
Plugin, cấu hình, tài khoản và trạng thái thread trong phạm vi agent OpenClaw
thay vì rò rỉ từ Codex CLI home cá nhân của toán tử.

Các Plugin OpenClaw và snapshot Skills OpenClaw vẫn đi qua registry Plugin và trình tải skill
riêng của OpenClaw. Tài sản Codex CLI cá nhân thì không. Nếu bạn có
Skills hoặc Plugin Codex CLI hữu ích cần trở thành một phần của agent OpenClaw,
hãy kiểm kê chúng một cách tường minh:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` chỉ ảnh hưởng tới tiến trình con Codex app-server được sinh.
`CODEX_HOME` và `HOME` vẫn được dành riêng cho cô lập Codex theo agent của OpenClaw
trên các lần khởi chạy cục bộ.

## Công cụ động

Công cụ động Codex mặc định dùng cách tải `searchable`. OpenClaw không phơi bày
các công cụ động trùng lặp với thao tác workspace gốc Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Các công cụ tích hợp OpenClaw còn lại, chẳng hạn như nhắn tin, phiên, phương tiện, cron,
trình duyệt, node, gateway, `heartbeat_respond` và `web_search`, có sẵn
thông qua tìm kiếm công cụ Codex trong namespace `openclaw`. Điều này giữ cho
ngữ cảnh model ban đầu nhỏ hơn. `sessions_yield` và các phản hồi nguồn chỉ dành cho công cụ tin nhắn
vẫn trực tiếp vì đó là các hợp đồng điều khiển lượt.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối tới app-server Codex
tùy chỉnh không thể tìm kiếm các công cụ động được trì hoãn hoặc khi gỡ lỗi payload
công cụ đầy đủ.

## Thời gian chờ

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`. Mỗi yêu cầu Codex `item/tool/call` dùng thời gian chờ
khả dụng đầu tiên theo thứ tự này:

- Đối số `timeoutMs` theo từng lệnh gọi có giá trị dương.
- Với `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Với công cụ `image` để hiểu phương tiện, `tools.media.image.timeoutSeconds`
  được chuyển đổi sang mili giây, hoặc mặc định phương tiện 60 giây.
- Mặc định công cụ động 30 giây.

Ngân sách công cụ động được giới hạn ở 600000 ms. Khi hết thời gian chờ, OpenClaw hủy
tín hiệu công cụ khi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex
để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server trong phạm vi lượt của Codex, harness
cũng kỳ vọng Codex hoàn tất lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong `appServer.turnCompletionIdleTimeoutMs` sau phản hồi đó,
OpenClaw sẽ cố gắng hết sức để ngắt lượt Codex, ghi lại chẩn đoán
hết thời gian chờ và giải phóng làn phiên OpenClaw để các tin nhắn chat tiếp theo
không bị xếp hàng sau một lượt gốc đã cũ.

Bất kỳ thông báo chưa kết thúc nào cho cùng lượt, bao gồm
`rawResponseItem/completed`, sẽ vô hiệu hóa watchdog ngắn đó vì Codex đã
chứng minh lượt vẫn còn hoạt động. Watchdog kết thúc dài hơn tiếp tục
bảo vệ các lượt thực sự bị kẹt. Chẩn đoán thời gian chờ bao gồm phương thức thông báo
app-server gần nhất và, với các mục phản hồi assistant thô, loại mục, vai trò,
id và bản xem trước văn bản assistant có giới hạn.

## Khám phá model

Theo mặc định, Plugin Codex hỏi app-server về các model khả dụng. Tính khả dụng của model
do app-server Codex sở hữu, vì vậy danh sách có thể thay đổi khi OpenClaw
nâng cấp phiên bản `@openai/codex` được đóng gói hoặc khi một triển khai trỏ
`appServer.command` tới một binary Codex khác. Tính khả dụng cũng có thể
theo phạm vi tài khoản. Dùng `/codex models` trên gateway đang chạy để xem danh mục trực tiếp
cho harness và tài khoản đó.

Nếu quá trình khám phá thất bại hoặc hết thời gian chờ, OpenClaw dùng danh mục dự phòng được đóng gói cho:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Harness được đóng gói hiện tại là `@openai/codex` `0.130.0`. Một probe `model/list`
đối với app-server được đóng gói đó đã trả về:

| ID model              | Mặc định | Ẩn | Phương thức đầu vào | Mức nỗ lực suy luận      |
| --------------------- | -------- | -- | ------------------- | ------------------------ |
| `gpt-5.5`             | Có       | Không | text, image      | low, medium, high, xhigh |
| `gpt-5.4`             | Không    | Không | text, image      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Không    | Không | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Không    | Không | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Không    | Không | text             | low, medium, high, xhigh |
| `gpt-5.2`             | Không    | Không | text, image      | low, medium, high, xhigh |

Các model ẩn có thể được danh mục app-server trả về cho luồng nội bộ hoặc
chuyên biệt, nhưng chúng không phải là lựa chọn thông thường trong bộ chọn model.

Tinh chỉnh khám phá trong `plugins.entries.codex.config.discovery`:

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

Tắt khám phá khi bạn muốn quá trình khởi động tránh probe Codex và chỉ dùng
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

## Tệp bootstrap workspace

Codex tự xử lý `AGENTS.md` thông qua khám phá tài liệu dự án gốc. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào tên tệp dự phòng
của Codex cho các tệp persona, vì dự phòng Codex chỉ áp dụng khi
`AGENTS.md` bị thiếu.

Để có tính tương đương workspace của OpenClaw, harness Codex phân giải các tệp bootstrap
khác, bao gồm `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` và `MEMORY.md` khi có, rồi chuyển tiếp chúng
thông qua chỉ dẫn developer của Codex trên `thread/start` và `thread/resume`.
Điều này giữ cho ngữ cảnh persona và hồ sơ workspace hiển thị trên làn định hình hành vi
Codex gốc mà không sao chép `AGENTS.md`.

## Ghi đè môi trường

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua binary được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị loại bỏ. Thay vào đó, dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được rà soát như phần còn lại của thiết lập harness Codex.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Provider OpenAI](/vi/providers/openai)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
