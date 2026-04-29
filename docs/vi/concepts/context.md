---
read_when:
    - Bạn muốn hiểu “ngữ cảnh” có nghĩa là gì trong OpenClaw
    - Bạn đang gỡ lỗi vì sao mô hình “biết” điều gì đó (hoặc đã quên nó)
    - Bạn muốn giảm chi phí ngữ cảnh (/context, /status, /compact)
summary: 'Ngữ cảnh: những gì mô hình thấy, cách nó được xây dựng và cách kiểm tra nó'
title: Bối cảnh
x-i18n:
    generated_at: "2026-04-29T22:36:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 16
---

“Ngữ cảnh” là **mọi thứ OpenClaw gửi đến mô hình cho một lần chạy**. Nó bị giới hạn bởi **cửa sổ ngữ cảnh** của mô hình (giới hạn token).

Mô hình tư duy cho người mới bắt đầu:

- **Prompt hệ thống** (do OpenClaw xây dựng): quy tắc, công cụ, danh sách Skills, thời gian/runtime và các tệp workspace được chèn vào.
- **Lịch sử hội thoại**: tin nhắn của bạn + tin nhắn của assistant trong phiên này.
- **Lệnh gọi/kết quả công cụ + tệp đính kèm**: đầu ra lệnh, lần đọc tệp, hình ảnh/âm thanh, v.v.

Ngữ cảnh _không giống_ “bộ nhớ”: bộ nhớ có thể được lưu trên đĩa và tải lại sau; ngữ cảnh là những gì nằm trong cửa sổ hiện tại của mô hình.

## Bắt đầu nhanh (kiểm tra ngữ cảnh)

- `/status` → chế độ xem nhanh “cửa sổ của tôi đã đầy đến mức nào?” + cài đặt phiên.
- `/context list` → những gì được chèn vào + kích thước ước lượng (theo từng tệp + tổng).
- `/context detail` → phân tích sâu hơn: kích thước theo từng tệp, theo schema công cụ, theo mục Skills và kích thước prompt hệ thống.
- `/usage tokens` → thêm footer mức sử dụng theo từng phản hồi vào các phản hồi bình thường.
- `/compact` → tóm tắt lịch sử cũ hơn thành một mục gọn để giải phóng không gian cửa sổ.

Xem thêm: [Lệnh slash](/vi/tools/slash-commands), [Mức dùng token & chi phí](/vi/reference/token-use), [Compaction](/vi/concepts/compaction).

## Ví dụ đầu ra

Giá trị thay đổi tùy theo mô hình, provider, chính sách công cụ và nội dung trong workspace của bạn.

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

## Những gì được tính vào cửa sổ ngữ cảnh

Mọi thứ mô hình nhận được đều được tính, bao gồm:

- Prompt hệ thống (tất cả các phần).
- Lịch sử hội thoại.
- Lệnh gọi công cụ + kết quả công cụ.
- Tệp đính kèm/bản ghi (hình ảnh/âm thanh/tệp).
- Tóm tắt Compaction và artifact cắt tỉa.
- “Wrapper” hoặc header ẩn của provider (không hiển thị, nhưng vẫn được tính).

## Cách OpenClaw xây dựng prompt hệ thống

Prompt hệ thống là **do OpenClaw sở hữu** và được xây dựng lại ở mỗi lần chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn.
- Danh sách Skills (chỉ metadata; xem bên dưới).
- Vị trí workspace.
- Thời gian (UTC + giờ người dùng đã chuyển đổi nếu được cấu hình).
- Metadata runtime (host/OS/mô hình/thinking).
- Các tệp bootstrap workspace được chèn vào trong **Project Context**.

Phân tích đầy đủ: [Prompt hệ thống](/vi/concepts/system-prompt).

## Tệp workspace được chèn vào (Project Context)

Theo mặc định, OpenClaw chèn một tập hợp cố định các tệp workspace (nếu có):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ lần chạy đầu)

Các tệp lớn bị cắt ngắn theo từng tệp bằng `agents.defaults.bootstrapMaxChars` (mặc định `12000` ký tự). OpenClaw cũng áp dụng giới hạn tổng phần chèn bootstrap trên mọi tệp bằng `agents.defaults.bootstrapTotalMaxChars` (mặc định `60000` ký tự). `/context` hiển thị kích thước **thô so với đã chèn** và việc cắt ngắn có xảy ra hay không.

Khi xảy ra cắt ngắn, runtime có thể chèn một khối cảnh báo trong prompt dưới Project Context. Cấu hình điều này bằng `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; mặc định `once`).

## Skills: được chèn vào so với tải theo nhu cầu

Prompt hệ thống bao gồm một **danh sách Skills** gọn (tên + mô tả + vị trí). Danh sách này có overhead thực sự.

Hướng dẫn Skills _không_ được bao gồm theo mặc định. Mô hình được kỳ vọng sẽ `read` `SKILL.md` của Skills **chỉ khi cần**.

## Công cụ: có hai loại chi phí

Công cụ ảnh hưởng đến ngữ cảnh theo hai cách:

1. **Văn bản danh sách công cụ** trong prompt hệ thống (những gì bạn thấy là “Tooling”).
2. **Schema công cụ** (JSON). Chúng được gửi đến mô hình để mô hình có thể gọi công cụ. Chúng được tính vào ngữ cảnh dù bạn không thấy chúng dưới dạng văn bản thuần.

`/context detail` phân tích các schema công cụ lớn nhất để bạn có thể thấy phần nào chiếm ưu thế.

## Lệnh, directive và "lối tắt inline"

Lệnh slash được Gateway xử lý. Có một vài hành vi khác nhau:

- **Lệnh độc lập**: một tin nhắn chỉ có `/...` sẽ chạy như một lệnh.
- **Directive**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` bị loại bỏ trước khi mô hình thấy tin nhắn.
  - Tin nhắn chỉ có directive sẽ lưu cài đặt phiên.
  - Directive inline trong một tin nhắn bình thường đóng vai trò như gợi ý theo từng tin nhắn.
- **Lối tắt inline** (chỉ sender trong allowlist): một số token `/...` nhất định bên trong tin nhắn bình thường có thể chạy ngay lập tức (ví dụ: “hey /status”), và bị loại bỏ trước khi mô hình thấy phần văn bản còn lại.

Chi tiết: [Lệnh slash](/vi/tools/slash-commands).

## Phiên, Compaction và cắt tỉa (những gì được giữ lại)

Những gì được giữ lại qua các tin nhắn phụ thuộc vào cơ chế:

- **Lịch sử bình thường** được giữ lại trong bản ghi phiên cho đến khi được compact/cắt tỉa theo chính sách.
- **Compaction** lưu một bản tóm tắt vào bản ghi và giữ nguyên các tin nhắn gần đây.
- **Cắt tỉa** loại bỏ kết quả công cụ cũ khỏi prompt _trong bộ nhớ_ để giải phóng không gian cửa sổ ngữ cảnh, nhưng không ghi lại bản ghi phiên — toàn bộ lịch sử vẫn có thể được kiểm tra trên đĩa.

Tài liệu: [Phiên](/vi/concepts/session), [Compaction](/vi/concepts/compaction), [Cắt tỉa phiên](/vi/concepts/session-pruning).

Theo mặc định, OpenClaw dùng context engine `legacy` tích hợp sẵn để lắp ráp và compaction. Nếu bạn cài đặt một plugin cung cấp `kind: "context-engine"` và chọn nó bằng `plugins.slots.contextEngine`, OpenClaw sẽ ủy quyền việc lắp ráp ngữ cảnh, `/compact` và các hook vòng đời ngữ cảnh subagent liên quan cho engine đó thay thế. `ownsCompaction: false` không tự động fallback về engine legacy; engine đang hoạt động vẫn phải triển khai `compact()` đúng cách. Xem [Context Engine](/vi/concepts/context-engine) để biết interface có thể cắm được đầy đủ, hook vòng đời và cấu hình.

## `/context` thực sự báo cáo gì

`/context` ưu tiên báo cáo prompt hệ thống **được xây dựng khi chạy** mới nhất khi có:

- `System prompt (run)` = được chụp từ lần chạy nhúng (có khả năng dùng công cụ) gần nhất và được lưu trong kho phiên.
- `System prompt (estimate)` = được tính tức thời khi không có báo cáo lần chạy (hoặc khi chạy qua backend CLI không tạo báo cáo).

Dù theo cách nào, nó báo cáo kích thước và các thành phần đóng góp lớn nhất; nó **không** dump toàn bộ prompt hệ thống hoặc schema công cụ.

## Liên quan

- [Context Engine](/vi/concepts/context-engine) — chèn ngữ cảnh tùy chỉnh qua plugin
- [Compaction](/vi/concepts/compaction) — tóm tắt các cuộc hội thoại dài
- [Prompt hệ thống](/vi/concepts/system-prompt) — cách prompt hệ thống được xây dựng
- [Vòng lặp agent](/vi/concepts/agent-loop) — chu kỳ thực thi agent đầy đủ
