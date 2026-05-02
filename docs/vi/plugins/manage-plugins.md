---
read_when:
    - Bạn muốn ví dụ nhanh về cài đặt, liệt kê, cập nhật hoặc gỡ cài đặt Plugin
    - Bạn muốn lựa chọn giữa ClawHub và phân phối Plugin qua npm
    - Bạn đang xuất bản một gói Plugin
sidebarTitle: Manage plugins
summary: Ví dụ nhanh về cách cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành các Plugin OpenClaw
title: Quản lý Plugin
x-i18n:
    generated_at: "2026-05-02T20:46:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Hầu hết quy trình làm việc với plugin chỉ gồm vài lệnh: tìm kiếm, cài đặt, khởi động lại Gateway,
xác minh, và gỡ cài đặt khi bạn không còn cần plugin nữa.

## Liệt kê plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Dùng `--json` cho script. Nó bao gồm chẩn đoán registry và
`dependencyStatus` tĩnh của từng plugin khi gói plugin khai báo `dependencies` hoặc
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` là kiểm tra kiểm kê nguội. Nó hiển thị những gì OpenClaw có thể phát hiện
từ cấu hình, manifest và registry plugin; nó không chứng minh rằng một
tiến trình Gateway đang chạy đã nhập runtime của plugin.

## Cài đặt plugin

```bash
# Tìm ClawHub để lấy các gói plugin.
openclaw plugins search "calendar"

# Đặc tả gói trần thử ClawHub trước, sau đó fallback sang npm.
openclaw plugins install <package>

# Buộc dùng một nguồn.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Cài đặt một phiên bản hoặc dist-tag cụ thể.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex@beta

# Cài đặt từ git hoặc một checkout phát triển cục bộ.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Sau khi cài đặt mã plugin, hãy khởi động lại Gateway phục vụ các kênh của bạn:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Dùng `inspect --runtime` khi bạn cần bằng chứng rằng plugin đã đăng ký các bề mặt
runtime như công cụ, hook, dịch vụ, phương thức Gateway hoặc lệnh CLI
do plugin sở hữu.

## Cập nhật plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Nếu một plugin được cài đặt từ npm dist-tag như `@beta`, các lệnh
`update <plugin-id>` sau này sẽ dùng lại tag đã ghi đó. Truyền một đặc tả npm rõ ràng
sẽ chuyển bản cài đặt được theo dõi sang đặc tả đó cho các lần cập nhật trong tương lai.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Lệnh thứ hai đưa plugin trở lại dòng phát hành mặc định của registry
khi trước đó nó đã bị ghim vào một phiên bản hoặc tag chính xác.

Khi `openclaw update` chạy trên kênh beta, các bản ghi plugin npm dòng mặc định và ClawHub
sẽ thử bản phát hành `@beta` tương ứng của plugin trước. Nếu bản phát hành beta đó
không tồn tại, OpenClaw sẽ fallback về đặc tả mặc định/latest đã ghi.
Các phiên bản chính xác và tag rõ ràng như `@rc` hoặc `@beta` được giữ nguyên.

## Gỡ cài đặt plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Gỡ cài đặt sẽ xóa mục cấu hình của plugin, bản ghi chỉ mục plugin, các mục danh sách
cho phép/từ chối và đường dẫn tải được liên kết khi áp dụng. Các thư mục cài đặt được quản lý sẽ
bị xóa trừ khi bạn truyền `--keep-files`.

## Xuất bản plugin

Bạn có thể xuất bản plugin bên ngoài lên [ClawHub](https://clawhub.ai), npmjs.com hoặc
cả hai.

### Xuất bản lên ClawHub

ClawHub là bề mặt khám phá công khai chính cho các plugin OpenClaw. Nó cung cấp
cho người dùng metadata có thể tìm kiếm, lịch sử phiên bản và kết quả quét registry trước khi
cài đặt.

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

Dạng trần vẫn kiểm tra ClawHub trước.

### Xuất bản lên npmjs.com

Plugin npm nguyên bản phải bao gồm manifest plugin và metadata entrypoint OpenClaw trong `package.json`.

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

Nếu cùng gói đó cũng có trên ClawHub, `npm:` sẽ bỏ qua tra cứu ClawHub và
buộc phân giải qua npm.

## Chọn nguồn

- **ClawHub**: dùng khi bạn muốn khả năng khám phá gốc OpenClaw, tóm tắt quét,
  phiên bản và gợi ý cài đặt.
- **npmjs.com**: dùng khi bạn đã phát hành các gói JavaScript hoặc cần quy trình làm việc
  dist-tag/registry riêng của npm.
- **Git**: dùng khi bạn muốn cài đặt trực tiếp từ một branch, tag hoặc commit.
- **Đường dẫn cục bộ**: dùng khi bạn đang phát triển hoặc kiểm thử plugin trên cùng
  máy.

## Liên quan

- [Plugin](/vi/tools/plugin) - tổng quan và khắc phục sự cố
- [`openclaw plugins`](/vi/cli/plugins) - tài liệu tham khảo CLI đầy đủ
- [ClawHub](/vi/tools/clawhub) - xuất bản và thao tác registry
- [Xây dựng plugin](/vi/plugins/building-plugins) - tạo một gói plugin
- [Manifest plugin](/vi/plugins/manifest) - manifest và metadata gói
