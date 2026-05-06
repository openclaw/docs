---
read_when:
    - Bạn đang gỡ lỗi quá trình cài đặt gói Plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt bằng trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw đóng gói hoặc các manifest Plugin đi kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phụ thuộc Plugin
title: Phân giải phụ thuộc Plugin
x-i18n:
    generated_at: "2026-05-06T09:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Phân giải phụ thuộc Plugin

OpenClaw xử lý phụ thuộc Plugin tại thời điểm cài đặt/cập nhật. Việc tải ở thời gian chạy
không chạy trình quản lý gói, sửa cây phụ thuộc, hay thay đổi thư mục gói
OpenClaw.

## Phân chia trách nhiệm

Các gói Plugin sở hữu đồ thị phụ thuộc của chúng:

- phụ thuộc thời gian chạy nằm trong `dependencies` hoặc
  `optionalDependencies` của gói Plugin
- các import SDK/core là peer hoặc các import do OpenClaw cung cấp
- Plugin phát triển cục bộ mang theo các phụ thuộc đã được cài đặt sẵn
- Plugin npm và git được cài đặt vào các gốc gói do OpenClaw sở hữu

OpenClaw chỉ sở hữu vòng đời Plugin:

- phát hiện nguồn Plugin
- cài đặt hoặc cập nhật gói khi được yêu cầu rõ ràng
- ghi lại siêu dữ liệu cài đặt
- tải entrypoint của Plugin
- thất bại với lỗi có thể hành động khi thiếu phụ thuộc

## Gốc cài đặt

OpenClaw sử dụng các gốc ổn định theo từng nguồn:

- gói npm cài đặt dưới `~/.openclaw/npm`
- gói git clone dưới `~/.openclaw/git`
- cài đặt cục bộ/đường dẫn/kho lưu trữ được sao chép hoặc tham chiếu mà không sửa phụ thuộc

Cài đặt npm chạy trong gốc npm với:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` sử dụng cùng gốc npm được quản lý đó
cho một tarball npm-pack cục bộ. OpenClaw đọc siêu dữ liệu npm của tarball, thêm nó
vào gốc được quản lý dưới dạng phụ thuộc `file:` đã sao chép, chạy cài đặt npm bình thường,
rồi xác minh siêu dữ liệu lockfile đã cài đặt trước khi tin cậy Plugin.
Mục đích là để chứng minh chấp nhận gói và release-candidate khi một artifact pack
cục bộ cần hoạt động như artifact registry mà nó mô phỏng.

npm có thể hoist các phụ thuộc bắc cầu lên `~/.openclaw/npm/node_modules` cạnh
gói Plugin. OpenClaw quét gốc npm được quản lý trước khi tin cậy bản cài đặt
và dùng npm để gỡ các gói do npm quản lý khi gỡ cài đặt, nên các phụ thuộc
thời gian chạy đã hoist vẫn nằm trong ranh giới dọn dẹp được quản lý.

Plugin import `openclaw/plugin-sdk/*` khai báo `openclaw` là peer
dependency. OpenClaw không để npm cài một bản sao registry riêng của gói host
vào gốc được quản lý, vì các gói host cũ có thể ảnh hưởng đến phân giải peer
của npm trong những lần cài Plugin sau. Thay vào đó, sau khi npm hoàn tất
thay đổi gốc dùng chung trong quá trình cài đặt, cập nhật, hoặc gỡ cài đặt, OpenClaw tái xác lập
các liên kết `node_modules/openclaw` cục bộ theo Plugin cho những gói đã cài đặt có khai báo
peer host.

Cài đặt git clone hoặc làm mới kho lưu trữ, rồi chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin đã cài đặt sau đó tải từ thư mục gói đó, nên phân giải `node_modules`
cục bộ theo gói và cha hoạt động giống như với một gói Node bình thường.

## Plugin cục bộ

Plugin cục bộ được xem là các thư mục do nhà phát triển kiểm soát. OpenClaw không
chạy `npm install`, `pnpm install`, hay sửa phụ thuộc cho chúng. Nếu một Plugin
cục bộ có phụ thuộc, hãy cài chúng trong Plugin đó trước khi tải.

Plugin cục bộ TypeScript của bên thứ ba có thể dùng đường dẫn Jiti khẩn cấp. Plugin
JavaScript đã đóng gói và Plugin nội bộ đi kèm tải qua
import/require gốc thay vì Jiti.

## Khởi động và tải lại

Khởi động Gateway và tải lại cấu hình không bao giờ cài đặt phụ thuộc Plugin. Chúng đọc
bản ghi cài đặt Plugin, tính entrypoint, và tải nó.

Nếu thiếu phụ thuộc ở thời gian chạy, Plugin không tải được và lỗi
nên hướng người vận hành đến một cách sửa rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` có thể dọn trạng thái phụ thuộc cũ do OpenClaw tạo và khôi phục
Plugin có thể tải xuống bị thiếu khỏi bản ghi cài đặt cục bộ khi cấu hình
tham chiếu đến chúng. Doctor không sửa phụ thuộc cho một Plugin cục bộ đã cài đặt.

## Plugin đi kèm

Plugin đi kèm nhẹ và trọng yếu với core được phát hành như một phần của OpenClaw.
Chúng nên không có cây phụ thuộc thời gian chạy nặng hoặc được chuyển ra thành
một gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách được tạo hiện tại của các Plugin được phát hành trong gói core, cài đặt
bên ngoài, hoặc chỉ ở dạng nguồn, xem [Kho Plugin](/vi/plugins/plugin-inventory).

Manifest Plugin đi kèm không được yêu cầu staging phụ thuộc. Chức năng Plugin lớn hoặc tùy chọn
nên được đóng gói như một Plugin bình thường và cài đặt qua cùng đường dẫn
npm/git/ClawHub như Plugin của bên thứ ba.

Trong checkout nguồn, OpenClaw xem kho lưu trữ là một monorepo pnpm. Sau
`pnpm install`, Plugin đi kèm tải từ `extensions/<id>` để các phụ thuộc workspace
cục bộ theo gói sẵn có và các chỉnh sửa được áp dụng trực tiếp. Phát triển từ
checkout nguồn chỉ hỗ trợ pnpm; `npm install` thuần tại gốc kho lưu trữ không phải là
cách được hỗ trợ để chuẩn bị phụ thuộc Plugin đi kèm.

| Hình dạng cài đặt               | Vị trí Plugin đi kèm                  | Chủ sở hữu phụ thuộc                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây runtime đã build bên trong gói    | Gói OpenClaw và các luồng cài đặt/cập nhật/doctor Plugin rõ ràng     |
| Git checkout plus `pnpm install` | Gói workspace `extensions/<id>`       | Workspace pnpm, bao gồm phụ thuộc riêng của từng gói Plugin          |
| `openclaw plugins install ...`   | Gốc Plugin npm/git/ClawHub được quản lý | Luồng cài đặt/cập nhật Plugin                                        |

## Dọn dẹp cũ

Các phiên bản OpenClaw cũ hơn tạo gốc phụ thuộc Plugin đi kèm khi khởi động hoặc
trong quá trình sửa doctor. Quá trình dọn dẹp doctor hiện tại xóa các thư mục và
symlink cũ đó khi dùng `--fix`, bao gồm các gốc `plugin-runtime-deps` cũ, symlink
gói global Node-prefix trỏ đến mục tiêu `plugin-runtime-deps` đã bị prune,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin đã tạo, thư mục
stage cài đặt, và store pnpm cục bộ theo gói. Postinstall đã đóng gói cũng
xóa các symlink global đó trước khi prune các gốc mục tiêu legacy để việc nâng cấp
không để lại import gói ESM bị treo.

Các đường dẫn này chỉ là tàn dư legacy. Các bản cài đặt mới không nên tạo chúng.
