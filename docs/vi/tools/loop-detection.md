---
read_when:
    - Một người dùng báo cáo rằng các tác tử bị kẹt khi lặp lại các lệnh gọi công cụ
    - Bạn cần điều chỉnh cơ chế bảo vệ chống lệnh gọi lặp lại
    - Bạn đang chỉnh sửa các chính sách về công cụ/thời gian chạy của tác tử
summary: Cách bật và tinh chỉnh các cơ chế bảo vệ phát hiện vòng lặp gọi công cụ lặp đi lặp lại
title: Phát hiện vòng lặp công cụ
x-i18n:
    generated_at: "2026-04-29T23:19:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw có thể giúp ngăn các tác nhân bị kẹt trong các mẫu gọi công cụ lặp lại.
Cơ chế bảo vệ này **bị tắt theo mặc định**.

Chỉ bật ở nơi cần thiết, vì với cài đặt nghiêm ngặt, nó có thể chặn các lệnh gọi lặp lại hợp lệ.

## Lý do tồn tại

- Phát hiện các chuỗi lặp lại không tạo tiến triển.
- Phát hiện các vòng lặp không có kết quả với tần suất cao (cùng công cụ, cùng đầu vào, lỗi lặp lại).
- Phát hiện các mẫu gọi lặp lại cụ thể cho các công cụ thăm dò đã biết.

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

Ghi đè theo từng tác nhân (không bắt buộc):

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
- `detectors.genericRepeat`: phát hiện các mẫu cùng công cụ + cùng tham số được lặp lại.
- `detectors.knownPollNoProgress`: phát hiện các mẫu giống thăm dò đã biết mà không có thay đổi trạng thái.
- `detectors.pingPong`: phát hiện các mẫu ping-pong luân phiên.

Đối với `exec`, các kiểm tra không có tiến triển so sánh kết quả lệnh ổn định và bỏ qua siêu dữ liệu thời gian chạy hay thay đổi như thời lượng, PID, ID phiên và thư mục làm việc.
Khi có ID lần chạy, lịch sử gọi công cụ gần đây chỉ được đánh giá trong lần chạy đó, để các chu kỳ Heartbeat theo lịch và các lần chạy mới không kế thừa số đếm vòng lặp cũ từ những lần chạy trước.

## Thiết lập được khuyến nghị

- Bắt đầu với `enabled: true`, giữ nguyên các giá trị mặc định.
- Giữ thứ tự ngưỡng là `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Nếu xảy ra cảnh báo sai:
  - tăng `warningThreshold` và/hoặc `criticalThreshold`
  - (không bắt buộc) tăng `globalCircuitBreakerThreshold`
  - chỉ tắt bộ phát hiện đang gây sự cố
  - giảm `historySize` để bối cảnh lịch sử bớt nghiêm ngặt hơn

## Nhật ký và hành vi dự kiến

Khi phát hiện vòng lặp, OpenClaw báo cáo một sự kiện vòng lặp và chặn hoặc làm giảm nhịp chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng.
Điều này bảo vệ người dùng khỏi chi phí token tăng mất kiểm soát và tình trạng treo, trong khi vẫn duy trì quyền truy cập công cụ bình thường.

- Ưu tiên cảnh báo và tạm thời chặn trước.
- Chỉ nâng mức khi bằng chứng lặp lại tích lũy.

## Ghi chú

- `tools.loopDetection` được hợp nhất với các ghi đè ở cấp tác nhân.
- Cấu hình theo từng tác nhân ghi đè hoàn toàn hoặc mở rộng các giá trị toàn cục.
- Nếu không có cấu hình, các biện pháp bảo vệ vẫn tắt.

## Liên quan

- [Phê duyệt Exec](/vi/tools/exec-approvals)
- [Mức độ suy nghĩ](/vi/tools/thinking)
- [Tác nhân phụ](/vi/tools/subagents)
