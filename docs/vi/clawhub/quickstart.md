---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt một kỹ năng hoặc Plugin từ registry
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và phát hành Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-05-12T23:29:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là một registry cho OpenClaw Skills và plugin.

Dùng OpenClaw khi bạn cài đặt mọi thứ vào OpenClaw. Dùng CLI `clawhub`
khi bạn đăng nhập, phát hành, quản lý các mục niêm yết của riêng mình, hoặc dùng
các quy trình làm việc dành riêng cho registry.

## Tìm và cài đặt một Skill

Tìm kiếm từ OpenClaw:

```bash
openclaw skills search "calendar"
```

Cài đặt một Skill:

```bash
openclaw skills install <skill-slug>
```

Cập nhật các Skill đã cài đặt:

```bash
openclaw skills update --all
```

OpenClaw ghi lại Skill đến từ đâu để các bản cập nhật sau này có thể tiếp tục
phân giải thông qua ClawHub.

## Tìm và cài đặt một plugin

Tìm kiếm từ OpenClaw:

```bash
openclaw plugins search "calendar"
```

Cài đặt một plugin được lưu trữ trên ClawHub với nguồn ClawHub rõ ràng:

```bash
openclaw plugins install clawhub:<package>
```

Cập nhật các plugin đã cài đặt:

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

Môi trường không có giao diện có thể dùng token API từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Phát hành một Skill

Một Skill là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ
tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Trước khi phát hành, hãy kiểm tra metadata trong `SKILL.md`. Khai báo các
biến môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu Skill cần gì
trước khi họ cài đặt. Xem [Định dạng Skill](/vi/clawhub/skill-format).

## Phát hành một plugin

Phát hành một plugin từ thư mục cục bộ, repo GitHub, ref GitHub, hoặc một
archive hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng `--dry-run` trước để xem trước metadata package đã phân giải, các trường
tương thích, nguồn gốc và kế hoạch tải lên mà không phát hành.

Plugin mã phải bao gồm metadata tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Đồng bộ các Skill bạn duy trì

`sync` quét các thư mục Skill và phát hành các Skill mới hoặc đã thay đổi nhưng
chưa được đồng bộ.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Khi bạn đã đăng nhập, `sync` cũng có thể gửi một snapshot cài đặt tối thiểu để
tổng hợp số lượt cài đặt. Xem [Telemetry](/vi/clawhub/telemetry) để biết nội dung
được báo cáo và cách chọn không tham gia.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, hãy dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để kiểm tra
metadata, liên kết nguồn, phiên bản, changelog và trạng thái quét:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Các mục niêm yết công khai hiển thị trạng thái quét mới nhất. Các bản phát hành bị giữ lại hoặc bị chặn bởi
quy trình kiểm duyệt có thể bị ẩn khỏi các bề mặt tìm kiếm và cài đặt cho đến khi được giải quyết.
