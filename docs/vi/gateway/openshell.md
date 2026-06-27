---
read_when:
    - Bạn muốn các sandbox được quản lý trên đám mây thay vì Docker cục bộ
    - Bạn đang thiết lập Plugin OpenShell
    - Bạn cần chọn giữa chế độ không gian làm việc mirror và remote
summary: Sử dụng OpenShell làm backend sandbox được quản lý cho các tác nhân OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:31:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell là backend sandbox được quản lý cho OpenClaw. Thay vì chạy Docker
container cục bộ, OpenClaw ủy quyền vòng đời sandbox cho CLI `openshell`,
công cụ này cấp phát môi trường từ xa với thực thi lệnh dựa trên SSH.

Plugin OpenShell tái sử dụng cùng transport SSH lõi và cầu nối hệ thống tệp từ xa
như [backend SSH](/vi/gateway/sandboxing#ssh-backend) chung. Nó bổ sung vòng đời
riêng cho OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
và chế độ workspace `mirror` tùy chọn.

## Điều kiện tiên quyết

- Đã cài đặt Plugin OpenShell (`openclaw plugins install @openclaw/openshell-sandbox`)
- Đã cài đặt CLI `openshell` và có trong `PATH` (hoặc đặt đường dẫn tùy chỉnh qua
  `plugins.entries.openshell.config.command`)
- Một tài khoản OpenShell có quyền truy cập sandbox
- OpenClaw Gateway đang chạy trên host

## Bắt đầu nhanh

1. Cài đặt và bật Plugin, sau đó đặt backend sandbox:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Khởi động lại Gateway. Ở lượt agent tiếp theo, OpenClaw tạo một sandbox OpenShell
   và định tuyến việc thực thi công cụ qua sandbox đó.

3. Xác minh:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Chế độ workspace

Đây là quyết định quan trọng nhất khi sử dụng OpenShell.

### `mirror`

Dùng `plugins.entries.openshell.config.mode: "mirror"` khi bạn muốn **workspace cục bộ
vẫn là nguồn chuẩn**.

Hành vi:

- Trước `exec`, OpenClaw đồng bộ workspace cục bộ vào sandbox OpenShell.
- Sau `exec`, OpenClaw đồng bộ workspace từ xa trở lại workspace cục bộ.
- Các công cụ tệp vẫn hoạt động qua cầu nối sandbox, nhưng workspace cục bộ
  vẫn là nguồn sự thật giữa các lượt.

Phù hợp nhất cho:

- Bạn chỉnh sửa tệp cục bộ bên ngoài OpenClaw và muốn các thay đổi đó tự động hiển thị trong
  sandbox.
- Bạn muốn sandbox OpenShell hoạt động giống backend Docker nhất có thể.
- Bạn muốn workspace trên host phản ánh các ghi từ sandbox sau mỗi lượt exec.

Đánh đổi: thêm chi phí đồng bộ trước và sau mỗi exec.

### `remote`

Dùng `plugins.entries.openshell.config.mode: "remote"` khi bạn muốn
**workspace OpenShell trở thành nguồn chuẩn**.

Hành vi:

- Khi sandbox được tạo lần đầu, OpenClaw gieo workspace từ xa từ
  workspace cục bộ một lần.
- Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` hoạt động
  trực tiếp trên workspace OpenShell từ xa.
- OpenClaw **không** đồng bộ các thay đổi từ xa trở lại workspace cục bộ.
- Các lượt đọc media tại thời điểm prompt vẫn hoạt động vì công cụ tệp và media đọc qua
  cầu nối sandbox.

Phù hợp nhất cho:

- Sandbox chủ yếu nên sống ở phía từ xa.
- Bạn muốn giảm chi phí đồng bộ theo từng lượt.
- Bạn không muốn các chỉnh sửa cục bộ trên host âm thầm ghi đè trạng thái sandbox từ xa.

<Warning>
Nếu bạn chỉnh sửa tệp trên host bên ngoài OpenClaw sau lần gieo ban đầu, sandbox từ xa **không** thấy các thay đổi đó. Dùng `openclaw sandbox recreate` để gieo lại.
</Warning>

### Chọn chế độ

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace chuẩn**      | Host cục bộ                | OpenShell từ xa           |
| **Hướng đồng bộ**        | Hai chiều (mỗi exec)       | Gieo một lần              |
| **Chi phí mỗi lượt**     | Cao hơn (tải lên + tải xuống) | Thấp hơn (thao tác trực tiếp từ xa) |
| **Chỉnh sửa cục bộ hiển thị?** | Có, ở exec tiếp theo       | Không, cho đến khi recreate |
| **Phù hợp nhất cho**     | Quy trình phát triển       | Agent chạy lâu, CI        |

## Tham chiếu cấu hình

Toàn bộ cấu hình OpenShell nằm dưới `plugins.entries.openshell.config`:

| Khóa                      | Kiểu                     | Mặc định      | Mô tả                                                  |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------ |
| `mode`                    | `"mirror"` hoặc `"remote"` | `"mirror"`    | Chế độ đồng bộ workspace                               |
| `command`                 | `string`                 | `"openshell"` | Đường dẫn hoặc tên của CLI `openshell`                 |
| `from`                    | `string`                 | `"openclaw"`  | Nguồn sandbox cho lần tạo đầu tiên                     |
| `gateway`                 | `string`                 | —             | Tên Gateway OpenShell (`--gateway`)                    |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint Gateway OpenShell (`--gateway-endpoint`)  |
| `policy`                  | `string`                 | —             | ID policy OpenShell để tạo sandbox                     |
| `providers`               | `string[]`               | `[]`          | Tên provider cần gắn khi sandbox được tạo              |
| `gpu`                     | `boolean`                | `false`       | Yêu cầu tài nguyên GPU                                 |
| `autoProviders`           | `boolean`                | `true`        | Truyền `--auto-providers` trong khi tạo sandbox        |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace chính có thể ghi bên trong sandbox           |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Đường dẫn mount workspace agent (cho quyền truy cập chỉ đọc) |
| `timeoutSeconds`          | `number`                 | `120`         | Thời gian chờ cho các thao tác CLI `openshell`         |

Các thiết lập cấp sandbox (`mode`, `scope`, `workspaceAccess`) được cấu hình dưới
`agents.defaults.sandbox` như với mọi backend. Xem
[Sandboxing](/vi/gateway/sandboxing) để biết ma trận đầy đủ.

## Ví dụ

### Thiết lập remote tối giản

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Chế độ mirror với GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell theo từng agent với Gateway tùy chỉnh

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Quản lý vòng đời

Sandbox OpenShell được quản lý qua CLI sandbox thông thường:

```bash
# Liệt kê toàn bộ runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Kiểm tra policy có hiệu lực
openclaw sandbox explain

# Tạo lại (xóa workspace từ xa, gieo lại ở lần dùng tiếp theo)
openclaw sandbox recreate --all
```

Với chế độ `remote`, **recreate đặc biệt quan trọng**: nó xóa workspace từ xa chuẩn
cho phạm vi đó. Lần dùng tiếp theo sẽ gieo một workspace từ xa mới từ
workspace cục bộ.

Với chế độ `mirror`, recreate chủ yếu đặt lại môi trường thực thi từ xa vì
workspace cục bộ vẫn là nguồn chuẩn.

### Khi nào cần recreate

Recreate sau khi thay đổi bất kỳ mục nào sau đây:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Gia cố bảo mật

OpenShell ghim fd gốc workspace và kiểm tra lại danh tính sandbox trước mỗi lần
đọc, vì vậy việc tráo symlink hoặc remount workspace không thể chuyển hướng lượt đọc ra ngoài
workspace từ xa dự kiến.

## Giới hạn hiện tại

- Trình duyệt sandbox không được hỗ trợ trên backend OpenShell.
- `sandbox.docker.binds` không áp dụng cho OpenShell.
- Các núm runtime riêng cho Docker dưới `sandbox.docker.*` chỉ áp dụng cho backend Docker.

## Cách hoạt động

1. OpenClaw gọi `openshell sandbox create` (với các cờ `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` như đã cấu hình).
2. OpenClaw gọi `openshell sandbox ssh-config <name>` để lấy chi tiết kết nối SSH
   cho sandbox.
3. Lõi ghi cấu hình SSH vào tệp tạm và mở phiên SSH bằng cùng cầu nối hệ thống tệp từ xa
   như backend SSH chung.
4. Ở chế độ `mirror`: đồng bộ cục bộ lên từ xa trước exec, chạy, rồi đồng bộ trở lại sau exec.
5. Ở chế độ `remote`: gieo một lần khi tạo, sau đó thao tác trực tiếp trên
   workspace từ xa.

## Liên quan

- [Sandboxing](/vi/gateway/sandboxing) -- chế độ, phạm vi, và so sánh backend
- [Sandbox so với Policy công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) -- gỡ lỗi công cụ bị chặn
- [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo từng agent
- [CLI sandbox](/vi/cli/sandbox) -- các lệnh `openclaw sandbox`
