---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt một skill hoặc plugin từ registry
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và xuất bản Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-07-12T07:43:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là một kho đăng ký dành cho Skills và Plugin của OpenClaw.

Sử dụng OpenClaw khi bạn cài đặt nội dung vào OpenClaw. Sử dụng CLI `clawhub`
khi bạn đăng nhập, xuất bản, quản lý các mục niêm yết của mình hoặc sử dụng
các quy trình dành riêng cho kho đăng ký.

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

OpenClaw ghi lại nguồn gốc của Skill để các bản cập nhật sau này có thể tiếp tục
phân giải thông qua ClawHub.

## Tìm và cài đặt một Plugin

Tìm kiếm từ OpenClaw:

```bash
openclaw plugins search "calendar"
```

Cài đặt một Plugin được lưu trữ trên ClawHub với nguồn ClawHub được chỉ định rõ:

```bash
openclaw plugins install clawhub:<package>
```

Cập nhật các Plugin đã cài đặt:

```bash
openclaw plugins update --all
```

Sử dụng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải gói thông qua
ClawHub thay vì npm hoặc một nguồn khác.

## Đăng nhập để xuất bản

Cài đặt CLI ClawHub:

```bash
npm i -g clawhub
# hoặc
pnpm add -g clawhub
```

Đăng nhập bằng GitHub:

```bash
clawhub login
clawhub whoami
```

Các môi trường không có giao diện có thể sử dụng mã thông báo API từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Xuất bản một Skill

Một Skill là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ
tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Lệnh này bỏ qua nội dung không thay đổi. Skills mới bắt đầu ở phiên bản `1.0.0`; các thay đổi
sau đó tự động xuất bản phiên bản vá tiếp theo. Sử dụng `--dry-run` để xem trước hoặc
`--version` để chọn một phiên bản cụ thể.

Trước khi xuất bản, hãy kiểm tra siêu dữ liệu trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu Skill cần
những gì trước khi cài đặt. Xem [Định dạng Skill](/vi/clawhub/skill-format).

Đối với các kho lưu trữ chứa nhiều Skills, quy trình GitHub có thể tái sử dụng sẽ gọi
`skill publish` cho từng thư mục Skill trực tiếp bên dưới `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Xuất bản một Plugin

Xuất bản một Plugin từ thư mục cục bộ, kho lưu trữ GitHub, tham chiếu GitHub hoặc
tệp lưu trữ hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Trước tiên, hãy sử dụng `--dry-run` để xem trước siêu dữ liệu gói đã phân giải, các trường
tương thích, thông tin ghi nhận nguồn và kế hoạch tải lên mà không xuất bản.

Các Plugin mã phải bao gồm siêu dữ liệu tương thích với OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy sử dụng trang web ClawHub hoặc các lệnh chi tiết của CLI để kiểm tra
siêu dữ liệu, liên kết nguồn, phiên bản, nhật ký thay đổi và trạng thái quét:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Các mục niêm yết công khai hiển thị trạng thái quét mới nhất. Các bản phát hành bị giữ lại hoặc bị chặn do
kiểm duyệt có thể bị ẩn khỏi giao diện tìm kiếm và cài đặt cho đến khi được xử lý.
