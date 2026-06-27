---
read_when:
    - Bạn đang gỡ lỗi các lượt cài đặt gói Plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt bằng trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw đóng gói hoặc các manifest Plugin đi kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phụ thuộc của Plugin
title: Phân giải phụ thuộc Plugin
x-i18n:
    generated_at: "2026-06-27T17:46:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw giữ công việc phụ thuộc của Plugin ở thời điểm cài đặt/cập nhật. Việc tải ở runtime
không chạy trình quản lý gói, sửa cây phụ thuộc, hoặc thay đổi thư mục gói
OpenClaw.

## Phân chia trách nhiệm

Các gói Plugin tự sở hữu đồ thị phụ thuộc của chúng:

- phụ thuộc runtime nằm trong `dependencies` hoặc `optionalDependencies` của
  gói Plugin
- import SDK/core là peer hoặc import do OpenClaw cung cấp
- Plugin phát triển cục bộ tự mang theo các phụ thuộc đã được cài đặt sẵn
- Plugin npm và git được cài vào các gốc gói do OpenClaw sở hữu

OpenClaw chỉ sở hữu vòng đời Plugin:

- phát hiện nguồn Plugin
- cài đặt hoặc cập nhật gói khi được yêu cầu rõ ràng
- ghi lại siêu dữ liệu cài đặt
- tải entrypoint của Plugin
- thất bại với lỗi có thể hành động khi thiếu phụ thuộc

## Gốc cài đặt

OpenClaw dùng các gốc ổn định theo từng nguồn:

- các gói npm cài vào những dự án theo từng Plugin dưới
  `~/.openclaw/npm/projects/<encoded-package>`
- các gói git clone dưới `~/.openclaw/git`
- cài đặt local/path/archive được sao chép hoặc tham chiếu mà không sửa phụ thuộc

Các lượt cài npm chạy trong gốc dự án theo từng Plugin đó với:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` dùng cùng gốc dự án npm theo từng Plugin
đó cho một tarball npm-pack cục bộ. OpenClaw đọc siêu dữ liệu npm của tarball,
thêm nó vào dự án được quản lý như một phụ thuộc `file:` đã sao chép, chạy
lượt cài npm bình thường, rồi xác minh siêu dữ liệu lockfile đã cài trước khi
tin cậy Plugin.
Điều này dành cho bằng chứng chấp nhận gói và ứng viên phát hành, nơi một
artifact pack cục bộ nên hoạt động giống artifact registry mà nó mô phỏng.

npm có thể hoist các phụ thuộc bắc cầu lên `node_modules` của dự án theo từng Plugin
bên cạnh gói Plugin. OpenClaw quét gốc dự án được quản lý trước khi tin cậy lượt
cài và xóa dự án đó trong quá trình gỡ cài đặt, nên các phụ thuộc runtime đã hoist
vẫn nằm trong ranh giới dọn dẹp của Plugin đó.

Các gói Plugin npm đã xuất bản có thể ship `npm-shrinkwrap.json`. npm dùng
lockfile có thể xuất bản đó trong quá trình cài đặt, và gốc dự án npm được
OpenClaw quản lý hỗ trợ nó qua đường dẫn cài npm bình thường. Các gói Plugin
có thể xuất bản do OpenClaw sở hữu phải bao gồm một shrinkwrap cục bộ theo gói,
được tạo từ đồ thị phụ thuộc đã xuất bản của gói Plugin đó:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Trình tạo loại bỏ `devDependencies` của Plugin, áp dụng chính sách override
workspace, và ghi `extensions/<id>/npm-shrinkwrap.json` cho từng Plugin
`publishToNpm`. Các gói Plugin bên thứ ba cũng có thể ship shrinkwrap; OpenClaw
không yêu cầu điều đó cho các gói cộng đồng, nhưng npm sẽ tôn trọng nó khi có.

Các gói Plugin npm do OpenClaw sở hữu cũng có thể xuất bản với
`bundledDependencies` rõ ràng. Đường dẫn xuất bản npm phủ danh sách tên phụ thuộc
runtime, xóa siêu dữ liệu workspace chỉ dành cho dev khỏi manifest gói đã xuất bản,
chạy một lượt cài npm không script cho các phụ thuộc runtime cục bộ theo gói,
sau đó pack hoặc xuất bản tarball Plugin cùng với các tệp phụ thuộc đó. Các gói
nặng về native, bao gồm runtime Codex và ACP, chọn không dùng bằng
`openclaw.release.bundleRuntimeDependencies: false`; các gói đó vẫn ship shrinkwrap,
nhưng npm phân giải phụ thuộc runtime trong quá trình cài đặt thay vì nhúng mọi
binary nền tảng vào tarball Plugin. Gói gốc `openclaw` không bundle toàn bộ cây
phụ thuộc của nó.

Các Plugin import `openclaw/plugin-sdk/*` khai báo `openclaw` là peer
dependency. OpenClaw không để npm cài một bản sao registry riêng của gói host
vào dự án được quản lý, vì các gói host cũ có thể ảnh hưởng đến phân giải peer
của npm bên trong Plugin đó. Các lượt cài npm được quản lý bỏ qua việc phân
giải/materialization peer của npm và OpenClaw tái xác lập các liên kết
`node_modules/openclaw` cục bộ theo Plugin cho các gói đã cài khai báo host peer
sau khi cài đặt hoặc cập nhật.

Cài đặt git clone hoặc làm mới repository, rồi chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin đã cài sau đó tải từ thư mục gói đó, nên việc phân giải `node_modules`
cục bộ theo gói và ở thư mục cha hoạt động giống như với một gói Node bình thường.

## Plugin cục bộ

Plugin cục bộ được xem là các thư mục do nhà phát triển kiểm soát. OpenClaw không
chạy `npm install`, `pnpm install`, hoặc sửa phụ thuộc cho chúng. Nếu một Plugin
cục bộ có phụ thuộc, hãy cài chúng trong Plugin đó trước khi tải nó.

Plugin cục bộ TypeScript của bên thứ ba có thể dùng đường dẫn Jiti khẩn cấp.
Plugin JavaScript đã đóng gói và Plugin nội bộ được bundle tải qua
import/require native thay vì Jiti.

## Khởi động và tải lại

Khởi động Gateway và tải lại cấu hình không bao giờ cài phụ thuộc Plugin. Chúng đọc
các bản ghi cài đặt Plugin, tính entrypoint, và tải nó.

Nếu thiếu một phụ thuộc tại runtime, Plugin sẽ không tải được và lỗi nên chỉ cho
operator một cách sửa rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` có thể dọn trạng thái phụ thuộc cũ do OpenClaw tạo và khôi phục
các Plugin có thể tải xuống bị thiếu khỏi bản ghi cài đặt cục bộ khi cấu hình
tham chiếu đến chúng. Doctor không sửa phụ thuộc cho một Plugin cục bộ đã cài.

## Plugin được bundle

Các Plugin nhẹ và thiết yếu với core được ship như một phần của OpenClaw.
Chúng nên hoặc không có cây phụ thuộc runtime nặng, hoặc được chuyển ra thành
một gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách được tạo hiện tại của các Plugin được ship trong gói core, cài
bên ngoài, hoặc chỉ nằm trong mã nguồn, xem [Kho Plugin](/vi/plugins/plugin-inventory).

Manifest của Plugin được bundle không được yêu cầu staging phụ thuộc. Chức năng
Plugin lớn hoặc tùy chọn nên được đóng gói như một Plugin bình thường và cài qua
cùng đường dẫn npm/git/ClawHub như các Plugin bên thứ ba.

Trong checkout mã nguồn, OpenClaw xem repository là một monorepo pnpm. Sau
`pnpm install`, các Plugin được bundle tải từ `extensions/<id>` để các phụ thuộc
workspace cục bộ theo gói có sẵn và các chỉnh sửa được nhận trực tiếp. Phát triển
trên checkout mã nguồn chỉ hỗ trợ pnpm; `npm install` thuần ở gốc repository
không phải là cách được hỗ trợ để chuẩn bị phụ thuộc cho Plugin được bundle.

| Hình dạng cài đặt                | Vị trí Plugin được bundle             | Chủ sở hữu phụ thuộc                                                 |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây runtime đã build bên trong gói    | Gói OpenClaw và các flow cài đặt/cập nhật/doctor Plugin rõ ràng      |
| Git checkout cộng `pnpm install` | Các gói workspace `extensions/<id>`   | Workspace pnpm, bao gồm phụ thuộc riêng của từng gói Plugin          |
| `openclaw plugins install ...`   | Gốc dự án npm/git/ClawHub được quản lý | Flow cài đặt/cập nhật Plugin                                         |

## Dọn dẹp legacy

Các phiên bản OpenClaw cũ tạo gốc phụ thuộc của Plugin được bundle lúc khởi động hoặc
trong quá trình sửa bằng doctor. Dọn dẹp doctor hiện tại xóa các thư mục và
symlink cũ đó khi dùng `--fix`, bao gồm các gốc `plugin-runtime-deps` cũ, symlink
gói tiền tố Node toàn cục trỏ đến các đích `plugin-runtime-deps` đã bị prune,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin được tạo, thư mục
giai đoạn cài đặt, và store pnpm cục bộ theo gói. Postinstall của gói cũng xóa
các symlink toàn cục đó trước khi prune các gốc đích legacy để quá trình nâng cấp
không để lại import gói ESM bị dangling.

Các lượt cài npm cũ hơn cũng từng dùng một gốc `~/.openclaw/npm/node_modules`
chung. Các flow cài đặt, cập nhật, gỡ cài đặt, và doctor hiện tại vẫn nhận biết
gốc phẳng legacy đó chỉ để khôi phục và dọn dẹp. Các lượt cài npm mới nên tạo
gốc dự án theo từng Plugin thay vào đó.
