---
read_when:
    - Bạn muốn kiến thức được lưu giữ lâu dài ngoài các ghi chú MEMORY.md thuần túy
    - Bạn đang cấu hình plugin memory-wiki đi kèm
    - Bạn cần các kho wiki riêng biệt cho các agent trong cùng một Gateway
    - Bạn muốn tìm hiểu về wiki_search, wiki_get hoặc chế độ bridge
summary: 'memory-wiki: kho tri thức đã biên soạn với nguồn gốc, các tuyên bố, bảng điều khiển và chế độ cầu nối'
title: Wiki bộ nhớ
x-i18n:
    generated_at: "2026-07-21T13:27:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fda3c801ae39b529a3f1fcaf8791b6dcb1d8116ba2e73e99cca62dca6c64140a
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` là một plugin đi kèm, biên soạn tri thức bền vững thành một
wiki có thể điều hướng: các trang có tính xác định, các khẳng định có cấu trúc kèm bằng chứng,
nguồn gốc, bảng điều khiển và bản tóm lược mà máy có thể đọc được.

Plugin này không thay thế plugin Active Memory. Việc truy hồi, thăng cấp, lập chỉ mục và
Dreaming vẫn thuộc trách nhiệm của bất kỳ backend bộ nhớ nào được cấu hình
(`memory-core`, QMD, Honcho, v.v.). `memory-wiki` hoạt động bên cạnh backend đó và biên soạn
tri thức thành một lớp wiki được duy trì.

Bật plugin trước khi sử dụng CLI, công cụ hoặc tích hợp runtime của plugin:

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

| Lớp                  | Chịu trách nhiệm                                                                    |
| -------------------- | --------------------------------------------------------------------------------- |
| Plugin Active Memory | Truy hồi, tìm kiếm ngữ nghĩa, thăng cấp, Dreaming, runtime bộ nhớ                  |
| `memory-wiki`        | Các trang wiki đã biên soạn, bản tổng hợp giàu nguồn gốc, bảng điều khiển, tìm kiếm/lấy/áp dụng wiki |

Quy tắc thực tế:

- `memory_search` để thực hiện một lượt truy hồi rộng trên mọi kho ngữ liệu đã cấu hình
- `wiki_search` / `wiki_get` khi cần xếp hạng dành riêng cho wiki, nguồn gốc hoặc cấu trúc niềm tin cấp trang
- `memory_search corpus=all` để bao quát cả hai lớp trong một lần gọi, khi plugin Active Memory hỗ trợ chọn kho ngữ liệu

Một thiết lập ưu tiên cục bộ phổ biến: dùng QMD làm backend Active Memory để truy hồi và
`memory-wiki` ở chế độ `bridge` cho các trang tổng hợp bền vững. Xem ví dụ
QMD + chế độ cầu nối trong phần [Cấu hình](#configuration).

Nếu chế độ cầu nối báo cáo không có hiện vật nào được xuất, plugin Active Memory
hiện không cung cấp đầu vào cầu nối công khai. Trước tiên, hãy chạy `openclaw wiki doctor`,
sau đó xác nhận plugin Active Memory hỗ trợ hiện vật công khai.

## Chế độ kho

- `isolated` (mặc định): kho riêng, nguồn riêng, không phụ thuộc vào plugin Active Memory. Dùng chế độ này cho một kho tri thức tuyển chọn độc lập.
- `bridge`: đọc các hiện vật bộ nhớ và nhật ký sự kiện công khai từ plugin Active Memory thông qua các đường nối SDK plugin công khai. Dùng chế độ này để biên soạn các hiện vật được plugin bộ nhớ xuất mà không truy cập nội bộ riêng tư của plugin.
- `unsafe-local`: lối thoát rõ ràng trên cùng máy dành cho các đường dẫn cục bộ riêng tư. Có chủ ý mang tính thử nghiệm và không di động; chỉ sử dụng khi bạn hiểu ranh giới tin cậy và đặc biệt cần quyền truy cập hệ thống tệp cục bộ mà chế độ cầu nối không thể cung cấp.

Chế độ kho và phạm vi kho là hai lựa chọn riêng biệt:

- `vaultMode` chọn nguồn đầu vào của wiki.
- `vault.scope` chọn việc mọi tác nhân dùng chung một kho hay mỗi tác nhân có một kho con.

`vault.scope: "global"` là mặc định và duy trì hành vi một kho hiện có.
Dùng `vault.scope: "agent"` với chế độ `isolated` hoặc `bridge` khi
các tác nhân không được dùng chung trang wiki, bản tóm lược đã biên soạn, kết quả tìm kiếm hoặc thao tác ghi.
Không thể kết hợp phạm vi tác nhân với chế độ `unsafe-local` vì các đường dẫn
riêng tư đã cấu hình đó không phải là đầu vào thuộc sở hữu của tác nhân. Quá trình xác thực cấu hình sẽ từ chối
tổ hợp này.

Chế độ cầu nối có thể lập chỉ mục các nội dung sau, tùy theo công tắc cấu hình `bridge.*`:

- các hiện vật bộ nhớ đã xuất (`indexMemoryRoot`)
- ghi chú hằng ngày (`indexDailyNotes`)
- báo cáo Dreaming (`indexDreamReports`)
- nhật ký sự kiện bộ nhớ (`followMemoryEvents`)

Khi chế độ cầu nối đang hoạt động và `bridge.readMemoryArtifacts` được bật,
`openclaw wiki status`, `openclaw wiki doctor` và `openclaw wiki bridge
import` được định tuyến qua Gateway đang chạy để chúng thấy cùng ngữ cảnh plugin Active Memory
như bộ nhớ của tác nhân/runtime. Nếu cầu nối bị tắt hoặc việc đọc hiện vật
bị tắt, các lệnh đó vẫn giữ hành vi cục bộ/ngoại tuyến.

## Bố cục kho

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

Nội dung được quản lý nằm trong các khối được tạo; các khối ghi chú của con người được
giữ nguyên qua các lần tạo lại.

- `sources/`: tài liệu thô đã nhập và các trang dựa trên cầu nối/cục bộ không an toàn
- `entities/`: sự vật, con người, hệ thống, dự án và đối tượng bền vững
- `concepts/`: ý tưởng, khái niệm trừu tượng, mẫu và chính sách (đồng thời là nơi tiếp nhận nội dung nhập từ OKF)
- `syntheses/`: bản tóm tắt đã biên soạn và bản tổng hợp được duy trì
- `reports/`: bảng điều khiển được tạo

## Nhập Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Nhập một gói Open Knowledge Format đã giải nén vào các trang khái niệm wiki. Phù hợp
khi danh mục dữ liệu, trình thu thập tài liệu hoặc tác nhân làm giàu đã
tạo ra OKF: giữ OKF làm hiện vật trao đổi di động và để `memory-wiki`
chuyển nó thành các trang khái niệm gốc OpenClaw và bản tóm lược đã biên soạn.

- các tệp `.md` không dành riêng là tài liệu khái niệm
- mỗi khái niệm được nhập yêu cầu trường frontmatter `type` không rỗng; thiếu `type` sẽ tạo cảnh báo `missing-type` và tệp bị bỏ qua
- các giá trị `type` không xác định được chấp nhận dưới dạng khái niệm chung
- `index.md` và `log.md` được dành riêng và không bao giờ được nhập dưới dạng khái niệm
- các liên kết Markdown bị hỏng hoặc bên ngoài được giữ nguyên

Các trang được nhập được làm phẳng dưới `concepts/` để các luồng biên soạn, tìm kiếm, lấy và
bảng điều khiển hiện có có thể thấy chúng mà không cần cây wiki thứ hai. Mỗi trang giữ
ID khái niệm OKF gốc, đường dẫn nguồn, `type`, `resource`, `tags`, dấu thời gian
và toàn bộ frontmatter của trình tạo. Các liên kết OKF nội bộ được viết lại để trỏ đến
các trang khái niệm wiki đã tạo, đồng thời phát ra các mục `relationships` có cấu trúc với
`kind: okf-link`.

## Khẳng định và bằng chứng có cấu trúc

Các trang mang frontmatter `claims` có cấu trúc, không chỉ là văn bản tự do. Mỗi
khẳng định có thể bao gồm `id`, `text`, `status`, `confidence`, `evidence[]` và
`updatedAt`. Mỗi mục bằng chứng có thể bao gồm `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` và `updatedAt`.

Điều này khiến wiki hoạt động như một lớp niềm tin, thay vì một nơi chứa ghi chú thụ động.
Các khẳng định có thể được theo dõi, chấm điểm, tranh luận và đối chiếu ngược về nguồn.

## Siêu dữ liệu thực thể dành cho tác nhân

Các trang thực thể mang siêu dữ liệu định tuyến chung có thể dùng cho con người, nhóm,
hệ thống, dự án hoặc bất kỳ loại thực thể nào khác:

- `entityType`: ví dụ `person`, `team`, `system`, `project`
- `canonicalId`: khóa định danh ổn định xuyên suốt các bí danh và nội dung nhập
- `aliases`: tên, tên hiệu hoặc nhãn phân giải đến cùng một trang
- `privacyTier`: chuỗi tự do; `public` được xem là không cần xem xét, mọi giá trị khác (ví dụ `local-private`, `sensitive`, `confirm-before-use`) đều được đánh dấu trong `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: gợi ý định tuyến ngắn gọn
- `lastRefreshedAt`: dấu thời gian làm mới nguồn, tách biệt với thời gian chỉnh sửa trang
- `personCard`: thẻ định tuyến tùy chọn dành riêng cho cá nhân (tên hiệu, mạng xã hội, email, múi giờ, luồng, nội dung nên hỏi, nội dung nên tránh hỏi, độ tin cậy, cấp độ riêng tư)
- `relationships`: các cạnh có kiểu đến những trang liên quan (đích, loại, trọng số, độ tin cậy, loại bằng chứng, cấp độ riêng tư, ghi chú)

Đối với wiki về con người, hãy bắt đầu bằng `reports/person-agent-directory.md`, sau đó mở
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
    - Các câu hỏi về triển khai mẫu
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

Quá trình biên soạn đọc các trang wiki, chuẩn hóa bản tóm tắt và lưu giữ một
ảnh chụp nhanh dành cho máy trong trạng thái plugin SQLite dùng chung của OpenClaw. Mã runtime sử dụng
ảnh chụp nhanh của chủ sở hữu do vòng đời quản lý để tải SQLite trong quá trình chuẩn bị lời nhắc bất đồng bộ;
quá trình lắp ráp lời nhắc đồng bộ không bao giờ thu thập Markdown hoặc đọc tệp bộ nhớ đệm.
Đầu ra đã biên soạn cũng hỗ trợ việc lập chỉ mục wiki lượt đầu cho tìm kiếm/lấy, tra cứu
ID khẳng định ngược về trang sở hữu, phần bổ sung lời nhắc ngắn gọn và tạo
báo cáo.

Các chỉnh sửa nguồn và khôi phục kho chỉ trở thành dữ liệu dành cho máy sau lần
biên soạn tiếp theo. Việc khởi động lại hoặc làm mới vòng đời plugin sẽ so sánh bản công bố
biên soạn có chuỗi nhân quả của kho với SQLite và từ chối ảnh chụp nhanh từ một
trạng thái mới hơn đã bị khôi phục. Trình biên dịch khởi động trước khi khôi phục không thể
công bố dựa trên trạng thái tiền nhiệm đã được phục hồi. Quá trình chuẩn bị lời nhắc không thăm dò
kho hoặc cài đặt trình theo dõi tệp.
Sau khi cách ly do khôi phục, một lần biên soạn trong tiến trình đang chạy sẽ xóa chủ sở hữu
ngay lập tức; một tiến trình biên dịch riêng biệt yêu cầu làm mới vòng đời plugin để
daemon có thể xác nhận bản công bố bền vững mới.
Bộ nhớ đệm đã biên soạn có thể xây dựng lại: các hàng bộ nhớ đệm từ trước các kỷ nguyên công bố
được xem là trượt bộ nhớ đệm và được thay thế bởi lần biên soạn tiếp theo; chúng không được di chuyển.

## Bảng điều khiển và báo cáo tình trạng

Khi `render.createDashboards` được bật, quá trình biên soạn duy trì các bảng điều khiển trong
`reports/`:

| Báo cáo                             | Theo dõi                                            |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | các trang có câu hỏi chưa được giải quyết          |
| `reports/contradictions.md`         | các cụm ghi chú mâu thuẫn                           |
| `reports/low-confidence.md`         | các trang và khẳng định có độ tin cậy thấp          |
| `reports/claim-health.md`           | các khẳng định thiếu bằng chứng có cấu trúc         |
| `reports/stale-pages.md`            | độ mới không xác định hoặc đã cũ                    |
| `reports/person-agent-directory.md` | thẻ định tuyến cá nhân/thực thể                     |
| `reports/relationship-graph.md`     | các cạnh quan hệ có cấu trúc                        |
| `reports/provenance-coverage.md`    | mức độ bao phủ của lớp bằng chứng                   |
| `reports/privacy-review.md`         | các cấp độ riêng tư không công khai cần được xem xét trước khi sử dụng |

## Tìm kiếm và truy xuất

Hai backend tìm kiếm:

- `shared`: sử dụng luồng tìm kiếm bộ nhớ dùng chung khi khả dụng
- `local`: tìm kiếm wiki cục bộ

Ba kho ngữ liệu: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` sử dụng bản tóm lược đã biên soạn làm lượt đầu khi có thể
- ID khẳng định được phân giải ngược về trang sở hữu
- các khẳng định bị tranh luận/đã cũ/mới ảnh hưởng đến thứ hạng
- nhãn nguồn gốc được giữ lại trong kết quả

Các chế độ tìm kiếm (tham số `--mode` / công cụ `mode`):

| Chế độ              | Tăng cường                                                         |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | mặc định cân bằng                                               |
| `find-person`     | thực thể giống người, bí danh, tên định danh, mạng xã hội, ID chuẩn |
| `route-question`  | thẻ tác nhân, gợi ý về nội dung nên hỏi/phù hợp nhất để sử dụng, ngữ cảnh quan hệ |
| `source-evidence` | trang nguồn và siêu dữ liệu bằng chứng có cấu trúc                  |
| `raw-claim`       | đối sánh các tuyên bố có cấu trúc; trả về siêu dữ liệu tuyên bố/bằng chứng    |

Khi một kết quả khớp với tuyên bố có cấu trúc, `wiki_search` trả về
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` và `evidenceSourceIds` trong payload chi tiết. Đầu ra văn bản
bao gồm các dòng `Claim:` và `Evidence:` dạng rút gọn khi có.

## Công cụ tác nhân

| Công cụ          | Mục đích                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | chế độ và phạm vi vault hiện tại, tác nhân đã phân giải, tình trạng hoạt động, khả năng sử dụng CLI Obsidian                                                                               |
| `wiki_search` | tìm kiếm các trang wiki và, khi được cấu hình, kho ngữ liệu bộ nhớ dùng chung; chấp nhận `mode` để tra cứu người, định tuyến câu hỏi, tìm bằng chứng nguồn hoặc xem chi tiết tuyên bố thô |
| `wiki_get`    | đọc trang wiki theo id/đường dẫn, dự phòng sang kho ngữ liệu bộ nhớ dùng chung khi tìm kiếm dùng chung được bật và không tìm thấy kết quả                                     |
| `wiki_apply`  | tổng hợp hẹp/thay đổi siêu dữ liệu mà không chỉnh sửa trang tùy ý                                                                                             |
| `wiki_lint`   | kiểm tra cấu trúc, khoảng trống về nguồn gốc, mâu thuẫn, câu hỏi chưa giải quyết                                                                                            |

Plugin cũng đăng ký một phần bổ sung không độc quyền cho kho ngữ liệu bộ nhớ, nhờ đó
`memory_search` và `memory_get` dùng chung có thể truy cập wiki khi Plugin bộ nhớ
đang hoạt động hỗ trợ lựa chọn kho ngữ liệu.

## Hành vi của prompt và ngữ cảnh

Khi `context.includeCompiledDigestPrompt` được bật, các phần prompt bộ nhớ
sẽ nối thêm một bản chụp đã biên dịch dạng rút gọn từ trạng thái Plugin: chỉ các trang hàng đầu,
chỉ các tuyên bố hàng đầu, số lượng mâu thuẫn, số lượng câu hỏi, các tiêu chí định tính
về độ tin cậy/độ mới. Đây là tính năng chọn tham gia vì nó thay đổi cấu trúc prompt; tính năng này chủ yếu quan trọng
đối với các công cụ ngữ cảnh hoặc quá trình tạo prompt có sử dụng rõ ràng các phần
bổ sung bộ nhớ.

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
| `vault.scope`                              | `global` (mặc định), `agent`                    | một vault dùng chung hoặc một vault con cho mỗi tác nhân                                 |
| `vault.path`                               | mặc định toàn cục `~/.openclaw/wiki/main`         | vault chính xác trên toàn cục; thư mục cha trong phạm vi tác nhân mặc định là `~/.openclaw/wiki`       |
| `vault.renderMode`                         | `native` (mặc định), `obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | mặc định `true`                                 | nhập các tạo tác công khai của Plugin bộ nhớ đang hoạt động                                  |
| `bridge.followMemoryEvents`                | mặc định `true`                                 | bao gồm nhật ký sự kiện trong chế độ cầu nối                                             |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | mặc định `false`                                | bắt buộc để chạy quá trình nhập `unsafe-local`                                        |
| `unsafeLocal.paths`                        | mặc định `[]`                                   | các đường dẫn cục bộ rõ ràng để nhập trong chế độ `unsafe-local`                         |
| `search.backend`                           | `shared` (mặc định), `local`                    |                                                                               |
| `search.corpus`                            | `wiki` (mặc định), `memory`, `all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | mặc định `false`                                | nối bản chụp tóm lược dạng rút gọn của tác nhân đã chọn vào các phần prompt bộ nhớ |
| `render.createBacklinks`                   | mặc định `true`                                 | tạo các khối liên quan có tính xác định                                         |
| `render.createDashboards`                  | mặc định `true`                                 | tạo các trang bảng điều khiển                                                      |

### Vault theo từng tác nhân

Đặt `vault.scope` thành `agent` để cung cấp cho mỗi tác nhân đã cấu hình một wiki riêng.
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

Cấu hình này được phân giải thành `~/.openclaw/wiki/support` và
`~/.openclaw/wiki/marketing`. Nếu `vault.path` bị bỏ qua trong phạm vi tác nhân,
thư mục cha mặc định là `~/.openclaw/wiki`. Vì vậy, tác nhân `main` mặc định vẫn giữ
đường dẫn `~/.openclaw/wiki/main` hiện có.

Các công cụ tác nhân, bản tóm lược prompt đã biên dịch và phần bổ sung wiki được cung cấp qua
`memory_search` / `memory_get` sẽ phân giải vault từ ngữ cảnh tác nhân đang hoạt động.
Đối với lệnh gọi CLI và Gateway trong thiết lập có nhiều tác nhân được cấu hình, hãy chỉ định
rõ tác nhân bằng `openclaw wiki --agent <agentId> ...` hoặc `agentId` của yêu cầu
Gateway. Một tác nhân duy nhất đã cấu hình vẫn là mặc định khi không cung cấp id.

Trong chế độ cầu nối, quá trình nhập theo phạm vi tác nhân chỉ chấp nhận một tạo tác bộ nhớ công khai khi
`agentIds` của tạo tác đó bao gồm tác nhân đã chọn. Các tạo tác thuộc sở hữu của tác nhân khác,
không có siêu dữ liệu quyền sở hữu hoặc có chủ sở hữu không xác định sẽ bị bỏ qua. Phạm vi toàn cục
giữ nguyên hành vi tạo tác dùng chung hiện có.

<Warning>
Việc thay đổi `vault.scope` không sao chép hoặc phân tách vault hiện có. Trong phạm vi tác nhân,
`vault.path` được cấu hình rõ ràng sẽ trở thành thư mục cha, vì vậy hãy chủ động di chuyển hoặc
nhập các trang hiện có trước khi chuyển đổi các tác nhân sản xuất. Trước tiên, hãy sao lưu
vault.

Vault theo từng tác nhân là ranh giới tri thức trong cùng một tiến trình, không phải ranh giới
bảo mật của hệ điều hành. Các Plugin và công cụ không được sandbox hóa có quyền truy cập hệ thống tệp của máy chủ
vẫn có thể đọc thư mục của tác nhân khác. Hãy sử dụng [sandbox](/vi/gateway/sandboxing) hoặc
[các hồ sơ Gateway riêng biệt](/vi/gateway/multiple-gateways) khi các tác nhân không tin cậy
lẫn nhau.
</Warning>

### Ví dụ: QMD + chế độ cầu nối

Hãy sử dụng cấu hình này khi bạn muốn dùng QMD để truy hồi và `memory-wiki` làm lớp
tri thức được duy trì. Mỗi lớp giữ đúng trọng tâm: QMD giúp các ghi chú thô, bản xuất
phiên và các bộ sưu tập bổ sung có thể tìm kiếm được, còn `memory-wiki` biên dịch
các thực thể ổn định, tuyên bố, bảng điều khiển và trang nguồn.

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

Cấu hình này để QMD phụ trách truy hồi bộ nhớ đang hoạt động, giữ `memory-wiki` tập trung vào
các trang và bảng điều khiển đã biên dịch, đồng thời giữ nguyên cấu trúc prompt cho đến khi bạn
chủ động bật prompt tóm lược đã biên dịch.

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

Xem [CLI: wiki](/vi/cli/wiki) để biết tài liệu tham khảo đầy đủ về lệnh, bao gồm
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` và toàn bộ tập hợp lệnh con `wiki obsidian`.

## Hỗ trợ Obsidian

Khi `vault.renderMode` là `obsidian`, Plugin ghi Markdown tương thích với Obsidian
và có thể tùy chọn sử dụng CLI `obsidian` chính thức để thăm dò trạng thái,
tìm kiếm vault, mở trang, gọi lệnh và chuyển đến ghi chú hằng ngày.
Đây là tính năng tùy chọn; wiki vẫn hoạt động ở chế độ gốc mà không cần
Obsidian.

Các vault theo phạm vi tác nhân vẫn có thể sử dụng Markdown tương thích với Obsidian, nhưng quá trình xác thực
cấu hình sẽ từ chối `obsidian.useOfficialCli: true` với `vault.scope: "agent"`.
Thiết lập `obsidian.vaultName` hiện tại có phạm vi toàn cục và không thể chọn một vault
Obsidian riêng biệt cho từng tác nhân. Thay vào đó, hãy sử dụng các công cụ wiki và thao tác CLI,
hoặc giữ wiki do Obsidian vận hành trong phạm vi toàn cục.

## Quy trình làm việc được đề xuất

<Steps>
<Step title="Giữ Plugin Active Memory để truy hồi">
Việc truy hồi, thăng cấp và Dreaming vẫn thuộc quyền quản lý của backend bộ nhớ đã cấu hình.
</Step>
<Step title="Bật memory-wiki">
Bắt đầu với chế độ `isolated` trừ khi bạn chủ đích muốn dùng chế độ cầu nối.
</Step>
<Step title="Dùng wiki_search / wiki_get khi nguồn gốc thông tin là quan trọng">
Ưu tiên các công cụ này hơn `memory_search` khi bạn muốn cách xếp hạng dành riêng cho wiki hoặc cấu trúc niềm tin ở cấp độ trang.
</Step>
<Step title="Dùng wiki_apply cho các bản tổng hợp phạm vi hẹp hoặc cập nhật siêu dữ liệu">
Tránh chỉnh sửa thủ công các khối được tạo và quản lý tự động.
</Step>
<Step title="Chạy wiki_lint sau các thay đổi đáng kể">
Phát hiện mâu thuẫn, câu hỏi chưa giải quyết và lỗ hổng về nguồn gốc thông tin.
</Step>
<Step title="Bật bảng điều khiển để hiển thị nội dung lỗi thời/mâu thuẫn">
Đặt `render.createDashboards: true` (mặc định).
</Step>
</Steps>

## Tài liệu liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [CLI: bộ nhớ](/vi/cli/memory)
- [CLI: wiki](/vi/cli/wiki)
- [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview)
