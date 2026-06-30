---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng Codex Computer Use
    - Bạn đang lựa chọn giữa Codex Computer Use, PeekabooBridge và MCP cua-driver trực tiếp
    - Bạn đang quyết định giữa Codex Computer Use và một thiết lập MCP cua-driver trực tiếp
    - Bạn đang cấu hình computerUse cho plugin Codex đi kèm
    - Bạn đang khắc phục sự cố về trạng thái hoặc cài đặt /codex computer-use
summary: Thiết lập tính năng sử dụng máy tính của Codex cho các tác tử OpenClaw ở chế độ Codex
title: Codex Computer Use
x-i18n:
    generated_at: "2026-06-30T14:09:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use là một Plugin MCP gốc Codex để điều khiển máy tính để bàn cục bộ. OpenClaw
không đóng gói ứng dụng máy tính để bàn, tự thực thi thao tác trên máy tính để bàn, hay bỏ qua
quyền của Codex. Plugin `codex` đi kèm chỉ chuẩn bị app-server của Codex:
nó bật hỗ trợ Plugin Codex, tìm hoặc cài đặt Plugin Codex
Computer Use đã cấu hình, kiểm tra rằng máy chủ MCP `computer-use` có sẵn, rồi
để Codex sở hữu các lệnh gọi công cụ MCP gốc trong các lượt ở chế độ Codex.

Dùng trang này khi OpenClaw đã dùng harness Codex gốc. Đối với
phần thiết lập runtime, xem [Codex harness](/vi/plugins/codex-harness).

## OpenClaw.app và Peekaboo

Tích hợp Peekaboo của OpenClaw.app tách biệt với Codex Computer Use. Ứng dụng
macOS có thể lưu trữ socket PeekabooBridge để CLI `peekaboo` có thể tái sử dụng
quyền Accessibility và Screen Recording cục bộ của ứng dụng cho các
công cụ tự động hóa riêng của Peekaboo. Bridge đó không cài đặt hay proxy Codex Computer Use, và
Codex Computer Use không gọi qua socket PeekabooBridge.

Dùng [Peekaboo bridge](/vi/platforms/mac/peekaboo) khi bạn muốn OpenClaw.app là
máy chủ nhận biết quyền cho tự động hóa Peekaboo CLI. Dùng trang này khi một
agent OpenClaw ở chế độ Codex cần có sẵn Plugin MCP `computer-use` gốc của Codex
trước khi lượt bắt đầu.

## Ứng dụng iOS

Ứng dụng iOS tách biệt với Codex Computer Use. Nó không cài đặt hay proxy
máy chủ MCP `computer-use` của Codex và không phải là backend điều khiển máy tính để bàn.
Thay vào đó, ứng dụng iOS kết nối như một node OpenClaw và phơi bày các
năng lực di động thông qua các lệnh node như `canvas.*`, `camera.*`, `screen.*`,
`location.*`, và `talk.*`.

Dùng [iOS](/vi/platforms/ios) khi bạn muốn một agent điều khiển node iPhone thông qua
Gateway. Dùng trang này khi một agent ở chế độ Codex cần điều khiển máy tính để bàn
macOS cục bộ thông qua Plugin Computer Use gốc của Codex.

## MCP cua-driver trực tiếp

Codex Computer Use không phải là cách duy nhất để phơi bày điều khiển máy tính để bàn. Nếu bạn muốn
các runtime do OpenClaw quản lý gọi trực tiếp driver của TryCua, hãy dùng máy chủ
`cua-driver mcp` upstream thông qua registry MCP của OpenClaw thay vì
luồng marketplace riêng cho Codex.

Sau khi cài đặt `cua-driver`, hoặc yêu cầu nó cung cấp lệnh OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

hoặc tự đăng ký máy chủ stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Đường dẫn đó giữ nguyên bề mặt công cụ MCP upstream, bao gồm các schema driver
và phản hồi MCP có cấu trúc. Dùng nó khi bạn muốn driver CUA
có sẵn như một máy chủ MCP OpenClaw thông thường. Dùng thiết lập Codex Computer Use trên
trang này khi app-server Codex cần sở hữu việc cài đặt Plugin, tải lại MCP,
và các lệnh gọi công cụ gốc bên trong các lượt ở chế độ Codex.

Driver của CUA dành riêng cho macOS và vẫn yêu cầu các quyền macOS cục bộ
mà ứng dụng của nó nhắc cấp, chẳng hạn như Accessibility và Screen Recording. OpenClaw
không cài đặt `cua-driver`, cấp các quyền đó, hay bỏ qua mô hình an toàn của
driver upstream.

## Thiết lập nhanh

Đặt `plugins.entries.codex.config.computerUse` khi các lượt ở chế độ Codex phải có
Computer Use trước khi một luồng bắt đầu. `autoInstall: true` bật
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
      model: "openai/gpt-5.5",
    },
  },
}
```

Với cấu hình này, OpenClaw kiểm tra app-server Codex trước mỗi lượt ở chế độ Codex.
Nếu thiếu Computer Use nhưng app-server Codex đã phát hiện một marketplace
có thể cài đặt, OpenClaw yêu cầu app-server Codex cài đặt hoặc bật lại
Plugin và tải lại các máy chủ MCP. Trên macOS, khi không có marketplace khớp nào
được đăng ký và gói ứng dụng Codex tiêu chuẩn tồn tại, OpenClaw cũng cố gắng
đăng ký marketplace Codex đi kèm từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` trước khi
thất bại. Nếu thiết lập vẫn không thể làm cho máy chủ MCP khả dụng, lượt sẽ thất bại
trước khi luồng bắt đầu.

Sau khi thay đổi cấu hình Computer Use, dùng `/new` hoặc `/reset` trong cuộc trò chuyện
bị ảnh hưởng trước khi kiểm thử nếu một luồng Codex hiện có đã bắt đầu.

Trên macOS với khởi động stdio được quản lý, OpenClaw ưu tiên gói ứng dụng Codex
máy tính để bàn đã ký tại `/Applications/Codex.app/Contents/Resources/codex` khi nó tồn tại.
Điều đó giữ Computer Use dưới gói ứng dụng sở hữu các quyền điều khiển máy tính để bàn
cục bộ. Nếu ứng dụng máy tính để bàn chưa được cài đặt, OpenClaw quay về
binary Codex được quản lý đã cài bên cạnh Plugin. Nếu một ứng dụng máy tính để bàn
đã cài đặt khởi tạo với phiên bản app-server không được hỗ trợ, OpenClaw đóng tiến trình con đó
và thử lại ứng viên binary được quản lý tiếp theo thay vì để một
ứng dụng máy tính để bàn lỗi thời che khuất fallback cục bộ của Plugin. Cấu hình
`appServer.command` rõ ràng hoặc `OPENCLAW_CODEX_APP_SERVER_BIN` vẫn ghi đè lựa chọn
được quản lý này.

## Lệnh

Dùng các lệnh `/codex computer-use` từ bất kỳ bề mặt trò chuyện nào nơi bề mặt lệnh Plugin `codex`
có sẵn. Đây là các lệnh trò chuyện/runtime của OpenClaw,
không phải lệnh con CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` chỉ đọc. Nó không thêm nguồn marketplace, cài đặt Plugin, hay
bật hỗ trợ Plugin Codex. Nếu không có cấu hình nào bật Computer Use,
`status` có thể báo là đã tắt ngay cả sau một lệnh cài đặt một lần.

`install` bật hỗ trợ Plugin app-server Codex, tùy chọn thêm một
nguồn marketplace đã cấu hình, cài đặt hoặc bật lại Plugin đã cấu hình thông qua app-server Codex,
tải lại các máy chủ MCP, và xác minh rằng máy chủ MCP phơi bày công cụ.
Vì cài đặt thay đổi tài nguyên máy chủ đáng tin cậy, chỉ chủ sở hữu hoặc
máy khách Gateway `operator.admin` mới có thể chạy `install`. Những người gửi được ủy quyền khác có thể
tiếp tục dùng lệnh `status` chỉ đọc, bao gồm cả khi có ghi đè.

## Lựa chọn marketplace

OpenClaw dùng cùng API app-server mà chính Codex phơi bày. Các trường
marketplace chọn nơi Codex nên tìm `computer-use`.

| Trường                | Dùng khi                                                        | Hỗ trợ cài đặt                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Không có trường marketplace | Bạn muốn app-server Codex dùng các marketplace mà nó đã biết. | Có, khi app-server trả về một marketplace cục bộ.        |
| `marketplaceSource`  | Bạn có một nguồn marketplace Codex mà app-server có thể thêm.         | Có, cho `/codex computer-use install` rõ ràng.         |
| `marketplacePath`    | Bạn đã biết đường dẫn tệp marketplace cục bộ trên máy chủ.   | Có, cho cài đặt rõ ràng và tự động cài đặt khi bắt đầu lượt.   |
| `marketplaceName`    | Bạn muốn chọn một marketplace đã đăng ký theo tên.  | Chỉ có khi marketplace được chọn có đường dẫn cục bộ. |

Các home Codex mới có thể cần một khoảng thời gian ngắn để gieo các marketplace chính thức.
Trong khi cài đặt, OpenClaw thăm dò `plugin/list` trong tối đa
`marketplaceDiscoveryTimeoutMs` mili giây. Mặc định là 60 giây.

Nếu nhiều marketplace đã biết chứa Computer Use, OpenClaw ưu tiên
`openai-bundled`, sau đó `openai-curated`, rồi `local`. Các kết quả khớp mơ hồ không xác định
sẽ thất bại đóng và yêu cầu bạn đặt `marketplaceName` hoặc `marketplacePath`.

## Marketplace macOS đi kèm

Các bản dựng Codex máy tính để bàn gần đây đóng gói Computer Use tại đây:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Khi `computerUse.autoInstall` là true và không có marketplace nào chứa
`computer-use` được đăng ký, OpenClaw cố gắng tự động thêm root marketplace
đi kèm tiêu chuẩn:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bạn cũng có thể đăng ký rõ ràng từ shell bằng Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Nếu bạn dùng đường dẫn ứng dụng Codex không chuẩn, hãy chạy `/codex computer-use install
--source <marketplace-root>` một lần hoặc đặt `computerUse.marketplacePath` thành
đường dẫn tệp marketplace cục bộ. Chỉ dùng `--marketplace-path` khi bạn có
đường dẫn tệp JSON marketplace, không phải root marketplace đi kèm.

## Giới hạn danh mục từ xa

app-server Codex có thể liệt kê và đọc các mục danh mục chỉ từ xa, nhưng hiện
chưa hỗ trợ `plugin/install` từ xa. Điều đó có nghĩa là `marketplaceName` có thể
chọn marketplace chỉ từ xa cho kiểm tra trạng thái, nhưng cài đặt và bật lại
vẫn cần marketplace cục bộ thông qua `marketplaceSource` hoặc `marketplacePath`.

Nếu trạng thái cho biết Plugin có sẵn trong marketplace Codex từ xa nhưng cài đặt
từ xa không được hỗ trợ, hãy chạy cài đặt với nguồn hoặc đường dẫn cục bộ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Tham chiếu cấu hình

| Trường                           | Mặc định        | Ý nghĩa                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | suy luận       | Yêu cầu Computer Use. Mặc định là true khi trường Computer Use khác được đặt. |
| `autoInstall`                   | false          | Cài đặt hoặc bật lại từ các marketplace đã phát hiện khi bắt đầu lượt.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Thời gian cài đặt chờ app-server Codex phát hiện marketplace.             |
| `marketplaceSource`             | chưa đặt          | Chuỗi nguồn truyền cho `marketplace/add` của app-server Codex.                    |
| `marketplacePath`               | chưa đặt          | Đường dẫn tệp marketplace Codex cục bộ chứa Plugin.                       |
| `marketplaceName`               | chưa đặt          | Tên marketplace Codex đã đăng ký để chọn.                                   |
| `pluginName`                    | `computer-use` | Tên Plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Tên máy chủ MCP do Plugin đã cài đặt phơi bày.                               |

Tự động cài đặt khi bắt đầu lượt cố ý từ chối các giá trị `marketplaceSource`
đã cấu hình. Thêm một nguồn mới là thao tác thiết lập rõ ràng, vì vậy hãy dùng
`/codex computer-use install --source <marketplace-source>` một lần, rồi để
`autoInstall` xử lý các lần bật lại trong tương lai từ các marketplace cục bộ đã phát hiện.
Tự động cài đặt khi bắt đầu lượt có thể dùng `marketplacePath` đã cấu hình, vì đó
đã là đường dẫn cục bộ trên máy chủ.

## OpenClaw kiểm tra những gì

OpenClaw báo cáo nội bộ một lý do thiết lập ổn định và định dạng trạng thái
hướng người dùng cho trò chuyện:

| Lý do                        | Ý nghĩa                                                   | Bước tiếp theo                                    |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` được phân giải thành false.         | Đặt `enabled` hoặc một trường Computer Use khác.  |
| `marketplace_missing`        | Không có marketplace khớp nào khả dụng.                  | Cấu hình nguồn, đường dẫn hoặc tên marketplace.   |
| `plugin_not_installed`       | Marketplace tồn tại, nhưng plugin chưa được cài đặt.      | Chạy lệnh cài đặt hoặc bật `autoInstall`.         |
| `plugin_disabled`            | Plugin đã được cài đặt nhưng bị tắt trong cấu hình Codex. | Chạy lệnh cài đặt để bật lại plugin.              |
| `remote_install_unsupported` | Marketplace đã chọn chỉ hỗ trợ từ xa.                     | Dùng `marketplaceSource` hoặc `marketplacePath`.  |
| `mcp_missing`                | Plugin đã được bật, nhưng máy chủ MCP không khả dụng.     | Kiểm tra Computer Use của Codex và quyền của OS.  |
| `ready`                      | Plugin và công cụ MCP đều khả dụng.                       | Bắt đầu lượt ở chế độ Codex.                      |
| `check_failed`               | Yêu cầu app-server Codex thất bại khi kiểm tra trạng thái. | Kiểm tra kết nối và nhật ký của app-server.       |
| `auto_install_blocked`       | Thiết lập khi bắt đầu lượt sẽ cần thêm một nguồn mới.     | Chạy cài đặt tường minh trước.                    |

Đầu ra chat bao gồm trạng thái plugin, trạng thái máy chủ MCP, marketplace, công cụ
khi khả dụng, và thông báo cụ thể cho bước thiết lập bị lỗi.

## Quyền trên macOS

Computer Use dành riêng cho macOS. Máy chủ MCP do Codex sở hữu có thể cần các
quyền OS cục bộ trước khi có thể kiểm tra hoặc điều khiển ứng dụng. Nếu OpenClaw
cho biết Computer Use đã được cài đặt nhưng máy chủ MCP không khả dụng, trước
tiên hãy xác minh thiết lập Computer Use phía Codex:

- Codex app-server đang chạy trên cùng máy chủ nơi việc điều khiển desktop sẽ
  diễn ra.
- Plugin Computer Use đã được bật trong cấu hình Codex.
- Máy chủ MCP `computer-use` xuất hiện trong trạng thái MCP của Codex app-server.
- macOS đã cấp các quyền cần thiết cho ứng dụng điều khiển desktop.
- Phiên máy chủ hiện tại có thể truy cập desktop đang được điều khiển.

OpenClaw cố ý thất bại đóng khi `computerUse.enabled` là true. Một lượt ở chế độ
Codex không được âm thầm tiếp tục nếu thiếu các công cụ desktop gốc mà cấu hình
đã yêu cầu.

## Khắc phục sự cố

**Trạng thái báo chưa cài đặt.** Chạy `/codex computer-use install`. Nếu không
phát hiện được marketplace, hãy truyền `--source` hoặc `--marketplace-path`.

**Trạng thái báo đã cài đặt nhưng bị tắt.** Chạy lại `/codex computer-use install`.
Lệnh cài đặt của Codex app-server sẽ ghi cấu hình plugin về trạng thái bật.

**Trạng thái báo không hỗ trợ cài đặt từ xa.** Dùng nguồn hoặc đường dẫn
marketplace cục bộ. Có thể kiểm tra các mục catalog chỉ hỗ trợ từ xa, nhưng
không thể cài đặt chúng thông qua API app-server hiện tại.

**Trạng thái báo máy chủ MCP không khả dụng.** Chạy lại cài đặt một lần để các
máy chủ MCP tải lại. Nếu vẫn không khả dụng, hãy sửa ứng dụng Codex Computer Use,
trạng thái MCP của Codex app-server, hoặc quyền trên macOS.

**Trạng thái hoặc một probe hết thời gian chờ trên `computer-use.list_apps`.** Plugin và máy chủ MCP
đều hiện diện, nhưng cầu nối Computer Use cục bộ không phản hồi. Thoát hoặc khởi
động lại Codex Computer Use, mở lại Codex Desktop nếu cần, rồi thử lại trong một
phiên OpenClaw mới. Nếu máy chủ trước đó đã chạy Computer Use thông qua một
Codex app-server được quản lý cũ hơn, hãy làm mới plugin đã cài đặt từ
marketplace đi kèm desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Một công cụ Computer Use báo `Native hook relay unavailable`.** Hook công cụ
gốc của Codex không thể tiếp cận relay OpenClaw đang hoạt động thông qua cầu nối
cục bộ hoặc phương án dự phòng Gateway. Bắt đầu một phiên OpenClaw mới bằng
`/new` hoặc `/reset`. Nếu chạy được một lần rồi lại thất bại ở lần gọi công cụ
sau, `/new` chỉ đang xóa lần thử hiện tại; hãy khởi động lại Codex app-server
hoặc OpenClaw Gateway để loại bỏ các luồng cũ và đăng ký hook cũ, rồi thử lại
trong một phiên mới.

**Tự động cài đặt khi bắt đầu lượt từ chối một nguồn.** Đây là hành vi có chủ ý.
Trước tiên hãy thêm nguồn bằng lệnh tường minh `/codex computer-use install --source <marketplace-source>`,
sau đó các lần tự động cài đặt khi bắt đầu lượt trong tương lai có thể dùng
marketplace cục bộ đã được phát hiện.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)
- [Ứng dụng iOS](/vi/platforms/ios)
