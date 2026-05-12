---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng các Plugin Codex gốc
    - Bạn đang di chuyển các Plugin Codex được OpenAI tuyển chọn và cài đặt từ nguồn
    - Bạn đang khắc phục sự cố về codexPlugins, kiểm kê ứng dụng, các hành động phá hủy hoặc chẩn đoán ứng dụng Plugin
summary: Cấu hình các Plugin Codex gốc đã được di chuyển cho các tác nhân OpenClaw ở chế độ Codex
title: Plugin Codex gốc
x-i18n:
    generated_at: "2026-05-12T00:59:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Hỗ trợ plugin Codex gốc cho phép một tác tử OpenClaw ở chế độ Codex sử dụng các khả năng ứng dụng và plugin riêng của app-server Codex bên trong cùng một luồng Codex xử lý lượt OpenClaw.

OpenClaw không chuyển đổi các plugin Codex thành các công cụ động OpenClaw `codex_plugin_*` giả lập. Các lệnh gọi plugin vẫn nằm trong transcript Codex gốc, và app-server Codex sở hữu quá trình thực thi MCP dựa trên ứng dụng.

Dùng trang này sau khi [Codex harness](/vi/plugins/codex-harness) cơ sở đã hoạt động.

## Yêu cầu

- Runtime tác tử OpenClaw được chọn phải là Codex harness gốc.
- `plugins.entries.codex.enabled` phải là true.
- `plugins.entries.codex.config.codexPlugins.enabled` phải là true.
- V1 chỉ hỗ trợ các plugin `openai-curated` mà quá trình di chuyển đã quan sát thấy được cài đặt từ nguồn trong thư mục Codex home nguồn.
- app-server Codex đích phải có thể thấy marketplace, plugin và kho ứng dụng dự kiến.

`codexPlugins` không có hiệu lực với các lần chạy PI, các lần chạy provider OpenAI thông thường, liên kết hội thoại ACP, hoặc các harness khác vì các đường dẫn đó không tạo luồng app-server Codex với cấu hình `apps` gốc.

## Khởi động nhanh

Xem trước quá trình di chuyển từ Codex home nguồn:

```bash
openclaw migrate codex --dry-run
```

Áp dụng quá trình di chuyển khi kế hoạch đã đúng:

```bash
openclaw migrate apply codex --yes
```

Quá trình di chuyển ghi các mục `codexPlugins` tường minh cho các plugin đủ điều kiện và gọi `plugin/install` của app-server Codex cho các plugin đã chọn. Một cấu hình đã di chuyển điển hình trông như sau:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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
- Có thể truy cập: app-server Codex xác nhận các mục ứng dụng của plugin có sẵn cho tài khoản đang hoạt động và có thể được ánh xạ tới danh tính plugin đã di chuyển.

Di chuyển là bước cài đặt/đủ điều kiện bền vững. Kho ứng dụng runtime là bước kiểm tra khả năng truy cập. Sau đó, quá trình thiết lập phiên Codex harness tính toán cấu hình ứng dụng luồng có tính hạn chế cho các ứng dụng plugin đã bật và có thể truy cập.

Cấu hình ứng dụng luồng được tính toán khi OpenClaw thiết lập một phiên Codex harness hoặc thay thế một liên kết luồng Codex đã cũ. Cấu hình này không được tính toán lại ở mỗi lượt.

## Ranh giới hỗ trợ V1

V1 được chủ ý giới hạn hẹp:

- Chỉ các plugin `openai-curated` đã được cài đặt trong kho app-server Codex nguồn mới đủ điều kiện di chuyển.
- Quá trình di chuyển ghi các danh tính plugin tường minh với `marketplaceName` và `pluginName`; nó không ghi các đường dẫn cache `marketplacePath` cục bộ.
- `codexPlugins.enabled` là công tắc bật toàn cục.
- Không có ký tự đại diện `plugins["*"]` và không có khóa cấu hình nào cấp quyền cài đặt tùy ý.
- Các marketplace không được hỗ trợ, gói plugin đã cache, hook và tệp cấu hình Codex được giữ lại trong báo cáo di chuyển để xem xét thủ công.

## Kho ứng dụng và quyền sở hữu

OpenClaw đọc kho ứng dụng Codex thông qua `app/list` của app-server, cache trong một giờ, và làm mới bất đồng bộ các mục đã cũ hoặc bị thiếu.

Một ứng dụng plugin chỉ được hiển thị khi OpenClaw có thể ánh xạ nó trở lại plugin đã di chuyển thông qua quyền sở hữu ổn định:

- ID ứng dụng chính xác từ chi tiết plugin
- tên máy chủ MCP đã biết
- metadata ổn định duy nhất

Quyền sở hữu chỉ theo tên hiển thị hoặc mơ hồ sẽ bị loại trừ cho đến khi lần làm mới kho tiếp theo chứng minh được quyền sở hữu.

## Cấu hình ứng dụng luồng

OpenClaw chèn một bản vá `config.apps` có tính hạn chế cho luồng Codex: `_default` bị tắt và chỉ các ứng dụng thuộc sở hữu của các plugin đã di chuyển đang bật mới được bật.

OpenClaw đặt `destructive_enabled` ở cấp ứng dụng từ chính sách `allow_destructive_actions` toàn cục hoặc theo plugin có hiệu lực và để Codex thực thi metadata công cụ phá hủy từ các chú thích công cụ ứng dụng gốc của nó. Cấu hình ứng dụng `_default` bị tắt với `open_world_enabled: false`. Các ứng dụng plugin được bật sẽ được phát ra với `open_world_enabled: true`; OpenClaw không cung cấp một nút chính sách open-world plugin riêng và không duy trì danh sách chặn tên công cụ phá hủy theo plugin.

Chế độ phê duyệt công cụ mặc định là tự động cho các ứng dụng plugin để các công cụ đọc không phá hủy có thể chạy mà không cần UI phê duyệt trong cùng luồng. Các công cụ phá hủy vẫn do chính sách `destructive_enabled` của từng ứng dụng kiểm soát.

## Chính sách hành động phá hủy

Các elicitation plugin phá hủy được cho phép theo mặc định đối với các plugin Codex đã di chuyển, trong khi schema không an toàn và quyền sở hữu mơ hồ vẫn thất bại đóng:

- `allow_destructive_actions` toàn cục mặc định là `true`.
- `allow_destructive_actions` theo plugin ghi đè chính sách toàn cục cho plugin đó.
- Khi chính sách là `false`, OpenClaw trả về một từ chối xác định.
- Khi chính sách là `true`, OpenClaw chỉ tự động chấp nhận các schema an toàn mà nó có thể ánh xạ tới một phản hồi phê duyệt, chẳng hạn như trường phê duyệt boolean.
- Thiếu danh tính plugin, quyền sở hữu mơ hồ, thiếu ID lượt, ID lượt sai, hoặc schema elicitation không an toàn sẽ từ chối thay vì nhắc người dùng.

## Khắc phục sự cố

**`auth_required`:** quá trình di chuyển đã cài đặt plugin, nhưng một trong các ứng dụng của nó vẫn cần xác thực. Mục plugin tường minh được ghi ở trạng thái tắt cho đến khi bạn cấp quyền lại và bật nó.

**`marketplace_missing` hoặc `plugin_missing`:** app-server Codex đích không thể thấy marketplace hoặc plugin `openai-curated` dự kiến. Chạy lại quá trình di chuyển với runtime đích hoặc kiểm tra trạng thái plugin app-server Codex.

**`app_inventory_missing` hoặc `app_inventory_stale`:** mức sẵn sàng của ứng dụng đến từ cache trống hoặc đã cũ. OpenClaw lên lịch làm mới bất đồng bộ và loại trừ các ứng dụng plugin cho đến khi biết được quyền sở hữu và mức sẵn sàng.

**`app_ownership_ambiguous`:** kho ứng dụng chỉ khớp theo tên hiển thị, vì vậy ứng dụng không được hiển thị cho luồng Codex.

**Cấu hình đã thay đổi nhưng tác tử không thể thấy plugin:** dùng `/new`, `/reset`, hoặc khởi động lại gateway. Các liên kết luồng Codex hiện có giữ cấu hình ứng dụng mà chúng đã bắt đầu cùng cho đến khi OpenClaw thiết lập một phiên harness mới hoặc thay thế một liên kết đã cũ.

**Hành động phá hủy bị từ chối:** kiểm tra các giá trị `allow_destructive_actions` toàn cục và theo plugin. Ngay cả khi chính sách là true, schema elicitation không an toàn và danh tính plugin mơ hồ vẫn thất bại đóng.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Tham chiếu Codex harness](/vi/plugins/codex-harness-reference)
- [Runtime Codex harness](/vi/plugins/codex-harness-runtime)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI di chuyển](/vi/cli/migrate)
