---
read_when:
    - Bật bản tóm tắt HealthKit trên Node iOS
    - Gọi health.summary hoặc khắc phục sự cố thiếu chỉ số tình trạng hệ thống
    - Xem xét dữ liệu sức khỏe nào có thể rời khỏi thiết bị iOS
summary: Bật và gọi các bản tóm tắt HealthKit có kiểm soát quyền riêng tư từ một node iOS
title: Tóm tắt HealthKit
x-i18n:
    generated_at: "2026-07-19T05:50:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 58c7d0cefcf55f653d19d796a70c2a27d299cf2c14c0cb5cf5e182ce080fdcb5
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Bản tóm tắt HealthKit

OpenClaw có thể yêu cầu bản tóm tắt chỉ đọc về ngày dương lịch hiện tại từ một
Node iPhone hoặc iPad đã kết nối. Thiết bị tính toán dữ liệu tổng hợp ngay trên thiết bị và chỉ trả về
số bước chân, thời lượng ngủ, nhịp tim nghỉ trung bình cùng số lượng/thời lượng
buổi tập. Các mẫu HealthKit riêng lẻ, nguồn, siêu dữ liệu, hồ sơ lâm sàng,
thu nạp trong nền và thao tác ghi đều không được hỗ trợ.

Tính năng này mặc định bị tắt. Tính năng yêu cầu sự đồng ý riêng trên thiết bị iOS và
ủy quyền trên Gateway.

## Yêu cầu

- iPhone hoặc iPad chạy ứng dụng OpenClaw iOS mà HealthKit báo dữ liệu sức khỏe là
  khả dụng.
- Node iOS đã kết nối và được phê duyệt. Xem [thiết lập ứng dụng iOS](/vi/platforms/ios).
- Gateway hiện hành có thể kết nối với Node iOS.
- Dữ liệu Sức khỏe có thể đọc được cho mọi chỉ số bạn muốn xem. Apple Watch có thể
  đóng góp dữ liệu vào kho Apple Health, nhưng ứng dụng OpenClaw watchOS
  không bắt buộc để tạo bản tóm tắt HealthKit.

## Bật quyền truy cập

### 1. Ủy quyền lệnh Gateway

Thêm `health.summary` vào mảng `gateway.nodes.allowCommands` hiện có trong
`openclaw.json`. Giữ nguyên mọi lệnh đã có:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` được phân loại là có mức độ nhạy cảm cao về quyền riêng tư và không bao giờ được
mặc định nền tảng iOS cho phép. Một mục trong `gateway.nodes.denyCommands` sẽ ghi đè
mục cho phép. Xem [chính sách lệnh Node](/vi/nodes#command-policy).

### 2. Bật chia sẻ trên thiết bị iOS

Trong ứng dụng iOS:

1. Mở **Settings -> Permissions** và tìm **Apple Health Summaries** trong phần
   **Apple Health** luôn hiển thị.
2. Nhấn **Enable Apple Health Summaries**.
3. Đọc thông báo, sau đó chọn các danh mục Sức khỏe mà OpenClaw được phép đọc
   trong bảng cấp quyền của Apple.

Công tắc này ghi nhận lựa chọn chia sẻ OpenClaw rõ ràng của bạn. Công tắc không khẳng định
rằng Apple đã cấp mọi danh mục được yêu cầu.

Việc bật bản tóm tắt Sức khỏe sẽ thêm `health.summary` vào bề mặt lệnh được khai báo
của Node. Phê duyệt bản cập nhật ghép nối Node thu được:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Sau đó, xác minh thiết bị iOS đã kết nối cung cấp lệnh `health.summary`
có hiệu lực:

```bash
openclaw nodes describe --node "<iOS device name>"
```

## Yêu cầu bản tóm tắt hôm nay

Chỉ hỗ trợ `today`. Khoảng thời gian bắt đầu từ nửa đêm theo giờ địa phương đến thời điểm yêu cầu,
sử dụng lịch và múi giờ hiện tại của thiết bị iOS.

```bash
openclaw nodes invoke \
  --node "<iOS device name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Tác nhân có thể gọi cùng lệnh bằng công cụ `nodes`:

```json
{
  "action": "invoke",
  "node": "<iOS device name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

Dữ liệu bản tóm tắt chứa:

| Trường                   | Ý nghĩa                                        |
| ------------------------ | ---------------------------------------------- |
| `period`                 | Luôn là `today`                               |
| `startISO`               | Thời điểm bắt đầu ngày theo giờ địa phương, được mã hóa dưới dạng thời điểm ISO |
| `endISO`                 | Thời điểm yêu cầu, được mã hóa dưới dạng thời điểm ISO       |
| `timeZoneIdentifier`     | Mã định danh múi giờ của thiết bị iOS               |
| `stepCount`              | Tổng số bước chân tích lũy đã làm tròn                      |
| `sleepDurationMinutes`   | Thời gian ngủ đã loại bỏ trùng lặp, được giới hạn trong hôm nay    |
| `restingHeartRateBpm`    | Nhịp tim nghỉ trung bình                    |
| `workoutCount`           | Các buổi tập bắt đầu hôm nay                   |
| `workoutDurationMinutes` | Tổng thời lượng của các buổi tập đó              |

Các trường chỉ số là tùy chọn và sẽ bị bỏ qua khi HealthKit không trả về giá trị
có thể đọc được. Các giai đoạn ngủ và nguồn trùng lặp được hợp nhất trước khi tính
thời lượng, vì vậy cùng một phút sẽ không bị tính hai lần.

## Hành vi về quyền riêng tư

- Quá trình tổng hợp diễn ra trên thiết bị iOS. Các mẫu thô không rời khỏi thiết bị.
- Dữ liệu tổng hợp được yêu cầu rời khỏi thiết bị thông qua Gateway của bạn. Khi tác nhân
  yêu cầu dữ liệu này, dữ liệu tổng hợp sẽ đến nhà cung cấp AI đã cấu hình và có thể được lưu lại
  trong lịch sử trò chuyện. Lệnh gọi CLI trực tiếp trả dữ liệu đó về cho người vận hành CLI.
- OpenClaw chỉ yêu cầu quyền đọc. OpenClaw không thể thêm hoặc sửa đổi dữ liệu Sức khỏe.
- OpenClaw chỉ đọc HealthKit khi `health.summary` được gọi. Không có hoạt động
  thu nạp dữ liệu sức khỏe trong nền.
- HealthKit cố ý không tiết lộ liệu quyền đọc có bị từ chối hay không. Một
  chỉ số bị thiếu có thể có nghĩa là quyền truy cập bị từ chối, không có mẫu phù hợp hoặc kiểu
  dữ liệu không khả dụng. OpenClaw không thể phân biệt các trường hợp này.
- Bản tóm tắt dành cho bối cảnh sức khỏe và thể chất cá nhân, không phải để chẩn đoán hoặc
  tư vấn y tế.

Để ngừng chia sẻ, quay lại **Apple Health Summaries** và nhấn **Turn Off Summaries**.
Sau đó, thiết bị iOS sẽ xóa khả năng Sức khỏe và lệnh `health.summary` khỏi bề mặt
Node. Bạn cũng có thể xóa `health.summary` khỏi
`gateway.nodes.allowCommands` để đóng phía Gateway của cổng kiểm soát.

## Khắc phục sự cố

### Lệnh không được Node khai báo

Xác nhận rằng bản tóm tắt Apple Health đã được bật trong ứng dụng iOS và thiết bị đã kết nối.
Chạy `openclaw nodes pending`, phê duyệt mọi bản cập nhật khả năng, rồi kiểm tra lại
`openclaw nodes describe --node "<iOS device name>"`.

### Lệnh yêu cầu chọn tham gia rõ ràng

Thêm `health.summary` vào `gateway.nodes.allowCommands`. Đồng thời kiểm tra rằng
`gateway.nodes.denyCommands` không chứa mục này; danh sách từ chối được ưu tiên.

### `HEALTH_ACCESS_DISABLED`

Công tắc chia sẻ phía ứng dụng đang tắt. Bật **Apple Health Summaries** trong
**Settings -> Permissions -> Apple Health** trên thiết bị iOS.

### Bản tóm tắt thành công nhưng thiếu chỉ số

Mở ứng dụng Health của Apple và xác nhận rằng hôm nay có dữ liệu. Xem lại
quyền truy cập của OpenClaw trong cài đặt Health của Apple, nhưng không coi kết quả trống
là bằng chứng quyền truy cập đã bị từ chối: HealthKit cố ý che giấu sự khác biệt đó.

### Khoảng thời gian cũ hơn không thành công

Lệnh chỉ chấp nhận `{"period":"today"}`. Bản tóm tắt nhiều ngày và dữ liệu
lịch sử không được hỗ trợ.

## Liên quan

- [Ứng dụng iOS](/vi/platforms/ios)
- [Các Node](/vi/nodes)
- [Tài liệu tham khảo cấu hình Gateway](/vi/gateway/configuration-reference#gateway)
- [Kiểm tra bảo mật](/vi/gateway/security)
