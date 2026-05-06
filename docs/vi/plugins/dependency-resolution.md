---
read_when:
    - Bạn đang gỡ lỗi quá trình cài đặt gói Plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt qua trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw được đóng gói hoặc các tệp kê khai Plugin được gói kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phụ thuộc Plugin
title: Phân giải phụ thuộc Plugin
x-i18n:
    generated_at: "2026-05-06T17:58:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw giữ công việc về phụ thuộc của Plugin ở thời điểm cài đặt/cập nhật. Việc tải trong thời gian chạy
không chạy trình quản lý gói, sửa chữa cây phụ thuộc, hoặc thay đổi thư mục
gói OpenClaw.

## Phân chia trách nhiệm

Các gói Plugin sở hữu đồ thị phụ thuộc của chúng:

- các phụ thuộc thời gian chạy nằm trong `dependencies` hoặc
  `optionalDependencies` của gói Plugin
- các import SDK/core là peer hoặc import do OpenClaw cung cấp
- Plugin phát triển cục bộ mang theo các phụ thuộc đã được cài đặt sẵn của riêng chúng
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
- cài đặt local/path/archive được sao chép hoặc tham chiếu mà không sửa chữa phụ thuộc

Cài đặt npm chạy trong gốc npm với:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` sử dụng cùng gốc npm được quản lý đó
cho một tarball npm-pack cục bộ. OpenClaw đọc siêu dữ liệu npm của tarball, thêm nó
vào gốc được quản lý dưới dạng phụ thuộc `file:` đã sao chép, chạy cài đặt npm bình thường,
rồi xác minh siêu dữ liệu lockfile đã cài đặt trước khi tin cậy Plugin.
Điều này dành cho bằng chứng chấp nhận gói và ứng viên phát hành, khi một
artifact pack cục bộ cần hoạt động như artifact registry mà nó mô phỏng.

npm có thể hoist các phụ thuộc bắc cầu lên `~/.openclaw/npm/node_modules` bên cạnh
gói Plugin. OpenClaw quét gốc npm được quản lý trước khi tin cậy
cài đặt và dùng npm để gỡ các gói do npm quản lý trong quá trình gỡ cài đặt, vì vậy
các phụ thuộc thời gian chạy đã hoist vẫn nằm trong ranh giới dọn dẹp được quản lý.

Plugin import `openclaw/plugin-sdk/*` khai báo `openclaw` là một peer
dependency. OpenClaw không cho npm cài đặt một bản sao registry riêng của
gói host vào gốc được quản lý, vì các gói host cũ có thể ảnh hưởng tới việc
phân giải peer của npm trong các lần cài đặt Plugin sau. Thay vào đó, sau khi npm hoàn tất
việc thay đổi gốc dùng chung trong lúc cài đặt, cập nhật, hoặc gỡ cài đặt, OpenClaw tái khẳng định
các liên kết `node_modules/openclaw` cục bộ theo Plugin cho các gói đã cài đặt khai báo
host peer.

Cài đặt git clone hoặc làm mới repository, rồi chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin đã cài đặt sau đó tải từ thư mục gói đó, nên việc phân giải `node_modules`
cục bộ theo gói và của thư mục cha hoạt động giống như với một gói
Node bình thường.

## Plugin cục bộ

Plugin cục bộ được xem là các thư mục do nhà phát triển kiểm soát. OpenClaw không
chạy `npm install`, `pnpm install`, hoặc sửa chữa phụ thuộc cho chúng. Nếu một Plugin
cục bộ có phụ thuộc, hãy cài đặt chúng trong Plugin đó trước khi tải nó.

Plugin TypeScript cục bộ của bên thứ ba có thể dùng đường dẫn Jiti khẩn cấp. Plugin
JavaScript đã đóng gói và Plugin nội bộ đi kèm tải thông qua
import/require native thay vì Jiti.

## Khởi động và tải lại

Khởi động Gateway và tải lại cấu hình không bao giờ cài đặt phụ thuộc Plugin. Chúng đọc
các bản ghi cài đặt Plugin, tính entrypoint, và tải nó.

Nếu thiếu phụ thuộc ở thời gian chạy, Plugin sẽ không tải được và lỗi
nên chỉ cho người vận hành một cách sửa rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` có thể dọn dẹp trạng thái phụ thuộc cũ do OpenClaw tạo và khôi phục
các Plugin có thể tải xuống bị thiếu khỏi bản ghi cài đặt cục bộ khi cấu hình
tham chiếu đến chúng. Doctor không sửa chữa phụ thuộc cho một Plugin cục bộ đã được cài đặt.

## Plugin đi kèm

Các Plugin đi kèm nhẹ và cốt lõi được phân phối như một phần của OpenClaw.
Chúng nên hoặc không có cây phụ thuộc thời gian chạy nặng, hoặc được chuyển ra thành
một gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách hiện tại được tạo ra của các Plugin được phân phối trong gói lõi, cài đặt
bên ngoài, hoặc chỉ ở dạng nguồn, hãy xem [Kiểm kê Plugin](/vi/plugins/plugin-inventory).

Manifest Plugin đi kèm không được yêu cầu staging phụ thuộc. Chức năng Plugin lớn hoặc tùy chọn
nên được đóng gói như một Plugin bình thường và cài đặt qua
cùng đường dẫn npm/git/ClawHub như Plugin bên thứ ba.

Trong checkout nguồn, OpenClaw xem repository là một pnpm monorepo. Sau
`pnpm install`, Plugin đi kèm tải từ `extensions/<id>` để các phụ thuộc workspace
cục bộ theo gói có sẵn và các chỉnh sửa được nhận trực tiếp. Phát triển bằng
checkout nguồn chỉ hỗ trợ pnpm; `npm install` thuần ở gốc repository không phải là
cách được hỗ trợ để chuẩn bị phụ thuộc Plugin đi kèm.

| Hình dạng cài đặt                | Vị trí Plugin đi kèm                 | Chủ sở hữu phụ thuộc                                                  |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây thời gian chạy đã build bên trong gói | Gói OpenClaw và các luồng cài đặt/cập nhật/doctor Plugin rõ ràng |
| Git checkout cộng `pnpm install` | Gói workspace `extensions/<id>`      | Workspace pnpm, bao gồm phụ thuộc riêng của từng gói Plugin          |
| `openclaw plugins install ...`   | Gốc Plugin npm/git/ClawHub được quản lý | Luồng cài đặt/cập nhật Plugin                                      |

## Dọn dẹp cũ

Các phiên bản OpenClaw cũ hơn tạo gốc phụ thuộc Plugin đi kèm khi khởi động hoặc
trong quá trình sửa chữa bằng doctor. Dọn dẹp doctor hiện tại loại bỏ các thư mục cũ đó và
symlink khi dùng `--fix`, bao gồm các gốc `plugin-runtime-deps` cũ, symlink gói
Node-prefix toàn cục trỏ tới các đích `plugin-runtime-deps` đã bị prune,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin đã tạo, thư mục
stage cài đặt, và store pnpm cục bộ theo gói. Postinstall đã đóng gói cũng
loại bỏ các symlink toàn cục đó trước khi prune các gốc đích cũ để các bản nâng cấp
không để lại import gói ESM treo.

Các đường dẫn này chỉ là mảnh vụn cũ. Cài đặt mới không nên tạo chúng.
