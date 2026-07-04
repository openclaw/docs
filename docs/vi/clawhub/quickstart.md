---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt kỹ năng hoặc Plugin từ registry
    - Đăng lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và phát hành Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-07-04T10:45:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Khởi động nhanh

ClawHub là một registry cho Skills và Plugin của OpenClaw.

Sử dụng OpenClaw khi bạn cài đặt mọi thứ vào OpenClaw. Sử dụng CLI `clawhub`
khi bạn đăng nhập, phát hành, quản lý các mục niêm yết của riêng mình, hoặc dùng
các quy trình dành riêng cho registry.

## Tìm và cài đặt một Skill

Tìm kiếm từ OpenClaw:

```bash
openclaw skills search "calendar"
```

Cài đặt một Skill:

```bash
openclaw skills install @openclaw/demo
```

Cập nhật các Skills đã cài đặt:

```bash
openclaw skills update --all
```

OpenClaw ghi lại nguồn gốc của Skill để các lần cập nhật sau có thể tiếp tục
phân giải thông qua ClawHub.

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

Sử dụng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải gói thông qua
ClawHub thay vì npm hoặc một nguồn khác.

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

Các môi trường không có giao diện có thể dùng token API từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Phát hành một Skill

Một Skill là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Lệnh này bỏ qua nội dung không thay đổi. Các Skills mới bắt đầu ở `1.0.0`; các
thay đổi sau đó tự động phát hành phiên bản bản vá tiếp theo. Dùng `--dry-run`
để xem trước hoặc `--version` để chọn một phiên bản rõ ràng.

Trước khi phát hành, hãy kiểm tra siêu dữ liệu trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền cần thiết để người dùng có thể hiểu Skill cần
gì trước khi cài đặt. Xem [Định dạng Skill](/vi/clawhub/skill-format).

Đối với các kho chứa nhiều Skills, quy trình GitHub có thể tái sử dụng sẽ gọi
`skill publish` cho từng thư mục Skill trực tiếp bên dưới `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Phát hành một Plugin

Phát hành một Plugin từ thư mục cục bộ, repo GitHub, ref GitHub, hoặc một kho
lưu trữ hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Trước tiên hãy dùng `--dry-run` để xem trước siêu dữ liệu gói đã được phân giải,
các trường tương thích, thông tin nguồn, và kế hoạch tải lên mà không phát hành.

Các Plugin mã phải bao gồm siêu dữ liệu tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để
kiểm tra siêu dữ liệu, liên kết nguồn, phiên bản, nhật ký thay đổi, và trạng thái
quét:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Các mục niêm yết công khai hiển thị trạng thái quét mới nhất. Các bản phát hành
đang bị giữ lại hoặc bị chặn bởi kiểm duyệt có thể bị ẩn khỏi các bề mặt tìm
kiếm và cài đặt cho đến khi được xử lý.
