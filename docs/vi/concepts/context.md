---
read_when:
    - Bạn muốn hiểu “ngữ cảnh” có nghĩa là gì trong OpenClaw
    - Bạn đang gỡ lỗi vì sao mô hình “biết” điều gì đó (hoặc đã quên điều đó)
    - Bạn muốn giảm chi phí ngữ cảnh (/context, /status, /compact)
summary: 'Ngữ cảnh: những gì mô hình nhìn thấy, cách nó được xây dựng và cách kiểm tra nó'
title: Ngữ cảnh
x-i18n:
    generated_at: "2026-06-27T17:22:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

"Ngữ cảnh" là **mọi thứ OpenClaw gửi tới mô hình cho một lượt chạy**. Nó bị giới hạn bởi **cửa sổ ngữ cảnh** của mô hình (giới hạn token).

Mô hình tư duy cho người mới bắt đầu:

- **Lời nhắc hệ thống** (do OpenClaw dựng): quy tắc, công cụ, danh sách Skills, thời gian/runtime và các tệp workspace được chèn.
- **Lịch sử hội thoại**: tin nhắn của bạn + tin nhắn của trợ lý trong phiên này.
- **Lệnh gọi/kết quả công cụ + tệp đính kèm**: đầu ra lệnh, nội dung đọc từ tệp, hình ảnh/âm thanh, v.v.

Ngữ cảnh _không giống_ "bộ nhớ": bộ nhớ có thể được lưu trên đĩa và tải lại sau; ngữ cảnh là những gì nằm trong cửa sổ hiện tại của mô hình.

## Bắt đầu nhanh (kiểm tra ngữ cảnh)

- `/status` → chế độ xem nhanh "cửa sổ của tôi đã đầy đến mức nào?" + cài đặt phiên.
- `/context list` → những gì được chèn + kích thước ước lượng (theo từng tệp + tổng).
- `/context detail` → phân tích sâu hơn: kích thước theo từng tệp, theo schema công cụ, theo mục Skills, kích thước lời nhắc hệ thống và số lượng tin nhắn transcript có thể compact.
- `/context map` → ảnh treemap kiểu WinDirStat của các thành phần đóng góp ngữ cảnh được theo dõi trong phiên hiện tại.
- `/usage tokens` → thêm footer mức sử dụng theo từng phản hồi vào các phản hồi thông thường.
- `/compact` → tóm tắt lịch sử cũ hơn thành một mục compact để giải phóng không gian cửa sổ.

Xem thêm: [Lệnh slash](/vi/tools/slash-commands), [Mức dùng token & chi phí](/vi/reference/token-use), [Compaction](/vi/concepts/compaction).

## Ví dụ đầu ra

Giá trị thay đổi theo mô hình, nhà cung cấp, chính sách công cụ và nội dung trong workspace của bạn.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

Gửi một ảnh được tạo từ báo cáo lượt chạy được lưu cache mới nhất. Trước khi một tin nhắn thông thường tạo ra báo cáo lượt chạy trong phiên, `/context map` trả về thông báo không khả dụng thay vì render một ước tính. Diện tích hình chữ nhật tỷ lệ thuận với số ký tự lời nhắc được theo dõi:

- các tệp workspace được chèn
- văn bản lời nhắc hệ thống cơ sở
- mục lời nhắc Skills
- schema JSON của công cụ

`/context list`, `/context detail` và `/context json` vẫn có thể kiểm tra một ước tính theo yêu cầu khi không có báo cáo lượt chạy nào được lưu cache.

## Những gì được tính vào cửa sổ ngữ cảnh

Mọi thứ mô hình nhận được đều được tính, bao gồm:

- Lời nhắc hệ thống (tất cả phần).
- Lịch sử hội thoại.
- Lệnh gọi công cụ + kết quả công cụ.
- Tệp đính kèm/transcript (hình ảnh/âm thanh/tệp).
- Tóm tắt Compaction và artifact cắt tỉa.
- "Wrapper" của nhà cung cấp hoặc header ẩn (không hiển thị nhưng vẫn được tính).

## Cách OpenClaw dựng lời nhắc hệ thống

Lời nhắc hệ thống **thuộc sở hữu của OpenClaw** và được dựng lại mỗi lượt chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn.
- Danh sách Skills (chỉ metadata; xem bên dưới).
- Vị trí workspace.
- Thời gian (UTC + giờ người dùng đã chuyển đổi nếu được cấu hình).
- Metadata runtime (host/HĐH/mô hình/thinking).
- Các tệp bootstrap workspace được chèn trong **Ngữ cảnh dự án**.

Phân tích đầy đủ: [Lời nhắc hệ thống](/vi/concepts/system-prompt).

## Các tệp workspace được chèn (Ngữ cảnh dự án)

Theo mặc định, OpenClaw chèn một tập cố định các tệp workspace (nếu có):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ lượt chạy đầu tiên)

Các tệp lớn được cắt ngắn theo từng tệp bằng `agents.defaults.bootstrapMaxChars` (mặc định `20000` ký tự). OpenClaw cũng áp dụng giới hạn tổng cho phần chèn bootstrap trên tất cả tệp bằng `agents.defaults.bootstrapTotalMaxChars` (mặc định `60000` ký tự). `/context` hiển thị kích thước **thô so với đã chèn** và cho biết việc cắt ngắn có xảy ra hay không.

Khi xảy ra cắt ngắn, runtime có thể chèn một khối cảnh báo trong lời nhắc dưới Ngữ cảnh dự án. Cấu hình bằng `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; mặc định `always`).

## Skills: được chèn so với tải theo yêu cầu

Lời nhắc hệ thống bao gồm một **danh sách Skills** nhỏ gọn (tên + mô tả + vị trí). Danh sách này có chi phí thực sự.

Hướng dẫn Skills _không_ được bao gồm theo mặc định. Mô hình được kỳ vọng sẽ `read` `SKILL.md` của skill **chỉ khi cần**.

## Công cụ: có hai loại chi phí

Công cụ ảnh hưởng đến ngữ cảnh theo hai cách:

1. **Văn bản danh sách công cụ** trong lời nhắc hệ thống (những gì bạn thấy là "Tooling").
2. **Schema công cụ** (JSON). Chúng được gửi tới mô hình để mô hình có thể gọi công cụ. Chúng được tính vào ngữ cảnh dù bạn không thấy chúng dưới dạng văn bản thuần.

`/context detail` phân tích các schema công cụ lớn nhất để bạn có thể thấy yếu tố nào chiếm ưu thế.

## Lệnh, chỉ thị và "lối tắt nội tuyến"

Lệnh slash được Gateway xử lý. Có một vài hành vi khác nhau:

- **Lệnh độc lập**: một tin nhắn chỉ có `/...` sẽ chạy như một lệnh.
- **Chỉ thị**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` được loại bỏ trước khi mô hình thấy tin nhắn.
  - Tin nhắn chỉ có chỉ thị sẽ lưu cài đặt phiên.
  - Chỉ thị nội tuyến trong tin nhắn thông thường hoạt động như gợi ý theo từng tin nhắn.
- **Lối tắt nội tuyến** (chỉ người gửi trong danh sách cho phép): một số token `/...` nhất định bên trong tin nhắn thông thường có thể chạy ngay lập tức (ví dụ: "hey /status") và được loại bỏ trước khi mô hình thấy phần văn bản còn lại.

Chi tiết: [Lệnh slash](/vi/tools/slash-commands).

## Phiên, compaction và cắt tỉa (những gì được duy trì)

Những gì được duy trì giữa các tin nhắn phụ thuộc vào cơ chế:

- **Lịch sử thông thường** được duy trì trong transcript phiên cho đến khi được compact/cắt tỉa theo chính sách.
- **Compaction** duy trì một bản tóm tắt vào transcript và giữ nguyên các tin nhắn gần đây.
- **Cắt tỉa** loại bỏ kết quả công cụ cũ khỏi lời nhắc _trong bộ nhớ_ để giải phóng không gian cửa sổ ngữ cảnh, nhưng không viết lại transcript phiên - toàn bộ lịch sử vẫn có thể được kiểm tra trên đĩa.

Tài liệu: [Phiên](/vi/concepts/session), [Compaction](/vi/concepts/compaction), [Cắt tỉa phiên](/vi/concepts/session-pruning).

Theo mặc định, OpenClaw dùng engine ngữ cảnh tích hợp `legacy` để lắp ráp và
compaction. Nếu bạn cài một plugin cung cấp `kind: "context-engine"` và
chọn nó bằng `plugins.slots.contextEngine`, OpenClaw sẽ ủy quyền việc lắp ráp
ngữ cảnh, `/compact` và các hook vòng đời ngữ cảnh subagent liên quan cho
engine đó thay thế. `ownsCompaction: false` không tự động fallback về engine
legacy; engine đang hoạt động vẫn phải triển khai `compact()` đúng cách. Xem
[Engine ngữ cảnh](/vi/concepts/context-engine) để biết giao diện có thể cắm được,
các hook vòng đời và cấu hình đầy đủ.

## `/context` thực sự báo cáo điều gì

`/context` ưu tiên báo cáo lời nhắc hệ thống **được dựng theo lượt chạy** mới nhất khi có:

- `System prompt (run)` = được ghi lại từ lượt chạy nhúng (có khả năng dùng công cụ) gần nhất và được duy trì trong kho phiên.
- `System prompt (estimate)` = được tính nhanh tại chỗ khi không có báo cáo lượt chạy (hoặc khi chạy qua backend CLI không tạo báo cáo).

Dù theo cách nào, nó báo cáo kích thước và các thành phần đóng góp hàng đầu; nó **không** xuất toàn bộ lời nhắc hệ thống hoặc schema công cụ. Ở chế độ chi tiết, nó cũng so sánh transcript phiên với cùng predicate tin nhắn hội thoại thật được Compaction sử dụng, nhờ đó dễ phân biệt mức dùng prompt/cache cao với lịch sử hội thoại có thể compact.

## Liên quan

<CardGroup cols={2}>
  <Card title="Context engine" href="/vi/concepts/context-engine" icon="puzzle-piece">
    Chèn ngữ cảnh tùy chỉnh thông qua plugins.
  </Card>
  <Card title="Compaction" href="/vi/concepts/compaction" icon="compress">
    Tóm tắt các cuộc hội thoại dài để giữ chúng bên trong cửa sổ mô hình.
  </Card>
  <Card title="System prompt" href="/vi/concepts/system-prompt" icon="message-lines">
    Cách lời nhắc hệ thống được dựng và những gì nó chèn ở mỗi lượt.
  </Card>
  <Card title="Agent loop" href="/vi/concepts/agent-loop" icon="arrows-rotate">
    Toàn bộ chu kỳ thực thi agent từ tin nhắn đầu vào đến phản hồi cuối cùng.
  </Card>
</CardGroup>
