---
read_when:
    - Bạn muốn sử dụng CLI memory-wiki
    - Bạn đang ghi tài liệu hoặc thay đổi `openclaw wiki`
summary: Tham chiếu CLI cho `openclaw wiki` (trạng thái kho memory-wiki, tìm kiếm, biên dịch, lint, áp dụng, bridge và các trình hỗ trợ Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-29T22:35:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Kiểm tra và duy trì kho `memory-wiki`.

Được cung cấp bởi Plugin `memory-wiki` đi kèm.

Liên quan:

- [Plugin wiki bộ nhớ](/vi/plugins/memory-wiki)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [CLI: bộ nhớ](/vi/cli/memory)

## Dùng để làm gì

Dùng `openclaw wiki` khi bạn muốn có một kho tri thức đã biên soạn với:

- tìm kiếm và đọc trang theo kiểu wiki
- các bản tổng hợp giàu nguồn gốc
- báo cáo về mâu thuẫn và độ mới
- nhập cầu nối từ Plugin bộ nhớ đang hoạt động
- các trình trợ giúp CLI Obsidian tùy chọn

## Các lệnh phổ biến

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Lệnh

### `wiki status`

Kiểm tra chế độ kho hiện tại, tình trạng và khả năng sử dụng CLI Obsidian.

Dùng lệnh này trước khi bạn không chắc kho đã được khởi tạo hay chưa, chế độ cầu nối
có khỏe mạnh không, hoặc tích hợp Obsidian có sẵn không.

Khi chế độ cầu nối đang hoạt động và được cấu hình để đọc các tạo tác bộ nhớ, lệnh này
truy vấn Gateway đang chạy để thấy cùng ngữ cảnh Plugin bộ nhớ đang hoạt động như
bộ nhớ của tác nhân/thời gian chạy.

### `wiki doctor`

Chạy kiểm tra tình trạng wiki và hiển thị các vấn đề về cấu hình hoặc kho.

Khi chế độ cầu nối đang hoạt động và được cấu hình để đọc các tạo tác bộ nhớ, lệnh này
truy vấn Gateway đang chạy trước khi xây dựng báo cáo. Các lượt nhập cầu nối bị tắt
và cấu hình cầu nối không đọc tạo tác bộ nhớ vẫn ở chế độ cục bộ/ngoại tuyến.

Các vấn đề thường gặp gồm:

- chế độ cầu nối được bật khi không có tạo tác bộ nhớ công khai
- bố cục kho không hợp lệ hoặc bị thiếu
- thiếu CLI Obsidian bên ngoài khi cần chế độ Obsidian

### `wiki init`

Tạo bố cục kho wiki và các trang khởi đầu.

Lệnh này khởi tạo cấu trúc gốc, bao gồm các chỉ mục cấp cao nhất và thư mục
bộ nhớ đệm.

### `wiki ingest <path-or-url>`

Nhập nội dung vào tầng nguồn của wiki.

Ghi chú:

- nhập URL được kiểm soát bởi `ingest.allowUrlIngest`
- các trang nguồn đã nhập giữ nguồn gốc trong frontmatter
- tự động biên dịch có thể chạy sau khi nhập nếu được bật

### `wiki compile`

Xây dựng lại chỉ mục, khối liên quan, bảng điều khiển và bản tóm tắt đã biên soạn.

Lệnh này ghi các tạo tác ổn định dành cho máy dưới:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Nếu `render.createDashboards` được bật, quá trình biên dịch cũng làm mới các trang báo cáo.

### `wiki lint`

Lint kho và báo cáo:

- vấn đề cấu trúc
- thiếu nguồn gốc
- mâu thuẫn
- câu hỏi mở
- trang/tuyên bố có độ tin cậy thấp
- trang/tuyên bố đã cũ

Chạy lệnh này sau các cập nhật wiki có ý nghĩa.

### `wiki search <query>`

Tìm kiếm nội dung wiki.

Hành vi phụ thuộc vào cấu hình:

- `search.backend`: `shared` hoặc `local`
- `search.corpus`: `wiki`, `memory`, hoặc `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence`, hoặc
  `raw-claim`

Dùng `wiki search` khi bạn muốn xếp hạng dành riêng cho wiki hoặc chi tiết nguồn gốc.
Đối với một lượt truy hồi chia sẻ rộng, ưu tiên `openclaw memory search` khi
Plugin bộ nhớ đang hoạt động cung cấp tìm kiếm chia sẻ.

Các chế độ tìm kiếm giúp tác nhân chọn đúng bề mặt:

- `find-person`: bí danh, định danh người dùng, mạng xã hội, ID chuẩn và trang cá nhân
- `route-question`: gợi ý nên hỏi ai/phù hợp nhất để làm gì và ngữ cảnh quan hệ
- `source-evidence`: trang nguồn và trường bằng chứng có cấu trúc
- `raw-claim`: văn bản tuyên bố có cấu trúc cùng siêu dữ liệu tuyên bố/bằng chứng

Ví dụ:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Đầu ra văn bản bao gồm các dòng `Claim:` và `Evidence:` khi một kết quả khớp với
một tuyên bố có cấu trúc. Đầu ra JSON cũng hiển thị `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds`, và
`evidenceSourceIds` để tác nhân đào sâu thêm.

### `wiki get <lookup>`

Đọc một trang wiki theo id hoặc đường dẫn tương đối.

Ví dụ:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Áp dụng các thay đổi hẹp mà không phẫu thuật trang tự do.

Các luồng được hỗ trợ gồm:

- tạo/cập nhật một trang tổng hợp
- cập nhật siêu dữ liệu trang
- đính kèm id nguồn
- thêm câu hỏi
- thêm mâu thuẫn
- cập nhật độ tin cậy/trạng thái
- ghi các tuyên bố có cấu trúc

Lệnh này tồn tại để wiki có thể phát triển an toàn mà không cần chỉnh sửa thủ công
các khối được quản lý.

### `wiki bridge import`

Nhập tạo tác bộ nhớ công khai từ Plugin bộ nhớ đang hoạt động vào các trang nguồn
được cầu nối hỗ trợ.

Dùng lệnh này trong chế độ `bridge` khi bạn muốn kéo các tạo tác bộ nhớ đã xuất mới nhất
vào kho wiki.

Đối với các lượt đọc tạo tác cầu nối đang hoạt động, CLI định tuyến quá trình nhập qua Gateway RPC
để lượt nhập dùng ngữ cảnh Plugin bộ nhớ thời gian chạy. Nếu lượt nhập cầu nối
bị tắt hoặc lượt đọc tạo tác bị tắt, lệnh giữ hành vi cục bộ/ngoại tuyến
không nhập.

### `wiki unsafe-local import`

Nhập từ các đường dẫn cục bộ được cấu hình rõ ràng trong chế độ `unsafe-local`.

Tính năng này chủ ý là thử nghiệm và chỉ dùng trên cùng máy.

### `wiki obsidian ...`

Các lệnh trợ giúp Obsidian cho kho chạy ở chế độ thân thiện với Obsidian.

Lệnh con:

- `status`
- `search`
- `open`
- `command`
- `daily`

Các lệnh này yêu cầu CLI `obsidian` chính thức trên `PATH` khi
`obsidian.useOfficialCli` được bật.

## Hướng dẫn sử dụng thực tế

- Dùng `wiki search` + `wiki get` khi nguồn gốc và danh tính trang quan trọng.
- Dùng `wiki apply` thay vì chỉnh sửa thủ công các phần được tạo và quản lý.
- Dùng `wiki lint` trước khi tin vào nội dung mâu thuẫn hoặc có độ tin cậy thấp.
- Dùng `wiki compile` sau các lượt nhập hàng loạt hoặc thay đổi nguồn khi bạn muốn
  bảng điều khiển và bản tóm tắt đã biên soạn được làm mới ngay.
- Dùng `wiki bridge import` khi chế độ cầu nối phụ thuộc vào các tạo tác bộ nhớ
  mới được xuất.

## Liên kết cấu hình

Hành vi của `openclaw wiki` được định hình bởi:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Xem [Plugin wiki bộ nhớ](/vi/plugins/memory-wiki) để biết đầy đủ mô hình cấu hình.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Wiki bộ nhớ](/vi/plugins/memory-wiki)
