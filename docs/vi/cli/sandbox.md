---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Quản lý các môi trường thực thi sandbox và kiểm tra chính sách sandbox có hiệu lực
title: CLI hộp cát
x-i18n:
    generated_at: "2026-07-12T07:49:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Quản lý các môi trường chạy sandbox để thực thi tác nhân biệt lập: vùng chứa Docker, đích SSH hoặc backend OpenShell.

## Lệnh

### `openclaw sandbox list`

Liệt kê các môi trường chạy sandbox cùng trạng thái, backend, mức khớp cấu hình, thời gian tồn tại, thời gian nhàn rỗi và phiên/tác nhân liên kết.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # chỉ các vùng chứa trình duyệt
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Xóa các môi trường chạy sandbox để buộc tạo lại theo cấu hình hiện tại. Các môi trường chạy được tự động tạo lại vào lần tiếp theo tác nhân được sử dụng.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # bao gồm các phiên con agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # chỉ các vùng chứa trình duyệt
openclaw sandbox recreate --all --force        # bỏ qua xác nhận
```

Tùy chọn:

- `--all`: tạo lại tất cả vùng chứa sandbox
- `--session <key>`: tạo lại môi trường chạy có chính xác khóa phạm vi này (như hiển thị bởi `sandbox list`); không mở rộng tên ngắn
- `--agent <id>`: tạo lại các môi trường chạy cho một tác nhân (khớp với `agent:<id>` và `agent:<id>:*`)
- `--browser`: chỉ tác động đến các vùng chứa trình duyệt
- `--force`: bỏ qua lời nhắc xác nhận

Chỉ truyền đúng một trong các tùy chọn `--all`, `--session` hoặc `--agent`.

Đối với `ssh` và OpenShell `remote`, việc tạo lại quan trọng hơn so với Docker: không gian làm việc từ xa trở thành bản chuẩn sau lần khởi tạo ban đầu, `recreate` xóa không gian làm việc từ xa chuẩn đó cho phạm vi đã chọn và lần chạy tiếp theo sẽ khởi tạo lại từ không gian làm việc cục bộ hiện tại.

### `openclaw sandbox explain`

Kiểm tra chế độ/phạm vi/quyền truy cập không gian làm việc sandbox có hiệu lực, chính sách công cụ sandbox và các cổng kiểm soát công cụ nâng cao (kèm đường dẫn khóa cấu hình để khắc phục).

Báo cáo giữ `workspaceRoot` làm thư mục gốc sandbox đã cấu hình, đồng thời hiển thị riêng không gian làm việc máy chủ có hiệu lực, thư mục làm việc của môi trường chạy backend và bảng gắn kết Docker. Với `workspaceAccess: "rw"`, không gian làm việc máy chủ có hiệu lực là không gian làm việc của tác nhân thay vì một thư mục bên dưới `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Không giống `recreate --session`, lệnh này chấp nhận tên phiên ngắn (ví dụ `main`) và mở rộng chúng theo tác nhân đã phân giải.

## Tại sao cần tạo lại

Việc cập nhật cấu hình sandbox không ảnh hưởng đến các vùng chứa đang chạy: các môi trường chạy hiện có vẫn giữ thiết lập cũ và các môi trường chạy nhàn rỗi chỉ bị dọn dẹp sau `prune.idleHours` (mặc định 24 giờ). Các tác nhân được sử dụng thường xuyên có thể duy trì vô thời hạn các môi trường chạy dùng cấu hình cũ. `openclaw sandbox recreate` xóa môi trường chạy cũ để lần sử dụng tiếp theo xây dựng lại môi trường đó từ cấu hình hiện tại.

<Tip>
Ưu tiên `openclaw sandbox recreate` thay vì dọn dẹp thủ công theo từng backend. Lệnh này sử dụng sổ đăng ký môi trường chạy của Gateway và tránh tình trạng không khớp khi phạm vi hoặc khóa phiên thay đổi.
</Tip>

## Các trường hợp thường cần thực hiện

| Thay đổi                                                                                                                                                       | Lệnh                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Cập nhật ảnh Docker (`agents.defaults.sandbox.docker.image`)                                                                                                   | `openclaw sandbox recreate --all`                                   |
| Cấu hình sandbox (`agents.defaults.sandbox.*`)                                                                                                                 | `openclaw sandbox recreate --all`                                   |
| Đích/xác thực SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Nguồn/chính sách/chế độ OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                       | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (hoặc `--agent <id>` cho một tác nhân) |

<Note>
Các môi trường chạy được tự động tạo lại vào lần tiếp theo tác nhân được sử dụng.
</Note>

## Di chuyển sổ đăng ký

Siêu dữ liệu môi trường chạy sandbox nằm trong cơ sở dữ liệu trạng thái SQLite dùng chung. Các bản cài đặt cũ hơn có thể chứa những tệp sổ đăng ký cũ mà thao tác đọc thông thường không còn ghi lại:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- một phân mảnh JSON cho mỗi vùng chứa/trình duyệt trong `~/.openclaw/sandbox/containers/` hoặc `~/.openclaw/sandbox/browsers/`

Chạy `openclaw doctor --fix` để di chuyển các mục cũ hợp lệ vào SQLite. Các tệp cũ không hợp lệ được cách ly để sổ đăng ký cũ bị hỏng không thể che khuất các mục môi trường chạy hiện tại.

## Cấu hình

Các thiết lập sandbox nằm trong `~/.openclaw/openclaw.json` tại `agents.defaults.sandbox` (các ghi đè theo từng tác nhân nằm trong `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (do plugin cung cấp)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... các tùy chọn Docker khác
        },
        "prune": {
          "idleHours": 24, // tự động dọn dẹp sau 24 giờ nhàn rỗi
          "maxAgeDays": 7, // tự động dọn dẹp sau 7 ngày
        },
      },
    },
  },
}
```

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Cơ chế sandbox](/vi/gateway/sandboxing)
- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- [Doctor](/vi/gateway/doctor): kiểm tra thiết lập sandbox.
