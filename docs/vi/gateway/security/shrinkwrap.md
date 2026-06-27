---
read_when:
    - Bạn muốn biết npm shrinkwrap có nghĩa là gì trong một bản phát hành OpenClaw
    - Bạn đang xem xét các tệp khóa gói, thay đổi phụ thuộc hoặc rủi ro chuỗi cung ứng
    - Bạn đang xác thực các gói npm gốc hoặc Plugin trước khi phát hành
summary: Giải thích bằng tiếng Anh đơn giản và kỹ thuật về npm shrinkwrap trong các bản phát hành OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:33:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Các checkout mã nguồn OpenClaw dùng `pnpm-lock.yaml`. Các gói npm OpenClaw đã xuất bản dùng `npm-shrinkwrap.json`, lockfile phụ thuộc có thể xuất bản của npm, để quá trình cài đặt gói dùng đồ thị phụ thuộc đã được xem xét trong quá trình phát hành.

## Phiên bản dễ hiểu

Shrinkwrap là biên nhận cho cây phụ thuộc được phân phối cùng một gói npm.
Nó cho npm biết chính xác các phiên bản gói bắc cầu nào cần cài đặt.

Đối với các bản phát hành OpenClaw, điều đó có nghĩa là:

- gói đã xuất bản không yêu cầu npm tự tạo một đồ thị phụ thuộc mới tại
  thời điểm cài đặt;
- các thay đổi phụ thuộc dễ xem xét hơn vì chúng xuất hiện trong lockfile;
- xác thực phát hành có thể kiểm thử đúng đồ thị mà người dùng sẽ cài đặt;
- các bất ngờ về kích thước gói hoặc phụ thuộc native dễ được phát hiện hơn trước khi
  xuất bản.

Shrinkwrap không phải là sandbox. Bản thân nó không làm cho phụ thuộc trở nên an toàn, và
nó không thay thế cô lập host, `openclaw security audit`, nguồn gốc gói, hoặc
kiểm thử smoke cài đặt.

Mô hình tư duy ngắn gọn:

| Tệp                   | Nơi nó quan trọng       | Ý nghĩa                          |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | Checkout mã nguồn OpenClaw | Đồ thị phụ thuộc của maintainer  |
| `npm-shrinkwrap.json` | Gói npm đã xuất bản      | Đồ thị cài đặt npm cho người dùng |
| `package-lock.json`   | Ứng dụng npm cục bộ      | Không phải hợp đồng xuất bản OpenClaw |

## Vì sao OpenClaw dùng nó

OpenClaw là một Gateway, host Plugin, bộ định tuyến mô hình, và runtime agent. Một bản
cài đặt mặc định có thể ảnh hưởng đến thời gian khởi động, dung lượng đĩa, tải xuống gói native, và
mức độ phơi nhiễm chuỗi cung ứng.

Shrinkwrap cung cấp cho quá trình xem xét phát hành một ranh giới ổn định:

- reviewer có thể thấy chuyển động của phụ thuộc bắc cầu;
- trình xác thực gói có thể từ chối độ lệch lockfile ngoài dự kiến;
- chấp nhận gói có thể kiểm thử cài đặt với đồ thị sẽ được phân phối;
- các gói Plugin có thể mang theo đồ thị phụ thuộc đã khóa riêng thay vì
  dựa vào gói gốc để sở hữu các phụ thuộc chỉ dành cho Plugin.

Mục tiêu không phải là "nhiều lockfile hơn." Mục tiêu là các bản cài đặt phát hành có thể tái lập
với quyền sở hữu rõ ràng.

## Chi tiết kỹ thuật

Gói npm gốc `openclaw` và các gói npm Plugin do OpenClaw sở hữu bao gồm
`npm-shrinkwrap.json` khi chúng xuất bản. Các gói Plugin phù hợp do OpenClaw sở hữu
cũng có thể xuất bản với `bundledDependencies` tường minh, để các tệp phụ thuộc
runtime của chúng được mang trong tarball Plugin thay vì chỉ phụ thuộc vào
phân giải tại thời điểm cài đặt.

Duy trì ranh giới như sau:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Bộ tạo phân giải định dạng khóa có thể xuất bản của npm nhưng từ chối các
phiên bản gói được tạo chưa có trong `pnpm-lock.yaml`. Điều đó giữ nguyên
ranh giới tuổi phụ thuộc, override, và xem xét patch của pnpm.

Chỉ dùng các lệnh chỉ dành cho gốc khi cố ý làm mới gói gốc
mà không chạm vào các gói Plugin:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Xem xét các tệp này như nhạy cảm về bảo mật:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- payload phụ thuộc Plugin được bundle
- bất kỳ diff `package-lock.json` nào

Trình xác thực gói OpenClaw yêu cầu shrinkwrap trong các tarball gói gốc mới.
Đường dẫn xuất bản npm của Plugin kiểm tra shrinkwrap cục bộ của Plugin, cài đặt
các phụ thuộc được bundle cục bộ theo gói, rồi pack hoặc xuất bản. Trình xác thực gói
từ chối `package-lock.json` đối với các gói OpenClaw đã xuất bản.

Để kiểm tra một gói gốc đã xuất bản:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Để kiểm tra một gói Plugin do OpenClaw sở hữu:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Bối cảnh: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
