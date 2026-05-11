---
read_when:
    - Bạn duy trì một Plugin OpenClaw
    - Bạn thấy cảnh báo về khả năng tương thích của Plugin
    - Bạn đang lên kế hoạch di chuyển SDK Plugin hoặc tệp kê khai
summary: Hợp đồng tương thích của Plugin, siêu dữ liệu ngừng hỗ trợ và kỳ vọng về di chuyển
title: Khả năng tương thích của Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw duy trì các hợp đồng Plugin cũ thông qua các bộ điều hợp tương thích có tên trước khi loại bỏ chúng. Điều này bảo vệ các Plugin tích hợp sẵn và bên ngoài hiện có trong khi các hợp đồng SDK, manifest, thiết lập, cấu hình và thời gian chạy agent phát triển.

## Sổ đăng ký tương thích

Các hợp đồng tương thích Plugin được theo dõi trong sổ đăng ký lõi tại `src/plugins/compat/registry.ts`.

Mỗi bản ghi có:

- một mã tương thích ổn định
- trạng thái: `active`, `deprecated`, `removal-pending`, hoặc `removed`
- chủ sở hữu: SDK, cấu hình, thiết lập, kênh, nhà cung cấp, thực thi Plugin, thời gian chạy agent,
  hoặc lõi
- ngày giới thiệu và ngày ngừng dùng khi áp dụng
- hướng dẫn thay thế
- tài liệu, chẩn đoán và kiểm thử bao phủ hành vi cũ và mới

Sổ đăng ký là nguồn cho việc lập kế hoạch của người bảo trì và các lần kiểm tra trình kiểm tra Plugin trong tương lai. Nếu một hành vi hướng tới Plugin thay đổi, hãy thêm hoặc cập nhật bản ghi tương thích trong cùng thay đổi thêm bộ điều hợp.

Khả năng tương thích cho sửa chữa và di chuyển của doctor được theo dõi riêng tại `src/commands/doctor/shared/deprecation-compat.ts`. Các bản ghi đó bao phủ các dạng cấu hình cũ, bố cục sổ cái cài đặt và các shim sửa chữa có thể cần tiếp tục khả dụng sau khi đường dẫn tương thích thời gian chạy bị loại bỏ.

Các đợt rà soát phát hành nên kiểm tra cả hai sổ đăng ký. Không xóa một di chuyển doctor chỉ vì bản ghi tương thích thời gian chạy hoặc cấu hình tương ứng đã hết hạn; trước tiên hãy xác minh không còn đường dẫn nâng cấp được hỗ trợ nào vẫn cần sửa chữa đó. Cũng hãy xác thực lại từng chú thích thay thế trong quá trình lập kế hoạch phát hành vì quyền sở hữu Plugin và phạm vi cấu hình có thể thay đổi khi nhà cung cấp và kênh được chuyển ra khỏi lõi.

## Gói trình kiểm tra Plugin

Trình kiểm tra Plugin nên nằm ngoài repo lõi OpenClaw dưới dạng một gói/kho lưu trữ riêng được hỗ trợ bởi các hợp đồng tương thích và manifest có phiên bản.

CLI ngày đầu nên là:

```sh
openclaw-plugin-inspector ./my-plugin
```

Nó nên phát ra:

- xác thực manifest/schema
- phiên bản tương thích hợp đồng đang được kiểm tra
- kiểm tra siêu dữ liệu cài đặt/nguồn
- kiểm tra nhập cold-path
- cảnh báo ngừng dùng và tương thích

Dùng `--json` để có đầu ra máy đọc ổn định trong chú thích CI. Lõi OpenClaw nên phơi bày các hợp đồng và fixture mà trình kiểm tra có thể tiêu thụ, nhưng không nên phát hành binary của trình kiểm tra từ gói `openclaw` chính.

### Lane chấp nhận của người bảo trì

Dùng Blacksmith Testbox dựa trên Crabbox cho lane chấp nhận gói có thể cài đặt khi xác thực trình kiểm tra bên ngoài với các gói Plugin OpenClaw. Chạy từ một checkout OpenClaw sạch sau khi gói được build:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Giữ lane này ở dạng người bảo trì tự chọn vì nó cài đặt một gói npm bên ngoài và có thể kiểm tra các gói Plugin được clone bên ngoài repo. Các cơ chế bảo vệ repo cục bộ bao phủ bản đồ export SDK, siêu dữ liệu sổ đăng ký tương thích, quá trình loại bỏ nhập SDK đã ngừng dùng và ranh giới nhập của tiện ích tích hợp; bằng chứng trình kiểm tra Testbox bao phủ gói theo cách tác giả Plugin bên ngoài tiêu thụ nó.

## Chính sách ngừng dùng

OpenClaw không nên loại bỏ một hợp đồng Plugin đã được ghi tài liệu trong cùng bản phát hành giới thiệu thay thế của nó.

Trình tự di chuyển là:

1. Thêm hợp đồng mới.
2. Giữ hành vi cũ được nối qua một bộ điều hợp tương thích có tên.
3. Phát ra chẩn đoán hoặc cảnh báo khi tác giả Plugin có thể hành động.
4. Ghi tài liệu về thay thế và mốc thời gian.
5. Kiểm thử cả đường dẫn cũ và mới.
6. Chờ hết khoảng thời gian di chuyển đã công bố.
7. Chỉ loại bỏ khi có phê duyệt phát hành phá vỡ rõ ràng.

Các bản ghi đã ngừng dùng phải bao gồm ngày bắt đầu cảnh báo, thay thế, liên kết tài liệu và ngày loại bỏ cuối cùng không quá ba tháng sau khi cảnh báo bắt đầu. Không thêm đường dẫn tương thích đã ngừng dùng với khoảng thời gian loại bỏ mở, trừ khi người bảo trì quyết định rõ ràng đó là tương thích vĩnh viễn và đánh dấu nó là `active` thay vào đó.

## Các khu vực tương thích hiện tại

Các bản ghi tương thích hiện tại bao gồm:

- các nhập SDK rộng kiểu cũ như `openclaw/plugin-sdk/compat`
- các dạng Plugin chỉ có hook kiểu cũ và `before_agent_start`
- các điểm vào Plugin `activate(api)` kiểu cũ trong khi Plugin di chuyển sang
  `register(api)`
- các bí danh SDK kiểu cũ như `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, bộ dựng trạng thái `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (được thay bằng các đường dẫn con kiểm thử
  `openclaw/plugin-sdk/*` tập trung), và bí danh kiểu `ClawdbotConfig` /
  `OpenClawSchemaType`
- hành vi danh sách cho phép và bật Plugin tích hợp
- siêu dữ liệu manifest biến môi trường nhà cung cấp/kênh kiểu cũ
- các hook Plugin nhà cung cấp và bí danh kiểu cũ trong khi nhà cung cấp chuyển sang
  các hook catalog, xác thực, suy nghĩ, phát lại và vận chuyển rõ ràng
- các bí danh thời gian chạy kiểu cũ như `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, và
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` đã ngừng dùng
- đăng ký tách Plugin bộ nhớ kiểu cũ trong khi Plugin bộ nhớ chuyển sang
  `registerMemoryCapability`
- các helper SDK kênh kiểu cũ cho schema thông điệp gốc, gating đề cập,
  định dạng phong bì inbound và lồng năng lực phê duyệt
- các bí danh helper khóa route kênh và comparable-target kiểu cũ trong khi Plugin
  chuyển sang `openclaw/plugin-sdk/channel-route`
- gợi ý kích hoạt đang được thay bằng quyền sở hữu đóng góp manifest
- fallback thời gian chạy `setup-api` trong khi descriptor thiết lập chuyển sang siêu dữ liệu lạnh
  `setup.requiresRuntime: false`
- hook `discovery` của nhà cung cấp trong khi hook catalog nhà cung cấp chuyển sang
  `catalog.run(...)`
- siêu dữ liệu kênh `showConfigured` / `showInSetup` trong khi gói kênh chuyển
  sang `openclaw.channel.exposure`
- khóa cấu hình runtime-policy kiểu cũ trong khi doctor di chuyển operator sang
  `agentRuntime`
- fallback siêu dữ liệu cấu hình kênh tích hợp đã sinh trong khi siêu dữ liệu ưu tiên sổ đăng ký
  `channelConfigs` được đưa vào
- cờ môi trường vô hiệu hóa sổ đăng ký Plugin đã lưu và di chuyển cài đặt trong khi
  luồng sửa chữa di chuyển operator sang `openclaw plugins registry --refresh` và
  `openclaw doctor --fix`
- các đường dẫn cấu hình tìm kiếm web, fetch web và x_search thuộc sở hữu Plugin kiểu cũ trong khi
  doctor di chuyển chúng sang `plugins.entries.<plugin>.config`
- cấu hình `plugins.installs` do người dùng viết và bí danh đường dẫn tải Plugin tích hợp
  kiểu cũ trong khi siêu dữ liệu cài đặt chuyển vào sổ cái Plugin do trạng thái quản lý

Mã Plugin mới nên ưu tiên thay thế được liệt kê trong sổ đăng ký và trong hướng dẫn di chuyển cụ thể. Plugin hiện có có thể tiếp tục dùng đường dẫn tương thích cho đến khi tài liệu, chẩn đoán và ghi chú phát hành công bố khoảng thời gian loại bỏ.

## Ghi chú phát hành

Ghi chú phát hành nên bao gồm các ngừng dùng Plugin sắp tới với ngày mục tiêu và liên kết tới tài liệu di chuyển. Cảnh báo đó cần diễn ra trước khi một đường dẫn tương thích chuyển sang `removal-pending` hoặc `removed`.
