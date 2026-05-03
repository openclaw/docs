---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Quản lý các môi trường chạy sandbox và kiểm tra chính sách sandbox có hiệu lực
title: CLI môi trường cách ly
x-i18n:
    generated_at: "2026-05-03T21:28:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Quản lý các môi trường chạy sandbox để thực thi tác tử một cách cô lập.

## Tổng quan

OpenClaw có thể chạy tác tử trong các môi trường chạy sandbox cô lập để bảo mật. Các lệnh `sandbox` giúp bạn kiểm tra và tạo lại những môi trường chạy đó sau khi cập nhật hoặc thay đổi cấu hình.

Hiện nay, điều đó thường có nghĩa là:

- Container sandbox Docker
- Môi trường chạy sandbox SSH khi `agents.defaults.sandbox.backend = "ssh"`
- Môi trường chạy sandbox OpenShell khi `agents.defaults.sandbox.backend = "openshell"`

Đối với `ssh` và OpenShell `remote`, việc tạo lại quan trọng hơn so với Docker:

- không gian làm việc từ xa là bản chuẩn sau lần khởi tạo ban đầu
- `openclaw sandbox recreate` xóa không gian làm việc từ xa chuẩn đó cho phạm vi đã chọn
- lần dùng tiếp theo sẽ khởi tạo lại từ không gian làm việc cục bộ hiện tại

## Lệnh

### `openclaw sandbox explain`

Kiểm tra chế độ/phạm vi/quyền truy cập không gian làm việc sandbox **hiệu lực**, chính sách công cụ sandbox và các cổng nâng quyền (kèm đường dẫn khóa cấu hình để sửa).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Liệt kê tất cả môi trường chạy sandbox cùng trạng thái và cấu hình của chúng.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Chỉ liệt kê container trình duyệt
openclaw sandbox list --json     # Đầu ra JSON
```

**Đầu ra bao gồm:**

- Tên và trạng thái môi trường chạy
- Phần phụ trợ (`docker`, `openshell`, v.v.)
- Nhãn cấu hình và việc nhãn đó có khớp với cấu hình hiện tại hay không
- Tuổi (thời gian kể từ khi tạo)
- Thời gian rỗi (thời gian kể từ lần dùng cuối)
- Phiên/tác tử liên quan

### `openclaw sandbox recreate`

Xóa môi trường chạy sandbox để buộc tạo lại với cấu hình đã cập nhật.

```bash
openclaw sandbox recreate --all                # Tạo lại tất cả container
openclaw sandbox recreate --session main       # Phiên cụ thể
openclaw sandbox recreate --agent mybot        # Tác tử cụ thể
openclaw sandbox recreate --browser            # Chỉ container trình duyệt
openclaw sandbox recreate --all --force        # Bỏ qua xác nhận
```

**Tùy chọn:**

- `--all`: Tạo lại tất cả container sandbox
- `--session <key>`: Tạo lại container cho phiên cụ thể
- `--agent <id>`: Tạo lại container cho tác tử cụ thể
- `--browser`: Chỉ tạo lại container trình duyệt
- `--force`: Bỏ qua lời nhắc xác nhận

<Note>
Môi trường chạy được tự động tạo lại khi tác tử được dùng lần tiếp theo.
</Note>

## Trường hợp sử dụng

### Sau khi cập nhật image Docker

```bash
# Pull image mới
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Cập nhật config để dùng image mới
# Sửa config: agents.defaults.sandbox.docker.image (hoặc agents.list[].sandbox.docker.image)

# Tạo lại container
openclaw sandbox recreate --all
```

### Sau khi thay đổi cấu hình sandbox

```bash
# Sửa config: agents.defaults.sandbox.* (hoặc agents.list[].sandbox.*)

# Tạo lại để áp dụng config mới
openclaw sandbox recreate --all
```

### Sau khi thay đổi đích SSH hoặc dữ liệu xác thực SSH

```bash
# Sửa config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Đối với phần phụ trợ `ssh` lõi, việc tạo lại sẽ xóa thư mục gốc không gian làm việc từ xa theo phạm vi
trên đích SSH. Lần chạy tiếp theo sẽ khởi tạo lại từ không gian làm việc cục bộ.

### Sau khi thay đổi nguồn, chính sách hoặc chế độ OpenShell

```bash
# Sửa config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Đối với chế độ OpenShell `remote`, việc tạo lại sẽ xóa không gian làm việc từ xa chuẩn
cho phạm vi đó. Lần chạy tiếp theo sẽ khởi tạo lại từ không gian làm việc cục bộ.

### Sau khi thay đổi setupCommand

```bash
openclaw sandbox recreate --all
# hoặc chỉ một tác tử:
openclaw sandbox recreate --agent family
```

### Chỉ cho một tác tử cụ thể

```bash
# Chỉ cập nhật container của một tác tử
openclaw sandbox recreate --agent alfred
```

## Vì sao cần việc này

Khi bạn cập nhật cấu hình sandbox:

- Các môi trường chạy hiện có tiếp tục chạy với thiết lập cũ.
- Môi trường chạy chỉ được dọn dẹp sau 24 giờ không hoạt động.
- Các tác tử được dùng thường xuyên sẽ giữ môi trường chạy cũ tồn tại vô thời hạn.

Dùng `openclaw sandbox recreate` để buộc xóa môi trường chạy cũ. Chúng được tự động tạo lại với thiết lập hiện tại khi cần dùng lần tiếp theo.

<Tip>
Ưu tiên `openclaw sandbox recreate` thay vì dọn dẹp thủ công theo từng phần phụ trợ. Lệnh này dùng sổ đăng ký môi trường chạy của Gateway và tránh sai lệch khi khóa phạm vi hoặc phiên thay đổi.
</Tip>

## Di chuyển sổ đăng ký

OpenClaw lưu siêu dữ liệu môi trường chạy sandbox dưới dạng một shard JSON cho mỗi mục container/trình duyệt trong thư mục trạng thái sandbox. Các bản cài đặt cũ hơn có thể vẫn còn các tệp kế thừa dạng nguyên khối:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Việc đọc môi trường chạy sandbox thông thường không ghi lại các tệp đó. Chạy `openclaw doctor --fix` để di chuyển các mục kế thừa hợp lệ vào các thư mục sổ đăng ký dạng shard. Tệp kế thừa không hợp lệ sẽ được cách ly để một sổ đăng ký cũ bị lỗi không thể che khuất các mục môi trường chạy hiện tại.

## Cấu hình

Thiết lập sandbox nằm trong `~/.openclaw/openclaw.json` dưới `agents.defaults.sandbox` (ghi đè theo từng tác tử nằm trong `agents.list[].sandbox`):

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
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Sandboxing](/vi/gateway/sandboxing)
- [Không gian làm việc tác tử](/vi/concepts/agent-workspace)
- [Doctor](/vi/gateway/doctor): kiểm tra thiết lập sandbox.
