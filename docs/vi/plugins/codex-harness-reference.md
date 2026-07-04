---
read_when:
    - Bạn cần mọi trường cấu hình harness của Codex
    - Bạn đang thay đổi hành vi truyền tải, xác thực, khám phá hoặc thời gian chờ của app-server
    - Bạn đang gỡ lỗi quá trình khởi động bộ khung Codex, khám phá mô hình hoặc cô lập môi trường
summary: Tham chiếu về cấu hình, xác thực, khám phá và máy chủ ứng dụng cho bộ kiểm thử Codex
title: Tài liệu tham khảo về harness Codex
x-i18n:
    generated_at: "2026-07-04T20:34:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Tài liệu tham chiếu này trình bày cấu hình chi tiết cho Plugin `codex`
được đóng gói sẵn. Để thiết lập và quyết định định tuyến, hãy bắt đầu với
[bộ điều phối Codex](/vi/plugins/codex-harness).

## Bề mặt cấu hình Plugin

Tất cả cài đặt bộ điều phối Codex nằm dưới `plugins.entries.codex.config`.

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

| Trường                     | Mặc định                 | Ý nghĩa                                                                                                                                              |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | bật                      | Cài đặt khám phá mô hình cho Codex app-server `model/list`.                                                                                         |
| `appServer`                | app-server stdio được quản lý | Cài đặt giao vận, lệnh, xác thực, phê duyệt, sandbox và thời gian chờ.                                                                          |
| `codexDynamicToolsLoading` | `"searchable"`           | Dùng `"direct"` để đưa trực tiếp các công cụ động của OpenClaw vào ngữ cảnh công cụ Codex ban đầu.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Tên công cụ động OpenClaw bổ sung cần bỏ qua khỏi các lượt Codex app-server.                                                                        |
| `codexPlugins`             | tắt                      | Hỗ trợ Plugin/ứng dụng Codex nguyên gốc cho các Plugin tuyển chọn đã di chuyển và được cài từ nguồn. Xem [Plugin Codex nguyên gốc](/vi/plugins/codex-native-plugins). |
| `computerUse`              | tắt                      | Thiết lập Codex Computer Use. Xem [Codex Computer Use](/vi/plugins/codex-computer-use).                                                                |

## Giao vận app-server

Theo mặc định, OpenClaw khởi động tệp nhị phân Codex được quản lý đi kèm với Plugin
được đóng gói sẵn:

```bash
codex app-server --listen stdio://
```

Điều này giữ phiên bản app-server gắn với Plugin `codex` được đóng gói sẵn thay vì
bất kỳ Codex CLI riêng nào tình cờ được cài đặt cục bộ. Chỉ đặt
`appServer.command` khi bạn chủ ý muốn chạy một tệp thực thi khác.

Đối với app-server đang chạy sẵn, hãy dùng giao vận WebSocket:

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
| `transport`                                   | `"stdio"`                                              | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                                                                                                                                                                     |
| `homeScope`                                   | `"agent"`                                              | `"agent"` cô lập trạng thái Codex theo từng agent OpenClaw. `"user"` chia sẻ `$CODEX_HOME` hoặc `~/.codex` gốc, dùng xác thực gốc, và bật quản lý luồng chỉ dành cho chủ sở hữu. Phạm vi người dùng yêu cầu stdio.                                                                                                                                                                             |
| `command`                                     | tệp nhị phân Codex được quản lý                        | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý.                                                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Đối số cho transport stdio.                                                                                                                                                                                                                                                                                                                                                                      |
| `url`                                         | chưa đặt                                               | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                        |
| `authToken`                                   | chưa đặt                                               | Mã thông báo Bearer cho transport WebSocket. Chấp nhận chuỗi cố định hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                          |
| `headers`                                     | `{}`                                                   | Header WebSocket bổ sung. Giá trị header chấp nhận chuỗi cố định hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa của nó.                                                                                                                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | chưa đặt                                               | Gốc workspace app-server Codex từ xa. Khi được đặt, OpenClaw suy ra gốc workspace cục bộ từ workspace OpenClaw đã phân giải, giữ nguyên hậu tố cwd hiện tại dưới gốc từ xa này, và chỉ gửi cwd app-server cuối cùng tới Codex. Nếu cwd nằm ngoài gốc workspace OpenClaw đã phân giải, OpenClaw sẽ từ chối an toàn thay vì gửi đường dẫn cục bộ của Gateway tới app-server từ xa. |
| `requestTimeoutMs`                            | `60000`                                                | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Khoảng lặng sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server theo phạm vi lượt trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Cơ chế bảo vệ trạng thái nhàn rỗi khi hoàn tất và tiến độ được dùng sau khi chuyển giao công cụ, hoàn tất công cụ gốc, tiến độ raw assistant sau công cụ, hoàn tất suy luận raw, hoặc tiến độ suy luận trong khi OpenClaw chờ `turn/completed`. Dùng mục này cho workload đáng tin cậy hoặc nặng, nơi tổng hợp sau công cụ có thể im lặng lâu hơn ngân sách phát hành assistant cuối cùng. |
| `mode`                                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc thực thi được guardian xem xét.                                                                                                                                                                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` hoặc chính sách phê duyệt guardian được phép | Chính sách phê duyệt Codex gốc được gửi tới lúc bắt đầu luồng, tiếp tục luồng, và lượt.                                                                                                                                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` hoặc sandbox guardian được phép | Chế độ sandbox Codex gốc được gửi tới lúc bắt đầu luồng và tiếp tục luồng. Sandbox OpenClaw đang hoạt động thu hẹp các lượt `danger-full-access` thành Codex `workspace-write`; cờ mạng của lượt tuân theo egress sandbox OpenClaw.                                                                                                                                                              |
| `approvalsReviewer`                           | `"user"` hoặc reviewer guardian được phép              | Dùng `"auto_review"` để Codex xem xét các lời nhắc phê duyệt gốc khi được phép.                                                                                                                                                                                                                                                                                                                  |
| `defaultWorkspaceDir`                         | thư mục tiến trình hiện tại                            | Workspace được `/codex bind` dùng khi bỏ qua `--cwd`.                                                                                                                                                                                                                                                                                                                                            |
| `serviceTier`                                 | chưa đặt                                               | Tầng dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý flex, và `null` xóa ghi đè. `"fast"` kế thừa được chấp nhận là `"priority"`.                                                                                                                                                                                                            |
| `networkProxy`                                | bị tắt                                                 | Chọn dùng mạng hồ sơ quyền của Codex cho các lệnh app-server. OpenClaw định nghĩa cấu hình `permissions.<profile>.network` đã chọn và chọn nó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                                                 |
| `experimental.sandboxExecServer`              | `false`                                                | Tùy chọn xem trước đăng ký môi trường Codex dựa trên sandbox OpenClaw với app-server Codex 0.132.0 trở lên để thực thi Codex gốc có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                                                          |

`appServer.networkProxy` là tường minh vì nó thay đổi hợp đồng sandbox Codex.
Khi được bật, OpenClaw cũng đặt `features.network_proxy.enabled` và
`default_permissions` trong cấu hình luồng Codex để hồ sơ quyền được tạo
có thể khởi động mạng do Codex quản lý. Theo mặc định, OpenClaw tạo tên hồ sơ
`openclaw-network-<fingerprint>` chống va chạm từ nội dung hồ sơ; chỉ dùng
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

Nếu runtime máy chủ ứng dụng thông thường là `danger-full-access`, việc bật
`networkProxy` sẽ dùng quyền truy cập hệ thống tệp theo kiểu workspace cho hồ sơ
quyền được tạo. Cơ chế thực thi mạng do Codex quản lý là mạng được sandbox,
nên hồ sơ toàn quyền truy cập sẽ không bảo vệ lưu lượng đi ra.

Plugin chặn các bắt tay máy chủ ứng dụng cũ hơn hoặc không có phiên bản. Máy chủ
ứng dụng Codex phải báo cáo phiên bản ổn định `0.125.0` trở lên.

OpenClaw xem các URL máy chủ ứng dụng WebSocket không phải loopback là từ xa và
yêu cầu xác thực WebSocket mang danh tính thông qua `appServer.authToken` hoặc
header `Authorization`. `appServer.authToken` và từng giá trị
`appServer.headers.*` có thể là SecretInput; runtime secrets phân giải SecretRefs
và dạng viết tắt env trước khi OpenClaw xây dựng tùy chọn khởi động máy chủ ứng
dụng, và các SecretRefs có cấu trúc chưa phân giải sẽ thất bại trước khi bất kỳ
token hoặc header nào được gửi. Khi các Plugin Codex gốc được cấu hình,
OpenClaw dùng mặt phẳng điều khiển Plugin của máy chủ ứng dụng đã kết nối để cài
đặt hoặc làm mới các Plugin đó, rồi làm mới inventory ứng dụng để các ứng dụng
do Plugin sở hữu hiển thị với luồng Codex. `app/list` vẫn là nguồn inventory và
metadata có thẩm quyền, nhưng chính sách OpenClaw quyết định liệu `thread/start`
có gửi `config.apps[appId].enabled = true` cho một ứng dụng được liệt kê và có
thể truy cập hay không, ngay cả khi Codex hiện đánh dấu ứng dụng đó là bị tắt.
Các id ứng dụng không xác định hoặc bị thiếu vẫn đóng khi lỗi; đường dẫn này chỉ
kích hoạt các Plugin marketplace qua `plugin/install` và làm mới inventory. Chỉ
kết nối OpenClaw với các máy chủ ứng dụng từ xa được tin cậy để chấp nhận cài
đặt Plugin do OpenClaw quản lý và làm mới inventory ứng dụng.

## Chế độ phê duyệt và sandbox

Các phiên máy chủ ứng dụng stdio cục bộ mặc định ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Tư thế vận hành cục bộ đáng tin cậy này cho
phép các lượt OpenClaw không giám sát và Heartbeat tiếp tục tiến triển mà không
cần lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

Nếu tệp yêu cầu hệ thống cục bộ của Codex không cho phép các giá trị phê duyệt
YOLO, reviewer hoặc sandbox ngầm định, OpenClaw sẽ xem mặc định ngầm định là
guardian thay vào đó và chọn các quyền guardian được cho phép.
`tools.exec.mode: "auto"` cũng buộc phê duyệt Codex do guardian duyệt và không
giữ lại các override legacy không an toàn như `approvalPolicy: "never"` hoặc
`sandbox: "danger-full-access"`; đặt `tools.exec.mode: "full"` cho tư thế cố ý
không cần phê duyệt. Các mục `[[remote_sandbox_config]]` khớp hostname trong
cùng tệp yêu cầu được tôn trọng cho quyết định mặc định sandbox.

Đặt `appServer.mode: "guardian"` cho phê duyệt Codex do guardian duyệt:

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
`approvalsReviewer: "auto_review"`, và `sandbox: "workspace-write"` khi các giá
trị đó được cho phép. Các trường chính sách riêng lẻ ghi đè `mode`. Giá trị
reviewer cũ hơn `guardian_subagent` vẫn được chấp nhận dưới dạng alias tương
thích, nhưng cấu hình mới nên dùng `auto_review`.

Khi một sandbox OpenClaw đang hoạt động, tiến trình máy chủ ứng dụng Codex cục bộ
vẫn chạy trên máy chủ Gateway. Vì vậy OpenClaw tắt Code Mode gốc của Codex, máy
chủ MCP của người dùng, và thực thi Plugin dựa trên ứng dụng cho lượt đó thay vì
xem sandbox phía máy chủ Codex là tương đương với backend sandbox OpenClaw. Quyền
truy cập shell được cung cấp thông qua các công cụ động được sandbox OpenClaw hỗ
trợ như `sandbox_exec` và `sandbox_process` khi các công cụ exec/process thông
thường có sẵn.

Trên các máy chủ Ubuntu/AppArmor, Codex bwrap có thể thất bại dưới
`workspace-write` trước khi lệnh shell bắt đầu khi bạn cố ý chạy
`workspace-write` Codex gốc mà không có sandbox OpenClaw đang hoạt động. Nếu bạn
thấy `bwrap: setting up uid map: Permission denied` hoặc
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, hãy chạy
`openclaw doctor` và sửa chính sách namespace máy chủ được báo cáo cho người
dùng dịch vụ OpenClaw thay vì cấp quyền container Docker rộng hơn. Ưu tiên một
hồ sơ AppArmor có phạm vi cho tiến trình dịch vụ; fallback
`kernel.apparmor_restrict_unprivileged_userns=0` áp dụng toàn máy chủ và có đánh
đổi bảo mật.

## Thực thi gốc trong sandbox

Mặc định ổn định là đóng khi lỗi: sandbox OpenClaw đang hoạt động sẽ tắt các bề
mặt thực thi Codex gốc vốn sẽ chạy từ máy chủ máy chủ ứng dụng Codex. Chỉ dùng
`appServer.experimental.sandboxExecServer: true` khi bạn muốn thử hỗ trợ môi
trường từ xa của Codex với backend sandbox của OpenClaw. Đường dẫn xem trước này
yêu cầu máy chủ ứng dụng Codex 0.132.0 trở lên.

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

Khi cờ được bật và phiên OpenClaw hiện tại được sandbox, OpenClaw khởi động một
exec-server local loopback được hỗ trợ bởi sandbox đang hoạt động, đăng ký nó
với máy chủ ứng dụng Codex, rồi khởi động luồng và lượt Codex với môi trường do
OpenClaw sở hữu đó. Nếu máy chủ ứng dụng không thể đăng ký môi trường, lần chạy
sẽ đóng khi lỗi thay vì âm thầm quay về thực thi trên máy chủ.

Đường dẫn xem trước này chỉ dành cho cục bộ. Máy chủ ứng dụng WebSocket từ xa
không thể truy cập exec-server loopback trừ khi nó đang chạy trên cùng máy chủ,
nên OpenClaw từ chối tổ hợp đó.

## Xác thực và cô lập môi trường

Trong home mặc định theo từng agent, xác thực được chọn theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw Codex rõ ràng cho agent.
2. Tài khoản hiện có của máy chủ ứng dụng trong Codex home của agent đó.
3. Chỉ với các lần khởi chạy máy chủ ứng dụng stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản máy chủ ứng dụng và xác thực OpenAI
   vẫn được yêu cầu.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều
đó giữ cho các API key cấp Gateway vẫn khả dụng cho embeddings hoặc các mô hình
OpenAI trực tiếp mà không vô tình khiến các lượt máy chủ ứng dụng Codex gốc tính
phí qua API.

Các hồ sơ API-key Codex rõ ràng và fallback env-key stdio cục bộ dùng đăng nhập
máy chủ ứng dụng thay vì env kế thừa của tiến trình con. Kết nối máy chủ ứng dụng
WebSocket không nhận fallback API-key env của Gateway; hãy dùng hồ sơ xác thực
rõ ràng hoặc tài khoản riêng của máy chủ ứng dụng từ xa.

Các lần khởi chạy máy chủ ứng dụng stdio kế thừa môi trường tiến trình của
OpenClaw theo mặc định. OpenClaw sở hữu cầu nối tài khoản máy chủ ứng dụng Codex
và đặt `CODEX_HOME` thành thư mục theo từng agent trong trạng thái OpenClaw của
agent đó. Điều này giữ cấu hình, tài khoản, cache/dữ liệu Plugin, và trạng thái
luồng Codex trong phạm vi agent OpenClaw thay vì rò rỉ từ home `~/.codex` cá
nhân của người vận hành.

Đặt `appServer.homeScope: "user"` để chia sẻ trạng thái Codex gốc với Codex
Desktop và CLI. Chế độ chỉ dành cho stdio cục bộ này dùng `$CODEX_HOME` khi được
đặt và `~/.codex` nếu không, bao gồm xác thực gốc, cấu hình, Plugin, và luồng.
OpenClaw bỏ qua cầu nối hồ sơ xác thực của nó cho máy chủ ứng dụng. Các lượt
chủ sở hữu đã xác minh có thể dùng `codex_threads` để liệt kê, tìm kiếm, đọc,
fork, đổi tên, lưu trữ, và khôi phục các luồng đó. Hãy fork một luồng trước khi
tiếp tục nó trong OpenClaw; các tiến trình Codex độc lập không điều phối những
writer đồng thời cho cùng một luồng.

OpenClaw không ghi lại `HOME` cho các lần khởi chạy máy chủ ứng dụng cục bộ
thông thường. Các tiến trình con do Codex chạy như `openclaw`, `gh`, `git`, CLI
đám mây, và lệnh shell thấy home tiến trình thông thường và có thể tìm cấu hình
và token trong user-home. Codex cũng có thể phát hiện `$HOME/.agents/skills` và
`$HOME/.agents/plugins/marketplace.json`; cơ chế phát hiện `.agents` đó được cố
ý chia sẻ với home của người vận hành và tách biệt với trạng thái `~/.codex`
được cô lập.

Trong phạm vi agent mặc định, các Plugin OpenClaw và snapshot Skills của
OpenClaw vẫn đi qua registry Plugin và loader Skills riêng của OpenClaw; tài sản
Codex `~/.codex` cá nhân thì không. Nếu bạn có Skills hoặc Plugin Codex CLI hữu
ích từ một Codex home cần trở thành một phần của agent OpenClaw được cô lập, hãy
inventory chúng một cách rõ ràng:

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con máy chủ ứng dụng Codex được
sinh ra. OpenClaw xóa `CODEX_HOME` và `HOME` khỏi danh sách này trong quá trình
chuẩn hóa khởi chạy cục bộ: `CODEX_HOME` vẫn trỏ tới phạm vi agent hoặc người
dùng đã chọn, và `HOME` vẫn được kế thừa để các tiến trình con có thể dùng trạng
thái user-home thông thường.

## Công cụ động

Công cụ động Codex mặc định tải theo kiểu `searchable`. OpenClaw không cung cấp
các công cụ động trùng lặp với thao tác workspace gốc của Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Hầu hết các công cụ tích hợp OpenClaw còn lại, như nhắn tin, media, Cron, trình
duyệt, node, Gateway, `heartbeat_respond`, và `web_search`, có sẵn thông qua tìm
kiếm công cụ Codex trong namespace `openclaw`. Điều này giữ cho ngữ cảnh mô hình
ban đầu nhỏ hơn. `sessions_yield` và các phản hồi nguồn chỉ dành cho công cụ
nhắn tin vẫn trực tiếp vì đó là các hợp đồng điều khiển lượt. `sessions_spawn`
vẫn searchable để `spawn_agent` gốc của Codex tiếp tục là bề mặt subagent Codex
chính, trong khi ủy quyền OpenClaw hoặc ACP rõ ràng vẫn có sẵn thông qua
namespace công cụ động `openclaw`.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối với một máy chủ ứng dụng
Codex tùy chỉnh không thể tìm kiếm công cụ động bị trì hoãn hoặc khi debug toàn
bộ payload công cụ.

## Timeout

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`. Mỗi yêu cầu `item/tool/call` của Codex dùng timeout
khả dụng đầu tiên theo thứ tự này:

- Đối số `timeoutMs` theo từng lệnh gọi có giá trị dương.
- Với `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Với `image_generate` không có timeout được cấu hình, mặc định tạo ảnh 120 giây.
- Với công cụ `image` hiểu media, `tools.media.image.timeoutSeconds` được chuyển
  sang mili giây, hoặc mặc định media 60 giây. Với hiểu ảnh, điều này áp dụng cho
  chính yêu cầu và không bị giảm bởi công việc chuẩn bị trước đó.
- Mặc định công cụ động 90 giây.

Watchdog này là ngân sách `item/tool/call` động bên ngoài. Timeout yêu cầu theo
nhà cung cấp chạy bên trong lệnh gọi đó và giữ ngữ nghĩa timeout riêng. Ngân sách
công cụ động được giới hạn ở 600000 ms. Khi timeout, OpenClaw hủy tín hiệu công
cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại cho Codex để lượt
có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi Codex chấp nhận một lượt, và sau khi OpenClaw phản hồi một yêu cầu máy
chủ ứng dụng trong phạm vi lượt, harness kỳ vọng Codex sẽ tiến triển trong lượt
hiện tại và cuối cùng hoàn tất lượt gốc bằng `turn/completed`. Nếu máy chủ ứng
dụng im lặng trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw cố gắng hết
sức để ngắt lượt Codex, ghi lại timeout chẩn đoán, và giải phóng lane phiên
OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một lượt gốc cũ.

Hầu hết thông báo không kết thúc cho cùng một lượt sẽ vô hiệu hóa bộ giám sát ngắn đó
vì Codex đã chứng minh rằng lượt này vẫn còn hoạt động. Các lần chuyển giao công cụ dùng một
ngân sách nhàn rỗi sau công cụ dài hơn: sau khi OpenClaw trả về phản hồi `item/tool/call`, sau khi
các mục công cụ gốc như `commandExecution` hoàn tất, sau khi các lần hoàn tất
`custom_tool_call_output` thô, và sau tiến trình trợ lý thô sau công cụ,
các lần hoàn tất suy luận thô, hoặc tiến trình suy luận. Bộ bảo vệ dùng
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình và
mặc định là năm phút trong các trường hợp khác. Cùng ngân sách sau công cụ đó cũng mở rộng
bộ giám sát tiến trình cho khoảng tổng hợp im lặng trước khi Codex phát ra sự kiện
lượt hiện tại tiếp theo. Các lần hoàn tất suy luận, các lần hoàn tất
`agentMessage` commentary, và tiến trình suy luận thô hoặc trợ lý thô trước công cụ có thể
được theo sau bởi một phản hồi cuối tự động, nên chúng dùng bộ bảo vệ phản hồi
sau tiến trình thay vì giải phóng làn phiên ngay lập tức. Chỉ các mục
`agentMessage` cuối/không phải commentary đã hoàn tất và các lần hoàn tất trợ lý thô
trước công cụ mới kích hoạt việc giải phóng đầu ra trợ lý: nếu sau đó Codex im lặng mà không có
`turn/completed`, OpenClaw sẽ cố gắng tối đa để ngắt lượt gốc và giải phóng
làn phiên. Các lỗi app-server stdio an toàn để phát lại, bao gồm
thời gian chờ nhàn rỗi khi hoàn tất lượt mà không có bằng chứng về trợ lý, công cụ, mục đang hoạt động, hoặc
tác dụng phụ, sẽ được thử lại một lần trên một lần thử app-server mới. Các
thời gian chờ không an toàn vẫn cho client app-server bị kẹt nghỉ hưu và giải phóng làn phiên
OpenClaw. Chúng cũng xóa ràng buộc luồng gốc đã cũ thay vì được
phát lại tự động. Các thời gian chờ theo dõi hoàn tất hiển thị văn bản thời gian chờ
riêng cho Codex: các trường hợp an toàn để phát lại nói rằng phản hồi có thể chưa hoàn chỉnh, còn các trường hợp không an toàn
yêu cầu người dùng xác minh trạng thái hiện tại trước khi thử lại. Chẩn đoán thời gian chờ công khai
bao gồm các trường cấu trúc như phương thức thông báo app-server cuối cùng,
id/loại/vai trò của mục phản hồi trợ lý thô, số lượng yêu cầu/mục đang hoạt động, và trạng thái
theo dõi đã kích hoạt. Khi thông báo cuối cùng là một mục phản hồi trợ lý thô, chúng
cũng bao gồm bản xem trước văn bản trợ lý có giới hạn. Chúng không bao gồm lời nhắc thô hoặc
nội dung công cụ.

## Khám phá mô hình

Theo mặc định, Codex plugin yêu cầu app-server cung cấp các mô hình có sẵn. Tính
khả dụng của mô hình thuộc sở hữu của Codex app-server, nên danh sách có thể thay đổi khi OpenClaw
nâng cấp phiên bản `@openai/codex` được đóng gói hoặc khi một bản triển khai trỏ
`appServer.command` tới một tệp nhị phân Codex khác. Tính khả dụng cũng có thể được
phạm vi hóa theo tài khoản. Dùng `/codex models` trên một gateway đang chạy để xem danh mục trực tiếp
cho harness và tài khoản đó.

Nếu khám phá thất bại hoặc hết thời gian chờ, OpenClaw dùng danh mục dự phòng được đóng gói cho:

- GPT-5.5
- GPT-5.4 mini

Harness được đóng gói hiện tại là `@openai/codex` `0.142.5`. Một phép thăm dò `model/list`
đối với app-server được đóng gói đó đã trả về các hàng bộ chọn công khai này:

| Id mô hình             | Phương thức đầu vào | Mức nỗ lực suy luận      |
| ---------------------- | ------------------- | ------------------------ |
| `gpt-5.5`              | văn bản, hình ảnh   | thấp, trung bình, cao, xhigh |
| `gpt-5.4`              | văn bản, hình ảnh   | thấp, trung bình, cao, xhigh |
| `gpt-5.4-mini`         | văn bản, hình ảnh   | thấp, trung bình, cao, xhigh |
| `gpt-5.3-codex-spark`  | văn bản             | thấp, trung bình, cao, xhigh |

Các mô hình ẩn có thể được danh mục app-server trả về cho các luồng nội bộ hoặc
chuyên biệt, nhưng chúng không phải là các lựa chọn bộ chọn mô hình thông thường.

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

Tắt khám phá khi bạn muốn quá trình khởi động tránh thăm dò Codex và chỉ dùng
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

## Tệp khởi tạo workspace

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án gốc. OpenClaw
không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào các
tên tệp dự phòng của Codex cho tệp persona, vì các dự phòng của Codex chỉ áp dụng khi
thiếu `AGENTS.md`.

Để giữ tương đương workspace OpenClaw, Codex harness phân giải các tệp khởi tạo
khác. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, và `USER.md` được chuyển tiếp làm
chỉ dẫn nhà phát triển OpenClaw Codex vì chúng định nghĩa tác nhân đang hoạt động,
hướng dẫn workspace có sẵn, và hồ sơ người dùng. Danh sách Skills OpenClaw rút gọn
được chuyển tiếp làm chỉ dẫn nhà phát triển cộng tác theo phạm vi lượt.
Nội dung `HEARTBEAT.md` không được tiêm vào; các lượt heartbeat nhận một con trỏ chế độ cộng tác
để đọc tệp khi nó tồn tại và không rỗng. Nội dung `MEMORY.md`
từ workspace tác nhân đã cấu hình không được dán vào đầu vào lượt Codex gốc
khi các công cụ bộ nhớ có sẵn cho workspace đó; khi nó tồn tại, harness
thêm một con trỏ bộ nhớ workspace nhỏ vào chỉ dẫn nhà phát triển cộng tác
theo phạm vi lượt và Codex nên dùng `memory_search` hoặc `memory_get` khi bộ nhớ bền
có liên quan. Nếu công cụ bị tắt, tìm kiếm bộ nhớ không khả dụng, hoặc
workspace đang hoạt động khác với workspace bộ nhớ tác nhân, `MEMORY.md` dùng
đường dẫn ngữ cảnh lượt có giới hạn thông thường.
`BOOTSTRAP.md` khi có mặt được chuyển tiếp làm ngữ cảnh tham chiếu đầu vào lượt OpenClaw.

## Ghi đè môi trường

Các ghi đè môi trường vẫn có sẵn cho kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị loại bỏ. Thay vào đó hãy dùng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` cho kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các bản triển khai có thể lặp lại vì nó giữ hành vi plugin trong
cùng tệp đã được rà soát với phần còn lại của thiết lập Codex harness.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Runtime Codex harness](/vi/plugins/codex-harness-runtime)
- [Native Codex plugins](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
