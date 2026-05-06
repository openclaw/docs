---
read_when:
    - Bạn muốn các tác tử OpenClaw ở chế độ Codex sử dụng Codex Computer Use
    - Bạn đang lựa chọn giữa Codex Computer Use, PeekabooBridge và cua-driver MCP trực tiếp
    - Bạn đang lựa chọn giữa Codex Computer Use và một thiết lập MCP cua-driver trực tiếp
    - Bạn đang cấu hình computerUse cho Plugin Codex đi kèm
    - Bạn đang khắc phục sự cố về trạng thái hoặc cài đặt /codex computer-use
summary: Thiết lập Codex Computer Use cho các tác nhân OpenClaw ở chế độ Codex
title: Sử dụng máy tính của Codex
x-i18n:
    generated_at: "2026-05-06T09:23:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use là Plugin MCP gốc Codex để điều khiển máy tính cục bộ. OpenClaw
không đóng gói ứng dụng máy tính, tự thực thi thao tác trên máy tính, hoặc vượt qua
quyền của Codex. Plugin `codex` đi kèm chỉ chuẩn bị app-server của Codex:
nó bật hỗ trợ Plugin của Codex, tìm hoặc cài đặt Plugin Computer Use của Codex
đã cấu hình, kiểm tra rằng MCP server `computer-use` có sẵn, rồi
để Codex sở hữu các lệnh gọi công cụ MCP gốc trong các lượt ở chế độ Codex.

Dùng trang này khi OpenClaw đã dùng harness Codex gốc. Đối với
thiết lập runtime, xem [Codex harness](/vi/plugins/codex-harness).

## OpenClaw.app và Peekaboo

Tích hợp Peekaboo của OpenClaw.app tách biệt với Computer Use của Codex. Ứng dụng
macOS có thể lưu trữ socket PeekabooBridge để CLI `peekaboo` có thể dùng lại các
quyền Accessibility và Screen Recording cục bộ của ứng dụng cho các công cụ tự động hóa
riêng của Peekaboo. Bridge đó không cài đặt hoặc proxy Computer Use của Codex, và
Computer Use của Codex không gọi qua socket PeekabooBridge.

Dùng [Peekaboo bridge](/vi/platforms/mac/peekaboo) khi bạn muốn OpenClaw.app làm
máy chủ nhận biết quyền cho tự động hóa CLI Peekaboo. Dùng trang này khi một
agent OpenClaw ở chế độ Codex cần có sẵn Plugin MCP `computer-use` gốc của Codex
trước khi lượt bắt đầu.

## Ứng dụng iOS

Ứng dụng iOS tách biệt với Computer Use của Codex. Nó không cài đặt hoặc proxy
MCP server `computer-use` của Codex và không phải là backend điều khiển máy tính.
Thay vào đó, ứng dụng iOS kết nối như một nút OpenClaw và phơi bày các
khả năng di động thông qua lệnh nút như `canvas.*`, `camera.*`, `screen.*`,
`location.*`, và `talk.*`.

Dùng [iOS](/vi/platforms/ios) khi bạn muốn agent điều khiển một nút iPhone thông qua
Gateway. Dùng trang này khi một agent ở chế độ Codex cần điều khiển máy tính
macOS cục bộ thông qua Plugin Computer Use gốc của Codex.

## MCP cua-driver trực tiếp

Computer Use của Codex không phải là cách duy nhất để phơi bày điều khiển máy tính. Nếu bạn muốn
các runtime do OpenClaw quản lý gọi trực tiếp driver của TryCua, hãy dùng MCP server
`cua-driver mcp` upstream thông qua registry MCP của OpenClaw thay vì luồng
marketplace dành riêng cho Codex.

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
có sẵn như một MCP server OpenClaw thông thường. Dùng thiết lập Computer Use của Codex trên
trang này khi app-server Codex cần sở hữu việc cài đặt Plugin, tải lại MCP,
và các lệnh gọi công cụ gốc bên trong các lượt ở chế độ Codex.

Driver của CUA dành riêng cho macOS và vẫn yêu cầu các quyền macOS cục bộ
mà ứng dụng của nó nhắc cấp, chẳng hạn như Accessibility và Screen Recording. OpenClaw
không cài đặt `cua-driver`, cấp các quyền đó, hoặc vượt qua mô hình an toàn
của driver upstream.

## Thiết lập nhanh

Đặt `plugins.entries.codex.config.computerUse` khi các lượt ở chế độ Codex phải có
Computer Use sẵn sàng trước khi một luồng bắt đầu:

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

Với cấu hình này, OpenClaw kiểm tra app-server Codex trước mỗi lượt ở chế độ Codex.
Nếu thiếu Computer Use nhưng app-server Codex đã phát hiện một
marketplace có thể cài đặt, OpenClaw yêu cầu app-server Codex cài đặt hoặc bật lại
Plugin và tải lại MCP server. Trên macOS, khi chưa đăng ký marketplace
khớp nào và bundle ứng dụng Codex tiêu chuẩn tồn tại, OpenClaw cũng thử
đăng ký marketplace Codex đi kèm từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` trước khi
thất bại. Nếu thiết lập vẫn không thể làm cho MCP server có sẵn, lượt sẽ thất bại
trước khi luồng bắt đầu.

Các phiên hiện có giữ nguyên runtime và liên kết luồng Codex. Sau khi thay đổi
`agentRuntime` hoặc cấu hình Computer Use, dùng `/new` hoặc `/reset` trong cuộc trò chuyện
bị ảnh hưởng trước khi kiểm thử.

## Lệnh

Dùng các lệnh `/codex computer-use` từ bất kỳ bề mặt trò chuyện nào có sẵn bề mặt
lệnh Plugin `codex`. Đây là các lệnh trò chuyện/runtime của OpenClaw,
không phải lệnh con CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` là chỉ đọc. Nó không thêm nguồn marketplace, cài đặt Plugin, hoặc
bật hỗ trợ Plugin của Codex.

`install` bật hỗ trợ Plugin app-server của Codex, tùy chọn thêm một
nguồn marketplace đã cấu hình, cài đặt hoặc bật lại Plugin đã cấu hình thông qua app-server
Codex, tải lại MCP server, và xác minh rằng MCP server phơi bày công cụ.

## Lựa chọn marketplace

OpenClaw dùng cùng API app-server mà chính Codex phơi bày. Các trường
marketplace chọn nơi Codex nên tìm `computer-use`.

| Trường               | Dùng khi                                                        | Hỗ trợ cài đặt                                           |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Không có trường marketplace | Bạn muốn app-server Codex dùng các marketplace nó đã biết. | Có, khi app-server trả về marketplace cục bộ.            |
| `marketplaceSource`  | Bạn có nguồn marketplace Codex mà app-server có thể thêm.       | Có, cho lệnh `/codex computer-use install` tường minh.   |
| `marketplacePath`    | Bạn đã biết đường dẫn tệp marketplace cục bộ trên máy chủ.      | Có, cho cài đặt tường minh và tự động cài đặt khi bắt đầu lượt. |
| `marketplaceName`    | Bạn muốn chọn một marketplace đã đăng ký theo tên.              | Chỉ có khi marketplace được chọn có đường dẫn cục bộ.    |

Các home Codex mới có thể cần một chút thời gian để gieo các marketplace chính thức.
Trong khi cài đặt, OpenClaw thăm dò `plugin/list` tối đa
`marketplaceDiscoveryTimeoutMs` mili giây. Mặc định là 60 giây.

Nếu nhiều marketplace đã biết chứa Computer Use, OpenClaw ưu tiên
`openai-bundled`, rồi `openai-curated`, rồi `local`. Các kết quả khớp không xác định
và mơ hồ sẽ thất bại đóng và yêu cầu bạn đặt `marketplaceName` hoặc `marketplacePath`.

## Marketplace macOS đi kèm

Các bản dựng máy tính Codex gần đây đóng gói Computer Use ở đây:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Khi `computerUse.autoInstall` là true và chưa có marketplace nào chứa
`computer-use` được đăng ký, OpenClaw thử tự động thêm root marketplace
đi kèm tiêu chuẩn:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bạn cũng có thể đăng ký nó tường minh từ shell với Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Nếu bạn dùng đường dẫn ứng dụng Codex không chuẩn, đặt `computerUse.marketplacePath` thành một
đường dẫn tệp marketplace cục bộ hoặc chạy `/codex computer-use install --source
<marketplace-source>` một lần.

## Giới hạn danh mục từ xa

App-server Codex có thể liệt kê và đọc các mục danh mục chỉ từ xa, nhưng hiện không
hỗ trợ `plugin/install` từ xa. Điều đó nghĩa là `marketplaceName` có thể
chọn một marketplace chỉ từ xa cho kiểm tra trạng thái, nhưng cài đặt và bật lại
vẫn cần marketplace cục bộ thông qua `marketplaceSource` hoặc `marketplacePath`.

Nếu trạng thái nói Plugin có sẵn trong marketplace Codex từ xa nhưng không hỗ trợ
cài đặt từ xa, chạy cài đặt với nguồn hoặc đường dẫn cục bộ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Tham chiếu cấu hình

| Trường                          | Mặc định       | Ý nghĩa                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | suy luận       | Yêu cầu Computer Use. Mặc định là true khi một trường Computer Use khác được đặt. |
| `autoInstall`                   | false          | Cài đặt hoặc bật lại từ các marketplace đã phát hiện khi bắt đầu lượt.         |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Thời gian cài đặt chờ app-server Codex phát hiện marketplace.                  |
| `marketplaceSource`             | chưa đặt       | Chuỗi nguồn được truyền vào `marketplace/add` của app-server Codex.            |
| `marketplacePath`               | chưa đặt       | Đường dẫn tệp marketplace Codex cục bộ chứa Plugin.                            |
| `marketplaceName`               | chưa đặt       | Tên marketplace Codex đã đăng ký để chọn.                                      |
| `pluginName`                    | `computer-use` | Tên Plugin marketplace Codex.                                                  |
| `mcpServerName`                 | `computer-use` | Tên MCP server do Plugin đã cài đặt phơi bày.                                  |

Tự động cài đặt khi bắt đầu lượt cố ý từ chối các giá trị `marketplaceSource`
đã cấu hình. Thêm nguồn mới là thao tác thiết lập tường minh, vì vậy hãy dùng
`/codex computer-use install --source <marketplace-source>` một lần, rồi để
`autoInstall` xử lý các lần bật lại sau này từ marketplace cục bộ đã phát hiện.
Tự động cài đặt khi bắt đầu lượt có thể dùng `marketplacePath` đã cấu hình, vì đó
đã là đường dẫn cục bộ trên máy chủ.

## OpenClaw kiểm tra những gì

OpenClaw báo cáo lý do thiết lập ổn định nội bộ và định dạng trạng thái
hiển thị cho người dùng trong trò chuyện:

| Lý do                        | Ý nghĩa                                                | Bước tiếp theo                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` được phân giải thành false.      | Đặt `enabled` hoặc một trường Computer Use khác. |
| `marketplace_missing`        | Không có marketplace khớp nào có sẵn.                  | Cấu hình nguồn, đường dẫn, hoặc tên marketplace. |
| `plugin_not_installed`       | Marketplace tồn tại, nhưng Plugin chưa được cài đặt.   | Chạy cài đặt hoặc bật `autoInstall`.          |
| `plugin_disabled`            | Plugin đã cài đặt nhưng bị tắt trong cấu hình Codex.   | Chạy cài đặt để bật lại.                      |
| `remote_install_unsupported` | Marketplace được chọn chỉ là từ xa.                    | Dùng `marketplaceSource` hoặc `marketplacePath`. |
| `mcp_missing`                | Plugin đã bật, nhưng MCP server không có sẵn.          | Kiểm tra Computer Use của Codex và quyền OS.  |
| `ready`                      | Plugin và công cụ MCP có sẵn.                          | Bắt đầu lượt ở chế độ Codex.                  |
| `check_failed`               | Một yêu cầu app-server Codex thất bại trong kiểm tra trạng thái. | Kiểm tra kết nối và nhật ký app-server.       |
| `auto_install_blocked`       | Thiết lập khi bắt đầu lượt sẽ cần thêm nguồn mới.      | Chạy cài đặt tường minh trước.                |

Đầu ra trò chuyện bao gồm trạng thái Plugin, trạng thái MCP server, marketplace, công cụ
khi có sẵn, và thông báo cụ thể cho bước thiết lập thất bại.

## Quyền macOS

Computer Use dành riêng cho macOS. MCP server do Codex sở hữu có thể cần các quyền OS
cục bộ trước khi nó có thể kiểm tra hoặc điều khiển ứng dụng. Nếu OpenClaw nói Computer Use
đã cài đặt nhưng MCP server không có sẵn, hãy xác minh thiết lập Computer Use phía Codex
trước:

- Codex app-server đang chạy trên cùng máy chủ nơi việc điều khiển máy tính để bàn sẽ
  diễn ra.
- Plugin Computer Use được bật trong cấu hình Codex.
- Máy chủ MCP `computer-use` xuất hiện trong trạng thái MCP của Codex app-server.
- macOS đã cấp các quyền cần thiết cho ứng dụng điều khiển máy tính để bàn.
- Phiên máy chủ hiện tại có thể truy cập máy tính để bàn đang được điều khiển.

OpenClaw chủ động từ chối theo hướng an toàn khi `computerUse.enabled` là true. Một
lượt ở chế độ Codex không được âm thầm tiếp tục nếu thiếu các công cụ máy tính để bàn
gốc mà cấu hình yêu cầu.

## Khắc phục sự cố

**Trạng thái báo chưa cài đặt.** Chạy `/codex computer-use install`. Nếu không phát hiện
được kho tiện ích, hãy truyền `--source` hoặc `--marketplace-path`.

**Trạng thái báo đã cài đặt nhưng bị tắt.** Chạy lại `/codex computer-use install`.
Quy trình cài đặt Codex app-server sẽ ghi lại cấu hình Plugin ở trạng thái bật.

**Trạng thái báo không hỗ trợ cài đặt từ xa.** Dùng nguồn hoặc đường dẫn kho tiện ích
cục bộ. Có thể kiểm tra các mục danh mục chỉ có từ xa, nhưng không thể cài đặt chúng qua
API app-server hiện tại.

**Trạng thái báo máy chủ MCP không khả dụng.** Chạy lại cài đặt một lần để các máy chủ
MCP tải lại. Nếu vẫn không khả dụng, hãy sửa ứng dụng Codex Computer Use, trạng thái MCP
của Codex app-server, hoặc quyền macOS.

**Trạng thái hoặc phép dò hết thời gian chờ trên `computer-use.list_apps`.** Plugin và máy chủ MCP
đã có mặt, nhưng cầu nối Computer Use cục bộ không phản hồi. Thoát hoặc khởi động lại
Codex Computer Use, khởi chạy lại Codex Desktop nếu cần, rồi thử lại trong một phiên
OpenClaw mới.

**Một công cụ Computer Use báo `Native hook relay unavailable`.** Hook công cụ gốc của Codex
không thể kết nối tới relay OpenClaw đang hoạt động thông qua cầu nối cục bộ hoặc phương án dự phòng
Gateway. Bắt đầu một phiên OpenClaw mới bằng `/new` hoặc `/reset`. Nếu tình trạng này
tiếp tục xảy ra, hãy khởi động lại gateway để loại bỏ các luồng app-server cũ và đăng ký hook
cũ, rồi thử lại.

**Tự động cài đặt khi bắt đầu lượt từ chối một nguồn.** Đây là hành vi có chủ ý. Trước tiên hãy thêm
nguồn bằng lệnh tường minh `/codex computer-use install --source <marketplace-source>`,
sau đó tự động cài đặt khi bắt đầu lượt trong tương lai có thể dùng kho tiện ích cục bộ
đã phát hiện.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)
- [Ứng dụng iOS](/vi/platforms/ios)
