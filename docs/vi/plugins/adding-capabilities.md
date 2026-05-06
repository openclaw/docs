---
read_when:
    - Thêm năng lực cốt lõi mới và giao diện đăng ký Plugin
    - Quyết định xem mã thuộc về phần lõi, Plugin của nhà cung cấp hay Plugin tính năng
    - Thiết lập một trình trợ giúp thời gian chạy mới cho các kênh hoặc công cụ
sidebarTitle: Adding capabilities
summary: Hướng dẫn dành cho cộng tác viên để thêm một năng lực dùng chung mới vào hệ thống Plugin của OpenClaw
title: Thêm khả năng (hướng dẫn dành cho người đóng góp)
x-i18n:
    generated_at: "2026-05-06T09:22:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Đây là **hướng dẫn dành cho cộng tác viên** cho các nhà phát triển lõi OpenClaw. Nếu bạn đang
  xây dựng một plugin bên ngoài, hãy xem [Xây dựng plugin](/vi/plugins/building-plugins)
  thay vào đó. Để tham khảo kiến trúc chuyên sâu (mô hình capability, quyền sở hữu,
  quy trình tải, helper runtime), hãy xem [Nội bộ Plugin](/vi/plugins/architecture).
</Info>

Sử dụng nội dung này khi OpenClaw cần một miền dùng chung mới như tạo ảnh, tạo video, hoặc một vùng tính năng trong tương lai được nhà cung cấp hậu thuẫn.

Quy tắc:

- **plugin** = ranh giới quyền sở hữu
- **capability** = hợp đồng lõi dùng chung

Đừng bắt đầu bằng cách nối trực tiếp một nhà cung cấp vào một kênh hoặc công cụ. Hãy bắt đầu bằng cách định nghĩa capability.

## Khi nào cần tạo capability

Tạo một capability mới khi **tất cả** các điều sau đều đúng:

1. Nhiều hơn một nhà cung cấp có thể triển khai nó một cách hợp lý.
2. Các kênh, công cụ, hoặc plugin tính năng nên sử dụng nó mà không cần quan tâm đến nhà cung cấp.
3. Lõi cần sở hữu hành vi dự phòng, chính sách, cấu hình, hoặc phân phối.

Nếu công việc chỉ dành riêng cho nhà cung cấp và chưa có hợp đồng dùng chung, hãy dừng lại và định nghĩa hợp đồng trước.

## Trình tự tiêu chuẩn

1. Định nghĩa hợp đồng lõi có kiểu.
2. Thêm đăng ký plugin cho hợp đồng đó.
3. Thêm một helper runtime dùng chung.
4. Kết nối một plugin nhà cung cấp thật làm bằng chứng.
5. Chuyển các bên tiêu thụ tính năng/kênh sang helper runtime.
6. Thêm kiểm thử hợp đồng.
7. Ghi tài liệu về cấu hình hướng tới người vận hành và mô hình quyền sở hữu.

## Nội dung đặt ở đâu

**Lõi:**

- Kiểu yêu cầu/phản hồi.
- Sổ đăng ký nhà cung cấp + phân giải.
- Hành vi dự phòng.
- Lược đồ cấu hình với metadata tài liệu `title` / `description` được lan truyền trên các nút đối tượng lồng nhau, ký tự đại diện, mục mảng, và tổ hợp.
- Bề mặt helper runtime.

**Plugin nhà cung cấp:**

- Lệnh gọi API của nhà cung cấp.
- Xử lý xác thực của nhà cung cấp.
- Chuẩn hóa yêu cầu dành riêng cho nhà cung cấp.
- Đăng ký triển khai capability.

**Plugin tính năng/kênh:**

- Gọi `api.runtime.*` hoặc helper `plugin-sdk/*-runtime` tương ứng.
- Không bao giờ gọi trực tiếp một triển khai nhà cung cấp.

## Các seam nhà cung cấp và harness

Dùng **hook nhà cung cấp** khi hành vi thuộc về hợp đồng nhà cung cấp mô hình thay vì vòng lặp agent chung. Ví dụ gồm tham số yêu cầu dành riêng cho nhà cung cấp sau khi chọn transport, ưu tiên hồ sơ xác thực, lớp phủ prompt, và định tuyến dự phòng tiếp theo sau khi chuyển đổi dự phòng mô hình/hồ sơ.

Dùng **hook agent harness** khi hành vi thuộc về runtime đang thực thi một lượt. Harness có thể phân loại các kết quả lần thử thành công nhưng không dùng được, chẳng hạn phản hồi trống, chỉ có reasoning, hoặc chỉ có planning, để chính sách dự phòng mô hình bên ngoài có thể đưa ra quyết định thử lại.

Giữ cả hai seam thật hẹp:

- Lõi sở hữu chính sách thử lại/dự phòng.
- Plugin nhà cung cấp sở hữu các gợi ý yêu cầu/xác thực/định tuyến dành riêng cho nhà cung cấp.
- Plugin harness sở hữu phân loại lần thử dành riêng cho runtime.
- Plugin bên thứ ba trả về gợi ý, không trực tiếp đột biến trạng thái lõi.

## Danh sách kiểm tra tệp

Với một capability mới, dự kiến sẽ chạm tới các khu vực này:

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
- Một hoặc nhiều gói plugin đi kèm.
- Cấu hình, tài liệu, kiểm thử.

## Ví dụ hoàn chỉnh: tạo ảnh

Tạo ảnh tuân theo hình dạng tiêu chuẩn:

1. Lõi định nghĩa `ImageGenerationProvider`.
2. Lõi cung cấp `registerImageGenerationProvider(...)`.
3. Lõi cung cấp `runtime.imageGeneration.generate(...)`.
4. Các plugin `openai`, `google`, `fal`, và `minimax` đăng ký các triển khai được nhà cung cấp hậu thuẫn.
5. Nhà cung cấp trong tương lai đăng ký cùng hợp đồng mà không cần thay đổi kênh/công cụ.

Khóa cấu hình được cố ý tách riêng khỏi định tuyến phân tích thị giác:

- `agents.defaults.imageModel` phân tích ảnh.
- `agents.defaults.imageGenerationModel` tạo ảnh.

Giữ chúng tách biệt để dự phòng và chính sách luôn rõ ràng.

## Danh sách kiểm tra review

Trước khi phát hành một capability mới, hãy xác minh:

- Không kênh/công cụ nào nhập trực tiếp mã nhà cung cấp.
- Helper runtime là đường dẫn dùng chung.
- Ít nhất một kiểm thử hợp đồng xác nhận quyền sở hữu đi kèm.
- Tài liệu cấu hình nêu tên mô hình/khóa cấu hình mới.
- Tài liệu Plugin giải thích ranh giới quyền sở hữu.

Nếu một PR bỏ qua lớp capability và hardcode hành vi nhà cung cấp vào một kênh/công cụ, hãy trả lại và định nghĩa hợp đồng trước.

## Liên quan

- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình capability, quyền sở hữu, quy trình tải, helper runtime.
- [Xây dựng plugin](/vi/plugins/building-plugins) — hướng dẫn plugin đầu tiên.
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu import map và API đăng ký.
- [Tạo Skills](/vi/tools/creating-skills) — bề mặt cộng tác viên đi kèm.
