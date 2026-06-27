---
read_when:
    - Bạn cần mọi trường cấu hình khung chạy của Codex
    - Bạn đang thay đổi hành vi transport, xác thực, discovery hoặc timeout của app-server
    - Bạn đang gỡ lỗi quá trình khởi động bộ chạy Codex, phát hiện mô hình hoặc cô lập môi trường
summary: Tham khảo cấu hình, xác thực, khám phá và máy chủ ứng dụng cho harness Codex
title: Tài liệu tham chiếu về bộ chạy Codex
x-i18n:
    generated_at: "2026-06-27T17:44:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Tài liệu tham chiếu này trình bày cấu hình chi tiết cho Plugin `codex`
được đóng gói kèm. Với các quyết định thiết lập và định tuyến, hãy bắt đầu từ
[Codex harness](/vi/plugins/codex-harness).

## Bề mặt cấu hình Plugin

Tất cả thiết lập Codex harness nằm dưới `plugins.entries.codex.config`.

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

| Trường                     | Mặc định                 | Ý nghĩa                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | đã bật                   | Thiết lập khám phá mô hình cho Codex app-server `model/list`.                                                                             |
| `appServer`                | app-server stdio được quản lý | Thiết lập về transport, lệnh, xác thực, phê duyệt, sandbox và thời gian chờ.                                                              |
| `codexDynamicToolsLoading` | `"searchable"`           | Dùng `"direct"` để đặt trực tiếp các công cụ động của OpenClaw vào ngữ cảnh công cụ Codex ban đầu.                                        |
| `codexDynamicToolsExclude` | `[]`                     | Các tên công cụ động OpenClaw bổ sung cần bỏ qua trong các lượt Codex app-server.                                                         |
| `codexPlugins`             | đã tắt                   | Hỗ trợ Plugin/ứng dụng Codex gốc cho các Plugin tuyển chọn đã di chuyển và được cài từ nguồn. Xem [Plugin Codex gốc](/vi/plugins/codex-native-plugins). |
| `computerUse`              | đã tắt                   | Thiết lập Codex Computer Use. Xem [Codex Computer Use](/vi/plugins/codex-computer-use).                                                      |

## Transport app-server

Theo mặc định, OpenClaw khởi động binary Codex được quản lý đi kèm với Plugin
được đóng gói kèm:

```bash
codex app-server --listen stdio://
```

Điều này giữ phiên bản app-server gắn với Plugin `codex` được đóng gói kèm thay vì
bất kỳ Codex CLI riêng nào tình cờ được cài cục bộ. Chỉ đặt
`appServer.command` khi bạn cố ý muốn chạy một tệp thực thi khác.

Đối với app-server đã chạy sẵn, hãy dùng transport WebSocket:

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

| Trường                                        | Mặc định                                               | Ý nghĩa                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                                   | `"stdio"`                                              | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                                                                                                                                                                                  |
| `command`                                     | tệp nhị phân Codex được quản lý                        | Tệp thực thi cho stdio transport. Để trống để dùng tệp nhị phân được quản lý.                                                                                                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho stdio transport.                                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | chưa đặt                                               | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                                    |
| `authToken`                                   | chưa đặt                                               | Bearer token cho WebSocket transport. Chấp nhận chuỗi literal hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Header WebSocket bổ sung. Giá trị header chấp nhận chuỗi literal hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa của nó.                                                                                                                                                                                                                                                                      |
| `remoteWorkspaceRoot`                         | chưa đặt                                               | Gốc workspace app-server Codex từ xa. Khi được đặt, OpenClaw suy luận gốc workspace cục bộ từ workspace OpenClaw đã phân giải, giữ nguyên hậu tố cwd hiện tại dưới gốc từ xa này, và chỉ gửi cwd app-server cuối cùng tới Codex. Nếu cwd nằm ngoài gốc workspace OpenClaw đã phân giải, OpenClaw fail closed thay vì gửi đường dẫn cục bộ của gateway tới app-server từ xa.                                  |
| `requestTimeoutMs`                            | `60000`                                                | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Khoảng lặng sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server trong phạm vi lượt trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                                                     |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Cơ chế bảo vệ completion-idle và tiến độ được dùng sau khi bàn giao công cụ, hoàn tất công cụ gốc, tiến độ raw assistant sau công cụ, hoàn tất reasoning thô, hoặc tiến độ reasoning trong khi OpenClaw chờ `turn/completed`. Dùng mục này cho khối lượng công việc đáng tin cậy hoặc nặng, nơi quá trình tổng hợp sau công cụ có thể hợp lệ khi im lặng lâu hơn ngân sách phát hành assistant cuối cùng. |
| `mode`                                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc được guardian đánh giá.                                                                                                                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` hoặc một chính sách phê duyệt guardian được phép | Chính sách phê duyệt Codex gốc được gửi khi bắt đầu thread, resume, và lượt.                                                                                                                                                                                                                                                                                                                                 |
| `sandbox`                                     | `"danger-full-access"` hoặc một sandbox guardian được phép | Chế độ sandbox Codex gốc được gửi khi bắt đầu và resume thread. Các sandbox OpenClaw đang hoạt động thu hẹp các lượt `danger-full-access` thành Codex `workspace-write`; cờ mạng của lượt tuân theo egress sandbox OpenClaw.                                                                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` hoặc một reviewer guardian được phép          | Dùng `"auto_review"` để cho Codex review các prompt phê duyệt gốc khi được phép.                                                                                                                                                                                                                                                                                                                             |
| `defaultWorkspaceDir`                         | thư mục tiến trình hiện tại                            | Workspace được `/codex bind` dùng khi bỏ qua `--cwd`.                                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | chưa đặt                                               | Bậc dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến fast-mode, `"flex"` yêu cầu xử lý flex, và `null` xóa override. `"fast"` cũ được chấp nhận là `"priority"`.                                                                                                                                                                                                                               |
| `networkProxy`                                | bị tắt                                                 | Chọn dùng mạng permissions-profile của Codex cho các lệnh app-server. OpenClaw định nghĩa cấu hình `permissions.<profile>.network` đã chọn và chọn nó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                                | Tùy chọn preview đăng ký một môi trường Codex được hậu thuẫn bởi sandbox OpenClaw với Codex app-server 0.132.0 trở lên để thực thi Codex gốc có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                                                           |

`appServer.networkProxy` là tường minh vì nó thay đổi hợp đồng sandbox của Codex.
Khi bật, OpenClaw cũng đặt `features.network_proxy.enabled` và
`default_permissions` trong cấu hình thread Codex để profile quyền được tạo
có thể khởi động mạng do Codex quản lý. Theo mặc định, OpenClaw tạo tên profile
`openclaw-network-<fingerprint>` chống va chạm từ nội dung profile; chỉ dùng
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
`networkProxy` dùng quyền truy cập hệ thống tệp kiểu workspace cho profile
quyền được tạo. Việc thực thi mạng do Codex quản lý là mạng được sandbox hóa,
vì vậy profile full-access sẽ không bảo vệ lưu lượng đi ra.

Plugin chặn các handshake app-server cũ hơn hoặc không có phiên bản. Codex app-server
phải báo cáo phiên bản ổn định `0.125.0` trở lên.

OpenClaw coi các URL máy chủ ứng dụng WebSocket không phải loopback là từ xa và yêu cầu xác thực WebSocket mang danh tính thông qua `appServer.authToken` hoặc header `Authorization`. `appServer.authToken` và từng giá trị `appServer.headers.*` có thể là SecretInput; runtime secrets phân giải SecretRefs và cú pháp rút gọn env trước khi OpenClaw tạo tùy chọn khởi động máy chủ ứng dụng, còn các SecretRefs có cấu trúc chưa phân giải sẽ thất bại trước khi bất kỳ token hoặc header nào được gửi. Khi các Plugin Codex gốc được cấu hình, OpenClaw dùng mặt phẳng điều khiển Plugin của máy chủ ứng dụng đã kết nối để cài đặt hoặc làm mới các Plugin đó, rồi làm mới kho ứng dụng để các ứng dụng do Plugin sở hữu hiển thị với luồng Codex. `app/list` vẫn là nguồn kho và siêu dữ liệu có thẩm quyền, nhưng chính sách OpenClaw quyết định liệu `thread/start` có gửi `config.apps[appId].enabled = true` cho một ứng dụng có thể truy cập đã được liệt kê hay không, ngay cả khi Codex hiện đánh dấu ứng dụng đó là đã tắt. Các app id không xác định hoặc bị thiếu vẫn đóng khi lỗi; đường dẫn này chỉ kích hoạt các Plugin marketplace thông qua `plugin/install` và làm mới kho. Chỉ kết nối OpenClaw với các máy chủ ứng dụng từ xa được tin cậy để chấp nhận các lượt cài đặt Plugin do OpenClaw quản lý và các lượt làm mới kho ứng dụng.

## Chế độ phê duyệt và sandbox

Các phiên máy chủ ứng dụng stdio cục bộ mặc định ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Tư thế vận hành cục bộ tin cậy này cho phép các lượt OpenClaw không có người giám sát và Heartbeat tiếp tục tiến triển mà không cần lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

Nếu tệp yêu cầu hệ thống cục bộ của Codex không cho phép các giá trị phê duyệt, reviewer hoặc sandbox YOLO ngầm định, OpenClaw sẽ coi mặc định ngầm định là guardian thay vào đó và chọn các quyền guardian được cho phép. `tools.exec.mode: "auto"` cũng buộc các phê duyệt Codex được guardian xem xét và không giữ lại các ghi đè legacy không an toàn `approvalPolicy: "never"` hoặc `sandbox: "danger-full-access"`; đặt `tools.exec.mode: "full"` cho một tư thế cố ý không cần phê duyệt. Các mục `[[remote_sandbox_config]]` khớp hostname trong cùng tệp yêu cầu được tôn trọng khi quyết định mặc định sandbox.

Đặt `appServer.mode: "guardian"` cho các phê duyệt Codex được guardian xem xét:

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
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"` khi các giá trị đó được cho phép. Các trường chính sách riêng lẻ ghi đè `mode`. Giá trị reviewer cũ hơn `guardian_subagent` vẫn được chấp nhận dưới dạng alias tương thích, nhưng các cấu hình mới nên dùng `auto_review`.

Khi sandbox OpenClaw đang hoạt động, tiến trình máy chủ ứng dụng Codex cục bộ vẫn chạy trên host Gateway. Vì vậy OpenClaw vô hiệu hóa Code Mode gốc của Codex, các máy chủ MCP của người dùng, và việc thực thi Plugin dựa trên ứng dụng cho lượt đó, thay vì coi sandboxing phía host Codex là tương đương với backend sandbox OpenClaw. Quyền truy cập shell được cung cấp thông qua các công cụ động dựa trên sandbox của OpenClaw như `sandbox_exec` và `sandbox_process` khi các công cụ exec/process thông thường có sẵn.

Trên các host Ubuntu/AppArmor, Codex bwrap có thể thất bại dưới `workspace-write` trước khi lệnh shell bắt đầu khi bạn cố ý chạy `workspace-write` gốc của Codex mà không có sandboxing OpenClaw đang hoạt động. Nếu bạn thấy `bwrap: setting up uid map: Permission denied` hoặc
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, hãy chạy
`openclaw doctor` và sửa chính sách namespace host được báo cáo cho người dùng dịch vụ OpenClaw thay vì cấp đặc quyền container Docker rộng hơn. Ưu tiên một profile AppArmor có phạm vi cho tiến trình dịch vụ; fallback `kernel.apparmor_restrict_unprivileged_userns=0` áp dụng toàn host và có đánh đổi về bảo mật.

## Thực thi gốc trong sandbox

Mặc định ổn định là đóng khi lỗi: sandboxing OpenClaw đang hoạt động sẽ vô hiệu hóa các bề mặt thực thi Codex gốc vốn nếu không sẽ chạy từ host máy chủ ứng dụng Codex. Chỉ dùng `appServer.experimental.sandboxExecServer: true` khi bạn muốn thử hỗ trợ môi trường từ xa của Codex với backend sandbox của OpenClaw. Đường dẫn xem trước này yêu cầu máy chủ ứng dụng Codex 0.132.0 trở lên.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Khi cờ này bật và phiên OpenClaw hiện tại đang ở trong sandbox, OpenClaw khởi động một exec-server local loopback được hỗ trợ bởi sandbox đang hoạt động, đăng ký nó với máy chủ ứng dụng Codex, rồi khởi động luồng và lượt Codex với môi trường do OpenClaw sở hữu đó. Nếu máy chủ ứng dụng không thể đăng ký môi trường, lượt chạy sẽ đóng khi lỗi thay vì âm thầm quay về thực thi trên host.

Đường dẫn xem trước này chỉ dành cho cục bộ. Một máy chủ ứng dụng WebSocket từ xa không thể tiếp cận exec-server loopback trừ khi nó đang chạy trên cùng host, vì vậy OpenClaw từ chối tổ hợp đó.

## Xác thực và cô lập môi trường

Xác thực được chọn theo thứ tự này:

1. Một profile xác thực OpenClaw Codex rõ ràng cho tác nhân.
2. Tài khoản hiện có của máy chủ ứng dụng trong Codex home của tác nhân đó.
3. Chỉ với các lượt khởi chạy máy chủ ứng dụng stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản máy chủ ứng dụng và xác thực OpenAI vẫn được yêu cầu.

Khi OpenClaw thấy một profile xác thực Codex kiểu đăng ký ChatGPT, nó xóa `CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được tạo. Điều đó giữ cho các API key cấp Gateway vẫn khả dụng cho embeddings hoặc các mô hình OpenAI trực tiếp mà không vô tình khiến các lượt máy chủ ứng dụng Codex gốc bị tính phí qua API.

Các profile khóa API Codex rõ ràng và fallback env-key stdio cục bộ dùng đăng nhập máy chủ ứng dụng thay vì env kế thừa của tiến trình con. Các kết nối máy chủ ứng dụng WebSocket không nhận fallback khóa API env của Gateway; hãy dùng một profile xác thực rõ ràng hoặc tài khoản riêng của máy chủ ứng dụng từ xa.

Các lượt khởi chạy máy chủ ứng dụng stdio mặc định kế thừa môi trường tiến trình của OpenClaw. OpenClaw sở hữu cầu nối tài khoản máy chủ ứng dụng Codex và đặt `CODEX_HOME` thành một thư mục theo tác nhân dưới trạng thái OpenClaw của tác nhân đó. Điều đó giữ cấu hình Codex, tài khoản, cache/dữ liệu Plugin, và trạng thái luồng trong phạm vi tác nhân OpenClaw thay vì rò rỉ từ home `~/.codex` cá nhân của người vận hành.

OpenClaw không viết lại `HOME` cho các lượt khởi chạy máy chủ ứng dụng cục bộ thông thường. Các subprocess do Codex chạy như `openclaw`, `gh`, `git`, CLI đám mây, và lệnh shell thấy home tiến trình thông thường và có thể tìm cấu hình cũng như token trong user-home. Codex cũng có thể phát hiện `$HOME/.agents/skills` và `$HOME/.agents/plugins/marketplace.json`; việc phát hiện `.agents` đó được cố ý chia sẻ với home của người vận hành và tách biệt với trạng thái `~/.codex` đã cô lập.

Các Plugin OpenClaw và ảnh chụp Skills OpenClaw vẫn đi qua registry Plugin và bộ nạp Skills riêng của OpenClaw. Tài sản Codex cá nhân trong `~/.codex` thì không. Nếu bạn có Skills hoặc Plugin Codex CLI hữu ích từ một Codex home nên trở thành một phần của tác nhân OpenClaw, hãy kiểm kê chúng rõ ràng:

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con máy chủ ứng dụng Codex được tạo. OpenClaw xóa `CODEX_HOME` và `HOME` khỏi danh sách này trong quá trình chuẩn hóa khởi chạy cục bộ: `CODEX_HOME` vẫn theo từng tác nhân, và `HOME` vẫn được kế thừa để subprocess có thể dùng trạng thái user-home thông thường.

## Công cụ động

Công cụ động Codex mặc định dùng cách nạp `searchable`. OpenClaw không cung cấp các công cụ động trùng lặp với các thao tác workspace gốc của Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Hầu hết các công cụ tích hợp OpenClaw còn lại, như nhắn tin, media, cron, trình duyệt, nodes, Gateway, `heartbeat_respond`, và `web_search`, có sẵn thông qua tìm kiếm công cụ Codex dưới namespace `openclaw`. Điều này giữ cho ngữ cảnh mô hình ban đầu nhỏ hơn. `sessions_yield` và các phản hồi nguồn chỉ bằng công cụ tin nhắn vẫn trực tiếp vì đó là các hợp đồng điều khiển lượt. `sessions_spawn` vẫn searchable để `spawn_agent` gốc của Codex vẫn là bề mặt subagent Codex chính, trong khi ủy quyền OpenClaw hoặc ACP rõ ràng vẫn có sẵn thông qua namespace công cụ động `openclaw`.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối với một máy chủ ứng dụng Codex tùy chỉnh không thể tìm kiếm các công cụ động bị trì hoãn hoặc khi gỡ lỗi toàn bộ payload công cụ.

## Thời gian chờ

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`. Mỗi yêu cầu Codex `item/tool/call` dùng thời gian chờ đầu tiên có sẵn theo thứ tự này:

- Đối số `timeoutMs` theo từng lệnh gọi có giá trị dương.
- Với `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Với `image_generate` không có thời gian chờ đã cấu hình, mặc định tạo ảnh 120 giây.
- Với công cụ hiểu media `image`, `tools.media.image.timeoutSeconds` được chuyển sang mili giây, hoặc mặc định media 60 giây. Với hiểu ảnh, điều này áp dụng cho chính yêu cầu và không bị giảm bởi công việc chuẩn bị trước đó.
- Mặc định công cụ động 90 giây.

Watchdog này là ngân sách ngoài cho `item/tool/call` động. Các thời gian chờ yêu cầu theo từng provider chạy bên trong lệnh gọi đó và giữ ngữ nghĩa timeout riêng. Ngân sách công cụ động bị giới hạn ở 600000 ms. Khi timeout, OpenClaw hủy tín hiệu công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi Codex chấp nhận một lượt, và sau khi OpenClaw phản hồi một yêu cầu máy chủ ứng dụng trong phạm vi lượt, harness kỳ vọng Codex sẽ tạo tiến triển cho lượt hiện tại và cuối cùng kết thúc lượt gốc bằng `turn/completed`. Nếu máy chủ ứng dụng im lặng trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw cố gắng hết mức ngắt lượt Codex, ghi lại timeout chẩn đoán, và giải phóng lane phiên OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một lượt gốc đã cũ.

Hầu hết thông báo chưa kết thúc cho cùng một lượt sẽ vô hiệu hóa bộ giám sát ngắn đó
vì Codex đã chứng minh lượt vẫn còn hoạt động. Các lần bàn giao công cụ dùng ngân sách
nhàn rỗi sau công cụ dài hơn: sau khi OpenClaw trả về phản hồi `item/tool/call`, sau khi
các mục công cụ native như `commandExecution` hoàn tất, sau các lần hoàn tất
`custom_tool_call_output` thô, và sau tiến trình assistant thô sau công cụ, các lần
hoàn tất reasoning thô, hoặc tiến trình reasoning. Bộ bảo vệ dùng
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình và
mặc định là năm phút nếu không. Cùng ngân sách sau công cụ đó cũng kéo dài
bộ giám sát tiến trình cho cửa sổ tổng hợp im lặng trước khi Codex phát sự kiện
lượt hiện tại tiếp theo. Các lần hoàn tất reasoning, các lần hoàn tất
`agentMessage` trong commentary, và tiến trình reasoning hoặc assistant thô trước công cụ có thể
được theo sau bởi một phản hồi cuối tự động, nên chúng dùng bộ bảo vệ phản hồi
sau tiến trình thay vì giải phóng làn phiên ngay lập tức. Chỉ các mục
`agentMessage` cuối/không phải commentary đã hoàn tất và các lần hoàn tất assistant thô trước công cụ
mới kích hoạt cơ chế giải phóng đầu ra assistant: nếu Codex sau đó im lặng mà không có
`turn/completed`, OpenClaw sẽ cố gắng tối đa để ngắt lượt native và giải phóng
làn phiên. Các lỗi app-server stdio an toàn để phát lại, bao gồm
timeout nhàn rỗi khi hoàn tất lượt mà không có bằng chứng về assistant, công cụ, mục đang hoạt động,
hoặc tác dụng phụ, sẽ được thử lại một lần trên một lần app-server mới. Các
timeout không an toàn vẫn loại bỏ client app-server bị kẹt và giải phóng làn phiên
OpenClaw. Chúng cũng xóa liên kết luồng native đã cũ thay vì được phát lại
tự động. Các timeout theo dõi hoàn tất hiển thị văn bản timeout dành riêng cho Codex:
các trường hợp an toàn để phát lại nói rằng phản hồi có thể chưa hoàn chỉnh, trong khi các trường hợp
không an toàn yêu cầu người dùng xác minh trạng thái hiện tại trước khi thử lại. Chẩn đoán timeout
công khai bao gồm các trường cấu trúc như phương thức thông báo app-server cuối cùng,
id/type/role của mục phản hồi assistant thô, số lượng request/mục đang hoạt động, và trạng thái
theo dõi đã kích hoạt. Khi thông báo cuối cùng là một mục phản hồi assistant thô, chúng
cũng bao gồm bản xem trước văn bản assistant có giới hạn. Chúng không bao gồm prompt thô hoặc
nội dung công cụ.

## Khám phá mô hình

Theo mặc định, Codex Plugin hỏi app-server về các mô hình có sẵn. Tính
sẵn có của mô hình do Codex app-server sở hữu, nên danh sách có thể thay đổi khi OpenClaw
nâng cấp phiên bản `@openai/codex` được đóng gói hoặc khi một triển khai trỏ
`appServer.command` tới một binary Codex khác. Tính sẵn có cũng có thể
được giới hạn theo tài khoản. Dùng `/codex models` trên một gateway đang chạy để xem catalog trực tiếp
cho harness và tài khoản đó.

Nếu khám phá thất bại hoặc hết thời gian chờ, OpenClaw dùng catalog dự phòng được đóng gói cho:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Harness hiện được đóng gói là `@openai/codex` `0.139.0`. Một probe `model/list`
đối với app-server được đóng gói đó đã trả về:

| ID mô hình      | Mặc định | Ẩn    | Phương thức đầu vào | Mức nỗ lực reasoning     |
| --------------- | -------- | ----- | ------------------- | ------------------------ |
| `gpt-5.5`       | Có       | Không | text, image         | low, medium, high, xhigh |
| `gpt-5.4`       | Không    | Không | text, image         | low, medium, high, xhigh |
| `gpt-5.4-mini`  | Không    | Không | text, image         | low, medium, high, xhigh |
| `gpt-5.3-codex` | Không    | Không | text, image         | low, medium, high, xhigh |
| `gpt-5.2`       | Không    | Không | text, image         | low, medium, high, xhigh |

Các mô hình ẩn có thể được catalog app-server trả về cho các luồng nội bộ hoặc
chuyên biệt, nhưng chúng không phải là lựa chọn bình thường trong bộ chọn mô hình.

Điều chỉnh khám phá trong `plugins.entries.codex.config.discovery`:

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
catalog dự phòng:

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

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án native. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào các tên tệp dự phòng
của Codex cho tệp persona, vì các dự phòng Codex chỉ áp dụng khi
`AGENTS.md` bị thiếu.

Để đạt tương đương workspace trong OpenClaw, harness Codex phân giải các tệp bootstrap
khác. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, và `USER.md` được chuyển tiếp dưới dạng
chỉ dẫn developer OpenClaw Codex vì chúng định nghĩa agent đang hoạt động,
hướng dẫn workspace có sẵn, và hồ sơ người dùng. Danh sách Skills OpenClaw rút gọn
được chuyển tiếp dưới dạng chỉ dẫn developer cộng tác theo phạm vi lượt.
Nội dung `HEARTBEAT.md` không được chèn; các lượt heartbeat nhận một con trỏ chế độ cộng tác
để đọc tệp khi tệp tồn tại và không rỗng. Nội dung `MEMORY.md`
từ workspace agent đã cấu hình không được dán vào input lượt Codex native
khi các công cụ memory có sẵn cho workspace đó; khi tệp tồn tại, harness
thêm một con trỏ workspace-memory nhỏ vào chỉ dẫn developer cộng tác theo phạm vi lượt
và Codex nên dùng `memory_search` hoặc `memory_get` khi memory bền vững
có liên quan. Nếu công cụ bị tắt, tìm kiếm memory không khả dụng, hoặc
workspace đang hoạt động khác với workspace memory của agent, `MEMORY.md` dùng
đường dẫn ngữ cảnh lượt có giới hạn bình thường.
`BOOTSTRAP.md` khi có sẽ được chuyển tiếp dưới dạng ngữ cảnh tham chiếu input lượt OpenClaw.

## Ghi đè môi trường

Ghi đè môi trường vẫn có sẵn cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua binary được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị loại bỏ. Thay vào đó hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi Plugin trong
cùng tệp đã được rà soát với phần còn lại của thiết lập harness Codex.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex native](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
