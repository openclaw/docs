---
read_when:
    - Bạn đã chạy clawhub package validate và cần khắc phục các phát hiện về plugin
    - ClawHub đã từ chối hoặc cảnh báo khi phát hành gói plugin
    - Bạn đang cập nhật siêu dữ liệu gói Plugin trước khi phát hành
summary: Khắc phục các vấn đề được phát hiện khi xác thực gói plugin ClawHub trước khi phát hành
title: Các bản sửa lỗi xác thực Plugin
x-i18n:
    generated_at: "2026-07-19T05:45:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Cách khắc phục lỗi xác thực Plugin

ClawHub xác thực các gói Plugin trước khi phát hành và cũng có thể hiển thị các phát hiện từ
quá trình quét gói tự động. Trang này trình bày các phát hiện dành cho tác giả, tức là
những phát hiện mà tác giả Plugin có thể khắc phục trong siêu dữ liệu gói, tệp kê khai, các lệnh
nhập SDK hoặc thành phần phát hành của họ.

Trang này không đề cập đến các phát hiện về phạm vi kiểm tra nội bộ của Plugin Inspector. Nếu một báo cáo đầy đủ
chứa các mã bảo trì trình quét mà không có hướng dẫn khắc phục dành cho tác giả, thì
các mã đó dành cho những người bảo trì OpenClaw chứ không phải tác giả Plugin.

Sau khi áp dụng bất kỳ cách khắc phục nào, hãy chạy lại:

```bash
clawhub package validate <path-to-plugin>
```

## Các phát hiện dành cho tác giả

| Mã                                    | Bắt đầu tại đây                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Thêm siêu dữ liệu gói](/vi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Thêm khối openclaw của gói](/vi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Khai báo các điểm vào gói OpenClaw](/vi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Phát hành điểm vào đã khai báo](/vi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Hoàn thiện siêu dữ liệu cài đặt](/vi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Khai báo khả năng tương thích với API Plugin](/vi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Căn chỉnh phiên bản máy chủ tối thiểu](/vi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Căn chỉnh phiên bản gói và tệp kê khai](/vi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Xóa siêu dữ liệu gói OpenClaw không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Đảm bảo thành phần npm có thể được đóng gói](/vi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Đưa các điểm vào vào đầu ra đóng gói npm](/vi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Đưa siêu dữ liệu vào đầu ra đóng gói npm](/vi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Thêm tên hiển thị cho tệp kê khai](/vi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Xóa các trường tệp kê khai không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Xóa các khóa hợp đồng không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Thay thế các lệnh nhập SDK gốc](/vi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Xóa các lệnh nhập SDK dành riêng](/vi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Thay thế quyền truy cập toàn bộ kho phiên](/vi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Thay thế thao tác ghi toàn bộ kho phiên](/vi/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Thay thế các trình trợ giúp đường dẫn tệp phiên](/vi/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Thay thế các đích tệp bản chép lời cũ](/vi/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Thay thế các trình trợ giúp bản chép lời cấp thấp](/vi/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Thay thế before_agent_start](/vi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Di chuyển các biến môi trường của nhà cung cấp sang siêu dữ liệu thiết lập](/vi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Phản chiếu các biến môi trường của kênh trong siêu dữ liệu hiện tại](/vi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Xóa các tham chiếu lược đồ tệp kê khai bảo mật không khả dụng](/vi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Xóa các tệp kê khai bảo mật không được hỗ trợ](/vi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Siêu dữ liệu gói

### package-json-missing

Thư mục gốc của gói không chứa `package.json`, vì vậy ClawHub không thể xác định
gói npm, phiên bản, các điểm vào hoặc siêu dữ liệu OpenClaw.

- Thêm `package.json` với `name`, `version` và `type`.
- Thêm khối `openclaw` khi gói cung cấp một Plugin OpenClaw.
- Xem [Xây dựng Plugin](/vi/plugins/building-plugins) để biết ví dụ tối thiểu về gói
  và [Tệp kê khai Plugin](/vi/plugins/manifest#manifest-versus-packagejson)
  để biết cách phân chia giữa gói và tệp kê khai.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Gói có `package.json`, nhưng không khai báo siêu dữ liệu gói
OpenClaw.

- Thêm `package.json#openclaw`.
- Bao gồm siêu dữ liệu điểm vào như `openclaw.extensions` hoặc
  `openclaw.runtimeExtensions`.
- Thêm siêu dữ liệu về khả năng tương thích và cài đặt khi gói sẽ được phát hành hoặc
  cài đặt thông qua ClawHub.
- Xem [Các trường package.json ảnh hưởng đến việc khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Siêu dữ liệu gói tồn tại, nhưng không khai báo điểm vào thời gian chạy
OpenClaw.

- Thêm `openclaw.extensions` cho các điểm vào Plugin gốc.
- Thêm `openclaw.runtimeExtensions` khi gói đã phát hành cần tải JavaScript
  đã xây dựng.
- Giữ tất cả đường dẫn điểm vào bên trong thư mục gói.
- Xem [Các điểm vào Plugin](/vi/plugins/sdk-entrypoints) và
  [Các trường package.json ảnh hưởng đến việc khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Gói khai báo một điểm vào OpenClaw, nhưng tệp được tham chiếu không có
trong gói đang được xác thực.

- Kiểm tra từng đường dẫn trong `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` và `openclaw.runtimeSetupEntry`.
- Xây dựng gói nếu điểm vào được tạo trong `dist`.
- Cập nhật siêu dữ liệu nếu điểm vào đã được di chuyển.
- Xem [Các điểm vào Plugin](/vi/plugins/sdk-entrypoints).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub không thể xác định cách cài đặt hoặc cập nhật gói.

- Điền vào `openclaw.install` nguồn cài đặt được hỗ trợ, chẳng hạn như
  `clawhubSpec`, `npmSpec` hoặc `localPath`.
- Đặt `openclaw.install.defaultChoice` khi có nhiều hơn một nguồn cài đặt
  khả dụng.
- Dùng `openclaw.install.minHostVersion` cho phiên bản máy chủ OpenClaw tối thiểu.
- Xem [Các trường package.json ảnh hưởng đến việc khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Gói không khai báo phạm vi API Plugin OpenClaw mà gói hỗ trợ.

- Thêm `openclaw.compat.pluginApi` vào `package.json`.
- Dùng phiên bản API Plugin OpenClaw hoặc mức semver tối thiểu mà bạn đã dùng để xây dựng và kiểm thử.
- Giữ thông tin này tách biệt với phiên bản gói. Phiên bản gói mô tả bản phát hành
  Plugin; `openclaw.compat.pluginApi` mô tả hợp đồng API máy chủ.
- Xem [Các trường package.json ảnh hưởng đến việc khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Phiên bản máy chủ tối thiểu của gói không khớp với siêu dữ liệu phiên bản OpenClaw
mà gói được xây dựng dựa trên.

- Kiểm tra `openclaw.install.minHostVersion`.
- Kiểm tra mọi siêu dữ liệu bản dựng OpenClaw trong gói, chẳng hạn như phiên bản OpenClaw
  được dùng trong quá trình phát hành.
- Căn chỉnh phiên bản máy chủ tối thiểu với phạm vi phiên bản máy chủ mà gói
  thực sự hỗ trợ.
- Xem [Các trường package.json ảnh hưởng đến việc khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Phiên bản gói và phiên bản tệp kê khai Plugin không khớp.

- Ưu tiên `package.json#version` làm phiên bản phát hành gói.
- Nếu `openclaw.plugin.json` cũng có `version`, hãy cập nhật để khớp hoặc xóa
  siêu dữ liệu phiên bản tệp kê khai cũ khi siêu dữ liệu gói là nguồn có thẩm quyền.
- Phát hành phiên bản gói mới sau khi thay đổi siêu dữ liệu đã phát hành.
- Xem [Tệp kê khai Plugin](/vi/plugins/manifest).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Khối `package.json#openclaw` chứa các trường không phải là siêu dữ liệu gói
OpenClaw được hỗ trợ.

- Xóa các trường không được hỗ trợ như `openclaw.bundle`.
- Giữ siêu dữ liệu Plugin gốc trong `openclaw.plugin.json`.
- Giữ các điểm vào gói, siêu dữ liệu về khả năng tương thích, cài đặt, thiết lập và danh mục
  trong các trường `package.json#openclaw` được hỗ trợ.
- Xem [Các trường package.json ảnh hưởng đến việc khám phá](/vi/plugins/manifest#packagejson-fields-that-affect-discovery).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Thành phần đã phát hành

### package-npm-pack-unavailable

Không thể đóng gói gói thành thành phần mà ClawHub sẽ kiểm tra hoặc
phát hành.

- Chạy `npm pack --dry-run` từ thư mục gốc của gói.
- Khắc phục siêu dữ liệu gói không hợp lệ, các tập lệnh vòng đời bị lỗi hoặc các mục tệp
  khiến việc đóng gói thất bại.
- Xóa `private: true` nếu gói này được dùng để phát hành công khai.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Có thể đóng gói gói, nhưng thành phần đã đóng gói không chứa các
tệp điểm vào được khai báo trong `package.json#openclaw`.

- Chạy `npm pack --dry-run` và kiểm tra các tệp sẽ được đưa vào.
- Xây dựng các điểm vào được tạo trước khi đóng gói.
- Cập nhật `files`, `.npmignore` hoặc đầu ra bản dựng để các điểm vào đã khai báo được
  đưa vào.
- Xem [Các điểm vào Plugin](/vi/plugins/sdk-entrypoints).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Thành phần đã đóng gói thiếu siêu dữ liệu OpenClaw có trong gói
nguồn của bạn.

- Chạy `npm pack --dry-run` và kiểm tra các tệp siêu dữ liệu được bao gồm.
- Đảm bảo `package.json` bao gồm khối `openclaw` trong tạo tác đã đóng gói.
- Đảm bảo `openclaw.plugin.json` được bao gồm khi gói là một plugin OpenClaw
  gốc.
- Cập nhật `files` hoặc `.npmignore` để siêu dữ liệu gói không bị loại trừ.
- Xem [Xây dựng plugin](/vi/plugins/building-plugins).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Siêu dữ liệu manifest

### manifest-name-missing

Manifest của plugin gốc không bao gồm tên hiển thị.

- Thêm trường `name` không rỗng vào `openclaw.plugin.json`.
- Giữ `name` ở dạng con người có thể đọc được và giữ `id` làm mã định danh máy ổn định.
- Xem [Manifest plugin](/vi/plugins/manifest).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Manifest plugin có các trường cấp cao nhất mà OpenClaw không hỗ trợ.

- So sánh từng trường cấp cao nhất với
  [tài liệu tham chiếu trường manifest](/vi/plugins/manifest#top-level-field-reference).
- Xóa các trường tùy chỉnh khỏi `openclaw.plugin.json`.
- Thay vào đó, chuyển siêu dữ liệu gói hoặc cài đặt vào các trường `package.json#openclaw` được hỗ trợ
  thay vì manifest.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Manifest khai báo các khóa không được hỗ trợ bên trong `contracts`.

- So sánh từng khóa trong `contracts` với
  [tài liệu tham chiếu hợp đồng](/vi/plugins/manifest#contracts-reference).
- Xóa các khóa hợp đồng không được hỗ trợ.
- Chuyển hành vi thời gian chạy vào mã đăng ký plugin và giới hạn `contracts`
  ở siêu dữ liệu tĩnh về quyền sở hữu khả năng.
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Di chuyển SDK và khả năng tương thích

### legacy-root-sdk-import

Plugin nhập từ barrel SDK gốc đã ngừng dùng:
`openclaw/plugin-sdk`.

- Thay thế các lệnh nhập từ barrel gốc bằng các lệnh nhập đường dẫn con công khai có phạm vi cụ thể.
- Sử dụng `openclaw/plugin-sdk/plugin-entry` cho `definePluginEntry`.
- Sử dụng `openclaw/plugin-sdk/channel-core` cho các trình trợ giúp điểm vào kênh.
- Sử dụng [Quy ước nhập](/vi/plugins/building-plugins#import-conventions) và
  [Các đường dẫn con của SDK plugin](/vi/plugins/sdk-subpaths) để tìm lệnh nhập có phạm vi hẹp.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin nhập một đường dẫn SDK dành riêng cho các plugin đi kèm hoặc khả năng
tương thích nội bộ.

- Thay thế các lệnh nhập SDK nội bộ dành riêng của OpenClaw bằng các đường dẫn con
  `openclaw/plugin-sdk/*` công khai đã được ghi lại.
- Nếu hành vi không có SDK công khai, hãy giữ trình trợ giúp trong gói của bạn hoặc
  yêu cầu một API OpenClaw công khai.
- Sử dụng [Các đường dẫn con của SDK plugin](/vi/plugins/sdk-subpaths) và
  [Di chuyển SDK](/vi/plugins/sdk-migration) để chọn một lệnh nhập được hỗ trợ.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin vẫn sử dụng trình trợ giúp toàn bộ kho phiên đã ngừng dùng
`loadSessionStore`.

- Sử dụng `getSessionEntry(...)` hoặc `listSessionEntries(...)` khi đọc trạng thái
  phiên.
- Sử dụng `patchSessionEntry(...)` hoặc `upsertSessionEntry(...)` khi ghi trạng thái
  phiên.
- Tránh tải, sửa đổi và lưu toàn bộ đối tượng kho phiên.
- Chỉ giữ `loadSessionStore(...)` trong khi phạm vi tương thích đã khai báo của bạn
  vẫn hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu trình trợ giúp này.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [Các đường dẫn con của SDK plugin](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin vẫn sử dụng trình trợ giúp ghi toàn bộ kho phiên đã ngừng dùng, chẳng hạn như
`saveSessionStore` hoặc `updateSessionStore`.

- Sử dụng `patchSessionEntry(...)` khi cập nhật các trường trên một mục nhập phiên
  hiện có.
- Sử dụng `upsertSessionEntry(...)` khi thay thế hoặc tạo một mục nhập phiên.
- Tránh tải, sửa đổi và lưu toàn bộ đối tượng kho phiên.
- Chỉ giữ các trình trợ giúp ghi toàn bộ kho trong khi phạm vi tương thích đã khai báo của bạn
  vẫn hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu chúng.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [Các đường dẫn con của SDK plugin](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin vẫn sử dụng các trình trợ giúp đường dẫn tệp phiên đã ngừng dùng, chẳng hạn như
`resolveSessionFilePath` hoặc `resolveAndPersistSessionFile`.

- Sử dụng `getSessionEntry(...)` để đọc siêu dữ liệu phiên theo danh tính tác tử và phiên.
- Sử dụng `patchSessionEntry(...)` hoặc `upsertSessionEntry(...)` để lưu bền vững siêu dữ liệu
  phiên.
- Sử dụng các trình trợ giúp danh tính bản chép lời hoặc đích khi mã đang chuẩn bị một
  thao tác bản chép lời.
- Không lưu bền vững hoặc phụ thuộc vào các đường dẫn tệp bản chép lời cũ.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [Các đường dẫn con của SDK plugin](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin vẫn sử dụng trình trợ giúp đích tệp bản chép lời đã ngừng dùng
`resolveSessionTranscriptLegacyFileTarget`.

- Sử dụng `resolveSessionTranscriptIdentity(...)` khi mã chỉ cần danh tính
  phiên công khai.
- Sử dụng `resolveSessionTranscriptTarget(...)` khi mã cần một đích thao tác
  bản chép lời có cấu trúc.
- Tránh đọc hoặc trực tiếp tạo các đích tệp bản chép lời cũ.
- Chỉ giữ trình trợ giúp cũ trong khi phạm vi tương thích đã khai báo của bạn vẫn
  hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu trình trợ giúp này.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [Các đường dẫn con của SDK plugin](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin vẫn sử dụng các trình trợ giúp bản chép lời cấp thấp đã ngừng dùng, chẳng hạn như
`appendSessionTranscriptMessage` hoặc `emitSessionTranscriptUpdate`.

- Sử dụng `appendSessionTranscriptMessageByIdentity(...)` để nối thêm bản chép lời.
- Sử dụng `publishSessionTranscriptUpdateByIdentity(...)` cho các thông báo cập nhật
  bản chép lời.
- Ưu tiên bề mặt thời gian chạy bản chép lời có cấu trúc để OpenClaw có thể áp dụng
  đúng các ranh giới giao dịch và xử lý danh tính.
- Chỉ giữ các trình trợ giúp bản chép lời cấp thấp trong khi phạm vi tương thích đã khai báo của bạn
  vẫn hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu chúng.
- Xem [API thời gian chạy](/vi/plugins/sdk-runtime#agent-session-state) và
  [Các đường dẫn con của SDK plugin](/vi/plugins/sdk-subpaths).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin vẫn sử dụng hook `before_agent_start` cũ.

- Chuyển công việc ghi đè mô hình hoặc nhà cung cấp sang `before_model_resolve`.
- Chuyển công việc sửa đổi lời nhắc hoặc ngữ cảnh sang `before_prompt_build`.
- Chỉ giữ `before_agent_start` trong khi phạm vi tương thích đã khai báo của bạn vẫn
  hỗ trợ các phiên bản OpenClaw cũ hơn yêu cầu hook này.
- Xem [Hook](/vi/plugins/hooks) và
  [Khả năng tương thích của plugin](/vi/plugins/compatibility).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Manifest vẫn sử dụng siêu dữ liệu xác thực nhà cung cấp `providerAuthEnvVars` cũ.

- Phản chiếu siêu dữ liệu biến môi trường của nhà cung cấp vào `setup.providers[].envVars`.
- Chỉ giữ `providerAuthEnvVars` làm siêu dữ liệu tương thích trong khi phạm vi
  OpenClaw được hỗ trợ của bạn vẫn cần siêu dữ liệu này.
- Xem [tài liệu tham chiếu thiết lập](/vi/plugins/manifest#setup-reference) và
  [Di chuyển SDK](/vi/plugins/sdk-migration).
- Chạy lại `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Manifest sử dụng siêu dữ liệu biến môi trường kênh cũ hoặc phiên bản cũ mà không có
siêu dữ liệu thiết lập hoặc cấu hình hiện tại mà ClawHub mong đợi.

- Giữ siêu dữ liệu biến môi trường kênh ở dạng khai báo để OpenClaw có thể kiểm tra trạng thái thiết lập
  mà không tải thời gian chạy của kênh.
- Phản chiếu thiết lập kênh dựa trên môi trường vào thiết lập hiện tại, cấu hình kênh hoặc
  siêu dữ liệu kênh của gói được hình dạng plugin của bạn sử dụng.
- Chỉ giữ `channelEnvVars` làm siêu dữ liệu tương thích trong khi các phiên bản
  OpenClaw cũ hơn được hỗ trợ vẫn yêu cầu siêu dữ liệu này.
- Xem [Manifest plugin](/vi/plugins/manifest) và
  [Plugin kênh](/vi/plugins/sdk-channel-plugins).
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Manifest bảo mật

### security-manifest-schema-unavailable

Gói cung cấp `openclaw.security.json` với tham chiếu lược đồ mà ClawHub
không nhận diện là khả dụng.

- Xóa URL lược đồ nếu URL này chỉ mang tính tư vấn.
- Chỉ sử dụng lược đồ có phiên bản đã được ghi lại sau khi OpenClaw phát hành lược đồ đó.
- Chạy lại `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Gói cung cấp một tệp manifest bảo mật không được hỗ trợ.

- Xóa `openclaw.security.json` cho đến khi OpenClaw ghi lại một lược đồ manifest bảo mật
  có phiên bản và hành vi của ClawHub.
- Giữ hành vi nhạy cảm về bảo mật được ghi lại trong tài liệu công khai của gói hoặc
  README cho đến khi hợp đồng manifest tồn tại.
- Chạy lại `clawhub package validate <path-to-plugin>`.

## Liên quan

- [CLI ClawHub](/vi/clawhub/cli)
- [Phát hành lên ClawHub](/vi/clawhub/publishing)
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Manifest plugin](/vi/plugins/manifest)
- [Các điểm vào của plugin](/vi/plugins/sdk-entrypoints)
- [Khả năng tương thích của plugin](/vi/plugins/compatibility)
