---
read_when:
    - Bạn đang quản lý các nút được ghép đôi (máy quay, màn hình, khung vẽ)
    - Bạn cần phê duyệt các yêu cầu hoặc gọi các lệnh node
summary: Tài liệu tham khảo CLI cho `openclaw nodes` (trạng thái, ghép nối, gọi, camera/canvas/màn hình)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:54:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Quản lý các Node (thiết bị) đã ghép đôi và gọi các capability của Node.

Liên quan:

- Tổng quan về Node: [Node](/vi/nodes)
- Camera: [Node camera](/vi/nodes/camera)
- Hình ảnh: [Node hình ảnh](/vi/nodes/images)

Tùy chọn thường dùng:

- `--url`, `--token`, `--timeout`, `--json`

## Lệnh thường dùng

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` in bảng đang chờ/đã ghép đôi. Các hàng đã ghép đôi bao gồm độ tuổi kết nối gần đây nhất (Lần kết nối gần nhất).
Dùng `--connected` để chỉ hiển thị các Node hiện đang kết nối. Dùng `--last-connected <duration>` để
lọc các Node đã kết nối trong một khoảng thời gian (ví dụ: `24h`, `7d`).
Dùng `nodes remove --node <id|name|ip>` để xóa bản ghi ghép đôi Node cũ do Gateway sở hữu.

Lưu ý phê duyệt:

- `openclaw nodes pending` chỉ cần phạm vi ghép đôi.
- `gateway.nodes.pairing.autoApproveCidrs` chỉ có thể bỏ qua bước đang chờ đối với
  việc ghép đôi thiết bị `role: node` lần đầu, được tin cậy rõ ràng. Tùy chọn này tắt theo
  mặc định và không phê duyệt nâng cấp.
- `openclaw nodes approve <requestId>` kế thừa các yêu cầu phạm vi bổ sung từ
  yêu cầu đang chờ:
  - yêu cầu không có lệnh: chỉ ghép đôi
  - lệnh Node không phải exec: ghép đôi + ghi
  - `system.run` / `system.run.prepare` / `system.which`: ghép đôi + quản trị

## Gọi

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Cờ gọi:

- `--params <json>`: chuỗi đối tượng JSON (mặc định `{}`).
- `--invoke-timeout <ms>`: thời gian chờ gọi Node (mặc định `15000`).
- `--idempotency-key <key>`: khóa idempotency tùy chọn.
- `system.run` và `system.run.prepare` bị chặn tại đây; dùng công cụ `exec` với `host=node` để thực thi shell.

Để thực thi shell trên một Node, dùng công cụ `exec` với `host=node` thay vì `openclaw nodes run`.
CLI `nodes` hiện tập trung vào capability: RPC trực tiếp qua `nodes invoke`, cộng với ghép đôi, camera,
màn hình, vị trí, canvas và thông báo.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Node](/vi/nodes)
