---
read_when:
    - Bạn muốn một nhánh và bản checkout biệt lập cho một tác vụ của agent
    - Bạn đang cấu hình các thẻ Workboard với không gian làm việc worktree
    - Bạn cần khôi phục hoặc dọn dẹp một worktree do OpenClaw quản lý
summary: Chạy các tác vụ agent trong các bản checkout git biệt lập với tính năng tự động tạo snapshot và dọn dẹp
title: Worktree được quản lý
x-i18n:
    generated_at: "2026-07-19T05:43:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ea2627869b2bdae70afd312f02ce26cd5c8caf72a15ce4416584103c65a7dcf
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Worktree được quản lý cung cấp cho tác vụ của tác nhân một nhánh git và bản checkout riêng mà không đặt các thư mục tạm thời bên trong kho lưu trữ nguồn. OpenClaw tạo chúng trong thư mục trạng thái, ghi chúng vào cơ sở dữ liệu trạng thái dùng chung và tạo snapshot nội dung của các tệp được theo dõi cùng các tệp không được theo dõi nhưng không bị bỏ qua trước khi xóa.

## Bố cục và tên

Mỗi worktree nằm tại:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Dấu vân tay của kho lưu trữ là 16 ký tự thập lục phân đầu tiên của hàm băm SHA-256 trên thư mục git dùng chung chuẩn hóa và URL origin. Tên được cung cấp phải khớp với `[a-z0-9][a-z0-9-]{0,63}`. Khi không có tên, OpenClaw tạo `wt-` theo sau là tám ký tự thập lục phân ngẫu nhiên.

OpenClaw tạo nhánh `openclaw/<name>` tại ref cơ sở được yêu cầu. Khi không có ref cơ sở, hệ thống tìm nạp `origin`, sử dụng nhánh mặc định từ xa khi có thể và dự phòng sang `HEAD` cục bộ khi kho lưu trữ ngoại tuyến hoặc không có remote khả dụng.

## Cấp phát các tệp bị bỏ qua

Thêm `.worktreeinclude` vào thư mục gốc của kho lưu trữ nguồn để sao chép các tệp không được theo dõi và bị bỏ qua đã chọn vào một worktree mới. Tệp sử dụng cú pháp mẫu gitignore, mỗi dòng một mẫu, với chú thích `#`:

```gitignore
.env.local
fixtures/generated/**
```

Chỉ các tệp được git báo cáo là vừa bị bỏ qua vừa không được theo dõi mới đủ điều kiện. Các tệp được theo dõi đã hiện diện thông qua git và không bao giờ được sao chép ở bước này. OpenClaw không ghi đè hoặc thay đổi các tệp đích đã tồn tại, không đi theo các thư mục liên kết tượng trưng và giữ nguyên chế độ tệp đã sao chép. Hệ thống chỉ ghi lại các đường dẫn mà nó thực sự tạo, vì vậy những lần chỉnh sửa manifest sau đó không thể khiến các tệp đó mất khả năng bảo vệ khi dọn dẹp.

## Chạy thiết lập kho lưu trữ

Nếu `.openclaw/worktree-setup.sh` tồn tại trong kho lưu trữ nguồn và có thể thực thi, OpenClaw chạy tệp đó với worktree mới làm thư mục hiện tại. Tập lệnh nhận:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Mã thoát khác 0 sẽ hủy quá trình tạo và xóa worktree cùng nhánh mới. Đây là hợp đồng cục bộ của kho lưu trữ; không có khóa cấu hình OpenClaw cho hợp đồng này.

## Worktree của phiên

Bắt đầu một cuộc trò chuyện cô lập từ không gian làm việc git của tác nhân đang hoạt động bằng phiên dựa trên worktree: bật **Worktree** trên trang New session của Control UI (trang này cũng cung cấp bộ chọn nhánh cơ sở và tên worktree tùy chọn), hoặc dùng menu Chat actions trên iOS hay thao tác tràn bên cạnh New Chat trên Android. Tùy chọn này chỉ khả dụng cho tác nhân dựa trên git khi máy khách có khả năng đó; các máy khách không thể kiểm tra trước sẽ hiển thị lỗi Gateway thay thế.

Các tác nhân lập trình cũng có thể gọi `spawn_task` khi phát hiện công việc tiếp nối đã được xác nhận nằm ngoài tác vụ hiện tại. Control UI hiển thị một thẻ gợi ý mà không khởi động gì, còn TUI dựa trên Gateway hiển thị lời nhắc tương tác với các thao tác tương tự. Việc chọn **Start in worktree** sẽ tạo một worktree mới do phiên sở hữu từ dự án được đề xuất và gửi lời nhắc độc lập làm lượt đầu tiên; việc bỏ qua gợi ý không làm thay đổi kho lưu trữ. Các gợi ý và ID của chúng chỉ tồn tại tạm thời và không tồn tại qua lần khởi động lại Gateway.

OpenClaw chỉ cung cấp các công cụ này cho những phiên vận hành có giao diện người dùng Gateway có thể thao tác. Các phiên kênh và phiên TUI cục bộ/nhúng không nhận được chúng cho đến khi các bề mặt đó có hợp đồng thao tác tác vụ kiểu hóa có tính khả chuyển.

Worktree được quản lý tạo ra thuộc sở hữu của phiên và mọi lần chạy tác nhân trong phiên đó đều sử dụng bản checkout của nó. Khi không gian làm việc là thư mục con của kho lưu trữ, worktree được neo tại thư mục gốc của kho lưu trữ và phiên chạy từ thư mục con tương ứng bên trong đó. Việc tạo worktree phiên sử dụng phạm vi `operator.write` của phương thức, nhưng các hook checkout của kho lưu trữ và bước `.openclaw/worktree-setup.sh` chỉ chạy cho các bên gọi `operator.admin` vì chúng thực thi mã của kho lưu trữ; việc cấp phát `.worktreeinclude` vẫn áp dụng cho mọi bên gọi. Việc xóa phiên chỉ xóa worktree khi có thể thực hiện mà không mất dữ liệu. Worktree có thay đổi chưa lưu hoặc nhánh có commit chưa đẩy vẫn được giữ lại; quá trình dọn dẹp hằng giờ tạo snapshot cho worktree phiên sau 7 ngày không hoạt động, xem hoạt động phiên gần đây là hoạt động của worktree. Các worktree đã xóa vẫn có thể được khôi phục từ snapshot như mô tả bên dưới.

`sessions.create` có thể bao gồm một `cwd` tuyệt đối cùng với `worktree: true` khi tác vụ nhắm đến dự án khác với không gian làm việc đã cấu hình của tác nhân. Đường dẫn máy chủ rõ ràng đó yêu cầu `operator.admin`; việc tạo cuộc trò chuyện worktree thông thường vẫn là `operator.write` và vẫn được neo vào không gian làm việc đã cấu hình.

`sessions.create` cũng chấp nhận `worktreeBaseRef` và `worktreeName` cùng với `worktree: true` để chọn ref cơ sở và tên worktree (nhánh trở thành `openclaw/<name>`); cả hai vẫn ở `operator.write`. Worktree đã tạo được trả về trong kết quả tạo và được lưu bền vững trên hàng phiên dưới dạng `worktree: { id, branch, repoRoot }`, để danh sách phiên có thể hiển thị bản checkout và nhánh. Việc xóa phiên báo cáo bản checkout có thay đổi chưa lưu được giữ lại dưới dạng `worktreePreserved` thay vì âm thầm để lại.

## Snapshot, dọn dẹp và khôi phục

Trước tiên, quá trình xóa tạo một commit tổng hợp chứa các tệp được theo dõi và các tệp không được theo dõi nhưng không bị bỏ qua, sau đó ghim commit đó tại `refs/openclaw/snapshots/<id>`. Các tệp bị bỏ qua không bao giờ đi vào cơ sở dữ liệu đối tượng của kho lưu trữ. OpenClaw chỉ lưu các tệp bị bỏ qua mà hệ thống thực sự đã cấp phát trong các hàng cơ sở dữ liệu trạng thái dùng chung được chia thành từng phần; tập hợp đường dẫn đã ghi vẫn là nguồn có thẩm quyền ngay cả khi `.worktreeinclude` sau đó thay đổi hoặc biến mất. Quá trình khôi phục đọc các byte đó từ snapshot bất biến và áp dụng lại đầy đủ chế độ của chúng. Quá trình dọn dẹp tự động giữ nguyên worktree đang hoạt động khi một đường dẫn đã ghi không còn có thể được tạo snapshot một cách an toàn. Nếu việc tạo snapshot thất bại, quá trình xóa sẽ dừng. Thao tác buộc xóa rõ ràng có thể tiếp tục mà không cần snapshot.

OpenClaw áp dụng các quy tắc dọn dẹp sau:

- Khi kết thúc lần chạy, hệ thống chỉ xóa worktree khi `git status --porcelain` trống và `git log HEAD --not --remotes --oneline` không tìm thấy commit chưa đẩy. Nếu không, hệ thống chỉ giải phóng khóa hoạt động.
- Quá trình dọn dẹp hằng giờ tạo snapshot và xóa các worktree do Workboard và phiên sở hữu, không bị khóa và không hoạt động trong hơn 7 ngày, ngay cả khi có thay đổi chưa lưu. Worktree thủ công không bao giờ bị tự động xóa.
- Khi `worktrees.cleanup.maxCount` hoặc `worktrees.cleanup.maxTotalSizeGb` được cấu hình, quá trình dọn dẹp cũng tạo snapshot và xóa các worktree do Workboard và phiên sở hữu có hoạt động gần nhất lâu nhất cho đến khi tổng số lượng và kích thước đĩa nằm trong giới hạn. Mọi worktree được quản lý đều được tính vào tổng số, nhưng worktree thủ công và các worktree được bảo vệ theo cách khác không bao giờ bị loại bỏ do giới hạn, vì vậy giới hạn có thể vẫn bị vượt cho đến khi có worktree đủ điều kiện. 0 hoặc không đặt sẽ vô hiệu hóa giới hạn.
- Các bản ghi snapshot vẫn có thể khôi phục trong 30 ngày. Sau đó, quá trình dọn dẹp xóa ref snapshot và hàng registry.
- Khóa của một tiến trình OpenClaw đang hoạt động và mọi khóa git worktree ngoại lai hoặc không được nhận dạng sẽ bảo vệ worktree khỏi bị thu gom rác.

Quá trình khôi phục tạo lại `openclaw/<name>` tại commit ban đầu trước snapshot, sau đó dựng lại các khác biệt của snapshot dưới dạng thay đổi chưa được stage và các tệp không được theo dõi. Điều này giữ commit snapshot tổng hợp nằm ngoài lịch sử nhánh. Ref snapshot vẫn được ghi lại làm thông tin nguồn gốc.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Trang **Worktrees** của Control UI trong Settings cung cấp các thao tác tương tự cùng khả năng tạo bằng bộ chọn nhánh cơ sở, hiển thị chủ sở hữu của từng worktree (thủ công, Workboard hoặc phiên sở hữu kèm liên kết đến cuộc trò chuyện của phiên đó) và cung cấp tùy chọn buộc thử lại khi thao tác xóa báo lỗi snapshot. Phần **Cleanup** cho phép chỉnh sửa các giới hạn lưu giữ `worktrees.cleanup` được mô tả trong [tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference#worktrees).

## Các phương thức Gateway

| Phương thức               | Mục đích                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Liệt kê các bản ghi worktree đang hoạt động và có thể khôi phục.                            |
| `worktrees.branches` | Liệt kê các nhánh cục bộ và từ xa của kho lưu trữ cho bộ chọn ref cơ sở.    |
| `worktrees.create`   | Tạo hoặc tái sử dụng một worktree được quản lý có tên.                               |
| `worktrees.remove`   | Tạo snapshot và xóa worktree. Các thao tác buộc xóa báo cáo `snapshotError`. |
| `worktrees.restore`  | Khôi phục worktree đã xóa từ snapshot của nó.                           |
| `worktrees.gc`       | Chạy ngay quá trình dọn dẹp trạng thái không hoạt động, mồ côi và lưu giữ.                            |

`worktrees.list` yêu cầu `operator.read`, và các phương thức thay đổi dữ liệu yêu cầu `operator.admin`. `worktrees.branches` cần `operator.write` đối với không gian làm việc tác nhân đã cấu hình, trong khi mọi đường dẫn máy chủ khác yêu cầu `operator.admin` (khớp với ngưỡng cwd `sessions.create`). Phương thức này chỉ đọc các ref hiện có và không bao giờ tìm nạp, còn các nhánh chỉ có trên remote được trả về với định danh remote (`origin/feature-a`) để mọi tên được trả về đều phân giải được dưới dạng ref cơ sở.

## Không gian làm việc Workboard

[Plugin Workboard](/vi/plugins/workboard) đi kèm có thể hiện thực hóa không gian làm việc của thẻ dưới dạng một worktree được quản lý:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` xác định bản checkout git nguồn. `branch` là tùy chọn và trở thành ref cơ sở. Đối với bên gọi có toàn quyền trên máy chủ, Workboard tạo hoặc tái sử dụng `wb-<card-id>`, chạy tác nhân con với bản checkout được quản lý làm thư mục làm việc và ghi đường dẫn cùng nhánh đã phân giải trở lại thẻ. Các máy khách Gateway cần `operator.admin` để hiện thực hóa với toàn quyền trên máy chủ. Khi kết thúc lần chạy, Workboard chỉ xóa bản checkout khi có thể chứng minh rằng thao tác đó không làm mất dữ liệu; công việc có thay đổi chưa lưu hoặc commit chưa đẩy vẫn được giữ lại.

Đối với bên gọi bị giới hạn trong không gian làm việc, `path` và thư mục gốc của kho lưu trữ phải khớp chính xác với không gian làm việc của tác nhân đích. Sau đó, Workboard chạy trực tiếp trong thư mục đó và ghi lại một không gian làm việc thư mục thay vì hiện thực hóa một worktree được quản lý trên máy chủ. Đích phải sử dụng sandbox Docker có thể ghi, không dùng chung cho cùng không gian làm việc; hàm băm container đang hoạt động của nó phải khớp với các mount và chính sách được yêu cầu; đồng thời nó không được cung cấp khả năng thực thi nâng cao, quyền kiểm soát máy chủ, phiên trên toàn máy chủ, khả năng thực thi bền vững trên máy chủ/Node hoặc các công cụ Plugin và MCP chưa được phân loại. Nếu chính sách đích hoặc container đang hoạt động rộng hơn, quá trình điều phối sẽ để thẻ ở trạng thái chưa được nhận và báo cáo trạng thái không tương thích.
