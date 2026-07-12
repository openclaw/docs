---
read_when:
    - Bạn muốn hiểu “ngữ cảnh” có nghĩa là gì trong OpenClaw
    - Bạn đang gỡ lỗi để tìm hiểu tại sao mô hình “biết” điều gì đó (hoặc đã quên điều đó)
    - Bạn muốn giảm chi phí ngữ cảnh (/context, /status, /compact)
summary: 'Ngữ cảnh: những gì mô hình nhìn thấy, cách ngữ cảnh được xây dựng và cách kiểm tra ngữ cảnh'
title: Ngữ cảnh
x-i18n:
    generated_at: "2026-07-12T07:51:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

"Ngữ cảnh" là **mọi thứ OpenClaw gửi đến mô hình trong một lượt chạy**. Nó bị giới hạn bởi **cửa sổ ngữ cảnh** (giới hạn token) của mô hình.

Mô hình tư duy dành cho người mới bắt đầu:

- **Lời nhắc hệ thống** (do OpenClaw tạo): các quy tắc, công cụ, danh sách Skills, thời gian/môi trường chạy và các tệp không gian làm việc được chèn vào.
- **Lịch sử hội thoại**: tin nhắn của bạn + tin nhắn của trợ lý trong phiên này.
- **Lệnh gọi/kết quả công cụ + tệp đính kèm**: đầu ra lệnh, nội dung tệp đã đọc, hình ảnh/âm thanh, v.v.

Ngữ cảnh _không giống_ "bộ nhớ": bộ nhớ có thể được lưu trên đĩa và tải lại sau; ngữ cảnh là nội dung nằm trong cửa sổ hiện tại của mô hình.

## Bắt đầu nhanh (kiểm tra ngữ cảnh)

- `/status` → chế độ xem nhanh "cửa sổ của tôi đã đầy đến mức nào?" + các cài đặt phiên.
- `/context list` → nội dung được chèn + kích thước ước tính (theo từng tệp + tổng cộng).
- `/context detail` → phân tích chi tiết hơn: kích thước theo từng tệp, từng lược đồ công cụ, từng mục Skills, kích thước lời nhắc hệ thống và số lượng tin nhắn bản ghi có thể Compaction.
- `/context map` → hình ảnh bản đồ cây kiểu WinDirStat về các thành phần đóng góp vào ngữ cảnh được theo dõi của phiên hiện tại.
- `/usage tokens` → thêm phần chân trang về mức sử dụng của từng phản hồi vào các phản hồi thông thường.
- `/compact` → tóm tắt lịch sử cũ thành một mục thu gọn để giải phóng không gian cửa sổ.

Xem thêm: [Lệnh gạch chéo](/vi/tools/slash-commands), [Mức sử dụng token và chi phí](/vi/reference/token-use), [Compaction](/vi/concepts/compaction).

## Ví dụ đầu ra

Các giá trị thay đổi tùy theo mô hình, nhà cung cấp, chính sách công cụ và nội dung trong không gian làm việc của bạn.

### `/context list`

```text
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

```text
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

Gửi một hình ảnh được tạo từ báo cáo lượt chạy mới nhất trong bộ nhớ đệm cùng bản ghi phiên. Trước khi một tin nhắn thông thường tạo ra báo cáo lượt chạy trong phiên, `/context map` sẽ trả về thông báo không khả dụng thay vì hiển thị một giá trị ước tính. Diện tích hình chữ nhật tỷ lệ thuận với số ký tự lời nhắc được theo dõi:

- bản ghi hội thoại (tin nhắn của người dùng, phản hồi của trợ lý, kết quả công cụ, bản tóm tắt Compaction), cùng ngữ cảnh môi trường chạy theo từng lượt và phần bổ sung lời nhắc từ hook chỉ được gửi đến mô hình
- các tệp không gian làm việc được chèn
- văn bản lời nhắc hệ thống cơ sở
- các mục lời nhắc Skills
- các lược đồ JSON của công cụ

Nhóm hội thoại tăng lên theo tiến trình của phiên, vì vậy bản đồ thay đổi qua từng lượt; sau Compaction, nhóm này thu gọn thành một ô tóm tắt.

`/context list`, `/context detail` và `/context json` vẫn có thể kiểm tra một giá trị ước tính theo yêu cầu khi không có báo cáo lượt chạy nào được lưu trong bộ nhớ đệm.

## Những gì được tính vào cửa sổ ngữ cảnh

Mọi thứ mô hình nhận được đều được tính, bao gồm:

- Lời nhắc hệ thống (tất cả các phần).
- Lịch sử hội thoại.
- Lệnh gọi công cụ + kết quả công cụ.
- Tệp đính kèm/bản ghi (hình ảnh/âm thanh/tệp).
- Bản tóm tắt Compaction và các thành phần cắt tỉa.
- "Lớp bọc" của nhà cung cấp hoặc tiêu đề ẩn (không hiển thị nhưng vẫn được tính).

## Cách OpenClaw tạo lời nhắc hệ thống

Lời nhắc hệ thống **thuộc quyền kiểm soát của OpenClaw** và được tạo lại trong mỗi lượt chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn.
- Danh sách Skills (chỉ siêu dữ liệu; xem bên dưới).
- Vị trí không gian làm việc.
- Thời gian (UTC + thời gian người dùng đã chuyển đổi nếu được cấu hình).
- Siêu dữ liệu môi trường chạy (máy chủ/hệ điều hành/mô hình/chế độ suy luận).
- Các tệp khởi tạo không gian làm việc được chèn trong **Ngữ cảnh dự án**.

Phân tích đầy đủ: [Lời nhắc hệ thống](/vi/concepts/system-prompt).

## Các tệp không gian làm việc được chèn (Ngữ cảnh dự án)

Theo mặc định, OpenClaw chèn một tập hợp cố định các tệp không gian làm việc (nếu có):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trong lần chạy đầu tiên)

Các tệp lớn được cắt bớt theo từng tệp bằng `agents.defaults.bootstrapMaxChars` (mặc định `20000` ký tự). OpenClaw cũng áp dụng giới hạn tổng lượng nội dung khởi tạo được chèn trên tất cả các tệp bằng `agents.defaults.bootstrapTotalMaxChars` (mặc định `60000` ký tự). `/context` hiển thị kích thước **thô so với được chèn** và cho biết có xảy ra cắt bớt hay không.

Khi xảy ra cắt bớt, môi trường chạy có thể chèn một khối cảnh báo trong lời nhắc, bên dưới Ngữ cảnh dự án. Cấu hình tính năng này bằng `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; mặc định `always`).

## Skills: được chèn so với tải theo yêu cầu

Lời nhắc hệ thống bao gồm một **danh sách Skills** thu gọn (tên + mô tả + vị trí). Danh sách này thực sự chiếm dung lượng.

Theo mặc định, hướng dẫn của Skills _không_ được đưa vào. Mô hình được yêu cầu `read` tệp `SKILL.md` của Skills **chỉ khi cần**.

## Công cụ: có hai loại chi phí

Công cụ ảnh hưởng đến ngữ cảnh theo hai cách:

1. **Văn bản danh sách công cụ** trong lời nhắc hệ thống (nội dung bạn thấy dưới dạng "Công cụ").
2. **Lược đồ công cụ** (JSON). Các lược đồ này được gửi đến mô hình để mô hình có thể gọi công cụ. Chúng được tính vào ngữ cảnh dù bạn không nhìn thấy chúng dưới dạng văn bản thuần túy.

`/context detail` phân tích các lược đồ công cụ lớn nhất để bạn có thể thấy thành phần nào chiếm ưu thế.

## Lệnh, chỉ thị và "lối tắt nội tuyến"

Các lệnh gạch chéo được Gateway xử lý. Có một số hành vi khác nhau:

- **Lệnh độc lập**: một tin nhắn chỉ chứa `/...` sẽ được chạy dưới dạng lệnh.
- **Chỉ thị**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` bị loại bỏ trước khi mô hình nhìn thấy tin nhắn.
  - Tin nhắn chỉ chứa chỉ thị sẽ duy trì các cài đặt phiên.
  - Chỉ thị nội tuyến trong tin nhắn thông thường đóng vai trò là gợi ý dành riêng cho tin nhắn đó.
- **Lối tắt nội tuyến** (chỉ dành cho người gửi trong danh sách cho phép): một số token `/...` nhất định trong tin nhắn thông thường có thể chạy ngay lập tức (ví dụ: "này /status") và bị loại bỏ trước khi mô hình nhìn thấy phần văn bản còn lại.

Chi tiết: [Lệnh gạch chéo](/vi/tools/slash-commands).

## Phiên, Compaction và cắt tỉa (những gì được duy trì)

Những gì được duy trì giữa các tin nhắn phụ thuộc vào cơ chế:

- **Lịch sử thông thường** được duy trì trong bản ghi phiên cho đến khi được Compaction/cắt tỉa theo chính sách.
- **Compaction** duy trì một bản tóm tắt trong bản ghi và giữ nguyên các tin nhắn gần đây.
- **Cắt tỉa** loại bỏ các kết quả công cụ cũ khỏi lời nhắc _trong bộ nhớ_ để giải phóng không gian cửa sổ ngữ cảnh, nhưng không ghi lại bản ghi phiên — toàn bộ lịch sử vẫn có thể được kiểm tra trên đĩa.

Tài liệu: [Phiên](/vi/concepts/session), [Compaction](/vi/concepts/compaction), [Cắt tỉa phiên](/vi/concepts/session-pruning).

Theo mặc định, OpenClaw sử dụng công cụ ngữ cảnh `legacy` tích hợp sẵn để lắp ráp và
thực hiện Compaction. Nếu bạn cài đặt một Plugin cung cấp `kind: "context-engine"` và
chọn nó bằng `plugins.slots.contextEngine`, OpenClaw sẽ ủy quyền việc lắp ráp ngữ cảnh,
`/compact` và các hook vòng đời ngữ cảnh của tác tử con liên quan cho công cụ đó.
`ownsCompaction: false` không tự động chuyển về công cụ `legacy`;
công cụ đang hoạt động vẫn phải triển khai `compact()` chính xác. Xem
[Công cụ ngữ cảnh](/vi/concepts/context-engine) để biết toàn bộ
giao diện có thể cắm thêm, các hook vòng đời và cấu hình.

## Nội dung `/context` thực sự báo cáo

`/context` ưu tiên báo cáo lời nhắc hệ thống mới nhất **được tạo trong lượt chạy** khi có:

- `System prompt (run)` = được ghi nhận từ lượt chạy nhúng gần nhất (có khả năng sử dụng công cụ) và được duy trì trong kho lưu trữ phiên.
- `System prompt (estimate)` = được tính tức thời khi không có báo cáo lượt chạy (hoặc khi chạy qua phần phụ trợ CLI không tạo báo cáo).

Trong cả hai trường hợp, nó báo cáo kích thước và các thành phần đóng góp hàng đầu; nó **không** kết xuất toàn bộ lời nhắc hệ thống hoặc lược đồ công cụ. Ở chế độ chi tiết, nó cũng so sánh bản ghi phiên với cùng điều kiện xác định tin nhắn hội thoại thực được Compaction sử dụng, nhờ đó dễ phân biệt mức sử dụng lời nhắc/bộ nhớ đệm cao với lịch sử hội thoại có thể Compaction.

## Liên quan

<CardGroup cols={2}>
  <Card title="Context engine" href="/vi/concepts/context-engine" icon="puzzle-piece">
    Chèn ngữ cảnh tùy chỉnh thông qua các Plugin.
  </Card>
  <Card title="Compaction" href="/vi/concepts/compaction" icon="compress">
    Tóm tắt các hội thoại dài để giữ chúng trong cửa sổ của mô hình.
  </Card>
  <Card title="System prompt" href="/vi/concepts/system-prompt" icon="message-lines">
    Cách lời nhắc hệ thống được tạo và nội dung nó chèn vào mỗi lượt.
  </Card>
  <Card title="Agent loop" href="/vi/concepts/agent-loop" icon="arrows-rotate">
    Toàn bộ chu trình thực thi của tác tử, từ tin nhắn đến cho đến phản hồi cuối cùng.
  </Card>
</CardGroup>
