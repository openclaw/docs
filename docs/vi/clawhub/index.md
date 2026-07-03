---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hay plugins
    - Xuất bản Skills hoặc Plugin lên registry
    - Chọn giữa các luồng CLI của openclaw và clawhub
sidebarTitle: ClawHub
summary: Tổng quan ClawHub công khai dành cho việc khám phá, cài đặt, phát hành, bảo mật và CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T13:37:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai cho Skills và plugin của OpenClaw.

- Dùng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt plugin từ ClawHub.
- Dùng CLI `clawhub` riêng cho các workflow xác thực registry, xuất bản và xóa/khôi phục xóa.

Trang: [clawhub.ai](https://clawhub.ai)

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

Cài đặt ClawHub CLI khi bạn cần các workflow có xác thực registry như
xuất bản hoặc xóa/khôi phục xóa:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub lưu trữ những gì

| Bề mặt        | Nội dung lưu trữ                                             | Lệnh thường dùng                            |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` và tệp hỗ trợ    | `openclaw skills install @openclaw/demo`     |
| Plugin mã      | Các gói plugin OpenClaw với metadata tương thích             | `openclaw plugins install clawhub:<package>` |
| Plugin bundle  | Các bundle plugin đóng gói cho bản phân phối OpenClaw        | `clawhub package publish <source>`           |

ClawHub theo dõi các phiên bản semver, tag như `latest`, changelog, tệp,
lượt tải xuống, sao và tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái registry hiện tại
để người dùng có thể kiểm tra một skill hoặc plugin trước khi cài đặt.

## Luồng OpenClaw gốc

Các lệnh OpenClaw gốc cài đặt vào workspace OpenClaw đang hoạt động và lưu metadata
nguồn để các lệnh cập nhật sau này có thể tiếp tục dùng ClawHub.

Dùng `clawhub:<package>` khi một lượt cài đặt plugin cần phân giải qua ClawHub.
Các spec plugin thuần tương thích npm có thể phân giải qua npm trong các giai đoạn chuyển đổi ra mắt, và
`npm:<package>` vẫn chỉ dùng npm khi nguồn cần được chỉ định rõ.

Cài đặt plugin xác thực tính tương thích của `pluginApi` và `minGatewayVersion`
được công bố trước khi cài đặt archive chạy. Khi một phiên bản gói xuất bản artifact
ClawPack, OpenClaw ưu tiên `.tgz` npm-pack đã tải lên chính xác, xác minh
header digest ClawHub và byte đã tải xuống, rồi ghi metadata artifact cho
các lần cập nhật sau.

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
```

CLI cũng có các lệnh cài đặt/cập nhật skill cho workflow registry trực tiếp:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Các lệnh đó cài đặt Skills vào `./skills` dưới thư mục làm việc hiện tại
và ghi các phiên bản đã cài đặt trong `.clawhub/lock.json`.

## Xuất bản

Xuất bản Skills từ một thư mục cục bộ chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn xuất bản thường dùng:

- `--slug <slug>`: tên URL của skill đã xuất bản.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: văn bản changelog.
- `--tags <tags>`: các tag phân tách bằng dấu phẩy, mặc định là `latest`.

Xuất bản plugin từ một thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc URL
GitHub:

```bash
clawhub package publish <source>
```

Dùng `--dry-run` để dựng kế hoạch xuất bản chính xác mà không tải lên, và `--json`
cho đầu ra thân thiện với CI.

Plugin mã phải bao gồm metadata tương thích OpenClaw bắt buộc trong
`package.json`, gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để biết tham chiếu lệnh
đầy đủ và [Định dạng skill](/clawhub/skill-format) để biết metadata skill.

## Bảo mật và kiểm duyệt

ClawHub mở theo mặc định: bất kỳ ai cũng có thể tải lên, nhưng việc xuất bản yêu cầu tài khoản GitHub
đủ cũ để vượt qua cổng tải lên. Các trang chi tiết công khai tóm tắt
trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub chạy kiểm tra tự động trên Skills và bản phát hành plugin đã xuất bản. Các bản phát hành bị giữ lại do quét
hoặc bị chặn có thể biến mất khỏi catalog công khai và bề mặt cài đặt trong khi
vẫn hiển thị với chủ sở hữu của chúng trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo Skills và gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung, và cấm tài khoản lạm dụng. Xem
[Bảo mật](/vi/clawhub/security),
[Kiểm toán bảo mật](/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/clawhub/moderation), và
[Mức sử dụng chấp nhận được](/clawhub/acceptable-usage) để biết chi tiết về chính sách và thực thi.

## Telemetry và môi trường

Khi bạn chạy `clawhub install` trong lúc đã đăng nhập, CLI có thể gửi một sự kiện
cài đặt theo nỗ lực tối đa để ClawHub có thể tính tổng số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các override môi trường hữu ích:

| Biến                          | Hiệu lực                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang dùng cho đăng nhập bằng trình duyệt. |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                          |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu trạng thái token/config.       |
| `CLAWHUB_WORKDIR`             | Ghi đè thư mục làm việc mặc định.                 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry cài đặt.                            |

Xem [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), và
[Khắc phục sự cố](/vi/clawhub/troubleshooting) để biết tài liệu tham chiếu sâu hơn.
