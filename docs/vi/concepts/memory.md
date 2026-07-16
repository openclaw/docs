---
read_when:
    - Bạn muốn hiểu cách bộ nhớ hoạt động
    - Bạn muốn biết nên ghi những tệp bộ nhớ nào
summary: Cách OpenClaw ghi nhớ thông tin qua các phiên làm việc
title: Tổng quan về bộ nhớ
x-i18n:
    generated_at: "2026-07-16T14:18:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ghi nhớ mọi thứ bằng cách ghi các tệp Markdown thuần túy vào không gian làm việc
của agent (mặc định `~/.openclaw/workspace`). Mô hình chỉ ghi nhớ những gì được
lưu vào đĩa; không có trạng thái ẩn.

## Cách hoạt động

Agent có ba tệp liên quan đến bộ nhớ:

- **`MEMORY.md`** — bộ nhớ dài hạn. Các dữ kiện, tùy chọn và
  quyết định lâu bền. Được tải khi bắt đầu một phiên.
- **`memory/YYYY-MM-DD.md`** (hoặc `memory/YYYY-MM-DD-<slug>.md`) — ghi chú hằng ngày.
  Ngữ cảnh và quan sát đang diễn ra. Các ghi chú có ngày của hôm nay và hôm qua được tải
  tự động khi dùng `/new` hoặc `/reset` đơn thuần; các biến thể có slug, chẳng hạn như những tệp
  được hook bộ nhớ phiên đi kèm ghi, cũng được nhận diện cùng với
  tệp chỉ có ngày.
- **`DREAMS.md`** (không bắt buộc) — Nhật ký Dream và bản tóm tắt các lượt Dreaming để
  con người xem xét, bao gồm cả các mục bổ sung dữ liệu lịch sử có căn cứ.

<Tip>
Nếu muốn agent ghi nhớ điều gì đó, chỉ cần yêu cầu: "Hãy nhớ rằng tôi
thích TypeScript." Agent sẽ ghi chú vào tệp thích hợp.
</Tip>

## Nội dung nào được lưu ở đâu

`MEMORY.md` là lớp cô đọng, được tuyển chọn: các dữ kiện lâu bền, tùy chọn, quyết định
thường trực và bản tóm tắt ngắn cần có sẵn khi bắt đầu một
phiên. Đây không phải là bản chép lời thô, nhật ký hằng ngày hay kho lưu trữ đầy đủ.

Các tệp `memory/YYYY-MM-DD.md` là lớp làm việc: ghi chú chi tiết hằng ngày,
quan sát, bản tóm tắt phiên và ngữ cảnh thô có thể vẫn hữu ích
sau này. Các tệp này được lập chỉ mục cho `memory_search` và `memory_get`, nhưng không được
chèn vào lời nhắc khởi động ở mỗi lượt.

Theo thời gian, agent chắt lọc nội dung hữu ích từ các ghi chú hằng ngày vào
`MEMORY.md` và loại bỏ các mục dài hạn đã lỗi thời. Các hướng dẫn không gian làm việc
được tạo và luồng Heartbeat thực hiện việc này định kỳ; bạn không cần
chỉnh sửa thủ công `MEMORY.md` cho từng chi tiết.

Nếu `MEMORY.md` vượt quá ngân sách tệp khởi động, OpenClaw vẫn giữ nguyên tệp
trên đĩa nhưng cắt ngắn bản sao được chèn vào ngữ cảnh. Hãy coi đó là
tín hiệu để chuyển nội dung chi tiết vào `memory/*.md`, chỉ giữ lại một bản tóm tắt
lâu bền trong `MEMORY.md`, hoặc tăng giới hạn khởi động nếu bạn muốn dành thêm
ngân sách lời nhắc. Dùng `/context list`, `/context detail` hoặc `openclaw doctor` để
xem kích thước thô so với kích thước được chèn và trạng thái cắt ngắn.

## Nhập từ trợ lý lập trình

Control UI có thể nhập bộ nhớ cục bộ hiện có từ Codex và Claude Code.
Mở **Settings** → **Import Memory**, chọn agent đích, xem lại các
tệp được phát hiện rồi xác nhận nhập. OpenClaw chỉ sao chép bộ nhớ Markdown:

- Codex: các tệp `MEMORY.md` và `memory_summary.md` đã hợp nhất trong
  `~/.codex/memories` (hoặc `CODEX_HOME/memories`). Các tệp rollout thô và bản chép lời
  không được nhập.
- Claude Code: các tệp Markdown từ thư mục bộ nhớ tự động của từng dự án trong
  `~/.claude/projects/*/memory`, cùng với `autoMemoryDirectory` do người dùng cấu hình
  nếu có. Hướng dẫn dự án, phiên, cài đặt
  và thông tin xác thực không nằm trong thao tác chỉ dành cho bộ nhớ này.

Các tệp đã nhập được giữ riêng trong `memory/imports/codex/` và
`memory/imports/claude-code/` trong không gian làm việc của agent đã chọn. Chúng được lập chỉ mục
cho `memory_search` và có thể truy cập qua `memory_get`; chúng không được hợp nhất vào
`MEMORY.md` khởi động của agent. Các tệp nguồn được giữ nguyên.

Bản xem trước đánh dấu các xung đột tại đích. Bật **Replace existing imports** để
thay thế các tệp đó; khi áp dụng, hệ thống tạo một bản sao lưu trước khi nhập đã được xác minh và lưu giữ
bản sao riêng của từng tệp bị ghi đè trong báo cáo di chuyển.

## Bộ nhớ nhạy cảm với hành động

Hầu hết bộ nhớ là ghi chú Markdown thông thường. Một số ghi chú ảnh hưởng đến việc agent nên
làm sau này; với những ghi chú đó, hãy ghi lại thời điểm có thể hành động an toàn dựa trên ghi chú,
không chỉ riêng dữ kiện.

Hãy ghi lại ranh giới hành động đó khi một ghi chú liên quan đến:

- yêu cầu phê duyệt hoặc cấp quyền,
- các ràng buộc tạm thời,
- bàn giao cho phiên, luồng hoặc người khác,
- điều kiện hết hạn,
- thời điểm an toàn để hành động,
- thẩm quyền của nguồn hoặc chủ sở hữu,
- hướng dẫn tránh một hành động dễ bị thôi thúc thực hiện.

Một bộ nhớ nhạy cảm với hành động hữu ích cần nêu rõ:

- điều gì làm thay đổi hành vi trong tương lai,
- khi nào hoặc trong điều kiện nào nội dung đó áp dụng,
- khi nào nội dung đó hết hạn hoặc điều gì cho phép hành động,
- agent nên tránh làm gì,
- ai là nguồn hoặc chủ sở hữu, nếu điều đó ảnh hưởng đến độ tin cậy hoặc thẩm quyền.

Bộ nhớ có thể lưu giữ ngữ cảnh phê duyệt, nhưng không thực thi chính sách. Hãy dùng
cài đặt phê duyệt, cơ chế sandbox và tác vụ theo lịch của
OpenClaw để kiểm soát hoạt động một cách nghiêm ngặt.

Ví dụ:

```md
Quá trình di chuyển API đang được thiết kế trong một phiên khác. Các lượt sau
không nên chỉnh sửa phần triển khai API từ luồng này; chỉ dùng các phát hiện tại đây làm
đầu vào thiết kế cho đến khi kế hoạch di chuyển được hoàn tất.
```

Một ví dụ khác:

```md
Báo cáo từ một nguồn không đáng tin cậy cần được xem xét trước khi đưa vào sử dụng. Các lượt sau
chỉ nên coi báo cáo đó là bằng chứng; không lưu báo cáo dưới dạng bộ nhớ lâu bền cho đến khi một
người đánh giá đáng tin cậy xác nhận nội dung.
```

Đây không phải là lược đồ bắt buộc cho mọi bộ nhớ; các dữ kiện đơn giản có thể được ghi ngắn gọn.
Hãy dùng ranh giới nhạy cảm với hành động khi việc mất ngữ cảnh về thời điểm, thẩm quyền, thời hạn hoặc
điều kiện an toàn để hành động có thể khiến agent làm sai về sau.

Dùng [cam kết](/vi/concepts/commitments) cho các hành động tiếp nối được suy luận và tồn tại trong thời gian ngắn.
Dùng [tác vụ theo lịch](/vi/automation/cron-jobs) cho lời nhắc chính xác, kiểm tra theo thời gian
và công việc định kỳ. Bộ nhớ vẫn có thể tóm tắt ngữ cảnh lâu bền xung quanh
mỗi hướng xử lý.

## Cam kết được suy luận

Một số hành động tiếp nối trong tương lai không phải là dữ kiện lâu bền. Nếu bạn đề cập đến một cuộc phỏng vấn
vào ngày mai, bộ nhớ hữu ích có thể là "hỏi thăm sau cuộc phỏng vấn", chứ không phải "lưu
nội dung này mãi mãi trong `MEMORY.md`."

[Cam kết](/vi/concepts/commitments) là bộ nhớ tiếp nối có thời hạn ngắn và cần chủ động bật
cho trường hợp đó. OpenClaw suy luận chúng trong một lượt chạy nền ẩn,
giới hạn chúng trong cùng agent và kênh, đồng thời gửi các lượt hỏi thăm đến hạn thông qua
Heartbeat. Lời nhắc rõ ràng vẫn dùng [tác vụ theo lịch](/vi/automation/cron-jobs).

## Công cụ bộ nhớ

Agent có hai công cụ để làm việc với bộ nhớ:

- **`memory_search`** — tìm các ghi chú liên quan bằng tìm kiếm ngữ nghĩa, ngay cả khi
  cách diễn đạt khác với bản gốc.
- **`memory_get`** — đọc một tệp bộ nhớ hoặc phạm vi dòng cụ thể.

Cả hai công cụ đều do Plugin bộ nhớ đang hoạt động cung cấp (mặc định: `memory-core`).

## Tìm kiếm bộ nhớ

Khi nhà cung cấp embedding được cấu hình, `memory_search` dùng tìm kiếm kết hợp:
độ tương đồng vector (ý nghĩa ngữ nghĩa) kết hợp với đối sánh từ khóa (các thuật ngữ chính xác
như ID và ký hiệu mã). Tính năng này hoạt động ngay khi có khóa API
cho bất kỳ nhà cung cấp được hỗ trợ nào.

<Info>
OpenClaw mặc định dùng embedding của OpenAI. Đặt
`agents.defaults.memorySearch.provider` một cách rõ ràng để dùng Gemini, Voyage,
Mistral, Bedrock, DeepInfra, GGUF cục bộ, Ollama, LM Studio, GitHub Copilot hoặc
một điểm cuối chung tương thích với OpenAI.
</Info>

Xem [Tìm kiếm bộ nhớ](/vi/concepts/memory-search) để biết cách hoạt động của tính năng tìm kiếm, các tùy chọn
tinh chỉnh và cách thiết lập nhà cung cấp.

## Backend bộ nhớ

<CardGroup cols={3}>
<Card title="Tích hợp sẵn (mặc định)" icon="database" href="/vi/concepts/memory-builtin">
Dựa trên SQLite. Hoạt động ngay với tìm kiếm từ khóa, độ tương đồng vector và
tìm kiếm kết hợp. Không cần phần phụ thuộc bổ sung.
</Card>
<Card title="QMD" icon="search" href="/vi/concepts/memory-qmd">
Sidecar ưu tiên cục bộ với khả năng xếp hạng lại, mở rộng truy vấn và lập chỉ mục
các thư mục bên ngoài không gian làm việc.
</Card>
<Card title="Honcho" icon="brain" href="/vi/concepts/memory-honcho">
Bộ nhớ đa phiên dành riêng cho AI với mô hình hóa người dùng, tìm kiếm ngữ nghĩa và
nhận thức đa agent. Cài đặt Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/vi/plugins/memory-lancedb">
Bộ nhớ dựa trên LanceDB với embedding tương thích OpenAI, tự động truy hồi,
tự động thu thập và hỗ trợ embedding Ollama cục bộ. Cài đặt Plugin.
</Card>
</CardGroup>

## Lớp wiki tri thức

Nếu muốn bộ nhớ lâu bền hoạt động giống một cơ sở tri thức được duy trì
hơn là các ghi chú thô, hãy dùng Plugin `memory-wiki` đi kèm. Plugin này biên dịch tri thức lâu bền
thành một kho wiki có cấu trúc trang xác định, các tuyên bố và bằng chứng
có cấu trúc, khả năng theo dõi mâu thuẫn và độ mới, bảng điều khiển
được tạo tự động, bản tóm lược đã biên dịch và các công cụ dành riêng cho wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` không thay thế Plugin bộ nhớ đang hoạt động; Plugin bộ nhớ đang hoạt động
vẫn quản lý việc truy hồi, đưa vào bộ nhớ dài hạn và Dreaming. `memory-wiki` bổ sung một
lớp tri thức giàu thông tin nguồn gốc bên cạnh Plugin đó.

<CardGroup cols={1}>
<Card title="Wiki bộ nhớ" icon="book" href="/vi/plugins/memory-wiki">
Biên dịch bộ nhớ lâu bền thành một kho wiki giàu thông tin nguồn gốc với các tuyên bố,
bảng điều khiển, chế độ cầu nối và quy trình làm việc thân thiện với Obsidian.
</Card>
</CardGroup>

## Tự động đẩy bộ nhớ

Trước khi [Compaction](/vi/concepts/compaction) tóm tắt cuộc trò chuyện,
OpenClaw chạy một lượt im lặng để nhắc agent lưu ngữ cảnh quan trọng
vào các tệp bộ nhớ. Tính năng này mặc định được bật; đặt
`agents.defaults.compaction.memoryFlush.enabled: false` để tắt.

Để giữ lượt dọn dẹp đó trên mô hình cục bộ, hãy đặt một giá trị ghi đè chính xác chỉ
áp dụng cho lượt đẩy bộ nhớ (giá trị này không kế thừa chuỗi dự phòng mô hình
của phiên đang hoạt động):

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
Việc đẩy bộ nhớ ngăn mất ngữ cảnh trong quá trình Compaction. Nếu agent có
các dữ kiện quan trọng trong cuộc trò chuyện nhưng chưa được ghi vào tệp, chúng
sẽ được lưu tự động trước khi quá trình tóm tắt diễn ra.
</Tip>

## Dreaming

Dreaming là một lượt hợp nhất bộ nhớ chạy nền không bắt buộc. Tính năng này thu thập
các tín hiệu truy hồi ngắn hạn, chấm điểm ứng viên và chỉ đưa những
mục đủ điều kiện vào bộ nhớ dài hạn (`MEMORY.md`):

- **Cần chủ động bật**: mặc định bị tắt.
- **Theo lịch**: khi được bật, `memory-core` tự động quản lý một Cron
  định kỳ cho một lượt Dreaming đầy đủ.
- **Có ngưỡng**: các mục được đưa vào bộ nhớ dài hạn phải vượt qua ngưỡng điểm, tần suất truy hồi và
  độ đa dạng truy vấn.
- **Có thể xem xét**: bản tóm tắt các giai đoạn và mục nhật ký được ghi vào
  `DREAMS.md` để con người xem xét.

Xem [Dreaming](/vi/concepts/dreaming) để biết hành vi của từng giai đoạn, tín hiệu chấm điểm và
thông tin chi tiết về Nhật ký Dream.

## Bổ sung dữ liệu có căn cứ và đưa vào bộ nhớ dài hạn trực tiếp

Hệ thống Dreaming có hai luồng xem xét liên quan:

- **Dreaming trực tiếp** hoạt động từ kho Dreaming ngắn hạn trong
  `memory/.dreams/` và được giai đoạn chuyên sâu thông thường dùng để quyết định nội dung nào
  được đưa vào `MEMORY.md`.
- **Bổ sung dữ liệu có căn cứ** đọc các ghi chú `memory/YYYY-MM-DD.md` lịch sử dưới dạng
  các tệp ngày độc lập và ghi kết quả xem xét có cấu trúc vào `DREAMS.md`.

Việc bổ sung dữ liệu có căn cứ hữu ích để phát lại các ghi chú cũ và kiểm tra những gì
hệ thống coi là lâu bền mà không cần chỉnh sửa thủ công `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cờ `--stage-short-term` đưa các ứng viên lâu bền có căn cứ vào cùng
kho Dreaming ngắn hạn mà giai đoạn chuyên sâu thông thường đã dùng; cờ này không
đưa chúng trực tiếp vào bộ nhớ dài hạn. Vì vậy:

- `DREAMS.md` vẫn là bề mặt để con người xem xét.
- Kho ngắn hạn vẫn là bề mặt xếp hạng dành cho máy.
- `MEMORY.md` vẫn chỉ được ghi bởi quá trình đưa vào bộ nhớ dài hạn chuyên sâu.

Để hoàn tác một lần phát lại mà không ảnh hưởng đến các mục nhật ký thông thường hoặc trạng thái truy hồi
bình thường:

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

- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search): quy trình tìm kiếm, nhà cung cấp và tinh chỉnh.
- [Công cụ bộ nhớ tích hợp](/vi/concepts/memory-builtin): backend SQLite mặc định.
- [Công cụ bộ nhớ QMD](/vi/concepts/memory-qmd): tiến trình phụ nâng cao, ưu tiên cục bộ.
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho): bộ nhớ liên phiên dành riêng cho AI.
- [Bộ nhớ LanceDB](/vi/plugins/memory-lancedb): plugin dựa trên LanceDB với các embedding tương thích OpenAI.
- [Wiki bộ nhớ](/vi/plugins/memory-wiki): kho tri thức đã biên dịch và các công cụ dành riêng cho wiki.
- [Dreaming](/vi/concepts/dreaming): chuyển thông tin truy hồi ngắn hạn thành bộ nhớ dài hạn trong nền.
- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config): tất cả tùy chọn cấu hình.
- [Compaction](/vi/concepts/compaction): cách Compaction tương tác với bộ nhớ.
- [Active Memory](/vi/concepts/active-memory): bộ nhớ của tác tử phụ cho các phiên trò chuyện tương tác.
