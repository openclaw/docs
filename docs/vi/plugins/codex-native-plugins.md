---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng các Plugin Codex gốc
    - Bạn đang chuyển đổi các Plugin Codex do OpenAI tuyển chọn được cài đặt từ mã nguồn
    - Bạn đang khắc phục sự cố `codexPlugins`, kiểm kê ứng dụng, hành động phá hủy, hoặc chẩn đoán ứng dụng Plugin
summary: Cấu hình các Plugin Codex gốc đã được di chuyển cho các tác nhân OpenClaw ở chế độ Codex
title: Plugin Codex gốc
x-i18n:
    generated_at: "2026-05-11T20:33:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Hỗ trợ Plugin Codex gốc cho phép một agent OpenClaw ở chế độ Codex sử dụng
các khả năng app và Plugin riêng của app-server Codex bên trong cùng luồng Codex
xử lý lượt OpenClaw.

OpenClaw không dịch các Plugin Codex thành các công cụ động OpenClaw
`codex_plugin_*` tổng hợp. Các lệnh gọi Plugin vẫn nằm trong transcript Codex gốc, và
app-server Codex sở hữu việc thực thi MCP do app hậu thuẫn.

Sử dụng trang này sau khi [Codex harness](/vi/plugins/codex-harness) cơ sở hoạt động.

## Yêu cầu

- Runtime agent OpenClaw được chọn phải là Codex harness gốc.
- `plugins.entries.codex.enabled` phải là true.
- `plugins.entries.codex.config.codexPlugins.enabled` phải là true.
- V1 chỉ hỗ trợ các Plugin `openai-curated` mà quá trình di chuyển đã quan sát
  là được cài đặt từ nguồn trong thư mục home Codex nguồn.
- app-server Codex đích phải có thể thấy marketplace, Plugin và kho app dự kiến.

`codexPlugins` không có hiệu lực với các lượt chạy PI, lượt chạy nhà cung cấp OpenAI
thông thường, liên kết hội thoại ACP, hoặc các harness khác vì những đường dẫn đó không tạo
luồng app-server Codex với cấu hình `apps` gốc.

## Khởi động nhanh

Xem trước quá trình di chuyển từ thư mục home Codex nguồn:

```bash
openclaw migrate codex --dry-run
```

Áp dụng quá trình di chuyển khi kế hoạch trông đúng:

```bash
openclaw migrate apply codex --yes
```

Di chuyển ghi các mục `codexPlugins` rõ ràng cho các Plugin đủ điều kiện và gọi
`plugin/install` của app-server Codex cho các Plugin đã chọn. Một cấu hình đã di chuyển
điển hình trông như sau:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Sau khi thay đổi `codexPlugins`, hãy dùng `/new`, `/reset`, hoặc khởi động lại Gateway để
các phiên Codex harness trong tương lai bắt đầu với bộ app đã cập nhật.

## Cách thiết lập Plugin gốc hoạt động

Tích hợp này có ba trạng thái riêng biệt:

- Đã cài đặt: Codex có gói Plugin cục bộ trong runtime app-server đích.
- Đã bật: cấu hình OpenClaw sẵn sàng cung cấp Plugin cho các lượt Codex
  harness.
- Có thể truy cập: app-server Codex xác nhận các mục app của Plugin có sẵn
  cho tài khoản đang hoạt động và có thể được ánh xạ tới danh tính Plugin đã di chuyển.

Di chuyển là bước cài đặt/đủ điều kiện bền vững. Kho app runtime là bước
kiểm tra khả năng truy cập. Sau đó, thiết lập phiên Codex harness tính toán một
cấu hình app luồng hạn chế cho các app Plugin đã bật và có thể truy cập.

Cấu hình app luồng được tính khi OpenClaw thiết lập một phiên Codex harness
hoặc thay thế một liên kết luồng Codex đã lỗi thời. Nó không được tính lại ở mỗi lượt.

## Ranh giới hỗ trợ V1

V1 được chủ ý giữ hẹp:

- Chỉ các Plugin `openai-curated` đã được cài đặt trong kho app-server Codex
  nguồn mới đủ điều kiện di chuyển.
- Di chuyển ghi các danh tính Plugin rõ ràng với `marketplaceName` và
  `pluginName`; nó không ghi các đường dẫn bộ nhớ đệm `marketplacePath` cục bộ.
- `codexPlugins.enabled` là công tắc bật toàn cục.
- Không có ký tự đại diện `plugins["*"]` và không có khóa cấu hình nào cấp quyền
  cài đặt tùy ý.
- Marketplace không được hỗ trợ, gói Plugin được lưu trong bộ nhớ đệm, hook và các tệp cấu hình Codex
  được giữ lại trong báo cáo di chuyển để xem xét thủ công.

## Kho app và quyền sở hữu

OpenClaw đọc kho app Codex thông qua `app/list` của app-server, lưu vào bộ nhớ đệm trong
một giờ, và làm mới bất đồng bộ các mục lỗi thời hoặc bị thiếu.

Một app Plugin chỉ được phơi bày khi OpenClaw có thể ánh xạ nó trở lại Plugin đã di chuyển
thông qua quyền sở hữu ổn định:

- id app chính xác từ chi tiết Plugin
- tên máy chủ MCP đã biết
- metadata ổn định duy nhất

Quyền sở hữu chỉ khớp theo tên hiển thị hoặc mơ hồ sẽ bị loại trừ cho đến khi lần làm mới kho tiếp theo
chứng minh được quyền sở hữu.

## Cấu hình app luồng

OpenClaw chèn một bản vá `config.apps` hạn chế cho luồng Codex:
`_default` bị tắt và chỉ các app do những Plugin đã di chuyển được bật sở hữu mới
được bật.

OpenClaw đặt `destructive_enabled` ở cấp app từ chính sách `allow_destructive_actions`
toàn cục hoặc theo Plugin có hiệu lực và để Codex thực thi metadata công cụ phá hủy
từ các chú thích công cụ app gốc của nó. Cấu hình app `_default`
bị tắt với `open_world_enabled: false`. Các app Plugin đã bật
được xuất ra với `open_world_enabled: true`; OpenClaw không phơi bày một núm chính sách
open-world riêng cho Plugin và không duy trì danh sách từ chối tên công cụ phá hủy
theo Plugin.

Chế độ phê duyệt công cụ mặc định là tự động cho các app Plugin để các công cụ đọc
không phá hủy có thể chạy mà không cần UI phê duyệt trong cùng luồng. Các công cụ phá hủy vẫn
được kiểm soát bởi chính sách `destructive_enabled` của từng app.

## Chính sách hành động phá hủy

Các elicitation Plugin phá hủy mặc định thất bại đóng:

- `allow_destructive_actions` toàn cục mặc định là `false`.
- `allow_destructive_actions` theo Plugin ghi đè chính sách toàn cục cho Plugin đó.
- Khi chính sách là `false`, OpenClaw trả về một từ chối xác định.
- Khi chính sách là `true`, OpenClaw chỉ tự động chấp nhận các schema an toàn mà nó có thể ánh xạ tới
  một phản hồi phê duyệt, chẳng hạn như một trường phê duyệt boolean.
- Danh tính Plugin bị thiếu, quyền sở hữu mơ hồ, id lượt bị thiếu, id lượt sai,
  hoặc schema elicitation không an toàn sẽ bị từ chối thay vì nhắc.

## Khắc phục sự cố

**`auth_required`:** quá trình di chuyển đã cài đặt Plugin, nhưng một trong các app của nó vẫn
cần xác thực. Mục Plugin rõ ràng được ghi ở trạng thái tắt cho đến khi bạn
ủy quyền lại và bật nó.

**`marketplace_missing` hoặc `plugin_missing`:** app-server Codex đích
không thể thấy marketplace hoặc Plugin `openai-curated` dự kiến. Chạy lại di chuyển
với runtime đích hoặc kiểm tra trạng thái Plugin app-server Codex.

**`app_inventory_missing` hoặc `app_inventory_stale`:** mức sẵn sàng của app đến từ một
bộ nhớ đệm rỗng hoặc lỗi thời. OpenClaw lên lịch làm mới bất đồng bộ và loại trừ các app
Plugin cho đến khi quyền sở hữu và mức sẵn sàng được biết.

**`app_ownership_ambiguous`:** kho app chỉ khớp theo tên hiển thị, nên
app không được phơi bày cho luồng Codex.

**Cấu hình đã thay đổi nhưng agent không thể thấy Plugin:** dùng `/new`, `/reset`, hoặc
khởi động lại Gateway. Các liên kết luồng Codex hiện có giữ cấu hình app mà chúng
đã bắt đầu cho đến khi OpenClaw thiết lập một phiên harness mới hoặc thay thế một
liên kết lỗi thời.

**Hành động phá hủy bị từ chối:** kiểm tra các giá trị
`allow_destructive_actions` toàn cục và theo Plugin. Ngay cả khi chính sách là true, các schema elicitation
không an toàn và danh tính Plugin mơ hồ vẫn thất bại đóng.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Tham chiếu Codex harness](/vi/plugins/codex-harness-reference)
- [Runtime Codex harness](/vi/plugins/codex-harness-runtime)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI di chuyển](/vi/cli/migrate)
