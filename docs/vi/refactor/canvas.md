---
read_when:
    - Di chuyển quyền sở hữu máy chủ Canvas, công cụ, lệnh, tài liệu hoặc giao thức
    - Kiểm tra xem Canvas có còn thuộc quyền sở hữu của lõi hay không
    - Chuẩn bị hoặc đánh giá PR Plugin Canvas thử nghiệm
summary: Kế hoạch và danh sách kiểm tra đánh giá việc chuyển Canvas ra khỏi phần lõi và vào một plugin thử nghiệm đi kèm.
title: Tái cấu trúc Plugin Canvas
x-i18n:
    generated_at: "2026-07-12T08:23:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Tái cấu trúc Plugin Canvas

Canvas ít được sử dụng và đang ở trạng thái thử nghiệm. Hãy coi Canvas là một Plugin đi kèm, không phải tính năng cốt lõi. Phần lõi có thể giữ lại hạ tầng chung cho Gateway, Node, HTTP, xác thực, cấu hình và máy khách gốc, nhưng hành vi dành riêng cho Canvas nên nằm trong `extensions/canvas`.

## Mục tiêu

Chuyển quyền sở hữu Canvas sang `extensions/canvas` trong khi vẫn duy trì hành vi Node được ghép nối hiện tại:

- công cụ `canvas` dành cho tác tử được đăng ký bởi Plugin Canvas
- các lệnh Node của Canvas chỉ được cho phép khi Plugin Canvas đăng ký chúng
- các tệp máy chủ/nguồn A2UI nằm trong Plugin Canvas
- việc hiện thực hóa tài liệu Canvas nằm trong Plugin Canvas
- phần triển khai lệnh CLI nằm trong Plugin Canvas hoặc ủy quyền thông qua barrel runtime do Plugin sở hữu
- tài liệu và danh mục Plugin mô tả Canvas là tính năng thử nghiệm dựa trên Plugin

## Ngoài phạm vi

- Không thiết kế lại giao diện người dùng Canvas của ứng dụng gốc trong lần tái cấu trúc này.
- Không loại bỏ khả năng hỗ trợ giao thức/máy khách Canvas khỏi iOS, Android hoặc macOS, trừ khi có quyết định sản phẩm riêng rằng Canvas nên bị xóa.
- Không xây dựng một khung dịch vụ Plugin tổng quát chỉ dành cho Canvas, trừ khi có ít nhất một Plugin đi kèm khác cần cùng điểm nối đó.

## Trạng thái nhánh hiện tại

Đã hoàn tất:

- Đã thêm gói Plugin đi kèm trong `extensions/canvas`.
- Đã thêm `extensions/canvas/openclaw.plugin.json`.
- Đã chuyển công cụ `canvas` của tác tử từ `src/agents/tools/canvas-tool.ts` sang `extensions/canvas/src/tool.ts`.
- Đã loại bỏ việc đăng ký `createCanvasTool` trong phần lõi khỏi `src/agents/openclaw-tools.ts`.
- Đã chuyển phần triển khai máy chủ Canvas từ `src/canvas-host` sang `extensions/canvas/src/host`.
- Đã giữ `extensions/canvas/runtime-api.ts` làm barrel tương thích do Plugin sở hữu cho các bài kiểm thử, việc đóng gói và các trình trợ giúp Canvas công khai bên ngoài.
- Đã chuyển việc hiện thực hóa tài liệu Canvas từ `src/gateway/canvas-documents.ts` sang `extensions/canvas/src/documents.ts`.
- Đã chuyển phần triển khai CLI Canvas và các trình trợ giúp JSONL A2UI vào `extensions/canvas/src/cli.ts`.
- Đã chuyển URL máy chủ Canvas và các trình trợ giúp khả năng có phạm vi vào `extensions/canvas/src`.
- Đã chuyển các giá trị mặc định của lệnh Node Canvas khỏi danh sách mã hóa cứng trong phần lõi sang `nodeInvokePolicies` của Plugin.
- Đã thêm cấu hình máy chủ Canvas do Plugin sở hữu tại `plugins.entries.canvas.config.host`.
- Đã chuyển việc phục vụ Canvas và A2UI qua HTTP ra sau cơ chế đăng ký tuyến HTTP của Plugin Canvas.
- Đã thêm cơ chế điều phối nâng cấp WebSocket chung cho các tuyến HTTP do Plugin sở hữu.
- Đã thay thế URL máy chủ Gateway và xác thực khả năng Node dành riêng cho Canvas bằng các trình trợ giúp chung cho bề mặt Plugin được lưu trữ và khả năng Node.
- Đã thêm các trình phân giải phương tiện được lưu trữ do Plugin sở hữu để URL tài liệu Canvas được phân giải thông qua Plugin Canvas thay vì phần lõi nhập trực tiếp các phần nội bộ của tài liệu Canvas.
- Đã thêm `api.registerNodeCliFeature(...)` để Canvas có thể khai báo `openclaw nodes canvas` là một tính năng Node do Plugin sở hữu mà không cần viết thủ công đường dẫn lệnh cha.
- Đã loại bỏ các lệnh nhập `extensions/canvas/runtime-api.js` khỏi `src/**` trong mã sản xuất.
- Đã chuyển nguồn gói A2UI từ `apps/shared/OpenClawKit/Tools/CanvasA2UI` sang `extensions/canvas/src/host/a2ui-app`.
- Đã chuyển phần triển khai xây dựng/sao chép A2UI vào `extensions/canvas/scripts` và thay thế việc nối dây xây dựng ở thư mục gốc bằng các hook tài nguyên Plugin đi kèm dùng chung.
- Đã loại bỏ bí danh cấu hình cấp cao nhất kế thừa `canvasHost` khỏi runtime.
- Đã giữ lại quá trình di chuyển Canvas trong doctor để `openclaw doctor --fix` ghi lại các cấu hình `canvasHost` cũ thành `plugins.entries.canvas.config.host`.
- Đã loại bỏ khả năng tương thích giao thức Canvas với tác tử cũ phía sau giao thức Gateway v4. Các máy khách gốc và Gateway hiện chỉ sử dụng `pluginSurfaceUrls.canvas` cùng với `node.pluginSurface.refresh`; đường dẫn `canvasHostUrl`, `canvasCapability` và `node.canvas.capability.refresh` đã lỗi thời được chủ ý không hỗ trợ trong lần tái cấu trúc thử nghiệm này.
- Đã cập nhật danh mục Plugin được tạo để bao gồm Canvas.
- Đã thêm tài liệu tham chiếu Plugin tại `docs/plugins/reference/canvas.md`.

Các bề mặt Canvas còn lại đã biết vẫn do phần lõi sở hữu:

- Các trình xử lý Canvas của ứng dụng gốc trong `apps/` vẫn chủ ý sử dụng bề mặt Plugin Canvas
- các trình xử lý giao thức/máy khách Canvas của ứng dụng gốc trong `apps/`
- đầu ra hiện vật đã phát hành vẫn sử dụng `dist/canvas-host/a2ui` để tra cứu runtime tương thích ngược, nhưng bước sao chép hiện do Plugin sở hữu

## Cấu trúc mục tiêu

`extensions/canvas` nên sở hữu:

- tệp kê khai Plugin và siêu dữ liệu gói
- đăng ký công cụ tác tử
- chính sách lệnh gọi Node
- máy chủ Canvas và runtime A2UI
- nguồn gói A2UI Canvas và các tập lệnh xây dựng/sao chép tài nguyên
- việc tạo tài liệu Canvas và phân giải tài nguyên
- phần triển khai CLI Canvas
- trang tài liệu Canvas và mục trong danh mục Plugin

Phần lõi chỉ nên sở hữu các điểm nối chung:

- khám phá và đăng ký Plugin
- sổ đăng ký công cụ tác tử chung
- sổ đăng ký chính sách gọi Node chung
- HTTP/xác thực Gateway chung và cơ chế điều phối nâng cấp WebSocket
- phân giải URL bề mặt Plugin được lưu trữ chung
- đăng ký trình phân giải phương tiện được lưu trữ chung
- cơ chế truyền tải khả năng Node chung
- hệ thống kết nối cấu hình chung
- khám phá hook tài nguyên Plugin đi kèm chung

Các ứng dụng gốc có thể giữ các trình xử lý lệnh Canvas với vai trò máy khách của giao thức. Chúng không phải là bên sở hữu runtime của Plugin.

## Các bước di chuyển

1. Coi `plugins.entries.canvas.config.host` là bề mặt cấu hình do Plugin sở hữu.
2. Cập nhật tài liệu để mô tả Canvas là một Plugin đi kèm mang tính thử nghiệm.
3. Chạy các bài kiểm thử tập trung cho Canvas, kiểm tra danh mục Plugin, kiểm tra API SDK Plugin và các cổng xây dựng/kiểu dữ liệu bị ảnh hưởng bởi ranh giới runtime.

## Danh sách kiểm tra đánh giá

Trước khi tuyên bố hoàn tất việc tái cấu trúc:

- `rg "src/canvas-host|../canvas-host"` không trả về lệnh nhập mã nguồn đang hoạt động nào.
- `rg "canvas-tool|createCanvasTool" src` không tìm thấy phần triển khai công cụ Canvas nào do phần lõi sở hữu.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` không tìm thấy giá trị mặc định trong danh sách cho phép được mã hóa cứng nào ngoài các bài kiểm thử chính sách Plugin chung.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` không trả về kết quả.
- `rg "canvas-documents" src` không trả về kết quả.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` không trả về kết quả; Plugin Canvas đăng ký `openclaw nodes canvas` thông qua siêu dữ liệu CLI Plugin lồng nhau.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` không trả về quyền sở hữu runtime Gateway nào.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` chỉ tìm thấy các trình bao tương thích hoặc đường dẫn do Plugin sở hữu.
- `pnpm plugins:inventory:check` vượt qua.
- `pnpm plugin-sdk:api:check` vượt qua, hoặc các đường cơ sở API được tạo đã được chủ ý cập nhật và xem xét.
- Các bài kiểm thử Canvas có mục tiêu vượt qua.
- Các bài kiểm thử làn thay đổi vượt qua đối với các đường dẫn máy chủ Canvas/A2UI.
- Nội dung PR nêu rõ Canvas là tính năng thử nghiệm và dựa trên Plugin.

## Các lệnh xác minh

Sử dụng các bước kiểm tra cục bộ có mục tiêu trong khi lặp:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Chạy `pnpm build` trước khi đẩy nếu barrel runtime, cơ chế nhập lười, việc đóng gói hoặc các bề mặt Plugin đã phát hành thay đổi.
