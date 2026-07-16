---
doc-schema-version: 1
read_when:
    - Cài đặt hoặc cấu hình các plugin
    - Tìm hiểu các quy tắc phát hiện và tải Plugin
    - Làm việc với các gói plugin tương thích với Codex/Claude
sidebarTitle: Getting Started
summary: Cài đặt, cấu hình và quản lý các plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-07-16T15:53:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw với các kênh, nhà cung cấp mô hình, bộ khung tác tử, công cụ,
Skills, giọng nói, phiên âm theo thời gian thực, thoại, khả năng hiểu nội dung đa phương tiện, tạo nội dung,
tải nội dung web, tìm kiếm web và các khả năng thời gian chạy khác.

Sử dụng trang này để cài đặt một Plugin, khởi động lại Gateway, xác minh rằng môi trường thời gian chạy
đã tải Plugin và xử lý các lỗi thiết lập thường gặp. Để xem các ví dụ chỉ dùng lệnh, hãy xem
[Quản lý Plugin](/vi/plugins/manage-plugins). Để xem danh mục được tạo tự động gồm
các Plugin tích hợp, Plugin chính thức bên ngoài và Plugin chỉ có mã nguồn, hãy xem
[Danh mục Plugin](/vi/plugins/plugin-inventory).

## Yêu cầu

- một bản checkout hoặc bản cài đặt OpenClaw có sẵn CLI `openclaw`
- quyền truy cập mạng đến nguồn đã chọn (ClawHub, npm hoặc máy chủ git)
- mọi thông tin xác thực, khóa cấu hình hoặc công cụ hệ điều hành dành riêng cho Plugin được nêu trong
  tài liệu thiết lập của Plugin đó
- quyền tải lại hoặc khởi động lại Gateway phục vụ các kênh của bạn

## Bắt đầu nhanh

<Steps>
  <Step title="Tìm Plugin">
    Tìm kiếm các gói Plugin công khai trên [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub là nơi khám phá chính dành cho các Plugin cộng đồng. Trong giai đoạn
    chuyển đổi khi ra mắt, các đặc tả gói thuần túy thông thường vẫn được cài đặt từ npm, trừ khi
    chúng khớp với một mã định danh Plugin chính thức. Các đặc tả `@openclaw/*` thô khớp với
    một Plugin tích hợp sẽ được phân giải thành bản tích hợp đó. Hãy dùng tiền tố nguồn rõ ràng
    khi bạn cần chỉ định cụ thể một nguồn.

  </Step>

  <Step title="Cài đặt Plugin">
    ```bash
    # Từ ClawHub.
    openclaw plugins install clawhub:<package>

    # Từ npm.
    openclaw plugins install npm:<package>

    # Từ git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Từ bản checkout phát triển cục bộ.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Hãy coi việc cài đặt Plugin như chạy mã. Nên ưu tiên các phiên bản được ghim để
    có thể tái tạo quá trình cài đặt trong môi trường sản xuất. Các gói ClawHub và danh mục
    tích hợp/chính thức của OpenClaw là những nguồn đáng tin cậy. Các nguồn npm, git,
    đường dẫn/kho lưu trữ cục bộ, `npm-pack:` hoặc marketplace tùy ý mới yêu cầu
    `--force` trong quá trình cài đặt không tương tác sau khi bạn
    xem xét và tin cậy nguồn đó.

  </Step>

  <Step title="Cấu hình và bật Plugin">
    Cấu hình các thiết lập dành riêng cho Plugin trong `plugins.entries.<id>.config`.
    Bật Plugin nếu Plugin chưa được bật:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Nếu `plugins.allow` được đặt, mã định danh của Plugin đã cài đặt phải nằm trong danh sách đó
    trước khi Plugin có thể tải. `openclaw plugins install` thêm mã định danh đã cài đặt
    vào danh sách `plugins.allow` hiện có và xóa chính mã định danh đó khỏi
    `plugins.deny` để bản cài đặt rõ ràng có thể tải sau khi khởi động lại.

  </Step>

  <Step title="Cho phép Gateway tải lại">
    Việc cài đặt, cập nhật hoặc gỡ cài đặt mã Plugin yêu cầu khởi động lại Gateway.
    Gateway được quản lý có bật tính năng tải lại cấu hình sẽ phát hiện bản ghi cài đặt
    Plugin đã thay đổi và tự động khởi động lại. Nếu không, hãy tự khởi động lại:

    ```bash
    openclaw gateway restart
    ```

    Việc bật/tắt sẽ cập nhật cấu hình và registry nguội. Kiểm tra môi trường thời gian chạy
    vẫn là bằng chứng rõ ràng nhất về các bề mặt thời gian chạy đang hoạt động.

  </Step>

  <Step title="Xác minh đăng ký thời gian chạy">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Sử dụng `--runtime` để xác nhận các công cụ, hook, dịch vụ, phương thức Gateway
    hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect` thông thường chỉ là bước kiểm tra
    manifest nguội và registry.

  </Step>
</Steps>

## Cấu hình

### Chọn nguồn cài đặt

| Nguồn       | Sử dụng khi                                                                     | Ví dụ                                                          |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Bạn muốn khả năng khám phá dành riêng cho OpenClaw, quét, siêu dữ liệu phiên bản và gợi ý cài đặt | `openclaw plugins install clawhub:<package>`                   |
| npm         | Bạn cần quy trình làm việc trực tiếp với registry npm hoặc dist-tag            | `openclaw plugins install npm:<package>`                       |
| git         | Bạn cần một nhánh, thẻ hoặc commit từ kho lưu trữ                              | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| đường dẫn cục bộ | Bạn đang phát triển hoặc kiểm thử một Plugin trên cùng máy                 | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Bạn đang cài đặt một Plugin marketplace tương thích với Claude                 | `openclaw plugins install <plugin> --marketplace <source>`     |

Các đặc tả gói thuần túy có hành vi tương thích đặc biệt: tên thuần túy khớp với
mã định danh Plugin tích hợp sẽ sử dụng nguồn tích hợp đó; tên thuần túy khớp với
mã định danh Plugin chính thức bên ngoài sẽ sử dụng danh mục gói chính thức; mọi
đặc tả thuần túy khác được cài đặt qua npm trong giai đoạn chuyển đổi khi ra mắt. Các đặc tả `@openclaw/*`
thô khớp với Plugin tích hợp cũng được phân giải thành bản tích hợp trước khi
chuyển sang npm dự phòng. Sử dụng `npm:@openclaw/<plugin>@<version>` để chủ động cài đặt
gói npm bên ngoài thay vì bản tích hợp. Sử dụng `clawhub:`, `npm:`,
`git:` hoặc `npm-pack:` để lựa chọn nguồn một cách xác định. Xem
[`openclaw plugins`](/vi/cli/plugins#install) để biết đầy đủ hợp đồng lệnh.

Đối với các bản cài đặt npm, đặc tả không ghim và `@latest` sẽ chọn gói ổn định
mới nhất công bố khả năng tương thích với bản dựng OpenClaw này. Nếu bản phát hành
latest hiện tại của npm khai báo `openclaw.compat.pluginApi` hoặc
`openclaw.install.minHostVersion` mới hơn mức bản dựng này hỗ trợ, OpenClaw sẽ quét
các phiên bản ổn định cũ hơn và cài đặt phiên bản mới nhất phù hợp. Các phiên bản chính xác
và thẻ kênh rõ ràng như `@beta` vẫn được ghim vào gói đã chọn
và sẽ thất bại nếu không tương thích.

### Chính sách cài đặt của người vận hành

Cấu hình `security.installPolicy` để chạy một lệnh chính sách cục bộ đáng tin cậy
trước khi tiến hành cài đặt hoặc cập nhật Plugin. Chính sách nhận siêu dữ liệu cùng
đường dẫn nguồn đã được chuẩn bị và có thể cho phép hoặc chặn quá trình cài đặt. Chính sách áp dụng cho cả
đường dẫn cài đặt/cập nhật qua CLI và qua Gateway. Các hook `before_install` của Plugin chạy
sau đó và chỉ trong các tiến trình OpenClaw đã tải hook Plugin, vì vậy hãy dùng
`security.installPolicy` cho các quyết định cài đặt thuộc quyền sở hữu của người vận hành. Cờ
`--dangerously-force-unsafe-install` không còn được khuyến nghị vẫn được chấp nhận để
tương thích nhưng không thực hiện thao tác nào: cờ này không bỏ qua chính sách cài đặt hoặc danh sách từ chối
phần phụ thuộc Plugin tích hợp của OpenClaw.

Xem [Cấu hình Skills](/vi/tools/skills-config#operator-install-policy-securityinstallpolicy)
để biết lược đồ exec `security.installPolicy` dùng chung cho cả Skills và
Plugin.

### Cấu hình chính sách Plugin

Cấu trúc cấu hình Plugin phổ biến là:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Các quy tắc chính của chính sách:

- `plugins.enabled: false` vô hiệu hóa tất cả Plugin và bỏ qua công việc khám phá/tải.
  Các tham chiếu Plugin lỗi thời vẫn không hoạt động khi tùy chọn này có hiệu lực; hãy bật lại
  Plugin trước khi chạy tác vụ dọn dẹp của doctor nếu bạn muốn xóa các mã định danh lỗi thời.
- `plugins.deny` có ưu tiên cao hơn danh sách cho phép và trạng thái bật của từng Plugin.
- `plugins.allow` là danh sách cho phép độc quyền. Các công cụ do Plugin sở hữu nằm ngoài
  danh sách cho phép vẫn không khả dụng ngay cả khi `tools.allow` bao gồm `"*"`.
- `plugins.entries.<id>.enabled: false` vô hiệu hóa một Plugin nhưng vẫn giữ
  cấu hình của Plugin đó.
- `plugins.load.paths` thêm các tệp hoặc thư mục Plugin cục bộ rõ ràng.
  Các đường dẫn cục bộ `plugins install` được quản lý phải là thư mục hoặc
  kho lưu trữ Plugin; sử dụng `plugins.load.paths` cho các tệp Plugin độc lập.
- Các Plugin có nguồn gốc từ workspace bị vô hiệu hóa theo mặc định; hãy bật rõ ràng hoặc
  thêm chúng vào danh sách cho phép trước khi sử dụng mã workspace cục bộ.
- Các Plugin tích hợp tuân theo siêu dữ liệu bật/tắt mặc định được tích hợp sẵn
  trừ khi cấu hình ghi đè rõ ràng.
- `plugins.slots.<slot>` (`memory` hoặc `contextEngine`) chọn một Plugin cho một
  danh mục độc quyền. Việc chọn slot được tính là kích hoạt rõ ràng và
  buộc bật Plugin đã chọn cho slot đó, ngay cả khi Plugin đó vốn
  cần được chủ động bật. `plugins.deny` và `plugins.entries.<id>.enabled: false` vẫn
  chặn Plugin đó.
- Các Plugin tích hợp cần chủ động bật có thể tự động kích hoạt khi cấu hình nêu tên một trong
  các bề mặt thuộc sở hữu của chúng, chẳng hạn như tham chiếu nhà cung cấp/mô hình, cấu hình kênh, backend CLI
  hoặc môi trường thời gian chạy bộ khung tác tử.
- Định tuyến Codex thuộc họ OpenAI giữ ranh giới giữa nhà cung cấp và Plugin thời gian chạy
  tách biệt: các tham chiếu mô hình Codex cũ là cấu hình cũ được doctor sửa chữa,
  trong khi Plugin `codex` tích hợp sở hữu môi trường thời gian chạy máy chủ ứng dụng Codex cho
  các tham chiếu tác tử `openai/*` chuẩn, `agentRuntime.id: "codex"` rõ ràng và
  các tham chiếu `codex/*` cũ.

Khi `plugins.allow` chưa được đặt và các Plugin không tích hợp được tự động phát hiện từ
workspace hoặc các thư mục gốc Plugin toàn cục, nhật ký khởi động ghi
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
kèm theo các mã định danh Plugin đã phát hiện và, đối với danh sách ngắn, một đoạn `plugins.allow`
tối giản. Chạy [`openclaw plugins list --enabled --verbose`](/vi/cli/plugins#list)
hoặc [`openclaw plugins inspect <id>`](/vi/cli/plugins#inspect) trên mã định danh
Plugin được liệt kê trước khi sao chép các Plugin đáng tin cậy vào `openclaw.json`. Cách
ghim độ tin cậy tương tự được áp dụng khi chẩn đoán cho biết một Plugin đã tải
`without install/load-path provenance`: kiểm tra mã định danh Plugin đó, sau đó ghim nó trong
`plugins.allow` hoặc cài đặt lại từ một nguồn đáng tin cậy để OpenClaw ghi lại
nguồn gốc cài đặt.

Chạy `openclaw doctor` hoặc `openclaw doctor --fix` khi quá trình xác thực cấu hình
báo cáo mã định danh Plugin lỗi thời, sự không khớp giữa danh sách cho phép và công cụ hoặc đường dẫn Plugin tích hợp
cũ.

## Tìm hiểu các định dạng Plugin

OpenClaw nhận dạng hai định dạng Plugin:

| Định dạng              | Cách tải                                                                     | Sử dụng khi                                                             |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin OpenClaw gốc    | `openclaw.plugin.json` cùng một mô-đun thời gian chạy được tải trong tiến trình | Bạn đang cài đặt hoặc xây dựng các khả năng thời gian chạy dành riêng cho OpenClaw |
| Gói tương thích        | Bố cục Plugin Codex, Claude hoặc Cursor được ánh xạ vào danh mục Plugin OpenClaw | Bạn đang tái sử dụng Skills, lệnh, hook hoặc siêu dữ liệu gói tương thích |

Cả hai định dạng đều xuất hiện trong `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` và `openclaw plugins disable`. Xem
[Gói Plugin](/vi/plugins/bundles) để biết ranh giới tương thích của gói và
[Xây dựng Plugin](/vi/plugins/building-plugins) để biết cách tạo Plugin gốc.

## Hook Plugin

Plugin có thể đăng ký hook trong thời gian chạy thông qua hai API khác nhau:

- Hook có kiểu `api.on(...)` dành cho các sự kiện vòng đời thời gian chạy. Đây là
  bề mặt được ưu tiên cho middleware, chính sách, viết lại thông điệp, định hình
  prompt và kiểm soát công cụ.
- `api.registerHook(...)` dành cho hệ thống hook nội bộ được mô tả trong
  [Hook](/vi/automation/hooks). Hệ thống này chủ yếu dành cho các tác dụng phụ ở mức lệnh/vòng đời
  tổng quát và khả năng tương thích với quy trình tự động hóa kiểu HOOK hiện có.

Quy tắc nhanh: nếu trình xử lý cần độ ưu tiên, ngữ nghĩa hợp nhất hoặc
hành vi chặn/hủy, hãy dùng hook có kiểu. Nếu trình xử lý chỉ phản ứng với `command:new`,
`command:reset`, `message:sent` hoặc các sự kiện tổng quát tương tự, `api.registerHook`
là phù hợp.

Các hook nội bộ do Plugin quản lý xuất hiện trong `openclaw hooks list` với
`plugin:<id>`. Bạn không thể bật hoặc tắt chúng thông qua `openclaw hooks`;
thay vào đó, hãy bật hoặc tắt Plugin.

## Xác minh Gateway đang hoạt động

`openclaw plugins list` và `openclaw plugins inspect` thông thường đọc cấu hình nguội,
manifest và trạng thái registry. Chúng không chứng minh rằng một
Gateway đang chạy đã nhập cùng mã plugin.

Khi một plugin có vẻ đã được cài đặt nhưng lưu lượng trò chuyện trực tiếp không sử dụng plugin đó:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Các Gateway được quản lý sẽ tự động khởi động lại sau những thay đổi cài đặt, cập nhật và
gỡ cài đặt plugin làm thay đổi mã nguồn plugin. Trên các bản cài đặt VPS hoặc container, hãy
đảm bảo mọi lần khởi động lại thủ công đều nhắm đến tiến trình con `openclaw gateway run` thực tế
phục vụ các kênh của bạn, không chỉ một trình bao bọc hoặc trình giám sát.

## Khắc phục sự cố

| Triệu chứng                                                        | Kiểm tra                                                                                                                                      | Cách khắc phục                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin xuất hiện trong `plugins list` nhưng các hook thời gian chạy không hoạt động  | Sử dụng `openclaw plugins inspect <id> --runtime --json` và xác nhận Gateway đang hoạt động bằng `gateway status --deep --require-rpc`             | Khởi động lại Gateway trực tiếp sau khi cài đặt, cập nhật, thay đổi cấu hình hoặc mã nguồn                               |
| Xuất hiện chẩn đoán trùng lặp về quyền sở hữu kênh hoặc công cụ         | Chạy `openclaw plugins list --enabled --verbose`, kiểm tra từng plugin bị nghi ngờ bằng `--runtime --json` và so sánh quyền sở hữu kênh/công cụ | Tắt một chủ sở hữu, xóa các bản cài đặt cũ hoặc sử dụng `preferOver` trong manifest để thay thế có chủ đích      |
| Cấu hình cho biết thiếu một plugin                                | Kiểm tra [Danh mục plugin](/vi/plugins/plugin-inventory) để xác định plugin đó được tích hợp sẵn, là plugin chính thức bên ngoài hay chỉ có mã nguồn                           | Cài đặt gói bên ngoài, bật plugin tích hợp sẵn hoặc xóa cấu hình cũ                         |
| Cấu hình không hợp lệ trong khi cài đặt                               | Đọc thông báo xác thực và chạy `openclaw doctor --fix` nếu thông báo chỉ ra trạng thái plugin cũ                                             | Doctor có thể cách ly cấu hình plugin không hợp lệ bằng cách tắt mục nhập và xóa tải trọng không hợp lệ     |
| Đường dẫn plugin bị chặn do quyền sở hữu hoặc quyền truy cập đáng ngờ | Kiểm tra chẩn đoán trước lỗi cấu hình                                                                                             | Sửa quyền sở hữu/quyền truy cập của hệ thống tệp, sau đó chạy `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` chặn các lệnh vòng đời                | Xác nhận bản cài đặt được Nix quản lý                                                                                                      | Thay đổi lựa chọn plugin trong mã nguồn Nix thay vì sử dụng các lệnh sửa đổi plugin                      |
| Không thể nhập phần phụ thuộc khi chạy                             | Kiểm tra xem plugin được cài đặt qua npm/git/ClawHub hay được tải từ một đường dẫn cục bộ                                                 | Chạy `openclaw plugins update <id>`, cài đặt lại từ nguồn hoặc tự cài đặt các phần phụ thuộc của plugin cục bộ |

Khi cấu hình plugin cũ vẫn định danh một plugin kênh không còn có thể được phát hiện,
quá trình xác thực cấu hình sẽ hạ khóa kênh đó xuống thành cảnh báo thay vì lỗi nghiêm trọng,
để khi khởi động Gateway vẫn có thể phục vụ tất cả các kênh khác. Chạy
`openclaw doctor --fix` để xóa các mục plugin và kênh cũ. Các
khóa kênh không xác định mà không có bằng chứng về plugin cũ vẫn khiến quá trình xác thực thất bại để
lỗi chính tả vẫn hiển thị rõ ràng.

Để thay thế kênh có chủ đích, plugin được ưu tiên nên khai báo
`channelConfigs.<channel-id>.preferOver` với id plugin cũ hoặc có mức ưu tiên
thấp hơn. Nếu cả hai plugin đều được bật rõ ràng, OpenClaw giữ nguyên yêu cầu đó
và báo cáo chẩn đoán trùng lặp về kênh/công cụ thay vì âm thầm chọn
một chủ sở hữu.

Nếu một gói đã cài đặt báo rằng gói đó `requires compiled runtime output for
TypeScript entry ...`, thì gói đã được phát hành mà không có các tệp JavaScript
OpenClaw cần khi chạy. Hãy cập nhật hoặc cài đặt lại sau khi nhà phát hành cung cấp
JavaScript đã biên dịch, hoặc tắt/gỡ cài đặt plugin cho đến lúc đó.

### Quyền sở hữu đường dẫn plugin bị chặn

Nếu chẩn đoán cho biết
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
và sau đó quá trình xác thực hiển thị `plugin present but blocked`, OpenClaw đã tìm thấy
các tệp plugin thuộc sở hữu của một người dùng Unix khác với người dùng của tiến trình đang tải chúng.
Giữ nguyên cấu hình plugin; sửa quyền sở hữu hệ thống tệp hoặc chạy OpenClaw
bằng chính người dùng sở hữu thư mục trạng thái.

Đối với bản cài đặt Docker, image chính thức chạy dưới người dùng `node` (uid `1000`), vì vậy
các thư mục cấu hình và không gian làm việc OpenClaw được gắn kết từ máy chủ thông thường nên
thuộc sở hữu của uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Nếu bạn chủ đích chạy OpenClaw dưới quyền root, hãy sửa quyền sở hữu của thư mục gốc plugin được quản lý
thành root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sau khi sửa quyền sở hữu, hãy chạy lại `openclaw doctor --fix` hoặc
`openclaw plugins registry --refresh` để registry plugin được lưu trữ
khớp với các tệp đã sửa.

### Thiết lập công cụ plugin chậm

Nếu các lượt chạy của tác nhân có vẻ bị đình trệ trong khi chuẩn bị công cụ, hãy bật ghi nhật ký theo dõi
và kiểm tra các dòng thời gian của factory công cụ plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] thời gian factory ...
```

Bản tóm tắt liệt kê tổng thời gian của factory và các factory công cụ plugin chậm nhất,
bao gồm id plugin, tên công cụ đã khai báo, cấu trúc kết quả và việc công cụ
có phải là tùy chọn hay không. Các dòng chậm được nâng lên thành cảnh báo khi một factory mất
ít nhất 1s hoặc tổng thời gian chuẩn bị factory công cụ plugin mất ít nhất 5s.

OpenClaw lưu kết quả thành công của factory công cụ plugin vào bộ nhớ đệm cho các lần
phân giải lặp lại có cùng ngữ cảnh yêu cầu hiệu dụng. Khóa bộ nhớ đệm bao gồm
cấu hình thời gian chạy hiệu dụng, không gian làm việc và id tác nhân, chính sách sandbox, cài đặt
trình duyệt, ngữ cảnh phân phối, danh tính người yêu cầu và trạng thái quyền sở hữu, vì vậy
các factory phụ thuộc vào những trường đáng tin cậy đó sẽ chạy lại khi ngữ cảnh
thay đổi. Nếu thời gian vẫn cao, plugin có thể đang thực hiện công việc tốn kém trước khi
trả về định nghĩa công cụ.

Nếu một plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký thời gian chạy của plugin đó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt plugin đó. Tác giả plugin nên chuyển
việc tải phần phụ thuộc tốn kém sang sau đường dẫn thực thi công cụ thay vì thực hiện
bên trong factory công cụ.

Để biết về thư mục gốc phần phụ thuộc, xác thực siêu dữ liệu gói, bản ghi registry, hành vi
tải lại khi khởi động và dọn dẹp dữ liệu cũ, hãy xem
[Phân giải phần phụ thuộc của plugin](/vi/plugins/dependency-resolution).

## Liên quan

- [Quản lý plugin](/vi/plugins/manage-plugins) - ví dụ lệnh để liệt kê, cài đặt, cập nhật, gỡ cài đặt và phát hành
- [`openclaw plugins`](/vi/cli/plugins) - tài liệu tham khảo CLI đầy đủ
- [Danh mục plugin](/vi/plugins/plugin-inventory) - danh sách plugin tích hợp sẵn và bên ngoài được tạo tự động
- [Tài liệu tham khảo plugin](/vi/plugins/reference) - các trang tài liệu tham khảo được tạo tự động cho từng plugin
- [Plugin cộng đồng](/vi/plugins/community) - chính sách khám phá ClawHub và PR tài liệu
- [Phân giải phần phụ thuộc của plugin](/vi/plugins/dependency-resolution) - thư mục gốc cài đặt, bản ghi registry và ranh giới thời gian chạy
- [Xây dựng plugin](/vi/plugins/building-plugins) - hướng dẫn tạo plugin gốc
- [Tổng quan về SDK plugin](/vi/plugins/sdk-overview) - đăng ký thời gian chạy, hook và các trường API
- [Manifest plugin](/vi/plugins/manifest) - manifest và siêu dữ liệu gói
