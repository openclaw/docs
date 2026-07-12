---
read_when:
    - Bạn muốn lập chỉ mục hoặc tìm kiếm bộ nhớ ngữ nghĩa
    - Bạn đang gỡ lỗi tính khả dụng hoặc việc lập chỉ mục của bộ nhớ
    - Bạn muốn chuyển ký ức ngắn hạn được truy hồi thành `MEMORY.md`
summary: Tài liệu tham chiếu CLI cho `openclaw memory` (trạng thái/chỉ mục/tìm kiếm/thăng hạng/giải thích thăng hạng/bộ kiểm thử rem/điền bù rem)
title: Bộ nhớ
x-i18n:
    generated_at: "2026-07-12T07:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Quản lý việc lập chỉ mục bộ nhớ ngữ nghĩa, tìm kiếm và đưa nội dung vào `MEMORY.md`.
Được cung cấp bởi plugin `memory-core` đi kèm, khả dụng khi
`plugins.slots.memory` chọn `memory-core` (mặc định). Các plugin bộ nhớ khác
cung cấp không gian tên CLI riêng.

Liên quan: khái niệm [Bộ nhớ](/vi/concepts/memory), [Dreaming](/vi/concepts/dreaming),
[Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config), [Wiki bộ nhớ](/vi/plugins/memory-wiki),
[wiki](/vi/cli/wiki), [Plugin](/vi/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Nếu không có `--agent`, lệnh sẽ chạy cho mọi tác tử trong `agents.list`; nếu chưa
cấu hình danh sách tác tử, lệnh sẽ dùng tác tử mặc định.

| Cờ          | Tác dụng                                                                                                                                                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Kiểm tra mức độ sẵn sàng của kho vectơ, nhà cung cấp embedding và tìm kiếm ngữ nghĩa (dẫn đến các lệnh gọi bổ sung tới nhà cung cấp). `memory status` thông thường vẫn chạy nhanh và bỏ qua bước này; trạng thái vectơ/ngữ nghĩa không xác định nghĩa là chưa được kiểm tra. Chế độ từ vựng QMD `searchMode: "search"` luôn bỏ qua kiểm tra vectơ ngữ nghĩa, kể cả khi có `--deep`. |
| `--index`   | Lập chỉ mục lại nếu kho đang ở trạng thái bẩn. Bao hàm `--deep`.                                                                                                                                                                                                                                                                          |
| `--fix`     | Sửa các khóa truy hồi cũ và chuẩn hóa siêu dữ liệu đưa vào bộ nhớ.                                                                                                                                                                                                                                                                        |
| `--json`    | In JSON.                                                                                                                                                                                                                                                                                                                                 |
| `--verbose` | Xuất nhật ký chi tiết theo từng giai đoạn.                                                                                                                                                                                                                                                                                                |

Nếu dòng `Dreaming` vẫn ở trạng thái `off` ngay cả khi có
`dreaming.enabled: true`, hoặc các lượt quét theo lịch dường như không bao giờ
chạy, Cron Dreaming được quản lý phụ thuộc vào Heartbeat của tác tử mặc định
được kích hoạt để bắt đầu quá trình đối soát. Xem
[Dreaming](/vi/concepts/dreaming) để biết chi tiết về lịch chạy.

Trạng thái cũng liệt kê mọi đường dẫn tìm kiếm bổ sung từ `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Có cùng phạm vi theo tác tử như `status`. `--force` thực hiện lập chỉ mục lại
toàn bộ thay vì lập chỉ mục tăng dần. `--verbose` in thông tin về nhà cung cấp,
mô hình, nguồn và đường dẫn bổ sung của từng tác tử trước khi hiển thị tiến trình
lập chỉ mục.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Truy vấn: đối số vị trí `[query]` hoặc `--query <text>`. Nếu đặt cả hai,
  `--query` được ưu tiên. Nếu không đặt đối số nào, lệnh sẽ báo lỗi.
- `--agent <id>`: mặc định là tác tử mặc định (không phải toàn bộ danh sách tác tử).
- `--max-results <n>`: giới hạn số lượng kết quả (số nguyên dương).
- `--min-score <n>`: lọc bỏ các kết quả khớp có điểm thấp hơn giá trị này.

## `memory promote`

Xếp hạng các ứng viên ngắn hạn từ `memory/YYYY-MM-DD.md` và tùy chọn nối thêm
các mục hàng đầu vào `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Cờ                         | Mặc định        | Tác dụng                                                              |
| -------------------------- | --------------- | --------------------------------------------------------------------- |
| `--limit <n>`              |                 | Số ứng viên tối đa cần trả về/áp dụng.                                |
| `--min-score <n>`          | `0.75`          | Điểm đưa vào bộ nhớ có trọng số tối thiểu.                            |
| `--min-recall-count <n>`   | `3`             | Số lượt truy hồi tối thiểu bắt buộc.                                  |
| `--min-unique-queries <n>` | `2`             | Số truy vấn riêng biệt tối thiểu bắt buộc.                            |
| `--apply`                  | chỉ xem trước   | Nối các ứng viên đã chọn vào `MEMORY.md` và đánh dấu là đã được đưa vào bộ nhớ. |
| `--include-promoted`       |                 | Bao gồm các ứng viên đã được đưa vào bộ nhớ trong những chu kỳ trước. |
| `--json`                   |                 | In JSON.                                                              |

Các giá trị mặc định của CLI này khác với ngưỡng giai đoạn sâu của lượt quét
Dreaming theo lịch (xem [Dreaming](#dreaming) bên dưới); hãy truyền các cờ tường
minh để khớp với hành vi quét khi chạy thủ công một lần.

Các tín hiệu xếp hạng: tần suất truy hồi, mức độ liên quan khi truy xuất, độ đa
dạng truy vấn, độ mới theo thời gian, sự hợp nhất qua nhiều ngày và độ phong phú
của khái niệm dẫn xuất, được lấy từ cả các lượt truy hồi bộ nhớ lẫn các lượt nhập
hằng ngày, cùng với mức tăng cường nhẹ từ giai đoạn nhẹ/REM cho những lần Dreaming
lặp lại. Trước khi ghi, quá trình đưa vào bộ nhớ sẽ đọc lại ghi chú hằng ngày hiện
hành, vì vậy các chỉnh sửa hoặc nội dung bị xóa khỏi đoạn trích ngắn hạn sau khi
xếp hạng vẫn được tôn trọng, thay vì đưa nội dung từ một ảnh chụp cũ vào bộ nhớ.

## `memory promote-explain`

Giải thích chi tiết cách tính điểm của một ứng viên đưa vào bộ nhớ.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` khớp với khóa (chính xác hoặc chuỗi con), đường dẫn hoặc văn bản
đoạn trích của ứng viên.

## `memory rem-harness`

Xem trước các suy ngẫm REM, các sự thật ứng viên và kết quả đưa vào bộ nhớ của
giai đoạn sâu mà không ghi bất kỳ nội dung nào.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: khởi tạo bộ thử nghiệm từ các tệp hằng ngày
  `YYYY-MM-DD.md` trong lịch sử thay vì không gian làm việc hiện hành.
- `--grounded`: đồng thời kết xuất bản xem trước có căn cứ gồm `Điều đã xảy ra` /
  `Suy ngẫm` / `Các cập nhật lâu dài khả dĩ` từ các ghi chú lịch sử.

## `memory rem-backfill`

Ghi các bản tóm tắt REM lịch sử có căn cứ vào `DREAMS.md` để xem xét trong giao
diện người dùng. Có thể hoàn tác.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: bắt buộc trừ khi đặt `--rollback`/`--rollback-short-term`.
  Một hoặc nhiều tệp bộ nhớ hằng ngày trong lịch sử hoặc thư mục dùng làm nguồn
  để điền bù.
- `--stage-short-term`: đồng thời đưa các ứng viên bền vững có căn cứ vào kho đưa
  vào bộ nhớ ngắn hạn hiện hành để giai đoạn sâu thông thường có thể xếp hạng chúng.
- `--rollback`: xóa các mục nhật ký có căn cứ đã ghi trước đó khỏi `DREAMS.md`.
- `--rollback-short-term`: xóa các ứng viên ngắn hạn có căn cứ đã được đưa vào
  trước đó.

## Dreaming

Dreaming là hệ thống hợp nhất bộ nhớ chạy nền với ba giai đoạn phối hợp, chạy
theo thứ tự trong cùng một lịch: **nhẹ** (sắp xếp/chuẩn bị tài liệu ngắn hạn),
**REM** (suy ngẫm và làm nổi bật các chủ đề), **sâu** (đưa các dữ kiện bền vững
vào `MEMORY.md`). Chỉ giai đoạn sâu ghi vào `MEMORY.md`.

- Bật bằng `plugins.entries.memory-core.config.dreaming.enabled: true`
  (mặc định là `false`); `memory-core` tự động quản lý tác vụ Cron quét, không
  cần chạy thủ công `openclaw cron add`.
- Bật/tắt từ cuộc trò chuyện bằng `/dreaming on|off`; kiểm tra bằng
  `/dreaming status` (hoặc `/dreaming`/`/dreaming help`). `on`/`off` yêu cầu
  trạng thái chủ sở hữu kênh hoặc quyền `operator.admin` của Gateway; trạng thái
  và trợ giúp vẫn khả dụng cho bất kỳ ai có thể gọi lệnh.
- Kết quả dễ đọc của từng giai đoạn được ghi vào `DREAMS.md` (hoặc tệp
  `dreams.md` hiện có). Theo mặc định (`dreaming.storage.mode: "separate"`),
  mỗi giai đoạn cũng ghi một báo cáo độc lập vào
  `memory/dreaming/<phase>/YYYY-MM-DD.md`; đặt `mode: "inline"` để gộp các báo
  cáo vào tệp bộ nhớ hằng ngày, hoặc `"both"` để dùng cả hai.
- Các lượt chạy theo lịch và chạy thủ công bằng `memory promote` sử dụng chung
  các tín hiệu xếp hạng của giai đoạn sâu; chỉ các ngưỡng mặc định là khác nhau
  (xem bảng bên trên so với các giá trị mặc định theo lịch bên dưới).
- Các lượt chạy theo lịch được phân phối trên không gian làm việc bộ nhớ của mọi
  tác tử đã cấu hình.

Các giá trị mặc định theo lịch (`plugins.entries.memory-core.config.dreaming`):

| Khóa                                   | Mặc định    |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

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

Danh sách khóa đầy đủ và chi tiết từng giai đoạn: [Dreaming](/vi/concepts/dreaming),
[Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#dreaming).

## Phụ thuộc Gateway của SecretRef

Nếu các trường khóa API từ xa của Active Memory được cấu hình dưới dạng
SecretRef, các lệnh `memory` sẽ phân giải chúng từ ảnh chụp Gateway đang hoạt
động; nếu Gateway không khả dụng, lệnh sẽ thất bại ngay. Điều này yêu cầu
Gateway hỗ trợ phương thức `secrets.resolve`; các Gateway cũ hơn sẽ trả về lỗi
không xác định phương thức.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
