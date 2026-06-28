---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc plugin
    - Xuất bản Skills hoặc plugin lên registry
    - Chọn giữa các luồng CLI openclaw và clawhub
sidebarTitle: ClawHub
summary: Tổng quan công khai về ClawHub để khám phá, cài đặt, xuất bản, bảo mật và clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T05:07:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là sổ đăng ký công khai cho Skills và Plugin của OpenClaw.

- Dùng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt Plugin từ ClawHub.
- Dùng CLI `clawhub` riêng cho các quy trình xác thực sổ đăng ký, phát hành và xóa/khôi phục xóa.

Trang: [clawhub.ai](https://clawhub.ai)

## Bắt đầu nhanh

Tìm kiếm và cài đặt Skills bằng OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Tìm kiếm và cài đặt Plugin bằng OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Cài đặt CLI ClawHub khi bạn muốn các quy trình có xác thực sổ đăng ký như
phát hành hoặc xóa/khôi phục xóa:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ những gì

| Bề mặt        | Nội dung lưu trữ                                             | Lệnh thường dùng                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` cùng các tệp hỗ trợ | `openclaw skills install @openclaw/demo`     |
| Plugin mã      | Các gói Plugin OpenClaw với siêu dữ liệu tương thích         | `openclaw plugins install clawhub:<package>` |
| Plugin bundle  | Các bundle Plugin đã đóng gói để phân phối OpenClaw          | `clawhub package publish <source>`           |

ClawHub theo dõi các phiên bản semver, thẻ như `latest`, changelog, tệp,
lượt tải xuống, sao và tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái sổ đăng ký
hiện tại để người dùng có thể kiểm tra một Skill hoặc Plugin trước khi cài đặt.

## Luồng OpenClaw gốc

Các lệnh OpenClaw gốc cài đặt vào workspace OpenClaw đang hoạt động và lưu giữ
siêu dữ liệu nguồn để các lệnh cập nhật sau này có thể tiếp tục dùng ClawHub.

Dùng `clawhub:<package>` khi một lượt cài đặt Plugin cần được phân giải qua ClawHub.
Các đặc tả Plugin an toàn với npm dạng trần có thể được phân giải qua npm trong các giai đoạn chuyển đổi khi ra mắt, và
`npm:<package>` vẫn chỉ dùng npm khi nguồn phải được chỉ định rõ.

Các lượt cài đặt Plugin xác thực khả năng tương thích `pluginApi` và `minGatewayVersion`
được công bố trước khi quá trình cài đặt archive chạy. Khi một phiên bản gói phát hành một
artifact ClawPack, OpenClaw ưu tiên npm-pack `.tgz` đã tải lên chính xác, xác minh
header digest ClawHub và các byte đã tải xuống, rồi ghi lại siêu dữ liệu artifact cho
các lần cập nhật sau.

## CLI ClawHub

CLI ClawHub dành cho công việc có xác thực sổ đăng ký:

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

CLI cũng có các lệnh cài đặt/cập nhật Skill cho quy trình sổ đăng ký trực tiếp:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

- `--slug <slug>`: tên URL của Skill được phát hành.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: nội dung changelog.
- `--tags <tags>`: các thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Phát hành Plugin từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc một URL GitHub:

```bash
clawhub package publish <source>
```

Dùng `--dry-run` để xây dựng kế hoạch phát hành chính xác mà không tải lên, và `--json`
để có đầu ra thân thiện với CI.

Plugin mã phải bao gồm siêu dữ liệu tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết tham chiếu lệnh
đầy đủ và [Định dạng Skill](/vi/clawhub/skill-format) để biết siêu dữ liệu Skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định là mở: bất kỳ ai cũng có thể tải lên, nhưng việc phát hành yêu cầu một tài khoản GitHub
đủ lâu năm để vượt qua cổng tải lên. Các trang chi tiết công khai tóm tắt trạng thái quét
mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy các kiểm tra tự động trên Skills và bản phát hành Plugin đã phát hành. Các bản phát hành bị giữ do quét
hoặc bị chặn có thể biến mất khỏi catalog công khai và các bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu của chúng trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo Skills và gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung, và cấm các tài khoản lạm dụng. Xem
[Bảo mật](/vi/clawhub/security),
[Kiểm toán bảo mật](/vi/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation), và
[Sử dụng chấp nhận được](/vi/clawhub/acceptable-usage) để biết chi tiết về chính sách và thực thi.

## Telemetry và môi trường

Khi bạn chạy `clawhub install` trong lúc đã đăng nhập, CLI có thể gửi một sự kiện cài đặt theo nỗ lực tốt nhất
để ClawHub có thể tính tổng số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các ghi đè môi trường hữu ích:

| Biến                          | Tác dụng                                          |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang dùng cho đăng nhập bằng trình duyệt. |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API sổ đăng ký.                       |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu trạng thái token/cấu hình.     |
| `CLAWHUB_WORKDIR`             | Ghi đè thư mục làm việc mặc định.                 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry cài đặt.                            |

Xem [Telemetry](/vi/clawhub/telemetry), [HTTP API](/vi/clawhub/http-api), và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để biết tài liệu tham chiếu sâu hơn.
