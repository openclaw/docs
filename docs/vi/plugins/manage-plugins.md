---
read_when:
    - Bạn muốn các ví dụ nhanh để cài đặt, liệt kê, cập nhật hoặc gỡ cài đặt Plugin
    - Bạn muốn chọn giữa ClawHub và phân phối Plugin qua npm
    - Bạn đang xuất bản một gói Plugin
sidebarTitle: Manage plugins
summary: Ví dụ nhanh về cách cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành các Plugin OpenClaw
title: Quản lý Plugin
x-i18n:
    generated_at: "2026-05-02T22:19:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Hầu hết quy trình Plugin chỉ gồm vài lệnh: tìm kiếm, cài đặt, khởi động lại Gateway,
xác minh, và gỡ cài đặt khi bạn không còn cần Plugin nữa.

## Liệt kê Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Dùng `--json` cho script. Nó bao gồm chẩn đoán registry và `dependencyStatus`
tĩnh của từng Plugin khi gói Plugin khai báo `dependencies` hoặc
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` là một kiểm tra kho lạnh. Nó hiển thị những gì OpenClaw có thể
phát hiện từ cấu hình, manifest và registry Plugin; nó không chứng minh rằng một
tiến trình Gateway đang chạy đã nhập runtime của Plugin.

## Cài đặt Plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Sau khi cài đặt mã Plugin, hãy khởi động lại Gateway phục vụ các kênh của bạn:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Dùng `inspect --runtime` khi bạn cần bằng chứng rằng Plugin đã đăng ký các bề
mặt runtime như công cụ, hook, dịch vụ, phương thức Gateway hoặc lệnh CLI do
Plugin sở hữu.

## Cập nhật Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Nếu một Plugin được cài đặt từ một dist-tag npm như `@beta`, các lần gọi
`update <plugin-id>` sau này sẽ dùng lại tag đã ghi đó. Truyền một spec npm tường
minh sẽ chuyển cài đặt được theo dõi sang spec đó cho các lần cập nhật trong
tương lai.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Lệnh thứ hai đưa một Plugin trở lại dòng phát hành mặc định của registry khi nó
trước đó đã được ghim vào một phiên bản hoặc tag chính xác.

Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm và ClawHub ở
dòng mặc định sẽ thử bản phát hành Plugin `@beta` tương ứng trước. Nếu bản phát
hành beta đó không tồn tại, OpenClaw sẽ quay về spec mặc định/mới nhất đã ghi.
Các phiên bản chính xác và tag tường minh như `@rc` hoặc `@beta` được giữ nguyên.

## Gỡ cài đặt Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Gỡ cài đặt sẽ xóa mục cấu hình của Plugin, bản ghi chỉ mục Plugin, các mục trong
danh sách cho phép/từ chối và các đường dẫn tải đã liên kết khi áp dụng. Các thư
mục cài đặt được quản lý sẽ bị xóa trừ khi bạn truyền `--keep-files`.

## Xuất bản Plugin

Bạn có thể xuất bản Plugin bên ngoài lên [ClawHub](https://clawhub.ai),
npmjs.com, hoặc cả hai.

### Xuất bản lên ClawHub

ClawHub là bề mặt khám phá công khai chính cho Plugin OpenClaw. Nó cung cấp cho
người dùng siêu dữ liệu có thể tìm kiếm, lịch sử phiên bản và kết quả quét
registry trước khi cài đặt.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Người dùng cài đặt từ ClawHub bằng:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Dạng không tiền tố vẫn kiểm tra ClawHub trước.

### Xuất bản lên npmjs.com

Plugin npm gốc phải bao gồm manifest Plugin và siêu dữ liệu entrypoint OpenClaw
trong `package.json`.

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
```

Người dùng cài đặt chỉ từ npm bằng:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Nếu cùng gói đó cũng có trên ClawHub, `npm:` sẽ bỏ qua tra cứu ClawHub và ép phân
giải bằng npm.

## Lựa chọn nguồn

- **ClawHub**: dùng khi bạn muốn khám phá gốc OpenClaw, tóm tắt quét, phiên bản
  và gợi ý cài đặt.
- **npmjs.com**: dùng khi bạn đã phân phối các gói JavaScript hoặc cần quy trình
  dist-tag npm/registry riêng tư.
- **Git**: dùng khi bạn muốn cài đặt trực tiếp từ một nhánh, tag hoặc commit.
- **Đường dẫn cục bộ**: dùng khi bạn đang phát triển hoặc kiểm thử một Plugin
  trên cùng máy.

## Liên quan

- [Plugin](/vi/tools/plugin) - tổng quan và khắc phục sự cố
- [`openclaw plugins`](/vi/cli/plugins) - tham chiếu CLI đầy đủ
- [ClawHub](/vi/tools/clawhub) - thao tác xuất bản và registry
- [Xây dựng Plugin](/vi/plugins/building-plugins) - tạo một gói Plugin
- [Manifest Plugin](/vi/plugins/manifest) - manifest và siêu dữ liệu gói
