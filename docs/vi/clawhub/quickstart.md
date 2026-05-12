---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt một kỹ năng hoặc Plugin từ registry
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và xuất bản Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-05-12T12:49:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Khởi động nhanh

ClawHub là một registry cho các kỹ năng và Plugin của OpenClaw.

Dùng OpenClaw khi bạn cài đặt các thứ vào OpenClaw. Dùng CLI `clawhub`
khi bạn đăng nhập, xuất bản, quản lý các listing của riêng mình, hoặc dùng
các workflow riêng của registry.

## Tìm và cài đặt một kỹ năng

Tìm kiếm từ OpenClaw:

```bash
openclaw skills search "calendar"
```

Cài đặt một kỹ năng:

```bash
openclaw skills install <skill-slug>
```

Cập nhật các kỹ năng đã cài đặt:

```bash
openclaw skills update --all
```

OpenClaw ghi lại kỹ năng đến từ đâu để các bản cập nhật sau này có thể tiếp tục
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

Dùng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải package thông qua
ClawHub thay vì npm hoặc nguồn khác.

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

Các môi trường headless có thể dùng token API từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Xuất bản một kỹ năng

Một kỹ năng là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Trước khi xuất bản, hãy kiểm tra metadata trong `SKILL.md`. Khai báo các biến
môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu kỹ năng cần gì
trước khi cài đặt. Xem [Định dạng kỹ năng](/vi/clawhub/skill-format).

## Xuất bản một Plugin

Xuất bản một Plugin từ thư mục cục bộ, repo GitHub, ref GitHub, hoặc một archive
hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng `--dry-run` trước để xem trước metadata package đã phân giải, các trường
tương thích, quy kết nguồn và kế hoạch upload mà không xuất bản.

Các code Plugin phải bao gồm metadata tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Đồng bộ các kỹ năng bạn duy trì

`sync` quét các thư mục kỹ năng và xuất bản các kỹ năng mới hoặc đã thay đổi
chưa được đồng bộ hóa.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Khi bạn đã đăng nhập, `sync` cũng có thể gửi một snapshot cài đặt tối thiểu để
tổng hợp số lượt cài đặt. Xem [Telemetry](/vi/clawhub/telemetry) để biết những gì
được báo cáo và cách từ chối tham gia.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để
kiểm tra metadata, liên kết nguồn, phiên bản, changelog và trạng thái quét:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Các listing công khai hiển thị trạng thái quét mới nhất. Các bản phát hành bị
giữ lại hoặc bị chặn bởi moderation có thể bị ẩn khỏi bề mặt tìm kiếm và cài đặt
cho đến khi được xử lý.
