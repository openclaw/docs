---
read_when:
    - Bạn đang quản lý các Node đã ghép nối (camera, màn hình, canvas)
    - Bạn cần phê duyệt các yêu cầu hoặc gọi các lệnh node
summary: Tham chiếu CLI cho `openclaw nodes` (trạng thái, ghép nối, gọi, camera/canvas/màn hình/vị trí/thông báo)
title: Các Node
x-i18n:
    generated_at: "2026-07-16T14:13:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Quản lý các node (thiết bị) đã ghép nối và gọi các chức năng của node.

Liên quan: [Tổng quan về node](/vi/nodes) - [Trạng thái hiện diện của máy tính đang hoạt động](/nodes/presence) - [Node camera](/vi/nodes/camera) - [Node hình ảnh](/vi/nodes/images)

Các tùy chọn chung cho mọi lệnh con: `--url <url>`, `--token <token>`, `--timeout <ms>` (mặc định `10000`), `--json`.

## Trạng thái

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` và `list` đều chấp nhận `--connected` (chỉ các node đang kết nối) và `--last-connected <duration>` (ví dụ: `24h`, `7d`; chỉ các node đã kết nối trong khoảng thời gian này). `list` hiển thị các node đang chờ và đã ghép nối trong các bảng riêng biệt, trong đó các hàng đã ghép nối bao gồm thời gian kể từ lần kết nối gần nhất (Last Connect); `status` hiển thị một bảng hợp nhất với thông tin chi tiết về chức năng, phiên bản và lần nhập gần nhất của từng node. Một node macOS đang kết nối chỉ báo cáo lần nhập gần nhất khi quyền Accessibility được cấp, và hàng mới nhất được đánh dấu `active`; xem [Trạng thái hiện diện của máy tính đang hoạt động](/nodes/presence). `describe` in ra chức năng, quyền, hoạt động và các lệnh gọi có hiệu lực/đang chờ của một node.

## Ghép nối

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Các lệnh này điều khiển kho `node.pair.*` do Gateway sở hữu, tách biệt với quy trình ghép nối thiết bị (`openclaw devices approve`) kiểm soát bắt tay WS `connect` của node. Xem [Node](/vi/nodes) để biết mối quan hệ giữa hai cơ chế này.

- `remove` thu hồi mục vai trò đã ghép nối của node. Đối với node dựa trên thiết bị, thao tác này thu hồi vai trò `node` trong kho ghép nối thiết bị và ngắt kết nối các phiên có vai trò node của thiết bị: thiết bị có nhiều vai trò vẫn giữ hàng của mình và chỉ mất vai trò `node`, còn hàng của thiết bị chỉ có vai trò node sẽ bị xóa. Thao tác này cũng xóa mọi bản ghi ghép nối node cũ do Gateway sở hữu tương ứng.
- `pending` chỉ cần phạm vi `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` có thể bỏ qua bước chờ đối với quy trình ghép nối thiết bị `role: node` lần đầu được tin cậy rõ ràng. Mặc định tắt; không phê duyệt việc nâng cấp vai trò.
- `gateway.nodes.pairing.sshVerify` (mặc định bật) tự động phê duyệt quy trình ghép nối thiết bị `role: node` lần đầu khi Gateway có thể xác minh khóa thiết bị qua SSH tới máy chủ node; bề mặt chức năng đầu tiên được phê duyệt trong cùng bước. Xem [Ghép nối node](/vi/gateway/pairing#ssh-verified-device-auto-approval-default).
- Các yêu cầu về phạm vi của `approve` tuân theo các lệnh được khai báo trong yêu cầu đang chờ:
  - yêu cầu không có lệnh: `operator.pairing`
  - các lệnh node thông thường: `operator.pairing` + `operator.write`
  - các lệnh nhạy cảm về quản trị (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` và `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- Phạm vi `remove`: `operator.pairing` có thể xóa các hàng node không phải của toán tử; bên gọi bằng token thiết bị khi thu hồi vai trò node của chính mình trên thiết bị có nhiều vai trò còn cần thêm `operator.admin`.

## Gọi

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Cờ:

- `--command <command>` (bắt buộc): ví dụ: `canvas.eval`.
- `--params <json>`: chuỗi đối tượng JSON (mặc định `{}`).
- `--invoke-timeout <ms>`: thời gian chờ gọi node (mặc định `15000`).
- `--idempotency-key <key>`: khóa đảm bảo tính lũy đẳng tùy chọn.

`system.run` và `system.run.prepare` bị chặn tại đây; thay vào đó, hãy sử dụng công cụ `exec` với `host=node` để thực thi shell. `system.which` được cho phép thông qua `invoke`.

## Thông báo, đẩy, vị trí, màn hình

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` gửi thông báo cục bộ trên một node khai báo `system.notify`, bao gồm các node macOS, iOS, Android và watchOS trực tiếp. Việc gửi trực tiếp tới watchOS yêu cầu OpenClaw đang hoạt động. Yêu cầu `--title` hoặc `--body`. Tùy chọn: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (mặc định `system`), `--invoke-timeout <ms>` (mặc định `15000`).
- `push` gửi thông báo đẩy thử nghiệm APNs tới một node iOS. Tùy chọn: `--title <text>` (mặc định `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` để ghi đè môi trường APNs được phát hiện.
- `location get` truy xuất vị trí hiện tại của node. Tùy chọn: `--max-age <ms>` (tái sử dụng một kết quả định vị được lưu vào bộ nhớ đệm), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (mặc định `10000`), `--invoke-timeout <ms>` (mặc định `20000`).
- `screen record` ghi lại một đoạn video ngắn và in ra đường dẫn đã lưu (hoặc ghi JSON bằng `--json`). Tùy chọn: `--screen <index>` (mặc định `0`), `--duration <ms|10s>` (mặc định `10000`), `--fps <fps>` (mặc định `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (mặc định `120000`).

Các lệnh Camera và Canvas có tài liệu riêng: [Node camera](/vi/nodes/camera), [Canvas](/vi/platforms/mac/canvas). Canvas được triển khai bởi plugin Canvas thử nghiệm đi kèm; phần lõi giữ `openclaw nodes canvas` làm điểm gắn kết tương thích.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Node](/vi/nodes)
