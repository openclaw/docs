---
read_when:
    - Bạn muốn sử dụng CLI memory-wiki
    - Bạn đang lập tài liệu hoặc thay đổi `openclaw wiki`
summary: Tài liệu tham khảo CLI cho `openclaw wiki` (trạng thái kho memory-wiki, tìm kiếm, biên dịch, kiểm tra lỗi, áp dụng, cầu nối, nhập từ ChatGPT và các tiện ích hỗ trợ Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-21T13:30:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1f793d52de270068cf3a06b13f52242bb66738235718639486e090a2de213e73
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Kiểm tra và bảo trì kho `memory-wiki`. Được cung cấp bởi plugin `memory-wiki` tùy chọn đi kèm. Hãy bật plugin trước lần sử dụng đầu tiên:

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

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

## Chọn agent

Khi `plugins.entries.memory-wiki.config.vault.scope` là `agent`, hãy chọn
kho bằng tùy chọn cấp cao nhất `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

Trong thiết lập có nhiều agent đã được cấu hình, `--agent` là bắt buộc đối với các thao tác CLI
để một lệnh không thể đọc hoặc ghi vào một kho mặc định tùy ý. Nếu
chỉ có một agent được cấu hình, agent đó vẫn là mặc định. ID agent không xác định
sẽ khiến thao tác thất bại trước khi thao tác với kho bắt đầu. Tùy chọn này không thay đổi
đường dẫn đã chọn khi `vault.scope` là `global`.

Các máy khách Gateway tuân theo cùng quy tắc: truyền `agentId` trong các yêu cầu `wiki.*`
dựa trên kho ở thiết lập đa agent có phạm vi theo agent. ID bị thiếu hoặc không xác định là một
lỗi. Các lượt chạy của agent, công cụ wiki, phần bổ sung kho dữ liệu bộ nhớ và bản tóm lược prompt
đã biên dịch đã mang theo ngữ cảnh agent đang hoạt động của runtime.

## Các lệnh

### `wiki status`

Hiển thị chế độ và phạm vi của kho, agent đã phân giải, tình trạng hoạt động và khả năng sử dụng CLI Obsidian. Hãy dùng lệnh này trước tiên để kiểm tra xem kho dự kiến đã được khởi tạo, chế độ cầu nối có hoạt động bình thường hay không hoặc tích hợp Obsidian có khả dụng hay không.

Khi chế độ cầu nối đang hoạt động và được cấu hình để đọc các thành phần bộ nhớ, lệnh này truy vấn Gateway đang chạy để nhận cùng ngữ cảnh plugin bộ nhớ đang hoạt động như bộ nhớ của agent/runtime.

### `wiki doctor`

Chạy các kiểm tra tình trạng wiki và báo cáo các cách khắc phục có thể thực hiện. Thoát với mã khác 0 khi không hoạt động bình thường.

Khi chế độ cầu nối đang hoạt động và được cấu hình để đọc các thành phần bộ nhớ, lệnh này truy vấn Gateway đang chạy trước khi tạo báo cáo. Các lượt nhập qua cầu nối bị tắt và cấu hình cầu nối không đọc thành phần bộ nhớ vẫn hoạt động cục bộ/ngoại tuyến.

Các vấn đề thường gặp:

- chế độ cầu nối được bật nhưng không có thành phần bộ nhớ công khai
- bố cục kho không hợp lệ hoặc bị thiếu
- thiếu CLI Obsidian bên ngoài khi dự kiến dùng chế độ Obsidian

### `wiki init`

Tạo bố cục kho wiki và các trang khởi đầu, bao gồm chỉ mục cấp cao nhất và thư mục bộ nhớ đệm.

### `wiki ingest <path>`

Nhập một tệp Markdown hoặc văn bản cục bộ vào thư mục `sources/` của wiki dưới dạng trang nguồn. `<path>` phải là đường dẫn tệp cục bộ; hiện chưa hỗ trợ nhập từ URL. Tệp nhị phân sẽ bị từ chối.

Các trang nguồn đã nhập chứa frontmatter về nguồn gốc (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Sau đó, thao tác nhập luôn biên dịch lại kho.

Cờ: `--title <title>` ghi đè tiêu đề nguồn (mặc định: được suy ra từ tên tệp).

### `wiki okf import <path>`

Nhập một gói Open Knowledge Format đã giải nén vào các trang khái niệm của wiki.

Trình nhập đọc mọi tài liệu khái niệm `.md` không dành riêng trong cây thư mục OKF, yêu cầu trường `type` không được để trống và coi các giá trị `type` OKF không xác định là khái niệm chung. Các tệp `index.md` và `log.md` dành riêng của OKF không được nhập dưới dạng khái niệm.

Các trang đã nhập được làm phẳng trong `concepts/` để các luồng biên dịch, tìm kiếm, truy xuất, tạo bản tóm lược và bảng điều khiển hiện có của wiki nhận diện chúng ngay lập tức. ID khái niệm OKF gốc, `type`, `resource`, `tags`, dấu thời gian, đường dẫn nguồn và toàn bộ frontmatter được giữ nguyên trong frontmatter của trang. Các liên kết Markdown OKF nội bộ được viết lại để trỏ đến các trang wiki đã tạo; liên kết hỏng hoặc liên kết bên ngoài được giữ nguyên. Sau đó, thao tác nhập luôn biên dịch lại kho.

Ví dụ:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Tạo lại chỉ mục, khối liên quan, bảng điều khiển và ảnh chụp truy vấn/prompt đã biên dịch. Ảnh chụp được lưu trong trạng thái plugin SQLite dùng chung của OpenClaw và được giữ trong bộ nhớ để chiếu prompt đồng bộ; thao tác này không tạo tệp bộ nhớ đệm trong kho.

Nếu `render.createDashboards` được bật, thao tác biên dịch cũng làm mới các trang báo cáo.

### `wiki lint`

Kiểm tra quy tắc của kho và ghi báo cáo bao gồm:

- các vấn đề về cấu trúc (liên kết hỏng, ID bị thiếu/trùng lặp, thiếu loại trang hoặc tiêu đề, frontmatter không hợp lệ)
- các khoảng trống về nguồn gốc (thiếu ID nguồn, thiếu nguồn gốc nhập)
- các mâu thuẫn (mâu thuẫn được gắn cờ, các khẳng định xung đột)
- các câu hỏi chưa được giải đáp
- các trang và khẳng định có độ tin cậy thấp
- các trang và khẳng định đã lỗi thời

Hãy chạy lệnh này sau các cập nhật wiki quan trọng.

### `wiki search <query>`

Tìm kiếm nội dung wiki. Hành vi phụ thuộc vào cấu hình:

- `search.backend`: `shared` hoặc `local`
- `search.corpus`: `wiki`, `memory` hoặc `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` hoặc `raw-claim`

Dùng `wiki search` để xếp hạng và truy xuất nguồn gốc dành riêng cho wiki. Đối với một lượt truy hồi dùng chung rộng, hãy ưu tiên `openclaw memory search` khi plugin bộ nhớ đang hoạt động cung cấp tính năng tìm kiếm dùng chung.

Các chế độ tìm kiếm:

- `find-person`: bí danh, tên định danh, tài khoản mạng xã hội, ID chính tắc và trang cá nhân
- `route-question`: gợi ý về người nên hỏi/trường hợp sử dụng phù hợp nhất và ngữ cảnh quan hệ
- `source-evidence`: trang nguồn và các trường bằng chứng có cấu trúc
- `raw-claim`: văn bản khẳng định có cấu trúc kèm siêu dữ liệu về khẳng định/bằng chứng

Ví dụ:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Đầu ra văn bản bao gồm các dòng `Claim:` và `Evidence:` khi một kết quả khớp với khẳng định có cấu trúc. Đầu ra JSON còn cung cấp `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` và `evidenceSourceIds` để agent xem chi tiết.

### `wiki get <lookup>`

Đọc một trang wiki theo ID hoặc đường dẫn tương đối.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Áp dụng các thay đổi có phạm vi hẹp mà không chỉnh sửa tự do toàn bộ trang:

- `apply synthesis <title>`: tạo hoặc làm mới trang tổng hợp với phần nội dung tóm tắt được quản lý
- `apply metadata <lookup>`: cập nhật siêu dữ liệu trên một trang hiện có

Cả hai đều chấp nhận `--source-id`, `--contradiction`, `--question` (mỗi tùy chọn có thể lặp lại), `--confidence <n>` (0-1) và `--status <status>`. `apply metadata` cũng chấp nhận `--clear-confidence` để xóa giá trị độ tin cậy đã lưu. Đây là cách được hỗ trợ để phát triển các trang wiki mà vẫn giữ nguyên các khối được tạo và quản lý.

### `wiki bridge import`

Nhập các thành phần bộ nhớ công khai từ plugin bộ nhớ đang hoạt động vào các trang nguồn dựa trên cầu nối. Dùng lệnh này trong chế độ `bridge` để kéo các thành phần bộ nhớ được xuất mới nhất vào kho wiki.

Đối với thao tác đọc thành phần qua cầu nối đang hoạt động, CLI định tuyến thao tác nhập qua Gateway RPC để sử dụng ngữ cảnh plugin bộ nhớ của runtime. Nếu thao tác nhập qua cầu nối bị tắt hoặc tính năng đọc thành phần bị tắt, lệnh sẽ duy trì hành vi cục bộ/ngoại tuyến không nhập gì. Việc làm mới chỉ mục sau khi nhập được kiểm soát bởi `ingest.autoCompile`.

### `wiki unsafe-local import`

Nhập từ các đường dẫn cục bộ được cấu hình rõ ràng (`unsafeLocal.paths`) trong chế độ `unsafe-local`. Đây là tính năng thử nghiệm có chủ đích và chỉ dùng trên cùng một máy. Việc làm mới chỉ mục sau khi nhập được kiểm soát bởi `ingest.autoCompile`.

### `wiki chatgpt import`

Nhập bản xuất ChatGPT vào các trang nguồn wiki dạng bản nháp.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Cờ                | Mặc định   | Mô tả                                                          |
| ----------------- | ---------- | -------------------------------------------------------------- |
| `--export <path>` | (bắt buộc) | Thư mục xuất ChatGPT hoặc đường dẫn `conversations.json`.        |
| `--dry-run`       | `false`    | Xem trước số lượng mục được tạo/cập nhật/bỏ qua mà không ghi trang. |

Một thao tác nhập không ở chế độ chạy thử làm thay đổi bất kỳ trang nào sẽ ghi lại ID lượt nhập, được in trong phần tóm tắt và cần thiết để hoàn tác.

### `wiki chatgpt rollback <run-id>`

Hoàn tác một lượt nhập ChatGPT đã áp dụng trước đó, xóa các trang do lượt nhập tạo và khôi phục các trang bị ghi đè. Không thực hiện thao tác nào (và báo cáo `alreadyRolledBack`) nếu lượt nhập đã được hoàn tác.

### `wiki obsidian ...`

Các lệnh trợ giúp Obsidian dành cho kho chạy ở chế độ thân thiện với Obsidian: `status`, `search`, `open`, `command`, `daily`. Các lệnh này yêu cầu CLI `obsidian` chính thức có trong `PATH` khi `obsidian.useOfficialCli` được bật.

Quá trình xác thực cấu hình từ chối `obsidian.useOfficialCli: true` khi
`vault.scope` là `agent` vì `obsidian.vaultName` là một thiết lập toàn cục duy nhất,
không phải ánh xạ theo từng agent. Khả năng kết xuất Markdown thân thiện với Obsidian vẫn
khả dụng.

## Hướng dẫn sử dụng thực tế

- Dùng `wiki search` + `wiki get` khi nguồn gốc và danh tính trang là quan trọng.
- Dùng `wiki apply` thay vì chỉnh sửa thủ công các phần được tạo và quản lý.
- Dùng `wiki lint` trước khi tin tưởng nội dung mâu thuẫn hoặc có độ tin cậy thấp.
- Dùng `wiki compile` sau khi nhập hàng loạt hoặc thay đổi nguồn nếu muốn bảng điều khiển và bản tóm lược đã biên dịch được làm mới ngay lập tức.
- Dùng `wiki okf import` khi danh mục dữ liệu, bản xuất tài liệu hoặc pipeline làm giàu dữ liệu của agent đã xuất các gói Markdown OKF.
- Dùng `wiki bridge import` khi chế độ cầu nối phụ thuộc vào các thành phần bộ nhớ mới được xuất.

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

Xem [plugin Memory Wiki](/vi/plugins/memory-wiki) để biết đầy đủ mô hình cấu hình.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Wiki bộ nhớ](/vi/plugins/memory-wiki)
