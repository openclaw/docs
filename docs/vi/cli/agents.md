---
read_when:
    - Bạn muốn nhiều tác nhân được cô lập (không gian làm việc + định tuyến + xác thực)
summary: Tài liệu tham khảo CLI cho `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Tác nhân
x-i18n:
    generated_at: "2026-06-27T17:16:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Quản lý các tác nhân cô lập (không gian làm việc + xác thực + định tuyến).

Liên quan:

- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- [Cấu hình Skills](/vi/tools/skills-config): cấu hình khả năng hiển thị Skills.

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

## Ràng buộc định tuyến

Dùng ràng buộc định tuyến để ghim lưu lượng kênh đi vào với một tác nhân cụ thể.

Nếu bạn cũng muốn Skills hiển thị khác nhau cho từng tác nhân, hãy cấu hình `agents.defaults.skills` và `agents.list[].skills` trong `openclaw.json`. Xem [Cấu hình Skills](/vi/tools/skills-config) và [Tham chiếu cấu hình](/vi/gateway/config-agents#agents-defaults-skills).

Liệt kê ràng buộc:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Thêm ràng buộc:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Bạn cũng có thể thêm ràng buộc khi tạo tác nhân:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Nếu bạn bỏ qua `accountId` (`--bind <channel>`), OpenClaw sẽ phân giải giá trị đó từ các hook thiết lập Plugin, ràng buộc tài khoản bắt buộc, hoặc số lượng tài khoản đã cấu hình của kênh.

Nếu bạn bỏ qua `--agent` cho `bind` hoặc `unbind`, OpenClaw sẽ nhắm đến tác nhân mặc định hiện tại.

### Định dạng `--bind`

| Định dạng                    | Ý nghĩa                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Khớp tất cả tài khoản trên kênh.                                                                  |
| `--bind <channel>:<account>` | Khớp một tài khoản.                                                                               |
| `--bind <channel>`           | Chỉ khớp tài khoản mặc định, trừ khi CLI có thể phân giải an toàn phạm vi tài khoản riêng của Plugin. |

### Hành vi phạm vi ràng buộc

- Một ràng buộc đã lưu không có `accountId` chỉ khớp tài khoản mặc định của kênh.
- `accountId: "*"` là phương án dự phòng trên toàn kênh (tất cả tài khoản) và kém cụ thể hơn một ràng buộc tài khoản rõ ràng.
- Nếu cùng tác nhân đã có ràng buộc kênh khớp mà không có `accountId`, rồi sau đó bạn ràng buộc bằng một `accountId` rõ ràng hoặc đã được phân giải, OpenClaw sẽ nâng cấp ràng buộc hiện có đó tại chỗ thay vì thêm bản trùng lặp.

Ví dụ:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Sau khi nâng cấp, định tuyến cho ràng buộc đó được giới hạn trong phạm vi `telegram:alerts`. Nếu bạn cũng muốn định tuyến tài khoản mặc định, hãy thêm rõ ràng (ví dụ `--bind telegram:default`).

Gỡ ràng buộc:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` chấp nhận `--all` hoặc một hay nhiều giá trị `--bind`, không chấp nhận cả hai cùng lúc.

## Bề mặt lệnh

### `agents`

Chạy `openclaw agents` mà không có lệnh con tương đương với `openclaw agents list`.

### `agents list`

Tùy chọn:

- `--json`
- `--bindings`: bao gồm đầy đủ quy tắc định tuyến, không chỉ số đếm/tóm tắt theo từng tác nhân

### `agents add [name]`

Tùy chọn:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (có thể lặp lại)
- `--non-interactive`
- `--json`

Ghi chú:

- Truyền bất kỳ cờ thêm rõ ràng nào sẽ chuyển lệnh sang đường dẫn không tương tác.
- Chế độ không tương tác yêu cầu cả tên tác nhân và `--workspace`.
- `main` được dành riêng và không thể dùng làm id tác nhân mới.
- Trong chế độ tương tác, việc gieo xác thực chỉ sao chép các hồ sơ tĩnh có tính di động
  (`api_key` và `token` tĩnh theo mặc định). Các hồ sơ OAuth refresh-token vẫn chỉ
  khả dụng thông qua kế thừa đọc xuyên từ kho tác nhân `main` thực.
  Nếu tác nhân mặc định đã cấu hình không phải là `main`, hãy đăng nhập riêng cho các
  hồ sơ OAuth trên tác nhân mới.

### `agents bindings`

Tùy chọn:

- `--agent <id>`
- `--json`

### `agents bind`

Tùy chọn:

- `--agent <id>` (mặc định là tác nhân mặc định hiện tại)
- `--bind <channel[:accountId]>` (có thể lặp lại)
- `--json`

### `agents unbind`

Tùy chọn:

- `--agent <id>` (mặc định là tác nhân mặc định hiện tại)
- `--bind <channel[:accountId]>` (có thể lặp lại)
- `--all`
- `--json`

### `agents delete <id>`

Tùy chọn:

- `--force`
- `--json`

Ghi chú:

- Không thể xóa `main`.
- Nếu không có `--force`, cần xác nhận tương tác.
- Các thư mục không gian làm việc, trạng thái tác nhân và bản ghi phiên được chuyển vào Thùng rác, không bị xóa vĩnh viễn.
- Khi có thể truy cập Gateway, thao tác xóa được gửi qua Gateway để việc dọn dẹp cấu hình và kho phiên dùng cùng trình ghi như lưu lượng thời gian chạy. Nếu không thể truy cập Gateway, CLI sẽ quay về đường dẫn cục bộ ngoại tuyến.
- Nếu không gian làm việc của tác nhân khác trùng đường dẫn, nằm bên trong không gian làm việc này, hoặc chứa không gian làm việc này,
  không gian làm việc được giữ lại và `--json` báo cáo `workspaceRetained`,
  `workspaceRetainedReason`, và `workspaceSharedWith`.

## Tệp danh tính

Mỗi không gian làm việc của tác nhân có thể bao gồm một `IDENTITY.md` ở gốc không gian làm việc:

- Đường dẫn ví dụ: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` đọc từ gốc không gian làm việc (hoặc một `--identity-file` rõ ràng)

Đường dẫn avatar được phân giải tương đối so với gốc không gian làm việc.

## Đặt danh tính

`set-identity` ghi các trường vào `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (đường dẫn tương đối với không gian làm việc, URL http(s), hoặc data URI)

Tùy chọn:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Ghi chú:

- Có thể dùng `--agent` hoặc `--workspace` để chọn tác nhân đích.
- Nếu bạn dựa vào `--workspace` và nhiều tác nhân dùng chung không gian làm việc đó, lệnh sẽ thất bại và yêu cầu bạn truyền `--agent`.
- Các tệp ảnh avatar cục bộ tương đối với không gian làm việc bị giới hạn ở 2 MB. URL HTTP(S) và URI `data:` không được kiểm tra bằng giới hạn kích thước tệp cục bộ.
- Khi không cung cấp trường danh tính rõ ràng nào, lệnh đọc dữ liệu danh tính từ `IDENTITY.md`.

Tải từ `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Ghi đè trường một cách rõ ràng:

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
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
