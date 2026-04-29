---
read_when:
    - Bạn muốn lập chỉ mục hoặc tìm kiếm bộ nhớ ngữ nghĩa
    - Bạn đang gỡ lỗi tính khả dụng của bộ nhớ hoặc việc lập chỉ mục
    - Bạn muốn nâng cấp bộ nhớ ngắn hạn đã truy xuất thành `MEMORY.md`
summary: Tài liệu tham chiếu CLI cho `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Bộ nhớ
x-i18n:
    generated_at: "2026-04-29T22:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Quản lý lập chỉ mục và tìm kiếm bộ nhớ ngữ nghĩa.
Được cung cấp bởi Plugin Active Memory đang hoạt động (mặc định: `memory-core`; đặt `plugins.slots.memory = "none"` để tắt).

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

- `--agent <id>`: giới hạn phạm vi vào một tác tử duy nhất. Nếu không có tùy chọn này, các lệnh này chạy cho từng tác tử đã cấu hình; nếu chưa cấu hình danh sách tác tử, chúng sẽ quay về tác tử mặc định.
- `--verbose`: phát nhật ký chi tiết trong khi thăm dò và lập chỉ mục.

`memory status`:

- `--deep`: thăm dò khả năng dùng vector + embedding. `memory status` thường vẫn chạy nhanh và không chạy ping embedding trực tiếp. QMD từ vựng `searchMode: "search"` bỏ qua các thăm dò vector ngữ nghĩa và bảo trì embedding ngay cả khi có `--deep`.
- `--index`: chạy lập chỉ mục lại nếu kho đang bẩn (ngụ ý `--deep`).
- `--fix`: sửa các khóa recall cũ và chuẩn hóa siêu dữ liệu promotion.
- `--json`: in đầu ra JSON.

Nếu `memory status` hiển thị `Dreaming status: blocked`, cron Dreaming được quản lý đang bật nhưng Heartbeat điều khiển nó không kích hoạt cho tác tử mặc định. Xem [Dreaming không bao giờ chạy](/vi/concepts/dreaming#dreaming-never-runs-status-shows-blocked) để biết hai nguyên nhân phổ biến.

`memory index`:

- `--force`: buộc lập chỉ mục lại toàn bộ.

`memory search`:

- Đầu vào truy vấn: truyền `[query]` theo vị trí hoặc `--query <text>`.
- Nếu cung cấp cả hai, `--query` sẽ được ưu tiên.
- Nếu không cung cấp mục nào, lệnh thoát với lỗi.
- `--agent <id>`: giới hạn phạm vi vào một tác tử duy nhất (mặc định: tác tử mặc định).
- `--max-results <n>`: giới hạn số lượng kết quả trả về.
- `--min-score <n>`: lọc bỏ các kết quả khớp có điểm thấp.
- `--json`: in kết quả JSON.

`memory promote`:

Xem trước và áp dụng các promotion bộ nhớ ngắn hạn.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- ghi promotion vào `MEMORY.md` (mặc định: chỉ xem trước).
- `--limit <n>` -- giới hạn số lượng ứng viên được hiển thị.
- `--include-promoted` -- bao gồm các mục đã được promote trong những chu kỳ trước.

Tùy chọn đầy đủ:

- Xếp hạng các ứng viên ngắn hạn từ `memory/YYYY-MM-DD.md` bằng các tín hiệu promotion có trọng số (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Sử dụng tín hiệu ngắn hạn từ cả các lần recall bộ nhớ và các lượt nhập hằng ngày, cộng với tín hiệu củng cố pha light/REM.
- Khi Dreaming được bật, `memory-core` tự động quản lý một công việc cron chạy một lượt quét đầy đủ (`light -> REM -> deep`) trong nền (không cần `openclaw cron add` thủ công).
- `--agent <id>`: giới hạn phạm vi vào một tác tử duy nhất (mặc định: tác tử mặc định).
- `--limit <n>`: số ứng viên tối đa để trả về/áp dụng.
- `--min-score <n>`: điểm promotion có trọng số tối thiểu.
- `--min-recall-count <n>`: số lần recall tối thiểu bắt buộc cho một ứng viên.
- `--min-unique-queries <n>`: số truy vấn riêng biệt tối thiểu bắt buộc cho một ứng viên.
- `--apply`: nối các ứng viên đã chọn vào `MEMORY.md` và đánh dấu chúng là đã promote.
- `--include-promoted`: bao gồm các ứng viên đã promote trong đầu ra.
- `--json`: in đầu ra JSON.

`memory promote-explain`:

Giải thích một ứng viên promotion cụ thể và phân tích điểm của nó.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: khóa ứng viên, đoạn đường dẫn, hoặc đoạn trích để tra cứu.
- `--agent <id>`: giới hạn phạm vi vào một tác tử duy nhất (mặc định: tác tử mặc định).
- `--include-promoted`: bao gồm các ứng viên đã promote.
- `--json`: in đầu ra JSON.

`memory rem-harness`:

Xem trước các phản tư REM, chân lý ứng viên và đầu ra promotion sâu mà không ghi gì.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: giới hạn phạm vi vào một tác tử duy nhất (mặc định: tác tử mặc định).
- `--include-promoted`: bao gồm các ứng viên sâu đã promote.
- `--json`: in đầu ra JSON.

## Dreaming

Dreaming là hệ thống củng cố bộ nhớ nền với ba pha phối hợp
với nhau: **light** (sắp xếp/chuyển vào khu vực chờ tài liệu ngắn hạn), **deep** (promote
các sự kiện bền vững vào `MEMORY.md`), và **REM** (phản tư và làm nổi bật các chủ đề).

- Bật bằng `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Bật/tắt từ chat bằng `/dreaming on|off` (hoặc kiểm tra bằng `/dreaming status`).
- Dreaming chạy theo một lịch quét được quản lý (`dreaming.frequency`) và thực thi các pha theo thứ tự: light, REM, deep.
- Chỉ pha deep ghi bộ nhớ bền vững vào `MEMORY.md`.
- Đầu ra pha dạng dễ đọc cho con người và các mục nhật ký được ghi vào `DREAMS.md` (hoặc `dreams.md` hiện có), cùng các báo cáo tùy chọn theo từng pha trong `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Xếp hạng sử dụng các tín hiệu có trọng số: tần suất recall, mức liên quan khi truy xuất, độ đa dạng truy vấn, độ gần đây theo thời gian, củng cố qua nhiều ngày, và độ phong phú khái niệm được suy ra.
- Promotion đọc lại ghi chú hằng ngày trực tiếp trước khi ghi vào `MEMORY.md`, để các đoạn trích ngắn hạn đã chỉnh sửa hoặc xóa không được promote từ ảnh chụp nhanh kho recall đã cũ.
- Các lần chạy `memory promote` theo lịch và thủ công dùng chung mặc định pha deep, trừ khi bạn truyền các ghi đè ngưỡng CLI.
- Các lần chạy tự động được phân tán trên các workspace bộ nhớ đã cấu hình.

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
- Nếu các trường khóa API từ xa của Active Memory đang thực sự hoạt động được cấu hình dưới dạng SecretRefs, lệnh sẽ phân giải các giá trị đó từ ảnh chụp nhanh Gateway đang hoạt động. Nếu Gateway không khả dụng, lệnh sẽ thất bại nhanh.
- Ghi chú về lệch phiên bản Gateway: đường dẫn lệnh này yêu cầu Gateway hỗ trợ `secrets.resolve`; Gateway cũ hơn trả về lỗi phương thức không xác định.
- Điều chỉnh nhịp quét theo lịch bằng `dreaming.frequency`. Chính sách promotion deep ngoài ra là nội bộ; dùng cờ CLI trên `memory promote` khi bạn cần ghi đè thủ công một lần.
- `memory rem-harness --path <file-or-dir> --grounded` xem trước `What Happened`, `Reflections`, và `Possible Lasting Updates` có căn cứ từ các ghi chú hằng ngày lịch sử mà không ghi gì.
- `memory rem-backfill --path <file-or-dir>` ghi các mục nhật ký có căn cứ và có thể đảo ngược vào `DREAMS.md` để xem xét trong UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` cũng gieo các ứng viên bền vững có căn cứ vào kho promotion ngắn hạn trực tiếp để pha deep thông thường có thể xếp hạng chúng.
- `memory rem-backfill --rollback` xóa các mục nhật ký có căn cứ đã ghi trước đó, và `memory rem-backfill --rollback-short-term` xóa các ứng viên ngắn hạn có căn cứ đã được chuyển vào khu vực chờ trước đó.
- Xem [Dreaming](/vi/concepts/dreaming) để biết mô tả đầy đủ về các pha và tham chiếu cấu hình.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
