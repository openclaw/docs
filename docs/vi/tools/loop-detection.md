---
read_when:
    - Người dùng báo cáo rằng các tác tử bị kẹt khi lặp lại các lệnh gọi công cụ
    - Bạn cần tinh chỉnh cơ chế bảo vệ chống lệnh gọi lặp lại
    - Bạn đang chỉnh sửa các chính sách công cụ/thời gian chạy của tác nhân
summary: Cách bật và tinh chỉnh cơ chế bảo vệ phát hiện các vòng lặp gọi công cụ lặp lại
title: Phát hiện vòng lặp công cụ
x-i18n:
    generated_at: "2026-05-05T01:51:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw có thể ngăn tác tử bị kẹt trong các mẫu lệnh gọi công cụ lặp lại.
Cơ chế bảo vệ này **bị tắt theo mặc định**.

Chỉ bật ở nơi cần thiết, vì với thiết lập nghiêm ngặt, cơ chế này có thể chặn các lệnh gọi lặp lại hợp lệ.

## Vì sao cơ chế này tồn tại

- Phát hiện các chuỗi lặp lại không tạo ra tiến triển.
- Phát hiện vòng lặp tần suất cao không có kết quả (cùng công cụ, cùng đầu vào, lỗi lặp lại).
- Phát hiện các mẫu lệnh gọi lặp lại cụ thể cho các công cụ thăm dò đã biết.

## Khối cấu hình

Giá trị mặc định toàn cục:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Ghi đè theo từng tác tử (không bắt buộc):

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

- `enabled`: Công tắc chính. `false` nghĩa là không thực hiện phát hiện vòng lặp.
- `historySize`: số lệnh gọi công cụ gần đây được giữ lại để phân tích.
- `warningThreshold`: ngưỡng trước khi phân loại một mẫu là chỉ cảnh báo.
- `criticalThreshold`: ngưỡng để chặn các mẫu vòng lặp lặp lại.
- `globalCircuitBreakerThreshold`: ngưỡng ngắt mạch toàn cục khi không có tiến triển.
- `detectors.genericRepeat`: phát hiện các mẫu lặp lại cùng công cụ + cùng tham số.
- `detectors.knownPollNoProgress`: phát hiện các mẫu giống thăm dò đã biết mà không có thay đổi trạng thái.
- `detectors.pingPong`: phát hiện các mẫu ping-pong luân phiên.

Đối với `exec`, kiểm tra không có tiến triển so sánh các kết quả lệnh ổn định và bỏ qua siêu dữ liệu thời gian chạy dễ biến động như thời lượng, PID, ID phiên và thư mục làm việc.
Khi có ID lượt chạy, lịch sử lệnh gọi công cụ gần đây chỉ được đánh giá trong lượt chạy đó, để các chu kỳ Heartbeat theo lịch và các lượt chạy mới không thừa hưởng bộ đếm vòng lặp cũ từ các lượt chạy trước.

## Thiết lập khuyến nghị

- Với các mô hình nhỏ hơn, bắt đầu bằng `enabled: true`, giữ nguyên giá trị mặc định. Các mô hình hàng đầu hiếm khi cần phát hiện vòng lặp và có thể để tắt.
- Giữ các ngưỡng theo thứ tự `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Nếu xảy ra dương tính giả:
  - tăng `warningThreshold` và/hoặc `criticalThreshold`
  - (không bắt buộc) tăng `globalCircuitBreakerThreshold`
  - chỉ tắt bộ phát hiện gây ra vấn đề
  - giảm `historySize` để dùng ngữ cảnh lịch sử ít nghiêm ngặt hơn

## Cơ chế bảo vệ sau Compaction

Khi trình chạy hoàn tất một lần tự động thử lại sau Compaction (sau khi tràn ngữ cảnh), nó kích hoạt một cơ chế bảo vệ trong cửa sổ ngắn để theo dõi vài lệnh gọi công cụ tiếp theo. Nếu tác tử phát ra bộ ba `(toolName, args, result)` _giống nhau_ nhiều lần trong cửa sổ đó, cơ chế bảo vệ kết luận rằng Compaction không phá vỡ được vòng lặp và hủy lượt chạy với lỗi `compaction_loop_persisted`.

Đây là một đường mã riêng với các bộ phát hiện `tools.loopDetection` toàn cục. Nó có thể được cấu hình độc lập:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: số lệnh gọi công cụ sau Compaction mà cơ chế bảo vệ vẫn được kích hoạt _và_ số bộ ba (công cụ, đối số, kết quả) giống hệt nhau sẽ kích hoạt hủy.

Cơ chế bảo vệ không bao giờ hủy khi kết quả đang thay đổi, chỉ hủy khi kết quả giống hệt từng byte trong toàn bộ cửa sổ. Cơ chế này được cố ý giới hạn hẹp: nó chỉ kích hoạt ngay sau một lần thử lại Compaction.

## Nhật ký và hành vi mong đợi

Khi phát hiện vòng lặp, OpenClaw báo cáo một sự kiện vòng lặp và chặn hoặc giảm cường độ chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng.
Điều này bảo vệ người dùng khỏi tiêu tốn token mất kiểm soát và treo hệ thống, đồng thời vẫn duy trì quyền truy cập công cụ bình thường.

- Ưu tiên cảnh báo và tạm thời chặn trước.
- Chỉ leo thang khi bằng chứng lặp lại tích lũy.

## Ghi chú

- `tools.loopDetection` được hợp nhất với các ghi đè ở cấp tác tử.
- Cấu hình theo từng tác tử ghi đè hoàn toàn hoặc mở rộng các giá trị toàn cục.
- Nếu không có cấu hình, các cơ chế bảo vệ vẫn tắt.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals)
- [Mức suy nghĩ](/vi/tools/thinking)
- [Tác tử phụ](/vi/tools/subagents)
