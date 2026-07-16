---
doc-schema-version: 1
read_when:
    - Bạn muốn duyệt, cài đặt, bật hoặc tắt các plugin trong giao diện điều khiển
    - Bạn muốn các ví dụ nhanh về cách liệt kê, cài đặt, cập nhật, kiểm tra hoặc gỡ cài đặt plugin
    - Bạn muốn chọn nguồn cài đặt plugin
    - Bạn cần tài liệu tham khảo phù hợp để phát hành các gói plugin
sidebarTitle: Manage plugins
summary: Quản lý các plugin OpenClaw từ giao diện điều khiển hoặc CLI
title: Quản lý plugin
x-i18n:
    generated_at: "2026-07-16T14:44:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI bao quát quy trình phổ biến để khám phá, cài đặt, bật và tắt
Plugin. CLI bổ sung chức năng cập nhật, gỡ cài đặt, cấu hình nâng cao và các
tùy chọn kiểm soát rõ ràng nguồn cài đặt. Để biết đầy đủ quy ước lệnh, cờ,
quy tắc chọn nguồn và các trường hợp biên, hãy xem [`openclaw plugins`](/vi/cli/plugins).

Quy trình CLI điển hình: tìm một gói, cài đặt gói đó từ ClawHub, npm, git hoặc
đường dẫn cục bộ, để Gateway được quản lý tự động khởi động lại (hoặc khởi động
lại theo cách thủ công), sau đó xác minh các đăng ký thời gian chạy của Plugin.

## Sử dụng Control UI

Mở **Plugin** trong Control UI hoặc sử dụng `/settings/plugins` tương đối với
đường dẫn cơ sở đã cấu hình của Control UI. Ví dụ: đường dẫn cơ sở
`/openclaw` sử dụng `/openclaw/settings/plugins`. Trang này có hai thẻ:

- **Đã cài đặt** hiển thị toàn bộ danh mục cục bộ được nhóm theo loại (kênh,
  nhà cung cấp mô hình, bộ nhớ, công cụ). Mỗi hàng mở một giao diện chi tiết;
  menu mục bổ sung (`…`) cho phép bật hoặc tắt Plugin và, đối với
  các Plugin được cài đặt bên ngoài, cung cấp tùy chọn **Xóa**. Thẻ này cũng liệt kê
  các [máy chủ MCP](/vi/cli/mcp) đã cấu hình với các thao tác bật, tắt và xóa
  tương tự qua menu, bằng cách chỉnh sửa `mcp.servers` trong cấu hình Gateway.
- **Khám phá** là cửa hàng: các Plugin nổi bật đi kèm OpenClaw, các Plugin
  chính thức bên ngoài và một danh mục trình kết nối được tuyển chọn. Thẻ trình
  kết nối cho phép thêm máy chủ MCP được lưu trữ chỉ bằng một lần nhấp
  (GitHub, Notion, Linear, Sentry, Home Assistant) hoặc chuyển đến tìm kiếm
  ClawHub đã được điền sẵn. Việc nhập vào hộp tìm kiếm sẽ truy vấn nội tuyến
  [ClawHub](https://clawhub.ai/plugins) và thêm phần **Từ ClawHub** với số lượt
  tải xuống và huy hiệu xác minh nguồn.

Các Plugin đi kèm không cần cài đặt gói. Thao tác trong menu của chúng là
**Bật** hoặc **Tắt**. Ví dụ, Workboard đi kèm OpenClaw và bị tắt theo mặc định,
vì vậy hãy chọn **Bật** để kích hoạt. Không thể xóa các Plugin đi kèm mà chỉ có
thể tắt chúng.

Quyền truy cập danh mục và tìm kiếm yêu cầu `operator.read`. Các thay đổi
về cài đặt, bật, tắt, xóa và máy chủ MCP yêu cầu `operator.admin`. Việc cài
đặt từ ClawHub do Gateway thực hiện và duy trì các bước kiểm tra chính sách về
độ tin cậy, tính toàn vẹn và cài đặt Plugin. Khi quản trị viên bật một Plugin
đã cài đặt, thao tác đó cũng ghi nhận sự tin cậy rõ ràng bằng cách thêm Plugin
được chọn vào danh sách hạn chế `plugins.allow` hiện có. Một mục
`plugins.deny` rõ ràng vẫn có hiệu lực quyết định và phải được xóa trước
khi bật Plugin.

Việc cài đặt hoặc xóa mã Plugin yêu cầu khởi động lại Gateway. Các thay đổi về
trạng thái bật có thể được áp dụng mà không cần khởi động lại khi Plugin đã cài
đặt và thời gian chạy Gateway hiện tại hỗ trợ; nếu không, giao diện người dùng
sẽ thông báo rằng cần khởi động lại. Các trình kết nối MCP dựa trên OAuth vẫn
cần thực hiện một lần `openclaw mcp login <name>` từ CLI sau khi được thêm.

Control UI không cài đặt từ các nguồn npm, git hoặc đường dẫn cục bộ tùy ý,
không cập nhật Plugin và không cung cấp cấu hình Plugin chuyên sâu. Hãy sử dụng
các quy trình CLI bên dưới cho những thao tác đó.

## Liệt kê và tìm kiếm Plugin

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

`plugins list` là bước kiểm tra danh mục ở trạng thái nguội: những gì
OpenClaw có thể khám phá từ cấu hình, tệp kê khai và sổ đăng ký Plugin được lưu
bền vững. Bước này không chứng minh rằng Gateway đang chạy đã nhập thời gian
chạy của Plugin. Đầu ra JSON bao gồm thông tin chẩn đoán sổ đăng ký và
`dependencyStatus` của từng Plugin (các `dependencies`/`optionalDependencies`
đã khai báo có phân giải được trên đĩa hay không).

`plugins search` truy vấn ClawHub để tìm các gói Plugin có thể cài đặt và
in một gợi ý cài đặt (`openclaw plugins install clawhub:<package>`) cho mỗi kết quả.

## Bật và tắt Plugin

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Chuyển đổi mục cấu hình của Plugin mà không tác động đến các tệp đã cài đặt.
Một số Plugin đi kèm (nhà cung cấp mô hình/giọng nói đi kèm, Plugin trình duyệt
đi kèm) được bật theo mặc định; các Plugin khác yêu cầu `enable` sau
khi cài đặt.

## Cài đặt Plugin

```bash
# Tìm kiếm các gói Plugin trên ClawHub.
openclaw plugins search "calendar"

# Cài đặt từ ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Cài đặt từ npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Cài đặt từ một sản phẩm npm-pack cục bộ.
openclaw plugins install npm-pack:<path.tgz>

# Cài đặt từ git hoặc một bản checkout phát triển cục bộ.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Các thông số gói thuần túy được cài đặt từ npm trong quá trình chuyển đổi khởi
chạy, trừ khi tên khớp với mã định danh của một Plugin đi kèm hoặc chính thức;
trong trường hợp đó, OpenClaw sử dụng bản sao cục bộ/chính thức tương ứng. Sử
dụng `clawhub:`, `npm:`, `git:` hoặc
`npm-pack:` để chọn nguồn một cách xác định. Các gói danh mục đi kèm và
chính thức của OpenClaw được tin cậy cùng với các gói ClawHub. Các nguồn npm
tùy ý mới, git, đường dẫn/kho lưu trữ cục bộ, `npm-pack:` hoặc sàn giao
dịch yêu cầu `--force` trong quá trình cài đặt không tương tác sau khi
bạn đã xem xét và tin cậy nguồn.

`--force` xác nhận một nguồn không phải ClawHub mà không nhắc hỏi và
ghi đè đích cài đặt hiện có khi cần. Đối với việc nâng cấp định kỳ một bản cài
đặt npm, ClawHub hoặc hook-pack được theo dõi, hãy sử dụng `openclaw plugins update`
thay thế. Với `--link`, `--force` chỉ xác nhận nguồn; thư
mục được liên kết không bị sao chép hoặc ghi đè.

## Khởi động lại và kiểm tra

Gateway được quản lý đang chạy và đã bật tải lại cấu hình sẽ tự động khởi động
lại sau khi cài đặt, cập nhật hoặc gỡ cài đặt mã Plugin. Nếu Gateway không được
quản lý hoặc chức năng tải lại bị tắt, hãy tự khởi động lại trước khi kiểm tra
các bề mặt thời gian chạy trực tiếp:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` tải mô-đun Plugin và chứng minh rằng mô-đun đã đăng ký các
bề mặt thời gian chạy (công cụ, hook, dịch vụ, phương thức Gateway, tuyến HTTP,
lệnh CLI do Plugin sở hữu). `inspect` và `list` thông
thường chỉ là các bước kiểm tra tệp kê khai/cấu hình/sổ đăng ký ở trạng thái
nguội.

## Cập nhật Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Việc truyền mã định danh Plugin sẽ tái sử dụng thông số cài đặt được theo dõi:
các dist-tag đã lưu (`@beta`) và phiên bản được ghim chính xác được
chuyển tiếp sang các lần chạy `update <plugin-id>` sau này.

`openclaw plugins update --all` là quy trình bảo trì hàng loạt. Quy trình này vẫn tuân theo
các thông số cài đặt được theo dõi thông thường, nhưng các bản ghi Plugin
OpenClaw chính thức đáng tin cậy sẽ đồng bộ với đích danh mục chính thức hiện
tại thay vì tiếp tục bị ghim vào một gói chính thức chính xác đã lỗi thời; khi
`update.channel` là `beta`, quá trình đồng bộ đó ưu tiên dòng
phát hành beta. Sử dụng `update <plugin-id>` có mục tiêu để giữ nguyên một thông
số chính thức chính xác hoặc được gắn thẻ.

Đối với các bản cài đặt npm, hãy truyền một thông số gói rõ ràng để chuyển đổi
bản ghi được theo dõi:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Lệnh thứ hai chuyển Plugin trở lại dòng phát hành mặc định của sổ đăng ký khi
trước đó Plugin đã được ghim vào một phiên bản hoặc thẻ chính xác.

Xem [`openclaw plugins`](/vi/cli/plugins#update) để biết chính xác các quy tắc dự
phòng và ghim.

## Gỡ cài đặt Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Thao tác gỡ cài đặt xóa mục cấu hình của Plugin, bản ghi chỉ mục Plugin được
lưu bền vững, các mục trong danh sách cho phép/từ chối và các mục
`plugins.load.paths` được liên kết khi áp dụng. Thư mục cài đặt được quản lý sẽ
bị xóa trừ khi bạn truyền `--keep-files`. Gateway được quản lý đang chạy
sẽ tự động khởi động lại khi thao tác gỡ cài đặt làm thay đổi nguồn Plugin.

Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác cài đặt, cập nhật, gỡ cài
đặt, bật và tắt Plugin đều bị vô hiệu hóa; thay vào đó, hãy quản lý các lựa
chọn đó trong nguồn Nix của bản cài đặt.

## Chọn nguồn

| Nguồn       | Sử dụng khi                                                                  | Ví dụ                                                          |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Bạn muốn khả năng khám phá riêng cho OpenClaw, bản tóm tắt quét, phiên bản và gợi ý | `openclaw plugins install clawhub:<package>`                   |
| git         | Bạn muốn một nhánh, thẻ hoặc commit từ kho lưu trữ                          | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| đường dẫn cục bộ | Bạn đang phát triển hoặc kiểm thử Plugin trên cùng một máy             | `openclaw plugins install --link ./my-plugin`                  |
| sàn giao dịch | Bạn đang cài đặt một Plugin sàn giao dịch tương thích với Claude          | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Bạn đang xác minh một sản phẩm gói cục bộ thông qua ngữ nghĩa cài đặt npm    | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Bạn đã phát hành các gói JavaScript hoặc cần dist-tag npm/sổ đăng ký riêng   | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Các bản cài đặt đường dẫn cục bộ được quản lý phải là thư mục hoặc kho lưu trữ
Plugin. Đặt các tệp Plugin độc lập vào `plugins.load.paths` thay vì cài đặt chúng
bằng `plugins install`.

## Phát hành Plugin

ClawHub là bề mặt khám phá công khai chính dành cho các Plugin OpenClaw. Hãy
phát hành tại đó khi bạn muốn người dùng tìm thấy siêu dữ liệu Plugin, lịch sử
phiên bản, kết quả quét sổ đăng ký và gợi ý cài đặt trước khi họ cài đặt.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Các Plugin npm gốc phải cung cấp tệp kê khai Plugin (`openclaw.plugin.json`) cùng
với siêu dữ liệu `package.json` trước khi phát hành:

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

Hãy sử dụng các trang sau để xem đầy đủ quy ước phát hành thay vì coi trang
này là tài liệu tham khảo về phát hành:

- [Phát hành trên ClawHub](/vi/clawhub/publishing) giải thích về chủ sở hữu, phạm vi,
  bản phát hành, quy trình xét duyệt, xác thực gói và chuyển giao gói.
- [Xây dựng Plugin](/vi/plugins/building-plugins) trình bày cấu trúc đầy đủ của gói
  Plugin (bao gồm `openclaw.plugin.json`) và quy trình phát hành lần đầu.
- [Tệp kê khai Plugin](/vi/plugins/manifest) định nghĩa các trường của tệp kê khai
  Plugin gốc.

Nếu cùng một gói có sẵn trên cả ClawHub và npm, hãy sử dụng tiền tố
`clawhub:` hoặc `npm:` rõ ràng để buộc sử dụng một nguồn.

## Liên quan

- [Plugin](/vi/tools/plugin) - cài đặt, cấu hình, khởi động lại và khắc phục sự cố
- [`openclaw plugins`](/vi/cli/plugins) - tài liệu tham khảo CLI đầy đủ
- [Plugin cộng đồng](/vi/plugins/community) - khám phá công khai và phát hành trên ClawHub
- [ClawHub](/vi/clawhub/cli) - các thao tác CLI với sổ đăng ký
- [Xây dựng Plugin](/vi/plugins/building-plugins) - tạo gói Plugin
- [Tệp kê khai Plugin](/vi/plugins/manifest) - tệp kê khai và siêu dữ liệu gói
