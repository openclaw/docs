---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng các plugin Codex gốc
    - Bạn đang chuyển đổi các Plugin Codex do OpenAI tuyển chọn được cài đặt từ mã nguồn
    - Bạn đang khắc phục sự cố về codexPlugins, kho ứng dụng, các hành động có tính phá hủy hoặc chẩn đoán ứng dụng Plugin
summary: Cấu hình các Plugin Codex gốc đã được di chuyển cho các tác tử OpenClaw ở chế độ Codex
title: Các Plugin Codex gốc
x-i18n:
    generated_at: "2026-05-10T19:42:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Hỗ trợ plugin Codex gốc cho phép một agent OpenClaw ở chế độ Codex sử dụng các khả năng ứng dụng và plugin riêng của Codex app-server trong cùng một luồng Codex xử lý lượt OpenClaw.

OpenClaw không chuyển đổi các plugin Codex thành các công cụ động OpenClaw `codex_plugin_*` giả lập. Các lệnh gọi plugin vẫn nằm trong bản ghi Codex gốc, và Codex app-server sở hữu việc thực thi MCP dựa trên ứng dụng.

Dùng trang này sau khi [Codex harness](/vi/plugins/codex-harness) cơ sở đã hoạt động.

## Yêu cầu

- Runtime của agent OpenClaw được chọn phải là Codex harness gốc.
- `plugins.entries.codex.enabled` phải là true.
- `plugins.entries.codex.config.codexPlugins.enabled` phải là true.
- V1 chỉ hỗ trợ các plugin `openai-curated` mà quá trình di trú đã quan sát thấy là được cài đặt từ nguồn trong thư mục Codex home nguồn.
- Codex app-server đích phải có thể thấy marketplace, plugin và kho ứng dụng dự kiến.

`codexPlugins` không có tác dụng với các lần chạy PI, các lần chạy nhà cung cấp OpenAI thông thường, liên kết hội thoại ACP, hoặc các harness khác vì các đường dẫn đó không tạo luồng Codex app-server với cấu hình `apps` gốc.

## Bắt đầu nhanh

Xem trước quá trình di trú từ Codex home nguồn:

```bash
openclaw migrate codex --dry-run
```

Áp dụng quá trình di trú khi kế hoạch trông đúng:

```bash
openclaw migrate apply codex --yes
```

Quá trình di trú ghi các mục `codexPlugins` tường minh cho các plugin đủ điều kiện và gọi `plugin/install` của Codex app-server cho các plugin đã chọn. Một cấu hình đã di trú điển hình trông như sau:

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

Sau khi thay đổi `codexPlugins`, hãy dùng `/new`, `/reset`, hoặc khởi động lại gateway để các phiên Codex harness trong tương lai bắt đầu với tập ứng dụng đã cập nhật.

## Cách thiết lập plugin gốc hoạt động

Tích hợp này có ba trạng thái riêng biệt:

- Đã cài đặt: Codex có gói plugin cục bộ trong runtime app-server đích.
- Đã bật: Cấu hình OpenClaw sẵn sàng cung cấp plugin cho các lượt Codex harness.
- Có thể truy cập: Codex app-server xác nhận các mục ứng dụng của plugin có sẵn cho tài khoản đang hoạt động và có thể được ánh xạ tới danh tính plugin đã di trú.

Di trú là bước cài đặt/đủ điều kiện bền vững. Kho ứng dụng runtime là bước kiểm tra khả năng truy cập. Sau đó, quá trình thiết lập phiên Codex harness tính toán cấu hình ứng dụng luồng hạn chế cho các ứng dụng plugin đã bật và có thể truy cập.

Cấu hình ứng dụng luồng được tính toán khi OpenClaw thiết lập một phiên Codex harness hoặc thay thế một liên kết luồng Codex đã cũ. Nó không được tính lại ở mọi lượt.

## Ranh giới hỗ trợ V1

V1 được cố ý giữ hẹp:

- Chỉ các plugin `openai-curated` đã được cài đặt trong kho Codex app-server nguồn mới đủ điều kiện di trú.
- Quá trình di trú ghi các danh tính plugin tường minh với `marketplaceName` và `pluginName`; nó không ghi các đường dẫn bộ nhớ đệm `marketplacePath` cục bộ.
- `codexPlugins.enabled` là công tắc bật toàn cục.
- Không có ký tự đại diện `plugins["*"]` và không có khóa cấu hình nào cấp quyền cài đặt tùy ý.
- Các marketplace không được hỗ trợ, gói plugin được lưu đệm, hook và tệp cấu hình Codex được giữ lại trong báo cáo di trú để xem xét thủ công.

## Kho ứng dụng và quyền sở hữu

OpenClaw đọc kho ứng dụng Codex thông qua `app/list` của app-server, lưu đệm trong một giờ và làm mới bất đồng bộ các mục đã cũ hoặc bị thiếu.

Một ứng dụng plugin chỉ được hiển thị khi OpenClaw có thể ánh xạ nó trở lại plugin đã di trú thông qua quyền sở hữu ổn định:

- id ứng dụng chính xác từ chi tiết plugin
- tên máy chủ MCP đã biết
- siêu dữ liệu ổn định duy nhất

Quyền sở hữu chỉ khớp theo tên hiển thị hoặc mơ hồ sẽ bị loại trừ cho đến khi lần làm mới kho tiếp theo chứng minh được quyền sở hữu.

## Cấu hình ứng dụng luồng

OpenClaw chèn bản vá `config.apps` hạn chế cho luồng Codex: `_default` bị tắt và chỉ các ứng dụng thuộc sở hữu của các plugin đã di trú và đã bật mới được bật.

OpenClaw đặt `destructive_enabled` ở cấp ứng dụng từ chính sách `allow_destructive_actions` toàn cục hoặc theo plugin có hiệu lực và để Codex thực thi siêu dữ liệu công cụ phá hủy từ các chú thích công cụ ứng dụng gốc của nó. Cấu hình ứng dụng `_default` bị tắt với `open_world_enabled: false`. Các ứng dụng plugin đã bật được phát ra với `open_world_enabled: true`; OpenClaw không cung cấp một núm chính sách open-world plugin riêng và không duy trì danh sách từ chối tên công cụ phá hủy theo plugin.

Chế độ phê duyệt công cụ mặc định là nhắc cho các ứng dụng plugin vì OpenClaw không có UI gợi mở ứng dụng tương tác trong đường dẫn cùng luồng này.

## Chính sách hành động phá hủy

Các gợi mở plugin phá hủy mặc định thất bại đóng:

- `allow_destructive_actions` toàn cục mặc định là `false`.
- `allow_destructive_actions` theo plugin ghi đè chính sách toàn cục cho plugin đó.
- Khi chính sách là `false`, OpenClaw trả về một từ chối xác định.
- Khi chính sách là `true`, OpenClaw chỉ tự động chấp nhận các schema an toàn mà nó có thể ánh xạ tới một phản hồi phê duyệt, chẳng hạn như trường phê duyệt boolean.
- Thiếu danh tính plugin, quyền sở hữu mơ hồ, thiếu turn id, turn id sai, hoặc schema gợi mở không an toàn đều sẽ từ chối thay vì nhắc.

## Khắc phục sự cố

**`auth_required`:** quá trình di trú đã cài đặt plugin, nhưng một trong các ứng dụng của nó vẫn cần xác thực. Mục plugin tường minh được ghi ở trạng thái tắt cho đến khi bạn cấp lại quyền và bật nó.

**`marketplace_missing` hoặc `plugin_missing`:** Codex app-server đích không thể thấy marketplace hoặc plugin `openai-curated` dự kiến. Chạy lại quá trình di trú với runtime đích hoặc kiểm tra trạng thái plugin của Codex app-server.

**`app_inventory_missing` hoặc `app_inventory_stale`:** trạng thái sẵn sàng của ứng dụng đến từ bộ nhớ đệm rỗng hoặc đã cũ. OpenClaw lên lịch làm mới bất đồng bộ và loại trừ các ứng dụng plugin cho đến khi quyền sở hữu và trạng thái sẵn sàng được biết.

**`app_ownership_ambiguous`:** kho ứng dụng chỉ khớp theo tên hiển thị, nên ứng dụng không được hiển thị cho luồng Codex.

**Cấu hình đã thay đổi nhưng agent không thể thấy plugin:** dùng `/new`, `/reset`, hoặc khởi động lại gateway. Các liên kết luồng Codex hiện có giữ cấu hình ứng dụng mà chúng đã bắt đầu cùng cho đến khi OpenClaw thiết lập một phiên harness mới hoặc thay thế một liên kết đã cũ.

**Hành động phá hủy bị từ chối:** kiểm tra các giá trị `allow_destructive_actions` toàn cục và theo plugin. Ngay cả khi chính sách là true, các schema gợi mở không an toàn và danh tính plugin mơ hồ vẫn thất bại đóng.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Tham chiếu Codex harness](/vi/plugins/codex-harness-reference)
- [Runtime Codex harness](/vi/plugins/codex-harness-runtime)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI di trú](/vi/cli/migrate)
