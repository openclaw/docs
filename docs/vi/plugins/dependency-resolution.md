---
read_when:
    - Bạn đang gỡ lỗi quá trình cài đặt các gói plugin
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt bằng trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw được đóng gói hoặc các tệp kê khai Plugin đi kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw cài đặt các gói Plugin và phân giải các phần phụ thuộc của Plugin
title: Phân giải phần phụ thuộc của Plugin
x-i18n:
    generated_at: "2026-07-12T08:07:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw chỉ xử lý các phần phụ thuộc của Plugin tại thời điểm cài đặt/cập nhật. Quá trình tải khi chạy không bao giờ chạy trình quản lý gói, sửa chữa cây phần phụ thuộc hoặc thay đổi thư mục gói OpenClaw.

## Phân chia trách nhiệm

Các gói Plugin sở hữu biểu đồ phần phụ thuộc của chúng:

- Các phần phụ thuộc khi chạy nằm trong `dependencies` hoặc `optionalDependencies` của gói Plugin.
- Các lệnh nhập SDK/lõi là phần phụ thuộc đồng cấp hoặc lệnh nhập do OpenClaw cung cấp.
- Các Plugin phát triển cục bộ tự mang theo các phần phụ thuộc đã được cài đặt sẵn.
- Các Plugin npm và git được cài đặt vào các thư mục gốc gói do OpenClaw sở hữu.

OpenClaw chỉ sở hữu vòng đời Plugin:

- Khám phá nguồn Plugin.
- Cài đặt hoặc cập nhật gói khi được yêu cầu rõ ràng.
- Ghi lại siêu dữ liệu cài đặt.
- Tải điểm vào của Plugin.
- Báo lỗi có hướng xử lý khi thiếu phần phụ thuộc.

## Thư mục gốc cài đặt

OpenClaw sử dụng các thư mục gốc ổn định theo từng nguồn:

- Các gói npm được cài đặt vào dự án riêng cho từng Plugin tại
  `~/.openclaw/npm/projects/<encoded-package>`.
- Các gói git được sao chép vào `~/.openclaw/git`.
- Các bản cài đặt cục bộ/theo đường dẫn/từ kho lưu trữ được sao chép hoặc tham chiếu mà không sửa chữa phần phụ thuộc.

Việc cài đặt npm chạy trong thư mục gốc dự án riêng của Plugin đó bằng:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` sử dụng cùng thư mục gốc dự án npm riêng cho từng Plugin đối với tarball npm-pack cục bộ: OpenClaw đọc siêu dữ liệu npm của tarball, thêm tarball đó vào dự án được quản lý dưới dạng phần phụ thuộc `file:` đã sao chép, chạy lệnh cài đặt npm thông thường ở trên, sau đó xác minh siêu dữ liệu tệp khóa đã cài đặt trước khi tin cậy Plugin. Đường dẫn này tồn tại để chứng minh khả năng chấp nhận gói và ứng viên phát hành, trong đó một thành phần đóng gói cục bộ cần hoạt động giống thành phần trên kho đăng ký mà nó mô phỏng.

Sử dụng `npm-pack:` khi kiểm thử các gói Plugin chính thức hoặc bên ngoài trước khi phát hành. Bản cài đặt từ kho lưu trữ thô hoặc đường dẫn hữu ích cho việc gỡ lỗi cục bộ, nhưng không chứng minh cùng đường dẫn phần phụ thuộc như một gói npm hoặc ClawHub đã cài đặt. `npm-pack:` chứng minh cấu trúc cài đặt gói được quản lý; bản thân nó không chứng minh rằng Plugin là nội dung chính thức được liên kết với danh mục.

Khi hành vi phụ thuộc vào trạng thái Plugin đi kèm hoặc Plugin chính thức đáng tin cậy, hãy kết hợp bằng chứng gói cục bộ với bản cài đặt chính thức có danh mục hỗ trợ hoặc đường dẫn gói đã phát hành có ghi nhận độ tin cậy chính thức. Quyền truy cập trình trợ giúp đặc quyền và việc xử lý phạm vi chính thức đáng tin cậy phải được xác thực trên đường dẫn cài đặt đáng tin cậy đó, không được suy ra từ bản cài đặt tarball cục bộ.

Nếu một Plugin gặp lỗi thiếu lệnh nhập khi chạy, hãy sửa bản kê khai gói thay vì sửa thủ công dự án được quản lý. Các lệnh nhập khi chạy thuộc về `dependencies` hoặc `optionalDependencies` của gói Plugin; `devDependencies` không được cài đặt cho các dự án chạy được quản lý. Chạy `npm install` cục bộ bên trong `~/.openclaw/npm/projects/<encoded-package>` có thể tạm thời hỗ trợ chẩn đoán, nhưng không phải là bằng chứng chấp nhận gói vì lần cài đặt hoặc cập nhật tiếp theo sẽ tạo lại dự án từ siêu dữ liệu gói.

npm có thể nâng các phần phụ thuộc bắc cầu lên `node_modules` của dự án riêng cho Plugin, bên cạnh gói Plugin. OpenClaw quét thư mục gốc dự án được quản lý trước khi tin cậy bản cài đặt và xóa dự án đó khi gỡ cài đặt, vì vậy các phần phụ thuộc khi chạy được nâng lên vẫn nằm trong ranh giới dọn dẹp của Plugin đó.

Các gói Plugin npm đã phát hành có thể cung cấp `npm-shrinkwrap.json`; npm sử dụng tệp khóa có thể phát hành đó trong quá trình cài đặt và thư mục gốc dự án npm được OpenClaw quản lý hỗ trợ tệp này qua đường dẫn cài đặt thông thường. Các gói Plugin có thể phát hành do OpenClaw sở hữu phải bao gồm shrinkwrap cục bộ của gói được tạo từ biểu đồ phần phụ thuộc đã phát hành của gói đó:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Trình tạo loại bỏ `devDependencies` của Plugin, áp dụng chính sách ghi đè không gian làm việc và ghi `extensions/<id>/npm-shrinkwrap.json` cho mỗi Plugin có `openclaw.release.publishToNpm: true`. Các gói Plugin bên thứ ba cũng có thể cung cấp shrinkwrap; OpenClaw không yêu cầu tệp này đối với các gói cộng đồng, nhưng npm sẽ tuân theo khi tệp hiện diện.

Trước khi coi một gói cục bộ là bằng chứng ứng viên phát hành, hãy kiểm tra tarball sẽ được cài đặt:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Đối với các thay đổi phần phụ thuộc, cũng cần xác minh rằng bản cài đặt sản xuất có thể phân giải các gói khi chạy mà không cần phần phụ thuộc phát triển:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Các gói Plugin npm do OpenClaw sở hữu cũng có thể phát hành với `bundledDependencies` rõ ràng. Đường dẫn phát hành npm phủ danh sách tên phần phụ thuộc khi chạy, loại bỏ siêu dữ liệu không gian làm việc chỉ dành cho phát triển khỏi bản kê khai đã phát hành, chạy một lần cài đặt npm không dùng tập lệnh cho các phần phụ thuộc khi chạy cục bộ của gói, sau đó đóng gói hoặc phát hành tarball Plugin kèm theo các tệp phần phụ thuộc đó. Các gói sử dụng nhiều thành phần gốc (Codex, ACPX, Copilot, llama.cpp, memory-lancedb, Tlon) chọn không tham gia bằng `openclaw.release.bundleRuntimeDependencies: false`; chúng vẫn cung cấp shrinkwrap, nhưng npm phân giải các phần phụ thuộc khi chạy trong lúc cài đặt thay vì nhúng mọi tệp nhị phân nền tảng vào tarball Plugin. Gói `openclaw` gốc không đóng gói toàn bộ cây phần phụ thuộc của nó.

Các Plugin nhập `openclaw/plugin-sdk/*` khai báo `openclaw` là phần phụ thuộc đồng cấp. OpenClaw không cho phép npm cài đặt một bản sao riêng của gói máy chủ từ kho đăng ký vào dự án được quản lý, vì gói máy chủ cũ có thể ảnh hưởng đến quá trình phân giải phần phụ thuộc đồng cấp của npm trong Plugin đó. Các bản cài đặt npm được quản lý bỏ qua việc phân giải/tạo phần phụ thuộc đồng cấp của npm, và OpenClaw thiết lập lại các liên kết `node_modules/openclaw` cục bộ của Plugin cho những gói đã cài đặt có khai báo phần phụ thuộc đồng cấp với máy chủ, sau khi cài đặt hoặc cập nhật.

Các bản cài đặt git sao chép hoặc làm mới kho lưu trữ, sau đó chạy:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Sau đó, Plugin đã cài đặt được tải từ thư mục gói đó, vì vậy việc phân giải `node_modules` cục bộ của gói và thư mục cha hoạt động giống như đối với một gói Node thông thường.

## Plugin cục bộ

Plugin cục bộ là các thư mục do nhà phát triển kiểm soát. OpenClaw không bao giờ chạy `npm install`, `pnpm install` hoặc sửa chữa phần phụ thuộc cho chúng; nếu một Plugin cục bộ có phần phụ thuộc, hãy cài đặt chúng trong Plugin đó trước khi tải.

Các Plugin TypeScript cục bộ của bên thứ ba được tải qua Jiti như một đường dẫn khẩn cấp. Các Plugin JavaScript đã đóng gói và Plugin nội bộ đi kèm được tải qua import/require gốc.

## Khởi động và tải lại

Quá trình khởi động Gateway và tải lại cấu hình không bao giờ cài đặt phần phụ thuộc của Plugin. Chúng đọc các bản ghi cài đặt Plugin, tính toán điểm vào và tải điểm vào đó.

Việc thiếu phần phụ thuộc khi chạy khiến quá trình tải Plugin thất bại với lỗi hướng người vận hành đến cách khắc phục rõ ràng:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` dọn dẹp trạng thái phần phụ thuộc cũ do OpenClaw tạo và có thể khôi phục các Plugin có thể tải xuống nhưng bị thiếu trong bản ghi cài đặt cục bộ khi cấu hình vẫn tham chiếu đến chúng. Doctor không sửa chữa phần phụ thuộc cho một Plugin cục bộ đã cài đặt.

## Plugin đi kèm

Các Plugin đi kèm nhẹ và thiết yếu đối với lõi được cung cấp như một phần của OpenClaw. Chúng không nên mang cây phần phụ thuộc khi chạy nặng; nếu có, nên chuyển thành gói có thể tải xuống trên ClawHub/npm.

Để xem danh sách hiện được tạo tự động gồm các Plugin được cung cấp trong gói lõi, được cài đặt bên ngoài hoặc chỉ tồn tại ở dạng mã nguồn, hãy xem
[Danh mục Plugin](/vi/plugins/plugin-inventory).

Bản kê khai của Plugin đi kèm không được yêu cầu phân đoạn phần phụ thuộc. Chức năng Plugin lớn hoặc tùy chọn nên được đóng gói dưới dạng Plugin thông thường và cài đặt qua cùng đường dẫn npm/git/ClawHub như các Plugin bên thứ ba.

Trong các bản sao làm việc mã nguồn, OpenClaw coi kho lưu trữ là một monorepo pnpm. Sau khi chạy `pnpm install`, các Plugin đi kèm được tải từ `extensions/<id>` để các phần phụ thuộc không gian làm việc cục bộ của gói khả dụng và các chỉnh sửa được áp dụng trực tiếp. Việc phát triển trên bản sao làm việc mã nguồn chỉ hỗ trợ pnpm; chạy `npm install` thông thường tại thư mục gốc kho lưu trữ không chuẩn bị các phần phụ thuộc của Plugin đi kèm.

| Hình thức cài đặt                 | Vị trí Plugin đi kèm                        | Chủ sở hữu phần phụ thuộc                                                  |
| -------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `npm install -g openclaw`        | Cây thực thi đã dựng bên trong gói          | Gói OpenClaw và các luồng cài đặt/cập nhật/doctor Plugin rõ ràng           |
| Bản sao git cùng `pnpm install`  | Các gói không gian làm việc `extensions/<id>` | Không gian làm việc pnpm, bao gồm phần phụ thuộc riêng của từng gói Plugin |
| `openclaw plugins install ...`   | Thư mục gốc npm/git/ClawHub được quản lý    | Luồng cài đặt/cập nhật Plugin                                              |

## Dọn dẹp phần cũ

Các phiên bản OpenClaw cũ tạo thư mục gốc phần phụ thuộc của Plugin đi kèm khi khởi động hoặc trong quá trình sửa chữa bằng doctor. Quy trình dọn dẹp doctor hiện tại xóa các thư mục và liên kết tượng trưng cũ đó bằng `--fix`, bao gồm các thư mục gốc `plugin-runtime-deps` cũ, các liên kết tượng trưng gói tiền tố Node toàn cục trỏ đến mục tiêu `plugin-runtime-deps` đã bị loại bỏ, các bản kê khai `.openclaw-runtime-deps*`, `node_modules` Plugin được tạo tự động, các thư mục giai đoạn cài đặt và các kho pnpm cục bộ của gói. Bước hậu cài đặt của gói cũng xóa các liên kết tượng trưng toàn cục đó trước khi loại bỏ các thư mục gốc mục tiêu cũ, để quá trình nâng cấp không để lại các lệnh nhập gói ESM bị treo.

Các bản cài đặt npm cũ cũng sử dụng thư mục gốc dùng chung `~/.openclaw/npm/node_modules`. Các luồng cài đặt, cập nhật, gỡ cài đặt và doctor hiện tại vẫn nhận diện thư mục gốc phẳng cũ đó chỉ để khôi phục và dọn dẹp. Các bản cài đặt npm mới tạo thư mục gốc dự án riêng cho từng Plugin.
