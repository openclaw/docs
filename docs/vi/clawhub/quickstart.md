---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt skill hoặc plugin từ registry
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và xuất bản skills hoặc plugins.'
x-i18n:
    generated_at: "2026-07-01T15:26:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là registry cho các kỹ năng và Plugin của OpenClaw.

Dùng OpenClaw khi bạn đang cài đặt nội dung vào OpenClaw. Dùng CLI `clawhub`
khi bạn đăng nhập, xuất bản, quản lý các listing của riêng mình, hoặc dùng
các quy trình làm việc riêng cho registry.

## Tìm và cài đặt một kỹ năng

Tìm kiếm từ OpenClaw:

```bash
openclaw skills search "calendar"
```

Cài đặt một kỹ năng:

```bash
openclaw skills install @openclaw/demo
```

Cập nhật các kỹ năng đã cài đặt:

```bash
openclaw skills update --all
```

OpenClaw ghi lại kỹ năng đến từ đâu để các bản cập nhật sau này có thể tiếp tục
phân giải qua ClawHub.

## Tìm và cài đặt một Plugin

Tìm kiếm từ OpenClaw:

```bash
openclaw plugins search "calendar"
```

Cài đặt một Plugin được lưu trữ trên ClawHub với nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

Cập nhật các Plugin đã cài đặt:

```bash
openclaw plugins update --all
```

Dùng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải package qua
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

Các môi trường không giao diện có thể dùng API token từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Xuất bản một kỹ năng

Một kỹ năng là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ
tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Lệnh này bỏ qua nội dung không thay đổi. Các kỹ năng mới bắt đầu ở `1.0.0`; các thay đổi sau đó
tự động xuất bản phiên bản patch tiếp theo. Dùng `--dry-run` để xem trước hoặc
`--version` để chọn một phiên bản rõ ràng.

Trước khi xuất bản, hãy kiểm tra metadata trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu kỹ năng
cần gì trước khi cài đặt. Xem [Định dạng kỹ năng](/vi/clawhub/skill-format).

Đối với các repository chứa nhiều kỹ năng, workflow GitHub có thể tái sử dụng sẽ gọi
`skill publish` cho từng thư mục kỹ năng trực tiếp bên dưới `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Xuất bản một Plugin

Xuất bản một Plugin từ thư mục cục bộ, repo GitHub, ref GitHub, hoặc một
archive hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng `--dry-run` trước để xem trước metadata package đã phân giải, các trường
tương thích, thông tin ghi nhận nguồn, và kế hoạch tải lên mà không xuất bản.

Code Plugin phải bao gồm metadata tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để kiểm tra
metadata, liên kết nguồn, phiên bản, changelog, và trạng thái quét:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Các listing công khai hiển thị trạng thái quét mới nhất. Các bản phát hành bị giữ lại hoặc bị chặn bởi
moderation có thể bị ẩn khỏi bề mặt tìm kiếm và cài đặt cho đến khi được xử lý.
