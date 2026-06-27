---
read_when:
    - Bạn muốn liệt kê các phiên đã lưu và xem hoạt động gần đây
summary: Tài liệu tham khảo CLI cho `openclaw sessions` (liệt kê các phiên đã lưu + cách sử dụng)
title: Phiên
x-i18n:
    generated_at: "2026-06-27T17:20:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liệt kê các phiên hội thoại đã lưu.

Danh sách phiên không phải là kiểm tra trạng thái hoạt động của kênh/nhà cung cấp. Chúng hiển thị các hàng hội thoại được lưu bền từ kho phiên. Một kênh Discord, Slack, Telegram hoặc kênh khác đang im lặng có thể kết nối lại thành công mà không tạo hàng phiên mới cho đến khi một tin nhắn được xử lý. Dùng `openclaw channels status --probe`, `openclaw status --deep` hoặc `openclaw health --verbose` khi bạn cần kết nối kênh trực tiếp.

Phản hồi của `openclaw sessions` và Gateway `sessions.list` được giới hạn mặc định để các kho lớn tồn tại lâu không thể độc chiếm tiến trình CLI hoặc vòng lặp sự kiện Gateway. CLI trả về 100 phiên mới nhất theo mặc định; truyền `--limit <n>` để có cửa sổ nhỏ hơn/lớn hơn hoặc `--limit all` khi bạn cố ý cần toàn bộ kho. Phản hồi JSON bao gồm `totalCount`, `limitApplied` và `hasMore` khi trình gọi cần hiển thị rằng còn nhiều hàng hơn.

Máy khách RPC có thể truyền `configuredAgentsOnly: true` để giữ nguồn khám phá kết hợp rộng nhưng chỉ trả về các hàng cho tác tử hiện đang có trong cấu hình. Control UI dùng chế độ đó theo mặc định để các kho tác tử đã xóa hoặc chỉ tồn tại trên đĩa không xuất hiện lại trong chế độ xem Sessions.

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

- mặc định: kho tác tử mặc định đã cấu hình
- `--verbose`: ghi nhật ký chi tiết
- `--agent <id>`: một kho tác tử đã cấu hình
- `--all-agents`: tổng hợp tất cả kho tác tử đã cấu hình
- `--store <path>`: đường dẫn kho rõ ràng (không thể kết hợp với `--agent` hoặc `--all-agents`)
- `--limit <n|all>`: số hàng tối đa để xuất (mặc định `100`; `all` khôi phục đầu ra đầy đủ)

Theo dõi tiến trình trajectory dễ đọc cho các phiên đã lưu:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` hiển thị các sự kiện JSONL trajectory gần đây dưới dạng các dòng tiến trình gọn. Khi không có `--session-key`, lệnh này theo dõi các phiên đang chạy trước, rồi đến phiên đã lưu mới nhất. `--tail <count>` kiểm soát số sự kiện hiện có được in trước chế độ theo dõi; mặc định là `80`, và `0` bắt đầu ở cuối hiện tại. `--follow` tiếp tục theo dõi các tệp trajectory đã chọn, bao gồm các tệp đã di chuyển được tham chiếu bởi `<session>.trajectory-path.json`.

Chế độ xem tiến trình được cố ý giữ thận trọng: văn bản prompt, đối số công cụ và nội dung kết quả công cụ không được in. Lệnh gọi công cụ hiển thị tên công cụ với `{...redacted...}`; kết quả công cụ hiển thị trạng thái như `ok`, `error` hoặc `done`; dòng hoàn tất mô hình hiển thị nhà cung cấp/mô hình và trạng thái kết thúc.

Xuất một gói trajectory cho phiên đã lưu:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Đây là đường dẫn lệnh được lệnh slash `/export-trajectory` dùng sau khi chủ sở hữu phê duyệt yêu cầu exec. Thư mục đầu ra luôn được phân giải bên trong `.openclaw/trajectory-exports/` dưới workspace đã chọn.

`openclaw sessions --all-agents` đọc các kho tác tử đã cấu hình. Khám phá phiên Gateway và ACP rộng hơn: chúng cũng bao gồm các kho chỉ tồn tại trên đĩa được tìm thấy dưới gốc `agents/` mặc định hoặc gốc `session.store` theo mẫu. Các kho được khám phá đó phải phân giải thành tệp `sessions.json` thông thường bên trong gốc tác tử; symlink và đường dẫn ngoài gốc bị bỏ qua.

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

Chạy bảo trì ngay bây giờ (thay vì đợi chu kỳ ghi tiếp theo):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` dùng cài đặt `session.maintenance` từ cấu hình:

- Ghi chú phạm vi: `openclaw sessions cleanup` bảo trì kho phiên, bản ghi transcript và các sidecar trajectory. Lệnh này không cắt tỉa lịch sử chạy cron, vốn được quản lý bởi `cron.runLog.keepLines` trong [Cấu hình Cron](/vi/automation/cron-jobs#configuration) và được giải thích trong [Bảo trì Cron](/vi/automation/cron-jobs#maintenance).
- Dọn dẹp cũng cắt tỉa các transcript chính không được tham chiếu, checkpoint Compaction và sidecar trajectory cũ hơn `session.maintenance.pruneAfter`; các tệp vẫn được `sessions.json` tham chiếu sẽ được giữ lại.
- Dọn dẹp báo cáo riêng phần dọn dẹp probe chạy mô hình Gateway ngắn hạn dưới dạng `modelRunPruned`. Phần này chỉ khớp các khóa rõ ràng nghiêm ngặt có dạng `agent:*:explicit:model-run-<uuid>`. Thời gian giữ cố định là `24h`, nhưng có cổng áp lực: nó chỉ xóa các hàng probe cũ khi bảo trì mục phiên/áp lực giới hạn đạt ngưỡng. Khi chạy, dọn dẹp model-run diễn ra trước dọn dẹp cũ toàn cục và giới hạn số lượng.

- `--dry-run`: xem trước số mục sẽ bị cắt tỉa/giới hạn mà không ghi.
  - Ở chế độ văn bản, dry-run in bảng hành động theo từng phiên (`Action`, `Key`, `Age`, `Model`, `Flags`) cùng phần tóm tắt được nhóm theo nhãn phiên để bạn có thể thấy mục nào sẽ được giữ lại và mục nào sẽ bị xóa.
- `--enforce`: áp dụng bảo trì ngay cả khi `session.maintenance.mode` là `warn`.
- `--fix-missing`: xóa các mục có tệp transcript bị thiếu hoặc chỉ có header/trống, ngay cả khi bình thường chúng chưa bị loại do tuổi/số lượng.
- `--fix-dm-scope`: khi `session.dmScope` là `main`, loại bỏ các hàng direct-DM cũ theo khóa peer còn sót lại từ định tuyến `per-peer`, `per-channel-peer` hoặc `per-account-channel-peer` trước đây. Dùng `--dry-run` trước; áp dụng dọn dẹp sẽ xóa các hàng đó khỏi `sessions.json` và giữ transcript của chúng dưới dạng kho lưu trữ đã xóa.
- `--active-key <key>`: bảo vệ một khóa đang hoạt động cụ thể khỏi bị loại do ngân sách đĩa. Các con trỏ hội thoại bên ngoài bền vững, như phiên nhóm và phiên trò chuyện theo phạm vi thread, cũng được giữ lại bởi bảo trì theo tuổi/số lượng/ngân sách đĩa.
- `--agent <id>`: chạy dọn dẹp cho một kho tác tử đã cấu hình.
- `--all-agents`: chạy dọn dẹp cho tất cả kho tác tử đã cấu hình.
- `--store <path>`: chạy trên một tệp `sessions.json` cụ thể.
- `--json`: in tóm tắt JSON. Với `--all-agents`, đầu ra bao gồm một tóm tắt cho mỗi kho.

Khi có thể truy cập Gateway, dọn dẹp không phải dry-run cho các kho tác tử đã cấu hình được gửi qua Gateway để dùng chung bộ ghi kho phiên với lưu lượng runtime. Dùng `--store <path>` để sửa chữa ngoại tuyến rõ ràng cho một tệp kho.

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

## Compact một phiên

Thu hồi ngân sách ngữ cảnh cho một phiên bị kẹt hoặc quá lớn. `openclaw sessions compact <key>` là wrapper hạng nhất quanh RPC Gateway `sessions.compact` và yêu cầu Gateway đang chạy.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Khi không có `--max-lines`, LLM của gateway tóm tắt transcript. Việc này có thể chậm, nên `--timeout` mặc định là `180000` ms.
- Với `--max-lines <n>`, lệnh cắt ngắn còn `n` dòng transcript cuối cùng và lưu trữ transcript trước đó dưới dạng sidecar `.bak`.
- `--agent <id>`: tác tử sở hữu phiên; bắt buộc với khóa `global`.
- `--url` / `--token` / `--password`: ghi đè kết nối gateway.
- `--timeout <ms>`: thời gian chờ RPC tính bằng mili giây.
- `--json`: in payload RPC thô.

Lệnh thoát khác 0 khi gateway báo Compaction thất bại hoặc không thể truy cập, nên cron và script không bao giờ nhầm một thao tác không làm gì trong im lặng là thành công.

> Lưu ý: `openclaw agent --message '/compact ...'` **không** phải là đường dẫn Compaction. Lệnh slash từ CLI bị kiểm tra authorized-sender từ chối; lời gọi đó thoát khác 0 với hướng dẫn trỏ đến đây thay vì âm thầm không làm gì.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` chấp nhận:

| Trường     | Kiểu        | Bắt buộc | Mô tả                                                       |
| ---------- | ----------- | -------- | ----------------------------------------------------------- |
| `key`      | string      | có       | Khóa phiên cần compact (ví dụ `agent:main:main`).           |
| `agentId`  | string      | không    | Id tác tử sở hữu phiên (đối với khóa `global`).             |
| `maxLines` | integer ≥ 1 | không    | Cắt ngắn còn N dòng cuối cùng thay vì tóm tắt bằng LLM.     |

Ví dụ phản hồi tóm tắt bằng LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Ví dụ phản hồi cắt ngắn (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Liên quan

- Cấu hình phiên: [Tham chiếu cấu hình](/vi/gateway/config-agents#session)
- [Tham chiếu CLI](/vi/cli)
- [Quản lý phiên](/vi/concepts/session)
