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
    generated_at: "2026-05-11T22:19:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai cho Skills và plugins của OpenClaw.

- Sử dụng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills cũng như cài đặt plugins từ ClawHub.
- Sử dụng CLI `clawhub` riêng cho các quy trình xác thực registry, xuất bản, xóa/khôi phục xóa và đồng bộ hóa.

Trang: [clawhub.ai](https://clawhub.ai)

## Bắt đầu nhanh

Tìm kiếm và cài đặt Skills bằng OpenClaw:

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

Cài đặt ClawHub CLI khi bạn muốn các quy trình đã xác thực với registry như
xuất bản, đồng bộ hóa hoặc xóa/khôi phục xóa:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ những gì

| Bề mặt        | Nội dung lưu trữ                                               | Lệnh thường dùng                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` cùng các tệp hỗ trợ | `openclaw skills install <slug>`             |
| Plugin mã   | Các gói Plugin OpenClaw với metadata tương thích         | `openclaw plugins install clawhub:<package>` |
| Plugin bundle | Các bundle Plugin được đóng gói để phân phối OpenClaw            | `clawhub package publish <source>`           |
| Souls          | Các bundle `SOUL.md` hiển thị trên onlycrabs.ai                      | Quy trình xuất bản qua Web và API                    |

ClawHub theo dõi các phiên bản semver, thẻ như `latest`, nhật ký thay đổi, tệp,
lượt tải xuống, sao và tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái registry
hiện tại để người dùng có thể kiểm tra một skill hoặc Plugin trước khi cài đặt.

## Quy trình OpenClaw gốc

Các lệnh OpenClaw gốc cài đặt vào workspace OpenClaw đang hoạt động và lưu giữ
metadata nguồn để các lệnh cập nhật sau này có thể tiếp tục dùng ClawHub.

Dùng `clawhub:<package>` khi một cài đặt Plugin cần được phân giải qua ClawHub.
Các spec Plugin trần an toàn với npm có thể được phân giải qua npm trong các giai đoạn chuyển đổi khi phát hành, và
`npm:<package>` vẫn chỉ dùng npm khi nguồn phải được chỉ định rõ ràng.

Cài đặt Plugin xác thực khả năng tương thích `pluginApi` và `minGatewayVersion`
đã công bố trước khi quá trình cài đặt archive chạy. Khi một phiên bản gói xuất bản
artifact ClawPack, OpenClaw ưu tiên `.tgz` npm-pack đã tải lên chính xác đó, xác minh
header digest của ClawHub và các byte đã tải xuống, rồi ghi lại metadata artifact cho
các lần cập nhật sau.

## ClawHub CLI

ClawHub CLI dùng cho công việc đã xác thực với registry:

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

Các lệnh đó cài đặt Skills vào `./skills` trong thư mục làm việc hiện tại
và ghi lại các phiên bản đã cài đặt trong `.clawhub/lock.json`.

## Xuất bản

Xuất bản Skills từ một thư mục cục bộ chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn xuất bản phổ biến:

- `--slug <slug>`: slug của skill.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: văn bản nhật ký thay đổi.
- `--tags <tags>`: các thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Xuất bản plugins từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc một URL GitHub:

```bash
clawhub package publish <source>
```

Dùng `--dry-run` để tạo kế hoạch xuất bản chính xác mà không tải lên, và `--json`
để có đầu ra thân thiện với CI.

Plugin mã phải bao gồm metadata tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết tham chiếu lệnh
đầy đủ và [Định dạng skill](/vi/clawhub/skill-format) để biết metadata skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định mở: bất kỳ ai cũng có thể tải lên, nhưng việc xuất bản yêu cầu một tài khoản GitHub
đủ lâu đời để vượt qua cổng tải lên. Các trang chi tiết công khai tóm tắt trạng thái quét
mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy các kiểm tra tự động trên Skills đã xuất bản và các bản phát hành Plugin. Các bản phát hành bị giữ lại do quét
hoặc bị chặn có thể biến mất khỏi catalog công khai và các bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu của chúng trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo Skills và các gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung, và cấm các tài khoản lạm dụng. Xem
[Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage) và
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
| `CLAWHUB_SITE`                | Ghi đè URL trang được dùng cho đăng nhập bằng trình duyệt.     |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                    |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu trạng thái token/cấu hình. |
| `CLAWHUB_WORKDIR`             | Ghi đè thư mục làm việc mặc định.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry trên `sync`.                      |

Xem [Telemetry](/vi/clawhub/telemetry), [HTTP API](/vi/clawhub/http-api), và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để biết tài liệu tham chiếu sâu hơn.
