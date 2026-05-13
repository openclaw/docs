---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt Skills hoặc Plugin từ kho đăng ký
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và xuất bản Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-05-13T04:18:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là một registry dành cho Skills và Plugin của OpenClaw.

Dùng OpenClaw khi bạn cài đặt nội dung vào OpenClaw. Dùng CLI `clawhub`
khi bạn đăng nhập, phát hành, quản lý listing của riêng mình, hoặc dùng
các workflow dành riêng cho registry.

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
phân giải thông qua ClawHub.

## Tìm và cài đặt một Plugin

Tìm kiếm từ OpenClaw:

```bash
openclaw plugins search "calendar"
```

Cài đặt một Plugin được lưu trữ trên ClawHub bằng nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

Cập nhật các Plugin đã cài đặt:

```bash
openclaw plugins update --all
```

Dùng tiền tố `clawhub:` khi bạn muốn OpenClaw phân giải package thông qua
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

Các môi trường không có giao diện có thể dùng API token từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Phát hành một skill

Một skill là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ
tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Trước khi phát hành, hãy kiểm tra metadata trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu skill
cần gì trước khi cài đặt. Xem [Định dạng skill](/vi/clawhub/skill-format).

## Phát hành một Plugin

Phát hành một Plugin từ thư mục cục bộ, repo GitHub, ref GitHub, hoặc một
archive hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng `--dry-run` trước để xem trước metadata package đã phân giải, các trường
tương thích, ghi nhận nguồn và kế hoạch tải lên mà không phát hành.

Code Plugin phải bao gồm metadata tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Đồng bộ các skill bạn duy trì

`sync` quét các thư mục skill và phát hành skill mới hoặc đã thay đổi chưa
được đồng bộ.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Khi bạn đã đăng nhập, `sync` cũng có thể gửi một ảnh chụp cài đặt tối thiểu để
tổng hợp số lượt cài đặt. Xem [Telemetry](/vi/clawhub/telemetry) để biết những gì
được báo cáo và cách chọn không tham gia.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để
kiểm tra metadata, liên kết nguồn, phiên bản, changelog và trạng thái quét:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Các listing công khai hiển thị trạng thái quét mới nhất. Những bản phát hành bị
giữ lại hoặc bị chặn bởi kiểm duyệt có thể bị ẩn khỏi bề mặt tìm kiếm và cài đặt
cho đến khi được xử lý.
