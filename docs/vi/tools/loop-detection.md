---
read_when:
    - Người dùng báo cáo các tác nhân bị kẹt khi lặp lại các lệnh gọi công cụ
    - Bạn cần tinh chỉnh cơ chế bảo vệ chống lệnh gọi lặp lại
    - Bạn đang chỉnh sửa chính sách công cụ/thời gian chạy của tác nhân
summary: Cách bật và tinh chỉnh các cơ chế bảo vệ phát hiện vòng lặp gọi công cụ lặp đi lặp lại
title: Phát hiện vòng lặp công cụ
x-i18n:
    generated_at: "2026-05-03T21:37:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw có thể ngăn các tác tử bị kẹt trong các mẫu gọi công cụ lặp lại.
Cơ chế bảo vệ này **bị tắt theo mặc định**.

Chỉ bật ở nơi cần thiết, vì với thiết lập nghiêm ngặt, cơ chế này có thể chặn các lệnh gọi lặp lại hợp lệ.

## Vì sao cơ chế này tồn tại

- Phát hiện các chuỗi lặp lại không tạo tiến triển.
- Phát hiện các vòng lặp tần suất cao không có kết quả (cùng công cụ, cùng đầu vào, lỗi lặp lại).
- Phát hiện các mẫu gọi lặp lại cụ thể cho các công cụ thăm dò đã biết.

## Khối cấu hình

Mặc định toàn cục:

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

Ghi đè theo từng tác tử (tùy chọn):

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
- `detectors.pingPong`: phát hiện các mẫu ping-pong xen kẽ.

Đối với `exec`, các kiểm tra không có tiến triển so sánh kết quả lệnh ổn định và bỏ qua siêu dữ liệu thời gian chạy dễ biến động như thời lượng, PID, ID phiên và thư mục làm việc.
Khi có id lần chạy, lịch sử gọi công cụ gần đây chỉ được đánh giá trong lần chạy đó, để các chu kỳ Heartbeat đã lên lịch và các lần chạy mới không kế thừa số lần đếm vòng lặp cũ từ những lần chạy trước.

## Thiết lập khuyến nghị

- Với các mô hình nhỏ hơn, hãy bắt đầu bằng `enabled: true`, giữ nguyên các giá trị mặc định. Các mô hình hàng đầu hiếm khi cần phát hiện vòng lặp và có thể để tắt.
- Giữ thứ tự ngưỡng là `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Nếu xảy ra dương tính giả:
  - tăng `warningThreshold` và/hoặc `criticalThreshold`
  - (tùy chọn) tăng `globalCircuitBreakerThreshold`
  - chỉ tắt bộ phát hiện gây ra vấn đề
  - giảm `historySize` để bớt nghiêm ngặt về ngữ cảnh lịch sử

## Nhật ký và hành vi dự kiến

Khi phát hiện vòng lặp, OpenClaw báo cáo một sự kiện vòng lặp và chặn hoặc làm dịu chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng.
Điều này bảo vệ người dùng khỏi chi phí token mất kiểm soát và tình trạng khóa cứng, đồng thời vẫn duy trì quyền truy cập công cụ bình thường.

- Ưu tiên cảnh báo và tạm thời kìm hãm trước.
- Chỉ nâng mức khi bằng chứng lặp lại tích lũy.

## Ghi chú

- `tools.loopDetection` được hợp nhất với các ghi đè cấp tác tử.
- Cấu hình theo từng tác tử ghi đè hoàn toàn hoặc mở rộng các giá trị toàn cục.
- Nếu không có cấu hình, các cơ chế bảo vệ vẫn tắt.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals)
- [Mức độ suy nghĩ](/vi/tools/thinking)
- [Tác tử phụ](/vi/tools/subagents)
