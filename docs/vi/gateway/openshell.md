---
read_when:
    - Bạn muốn dùng môi trường sandbox do đám mây quản lý thay vì Docker cục bộ
    - Bạn đang thiết lập Plugin OpenShell
    - Bạn cần chọn giữa chế độ phản chiếu và chế độ không gian làm việc từ xa
summary: Sử dụng OpenShell làm backend sandbox được quản lý cho các tác nhân OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-29T22:45:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell là một backend sandbox được quản lý cho OpenClaw. Thay vì chạy Docker
containers cục bộ, OpenClaw ủy quyền vòng đời sandbox cho CLI `openshell`,
CLI này cung cấp môi trường từ xa với cơ chế thực thi lệnh dựa trên SSH.

Plugin OpenShell tái sử dụng cùng transport SSH lõi và cầu nối hệ thống tệp từ xa
như [backend SSH](/vi/gateway/sandboxing#ssh-backend) chung. Plugin này bổ sung
vòng đời riêng cho OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
và chế độ không gian làm việc `mirror` tùy chọn.

## Điều kiện tiên quyết

- CLI `openshell` đã được cài đặt và nằm trong `PATH` (hoặc đặt đường dẫn tùy chỉnh qua
  `plugins.entries.openshell.config.command`)
- Tài khoản OpenShell có quyền truy cập sandbox
- OpenClaw Gateway đang chạy trên máy chủ

## Bắt đầu nhanh

1. Bật plugin và đặt backend sandbox:

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

## Chế độ không gian làm việc

Đây là quyết định quan trọng nhất khi dùng OpenShell.

### `mirror`

Dùng `plugins.entries.openshell.config.mode: "mirror"` khi bạn muốn **không gian làm việc
cục bộ vẫn là nguồn chính thống**.

Hành vi:

- Trước `exec`, OpenClaw đồng bộ không gian làm việc cục bộ vào sandbox OpenShell.
- Sau `exec`, OpenClaw đồng bộ không gian làm việc từ xa trở lại không gian làm việc cục bộ.
- Công cụ tệp vẫn hoạt động qua cầu nối sandbox, nhưng không gian làm việc cục bộ
  vẫn là nguồn sự thật giữa các lượt.

Phù hợp nhất cho:

- Bạn chỉnh sửa tệp cục bộ bên ngoài OpenClaw và muốn các thay đổi đó tự động hiển thị trong
  sandbox.
- Bạn muốn sandbox OpenShell hoạt động giống backend Docker nhất có thể.
- Bạn muốn không gian làm việc trên máy chủ phản ánh các lần ghi của sandbox sau mỗi lượt exec.

Đánh đổi: tốn thêm chi phí đồng bộ trước và sau mỗi lần exec.

### `remote`

Dùng `plugins.entries.openshell.config.mode: "remote"` khi bạn muốn
**không gian làm việc OpenShell trở thành nguồn chính thống**.

Hành vi:

- Khi sandbox được tạo lần đầu, OpenClaw seed không gian làm việc từ xa từ
  không gian làm việc cục bộ một lần.
- Sau đó, `exec`, `read`, `write`, `edit`, và `apply_patch` hoạt động
  trực tiếp trên không gian làm việc OpenShell từ xa.
- OpenClaw **không** đồng bộ các thay đổi từ xa trở lại không gian làm việc cục bộ.
- Việc đọc media trong lúc tạo prompt vẫn hoạt động vì các công cụ tệp và media đọc qua
  cầu nối sandbox.

Phù hợp nhất cho:

- Sandbox nên tồn tại chủ yếu ở phía từ xa.
- Bạn muốn giảm chi phí đồng bộ theo từng lượt.
- Bạn không muốn các chỉnh sửa cục bộ trên máy chủ âm thầm ghi đè trạng thái sandbox từ xa.

<Warning>
Nếu bạn chỉnh sửa tệp trên máy chủ bên ngoài OpenClaw sau lần seed ban đầu, sandbox từ xa **không** thấy các thay đổi đó. Dùng `openclaw sandbox recreate` để seed lại.
</Warning>

### Chọn chế độ

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Không gian làm việc chính thống** | Máy chủ cục bộ             | OpenShell từ xa           |
| **Hướng đồng bộ**        | Hai chiều (mỗi lần exec)   | Seed một lần              |
| **Chi phí theo lượt**    | Cao hơn (tải lên + tải xuống) | Thấp hơn (thao tác trực tiếp từ xa) |
| **Chỉnh sửa cục bộ có hiển thị không?** | Có, ở lần exec tiếp theo | Không, cho đến khi recreate |
| **Phù hợp nhất cho**     | Quy trình phát triển       | Agent chạy dài hạn, CI    |

## Tham chiếu cấu hình

Tất cả cấu hình OpenShell nằm dưới `plugins.entries.openshell.config`:

| Khóa                      | Kiểu                     | Mặc định      | Mô tả                                                  |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------ |
| `mode`                    | `"mirror"` hoặc `"remote"` | `"mirror"`  | Chế độ đồng bộ không gian làm việc                     |
| `command`                 | `string`                 | `"openshell"` | Đường dẫn hoặc tên của CLI `openshell`                 |
| `from`                    | `string`                 | `"openclaw"`  | Nguồn sandbox cho lần tạo đầu tiên                     |
| `gateway`                 | `string`                 | —             | Tên Gateway OpenShell (`--gateway`)                    |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint Gateway OpenShell (`--gateway-endpoint`)  |
| `policy`                  | `string`                 | —             | ID policy OpenShell để tạo sandbox                     |
| `providers`               | `string[]`               | `[]`          | Tên provider cần gắn khi sandbox được tạo              |
| `gpu`                     | `boolean`                | `false`       | Yêu cầu tài nguyên GPU                                 |
| `autoProviders`           | `boolean`                | `true`        | Truyền `--auto-providers` trong lúc tạo sandbox        |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Không gian làm việc chính có thể ghi bên trong sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Đường dẫn mount không gian làm việc của agent (cho quyền truy cập chỉ đọc) |
| `timeoutSeconds`          | `number`                 | `120`         | Thời gian chờ cho các thao tác CLI `openshell`         |

Các thiết lập cấp sandbox (`mode`, `scope`, `workspaceAccess`) được cấu hình dưới
`agents.defaults.sandbox` như với mọi backend. Xem
[Sandboxing](/vi/gateway/sandboxing) để biết ma trận đầy đủ.

## Ví dụ

### Thiết lập remote tối thiểu

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
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Với chế độ `remote`, **recreate đặc biệt quan trọng**: thao tác này xóa không gian làm việc
từ xa chính thống cho phạm vi đó. Lần dùng tiếp theo seed một không gian làm việc từ xa mới từ
không gian làm việc cục bộ.

Với chế độ `mirror`, recreate chủ yếu đặt lại môi trường thực thi từ xa vì
không gian làm việc cục bộ vẫn là nguồn chính thống.

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

OpenShell ghim fd gốc của không gian làm việc và kiểm tra lại danh tính sandbox trước mỗi lần
đọc, nên việc tráo symlink hoặc mount lại không gian làm việc không thể chuyển hướng lượt đọc ra ngoài
không gian làm việc từ xa dự kiến.

## Giới hạn hiện tại

- Trình duyệt sandbox không được hỗ trợ trên backend OpenShell.
- `sandbox.docker.binds` không áp dụng cho OpenShell.
- Các núm chỉnh runtime riêng cho Docker dưới `sandbox.docker.*` chỉ áp dụng cho backend Docker.

## Cách hoạt động

1. OpenClaw gọi `openshell sandbox create` (với các cờ `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` như đã cấu hình).
2. OpenClaw gọi `openshell sandbox ssh-config <name>` để lấy thông tin kết nối SSH
   cho sandbox.
3. Lõi ghi cấu hình SSH vào một tệp tạm và mở phiên SSH bằng cùng cầu nối hệ thống tệp từ xa
   như backend SSH chung.
4. Ở chế độ `mirror`: đồng bộ cục bộ lên từ xa trước exec, chạy, rồi đồng bộ lại sau exec.
5. Ở chế độ `remote`: seed một lần khi tạo, rồi thao tác trực tiếp trên không gian làm việc
   từ xa.

## Liên quan

- [Sandboxing](/vi/gateway/sandboxing) -- chế độ, phạm vi, và so sánh backend
- [Sandbox so với Policy công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) -- gỡ lỗi công cụ bị chặn
- [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo từng agent
- [CLI sandbox](/vi/cli/sandbox) -- các lệnh `openclaw sandbox`
