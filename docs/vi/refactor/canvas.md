---
read_when:
    - Di chuyển quyền sở hữu máy chủ, công cụ, lệnh, tài liệu hoặc giao thức của Canvas
    - Kiểm tra xem Canvas có còn thuộc quyền sở hữu của lõi hay không
    - Chuẩn bị hoặc review PR Plugin Canvas thử nghiệm
summary: Kế hoạch và danh sách kiểm tra đánh giá để chuyển Canvas ra khỏi phần lõi và vào một plugin thử nghiệm được đóng gói sẵn.
title: Tái cấu trúc plugin Canvas
x-i18n:
    generated_at: "2026-07-19T06:21:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ead3f865ea80acb1e47f45a5ab07acf19a6470035c00c81006b2b1230bedd71e
    source_path: refactor/canvas.md
    workflow: 16
---

# Tái cấu trúc Plugin Canvas

Canvas ít được sử dụng và mang tính thử nghiệm. Hãy xem Canvas là một Plugin đi kèm, không phải tính năng cốt lõi. Phần lõi có thể giữ lại hạ tầng chung cho Gateway, Node, HTTP, xác thực, cấu hình và ứng dụng khách gốc, nhưng hành vi dành riêng cho Canvas nên nằm trong `extensions/canvas`.

## Mục tiêu

Chuyển quyền sở hữu Canvas sang `extensions/canvas` trong khi vẫn duy trì hành vi Node đã ghép cặp hiện tại:

- công cụ `canvas` dành cho agent được Plugin Canvas đăng ký
- các lệnh Node Canvas chỉ được phép khi Plugin Canvas đăng ký chúng
- các tệp máy chủ/nguồn A2UI nằm trong Plugin Canvas
- việc hiện thực hóa tài liệu Canvas nằm trong Plugin Canvas
- phần triển khai lệnh CLI nằm trong Plugin Canvas hoặc ủy quyền thông qua barrel runtime thuộc sở hữu của Plugin
- tài liệu và danh mục Plugin mô tả Canvas là tính năng thử nghiệm dựa trên Plugin

## Ngoài phạm vi

- Không thiết kế lại giao diện người dùng Canvas của ứng dụng gốc trong lần tái cấu trúc này.
- Không loại bỏ hỗ trợ giao thức/ứng dụng khách Canvas khỏi iOS, Android hoặc macOS, trừ khi có quyết định sản phẩm riêng yêu cầu xóa Canvas.
- Không xây dựng một framework dịch vụ Plugin tổng quát chỉ dành cho Canvas, trừ khi có ít nhất một Plugin đi kèm khác cần cùng điểm nối đó.

## Trạng thái nhánh hiện tại

Đã hoàn tất:

- Đã thêm gói Plugin đi kèm trong `extensions/canvas`.
- Đã thêm `extensions/canvas/openclaw.plugin.json`.
- Đã chuyển công cụ `canvas` của agent từ `src/agents/tools/canvas-tool.ts` sang `extensions/canvas/src/tool.ts`.
- Đã loại bỏ việc đăng ký `createCanvasTool` trong phần lõi khỏi `src/agents/openclaw-tools.ts`.
- Đã chuyển phần triển khai máy chủ Canvas từ `src/canvas-host` sang `extensions/canvas/src/host`.
- Đã giữ `extensions/canvas/runtime-api.ts` làm barrel tương thích thuộc sở hữu của Plugin cho kiểm thử, đóng gói và các trình trợ giúp Canvas công khai bên ngoài.
- Đã chuyển việc hiện thực hóa tài liệu Canvas từ `src/gateway/canvas-documents.ts` sang `extensions/canvas/src/documents.ts`.
- Đã chuyển phần triển khai CLI Canvas và các trình trợ giúp JSONL A2UI vào `extensions/canvas/src/cli.ts`.
- Đã chuyển URL máy chủ Canvas và các trình trợ giúp khả năng có phạm vi vào `extensions/canvas/src`.
- Đã chuyển các giá trị mặc định của lệnh Node Canvas ra khỏi danh sách phần lõi được mã hóa cứng và vào `nodeInvokePolicies` của Plugin.
- Đã thêm cấu hình máy chủ Canvas thuộc sở hữu của Plugin tại `plugins.entries.canvas.config.host`.
- Đã chuyển việc phục vụ Canvas và A2UI qua HTTP sang phía sau cơ chế đăng ký tuyến HTTP của Plugin Canvas.
- Đã thêm cơ chế điều phối nâng cấp WebSocket chung của Plugin cho các tuyến HTTP thuộc sở hữu của Plugin.
- Đã thay thế URL máy chủ Gateway và xác thực khả năng Node dành riêng cho Canvas bằng bề mặt Plugin được lưu trữ và các trình trợ giúp khả năng Node dùng chung.
- Đã thêm các trình phân giải nội dung đa phương tiện được lưu trữ thuộc sở hữu của Plugin để URL tài liệu Canvas được phân giải thông qua Plugin Canvas thay vì phần lõi nhập các thành phần nội bộ của tài liệu Canvas.
- Đã thêm `api.registerNodeCliFeature(...)` để Canvas có thể khai báo `openclaw nodes canvas` là một tính năng Node thuộc sở hữu của Plugin mà không cần ghi thủ công đường dẫn lệnh cha.
- Đã loại bỏ các lệnh nhập `src/**` trong môi trường sản xuất của `extensions/canvas/runtime-api.js`.
- Đã chuyển nguồn gói A2UI từ `apps/shared/OpenClawKit/Tools/CanvasA2UI` sang `extensions/canvas/src/host/a2ui-app`.
- Đã chuyển phần triển khai xây dựng/sao chép A2UI vào `extensions/canvas/scripts` và thay thế hệ thống kết nối xây dựng gốc bằng các hook tài sản Plugin đi kèm dùng chung.
- Đã loại bỏ bí danh cấu hình cấp cao nhất `canvasHost` cũ khỏi runtime.
- Đã giữ lại quá trình di chuyển Canvas của doctor để `openclaw doctor --fix` ghi lại các cấu hình `canvasHost` cũ thành `plugins.entries.canvas.config.host`.
- Đã loại bỏ khả năng tương thích giao thức Canvas với agent cũ sau gateway protocol v4. Các ứng dụng khách gốc và Gateway hiện chỉ sử dụng `pluginSurfaceUrls.canvas` cùng với `node.pluginSurface.refresh`; đường dẫn `canvasHostUrl`, `canvasCapability` và `node.canvas.capability.refresh` đã ngừng dùng được chủ ý không hỗ trợ trong lần tái cấu trúc thử nghiệm này.
- Đã cập nhật danh mục Plugin được tạo để bao gồm Canvas.
- Đã thêm tài liệu tham chiếu Plugin tại `docs/plugins/reference/canvas.md`.

Các bề mặt Canvas còn lại hiện thuộc sở hữu của phần lõi:

- Các trình xử lý Canvas của ứng dụng gốc trong `apps/` vẫn chủ ý sử dụng bề mặt Plugin Canvas
- các trình xử lý giao thức/ứng dụng khách Canvas của ứng dụng gốc trong `apps/`
- đầu ra tạo phẩm đã phát hành vẫn sử dụng `dist/canvas-host/a2ui` để tra cứu runtime tương thích ngược, nhưng bước sao chép hiện thuộc sở hữu của Plugin

## Cấu trúc mục tiêu

`extensions/canvas` nên sở hữu:

- manifest Plugin và siêu dữ liệu gói
- đăng ký công cụ agent
- chính sách lệnh gọi Node
- máy chủ Canvas và runtime A2UI
- nguồn gói Canvas A2UI và các tập lệnh xây dựng/sao chép tài sản
- tạo tài liệu Canvas và phân giải tài sản
- phần triển khai CLI Canvas
- trang tài liệu Canvas và mục trong danh mục Plugin

Phần lõi chỉ nên sở hữu các điểm nối dùng chung:

- khám phá và đăng ký Plugin
- registry công cụ agent dùng chung
- registry chính sách gọi Node dùng chung
- HTTP/xác thực Gateway dùng chung và cơ chế điều phối nâng cấp WebSocket
- phân giải URL bề mặt Plugin được lưu trữ dùng chung
- đăng ký trình phân giải nội dung đa phương tiện được lưu trữ dùng chung
- truyền tải khả năng Node dùng chung
- hạ tầng cấu hình dùng chung
- khám phá hook tài sản Plugin đi kèm dùng chung

Các ứng dụng gốc có thể giữ lại trình xử lý lệnh Canvas với vai trò ứng dụng khách của giao thức. Chúng không phải là chủ sở hữu runtime của Plugin.

## Các bước di chuyển

1. Xem `plugins.entries.canvas.config.host` là bề mặt cấu hình thuộc sở hữu của Plugin.
2. Cập nhật tài liệu để mô tả Canvas là một Plugin đi kèm mang tính thử nghiệm.
3. Chạy các bài kiểm thử Canvas tập trung, kiểm tra danh mục Plugin, kiểm tra API SDK Plugin và các cổng xây dựng/kiểu dữ liệu chịu ảnh hưởng bởi ranh giới runtime.

## Danh sách kiểm tra kiểm toán

Trước khi tuyên bố hoàn tất việc tái cấu trúc:

- `rg "src/canvas-host|../canvas-host"` không trả về lệnh nhập nguồn đang hoạt động nào.
- `rg "canvas-tool|createCanvasTool" src` không tìm thấy phần triển khai công cụ Canvas nào thuộc sở hữu của phần lõi.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` không tìm thấy giá trị mặc định của danh sách cho phép được mã hóa cứng nào bên ngoài các bài kiểm thử chính sách Plugin dùng chung.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` trống.
- `rg "canvas-documents" src` trống.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` trống; Plugin Canvas đăng ký `openclaw nodes canvas` thông qua siêu dữ liệu CLI Plugin lồng nhau.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` không trả về quyền sở hữu runtime Gateway nào.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` chỉ tìm thấy các wrapper tương thích hoặc đường dẫn thuộc sở hữu của Plugin.
- `pnpm plugins:inventory:check` đạt yêu cầu.
- `pnpm plugin-sdk:api:check` đạt yêu cầu hoặc các bản ghi hợp đồng API được tạo đã được chủ ý cập nhật và review.
- Các bài kiểm thử Canvas có mục tiêu đạt yêu cầu.
- Các bài kiểm thử làn thay đổi cho đường dẫn máy chủ Canvas/A2UI đạt yêu cầu.
- Nội dung PR nêu rõ Canvas mang tính thử nghiệm và dựa trên Plugin.

## Các lệnh xác minh

Sử dụng các bước kiểm tra cục bộ có mục tiêu trong quá trình lặp:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Chạy `pnpm build` trước khi đẩy mã nếu barrel runtime, lệnh nhập lazy, việc đóng gói hoặc các bề mặt Plugin đã phát hành thay đổi.
