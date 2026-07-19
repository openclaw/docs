---
read_when:
    - Giải thích ClawHub là gì
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hay Plugin
    - Phát hành Skills hoặc Plugin lên registry
    - Lựa chọn giữa các luồng CLI của OpenClaw và ClawHub
sidebarTitle: ClawHub
summary: Tổng quan công khai về ClawHub để khám phá, cài đặt, xuất bản, bảo mật và CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-19T05:39:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub là registry công khai dành cho Skills và Plugin của OpenClaw.

- Sử dụng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt Plugin từ ClawHub.
- Sử dụng CLI `clawhub` riêng cho việc xác thực với registry, phát hành và các quy trình xóa/khôi phục.

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

Cài đặt CLI ClawHub khi cần các quy trình đã xác thực với registry, chẳng hạn như
phát hành hoặc xóa/khôi phục:

```bash
npm i -g clawhub
# hoặc
pnpm add -g clawhub
```

## Nội dung ClawHub lưu trữ

| Bề mặt        | Nội dung lưu trữ                                               | Lệnh thường dùng                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Các gói văn bản có phiên bản với `SKILL.md` cùng các tệp hỗ trợ | `openclaw skills install @openclaw/demo`     |
| Plugin mã nguồn   | Các gói Plugin OpenClaw có siêu dữ liệu tương thích         | `openclaw plugins install clawhub:<package>` |
| Plugin dạng gói | Các gói Plugin được đóng gói để phân phối cùng OpenClaw            | `clawhub package publish <source>`           |

ClawHub theo dõi các phiên bản semver, thẻ như `latest`, nhật ký thay đổi, tệp,
lượt tải xuống, lượt đánh dấu sao và bản tóm tắt quét bảo mật. Các trang công khai hiển thị trạng thái
registry hiện tại để người dùng có thể kiểm tra một Skill hoặc Plugin trước khi cài đặt.

## Luồng OpenClaw gốc

Các lệnh OpenClaw gốc cài đặt vào không gian làm việc OpenClaw đang hoạt động và lưu giữ
siêu dữ liệu nguồn để các lệnh cập nhật sau này có thể tiếp tục sử dụng ClawHub.

Sử dụng `clawhub:<package>` khi việc cài đặt Plugin cần được phân giải qua ClawHub.
Các đặc tả Plugin thuần túy, an toàn với npm có thể được phân giải qua npm trong giai đoạn chuyển đổi khi ra mắt, còn
`npm:<package>` vẫn chỉ dùng npm khi nguồn phải được chỉ định rõ ràng.

Quá trình cài đặt Plugin xác thực khả năng tương thích `pluginApi` và `minGatewayVersion`
được công bố trước khi tiến hành cài đặt kho lưu trữ. Khi một phiên bản gói phát hành một
artifact ClawPack, OpenClaw ưu tiên npm-pack `.tgz` chính xác đã tải lên, xác minh
tiêu đề digest ClawHub và các byte đã tải xuống, đồng thời ghi lại siêu dữ liệu artifact cho
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

CLI cũng có các lệnh cài đặt/cập nhật Skill dành cho quy trình làm việc trực tiếp với registry:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Các lệnh đó cài đặt Skills vào `./skills` trong thư mục làm việc hiện tại
và ghi lại các phiên bản đã cài đặt trong `.clawhub/lock.json`.

## Phát hành

Phát hành Skills từ thư mục cục bộ có chứa `SKILL.md`:

```bash
clawhub skill publish <path>
```

Các tùy chọn phát hành thường dùng:

- `--slug <slug>`: tên URL của Skill đã phát hành.
- `--name <name>`: tên hiển thị.
- `--version <version>`: phiên bản semver.
- `--changelog <text>`: nội dung nhật ký thay đổi.
- `--tags <tags>`: các thẻ phân tách bằng dấu phẩy, mặc định là `latest`.

Phát hành Plugin từ thư mục cục bộ, `owner/repo`, `owner/repo@ref` hoặc URL
GitHub:

```bash
clawhub package publish <source>
```

Sử dụng `--dry-run` để tạo kế hoạch phát hành chính xác mà không tải lên và `--json`
để tạo đầu ra thân thiện với CI.

Plugin mã nguồn phải bao gồm siêu dữ liệu tương thích OpenClaw bắt buộc trong
`package.json`, bao gồm `openclaw.compat.pluginApi` và
`openclaw.build.openclawVersion`. Xem [CLI](/vi/clawhub/cli) để tham khảo đầy đủ các lệnh
và [Định dạng Skill](/vi/clawhub/skill-format) để biết siêu dữ liệu Skill.

## Bảo mật và kiểm duyệt

ClawHub mặc định là mở: bất kỳ ai cũng có thể tải lên, nhưng việc phát hành yêu cầu một tài khoản
GitHub đủ lâu để vượt qua cổng kiểm tra tải lên. Các trang chi tiết công khai tóm tắt
trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống.

ClawHub thực hiện các kiểm tra tự động đối với Skills và các bản phát hành Plugin đã xuất bản. Những bản phát hành
bị giữ lại để quét hoặc bị chặn có thể biến mất khỏi danh mục công khai và các bề mặt cài đặt, trong khi
vẫn hiển thị với chủ sở hữu trong `/dashboard`.

Người dùng đã đăng nhập có thể báo cáo Skills và các gói. Người kiểm duyệt có thể xem xét báo cáo,
ẩn hoặc khôi phục nội dung và cấm các tài khoản lạm dụng. Xem
[Bảo mật](/clawhub/security),
[Kiểm tra bảo mật](/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/clawhub/moderation) và
[Quy định sử dụng được chấp nhận](/clawhub/acceptable-usage) để biết chi tiết về chính sách và việc thực thi.

## Dữ liệu đo từ xa và môi trường

Khi bạn chạy `clawhub install` trong lúc đã đăng nhập, CLI có thể gửi một sự kiện
cài đặt theo nỗ lực tối đa để ClawHub có thể tính toán tổng số lượt cài đặt. Tắt tính năng này bằng:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Các biến ghi đè môi trường hữu ích:

| Biến                      | Tác dụng                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang web dùng để đăng nhập qua trình duyệt.     |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                    |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè vị trí CLI lưu trạng thái token/cấu hình. |
| `CLAWHUB_WORKDIR`             | Ghi đè thư mục làm việc mặc định.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt dữ liệu đo từ xa về lượt cài đặt.                        |

Xem [Dữ liệu đo từ xa](/clawhub/telemetry), [API HTTP](/clawhub/http-api) và
[Khắc phục sự cố](/clawhub/troubleshooting) để biết tài liệu tham khảo chuyên sâu hơn.
