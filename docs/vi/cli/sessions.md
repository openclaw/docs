---
read_when:
    - Bạn muốn liệt kê các phiên đã lưu và xem hoạt động gần đây
summary: Tham chiếu CLI cho `openclaw sessions` (liệt kê các phiên đã lưu + cách sử dụng)
title: Phiên
x-i18n:
    generated_at: "2026-05-02T10:37:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c7f0d521756ace4af05451b925256f89661bf971533541764c128e2be9d6431
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liệt kê các phiên hội thoại đã lưu.

Danh sách phiên không phải là kiểm tra trạng thái hoạt động của kênh/nhà cung cấp. Chúng hiển thị các hàng hội thoại đã được lưu bền vững từ kho lưu trữ phiên. Một kênh Discord, Slack, Telegram hoặc kênh khác đang im lặng vẫn có thể kết nối lại thành công mà không tạo hàng phiên mới cho đến khi một tin nhắn được xử lý. Dùng `openclaw channels status --probe`, `openclaw status --deep` hoặc `openclaw health --verbose` khi bạn cần kiểm tra kết nối kênh đang hoạt động.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Chọn phạm vi:

- mặc định: kho lưu trữ agent mặc định đã cấu hình
- `--verbose`: ghi nhật ký chi tiết
- `--agent <id>`: một kho lưu trữ agent đã cấu hình
- `--all-agents`: tổng hợp tất cả kho lưu trữ agent đã cấu hình
- `--store <path>`: đường dẫn kho lưu trữ rõ ràng (không thể kết hợp với `--agent` hoặc `--all-agents`)

Xuất một gói trajectory cho một phiên đã lưu:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Đây là đường dẫn lệnh được lệnh slash `/export-trajectory` sử dụng sau khi chủ sở hữu phê duyệt yêu cầu thực thi. Thư mục đầu ra luôn được phân giải bên trong `.openclaw/trajectory-exports/` dưới workspace đã chọn.

`openclaw sessions --all-agents` đọc các kho lưu trữ agent đã cấu hình. Việc khám phá phiên của Gateway và ACP rộng hơn: chúng cũng bao gồm các kho lưu trữ chỉ có trên đĩa được tìm thấy dưới thư mục gốc `agents/` mặc định hoặc thư mục gốc `session.store` theo mẫu. Các kho lưu trữ được khám phá đó phải phân giải thành các tệp `sessions.json` thông thường bên trong thư mục gốc của agent; symlink và các đường dẫn nằm ngoài thư mục gốc sẽ bị bỏ qua.

Ví dụ JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Bảo trì dọn dẹp

Chạy bảo trì ngay bây giờ (thay vì chờ chu kỳ ghi tiếp theo):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` sử dụng các thiết lập `session.maintenance` từ cấu hình:

- Ghi chú phạm vi: `openclaw sessions cleanup` bảo trì kho lưu trữ phiên, transcript và các sidecar trajectory. Lệnh này không cắt tỉa nhật ký chạy cron (`cron/runs/<jobId>.jsonl`), vốn được quản lý bởi `cron.runLog.maxBytes` và `cron.runLog.keepLines` trong [Cấu hình Cron](/vi/automation/cron-jobs#configuration) và được giải thích trong [Bảo trì Cron](/vi/automation/cron-jobs#maintenance).

- `--dry-run`: xem trước số lượng mục sẽ bị cắt tỉa/giới hạn mà không ghi.
  - Ở chế độ văn bản, dry-run in một bảng hành động theo từng phiên (`Action`, `Key`, `Age`, `Model`, `Flags`) để bạn có thể xem những gì sẽ được giữ lại so với bị xóa.
- `--enforce`: áp dụng bảo trì ngay cả khi `session.maintenance.mode` là `warn`.
- `--fix-missing`: xóa các mục có tệp transcript bị thiếu, ngay cả khi bình thường chúng chưa bị loại theo tuổi/số lượng.
- `--active-key <key>`: bảo vệ một khóa đang hoạt động cụ thể khỏi bị loại bỏ do giới hạn dung lượng đĩa. Các con trỏ hội thoại bên ngoài bền vững, chẳng hạn như phiên nhóm và phiên chat theo phạm vi luồng, cũng được giữ lại bởi bảo trì theo tuổi/số lượng/giới hạn dung lượng đĩa.
- `--agent <id>`: chạy dọn dẹp cho một kho lưu trữ agent đã cấu hình.
- `--all-agents`: chạy dọn dẹp cho tất cả kho lưu trữ agent đã cấu hình.
- `--store <path>`: chạy trên một tệp `sessions.json` cụ thể.
- `--json`: in tóm tắt JSON. Với `--all-agents`, đầu ra bao gồm một tóm tắt cho mỗi kho lưu trữ.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Liên quan:

- Cấu hình phiên: [Tham chiếu cấu hình](/vi/gateway/config-agents#session)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Quản lý phiên](/vi/concepts/session)
