---
read_when:
    - Bạn đang gỡ lỗi quá trình cài đặt gói Plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt bằng trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw đóng gói hoặc các manifest Plugin đi kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phần phụ thuộc Plugin
title: Phân giải phụ thuộc Plugin
x-i18n:
    generated_at: "2026-05-02T10:48:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Phân giải phụ thuộc của Plugin

OpenClaw giữ công việc xử lý phụ thuộc của Plugin ở thời điểm cài đặt/cập nhật. Việc tải runtime
không chạy trình quản lý gói, sửa cây phụ thuộc, hoặc thay đổi thư mục gói
OpenClaw.

## Phân chia trách nhiệm

Các gói Plugin sở hữu đồ thị phụ thuộc của chúng:

- các phụ thuộc runtime nằm trong `dependencies` hoặc
  `optionalDependencies` của gói Plugin
- các import SDK/core là peer hoặc các import do OpenClaw cung cấp
- các Plugin phát triển cục bộ tự mang theo các phụ thuộc đã được cài đặt sẵn
- các Plugin npm và git được cài đặt vào các gốc gói do OpenClaw sở hữu

OpenClaw chỉ sở hữu vòng đời Plugin:

- phát hiện nguồn Plugin
- cài đặt hoặc cập nhật gói khi được yêu cầu rõ ràng
- ghi lại siêu dữ liệu cài đặt
- tải entrypoint của Plugin
- thất bại với lỗi có thể hành động khi thiếu phụ thuộc

## Gốc cài đặt

OpenClaw sử dụng các gốc ổn định theo từng nguồn:

- các gói npm cài đặt dưới `~/.openclaw/npm`
- các gói git clone dưới `~/.openclaw/git`
- các cài đặt cục bộ/đường dẫn/kho lưu trữ được sao chép hoặc tham chiếu mà không sửa phụ thuộc

Các cài đặt npm chạy trong gốc npm với:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm có thể hoist các phụ thuộc bắc cầu vào `~/.openclaw/npm/node_modules` bên cạnh
gói Plugin. OpenClaw quét gốc npm được quản lý trước khi tin cậy bản
cài đặt và dùng npm để xóa các gói do npm quản lý trong quá trình gỡ cài đặt, nên các phụ thuộc
runtime đã hoist vẫn nằm trong ranh giới dọn dẹp được quản lý.

Các cài đặt git clone hoặc làm mới repository, rồi chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin đã cài đặt sau đó tải từ thư mục gói đó, nên quá trình phân giải `node_modules`
cục bộ trong gói và cha hoạt động giống như với một gói
Node thông thường.

## Plugin cục bộ

Plugin cục bộ được xem là các thư mục do nhà phát triển kiểm soát. OpenClaw không
chạy `npm install`, `pnpm install`, hoặc sửa chữa dependency cho chúng. Nếu một
Plugin cục bộ có dependency, hãy cài đặt chúng trong Plugin đó trước khi tải Plugin.

Plugin cục bộ TypeScript của bên thứ ba có thể dùng đường dẫn Jiti khẩn cấp. Plugin
JavaScript đã đóng gói và Plugin nội bộ đi kèm được tải qua
import/require gốc thay vì Jiti.

## Khởi động và tải lại

Quá trình khởi động Gateway và tải lại cấu hình không bao giờ cài đặt dependency của Plugin. Chúng đọc
các bản ghi cài đặt Plugin, tính toán entrypoint, rồi tải Plugin.

Nếu thiếu dependency khi chạy, Plugin sẽ không tải được và lỗi
nên chỉ người vận hành đến một cách sửa rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` có thể dọn dẹp trạng thái dependency cũ do OpenClaw tạo và cài đặt
các Plugin có thể tải xuống đã được cấu hình nhưng còn thiếu trong bản ghi cài đặt cục bộ.
Lệnh này không sửa chữa dependency cho một Plugin cục bộ đã được cài đặt.

## Plugin đi kèm

Các Plugin đi kèm nhẹ và quan trọng với lõi được phát hành như một phần của OpenClaw.
Chúng nên không có cây dependency runtime nặng, hoặc nên được chuyển ra thành một
gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách được tạo hiện tại về các Plugin được phát hành trong gói lõi, cài đặt
bên ngoài, hoặc chỉ ở dạng mã nguồn, hãy xem [Danh mục Plugin](/vi/plugins/plugin-inventory).

Manifest của Plugin đi kèm không được yêu cầu staging dependency. Chức năng Plugin lớn hoặc tùy chọn
nên được đóng gói như một Plugin thông thường và cài đặt qua
cùng đường dẫn npm/git/ClawHub như Plugin của bên thứ ba.

Trong source checkout, OpenClaw xem repository là một pnpm monorepo. Sau
`pnpm install`, Plugin đi kèm tải từ `extensions/<id>` để dependency workspace
cục bộ theo gói có sẵn và các chỉnh sửa được nhận trực tiếp. Phát triển bằng source
checkout chỉ hỗ trợ pnpm; `npm install` thuần ở thư mục gốc repository
không phải là cách được hỗ trợ để chuẩn bị dependency cho Plugin đi kèm.

| Hình thức cài đặt                | Vị trí Plugin đi kèm                 | Chủ sở hữu dependency                                                |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây runtime đã build bên trong gói   | Gói OpenClaw và các luồng cài đặt/cập nhật/doctor Plugin rõ ràng     |
| Git checkout cộng `pnpm install` | Các gói workspace `extensions/<id>`  | pnpm workspace, bao gồm dependency riêng của từng gói Plugin         |
| `openclaw plugins install ...`   | Gốc Plugin npm/git/ClawHub được quản lý | Luồng cài đặt/cập nhật Plugin                                     |

## Dọn dẹp legacy

Các phiên bản OpenClaw cũ hơn đã tạo gốc dependency cho Plugin đi kèm khi khởi động hoặc
trong quá trình sửa chữa bằng doctor. Tác vụ dọn dẹp doctor hiện tại xóa các thư mục và
symlink cũ đó khi dùng `--fix`, bao gồm các gốc `plugin-runtime-deps` cũ,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin đã tạo, thư mục
install stage, và các pnpm store cục bộ theo gói.

Các đường dẫn này chỉ là phần sót lại legacy. Cài đặt mới không nên tạo chúng.
