---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật skills hoặc plugins
    - Xuất bản Skills hoặc Plugin lên sổ đăng ký
    - Chọn giữa các luồng CLI openclaw và clawhub
sidebarTitle: ClawHub
summary: Tổng quan ClawHub công khai để khám phá, cài đặt, phát hành, bảo mật và CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T10:46:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai cho Skills và Plugin của OpenClaw.

- Sử dụng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt Plugin từ ClawHub.
- Sử dụng CLI `clawhub` riêng cho các quy trình xác thực registry, phát hành và xóa/khôi phục xóa.

Trang web: [clawhub.ai](https://clawhub.ai)

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

Cài đặt CLI ClawHub khi bạn cần các quy trình đã xác thực với registry như
phát hành hoặc xóa/khôi phục xóa:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ những gì

| Bề mặt        | Nội dung lưu trữ                                               | Lệnh điển hình                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` cùng các tệp hỗ trợ | `openclaw skills install @openclaw/demo`     |
| Plugin mã   | Các gói Plugin OpenClaw có siêu dữ liệu tương thích         | `openclaw plugins install clawhub:<package>` |
| Plugin bundle | Các bundle Plugin đã đóng gói để phân phối OpenClaw            | `clawhub package publish <source>`           |

ClawHub theo dõi các phiên bản semver, thẻ như `latest`, nhật ký thay đổi, tệp,
lượt tải xuống, sao và tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái registry
hiện tại để người dùng có thể kiểm tra một Skill hoặc Plugin trước khi cài đặt.

## Luồng OpenClaw gốc

Các lệnh OpenClaw gốc cài đặt vào workspace OpenClaw đang hoạt động và lưu giữ
siêu dữ liệu nguồn để các lệnh cập nhật sau này có thể tiếp tục dùng ClawHub.

Dùng `clawhub:<package>` khi việc cài đặt Plugin cần được phân giải qua ClawHub.
Các đặc tả Plugin trần an toàn với npm có thể được phân giải qua npm trong giai đoạn chuyển đổi khi ra mắt, và
`npm:<package>` vẫn chỉ dùng npm khi cần chỉ rõ nguồn.

Quá trình cài đặt Plugin xác thực khả năng tương thích của `pluginApi` và `minGatewayVersion`
đã công bố trước khi chạy cài đặt archive. Khi một phiên bản gói phát hành artifact
ClawPack, OpenClaw ưu tiên đúng tệp npm-pack `.tgz` đã tải lên, xác minh
header digest của ClawHub và các byte đã tải xuống, đồng thời ghi lại siêu dữ liệu artifact cho
các lần cập nhật sau.

## CLI ClawHub

CLI ClawHub dành cho công việc đã xác thực với registry:

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

CLI cũng có các lệnh cài đặt/cập nhật Skill cho các quy trình registry trực tiếp:

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

- `--slug <slug>`: tên URL của Skill đã phát hành.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: văn bản nhật ký thay đổi.
- `--tags <tags>`: các thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Phát hành Plugin từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc URL
GitHub:

```bash
clawhub package publish <source>
```

Dùng `--dry-run` để dựng đúng kế hoạch phát hành mà không tải lên, và `--json`
để có đầu ra thân thiện với CI.

Plugin mã phải bao gồm siêu dữ liệu tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết tham chiếu lệnh
đầy đủ và [Định dạng Skill](/clawhub/skill-format) để biết siêu dữ liệu Skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định là mở: bất kỳ ai cũng có thể tải lên, nhưng việc phát hành yêu cầu tài khoản GitHub
đủ cũ để vượt qua cổng tải lên. Các trang chi tiết công khai tóm tắt
trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy các kiểm tra tự động trên Skills và các bản phát hành Plugin đã công bố. Các bản phát hành
bị giữ để quét hoặc bị chặn có thể biến mất khỏi danh mục công khai và bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu của chúng trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo Skills và các gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung, và cấm các tài khoản lạm dụng. Xem
[Bảo mật](/vi/clawhub/security),
[Kiểm toán bảo mật](/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/clawhub/moderation), và
[Sử dụng chấp nhận được](/vi/clawhub/acceptable-usage) để biết chi tiết về chính sách và thực thi.

## Đo từ xa và môi trường

Khi bạn chạy `clawhub install` trong lúc đã đăng nhập, CLI có thể gửi một sự kiện
cài đặt theo nỗ lực tối đa để ClawHub có thể tính tổng số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các override môi trường hữu ích:

| Biến                      | Tác dụng                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL trang web dùng cho đăng nhập qua trình duyệt.     |
| `CLAWHUB_REGISTRY`            | Override URL API registry.                    |
| `CLAWHUB_CONFIG_PATH`         | Override nơi CLI lưu trạng thái token/cấu hình. |
| `CLAWHUB_WORKDIR`             | Override thư mục làm việc mặc định.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt đo từ xa cài đặt.                        |

Xem [Đo từ xa](/clawhub/telemetry), [API HTTP](/clawhub/http-api), và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để biết tài liệu tham chiếu sâu hơn.
