---
read_when:
    - Thêm một năng lực lõi mới và bề mặt đăng ký Plugin
    - Quyết định xem mã nên nằm trong lõi, Plugin của nhà cung cấp hay Plugin tính năng
    - Kết nối một trình trợ giúp thời gian chạy mới cho kênh hoặc công cụ
sidebarTitle: Adding Capabilities
summary: Hướng dẫn dành cho người đóng góp để thêm một năng lực dùng chung mới vào hệ thống Plugin của OpenClaw
title: Thêm khả năng (hướng dẫn dành cho người đóng góp)
x-i18n:
    generated_at: "2026-04-29T23:17:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 16
---

<Info>
  Đây là **hướng dẫn dành cho người đóng góp** cho các nhà phát triển lõi OpenClaw. Nếu bạn đang
  xây dựng Plugin bên ngoài, hãy xem [Xây dựng Plugin](/vi/plugins/building-plugins)
  thay vào đó.
</Info>

Dùng nội dung này khi OpenClaw cần một miền mới như tạo hình ảnh, tạo video,
hoặc một vùng tính năng trong tương lai do nhà cung cấp hậu thuẫn.

Quy tắc:

- Plugin = ranh giới sở hữu
- năng lực = hợp đồng lõi dùng chung

Điều đó có nghĩa là bạn không nên bắt đầu bằng cách nối trực tiếp một nhà cung cấp vào một kênh hoặc một
công cụ. Hãy bắt đầu bằng cách định nghĩa năng lực.

## Khi nào cần tạo một năng lực

Tạo một năng lực mới khi tất cả các điều sau đều đúng:

1. có thể hợp lý rằng nhiều hơn một nhà cung cấp sẽ triển khai năng lực đó
2. các kênh, công cụ, hoặc Plugin tính năng nên sử dụng năng lực đó mà không cần quan tâm đến
   nhà cung cấp
3. lõi cần sở hữu hành vi dự phòng, chính sách, cấu hình, hoặc phân phối

Nếu công việc chỉ dành riêng cho nhà cung cấp và chưa có hợp đồng dùng chung, hãy dừng lại và định nghĩa
hợp đồng trước.

## Trình tự tiêu chuẩn

1. Định nghĩa hợp đồng lõi có kiểu.
2. Thêm đăng ký Plugin cho hợp đồng đó.
3. Thêm helper runtime dùng chung.
4. Kết nối một Plugin nhà cung cấp thật để làm bằng chứng.
5. Chuyển các bên sử dụng tính năng/kênh sang helper runtime.
6. Thêm kiểm thử hợp đồng.
7. Ghi tài liệu cấu hình hướng tới người vận hành và mô hình sở hữu.

## Nội dung đặt ở đâu

Lõi:

- kiểu yêu cầu/phản hồi
- sổ đăng ký nhà cung cấp + phân giải
- hành vi dự phòng
- schema cấu hình cộng với siêu dữ liệu tài liệu `title` / `description` được truyền xuống trên các nút đối tượng lồng nhau, ký tự đại diện, phần tử mảng, và thành phần
- bề mặt helper runtime

Plugin nhà cung cấp:

- lệnh gọi API của nhà cung cấp
- xử lý xác thực của nhà cung cấp
- chuẩn hóa yêu cầu riêng cho nhà cung cấp
- đăng ký phần triển khai năng lực

Plugin tính năng/kênh:

- gọi `api.runtime.*` hoặc helper `plugin-sdk/*-runtime` tương ứng
- không bao giờ gọi trực tiếp phần triển khai của nhà cung cấp

## Các đường nối nhà cung cấp và harness

Dùng hook nhà cung cấp khi hành vi thuộc về hợp đồng nhà cung cấp mô hình
thay vì vòng lặp agent chung. Ví dụ bao gồm tham số yêu cầu riêng cho nhà cung cấp
sau khi chọn transport, ưu tiên hồ sơ xác thực, lớp phủ prompt, và
định tuyến dự phòng tiếp theo sau khi chuyển đổi dự phòng mô hình/hồ sơ.

Dùng hook harness agent khi hành vi thuộc về runtime đang
thực thi một lượt. Harness có thể phân loại các kết quả lần thử thành công nhưng không dùng được
như phản hồi trống, chỉ có reasoning, hoặc chỉ có lập kế hoạch để chính sách dự phòng mô hình bên ngoài
có thể đưa ra quyết định thử lại.

Giữ cả hai đường nối hẹp:

- lõi sở hữu chính sách thử lại/dự phòng
- Plugin nhà cung cấp sở hữu gợi ý yêu cầu/xác thực/định tuyến riêng cho nhà cung cấp
- Plugin harness sở hữu phân loại lần thử riêng cho runtime
- Plugin bên thứ ba trả về gợi ý, không trực tiếp chỉnh sửa trạng thái lõi

## Danh sách kiểm tra tệp

Với một năng lực mới, dự kiến sẽ chạm đến các khu vực sau:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- một hoặc nhiều gói Plugin được đóng gói sẵn
- cấu hình/tài liệu/kiểm thử

## Ví dụ: tạo hình ảnh

Tạo hình ảnh tuân theo cấu trúc tiêu chuẩn:

1. lõi định nghĩa `ImageGenerationProvider`
2. lõi cung cấp `registerImageGenerationProvider(...)`
3. lõi cung cấp `runtime.imageGeneration.generate(...)`
4. các Plugin `openai`, `google`, `fal`, và `minimax` đăng ký các phần triển khai do nhà cung cấp hậu thuẫn
5. nhà cung cấp trong tương lai có thể đăng ký cùng hợp đồng mà không cần thay đổi kênh/công cụ

Khóa cấu hình tách biệt với định tuyến phân tích thị giác:

- `agents.defaults.imageModel` = phân tích hình ảnh
- `agents.defaults.imageGenerationModel` = tạo hình ảnh

Giữ chúng tách biệt để dự phòng và chính sách vẫn rõ ràng.

## Danh sách kiểm tra khi rà soát

Trước khi phát hành một năng lực mới, hãy xác minh:

- không có kênh/công cụ nào import trực tiếp mã của nhà cung cấp
- helper runtime là đường dẫn dùng chung
- có ít nhất một kiểm thử hợp đồng xác nhận quyền sở hữu được đóng gói sẵn
- tài liệu cấu hình nêu tên mô hình/khóa cấu hình mới
- tài liệu Plugin giải thích ranh giới sở hữu

Nếu một PR bỏ qua lớp năng lực và mã hóa cứng hành vi của nhà cung cấp vào một
kênh/công cụ, hãy trả lại và định nghĩa hợp đồng trước.

## Liên quan

- [Plugin](/vi/tools/plugin)
- [Tạo Skills](/vi/tools/creating-skills)
- [Công cụ và Plugin](/vi/tools)
