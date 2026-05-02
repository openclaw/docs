---
read_when:
    - Bạn bảo trì một Plugin OpenClaw
    - Bạn thấy một cảnh báo về khả năng tương thích Plugin
    - Bạn đang lên kế hoạch di chuyển SDK Plugin hoặc manifest
summary: Hợp đồng tương thích Plugin, siêu dữ liệu ngừng dùng và kỳ vọng di chuyển
title: Khả năng tương thích của Plugin
x-i18n:
    generated_at: "2026-05-02T10:47:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw giữ cho các hợp đồng Plugin cũ hơn được kết nối thông qua các bộ điều hợp tương thích được đặt tên trước khi loại bỏ chúng. Điều này bảo vệ các Plugin được đóng gói sẵn và bên ngoài hiện có trong khi các hợp đồng SDK, manifest, thiết lập, cấu hình và runtime agent phát triển.

## Sổ đăng ký tương thích

Các hợp đồng tương thích Plugin được theo dõi trong sổ đăng ký lõi tại
`src/plugins/compat/registry.ts`.

Mỗi bản ghi có:

- một mã tương thích ổn định
- trạng thái: `active`, `deprecated`, `removal-pending`, hoặc `removed`
- chủ sở hữu: SDK, cấu hình, thiết lập, kênh, provider, thực thi Plugin, runtime agent,
  hoặc lõi
- ngày giới thiệu và ngày ngừng hỗ trợ khi áp dụng
- hướng dẫn thay thế
- tài liệu, chẩn đoán và kiểm thử bao phủ hành vi cũ và mới

Sổ đăng ký là nguồn cho việc lập kế hoạch của maintainer và các kiểm tra trình kiểm tra Plugin trong tương lai. Nếu một hành vi hướng tới Plugin thay đổi, hãy thêm hoặc cập nhật bản ghi tương thích trong cùng thay đổi thêm bộ điều hợp.

Khả năng tương thích cho sửa chữa doctor và migration được theo dõi riêng tại
`src/commands/doctor/shared/deprecation-compat.ts`. Các bản ghi đó bao phủ các dạng cấu hình cũ, bố cục install-ledger và các shim sửa chữa có thể cần tiếp tục khả dụng sau khi đường dẫn tương thích runtime bị loại bỏ.

Các lượt quét phát hành nên kiểm tra cả hai sổ đăng ký. Đừng xóa một migration doctor chỉ vì bản ghi tương thích runtime hoặc cấu hình tương ứng đã hết hạn; trước tiên hãy xác minh rằng không còn đường dẫn nâng cấp được hỗ trợ nào vẫn cần sửa chữa đó. Đồng thời xác thực lại từng chú thích thay thế trong quá trình lập kế hoạch phát hành vì quyền sở hữu Plugin và phạm vi cấu hình có thể thay đổi khi provider và kênh được chuyển ra khỏi lõi.

## Gói trình kiểm tra Plugin

Trình kiểm tra Plugin nên nằm ngoài repo lõi OpenClaw dưới dạng một package/repository riêng được hỗ trợ bởi các hợp đồng tương thích và manifest có phiên bản.

CLI ngày đầu nên là:

```sh
openclaw-plugin-inspector ./my-plugin
```

Nó nên phát ra:

- xác thực manifest/schema
- phiên bản tương thích hợp đồng đang được kiểm tra
- kiểm tra metadata cài đặt/nguồn
- kiểm tra import đường dẫn lạnh
- cảnh báo ngừng hỗ trợ và tương thích

Dùng `--json` để có đầu ra ổn định, máy đọc được trong chú thích CI. Lõi OpenClaw nên cung cấp các hợp đồng và fixture mà trình kiểm tra có thể dùng, nhưng không nên phát hành binary trình kiểm tra từ package `openclaw` chính.

### Lane chấp nhận của maintainer

Dùng Blacksmith Testbox cho lane chấp nhận package có thể cài đặt khi xác thực trình kiểm tra bên ngoài với các package Plugin OpenClaw. Chạy nó từ một checkout OpenClaw sạch sau khi package được build:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Giữ lane này ở chế độ opt-in cho maintainer vì nó cài đặt một package npm bên ngoài và có thể kiểm tra các package Plugin được clone bên ngoài repo. Các guard repo cục bộ bao phủ export map của SDK, metadata sổ đăng ký tương thích, việc giảm dần import SDK đã ngừng hỗ trợ và ranh giới import của extension được đóng gói sẵn; bằng chứng trình kiểm tra Testbox bao phủ package như cách tác giả Plugin bên ngoài sử dụng nó.

## Chính sách ngừng hỗ trợ

OpenClaw không nên loại bỏ một hợp đồng Plugin đã được ghi tài liệu trong cùng bản phát hành giới thiệu phần thay thế của nó.

Trình tự migration là:

1. Thêm hợp đồng mới.
2. Giữ hành vi cũ được kết nối thông qua một bộ điều hợp tương thích được đặt tên.
3. Phát chẩn đoán hoặc cảnh báo khi tác giả Plugin có thể hành động.
4. Ghi tài liệu phần thay thế và mốc thời gian.
5. Kiểm thử cả đường dẫn cũ và mới.
6. Chờ hết khoảng thời gian migration đã thông báo.
7. Chỉ loại bỏ khi có phê duyệt phát hành phá vỡ tương thích rõ ràng.

Các bản ghi đã ngừng hỗ trợ phải bao gồm ngày bắt đầu cảnh báo, phần thay thế, liên kết tài liệu và ngày loại bỏ cuối cùng không quá ba tháng sau khi cảnh báo bắt đầu. Đừng thêm một đường dẫn tương thích đã ngừng hỗ trợ với khoảng thời gian loại bỏ không giới hạn, trừ khi maintainer quyết định rõ ràng rằng đó là khả năng tương thích vĩnh viễn và đánh dấu nó là `active` thay vào đó.

## Các khu vực tương thích hiện tại

Các bản ghi tương thích hiện tại bao gồm:

- các import SDK rộng kiểu cũ như `openclaw/plugin-sdk/compat`
- các dạng Plugin chỉ có hook kiểu cũ và `before_agent_start`
- các entrypoint Plugin `activate(api)` kiểu cũ trong khi Plugin chuyển sang
  `register(api)`
- các alias SDK kiểu cũ như `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, trình tạo trạng thái `openclaw/plugin-sdk/command-auth`
  , `openclaw/plugin-sdk/test-utils` (được thay thế bằng các subpath kiểm thử
  `openclaw/plugin-sdk/*` tập trung), và các type alias `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist Plugin được đóng gói sẵn và hành vi bật
- metadata manifest env-var provider/kênh kiểu cũ
- các hook Plugin provider và type alias kiểu cũ trong khi provider chuyển sang
  các hook catalog, auth, thinking, replay và transport rõ ràng
- các alias runtime kiểu cũ như `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, và
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` đã ngừng hỗ trợ
- đăng ký tách Plugin bộ nhớ kiểu cũ trong khi Plugin bộ nhớ chuyển sang
  `registerMemoryCapability`
- các helper SDK kênh kiểu cũ cho schema tin nhắn native, chặn mention,
  định dạng envelope đầu vào và lồng khả năng phê duyệt
- các alias khóa route kênh và helper comparable-target kiểu cũ trong khi Plugin
  chuyển sang `openclaw/plugin-sdk/channel-route`
- gợi ý kích hoạt đang được thay thế bằng quyền sở hữu đóng góp trong manifest
- fallback runtime `setup-api` trong khi descriptor thiết lập chuyển sang metadata lạnh
  `setup.requiresRuntime: false`
- các hook `discovery` của provider trong khi hook catalog provider chuyển sang
  `catalog.run(...)`
- metadata `showConfigured` / `showInSetup` của kênh trong khi package kênh chuyển
  sang `openclaw.channel.exposure`
- các khóa cấu hình runtime-policy kiểu cũ trong khi doctor migration operator sang
  `agentRuntime`
- fallback metadata cấu hình kênh được đóng gói sẵn đã tạo trong khi metadata
  `channelConfigs` ưu tiên registry được triển khai
- các cờ env vô hiệu hóa sổ đăng ký Plugin đã lưu và install-migration trong khi
  luồng sửa chữa migration operator sang `openclaw plugins registry --refresh` và
  `openclaw doctor --fix`
- các đường dẫn cấu hình tìm kiếm web, fetch web và x_search do Plugin sở hữu kiểu cũ trong khi
  doctor migration chúng sang `plugins.entries.<plugin>.config`
- cấu hình do `plugins.installs` tạo kiểu cũ và các alias load-path Plugin được đóng gói sẵn
  trong khi metadata cài đặt chuyển vào plugin ledger do trạng thái quản lý

Mã Plugin mới nên ưu tiên phần thay thế được liệt kê trong sổ đăng ký và trong hướng dẫn migration cụ thể. Các Plugin hiện có có thể tiếp tục dùng một đường dẫn tương thích cho đến khi tài liệu, chẩn đoán và ghi chú phát hành công bố khoảng thời gian loại bỏ.

## Ghi chú phát hành

Ghi chú phát hành nên bao gồm các đợt ngừng hỗ trợ Plugin sắp tới với ngày mục tiêu và liên kết đến tài liệu migration. Cảnh báo đó cần xảy ra trước khi một đường dẫn tương thích chuyển sang `removal-pending` hoặc `removed`.
