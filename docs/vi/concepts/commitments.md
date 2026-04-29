---
read_when:
    - Bạn muốn OpenClaw ghi nhớ các câu hỏi tiếp nối tự nhiên
    - Bạn muốn hiểu các lần kiểm tra được suy luận khác với lời nhắc như thế nào
    - Bạn muốn xem lại hoặc bỏ qua các cam kết cần theo dõi
sidebarTitle: Commitments
summary: Bộ nhớ theo dõi được suy luận cho các lần kiểm tra không phải là lời nhắc chính xác
title: Các cam kết được suy luận
x-i18n:
    generated_at: "2026-04-29T22:36:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Các cam kết là những bộ nhớ theo dõi ngắn hạn. Khi được bật, OpenClaw có thể
nhận ra rằng một cuộc trò chuyện đã tạo ra cơ hội hỏi thăm trong tương lai và ghi
nhớ để nhắc lại sau.

Ví dụ:

- Bạn nhắc đến một buổi phỏng vấn ngày mai. OpenClaw có thể hỏi thăm sau đó.
- Bạn nói rằng mình kiệt sức. OpenClaw có thể hỏi sau này xem bạn đã ngủ chưa.
- Tác nhân nói rằng nó sẽ theo dõi sau khi điều gì đó thay đổi. OpenClaw có thể theo dõi
  vòng lặp còn mở đó.

Các cam kết không phải là sự kiện bền vững như `MEMORY.md`, và cũng không phải
là lời nhắc chính xác. Chúng nằm giữa bộ nhớ và tự động hóa: OpenClaw ghi nhớ một
nghĩa vụ gắn với cuộc trò chuyện, rồi Heartbeat gửi nó khi đến hạn.

## Bật cam kết

Cam kết mặc định bị tắt. Bật chúng trong cấu hình:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

`openclaw.json` tương đương:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` giới hạn số lượt theo dõi được suy luận có thể được gửi
cho mỗi phiên tác nhân trong một ngày trượt. Mặc định là `3`.

## Cách hoạt động

Sau khi tác nhân trả lời, OpenClaw có thể chạy một lượt trích xuất nền ẩn trong
một ngữ cảnh riêng. Lượt đó chỉ tìm các cam kết theo dõi được suy luận. Nó
không ghi vào cuộc trò chuyện hiển thị và không yêu cầu tác nhân chính
suy luận về việc trích xuất.

Khi tìm thấy một ứng viên có độ tin cậy cao, OpenClaw lưu một cam kết với:

- id tác nhân
- khóa phiên
- kênh gốc và đích gửi
- khoảng thời gian đến hạn
- một lời hỏi thăm ngắn được đề xuất
- đủ ngữ cảnh nguồn để Heartbeat quyết định có gửi hay không

Việc gửi diễn ra thông qua Heartbeat. Khi một cam kết đến hạn, Heartbeat
thêm cam kết đó vào lượt Heartbeat cho cùng phạm vi tác nhân và kênh.
Mô hình có thể gửi một lời hỏi thăm tự nhiên hoặc trả lời `HEARTBEAT_OK` để bỏ qua.

OpenClaw không bao giờ gửi một cam kết được suy luận ngay sau khi ghi nó.
Thời điểm đến hạn được chặn tối thiểu bằng một khoảng Heartbeat sau khi cam kết
được tạo, nên lượt theo dõi không thể vọng lại ngay tại khoảnh khắc nó được
suy luận.

## Phạm vi

Cam kết được giới hạn trong đúng ngữ cảnh tác nhân và kênh nơi chúng được
tạo. Một lượt theo dõi được suy luận khi trò chuyện với một tác nhân trong Discord sẽ không
được gửi bởi tác nhân khác, kênh khác, hoặc một phiên không liên quan.

Phạm vi này là một phần của tính năng. Những lời hỏi thăm tự nhiên nên tạo cảm giác như cùng
một cuộc trò chuyện đang tiếp diễn, không phải như một hệ thống nhắc việc toàn cục.

## Cam kết so với lời nhắc

| Nhu cầu                                         | Dùng                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "Nhắc tôi lúc 3 giờ chiều"                      | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Nhắn tôi sau 20 phút nữa"                      | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Chạy báo cáo này mỗi ngày trong tuần"          | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Ngày mai tôi có một buổi phỏng vấn"            | Cam kết                                  |
| "Tôi đã thức cả đêm"                            | Cam kết                                  |
| "Theo dõi nếu tôi không trả lời luồng đang mở này" | Cam kết                               |

Các yêu cầu chính xác của người dùng đã thuộc về đường dẫn bộ lập lịch. Cam kết chỉ
dành cho các lượt theo dõi được suy luận: những khoảnh khắc người dùng không yêu cầu lời nhắc,
nhưng cuộc trò chuyện rõ ràng đã tạo ra một lần hỏi thăm hữu ích trong tương lai.

## Quản lý cam kết

Dùng CLI để kiểm tra và xóa các cam kết đã lưu:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Xem [`openclaw commitments`](/vi/cli/commitments) để tham khảo lệnh.

## Quyền riêng tư và chi phí

Việc trích xuất cam kết dùng một lượt LLM, nên bật tính năng này sẽ thêm mức sử dụng
mô hình nền sau các lượt đủ điều kiện. Lượt này bị ẩn khỏi cuộc trò chuyện
hiển thị với người dùng, nhưng nó có thể đọc trao đổi gần đây cần thiết để quyết định liệu có
lượt theo dõi hay không.

Cam kết đã lưu là trạng thái OpenClaw cục bộ. Chúng là bộ nhớ vận hành, không phải
bộ nhớ dài hạn. Tắt tính năng bằng:

```bash
openclaw config set commitments.enabled false
```

## Khắc phục sự cố

Nếu các lượt theo dõi mong đợi không xuất hiện:

- Xác nhận `commitments.enabled` là `true`.
- Kiểm tra `openclaw commitments --all` để xem các bản ghi đang chờ, đã bỏ qua, đã hoãn, hoặc đã hết hạn.
- Đảm bảo Heartbeat đang chạy cho tác nhân.
- Kiểm tra xem `commitments.maxPerDay` đã đạt giới hạn cho phiên tác nhân đó chưa.
- Hãy nhớ rằng lời nhắc chính xác sẽ bị bỏ qua khi trích xuất cam kết và thay vào đó
  nên xuất hiện trong [tác vụ đã lên lịch](/vi/automation/cron-jobs).

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
- [`openclaw commitments`](/vi/cli/commitments)
- [Tham khảo cấu hình](/vi/gateway/configuration-reference#commitments)
