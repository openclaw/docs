---
read_when:
    - Bạn cần mọi trường cấu hình harness Codex
    - Bạn đang thay đổi hành vi vận chuyển, xác thực, khám phá hoặc thời gian chờ của app-server
    - Bạn đang gỡ lỗi quá trình khởi động harness Codex, khám phá mô hình hoặc cô lập môi trường
summary: Tham khảo về cấu hình, xác thực, khám phá và máy chủ ứng dụng cho harness Codex
title: Tham chiếu harness Codex
x-i18n:
    generated_at: "2026-07-01T08:12:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Tài liệu tham khảo này trình bày cấu hình chi tiết cho Plugin `codex`
được đóng gói. Để thiết lập và quyết định định tuyến, hãy bắt đầu với
[harness Codex](/vi/plugins/codex-harness).

## Bề mặt cấu hình Plugin

Tất cả cài đặt harness Codex nằm dưới `plugins.entries.codex.config`.

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
| `discovery`                | đã bật                   | Cài đặt khám phá mô hình cho `model/list` của app-server Codex.                                                                           |
| `appServer`                | app-server stdio được quản lý | Cài đặt truyền tải, lệnh, xác thực, phê duyệt, sandbox và thời gian chờ.                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | Dùng `"direct"` để đặt trực tiếp các công cụ động của OpenClaw vào ngữ cảnh công cụ Codex ban đầu.                                        |
| `codexDynamicToolsExclude` | `[]`                     | Tên công cụ động OpenClaw bổ sung cần bỏ qua khỏi các lượt app-server Codex.                                                              |
| `codexPlugins`             | đã tắt                   | Hỗ trợ Plugin/ứng dụng Codex gốc cho các Plugin tuyển chọn được cài đặt từ nguồn đã di chuyển. Xem [Plugin Codex gốc](/vi/plugins/codex-native-plugins). |
| `computerUse`              | đã tắt                   | Thiết lập Codex Computer Use. Xem [Codex Computer Use](/vi/plugins/codex-computer-use).                                                      |

## Truyền tải app-server

Theo mặc định, OpenClaw khởi động tệp nhị phân Codex được quản lý đi kèm với
Plugin được đóng gói:

```bash
codex app-server --listen stdio://
```

Điều này giữ phiên bản app-server gắn với Plugin `codex` được đóng gói thay vì
bất kỳ Codex CLI riêng biệt nào tình cờ được cài đặt cục bộ. Chỉ đặt
`appServer.command` khi bạn chủ ý muốn chạy một tệp thực thi khác.

Với app-server đã chạy sẵn, hãy dùng truyền tải WebSocket:

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

| Trường                                        | Mặc định                                              | Ý nghĩa                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                                                                                                                                                                    |
| `command`                                     | tệp nhị phân Codex được quản lý                        | Tệp thực thi cho truyền tải stdio. Để trống để dùng tệp nhị phân được quản lý.                                                                                                                                                                                                                                                                                                                 |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho truyền tải stdio.                                                                                                                                                                                                                                                                                                                                                                   |
| `url`                                         | chưa đặt                                               | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | chưa đặt                                               | Mã thông báo Bearer cho truyền tải WebSocket. Chấp nhận chuỗi nguyên văn hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                     |
| `headers`                                     | `{}`                                                   | Header WebSocket bổ sung. Giá trị header chấp nhận chuỗi nguyên văn hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                           |
| `clearEnv`                                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa của nó.                                                                                                                                                                                                                                                       |
| `remoteWorkspaceRoot`                         | chưa đặt                                               | Gốc không gian làm việc app-server Codex từ xa. Khi được đặt, OpenClaw suy luận gốc không gian làm việc cục bộ từ không gian làm việc OpenClaw đã phân giải, giữ lại hậu tố cwd hiện tại dưới gốc từ xa này, và chỉ gửi cwd app-server cuối cùng tới Codex. Nếu cwd nằm ngoài gốc không gian làm việc OpenClaw đã phân giải, OpenClaw thất bại theo hướng đóng an toàn thay vì gửi đường dẫn cục bộ của Gateway tới app-server từ xa. |
| `requestTimeoutMs`                            | `60000`                                                | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển app-server.                                                                                                                                                                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Cửa sổ im lặng sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server theo phạm vi lượt trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                                     |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Bộ bảo vệ trạng thái nhàn rỗi hoàn tất và tiến trình được dùng sau khi bàn giao công cụ, hoàn tất công cụ native, tiến trình trợ lý thô sau công cụ, hoàn tất suy luận thô, hoặc tiến trình suy luận trong khi OpenClaw chờ `turn/completed`. Dùng tùy chọn này cho khối lượng công việc đáng tin cậy hoặc nặng, nơi tổng hợp sau công cụ có thể im lặng lâu hơn ngân sách phát hành trợ lý cuối cùng một cách hợp lệ. |
| `mode`                                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Thiết lập sẵn cho thực thi YOLO hoặc thực thi được người giám sát xem xét.                                                                                                                                                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` hoặc một chính sách phê duyệt guardian được phép | Chính sách phê duyệt native của Codex được gửi tới lúc bắt đầu luồng, tiếp tục luồng, và lượt.                                                                                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` hoặc một sandbox guardian được phép | Chế độ sandbox native của Codex được gửi tới lúc bắt đầu và tiếp tục luồng. Các sandbox OpenClaw đang hoạt động thu hẹp lượt `danger-full-access` thành Codex `workspace-write`; cờ mạng của lượt tuân theo egress sandbox OpenClaw.                                                                                                                                                            |
| `approvalsReviewer`                           | `"user"` hoặc một người đánh giá guardian được phép     | Dùng `"auto_review"` để cho Codex xem xét lời nhắc phê duyệt native khi được phép.                                                                                                                                                                                                                                                                                                             |
| `defaultWorkspaceDir`                         | thư mục tiến trình hiện tại                            | Không gian làm việc được `/codex bind` dùng khi bỏ qua `--cwd`.                                                                                                                                                                                                                                                                                                                               |
| `serviceTier`                                 | chưa đặt                                               | Bậc dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý flex, và `null` xóa ghi đè. `"fast"` cũ được chấp nhận như `"priority"`.                                                                                                                                                                                                                |
| `networkProxy`                                | bị vô hiệu hóa                                         | Chọn tham gia kết nối mạng hồ sơ quyền của Codex cho lệnh app-server. OpenClaw định nghĩa cấu hình `permissions.<profile>.network` đã chọn và chọn nó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                                        |
| `experimental.sandboxExecServer`              | `false`                                                | Tùy chọn tham gia bản xem trước, đăng ký một môi trường Codex do sandbox OpenClaw hỗ trợ với Codex app-server 0.132.0 trở lên để thực thi native của Codex có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                              |

`appServer.networkProxy` là tường minh vì nó thay đổi hợp đồng sandbox của Codex.
Khi được bật, OpenClaw cũng đặt `features.network_proxy.enabled` và
`default_permissions` trong cấu hình luồng Codex để hồ sơ quyền được tạo có thể
khởi động kết nối mạng do Codex quản lý. Theo mặc định, OpenClaw tạo tên hồ sơ
`openclaw-network-<fingerprint>` chống va chạm từ phần thân hồ sơ; chỉ dùng
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
`networkProxy` dùng quyền truy cập hệ thống tệp kiểu không gian làm việc cho hồ sơ
quyền được tạo. Thực thi mạng do Codex quản lý là kết nối mạng được sandbox hóa,
nên hồ sơ toàn quyền truy cập sẽ không bảo vệ lưu lượng đi ra.

Plugin chặn các handshake app-server cũ hơn hoặc không có phiên bản. Codex app-server
phải báo cáo phiên bản ổn định `0.125.0` trở lên.

OpenClaw xem các URL app-server WebSocket không phải loopback là từ xa và yêu cầu
xác thực WebSocket mang danh tính thông qua `appServer.authToken` hoặc header
`Authorization`. `appServer.authToken` và từng giá trị `appServer.headers.*`
có thể là SecretInput; runtime secrets phân giải SecretRefs và cú pháp viết tắt
env trước khi OpenClaw tạo tùy chọn khởi động app-server, và các SecretRefs có
cấu trúc chưa được phân giải sẽ lỗi trước khi bất kỳ token hoặc header nào được gửi. Khi các
Plugin Codex native được cấu hình, OpenClaw dùng control plane Plugin của
app-server đã kết nối để cài đặt hoặc làm mới các Plugin đó rồi làm mới kho ứng dụng
để các ứng dụng do Plugin sở hữu hiển thị với thread Codex. `app/list` vẫn là
nguồn kho và siêu dữ liệu có thẩm quyền, nhưng chính sách OpenClaw quyết định liệu
`thread/start` có gửi `config.apps[appId].enabled = true` cho một ứng dụng được liệt kê và có thể truy cập
ngay cả khi Codex hiện đánh dấu nó là tắt hay không. Các app id không xác định hoặc bị thiếu vẫn
đóng khi lỗi; đường dẫn này chỉ kích hoạt các Plugin marketplace thông qua `plugin/install`
và làm mới kho. Chỉ kết nối OpenClaw với các app-server từ xa đáng tin cậy để
chấp nhận các lần cài đặt Plugin do OpenClaw quản lý và làm mới kho ứng dụng.

## Chế độ phê duyệt và sandbox

Các phiên app-server stdio cục bộ mặc định dùng chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Tư thế vận hành cục bộ đáng tin cậy này cho phép
các lượt OpenClaw không giám sát và Heartbeat tiếp tục tiến triển mà không có
lời nhắc phê duyệt native khi không có ai ở đó để trả lời.

Nếu tệp yêu cầu hệ thống cục bộ của Codex không cho phép các giá trị phê duyệt YOLO,
người đánh giá hoặc sandbox ngầm định, OpenClaw sẽ xem mặc định ngầm định là guardian
thay vào đó và chọn các quyền guardian được phép. `tools.exec.mode: "auto"`
cũng buộc các phê duyệt Codex do guardian đánh giá và không giữ lại các ghi đè legacy không an toàn
`approvalPolicy: "never"` hoặc `sandbox: "danger-full-access"`;
đặt `tools.exec.mode: "full"` cho một tư thế cố ý không cần phê duyệt.
Các mục
`[[remote_sandbox_config]]` khớp hostname trong cùng tệp yêu cầu được tôn trọng
cho quyết định mặc định sandbox.

Đặt `appServer.mode: "guardian"` cho các phê duyệt Codex do guardian đánh giá:

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
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"` khi các
giá trị đó được phép. Các trường chính sách riêng lẻ ghi đè `mode`. Giá trị người đánh giá cũ hơn
`guardian_subagent` vẫn được chấp nhận dưới dạng bí danh tương thích,
nhưng cấu hình mới nên dùng `auto_review`.

Khi sandbox OpenClaw đang hoạt động, tiến trình app-server Codex cục bộ vẫn
chạy trên máy chủ Gateway. Vì vậy OpenClaw tắt Code Mode native của Codex,
máy chủ MCP của người dùng, và thực thi Plugin dựa trên ứng dụng cho lượt đó thay vì
xem sandbox phía máy chủ Codex là tương đương với backend sandbox OpenClaw.
Quyền truy cập shell được phơi bày thông qua các công cụ động dựa trên sandbox OpenClaw
như `sandbox_exec` và `sandbox_process` khi các công cụ exec/process thông thường
khả dụng.

Trên máy chủ Ubuntu/AppArmor, bwrap của Codex có thể lỗi dưới `workspace-write` trước khi
lệnh shell bắt đầu khi bạn cố ý chạy `workspace-write` native của Codex
mà không có sandbox OpenClaw hoạt động. Nếu bạn thấy
`bwrap: setting up uid map: Permission denied` hoặc
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, hãy chạy
`openclaw doctor` và sửa chính sách namespace máy chủ được báo cáo cho người dùng dịch vụ OpenClaw
thay vì cấp quyền Docker container rộng hơn. Ưu tiên
một profile AppArmor có phạm vi cho tiến trình dịch vụ; phương án dự phòng
`kernel.apparmor_restrict_unprivileged_userns=0` áp dụng toàn máy chủ và có
đánh đổi về bảo mật.

## Thực thi native trong sandbox

Mặc định ổn định là đóng khi lỗi: sandbox OpenClaw đang hoạt động sẽ tắt các bề mặt thực thi native của Codex
vốn sẽ chạy từ máy chủ app-server Codex. Chỉ dùng `appServer.experimental.sandboxExecServer: true` khi bạn muốn
thử hỗ trợ môi trường từ xa của Codex với backend sandbox của OpenClaw. Đường dẫn
xem trước này yêu cầu app-server Codex 0.132.0 hoặc mới hơn.

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

Khi cờ bật và phiên OpenClaw hiện tại đang chạy trong sandbox, OpenClaw
khởi động một exec-server local loopback được hỗ trợ bởi sandbox đang hoạt động, đăng ký nó
với app-server Codex, rồi khởi động thread và lượt Codex với môi trường
do OpenClaw sở hữu đó. Nếu app-server không thể đăng ký môi trường,
lượt chạy sẽ đóng khi lỗi thay vì âm thầm quay về thực thi trên máy chủ.

Đường dẫn xem trước này chỉ dành cho cục bộ. Một app-server WebSocket từ xa không thể truy cập
exec-server loopback trừ khi nó đang chạy trên cùng máy chủ, nên OpenClaw từ chối
tổ hợp đó.

## Xác thực và cô lập môi trường

Xác thực được chọn theo thứ tự này:

1. Một profile xác thực OpenClaw Codex rõ ràng cho agent.
2. Tài khoản hiện có của app-server trong Codex home của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server nào và xác thực OpenAI
   vẫn được yêu cầu.

Khi OpenClaw thấy profile xác thực Codex kiểu gói đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Việc đó
giữ các khóa API cấp Gateway khả dụng cho embeddings hoặc các mô hình OpenAI trực tiếp
mà không khiến các lượt app-server Codex native vô tình được tính phí qua API.

Các profile khóa API Codex rõ ràng và phương án dự phòng khóa env stdio cục bộ dùng đăng nhập app-server
thay vì env kế thừa của tiến trình con. Các kết nối app-server WebSocket
không nhận phương án dự phòng khóa API env của Gateway; hãy dùng profile xác thực rõ ràng hoặc
tài khoản riêng của app-server từ xa.

Các lần khởi chạy app-server stdio mặc định kế thừa môi trường tiến trình của OpenClaw.
OpenClaw sở hữu cầu nối tài khoản app-server Codex và đặt `CODEX_HOME` thành
một thư mục theo từng agent bên dưới trạng thái OpenClaw của agent đó. Điều đó giữ cấu hình Codex,
tài khoản, cache/dữ liệu Plugin, và trạng thái thread nằm trong phạm vi agent OpenClaw
thay vì rò rỉ từ home `~/.codex` cá nhân của người vận hành.

OpenClaw không viết lại `HOME` cho các lần khởi chạy app-server cục bộ thông thường. Các tiến trình con do Codex chạy
như `openclaw`, `gh`, `git`, các CLI đám mây, và lệnh shell thấy
home tiến trình thông thường và có thể tìm cấu hình cùng token trong user-home. Codex cũng có thể
phát hiện `$HOME/.agents/skills` và `$HOME/.agents/plugins/marketplace.json`;
việc phát hiện `.agents` đó được cố ý chia sẻ với home của người vận hành và
tách biệt với trạng thái `~/.codex` được cô lập.

Các Plugin OpenClaw và ảnh chụp nhanh skill OpenClaw vẫn đi qua
registry Plugin và bộ nạp skill riêng của OpenClaw. Tài sản Codex `~/.codex` cá nhân thì không. Nếu
bạn có Skills hoặc Plugin Codex CLI hữu ích từ một Codex home nên trở thành
một phần của agent OpenClaw, hãy kiểm kê chúng một cách rõ ràng:

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex được sinh ra.
OpenClaw xóa `CODEX_HOME` và `HOME` khỏi danh sách này trong quá trình chuẩn hóa khởi chạy cục bộ:
`CODEX_HOME` vẫn theo từng agent, và `HOME` vẫn được kế thừa để
các tiến trình con có thể dùng trạng thái user-home thông thường.

## Công cụ động

Công cụ động Codex mặc định dùng cách nạp `searchable`. OpenClaw không phơi bày
các công cụ động trùng lặp với thao tác workspace native của Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Phần lớn công cụ tích hợp OpenClaw còn lại, như nhắn tin, media, cron,
trình duyệt, nodes, gateway, `heartbeat_respond`, và `web_search`, khả dụng
thông qua tìm kiếm công cụ Codex dưới namespace `openclaw`. Điều này giữ ngữ cảnh
mô hình ban đầu nhỏ hơn. `sessions_yield` và các phản hồi nguồn chỉ dành cho công cụ tin nhắn
vẫn trực tiếp vì đó là các hợp đồng điều khiển lượt. `sessions_spawn` vẫn
searchable để `spawn_agent` native của Codex vẫn là bề mặt subagent Codex chính,
trong khi ủy quyền OpenClaw hoặc ACP rõ ràng vẫn khả dụng thông qua
namespace công cụ động `openclaw`.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối tới một app-server Codex tùy chỉnh
không thể tìm kiếm các công cụ động bị hoãn hoặc khi gỡ lỗi toàn bộ
payload công cụ.

## Thời gian chờ

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`. Mỗi yêu cầu `item/tool/call` của Codex dùng thời gian chờ đầu tiên
khả dụng theo thứ tự này:

- Đối số `timeoutMs` theo từng lệnh gọi có giá trị dương.
- Với `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Với `image_generate` không có thời gian chờ được cấu hình, mặc định tạo ảnh
  120 giây.
- Với công cụ `image` hiểu media, `tools.media.image.timeoutSeconds`
  được chuyển sang mili giây, hoặc mặc định media 60 giây. Với hiểu ảnh,
  điều này áp dụng cho chính yêu cầu và không bị giảm bởi
  công việc chuẩn bị trước đó.
- Mặc định công cụ động 90 giây.

Watchdog này là ngân sách ngoài cùng cho `item/tool/call` động. Các thời gian chờ yêu cầu
riêng theo provider chạy bên trong lệnh gọi đó và giữ ngữ nghĩa thời gian chờ riêng.
Ngân sách công cụ động được giới hạn ở 600000 ms. Khi hết thời gian chờ, OpenClaw hủy
tín hiệu công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex
để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi Codex chấp nhận một lượt, và sau khi OpenClaw phản hồi một yêu cầu app-server
có phạm vi theo lượt, harness kỳ vọng Codex tiếp tục tiến triển trong lượt hiện tại và
cuối cùng hoàn tất lượt native bằng `turn/completed`. Nếu app-server im lặng
trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw cố gắng hết mức để
ngắt lượt Codex, ghi lại một chẩn đoán hết thời gian chờ, và giải phóng
lane phiên OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một
lượt native cũ.

Hầu hết thông báo chưa kết thúc cho cùng một lượt sẽ vô hiệu hóa bộ giám sát ngắn đó
vì Codex đã chứng minh lượt đó vẫn còn hoạt động. Các lần chuyển giao công cụ dùng
ngân sách nhàn rỗi sau công cụ dài hơn: sau khi OpenClaw trả về phản hồi
`item/tool/call`, sau khi các mục công cụ native như `commandExecution` hoàn tất,
sau các lần hoàn tất `custom_tool_call_output` thô, và sau tiến trình assistant thô
sau công cụ, các lần hoàn tất reasoning thô, hoặc tiến trình reasoning. Bộ bảo vệ dùng
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình và
mặc định là năm phút nếu không. Cùng ngân sách sau công cụ đó cũng kéo dài
bộ giám sát tiến trình cho cửa sổ tổng hợp im lặng trước khi Codex phát ra
sự kiện lượt hiện tại tiếp theo. Các lần hoàn tất reasoning, hoàn tất
`agentMessage` commentary, và tiến trình reasoning hoặc assistant thô trước công cụ có thể
được theo sau bởi một phản hồi cuối tự động, nên chúng dùng bộ bảo vệ phản hồi
sau tiến trình thay vì giải phóng làn phiên ngay lập tức. Chỉ các mục
`agentMessage` đã hoàn tất dạng cuối/không phải commentary và các lần hoàn tất assistant thô
trước công cụ mới kích hoạt cơ chế giải phóng đầu ra assistant: nếu sau đó Codex im lặng mà không có
`turn/completed`, OpenClaw sẽ cố gắng hết sức để ngắt lượt native và giải phóng
làn phiên. Các lỗi app-server stdio an toàn để phát lại, bao gồm
thời gian chờ nhàn rỗi khi hoàn tất lượt mà không có bằng chứng assistant, công cụ, mục đang hoạt động,
hoặc tác dụng phụ, sẽ được thử lại một lần trên một lượt thử app-server mới. Các
thời gian chờ không an toàn vẫn cho client app-server bị kẹt nghỉ hưu và giải phóng làn
phiên OpenClaw. Chúng cũng xóa liên kết luồng native đã cũ thay vì được
tự động phát lại. Thời gian chờ theo dõi hoàn tất hiển thị văn bản thời gian chờ
riêng cho Codex: các trường hợp an toàn để phát lại nói rằng phản hồi có thể chưa hoàn chỉnh,
còn các trường hợp không an toàn yêu cầu người dùng xác minh trạng thái hiện tại trước khi thử lại.
Chẩn đoán thời gian chờ công khai bao gồm các trường cấu trúc như phương thức thông báo
app-server cuối cùng, id/kiểu/vai trò của mục phản hồi assistant thô, số lượng
yêu cầu/mục đang hoạt động, và trạng thái theo dõi đã được kích hoạt. Khi thông báo cuối
là một mục phản hồi assistant thô, chúng cũng bao gồm bản xem trước văn bản assistant
có giới hạn. Chúng không bao gồm prompt thô hoặc nội dung công cụ.

## Khám phá mô hình

Theo mặc định, Plugin Codex yêu cầu app-server cung cấp các mô hình khả dụng. Tính
khả dụng của mô hình do Codex app-server sở hữu, nên danh sách có thể thay đổi khi OpenClaw
nâng cấp phiên bản `@openai/codex` được đóng gói hoặc khi một triển khai trỏ
`appServer.command` đến một binary Codex khác. Tính khả dụng cũng có thể
phụ thuộc vào tài khoản. Dùng `/codex models` trên một Gateway đang chạy để xem catalog trực tiếp
cho harness và tài khoản đó.

Nếu khám phá thất bại hoặc hết thời gian, OpenClaw dùng catalog dự phòng được đóng gói cho:

- GPT-5.5
- GPT-5.4 mini

Harness được đóng gói hiện tại là `@openai/codex` `0.142.4`. Một probe `model/list`
đối với app-server được đóng gói đó trong workspace bật GPT-5.6 đã trả về các
hàng bộ chọn công khai sau:

| Id mô hình            | Phương thức đầu vào | Mức nỗ lực reasoning                 |
| --------------------- | ------------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image         | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image         | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image         | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image         | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image         | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text                | low, medium, high, xhigh             |

Quyền truy cập GPT-5.6 phụ thuộc vào tài khoản trong giai đoạn xem trước giới hạn. `max` là một
mức nỗ lực reasoning của mô hình. `ultra` là siêu dữ liệu điều phối đa agent riêng của Codex,
không phải một mức nỗ lực reasoning OpenAI tiêu chuẩn.

Các mô hình ẩn có thể được catalog app-server trả về cho những luồng nội bộ hoặc
chuyên biệt, nhưng chúng không phải lựa chọn bình thường trong bộ chọn mô hình.

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

Codex tự xử lý `AGENTS.md` thông qua khám phá tài liệu dự án native. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào các tên tệp dự phòng
của Codex cho tệp persona, vì cơ chế dự phòng của Codex chỉ áp dụng khi
thiếu `AGENTS.md`.

Để bảo đảm tương đương workspace OpenClaw, harness Codex phân giải các tệp bootstrap
khác. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, và `USER.md` được chuyển tiếp làm
chỉ dẫn developer OpenClaw Codex vì chúng định nghĩa agent đang hoạt động,
hướng dẫn workspace khả dụng, và hồ sơ người dùng. Danh sách Skills OpenClaw gọn
được chuyển tiếp làm chỉ dẫn developer cộng tác theo phạm vi lượt.
Nội dung `HEARTBEAT.md` không được chèn; các lượt Heartbeat nhận một con trỏ chế độ cộng tác
để đọc tệp khi tệp tồn tại và không rỗng. Nội dung `MEMORY.md`
từ workspace agent đã cấu hình không được dán vào đầu vào lượt Codex native
khi công cụ bộ nhớ khả dụng cho workspace đó; khi tệp tồn tại, harness
thêm một con trỏ bộ nhớ workspace nhỏ vào chỉ dẫn developer cộng tác
theo phạm vi lượt và Codex nên dùng `memory_search` hoặc `memory_get` khi bộ nhớ bền
có liên quan. Nếu công cụ bị tắt, tìm kiếm bộ nhớ không khả dụng, hoặc
workspace đang hoạt động khác với workspace bộ nhớ agent, `MEMORY.md` dùng
đường dẫn ngữ cảnh lượt có giới hạn thông thường.
`BOOTSTRAP.md` khi có mặt được chuyển tiếp làm ngữ cảnh tham chiếu đầu vào lượt OpenClaw.

## Ghi đè môi trường

Ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua binary được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị gỡ bỏ. Thay vào đó, dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ dùng một lần. Cấu hình được
ưu tiên cho các triển khai lặp lại được vì nó giữ hành vi Plugin trong cùng
tệp đã được rà soát với phần còn lại của thiết lập harness Codex.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Thời gian chạy harness Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex native](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
