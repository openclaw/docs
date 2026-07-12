---
read_when:
    - Bạn muốn nhiều agent biệt lập (không gian làm việc + định tuyến + xác thực)
summary: Tài liệu tham khảo CLI cho `openclaw agents` (liệt kê/thêm/xóa/liên kết/gắn liên kết/hủy liên kết/đặt danh tính)
title: Tác nhân
x-i18n:
    generated_at: "2026-07-12T07:46:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Quản lý các agent biệt lập (không gian làm việc + xác thực + định tuyến). Chạy `openclaw agents` mà không có lệnh con tương đương với `openclaw agents list`.

Liên quan:

- [Định tuyến đa agent](/vi/concepts/multi-agent)
- [Không gian làm việc của agent](/vi/concepts/agent-workspace)
- [Cấu hình Skills](/vi/tools/skills-config): cấu hình khả năng hiển thị của skill.

## Ví dụ

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Bề mặt lệnh

### `agents list`

Tùy chọn: `--json`, `--bindings` (bao gồm đầy đủ các quy tắc định tuyến, không chỉ số lượng/bản tóm tắt theo từng agent).

### `agents add [name]`

Tùy chọn: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (có thể lặp lại), `--non-interactive`, `--json`.

- Truyền bất kỳ cờ thêm agent tường minh nào sẽ chuyển lệnh sang luồng không tương tác.
- Chế độ không tương tác yêu cầu cả tên agent và `--workspace`.
- `main` được dành riêng và không thể dùng làm mã định danh agent mới.
- Chế độ tương tác khởi tạo thông tin xác thực bằng cách chỉ sao chép thông tin xác thực tĩnh có tính di động (các hồ sơ `api_key` và `token` tĩnh), trừ khi một thông tin xác thực từ chối bằng `copyToAgents: false`; các hồ sơ refresh token OAuth không được sao chép, trừ khi nhà cung cấp cho phép bằng `copyToAgents: true`. Khi không có bản sao, OAuth chỉ tiếp tục khả dụng thông qua kế thừa đọc xuyên từ kho agent `main` thực. Nếu agent mặc định đã cấu hình không phải là `main`, hãy đăng nhập riêng cho các hồ sơ OAuth trên agent mới.

### `agents bindings`

Tùy chọn: `--agent <id>`, `--json`.

### `agents bind`

Tùy chọn: `--agent <id>` (mặc định là agent mặc định hiện tại), `--bind <channel[:accountId]>` (có thể lặp lại), `--json`.

### `agents unbind`

Tùy chọn: `--agent <id>` (mặc định là agent mặc định hiện tại), `--bind <channel[:accountId]>` (có thể lặp lại), `--all`, `--json`. Chấp nhận `--all` hoặc một hay nhiều giá trị `--bind`, không chấp nhận đồng thời cả hai.

### `agents set-identity`

Tùy chọn: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Xem [Đặt danh tính](#set-identity) bên dưới.

### `agents delete <id>`

Tùy chọn: `--force`, `--json`.

- Không thể xóa `main`.
- Khi không có `--force`, cần xác nhận tương tác (sẽ thất bại trong phiên không có TTY; hãy chạy lại với `--force`).
- Các thư mục không gian làm việc, trạng thái agent và bản ghi phiên được chuyển vào Thùng rác, không bị xóa vĩnh viễn.
- Khi có thể kết nối với Gateway, thao tác xóa được định tuyến qua Gateway để việc dọn dẹp cấu hình và kho phiên dùng chung cùng một thành phần ghi với lưu lượng thời gian chạy. Nếu không thể kết nối với Gateway, CLI sẽ chuyển sang đường dẫn cục bộ ngoại tuyến.
- Nếu không gian làm việc của agent khác có cùng đường dẫn, nằm bên trong không gian làm việc này hoặc chứa không gian làm việc này, không gian làm việc sẽ được giữ lại và `--json` sẽ báo cáo `workspaceRetained`, `workspaceRetainedReason` và `workspaceSharedWith`.

## Liên kết định tuyến

Dùng các liên kết định tuyến để ghim lưu lượng kênh đến vào một agent cụ thể.

Nếu bạn cũng muốn mỗi agent có các skill hiển thị khác nhau, hãy cấu hình `agents.defaults.skills` và `agents.list[].skills` trong `openclaw.json`. Xem [Cấu hình Skills](/vi/tools/skills-config) và [Tham chiếu cấu hình](/vi/gateway/config-agents#agentsdefaultsskills).

Liệt kê các liên kết:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Thêm liên kết:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Bạn cũng có thể thêm liên kết khi tạo agent:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Nếu bạn bỏ qua `accountId` (`--bind <channel>`), OpenClaw sẽ phân giải giá trị này từ các hook thiết lập Plugin, liên kết tài khoản bắt buộc hoặc số lượng tài khoản đã cấu hình của kênh.

Nếu bạn bỏ qua `--agent` cho `bind` hoặc `unbind`, OpenClaw sẽ nhắm đến agent mặc định hiện tại.

### Định dạng `--bind`

| Định dạng                    | Ý nghĩa                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Khớp với tất cả tài khoản trên kênh.                                                                           |
| `--bind <channel>:<account>` | Khớp với một tài khoản.                                                                                        |
| `--bind <channel>`           | Chỉ khớp với tài khoản mặc định, trừ khi CLI có thể phân giải an toàn phạm vi tài khoản dành riêng cho Plugin. |

### Hành vi phạm vi liên kết

- Liên kết được lưu trữ không có `accountId` chỉ khớp với tài khoản mặc định của kênh.
- `accountId: "*"` là phương án dự phòng trên toàn kênh (tất cả tài khoản) và có độ đặc hiệu thấp hơn liên kết tài khoản tường minh.
- Nếu cùng một agent đã có liên kết kênh phù hợp không có `accountId`, sau đó bạn liên kết bằng `accountId` tường minh hoặc đã phân giải, OpenClaw sẽ nâng cấp liên kết hiện có tại chỗ thay vì thêm bản trùng lặp.

Ví dụ:

```bash
# khớp với tất cả tài khoản trên kênh
openclaw agents bind --agent work --bind telegram:*

# khớp với một tài khoản cụ thể
openclaw agents bind --agent work --bind telegram:ops

# liên kết ban đầu chỉ theo kênh
openclaw agents bind --agent work --bind telegram

# sau đó nâng cấp thành liên kết theo phạm vi tài khoản
openclaw agents bind --agent work --bind telegram:alerts
```

Sau khi nâng cấp, định tuyến cho liên kết đó được giới hạn trong `telegram:alerts`. Nếu bạn cũng muốn định tuyến cho tài khoản mặc định, hãy thêm tường minh (ví dụ: `--bind telegram:default`).

Xóa liên kết:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Tệp danh tính

Mỗi không gian làm việc của agent có thể chứa một tệp `IDENTITY.md` tại thư mục gốc của không gian làm việc:

- Đường dẫn ví dụ: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` đọc từ thư mục gốc của không gian làm việc (hoặc từ một `--identity-file` tường minh).

Đường dẫn ảnh đại diện được phân giải tương đối với thư mục gốc của không gian làm việc và không thể thoát ra ngoài, ngay cả thông qua liên kết tượng trưng.

## Đặt danh tính

`set-identity` ghi các trường vào `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (đường dẫn tương đối với không gian làm việc, URL http(s) hoặc URI dữ liệu).

- `--agent` hoặc `--workspace` chọn agent đích. Nếu `--workspace` khớp với nhiều hơn một agent, lệnh sẽ thất bại và yêu cầu bạn truyền `--agent`.
- Các tệp ảnh đại diện cục bộ có đường dẫn tương đối với không gian làm việc bị giới hạn ở 2 MB. URL HTTP(S) và URI `data:` không được kiểm tra theo giới hạn kích thước tệp cục bộ.
- Khi không cung cấp trường danh tính tường minh nào, lệnh sẽ đọc dữ liệu danh tính từ `IDENTITY.md`.

Tải từ `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Ghi đè tường minh các trường:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Mẫu cấu hình:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Định tuyến đa agent](/vi/concepts/multi-agent)
- [Không gian làm việc của agent](/vi/concepts/agent-workspace)
