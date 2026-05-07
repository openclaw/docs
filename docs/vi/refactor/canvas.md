---
read_when:
    - Di chuyển quyền sở hữu máy chủ Canvas, công cụ, lệnh, tài liệu hoặc giao thức
    - Kiểm tra xem Canvas có còn do phần lõi sở hữu hay không
    - Chuẩn bị hoặc đánh giá PR Plugin Canvas thử nghiệm
summary: Kế hoạch và danh sách kiểm tra rà soát để chuyển Canvas ra khỏi lõi và vào một Plugin thử nghiệm được đóng gói kèm.
title: Tái cấu trúc Plugin Canvas
x-i18n:
    generated_at: "2026-05-07T13:24:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Tái cấu trúc Canvas plugin

Canvas ít được sử dụng và đang thử nghiệm. Hãy xem đây là một Plugin tích hợp, không phải tính năng lõi. Phần lõi có thể giữ lại hệ thống Gateway, node, HTTP, xác thực, cấu hình và native-client chung, nhưng hành vi riêng của Canvas nên nằm trong `extensions/canvas`.

## Mục tiêu

Chuyển quyền sở hữu Canvas sang `extensions/canvas` trong khi vẫn giữ hành vi paired-node hiện tại:

- công cụ `canvas` dành cho agent được đăng ký bởi Canvas plugin
- các lệnh node Canvas chỉ được cho phép khi Canvas plugin đăng ký chúng
- tệp host/source A2UI nằm trong Canvas plugin
- việc hiện thực hóa tài liệu Canvas nằm trong Canvas plugin
- phần triển khai lệnh CLI nằm trong Canvas plugin, hoặc ủy quyền qua runtime barrel do plugin sở hữu
- tài liệu và kho kiểm kê Plugin mô tả Canvas là thử nghiệm và dựa trên Plugin

## Không phải mục tiêu

- Không thiết kế lại UI Canvas của ứng dụng native trong lần tái cấu trúc này.
- Không gỡ bỏ hỗ trợ giao thức/client Canvas khỏi iOS, Android hoặc macOS trừ khi có quyết định sản phẩm riêng rằng Canvas nên bị xóa.
- Không xây dựng một framework dịch vụ plugin rộng chỉ dành cho Canvas trừ khi có ít nhất một Plugin tích hợp khác cần cùng seam đó.

## Trạng thái nhánh hiện tại

Đã xong:

- Đã thêm package Plugin tích hợp trong `extensions/canvas`.
- Đã thêm `extensions/canvas/openclaw.plugin.json`.
- Đã chuyển công cụ agent `canvas` từ `src/agents/tools/canvas-tool.ts` sang `extensions/canvas/src/tool.ts`.
- Đã gỡ bỏ đăng ký lõi của `createCanvasTool` khỏi `src/agents/openclaw-tools.ts`.
- Đã chuyển triển khai Canvas host từ `src/canvas-host` sang `extensions/canvas/src/host`.
- Đã giữ `extensions/canvas/runtime-api.ts` làm compatibility barrel do plugin sở hữu cho kiểm thử, đóng gói và các helper Canvas public bên ngoài.
- Đã chuyển việc hiện thực hóa tài liệu Canvas từ `src/gateway/canvas-documents.ts` sang `extensions/canvas/src/documents.ts`.
- Đã chuyển triển khai CLI Canvas và các helper A2UI JSONL vào `extensions/canvas/src/cli.ts`.
- Đã chuyển các helper URL Canvas host và scoped capability vào `extensions/canvas/src`.
- Đã chuyển mặc định lệnh node Canvas ra khỏi danh sách hardcode của lõi và vào `nodeInvokePolicies` của plugin.
- Đã thêm cấu hình Canvas host do plugin sở hữu tại `plugins.entries.canvas.config.host`.
- Đã chuyển việc phục vụ HTTP Canvas và A2UI ra sau đăng ký route HTTP của Canvas plugin.
- Đã thêm cơ chế dispatch nâng cấp WebSocket plugin chung cho các route HTTP do plugin sở hữu.
- Đã thay thế URL gateway host và xác thực node capability riêng của Canvas bằng hosted plugin surface chung và helper node capability chung.
- Đã thêm hosted media resolver do plugin sở hữu để URL tài liệu Canvas được resolve qua Canvas plugin thay vì lõi import nội bộ tài liệu Canvas.
- Đã thêm `api.registerNodeCliFeature(...)` để Canvas có thể khai báo `openclaw nodes canvas` là tính năng node do plugin sở hữu mà không cần tự viết thủ công đường dẫn lệnh cha.
- Đã gỡ bỏ các import production `src/**` của `extensions/canvas/runtime-api.js`.
- Đã chuyển mã nguồn bundle A2UI từ `apps/shared/OpenClawKit/Tools/CanvasA2UI` sang `extensions/canvas/src/host/a2ui-app`.
- Đã chuyển triển khai build/copy A2UI vào `extensions/canvas/scripts` và thay wiring build gốc bằng hook tài sản Plugin tích hợp chung.
- Đã gỡ bỏ alias cấu hình runtime legacy cấp cao nhất `canvasHost`.
- Đã giữ migration doctor Canvas để `openclaw doctor --fix` viết lại cấu hình `canvasHost` cũ thành `plugins.entries.canvas.config.host`.
- Đã gỡ bỏ tương thích giao thức Canvas của agent cũ phía sau giao thức gateway v4. Native client và gateway hiện chỉ dùng `pluginSurfaceUrls.canvas` cùng `node.pluginSurface.refresh`; đường dẫn đã ngừng dùng `canvasHostUrl`, `canvasCapability`, và `node.canvas.capability.refresh` cố ý không được hỗ trợ trong lần tái cấu trúc thử nghiệm này.
- Đã cập nhật kho kiểm kê Plugin được tạo để bao gồm Canvas.
- Đã thêm tài liệu tham chiếu Plugin tại `docs/plugins/reference/canvas.md`.

Các bề mặt Canvas còn lại đã biết do lõi sở hữu:

- Handler Canvas của ứng dụng native trong `apps/` vẫn chủ ý tiêu thụ bề mặt Canvas plugin
- handler giao thức/client Canvas của ứng dụng native trong `apps/`
- đầu ra artifact đã phát hành vẫn dùng `dist/canvas-host/a2ui` để tra cứu runtime tương thích ngược, nhưng bước copy hiện do plugin sở hữu

## Hình dạng mục tiêu

`extensions/canvas` nên sở hữu:

- manifest plugin và metadata package
- đăng ký công cụ agent
- chính sách lệnh node invoke
- Canvas host và runtime A2UI
- mã nguồn bundle A2UI Canvas và script build/copy tài sản
- tạo tài liệu Canvas và resolve tài sản
- triển khai CLI Canvas
- trang tài liệu Canvas và mục kiểm kê Plugin

Lõi chỉ nên sở hữu các seam chung:

- khám phá và đăng ký plugin
- registry công cụ agent chung
- registry chính sách node invoke chung
- HTTP/xác thực Gateway chung và dispatch nâng cấp WebSocket
- resolve URL hosted plugin surface chung
- đăng ký hosted media resolver chung
- transport node capability chung
- hệ thống cấu hình chung
- khám phá hook tài sản Plugin tích hợp chung

Ứng dụng native có thể giữ handler lệnh Canvas với vai trò client của giao thức. Chúng không phải chủ sở hữu runtime plugin.

## Các bước migration

1. Xem `plugins.entries.canvas.config.host` là bề mặt cấu hình do plugin sở hữu.
2. Cập nhật tài liệu để Canvas được mô tả là Plugin tích hợp thử nghiệm.
3. Chạy các kiểm thử Canvas tập trung, kiểm tra kho kiểm kê Plugin, kiểm tra API plugin SDK và các cổng build/type bị ảnh hưởng bởi ranh giới runtime.

## Checklist kiểm tra

Trước khi xem quá trình tái cấu trúc là hoàn tất:

- `rg "src/canvas-host|../canvas-host"` không trả về import source đang hoạt động nào.
- `rg "canvas-tool|createCanvasTool" src` không tìm thấy triển khai công cụ Canvas do lõi sở hữu.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` không tìm thấy mặc định allowlist hardcode nào ngoài các kiểm thử chính sách plugin chung.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` rỗng.
- `rg "canvas-documents" src` rỗng.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` rỗng; Canvas plugin đăng ký `openclaw nodes canvas` thông qua metadata CLI plugin lồng nhau.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` không trả về quyền sở hữu runtime gateway nào.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` chỉ tìm thấy wrapper tương thích hoặc đường dẫn do plugin sở hữu.
- `pnpm plugins:inventory:check` vượt qua.
- `pnpm plugin-sdk:api:check` vượt qua, hoặc baseline API được tạo được cập nhật và review có chủ ý.
- Các kiểm thử Canvas mục tiêu vượt qua.
- Kiểm thử changed-lanes vượt qua cho các đường dẫn Canvas host/A2UI.
- Nội dung PR nói rõ Canvas là thử nghiệm và dựa trên plugin.

## Lệnh xác minh

Dùng các kiểm tra cục bộ có mục tiêu trong khi lặp:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Chạy `pnpm build` trước khi push nếu runtime barrel, lazy import, đóng gói hoặc các bề mặt plugin đã phát hành thay đổi.
