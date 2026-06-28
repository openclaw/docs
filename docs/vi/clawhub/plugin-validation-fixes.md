---
read_when:
    - Bạn đã chạy clawhub package validate và cần sửa các phát hiện về plugin
    - ClawHub đã từ chối hoặc cảnh báo khi phát hành gói Plugin
    - Bạn đang cập nhật siêu dữ liệu gói Plugin trước khi phát hành
summary: Khắc phục các phát hiện xác thực gói Plugin ClawHub trước khi xuất bản
title: Các bản sửa lỗi xác thực Plugin
x-i18n:
    generated_at: "2026-06-28T05:07:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Bản sửa lỗi xác thực Plugin

ClawHub xác thực các gói Plugin trước khi phát hành và cũng có thể hiển thị các phát hiện từ
các lượt quét gói tự động. Trang này bao gồm các phát hiện dành cho tác giả, nghĩa là
các phát hiện mà tác giả Plugin có thể sửa trong siêu dữ liệu gói, manifest, các phần
import SDK, hoặc artifact đã phát hành của họ.

Trang này không bao gồm các phát hiện về phạm vi kiểm tra nội bộ của Plugin Inspector. Nếu một báo cáo đầy đủ
chứa các mã bảo trì bộ quét mà không có hướng dẫn khắc phục dành cho tác giả, thì các mã đó
dành cho người bảo trì OpenClaw thay vì tác giả Plugin.

Sau khi áp dụng bất kỳ bản sửa nào, chạy lại:

```bash
clawhub package validate <path-to-plugin>
```

## Phát hiện dành cho tác giả

| Mã                                      | Bắt đầu tại đây                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Thêm siêu dữ liệu gói](/vi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Thêm khối openclaw của gói](/vi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Khai báo các entrypoint của gói OpenClaw](/vi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Phát hành entrypoint đã khai báo](/vi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Hoàn thiện siêu dữ liệu cài đặt](/vi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Khai báo khả năng tương thích API Plugin](/vi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Căn chỉnh phiên bản host tối thiểu](/vi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Căn chỉnh phiên bản gói và manifest](/vi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Gỡ bỏ siêu dữ liệu gói OpenClaw không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Làm cho artifact npm có thể đóng gói](/vi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Bao gồm entrypoint trong đầu ra npm pack](/vi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Bao gồm siêu dữ liệu trong đầu ra npm pack](/vi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Thêm tên hiển thị cho manifest](/vi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Gỡ bỏ các trường manifest không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Gỡ bỏ các khóa contract không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Thay thế các import SDK gốc](/vi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Gỡ bỏ các import SDK dành riêng](/vi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Thay thế quyền truy cập toàn bộ session store](/vi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [Thay thế before_agent_start](/vi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Chuyển biến môi trường của provider vào siêu dữ liệu thiết lập](/vi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Phản chiếu biến môi trường của kênh trong siêu dữ liệu hiện tại](/vi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Gỡ bỏ các tham chiếu schema manifest bảo mật không khả dụng](/vi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Gỡ bỏ các tệp manifest bảo mật không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Siêu dữ liệu gói

### package-json-missing

Thư mục gốc của gói không bao gồm `package.json`, nên ClawHub không thể xác định
gói npm, phiên bản, entrypoint, hoặc siêu dữ liệu OpenClaw.

- Thêm `package.json` với `name`, `version`, và `type`.
- Thêm khối `openclaw` khi gói phân phối một Plugin OpenClaw.
- Sử dụng [Xây dựng Plugin](/vi/plugins/building-plugins) để xem ví dụ gói tối thiểu
  và [manifest Plugin](/vi/plugins/manifest#manifest-versus-packagejson)
  để hiểu cách tách gói và manifest.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Gói có `package.json`, nhưng không khai báo siêu dữ liệu gói OpenClaw.

- Thêm `package.json#openclaw`.
- Bao gồm siêu dữ liệu entrypoint như `openclaw.extensions` hoặc
  `openclaw.runtimeExtensions`.
- Thêm siêu dữ liệu tương thích và cài đặt khi gói sẽ được phát hành hoặc
  cài đặt thông qua ClawHub.
- Xem [các trường package.json ảnh hưởng đến discovery](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Siêu dữ liệu gói tồn tại, nhưng không khai báo entrypoint runtime OpenClaw.

- Thêm `openclaw.extensions` cho các entrypoint Plugin gốc.
- Thêm `openclaw.runtimeExtensions` khi gói đã phát hành cần tải JavaScript
  đã build.
- Giữ tất cả đường dẫn entrypoint bên trong thư mục gói.
- Xem [Điểm vào Plugin](/vi/plugins/sdk-entrypoints) và
  [các trường package.json ảnh hưởng đến discovery](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Gói khai báo một entrypoint OpenClaw, nhưng tệp được tham chiếu bị thiếu
trong gói đang được xác thực.

- Kiểm tra từng đường dẫn trong `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry`, và `openclaw.runtimeSetupEntry`.
- Build gói nếu entrypoint được tạo vào `dist`.
- Cập nhật siêu dữ liệu nếu entrypoint đã được di chuyển.
- Xem [Điểm vào Plugin](/vi/plugins/sdk-entrypoints).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub không thể biết gói nên được cài đặt hoặc cập nhật như thế nào.

- Điền `openclaw.install` bằng nguồn cài đặt được hỗ trợ, chẳng hạn như
  `clawhubSpec`, `npmSpec`, hoặc `localPath`.
- Đặt `openclaw.install.defaultChoice` khi có nhiều hơn một nguồn cài đặt
  khả dụng.
- Sử dụng `openclaw.install.minHostVersion` cho phiên bản host OpenClaw tối thiểu.
- Xem [các trường package.json ảnh hưởng đến discovery](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Gói không khai báo phạm vi API Plugin OpenClaw mà nó hỗ trợ.

- Thêm `openclaw.compat.pluginApi` vào `package.json`.
- Sử dụng phiên bản API Plugin OpenClaw hoặc ngưỡng semver mà bạn đã build và kiểm thử
  dựa trên đó.
- Giữ phần này tách biệt với phiên bản gói. Phiên bản gói mô tả
  bản phát hành Plugin; `openclaw.compat.pluginApi` mô tả contract API host.
- Xem [các trường package.json ảnh hưởng đến discovery](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Phiên bản host tối thiểu của gói không khớp với siêu dữ liệu phiên bản OpenClaw
mà gói đã được build dựa trên đó.

- Kiểm tra `openclaw.install.minHostVersion`.
- Kiểm tra mọi siêu dữ liệu build OpenClaw trong gói, chẳng hạn như phiên bản OpenClaw
  được sử dụng trong quá trình phát hành.
- Căn chỉnh phiên bản host tối thiểu với phạm vi phiên bản host mà gói
  thực sự hỗ trợ.
- Xem [các trường package.json ảnh hưởng đến discovery](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Phiên bản gói và phiên bản manifest Plugin không khớp.

- Ưu tiên `package.json#version` làm phiên bản phát hành gói.
- Nếu `openclaw.plugin.json` cũng có `version`, hãy cập nhật để khớp hoặc gỡ bỏ
  siêu dữ liệu phiên bản manifest đã cũ khi siêu dữ liệu gói là nguồn có thẩm quyền.
- Phát hành phiên bản gói mới sau khi thay đổi siêu dữ liệu đã phát hành.
- Xem [manifest Plugin](/vi/plugins/manifest).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Khối `package.json#openclaw` chứa các trường không phải là siêu dữ liệu gói
OpenClaw được hỗ trợ.

- Gỡ bỏ các trường không được hỗ trợ như `openclaw.bundle`.
- Giữ siêu dữ liệu Plugin gốc trong `openclaw.plugin.json`.
- Giữ entrypoint gói, khả năng tương thích, cài đặt, thiết lập, và siêu dữ liệu catalog
  trong các trường `package.json#openclaw` được hỗ trợ.
- Xem [các trường package.json ảnh hưởng đến discovery](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Artifact đã phát hành

### package-npm-pack-unavailable

Gói không thể được đóng gói thành artifact mà ClawHub sẽ kiểm tra hoặc
phát hành.

- Chạy `npm pack --dry-run` từ thư mục gốc của gói.
- Sửa siêu dữ liệu gói không hợp lệ, script lifecycle bị hỏng, hoặc các mục files khiến
  việc đóng gói thất bại.
- Gỡ bỏ `private: true` nếu gói này dự định được phát hành công khai.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Gói có thể được đóng gói, nhưng artifact đã đóng gói không bao gồm các tệp
entrypoint được khai báo trong `package.json#openclaw`.

- Chạy `npm pack --dry-run` và kiểm tra các tệp sẽ được bao gồm.
- Build các entrypoint được tạo trước khi đóng gói.
- Cập nhật `files`, `.npmignore`, hoặc đầu ra build để các entrypoint đã khai báo được
  bao gồm.
- Xem [Điểm vào Plugin](/vi/plugins/sdk-entrypoints).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Artifact đã đóng gói bị thiếu siêu dữ liệu OpenClaw tồn tại trong gói
nguồn của bạn.

- Chạy `npm pack --dry-run` và kiểm tra các tệp siêu dữ liệu được bao gồm.
- Đảm bảo `package.json` bao gồm khối `openclaw` trong artifact đã đóng gói.
- Đảm bảo `openclaw.plugin.json` được bao gồm khi gói là Plugin OpenClaw
  gốc.
- Cập nhật `files` hoặc `.npmignore` để siêu dữ liệu gói không bị loại trừ.
- Xem [Xây dựng Plugin](/vi/plugins/building-plugins).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Siêu dữ liệu manifest

### manifest-name-missing

Manifest Plugin gốc không bao gồm tên hiển thị.

- Thêm trường `name` không trống vào `openclaw.plugin.json`.
- Giữ `name` dễ đọc cho con người và giữ `id` làm mã định danh máy ổn định.
- Xem [manifest Plugin](/vi/plugins/manifest).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Manifest Plugin có các trường cấp cao nhất mà OpenClaw không hỗ trợ.

- So sánh từng trường cấp cao nhất với
  [tham chiếu trường manifest](/vi/plugins/manifest#top-level-field-reference).
- Xóa các trường tùy chỉnh khỏi `openclaw.plugin.json`.
- Thay vào đó, chuyển metadata gói hoặc cài đặt vào các trường `package.json#openclaw`
  được hỗ trợ thay vì manifest.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Manifest khai báo các khóa không được hỗ trợ bên trong `contracts`.

- So sánh từng khóa trong `contracts` với
  [tham chiếu contracts](/vi/plugins/manifest#contracts-reference).
- Xóa các khóa contract không được hỗ trợ.
- Chuyển hành vi runtime vào mã đăng ký Plugin, và giữ `contracts`
  chỉ giới hạn ở metadata quyền sở hữu capability tĩnh.
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Di chuyển SDK và khả năng tương thích

### legacy-root-sdk-import

Plugin nhập từ barrel SDK gốc đã bị ngừng dùng:
`openclaw/plugin-sdk`.

- Thay thế các import barrel gốc bằng các import subpath công khai tập trung.
- Dùng `openclaw/plugin-sdk/plugin-entry` cho `definePluginEntry`.
- Dùng `openclaw/plugin-sdk/channel-core` cho các helper entry kênh.
- Dùng [quy ước import](/vi/plugins/building-plugins#import-conventions) và
  [subpath Plugin SDK](/vi/plugins/sdk-subpaths) để tìm import hẹp.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin nhập một đường dẫn SDK dành riêng cho các Plugin được đóng gói kèm hoặc
khả năng tương thích nội bộ.

- Thay thế các import SDK nội bộ OpenClaw dành riêng bằng các subpath
  `openclaw/plugin-sdk/*` công khai đã được ghi tài liệu.
- Nếu hành vi không có SDK công khai, hãy giữ helper bên trong gói của bạn hoặc
  yêu cầu một API OpenClaw công khai.
- Dùng [subpath Plugin SDK](/vi/plugins/sdk-subpaths) và
  [di chuyển SDK](/vi/plugins/sdk-migration) để chọn một import được hỗ trợ.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin vẫn dùng helper toàn bộ session store đã bị ngừng dùng
`loadSessionStore`.

- Dùng `getSessionEntry(...)` hoặc `listSessionEntries(...)` khi đọc trạng thái
  phiên.
- Dùng `patchSessionEntry(...)` hoặc `upsertSessionEntry(...)` khi ghi trạng thái
  phiên.
- Tránh tải, sửa đổi và lưu toàn bộ đối tượng session store.
- Chỉ giữ `loadSessionStore(...)` trong khi phạm vi tương thích đã khai báo của bạn
  vẫn hỗ trợ các phiên bản OpenClaw cũ hơn cần đến nó.
- Xem [API runtime](/vi/plugins/sdk-runtime#agent-session-state) và
  [subpath Plugin SDK](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin vẫn dùng hook kế thừa `before_agent_start`.

- Chuyển công việc ghi đè model hoặc provider sang `before_model_resolve`.
- Chuyển công việc sửa đổi prompt hoặc context sang `before_prompt_build`.
- Chỉ giữ `before_agent_start` trong khi phạm vi tương thích đã khai báo của bạn vẫn
  hỗ trợ các phiên bản OpenClaw cũ hơn cần đến nó.
- Xem [Hooks](/vi/plugins/hooks) và
  [khả năng tương thích Plugin](/vi/plugins/compatibility).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Manifest vẫn dùng metadata xác thực provider kế thừa `providerAuthEnvVars`.

- Phản chiếu metadata env-var của provider vào `setup.providers[].envVars`.
- Chỉ giữ `providerAuthEnvVars` làm metadata tương thích trong khi phạm vi
  OpenClaw được hỗ trợ của bạn vẫn cần đến nó.
- Xem [tham chiếu setup](/vi/plugins/manifest#setup-reference) và
  [di chuyển SDK](/vi/plugins/sdk-migration).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Manifest dùng metadata env-var kênh kế thừa hoặc cũ hơn mà không có metadata
setup hoặc config hiện tại mà ClawHub mong đợi.

- Giữ metadata env-var kênh ở dạng khai báo để OpenClaw có thể kiểm tra trạng thái
  setup mà không cần tải runtime kênh.
- Phản chiếu setup kênh dựa trên env vào setup hiện tại, config kênh hoặc
  metadata kênh của gói mà hình dạng Plugin của bạn sử dụng.
- Chỉ giữ `channelEnvVars` làm metadata tương thích trong khi các phiên bản
  OpenClaw cũ hơn được hỗ trợ vẫn cần đến nó.
- Xem [manifest Plugin](/vi/plugins/manifest) và
  [Plugin kênh](/vi/plugins/sdk-channel-plugins).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Manifest bảo mật

### security-manifest-schema-unavailable

Gói phát hành `openclaw.security.json` với tham chiếu schema mà ClawHub
không nhận diện là có sẵn.

- Xóa URL schema nếu nó chỉ mang tính khuyến nghị.
- Chỉ dùng schema có phiên bản đã được ghi tài liệu sau khi OpenClaw phát hành schema đó.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Gói phát hành một tệp manifest bảo mật không được hỗ trợ.

- Xóa `openclaw.security.json` cho đến khi OpenClaw ghi tài liệu một schema manifest
  bảo mật có phiên bản và hành vi ClawHub.
- Giữ hành vi nhạy cảm về bảo mật được ghi tài liệu trong tài liệu gói công khai hoặc
  README của bạn cho đến khi contract manifest tồn tại.
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Liên quan

- [ClawHub CLI](/vi/clawhub/cli)
- [Phát hành ClawHub](/vi/clawhub/publishing)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Manifest Plugin](/vi/plugins/manifest)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Khả năng tương thích Plugin](/vi/plugins/compatibility)
