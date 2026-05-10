---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt một kỹ năng hoặc Plugin từ kho đăng ký
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và xuất bản Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-05-10T19:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là một registry cho Skills và plugin của OpenClaw.

Sử dụng OpenClaw khi bạn cài đặt nội dung vào OpenClaw. Sử dụng CLI `clawhub`
khi bạn đăng nhập, xuất bản, quản lý các listing của riêng mình hoặc dùng
các quy trình làm việc riêng của registry.

## Tìm và cài đặt một skill

Tìm kiếm từ OpenClaw:

```bash
openclaw skills search "calendar"
```

Cài đặt một skill:

```bash
openclaw skills install <skill-slug>
```

Cập nhật các skill đã cài đặt:

```bash
openclaw skills update --all
```

OpenClaw ghi lại skill đến từ đâu để các bản cập nhật sau này có thể tiếp tục
được phân giải qua ClawHub.

## Tìm và cài đặt một plugin

Tìm kiếm từ OpenClaw:

```bash
openclaw plugins search "calendar"
```

Cài đặt một plugin được lưu trữ trên ClawHub với nguồn ClawHub tường minh:

```bash
openclaw plugins install clawhub:<package>
```

Cập nhật các plugin đã cài đặt:

```bash
openclaw plugins update --all
```

Sử dụng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải gói qua
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

Các môi trường không có giao diện có thể dùng token API từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Xuất bản một skill

Skill là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Trước khi xuất bản, hãy kiểm tra siêu dữ liệu trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu skill cần
gì trước khi họ cài đặt. Xem [Định dạng skill](/vi/clawhub/skill-format).

## Xuất bản một plugin

Xuất bản một plugin từ thư mục cục bộ, repo GitHub, ref GitHub hoặc một
archive hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng `--dry-run` trước để xem trước siêu dữ liệu gói đã phân giải, các trường
tương thích, thông tin ghi nhận nguồn và kế hoạch tải lên mà không xuất bản.

Code plugin phải bao gồm siêu dữ liệu tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Đồng bộ các skill bạn duy trì

`sync` quét các thư mục skill và xuất bản skill mới hoặc đã thay đổi chưa
được đồng bộ.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Khi bạn đã đăng nhập, `sync` cũng có thể gửi một bản chụp cài đặt tối thiểu để
tổng hợp số lượt cài đặt. Xem [Telemetry](/vi/clawhub/telemetry) để biết những gì
được báo cáo và cách chọn không tham gia.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để
kiểm tra siêu dữ liệu, liên kết nguồn, phiên bản, changelog và trạng thái quét:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Các listing công khai hiển thị trạng thái quét mới nhất. Những bản phát hành bị
giữ lại hoặc bị chặn bởi kiểm duyệt có thể bị ẩn khỏi các bề mặt tìm kiếm và
cài đặt cho đến khi được xử lý.
