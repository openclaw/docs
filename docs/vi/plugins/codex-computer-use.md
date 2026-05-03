---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng Codex Computer Use
    - Bạn đang quyết định giữa Codex Computer Use, PeekabooBridge và cua-driver MCP trực tiếp
    - Bạn đang quyết định giữa Codex Computer Use và thiết lập MCP cua-driver trực tiếp
    - Bạn đang cấu hình computerUse cho Plugin Codex đi kèm
    - Bạn đang khắc phục sự cố về trạng thái hoặc cài đặt /codex computer-use
summary: Thiết lập Codex Computer Use cho các tác tử OpenClaw ở chế độ Codex
title: Sử dụng máy tính với Codex
x-i18n:
    generated_at: "2026-05-03T10:39:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use là một Plugin MCP gốc Codex để điều khiển máy tính để bàn cục bộ. OpenClaw
không gói kèm ứng dụng máy tính để bàn, tự thực thi thao tác máy tính để bàn, hoặc bỏ qua
quyền của Codex. Plugin `codex` được gói kèm chỉ chuẩn bị máy chủ ứng dụng Codex:
nó bật hỗ trợ Plugin Codex, tìm hoặc cài đặt Plugin Codex
Computer Use đã cấu hình, kiểm tra rằng máy chủ MCP `computer-use` có sẵn, rồi
để Codex sở hữu các lệnh gọi công cụ MCP gốc trong các lượt ở chế độ Codex.

Dùng trang này khi OpenClaw đã dùng harness Codex gốc. Với phần thiết lập
runtime, hãy xem [harness Codex](/vi/plugins/codex-harness).

## OpenClaw.app và Peekaboo

Tích hợp Peekaboo của OpenClaw.app tách biệt với Codex Computer Use. Ứng dụng
macOS có thể lưu trữ socket PeekabooBridge để CLI `peekaboo` có thể tái sử dụng
các quyền Accessibility và Screen Recording cục bộ của ứng dụng cho các
công cụ tự động hóa riêng của Peekaboo. Cầu nối đó không cài đặt hoặc proxy
Codex Computer Use, và Codex Computer Use không gọi qua socket PeekabooBridge.

Dùng [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo) khi bạn muốn OpenClaw.app là
máy chủ nhận biết quyền cho tự động hóa CLI Peekaboo. Dùng trang này khi một
agent OpenClaw ở chế độ Codex cần có sẵn Plugin MCP `computer-use` gốc của Codex
trước khi lượt bắt đầu.

## Ứng dụng iOS

Ứng dụng iOS tách biệt với Codex Computer Use. Nó không cài đặt hoặc proxy
máy chủ MCP `computer-use` của Codex và không phải là backend điều khiển máy tính để bàn.
Thay vào đó, ứng dụng iOS kết nối như một node OpenClaw và phơi bày các
khả năng di động thông qua các lệnh node như `canvas.*`, `camera.*`, `screen.*`,
`location.*`, và `talk.*`.

Dùng [iOS](/vi/platforms/ios) khi bạn muốn agent điều khiển một node iPhone thông qua
gateway. Dùng trang này khi một agent ở chế độ Codex cần điều khiển máy tính để bàn
macOS cục bộ thông qua Plugin Computer Use gốc của Codex.

## MCP cua-driver trực tiếp

Codex Computer Use không phải là cách duy nhất để phơi bày điều khiển máy tính để bàn. Nếu bạn muốn
các runtime do OpenClaw quản lý gọi trực tiếp driver của TryCua, hãy dùng máy chủ
`cua-driver mcp` upstream thông qua sổ đăng ký MCP của OpenClaw thay vì luồng
marketplace dành riêng cho Codex.

Sau khi cài đặt `cua-driver`, hãy yêu cầu nó cung cấp lệnh OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

hoặc tự đăng ký máy chủ stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Đường dẫn đó giữ nguyên bề mặt công cụ MCP upstream, bao gồm các schema driver
và phản hồi MCP có cấu trúc. Dùng nó khi bạn muốn CUA driver
có sẵn như một máy chủ MCP OpenClaw thông thường. Dùng thiết lập Codex Computer Use trên
trang này khi máy chủ ứng dụng Codex cần sở hữu việc cài đặt Plugin, tải lại MCP,
và các lệnh gọi công cụ gốc bên trong các lượt ở chế độ Codex.

Driver của CUA dành riêng cho macOS và vẫn yêu cầu các quyền macOS cục bộ
mà ứng dụng của nó nhắc cấp, chẳng hạn như Accessibility và Screen Recording. OpenClaw
không cài đặt `cua-driver`, cấp các quyền đó, hoặc bỏ qua mô hình an toàn của
driver upstream.

## Thiết lập nhanh

Đặt `plugins.entries.codex.config.computerUse` khi các lượt ở chế độ Codex phải có
Computer Use trước khi một chuỗi bắt đầu:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Với cấu hình này, OpenClaw kiểm tra máy chủ ứng dụng Codex trước mỗi lượt ở chế độ Codex.
Nếu thiếu Computer Use nhưng máy chủ ứng dụng Codex đã phát hiện một
marketplace có thể cài đặt, OpenClaw yêu cầu máy chủ ứng dụng Codex cài đặt hoặc bật lại
Plugin và tải lại máy chủ MCP. Trên macOS, khi không có marketplace khớp nào
được đăng ký và gói ứng dụng Codex tiêu chuẩn tồn tại, OpenClaw cũng thử
đăng ký marketplace Codex được gói kèm từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` trước khi
báo lỗi. Nếu quá trình thiết lập vẫn không thể làm cho máy chủ MCP sẵn sàng, lượt sẽ lỗi
trước khi chuỗi bắt đầu.

Các phiên hiện có giữ nguyên runtime và liên kết chuỗi Codex. Sau khi thay đổi
`agentRuntime` hoặc cấu hình Computer Use, hãy dùng `/new` hoặc `/reset` trong cuộc trò chuyện
bị ảnh hưởng trước khi kiểm thử.

## Lệnh

Dùng các lệnh `/codex computer-use` từ bất kỳ bề mặt trò chuyện nào có sẵn bề mặt lệnh Plugin
`codex`. Đây là các lệnh trò chuyện/runtime của OpenClaw,
không phải lệnh con CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` chỉ đọc. Nó không thêm nguồn marketplace, cài đặt Plugin, hoặc
bật hỗ trợ Plugin Codex.

`install` bật hỗ trợ Plugin cho máy chủ ứng dụng Codex, tùy chọn thêm một
nguồn marketplace đã cấu hình, cài đặt hoặc bật lại Plugin đã cấu hình thông qua máy chủ ứng dụng Codex,
tải lại máy chủ MCP, và xác minh rằng máy chủ MCP phơi bày công cụ.

## Lựa chọn marketplace

OpenClaw dùng cùng API máy chủ ứng dụng mà chính Codex phơi bày. Các
trường marketplace chọn nơi Codex nên tìm `computer-use`.

| Trường               | Dùng khi                                                         | Hỗ trợ cài đặt                                           |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Không có trường marketplace | Bạn muốn máy chủ ứng dụng Codex dùng các marketplace nó đã biết. | Có, khi máy chủ ứng dụng trả về một marketplace cục bộ.  |
| `marketplaceSource`  | Bạn có một nguồn marketplace Codex mà máy chủ ứng dụng có thể thêm. | Có, cho `/codex computer-use install` rõ ràng.           |
| `marketplacePath`    | Bạn đã biết đường dẫn tệp marketplace cục bộ trên máy chủ.       | Có, cho cài đặt rõ ràng và tự động cài đặt khi bắt đầu lượt. |
| `marketplaceName`    | Bạn muốn chọn một marketplace đã đăng ký theo tên.               | Có, chỉ khi marketplace đã chọn có đường dẫn cục bộ.     |

Các home Codex mới có thể cần một khoảng thời gian ngắn để khởi tạo các marketplace chính thức.
Trong khi cài đặt, OpenClaw thăm dò `plugin/list` tối đa
`marketplaceDiscoveryTimeoutMs` mili giây. Mặc định là 60 giây.

Nếu nhiều marketplace đã biết chứa Computer Use, OpenClaw ưu tiên
`openai-bundled`, rồi `openai-curated`, rồi `local`. Các kết quả khớp mơ hồ không xác định
sẽ đóng an toàn và yêu cầu bạn đặt `marketplaceName` hoặc `marketplacePath`.

## Marketplace macOS được gói kèm

Các bản dựng Codex desktop gần đây gói kèm Computer Use tại đây:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Khi `computerUse.autoInstall` là true và không có marketplace chứa
`computer-use` nào được đăng ký, OpenClaw thử tự động thêm gốc marketplace
được gói kèm tiêu chuẩn:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bạn cũng có thể đăng ký rõ ràng từ shell bằng Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Nếu bạn dùng đường dẫn ứng dụng Codex không chuẩn, hãy đặt `computerUse.marketplacePath` thành một
đường dẫn tệp marketplace cục bộ hoặc chạy `/codex computer-use install --source
<marketplace-source>` một lần.

## Giới hạn catalog từ xa

Máy chủ ứng dụng Codex có thể liệt kê và đọc các mục catalog chỉ từ xa, nhưng hiện
không hỗ trợ `plugin/install` từ xa. Điều đó nghĩa là `marketplaceName` có thể
chọn marketplace chỉ từ xa để kiểm tra trạng thái, nhưng việc cài đặt và bật lại
vẫn cần một marketplace cục bộ thông qua `marketplaceSource` hoặc `marketplacePath`.

Nếu trạng thái cho biết Plugin có sẵn trong một marketplace Codex từ xa nhưng việc cài đặt từ xa
không được hỗ trợ, hãy chạy cài đặt với một nguồn hoặc đường dẫn cục bộ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Tham chiếu cấu hình

| Trường                          | Mặc định       | Ý nghĩa                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | suy luận       | Yêu cầu Computer Use. Mặc định là true khi một trường Computer Use khác được đặt. |
| `autoInstall`                   | false          | Cài đặt hoặc bật lại từ các marketplace đã phát hiện khi bắt đầu lượt.         |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Thời gian cài đặt chờ máy chủ ứng dụng Codex phát hiện marketplace.            |
| `marketplaceSource`             | chưa đặt       | Chuỗi nguồn được truyền cho `marketplace/add` của máy chủ ứng dụng Codex.      |
| `marketplacePath`               | chưa đặt       | Đường dẫn tệp marketplace Codex cục bộ chứa Plugin.                            |
| `marketplaceName`               | chưa đặt       | Tên marketplace Codex đã đăng ký để chọn.                                      |
| `pluginName`                    | `computer-use` | Tên Plugin marketplace Codex.                                                  |
| `mcpServerName`                 | `computer-use` | Tên máy chủ MCP được phơi bày bởi Plugin đã cài đặt.                           |

Tự động cài đặt khi bắt đầu lượt cố ý từ chối các giá trị `marketplaceSource`
đã cấu hình. Thêm một nguồn mới là thao tác thiết lập rõ ràng, vì vậy hãy dùng
`/codex computer-use install --source <marketplace-source>` một lần, rồi để
`autoInstall` xử lý các lần bật lại trong tương lai từ các marketplace cục bộ đã phát hiện.
Tự động cài đặt khi bắt đầu lượt có thể dùng `marketplacePath` đã cấu hình, vì đó
đã là một đường dẫn cục bộ trên máy chủ.

## Những gì OpenClaw kiểm tra

OpenClaw báo cáo nội bộ một lý do thiết lập ổn định và định dạng trạng thái
hiển thị cho người dùng trong trò chuyện:

| Lý do                        | Ý nghĩa                                                | Bước tiếp theo                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` được giải quyết thành false.     | Đặt `enabled` hoặc một trường Computer Use khác. |
| `marketplace_missing`        | Không có marketplace khớp nào khả dụng.                | Cấu hình nguồn, đường dẫn, hoặc tên marketplace. |
| `plugin_not_installed`       | Marketplace tồn tại, nhưng Plugin chưa được cài đặt.   | Chạy cài đặt hoặc bật `autoInstall`.          |
| `plugin_disabled`            | Plugin đã được cài đặt nhưng bị tắt trong cấu hình Codex. | Chạy cài đặt để bật lại.                      |
| `remote_install_unsupported` | Marketplace đã chọn chỉ là từ xa.                      | Dùng `marketplaceSource` hoặc `marketplacePath`. |
| `mcp_missing`                | Plugin được bật, nhưng máy chủ MCP không khả dụng.     | Kiểm tra Codex Computer Use và quyền hệ điều hành. |
| `ready`                      | Plugin và công cụ MCP có sẵn.                          | Bắt đầu lượt ở chế độ Codex.                  |
| `check_failed`               | Một yêu cầu máy chủ ứng dụng Codex thất bại trong khi kiểm tra trạng thái. | Kiểm tra kết nối máy chủ ứng dụng và nhật ký. |
| `auto_install_blocked`       | Thiết lập khi bắt đầu lượt sẽ cần thêm một nguồn mới.  | Chạy cài đặt rõ ràng trước.                   |

Đầu ra trò chuyện bao gồm trạng thái Plugin, trạng thái máy chủ MCP, marketplace, công cụ
khi có sẵn, và thông báo cụ thể cho bước thiết lập thất bại.

## Quyền macOS

Computer Use dành riêng cho macOS. Máy chủ MCP do Codex sở hữu có thể cần các
quyền hệ điều hành cục bộ trước khi có thể kiểm tra hoặc điều khiển ứng dụng. Nếu OpenClaw nói Computer Use
đã được cài đặt nhưng máy chủ MCP không khả dụng, hãy xác minh thiết lập Computer
Use phía Codex trước:

- Máy chủ ứng dụng Codex đang chạy trên cùng máy chủ nơi việc điều khiển máy tính để bàn sẽ
  diễn ra.
- Plugin Computer Use được bật trong cấu hình Codex.
- Máy chủ MCP `computer-use` xuất hiện trong trạng thái MCP của máy chủ ứng dụng Codex.
- macOS đã cấp các quyền cần thiết cho ứng dụng điều khiển máy tính để bàn.
- Phiên máy chủ hiện tại có thể truy cập máy tính để bàn đang được điều khiển.

OpenClaw cố ý đóng khi `computerUse.enabled` là true. Một lượt ở chế độ
Codex không được âm thầm tiếp tục nếu thiếu các công cụ máy tính để bàn gốc
mà cấu hình yêu cầu.

## Khắc phục sự cố

**Trạng thái cho biết chưa được cài đặt.** Chạy `/codex computer-use install`. Nếu
marketplace không được phát hiện, truyền `--source` hoặc `--marketplace-path`.

**Trạng thái cho biết đã cài đặt nhưng bị tắt.** Chạy lại `/codex computer-use install`.
Quá trình cài đặt máy chủ ứng dụng Codex ghi cấu hình Plugin trở lại trạng thái bật.

**Trạng thái cho biết không hỗ trợ cài đặt từ xa.** Dùng nguồn hoặc đường dẫn marketplace cục bộ.
Các mục danh mục chỉ từ xa có thể được kiểm tra nhưng không thể cài đặt thông qua
API máy chủ ứng dụng hiện tại.

**Trạng thái cho biết máy chủ MCP không khả dụng.** Chạy lại cài đặt một lần để các máy chủ
MCP tải lại. Nếu vẫn không khả dụng, hãy sửa ứng dụng Codex Computer Use,
trạng thái MCP của máy chủ ứng dụng Codex, hoặc quyền macOS.

**Trạng thái hoặc một phép thăm dò hết thời gian chờ trên `computer-use.list_apps`.** Plugin và máy chủ MCP
đều có mặt, nhưng cầu nối Computer Use cục bộ không phản hồi. Thoát hoặc
khởi động lại Codex Computer Use, khởi chạy lại Codex Desktop nếu cần, rồi thử lại trong một
phiên OpenClaw mới.

**Một công cụ Computer Use báo `Native hook relay unavailable`.** Hook công cụ gốc của Codex
không thể kết nối tới một relay OpenClaw đang hoạt động thông qua cầu nối cục bộ hoặc
Gateway dự phòng. Bắt đầu một phiên OpenClaw mới bằng `/new` hoặc `/reset`. Nếu sự cố
tiếp tục xảy ra, hãy khởi động lại gateway để các luồng máy chủ ứng dụng cũ và đăng ký hook
bị loại bỏ, rồi thử lại.

**Tự động cài đặt khi bắt đầu lượt từ chối một nguồn.** Đây là chủ ý. Trước tiên hãy thêm
nguồn bằng lệnh rõ ràng `/codex computer-use install --source <marketplace-source>`,
sau đó các lần tự động cài đặt khi bắt đầu lượt trong tương lai có thể dùng marketplace cục bộ
đã được phát hiện.
