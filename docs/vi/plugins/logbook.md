---
read_when:
    - Bạn muốn một dòng thời gian trong ngày theo phong cách Dayflow trên giao diện điều khiển
    - Bạn đang bật hoặc cấu hình Plugin Logbook đi kèm
    - Bạn muốn bản tóm tắt họp đứng hoặc hồi tưởng trong ngày dựa trên hoạt động trên màn hình
summary: Nhật ký công việc tự động tùy chọn được tạo từ các ảnh chụp màn hình định kỳ
title: Plugin nhật ký
x-i18n:
    generated_at: "2026-07-12T08:08:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Plugin Logbook biến hoạt động trên màn hình thành nhật ký công việc tự động. Plugin này
định kỳ chụp ảnh màn hình từ một Node đã ghép nối, tóm tắt chúng thành
các quan sát có dấu thời gian và tạo các thẻ dòng thời gian trong
[UI điều khiển](/vi/web/control-ui). Plugin cũng có thể tạo ghi chú họp cập nhật hằng ngày và
trả lời các câu hỏi về một ngày được theo dõi.

Trạng thái do OpenClaw sở hữu vẫn nằm trên Gateway tại `<state-dir>/logbook/`, nhưng
việc xử lý bằng mô hình không nhất thiết diễn ra cục bộ. Các ảnh chụp màn hình được lấy mẫu sẽ được gửi đến
tuyến thị giác đã cấu hình; các quan sát và văn bản dòng thời gian được gửi đến mô hình
tác tử mặc định. Hãy sử dụng các tuyến mô hình cục bộ cho cả hai giai đoạn nếu nội dung màn hình và
văn bản hoạt động được suy ra phải được giữ lại trên máy.

Logbook được đóng gói sẵn và mặc định bị vô hiệu hóa. Việc bật Plugin này đồng nghĩa cho phép
Gateway chụp màn hình vì `captureEnabled` mặc định là `true`.

## Trước khi bắt đầu

Bạn cần:

- Một Node đã kết nối có cung cấp `screen.snapshot` hoặc `logbook.snapshot`. Node
  ứng dụng macOS cần quyền Screen Recording. Máy chủ Node macOS không giao diện
  (`openclaw node host run`) nhận lệnh `logbook.snapshot` do Plugin cung cấp,
  được hỗ trợ bởi công cụ hệ thống `screencapture`.
- Plugin Codex đóng gói sẵn đã được bật và xác thực. Codex hiện cung cấp
  hợp đồng trích xuất hình ảnh có cấu trúc mà Logbook yêu cầu. Đăng nhập bằng
  `openclaw models auth login --provider openai`; xem
  [bộ điều phối Codex](/vi/plugins/codex-harness) để biết các phương thức xác thực khác.
- Một mô hình tác tử mặc định đang hoạt động. Logbook sử dụng mô hình này để tổng hợp các thẻ, ghi chú
  họp cập nhật và phần hỏi đáp theo ngày sau bước xử lý thị giác.

## Bắt đầu nhanh

Bật các Plugin Codex và Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Cấu hình rõ ràng một mô hình thị giác để quá trình khởi động có tính xác định:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Nếu bạn sử dụng `plugins.allow`, hãy đưa cả `codex` và `logbook` vào danh sách. Khởi động lại
Gateway sau khi thay đổi cấu hình Plugin, sau đó kiểm tra các đăng ký
và mở bảng điều khiển:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

Mô tả Node phải bao gồm `screen.snapshot` hoặc `logbook.snapshot`.
Các Node không giao diện chỉ quảng bá `logbook.snapshot` sau khi Plugin được kích hoạt.
Xem [khắc phục sự cố Node](/vi/nodes/troubleshooting) nếu lệnh bị thiếu.

Thẻ Logbook chỉ xuất hiện khi Plugin đã được bật và phiên UI điều khiển có quyền
`operator.write`. Hàng trạng thái phải hiển thị **Đang chụp** mà không có lỗi.
Một thẻ dòng thời gian sẽ xuất hiện khi cửa sổ phân tích đóng lại, hoặc bạn có thể chọn
**Phân tích ngay** sau khi hoạt động đã được ghi lại.

## Cách thức hoạt động

1. **Chụp**: cứ mỗi `captureIntervalSeconds` (mặc định 30 giây), Logbook gọi
   lệnh chụp của Node đã chọn và lưu một khung hình JPEG đã đổi tỷ lệ.
   Các khung hình liên tiếp giống hệt nhau được đánh dấu là không hoạt động và bị loại khỏi phân tích.
2. **Quan sát**: khi một cửa sổ phân tích (mặc định 15 phút) kết thúc,
   Plugin lấy mẫu tối đa 16 khung hình đang hoạt động và gửi chúng đến mô hình thị giác,
   mô hình này trả về các quan sát hoạt động có dấu thời gian ("VS Code: đang chỉnh sửa
   store.ts, sửa lỗi kiểu"). Khoảng gián đoạn chụp dài hơn hai phút hoặc
   thời điểm nửa đêm cục bộ cũng sẽ đóng cửa sổ hiện tại.
3. **Tổng hợp**: các quan sát cùng với 45 phút gần nhất của các thẻ hiện có được
   biên tập thành các thẻ dòng thời gian (mỗi thẻ 10–60 phút), bao gồm tiêu đề, tóm tắt,
   danh mục, ứng dụng chính và mọi yếu tố gây xao nhãng ngắn.
4. **Dọn dẹp**: các khung hình cũ hơn `retentionDays` (mặc định 14) sẽ bị xóa.
   Các thẻ, quan sát và ghi chú họp cập nhật đã lưu đệm được giữ lại.

Ranh giới ngày và đồng hồ dòng thời gian sử dụng múi giờ cục bộ của Gateway, không phải
múi giờ của trình duyệt. Các khung hình và cơ sở dữ liệu dòng thời gian SQLite nằm trong
`<state-dir>/logbook/`.

## Luồng mô hình và dữ liệu

Logbook sử dụng hai tuyến mô hình riêng biệt:

| Giai đoạn           | Dữ liệu được gửi                                            | Tuyến mô hình                                                        |
| ------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Quan sát            | Tối đa 16 khung hình JPEG được lấy mẫu cùng thời điểm chụp   | `visionModel`, hoặc một mục Codex `tools.media` tương thích được mượn |
| Tổng hợp thẻ        | Các quan sát có dấu thời gian và các thẻ dòng thời gian gần đây | Mô hình tác tử mặc định thông qua môi trường chạy LLM của Plugin      |
| Tạo ghi chú họp cập nhật | Các thẻ của ngày đã chọn và ngày trước đó               | Mô hình tác tử mặc định thông qua môi trường chạy LLM của Plugin      |
| Hỏi về ngày của bạn | Câu hỏi, các thẻ của ngày đã chọn và các quan sát gần đây    | Mô hình tác tử mặc định thông qua môi trường chạy LLM của Plugin      |

Toàn bộ cơ sở dữ liệu SQLite không được gửi đến bất kỳ mô hình nào. Ảnh chụp màn hình thô chỉ được gửi
đến giai đoạn quan sát; quá trình tổng hợp thẻ, tạo ghi chú họp cập nhật và hỏi đáp chỉ nhận
văn bản được suy ra.

## Cấu hình

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Tất cả các khóa cấu hình Logbook đều là tùy chọn. Các giá trị số được làm tròn thành số nguyên
và giới hạn trong phạm vi được hỗ trợ.

| Khóa                      | Mặc định | Phạm vi hoặc giá trị      | Hành vi                                                                                              |
| ------------------------- | -------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`   | boolean                   | Công tắc chính bền vững cho ảnh chụp mới; dòng thời gian vẫn khả dụng khi là `false`                   |
| `captureIntervalSeconds`  | `30`     | `5`-`600`                 | Khoảng trễ giữa các lần thử chụp                                                                     |
| `analysisIntervalMinutes` | `15`     | `3`-`120`                 | Cửa sổ quan sát mục tiêu; khoảng gián đoạn và nửa đêm có thể đóng cửa sổ sớm hơn                       |
| `nodeId`                  | chưa đặt | mã định danh hoặc tên hiển thị của Node | Cố định việc chụp vào một Node đã kết nối; việc so khớp không phân biệt chữ hoa chữ thường |
| `screenIndex`             | `0`      | `0`-`16`                  | Chỉ mục màn hình bắt đầu từ số không                                                                 |
| `maxWidth`                | `1440`   | `480`-`3840`              | Giới hạn kích thước chụp được yêu cầu; macOS không giao diện áp dụng cho chiều lớn nhất                |
| `visionModel`             | chưa đặt | `provider/model`          | Tuyến có cấu trúc rõ ràng; tham chiếu sai định dạng sẽ tạm dừng phân tích, nhà cung cấp không được hỗ trợ sẽ làm lô thất bại |
| `retentionDays`           | `14`     | `1`-`365`                 | Xóa các khung hình cũ; các thẻ, quan sát và ghi chú họp cập nhật được giữ lại                          |

Khi không có `nodeId`, Logbook ưu tiên một Node ứng dụng đã kết nối có cung cấp
`screen.snapshot`, sau đó chuyển sang một Node không giao diện có cung cấp
`logbook.snapshot`. Trong thiết lập không cố định, một Node bị lỗi sẽ được chuyển xuống sau các
Node đủ điều kiện khác. Công tắc tạm dừng trên bảng điều khiển chỉ áp dụng cho phiên và được đặt lại khi
Gateway khởi động lại; hãy dùng `captureEnabled: false` để dừng lâu dài.

### Chọn mô hình thị giác

Logbook phân giải mô hình quan sát theo thứ tự sau:

1. `plugins.entries.logbook.config.visionModel`
2. mục Codex đầu tiên hỗ trợ hình ảnh trong `tools.media.image.models`
3. mục Codex đầu tiên hỗ trợ hình ảnh trong `tools.media.models`

Các nhà cung cấp phương tiện khác bị bỏ qua vì hiện tại họ không cung cấp
hợp đồng trích xuất có cấu trúc mà Logbook yêu cầu. Đặt
`tools.media.image.enabled: false` sẽ vô hiệu hóa các giá trị mặc định phương tiện được mượn, nhưng
`visionModel` được cấu hình rõ ràng cho Logbook vẫn được áp dụng.

## Thẻ bảng điều khiển

- **Dòng thời gian**: các thẻ có thể mở rộng cho từng hoạt động, với màu theo danh mục, ứng dụng
  chính, các nhãn yếu tố gây xao nhãng và một khung hình chính từ ảnh chụp.
- **Tổng quan trong ngày**: tỷ lệ tập trung, phân tích theo danh mục, các ứng dụng hàng đầu.
- **Ghi chú họp cập nhật hằng ngày**: chuyển nội dung hôm qua và hôm nay thành bản cập nhật sẵn để dán.
- **Hỏi về ngày của bạn**: các câu hỏi bằng ngôn ngữ tự nhiên được trả lời dựa trên dòng thời gian
  đã theo dõi ("tôi đã xem xét PR Gateway lúc nào?").
- **Phân tích ngay**: đóng cửa sổ chụp hiện tại ngay lập tức thay vì
  chờ khoảng thời gian phân tích.

## Các phương thức Gateway

Logbook đăng ký các phương thức RPC Gateway sau:

| Phương thức            | Tham số                  | Phạm vi          | Kết quả                                                                    |
| ---------------------- | ------------------------ | ---------------- | -------------------------------------------------------------------------- |
| `logbook.status`       | không có                 | `operator.read`  | Trạng thái chụp, phân tích, mô hình, Node, ngày Gateway và múi giờ Gateway  |
| `logbook.days`         | không có                 | `operator.read`  | Các ngày kèm số lượng thẻ dòng thời gian và giới hạn thời gian của thẻ      |
| `logbook.timeline`     | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Các thẻ được suy ra và thống kê ngày; mặc định là ngày hiện tại của Gateway |
| `logbook.frames`       | `{ startMs, endMs }`     | `operator.write` | Siêu dữ liệu khung hình trong khoảng mili giây kể từ epoch được yêu cầu     |
| `logbook.frame`        | `{ frameId }`            | `operator.write` | Một khung hình JPEG thô ở dạng base64                                       |
| `logbook.standup`      | `{ day?, refresh? }`     | `operator.write` | Văn bản ghi chú họp cập nhật đã lưu đệm hoặc được tạo lại cho một ngày      |
| `logbook.ask`          | `{ day?, question }`     | `operator.write` | Câu trả lời dựa trên dòng thời gian cho một ngày                            |
| `logbook.capture.set`  | `{ paused }`             | `operator.write` | Trạng thái tạm dừng chỉ trong phiên và trạng thái đã cập nhật               |
| `logbook.analyze.now`  | không có                 | `operator.write` | Bắt đầu phân tích đang chờ hoặc trả về lý do không thể bắt đầu              |

Các phương thức đọc trả về trạng thái vận hành hoặc văn bản được suy ra. Điểm ảnh ảnh chụp màn hình
thô, các hành động tiêu tốn tài nguyên mô hình và các thay đổi môi trường chạy yêu cầu
`operator.write`. Thẻ UI điều khiển cũng yêu cầu `operator.write` vì thẻ này
cung cấp các hành động đó và bản xem trước khung hình thô; máy khách chỉ đọc vẫn có thể gọi
trực tiếp các phương thức văn bản được suy ra.

## Lưu ý về quyền riêng tư

- Ảnh chụp có thể chứa mọi thứ trên màn hình, bao gồm cả thông tin bí mật. Các khung hình không bao giờ
  rời khỏi máy, ngoại trừ khi được dùng làm đầu vào lấy mẫu cho mô hình quan sát đã cấu hình.
- Các quan sát, thẻ gần đây và câu hỏi có thể rời khỏi máy thông qua
  mô hình tác tử mặc định trong quá trình tổng hợp thẻ, tạo ghi chú họp cập nhật hoặc hỏi đáp. Hãy áp dụng
  chính sách xử lý dữ liệu của nhà cung cấp cho cả hai tuyến mô hình.
- Sử dụng các tuyến cục bộ cho cả mô hình quan sát có cấu trúc và mô hình tác tử
  mặc định khi bạn cần một quy trình hoàn toàn cục bộ.
- Các khung hình, cơ sở dữ liệu dòng thời gian và bản chụp tạm thời được ghi với
  quyền tệp chỉ dành cho chủ sở hữu.
- Việc thêm `screen.snapshot` vào `gateway.nodes.denyCommands` là
  công tắc vô hiệu hóa chụp màn hình: nó chặn cả việc chụp từ Node ứng dụng lẫn
  lệnh `logbook.snapshot` của chính Logbook.
- Đặt `tools.media.image.enabled: false` cũng ngăn Logbook mượn
  các mô hình hình ảnh phương tiện để phân tích; khi đó chỉ `visionModel` được cấu hình rõ ràng trong
  cấu hình Plugin mới được sử dụng.

## Khắc phục sự cố

### Thẻ Logbook bị thiếu

Kiểm tra cả ba điều kiện:

1. `openclaw plugins list --enabled` có bao gồm `logbook`.
2. Gateway đã được khởi động lại sau khi thay đổi Plugin hoặc danh sách cho phép.
3. Kết nối UI điều khiển có `operator.write`; các phiên chỉ đọc không
   nhận được phần mô tả thẻ tương tác.

Nếu đã đặt `plugins.allow`, cấu hình này phải bao gồm cả `logbook` và `codex` theo
khuyến nghị.

### Quá trình chụp báo lỗi

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Xác nhận Node cung cấp `screen.snapshot` hoặc `logbook.snapshot`.
- Cấp quyền Screen Recording trên máy Mac dùng để chụp.
- Nếu đã cấu hình `nodeId`, hãy xác nhận giá trị này khớp với mã định danh hoặc tên hiển thị của Node.
- Kiểm tra để bảo đảm `gateway.nodes.denyCommands` không chứa
  `screen.snapshot`.

Sau ba lần lỗi liên tiếp, Logbook sẽ tạm lùi trong mười chu kỳ chụp rồi
thử lại. Thiết lập không ghim Node có thể chuyển sang một Node đủ điều kiện khác.

### Chụp thành công nhưng không xuất hiện thẻ nào

- Trạng thái **Thiếu mô hình** có nghĩa là không tìm thấy tuyến thị giác có cấu trúc tương thích.
  Hãy bật và xác thực Plugin Codex hoặc đặt một `visionModel` tường minh hợp lệ.
  Các khung hình đã chụp vẫn ở trạng thái chờ khi thiếu mô hình và
  có thể được phân tích sau khi sửa xong cấu hình.
- Chờ trong khoảng thời gian `analysisIntervalMinutes` hoặc chọn **Phân tích ngay** sau khi
  hoạt động đã được ghi lại.
- Các khung hình giống hệt nhau liên tiếp là bằng chứng về trạng thái không hoạt động và không được đưa vào
  các lô phân tích. Hãy thay đổi nội dung hiển thị trên màn hình trước khi kiểm thử.
- Nếu lô mới nhất hiển thị lỗi, hãy khắc phục sự cố về mô hình hoặc xác thực rồi chọn
  **Phân tích ngay**. Các lô bị lỗi chỉ được thử lại khi thực hiện thao tác tường minh đó nhằm
  tránh phát sinh chi phí sử dụng mô hình nhiều lần.

## Liên quan

- [Quản lý Plugin](/vi/plugins/manage-plugins)
- [Bộ công cụ Codex](/vi/plugins/codex-harness)
- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
- [Các Node](/vi/nodes)
- [Khắc phục sự cố Node](/vi/nodes/troubleshooting)
- [Giao diện điều khiển](/vi/web/control-ui)
