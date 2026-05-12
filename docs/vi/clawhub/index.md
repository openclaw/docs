---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc Plugin
    - Xuất bản Skills hoặc Plugin lên kho đăng ký
    - Chọn giữa các luồng CLI openclaw và clawhub
sidebarTitle: ClawHub
summary: Tổng quan công khai về ClawHub dành cho khám phá, cài đặt, xuất bản, bảo mật và CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T23:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai cho Skills và Plugin của OpenClaw.

- Sử dụng các lệnh `openclaw` native để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt Plugin từ ClawHub.
- Sử dụng CLI `clawhub` riêng cho các workflow xác thực registry, xuất bản, xóa/khôi phục xóa và đồng bộ.

Trang: [clawhub.ai](https://clawhub.ai)

## Bắt đầu nhanh

Tìm kiếm và cài đặt Skills bằng OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Tìm kiếm và cài đặt Plugin bằng OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Cài đặt ClawHub CLI khi bạn muốn dùng các workflow có xác thực registry như
xuất bản, đồng bộ hoặc xóa/khôi phục xóa:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ những gì

| Bề mặt        | Nội dung lưu trữ                                               | Lệnh thường dùng                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` cùng các tệp hỗ trợ | `openclaw skills install <slug>`             |
| Plugin mã   | Các gói Plugin OpenClaw có metadata tương thích         | `openclaw plugins install clawhub:<package>` |
| Plugin bundle | Các bundle Plugin đã đóng gói cho bản phân phối OpenClaw            | `clawhub package publish <source>`           |
| Souls          | Các bundle `SOUL.md` hiển thị trên onlycrabs.ai                      | Các flow xuất bản qua web và API                    |

ClawHub theo dõi các phiên bản semver, tag như `latest`, changelog, tệp,
lượt tải xuống, sao và tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái registry
hiện tại để người dùng có thể kiểm tra một Skill hoặc Plugin trước khi cài đặt.

## Các flow OpenClaw native

Các lệnh OpenClaw native cài đặt vào workspace OpenClaw đang hoạt động và lưu giữ
metadata nguồn để các lệnh cập nhật sau này có thể tiếp tục dùng ClawHub.

Dùng `clawhub:<package>` khi một lần cài đặt Plugin cần resolve qua ClawHub.
Các spec Plugin an toàn với npm dạng trần có thể resolve qua npm trong các giai đoạn chuyển đổi khi ra mắt, và
`npm:<package>` vẫn chỉ dùng npm khi cần chỉ rõ nguồn.

Các lần cài đặt Plugin xác thực khả năng tương thích `pluginApi` và `minGatewayVersion`
được quảng bá trước khi chạy cài đặt archive. Khi một phiên bản gói xuất bản một
artifact ClawPack, OpenClaw ưu tiên `.tgz` npm-pack đã upload chính xác, xác minh
header digest ClawHub và các byte đã tải xuống, rồi ghi lại metadata artifact cho
các lần cập nhật sau này.

## ClawHub CLI

ClawHub CLI dùng cho công việc có xác thực registry:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

CLI cũng có các lệnh cài đặt/cập nhật Skill cho workflow registry trực tiếp:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Các lệnh đó cài đặt Skills vào `./skills` trong thư mục làm việc hiện tại
và ghi lại các phiên bản đã cài đặt trong `.clawhub/lock.json`.

## Xuất bản

Xuất bản Skills từ một thư mục cục bộ chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn xuất bản thường dùng:

- `--slug <slug>`: slug của Skill.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: nội dung changelog.
- `--tags <tags>`: các tag phân tách bằng dấu phẩy, mặc định là `latest`.

Xuất bản Plugin từ thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc URL GitHub:

```bash
clawhub package publish <source>
```

Dùng `--dry-run` để xây dựng kế hoạch xuất bản chính xác mà không upload, và `--json`
cho output thân thiện với CI.

Plugin mã phải bao gồm metadata tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết đầy đủ
tham chiếu lệnh và [Định dạng Skill](/vi/clawhub/skill-format) để biết metadata Skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định là mở: bất kỳ ai cũng có thể upload, nhưng việc xuất bản yêu cầu tài khoản GitHub
đủ cũ để vượt qua cổng upload. Các trang chi tiết công khai tóm tắt
trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy các kiểm tra tự động trên Skills và bản phát hành Plugin đã xuất bản. Các bản phát hành
bị giữ bởi quét hoặc bị chặn có thể biến mất khỏi catalog công khai và các bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu của chúng trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo Skills và gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung, và cấm các tài khoản lạm dụng. Xem
[Chính sách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage) và
[Bảo mật + kiểm duyệt](/vi/clawhub/security) để biết chi tiết về chính sách và thực thi.

## Telemetry và môi trường

Khi bạn chạy `clawhub sync` trong lúc đã đăng nhập, CLI gửi một snapshot tối thiểu để
ClawHub có thể tính số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các override môi trường hữu ích:

| Biến                      | Tác dụng                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang dùng cho đăng nhập bằng trình duyệt.     |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                    |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu trạng thái token/config. |
| `CLAWHUB_WORKDIR`             | Ghi đè thư mục làm việc mặc định.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry trên `sync`.                      |

Xem [Telemetry](/vi/clawhub/telemetry), [HTTP API](/vi/clawhub/http-api), và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để có tài liệu tham khảo sâu hơn.
