---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hay Plugin
    - Xuất bản Skills hoặc Plugin lên kho đăng ký
    - Lựa chọn giữa các quy trình CLI của openclaw và clawhub
sidebarTitle: ClawHub
summary: Tổng quan công khai về ClawHub để khám phá, cài đặt, xuất bản, bảo mật và CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T07:47:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là kho đăng ký công khai dành cho các Skills và plugin của OpenClaw.

- Sử dụng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt plugin từ ClawHub.
- Sử dụng CLI `clawhub` riêng cho việc xác thực với kho đăng ký, xuất bản và các quy trình xóa/khôi phục.

Trang web: [clawhub.ai](https://clawhub.ai)

## Bắt đầu nhanh

Tìm kiếm và cài đặt Skills bằng OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Tìm kiếm và cài đặt plugin bằng OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Cài đặt CLI ClawHub khi bạn cần các quy trình đã xác thực với kho đăng ký, chẳng hạn như
xuất bản hoặc xóa/khôi phục:

```bash
npm i -g clawhub
# hoặc
pnpm add -g clawhub
```

## Nội dung ClawHub lưu trữ

| Loại nội dung    | Nội dung được lưu trữ                                         | Lệnh thường dùng                              |
| ---------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Skills           | Các gói văn bản có phiên bản, gồm `SKILL.md` và các tệp hỗ trợ | `openclaw skills install @openclaw/demo`      |
| Plugin mã nguồn  | Các gói plugin OpenClaw kèm siêu dữ liệu tương thích          | `openclaw plugins install clawhub:<package>`  |
| Plugin đóng gói  | Các gói plugin đã đóng gói để phân phối cùng OpenClaw         | `clawhub package publish <source>`            |

ClawHub theo dõi các phiên bản semver, thẻ như `latest`, nhật ký thay đổi, tệp,
lượt tải xuống, lượt đánh dấu sao và bản tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái hiện tại của kho đăng ký
để người dùng có thể kiểm tra một Skill hoặc plugin trước khi cài đặt.

## Quy trình gốc của OpenClaw

Các lệnh OpenClaw gốc cài đặt vào không gian làm việc OpenClaw đang hoạt động và lưu giữ
siêu dữ liệu nguồn để các lệnh cập nhật sau này có thể tiếp tục sử dụng ClawHub.

Sử dụng `clawhub:<package>` khi việc cài đặt plugin cần được phân giải thông qua ClawHub.
Các đặc tả plugin trần hợp lệ với npm có thể được phân giải thông qua npm trong quá trình chuyển đổi phát hành, còn
`npm:<package>` luôn chỉ sử dụng npm khi cần chỉ định nguồn rõ ràng.

Quá trình cài đặt plugin xác thực khả năng tương thích được công bố qua `pluginApi` và `minGatewayVersion`
trước khi tiến hành cài đặt kho lưu trữ. Khi một phiên bản gói xuất bản cấu phần ClawPack, OpenClaw ưu tiên
tệp `.tgz` chính xác được tải lên bằng npm-pack, xác minh tiêu đề giá trị băm ClawHub và dữ liệu đã tải xuống,
đồng thời ghi lại siêu dữ liệu cấu phần để phục vụ các lần cập nhật sau.

## CLI ClawHub

CLI ClawHub dành cho các tác vụ đã xác thực với kho đăng ký:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI cũng có các lệnh cài đặt/cập nhật Skill dành cho quy trình làm việc trực tiếp với kho đăng ký:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Các lệnh này cài đặt Skills vào `./skills` trong thư mục làm việc hiện tại
và ghi lại các phiên bản đã cài đặt trong `.clawhub/lock.json`.

## Xuất bản

Xuất bản Skills từ một thư mục cục bộ chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn xuất bản thường dùng:

- `--slug <slug>`: tên URL của Skill được xuất bản.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: nội dung nhật ký thay đổi.
- `--tags <tags>`: các thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Xuất bản plugin từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref` hoặc một URL GitHub:

```bash
clawhub package publish <source>
```

Sử dụng `--dry-run` để xây dựng kế hoạch xuất bản chính xác mà không tải lên và `--json`
để có đầu ra phù hợp với CI.

Plugin mã nguồn phải bao gồm siêu dữ liệu tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết tài liệu tham khảo đầy đủ về lệnh
và [Định dạng Skill](/clawhub/skill-format) để biết siêu dữ liệu Skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định là nền tảng mở: bất kỳ ai cũng có thể tải lên, nhưng việc xuất bản yêu cầu một tài khoản GitHub
đủ lâu năm để vượt qua cổng kiểm tra tải lên. Các trang chi tiết công khai tóm tắt
trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy các bước kiểm tra tự động đối với Skills đã xuất bản và các bản phát hành plugin. Các bản phát hành
bị giữ lại để quét hoặc bị chặn có thể biến mất khỏi danh mục công khai và giao diện cài đặt, trong khi
vẫn hiển thị với chủ sở hữu trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo Skills và gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung và cấm các tài khoản lạm dụng. Xem
[Bảo mật](/clawhub/security),
[Kiểm tra bảo mật](/vi/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/clawhub/moderation) và
[Quy định sử dụng được chấp nhận](/clawhub/acceptable-usage) để biết chi tiết về chính sách và thực thi.

## Dữ liệu đo từ xa và môi trường

Khi bạn chạy `clawhub install` trong lúc đã đăng nhập, CLI có thể gửi một sự kiện cài đặt
theo cơ chế nỗ lực tối đa để ClawHub có thể tính toán tổng số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các tùy chọn ghi đè môi trường hữu ích:

| Biến                           | Tác dụng                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `CLAWHUB_SITE`                 | Ghi đè URL trang web dùng để đăng nhập qua trình duyệt.         |
| `CLAWHUB_REGISTRY`             | Ghi đè URL API của kho đăng ký.                                 |
| `CLAWHUB_CONFIG_PATH`          | Ghi đè vị trí CLI lưu trạng thái mã thông báo/cấu hình.         |
| `CLAWHUB_WORKDIR`              | Ghi đè thư mục làm việc mặc định.                               |
| `CLAWHUB_DISABLE_TELEMETRY=1`  | Tắt dữ liệu đo từ xa về lượt cài đặt.                           |

Xem [Dữ liệu đo từ xa](/vi/clawhub/telemetry), [API HTTP](/clawhub/http-api) và
[Khắc phục sự cố](/clawhub/troubleshooting) để biết tài liệu tham khảo chuyên sâu hơn.
