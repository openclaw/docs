---
read_when:
    - Bạn muốn các agent OpenClaw ở chế độ Codex sử dụng Codex Computer Use
    - Bạn đang cân nhắc giữa Codex Computer Use, PeekabooBridge và MCP cua-driver trực tiếp
    - Bạn đang cấu hình computerUse cho Plugin Codex đi kèm
    - Bạn đang khắc phục sự cố về trạng thái hoặc quá trình cài đặt tính năng sử dụng máy tính của /codex
summary: Thiết lập Codex Computer Use cho các tác nhân OpenClaw ở chế độ Codex
title: Khả năng sử dụng máy tính của Codex
x-i18n:
    generated_at: "2026-07-12T08:06:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use là một Plugin MCP gốc Codex để điều khiển máy tính cục bộ. OpenClaw
không đóng gói ứng dụng máy tính, không tự thực thi các thao tác trên máy tính và
không bỏ qua các quyền của Codex. Plugin `codex` đi kèm chỉ chuẩn bị app-server
Codex: nó bật hỗ trợ Plugin Codex, tìm hoặc cài đặt Plugin Computer Use đã cấu
hình, kiểm tra xem máy chủ MCP `computer-use` có khả dụng hay không, rồi để Codex
sở hữu các lệnh gọi công cụ MCP gốc trong các lượt ở chế độ Codex.

Sử dụng trang này khi OpenClaw đã dùng bộ điều phối Codex gốc. Để thiết lập
runtime, xem [bộ điều phối Codex](/vi/plugins/codex-harness).

Điều này khác với [công cụ máy tính dựa trên Node](/vi/nodes/computer-use) tích hợp
sẵn của OpenClaw. Sử dụng công cụ tích hợp sẵn khi cùng một hợp đồng tác nhân cần
điều khiển máy Mac đã ghép đôi, bất kể tác nhân chạy trên Gateway hay một Node
khác. Sử dụng Codex Computer Use khi app-server Codex cần sở hữu việc cài đặt MCP
cục bộ, các quyền và các lệnh gọi công cụ gốc.

## OpenClaw.app và Peekaboo

Tích hợp Peekaboo của OpenClaw.app tách biệt với Codex Computer Use. Ứng dụng
macOS có thể lưu trữ một socket PeekabooBridge để CLI `peekaboo` có thể tái sử
dụng các quyền Trợ năng và Ghi màn hình cục bộ của ứng dụng cho các công cụ tự
động hóa riêng của Peekaboo. Cầu nối đó không cài đặt hay làm proxy cho Codex
Computer Use, và Codex Computer Use không gọi thông qua socket PeekabooBridge.

Sử dụng [cầu nối Peekaboo](/vi/platforms/mac/peekaboo) khi bạn muốn OpenClaw.app
đóng vai trò máy chủ nhận biết quyền cho hoạt động tự động hóa bằng CLI Peekaboo.
Sử dụng trang này khi một tác nhân OpenClaw ở chế độ Codex cần có sẵn Plugin MCP
`computer-use` gốc của Codex trước khi lượt bắt đầu.

## Ứng dụng iOS

Ứng dụng iOS tách biệt với Codex Computer Use. Ứng dụng này không cài đặt hay làm
proxy cho máy chủ MCP `computer-use` của Codex và không phải là backend điều khiển
máy tính. Thay vào đó, ứng dụng iOS kết nối dưới dạng một Node OpenClaw và cung
cấp các khả năng di động thông qua các lệnh Node như `canvas.*`, `camera.*`,
`screen.*`, `location.*` và `talk.*`.

Sử dụng [iOS](/vi/platforms/ios) khi bạn muốn một tác nhân điều khiển Node iPhone
thông qua Gateway. Sử dụng trang này khi một tác nhân ở chế độ Codex cần điều
khiển máy tính macOS cục bộ thông qua Plugin Computer Use gốc của Codex.

## MCP cua-driver trực tiếp

Codex Computer Use không phải là cách duy nhất để cung cấp khả năng điều khiển
máy tính. Nếu bạn muốn các runtime do OpenClaw quản lý gọi trực tiếp trình điều
khiển của TryCua, hãy sử dụng máy chủ `cua-driver mcp` từ dự án thượng nguồn
thông qua sổ đăng ký MCP của OpenClaw thay vì quy trình marketplace dành riêng
cho Codex.

Sau khi cài đặt `cua-driver`, hãy yêu cầu nó cung cấp lệnh OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

hoặc đăng ký trực tiếp máy chủ stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Lộ trình đó giữ nguyên bề mặt công cụ MCP thượng nguồn, bao gồm các schema của
trình điều khiển và phản hồi MCP có cấu trúc. Sử dụng lộ trình này khi bạn muốn
trình điều khiển CUA khả dụng dưới dạng một máy chủ MCP OpenClaw thông thường.
Sử dụng thiết lập Codex Computer Use trên trang này khi app-server Codex cần sở
hữu việc cài đặt Plugin, tải lại máy chủ MCP và các lệnh gọi công cụ gốc bên trong
các lượt ở chế độ Codex.

Trình điều khiển của CUA chỉ dành cho macOS và vẫn yêu cầu các quyền macOS cục bộ
mà ứng dụng nhắc cấp, chẳng hạn như Trợ năng và Ghi màn hình. OpenClaw không cài
đặt `cua-driver`, không cấp các quyền đó và không bỏ qua mô hình an toàn của trình
điều khiển thượng nguồn.

## Thiết lập nhanh

Đặt `plugins.entries.codex.config.computerUse` khi các lượt ở chế độ Codex bắt
buộc phải có Computer Use trước khi một luồng bắt đầu. `autoInstall: true` bật
Computer Use và cho phép OpenClaw cài đặt hoặc bật lại nó trước lượt:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Với cấu hình này, OpenClaw kiểm tra app-server Codex trước mỗi lượt ở chế độ
Codex. Nếu thiếu Computer Use nhưng app-server Codex đã phát hiện một marketplace
có thể cài đặt, OpenClaw yêu cầu app-server Codex cài đặt hoặc bật lại Plugin và
tải lại các máy chủ MCP. Trên macOS, khi chưa đăng ký marketplace phù hợp nào và
có một gói ứng dụng máy tính tiêu chuẩn, OpenClaw cũng cố gắng đăng ký marketplace
Codex đi kèm từ
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, đồng thời
giữ lại
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` làm phương án
dự phòng cho các bản cài đặt độc lập cũ. Nếu quá trình thiết lập vẫn không thể
làm cho máy chủ MCP khả dụng, lượt sẽ thất bại trước khi luồng bắt đầu.

Sau khi thay đổi cấu hình Computer Use, hãy sử dụng `/new` hoặc `/reset` trong
cuộc trò chuyện bị ảnh hưởng trước khi kiểm thử nếu một luồng Codex hiện có đã
bắt đầu.

Trên macOS, quy trình khởi động được quản lý cho Computer Use ưu tiên tệp nhị phân
của ứng dụng máy tính tại
`/Applications/ChatGPT.app/Contents/Resources/codex`, sau đó chuyển sang
`/Applications/Codex.app/Contents/Resources/codex` cho các bản cài đặt độc lập
cũ. Điều này cũng áp dụng cho các lệnh kiểm tra trạng thái và cài đặt Computer Use
một lần tự khởi chạy máy khách riêng. Cách này giữ việc điều khiển máy tính dưới
gói ứng dụng sở hữu các quyền macOS cục bộ. Nếu ứng dụng máy tính chưa được cài
đặt, OpenClaw chuyển sang tệp nhị phân Codex được quản lý đã cài đặt bên cạnh
Plugin. Các lượt Codex được quản lý thông thường với thư mục chính tác nhân cô
lập mặc định ưu tiên gói đã ghim đó trước để ứng dụng máy tính cũ không thể che
khuất khả năng hỗ trợ mô hình hiện tại. Các thư mục chính theo phạm vi người dùng
vẫn ưu tiên ứng dụng máy tính vì chúng có thể tải trạng thái Computer Use gốc.
Một thư mục chính tác nhân cô lập có cấu hình Codex hiệu lực bật Computer Use
cũng vẫn ưu tiên ứng dụng máy tính. Cấu hình `appServer.command` rõ ràng hoặc
`OPENCLAW_CODEX_APP_SERVER_BIN` vẫn ghi đè lựa chọn được quản lý này.

OpenClaw tuần tự hóa các lần đọc cấu hình Codex gốc và việc cài đặt Computer Use
trong một Gateway đang chạy. Một tiến trình Codex riêng biệt hoặc một Gateway
khác không nằm trong hàng rào đó. Sau khi thay đổi cấu hình Plugin Codex gốc bên
ngoài Gateway, hãy khởi động lại Gateway và bắt đầu một cuộc trò chuyện mới trước
khi dựa vào lựa chọn mới.

## Lệnh

Sử dụng các lệnh `/codex computer-use` từ bất kỳ bề mặt trò chuyện nào có bề mặt
lệnh của Plugin `codex`. Đây là các lệnh trò chuyện/runtime của OpenClaw, không
phải các lệnh con CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` là thao tác mặc định và chỉ đọc: thao tác này không thêm nguồn
marketplace, không cài đặt Plugin và không bật hỗ trợ Plugin Codex. Nếu không có
cấu hình nào bật Computer Use, `status` có thể báo là đã tắt ngay cả sau một lệnh
cài đặt một lần.

`install` bật hỗ trợ Plugin của app-server Codex, tùy chọn thêm một nguồn
marketplace đã cấu hình, cài đặt hoặc bật lại Plugin đã cấu hình thông qua
app-server Codex, tải lại các máy chủ MCP và xác minh rằng máy chủ MCP cung cấp
các công cụ. Vì việc cài đặt thay đổi các tài nguyên máy chủ đáng tin cậy, chỉ
chủ sở hữu hoặc máy khách Gateway `operator.admin` mới có thể chạy `install`.
Những người gửi được ủy quyền khác vẫn có thể tiếp tục sử dụng lệnh `status` chỉ
đọc, kể cả khi có các giá trị ghi đè.

Các bản phát hành cũ chấp nhận các giá trị ghi đè danh tính dùng một lần
`--plugin`, `--server` và `--mcp-server`. Thay vào đó, hãy cấu hình lâu dài
`computerUse.pluginName` và `computerUse.mcpServerName`. Khi sử dụng một cờ danh
tính cũ, lệnh sẽ xác định chính xác thiết lập cần lưu lâu dài và lặp lại thao tác
được yêu cầu cùng mọi cờ marketplace được hỗ trợ trong hướng dẫn di chuyển.

## Các lựa chọn marketplace

OpenClaw sử dụng cùng API app-server mà chính Codex cung cấp. Các trường
marketplace chọn nơi Codex cần tìm `computer-use`.

| Trường                | Sử dụng khi                                                        | Hỗ trợ cài đặt                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Không có trường marketplace | Bạn muốn app-server Codex sử dụng các marketplace mà nó đã biết. | Có, khi app-server trả về một marketplace cục bộ.        |
| `marketplaceSource`  | Bạn có một nguồn marketplace Codex mà app-server có thể thêm.         | Có, cho lệnh `/codex computer-use install` rõ ràng.         |
| `marketplacePath`    | Bạn đã biết đường dẫn tệp marketplace cục bộ trên máy chủ.   | Có, cho cài đặt rõ ràng và tự động cài đặt khi bắt đầu lượt.   |
| `marketplaceName`    | Bạn muốn chọn một marketplace đã đăng ký theo tên.  | Chỉ có khi marketplace đã chọn có đường dẫn cục bộ. |

Các thư mục chính Codex mới có thể cần một khoảng thời gian ngắn để khởi tạo các
marketplace chính thức. Trong quá trình cài đặt, OpenClaw thăm dò `plugin/list`
trong tối đa `marketplaceDiscoveryTimeoutMs` mili giây (mặc định 60 giây).

Nếu nhiều marketplace đã biết có chứa Computer Use, OpenClaw ưu tiên
`openai-bundled`, sau đó là `openai-curated`, rồi `local`. Các kết quả khớp không
xác định và mơ hồ sẽ thất bại theo hướng an toàn và yêu cầu bạn đặt
`marketplaceName` hoặc `marketplacePath`.

## Marketplace macOS đi kèm

Các bản dựng ChatGPT cho máy tính hiện tại đóng gói Computer Use tại đây; các bản
dựng Codex độc lập cũ sử dụng cùng bố cục bên dưới `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Khi `computerUse.autoInstall` là true và chưa đăng ký marketplace nào chứa
`computer-use`, OpenClaw cố gắng thêm thư mục gốc marketplace đi kèm tiêu chuẩn
đầu tiên tồn tại:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bạn cũng có thể đăng ký rõ ràng từ shell bằng Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Nếu bạn sử dụng đường dẫn ứng dụng Codex không tiêu chuẩn, hãy chạy `/codex
computer-use install --source <marketplace-root>` một lần hoặc đặt
`computerUse.marketplacePath` thành đường dẫn tệp marketplace cục bộ. Chỉ sử dụng
`--marketplace-path` khi bạn có đường dẫn tệp JSON marketplace, không phải thư mục
gốc marketplace đi kèm.

### Bộ nhớ đệm Plugin dùng chung

Giá trị mặc định `pluginCacheMode: "independent"` để mỗi thư mục chính Codex và
bộ nhớ đệm Plugin của nó không được quản lý. Đặt `pluginCacheMode: "shared"` để
sao chép Plugin Computer Use đi kèm vào bộ nhớ đệm Plugin mà thư mục chính Codex
đang hoạt động có thể phát hiện trước khi app-server khởi động. Chế độ dùng chung
giữ lại các phiên bản cũ trong bộ nhớ đệm vì các máy khách Codex đang chạy vẫn có
thể tham chiếu đến các thư mục Plugin được đánh phiên bản; một lần sao chép thay
thế thất bại cũng giữ nguyên bộ nhớ đệm đang hoạt động. Cấu hình
`marketplaceName` hoặc `marketplacePath` rõ ràng sẽ tắt quá trình đối soát này để
OpenClaw không ghi đè lựa chọn đó.

## Giới hạn danh mục từ xa

App-server Codex có thể liệt kê và đọc các mục danh mục chỉ có từ xa, nhưng hiện
không hỗ trợ `plugin/install` từ xa. Điều đó có nghĩa là `marketplaceName` có thể
chọn một marketplace chỉ có từ xa để kiểm tra trạng thái, nhưng việc cài đặt và
bật lại vẫn cần một marketplace cục bộ thông qua `marketplaceSource` hoặc
`marketplacePath`.

Nếu trạng thái cho biết Plugin khả dụng trong một marketplace Codex từ xa nhưng
không hỗ trợ cài đặt từ xa, hãy chạy cài đặt với một nguồn hoặc đường dẫn cục bộ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Tham chiếu cấu hình

| Trường                          | Mặc định       | Ý nghĩa                                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `enabled`                       | suy luận       | Yêu cầu Computer Use. Mặc định là true khi một trường Computer Use khác được đặt.                 |
| `autoInstall`                   | false          | Cài đặt hoặc bật lại từ các marketplace đã được phát hiện khi bắt đầu lượt.                       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Thời gian chờ Codex app-server phát hiện marketplace trong khi cài đặt.                            |
| `liveTestTimeoutMs`             | 60000          | Thời gian chờ cho luồng kiểm tra mức sẵn sàng tạm thời và các yêu cầu dọn dẹp của luồng đó.        |
| `toolCallTimeoutMs`             | 60000          | Thời gian chờ cho lệnh gọi công cụ kiểm tra mức sẵn sàng `list_apps` của Computer Use.            |
| `healthCheckEnabled`            | false          | Chạy các phép thăm dò mức sẵn sàng định kỳ khi máy khách app-server sở hữu đang hoạt động.         |
| `healthCheckIntervalMinutes`    | 60             | Chu kỳ thăm dò; các giá trị được chấp nhận là 30, 60, 120 hoặc 240 phút.                           |
| `pluginCacheMode`               | `independent`  | Dùng `shared` để làm mới bộ nhớ đệm Codex-home từ plugin máy tính để bàn đi kèm.                   |
| `strictReadiness`               | false          | Dừng khởi động khi phép thăm dò trực tiếp thất bại thay vì tiếp tục với cảnh báo.                  |
| `autoRepair`                    | false          | Kết thúc các tiến trình con MCP Computer Use cũ trong phạm vi và thử lại phép thăm dò thất bại một lần. |
| `marketplaceSource`             | chưa đặt       | Chuỗi nguồn được truyền tới `marketplace/add` của Codex app-server.                               |
| `marketplacePath`               | chưa đặt       | Đường dẫn tệp marketplace Codex cục bộ chứa plugin.                                               |
| `marketplaceName`               | chưa đặt       | Tên marketplace Codex đã đăng ký để chọn.                                                        |
| `pluginName`                    | `computer-use` | Tên plugin trong marketplace Codex.                                                               |
| `mcpServerName`                 | `computer-use` | Tên máy chủ MCP do plugin đã cài đặt cung cấp.                                                    |

Tính năng tự động cài đặt khi bắt đầu lượt chủ đích từ chối các giá trị
`marketplaceSource` đã cấu hình. Việc thêm nguồn mới là một thao tác thiết lập
tường minh, vì vậy hãy dùng
`/codex computer-use install --source <marketplace-source>` một lần, sau đó để
`autoInstall` xử lý việc bật lại trong tương lai từ các marketplace cục bộ đã
được phát hiện. Tính năng tự động cài đặt khi bắt đầu lượt có thể dùng
`marketplacePath` đã cấu hình vì đó vốn là đường dẫn cục bộ trên máy chủ.

Mỗi trường cũng chấp nhận một biến môi trường ghi đè, được kiểm tra khi khóa
cấu hình tương ứng chưa được đặt:

| Trường                          | Biến môi trường                                                |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## Những gì OpenClaw kiểm tra

OpenClaw báo cáo nội bộ một lý do thiết lập ổn định và định dạng trạng thái
hiển thị cho người dùng trong cuộc trò chuyện:

| Lý do                       | Ý nghĩa                                                        | Bước tiếp theo                                      |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| `disabled`                  | `computerUse.enabled` được phân giải thành false.              | Đặt `enabled` hoặc một trường Computer Use khác.   |
| `marketplace_missing`       | Không có marketplace phù hợp nào khả dụng.                     | Cấu hình nguồn, đường dẫn hoặc tên marketplace.     |
| `plugin_not_installed`      | Marketplace tồn tại nhưng plugin chưa được cài đặt.            | Chạy cài đặt hoặc bật `autoInstall`.                |
| `plugin_disabled`           | Plugin đã được cài đặt nhưng bị tắt trong cấu hình Codex.      | Chạy cài đặt để bật lại.                            |
| `remote_install_unsupported`| Marketplace đã chọn chỉ có từ xa.                              | Dùng `marketplaceSource` hoặc `marketplacePath`.    |
| `mcp_missing`               | Plugin đã bật nhưng máy chủ MCP không khả dụng.                | Kiểm tra Codex Computer Use và quyền của hệ điều hành. |
| `ready`                     | Plugin và các công cụ MCP đều khả dụng.                        | Bắt đầu lượt ở chế độ Codex.                        |
| `check_failed`              | Một yêu cầu Codex app-server thất bại khi kiểm tra trạng thái. | Kiểm tra kết nối app-server và nhật ký.             |
| `auto_install_blocked`      | Thiết lập khi bắt đầu lượt cần thêm một nguồn mới.             | Trước tiên hãy chạy cài đặt tường minh.             |

Đầu ra trò chuyện bao gồm trạng thái plugin, trạng thái máy chủ MCP,
marketplace, các công cụ khi khả dụng và thông báo cụ thể cho bước thiết lập
thất bại.

## Quyền trên macOS

Computer Use chỉ dành cho macOS. Máy chủ MCP do Codex sở hữu có thể cần các
quyền cục bộ của hệ điều hành trước khi có thể kiểm tra hoặc điều khiển ứng
dụng. Nếu OpenClaw cho biết Computer Use đã được cài đặt nhưng máy chủ MCP
không khả dụng, trước tiên hãy xác minh thiết lập Computer Use phía Codex:

- Codex app-server đang chạy trên cùng máy chủ nơi việc điều khiển máy tính để
  bàn sẽ diễn ra.
- Plugin Computer Use được bật trong cấu hình Codex.
- Máy chủ MCP `computer-use` xuất hiện trong trạng thái MCP của Codex app-server.
- macOS đã cấp các quyền cần thiết cho ứng dụng điều khiển máy tính để bàn.
- Phiên hiện tại trên máy chủ có thể truy cập màn hình đang được điều khiển.

OpenClaw chủ đích dừng an toàn khi `computerUse.enabled` là true. Một lượt ở
chế độ Codex không được âm thầm tiếp tục nếu thiếu các công cụ máy tính để bàn
gốc mà cấu hình yêu cầu.

## Khắc phục sự cố

**Trạng thái cho biết chưa được cài đặt.** Chạy `/codex computer-use install`.
Nếu marketplace không được phát hiện, hãy truyền `--source` hoặc
`--marketplace-path`.

**Trạng thái cho biết đã cài đặt nhưng bị tắt.** Chạy lại
`/codex computer-use install`. Thao tác cài đặt của Codex app-server sẽ ghi
lại cấu hình plugin ở trạng thái bật.

**Trạng thái cho biết không hỗ trợ cài đặt từ xa.** Dùng nguồn hoặc đường dẫn
marketplace cục bộ. Có thể kiểm tra các mục danh mục chỉ có từ xa nhưng không
thể cài đặt chúng thông qua API app-server hiện tại.

**Trạng thái cho biết máy chủ MCP không khả dụng.** Chạy lại cài đặt một lần
để các máy chủ MCP tải lại. Nếu máy chủ vẫn không khả dụng, hãy sửa ứng dụng
Codex Computer Use, trạng thái MCP của Codex app-server hoặc quyền trên macOS.

**Trạng thái hoặc phép thăm dò hết thời gian chờ tại
`computer-use.list_apps`.** Plugin và máy chủ MCP hiện diện nhưng cầu nối
Computer Use cục bộ không phản hồi. Thoát hoặc khởi động lại Codex Computer
Use, khởi chạy lại Codex Desktop nếu cần, rồi thử lại trong một phiên OpenClaw
mới. Nếu trước đây máy chủ đã chạy Computer Use thông qua một Codex app-server
được quản lý cũ hơn, hãy làm mới plugin đã cài đặt từ marketplace đi kèm ứng
dụng máy tính để bàn (dùng đường dẫn `Codex.app` cho các bản cài đặt Codex
Desktop độc lập):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Một công cụ Computer Use báo `Native hook relay unavailable`.** Hook công
cụ gốc của Codex không thể kết nối tới một bộ chuyển tiếp OpenClaw đang hoạt
động thông qua cầu nối cục bộ hoặc phương án dự phòng Gateway. Bắt đầu một
phiên OpenClaw mới bằng `/new` hoặc `/reset`. Nếu công cụ hoạt động một lần
rồi lại thất bại ở lần gọi công cụ sau, `/new` chỉ xóa lần thử hiện tại; hãy
khởi động lại Codex app-server hoặc OpenClaw Gateway để loại bỏ các luồng và
đăng ký hook cũ, sau đó thử lại trong một phiên mới.

**Tính năng tự động cài đặt khi bắt đầu lượt từ chối một nguồn.** Đây là chủ
đích. Trước tiên hãy thêm nguồn bằng lệnh tường minh
`/codex computer-use install --source <marketplace-source>`, sau đó tính năng
tự động cài đặt khi bắt đầu các lượt sau có thể dùng marketplace cục bộ đã
được phát hiện.

## Liên quan

- [Bộ khung Codex](/vi/plugins/codex-harness)
- [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)
- [Ứng dụng iOS](/vi/platforms/ios)
