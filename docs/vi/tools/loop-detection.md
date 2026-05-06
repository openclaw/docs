---
read_when:
    - Một người dùng báo cáo rằng các tác nhân bị kẹt khi lặp lại các lệnh gọi công cụ
    - Bạn cần tinh chỉnh cơ chế bảo vệ chống lệnh gọi lặp lại
    - Bạn đang chỉnh sửa các chính sách công cụ/thời gian chạy của tác nhân
    - Bạn gặp lỗi hủy `compaction_loop_persisted` sau khi thử lại do tràn ngữ cảnh
summary: Cách bật và tinh chỉnh các cơ chế bảo vệ phát hiện các vòng lặp gọi công cụ lặp đi lặp lại
title: Phát hiện vòng lặp công cụ
x-i18n:
    generated_at: "2026-05-06T09:34:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw có hai cơ chế bảo vệ phối hợp cho các mẫu gọi công cụ lặp lại:

1. **Phát hiện vòng lặp** (`tools.loopDetection.enabled`) — bị tắt theo mặc định. Theo dõi lịch sử gọi công cụ dạng cuộn để tìm các mẫu lặp lại và các lần thử lại với công cụ không xác định.
2. **Bộ bảo vệ sau Compaction** (`tools.loopDetection.postCompactionGuard`) — được bật theo mặc định trừ khi `tools.loopDetection.enabled` được đặt rõ ràng là `false`. Được kích hoạt sau mỗi lần compaction-retry và hủy lượt chạy khi agent phát ra cùng một bộ ba `(tool, args, result)` trong cửa sổ.

Cả hai được cấu hình trong cùng khối `tools.loopDetection`, nhưng bộ bảo vệ sau Compaction chạy bất cứ khi nào công tắc chính không bị tắt rõ ràng. Đặt `tools.loopDetection.enabled: false` để tắt cả hai bề mặt.

## Vì sao cơ chế này tồn tại

- Phát hiện các chuỗi lặp lại không tạo ra tiến triển.
- Phát hiện các vòng lặp tần suất cao không có kết quả (cùng công cụ, cùng đầu vào, lỗi lặp lại).
- Phát hiện các mẫu gọi lặp lại cụ thể cho những công cụ thăm dò đã biết.
- Ngăn các chu kỳ tràn ngữ cảnh rồi Compaction rồi lặp lại cùng vòng lặp chạy vô thời hạn.

## Khối cấu hình

Giá trị mặc định toàn cục, với mọi trường được tài liệu hóa hiển thị:

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
| `enabled`                        | `false`  | Công tắc chính cho các bộ phát hiện dựa trên lịch sử cuộn. Đặt `false` cũng tắt bộ bảo vệ sau Compaction.                      |
| `historySize`                    | `30`     | Số lượng lần gọi công cụ gần đây được giữ lại để phân tích.                                                                     |
| `warningThreshold`               | `10`     | Ngưỡng trước khi một mẫu được phân loại là chỉ cảnh báo.                                                                        |
| `criticalThreshold`              | `20`     | Ngưỡng để chặn các mẫu vòng lặp lặp lại.                                                                                       |
| `unknownToolThreshold`           | `10`     | Chặn các lần gọi lặp lại đến cùng một công cụ không khả dụng sau số lần hụt này.                                                |
| `globalCircuitBreakerThreshold`  | `30`     | Ngưỡng ngắt mạch không tiến triển toàn cục trên mọi bộ phát hiện.                                                              |
| `detectors.genericRepeat`        | `true`   | Phát hiện các mẫu lặp lại cùng công cụ + cùng tham số.                                                                          |
| `detectors.knownPollNoProgress`  | `true`   | Phát hiện các mẫu giống thăm dò đã biết mà không có thay đổi trạng thái.                                                       |
| `detectors.pingPong`             | `true`   | Phát hiện các mẫu ping-pong xen kẽ.                                                                                             |
| `postCompactionGuard.windowSize` | `3`      | Số lần gọi công cụ sau Compaction mà bộ bảo vệ vẫn được kích hoạt và số lượng bộ ba giống nhau khiến lượt chạy bị hủy.         |

Với `exec`, các kiểm tra không tiến triển so sánh các kết quả lệnh ổn định và bỏ qua siêu dữ liệu runtime biến động như thời lượng, PID, ID phiên và thư mục làm việc. Khi có ID lượt chạy, lịch sử gọi công cụ gần đây chỉ được đánh giá trong lượt chạy đó để các chu kỳ Heartbeat theo lịch và các lượt chạy mới không kế thừa số vòng lặp cũ từ những lượt chạy trước.

## Thiết lập được khuyến nghị

- Với các mô hình nhỏ hơn, đặt `enabled: true` và giữ các ngưỡng ở giá trị mặc định. Các mô hình hàng đầu hiếm khi cần phát hiện dựa trên lịch sử cuộn và có thể để công tắc chính là `false` trong khi vẫn hưởng lợi từ bộ bảo vệ sau Compaction.
- Giữ thứ tự ngưỡng là `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Nếu xảy ra dương tính giả:
  - Tăng `warningThreshold` và/hoặc `criticalThreshold`.
  - Có thể tăng `globalCircuitBreakerThreshold`.
  - Chỉ tắt bộ phát hiện cụ thể gây ra vấn đề (`detectors.<name>: false`).
  - Giảm `historySize` để có ngữ cảnh lịch sử ít nghiêm ngặt hơn.
- Để tắt mọi thứ (bao gồm bộ bảo vệ sau Compaction), đặt rõ ràng `tools.loopDetection.enabled: false`.

## Bộ bảo vệ sau Compaction

Khi runner hoàn tất một compaction-retry sau khi tràn ngữ cảnh, nó kích hoạt một bộ bảo vệ cửa sổ ngắn theo dõi vài lần gọi công cụ tiếp theo. Nếu agent phát ra cùng một bộ ba `(toolName, argsHash, resultHash)` nhiều lần trong cửa sổ, bộ bảo vệ kết luận rằng Compaction không phá được vòng lặp và hủy lượt chạy với lỗi `compaction_loop_persisted`.

Bộ bảo vệ được kiểm soát bởi cờ chính `tools.loopDetection.enabled` với một điểm khác biệt: nó vẫn **được bật khi cờ chưa được đặt hoặc là `true`** và chỉ ngừng hoạt động khi cờ được đặt rõ ràng là `false`. Điều này là có chủ ý. Bộ bảo vệ tồn tại để thoát khỏi các vòng lặp Compaction vốn có thể tiêu tốn token không giới hạn, vì vậy người dùng không cấu hình vẫn nhận được sự bảo vệ.

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
- `windowSize` cao hơn cho agent nhiều lần thử phục hồi hơn.
- Bộ bảo vệ không bao giờ hủy khi kết quả đang thay đổi, mà chỉ khi kết quả giống hệt từng byte trong cửa sổ.
- Nó có phạm vi hẹp có chủ ý: chỉ kích hoạt ngay sau một lần compaction-retry.

<Note>
  Bộ bảo vệ sau Compaction chạy bất cứ khi nào cờ chính không được đặt rõ ràng là `false`, ngay cả khi bạn chưa từng viết khối `tools.loopDetection`. Để xác minh, tìm `post-compaction guard armed for N attempts` trong nhật ký Gateway ngay sau một sự kiện Compaction.
</Note>

## Nhật ký và hành vi dự kiến

Khi một vòng lặp được phát hiện, OpenClaw báo cáo một sự kiện vòng lặp và hoặc làm giảm nhịp hoặc chặn chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng. Điều này bảo vệ người dùng khỏi chi tiêu token vượt kiểm soát và tình trạng treo, đồng thời vẫn giữ quyền truy cập công cụ bình thường.

- Cảnh báo xuất hiện trước.
- Việc chặn bớt sẽ theo sau khi các mẫu vẫn tiếp diễn vượt quá ngưỡng cảnh báo.
- Các ngưỡng nghiêm trọng chặn chu kỳ công cụ tiếp theo và hiển thị lý do phát hiện vòng lặp rõ ràng trong bản ghi lượt chạy.
- Bộ bảo vệ sau Compaction phát ra lỗi `compaction_loop_persisted` với tên công cụ vi phạm và số lần gọi giống hệt nhau.

## Liên quan

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/vi/tools/exec-approvals" icon="shield">
    Chính sách cho phép/từ chối đối với thực thi shell.
  </Card>
  <Card title="Thinking levels" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận và tương tác với chính sách provider.
  </Card>
  <Card title="Sub-agents" href="/vi/tools/subagents" icon="users">
    Sinh các agent cô lập để giới hạn hành vi vượt kiểm soát.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ `tools.loopDetection` đầy đủ và ngữ nghĩa hợp nhất.
  </Card>
</CardGroup>
