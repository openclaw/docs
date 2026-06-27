---
read_when:
    - Thêm một năng lực lõi mới và bề mặt đăng ký plugin
    - Quyết định mã thuộc về lõi, Plugin nhà cung cấp hay Plugin tính năng
    - Đấu nối một trình trợ giúp runtime mới cho kênh hoặc công cụ
sidebarTitle: Adding capabilities
summary: Hướng dẫn cộng tác viên về cách thêm một capability dùng chung mới vào hệ thống Plugin của OpenClaw
title: Thêm năng lực (hướng dẫn dành cho người đóng góp)
x-i18n:
    generated_at: "2026-06-27T17:43:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Đây là **hướng dẫn dành cho người đóng góp** cho các nhà phát triển lõi OpenClaw. Nếu bạn đang
  xây dựng một plugin bên ngoài, hãy xem [Xây dựng plugin](/vi/plugins/building-plugins)
  thay vào đó. Để xem tài liệu tham khảo kiến trúc chuyên sâu (mô hình capability, quyền sở hữu,
  quy trình tải, trình trợ giúp thời gian chạy), hãy xem [Nội bộ Plugin](/vi/plugins/architecture).
</Info>

Dùng hướng dẫn này khi OpenClaw cần một miền dùng chung mới như embedding, tạo
hình ảnh, tạo video, hoặc một vùng tính năng tương lai nào đó do nhà cung cấp hậu thuẫn.

Quy tắc:

- **plugin** = ranh giới quyền sở hữu
- **capability** = hợp đồng lõi dùng chung

Đừng bắt đầu bằng cách nối trực tiếp một nhà cung cấp vào một kênh hoặc một công cụ. Hãy bắt đầu bằng việc định nghĩa capability.

## Khi nào cần tạo một capability

Tạo capability mới khi **tất cả** các điều sau đều đúng:

1. Có khả năng hợp lý rằng nhiều hơn một nhà cung cấp có thể triển khai nó.
2. Các kênh, công cụ, hoặc plugin tính năng nên sử dụng nó mà không cần quan tâm đến nhà cung cấp.
3. Lõi cần sở hữu hành vi dự phòng, chính sách, cấu hình, hoặc phân phối.

Nếu công việc chỉ dành riêng cho một nhà cung cấp và chưa có hợp đồng dùng chung, hãy dừng lại và định nghĩa hợp đồng trước.

## Trình tự chuẩn

1. Định nghĩa hợp đồng lõi có kiểu.
2. Thêm đăng ký plugin cho hợp đồng đó.
3. Thêm một trình trợ giúp thời gian chạy dùng chung.
4. Nối một plugin nhà cung cấp thật để làm bằng chứng.
5. Chuyển các bên tiêu thụ tính năng/kênh sang trình trợ giúp thời gian chạy.
6. Thêm kiểm thử hợp đồng.
7. Ghi tài liệu về cấu hình dành cho người vận hành và mô hình quyền sở hữu.

## Phần nào đặt ở đâu

**Lõi:**

- Kiểu yêu cầu/phản hồi.
- Sổ đăng ký provider + phân giải.
- Hành vi dự phòng.
- Lược đồ cấu hình có metadata tài liệu `title` / `description` được lan truyền trên các nút đối tượng lồng nhau, wildcard, mục mảng, và composition.
- Bề mặt trình trợ giúp thời gian chạy.

**Plugin nhà cung cấp:**

- Lời gọi API của nhà cung cấp.
- Xử lý xác thực của nhà cung cấp.
- Chuẩn hóa yêu cầu riêng theo nhà cung cấp.
- Đăng ký phần triển khai capability.

**Plugin tính năng/kênh:**

- Gọi `api.runtime.*` hoặc trình trợ giúp `plugin-sdk/*-runtime` tương ứng.
- Không bao giờ gọi trực tiếp phần triển khai của nhà cung cấp.

## Điểm nối provider và harness

Dùng **móc nối provider** khi hành vi thuộc về hợp đồng provider mô hình thay vì vòng lặp tác tử chung. Ví dụ bao gồm tham số yêu cầu riêng theo provider sau khi chọn transport, ưu tiên hồ sơ xác thực, lớp phủ prompt, và định tuyến dự phòng tiếp theo sau khi chuyển đổi dự phòng mô hình/hồ sơ.

Dùng **móc nối harness tác tử** khi hành vi thuộc về thời gian chạy đang thực thi một lượt. Harness có thể phân loại các kết quả giao thức rõ ràng như đầu ra trống, reasoning không có đầu ra hiển thị, hoặc một kế hoạch có cấu trúc nhưng không có câu trả lời cuối cùng để chính sách dự phòng mô hình bên ngoài có thể quyết định việc thử lại.

Giữ cả hai điểm nối ở phạm vi hẹp:

- Lõi sở hữu chính sách thử lại/dự phòng.
- Plugin provider sở hữu gợi ý yêu cầu/xác thực/định tuyến riêng theo provider.
- Plugin harness sở hữu phân loại lần thử riêng theo thời gian chạy.
- Plugin bên thứ ba trả về gợi ý, không trực tiếp sửa đổi trạng thái lõi.

## Danh sách tệp cần kiểm tra

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
- Một hoặc nhiều gói plugin được đóng gói kèm.
- Cấu hình, tài liệu, kiểm thử.

## Ví dụ hoàn chỉnh: tạo hình ảnh

Tạo hình ảnh tuân theo hình dạng chuẩn:

1. Lõi định nghĩa `ImageGenerationProvider`.
2. Lõi cung cấp `registerImageGenerationProvider(...)`.
3. Lõi cung cấp `runtime.imageGeneration.generate(...)`.
4. Các plugin `openai`, `google`, `fal`, và `minimax` đăng ký các phần triển khai do nhà cung cấp hậu thuẫn.
5. Các nhà cung cấp tương lai đăng ký cùng hợp đồng mà không cần thay đổi kênh/công cụ.

Khóa cấu hình được cố ý tách riêng khỏi định tuyến phân tích thị giác:

- `agents.defaults.imageModel` phân tích hình ảnh.
- `agents.defaults.imageGenerationModel` tạo hình ảnh.

Giữ chúng tách biệt để dự phòng và chính sách luôn rõ ràng.

## Provider embedding

Dùng `embeddingProviders` cho các provider embedding vector có thể tái sử dụng. Hợp đồng này
cố ý rộng hơn bộ nhớ: công cụ, tìm kiếm, truy xuất, trình nhập, hoặc
plugin tính năng tương lai có thể sử dụng embedding mà không phụ thuộc vào engine
bộ nhớ.

Tìm kiếm bộ nhớ có thể sử dụng `embeddingProviders` chung. Hợp đồng cũ hơn
`memoryEmbeddingProviders` là tương thích đã ngừng khuyến nghị trong khi các
provider riêng cho bộ nhớ hiện có được di chuyển; các provider embedding tái sử dụng mới nên dùng
`embeddingProviders`.

## Danh sách kiểm tra khi review

Trước khi phát hành một capability mới, hãy xác minh:

- Không có kênh/công cụ nào nhập trực tiếp mã nhà cung cấp.
- Trình trợ giúp thời gian chạy là đường dẫn dùng chung.
- Ít nhất một kiểm thử hợp đồng xác nhận quyền sở hữu được đóng gói kèm.
- Tài liệu cấu hình nêu tên khóa mô hình/cấu hình mới.
- Tài liệu Plugin giải thích ranh giới quyền sở hữu.

Nếu một PR bỏ qua lớp capability và mã hóa cứng hành vi nhà cung cấp vào một kênh/công cụ, hãy trả lại và định nghĩa hợp đồng trước.

## Liên quan

- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình capability, quyền sở hữu, quy trình tải, trình trợ giúp thời gian chạy.
- [Xây dựng plugin](/vi/plugins/building-plugins) — hướng dẫn plugin đầu tiên.
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tài liệu tham khảo import map và API đăng ký.
- [Tạo Skills](/vi/tools/creating-skills) — bề mặt đóng góp đồng hành.
