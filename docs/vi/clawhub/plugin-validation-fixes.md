---
read_when:
    - Bạn đã chạy `clawhub package validate` và cần sửa các phát hiện của Plugin
    - ClawHub đã từ chối hoặc cảnh báo khi phát hành gói Plugin
    - Bạn đang cập nhật siêu dữ liệu gói Plugin trước khi phát hành
summary: Khắc phục các phát hiện xác thực gói Plugin ClawHub trước khi phát hành
title: Sửa lỗi xác thực Plugin
x-i18n:
    generated_at: "2026-07-02T17:40:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Bản sửa lỗi xác thực Plugin

ClawHub xác thực các gói plugin trước khi phát hành và cũng có thể hiển thị các phát hiện từ
quá trình quét gói tự động. Trang này bao gồm các phát hiện dành cho tác giả, nghĩa là
những phát hiện mà tác giả plugin có thể sửa trong siêu dữ liệu gói, manifest, lệnh nhập SDK
hoặc artifact đã phát hành của họ.

Trang này không bao gồm các phát hiện về mức độ bao phủ nội bộ của Plugin Inspector. Nếu một báo cáo đầy đủ
chứa các mã bảo trì trình quét mà không có hướng dẫn khắc phục cho tác giả, các mã đó
dành cho maintainer OpenClaw thay vì tác giả plugin.

Sau khi áp dụng bất kỳ bản sửa nào, hãy chạy lại:

```bash
clawhub package validate <path-to-plugin>
```

## Phát hiện dành cho tác giả

| Mã                                      | Bắt đầu tại đây                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Thêm siêu dữ liệu gói](/vi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Thêm khối openclaw của gói](/vi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Khai báo các điểm vào gói OpenClaw](/vi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Phát hành điểm vào đã khai báo](/vi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Hoàn tất siêu dữ liệu cài đặt](/vi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Khai báo khả năng tương thích API plugin](/vi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Căn chỉnh phiên bản host tối thiểu](/vi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Căn chỉnh phiên bản gói và manifest](/vi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Xóa siêu dữ liệu gói OpenClaw không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Làm cho artifact npm có thể đóng gói](/vi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Bao gồm các điểm vào trong đầu ra npm pack](/vi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Bao gồm siêu dữ liệu trong đầu ra npm pack](/vi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Thêm tên hiển thị cho manifest](/vi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Xóa các trường manifest không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Xóa các khóa hợp đồng không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Thay thế lệnh nhập SDK gốc](/vi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Xóa các lệnh nhập SDK dành riêng](/vi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Thay thế quyền truy cập toàn bộ kho phiên](/vi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Thay thế thao tác ghi toàn bộ kho phiên](/vi/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Thay thế helper đường dẫn tệp phiên](/vi/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Thay thế đích tệp bản ghi phiên cũ](/vi/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Thay thế helper bản ghi cấp thấp](/vi/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Thay thế before_agent_start](/vi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Chuyển biến môi trường của provider vào siêu dữ liệu thiết lập](/vi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Phản chiếu biến môi trường của kênh trong siêu dữ liệu hiện tại](/vi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Xóa tham chiếu schema manifest bảo mật không khả dụng](/vi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Xóa các tệp manifest bảo mật không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Siêu dữ liệu gói

### package-json-missing

Thư mục gốc của gói không bao gồm `package.json`, vì vậy ClawHub không thể xác định
gói npm, phiên bản, điểm vào hoặc siêu dữ liệu OpenClaw.

- Thêm `package.json` với `name`, `version` và `type`.
- Thêm một khối `openclaw` khi gói phân phối một plugin OpenClaw.
- Dùng [Xây dựng plugin](/vi/plugins/building-plugins) để xem ví dụ gói
  tối thiểu và [Plugin manifest](/vi/plugins/manifest#manifest-versus-packagejson)
  để xem phần tách biệt giữa gói và manifest.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Gói có `package.json`, nhưng không khai báo siêu dữ liệu gói
OpenClaw.

- Thêm `package.json#openclaw`.
- Bao gồm siêu dữ liệu điểm vào như `openclaw.extensions` hoặc
  `openclaw.runtimeExtensions`.
- Thêm siêu dữ liệu tương thích và cài đặt khi gói sẽ được phát hành hoặc
  cài đặt qua ClawHub.
- Xem [các trường package.json ảnh hưởng đến khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Siêu dữ liệu gói tồn tại, nhưng không khai báo điểm vào runtime
OpenClaw.

- Thêm `openclaw.extensions` cho các điểm vào plugin native.
- Thêm `openclaw.runtimeExtensions` khi gói đã phát hành cần tải JavaScript
  đã build.
- Giữ tất cả đường dẫn điểm vào bên trong thư mục gói.
- Xem [Điểm vào Plugin](/vi/plugins/sdk-entrypoints) và
  [các trường package.json ảnh hưởng đến khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Gói khai báo một điểm vào OpenClaw, nhưng tệp được tham chiếu bị thiếu
trong gói đang được xác thực.

- Kiểm tra từng đường dẫn trong `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` và `openclaw.runtimeSetupEntry`.
- Build gói nếu điểm vào được tạo vào `dist`.
- Cập nhật siêu dữ liệu nếu điểm vào đã được di chuyển.
- Xem [Điểm vào Plugin](/vi/plugins/sdk-entrypoints).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub không thể xác định cách cài đặt hoặc cập nhật gói.

- Điền `openclaw.install` bằng nguồn cài đặt được hỗ trợ, chẳng hạn như
  `clawhubSpec`, `npmSpec` hoặc `localPath`.
- Đặt `openclaw.install.defaultChoice` khi có nhiều hơn một nguồn cài đặt
  khả dụng.
- Dùng `openclaw.install.minHostVersion` cho phiên bản host OpenClaw tối thiểu.
- Xem [các trường package.json ảnh hưởng đến khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Gói không khai báo phạm vi API plugin OpenClaw mà nó hỗ trợ.

- Thêm `openclaw.compat.pluginApi` vào `package.json`.
- Dùng phiên bản API plugin OpenClaw hoặc mức sàn semver mà bạn đã build và kiểm thử
  tương ứng.
- Giữ mục này tách biệt với phiên bản gói. Phiên bản gói mô tả
  bản phát hành plugin; `openclaw.compat.pluginApi` mô tả hợp đồng API host.
- Xem [các trường package.json ảnh hưởng đến khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Phiên bản host tối thiểu của gói không khớp với siêu dữ liệu phiên bản OpenClaw
mà gói được build dựa trên.

- Kiểm tra `openclaw.install.minHostVersion`.
- Kiểm tra mọi siêu dữ liệu build OpenClaw trong gói, chẳng hạn như phiên bản OpenClaw
  được dùng trong khi phát hành.
- Căn chỉnh phiên bản host tối thiểu với phạm vi phiên bản host mà gói
  thực sự hỗ trợ.
- Xem [các trường package.json ảnh hưởng đến khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Phiên bản gói và phiên bản manifest plugin không thống nhất.

- Ưu tiên `package.json#version` làm phiên bản phát hành gói.
- Nếu `openclaw.plugin.json` cũng có `version`, hãy cập nhật để khớp hoặc xóa
  siêu dữ liệu phiên bản manifest đã lỗi thời khi siêu dữ liệu gói là nguồn chính xác.
- Phát hành phiên bản gói mới sau khi thay đổi siêu dữ liệu đã phát hành.
- Xem [Plugin manifest](/vi/plugins/manifest).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Khối `package.json#openclaw` chứa các trường không được hỗ trợ
làm siêu dữ liệu gói OpenClaw.

- Xóa các trường không được hỗ trợ như `openclaw.bundle`.
- Giữ siêu dữ liệu plugin native trong `openclaw.plugin.json`.
- Giữ điểm vào gói, khả năng tương thích, cài đặt, thiết lập và siêu dữ liệu danh mục
  trong các trường `package.json#openclaw` được hỗ trợ.
- Xem [các trường package.json ảnh hưởng đến khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Artifact đã phát hành

### package-npm-pack-unavailable

Gói không thể được đóng gói thành artifact mà ClawHub sẽ kiểm tra hoặc
phát hành.

- Chạy `npm pack --dry-run` từ thư mục gốc của gói.
- Sửa siêu dữ liệu gói không hợp lệ, script vòng đời bị hỏng hoặc mục files khiến
  việc đóng gói thất bại.
- Xóa `private: true` nếu gói này được dự định phát hành công khai.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Gói có thể được đóng gói, nhưng artifact đã đóng gói không bao gồm các
tệp điểm vào được khai báo trong `package.json#openclaw`.

- Chạy `npm pack --dry-run` và kiểm tra các tệp sẽ được bao gồm.
- Build các điểm vào được tạo trước khi đóng gói.
- Cập nhật `files`, `.npmignore` hoặc đầu ra build để các điểm vào đã khai báo
  được bao gồm.
- Xem [Điểm vào Plugin](/vi/plugins/sdk-entrypoints).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Artifact đã đóng gói thiếu siêu dữ liệu OpenClaw đang tồn tại trong gói
nguồn của bạn.

- Chạy `npm pack --dry-run` và kiểm tra các tệp siêu dữ liệu được bao gồm.
- Đảm bảo `package.json` bao gồm khối `openclaw` trong artifact đã đóng gói.
- Đảm bảo `openclaw.plugin.json` được bao gồm khi gói là plugin
  OpenClaw native.
- Cập nhật `files` hoặc `.npmignore` để siêu dữ liệu gói không bị loại trừ.
- Xem [Xây dựng plugin](/vi/plugins/building-plugins).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Siêu dữ liệu manifest

### manifest-name-missing

Bản kê khai Plugin gốc không bao gồm tên hiển thị.

- Thêm trường `name` không rỗng vào `openclaw.plugin.json`.
- Giữ `name` dễ đọc với con người và giữ `id` làm mã định danh máy ổn định.
- Xem [bản kê khai Plugin](/vi/plugins/manifest).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Bản kê khai Plugin có các trường cấp cao nhất mà OpenClaw không hỗ trợ.

- So sánh từng trường cấp cao nhất với
  [tham chiếu trường bản kê khai](/vi/plugins/manifest#top-level-field-reference).
- Xóa các trường tùy chỉnh khỏi `openclaw.plugin.json`.
- Thay vào đó, chuyển siêu dữ liệu gói hoặc cài đặt vào các trường `package.json#openclaw`
  được hỗ trợ thay vì bản kê khai.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Bản kê khai khai báo các khóa không được hỗ trợ bên trong `contracts`.

- So sánh từng khóa trong `contracts` với
  [tham chiếu contracts](/vi/plugins/manifest#contracts-reference).
- Xóa các khóa contract không được hỗ trợ.
- Chuyển hành vi thời gian chạy vào mã đăng ký Plugin, và giữ `contracts`
  chỉ giới hạn ở siêu dữ liệu quyền sở hữu năng lực tĩnh.
- Chạy lại `clawhub package validate <path-to-plugin>`.

## SDK và di chuyển tương thích

### legacy-root-sdk-import

Plugin nhập từ barrel SDK gốc đã ngừng khuyến nghị:
`openclaw/plugin-sdk`.

- Thay thế các import barrel gốc bằng các import đường dẫn con công khai tập trung.
- Dùng `openclaw/plugin-sdk/plugin-entry` cho `definePluginEntry`.
- Dùng `openclaw/plugin-sdk/channel-core` cho các trình trợ giúp điểm vào kênh.
- Dùng [quy ước import](/vi/plugins/building-plugins#import-conventions) và
  [đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths) để tìm import hẹp.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin nhập một đường dẫn SDK dành riêng cho Plugin tích hợp sẵn hoặc
khả năng tương thích nội bộ.

- Thay thế các import SDK nội bộ OpenClaw dành riêng bằng các đường dẫn con
  `openclaw/plugin-sdk/*` công khai đã được tài liệu hóa.
- Nếu hành vi không có SDK công khai, giữ trình trợ giúp bên trong gói của bạn hoặc
  yêu cầu một API OpenClaw công khai.
- Dùng [đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths) và
  [di chuyển SDK](/vi/plugins/sdk-migration) để chọn một import được hỗ trợ.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin vẫn dùng trình trợ giúp toàn bộ session store đã ngừng khuyến nghị
`loadSessionStore`.

- Dùng `getSessionEntry(...)` hoặc `listSessionEntries(...)` khi đọc trạng thái phiên.
- Dùng `patchSessionEntry(...)` hoặc `upsertSessionEntry(...)` khi ghi trạng thái phiên.
- Tránh tải, thay đổi và lưu toàn bộ đối tượng session store.
- Chỉ giữ `loadSessionStore(...)` khi phạm vi tương thích đã khai báo của bạn
  vẫn hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu nó.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin vẫn dùng trình trợ giúp ghi toàn bộ session store đã ngừng khuyến nghị như
`saveSessionStore` hoặc `updateSessionStore`.

- Dùng `patchSessionEntry(...)` khi cập nhật các trường trên một mục phiên hiện có.
- Dùng `upsertSessionEntry(...)` khi thay thế hoặc tạo một mục phiên.
- Tránh tải, thay đổi và lưu toàn bộ đối tượng session store.
- Chỉ giữ các trình trợ giúp ghi toàn bộ store khi phạm vi tương thích đã khai báo của bạn
  vẫn hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu chúng.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin vẫn dùng các trình trợ giúp đường dẫn tệp phiên đã ngừng khuyến nghị như
`resolveSessionFilePath` hoặc `resolveAndPersistSessionFile`.

- Dùng `getSessionEntry(...)` để đọc siêu dữ liệu phiên theo danh tính tác tử và phiên.
- Dùng `patchSessionEntry(...)` hoặc `upsertSessionEntry(...)` để lưu siêu dữ liệu phiên.
- Dùng danh tính bản ghi hoặc trình trợ giúp đích khi mã đang chuẩn bị một
  thao tác bản ghi.
- Không lưu hoặc phụ thuộc vào các đường dẫn tệp bản ghi kế thừa.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin vẫn dùng trình trợ giúp đích tệp bản ghi đã ngừng khuyến nghị
`resolveSessionTranscriptLegacyFileTarget`.

- Dùng `resolveSessionTranscriptIdentity(...)` khi mã chỉ cần danh tính phiên công khai.
- Dùng `resolveSessionTranscriptTarget(...)` khi mã cần một đích thao tác bản ghi có cấu trúc.
- Tránh đọc hoặc xây dựng trực tiếp các đích tệp bản ghi kế thừa.
- Chỉ giữ trình trợ giúp kế thừa khi phạm vi tương thích đã khai báo của bạn vẫn
  hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu nó.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin vẫn dùng các trình trợ giúp bản ghi cấp thấp đã ngừng khuyến nghị như
`appendSessionTranscriptMessage` hoặc `emitSessionTranscriptUpdate`.

- Dùng `appendSessionTranscriptMessageByIdentity(...)` để thêm vào bản ghi.
- Dùng `publishSessionTranscriptUpdateByIdentity(...)` cho thông báo cập nhật bản ghi.
- Ưu tiên bề mặt thời gian chạy bản ghi có cấu trúc để OpenClaw có thể áp dụng
  đúng ranh giới giao dịch và xử lý danh tính.
- Chỉ giữ các trình trợ giúp bản ghi cấp thấp khi phạm vi tương thích đã khai báo của bạn
  vẫn hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu chúng.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin vẫn dùng hook `before_agent_start` kế thừa.

- Chuyển công việc ghi đè mô hình hoặc nhà cung cấp sang `before_model_resolve`.
- Chuyển công việc thay đổi prompt hoặc ngữ cảnh sang `before_prompt_build`.
- Chỉ giữ `before_agent_start` khi phạm vi tương thích đã khai báo của bạn vẫn
  hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu nó.
- Xem [Hooks](/vi/plugins/hooks) và
  [khả năng tương thích Plugin](/vi/plugins/compatibility).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Bản kê khai vẫn dùng siêu dữ liệu xác thực nhà cung cấp `providerAuthEnvVars` kế thừa.

- Phản chiếu siêu dữ liệu biến môi trường của nhà cung cấp vào `setup.providers[].envVars`.
- Chỉ giữ `providerAuthEnvVars` làm siêu dữ liệu tương thích khi phạm vi
  OpenClaw được hỗ trợ của bạn vẫn cần nó.
- Xem [tham chiếu setup](/vi/plugins/manifest#setup-reference) và
  [di chuyển SDK](/vi/plugins/sdk-migration).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Bản kê khai dùng siêu dữ liệu biến môi trường kênh kế thừa hoặc cũ hơn mà không có
siêu dữ liệu setup hoặc cấu hình hiện tại mà ClawHub mong đợi.

- Giữ siêu dữ liệu biến môi trường kênh ở dạng khai báo để OpenClaw có thể kiểm tra trạng thái setup
  mà không cần tải thời gian chạy kênh.
- Phản chiếu setup kênh dựa trên biến môi trường vào setup, cấu hình kênh hoặc
  siêu dữ liệu kênh gói hiện tại được hình dạng Plugin của bạn sử dụng.
- Chỉ giữ `channelEnvVars` làm siêu dữ liệu tương thích khi các phiên bản OpenClaw cũ hơn được hỗ trợ
  vẫn yêu cầu nó.
- Xem [bản kê khai Plugin](/vi/plugins/manifest) và
  [Plugin kênh](/vi/plugins/sdk-channel-plugins).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Bản kê khai bảo mật

### security-manifest-schema-unavailable

Gói đi kèm `openclaw.security.json` với một tham chiếu schema mà ClawHub
không nhận diện là có sẵn.

- Xóa URL schema nếu nó chỉ mang tính khuyến nghị.
- Chỉ dùng schema có phiên bản đã được tài liệu hóa sau khi OpenClaw xuất bản một schema.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Gói đi kèm một tệp bản kê khai bảo mật không được hỗ trợ.

- Xóa `openclaw.security.json` cho đến khi OpenClaw tài liệu hóa một schema bản kê khai bảo mật
  có phiên bản và hành vi ClawHub.
- Giữ hành vi nhạy cảm về bảo mật được tài liệu hóa trong tài liệu gói công khai hoặc
  README của bạn cho đến khi contract bản kê khai tồn tại.
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Liên quan

- [ClawHub CLI](/vi/clawhub/cli)
- [xuất bản ClawHub](/vi/clawhub/publishing)
- [xây dựng Plugin](/vi/plugins/building-plugins)
- [bản kê khai Plugin](/vi/plugins/manifest)
- [điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [khả năng tương thích Plugin](/vi/plugins/compatibility)
