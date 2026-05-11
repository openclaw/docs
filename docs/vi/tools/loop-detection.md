---
read_when:
    - Một người dùng báo cáo rằng các tác tử bị kẹt khi lặp lại các lệnh gọi công cụ
    - Bạn cần tinh chỉnh cơ chế bảo vệ chống lệnh gọi lặp lại
    - Bạn đang chỉnh sửa các chính sách về công cụ/thời gian chạy của tác nhân
    - Bạn gặp các lỗi hủy `compaction_loop_persisted` sau một lần thử lại do tràn ngữ cảnh
summary: Cách bật và điều chỉnh các cơ chế bảo vệ phát hiện các vòng lặp gọi công cụ lặp lại
title: Phát hiện vòng lặp công cụ
x-i18n:
    generated_at: "2026-05-11T20:38:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw có hai guardrail phối hợp cho các mẫu gọi công cụ lặp lại:

1. **Phát hiện vòng lặp** (`tools.loopDetection.enabled`) — bị tắt theo mặc định. Theo dõi lịch sử gọi công cụ dạng cuộn để tìm các mẫu lặp lại và các lần thử lại công cụ không xác định.
2. **Chốt chặn sau Compaction** (`tools.loopDetection.postCompactionGuard`) — được bật theo mặc định trừ khi `tools.loopDetection.enabled` được đặt rõ ràng là `false`. Kích hoạt sau mỗi lần thử lại sau Compaction và hủy lượt chạy khi agent phát ra cùng bộ ba `(tool, args, result)` trong cửa sổ.

Cả hai được cấu hình trong cùng khối `tools.loopDetection`, nhưng chốt chặn sau Compaction chạy bất cứ khi nào công tắc chính không bị tắt rõ ràng. Đặt `tools.loopDetection.enabled: false` để tắt cả hai bề mặt.

## Lý do tồn tại

- Phát hiện các chuỗi lặp lại không tạo ra tiến triển.
- Phát hiện các vòng lặp tần suất cao không có kết quả (cùng công cụ, cùng đầu vào, lỗi lặp lại).
- Phát hiện các mẫu gọi lặp lại cụ thể cho những công cụ thăm dò đã biết.
- Ngăn các chu kỳ tràn ngữ cảnh rồi Compaction rồi cùng vòng lặp chạy vô thời hạn.

## Khối cấu hình

Mặc định toàn cục, hiển thị mọi trường đã được ghi tài liệu:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

Ghi đè theo từng agent (tùy chọn):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Hành vi của trường

| Trường                           | Mặc định | Tác dụng                                                                                                                        |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`  | Công tắc chính cho các bộ phát hiện lịch sử dạng cuộn. Đặt `false` cũng tắt chốt chặn sau Compaction.                          |
| `historySize`                    | `30`     | Số lượng lệnh gọi công cụ gần đây được giữ lại để phân tích.                                                                    |
| `warningThreshold`               | `10`     | Ngưỡng trước khi một mẫu được phân loại là chỉ cảnh báo.                                                                        |
| `criticalThreshold`              | `20`     | Ngưỡng để chặn các mẫu vòng lặp lặp lại không có tiến triển.                                                                    |
| `unknownToolThreshold`           | `10`     | Chặn các lệnh gọi lặp lại đến cùng một công cụ không khả dụng sau số lần trượt này.                                             |
| `globalCircuitBreakerThreshold`  | `30`     | Ngưỡng bộ ngắt toàn cục cho trạng thái không có tiến triển trên tất cả bộ phát hiện.                                            |
| `detectors.genericRepeat`        | `true`   | Cảnh báo về các mẫu lặp lại cùng công cụ + cùng tham số và chặn khi các lệnh gọi đó cũng trả về kết quả giống hệt nhau.        |
| `detectors.knownPollNoProgress`  | `true`   | Phát hiện các mẫu giống thăm dò đã biết mà không có thay đổi trạng thái.                                                        |
| `detectors.pingPong`             | `true`   | Phát hiện các mẫu ping-pong luân phiên.                                                                                         |
| `postCompactionGuard.windowSize` | `3`      | Số lệnh gọi công cụ sau Compaction mà chốt chặn vẫn được kích hoạt và số bộ ba giống hệt nhau sẽ hủy lượt chạy.                |

Đối với `exec`, các kiểm tra không có tiến triển so sánh kết quả lệnh ổn định và bỏ qua siêu dữ liệu runtime dễ biến động như thời lượng, PID, ID phiên và thư mục làm việc. Khi có ID lượt chạy, lịch sử gọi công cụ gần đây chỉ được đánh giá trong lượt chạy đó, để các chu kỳ Heartbeat theo lịch và lượt chạy mới không kế thừa số đếm vòng lặp cũ từ các lượt chạy trước.

## Thiết lập được khuyến nghị

- Với các mô hình nhỏ hơn, đặt `enabled: true` và giữ các ngưỡng ở mặc định. Các mô hình hàng đầu hiếm khi cần phát hiện lịch sử dạng cuộn và có thể giữ công tắc chính ở `false` trong khi vẫn hưởng lợi từ chốt chặn sau Compaction.
- Giữ thứ tự các ngưỡng là `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Nếu xảy ra dương tính giả:
  - Tăng `warningThreshold` và/hoặc `criticalThreshold`.
  - Tùy chọn tăng `globalCircuitBreakerThreshold`.
  - Chỉ tắt bộ phát hiện cụ thể gây vấn đề (`detectors.<name>: false`).
  - Giảm `historySize` để bối cảnh lịch sử ít nghiêm ngặt hơn.
- Để tắt mọi thứ (bao gồm cả chốt chặn sau Compaction), đặt rõ ràng `tools.loopDetection.enabled: false`.

## Chốt chặn sau Compaction

Khi runner hoàn tất một lần thử lại sau Compaction sau khi tràn ngữ cảnh, nó kích hoạt một chốt chặn cửa sổ ngắn để theo dõi vài lệnh gọi công cụ tiếp theo. Nếu agent phát ra cùng bộ ba `(toolName, argsHash, resultHash)` nhiều lần trong cửa sổ, chốt chặn kết luận rằng Compaction không phá được vòng lặp và hủy lượt chạy với lỗi `compaction_loop_persisted`.

Chốt chặn được kiểm soát bởi cờ chính `tools.loopDetection.enabled` với một điểm khác biệt: nó vẫn **được bật khi cờ chưa được đặt hoặc là `true`** và chỉ ngừng hoạt động khi cờ được đặt rõ ràng là `false`. Điều này là có chủ đích. Chốt chặn tồn tại để thoát khỏi các vòng lặp Compaction vốn có thể tiêu tốn token không giới hạn, nên người dùng không cấu hình vẫn nhận được lớp bảo vệ.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- `windowSize` thấp hơn thì nghiêm ngặt hơn (ít lần thử hơn trước khi hủy).
- `windowSize` cao hơn cho agent nhiều lần thử khôi phục hơn.
- Chốt chặn không bao giờ hủy khi kết quả đang thay đổi, chỉ hủy khi kết quả giống hệt từng byte trong cửa sổ.
- Nó được cố ý giới hạn hẹp: chỉ kích hoạt ngay sau một lần thử lại sau Compaction.

<Note>
  Chốt chặn sau Compaction chạy bất cứ khi nào cờ chính không được đặt rõ ràng là `false`, ngay cả khi bạn chưa từng viết khối `tools.loopDetection`. Để xác minh, tìm `post-compaction guard armed for N attempts` trong nhật ký Gateway ngay sau một sự kiện Compaction.
</Note>

## Nhật ký và hành vi dự kiến

Khi phát hiện vòng lặp, OpenClaw báo cáo một sự kiện vòng lặp và giảm nhịp hoặc chặn chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng. Điều này bảo vệ người dùng khỏi chi tiêu token mất kiểm soát và tình trạng khóa cứng trong khi vẫn giữ quyền truy cập công cụ bình thường.

- Cảnh báo xuất hiện trước.
- Việc triệt tiêu theo sau khi các mẫu tiếp tục vượt ngưỡng cảnh báo.
- Các ngưỡng nghiêm trọng chặn chu kỳ công cụ tiếp theo và hiển thị lý do phát hiện vòng lặp rõ ràng trong bản ghi lượt chạy.
- Chốt chặn sau Compaction phát ra lỗi `compaction_loop_persisted` cùng tên công cụ vi phạm và số lượng lệnh gọi giống hệt nhau.

## Liên quan

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/vi/tools/exec-approvals" icon="shield">
    Chính sách cho phép/từ chối cho việc thực thi shell.
  </Card>
  <Card title="Thinking levels" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận và tương tác với chính sách của nhà cung cấp.
  </Card>
  <Card title="Sub-agents" href="/vi/tools/subagents" icon="users">
    Tạo các agent cô lập để giới hạn hành vi mất kiểm soát.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ `tools.loopDetection` đầy đủ và ngữ nghĩa hợp nhất.
  </Card>
</CardGroup>
