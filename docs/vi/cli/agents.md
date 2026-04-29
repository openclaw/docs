---
read_when:
    - Bạn muốn nhiều tác nhân biệt lập (không gian làm việc + định tuyến + xác thực)
summary: Tài liệu tham khảo CLI cho `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Tác nhân
x-i18n:
    generated_at: "2026-04-29T22:29:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Quản lý các agent tách biệt (workspace + xác thực + định tuyến).

Liên quan:

- [Định tuyến đa agent](/vi/concepts/multi-agent)
- [Workspace của agent](/vi/concepts/agent-workspace)
- [Cấu hình Skills](/vi/tools/skills-config): cấu hình mức hiển thị Skills.

## Ví dụ

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Binding định tuyến

Dùng binding định tuyến để ghim lưu lượng kênh đến vào một agent cụ thể.

Nếu bạn cũng muốn mỗi agent có các Skills hiển thị khác nhau, hãy cấu hình `agents.defaults.skills` và `agents.list[].skills` trong `openclaw.json`. Xem [Cấu hình Skills](/vi/tools/skills-config) và [Tham chiếu cấu hình](/vi/gateway/config-agents#agents-defaults-skills).

Liệt kê binding:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Thêm binding:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Nếu bạn bỏ qua `accountId` (`--bind <channel>`), OpenClaw sẽ phân giải giá trị này từ mặc định của kênh và các hook thiết lập Plugin khi có sẵn.

Nếu bạn bỏ qua `--agent` cho `bind` hoặc `unbind`, OpenClaw sẽ nhắm đến agent mặc định hiện tại.

### Hành vi phạm vi binding

- Binding không có `accountId` chỉ khớp với tài khoản mặc định của kênh.
- `accountId: "*"` là phương án dự phòng trên toàn kênh (tất cả tài khoản) và ít cụ thể hơn binding tài khoản tường minh.
- Nếu cùng agent đã có binding kênh khớp mà không có `accountId`, và sau đó bạn bind với `accountId` tường minh hoặc được phân giải, OpenClaw sẽ nâng cấp binding hiện có đó tại chỗ thay vì thêm bản trùng lặp.

Ví dụ:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Sau khi nâng cấp, định tuyến cho binding đó được giới hạn trong phạm vi `telegram:ops`. Nếu bạn cũng muốn định tuyến tài khoản mặc định, hãy thêm tường minh (ví dụ `--bind telegram:default`).

Xóa binding:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` chấp nhận `--all` hoặc một hay nhiều giá trị `--bind`, không chấp nhận cả hai cùng lúc.

## Bề mặt lệnh

### `agents`

Chạy `openclaw agents` không có lệnh con tương đương với `openclaw agents list`.

### `agents list`

Tùy chọn:

- `--json`
- `--bindings`: bao gồm đầy đủ quy tắc định tuyến, không chỉ số lượng/tóm tắt theo từng agent

### `agents add [name]`

Tùy chọn:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (có thể lặp lại)
- `--non-interactive`
- `--json`

Ghi chú:

- Truyền bất kỳ cờ thêm tường minh nào sẽ chuyển lệnh sang đường dẫn không tương tác.
- Chế độ không tương tác yêu cầu cả tên agent và `--workspace`.
- `main` được dành riêng và không thể dùng làm id agent mới.
- Ở chế độ tương tác, quá trình gieo xác thực chỉ sao chép các hồ sơ tĩnh có tính di động
  (`api_key` và `token` tĩnh theo mặc định). Các hồ sơ OAuth refresh-token vẫn
  chỉ khả dụng thông qua kế thừa đọc xuyên từ kho agent `main` thật.
  Nếu agent mặc định đã cấu hình không phải là `main`, hãy đăng nhập riêng cho các
  hồ sơ OAuth trên agent mới.

### `agents bindings`

Tùy chọn:

- `--agent <id>`
- `--json`

### `agents bind`

Tùy chọn:

- `--agent <id>` (mặc định là agent mặc định hiện tại)
- `--bind <channel[:accountId]>` (có thể lặp lại)
- `--json`

### `agents unbind`

Tùy chọn:

- `--agent <id>` (mặc định là agent mặc định hiện tại)
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
- Workspace, trạng thái agent và các thư mục bản ghi phiên được chuyển vào Thùng rác, không bị xóa vĩnh viễn.
- Nếu workspace của agent khác là cùng đường dẫn, nằm bên trong workspace này, hoặc chứa workspace này,
  workspace sẽ được giữ lại và `--json` báo cáo `workspaceRetained`,
  `workspaceRetainedReason`, và `workspaceSharedWith`.

## Tệp nhận dạng

Mỗi workspace của agent có thể bao gồm một `IDENTITY.md` ở gốc workspace:

- Đường dẫn ví dụ: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` đọc từ gốc workspace (hoặc một `--identity-file` tường minh)

Đường dẫn avatar được phân giải tương đối với gốc workspace.

## Đặt nhận dạng

`set-identity` ghi các trường vào `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (đường dẫn tương đối với workspace, URL http(s), hoặc data URI)

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

- Có thể dùng `--agent` hoặc `--workspace` để chọn agent đích.
- Nếu bạn dựa vào `--workspace` và nhiều agent dùng chung workspace đó, lệnh sẽ thất bại và yêu cầu bạn truyền `--agent`.
- Khi không cung cấp trường nhận dạng tường minh nào, lệnh sẽ đọc dữ liệu nhận dạng từ `IDENTITY.md`.

Tải từ `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Ghi đè trường một cách tường minh:

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
- [Workspace của agent](/vi/concepts/agent-workspace)
