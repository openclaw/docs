---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Quản lý runtime sandbox và kiểm tra chính sách sandbox có hiệu lực
title: CLI môi trường cách ly
x-i18n:
    generated_at: "2026-06-27T17:20:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Quản lý các môi trường thực thi sandbox để thực thi tác tử cô lập.

## Tổng quan

OpenClaw có thể chạy tác tử trong các môi trường thực thi sandbox cô lập để tăng bảo mật. Các lệnh `sandbox` giúp bạn kiểm tra và tạo lại các môi trường thực thi đó sau khi cập nhật hoặc thay đổi cấu hình.

Hiện nay điều đó thường có nghĩa là:

- Các container sandbox Docker
- Các môi trường thực thi sandbox SSH khi `agents.defaults.sandbox.backend = "ssh"`
- Các môi trường thực thi sandbox OpenShell khi `agents.defaults.sandbox.backend = "openshell"`

Với `ssh` và OpenShell `remote`, việc tạo lại quan trọng hơn so với Docker:

- không gian làm việc từ xa là bản chuẩn sau lần gieo ban đầu
- `openclaw sandbox recreate` xóa không gian làm việc từ xa chuẩn đó cho phạm vi đã chọn
- lần sử dụng tiếp theo sẽ gieo lại từ không gian làm việc cục bộ hiện tại

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

Liệt kê tất cả môi trường thực thi sandbox cùng trạng thái và cấu hình của chúng.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Đầu ra bao gồm:**

- Tên và trạng thái môi trường thực thi
- Backend (`docker`, `openshell`, v.v.)
- Nhãn cấu hình và liệu nhãn đó có khớp với cấu hình hiện tại không
- Tuổi (thời gian kể từ khi tạo)
- Thời gian nhàn rỗi (thời gian kể từ lần dùng cuối)
- Phiên/tác tử liên quan

### `openclaw sandbox recreate`

Xóa các môi trường thực thi sandbox để buộc tạo lại với cấu hình đã cập nhật.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Tùy chọn:**

- `--all`: Tạo lại tất cả container sandbox
- `--session <key>`: Tạo lại container cho phiên cụ thể
- `--agent <id>`: Tạo lại container cho tác tử cụ thể
- `--browser`: Chỉ tạo lại container trình duyệt
- `--force`: Bỏ qua lời nhắc xác nhận

<Note>
Môi trường thực thi sẽ tự động được tạo lại khi tác tử được dùng lần tiếp theo.
</Note>

## Trường hợp sử dụng

### Sau khi cập nhật một image Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Sau khi thay đổi cấu hình sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Sau khi thay đổi đích SSH hoặc tài liệu xác thực SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Với backend lõi `ssh`, việc tạo lại sẽ xóa gốc không gian làm việc từ xa theo từng phạm vi
trên đích SSH. Lần chạy tiếp theo sẽ gieo lại từ không gian làm việc cục bộ.

### Sau khi thay đổi nguồn, chính sách hoặc chế độ OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Với chế độ OpenShell `remote`, việc tạo lại sẽ xóa không gian làm việc từ xa chuẩn
cho phạm vi đó. Lần chạy tiếp theo sẽ gieo lại từ không gian làm việc cục bộ.

### Sau khi thay đổi setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Chỉ cho một tác tử cụ thể

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Vì sao cần làm việc này

Khi bạn cập nhật cấu hình sandbox:

- Các môi trường thực thi hiện có tiếp tục chạy với thiết lập cũ.
- Môi trường thực thi chỉ bị dọn sau 24 giờ không hoạt động.
- Các tác tử được dùng thường xuyên sẽ giữ môi trường thực thi cũ tồn tại vô thời hạn.

Dùng `openclaw sandbox recreate` để buộc xóa các môi trường thực thi cũ. Chúng sẽ tự động được tạo lại với thiết lập hiện tại khi cần dùng lần tiếp theo.

<Tip>
Ưu tiên `openclaw sandbox recreate` thay vì dọn dẹp thủ công theo từng backend. Lệnh này dùng sổ đăng ký môi trường thực thi của Gateway và tránh sai lệch khi phạm vi hoặc khóa phiên thay đổi.
</Tip>

## Di chuyển sổ đăng ký

OpenClaw lưu siêu dữ liệu môi trường thực thi sandbox trong cơ sở dữ liệu trạng thái SQLite dùng chung. Các bản cài đặt cũ hơn có thể vẫn có các tệp sổ đăng ký sandbox cũ:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Một số lần nâng cấp cũng có thể có một mảnh JSON cho mỗi container/trình duyệt trong `~/.openclaw/sandbox/containers/` hoặc `~/.openclaw/sandbox/browsers/`. Các lần đọc môi trường thực thi sandbox thông thường không ghi lại các nguồn cũ đó. Chạy `openclaw doctor --fix` để di chuyển các mục cũ hợp lệ vào SQLite. Các tệp cũ không hợp lệ sẽ bị cách ly để một sổ đăng ký cũ bị lỗi không thể che khuất các mục môi trường thực thi hiện tại.

## Cấu hình

Thiết lập sandbox nằm trong `~/.openclaw/openclaw.json` dưới `agents.defaults.sandbox` (ghi đè theo từng tác tử đặt trong `agents.list[].sandbox`):

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
