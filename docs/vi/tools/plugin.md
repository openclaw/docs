---
doc-schema-version: 1
read_when:
    - Cài đặt hoặc cấu hình các plugin
    - Tìm hiểu các quy tắc khám phá và tải Plugin
    - Làm việc với các gói plugin tương thích với Codex/Claude
sidebarTitle: Getting Started
summary: Cài đặt, cấu hình và quản lý các plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-07-19T05:59:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f210dccab059527192eeb0aa2e780dcea243959273938ffaacc867ec96f5085e
    source_path: tools/plugin.md
    workflow: 16
---

Các plugin mở rộng OpenClaw với các kênh, nhà cung cấp mô hình, bộ khung tác tử, công cụ,
kỹ năng, giọng nói, phiên âm theo thời gian thực, thoại, khả năng hiểu nội dung đa phương tiện, tạo nội dung,
tìm nạp web, tìm kiếm web và các khả năng thời gian chạy khác.

Sử dụng trang này để cài đặt một plugin, khởi động lại Gateway, xác minh rằng thời gian chạy
đã tải plugin và xử lý các lỗi thiết lập thường gặp. Để xem các ví dụ chỉ có lệnh, hãy xem
[Quản lý plugin](/vi/plugins/manage-plugins). Để xem danh mục được tạo tự động gồm
các plugin tích hợp sẵn, plugin chính thức bên ngoài và plugin chỉ có mã nguồn, hãy xem
[Danh mục plugin](/vi/plugins/plugin-inventory).

## Yêu cầu

- một bản checkout hoặc bản cài đặt OpenClaw có sẵn CLI `openclaw`
- quyền truy cập mạng đến nguồn đã chọn (ClawHub, npm hoặc máy chủ git)
- mọi thông tin xác thực, khóa cấu hình hoặc công cụ hệ điều hành dành riêng cho plugin được nêu trong
  tài liệu thiết lập của plugin đó
- quyền cho Gateway phục vụ các kênh của bạn tải lại hoặc khởi động lại

## Bắt đầu nhanh

<Steps>
  <Step title="Tìm plugin">
    Tìm kiếm các gói plugin công khai trên [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub là nơi khám phá chính dành cho các plugin cộng đồng. Trong giai đoạn
    chuyển đổi khi ra mắt, các đặc tả gói trần thông thường vẫn được cài đặt từ npm trừ khi
    chúng khớp với id plugin chính thức. Các đặc tả `@openclaw/*` thô khớp với một
    plugin tích hợp sẵn sẽ phân giải thành bản tích hợp sẵn đó. Sử dụng tiền tố nguồn rõ ràng
    khi bạn cần chỉ định cụ thể một nguồn.

  </Step>

  <Step title="Cài đặt plugin">
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

    Hãy xem việc cài đặt plugin như chạy mã. Ưu tiên các phiên bản được ghim để
    có thể tái lập quá trình cài đặt trong môi trường sản xuất. Các gói ClawHub và danh mục
    tích hợp sẵn/chính thức của OpenClaw là các nguồn đáng tin cậy. Các nguồn npm, git,
    đường dẫn/tệp lưu trữ cục bộ, `npm-pack:` hoặc marketplace tùy ý mới yêu cầu
    `--force` trong các lượt cài đặt không tương tác sau khi bạn
    xem xét và tin cậy nguồn đó.

  </Step>

  <Step title="Cấu hình và bật plugin">
    Cấu hình các thiết lập dành riêng cho plugin trong `plugins.entries.<id>.config`.
    Bật plugin nếu plugin chưa được bật:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Nếu `plugins.allow` được đặt, id plugin đã cài đặt phải nằm trong danh sách đó
    trước khi plugin có thể tải. `openclaw plugins install` thêm id đã cài đặt
    vào danh sách `plugins.allow` hiện có và xóa chính id đó khỏi
    `plugins.deny` để lượt cài đặt rõ ràng có thể tải sau khi khởi động lại.

  </Step>

  <Step title="Cho phép Gateway tải lại">
    Việc cài đặt, cập nhật hoặc gỡ cài đặt mã plugin yêu cầu khởi động lại Gateway.
    Gateway được quản lý có bật tính năng tải lại cấu hình sẽ phát hiện bản ghi cài đặt
    plugin đã thay đổi và tự động khởi động lại. Nếu không, hãy tự khởi động lại:

    ```bash
    openclaw gateway restart
    ```

    Việc bật/tắt cập nhật cấu hình và sổ đăng ký lạnh. Việc kiểm tra thời gian chạy
    vẫn là bằng chứng rõ ràng nhất về các bề mặt thời gian chạy trực tiếp.

  </Step>

  <Step title="Xác minh đăng ký thời gian chạy">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Sử dụng `--runtime` để chứng minh các công cụ, hook, dịch vụ, phương thức Gateway
    hoặc lệnh CLI do plugin sở hữu đã được đăng ký. `inspect` thuần túy chỉ là bước kiểm tra
    manifest lạnh và sổ đăng ký.

  </Step>
</Steps>

## Cấu hình

### Chọn nguồn cài đặt

| Nguồn       | Sử dụng khi                                                                     | Ví dụ                                                          |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Bạn muốn khám phá theo kiểu OpenClaw, quét, xem siêu dữ liệu phiên bản và gợi ý cài đặt | `openclaw plugins install clawhub:<package>`                   |
| npm         | Bạn cần quy trình làm việc trực tiếp với sổ đăng ký npm hoặc dist-tag          | `openclaw plugins install npm:<package>`                       |
| git         | Bạn cần một nhánh, thẻ hoặc commit từ kho lưu trữ                              | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| đường dẫn cục bộ | Bạn đang phát triển hoặc kiểm thử plugin trên cùng một máy                | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Bạn đang cài đặt plugin marketplace tương thích với Claude                     | `openclaw plugins install <plugin> --marketplace <source>`     |

Các đặc tả gói trần có hành vi tương thích đặc biệt: tên trần khớp với
id plugin tích hợp sẵn sẽ sử dụng nguồn tích hợp sẵn đó; tên trần khớp với
id plugin chính thức bên ngoài sẽ sử dụng danh mục gói chính thức; mọi
đặc tả trần khác sẽ được cài đặt thông qua npm trong giai đoạn chuyển đổi khi ra mắt. Các đặc tả `@openclaw/*`
thô khớp với plugin tích hợp sẵn cũng phân giải thành bản tích hợp sẵn trước khi
dự phòng sang npm. Sử dụng `npm:@openclaw/<plugin>@<version>` để chủ động cài đặt
gói npm bên ngoài thay cho bản tích hợp sẵn. Sử dụng `clawhub:`, `npm:`,
`git:` hoặc `npm-pack:` để lựa chọn nguồn một cách xác định. Xem
[`openclaw plugins`](/vi/cli/plugins#install) để biết đầy đủ hợp đồng lệnh.

Đối với lượt cài đặt npm, các đặc tả không được ghim và `@latest` sẽ chọn gói ổn định
mới nhất có công bố khả năng tương thích với bản dựng OpenClaw này. Nếu bản phát hành latest
hiện tại của npm khai báo `openclaw.compat.pluginApi` hoặc
`openclaw.install.minHostVersion` mới hơn mức bản dựng này hỗ trợ, OpenClaw sẽ quét
các phiên bản ổn định cũ hơn và cài đặt phiên bản mới nhất phù hợp. Các phiên bản chính xác
và thẻ kênh rõ ràng như `@beta` vẫn được ghim vào gói đã chọn
và sẽ thất bại khi không tương thích.

### Chính sách cài đặt của người vận hành

Cấu hình `security.installPolicy` để chạy một lệnh chính sách cục bộ đáng tin cậy
trước khi quá trình cài đặt hoặc cập nhật plugin tiếp tục. Chính sách nhận siêu dữ liệu cùng
đường dẫn nguồn đã được dàn dựng và có thể cho phép hoặc chặn lượt cài đặt. Chính sách này áp dụng cho cả
đường dẫn cài đặt/cập nhật qua CLI và qua Gateway. Các hook `before_install` của plugin chạy
sau đó và chỉ trong các tiến trình OpenClaw nơi hook plugin được tải, vì vậy hãy sử dụng
`security.installPolicy` cho các quyết định cài đặt do người vận hành sở hữu. Cờ
`--dangerously-force-unsafe-install` không còn được khuyến nghị vẫn được chấp nhận để
tương thích nhưng không có tác dụng: cờ này không bỏ qua chính sách cài đặt hoặc danh sách từ chối
phần phụ thuộc plugin tích hợp sẵn của OpenClaw.

Xem [Cấu hình Skills](/vi/tools/skills-config#operator-install-policy-securityinstallpolicy)
để biết lược đồ thực thi `security.installPolicy` dùng chung cho cả Skills và
plugin.

### Cấu hình chính sách plugin

Hình dạng cấu hình plugin phổ biến là:

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

Các quy tắc chính sách chính:

- `plugins.enabled: false` vô hiệu hóa tất cả plugin và bỏ qua công việc khám phá/tải.
  Các tham chiếu plugin cũ vẫn không hoạt động khi tùy chọn này được bật; hãy bật lại
  plugin trước khi chạy tác vụ dọn dẹp của doctor nếu bạn muốn xóa các id cũ.
- `plugins.deny` được ưu tiên hơn danh sách cho phép và trạng thái bật của từng plugin.
- `plugins.allow` là danh sách cho phép độc quyền. Các công cụ do plugin sở hữu nằm ngoài
  danh sách cho phép vẫn không khả dụng ngay cả khi `tools.allow` chứa `"*"`.
- `plugins.entries.<id>.enabled: false` vô hiệu hóa một plugin nhưng vẫn giữ
  cấu hình của plugin đó.
- `plugins.load.paths` thêm các tệp hoặc thư mục plugin cục bộ rõ ràng.
  Các đường dẫn cục bộ `plugins install` được quản lý phải là thư mục plugin hoặc
  tệp lưu trữ; sử dụng `plugins.load.paths` cho các tệp plugin độc lập.
- Các plugin có nguồn gốc từ workspace bị vô hiệu hóa theo mặc định; hãy bật rõ ràng hoặc
  thêm chúng vào danh sách cho phép trước khi sử dụng mã workspace cục bộ.
- Các plugin tích hợp sẵn tuân theo siêu dữ liệu mặc định bật/mặc định tắt của chúng
  trừ khi cấu hình ghi đè rõ ràng.
- `plugins.slots.<slot>` (`memory` hoặc `contextEngine`) chọn một plugin cho một
  danh mục độc quyền. Việc chọn slot được tính là kích hoạt rõ ràng và
  buộc bật plugin đã chọn cho slot đó, ngay cả khi plugin đó thông thường
  yêu cầu chọn tham gia. `plugins.deny` và `plugins.entries.<id>.enabled: false` vẫn
  chặn plugin.
- Các plugin tích hợp sẵn yêu cầu chọn tham gia có thể tự động kích hoạt khi cấu hình nêu tên một trong các
  bề mặt do chúng sở hữu, chẳng hạn như tham chiếu nhà cung cấp/mô hình, cấu hình kênh, backend CLI
  hoặc thời gian chạy bộ khung tác tử.
- Định tuyến Codex thuộc họ OpenAI giữ ranh giới plugin nhà cung cấp và thời gian chạy
  tách biệt: các tham chiếu mô hình Codex cũ là cấu hình cũ mà doctor sửa chữa,
  trong khi plugin `codex` tích hợp sẵn sở hữu thời gian chạy máy chủ ứng dụng Codex cho
  các tham chiếu tác tử `openai/*` chuẩn, `agentRuntime.id: "codex"` rõ ràng và
  các tham chiếu `codex/*` cũ.

Khi `plugins.allow` chưa được đặt và các plugin không tích hợp sẵn được tự động khám phá từ
workspace hoặc các gốc plugin toàn cục, quá trình khởi động sẽ ghi nhật ký
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
cùng với các id plugin đã khám phá và, đối với danh sách ngắn, một đoạn mã `plugins.allow`
tối thiểu. Chạy [`openclaw plugins list --enabled --verbose`](/vi/cli/plugins#list)
hoặc [`openclaw plugins inspect <id>`](/vi/cli/plugins#inspect) trên id
plugin được liệt kê trước khi sao chép các plugin đáng tin cậy vào `openclaw.json`. Cách ghim
độ tin cậy tương tự cũng áp dụng khi chẩn đoán cho biết một plugin đã tải
`without install/load-path provenance`: kiểm tra id plugin đó, sau đó ghim plugin trong
`plugins.allow` hoặc cài đặt lại từ nguồn đáng tin cậy để OpenClaw ghi lại
nguồn gốc cài đặt.

Chạy `openclaw doctor` hoặc `openclaw doctor --fix` khi quá trình xác thực cấu hình
báo cáo id plugin cũ, sự không khớp giữa danh sách cho phép và công cụ hoặc đường dẫn plugin tích hợp sẵn
cũ.

## Tìm hiểu các định dạng plugin

OpenClaw nhận dạng hai định dạng plugin:

| Định dạng              | Cách tải                                                                     | Sử dụng khi                                                             |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin OpenClaw gốc    | `openclaw.plugin.json` cộng với một mô-đun thời gian chạy được tải trong tiến trình | Bạn đang cài đặt hoặc xây dựng các khả năng thời gian chạy dành riêng cho OpenClaw |
| Gói tương thích        | Bố cục plugin Codex, Claude hoặc Cursor được ánh xạ vào danh mục plugin OpenClaw | Bạn đang tái sử dụng các kỹ năng, lệnh, hook hoặc siêu dữ liệu gói tương thích |

Cả hai định dạng đều xuất hiện trong `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` và `openclaw plugins disable`. Xem
[Gói plugin](/vi/plugins/bundles) để biết ranh giới tương thích của gói và
[Xây dựng plugin](/vi/plugins/building-plugins) để biết cách tạo plugin gốc.

## Hook plugin

Plugin có thể đăng ký hook trong thời gian chạy thông qua hai API khác nhau:

- Hook có kiểu `api.on(...)` dành cho các sự kiện vòng đời thời gian chạy. Đây là
  bề mặt được ưu tiên cho phần mềm trung gian, chính sách, viết lại thông điệp, định hình
  prompt và kiểm soát công cụ.
- `api.registerHook(...)` dành cho hệ thống hook nội bộ được mô tả trong
  [Hook](/vi/automation/hooks). Hệ thống này chủ yếu dành cho các hiệu ứng phụ thô ở cấp lệnh/vòng đời
  và khả năng tương thích với tự động hóa kiểu HOOK hiện có.

Quy tắc nhanh: nếu trình xử lý cần độ ưu tiên, ngữ nghĩa hợp nhất hoặc
hành vi chặn/hủy, hãy sử dụng hook có kiểu. Nếu trình xử lý chỉ phản ứng với `command:new`,
`command:reset`, `message:sent` hoặc các sự kiện thô tương tự, `api.registerHook`
là phù hợp.

Các hook nội bộ do plugin quản lý xuất hiện trong `openclaw hooks list` với
`plugin:<id>`. Bạn không thể bật hoặc tắt chúng thông qua `openclaw hooks`;
thay vào đó, hãy bật hoặc tắt plugin.

## Xác minh Gateway đang hoạt động

`openclaw plugins list` và `openclaw plugins inspect` thuần túy đọc cấu hình nguội,
trạng thái manifest và registry. Chúng không chứng minh rằng một Gateway đang chạy
đã nhập cùng mã Plugin.

Khi một Plugin có vẻ đã được cài đặt nhưng lưu lượng trò chuyện trực tiếp không sử dụng Plugin đó:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Các Gateway được quản lý tự động khởi động lại sau những thay đổi cài đặt, cập nhật và
gỡ cài đặt Plugin làm thay đổi mã nguồn Plugin. Trên các bản cài đặt VPS hoặc container, hãy
đảm bảo mọi thao tác khởi động lại thủ công đều nhắm đến đúng tiến trình con `openclaw gateway run`
phục vụ các kênh của bạn, chứ không chỉ một trình bao bọc hoặc trình giám sát.

## Khắc phục sự cố

| Triệu chứng                                                        | Kiểm tra                                                                                                                                      | Cách khắc phục                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin xuất hiện trong `plugins list` nhưng các hook runtime không chạy  | Sử dụng `openclaw plugins inspect <id> --runtime --json` và xác nhận Gateway đang hoạt động bằng `gateway status --deep --require-rpc`             | Khởi động lại Gateway trực tiếp sau khi cài đặt, cập nhật, thay đổi cấu hình hoặc mã nguồn                               |
| Xuất hiện chẩn đoán quyền sở hữu kênh hoặc công cụ trùng lặp         | Chạy `openclaw plugins list --enabled --verbose`, kiểm tra từng Plugin bị nghi ngờ bằng `--runtime --json` và so sánh quyền sở hữu kênh/công cụ | Tắt một chủ sở hữu, xóa các bản cài đặt cũ hoặc sử dụng `preferOver` trong manifest để thay thế có chủ đích      |
| Cấu hình cho biết thiếu một Plugin                                | Kiểm tra [Danh mục Plugin](/vi/plugins/plugin-inventory) để xác định Plugin đó được đóng gói sẵn, là Plugin bên ngoài chính thức hay chỉ có mã nguồn                           | Cài đặt gói bên ngoài, bật Plugin được đóng gói sẵn hoặc xóa cấu hình cũ                         |
| Cấu hình không hợp lệ trong khi cài đặt                               | Đọc thông báo xác thực và chạy `openclaw doctor --fix` nếu thông báo chỉ ra trạng thái Plugin cũ                                             | Doctor có thể cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục nhập và xóa payload không hợp lệ     |
| Đường dẫn Plugin bị chặn do quyền sở hữu hoặc quyền truy cập đáng ngờ | Kiểm tra chẩn đoán trước lỗi cấu hình                                                                                             | Sửa quyền sở hữu/quyền truy cập của hệ thống tệp, sau đó chạy `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` chặn các lệnh vòng đời                | Xác nhận bản cài đặt được Nix quản lý                                                                                                      | Thay đổi lựa chọn Plugin trong mã nguồn Nix thay vì sử dụng các lệnh sửa đổi Plugin                      |
| Không thể nhập phần phụ thuộc trong runtime                             | Kiểm tra xem Plugin được cài đặt qua npm/git/ClawHub hay được tải từ một đường dẫn cục bộ                                                 | Chạy `openclaw plugins update <id>`, cài đặt lại nguồn hoặc tự cài đặt các phần phụ thuộc của Plugin cục bộ |

Khi một Plugin được quản lý và đang bật không vượt qua bước xác minh payload trong lúc Gateway
khởi động, OpenClaw cách ly chính xác thư mục gốc của Plugin đã cài đặt đó trong lần khởi động này và
tiếp tục phục vụ các Plugin khác. `openclaw status --all`, `openclaw health`
và `openclaw doctor` báo cáo Plugin đó là `configured-unavailable`. Sửa hoặc cài đặt lại
Plugin, sau đó khởi động lại Gateway. Một giá trị ghi đè `plugins.load.paths` tường minh và hợp lệ
có cùng id Plugin sẽ không bị cách ly bởi một bản cài đặt cũ bị hỏng.

Khi cấu hình Plugin cũ vẫn nêu tên một Plugin kênh không còn có thể được phát hiện,
quá trình xác thực cấu hình hạ khóa kênh đó xuống thành cảnh báo thay vì lỗi nghiêm trọng,
để Gateway vẫn có thể khởi động và phục vụ mọi kênh khác. Chạy
`openclaw doctor --fix` để xóa các mục nhập Plugin và kênh cũ. Các khóa
kênh không xác định mà không có bằng chứng về Plugin cũ vẫn khiến xác thực thất bại để lỗi chính tả
luôn hiển thị rõ ràng.

Đối với việc thay thế kênh có chủ đích, Plugin ưu tiên nên khai báo
`channelConfigs.<channel-id>.preferOver` với id Plugin cũ hoặc có mức ưu tiên thấp hơn.
Nếu cả hai Plugin đều được bật tường minh, OpenClaw giữ nguyên yêu cầu đó
và báo cáo chẩn đoán kênh/công cụ trùng lặp thay vì âm thầm chọn
một chủ sở hữu.

Nếu một gói đã cài đặt báo cáo rằng nó `requires compiled runtime output for
TypeScript entry ...`, gói đó đã được phát hành mà không có các tệp JavaScript
OpenClaw cần trong runtime. Hãy cập nhật hoặc cài đặt lại sau khi nhà phát hành cung cấp
JavaScript đã biên dịch, hoặc tắt/gỡ cài đặt Plugin cho đến lúc đó.

### Quyền sở hữu đường dẫn Plugin bị chặn

Nếu chẩn đoán cho biết
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
và bước xác thực tiếp theo hiển thị `plugin present but blocked`, OpenClaw đã phát hiện
các tệp Plugin thuộc sở hữu của một người dùng Unix khác với tiến trình đang tải chúng.
Giữ nguyên cấu hình Plugin; sửa quyền sở hữu hệ thống tệp hoặc chạy OpenClaw
bằng cùng người dùng sở hữu thư mục trạng thái.

Đối với các bản cài đặt Docker, image chính thức chạy dưới dạng `node` (uid `1000`), vì vậy
các thư mục cấu hình và không gian làm việc OpenClaw được bind mount từ máy chủ thông thường nên
thuộc sở hữu của uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Nếu bạn chủ ý chạy OpenClaw dưới quyền root, hãy sửa thư mục gốc của Plugin được quản lý để
thuộc quyền sở hữu của root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sau khi sửa quyền sở hữu, hãy chạy lại `openclaw doctor --fix` hoặc
`openclaw plugins registry --refresh` để registry Plugin được lưu bền vững
khớp với các tệp đã sửa.

### Thiết lập công cụ Plugin chậm

Nếu các lượt chạy của agent có vẻ bị đình trệ trong khi chuẩn bị công cụ, hãy bật ghi log trace
và kiểm tra các dòng thời gian của factory công cụ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] thời gian factory ...
```

Bản tóm tắt liệt kê tổng thời gian factory và các factory công cụ Plugin chậm nhất,
bao gồm id Plugin, tên công cụ đã khai báo, hình dạng kết quả và công cụ
có phải là tùy chọn hay không. Các dòng chậm được nâng thành cảnh báo khi một factory mất
ít nhất 1s hoặc tổng thời gian chuẩn bị factory công cụ Plugin mất ít nhất 5s.

OpenClaw lưu vào bộ nhớ đệm các kết quả factory công cụ Plugin thành công cho những lần
phân giải lặp lại với cùng ngữ cảnh yêu cầu hiệu dụng. Khóa bộ nhớ đệm bao gồm
cấu hình runtime hiệu dụng, không gian làm việc và id agent, chính sách sandbox, cài đặt
trình duyệt, ngữ cảnh phân phối, danh tính người yêu cầu và trạng thái quyền sở hữu, vì vậy
các factory phụ thuộc vào những trường đáng tin cậy đó sẽ chạy lại khi ngữ cảnh
thay đổi. Nếu thời gian vẫn cao, Plugin có thể đang thực hiện công việc tốn kém trước khi
trả về các định nghĩa công cụ.

Nếu một Plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của Plugin đó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt Plugin đó. Tác giả Plugin nên chuyển
việc tải phần phụ thuộc tốn kém vào sau đường dẫn thực thi công cụ thay vì thực hiện
bên trong factory công cụ.

Để biết về thư mục gốc phần phụ thuộc, xác thực siêu dữ liệu gói, bản ghi registry, hành vi
tải lại khi khởi động và dọn dẹp dữ liệu cũ, hãy xem
[Phân giải phần phụ thuộc Plugin](/vi/plugins/dependency-resolution).

## Liên quan

- [Quản lý Plugin](/vi/plugins/manage-plugins) - ví dụ lệnh để liệt kê, cài đặt, cập nhật, gỡ cài đặt và phát hành
- [`openclaw plugins`](/vi/cli/plugins) - tài liệu tham khảo CLI đầy đủ
- [Danh mục Plugin](/vi/plugins/plugin-inventory) - danh sách Plugin được đóng gói sẵn và bên ngoài được tạo tự động
- [Tài liệu tham khảo Plugin](/vi/plugins/reference) - các trang tài liệu tham khảo cho từng Plugin được tạo tự động
- [Plugin cộng đồng](/vi/plugins/community) - chính sách khám phá ClawHub và PR tài liệu
- [Phân giải phần phụ thuộc Plugin](/vi/plugins/dependency-resolution) - thư mục gốc cài đặt, bản ghi registry và ranh giới runtime
- [Xây dựng Plugin](/vi/plugins/building-plugins) - hướng dẫn tạo Plugin gốc
- [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview) - đăng ký runtime, hook và các trường API
- [Manifest Plugin](/vi/plugins/manifest) - manifest và siêu dữ liệu gói
