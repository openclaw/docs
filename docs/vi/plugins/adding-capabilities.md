---
read_when:
    - Thêm một năng lực lõi mới và bề mặt đăng ký plugin
    - Quyết định xem mã nên thuộc về phần lõi, plugin của nhà cung cấp hay plugin tính năng
    - Kết nối một trình trợ giúp thời gian chạy mới cho các kênh hoặc công cụ
sidebarTitle: Adding capabilities
summary: Hướng dẫn dành cho người đóng góp về cách thêm một khả năng dùng chung mới vào hệ thống Plugin của OpenClaw
title: Thêm chức năng (hướng dẫn dành cho người đóng góp)
x-i18n:
    generated_at: "2026-07-12T08:05:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Đây là **hướng dẫn dành cho người đóng góp** cho các nhà phát triển lõi OpenClaw. Nếu bạn đang
  xây dựng một Plugin bên ngoài, hãy xem [Xây dựng Plugin](/vi/plugins/building-plugins)
  thay vào đó. Để tham khảo kiến trúc chuyên sâu (mô hình capability, quyền sở hữu,
  quy trình tải, các trình trợ giúp runtime), hãy xem [Nội bộ Plugin](/vi/plugins/architecture).
</Info>

Sử dụng hướng dẫn này khi OpenClaw cần một miền dùng chung mới, chẳng hạn như embedding, tạo
hình ảnh, tạo video hoặc một lĩnh vực tính năng tương lai nào đó được nhà cung cấp hỗ trợ.

Quy tắc:

- **Plugin** = ranh giới quyền sở hữu
- **capability** = hợp đồng lõi dùng chung

Không kết nối trực tiếp một nhà cung cấp vào kênh hoặc công cụ. Trước tiên, hãy định nghĩa capability.

## Khi nào cần tạo capability

Chỉ tạo capability mới khi **tất cả** các điều kiện sau đều đúng:

1. Có thể hợp lý kỳ vọng nhiều hơn một nhà cung cấp triển khai capability đó.
2. Các kênh, công cụ hoặc Plugin tính năng cần sử dụng capability đó mà không cần quan tâm đến nhà cung cấp.
3. Lõi cần sở hữu hành vi dự phòng, chính sách, cấu hình hoặc phân phối.

Nếu công việc chỉ dành riêng cho nhà cung cấp và chưa có hợp đồng dùng chung, trước tiên hãy định nghĩa hợp đồng.

## Trình tự tiêu chuẩn

1. Định nghĩa hợp đồng lõi có kiểu.
2. Thêm cơ chế đăng ký Plugin cho hợp đồng đó.
3. Thêm một trình trợ giúp runtime dùng chung.
4. Kết nối một Plugin nhà cung cấp thực tế để làm minh chứng.
5. Chuyển các bên sử dụng là tính năng/kênh sang trình trợ giúp runtime.
6. Thêm kiểm thử hợp đồng.
7. Ghi lại cấu hình dành cho người vận hành và mô hình quyền sở hữu.

## Thành phần nào nằm ở đâu

| Lớp                       | Sở hữu                                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Lõi**                   | Kiểu yêu cầu/phản hồi; sổ đăng ký và phân giải nhà cung cấp; hành vi dự phòng; lược đồ cấu hình với siêu dữ liệu tài liệu `title`/`description` được truyền tới các nút đối tượng lồng nhau, ký tự đại diện, phần tử mảng và tổ hợp; bề mặt trình trợ giúp runtime. |
| **Plugin nhà cung cấp**   | Lệnh gọi API của nhà cung cấp, xử lý xác thực nhà cung cấp, chuẩn hóa yêu cầu dành riêng cho nhà cung cấp và đăng ký phần triển khai capability.                                                                                                          |
| **Plugin tính năng/kênh** | Gọi `api.runtime.*` hoặc trình trợ giúp `plugin-sdk/*-runtime` tương ứng. Không bao giờ gọi trực tiếp phần triển khai của nhà cung cấp.                                                                                                                    |

## Các điểm nối nhà cung cấp và harness

Sử dụng **hook nhà cung cấp** khi hành vi thuộc về hợp đồng của nhà cung cấp mô hình thay vì vòng lặp tác nhân chung. Ví dụ gồm các tham số yêu cầu dành riêng cho nhà cung cấp sau khi chọn phương thức truyền tải, ưu tiên hồ sơ xác thực, lớp phủ prompt và định tuyến dự phòng tiếp theo sau khi chuyển đổi dự phòng mô hình/hồ sơ.

Sử dụng **hook harness tác nhân** khi hành vi thuộc về runtime đang thực thi một lượt. Harness có thể phân loại các kết quả giao thức rõ ràng như đầu ra trống, phần suy luận không có đầu ra hiển thị hoặc một kế hoạch có cấu trúc nhưng không có câu trả lời cuối cùng, để chính sách dự phòng mô hình bên ngoài có thể quyết định có thử lại hay không.

Giữ cả hai điểm nối ở phạm vi hẹp:

- Lõi sở hữu chính sách thử lại/dự phòng.
- Plugin nhà cung cấp sở hữu các gợi ý về yêu cầu/xác thực/định tuyến dành riêng cho nhà cung cấp.
- Plugin harness sở hữu việc phân loại lần thử dành riêng cho runtime.
- Plugin bên thứ ba trả về các gợi ý, không trực tiếp thay đổi trạng thái lõi.

## Danh sách kiểm tra tệp

Đối với một capability mới, dự kiến cần sửa đổi các khu vực sau:

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
- Một hoặc nhiều gói Plugin đi kèm.
- Cấu hình, tài liệu, kiểm thử.

## Ví dụ hoàn chỉnh: tạo hình ảnh

Tính năng tạo hình ảnh tuân theo cấu trúc tiêu chuẩn:

1. Lõi định nghĩa `ImageGenerationProvider`.
2. Lõi cung cấp `registerImageGenerationProvider(...)`.
3. Lõi cung cấp `api.runtime.imageGeneration.generate(...)` và `.listProviders(...)`.
4. Các Plugin nhà cung cấp (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) đăng ký các phần triển khai được nhà cung cấp hỗ trợ.
5. Các nhà cung cấp trong tương lai đăng ký cùng một hợp đồng mà không cần thay đổi kênh/công cụ.

Khóa cấu hình được cố ý tách biệt khỏi định tuyến phân tích thị giác:

- `agents.defaults.imageModel` phân tích hình ảnh.
- `agents.defaults.imageGenerationModel` tạo hình ảnh.

Hãy giữ chúng tách biệt để cơ chế dự phòng và chính sách luôn rõ ràng.

## Nhà cung cấp embedding

Sử dụng `registerEmbeddingProvider(...)` / hợp đồng `embeddingProviders` cho
các nhà cung cấp embedding vectơ có thể tái sử dụng. Hợp đồng này được chủ ý thiết kế rộng hơn
bộ nhớ: công cụ, tìm kiếm, truy xuất, trình nhập hoặc các Plugin tính năng trong tương lai
có thể sử dụng embedding mà không phụ thuộc vào công cụ bộ nhớ. Tìm kiếm bộ nhớ
cũng sử dụng `embeddingProviders` dùng chung.

API đăng ký dành riêng cho bộ nhớ trước đây và hợp đồng `memoryEmbeddingProviders`
đã không còn được khuyến nghị. Sử dụng `registerEmbeddingProvider` và
`embeddingProviders` cho tất cả nhà cung cấp embedding mới.

## Danh sách kiểm tra khi đánh giá

Trước khi phát hành một capability mới, hãy xác minh:

- Không có kênh/công cụ nào nhập trực tiếp mã của nhà cung cấp.
- Trình trợ giúp runtime là đường dẫn dùng chung.
- Có ít nhất một kiểm thử hợp đồng xác nhận quyền sở hữu đi kèm.
- Tài liệu cấu hình nêu tên mô hình/khóa cấu hình mới.
- Tài liệu Plugin giải thích ranh giới quyền sở hữu.

Nếu một PR bỏ qua lớp capability và mã hóa cứng hành vi của nhà cung cấp vào kênh/công cụ, hãy yêu cầu sửa lại và định nghĩa hợp đồng trước.

## Liên quan

- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình capability, quyền sở hữu, quy trình tải, các trình trợ giúp runtime.
- [Xây dựng Plugin](/vi/plugins/building-plugins) — hướng dẫn tạo Plugin đầu tiên.
- [Tổng quan SDK](/vi/plugins/sdk-overview) — bản đồ nhập và tài liệu tham khảo API đăng ký.
- [Tạo Skills](/vi/tools/creating-skills) — bề mặt bổ trợ dành cho người đóng góp.
