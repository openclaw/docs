---
read_when:
    - Bạn muốn OpenClaw ghi nhớ các câu hỏi tiếp nối tự nhiên
    - Bạn muốn hiểu các lượt xác nhận được suy luận khác với lời nhắc như thế nào
    - Bạn muốn xem xét hoặc bỏ qua các cam kết tiếp theo
sidebarTitle: Commitments
summary: Bộ nhớ theo dõi suy luận cho các lần hỏi thăm không phải là lời nhắc chính xác
title: Các cam kết được suy ra
x-i18n:
    generated_at: "2026-07-16T14:19:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Commitment là các ký ức theo dõi ngắn hạn. Khi được bật, OpenClaw có thể
nhận thấy rằng một cuộc trò chuyện đã tạo ra cơ hội hỏi thăm trong tương lai và ghi nhớ
để nhắc lại sau.

Ví dụ:

- Bạn đề cập đến một cuộc phỏng vấn vào ngày mai. OpenClaw có thể hỏi thăm sau đó.
- Bạn nói rằng mình kiệt sức. OpenClaw có thể hỏi sau xem bạn đã ngủ chưa.
- Agent nói rằng sẽ theo dõi sau khi có điều gì đó thay đổi. OpenClaw có thể theo dõi
  vấn đề còn bỏ ngỏ đó.

Commitment không phải là các dữ kiện lâu dài như `MEMORY.md`, và cũng không phải là lời
nhắc chính xác. Chúng nằm giữa bộ nhớ và tự động hóa: OpenClaw ghi nhớ một
nghĩa vụ gắn với cuộc trò chuyện, sau đó Heartbeat chuyển nghĩa vụ đó đến khi tới hạn.

## Bật commitment

Commitment bị tắt theo mặc định (`commitments.enabled: false`). Bật tính năng này trong cấu hình:

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
trong mỗi phiên agent trong một ngày luân phiên. Giá trị mặc định là `3`.

## Cách hoạt động

Sau khi agent trả lời, OpenClaw có thể chạy một lượt trích xuất nền ẩn trong
một ngữ cảnh riêng, với các công cụ bị tắt. Lượt này chỉ tìm kiếm các commitment theo dõi được suy luận. Nó
không ghi vào cuộc trò chuyện hiển thị và không yêu cầu agent chính
suy luận về quá trình trích xuất.

Khi tìm thấy một ứng viên có độ tin cậy cao, OpenClaw lưu một commitment gồm:

- ID của agent
- khóa phiên
- kênh ban đầu và đích gửi
- khoảng thời gian đến hạn
- một lời hỏi thăm ngắn được đề xuất
- siêu dữ liệu không mang tính chỉ dẫn để Heartbeat quyết định có gửi hay không

Việc gửi diễn ra thông qua Heartbeat. Khi một commitment đến hạn, Heartbeat
thêm commitment đó vào lượt Heartbeat cho cùng phạm vi agent và kênh.
Prompt cảnh báo rõ rằng siêu dữ liệu commitment không đáng tin cậy và yêu cầu
mô hình không làm theo các chỉ dẫn trong đó hoặc sử dụng công cụ vì siêu dữ liệu này.
Mô hình có thể gửi một lời hỏi thăm tự nhiên hoặc trả lời `HEARTBEAT_OK` để bỏ qua.
Nếu Heartbeat được cấu hình với `target: "none"`, các commitment đến hạn vẫn
nằm trong nội bộ và không gửi lời hỏi thăm ra bên ngoài. Prompt gửi commitment không
phát lại nội dung cuộc trò chuyện ban đầu mà chỉ chứa lời hỏi thăm được đề xuất và
siêu dữ liệu; các lượt Heartbeat dành cho commitment đến hạn chạy mà không có công cụ OpenClaw.

OpenClaw không bao giờ gửi một commitment được suy luận ngay sau khi ghi lại.
Thời điểm đến hạn được giới hạn tối thiểu là một khoảng Heartbeat sau khi commitment
được tạo, vì vậy lượt theo dõi không thể vọng lại đúng vào thời điểm nó được
suy luận.

## Phạm vi

Commitment được giới hạn trong chính xác ngữ cảnh agent và kênh nơi chúng được
tạo. Một lượt theo dõi được suy luận khi trò chuyện với một agent trên Discord sẽ không
được gửi bởi agent khác, kênh khác hoặc phiên không liên quan.

Phạm vi này là một phần của tính năng. Các lời hỏi thăm tự nhiên nên tạo cảm giác như cùng một
cuộc trò chuyện đang tiếp tục, chứ không phải như một hệ thống nhắc nhở toàn cục.

## Commitment và lời nhắc

| Nhu cầu                                         | Sử dụng                                  |
| ----------------------------------------------- | ---------------------------------------- |
| "Nhắc tôi lúc 3 giờ chiều"                      | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Nhắn tôi sau 20 phút"                          | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Chạy báo cáo này mỗi ngày trong tuần"          | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Ngày mai tôi có một cuộc phỏng vấn"            | Commitment                               |
| "Tôi đã thức suốt đêm"                          | Commitment                               |
| "Theo dõi nếu tôi không trả lời luồng đang mở này" | Commitment                            |

Các yêu cầu chính xác của người dùng đã thuộc về luồng của bộ lập lịch. Commitment chỉ
dành cho các lượt theo dõi được suy luận: những thời điểm người dùng không yêu cầu lời nhắc,
nhưng cuộc trò chuyện rõ ràng đã tạo ra một cơ hội hỏi thăm hữu ích trong tương lai.

## Quản lý commitment

Sử dụng CLI để kiểm tra và xóa các commitment đã lưu:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Xem [`openclaw commitments`](/vi/cli/commitments) để biết tài liệu tham khảo đầy đủ về lệnh.

## Quyền riêng tư và chi phí

Quá trình trích xuất commitment sử dụng một lượt LLM, vì vậy việc bật tính năng này sẽ làm tăng mức
sử dụng mô hình nền sau các lượt đủ điều kiện. Lượt này được ẩn khỏi
cuộc trò chuyện hiển thị với người dùng, nhưng có thể đọc phần trao đổi gần đây cần thiết để quyết định xem
có lượt theo dõi hay không.

Các commitment được lưu là bộ nhớ vận hành OpenClaw cục bộ trong cơ sở dữ liệu trạng thái SQLite
dùng chung, không phải bộ nhớ dài hạn. Tắt tính năng bằng:

```bash
openclaw config set commitments.enabled false
```

## Khắc phục sự cố

Nếu các lượt theo dõi dự kiến không xuất hiện:

- Xác nhận `commitments.enabled` là `true`.
- Kiểm tra `openclaw commitments --all` để tìm các bản ghi đang chờ, đã bỏ qua, tạm hoãn hoặc hết hạn.
- Đảm bảo Heartbeat đang chạy cho agent.
- Kiểm tra xem `commitments.maxPerDay` đã đạt đến giới hạn cho phiên agent đó hay chưa.
- Hãy nhớ rằng các lời nhắc chính xác sẽ bị quá trình trích xuất commitment bỏ qua và thay vào đó sẽ
  xuất hiện trong [tác vụ đã lên lịch](/vi/automation/cron-jobs).

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
- [`openclaw commitments`](/vi/cli/commitments)
- [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference#commitments)
