---
read_when:
    - Bạn đang quản lý các Node được ghép cặp (camera, màn hình, canvas)
    - Bạn cần phê duyệt các yêu cầu hoặc gọi lệnh Node
summary: Tham chiếu CLI cho `openclaw nodes` (trạng thái, ghép nối, gọi, camera/canvas/màn hình)
title: Node
x-i18n:
    generated_at: "2026-04-29T22:33:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Quản lý các nút (thiết bị) đã ghép đôi và gọi các năng lực của nút.

Liên quan:

- Tổng quan về nút: [Nút](/vi/nodes)
- Camera: [Nút camera](/vi/nodes/camera)
- Hình ảnh: [Nút hình ảnh](/vi/nodes/images)

Tùy chọn phổ biến:

- `--url`, `--token`, `--timeout`, `--json`

## Lệnh phổ biến

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

`nodes list` in ra các bảng đang chờ/đã ghép đôi. Các hàng đã ghép đôi bao gồm thời gian kể từ lần kết nối gần nhất (Lần kết nối gần nhất).
Dùng `--connected` để chỉ hiển thị các nút hiện đang kết nối. Dùng `--last-connected <duration>` để
lọc các nút đã kết nối trong một khoảng thời lượng (ví dụ: `24h`, `7d`).
Dùng `nodes remove --node <id|name|ip>` để xóa bản ghi ghép đôi nút đã cũ do gateway sở hữu.

Lưu ý phê duyệt:

- `openclaw nodes pending` chỉ cần phạm vi ghép đôi.
- `gateway.nodes.pairing.autoApproveCidrs` có thể bỏ qua bước đang chờ chỉ đối với
  việc ghép đôi thiết bị `role: node` lần đầu, được tin cậy rõ ràng. Tùy chọn này tắt
  theo mặc định và không phê duyệt các lượt nâng cấp.
- `openclaw nodes approve <requestId>` kế thừa các yêu cầu phạm vi bổ sung từ
  yêu cầu đang chờ:
  - yêu cầu không có lệnh: chỉ ghép đôi
  - lệnh nút không phải exec: ghép đôi + ghi
  - `system.run` / `system.run.prepare` / `system.which`: ghép đôi + quản trị viên

## Gọi

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Cờ gọi:

- `--params <json>`: chuỗi đối tượng JSON (mặc định `{}`).
- `--invoke-timeout <ms>`: thời gian chờ gọi nút (mặc định `15000`).
- `--idempotency-key <key>`: khóa idempotency tùy chọn.
- `system.run` và `system.run.prepare` bị chặn ở đây; dùng công cụ `exec` với `host=node` để thực thi shell.

Để thực thi shell trên một nút, dùng công cụ `exec` với `host=node` thay vì `openclaw nodes run`.
CLI `nodes` hiện tập trung vào năng lực: RPC trực tiếp qua `nodes invoke`, cùng với ghép đôi, camera,
màn hình, vị trí, canvas và thông báo.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Nút](/vi/nodes)
