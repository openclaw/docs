---
read_when:
    - Bạn muốn liệt kê các phiên đã lưu và xem hoạt động gần đây
summary: Tài liệu tham chiếu CLI cho `openclaw sessions` (liệt kê các phiên đã lưu + cách sử dụng)
title: Phiên
x-i18n:
    generated_at: "2026-04-29T22:34:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liệt kê các phiên hội thoại đã lưu.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Chọn phạm vi:

- mặc định: kho lưu trữ tác tử mặc định đã cấu hình
- `--verbose`: ghi nhật ký chi tiết
- `--agent <id>`: một kho lưu trữ tác tử đã cấu hình
- `--all-agents`: tổng hợp tất cả kho lưu trữ tác tử đã cấu hình
- `--store <path>`: đường dẫn kho lưu trữ rõ ràng (không thể kết hợp với `--agent` hoặc `--all-agents`)

Xuất một gói quỹ đạo cho phiên đã lưu:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Đây là đường dẫn lệnh được lệnh gạch chéo `/export-trajectory` sử dụng sau khi
chủ sở hữu phê duyệt yêu cầu thực thi. Thư mục đầu ra luôn được phân giải
bên trong `.openclaw/trajectory-exports/` dưới không gian làm việc đã chọn.

`openclaw sessions --all-agents` đọc các kho lưu trữ tác tử đã cấu hình. Việc
khám phá phiên Gateway và ACP rộng hơn: chúng cũng bao gồm các kho lưu trữ chỉ
có trên đĩa được tìm thấy dưới gốc `agents/` mặc định hoặc một gốc `session.store`
theo mẫu. Các kho lưu trữ được phát hiện đó phải phân giải thành các tệp
`sessions.json` thông thường bên trong gốc tác tử; liên kết tượng trưng và các
đường dẫn ngoài gốc sẽ bị bỏ qua.

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

- Ghi chú phạm vi: `openclaw sessions cleanup` bảo trì kho lưu trữ phiên, bản ghi hội thoại và các tệp phụ quỹ đạo. Lệnh này không cắt tỉa nhật ký chạy cron (`cron/runs/<jobId>.jsonl`), các nhật ký này được quản lý bởi `cron.runLog.maxBytes` và `cron.runLog.keepLines` trong [Cấu hình Cron](/vi/automation/cron-jobs#configuration) và được giải thích trong [Bảo trì Cron](/vi/automation/cron-jobs#maintenance).

- `--dry-run`: xem trước số mục sẽ bị cắt tỉa/giới hạn mà không ghi.
  - Ở chế độ văn bản, dry-run in một bảng hành động theo từng phiên (`Action`, `Key`, `Age`, `Model`, `Flags`) để bạn có thể thấy mục nào sẽ được giữ lại hoặc bị xóa.
- `--enforce`: áp dụng bảo trì ngay cả khi `session.maintenance.mode` là `warn`.
- `--fix-missing`: xóa các mục có tệp bản ghi hội thoại bị thiếu, ngay cả khi bình thường chúng chưa đến hạn bị loại theo tuổi/số lượng.
- `--active-key <key>`: bảo vệ một khóa đang hoạt động cụ thể khỏi việc bị loại do ngân sách đĩa.
- `--agent <id>`: chạy dọn dẹp cho một kho lưu trữ tác tử đã cấu hình.
- `--all-agents`: chạy dọn dẹp cho tất cả kho lưu trữ tác tử đã cấu hình.
- `--store <path>`: chạy trên một tệp `sessions.json` cụ thể.
- `--json`: in bản tóm tắt JSON. Với `--all-agents`, đầu ra bao gồm một bản tóm tắt cho mỗi kho lưu trữ.

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
