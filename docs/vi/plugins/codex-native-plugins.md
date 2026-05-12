---
read_when:
    - Bạn muốn các tác tử OpenClaw ở chế độ Codex sử dụng các Plugin Codex gốc
    - Bạn đang di chuyển các Plugin Codex do OpenAI tuyển chọn được cài đặt từ mã nguồn
    - Bạn đang khắc phục sự cố codexPlugins, kiểm kê ứng dụng, hành động có tính phá hủy, hoặc chẩn đoán ứng dụng Plugin
summary: Cấu hình các Plugin Codex gốc đã được di chuyển cho tác nhân OpenClaw ở chế độ Codex
title: Plugin Codex gốc
x-i18n:
    generated_at: "2026-05-12T23:30:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Hỗ trợ plugin Codex gốc cho phép một tác nhân OpenClaw ở chế độ Codex dùng các khả năng app và plugin riêng của app-server Codex bên trong cùng một luồng Codex xử lý lượt OpenClaw.

OpenClaw không dịch các plugin Codex thành công cụ động OpenClaw `codex_plugin_*` tổng hợp. Các lệnh gọi plugin vẫn nằm trong transcript Codex gốc, và app-server Codex sở hữu việc thực thi MCP dựa trên app.

Dùng trang này sau khi [harness Codex](/vi/plugins/codex-harness) cơ sở đã hoạt động.

## Yêu cầu

- Runtime tác nhân OpenClaw được chọn phải là harness Codex gốc.
- `plugins.entries.codex.enabled` phải là true.
- `plugins.entries.codex.config.codexPlugins.enabled` phải là true.
- V1 chỉ hỗ trợ các plugin `openai-curated` mà quá trình di chuyển đã quan sát thấy được cài đặt từ nguồn trong home Codex nguồn.
- App-server Codex đích phải có thể thấy marketplace, plugin và kho app dự kiến.

`codexPlugins` không có hiệu lực với các lần chạy PI, các lần chạy provider OpenAI thông thường, liên kết hội thoại ACP, hoặc các harness khác vì những đường dẫn đó không tạo luồng app-server Codex với cấu hình `apps` gốc.

## Khởi động nhanh

Xem trước quá trình di chuyển từ home Codex nguồn:

```bash
openclaw migrate codex --dry-run
```

Dùng xác minh app nguồn nghiêm ngặt khi bạn muốn quá trình di chuyển kiểm tra khả năng truy cập app nguồn trước khi lập kế hoạch kích hoạt plugin gốc:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Áp dụng quá trình di chuyển khi kế hoạch có vẻ đúng:

```bash
openclaw migrate apply codex --yes
```

Quá trình di chuyển ghi các mục `codexPlugins` rõ ràng cho các plugin đủ điều kiện và gọi `plugin/install` của app-server Codex cho các plugin đã chọn. Một cấu hình đã di chuyển điển hình trông như sau:

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

Sau khi thay đổi `codexPlugins`, dùng `/new`, `/reset`, hoặc khởi động lại gateway để các phiên harness Codex trong tương lai bắt đầu với tập app đã cập nhật.

## Cách thiết lập plugin gốc hoạt động

Tích hợp này có ba trạng thái riêng biệt:

- Đã cài đặt: Codex có gói plugin cục bộ trong runtime app-server đích.
- Đã bật: Cấu hình OpenClaw sẵn sàng cung cấp plugin cho các lượt harness Codex.
- Có thể truy cập: App-server Codex xác nhận các mục app của plugin khả dụng cho tài khoản đang hoạt động và có thể được ánh xạ tới danh tính plugin đã di chuyển.

Di chuyển là bước cài đặt/đủ điều kiện bền vững. Trong khi lập kế hoạch, OpenClaw đọc chi tiết `plugin/read` của Codex nguồn và kiểm tra rằng phản hồi tài khoản app-server Codex nguồn là tài khoản đăng ký ChatGPT. Các phản hồi tài khoản không phải ChatGPT hoặc bị thiếu sẽ bỏ qua plugin dựa trên app với `codex_subscription_required`. Theo mặc định, quá trình di chuyển không gọi `app/list` nguồn; các plugin nguồn dựa trên app vượt qua cổng tài khoản được lập kế hoạch mà không xác minh khả năng truy cập app nguồn, và lỗi vận chuyển khi tra cứu tài khoản sẽ bỏ qua với `codex_account_unavailable`. Với `--verify-plugin-apps`, quá trình di chuyển lấy một snapshot `app/list` nguồn mới và yêu cầu mọi app được sở hữu phải hiện diện, được bật và có thể truy cập trước khi lập kế hoạch kích hoạt gốc. Trong chế độ đó, lỗi vận chuyển khi tra cứu tài khoản rơi xuống cổng kho app nguồn. Kho app runtime là kiểm tra khả năng truy cập của phiên đích sau khi di chuyển. Sau đó, thiết lập phiên harness Codex tính toán cấu hình app luồng hạn chế cho các app plugin đã bật và có thể truy cập.

Cấu hình app luồng được tính toán khi OpenClaw thiết lập một phiên harness Codex hoặc thay thế một liên kết luồng Codex đã cũ. Nó không được tính toán lại ở mọi lượt.

## Ranh giới hỗ trợ V1

V1 được cố ý giữ hẹp:

- Chỉ các plugin `openai-curated` đã được cài đặt trong kho app-server Codex nguồn mới đủ điều kiện di chuyển.
- Plugin nguồn dựa trên app phải vượt qua cổng đăng ký tại thời điểm di chuyển. `--verify-plugin-apps` thêm cổng kho app nguồn. Tài khoản bị chặn bởi đăng ký cộng với, trong chế độ xác minh, app nguồn không thể truy cập, bị tắt, bị thiếu hoặc lỗi làm mới kho app nguồn được báo cáo là các mục thủ công bị bỏ qua thay vì các mục cấu hình đã bật. Chi tiết plugin không đọc được bị bỏ qua trước cổng kho app nguồn.
- Quá trình di chuyển ghi danh tính plugin rõ ràng với `marketplaceName` và `pluginName`; nó không ghi đường dẫn cache `marketplacePath` cục bộ.
- `codexPlugins.enabled` là công tắc bật toàn cục.
- Không có wildcard `plugins["*"]` và không có khóa cấu hình nào cấp quyền cài đặt tùy ý.
- Marketplace không được hỗ trợ, gói plugin đã cache, hook và tệp cấu hình Codex được giữ lại trong báo cáo di chuyển để xem xét thủ công.

## Kho app và quyền sở hữu

OpenClaw đọc kho app Codex qua `app/list` của app-server, cache trong một giờ, và làm mới bất đồng bộ các mục đã cũ hoặc bị thiếu. Cache chỉ nằm trong bộ nhớ; khởi động lại CLI hoặc Gateway sẽ bỏ cache đó, và OpenClaw xây dựng lại từ lần đọc `app/list` tiếp theo.

Di chuyển và runtime dùng các khóa cache riêng:

- Xác minh di chuyển nguồn dùng home Codex nguồn và tùy chọn khởi động app-server nguồn. Việc này chỉ chạy khi đặt `--verify-plugin-apps`, và nó buộc duyệt `app/list` nguồn mới cho lần lập kế hoạch đó.
- Thiết lập runtime đích dùng danh tính app-server Codex của tác nhân đích khi xây dựng cấu hình app luồng Codex. Kích hoạt plugin làm mất hiệu lực khóa cache đích đó rồi buộc làm mới nó sau `plugin/install`.

Một app plugin chỉ được hiển thị khi OpenClaw có thể ánh xạ nó trở lại plugin đã di chuyển thông qua quyền sở hữu ổn định:

- id app chính xác từ chi tiết plugin
- tên máy chủ MCP đã biết
- siêu dữ liệu ổn định duy nhất

Quyền sở hữu chỉ theo tên hiển thị hoặc mơ hồ bị loại trừ cho đến khi lần làm mới kho tiếp theo chứng minh quyền sở hữu.

## Cấu hình app luồng

OpenClaw chèn một bản vá `config.apps` hạn chế cho luồng Codex: `_default` bị tắt và chỉ các app thuộc sở hữu của plugin đã di chuyển và đã bật mới được bật.

OpenClaw đặt `destructive_enabled` ở cấp app từ chính sách `allow_destructive_actions` toàn cục hoặc theo plugin có hiệu lực và để Codex thực thi siêu dữ liệu công cụ phá hủy từ chú thích công cụ app gốc của nó. Cấu hình app `_default` bị tắt với `open_world_enabled: false`. Các app plugin đã bật được phát ra với `open_world_enabled: true`; OpenClaw không hiển thị núm chính sách open-world plugin riêng và không duy trì danh sách từ chối tên công cụ phá hủy theo plugin.

Chế độ phê duyệt công cụ mặc định là tự động cho các app plugin để công cụ đọc không phá hủy có thể chạy mà không cần UI phê duyệt cùng luồng. Công cụ phá hủy vẫn do chính sách `destructive_enabled` của từng app kiểm soát.

## Chính sách hành động phá hủy

Gợi ý phá hủy của plugin được cho phép theo mặc định đối với các plugin Codex đã di chuyển, trong khi schema không an toàn và quyền sở hữu mơ hồ vẫn thất bại đóng:

- `allow_destructive_actions` toàn cục mặc định là `true`.
- `allow_destructive_actions` theo plugin ghi đè chính sách toàn cục cho plugin đó.
- Khi chính sách là `false`, OpenClaw trả về một từ chối xác định.
- Khi chính sách là `true`, OpenClaw chỉ tự động chấp nhận các schema an toàn mà nó có thể ánh xạ tới phản hồi phê duyệt, chẳng hạn như trường phê duyệt boolean.
- Thiếu danh tính plugin, quyền sở hữu mơ hồ, thiếu id lượt, id lượt sai, hoặc schema gợi ý không an toàn sẽ từ chối thay vì nhắc.

## Khắc phục sự cố

**`auth_required`:** quá trình di chuyển đã cài đặt plugin, nhưng một trong các app của nó vẫn cần xác thực. Mục plugin rõ ràng được ghi ở trạng thái tắt cho đến khi bạn ủy quyền lại và bật nó.

**`app_inaccessible`, `app_disabled`, hoặc `app_missing`:**
quá trình di chuyển không cài đặt plugin vì kho app Codex nguồn không hiển thị tất cả app được sở hữu là hiện diện, được bật và có thể truy cập trong khi `--verify-plugin-apps` được đặt. Ủy quyền lại hoặc bật app trong Codex, rồi chạy lại di chuyển với `--verify-plugin-apps`.

**`app_inventory_unavailable`:** quá trình di chuyển không cài đặt plugin vì đã yêu cầu xác minh app nguồn nghiêm ngặt và làm mới kho app Codex nguồn thất bại. Sửa quyền truy cập app-server Codex nguồn hoặc thử lại mà không có `--verify-plugin-apps` nếu bạn chấp nhận kế hoạch nhanh hơn được chặn bởi tài khoản.

**`codex_subscription_required`:** quá trình di chuyển không cài đặt plugin dựa trên app vì tài khoản app-server Codex nguồn không đăng nhập bằng tài khoản đăng ký ChatGPT. Đăng nhập vào app Codex bằng xác thực đăng ký, rồi chạy lại di chuyển.

**`codex_account_unavailable`:** quá trình di chuyển không cài đặt plugin dựa trên app vì không thể đọc tài khoản app-server Codex nguồn. Sửa xác thực app-server Codex nguồn hoặc chạy lại với `--verify-plugin-apps` nếu bạn muốn kho app nguồn quyết định tính đủ điều kiện khi tra cứu tài khoản thất bại.

**`marketplace_missing` hoặc `plugin_missing`:** app-server Codex đích không thể thấy marketplace hoặc plugin `openai-curated` dự kiến. Chạy lại di chuyển đối với runtime đích hoặc kiểm tra trạng thái plugin app-server Codex.

**`app_inventory_missing` hoặc `app_inventory_stale`:** trạng thái sẵn sàng của app đến từ cache rỗng hoặc đã cũ. OpenClaw lên lịch làm mới bất đồng bộ và loại trừ app plugin cho đến khi quyền sở hữu và trạng thái sẵn sàng được biết.

**`app_ownership_ambiguous`:** kho app chỉ khớp theo tên hiển thị, nên app không được hiển thị với luồng Codex.

**Cấu hình đã thay đổi nhưng tác nhân không thể thấy plugin:** dùng `/new`, `/reset`, hoặc khởi động lại gateway. Các liên kết luồng Codex hiện có giữ cấu hình app mà chúng đã bắt đầu cùng cho đến khi OpenClaw thiết lập một phiên harness mới hoặc thay thế một liên kết đã cũ.

**Hành động phá hủy bị từ chối:** kiểm tra các giá trị `allow_destructive_actions` toàn cục và theo plugin. Ngay cả khi chính sách là true, schema gợi ý không an toàn và danh tính plugin mơ hồ vẫn thất bại đóng.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI di chuyển](/vi/cli/migrate)
