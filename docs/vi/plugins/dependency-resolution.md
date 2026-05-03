---
read_when:
    - Bạn đang gỡ lỗi quá trình cài đặt gói Plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt qua trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw dạng gói hoặc các tệp kê khai Plugin đi kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phần phụ thuộc của Plugin
title: Phân giải phụ thuộc của Plugin
x-i18n:
    generated_at: "2026-05-03T21:34:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Giải quyết phụ thuộc của Plugin

OpenClaw giữ việc xử lý phụ thuộc của Plugin ở thời điểm cài đặt/cập nhật. Quá trình tải lúc chạy
không chạy trình quản lý gói, sửa cây phụ thuộc, hoặc thay đổi thư mục gói
OpenClaw.

## Phân chia trách nhiệm

Các gói Plugin sở hữu đồ thị phụ thuộc của chúng:

- phụ thuộc lúc chạy nằm trong `dependencies` hoặc `optionalDependencies` của gói Plugin
- các import SDK/lõi là peer hoặc các import do OpenClaw cung cấp
- Plugin phát triển cục bộ tự mang theo các phụ thuộc đã được cài đặt sẵn
- Plugin npm và git được cài đặt vào các gốc gói do OpenClaw sở hữu

OpenClaw chỉ sở hữu vòng đời Plugin:

- phát hiện nguồn Plugin
- cài đặt hoặc cập nhật gói khi được yêu cầu rõ ràng
- ghi lại siêu dữ liệu cài đặt
- tải điểm vào của Plugin
- thất bại với lỗi có thể hành động khi thiếu phụ thuộc

## Gốc cài đặt

OpenClaw dùng các gốc ổn định theo từng nguồn:

- gói npm cài dưới `~/.openclaw/npm`
- gói git clone dưới `~/.openclaw/git`
- cài đặt cục bộ/đường dẫn/kho lưu trữ được sao chép hoặc tham chiếu mà không sửa phụ thuộc

Cài đặt npm chạy trong gốc npm với:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm có thể hoist các phụ thuộc bắc cầu lên `~/.openclaw/npm/node_modules` bên cạnh
gói Plugin. OpenClaw quét gốc npm được quản lý trước khi tin cậy bản
cài đặt và dùng npm để gỡ các gói do npm quản lý trong lúc gỡ cài đặt, vì vậy các
phụ thuộc lúc chạy đã hoist vẫn nằm trong ranh giới dọn dẹp được quản lý.

Cài đặt git clone hoặc làm mới kho lưu trữ, rồi chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Plugin đã cài đặt sau đó tải từ thư mục gói đó, nên việc phân giải `node_modules`
cục bộ theo gói và từ cha hoạt động giống như với một gói Node bình thường.

## Plugin cục bộ

Plugin cục bộ được xem là các thư mục do nhà phát triển kiểm soát. OpenClaw không
chạy `npm install`, `pnpm install`, hoặc sửa phụ thuộc cho chúng. Nếu một Plugin
cục bộ có phụ thuộc, hãy cài đặt chúng trong Plugin đó trước khi tải.

Plugin TypeScript cục bộ của bên thứ ba có thể dùng đường dẫn Jiti khẩn cấp. Plugin
JavaScript đã đóng gói và Plugin nội bộ đi kèm tải qua import/require gốc thay vì Jiti.

## Khởi động và tải lại

Khởi động Gateway và tải lại cấu hình không bao giờ cài đặt phụ thuộc Plugin. Chúng đọc
các bản ghi cài đặt Plugin, tính toán điểm vào, và tải nó.

Nếu thiếu phụ thuộc ở thời gian chạy, Plugin sẽ không tải được và lỗi
nên chỉ cho người vận hành một cách sửa rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` có thể dọn dẹp trạng thái phụ thuộc cũ do OpenClaw tạo ra và cài đặt
các Plugin có thể tải xuống đã được cấu hình nhưng còn thiếu khỏi bản ghi cài đặt cục bộ.
Nó không sửa phụ thuộc cho một Plugin cục bộ đã được cài đặt.

## Plugin đi kèm

Plugin nhẹ và quan trọng với lõi được phát hành như một phần của OpenClaw.
Chúng nên hoặc không có cây phụ thuộc lúc chạy nặng, hoặc được chuyển ra thành
gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách hiện được tạo của các Plugin được phát hành trong gói lõi, được cài đặt
bên ngoài, hoặc chỉ tồn tại ở dạng nguồn, hãy xem [Kho Plugin](/vi/plugins/plugin-inventory).

Manifest của Plugin đi kèm không được yêu cầu staging phụ thuộc. Chức năng Plugin lớn hoặc tùy chọn
nên được đóng gói như một Plugin bình thường và được cài đặt qua cùng đường dẫn
npm/git/ClawHub như Plugin bên thứ ba.

Trong checkout nguồn, OpenClaw xem kho lưu trữ là một monorepo pnpm. Sau
`pnpm install`, Plugin đi kèm tải từ `extensions/<id>` để các phụ thuộc workspace
cục bộ theo gói sẵn dùng và các chỉnh sửa được nhận trực tiếp. Phát triển bằng
checkout nguồn chỉ hỗ trợ pnpm; `npm install` thuần ở gốc kho lưu trữ
không phải là cách được hỗ trợ để chuẩn bị phụ thuộc Plugin đi kèm.

| Hình thức cài đặt               | Vị trí Plugin đi kèm                  | Chủ sở hữu phụ thuộc                                                    |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây runtime đã build bên trong gói | Gói OpenClaw và các luồng cài đặt/cập nhật/doctor Plugin rõ ràng     |
| Checkout Git cùng `pnpm install` | Các gói workspace `extensions/<id>`  | Workspace pnpm, bao gồm phụ thuộc riêng của từng gói Plugin |
| `openclaw plugins install ...`   | Gốc Plugin npm/git/ClawHub được quản lý   | Luồng cài đặt/cập nhật Plugin                                       |

## Dọn dẹp cũ

Các phiên bản OpenClaw cũ hơn tạo gốc phụ thuộc Plugin đi kèm lúc khởi động hoặc
trong quá trình doctor repair. Dọn dẹp doctor hiện tại xóa các thư mục và
symlink cũ đó khi dùng `--fix`, bao gồm các gốc `plugin-runtime-deps` cũ, các
symlink gói tiền tố Node toàn cục trỏ tới mục tiêu `plugin-runtime-deps` đã bị lược bỏ,
manifest `.openclaw-runtime-deps*`, `node_modules` Plugin được tạo,
thư mục giai đoạn cài đặt, và store pnpm cục bộ theo gói. Postinstall đã đóng gói cũng
xóa các symlink toàn cục đó trước khi lược bỏ các gốc mục tiêu cũ để các bản nâng cấp
không để lại import gói ESM treo.

Những đường dẫn này chỉ là mảnh còn sót lại cũ. Các bản cài đặt mới không nên tạo chúng.
