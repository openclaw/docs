---
read_when:
    - Bạn định tuyến các cuộc trò chuyện nhóm đến các agent chuyên biệt
    - Bạn muốn công việc được thực hiện song song mà không để một tác vụ kéo dài chặn mọi cuộc trò chuyện
    - Bạn đang thiết kế một hệ thống vận hành đa tác tử
sidebarTitle: Specialist lanes
status: active
summary: Chạy song song các agent chuyên biệt mà không làm tắc nghẽn năng lực dùng chung của mô hình và công cụ
title: Các luồng chuyên gia song song
x-i18n:
    generated_at: "2026-07-12T07:52:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Các luồng chuyên biệt song song cho phép một Gateway định tuyến các cuộc trò chuyện hoặc phòng khác nhau đến các tác tử khác nhau mà vẫn duy trì trải nghiệm người dùng nhanh chóng. Hãy xem tính song song là một bài toán thiết kế với tài nguyên khan hiếm, không chỉ đơn thuần là "nhiều tác tử hơn".

## Nguyên tắc cơ bản

Một luồng chuyên biệt chỉ cải thiện thông lượng khi nó làm giảm tranh chấp tại các điểm nghẽn thực sự:

- **Khóa phiên**: mỗi lần chỉ nên có một lượt chạy thay đổi một phiên nhất định.
- **Dung lượng mô hình toàn cục**: tất cả lượt chạy trò chuyện hiển thị vẫn dùng chung các giới hạn của nhà cung cấp.
- **Dung lượng công cụ**: công việc trên shell, trình duyệt, mạng và kho lưu trữ có thể chậm hơn chính lượt xử lý của mô hình.
- **Ngân sách ngữ cảnh**: bản ghi dài khiến mọi lượt sau đều chậm hơn và kém tập trung hơn.
- **Quyền sở hữu không rõ ràng**: các tác tử trùng lặp cùng thực hiện một công việc sẽ lãng phí dung lượng.

OpenClaw đã tuần tự hóa các lượt chạy theo từng phiên và giới hạn tính song song toàn cục thông qua [hàng đợi lệnh](/vi/concepts/queue). Các luồng chuyên biệt bổ sung chính sách lên trên: tác tử nào sở hữu công việc nào, nội dung nào ở lại trong cuộc trò chuyện và nội dung nào trở thành công việc nền.

## Lộ trình triển khai được đề xuất

### Giai đoạn 1: hợp đồng luồng + công việc nặng chạy nền

Cung cấp cho mỗi luồng một hợp đồng bằng văn bản trong không gian làm việc và lời nhắc hệ thống của luồng đó:

- **Mục đích**: công việc thuộc trách nhiệm của luồng này.
- **Mục tiêu loại trừ**: công việc luồng này nên bàn giao thay vì tự thực hiện.
- **Ngân sách trò chuyện**: câu trả lời nhanh được xử lý trong cuộc trò chuyện; với tác vụ dài, xác nhận ngắn gọn rồi chạy trong tác tử con hoặc tác vụ nền.
- **Quy tắc bàn giao**: khi công việc thuộc trách nhiệm của luồng khác, hãy cho biết nên chuyển đến đâu và cung cấp bản tóm tắt bàn giao ngắn gọn.
- **Quy tắc rủi ro công cụ**: ưu tiên bề mặt công cụ nhỏ nhất có thể hoàn thành công việc.

Đây là giai đoạn ít tốn kém nhất và giải quyết phần lớn tình trạng tắc nghẽn: một công việc lập trình không còn khiến luồng nghiên cứu trở nên trì trệ, đồng thời mỗi cuộc trò chuyện giữ được ngữ cảnh riêng gọn gàng.

### Giai đoạn 2: kiểm soát mức ưu tiên và tính đồng thời

Điều chỉnh hàng đợi và dung lượng mô hình theo giá trị kinh doanh của từng luồng:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Sử dụng các cuộc trò chuyện trực tiếp/cá nhân và các tác tử vận hành sản xuất cho công việc có mức ưu tiên cao. Khi hệ thống bận, hãy chuyển công việc nghiên cứu, soạn thảo và lập trình hàng loạt sang các tác vụ nền.

### Giai đoạn 3: bộ điều phối / bộ kiểm soát lưu lượng

Bổ sung một mẫu bộ điều phối nhỏ khi nhiều luồng đã hoạt động:

- Theo dõi các tác vụ và chủ sở hữu đang hoạt động trong từng luồng.
- Phát hiện yêu cầu trùng lặp giữa các nhóm.
- Định tuyến bản tóm tắt bàn giao giữa các luồng.
- Chỉ hiển thị các yếu tố cản trở, kết quả đã hoàn thành và quyết định mà con người phải đưa ra.

Không nên bắt đầu từ đây. Một bộ điều phối không có hợp đồng luồng chỉ điều phối sự hỗn loạn.

## Mẫu hợp đồng luồng tối thiểu

```md
# Hợp đồng luồng

## Chịu trách nhiệm

- <công việc thuộc trách nhiệm của luồng này>

## Không chịu trách nhiệm

- <công việc cần bàn giao>

## Ngân sách trò chuyện

- Trả lời trực tiếp các câu hỏi nhanh.
- Với công việc nhiều bước, chậm hoặc sử dụng nhiều công cụ: xác nhận ngắn gọn, tạo/chạy nền
  công việc, sau đó trả về kết quả khi hoàn tất.

## Bàn giao

Nếu yêu cầu thuộc trách nhiệm của luồng khác, hãy trả lời với:

- luồng đích
- mục tiêu
- ngữ cảnh liên quan
- hành động tiếp theo chính xác

## Cách sử dụng công cụ

Sử dụng bề mặt công cụ nhỏ nhất có thể hoàn thành tác vụ. Tránh sử dụng shell hoặc
mạng trên phạm vi rộng trừ khi luồng này được giao trách nhiệm rõ ràng.
```

## Liên quan

- [Định tuyến đa tác tử](/vi/concepts/multi-agent)
- [Hàng đợi lệnh](/vi/concepts/queue)
- [Tác tử con](/vi/tools/subagents)
