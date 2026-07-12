---
read_when:
    - Bạn muốn các tác nhân OpenClaw ở chế độ Codex sử dụng các plugin Codex gốc
    - Bạn đang di chuyển các plugin Codex do OpenAI tuyển chọn được cài đặt từ mã nguồn
    - Bạn đang cấu hình một plugin Codex hiện có trong thư mục không gian làm việc
    - Bạn đang khắc phục sự cố liên quan đến `codexPlugins`, danh mục ứng dụng, các hành động phá hủy hoặc chẩn đoán ứng dụng Plugin
summary: Cấu hình các plugin Codex gốc cho tác tử OpenClaw ở chế độ Codex
title: Plugin Codex gốc
x-i18n:
    generated_at: "2026-07-12T08:09:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Khả năng hỗ trợ Plugin Codex gốc cho phép một tác tử OpenClaw ở chế độ Codex sử dụng các chức năng ứng dụng và Plugin riêng của Codex app-server trong cùng luồng Codex xử lý lượt OpenClaw. Các lệnh gọi Plugin được giữ trong bản ghi Codex gốc; Codex app-server sở hữu việc thực thi MCP dựa trên ứng dụng. OpenClaw không chuyển đổi các Plugin Codex thành công cụ động OpenClaw `codex_plugin_*` tổng hợp.

Hãy sử dụng trang này sau khi [bộ khai thác Codex](/vi/plugins/codex-harness) cơ bản đã hoạt động.

## Yêu cầu

- Môi trường thực thi tác tử phải là bộ khai thác Codex gốc.
- `plugins.entries.codex.enabled` là `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` là `true`.
- Codex app-server đích có thể thấy danh mục marketplace, Plugin và ứng dụng dự kiến.
- Quá trình di chuyển chỉ hỗ trợ các Plugin `openai-curated` mà nó đã quan sát thấy được cài đặt từ nguồn trong thư mục chính Codex nguồn.
- Các Plugin `workspace-directory` được cấu hình thủ công yêu cầu Codex app-server có `plugin/list` chấp nhận `marketplaceKinds` và phần tóm tắt workspace không có đường dẫn chứa `remotePluginId`. Plugin phải được cài đặt và bật sẵn, đồng thời các ứng dụng thuộc sở hữu của Plugin phải có thể truy cập được trong `app/list`.

`codexPlugins` không ảnh hưởng đến các lượt chạy qua nhà cung cấp OpenClaw, các liên kết cuộc hội thoại ACP hoặc các bộ khai thác khác vì những đường dẫn đó không bao giờ tạo luồng Codex app-server với cấu hình `apps` gốc.

Tài khoản Codex phía OpenAI, khả năng cung cấp ứng dụng và các quyền kiểm soát ứng dụng/Plugin trong workspace đến từ tài khoản Codex đã đăng nhập. Xem [Sử dụng Codex với gói ChatGPT của bạn](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) để biết mô hình tài khoản và quản trị viên của OpenAI.

## Bắt đầu nhanh

Xem trước quá trình di chuyển từ thư mục chính Codex nguồn:

```bash
openclaw migrate codex --dry-run
```

Thêm `--verify-plugin-apps` để quá trình di chuyển gọi `app/list` nguồn và yêu cầu mọi ứng dụng thuộc sở hữu đều hiện diện, được bật và có thể truy cập trước khi lập kế hoạch kích hoạt gốc:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Áp dụng quá trình di chuyển khi kế hoạch đã phù hợp:

```bash
openclaw migrate apply codex --yes
```

Quá trình di chuyển ghi các mục `codexPlugins` tường minh cho những Plugin đủ điều kiện và gọi `plugin/install` của Codex app-server cho các Plugin đã chọn. Cấu hình sau khi di chuyển có dạng như sau:

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

Quá trình di chuyển vẫn chỉ giới hạn ở `openai-curated`. Để sử dụng một Plugin `workspace-directory` hiện có, hãy thêm thủ công bằng `summary.id` đầy đủ, được định danh theo marketplace, do `plugin/list` trả về. Ví dụ: nếu Codex trả về `example-plugin@workspace-directory`, hãy cấu hình toàn bộ giá trị đó thay vì tên hiển thị:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw không gọi `plugin/install` hoặc bắt đầu xác thực cho Plugin `workspace-directory`. Hãy cài đặt, bật và xác thực Plugin trong Codex trước khi thêm hoặc bật chính sách OpenClaw. OpenClaw tiếp tục ẩn các ứng dụng khi phản hồi thiếu bằng chứng chính xác về marketplace, mã định danh Plugin, mã định danh chi tiết hoặc trạng thái sẵn sàng của ứng dụng. Nếu Codex từ chối yêu cầu `plugin/list` workspace tường minh, OpenClaw báo cáo `marketplace_missing` cho từng Plugin workspace đã bật và vẫn cung cấp mọi Plugin được tuyển chọn được phát hiện độc lập.

Sau khi thay đổi `codexPlugins`, các cuộc hội thoại Codex mới sẽ tự động nhận tập ứng dụng đã cập nhật. Chạy `/new` hoặc `/reset` để làm mới cuộc hội thoại hiện tại. Không cần khởi động lại Gateway khi bật hoặc tắt Plugin.

## Quản lý Plugin từ cuộc trò chuyện

`/codex plugins` kiểm tra hoặc thay đổi các Plugin Codex gốc đã cấu hình từ chính cuộc trò chuyện nơi bạn vận hành bộ khai thác Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` là bí danh của `/codex plugins list`. Danh sách hiển thị khóa, trạng thái bật/tắt, tên Plugin Codex và marketplace của từng Plugin đã cấu hình từ `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` chỉ ghi vào `~/.openclaw/openclaw.json`; chúng không bao giờ chỉnh sửa `~/.codex/config.toml` hoặc cài đặt Plugin Codex mới. Chỉ chủ sở hữu hoặc máy khách Gateway có phạm vi `operator.admin` mới có thể chạy chúng.

Việc bật một Plugin đã cấu hình cũng bật công tắc toàn cục `codexPlugins.enabled`. Nếu một Plugin được tuyển chọn được ghi ở trạng thái tắt do quá trình di chuyển trả về `auth_required`, hãy cấp lại quyền cho ứng dụng trong Codex trước khi bật Plugin đó trong OpenClaw. Đối với mục `workspace-directory`, việc bật tại đây chỉ thay đổi chính sách OpenClaw; Plugin và ứng dụng phải đang hoạt động sẵn trong Codex.

## Cách thiết lập Plugin gốc hoạt động

Tích hợp theo dõi ba trạng thái:

| Trạng thái    | Ý nghĩa                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Đã cài đặt    | Codex có gói Plugin trong môi trường thực thi app-server đích.                                                                          |
| Đã bật        | Codex báo cáo Plugin đã bật và cấu hình OpenClaw cho phép Plugin đó trong các lượt của bộ khai thác Codex.                              |
| Có thể truy cập | Codex app-server xác nhận các mục ứng dụng của Plugin khả dụng cho tài khoản đang hoạt động và ánh xạ đến danh tính Plugin đã cấu hình. |

Đối với các Plugin `openai-curated`, quá trình di chuyển là bước cài đặt/xác định tính đủ điều kiện lâu dài:

- Trong khi lập kế hoạch, OpenClaw đọc chi tiết `plugin/read` của Codex nguồn và kiểm tra tài khoản Codex app-server nguồn có phải là tài khoản đăng ký ChatGPT hay không. Phản hồi cho biết tài khoản không phải ChatGPT hoặc bị thiếu sẽ bỏ qua các Plugin dựa trên ứng dụng với `codex_subscription_required`.
- Theo mặc định, quá trình di chuyển bỏ qua lệnh gọi `app/list` nguồn: các Plugin nguồn dựa trên ứng dụng vượt qua cổng kiểm tra tài khoản được đưa vào kế hoạch mà không xác minh khả năng truy cập ứng dụng nguồn, còn lỗi truyền tải khi tra cứu tài khoản sẽ bị bỏ qua với `codex_account_unavailable`.
- Với `--verify-plugin-apps`, quá trình di chuyển lấy ảnh chụp `app/list` nguồn mới và yêu cầu mọi ứng dụng thuộc sở hữu đều hiện diện, được bật và có thể truy cập trước khi lập kế hoạch kích hoạt gốc. Khi đó, lỗi truyền tải khi tra cứu tài khoản sẽ chuyển sang cổng kiểm tra danh mục ứng dụng nguồn thay vì bị bỏ qua ngay lập tức.

Đối với các Plugin `workspace-directory`, việc thiết lập diễn ra bên ngoài OpenClaw. OpenClaw chỉ truy vấn marketplace đó khi có ít nhất một mục workspace đã bật được cấu hình, phân giải từng Plugin theo `summary.id` chính xác và tái sử dụng các bước kiểm tra quyền sở hữu `plugin/read` cùng trạng thái sẵn sàng `app/list` hiện có. Plugin chưa cài đặt, bị tắt, không thể truy cập hoặc chưa được xác thực sẽ không cung cấp ứng dụng nào; OpenClaw không cố cài đặt hoặc xác thực.

Danh mục ứng dụng khi chạy là bước kiểm tra khả năng truy cập của phiên đích cho cả Plugin được tuyển chọn đã di chuyển và Plugin workspace được cấu hình thủ công. Quá trình thiết lập phiên bộ khai thác Codex tính toán cấu hình ứng dụng luồng có tính hạn chế từ các ứng dụng Plugin đã bật và có thể truy cập; cấu hình này không được tính lại ở mỗi lượt, vì vậy `/codex plugins enable`/`disable` chỉ ảnh hưởng đến các cuộc hội thoại Codex mới. Dùng `/new` hoặc `/reset` để áp dụng thay đổi cho cuộc hội thoại hiện tại.

## Phạm vi hỗ trợ V1

- Chỉ các Plugin `openai-curated` đã được cài đặt trong danh mục Codex app-server nguồn mới đủ điều kiện di chuyển.
- Môi trường chạy cũng hỗ trợ các mục `workspace-directory` tường minh trên những bản dựng app-server có `plugin/list` triển khai `marketplaceKinds` và trả về `remotePluginId` cho phần tóm tắt workspace không có đường dẫn. Các mục này phải sử dụng `summary.id` chính xác, được định danh theo marketplace, đồng thời phải được cài đặt, bật và có thể truy cập ứng dụng từ trước. Yêu cầu liệt kê workspace bị từ chối sẽ tạo chẩn đoán `marketplace_missing` hiện có cho từng Plugin; thiếu bằng chứng về marketplace, Plugin, chi tiết hoặc ứng dụng sẽ không cung cấp ứng dụng workspace nào. Danh mục được tuyển chọn từ yêu cầu danh sách mặc định vẫn có thể sử dụng.
- Các Plugin nguồn dựa trên ứng dụng phải vượt qua cổng kiểm tra gói đăng ký tại thời điểm di chuyển. `--verify-plugin-apps` bổ sung cổng kiểm tra danh mục ứng dụng nguồn. Các tài khoản bị giới hạn bởi gói đăng ký và, trong chế độ xác minh, các ứng dụng nguồn không thể truy cập/bị tắt/bị thiếu hoặc lỗi làm mới danh mục ứng dụng sẽ được báo cáo là các mục thủ công bị bỏ qua thay vì các mục cấu hình đã bật. Chi tiết Plugin không đọc được sẽ bị bỏ qua trước cổng kiểm tra danh mục ứng dụng.
- Quá trình di chuyển ghi danh tính Plugin tường minh (`marketplaceName` và `pluginName`); không ghi các đường dẫn bộ nhớ đệm `marketplacePath` cục bộ.
- `codexPlugins.enabled` là công tắc bật toàn cục duy nhất; không có ký tự đại diện `plugins["*"]` hoặc khóa cấu hình nào cấp quyền cài đặt tùy ý.
- Các marketplace không được tuyển chọn, gói Plugin được lưu trong bộ nhớ đệm, hook và tệp cấu hình Codex được giữ lại trong báo cáo di chuyển để xem xét thủ công, không được kích hoạt tự động. Môi trường chạy chấp nhận các mục `workspace-directory` được cấu hình thủ công; các marketplace khác vẫn không được hỗ trợ.

## Danh mục ứng dụng và quyền sở hữu

OpenClaw đọc danh mục ứng dụng Codex thông qua `app/list` của app-server, lưu vào bộ nhớ đệm trong bộ nhớ trong một giờ và làm mới bất đồng bộ các mục cũ hoặc bị thiếu. Bộ nhớ đệm chỉ tồn tại trong tiến trình; việc khởi động lại CLI hoặc Gateway sẽ xóa bộ nhớ đệm này, và OpenClaw dựng lại nó từ lần đọc `app/list` tiếp theo.

Quá trình di chuyển và môi trường chạy sử dụng các khóa bộ nhớ đệm riêng biệt:

- Việc xác minh di chuyển nguồn sử dụng thư mục chính Codex nguồn và các tùy chọn khởi động. Tác vụ này chỉ chạy với `--verify-plugin-apps` và buộc duyệt mới `app/list` nguồn cho lượt lập kế hoạch đó.
- Quá trình thiết lập môi trường chạy đích sử dụng danh tính Codex app-server của tác tử đích khi tạo cấu hình ứng dụng luồng. Việc kích hoạt Plugin được tuyển chọn làm mất hiệu lực khóa bộ nhớ đệm đích đó, rồi buộc làm mới khóa sau `plugin/install`. Quá trình thiết lập `workspace-directory` không bao giờ chạy đường dẫn kích hoạt này.

Một ứng dụng Plugin chỉ được cung cấp khi OpenClaw có thể ánh xạ ngược ứng dụng đó tới Plugin đã cấu hình thông qua quyền sở hữu ổn định: mã định danh ứng dụng chính xác từ chi tiết Plugin, tên máy chủ MCP đã biết hoặc siêu dữ liệu ổn định và duy nhất. Quyền sở hữu chỉ dựa trên tên hiển thị hoặc không rõ ràng sẽ bị loại trừ cho đến khi lần làm mới danh mục tiếp theo chứng minh được quyền sở hữu.

## Ứng dụng của tài khoản đã kết nối

Các tác tử do chủ sở hữu vận hành có thể chọn sử dụng mọi ứng dụng đã kết nối với tài khoản Codex của họ mà không cần gói Plugin tương ứng:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` lấy ảnh chụp `app/list` đầy đủ khi thiết lập một luồng Codex gốc mới và chỉ cho phép các ứng dụng được đánh dấu là có thể truy cập đối với tài khoản đó. Tùy chọn này không cài đặt, xác thực hoặc bật ứng dụng trên toàn hệ thống. Các luồng hiện có giữ nguyên tập ứng dụng đã lưu; hãy dùng `/new`, `/reset` hoặc khởi động lại Gateway để nhận các ứng dụng mới kết nối hoặc đã bị thu hồi.

Các ứng dụng tài khoản kế thừa giá trị `codexPlugins.allow_destructive_actions` toàn cục, chấp nhận `true`, `false`, `"auto"` hoặc `"ask"`. Chính sách tường minh theo từng Plugin ghi đè chính sách toàn cục đối với các mã định danh ứng dụng trùng nhau. Lỗi danh mục sẽ đóng an toàn thay vì chuyển về giá trị mặc định không hạn chế.

## Cấu hình ứng dụng của luồng

OpenClaw chèn một bản vá `config.apps` có tính hạn chế cho luồng Codex:
`_default` bị vô hiệu hóa, và chỉ những ứng dụng thuộc về các Plugin đã cấu hình và bật hoặc các ứng dụng tài khoản có thể truy cập được `allow_all_plugins` cho phép mới được bật.

`destructive_enabled` trên mỗi ứng dụng được xác định từ chính sách `allow_destructive_actions` toàn cục hoặc theo từng Plugin có hiệu lực; `true`, `"auto"` và `"ask"` đều đặt `destructive_enabled: true`, còn `false` đặt thành `false`. Codex vẫn thực thi siêu dữ liệu công cụ phá hủy từ các chú thích công cụ ứng dụng gốc của nó.
`_default` bị vô hiệu hóa với `open_world_enabled: false`; các ứng dụng Plugin được bật nhận `open_world_enabled: true`. OpenClaw không cung cấp một tùy chọn chính sách thế giới mở riêng ở cấp Plugin và không duy trì danh sách từ chối tên công cụ phá hủy theo từng Plugin.

Chế độ phê duyệt công cụ mặc định là tự động đối với các ứng dụng được cho phép, vì vậy các công cụ đọc không phá hủy chạy mà không cần lời nhắc phê duyệt trong cùng luồng. Các công cụ phá hủy vẫn chịu sự kiểm soát của chính sách `destructive_enabled` của từng ứng dụng.

## Chính sách hành động phá hủy

Theo mặc định, các yêu cầu tương tác phá hủy của Plugin được cho phép đối với các Plugin Codex đã cấu hình, trong khi các lược đồ không an toàn và quyền sở hữu không rõ ràng sẽ mặc định từ chối:

- `allow_destructive_actions` toàn cục mặc định là `true`.
- `allow_destructive_actions` theo từng Plugin ghi đè chính sách toàn cục cho
  Plugin đó.
- `false`: OpenClaw trả về một phản hồi từ chối xác định.
- `true`: OpenClaw chỉ tự động chấp nhận những lược đồ an toàn mà nó có thể ánh xạ thành phản hồi
  phê duyệt, chẳng hạn như một trường phê duyệt kiểu boolean.
- `"auto"`: OpenClaw cung cấp các hành động Plugin phá hủy cho Codex, sau đó
  chuyển các yêu cầu tương tác phê duyệt MCP đã chứng minh được quyền sở hữu thành các phê duyệt Plugin của OpenClaw
  trước khi trả về phản hồi phê duyệt của Codex.
- `"ask"`: OpenClaw sử dụng cùng cơ chế kiểm soát ghi/phá hủy của Codex như
  `"auto"`, xóa các ghi đè phê duyệt bền vững theo từng công cụ của Codex cho ứng dụng
  trước khi luồng bắt đầu và chỉ đưa ra lựa chọn phê duyệt hoặc từ chối một lần để
  các phê duyệt bền vững không thể ngăn những lời nhắc hành động ghi sau này. Với mỗi
  ứng dụng được cho phép sử dụng `"ask"`, OpenClaw chọn trình xét duyệt phê duyệt
  của con người trong Codex cho ứng dụng đó để Codex gửi các yêu cầu tương tác phê duyệt đến
  OpenClaw; các ứng dụng khác và các phê duyệt luồng không thuộc ứng dụng vẫn giữ nguyên
  trình xét duyệt và chính sách đã cấu hình.
- Thiếu danh tính Plugin, quyền sở hữu không rõ ràng, thiếu hoặc không khớp
  mã lượt, hay lược đồ yêu cầu tương tác không an toàn đều dẫn đến từ chối thay vì hiển thị lời nhắc.

## Khắc phục sự cố

| Mã                                                | Ý nghĩa                                                                                                                                        | Cách khắc phục                                                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | Quá trình di chuyển đã cài đặt Plugin, nhưng một trong các ứng dụng của nó vẫn cần xác thực. Mục này được ghi ở trạng thái vô hiệu hóa cho đến khi bạn ủy quyền lại. | Ủy quyền lại ứng dụng trong Codex, sau đó bật Plugin trong OpenClaw.                                                             |
| `app_inaccessible`, `app_disabled`, `app_missing` | Với `--verify-plugin-apps`, danh mục ứng dụng Codex nguồn không cho thấy tất cả ứng dụng thuộc sở hữu đều hiện diện, được bật và có thể truy cập. | Ủy quyền lại hoặc bật ứng dụng trong Codex, sau đó chạy lại quá trình di chuyển với `--verify-plugin-apps`.                       |
| `app_inventory_unavailable`                       | Đã yêu cầu xác minh nghiêm ngặt ứng dụng nguồn nhưng việc làm mới danh mục ứng dụng Codex nguồn thất bại.                                       | Khắc phục quyền truy cập máy chủ ứng dụng Codex nguồn hoặc thử lại mà không có `--verify-plugin-apps` để chấp nhận kế hoạch nhanh hơn dựa trên tài khoản. |
| `codex_subscription_required`                     | Tài khoản máy chủ ứng dụng Codex nguồn không phải là tài khoản có gói đăng ký ChatGPT.                                                         | Đăng nhập vào ứng dụng Codex bằng phương thức xác thực gói đăng ký, sau đó chạy lại quá trình di chuyển.                          |
| `codex_account_unavailable`                       | Không thể đọc tài khoản máy chủ ứng dụng Codex nguồn.                                                                                          | Khắc phục xác thực máy chủ ứng dụng Codex nguồn hoặc chạy lại với `--verify-plugin-apps` để danh mục ứng dụng nguồn quyết định tính đủ điều kiện. |
| `marketplace_missing`, `plugin_missing`           | Marketplace hoặc chính xác Plugin không khả dụng; yêu cầu danh mục không gian làm việc tường minh có thể đã bị từ chối; các ứng dụng không gian làm việc mặc định bị từ chối. | Xác minh hợp đồng máy chủ ứng dụng tương thích và mã định danh chính xác được mô tả bên dưới.                                    |
| `plugin_detail_unavailable`                       | OpenClaw không thể đọc thông tin chi tiết về quyền sở hữu Plugin.                                                                              | Kiểm tra các phản hồi `plugin/list` và `plugin/read` của máy chủ ứng dụng đích.                                                  |
| `plugin_disabled`                                 | Codex báo cáo Plugin đã được cài đặt nhưng bị vô hiệu hóa.                                                                                     | Việc kích hoạt tuyển chọn có thể sửa lỗi này; hãy bật một Plugin không gian làm việc trong Codex trước khi thử lại.               |
| `plugin_activation_failed`                        | Quá trình kích hoạt Plugin không hoàn tất.                                                                                                     | Sử dụng chẩn đoán đính kèm để phân biệt lỗi Marketplace, xác thực, làm mới hoặc mức độ sẵn sàng của không gian làm việc.          |
| `app_inventory_missing`, `app_inventory_stale`    | Trạng thái sẵn sàng của ứng dụng đến từ bộ nhớ đệm trống hoặc cũ.                                                                               | OpenClaw tự động lên lịch làm mới bất đồng bộ; các ứng dụng Plugin vẫn bị loại trừ cho đến khi biết được quyền sở hữu và trạng thái sẵn sàng. |
| `app_ownership_ambiguous`                         | Danh mục ứng dụng chỉ khớp theo tên hiển thị.                                                                                                  | Ứng dụng vẫn bị ẩn khỏi luồng Codex cho đến khi một lần làm mới sau đó chứng minh được quyền sở hữu.                              |

**Plugin không gian làm việc đã được cài đặt nhưng không hiển thị:** xác nhận kết quả
`plugin/list` của không gian làm việc báo cáo mã định danh chính xác đã cấu hình là được cài đặt và bật,
sau đó xác nhận `app/list` báo cáo mọi ứng dụng thuộc sở hữu đều có thể truy cập bằng cùng tài khoản
Codex. OpenClaw có thể bật một ứng dụng có thể truy cập cho luồng ngay cả khi
danh mục tài khoản hiện báo cáo ứng dụng đó bị vô hiệu hóa. Nếu bạn thay đổi trạng thái đó sau khi Gateway lưu danh mục ứng dụng
vào bộ nhớ đệm, hãy chờ bộ nhớ đệm được làm mới sau một giờ hoặc khởi động lại Gateway, sau đó dùng
`/new` hoặc `/reset`. OpenClaw không sửa chữa hoặc xác thực các Plugin không gian làm việc.
Nếu yêu cầu danh sách không gian làm việc tường minh bị từ chối, mỗi mục không gian làm việc
được bật sẽ báo cáo `marketplace_missing`; các mục tuyển chọn không liên quan vẫn tiếp tục
từ phản hồi danh sách mặc định.

Đối với `plugin_detail_unavailable`, bản tóm tắt không gian làm việc không có đường dẫn phải bao gồm
`remotePluginId`; OpenClaw tiếp tục ẩn các ứng dụng thuộc sở hữu khi bộ chọn đó hoặc
kết quả `plugin/read` tiếp theo không khả dụng. Đối với
`plugin_activation_failed`, các Plugin tuyển chọn có thể báo cáo lỗi Marketplace, xác thực hoặc
làm mới sau cài đặt. Một Plugin không gian làm việc báo cáo mã này khi nó
chưa hoạt động; hãy cài đặt, bật và xác thực nó bên ngoài OpenClaw.

**Cấu hình đã thay đổi nhưng tác tử không thể thấy Plugin:** chạy `/codex plugins
list` để xác nhận trạng thái đã cấu hình, sau đó dùng `/new` hoặc `/reset`. Các liên kết
luồng Codex hiện có giữ nguyên cấu hình ứng dụng tại thời điểm chúng khởi động cho đến khi OpenClaw
thiết lập một phiên bộ khung mới hoặc thay thế một liên kết cũ.

**Hành động phá hủy bị từ chối:** kiểm tra các giá trị
`allow_destructive_actions` toàn cục và theo từng Plugin. Ngay cả với `true`, `"auto"` hoặc `"ask"`,
các lược đồ yêu cầu tương tác không an toàn và danh tính Plugin không rõ ràng vẫn mặc định bị từ chối.

## Liên quan

- [Bộ khung Codex](/vi/plugins/codex-harness)
- [Tham chiếu bộ khung Codex](/vi/plugins/codex-harness-reference)
- [Môi trường thực thi bộ khung Codex](/vi/plugins/codex-harness-runtime)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI di chuyển](/vi/cli/migrate)
