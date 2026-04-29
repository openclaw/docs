---
read_when:
    - Bạn bảo trì một Plugin OpenClaw
    - Bạn thấy một cảnh báo về khả năng tương thích Plugin
    - Bạn đang lập kế hoạch di chuyển SDK Plugin hoặc tệp kê khai
summary: Các hợp đồng tương thích Plugin, siêu dữ liệu ngừng hỗ trợ và kỳ vọng di chuyển
title: Khả năng tương thích của Plugin
x-i18n:
    generated_at: "2026-04-29T22:59:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw giữ các hợp đồng Plugin cũ được nối qua các bộ điều hợp tương thích có tên trước khi gỡ bỏ chúng. Điều này bảo vệ các Plugin được đóng gói sẵn và bên ngoài hiện có trong khi các hợp đồng SDK, manifest, thiết lập, cấu hình và runtime tác tử tiếp tục phát triển.

## Sổ đăng ký tương thích

Các hợp đồng tương thích Plugin được theo dõi trong sổ đăng ký lõi tại
`src/plugins/compat/registry.ts`.

Mỗi bản ghi có:

- một mã tương thích ổn định
- trạng thái: `active`, `deprecated`, `removal-pending`, hoặc `removed`
- chủ sở hữu: SDK, cấu hình, thiết lập, kênh, provider, thực thi Plugin, runtime tác tử,
  hoặc lõi
- ngày giới thiệu và ngày ngừng khuyến nghị khi có áp dụng
- hướng dẫn thay thế
- tài liệu, chẩn đoán và kiểm thử bao phủ hành vi cũ và mới

Sổ đăng ký là nguồn cho việc lập kế hoạch của maintainer và các kiểm tra trình kiểm tra Plugin trong tương lai. Nếu một hành vi hướng tới Plugin thay đổi, hãy thêm hoặc cập nhật bản ghi tương thích trong cùng thay đổi thêm bộ điều hợp.

Khả năng tương thích cho sửa chữa doctor và di trú được theo dõi riêng tại
`src/commands/doctor/shared/deprecation-compat.ts`. Các bản ghi đó bao phủ hình dạng cấu hình cũ, bố cục sổ cái cài đặt và các shim sửa chữa có thể cần tiếp tục khả dụng sau khi đường dẫn tương thích runtime bị gỡ bỏ.

Các đợt rà soát phát hành nên kiểm tra cả hai sổ đăng ký. Đừng xóa một di trú doctor chỉ vì bản ghi tương thích runtime hoặc cấu hình tương ứng đã hết hạn; trước hết hãy xác minh không còn đường dẫn nâng cấp được hỗ trợ nào vẫn cần sửa chữa đó. Đồng thời xác thực lại từng chú thích thay thế trong quá trình lập kế hoạch phát hành vì quyền sở hữu Plugin và phạm vi cấu hình có thể thay đổi khi provider và kênh được chuyển ra khỏi lõi.

## Gói trình kiểm tra Plugin

Trình kiểm tra Plugin nên nằm bên ngoài repo OpenClaw lõi dưới dạng một gói/repository riêng, dựa trên các hợp đồng manifest và tương thích có phiên bản.

CLI ngày đầu nên là:

```sh
openclaw-plugin-inspector ./my-plugin
```

Nó nên phát ra:

- xác thực manifest/schema
- phiên bản tương thích hợp đồng đang được kiểm tra
- kiểm tra siêu dữ liệu cài đặt/nguồn
- kiểm tra import đường lạnh
- cảnh báo ngừng khuyến nghị và tương thích

Dùng `--json` để có đầu ra ổn định, máy đọc được trong chú thích CI. Lõi OpenClaw nên xuất các hợp đồng và fixture mà trình kiểm tra có thể dùng, nhưng không nên phát hành binary trình kiểm tra từ gói `openclaw` chính.

### Làn chấp nhận của maintainer

Dùng Blacksmith Testbox cho làn chấp nhận gói có thể cài đặt khi xác thực trình kiểm tra bên ngoài với các gói Plugin OpenClaw. Chạy từ một checkout OpenClaw sạch sau khi gói được build:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Giữ làn này ở dạng maintainer chủ động chọn vì nó cài đặt một gói npm bên ngoài và có thể kiểm tra các gói Plugin được clone bên ngoài repo. Các chốt bảo vệ repo cục bộ bao phủ sơ đồ export SDK, siêu dữ liệu sổ đăng ký tương thích, việc đốt giảm import SDK đã ngừng khuyến nghị và ranh giới import của Plugin đóng gói sẵn; bằng chứng trình kiểm tra Testbox bao phủ gói theo cách các tác giả Plugin bên ngoài sử dụng nó.

## Chính sách ngừng khuyến nghị

OpenClaw không nên gỡ bỏ một hợp đồng Plugin đã được ghi tài liệu trong cùng bản phát hành giới thiệu phần thay thế của nó.

Trình tự di trú là:

1. Thêm hợp đồng mới.
2. Giữ hành vi cũ được nối qua một bộ điều hợp tương thích có tên.
3. Phát chẩn đoán hoặc cảnh báo khi tác giả Plugin có thể hành động.
4. Ghi tài liệu phần thay thế và mốc thời gian.
5. Kiểm thử cả đường dẫn cũ và mới.
6. Chờ hết cửa sổ di trú đã công bố.
7. Chỉ gỡ bỏ khi có phê duyệt phát hành phá vỡ rõ ràng.

Các bản ghi đã ngừng khuyến nghị phải bao gồm ngày bắt đầu cảnh báo, phần thay thế, liên kết tài liệu và ngày gỡ bỏ cuối cùng không quá ba tháng sau khi cảnh báo bắt đầu. Đừng thêm một đường dẫn tương thích đã ngừng khuyến nghị với cửa sổ gỡ bỏ bỏ ngỏ trừ khi maintainer quyết định rõ ràng rằng đó là khả năng tương thích vĩnh viễn và đánh dấu là `active` thay vào đó.

## Các khu vực tương thích hiện tại

Các bản ghi tương thích hiện tại bao gồm:

- các import SDK rộng kiểu cũ như `openclaw/plugin-sdk/compat`
- hình dạng Plugin kiểu cũ chỉ có hook và `before_agent_start`
- các entrypoint Plugin `activate(api)` kiểu cũ trong khi Plugin di trú sang
  `register(api)`
- các alias SDK kiểu cũ như `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder trạng thái `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (được thay thế bằng các đường dẫn phụ kiểm thử
  `openclaw/plugin-sdk/*` tập trung), và các alias kiểu `ClawdbotConfig` /
  `OpenClawSchemaType`
- hành vi danh sách cho phép và bật Plugin đóng gói sẵn
- siêu dữ liệu manifest biến môi trường provider/kênh kiểu cũ
- các hook Plugin provider và alias kiểu kiểu cũ trong khi provider chuyển sang các hook danh mục, xác thực, suy nghĩ, phát lại và transport rõ ràng
- các alias runtime kiểu cũ như `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, và
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  đã ngừng khuyến nghị
- đăng ký tách Plugin bộ nhớ kiểu cũ trong khi Plugin bộ nhớ chuyển sang
  `registerMemoryCapability`
- các helper SDK kênh kiểu cũ cho schema thông điệp native, chặn mention,
  định dạng envelope đầu vào và lồng năng lực phê duyệt
- khóa route kênh kiểu cũ và alias helper mục tiêu có thể so sánh trong khi Plugin
  chuyển sang `openclaw/plugin-sdk/channel-route`
- gợi ý kích hoạt đang được thay thế bằng quyền sở hữu contribution trong manifest
- tải sidecar khởi động ngầm định đã ngừng khuyến nghị cho Plugin chưa khai báo
  `activation.onStartup`; maintainer có thể kiểm thử hành vi chặt chẽ hơn trong tương lai với
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- dự phòng runtime `setup-api` trong khi descriptor thiết lập chuyển sang siêu dữ liệu lạnh
  `setup.requiresRuntime: false`
- hook `discovery` của provider trong khi hook danh mục provider chuyển sang
  `catalog.run(...)`
- siêu dữ liệu kênh `showConfigured` / `showInSetup` trong khi các gói kênh chuyển sang
  `openclaw.channel.exposure`
- khóa cấu hình runtime-policy kiểu cũ trong khi doctor di trú operator sang
  `agentRuntime`
- dự phòng siêu dữ liệu cấu hình kênh đóng gói sẵn đã tạo trong khi siêu dữ liệu ưu tiên registry
  `channelConfigs` được đưa vào
- cờ môi trường tắt sổ đăng ký Plugin đã lưu và di trú cài đặt trong khi
  luồng sửa chữa di trú operator sang `openclaw plugins registry --refresh` và
  `openclaw doctor --fix`
- các đường dẫn cấu hình web search, web fetch và x_search do Plugin sở hữu kiểu cũ trong khi
  doctor di trú chúng sang `plugins.entries.<plugin>.config`
- cấu hình do tác giả viết `plugins.installs` kiểu cũ và alias đường dẫn tải Plugin đóng gói sẵn
  trong khi siêu dữ liệu cài đặt chuyển vào sổ cái Plugin do trạng thái quản lý

Mã Plugin mới nên ưu tiên phần thay thế được liệt kê trong sổ đăng ký và trong hướng dẫn di trú cụ thể. Plugin hiện có có thể tiếp tục dùng một đường dẫn tương thích cho đến khi tài liệu, chẩn đoán và ghi chú phát hành công bố cửa sổ gỡ bỏ.

## Ghi chú phát hành

Ghi chú phát hành nên bao gồm các đợt ngừng khuyến nghị Plugin sắp tới với ngày mục tiêu và liên kết đến tài liệu di trú. Cảnh báo đó cần xảy ra trước khi một đường dẫn tương thích chuyển sang `removal-pending` hoặc `removed`.
