---
read_when:
    - Bạn muốn biết npm shrinkwrap có ý nghĩa gì trong một bản phát hành OpenClaw
    - Bạn đang rà soát các tệp khóa gói, thay đổi về phần phụ thuộc hoặc rủi ro chuỗi cung ứng
    - Bạn đang xác thực các gói npm gốc hoặc Plugin trước khi phát hành
summary: Giải thích bằng ngôn ngữ dễ hiểu và theo góc độ kỹ thuật về npm shrinkwrap trong các bản phát hành OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-12T07:57:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Các bản sao mã nguồn OpenClaw sử dụng `pnpm-lock.yaml`. Các gói npm OpenClaw đã phát hành sử dụng `npm-shrinkwrap.json`, tệp khóa phụ thuộc có thể phát hành của npm, để quá trình cài đặt gói sử dụng đồ thị phụ thuộc đã được xem xét trong quá trình phát hành.

## Tại sao điều này quan trọng

Shrinkwrap là biên nhận cho cây phụ thuộc đi kèm với một gói npm: nó cho npm biết chính xác những phiên bản phụ thuộc bắc cầu nào cần cài đặt.

| Tệp                   | Nơi có ý nghĩa                     | Ý nghĩa                              |
| --------------------- | ---------------------------------- | ------------------------------------ |
| `pnpm-lock.yaml`      | Bản sao mã nguồn OpenClaw          | Đồ thị phụ thuộc của người bảo trì   |
| `npm-shrinkwrap.json` | Gói npm đã phát hành                | Đồ thị cài đặt npm dành cho người dùng |
| `package-lock.json`   | Ứng dụng npm cục bộ                 | Không phải hợp đồng phát hành OpenClaw |

Đối với các bản phát hành OpenClaw, điều này có nghĩa là:

- gói đã phát hành không yêu cầu npm tạo ra một đồ thị phụ thuộc mới tại thời điểm cài đặt;
- các thay đổi phụ thuộc có thể được xem xét vì chúng xuất hiện trong phần chênh lệch của tệp khóa;
- quá trình xác thực bản phát hành kiểm thử đúng đồ thị mà người dùng sẽ cài đặt;
- những bất ngờ về kích thước gói hoặc phụ thuộc gốc được phát hiện trước khi phát hành.

Shrinkwrap không phải là môi trường cách ly. Bản thân nó không làm cho một phụ thuộc trở nên an toàn và không thay thế việc cách ly máy chủ, `openclaw security audit`, nguồn gốc gói hoặc các kiểm thử nhanh quá trình cài đặt.

OpenClaw là một Gateway, máy chủ Plugin, bộ định tuyến mô hình và môi trường chạy tác tử, vì vậy một bản cài đặt mặc định ảnh hưởng đến thời gian khởi động, mức sử dụng ổ đĩa, việc tải xuống gói gốc và mức độ phơi nhiễm với chuỗi cung ứng. Shrinkwrap cung cấp cho quá trình xem xét bản phát hành một ranh giới ổn định: người đánh giá thấy được sự dịch chuyển của các phụ thuộc bắc cầu, trình xác thực từ chối những thay đổi ngoài dự kiến trong tệp khóa và các gói Plugin mang theo đồ thị phụ thuộc đã khóa riêng thay vì dựa vào gói gốc.

## Tạo và kiểm tra

Gói npm `openclaw` gốc, các gói Plugin npm do OpenClaw sở hữu (ví dụ `@openclaw/discord`) và các gói không gian làm việc có thể phát hành như [`@openclaw/ai`](/reference/openclaw-ai) bao gồm `npm-shrinkwrap.json` khi được phát hành. Các phụ thuộc không gian làm việc được loại khỏi shrinkwrap gốc vì chúng được phát hành cùng với gói gốc; thay vào đó, mỗi gói không gian làm việc có thể phát hành sẽ ghim cây phụ thuộc bắc cầu riêng. Các gói Plugin phù hợp cũng có thể được phát hành với `bundledDependencies` được chỉ định rõ ràng, mang các tệp phụ thuộc khi chạy trong tệp tarball của Plugin thay vì chỉ dựa vào việc phân giải tại thời điểm cài đặt.

```bash
# Tất cả các gói được quản lý bằng shrinkwrap (gốc + Plugin có thể phát hành)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Chỉ gói gốc
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Chỉ các gói bị ảnh hưởng bởi tập hợp thay đổi hiện tại
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Trình tạo phân giải định dạng khóa có thể phát hành của npm nhưng từ chối các phiên bản gói được tạo mà chưa có trong `pnpm-lock.yaml`. Điều này giữ nguyên ranh giới xem xét về tuổi của phụ thuộc pnpm, phần ghi đè và bản vá.

Hãy xem xét những nội dung sau như các thành phần nhạy cảm về bảo mật:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- tải trọng phụ thuộc được đóng gói kèm của Plugin
- mọi phần chênh lệch của `package-lock.json`

Các trình xác thực gói OpenClaw yêu cầu có shrinkwrap trong các tệp tarball gói gốc mới và từ chối `package-lock.json` đối với các gói đã phát hành. Quy trình phát hành Plugin lên npm kiểm tra shrinkwrap cục bộ của Plugin, cài đặt các phụ thuộc được đóng gói kèm ở cấp gói, sau đó đóng gói hoặc phát hành.

## Kiểm tra một gói đã phát hành

Gói gốc:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Gói Plugin:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Thông tin nền: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
