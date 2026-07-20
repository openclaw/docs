---
read_when:
    - Một người dùng báo cáo rằng các agent bị mắc kẹt trong việc lặp lại các lệnh gọi công cụ
    - Bạn cần kiểm soát cơ chế bảo vệ khỏi các lệnh gọi lặp lại
    - Bạn đang chỉnh sửa các chính sách về công cụ/thời gian chạy của agent
    - Bạn gặp lỗi hủy `compaction_loop_persisted` sau khi thử lại do tràn ngữ cảnh
summary: Cách bật các biện pháp bảo vệ để phát hiện vòng lặp gọi công cụ lặp đi lặp lại
title: Phát hiện vòng lặp công cụ
x-i18n:
    generated_at: "2026-07-20T04:51:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e03691eaa2148b2843003d8a6d04f21b6552a8d058b95df8cfa95938a3922c56
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw có hai cơ chế bảo vệ phối hợp để chống lại các mẫu gọi công cụ lặp lại,
cả hai đều được cấu hình trong `tools.loopDetection`:

1. **Phát hiện vòng lặp** (`enabled`) - bị tắt theo mặc định. Theo dõi lịch sử
   gọi công cụ dạng cửa sổ trượt để phát hiện các mẫu lặp lại và các lần thử lại công cụ không xác định.
2. **Cơ chế bảo vệ sau compaction** - được bật bất cứ khi nào
   `enabled` không được đặt rõ ràng thành `false`. Được kích hoạt sau mỗi lần thử lại do compaction và
   hủy lượt chạy nếu agent lặp lại cùng một bộ ba `(tool, args, result)`
   trong cửa sổ.

Đặt `tools.loopDetection.enabled: false` để tắt cả hai cơ chế bảo vệ.

## Lý do tồn tại

- Phát hiện các chuỗi lặp lại không tạo ra tiến triển.
- Phát hiện các vòng lặp tần suất cao không có kết quả (cùng công cụ, cùng đầu vào, lỗi
  lặp lại).
- Phát hiện các mẫu gọi lặp cụ thể đối với những công cụ thăm dò đã biết.
- Phá vỡ các chu kỳ tràn ngữ cảnh -> compaction -> lặp lại cùng vòng lặp thay vì để
  chúng chạy vô thời hạn.

## Khối cấu hình

Thiết lập toàn cục:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // công tắc chính cho các bộ phát hiện dựa trên lịch sử dạng cửa sổ trượt
    },
  },
}
```

Ghi đè theo từng agent (không bắt buộc, tại `agents.list[].tools.loopDetection`):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
          },
        },
      },
    ],
  },
}
```

Thiết lập theo từng agent ghi đè thiết lập toàn cục.

### Hành vi của trường

| Trường     | Mặc định | Tác dụng                                                                                            |
| --------- | ------- | ------------------------------------------------------------------------------------------------- |
| `enabled` | `false` | Công tắc chính cho các bộ phát hiện dựa trên lịch sử dạng cửa sổ trượt. `false` cũng tắt cơ chế bảo vệ sau compaction. |

Đối với `exec`, phép băm trạng thái không tiến triển so sánh các kết quả lệnh ổn định (trạng thái,
mã thoát, cờ hết thời gian chờ, đầu ra) và bỏ qua siêu dữ liệu thời gian chạy dễ thay đổi như
thời lượng, PID, ID phiên và thư mục làm việc. Kết quả gửi tin nhắn đi
được băm sau khi loại bỏ các ID dễ thay đổi theo từng lần gọi (ID tin nhắn, ID tệp, dấu thời gian),
vì vậy một kết quả "đã gửi" không bị coi là giống hệt một kết quả "đã gửi"
khác. Khi có ID lượt chạy, lịch sử chỉ được đánh giá trong lượt chạy đó,
do đó các chu kỳ heartbeat theo lịch và lượt chạy mới không kế thừa số lần lặp cũ
từ các lượt chạy trước.

## Thiết lập đề xuất

- Đối với các mô hình nhỏ hơn, hãy đặt `enabled: true`. Các mô hình hàng đầu hiếm khi cần phát hiện dựa trên lịch sử dạng cửa sổ trượt và có thể
  để công tắc chính ở `false` trong khi vẫn được hưởng lợi từ
  cơ chế bảo vệ sau compaction.
- Để tắt mọi thứ, bao gồm cả cơ chế bảo vệ sau compaction, hãy đặt
  rõ ràng `tools.loopDetection.enabled: false`.

## Cơ chế bảo vệ sau compaction

Sau một lần thử lại do compaction tiếp sau sự cố tràn ngữ cảnh, trình chạy kích hoạt một
cơ chế bảo vệ cửa sổ ngắn cho vài lần gọi công cụ tiếp theo. Nếu agent phát ra cùng một
bộ ba `(toolName, argsHash, resultHash)` đủ số lần trong cửa sổ đó, cơ chế bảo vệ kết luận rằng compaction không phá vỡ được
vòng lặp và hủy lượt chạy với lỗi `compaction_loop_persisted`.

Cơ chế bảo vệ được kiểm soát bởi cờ chính `tools.loopDetection.enabled` với một
điểm đặc biệt: nó vẫn **được bật khi cờ chưa được đặt hoặc là `true`**, và chỉ
tắt khi cờ được đặt rõ ràng thành `false`. Đây là chủ ý - cơ chế bảo vệ
tồn tại để thoát khỏi các vòng lặp compaction vốn sẽ tiêu tốn lượng token không giới hạn,
vì vậy người dùng không cấu hình vẫn được bảo vệ.

```json5
{
  tools: {
    loopDetection: {
      // công tắc chính; đặt thành false để tắt cơ chế bảo vệ cùng các bộ phát hiện dạng cửa sổ trượt
      enabled: true,
    },
  },
}
```

- Cơ chế bảo vệ không bao giờ hủy khi các kết quả đang thay đổi; chỉ những kết quả
  giống hệt từng byte trong cửa sổ mới kích hoạt cơ chế này.
- Cơ chế này chỉ được kích hoạt ngay sau một lần thử lại do compaction, không phải tại các
  thời điểm khác trong lượt chạy.

<Note>
  Cơ chế bảo vệ sau compaction chạy bất cứ khi nào cờ chính không được đặt rõ ràng thành `false`, ngay cả khi bạn chưa từng viết khối `tools.loopDetection`. Để xác minh, hãy tìm `post-compaction guard armed for N attempts` trong nhật ký Gateway ngay sau một sự kiện compaction.
</Note>

## Nhật ký và hành vi dự kiến

Khi phát hiện vòng lặp, OpenClaw ghi nhật ký một sự kiện vòng lặp và cảnh báo hoặc chặn
chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng, giúp chống lại việc tiêu tốn token
mất kiểm soát và tình trạng treo trong khi vẫn duy trì quyền truy cập công cụ bình thường.

- Cảnh báo xuất hiện trước.
- Việc chặn diễn ra khi một mẫu tiếp tục tồn tại quá ngưỡng cảnh báo.
- Các ngưỡng nghiêm trọng chặn chu kỳ công cụ tiếp theo và hiển thị rõ
  lý do phát hiện vòng lặp trong bản ghi lượt chạy.
- Cơ chế bảo vệ sau compaction phát ra lỗi `compaction_loop_persisted` nêu rõ
  công cụ gây lỗi và số lần gọi giống hệt nhau.

## Liên quan

<CardGroup cols={2}>
  <Card title="Phê duyệt Exec" href="/vi/tools/exec-approvals" icon="shield">
    Chính sách cho phép/từ chối thực thi shell.
  </Card>
  <Card title="Mức độ suy luận" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận và sự tương tác với chính sách của nhà cung cấp.
  </Card>
  <Card title="Agent con" href="/vi/tools/subagents" icon="users">
    Khởi tạo các agent biệt lập để giới hạn hành vi mất kiểm soát.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-tools#toolsloopdetection" icon="gear">
    Lược đồ `tools.loopDetection` đầy đủ và ngữ nghĩa hợp nhất.
  </Card>
</CardGroup>
