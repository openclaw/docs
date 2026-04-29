---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Quản lý môi trường thời gian chạy hộp cát và kiểm tra chính sách hộp cát có hiệu lực
title: CLI hộp cát
x-i18n:
    generated_at: "2026-04-29T22:33:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

Quản lý các runtime sandbox để thực thi tác nhân cô lập.

## Tổng quan

OpenClaw có thể chạy tác nhân trong các runtime sandbox cô lập để bảo mật. Các lệnh `sandbox` giúp bạn kiểm tra và tạo lại những runtime đó sau khi cập nhật hoặc thay đổi cấu hình.

Hiện nay, điều đó thường có nghĩa là:

- Các container sandbox Docker
- Runtime sandbox SSH khi `agents.defaults.sandbox.backend = "ssh"`
- Runtime sandbox OpenShell khi `agents.defaults.sandbox.backend = "openshell"`

Với `ssh` và OpenShell `remote`, việc tạo lại quan trọng hơn so với Docker:

- không gian làm việc từ xa là bản chuẩn sau lần khởi tạo ban đầu
- `openclaw sandbox recreate` xóa không gian làm việc từ xa chuẩn đó cho phạm vi đã chọn
- lần sử dụng tiếp theo sẽ khởi tạo lại từ không gian làm việc cục bộ hiện tại

## Lệnh

### `openclaw sandbox explain`

Kiểm tra chế độ/phạm vi/quyền truy cập không gian làm việc sandbox **có hiệu lực**, chính sách công cụ sandbox và các cổng yêu cầu quyền nâng cao (kèm đường dẫn khóa cấu hình để sửa).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Liệt kê tất cả runtime sandbox cùng trạng thái và cấu hình của chúng.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Chỉ liệt kê container trình duyệt
openclaw sandbox list --json     # Đầu ra JSON
```

**Đầu ra bao gồm:**

- Tên và trạng thái runtime
- Backend (`docker`, `openshell`, v.v.)
- Nhãn cấu hình và việc nó có khớp với cấu hình hiện tại hay không
- Tuổi đời (thời gian kể từ khi tạo)
- Thời gian nhàn rỗi (thời gian kể từ lần sử dụng cuối)
- Phiên/tác nhân liên quan

### `openclaw sandbox recreate`

Xóa runtime sandbox để buộc tạo lại với cấu hình đã cập nhật.

```bash
openclaw sandbox recreate --all                # Tạo lại tất cả container
openclaw sandbox recreate --session main       # Phiên cụ thể
openclaw sandbox recreate --agent mybot        # Tác nhân cụ thể
openclaw sandbox recreate --browser            # Chỉ container trình duyệt
openclaw sandbox recreate --all --force        # Bỏ qua xác nhận
```

**Tùy chọn:**

- `--all`: Tạo lại tất cả container sandbox
- `--session <key>`: Tạo lại container cho phiên cụ thể
- `--agent <id>`: Tạo lại container cho tác nhân cụ thể
- `--browser`: Chỉ tạo lại container trình duyệt
- `--force`: Bỏ qua lời nhắc xác nhận

<Note>
Runtime sẽ tự động được tạo lại khi tác nhân được sử dụng lần tiếp theo.
</Note>

## Trường hợp sử dụng

### Sau khi cập nhật Docker image

```bash
# Pull image mới
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Cập nhật cấu hình để dùng image mới
# Chỉnh sửa cấu hình: agents.defaults.sandbox.docker.image (hoặc agents.list[].sandbox.docker.image)

# Tạo lại container
openclaw sandbox recreate --all
```

### Sau khi thay đổi cấu hình sandbox

```bash
# Chỉnh sửa cấu hình: agents.defaults.sandbox.* (hoặc agents.list[].sandbox.*)

# Tạo lại để áp dụng cấu hình mới
openclaw sandbox recreate --all
```

### Sau khi thay đổi đích SSH hoặc thông tin xác thực SSH

```bash
# Chỉnh sửa cấu hình:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Với backend `ssh` lõi, tạo lại sẽ xóa thư mục gốc không gian làm việc từ xa theo phạm vi
trên đích SSH. Lần chạy tiếp theo sẽ khởi tạo lại từ không gian làm việc cục bộ.

### Sau khi thay đổi nguồn, chính sách hoặc chế độ OpenShell

```bash
# Chỉnh sửa cấu hình:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Với chế độ OpenShell `remote`, tạo lại sẽ xóa không gian làm việc từ xa chuẩn
cho phạm vi đó. Lần chạy tiếp theo sẽ khởi tạo lại từ không gian làm việc cục bộ.

### Sau khi thay đổi setupCommand

```bash
openclaw sandbox recreate --all
# hoặc chỉ một tác nhân:
openclaw sandbox recreate --agent family
```

### Chỉ cho một tác nhân cụ thể

```bash
# Chỉ cập nhật container của một tác nhân
openclaw sandbox recreate --agent alfred
```

## Vì sao cần thao tác này

Khi bạn cập nhật cấu hình sandbox:

- Runtime hiện có tiếp tục chạy với thiết lập cũ.
- Runtime chỉ bị dọn sau 24 giờ không hoạt động.
- Các tác nhân được sử dụng thường xuyên sẽ giữ runtime cũ hoạt động vô thời hạn.

Dùng `openclaw sandbox recreate` để buộc xóa runtime cũ. Chúng sẽ tự động được tạo lại với thiết lập hiện tại khi cần lần tiếp theo.

<Tip>
Ưu tiên `openclaw sandbox recreate` thay vì dọn dẹp thủ công theo backend. Lệnh này dùng registry runtime của Gateway và tránh sai lệch khi phạm vi hoặc khóa phiên thay đổi.
</Tip>

## Cấu hình

Thiết lập sandbox nằm trong `~/.openclaw/openclaw.json` dưới `agents.defaults.sandbox` (ghi đè theo từng tác nhân nằm trong `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... thêm tùy chọn Docker
        },
        "prune": {
          "idleHours": 24, // Tự động dọn sau 24 giờ nhàn rỗi
          "maxAgeDays": 7, // Tự động dọn sau 7 ngày
        },
      },
    },
  },
}
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Sandboxing](/vi/gateway/sandboxing)
- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- [Doctor](/vi/gateway/doctor): kiểm tra thiết lập sandbox.
