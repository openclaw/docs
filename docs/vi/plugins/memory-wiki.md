---
read_when:
    - Bạn muốn có kiến thức lâu dài vượt ra ngoài các ghi chú MEMORY.md thuần túy
    - Bạn đang cấu hình plugin memory-wiki đi kèm
    - Bạn cần các kho wiki riêng biệt cho các agent trong cùng một Gateway
    - Bạn muốn tìm hiểu về wiki_search, wiki_get hoặc chế độ bridge
summary: 'memory-wiki: kho tri thức được biên soạn với thông tin nguồn gốc, các luận điểm, bảng điều khiển và chế độ cầu nối'
title: Wiki bộ nhớ
x-i18n:
    generated_at: "2026-07-19T05:52:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cba1a17dc6a6021df51ebc8028663034bb82909aafd9e8e5716fca3a8ea3d03a
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` là một plugin đi kèm có chức năng biên soạn kiến thức bền vững thành một
wiki có thể điều hướng: các trang có tính xác định, các luận điểm có cấu trúc kèm bằng chứng,
nguồn gốc, bảng điều khiển và bản tóm lược mà máy có thể đọc được.

Plugin này không thay thế plugin Active Memory. Việc truy hồi, thăng cấp, lập chỉ mục và
Dreaming vẫn thuộc quyền quản lý của bất kỳ phần phụ trợ bộ nhớ nào được cấu hình
(`memory-core`, QMD, Honcho, v.v.). `memory-wiki` hoạt động bên cạnh phần phụ trợ đó và biên soạn
kiến thức thành một lớp wiki được duy trì.

| Lớp                  | Quản lý                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Plugin Active Memory | Truy hồi, tìm kiếm ngữ nghĩa, thăng cấp, Dreaming, runtime bộ nhớ                  |
| `memory-wiki`        | Các trang wiki đã biên soạn, bản tổng hợp giàu thông tin nguồn gốc, bảng điều khiển, tìm kiếm/lấy/áp dụng wiki |

Quy tắc thực tế:

- `memory_search` để thực hiện một lượt truy hồi rộng trên mọi kho ngữ liệu đã cấu hình
- `wiki_search` / `wiki_get` khi cần xếp hạng dành riêng cho wiki, thông tin nguồn gốc hoặc cấu trúc niềm tin cấp trang
- `memory_search corpus=all` để bao quát cả hai lớp trong một lệnh gọi khi plugin Active Memory hỗ trợ chọn kho ngữ liệu

Một thiết lập ưu tiên cục bộ phổ biến: QMD làm phần phụ trợ Active Memory để truy hồi và
`memory-wiki` ở chế độ `bridge` cho các trang tổng hợp bền vững. Xem ví dụ
QMD + chế độ cầu nối trong phần [Cấu hình](#configuration).

Nếu chế độ cầu nối báo cáo không có hiện vật nào được xuất, thì plugin Active Memory
hiện không cung cấp đầu vào cầu nối công khai. Trước tiên hãy chạy `openclaw wiki doctor`,
sau đó xác nhận plugin Active Memory hỗ trợ hiện vật công khai.

## Chế độ vault

- `isolated` (mặc định): vault riêng, nguồn riêng, không phụ thuộc vào plugin Active Memory. Dùng chế độ này cho một kho kiến thức tuyển chọn độc lập.
- `bridge`: đọc các hiện vật bộ nhớ công khai và nhật ký sự kiện từ plugin Active Memory thông qua các điểm nối SDK plugin công khai. Dùng chế độ này để biên soạn các hiện vật do plugin bộ nhớ xuất mà không truy cập vào phần nội bộ riêng tư của plugin.
- `unsafe-local`: lối thoát tường minh trên cùng máy dành cho các đường dẫn cục bộ riêng tư. Được chủ ý xem là thử nghiệm và không có tính di động; chỉ dùng khi bạn hiểu ranh giới tin cậy và đặc biệt cần quyền truy cập hệ thống tệp cục bộ mà chế độ cầu nối không thể cung cấp.

Chế độ vault và phạm vi vault là hai lựa chọn riêng biệt:

- `vaultMode` chọn nguồn đầu vào wiki.
- `vault.scope` chọn tất cả agent dùng chung một vault hay mỗi agent có một vault con.

`vault.scope: "global"` là mặc định và duy trì hành vi một vault hiện có.
Dùng `vault.scope: "agent"` với chế độ `isolated` hoặc `bridge` khi
các agent không được dùng chung trang wiki, bản tóm lược đã biên soạn, kết quả tìm kiếm hoặc thao tác ghi.
Không thể kết hợp phạm vi agent với chế độ `unsafe-local` vì các đường dẫn
riêng tư đã cấu hình đó không phải là đầu vào do agent sở hữu. Quá trình xác thực cấu hình sẽ từ chối
tổ hợp này.

Chế độ cầu nối có thể lập chỉ mục những nội dung sau, tùy theo nút bật/tắt cấu hình `bridge.*`:

- các hiện vật bộ nhớ đã xuất (`indexMemoryRoot`)
- ghi chú hằng ngày (`indexDailyNotes`)
- báo cáo Dreaming (`indexDreamReports`)
- nhật ký sự kiện bộ nhớ (`followMemoryEvents`)

Khi chế độ cầu nối đang hoạt động và `bridge.readMemoryArtifacts` được bật,
`openclaw wiki status`, `openclaw wiki doctor` và `openclaw wiki bridge
import` được định tuyến qua Gateway đang chạy để chúng thấy cùng ngữ cảnh plugin Active Memory
như bộ nhớ agent/runtime. Nếu cầu nối bị tắt hoặc tính năng đọc hiện vật
bị tắt, các lệnh đó vẫn giữ hành vi cục bộ/ngoại tuyến.

## Bố cục vault

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Nội dung được quản lý nằm trong các khối đã tạo; các khối ghi chú của con người được
giữ nguyên qua mỗi lần tạo lại.

- `sources/`: tài liệu thô đã nhập và các trang dựa trên cầu nối/cục bộ không an toàn
- `entities/`: các sự vật, con người, hệ thống, dự án và đối tượng bền vững
- `concepts/`: ý tưởng, khái niệm trừu tượng, mẫu và chính sách (đồng thời là vị trí đích cho nội dung nhập OKF)
- `syntheses/`: bản tóm tắt đã biên soạn và bản tổng hợp được duy trì
- `reports/`: bảng điều khiển đã tạo

## Nhập Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Nhập một gói Open Knowledge Format đã giải nén vào các trang khái niệm của wiki. Phù hợp
khi một danh mục dữ liệu, trình thu thập tài liệu hoặc agent làm giàu dữ liệu đã
tạo ra OKF: giữ OKF làm hiện vật trao đổi có tính di động, để `memory-wiki`
chuyển nó thành các trang khái niệm gốc của OpenClaw và các bản tóm lược đã biên soạn.

- các tệp `.md` không dành riêng là tài liệu khái niệm
- mỗi khái niệm được nhập yêu cầu trường frontmatter `type` không trống; thiếu `type` sẽ tạo cảnh báo `missing-type` và tệp bị bỏ qua
- các giá trị `type` không xác định được chấp nhận dưới dạng khái niệm chung
- `index.md` và `log.md` được dành riêng và không bao giờ được nhập dưới dạng khái niệm
- các liên kết Markdown bị hỏng hoặc liên kết ngoài được giữ nguyên

Các trang được nhập được dàn phẳng dưới `concepts/` để các luồng biên soạn, tìm kiếm, lấy và
bảng điều khiển hiện có có thể thấy chúng mà không cần cây wiki thứ hai. Mỗi trang giữ
ID khái niệm OKF gốc, đường dẫn nguồn, `type`, `resource`, `tags`, dấu thời gian
và toàn bộ frontmatter của trình tạo. Các liên kết OKF nội bộ được viết lại để trỏ đến
các trang khái niệm wiki đã tạo, đồng thời phát ra các mục `relationships` có cấu trúc với
`kind: okf-link`.

## Luận điểm và bằng chứng có cấu trúc

Các trang chứa frontmatter `claims` có cấu trúc, không chỉ văn bản tự do. Mỗi
luận điểm có thể bao gồm `id`, `text`, `status`, `confidence`, `evidence[]` và
`updatedAt`. Mỗi mục bằng chứng có thể bao gồm `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` và `updatedAt`.

Điều này khiến wiki hoạt động như một lớp niềm tin thay vì một kho ghi chú thụ động.
Các luận điểm có thể được theo dõi, chấm điểm, phản biện và đối chiếu ngược về nguồn để giải quyết.

## Siêu dữ liệu thực thể dành cho agent

Các trang thực thể chứa siêu dữ liệu định tuyến chung có thể dùng cho con người, nhóm,
hệ thống, dự án hoặc bất kỳ loại thực thể nào khác:

- `entityType`: ví dụ `person`, `team`, `system`, `project`
- `canonicalId`: khóa danh tính ổn định xuyên suốt các bí danh và nội dung nhập
- `aliases`: tên, định danh hoặc nhãn phân giải về cùng một trang
- `privacyTier`: chuỗi dạng tự do; `public` được xem là không cần review, mọi giá trị khác (ví dụ `local-private`, `sensitive`, `confirm-before-use`) đều được gắn cờ trong `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: gợi ý định tuyến ngắn gọn
- `lastRefreshedAt`: dấu thời gian làm mới nguồn, tách biệt với thời gian chỉnh sửa trang
- `personCard`: thẻ định tuyến tùy chọn dành riêng cho cá nhân (định danh, mạng xã hội, email, múi giờ, luồng, nội dung nên hỏi, nội dung nên tránh hỏi, độ tin cậy, cấp độ riêng tư)
- `relationships`: các cạnh có kiểu đến những trang liên quan (đích, loại, trọng số, độ tin cậy, loại bằng chứng, cấp độ riêng tư, ghi chú)

Đối với wiki về con người, hãy bắt đầu với `reports/person-agent-directory.md`, sau đó mở
trang cá nhân bằng `wiki_get` trước khi sử dụng thông tin liên hệ hoặc các
sự kiện được suy luận.

<Accordion title="Ví dụ về trang thực thể">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Định tuyến hệ sinh thái mẫu
notEnoughFor:
  - phê duyệt pháp lý
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Hệ sinh thái mẫu
  askFor:
    - Câu hỏi về đợt triển khai mẫu
  avoidAskingFor:
    - các quyết định thanh toán không liên quan
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Người khác
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex hữu ích cho việc định tuyến hệ sinh thái mẫu.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Pipeline biên soạn

Quá trình biên soạn đọc các trang wiki, chuẩn hóa bản tóm tắt và duy trì một bản chụp
dành cho máy trong trạng thái plugin SQLite dùng chung của OpenClaw. Mã runtime sử dụng
bản chụp của chủ sở hữu do vòng đời quản lý để tải SQLite trong quá trình chuẩn bị prompt bất đồng bộ;
quá trình lắp ráp prompt đồng bộ không bao giờ thu thập dữ liệu từ Markdown hoặc đọc tệp bộ nhớ đệm.
Đầu ra đã biên soạn cũng hỗ trợ việc lập chỉ mục wiki ở lượt đầu tiên cho thao tác tìm kiếm/lấy, tra cứu ID
luận điểm ngược về trang sở hữu, phần bổ sung prompt ngắn gọn và tạo
báo cáo.

Các chỉnh sửa nguồn và khôi phục vault chỉ trở nên khả dụng cho máy sau lần
biên soạn tiếp theo. Việc khởi động lại hoặc làm mới vòng đời plugin sẽ so sánh ấn bản biên soạn
được xâu chuỗi nhân quả của vault với SQLite và từ chối bản chụp từ một
trạng thái mới hơn đã bị hoàn tác. Trình biên dịch bắt đầu trước khi hoàn tác không thể
xuất bản dựa trên trạng thái tiền nhiệm đã khôi phục. Quá trình chuẩn bị prompt không thăm dò
vault hoặc cài đặt trình theo dõi tệp.
Sau khi cách ly do hoàn tác, một lần biên soạn trong tiến trình đang chạy sẽ xóa chủ sở hữu
ngay lập tức; một tiến trình biên dịch riêng biệt yêu cầu làm mới vòng đời plugin để
daemon có thể xác nhận ấn bản bền vững mới.
Bộ nhớ đệm đã biên soạn có thể được xây dựng lại: các hàng bộ nhớ đệm từ trước các kỷ nguyên xuất bản được
xem là không tìm thấy và được thay thế trong lần biên soạn tiếp theo; chúng không được di chuyển.

## Bảng điều khiển và báo cáo tình trạng

Khi `render.createDashboards` được bật, quá trình biên soạn duy trì các bảng điều khiển trong
`reports/`:

| Báo cáo                             | Theo dõi                                            |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | các trang có câu hỏi chưa được giải quyết           |
| `reports/contradictions.md`         | các cụm ghi chú mâu thuẫn                           |
| `reports/low-confidence.md`         | các trang và luận điểm có độ tin cậy thấp           |
| `reports/claim-health.md`           | các luận điểm thiếu bằng chứng có cấu trúc          |
| `reports/stale-pages.md`            | độ mới không xác định hoặc đã lỗi thời              |
| `reports/person-agent-directory.md` | thẻ định tuyến cá nhân/thực thể                     |
| `reports/relationship-graph.md`     | các cạnh quan hệ có cấu trúc                        |
| `reports/provenance-coverage.md`    | mức độ bao phủ của lớp bằng chứng                   |
| `reports/privacy-review.md`         | các cấp độ riêng tư không công khai cần review trước khi sử dụng |

## Tìm kiếm và truy xuất

Hai phần phụ trợ tìm kiếm:

- `shared`: sử dụng luồng tìm kiếm bộ nhớ dùng chung khi khả dụng
- `local`: tìm kiếm wiki cục bộ

Ba kho ngữ liệu: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` sử dụng các bản tóm lược đã biên soạn làm lượt đầu tiên khi có thể
- ID luận điểm được phân giải ngược về trang sở hữu
- các luận điểm bị phản biện/lỗi thời/mới ảnh hưởng đến thứ hạng
- nhãn nguồn gốc được giữ lại trong kết quả

Các chế độ tìm kiếm (tham số `--mode` / công cụ `mode`):

| Chế độ              | Tăng cường                                                         |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | mặc định cân bằng                                               |
| `find-person`     | thực thể giống con người, bí danh, tên định danh, mạng xã hội, ID chuẩn |
| `route-question`  | thẻ tác nhân, gợi ý về nội dung nên hỏi/trường hợp sử dụng phù hợp nhất, ngữ cảnh quan hệ |
| `source-evidence` | trang nguồn và siêu dữ liệu bằng chứng có cấu trúc                  |
| `raw-claim`       | đối sánh các khẳng định có cấu trúc; trả về siêu dữ liệu khẳng định/bằng chứng    |

Khi một kết quả khớp với khẳng định có cấu trúc, `wiki_search` trả về
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` và `evidenceSourceIds` trong payload chi tiết. Đầu ra văn bản
bao gồm các dòng `Claim:` và `Evidence:` dạng rút gọn khi có sẵn.

## Công cụ tác nhân

| Công cụ          | Mục đích                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | chế độ và phạm vi kho hiện tại, tác nhân đã phân giải, tình trạng hoạt động, tính khả dụng của Obsidian CLI                                                                               |
| `wiki_search` | tìm kiếm các trang wiki và, khi được cấu hình, kho ngữ liệu bộ nhớ dùng chung; chấp nhận `mode` để tra cứu người, định tuyến câu hỏi, tìm bằng chứng nguồn hoặc xem chi tiết khẳng định thô |
| `wiki_get`    | đọc một trang wiki theo id/đường dẫn, dự phòng sang kho ngữ liệu bộ nhớ dùng chung khi tìm kiếm dùng chung được bật và tra cứu không có kết quả                                     |
| `wiki_apply`  | các thao tác thay đổi tổng hợp/siêu dữ liệu có phạm vi hẹp mà không chỉnh sửa trang theo kiểu tự do                                                                                             |
| `wiki_lint`   | kiểm tra cấu trúc, khoảng trống về nguồn gốc, mâu thuẫn, câu hỏi còn bỏ ngỏ                                                                                            |

Plugin cũng đăng ký một phần bổ sung kho ngữ liệu bộ nhớ không độc quyền, nhờ đó
`memory_search` và `memory_get` dùng chung có thể truy cập wiki khi Plugin bộ nhớ
đang hoạt động hỗ trợ lựa chọn kho ngữ liệu.

## Hành vi của lời nhắc và ngữ cảnh

Khi `context.includeCompiledDigestPrompt` được bật, các phần lời nhắc bộ nhớ
sẽ nối thêm một bản chụp đã biên dịch dạng rút gọn từ trạng thái Plugin: chỉ các trang hàng đầu,
chỉ các khẳng định hàng đầu, số lượng mâu thuẫn, số lượng câu hỏi, các tiêu chí
về độ tin cậy/độ mới. Tính năng này yêu cầu chủ động bật vì nó thay đổi cấu trúc lời nhắc; nó chủ yếu quan trọng
đối với các công cụ ngữ cảnh hoặc quy trình tạo lời nhắc có sử dụng rõ ràng
các phần bổ sung bộ nhớ.

## Cấu hình

Đặt cấu hình trong `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Các tùy chọn chính:

| Khóa                                        | Giá trị / mặc định                               | Ghi chú                                                                         |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (mặc định), `bridge`, `unsafe-local` | chọn hành vi đầu vào và tích hợp                                        |
| `vault.scope`                              | `global` (mặc định), `agent`                    | một kho dùng chung hoặc một kho con cho mỗi tác nhân                                 |
| `vault.path`                               | mặc định toàn cục `~/.openclaw/wiki/main`         | kho chính xác trên toàn cục; thư mục cha ở phạm vi tác nhân mặc định là `~/.openclaw/wiki`       |
| `vault.renderMode`                         | `native` (mặc định), `obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | mặc định `true`                                 | nhập các tạo tác công khai của Plugin bộ nhớ đang hoạt động                                  |
| `bridge.followMemoryEvents`                | mặc định `true`                                 | bao gồm nhật ký sự kiện trong chế độ cầu nối                                             |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | mặc định `false`                                | bắt buộc để chạy các thao tác nhập `unsafe-local`                                        |
| `unsafeLocal.paths`                        | mặc định `[]`                                   | các đường dẫn cục bộ rõ ràng để nhập trong chế độ `unsafe-local`                         |
| `search.backend`                           | `shared` (mặc định), `local`                    |                                                                               |
| `search.corpus`                            | `wiki` (mặc định), `memory`, `all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | mặc định `false`                                | nối thêm bản chụp tóm lược dạng rút gọn của tác nhân đã chọn vào các phần lời nhắc bộ nhớ |
| `render.createBacklinks`                   | mặc định `true`                                 | tạo các khối liên quan mang tính xác định                                         |
| `render.createDashboards`                  | mặc định `true`                                 | tạo các trang bảng điều khiển                                                      |

### Kho riêng cho từng tác nhân

Đặt `vault.scope` thành `agent` để cấp cho mỗi tác nhân đã cấu hình một wiki riêng.
Trong phạm vi này, `vault.path` là thư mục cha và OpenClaw nối thêm
id tác nhân đã chuẩn hóa:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Cấu hình này phân giải thành `~/.openclaw/wiki/support` và
`~/.openclaw/wiki/marketing`. Nếu `vault.path` bị bỏ qua trong phạm vi tác nhân,
thư mục cha mặc định là `~/.openclaw/wiki`. Do đó, tác nhân `main` mặc định giữ nguyên
đường dẫn `~/.openclaw/wiki/main` hiện có.

Các công cụ tác nhân, bản tóm lược lời nhắc đã biên dịch và phần bổ sung wiki được cung cấp thông qua
`memory_search` / `memory_get` sẽ phân giải kho từ ngữ cảnh tác nhân đang hoạt động.
Đối với các lệnh gọi CLI và Gateway trong thiết lập có nhiều tác nhân được cấu hình, hãy chỉ định
rõ tác nhân bằng `openclaw wiki --agent <agentId> ...` hoặc `agentId` của yêu cầu
Gateway. Một tác nhân duy nhất đã cấu hình vẫn là mặc định khi không cung cấp id.

Trong chế độ cầu nối, các thao tác nhập ở phạm vi tác nhân chỉ chấp nhận tạo tác bộ nhớ công khai khi
`agentIds` của tạo tác đó bao gồm tác nhân đã chọn. Các tạo tác thuộc về tác nhân khác,
không có siêu dữ liệu quyền sở hữu hoặc có chủ sở hữu không xác định sẽ bị bỏ qua. Phạm vi toàn cục
giữ nguyên hành vi tạo tác dùng chung hiện có.

<Warning>
Việc thay đổi `vault.scope` không sao chép hoặc chia tách kho hiện có. Trong phạm vi tác nhân,
`vault.path` được cấu hình rõ ràng sẽ trở thành thư mục cha, vì vậy hãy chủ động di chuyển hoặc
nhập các trang hiện có trước khi chuyển đổi tác nhân sản xuất. Trước tiên, hãy sao lưu
kho.

Kho riêng cho từng tác nhân là ranh giới tri thức trong cùng một tiến trình, không phải ranh giới
bảo mật của hệ điều hành. Các Plugin và công cụ không được đặt trong sandbox có quyền truy cập hệ thống tệp máy chủ
vẫn có thể đọc thư mục của tác nhân khác. Sử dụng [sandbox](/vi/gateway/sandboxing) hoặc
[các hồ sơ Gateway riêng biệt](/vi/gateway/multiple-gateways) khi các tác nhân không tin cậy
lẫn nhau.
</Warning>

### Ví dụ: QMD + chế độ cầu nối

Sử dụng cấu hình này khi bạn muốn dùng QMD để truy hồi và `memory-wiki` làm lớp
tri thức được duy trì. Mỗi lớp giữ đúng trọng tâm: QMD giúp ghi chú thô, dữ liệu xuất
phiên và các bộ sưu tập bổ sung có thể tìm kiếm, trong khi `memory-wiki` biên dịch
các thực thể ổn định, khẳng định, bảng điều khiển và trang nguồn.

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Cấu hình này để QMD phụ trách việc truy hồi bộ nhớ hoạt động, giữ `memory-wiki` tập trung vào
các trang và bảng điều khiển đã biên dịch, đồng thời không thay đổi cấu trúc lời nhắc cho đến khi bạn
chủ động bật lời nhắc tóm lược đã biên dịch.

## CLI

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Xem [CLI: wiki](/vi/cli/wiki) để biết tài liệu tham khảo lệnh đầy đủ, bao gồm
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` và toàn bộ tập hợp lệnh con `wiki obsidian`.

## Hỗ trợ Obsidian

Khi `vault.renderMode` là `obsidian`, Plugin ghi Markdown tương thích với Obsidian
và có thể tùy chọn sử dụng CLI `obsidian` chính thức để thăm dò trạng thái,
tìm kiếm kho, mở trang, gọi lệnh và chuyển đến
ghi chú hằng ngày. Tính năng này là tùy chọn; wiki vẫn hoạt động ở chế độ gốc mà không cần
Obsidian.

Kho ở phạm vi tác nhân vẫn có thể sử dụng Markdown tương thích với Obsidian, nhưng quá trình xác thực
cấu hình sẽ từ chối `obsidian.useOfficialCli: true` cùng với `vault.scope: "agent"`.
Thiết lập `obsidian.vaultName` hiện tại mang tính toàn cục và không thể chọn một kho
Obsidian riêng cho từng tác nhân. Thay vào đó, hãy sử dụng các công cụ wiki và thao tác CLI,
hoặc duy trì một wiki do Obsidian vận hành trong phạm vi toàn cục.

## Quy trình làm việc được đề xuất

<Steps>
<Step title="Giữ plugin bộ nhớ đang hoạt động để truy hồi">
Việc truy hồi, quảng bá và Dreaming vẫn do backend bộ nhớ đã cấu hình quản lý.
</Step>
<Step title="Bật memory-wiki">
Bắt đầu với chế độ `isolated` trừ khi bạn muốn dùng chế độ cầu nối một cách rõ ràng.
</Step>
<Step title="Sử dụng wiki_search / wiki_get khi nguồn gốc thông tin là yếu tố quan trọng">
Ưu tiên các công cụ này hơn `memory_search` khi bạn muốn dùng cơ chế xếp hạng dành riêng cho wiki hoặc cấu trúc niềm tin ở cấp độ trang.
</Step>
<Step title="Sử dụng wiki_apply cho các bản tổng hợp phạm vi hẹp hoặc cập nhật siêu dữ liệu">
Tránh chỉnh sửa thủ công các khối được tạo và quản lý tự động.
</Step>
<Step title="Chạy wiki_lint sau các thay đổi đáng kể">
Phát hiện các mâu thuẫn, câu hỏi chưa được giải đáp và khoảng trống về nguồn gốc thông tin.
</Step>
<Step title="Bật bảng điều khiển để hiển thị nội dung cũ/mâu thuẫn">
Đặt `render.createDashboards: true` (mặc định).
</Step>
</Steps>

## Tài liệu liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [CLI: bộ nhớ](/vi/cli/memory)
- [CLI: wiki](/vi/cli/wiki)
- [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview)
