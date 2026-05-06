---
read_when:
    - Bạn muốn các ví dụ nhanh về cách cài đặt, liệt kê, cập nhật hoặc gỡ cài đặt Plugin
    - Bạn muốn lựa chọn giữa việc phân phối Plugin qua ClawHub và npm
    - Bạn đang xuất bản một gói Plugin
sidebarTitle: Manage plugins
summary: Ví dụ nhanh về cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành các Plugin OpenClaw
title: Quản lý Plugin
x-i18n:
    generated_at: "2026-05-06T17:58:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Hầu hết quy trình làm việc với Plugin chỉ gồm vài lệnh: tìm kiếm, cài đặt, khởi động lại Gateway,
xác minh, và gỡ cài đặt khi bạn không còn cần Plugin đó nữa.

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

`plugins list` là bước kiểm tra kho mục cục bộ không khởi chạy runtime. Nó hiển thị những gì OpenClaw có thể phát hiện
từ cấu hình, manifest, và Plugin registry; nó không chứng minh rằng một tiến trình
Gateway đang chạy sẵn đã nhập runtime của Plugin.

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

Dùng `inspect --runtime` khi bạn cần bằng chứng rằng Plugin đã đăng ký các bề mặt
runtime như công cụ, hook, dịch vụ, phương thức Gateway, hoặc lệnh CLI
do Plugin sở hữu.

## Cập nhật Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Nếu một Plugin được cài đặt từ một npm dist-tag như `@beta`, các lần gọi
`update <plugin-id>` sau đó sẽ dùng lại tag đã ghi nhận đó. Truyền một npm spec rõ ràng
sẽ chuyển bản cài đặt được theo dõi sang spec đó cho các lần cập nhật sau.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Lệnh thứ hai đưa Plugin trở lại dòng phát hành mặc định của registry
khi trước đó nó được ghim vào một phiên bản hoặc tag chính xác.

Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm và ClawHub
thuộc dòng mặc định sẽ thử bản phát hành Plugin `@beta` tương ứng trước. Nếu bản phát hành beta đó
không tồn tại, OpenClaw sẽ quay về spec mặc định/mới nhất đã ghi nhận.
Đối với Plugin npm, OpenClaw cũng quay về khi gói beta tồn tại nhưng không vượt qua
xác thực cài đặt. Các phiên bản chính xác và tag rõ ràng như `@rc` hoặc `@beta`
được giữ nguyên.

## Gỡ cài đặt Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Gỡ cài đặt sẽ xóa mục cấu hình của Plugin, bản ghi chỉ mục Plugin, các mục trong danh sách cho phép/từ chối
và đường dẫn tải được liên kết khi áp dụng. Các thư mục cài đặt được quản lý sẽ
bị xóa trừ khi bạn truyền `--keep-files`.

Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lệnh cài đặt, cập nhật, gỡ cài đặt, bật
và tắt Plugin bị vô hiệu hóa. Thay vào đó, hãy quản lý các lựa chọn đó trong nguồn Nix của
bản cài đặt; với nix-openclaw, hãy dùng
[Khởi đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.

## Xuất bản Plugin

Bạn có thể xuất bản Plugin bên ngoài lên [ClawHub](https://clawhub.ai), npmjs.com, hoặc
cả hai.

### Xuất bản lên ClawHub

ClawHub là bề mặt khám phá công khai chính cho Plugin OpenClaw. Nó cung cấp cho
người dùng metadata có thể tìm kiếm, lịch sử phiên bản, và kết quả quét registry trước khi
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

Dạng không có tiền tố vẫn kiểm tra ClawHub trước.

### Xuất bản lên npmjs.com

Plugin npm native phải bao gồm một manifest Plugin và metadata điểm vào OpenClaw trong `package.json`.

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

Người dùng chỉ cài đặt npm bằng:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Nếu cùng gói đó cũng có trên ClawHub, `npm:` sẽ bỏ qua bước tra cứu ClawHub và
buộc phân giải qua npm.

## Lựa chọn nguồn

- **ClawHub**: dùng khi bạn muốn khám phá native cho OpenClaw, tóm tắt quét,
  phiên bản, và gợi ý cài đặt.
- **npmjs.com**: dùng khi bạn đã phân phối gói JavaScript hoặc cần các quy trình làm việc
  npm dist-tag/registry riêng.
- **Git**: dùng khi bạn muốn cài đặt trực tiếp từ một branch, tag, hoặc commit.
- **Đường dẫn cục bộ**: dùng khi bạn đang phát triển hoặc kiểm thử một Plugin trên cùng
  máy.

## Liên quan

- [Plugin](/vi/tools/plugin) - tổng quan và xử lý sự cố
- [`openclaw plugins`](/vi/cli/plugins) - tài liệu tham khảo CLI đầy đủ
- [ClawHub](/vi/tools/clawhub) - xuất bản và thao tác registry
- [Xây dựng Plugin](/vi/plugins/building-plugins) - tạo một gói Plugin
- [Manifest Plugin](/vi/plugins/manifest) - manifest và metadata gói
