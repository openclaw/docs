---
read_when:
    - Bạn muốn OpenClaw ghi nhớ các câu hỏi tiếp nối tự nhiên
    - Bạn muốn hiểu điểm khác biệt giữa các lượt báo cáo được suy luận và lời nhắc
    - Bạn muốn xem xét hoặc bỏ qua các cam kết tiếp theo
sidebarTitle: Commitments
summary: Bộ nhớ theo dõi được suy luận cho các lần hỏi thăm không phải là lời nhắc chính xác
title: Các cam kết được suy luận
x-i18n:
    generated_at: "2026-07-12T07:51:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Cam kết là những ký ức theo dõi tiếp nối có thời hạn ngắn. Khi được bật, OpenClaw có thể
nhận thấy rằng một cuộc trò chuyện đã tạo ra cơ hội hỏi thăm trong tương lai và ghi nhớ
để nhắc lại sau.

Ví dụ:

- Bạn đề cập đến một cuộc phỏng vấn vào ngày mai. OpenClaw có thể hỏi thăm sau đó.
- Bạn nói rằng mình kiệt sức. Sau đó, OpenClaw có thể hỏi xem bạn đã ngủ chưa.
- Tác tử nói rằng nó sẽ theo dõi tiếp sau khi có điều gì đó thay đổi. OpenClaw có thể theo dõi
  việc còn bỏ ngỏ đó.

Cam kết không phải là các sự kiện lâu dài như `MEMORY.md`, cũng không phải là lời
nhắc chính xác. Chúng nằm giữa bộ nhớ và tự động hóa: OpenClaw ghi nhớ một
nghĩa vụ gắn với cuộc trò chuyện, sau đó Heartbeat chuyển nghĩa vụ đó đến khi tới hạn.

## Bật cam kết

Cam kết mặc định bị tắt (`commitments.enabled: false`). Bật chúng trong cấu hình:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Cấu hình `openclaw.json` tương đương:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` giới hạn số lượt theo dõi tiếp được suy luận có thể được chuyển đến
trong mỗi phiên tác tử trong một ngày trượt. Giá trị mặc định là `3`.

## Cách hoạt động

Sau khi tác tử trả lời, OpenClaw có thể chạy một lượt trích xuất nền ẩn trong một
ngữ cảnh riêng biệt, với các công cụ bị tắt. Lượt này chỉ tìm kiếm các cam kết theo dõi tiếp được suy luận. Nó
không ghi vào cuộc trò chuyện hiển thị và không yêu cầu tác tử chính
suy luận về việc trích xuất.

Khi tìm thấy một ứng viên có độ tin cậy cao, OpenClaw lưu một cam kết gồm:

- mã định danh tác tử
- khóa phiên
- kênh ban đầu và đích chuyển đến
- khoảng thời gian đến hạn
- một lời hỏi thăm ngắn được đề xuất
- siêu dữ liệu không mang tính chỉ thị để Heartbeat quyết định có gửi hay không

Việc chuyển đến diễn ra thông qua Heartbeat. Khi một cam kết đến hạn, Heartbeat
thêm cam kết đó vào lượt Heartbeat cho cùng phạm vi tác tử và kênh.
Lời nhắc cảnh báo rõ ràng rằng siêu dữ liệu cam kết không đáng tin cậy và yêu cầu
mô hình không làm theo các chỉ dẫn trong đó hoặc sử dụng công cụ vì nội dung đó. Mô hình
có thể gửi một lời hỏi thăm tự nhiên hoặc trả lời `HEARTBEAT_OK` để bỏ qua.
Nếu Heartbeat được cấu hình với `target: "none"`, các cam kết đến hạn vẫn ở
nội bộ và không gửi lời hỏi thăm ra bên ngoài. Lời nhắc chuyển cam kết không
phát lại văn bản cuộc trò chuyện ban đầu mà chỉ chứa lời hỏi thăm được đề xuất và
siêu dữ liệu; các lượt Heartbeat cho cam kết đến hạn chạy mà không có công cụ OpenClaw.

OpenClaw không bao giờ chuyển một cam kết được suy luận ngay sau khi ghi cam kết đó.
Thời điểm đến hạn được giới hạn sớm nhất là sau ít nhất một khoảng Heartbeat kể từ khi cam kết
được tạo, vì vậy lượt theo dõi tiếp không thể vọng lại ngay tại thời điểm nó được
suy luận.

## Phạm vi

Cam kết được giới hạn trong đúng ngữ cảnh tác tử và kênh nơi chúng được
tạo. Một lượt theo dõi tiếp được suy luận khi trò chuyện với một tác tử trong Discord sẽ không
được chuyển bởi tác tử khác, kênh khác hoặc phiên không liên quan.

Phạm vi này là một phần của tính năng. Những lời hỏi thăm tự nhiên nên tạo cảm giác như cùng một
cuộc trò chuyện đang tiếp diễn, chứ không giống một hệ thống nhắc nhở toàn cục.

## Cam kết so với lời nhắc

| Nhu cầu                                         | Sử dụng                                  |
| ----------------------------------------------- | ---------------------------------------- |
| "Nhắc tôi lúc 3 giờ chiều"                      | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Nhắc tôi sau 20 phút"                          | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Chạy báo cáo này mỗi ngày trong tuần"          | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Ngày mai tôi có một cuộc phỏng vấn"            | Cam kết                                  |
| "Tôi đã thức cả đêm"                            | Cam kết                                  |
| "Theo dõi tiếp nếu tôi không trả lời luồng đang mở này" | Cam kết                         |

Các yêu cầu chính xác của người dùng đã thuộc về luồng trình lập lịch. Cam kết chỉ
dành cho các lượt theo dõi tiếp được suy luận: những thời điểm người dùng không yêu cầu lời nhắc,
nhưng cuộc trò chuyện rõ ràng đã tạo ra một dịp hỏi thăm hữu ích trong tương lai.

## Quản lý cam kết

Sử dụng CLI để kiểm tra và xóa các cam kết đã lưu:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Xem [`openclaw commitments`](/vi/cli/commitments) để biết tài liệu tham khảo lệnh đầy đủ.

## Quyền riêng tư và chi phí

Việc trích xuất cam kết sử dụng một lượt LLM, vì vậy bật tính năng này sẽ làm tăng mức sử dụng
mô hình nền sau các lượt đủ điều kiện. Lượt này bị ẩn khỏi cuộc trò chuyện
hiển thị cho người dùng, nhưng có thể đọc phần trao đổi gần đây cần thiết để xác định xem có
lượt theo dõi tiếp hay không.

Các cam kết đã lưu là trạng thái OpenClaw cục bộ. Chúng là bộ nhớ vận hành, không phải
bộ nhớ dài hạn. Tắt tính năng bằng:

```bash
openclaw config set commitments.enabled false
```

## Khắc phục sự cố

Nếu các lượt theo dõi tiếp dự kiến không xuất hiện:

- Xác nhận `commitments.enabled` là `true`.
- Kiểm tra `openclaw commitments --all` để tìm các bản ghi đang chờ, đã bỏ qua, đã tạm hoãn hoặc đã hết hạn.
- Đảm bảo Heartbeat đang chạy cho tác tử.
- Kiểm tra xem `commitments.maxPerDay` đã đạt giới hạn cho
  phiên tác tử đó hay chưa.
- Hãy nhớ rằng các lời nhắc chính xác bị quá trình trích xuất cam kết bỏ qua và thay vào đó phải
  xuất hiện trong [tác vụ đã lên lịch](/vi/automation/cron-jobs).

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
- [`openclaw commitments`](/vi/cli/commitments)
- [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference#commitments)
