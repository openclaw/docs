---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng các Plugin Codex gốc
    - Bạn đang di chuyển các plugin Codex do OpenAI tuyển chọn được cài đặt từ mã nguồn
    - Bạn đang khắc phục sự cố codexPlugins, kiểm kê ứng dụng, hành động có tính phá hủy hoặc chẩn đoán ứng dụng Plugin
summary: Cấu hình các Plugin Codex gốc đã di chuyển cho các tác tử OpenClaw ở chế độ Codex
title: Plugin Codex gốc
x-i18n:
    generated_at: "2026-07-02T01:02:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Hỗ trợ Plugin Codex gốc cho phép một agent OpenClaw ở chế độ Codex sử dụng các năng lực ứng dụng và Plugin riêng của app-server Codex trong cùng một luồng Codex xử lý lượt OpenClaw.

OpenClaw không chuyển đổi các Plugin Codex thành các công cụ động OpenClaw `codex_plugin_*` tổng hợp. Các lệnh gọi Plugin vẫn nằm trong bản ghi Codex gốc, và app-server Codex sở hữu việc thực thi MCP do ứng dụng hậu thuẫn.

Sử dụng trang này sau khi [Codex harness](/vi/plugins/codex-harness) cơ sở đã hoạt động.

## Yêu cầu

- Runtime của agent OpenClaw đã chọn phải là Codex harness gốc.
- `plugins.entries.codex.enabled` phải là true.
- `plugins.entries.codex.config.codexPlugins.enabled` phải là true.
- V1 chỉ hỗ trợ các Plugin `openai-curated` mà quá trình di chuyển đã quan sát thấy là được cài đặt từ nguồn trong thư mục home Codex nguồn.
- App-server Codex đích phải có thể thấy marketplace, Plugin và danh mục ứng dụng dự kiến.

`codexPlugins` không có hiệu lực với các lượt chạy OpenClaw, các lượt chạy nhà cung cấp OpenAI thông thường, các ràng buộc cuộc hội thoại ACP hoặc các harness khác vì các đường dẫn đó không tạo luồng app-server Codex với cấu hình `apps` gốc.

Quyền truy cập Codex phía OpenAI, tính khả dụng của ứng dụng, và các kiểm soát ứng dụng/Plugin trong workspace đến từ tài khoản Codex đã đăng nhập. Để biết mô hình tài khoản OpenAI và quản trị, xem [Sử dụng Codex với gói ChatGPT của bạn](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Bắt đầu nhanh

Xem trước quá trình di chuyển từ thư mục home Codex nguồn:

```bash
openclaw migrate codex --dry-run
```

Dùng xác minh ứng dụng nguồn nghiêm ngặt khi bạn muốn quá trình di chuyển kiểm tra khả năng truy cập ứng dụng nguồn trước khi lập kế hoạch kích hoạt Plugin gốc:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Áp dụng quá trình di chuyển khi kế hoạch trông đúng:

```bash
openclaw migrate apply codex --yes
```

Quá trình di chuyển ghi các mục `codexPlugins` tường minh cho các Plugin đủ điều kiện và gọi `plugin/install` của app-server Codex cho các Plugin đã chọn. Một cấu hình đã di chuyển điển hình trông như sau:

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

Sau khi thay đổi `codexPlugins`, các cuộc hội thoại Codex mới tự động nhận bộ ứng dụng đã cập nhật. Dùng `/new` hoặc `/reset` để làm mới cuộc hội thoại hiện tại. Không cần khởi động lại gateway để bật hoặc tắt Plugin.

## Quản lý Plugin từ chat

Dùng `/codex plugins` khi bạn muốn kiểm tra hoặc thay đổi các Plugin Codex gốc đã cấu hình từ cùng cuộc chat nơi bạn vận hành Codex harness:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` là bí danh của `/codex plugins list`. Đầu ra danh sách hiển thị các khóa Plugin đã cấu hình, trạng thái bật/tắt, tên Plugin Codex và marketplace từ `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` và `disable` chỉ ghi vào cấu hình OpenClaw tại `~/.openclaw/openclaw.json`; chúng không chỉnh sửa `~/.codex/config.toml` hoặc cài đặt Plugin Codex mới. Chỉ chủ sở hữu hoặc một gateway client có phạm vi `operator.admin` mới có thể thay đổi trạng thái Plugin.

Bật một Plugin đã cấu hình cũng bật công tắc toàn cục `codexPlugins.enabled`. Nếu Plugin được ghi ở trạng thái tắt vì quá trình di chuyển trả về `auth_required`, hãy ủy quyền lại ứng dụng trong Codex trước khi bật nó trong OpenClaw.

## Cách thiết lập Plugin gốc hoạt động

Tích hợp này có ba trạng thái riêng biệt:

- Đã cài đặt: Codex có gói Plugin cục bộ trong runtime app-server đích.
- Đã bật: Cấu hình OpenClaw sẵn sàng cung cấp Plugin cho các lượt Codex harness.
- Có thể truy cập: App-server Codex xác nhận các mục ứng dụng của Plugin khả dụng cho tài khoản đang hoạt động và có thể ánh xạ đến danh tính Plugin đã di chuyển.

Quá trình di chuyển là bước cài đặt/đủ điều kiện bền vững. Trong khi lập kế hoạch, OpenClaw đọc chi tiết `plugin/read` của Codex nguồn và kiểm tra rằng phản hồi tài khoản app-server Codex nguồn là tài khoản đăng ký ChatGPT. Các phản hồi tài khoản không phải ChatGPT hoặc bị thiếu sẽ bỏ qua các Plugin do ứng dụng hậu thuẫn với `codex_subscription_required`. Theo mặc định, quá trình di chuyển không gọi `app/list` nguồn; các Plugin nguồn do ứng dụng hậu thuẫn vượt qua cổng tài khoản sẽ được lập kế hoạch mà không xác minh khả năng truy cập ứng dụng nguồn, và lỗi truyền tải tra cứu tài khoản sẽ bỏ qua với `codex_account_unavailable`. Với `--verify-plugin-apps`, quá trình di chuyển lấy ảnh chụp `app/list` nguồn mới và yêu cầu mọi ứng dụng được sở hữu phải hiện diện, được bật và có thể truy cập trước khi lập kế hoạch kích hoạt gốc. Ở chế độ đó, lỗi truyền tải tra cứu tài khoản sẽ chuyển tiếp sang cổng danh mục ứng dụng nguồn. Danh mục ứng dụng runtime là kiểm tra khả năng truy cập phiên đích sau khi di chuyển. Sau đó, thiết lập phiên Codex harness tính toán cấu hình ứng dụng luồng hạn chế cho các ứng dụng Plugin đã bật và có thể truy cập.

Cấu hình ứng dụng luồng được tính khi OpenClaw thiết lập một phiên Codex harness hoặc thay thế một ràng buộc luồng Codex đã cũ. Cấu hình này không được tính lại ở mọi lượt, vì vậy `/codex plugins enable` và `/codex plugins disable` ảnh hưởng đến các cuộc hội thoại Codex mới. Dùng `/new` hoặc `/reset` khi cuộc hội thoại hiện tại cần nhận bộ ứng dụng đã cập nhật.

## Ranh giới hỗ trợ V1

V1 được cố ý giới hạn hẹp:

- Chỉ các Plugin `openai-curated` đã được cài đặt trong danh mục app-server Codex nguồn mới đủ điều kiện di chuyển.
- Các Plugin nguồn do ứng dụng hậu thuẫn phải vượt qua cổng đăng ký tại thời điểm di chuyển. `--verify-plugin-apps` thêm cổng danh mục ứng dụng nguồn. Các tài khoản bị chặn bởi đăng ký cộng với, trong chế độ xác minh, ứng dụng nguồn không thể truy cập, bị tắt, bị thiếu hoặc lỗi làm mới danh mục ứng dụng nguồn sẽ được báo cáo là các mục thủ công bị bỏ qua thay vì các mục cấu hình đã bật. Chi tiết Plugin không đọc được sẽ bị bỏ qua trước cổng danh mục ứng dụng nguồn.
- Quá trình di chuyển ghi danh tính Plugin tường minh với `marketplaceName` và `pluginName`; nó không ghi các đường dẫn cache `marketplacePath` cục bộ.
- `codexPlugins.enabled` là công tắc bật toàn cục.
- Không có ký tự đại diện `plugins["*"]` và không có khóa cấu hình nào cấp quyền cài đặt tùy ý.
- Marketplace không được hỗ trợ, gói Plugin đã cache, hook và tệp cấu hình Codex được giữ lại trong báo cáo di chuyển để xem xét thủ công.

## Danh mục ứng dụng và quyền sở hữu

OpenClaw đọc danh mục ứng dụng Codex qua `app/list` của app-server, cache trong một giờ, và làm mới các mục đã cũ hoặc bị thiếu theo cách bất đồng bộ. Cache chỉ nằm trong bộ nhớ; khởi động lại CLI hoặc gateway sẽ loại bỏ cache đó, và OpenClaw xây dựng lại từ lần đọc `app/list` tiếp theo.

Quá trình di chuyển và runtime dùng các khóa cache riêng:

- Xác minh di chuyển nguồn dùng thư mục home Codex nguồn và các tùy chọn khởi động app-server nguồn. Việc này chỉ chạy khi `--verify-plugin-apps` được đặt, và nó buộc duyệt `app/list` nguồn mới cho lượt lập kế hoạch đó.
- Thiết lập runtime đích dùng danh tính app-server Codex của agent đích khi xây dựng cấu hình ứng dụng luồng Codex. Kích hoạt Plugin làm mất hiệu lực khóa cache đích đó rồi buộc làm mới nó sau `plugin/install`.

Một ứng dụng Plugin chỉ được hiển thị khi OpenClaw có thể ánh xạ nó ngược về Plugin đã di chuyển thông qua quyền sở hữu ổn định:

- id ứng dụng chính xác từ chi tiết Plugin
- tên máy chủ MCP đã biết
- siêu dữ liệu ổn định và duy nhất

Quyền sở hữu chỉ theo tên hiển thị hoặc mơ hồ bị loại trừ cho đến khi lần làm mới danh mục tiếp theo chứng minh quyền sở hữu.

## Cấu hình ứng dụng luồng

OpenClaw chèn bản vá `config.apps` hạn chế cho luồng Codex: `_default` bị tắt và chỉ các ứng dụng thuộc sở hữu của các Plugin đã di chuyển và đã bật mới được bật.

OpenClaw đặt `destructive_enabled` ở cấp ứng dụng từ chính sách `allow_destructive_actions` toàn cục hoặc theo Plugin có hiệu lực, và để Codex thực thi siêu dữ liệu công cụ phá hủy từ các chú thích công cụ ứng dụng gốc của nó. `true`, `"auto"` và `"ask"` đặt `destructive_enabled: true`; `false` đặt giá trị đó là false. Cấu hình ứng dụng `_default` bị tắt với `open_world_enabled: false`. Các ứng dụng Plugin đã bật được phát ra với `open_world_enabled: true`; OpenClaw không hiển thị một nút chính sách open-world Plugin riêng và không duy trì danh sách từ chối tên công cụ phá hủy theo Plugin.

Chế độ phê duyệt công cụ mặc định là tự động cho các ứng dụng Plugin để các công cụ đọc không phá hủy có thể chạy mà không cần UI phê duyệt trong cùng luồng. Các công cụ phá hủy vẫn được kiểm soát bởi chính sách `destructive_enabled` của từng ứng dụng.

## Chính sách hành động phá hủy

Các yêu cầu khơi gợi Plugin phá hủy được cho phép theo mặc định đối với các Plugin Codex đã di chuyển, trong khi schema không an toàn và quyền sở hữu mơ hồ vẫn đóng khi lỗi:

- `allow_destructive_actions` toàn cục mặc định là `true`.
- `allow_destructive_actions` theo Plugin ghi đè chính sách toàn cục cho Plugin đó.
- Khi chính sách là `false`, OpenClaw trả về một từ chối tất định.
- Khi chính sách là `true`, OpenClaw chỉ tự động chấp nhận các schema an toàn mà nó có thể ánh xạ tới phản hồi phê duyệt, chẳng hạn như một trường phê duyệt boolean.
- Khi chính sách là `"auto"`, OpenClaw hiển thị các hành động Plugin phá hủy cho Codex nhưng chuyển các yêu cầu khơi gợi phê duyệt MCP đã chứng minh quyền sở hữu thành phê duyệt Plugin OpenClaw trước khi trả về phản hồi phê duyệt Codex.
- Khi chính sách là `"ask"`, OpenClaw dùng cùng cơ chế chặn ghi/phá hủy Codex như `"auto"`, xóa các ghi đè phê duyệt theo công cụ bền vững của Codex cho ứng dụng trước khi luồng bắt đầu, và chỉ cung cấp phê duyệt hoặc từ chối một lần để các phê duyệt bền vững không thể chặn các lời nhắc hành động ghi sau này.
- Với mỗi ứng dụng được chấp nhận dùng `"ask"`, OpenClaw chọn reviewer phê duyệt con người của Codex cho ứng dụng đó để Codex gửi các yêu cầu khơi gợi phê duyệt của nó tới OpenClaw. Các ứng dụng khác và phê duyệt luồng không thuộc ứng dụng giữ reviewer và chính sách đã cấu hình của chúng.
- Danh tính Plugin bị thiếu, quyền sở hữu mơ hồ, id lượt bị thiếu, id lượt sai hoặc schema yêu cầu khơi gợi không an toàn sẽ bị từ chối thay vì nhắc.

## Khắc phục sự cố

**`auth_required`:** quá trình di chuyển đã cài đặt Plugin, nhưng một trong các ứng dụng của nó vẫn cần xác thực. Mục Plugin tường minh được ghi ở trạng thái tắt cho đến khi bạn ủy quyền lại và bật nó.

**`app_inaccessible`, `app_disabled`, hoặc `app_missing`:**
quá trình di chuyển không cài đặt Plugin vì danh mục ứng dụng Codex nguồn không cho thấy tất cả ứng dụng được sở hữu là hiện diện, được bật và có thể truy cập trong khi `--verify-plugin-apps` được đặt. Ủy quyền lại hoặc bật ứng dụng trong Codex, rồi chạy lại quá trình di chuyển với `--verify-plugin-apps`.

**`app_inventory_unavailable`:** quá trình di chuyển không cài đặt Plugin vì xác minh ứng dụng nguồn nghiêm ngặt đã được yêu cầu và làm mới danh mục ứng dụng Codex nguồn thất bại. Sửa quyền truy cập app-server Codex nguồn hoặc thử lại không dùng `--verify-plugin-apps` nếu bạn chấp nhận kế hoạch nhanh hơn được chặn theo tài khoản.

**`codex_subscription_required`:** quá trình di chuyển không cài đặt Plugin do ứng dụng hậu thuẫn vì tài khoản app-server Codex nguồn không đăng nhập bằng tài khoản đăng ký ChatGPT. Đăng nhập vào ứng dụng Codex bằng xác thực đăng ký, rồi chạy lại quá trình di chuyển.

**`codex_account_unavailable`:** quá trình di chuyển không cài đặt Plugin do ứng dụng hậu thuẫn vì không thể đọc tài khoản app-server Codex nguồn. Sửa xác thực app-server Codex nguồn hoặc chạy lại với `--verify-plugin-apps` nếu bạn muốn danh mục ứng dụng nguồn quyết định tính đủ điều kiện khi tra cứu tài khoản thất bại.

**`marketplace_missing` hoặc `plugin_missing`:** app-server Codex đích không thể thấy marketplace hoặc Plugin `openai-curated` dự kiến. Chạy lại quá trình di chuyển với runtime đích hoặc kiểm tra trạng thái Plugin của app-server Codex.

**`app_inventory_missing` hoặc `app_inventory_stale`:** mức sẵn sàng ứng dụng đến từ cache trống hoặc đã cũ. OpenClaw lên lịch làm mới bất đồng bộ và loại trừ các ứng dụng Plugin cho đến khi quyền sở hữu và mức sẵn sàng được biết.

**`app_ownership_ambiguous`:** danh mục ứng dụng chỉ khớp theo tên hiển thị, nên ứng dụng không được hiển thị cho luồng Codex.

**Cấu hình đã thay đổi nhưng tác tử không thể thấy Plugin:** dùng `/codex plugins
list` để xác nhận trạng thái đã cấu hình, rồi dùng `/new` hoặc `/reset`. Các
liên kết luồng Codex hiện có giữ cấu hình ứng dụng mà chúng đã khởi đầu cho đến khi OpenClaw
thiết lập một phiên harness mới hoặc thay thế một liên kết đã lỗi thời.

**Hành động phá hủy bị từ chối:** kiểm tra các giá trị
`allow_destructive_actions` toàn cục và theo từng Plugin. Ngay cả khi chính sách là true, `"auto"`, hoặc
`"ask"`, các schema gợi hỏi không an toàn và danh tính Plugin mơ hồ vẫn bị
đóng theo hướng an toàn.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#codex-harness-plugin-config)
- [Di chuyển CLI](/vi/cli/migrate)
