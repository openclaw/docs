---
read_when:
    - Bạn đang gỡ lỗi quá trình cài đặt gói Plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt của trình quản lý gói
    - Bạn đang duy trì các bản cài đặt OpenClaw được đóng gói hoặc các tệp kê khai Plugin được đóng gói kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phụ thuộc của Plugin
title: Phân giải phụ thuộc Plugin
x-i18n:
    generated_at: "2026-05-10T19:42:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw giữ công việc phụ thuộc của Plugin ở thời điểm cài đặt/cập nhật. Việc tải lúc chạy
không chạy trình quản lý gói, sửa cây phụ thuộc, hoặc thay đổi thư mục gói
OpenClaw.

## Phân chia trách nhiệm

Các gói Plugin sở hữu đồ thị phụ thuộc của chúng:

- các phụ thuộc lúc chạy nằm trong `dependencies` hoặc
  `optionalDependencies` của gói Plugin
- các import SDK/core là peer hoặc import do OpenClaw cung cấp
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

- gói npm cài dưới `~/.openclaw/npm`
- gói git clone dưới `~/.openclaw/git`
- cài đặt local/path/archive được sao chép hoặc tham chiếu mà không sửa phụ thuộc

Cài đặt npm chạy trong gốc npm với:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` dùng cùng gốc npm được quản lý đó
cho tarball npm-pack cục bộ. OpenClaw đọc siêu dữ liệu npm của tarball, thêm nó
vào gốc được quản lý dưới dạng phụ thuộc `file:` đã sao chép, chạy cài đặt npm bình thường,
rồi xác minh siêu dữ liệu lockfile đã cài đặt trước khi tin cậy Plugin.
Điều này dành cho bằng chứng chấp nhận gói và ứng viên phát hành, nơi một
hiện vật pack cục bộ nên hoạt động như hiện vật registry mà nó mô phỏng.

npm có thể hoist các phụ thuộc bắc cầu lên `~/.openclaw/npm/node_modules` cạnh
gói Plugin. OpenClaw quét gốc npm được quản lý trước khi tin cậy việc
cài đặt và dùng npm để gỡ các gói do npm quản lý trong quá trình gỡ cài đặt, để các
phụ thuộc lúc chạy đã hoist vẫn nằm trong ranh giới dọn dẹp được quản lý.

Các Plugin import `openclaw/plugin-sdk/*` khai báo `openclaw` là phụ thuộc peer.
OpenClaw không cho npm cài một bản sao registry riêng của gói máy chủ
vào gốc được quản lý, vì các gói máy chủ cũ có thể ảnh hưởng đến việc phân giải peer
của npm trong các lần cài Plugin sau này. Các cài đặt npm được quản lý bỏ qua việc phân giải/vật chất hóa
peer của npm cho gốc dùng chung và OpenClaw tái khẳng định các liên kết
`node_modules/openclaw` cục bộ theo Plugin cho các gói đã cài đặt khai báo
peer máy chủ sau khi cài đặt, cập nhật, hoặc gỡ cài đặt.

Cài đặt git clone hoặc làm mới kho lưu trữ, rồi chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin đã cài đặt sau đó tải từ thư mục gói đó, nên việc phân giải
`node_modules` cục bộ theo gói và thư mục cha hoạt động giống như với một gói
Node bình thường.

## Plugin cục bộ

Plugin cục bộ được xem là các thư mục do nhà phát triển kiểm soát. OpenClaw không
chạy `npm install`, `pnpm install`, hoặc sửa phụ thuộc cho chúng. Nếu một
Plugin cục bộ có phụ thuộc, hãy cài chúng trong Plugin đó trước khi tải.

Plugin cục bộ TypeScript của bên thứ ba có thể dùng đường dẫn Jiti khẩn cấp. Plugin
JavaScript đóng gói và Plugin nội bộ đi kèm tải qua
import/require gốc thay vì Jiti.

## Khởi động và tải lại

Khởi động Gateway và tải lại cấu hình không bao giờ cài đặt phụ thuộc Plugin. Chúng đọc
các bản ghi cài đặt Plugin, tính entrypoint, và tải nó.

Nếu thiếu một phụ thuộc lúc chạy, Plugin không tải được và lỗi
nên hướng người vận hành đến một cách sửa rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` có thể dọn trạng thái phụ thuộc cũ do OpenClaw tạo và khôi phục
các Plugin có thể tải xuống bị thiếu khỏi bản ghi cài đặt cục bộ khi cấu hình
tham chiếu đến chúng. Doctor không sửa phụ thuộc cho một Plugin cục bộ đã được cài đặt.

## Plugin đi kèm

Các Plugin đi kèm nhẹ và trọng yếu cho core được phân phối như một phần của OpenClaw.
Chúng nên hoặc không có cây phụ thuộc lúc chạy nặng, hoặc được chuyển ra thành
gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách được tạo hiện tại về các Plugin được phân phối trong gói core,
cài đặt bên ngoài, hoặc chỉ nằm ở dạng nguồn, hãy xem [Kiểm kê Plugin](/vi/plugins/plugin-inventory).

Manifest của Plugin đi kèm không được yêu cầu staging phụ thuộc. Chức năng
Plugin lớn hoặc tùy chọn nên được đóng gói như một Plugin bình thường và cài đặt qua
cùng đường dẫn npm/git/ClawHub như Plugin bên thứ ba.

Trong source checkout, OpenClaw xem kho lưu trữ là một pnpm monorepo. Sau
`pnpm install`, các Plugin đi kèm tải từ `extensions/<id>` để các phụ thuộc
workspace cục bộ theo gói có sẵn và các chỉnh sửa được nhận trực tiếp. Phát triển
source checkout chỉ dùng pnpm; `npm install` thuần ở gốc kho lưu trữ không phải là
cách được hỗ trợ để chuẩn bị phụ thuộc Plugin đi kèm.

| Dạng cài đặt                    | Vị trí Plugin đi kèm               | Chủ sở hữu phụ thuộc                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây runtime đã build bên trong gói | Gói OpenClaw và các luồng cài đặt/cập nhật/doctor Plugin rõ ràng     |
| Git checkout cộng `pnpm install` | Các gói workspace `extensions/<id>`  | pnpm workspace, bao gồm phụ thuộc riêng của từng gói Plugin |
| `openclaw plugins install ...`   | Gốc Plugin npm/git/ClawHub được quản lý   | Luồng cài đặt/cập nhật Plugin                                       |

## Dọn dẹp cũ

Các phiên bản OpenClaw cũ tạo các gốc phụ thuộc Plugin đi kèm lúc khởi động hoặc
trong quá trình sửa bằng doctor. Dọn dẹp doctor hiện tại xóa các thư mục và
symlink cũ đó khi dùng `--fix`, bao gồm các gốc `plugin-runtime-deps` cũ, symlink
gói Node-prefix toàn cục trỏ tới các đích `plugin-runtime-deps` đã bị cắt tỉa,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin được tạo, thư mục
giai đoạn cài đặt, và store pnpm cục bộ theo gói. Postinstall đóng gói cũng
xóa các symlink toàn cục đó trước khi cắt tỉa các gốc đích cũ để quá trình nâng cấp
không để lại các import gói ESM bị treo.

Các đường dẫn này chỉ là phần sót lại cũ. Các cài đặt mới không nên tạo chúng.
