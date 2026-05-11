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
    generated_at: "2026-05-11T20:24:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai cho Skills và plugin của OpenClaw.

- Dùng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt plugin từ ClawHub.
- Dùng CLI `clawhub` riêng cho các quy trình xác thực với registry, xuất bản, xóa/khôi phục xóa, quét lại và đồng bộ.

Trang: [clawhub.ai](https://clawhub.ai)

## Bắt đầu nhanh

Tìm kiếm và cài đặt Skills bằng OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Tìm kiếm và cài đặt plugin bằng OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Cài đặt ClawHub CLI khi bạn cần các quy trình được xác thực với registry như
xuất bản, đồng bộ, xóa/khôi phục xóa, hoặc quét lại theo yêu cầu của chủ sở hữu:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ những gì

| Bề mặt        | Nội dung lưu trữ                                               | Lệnh thường dùng                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` cùng tệp hỗ trợ | `openclaw skills install <slug>`             |
| Plugin mã   | Các gói plugin OpenClaw với metadata tương thích         | `openclaw plugins install clawhub:<package>` |
| Plugin bundle | Các bundle plugin đã đóng gói cho bản phân phối OpenClaw            | `clawhub package publish <source>`           |
| Souls          | Các bundle `SOUL.md` hiển thị trên onlycrabs.ai                      | Luồng xuất bản qua web và API                    |

ClawHub theo dõi phiên bản semver, thẻ như `latest`, changelog, tệp,
lượt tải xuống, sao và bản tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái registry
hiện tại để người dùng có thể kiểm tra một Skill hoặc plugin trước khi cài đặt.

## Luồng OpenClaw gốc

Các lệnh OpenClaw gốc cài đặt vào workspace OpenClaw đang hoạt động và lưu giữ
metadata nguồn để các lệnh cập nhật sau này có thể tiếp tục dùng ClawHub.

Dùng `clawhub:<package>` khi một cài đặt plugin cần được phân giải qua ClawHub.
Các spec plugin an toàn với npm ở dạng trần có thể được phân giải qua npm trong giai đoạn chuyển đổi khi ra mắt, và
`npm:<package>` vẫn chỉ dùng npm khi cần chỉ rõ nguồn.

Cài đặt plugin xác thực tính tương thích `pluginApi` và `minGatewayVersion`
được quảng bá trước khi chạy cài đặt archive. Khi một phiên bản gói xuất bản một
artifact ClawPack, OpenClaw ưu tiên `.tgz` npm-pack đã tải lên chính xác, xác minh
header digest ClawHub và byte đã tải xuống, đồng thời ghi lại metadata artifact cho
các lần cập nhật sau.

## ClawHub CLI

ClawHub CLI dùng cho công việc được xác thực với registry:

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

## Xuất bản

Xuất bản Skills từ một thư mục cục bộ chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn xuất bản thường dùng:

- `--slug <slug>`: slug của Skill.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: văn bản changelog.
- `--tags <tags>`: các thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Xuất bản plugin từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc URL GitHub:

```bash
clawhub package publish <source>
```

Dùng `--dry-run` để dựng kế hoạch xuất bản chính xác mà không tải lên, và `--json`
để có đầu ra thân thiện với CI.

Plugin mã phải bao gồm metadata tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết tài liệu tham khảo lệnh
đầy đủ và [Định dạng Skill](/vi/clawhub/skill-format) để biết metadata Skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định là mở: bất kỳ ai cũng có thể tải lên, nhưng việc xuất bản yêu cầu một tài khoản GitHub
đủ cũ để vượt qua cổng tải lên. Các trang chi tiết công khai tóm tắt trạng thái quét
mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy kiểm tra tự động trên Skills và bản phát hành plugin đã xuất bản. Các bản phát hành bị giữ lại do quét
hoặc bị chặn có thể biến mất khỏi catalog công khai và bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu trong `/dashboard`.

Chủ sở hữu có thể yêu cầu quét lại có giới hạn để khôi phục khi có kết quả dương tính giả. Người kiểm duyệt và quản trị viên
nền tảng có thể yêu cầu quét lại bất kỳ Skill hoặc gói nào khi xử lý
báo cáo hỗ trợ:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Người dùng đã đăng nhập có thể báo cáo Skills và gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung, giải quyết khiếu nại và cấm tài khoản lạm dụng. Xem
[Sử dụng được chấp nhận](/vi/clawhub/acceptable-usage) và
[Bảo mật + kiểm duyệt](/vi/clawhub/security) để biết chi tiết về chính sách và thực thi.

## Telemetry và môi trường

Khi bạn chạy `clawhub sync` trong lúc đã đăng nhập, CLI gửi một snapshot tối thiểu để
ClawHub có thể tính số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các ghi đè môi trường hữu ích:

| Biến                      | Tác dụng                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang dùng cho đăng nhập qua trình duyệt.     |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                    |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu trạng thái token/config. |
| `CLAWHUB_WORKDIR`             | Ghi đè thư mục làm việc mặc định.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry khi chạy `sync`.                      |

Xem [Telemetry](/vi/clawhub/telemetry), [HTTP API](/vi/clawhub/http-api), và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để có tài liệu tham khảo chuyên sâu hơn.
