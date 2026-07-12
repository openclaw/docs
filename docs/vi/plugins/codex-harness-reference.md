---
read_when:
    - Bạn cần mọi trường cấu hình của bộ khung Codex
    - Bạn đang thay đổi cơ chế truyền tải, xác thực, khám phá hoặc hành vi hết thời gian chờ của máy chủ ứng dụng
    - Bạn đang gỡ lỗi quá trình khởi động bộ khung Codex, khám phá mô hình hoặc cô lập môi trường
summary: Tài liệu tham khảo về cấu hình, xác thực, khám phá và máy chủ ứng dụng cho bộ khung Codex
title: Tham chiếu bộ khung Codex
x-i18n:
    generated_at: "2026-07-12T08:09:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Tài liệu tham khảo này trình bày cấu hình chi tiết cho plugin `codex` chính thức.
Để thiết lập và đưa ra quyết định định tuyến, hãy bắt đầu với
[bộ điều phối Codex](/vi/plugins/codex-harness).

## Bề mặt cấu hình Plugin

Tất cả cài đặt của bộ điều phối Codex nằm trong `plugins.entries.codex.config`.

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

Các trường cấp cao nhất:

| Trường                     | Mặc định                        | Ý nghĩa                                                                                                                                                           |
| -------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | được bật                        | Cài đặt khám phá mô hình cho `model/list` của máy chủ ứng dụng Codex.                                                                                              |
| `appServer`                | máy chủ ứng dụng stdio được quản lý | Cài đặt truyền tải, lệnh, xác thực, phê duyệt, sandbox và thời gian chờ. Bộ điều phối thông thường mặc định sử dụng trạng thái theo phạm vi tác tử.                 |
| `codexDynamicToolsLoading` | `"searchable"`                  | Dùng `"direct"` để đưa trực tiếp các công cụ động của OpenClaw vào ngữ cảnh công cụ Codex ban đầu.                                                                 |
| `codexDynamicToolsExclude` | `[]`                            | Các tên công cụ động bổ sung của OpenClaw cần bỏ qua trong các lượt máy chủ ứng dụng Codex.                                                                        |
| `codexPlugins`             | bị tắt                          | Hỗ trợ plugin/ứng dụng Codex gốc, bao gồm quyền truy cập theo cơ chế chủ động chọn tham gia vào các ứng dụng của tài khoản đã kết nối. Xem [plugin Codex gốc](/vi/plugins/codex-native-plugins). |
| `computerUse`              | bị tắt                          | Thiết lập Codex Computer Use. Xem [Codex Computer Use](/vi/plugins/codex-computer-use).                                                                                |
| `supervision`              | bị tắt                          | Danh mục phiên gốc chưa lưu trữ, tiếp tục nhánh cục bộ và chính sách công cụ tác tử. Xem [giám sát Codex](/plugins/codex-supervision).                              |

## Giám sát

Tính năng giám sát liệt kê các phiên Codex chưa lưu trữ từ máy tính Gateway và
các Node đã ghép cặp có chủ động chọn tham gia. Hãy bật tính năng này độc lập với bộ điều phối tác tử:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Các trường `supervision`:

| Trường                | Mặc định                  | Ý nghĩa                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                   | Công bố danh mục phiên cục bộ và trên Gateway, tổng hợp danh mục từ các Node đã ghép cặp có chủ động chọn tham gia cho trang Codex Sessions.                                                                                                             |
| `endpoints`           | điểm cuối cục bộ tích hợp | Các đích điểm cuối tương thích và nâng cao cho tác tử giám sát Codex được giữ lại và các công cụ MCP độc lập. Danh mục dành cho con người và luồng nhánh bỏ qua các đích này, đồng thời sử dụng App Server giám sát được phân giải từ `appServer`.          |
| `allowRawTranscripts` | `false`                   | Khi đã bật giám sát, cho phép tác tử tự động hoặc MCP độc lập đọc bản ghi và các trường danh sách được suy ra từ bản ghi. Các lượt đọc chỉ siêu dữ liệu của `codex_threads` vẫn khả dụng. Không kiểm soát việc tiếp tục trong Control UI đã xác thực.       |
| `allowWriteControls`  | `false`                   | Khi đã bật giám sát, cho phép các thao tác phân nhánh, đổi tên, lưu trữ và bỏ lưu trữ tự động của `codex_threads`, cùng các thao tác gửi, điều hướng và ngắt của MCP độc lập. Không bỏ qua các bước kiểm tra khác về liên kết, máy chủ, trạng thái hoặc xác nhận. |

Các mục điểm cuối chấp nhận những trường sau:

| Trường         | Áp dụng cho   | Ý nghĩa                                                                |
| -------------- | ------------- | ---------------------------------------------------------------------- |
| `id`           | tất cả        | ID điểm cuối ổn định.                                                  |
| `label`        | tất cả        | Nhãn hiển thị tùy chọn.                                                |
| `transport`    | tất cả        | `"stdio-proxy"` hoặc `"websocket"`.                                    |
| `command`      | `stdio-proxy` | Lệnh App Server tùy chọn.                                              |
| `args`         | `stdio-proxy` | Các đối số lệnh tùy chọn.                                              |
| `cwd`          | `stdio-proxy` | Thư mục làm việc tùy chọn của tiến trình con.                          |
| `url`          | `websocket`   | URL WebSocket hoặc URL socket cục bộ được hỗ trợ, bắt buộc phải có.    |
| `authTokenEnv` | `websocket`   | Biến môi trường tùy chọn có giá trị dùng để xác thực điểm cuối.        |

Trang **Codex Sessions** sử dụng App Server giám sát của plugin và chỉ hiển thị
các phiên chưa lưu trữ. Khi không có cài đặt kết nối `appServer` rõ ràng,
kết nối đó là stdio thư mục chính của người dùng được quản lý. Các hàng cục bộ
đã lưu hoặc đang rảnh có thể tạo một Chat bị khóa theo mô hình với lịch sử người
dùng và trợ lý có giới hạn, kéo dài đến lượt nguồn đã lưu bền vững gần nhất ở
trạng thái kết thúc. Liên kết riêng tư của Chat duy trì nhánh ảnh chụp nhanh,
nhánh nguồn `appServer` chuẩn, việc chèn lịch sử và các lượt sau đó trên kết nối
ấy. Lần khởi động chuẩn đầu tiên sử dụng cặp được trả về từ thao tác phân nhánh.
Các lần tiếp tục sau bỏ qua phần ghi đè mô hình và nhà cung cấp của OpenClaw để
Codex khôi phục cặp đã lưu bền vững của luồng chuẩn; một thay đổi gốc riêng biệt
có thể cập nhật cặp đó, nhưng mô hình bên ngoài và chuỗi dự phòng không bao giờ
thay thế nó. Các hàng đã lưu và đang rảnh có thể được lưu trữ sau khi xác nhận
không có trình chạy nào khác, trừ khi một liên kết OpenClaw đang hoạt động khác
sở hữu chính xác đích đó hoặc một trong các phiên con chưa lưu trữ được tạo ra
từ đích ấy. OpenClaw tuân theo cơ chế phân trang phiên con của Codex và đóng an
toàn khi xảy ra lỗi liệt kê, chu trình hoặc cạn giới hạn an toàn. Việc xác nhận
vẫn bao quát các máy khách gốc không xác định và tình trạng tranh chấp giữa trạng
thái với thao tác lưu trữ. Không thể xóa Chat bị khóa theo mô hình có giám sát
khi nó đang bảo vệ liên kết gốc. Nguồn đang hoạt động không thể tạo nhánh hoặc
được lưu trữ, nhưng vẫn có thể mở một Chat có giám sát hiện có. Mọi hàng của
Node đã ghép cặp đều giữ trạng thái chỉ đọc; phương thức truyền tải của Node chưa
cung cấp vòng đời truyền trực tuyến mà bộ điều phối cần.

Chỉ riêng `appServer.homeScope: "user"` thay đổi thư mục chính Codex mà tiến trình
bộ điều phối được quản lý sử dụng; nó không công bố danh mục toàn hệ thống. Việc
bật giám sát không thay đổi giá trị mặc định của bộ điều phối. Thay vào đó, kết
nối giám sát riêng mặc định sử dụng stdio thư mục chính của người dùng được quản
lý khi không có cài đặt kết nối `appServer` rõ ràng. Các cài đặt rõ ràng được
tuân thủ cho kết nối đó. Các liên kết có giám sát đang chờ và đã xác nhận duy trì
kết nối ấy trong mọi lượt; nếu giám sát bị tắt hoặc kết nối/vòng đời sai lệch,
hệ thống sẽ đóng an toàn thay vì quay về bộ điều phối dùng thư mục chính của tác
tử. Kết nối mặc định chia sẻ các phiên đã lưu với máy khách Codex gốc, không chia
sẻ trạng thái hoạt động cục bộ theo tiến trình của chúng.

Các cài đặt `plugins.entries.codex-supervisor` cũ đã ngừng sử dụng. Chạy
`openclaw doctor --fix` để di chuyển mục cũ, các định nghĩa điểm cuối, cờ chính
sách và tham chiếu danh sách cho phép/từ chối Plugin vào khối này. Các giá trị
chuẩn `codex.config.supervision` được khai báo rõ ràng sẽ được ưu tiên khi có
xung đột.

## Phương thức truyền tải máy chủ ứng dụng

Đối với các lượt bộ điều phối thông thường, OpenClaw khởi động tệp nhị phân Codex
được quản lý đi kèm Plugin chính thức (hiện là `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Cách này giữ phiên bản máy chủ ứng dụng gắn với Plugin `codex` chính thức, thay
vì phụ thuộc vào bất kỳ Codex CLI riêng biệt nào tình cờ được cài đặt cục bộ. Chỉ
đặt `appServer.command` khi bạn chủ ý muốn dùng một tệp thực thi khác. Các lượt
được quản lý thông thường với thư mục chính tác tử cô lập mặc định ưu tiên gói
đã ghim này ngay cả khi đã cài đặt gói ứng dụng máy tính macOS. Khi
[Computer Use](/vi/plugins/codex-computer-use) được bật, hoặc khi `homeScope` là
`"user"` và có thể tải trạng thái Computer Use gốc, quá trình khởi động được quản
lý thay vào đó ưu tiên tệp nhị phân của ứng dụng máy tính sở hữu các quyền macOS
cần thiết. Quy tắc ưu tiên ứng dụng máy tính tương tự cũng áp dụng khi cấu hình
Codex hiệu dụng của thư mục chính tác tử cô lập bật Computer Use gốc. Nếu không
cài đặt gói ứng dụng máy tính, OpenClaw quay về tệp nhị phân của gói đã ghim.

Việc bàn giao tệp thực thi và cô lập cấu hình gốc phối hợp các máy khách bên
trong một tiến trình Gateway đang chạy. Hãy khởi động lại Gateway sau khi một
tiến trình khác thay đổi cấu hình Plugin Codex gốc.

Tính năng giám sát phân giải một kết nối riêng. Khi không có cài đặt kết nối
`appServer` rõ ràng, nó sử dụng stdio được quản lý với `homeScope: "user"`; bộ
điều phối thông thường vẫn sử dụng stdio được quản lý với
`homeScope: "agent"`. Các cài đặt kết nối rõ ràng được cả hai đường dẫn tuân thủ.
Đặt rõ ràng `homeScope: "user"` khi bộ điều phối thông thường cần chia sẻ
`$CODEX_HOME` (hoặc `~/.codex`) với các máy khách gốc. Một liên kết riêng tư có
giám sát sử dụng kết nối giám sát bất kể giá trị mặc định của bộ điều phối thông
thường. Các tiến trình App Server độc lập duy trì trạng thái hoạt động và trạng
thái phê duyệt riêng biệt.

Đối với máy chủ ứng dụng đang chạy sẵn, hãy sử dụng phương thức truyền tải
WebSocket:

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

Các trường `appServer`:

| Trường                                        | Mặc định                                               | Ý nghĩa                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` khởi chạy Codex; `"unix"` được chỉ định rõ sẽ kết nối với socket điều khiển cục bộ; `"websocket"` kết nối với `url`.                                                                                                                                                                                                                                                                 |
| `homeScope`                                   | `"agent"`                                              | `"agent"` cô lập trạng thái harness thông thường theo từng agent OpenClaw. `"user"` là tùy chọn tham gia rõ ràng, dùng chung `$CODEX_HOME` gốc hoặc `~/.codex`, sử dụng xác thực gốc và bật tính năng quản lý luồng chỉ dành cho chủ sở hữu. Phạm vi người dùng hỗ trợ stdio cục bộ hoặc phương thức truyền Unix. Đối với kết nối giám sát riêng biệt, giá trị chưa đặt được phân giải thành `"user"` cho stdio hoặc Unix và `"agent"` cho WebSocket. |
| `command`                                     | tệp nhị phân Codex được quản lý                         | Tệp thực thi cho phương thức truyền stdio. Để trống để sử dụng tệp nhị phân được quản lý.                                                                                                                                                                                                                                                                                                      |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Các đối số cho phương thức truyền stdio.                                                                                                                                                                                                                                                                                                                                                       |
| `url`                                         | chưa đặt                                               | URL App Server WebSocket hoặc URL `unix://`. Đường dẫn Unix rỗng được chỉ định rõ sẽ chọn socket điều khiển chuẩn trong thư mục chính của người dùng.                                                                                                                                                                                                                                           |
| `authToken`                                   | chưa đặt                                               | Token Bearer cho phương thức truyền WebSocket. Chấp nhận chuỗi ký tự hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                         |
| `headers`                                     | `{}`                                                   | Các header WebSocket bổ sung. Giá trị header chấp nhận chuỗi ký tự hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                   | Tên các biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa của tiến trình đó.                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | chưa đặt                                               | Thư mục gốc không gian làm việc của app-server Codex từ xa. Khi được đặt, OpenClaw suy ra thư mục gốc không gian làm việc cục bộ từ không gian làm việc OpenClaw đã phân giải, giữ nguyên hậu tố cwd hiện tại bên dưới thư mục gốc từ xa này và chỉ gửi cwd cuối cùng của app-server đến Codex. Nếu cwd nằm ngoài thư mục gốc không gian làm việc OpenClaw đã phân giải, OpenClaw sẽ từ chối an toàn thay vì gửi đường dẫn cục bộ của Gateway đến app-server từ xa. |
| `requestTimeoutMs`                            | `60000`                                                | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển của app-server.                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Khoảng thời gian không hoạt động sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server thuộc phạm vi lượt trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Cơ chế bảo vệ tiến trình và trạng thái không hoạt động khi hoàn tất, được dùng sau khi chuyển giao công cụ, công cụ gốc hoàn tất, có tiến trình phản hồi thô của trợ lý sau công cụ, hoàn tất suy luận thô hoặc có tiến trình suy luận trong khi OpenClaw chờ `turn/completed`. Dùng tùy chọn này cho khối lượng công việc đáng tin cậy hoặc nặng, khi quá trình tổng hợp sau công cụ có thể im lặng lâu hơn ngân sách phát hành phản hồi cuối cùng của trợ lý một cách hợp lệ. |
| `mode`                                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Thiết lập sẵn cho việc thực thi YOLO hoặc được guardian xem xét.                                                                                                                                                                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` hoặc chính sách phê duyệt guardian được phép | Chính sách phê duyệt Codex gốc được gửi khi bắt đầu luồng, tiếp tục luồng và thực hiện lượt.                                                                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` hoặc sandbox guardian được phép | Chế độ sandbox Codex gốc được gửi khi bắt đầu và tiếp tục luồng. Các sandbox OpenClaw đang hoạt động thu hẹp những lượt `danger-full-access` thành `workspace-write` của Codex; cờ mạng của lượt tuân theo luồng ra của sandbox OpenClaw.                                                                                                                                                         |
| `approvalsReviewer`                           | `"user"` hoặc người đánh giá guardian được phép        | Dùng `"auto_review"` để cho phép Codex xem xét các lời nhắc phê duyệt gốc khi được phép.                                                                                                                                                                                                                                                                                                       |
| `defaultWorkspaceDir`                         | thư mục tiến trình hiện tại                            | Không gian làm việc được `/codex bind` sử dụng khi bỏ qua `--cwd`.                                                                                                                                                                                                                                                                                                                             |
| `serviceTier`                                 | chưa đặt                                               | Cấp dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý linh hoạt và `null` xóa giá trị ghi đè. Giá trị cũ `"fast"` được chấp nhận như `"priority"`.                                                                                                                                                                                            |
| `networkProxy`                                | bị tắt                                                 | Cho phép sử dụng mạng theo hồ sơ quyền của Codex cho các lệnh app-server. OpenClaw xác định cấu hình `permissions.<profile>.network` đã chọn và chọn cấu hình đó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                               |
| `experimental.sandboxExecServer`              | `false`                                                | Tùy chọn tham gia bản xem trước, đăng ký một môi trường Codex dựa trên sandbox OpenClaw với app-server Codex được hỗ trợ để việc thực thi Codex gốc có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                                        |

`appServer.networkProxy` được chỉ định rõ vì nó thay đổi hợp đồng sandbox của
Codex. Khi được bật, OpenClaw cũng đặt `features.network_proxy.enabled` và
`default_permissions` trong cấu hình luồng Codex để hồ sơ quyền được tạo có thể
khởi động mạng do Codex quản lý. Theo mặc định, OpenClaw tạo tên hồ sơ
`openclaw-network-<fingerprint>` có khả năng chống xung đột từ nội dung hồ sơ;
chỉ dùng `profileName` khi cần một tên cục bộ ổn định.

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
`networkProxy` sẽ sử dụng quyền truy cập hệ thống tệp kiểu không gian làm việc
cho hồ sơ quyền được tạo thay thế. Việc thực thi mạng do Codex quản lý là kết nối
mạng trong sandbox, vì vậy hồ sơ toàn quyền truy cập sẽ không bảo vệ lưu lượng đi.

Plugin chặn các phiên bắt tay app-server cũ hơn hoặc không có phiên bản: app-server
Codex phải báo cáo phiên bản ổn định `0.143.0` trở lên.

OpenClaw coi các URL app-server WebSocket không phải loopback là từ xa và yêu cầu
xác thực WebSocket mang danh tính thông qua `appServer.authToken` hoặc header
`Authorization`. `appServer.authToken` và mỗi giá trị `appServer.headers.*`
có thể là SecretInput; runtime bí mật phân giải SecretRefs và dạng viết tắt env
trước khi OpenClaw tạo các tùy chọn khởi động app-server, còn SecretRefs có cấu trúc
chưa được phân giải sẽ gây lỗi trước khi bất kỳ token hoặc header nào được gửi.
Khi các plugin Codex gốc được cấu hình, OpenClaw sử dụng mặt phẳng điều khiển plugin
của app-server đã kết nối để cài đặt hoặc làm mới các plugin đó, rồi làm mới danh mục
ứng dụng để các ứng dụng do plugin sở hữu hiển thị với luồng Codex. `app/list` vẫn là
nguồn danh mục và siêu dữ liệu có thẩm quyền, nhưng chính sách OpenClaw quyết định
liệu `thread/start` có gửi `config.apps[appId].enabled = true` cho một ứng dụng
được liệt kê và có thể truy cập hay không, ngay cả khi Codex hiện đánh dấu ứng dụng
đó là đã tắt. Các id ứng dụng không xác định hoặc bị thiếu vẫn bị từ chối theo
nguyên tắc đóng; đường dẫn này chỉ kích hoạt các plugin từ marketplace thông qua
`plugin/install` và làm mới danh mục. Chỉ kết nối OpenClaw với các app-server từ xa
được tin cậy để chấp nhận việc cài đặt plugin và làm mới danh mục ứng dụng do
OpenClaw quản lý.

## Chế độ phê duyệt và sandbox

Các phiên app-server stdio cục bộ mặc định dùng chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` và
`sandbox: "danger-full-access"`. Tư thế vận hành cục bộ đáng tin cậy này cho phép
các lượt chạy và Heartbeat OpenClaw không có người giám sát tiếp tục tiến triển mà
không xuất hiện lời nhắc phê duyệt gốc khi không có ai ở đó để phản hồi.

Nếu tệp yêu cầu hệ thống cục bộ của Codex không cho phép ngầm định các giá trị phê
duyệt, người xét duyệt hoặc sandbox của YOLO, OpenClaw sẽ coi giá trị mặc định ngầm
định là guardian và chọn các quyền guardian được phép. `tools.exec.mode: "auto"`
cũng buộc các phê duyệt Codex phải được guardian xét duyệt và không giữ lại các ghi
đè cũ không an toàn `approvalPolicy: "never"` hoặc
`sandbox: "danger-full-access"`; đặt `tools.exec.mode: "full"` để chủ ý sử dụng
tư thế không cần phê duyệt. Các mục `[[remote_sandbox_config]]` khớp tên máy chủ
trong cùng tệp yêu cầu được áp dụng khi quyết định giá trị sandbox mặc định.

Đặt `appServer.mode: "guardian"` để các phê duyệt Codex được guardian xét duyệt:

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

Giá trị đặt sẵn `guardian` được mở rộng thành `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` và `sandbox: "workspace-write"` khi các giá trị
đó được phép. Các trường chính sách riêng lẻ sẽ ghi đè `mode`. Giá trị người xét
duyệt cũ `guardian_subagent` vẫn được chấp nhận làm bí danh tương thích, nhưng cấu
hình mới nên sử dụng `auto_review`.

Khi sandbox OpenClaw đang hoạt động, tiến trình app-server Codex cục bộ vẫn chạy
trên máy chủ Gateway. Vì vậy, OpenClaw vô hiệu hóa Code Mode gốc của Codex, các máy
chủ MCP của người dùng và việc thực thi plugin dựa trên ứng dụng trong lượt đó thay
vì coi sandbox phía máy chủ Codex là tương đương với backend sandbox của OpenClaw.
Quyền truy cập shell được cung cấp thông qua các công cụ động dựa trên sandbox của
OpenClaw như `sandbox_exec` và `sandbox_process` khi các công cụ exec/process thông
thường khả dụng.

<Note>
Trên các máy chủ sandbox OpenClaw dựa trên Docker (`agents.defaults.sandbox.mode`
được đặt thành backend Docker), `openclaw doctor` kiểm tra xem máy chủ có cho phép
các namespace người dùng không đặc quyền (và namespace mạng khi lưu lượng mạng đi
của sandbox Docker bị vô hiệu hóa) mà `bwrap` Codex lồng nhau cần để thực thi shell
`workspace-write` bên trong container sandbox hay không. Kiểm tra thất bại thường
biểu hiện dưới dạng `bwrap: setting up uid map: Permission denied` hoặc
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` trên các máy chủ
Ubuntu/AppArmor. Hãy sửa chính sách namespace máy chủ được báo cáo cho người dùng
dịch vụ OpenClaw rồi khởi động lại Gateway; ưu tiên hồ sơ AppArmor có phạm vi giới
hạn cho tiến trình dịch vụ thay vì phương án dự phòng áp dụng toàn máy chủ
`kernel.apparmor_restrict_unprivileged_userns=0`, và không cấp các đặc quyền
container Docker rộng hơn chỉ để đáp ứng `bwrap` lồng nhau.
</Note>

## Thực thi gốc trong sandbox

Giá trị mặc định ổn định là từ chối theo nguyên tắc đóng: sandbox OpenClaw đang hoạt
động sẽ vô hiệu hóa các bề mặt thực thi Codex gốc vốn sẽ chạy từ máy chủ app-server
Codex. Chỉ sử dụng `appServer.experimental.sandboxExecServer: true` khi bạn muốn
thử khả năng hỗ trợ môi trường từ xa của Codex với backend sandbox của OpenClaw.
Đường dẫn xem trước này hoạt động với mọi phiên bản app-server Codex được hỗ trợ.

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

Khi cờ này được bật và phiên OpenClaw hiện tại nằm trong sandbox, OpenClaw khởi động
một exec-server local loopback được backend sandbox đang hoạt động hỗ trợ, đăng ký
nó với app-server Codex, rồi khởi động luồng và lượt Codex với môi trường do OpenClaw
sở hữu đó. Nếu app-server không thể đăng ký môi trường, lượt chạy sẽ thất bại theo
nguyên tắc đóng thay vì âm thầm chuyển về thực thi trên máy chủ.

Đường dẫn xem trước này chỉ dành cho môi trường cục bộ. Một app-server WebSocket từ
xa không thể truy cập exec-server loopback trừ khi nó chạy trên cùng máy chủ, vì vậy
OpenClaw từ chối tổ hợp đó.

## Xác thực và cô lập môi trường

Trong thư mục chính mặc định của từng tác tử, phương thức xác thực được chọn theo thứ
tự sau:

1. Một hồ sơ xác thực OpenClaw Codex được chỉ định rõ ràng cho tác tử.
2. Tài khoản hiện có của app-server trong thư mục chính Codex của tác tử đó.
3. Chỉ đối với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, rồi
   `OPENAI_API_KEY`, khi không có tài khoản app-server và vẫn cần xác thực OpenAI.

Khi OpenClaw phát hiện hồ sơ xác thực Codex kiểu gói đăng ký ChatGPT (loại thông tin
xác thực OAuth hoặc token), nó xóa `CODEX_API_KEY` và `OPENAI_API_KEY` khỏi tiến
trình con Codex được tạo. Việc này giữ cho các khóa API cấp Gateway khả dụng với
embedding hoặc các mô hình OpenAI trực tiếp mà không vô tình khiến các lượt
app-server Codex gốc được tính phí qua API.

Các hồ sơ khóa API Codex được chỉ định rõ ràng và phương án dự phòng bằng khóa env
của stdio cục bộ sử dụng đăng nhập app-server thay vì env được tiến trình con kế
thừa. Các kết nối app-server WebSocket không nhận phương án dự phòng khóa API qua
env của Gateway; hãy sử dụng hồ sơ xác thực rõ ràng hoặc tài khoản riêng của
app-server từ xa.

Theo mặc định, các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của
OpenClaw. OpenClaw sở hữu cầu nối tài khoản app-server Codex và đặt `CODEX_HOME`
thành một thư mục riêng cho từng tác tử bên dưới trạng thái OpenClaw của tác tử đó.
Việc này giữ cấu hình, tài khoản, bộ nhớ đệm/dữ liệu plugin và trạng thái luồng của
Codex trong phạm vi tác tử OpenClaw thay vì rò rỉ từ thư mục chính `~/.codex` cá
nhân của người vận hành.

Đặt `appServer.homeScope: "user"` để chia sẻ trạng thái Codex gốc với Codex
Desktop và CLI. Chế độ thư mục chính người dùng cục bộ này hỗ trợ stdio được quản lý
và cơ chế truyền Unix được chỉ định rõ ràng. Chế độ này sử dụng `$CODEX_HOME` khi
được đặt và `~/.codex` trong trường hợp còn lại, bao gồm xác thực, cấu hình, plugin
và luồng gốc. OpenClaw bỏ qua cầu nối hồ sơ xác thực của mình cho app-server. Các
lượt của chủ sở hữu đã được xác minh có thể dùng `codex_threads` để liệt kê (với bộ
lọc `search` tùy chọn), đọc, phân nhánh, đổi tên, lưu trữ và bỏ lưu trữ các luồng đó.
Hãy phân nhánh một luồng trước khi tiếp tục luồng đó trong OpenClaw; các tiến trình
Codex độc lập không phối hợp những tiến trình ghi đồng thời vào cùng một luồng.

Lựa chọn bật `homeScope` đó áp dụng cho các phiên harness thông thường. Một cuộc
trò chuyện được tạo thông qua Codex Sessions sẽ sử dụng kết nối giám sát riêng của
nó, qua đó duy trì cấu hình xác thực và nhà cung cấp của kết nối gốc cho nhánh chính
tắc và các lần tiếp tục trong tương lai.

Trong một cuộc trò chuyện được giám sát và khóa theo mô hình, `codex_threads` không
thể gắn một nhánh khác hoặc lưu trữ luồng gốc đã liên kết của cuộc trò chuyện. Tính
năng liệt kê và đọc chỉ siêu dữ liệu vẫn khả dụng. Việc đọc bản chép lời thô yêu cầu
`allowRawTranscripts`; khi tùy chọn này bị vô hiệu hóa, tìm kiếm danh sách cũng bị
từ chối vì tìm kiếm gốc có thể khớp với các bản xem trước bản chép lời. Việc đổi tên,
bỏ lưu trữ, tạo nhánh tách rời và lưu trữ một luồng không liên quan, không thuộc sở
hữu của một cuộc trò chuyện OpenClaw khác, yêu cầu `allowWriteControls`. Không tùy
chọn nào có thể vượt qua một liên kết đã khóa.

OpenClaw không ghi lại `HOME` cho các lần khởi chạy app-server cục bộ thông thường.
Các tiến trình con do Codex chạy như `openclaw`, `gh`, `git`, các CLI đám mây và
lệnh shell nhìn thấy thư mục chính thông thường của tiến trình và có thể tìm thấy cấu
hình cùng token trong thư mục chính người dùng. Codex cũng có thể phát hiện
`$HOME/.agents/skills` và `$HOME/.agents/plugins/marketplace.json`; cơ chế phát
hiện `.agents` đó được chủ ý chia sẻ với thư mục chính của người vận hành và tách
biệt với trạng thái `~/.codex` được cô lập.

Trong phạm vi tác tử mặc định, các plugin OpenClaw và ảnh chụp nhanh Skills của
OpenClaw vẫn đi qua sổ đăng ký plugin và trình tải Skills riêng của OpenClaw; các tài
nguyên `~/.codex` Codex cá nhân thì không. Nếu bạn có Skills hoặc plugin CLI Codex
hữu ích từ một thư mục chính Codex và muốn đưa chúng vào một tác tử OpenClaw được cô
lập, hãy kiểm kê chúng một cách rõ ràng:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Nếu một bản triển khai cần cô lập thêm môi trường, hãy thêm các biến đó vào
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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con app-server Codex được tạo.
OpenClaw xóa `CODEX_HOME` và `HOME` khỏi danh sách này trong quá trình chuẩn hóa
khởi chạy cục bộ: `CODEX_HOME` vẫn trỏ đến phạm vi tác tử hoặc người dùng đã chọn,
còn `HOME` vẫn được kế thừa để các tiến trình con có thể sử dụng trạng thái thông
thường trong thư mục chính người dùng.

## Công cụ động

Theo mặc định, các công cụ động Codex sử dụng phương thức tải `searchable`, được
cung cấp trong namespace `openclaw` với `deferLoading: true`. OpenClaw không cung
cấp các công cụ động trùng lặp với thao tác không gian làm việc gốc của Codex hoặc
bề mặt tìm kiếm công cụ riêng của Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

Hầu hết các công cụ tích hợp OpenClaw còn lại, chẳng hạn như nhắn tin, phương tiện,
Cron, trình duyệt, các Node, Gateway, `heartbeat_respond` và `web_search`, đều khả
dụng thông qua tìm kiếm công cụ Codex trong namespace đó. Điều này giúp ngữ cảnh mô
hình ban đầu nhỏ hơn. Một tập hợp nhỏ công cụ vẫn có thể được gọi trực tiếp bất kể
`codexDynamicToolsLoading`, vì tìm kiếm công cụ Codex có thể không khả dụng hoặc chỉ
phân giải được một tập hợp chỉ gồm trình kết nối: `agents_list`, `sessions_spawn`
và `sessions_yield`. Các hướng dẫn dành cho nhà phát triển vẫn định hướng các tác tử
con Codex thông thường đến `spawn_agent` gốc cho công việc tác tử con gốc Codex,
trong khi `sessions_spawn` vẫn khả dụng cho việc ủy quyền OpenClaw hoặc ACP được chỉ
định rõ ràng. Các phản hồi nguồn chỉ dùng công cụ tin nhắn cũng vẫn trực tiếp, vì đó
là một hợp đồng điều khiển lượt.

Các công cụ được đánh dấu `catalogMode: "direct-only"`, bao gồm công cụ `computer`
của OpenClaw, được nhóm trong `openclaw_direct`. OpenClaw thêm namespace đó vào
danh sách `code_mode.direct_only_tool_namespaces` của Codex mà không thay thế các
mục do người vận hành cung cấp. Do đó, Codex cung cấp các công cụ đó dưới dạng
`DirectModelOnly` trong các luồng thông thường và luồng chỉ dùng chế độ mã thay vì
định tuyến chúng qua các lệnh gọi `tools.*` của Code Mode lồng nhau. Ranh giới này
là bắt buộc đối với các kết quả chứa hình ảnh: quá trình tuần tự hóa Code Mode lồng
nhau làm phẳng đầu ra hình ảnh thành văn bản, khiến ảnh chụp màn hình cần thiết cho
thao tác máy tính tiếp theo bị loại bỏ.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối với một app-server Codex
tùy chỉnh không thể tìm kiếm các công cụ động được trì hoãn hoặc khi gỡ lỗi toàn bộ
tải trọng công cụ.

## Thời gian chờ

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`. Mỗi yêu cầu Codex `item/tool/call` sử dụng giá trị
hết thời gian khả dụng đầu tiên theo thứ tự sau:

- Đối số `timeoutMs` dương cho từng lệnh gọi.
- Đối với `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Đối với `image_generate` không được cấu hình thời gian chờ, giá trị mặc định
  120 giây dành cho việc tạo hình ảnh.
- Đối với công cụ `image` dùng để hiểu nội dung đa phương tiện,
  `tools.media.image.timeoutSeconds` được chuyển đổi sang mili giây, hoặc giá trị
  mặc định 60 giây dành cho đa phương tiện. Đối với việc hiểu hình ảnh, giá trị
  này áp dụng cho chính yêu cầu và không bị giảm bởi công việc chuẩn bị trước đó.
- Đối với công cụ `message`, giá trị mặc định cố định là 120 giây.
- Giá trị mặc định 90 giây dành cho công cụ động.

Bộ giám sát thời gian này là ngân sách tổng thể cho `item/tool/call` động. Các
thời gian chờ yêu cầu dành riêng cho nhà cung cấp chạy bên trong lệnh gọi đó và
giữ nguyên ngữ nghĩa hết thời gian của riêng chúng. Ngân sách công cụ động được
giới hạn ở 600000 ms. Khi hết thời gian, OpenClaw hủy tín hiệu công cụ nếu được
hỗ trợ và trả về cho Codex một phản hồi công cụ động thất bại để lượt có thể tiếp
tục thay vì khiến phiên bị kẹt ở trạng thái `processing`.

Sau khi Codex chấp nhận một lượt và sau khi OpenClaw phản hồi một yêu cầu máy chủ
ứng dụng trong phạm vi lượt, bộ khung tích hợp kỳ vọng Codex tiếp tục xử lý lượt
hiện tại và cuối cùng hoàn tất lượt gốc bằng `turn/completed`. Nếu máy chủ ứng
dụng không có hoạt động trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
cố gắng ngắt lượt Codex, ghi lại chẩn đoán hết thời gian và giải phóng làn xử lý
phiên OpenClaw để các tin nhắn trò chuyện tiếp theo không bị xếp hàng phía sau
một lượt gốc đã lỗi thời.

Hầu hết thông báo chưa kết thúc của cùng một lượt đều vô hiệu hóa bộ giám sát
ngắn này vì Codex đã chứng minh rằng lượt vẫn đang hoạt động. Việc bàn giao công
cụ sử dụng ngân sách chờ sau công cụ dài hơn: sau khi OpenClaw trả về phản hồi
`item/tool/call`, sau khi các mục công cụ gốc như `commandExecution` hoàn tất,
sau khi hoàn tất `custom_tool_call_output` thô, cũng như sau tiến trình thô của
trợ lý, hoàn tất suy luận thô hoặc tiến trình suy luận sau công cụ. Bộ bảo vệ sử
dụng `appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình;
nếu không, giá trị mặc định là năm phút. Ngân sách sau công cụ này cũng kéo dài
bộ giám sát tiến trình cho khoảng tổng hợp im lặng trước khi Codex phát sự kiện
tiếp theo của lượt hiện tại. Sau các lần hoàn tất suy luận, hoàn tất
`agentMessage` dạng bình luận và tiến trình suy luận thô hoặc tiến trình trợ lý
trước công cụ có thể là một phản hồi cuối tự động, vì vậy chúng sử dụng bộ bảo
vệ phản hồi sau tiến trình thay vì giải phóng làn xử lý phiên ngay lập tức. Chỉ
các mục `agentMessage` cuối cùng/không phải bình luận đã hoàn tất và các lần hoàn
tất trợ lý thô trước công cụ mới kích hoạt cơ chế giải phóng sau đầu ra của trợ
lý: nếu sau đó Codex im lặng mà không có `turn/completed`, OpenClaw sẽ cố gắng
ngắt lượt gốc và giải phóng làn xử lý phiên. Các lỗi máy chủ ứng dụng stdio an
toàn để phát lại, bao gồm hết thời gian chờ hoàn tất lượt mà không có bằng chứng
về trợ lý, công cụ, mục đang hoạt động hoặc tác dụng phụ, được thử lại một lần
trong một lần chạy máy chủ ứng dụng mới. Các trường hợp hết thời gian không an
toàn vẫn loại bỏ máy khách máy chủ ứng dụng bị kẹt và giải phóng làn xử lý phiên
OpenClaw. Chúng cũng xóa liên kết luồng gốc đã lỗi thời thay vì tự động phát lại.
Các trường hợp hết thời gian của bộ theo dõi hoàn tất hiển thị nội dung hết thời
gian dành riêng cho Codex: trường hợp an toàn để phát lại cho biết phản hồi có
thể chưa đầy đủ, còn trường hợp không an toàn yêu cầu người dùng xác minh trạng
thái hiện tại trước khi thử lại. Chẩn đoán hết thời gian công khai bao gồm các
trường cấu trúc như phương thức thông báo cuối cùng của máy chủ ứng dụng, mã
định danh/loại/vai trò của mục phản hồi thô từ trợ lý, số lượng yêu cầu/mục đang
hoạt động và trạng thái bộ theo dõi đã kích hoạt. Khi thông báo cuối cùng là một
mục phản hồi thô từ trợ lý, chẩn đoán cũng bao gồm bản xem trước văn bản trợ lý
có giới hạn. Chẩn đoán không bao gồm nội dung thô của lời nhắc hoặc công cụ.

## Khám phá mô hình

Theo mặc định, Plugin Codex yêu cầu máy chủ ứng dụng cung cấp các mô hình khả
dụng. Tính khả dụng của mô hình do máy chủ ứng dụng Codex quản lý, vì vậy danh
sách có thể thay đổi khi OpenClaw nâng cấp phiên bản `@openai/codex` đi kèm hoặc
khi một bản triển khai đặt `appServer.command` trỏ đến một tệp nhị phân Codex
khác. Tính khả dụng cũng có thể phụ thuộc vào tài khoản. Sử dụng `/codex models`
trên một Gateway đang chạy để xem danh mục trực tiếp của bộ khung tích hợp và
tài khoản đó.

Nếu quá trình khám phá thất bại hoặc hết thời gian, OpenClaw sử dụng danh mục dự
phòng đi kèm:

| Mã mô hình      | Tên hiển thị | Mức độ suy luận          |
| --------------- | ------------ | ------------------------ |
| `gpt-5.5`       | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini`  | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
Bộ khung tích hợp đi kèm hiện tại là `@openai/codex` `0.144.1`. Một lần thăm dò
`model/list` đối với máy chủ ứng dụng đi kèm đó đã trả về các hàng công khai sau
trong bộ chọn:

| Mã mô hình       | Phương thức đầu vào | Mức độ suy luận                      |
| ---------------- | ------------------- | ------------------------------------ |
| `gpt-5.6-sol`    | text, image         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`  | text, image         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`   | text, image         | low, medium, high, xhigh, max        |
| `gpt-5.5`        | text, image         | low, medium, high, xhigh             |
| `gpt-5.4`        | text, image         | low, medium, high, xhigh             |
| `gpt-5.4-mini`   | text, image         | low, medium, high, xhigh             |
| `gpt-5.2`        | text, image         | low, medium, high, xhigh             |

Danh mục máy chủ ứng dụng có thể báo cáo `ultra`; các điều khiển suy luận của
OpenClaw hiện chỉ cung cấp các mức đến `max`.

Các hàng trực tiếp trong bộ chọn phụ thuộc vào tài khoản và có thể thay đổi theo
tài khoản, danh mục Codex hoặc phiên bản đi kèm; hãy chạy `/codex models` để lấy
danh sách hiện tại thay vì dựa vào bất kỳ bảng nào tại một thời điểm cụ thể. Các
mô hình ẩn cũng có thể xuất hiện trong danh mục máy chủ ứng dụng dành cho các
luồng nội bộ hoặc chuyên biệt mà không phải là lựa chọn thông thường trong bộ
chọn mô hình.
</Note>

Điều chỉnh quá trình khám phá tại `plugins.entries.codex.config.discovery`:

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

Tắt quá trình khám phá khi bạn muốn lúc khởi động không thăm dò Codex và chỉ sử
dụng danh mục dự phòng:

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

## Các tệp khởi tạo không gian làm việc

Codex tự xử lý `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án gốc.
OpenClaw không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào tên
tệp dự phòng của Codex cho các tệp định hình cá tính, vì phương án dự phòng của
Codex chỉ áp dụng khi thiếu `AGENTS.md`.

Để duy trì tính tương đồng với không gian làm việc OpenClaw, bộ khung tích hợp
Codex chuyển tiếp các tệp khởi tạo khác dưới dạng chỉ dẫn dành cho nhà phát
triển, nhưng không theo cách giống hệt nhau:

- `TOOLS.md` được chuyển tiếp dưới dạng chỉ dẫn dành cho nhà phát triển Codex
  **được kế thừa**, vì vậy các tác tử con Codex gốc được tạo trong lượt cũng có
  thể thấy tệp này.
- `SOUL.md`, `IDENTITY.md` và `USER.md` được chuyển tiếp dưới dạng chỉ dẫn cộng
  tác **trong phạm vi lượt**. Các tác tử con Codex gốc không kế thừa chúng, nhờ
  đó các lượt của tác tử con không tiếp nhận cá tính và hồ sơ người dùng của tác
  tử cha.
- Danh sách Skills OpenClaw đã nạp ở dạng rút gọn cũng được chuyển tiếp dưới dạng
  chỉ dẫn cộng tác dành cho nhà phát triển trong phạm vi lượt, vì vậy các tác tử
  con Codex gốc cũng không kế thừa danh sách này.
- Nội dung `HEARTBEAT.md` không được chèn; các lượt Heartbeat nhận một chỉ dẫn ở
  chế độ cộng tác để đọc tệp khi tệp tồn tại và không trống.
- Nội dung `MEMORY.md` từ không gian làm việc đã cấu hình của tác tử không được
  dán vào đầu vào lượt Codex gốc khi các công cụ bộ nhớ khả dụng cho không gian
  làm việc đó; khi tệp tồn tại, bộ khung tích hợp thêm một chỉ dẫn ngắn về bộ nhớ
  không gian làm việc vào chỉ dẫn cộng tác dành cho nhà phát triển trong phạm vi
  lượt và Codex nên sử dụng `memory_search` hoặc `memory_get` khi bộ nhớ lâu dài
  có liên quan. Nếu các công cụ bị tắt, tính năng tìm kiếm bộ nhớ không khả dụng
  hoặc không gian làm việc đang hoạt động khác với không gian làm việc bộ nhớ
  của tác tử, `MEMORY.md` sẽ sử dụng đường dẫn ngữ cảnh lượt có giới hạn thông
  thường.
- `BOOTSTRAP.md`, khi tồn tại, được chuyển tiếp dưới dạng ngữ cảnh tham chiếu đầu
  vào lượt OpenClaw.

## Ghi đè bằng biến môi trường

Các ghi đè bằng biến môi trường vẫn khả dụng cho việc kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị loại bỏ. Thay vào đó, hãy sử dụng
`plugins.entries.codex.config.appServer.mode: "guardian"`, hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` để kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các bản triển khai có thể lặp lại vì nó giữ hành vi của Plugin
trong cùng tệp đã được rà soát với phần còn lại của thiết lập bộ khung tích hợp
Codex.

## Liên quan

- [Bộ khung tích hợp Codex](/vi/plugins/codex-harness)
- [Môi trường chạy của bộ khung tích hợp Codex](/vi/plugins/codex-harness-runtime)
- [Giám sát Codex](/plugins/codex-supervision)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Codex Computer Use](/vi/plugins/codex-computer-use)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference)
