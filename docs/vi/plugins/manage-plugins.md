---
read_when:
    - Bạn muốn các ví dụ nhanh về cài đặt, liệt kê, cập nhật hoặc gỡ cài đặt Plugin
    - Bạn muốn chọn giữa ClawHub và hình thức phân phối Plugin qua npm
    - Bạn đang phát hành một gói Plugin
sidebarTitle: Manage plugins
summary: Các ví dụ nhanh về cách cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành các Plugin OpenClaw
title: Quản lý Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Hầu hết quy trình làm việc với Plugin chỉ gồm vài lệnh: tìm kiếm, cài đặt, khởi động lại Gateway,
xác minh và gỡ cài đặt khi bạn không còn cần Plugin nữa.

## Liệt kê Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Dùng `--json` cho script. Cờ này bao gồm chẩn đoán registry và
`dependencyStatus` tĩnh của từng Plugin khi gói Plugin khai báo `dependencies` hoặc
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` là bước kiểm tra kho lạnh. Nó hiển thị những gì OpenClaw có thể phát hiện
từ cấu hình, manifest và registry Plugin; nó không chứng minh rằng một
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

Dùng `inspect --runtime` khi bạn cần bằng chứng rằng Plugin đã đăng ký các bề mặt
runtime như công cụ, hook, dịch vụ, phương thức Gateway hoặc lệnh CLI do Plugin sở hữu.

## Cập nhật Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Nếu một Plugin được cài đặt từ npm dist-tag như `@beta`, các lần gọi
`update <plugin-id>` sau đó sẽ dùng lại tag đã ghi đó. Truyền một npm spec rõ ràng
sẽ chuyển bản cài đặt được theo dõi sang spec đó cho các bản cập nhật trong tương lai.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Lệnh thứ hai đưa một Plugin trở lại dòng phát hành mặc định của registry
khi trước đó nó được ghim vào một phiên bản hoặc tag chính xác.

Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm và ClawHub
thuộc dòng mặc định sẽ thử bản phát hành Plugin `@beta` tương ứng trước. Nếu bản phát hành beta
đó không tồn tại, OpenClaw sẽ quay về spec mặc định/mới nhất đã ghi.
Với Plugin npm, OpenClaw cũng quay về khi gói beta tồn tại nhưng không vượt qua
xác thực cài đặt. Các phiên bản chính xác và tag rõ ràng như `@rc` hoặc `@beta`
được giữ nguyên.

## Gỡ cài đặt Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Gỡ cài đặt sẽ xóa mục cấu hình của Plugin, bản ghi chỉ mục Plugin, các mục
danh sách cho phép/từ chối và đường dẫn tải được liên kết khi áp dụng. Thư mục cài đặt được quản lý sẽ
bị xóa trừ khi bạn truyền `--keep-files`.

Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lệnh cài đặt, cập nhật, gỡ cài đặt, bật
và tắt Plugin bị vô hiệu hóa. Thay vào đó, hãy quản lý các lựa chọn đó trong nguồn Nix cho
bản cài đặt; với nix-openclaw, hãy dùng
[Khởi động nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.

## Phát hành Plugin

Bạn có thể phát hành Plugin bên ngoài lên [ClawHub](https://clawhub.ai), npmjs.com hoặc
cả hai.

### Phát hành lên ClawHub

ClawHub là bề mặt khám phá công khai chính cho Plugin OpenClaw. Nó cung cấp cho
người dùng metadata có thể tìm kiếm, lịch sử phiên bản và kết quả quét registry trước khi
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

Dạng rút gọn vẫn kiểm tra ClawHub trước.

### Phát hành lên npmjs.com

Plugin npm native phải bao gồm manifest Plugin và metadata entrypoint OpenClaw
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

Người dùng chỉ cài đặt npm bằng:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Nếu cùng gói đó cũng có trên ClawHub, `npm:` sẽ bỏ qua tra cứu ClawHub và
ép phân giải qua npm.

## Lựa chọn nguồn

- **ClawHub**: dùng khi bạn muốn khả năng khám phá native cho OpenClaw, bản tóm tắt quét,
  phiên bản và gợi ý cài đặt.
- **npmjs.com**: dùng khi bạn đã phát hành các gói JavaScript hoặc cần quy trình
  dist-tag/registry riêng của npm.
- **Git**: dùng khi bạn muốn cài đặt trực tiếp từ một nhánh, tag hoặc commit.
- **Đường dẫn cục bộ**: dùng khi bạn đang phát triển hoặc kiểm thử một Plugin trên cùng
  máy.

## Liên quan

- [Plugin](/vi/tools/plugin) - tổng quan và khắc phục sự cố
- [`openclaw plugins`](/vi/cli/plugins) - tài liệu tham khảo CLI đầy đủ
- [ClawHub](/vi/clawhub/cli) - thao tác phát hành và registry
- [Xây dựng Plugin](/vi/plugins/building-plugins) - tạo một gói Plugin
- [Manifest Plugin](/vi/plugins/manifest) - manifest và metadata gói
