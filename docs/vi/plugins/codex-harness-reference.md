---
read_when:
    - Bạn cần mọi trường cấu hình của bộ khung Codex
    - Bạn đang thay đổi hành vi truyền tải, xác thực, khám phá hoặc thời gian chờ của máy chủ ứng dụng
    - Bạn đang gỡ lỗi quá trình khởi động bộ khung Codex, khám phá mô hình hoặc cô lập môi trường
summary: Tham chiếu về cấu hình, xác thực, khám phá và máy chủ ứng dụng cho bộ kiểm thử Codex
title: Tham chiếu bộ khung Codex
x-i18n:
    generated_at: "2026-07-19T05:52:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f55db3e8850c574dd2cbb69ec55fb584ee16055eb4d3751946f0e7fa809a8175
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Tham chiếu này trình bày cấu hình chi tiết cho plugin `codex` chính thức.
Để thiết lập và đưa ra quyết định định tuyến, hãy bắt đầu với
[bộ khung Codex](/vi/plugins/codex-harness).

## Bề mặt cấu hình plugin

Tất cả cài đặt của bộ khung Codex nằm trong `plugins.entries.codex.config`.

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

| Trường                      | Mặc định                  | Ý nghĩa                                                                                                                                        |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | được bật                  | Cài đặt khám phá mô hình cho `model/list` của máy chủ ứng dụng Codex.                                                                                    |
| `appServer`                | máy chủ ứng dụng stdio được quản lý | Cài đặt về phương thức truyền tải, lệnh, xác thực, phê duyệt, sandbox và thời gian chờ. Bộ khung thông thường mặc định dùng trạng thái theo phạm vi tác nhân.                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Dùng `"direct"` để đưa trực tiếp các công cụ động của OpenClaw vào ngữ cảnh công cụ Codex ban đầu.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Các tên công cụ động bổ sung của OpenClaw cần loại khỏi các lượt máy chủ ứng dụng Codex.                                                                    |
| `codexPlugins`             | bị tắt                 | Hỗ trợ plugin/ứng dụng Codex gốc, bao gồm quyền truy cập có chủ đích vào các ứng dụng của tài khoản đã kết nối. Xem [Plugin Codex gốc](/vi/plugins/codex-native-plugins). |
| `computerUse`              | bị tắt                 | Thiết lập Codex Computer Use. Xem [Codex Computer Use](/vi/plugins/codex-computer-use).                                                               |
| `sessionCatalog`           | được bật                  | Khám phá phiên Codex gốc cho thanh bên. Đặt `enabled: false` để tắt khám phá mà không tắt nhà cung cấp hoặc bộ khung.           |
| `supervision`              | bị tắt                 | Chính sách bản chép lời phiên gốc và kiểm soát ghi dành cho tác nhân. Xem [Giám sát Codex](/plugins/codex-supervision).                          |

## Giám sát

Theo mặc định, tính năng khám phá phiên gốc liệt kê các phiên Codex chưa lưu trữ từ máy tính
Gateway và các Node đã ghép cặp có chủ đích. Chỉ tắt danh mục đó bằng:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` kiểm soát riêng các công cụ dành cho tác nhân:

| Trường                 | Mặc định                 | Ý nghĩa                                                                                                                                                                                                                                   |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Bật các công cụ giám sát Codex dành cho tác nhân. Điều này không kiểm soát danh mục phiên của người vận hành đã xác thực.                                                                                                                            |
| `endpoints`           | điểm cuối cục bộ tích hợp sẵn | Các đích điểm cuối tương thích và nâng cao cho tác nhân giám sát Codex được giữ lại và các công cụ MCP độc lập. Danh mục dành cho con người và luồng nhánh bỏ qua các đích này và sử dụng App Server giám sát được phân giải từ `appServer`.       |
| `allowRawTranscripts` | `false`                 | Khi giám sát được bật, cho phép tác nhân tự chủ hoặc MCP độc lập đọc bản chép lời và các trường danh sách được suy ra từ bản chép lời. Việc đọc chỉ siêu dữ liệu `codex_threads` vẫn khả dụng. Không kiểm soát việc tiếp tục trong Control UI đã xác thực.     |
| `allowWriteControls`  | `false`                 | Khi giám sát được bật, cho phép các thao tác rẽ nhánh, đổi tên, lưu trữ và bỏ lưu trữ `codex_threads` tự chủ, cùng các thao tác gửi, điều hướng và ngắt của MCP độc lập. Không bỏ qua các bước kiểm tra khác về liên kết, máy chủ, trạng thái hoặc xác nhận. |

Các mục điểm cuối chấp nhận các trường sau:

| Trường          | Áp dụng cho    | Ý nghĩa                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | tất cả           | ID điểm cuối ổn định.                                                   |
| `label`        | tất cả           | Nhãn hiển thị tùy chọn.                                               |
| `transport`    | tất cả           | `"stdio-proxy"` hoặc `"websocket"`.                                     |
| `command`      | `stdio-proxy` | Lệnh App Server tùy chọn.                                          |
| `args`         | `stdio-proxy` | Các đối số lệnh tùy chọn.                                           |
| `cwd`          | `stdio-proxy` | Thư mục làm việc tùy chọn của tiến trình con.                             |
| `url`          | `websocket`   | URL WebSocket hoặc socket cục bộ được hỗ trợ và bắt buộc.                     |
| `authTokenEnv` | `websocket`   | Biến môi trường tùy chọn có giá trị dùng để xác thực điểm cuối. |

Trang **Phiên Codex** sử dụng App Server giám sát của plugin và chỉ hiển thị
các phiên chưa lưu trữ. Khi không có cài đặt kết nối `appServer` rõ ràng,
kết nối đó là stdio thư mục chính của người dùng được quản lý. Các hàng cục bộ đã lưu hoặc đang nhàn rỗi có thể tạo
một cuộc trò chuyện bị khóa theo mô hình với lịch sử người dùng và trợ lý có giới hạn cho đến
lượt nguồn cuối cùng ở trạng thái kết thúc đã được lưu bền vững. Liên kết riêng tư của cuộc trò chuyện duy trì nhánh rẽ từ ảnh chụp nhanh,
nhánh nguồn `appServer` chính tắc, việc chèn lịch sử và các lượt sau đó trên
kết nối đó. Lần bắt đầu chính tắc đầu tiên sử dụng cặp do thao tác rẽ nhánh trả về. Các lần
tiếp tục sau bỏ qua phần ghi đè mô hình và nhà cung cấp của OpenClaw để Codex khôi phục
cặp đã lưu bền vững của luồng chính tắc; một thay đổi gốc riêng biệt có thể cập nhật
cặp đó, nhưng mô hình bên ngoài và chuỗi dự phòng không bao giờ thay thế cặp này. Các hàng đã lưu và đang nhàn rỗi
có thể được lưu trữ sau khi xác nhận không có trình chạy nào khác, trừ khi một liên kết OpenClaw đang hoạt động khác
sở hữu đúng đích hoặc một trong các hậu duệ được tạo ra và chưa lưu trữ của đích đó.
OpenClaw tuân theo cơ chế phân trang hậu duệ của Codex và đóng an toàn khi gặp
lỗi liệt kê, chu kỳ hoặc cạn giới hạn an toàn. Việc xác nhận vẫn
bao quát các máy khách gốc không xác định và tình huống tranh chấp từ trạng thái sang lưu trữ. Không thể xóa một
cuộc trò chuyện được giám sát và bị khóa theo mô hình khi cuộc trò chuyện đó bảo vệ liên kết gốc.
Các nguồn đang hoạt động không thể tạo nhánh hoặc được lưu trữ, nhưng vẫn có thể mở một cuộc trò chuyện được giám sát
hiện có. Mọi hàng của Node đã ghép cặp đều ở chế độ chỉ đọc; phương thức truyền tải của Node
chưa cung cấp vòng đời phát trực tuyến mà bộ khung cần.

Chỉ riêng `appServer.homeScope: "user"` thay đổi thư mục chính Codex mà một tiến trình bộ khung
được quản lý sử dụng; cài đặt này không công bố danh mục đội máy. Việc bật giám sát không
thay đổi giá trị mặc định của bộ khung. Thay vào đó, kết nối giám sát riêng biệt
mặc định dùng stdio thư mục chính của người dùng được quản lý khi không có cài đặt kết nối `appServer`
rõ ràng. Các cài đặt rõ ràng được tuân thủ cho kết nối đó.
Các liên kết được giám sát đang chờ xử lý và đã cam kết duy trì kết nối đó cho mọi lượt;
giám sát bị tắt hoặc độ lệch kết nối/vòng đời sẽ đóng an toàn thay vì
dự phòng về bộ khung dùng thư mục chính của tác nhân. Kết nối mặc định chia sẻ các phiên đã lưu
với máy khách Codex gốc, nhưng không chia sẻ trạng thái hoạt động cục bộ theo tiến trình của chúng.

Các cài đặt `plugins.entries.codex-supervisor` cũ đã bị loại bỏ. Chạy
`openclaw doctor --fix` để di chuyển mục cũ, định nghĩa điểm cuối, cờ
chính sách và tham chiếu cho phép/từ chối plugin vào khối này. Các giá trị `codex.config.supervision`
chính tắc được đặt rõ ràng sẽ được ưu tiên khi có xung đột.

## Phương thức truyền tải của máy chủ ứng dụng

Đối với các lượt bộ khung thông thường, OpenClaw khởi động tệp nhị phân Codex được quản lý đi kèm
plugin chính thức (hiện là `@openai/codex` `0.144.6`):

```bash
codex app-server --listen stdio://
```

Điều này giữ phiên bản máy chủ ứng dụng gắn với plugin `codex` chính thức thay vì
bất kỳ Codex CLI riêng biệt nào tình cờ được cài đặt cục bộ. Chỉ đặt
`appServer.command` khi bạn chủ ý muốn dùng một tệp thực thi khác.
Các lượt được quản lý thông thường với thư mục chính tác nhân cô lập mặc định ưu tiên gói
được ghim này ngay cả khi đã cài đặt gói ứng dụng máy tính macOS. Khi
[Computer Use](/vi/plugins/codex-computer-use) được bật, hoặc khi `homeScope` là
`"user"` và có thể tải trạng thái Computer Use gốc, quy trình khởi động được quản lý sẽ ưu tiên
tệp nhị phân của ứng dụng máy tính sở hữu các quyền macOS cần thiết. Quy tắc
ưu tiên ứng dụng máy tính tương tự được áp dụng khi cấu hình Codex hiệu lực của thư mục chính tác nhân cô lập
bật Computer Use gốc. Nếu không cài đặt gói ứng dụng máy tính, OpenClaw
dự phòng về tệp nhị phân của gói được ghim.

Việc bàn giao tệp thực thi và phân vùng cấu hình gốc điều phối các máy khách bên trong một
tiến trình Gateway đang chạy. Hãy khởi động lại Gateway sau khi một tiến trình khác thay đổi
cấu hình plugin Codex gốc.

Giám sát phân giải một kết nối riêng biệt. Khi không có cài đặt kết nối
`appServer` rõ ràng, nó sử dụng stdio được quản lý với `homeScope: "user"`;
bộ khung thông thường vẫn sử dụng stdio được quản lý với `homeScope: "agent"`. Cả hai đường dẫn đều tuân thủ
các cài đặt kết nối rõ ràng. Đặt `homeScope: "user"`
rõ ràng khi bộ khung thông thường cần chia sẻ `$CODEX_HOME` (hoặc `~/.codex`)
với các máy khách gốc. Một liên kết được giám sát riêng tư sử dụng kết nối giám sát
bất kể giá trị mặc định của bộ khung thông thường. Các tiến trình App Server độc lập
duy trì trạng thái trực tiếp và trạng thái phê duyệt riêng biệt.

Để kiểm thử ngoài môi trường sản xuất với một máy chủ ứng dụng đang chạy, phương thức truyền tải
WebSocket khả dụng:

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

Codex phân loại phương thức truyền tải WebSocket là thử nghiệm và không được hỗ trợ. Nên ưu tiên
stdio được quản lý hoặc socket điều khiển Unix cục bộ cho tải công việc sản xuất.

Các trường `appServer`:

| Trường                                         | Mặc định                                                | Ý nghĩa                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` khởi chạy Codex; `"unix"` tường minh kết nối với socket điều khiển cục bộ; `"websocket"` kết nối với `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` cô lập trạng thái harness thông thường theo từng agent OpenClaw. `"user"` là lựa chọn tham gia tường minh, chia sẻ `$CODEX_HOME` hoặc `~/.codex` gốc, sử dụng xác thực gốc và cho phép quản lý luồng chỉ dành cho chủ sở hữu. Phạm vi người dùng hỗ trợ stdio cục bộ hoặc phương thức truyền Unix. Đối với kết nối giám sát riêng, giá trị chưa đặt được phân giải thành `"user"` cho stdio hoặc Unix và `"agent"` cho WebSocket.     |
| `command`                                     | tệp nhị phân Codex được quản lý                                   | Tệp thực thi cho phương thức truyền stdio. Để trống để sử dụng tệp nhị phân được quản lý.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Các đối số cho phương thức truyền stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | chưa đặt                                                  | URL App Server WebSocket hoặc URL `unix://`. Một đường dẫn Unix tường minh để trống sẽ chọn socket điều khiển chuẩn trong thư mục chính của người dùng.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | chưa đặt                                                  | Bearer token cho phương thức truyền WebSocket. Chấp nhận chuỗi ký tự trực tiếp hoặc SecretInput như `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Các header WebSocket bổ sung. Giá trị header chấp nhận chuỗi ký tự trực tiếp hoặc giá trị SecretInput, ví dụ `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Tên các biến môi trường bổ sung bị xóa khỏi tiến trình app-server stdio được khởi chạy sau khi OpenClaw xây dựng môi trường kế thừa của tiến trình đó.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | chưa đặt                                                  | Thư mục gốc không gian làm việc của app-server Codex từ xa. Khi được đặt, OpenClaw suy ra thư mục gốc không gian làm việc cục bộ từ không gian làm việc OpenClaw đã phân giải, giữ nguyên hậu tố cwd hiện tại bên dưới thư mục gốc từ xa này và chỉ gửi cwd app-server cuối cùng đến Codex. Nếu cwd nằm ngoài thư mục gốc không gian làm việc OpenClaw đã phân giải, OpenClaw sẽ từ chối an toàn thay vì gửi đường dẫn cục bộ của Gateway đến app-server từ xa. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Cài đặt tiến trình con Codex `PreToolUse`, chỉ được dùng để OpenClaw phát hiện vòng lặp và nhận biết dấu hiệu tường minh cho biết không có chính sách. Đặt `false` để giảm số tiến trình phân nhánh cho mỗi công cụ. Các hook Plugin trước công cụ và chính sách công cụ đáng tin cậy vẫn cài đặt relay bắt buộc tương ứng.                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | Thời gian chờ cho các lệnh gọi mặt phẳng điều khiển của app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Khoảng thời gian im lặng sau khi Codex chấp nhận một lượt hoặc sau một yêu cầu app-server trong phạm vi lượt, trong khi OpenClaw chờ `turn/completed`.                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | Khoảng thời gian im lặng sau khi một mục cuối cùng/không phải bình luận của trợ lý hoặc phần hoàn tất thô của trợ lý trước công cụ kích hoạt việc giải phóng đầu ra trợ lý, trong khi OpenClaw vẫn chờ `turn/completed`. Việc tăng giá trị này cho Codex thêm thời gian để phát `turn/completed` trước khi OpenClaw ngắt và giải phóng làn phiên.                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Cơ chế bảo vệ trạng thái nhàn rỗi khi hoàn tất và tiến độ, được dùng sau khi bàn giao công cụ, công cụ gốc hoàn tất, tiến độ thô của trợ lý sau công cụ, phần suy luận thô hoàn tất hoặc tiến độ suy luận, trong khi OpenClaw chờ `turn/completed`. Dùng tùy chọn này cho khối lượng công việc đáng tin cậy hoặc nặng, nơi quá trình tổng hợp sau công cụ có thể im lặng lâu hơn ngân sách giải phóng trợ lý cuối cùng một cách hợp lệ.                                |
| `mode`                                        | `"yolo"` trừ khi yêu cầu Codex cục bộ không cho phép YOLO | Cấu hình đặt trước cho việc thực thi YOLO hoặc thực thi được guardian review.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` hoặc một chính sách phê duyệt guardian được cho phép       | Chính sách phê duyệt Codex gốc được gửi khi bắt đầu luồng, tiếp tục luồng và thực hiện lượt.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` hoặc một sandbox guardian được cho phép  | Chế độ sandbox Codex gốc được gửi khi bắt đầu và tiếp tục luồng. Các sandbox OpenClaw đang hoạt động thu hẹp các lượt `danger-full-access` thành Codex `workspace-write`; cờ mạng của lượt tuân theo lưu lượng đi ra của sandbox OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` hoặc một người review guardian được cho phép               | Dùng `"auto_review"` để cho phép Codex review các lời nhắc phê duyệt gốc khi được phép.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | thư mục tiến trình hiện tại                              | Không gian làm việc được `/codex bind` sử dụng khi `--cwd` bị bỏ qua.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | chưa đặt                                                  | Tầng dịch vụ app-server Codex tùy chọn. `"priority"` bật định tuyến chế độ nhanh, `"flex"` yêu cầu xử lý linh hoạt và `null` xóa giá trị ghi đè. `"fast"` cũ được chấp nhận dưới dạng `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | tắt                                               | Chọn sử dụng kết nối mạng theo hồ sơ quyền của Codex cho các lệnh app-server. OpenClaw xác định cấu hình `permissions.<profile>.network` đã chọn và chọn cấu hình đó bằng `default_permissions` thay vì gửi `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Tùy chọn tham gia bản xem trước, đăng ký một môi trường Codex dựa trên sandbox của OpenClaw với app-server Codex được hỗ trợ để quá trình thực thi Codex gốc có thể chạy bên trong sandbox OpenClaw đang hoạt động.                                                                                                                                                                                                            |

`appServer.networkProxy` được khai báo rõ ràng vì nó thay đổi hợp đồng sandbox
của Codex. Khi được bật, OpenClaw cũng đặt `features.network_proxy.enabled` và
`default_permissions` trong cấu hình luồng Codex để hồ sơ quyền được tạo
có thể khởi động mạng do Codex quản lý. Theo mặc định, OpenClaw tạo tên hồ sơ
`openclaw-network-<fingerprint>` có khả năng chống xung đột từ nội dung hồ sơ;
chỉ sử dụng `profileName` khi cần một tên cục bộ ổn định.

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
`networkProxy` sẽ sử dụng quyền truy cập hệ thống tệp kiểu workspace cho
hồ sơ quyền được tạo. Việc thực thi chính sách mạng do Codex quản lý là mạng
được sandbox, vì vậy hồ sơ toàn quyền truy cập sẽ không bảo vệ lưu lượng đi.

Plugin chặn các quá trình bắt tay app-server cũ hơn, mới hơn nhưng chưa được xác thực,
bản phát hành trước, có hậu tố bản dựng hoặc không có phiên bản. Codex app-server
phải báo cáo một phiên bản ổn định từ `0.143.0` đến
`0.144.6` đi kèm.

OpenClaw coi các URL app-server WebSocket không phải loopback là từ xa và yêu cầu
xác thực WebSocket mang thông tin định danh thông qua `appServer.authToken` hoặc
header `Authorization`. `appServer.authToken` và mỗi giá trị
`appServer.headers.*` có thể là một SecretInput; runtime bí mật phân giải SecretRef
và dạng viết tắt env trước khi OpenClaw tạo các tùy chọn khởi động app-server,
còn SecretRef có cấu trúc chưa được phân giải sẽ gây lỗi trước khi bất kỳ token
hoặc header nào được gửi. Khi các plugin Codex gốc được cấu hình, OpenClaw sử dụng
mặt phẳng điều khiển plugin của app-server đã kết nối để cài đặt hoặc làm mới
các plugin đó, rồi làm mới danh mục ứng dụng để các ứng dụng thuộc sở hữu plugin
hiển thị với luồng Codex. `app/list` vẫn là nguồn danh mục và siêu dữ liệu
có thẩm quyền, nhưng chính sách OpenClaw quyết định liệu `thread/start` có gửi
`config.apps[appId].enabled = true` cho một ứng dụng có thể truy cập trong danh sách hay không,
ngay cả khi Codex hiện đánh dấu ứng dụng đó là đã tắt. ID ứng dụng không xác định
hoặc bị thiếu vẫn bị từ chối theo nguyên tắc đóng an toàn; đường dẫn này chỉ kích hoạt
các plugin marketplace thông qua `plugin/install` và làm mới danh mục. Chỉ kết nối
OpenClaw với các app-server từ xa đáng tin cậy để chấp nhận việc cài đặt plugin và
làm mới danh mục ứng dụng do OpenClaw quản lý.

## Chế độ phê duyệt và sandbox

Theo mặc định, các phiên app-server stdio cục bộ sử dụng chế độ YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` và
`sandbox: "danger-full-access"`. Trạng thái vận hành cục bộ đáng tin cậy này cho phép
các lượt chạy và Heartbeat OpenClaw không có người giám sát tiếp tục tiến triển
mà không cần lời nhắc phê duyệt gốc vốn không có ai ở đó để phản hồi.

Nếu tệp yêu cầu hệ thống cục bộ của Codex không cho phép các giá trị phê duyệt YOLO,
người review hoặc sandbox ngầm định, OpenClaw sẽ coi giá trị mặc định ngầm định là
guardian và chọn các quyền guardian được phép. `tools.exec.mode: "auto"`
cũng bắt buộc các phê duyệt Codex được guardian review và không giữ lại các ghi đè
`approvalPolicy: "never"` hoặc `sandbox: "danger-full-access"` cũ không an toàn;
đặt `tools.exec.mode: "full"` khi chủ ý không sử dụng phê duyệt.
Các mục `[[remote_sandbox_config]]` khớp tên máy chủ trong cùng tệp yêu cầu
được tuân thủ khi quyết định giá trị sandbox mặc định.

Đặt `appServer.mode: "guardian"` để sử dụng các phê duyệt Codex được guardian review:

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
`approvalsReviewer: "auto_review"` và `sandbox: "workspace-write"` khi các giá trị đó
được phép. Các trường chính sách riêng lẻ ghi đè `mode`. Giá trị
người review `guardian_subagent` cũ hơn vẫn được chấp nhận làm bí danh tương thích,
nhưng cấu hình mới nên sử dụng `auto_review`.

Khi sandbox OpenClaw đang hoạt động, tiến trình Codex app-server cục bộ vẫn
chạy trên máy chủ Gateway. Do đó, OpenClaw vô hiệu hóa Code Mode gốc của Codex,
các máy chủ MCP của người dùng và việc thực thi plugin dựa trên ứng dụng cho lượt đó,
thay vì coi sandbox phía máy chủ Codex là tương đương với backend sandbox của
OpenClaw. Quyền truy cập shell được cung cấp thông qua các công cụ động dựa trên
sandbox OpenClaw như `sandbox_exec` và `sandbox_process` khi các công cụ
exec/process thông thường khả dụng.

<Note>
Trên các máy chủ sandbox OpenClaw dựa trên Docker (`agents.defaults.sandbox.mode` được đặt
thành backend Docker), `openclaw doctor` thăm dò xem máy chủ có cho phép các
namespace người dùng không đặc quyền (và namespace mạng khi lưu lượng mạng đi
của sandbox Docker bị tắt) mà `bwrap` Codex lồng nhau cần cho việc
thực thi shell `workspace-write` bên trong container sandbox hay không. Thăm dò
thất bại thường hiển thị dưới dạng `bwrap: setting up uid map: Permission denied` hoặc
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` trên các máy chủ Ubuntu/AppArmor.
Hãy sửa chính sách namespace máy chủ được báo cáo cho người dùng dịch vụ OpenClaw
và khởi động lại Gateway; ưu tiên hồ sơ AppArmor giới hạn phạm vi cho tiến trình
dịch vụ thay vì phương án dự phòng toàn máy chủ `kernel.apparmor_restrict_unprivileged_userns=0`,
và không cấp đặc quyền container Docker rộng hơn chỉ để đáp ứng
`bwrap` lồng nhau.
</Note>

## Thực thi gốc trong sandbox

Giá trị mặc định ổn định là đóng an toàn: sandbox OpenClaw đang hoạt động sẽ vô hiệu hóa
các bề mặt thực thi Codex gốc mà nếu không sẽ chạy từ máy chủ Codex app-server.
Chỉ sử dụng `appServer.experimental.sandboxExecServer: true` khi muốn thử hỗ trợ môi trường từ xa
của Codex với backend sandbox của OpenClaw. Đường dẫn xem trước này hoạt động
với mọi phiên bản Codex app-server được hỗ trợ.

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

Khi cờ được bật và phiên OpenClaw hiện tại nằm trong sandbox, OpenClaw
khởi động một exec-server loopback cục bộ dựa trên sandbox đang hoạt động,
đăng ký nó với Codex app-server, rồi khởi động luồng và lượt Codex bằng môi trường
thuộc sở hữu OpenClaw đó. Nếu app-server không thể đăng ký môi trường, lần chạy
sẽ thất bại theo nguyên tắc đóng an toàn thay vì âm thầm quay về thực thi trên máy chủ.

Đường dẫn xem trước này chỉ dành cho cục bộ. Một app-server WebSocket từ xa không thể
truy cập exec-server loopback trừ khi nó chạy trên cùng máy chủ, vì vậy OpenClaw
từ chối tổ hợp đó.

## Xác thực và cô lập môi trường

Trong thư mục home mặc định theo từng agent, phương thức xác thực được chọn theo thứ tự sau:

1. Một hồ sơ xác thực Codex OpenClaw được chỉ định rõ ràng cho agent.
2. Tài khoản hiện có của app-server trong thư mục home Codex của agent đó.
3. Chỉ đối với các lần khởi chạy app-server stdio cục bộ, `CODEX_API_KEY`, sau đó là
   `OPENAI_API_KEY`, khi không có tài khoản app-server và vẫn cần xác thực OpenAI.

Khi OpenClaw phát hiện hồ sơ xác thực Codex kiểu gói thuê bao ChatGPT (loại thông tin
xác thực OAuth hoặc token), nó xóa `CODEX_API_KEY` và `OPENAI_API_KEY`
khỏi tiến trình con Codex được khởi chạy. Điều này giữ các khóa API cấp Gateway
khả dụng cho embedding hoặc các mô hình OpenAI trực tiếp mà không khiến các lượt
Codex app-server gốc vô tình được tính phí qua API.

Các hồ sơ khóa API Codex được chỉ định rõ ràng và phương án dự phòng khóa env stdio
cục bộ sử dụng đăng nhập app-server thay vì kế thừa env của tiến trình con. Các kết nối
app-server WebSocket không nhận phương án dự phòng khóa API env của Gateway; hãy sử dụng
hồ sơ xác thực được chỉ định rõ ràng hoặc tài khoản riêng của app-server từ xa.

Theo mặc định, các lần khởi chạy app-server stdio kế thừa môi trường tiến trình của
OpenClaw. OpenClaw sở hữu cầu nối tài khoản Codex app-server và đặt
`CODEX_HOME` thành thư mục theo từng agent trong trạng thái OpenClaw của agent đó.
Điều này giữ cấu hình, tài khoản, bộ nhớ đệm/dữ liệu plugin và trạng thái luồng Codex
trong phạm vi agent OpenClaw, thay vì rò rỉ từ thư mục home `~/.codex`
cá nhân của người vận hành.

Đặt `appServer.homeScope: "user"` để chia sẻ trạng thái Codex gốc với Codex
Desktop và CLI. Chế độ thư mục home người dùng cục bộ này hỗ trợ stdio được quản lý
và phương thức truyền Unix được chỉ định rõ ràng. Chế độ này sử dụng
`$CODEX_HOME` khi được đặt và `~/.codex` trong trường hợp còn lại,
bao gồm xác thực, cấu hình, plugin và luồng gốc. OpenClaw bỏ qua cầu nối hồ sơ xác thực
của mình cho app-server. Các lượt của chủ sở hữu đã xác minh có thể sử dụng
`codex_threads` để liệt kê (với bộ lọc `search` tùy chọn),
đọc, phân nhánh, đổi tên, lưu trữ và bỏ lưu trữ các luồng đó. Hãy phân nhánh một luồng
trước khi tiếp tục luồng đó trong OpenClaw; các tiến trình Codex độc lập không phối hợp
những tiến trình ghi đồng thời cho cùng một luồng.

Lựa chọn tham gia `homeScope` đó áp dụng cho các phiên harness thông thường.
Một Chat được tạo thông qua Codex Sessions sẽ sử dụng kết nối giám sát riêng của nó,
giúp duy trì cấu hình xác thực và nhà cung cấp của kết nối gốc cho nhánh chuẩn và
các lần tiếp tục trong tương lai.

Trong một Chat được giám sát và khóa mô hình, `codex_threads` không thể đính kèm
một nhánh khác hoặc lưu trữ luồng gốc đã liên kết của Chat. Khả năng liệt kê và đọc
chỉ siêu dữ liệu vẫn khả dụng. Việc đọc bản chép lời thô yêu cầu
`allowRawTranscripts`; khi tùy chọn này bị tắt, tìm kiếm danh sách cũng bị từ chối
vì tìm kiếm gốc có thể khớp với bản xem trước bản chép lời. Việc đổi tên, bỏ lưu trữ,
phân nhánh tách rời và lưu trữ một luồng không liên quan, không thuộc sở hữu của
Chat OpenClaw khác, yêu cầu `allowWriteControls`. Không tùy chọn nào bỏ qua
một liên kết đã khóa.

OpenClaw không ghi lại `HOME` cho các lần khởi chạy app-server cục bộ
thông thường. Các tiến trình con do Codex chạy như `openclaw`,
`gh`, `git`, các CLI đám mây và lệnh shell
nhìn thấy thư mục home tiến trình thông thường và có thể tìm thấy cấu hình cùng token
trong thư mục home người dùng. Codex cũng có thể phát hiện `$HOME/.agents/skills` và
`$HOME/.agents/plugins/marketplace.json`; việc phát hiện `.agents` đó được chủ ý chia sẻ
với thư mục home của người vận hành và tách biệt với trạng thái
`~/.codex` được cô lập.

Trong phạm vi agent mặc định, các plugin OpenClaw và ảnh chụp Skills OpenClaw
vẫn đi qua sổ đăng ký plugin và trình tải Skills riêng của OpenClaw; các tài nguyên
`~/.codex` Codex cá nhân thì không. Nếu có các kỹ năng hoặc plugin Codex CLI
hữu ích từ một thư mục home Codex cần trở thành một phần của agent OpenClaw được cô lập,
hãy kiểm kê chúng một cách rõ ràng:

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

`appServer.clearEnv` chỉ ảnh hưởng đến tiến trình con Codex app-server được khởi chạy.
OpenClaw xóa `CODEX_HOME` và `HOME` khỏi danh sách này trong quá trình
chuẩn hóa khởi chạy cục bộ: `CODEX_HOME` tiếp tục trỏ đến phạm vi agent hoặc
người dùng đã chọn, còn `HOME` tiếp tục được kế thừa để các tiến trình con
có thể sử dụng trạng thái thư mục home người dùng thông thường.

## Công cụ động

Theo mặc định, các công cụ động Codex sử dụng cách tải `searchable`, được cung cấp
trong namespace `openclaw` với `deferLoading: true`. OpenClaw thường không
cung cấp các công cụ động trùng lặp với thao tác workspace gốc của Codex hoặc
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

Khi danh sách cho phép runtime hữu hạn vô hiệu hóa Code Mode gốc, OpenClaw gửi một
lựa chọn môi trường thực thi trống. Trong trường hợp trực tiếp, không được sandbox đó,
OpenClaw giữ lại các công cụ `exec` và `process` đã được lọc
theo chính sách làm phương án dự phòng shell. Danh sách cho phép runtime và
`codexDynamicToolsExclude` vẫn được áp dụng.

Hầu hết các công cụ tích hợp OpenClaw còn lại, chẳng hạn như nhắn tin, phương tiện, cron,
trình duyệt, node, Gateway, `heartbeat_respond` và `web_search`, đều có sẵn
thông qua tính năng tìm kiếm công cụ Codex trong namespace đó. Điều này giúp ngữ cảnh
ban đầu của mô hình nhỏ hơn. Một nhóm nhỏ công cụ vẫn có thể được gọi trực tiếp bất kể
`codexDynamicToolsLoading`, vì tính năng tìm kiếm công cụ Codex có thể không khả dụng hoặc
chỉ phân giải được một tập hợp gồm các trình kết nối: `agents_list`, `sessions_spawn` và
`sessions_yield`. Các chỉ dẫn dành cho nhà phát triển vẫn hướng các subagent Codex thông thường
đến `spawn_agent` gốc cho công việc subagent gốc của Codex, trong khi
`sessions_spawn` vẫn khả dụng cho việc ủy quyền OpenClaw hoặc ACP rõ ràng.
Các phản hồi nguồn chỉ dùng công cụ nhắn tin cũng vẫn được gửi trực tiếp, vì đó là một
hợp đồng kiểm soát lượt.

Các công cụ được đánh dấu `catalogMode: "direct-only"`, bao gồm công cụ OpenClaw `computer`,
được nhóm trong `openclaw_direct`. OpenClaw thêm namespace đó vào
danh sách `code_mode.direct_only_tool_namespaces` của Codex mà không thay thế
các mục do người vận hành cung cấp. Do đó, Codex hiển thị các công cụ đó dưới dạng
`DirectModelOnly` trong các luồng thông thường và luồng chỉ dùng chế độ mã, thay vì định tuyến chúng
qua các lệnh gọi Code Mode `tools.*` lồng nhau. Ranh giới này là bắt buộc đối với
các kết quả chứa hình ảnh: quá trình tuần tự hóa Code Mode lồng nhau làm phẳng đầu ra hình ảnh thành
văn bản, khiến ảnh chụp màn hình cần cho thao tác máy tính tiếp theo bị loại bỏ.

Chỉ đặt `codexDynamicToolsLoading: "direct"` khi kết nối với một
app-server Codex tùy chỉnh không thể tìm kiếm các công cụ động được trì hoãn hoặc khi gỡ lỗi
toàn bộ tải công cụ.

## Thời gian chờ

Các lệnh gọi công cụ động do OpenClaw sở hữu được giới hạn độc lập với
`appServer.requestTimeoutMs`. Mỗi yêu cầu Codex `item/tool/call` sử dụng
thời gian chờ khả dụng đầu tiên theo thứ tự sau:

- Đối số `timeoutMs` dương cho mỗi lệnh gọi.
- Đối với `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Đối với `image_generate` không có thời gian chờ được cấu hình, giá trị mặc định
  tạo hình ảnh là 120 giây.
- Đối với công cụ nhận hiểu phương tiện `image`, `tools.media.image.timeoutSeconds`
  được chuyển đổi thành mili giây hoặc giá trị mặc định cho phương tiện là 60 giây. Đối với
  nhận hiểu hình ảnh, giá trị này áp dụng cho chính yêu cầu và không bị giảm bởi
  công việc chuẩn bị trước đó.
- Đối với công cụ `message`, giá trị mặc định cố định là 120 giây.
- Giá trị mặc định cho công cụ động là 90 giây.

Bộ giám sát này là ngân sách `item/tool/call` động bên ngoài. Thời gian chờ yêu cầu
riêng theo nhà cung cấp chạy bên trong lệnh gọi đó và giữ nguyên ngữ nghĩa thời gian chờ riêng.
Ngân sách công cụ động được giới hạn ở 600000 ms. Khi hết thời gian chờ, OpenClaw hủy
tín hiệu công cụ nếu được hỗ trợ và trả về phản hồi công cụ động thất bại cho
Codex để lượt có thể tiếp tục thay vì để phiên ở trạng thái
`processing`.

Sau khi Codex chấp nhận một lượt và sau khi OpenClaw phản hồi một yêu cầu app-server
theo phạm vi lượt, harness kỳ vọng Codex tạo tiến triển cho lượt hiện tại
và cuối cùng hoàn tất lượt gốc bằng `turn/completed`. Nếu
app-server không có hoạt động trong `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
cố gắng ngắt lượt Codex, ghi lại chẩn đoán hết thời gian chờ và
giải phóng làn phiên OpenClaw để các tin nhắn trò chuyện tiếp theo không bị xếp hàng
sau một lượt gốc đã lỗi thời.

Hầu hết thông báo không kết thúc cho cùng một lượt đều vô hiệu hóa bộ giám sát ngắn đó
vì Codex đã chứng minh lượt vẫn đang hoạt động. Việc bàn giao công cụ sử dụng ngân sách
nhàn rỗi sau công cụ dài hơn: sau khi OpenClaw trả về phản hồi `item/tool/call`,
sau khi các mục công cụ gốc như `commandExecution` hoàn tất, sau khi các lượt hoàn tất
`custom_tool_call_output` thô, và sau tiến triển trợ lý thô sau công cụ,
lượt hoàn tất suy luận thô hoặc tiến triển suy luận. Bộ bảo vệ sử dụng
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` khi được cấu hình và
mặc định là năm phút nếu không. Ngân sách sau công cụ đó cũng kéo dài
bộ giám sát tiến triển cho khoảng tổng hợp im lặng trước khi Codex phát ra
sự kiện tiếp theo của lượt hiện tại. Các lượt hoàn tất suy luận, lượt hoàn tất
`agentMessage` trong phần bình luận, và tiến triển suy luận hoặc trợ lý thô trước công cụ
có thể được tiếp nối bằng phản hồi cuối cùng tự động, vì vậy chúng sử dụng bộ bảo vệ
phản hồi sau tiến triển thay vì giải phóng làn phiên ngay lập tức. Chỉ các mục
`agentMessage` đã hoàn tất dạng cuối cùng/không phải bình luận và các lượt hoàn tất trợ lý thô
trước công cụ mới kích hoạt việc giải phóng đầu ra trợ lý: nếu sau đó Codex
không có hoạt động mà không có `turn/completed`, OpenClaw cố gắng ngắt lượt gốc
và giải phóng làn phiên. Các lỗi app-server stdio an toàn khi phát lại, bao gồm
hết thời gian chờ nhàn rỗi khi hoàn tất lượt mà không có bằng chứng về trợ lý, công cụ,
mục đang hoạt động hoặc tác dụng phụ, được thử lại một lần trên một lần thử
app-server mới. Các trường hợp hết thời gian chờ không an toàn vẫn loại bỏ máy khách
app-server bị kẹt và giải phóng làn phiên OpenClaw. Chúng cũng
xóa liên kết luồng gốc đã lỗi thời thay vì tự động phát lại.
Các trường hợp hết thời gian chờ theo dõi hoàn tất hiển thị văn bản thời gian chờ dành riêng
cho Codex: các trường hợp an toàn khi phát lại cho biết phản hồi có thể chưa đầy đủ,
trong khi các trường hợp không an toàn yêu cầu người dùng xác minh trạng thái hiện tại trước khi thử lại.
Chẩn đoán thời gian chờ công khai bao gồm các trường cấu trúc như phương thức thông báo
app-server gần nhất, id/loại/vai trò của mục phản hồi trợ lý thô, số lượng yêu cầu/mục
đang hoạt động và trạng thái theo dõi đã kích hoạt. Khi thông báo cuối cùng là một mục
phản hồi trợ lý thô, chúng cũng bao gồm bản xem trước văn bản trợ lý có giới hạn.
Chúng không bao gồm nội dung prompt hoặc công cụ thô.

## Khám phá mô hình

Theo mặc định, Plugin Codex yêu cầu app-server cung cấp các mô hình khả dụng. Tính khả dụng
của mô hình do app-server Codex sở hữu, vì vậy danh sách có thể thay đổi khi
OpenClaw nâng cấp phiên bản `@openai/codex` đi kèm hoặc khi một triển khai
trỏ `appServer.command` đến một tệp nhị phân Codex khác. Tính khả dụng cũng có thể
được giới hạn theo tài khoản. Sử dụng `/codex models` trên một Gateway đang chạy để xem
danh mục trực tiếp cho harness và tài khoản đó.

Nếu quá trình khám phá thất bại hoặc hết thời gian chờ, OpenClaw sử dụng danh mục dự phòng đi kèm:

| ID mô hình       | Tên hiển thị | Mức độ suy luận           |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | thấp, trung bình, cao, rất cao |
| `gpt-5.4-mini` | GPT-5.4-Mini | thấp, trung bình, cao, rất cao |

<Note>
Harness đi kèm hiện tại là `@openai/codex` `0.144.6`. Một phép thăm dò `model/list`
đối với app-server đi kèm đó đã trả về các hàng bộ chọn công khai sau:

| ID mô hình        | Phương thức đầu vào | Mức độ suy luận                         |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | văn bản, hình ảnh      | thấp, trung bình, cao, rất cao, tối đa, cực cao |
| `gpt-5.6-terra` | văn bản, hình ảnh      | thấp, trung bình, cao, rất cao, tối đa, cực cao |
| `gpt-5.6-luna`  | văn bản, hình ảnh      | thấp, trung bình, cao, rất cao, tối đa        |
| `gpt-5.5`       | văn bản, hình ảnh      | thấp, trung bình, cao, rất cao             |
| `gpt-5.4`       | văn bản, hình ảnh      | thấp, trung bình, cao, rất cao             |
| `gpt-5.4-mini`  | văn bản, hình ảnh      | thấp, trung bình, cao, rất cao             |
| `gpt-5.2`       | văn bản, hình ảnh      | thấp, trung bình, cao, rất cao             |

Danh mục app-server có thể báo cáo `ultra`; các điều khiển suy luận của OpenClaw
hiện hiển thị các mức đến `max`.

Các hàng bộ chọn trực tiếp được giới hạn theo tài khoản và có thể thay đổi theo tài khoản,
danh mục Codex hoặc phiên bản đi kèm; hãy chạy `/codex models` để lấy danh sách hiện tại
thay vì dựa vào bất kỳ bảng tại một thời điểm cụ thể nào. Các mô hình ẩn cũng có thể xuất hiện trong
danh mục app-server cho các luồng nội bộ hoặc chuyên biệt mà không phải là
lựa chọn thông thường trong bộ chọn mô hình.
</Note>

Điều chỉnh quá trình khám phá trong `plugins.entries.codex.config.discovery`:

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

Tắt quá trình khám phá khi bạn muốn quá trình khởi động tránh thăm dò Codex và chỉ sử dụng
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

Codex tự xử lý `AGENTS.md` thông qua tính năng khám phá tài liệu dự án gốc.
OpenClaw không ghi các tệp tài liệu dự án Codex tổng hợp hoặc phụ thuộc vào
tên tệp dự phòng của Codex cho các tệp persona, vì các phương án dự phòng Codex chỉ áp dụng khi
`AGENTS.md` bị thiếu.

Để đảm bảo tính tương đương của workspace OpenClaw, harness Codex chuyển tiếp các
tệp khởi tạo khác dưới dạng chỉ dẫn dành cho nhà phát triển, nhưng không hoàn toàn giống nhau:

- `TOOLS.md` được chuyển tiếp dưới dạng chỉ dẫn nhà phát triển Codex **được kế thừa**, vì vậy
  các subagent Codex gốc được tạo trong lượt cũng nhìn thấy nó.
- `SOUL.md`, `IDENTITY.md` và `USER.md` được chuyển tiếp dưới dạng chỉ dẫn cộng tác
  **theo phạm vi lượt**. Các subagent Codex gốc không kế thừa chúng,
  nhờ đó các lượt subagent không nhận persona và hồ sơ người dùng của tác nhân cha.
- Danh sách Skills OpenClaw đã nạp ở dạng rút gọn cũng được chuyển tiếp dưới dạng
  chỉ dẫn nhà phát triển cộng tác theo phạm vi lượt, vì vậy các subagent Codex gốc
  cũng không kế thừa danh sách đó.
- Nội dung `HEARTBEAT.md` không được chèn; các lượt Heartbeat nhận được một
  con trỏ ở chế độ cộng tác để đọc tệp khi tệp tồn tại và không rỗng.
- Nội dung `MEMORY.md` từ workspace của tác nhân đã cấu hình không được dán vào
  đầu vào lượt Codex gốc khi các công cụ bộ nhớ khả dụng cho
  workspace đó; khi nội dung này tồn tại, harness thêm một con trỏ bộ nhớ workspace
  nhỏ vào chỉ dẫn nhà phát triển cộng tác theo phạm vi lượt và Codex
  nên sử dụng `memory_search` hoặc `memory_get` khi bộ nhớ bền vững có liên quan.
  Nếu các công cụ bị tắt, tìm kiếm bộ nhớ không khả dụng hoặc workspace đang hoạt động
  khác với workspace bộ nhớ của tác nhân, `MEMORY.md` sử dụng
  đường dẫn ngữ cảnh lượt có giới hạn thông thường.
- Khi có, `BOOTSTRAP.md` được chuyển tiếp dưới dạng ngữ cảnh tham chiếu đầu vào lượt
  của OpenClaw.

## Ghi đè môi trường

Các ghi đè môi trường vẫn khả dụng cho việc kiểm thử cục bộ:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bỏ qua tệp nhị phân được quản lý khi
`appServer.command` chưa được đặt.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` đã bị xóa. Thay vào đó, hãy sử dụng
`plugins.entries.codex.config.appServer.mode: "guardian"` hoặc
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` để kiểm thử cục bộ một lần. Cấu hình
được ưu tiên cho các triển khai có thể lặp lại vì nó giữ hành vi của Plugin trong
cùng tệp đã được review với phần còn lại của thiết lập harness Codex.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Giám sát Codex](/plugins/codex-supervision)
- [Plugin Codex gốc](/vi/plugins/codex-native-plugins)
- [Sử dụng máy tính Codex](/vi/plugins/codex-computer-use)
- [Nhà cung cấp OpenAI](/vi/providers/openai)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
