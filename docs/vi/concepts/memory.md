---
read_when:
    - Bạn muốn hiểu cách bộ nhớ hoạt động
    - Bạn muốn biết cần ghi những tệp bộ nhớ nào
summary: Cách OpenClaw ghi nhớ thông tin qua các phiên
title: Tổng quan về bộ nhớ
x-i18n:
    generated_at: "2026-06-27T17:23:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ghi nhớ mọi thứ bằng cách ghi **các tệp Markdown thuần túy** trong workspace của agent của bạn. Mô hình chỉ "nhớ" những gì được lưu vào ổ đĩa — không có trạng thái ẩn.

## Cách hoạt động

Agent của bạn có ba tệp liên quan đến bộ nhớ:

- **`MEMORY.md`** — bộ nhớ dài hạn. Các sự kiện bền vững, tùy chọn ưu tiên và quyết định. Được tải khi bắt đầu mọi phiên DM.
- **`memory/YYYY-MM-DD.md`** (hoặc **`memory/YYYY-MM-DD-<slug>.md`**) — ghi chú hằng ngày. Ngữ cảnh đang chạy và các quan sát. Ghi chú hôm nay và hôm qua được tải tự động, và các biến thể có slug như những tệp do hook session-memory đi kèm ghi trên `/new` hoặc `/reset` nay cũng được chọn cùng với tệp chỉ có ngày.
- **`DREAMS.md`** (tùy chọn) — Nhật ký Dream và tóm tắt lượt quét dreaming để con người xem xét, bao gồm các mục backfill lịch sử có căn cứ.

Các tệp này nằm trong workspace của agent (mặc định `~/.openclaw/workspace`).

## Nội dung nào đặt ở đâu

`MEMORY.md` là lớp gọn nhẹ, được tuyển chọn. Dùng nó cho các sự kiện bền vững, tùy chọn ưu tiên, quyết định thường trực và tóm tắt ngắn cần có sẵn khi bắt đầu một phiên riêng tư chính. Nó không nhằm làm bản ghi thô, nhật ký hằng ngày hay kho lưu trữ đầy đủ.

Các tệp `memory/YYYY-MM-DD.md` là lớp làm việc. Dùng chúng cho ghi chú hằng ngày chi tiết, quan sát, tóm tắt phiên và ngữ cảnh thô có thể vẫn hữu ích về sau. Các tệp này được lập chỉ mục cho `memory_search` và `memory_get`, nhưng không được chèn vào prompt bootstrap thông thường ở mọi lượt.

Theo thời gian, agent được kỳ vọng chắt lọc nội dung hữu ích từ ghi chú hằng ngày vào `MEMORY.md` và xóa các mục dài hạn đã cũ. Các hướng dẫn workspace được tạo và luồng heartbeat có thể làm việc đó định kỳ; bạn không cần chỉnh sửa thủ công `MEMORY.md` cho mọi chi tiết được ghi nhớ.

Nếu `MEMORY.md` vượt quá ngân sách tệp bootstrap, OpenClaw giữ nguyên tệp trên ổ đĩa nhưng cắt ngắn bản sao được chèn vào ngữ cảnh mô hình. Hãy xem đó là tín hiệu để chuyển tài liệu chi tiết trở lại `memory/*.md`, chỉ giữ bản tóm tắt bền vững trong `MEMORY.md`, hoặc tăng giới hạn bootstrap nếu bạn chủ động muốn dùng thêm ngân sách prompt. Dùng `/context list`, `/context detail` hoặc `openclaw doctor` để xem kích thước thô so với kích thước được chèn và trạng thái cắt ngắn.

<Tip>
Nếu bạn muốn agent ghi nhớ điều gì đó, chỉ cần yêu cầu: "Hãy nhớ rằng tôi thích TypeScript." Nó sẽ ghi vào tệp phù hợp.
</Tip>

## Bộ nhớ nhạy cảm với hành động

Hầu hết bộ nhớ có thể được ghi như ghi chú Markdown thông thường. Nhưng một số bộ nhớ ảnh hưởng đến việc agent nên làm sau này. Với những trường hợp đó, hãy ghi lại khi nào có thể hành động an toàn dựa trên ghi chú, không chỉ bản thân sự kiện.

Hãy ghi lại ranh giới hành động đó khi ghi chú liên quan đến:

- yêu cầu phê duyệt hoặc cấp phép,
- ràng buộc tạm thời,
- bàn giao cho phiên, luồng hoặc người khác,
- điều kiện hết hạn,
- thời điểm an toàn để hành động,
- thẩm quyền của nguồn hoặc chủ sở hữu,
- hướng dẫn tránh một hành động dễ bị cám dỗ.

Một bộ nhớ nhạy cảm với hành động hữu ích cần làm rõ:

- điều gì thay đổi hành vi tương lai,
- khi nào hoặc trong điều kiện nào nó áp dụng,
- khi nào nó hết hạn, hoặc điều gì mở khóa hành động,
- agent nên tránh làm gì,
- ai là nguồn hoặc chủ sở hữu, nếu điều đó ảnh hưởng đến độ tin cậy hoặc thẩm quyền.

Bộ nhớ có thể lưu ngữ cảnh phê duyệt, nhưng không thực thi chính sách. Hãy dùng cài đặt phê duyệt, sandboxing và tác vụ đã lên lịch của OpenClaw cho các kiểm soát vận hành cứng.

Ví dụ:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Ví dụ khác:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Dùng [commitments](/vi/concepts/commitments) cho các mục theo dõi ngắn hạn được suy luận. Dùng [tác vụ đã lên lịch](/vi/automation/cron-jobs) cho lời nhắc chính xác, kiểm tra theo thời gian và công việc lặp lại. Bộ nhớ vẫn có thể tóm tắt ngữ cảnh bền vững xung quanh một trong hai hướng.

Đây không phải là schema bắt buộc cho mọi bộ nhớ. Các sự kiện đơn giản có thể giữ ngắn gọn. Dùng ranh giới nhạy cảm với hành động khi việc mất ngữ cảnh về thời điểm, thẩm quyền, hết hạn hoặc an toàn để hành động có thể khiến agent làm sai về sau.

## Commitments được suy luận

Một số mục theo dõi trong tương lai không phải là sự kiện bền vững. Nếu bạn nhắc đến một buổi phỏng vấn vào ngày mai, bộ nhớ hữu ích có thể là "kiểm tra lại sau buổi phỏng vấn", không phải "lưu điều này mãi mãi trong `MEMORY.md`."

[Commitments](/vi/concepts/commitments) là các bộ nhớ theo dõi ngắn hạn, chọn dùng khi cần cho trường hợp đó. OpenClaw suy luận chúng trong một lượt nền ẩn, giới hạn chúng vào cùng agent và kênh, rồi gửi các lượt hỏi thăm đến hạn qua heartbeat. Lời nhắc rõ ràng vẫn dùng [tác vụ đã lên lịch](/vi/automation/cron-jobs).

## Công cụ bộ nhớ

Agent có hai công cụ để làm việc với bộ nhớ:

- **`memory_search`** — tìm các ghi chú liên quan bằng tìm kiếm ngữ nghĩa, ngay cả khi cách diễn đạt khác với bản gốc.
- **`memory_get`** — đọc một tệp bộ nhớ hoặc phạm vi dòng cụ thể.

Cả hai công cụ đều do Plugin bộ nhớ hoạt động cung cấp (mặc định: `memory-core`).

## Plugin đồng hành Memory Wiki

Nếu bạn muốn bộ nhớ bền vững hoạt động giống một cơ sở tri thức được duy trì hơn là chỉ các ghi chú thô, hãy dùng Plugin `memory-wiki` đi kèm.

`memory-wiki` biên dịch tri thức bền vững thành một kho wiki với:

- cấu trúc trang xác định
- tuyên bố và bằng chứng có cấu trúc
- theo dõi mâu thuẫn và độ mới
- dashboard được tạo
- digest được biên dịch cho người dùng agent/runtime
- công cụ native cho wiki như `wiki_search`, `wiki_get`, `wiki_apply` và `wiki_lint`

Nó không thay thế Plugin bộ nhớ hoạt động. Plugin bộ nhớ hoạt động vẫn sở hữu việc truy hồi, thăng cấp và dreaming. `memory-wiki` thêm một lớp tri thức giàu nguồn gốc bên cạnh nó.

Xem [Memory Wiki](/vi/plugins/memory-wiki).

## Tìm kiếm bộ nhớ

Khi nhà cung cấp embedding được cấu hình, `memory_search` dùng **tìm kiếm lai** — kết hợp độ tương đồng vector (ý nghĩa ngữ nghĩa) với khớp từ khóa (các thuật ngữ chính xác như ID và ký hiệu mã). Tính năng này hoạt động ngay khi bạn có API key cho bất kỳ nhà cung cấp nào được hỗ trợ.

<Info>
OpenClaw mặc định dùng embedding của OpenAI. Đặt rõ `agents.defaults.memorySearch.provider` để dùng embedding Gemini, Voyage, Mistral, local, Ollama, Bedrock, GitHub Copilot hoặc tương thích OpenAI.
</Info>

Để biết chi tiết về cách tìm kiếm hoạt động, tùy chọn tinh chỉnh và thiết lập nhà cung cấp, xem [Tìm kiếm bộ nhớ](/vi/concepts/memory-search).

## Backend bộ nhớ

<CardGroup cols={3}>
<Card title="Tích hợp sẵn (mặc định)" icon="database" href="/vi/concepts/memory-builtin">
Dựa trên SQLite. Hoạt động ngay với tìm kiếm từ khóa, độ tương đồng vector và tìm kiếm lai. Không cần phụ thuộc bổ sung.
</Card>
<Card title="QMD" icon="search" href="/vi/concepts/memory-qmd">
Sidecar ưu tiên local với reranking, mở rộng truy vấn và khả năng lập chỉ mục các thư mục bên ngoài workspace.
</Card>
<Card title="Honcho" icon="brain" href="/vi/concepts/memory-honcho">
Bộ nhớ liên phiên native cho AI với mô hình hóa người dùng, tìm kiếm ngữ nghĩa và nhận thức đa agent. Cài đặt Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/vi/plugins/memory-lancedb">
Bộ nhớ đi kèm dựa trên LanceDB với embedding tương thích OpenAI, tự động truy hồi, tự động ghi nhận và hỗ trợ embedding Ollama local.
</Card>
</CardGroup>

## Lớp wiki tri thức

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/vi/plugins/memory-wiki">
Biên dịch bộ nhớ bền vững thành một kho wiki giàu nguồn gốc với các tuyên bố, dashboard, chế độ bridge và quy trình làm việc thân thiện với Obsidian.
</Card>
</CardGroup>

## Tự động flush bộ nhớ

Trước khi [Compaction](/vi/concepts/compaction) tóm tắt cuộc trò chuyện của bạn, OpenClaw chạy một lượt im lặng nhắc agent lưu ngữ cảnh quan trọng vào các tệp bộ nhớ. Tính năng này bật mặc định — bạn không cần cấu hình gì.

Để giữ lượt dọn dẹp đó trên mô hình local, hãy đặt override mô hình flush bộ nhớ chính xác:

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

Override chỉ áp dụng cho lượt flush bộ nhớ và không kế thừa chuỗi fallback của phiên đang hoạt động.

<Tip>
Flush bộ nhớ ngăn mất ngữ cảnh trong Compaction. Nếu agent của bạn có các sự kiện quan trọng trong cuộc trò chuyện chưa được ghi vào tệp, chúng sẽ được lưu tự động trước khi bản tóm tắt diễn ra.
</Tip>

## Dreaming

Dreaming là một lượt hợp nhất nền tùy chọn cho bộ nhớ. Nó thu thập tín hiệu ngắn hạn, chấm điểm ứng viên và chỉ thăng cấp các mục đủ điều kiện vào bộ nhớ dài hạn (`MEMORY.md`).

Nó được thiết kế để giữ bộ nhớ dài hạn có tín hiệu cao:

- **Chọn dùng**: mặc định tắt.
- **Đã lên lịch**: khi bật, `memory-core` tự động quản lý một cron job lặp lại cho một lượt quét dreaming đầy đủ.
- **Có ngưỡng**: các lượt thăng cấp phải vượt qua các cổng về điểm số, tần suất truy hồi và độ đa dạng truy vấn.
- **Có thể xem xét**: tóm tắt giai đoạn và mục nhật ký được ghi vào `DREAMS.md` để con người xem xét.

Để biết hành vi theo giai đoạn, tín hiệu chấm điểm và chi tiết Nhật ký Dream, xem [Dreaming](/vi/concepts/dreaming).

## Backfill có căn cứ và thăng cấp trực tiếp

Hệ thống dreaming hiện có hai tuyến xem xét liên quan chặt chẽ:

- **Dreaming trực tiếp** làm việc từ kho dreaming ngắn hạn trong `memory/.dreams/` và là thứ giai đoạn sâu thông thường dùng khi quyết định nội dung nào có thể tốt nghiệp vào `MEMORY.md`.
- **Backfill có căn cứ** đọc các ghi chú lịch sử `memory/YYYY-MM-DD.md` như các tệp ngày độc lập và ghi đầu ra xem xét có cấu trúc vào `DREAMS.md`.

Backfill có căn cứ hữu ích khi bạn muốn phát lại các ghi chú cũ hơn và kiểm tra hệ thống cho rằng điều gì là bền vững mà không chỉnh sửa thủ công `MEMORY.md`.

Khi bạn dùng:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

các ứng viên bền vững có căn cứ không được thăng cấp trực tiếp. Chúng được đưa vào cùng kho dreaming ngắn hạn mà giai đoạn sâu thông thường đã dùng. Điều đó có nghĩa là:

- `DREAMS.md` vẫn là bề mặt xem xét của con người.
- kho ngắn hạn vẫn là bề mặt xếp hạng dành cho máy.
- `MEMORY.md` vẫn chỉ được ghi bởi thăng cấp sâu.

Nếu bạn quyết định lượt phát lại không hữu ích, bạn có thể xóa các artifact đã đưa vào mà không chạm vào các mục nhật ký thông thường hoặc trạng thái truy hồi bình thường:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Đọc thêm

- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin): backend SQLite mặc định.
- [Công cụ bộ nhớ QMD](/vi/concepts/memory-qmd): sidecar ưu tiên local nâng cao.
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho): bộ nhớ liên phiên native cho AI.
- [Memory LanceDB](/vi/plugins/memory-lancedb): Plugin dựa trên LanceDB với embedding tương thích OpenAI.
- [Memory Wiki](/vi/plugins/memory-wiki): kho tri thức đã biên dịch và công cụ native cho wiki.
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search): pipeline tìm kiếm, nhà cung cấp và tinh chỉnh.
- [Dreaming](/vi/concepts/dreaming): thăng cấp nền từ truy hồi ngắn hạn sang bộ nhớ dài hạn.
- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config): tất cả nút cấu hình.
- [Compaction](/vi/concepts/compaction): cách Compaction tương tác với bộ nhớ.

## Liên quan

- [Active Memory](/vi/concepts/active-memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin)
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho)
- [Memory LanceDB](/vi/plugins/memory-lancedb)
- [Commitments](/vi/concepts/commitments)
