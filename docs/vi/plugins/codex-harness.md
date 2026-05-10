---
read_when:
    - Bạn muốn sử dụng harness app-server Codex được đóng gói kèm
    - Bạn cần các ví dụ về cấu hình harness Codex
    - Bạn muốn các bản triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác tử nhúng của OpenClaw thông qua bộ khung app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-10T19:42:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt agent OpenAI nhúng
thông qua Codex app-server thay vì PI harness tích hợp sẵn.

Dùng Codex harness khi bạn muốn Codex sở hữu phiên agent cấp thấp:
tiếp tục luồng gốc, tiếp tục công cụ gốc, compaction gốc, và
thực thi app-server. OpenClaw vẫn sở hữu các kênh chat, tệp phiên, chọn mô hình,
công cụ động OpenClaw, phê duyệt, phân phối media, và bản sao transcript hiển thị.

Thiết lập thông thường dùng các tham chiếu mô hình OpenAI chuẩn như `openai/gpt-5.5`.
Không cấu hình các tham chiếu mô hình `openai-codex/gpt-*`. `openai-codex` là nhà cung cấp hồ sơ xác thực
cho hồ sơ Codex OAuth hoặc Codex API-key, không phải tiền tố nhà cung cấp mô hình
cho cấu hình agent mới.

Để hiểu phần tách mô hình/nhà cung cấp/runtime rộng hơn, hãy bắt đầu với
[Runtime của agent](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, và Telegram,
Discord, Slack, hoặc kênh khác vẫn là bề mặt giao tiếp.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- Nếu cấu hình của bạn dùng `plugins.allow`, hãy bao gồm `codex`.
- Codex app-server `0.125.0` hoặc mới hơn. Plugin đi kèm quản lý một
  binary Codex app-server tương thích theo mặc định, nên các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến khởi động harness thông thường.
- Có xác thực Codex thông qua `openclaw models auth login --provider openai-codex`,
  tài khoản app-server trong thư mục home Codex của agent, hoặc hồ sơ xác thực Codex API-key
  rõ ràng.

Về thứ tự ưu tiên xác thực, cách ly môi trường, lệnh app-server tùy chỉnh, khám phá mô hình,
và tất cả trường cấu hình, xem
[Tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Khởi động nhanh

Phần lớn người dùng muốn Codex trong OpenClaw sẽ muốn đường dẫn này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, bật Plugin `codex` đi kèm, và dùng một
tham chiếu mô hình `openai/gpt-*` chuẩn.

Đăng nhập bằng Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Bật Plugin `codex` đi kèm và chọn một mô hình agent OpenAI:

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

Khởi động lại Gateway sau khi thay đổi cấu hình Plugin. Nếu một chat hiện có đã
có phiên, hãy dùng `/new` hoặc `/reset` trước khi kiểm thử thay đổi runtime để lượt
tiếp theo phân giải harness từ cấu hình hiện tại.

## Cấu hình

Cấu hình khởi động nhanh là cấu hình Codex harness khả dụng tối thiểu. Đặt các tùy chọn
Codex harness trong cấu hình OpenClaw, và chỉ dùng CLI cho xác thực Codex:

| Nhu cầu                                | Đặt                                                                | Vị trí                         |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| Bật harness                            | `plugins.entries.codex.enabled: true`                              | Cấu hình OpenClaw              |
| Giữ bản cài đặt Plugin trong allowlist | Bao gồm `codex` trong `plugins.allow`                              | Cấu hình OpenClaw              |
| Định tuyến lượt agent OpenAI qua Codex | `agents.defaults.model` hoặc `agents.list[].model` là `openai/gpt-*` | Cấu hình agent OpenClaw        |
| Đăng nhập bằng Codex OAuth             | `openclaw models auth login --provider openai-codex`               | Hồ sơ xác thực CLI             |
| Đóng khi Codex không khả dụng          | Provider hoặc model `agentRuntime.id: "codex"`                     | Cấu hình model/provider OpenClaw |
| Dùng lưu lượng OpenAI API trực tiếp    | Provider hoặc model `agentRuntime.id: "pi"` với xác thực OpenAI thông thường | Cấu hình model/provider OpenClaw |
| Điều chỉnh hành vi app-server          | `plugins.entries.codex.config.appServer.*`                         | Cấu hình Plugin Codex          |
| Bật ứng dụng Plugin Codex gốc          | `plugins.entries.codex.config.codexPlugins.*`                      | Cấu hình Plugin Codex          |
| Bật Codex Computer Use                 | `plugins.entries.codex.config.computerUse.*`                       | Cấu hình Plugin Codex          |

Dùng các tham chiếu mô hình `openai/gpt-*` cho lượt agent OpenAI được Codex hỗ trợ.
`openai-codex` chỉ là tên nhà cung cấp hồ sơ xác thực cho Codex OAuth và
hồ sơ Codex API-key. Không viết tham chiếu mô hình `openai-codex/gpt-*` mới.

Phần còn lại của trang này trình bày các biến thể phổ biến mà người dùng phải chọn:
hình dạng triển khai, định tuyến đóng khi lỗi, chính sách phê duyệt guardian, Plugin Codex
gốc, và Computer Use. Để xem danh sách tùy chọn đầy đủ, mặc định, enum, khám phá,
cách ly môi trường, timeout, và các trường truyền tải app-server, xem
[Tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Xác minh runtime Codex

Dùng `/status` trong chat nơi bạn kỳ vọng Codex. Một lượt agent OpenAI được Codex hỗ trợ
hiển thị:

```text
Runtime: OpenAI Codex
```

Sau đó kiểm tra trạng thái Codex app-server:

```text
/codex status
/codex models
```

`/codex status` báo cáo kết nối app-server, tài khoản, giới hạn tốc độ, máy chủ MCP,
và skills. `/codex models` liệt kê catalog Codex app-server trực tiếp cho
harness và tài khoản. Nếu `/status` gây bất ngờ, xem
[Khắc phục sự cố](#troubleshooting).

## Định tuyến và chọn mô hình

Giữ riêng tham chiếu provider và chính sách runtime:

- Dùng `openai/gpt-*` cho lượt agent OpenAI qua Codex.
- Không dùng `openai-codex/gpt-*` trong cấu hình. Chạy `openclaw doctor --fix` để
  sửa các tham chiếu cũ và ghim tuyến phiên đã lỗi thời.
- `agentRuntime.id: "codex"` là tùy chọn cho chế độ OpenAI tự động thông thường, nhưng hữu ích
  khi một triển khai phải đóng khi Codex không khả dụng.
- `agentRuntime.id: "pi"` đưa một provider hoặc model vào hành vi PI trực tiếp khi
  đó là chủ đích.
- `/codex ...` điều khiển các cuộc hội thoại Codex app-server gốc từ chat.
- ACP/acpx là một đường dẫn harness bên ngoài riêng biệt. Chỉ dùng khi người dùng yêu cầu
  ACP/acpx hoặc adapter harness bên ngoài.

Định tuyến lệnh phổ biến:

| Ý định người dùng                 | Dùng                                    |
| --------------------------------- | --------------------------------------- |
| Gắn chat hiện tại                 | `/codex bind [--cwd <path>]`            |
| Tiếp tục một luồng Codex hiện có  | `/codex resume <thread-id>`             |
| Liệt kê hoặc lọc luồng Codex      | `/codex threads [filter]`               |
| Chỉ gửi phản hồi Codex            | `/codex diagnostics [note]`             |
| Bắt đầu tác vụ ACP/acpx           | Lệnh phiên ACP/acpx, không phải `/codex` |

| Trường hợp sử dụng                                  | Cấu hình                                                         | Xác minh                                | Ghi chú                            |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc     | `openai/gpt-*` cộng với Plugin `codex` đã bật                    | `/status` hiển thị `Runtime: OpenAI Codex` | Đường dẫn khuyến nghị              |
| Đóng nếu Codex không khả dụng                       | Provider hoặc model `agentRuntime.id: "codex"`                   | Lượt thất bại thay vì fallback PI       | Dùng cho triển khai chỉ Codex      |
| Lưu lượng OpenAI API-key trực tiếp qua PI           | Provider hoặc model `agentRuntime.id: "pi"` và xác thực OpenAI thông thường | `/status` hiển thị runtime PI           | Chỉ dùng khi PI là chủ đích        |
| Cấu hình cũ                                         | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` viết lại nó     | Không viết cấu hình mới theo cách này |
| Adapter Codex ACP/acpx                              | ACP `sessions_spawn({ runtime: "acp" })`                         | Trạng thái tác vụ/phiên ACP             | Tách biệt với Codex harness gốc    |

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng `openai/gpt-*`
cho tuyến OpenAI thông thường và `codex/gpt-*` chỉ khi việc hiểu hình ảnh
nên chạy qua một lượt Codex app-server có giới hạn. Không dùng
`openai-codex/gpt-*`; doctor viết lại tiền tố cũ đó thành `openai/gpt-*`.

## Mẫu triển khai

### Triển khai Codex cơ bản

Dùng cấu hình khởi động nhanh khi tất cả lượt agent OpenAI nên dùng Codex theo
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

Hình dạng này giữ Claude làm agent mặc định và thêm một agent Codex có tên:

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

Với cấu hình này, agent `main` dùng đường dẫn provider thông thường của nó và agent
`codex` dùng Codex app-server.

### Triển khai Codex đóng khi lỗi

Đối với lượt agent OpenAI, `openai/gpt-*` đã phân giải thành Codex khi
Plugin đi kèm có sẵn. Thêm chính sách runtime rõ ràng khi bạn muốn một quy tắc
đóng khi lỗi được ghi ra:

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

Khi Codex bị ép dùng, OpenClaw thất bại sớm nếu Plugin Codex bị tắt,
app-server quá cũ, hoặc app-server không thể khởi động.

## Chính sách app-server

Theo mặc định, Plugin khởi động binary Codex do OpenClaw quản lý cục bộ với truyền tải stdio.
Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một executable
khác. Chỉ dùng truyền tải WebSocket khi app-server đã
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

Các phiên app-server stdio cục bộ mặc định theo tư thế toán tử cục bộ đáng tin cậy:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Nếu yêu cầu Codex cục bộ không cho phép
tư thế YOLO ngầm định đó, OpenClaw chọn quyền guardian được cho phép thay thế.

Dùng chế độ guardian khi bạn muốn Codex tự động rà soát gốc trước khi thoát sandbox
hoặc cấp thêm quyền:

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

Chế độ guardian mở rộng thành phê duyệt Codex app-server, thường là
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, và
`sandbox: "workspace-write"` khi các yêu cầu cục bộ cho phép những giá trị đó.

Về mọi trường app-server, thứ tự xác thực, cách ly môi trường, khám phá, và
hành vi timeout, xem [Tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Lệnh và chẩn đoán

Plugin đi kèm đăng ký `/codex` làm lệnh slash trên mọi kênh
hỗ trợ lệnh văn bản OpenClaw.

Các dạng phổ biến:

- `/codex status` kiểm tra kết nối máy chủ ứng dụng, mô hình, tài khoản, giới hạn tốc độ,
  máy chủ MCP và kỹ năng.
- `/codex models` liệt kê các mô hình máy chủ ứng dụng Codex đang hoạt động.
- `/codex threads [filter]` liệt kê các luồng máy chủ ứng dụng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một
  luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex thu gọn luồng đã gắn.
- `/codex review` bắt đầu quy trình đánh giá gốc của Codex cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi Codex cho
  luồng đã gắn.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê các kỹ năng của máy chủ ứng dụng Codex.

Với hầu hết báo cáo hỗ trợ, hãy bắt đầu bằng `/diagnostics [note]` trong cuộc trò chuyện
nơi lỗi xảy ra. Lệnh này tạo một báo cáo chẩn đoán Gateway và, với các phiên harness
Codex, yêu cầu phê duyệt để gửi gói phản hồi Codex liên quan.
Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết mô hình quyền riêng tư và hành vi
trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho luồng hiện đang được gắn mà không có toàn bộ gói chẩn đoán Gateway.

### Kiểm tra các luồng Codex cục bộ

Cách nhanh nhất để kiểm tra một lần chạy Codex lỗi thường là mở trực tiếp
luồng Codex gốc:

```bash
codex resume <thread-id>
```

Lấy id luồng từ phản hồi `/diagnostics` đã hoàn tất, `/codex binding`, hoặc
`/codex threads [filter]`.

Để biết cơ chế tải lên và ranh giới chẩn đoán ở cấp runtime, xem
[Runtime harness Codex](/vi/plugins/codex-harness-runtime#codex-feedback-upload).

Xác thực được chọn theo thứ tự này:

1. Hồ sơ xác thực Codex OpenClaw tường minh cho agent.
2. Tài khoản hiện có của máy chủ ứng dụng trong thư mục gốc Codex của agent đó.
3. Chỉ với các lần khởi chạy máy chủ ứng dụng stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản máy chủ ứng dụng và xác thực OpenAI
   vẫn được yêu cầu.

Khi OpenClaw thấy hồ sơ xác thực Codex kiểu thuê bao ChatGPT, nó sẽ xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều đó
giữ các khóa API cấp Gateway khả dụng cho embedding hoặc các mô hình OpenAI trực tiếp
mà không vô tình khiến các lượt máy chủ ứng dụng Codex gốc được tính phí qua API.
Hồ sơ khóa API Codex tường minh và phương án dự phòng khóa env stdio cục bộ dùng đăng nhập
máy chủ ứng dụng thay vì env tiến trình con kế thừa. Kết nối máy chủ ứng dụng WebSocket
không nhận phương án dự phòng khóa API env Gateway; hãy dùng hồ sơ xác thực tường minh hoặc
tài khoản riêng của máy chủ ứng dụng từ xa.

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con máy chủ ứng dụng Codex được sinh ra.

Công cụ động Codex mặc định dùng cách tải `searchable`. OpenClaw không hiển thị
các công cụ động trùng với thao tác workspace gốc của Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, và `update_plan`. Các công cụ tích hợp OpenClaw
còn lại như nhắn tin, phiên, media, cron, trình duyệt, nút,
gateway, `heartbeat_respond`, và `web_search` có sẵn qua tìm kiếm công cụ Codex
trong namespace `openclaw`, giúp ngữ cảnh mô hình ban đầu nhỏ hơn.
`sessions_yield` và phản hồi nguồn chỉ dùng công cụ nhắn tin vẫn trực tiếp vì đó
là các hợp đồng điều khiển lượt. Hướng dẫn cộng tác Heartbeat yêu cầu Codex
tìm `heartbeat_respond` trước khi kết thúc một lượt heartbeat khi công cụ chưa
được tải sẵn.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối đến một máy chủ ứng dụng Codex
tùy chỉnh không thể tìm kiếm các công cụ động được trì hoãn hoặc khi gỡ lỗi toàn bộ
payload công cụ.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định       | Ý nghĩa                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Dùng `"direct"` để đặt công cụ động OpenClaw trực tiếp vào ngữ cảnh công cụ Codex ban đầu. |
| `codexDynamicToolsExclude` | `[]`           | Tên công cụ động OpenClaw bổ sung cần bỏ qua khỏi các lượt máy chủ ứng dụng Codex.              |
| `codexPlugins`             | tắt            | Hỗ trợ Plugin/ứng dụng Codex gốc cho các plugin tuyển chọn đã được di chuyển, cài đặt từ nguồn.           |

Các trường `appServer` được hỗ trợ:

| Trường                        | Mặc định                                               | Ý nghĩa                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                              | `"stdio"` sinh Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                             |
| `command`                     | nhị phân Codex được quản lý                            | Tệp thực thi cho transport stdio. Để trống để dùng nhị phân được quản lý; chỉ đặt khi cần ghi đè tường minh.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho transport stdio.                                                                                                                                                                                                       |
| `url`                         | chưa đặt                                               | URL máy chủ ứng dụng WebSocket.                                                                                                                                                                                                            |
| `authToken`                   | chưa đặt                                               | Token Bearer cho transport WebSocket.                                                                                                                                                                                                |
| `headers`                     | `{}`                                                   | Header WebSocket bổ sung.                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình máy chủ ứng dụng stdio được sinh ra sau khi OpenClaw dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cơ chế cô lập Codex theo từng agent của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`            | `60000`                                                | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển máy chủ ứng dụng.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Khoảng im lặng sau một yêu cầu máy chủ ứng dụng Codex trong phạm vi lượt trong khi OpenClaw chờ `turn/completed`. Tăng giá trị này cho các pha tổng hợp chậm sau công cụ hoặc chỉ trạng thái.                                                                  |
| `mode`                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc được guardian đánh giá. Yêu cầu stdio cục bộ bỏ qua `danger-full-access`, phê duyệt `never`, hoặc reviewer `user` sẽ khiến mặc định ngầm định là guardian.                                                |
| `approvalPolicy`              | `"never"` hoặc một chính sách phê duyệt guardian được phép       | Chính sách phê duyệt Codex gốc được gửi tới bắt đầu/tiếp tục/lượt luồng. Mặc định guardian ưu tiên `"on-request"` khi được phép.                                                                                                                 |
| `sandbox`                     | `"danger-full-access"` hoặc một sandbox guardian được phép  | Chế độ sandbox Codex gốc được gửi tới bắt đầu/tiếp tục luồng. Mặc định guardian ưu tiên `"workspace-write"` khi được phép, nếu không thì `"read-only"`.                                                                                           |
| `approvalsReviewer`           | `"user"` hoặc một reviewer guardian được phép               | Dùng `"auto_review"` để cho Codex đánh giá các lời nhắc phê duyệt gốc khi được phép, nếu không thì `guardian_subagent` hoặc `user`. `guardian_subagent` vẫn là bí danh cũ.                                                                   |
| `serviceTier`                 | chưa đặt                                               | Bậc dịch vụ máy chủ ứng dụng Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý linh hoạt, `null` xóa ghi đè, và `"fast"` cũ được chấp nhận như `"priority"`.                                      |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: các yêu cầu Codex `item/tool/call` mặc định dùng watchdog
OpenClaw 30 giây. Đối số `timeoutMs` dương theo từng lệnh gọi sẽ kéo dài
hoặc rút ngắn ngân sách công cụ cụ thể đó. Công cụ `image_generate` cũng dùng
`agents.defaults.imageGenerationModel.timeoutMs` khi lệnh gọi công cụ không
cung cấp thời gian chờ riêng, và công cụ `image` cho hiểu media dùng
`tools.media.image.timeoutSeconds` hoặc mặc định media 60 giây. Ngân sách công cụ động
được giới hạn ở 600000 ms. Khi hết thời gian chờ, OpenClaw hủy tín hiệu công cụ
ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex để lượt
có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu máy chủ ứng dụng Codex trong phạm vi lượt,
harness cũng kỳ vọng Codex kết thúc lượt gốc bằng `turn/completed`. Nếu
máy chủ ứng dụng im lặng trong `appServer.turnCompletionIdleTimeoutMs` sau phản hồi đó,
OpenClaw sẽ cố gắng hết mức để ngắt lượt Codex, ghi lại thời gian chờ chẩn đoán,
và giải phóng lane phiên OpenClaw để các tin nhắn trò chuyện tiếp theo không bị xếp hàng
sau một lượt gốc đã cũ. Bất kỳ thông báo chưa kết thúc nào cho cùng lượt,
bao gồm `rawResponseItem/completed`, sẽ tắt watchdog ngắn đó
vì Codex đã chứng minh lượt vẫn còn hoạt động; watchdog kết thúc dài hơn
tiếp tục bảo vệ các lượt thực sự bị kẹt. Chẩn đoán thời gian chờ bao gồm
phương thức thông báo máy chủ ứng dụng gần nhất và, với các mục phản hồi assistant thô,
loại mục, vai trò, id, và bản xem trước văn bản assistant có giới hạn.

Ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị loại bỏ. Thay vào đó, hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` để kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi plugin trong
cùng tệp đã được rà soát với phần còn lại của thiết lập harness Codex.

## Plugin Codex gốc

Hỗ trợ plugin Codex gốc sử dụng các năng lực ứng dụng và plugin riêng của
máy chủ ứng dụng Codex trong cùng luồng Codex với lượt harness OpenClaw.
OpenClaw không chuyển đổi các plugin Codex thành các công cụ động OpenClaw
`codex_plugin_*` tổng hợp.

`codexPlugins` chỉ ảnh hưởng đến các phiên chọn harness Codex gốc. Nó không
có hiệu lực với các lần chạy PI, các lần chạy nhà cung cấp OpenAI thông thường,
các liên kết hội thoại ACP, hoặc các harness khác.

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

Cấu hình ứng dụng của luồng được tính khi OpenClaw thiết lập một phiên harness
Codex hoặc thay thế một liên kết luồng Codex đã cũ. Nó không được tính lại ở
mỗi lượt. Sau khi thay đổi `codexPlugins`, hãy dùng `/new`, `/reset`, hoặc
khởi động lại gateway để các phiên harness Codex trong tương lai bắt đầu với
tập ứng dụng đã cập nhật.

Để biết điều kiện đủ để di chuyển, kiểm kê ứng dụng, chính sách hành động phá
hủy, elicitations, và chẩn đoán plugin gốc, xem
[Plugin Codex gốc](/vi/plugins/codex-native-plugins).

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Sử dụng máy tính Codex](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không đóng gói ứng dụng điều khiển máy tính để bàn
hoặc tự thực thi các hành động trên máy tính để bàn. Nó chuẩn bị máy chủ ứng
dụng Codex, xác minh rằng máy chủ MCP `computer-use` có sẵn, rồi để Codex sở
hữu các lệnh gọi công cụ MCP gốc trong các lượt ở chế độ Codex.

## Ranh giới thời gian chạy

Harness Codex chỉ thay đổi trình thực thi tác tử nhúng cấp thấp.

- Các công cụ động OpenClaw được hỗ trợ. Codex yêu cầu OpenClaw thực thi các
  công cụ đó, nên OpenClaw vẫn nằm trong đường dẫn thực thi.
- Các công cụ shell, patch, MCP, và công cụ ứng dụng gốc của Codex do Codex sở hữu.
  OpenClaw có thể quan sát hoặc chặn một số sự kiện gốc được chọn thông qua
  relay được hỗ trợ, nhưng nó không viết lại các đối số công cụ gốc.
- Codex sở hữu Compaction gốc. OpenClaw giữ một bản sao transcript cho lịch sử
  kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc harness
  trong tương lai.
- Tạo phương tiện, hiểu phương tiện, TTS, phê duyệt, và đầu ra công cụ nhắn tin
  tiếp tục đi qua các thiết lập nhà cung cấp/mô hình OpenClaw tương ứng.
- `tool_result_persist` áp dụng cho kết quả công cụ transcript do OpenClaw sở hữu,
  không áp dụng cho bản ghi kết quả công cụ gốc của Codex.

Để biết các lớp hook, bề mặt V1 được hỗ trợ, xử lý quyền gốc, điều hướng hàng đợi,
cơ chế tải phản hồi Codex lên, và chi tiết Compaction, xem
[Thời gian chạy harness Codex](/vi/plugins/codex-harness-runtime).

## Khắc phục sự cố

**Codex không xuất hiện như một nhà cung cấp `/model` thông thường:** điều đó
đúng như kỳ vọng với các cấu hình mới. Chọn một mô hình `openai/gpt-*`, bật
`plugins.entries.codex.enabled`, và kiểm tra xem `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** hãy đảm bảo ref mô hình là
`openai/gpt-*` trên nhà cung cấp OpenAI chính thức và plugin Codex đã được
cài đặt và bật. Nếu bạn cần bằng chứng nghiêm ngặt khi kiểm thử, đặt
`agentRuntime.id: "codex"` ở nhà cung cấp hoặc mô hình. Thời gian chạy Codex
bị ép buộc sẽ thất bại thay vì quay về PI.

**Cấu hình `openai-codex/*` cũ vẫn còn:** chạy `openclaw doctor --fix`.
Doctor viết lại các ref mô hình cũ thành `openai/*`, xóa các ghim thời gian
chạy phiên cũ và toàn bộ tác tử, đồng thời giữ nguyên các override auth-profile
hiện có.

**Máy chủ ứng dụng bị từ chối:** dùng máy chủ ứng dụng Codex `0.125.0` hoặc
mới hơn. Các bản prerelease cùng phiên bản hoặc phiên bản có hậu tố build như
`0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì OpenClaw kiểm tra mức
sàn giao thức ổn định `0.125.0`.

**`/codex status` không thể kết nối:** kiểm tra plugin `codex` đi kèm đã được
bật, `plugins.allow` bao gồm nó khi allowlist được cấu hình, và mọi
`appServer.command`, `url`, `authToken`, hoặc header tùy chỉnh đều hợp lệ.

**Khám phá mô hình chậm:** giảm
`plugins.entries.codex.config.discovery.timeoutMs` hoặc tắt khám phá. Xem
[Tham chiếu harness Codex](/vi/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`,
`authToken`, header, và máy chủ ứng dụng từ xa có dùng cùng phiên bản giao thức
máy chủ ứng dụng Codex hay không.

**Một mô hình không phải Codex dùng PI:** điều đó đúng như kỳ vọng trừ khi
chính sách thời gian chạy của nhà cung cấp hoặc mô hình định tuyến nó sang một
harness khác. Các ref nhà cung cấp không phải OpenAI thông thường vẫn ở đường
dẫn nhà cung cấp bình thường của chúng trong chế độ `auto`.

**Sử dụng máy tính đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, hãy dùng `/new` hoặc `/reset`; nếu vẫn còn,
khởi động lại gateway để xóa các đăng ký hook gốc cũ. Xem
[Sử dụng máy tính Codex](/vi/plugins/codex-computer-use#troubleshooting).

## Liên quan

- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Thời gian chạy harness Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Sử dụng máy tính Codex](/vi/plugins/codex-computer-use)
- [Thời gian chạy tác tử](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Hook plugin](/vi/plugins/hooks)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Trạng thái](/vi/cli/status)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
