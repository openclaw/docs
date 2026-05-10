---
read_when:
    - Bạn định tuyến các cuộc trò chuyện nhóm đến các tác nhân chuyên dụng
    - Bạn muốn làm việc song song mà không để một tác vụ dài chặn mọi cuộc trò chuyện
    - Bạn đang thiết kế một thiết lập vận hành đa tác nhân
sidebarTitle: Specialist lanes
status: active
summary: Chạy các tác nhân chuyên trách song song mà không làm nghẽn dung lượng mô hình và công cụ dùng chung
title: Các luồng chuyên trách song song
x-i18n:
    generated_at: "2026-05-10T19:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Các làn chuyên trách song song cho phép một Gateway định tuyến các cuộc trò chuyện hoặc phòng khác nhau đến
các agent khác nhau, trong khi vẫn giữ trải nghiệm người dùng nhanh. Điểm cốt lõi là xem
tính song song như một bài toán thiết kế với tài nguyên khan hiếm, không chỉ là "nhiều agent hơn".

## Nguyên tắc đầu tiên

Một làn chuyên trách chỉ cải thiện thông lượng khi nó giảm tranh chấp đối với
các nút thắt thực sự:

- **Khóa phiên**: mỗi lần chỉ nên có một lượt chạy được thay đổi một phiên nhất định.
- **Dung lượng mô hình toàn cục**: mọi lượt chạy trò chuyện hiển thị vẫn dùng chung giới hạn của nhà cung cấp.
- **Dung lượng công cụ**: shell, trình duyệt, mạng và công việc với kho lưu trữ có thể chậm hơn
  chính lượt mô hình.
- **Ngân sách ngữ cảnh**: bản ghi dài khiến mọi lượt sau này chậm hơn và kém
  tập trung hơn.
- **Mơ hồ về quyền sở hữu**: các agent trùng lặp làm cùng một việc sẽ lãng phí dung lượng.

OpenClaw đã tuần tự hóa các lượt chạy theo từng phiên và giới hạn tính song song toàn cục thông qua
[hàng đợi lệnh](/vi/concepts/queue). Các làn chuyên trách bổ sung chính sách ở trên:
agent nào sở hữu công việc nào, điều gì ở lại trong trò chuyện, và điều gì trở thành công việc
nền.

## Lộ trình khuyến nghị

### Giai đoạn 1: hợp đồng làn + công việc nặng chạy nền

Cung cấp cho mỗi làn một hợp đồng bằng văn bản trong workspace và system prompt của nó:

- **Mục đích**: công việc mà làn này sở hữu.
- **Không phải mục tiêu**: công việc nó nên bàn giao thay vì tự thử thực hiện.
- **Ngân sách trò chuyện**: câu trả lời nhanh ở lại trong trò chuyện; tác vụ dài nên xác nhận
  ngắn gọn, rồi chạy trong một sub-agent hoặc tác vụ nền.
- **Quy tắc bàn giao**: khi một làn khác sở hữu công việc, hãy nói công việc đó nên đi đâu và
  cung cấp một bản tóm tắt bàn giao súc tích.
- **Quy tắc rủi ro công cụ**: ưu tiên bề mặt công cụ nhỏ nhất có thể hoàn thành công việc.

Đây là giai đoạn rẻ nhất và khắc phục phần lớn tình trạng tắc nghẽn: một việc lập trình không còn
biến làn nghiên cứu thành chậm chạp, và mỗi cuộc trò chuyện giữ ngữ cảnh riêng của nó sạch sẽ.

### Giai đoạn 2: kiểm soát ưu tiên và đồng thời

Điều chỉnh hàng đợi và dung lượng mô hình quanh giá trị kinh doanh của từng làn:

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

Dùng các cuộc trò chuyện trực tiếp/cá nhân và agent vận hành sản xuất cho công việc ưu tiên cao. Để
nghiên cứu, soạn thảo và lập trình hàng loạt chuyển sang các tác vụ nền khi hệ thống
đang bận.

### Giai đoạn 3: điều phối viên / bộ điều khiển lưu lượng

Thêm một mẫu điều phối viên nhỏ khi nhiều làn đã hoạt động:

- Theo dõi các tác vụ và chủ sở hữu đang hoạt động của làn.
- Phát hiện yêu cầu trùng lặp giữa các nhóm.
- Định tuyến bản tóm tắt bàn giao giữa các làn.
- Chỉ hiển thị các vấn đề chặn, kết quả đã hoàn thành và quyết định mà con người phải đưa ra.

Đừng bắt đầu từ đây. Một điều phối viên không có hợp đồng làn chỉ đang điều phối hỗn loạn.

## Mẫu hợp đồng làn tối thiểu

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

- [Định tuyến đa agent](/vi/concepts/multi-agent)
- [Hàng đợi lệnh](/vi/concepts/queue)
- [Sub-agent](/vi/tools/subagents)
