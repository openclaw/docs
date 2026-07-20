---
read_when:
    - Bạn muốn có một nhánh và bản checkout biệt lập cho một tác vụ của agent
    - Bạn đang cấu hình các thẻ Workboard với không gian làm việc worktree
    - Bạn cần khôi phục hoặc dọn dẹp một worktree do OpenClaw quản lý
summary: Chạy các tác vụ của tác nhân trong các bản checkout git biệt lập với tính năng tự động tạo ảnh chụp nhanh và dọn dẹp
title: Các worktree được quản lý
x-i18n:
    generated_at: "2026-07-20T04:24:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8541b95eb264950f6ff248da0a5c4ab5fa0881a90d5f782bc1e33edd0a0c5d2
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Các worktree được quản lý cung cấp cho tác vụ của agent một nhánh git và bản checkout riêng mà không đặt thư mục tạm thời bên trong kho lưu trữ nguồn. OpenClaw tạo chúng trong thư mục trạng thái của mình, ghi nhận chúng trong cơ sở dữ liệu trạng thái dùng chung và chụp nhanh nội dung được theo dõi cùng nội dung chưa được theo dõi nhưng không bị bỏ qua trước khi xóa.

## Bố cục và tên

Mỗi worktree nằm tại:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Dấu vân tay của kho lưu trữ là 16 ký tự thập lục phân đầu tiên của hàm băm SHA-256 trên thư mục dùng chung git chuẩn hóa và URL origin. Tên được cung cấp phải khớp với `[a-z0-9][a-z0-9-]{0,63}`. Khi không có tên, OpenClaw tạo `wt-`, theo sau là tám ký tự thập lục phân ngẫu nhiên.

OpenClaw tạo nhánh `openclaw/<name>` tại ref cơ sở được yêu cầu. Khi không có ref cơ sở, hệ thống tìm nạp `origin`, sử dụng nhánh mặc định từ xa nếu có và chuyển sang `HEAD` cục bộ khi kho lưu trữ ngoại tuyến hoặc không có remote khả dụng.

## Cấp phát các tệp bị bỏ qua

Thêm `.worktreeinclude` tại thư mục gốc của kho lưu trữ nguồn để sao chép các tệp chưa được theo dõi và bị bỏ qua đã chọn vào worktree mới. Tệp sử dụng cú pháp mẫu gitignore, mỗi dòng một mẫu, với các chú thích `#`:

```gitignore
.env.local
fixtures/generated/**
```

Chỉ những tệp được git báo cáo là vừa bị bỏ qua vừa chưa được theo dõi mới đủ điều kiện. Các tệp được theo dõi đã có sẵn thông qua git và không bao giờ được bước này sao chép. OpenClaw không ghi đè hoặc thay đổi các tệp đích đã tồn tại, không đi theo các thư mục là liên kết tượng trưng và giữ nguyên chế độ tệp đã sao chép. Hệ thống chỉ ghi nhận các đường dẫn mà nó thực sự tạo, vì vậy các lần chỉnh sửa manifest sau này không thể khiến những tệp đó mất khả năng được bảo vệ khi dọn dẹp.

## Chạy thiết lập kho lưu trữ

Nếu `.openclaw/worktree-setup.sh` tồn tại trong kho lưu trữ nguồn và có thể thực thi, OpenClaw chạy tệp đó với worktree mới làm thư mục hiện tại. Tập lệnh nhận:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Mã thoát khác 0 sẽ hủy quá trình tạo và xóa worktree cùng nhánh mới. Đây là hợp đồng cục bộ của kho lưu trữ; không có khóa cấu hình OpenClaw dành cho nó.

## Worktree của phiên

Bắt đầu một cuộc trò chuyện biệt lập từ không gian làm việc git của agent đang hoạt động bằng phiên dựa trên worktree: bật **Worktree** trên trang New session của Control UI (trang này cũng cung cấp bộ chọn nhánh cơ sở và tên worktree tùy chọn), hoặc sử dụng menu Chat actions trên iOS hay thao tác bổ sung bên cạnh New Chat trên Android. Tùy chọn này chỉ khả dụng cho agent dựa trên git khi máy khách có khả năng đó; các máy khách không thể kiểm tra trước sẽ hiển thị lỗi Gateway thay thế.

Các agent lập trình cũng có thể gọi `spawn_task` khi phát hiện công việc tiếp theo đã được xác nhận nằm ngoài tác vụ hiện tại. Control UI hiển thị một thẻ gợi ý mà không khởi động bất kỳ thứ gì, trong khi TUI dựa trên Gateway hiển thị lời nhắc tương tác với cùng các thao tác. Việc chọn **Start in worktree** sẽ tạo một worktree mới thuộc sở hữu của phiên từ dự án được đề xuất và gửi lời nhắc độc lập làm lượt đầu tiên; việc bỏ qua đề xuất sẽ không tác động đến kho lưu trữ. Các đề xuất và ID của chúng chỉ tồn tại tạm thời và không còn sau khi Gateway khởi động lại.

OpenClaw chỉ cung cấp các công cụ này cho phiên của người vận hành có giao diện người dùng Gateway có thể thao tác. Phiên kênh và phiên TUI cục bộ/nhúng không nhận được chúng cho đến khi các bề mặt đó có hợp đồng thao tác tác vụ có kiểu và khả chuyển.

Worktree được quản lý tạo thành thuộc sở hữu của phiên và mọi lần chạy agent trong phiên đó đều sử dụng bản checkout của nó. Khi không gian làm việc là thư mục con của kho lưu trữ, worktree được neo tại thư mục gốc của kho lưu trữ và phiên chạy từ thư mục con tương ứng bên trong. Quá trình tạo worktree của phiên sử dụng phạm vi `operator.write` của phương thức, nhưng các hook checkout của kho lưu trữ và bước `.openclaw/worktree-setup.sh` chỉ chạy cho bên gọi `operator.admin` vì chúng thực thi mã của kho lưu trữ; việc cấp phát `.worktreeinclude` vẫn áp dụng cho mọi bên gọi. Việc xóa phiên chỉ xóa worktree khi có thể thực hiện mà không mất dữ liệu. Các worktree bẩn hoặc nhánh có commit chưa đẩy vẫn được giữ lại; quy trình dọn dẹp hàng giờ chụp nhanh các worktree của phiên sau 7 ngày không hoạt động, coi hoạt động phiên gần đây là hoạt động của worktree. Các worktree đã xóa vẫn có thể được khôi phục từ ảnh chụp nhanh như mô tả bên dưới.

`sessions.create` có thể bao gồm `cwd` tuyệt đối cùng với `worktree: true` khi một tác vụ nhắm đến dự án khác với không gian làm việc agent đã cấu hình. Đường dẫn máy chủ tường minh đó yêu cầu `operator.admin`; việc tạo cuộc trò chuyện worktree thông thường vẫn là `operator.write` và tiếp tục được neo vào không gian làm việc đã cấu hình.

`sessions.create` cũng chấp nhận `worktreeBaseRef` và `worktreeName` cùng với `worktree: true` để chọn ref cơ sở và tên worktree (nhánh trở thành `openclaw/<name>`); cả hai vẫn ở `operator.write`. Worktree đã tạo được trả về trong kết quả tạo và được lưu trên hàng phiên dưới dạng `worktree: { id, branch, repoRoot }`, nhờ đó danh sách phiên có thể hiển thị bản checkout và nhánh. Khi xóa phiên, một bản checkout bẩn được giữ lại sẽ được báo cáo dưới dạng `worktreePreserved` thay vì âm thầm bị bỏ lại.

## Ảnh chụp nhanh, dọn dẹp và khôi phục

Trước tiên, quá trình xóa tạo một commit tổng hợp chứa các tệp được theo dõi và các tệp chưa được theo dõi nhưng không bị bỏ qua, sau đó ghim commit đó tại `refs/openclaw/snapshots/<id>`. Các tệp bị bỏ qua không bao giờ được đưa vào cơ sở dữ liệu đối tượng của kho lưu trữ. OpenClaw chỉ lưu trữ các tệp bị bỏ qua mà nó thực sự đã cấp phát trong các hàng cơ sở dữ liệu trạng thái dùng chung được chia thành từng phần; tập hợp đường dẫn đã ghi nhận vẫn là nguồn có thẩm quyền ngay cả khi `.worktreeinclude` sau đó thay đổi hoặc biến mất. Quá trình khôi phục đọc các byte đó từ ảnh chụp nhanh bất biến và áp dụng lại đầy đủ chế độ của chúng. Quy trình dọn dẹp tự động giữ nguyên một worktree đang hoạt động khi không còn có thể chụp nhanh an toàn một đường dẫn đã ghi nhận. Nếu việc tạo ảnh chụp nhanh thất bại, quá trình xóa sẽ dừng. Thao tác buộc xóa tường minh có thể tiếp tục mà không cần ảnh chụp nhanh.

OpenClaw áp dụng các quy tắc dọn dẹp sau:

- Khi kết thúc lần chạy, hệ thống chỉ xóa worktree khi `git status --porcelain` trống và `git log HEAD --not --remotes --oneline` không tìm thấy commit chưa đẩy. Nếu không, hệ thống chỉ giải phóng khóa hoạt động.
- Quy trình dọn dẹp hàng giờ chụp nhanh và xóa các worktree không bị khóa thuộc sở hữu của Workboard và phiên đã không hoạt động quá 7 ngày, ngay cả khi chúng đang bẩn. Worktree thủ công không bao giờ tự động bị xóa.
- Các bản ghi ảnh chụp nhanh vẫn có thể khôi phục trong 30 ngày. Sau đó, quy trình dọn dẹp xóa ref ảnh chụp nhanh và hàng đăng ký.
- Khóa của tiến trình OpenClaw đang hoạt động và mọi khóa git worktree ngoại lai hoặc không được nhận dạng đều bảo vệ worktree khỏi việc thu gom rác.

Quá trình khôi phục tạo lại `openclaw/<name>` tại commit ban đầu trước ảnh chụp nhanh, sau đó tái tạo các khác biệt của ảnh chụp nhanh thành các thay đổi chưa được đưa vào vùng tạm và các tệp chưa được theo dõi. Điều này giữ commit ảnh chụp nhanh tổng hợp ở ngoài lịch sử nhánh. Ref ảnh chụp nhanh vẫn được ghi nhận làm thông tin nguồn gốc.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Trang **Worktrees** của Control UI trong Settings cung cấp các thao tác tương tự, cộng thêm khả năng tạo bằng bộ chọn nhánh cơ sở, hiển thị chủ sở hữu của từng worktree (thủ công, Workboard hoặc phiên sở hữu với liên kết đến cuộc trò chuyện của phiên đó) và cung cấp tùy chọn buộc thử lại khi thao tác xóa báo cáo ảnh chụp nhanh thất bại.

## Các phương thức Gateway

| Phương thức               | Mục đích                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Liệt kê các bản ghi worktree đang hoạt động và có thể khôi phục.                            |
| `worktrees.branches` | Liệt kê các nhánh cục bộ và từ xa của kho lưu trữ cho bộ chọn ref cơ sở.    |
| `worktrees.create`   | Tạo hoặc tái sử dụng một worktree được quản lý có tên.                               |
| `worktrees.remove`   | Chụp nhanh và xóa một worktree. Thao tác buộc xóa báo cáo `snapshotError`. |
| `worktrees.restore`  | Khôi phục worktree đã xóa từ ảnh chụp nhanh của nó.                           |
| `worktrees.gc`       | Chạy ngay quy trình dọn dẹp trạng thái không hoạt động, mồ côi và hết thời hạn lưu giữ.                            |

`worktrees.list` yêu cầu `operator.read`, còn các phương thức thay đổi dữ liệu yêu cầu `operator.admin`. `worktrees.branches` cần `operator.write` đối với không gian làm việc agent đã cấu hình, trong khi mọi đường dẫn máy chủ khác yêu cầu `operator.admin` (khớp với ngưỡng cwd `sessions.create`). Phương thức này chỉ đọc các ref hiện có và không bao giờ tìm nạp; các nhánh chỉ có từ xa được trả về với tên định danh từ xa (`origin/feature-a`) để mọi tên được trả về đều phân giải được dưới dạng ref cơ sở.

## Không gian làm việc Workboard

[Plugin Workboard](/vi/plugins/workboard) đi kèm có thể hiện thực hóa không gian làm việc của một thẻ dưới dạng worktree được quản lý:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` xác định bản checkout git nguồn. `branch` là tùy chọn và trở thành ref cơ sở. Đối với bên gọi có toàn quyền trên máy chủ, Workboard tạo hoặc tái sử dụng `wb-<card-id>`, chạy subagent với bản checkout được quản lý làm thư mục làm việc và ghi đường dẫn cùng nhánh đã phân giải trở lại thẻ. Các máy khách Gateway cần `operator.admin` để hiện thực hóa với toàn quyền trên máy chủ. Khi kết thúc lần chạy, Workboard chỉ xóa bản checkout khi có thể chứng minh rằng không mất dữ liệu; công việc bẩn hoặc commit chưa đẩy vẫn được giữ lại.

Đối với bên gọi bị ràng buộc vào không gian làm việc, `path` và thư mục gốc của kho lưu trữ phải khớp chính xác với không gian làm việc agent đích. Sau đó, Workboard chạy trực tiếp trong thư mục đó và ghi nhận một không gian làm việc dạng thư mục thay vì hiện thực hóa worktree được quản lý trên máy chủ. Đích phải sử dụng sandbox Docker có thể ghi, không dùng chung cho cùng không gian làm việc; hàm băm container đang hoạt động của nó phải khớp với các mount và chính sách được yêu cầu; đồng thời không được để lộ khả năng thực thi nâng cao, quyền kiểm soát máy chủ, phiên trên toàn máy chủ, khả năng thực thi được duy trì trên máy chủ/Node hoặc các công cụ Plugin và MCP chưa được phân loại. Nếu chính sách đích hoặc container đang hoạt động có phạm vi rộng hơn, quá trình điều phối sẽ để thẻ ở trạng thái chưa được nhận và báo cáo trạng thái không tương thích.
