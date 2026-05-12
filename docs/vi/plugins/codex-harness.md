---
read_when:
    - Bạn muốn sử dụng bộ khung app-server đi kèm của Codex
    - Bạn cần các ví dụ cấu hình bộ harness Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang PI
summary: Chạy các lượt của tác tử nhúng OpenClaw thông qua bộ khung máy chủ ứng dụng Codex đi kèm
title: Bộ khung Codex
x-i18n:
    generated_at: "2026-05-12T00:59:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` đi kèm cho phép OpenClaw chạy các lượt agent OpenAI nhúng
thông qua Codex app-server thay vì PI harness tích hợp sẵn.

Dùng Codex harness khi bạn muốn Codex sở hữu phiên agent cấp thấp:
tiếp tục luồng gốc, tiếp tục công cụ gốc, compaction gốc và
thực thi app-server. OpenClaw vẫn sở hữu các kênh chat, tệp phiên, lựa chọn mô hình, công cụ động OpenClaw, phê duyệt, phân phối phương tiện và bản sao transcript hiển thị.

Thiết lập thông thường dùng các tham chiếu mô hình OpenAI chuẩn như `openai/gpt-5.5`.
Không cấu hình các tham chiếu mô hình `openai-codex/gpt-*`. Đặt thứ tự xác thực agent OpenAI
trong `auth.order.openai`; các hồ sơ `openai-codex:*` cũ hơn và
mục `auth.order.openai-codex` vẫn được hỗ trợ cho các bản cài đặt hiện có.

OpenClaw khởi động các luồng Codex app-server với chế độ mã gốc Codex và
chỉ bật chế độ mã. Điều đó giữ các công cụ động OpenClaw có thể trì hoãn/tìm kiếm
bên trong chính bề mặt thực thi mã và tìm kiếm công cụ của Codex thay vì thêm một
trình bao tìm kiếm công cụ kiểu PI phía trên Codex.

Để hiểu phần tách mô hình/nhà cung cấp/runtime rộng hơn, hãy bắt đầu với
[Runtime của agent](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, và Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` đi kèm.
- Nếu cấu hình của bạn dùng `plugins.allow`, hãy bao gồm `codex`.
- Codex app-server `0.125.0` hoặc mới hơn. Theo mặc định, Plugin đi kèm quản lý một
  nhị phân Codex app-server tương thích, vì vậy các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến việc khởi động harness thông thường.
- Xác thực Codex khả dụng thông qua `openclaw models auth login --provider openai-codex`,
  tài khoản app-server trong Codex home của agent, hoặc một hồ sơ xác thực API-key Codex
  rõ ràng.

Để biết thứ tự ưu tiên xác thực, cô lập môi trường, lệnh app-server tùy chỉnh, khám phá mô hình
và tất cả trường cấu hình, xem
[Tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Khởi động nhanh

Hầu hết người dùng muốn dùng Codex trong OpenClaw sẽ muốn đường dẫn này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, bật Plugin `codex` đi kèm và dùng
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

Khởi động lại Gateway sau khi thay đổi cấu hình Plugin. Nếu một cuộc chat hiện có đã
có phiên, hãy dùng `/new` hoặc `/reset` trước khi kiểm thử thay đổi runtime để lượt
tiếp theo phân giải harness từ cấu hình hiện tại.

## Cấu hình

Cấu hình khởi động nhanh là cấu hình Codex harness tối thiểu khả dụng. Đặt các tùy chọn Codex
harness trong cấu hình OpenClaw và chỉ dùng CLI cho xác thực Codex:

| Nhu cầu                                | Đặt                                                                              | Nơi đặt                            |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Bật harness                            | `plugins.entries.codex.enabled: true`                                            | Cấu hình OpenClaw                  |
| Giữ một bản cài Plugin trong danh sách cho phép | Bao gồm `codex` trong `plugins.allow`                                            | Cấu hình OpenClaw                  |
| Định tuyến các lượt agent OpenAI qua Codex | `agents.defaults.model` hoặc `agents.list[].model` là `openai/gpt-*`             | Cấu hình agent OpenClaw            |
| Đăng nhập bằng Codex OAuth             | `openclaw models auth login --provider openai-codex`                             | Hồ sơ xác thực CLI                 |
| Thêm API-key dự phòng cho các lần chạy Codex | Hồ sơ API-key `openai:*` được liệt kê sau xác thực đăng ký trong `auth.order.openai` | Hồ sơ xác thực CLI + cấu hình OpenClaw |
| Đóng thất bại khi Codex không khả dụng | Nhà cung cấp hoặc mô hình `agentRuntime.id: "codex"`                             | Cấu hình mô hình/nhà cung cấp OpenClaw |
| Dùng lưu lượng API OpenAI trực tiếp    | Nhà cung cấp hoặc mô hình `agentRuntime.id: "pi"` với xác thực OpenAI thông thường | Cấu hình mô hình/nhà cung cấp OpenClaw |
| Tinh chỉnh hành vi app-server          | `plugins.entries.codex.config.appServer.*`                                       | Cấu hình Plugin Codex              |
| Bật các ứng dụng Plugin Codex gốc      | `plugins.entries.codex.config.codexPlugins.*`                                    | Cấu hình Plugin Codex              |
| Bật Codex Computer Use                 | `plugins.entries.codex.config.computerUse.*`                                     | Cấu hình Plugin Codex              |

Dùng tham chiếu mô hình `openai/gpt-*` cho các lượt agent OpenAI được Codex hỗ trợ. Ưu tiên
`auth.order.openai` để sắp xếp đăng ký trước/API-key dự phòng sau. Các hồ sơ xác thực
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

Trong cấu trúc đó, cả hai hồ sơ vẫn chạy qua Codex cho các lượt agent
`openai/gpt-*`. API key chỉ là phương án xác thực dự phòng, không phải yêu cầu chuyển sang PI hoặc
OpenAI Responses thuần.

Phần còn lại của trang này trình bày các biến thể phổ biến mà người dùng phải chọn giữa:
kiểu triển khai, định tuyến đóng thất bại, chính sách phê duyệt guardian, các Plugin Codex
gốc và Computer Use. Để xem danh sách tùy chọn đầy đủ, mặc định, enum, khám phá,
cô lập môi trường, timeout và các trường truyền tải app-server, xem
[Tham chiếu Codex harness](/vi/plugins/codex-harness-reference).

## Xác minh runtime Codex

Dùng `/status` trong cuộc chat nơi bạn mong đợi Codex. Một lượt agent OpenAI được Codex hỗ trợ
hiển thị:

```text
Runtime: OpenAI Codex
```

Sau đó kiểm tra trạng thái Codex app-server:

```text
/codex status
/codex models
```

`/codex status` báo cáo kết nối app-server, tài khoản, giới hạn tốc độ, máy chủ MCP
và Skills. `/codex models` liệt kê catalog Codex app-server trực tiếp cho
harness và tài khoản. Nếu `/status` gây bất ngờ, xem
[Khắc phục sự cố](#troubleshooting).

## Định tuyến và lựa chọn mô hình

Giữ tham chiếu nhà cung cấp và chính sách runtime tách biệt:

- Dùng `openai/gpt-*` cho các lượt agent OpenAI thông qua Codex.
- Không dùng `openai-codex/gpt-*` trong cấu hình. Chạy `openclaw doctor --fix` để
  sửa các tham chiếu cũ và các ghim tuyến phiên lỗi thời.
- `agentRuntime.id: "codex"` là tùy chọn cho chế độ OpenAI tự động thông thường, nhưng hữu ích
  khi một triển khai cần đóng thất bại nếu Codex không khả dụng.
- `agentRuntime.id: "pi"` đưa một nhà cung cấp hoặc mô hình vào hành vi PI trực tiếp khi
  đó là chủ đích.
- `/codex ...` điều khiển các cuộc hội thoại Codex app-server gốc từ chat.
- ACP/acpx là một đường dẫn harness bên ngoài riêng biệt. Chỉ dùng khi người dùng yêu cầu
  ACP/acpx hoặc một bộ chuyển đổi harness bên ngoài.

Định tuyến lệnh phổ biến:

| Ý định của người dùng          | Dùng                                    |
| ------------------------------ | --------------------------------------- |
| Gắn cuộc chat hiện tại         | `/codex bind [--cwd <path>]`            |
| Tiếp tục một luồng Codex hiện có | `/codex resume <thread-id>`             |
| Liệt kê hoặc lọc luồng Codex   | `/codex threads [filter]`               |
| Chỉ gửi phản hồi Codex         | `/codex diagnostics [note]`             |
| Bắt đầu một tác vụ ACP/acpx    | Lệnh phiên ACP/acpx, không phải `/codex` |

| Trường hợp sử dụng                                  | Cấu hình                                                         | Xác minh                                | Ghi chú                            |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc     | `openai/gpt-*` cộng với Plugin `codex` đã bật                    | `/status` hiển thị `Runtime: OpenAI Codex` | Đường dẫn được khuyến nghị         |
| Đóng thất bại nếu Codex không khả dụng              | Nhà cung cấp hoặc mô hình `agentRuntime.id: "codex"`             | Lượt thất bại thay vì dự phòng PI       | Dùng cho triển khai chỉ Codex      |
| Lưu lượng API-key OpenAI trực tiếp qua PI           | Nhà cung cấp hoặc mô hình `agentRuntime.id: "pi"` và xác thực OpenAI thông thường | `/status` hiển thị runtime PI           | Chỉ dùng khi PI là chủ đích        |
| Cấu hình cũ                                         | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` viết lại nó     | Không viết cấu hình mới theo cách này |
| Bộ chuyển đổi ACP/acpx Codex                        | ACP `sessions_spawn({ runtime: "acp" })`                         | Trạng thái tác vụ/phiên ACP             | Tách biệt với Codex harness gốc    |

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng `openai/gpt-*`
cho tuyến OpenAI thông thường và `codex/gpt-*` chỉ khi hiểu hình ảnh
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

### Triển khai nhiều nhà cung cấp

Cấu trúc này giữ Claude làm agent mặc định và thêm một agent Codex được đặt tên:

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

Với cấu hình này, agent `main` dùng đường dẫn nhà cung cấp thông thường của nó và agent
`codex` dùng Codex app-server.

### Triển khai Codex đóng thất bại

Đối với các lượt agent OpenAI, `openai/gpt-*` đã phân giải sang Codex khi
Plugin đi kèm khả dụng. Thêm chính sách runtime rõ ràng khi bạn muốn có một
quy tắc đóng thất bại bằng văn bản:

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
app-server quá cũ hoặc app-server không thể khởi động.

## Chính sách app-server

Theo mặc định, Plugin khởi động nhị phân Codex do OpenClaw quản lý cục bộ với truyền tải stdio.
Chỉ đặt `appServer.command` khi bạn cố ý muốn chạy một tệp thực thi
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

Các phiên máy chủ ứng dụng stdio cục bộ mặc định dùng tư thế toán tử cục bộ đáng tin cậy:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` và
`sandbox: "danger-full-access"`. Nếu các yêu cầu Codex cục bộ không cho phép
tư thế YOLO ngầm định đó, OpenClaw sẽ chọn các quyền guardian được phép thay thế.
Khi sandbox OpenClaw đang hoạt động cho phiên, OpenClaw thu hẹp Codex
`danger-full-access` thành Codex `workspace-write` để các lượt code-mode Codex
gốc vẫn nằm trong workspace đã được sandbox.

Dùng chế độ guardian khi bạn muốn Codex tự động rà soát gốc trước khi thoát sandbox
hoặc trước khi cấp thêm quyền:

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

Chế độ guardian mở rộng thành các phê duyệt máy chủ ứng dụng Codex, thường là
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` và
`sandbox: "workspace-write"` khi các yêu cầu cục bộ cho phép những giá trị đó.

Để biết mọi trường máy chủ ứng dụng, thứ tự xác thực, cô lập môi trường, khám phá và
hành vi timeout, hãy xem [tham chiếu harness Codex](/vi/plugins/codex-harness-reference).

## Lệnh và chẩn đoán

Plugin đi kèm đăng ký `/codex` làm lệnh slash trên mọi kênh hỗ trợ
lệnh văn bản OpenClaw.

Các dạng thường dùng:

- `/codex status` kiểm tra kết nối máy chủ ứng dụng, mô hình, tài khoản, giới hạn tốc độ,
  máy chủ MCP và Skills.
- `/codex models` liệt kê các mô hình máy chủ ứng dụng Codex đang hoạt động.
- `/codex threads [filter]` liệt kê các luồng máy chủ ứng dụng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một
  luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex compact luồng đã gắn.
- `/codex review` bắt đầu rà soát Codex gốc cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi Codex cho
  luồng đã gắn.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê Skills của máy chủ ứng dụng Codex.

Với hầu hết báo cáo hỗ trợ, hãy bắt đầu bằng `/diagnostics [note]` trong cuộc trò chuyện
nơi lỗi xảy ra. Lệnh này tạo một báo cáo chẩn đoán Gateway và, với các phiên harness Codex,
xin phê duyệt để gửi gói phản hồi Codex liên quan.
Xem [xuất chẩn đoán](/vi/gateway/diagnostics) để biết mô hình quyền riêng tư và hành vi
trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải lên phản hồi Codex
cho luồng hiện đang gắn mà không có toàn bộ gói chẩn đoán Gateway.

### Kiểm tra các luồng Codex cục bộ

Cách nhanh nhất để kiểm tra một lần chạy Codex lỗi thường là mở trực tiếp
luồng Codex gốc:

```bash
codex resume <thread-id>
```

Lấy id luồng từ phản hồi `/diagnostics` đã hoàn tất, `/codex binding` hoặc
`/codex threads [filter]`.

Để biết cơ chế tải lên và ranh giới chẩn đoán ở cấp runtime, hãy xem
[runtime harness Codex](/vi/plugins/codex-harness-runtime#codex-feedback-upload).

Xác thực được chọn theo thứ tự này:

1. Các hồ sơ xác thực OpenAI đã sắp thứ tự cho agent, tốt nhất là dưới
   `auth.order.openai`. Các id hồ sơ `openai-codex:*` hiện có vẫn hợp lệ.
2. Tài khoản hiện có của máy chủ ứng dụng trong home Codex của agent đó.
3. Chỉ với các lần khởi chạy máy chủ ứng dụng stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản máy chủ ứng dụng và xác thực OpenAI
   vẫn được yêu cầu.

Khi OpenClaw thấy hồ sơ xác thực Codex kiểu đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều đó
giữ các khóa API cấp Gateway sẵn dùng cho embeddings hoặc các mô hình OpenAI trực tiếp
mà không vô tình khiến các lượt máy chủ ứng dụng Codex gốc tính phí qua API.
Các hồ sơ khóa API Codex tường minh và phương án dự phòng khóa môi trường stdio cục bộ
dùng đăng nhập máy chủ ứng dụng thay vì env kế thừa của tiến trình con. Các kết nối
máy chủ ứng dụng WebSocket không nhận phương án dự phòng khóa API env của Gateway; hãy dùng
hồ sơ xác thực tường minh hoặc tài khoản riêng của máy chủ ứng dụng từ xa.

Nếu hồ sơ đăng ký chạm giới hạn sử dụng Codex, OpenClaw ghi lại thời điểm đặt lại
khi Codex báo cáo và thử hồ sơ xác thực đã sắp thứ tự tiếp theo cho cùng
lần chạy Codex. Khi thời điểm đặt lại đi qua, hồ sơ đăng ký lại đủ điều kiện
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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con máy chủ ứng dụng Codex được sinh ra.

Công cụ động Codex mặc định dùng tải `searchable`. OpenClaw không hiển thị
các công cụ động trùng lặp với thao tác workspace gốc của Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` và `update_plan`. Các công cụ tích hợp OpenClaw
còn lại như nhắn tin, phiên, phương tiện, cron, trình duyệt, node,
gateway, `heartbeat_respond` và `web_search` có sẵn thông qua tìm kiếm công cụ Codex
dưới namespace `openclaw`, giúp ngữ cảnh mô hình ban đầu nhỏ hơn.
`sessions_yield` và các phản hồi nguồn chỉ dùng công cụ nhắn tin vẫn trực tiếp vì đó
là các hợp đồng điều khiển lượt. Hướng dẫn cộng tác Heartbeat yêu cầu Codex
tìm kiếm `heartbeat_respond` trước khi kết thúc một lượt heartbeat khi công cụ đó
chưa được tải.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối với máy chủ ứng dụng Codex
tùy chỉnh không thể tìm kiếm các công cụ động được trì hoãn hoặc khi gỡ lỗi toàn bộ
payload công cụ.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định       | Ý nghĩa                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Dùng `"direct"` để đưa các công cụ động OpenClaw trực tiếp vào ngữ cảnh công cụ Codex ban đầu. |
| `codexDynamicToolsExclude` | `[]`           | Tên công cụ động OpenClaw bổ sung cần bỏ qua khỏi các lượt máy chủ ứng dụng Codex.        |
| `codexPlugins`             | tắt            | Hỗ trợ Plugin/ứng dụng Codex gốc cho các Plugin tuyển chọn đã cài từ nguồn và đã di chuyển. |

Các trường `appServer` được hỗ trợ:

| Trường                        | Mặc định                                               | Ý nghĩa                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` sinh Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                  |
| `command`                     | binary Codex được quản lý                              | Tệp thực thi cho transport stdio. Để trống để dùng binary được quản lý; chỉ đặt khi cần ghi đè tường minh.                                                                                                                              |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho transport stdio.                                                                                                                                                                                                             |
| `url`                         | chưa đặt                                               | URL máy chủ ứng dụng WebSocket.                                                                                                                                                                                                         |
| `authToken`                   | chưa đặt                                               | Bearer token cho transport WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Header WebSocket bổ sung.                                                                                                                                                                                                               |
| `clearEnv`                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình máy chủ ứng dụng stdio được sinh ra sau khi OpenClaw xây dựng môi trường kế thừa. `CODEX_HOME` và `HOME` được dành riêng cho cô lập Codex theo từng agent của OpenClaw trên các lần khởi chạy cục bộ. |
| `requestTimeoutMs`            | `60000`                                                | Timeout cho các lệnh gọi control-plane của máy chủ ứng dụng.                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Khoảng yên lặng sau một yêu cầu máy chủ ứng dụng Codex trong phạm vi lượt trong khi OpenClaw chờ `turn/completed`. Tăng giá trị này cho các giai đoạn tổng hợp chậm sau công cụ hoặc chỉ có trạng thái.                                |
| `mode`                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc có guardian rà soát. Các yêu cầu stdio cục bộ bỏ qua `danger-full-access`, phê duyệt `never` hoặc reviewer `user` sẽ làm mặc định ngầm định thành guardian.                                              |
| `approvalPolicy`              | `"never"` hoặc một chính sách phê duyệt guardian được phép | Chính sách phê duyệt Codex gốc được gửi tới thread start/resume/turn. Mặc định guardian ưu tiên `"on-request"` khi được phép.                                                                                                         |
| `sandbox`                     | `"danger-full-access"` hoặc một sandbox guardian được phép | Chế độ sandbox Codex gốc được gửi tới thread start/resume. Mặc định guardian ưu tiên `"workspace-write"` khi được phép, nếu không thì `"read-only"`. Khi sandbox OpenClaw đang hoạt động, `danger-full-access` được thu hẹp thành `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` hoặc một reviewer guardian được phép          | Dùng `"auto_review"` để cho Codex rà soát các lời nhắc phê duyệt gốc khi được phép, nếu không thì `guardian_subagent` hoặc `user`. `guardian_subagent` vẫn là alias legacy.                                                            |
| `serviceTier`                 | chưa đặt                                               | Cấp dịch vụ máy chủ ứng dụng Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý flex, `null` xóa ghi đè, và legacy `"fast"` được chấp nhận như `"priority"`.                                           |

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: các yêu cầu Codex `item/tool/call` mặc định dùng watchdog
OpenClaw 30 giây. Đối số `timeoutMs` dương cho từng lệnh gọi sẽ kéo dài
hoặc rút ngắn ngân sách của công cụ cụ thể đó. Công cụ `image_generate` cũng dùng
`agents.defaults.imageGenerationModel.timeoutMs` khi lệnh gọi công cụ không
cung cấp thời gian chờ riêng, và công cụ `image` để hiểu nội dung media dùng
`tools.media.image.timeoutSeconds` hoặc mặc định media 60 giây của nó. Ngân sách
công cụ động được giới hạn ở 600000 ms. Khi hết thời gian chờ, OpenClaw hủy tín hiệu
công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex để lượt
có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi OpenClaw phản hồi một yêu cầu app-server trong phạm vi lượt của Codex, harness
cũng kỳ vọng Codex hoàn tất lượt native bằng `turn/completed`. Nếu app-server
im lặng trong `appServer.turnCompletionIdleTimeoutMs` sau phản hồi đó,
OpenClaw sẽ nỗ lực tối đa để ngắt lượt Codex, ghi lại chẩn đoán hết thời gian chờ,
và giải phóng làn phiên OpenClaw để các tin nhắn trò chuyện tiếp theo không bị xếp hàng
sau một lượt native cũ. Bất kỳ thông báo chưa kết thúc nào cho cùng lượt đó,
bao gồm `rawResponseItem/completed`, sẽ vô hiệu hóa watchdog ngắn này
vì Codex đã chứng minh lượt vẫn còn hoạt động; watchdog kết thúc dài hơn
tiếp tục bảo vệ các lượt thực sự bị kẹt. Chẩn đoán hết thời gian chờ bao gồm
phương thức thông báo app-server cuối cùng và, với các mục phản hồi trợ lý thô,
loại mục, vai trò, id, và bản xem trước văn bản trợ lý có giới hạn.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được rà soát với phần còn lại của thiết lập Codex harness.

## Plugin Codex native

Hỗ trợ Plugin Codex native dùng các khả năng app và Plugin riêng của Codex app-server
trong cùng luồng Codex với lượt OpenClaw harness. OpenClaw
không dịch các Plugin Codex thành các công cụ động OpenClaw `codex_plugin_*`
giả lập.

`codexPlugins` chỉ ảnh hưởng đến các phiên chọn Codex harness native. Nó
không có tác dụng với các lần chạy PI, các lần chạy provider OpenAI thông thường,
các liên kết hội thoại ACP, hoặc các harness khác.

Cấu hình tối thiểu đã di trú:

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

Cấu hình app của luồng được tính khi OpenClaw thiết lập một phiên Codex harness
hoặc thay thế liên kết luồng Codex đã cũ. Nó không được tính lại ở mọi lượt.
Sau khi thay đổi `codexPlugins`, hãy dùng `/new`, `/reset`, hoặc khởi động lại Gateway để
các phiên Codex harness trong tương lai bắt đầu với tập app đã cập nhật.

Để biết điều kiện di trú, kho app, chính sách hành động phá hủy,
elicitations, và chẩn đoán Plugin native, xem
[Plugin Codex native](/vi/plugins/codex-native-plugins).

## Computer Use

Computer Use được trình bày trong hướng dẫn thiết lập riêng:
[Codex Computer Use](/vi/plugins/codex-computer-use).

Tóm tắt ngắn gọn: OpenClaw không vendor app điều khiển desktop hoặc tự thực thi
hành động desktop. Nó chuẩn bị Codex app-server, xác minh rằng máy chủ MCP
`computer-use` có sẵn, rồi để Codex sở hữu các lệnh gọi công cụ MCP native
trong các lượt chế độ Codex.

## Ranh giới runtime

Codex harness chỉ thay đổi trình thực thi tác nhân nhúng cấp thấp.

- Công cụ động OpenClaw được hỗ trợ. Codex yêu cầu OpenClaw thực thi các
  công cụ đó, nên OpenClaw vẫn nằm trong đường dẫn thực thi.
- Các công cụ shell, patch, MCP và app native của Codex thuộc sở hữu của Codex.
  OpenClaw có thể quan sát hoặc chặn các sự kiện native được chọn thông qua relay
  được hỗ trợ, nhưng không viết lại đối số công cụ native.
- Codex sở hữu Compaction native. OpenClaw giữ một bản sao transcript cho lịch sử
  kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi model hoặc harness trong tương lai.
- Tạo media, hiểu media, TTS, phê duyệt, và đầu ra công cụ nhắn tin
  tiếp tục đi qua các cài đặt provider/model OpenClaw tương ứng.
- `tool_result_persist` áp dụng cho kết quả công cụ transcript do OpenClaw sở hữu, không phải
  các bản ghi kết quả công cụ Codex native.

Để biết các lớp hook, bề mặt V1 được hỗ trợ, xử lý quyền native, điều hướng hàng đợi,
cơ chế tải phản hồi Codex lên, và chi tiết Compaction, xem
[Runtime Codex harness](/vi/plugins/codex-harness-runtime).

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` thông thường:** điều này là bình thường với
cấu hình mới. Chọn một model `openai/gpt-*`, bật
`plugins.entries.codex.enabled`, và kiểm tra liệu `plugins.allow` có loại trừ
`codex` không.

**OpenClaw dùng PI thay vì Codex:** hãy bảo đảm model ref là
`openai/gpt-*` trên provider OpenAI chính thức và Plugin Codex đã được
cài đặt và bật. Nếu bạn cần bằng chứng chặt chẽ trong khi kiểm thử, đặt provider hoặc
model `agentRuntime.id: "codex"`. Runtime Codex bị ép buộc sẽ thất bại thay vì
fallback về PI.

**Cấu hình `openai-codex/*` cũ vẫn còn:** chạy `openclaw doctor --fix`.
Doctor viết lại các model ref cũ thành `openai/*`, gỡ các pin runtime phiên cũ và
toàn tác nhân, đồng thời giữ nguyên các ghi đè auth-profile hiện có.

**app-server bị từ chối:** dùng Codex app-server `0.125.0` hoặc mới hơn.
Các bản prerelease cùng phiên bản hoặc phiên bản có hậu tố build như
`0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì OpenClaw kiểm thử
ngưỡng giao thức ổn định `0.125.0`.

**`/codex status` không thể kết nối:** kiểm tra Plugin `codex` được đóng gói có
được bật không, `plugins.allow` có bao gồm nó khi allowlist được cấu hình không, và
bất kỳ `appServer.command`, `url`, `authToken`, hoặc header tùy chỉnh nào có hợp lệ không.

**Khám phá model chậm:** giảm
`plugins.entries.codex.config.discovery.timeoutMs` hoặc tắt khám phá. Xem
[Tham chiếu Codex harness](/vi/plugins/codex-harness-reference#model-discovery).

**WebSocket transport thất bại ngay lập tức:** kiểm tra `appServer.url`, `authToken`,
headers, và máy chủ app-server từ xa có dùng cùng phiên bản giao thức Codex app-server không.

**Một model không phải Codex dùng PI:** điều này là bình thường trừ khi chính sách runtime
provider hoặc model định tuyến nó sang một harness khác. Các ref provider không phải OpenAI
thuần túy vẫn đi theo đường dẫn provider thông thường của chúng ở chế độ `auto`.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, hãy dùng `/new` hoặc `/reset`; nếu vẫn tiếp diễn, khởi động lại
Gateway để xóa các đăng ký hook native cũ. Xem
[Codex Computer Use](/vi/plugins/codex-computer-use#troubleshooting).

## Liên quan

- [Tham chiếu Codex harness](/vi/plugins/codex-harness-reference)
- [Runtime Codex harness](/vi/plugins/codex-harness-runtime)
- [Plugin Codex native](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Runtime tác nhân](/vi/concepts/agent-runtimes)
- [Provider model](/vi/concepts/model-providers)
- [Provider OpenAI](/vi/providers/openai)
- [Plugin harness tác nhân](/vi/plugins/sdk-agent-harness)
- [Hook Plugin](/vi/plugins/hooks)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Trạng thái](/vi/cli/status)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
