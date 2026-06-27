---
read_when:
    - Bạn đang quản lý các node được ghép cặp (camera, màn hình, canvas)
    - Bạn cần phê duyệt yêu cầu hoặc gọi các lệnh node
summary: Tham chiếu CLI cho `openclaw nodes` (trạng thái, ghép cặp, gọi, camera/canvas/màn hình)
title: Các Node
x-i18n:
    generated_at: "2026-06-27T17:19:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
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

`nodes list` in các bảng đang chờ/đã ghép đôi. Các hàng đã ghép đôi bao gồm tuổi kết nối gần đây nhất (Kết nối gần nhất).
Dùng `--connected` để chỉ hiển thị các Node hiện đang kết nối. Dùng `--last-connected <duration>` để
lọc các Node đã kết nối trong một khoảng thời gian (ví dụ: `24h`, `7d`).
Dùng `nodes remove --node <id|name|ip>` để xóa ghép đôi của một Node. Với một
Node dựa trên thiết bị, thao tác này thu hồi vai trò `node` của thiết bị trong `devices/paired.json`
và ngắt kết nối các phiên có vai trò Node của thiết bị đó (thiết bị có nhiều vai trò vẫn giữ hàng của nó và
chỉ mất vai trò `node`; thiết bị chỉ có vai trò Node sẽ bị xóa); thao tác này cũng xóa mọi
bản ghi ghép đôi Node cũ tương ứng do Gateway sở hữu. `operator.pairing` có thể xóa
các hàng Node không phải operator; caller dùng token thiết bị khi thu hồi vai trò Node của chính nó trên một
thiết bị nhiều vai trò cũng cần `operator.admin`.

Ghi chú phê duyệt:

- `openclaw nodes pending` chỉ cần phạm vi ghép đôi.
- `gateway.nodes.pairing.autoApproveCidrs` chỉ có thể bỏ qua bước đang chờ đối với
  ghép đôi thiết bị `role: node` lần đầu, được tin cậy rõ ràng. Tùy chọn này tắt theo
  mặc định và không phê duyệt các lần nâng cấp.
- `openclaw nodes approve <requestId>` kế thừa các yêu cầu phạm vi bổ sung từ
  yêu cầu đang chờ:
  - yêu cầu không có lệnh: chỉ ghép đôi
  - lệnh Node không phải exec: ghép đôi + ghi
  - `system.run` / `system.run.prepare` / `system.which`: ghép đôi + admin

## Gọi

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Cờ gọi:

- `--params <json>`: chuỗi đối tượng JSON (mặc định `{}`).
- `--invoke-timeout <ms>`: thời gian chờ gọi Node (mặc định `15000`).
- `--idempotency-key <key>`: khóa idempotency tùy chọn.
- `system.run` và `system.run.prepare` bị chặn ở đây; dùng công cụ `exec` với `host=node` để thực thi shell.

Để thực thi shell trên một Node, dùng công cụ `exec` với `host=node` thay vì `openclaw nodes run`.
CLI `nodes` hiện tập trung vào capability: RPC trực tiếp qua `nodes invoke`, cùng với ghép đôi, camera,
màn hình, vị trí, Canvas và thông báo. Các lệnh Canvas được triển khai bởi Plugin Canvas thử nghiệm được tích hợp; core giữ một hook tương thích để chúng vẫn nằm dưới `openclaw nodes canvas`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Node](/vi/nodes)
