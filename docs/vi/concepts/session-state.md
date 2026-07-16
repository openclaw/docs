---
read_when:
    - Bạn muốn các agent nhận biết khi con người hoặc các agent khác âm thầm thay đổi một phiên mà không cho chúng biết
    - Bạn đang gỡ lỗi các thông báo thay đổi trạng thái, con trỏ theo dõi hoặc `session_status` `changesSince`
    - Bạn muốn hiểu cách các tác tử cha duy trì đồng bộ với các phiên con
sidebarTitle: Session state awareness
summary: 'Nhật ký tín hiệu trạng thái phiên bền vững: phiên bản trạng thái, trình theo dõi, thông báo trạng thái lỗi thời và đối soát'
title: Nhận biết trạng thái phiên làm việc
x-i18n:
    generated_at: "2026-07-16T14:22:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Khi nhiều phiên cùng xử lý một vấn đề — một trình quản lý giao việc cho các phiên con, một người trực tiếp tham gia phiên worker, hai tác nhân phối hợp qua [`sessions_send`](/vi/concepts/session-tool) — mỗi phiên đều hình thành các giả định về những phiên khác. Các giả định đó trở nên lỗi thời ngay khi một chủ thể khác can thiệp. Khả năng nhận biết trạng thái phiên là cơ chế phát hiện sự can thiệp, thông báo một lần cho phiên bị ảnh hưởng và cung cấp cho phiên đó một cách ít tốn kém để cập nhật tình hình trước khi hành động.

Ba thành phần phối hợp với nhau:

1. Một **nhật ký tín hiệu bền vững** ghi lại các thay đổi trạng thái được chọn theo từng phiên.
2. **Các trình theo dõi** lưu con trỏ riêng cho từng đích và nhận một thông báo trạng thái lỗi thời đã được gộp.
3. **Đối soát** truy xuất chính xác phần chênh lệch qua `session_status` với `changesSince`.

## Nhật ký tín hiệu

OpenClaw thêm một sự kiện có kiểu vào cơ sở dữ liệu trạng thái dùng chung (`session_state_events`) khi một phiên đang được theo dõi có thay đổi đáng kể. Các sự kiện chứa siêu dữ liệu và bản tóm tắt một dòng — tuyệt đối không chứa nội dung tin nhắn.

| Loại                   | Thời điểm ghi nhận                                            | Thông báo cho trình theo dõi |
| ---------------------- | -------------------------------------------------------- | ----------------- |
| `human_direct_message` | Một người gửi lượt tương tác trực tiếp đến phiên đang được theo dõi       | Có               |
| `upstream_missing`     | Nguồn thượng nguồn của một phiên đã tiếp nhận biến mất          | Có               |
| `goal_changed`         | Trạng thái mục tiêu của phiên được tạo, cập nhật hoặc xóa | Có               |
| `child_spawned`        | Một phiên con của tác nhân phụ hoặc ACP được tạo              | Không (khởi tạo con trỏ) |
| `run_completed`        | Một lượt chạy con kết thúc thành công                            | Không (chỉ ghi nhật ký)     |
| `run_failed`           | Một lượt chạy con thất bại, hết thời gian chờ hoặc bị hủy            | Không (chỉ ghi nhật ký)     |
| `compacted`            | Lịch sử của phiên được nén                       | Không (chỉ ghi nhật ký)     |
| `adopted`              | Một phiên trong danh mục được tiếp nhận vào OpenClaw               | Không (chỉ ghi nhật ký)     |

Mỗi sự kiện xác định chủ thể của nó (`human`, `agent` hoặc `system`). Các lượt chạy con bị hủy và hết thời gian chờ được ghi nhận là lỗi, đồng thời kết quả chính xác (`cancelled`, `timeout` hoặc `error`) được giữ nguyên trong tải trọng sự kiện.

**Phiên bản trạng thái** của một phiên đơn giản là số thứ tự cao nhất trong nhật ký của phiên đó, được theo dõi trong một đầu phiên bền vững vẫn tồn tại sau khi lược bỏ dữ liệu. Các hàng `sessions_list` bao gồm `stateVersion` khi một phiên đã ghi nhật ký thay đổi; `session_status` luôn báo cáo giá trị này.

Các loại chỉ ghi nhật ký tồn tại để phục vụ lịch sử đối soát chứ không phải thông báo: việc chuyển thông báo hoàn tất thông thường của lượt chạy con vẫn thuộc trách nhiệm của [thông báo tác nhân phụ](/vi/tools/subagents), và nhật ký tín hiệu không bao giờ sao chép thông báo đó.

## Trình theo dõi

Trình theo dõi là một phiên giữ con trỏ (`session_watch_cursors`) trên một đích. Con trỏ đến từ hai nguồn:

- **Ngầm định (cạnh sinh phiên).** Khi một phiên sinh tác nhân phụ hoặc phiên con ACP, con trỏ của phiên cha tự động được khởi tạo tại phiên bản lúc sinh của phiên con. Phiên cha không bao giờ đăng ký theo dõi theo cách thủ công.
- **Tường minh (`sessions_send watch: true`).** Bất kỳ trình điều phối nào cũng có thể theo dõi một đích không được sinh ra: truyền `watch: true` cho `sessions_send`, và sau khi thao tác gửi được chuyển đi thành công, bên gửi được đăng ký làm trình theo dõi của phiên thực sự nhận tin nhắn. Việc đăng ký bắt đầu tại phiên bản trạng thái hiện tại của đích — lịch sử trước đó không bao giờ tạo thông báo. Kết quả công cụ báo cáo `watched: true|false` khi tham số được đặt.

Danh tính trình theo dõi phải là một khóa phiên có định danh tác nhân. Trong `session.scope="global"`, khóa `global` dùng chung không rõ ràng giữa các tác nhân, vì vậy những phiên như vậy có nhật ký bền vững và `changesSince` nhưng không nhận thông báo chủ động.

Các lượt theo dõi tự dọn dẹp: hàng con trỏ hết hạn cùng thời hạn lưu giữ nhật ký tín hiệu, bị xóa khi phiên theo dõi được đặt lại và bị xóa cùng với một trong hai phiên. Không có thao tác hủy theo dõi trong v1.

Các phiên đang được theo dõi được tiếp nhận từ danh mục phiên sẽ được kiểm tra theo chu kỳ cố định để phát hiện hoạt động trực tiếp của người dùng ở nguồn thượng nguồn. Hoạt động được phát hiện đi vào cùng nhật ký tín hiệu và luồng trình theo dõi như các lượt tương tác trực tiếp khác của người dùng.

Nếu nguồn thượng nguồn của một phiên đã tiếp nhận bị xóa từ bên ngoài, ba lần kiểm tra liên tiếp không tìm thấy nguồn (khoảng ba nhịp giám sát) sẽ tạo một tín hiệu `upstream_missing` duy nhất cho các trình theo dõi của phiên và xóa liên kết thượng nguồn. Việc tiếp tục phiên trong danh mục sẽ tạo lại một liên kết mới.

## Thông báo: một, không phải nhiều

Khi một sự kiện đủ điều kiện thông báo xuất hiện và con trỏ của trình theo dõi bị tụt lại, trình theo dõi sẽ nhận một thông báo hệ thống trong lượt tiếp theo:

```
Phiên "agent:main:subagent:child" đã thay đổi (chủ thể khác). Hãy đối soát trước khi hành động: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Các trình theo dõi là phiên chính cũng được đánh thức ngay lập tức qua một lần đánh thức Heartbeat; các trình theo dõi là tác nhân phụ lồng nhau nhận thông báo trong lượt tiếp theo.

Giao thức được thiết kế có chủ ý để chống spam:

- **Một thông báo đang chờ cho mỗi cặp trình theo dõi/đích.** Văn bản thông báo giữ nguyên từng byte trong khi chờ và hàng đợi sự kiện hệ thống khử trùng lặp dựa trên văn bản đó, vì vậy hai mươi thay đổi nhanh đối với cùng một đích vẫn chỉ tạo một dòng duy nhất trong lời nhắc của trình theo dõi.
- **Mốc nước đóng băng.** Con trỏ đóng băng vị trí đã thông báo khi một thông báo được đưa vào hàng đợi. Các sự kiện đáng kể tiếp theo chỉ làm tăng mốc nước đáng kể; chúng không kích hoạt thông báo lại.
- **Xác nhận khi lấy khỏi hàng đợi, chỉ mở lại khi có công việc xen kẽ.** Khi lượt của trình theo dõi tiêu thụ thông báo, con trỏ sẽ tiến lên. Nếu có thêm sự kiện đáng kể xuất hiện trong khoảng từ lúc đưa vào hàng đợi đến lúc lấy ra, chính xác một thông báo mới sẽ được mở cho phần còn lại.
- **Tự triệt tiêu.** Trình theo dõi không bao giờ nhận thông báo về các sự kiện do chính nó gây ra.
- **Khôi phục sau khi khởi động lại.** Các thông báo đang chờ nằm trong hàng đợi trong bộ nhớ; một lượt quét khi khởi động sẽ tái tạo chúng từ các con trỏ bền vững sau khi Gateway khởi động lại.

## Đối soát

Thông báo cho trình theo dõi biết chính xác cần làm gì. `session_status` với `changesSince: <version>` trả về các sự kiện có kiểu sau phiên bản đó (tối đa 200), mà không làm tiến bất kỳ con trỏ nào:

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "tin nhắn của người dùng qua telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "mục tiêu đã được cập nhật" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` có nghĩa là phiên bản được yêu cầu có trước phần lịch sử được lưu giữ — hãy làm mới toàn bộ trạng thái phiên (`sessions_history`, `session_status`) thay vì coi phản hồi là phần chênh lệch chính xác. Tín hiệu khoảng trống là chính xác: nó đến từ mốc nước đã lược bỏ riêng cho từng phiên, không được suy ra từ phép tính số thứ tự.

## Lưu trữ và giới hạn

Lịch sử nằm trong cơ sở dữ liệu trạng thái dùng chung, được giới hạn ở 30 ngày và 50.000 hàng; các đầu phiên vẫn tăng đơn điệu sau khi lược bỏ dữ liệu. Việc ghi nhận được thực hiện theo nỗ lực tối đa — thao tác thêm thất bại sẽ được ghi nhật ký và không bao giờ làm lượt tương tác ban đầu thất bại — vì vậy `stateVersion` là đầu nhật ký tín hiệu, không phải phiên bản thu thập dữ liệu thay đổi có tính giao dịch.

Các giới hạn hiện tại:

- Việc chuyển thông báo giả định rằng một tiến trình Gateway sở hữu cơ sở dữ liệu trạng thái dùng chung. Nhiều Gateway dùng chung nhật ký bền vững và `changesSince`, nhưng v1 không đẩy thông báo giữa các tiến trình.
- Các sự kiện Compaction bao phủ những thành phần sở hữu Compaction của runtime nhúng; Compaction chỉ thuộc bộ kiểm thử gốc chưa được ghi nhật ký đầy đủ.
- Chi tiết tải trọng kết quả bị hủy hiện được tạo bởi các lượt chạy con ACP; việc hủy tác nhân phụ gốc được biểu thị dưới dạng lỗi chung.
- Việc phát hiện phản hồi vọng lại từ thượng nguồn so sánh văn bản người dùng đã chuẩn hóa. Một lời nhắc bên ngoài khớp với một trong 10 tin nhắn người dùng gần nhất ở phía OpenClaw của phiên được xem là phản hồi vọng lại từ chính hệ thống.
- Một hàng Claude JSONL cục bộ duy nhất lớn hơn giới hạn quét 1 MiB mỗi chu kỳ sẽ chặn con trỏ của phiên đó trong v1; các byte chưa phân loại không bao giờ bị bỏ qua.
- Các lượt kiểm tra Claude trên Node ghép cặp phân loại 50 mục bản ghi gần nhất trong mỗi chu kỳ. Các đợt lớn hơn có thể nằm ngoài cửa sổ quét của v1.
- Các lượt đọc lịch sử Claude trên Node ghép cặp không cung cấp kết quả chắc chắn rằng không tìm thấy luồng, vì vậy việc xóa Claude từ xa không được phân loại là `upstream_missing` trong v1.
- Các phiên trong danh mục chưa được tiếp nhận vẫn nằm ngoài lớp nhận biết trong v1.
- Các phiên được tiếp nhận trước khi có tính năng này không mang liên kết thượng nguồn; hãy tiếp tục chúng từ danh mục một lần để bắt đầu giám sát thượng nguồn.
- Các liên kết thượng nguồn giả định mỗi khóa phiên đã tiếp nhận ánh xạ tới một tác nhân sở hữu duy nhất (việc tiếp nhận sử dụng tác nhân kho lưu trữ mặc định). Việc nhiều tác nhân tiếp nhận cùng một luồng bên ngoài không được giám sát trong v1.

## Liên quan

- [Công cụ phiên](/vi/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Tác nhân phụ](/vi/tools/subagents) — các cạnh sinh phiên và thông báo hoàn tất
- [Heartbeat](/vi/gateway/heartbeat) — cách các thông báo trong hàng đợi đánh thức phiên chính
- [Quản lý phiên](/vi/concepts/session) — khóa phiên, phạm vi, vòng đời
