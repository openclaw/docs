---
read_when:
    - Bạn muốn hiểu cách bộ nhớ hoạt động
    - Bạn muốn biết cần ghi những tệp bộ nhớ nào
summary: Cách OpenClaw ghi nhớ thông tin giữa các phiên làm việc
title: Tổng quan về bộ nhớ
x-i18n:
    generated_at: "2026-04-29T22:37:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ghi nhớ mọi thứ bằng cách viết **các tệp Markdown thuần** trong không gian làm việc của agent. Mô hình chỉ "nhớ" những gì được lưu vào ổ đĩa — không có trạng thái ẩn.

## Cách hoạt động

Agent của bạn có ba tệp liên quan đến bộ nhớ:

- **`MEMORY.md`** — bộ nhớ dài hạn. Các sự kiện, tùy chọn và quyết định bền vững. Được tải khi bắt đầu mọi phiên DM.
- **`memory/YYYY-MM-DD.md`** — ghi chú hằng ngày. Ngữ cảnh và quan sát đang diễn ra. Ghi chú của hôm nay và hôm qua được tải tự động.
- **`DREAMS.md`** (tùy chọn) — Nhật ký Dreaming và tóm tắt các lượt quét Dreaming để con người xem lại, bao gồm các mục bổ sung lịch sử có căn cứ.

Các tệp này nằm trong không gian làm việc của agent (mặc định `~/.openclaw/workspace`).

<Tip>
Nếu bạn muốn agent ghi nhớ điều gì đó, chỉ cần yêu cầu: "Remember that I
prefer TypeScript." Agent sẽ ghi điều đó vào tệp phù hợp.
</Tip>

## Cam kết được suy luận

Một số lần theo dõi trong tương lai không phải là sự kiện bền vững. Nếu bạn nhắc đến một cuộc phỏng vấn vào ngày mai, bộ nhớ hữu ích có thể là "kiểm tra lại sau cuộc phỏng vấn", chứ không phải "lưu việc này mãi mãi trong `MEMORY.md`."

[Commitments](/vi/concepts/commitments) là các bộ nhớ theo dõi ngắn hạn, cần bật tùy chọn, dành cho trường hợp đó. OpenClaw suy luận chúng trong một lượt chạy nền ẩn, giới hạn phạm vi theo cùng agent và kênh, rồi gửi các lượt kiểm tra khi đến hạn thông qua Heartbeat. Nhắc nhở rõ ràng vẫn dùng [tác vụ đã lên lịch](/vi/automation/cron-jobs).

## Công cụ bộ nhớ

Agent có hai công cụ để làm việc với bộ nhớ:

- **`memory_search`** — tìm các ghi chú liên quan bằng tìm kiếm ngữ nghĩa, ngay cả khi cách diễn đạt khác với bản gốc.
- **`memory_get`** — đọc một tệp bộ nhớ cụ thể hoặc một khoảng dòng.

Cả hai công cụ đều được cung cấp bởi Plugin Active Memory (mặc định: `memory-core`).

## Plugin đồng hành Memory Wiki

Nếu bạn muốn bộ nhớ bền vững hoạt động giống một cơ sở tri thức được duy trì hơn là chỉ các ghi chú thô, hãy dùng Plugin `memory-wiki` được đóng gói sẵn.

`memory-wiki` biên dịch tri thức bền vững thành một kho wiki với:

- cấu trúc trang xác định
- các tuyên bố và bằng chứng có cấu trúc
- theo dõi mâu thuẫn và độ mới
- dashboard được tạo tự động
- bản tóm lược đã biên dịch cho agent/người tiêu thụ runtime
- các công cụ wiki-native như `wiki_search`, `wiki_get`, `wiki_apply` và `wiki_lint`

Nó không thay thế Plugin Active Memory. Plugin Active Memory vẫn sở hữu việc truy hồi, thăng cấp và Dreaming. `memory-wiki` bổ sung một lớp tri thức giàu nguồn gốc bên cạnh nó.

Xem [Memory Wiki](/vi/plugins/memory-wiki).

## Tìm kiếm bộ nhớ

Khi một nhà cung cấp embedding được cấu hình, `memory_search` dùng **tìm kiếm kết hợp** — kết hợp độ tương đồng vector (ý nghĩa ngữ nghĩa) với khớp từ khóa (các thuật ngữ chính xác như ID và ký hiệu mã). Tính năng này hoạt động ngay sau khi bạn có khóa API cho bất kỳ nhà cung cấp được hỗ trợ nào.

<Info>
OpenClaw tự động phát hiện nhà cung cấp embedding của bạn từ các khóa API có sẵn. Nếu bạn đã cấu hình khóa OpenAI, Gemini, Voyage hoặc Mistral, tìm kiếm bộ nhớ sẽ được bật tự động.
</Info>

Để biết chi tiết về cách tìm kiếm hoạt động, các tùy chọn tinh chỉnh và cách thiết lập nhà cung cấp, xem [Tìm kiếm bộ nhớ](/vi/concepts/memory-search).

## Backend bộ nhớ

<CardGroup cols={3}>
<Card title="Tích hợp sẵn (mặc định)" icon="database" href="/vi/concepts/memory-builtin">
Dựa trên SQLite. Hoạt động ngay với tìm kiếm từ khóa, độ tương đồng vector và tìm kiếm kết hợp. Không cần phụ thuộc bổ sung.
</Card>
<Card title="QMD" icon="search" href="/vi/concepts/memory-qmd">
Sidecar ưu tiên cục bộ với xếp hạng lại, mở rộng truy vấn và khả năng lập chỉ mục các thư mục bên ngoài không gian làm việc.
</Card>
<Card title="Honcho" icon="brain" href="/vi/concepts/memory-honcho">
Bộ nhớ liên phiên AI-native với mô hình hóa người dùng, tìm kiếm ngữ nghĩa và nhận biết đa agent. Cài đặt Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/vi/plugins/memory-lancedb">
Bộ nhớ được đóng gói sẵn dựa trên LanceDB với embedding tương thích OpenAI, tự động truy hồi, tự động ghi nhận và hỗ trợ embedding Ollama cục bộ.
</Card>
</CardGroup>

## Lớp wiki tri thức

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/vi/plugins/memory-wiki">
Biên dịch bộ nhớ bền vững thành một kho wiki giàu nguồn gốc với các tuyên bố, dashboard, chế độ cầu nối và quy trình làm việc thân thiện với Obsidian.
</Card>
</CardGroup>

## Tự động xả bộ nhớ

Trước khi [Compaction](/vi/concepts/compaction) tóm tắt cuộc trò chuyện của bạn, OpenClaw chạy một lượt im lặng để nhắc agent lưu ngữ cảnh quan trọng vào các tệp bộ nhớ. Tính năng này được bật theo mặc định — bạn không cần cấu hình gì.

Để giữ lượt dọn dẹp đó trên một mô hình cục bộ, hãy đặt một ghi đè mô hình xả bộ nhớ chính xác:

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

Ghi đè này chỉ áp dụng cho lượt xả bộ nhớ và không kế thừa chuỗi dự phòng của phiên đang hoạt động.

<Tip>
Việc xả bộ nhớ ngăn mất ngữ cảnh trong quá trình Compaction. Nếu agent của bạn có các sự kiện quan trọng trong cuộc trò chuyện nhưng chưa được ghi vào tệp, chúng sẽ được lưu tự động trước khi phần tóm tắt diễn ra.
</Tip>

## Dreaming

Dreaming là một lượt hợp nhất nền tùy chọn cho bộ nhớ. Nó thu thập các tín hiệu ngắn hạn, chấm điểm ứng viên và chỉ thăng cấp các mục đủ điều kiện vào bộ nhớ dài hạn (`MEMORY.md`).

Nó được thiết kế để giữ bộ nhớ dài hạn có tín hiệu cao:

- **Bật tùy chọn**: bị tắt theo mặc định.
- **Đã lên lịch**: khi được bật, `memory-core` tự động quản lý một tác vụ Cron lặp lại cho một lượt quét Dreaming đầy đủ.
- **Có ngưỡng**: các thăng cấp phải vượt qua các cổng về điểm, tần suất truy hồi và độ đa dạng truy vấn.
- **Có thể xem lại**: tóm tắt pha và các mục nhật ký được ghi vào `DREAMS.md` để con người xem lại.

Để biết hành vi theo pha, tín hiệu chấm điểm và chi tiết Nhật ký Dreaming, xem [Dreaming](/vi/concepts/dreaming).

## Bổ sung có căn cứ và thăng cấp trực tiếp

Hệ thống Dreaming hiện có hai luồng xem xét liên quan chặt chẽ:

- **Dreaming trực tiếp** hoạt động từ kho Dreaming ngắn hạn trong `memory/.dreams/` và là thứ mà pha sâu thông thường dùng khi quyết định nội dung nào có thể tốt nghiệp vào `MEMORY.md`.
- **Bổ sung có căn cứ** đọc các ghi chú lịch sử `memory/YYYY-MM-DD.md` dưới dạng tệp ngày độc lập và ghi đầu ra xem xét có cấu trúc vào `DREAMS.md`.

Bổ sung có căn cứ hữu ích khi bạn muốn phát lại các ghi chú cũ hơn và kiểm tra hệ thống cho rằng điều gì là bền vững mà không cần chỉnh sửa thủ công `MEMORY.md`.

Khi bạn dùng:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

các ứng viên bền vững có căn cứ không được thăng cấp trực tiếp. Chúng được đưa vào cùng kho Dreaming ngắn hạn mà pha sâu thông thường đã dùng. Điều đó có nghĩa là:

- `DREAMS.md` vẫn là bề mặt xem xét cho con người.
- kho ngắn hạn vẫn là bề mặt xếp hạng hướng tới máy.
- `MEMORY.md` vẫn chỉ được ghi bởi thăng cấp sâu.

Nếu bạn quyết định lượt phát lại không hữu ích, bạn có thể xóa các hiện vật đã đưa vào mà không chạm đến các mục nhật ký thông thường hoặc trạng thái truy hồi bình thường:

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
- [Công cụ bộ nhớ QMD](/vi/concepts/memory-qmd): sidecar ưu tiên cục bộ nâng cao.
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho): bộ nhớ liên phiên AI-native.
- [Memory LanceDB](/vi/plugins/memory-lancedb): Plugin dựa trên LanceDB với embedding tương thích OpenAI.
- [Memory Wiki](/vi/plugins/memory-wiki): kho tri thức đã biên dịch và các công cụ wiki-native.
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search): pipeline tìm kiếm, nhà cung cấp và tinh chỉnh.
- [Dreaming](/vi/concepts/dreaming): thăng cấp nền từ truy hồi ngắn hạn sang bộ nhớ dài hạn.
- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config): tất cả nút điều chỉnh cấu hình.
- [Compaction](/vi/concepts/compaction): cách Compaction tương tác với bộ nhớ.

## Liên quan

- [Active Memory](/vi/concepts/active-memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin)
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho)
- [Memory LanceDB](/vi/plugins/memory-lancedb)
- [Commitments](/vi/concepts/commitments)
