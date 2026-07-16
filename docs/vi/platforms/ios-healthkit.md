---
read_when:
    - Bật bản tóm tắt HealthKit trên Node iPhone
    - Gọi health.summary hoặc khắc phục sự cố thiếu chỉ số sức khỏe
    - Xem xét những dữ liệu sức khỏe nào có thể rời khỏi iPhone
summary: Bật và gọi các bản tóm tắt HealthKit có kiểm soát quyền riêng tư từ một Node iPhone
title: Bản tóm tắt HealthKit
x-i18n:
    generated_at: "2026-07-16T15:26:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Bản tóm tắt HealthKit

OpenClaw có thể yêu cầu bản tóm tắt chỉ đọc cho ngày hiện tại theo lịch từ một
node iPhone đã kết nối. iPhone tính toán dữ liệu tổng hợp ngay trên thiết bị và chỉ trả về
số bước chân, thời lượng ngủ, nhịp tim nghỉ trung bình cùng số lượng/thời lượng
buổi tập. Không hỗ trợ các mẫu HealthKit riêng lẻ, nguồn, siêu dữ liệu, hồ sơ
lâm sàng, thu nạp trong nền và thao tác ghi.

Tính năng này mặc định bị tắt. Tính năng yêu cầu sự đồng ý riêng trên iPhone và
ủy quyền trên Gateway.

## Yêu cầu

- Một iPhone chạy ứng dụng OpenClaw iOS, trong đó HealthKit báo cáo dữ liệu sức khỏe là
  khả dụng.
- Một node iPhone đã kết nối và được phê duyệt. Xem [thiết lập ứng dụng iOS](/vi/platforms/ios).
- Một Gateway hiện hành có thể kết nối đến node iPhone.
- Dữ liệu Health có thể đọc được cho mọi chỉ số bạn muốn xem. Apple Watch có thể
  đóng góp dữ liệu vào kho Health trên iPhone, nhưng ứng dụng OpenClaw watchOS
  không bắt buộc đối với bản tóm tắt HealthKit.

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

`health.summary` được phân loại là liên quan nhiều đến quyền riêng tư và không bao giờ được
mặc định nền tảng iOS cho phép. Một mục trong `gateway.nodes.denyCommands` sẽ ghi đè
mục cho phép. Xem [chính sách lệnh Node](/vi/nodes#command-policy).

### 2. Bật chia sẻ trên iPhone

Trong ứng dụng iOS:

1. Mở **Settings -> Permissions -> Privacy & Access -> Health Summaries**.
2. Chạm vào **Enable & Share Summaries**.
3. Đọc nội dung công bố, sau đó chọn các danh mục Health mà OpenClaw có thể đọc
   trong bảng cấp quyền của Apple.

Công tắc này ghi nhận lựa chọn chia sẻ rõ ràng của bạn với OpenClaw. Điều này không khẳng định
rằng Apple đã cấp quyền cho mọi danh mục được yêu cầu.

Việc bật bản tóm tắt Health sẽ thêm `health.summary` vào bề mặt lệnh đã khai báo
của node. Phê duyệt bản cập nhật ghép nối node phát sinh:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Sau đó, xác minh rằng iPhone đã kết nối cung cấp lệnh `health.summary`
có hiệu lực:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Yêu cầu bản tóm tắt hôm nay

Chỉ hỗ trợ `today`. Khoảng thời gian này kéo dài từ nửa đêm theo giờ địa phương đến thời điểm yêu cầu,
sử dụng lịch và múi giờ hiện tại của iPhone.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Tác nhân có thể gọi cùng lệnh bằng công cụ `nodes`:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

Tải trọng bản tóm tắt chứa:

| Trường                   | Ý nghĩa                                              |
| ------------------------ | ---------------------------------------------------- |
| `period`                 | Luôn là `today`                                      |
| `startISO`               | Thời điểm bắt đầu ngày theo giờ địa phương, mã hóa dưới dạng thời điểm ISO |
| `endISO`                 | Thời điểm yêu cầu, mã hóa dưới dạng thời điểm ISO     |
| `timeZoneIdentifier`     | Mã định danh múi giờ của iPhone                       |
| `stepCount`              | Tổng số bước chân đã làm tròn                         |
| `sleepDurationMinutes`   | Thời gian ngủ đã loại trùng lặp, giới hạn trong hôm nay |
| `restingHeartRateBpm`    | Nhịp tim nghỉ trung bình                              |
| `workoutCount`           | Các buổi tập bắt đầu hôm nay                          |
| `workoutDurationMinutes` | Tổng thời lượng của các buổi tập đó                   |

Các trường chỉ số là tùy chọn và bị lược bỏ khi HealthKit không trả về giá trị
có thể đọc được. Các giai đoạn ngủ và nguồn chồng lấn được hợp nhất trước khi tính
thời lượng, vì vậy cùng một phút không bị tính hai lần.

## Hành vi về quyền riêng tư

- Quá trình tổng hợp diễn ra trên iPhone. Các mẫu thô không rời khỏi thiết bị.
- Dữ liệu tổng hợp được yêu cầu rời khỏi iPhone thông qua Gateway của bạn. Khi một tác nhân
  yêu cầu dữ liệu này, dữ liệu tổng hợp sẽ đến nhà cung cấp AI đã cấu hình và có thể được lưu lại
  trong lịch sử trò chuyện. Lệnh gọi CLI trực tiếp trả dữ liệu cho người vận hành CLI.
- OpenClaw chỉ yêu cầu quyền đọc. OpenClaw không thể thêm hoặc sửa đổi dữ liệu Health.
- OpenClaw chỉ đọc HealthKit khi `health.summary` được gọi. Không có hoạt động
  thu nạp dữ liệu sức khỏe trong nền.
- HealthKit cố ý không tiết lộ liệu quyền đọc có bị từ chối hay không. Một
  chỉ số bị thiếu có thể là do quyền truy cập bị từ chối, không có mẫu phù hợp hoặc loại
  dữ liệu không khả dụng. OpenClaw không thể phân biệt các trường hợp này.
- Bản tóm tắt dành cho bối cảnh sức khỏe và thể chất cá nhân, không phải để chẩn đoán hoặc
  tư vấn y tế.

Để ngừng chia sẻ, quay lại **Health Summaries** và chạm vào **Disable**. Sau đó, iPhone
sẽ xóa khả năng Health và lệnh `health.summary` khỏi bề mặt
node. Bạn cũng có thể xóa `health.summary` khỏi
`gateway.nodes.allowCommands` để đóng cổng ở phía Gateway.

## Khắc phục sự cố

### Lệnh không được node khai báo

Xác nhận rằng bản tóm tắt Health đã được bật trong ứng dụng iOS và iPhone đã kết nối.
Chạy `openclaw nodes pending` và phê duyệt mọi bản cập nhật khả năng, sau đó kiểm tra lại
`openclaw nodes describe --node "<iPhone name>"`.

### Lệnh yêu cầu chủ động cho phép rõ ràng

Thêm `health.summary` vào `gateway.nodes.allowCommands`. Đồng thời kiểm tra để đảm bảo
`gateway.nodes.denyCommands` không chứa mục này; danh sách từ chối được ưu tiên.

### `HEALTH_ACCESS_DISABLED`

Công tắc chia sẻ phía ứng dụng đang tắt. Bật **Health Summaries** trong
**Privacy & Access** trên iPhone.

### Bản tóm tắt thành công nhưng thiếu chỉ số

Mở ứng dụng Health của Apple và xác nhận rằng có dữ liệu cho hôm nay. Kiểm tra
quyền truy cập của OpenClaw trong phần cài đặt Health của Apple, nhưng không coi kết quả trống
là bằng chứng cho thấy quyền truy cập đã bị từ chối: HealthKit cố ý che giấu sự khác biệt đó.

### Khoảng thời gian cũ hơn không hoạt động

Lệnh chỉ chấp nhận `{"period":"today"}`. Không hỗ trợ bản tóm tắt
nhiều ngày và dữ liệu lịch sử.

## Liên quan

- [Ứng dụng iOS](/vi/platforms/ios)
- [Node](/vi/nodes)
- [Tài liệu tham khảo cấu hình Gateway](/vi/gateway/configuration-reference#gateway)
- [Kiểm tra bảo mật](/vi/gateway/security)
