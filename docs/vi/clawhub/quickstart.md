---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt một kỹ năng hoặc Plugin từ registry
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và phát hành Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-07-04T15:23:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là registry dành cho Skills và Plugin của OpenClaw.

Dùng OpenClaw khi bạn cài đặt các thành phần vào OpenClaw. Dùng CLI `clawhub`
khi bạn đăng nhập, phát hành, quản lý listing của riêng mình hoặc dùng các
quy trình dành riêng cho registry.

## Tìm và cài đặt Skills

Tìm kiếm từ OpenClaw:

```bash
openclaw skills search "calendar"
```

Cài đặt Skills:

```bash
openclaw skills install @openclaw/demo
```

Cập nhật Skills đã cài đặt:

```bash
openclaw skills update --all
```

OpenClaw ghi lại Skills đến từ đâu để các bản cập nhật sau này có thể tiếp tục
phân giải qua ClawHub.

## Tìm và cài đặt Plugin

Tìm kiếm từ OpenClaw:

```bash
openclaw plugins search "calendar"
```

Cài đặt Plugin được lưu trữ trên ClawHub với nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

Cập nhật Plugin đã cài đặt:

```bash
openclaw plugins update --all
```

Dùng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải gói qua
ClawHub thay vì npm hoặc nguồn khác.

## Đăng nhập để phát hành

Cài đặt CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Đăng nhập bằng GitHub:

```bash
clawhub login
clawhub whoami
```

Môi trường không có giao diện có thể dùng API token từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Phát hành Skills

Skills là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Lệnh này bỏ qua nội dung không thay đổi. Skills mới bắt đầu ở `1.0.0`; các thay đổi
sau đó tự động phát hành phiên bản vá tiếp theo. Dùng `--dry-run` để xem trước hoặc
`--version` để chọn phiên bản rõ ràng.

Trước khi phát hành, hãy kiểm tra siêu dữ liệu trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu Skills cần gì
trước khi cài đặt. Xem [Định dạng Skills](/vi/clawhub/skill-format).

Đối với repository chứa nhiều Skills, workflow GitHub có thể tái sử dụng sẽ gọi
`skill publish` cho từng thư mục Skills trực tiếp bên dưới `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Phát hành Plugin

Phát hành Plugin từ một thư mục cục bộ, repo GitHub, ref GitHub hoặc một
archive hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Trước tiên dùng `--dry-run` để xem trước siêu dữ liệu gói đã phân giải, các trường
tương thích, ghi nhận nguồn và kế hoạch tải lên mà không phát hành.

Code plugin phải bao gồm siêu dữ liệu tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để kiểm tra
siêu dữ liệu, liên kết nguồn, phiên bản, changelog và trạng thái quét:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Listing công khai hiển thị trạng thái quét mới nhất. Các bản phát hành bị giữ lại hoặc bị chặn bởi
kiểm duyệt có thể bị ẩn khỏi các bề mặt tìm kiếm và cài đặt cho đến khi được xử lý.
