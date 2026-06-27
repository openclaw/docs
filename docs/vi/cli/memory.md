---
read_when:
    - Bạn muốn lập chỉ mục hoặc tìm kiếm bộ nhớ ngữ nghĩa
    - Bạn đang gỡ lỗi tình trạng khả dụng của bộ nhớ hoặc việc lập chỉ mục
    - Bạn muốn nâng cấp trí nhớ ngắn hạn đã được truy xuất thành `MEMORY.md`
summary: Tham chiếu CLI cho `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Bộ nhớ
x-i18n:
    generated_at: "2026-06-27T17:18:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Quản lý lập chỉ mục và tìm kiếm bộ nhớ ngữ nghĩa.
Được cung cấp bởi Plugin `memory-core` đi kèm. Lệnh này khả dụng khi
`plugins.slots.memory` chọn `memory-core` (mặc định); các Plugin bộ nhớ khác
cung cấp không gian tên CLI riêng của chúng.

Liên quan:

- Khái niệm bộ nhớ: [Bộ nhớ](/vi/concepts/memory)
- Wiki bộ nhớ: [Wiki bộ nhớ](/vi/plugins/memory-wiki)
- CLI wiki: [wiki](/vi/cli/wiki)
- Plugins: [Plugins](/vi/tools/plugin)

## Ví dụ

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Tùy chọn

`memory status` và `memory index`:

- `--agent <id>`: giới hạn phạm vi vào một agent duy nhất. Nếu không có tùy chọn này, các lệnh này chạy cho từng agent đã cấu hình; nếu không có danh sách agent nào được cấu hình, chúng quay về agent mặc định.
- `--verbose`: xuất nhật ký chi tiết trong quá trình thăm dò và lập chỉ mục.

`memory status`:

- `--deep`: thăm dò mức sẵn sàng của kho vector cục bộ, mức sẵn sàng của nhà cung cấp embedding, và mức sẵn sàng của tìm kiếm vector ngữ nghĩa. `memory status` thông thường vẫn nhanh và không chạy embedding trực tiếp hoặc công việc khám phá nhà cung cấp; trạng thái kho vector hoặc vector ngữ nghĩa không xác định nghĩa là trạng thái đó chưa được thăm dò trong lệnh đó. QMD lexical `searchMode: "search"` bỏ qua thăm dò vector ngữ nghĩa và bảo trì embedding ngay cả với `--deep`.
- `--index`: chạy lập chỉ mục lại nếu kho đang bẩn (ngụ ý `--deep`).
- `--fix`: sửa các khóa recall cũ và chuẩn hóa siêu dữ liệu promotion.
- `--json`: in đầu ra JSON.

Nếu `memory status` hiển thị `Dreaming status: blocked`, Cron Dreaming được quản lý đã bật nhưng Heartbeat điều khiển nó không kích hoạt cho agent mặc định. Xem [Dreaming không bao giờ chạy](/vi/concepts/dreaming#dreaming-never-runs-status-shows-blocked) để biết hai nguyên nhân phổ biến.

`memory index`:

- `--force`: buộc lập chỉ mục lại toàn bộ.

`memory search`:

- Đầu vào truy vấn: truyền `[query]` theo vị trí hoặc `--query <text>`.
- Nếu cung cấp cả hai, `--query` được ưu tiên.
- Nếu không cung cấp mục nào, lệnh thoát với lỗi.
- `--agent <id>`: giới hạn phạm vi vào một agent duy nhất (mặc định: agent mặc định).
- `--max-results <n>`: giới hạn số lượng kết quả trả về.
- `--min-score <n>`: lọc bỏ các kết quả khớp có điểm thấp.
- `--json`: in kết quả JSON.

`memory promote`:

Xem trước và áp dụng các promotion bộ nhớ ngắn hạn.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- ghi các promotion vào `MEMORY.md` (mặc định: chỉ xem trước).
- `--limit <n>` -- giới hạn số lượng ứng viên được hiển thị.
- `--include-promoted` -- bao gồm các mục đã được promote trong các chu kỳ trước.

Toàn bộ tùy chọn:

- Xếp hạng các ứng viên ngắn hạn từ `memory/YYYY-MM-DD.md` bằng các tín hiệu promotion có trọng số (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Sử dụng tín hiệu ngắn hạn từ cả memory recalls và các lượt nạp hằng ngày, cộng với tín hiệu củng cố ở pha light/REM.
- Khi Dreaming được bật, `memory-core` tự động quản lý một tác vụ Cron chạy một lượt quét đầy đủ (`light -> REM -> deep`) trong nền (không cần `openclaw cron add` thủ công).
- `--agent <id>`: giới hạn phạm vi vào một agent duy nhất (mặc định: agent mặc định).
- `--limit <n>`: số ứng viên tối đa để trả về/áp dụng.
- `--min-score <n>`: điểm promotion có trọng số tối thiểu.
- `--min-recall-count <n>`: số lần recall tối thiểu cần có cho một ứng viên.
- `--min-unique-queries <n>`: số lượng truy vấn riêng biệt tối thiểu cần có cho một ứng viên.
- `--apply`: nối các ứng viên đã chọn vào `MEMORY.md` và đánh dấu chúng là đã promote.
- `--include-promoted`: bao gồm các ứng viên đã promote trong đầu ra.
- `--json`: in đầu ra JSON.

`memory promote-explain`:

Giải thích một ứng viên promotion cụ thể và phân tích điểm của nó.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: khóa ứng viên, đoạn đường dẫn, hoặc đoạn snippet để tra cứu.
- `--agent <id>`: giới hạn phạm vi vào một agent duy nhất (mặc định: agent mặc định).
- `--include-promoted`: bao gồm các ứng viên đã promote.
- `--json`: in đầu ra JSON.

`memory rem-harness`:

Xem trước các phản chiếu REM, các sự thật ứng viên, và đầu ra promotion sâu mà không ghi gì.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: giới hạn phạm vi vào một agent duy nhất (mặc định: agent mặc định).
- `--include-promoted`: bao gồm các ứng viên sâu đã promote.
- `--json`: in đầu ra JSON.

## Dreaming

Dreaming là hệ thống hợp nhất bộ nhớ nền với ba
pha phối hợp: **light** (sắp xếp/chuyển giai đoạn tài liệu ngắn hạn), **deep** (promote các
sự kiện bền vững vào `MEMORY.md`), và **REM** (phản chiếu và làm nổi bật chủ đề).

- Bật bằng `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Bật/tắt từ chat bằng `/dreaming on|off` (hoặc kiểm tra bằng `/dreaming status`).
- Dreaming chạy theo một lịch quét được quản lý (`dreaming.frequency`) và thực thi các pha theo thứ tự: light, REM, deep.
- Chỉ pha deep ghi bộ nhớ bền vững vào `MEMORY.md`.
- Đầu ra pha dễ đọc cho con người và các mục nhật ký được ghi vào `DREAMS.md` (hoặc `dreams.md` hiện có), với các báo cáo tùy chọn theo từng pha trong `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Việc xếp hạng dùng các tín hiệu có trọng số: tần suất recall, mức liên quan khi truy xuất, độ đa dạng truy vấn, độ gần đây theo thời gian, hợp nhất xuyên ngày, và độ phong phú khái niệm được suy ra.
- Promotion đọc lại ghi chú hằng ngày trực tiếp trước khi ghi vào `MEMORY.md`, nên các snippet ngắn hạn đã chỉnh sửa hoặc xóa sẽ không được promote từ các snapshot recall-store cũ.
- Các lần chạy theo lịch và `memory promote` thủ công dùng chung mặc định pha deep, trừ khi bạn truyền các ghi đè ngưỡng qua CLI.
- Các lần chạy tự động mở rộng trên các không gian làm việc bộ nhớ đã cấu hình.

Lập lịch mặc định:

- **Nhịp quét**: `dreaming.frequency = 0 3 * * *`
- **Ngưỡng deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Ví dụ:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Ghi chú:

- `memory index --verbose` in chi tiết theo từng pha (nhà cung cấp, mô hình, nguồn, hoạt động batch).
- `memory status` bao gồm mọi đường dẫn bổ sung được cấu hình qua `memorySearch.extraPaths`.
- Nếu các trường khóa API từ xa của effectively active memory được cấu hình là SecretRefs, lệnh sẽ phân giải các giá trị đó từ snapshot Gateway đang hoạt động. Nếu Gateway không khả dụng, lệnh thất bại nhanh.
- Ghi chú về lệch phiên bản Gateway: đường dẫn lệnh này yêu cầu một Gateway hỗ trợ `secrets.resolve`; các Gateway cũ hơn trả về lỗi phương thức không xác định.
- Điều chỉnh nhịp quét theo lịch bằng `dreaming.frequency`. Chính sách promotion deep ngoài ra là nội bộ, ngoại trừ `dreaming.phases.deep.maxPromotedSnippetTokens`, vốn giới hạn độ dài snippet được promote trong khi vẫn giữ hiển thị nguồn gốc. Dùng các cờ CLI trên `memory promote` khi bạn cần ghi đè ngưỡng thủ công một lần.
- `memory rem-harness --path <file-or-dir> --grounded` xem trước `What Happened`, `Reflections`, và `Possible Lasting Updates` có căn cứ từ các ghi chú hằng ngày lịch sử mà không ghi gì.
- `memory rem-backfill --path <file-or-dir>` ghi các mục nhật ký có căn cứ và có thể đảo ngược vào `DREAMS.md` để UI xem xét.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` cũng gieo các ứng viên bền vững có căn cứ vào kho promotion ngắn hạn trực tiếp để pha deep bình thường có thể xếp hạng chúng.
- `memory rem-backfill --rollback` xóa các mục nhật ký có căn cứ đã ghi trước đó, và `memory rem-backfill --rollback-short-term` xóa các ứng viên ngắn hạn có căn cứ đã được đưa vào trước đó.
- Xem [Dreaming](/vi/concepts/dreaming) để biết mô tả đầy đủ về các pha và tham chiếu cấu hình.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
