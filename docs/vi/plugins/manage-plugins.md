---
doc-schema-version: 1
read_when:
    - Bạn muốn các ví dụ nhanh về liệt kê, cài đặt, cập nhật, kiểm tra hoặc gỡ cài đặt Plugin
    - Bạn muốn chọn một nguồn cài đặt Plugin
    - Bạn cần tài liệu tham khảo phù hợp để phát hành các gói Plugin
sidebarTitle: Manage plugins
summary: Ví dụ nhanh về cách liệt kê, cài đặt, cập nhật, kiểm tra và gỡ cài đặt các Plugin OpenClaw
title: Quản lý Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Sử dụng trang này cho các lệnh quản lý plugin phổ biến. Để xem hợp đồng lệnh,
cờ, quy tắc chọn nguồn và các trường hợp biên đầy đủ, hãy xem
[`openclaw plugins`](/vi/cli/plugins).

Hầu hết quy trình cài đặt là:

1. tìm một gói
2. cài đặt từ ClawHub, npm, git hoặc một đường dẫn cục bộ
3. để Gateway được quản lý tự động khởi động lại, hoặc khởi động lại thủ công khi không được quản lý
4. xác minh các đăng ký runtime của plugin

## Liệt kê và tìm kiếm plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Sử dụng `--json` cho script:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` là một kiểm tra kho lạnh. Nó hiển thị những gì OpenClaw có thể
phát hiện từ cấu hình, manifest và registry plugin; nó không chứng minh rằng một
Gateway đang chạy đã import runtime của plugin. Kết quả JSON bao gồm chẩn đoán
registry và `dependencyStatus` tĩnh của từng plugin khi gói plugin khai báo
`dependencies` hoặc `optionalDependencies`.

`plugins search` truy vấn ClawHub để tìm các gói plugin có thể cài đặt và in ra
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

## Cài đặt plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Đặc tả gói trần sẽ cài đặt từ npm trong giai đoạn chuyển đổi khởi chạy. Sử dụng
`clawhub:`, `npm:`, `git:` hoặc `npm-pack:` khi bạn cần chọn nguồn một cách xác
định. Nếu tên trần khớp với một id plugin chính thức, OpenClaw có thể cài đặt
trực tiếp mục trong danh mục.

Chỉ sử dụng `--force` khi bạn cố ý muốn ghi đè một đích cài đặt hiện có. Với
các nâng cấp thường lệ của các bản cài đặt npm, ClawHub hoặc hook-pack được theo
dõi, hãy sử dụng `openclaw plugins update`.

## Khởi động lại và kiểm tra

Sau khi cài đặt, cập nhật hoặc gỡ cài đặt mã plugin, một Gateway được quản lý
đang chạy có bật tải lại cấu hình sẽ tự động khởi động lại. Nếu Gateway không
được quản lý hoặc tính năng tải lại bị tắt, hãy tự khởi động lại trước khi kiểm
tra các bề mặt runtime trực tiếp:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Sử dụng `inspect --runtime` khi bạn cần bằng chứng rằng plugin đã đăng ký các bề
mặt runtime như công cụ, hook, dịch vụ, phương thức Gateway, route HTTP hoặc các
lệnh CLI do plugin sở hữu. `inspect` và `list` thông thường là các kiểm tra lạnh
về manifest, cấu hình và registry.

## Cập nhật plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Khi bạn truyền một id plugin, OpenClaw sử dụng lại đặc tả cài đặt được theo dõi.
Các dist-tag đã lưu như `@beta` và các phiên bản ghim chính xác tiếp tục được sử
dụng trong những lần chạy `update <plugin-id>` sau này.

`openclaw plugins update --all` là đường dẫn bảo trì hàng loạt. Nó vẫn tôn trọng
các đặc tả cài đặt được theo dõi thông thường, nhưng các bản ghi plugin OpenClaw
chính thức đáng tin cậy có thể đồng bộ với đích danh mục chính thức hiện tại thay
vì giữ nguyên một gói chính thức chính xác đã cũ. Nếu `update.channel` được đặt
thành `beta`, quá trình đồng bộ chính thức hàng loạt đó sử dụng ngữ cảnh kênh
beta. Sử dụng `update <plugin-id>` có đích danh khi bạn cố ý muốn giữ nguyên một
đặc tả chính thức chính xác hoặc có tag.

Đối với các bản cài đặt npm, bạn có thể truyền một đặc tả gói rõ ràng để chuyển
bản ghi được theo dõi:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Lệnh thứ hai đưa một plugin trở lại dòng phát hành mặc định của registry khi nó
trước đó đã được ghim vào một phiên bản hoặc tag chính xác.

Khi `openclaw update` chạy trên kênh beta, các bản ghi plugin có thể ưu tiên các
bản phát hành `@beta` khớp. Để biết quy tắc fallback và ghim chính xác, hãy xem
[`openclaw plugins`](/vi/cli/plugins#update).

## Gỡ cài đặt plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Gỡ cài đặt sẽ xóa mục cấu hình của plugin, bản ghi chỉ mục plugin đã lưu, các mục
danh sách cho phép/từ chối và các đường dẫn tải được liên kết khi áp dụng. Các
thư mục cài đặt được quản lý sẽ bị xóa trừ khi bạn truyền `--keep-files`. Một
Gateway được quản lý đang chạy sẽ tự động khởi động lại khi thao tác gỡ cài đặt
thay đổi nguồn plugin.

Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lệnh cài đặt, cập nhật, gỡ cài
đặt, bật và tắt plugin bị vô hiệu hóa. Thay vào đó, hãy quản lý các lựa chọn đó
trong nguồn Nix cho bản cài đặt.

## Chọn nguồn

| Nguồn       | Sử dụng khi                                                                  | Ví dụ                                                          |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Bạn muốn khả năng khám phá gốc OpenClaw, tóm tắt quét, phiên bản và gợi ý   | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Bạn đã phát hành gói JavaScript hoặc cần npm dist-tag/registry riêng        | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Bạn muốn một branch, tag hoặc commit từ một repository                      | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| đường dẫn cục bộ | Bạn đang phát triển hoặc kiểm thử một plugin trên cùng máy              | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Bạn đang chứng minh một artifact gói cục bộ qua ngữ nghĩa cài đặt npm       | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Bạn đang cài đặt một plugin marketplace tương thích với Claude              | `openclaw plugins install <plugin> --marketplace <source>`     |

Các bản cài đặt đường dẫn cục bộ được quản lý phải là thư mục plugin hoặc archive.
Đặt các tệp plugin độc lập trong `plugins.load.paths` thay vì cài đặt chúng bằng
`plugins install`.

## Phát hành plugin

ClawHub là bề mặt khám phá công khai chính cho các plugin OpenClaw. Hãy phát
hành ở đó khi bạn muốn người dùng tìm thấy metadata plugin, lịch sử phiên bản,
kết quả quét registry và gợi ý cài đặt trước khi họ cài đặt.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Các plugin npm native phải bao gồm manifest plugin và metadata gói trước khi phát
hành:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Sử dụng các trang này để xem hợp đồng phát hành đầy đủ thay vì xem trang này như
tài liệu tham chiếu phát hành:

- [Phát hành trên ClawHub](/vi/clawhub/publishing) giải thích về chủ sở hữu, phạm
  vi, bản phát hành, review, xác thực gói và chuyển giao gói.
- [Xây dựng plugin](/vi/plugins/building-plugins) cho biết hình dạng gói plugin và
  quy trình phát hành lần đầu.
- [Manifest Plugin](/vi/plugins/manifest) định nghĩa các trường manifest plugin native.

Nếu cùng một gói có sẵn trên cả ClawHub và npm, hãy sử dụng tiền tố rõ ràng
`clawhub:` hoặc `npm:` khi bạn cần bắt buộc dùng một nguồn.

## Liên quan

- [Plugins](/vi/tools/plugin) - cài đặt, cấu hình, khởi động lại và khắc phục sự cố
- [`openclaw plugins`](/vi/cli/plugins) - tài liệu tham chiếu CLI đầy đủ
- [Plugin cộng đồng](/vi/plugins/community) - khám phá công khai và phát hành trên ClawHub
- [ClawHub](/vi/clawhub/cli) - thao tác CLI registry
- [Xây dựng plugin](/vi/plugins/building-plugins) - tạo một gói plugin
- [Manifest Plugin](/vi/plugins/manifest) - manifest và metadata gói
