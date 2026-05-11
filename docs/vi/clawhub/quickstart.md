---
read_when:
    - Lần đầu sử dụng ClawHub
    - Cài đặt một kỹ năng hoặc Plugin từ kho đăng ký
    - Xuất bản lên ClawHub
summary: 'Bắt đầu sử dụng ClawHub: tìm, cài đặt, cập nhật và xuất bản Skills hoặc Plugin.'
x-i18n:
    generated_at: "2026-05-11T20:24:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Bắt đầu nhanh

ClawHub là registry cho các kỹ năng và plugin của OpenClaw.

Dùng OpenClaw khi bạn đang cài đặt mọi thứ vào OpenClaw. Dùng CLI `clawhub`
khi bạn đăng nhập, phát hành, quản lý các mục niêm yết của riêng mình, hoặc dùng
các quy trình làm việc dành riêng cho registry.

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

Môi trường headless có thể dùng API token từ giao diện web ClawHub:

```bash
clawhub login --token clh_...
```

## Phát hành một kỹ năng

Một kỹ năng là một thư mục có tệp `SKILL.md` bắt buộc và các tệp hỗ trợ tùy chọn.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Trước khi phát hành, hãy kiểm tra metadata trong `SKILL.md`. Khai báo các biến
môi trường, công cụ và quyền bắt buộc để người dùng có thể hiểu kỹ năng cần gì
trước khi họ cài đặt. Xem [Định dạng kỹ năng](/vi/clawhub/skill-format).

## Phát hành một plugin

Phát hành một plugin từ thư mục cục bộ, repo GitHub, ref GitHub, hoặc một archive
hiện có:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng `--dry-run` trước để xem trước metadata package đã phân giải, các trường
tương thích, thông tin nguồn và kế hoạch tải lên mà không phát hành.

Code plugin phải bao gồm metadata tương thích OpenClaw trong `package.json`,
bao gồm `openclaw.compat.pluginApi` và `openclaw.build.openclawVersion`.

## Đồng bộ các kỹ năng bạn duy trì

`sync` quét các thư mục kỹ năng và phát hành các kỹ năng mới hoặc đã thay đổi
chưa được đồng bộ hóa.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Khi bạn đã đăng nhập, `sync` cũng có thể gửi một snapshot cài đặt tối thiểu để
tính tổng số lượt cài đặt. Xem [Telemetry](/vi/clawhub/telemetry) để biết những gì
được báo cáo và cách chọn không tham gia.

## Kiểm tra trước khi cài đặt

Trước khi cài đặt, dùng trang web ClawHub hoặc các lệnh chi tiết của CLI để kiểm
tra metadata, liên kết nguồn, phiên bản, changelog và trạng thái quét:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Các mục niêm yết công khai hiển thị trạng thái quét mới nhất. Các bản phát hành
bị giữ lại hoặc bị chặn bởi moderation có thể bị ẩn khỏi giao diện tìm kiếm và
cài đặt cho đến khi được giải quyết.
