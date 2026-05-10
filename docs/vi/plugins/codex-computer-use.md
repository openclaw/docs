---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng Codex Computer Use
    - Bạn đang lựa chọn giữa Codex Computer Use, PeekabooBridge và cua-driver MCP trực tiếp
    - Bạn đang quyết định giữa Codex Computer Use và một thiết lập MCP cua-driver trực tiếp
    - Bạn đang cấu hình computerUse cho Plugin Codex đi kèm
    - Bạn đang khắc phục sự cố trạng thái hoặc cài đặt /codex computer-use
summary: Thiết lập Codex Computer Use cho các agent OpenClaw ở chế độ Codex
title: Sử dụng máy tính của Codex
x-i18n:
    generated_at: "2026-05-10T19:41:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Sử dụng máy tính là một Plugin MCP gốc của Codex để điều khiển máy tính cục bộ. OpenClaw
không nhúng sẵn ứng dụng máy tính, không tự thực thi thao tác trên máy tính, hoặc bỏ qua
quyền của Codex. Plugin `codex` đi kèm chỉ chuẩn bị Codex app-server:
nó bật hỗ trợ Plugin của Codex, tìm hoặc cài đặt Plugin Sử dụng máy tính Codex
đã cấu hình, kiểm tra rằng MCP server `computer-use` khả dụng, và
sau đó để Codex sở hữu các lệnh gọi công cụ MCP gốc trong các lượt ở chế độ Codex.

Dùng trang này khi OpenClaw đã sử dụng harness Codex gốc. Với phần
thiết lập runtime, xem [harness Codex](/vi/plugins/codex-harness).

## OpenClaw.app và Peekaboo

Tích hợp Peekaboo của OpenClaw.app tách biệt với Sử dụng máy tính Codex. Ứng dụng
macOS có thể lưu trữ socket PeekabooBridge để CLI `peekaboo` có thể tái sử dụng
các quyền Accessibility và Screen Recording cục bộ của ứng dụng cho các
công cụ tự động hóa riêng của Peekaboo. Bridge đó không cài đặt hoặc proxy Sử dụng máy tính Codex, và
Sử dụng máy tính Codex không gọi thông qua socket PeekabooBridge.

Dùng [Peekaboo bridge](/vi/platforms/mac/peekaboo) khi bạn muốn OpenClaw.app là
máy chủ nhận biết quyền cho tự động hóa Peekaboo CLI. Dùng trang này khi một
agent OpenClaw ở chế độ Codex cần Plugin MCP `computer-use` gốc của Codex
khả dụng trước khi lượt bắt đầu.

## Ứng dụng iOS

Ứng dụng iOS tách biệt với Sử dụng máy tính Codex. Nó không cài đặt hoặc proxy
MCP server `computer-use` của Codex và không phải là backend điều khiển máy tính.
Thay vào đó, ứng dụng iOS kết nối như một node OpenClaw và cung cấp các
khả năng di động thông qua những lệnh node như `canvas.*`, `camera.*`, `screen.*`,
`location.*`, và `talk.*`.

Dùng [iOS](/vi/platforms/ios) khi bạn muốn một agent điều khiển node iPhone thông qua
Gateway. Dùng trang này khi một agent ở chế độ Codex cần điều khiển máy tính
macOS cục bộ thông qua Plugin Sử dụng máy tính gốc của Codex.

## MCP cua-driver trực tiếp

Sử dụng máy tính Codex không phải là cách duy nhất để cung cấp điều khiển máy tính. Nếu bạn muốn
các runtime do OpenClaw quản lý gọi trực tiếp driver của TryCua, hãy dùng
MCP server `cua-driver mcp` upstream thông qua registry MCP của OpenClaw thay vì
luồng marketplace dành riêng cho Codex.

Sau khi cài đặt `cua-driver`, hãy yêu cầu nó cung cấp lệnh OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

hoặc tự đăng ký stdio server:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Đường dẫn đó giữ nguyên bề mặt công cụ MCP upstream, bao gồm các schema driver
và phản hồi MCP có cấu trúc. Dùng nó khi bạn muốn driver CUA
khả dụng như một MCP server OpenClaw thông thường. Dùng thiết lập Sử dụng máy tính Codex trên
trang này khi Codex app-server nên sở hữu việc cài đặt Plugin, tải lại MCP,
và các lệnh gọi công cụ gốc bên trong các lượt ở chế độ Codex.

Driver của CUA chỉ dành cho macOS và vẫn yêu cầu các quyền macOS cục bộ
mà ứng dụng của nó nhắc cấp, chẳng hạn như Accessibility và Screen Recording. OpenClaw
không cài đặt `cua-driver`, cấp các quyền đó, hoặc bỏ qua mô hình an toàn
của driver upstream.

## Thiết lập nhanh

Đặt `plugins.entries.codex.config.computerUse` khi các lượt ở chế độ Codex phải có
Sử dụng máy tính khả dụng trước khi một thread bắt đầu:

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
      model: "openai/gpt-5.5",
    },
  },
}
```

Với cấu hình này, OpenClaw kiểm tra Codex app-server trước mỗi lượt ở chế độ Codex.
Nếu thiếu Sử dụng máy tính nhưng Codex app-server đã phát hiện một
marketplace có thể cài đặt, OpenClaw yêu cầu Codex app-server cài đặt hoặc bật lại
Plugin và tải lại MCP server. Trên macOS, khi chưa đăng ký marketplace khớp nào
và gói ứng dụng Codex tiêu chuẩn tồn tại, OpenClaw cũng thử
đăng ký marketplace Codex đi kèm từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` trước khi
thất bại. Nếu thiết lập vẫn không thể làm MCP server khả dụng, lượt sẽ thất bại
trước khi thread bắt đầu.

Sau khi thay đổi cấu hình Sử dụng máy tính, hãy dùng `/new` hoặc `/reset` trong chat
bị ảnh hưởng trước khi kiểm thử nếu một thread Codex hiện có đã bắt đầu.

## Lệnh

Dùng các lệnh `/codex computer-use` từ bất kỳ bề mặt chat nào có bề mặt lệnh Plugin
`codex` khả dụng. Đây là các lệnh chat/runtime của OpenClaw,
không phải lệnh con CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` chỉ đọc. Nó không thêm nguồn marketplace, cài đặt Plugin, hoặc
bật hỗ trợ Plugin của Codex.

`install` bật hỗ trợ Plugin của Codex app-server, tùy chọn thêm một
nguồn marketplace đã cấu hình, cài đặt hoặc bật lại Plugin đã cấu hình thông qua Codex
app-server, tải lại MCP server, và xác minh rằng MCP server cung cấp công cụ.

## Lựa chọn marketplace

OpenClaw dùng cùng API app-server mà chính Codex cung cấp. Các trường
marketplace chọn nơi Codex nên tìm `computer-use`.

| Trường               | Dùng khi                                                         | Hỗ trợ cài đặt                                           |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Không có trường marketplace | Bạn muốn Codex app-server dùng các marketplace mà nó đã biết. | Có, khi app-server trả về một marketplace cục bộ.        |
| `marketplaceSource`  | Bạn có một nguồn marketplace Codex mà app-server có thể thêm.   | Có, cho `/codex computer-use install` tường minh.        |
| `marketplacePath`    | Bạn đã biết đường dẫn tệp marketplace cục bộ trên máy chủ.      | Có, cho cài đặt tường minh và tự động cài đặt lúc bắt đầu lượt. |
| `marketplaceName`    | Bạn muốn chọn một marketplace đã đăng ký theo tên.              | Chỉ có khi marketplace đã chọn có đường dẫn cục bộ.      |

Các home Codex mới có thể cần một lúc ngắn để khởi tạo các marketplace chính thức.
Trong quá trình cài đặt, OpenClaw thăm dò `plugin/list` tối đa
`marketplaceDiscoveryTimeoutMs` mili giây. Mặc định là 60 giây.

Nếu nhiều marketplace đã biết chứa Sử dụng máy tính, OpenClaw ưu tiên
`openai-bundled`, sau đó `openai-curated`, rồi `local`. Các kết quả khớp không xác định
gây mơ hồ sẽ thất bại đóng và yêu cầu bạn đặt `marketplaceName` hoặc `marketplacePath`.

## Marketplace macOS đi kèm

Các bản dựng desktop Codex gần đây đóng gói Sử dụng máy tính tại đây:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Khi `computerUse.autoInstall` là true và chưa có marketplace nào chứa
`computer-use` được đăng ký, OpenClaw thử tự động thêm root marketplace đi kèm
tiêu chuẩn:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bạn cũng có thể đăng ký nó tường minh từ shell bằng Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Nếu bạn dùng đường dẫn ứng dụng Codex không chuẩn, hãy đặt `computerUse.marketplacePath` thành
đường dẫn tệp marketplace cục bộ hoặc chạy `/codex computer-use install --source
<marketplace-source>` một lần.

## Giới hạn catalog từ xa

Codex app-server có thể liệt kê và đọc các mục catalog chỉ từ xa, nhưng hiện không
hỗ trợ `plugin/install` từ xa. Điều đó có nghĩa là `marketplaceName` có thể
chọn marketplace chỉ từ xa cho kiểm tra trạng thái, nhưng cài đặt và bật lại
vẫn cần marketplace cục bộ thông qua `marketplaceSource` hoặc `marketplacePath`.

Nếu trạng thái cho biết Plugin có sẵn trong một marketplace Codex từ xa nhưng
không hỗ trợ cài đặt từ xa, hãy chạy cài đặt với một nguồn hoặc đường dẫn cục bộ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Tham chiếu cấu hình

| Trường                          | Mặc định       | Ý nghĩa                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | suy luận       | Yêu cầu Sử dụng máy tính. Mặc định là true khi một trường Sử dụng máy tính khác được đặt. |
| `autoInstall`                   | false          | Cài đặt hoặc bật lại từ các marketplace đã phát hiện lúc bắt đầu lượt.         |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Thời gian cài đặt chờ Codex app-server phát hiện marketplace.                  |
| `marketplaceSource`             | chưa đặt       | Chuỗi nguồn truyền cho `marketplace/add` của Codex app-server.                 |
| `marketplacePath`               | chưa đặt       | Đường dẫn tệp marketplace Codex cục bộ chứa Plugin.                            |
| `marketplaceName`               | chưa đặt       | Tên marketplace Codex đã đăng ký để chọn.                                      |
| `pluginName`                    | `computer-use` | Tên Plugin marketplace Codex.                                                  |
| `mcpServerName`                 | `computer-use` | Tên MCP server do Plugin đã cài đặt cung cấp.                                  |

Tự động cài đặt lúc bắt đầu lượt cố ý từ chối các giá trị `marketplaceSource`
đã cấu hình. Thêm một nguồn mới là thao tác thiết lập tường minh, nên hãy dùng
`/codex computer-use install --source <marketplace-source>` một lần, rồi để
`autoInstall` xử lý các lần bật lại sau này từ marketplace cục bộ đã phát hiện.
Tự động cài đặt lúc bắt đầu lượt có thể dùng `marketplacePath` đã cấu hình, vì đó
đã là một đường dẫn cục bộ trên máy chủ.

## OpenClaw kiểm tra những gì

OpenClaw báo cáo nội bộ một lý do thiết lập ổn định và định dạng trạng thái
hiển thị cho người dùng trong chat:

| Lý do                        | Ý nghĩa                                                | Bước tiếp theo                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` được phân giải thành false.      | Đặt `enabled` hoặc một trường Sử dụng máy tính khác. |
| `marketplace_missing`        | Không có marketplace khớp nào khả dụng.               | Cấu hình nguồn, đường dẫn, hoặc tên marketplace. |
| `plugin_not_installed`       | Marketplace tồn tại, nhưng Plugin chưa được cài đặt.  | Chạy cài đặt hoặc bật `autoInstall`.          |
| `plugin_disabled`            | Plugin đã cài đặt nhưng bị tắt trong cấu hình Codex.  | Chạy cài đặt để bật lại.                      |
| `remote_install_unsupported` | Marketplace đã chọn chỉ từ xa.                         | Dùng `marketplaceSource` hoặc `marketplacePath`. |
| `mcp_missing`                | Plugin đã bật, nhưng MCP server không khả dụng.       | Kiểm tra Sử dụng máy tính Codex và quyền OS.  |
| `ready`                      | Plugin và công cụ MCP khả dụng.                       | Bắt đầu lượt ở chế độ Codex.                  |
| `check_failed`               | Một yêu cầu Codex app-server thất bại trong kiểm tra trạng thái. | Kiểm tra kết nối và log app-server.           |
| `auto_install_blocked`       | Thiết lập lúc bắt đầu lượt sẽ cần thêm một nguồn mới. | Chạy cài đặt tường minh trước.                |

Đầu ra chat bao gồm trạng thái Plugin, trạng thái MCP server, marketplace, công cụ
khi khả dụng, và thông báo cụ thể cho bước thiết lập thất bại.

## Quyền macOS

Sử dụng máy tính chỉ dành cho macOS. MCP server do Codex sở hữu có thể cần các
quyền OS cục bộ trước khi có thể kiểm tra hoặc điều khiển ứng dụng. Nếu OpenClaw nói Sử dụng máy tính
đã được cài đặt nhưng MCP server không khả dụng, trước tiên hãy xác minh thiết lập Sử dụng máy tính
phía Codex:

- Codex app-server đang chạy trên cùng máy chủ nơi thao tác điều khiển desktop sẽ
  diễn ra.
- Plugin Computer Use được bật trong cấu hình Codex.
- Máy chủ MCP `computer-use` xuất hiện trong trạng thái MCP của Codex app-server.
- macOS đã cấp các quyền cần thiết cho ứng dụng điều khiển desktop.
- Phiên máy chủ hiện tại có thể truy cập desktop đang được điều khiển.

OpenClaw chủ động fail closed khi `computerUse.enabled` là true. Một lượt ở chế độ
Codex không được âm thầm tiếp tục khi thiếu các công cụ desktop gốc mà cấu hình
đã yêu cầu.

## Khắc phục sự cố

**Trạng thái cho biết chưa cài đặt.** Chạy `/codex computer-use install`. Nếu
marketplace không được phát hiện, truyền `--source` hoặc `--marketplace-path`.

**Trạng thái cho biết đã cài đặt nhưng bị tắt.** Chạy lại `/codex computer-use install`.
Quá trình cài đặt Codex app-server sẽ ghi cấu hình Plugin trở lại trạng thái bật.

**Trạng thái cho biết không hỗ trợ cài đặt từ xa.** Dùng nguồn hoặc đường dẫn
marketplace cục bộ. Có thể kiểm tra các mục catalog chỉ từ xa, nhưng không thể
cài đặt chúng thông qua API app-server hiện tại.

**Trạng thái cho biết máy chủ MCP không khả dụng.** Chạy lại cài đặt một lần để
các máy chủ MCP tải lại. Nếu vẫn không khả dụng, hãy sửa ứng dụng Codex Computer Use,
trạng thái MCP của Codex app-server, hoặc quyền macOS.

**Trạng thái hoặc một phép thăm dò hết thời gian chờ trên `computer-use.list_apps`.** Plugin và máy chủ MCP
đã có mặt, nhưng cầu nối Computer Use cục bộ không phản hồi. Thoát hoặc khởi động lại
Codex Computer Use, khởi chạy lại Codex Desktop nếu cần, rồi thử lại trong một
phiên OpenClaw mới.

**Một công cụ Computer Use báo `Native hook relay unavailable`.** Hook công cụ gốc của Codex
không thể kết nối tới một relay OpenClaw đang hoạt động thông qua cầu nối cục bộ hoặc
dự phòng Gateway. Bắt đầu một phiên OpenClaw mới bằng `/new` hoặc `/reset`. Nếu
điều này tiếp tục xảy ra, hãy khởi động lại gateway để loại bỏ các luồng app-server cũ
và các đăng ký hook, rồi thử lại.

**Tự động cài đặt khi bắt đầu lượt từ chối một nguồn.** Đây là hành vi có chủ ý. Trước tiên hãy thêm
nguồn bằng lệnh rõ ràng `/codex computer-use install --source <marketplace-source>`,
sau đó những lần tự động cài đặt khi bắt đầu lượt trong tương lai có thể dùng
marketplace cục bộ đã phát hiện.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)
- [Ứng dụng iOS](/vi/platforms/ios)
