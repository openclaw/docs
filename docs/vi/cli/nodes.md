---
read_when:
    - Bạn đang quản lý các node đã ghép nối (camera, màn hình, canvas)
    - Bạn cần phê duyệt các yêu cầu hoặc gọi các lệnh Node
summary: Tài liệu tham khảo CLI cho `openclaw nodes` (trạng thái, ghép đôi, gọi, camera/canvas/màn hình/vị trí/thông báo)
title: Các Node
x-i18n:
    generated_at: "2026-07-22T02:14:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 53003bcd3d30b0e754aa0717452700595c0cf69d9ecd6301b8a1bf320ea1838a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Quản lý các node (thiết bị) đã ghép đôi và gọi các khả năng của node.

Liên quan: [Tổng quan về node](/vi/nodes) - [Trạng thái hiện diện của máy tính đang hoạt động](/vi/nodes/presence) - [Node camera](/vi/nodes/camera) - [Node hình ảnh](/vi/nodes/images)

Các tùy chọn chung trên mọi lệnh con: `--url <url>`, `--token <token>`, `--timeout <ms>` (mặc định `10000`), `--json`.

## Trạng thái

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

Cả `status` và `list` đều chấp nhận `--connected` (chỉ các node đang kết nối) và `--last-connected <duration>` (ví dụ: `24h`, `7d`; chỉ các node đã kết nối trong khoảng thời gian đó). `list` hiển thị các node đang chờ và đã ghép đôi trong các bảng riêng biệt, trong đó các hàng đã ghép đôi bao gồm thời gian tính từ lần kết nối gần nhất (Last Connect); `status` hiển thị một bảng hợp nhất với thông tin chi tiết về khả năng, phiên bản và lần nhập cuối của từng node. Một node macOS đang kết nối chỉ báo cáo lần nhập cuối sau khi người dùng bật **Phát hiện máy tính đang hoạt động** và cấp quyền Trợ năng; hàng mới nhất được đánh dấu `active`. Xem [Trạng thái hiện diện của máy tính đang hoạt động](/vi/nodes/presence). `describe` in ra các khả năng, quyền, hoạt động và các lệnh gọi có hiệu lực/đang chờ của một node.

## Ghép đôi

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Các lệnh này điều khiển kho `node.pair.*` do Gateway sở hữu, tách biệt với việc ghép đôi thiết bị (`openclaw devices approve`) dùng để kiểm soát bước bắt tay `connect` qua WS của node. Xem [Node](/vi/nodes) để biết mối quan hệ giữa hai cơ chế này.

- `remove` thu hồi mục vai trò đã ghép đôi của node. Đối với node dựa trên thiết bị, thao tác này thu hồi vai trò `node` trong kho ghép đôi thiết bị và ngắt kết nối các phiên có vai trò node: thiết bị có nhiều vai trò vẫn giữ hàng của mình và chỉ mất vai trò `node`, còn hàng của thiết bị chỉ có vai trò node sẽ bị xóa. Thao tác này cũng xóa mọi bản ghi ghép đôi node cũ khớp với điều kiện do Gateway sở hữu.
- `pending` chỉ cần phạm vi `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` có thể bỏ qua bước chờ đối với việc ghép đôi thiết bị `role: node` lần đầu được xác định rõ là đáng tin cậy. Mặc định tắt; không phê duyệt việc nâng cấp vai trò.
- `gateway.nodes.pairing.sshVerify` (mặc định bật) tự động phê duyệt việc ghép đôi thiết bị `role: node` lần đầu khi Gateway có thể xác minh khóa thiết bị qua SSH tới máy chủ node; bề mặt khả năng đầu tiên được phê duyệt trong cùng bước. Xem [Ghép đôi node](/vi/gateway/pairing#ssh-verified-device-auto-approval-default).
- Các yêu cầu về phạm vi của `approve` tuân theo các lệnh được khai báo trong yêu cầu đang chờ:
  - yêu cầu không có lệnh: `operator.pairing`
  - các lệnh node thông thường: `operator.pairing` + `operator.write`
  - các lệnh nhạy cảm về quản trị (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` và `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- Phạm vi `remove`: `operator.pairing` có thể xóa các hàng node không thuộc người vận hành; trình gọi bằng token thiết bị khi thu hồi vai trò node của chính mình trên thiết bị có nhiều vai trò còn cần thêm `operator.admin`.

## Gọi

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Cờ:

- `--command <command>` (bắt buộc): ví dụ: `canvas.eval`.
- `--params <json>`: chuỗi đối tượng JSON (mặc định `{}`).
- `--invoke-timeout <ms>`: thời gian chờ gọi node (mặc định `15000`).
- `--idempotency-key <key>`: khóa lũy đẳng tùy chọn.

`system.run` và `system.run.prepare` bị chặn tại đây; thay vào đó, hãy dùng công cụ `exec` với `host=node` để thực thi shell. `system.which` được phép thông qua `invoke`.

## Thông báo, đẩy, vị trí, màn hình

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` gửi thông báo cục bộ trên một node khai báo `system.notify`, bao gồm các node macOS, iOS, Android và watchOS trực tiếp. Việc phân phối trực tiếp đến watchOS yêu cầu OpenClaw đang hoạt động. Yêu cầu `--title` hoặc `--body`. Tùy chọn: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (mặc định `system`), `--invoke-timeout <ms>` (mặc định `15000`).
- `push` gửi một thông báo đẩy thử nghiệm APNs tới node iOS. Tùy chọn: `--title <text>` (mặc định `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` để ghi đè môi trường APNs đã phát hiện.
- `location get` truy xuất vị trí hiện tại của node. Tùy chọn: `--max-age <ms>` (tái sử dụng một kết quả định vị đã lưu trong bộ nhớ đệm), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (mặc định `10000`), `--invoke-timeout <ms>` (mặc định `20000`).
- `screen record` ghi một đoạn clip ngắn và in ra đường dẫn đã lưu (hoặc ghi JSON bằng `--json`). Tùy chọn: `--screen <index>` (mặc định `0`), `--duration <ms|10s>` (mặc định `10000`), `--fps <fps>` (mặc định `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (mặc định `120000`).

Các lệnh Camera và Canvas có tài liệu riêng: [Node camera](/vi/nodes/camera), [Canvas](/vi/platforms/mac/canvas). Canvas được triển khai bằng Plugin Canvas thử nghiệm đi kèm; phần lõi giữ `openclaw nodes canvas` làm điểm gắn tương thích.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Node](/vi/nodes)
