---
read_when:
    - Bạn muốn hiểu cách bộ nhớ hoạt động
    - Bạn muốn biết cần ghi những tệp bộ nhớ nào
summary: Cách OpenClaw ghi nhớ thông tin giữa các phiên
title: Tổng quan về bộ nhớ
x-i18n:
    generated_at: "2026-05-10T19:30:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ghi nhớ mọi thứ bằng cách ghi **các tệp Markdown thuần túy** trong
workspace của agent. Mô hình chỉ "nhớ" những gì được lưu vào ổ đĩa — không có
trạng thái ẩn.

## Cách hoạt động

Agent của bạn có ba tệp liên quan đến bộ nhớ:

- **`MEMORY.md`** — bộ nhớ dài hạn. Các sự kiện, tùy chọn và quyết định bền vững. Được tải khi bắt đầu mỗi phiên DM.
- **`memory/YYYY-MM-DD.md`** — ghi chú hằng ngày. Ngữ cảnh và quan sát đang diễn ra.
  Ghi chú hôm nay và hôm qua được tải tự động.
- **`DREAMS.md`** (tùy chọn) — nhật ký Dreaming và tóm tắt lượt quét dreaming
  để con người xem xét, bao gồm các mục bổ sung lịch sử có căn cứ.

Các tệp này nằm trong workspace của agent (mặc định `~/.openclaw/workspace`).

## Nội dung nào đặt ở đâu

`MEMORY.md` là lớp được tuyển chọn, gọn nhẹ. Dùng tệp này cho các sự kiện bền vững,
tùy chọn, quyết định thường trực và tóm tắt ngắn cần có sẵn khi bắt đầu một
phiên riêng tư chính. Tệp này không dành để làm bản ghi thô, nhật ký hằng ngày,
hoặc kho lưu trữ đầy đủ.

Các tệp `memory/YYYY-MM-DD.md` là lớp làm việc. Dùng chúng cho ghi chú hằng ngày
chi tiết, quan sát, tóm tắt phiên và ngữ cảnh thô có thể vẫn hữu ích về sau.
Các tệp này được lập chỉ mục cho `memory_search` và `memory_get`, nhưng chúng
không được chèn vào prompt khởi động bình thường ở mọi lượt.

Theo thời gian, agent được kỳ vọng sẽ chắt lọc nội dung hữu ích từ ghi chú hằng ngày
vào `MEMORY.md` và loại bỏ các mục dài hạn đã lỗi thời. Các hướng dẫn workspace
được tạo và luồng Heartbeat có thể làm việc đó định kỳ; bạn không cần chỉnh sửa
`MEMORY.md` thủ công cho mọi chi tiết được ghi nhớ.

Nếu `MEMORY.md` vượt quá ngân sách tệp khởi động, OpenClaw vẫn giữ nguyên tệp
trên ổ đĩa nhưng cắt ngắn bản sao được chèn vào ngữ cảnh mô hình. Hãy xem đó là
tín hiệu để chuyển nội dung chi tiết trở lại `memory/*.md`, chỉ giữ phần tóm tắt
bền vững trong `MEMORY.md`, hoặc tăng giới hạn khởi động nếu bạn rõ ràng muốn
dùng thêm ngân sách prompt. Dùng `/context list`, `/context detail`, hoặc
`openclaw doctor` để xem kích thước thô so với kích thước được chèn và trạng thái cắt ngắn.

<Tip>
Nếu bạn muốn agent ghi nhớ điều gì, chỉ cần yêu cầu nó: "Hãy nhớ rằng tôi
thích TypeScript." Nó sẽ ghi điều đó vào tệp phù hợp.
</Tip>

## Cam kết được suy luận

Một số lượt theo dõi trong tương lai không phải là sự kiện bền vững. Nếu bạn
nhắc đến một buổi phỏng vấn vào ngày mai, ký ức hữu ích có thể là "hỏi thăm
sau buổi phỏng vấn," chứ không phải "lưu điều này mãi mãi trong `MEMORY.md`."

[Commitments](/vi/concepts/commitments) là các ký ức theo dõi ngắn hạn, phải bật
tường minh, dành cho trường hợp đó. OpenClaw suy luận chúng trong một lượt nền
ẩn, giới hạn phạm vi chúng vào cùng agent và kênh, rồi gửi các lượt hỏi thăm
đến hạn thông qua Heartbeat. Các lời nhắc tường minh vẫn dùng
[tác vụ đã lên lịch](/vi/automation/cron-jobs).

## Công cụ bộ nhớ

Agent có hai công cụ để làm việc với bộ nhớ:

- **`memory_search`** — tìm ghi chú liên quan bằng tìm kiếm ngữ nghĩa, ngay cả khi
  cách diễn đạt khác với bản gốc.
- **`memory_get`** — đọc một tệp bộ nhớ hoặc phạm vi dòng cụ thể.

Cả hai công cụ đều do Plugin active memory cung cấp (mặc định: `memory-core`).

## Plugin đồng hành Memory Wiki

Nếu bạn muốn bộ nhớ bền vững hoạt động giống một cơ sở tri thức được duy trì hơn
là chỉ các ghi chú thô, hãy dùng Plugin `memory-wiki` được đóng gói sẵn.

`memory-wiki` biên dịch tri thức bền vững vào một kho wiki với:

- cấu trúc trang xác định
- các khẳng định và bằng chứng có cấu trúc
- theo dõi mâu thuẫn và độ mới
- dashboard được tạo
- digest đã biên dịch cho người tiêu dùng agent/runtime
- các công cụ gốc wiki như `wiki_search`, `wiki_get`, `wiki_apply`, và `wiki_lint`

Nó không thay thế Plugin active memory. Plugin active memory vẫn sở hữu recall,
promotion và Dreaming. `memory-wiki` thêm một lớp tri thức giàu nguồn gốc bên cạnh.

Xem [Memory Wiki](/vi/plugins/memory-wiki).

## Tìm kiếm bộ nhớ

Khi nhà cung cấp embedding được cấu hình, `memory_search` dùng **tìm kiếm lai** —
kết hợp độ tương đồng vector (ý nghĩa ngữ nghĩa) với khớp từ khóa (các thuật ngữ
chính xác như ID và ký hiệu mã). Tính năng này hoạt động ngay sau khi bạn có
API key cho bất kỳ nhà cung cấp được hỗ trợ nào.

<Info>
OpenClaw tự động phát hiện nhà cung cấp embedding của bạn từ các API key có sẵn.
Nếu bạn đã cấu hình khóa OpenAI, Gemini, Voyage hoặc Mistral, tìm kiếm bộ nhớ
sẽ được bật tự động.
</Info>

Để biết chi tiết về cách tìm kiếm hoạt động, tùy chọn tinh chỉnh và thiết lập
nhà cung cấp, xem [Tìm kiếm bộ nhớ](/vi/concepts/memory-search).

## Backend bộ nhớ

<CardGroup cols={3}>
<Card title="Tích hợp sẵn (mặc định)" icon="database" href="/vi/concepts/memory-builtin">
Dựa trên SQLite. Hoạt động ngay với tìm kiếm từ khóa, độ tương đồng vector và
tìm kiếm lai. Không cần phụ thuộc bổ sung.
</Card>
<Card title="QMD" icon="search" href="/vi/concepts/memory-qmd">
Sidecar ưu tiên cục bộ với reranking, mở rộng truy vấn và khả năng lập chỉ mục
các thư mục bên ngoài workspace.
</Card>
<Card title="Honcho" icon="brain" href="/vi/concepts/memory-honcho">
Bộ nhớ xuyên phiên theo hướng AI-native với mô hình hóa người dùng, tìm kiếm
ngữ nghĩa và nhận thức đa agent. Cài đặt Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/vi/plugins/memory-lancedb">
Bộ nhớ được đóng gói sẵn, hậu thuẫn bởi LanceDB, với embedding tương thích
OpenAI, auto-recall, auto-capture và hỗ trợ embedding Ollama cục bộ.
</Card>
</CardGroup>

## Lớp wiki tri thức

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/vi/plugins/memory-wiki">
Biên dịch bộ nhớ bền vững vào một kho wiki giàu nguồn gốc với các khẳng định,
dashboard, chế độ bridge và quy trình làm việc thân thiện với Obsidian.
</Card>
</CardGroup>

## Tự động flush bộ nhớ

Trước khi [Compaction](/vi/concepts/compaction) tóm tắt cuộc trò chuyện của bạn,
OpenClaw chạy một lượt im lặng nhắc agent lưu ngữ cảnh quan trọng vào các tệp
bộ nhớ. Tính năng này được bật mặc định — bạn không cần cấu hình gì.

Để giữ lượt dọn dẹp đó trên một mô hình cục bộ, đặt override chính xác cho
mô hình flush bộ nhớ:

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

Override chỉ áp dụng cho lượt flush bộ nhớ và không kế thừa chuỗi fallback của
phiên đang hoạt động.

<Tip>
Flush bộ nhớ ngăn mất ngữ cảnh trong quá trình Compaction. Nếu agent của bạn có
các sự kiện quan trọng trong cuộc trò chuyện chưa được ghi vào tệp, chúng sẽ
được lưu tự động trước khi phần tóm tắt diễn ra.
</Tip>

## Dreaming

Dreaming là một lượt hợp nhất bộ nhớ chạy nền tùy chọn. Nó thu thập các tín hiệu
ngắn hạn, chấm điểm ứng viên và chỉ promotion các mục đủ điều kiện vào bộ nhớ
dài hạn (`MEMORY.md`).

Nó được thiết kế để giữ bộ nhớ dài hạn có tín hiệu cao:

- **Bật tùy chọn**: tắt theo mặc định.
- **Được lên lịch**: khi bật, `memory-core` tự động quản lý một cron job lặp lại
  cho một lượt quét Dreaming đầy đủ.
- **Có ngưỡng**: promotion phải vượt qua các cổng về điểm số, tần suất recall và
  độ đa dạng truy vấn.
- **Có thể xem xét**: tóm tắt pha và mục nhật ký được ghi vào `DREAMS.md`
  để con người xem xét.

Để biết hành vi pha, tín hiệu chấm điểm và chi tiết Dream Diary, xem
[Dreaming](/vi/concepts/dreaming).

## Backfill có căn cứ và promotion trực tiếp

Hệ thống Dreaming hiện có hai làn xem xét liên quan chặt chẽ:

- **Dreaming trực tiếp** làm việc từ kho Dreaming ngắn hạn trong `memory/.dreams/`
  và là cơ chế mà pha sâu bình thường dùng khi quyết định nội dung nào có thể
  tốt nghiệp vào `MEMORY.md`.
- **Backfill có căn cứ** đọc các ghi chú lịch sử `memory/YYYY-MM-DD.md` như
  các tệp ngày độc lập và ghi đầu ra xem xét có cấu trúc vào `DREAMS.md`.

Backfill có căn cứ hữu ích khi bạn muốn phát lại các ghi chú cũ hơn và kiểm tra
những gì hệ thống cho là bền vững mà không chỉnh sửa `MEMORY.md` thủ công.

Khi bạn dùng:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

các ứng viên bền vững có căn cứ không được promotion trực tiếp. Chúng được đưa
vào cùng kho Dreaming ngắn hạn mà pha sâu bình thường đã dùng. Điều đó nghĩa là:

- `DREAMS.md` vẫn là bề mặt xem xét dành cho con người.
- kho ngắn hạn vẫn là bề mặt xếp hạng dành cho máy.
- `MEMORY.md` vẫn chỉ được ghi bởi promotion sâu.

Nếu bạn quyết định rằng lần phát lại đó không hữu ích, bạn có thể xóa các artifact
đã staged mà không chạm vào các mục nhật ký thông thường hoặc trạng thái recall
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

- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin): backend SQLite mặc định.
- [Công cụ bộ nhớ QMD](/vi/concepts/memory-qmd): sidecar ưu tiên cục bộ nâng cao.
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho): bộ nhớ xuyên phiên theo hướng AI-native.
- [Memory LanceDB](/vi/plugins/memory-lancedb): Plugin hậu thuẫn bởi LanceDB với embedding tương thích OpenAI.
- [Memory Wiki](/vi/plugins/memory-wiki): kho tri thức đã biên dịch và công cụ gốc wiki.
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search): pipeline tìm kiếm, nhà cung cấp và tinh chỉnh.
- [Dreaming](/vi/concepts/dreaming): promotion nền từ recall ngắn hạn sang bộ nhớ dài hạn.
- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config): tất cả núm cấu hình.
- [Compaction](/vi/concepts/compaction): cách Compaction tương tác với bộ nhớ.

## Liên quan

- [Active Memory](/vi/concepts/active-memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin)
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho)
- [Memory LanceDB](/vi/plugins/memory-lancedb)
- [Commitments](/vi/concepts/commitments)
