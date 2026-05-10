---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc Plugin
    - Xuất bản Skills hoặc Plugin lên kho đăng ký
    - Chọn giữa các luồng CLI openclaw và clawhub
sidebarTitle: ClawHub
summary: Tổng quan công khai về ClawHub dành cho việc khám phá, cài đặt, xuất bản, bảo mật và clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:25:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai cho Skills và Plugin của OpenClaw.

- Sử dụng các lệnh `openclaw` native để tìm kiếm, cài đặt và cập nhật Skills cũng như cài đặt Plugin từ ClawHub.
- Sử dụng CLI `clawhub` riêng cho các workflow xác thực registry, phát hành, xóa/khôi phục xóa, quét lại và đồng bộ.

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

Cài đặt CLI ClawHub khi bạn muốn các workflow được xác thực với registry như
phát hành, đồng bộ, xóa/khôi phục xóa hoặc quét lại theo yêu cầu của chủ sở hữu:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ những gì

| Bề mặt        | Nội dung lưu trữ                                             | Lệnh thường dùng                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` cùng các tệp hỗ trợ | `openclaw skills install <slug>`             |
| Plugin mã      | Các gói Plugin OpenClaw có metadata tương thích              | `openclaw plugins install clawhub:<package>` |
| Plugin bundle  | Các bundle Plugin đã đóng gói cho bản phân phối OpenClaw     | `clawhub package publish <source>`           |
| Souls          | Các bundle `SOUL.md` hiển thị trên onlycrabs.ai              | Các luồng phát hành qua Web và API           |

ClawHub theo dõi các phiên bản semver, thẻ như `latest`, changelog, tệp,
lượt tải xuống, sao và tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái registry
hiện tại để người dùng có thể kiểm tra một Skill hoặc Plugin trước khi cài đặt.

## Luồng OpenClaw native

Các lệnh OpenClaw native cài đặt vào workspace OpenClaw đang hoạt động và lưu giữ
metadata nguồn để các lệnh cập nhật sau này có thể tiếp tục dùng ClawHub.

Sử dụng `clawhub:<package>` khi một lượt cài đặt Plugin cần được phân giải qua ClawHub.
Các spec Plugin an toàn với npm dạng trần có thể được phân giải qua npm trong các giai đoạn chuyển đổi khi khởi chạy, và
`npm:<package>` vẫn chỉ dùng npm khi cần chỉ định nguồn rõ ràng.

Các lượt cài đặt Plugin xác thực tính tương thích `pluginApi` và `minGatewayVersion`
được quảng bá trước khi chạy cài đặt archive. Khi một phiên bản gói phát hành artifact
ClawPack, OpenClaw ưu tiên tệp `.tgz` npm-pack đã tải lên chính xác, xác minh
header digest của ClawHub và byte đã tải xuống, đồng thời ghi lại metadata artifact cho
các lần cập nhật sau.

## CLI ClawHub

CLI ClawHub dùng cho công việc cần xác thực với registry:

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

Các lệnh đó cài đặt Skills vào `./skills` dưới thư mục làm việc hiện tại
và ghi lại các phiên bản đã cài trong `.clawhub/lock.json`.

## Phát hành

Phát hành Skills từ một thư mục cục bộ chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn phát hành thường dùng:

- `--slug <slug>`: slug của Skill.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: văn bản changelog.
- `--tags <tags>`: các thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Phát hành Plugin từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref` hoặc URL GitHub:

```bash
clawhub package publish <source>
```

Sử dụng `--dry-run` để xây dựng kế hoạch phát hành chính xác mà không tải lên, và `--json`
để có đầu ra thân thiện với CI.

Plugin mã phải bao gồm metadata tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết đầy đủ tài liệu tham khảo về lệnh
và [Định dạng Skill](/vi/clawhub/skill-format) để biết metadata của Skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định mở: bất kỳ ai cũng có thể tải lên, nhưng việc phát hành yêu cầu một tài khoản GitHub
đủ cũ để vượt qua cổng tải lên. Các trang chi tiết công khai tóm tắt
trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy kiểm tra tự động trên Skills và bản phát hành Plugin đã phát hành. Các bản phát hành
bị giữ do quét hoặc bị chặn có thể biến mất khỏi catalog công khai và bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu của chúng trong `/dashboard`.

Chủ sở hữu có thể yêu cầu quét lại có giới hạn để khôi phục các trường hợp dương tính giả. Điều phối viên
và quản trị viên nền tảng có thể yêu cầu quét lại cho bất kỳ Skill hoặc gói nào khi xử lý
báo cáo hỗ trợ:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Người dùng đã đăng nhập có thể báo cáo Skills và gói. Điều phối viên có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung, giải quyết khiếu nại và cấm các tài khoản lạm dụng. Xem
[Mức sử dụng được chấp nhận](/vi/clawhub/acceptable-usage) và
[Bảo mật + kiểm duyệt](/vi/clawhub/security) để biết chi tiết về chính sách và thực thi.

## Telemetry và môi trường

Khi bạn chạy `clawhub sync` trong lúc đã đăng nhập, CLI gửi một snapshot tối thiểu để
ClawHub có thể tính số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các override môi trường hữu ích:

| Biến                          | Hiệu ứng                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL trang dùng cho đăng nhập bằng trình duyệt. |
| `CLAWHUB_REGISTRY`            | Override URL API registry.                        |
| `CLAWHUB_CONFIG_PATH`         | Override nơi CLI lưu trạng thái token/config.     |
| `CLAWHUB_WORKDIR`             | Override thư mục làm việc mặc định.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry trên `sync`.                        |

Xem [Telemetry](/vi/clawhub/telemetry), [HTTP API](/vi/clawhub/http-api) và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để biết tài liệu tham khảo chuyên sâu hơn.
