---
read_when:
    - Bạn muốn dùng CLI memory-wiki
    - Bạn đang lập tài liệu hoặc thay đổi `openclaw wiki`
summary: Tài liệu tham khảo CLI cho `openclaw wiki` (trạng thái kho lưu trữ memory-wiki, search, compile, lint, apply, bridge và các trình trợ giúp Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-06-27T17:21:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Kiểm tra và bảo trì kho `memory-wiki`.

Được cung cấp bởi Plugin `memory-wiki` đi kèm.

Liên quan:

- [Plugin Memory Wiki](/vi/plugins/memory-wiki)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [CLI: bộ nhớ](/vi/cli/memory)

## Dùng để làm gì

Dùng `openclaw wiki` khi bạn muốn có một kho tri thức đã biên dịch với:

- tìm kiếm và đọc trang theo kiểu wiki gốc
- các bản tổng hợp giàu thông tin nguồn gốc
- báo cáo mâu thuẫn và độ mới
- nhập cầu nối từ Plugin bộ nhớ đang hoạt động
- các trình trợ giúp Obsidian CLI tùy chọn

## Các lệnh thường dùng

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
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

Kiểm tra chế độ kho hiện tại, tình trạng và khả năng dùng Obsidian CLI.

Dùng lệnh này trước khi bạn không chắc kho đã được khởi tạo chưa, chế độ cầu nối
có đang ổn không, hoặc tích hợp Obsidian có sẵn không.

Khi chế độ cầu nối đang hoạt động và được cấu hình để đọc hiện vật bộ nhớ, lệnh này
truy vấn Gateway đang chạy để thấy cùng ngữ cảnh Plugin bộ nhớ đang hoạt động như
bộ nhớ của agent/runtime.

### `wiki doctor`

Chạy kiểm tra tình trạng wiki và hiển thị các vấn đề về cấu hình hoặc kho.

Khi chế độ cầu nối đang hoạt động và được cấu hình để đọc hiện vật bộ nhớ, lệnh này
truy vấn Gateway đang chạy trước khi tạo báo cáo. Các lượt nhập cầu nối bị tắt
và cấu hình cầu nối không đọc hiện vật bộ nhớ vẫn chạy cục bộ/ngoại tuyến.

Các vấn đề thường gặp gồm:

- chế độ cầu nối được bật mà không có hiện vật bộ nhớ công khai
- bố cục kho không hợp lệ hoặc bị thiếu
- thiếu Obsidian CLI bên ngoài khi kỳ vọng chế độ Obsidian

### `wiki init`

Tạo bố cục kho wiki và các trang khởi đầu.

Lệnh này khởi tạo cấu trúc gốc, bao gồm các chỉ mục cấp cao nhất và thư mục
bộ nhớ đệm.

### `wiki ingest <path-or-url>`

Nhập nội dung vào lớp nguồn của wiki.

Ghi chú:

- nhập URL được kiểm soát bởi `ingest.allowUrlIngest`
- các trang nguồn đã nhập giữ thông tin nguồn gốc trong frontmatter
- tự động biên dịch có thể chạy sau khi nhập nếu được bật

### `wiki okf import <path>`

Nhập một gói Open Knowledge Format đã giải nén vào các trang khái niệm wiki.

Bộ nhập đọc mọi tài liệu khái niệm `.md` không dành riêng trong cây thư mục OKF,
yêu cầu trường `type` không rỗng, và xử lý các giá trị OKF `type` không xác định
như khái niệm chung. Các tệp OKF dành riêng `index.md` và `log.md` không được
nhập dưới dạng khái niệm.

Các trang đã nhập được làm phẳng dưới `concepts/` để các luồng biên dịch,
tìm kiếm, lấy, tóm tắt và bảng điều khiển wiki hiện có thấy chúng ngay lập tức.
ID khái niệm OKF gốc, `type`, `resource`, `tags`, dấu thời gian, đường dẫn nguồn
và toàn bộ frontmatter được giữ trong frontmatter của trang. Các liên kết markdown
OKF nội bộ được viết lại sang các trang wiki đã tạo; liên kết hỏng hoặc bên ngoài
được giữ nguyên.

Ví dụ:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Xây dựng lại chỉ mục, khối liên quan, bảng điều khiển và các bản tóm tắt đã biên dịch.

Lệnh này ghi các hiện vật ổn định dành cho máy dưới:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Nếu `render.createDashboards` được bật, biên dịch cũng làm mới các trang báo cáo.

### `wiki lint`

Lint kho và báo cáo:

- vấn đề cấu trúc
- thiếu sót về nguồn gốc
- mâu thuẫn
- câu hỏi mở
- trang/tuyên bố có độ tin cậy thấp
- trang/tuyên bố lỗi thời

Chạy lệnh này sau các cập nhật wiki đáng kể.

### `wiki search <query>`

Tìm kiếm nội dung wiki.

Hành vi phụ thuộc vào cấu hình:

- `search.backend`: `shared` hoặc `local`
- `search.corpus`: `wiki`, `memory`, hoặc `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence`, hoặc
  `raw-claim`

Dùng `wiki search` khi bạn muốn xếp hạng riêng cho wiki hoặc chi tiết nguồn gốc.
Để thực hiện một lượt nhớ lại dùng chung rộng, hãy ưu tiên `openclaw memory search`
khi Plugin bộ nhớ đang hoạt động cung cấp tìm kiếm dùng chung.

Các chế độ tìm kiếm giúp agent chọn đúng bề mặt:

- `find-person`: bí danh, handle, mạng xã hội, ID chuẩn và trang người
- `route-question`: gợi ý hỏi ai/phù hợp nhất để dùng vào việc gì và ngữ cảnh quan hệ
- `source-evidence`: trang nguồn và trường bằng chứng có cấu trúc
- `raw-claim`: văn bản tuyên bố có cấu trúc với siêu dữ liệu tuyên bố/bằng chứng

Ví dụ:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Đầu ra văn bản bao gồm các dòng `Claim:` và `Evidence:` khi một kết quả khớp với
tuyên bố có cấu trúc. Đầu ra JSON cũng hiển thị `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds`, và
`evidenceSourceIds` để agent đào sâu ở phía agent.

### `wiki get <lookup>`

Đọc một trang wiki theo ID hoặc đường dẫn tương đối.

Ví dụ:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Áp dụng các thay đổi hẹp mà không chỉnh sửa trang tự do.

Các luồng được hỗ trợ gồm:

- tạo/cập nhật một trang tổng hợp
- cập nhật siêu dữ liệu trang
- đính kèm ID nguồn
- thêm câu hỏi
- thêm mâu thuẫn
- cập nhật độ tin cậy/trạng thái
- ghi tuyên bố có cấu trúc

Lệnh này tồn tại để wiki có thể phát triển an toàn mà không cần chỉnh sửa thủ công
các khối được quản lý.

### `wiki bridge import`

Nhập hiện vật bộ nhớ công khai từ Plugin bộ nhớ đang hoạt động vào các trang nguồn
dựa trên cầu nối.

Dùng lệnh này trong chế độ `bridge` khi bạn muốn kéo các hiện vật bộ nhớ mới nhất
đã xuất vào kho wiki.

Đối với các lượt đọc hiện vật cầu nối đang hoạt động, CLI định tuyến lượt nhập qua Gateway RPC
để lượt nhập dùng ngữ cảnh Plugin bộ nhớ runtime. Nếu các lượt nhập cầu nối bị tắt
hoặc lượt đọc hiện vật bị tắt, lệnh giữ hành vi không nhập cục bộ/ngoại tuyến.

### `wiki unsafe-local import`

Nhập từ các đường dẫn cục bộ được cấu hình rõ ràng trong chế độ `unsafe-local`.

Điều này được chủ ý đặt là thử nghiệm và chỉ trên cùng máy.

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

- Dùng `wiki search` + `wiki get` khi nguồn gốc và định danh trang quan trọng.
- Dùng `wiki apply` thay vì chỉnh sửa thủ công các phần được tạo và quản lý.
- Dùng `wiki lint` trước khi tin nội dung mâu thuẫn hoặc có độ tin cậy thấp.
- Dùng `wiki compile` sau các lượt nhập hàng loạt hoặc thay đổi nguồn khi bạn muốn
  bảng điều khiển và bản tóm tắt đã biên dịch mới ngay lập tức.
- Dùng `wiki okf import` khi danh mục dữ liệu, bản xuất tài liệu hoặc pipeline
  làm giàu của agent đã phát ra các gói markdown OKF.
- Dùng `wiki bridge import` khi chế độ cầu nối phụ thuộc vào hiện vật bộ nhớ
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

Xem [Plugin Memory Wiki](/vi/plugins/memory-wiki) để biết đầy đủ mô hình cấu hình.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Memory wiki](/vi/plugins/memory-wiki)
