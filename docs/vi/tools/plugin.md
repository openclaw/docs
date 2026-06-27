---
doc-schema-version: 1
read_when:
    - Cài đặt hoặc cấu hình plugin
    - Tìm hiểu quy tắc phát hiện và tải plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Getting Started
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-06-27T18:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw với kênh, nhà cung cấp mô hình, harness tác tử, công cụ,
Skills, giọng nói, phiên âm thời gian thực, thoại, hiểu nội dung đa phương tiện, tạo sinh,
web fetch, web search và các năng lực runtime khác.

Dùng trang này khi bạn muốn cài đặt một Plugin, khởi động lại Gateway, xác minh
runtime đã tải Plugin đó, và xử lý các lỗi thiết lập phổ biến. Với các ví dụ chỉ dùng lệnh,
xem [Quản lý Plugin](/vi/plugins/manage-plugins). Để xem toàn bộ danh mục được tạo
gồm các Plugin được đóng gói sẵn, Plugin chính thức bên ngoài và Plugin chỉ có trong mã nguồn, xem
[Danh mục Plugin](/vi/plugins/plugin-inventory).

## Yêu cầu

Trước khi cài đặt một Plugin, hãy bảo đảm bạn có:

- một checkout hoặc bản cài đặt OpenClaw với CLI `openclaw` khả dụng
- quyền truy cập mạng tới nguồn đã chọn, chẳng hạn ClawHub, npm, hoặc một git host
- mọi thông tin xác thực, khóa cấu hình, hoặc công cụ hệ điều hành dành riêng cho Plugin được nêu
  trong tài liệu thiết lập của Plugin đó
- quyền để Gateway đang phục vụ các kênh của bạn tải lại hoặc khởi động lại

## Bắt đầu nhanh

<Steps>
  <Step title="Tìm Plugin">
    Tìm kiếm [ClawHub](/vi/clawhub) để xem các gói Plugin công khai:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub là bề mặt khám phá chính cho các Plugin cộng đồng. Trong giai đoạn
    chuyển đổi ra mắt, các đặc tả gói trần thông thường vẫn cài đặt từ npm trừ khi
    chúng khớp với một id Plugin chính thức. Các đặc tả gói `@openclaw/*` thô khớp với
    Plugin được đóng gói sẵn sẽ dùng bản sao đóng gói sẵn từ bản dựng OpenClaw hiện tại. Dùng
    một tiền tố rõ ràng khi bạn cần một nguồn cụ thể.

  </Step>

  <Step title="Cài đặt Plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Hãy xem việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản được ghim khi bạn
    cần các bản cài đặt production có thể tái lập.

  </Step>

  <Step title="Cấu hình và bật Plugin">
    Cấu hình các thiết lập dành riêng cho Plugin dưới `plugins.entries.<id>.config`.
    Bật Plugin khi Plugin đó chưa được bật:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Nếu cấu hình của bạn dùng danh sách `plugins.allow` hạn chế, id Plugin đã cài đặt
    phải có trong đó trước khi Plugin có thể tải.
    `openclaw plugins install` thêm id đã cài đặt vào danh sách
    `plugins.allow` hiện có và xóa cùng id đó khỏi `plugins.deny` để bản cài đặt
    rõ ràng có thể tải sau khi khởi động lại.

  </Step>

  <Step title="Để Gateway tải lại">
    Việc cài đặt, cập nhật, hoặc gỡ cài đặt mã Plugin yêu cầu khởi động lại Gateway.
    Khi một Gateway được quản lý đang chạy với tính năng tải lại cấu hình được bật,
    OpenClaw phát hiện bản ghi cài đặt Plugin đã thay đổi và tự động khởi động lại
    Gateway. Nếu Gateway không được quản lý hoặc tải lại bị tắt, hãy tự khởi động lại:

    ```bash
    openclaw gateway restart
    ```

    Các thao tác bật và tắt cập nhật cấu hình và làm mới cold registry.
    Kiểm tra runtime vẫn là đường xác minh rõ ràng nhất cho các bề mặt runtime
    đang hoạt động.

  </Step>

  <Step title="Xác minh đăng ký runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, hook, dịch vụ,
    phương thức Gateway, hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect` thông thường là
    kiểm tra manifest lạnh và registry.

  </Step>
</Steps>

## Cấu hình

### Chọn nguồn cài đặt

| Nguồn       | Dùng khi                                                                        | Ví dụ                                                           |
| ----------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| ClawHub     | Bạn muốn khám phá, quét, siêu dữ liệu phiên bản và gợi ý cài đặt theo kiểu gốc OpenClaw | `openclaw plugins install clawhub:<package>`                   |
| npm         | Bạn cần registry npm trực tiếp hoặc quy trình dist-tag                          | `openclaw plugins install npm:<package>`                       |
| git         | Bạn cần một branch, tag, hoặc commit từ một repository                          | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| đường dẫn cục bộ | Bạn đang phát triển hoặc kiểm thử một Plugin trên cùng máy                 | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Bạn đang cài đặt một Plugin marketplace tương thích Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Các đặc tả gói trần có hành vi tương thích đặc biệt. Nếu tên trần khớp với
id Plugin được đóng gói sẵn, OpenClaw dùng nguồn đóng gói sẵn đó. Nếu khớp với
id Plugin chính thức bên ngoài, OpenClaw dùng danh mục gói chính thức. Các
đặc tả gói trần thông thường khác cài đặt qua npm trong giai đoạn chuyển đổi ra mắt. Các đặc tả gói
`@openclaw/*` thô khớp với Plugin được đóng gói sẵn cũng phân giải tới
bản sao đóng gói sẵn trước khi fallback sang npm. Dùng `npm:@openclaw/<plugin>@<version>` khi
bạn cố ý muốn gói npm bên ngoài thay vì bản sao đóng gói sẵn thuộc image.
Dùng `clawhub:`, `npm:`, `git:`, hoặc `npm-pack:` khi bạn cần
chọn nguồn một cách xác định. Xem [`openclaw plugins`](/vi/cli/plugins#install)
để biết toàn bộ hợp đồng lệnh.

Với các bản cài đặt npm, đặc tả gói không ghim và `@latest` chọn gói stable mới nhất
có khai báo tương thích với bản dựng OpenClaw này. Nếu bản phát hành latest hiện tại
của npm khai báo `openclaw.compat.pluginApi` hoặc
`openclaw.install.minHostVersion` mới hơn, OpenClaw quét các phiên bản gói stable cũ hơn
và cài đặt phiên bản mới nhất phù hợp. Các phiên bản chính xác và tag kênh rõ ràng
như `@beta` vẫn được ghim vào gói đã chọn và thất bại khi không tương thích.

### Chính sách cài đặt của operator

Cấu hình `security.installPolicy` để chạy một lệnh chính sách cục bộ đáng tin cậy trước khi
tiến hành cài đặt hoặc cập nhật Plugin. Chính sách nhận siêu dữ liệu cùng đường dẫn
nguồn đã stage và có thể cho phép hoặc chặn cài đặt. Nó bao phủ các đường cài đặt/cập nhật Plugin
qua CLI và Gateway. Các hook `before_install` của Plugin chạy muộn hơn, chỉ trong
các tiến trình OpenClaw nơi hook Plugin được tải, vì vậy hãy dùng `security.installPolicy`
cho các quyết định cài đặt do operator sở hữu. Cờ đã ngừng khuyến nghị
`--dangerously-force-unsafe-install` được chấp nhận để tương thích nhưng không
bỏ qua chính sách cài đặt hoặc denylist phụ thuộc Plugin tích hợp của OpenClaw.

Xem [Cấu hình Skills](/vi/tools/skills-config#operator-install-policy-securityinstallpolicy)
để biết schema exec `security.installPolicy` dùng chung cho cả Skills và
Plugin.

### Cấu hình chính sách Plugin

Dạng cấu hình Plugin phổ biến là:

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

- `plugins.enabled: false` tắt tất cả Plugin và bỏ qua công việc khám phá/tải Plugin.
  Các tham chiếu Plugin cũ không có hiệu lực khi tùy chọn này đang bật; hãy bật lại
  Plugin trước khi chạy dọn dẹp bằng doctor khi bạn muốn xóa các id cũ.
- `plugins.deny` thắng allow và việc bật từng Plugin.
- `plugins.allow` là một allowlist độc quyền. Các công cụ do Plugin sở hữu nằm ngoài
  allowlist vẫn không khả dụng, ngay cả khi `tools.allow` bao gồm `"*"`.
- `plugins.entries.<id>.enabled: false` tắt một Plugin trong khi vẫn giữ nguyên
  cấu hình của nó.
- `plugins.load.paths` thêm các tệp hoặc thư mục Plugin cục bộ rõ ràng. Các đường dẫn cục bộ do
  `plugins install` quản lý phải là thư mục hoặc archive Plugin; dùng
  `plugins.load.paths` cho các tệp Plugin độc lập.
- Plugin có nguồn gốc từ workspace bị tắt theo mặc định; hãy bật rõ ràng hoặc
  đưa chúng vào allowlist trước khi dùng mã workspace cục bộ.
- Plugin được đóng gói sẵn tuân theo siêu dữ liệu bật mặc định/tắt mặc định tích hợp của chúng trừ khi
  cấu hình ghi đè rõ ràng.
- `plugins.slots.<slot>` chọn một Plugin cho các danh mục độc quyền như
  bộ nhớ và context engine. Việc chọn slot buộc bật Plugin đã chọn
  cho slot đó bằng cách được tính là kích hoạt rõ ràng; Plugin có thể tải ngay cả khi
  bình thường sẽ là opt-in. `plugins.deny` và
  `plugins.entries.<id>.enabled: false` vẫn chặn Plugin đó.
- Plugin opt-in được đóng gói sẵn có thể tự động kích hoạt khi cấu hình nêu tên một trong các
  bề mặt thuộc sở hữu của chúng, chẳng hạn ref nhà cung cấp/mô hình, cấu hình kênh, backend CLI, hoặc runtime
  agent harness.
- Định tuyến Codex thuộc họ OpenAI giữ ranh giới Plugin nhà cung cấp và runtime
  tách biệt: các ref mô hình Codex legacy là cấu hình legacy được doctor sửa, trong khi Plugin
  `codex` được đóng gói sẵn sở hữu runtime Codex app-server cho các ref tác tử `openai/*`
  canonical, `agentRuntime.id: "codex"` rõ ràng, và các ref `codex/*` legacy.

Khi `plugins.allow` chưa được đặt và các Plugin không đóng gói sẵn được tự động phát hiện từ
workspace hoặc các gốc Plugin toàn cục, log khởi động ghi
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
Cảnh báo bao gồm các id Plugin đã phát hiện và, với danh sách ngắn, một đoạn
`plugins.allow` tối thiểu. Chạy
[`openclaw plugins list --enabled --verbose`](/vi/cli/plugins#list) hoặc
[`openclaw plugins inspect <id>`](/vi/cli/plugins#inspect) với id Plugin được liệt kê
trước khi chép các Plugin đáng tin cậy vào `openclaw.json`. Cùng hướng dẫn ghim niềm tin
được áp dụng khi chẩn đoán nói một Plugin đã tải
`without install/load-path provenance`: kiểm tra id Plugin đó, sau đó ghim id
đáng tin cậy trong `plugins.allow` hoặc cài đặt lại từ một nguồn đáng tin cậy để OpenClaw
ghi lại provenance cài đặt.

Chạy `openclaw doctor` hoặc `openclaw doctor --fix` khi xác thực cấu hình báo cáo
id Plugin cũ, allowlist không khớp công cụ, hoặc đường dẫn Plugin đóng gói sẵn legacy.

## Hiểu các định dạng Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng              | Cách tải                                                                     | Dùng khi                                                                |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Plugin OpenClaw gốc    | `openclaw.plugin.json` cộng với một mô-đun runtime được tải trong tiến trình | Bạn đang cài đặt hoặc xây dựng các năng lực runtime riêng cho OpenClaw  |
| Bundle tương thích     | Bố cục Plugin Codex, Claude, hoặc Cursor được ánh xạ vào danh mục Plugin OpenClaw | Bạn đang tái sử dụng Skills, lệnh, hook, hoặc siêu dữ liệu bundle tương thích |

Cả hai định dạng xuất hiện trong `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable`, và `openclaw plugins disable`. Xem
[Bundle Plugin](/vi/plugins/bundles) để biết ranh giới tương thích bundle và
[Xây dựng Plugin](/vi/plugins/building-plugins) để biết cách tạo Plugin gốc.

## Hook Plugin

Plugin có thể đăng ký hook trong runtime, nhưng có hai API khác nhau với
nhiệm vụ khác nhau.

- Dùng hook có kiểu qua `api.on(...)` cho các hook vòng đời runtime. Đây là
  bề mặt được ưu tiên cho middleware, chính sách, viết lại thông điệp, định hình prompt,
  và kiểm soát công cụ.
- Chỉ dùng `api.registerHook(...)` khi bạn muốn tham gia hệ thống hook nội bộ
  được mô tả trong [Hook](/vi/automation/hooks). Điều này chủ yếu dành cho các hiệu ứng phụ
  cấp lệnh/vòng đời thô và khả năng tương thích với tự động hóa kiểu HOOK hiện có.

Quy tắc nhanh:

- Nếu handler cần ưu tiên, ngữ nghĩa hợp nhất, hoặc hành vi chặn/hủy, hãy dùng
  hook Plugin có kiểu.
- Nếu handler chỉ phản ứng với `command:new`, `command:reset`, `message:sent`,
  hoặc các sự kiện thô tương tự, `api.registerHook(...)` là phù hợp.

Các hook nội bộ do Plugin quản lý xuất hiện trong `openclaw hooks list` với
`plugin:<id>`. Bạn không thể bật hoặc tắt chúng qua `openclaw hooks`;
hãy bật hoặc tắt Plugin thay vào đó.

## Xác minh Gateway đang hoạt động

`openclaw plugins list` và `openclaw plugins inspect` thuần đọc cấu hình nguội,
manifest và trạng thái registry. Chúng không chứng minh rằng một Gateway đang chạy
đã nhập cùng mã Plugin đó.

Khi một Plugin có vẻ đã được cài đặt nhưng lưu lượng trò chuyện trực tiếp không dùng đến nó:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Các Gateway được quản lý tự động khởi động lại sau các thay đổi cài đặt, cập nhật và
gỡ cài đặt Plugin làm thay đổi mã nguồn Plugin. Trên các bản cài VPS hoặc container, hãy
đảm bảo mọi thao tác khởi động lại thủ công nhắm đến đúng tiến trình con `openclaw gateway run`
đang phục vụ các kênh của bạn, không chỉ một wrapper hoặc supervisor.

## Khắc phục sự cố

| Triệu chứng                                                     | Kiểm tra                                                                                                                                   | Cách sửa                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Plugin xuất hiện trong `plugins list` nhưng hook runtime không chạy | Dùng `openclaw plugins inspect <id> --runtime --json` và xác nhận Gateway đang hoạt động bằng `gateway status --deep --require-rpc`        | Khởi động lại Gateway trực tiếp sau khi cài đặt, cập nhật, cấu hình hoặc thay đổi mã nguồn               |
| Xuất hiện chẩn đoán quyền sở hữu kênh hoặc công cụ trùng lặp     | Chạy `openclaw plugins list --enabled --verbose`, kiểm tra từng Plugin nghi ngờ bằng `--runtime --json`, và so sánh quyền sở hữu kênh/công cụ | Tắt một chủ sở hữu, xóa các bản cài đặt cũ, hoặc dùng manifest `preferOver` cho việc thay thế có chủ đích |
| Cấu hình báo thiếu một Plugin                                   | Kiểm tra [Kho Plugin](/vi/plugins/plugin-inventory) để biết Plugin đó được đóng gói sẵn, là bản ngoài chính thức, hay chỉ có mã nguồn        | Cài gói bên ngoài, bật Plugin đóng gói sẵn, hoặc xóa cấu hình cũ                                         |
| Cấu hình không hợp lệ trong khi cài đặt                          | Đọc thông báo xác thực và chạy `openclaw doctor --fix` khi thông báo trỏ đến trạng thái Plugin cũ                                          | Doctor có thể cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục nhập và xóa payload không hợp lệ    |
| Đường dẫn Plugin bị chặn vì quyền sở hữu hoặc quyền truy cập đáng ngờ | Kiểm tra chẩn đoán trước lỗi cấu hình                                                                                                      | Sửa quyền sở hữu/quyền truy cập hệ thống tệp, rồi chạy `openclaw plugins registry --refresh`             |
| `OPENCLAW_NIX_MODE=1` chặn các lệnh vòng đời                    | Xác nhận bản cài đặt được Nix quản lý                                                                                                      | Thay đổi lựa chọn Plugin trong nguồn Nix thay vì dùng các lệnh chỉnh sửa Plugin                         |
| Import phụ thuộc thất bại lúc runtime                            | Kiểm tra Plugin được cài qua npm/git/ClawHub hay được tải từ đường dẫn cục bộ                                                              | Chạy `openclaw plugins update <id>`, cài lại nguồn, hoặc tự cài các phụ thuộc của Plugin cục bộ          |

Khi cấu hình Plugin cũ vẫn gọi tên một Plugin kênh không còn có thể khám phá,
quá trình khởi động Gateway sẽ bỏ qua kênh được Plugin đó hỗ trợ thay vì chặn mọi
kênh khác. Chạy `openclaw doctor --fix` để xóa các mục Plugin và kênh cũ. Các khóa
kênh không xác định mà không có bằng chứng Plugin cũ vẫn sẽ làm xác thực thất bại
để lỗi gõ nhầm vẫn hiển thị.

Đối với việc thay thế kênh có chủ đích, Plugin được ưu tiên nên khai báo
`channelConfigs.<channel-id>.preferOver` với id Plugin cũ hoặc có mức ưu tiên thấp hơn.
Nếu cả hai Plugin đều được bật rõ ràng, OpenClaw giữ yêu cầu đó và báo cáo chẩn đoán
kênh hoặc công cụ trùng lặp thay vì âm thầm chọn một chủ sở hữu.

Nếu một gói đã cài đặt báo rằng nó `requires compiled runtime output for
TypeScript entry ...`, gói đó đã được phát hành mà thiếu các tệp JavaScript
OpenClaw cần lúc runtime. Hãy cập nhật hoặc cài đặt lại sau khi nhà phát hành cung cấp
JavaScript đã biên dịch, hoặc tắt/gỡ cài đặt Plugin cho đến lúc đó.

### Quyền sở hữu đường dẫn Plugin bị chặn

Nếu chẩn đoán Plugin báo
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
và xác thực cấu hình tiếp theo báo `plugin present but blocked`, OpenClaw đã tìm thấy
các tệp Plugin thuộc sở hữu của một người dùng Unix khác với tiến trình đang tải chúng.
Giữ nguyên cấu hình Plugin; sửa quyền sở hữu hệ thống tệp hoặc chạy OpenClaw bằng cùng
người dùng sở hữu thư mục trạng thái.

Đối với bản cài Docker, image chính thức chạy dưới người dùng `node` (uid `1000`), vì vậy
các thư mục cấu hình và workspace OpenClaw được bind mount từ host thường nên thuộc sở hữu
của uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Nếu bạn cố ý chạy OpenClaw dưới quyền root, hãy sửa gốc Plugin được quản lý về
quyền sở hữu root thay vào đó:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sau khi sửa quyền sở hữu, chạy lại `openclaw doctor --fix` hoặc
`openclaw plugins registry --refresh` để registry Plugin đã lưu khớp với
các tệp đã được sửa.

### Thiết lập công cụ Plugin chậm

Nếu các lượt agent có vẻ bị khựng lại khi chuẩn bị công cụ, hãy bật ghi log trace và
kiểm tra các dòng thời gian factory công cụ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] factory timings ...
```

Bản tóm tắt liệt kê tổng thời gian factory và các factory công cụ Plugin chậm nhất,
bao gồm id Plugin, tên công cụ đã khai báo, hình dạng kết quả, và công cụ đó có phải
là tùy chọn hay không. Các dòng chậm được nâng lên thành cảnh báo khi một factory đơn lẻ
mất ít nhất 1 giây hoặc tổng thời gian chuẩn bị factory công cụ Plugin mất ít nhất 5 giây.

OpenClaw lưu cache kết quả factory công cụ Plugin thành công cho các lần phân giải lặp lại
với cùng ngữ cảnh yêu cầu hiệu lực. Khóa cache bao gồm cấu hình runtime hiệu lực,
workspace, id agent/phiên, chính sách sandbox, cài đặt trình duyệt, ngữ cảnh giao phát,
danh tính bên yêu cầu và trạng thái quyền sở hữu, vì vậy các factory phụ thuộc vào những
trường đáng tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi. Nếu thời gian vẫn cao,
Plugin có thể đang làm việc tốn kém trước khi trả về định nghĩa công cụ.

Nếu một Plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt Plugin đó. Tác giả Plugin nên chuyển việc tải
phụ thuộc tốn kém xuống sau đường dẫn thực thi công cụ thay vì thực hiện bên trong
factory công cụ.

Để biết về gốc phụ thuộc, xác thực metadata gói, bản ghi registry, hành vi tải lại khi
khởi động và dọn dẹp phần cũ, xem
[Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution).

## Liên quan

- [Quản lý Plugin](/vi/plugins/manage-plugins) - ví dụ lệnh để liệt kê, cài đặt, cập nhật, gỡ cài đặt và phát hành
- [`openclaw plugins`](/vi/cli/plugins) - tham chiếu CLI đầy đủ
- [Kho Plugin](/vi/plugins/plugin-inventory) - danh sách Plugin đóng gói sẵn và bên ngoài được tạo tự động
- [Tham chiếu Plugin](/vi/plugins/reference) - các trang tham chiếu theo từng Plugin được tạo tự động
- [Plugin cộng đồng](/vi/plugins/community) - khám phá ClawHub và chính sách PR tài liệu
- [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution) - gốc cài đặt, bản ghi registry và ranh giới runtime
- [Xây dựng Plugin](/vi/plugins/building-plugins) - hướng dẫn tạo Plugin native
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview) - đăng ký runtime, hook và trường API
- [Manifest Plugin](/vi/plugins/manifest) - metadata manifest và gói
