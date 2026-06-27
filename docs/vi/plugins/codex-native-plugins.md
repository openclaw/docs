---
read_when:
    - Bạn muốn các agent OpenClaw ở chế độ Codex sử dụng Plugin Codex gốc
    - Bạn đang di chuyển các Plugin Codex do openai tuyển chọn được cài đặt từ mã nguồn
    - Bạn đang khắc phục sự cố codexPlugins, kiểm kê ứng dụng, hành động phá hủy hoặc chẩn đoán ứng dụng Plugin
summary: Cấu hình các Plugin Codex gốc đã di chuyển cho tác tử OpenClaw ở chế độ Codex
title: Plugin Codex gốc
x-i18n:
    generated_at: "2026-06-27T17:45:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Hỗ trợ Plugin Codex gốc cho phép một agent OpenClaw ở chế độ Codex sử dụng các
khả năng ứng dụng và Plugin riêng của app-server Codex bên trong cùng luồng
Codex xử lý lượt OpenClaw.

OpenClaw không dịch các Plugin Codex thành các công cụ động OpenClaw
`codex_plugin_*` giả lập. Các lệnh gọi Plugin vẫn nằm trong bản ghi Codex gốc,
và app-server Codex sở hữu việc thực thi MCP dựa trên ứng dụng.

Sử dụng trang này sau khi [harness Codex](/vi/plugins/codex-harness) cơ bản đã hoạt động.

## Yêu cầu

- Runtime agent OpenClaw được chọn phải là harness Codex gốc.
- `plugins.entries.codex.enabled` phải là true.
- `plugins.entries.codex.config.codexPlugins.enabled` phải là true.
- V1 chỉ hỗ trợ các Plugin `openai-curated` mà migration đã quan sát thấy là
  được cài đặt từ nguồn trong thư mục home Codex nguồn.
- App-server Codex đích phải có thể nhìn thấy marketplace, Plugin và kho ứng dụng dự kiến.

`codexPlugins` không ảnh hưởng đến các lần chạy OpenClaw, các lần chạy provider OpenAI
thông thường, liên kết hội thoại ACP, hoặc các harness khác vì những đường dẫn đó không tạo
luồng app-server Codex với cấu hình `apps` gốc.

Quyền truy cập Codex phía OpenAI, tính khả dụng của ứng dụng, và các điều khiển
ứng dụng/Plugin trong workspace đến từ tài khoản Codex đã đăng nhập. Đối với tài khoản OpenAI
và mô hình quản trị, xem [Sử dụng Codex với gói ChatGPT của bạn](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Khởi động nhanh

Xem trước migration từ thư mục home Codex nguồn:

```bash
openclaw migrate codex --dry-run
```

Dùng xác minh ứng dụng nguồn nghiêm ngặt khi bạn muốn migration kiểm tra khả năng truy cập
ứng dụng nguồn trước khi lập kế hoạch kích hoạt Plugin gốc:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Áp dụng migration khi kế hoạch trông đúng:

```bash
openclaw migrate apply codex --yes
```

Migration ghi các mục `codexPlugins` rõ ràng cho các Plugin đủ điều kiện và gọi
`plugin/install` của app-server Codex cho các Plugin được chọn. Một cấu hình đã migration
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

Sau khi thay đổi `codexPlugins`, các cuộc hội thoại Codex mới sẽ tự động nhận bộ ứng dụng
đã cập nhật. Dùng `/new` hoặc `/reset` để làm mới cuộc hội thoại hiện tại.
Không cần khởi động lại gateway cho các thay đổi bật hoặc tắt Plugin.

## Quản lý Plugin từ cuộc trò chuyện

Dùng `/codex plugins` khi bạn muốn kiểm tra hoặc thay đổi các Plugin Codex gốc
đã cấu hình từ cùng cuộc trò chuyện nơi bạn vận hành harness Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` là bí danh của `/codex plugins list`. Kết quả danh sách hiển thị
các khóa Plugin đã cấu hình, trạng thái bật/tắt, tên Plugin Codex, và marketplace
từ `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` và `disable` chỉ ghi vào cấu hình OpenClaw tại
`~/.openclaw/openclaw.json`; chúng không chỉnh sửa `~/.codex/config.toml` hoặc cài đặt
Plugin Codex mới. Chỉ chủ sở hữu hoặc gateway client có phạm vi
`operator.admin` mới có thể thay đổi trạng thái Plugin.

Bật một Plugin đã cấu hình cũng bật công tắc toàn cục
`codexPlugins.enabled`. Nếu Plugin được ghi ở trạng thái tắt vì migration trả về
`auth_required`, hãy cấp quyền lại cho ứng dụng trong Codex trước khi bật
nó trong OpenClaw.

## Cách thiết lập Plugin gốc hoạt động

Tích hợp này có ba trạng thái riêng biệt:

- Đã cài đặt: Codex có gói Plugin cục bộ trong runtime app-server đích.
- Đã bật: Cấu hình OpenClaw sẵn sàng cung cấp Plugin cho các lượt harness Codex.
- Có thể truy cập: app-server Codex xác nhận các mục ứng dụng của Plugin có sẵn
  cho tài khoản đang hoạt động và có thể được ánh xạ tới danh tính Plugin đã migration.

Migration là bước cài đặt/đủ điều kiện bền vững. Trong quá trình lập kế hoạch, OpenClaw
đọc chi tiết `plugin/read` của Codex nguồn và kiểm tra phản hồi tài khoản app-server
Codex nguồn là tài khoản đăng ký ChatGPT. Các phản hồi tài khoản không phải ChatGPT hoặc
bị thiếu sẽ bỏ qua các Plugin dựa trên ứng dụng với
`codex_subscription_required`. Theo mặc định, migration không gọi
`app/list` nguồn; các Plugin nguồn dựa trên ứng dụng vượt qua cổng tài khoản sẽ được lập kế hoạch
mà không xác minh khả năng truy cập ứng dụng nguồn, và lỗi truyền tải tra cứu tài khoản
sẽ bỏ qua với `codex_account_unavailable`. Với `--verify-plugin-apps`,
migration lấy một snapshot `app/list` nguồn mới và yêu cầu mọi ứng dụng sở hữu
phải hiện diện, được bật, và có thể truy cập trước khi lập kế hoạch kích hoạt gốc. Trong
chế độ đó, lỗi truyền tải tra cứu tài khoản sẽ chuyển tiếp sang cổng kho ứng dụng
nguồn. Kho ứng dụng runtime là kiểm tra khả năng truy cập của phiên đích
sau migration. Sau đó, thiết lập phiên harness Codex tính toán một cấu hình ứng dụng luồng
hạn chế cho các ứng dụng Plugin đã bật và có thể truy cập.

Cấu hình ứng dụng luồng được tính toán khi OpenClaw thiết lập một phiên harness Codex
hoặc thay thế một liên kết luồng Codex đã cũ. Nó không được tính lại ở mỗi lượt, vì vậy
`/codex plugins enable` và `/codex plugins disable` ảnh hưởng đến các cuộc hội thoại
Codex mới. Dùng `/new` hoặc `/reset` khi cuộc hội thoại hiện tại cần nhận
bộ ứng dụng đã cập nhật.

## Ranh giới hỗ trợ V1

V1 được cố ý giới hạn hẹp:

- Chỉ các Plugin `openai-curated` đã được cài đặt trong kho app-server Codex
  nguồn mới đủ điều kiện migration.
- Các Plugin nguồn dựa trên ứng dụng phải vượt qua cổng đăng ký tại thời điểm migration.
  `--verify-plugin-apps` thêm cổng kho ứng dụng nguồn. Các tài khoản bị chặn bởi đăng ký
  cộng với, trong chế độ xác minh, các ứng dụng nguồn không thể truy cập, bị tắt, bị thiếu
  hoặc lỗi làm mới kho ứng dụng nguồn được báo cáo là các mục thủ công bị bỏ qua
  thay vì các mục cấu hình đã bật. Chi tiết Plugin không đọc được sẽ bị bỏ qua
  trước cổng kho ứng dụng nguồn.
- Migration ghi các danh tính Plugin rõ ràng với `marketplaceName` và
  `pluginName`; nó không ghi các đường dẫn cache `marketplacePath` cục bộ.
- `codexPlugins.enabled` là công tắc bật toàn cục.
- Không có ký tự đại diện `plugins["*"]` và không có khóa cấu hình nào cấp quyền
  cài đặt tùy ý.
- Các marketplace không được hỗ trợ, gói Plugin đã cache, hook, và tệp cấu hình Codex
  được giữ lại trong báo cáo migration để xem xét thủ công.

## Kho ứng dụng và quyền sở hữu

OpenClaw đọc kho ứng dụng Codex thông qua `app/list` của app-server, cache trong
một giờ, và làm mới bất đồng bộ các mục bị cũ hoặc bị thiếu. Cache chỉ nằm
trong bộ nhớ; khởi động lại CLI hoặc gateway sẽ loại bỏ nó, và OpenClaw xây dựng lại
từ lần đọc `app/list` tiếp theo.

Migration và runtime dùng các khóa cache riêng biệt:

- Xác minh migration nguồn dùng thư mục home Codex nguồn và các tùy chọn khởi động app-server
  nguồn. Việc này chỉ chạy khi đặt `--verify-plugin-apps`, và nó
  buộc duyệt `app/list` nguồn mới cho lần lập kế hoạch đó.
- Thiết lập runtime đích dùng danh tính app-server Codex của agent đích khi nó
  xây dựng cấu hình ứng dụng luồng Codex. Việc kích hoạt Plugin làm mất hiệu lực khóa cache
  đích đó rồi buộc làm mới nó sau `plugin/install`.

Một ứng dụng Plugin chỉ được phơi bày khi OpenClaw có thể ánh xạ nó trở lại Plugin
đã migration thông qua quyền sở hữu ổn định:

- id ứng dụng chính xác từ chi tiết Plugin
- tên máy chủ MCP đã biết
- siêu dữ liệu ổn định duy nhất

Quyền sở hữu chỉ theo tên hiển thị hoặc mơ hồ sẽ bị loại trừ cho đến khi lần làm mới
kho tiếp theo chứng minh quyền sở hữu.

## Cấu hình ứng dụng luồng

OpenClaw chèn một bản vá `config.apps` hạn chế cho luồng Codex:
`_default` bị tắt và chỉ các ứng dụng thuộc sở hữu của các Plugin đã migration được bật
mới được bật.

OpenClaw đặt `destructive_enabled` ở cấp ứng dụng từ chính sách
`allow_destructive_actions` toàn cục hoặc theo Plugin hiệu lực và để Codex thực thi
siêu dữ liệu công cụ phá hủy từ các chú thích công cụ ứng dụng gốc của nó. `true`,
`"auto"`, và `"always"` đặt `destructive_enabled: true`; `false` đặt nó
thành false. Cấu hình ứng dụng `_default` bị tắt với `open_world_enabled: false`.
Các ứng dụng Plugin đã bật được phát ra với `open_world_enabled: true`; OpenClaw không
phơi bày một núm chính sách open-world Plugin riêng và không duy trì
danh sách từ chối tên công cụ phá hủy theo Plugin.

Chế độ phê duyệt công cụ mặc định là tự động cho các ứng dụng Plugin để các công cụ đọc
không phá hủy có thể chạy mà không cần UI phê duyệt cùng luồng. Các công cụ phá hủy vẫn
được kiểm soát bởi chính sách `destructive_enabled` của từng ứng dụng.

## Chính sách hành động phá hủy

Các gợi ý Plugin phá hủy được cho phép theo mặc định cho các Plugin Codex đã migration,
trong khi schema không an toàn và quyền sở hữu mơ hồ vẫn bị đóng an toàn:

- `allow_destructive_actions` toàn cục mặc định là `true`.
- `allow_destructive_actions` theo Plugin ghi đè chính sách toàn cục cho Plugin đó.
- Khi chính sách là `false`, OpenClaw trả về một từ chối xác định.
- Khi chính sách là `true`, OpenClaw chỉ tự động chấp nhận các schema an toàn mà nó có thể ánh xạ
  tới một phản hồi phê duyệt, chẳng hạn như trường phê duyệt boolean.
- Khi chính sách là `"auto"`, OpenClaw phơi bày các hành động Plugin phá hủy cho
  Codex nhưng biến các gợi ý phê duyệt MCP đã chứng minh quyền sở hữu thành các phê duyệt
  Plugin OpenClaw trước khi trả về phản hồi phê duyệt Codex.
- Khi chính sách là `"always"`, OpenClaw dùng cùng cơ chế kiểm soát ghi/phá hủy
  của Codex như `"auto"`, xóa các ghi đè phê duyệt bền vững theo công cụ của Codex cho
  ứng dụng trước khi luồng bắt đầu, và chỉ cung cấp phê duyệt hoặc từ chối một lần để
  các phê duyệt bền vững không thể làm mất các lời nhắc hành động ghi sau này.
- Thiếu danh tính Plugin, quyền sở hữu mơ hồ, thiếu id lượt, id lượt sai,
  hoặc schema gợi ý không an toàn sẽ bị từ chối thay vì nhắc.

## Khắc phục sự cố

**`auth_required`:** migration đã cài đặt Plugin, nhưng một trong các ứng dụng của nó vẫn
cần xác thực. Mục Plugin rõ ràng được ghi ở trạng thái tắt cho đến khi bạn
cấp quyền lại và bật nó.

**`app_inaccessible`, `app_disabled`, hoặc `app_missing`:**
migration không cài đặt Plugin vì kho ứng dụng Codex nguồn không
hiển thị tất cả ứng dụng sở hữu là hiện diện, được bật, và có thể truy cập trong khi
đặt `--verify-plugin-apps`. Cấp quyền lại hoặc bật ứng dụng trong Codex, rồi
chạy lại migration với `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migration không cài đặt Plugin vì
xác minh ứng dụng nguồn nghiêm ngặt đã được yêu cầu và làm mới kho ứng dụng Codex nguồn
thất bại. Sửa quyền truy cập app-server Codex nguồn hoặc thử lại không có
`--verify-plugin-apps` nếu bạn chấp nhận kế hoạch nhanh hơn dựa trên cổng tài khoản.

**`codex_subscription_required`:** migration không cài đặt Plugin dựa trên ứng dụng
vì tài khoản app-server Codex nguồn không đăng nhập bằng tài khoản đăng ký
ChatGPT. Đăng nhập vào ứng dụng Codex bằng xác thực đăng ký,
rồi chạy lại migration.

**`codex_account_unavailable`:** migration không cài đặt Plugin dựa trên ứng dụng
vì không thể đọc tài khoản app-server Codex nguồn. Sửa xác thực app-server Codex
nguồn hoặc chạy lại với `--verify-plugin-apps` nếu bạn muốn kho ứng dụng nguồn
quyết định tính đủ điều kiện khi tra cứu tài khoản thất bại.

**`marketplace_missing` hoặc `plugin_missing`:** app-server Codex đích
không thể nhìn thấy marketplace hoặc Plugin `openai-curated` dự kiến. Chạy lại migration
với runtime đích hoặc kiểm tra trạng thái Plugin app-server Codex.

**`app_inventory_missing` hoặc `app_inventory_stale`:** độ sẵn sàng của ứng dụng đến từ
cache rỗng hoặc đã cũ. OpenClaw lên lịch làm mới bất đồng bộ và loại trừ các ứng dụng
Plugin cho đến khi quyền sở hữu và độ sẵn sàng được biết.

**`app_ownership_ambiguous`:** kho ứng dụng chỉ khớp theo tên hiển thị, nên
ứng dụng không được phơi bày cho luồng Codex.

**Cấu hình đã thay đổi nhưng agent không thể nhìn thấy Plugin:** dùng `/codex plugins
list` để xác nhận trạng thái đã cấu hình, rồi dùng `/new` hoặc `/reset`. Các liên kết
luồng Codex hiện có giữ cấu hình ứng dụng mà chúng đã khởi động cùng cho đến khi OpenClaw
thiết lập một phiên harness mới hoặc thay thế một liên kết đã cũ.

**Hành động phá hủy bị từ chối:** kiểm tra các giá trị `allow_destructive_actions` toàn cục và theo từng Plugin. Ngay cả khi chính sách là `true`, `"auto"`, hoặc `"always"`, các schema elicitation không an toàn và danh tính Plugin mơ hồ vẫn bị từ chối theo hướng đóng an toàn.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [Tham chiếu Codex harness](/vi/plugins/codex-harness-reference)
- [Runtime Codex harness](/vi/plugins/codex-harness-runtime)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#codex-harness-plugin-config)
- [Di chuyển CLI](/vi/cli/migrate)
