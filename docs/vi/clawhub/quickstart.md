---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt một kỹ năng hoặc Plugin từ kho đăng ký
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và xuất bản Skills hoặc plugin.'
x-i18n:
    generated_at: "2026-07-03T02:49:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là một registry cho các kỹ năng và plugin của OpenClaw.

Dùng OpenClaw khi bạn đang cài đặt thứ gì đó vào OpenClaw. Dùng CLI `clawhub`
khi bạn đăng nhập, phát hành, quản lý các listing của riêng mình hoặc dùng
các quy trình làm việc dành riêng cho registry.

## Tìm và cài đặt kỹ năng

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

## Tìm và cài đặt plugin

Tìm kiếm từ OpenClaw:

```bash
openclaw plugins search "calendar"
```

Cài đặt một plugin được ClawHub lưu trữ bằng nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

Cập nhật các plugin đã cài đặt:

```bash
openclaw plugins update --all
```

Dùng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải gói qua
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

## Phát hành kỹ năng

Một kỹ năng là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ
tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Lệnh này bỏ qua nội dung không thay đổi. Kỹ năng mới bắt đầu ở `1.0.0`; các thay đổi sau
tự động phát hành phiên bản vá tiếp theo. Dùng `--dry-run` để xem trước hoặc
`--version` để chọn một phiên bản rõ ràng.

Trước khi phát hành, hãy kiểm tra metadata trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu kỹ năng
cần gì trước khi cài đặt. Xem [Định dạng kỹ năng](/vi/clawhub/skill-format).

Đối với các repository chứa nhiều kỹ năng, quy trình làm việc GitHub có thể tái sử dụng gọi
`skill publish` cho từng thư mục kỹ năng trực tiếp bên dưới `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Phát hành plugin

Phát hành một plugin từ thư mục cục bộ, repository GitHub, ref GitHub hoặc một
archive hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng `--dry-run` trước để xem trước metadata gói đã phân giải, các trường tương thích,
thông tin ghi nhận nguồn và kế hoạch tải lên mà không phát hành.

Các plugin mã phải bao gồm metadata tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để kiểm tra
metadata, liên kết nguồn, phiên bản, changelog và trạng thái quét:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Các listing công khai hiển thị trạng thái quét mới nhất. Các bản phát hành bị giữ lại hoặc bị chặn bởi
kiểm duyệt có thể bị ẩn khỏi các bề mặt tìm kiếm và cài đặt cho đến khi được giải quyết.
