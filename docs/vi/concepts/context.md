---
read_when:
    - Bạn muốn hiểu “ngữ cảnh” nghĩa là gì trong OpenClaw
    - Bạn đang gỡ lỗi vì sao mô hình "biết" điều gì đó (hoặc đã quên điều đó)
    - Bạn muốn giảm chi phí ngữ cảnh (/context, /status, /compact)
summary: 'Ngữ cảnh: mô hình thấy gì, được xây dựng như thế nào và cách kiểm tra nó'
title: Ngữ cảnh
x-i18n:
    generated_at: "2026-05-06T09:07:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

"Ngữ cảnh" là **mọi thứ OpenClaw gửi đến mô hình cho một lượt chạy**. Nó bị giới hạn bởi **cửa sổ ngữ cảnh** của mô hình (giới hạn token).

Mô hình tư duy cho người mới bắt đầu:

- **System prompt** (do OpenClaw xây dựng): quy tắc, công cụ, danh sách Skills, thời gian/runtime và các tệp workspace được chèn vào.
- **Lịch sử hội thoại**: tin nhắn của bạn + tin nhắn của trợ lý trong phiên này.
- **Lệnh gọi/kết quả công cụ + tệp đính kèm**: đầu ra lệnh, nội dung đọc tệp, hình ảnh/âm thanh, v.v.

Ngữ cảnh _không giống_ với "bộ nhớ": bộ nhớ có thể được lưu trên đĩa và nạp lại sau; ngữ cảnh là những gì nằm trong cửa sổ hiện tại của mô hình.

## Bắt đầu nhanh (kiểm tra ngữ cảnh)

- `/status` → chế độ xem nhanh "cửa sổ của tôi đã đầy đến đâu?" + thiết lập phiên.
- `/context list` → những gì được chèn vào + kích thước ước lượng (theo từng tệp + tổng).
- `/context detail` → phân tích sâu hơn: kích thước theo từng tệp, theo schema công cụ, theo mục Skills và kích thước system prompt.
- `/usage tokens` → thêm phần chân trang về mức dùng token theo từng phản hồi vào các phản hồi bình thường.
- `/compact` → tóm tắt lịch sử cũ hơn thành một mục gọn để giải phóng không gian cửa sổ.

Xem thêm: [Lệnh slash](/vi/tools/slash-commands), [Mức dùng token & chi phí](/vi/reference/token-use), [Compaction](/vi/concepts/compaction).

## Đầu ra ví dụ

Giá trị thay đổi tùy theo mô hình, nhà cung cấp, chính sách công cụ và nội dung trong workspace của bạn.

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

- System prompt (tất cả các phần).
- Lịch sử hội thoại.
- Lệnh gọi công cụ + kết quả công cụ.
- Tệp đính kèm/bản ghi (hình ảnh/âm thanh/tệp).
- Tóm tắt Compaction và các hiện vật cắt tỉa.
- "Wrapper" hoặc header ẩn của nhà cung cấp (không hiển thị nhưng vẫn được tính).

## Cách OpenClaw xây dựng system prompt

System prompt là **do OpenClaw sở hữu** và được xây dựng lại trong mỗi lượt chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn.
- Danh sách Skills (chỉ metadata; xem bên dưới).
- Vị trí workspace.
- Thời gian (UTC + thời gian người dùng đã chuyển đổi nếu được cấu hình).
- Metadata runtime (host/OS/mô hình/thinking).
- Các tệp khởi tạo workspace được chèn vào dưới **Project Context**.

Phân tích đầy đủ: [System Prompt](/vi/concepts/system-prompt).

## Tệp workspace được chèn vào (Project Context)

Theo mặc định, OpenClaw chèn một tập tệp workspace cố định (nếu có):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ lượt chạy đầu tiên)

Các tệp lớn bị cắt ngắn theo từng tệp bằng `agents.defaults.bootstrapMaxChars` (mặc định `12000` ký tự). OpenClaw cũng áp dụng giới hạn tổng lượng chèn bootstrap trên tất cả tệp bằng `agents.defaults.bootstrapTotalMaxChars` (mặc định `60000` ký tự). `/context` hiển thị kích thước **raw so với injected** và liệu việc cắt ngắn đã xảy ra hay chưa.

Khi xảy ra cắt ngắn, runtime có thể chèn một khối cảnh báo trong prompt dưới Project Context. Cấu hình bằng `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; mặc định `once`).

## Skills: được chèn vào so với được nạp khi cần

System prompt bao gồm một **danh sách Skills** gọn (tên + mô tả + vị trí). Danh sách này có chi phí thực sự.

Hướng dẫn Skills _không_ được đưa vào theo mặc định. Mô hình được kỳ vọng sẽ `read` `SKILL.md` của skill **chỉ khi cần**.

## Công cụ: có hai loại chi phí

Công cụ ảnh hưởng đến ngữ cảnh theo hai cách:

1. **Văn bản danh sách công cụ** trong system prompt (những gì bạn thấy là "Tooling").
2. **Schema công cụ** (JSON). Chúng được gửi đến mô hình để mô hình có thể gọi công cụ. Chúng được tính vào ngữ cảnh dù bạn không thấy chúng dưới dạng văn bản thuần.

`/context detail` phân tích các schema công cụ lớn nhất để bạn có thể thấy yếu tố nào chiếm ưu thế.

## Lệnh, directive và "lối tắt nội tuyến"

Lệnh slash được Gateway xử lý. Có một vài hành vi khác nhau:

- **Lệnh độc lập**: một tin nhắn chỉ có `/...` sẽ chạy như một lệnh.
- **Directive**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` bị loại bỏ trước khi mô hình thấy tin nhắn.
  - Tin nhắn chỉ có directive sẽ duy trì thiết lập phiên.
  - Directive nội tuyến trong một tin nhắn bình thường đóng vai trò gợi ý theo từng tin nhắn.
- **Lối tắt nội tuyến** (chỉ người gửi trong danh sách cho phép): một số token `/...` bên trong tin nhắn bình thường có thể chạy ngay lập tức (ví dụ: "hey /status") và bị loại bỏ trước khi mô hình thấy phần văn bản còn lại.

Chi tiết: [Lệnh slash](/vi/tools/slash-commands).

## Phiên, Compaction và cắt tỉa (những gì được duy trì)

Những gì được duy trì qua các tin nhắn phụ thuộc vào cơ chế:

- **Lịch sử bình thường** được duy trì trong bản ghi phiên cho đến khi được compact/cắt tỉa theo chính sách.
- **Compaction** duy trì một bản tóm tắt vào bản ghi và giữ nguyên các tin nhắn gần đây.
- **Cắt tỉa** loại bỏ các kết quả công cụ cũ khỏi prompt _trong bộ nhớ_ để giải phóng không gian cửa sổ ngữ cảnh, nhưng không ghi lại bản ghi phiên - toàn bộ lịch sử vẫn có thể được kiểm tra trên đĩa.

Tài liệu: [Phiên](/vi/concepts/session), [Compaction](/vi/concepts/compaction), [Cắt tỉa phiên](/vi/concepts/session-pruning).

Theo mặc định, OpenClaw dùng công cụ ngữ cảnh tích hợp sẵn `legacy` để lắp ráp và
compaction. Nếu bạn cài một plugin cung cấp `kind: "context-engine"` và
chọn nó bằng `plugins.slots.contextEngine`, OpenClaw sẽ ủy quyền việc lắp ráp
ngữ cảnh, `/compact` và các hook vòng đời ngữ cảnh subagent liên quan cho
công cụ đó thay thế. `ownsCompaction: false` không tự động fallback về công cụ
`legacy`; công cụ đang hoạt động vẫn phải triển khai `compact()` đúng cách. Xem
[Công cụ ngữ cảnh](/vi/concepts/context-engine) để biết đầy đủ giao diện có thể cắm mở rộng,
các hook vòng đời và cấu hình.

## `/context` thực sự báo cáo gì

`/context` ưu tiên báo cáo system prompt **được xây dựng khi chạy** mới nhất khi có sẵn:

- `System prompt (run)` = được ghi lại từ lượt chạy nhúng (có khả năng dùng công cụ) gần nhất và được duy trì trong kho phiên.
- `System prompt (estimate)` = được tính nhanh khi không có báo cáo lượt chạy (hoặc khi chạy qua backend CLI không tạo báo cáo).

Dù bằng cách nào, nó báo cáo kích thước và các thành phần đóng góp lớn nhất; nó **không** đổ toàn bộ system prompt hoặc schema công cụ ra.

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ ngữ cảnh" href="/vi/concepts/context-engine" icon="puzzle-piece">
    Chèn ngữ cảnh tùy chỉnh qua plugin.
  </Card>
  <Card title="Compaction" href="/vi/concepts/compaction" icon="compress">
    Tóm tắt các cuộc hội thoại dài để giữ chúng trong cửa sổ mô hình.
  </Card>
  <Card title="System prompt" href="/vi/concepts/system-prompt" icon="message-lines">
    Cách system prompt được xây dựng và những gì nó chèn vào ở mỗi lượt.
  </Card>
  <Card title="Vòng lặp agent" href="/vi/concepts/agent-loop" icon="arrows-rotate">
    Chu trình thực thi agent đầy đủ từ tin nhắn đến cho đến phản hồi cuối.
  </Card>
</CardGroup>
