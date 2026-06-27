---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng Codex Computer Use
    - Bạn đang lựa chọn giữa Codex Computer Use, PeekabooBridge và MCP cua-driver trực tiếp
    - Bạn đang quyết định giữa Codex Computer Use và một thiết lập MCP cua-driver trực tiếp
    - Bạn đang cấu hình computerUse cho Plugin Codex đi kèm
    - Bạn đang khắc phục sự cố về trạng thái hoặc cài đặt /codex computer-use
summary: Thiết lập Codex Computer Use cho các tác tử OpenClaw ở chế độ Codex
title: Sử dụng máy tính của Codex
x-i18n:
    generated_at: "2026-06-27T17:44:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use là một plugin MCP gốc Codex để điều khiển desktop cục bộ. OpenClaw
không tích hợp sẵn ứng dụng desktop, không tự thực thi hành động desktop, hoặc
vượt qua quyền của Codex. Plugin `codex` đi kèm chỉ chuẩn bị Codex app-server:
nó bật hỗ trợ plugin Codex, tìm hoặc cài đặt plugin Codex Computer Use đã cấu
hình, kiểm tra rằng máy chủ MCP `computer-use` có sẵn, rồi để Codex sở hữu các
lệnh gọi công cụ MCP gốc trong các lượt ở chế độ Codex.

Dùng trang này khi OpenClaw đã dùng harness Codex gốc. Đối với chính phần thiết
lập runtime, xem [harness Codex](/vi/plugins/codex-harness).

## OpenClaw.app và Peekaboo

Tích hợp Peekaboo của OpenClaw.app tách biệt với Codex Computer Use. Ứng dụng
macOS có thể lưu trữ một socket PeekabooBridge để CLI `peekaboo` có thể tái sử
dụng quyền Accessibility và Screen Recording cục bộ của ứng dụng cho các công cụ
tự động hóa riêng của Peekaboo. Cầu nối đó không cài đặt hoặc proxy Codex
Computer Use, và Codex Computer Use không gọi qua socket PeekabooBridge.

Dùng [cầu nối Peekaboo](/vi/platforms/mac/peekaboo) khi bạn muốn OpenClaw.app là
một máy chủ có nhận biết quyền cho tự động hóa Peekaboo CLI. Dùng trang này khi
một agent OpenClaw ở chế độ Codex cần có sẵn plugin MCP `computer-use` gốc của
Codex trước khi lượt bắt đầu.

## Ứng dụng iOS

Ứng dụng iOS tách biệt với Codex Computer Use. Nó không cài đặt hoặc proxy máy
chủ MCP `computer-use` của Codex và không phải là backend điều khiển desktop.
Thay vào đó, ứng dụng iOS kết nối như một node OpenClaw và phơi bày các khả năng
di động thông qua các lệnh node như `canvas.*`, `camera.*`, `screen.*`,
`location.*`, và `talk.*`.

Dùng [iOS](/vi/platforms/ios) khi bạn muốn một agent điều khiển node iPhone thông
qua gateway. Dùng trang này khi một agent ở chế độ Codex cần điều khiển desktop
macOS cục bộ thông qua plugin Computer Use gốc của Codex.

## MCP cua-driver trực tiếp

Codex Computer Use không phải là cách duy nhất để phơi bày điều khiển desktop.
Nếu bạn muốn các runtime do OpenClaw quản lý gọi trực tiếp driver của TryCua,
hãy dùng máy chủ `cua-driver mcp` upstream thông qua sổ đăng ký MCP của
OpenClaw thay vì luồng marketplace dành riêng cho Codex.

Sau khi cài đặt `cua-driver`, hãy yêu cầu nó cung cấp lệnh OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

hoặc tự đăng ký máy chủ stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Đường dẫn đó giữ nguyên bề mặt công cụ MCP upstream, bao gồm các schema driver
và phản hồi MCP có cấu trúc. Dùng nó khi bạn muốn driver CUA có sẵn như một máy
chủ MCP OpenClaw thông thường. Dùng thiết lập Codex Computer Use trên trang này
khi Codex app-server nên sở hữu việc cài đặt plugin, tải lại MCP, và các lệnh
gọi công cụ gốc bên trong các lượt ở chế độ Codex.

Driver của CUA dành riêng cho macOS và vẫn cần các quyền macOS cục bộ mà ứng
dụng của nó nhắc cấp, chẳng hạn như Accessibility và Screen Recording. OpenClaw
không cài đặt `cua-driver`, cấp các quyền đó, hoặc vượt qua mô hình an toàn của
driver upstream.

## Thiết lập nhanh

Đặt `plugins.entries.codex.config.computerUse` khi các lượt ở chế độ Codex phải
có Computer Use trước khi một luồng bắt đầu. `autoInstall: true` chọn dùng
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

Với cấu hình này, OpenClaw kiểm tra Codex app-server trước mỗi lượt ở chế độ
Codex. Nếu thiếu Computer Use nhưng Codex app-server đã phát hiện một
marketplace có thể cài đặt, OpenClaw yêu cầu Codex app-server cài đặt hoặc bật
lại plugin và tải lại các máy chủ MCP. Trên macOS, khi không có marketplace khớp
nào được đăng ký và gói ứng dụng Codex tiêu chuẩn tồn tại, OpenClaw cũng cố gắng
đăng ký marketplace Codex đi kèm từ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` trước khi
báo lỗi. Nếu thiết lập vẫn không thể làm cho máy chủ MCP khả dụng, lượt sẽ thất
bại trước khi luồng bắt đầu.

Sau khi thay đổi cấu hình Computer Use, hãy dùng `/new` hoặc `/reset` trong cuộc
trò chuyện bị ảnh hưởng trước khi kiểm thử nếu một luồng Codex hiện có đã bắt
đầu.

Trên macOS khi khởi động stdio được quản lý, OpenClaw ưu tiên gói ứng dụng
Codex desktop đã ký tại `/Applications/Codex.app/Contents/Resources/codex` khi
nó tồn tại. Điều đó giữ Computer Use dưới gói ứng dụng sở hữu các quyền điều
khiển desktop cục bộ. Nếu ứng dụng desktop chưa được cài đặt, OpenClaw quay về
binary Codex được quản lý đã cài đặt bên cạnh plugin. Nếu một ứng dụng desktop
đã cài đặt khởi tạo với phiên bản app-server không được hỗ trợ, OpenClaw đóng
tiến trình con đó và thử lại ứng viên binary được quản lý tiếp theo thay vì để
một ứng dụng desktop cũ che khuất phương án dự phòng cục bộ của plugin. Cấu
hình `appServer.command` rõ ràng hoặc `OPENCLAW_CODEX_APP_SERVER_BIN` vẫn ghi
đè lựa chọn được quản lý này.

## Lệnh

Dùng các lệnh `/codex computer-use` từ bất kỳ bề mặt chat nào nơi bề mặt lệnh
của plugin `codex` có sẵn. Đây là các lệnh chat/runtime của OpenClaw, không
phải các lệnh con CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` chỉ đọc. Nó không thêm nguồn marketplace, cài đặt plugin, hoặc bật hỗ
trợ plugin Codex. Nếu không có cấu hình nào chọn dùng Computer Use, `status` có
thể báo bị tắt ngay cả sau một lệnh cài đặt một lần.

`install` bật hỗ trợ plugin Codex app-server, tùy chọn thêm một nguồn
marketplace đã cấu hình, cài đặt hoặc bật lại plugin đã cấu hình thông qua
Codex app-server, tải lại các máy chủ MCP, và xác minh rằng máy chủ MCP phơi bày
các công cụ.

## Lựa chọn marketplace

OpenClaw dùng cùng API app-server mà chính Codex phơi bày. Các trường
marketplace chọn nơi Codex nên tìm `computer-use`.

| Trường               | Dùng khi                                                        | Hỗ trợ cài đặt                                          |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Không có trường marketplace | Bạn muốn Codex app-server dùng các marketplace nó đã biết. | Có, khi app-server trả về một marketplace cục bộ.      |
| `marketplaceSource`  | Bạn có một nguồn marketplace Codex mà app-server có thể thêm.   | Có, cho `/codex computer-use install` rõ ràng.         |
| `marketplacePath`    | Bạn đã biết đường dẫn tệp marketplace cục bộ trên host.         | Có, cho cài đặt rõ ràng và tự động cài khi bắt đầu lượt. |
| `marketplaceName`    | Bạn muốn chọn một marketplace đã đăng ký theo tên.              | Chỉ có khi marketplace đã chọn có đường dẫn cục bộ.    |

Các home Codex mới có thể cần một khoảnh khắc ngắn để gieo các marketplace
chính thức của chúng. Trong khi cài đặt, OpenClaw thăm dò `plugin/list` tối đa
`marketplaceDiscoveryTimeoutMs` mili giây. Mặc định là 60 giây.

Nếu nhiều marketplace đã biết chứa Computer Use, OpenClaw ưu tiên
`openai-bundled`, rồi `openai-curated`, rồi `local`. Các kết quả khớp mơ hồ
không xác định sẽ đóng an toàn và yêu cầu bạn đặt `marketplaceName` hoặc
`marketplacePath`.

## Marketplace macOS đi kèm

Các bản dựng Codex desktop gần đây đi kèm Computer Use tại đây:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Khi `computerUse.autoInstall` là true và không có marketplace nào chứa
`computer-use` được đăng ký, OpenClaw cố gắng tự động thêm root marketplace đi
kèm tiêu chuẩn:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bạn cũng có thể đăng ký rõ ràng từ shell với Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Nếu bạn dùng đường dẫn ứng dụng Codex không tiêu chuẩn, hãy chạy `/codex
computer-use install --source <marketplace-root>` một lần hoặc đặt
`computerUse.marketplacePath` thành một đường dẫn tệp marketplace cục bộ. Chỉ
dùng `--marketplace-path` khi bạn có đường dẫn tệp JSON marketplace, không phải
root marketplace đi kèm.

## Giới hạn catalog từ xa

Codex app-server có thể liệt kê và đọc các mục catalog chỉ từ xa, nhưng hiện
không hỗ trợ `plugin/install` từ xa. Điều đó có nghĩa là `marketplaceName` có
thể chọn một marketplace chỉ từ xa cho kiểm tra trạng thái, nhưng cài đặt và bật
lại vẫn cần một marketplace cục bộ thông qua `marketplaceSource` hoặc
`marketplacePath`.

Nếu trạng thái nói plugin có sẵn trong một marketplace Codex từ xa nhưng không
hỗ trợ cài đặt từ xa, hãy chạy cài đặt với một nguồn hoặc đường dẫn cục bộ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Tham chiếu cấu hình

| Trường                          | Mặc định       | Ý nghĩa                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | suy luận       | Yêu cầu Computer Use. Mặc định là true khi trường Computer Use khác được đặt. |
| `autoInstall`                   | false          | Cài đặt hoặc bật lại từ các marketplace đã được phát hiện khi bắt đầu lượt.   |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Thời gian cài đặt chờ Codex app-server phát hiện marketplace.                 |
| `marketplaceSource`             | chưa đặt       | Chuỗi nguồn truyền cho `marketplace/add` của Codex app-server.                |
| `marketplacePath`               | chưa đặt       | Đường dẫn tệp marketplace Codex cục bộ chứa plugin.                           |
| `marketplaceName`               | chưa đặt       | Tên marketplace Codex đã đăng ký để chọn.                                     |
| `pluginName`                    | `computer-use` | Tên plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Tên máy chủ MCP được phơi bày bởi plugin đã cài đặt.                          |

Tự động cài khi bắt đầu lượt cố ý từ chối các giá trị `marketplaceSource` đã cấu
hình. Thêm một nguồn mới là một thao tác thiết lập rõ ràng, vì vậy hãy dùng
`/codex computer-use install --source <marketplace-source>` một lần, rồi để
`autoInstall` xử lý các lần bật lại sau này từ các marketplace cục bộ đã phát
hiện. Tự động cài khi bắt đầu lượt có thể dùng một `marketplacePath` đã cấu
hình, vì đó đã là một đường dẫn cục bộ trên host.

## OpenClaw kiểm tra gì

OpenClaw báo cáo nội bộ một lý do thiết lập ổn định và định dạng trạng thái
hướng tới người dùng cho chat:

| Lý do                        | Ý nghĩa                                                | Bước tiếp theo                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` được phân giải thành false.      | Đặt `enabled` hoặc một trường Computer Use khác. |
| `marketplace_missing`        | Không có marketplace khớp nào khả dụng.               | Cấu hình nguồn, đường dẫn hoặc tên marketplace. |
| `plugin_not_installed`       | Marketplace tồn tại, nhưng plugin chưa được cài đặt.  | Chạy cài đặt hoặc bật `autoInstall`.          |
| `plugin_disabled`            | Plugin đã được cài đặt nhưng bị tắt trong cấu hình Codex. | Chạy cài đặt để bật lại plugin đó.            |
| `remote_install_unsupported` | Marketplace đã chọn chỉ hỗ trợ từ xa.                  | Dùng `marketplaceSource` hoặc `marketplacePath`. |
| `mcp_missing`                | Plugin đã bật, nhưng máy chủ MCP không khả dụng.       | Kiểm tra Codex Computer Use và quyền của hệ điều hành. |
| `ready`                      | Plugin và công cụ MCP khả dụng.                       | Bắt đầu lượt ở chế độ Codex.                  |
| `check_failed`               | Một yêu cầu tới máy chủ ứng dụng Codex bị lỗi trong quá trình kiểm tra trạng thái. | Kiểm tra kết nối và nhật ký của máy chủ ứng dụng. |
| `auto_install_blocked`       | Thiết lập khi bắt đầu lượt sẽ cần thêm một nguồn mới.  | Chạy cài đặt tường minh trước.                |

Đầu ra trò chuyện bao gồm trạng thái plugin, trạng thái máy chủ MCP, marketplace, công cụ
khi khả dụng, và thông báo cụ thể cho bước thiết lập bị lỗi.

## Quyền trên macOS

Computer Use dành riêng cho macOS. Máy chủ MCP do Codex sở hữu có thể cần quyền
hệ điều hành cục bộ trước khi có thể kiểm tra hoặc điều khiển ứng dụng. Nếu OpenClaw cho biết Computer Use
đã được cài đặt nhưng máy chủ MCP không khả dụng, hãy xác minh thiết lập Computer
Use phía Codex trước:

- Máy chủ ứng dụng Codex đang chạy trên cùng máy chủ nơi việc điều khiển màn hình nền sẽ
  diễn ra.
- Plugin Computer Use đã được bật trong cấu hình Codex.
- Máy chủ MCP `computer-use` xuất hiện trong trạng thái MCP của máy chủ ứng dụng Codex.
- macOS đã cấp các quyền cần thiết cho ứng dụng điều khiển màn hình nền.
- Phiên máy chủ hiện tại có thể truy cập màn hình nền đang được điều khiển.

OpenClaw cố ý chặn an toàn khi `computerUse.enabled` là true. Một lượt ở chế độ
Codex không nên âm thầm tiếp tục nếu thiếu các công cụ màn hình nền gốc
mà cấu hình yêu cầu.

## Khắc phục sự cố

**Trạng thái cho biết chưa được cài đặt.** Chạy `/codex computer-use install`. Nếu
không phát hiện được marketplace, hãy truyền `--source` hoặc `--marketplace-path`.

**Trạng thái cho biết đã cài đặt nhưng bị tắt.** Chạy lại `/codex computer-use install`.
Quá trình cài đặt của máy chủ ứng dụng Codex ghi cấu hình plugin trở lại trạng thái bật.

**Trạng thái cho biết không hỗ trợ cài đặt từ xa.** Dùng nguồn hoặc đường dẫn marketplace cục bộ.
Các mục danh mục chỉ từ xa có thể được kiểm tra nhưng không thể cài đặt qua
API máy chủ ứng dụng hiện tại.

**Trạng thái cho biết máy chủ MCP không khả dụng.** Chạy lại cài đặt một lần để các máy chủ
MCP tải lại. Nếu vẫn không khả dụng, hãy sửa ứng dụng Codex Computer Use,
trạng thái MCP của máy chủ ứng dụng Codex, hoặc quyền macOS.

**Trạng thái hoặc một phép dò hết thời gian chờ trên `computer-use.list_apps`.** Plugin và máy chủ MCP
đã có, nhưng cầu nối Computer Use cục bộ không phản hồi. Thoát hoặc
khởi động lại Codex Computer Use, khởi chạy lại Codex Desktop nếu cần, rồi thử lại trong một
phiên OpenClaw mới. Nếu máy chủ trước đó đã chạy Computer Use thông qua một
máy chủ ứng dụng Codex được quản lý cũ hơn, hãy làm mới plugin đã cài đặt từ marketplace
đóng gói cùng ứng dụng desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Một công cụ Computer Use báo `Native hook relay unavailable`.** Hook công cụ gốc của Codex
không thể kết nối tới relay OpenClaw đang hoạt động qua cầu nối cục bộ hoặc
phương án dự phòng Gateway. Bắt đầu một phiên OpenClaw mới bằng `/new` hoặc `/reset`. Nếu nó
hoạt động một lần rồi lại lỗi ở lần gọi công cụ sau đó, `/new` chỉ đang xóa
lần thử hiện tại; hãy khởi động lại máy chủ ứng dụng Codex hoặc OpenClaw Gateway để các luồng cũ
và đăng ký hook bị loại bỏ, rồi thử lại trong một phiên mới.

**Tự động cài đặt khi bắt đầu lượt từ chối một nguồn.** Đây là hành vi có chủ đích. Trước tiên hãy thêm
nguồn bằng lệnh `/codex computer-use install --source <marketplace-source>` tường minh,
sau đó những lần tự động cài đặt khi bắt đầu lượt trong tương lai có thể dùng marketplace cục bộ
đã phát hiện.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)
- [Ứng dụng iOS](/vi/platforms/ios)
