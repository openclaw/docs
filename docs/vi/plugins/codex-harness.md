---
read_when:
    - Bạn muốn dùng bộ harness app-server Codex đi kèm
    - Bạn cần các ví dụ cấu hình harness Codex
    - Bạn muốn các triển khai chỉ dùng Codex thất bại thay vì chuyển dự phòng sang OpenClaw
summary: Chạy các lượt tác nhân nhúng của OpenClaw thông qua harness app-server Codex đi kèm
title: Bộ kiểm thử Codex
x-i18n:
    generated_at: "2026-07-03T13:39:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` được đóng gói cho phép OpenClaw chạy các lượt agent OpenAI nhúng
thông qua Codex app-server thay vì harness OpenClaw tích hợp sẵn.

Dùng harness Codex khi bạn muốn Codex sở hữu phiên agent cấp thấp:
tiếp tục luồng gốc, tiếp tục công cụ gốc, compaction gốc và
thực thi app-server. OpenClaw vẫn sở hữu các kênh chat, tệp phiên, lựa chọn mô hình,
công cụ động OpenClaw, phê duyệt, phân phối media và bản sao transcript hiển thị.

Thiết lập thông thường dùng các tham chiếu mô hình OpenAI chuẩn tắc như `openai/gpt-5.5`.
Không cấu hình các tham chiếu Codex GPT cũ. Đặt thứ tự xác thực agent OpenAI
trong `auth.order.openai`; các id hồ sơ xác thực Codex cũ hơn và
các mục thứ tự xác thực Codex cũ là trạng thái kế thừa được sửa bởi
`openclaw doctor --fix`.

Khi không có sandbox OpenClaw nào đang hoạt động, OpenClaw khởi động các luồng Codex app-server
với chế độ mã gốc của Codex được bật, trong khi mặc định vẫn tắt code-mode-only.
Điều đó giữ cho workspace gốc và khả năng mã của Codex khả dụng trong khi
các công cụ động OpenClaw tiếp tục đi qua cầu nối `item/tool/call` của app-server.
Sandboxing OpenClaw đang hoạt động và các chính sách công cụ bị hạn chế sẽ tắt hoàn toàn chế độ mã gốc
trừ khi bạn chọn dùng đường dẫn exec-server sandbox thử nghiệm.

Tính năng gốc Codex này tách biệt với
[chế độ mã OpenClaw](/vi/reference/code-mode), vốn là runtime QuickJS-WASI chọn tham gia
cho các lượt chạy OpenClaw chung với một hình dạng đầu vào `exec` khác.

Để hiểu phần tách mô hình/nhà cung cấp/runtime rộng hơn, hãy bắt đầu với
[Runtime agent](/vi/concepts/agent-runtimes). Phiên bản ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, còn Telegram,
Discord, Slack hoặc kênh khác vẫn là bề mặt giao tiếp.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` được đóng gói.
- Nếu cấu hình của bạn dùng `plugins.allow`, hãy bao gồm `codex`.
- Codex app-server `0.125.0` hoặc mới hơn. Plugin được đóng gói mặc định quản lý một
  binary Codex app-server tương thích, nên các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến khởi động harness thông thường.
- Xác thực Codex khả dụng thông qua `openclaw models auth login --provider openai`,
  một tài khoản app-server trong Codex home của agent, hoặc một hồ sơ xác thực Codex API-key
  rõ ràng.

Về mức ưu tiên xác thực, cô lập môi trường, lệnh app-server tùy chỉnh, khám phá mô hình
và tất cả trường cấu hình, xem
[Tham khảo harness Codex](/vi/plugins/codex-harness-reference).

## Bắt đầu nhanh

Hầu hết người dùng muốn Codex trong OpenClaw sẽ muốn đường dẫn này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, bật Plugin `codex` được đóng gói và dùng một
tham chiếu mô hình `openai/gpt-*` chuẩn tắc.

Đăng nhập bằng Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Bật Plugin `codex` được đóng gói và chọn một mô hình agent OpenAI:

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

Khởi động lại gateway sau khi thay đổi cấu hình plugin. Nếu một chat hiện có đã
có phiên, hãy dùng `/new` hoặc `/reset` trước khi kiểm thử thay đổi runtime để lượt
tiếp theo phân giải harness từ cấu hình hiện tại.

## Cấu hình

Cấu hình bắt đầu nhanh là cấu hình harness Codex khả dụng tối thiểu. Đặt các tùy chọn
harness Codex trong cấu hình OpenClaw, và chỉ dùng CLI cho xác thực Codex:

| Nhu cầu                                | Đặt                                                                              | Vị trí                             |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Bật harness                            | `plugins.entries.codex.enabled: true`                                            | Cấu hình OpenClaw                  |
| Giữ một bản cài plugin có trong allowlist | Bao gồm `codex` trong `plugins.allow`                                         | Cấu hình OpenClaw                  |
| Định tuyến lượt agent OpenAI qua Codex | `agents.defaults.model` hoặc `agents.list[].model` dạng `openai/gpt-*`           | Cấu hình agent OpenClaw            |
| Đăng nhập bằng ChatGPT/Codex OAuth     | `openclaw models auth login --provider openai`                                   | Hồ sơ xác thực CLI                 |
| Thêm dự phòng API-key cho lượt chạy Codex | Hồ sơ API-key `openai:*` được liệt kê sau xác thực đăng ký trong `auth.order.openai` | Hồ sơ xác thực CLI + cấu hình OpenClaw |
| Đóng khi Codex không khả dụng          | `agentRuntime.id: "codex"` ở cấp nhà cung cấp hoặc mô hình                       | Cấu hình mô hình/nhà cung cấp OpenClaw |
| Dùng lưu lượng OpenAI API trực tiếp    | `agentRuntime.id: "openclaw"` ở cấp nhà cung cấp hoặc mô hình với xác thực OpenAI thông thường | Cấu hình mô hình/nhà cung cấp OpenClaw |
| Tinh chỉnh hành vi app-server          | `plugins.entries.codex.config.appServer.*`                                       | Cấu hình Plugin Codex              |
| Bật các ứng dụng Plugin Codex gốc      | `plugins.entries.codex.config.codexPlugins.*`                                    | Cấu hình Plugin Codex              |
| Bật Codex Computer Use                 | `plugins.entries.codex.config.computerUse.*`                                     | Cấu hình Plugin Codex              |

Dùng các tham chiếu mô hình `openai/gpt-*` cho các lượt agent OpenAI được Codex hỗ trợ. Ưu tiên
`auth.order.openai` cho thứ tự ưu tiên đăng ký trước/API-key dự phòng. Các
id hồ sơ xác thực Codex cũ hiện có và thứ tự xác thực Codex cũ là
trạng thái kế thừa chỉ dành cho doctor; không ghi các tham chiếu Codex GPT cũ mới.

Không đặt `compaction.model` hoặc `compaction.provider` trên các agent được Codex hỗ trợ.
Codex compaction thông qua trạng thái luồng app-server gốc của nó, nên OpenClaw bỏ qua
các ghi đè summarizer cục bộ đó khi chạy runtime và `openclaw doctor --fix` xóa
chúng khi agent dùng Codex.

Lossless vẫn được hỗ trợ như một context engine cho việc lắp ráp, nạp dữ liệu và
bảo trì quanh các lượt Codex. Cấu hình nó thông qua
`plugins.slots.contextEngine: "lossless-claw"` và
`plugins.entries.lossless-claw.config.summaryModel`, không phải thông qua
`agents.defaults.compaction.provider`. `openclaw doctor --fix` di trú hình dạng cũ
`compaction.provider: "lossless-claw"` sang slot context-engine Lossless
khi Codex là runtime đang hoạt động, nhưng Codex gốc vẫn sở hữu compaction.

Harness Codex app-server gốc hỗ trợ các context engine yêu cầu
lắp ráp trước prompt. Các backend CLI chung, bao gồm `codex-cli`, không cung cấp
khả năng host đó.

Với các agent được Codex hỗ trợ, `/compact` khởi động compaction Codex app-server gốc trên
luồng đã được ràng buộc. OpenClaw không chờ hoàn tất, áp đặt timeout OpenClaw,
khởi động lại app-server dùng chung, hoặc fallback sang context-engine hay
summarizer OpenAI công khai. Nếu ràng buộc luồng Codex gốc bị thiếu hoặc
đã cũ, lệnh sẽ đóng khi lỗi để operator thấy ranh giới runtime thật
thay vì âm thầm chuyển backend compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Ở hình dạng đó, cả hai hồ sơ vẫn chạy qua Codex cho các lượt agent
`openai/gpt-*`. API key chỉ là một fallback xác thực, không phải yêu cầu chuyển sang OpenClaw hoặc
OpenAI Responses thuần.

Phần còn lại của trang này trình bày các biến thể phổ biến mà người dùng phải chọn giữa:
hình dạng triển khai, định tuyến đóng khi lỗi, chính sách phê duyệt guardian, các Plugin Codex
gốc và Computer Use. Để xem danh sách tùy chọn đầy đủ, mặc định, enum, khám phá,
cô lập môi trường, timeout và các trường vận chuyển app-server, xem
[Tham khảo harness Codex](/vi/plugins/codex-harness-reference).

## Xác minh runtime Codex

Dùng `/status` trong chat nơi bạn kỳ vọng Codex. Một lượt agent OpenAI được Codex hỗ trợ
sẽ hiển thị:

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

- Dùng `openai/gpt-*` cho các lượt agent OpenAI qua Codex.
- Không dùng các tham chiếu Codex GPT cũ trong cấu hình. Chạy `openclaw doctor --fix` để
  sửa các tham chiếu cũ và các ghim định tuyến phiên đã cũ.
- `agentRuntime.id: "codex"` là tùy chọn cho chế độ tự động OpenAI thông thường, nhưng hữu ích
  khi một triển khai phải đóng khi Codex không khả dụng.
- `agentRuntime.id: "openclaw"` chọn cho một nhà cung cấp hoặc mô hình dùng runtime
  nhúng OpenClaw khi đó là chủ ý.
- `/codex ...` điều khiển các cuộc hội thoại Codex app-server gốc từ chat.
- ACP/acpx là một đường dẫn harness bên ngoài riêng biệt. Chỉ dùng nó khi người dùng yêu cầu
  ACP/acpx hoặc một adapter harness bên ngoài.

Định tuyến lệnh phổ biến:

| Ý định của người dùng                                  | Dùng                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Đính kèm chat hiện tại                                 | `/codex bind [--cwd <path>]`                                                                          |
| Tiếp tục một luồng Codex hiện có                       | `/codex resume <thread-id>`                                                                           |
| Liệt kê hoặc lọc các luồng Codex                       | `/codex threads [filter]`                                                                             |
| Liệt kê các Plugin Codex gốc                           | `/codex plugins list`                                                                                 |
| Bật hoặc tắt một Plugin Codex gốc đã cấu hình          | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Đính kèm một phiên Codex CLI hiện có trên node đã ghép cặp | `/codex sessions --host <node> [filter]`, rồi `/codex resume <session-id> --host <node> --bind here` |
| Chỉ gửi phản hồi Codex                                 | `/codex diagnostics [note]`                                                                           |
| Bắt đầu một tác vụ ACP/acpx                            | Các lệnh phiên ACP/acpx, không phải `/codex`                                                          |

| Trường hợp sử dụng                                  | Cấu hình                                                               | Xác minh                                | Ghi chú                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------- |
| Gói đăng ký ChatGPT/Codex với thời gian chạy Codex gốc | `openai/gpt-*` cộng với plugin `codex` đã bật                          | `/status` hiển thị `Runtime: OpenAI Codex` | Đường dẫn được khuyến nghị                |
| Đóng khi lỗi nếu Codex không khả dụng                | Nhà cung cấp hoặc mô hình `agentRuntime.id: "codex"`                   | Lượt chạy thất bại thay vì fallback nhúng | Dùng cho các triển khai chỉ dùng Codex    |
| Lưu lượng API key OpenAI trực tiếp qua OpenClaw      | Nhà cung cấp hoặc mô hình `agentRuntime.id: "openclaw"` và xác thực OpenAI bình thường | `/status` hiển thị thời gian chạy OpenClaw | Chỉ dùng khi OpenClaw là chủ đích         |
| Cấu hình cũ                                         | tham chiếu GPT Codex cũ                                                | `openclaw doctor --fix` viết lại nó     | Không viết cấu hình mới theo cách này     |
| Bộ chuyển tiếp Codex ACP/acpx                       | ACP `sessions_spawn({ runtime: "acp" })`                               | Trạng thái tác vụ/phiên ACP             | Tách biệt với harness Codex gốc           |

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng `openai/gpt-*`
cho tuyến OpenAI bình thường và `codex/gpt-*` chỉ khi khả năng hiểu hình ảnh
cần chạy qua một lượt máy chủ ứng dụng Codex có giới hạn. Không dùng
tham chiếu GPT Codex cũ; doctor viết lại tiền tố cũ đó thành `openai/gpt-*`.

## Mẫu triển khai

### Triển khai Codex cơ bản

Dùng cấu hình khởi động nhanh khi tất cả lượt tác tử OpenAI nên mặc định dùng
Codex.

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

Với cấu hình này, tác tử `main` dùng đường dẫn nhà cung cấp bình thường của nó và
tác tử `codex` dùng máy chủ ứng dụng Codex.

### Triển khai Codex đóng khi lỗi

Đối với lượt tác tử OpenAI, `openai/gpt-*` đã phân giải sang Codex khi
plugin đi kèm có sẵn. Thêm chính sách thời gian chạy rõ ràng khi bạn muốn có
quy tắc đóng khi lỗi được ghi ra:

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

Khi Codex bị bắt buộc, OpenClaw thất bại sớm nếu plugin Codex bị tắt, máy chủ
ứng dụng quá cũ, hoặc máy chủ ứng dụng không thể khởi động.

## Chính sách máy chủ ứng dụng

Theo mặc định, plugin khởi động nhị phân Codex do OpenClaw quản lý ở cục bộ với
truyền tải stdio. Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một
tệp thực thi khác. Chỉ dùng truyền tải WebSocket khi một máy chủ ứng dụng đã
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

Các phiên máy chủ ứng dụng stdio cục bộ mặc định theo thế vận hành cục bộ đáng tin cậy:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Nếu yêu cầu Codex cục bộ không cho phép
thế YOLO ngầm định đó, OpenClaw sẽ chọn quyền guardian được phép thay vào đó.
Khi sandbox OpenClaw đang hoạt động cho phiên, OpenClaw tắt Code Mode gốc của
Codex, máy chủ MCP người dùng, và thực thi plugin dựa trên ứng dụng cho lượt đó
thay vì dựa vào sandbox phía máy chủ Codex. Quyền truy cập shell được cung cấp
thông qua các công cụ động dựa trên sandbox của OpenClaw như `sandbox_exec` và
`sandbox_process` khi các công cụ exec/process bình thường có sẵn.

Dùng chế độ exec OpenClaw đã chuẩn hóa khi bạn muốn auto-review gốc của Codex trước
các lần thoát sandbox hoặc quyền bổ sung:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Đối với các phiên máy chủ ứng dụng Codex, OpenClaw ánh xạ `tools.exec.mode: "auto"` sang các phê duyệt
do Codex Guardian xem xét, thường là
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, và
`sandbox: "workspace-write"` khi yêu cầu cục bộ cho phép các giá trị đó.
Trong `tools.exec.mode: "auto"`, OpenClaw không giữ lại các ghi đè Codex cũ không an toàn
`approvalPolicy: "never"` hoặc `sandbox: "danger-full-access"`; dùng
`tools.exec.mode: "full"` cho một thế Codex không cần phê duyệt có chủ đích. Preset cũ
`plugins.entries.codex.config.appServer.mode: "guardian"` vẫn hoạt động, nhưng
`tools.exec.mode: "auto"` là bề mặt OpenClaw đã chuẩn hóa.

Để xem phần so sánh theo cấp độ chế độ với phê duyệt exec trên máy chủ và quyền ACPX,
xem [Chế độ quyền](/vi/tools/permission-modes).

Để biết mọi trường máy chủ ứng dụng, thứ tự xác thực, cô lập môi trường, khám phá và
hành vi timeout, xem [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference).

## Lệnh và chẩn đoán

Plugin đi kèm đăng ký `/codex` làm lệnh slash trên bất kỳ kênh nào
hỗ trợ lệnh văn bản OpenClaw.

Thực thi và điều khiển gốc yêu cầu một chủ sở hữu hoặc máy khách Gateway
`operator.admin`. Điều này bao gồm liên kết hoặc tiếp tục luồng, gửi hoặc dừng lượt,
thay đổi mô hình, chế độ nhanh, hoặc trạng thái quyền, compact hoặc review, và
tách liên kết. Những người gửi được ủy quyền khác vẫn giữ các lệnh chỉ đọc về trạng thái,
trợ giúp, tài khoản, mô hình, luồng, máy chủ MCP, skill, và kiểm tra liên kết.

Các dạng thường dùng:

- `/codex status` kiểm tra kết nối máy chủ ứng dụng, mô hình, tài khoản, giới hạn tốc độ,
  máy chủ MCP, và skills.
- `/codex models` liệt kê các mô hình máy chủ ứng dụng Codex trực tiếp.
- `/codex threads [filter]` liệt kê các luồng máy chủ ứng dụng Codex gần đây.
- `/codex resume <thread-id>` gắn phiên OpenClaw hiện tại vào một
  luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex compact luồng đã gắn.
- `/codex review` bắt đầu review gốc của Codex cho luồng đã gắn.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi Codex cho
  luồng đã gắn.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê skills của máy chủ ứng dụng Codex.

Đối với hầu hết báo cáo hỗ trợ, hãy bắt đầu bằng `/diagnostics [note]` trong cuộc trò chuyện
nơi lỗi xảy ra. Nó tạo một báo cáo chẩn đoán Gateway và, đối với các phiên
harness Codex, yêu cầu phê duyệt để gửi gói phản hồi Codex liên quan.
Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết mô hình quyền riêng tư và hành vi
trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex lên
cho luồng hiện đang gắn mà không có toàn bộ gói chẩn đoán Gateway.

### Kiểm tra luồng Codex cục bộ

Cách nhanh nhất để kiểm tra một lượt chạy Codex lỗi thường là mở trực tiếp
luồng Codex gốc:

```bash
codex resume <thread-id>
```

Lấy id luồng từ phản hồi `/diagnostics` đã hoàn tất, `/codex binding`, hoặc
`/codex threads [filter]`.

Để biết cơ chế tải lên và ranh giới chẩn đoán cấp thời gian chạy, xem
[Thời gian chạy harness Codex](/vi/plugins/codex-harness-runtime#codex-feedback-upload).

Xác thực được chọn theo thứ tự này:

1. Hồ sơ xác thực OpenAI đã sắp thứ tự cho tác tử, ưu tiên dưới
   `auth.order.openai`. Chạy `openclaw doctor --fix` để di trú các
   id hồ sơ xác thực Codex cũ và thứ tự xác thực Codex cũ.
2. Tài khoản hiện có của máy chủ ứng dụng trong Codex home của tác tử đó.
3. Chỉ với các lần khởi chạy máy chủ ứng dụng stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản máy chủ ứng dụng và xác thực OpenAI
   vẫn được yêu cầu.

Khi OpenClaw thấy hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều đó
giữ các API key cấp Gateway sẵn dùng cho embeddings hoặc mô hình OpenAI trực tiếp
mà không làm các lượt máy chủ ứng dụng Codex gốc vô tình tính phí qua API.
Hồ sơ API key Codex rõ ràng và fallback khóa env stdio cục bộ dùng đăng nhập
máy chủ ứng dụng thay vì env tiến trình con được kế thừa. Kết nối máy chủ ứng dụng
WebSocket không nhận fallback API key env Gateway; dùng hồ sơ xác thực rõ ràng hoặc
tài khoản riêng của máy chủ ứng dụng từ xa.
Khi các plugin Codex gốc được cấu hình, OpenClaw cài đặt hoặc làm mới các
plugin đó thông qua máy chủ ứng dụng đã kết nối trước khi cung cấp các ứng dụng do plugin sở hữu cho
luồng Codex. `app/list` vẫn là nguồn chân lý cho id ứng dụng,
khả năng truy cập, và siêu dữ liệu, nhưng OpenClaw sở hữu quyết định bật theo luồng:
nếu chính sách cho phép một ứng dụng có thể truy cập được liệt kê, OpenClaw gửi
`thread/start.config.apps[appId].enabled = true` ngay cả khi `app/list` hiện
báo rằng ứng dụng đó bị tắt. Đường dẫn này không tự tạo cài đặt ứng dụng cho
id không xác định; OpenClaw chỉ kích hoạt plugin marketplace bằng `plugin/install`
rồi làm mới inventory.

Nếu hồ sơ gói đăng ký chạm giới hạn sử dụng Codex, OpenClaw ghi lại thời gian đặt lại
khi Codex báo cáo và thử hồ sơ xác thực tiếp theo đã sắp thứ tự cho cùng một
lượt chạy Codex. Khi thời gian đặt lại qua đi, hồ sơ gói đăng ký lại đủ điều kiện
mà không thay đổi mô hình `openai/gpt-*` đã chọn hoặc thời gian chạy Codex.

Đối với các lần khởi chạy máy chủ ứng dụng stdio cục bộ, OpenClaw đặt `CODEX_HOME` thành một thư mục
riêng cho từng tác tử để cấu hình Codex, tệp xác thực/tài khoản, cache/dữ liệu plugin, và
trạng thái luồng gốc không đọc hoặc ghi vào `~/.codex` cá nhân của người vận hành theo
mặc định. OpenClaw giữ nguyên tiến trình `HOME` bình thường; các tiến trình con do Codex chạy
vẫn có thể tìm thấy cấu hình và token trong home người dùng, và Codex có thể phát hiện các mục
`$HOME/.agents/skills` và `$HOME/.agents/plugins/marketplace.json` dùng chung.

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
OpenClaw xóa `CODEX_HOME` và `HOME` khỏi danh sách này trong quá trình chuẩn hóa khởi chạy cục bộ:
`CODEX_HOME` vẫn theo từng tác tử, và `HOME` vẫn được kế thừa để
các tiến trình con có thể dùng trạng thái home người dùng bình thường.

Codex dynamic tools mặc định dùng kiểu tải `searchable`. OpenClaw không cung cấp
dynamic tools trùng lặp với các thao tác workspace gốc của Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, và `update_plan`. Phần lớn các công cụ
tích hợp OpenClaw còn lại như nhắn tin, phương tiện, cron, trình duyệt, nút,
gateway, và `heartbeat_respond` có sẵn qua tìm kiếm công cụ của Codex trong
namespace `openclaw`, giúp ngữ cảnh mô hình ban đầu nhỏ hơn. Tìm kiếm web
mặc định dùng công cụ `web_search` được lưu trữ của Codex khi tìm kiếm được bật
và không có provider được quản lý nào được chọn. Tìm kiếm được lưu trữ gốc và
dynamic tool `web_search` được quản lý của OpenClaw loại trừ lẫn nhau để tìm kiếm
được quản lý không thể bỏ qua các hạn chế miền gốc. OpenClaw dùng công cụ được
quản lý khi tìm kiếm được lưu trữ không khả dụng, bị tắt rõ ràng, hoặc được thay
bằng một provider được quản lý đã chọn. OpenClaw giữ extension `web.run` độc lập
của Codex ở trạng thái tắt vì lưu lượng app-server production từ chối namespace
`web` do người dùng định nghĩa của nó. `tools.web.search.enabled: false` tắt cả
hai đường dẫn, cũng như các lượt chạy chỉ dùng LLM với công cụ bị tắt. Codex xem
`"cached"` là một tùy chọn ưu tiên và phân giải nó thành quyền truy cập bên ngoài
trực tiếp cho các lượt app-server không bị hạn chế. Cơ chế dự phòng được quản lý
tự động thất bại đóng khi `allowedDomains` gốc được đặt để không thể bỏ qua
allowlist. Các thay đổi chính sách tìm kiếm hiệu dụng bền vững sẽ xoay vòng
luồng Codex đã ràng buộc trước lượt tiếp theo. Các hạn chế tạm thời theo từng
lượt dùng một luồng bị hạn chế tạm thời và giữ nguyên ràng buộc hiện có để tiếp
tục lại sau. `sessions_yield` và các phản hồi nguồn chỉ dùng công cụ nhắn tin
vẫn đi trực tiếp vì đó là các hợp đồng điều khiển lượt. `sessions_spawn` vẫn ở
dạng searchable để `spawn_agent` gốc của Codex vẫn là bề mặt subagent Codex
chính, trong khi ủy quyền OpenClaw hoặc ACP rõ ràng vẫn có sẵn qua namespace
dynamic tool `openclaw`. Hướng dẫn cộng tác Heartbeat yêu cầu Codex tìm
`heartbeat_respond` trước khi kết thúc một lượt heartbeat khi công cụ này chưa
được tải.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối tới một app-server Codex
tùy chỉnh không thể tìm kiếm dynamic tools được hoãn tải hoặc khi gỡ lỗi toàn bộ
payload công cụ.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định       | Ý nghĩa                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Dùng `"direct"` để đưa dynamic tools của OpenClaw trực tiếp vào ngữ cảnh công cụ Codex ban đầu. |
| `codexDynamicToolsExclude` | `[]`           | Tên dynamic tool OpenClaw bổ sung cần bỏ qua khỏi các lượt app-server Codex.              |
| `codexPlugins`             | đã tắt         | Hỗ trợ plugin/app Codex gốc cho các curated plugins đã di chuyển và được cài từ nguồn.   |

Các trường `appServer` được hỗ trợ:

| Trường                                        | Mặc định                                              | Ý nghĩa                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                                                                                                                                                                   |
| `command`                                     | tệp nhị phân Codex được quản lý                       | Tệp thực thi cho stdio transport. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt giá trị này khi cần ghi đè rõ ràng.                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho stdio transport.                                                                                                                                                                                                                                                                                                                                                                   |
| `url`                                         | chưa đặt                                              | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                     |
| `authToken`                                   | chưa đặt                                              | Bearer token cho WebSocket transport. Chấp nhận chuỗi trực tiếp hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                   | Header WebSocket bổ sung. Giá trị header chấp nhận chuỗi trực tiếp hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                          |
| `clearEnv`                                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình stdio app-server được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa. OpenClaw giữ `CODEX_HOME` theo từng agent và `HOME` kế thừa cho các lần khởi chạy cục bộ.                                                                                                                                                                   |
| `codeModeOnly`                                | `false`                                                | Chọn dùng bề mặt công cụ chỉ dành cho chế độ mã của Codex. Các công cụ động của OpenClaw vẫn được đăng ký với Codex để các lệnh gọi `tools.*` lồng nhau trả về qua cầu nối `item/tool/call` của app-server.                                                                                                                                                                                   |
| `remoteWorkspaceRoot`                         | chưa đặt                                              | Gốc workspace app-server Codex từ xa. Khi được đặt, OpenClaw suy ra gốc workspace cục bộ từ workspace OpenClaw đã phân giải, giữ nguyên hậu tố cwd hiện tại dưới gốc từ xa này, và chỉ gửi cwd app-server cuối cùng tới Codex. Nếu cwd nằm ngoài gốc workspace OpenClaw đã phân giải, OpenClaw sẽ fail closed thay vì gửi đường dẫn cục bộ của gateway tới app-server từ xa.                 |
| `requestTimeoutMs`                            | `60000`                                                | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Khoảng lặng sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server trong phạm vi lượt trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Bộ bảo vệ trạng thái nhàn rỗi khi hoàn tất và tiến độ được dùng sau khi bàn giao công cụ, hoàn tất công cụ gốc, tiến độ assistant thô sau công cụ, hoàn tất reasoning thô, hoặc tiến độ reasoning trong khi OpenClaw chờ `turn/completed`. Dùng giá trị này cho workload đáng tin cậy hoặc nặng khi tổng hợp sau công cụ có thể hợp lệ im lặng lâu hơn ngân sách phát hành assistant cuối cùng. |
| `mode`                                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc thực thi được guardian xem xét. Các yêu cầu stdio cục bộ bỏ qua `danger-full-access`, phê duyệt `never`, hoặc reviewer `user` sẽ khiến mặc định ngầm định là guardian.                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` hoặc một chính sách phê duyệt guardian được phép | Chính sách phê duyệt Codex gốc được gửi tới thread start/resume/turn. Mặc định guardian ưu tiên `"on-request"` khi được phép.                                                                                                                                                                                                                                                                 |
| `sandbox`                                     | `"danger-full-access"` hoặc một sandbox guardian được phép | Chế độ sandbox Codex gốc được gửi tới thread start/resume. Mặc định guardian ưu tiên `"workspace-write"` khi được phép, nếu không thì `"read-only"`. Khi sandbox OpenClaw đang hoạt động, các lượt `danger-full-access` dùng Codex `workspace-write` với quyền truy cập mạng được suy ra từ thiết lập egress của sandbox OpenClaw.                                                            |
| `approvalsReviewer`                           | `"user"` hoặc một reviewer guardian được phép          | Dùng `"auto_review"` để cho Codex xem xét các lời nhắc phê duyệt gốc khi được phép, nếu không thì `guardian_subagent` hoặc `user`. `guardian_subagent` vẫn là alias kế thừa.                                                                                                                                                                                                                  |
| `serviceTier`                                 | chưa đặt                                              | Tầng dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến fast-mode, `"flex"` yêu cầu xử lý flex, `null` xóa ghi đè, và `"fast"` kế thừa được chấp nhận như `"priority"`.                                                                                                                                                                                                           |
| `networkProxy`                                | đã tắt                                                | Chọn dùng mạng theo permissions-profile của Codex cho các lệnh app-server. OpenClaw định nghĩa cấu hình `permissions.<profile>.network` đã chọn và chọn nó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                                  |
| `experimental.sandboxExecServer`              | `false`                                                | Tùy chọn thử nghiệm preview đăng ký một môi trường Codex được backing bằng sandbox OpenClaw với Codex app-server 0.132.0 hoặc mới hơn để thực thi Codex gốc có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                            |

`appServer.networkProxy` là rõ ràng vì nó thay đổi hợp đồng sandbox của Codex.
Khi được bật, OpenClaw cũng đặt `features.network_proxy.enabled` và
`default_permissions` trong cấu hình thread Codex để permission profile được tạo
có thể khởi động mạng do Codex quản lý. Theo mặc định, OpenClaw tạo tên profile
`openclaw-network-<fingerprint>` chống va chạm từ phần thân profile; chỉ dùng
`profileName` khi cần một tên cục bộ ổn định.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Nếu runtime app-server thông thường sẽ là `danger-full-access`, việc bật
`networkProxy` sẽ dùng quyền truy cập hệ thống tệp kiểu workspace cho permission
profile được tạo. Cơ chế thực thi mạng do Codex quản lý là mạng được sandbox,
nên một profile full-access sẽ không bảo vệ lưu lượng đi ra.
Các mục miền dùng `allow` hoặc `deny`; các mục Unix socket dùng giá trị
`allow` hoặc `none` của Codex.

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: các yêu cầu Codex `item/tool/call` mặc định dùng
bộ giám sát OpenClaw 90 giây. Một đối số `timeoutMs` dương cho từng lệnh gọi sẽ
kéo dài hoặc rút ngắn ngân sách của công cụ cụ thể đó. Công cụ `image_generate`
dùng `agents.defaults.imageGenerationModel.timeoutMs` khi lệnh gọi công cụ không
cung cấp thời gian chờ riêng, hoặc mặc định tạo ảnh 120 giây trong các trường
hợp khác. Công cụ `image` để hiểu nội dung media dùng
`tools.media.image.timeoutSeconds` hoặc mặc định media 60 giây. Với hiểu nội
dung ảnh, thời gian chờ đó áp dụng cho chính yêu cầu và không bị giảm bởi công
việc chuẩn bị trước đó. Ngân sách công cụ động được giới hạn tối đa ở 600000 ms.
Khi hết thời gian chờ, OpenClaw hủy tín hiệu công cụ ở nơi được hỗ trợ và trả
về phản hồi công cụ động thất bại cho Codex để lượt có thể tiếp tục thay vì để
phiên ở trạng thái `processing`. Bộ giám sát này là ngân sách `item/tool/call`
động bên ngoài; thời gian chờ yêu cầu dành riêng cho provider chạy bên trong
lệnh gọi đó và giữ nguyên ngữ nghĩa thời gian chờ riêng.

Sau khi Codex chấp nhận một lượt, và sau khi OpenClaw phản hồi một yêu cầu
máy chủ ứng dụng theo phạm vi lượt, harness kỳ vọng Codex tạo tiến triển cho
lượt hiện tại và cuối cùng kết thúc lượt gốc bằng `turn/completed`. Nếu máy chủ
ứng dụng im lặng trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw cố
gắng ngắt lượt Codex, ghi lại chẩn đoán hết thời gian chờ và giải phóng làn
phiên OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một lượt
gốc đã cũ. Hầu hết thông báo chưa kết thúc cho cùng lượt sẽ tắt bộ giám sát
ngắn đó vì Codex đã chứng minh lượt vẫn còn hoạt động. Các lần bàn giao công cụ
dùng ngân sách nhàn rỗi sau công cụ dài hơn: sau khi OpenClaw trả về phản hồi
`item/tool/call`, sau khi các mục công cụ gốc như `commandExecution` hoàn tất,
sau khi các hoàn tất `custom_tool_call_output` thô, và sau tiến triển trợ lý
thô sau công cụ, hoàn tất lập luận thô, hoặc tiến triển lập luận. Bộ bảo vệ dùng
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình và
mặc định là năm phút trong các trường hợp khác. Cùng ngân sách sau công cụ đó
cũng kéo dài bộ giám sát tiến triển cho cửa sổ tổng hợp im lặng trước khi Codex
phát sự kiện lượt hiện tại tiếp theo. Các thông báo máy chủ ứng dụng toàn cục,
chẳng hạn như cập nhật giới hạn tốc độ, không đặt lại tiến triển nhàn rỗi của
lượt. Các hoàn tất lập luận, hoàn tất `agentMessage` commentary, và tiến triển
lập luận thô hoặc trợ lý thô trước công cụ có thể được theo sau bởi một phản
hồi cuối tự động, vì vậy chúng dùng bộ bảo vệ phản hồi sau tiến triển thay vì
giải phóng làn phiên ngay lập tức. Chỉ các mục `agentMessage` đã hoàn tất kiểu
cuối/không phải commentary và các hoàn tất trợ lý thô trước công cụ mới kích
hoạt cơ chế giải phóng đầu ra trợ lý: nếu Codex sau đó im lặng mà không có
`turn/completed`, OpenClaw cố gắng ngắt lượt gốc và giải phóng làn phiên. Nếu
một bộ theo dõi lượt khác thắng cuộc đua giải phóng đó, OpenClaw vẫn chấp nhận
mục trợ lý cuối đã hoàn tất khi không còn yêu cầu gốc, mục, hoặc hoàn tất công
cụ động nào đang hoạt động và cơ chế giải phóng đầu ra trợ lý vẫn thuộc về mục
đã hoàn tất mới nhất, không có hoàn tất mục nào muộn hơn. Điều này có thể giữ
lại câu trả lời cuối sau công việc công cụ đã hoàn tất mà không phát lại lượt.
Các delta trợ lý một phần, phản hồi cũ trước đó, và các hoàn tất rỗng sau đó
không đủ điều kiện. Các lỗi máy chủ ứng dụng stdio an toàn để phát lại, bao gồm
hết thời gian chờ hoàn tất lượt mà không có bằng chứng về trợ lý, công cụ, mục
đang hoạt động, hoặc tác dụng phụ, được thử lại một lần trên một lần thử máy
chủ ứng dụng mới. Các thời gian chờ không an toàn vẫn cho máy khách máy chủ ứng
dụng bị kẹt nghỉ hưu và giải phóng làn phiên OpenClaw. Chúng cũng xóa liên kết
luồng gốc đã cũ thay vì tự động phát lại. Thời gian chờ theo dõi hoàn tất hiển
thị văn bản thời gian chờ dành riêng cho Codex: các trường hợp an toàn để phát
lại nói rằng phản hồi có thể chưa hoàn chỉnh, trong khi các trường hợp không an
toàn yêu cầu người dùng xác minh trạng thái hiện tại trước khi thử lại. Chẩn
đoán thời gian chờ công khai bao gồm các trường cấu trúc như phương thức thông
báo máy chủ ứng dụng cuối cùng, id/kiểu/vai trò mục phản hồi trợ lý thô, số
lượng yêu cầu/mục đang hoạt động, và trạng thái theo dõi đã được kích hoạt. Khi
thông báo cuối là một mục phản hồi trợ lý thô, chúng cũng bao gồm bản xem trước
văn bản trợ lý có giới hạn. Chúng không bao gồm prompt thô hoặc nội dung công
cụ.

Các ghi đè môi trường vẫn có sẵn cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua binary được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị xóa. Thay vào đó, hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được rà soát với phần còn lại của thiết lập harness Codex.

## Plugin Codex gốc

Hỗ trợ Plugin Codex gốc dùng các năng lực ứng dụng và Plugin riêng của máy chủ
ứng dụng Codex trong cùng luồng Codex với lượt harness OpenClaw. OpenClaw không
dịch các Plugin Codex thành các công cụ động OpenClaw `codex_plugin_*` giả lập.

`codexPlugins` chỉ ảnh hưởng đến các phiên chọn harness Codex gốc. Nó không có
tác dụng với các lượt chạy harness tích hợp sẵn, lượt chạy provider OpenAI
thông thường, liên kết hội thoại ACP, hoặc các harness khác.

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

Cấu hình ứng dụng luồng được tính khi OpenClaw thiết lập một phiên harness Codex
hoặc thay thế một liên kết luồng Codex đã cũ. Nó không được tính lại ở mỗi lượt.
Sau khi thay đổi `codexPlugins`, hãy dùng `/new`, `/reset`, hoặc khởi động lại
gateway để các phiên harness Codex trong tương lai bắt đầu với bộ ứng dụng đã
cập nhật.

Để biết điều kiện di chuyển, inventory ứng dụng, chính sách hành động phá hủy,
elicitations, và chẩn đoán Plugin gốc, xem
[Plugin Codex gốc](/vi/plugins/codex-native-plugins).

Quyền truy cập ứng dụng và Plugin phía OpenAI được kiểm soát bởi tài khoản
Codex đã đăng nhập và, với workspace Business và Enterprise/Edu, bởi các kiểm
soát ứng dụng của workspace. Xem
[Sử dụng Codex với gói ChatGPT của bạn](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
để biết tổng quan của OpenAI về tài khoản và kiểm soát workspace.

## Sử dụng máy tính

Sử dụng máy tính được trình bày trong hướng dẫn thiết lập riêng:
[Sử dụng máy tính Codex](/vi/plugins/codex-computer-use).

Bản tóm tắt: OpenClaw không đóng gói sẵn ứng dụng điều khiển desktop hoặc tự
thực thi các hành động desktop. Nó chuẩn bị máy chủ ứng dụng Codex, xác minh
rằng máy chủ MCP `computer-use` khả dụng, rồi để Codex sở hữu các lệnh gọi công
cụ MCP gốc trong các lượt chế độ Codex.

## Ranh giới runtime

Harness Codex chỉ thay đổi trình thực thi agent nhúng cấp thấp.

- Các công cụ động OpenClaw được hỗ trợ. Codex yêu cầu OpenClaw thực thi các
  công cụ đó, nên OpenClaw vẫn nằm trong đường thực thi.
- Shell, patch, MCP và công cụ ứng dụng gốc của Codex do Codex sở hữu.
  OpenClaw có thể quan sát hoặc chặn các sự kiện gốc được chọn thông qua cơ chế
  relay được hỗ trợ, nhưng nó không viết lại đối số công cụ gốc.
- Codex sở hữu Compaction gốc. OpenClaw giữ một bản sao transcript cho lịch sử
  kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi model hoặc harness trong
  tương lai, nhưng nó không thay thế Compaction của Codex bằng một trình tóm
  tắt OpenClaw hoặc context-engine.
- Tạo media, hiểu media, TTS, phê duyệt, và đầu ra công cụ nhắn tin tiếp tục đi
  qua các thiết lập provider/model OpenClaw tương ứng.
- `tool_result_persist` áp dụng cho kết quả công cụ transcript do OpenClaw sở
  hữu, không áp dụng cho các bản ghi kết quả công cụ gốc của Codex.

Để biết các lớp hook, bề mặt V1 được hỗ trợ, xử lý quyền gốc, điều hướng hàng
đợi, cơ chế tải phản hồi Codex lên, và chi tiết Compaction, xem
[Runtime harness Codex](/vi/plugins/codex-harness-runtime).

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` thông thường:** điều này là
đúng với cấu hình mới. Chọn một model `openai/gpt-*`, bật
`plugins.entries.codex.enabled`, và kiểm tra xem `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng harness tích hợp sẵn thay vì Codex:** hãy bảo đảm tham chiếu model là
`openai/gpt-*` trên provider OpenAI chính thức và Plugin Codex đã được cài đặt
và bật. Nếu bạn cần bằng chứng nghiêm ngặt khi kiểm thử, hãy đặt provider hoặc
model `agentRuntime.id: "codex"`. Runtime Codex bị ép buộc sẽ thất bại thay vì
fallback về OpenClaw.

**Runtime OpenAI Codex fallback về đường dẫn API-key:** thu thập một đoạn trích
gateway đã biên tập ẩn thông tin nhạy cảm, thể hiện model, runtime, provider đã
chọn, và lỗi. Yêu cầu cộng tác viên bị ảnh hưởng chạy lệnh chỉ đọc này trên máy
chủ OpenClaw của họ:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Các đoạn trích hữu ích thường bao gồm `openai/gpt-5.5` hoặc `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` hoặc `harnessRuntime`,
`candidateProvider: "openai"`, và kết quả `401`, `Incorrect API key`, hoặc
`No API key`. Một lượt chạy đã sửa đúng sẽ hiển thị đường dẫn OpenAI OAuth thay
vì lỗi OpenAI API-key thuần túy.

**Cấu hình tham chiếu model Codex cũ vẫn còn:** chạy `openclaw doctor --fix`.
Doctor viết lại tham chiếu model cũ thành `openai/*`, xóa ghim runtime phiên đã
cũ và ghim runtime toàn agent, đồng thời giữ nguyên các ghi đè hồ sơ xác thực
hiện có.

**Máy chủ ứng dụng bị từ chối:** dùng máy chủ ứng dụng Codex `0.125.0` hoặc mới
hơn. Các bản prerelease cùng phiên bản hoặc phiên bản có hậu tố build như
`0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì OpenClaw kiểm tra sàn
giao thức ổn định `0.125.0`.

**`/codex status` không thể kết nối:** kiểm tra rằng Plugin `codex` được đóng
gói sẵn đã được bật, rằng `plugins.allow` bao gồm nó khi allowlist được cấu
hình, và rằng mọi `appServer.command`, `url`, `authToken`, hoặc header tùy
chỉnh đều hợp lệ.

**Khám phá model chậm:** giảm
`plugins.entries.codex.config.discovery.timeoutMs` hoặc tắt khám phá. Xem
[Tham chiếu harness Codex](/vi/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`,
`authToken`, headers, và rằng máy chủ ứng dụng từ xa nói cùng phiên bản giao
thức máy chủ ứng dụng Codex.

**Công cụ shell gốc hoặc công cụ patch bị chặn với `Native hook relay unavailable`:**
luồng Codex vẫn đang cố dùng một id chuyển tiếp hook gốc mà OpenClaw không còn
đăng ký. Đây là sự cố truyền tải hook Codex gốc, không phải lỗi backend ACP,
nhà cung cấp, GitHub, hay lệnh shell. Bắt đầu một phiên mới trong cuộc trò chuyện
bị ảnh hưởng bằng `/new` hoặc `/reset`, rồi thử lại một lệnh vô hại. Nếu lệnh đó
hoạt động một lần nhưng lệnh gọi công cụ gốc tiếp theo lại thất bại, chỉ xem
`/new` là giải pháp tạm thời: sao chép prompt vào một phiên mới sau khi khởi động
lại máy chủ ứng dụng Codex hoặc OpenClaw Gateway để các luồng cũ bị loại bỏ và
các đăng ký hook gốc được tạo lại.

**Một mô hình không phải Codex dùng harness tích hợp sẵn:** điều đó là bình thường trừ khi
chính sách runtime của nhà cung cấp hoặc mô hình định tuyến nó tới một harness khác. Các ref
nhà cung cấp không phải OpenAI dạng thuần vẫn ở trên đường dẫn nhà cung cấp bình thường của chúng trong chế độ `auto`.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, hãy dùng quy trình khôi phục chuyển tiếp hook gốc ở trên. Xem
[Codex Computer Use](/vi/plugins/codex-computer-use#troubleshooting).

## Liên quan

- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Trợ giúp OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Hook Plugin](/vi/plugins/hooks)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Trạng thái](/vi/cli/status)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
