---
read_when:
    - Bạn muốn OpenClaw ghi nhớ các câu hỏi tiếp nối tự nhiên
    - Bạn muốn hiểu cách các lượt check-in suy luận khác với lời nhắc
    - Bạn muốn xem xét hoặc bỏ qua các cam kết cần theo dõi
sidebarTitle: Commitments
summary: Bộ nhớ theo dõi được suy luận cho các lần hỏi thăm không phải là lời nhắc chính xác
title: Các cam kết được suy luận
x-i18n:
    generated_at: "2026-05-01T10:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Commitments là các ký ức theo dõi ngắn hạn. Khi được bật, OpenClaw có thể
nhận ra rằng một cuộc trò chuyện đã tạo ra cơ hội kiểm tra lại trong tương lai
và ghi nhớ để nhắc lại sau.

Ví dụ:

- Bạn nhắc đến một buổi phỏng vấn vào ngày mai. OpenClaw có thể kiểm tra lại sau đó.
- Bạn nói rằng bạn kiệt sức. OpenClaw có thể hỏi lại sau xem bạn đã ngủ chưa.
- Agent nói rằng nó sẽ theo dõi sau khi có điều gì đó thay đổi. OpenClaw có thể theo dõi
  vòng lặp đang mở đó.

Commitments không phải là các sự kiện bền vững như `MEMORY.md`, và chúng cũng không phải là
lời nhắc chính xác. Chúng nằm giữa bộ nhớ và tự động hóa: OpenClaw ghi nhớ một
nghĩa vụ gắn với cuộc trò chuyện, rồi Heartbeat gửi nó khi đến hạn.

## Bật commitments

Commitments bị tắt theo mặc định. Bật chúng trong cấu hình:

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

`commitments.maxPerDay` giới hạn số lượt theo dõi suy luận có thể được gửi
cho mỗi phiên agent trong một ngày trượt. Mặc định là `3`.

## Cách hoạt động

Sau một phản hồi của agent, OpenClaw có thể chạy một lượt trích xuất nền ẩn trong một
ngữ cảnh riêng. Lượt này chỉ tìm các commitments theo dõi được suy luận. Nó
không ghi vào cuộc trò chuyện hiển thị và không yêu cầu agent chính
suy luận về việc trích xuất.

Khi tìm thấy một ứng viên có độ tin cậy cao, OpenClaw lưu một commitment với:

- id của agent
- khóa phiên
- kênh gốc và đích gửi
- khoảng thời gian đến hạn
- một lời kiểm tra lại ngắn được gợi ý
- siêu dữ liệu không mang tính chỉ dẫn để Heartbeat quyết định có gửi hay không

Việc gửi diễn ra thông qua Heartbeat. Khi một commitment đến hạn, Heartbeat
thêm commitment đó vào lượt Heartbeat cho cùng agent và phạm vi kênh.
Mô hình có thể gửi một lời kiểm tra lại tự nhiên hoặc trả lời `HEARTBEAT_OK` để bỏ qua.
Nếu Heartbeat được cấu hình với `target: "none"`, các commitments đến hạn vẫn
nội bộ và không gửi lời kiểm tra lại ra bên ngoài. Prompt gửi commitment không
phát lại văn bản cuộc trò chuyện gốc, và các lượt Heartbeat của commitment đến hạn chạy
không có công cụ OpenClaw.

OpenClaw không bao giờ gửi một commitment được suy luận ngay sau khi ghi nó.
Thời điểm đến hạn được giới hạn tối thiểu là một khoảng Heartbeat sau khi commitment
được tạo, nên lượt theo dõi không thể vang lại vào cùng khoảnh khắc nó được
suy luận.

## Phạm vi

Commitments được giới hạn trong đúng ngữ cảnh agent và kênh nơi chúng được
tạo. Một lượt theo dõi được suy luận khi trò chuyện với một agent trong Discord sẽ không được
gửi bởi agent khác, kênh khác, hoặc một phiên không liên quan.

Phạm vi này là một phần của tính năng. Các lời kiểm tra lại tự nhiên nên có cảm giác như cùng
cuộc trò chuyện đang tiếp diễn, không phải như một hệ thống nhắc việc toàn cục.

## Commitments so với lời nhắc

| Nhu cầu                                         | Dùng                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "Nhắc tôi lúc 3 giờ chiều"                      | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Ping tôi sau 20 phút"                          | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Chạy báo cáo này mỗi ngày trong tuần"          | [Tác vụ đã lên lịch](/vi/automation/cron-jobs) |
| "Tôi có một buổi phỏng vấn vào ngày mai"        | Commitments                              |
| "Tôi đã thức cả đêm"                            | Commitments                              |
| "Theo dõi nếu tôi không trả lời chuỗi đang mở này" | Commitments                              |

Các yêu cầu chính xác của người dùng vốn thuộc về luồng bộ lập lịch. Commitments chỉ
dành cho các lượt theo dõi được suy luận: những khoảnh khắc người dùng không yêu cầu lời nhắc,
nhưng cuộc trò chuyện rõ ràng đã tạo ra một lần kiểm tra lại hữu ích trong tương lai.

## Quản lý commitments

Dùng CLI để kiểm tra và xóa commitments đã lưu:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Xem [`openclaw commitments`](/vi/cli/commitments) để tham khảo lệnh.

## Quyền riêng tư và chi phí

Việc trích xuất commitment dùng một lượt LLM, nên bật tính năng này sẽ thêm mức sử dụng
mô hình nền sau các lượt đủ điều kiện. Lượt này bị ẩn khỏi cuộc trò chuyện
hiển thị với người dùng, nhưng nó có thể đọc cuộc trao đổi gần đây cần thiết để quyết định
liệu có lượt theo dõi hay không.

Commitments đã lưu là trạng thái OpenClaw cục bộ. Chúng là bộ nhớ vận hành, không phải
bộ nhớ dài hạn. Tắt tính năng bằng:

```bash
openclaw config set commitments.enabled false
```

## Khắc phục sự cố

Nếu các lượt theo dõi mong đợi không xuất hiện:

- Xác nhận `commitments.enabled` là `true`.
- Kiểm tra `openclaw commitments --all` để tìm các bản ghi đang chờ, đã bỏ qua, đã tạm hoãn, hoặc đã hết hạn.
- Đảm bảo Heartbeat đang chạy cho agent.
- Kiểm tra xem `commitments.maxPerDay` đã đạt giới hạn cho phiên
  agent đó chưa.
- Nhớ rằng các lời nhắc chính xác bị bỏ qua bởi quá trình trích xuất commitment và thay vào đó nên
  xuất hiện trong [tác vụ đã lên lịch](/vi/automation/cron-jobs).

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
- [`openclaw commitments`](/vi/cli/commitments)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#commitments)
