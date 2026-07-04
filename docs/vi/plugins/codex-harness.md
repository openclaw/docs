---
read_when:
    - Bạn muốn dùng harness app-server Codex được đóng gói sẵn
    - Bạn cần ví dụ cấu hình Codex harness
    - Bạn muốn các bản triển khai chỉ dùng Codex bị lỗi thay vì quay lại OpenClaw
summary: Chạy các lượt tác tử nhúng của OpenClaw thông qua harness app-server Codex đi kèm
title: Bộ harness Codex
x-i18n:
    generated_at: "2026-07-04T10:47:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` được đóng gói kèm cho phép OpenClaw chạy các lượt agent OpenAI nhúng
thông qua Codex app-server thay vì harness OpenClaw tích hợp sẵn.

Dùng harness Codex khi bạn muốn Codex sở hữu phiên agent cấp thấp:
tiếp tục luồng nguyên bản, tiếp tục công cụ nguyên bản, compaction nguyên bản và
thực thi app-server. OpenClaw vẫn sở hữu các kênh chat, tệp phiên, lựa chọn mô hình,
công cụ động của OpenClaw, phê duyệt, phân phối phương tiện và bản sao transcript
hiển thị.

Thiết lập thông thường dùng các tham chiếu mô hình OpenAI chuẩn như `openai/gpt-5.5`.
Không cấu hình các tham chiếu GPT Codex cũ. Đặt thứ tự xác thực agent OpenAI
trong `auth.order.openai`; các id hồ sơ xác thực Codex cũ hơn và
các mục thứ tự xác thực Codex cũ là trạng thái cũ được sửa bởi
`openclaw doctor --fix`.

Khi không có sandbox OpenClaw nào đang hoạt động, OpenClaw khởi động các luồng Codex app-server
với chế độ mã nguyên bản của Codex được bật, đồng thời mặc định để tắt chế độ chỉ-code-mode.
Điều đó giữ cho workspace nguyên bản và năng lực mã của Codex khả dụng trong khi
các công cụ động của OpenClaw tiếp tục đi qua cầu nối app-server `item/tool/call`.
Sandboxing OpenClaw đang hoạt động và chính sách công cụ bị hạn chế sẽ tắt hoàn toàn chế độ mã nguyên bản
trừ khi bạn chọn dùng đường dẫn exec-server sandbox thử nghiệm.

Tính năng Codex nguyên bản này tách biệt với
[chế độ mã OpenClaw](/vi/reference/code-mode), là runtime QuickJS-WASI cần chọn bật
cho các lượt chạy OpenClaw chung với một hình dạng đầu vào `exec` khác.

Để hiểu phân tách rộng hơn giữa mô hình/nhà cung cấp/runtime, hãy bắt đầu với
[Runtime agent](/vi/concepts/agent-runtimes). Tóm tắt ngắn gọn là:
`openai/gpt-5.5` là tham chiếu mô hình, `codex` là runtime, và Telegram,
Discord, Slack hoặc một kênh khác vẫn là bề mặt giao tiếp.

## Yêu cầu

- OpenClaw có sẵn Plugin `codex` được đóng gói kèm.
- Nếu cấu hình của bạn dùng `plugins.allow`, hãy thêm `codex`.
- Codex app-server `0.125.0` trở lên. Plugin được đóng gói kèm mặc định quản lý một
  binary Codex app-server tương thích, nên các lệnh `codex` cục bộ trên `PATH` không
  ảnh hưởng đến khởi động harness thông thường.
- Xác thực Codex khả dụng thông qua `openclaw models auth login --provider openai`,
  một tài khoản app-server trong Codex home của agent, hoặc một hồ sơ xác thực API-key
  Codex rõ ràng.

Để biết thứ tự ưu tiên xác thực, cách ly môi trường, lệnh app-server tùy chỉnh, khám phá mô hình
và tất cả trường cấu hình, xem
[Tham chiếu harness Codex](/vi/plugins/codex-harness-reference).

## Bắt đầu nhanh

Hầu hết người dùng muốn Codex trong OpenClaw sẽ muốn đường dẫn này: đăng nhập bằng
gói đăng ký ChatGPT/Codex, bật Plugin `codex` được đóng gói kèm và dùng một
tham chiếu mô hình `openai/gpt-*` chuẩn.

Đăng nhập bằng Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Bật Plugin `codex` được đóng gói kèm và chọn một mô hình agent OpenAI:

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

## Chia sẻ luồng với Codex Desktop và CLI

Mặc định `appServer.homeScope: "agent"` giữ mỗi agent OpenClaw tách biệt
khỏi trạng thái Codex nguyên bản của operator. Để cho phép chủ sở hữu yêu cầu OpenClaw kiểm tra
và quản lý cùng các luồng nguyên bản được hiển thị bởi Codex Desktop và Codex CLI,
hãy chọn dùng Codex home của người dùng:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Chế độ user-home chỉ khả dụng với transport stdio cục bộ. Nó dùng
`$CODEX_HOME` khi được đặt và `~/.codex` nếu không, bao gồm xác thực Codex nguyên bản,
cấu hình, Plugin và kho luồng của home đó. OpenClaw không chèn hồ sơ xác thực
OpenClaw vào app-server này.

Các lượt của chủ sở hữu có thêm công cụ `codex_threads`. Công cụ này có thể liệt kê, tìm kiếm, đọc, fork,
đổi tên, lưu trữ và khôi phục các luồng nguyên bản. Hãy yêu cầu agent fork một luồng khi
bạn muốn tiếp tục luồng đó trong OpenClaw; fork được gắn vào phiên OpenClaw hiện tại
và vẫn hiển thị với các client Codex nguyên bản khác. Lưu trữ yêu cầu xác nhận rõ ràng
rằng luồng đã được đóng ở nơi khác.

Không tiếp tục hoặc ghi cùng một luồng đồng thời từ OpenClaw và một client Codex khác.
Codex điều phối các writer đang hoạt động bên trong một tiến trình app-server, không
điều phối qua các tiến trình Desktop, CLI và OpenClaw độc lập. Fork tạo một
phần tiếp tục riêng và là đường dẫn cùng tồn tại an toàn.

## Cấu hình

Cấu hình bắt đầu nhanh là cấu hình harness Codex tối thiểu khả dụng. Đặt các tùy chọn harness Codex
trong cấu hình OpenClaw và chỉ dùng CLI cho xác thực Codex:

| Nhu cầu                                | Đặt                                                                              | Ở đâu                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Bật harness                            | `plugins.entries.codex.enabled: true`                                            | Cấu hình OpenClaw                  |
| Giữ một cài đặt Plugin trong allowlist | Bao gồm `codex` trong `plugins.allow`                                            | Cấu hình OpenClaw                  |
| Định tuyến lượt agent OpenAI qua Codex | `agents.defaults.model` hoặc `agents.list[].model` là `openai/gpt-*`             | Cấu hình agent OpenClaw            |
| Đăng nhập bằng ChatGPT/Codex OAuth     | `openclaw models auth login --provider openai`                                   | Hồ sơ xác thực CLI                 |
| Thêm API-key dự phòng cho lượt Codex   | Hồ sơ API-key `openai:*` được liệt kê sau xác thực đăng ký trong `auth.order.openai` | Hồ sơ xác thực CLI + cấu hình OpenClaw |
| Đóng lỗi khi Codex không khả dụng      | Nhà cung cấp hoặc mô hình `agentRuntime.id: "codex"`                             | Cấu hình mô hình/nhà cung cấp OpenClaw |
| Dùng lưu lượng OpenAI API trực tiếp    | Nhà cung cấp hoặc mô hình `agentRuntime.id: "openclaw"` với xác thực OpenAI thông thường | Cấu hình mô hình/nhà cung cấp OpenClaw |
| Tinh chỉnh hành vi app-server          | `plugins.entries.codex.config.appServer.*`                                       | Cấu hình Plugin Codex              |
| Bật ứng dụng Plugin Codex nguyên bản   | `plugins.entries.codex.config.codexPlugins.*`                                    | Cấu hình Plugin Codex              |
| Bật Codex Computer Use                 | `plugins.entries.codex.config.computerUse.*`                                     | Cấu hình Plugin Codex              |

Dùng tham chiếu mô hình `openai/gpt-*` cho các lượt agent OpenAI được Codex hỗ trợ. Ưu tiên
`auth.order.openai` cho thứ tự đăng ký-trước/API-key-dự-phòng. Các id hồ sơ xác thực
Codex cũ hiện có và thứ tự xác thực Codex cũ là trạng thái cũ chỉ dành cho doctor;
không ghi các tham chiếu GPT Codex cũ mới.

Không đặt `compaction.model` hoặc `compaction.provider` trên các agent được Codex hỗ trợ.
Codex compact thông qua trạng thái luồng app-server nguyên bản của nó, nên OpenClaw bỏ qua
các override trình tóm tắt cục bộ đó khi runtime chạy và `openclaw doctor --fix` xóa
chúng khi agent dùng Codex.

Lossless vẫn được hỗ trợ như một công cụ ngữ cảnh cho việc lắp ráp, nạp dữ liệu và
bảo trì quanh các lượt Codex. Cấu hình nó thông qua
`plugins.slots.contextEngine: "lossless-claw"` và
`plugins.entries.lossless-claw.config.summaryModel`, không phải thông qua
`agents.defaults.compaction.provider`. `openclaw doctor --fix` di chuyển hình dạng cũ
`compaction.provider: "lossless-claw"` sang slot công cụ ngữ cảnh Lossless
khi Codex là runtime đang hoạt động, nhưng Codex nguyên bản vẫn sở hữu compaction.

Harness Codex app-server nguyên bản hỗ trợ các công cụ ngữ cảnh yêu cầu
lắp ráp trước prompt. Các backend CLI chung, bao gồm `codex-cli`, không cung cấp
năng lực host đó.

Đối với các agent được Codex hỗ trợ, `/compact` bắt đầu compaction Codex app-server nguyên bản trên
luồng đã ràng buộc. OpenClaw không chờ hoàn tất, áp đặt timeout OpenClaw,
khởi động lại app-server dùng chung, hoặc fallback về công cụ ngữ cảnh hay
trình tóm tắt OpenAI công khai. Nếu ràng buộc luồng Codex nguyên bản bị thiếu hoặc
cũ, lệnh sẽ đóng lỗi để operator thấy ranh giới runtime thật
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

Trong hình dạng đó, cả hai hồ sơ vẫn chạy qua Codex cho các lượt agent
`openai/gpt-*`. API key chỉ là fallback xác thực, không phải yêu cầu chuyển sang OpenClaw hoặc
OpenAI Responses thuần.

Phần còn lại của trang này bao gồm các biến thể phổ biến mà người dùng phải chọn:
hình dạng triển khai, định tuyến đóng lỗi, chính sách phê duyệt guardian, Plugin Codex nguyên bản
và Computer Use. Để xem danh sách tùy chọn đầy đủ, mặc định, enum, khám phá,
cách ly môi trường, timeout và các trường transport app-server, xem
[Tham chiếu harness Codex](/vi/plugins/codex-harness-reference).

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

- Dùng `openai/gpt-*` cho các lượt agent OpenAI qua Codex.
- Không dùng tham chiếu GPT Codex cũ trong cấu hình. Chạy `openclaw doctor --fix` để
  sửa các tham chiếu cũ và ghim tuyến phiên lỗi thời.
- `agentRuntime.id: "codex"` là tùy chọn cho chế độ tự động OpenAI thông thường, nhưng hữu ích
  khi một triển khai nên đóng lỗi nếu Codex không khả dụng.
- `agentRuntime.id: "openclaw"` chọn runtime nhúng OpenClaw cho một nhà cung cấp hoặc mô hình
  khi đó là chủ ý.
- `/codex ...` điều khiển các cuộc hội thoại Codex app-server nguyên bản từ chat.
- ACP/acpx là một đường dẫn harness bên ngoài riêng biệt. Chỉ dùng nó khi người dùng yêu cầu
  ACP/acpx hoặc một adapter harness bên ngoài.

Định tuyến lệnh phổ biến:

| Ý định của người dùng                                | Sử dụng                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Đính kèm cuộc trò chuyện hiện tại                     | `/codex bind [--cwd <path>]`                                                                          |
| Tiếp tục một luồng Codex hiện có                      | `/codex resume <thread-id>`                                                                           |
| Liệt kê hoặc lọc các luồng Codex                      | `/codex threads [filter]`                                                                             |
| Liệt kê các Plugin Codex gốc                          | `/codex plugins list`                                                                                 |
| Bật hoặc tắt một Plugin Codex gốc đã cấu hình         | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Đính kèm một phiên Codex CLI hiện có trên một node đã ghép đôi | `/codex sessions --host <node> [filter]`, sau đó `/codex resume <session-id> --host <node> --bind here` |
| Chỉ gửi phản hồi Codex                                | `/codex diagnostics [note]`                                                                           |
| Bắt đầu một tác vụ ACP/acpx                           | Các lệnh phiên ACP/acpx, không phải `/codex`                                                          |

| Trường hợp sử dụng                                   | Cấu hình                                                               | Xác minh                                | Ghi chú                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Gói đăng ký ChatGPT/Codex với runtime Codex gốc      | `openai/gpt-*` cộng với Plugin `codex` đã bật                          | `/status` shows `Runtime: OpenAI Codex` | Đường dẫn được khuyến nghị            |
| Đóng an toàn khi lỗi nếu Codex không khả dụng        | Provider hoặc model `agentRuntime.id: "codex"`                         | Lượt chạy thất bại thay vì fallback nhúng | Dùng cho các triển khai chỉ dùng Codex |
| Định tuyến lưu lượng khóa API OpenAI trực tiếp qua OpenClaw | Provider hoặc model `agentRuntime.id: "openclaw"` và xác thực OpenAI bình thường | `/status` shows OpenClaw runtime        | Chỉ dùng khi OpenClaw là chủ ý        |
| Cấu hình cũ                                          | các tham chiếu GPT Codex cũ                                            | `openclaw doctor --fix` rewrites it     | Không viết cấu hình mới theo cách này |
| Bộ chuyển đổi ACP/acpx Codex                         | ACP `sessions_spawn({ runtime: "acp" })`                               | Trạng thái tác vụ/phiên ACP             | Tách biệt với harness Codex gốc       |

`agents.defaults.imageModel` tuân theo cùng cách tách tiền tố. Dùng `openai/gpt-*`
cho tuyến OpenAI bình thường và chỉ dùng `codex/gpt-*` khi khả năng hiểu hình ảnh
cần chạy qua một lượt máy chủ ứng dụng Codex có giới hạn. Không dùng
các tham chiếu GPT Codex cũ; doctor viết lại tiền tố cũ đó thành `openai/gpt-*`.

## Mẫu triển khai

### Triển khai Codex cơ bản

Dùng cấu hình quickstart khi tất cả các lượt tác tử OpenAI nên dùng Codex theo
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

### Triển khai nhiều provider

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

Với cấu hình này, tác tử `main` dùng đường dẫn provider bình thường của nó và tác tử
`codex` dùng máy chủ ứng dụng Codex.

### Triển khai Codex đóng an toàn khi lỗi

Đối với các lượt tác tử OpenAI, `openai/gpt-*` đã phân giải sang Codex khi
Plugin đi kèm khả dụng. Thêm chính sách runtime rõ ràng khi bạn muốn một quy tắc
đóng an toàn khi lỗi được ghi ra:

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

Khi Codex bị ép buộc, OpenClaw thất bại sớm nếu Plugin Codex bị tắt, máy chủ
ứng dụng quá cũ, hoặc máy chủ ứng dụng không thể khởi động.

## Chính sách máy chủ ứng dụng

Theo mặc định, Plugin khởi động tệp nhị phân Codex do OpenClaw quản lý ở cục bộ
với transport stdio. Chỉ đặt `appServer.command` khi bạn chủ ý muốn chạy một
tệp thực thi khác. Chỉ dùng transport WebSocket khi một máy chủ ứng dụng đã
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
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Nếu yêu cầu Codex cục bộ không cho phép tư thế
YOLO ngầm định đó, OpenClaw sẽ chọn quyền guardian được phép thay thế.
Khi một sandbox OpenClaw đang hoạt động cho phiên, OpenClaw tắt Code Mode gốc
của Codex, máy chủ MCP của người dùng, và việc thực thi Plugin dựa trên ứng dụng
cho lượt đó thay vì dựa vào sandbox phía host của Codex. Quyền truy cập shell
được cung cấp thông qua các công cụ động dựa trên sandbox của OpenClaw như
`sandbox_exec` và `sandbox_process` khi các công cụ exec/process bình thường khả dụng.

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
được Codex Guardian xét duyệt, thường là
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, và
`sandbox: "workspace-write"` khi yêu cầu cục bộ cho phép các giá trị đó.
Trong `tools.exec.mode: "auto"`, OpenClaw không giữ lại các override Codex cũ
không an toàn `approvalPolicy: "never"` hoặc `sandbox: "danger-full-access"`; dùng
`tools.exec.mode: "full"` cho một tư thế Codex cố ý không cần phê duyệt. Preset cũ
`plugins.entries.codex.config.appServer.mode: "guardian"` vẫn hoạt động, nhưng
`tools.exec.mode: "auto"` là bề mặt OpenClaw đã chuẩn hóa.

Để so sánh ở cấp chế độ với phê duyệt exec trên host và quyền ACPX,
xem [Chế độ quyền](/vi/tools/permission-modes).

Đối với mọi trường máy chủ ứng dụng, thứ tự xác thực, cô lập môi trường, khám phá và
hành vi timeout, xem [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference).

## Lệnh và chẩn đoán

Plugin đi kèm đăng ký `/codex` làm lệnh slash trên bất kỳ kênh nào
hỗ trợ lệnh văn bản OpenClaw.

Thực thi và điều khiển gốc yêu cầu một owner hoặc một client Gateway `operator.admin`.
Điều này bao gồm liên kết hoặc tiếp tục luồng, gửi hoặc dừng lượt, thay đổi model,
fast-mode, hoặc trạng thái quyền, compact hoặc review, và gỡ liên kết. Những người gửi
được ủy quyền khác giữ các lệnh chỉ đọc về trạng thái, trợ giúp, tài khoản, model,
luồng, máy chủ MCP, skill, và kiểm tra liên kết.

Các dạng phổ biến:

- `/codex status` kiểm tra kết nối máy chủ ứng dụng, model, tài khoản, giới hạn tốc độ,
  máy chủ MCP, và skills.
- `/codex models` liệt kê các model máy chủ ứng dụng Codex trực tiếp.
- `/codex threads [filter]` liệt kê các luồng máy chủ ứng dụng Codex gần đây.
- `/codex resume <thread-id>` đính kèm phiên OpenClaw hiện tại vào một
  luồng Codex hiện có.
- `/codex compact` yêu cầu máy chủ ứng dụng Codex compact luồng đã đính kèm.
- `/codex review` bắt đầu review gốc của Codex cho luồng đã đính kèm.
- `/codex diagnostics [note]` hỏi trước khi gửi phản hồi Codex cho
  luồng đã đính kèm.
- `/codex account` hiển thị trạng thái tài khoản và giới hạn tốc độ.
- `/codex mcp` liệt kê trạng thái máy chủ MCP của máy chủ ứng dụng Codex.
- `/codex skills` liệt kê skills của máy chủ ứng dụng Codex.

Đối với hầu hết báo cáo hỗ trợ, hãy bắt đầu bằng `/diagnostics [note]` trong cuộc trò chuyện
nơi lỗi đã xảy ra. Lệnh này tạo một báo cáo chẩn đoán Gateway và, đối với các phiên
harness Codex, yêu cầu phê duyệt để gửi gói phản hồi Codex liên quan.
Xem [Xuất chẩn đoán](/vi/gateway/diagnostics) để biết mô hình quyền riêng tư và hành vi
trò chuyện nhóm.

Chỉ dùng `/codex diagnostics [note]` khi bạn đặc biệt muốn tải phản hồi Codex lên
cho luồng hiện đang đính kèm mà không có toàn bộ gói chẩn đoán Gateway.

### Kiểm tra các luồng Codex cục bộ

Cách nhanh nhất để kiểm tra một lượt chạy Codex lỗi thường là mở trực tiếp
luồng Codex gốc:

```bash
codex resume <thread-id>
```

Lấy id luồng từ phản hồi `/diagnostics` đã hoàn tất, `/codex binding`, hoặc
`/codex threads [filter]`.

Để biết cơ chế tải lên và ranh giới chẩn đoán ở cấp runtime, xem
[Runtime harness Codex](/vi/plugins/codex-harness-runtime#codex-feedback-upload).

Trong home mặc định theo từng tác tử, xác thực được chọn theo thứ tự này:

1. Các hồ sơ xác thực OpenAI đã sắp xếp cho tác tử, ưu tiên dưới
   `auth.order.openai`. Chạy `openclaw doctor --fix` để di chuyển các id hồ sơ xác thực
   Codex cũ và thứ tự xác thực Codex cũ.
2. Tài khoản hiện có của máy chủ ứng dụng trong home Codex của tác tử đó.
3. Chỉ đối với các lần khởi chạy máy chủ ứng dụng stdio cục bộ, `CODEX_API_KEY`, sau đó
   `OPENAI_API_KEY`, khi không có tài khoản máy chủ ứng dụng nào và xác thực OpenAI
   vẫn bắt buộc.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều đó
giữ các khóa API cấp Gateway khả dụng cho embeddings hoặc các model OpenAI trực tiếp
mà không vô tình làm các lượt máy chủ ứng dụng Codex gốc bị tính phí qua API.
Các hồ sơ khóa API Codex rõ ràng và fallback khóa env stdio cục bộ dùng đăng nhập
máy chủ ứng dụng thay vì env tiến trình con kế thừa. Kết nối máy chủ ứng dụng WebSocket
không nhận fallback khóa API env Gateway; hãy dùng một hồ sơ xác thực rõ ràng hoặc
tài khoản riêng của máy chủ ứng dụng từ xa.
Khi các Plugin Codex gốc được cấu hình, OpenClaw cài đặt hoặc làm mới các
Plugin đó thông qua máy chủ ứng dụng đã kết nối trước khi đưa các ứng dụng do Plugin sở hữu
vào luồng Codex. `app/list` vẫn là nguồn sự thật cho id ứng dụng,
khả năng truy cập, và metadata, nhưng OpenClaw sở hữu quyết định bật theo từng luồng:
nếu chính sách cho phép một ứng dụng có thể truy cập đã được liệt kê, OpenClaw gửi
`thread/start.config.apps[appId].enabled = true` ngay cả khi `app/list` hiện đang
báo cáo ứng dụng đó là đã tắt. Đường dẫn này không tự tạo cài đặt ứng dụng cho
các id không xác định; OpenClaw chỉ kích hoạt Plugin marketplace bằng `plugin/install`
rồi làm mới inventory.

Nếu một hồ sơ gói đăng ký chạm giới hạn sử dụng Codex, OpenClaw ghi lại thời điểm reset
khi Codex báo cáo và thử hồ sơ xác thực kế tiếp theo thứ tự cho cùng một lượt chạy
Codex. Khi thời điểm reset đã qua, hồ sơ gói đăng ký lại đủ điều kiện
mà không thay đổi model `openai/gpt-*` đã chọn hoặc runtime Codex.

Với các lần khởi chạy app-server stdio cục bộ, OpenClaw đặt `CODEX_HOME` thành một thư mục theo từng agent để cấu hình Codex, tệp xác thực/tài khoản, bộ nhớ đệm/dữ liệu Plugin và trạng thái luồng gốc không đọc hoặc ghi vào `~/.codex` cá nhân của người vận hành theo mặc định. OpenClaw giữ nguyên `HOME` thông thường của tiến trình; các tiến trình con do Codex chạy vẫn có thể tìm thấy cấu hình và token trong thư mục home của người dùng, và Codex có thể phát hiện các mục `$HOME/.agents/skills` và `$HOME/.agents/plugins/marketplace.json` dùng chung. Với `appServer.homeScope: "user"`, OpenClaw thay vào đó dùng home Codex gốc của người dùng và tài khoản hiện có của nó mà không chèn hồ sơ xác thực OpenClaw.

Nếu một triển khai cần cô lập môi trường bổ sung, hãy thêm các biến đó vào `appServer.clearEnv`:

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex được sinh ra. OpenClaw loại bỏ `CODEX_HOME` và `HOME` khỏi danh sách này trong quá trình chuẩn hóa khởi chạy cục bộ: `CODEX_HOME` vẫn trỏ đến phạm vi agent hoặc người dùng đã chọn, và `HOME` vẫn được kế thừa để các tiến trình con có thể dùng trạng thái home người dùng thông thường.

Các công cụ động của Codex mặc định dùng chế độ tải `searchable`. OpenClaw không để lộ các công cụ động trùng lặp với các thao tác workspace gốc của Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` và `update_plan`. Hầu hết các công cụ tích hợp OpenClaw còn lại như nhắn tin, phương tiện, cron, trình duyệt, node, Gateway và `heartbeat_respond` đều có sẵn qua tìm kiếm công cụ Codex trong namespace `openclaw`, giúp ngữ cảnh mô hình ban đầu nhỏ hơn. Tìm kiếm web dùng công cụ `web_search` được lưu trữ của Codex theo mặc định khi tìm kiếm được bật và không chọn nhà cung cấp được quản lý nào. Tìm kiếm được lưu trữ gốc và công cụ động `web_search` được quản lý của OpenClaw loại trừ lẫn nhau để tìm kiếm được quản lý không thể vượt qua các hạn chế miền gốc. OpenClaw dùng công cụ được quản lý khi tìm kiếm được lưu trữ không khả dụng, bị tắt rõ ràng, hoặc được thay thế bằng một nhà cung cấp được quản lý đã chọn. OpenClaw giữ extension `web.run` độc lập của Codex ở trạng thái tắt vì lưu lượng app-server production từ chối namespace `web` do người dùng định nghĩa. `tools.web.search.enabled: false` tắt cả hai đường dẫn, cũng như các lượt chạy chỉ LLM khi công cụ bị tắt. Codex xem `"cached"` là một tùy chọn ưu tiên và phân giải nó thành quyền truy cập bên ngoài trực tiếp cho các lượt app-server không bị hạn chế. Cơ chế dự phòng được quản lý tự động thất bại theo hướng đóng khi `allowedDomains` gốc được đặt để danh sách cho phép không thể bị vượt qua. Các thay đổi chính sách tìm kiếm hiệu lực bền vững sẽ xoay vòng luồng Codex đã liên kết trước lượt tiếp theo. Các hạn chế tạm thời theo từng lượt dùng một luồng bị hạn chế tạm thời và giữ nguyên liên kết hiện có để tiếp tục sau này. `sessions_yield` và các phản hồi nguồn chỉ qua công cụ tin nhắn vẫn đi trực tiếp vì đó là các hợp đồng điều khiển lượt. `sessions_spawn` vẫn ở chế độ searchable để `spawn_agent` gốc của Codex vẫn là bề mặt subagent Codex chính, trong khi ủy quyền OpenClaw hoặc ACP rõ ràng vẫn có sẵn qua namespace công cụ động `openclaw`. Hướng dẫn cộng tác Heartbeat yêu cầu Codex tìm `heartbeat_respond` trước khi kết thúc một lượt Heartbeat khi công cụ này chưa được tải.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối đến một app-server Codex tùy chỉnh không thể tìm kiếm các công cụ động bị trì hoãn hoặc khi gỡ lỗi toàn bộ payload công cụ.

Các trường Plugin Codex cấp cao nhất được hỗ trợ:

| Trường                     | Mặc định       | Ý nghĩa                                                                                         |
| -------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Dùng `"direct"` để đưa các công cụ động OpenClaw trực tiếp vào ngữ cảnh công cụ Codex ban đầu. |
| `codexDynamicToolsExclude` | `[]`           | Tên công cụ động OpenClaw bổ sung cần bỏ qua khỏi các lượt app-server Codex.                    |
| `codexPlugins`             | bị tắt         | Hỗ trợ Plugin/app Codex gốc cho các Plugin tuyển chọn đã di chuyển được cài từ nguồn.           |

Các trường `appServer` được hỗ trợ:

| Trường                                        | Mặc định                                              | Ý nghĩa                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                                                                                                                                                                      |
| `homeScope`                                   | `"agent"`                                             | `"agent"` cô lập trạng thái Codex cho từng agent OpenClaw. `"user"` chia sẻ `$CODEX_HOME` gốc hoặc `~/.codex`, dùng xác thực gốc, và bật quản lý luồng chỉ dành cho chủ sở hữu. Phạm vi người dùng yêu cầu stdio.                                                                                                                                                                                |
| `command`                                     | tệp nhị phân Codex được quản lý                       | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý; chỉ đặt khi cần ghi đè rõ ràng.                                                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Đối số cho transport stdio.                                                                                                                                                                                                                                                                                                                                                                      |
| `url`                                         | chưa đặt                                              | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | chưa đặt                                              | Mã thông báo Bearer cho transport WebSocket. Chấp nhận chuỗi literal hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                  | Header WebSocket bổ sung. Giá trị header chấp nhận chuỗi literal hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                |
| `clearEnv`                                    | `[]`                                                  | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa. OpenClaw giữ `CODEX_HOME` đã chọn và `HOME` kế thừa cho các lần khởi chạy cục bộ.                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                               | Chọn dùng bề mặt công cụ chỉ dành cho code-mode của Codex. Các công cụ động của OpenClaw vẫn được đăng ký với Codex để các lệnh gọi `tools.*` lồng nhau trả về qua cầu nối `item/tool/call` của app-server.                                                                                                                                                                                     |
| `remoteWorkspaceRoot`                         | chưa đặt                                              | Gốc workspace app-server Codex từ xa. Khi được đặt, OpenClaw suy luận gốc workspace cục bộ từ workspace OpenClaw đã phân giải, giữ hậu tố cwd hiện tại dưới gốc từ xa này, và chỉ gửi cwd app-server cuối cùng cho Codex. Nếu cwd nằm ngoài gốc workspace OpenClaw đã phân giải, OpenClaw từ chối an toàn thay vì gửi đường dẫn cục bộ của Gateway tới app-server từ xa. |
| `requestTimeoutMs`                            | `60000`                                               | Thời gian chờ cho các lệnh gọi control-plane app-server.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Khoảng thời gian yên lặng sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server theo phạm vi lượt trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Bộ bảo vệ completion-idle và tiến độ được dùng sau khi bàn giao công cụ, hoàn tất công cụ gốc, tiến độ trợ lý thô sau công cụ, hoàn tất reasoning thô, hoặc tiến độ reasoning trong khi OpenClaw chờ `turn/completed`. Dùng tùy chọn này cho workload đáng tin cậy hoặc nặng, nơi tổng hợp sau công cụ có thể im lặng lâu hơn ngân sách phát hành trợ lý cuối cùng một cách hợp lệ.              |
| `mode`                                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc thực thi được guardian review. Các yêu cầu stdio cục bộ bỏ qua `danger-full-access`, phê duyệt `never`, hoặc reviewer `user` sẽ khiến mặc định ngầm định là guardian.                                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` hoặc một chính sách phê duyệt guardian được phép | Chính sách phê duyệt Codex gốc được gửi tới khởi động/tiếp tục/turn của luồng. Mặc định guardian ưu tiên `"on-request"` khi được phép.                                                                                                                                                                                                                                                           |
| `sandbox`                                     | `"danger-full-access"` hoặc sandbox guardian được phép | Chế độ sandbox Codex gốc được gửi tới khởi động/tiếp tục luồng. Mặc định guardian ưu tiên `"workspace-write"` khi được phép, nếu không thì `"read-only"`. Khi sandbox OpenClaw đang hoạt động, các lượt `danger-full-access` dùng Codex `workspace-write` với quyền truy cập mạng được dẫn xuất từ cài đặt egress của sandbox OpenClaw.                                                         |
| `approvalsReviewer`                           | `"user"` hoặc reviewer guardian được phép              | Dùng `"auto_review"` để cho Codex review các prompt phê duyệt gốc khi được phép, nếu không thì `guardian_subagent` hoặc `user`. `guardian_subagent` vẫn là alias cũ.                                                                                                                                                                                                                            |
| `serviceTier`                                 | chưa đặt                                              | Cấp dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến fast-mode, `"flex"` yêu cầu xử lý flex, `null` xóa ghi đè, và `"fast"` cũ được chấp nhận như `"priority"`.                                                                                                                                                                                                                   |
| `networkProxy`                                | đã tắt                                                | Chọn dùng mạng theo permissions-profile của Codex cho các lệnh app-server. OpenClaw định nghĩa cấu hình `permissions.<profile>.network` đã chọn và chọn cấu hình đó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                          |
| `experimental.sandboxExecServer`              | `false`                                               | Tùy chọn thử nghiệm preview đăng ký một môi trường Codex được hỗ trợ bởi sandbox OpenClaw với Codex app-server 0.132.0 hoặc mới hơn để thực thi Codex gốc có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                                |

`appServer.networkProxy` là rõ ràng vì nó thay đổi hợp đồng sandbox của Codex.
Khi được bật, OpenClaw cũng đặt `features.network_proxy.enabled` và
`default_permissions` trong cấu hình luồng Codex để profile quyền được tạo
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

Nếu runtime app-server thông thường là `danger-full-access`, việc bật
`networkProxy` sẽ dùng quyền truy cập hệ thống tệp kiểu workspace cho hồ sơ
quyền được tạo. Cơ chế thực thi mạng do Codex quản lý là mạng trong sandbox,
nên hồ sơ toàn quyền truy cập sẽ không bảo vệ lưu lượng đi ra.
Các mục miền dùng `allow` hoặc `deny`; các mục Unix socket dùng các giá trị
`allow` hoặc `none` của Codex.

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`: các yêu cầu Codex `item/tool/call` mặc định dùng
watchdog OpenClaw 90 giây. Đối số `timeoutMs` dương theo từng lệnh gọi sẽ kéo
dài hoặc rút ngắn ngân sách công cụ cụ thể đó. Công cụ `image_generate` dùng
`agents.defaults.imageGenerationModel.timeoutMs` khi lệnh gọi công cụ không
cung cấp timeout riêng, hoặc mặc định tạo ảnh 120 giây trong trường hợp khác.
Công cụ `image` để hiểu nội dung media dùng
`tools.media.image.timeoutSeconds` hoặc mặc định media 60 giây. Với hiểu nội
dung ảnh, timeout đó áp dụng cho chính yêu cầu và không bị giảm bởi công việc
chuẩn bị trước đó. Ngân sách công cụ động bị giới hạn ở 600000 ms. Khi timeout,
OpenClaw hủy tín hiệu công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động
thất bại cho Codex để lượt có thể tiếp tục thay vì để phiên ở trạng thái
`processing`. Watchdog này là ngân sách `item/tool/call` động bên ngoài; các
timeout yêu cầu theo từng provider chạy bên trong lệnh gọi đó và giữ nguyên ngữ
nghĩa timeout riêng của chúng.

Sau khi Codex chấp nhận một lượt, và sau khi OpenClaw phản hồi một yêu cầu
app-server thuộc phạm vi lượt, harness kỳ vọng Codex sẽ có tiến triển trong
lượt hiện tại và cuối cùng kết thúc lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw sẽ
cố gắng ngắt lượt Codex, ghi lại timeout chẩn đoán, và giải phóng lane phiên
OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một lượt gốc cũ
bị kẹt. Hầu hết thông báo không kết thúc cho cùng lượt sẽ tắt watchdog ngắn đó
vì Codex đã chứng minh lượt vẫn còn hoạt động. Các chuyển giao công cụ dùng
ngân sách nhàn rỗi sau công cụ dài hơn: sau khi OpenClaw trả về phản hồi
`item/tool/call`, sau khi các mục công cụ gốc như `commandExecution` hoàn tất,
sau khi các hoàn tất `custom_tool_call_output` thô, và sau tiến trình trợ lý thô
sau công cụ, hoàn tất reasoning thô, hoặc tiến trình reasoning. Bộ bảo vệ dùng
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình và
mặc định là năm phút trong trường hợp khác. Cùng ngân sách sau công cụ đó cũng
kéo dài watchdog tiến trình cho cửa sổ tổng hợp im lặng trước khi Codex phát ra
sự kiện tiếp theo của lượt hiện tại. Các thông báo app-server toàn cục, chẳng
hạn như cập nhật giới hạn tốc độ, không đặt lại tiến trình nhàn rỗi của lượt.
Các hoàn tất reasoning, hoàn tất `agentMessage` commentary, và tiến trình
reasoning hoặc trợ lý thô trước công cụ có thể được theo sau bởi phản hồi cuối
tự động, nên chúng dùng bộ bảo vệ phản hồi sau tiến trình thay vì giải phóng
lane phiên ngay lập tức. Chỉ các mục `agentMessage` đã hoàn tất dạng cuối/không
phải commentary và các hoàn tất trợ lý thô trước công cụ mới kích hoạt giải
phóng đầu ra trợ lý: nếu Codex sau đó im lặng mà không có `turn/completed`,
OpenClaw sẽ cố gắng ngắt lượt gốc và giải phóng lane phiên. Nếu một bộ theo dõi
lượt khác thắng cuộc đua giải phóng đó, OpenClaw vẫn chấp nhận mục trợ lý cuối
đã hoàn tất khi không còn yêu cầu gốc, mục, hoặc hoàn tất công cụ động nào đang
hoạt động và việc giải phóng đầu ra trợ lý vẫn thuộc về mục đã hoàn tất mới
nhất, không có hoàn tất mục nào sau đó. Điều này có thể giữ lại câu trả lời cuối
sau khi công việc công cụ đã hoàn tất mà không phát lại lượt. Các delta trợ lý
một phần, các phản hồi cũ trước đó, và các hoàn tất trống sau đó không đủ điều
kiện. Các lỗi app-server stdio an toàn để phát lại, bao gồm timeout nhàn rỗi khi
hoàn tất lượt mà không có bằng chứng trợ lý, công cụ, mục đang hoạt động, hoặc
tác dụng phụ, được thử lại một lần trên một lần thử app-server mới. Các timeout
không an toàn vẫn loại bỏ client app-server bị kẹt và giải phóng lane phiên
OpenClaw. Chúng cũng xóa binding luồng gốc cũ thay vì được phát lại tự động.
Timeout theo dõi hoàn tất hiển thị văn bản timeout riêng của Codex: các trường
hợp an toàn để phát lại nói rằng phản hồi có thể chưa hoàn chỉnh, còn các
trường hợp không an toàn yêu cầu người dùng xác minh trạng thái hiện tại trước
khi thử lại. Chẩn đoán timeout công khai bao gồm các trường có cấu trúc như
phương thức thông báo app-server cuối cùng, id/type/role của mục phản hồi trợ lý
thô, số lượng yêu cầu/mục đang hoạt động, và trạng thái theo dõi đã kích hoạt.
Khi thông báo cuối là một mục phản hồi trợ lý thô, chúng cũng bao gồm bản xem
trước văn bản trợ lý có giới hạn. Chúng không bao gồm prompt thô hoặc nội dung
công cụ.

Các override môi trường vẫn có sẵn cho kiểm thử cục bộ:

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
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi plugin trong
cùng tệp đã được rà soát với phần còn lại của thiết lập harness Codex.

## Plugin Codex gốc

Hỗ trợ Plugin Codex gốc dùng các khả năng app và plugin riêng của Codex
app-server trong cùng luồng Codex với lượt harness OpenClaw. OpenClaw không
dịch plugin Codex thành các công cụ động OpenClaw tổng hợp
`codex_plugin_*`.

`codexPlugins` chỉ ảnh hưởng đến các phiên chọn harness Codex gốc. Nó không có
tác dụng với các lần chạy harness tích hợp sẵn, các lần chạy provider OpenAI
thông thường, binding cuộc trò chuyện ACP, hoặc các harness khác.

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
hoặc thay thế một binding luồng Codex cũ. Nó không được tính lại ở mọi lượt.
Sau khi thay đổi `codexPlugins`, hãy dùng `/new`, `/reset`, hoặc khởi động lại
gateway để các phiên harness Codex trong tương lai bắt đầu với bộ app đã cập
nhật.

Về điều kiện đủ để di chuyển, inventory app, chính sách hành động phá hủy,
elicitations, và chẩn đoán plugin gốc, xem
[Plugin Codex gốc](/vi/plugins/codex-native-plugins).

Quyền truy cập app và plugin phía OpenAI được kiểm soát bởi tài khoản Codex đã
đăng nhập và, với workspace Business và Enterprise/Edu, bởi các điều khiển app
của workspace. Xem
[Sử dụng Codex với gói ChatGPT của bạn](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
để biết tổng quan của OpenAI về tài khoản và điều khiển workspace.

## Computer Use

Computer Use được trình bày trong hướng dẫn thiết lập riêng:
[Codex Computer Use](/vi/plugins/codex-computer-use).

Phiên bản ngắn gọn: OpenClaw không vendor app điều khiển desktop hoặc tự thực
thi hành động desktop. Nó chuẩn bị Codex app-server, xác minh rằng MCP server
`computer-use` có sẵn, rồi để Codex sở hữu các lệnh gọi công cụ MCP gốc trong
các lượt chế độ Codex.

## Ranh giới runtime

Harness Codex chỉ thay đổi trình thực thi agent nhúng cấp thấp.

- Công cụ động OpenClaw được hỗ trợ. Codex yêu cầu OpenClaw thực thi các công
  cụ đó, nên OpenClaw vẫn nằm trong đường dẫn thực thi.
- Các công cụ shell, patch, MCP và app gốc của Codex do Codex sở hữu. OpenClaw
  có thể quan sát hoặc chặn các sự kiện gốc được chọn thông qua relay được hỗ
  trợ, nhưng không viết lại đối số công cụ gốc.
- Codex sở hữu compaction gốc. OpenClaw giữ một bản sao transcript cho lịch sử
  kênh, tìm kiếm, `/new`, `/reset`, và việc chuyển đổi model hoặc harness trong
  tương lai, nhưng không thay thế compaction của Codex bằng bộ tóm tắt OpenClaw
  hoặc context-engine.
- Tạo media, hiểu nội dung media, TTS, phê duyệt, và đầu ra công cụ nhắn tin
  tiếp tục đi qua các thiết lập provider/model OpenClaw tương ứng.
- `tool_result_persist` áp dụng cho kết quả công cụ transcript do OpenClaw sở
  hữu, không áp dụng cho bản ghi kết quả công cụ gốc của Codex.

Về các lớp hook, bề mặt V1 được hỗ trợ, xử lý quyền gốc, điều hướng hàng đợi,
cơ chế tải feedback Codex lên, và chi tiết compaction, xem
[Runtime harness Codex](/vi/plugins/codex-harness-runtime).

## Khắc phục sự cố

**Codex không xuất hiện như một provider `/model` thông thường:** điều đó là
mong đợi với config mới. Chọn một model `openai/gpt-*`, bật
`plugins.entries.codex.enabled`, và kiểm tra xem `plugins.allow` có loại trừ
`codex` hay không.

**OpenClaw dùng harness tích hợp sẵn thay vì Codex:** hãy bảo đảm model ref là
`openai/gpt-*` trên provider OpenAI chính thức và plugin Codex đã được cài đặt
và bật. Nếu bạn cần bằng chứng nghiêm ngặt khi kiểm thử, hãy đặt provider hoặc
model `agentRuntime.id: "codex"`. Runtime Codex bị ép buộc sẽ thất bại thay vì
fallback về OpenClaw.

**Runtime OpenAI Codex fallback sang đường dẫn API-key:** thu thập một đoạn
gateway đã biên tập ẩn thông tin nhạy cảm, hiển thị model, runtime, provider đã
chọn, và lỗi. Yêu cầu cộng tác viên bị ảnh hưởng chạy lệnh chỉ đọc này trên
host OpenClaw của họ:

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
`No API key`. Một lần chạy đã sửa đúng nên hiển thị đường dẫn OpenAI OAuth
thay vì lỗi OpenAI API-key thuần túy.

**Config model ref Codex legacy vẫn còn:** chạy `openclaw doctor --fix`.
Doctor viết lại các model ref legacy thành `openai/*`, gỡ bỏ các pin runtime
cũ ở cấp phiên và toàn agent, đồng thời giữ nguyên các override hồ sơ xác thực
hiện có.

**App-server bị từ chối:** dùng Codex app-server `0.125.0` hoặc mới hơn.
Các prerelease cùng phiên bản hoặc phiên bản có hậu tố build như
`0.125.0-alpha.2` hoặc `0.125.0+custom` bị từ chối vì OpenClaw kiểm tra mức sàn
giao thức ổn định `0.125.0`.

**`/codex status` không thể kết nối:** kiểm tra rằng plugin `codex` đi kèm đã
được bật, rằng `plugins.allow` bao gồm nó khi allowlist được cấu hình, và mọi
`appServer.command`, `url`, `authToken`, hoặc header tùy chỉnh đều hợp lệ.

**Khám phá model chậm:** giảm
`plugins.entries.codex.config.discovery.timeoutMs` hoặc tắt khám phá. Xem
[Tham chiếu harness Codex](/vi/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket thất bại ngay lập tức:** kiểm tra `appServer.url`,
`authToken`, header, và rằng app-server từ xa nói cùng phiên bản giao thức
Codex app-server.

**Công cụ shell gốc hoặc công cụ patch bị chặn với `Native hook relay unavailable`:**
luồng Codex vẫn đang cố dùng một id chuyển tiếp hook gốc mà OpenClaw không còn
đăng ký. Đây là sự cố vận chuyển hook gốc của Codex, không phải lỗi backend ACP,
provider, GitHub hoặc lệnh shell. Bắt đầu một phiên mới trong cuộc trò chuyện bị
ảnh hưởng bằng `/new` hoặc `/reset`, rồi thử lại một lệnh vô hại. Nếu lệnh đó
hoạt động một lần nhưng lần gọi công cụ gốc tiếp theo lại lỗi, hãy xem `/new` chỉ
là giải pháp tạm thời: sao chép prompt vào một phiên mới sau khi khởi động lại
app-server Codex hoặc OpenClaw Gateway để các luồng cũ bị loại bỏ và các đăng ký
hook gốc được tạo lại.

**Một mô hình không phải Codex sử dụng harness tích hợp:** điều này là bình
thường trừ khi chính sách runtime của provider hoặc mô hình định tuyến nó sang
một harness khác. Các ref provider thuần không phải OpenAI vẫn ở trên đường dẫn
provider bình thường của chúng trong chế độ `auto`.

**Computer Use đã được cài đặt nhưng công cụ không chạy:** kiểm tra
`/codex computer-use status` từ một phiên mới. Nếu một công cụ báo
`Native hook relay unavailable`, hãy dùng quy trình khôi phục chuyển tiếp hook
gốc ở trên. Xem [Codex Computer Use](/vi/plugins/codex-computer-use#troubleshooting).

## Liên quan

- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Runtime tác nhân](/vi/concepts/agent-runtimes)
- [Provider mô hình](/vi/concepts/model-providers)
- [Provider OpenAI](/vi/providers/openai)
- [Trợ giúp OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness tác nhân](/vi/plugins/sdk-agent-harness)
- [Hook Plugin](/vi/plugins/hooks)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Trạng thái](/vi/cli/status)
- [Kiểm thử](/vi/help/testing-live#live-codex-app-server-harness-smoke)
