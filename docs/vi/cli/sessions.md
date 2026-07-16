---
read_when:
    - Bạn muốn liệt kê các phiên đã lưu và xem hoạt động gần đây
summary: Tài liệu tham khảo CLI cho `openclaw sessions` (liệt kê các phiên đã lưu trữ + mức sử dụng)
title: Phiên làm việc
x-i18n:
    generated_at: "2026-07-16T14:17:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liệt kê các phiên hội thoại đã lưu trữ.

Danh sách phiên không phải là phép kiểm tra trạng thái hoạt động của kênh/nhà cung cấp. Chúng hiển thị các hàng hội thoại được duy trì
từ kho lưu trữ phiên. Một kênh Discord, Slack, Telegram hoặc
kênh khác đang yên lặng có thể kết nối lại thành công mà không tạo hàng phiên mới
cho đến khi một tin nhắn được xử lý. Sử dụng `openclaw channels status --probe`,
`openclaw status --deep` hoặc `openclaw health --verbose` khi cần kiểm tra kết nối
kênh trực tiếp.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Cờ:

| Cờ                   | Mô tả                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Một kho tác nhân đã cấu hình (mặc định: tác nhân mặc định đã cấu hình). |
| `--all-agents`       | Tổng hợp tất cả kho tác nhân đã cấu hình.                              |
| `--store <path>`     | Đường dẫn kho tường minh (không thể kết hợp với `--agent` hoặc `--all-agents`). |
| `--active <minutes>` | Chỉ hiển thị các phiên được cập nhật trong N phút qua.                 |
| `--limit <n\|all>`   | Số hàng đầu ra tối đa (mặc định `100`; `all` khôi phục toàn bộ đầu ra). |
| `--json`             | Đầu ra dành cho máy đọc.                                               |
| `--verbose`          | Ghi nhật ký chi tiết.                                                  |

`openclaw sessions` và RPC `sessions.list` của Gateway được giới hạn theo mặc định
để các kho lớn, tồn tại lâu dài không thể chiếm độc quyền tiến trình CLI hoặc vòng lặp sự kiện
của Gateway. CLI trả về 100 phiên mới nhất theo mặc định; truyền `--limit <n>`
để lấy phạm vi nhỏ hơn/lớn hơn hoặc `--limit all` khi chủ đích cần
toàn bộ kho. Phản hồi JSON bao gồm `totalCount`, `limitApplied` và `hasMore`
khi bên gọi cần cho biết rằng vẫn còn các hàng khác.

Máy khách RPC có thể truyền `configuredAgentsOnly: true` để giữ nguồn
khám phá kết hợp rộng nhưng chỉ trả về các hàng của những tác nhân hiện có trong cấu hình.
Control UI sử dụng chế độ đó theo mặc định để các kho tác nhân đã xóa hoặc chỉ tồn tại trên đĩa
không xuất hiện lại trong chế độ xem Phiên.

`--all-agents` đọc các kho tác nhân đã cấu hình. Cơ chế khám phá phiên của Gateway và ACP
rộng hơn: chúng cũng bao gồm các kho SQLite được phân giải từ
gốc tác nhân đã cấu hình hoặc gốc `session.store` theo mẫu. Các đường dẫn bộ chọn
cũ phải được phân giải bên trong gốc tác nhân; liên kết tượng trưng và đường dẫn nằm ngoài gốc
sẽ bị bỏ qua.

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Theo dõi tiến trình quỹ đạo

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` hiển thị các sự kiện quỹ đạo thời gian chạy gần đây dưới dạng
các dòng tiến trình cô đọng. Khi không có `--session-key`, lệnh sẽ theo dõi các phiên đang chạy trước, sau đó
đến phiên được lưu trữ gần nhất. `--tail <count>` kiểm soát số lượng sự kiện hiện có
được in trước chế độ theo dõi; mặc định là `80`, còn `0` bắt đầu tại điểm cuối hiện tại.
`--follow` tiếp tục theo dõi phiên sử dụng SQLite đã chọn hoặc một
tệp quỹ đạo cũ được chỉ định rõ.

Chế độ xem tiến trình được thiết kế thận trọng: văn bản lời nhắc, đối số công cụ
và nội dung kết quả công cụ không được in. Lệnh gọi công cụ hiển thị tên công cụ cùng với
`{...redacted...}`; kết quả công cụ hiển thị trạng thái như `ok`, `error` hoặc `done`;
các dòng hoàn tất của mô hình hiển thị nhà cung cấp/mô hình và trạng thái kết thúc.

## Xuất một gói quỹ đạo

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Đây là đường dẫn lệnh được lệnh gạch chéo `/export-trajectory` sử dụng sau khi
chủ sở hữu phê duyệt yêu cầu thực thi. Thư mục đầu ra luôn được phân giải
bên trong `.openclaw/trajectory-exports/` thuộc không gian làm việc đã chọn.

## Bảo trì dọn dẹp

Chạy bảo trì ngay thay vì chờ chu kỳ ghi tiếp theo:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` sử dụng các thiết lập `session.maintenance` từ cấu hình
([Tham chiếu cấu hình](/vi/gateway/config-agents#session)):

- Lưu ý về phạm vi: `openclaw sessions cleanup` duy trì kho phiên,
  bản chép lời, các hàng quỹ đạo và tệp phụ quỹ đạo cũ. Lệnh không
  cắt tỉa lịch sử chạy Cron, vốn tự động giữ lại 2000 hàng mới nhất cho mỗi tác vụ
  ([Cấu hình Cron](/vi/automation/cron-jobs#configuration)).
- Quá trình dọn dẹp cũng cắt tỉa các thành phần bản chép lời cũ/lưu trữ không được tham chiếu,
  các điểm kiểm tra Compaction và tệp phụ quỹ đạo cũ hơn
  `session.maintenance.pruneAfter`; các thành phần vẫn được hàng phiên SQLite
  tham chiếu sẽ được giữ lại.
- Quá trình dọn dẹp báo cáo riêng việc dọn dẹp các phép dò chạy mô hình Gateway tồn tại ngắn hạn dưới dạng
  `modelRunPruned`. Thao tác này chỉ khớp với các khóa tường minh nghiêm ngặt có dạng
  `agent:*:explicit:model-run-<uuid>`. Thời gian lưu giữ được cố định là `24h` và
  bị giới hạn theo áp lực: thao tác chỉ xóa các hàng phép dò cũ khi đạt đến
  áp lực bảo trì/giới hạn mục nhập phiên. Khi chạy, quá trình dọn dẹp lượt chạy mô hình
  diễn ra trước quá trình dọn dẹp toàn cục các mục cũ và áp dụng giới hạn.

Cờ:

| Cờ                   | Mô tả                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Xem trước số lượng mục sẽ bị cắt tỉa/giới hạn mà không ghi. Ở chế độ văn bản, in bảng hành động theo từng phiên (`Action`, `Key`, `Age`, `Model`, `Flags`) cùng bản tóm tắt được nhóm theo nhãn phiên. |
| `--enforce`          | Áp dụng bảo trì ngay cả khi `session.maintenance.mode` là `warn`.                                                                                                                                                                                                                                       |
| `--fix-missing`      | Xóa các mục cũ có thành phần bản chép lời được lưu trữ bị thiếu hoặc chỉ có phần đầu/trống, ngay cả khi thông thường chúng chưa hết hạn/chưa vượt số lượng.                                                                                                                                                  |
| `--fix-dm-scope`     | Khi `session.dmScope` là `main`, loại bỏ các hàng tin nhắn trực tiếp cũ được định khóa theo đối tác còn sót lại từ định tuyến `per-peer`, `per-channel-peer` hoặc `per-account-channel-peer` trước đây. Trước tiên hãy dùng `--dry-run`; khi áp dụng, thao tác sẽ xóa các hàng đó khỏi SQLite và giữ thành phần bản chép lời cũ của chúng dưới dạng bản lưu trữ đã xóa. |
| `--active-key <key>` | Bảo vệ một khóa đang hoạt động cụ thể khỏi bị loại bỏ do ngân sách đĩa. Các con trỏ hội thoại bên ngoài bền vững, chẳng hạn như phiên nhóm và phiên trò chuyện theo phạm vi luồng, cũng được giữ lại khi bảo trì theo tuổi/số lượng/ngân sách đĩa.                                                          |
| `--agent <id>`       | Chạy dọn dẹp cho một kho tác nhân đã cấu hình.                                                                                                                                                                                                                                                             |
| `--all-agents`       | Chạy dọn dẹp cho tất cả kho tác nhân đã cấu hình.                                                                                                                                                                                                                                                          |
| `--store <path>`     | Chạy với một đường dẫn bộ chọn kho cũ cụ thể.                                                                                                                                                                                                                                                              |
| `--json`             | In bản tóm tắt JSON. Với `--all-agents`, đầu ra bao gồm một bản tóm tắt cho mỗi kho.                                                                                                                                                                                                                    |

Khi có thể kết nối với Gateway, thao tác dọn dẹp không phải chạy thử cho các kho tác nhân đã cấu hình
được gửi qua Gateway để dùng chung trình ghi kho phiên với lưu lượng
thời gian chạy. Sử dụng `--store <path>` để sửa chữa ngoại tuyến tường minh cho một bộ chọn
kho cũ.

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

## Thu gọn một phiên

Thu hồi ngân sách ngữ cảnh cho một phiên bị kẹt hoặc quá lớn. `openclaw sessions
compact <key>` là trình bao bọc chính thức quanh RPC Gateway `sessions.compact`
và yêu cầu Gateway đang chạy.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Khi không có `--max-lines`, Gateway dùng LLM để tóm tắt bản chép lời. Theo mặc định, CLI
  không áp đặt thời hạn phía máy khách; Gateway sở hữu vòng đời
  Compaction đã cấu hình.
- Khi có `--max-lines <n>`, thao tác cắt ngắn xuống còn `n` dòng bản chép lời cuối cùng và
  lưu trữ bản chép lời trước đó dưới dạng tệp phụ `.bak`.
- `--agent <id>`: tác nhân sở hữu phiên; bắt buộc đối với các khóa `global`.
- `--url` / `--token` / `--password`: các giá trị ghi đè kết nối Gateway.
- `--timeout <ms>`: thời gian chờ RPC tùy chọn phía máy khách, tính bằng mili giây.
- `--json`: in tải trọng RPC thô.

Lệnh thoát với mã khác 0 khi Gateway báo Compaction thất bại hoặc không thể
truy cập, nhờ đó Cron và tập lệnh không bao giờ nhầm một thao tác im lặng không làm gì là thành công.

<Note>
`openclaw agent --message '/compact ...'` **không phải** là đường dẫn Compaction. Các lệnh gạch chéo
từ CLI bị bước kiểm tra người gửi được ủy quyền từ chối; lần gọi đó thoát với mã
khác 0 kèm hướng dẫn trỏ đến đây thay vì âm thầm không làm gì.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` chấp nhận:

| Trường     | Kiểu        | Bắt buộc | Mô tả                                                      |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | chuỗi       | có       | Khóa phiên cần Compaction (ví dụ: `agent:main:main`).      |
| `agentId`  | chuỗi       | không    | ID tác tử sở hữu phiên (đối với khóa `global`).           |
| `maxLines` | số nguyên ≥ 1 | không    | Cắt bớt để chỉ giữ N dòng cuối thay vì tóm tắt bằng LLM.   |

Ví dụ phản hồi tóm tắt bằng LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Ví dụ phản hồi cắt bớt (`--max-lines 200`):

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

- [Cấu hình phiên](/vi/gateway/config-agents#session)
- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tài liệu tham khảo CLI](/vi/cli)
