---
doc-schema-version: 1
read_when:
    - Bạn muốn duyệt, cài đặt, bật hoặc tắt các Plugin trong giao diện điều khiển
    - Bạn cần các ví dụ nhanh về cách liệt kê, cài đặt, cập nhật, kiểm tra hoặc gỡ cài đặt Plugin
    - Bạn muốn chọn nguồn cài đặt plugin
    - Bạn cần tài liệu tham khảo phù hợp để phát hành các gói Plugin
sidebarTitle: Manage plugins
summary: Quản lý các plugin OpenClaw từ giao diện điều khiển hoặc CLI
title: Quản lý plugin
x-i18n:
    generated_at: "2026-07-12T08:08:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI bao quát quy trình phổ biến để khám phá, cài đặt, bật và tắt
plugin. CLI bổ sung các chức năng cập nhật, gỡ cài đặt, cấu hình nâng cao và kiểm
soát rõ ràng nguồn cài đặt. Để biết đầy đủ hợp đồng lệnh, cờ, quy tắc chọn nguồn
và các trường hợp biên, hãy xem [`openclaw plugins`](/vi/cli/plugins).

Quy trình CLI điển hình: tìm một gói, cài đặt gói đó từ ClawHub, npm, git hoặc
đường dẫn cục bộ, để Gateway được quản lý tự động khởi động lại (hoặc tự khởi
động lại theo cách thủ công), sau đó xác minh các đăng ký thời gian chạy của
plugin.

## Sử dụng Control UI

Mở **Plugin** trong Control UI hoặc sử dụng `/settings/plugins` tương đối với
đường dẫn cơ sở đã cấu hình của Control UI. Ví dụ, đường dẫn cơ sở `/openclaw`
sẽ sử dụng `/openclaw/settings/plugins`. Trang này có hai thẻ:

- **Đã cài đặt** hiển thị toàn bộ danh mục cục bộ được nhóm theo loại (kênh,
  nhà cung cấp mô hình, bộ nhớ, công cụ). Mỗi hàng mở một chế độ xem chi tiết;
  menu tùy chọn khác (`…`) của hàng đó cho phép bật hoặc tắt plugin và, đối với
  các plugin được cài đặt từ bên ngoài, cung cấp tùy chọn **Gỡ bỏ**. Thẻ này cũng
  liệt kê các [máy chủ MCP](/vi/cli/mcp) đã cấu hình với cùng các thao tác bật, tắt
  và gỡ bỏ qua menu, bằng cách chỉnh sửa `mcp.servers` trong cấu hình Gateway.
- **Khám phá** là cửa hàng: các plugin nổi bật đi kèm OpenClaw, các plugin chính
  thức bên ngoài và một danh mục trình kết nối được tuyển chọn. Thẻ trình kết
  nối cho phép thêm máy chủ MCP được lưu trữ chỉ bằng một lần nhấp (GitHub,
  Notion, Linear, Sentry, Home Assistant) hoặc chuyển đến tìm kiếm ClawHub đã
  điền sẵn. Việc nhập vào hộp tìm kiếm sẽ truy vấn
  [ClawHub](https://clawhub.ai/plugins) ngay trong trang và thêm phần **Từ
  ClawHub** với số lượt tải xuống và huy hiệu xác minh nguồn.

Các plugin đi kèm không cần cài đặt gói. Thao tác menu của chúng là **Bật**
hoặc **Tắt**. Ví dụ, Workboard đi kèm OpenClaw và bị tắt theo mặc định, vì vậy
hãy chọn **Bật** để kích hoạt. Không thể gỡ bỏ các plugin đóng gói sẵn mà chỉ có
thể tắt chúng.

Quyền truy cập danh mục và tìm kiếm yêu cầu `operator.read`. Việc cài đặt, bật,
tắt, gỡ bỏ và thay đổi máy chủ MCP yêu cầu `operator.admin`. Quá trình cài đặt
từ ClawHub do Gateway thực hiện và vẫn áp dụng các bước kiểm tra chính sách về
độ tin cậy, tính toàn vẹn và cài đặt plugin.

Việc cài đặt hoặc gỡ bỏ mã plugin yêu cầu khởi động lại Gateway. Các thay đổi
về trạng thái bật có thể được áp dụng mà không cần khởi động lại khi plugin đã
cài đặt và thời gian chạy Gateway hiện tại hỗ trợ; nếu không, giao diện người
dùng sẽ thông báo rằng cần khởi động lại. Các trình kết nối MCP dựa trên OAuth
vẫn cần chạy `openclaw mcp login <name>` một lần từ CLI sau khi được thêm.

Control UI không cài đặt từ các nguồn npm tùy ý, git hoặc đường dẫn cục bộ,
không cập nhật plugin và không cung cấp cấu hình plugin chuyên sâu. Hãy sử dụng
các quy trình CLI bên dưới cho những thao tác đó.

## Liệt kê và tìm kiếm plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` dành cho tập lệnh:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` là bước kiểm tra danh mục nguội: những gì OpenClaw có thể khám
phá từ cấu hình, manifest và sổ đăng ký plugin được lưu bền vững. Lệnh này không
chứng minh rằng một Gateway đang chạy đã nhập thời gian chạy của plugin. Đầu ra
JSON bao gồm thông tin chẩn đoán sổ đăng ký và `dependencyStatus` của từng
plugin (các `dependencies`/`optionalDependencies` đã khai báo có phân giải được
trên đĩa hay không).

`plugins search` truy vấn ClawHub để tìm các gói plugin có thể cài đặt và in ra
gợi ý cài đặt (`openclaw plugins install clawhub:<package>`) cho mỗi kết quả.

## Bật và tắt plugin

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Chuyển đổi mục cấu hình của plugin mà không động đến các tệp đã cài đặt. Một số
plugin đóng gói sẵn (các nhà cung cấp mô hình/giọng nói đóng gói sẵn, plugin
trình duyệt đóng gói sẵn) được bật theo mặc định; các plugin khác cần chạy
`enable` sau khi cài đặt.

## Cài đặt plugin

```bash
# Tìm kiếm các gói plugin trên ClawHub.
openclaw plugins search "calendar"

# Cài đặt từ ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Cài đặt từ npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Cài đặt từ một thành phần tạo bởi npm pack cục bộ.
openclaw plugins install npm-pack:<path.tgz>

# Cài đặt từ git hoặc một bản checkout phát triển cục bộ.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Các đặc tả gói không có tiền tố sẽ cài đặt từ npm trong giai đoạn chuyển đổi
khởi chạy, trừ khi tên khớp với mã định danh của plugin đóng gói sẵn hoặc plugin
chính thức; trong trường hợp đó OpenClaw sẽ sử dụng bản sao cục bộ/chính thức
tương ứng. Sử dụng `clawhub:`, `npm:`, `git:` hoặc `npm-pack:` để chọn nguồn một
cách xác định.

Chỉ sử dụng `--force` để ghi đè đích cài đặt hiện có bằng một nguồn khác. Đối
với việc nâng cấp thường lệ của bản cài đặt npm, ClawHub hoặc hook-pack đang
được theo dõi, hãy sử dụng `openclaw plugins update`; `--force` không được hỗ
trợ cùng với `--link`.

## Khởi động lại và kiểm tra

Một Gateway được quản lý đang chạy và đã bật tải lại cấu hình sẽ tự động khởi
động lại sau khi cài đặt, cập nhật hoặc gỡ cài đặt mã plugin. Nếu Gateway không
được quản lý hoặc tính năng tải lại bị tắt, hãy tự khởi động lại trước khi kiểm
tra các bề mặt thời gian chạy trực tiếp:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` tải mô-đun plugin và chứng minh rằng plugin đã đăng ký các
bề mặt thời gian chạy (công cụ, hook, dịch vụ, phương thức Gateway, tuyến HTTP,
lệnh CLI do plugin sở hữu). `inspect` thông thường và `list` chỉ là các bước
kiểm tra nguội đối với manifest/cấu hình/sổ đăng ký.

## Cập nhật plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Việc truyền mã định danh plugin sẽ tái sử dụng đặc tả cài đặt đang được theo
dõi: các dist-tag đã lưu (`@beta`) và phiên bản được ghim chính xác sẽ được giữ
lại trong các lần chạy `update <plugin-id>` sau này.

`openclaw plugins update --all` là cách bảo trì hàng loạt. Lệnh này vẫn tuân
theo các đặc tả cài đặt đang được theo dõi thông thường, nhưng bản ghi plugin
OpenClaw chính thức đáng tin cậy sẽ đồng bộ với đích danh mục chính thức hiện
tại thay vì tiếp tục bị ghim vào một gói chính thức chính xác đã lỗi thời; khi
`update.channel` là `beta`, quá trình đồng bộ đó ưu tiên nhánh phát hành beta.
Sử dụng `update <plugin-id>` có mục tiêu để giữ nguyên đặc tả chính thức chính
xác hoặc có thẻ.

Đối với các bản cài đặt npm, hãy truyền một đặc tả gói rõ ràng để chuyển đổi
bản ghi đang được theo dõi:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Lệnh thứ hai đưa plugin trở lại nhánh phát hành mặc định của sổ đăng ký khi
trước đó plugin được ghim vào một phiên bản hoặc thẻ chính xác.

Xem [`openclaw plugins`](/vi/cli/plugins#update) để biết chính xác các quy tắc dự
phòng và ghim phiên bản.

## Gỡ cài đặt plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Quá trình gỡ cài đặt sẽ xóa mục cấu hình của plugin, bản ghi chỉ mục plugin được
lưu bền vững, các mục trong danh sách cho phép/từ chối và các mục
`plugins.load.paths` được liên kết khi áp dụng. Thư mục cài đặt được quản lý sẽ
bị xóa trừ khi bạn truyền `--keep-files`. Gateway được quản lý đang chạy sẽ tự
động khởi động lại khi việc gỡ cài đặt làm thay đổi nguồn plugin.

Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), tất cả thao tác cài đặt, cập nhật, gỡ
cài đặt, bật và tắt plugin đều bị vô hiệu hóa; thay vào đó hãy quản lý các lựa
chọn đó trong nguồn Nix của bản cài đặt.

## Chọn nguồn

| Nguồn       | Sử dụng khi                                                                  | Ví dụ                                                          |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Bạn muốn khả năng khám phá dành riêng cho OpenClaw, bản tóm tắt quét, phiên bản và gợi ý | `openclaw plugins install clawhub:<package>`                   |
| git         | Bạn muốn một nhánh, thẻ hoặc commit từ kho lưu trữ                          | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| đường dẫn cục bộ | Bạn đang phát triển hoặc kiểm thử plugin trên cùng máy                 | `openclaw plugins install --link ./my-plugin`                  |
| chợ ứng dụng | Bạn đang cài đặt plugin chợ ứng dụng tương thích với Claude                | `openclaw plugins install <plugin> --marketplace <source>`     |
| gói npm     | Bạn đang kiểm chứng thành phần gói cục bộ thông qua ngữ nghĩa cài đặt npm   | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Bạn đã phát hành các gói JavaScript hoặc cần dist-tag npm/sổ đăng ký riêng tư | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Các bản cài đặt đường dẫn cục bộ được quản lý phải là thư mục hoặc tệp lưu trữ
plugin. Hãy đặt các tệp plugin độc lập trong `plugins.load.paths` thay vì cài
đặt chúng bằng `plugins install`.

## Phát hành plugin

ClawHub là bề mặt khám phá công khai chính dành cho các plugin OpenClaw. Hãy
phát hành tại đó khi bạn muốn người dùng tìm thấy siêu dữ liệu plugin, lịch sử
phiên bản, kết quả quét sổ đăng ký và gợi ý cài đặt trước khi họ cài đặt.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Các plugin npm gốc phải chứa manifest plugin (`openclaw.plugin.json`) cùng với
siêu dữ liệu `package.json` trước khi phát hành:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Hãy sử dụng các trang này để xem đầy đủ hợp đồng phát hành thay vì coi trang
này là tài liệu tham chiếu về phát hành:

- [Phát hành trên ClawHub](/vi/clawhub/publishing) giải thích về chủ sở hữu, phạm
  vi, bản phát hành, quá trình đánh giá, xác thực gói và chuyển giao gói.
- [Xây dựng plugin](/vi/plugins/building-plugins) trình bày cấu trúc đầy đủ của gói
  plugin (bao gồm `openclaw.plugin.json`) và quy trình phát hành lần đầu.
- [Manifest plugin](/vi/plugins/manifest) định nghĩa các trường manifest plugin
  gốc.

Nếu cùng một gói có trên cả ClawHub và npm, hãy sử dụng tiền tố rõ ràng
`clawhub:` hoặc `npm:` để buộc chọn một nguồn.

## Liên quan

- [Plugin](/vi/tools/plugin) - cài đặt, cấu hình, khởi động lại và khắc phục sự cố
- [`openclaw plugins`](/vi/cli/plugins) - tài liệu tham chiếu CLI đầy đủ
- [Plugin cộng đồng](/vi/plugins/community) - khám phá công khai và phát hành trên ClawHub
- [ClawHub](/vi/clawhub/cli) - các thao tác CLI với sổ đăng ký
- [Xây dựng plugin](/vi/plugins/building-plugins) - tạo gói plugin
- [Manifest plugin](/vi/plugins/manifest) - manifest và siêu dữ liệu gói
