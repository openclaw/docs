---
read_when:
    - Bạn cần mọi trường cấu hình của harness Codex
    - Bạn đang thay đổi hành vi truyền tải, xác thực, khám phá hoặc thời gian chờ của app-server
    - Bạn đang gỡ lỗi quá trình khởi động harness Codex, khám phá mô hình hoặc cô lập môi trường
summary: Tham chiếu cấu hình, xác thực, khám phá và máy chủ ứng dụng cho Codex harness
title: Tham chiếu harness Codex
x-i18n:
    generated_at: "2026-07-04T10:46:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Tài liệu tham khảo này bao gồm cấu hình chi tiết cho Plugin `codex`
được đóng gói kèm. Để thiết lập và đưa ra quyết định định tuyến, hãy bắt đầu với
[Codex harness](/vi/plugins/codex-harness).

## Bề mặt cấu hình Plugin

Tất cả thiết lập Codex harness nằm trong `plugins.entries.codex.config`.

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
| `discovery`                | đã bật                   | Thiết lập khám phá mô hình cho `model/list` của app-server Codex.                                                                         |
| `appServer`                | app-server stdio được quản lý | Thiết lập vận chuyển, lệnh, xác thực, phê duyệt, sandbox và thời gian chờ.                                                           |
| `codexDynamicToolsLoading` | `"searchable"`           | Dùng `"direct"` để đưa các công cụ động của OpenClaw trực tiếp vào ngữ cảnh công cụ Codex ban đầu.                                       |
| `codexDynamicToolsExclude` | `[]`                     | Tên công cụ động bổ sung của OpenClaw cần bỏ qua trong các lượt app-server Codex.                                                        |
| `codexPlugins`             | đã tắt                   | Hỗ trợ Plugin/ứng dụng Codex gốc cho các Plugin tuyển chọn được cài đặt từ nguồn đã di chuyển. Xem [Plugin Codex gốc](/vi/plugins/codex-native-plugins). |
| `computerUse`              | đã tắt                   | Thiết lập Codex Computer Use. Xem [Codex Computer Use](/vi/plugins/codex-computer-use).                                                     |

## Vận chuyển app-server

Theo mặc định, OpenClaw khởi động tệp nhị phân Codex được quản lý đi kèm với Plugin
được đóng gói kèm:

```bash
codex app-server --listen stdio://
```

Điều này giữ phiên bản app-server gắn với Plugin `codex` được đóng gói kèm thay vì
bất kỳ Codex CLI riêng biệt nào tình cờ được cài đặt cục bộ. Chỉ đặt
`appServer.command` khi bạn cố ý muốn chạy một tệp thực thi khác.

Đối với app-server đã chạy sẵn, hãy dùng vận chuyển WebSocket:

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
| `transport`                                   | `"stdio"`                                             | `"stdio"` khởi chạy Codex; `"websocket"` kết nối tới `url`.                                                                                                                                                                                                                                                                                                                                     |
| `homeScope`                                   | `"agent"`                                             | `"agent"` cô lập trạng thái Codex theo từng agent OpenClaw. `"user"` chia sẻ `$CODEX_HOME` gốc hoặc `~/.codex`, dùng xác thực gốc và bật quản lý luồng chỉ dành cho chủ sở hữu. Phạm vi người dùng yêu cầu stdio.                                                                                                                                                                              |
| `command`                                     | tệp nhị phân Codex được quản lý                       | Tệp thực thi cho transport stdio. Để trống để dùng tệp nhị phân được quản lý.                                                                                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Đối số cho transport stdio.                                                                                                                                                                                                                                                                                                                                                                     |
| `url`                                         | chưa đặt                                              | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | chưa đặt                                              | Bearer token cho transport WebSocket. Chấp nhận chuỗi nguyên văn hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                  | Header WebSocket bổ sung. Giá trị header chấp nhận chuỗi nguyên văn hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                  | Tên biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw dựng môi trường kế thừa.                                                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | chưa đặt                                              | Gốc workspace app-server Codex từ xa. Khi được đặt, OpenClaw suy ra gốc workspace cục bộ từ workspace OpenClaw đã phân giải, giữ nguyên hậu tố cwd hiện tại dưới gốc từ xa này, và chỉ gửi cwd app-server cuối cùng tới Codex. Nếu cwd nằm ngoài gốc workspace OpenClaw đã phân giải, OpenClaw sẽ đóng an toàn thay vì gửi đường dẫn cục bộ của Gateway tới app-server từ xa. |
| `requestTimeoutMs`                            | `60000`                                               | Thời gian chờ cho các lệnh gọi control-plane của app-server.                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Khoảng lặng sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server theo phạm vi lượt trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                                        |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Bộ canh hoàn tất-không hoạt động và tiến độ được dùng sau khi chuyển giao công cụ, hoàn tất công cụ gốc, tiến độ raw assistant sau công cụ, hoàn tất suy luận raw, hoặc tiến độ suy luận trong khi OpenClaw chờ `turn/completed`. Dùng tùy chọn này cho khối lượng công việc đáng tin cậy hoặc nặng, nơi tổng hợp sau công cụ có thể im lặng lâu hơn ngân sách phát hành assistant cuối cùng một cách hợp lệ. |
| `mode`                                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Preset cho thực thi YOLO hoặc thực thi do guardian xét duyệt.                                                                                                                                                                                                                                                                                                                                   |
| `approvalPolicy`                              | `"never"` hoặc một chính sách phê duyệt guardian được phép | Chính sách phê duyệt Codex gốc được gửi tới lúc bắt đầu luồng, tiếp tục luồng và lượt.                                                                                                                                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` hoặc một sandbox guardian được phép | Chế độ sandbox Codex gốc được gửi tới lúc bắt đầu và tiếp tục luồng. Các sandbox OpenClaw đang hoạt động thu hẹp các lượt `danger-full-access` thành Codex `workspace-write`; cờ mạng của lượt đi theo egress sandbox OpenClaw.                                                                                                                                                                  |
| `approvalsReviewer`                           | `"user"` hoặc một reviewer guardian được phép         | Dùng `"auto_review"` để cho Codex xét duyệt các prompt phê duyệt gốc khi được phép.                                                                                                                                                                                                                                                                                                             |
| `defaultWorkspaceDir`                         | thư mục tiến trình hiện tại                           | Workspace được `/codex bind` dùng khi bỏ qua `--cwd`.                                                                                                                                                                                                                                                                                                                                           |
| `serviceTier`                                 | chưa đặt                                              | Bậc dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý flex, và `null` xóa ghi đè. `"fast"` cũ được chấp nhận như `"priority"`.                                                                                                                                                                                                                |
| `networkProxy`                                | đã tắt                                                | Chọn dùng mạng theo permissions-profile của Codex cho các lệnh app-server. OpenClaw định nghĩa cấu hình `permissions.<profile>.network` đã chọn và chọn nó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                               | Tùy chọn dùng thử ở bản xem trước, đăng ký một môi trường Codex dựa trên sandbox OpenClaw với app-server Codex 0.132.0 hoặc mới hơn để thực thi Codex gốc có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                                |

`appServer.networkProxy` là tường minh vì nó thay đổi hợp đồng sandbox của Codex.
Khi được bật, OpenClaw cũng đặt `features.network_proxy.enabled` và
`default_permissions` trong cấu hình luồng Codex để profile quyền được tạo
có thể khởi động mạng do Codex quản lý. Theo mặc định, OpenClaw tạo tên profile
`openclaw-network-<fingerprint>` chống va chạm từ thân profile; chỉ dùng
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
`networkProxy` sẽ dùng quyền truy cập hệ thống tệp kiểu workspace cho hồ sơ
quyền được tạo. Cơ chế thực thi mạng do Codex quản lý là mạng sandbox, nên hồ sơ
toàn quyền truy cập sẽ không bảo vệ lưu lượng đi ra.

Plugin chặn các bắt tay app-server cũ hơn hoặc không có phiên bản. Codex
app-server phải báo cáo phiên bản ổn định `0.125.0` trở lên.

OpenClaw xem các URL WebSocket app-server không phải loopback là từ xa và yêu
cầu xác thực WebSocket có danh tính thông qua `appServer.authToken` hoặc header
`Authorization`. `appServer.authToken` và mỗi giá trị `appServer.headers.*` có
thể là SecretInput; runtime secrets phân giải SecretRefs và dạng viết tắt env
trước khi OpenClaw xây dựng tùy chọn khởi động app-server, và các SecretRefs có
cấu trúc chưa được phân giải sẽ thất bại trước khi bất kỳ token hoặc header nào
được gửi. Khi các Plugin Codex gốc được cấu hình, OpenClaw dùng mặt phẳng điều
khiển Plugin của app-server đã kết nối để cài đặt hoặc làm mới các Plugin đó,
rồi làm mới kho ứng dụng để các ứng dụng do Plugin sở hữu hiển thị với luồng
Codex. `app/list` vẫn là nguồn kho và siêu dữ liệu có thẩm quyền, nhưng chính
sách OpenClaw quyết định liệu `thread/start` có gửi
`config.apps[appId].enabled = true` cho một ứng dụng có thể truy cập được liệt
kê hay không, kể cả khi Codex hiện đánh dấu ứng dụng đó là đã tắt. Các id ứng
dụng không xác định hoặc bị thiếu vẫn fail-closed; đường dẫn này chỉ kích hoạt
Plugin marketplace thông qua `plugin/install` và làm mới kho. Chỉ kết nối
OpenClaw với các app-server từ xa được tin cậy để chấp nhận các cài đặt Plugin
do OpenClaw quản lý và các lần làm mới kho ứng dụng.

## Chế độ phê duyệt và sandbox

Các phiên app-server stdio cục bộ mặc định ở chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, và
`sandbox: "danger-full-access"`. Tư thế vận hành cục bộ đáng tin cậy này cho
phép các lượt OpenClaw không có người giám sát và heartbeat tiếp tục tiến triển
mà không cần lời nhắc phê duyệt gốc khi không có ai ở đó để trả lời.

Nếu tệp yêu cầu hệ thống cục bộ của Codex không cho phép các giá trị YOLO ngầm
định cho phê duyệt, người rà soát hoặc sandbox, OpenClaw sẽ xem mặc định ngầm
định là guardian và chọn các quyền guardian được cho phép. `tools.exec.mode:
"auto"` cũng buộc các phê duyệt Codex do guardian rà soát và không giữ các ghi
đè legacy không an toàn `approvalPolicy: "never"` hoặc
`sandbox: "danger-full-access"`; đặt `tools.exec.mode: "full"` cho tư thế có chủ
đích không cần phê duyệt. Các mục `[[remote_sandbox_config]]` khớp hostname
trong cùng tệp yêu cầu được tôn trọng cho quyết định mặc định sandbox.

Đặt `appServer.mode: "guardian"` cho các phê duyệt Codex do guardian rà soát:

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
người rà soát cũ hơn `guardian_subagent` vẫn được chấp nhận như một alias tương
thích, nhưng cấu hình mới nên dùng `auto_review`.

Khi sandbox OpenClaw đang hoạt động, tiến trình Codex app-server cục bộ vẫn chạy
trên máy chủ Gateway. Vì vậy, OpenClaw tắt Code Mode gốc của Codex, các máy chủ
MCP của người dùng và việc thực thi Plugin dựa trên ứng dụng cho lượt đó, thay
vì xem sandbox phía máy chủ Codex là tương đương với backend sandbox của
OpenClaw. Quyền truy cập shell được cung cấp thông qua các công cụ động dựa trên
sandbox OpenClaw như `sandbox_exec` và `sandbox_process` khi các công cụ
exec/process thông thường khả dụng.

Trên các máy chủ Ubuntu/AppArmor, Codex bwrap có thể thất bại dưới
`workspace-write` trước khi lệnh shell bắt đầu khi bạn cố ý chạy
`workspace-write` Codex gốc mà không có sandbox OpenClaw đang hoạt động. Nếu bạn
thấy `bwrap: setting up uid map: Permission denied` hoặc
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, hãy chạy
`openclaw doctor` và sửa chính sách namespace của máy chủ được báo cáo cho
người dùng dịch vụ OpenClaw, thay vì cấp đặc quyền Docker container rộng hơn.
Ưu tiên một hồ sơ AppArmor có phạm vi cho tiến trình dịch vụ; phương án dự
phòng `kernel.apparmor_restrict_unprivileged_userns=0` áp dụng toàn máy chủ và
có đánh đổi bảo mật.

## Thực thi gốc trong sandbox

Mặc định ổn định là fail-closed: sandbox OpenClaw đang hoạt động sẽ tắt các bề
mặt thực thi Codex gốc vốn sẽ chạy từ máy chủ Codex app-server. Chỉ dùng
`appServer.experimental.sandboxExecServer: true` khi bạn muốn thử hỗ trợ môi
trường từ xa của Codex với backend sandbox của OpenClaw. Đường dẫn xem trước này
yêu cầu Codex app-server 0.132.0 trở lên.

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

Khi cờ được bật và phiên OpenClaw hiện tại đang trong sandbox, OpenClaw khởi
động một exec-server local loopback được hỗ trợ bởi sandbox đang hoạt động, đăng
ký nó với Codex app-server, rồi khởi động luồng và lượt Codex với môi trường do
OpenClaw sở hữu đó. Nếu app-server không thể đăng ký môi trường, lượt chạy sẽ
fail-closed thay vì âm thầm rơi về thực thi trên máy chủ.

Đường dẫn xem trước này chỉ dành cho cục bộ. Một app-server WebSocket từ xa
không thể truy cập exec-server loopback trừ khi nó đang chạy trên cùng máy chủ,
vì vậy OpenClaw từ chối tổ hợp đó.

## Cô lập xác thực và môi trường

Trong home mặc định theo từng agent, xác thực được chọn theo thứ tự này:

1. Một hồ sơ xác thực OpenClaw Codex rõ ràng cho agent.
2. Tài khoản hiện có của app-server trong Codex home của agent đó.
3. Chỉ với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và xác thực OpenAI vẫn
   được yêu cầu.

Khi OpenClaw thấy một hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT, nó xóa
`CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến trình con Codex được sinh ra. Điều
đó giữ các API key cấp Gateway khả dụng cho embeddings hoặc các mô hình OpenAI
trực tiếp mà không vô tình khiến các lượt Codex app-server gốc tính phí qua API.

Các hồ sơ API key Codex rõ ràng và phương án dự phòng env-key stdio cục bộ dùng
đăng nhập app-server thay vì env tiến trình con kế thừa. Các kết nối app-server
WebSocket không nhận phương án dự phòng API key env của Gateway; hãy dùng hồ sơ
xác thực rõ ràng hoặc tài khoản riêng của app-server từ xa.

Các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của OpenClaw
theo mặc định. OpenClaw sở hữu cầu nối tài khoản Codex app-server và đặt
`CODEX_HOME` thành một thư mục theo từng agent dưới trạng thái OpenClaw của
agent đó. Điều này giữ cấu hình, tài khoản, bộ nhớ đệm/dữ liệu Plugin và trạng
thái luồng của Codex trong phạm vi agent OpenClaw, thay vì rò rỉ từ home
`~/.codex` cá nhân của operator.

Đặt `appServer.homeScope: "user"` để chia sẻ trạng thái Codex gốc với Codex
Desktop và CLI. Chế độ chỉ dành cho local-stdio này dùng `$CODEX_HOME` khi được
đặt và `~/.codex` nếu không, bao gồm xác thực, cấu hình, Plugin và luồng gốc.
OpenClaw bỏ qua cầu nối hồ sơ xác thực của mình cho app-server. Các lượt của
owner đã xác minh có thể dùng `codex_threads` để liệt kê, tìm kiếm, đọc, fork,
đổi tên, lưu trữ và khôi phục các luồng đó. Hãy fork một luồng trước khi tiếp
tục nó trong OpenClaw; các tiến trình Codex độc lập không điều phối các writer
đồng thời cho cùng một luồng.

OpenClaw không viết lại `HOME` cho các lần khởi chạy app-server cục bộ thông
thường. Các tiến trình con do Codex chạy như `openclaw`, `gh`, `git`, các CLI
đám mây và lệnh shell thấy home tiến trình bình thường và có thể tìm cấu hình
và token trong user-home. Codex cũng có thể phát hiện `$HOME/.agents/skills` và
`$HOME/.agents/plugins/marketplace.json`; việc phát hiện `.agents` đó được cố ý
chia sẻ với home của operator và tách biệt với trạng thái `~/.codex` cô lập.

Trong phạm vi agent mặc định, các Plugin OpenClaw và snapshot Skills OpenClaw
vẫn đi qua registry Plugin và bộ nạp Skills riêng của OpenClaw; các tài sản
Codex cá nhân trong `~/.codex` thì không. Nếu bạn có Skills hoặc Plugin Codex
CLI hữu ích từ một Codex home nên trở thành một phần của agent OpenClaw cô lập,
hãy kiểm kê chúng rõ ràng:

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con Codex app-server được sinh
ra. OpenClaw xóa `CODEX_HOME` và `HOME` khỏi danh sách này trong quá trình chuẩn
hóa khởi chạy cục bộ: `CODEX_HOME` vẫn trỏ đến phạm vi agent hoặc người dùng đã
chọn, và `HOME` vẫn được kế thừa để các tiến trình con có thể dùng trạng thái
user-home bình thường.

## Công cụ động

Các công cụ động Codex mặc định dùng cách nạp `searchable`. OpenClaw không cung
cấp các công cụ động trùng lặp với thao tác workspace gốc của Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Hầu hết các công cụ tích hợp OpenClaw còn lại, như nhắn tin, media, cron, trình
duyệt, nodes, gateway, `heartbeat_respond`, và `web_search`, đều khả dụng thông
qua tìm kiếm công cụ Codex dưới namespace `openclaw`. Điều này giữ ngữ cảnh mô
hình ban đầu nhỏ hơn. `sessions_yield` và các phản hồi nguồn chỉ dành cho công
cụ tin nhắn vẫn trực tiếp vì đó là các hợp đồng điều khiển lượt.
`sessions_spawn` vẫn searchable để `spawn_agent` gốc của Codex tiếp tục là bề
mặt subagent Codex chính, trong khi ủy quyền OpenClaw hoặc ACP rõ ràng vẫn khả
dụng thông qua namespace công cụ động `openclaw`.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối với một Codex
app-server tùy chỉnh không thể tìm kiếm các công cụ động trì hoãn, hoặc khi gỡ
lỗi payload công cụ đầy đủ.

## Thời gian chờ

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`. Mỗi yêu cầu Codex `item/tool/call` dùng timeout
khả dụng đầu tiên theo thứ tự này:

- Đối số `timeoutMs` theo từng lệnh gọi là số dương.
- Với `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Với `image_generate` không có timeout được cấu hình, mặc định tạo ảnh 120
  giây.
- Với công cụ `image` hiểu media, `tools.media.image.timeoutSeconds` được chuyển
  sang mili giây, hoặc mặc định media 60 giây. Với hiểu ảnh, điều này áp dụng
  cho chính yêu cầu và không bị giảm bởi công việc chuẩn bị trước đó.
- Mặc định công cụ động 90 giây.

Watchdog này là ngân sách `item/tool/call` động bên ngoài. Timeout yêu cầu theo
từng provider chạy bên trong lệnh gọi đó và giữ ngữ nghĩa timeout riêng của
chúng. Ngân sách công cụ động được giới hạn ở 600000 ms. Khi timeout, OpenClaw
hủy tín hiệu công cụ ở nơi được hỗ trợ và trả về phản hồi công cụ động thất bại
cho Codex để lượt có thể tiếp tục thay vì để phiên ở trạng thái `processing`.

Sau khi Codex chấp nhận một lượt, và sau khi OpenClaw phản hồi một yêu cầu
app-server trong phạm vi lượt, harness kỳ vọng Codex tiếp tục tiến triển trong
lượt hiện tại và cuối cùng kết thúc lượt gốc bằng `turn/completed`. Nếu
app-server im lặng trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw cố
gắng ngắt lượt Codex, ghi lại timeout chẩn đoán và giải phóng lane phiên
OpenClaw để các tin nhắn chat tiếp theo không bị xếp hàng sau một lượt gốc đã
cũ.

Hầu hết thông báo không kết thúc cho cùng một lượt sẽ ngắt watchdog ngắn đó
vì Codex đã chứng minh lượt vẫn còn hoạt động. Các lần bàn giao công cụ dùng
một ngân sách nhàn rỗi sau công cụ dài hơn: sau khi OpenClaw trả về phản hồi
`item/tool/call`, sau khi các mục công cụ native như `commandExecution` hoàn tất,
sau các lần hoàn tất `custom_tool_call_output` thô, và sau tiến trình trợ lý thô
sau công cụ, các lần hoàn tất suy luận thô, hoặc tiến trình suy luận. Bộ bảo vệ
dùng `appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình và
mặc định là năm phút trong các trường hợp khác. Cùng ngân sách sau công cụ đó
cũng kéo dài watchdog tiến trình cho khoảng tổng hợp im lặng trước khi Codex phát
ra sự kiện lượt hiện tại tiếp theo. Các lần hoàn tất suy luận, hoàn tất
`agentMessage` commentary, và tiến trình suy luận hoặc trợ lý thô trước công cụ
có thể được theo sau bởi một phản hồi cuối tự động, nên chúng dùng bộ bảo vệ phản
hồi sau tiến trình thay vì giải phóng làn phiên ngay lập tức. Chỉ các mục
`agentMessage` hoàn tất cuối/không phải commentary và các lần hoàn tất trợ lý thô
trước công cụ mới kích hoạt giải phóng đầu ra trợ lý: nếu sau đó Codex im lặng
mà không có `turn/completed`, OpenClaw sẽ cố gắng tốt nhất để ngắt lượt native và
giải phóng làn phiên. Các lỗi app-server stdio an toàn để phát lại, bao gồm thời
gian chờ nhàn rỗi khi hoàn tất lượt mà không có bằng chứng trợ lý, công cụ, mục
đang hoạt động, hoặc tác dụng phụ, được thử lại một lần trên một lần thử
app-server mới. Các timeout không an toàn vẫn cho client app-server bị kẹt nghỉ
và giải phóng làn phiên OpenClaw. Chúng cũng xóa liên kết luồng native cũ thay vì
được phát lại tự động. Timeout theo dõi hoàn tất hiển thị văn bản timeout riêng
cho Codex: các trường hợp an toàn để phát lại nói rằng phản hồi có thể chưa hoàn
chỉnh, còn các trường hợp không an toàn yêu cầu người dùng xác minh trạng thái
hiện tại trước khi thử lại. Chẩn đoán timeout công khai bao gồm các trường cấu
trúc như phương thức thông báo app-server gần nhất, id/loại/vai trò của mục phản
hồi trợ lý thô, số lượng yêu cầu/mục đang hoạt động, và trạng thái theo dõi đã
được kích hoạt. Khi thông báo gần nhất là một mục phản hồi trợ lý thô, chúng cũng
bao gồm bản xem trước văn bản trợ lý có giới hạn. Chúng không bao gồm prompt thô
hoặc nội dung công cụ.

## Khám phá mô hình

Theo mặc định, Plugin Codex hỏi app-server về các mô hình có sẵn. Tính khả dụng
của mô hình do Codex app-server sở hữu, nên danh sách có thể thay đổi khi
OpenClaw nâng cấp phiên bản `@openai/codex` được đóng gói hoặc khi một triển
khai trỏ `appServer.command` tới một binary Codex khác. Tính khả dụng cũng có thể
phụ thuộc vào tài khoản. Dùng `/codex models` trên một gateway đang chạy để xem
catalog trực tiếp cho harness và tài khoản đó.

Nếu khám phá thất bại hoặc hết thời gian chờ, OpenClaw dùng catalog dự phòng
được đóng gói cho:

- GPT-5.5
- GPT-5.4 mini

Harness được đóng gói hiện tại là `@openai/codex` `0.142.4`. Một probe
`model/list` đối với app-server được đóng gói đó trong một workspace đã bật
GPT-5.6 trả về các hàng bộ chọn công khai sau:

| Id mô hình             | Phương thức đầu vào | Mức nỗ lực suy luận                 |
| ---------------------- | ------------------- | ----------------------------------- |
| `gpt-5.6-sol`          | văn bản, hình ảnh   | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`        | văn bản, hình ảnh   | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`         | văn bản, hình ảnh   | low, medium, high, xhigh, max       |
| `gpt-5.5`              | văn bản, hình ảnh   | low, medium, high, xhigh            |
| `gpt-5.4`              | văn bản, hình ảnh   | low, medium, high, xhigh            |
| `gpt-5.4-mini`         | văn bản, hình ảnh   | low, medium, high, xhigh            |
| `gpt-5.4-pro`          | văn bản, hình ảnh   | medium, high, xhigh                 |
| `gpt-5.3-codex-spark`  | văn bản             | low, medium, high, xhigh            |

Quyền truy cập GPT-5.6 phụ thuộc vào tài khoản trong giai đoạn xem trước giới
hạn. `max` là một mức nỗ lực suy luận của mô hình. `ultra` là metadata điều phối
đa tác nhân riêng của Codex, không phải mức nỗ lực suy luận OpenAI tiêu chuẩn.

Các mô hình ẩn có thể được trả về bởi catalog app-server cho các luồng nội bộ
hoặc chuyên biệt, nhưng chúng không phải là lựa chọn bộ chọn mô hình thông
thường.

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

Tắt khám phá khi bạn muốn khởi động tránh probe Codex và chỉ dùng catalog dự
phòng:

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

Codex tự xử lý `AGENTS.md` thông qua khám phá project-doc native. OpenClaw không
ghi các tệp project-doc Codex tổng hợp hoặc phụ thuộc vào tên tệp dự phòng của
Codex cho các tệp persona, vì dự phòng Codex chỉ áp dụng khi thiếu `AGENTS.md`.

Để đảm bảo tương đồng workspace OpenClaw, harness Codex phân giải các tệp
bootstrap khác. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, và `USER.md` được chuyển
tiếp dưới dạng chỉ dẫn nhà phát triển OpenClaw Codex vì chúng định nghĩa tác
nhân đang hoạt động, hướng dẫn workspace có sẵn, và hồ sơ người dùng. Danh sách
Skills OpenClaw rút gọn được chuyển tiếp dưới dạng chỉ dẫn nhà phát triển cộng
tác theo phạm vi lượt. Nội dung `HEARTBEAT.md` không được chèn; các lượt
Heartbeat nhận một con trỏ chế độ cộng tác để đọc tệp khi tệp tồn tại và không
rỗng. Nội dung `MEMORY.md` từ workspace tác nhân đã cấu hình không được dán vào
đầu vào lượt Codex native khi công cụ bộ nhớ có sẵn cho workspace đó; khi tệp tồn
tại, harness thêm một con trỏ bộ nhớ workspace nhỏ vào chỉ dẫn nhà phát triển
cộng tác theo phạm vi lượt và Codex nên dùng `memory_search` hoặc `memory_get`
khi bộ nhớ bền vững có liên quan. Nếu công cụ bị tắt, tìm kiếm bộ nhớ không có
sẵn, hoặc workspace đang hoạt động khác với workspace bộ nhớ tác nhân,
`MEMORY.md` dùng đường dẫn ngữ cảnh lượt có giới hạn thông thường.
`BOOTSTRAP.md` khi có mặt được chuyển tiếp dưới dạng ngữ cảnh tham chiếu đầu vào
lượt OpenClaw.

## Ghi đè môi trường

Ghi đè môi trường vẫn khả dụng cho kiểm thử cục bộ:

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
cùng tệp đã được rà soát với phần còn lại của thiết lập harness Codex.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Plugin Codex native](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
