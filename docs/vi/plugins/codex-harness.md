---
read_when:
    - Bạn muốn sử dụng bộ harness app-server Codex được tích hợp sẵn
    - Bạn cần các ví dụ cấu hình bộ chạy Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì quay về PI
summary: Chạy các lượt tác tử nhúng của OpenClaw thông qua harness app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-11T20:33:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt tác tử OpenAI nhúng
thông qua Codex app-server thay vì harness PI tích hợp sẵn.

Dùng Codex harness khi bạn muốn Codex sở hữu phiên tác tử cấp thấp:
tiếp tục luồng gốc, tiếp tục công cụ gốc, Compaction gốc và
thực thi app-server. OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình,
công cụ động OpenClaw, phê duyệt, phân phối phương tiện và bản sao transcript
hiển thị.

Thiết lập thông thường dùng các tham chiếu mô hình OpenAI chính tắc như `openai/gpt-5.5`.
Không cấu hình tham chiếu mô hình `openai-codex/gpt-*`. Đặt thứ tự xác thực tác tử OpenAI
trong `auth.order.openai`; các hồ sơ `openai-codex:*` cũ hơn và
mục `auth.order.openai-codex` vẫn được hỗ trợ cho các bản cài đặt hiện có.

OpenClaw khởi động các luồng Codex app-server với chế độ mã gốc của Codex và
bật chỉ-chế-độ-mã. Điều đó giữ các công cụ động OpenClaw có thể trì hoãn/tìm kiếm
bên trong bề mặt thực thi mã và tìm kiếm công cụ riêng của Codex thay vì thêm một
trình bao tìm kiếm công cụ kiểu PI lên trên Codex.

Để xem phần tách mô hình/nhà cung cấp/runtime rộng hơn, bắt đầu với
[Runtime tác tử](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, và Telegram,
Discord, Slack hoặc kênh khác vẫn là bề mặt giao tiếp.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- Nếu cấu hình của bạn dùng `plugins.allow`, hãy bao gồm `codex`.
- Codex app-server `0.125.0` hoặc mới hơn. Plugin đi kèm mặc định quản lý một
  nhị phân Codex app-server tương thích, vì vậy các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến quá trình khởi động harness thông thường.
- Có xác thực Codex thông qua `openclaw models auth login --provider openai-codex`,
  tài khoản app-server trong Codex home của tác tử, hoặc hồ sơ xác thực khóa API Codex
  rõ ràng.

Để biết thứ tự ưu tiên xác thực, cô lập môi trường, lệnh app-server tùy chỉnh, khám phá mô hình
và tất cả trường cấu hình, xem
[Tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Khởi động nhanh

Hầu hết người dùng muốn Codex trong OpenClaw sẽ muốn lộ trình này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, bật Plugin `codex` đi kèm và dùng một
tham chiếu mô hình `openai/gpt-*` chính tắc.

Đăng nhập bằng Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Bật Plugin `codex` đi kèm và chọn một mô hình tác tử OpenAI:

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
    },
  },
}
```

Nếu cấu hình của bạn dùng `plugins.allow`, cũng thêm `codex` vào đó:

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

Khởi động lại Gateway sau khi thay đổi cấu hình Plugin. Nếu một cuộc trò chuyện hiện có
đã có phiên, hãy dùng `/new` hoặc `/reset` trước khi kiểm thử thay đổi runtime để lượt
tiếp theo phân giải harness từ cấu hình hiện tại.

## Cấu hình

Cấu hình khởi động nhanh là cấu hình Codex harness khả dụng tối thiểu. Đặt các tùy chọn
Codex harness trong cấu hình OpenClaw và chỉ dùng CLI cho xác thực Codex:

| Nhu cầu                                | Đặt                                                                              | Nơi                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Bật harness                            | `plugins.entries.codex.enabled: true`                                            | Cấu hình OpenClaw                  |
| Giữ bản cài đặt Plugin trong danh sách cho phép | Bao gồm `codex` trong `plugins.allow`                                            | Cấu hình OpenClaw                  |
| Định tuyến lượt tác tử OpenAI qua Codex | `agents.defaults.model` hoặc `agents.list[].model` là `openai/gpt-*`             | Cấu hình tác tử OpenClaw           |
| Đăng nhập bằng Codex OAuth             | `openclaw models auth login --provider openai-codex`                             | Hồ sơ xác thực CLI                 |
| Thêm dự phòng khóa API cho các lần chạy Codex | Hồ sơ khóa API `openai:*` được liệt kê sau xác thực gói đăng ký trong `auth.order.openai` | Hồ sơ xác thực CLI + cấu hình OpenClaw |
| Thất bại đóng khi Codex không khả dụng | Provider hoặc mô hình `agentRuntime.id: "codex"`                                 | Cấu hình mô hình/provider OpenClaw |
| Dùng lưu lượng OpenAI API trực tiếp    | Provider hoặc mô hình `agentRuntime.id: "pi"` với xác thực OpenAI thông thường   | Cấu hình mô hình/provider OpenClaw |
| Tinh chỉnh hành vi app-server          | `plugins.entries.codex.config.appServer.*`                                       | Cấu hình Plugin Codex              |
| Bật ứng dụng Plugin Codex gốc          | `plugins.entries.codex.config.codexPlugins.*`                                    | Cấu hình Plugin Codex              |
| Bật Codex Computer Use                 | `plugins.entries.codex.config.computerUse.*`                                     | Cấu hình Plugin Codex              |

Dùng tham chiếu mô hình `openai/gpt-*` cho các lượt tác tử OpenAI do Codex hậu thuẫn. Ưu tiên
`auth.order.openai` cho thứ tự gói đăng ký trước/khóa API dự phòng. Các hồ sơ xác thực
`openai-codex:*` hiện có và `auth.order.openai-codex` vẫn hợp lệ, nhưng
không viết tham chiếu mô hình `openai-codex/gpt-*` mới.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Ở dạng đó, cả hai hồ sơ vẫn chạy qua Codex cho các lượt tác tử `openai/gpt-*`.
Khóa API chỉ là dự phòng xác thực, không phải yêu cầu chuyển sang PI hoặc
OpenAI Responses thuần.

Phần còn lại của trang này trình bày các biến thể phổ biến mà người dùng phải chọn:
hình thức triển khai, định tuyến thất bại đóng, chính sách phê duyệt giám hộ, Plugin Codex
gốc và Computer Use. Để xem danh sách tùy chọn đầy đủ, mặc định, enum, khám phá,
cô lập môi trường, thời gian chờ và trường vận chuyển app-server, xem
[Tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Xác minh runtime Codex

Dùng `/status` trong cuộc trò chuyện nơi bạn mong đợi Codex. Một lượt tác tử OpenAI
do Codex hậu thuẫn hiển thị:

```text
Runtime: OpenAI Codex
```

Sau đó kiểm tra trạng thái Codex app-server:

```text
/codex status
/codex models
```

`/codex status` báo cáo kết nối app-server, tài khoản, giới hạn tốc độ, máy chủ MCP
và Skills. `/codex models` liệt kê danh mục Codex app-server trực tiếp cho
harness và tài khoản. Nếu `/status` gây bất ngờ, xem
[Khắc phục sự cố](#troubleshooting).

## Định tuyến và lựa chọn mô hình

Giữ tham chiếu provider và chính sách runtime tách biệt:

- Dùng `openai/gpt-*` cho các lượt tác tử OpenAI qua Codex.
- Không dùng `openai-codex/gpt-*` trong cấu hình. Chạy `openclaw doctor --fix` để
  sửa các tham chiếu cũ và ghim tuyến phiên lỗi thời.
- `agentRuntime.id: "codex"` là tùy chọn cho chế độ tự động OpenAI thông thường, nhưng hữu ích
  khi một triển khai nên thất bại đóng nếu Codex không khả dụng.
- `agentRuntime.id: "pi"` đưa một provider hoặc mô hình vào hành vi PI trực tiếp khi
  đó là điều có chủ ý.
- `/codex ...` điều khiển các cuộc trò chuyện Codex app-server gốc từ trò chuyện.
- ACP/acpx là một đường dẫn harness bên ngoài riêng biệt. Chỉ dùng nó khi người dùng yêu cầu
  ACP/acpx hoặc bộ điều hợp harness bên ngoài.

Định tuyến lệnh phổ biến:

| Ý định của người dùng           | Dùng                                    |
| ------------------------------- | --------------------------------------- |
| Gắn cuộc trò chuyện hiện tại    | `/codex bind [--cwd <path>]`            |
| Tiếp tục luồng Codex hiện có    | `/codex resume <thread-id>`             |
| Liệt kê hoặc lọc luồng Codex    | `/codex threads [filter]`               |
| Chỉ gửi phản hồi Codex          | `/codex diagnostics [note]`             |
| Bắt đầu tác vụ ACP/acpx         | Lệnh phiên ACP/acpx, không phải `/codex` |

| Trường hợp sử dụng                                  | Cấu hình                                                         | Xác minh                                | Ghi chú                            |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc     | `openai/gpt-*` cộng với Plugin `codex` đã bật                    | `/status` hiển thị `Runtime: OpenAI Codex` | Lộ trình khuyến nghị               |
| Thất bại đóng nếu Codex không khả dụng              | Provider hoặc mô hình `agentRuntime.id: "codex"`                 | Lượt thất bại thay vì dự phòng PI       | Dùng cho triển khai chỉ Codex      |
| Lưu lượng khóa API OpenAI trực tiếp qua PI          | Provider hoặc mô hình `agentRuntime.id: "pi"` và xác thực OpenAI thông thường | `/status` hiển thị runtime PI           | Chỉ dùng khi PI là có chủ ý        |
| Cấu hình cũ                                         | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` viết lại nó     | Không viết cấu hình mới theo cách này |
| Bộ điều hợp Codex ACP/acpx                          | ACP `sessions_spawn({ runtime: "acp" })`                         | Trạng thái tác vụ/phiên ACP             | Tách biệt với Codex harness gốc    |

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng `openai/gpt-*`
cho tuyến OpenAI thông thường và `codex/gpt-*` chỉ khi khả năng hiểu hình ảnh
nên chạy qua một lượt Codex app-server có giới hạn. Không dùng
`openai-codex/gpt-*`; doctor viết lại tiền tố cũ đó thành `openai/gpt-*`.

## Mẫu triển khai

### Triển khai Codex cơ bản

Dùng cấu hình khởi động nhanh khi tất cả lượt tác tử OpenAI nên dùng Codex theo
mặc định.

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
    },
  },
}
```

### Triển khai provider hỗn hợp

Dạng này giữ Claude làm tác tử mặc định và thêm một tác tử Codex có tên:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Với cấu hình này, tác tử `main` dùng đường dẫn provider thông thường của nó và tác tử
`codex` dùng Codex app-server.

### Triển khai Codex thất bại đóng

Đối với các lượt tác tử OpenAI, `openai/gpt-*` đã phân giải sang Codex khi
Plugin đi kèm khả dụng. Thêm chính sách runtime rõ ràng khi bạn muốn có một quy tắc
thất bại đóng bằng văn bản:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Khi Codex bị buộc dùng, OpenClaw thất bại sớm nếu Plugin Codex bị tắt,
app-server quá cũ, hoặc app-server không thể khởi động.

## Chính sách app-server

Theo mặc định, Plugin khởi động nhị phân Codex do OpenClaw quản lý cục bộ bằng vận chuyển stdio.
Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một tệp thực thi
khác. Chỉ dùng vận chuyển WebSocket khi app-server đã
đang chạy ở nơi khác:

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
          },
        },
      },
    },
  },
}
```

Các phiên app-server stdio cục bộ mặc định dùng tư thế vận hành cục bộ đáng tin cậy:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Nếu các yêu cầu Codex cục bộ không cho phép
tư thế YOLO ngầm định đó, OpenClaw sẽ chọn quyền guardian được phép thay thế.
Khi sandbox OpenClaw đang hoạt động cho phiên, OpenClaw thu hẹp Codex
`danger-full-access` thành Codex `workspace-write` để các lượt code-mode gốc của Codex
vẫn nằm trong workspace đã được sandbox.

Dùng chế độ guardian khi bạn muốn tự động xét duyệt gốc của Codex trước khi thoát sandbox
hoặc cần quyền bổ sung:

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

Chế độ guardian mở rộng thành phê duyệt app-server của Codex, thường là
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, và
`sandbox: "workspace-write"` khi các yêu cầu cục bộ cho phép các giá trị đó.

Để biết mọi trường app-server, thứ tự xác thực, cô lập môi trường, phát hiện, và
hành vi timeout, xem [tham chiếu harness Codex](/vi/plugins/codex-harness-reference).

## Lệnh và chẩn đoán

Plugin được đóng gói đăng ký `/codex` làm lệnh gạch chéo trên mọi kênh
hỗ trợ lệnh văn bản OpenClaw.

Các dạng phổ biến:

- `/codex status` kiểm tra kết nối app-server, mô hình, tài khoản, giới hạn tốc độ,
  máy chủ MCP, và skills.
- `/codex models` liệt kê các mô hình app-server Codex trực tiếp.
- `/codex threads [filter]` liệt kê các thread app-server Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một
  thread Codex hiện có.
- `/codex compact` yêu cầu app-server Codex compact thread đã gắn.
- `/codex review` bắt đầu xét duyệt gốc của Codex cho thread đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi Codex cho
  thread đã gắn.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP app-server Codex.
- `/codex skills` liệt kê skills app-server Codex.

Với hầu hết báo cáo hỗ trợ, hãy bắt đầu bằng `/diagnostics [note]` trong cuộc trò chuyện
nơi lỗi xảy ra. Lệnh này tạo một báo cáo chẩn đoán Gateway và, với các phiên harness
Codex, hỏi phê duyệt để gửi gói phản hồi Codex liên quan.
Xem [xuất chẩn đoán](/vi/gateway/diagnostics) để biết mô hình quyền riêng tư và hành vi
trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex lên
cho thread hiện đang gắn mà không có toàn bộ gói chẩn đoán Gateway.

### Kiểm tra thread Codex cục bộ

Cách nhanh nhất để kiểm tra một lần chạy Codex lỗi thường là mở trực tiếp thread Codex
gốc:

```bash
codex resume <thread-id>
```

Lấy thread id từ phản hồi `/diagnostics` đã hoàn tất, `/codex binding`, hoặc
`/codex threads [filter]`.

Để biết cơ chế tải lên và ranh giới chẩn đoán cấp runtime, xem
[runtime harness Codex](/vi/plugins/codex-harness-runtime#codex-feedback-upload).

Xác thực được chọn theo thứ tự này:

1. Các hồ sơ xác thực OpenAI có thứ tự cho agent, ưu tiên dưới
   `auth.order.openai`. Các id hồ sơ `openai-codex:*` hiện có vẫn hợp lệ.
2. Tài khoản hiện có của app-server trong Codex home của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và vẫn cần xác thực OpenAI.

Khi OpenClaw thấy hồ sơ xác thực Codex kiểu thuê bao ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều đó
giữ các khóa API cấp Gateway khả dụng cho embedding hoặc mô hình OpenAI trực tiếp
mà không vô tình khiến các lượt app-server Codex gốc được tính phí qua API.
Các hồ sơ khóa API Codex rõ ràng và phương án dự phòng khóa env stdio cục bộ dùng đăng nhập
app-server thay vì env tiến trình con được kế thừa. Kết nối app-server WebSocket
không nhận phương án dự phòng khóa API env Gateway; hãy dùng hồ sơ xác thực rõ ràng hoặc
tài khoản riêng của app-server từ xa.

Nếu một hồ sơ thuê bao chạm giới hạn sử dụng Codex, OpenClaw ghi lại thời điểm đặt lại
khi Codex báo cáo thời điểm đó và thử hồ sơ xác thực theo thứ tự tiếp theo cho cùng
lần chạy Codex. Khi thời điểm đặt lại trôi qua, hồ sơ thuê bao lại đủ điều kiện
mà không cần thay đổi mô hình `openai/gpt-*` đã chọn hoặc runtime Codex.

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

Công cụ động Codex mặc định dùng cách tải `searchable`. OpenClaw không hiển thị
các công cụ động trùng lặp với thao tác workspace gốc của Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, và `update_plan`. Các công cụ tích hợp OpenClaw
còn lại như nhắn tin, phiên, media, cron, trình duyệt, node,
gateway, `heartbeat_respond`, và `web_search` khả dụng qua tìm kiếm công cụ Codex
trong namespace `openclaw`, giúp ngữ cảnh mô hình ban đầu nhỏ hơn.
`sessions_yield` và phản hồi nguồn chỉ dùng công cụ nhắn tin vẫn trực tiếp vì đó
là các hợp đồng điều khiển lượt. Hướng dẫn cộng tác Heartbeat yêu cầu Codex
tìm `heartbeat_respond` trước khi kết thúc một lượt heartbeat khi công cụ đó
chưa được tải.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối tới app-server Codex tùy chỉnh
không thể tìm kiếm công cụ động bị trì hoãn hoặc khi gỡ lỗi toàn bộ payload công cụ.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                      | Mặc định       | Ý nghĩa                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Dùng `"direct"` để đặt công cụ động OpenClaw trực tiếp vào ngữ cảnh công cụ Codex ban đầu. |
| `codexDynamicToolsExclude` | `[]`           | Tên công cụ động OpenClaw bổ sung cần bỏ qua trong các lượt app-server Codex.              |
| `codexPlugins`             | tắt            | Hỗ trợ plugin/app Codex gốc cho các plugin tuyển chọn đã di trú được cài từ nguồn.           |

Các trường `appServer` được hỗ trợ:

| Trường                        | Mặc định                                               | Ý nghĩa                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` sinh Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                |
| `command`                     | binary Codex được quản lý                              | Tệp thực thi cho transport stdio. Để trống để dùng binary được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho transport stdio.                                                                                                                                                                                                          |
| `url`                         | chưa đặt                                               | URL app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | chưa đặt                                               | Bearer token cho transport WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Header WebSocket bổ sung.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được sinh ra sau khi OpenClaw xây dựng môi trường kế thừa của nó. `CODEX_HOME` và `HOME` được dành riêng cho cô lập Codex theo từng agent của OpenClaw trong các lần khởi chạy cục bộ.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout cho các lệnh gọi control-plane app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Khoảng yên lặng sau một yêu cầu app-server Codex theo phạm vi lượt trong khi OpenClaw chờ `turn/completed`. Tăng giá trị này cho các pha tổng hợp chậm sau công cụ hoặc chỉ trạng thái.                                                                     |
| `mode`                        | `"yolo"` trừ khi các yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc được guardian xét duyệt. Các yêu cầu stdio cục bộ bỏ qua `danger-full-access`, phê duyệt `never`, hoặc reviewer `user` khiến mặc định ngầm định thành guardian.                                                   |
| `approvalPolicy`              | `"never"` hoặc một chính sách phê duyệt guardian được phép       | Chính sách phê duyệt Codex gốc được gửi tới bắt đầu/tiếp tục/lượt của thread. Mặc định guardian ưu tiên `"on-request"` khi được phép.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` hoặc một sandbox guardian được phép  | Chế độ sandbox Codex gốc được gửi tới bắt đầu/tiếp tục thread. Mặc định guardian ưu tiên `"workspace-write"` khi được phép, nếu không thì `"read-only"`. Khi sandbox OpenClaw đang hoạt động, `danger-full-access` được thu hẹp thành `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` hoặc một reviewer guardian được phép               | Dùng `"auto_review"` để Codex xét duyệt prompt phê duyệt gốc khi được phép, nếu không thì `guardian_subagent` hoặc `user`. `guardian_subagent` vẫn là alias cũ.                                                                      |
| `serviceTier`                 | chưa đặt                                               | Tầng dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý flex, `null` xóa ghi đè, và `"fast"` cũ được chấp nhận như `"priority"`.                                         |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: các yêu cầu `item/tool/call` của Codex dùng watchdog
30 giây của OpenClaw theo mặc định. Đối số `timeoutMs` dương cho từng lệnh gọi sẽ
kéo dài hoặc rút ngắn ngân sách của công cụ cụ thể đó. Công cụ `image_generate`
cũng dùng `agents.defaults.imageGenerationModel.timeoutMs` khi lệnh gọi công cụ
không cung cấp timeout riêng, và công cụ `image` để hiểu phương tiện dùng
`tools.media.image.timeoutSeconds` hoặc mặc định phương tiện 60 giây của nó. Ngân
sách công cụ động được giới hạn tối đa ở 600000 ms. Khi timeout, OpenClaw hủy tín
hiệu công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex
để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server trong phạm vi lượt của Codex, bộ
chạy cũng kỳ vọng Codex hoàn tất lượt gốc bằng `turn/completed`. Nếu app-server
im lặng trong `appServer.turnCompletionIdleTimeoutMs` sau phản hồi đó, OpenClaw
sẽ cố gắng tốt nhất để ngắt lượt Codex, ghi lại timeout chẩn đoán, và giải phóng
làn phiên OpenClaw để các tin nhắn trò chuyện tiếp theo không bị xếp hàng sau
một lượt gốc cũ. Bất kỳ thông báo chưa kết thúc nào cho cùng lượt, bao gồm
`rawResponseItem/completed`, sẽ vô hiệu hóa watchdog ngắn đó vì Codex đã chứng
minh lượt vẫn còn hoạt động; watchdog kết thúc dài hơn tiếp tục bảo vệ các lượt
thực sự bị kẹt. Chẩn đoán timeout bao gồm phương thức thông báo app-server cuối
cùng và, đối với các mục phản hồi thô của trợ lý, loại mục, vai trò, id, và một
bản xem trước văn bản trợ lý có giới hạn.

Các ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua binary được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị gỡ bỏ. Thay vào đó hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai lặp lại được vì nó giữ hành vi Plugin trong cùng
tệp đã được rà soát với phần còn lại của thiết lập bộ chạy Codex.

## Plugin Codex gốc

Hỗ trợ Plugin Codex gốc dùng các khả năng ứng dụng và Plugin riêng của app-server
Codex trong cùng luồng Codex với lượt bộ chạy OpenClaw. OpenClaw không chuyển đổi
Plugin Codex thành các công cụ động OpenClaw `codex_plugin_*` tổng hợp.

`codexPlugins` chỉ ảnh hưởng đến các phiên chọn bộ chạy Codex gốc. Nó không có
tác dụng với các lượt chạy PI, các lượt chạy nhà cung cấp OpenAI thông thường,
các ràng buộc hội thoại ACP, hoặc các bộ chạy khác.

Cấu hình đã di chuyển tối thiểu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Cấu hình ứng dụng luồng được tính khi OpenClaw thiết lập một phiên bộ chạy Codex
hoặc thay thế một ràng buộc luồng Codex cũ. Nó không được tính lại ở mọi lượt.
Sau khi thay đổi `codexPlugins`, hãy dùng `/new`, `/reset`, hoặc khởi động lại
gateway để các phiên bộ chạy Codex trong tương lai bắt đầu với bộ ứng dụng đã cập
nhật.

Về điều kiện di chuyển, danh mục ứng dụng, chính sách hành động phá hủy,
elicitations, và chẩn đoán Plugin gốc, xem
[Plugin Codex gốc](/vi/plugins/codex-native-plugins).

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Codex Computer Use](/vi/plugins/codex-computer-use).

Tóm tắt ngắn: OpenClaw không đóng gói ứng dụng điều khiển máy tính để bàn hoặc tự
thực thi hành động trên máy tính để bàn. Nó chuẩn bị app-server Codex, xác minh
máy chủ MCP `computer-use` khả dụng, rồi để Codex sở hữu các lệnh gọi công cụ MCP
gốc trong các lượt chế độ Codex.

## Ranh giới thời gian chạy

Bộ chạy Codex chỉ thay đổi trình thực thi agent nhúng cấp thấp.

- Các công cụ động OpenClaw được hỗ trợ. Codex yêu cầu OpenClaw thực thi các công
  cụ đó, vì vậy OpenClaw vẫn nằm trong đường thực thi.
- Các công cụ shell, patch, MCP, và ứng dụng gốc của Codex do Codex sở hữu.
  OpenClaw có thể quan sát hoặc chặn các sự kiện gốc đã chọn qua relay được hỗ
  trợ, nhưng nó không viết lại đối số công cụ gốc.
- Codex sở hữu Compaction gốc. OpenClaw giữ một bản sao transcript cho lịch sử
  kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc bộ chạy trong
  tương lai.
- Tạo phương tiện, hiểu phương tiện, TTS, phê duyệt, và đầu ra công cụ nhắn tin
  tiếp tục đi qua các thiết lập nhà cung cấp/mô hình OpenClaw tương ứng.
- `tool_result_persist` áp dụng cho kết quả công cụ transcript do OpenClaw sở
  hữu, không áp dụng cho bản ghi kết quả công cụ gốc của Codex.

Về các lớp hook, các bề mặt V1 được hỗ trợ, xử lý quyền gốc, điều hướng hàng đợi,
cơ chế tải phản hồi Codex lên, và chi tiết Compaction, xem
[Thời gian chạy bộ chạy Codex](/vi/plugins/codex-harness-runtime).

## Khắc phục sự cố

**Codex không xuất hiện như một nhà cung cấp `/model` thông thường:** điều này là
dự kiến với các cấu hình mới. Chọn một mô hình `openai/gpt-*`, bật
`plugins.entries.codex.enabled`, và kiểm tra xem `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** hãy bảo đảm model ref là `openai/gpt-*` trên
nhà cung cấp OpenAI chính thức và Plugin Codex đã được cài đặt và bật. Nếu cần
bằng chứng nghiêm ngặt trong khi kiểm thử, đặt `agentRuntime.id: "codex"` cho nhà
cung cấp hoặc mô hình. Thời gian chạy Codex bắt buộc sẽ thất bại thay vì quay về
PI.

**Cấu hình `openai-codex/*` cũ vẫn còn:** chạy `openclaw doctor --fix`. Doctor
viết lại các model ref cũ thành `openai/*`, gỡ các ghim thời gian chạy phiên và
toàn agent đã cũ, đồng thời giữ nguyên các ghi đè auth-profile hiện có.

**app-server bị từ chối:** dùng app-server Codex `0.125.0` hoặc mới hơn. Các bản
phát hành trước cùng phiên bản hoặc phiên bản có hậu tố build như
`0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì OpenClaw kiểm thử ngưỡng
giao thức ổn định `0.125.0`.

**`/codex status` không thể kết nối:** kiểm tra Plugin `codex` đi kèm đã được bật,
`plugins.allow` bao gồm nó khi allowlist được cấu hình, và mọi `appServer.command`,
`url`, `authToken`, hoặc header tùy chỉnh đều hợp lệ.

**Khám phá mô hình chậm:** giảm
`plugins.entries.codex.config.discovery.timeoutMs` hoặc tắt khám phá. Xem
[Tham chiếu bộ chạy Codex](/vi/plugins/codex-harness-reference#model-discovery).

**Truyền tải WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`,
`authToken`, header, và app-server từ xa dùng cùng phiên bản giao thức app-server
Codex.

**Một mô hình không phải Codex dùng PI:** điều này là dự kiến trừ khi chính sách
thời gian chạy của nhà cung cấp hoặc mô hình định tuyến nó đến bộ chạy khác. Các
provider ref không phải OpenAI thuần túy vẫn đi theo đường nhà cung cấp thông
thường của chúng ở chế độ `auto`.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn, hãy
khởi động lại gateway để xóa các đăng ký hook gốc đã cũ. Xem
[Codex Computer Use](/vi/plugins/codex-computer-use#troubleshooting).

## Liên quan

- [Tham chiếu bộ chạy Codex](/vi/plugins/codex-harness-reference)
- [Thời gian chạy bộ chạy Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Thời gian chạy agent](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Plugin bộ chạy agent](/vi/plugins/sdk-agent-harness)
- [Hook Plugin](/vi/plugins/hooks)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Trạng thái](/vi/cli/status)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
