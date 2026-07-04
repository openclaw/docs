---
read_when:
    - Bạn đang gỡ lỗi các lượt cài đặt gói Plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt của trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw được đóng gói hoặc các tệp kê khai Plugin đi kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phụ thuộc Plugin
title: Phân giải phụ thuộc Plugin
x-i18n:
    generated_at: "2026-07-04T15:24:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw giữ công việc phụ thuộc của Plugin ở thời điểm cài đặt/cập nhật. Việc tải runtime
không chạy trình quản lý gói, sửa cây phụ thuộc, hoặc thay đổi thư mục gói
OpenClaw.

## Phân chia trách nhiệm

Các gói Plugin sở hữu biểu đồ phụ thuộc của chúng:

- phụ thuộc runtime nằm trong `dependencies` hoặc `optionalDependencies` của gói Plugin
- các import SDK/core là peer hoặc là import do OpenClaw cung cấp
- Plugin phát triển cục bộ tự mang các phụ thuộc đã được cài đặt sẵn
- Plugin npm và git được cài vào các gốc gói do OpenClaw sở hữu

OpenClaw chỉ sở hữu vòng đời Plugin:

- phát hiện nguồn Plugin
- cài đặt hoặc cập nhật gói khi được yêu cầu rõ ràng
- ghi lại metadata cài đặt
- tải entrypoint của Plugin
- thất bại với lỗi có thể hành động khi thiếu phụ thuộc

## Gốc cài đặt

OpenClaw dùng các gốc ổn định theo từng nguồn:

- gói npm cài vào các dự án theo từng Plugin dưới
  `~/.openclaw/npm/projects/<encoded-package>`
- gói git clone dưới `~/.openclaw/git`
- cài đặt local/path/archive được sao chép hoặc tham chiếu mà không sửa phụ thuộc

Cài đặt npm chạy trong gốc dự án theo từng Plugin đó với:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` dùng cùng gốc dự án npm theo từng Plugin đó
cho tarball npm-pack cục bộ. OpenClaw đọc metadata npm của tarball,
thêm nó vào dự án được quản lý dưới dạng phụ thuộc `file:` đã sao chép, chạy
cài đặt npm bình thường, rồi xác minh metadata lockfile đã cài trước khi
tin tưởng Plugin.
Cách này dành cho proof chấp nhận gói và release-candidate, nơi một
artifact pack cục bộ nên hoạt động như artifact registry mà nó mô phỏng.

Dùng `npm-pack:` khi kiểm thử các gói Plugin chính thức hoặc bên ngoài trước khi
publish. Cài đặt archive hoặc path thô hữu ích cho gỡ lỗi cục bộ, nhưng nó
không chứng minh cùng đường dẫn phụ thuộc như một gói npm hoặc ClawHub đã cài.
`npm-pack:` chứng minh hình dạng cài đặt gói được quản lý; bản thân nó
không phải là proof rằng Plugin là nội dung chính thức được liên kết catalog.

Khi hành vi phụ thuộc vào trạng thái Plugin đi kèm hoặc Plugin chính thức đáng tin cậy, hãy ghép
proof gói cục bộ với một cài đặt chính thức dựa trên catalog hoặc một
đường dẫn gói đã publish có ghi nhận độ tin cậy chính thức. Quyền truy cập helper đặc quyền và
xử lý phạm vi trusted-official nên được xác thực trên đường dẫn cài đặt đáng tin cậy đó,
không suy diễn từ một cài đặt tarball cục bộ.

Nếu một Plugin thất bại ở runtime do thiếu import, hãy sửa package manifest
thay vì sửa thủ công dự án được quản lý. Import runtime thuộc về
`dependencies` hoặc `optionalDependencies` của gói Plugin; `devDependencies`
không được cài cho các dự án runtime được quản lý. Một lần `npm install` cục bộ bên trong
`~/.openclaw/npm/projects/<encoded-package>` có thể gỡ chặn chẩn đoán tạm thời,
nhưng đó không phải là proof chấp nhận gói vì lần cài đặt hoặc cập nhật tiếp theo sẽ
tạo lại dự án từ metadata gói.

npm có thể hoist các phụ thuộc bắc cầu vào `node_modules` của dự án theo từng Plugin
bên cạnh gói Plugin. OpenClaw quét gốc dự án được quản lý
trước khi tin tưởng cài đặt và xóa dự án đó khi gỡ cài đặt, vì vậy
các phụ thuộc runtime đã hoist vẫn nằm trong biên dọn dẹp của Plugin đó.

Các gói Plugin npm đã publish có thể ship `npm-shrinkwrap.json`. npm dùng
lockfile có thể publish đó trong quá trình cài đặt, và gốc dự án npm được quản lý của OpenClaw
hỗ trợ nó thông qua đường dẫn cài đặt npm bình thường. Các gói Plugin có thể publish
do OpenClaw sở hữu phải bao gồm shrinkwrap cục bộ của gói được tạo từ
biểu đồ phụ thuộc đã publish của gói Plugin đó:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator loại bỏ `devDependencies` của Plugin, áp dụng chính sách override workspace,
và ghi `extensions/<id>/npm-shrinkwrap.json` cho mỗi Plugin
`publishToNpm`. Các gói Plugin bên thứ ba cũng có thể ship shrinkwrap;
OpenClaw không yêu cầu điều đó cho các gói cộng đồng, nhưng npm sẽ tôn trọng nó
khi có mặt.

Trước khi xem một gói cục bộ là proof release-candidate, hãy kiểm tra tarball
sẽ được cài đặt:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Với thay đổi phụ thuộc, cũng xác minh rằng một cài đặt production có thể resolve
các gói runtime mà không có phụ thuộc dev:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Các gói Plugin npm do OpenClaw sở hữu cũng có thể publish với
`bundledDependencies` rõ ràng. Đường dẫn publish npm phủ danh sách tên phụ thuộc runtime,
xóa metadata workspace chỉ dành cho dev khỏi package manifest đã publish,
chạy cài đặt npm không script cho các phụ thuộc runtime cục bộ của gói,
rồi pack hoặc publish tarball Plugin với các tệp phụ thuộc đó được bao gồm.
Các gói nặng về native, bao gồm runtime Codex và ACP, opt out
bằng `openclaw.release.bundleRuntimeDependencies: false`; các gói đó vẫn
ship shrinkwrap của chúng, nhưng npm resolve phụ thuộc runtime trong quá trình cài đặt
thay vì nhúng mọi binary theo nền tảng vào tarball Plugin. Gói gốc
`openclaw` không bundle toàn bộ cây phụ thuộc của nó.

Plugin import `openclaw/plugin-sdk/*` khai báo `openclaw` là peer
dependency. OpenClaw không để npm cài một bản sao registry riêng của
gói host vào dự án được quản lý, vì các gói host cũ có thể ảnh hưởng tới
việc resolve peer npm bên trong Plugin đó. Cài đặt npm được quản lý bỏ qua việc
resolve/materialization peer của npm và OpenClaw tái xác nhận các liên kết
`node_modules/openclaw` cục bộ theo Plugin cho các gói đã cài có khai báo host peer
sau khi cài đặt hoặc cập nhật.

Cài đặt git clone hoặc refresh repository, rồi chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin đã cài sau đó tải từ thư mục gói đó, nên việc resolve `node_modules`
cục bộ của gói và thư mục cha hoạt động giống như với một gói Node bình thường.

## Plugin cục bộ

Plugin cục bộ được xem là các thư mục do nhà phát triển kiểm soát. OpenClaw không
chạy `npm install`, `pnpm install`, hoặc sửa phụ thuộc cho chúng. Nếu một
Plugin cục bộ có phụ thuộc, hãy cài chúng trong Plugin đó trước khi tải nó.

Plugin cục bộ TypeScript bên thứ ba có thể dùng đường dẫn Jiti khẩn cấp. Plugin
JavaScript đóng gói và Plugin nội bộ đi kèm tải thông qua
import/require native thay vì Jiti.

## Khởi động và tải lại

Khởi động Gateway và tải lại config không bao giờ cài phụ thuộc Plugin. Chúng đọc
các bản ghi cài đặt Plugin, tính entrypoint, và tải nó.

Nếu thiếu phụ thuộc ở runtime, Plugin không tải được và lỗi
nên chỉ cho operator một cách sửa rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` có thể dọn dẹp trạng thái phụ thuộc cũ do OpenClaw tạo và khôi phục
các Plugin có thể tải xuống bị thiếu khỏi bản ghi cài đặt cục bộ khi config
tham chiếu đến chúng. Doctor không sửa phụ thuộc cho một Plugin cục bộ đã cài.

## Plugin đi kèm

Các Plugin nhẹ và trọng yếu cho core được ship như một phần của OpenClaw.
Chúng nên không có cây phụ thuộc runtime nặng hoặc được chuyển ra thành
gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách hiện tại được tạo của các Plugin ship trong gói core, cài
bên ngoài, hoặc chỉ ở dạng source, xem [Kiểm kê Plugin](/vi/plugins/plugin-inventory).

Manifest của Plugin đi kèm không được yêu cầu staging phụ thuộc. Chức năng
Plugin lớn hoặc tùy chọn nên được đóng gói như một Plugin bình thường và cài thông qua
cùng đường dẫn npm/git/ClawHub như Plugin bên thứ ba.

Trong source checkout, OpenClaw xem repository là một pnpm monorepo. Sau
`pnpm install`, Plugin đi kèm tải từ `extensions/<id>` nên các phụ thuộc
workspace cục bộ của gói có sẵn và các chỉnh sửa được nhận trực tiếp. Phát triển
source checkout chỉ hỗ trợ pnpm; `npm install` thuần ở gốc repository
không phải là cách được hỗ trợ để chuẩn bị phụ thuộc Plugin đi kèm.

| Hình dạng cài đặt                | Vị trí Plugin đi kèm                  | Chủ sở hữu phụ thuộc                                                  |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây runtime đã build bên trong gói    | Gói OpenClaw và các luồng cài đặt/cập nhật/doctor Plugin rõ ràng     |
| Git checkout cộng `pnpm install` | Gói workspace `extensions/<id>`       | pnpm workspace, bao gồm phụ thuộc riêng của từng gói Plugin          |
| `openclaw plugins install ...`   | Gốc npm project/git/ClawHub được quản lý | Luồng cài đặt/cập nhật Plugin                                     |

## Dọn dẹp legacy

Các phiên bản OpenClaw cũ tạo các gốc phụ thuộc Plugin đi kèm khi khởi động hoặc
trong quá trình sửa doctor. Dọn dẹp doctor hiện tại xóa các thư mục và
symlink cũ đó khi dùng `--fix`, bao gồm các gốc `plugin-runtime-deps` cũ, symlink
gói global Node-prefix trỏ tới các target `plugin-runtime-deps` đã prune,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin đã tạo, thư mục
install stage, và store pnpm cục bộ của gói. Postinstall đóng gói cũng
xóa các symlink global đó trước khi prune các gốc target legacy để các bản nâng cấp
không để lại import gói ESM bị treo.

Các cài đặt npm cũ hơn cũng dùng một gốc `~/.openclaw/npm/node_modules` dùng chung.
Các luồng cài đặt, cập nhật, gỡ cài đặt, và doctor hiện tại vẫn nhận diện gốc phẳng legacy đó
chỉ để khôi phục và dọn dẹp. Các cài đặt npm mới nên tạo
gốc dự án theo từng Plugin thay vào đó.
