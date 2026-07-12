---
read_when:
    - Bạn muốn các sandbox được quản lý trên đám mây thay vì Docker cục bộ
    - Bạn đang thiết lập plugin OpenShell
    - Bạn cần chọn giữa chế độ không gian làm việc phản chiếu và từ xa
summary: Sử dụng OpenShell làm backend sandbox được quản lý cho các tác nhân OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T07:59:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell là một backend sandbox được quản lý: thay vì chạy các container Docker
cục bộ, OpenClaw ủy quyền vòng đời sandbox cho CLI `openshell`, công cụ này
cấp phát các môi trường từ xa và thực thi lệnh qua SSH.

Plugin này tái sử dụng cùng cơ chế truyền tải SSH và cầu nối hệ thống tệp từ xa như
[backend SSH](/vi/gateway/sandboxing#ssh-backend) dùng chung, đồng thời bổ sung
vòng đời OpenShell (`sandbox create/get/delete/ssh-config`) cùng chế độ đồng bộ
không gian làm việc `mirror` tùy chọn.

## Điều kiện tiên quyết

- Đã cài đặt Plugin OpenShell (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` có trong `PATH` (hoặc đường dẫn tùy chỉnh qua
  `plugins.entries.openshell.config.command`)
- Tài khoản OpenShell có quyền truy cập sandbox
- OpenClaw Gateway đang chạy trên máy chủ

## Bắt đầu nhanh

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

Khởi động lại Gateway. Ở lượt tác tử tiếp theo, OpenClaw sẽ tạo một sandbox
OpenShell và định tuyến việc thực thi công cụ qua đó. Xác minh bằng:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Các chế độ không gian làm việc

Đây là quyết định quan trọng nhất khi dùng OpenShell.

### mirror (mặc định)

`plugins.entries.openshell.config.mode: "mirror"` giữ **không gian làm việc cục bộ
làm bản chuẩn**:

- Trước khi `exec`, OpenClaw đồng bộ không gian làm việc cục bộ vào sandbox.
- Sau khi `exec`, OpenClaw đồng bộ không gian làm việc từ xa trở lại cục bộ.
- Các công cụ tệp đi qua cầu nối sandbox, nhưng bản cục bộ vẫn là nguồn dữ liệu chuẩn
  giữa các lượt.

Phù hợp nhất với quy trình phát triển: các chỉnh sửa cục bộ bên ngoài OpenClaw sẽ xuất hiện
ở lần exec tiếp theo, và sandbox hoạt động gần giống backend Docker.

Đánh đổi: phát sinh chi phí tải lên + tải xuống ở mỗi lượt exec.

### remote

`mode: "remote"` đặt **không gian làm việc OpenShell làm bản chuẩn**:

- Khi tạo sandbox lần đầu, OpenClaw khởi tạo không gian làm việc từ xa từ bản cục bộ
  một lần.
- Sau đó, `exec`, `read`, `write`, `edit` và `apply_patch` thao tác
  trực tiếp trên không gian làm việc từ xa. OpenClaw **không** đồng bộ các thay đổi từ xa
  trở lại cục bộ.
- Việc đọc nội dung đa phương tiện khi tạo lời nhắc vẫn hoạt động (công cụ tệp/phương tiện đọc qua
  cầu nối sandbox).

Phù hợp nhất với các tác tử chạy lâu dài và CI: chi phí mỗi lượt thấp hơn, đồng thời các
chỉnh sửa cục bộ trên máy chủ không thể âm thầm ghi đè trạng thái từ xa.

<Warning>
Các tệp được chỉnh sửa trên máy chủ bên ngoài OpenClaw sau lần khởi tạo ban đầu sẽ không hiển thị trong sandbox từ xa. Chạy `openclaw sandbox recreate` để khởi tạo lại.
</Warning>

### Chọn chế độ

|                              | `mirror`                              | `remote`                            |
| ---------------------------- | ------------------------------------- | ----------------------------------- |
| **Không gian làm việc chuẩn** | Máy chủ cục bộ                        | OpenShell từ xa                     |
| **Hướng đồng bộ**             | Hai chiều (mỗi lần exec)              | Khởi tạo một lần                    |
| **Chi phí mỗi lượt**          | Cao hơn (tải lên + tải xuống)         | Thấp hơn (thao tác trực tiếp từ xa) |
| **Thấy chỉnh sửa cục bộ?**    | Có, ở lần exec tiếp theo              | Không, cho đến khi tạo lại          |
| **Phù hợp nhất với**          | Quy trình phát triển                  | Tác tử chạy lâu dài, CI             |

## Tham chiếu cấu hình

Toàn bộ cấu hình OpenShell nằm trong `plugins.entries.openshell.config`:

| Khóa                      | Kiểu                     | Mặc định      | Mô tả                                                                                          |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` hoặc `"remote"` | `"mirror"`    | Chế độ đồng bộ không gian làm việc                                                             |
| `command`                 | `string`                 | `"openshell"` | Đường dẫn hoặc tên của CLI `openshell`                                                         |
| `from`                    | `string`                 | `"openclaw"`  | Nguồn sandbox khi tạo lần đầu                                                                  |
| `gateway`                 | `string`                 | chưa đặt      | Tên gateway OpenShell (`--gateway` cấp cao nhất)                                                |
| `gatewayEndpoint`         | `string`                 | chưa đặt      | Điểm cuối gateway OpenShell (`--gateway-endpoint` cấp cao nhất)                                 |
| `policy`                  | `string`                 | chưa đặt      | ID chính sách OpenShell để tạo sandbox                                                         |
| `providers`               | `string[]`               | `[]`          | Tên các nhà cung cấp được gắn khi tạo sandbox (loại trùng, mỗi mục có một cờ `--provider`)      |
| `gpu`                     | `boolean`                | `false`       | Yêu cầu tài nguyên GPU (`--gpu`)                                                               |
| `autoProviders`           | `boolean`                | `true`        | Truyền `--auto-providers` (hoặc `--no-auto-providers` khi false) trong lúc tạo                  |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Không gian làm việc chính có thể ghi bên trong sandbox                                         |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Đường dẫn gắn kết không gian làm việc của tác tử (chỉ đọc khi quyền truy cập không phải `rw`)   |
| `timeoutSeconds`          | `number`                 | `120`         | Thời gian chờ cho các thao tác CLI `openshell`                                                  |

`remoteWorkspaceDir` và `remoteAgentWorkspaceDir` phải là đường dẫn tuyệt đối và
nằm trong các thư mục gốc được quản lý `/sandbox` hoặc `/agent`; các đường dẫn tuyệt đối khác sẽ
bị từ chối.

Các thiết lập cấp sandbox (`mode`, `scope`, `workspaceAccess`) nằm trong
`agents.defaults.sandbox` như với mọi backend. Xem
[Sandbox](/vi/gateway/sandboxing) để biết toàn bộ ma trận.

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

### OpenShell theo từng tác tử với gateway tùy chỉnh

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

```bash
# Liệt kê tất cả môi trường chạy sandbox (Docker + OpenShell)
openclaw sandbox list

# Kiểm tra chính sách có hiệu lực
openclaw sandbox explain

# Tạo lại (xóa không gian làm việc từ xa, khởi tạo lại ở lần sử dụng tiếp theo)
openclaw sandbox recreate --all
```

Đối với chế độ `remote`, việc tạo lại đặc biệt quan trọng: thao tác này xóa không gian làm việc
từ xa chuẩn của phạm vi đó, và lần sử dụng tiếp theo sẽ khởi tạo một không gian mới từ
bản cục bộ. Đối với chế độ `mirror`, việc tạo lại chủ yếu đặt lại môi trường thực thi
từ xa vì bản cục bộ vẫn là bản chuẩn.

Tạo lại sau khi thay đổi bất kỳ mục nào sau đây:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Tăng cường bảo mật

Cầu nối hệ thống tệp ở chế độ mirror cố định thư mục gốc của không gian làm việc cục bộ và kiểm tra lại
các đường dẫn chuẩn (qua realpath) trước mỗi thao tác đọc, ghi, mkdir, xóa và
đổi tên, đồng thời từ chối các liên kết tượng trưng nằm giữa đường dẫn. Việc tráo đổi liên kết tượng trưng hoặc gắn kết lại
không gian làm việc không thể chuyển hướng quyền truy cập tệp ra ngoài cây được phản chiếu.

## Các giới hạn hiện tại

- Trình duyệt sandbox không được hỗ trợ trên backend OpenShell.
- `sandbox.docker.binds` không áp dụng cho OpenShell; việc tạo sandbox sẽ thất bại
  nếu có cấu hình binds.
- Các tùy chọn môi trường chạy dành riêng cho Docker trong `sandbox.docker.*` (ngoại trừ `env`)
  chỉ áp dụng cho backend Docker.

## Cách thức hoạt động

1. OpenClaw chạy `sandbox get` cho tên sandbox (kèm mọi
   `--gateway`/`--gateway-endpoint` đã cấu hình); nếu thao tác đó thất bại, OpenClaw tạo sandbox bằng
   `sandbox create`, truyền `--name`, `--from`, `--policy` khi được đặt, `--gpu`
   khi được bật, `--auto-providers`/`--no-auto-providers` và một cờ
   `--provider` cho mỗi nhà cung cấp đã cấu hình.
2. OpenClaw chạy `sandbox ssh-config` cho tên sandbox để lấy thông tin
   kết nối SSH.
3. Lõi ghi cấu hình SSH vào một tệp tạm thời và mở phiên SSH thông qua
   cùng cầu nối hệ thống tệp từ xa như backend SSH dùng chung.
4. Trong chế độ `mirror`: đồng bộ cục bộ lên từ xa trước khi exec, chạy lệnh, rồi đồng bộ trở lại sau đó.
5. Trong chế độ `remote`: khởi tạo một lần khi tạo, sau đó thao tác trực tiếp trên không gian làm việc
   từ xa.

## Liên quan

- [Sandbox](/vi/gateway/sandboxing) - các chế độ, phạm vi và so sánh backend
- [Sandbox, chính sách công cụ và chế độ nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) - gỡ lỗi các công cụ bị chặn
- [Sandbox và công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools) - ghi đè theo từng tác tử
- [CLI sandbox](/vi/cli/sandbox) - các lệnh `openclaw sandbox`
