---
read_when:
    - Bạn muốn liệt kê các phiên đã lưu và xem hoạt động gần đây
summary: Tài liệu tham chiếu CLI cho `openclaw sessions` (liệt kê các phiên đã lưu + cách sử dụng)
title: Phiên làm việc
x-i18n:
    generated_at: "2026-05-05T08:25:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liệt kê các phiên hội thoại đã lưu.

Danh sách phiên không phải là kiểm tra trạng thái hoạt động của kênh/nhà cung cấp. Chúng hiển thị các hàng hội thoại đã được lưu bền vững từ kho lưu trữ phiên. Một Discord, Slack, Telegram hoặc kênh khác đang im lặng vẫn có thể kết nối lại thành công mà không tạo hàng phiên mới cho đến khi một tin nhắn được xử lý. Dùng `openclaw channels status --probe`, `openclaw status --deep`, hoặc `openclaw health --verbose` khi bạn cần kiểm tra kết nối kênh trực tiếp.

Phản hồi của `openclaw sessions` và Gateway `sessions.list` được giới hạn theo mặc định để các kho lưu trữ lớn tồn tại lâu không thể chiếm độc quyền tiến trình CLI hoặc vòng lặp sự kiện Gateway. Theo mặc định, CLI trả về 100 phiên mới nhất; truyền `--limit <n>` để lấy một cửa sổ nhỏ hơn/lớn hơn hoặc `--limit all` khi bạn chủ ý cần toàn bộ kho lưu trữ. Phản hồi JSON bao gồm `totalCount`, `limitApplied`, và `hasMore` khi bên gọi cần hiển thị rằng vẫn còn thêm hàng.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Chọn phạm vi:

- mặc định: kho lưu trữ tác nhân mặc định đã cấu hình
- `--verbose`: ghi log chi tiết
- `--agent <id>`: một kho lưu trữ tác nhân đã cấu hình
- `--all-agents`: tổng hợp tất cả kho lưu trữ tác nhân đã cấu hình
- `--store <path>`: đường dẫn kho lưu trữ rõ ràng (không thể kết hợp với `--agent` hoặc `--all-agents`)
- `--limit <n|all>`: số hàng tối đa để xuất (mặc định `100`; `all` khôi phục đầu ra đầy đủ)

Xuất một gói quỹ đạo cho một phiên đã lưu:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Đây là đường dẫn lệnh được dùng bởi lệnh gạch chéo `/export-trajectory` sau khi chủ sở hữu phê duyệt yêu cầu exec. Thư mục đầu ra luôn được phân giải bên trong `.openclaw/trajectory-exports/` dưới workspace đã chọn.

`openclaw sessions --all-agents` đọc các kho lưu trữ tác nhân đã cấu hình. Việc khám phá phiên của Gateway và ACP rộng hơn: chúng cũng bao gồm các kho chỉ có trên đĩa được tìm thấy dưới gốc `agents/` mặc định hoặc gốc `session.store` theo mẫu. Các kho được khám phá đó phải phân giải thành các tệp `sessions.json` thông thường bên trong gốc tác nhân; symlink và đường dẫn ngoài gốc sẽ bị bỏ qua.

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
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
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

`openclaw sessions cleanup` dùng các thiết lập `session.maintenance` từ cấu hình:

- Ghi chú phạm vi: `openclaw sessions cleanup` bảo trì kho lưu trữ phiên, bản ghi transcript, và các tệp phụ trợ quỹ đạo. Nó không cắt tỉa log chạy cron (`cron/runs/<jobId>.jsonl`), vốn được quản lý bởi `cron.runLog.maxBytes` và `cron.runLog.keepLines` trong [cấu hình Cron](/vi/automation/cron-jobs#configuration) và được giải thích trong [bảo trì Cron](/vi/automation/cron-jobs#maintenance).
- Việc dọn dẹp cũng cắt tỉa các transcript chính không được tham chiếu, điểm kiểm tra Compaction, và tệp phụ trợ quỹ đạo cũ hơn `session.maintenance.pruneAfter`; các tệp vẫn được `sessions.json` tham chiếu sẽ được giữ lại.

- `--dry-run`: xem trước bao nhiêu mục sẽ bị cắt tỉa/giới hạn mà không ghi dữ liệu.
  - Ở chế độ văn bản, dry-run in một bảng hành động theo từng phiên (`Action`, `Key`, `Age`, `Model`, `Flags`) để bạn có thể thấy mục nào sẽ được giữ lại so với bị xóa.
- `--enforce`: áp dụng bảo trì ngay cả khi `session.maintenance.mode` là `warn`.
- `--fix-missing`: xóa các mục có tệp transcript bị thiếu, ngay cả khi bình thường chúng chưa bị loại theo tuổi/số lượng.
- `--active-key <key>`: bảo vệ một khóa đang hoạt động cụ thể khỏi bị loại do ngân sách đĩa. Các con trỏ hội thoại bên ngoài bền vững, chẳng hạn như phiên nhóm và phiên trò chuyện theo phạm vi luồng, cũng được bảo toàn bởi bảo trì theo tuổi/số lượng/ngân sách đĩa.
- `--agent <id>`: chạy dọn dẹp cho một kho lưu trữ tác nhân đã cấu hình.
- `--all-agents`: chạy dọn dẹp cho tất cả kho lưu trữ tác nhân đã cấu hình.
- `--store <path>`: chạy trên một tệp `sessions.json` cụ thể.
- `--json`: in bản tóm tắt JSON. Với `--all-agents`, đầu ra bao gồm một bản tóm tắt cho mỗi kho lưu trữ.

Khi có thể truy cập Gateway, việc dọn dẹp không phải dry-run cho các kho lưu trữ tác nhân đã cấu hình được gửi qua Gateway để nó dùng chung trình ghi kho lưu trữ phiên với lưu lượng runtime. Dùng `--store <path>` để sửa chữa ngoại tuyến rõ ràng một tệp kho lưu trữ.

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
