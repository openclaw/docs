---
read_when:
    - Bạn muốn có một nhánh và bản làm việc biệt lập cho một tác vụ của tác tử
    - Bạn đang cấu hình các thẻ Workboard với không gian làm việc worktree
    - Bạn cần khôi phục hoặc dọn dẹp một cây làm việc do OpenClaw quản lý
summary: Chạy các tác vụ tác nhân trong các bản checkout git biệt lập với tính năng tự động tạo ảnh chụp nhanh và dọn dẹp
title: Các cây làm việc được quản lý
x-i18n:
    generated_at: "2026-07-12T07:54:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Các worktree được quản lý cung cấp cho tác vụ của agent một nhánh git và checkout riêng mà không đặt thư mục tạm thời bên trong kho lưu trữ nguồn. OpenClaw tạo chúng trong thư mục trạng thái, ghi chúng vào cơ sở dữ liệu trạng thái dùng chung và chụp nhanh nội dung của các tệp được theo dõi cùng các tệp không được theo dõi và không bị bỏ qua trước khi xóa.

## Bố cục và tên

Mỗi worktree nằm tại:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Dấu vân tay của kho lưu trữ là 16 ký tự thập lục phân đầu tiên của hàm băm SHA-256 trên thư mục git chung chuẩn hóa và URL origin. Tên được cung cấp phải khớp với `[a-z0-9][a-z0-9-]{0,63}`. Nếu không có tên, OpenClaw tạo `wt-` theo sau bởi tám ký tự thập lục phân ngẫu nhiên.

OpenClaw tạo nhánh `openclaw/<name>` tại ref cơ sở được yêu cầu. Nếu không có ref cơ sở, hệ thống tìm nạp `origin`, sử dụng nhánh mặc định từ xa khi có và chuyển sang dùng `HEAD` cục bộ khi kho lưu trữ ngoại tuyến hoặc không có remote khả dụng.

## Cấp phát các tệp bị bỏ qua

Thêm `.worktreeinclude` tại thư mục gốc của kho lưu trữ nguồn để sao chép các tệp không được theo dõi và bị bỏ qua đã chọn vào một worktree mới. Tệp sử dụng cú pháp mẫu gitignore, mỗi dòng một mẫu, với chú thích `#`:

```gitignore
.env.local
fixtures/generated/**
```

Chỉ các tệp được git báo cáo là vừa bị bỏ qua vừa không được theo dõi mới đủ điều kiện. Các tệp được theo dõi đã hiện diện thông qua git và không bao giờ được bước này sao chép. OpenClaw không ghi đè các tệp đích hoặc đi theo các thư mục liên kết tượng trưng, đồng thời giữ nguyên chế độ tệp đã sao chép.

## Chạy thiết lập kho lưu trữ

Nếu `.openclaw/worktree-setup.sh` tồn tại trong kho lưu trữ nguồn và có thể thực thi, OpenClaw chạy tệp đó với worktree mới làm thư mục hiện tại. Script nhận:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Mã thoát khác 0 sẽ hủy quá trình tạo và xóa worktree cùng nhánh mới. Đây là hợp đồng cục bộ của kho lưu trữ; không có khóa cấu hình OpenClaw dành cho nó.

## Worktree của phiên

Bắt đầu một cuộc trò chuyện biệt lập từ không gian làm việc git của agent đang hoạt động bằng một phiên dựa trên worktree: bật **Worktree** trên trang Phiên mới của Control UI (trang này cũng cung cấp bộ chọn nhánh cơ sở và tên worktree tùy chọn), hoặc sử dụng menu thao tác Trò chuyện trên iOS hay thao tác bổ sung bên cạnh Trò chuyện mới trên Android. Tùy chọn này chỉ khả dụng đối với agent dựa trên git khi máy khách có khả năng đó; các máy khách không thể kiểm tra trước sẽ hiển thị lỗi Gateway thay thế.

Các agent lập trình cũng có thể gọi `spawn_task` khi phát hiện công việc tiếp theo đã được xác nhận nằm ngoài tác vụ hiện tại. Control UI hiển thị một thẻ gợi ý mà không bắt đầu bất kỳ điều gì, trong khi TUI dựa trên Gateway hiển thị lời nhắc tương tác với các thao tác tương tự. Việc chọn **Bắt đầu trong worktree** sẽ tạo một worktree mới do phiên sở hữu từ dự án được đề xuất và gửi lời nhắc độc lập làm lượt đầu tiên; việc bỏ qua gợi ý không làm thay đổi kho lưu trữ. Các gợi ý và ID của chúng chỉ tồn tại tạm thời và không còn sau khi Gateway khởi động lại.

OpenClaw chỉ cung cấp các công cụ này cho phiên của người vận hành có giao diện người dùng Gateway cho phép thao tác. Các phiên kênh và phiên TUI cục bộ/nhúng không nhận được chúng cho đến khi những bề mặt đó có hợp đồng thao tác tác vụ có kiểu và khả chuyển.

Worktree được quản lý tạo ra thuộc sở hữu của phiên và mọi lần chạy agent trong phiên đó đều sử dụng checkout của nó. Khi không gian làm việc là thư mục con của kho lưu trữ, worktree được neo tại thư mục gốc của kho lưu trữ và phiên chạy từ thư mục con tương ứng bên trong đó. Việc tạo worktree của phiên sử dụng phạm vi `operator.write` của phương thức, nhưng bước `.openclaw/worktree-setup.sh` chỉ chạy đối với bên gọi có `operator.admin` vì nó thực thi mã của kho lưu trữ; việc cấp phát `.worktreeinclude` vẫn áp dụng cho mọi bên gọi. Việc xóa phiên chỉ xóa worktree khi thao tác đó không gây mất dữ liệu. Các worktree có thay đổi chưa ghi nhận hoặc các nhánh có commit chưa đẩy vẫn được giữ lại; quá trình dọn dẹp hằng giờ chụp nhanh các worktree của phiên sau 7 ngày không hoạt động, đồng thời xem hoạt động phiên gần đây là hoạt động worktree. Các worktree đã xóa vẫn có thể được khôi phục từ ảnh chụp nhanh như mô tả bên dưới.

`sessions.create` có thể bao gồm một `cwd` tuyệt đối cùng với `worktree: true` khi tác vụ nhắm đến dự án khác với không gian làm việc đã cấu hình của agent. Đường dẫn máy chủ được chỉ định rõ đó yêu cầu `operator.admin`; việc tạo cuộc trò chuyện worktree thông thường vẫn dùng `operator.write` và vẫn được neo vào không gian làm việc đã cấu hình.

`sessions.create` cũng chấp nhận `worktreeBaseRef` và `worktreeName` cùng với `worktree: true` để chọn ref cơ sở và tên worktree (nhánh trở thành `openclaw/<name>`); cả hai vẫn thuộc `operator.write`. Worktree đã tạo được trả về trong kết quả tạo và được lưu bền vững trên hàng của phiên dưới dạng `worktree: { id, branch, repoRoot }`, để danh sách phiên có thể hiển thị checkout và nhánh. Việc xóa phiên báo cáo checkout có thay đổi chưa ghi nhận được giữ lại dưới dạng `worktreePreserved` thay vì âm thầm để lại nó.

## Ảnh chụp nhanh, dọn dẹp và khôi phục

Trước tiên, thao tác xóa tạo một commit tổng hợp chứa các tệp được theo dõi và các tệp không được theo dõi nhưng không bị bỏ qua, rồi ghim commit đó tại `refs/openclaw/snapshots/<id>`. Các tệp bị git bỏ qua không được đưa vào cơ sở dữ liệu đối tượng của kho lưu trữ; các tệp được `.worktreeinclude` chọn sẽ được sao chép lại trong quá trình khôi phục. Nếu việc tạo ảnh chụp nhanh thất bại, thao tác xóa sẽ dừng. Thao tác buộc xóa rõ ràng có thể tiếp tục mà không cần ảnh chụp nhanh.

OpenClaw áp dụng các quy tắc dọn dẹp sau:

- Khi lần chạy kết thúc, hệ thống chỉ xóa worktree khi `git status --porcelain` trống và `git log HEAD --not --remotes --oneline` không tìm thấy commit chưa đẩy. Nếu không, hệ thống chỉ giải phóng khóa hoạt động.
- Quá trình dọn dẹp hằng giờ chụp nhanh và xóa các worktree không bị khóa do Workboard và phiên sở hữu đã không hoạt động hơn 7 ngày, kể cả khi có thay đổi chưa ghi nhận. Các worktree thủ công không bao giờ bị tự động xóa.
- Bản ghi ảnh chụp nhanh có thể được khôi phục trong 30 ngày. Sau đó, quá trình dọn dẹp xóa ref ảnh chụp nhanh và hàng trong sổ đăng ký.
- Khóa tiến trình OpenClaw đang hoạt động và mọi khóa worktree git ngoại lai hoặc không nhận dạng được sẽ bảo vệ worktree khỏi quá trình thu gom rác.

Quá trình khôi phục tạo lại `openclaw/<name>` tại commit ban đầu trước ảnh chụp nhanh, sau đó dựng lại các khác biệt của ảnh chụp nhanh dưới dạng thay đổi chưa được đưa vào vùng tạm và các tệp không được theo dõi. Cách này giữ commit ảnh chụp nhanh tổng hợp nằm ngoài lịch sử nhánh. Ref ảnh chụp nhanh vẫn được ghi lại làm thông tin nguồn gốc.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Trang **Worktree** của Control UI trong phần Cài đặt cung cấp các thao tác tương tự cùng khả năng tạo bằng bộ chọn nhánh cơ sở, hiển thị chủ sở hữu của từng worktree (thủ công, Workboard hoặc phiên sở hữu kèm liên kết đến cuộc trò chuyện của phiên đó) và cung cấp tùy chọn buộc thử lại khi thao tác xóa báo cáo việc chụp nhanh thất bại.

## Các phương thức Gateway

| Phương thức           | Mục đích                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `worktrees.list`     | Liệt kê các bản ghi worktree đang hoạt động và có thể khôi phục.                         |
| `worktrees.branches` | Liệt kê các nhánh cục bộ và từ xa của kho lưu trữ cho bộ chọn ref cơ sở.                 |
| `worktrees.create`   | Tạo hoặc sử dụng lại một worktree được quản lý có tên.                                   |
| `worktrees.remove`   | Chụp nhanh và xóa một worktree. Thao tác buộc xóa báo cáo `snapshotError`.               |
| `worktrees.restore`  | Khôi phục một worktree đã xóa từ ảnh chụp nhanh của nó.                                  |
| `worktrees.gc`       | Chạy ngay quá trình dọn dẹp trạng thái không hoạt động, mồ côi và hết thời hạn lưu giữ.  |

`worktrees.list` yêu cầu `operator.read`, còn các phương thức thay đổi trạng thái yêu cầu `operator.admin`. `worktrees.branches` cần `operator.write` đối với không gian làm việc đã cấu hình của agent, trong khi mọi đường dẫn máy chủ khác yêu cầu `operator.admin` (phù hợp với ngưỡng `cwd` của `sessions.create`). Phương thức này chỉ đọc các ref hiện có và không bao giờ tìm nạp, còn các nhánh chỉ tồn tại từ xa được trả về với định danh remote (`origin/feature-a`) để mọi tên trả về đều phân giải được thành ref cơ sở.

## Không gian làm việc Workboard

[Plugin Workboard](/vi/plugins/workboard) được đóng gói có thể hiện thực hóa không gian làm việc của thẻ dưới dạng worktree được quản lý:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` xác định checkout git nguồn. `branch` là tùy chọn và trở thành ref cơ sở. Khi quá trình điều phối khởi động worker của thẻ, Workboard tạo hoặc sử dụng lại `wb-<card-id>`, chạy agent con với checkout được quản lý làm thư mục làm việc và ghi đường dẫn cùng nhánh đã phân giải trở lại thẻ. Việc hiện thực hóa được kích hoạt qua Gateway yêu cầu `operator.admin`. Khi lần chạy kết thúc, Workboard chỉ xóa checkout khi có thể chứng minh rằng thao tác đó không gây mất dữ liệu; công việc có thay đổi chưa ghi nhận hoặc các commit chưa đẩy vẫn được giữ lại.

Các agent nhúng trong sandbox hiện từ chối thư mục làm việc của tác vụ nằm ngoài không gian làm việc agent đã cấu hình. Hãy sử dụng agent đích không chạy trong sandbox cho các thẻ dùng worktree được quản lý của Workboard cho đến khi môi trường thực thi sandbox hỗ trợ gắn kết checkout bổ sung.
