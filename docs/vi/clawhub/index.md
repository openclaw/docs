---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc Plugin
    - Xuất bản Skills hoặc Plugin lên kho đăng ký
    - Lựa chọn giữa các quy trình CLI của openclaw và clawhub
sidebarTitle: ClawHub
summary: Tổng quan công khai về ClawHub để khám phá, cài đặt, xuất bản, bảo mật và CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T00:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai cho OpenClaw skills và plugins.

- Dùng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật skills, cũng như cài đặt plugins từ ClawHub.
- Dùng CLI `clawhub` riêng cho các quy trình xác thực registry, phát hành, xóa/khôi phục xóa và đồng bộ.

Trang: [clawhub.ai](https://clawhub.ai)

## Bắt đầu nhanh

Tìm kiếm và cài đặt skills bằng OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Tìm kiếm và cài đặt plugins bằng OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Cài đặt ClawHub CLI khi bạn muốn các quy trình có xác thực registry như
phát hành, đồng bộ hoặc xóa/khôi phục xóa:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ gì

| Bề mặt        | Nội dung lưu trữ                                             | Lệnh thường dùng                            |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Gói văn bản có phiên bản với `SKILL.md` cùng các tệp hỗ trợ | `openclaw skills install <slug>`             |
| Code plugins   | Các gói Plugin OpenClaw với metadata tương thích             | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | Các gói Plugin đã đóng gói để phân phối OpenClaw             | `clawhub package publish <source>`           |
| Souls          | Các gói `SOUL.md` hiển thị trên onlycrabs.ai                 | Luồng phát hành Web và API                   |

ClawHub theo dõi các phiên bản semver, thẻ như `latest`, changelog, tệp,
lượt tải xuống, sao và tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái registry
hiện tại để người dùng có thể kiểm tra một skill hoặc Plugin trước khi cài đặt.

## Luồng OpenClaw gốc

Các lệnh OpenClaw gốc cài đặt vào workspace OpenClaw đang hoạt động và lưu
metadata nguồn để các lệnh cập nhật sau này có thể tiếp tục dùng ClawHub.

Dùng `clawhub:<package>` khi một bản cài đặt Plugin cần được phân giải qua ClawHub.
Các spec Plugin trần an toàn cho npm có thể được phân giải qua npm trong quá trình chuyển đổi khi ra mắt, và
`npm:<package>` vẫn chỉ dùng npm khi cần nêu rõ nguồn.

Các bản cài đặt Plugin xác thực khả năng tương thích `pluginApi` và `minGatewayVersion`
được công bố trước khi chạy cài đặt archive. Khi một phiên bản gói phát hành artifact
ClawPack, OpenClaw ưu tiên tệp `.tgz` npm-pack đã tải lên chính xác, xác minh
header digest ClawHub và byte đã tải xuống, rồi ghi metadata artifact cho
các lần cập nhật sau.

## ClawHub CLI

ClawHub CLI dành cho công việc có xác thực registry:

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

CLI cũng có các lệnh cài đặt/cập nhật skill cho quy trình registry trực tiếp:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Các lệnh đó cài đặt skills vào `./skills` dưới thư mục làm việc hiện tại
và ghi các phiên bản đã cài đặt trong `.clawhub/lock.json`.

## Phát hành

Phát hành skills từ một thư mục cục bộ chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn phát hành thường dùng:

- `--slug <slug>`: slug của skill.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: văn bản changelog.
- `--tags <tags>`: các thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Phát hành plugins từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref` hoặc URL GitHub:

```bash
clawhub package publish <source>
```

Dùng `--dry-run` để xây dựng kế hoạch phát hành chính xác mà không tải lên, và `--json`
để có đầu ra thân thiện với CI.

Code plugins phải bao gồm metadata tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết tham chiếu lệnh
đầy đủ và [Định dạng skill](/vi/clawhub/skill-format) để biết metadata skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định là mở: bất kỳ ai cũng có thể tải lên, nhưng việc phát hành yêu cầu một tài khoản GitHub
đủ lâu đời để vượt qua cổng tải lên. Các trang chi tiết công khai tóm tắt
trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy kiểm tra tự động trên các skills và bản phát hành Plugin đã phát hành. Các bản phát hành
bị giữ do quét hoặc bị chặn có thể biến mất khỏi catalog công khai và bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo skills và gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung và cấm các tài khoản lạm dụng. Xem
[Chính sách sử dụng chấp nhận được](/vi/clawhub/acceptable-usage) và
[Bảo mật + kiểm duyệt](/vi/clawhub/security) để biết chi tiết về chính sách và thực thi.

## Telemetry và môi trường

Khi bạn chạy `clawhub sync` trong lúc đã đăng nhập, CLI gửi một snapshot tối thiểu để
ClawHub có thể tính số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các override môi trường hữu ích:

| Biến                          | Tác dụng                                          |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang dùng cho đăng nhập bằng trình duyệt. |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                          |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu trạng thái token/config.       |
| `CLAWHUB_WORKDIR`             | Ghi đè thư mục làm việc mặc định.                 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry trên `sync`.                        |

Xem [Telemetry](/vi/clawhub/telemetry), [HTTP API](/vi/clawhub/http-api) và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để biết tài liệu tham chiếu sâu hơn.
