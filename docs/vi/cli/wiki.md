---
read_when:
    - Bạn muốn sử dụng CLI memory-wiki
    - Bạn đang lập tài liệu hoặc thay đổi `openclaw wiki`
summary: Tham chiếu CLI cho `openclaw wiki` (trạng thái kho memory-wiki, tìm kiếm, biên dịch, kiểm tra, áp dụng, cầu nối, nhập từ ChatGPT và các tiện ích hỗ trợ Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-12T07:50:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Kiểm tra và duy trì kho `memory-wiki`. Được cung cấp bởi plugin `memory-wiki` đi kèm.

Liên quan: [Plugin Memory Wiki](/vi/plugins/memory-wiki), [Tổng quan về bộ nhớ](/vi/concepts/memory), [CLI: bộ nhớ](/vi/cli/memory)

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
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Chọn tác nhân

Khi `plugins.entries.memory-wiki.config.vault.scope` là `agent`, hãy chọn
kho bằng tùy chọn cấp cao nhất `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

Trong cấu hình có nhiều tác nhân, các thao tác CLI bắt buộc phải có `--agent`
để một lệnh không thể đọc hoặc ghi vào một kho mặc định tùy ý. Nếu chỉ cấu hình
một tác nhân, tác nhân đó vẫn là mặc định. ID tác nhân không xác định sẽ khiến
thao tác thất bại trước khi bắt đầu thao tác trên kho. Tùy chọn này không thay đổi
đường dẫn đã chọn khi `vault.scope` là `global`.

Các máy khách Gateway tuân theo cùng quy tắc: truyền `agentId` trong các yêu cầu
`wiki.*` dựa trên kho đối với cấu hình nhiều tác nhân có phạm vi theo tác nhân.
Thiếu ID hoặc ID không xác định là lỗi. Các lượt tác nhân, công cụ wiki, phần bổ
sung kho ngữ liệu bộ nhớ và bản tóm lược lời nhắc đã biên dịch đã mang theo ngữ
cảnh tác nhân đang hoạt động trong thời gian chạy.

## Các lệnh

### `wiki status`

Hiển thị chế độ và phạm vi của kho, tác nhân đã phân giải, tình trạng hoạt động và khả năng sử dụng CLI Obsidian. Hãy dùng lệnh này trước tiên để kiểm tra xem kho dự kiến đã được khởi tạo chưa, chế độ cầu nối có hoạt động bình thường không hoặc tích hợp Obsidian có khả dụng không.

Khi chế độ cầu nối đang hoạt động và được cấu hình để đọc các tạo tác bộ nhớ, lệnh này truy vấn Gateway đang chạy để thấy cùng ngữ cảnh plugin bộ nhớ đang hoạt động như bộ nhớ của tác nhân/thời gian chạy.

### `wiki doctor`

Chạy các bước kiểm tra tình trạng wiki và báo cáo các cách khắc phục có thể thực hiện. Thoát với mã khác 0 khi không đạt trạng thái tốt.

Khi chế độ cầu nối đang hoạt động và được cấu hình để đọc các tạo tác bộ nhớ, lệnh này truy vấn Gateway đang chạy trước khi lập báo cáo. Các lượt nhập cầu nối bị vô hiệu hóa và cấu hình cầu nối không đọc tạo tác bộ nhớ vẫn hoạt động cục bộ/ngoại tuyến.

Các vấn đề thường gặp:

- chế độ cầu nối được bật nhưng không có tạo tác bộ nhớ công khai
- bố cục kho không hợp lệ hoặc bị thiếu
- thiếu CLI Obsidian bên ngoài khi cần chế độ Obsidian

### `wiki init`

Tạo bố cục kho wiki và các trang khởi đầu, bao gồm chỉ mục cấp cao nhất và các thư mục bộ nhớ đệm.

### `wiki ingest <path>`

Nhập một tệp Markdown hoặc văn bản cục bộ vào thư mục `sources/` của wiki dưới dạng trang nguồn. `<path>` phải là đường dẫn tệp cục bộ; hiện chưa hỗ trợ nhập từ URL. Tệp nhị phân sẽ bị từ chối.

Các trang nguồn được nhập mang frontmatter về nguồn gốc (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Sau đó, thao tác nhập luôn biên dịch lại kho.

Cờ: `--title <title>` ghi đè tiêu đề nguồn (mặc định: suy ra từ tên tệp).

### `wiki okf import <path>`

Nhập một gói Open Knowledge Format đã giải nén vào các trang khái niệm của wiki.

Trình nhập đọc mọi tài liệu khái niệm `.md` không thuộc diện dành riêng trong cây thư mục OKF, yêu cầu trường `type` không được để trống và coi các giá trị `type` OKF không xác định là khái niệm chung. Các tệp OKF dành riêng `index.md` và `log.md` không được nhập dưới dạng khái niệm.

Các trang đã nhập được làm phẳng trong `concepts/` để những luồng biên dịch, tìm kiếm, truy xuất, tạo bản tóm lược và bảng điều khiển hiện có của wiki nhận ra chúng ngay lập tức. ID khái niệm OKF gốc, `type`, `resource`, `tags`, dấu thời gian, đường dẫn nguồn và toàn bộ frontmatter được giữ nguyên trong frontmatter của trang. Các liên kết Markdown nội bộ của OKF được viết lại để trỏ đến các trang wiki đã tạo; liên kết hỏng hoặc liên kết bên ngoài được giữ nguyên. Sau đó, thao tác nhập luôn biên dịch lại kho.

Ví dụ:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Dựng lại chỉ mục, các khối liên quan, bảng điều khiển và bản tóm lược đã biên dịch. Ghi các tạo tác ổn định dành cho máy tại:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Nếu `render.createDashboards` được bật, thao tác biên dịch cũng làm mới các trang báo cáo.

### `wiki lint`

Kiểm tra kho và ghi báo cáo bao gồm:

- các vấn đề về cấu trúc (liên kết hỏng, ID bị thiếu/trùng lặp, thiếu loại trang hoặc tiêu đề, frontmatter không hợp lệ)
- thiếu sót về nguồn gốc (thiếu ID nguồn, thiếu nguồn gốc nhập)
- mâu thuẫn (các mâu thuẫn được gắn cờ, các khẳng định xung đột)
- câu hỏi chưa giải quyết
- các trang và khẳng định có độ tin cậy thấp
- các trang và khẳng định lỗi thời

Chạy lệnh này sau những cập nhật wiki đáng kể.

### `wiki search <query>`

Tìm kiếm nội dung wiki. Hành vi phụ thuộc vào cấu hình:

- `search.backend`: `shared` hoặc `local`
- `search.corpus`: `wiki`, `memory` hoặc `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` hoặc `raw-claim`

Dùng `wiki search` để xếp hạng và theo dõi nguồn gốc dành riêng cho wiki. Đối với một lượt truy xuất dùng chung trên phạm vi rộng, hãy ưu tiên `openclaw memory search` khi plugin bộ nhớ đang hoạt động cung cấp chức năng tìm kiếm dùng chung.

Các chế độ tìm kiếm:

- `find-person`: bí danh, tên định danh, tài khoản mạng xã hội, ID chính tắc và các trang cá nhân
- `route-question`: gợi ý về người nên hỏi/phù hợp nhất để hỏi và ngữ cảnh mối quan hệ
- `source-evidence`: các trang nguồn và trường bằng chứng có cấu trúc
- `raw-claim`: văn bản khẳng định có cấu trúc cùng siêu dữ liệu về khẳng định/bằng chứng

Ví dụ:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Đầu ra văn bản bao gồm các dòng `Claim:` và `Evidence:` khi một kết quả khớp với khẳng định có cấu trúc. Đầu ra JSON còn cung cấp `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` và `evidenceSourceIds` để tác nhân truy xét chi tiết.

### `wiki get <lookup>`

Đọc một trang wiki theo ID hoặc đường dẫn tương đối.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Áp dụng các thay đổi có phạm vi hẹp mà không cần chỉnh sửa tùy ý toàn bộ trang:

- `apply synthesis <title>`: tạo hoặc làm mới một trang tổng hợp với nội dung tóm tắt được quản lý
- `apply metadata <lookup>`: cập nhật siêu dữ liệu trên một trang hiện có

Cả hai đều chấp nhận `--source-id`, `--contradiction`, `--question` (mỗi cờ có thể lặp lại), `--confidence <n>` (0-1) và `--status <status>`. `apply metadata` cũng chấp nhận `--clear-confidence` để xóa giá trị độ tin cậy đã lưu. Đây là cách được hỗ trợ để phát triển các trang wiki mà vẫn giữ nguyên các khối được tạo và quản lý.

### `wiki bridge import`

Nhập các tạo tác bộ nhớ công khai từ plugin bộ nhớ đang hoạt động vào các trang nguồn dựa trên cầu nối. Dùng lệnh này trong chế độ `bridge` để lấy các tạo tác bộ nhớ được xuất mới nhất vào kho wiki.

Đối với hoạt động đọc tạo tác cầu nối đang hoạt động, CLI định tuyến thao tác nhập qua RPC của Gateway để sử dụng ngữ cảnh plugin bộ nhớ trong thời gian chạy. Nếu thao tác nhập cầu nối bị vô hiệu hóa hoặc chức năng đọc tạo tác bị tắt, lệnh vẫn giữ hành vi nhập bằng 0 cục bộ/ngoại tuyến. Việc làm mới chỉ mục sau khi nhập được kiểm soát bởi `ingest.autoCompile`.

### `wiki unsafe-local import`

Nhập từ các đường dẫn cục bộ được cấu hình rõ ràng (`unsafeLocal.paths`) trong chế độ `unsafe-local`. Có chủ đích ở trạng thái thử nghiệm và chỉ dùng trên cùng một máy. Việc làm mới chỉ mục sau khi nhập được kiểm soát bởi `ingest.autoCompile`.

### `wiki chatgpt import`

Nhập bản xuất ChatGPT vào các trang nguồn wiki dạng bản nháp.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Cờ                | Mặc định   | Mô tả                                                          |
| ----------------- | ---------- | -------------------------------------------------------------- |
| `--export <path>` | (bắt buộc) | Thư mục xuất ChatGPT hoặc đường dẫn `conversations.json`.       |
| `--dry-run`       | `false`    | Xem trước số lượng đã tạo/cập nhật/bỏ qua mà không ghi các trang. |

Một lượt nhập không phải chạy thử và có thay đổi bất kỳ trang nào sẽ ghi lại ID lượt nhập, được in trong phần tóm tắt và cần thiết để hoàn tác.

### `wiki chatgpt rollback <run-id>`

Hoàn tác một lượt nhập ChatGPT đã áp dụng trước đó, xóa các trang mà lượt nhập đã tạo và khôi phục các trang mà lượt nhập đã ghi đè. Không thực hiện thao tác nào (và báo cáo `alreadyRolledBack`) nếu lượt nhập đã được hoàn tác.

### `wiki obsidian ...`

Các lệnh trợ giúp Obsidian dành cho kho chạy ở chế độ thân thiện với Obsidian: `status`, `search`, `open`, `command`, `daily`. Các lệnh này yêu cầu CLI `obsidian` chính thức có trong `PATH` khi `obsidian.useOfficialCli` được bật.

Quá trình xác thực cấu hình từ chối `obsidian.useOfficialCli: true` khi
`vault.scope` là `agent` vì `obsidian.vaultName` là một thiết lập toàn cục,
không phải ánh xạ theo từng tác nhân. Khả năng kết xuất Markdown thân thiện
với Obsidian vẫn khả dụng.

## Hướng dẫn sử dụng thực tế

- Dùng `wiki search` + `wiki get` khi nguồn gốc và danh tính trang là quan trọng.
- Dùng `wiki apply` thay vì chỉnh sửa thủ công các phần được tạo và quản lý.
- Dùng `wiki lint` trước khi tin tưởng nội dung mâu thuẫn hoặc có độ tin cậy thấp.
- Dùng `wiki compile` sau khi nhập hàng loạt hoặc thay đổi nguồn nếu bạn muốn có ngay bảng điều khiển và bản tóm lược đã biên dịch mới nhất.
- Dùng `wiki okf import` khi danh mục dữ liệu, bản xuất tài liệu hoặc quy trình làm giàu dữ liệu của tác nhân đã tạo ra các gói Markdown OKF.
- Dùng `wiki bridge import` khi chế độ cầu nối phụ thuộc vào các tạo tác bộ nhớ mới được xuất.

## Các cấu hình liên quan

Hành vi của `openclaw wiki` chịu ảnh hưởng bởi:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Xem [Plugin Memory Wiki](/vi/plugins/memory-wiki) để biết đầy đủ mô hình cấu hình.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Wiki bộ nhớ](/vi/plugins/memory-wiki)
