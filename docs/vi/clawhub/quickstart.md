---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt skill hoặc plugin từ registry
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và phát hành Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-07-02T08:27:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là một registry cho Skills và Plugin của OpenClaw.

Sử dụng OpenClaw khi bạn đang cài đặt nội dung vào OpenClaw. Sử dụng CLI `clawhub`
khi bạn đăng nhập, xuất bản, quản lý các listing của riêng mình, hoặc dùng
các workflow dành riêng cho registry.

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

OpenClaw ghi lại Skills đó đến từ đâu để các bản cập nhật sau này có thể tiếp tục
resolve qua ClawHub.

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

Sử dụng tiền tố `clawhub:` khi bạn muốn OpenClaw resolve package thông qua
ClawHub thay vì npm hoặc một nguồn khác.

## Đăng nhập để xuất bản

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

Môi trường headless có thể dùng API token từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Xuất bản Skills

Skills là một thư mục có tệp bắt buộc `SKILL.md` và các tệp hỗ trợ
tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Lệnh này bỏ qua nội dung không thay đổi. Skills mới bắt đầu ở `1.0.0`; các thay đổi
sau đó tự động xuất bản phiên bản patch tiếp theo. Sử dụng `--dry-run` để xem trước hoặc
`--version` để chọn một phiên bản rõ ràng.

Trước khi xuất bản, hãy kiểm tra metadata trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu Skills cần gì
trước khi họ cài đặt. Xem [Định dạng Skills](/vi/clawhub/skill-format).

Đối với repository chứa nhiều Skills, workflow GitHub có thể tái sử dụng sẽ gọi
`skill publish` cho từng thư mục Skills trực tiếp bên dưới `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Xuất bản Plugin

Xuất bản Plugin từ một thư mục cục bộ, một repository GitHub, một GitHub ref, hoặc một
archive hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Trước tiên hãy dùng `--dry-run` để xem trước metadata package đã resolve, các trường
compatibility, attribution nguồn và kế hoạch upload mà không xuất bản.

Code Plugin phải bao gồm metadata compatibility OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để kiểm tra
metadata, liên kết nguồn, phiên bản, changelog và trạng thái scan:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Các listing công khai hiển thị trạng thái scan mới nhất. Những release bị giữ lại hoặc bị chặn bởi
moderation có thể bị ẩn khỏi các bề mặt tìm kiếm và cài đặt cho đến khi được xử lý.
