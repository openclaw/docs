---
read_when:
    - Bạn muốn hiểu cách bộ nhớ hoạt động
    - Bạn muốn biết cần ghi vào những tệp bộ nhớ nào
summary: Cách OpenClaw ghi nhớ thông tin qua các phiên làm việc
title: Tổng quan về bộ nhớ
x-i18n:
    generated_at: "2026-07-12T07:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ghi nhớ mọi thứ bằng cách viết các tệp Markdown thuần túy vào không gian làm việc của tác tử
(mặc định là `~/.openclaw/workspace`). Mô hình chỉ ghi nhớ những gì được
lưu vào đĩa; không có trạng thái ẩn.

## Cách hoạt động

Tác tử của bạn có ba tệp liên quan đến bộ nhớ:

- **`MEMORY.md`** — bộ nhớ dài hạn. Các dữ kiện, tùy chọn và
  quyết định lâu dài. Được nạp khi bắt đầu một phiên.
- **`memory/YYYY-MM-DD.md`** (hoặc `memory/YYYY-MM-DD-<slug>.md`) — ghi chú hằng ngày.
  Ngữ cảnh đang diễn ra và các quan sát. Các ghi chú có ngày hôm nay và hôm qua được nạp
  tự động khi dùng `/new` hoặc `/reset` đơn thuần; các biến thể có slug, chẳng hạn những tệp
  do hook bộ nhớ phiên đi kèm ghi lại, được nạp cùng với
  tệp chỉ có ngày.
- **`DREAMS.md`** (không bắt buộc) — Nhật ký Dreaming và các bản tóm tắt lượt quét Dreaming để
  con người xem xét, bao gồm các mục bổ sung hồi tố lịch sử có căn cứ.

<Tip>
Nếu bạn muốn tác tử ghi nhớ điều gì đó, chỉ cần yêu cầu: "Hãy nhớ rằng tôi
thích TypeScript." Tác tử sẽ ghi chú vào tệp thích hợp.
</Tip>

## Nội dung nào được lưu ở đâu

`MEMORY.md` là lớp cô đọng, được tuyển chọn: các dữ kiện lâu dài, tùy chọn, quyết định
thường trực và bản tóm tắt ngắn cần có sẵn khi bắt đầu một
phiên. Đây không phải là bản ghi thô, nhật ký hằng ngày hay kho lưu trữ toàn diện.

Các tệp `memory/YYYY-MM-DD.md` là lớp làm việc: ghi chú chi tiết hằng ngày,
quan sát, bản tóm tắt phiên và ngữ cảnh thô có thể vẫn hữu ích
về sau. Chúng được lập chỉ mục cho `memory_search` và `memory_get`, nhưng không được
chèn vào lời nhắc khởi tạo ở mỗi lượt.

Theo thời gian, tác tử chắt lọc nội dung hữu ích từ ghi chú hằng ngày vào
`MEMORY.md` và xóa các mục dài hạn đã lỗi thời. Các hướng dẫn không gian làm việc
được tạo và luồng Heartbeat thực hiện việc này định kỳ; bạn không cần
chỉnh sửa thủ công `MEMORY.md` cho từng chi tiết.

Nếu `MEMORY.md` vượt quá ngân sách tệp khởi tạo, OpenClaw vẫn giữ nguyên tệp
trên đĩa nhưng cắt ngắn bản sao được chèn vào ngữ cảnh. Hãy xem đó là
tín hiệu để chuyển nội dung chi tiết sang `memory/*.md`, chỉ giữ lại bản tóm tắt
lâu dài trong `MEMORY.md`, hoặc tăng giới hạn khởi tạo nếu bạn muốn dành thêm
ngân sách lời nhắc. Dùng `/context list`, `/context detail` hoặc `openclaw doctor` để
xem kích thước thô so với kích thước được chèn và trạng thái cắt ngắn.

## Bộ nhớ nhạy cảm với hành động

Hầu hết bộ nhớ là các ghi chú Markdown thông thường. Một số ghi chú ảnh hưởng đến việc tác tử nên
làm gì sau này; với những ghi chú đó, hãy ghi lại thời điểm có thể hành động an toàn theo ghi chú, chứ không chỉ
bản thân dữ kiện.

Hãy ghi lại ranh giới hành động đó khi ghi chú liên quan đến:

- yêu cầu phê duyệt hoặc cấp quyền,
- các ràng buộc tạm thời,
- việc bàn giao sang phiên, luồng hoặc người khác,
- điều kiện hết hạn,
- thời điểm an toàn để hành động,
- thẩm quyền của nguồn hoặc chủ sở hữu,
- hướng dẫn tránh một hành động dễ bị thôi thúc thực hiện.

Một bộ nhớ nhạy cảm với hành động hữu ích cần làm rõ:

- điều gì làm thay đổi hành vi trong tương lai,
- khi nào hoặc trong điều kiện nào nó được áp dụng,
- khi nào nó hết hạn hoặc điều gì cho phép hành động,
- tác tử nên tránh làm gì,
- ai là nguồn hoặc chủ sở hữu, nếu điều đó ảnh hưởng đến mức độ tin cậy hoặc thẩm quyền.

Bộ nhớ có thể lưu giữ ngữ cảnh phê duyệt, nhưng không thực thi chính sách. Hãy dùng
cài đặt phê duyệt, cơ chế hộp cát và tác vụ theo lịch của OpenClaw cho các biện pháp
kiểm soát vận hành bắt buộc.

Ví dụ:

```md
Quá trình di chuyển API đang được thiết kế trong một phiên khác. Các lượt sau
không nên chỉnh sửa phần triển khai API từ luồng này; chỉ dùng các phát hiện ở đây làm
đầu vào thiết kế cho đến khi kế hoạch di chuyển được hoàn tất.
```

Ví dụ khác:

```md
Một báo cáo từ nguồn không đáng tin cậy cần được xem xét trước khi nâng cấp. Các lượt sau
chỉ nên coi đó là bằng chứng; không lưu nó dưới dạng bộ nhớ lâu dài cho đến khi
một người đánh giá đáng tin cậy xác nhận nội dung.
```

Đây không phải là lược đồ bắt buộc cho mọi bộ nhớ; các dữ kiện đơn giản có thể được giữ ngắn gọn.
Hãy dùng ranh giới nhạy cảm với hành động khi việc mất ngữ cảnh về thời điểm, thẩm quyền, thời hạn hoặc
điều kiện an toàn để hành động có thể khiến tác tử làm sai về sau.

Dùng [các cam kết](/vi/concepts/commitments) cho những việc cần làm tiếp được suy luận và tồn tại trong thời gian ngắn.
Dùng [tác vụ theo lịch](/vi/automation/cron-jobs) cho lời nhắc chính xác, kiểm tra theo thời gian
và công việc định kỳ. Bộ nhớ vẫn có thể tóm tắt ngữ cảnh lâu dài xung quanh
mỗi hướng xử lý.

## Các cam kết được suy luận

Một số việc cần làm tiếp trong tương lai không phải là dữ kiện lâu dài. Nếu bạn đề cập đến một cuộc phỏng vấn
vào ngày mai, bộ nhớ hữu ích có thể là "hỏi thăm sau cuộc phỏng vấn", chứ không phải "lưu
điều này mãi mãi trong `MEMORY.md`."

[Các cam kết](/vi/concepts/commitments) là bộ nhớ theo dõi tiếp diễn tồn tại trong thời gian ngắn và cần chủ động bật
cho trường hợp đó. OpenClaw suy luận chúng trong một lượt nền ẩn,
giới hạn chúng trong cùng tác tử và kênh, đồng thời gửi các lời hỏi thăm đến hạn thông qua
Heartbeat. Lời nhắc tường minh vẫn dùng [tác vụ theo lịch](/vi/automation/cron-jobs).

## Công cụ bộ nhớ

Tác tử có hai công cụ để làm việc với bộ nhớ:

- **`memory_search`** — tìm các ghi chú liên quan bằng tìm kiếm ngữ nghĩa, ngay cả khi
  cách diễn đạt khác với bản gốc.
- **`memory_get`** — đọc một tệp bộ nhớ hoặc phạm vi dòng cụ thể.

Cả hai công cụ đều do Plugin bộ nhớ đang hoạt động cung cấp (mặc định: `memory-core`).

## Tìm kiếm bộ nhớ

Khi nhà cung cấp embedding được cấu hình, `memory_search` sử dụng tìm kiếm kết hợp:
độ tương đồng vectơ (ý nghĩa ngữ nghĩa) kết hợp với đối sánh từ khóa (các thuật ngữ chính xác
như ID và ký hiệu mã). Tính năng này hoạt động ngay với khóa API
của bất kỳ nhà cung cấp nào được hỗ trợ.

<Info>
OpenClaw mặc định dùng embedding của OpenAI. Đặt
`agents.defaults.memorySearch.provider` một cách tường minh để dùng Gemini, Voyage,
Mistral, Bedrock, DeepInfra, GGUF cục bộ, Ollama, LM Studio, GitHub Copilot hoặc
một điểm cuối tương thích với OpenAI nói chung.
</Info>

Xem [Tìm kiếm bộ nhớ](/vi/concepts/memory-search) để biết cách tìm kiếm hoạt động, các tùy chọn
điều chỉnh và cách thiết lập nhà cung cấp.

## Các phần phụ trợ bộ nhớ

<CardGroup cols={3}>
<Card title="Tích hợp sẵn (mặc định)" icon="database" href="/vi/concepts/memory-builtin">
Dựa trên SQLite. Hoạt động ngay với tìm kiếm từ khóa, độ tương đồng vectơ và
tìm kiếm kết hợp. Không cần phần phụ thuộc bổ sung.
</Card>
<Card title="QMD" icon="search" href="/vi/concepts/memory-qmd">
Tiến trình phụ ưu tiên cục bộ với khả năng xếp hạng lại, mở rộng truy vấn và lập chỉ mục
các thư mục bên ngoài không gian làm việc.
</Card>
<Card title="Honcho" icon="brain" href="/vi/concepts/memory-honcho">
Bộ nhớ liên phiên dành riêng cho AI với khả năng mô hình hóa người dùng, tìm kiếm ngữ nghĩa và
nhận biết nhiều tác tử. Cài đặt Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/vi/plugins/memory-lancedb">
Bộ nhớ dựa trên LanceDB với embedding tương thích OpenAI, tự động truy hồi,
tự động thu thập và hỗ trợ embedding Ollama cục bộ. Cài đặt Plugin.
</Card>
</CardGroup>

## Lớp wiki tri thức

Nếu bạn muốn bộ nhớ lâu dài hoạt động giống một cơ sở tri thức được duy trì
hơn là các ghi chú thô, hãy dùng Plugin `memory-wiki` đi kèm. Plugin này biên dịch tri thức
lâu dài thành một kho wiki với cấu trúc trang xác định, các khẳng định và bằng chứng có cấu trúc,
khả năng theo dõi mâu thuẫn và độ mới, bảng điều khiển được tạo tự động,
bản tổng hợp đã biên dịch và các công cụ dành riêng cho wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` không thay thế Plugin bộ nhớ đang hoạt động; Plugin bộ nhớ đang hoạt động
vẫn chịu trách nhiệm truy hồi, nâng cấp và Dreaming. `memory-wiki` bổ sung một
lớp tri thức giàu thông tin nguồn gốc bên cạnh Plugin đó.

<CardGroup cols={1}>
<Card title="Wiki bộ nhớ" icon="book" href="/vi/plugins/memory-wiki">
Biên dịch bộ nhớ lâu dài thành một kho wiki giàu thông tin nguồn gốc với các khẳng định,
bảng điều khiển, chế độ cầu nối và quy trình làm việc thân thiện với Obsidian.
</Card>
</CardGroup>

## Tự động ghi bộ nhớ

Trước khi [Compaction](/vi/concepts/compaction) tóm tắt cuộc trò chuyện,
OpenClaw chạy một lượt im lặng để nhắc tác tử lưu ngữ cảnh quan trọng
vào các tệp bộ nhớ. Tính năng này được bật theo mặc định; đặt
`agents.defaults.compaction.memoryFlush.enabled: false` để tắt.

Để giữ lượt dọn dẹp đó trên mô hình cục bộ, hãy đặt một giá trị ghi đè chính xác chỉ
áp dụng cho lượt ghi bộ nhớ (nó không kế thừa chuỗi mô hình dự phòng của
phiên đang hoạt động):

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

<Tip>
Việc ghi bộ nhớ ngăn mất ngữ cảnh trong quá trình Compaction. Nếu tác tử có
các dữ kiện quan trọng trong cuộc trò chuyện chưa được ghi vào tệp, chúng
sẽ được lưu tự động trước khi quá trình tóm tắt diễn ra.
</Tip>

## Dreaming

Dreaming là một lượt hợp nhất nền không bắt buộc dành cho bộ nhớ. Tính năng này thu thập
các tín hiệu truy hồi ngắn hạn, chấm điểm ứng viên và chỉ nâng cấp các
mục đủ điều kiện vào bộ nhớ dài hạn (`MEMORY.md`):

- **Chủ động bật**: mặc định bị tắt.
- **Theo lịch**: khi được bật, `memory-core` tự động quản lý một tác vụ Cron
  định kỳ để thực hiện lượt quét Dreaming đầy đủ.
- **Có ngưỡng**: các mục nâng cấp phải vượt qua các cổng về điểm số, tần suất truy hồi và
  độ đa dạng truy vấn.
- **Có thể xem xét**: bản tóm tắt các giai đoạn và mục nhật ký được ghi vào
  `DREAMS.md` để con người xem xét.

Xem [Dreaming](/vi/concepts/dreaming) để biết hành vi theo giai đoạn, tín hiệu chấm điểm và
chi tiết về Nhật ký Dreaming.

## Bổ sung hồi tố có căn cứ và nâng cấp trực tiếp

Hệ thống Dreaming có hai luồng xem xét liên quan:

- **Dreaming trực tiếp** hoạt động từ kho Dreaming ngắn hạn trong
  `memory/.dreams/` và là cơ chế mà giai đoạn sâu thông thường dùng để quyết định nội dung nào
  được chuyển vào `MEMORY.md`.
- **Bổ sung hồi tố có căn cứ** đọc các ghi chú lịch sử `memory/YYYY-MM-DD.md` dưới dạng
  tệp ngày độc lập và ghi đầu ra xem xét có cấu trúc vào `DREAMS.md`.

Việc bổ sung hồi tố có căn cứ hữu ích để phát lại các ghi chú cũ và kiểm tra những gì
hệ thống xem là lâu dài mà không cần chỉnh sửa thủ công `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cờ `--stage-short-term` đưa các ứng viên lâu dài có căn cứ vào cùng
kho Dreaming ngắn hạn mà giai đoạn sâu thông thường đã sử dụng; nó không
nâng cấp trực tiếp các ứng viên đó. Do đó:

- `DREAMS.md` vẫn là bề mặt để con người xem xét.
- Kho ngắn hạn vẫn là bề mặt xếp hạng dành cho máy.
- `MEMORY.md` vẫn chỉ được ghi bởi quá trình nâng cấp sâu.

Để hoàn tác một lần phát lại mà không ảnh hưởng đến các mục nhật ký thông thường hoặc trạng thái truy hồi
thông thường:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Kiểm tra trạng thái chỉ mục và nhà cung cấp
openclaw memory search "query"  # Tìm kiếm từ dòng lệnh
openclaw memory index --force   # Xây dựng lại chỉ mục
```

## Đọc thêm

- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search): quy trình tìm kiếm, nhà cung cấp và cách điều chỉnh.
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin): phần phụ trợ SQLite mặc định.
- [Công cụ bộ nhớ QMD](/vi/concepts/memory-qmd): tiến trình phụ nâng cao ưu tiên cục bộ.
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho): bộ nhớ liên phiên dành riêng cho AI.
- [Bộ nhớ LanceDB](/vi/plugins/memory-lancedb): Plugin dựa trên LanceDB với embedding tương thích OpenAI.
- [Wiki bộ nhớ](/vi/plugins/memory-wiki): kho tri thức được biên dịch và các công cụ dành riêng cho wiki.
- [Dreaming](/vi/concepts/dreaming): nâng cấp nền từ truy hồi ngắn hạn lên bộ nhớ dài hạn.
- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config): tất cả các tùy chọn cấu hình.
- [Compaction](/vi/concepts/compaction): cách Compaction tương tác với bộ nhớ.
- [Active Memory](/vi/concepts/active-memory): bộ nhớ tác tử phụ cho các phiên trò chuyện tương tác.
