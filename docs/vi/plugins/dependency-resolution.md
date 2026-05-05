---
read_when:
    - Bạn đang gỡ lỗi việc cài đặt gói Plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt bằng trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw đóng gói hoặc các tệp kê khai Plugin đi kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phần phụ thuộc của Plugin
title: Phân giải phụ thuộc Plugin
x-i18n:
    generated_at: "2026-05-05T01:49:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Phân giải phần phụ thuộc của Plugin

OpenClaw giữ công việc xử lý phần phụ thuộc của plugin ở thời điểm cài đặt/cập nhật. Việc tải lúc runtime
không chạy trình quản lý gói, sửa cây phần phụ thuộc, hoặc thay đổi thư mục gói
OpenClaw.

## Phân chia trách nhiệm

Các gói plugin sở hữu đồ thị phần phụ thuộc của chúng:

- phần phụ thuộc runtime nằm trong `dependencies` hoặc
  `optionalDependencies` của gói plugin
- các import SDK/core là peer hoặc import do OpenClaw cung cấp
- plugin phát triển cục bộ mang theo các phần phụ thuộc đã được cài đặt sẵn của riêng chúng
- plugin npm và git được cài đặt vào các gốc gói do OpenClaw sở hữu

OpenClaw chỉ sở hữu vòng đời plugin:

- phát hiện nguồn plugin
- cài đặt hoặc cập nhật gói khi được yêu cầu rõ ràng
- ghi lại siêu dữ liệu cài đặt
- tải entrypoint của plugin
- thất bại kèm lỗi có thể hành động khi thiếu phần phụ thuộc

## Gốc cài đặt

OpenClaw dùng các gốc ổn định theo từng nguồn:

- gói npm cài đặt dưới `~/.openclaw/npm`
- gói git clone dưới `~/.openclaw/git`
- cài đặt cục bộ/đường dẫn/kho lưu trữ được sao chép hoặc tham chiếu mà không sửa phần phụ thuộc

Cài đặt npm chạy trong gốc npm với:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm có thể hoist các phần phụ thuộc bắc cầu sang `~/.openclaw/npm/node_modules` bên cạnh
gói plugin. OpenClaw quét gốc npm được quản lý trước khi tin cậy bản
cài đặt và dùng npm để gỡ các gói do npm quản lý trong khi gỡ cài đặt, nên các
phần phụ thuộc runtime đã hoist vẫn nằm trong ranh giới dọn dẹp được quản lý.

Cài đặt git clone hoặc làm mới kho lưu trữ, rồi chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin đã cài đặt sau đó tải từ thư mục gói đó, nên việc phân giải `node_modules`
cục bộ theo gói và cấp cha hoạt động giống như với một gói
Node thông thường.

## Plugin cục bộ

Plugin cục bộ được xem là các thư mục do nhà phát triển kiểm soát. OpenClaw không
chạy `npm install`, `pnpm install`, hoặc sửa phần phụ thuộc cho chúng. Nếu một
plugin cục bộ có phần phụ thuộc, hãy cài đặt chúng trong plugin đó trước khi tải.

Plugin cục bộ TypeScript của bên thứ ba có thể dùng đường dẫn Jiti khẩn cấp. Plugin
JavaScript đã đóng gói và plugin nội bộ đi kèm tải qua
import/require native thay vì Jiti.

## Khởi động và tải lại

Khởi động Gateway và tải lại cấu hình không bao giờ cài đặt phần phụ thuộc của plugin. Chúng đọc
bản ghi cài đặt plugin, tính entrypoint, và tải plugin.

Nếu thiếu phần phụ thuộc ở runtime, plugin sẽ không tải được và lỗi
nên chỉ người vận hành đến một cách sửa rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` có thể dọn trạng thái phần phụ thuộc cũ do OpenClaw tạo và khôi phục
các plugin có thể tải xuống bị thiếu khỏi bản ghi cài đặt cục bộ khi cấu hình
tham chiếu đến chúng. Doctor không sửa phần phụ thuộc cho một plugin cục bộ
đã cài đặt.

## Plugin đi kèm

Plugin nhẹ và quan trọng với lõi được phát hành như một phần của OpenClaw.
Chúng nên không có cây phần phụ thuộc runtime nặng hoặc được chuyển ra thành một
gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách hiện được tạo của các plugin được phát hành trong gói lõi, cài đặt
bên ngoài, hoặc chỉ tồn tại dưới dạng nguồn, xem [Danh mục plugin](/vi/plugins/plugin-inventory).

Manifest của plugin đi kèm không được yêu cầu staging phần phụ thuộc. Chức năng plugin
lớn hoặc tùy chọn nên được đóng gói như một plugin thông thường và cài đặt qua
cùng đường dẫn npm/git/ClawHub như plugin của bên thứ ba.

Trong checkout nguồn, OpenClaw xem kho lưu trữ là một monorepo pnpm. Sau
`pnpm install`, plugin đi kèm tải từ `extensions/<id>` để các phần phụ thuộc
workspace cục bộ theo gói có sẵn và các chỉnh sửa được nhận trực tiếp. Phát triển trên
checkout nguồn chỉ hỗ trợ pnpm; `npm install` thuần ở gốc kho lưu trữ không phải
là cách được hỗ trợ để chuẩn bị phần phụ thuộc của plugin đi kèm.

| Hình dạng cài đặt                | Vị trí plugin đi kèm                  | Chủ sở hữu phần phụ thuộc                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây runtime đã build bên trong gói    | Gói OpenClaw và các luồng cài đặt/cập nhật/doctor plugin rõ ràng     |
| Git checkout cộng `pnpm install` | Các gói workspace `extensions/<id>`   | Workspace pnpm, bao gồm phần phụ thuộc riêng của từng gói plugin     |
| `openclaw plugins install ...`   | Gốc plugin npm/git/ClawHub được quản lý | Luồng cài đặt/cập nhật plugin                                      |

## Dọn dẹp di sản

Các phiên bản OpenClaw cũ hơn đã tạo các gốc phần phụ thuộc của plugin đi kèm khi khởi động hoặc
trong lúc doctor sửa chữa. Việc dọn dẹp doctor hiện tại xóa các thư mục và
symlink cũ đó khi dùng `--fix`, bao gồm các gốc `plugin-runtime-deps` cũ, symlink
gói tiền tố Node toàn cục trỏ đến các đích `plugin-runtime-deps` đã bị lược bỏ,
manifest `.openclaw-runtime-deps*`, `node_modules` plugin được tạo, thư mục
stage cài đặt, và store pnpm cục bộ theo gói. Postinstall của gói cũng
xóa các symlink toàn cục đó trước khi lược bỏ các gốc đích di sản để các bản nâng cấp
không để lại import gói ESM bị treo.

Các đường dẫn này chỉ là rác di sản. Cài đặt mới không nên tạo chúng.
