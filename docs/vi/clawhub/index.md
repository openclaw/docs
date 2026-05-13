---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc Plugin
    - Xuất bản Skills hoặc Plugin lên kho đăng ký
    - Chọn giữa các luồng CLI openclaw và clawhub
sidebarTitle: ClawHub
summary: Tổng quan công khai về ClawHub cho việc khám phá, cài đặt, xuất bản, bảo mật và CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-13T05:33:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai cho Skills và Plugin của OpenClaw.

- Dùng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt Plugin từ ClawHub.
- Dùng CLI `clawhub` riêng cho các quy trình xác thực registry, phát hành, xóa/khôi phục xóa và đồng bộ.

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

Cài đặt ClawHub CLI khi bạn muốn các quy trình đã xác thực với registry như
phát hành, đồng bộ hoặc xóa/khôi phục xóa:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ gì

| Bề mặt        | Nội dung lưu trữ                                               | Lệnh thường dùng                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` cùng các tệp hỗ trợ | `openclaw skills install <slug>`             |
| Plugin mã   | Các gói Plugin OpenClaw với siêu dữ liệu tương thích         | `openclaw plugins install clawhub:<package>` |
| Plugin gói | Các gói Plugin đã đóng gói để phân phối OpenClaw            | `clawhub package publish <source>`           |
| Souls          | Các gói `SOUL.md` hiển thị trên onlycrabs.ai                      | Luồng phát hành qua web và API                    |

ClawHub theo dõi các phiên bản semver, thẻ như `latest`, nhật ký thay đổi, tệp,
lượt tải xuống, sao và tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái registry
hiện tại để người dùng có thể kiểm tra một Skill hoặc Plugin trước khi cài đặt.

## Luồng OpenClaw gốc

Các lệnh OpenClaw gốc cài đặt vào workspace OpenClaw đang hoạt động và lưu giữ
siêu dữ liệu nguồn để các lệnh cập nhật sau này vẫn có thể dùng ClawHub.

Dùng `clawhub:<package>` khi một cài đặt Plugin cần phân giải qua ClawHub.
Các đặc tả Plugin an toàn với npm ở dạng trần có thể phân giải qua npm trong giai đoạn chuyển đổi khi ra mắt, và
`npm:<package>` vẫn chỉ dùng npm khi cần nêu nguồn rõ ràng.

Cài đặt Plugin xác thực tính tương thích của `pluginApi` và `minGatewayVersion`
được quảng cáo trước khi quá trình cài đặt archive chạy. Khi một phiên bản gói phát hành artifact
ClawPack, OpenClaw ưu tiên `.tgz` npm-pack chính xác đã tải lên, xác minh
header digest ClawHub và byte đã tải xuống, đồng thời ghi lại siêu dữ liệu artifact cho
các lần cập nhật sau.

## ClawHub CLI

ClawHub CLI dành cho công việc đã xác thực với registry:

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

CLI cũng có các lệnh cài đặt/cập nhật Skill cho quy trình registry trực tiếp:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Các lệnh đó cài đặt Skills vào `./skills` trong thư mục làm việc hiện tại
và ghi lại các phiên bản đã cài đặt trong `.clawhub/lock.json`.

## Phát hành

Phát hành Skills từ một thư mục cục bộ chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn phát hành thường dùng:

- `--slug <slug>`: slug của Skill.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: văn bản nhật ký thay đổi.
- `--tags <tags>`: thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Phát hành Plugin từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref` hoặc URL
GitHub:

```bash
clawhub package publish <source>
```

Dùng `--dry-run` để dựng kế hoạch phát hành chính xác mà không tải lên, và `--json`
cho đầu ra thân thiện với CI.

Plugin mã phải bao gồm siêu dữ liệu tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết tham chiếu lệnh
đầy đủ và [Định dạng Skill](/vi/clawhub/skill-format) để biết siêu dữ liệu Skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định là mở: bất kỳ ai cũng có thể tải lên, nhưng việc phát hành yêu cầu tài khoản GitHub
đủ lâu đời để vượt qua cổng tải lên. Các trang chi tiết công khai tóm tắt
trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy kiểm tra tự động trên Skills đã phát hành và các bản phát hành Plugin. Những bản phát hành
bị giữ lại do quét hoặc bị chặn có thể biến mất khỏi danh mục công khai và bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo Skills và gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung, và cấm các tài khoản lạm dụng. Xem
[Chính sách sử dụng chấp nhận được](/vi/clawhub/acceptable-usage) và
[Bảo mật + kiểm duyệt](/vi/clawhub/security) để biết chi tiết về chính sách và thực thi.

## Telemetry và môi trường

Khi bạn chạy `clawhub sync` trong lúc đã đăng nhập, CLI gửi một ảnh chụp tối thiểu để
ClawHub có thể tính số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các ghi đè môi trường hữu ích:

| Biến                      | Tác dụng                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang dùng cho đăng nhập qua trình duyệt.     |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                    |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu trạng thái token/cấu hình. |
| `CLAWHUB_WORKDIR`             | Ghi đè thư mục làm việc mặc định.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry khi `sync`.                      |

Xem [Telemetry](/vi/clawhub/telemetry), [HTTP API](/vi/clawhub/http-api) và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để biết tài liệu tham chiếu sâu hơn.
