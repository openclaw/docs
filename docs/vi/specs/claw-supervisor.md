---
read_when:
    - Thiết kế giám sát đội Codex
    - Xây dựng các công cụ OpenClaw để đọc, điều khiển hoặc tạo phiên Codex
    - Chọn giữa triển khai cục bộ, Cloudflare và VPS cho Codex có giám sát
summary: Kế hoạch giám sát đội phiên app-server Codex do OpenClaw điều khiển.
title: Trình giám sát Claw
x-i18n:
    generated_at: "2026-06-27T18:11:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw Supervisor

## Mục tiêu

Claw Supervisor cho phép một phiên bản OpenClaw luôn bật giám sát và điều khiển một đội phiên Codex mà không thay đổi trải nghiệm người dùng Codex thông thường. Người dùng có thể SSH vào một máy chủ, khởi động Codex, làm việc trong TUI, và vẫn để supervisor đọc phiên, điều hướng phiên, ngắt phiên, sinh các phiên liên quan, và chấp nhận bàn giao. Các phiên Codex cũng có thể gọi ngược vào OpenClaw thông qua MCP.

## Mô hình sản phẩm

Codex vẫn là bề mặt làm việc chính. OpenClaw giám sát Codex thay vì ẩn Codex bên trong một subagent OpenClaw mờ đục.

Plugin OpenClaw có tên là `codex-supervisor`. `crabfleet` vẫn là hồ sơ triển khai
và đội máy chủ dành cho các máy CRAB thay vì là tên Plugin tái sử dụng.

Mô hình có ba vai trò:

- Codex gắn với con người: một TUI Codex tương tác bình thường được khởi chạy thông qua app-server dùng chung.
- Codex tự trị: một luồng app-server Codex do supervisor sinh ra mà con người có thể gắn vào sau.
- Supervisor Claw: một tác tử OpenClaw luôn bật với các công cụ cho trạng thái đội máy, đọc bản ghi phiên, điều hướng, ngắt, sinh phiên, và bàn giao.

OpenClaw có thể dùng nội bộ cơ chế subagent hiện có, nhưng hợp đồng bên ngoài là một phiên Codex có thể gắn vào với id luồng Codex.

## Kiến trúc

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Mỗi máy chủ có khả năng chạy Codex sẽ chạy:

- Daemon app-server Codex.
- Một trình khởi chạy luôn khởi động Codex tương tác với `--remote`.
- Một connector đăng ký các endpoint app-server và các luồng đang hoạt động với supervisor.

Supervisor chạy:

- Registry endpoint.
- Registry phiên.
- Nhóm client JSON-RPC app-server Codex.
- Máy chủ MCP cho các lệnh gọi từ Codex sang Claw.
- Công cụ OpenClaw để điều khiển từ Claw sang Codex.
- Công cụ chính sách cho các hành động tự trị, phê duyệt, và ngăn vòng lặp.

## Hợp đồng App-Server Codex

Dùng API app-server Codex làm mặt phẳng điều khiển chuẩn:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Codex tương tác phải được khởi chạy với `codex --remote <endpoint>` để TUI và supervisor kết nối tới cùng một app-server. `codex exec` độc lập hiện chưa phải là phiên được chia sẻ trực tiếp; hãy dùng API app-server cho công việc tự trị cho đến khi Codex hỗ trợ `exec --remote`.

## Registry phiên

Supervisor lưu một bản ghi cho mỗi luồng Codex quan sát được:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

Triển khai cục bộ có thể suy ra hầu hết các trường từ metadata luồng Codex. Triển khai đội máy nên làm giàu bản ghi bằng danh tính máy chủ, trạng thái gắn với người dùng, trạng thái git, và sức khỏe sidecar.

## Bề mặt MCP cho Codex

Mỗi Codex được giám sát nhận một máy chủ MCP tên là `openclaw-codex-supervisor`.

Công cụ:

- `codex_sessions_list`: liệt kê các phiên Codex có thể thấy.
- `codex_session_read`: đọc một bản ghi phiên.
- `codex_session_send`: gửi một thông điệp tới luồng đang rảnh hoặc điều hướng một luồng đang hoạt động.
- `codex_session_interrupt`: ngắt lượt đang hoạt động.
- `codex_endpoint_probe`: xác minh kết nối endpoint.
- `claw_report_progress`: công bố trạng thái tác vụ hiện tại cho supervisor.
- `claw_ask`: yêu cầu supervisor trợ giúp hoặc ủy quyền.
- `codex_spawn`: tạo một phiên Codex tự trị mới.
- `codex_handoff`: yêu cầu con người hoặc phiên ngang hàng tiếp quản.

Tài nguyên:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Bề mặt điều khiển Claw

Claw luôn bật nhận cùng các primitive như công cụ nội bộ:

- liệt kê phiên và endpoint
- đọc bản ghi phiên
- gửi/điều hướng văn bản
- ngắt công việc đang hoạt động
- sinh phiên mới
- tóm tắt và gán phiên
- phát chỉ dẫn tới một nhóm đã lọc
- đánh dấu phiên bị chặn, hoàn tất, hoặc bị bỏ

Hành vi công cụ:

- Nếu luồng đích đang rảnh, `codex_session_send` ánh xạ tới `turn/start`.
- Nếu luồng đích đang hoạt động và có thể thấy id lượt đang xử lý, nó ánh xạ tới `turn/steer`.
- Nếu không thể xác định lượt đang hoạt động, công cụ sẽ thất bại đóng thay vì tạo một lượt không liên quan.
- Các điều khiển ghi MCP được phơi bày cho Codex vẫn bị tắt trừ khi một chính sách chỉ dành cho supervisor đáng tin cậy bật chúng.
- Việc đọc bản ghi phiên thô vẫn bị tắt trừ khi một chính sách chỉ dành cho supervisor đáng tin cậy bật chúng.
- Mặc định phê duyệt tự trị từ chối các phê duyệt công cụ/tệp trừ khi có chính sách rõ ràng quy định khác.

## Luồng khởi chạy

Đăng nhập máy chủ tương tác:

1. Người dùng SSH vào một máy chủ CRAB.
2. Dịch vụ SSH khởi động hoặc xác minh `codex app-server daemon start`.
3. Wrapper đăng nhập khởi chạy `codex --remote unix:// --cd <workspace>`.
4. Connector máy chủ đăng ký endpoint và luồng đã tải.
5. Supervisor phát một sự kiện đội máy ưu tiên cao: phiên Codex mới, workspace, trạng thái gắn với con người, bản xem trước tác vụ hiện tại.
6. Supervisor Claw có thể đọc và điều hướng ngay lập tức.

Sinh tự trị:

1. Supervisor chọn máy chủ và workspace.
2. Connector máy chủ mở hoặc tiếp tục một luồng app-server Codex.
3. Supervisor bắt đầu lượt đầu tiên với văn bản tác vụ và cấu hình MCP.
4. Registry phiên đánh dấu phiên là tự trị và có thể gắn vào.
5. Con người có thể gắn vào sau bằng `codex --remote <endpoint> resume <threadId>` khi Codex hỗ trợ đúng UX đó, hoặc thông qua luồng tiếp tục hiện tại trên cùng app-server.

## Triển khai

Mặt phẳng điều khiển ưu tiên:

- Connector máy chủ duy trì các kết nối WebSocket đi ra tới supervisor.
- Trạng thái supervisor nằm trong kho lưu trữ OpenClaw Gateway.
- App-server Codex vẫn nằm cục bộ trên từng máy chủ; không bao giờ phơi bày app-server thô không xác thực ra internet công cộng.

Tính khả thi của Cloudflare:

- Phù hợp cho registry, durable object, gom WebSocket, định tuyến sự kiện nhẹ, và endpoint MCP/gateway công cộng.
- Tự nó chưa đủ để điều khiển trực tiếp máy chủ riêng tư vì Workers không thể quay số tới socket Unix riêng tư tùy ý hoặc app-server local loopback.
- Dùng Cloudflare khi mọi connector máy chủ gọi về qua WebSocket đi ra.

Phương án dự phòng VPS:

- Dùng dịch vụ Hetzner khi cần điều khiển tiến trình sống lâu, đường hầm SSH, định tuyến mạng riêng, hoặc truy cập hệ thống tệp cục bộ.
- Giữ cùng giao thức: connector máy chủ đi ra, registry supervisor tập trung, app-server Codex cục bộ.

## Bảo mật

- Mặc định bind là socket Unix cục bộ.
- App-server từ xa dùng token hoặc xác thực bearer đã ký.
- Connector máy chủ xác thực với supervisor bằng token máy chủ có phạm vi.
- Công cụ supervisor thực thi chính sách theo từng phiên: đọc, điều hướng, ngắt, sinh, phê duyệt.
- Thông điệp liên tác tử bao gồm `originSessionId`; tự vọng lại sẽ bị loại bỏ.
- Phát thông báo yêu cầu bộ lọc rõ ràng và số lượng đích bị giới hạn.
- Việc đọc bản ghi phiên sẽ biên tập bí mật tại ranh giới OpenClaw.
- Yêu cầu phê duyệt mặc định bị từ chối cho các lượt bắt nguồn từ supervisor trừ khi chính sách cho phép.

## Kế hoạch triển khai

Giai đoạn 1: MVP supervisor cục bộ

- Thêm client JSON-RPC app-server Codex cho proxy stdio và endpoint WebSocket.
- Thêm registry endpoint/phiên của supervisor.
- Thêm công cụ MCP: liệt kê, đọc, gửi, ngắt, thăm dò.
- Thêm cấu hình env cục bộ cho endpoint.
- Thêm kiểm thử app-server giả và một smoke app-server cục bộ trực tiếp.

Giai đoạn 2: Tích hợp OpenClaw

- Đăng ký công cụ supervisor trong Plugin `codex-supervisor`.
- Tiêm MCP supervisor vào cấu hình luồng Codex.
- Thêm tóm tắt phiên vào ngữ cảnh tác tử.
- Thêm thông báo sự kiện khi luồng Codex mới xuất hiện.
- Thêm cấu hình chính sách cho gửi/ngắt/sinh tự trị.

Giai đoạn 3: Connector đội máy

- Sidecar máy chủ đăng ký endpoint app-server, metadata máy chủ, metadata git/workspace, và trạng thái gắn với con người.
- Thêm connector WebSocket đi ra cho mặt phẳng điều khiển Cloudflare hoặc VPS.
- Thêm kết nối lại, Heartbeat, và dọn dẹp phiên cũ.
- Thêm wrapper trình khởi chạy SSH CRAB.

Giai đoạn 4: Vận hành tự trị

- Thêm các luồng sinh/tiếp tục/tiếp quản.
- Thêm phát thông báo và ủy quyền.
- Thêm báo cáo tiến độ và tóm tắt trạng thái tác vụ.
- Thêm ngăn vòng lặp và giới hạn tốc độ.
- Thêm các chế độ xem dashboard.

Giai đoạn 5: Đa Claw

- Phân mảnh phiên theo nhóm.
- Thêm leadership/lease cho từng phiên.
- Thêm nhật ký kiểm toán và phát lại.
- Thêm leo thang giữa các nhóm Claw.

## Kiểm thử chấp nhận

- Con người khởi chạy TUI Codex thông qua app-server dùng chung.
- Supervisor liệt kê luồng đang hoạt động qua `thread/loaded/list`.
- Supervisor đọc bản ghi phiên qua `thread/read`.
- Supervisor gửi văn bản tới luồng đang rảnh qua `turn/start`.
- Supervisor điều hướng luồng đang hoạt động qua `turn/steer`.
- Lệnh ngắt của supervisor dừng một lượt đang hoạt động qua `turn/interrupt`.
- Codex gọi MCP supervisor và liệt kê các phiên ngang hàng.
- Một Codex tự trị được sinh ra và sau đó được gắn với con người.
- Connector máy chủ bị mất đánh dấu các phiên là cũ mà không xóa lịch sử.

## Câu hỏi mở

- UX gắn TUI Codex chính xác cho một luồng app-server được sinh mà không có TUI.
- Liệu Codex có nên thêm `exec --remote` cho các lần chạy headless được chia sẻ trực tiếp hay không.
- Chủ sở hữu trạng thái bền vững: DB OpenClaw Gateway, Cloudflare Durable Object, hoặc cơ sở dữ liệu VPS.
- Độ chi tiết chính sách phê duyệt cho các lượt bắt nguồn từ supervisor.
- Bao nhiêu tóm tắt bản ghi phiên nên được tiêm vào ngữ cảnh Claw luôn bật so với được giữ dưới dạng công cụ/tài nguyên.
