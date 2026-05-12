---
read_when:
    - Bạn muốn sử dụng harness app-server Codex đi kèm
    - Bạn cần các ví dụ cấu hình bộ chạy Codex
    - Bạn muốn các bản triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt tác tử nhúng OpenClaw thông qua bộ harness app-server Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-12T08:45:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt agent OpenAI nhúng
thông qua Codex app-server thay vì PI harness tích hợp sẵn.

Dùng Codex harness khi bạn muốn Codex sở hữu phiên agent cấp thấp:
tiếp tục thread gốc, tiếp tục tool gốc, Compaction gốc và
thực thi app-server. OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn model,
các tool động của OpenClaw, phê duyệt, phân phối media và bản sao transcript hiển thị.

Thiết lập thông thường dùng các model ref OpenAI chuẩn như `openai/gpt-5.5`.
Đừng cấu hình model ref `openai-codex/gpt-*`. Đặt thứ tự xác thực agent OpenAI
trong `auth.order.openai`; các profile `openai-codex:*` cũ hơn và
mục `auth.order.openai-codex` vẫn được hỗ trợ cho các bản cài đặt hiện có.

OpenClaw khởi động các thread Codex app-server với chế độ code gốc của Codex và
bật chỉ-code-mode. Điều đó giữ các tool động OpenClaw có thể trì hoãn/tìm kiếm
bên trong bề mặt thực thi code và tìm kiếm tool riêng của Codex thay vì thêm một
wrapper tìm kiếm tool kiểu PI lên trên Codex.

Để biết phần tách rộng hơn giữa model/provider/runtime, hãy bắt đầu với
[Agent runtimes](/vi/concepts/agent-runtimes). Phiên bản ngắn là:
`openai/gpt-5.5` là model ref, `codex` là runtime, và Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- Nếu cấu hình của bạn dùng `plugins.allow`, hãy bao gồm `codex`.
- Codex app-server `0.125.0` hoặc mới hơn. Plugin đi kèm mặc định quản lý một
  binary Codex app-server tương thích, vì vậy các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến khởi động harness thông thường.
- Xác thực Codex có sẵn thông qua `openclaw models auth login --provider openai-codex`,
  tài khoản app-server trong Codex home của agent, hoặc profile xác thực Codex API-key
  rõ ràng.

Để biết thứ tự ưu tiên xác thực, cách ly môi trường, lệnh app-server tùy chỉnh, khám phá model
và tất cả trường cấu hình, xem
[Codex harness reference](/vi/plugins/codex-harness-reference).

## Bắt đầu nhanh

Hầu hết người dùng muốn dùng Codex trong OpenClaw sẽ muốn đường dẫn này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, bật Plugin `codex` đi kèm và dùng một
model ref `openai/gpt-*` chuẩn.

Đăng nhập bằng Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Bật Plugin `codex` đi kèm và chọn một model agent OpenAI:

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

Khởi động lại Gateway sau khi thay đổi cấu hình Plugin. Nếu một cuộc trò chuyện hiện có
đã có phiên, hãy dùng `/new` hoặc `/reset` trước khi kiểm thử thay đổi runtime để lượt
tiếp theo phân giải harness từ cấu hình hiện tại.

## Cấu hình

Cấu hình bắt đầu nhanh là cấu hình Codex harness khả dụng tối thiểu. Đặt các tùy chọn Codex
harness trong cấu hình OpenClaw, và chỉ dùng CLI cho xác thực Codex:

| Nhu cầu                                | Đặt                                                                              | Nơi                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Bật harness                            | `plugins.entries.codex.enabled: true`                                            | Cấu hình OpenClaw                  |
| Giữ một bản cài Plugin trong allowlist | Bao gồm `codex` trong `plugins.allow`                                            | Cấu hình OpenClaw                  |
| Định tuyến lượt agent OpenAI qua Codex | `agents.defaults.model` hoặc `agents.list[].model` là `openai/gpt-*`             | Cấu hình agent OpenClaw            |
| Đăng nhập bằng Codex OAuth             | `openclaw models auth login --provider openai-codex`                             | Profile xác thực CLI               |
| Thêm API-key dự phòng cho lượt chạy Codex | Profile API-key `openai:*` được liệt kê sau xác thực đăng ký trong `auth.order.openai` | Profile xác thực CLI + cấu hình OpenClaw |
| Đóng lỗi khi Codex không khả dụng      | Provider hoặc model `agentRuntime.id: "codex"`                                   | Cấu hình model/provider OpenClaw   |
| Dùng lưu lượng OpenAI API trực tiếp    | Provider hoặc model `agentRuntime.id: "pi"` với xác thực OpenAI thông thường     | Cấu hình model/provider OpenClaw   |
| Tinh chỉnh hành vi app-server          | `plugins.entries.codex.config.appServer.*`                                       | Cấu hình Plugin Codex              |
| Bật app Plugin Codex gốc               | `plugins.entries.codex.config.codexPlugins.*`                                    | Cấu hình Plugin Codex              |
| Bật Codex Computer Use                 | `plugins.entries.codex.config.computerUse.*`                                     | Cấu hình Plugin Codex              |

Dùng model ref `openai/gpt-*` cho các lượt agent OpenAI được Codex hỗ trợ. Ưu tiên
`auth.order.openai` cho thứ tự đăng ký-trước/API-key-dự-phòng. Các profile xác thực
`openai-codex:*` hiện có và `auth.order.openai-codex` vẫn hợp lệ, nhưng
đừng viết model ref `openai-codex/gpt-*` mới.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Ở dạng đó, cả hai profile vẫn chạy qua Codex cho các lượt agent
`openai/gpt-*`. API key chỉ là phương án dự phòng xác thực, không phải yêu cầu chuyển sang PI hoặc
OpenAI Responses thuần.

Phần còn lại của trang này trình bày các biến thể phổ biến mà người dùng phải chọn:
hình thức triển khai, định tuyến đóng lỗi, chính sách phê duyệt guardian, Plugin Codex
gốc và Computer Use. Để biết danh sách tùy chọn đầy đủ, mặc định, enum, khám phá,
cách ly môi trường, timeout và các trường transport app-server, xem
[Codex harness reference](/vi/plugins/codex-harness-reference).

## Xác minh runtime Codex

Dùng `/status` trong cuộc trò chuyện nơi bạn mong đợi Codex. Một lượt agent OpenAI
được Codex hỗ trợ hiển thị:

```text
Runtime: OpenAI Codex
```

Sau đó kiểm tra trạng thái Codex app-server:

```text
/codex status
/codex models
```

`/codex status` báo cáo kết nối app-server, tài khoản, giới hạn tốc độ, MCP
servers và Skills. `/codex models` liệt kê catalog Codex app-server trực tiếp cho
harness và tài khoản. Nếu `/status` gây bất ngờ, xem
[Khắc phục sự cố](#troubleshooting).

## Định tuyến và lựa chọn model

Giữ provider ref và chính sách runtime tách biệt:

- Dùng `openai/gpt-*` cho các lượt agent OpenAI qua Codex.
- Đừng dùng `openai-codex/gpt-*` trong cấu hình. Chạy `openclaw doctor --fix` để
  sửa các ref cũ và route pin phiên đã lỗi thời.
- `agentRuntime.id: "codex"` là tùy chọn cho chế độ OpenAI tự động thông thường, nhưng hữu ích
  khi một triển khai cần đóng lỗi nếu Codex không khả dụng.
- `agentRuntime.id: "pi"` đưa provider hoặc model vào hành vi PI trực tiếp khi
  đó là chủ ý.
- `/codex ...` điều khiển các cuộc trò chuyện Codex app-server gốc từ chat.
- ACP/acpx là một đường dẫn harness bên ngoài riêng biệt. Chỉ dùng nó khi người dùng yêu cầu
  ACP/acpx hoặc adapter harness bên ngoài.

Định tuyến lệnh phổ biến:

| Ý định người dùng               | Dùng                                    |
| ------------------------------- | --------------------------------------- |
| Gắn cuộc trò chuyện hiện tại     | `/codex bind [--cwd <path>]`            |
| Tiếp tục thread Codex hiện có    | `/codex resume <thread-id>`             |
| Liệt kê hoặc lọc thread Codex    | `/codex threads [filter]`               |
| Chỉ gửi phản hồi Codex           | `/codex diagnostics [note]`             |
| Bắt đầu tác vụ ACP/acpx          | Lệnh phiên ACP/acpx, không phải `/codex` |

| Trường hợp sử dụng                                  | Cấu hình                                                         | Xác minh                                | Ghi chú                            |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc      | `openai/gpt-*` cộng với Plugin `codex` đã bật                    | `/status` hiển thị `Runtime: OpenAI Codex` | Đường dẫn được khuyến nghị         |
| Đóng lỗi nếu Codex không khả dụng                    | Provider hoặc model `agentRuntime.id: "codex"`                   | Lượt chạy lỗi thay vì fallback PI       | Dùng cho triển khai chỉ Codex      |
| Lưu lượng OpenAI API-key trực tiếp qua PI            | Provider hoặc model `agentRuntime.id: "pi"` và xác thực OpenAI thông thường | `/status` hiển thị runtime PI           | Chỉ dùng khi PI là chủ ý           |
| Cấu hình cũ                                          | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` viết lại nó     | Đừng viết cấu hình mới theo cách này |
| Adapter Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Trạng thái tác vụ/phiên ACP             | Tách biệt với Codex harness gốc    |

`agents.defaults.imageModel` tuân theo cùng cách tách prefix. Dùng `openai/gpt-*`
cho tuyến OpenAI thông thường và `codex/gpt-*` chỉ khi hiểu hình ảnh
cần chạy qua một lượt Codex app-server có giới hạn. Đừng dùng
`openai-codex/gpt-*`; doctor viết lại prefix cũ đó thành `openai/gpt-*`.

## Mẫu triển khai

### Triển khai Codex cơ bản

Dùng cấu hình bắt đầu nhanh khi tất cả lượt agent OpenAI nên dùng Codex theo
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

Dạng này giữ Claude làm agent mặc định và thêm một agent Codex có tên:

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

### Triển khai Codex đóng lỗi

Đối với các lượt agent OpenAI, `openai/gpt-*` đã phân giải sang Codex khi
Plugin đi kèm khả dụng. Thêm chính sách runtime rõ ràng khi bạn muốn một quy tắc
đóng lỗi được ghi ra:

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

Khi Codex bị ép dùng, OpenClaw lỗi sớm nếu Plugin Codex bị tắt, app-server
quá cũ hoặc app-server không thể khởi động.

## Chính sách app-server

Theo mặc định, Plugin khởi động binary Codex do OpenClaw quản lý cục bộ với transport
stdio. Chỉ đặt `appServer.command` khi bạn cố ý muốn chạy một
executable khác. Chỉ dùng transport WebSocket khi app-server đã
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

Các phiên app-server stdio cục bộ mặc định dùng tư thế toán tử cục bộ đáng tin cậy:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` và
`sandbox: "danger-full-access"`. Nếu các yêu cầu Codex cục bộ không cho phép
tư thế YOLO ngầm định đó, OpenClaw sẽ chọn quyền guardian được phép thay thế.
Khi sandbox OpenClaw đang hoạt động cho phiên, OpenClaw thu hẹp Codex
`danger-full-access` thành Codex `workspace-write` để các lượt code-mode Codex
gốc ở lại trong workspace được sandbox.

Dùng chế độ guardian khi bạn muốn Codex tự động rà soát gốc trước khi thoát
sandbox hoặc cấp thêm quyền:

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

Chế độ guardian mở rộng thành các phê duyệt app-server Codex, thường là
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` và
`sandbox: "workspace-write"` khi các yêu cầu cục bộ cho phép những giá trị đó.

Để biết mọi trường app-server, thứ tự xác thực, cô lập môi trường, phát hiện và
hành vi timeout, xem [tham chiếu harness Codex](/vi/plugins/codex-harness-reference).

## Lệnh và chẩn đoán

Plugin đi kèm đăng ký `/codex` làm lệnh slash trên mọi kênh hỗ trợ lệnh văn bản
OpenClaw.

Các dạng thường dùng:

- `/codex status` kiểm tra kết nối app-server, mô hình, tài khoản, giới hạn tốc độ,
  máy chủ MCP và skills.
- `/codex models` liệt kê các mô hình app-server Codex trực tiếp.
- `/codex threads [filter]` liệt kê các luồng app-server Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một luồng Codex
  hiện có.
- `/codex compact` yêu cầu app-server Codex compact luồng đã gắn.
- `/codex review` khởi động rà soát Codex gốc cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi Codex cho luồng đã gắn.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP app-server Codex.
- `/codex skills` liệt kê skills app-server Codex.

Với hầu hết báo cáo hỗ trợ, hãy bắt đầu bằng `/diagnostics [note]` trong cuộc
trò chuyện nơi lỗi xảy ra. Lệnh này tạo một báo cáo chẩn đoán Gateway và, với
các phiên harness Codex, yêu cầu phê duyệt để gửi gói phản hồi Codex liên quan.
Xem [xuất chẩn đoán](/vi/gateway/diagnostics) để biết mô hình quyền riêng tư và
hành vi trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex
lên cho luồng hiện đang gắn mà không có toàn bộ gói chẩn đoán Gateway.

### Kiểm tra các luồng Codex cục bộ

Cách nhanh nhất để kiểm tra một lần chạy Codex lỗi thường là mở trực tiếp luồng
Codex gốc:

```bash
codex resume <thread-id>
```

Lấy thread id từ phản hồi `/diagnostics` đã hoàn tất, `/codex binding` hoặc
`/codex threads [filter]`.

Để biết cơ chế tải lên và ranh giới chẩn đoán ở cấp runtime, xem
[runtime harness Codex](/vi/plugins/codex-harness-runtime#codex-feedback-upload).

Xác thực được chọn theo thứ tự này:

1. Các hồ sơ xác thực OpenAI có thứ tự cho agent, ưu tiên trong
   `auth.order.openai`. Các id hồ sơ `openai-codex:*` hiện có vẫn hợp lệ.
2. Tài khoản hiện có của app-server trong Codex home của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và vẫn cần xác thực OpenAI.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu thuê bao ChatGPT, OpenClaw xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được spawn. Điều
đó giữ các API key cấp Gateway khả dụng cho embedding hoặc mô hình OpenAI trực
tiếp mà không vô tình khiến các lượt app-server Codex gốc bị tính phí qua API.
Các hồ sơ API-key Codex tường minh và cơ chế fallback env-key stdio cục bộ dùng
đăng nhập app-server thay vì kế thừa env của tiến trình con. Kết nối app-server
WebSocket không nhận fallback API-key env Gateway; hãy dùng hồ sơ xác thực tường
minh hoặc tài khoản riêng của app-server từ xa.

Nếu hồ sơ thuê bao chạm giới hạn sử dụng Codex, OpenClaw ghi lại thời điểm đặt
lại khi Codex báo cáo và thử hồ sơ xác thực kế tiếp theo thứ tự cho cùng lần
chạy Codex. Khi thời điểm đặt lại đi qua, hồ sơ thuê bao lại đủ điều kiện mà
không thay đổi mô hình `openai/gpt-*` đã chọn hoặc runtime Codex.

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex được spawn.

Công cụ động Codex mặc định dùng tải `searchable`. OpenClaw không hiển thị các
công cụ động trùng lặp với thao tác workspace gốc của Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` và `update_plan`. Các công cụ tích hợp
OpenClaw còn lại như nhắn tin, phiên, media, cron, trình duyệt, node, gateway,
`heartbeat_respond` và `web_search` có sẵn thông qua tìm kiếm công cụ Codex dưới
namespace `openclaw`, giúp ngữ cảnh mô hình ban đầu nhỏ hơn.
`sessions_yield` và các phản hồi nguồn chỉ dành cho công cụ tin nhắn vẫn trực
tiếp vì đó là các hợp đồng điều khiển lượt. Hướng dẫn cộng tác Heartbeat bảo
Codex tìm `heartbeat_respond` trước khi kết thúc một lượt heartbeat khi công cụ
chưa được tải.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối đến app-server Codex
tùy chỉnh không thể tìm kiếm công cụ động trì hoãn hoặc khi gỡ lỗi toàn bộ
payload công cụ.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định       | Ý nghĩa                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Dùng `"direct"` để đưa công cụ động OpenClaw trực tiếp vào ngữ cảnh công cụ Codex ban đầu. |
| `codexDynamicToolsExclude` | `[]`           | Tên công cụ động OpenClaw bổ sung cần bỏ khỏi các lượt app-server Codex.                 |
| `codexPlugins`             | tắt            | Hỗ trợ Plugin/app Codex gốc cho các Plugin tuyển chọn được cài từ nguồn đã di chuyển.    |

Các trường `appServer` được hỗ trợ:

| Trường                        | Mặc định                                               | Ý nghĩa                                                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` spawn Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                  |
| `command`                     | nhị phân Codex được quản lý                            | Tệp thực thi cho transport stdio. Để trống để dùng nhị phân được quản lý; chỉ đặt khi cần ghi đè tường minh.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho transport stdio.                                                                                                                                                                                                              |
| `url`                         | chưa đặt                                               | URL app-server WebSocket.                                                                                                                                                                                                                |
| `authToken`                   | chưa đặt                                               | Bearer token cho transport WebSocket.                                                                                                                                                                                                    |
| `headers`                     | `{}`                                                   | Header WebSocket bổ sung.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được spawn sau khi OpenClaw xây dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cơ chế cô lập Codex theo agent của OpenClaw khi khởi chạy cục bộ. |
| `requestTimeoutMs`            | `60000`                                                | Timeout cho các lệnh gọi control-plane app-server.                                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Cửa sổ yên lặng sau một yêu cầu app-server Codex theo phạm vi lượt trong khi OpenClaw chờ `turn/completed`. Tăng giá trị này cho các pha tổng hợp sau công cụ hoặc chỉ trạng thái bị chậm.                                                |
| `mode`                        | `"yolo"` trừ khi các yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc thực thi được guardian rà soát. Các yêu cầu stdio cục bộ bỏ qua `danger-full-access`, phê duyệt `never` hoặc reviewer `user` sẽ làm mặc định ngầm định trở thành guardian.                                  |
| `approvalPolicy`              | `"never"` hoặc một chính sách phê duyệt guardian được phép | Chính sách phê duyệt Codex gốc được gửi tới thread start/resume/turn. Mặc định guardian ưu tiên `"on-request"` khi được phép.                                                                                                           |
| `sandbox`                     | `"danger-full-access"` hoặc một sandbox guardian được phép | Chế độ sandbox Codex gốc được gửi tới thread start/resume. Mặc định guardian ưu tiên `"workspace-write"` khi được phép, nếu không thì `"read-only"`. Khi sandbox OpenClaw đang hoạt động, `danger-full-access` được thu hẹp thành `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` hoặc một reviewer guardian được phép          | Dùng `"auto_review"` để Codex rà soát prompt phê duyệt gốc khi được phép, nếu không thì `guardian_subagent` hoặc `user`. `guardian_subagent` vẫn là alias cũ.                                                                            |
| `serviceTier`                 | chưa đặt                                               | Bậc dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến fast-mode, `"flex"` yêu cầu xử lý flex, `null` xóa ghi đè và `"fast"` cũ được chấp nhận như `"priority"`.                                                            |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: các yêu cầu `item/tool/call` của Codex mặc định
dùng watchdog 30 giây của OpenClaw. Đối số `timeoutMs` dương cho từng lệnh gọi
sẽ kéo dài hoặc rút ngắn ngân sách của công cụ cụ thể đó. Công cụ `image_generate`
cũng dùng `agents.defaults.imageGenerationModel.timeoutMs` khi lệnh gọi công cụ
không cung cấp timeout riêng, và công cụ `image` để hiểu nội dung phương tiện
dùng `tools.media.image.timeoutSeconds` hoặc mặc định phương tiện 60 giây của nó.
Ngân sách công cụ động bị giới hạn ở 600000 ms. Khi timeout, OpenClaw hủy tín
hiệu công cụ ở nơi được hỗ trợ và trả về một phản hồi công cụ động thất bại cho
Codex để lượt có thể tiếp tục thay vì để phiên kẹt ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server theo phạm vi lượt của Codex,
harness cũng kỳ vọng Codex kết thúc lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong `appServer.turnCompletionIdleTimeoutMs` sau phản hồi đó,
OpenClaw sẽ cố gắng hết mức để ngắt lượt Codex, ghi lại timeout chẩn đoán, và
giải phóng làn phiên OpenClaw để các tin nhắn trò chuyện tiếp theo không bị xếp
hàng sau một lượt gốc đã cũ. Bất kỳ thông báo chưa kết thúc nào cho cùng lượt,
bao gồm `rawResponseItem/completed`, đều vô hiệu hóa watchdog ngắn đó vì Codex đã
chứng minh lượt vẫn còn hoạt động; watchdog kết thúc dài hơn tiếp tục bảo vệ các
lượt thật sự bị kẹt. Các thông báo app-server toàn cục, chẳng hạn như cập nhật
giới hạn tốc độ, không đặt lại tiến trình chờ của lượt. Khi Codex phát ra một mục
`agentMessage` đã hoàn tất rồi im lặng mà không có `turn/completed`, OpenClaw xem
đầu ra của trợ lý là đã hoàn tất trên thực tế, cố gắng hết mức để ngắt lượt Codex
gốc, và giải phóng làn phiên. Chẩn đoán timeout bao gồm phương thức thông báo
app-server cuối cùng và, đối với các mục phản hồi trợ lý thô, loại mục, vai trò,
id, và bản xem trước văn bản trợ lý có giới hạn.

Các ghi đè môi trường vẫn có sẵn cho kiểm thử cục bộ:

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
cùng tệp đã được rà soát như phần còn lại của thiết lập harness Codex.

## Plugin Codex gốc

Hỗ trợ Plugin Codex gốc dùng các khả năng app và Plugin riêng của Codex app-server
trong cùng luồng Codex với lượt harness OpenClaw. OpenClaw không chuyển đổi các
Plugin Codex thành công cụ động OpenClaw `codex_plugin_*` tổng hợp.

`codexPlugins` chỉ ảnh hưởng đến các phiên chọn harness Codex gốc. Nó không có
tác dụng với các lần chạy PI, các lần chạy nhà cung cấp OpenAI thông thường, các
ràng buộc hội thoại ACP, hoặc các harness khác.

Config tối thiểu đã di chuyển:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

Config app của luồng được tính khi OpenClaw thiết lập một phiên harness Codex
hoặc thay thế một ràng buộc luồng Codex đã cũ. Nó không được tính lại ở mỗi lượt.
Sau khi thay đổi `codexPlugins`, hãy dùng `/new`, `/reset`, hoặc khởi động lại
gateway để các phiên harness Codex trong tương lai bắt đầu với tập app đã cập nhật.

Để biết điều kiện di chuyển, inventory app, chính sách hành động phá hủy,
elicitations, và chẩn đoán Plugin gốc, hãy xem
[Plugin Codex gốc](/vi/plugins/codex-native-plugins).

## Computer Use

Computer Use được trình bày trong hướng dẫn thiết lập riêng:
[Codex Computer Use](/vi/plugins/codex-computer-use).

Tóm tắt ngắn gọn: OpenClaw không vendor app điều khiển desktop hoặc tự thực thi
các hành động desktop. Nó chuẩn bị Codex app-server, xác minh rằng MCP server
`computer-use` có sẵn, rồi để Codex sở hữu các lệnh gọi công cụ MCP gốc trong
các lượt chế độ Codex.

## Ranh giới runtime

Harness Codex chỉ thay đổi executor tác tử nhúng cấp thấp.

- Công cụ động OpenClaw được hỗ trợ. Codex yêu cầu OpenClaw thực thi các công cụ
  đó, nên OpenClaw vẫn nằm trong đường dẫn thực thi.
- Shell, patch, MCP, và các công cụ app gốc của Codex do Codex sở hữu. OpenClaw
  có thể quan sát hoặc chặn các sự kiện gốc được chọn thông qua relay được hỗ
  trợ, nhưng không viết lại đối số công cụ gốc.
- Codex sở hữu Compaction gốc. OpenClaw giữ một bản sao transcript cho lịch sử
  kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi mô hình hoặc harness trong
  tương lai.
- Tạo phương tiện, hiểu nội dung phương tiện, TTS, phê duyệt, và đầu ra công cụ
  nhắn tin tiếp tục đi qua các thiết lập nhà cung cấp/mô hình OpenClaw tương ứng.
- `tool_result_persist` áp dụng cho kết quả công cụ transcript do OpenClaw sở hữu,
  không phải các bản ghi kết quả công cụ gốc của Codex.

Để biết các lớp hook, bề mặt V1 được hỗ trợ, xử lý quyền gốc, điều hướng hàng
đợi, cơ chế tải lên phản hồi Codex, và chi tiết Compaction, hãy xem
[Runtime harness Codex](/vi/plugins/codex-harness-runtime).

## Khắc phục sự cố

**Codex không xuất hiện như một nhà cung cấp `/model` thông thường:** điều này là
dự kiến với các config mới. Chọn một mô hình `openai/gpt-*`, bật
`plugins.entries.codex.enabled`, và kiểm tra liệu `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng PI thay vì Codex:** hãy bảo đảm ref mô hình là `openai/gpt-*` trên
nhà cung cấp OpenAI chính thức và Plugin Codex đã được cài đặt và bật. Nếu bạn
cần bằng chứng nghiêm ngặt khi kiểm thử, đặt `agentRuntime.id: "codex"` cho nhà
cung cấp hoặc mô hình. Runtime Codex bị ép buộc sẽ thất bại thay vì fallback về PI.

**Config `openai-codex/*` cũ vẫn còn:** chạy `openclaw doctor --fix`. Doctor viết
lại các ref mô hình cũ thành `openai/*`, loại bỏ các pin runtime phiên và toàn
tác tử đã cũ, và giữ nguyên các ghi đè hồ sơ xác thực hiện có.

**App-server bị từ chối:** dùng Codex app-server `0.125.0` hoặc mới hơn. Các bản
prerelease cùng phiên bản hoặc phiên bản có hậu tố build như `0.125.0-alpha.2`
hoặc `0.125.0+custom` bị từ chối vì OpenClaw kiểm tra mức sàn giao thức ổn định
`0.125.0`.

**`/codex status` không thể kết nối:** kiểm tra rằng Plugin `codex` được bundle
đã bật, rằng `plugins.allow` bao gồm nó khi allowlist được cấu hình, và rằng mọi
`appServer.command`, `url`, `authToken`, hoặc header tùy chỉnh đều hợp lệ.

**Khám phá mô hình chậm:** giảm
`plugins.entries.codex.config.discovery.timeoutMs` hoặc tắt khám phá. Xem
[Tham chiếu harness Codex](/vi/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`,
`authToken`, header, và rằng app-server từ xa nói cùng phiên bản giao thức Codex
app-server.

**Một mô hình không phải Codex dùng PI:** điều này là dự kiến trừ khi chính sách
runtime của nhà cung cấp hoặc mô hình định tuyến nó sang harness khác. Các ref
nhà cung cấp không phải OpenAI thuần vẫn ở trên đường dẫn nhà cung cấp thông
thường của chúng trong chế độ `auto`.

**Computer Use đã cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, hãy dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn,
khởi động lại gateway để xóa các đăng ký hook gốc đã cũ. Xem
[Codex Computer Use](/vi/plugins/codex-computer-use#troubleshooting).

## Liên quan

- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Hook Plugin](/vi/plugins/hooks)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Trạng thái](/vi/cli/status)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
