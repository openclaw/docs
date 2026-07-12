---
read_when:
    - Một người dùng báo cáo rằng các tác tử bị kẹt trong việc lặp lại các lệnh gọi công cụ
    - Bạn cần tinh chỉnh cơ chế bảo vệ chống các lệnh gọi lặp lại
    - Bạn đang chỉnh sửa các chính sách về công cụ/thời gian chạy của tác nhân
    - Bạn gặp phải các lần hủy `compaction_loop_persisted` sau khi thử lại do tràn ngữ cảnh
summary: Cách bật và tinh chỉnh các biện pháp bảo vệ để phát hiện vòng lặp gọi công cụ lặp đi lặp lại
title: Phát hiện vòng lặp công cụ
x-i18n:
    generated_at: "2026-07-12T08:30:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw có hai cơ chế bảo vệ phối hợp nhằm ngăn chặn các mẫu gọi công cụ lặp lại,
cả hai đều được cấu hình trong `tools.loopDetection`:

1. **Phát hiện vòng lặp** (`enabled`) - mặc định bị tắt. Theo dõi lịch sử
   gọi công cụ luân phiên để phát hiện các mẫu lặp lại và những lần thử lại công cụ không xác định.
2. **Cơ chế bảo vệ sau Compaction** (`postCompactionGuard`) - được bật bất cứ khi nào
   `enabled` không được đặt rõ ràng thành `false`. Kích hoạt sau mỗi lần thử lại sau Compaction và
   hủy lượt chạy nếu tác tử lặp lại cùng một bộ ba `(tool, args, result)`
   trong cửa sổ.

Đặt `tools.loopDetection.enabled: false` để tắt cả hai cơ chế bảo vệ.

## Lý do tồn tại

- Phát hiện các chuỗi lặp lại không tạo ra tiến triển.
- Phát hiện các vòng lặp không có kết quả với tần suất cao (cùng công cụ, cùng đầu vào, lỗi
  lặp lại).
- Phát hiện các mẫu gọi lặp lại cụ thể đối với những công cụ thăm dò đã biết.
- Ngắt chu kỳ tràn ngữ cảnh -> Compaction -> lặp lại cùng vòng lặp thay vì để
  chúng chạy vô thời hạn.

## Khối cấu hình

Các giá trị mặc định toàn cục, hiển thị mọi trường đã được lập tài liệu:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // công tắc chính cho các bộ phát hiện dựa trên lịch sử luân phiên
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
        windowSize: 3, // kích hoạt sau lần thử lại sau Compaction; chạy trừ khi enabled được đặt rõ ràng thành false
      },
    },
  },
}
```

Ghi đè theo từng tác tử (tùy chọn, tại `agents.list[].tools.loopDetection`):

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

Cài đặt theo từng tác tử sẽ phủ lên khối toàn cục theo từng trường (bao gồm cả
`detectors` và `postCompactionGuard` lồng nhau), vì vậy tác tử chỉ cần đặt
những trường mà nó muốn thay đổi.

### Hành vi của trường

| Trường                           | Mặc định | Tác dụng                                                                                                                                                                |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`  | Công tắc chính cho các bộ phát hiện dựa trên lịch sử luân phiên. `false` cũng tắt cơ chế bảo vệ sau Compaction.                                                           |
| `historySize`                    | `30`     | Số lần gọi công cụ gần đây được lưu lại để phân tích.                                                                                                                    |
| `warningThreshold`               | `10`     | Số lần lặp trước khi một mẫu được phân loại là chỉ cảnh báo.                                                                                                             |
| `criticalThreshold`              | `20`     | Số lần lặp để chặn một mẫu vòng lặp không có tiến triển. Môi trường chạy sẽ điều chỉnh giá trị này cao hơn `warningThreshold` nếu cấu hình sai.                           |
| `unknownToolThreshold`           | `10`     | Chặn các lần gọi lặp lại đến cùng một công cụ không khả dụng sau số lần không tìm thấy này. Không chịu sự chi phối của `detectors`.                                       |
| `globalCircuitBreakerThreshold`  | `30`     | Bộ ngắt không có tiến triển toàn cục trên tất cả bộ phát hiện. Môi trường chạy sẽ điều chỉnh giá trị này cao hơn `criticalThreshold` nếu cấu hình sai. Không chịu sự chi phối của `detectors`. |
| `detectors.genericRepeat`        | `true`   | Cảnh báo khi lặp lại các lần gọi cùng công cụ + cùng đối số; chặn khi những lần gọi đó cũng trả về kết quả giống hệt nhau.                                                |
| `detectors.knownPollNoProgress`  | `true`   | Phát hiện các mẫu thăm dò không có tiến triển đã biết (`process` với `action: "poll"`/`"log"`, `command_status`).                                                        |
| `detectors.pingPong`             | `true`   | Phát hiện các mẫu ping-pong không có tiến triển xen kẽ giữa hai lần gọi.                                                                                                  |
| `postCompactionGuard.windowSize` | `3`      | Số lần thử mà cơ chế bảo vệ vẫn được kích hoạt sau Compaction, đồng thời là số bộ ba giống hệt nhau khiến lượt chạy bị hủy.                                               |

Đối với `exec`, phép băm trạng thái không có tiến triển so sánh các kết quả lệnh ổn định (trạng thái,
mã thoát, cờ hết thời gian, đầu ra) và bỏ qua siêu dữ liệu biến động của môi trường chạy như
thời lượng, PID, ID phiên và thư mục làm việc. Kết quả gửi tin nhắn đi
được băm sau khi loại bỏ các ID biến động theo từng lần gọi (ID tin nhắn, ID tệp, dấu thời gian),
do đó một kết quả "đã gửi" không bị xem là giống hệt một kết quả "đã gửi"
khác. Khi có ID lượt chạy, lịch sử chỉ được đánh giá trong lượt chạy đó,
vì vậy các chu kỳ Heartbeat đã lên lịch và lượt chạy mới không kế thừa số lần lặp cũ
từ những lượt chạy trước.

## Thiết lập khuyến nghị

- Đối với các mô hình nhỏ hơn, hãy đặt `enabled: true` và giữ nguyên các ngưỡng
  mặc định. Các mô hình hàng đầu hiếm khi cần phát hiện dựa trên lịch sử luân phiên và có thể
  để công tắc chính ở `false` trong khi vẫn hưởng lợi từ
  cơ chế bảo vệ sau Compaction.
- Giữ thứ tự các ngưỡng `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; môi trường chạy sẽ tăng `criticalThreshold` và
  `globalCircuitBreakerThreshold` nếu bạn đặt chúng bằng hoặc thấp hơn
  ngưỡng mà chúng phải vượt qua.
- Nếu xảy ra cảnh báo sai:
  - Tăng `warningThreshold` và/hoặc `criticalThreshold`.
  - Có thể tăng `globalCircuitBreakerThreshold`.
  - Chỉ tắt bộ phát hiện cụ thể gây ra vấn đề (`detectors.<name>: false`).
  - Giảm `historySize` để có cửa sổ lịch sử ngắn hơn.
- Để tắt mọi thứ, bao gồm cả cơ chế bảo vệ sau Compaction, hãy đặt rõ ràng
  `tools.loopDetection.enabled: false`.

## Cơ chế bảo vệ sau Compaction

Sau một lần thử lại sau Compaction tiếp nối sự kiện tràn ngữ cảnh, trình chạy sẽ kích hoạt một
cơ chế bảo vệ với cửa sổ ngắn cho vài lần gọi công cụ tiếp theo. Nếu tác tử phát ra cùng một
bộ ba `(toolName, argsHash, resultHash)` đủ `postCompactionGuard.windowSize`
lần trong cửa sổ đó, cơ chế bảo vệ kết luận rằng Compaction không ngắt được
vòng lặp và hủy lượt chạy với lỗi `compaction_loop_persisted`.

Cơ chế bảo vệ chịu sự chi phối của cờ chính `tools.loopDetection.enabled`, nhưng có một
điểm khác biệt: nó vẫn **được bật khi cờ chưa được đặt hoặc là `true`**, và chỉ
tắt khi cờ được đặt rõ ràng thành `false`. Đây là chủ ý - cơ chế bảo vệ
tồn tại để thoát khỏi các vòng lặp Compaction vốn sẽ tiêu tốn token không giới hạn,
vì vậy người dùng không cấu hình vẫn được bảo vệ.

```json5
{
  tools: {
    loopDetection: {
      // công tắc chính; đặt thành false để tắt cơ chế bảo vệ cùng các bộ phát hiện luân phiên
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // mặc định
      },
    },
  },
}
```

- `windowSize` thấp hơn sẽ nghiêm ngặt hơn (ít lần thử hơn trước khi hủy).
- `windowSize` cao hơn cho tác tử nhiều lần thử khôi phục hơn.
- Cơ chế bảo vệ không bao giờ hủy khi kết quả vẫn thay đổi; chỉ những kết quả
  giống hệt từng byte trong cửa sổ mới kích hoạt nó.
- Nó chỉ kích hoạt ngay sau một lần thử lại sau Compaction, không phải tại các
  thời điểm khác trong lượt chạy.

<Note>
  Cơ chế bảo vệ sau Compaction chạy bất cứ khi nào cờ chính không được đặt rõ ràng thành `false`, ngay cả khi bạn chưa từng viết khối `tools.loopDetection`. Để xác minh, hãy tìm `post-compaction guard armed for N attempts` trong nhật ký Gateway ngay sau một sự kiện Compaction.
</Note>

## Nhật ký và hành vi dự kiến

Khi phát hiện vòng lặp, OpenClaw ghi lại một sự kiện vòng lặp và cảnh báo hoặc chặn
chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng, qua đó bảo vệ khỏi việc tiêu tốn token
mất kiểm soát và tình trạng treo trong khi vẫn duy trì quyền truy cập công cụ bình thường.

- Cảnh báo xuất hiện trước.
- Việc chặn diễn ra khi một mẫu tiếp tục vượt quá ngưỡng cảnh báo.
- Các ngưỡng nghiêm trọng chặn chu kỳ công cụ tiếp theo và hiển thị rõ
  lý do phát hiện vòng lặp trong bản ghi lượt chạy.
- Cơ chế bảo vệ sau Compaction phát ra lỗi `compaction_loop_persisted`, nêu rõ
  công cụ vi phạm và số lần gọi giống hệt nhau.

## Liên quan

<CardGroup cols={2}>
  <Card title="Phê duyệt Exec" href="/vi/tools/exec-approvals" icon="shield">
    Chính sách cho phép/từ chối việc thực thi shell.
  </Card>
  <Card title="Mức độ suy luận" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận và sự tương tác với chính sách của nhà cung cấp.
  </Card>
  <Card title="Tác tử phụ" href="/vi/tools/subagents" icon="users">
    Khởi tạo các tác tử biệt lập để giới hạn hành vi mất kiểm soát.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-tools#toolsloopdetection" icon="gear">
    Lược đồ `tools.loopDetection` đầy đủ và ngữ nghĩa hợp nhất.
  </Card>
</CardGroup>
