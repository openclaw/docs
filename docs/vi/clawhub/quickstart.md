---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt Skills hoặc Plugin từ kho đăng ký
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và xuất bản Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-06-27T17:15:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là một registry cho các kỹ năng và plugin của OpenClaw.

Sử dụng OpenClaw khi bạn cài đặt nội dung vào OpenClaw. Sử dụng CLI `clawhub`
khi bạn đăng nhập, xuất bản, quản lý danh sách của riêng mình hoặc dùng các
quy trình dành riêng cho registry.

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

OpenClaw ghi lại kỹ năng đến từ đâu để các lần cập nhật sau có thể tiếp tục
phân giải thông qua ClawHub.

## Tìm và cài đặt một plugin

Tìm kiếm từ OpenClaw:

```bash
openclaw plugins search "calendar"
```

Cài đặt một plugin được lưu trữ trên ClawHub bằng nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

Cập nhật các plugin đã cài đặt:

```bash
openclaw plugins update --all
```

Sử dụng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải gói thông qua
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

Môi trường không giao diện có thể sử dụng token API từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Xuất bản một kỹ năng

Một kỹ năng là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Lệnh này bỏ qua nội dung không thay đổi. Kỹ năng mới bắt đầu ở `1.0.0`; các thay đổi sau đó
tự động xuất bản phiên bản patch tiếp theo. Sử dụng `--dry-run` để xem trước hoặc
`--version` để chọn một phiên bản rõ ràng.

Trước khi xuất bản, hãy kiểm tra siêu dữ liệu trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng hiểu kỹ năng cần gì
trước khi họ cài đặt. Xem [Định dạng kỹ năng](/vi/clawhub/skill-format).

Với các repository chứa nhiều kỹ năng, workflow GitHub có thể tái sử dụng sẽ gọi
`skill publish` cho từng thư mục kỹ năng trực tiếp bên dưới `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Xuất bản một plugin

Xuất bản một plugin từ thư mục cục bộ, repo GitHub, ref GitHub hoặc một kho lưu trữ
hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Trước tiên hãy dùng `--dry-run` để xem trước siêu dữ liệu gói đã phân giải, các
trường tương thích, ghi nhận nguồn và kế hoạch tải lên mà không xuất bản.

Plugin mã phải bao gồm siêu dữ liệu tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để kiểm tra
siêu dữ liệu, liên kết nguồn, phiên bản, nhật ký thay đổi và trạng thái quét:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Các danh sách công khai hiển thị trạng thái quét mới nhất. Những bản phát hành bị giữ lại hoặc bị chặn bởi
kiểm duyệt có thể bị ẩn khỏi các bề mặt tìm kiếm và cài đặt cho đến khi được giải quyết.
