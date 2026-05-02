---
read_when:
    - Bạn định tuyến các cuộc trò chuyện nhóm đến các tác nhân chuyên trách
    - Bạn muốn làm việc song song mà không để một tác vụ dài chặn mọi cuộc trò chuyện
    - Bạn đang thiết kế một thiết lập vận hành đa tác tử
sidebarTitle: Specialist lanes
status: active
summary: Chạy các tác nhân chuyên trách song song mà không làm tắc nghẽn năng lực mô hình và công cụ dùng chung
title: Các luồng chuyên gia song song
x-i18n:
    generated_at: "2026-05-02T10:39:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Các luồng chuyên trách song song cho phép một Gateway định tuyến các cuộc trò chuyện hoặc phòng khác nhau đến
các tác nhân khác nhau, đồng thời giữ cho trải nghiệm người dùng nhanh. Bí quyết là xem
song song hóa như một bài toán thiết kế với tài nguyên khan hiếm, chứ không chỉ là "nhiều tác nhân hơn".

## Nguyên tắc đầu tiên

Một luồng chuyên trách chỉ cải thiện thông lượng khi nó giảm tranh chấp đối với
những nút thắt cổ chai thực sự:

- **Khóa phiên**: chỉ một lượt chạy nên thay đổi một phiên nhất định tại một thời điểm.
- **Năng lực mô hình toàn cục**: mọi lượt chạy trò chuyện hiển thị vẫn dùng chung giới hạn của nhà cung cấp.
- **Năng lực công cụ**: shell, trình duyệt, mạng và công việc trên kho mã có thể chậm hơn
  chính lượt mô hình.
- **Ngân sách ngữ cảnh**: bản ghi dài làm mọi lượt sau này chậm hơn và kém
  tập trung hơn.
- **Mơ hồ về quyền sở hữu**: các tác nhân trùng lặp làm cùng một việc sẽ lãng phí năng lực.

OpenClaw đã tuần tự hóa các lượt chạy theo từng phiên và giới hạn song song hóa toàn cục thông qua
[hàng đợi lệnh](/vi/concepts/queue). Các luồng chuyên trách thêm chính sách ở phía trên:
tác nhân nào sở hữu công việc nào, nội dung nào ở lại trong trò chuyện, và nội dung nào trở thành
công việc nền.

## Lộ trình triển khai được khuyến nghị

### Giai đoạn 1: hợp đồng luồng + công việc nặng chạy nền

Cung cấp cho mỗi luồng một hợp đồng bằng văn bản trong workspace và system prompt của nó:

- **Mục đích**: công việc mà luồng này sở hữu.
- **Không phải mục tiêu**: công việc nó nên chuyển giao thay vì tự thực hiện.
- **Ngân sách trò chuyện**: câu trả lời nhanh ở lại trong trò chuyện; tác vụ dài nên xác nhận
  ngắn gọn, rồi chạy trong một tác nhân phụ hoặc tác vụ nền.
- **Quy tắc chuyển giao**: khi một luồng khác sở hữu công việc, nói rõ nên chuyển đến đâu và
  cung cấp bản tóm tắt chuyển giao gọn.
- **Quy tắc rủi ro công cụ**: ưu tiên bề mặt công cụ nhỏ nhất có thể hoàn thành việc.

Đây là giai đoạn rẻ nhất và xử lý hầu hết tình trạng tắc nghẽn: một việc lập trình không còn
biến luồng nghiên cứu thành thứ chậm chạp, và mỗi cuộc trò chuyện giữ ngữ cảnh của riêng nó sạch sẽ.

### Giai đoạn 2: kiểm soát ưu tiên và đồng thời

Điều chỉnh hàng đợi và năng lực mô hình quanh giá trị kinh doanh của từng luồng:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
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

Dùng trò chuyện trực tiếp/cá nhân và tác nhân vận hành sản xuất cho công việc ưu tiên cao. Để
nghiên cứu, soạn thảo và lập trình theo lô chuyển sang tác vụ nền khi hệ thống
bận.

### Giai đoạn 3: điều phối viên / bộ điều khiển lưu lượng

Thêm một mẫu điều phối viên nhỏ khi nhiều luồng đã hoạt động:

- Theo dõi các tác vụ và chủ sở hữu đang hoạt động của luồng.
- Phát hiện yêu cầu trùng lặp giữa các nhóm.
- Định tuyến bản tóm tắt chuyển giao giữa các luồng.
- Chỉ hiển thị các điểm chặn, kết quả hoàn tất và quyết định con người phải đưa ra.

Đừng bắt đầu từ đây. Một điều phối viên không có hợp đồng luồng chỉ đang điều phối sự hỗn loạn.

## Mẫu hợp đồng luồng tối thiểu

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Liên quan

- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Hàng đợi lệnh](/vi/concepts/queue)
- [Tác nhân phụ](/vi/tools/subagents)
