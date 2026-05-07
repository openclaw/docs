---
read_when:
    - Bạn muốn liệt kê các phiên đã lưu và xem hoạt động gần đây
summary: Tham chiếu CLI cho `openclaw sessions` (liệt kê các phiên đã lưu trữ + cách sử dụng)
title: Phiên
x-i18n:
    generated_at: "2026-05-07T13:14:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liệt kê các phiên hội thoại đã lưu trữ.

Danh sách phiên không phải là kiểm tra trạng thái hoạt động của kênh/nhà cung cấp. Chúng hiển thị các hàng hội thoại đã được lưu bền vững từ kho phiên. Một kênh Discord, Slack, Telegram hoặc kênh khác đang yên lặng có thể kết nối lại thành công mà không tạo hàng phiên mới cho đến khi một tin nhắn được xử lý. Dùng `openclaw channels status --probe`, `openclaw status --deep`, hoặc `openclaw health --verbose` khi bạn cần kiểm tra kết nối kênh trực tiếp.

Phản hồi của `openclaw sessions` và Gateway `sessions.list` được giới hạn theo mặc định để các kho lớn tồn tại lâu không thể chiếm độc quyền tiến trình CLI hoặc vòng lặp sự kiện Gateway. CLI trả về 100 phiên mới nhất theo mặc định; truyền `--limit <n>` để lấy cửa sổ nhỏ hơn/lớn hơn hoặc `--limit all` khi bạn chủ ý cần toàn bộ kho. Phản hồi JSON bao gồm `totalCount`, `limitApplied`, và `hasMore` khi bên gọi cần hiển thị rằng còn nhiều hàng hơn.

Máy khách RPC có thể truyền `configuredAgentsOnly: true` để giữ nguồn khám phá kết hợp rộng nhưng chỉ trả về các hàng cho agent hiện có trong cấu hình. Control UI dùng chế độ đó theo mặc định để các kho agent đã xóa hoặc chỉ có trên đĩa không xuất hiện lại trong chế độ xem Phiên.

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

- mặc định: kho agent mặc định đã cấu hình
- `--verbose`: ghi nhật ký chi tiết
- `--agent <id>`: một kho agent đã cấu hình
- `--all-agents`: tổng hợp tất cả kho agent đã cấu hình
- `--store <path>`: đường dẫn kho rõ ràng (không thể kết hợp với `--agent` hoặc `--all-agents`)
- `--limit <n|all>`: số hàng tối đa để xuất (mặc định `100`; `all` khôi phục toàn bộ đầu ra)

Xuất một gói quỹ đạo cho một phiên đã lưu trữ:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Đây là đường dẫn lệnh được lệnh slash `/export-trajectory` sử dụng sau khi chủ sở hữu phê duyệt yêu cầu thực thi. Thư mục đầu ra luôn được phân giải bên trong `.openclaw/trajectory-exports/` dưới workspace đã chọn.

`openclaw sessions --all-agents` đọc các kho agent đã cấu hình. Khám phá phiên của Gateway và ACP rộng hơn: chúng cũng bao gồm các kho chỉ có trên đĩa được tìm thấy dưới gốc `agents/` mặc định hoặc gốc `session.store` theo mẫu. Các kho được khám phá đó phải phân giải thành tệp `sessions.json` thông thường bên trong gốc agent; symlink và đường dẫn nằm ngoài gốc sẽ bị bỏ qua.

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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` dùng thiết lập `session.maintenance` từ cấu hình:

- Ghi chú phạm vi: `openclaw sessions cleanup` bảo trì kho phiên, bản ghi hội thoại và sidecar quỹ đạo. Nó không cắt tỉa nhật ký chạy cron (`cron/runs/<jobId>.jsonl`), vốn được quản lý bởi `cron.runLog.maxBytes` và `cron.runLog.keepLines` trong [cấu hình Cron](/vi/automation/cron-jobs#configuration) và được giải thích trong [bảo trì Cron](/vi/automation/cron-jobs#maintenance).
- Cleanup cũng cắt tỉa bản ghi hội thoại chính không còn được tham chiếu, điểm kiểm tra Compaction, và sidecar quỹ đạo cũ hơn `session.maintenance.pruneAfter`; các tệp vẫn được `sessions.json` tham chiếu sẽ được giữ lại.

- `--dry-run`: xem trước bao nhiêu mục sẽ bị cắt tỉa/giới hạn mà không ghi.
  - Ở chế độ văn bản, dry-run in bảng hành động theo từng phiên (`Action`, `Key`, `Age`, `Model`, `Flags`) để bạn có thể xem mục nào sẽ được giữ lại so với bị xóa.
- `--enforce`: áp dụng bảo trì ngay cả khi `session.maintenance.mode` là `warn`.
- `--fix-missing`: xóa các mục có tệp bản ghi hội thoại bị thiếu, ngay cả khi bình thường chúng chưa bị loại do tuổi/số lượng.
- `--fix-dm-scope`: khi `session.dmScope` là `main`, ngừng dùng các hàng direct-DM cũ được khóa theo peer còn sót lại từ định tuyến `per-peer`, `per-channel-peer`, hoặc `per-account-channel-peer` trước đó. Dùng `--dry-run` trước; áp dụng cleanup sẽ xóa các hàng đó khỏi `sessions.json` và giữ bản ghi hội thoại của chúng làm kho lưu trữ đã xóa.
- `--active-key <key>`: bảo vệ một khóa đang hoạt động cụ thể khỏi bị loại do ngân sách đĩa. Các con trỏ hội thoại bên ngoài bền vững, chẳng hạn phiên nhóm và phiên chat theo phạm vi luồng, cũng được giữ lại bởi bảo trì theo tuổi/số lượng/ngân sách đĩa.
- `--agent <id>`: chạy cleanup cho một kho agent đã cấu hình.
- `--all-agents`: chạy cleanup cho tất cả kho agent đã cấu hình.
- `--store <path>`: chạy trên một tệp `sessions.json` cụ thể.
- `--json`: in tóm tắt JSON. Với `--all-agents`, đầu ra bao gồm một tóm tắt cho mỗi kho.

Khi có thể kết nối tới Gateway, cleanup không phải dry-run cho các kho agent đã cấu hình sẽ được gửi qua Gateway để dùng chung bộ ghi kho phiên giống như lưu lượng runtime. Dùng `--store <path>` để sửa chữa ngoại tuyến rõ ràng cho một tệp kho.

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
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Liên quan:

- Cấu hình phiên: [tham chiếu cấu hình](/vi/gateway/config-agents#session)

## Liên quan

- [tham chiếu CLI](/vi/cli)
- [quản lý phiên](/vi/concepts/session)
