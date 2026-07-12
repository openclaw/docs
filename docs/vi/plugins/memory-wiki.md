---
read_when:
    - Bạn muốn có kiến thức được lưu giữ lâu dài, vượt xa các ghi chú MEMORY.md thuần túy
    - Bạn đang cấu hình plugin memory-wiki đi kèm
    - Bạn cần các kho wiki riêng biệt cho các tác nhân trong cùng một Gateway
    - Bạn muốn tìm hiểu về wiki_search, wiki_get hoặc chế độ cầu nối
summary: 'memory-wiki: kho tri thức đã biên soạn với thông tin nguồn gốc, các luận điểm, bảng điều khiển và chế độ cầu nối'
title: Wiki bộ nhớ
x-i18n:
    generated_at: "2026-07-12T08:08:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` là một plugin đi kèm có chức năng biên soạn tri thức lâu dài thành một
wiki có thể điều hướng: các trang có tính xác định, các luận điểm có cấu trúc kèm bằng chứng,
nguồn gốc, bảng điều khiển và bản tóm lược mà máy có thể đọc.

Plugin này không thay thế plugin bộ nhớ hoạt động. Việc truy hồi, thăng hạng, lập chỉ mục và
Dreaming vẫn thuộc trách nhiệm của bất kỳ backend bộ nhớ nào được cấu hình
(`memory-core`, QMD, Honcho, v.v.). `memory-wiki` hoạt động song song và biên soạn
tri thức thành một lớp wiki được duy trì.

| Lớp                  | Chịu trách nhiệm                                                                    |
| -------------------- | ----------------------------------------------------------------------------------- |
| Plugin bộ nhớ hoạt động | Truy hồi, tìm kiếm ngữ nghĩa, thăng hạng, Dreaming, môi trường chạy bộ nhớ        |
| `memory-wiki`        | Các trang wiki đã biên soạn, bản tổng hợp giàu thông tin nguồn gốc, bảng điều khiển, tìm kiếm/lấy/áp dụng wiki |

Quy tắc thực tế:

- `memory_search` để thực hiện một lượt truy hồi rộng trên mọi kho dữ liệu đã cấu hình
- `wiki_search` / `wiki_get` khi bạn muốn xếp hạng dành riêng cho wiki, thông tin nguồn gốc hoặc cấu trúc niềm tin ở cấp trang
- `memory_search corpus=all` để bao quát cả hai lớp trong một lần gọi khi plugin bộ nhớ hoạt động hỗ trợ chọn kho dữ liệu

Một thiết lập ưu tiên cục bộ phổ biến: dùng QMD làm backend bộ nhớ hoạt động để truy hồi và
`memory-wiki` ở chế độ `bridge` cho các trang tổng hợp lâu dài. Xem ví dụ về
QMD + chế độ cầu nối trong phần [Cấu hình](#configuration).

Nếu chế độ cầu nối báo cáo không có hiện vật nào được xuất, plugin bộ nhớ hoạt động
hiện không cung cấp đầu vào cầu nối công khai. Trước tiên hãy chạy `openclaw wiki doctor`,
sau đó xác nhận plugin bộ nhớ hoạt động hỗ trợ các hiện vật công khai.

## Chế độ kho

- `isolated` (mặc định): kho riêng, nguồn riêng, không phụ thuộc vào plugin bộ nhớ hoạt động. Dùng chế độ này cho một kho tri thức tuyển chọn khép kín.
- `bridge`: đọc các hiện vật bộ nhớ công khai và nhật ký sự kiện từ plugin bộ nhớ hoạt động thông qua các giao diện SDK plugin công khai. Dùng chế độ này để biên soạn các hiện vật do plugin bộ nhớ xuất mà không truy cập vào phần nội bộ riêng tư của plugin.
- `unsafe-local`: lối thoát tường minh trên cùng máy dành cho các đường dẫn cục bộ riêng tư. Cố ý mang tính thử nghiệm và không có tính di động; chỉ dùng khi bạn hiểu ranh giới tin cậy và đặc biệt cần quyền truy cập hệ thống tệp cục bộ mà chế độ cầu nối không thể cung cấp.

Chế độ kho và phạm vi kho là hai lựa chọn riêng biệt:

- `vaultMode` chọn nguồn đầu vào của wiki.
- `vault.scope` chọn việc tất cả tác tử dùng chung một kho hay mỗi tác tử có một kho con.

`vault.scope: "global"` là giá trị mặc định và duy trì hành vi một kho duy nhất
hiện có. Dùng `vault.scope: "agent"` với chế độ `isolated` hoặc `bridge` khi
các tác tử không được chia sẻ trang wiki, bản tóm lược đã biên soạn, kết quả tìm kiếm hoặc thao tác ghi.
Không thể kết hợp phạm vi tác tử với chế độ `unsafe-local` vì các đường dẫn
riêng tư đã cấu hình đó không phải là đầu vào thuộc sở hữu của tác tử. Quá trình xác thực cấu hình sẽ từ chối
sự kết hợp này.

Chế độ cầu nối có thể lập chỉ mục theo từng tùy chọn cấu hình `bridge.*`:

- các hiện vật bộ nhớ đã xuất (`indexMemoryRoot`)
- ghi chú hằng ngày (`indexDailyNotes`)
- báo cáo Dreaming (`indexDreamReports`)
- nhật ký sự kiện bộ nhớ (`followMemoryEvents`)

Khi chế độ cầu nối đang hoạt động và `bridge.readMemoryArtifacts` được bật,
`openclaw wiki status`, `openclaw wiki doctor` và `openclaw wiki bridge
import` được định tuyến qua Gateway đang chạy để chúng thấy cùng ngữ cảnh plugin bộ nhớ
hoạt động như bộ nhớ của tác tử/môi trường chạy. Nếu cầu nối bị tắt hoặc tính năng
đọc hiện vật bị tắt, các lệnh đó tiếp tục hoạt động cục bộ/ngoại tuyến.

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

Nội dung được quản lý nằm trong các khối đã tạo; các khối ghi chú của con người
được giữ nguyên qua các lần tạo lại.

- `sources/`: tài liệu thô đã nhập và các trang dựa trên cầu nối/`unsafe-local`
- `entities/`: sự vật, con người, hệ thống, dự án, đối tượng lâu dài
- `concepts/`: ý tưởng, sự trừu tượng, mẫu, chính sách (đồng thời là vị trí đích cho dữ liệu nhập OKF)
- `syntheses/`: bản tóm tắt đã biên soạn và các bản tổng hợp được duy trì
- `reports/`: bảng điều khiển đã tạo

## Nhập Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Nhập một gói Open Knowledge Format đã giải nén vào các trang khái niệm wiki. Phù hợp
khi danh mục dữ liệu, trình thu thập tài liệu hoặc tác tử làm giàu dữ liệu đã
tạo ra OKF: giữ OKF làm hiện vật trao đổi có tính di động và để `memory-wiki`
chuyển nó thành các trang khái niệm gốc của OpenClaw cùng các bản tóm lược đã biên soạn.

- các tệp `.md` không được dành riêng là tài liệu khái niệm
- mỗi khái niệm được nhập cần có trường frontmatter `type` không trống; thiếu `type` sẽ tạo cảnh báo `missing-type` và tệp bị bỏ qua
- các giá trị `type` không xác định được chấp nhận dưới dạng khái niệm chung
- `index.md` và `log.md` được dành riêng và không bao giờ được nhập dưới dạng khái niệm
- các liên kết Markdown bị hỏng hoặc bên ngoài được giữ nguyên

Các trang được nhập được làm phẳng trong `concepts/` để các luồng biên soạn, tìm kiếm, lấy và
bảng điều khiển hiện có có thể thấy chúng mà không cần cây wiki thứ hai. Mỗi trang giữ lại
ID khái niệm OKF gốc, đường dẫn nguồn, `type`, `resource`, `tags`, dấu thời gian
và toàn bộ frontmatter của trình tạo. Các liên kết OKF nội bộ được viết lại để trỏ đến
các trang khái niệm wiki đã tạo, đồng thời phát ra các mục `relationships` có cấu trúc với
`kind: okf-link`.

## Luận điểm và bằng chứng có cấu trúc

Các trang mang frontmatter `claims` có cấu trúc, không chỉ văn bản tự do. Mỗi
luận điểm có thể bao gồm `id`, `text`, `status`, `confidence`, `evidence[]` và
`updatedAt`. Mỗi mục bằng chứng có thể bao gồm `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` và `updatedAt`.

Điều này khiến wiki hoạt động như một lớp niềm tin chứ không phải kho chứa ghi chú thụ động.
Các luận điểm có thể được theo dõi, chấm điểm, phản biện và đối chiếu ngược về nguồn.

## Siêu dữ liệu thực thể dành cho tác tử

Các trang thực thể mang siêu dữ liệu định tuyến chung có thể sử dụng cho con người, nhóm,
hệ thống, dự án hoặc bất kỳ loại thực thể nào khác:

- `entityType`: ví dụ `person`, `team`, `system`, `project`
- `canonicalId`: khóa định danh ổn định giữa các bí danh và dữ liệu nhập
- `aliases`: tên, tên hiệu hoặc nhãn phân giải đến cùng một trang
- `privacyTier`: chuỗi dạng tự do; `public` được xem là không cần xem xét, mọi giá trị khác (ví dụ `local-private`, `sensitive`, `confirm-before-use`) đều được đánh dấu trong `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: gợi ý định tuyến ngắn gọn
- `lastRefreshedAt`: dấu thời gian làm mới nguồn, tách biệt với thời gian chỉnh sửa trang
- `personCard`: thẻ định tuyến tùy chọn dành riêng cho cá nhân (tên hiệu, mạng xã hội, email, múi giờ, phạm vi, nội dung nên hỏi, nội dung nên tránh hỏi, độ tin cậy, cấp độ riêng tư)
- `relationships`: các cạnh có kiểu đến trang liên quan (đích, loại, trọng số, độ tin cậy, loại bằng chứng, cấp độ riêng tư, ghi chú)

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
  - Định tuyến hệ sinh thái ví dụ
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
  lane: Hệ sinh thái ví dụ
  askFor:
    - Các câu hỏi về việc triển khai ví dụ
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
    text: Alex hữu ích cho việc định tuyến hệ sinh thái ví dụ.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Quy trình biên soạn

Quá trình biên soạn đọc các trang wiki, chuẩn hóa bản tóm tắt và tạo ra các hiện vật ổn định
dành cho máy tại:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Các tác tử và mã môi trường chạy đọc những bản tóm lược này thay vì thu thập dữ liệu từ Markdown.
Đầu ra đã biên soạn cũng hỗ trợ việc lập chỉ mục wiki ở lượt đầu cho tìm kiếm/lấy, tra cứu
ID luận điểm ngược về trang sở hữu, phần bổ sung lời nhắc nhỏ gọn và việc tạo
báo cáo.

## Bảng điều khiển và báo cáo tình trạng

Khi `render.createDashboards` được bật, quá trình biên soạn duy trì các bảng điều khiển trong
`reports/`:

| Báo cáo                             | Theo dõi                                             |
| ----------------------------------- | ---------------------------------------------------- |
| `reports/open-questions.md`         | các trang có câu hỏi chưa được giải quyết             |
| `reports/contradictions.md`         | các cụm ghi chú mâu thuẫn                             |
| `reports/low-confidence.md`         | các trang và luận điểm có độ tin cậy thấp             |
| `reports/claim-health.md`           | các luận điểm thiếu bằng chứng có cấu trúc             |
| `reports/stale-pages.md`            | độ mới không xác định hoặc đã lỗi thời                 |
| `reports/person-agent-directory.md` | thẻ định tuyến cá nhân/thực thể                        |
| `reports/relationship-graph.md`     | các cạnh quan hệ có cấu trúc                           |
| `reports/provenance-coverage.md`    | mức độ bao phủ của các lớp bằng chứng                  |
| `reports/privacy-review.md`         | các cấp độ riêng tư không công khai cần xem xét trước khi sử dụng |

## Tìm kiếm và truy xuất

Hai backend tìm kiếm:

- `shared`: sử dụng luồng tìm kiếm bộ nhớ dùng chung khi có
- `local`: tìm kiếm wiki cục bộ

Ba kho dữ liệu: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` sử dụng các bản tóm lược đã biên soạn làm lượt đầu khi có thể
- ID luận điểm được phân giải ngược về trang sở hữu
- các luận điểm bị phản biện/lỗi thời/mới ảnh hưởng đến thứ hạng
- nhãn nguồn gốc được giữ lại trong kết quả

Các chế độ tìm kiếm (tham số `--mode` / `mode` của công cụ):

| Chế độ            | Tăng trọng số                                                    |
| ----------------- | ---------------------------------------------------------------- |
| `auto`            | mặc định cân bằng                                                 |
| `find-person`     | các thực thể giống cá nhân, bí danh, tên hiệu, mạng xã hội, ID chính tắc |
| `route-question`  | thẻ tác tử, gợi ý nên hỏi/phù hợp nhất cho, ngữ cảnh quan hệ      |
| `source-evidence` | các trang nguồn và siêu dữ liệu bằng chứng có cấu trúc            |
| `raw-claim`       | các luận điểm có cấu trúc khớp; trả về siêu dữ liệu luận điểm/bằng chứng |

Khi một kết quả khớp với luận điểm có cấu trúc, `wiki_search` trả về
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` và `evidenceSourceIds` trong tải trọng chi tiết. Đầu ra văn bản
bao gồm các dòng `Claim:` và `Evidence:` ngắn gọn khi có.

## Công cụ dành cho tác tử

| Công cụ      | Mục đích                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | chế độ và phạm vi kho hiện tại, tác tử đã phân giải, tình trạng hoạt động, tính khả dụng của Obsidian CLI                                                                      |
| `wiki_search` | tìm kiếm các trang wiki và, khi được cấu hình, kho ngữ liệu bộ nhớ dùng chung; chấp nhận `mode` để tra cứu người, định tuyến câu hỏi, tìm bằng chứng nguồn hoặc truy sâu tuyên bố thô |
| `wiki_get`    | đọc trang wiki theo id/đường dẫn, dự phòng sang kho ngữ liệu bộ nhớ dùng chung khi tìm kiếm dùng chung được bật và không tìm thấy kết quả                                      |
| `wiki_apply`  | thay đổi tổng hợp/siêu dữ liệu có phạm vi hẹp mà không chỉnh sửa trang theo kiểu tự do                                                                                         |
| `wiki_lint`   | kiểm tra cấu trúc, khoảng trống về nguồn gốc, mâu thuẫn, câu hỏi còn bỏ ngỏ                                                                                                    |

Plugin cũng đăng ký một phần bổ sung kho ngữ liệu bộ nhớ không độc quyền, vì vậy
`memory_search` và `memory_get` dùng chung có thể truy cập wiki khi Plugin bộ nhớ
đang hoạt động hỗ trợ lựa chọn kho ngữ liệu.

## Hành vi của lời nhắc và ngữ cảnh

Khi bật `context.includeCompiledDigestPrompt`, các phần lời nhắc bộ nhớ sẽ
nối thêm một ảnh chụp nhanh đã biên soạn gọn từ `agent-digest.json`: chỉ các
trang hàng đầu, chỉ các tuyên bố hàng đầu, số lượng mâu thuẫn, số lượng câu hỏi,
các điều kiện về độ tin cậy/độ mới. Tính năng này phải được chủ động bật vì nó
thay đổi cấu trúc lời nhắc; tính năng chủ yếu quan trọng đối với các bộ máy ngữ
cảnh hoặc quy trình lắp ráp lời nhắc sử dụng rõ ràng các phần bổ sung bộ nhớ.

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

| Khóa                                       | Giá trị / mặc định                              | Ghi chú                                                                                         |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (mặc định), `bridge`, `unsafe-local` | chọn hành vi đầu vào và tích hợp                                                                 |
| `vault.scope`                              | `global` (mặc định), `agent`                    | một kho dùng chung hoặc một kho con cho mỗi tác tử                                               |
| `vault.path`                               | mặc định toàn cục `~/.openclaw/wiki/main`       | kho chính xác ở phạm vi toàn cục; thư mục cha trong phạm vi tác tử mặc định là `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (mặc định), `obsidian`                 |                                                                                                 |
| `bridge.readMemoryArtifacts`               | mặc định `true`                                 | nhập các hiện vật công khai của Plugin bộ nhớ đang hoạt động                                     |
| `bridge.followMemoryEvents`                | mặc định `true`                                 | bao gồm nhật ký sự kiện trong chế độ cầu nối                                                      |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | mặc định `false`                                | bắt buộc để chạy các lần nhập `unsafe-local`                                                     |
| `unsafeLocal.paths`                        | mặc định `[]`                                   | các đường dẫn cục bộ rõ ràng cần nhập trong chế độ `unsafe-local`                                |
| `search.backend`                           | `shared` (mặc định), `local`                    |                                                                                                 |
| `search.corpus`                            | `wiki` (mặc định), `memory`, `all`              |                                                                                                 |
| `context.includeCompiledDigestPrompt`      | mặc định `false`                                | nối ảnh chụp nhanh bản tóm lược gọn của tác tử đã chọn vào các phần lời nhắc bộ nhớ               |
| `render.createBacklinks`                   | mặc định `true`                                 | tạo các khối liên quan có tính xác định                                                          |
| `render.createDashboards`                  | mặc định `true`                                 | tạo các trang bảng điều khiển                                                                    |

### Kho theo tác tử

Đặt `vault.scope` thành `agent` để cấp cho mỗi tác tử đã cấu hình một wiki riêng.
Trong phạm vi này, `vault.path` là thư mục cha và OpenClaw nối thêm id tác tử đã
chuẩn hóa:

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
`~/.openclaw/wiki/marketing`. Nếu bỏ qua `vault.path` trong phạm vi tác tử, thư
mục cha mặc định là `~/.openclaw/wiki`. Do đó, tác tử `main` mặc định vẫn giữ
đường dẫn hiện có `~/.openclaw/wiki/main`.

Các công cụ tác tử, bản tóm lược lời nhắc đã biên soạn và phần bổ sung wiki được
cung cấp qua `memory_search` / `memory_get` sẽ phân giải kho từ ngữ cảnh tác tử
đang hoạt động. Đối với các lệnh gọi CLI và Gateway trong thiết lập có nhiều tác
tử đã cấu hình, hãy chỉ định rõ tác tử bằng `openclaw wiki --agent <agentId> ...`
hoặc `agentId` của yêu cầu Gateway. Một tác tử duy nhất đã cấu hình vẫn là mặc
định khi không cung cấp id.

Trong chế độ cầu nối, thao tác nhập theo phạm vi tác tử chỉ chấp nhận một hiện vật
bộ nhớ công khai khi `agentIds` của hiện vật đó bao gồm tác tử đã chọn. Các hiện
vật thuộc sở hữu của tác tử khác, không có siêu dữ liệu quyền sở hữu hoặc có chủ
sở hữu không xác định sẽ bị bỏ qua. Phạm vi toàn cục vẫn giữ hành vi hiện có đối
với hiện vật dùng chung.

<Warning>
Việc thay đổi `vault.scope` không sao chép hoặc chia tách kho hiện có. Trong phạm
vi tác tử, `vault.path` được cấu hình rõ ràng sẽ trở thành thư mục cha, vì vậy hãy
chủ động di chuyển hoặc nhập các trang hiện có trước khi chuyển đổi các tác tử
sản xuất. Trước tiên, hãy sao lưu kho.

Kho theo tác tử là ranh giới tri thức trong cùng một tiến trình, không phải ranh
giới bảo mật của hệ điều hành. Các Plugin và công cụ không được sandbox hóa có
quyền truy cập hệ thống tệp của máy chủ vẫn có thể đọc thư mục của tác tử khác.
Hãy sử dụng [sandbox](/vi/gateway/sandboxing) hoặc
[các hồ sơ Gateway riêng biệt](/vi/gateway/multiple-gateways) khi các tác tử không
tin cậy lẫn nhau.
</Warning>

### Ví dụ: QMD + chế độ cầu nối

Sử dụng cấu hình này khi bạn muốn dùng QMD để truy hồi và `memory-wiki` làm lớp
tri thức được duy trì. Mỗi lớp giữ đúng trọng tâm: QMD giúp các ghi chú thô, bản
xuất phiên và các bộ sưu tập bổ sung có thể tìm kiếm được, trong khi
`memory-wiki` biên soạn các thực thể ổn định, tuyên bố, bảng điều khiển và trang
nguồn.

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

Cấu hình này để QMD phụ trách truy hồi bộ nhớ đang hoạt động, giữ `memory-wiki`
tập trung vào các trang và bảng điều khiển đã biên soạn, đồng thời không thay đổi
cấu trúc lời nhắc cho đến khi bạn chủ động bật lời nhắc bản tóm lược đã biên soạn.

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
`wiki chatgpt import` / `wiki chatgpt rollback` và toàn bộ tập lệnh con
`wiki obsidian`.

## Hỗ trợ Obsidian

Khi `vault.renderMode` là `obsidian`, Plugin ghi Markdown thân thiện với
Obsidian và có thể tùy chọn sử dụng CLI `obsidian` chính thức để thăm dò trạng
thái, tìm kiếm kho, mở trang, gọi lệnh và chuyển đến ghi chú hằng ngày. Tính năng
này là tùy chọn; wiki vẫn hoạt động ở chế độ gốc mà không cần Obsidian.

Các kho theo phạm vi tác tử vẫn có thể sử dụng Markdown thân thiện với Obsidian,
nhưng quá trình xác thực cấu hình sẽ từ chối `obsidian.useOfficialCli: true` khi
đi cùng `vault.scope: "agent"`. Thiết lập `obsidian.vaultName` hiện tại có phạm
vi toàn cục và không thể chọn một kho Obsidian riêng biệt cho từng tác tử. Thay
vào đó, hãy sử dụng các công cụ wiki và thao tác CLI, hoặc giữ wiki do Obsidian
vận hành trong phạm vi toàn cục.

## Quy trình làm việc được đề xuất

<Steps>
<Step title="Giữ Plugin bộ nhớ đang hoạt động để truy hồi">
Việc truy hồi, thăng hạng và Dreaming vẫn do phần phụ trợ bộ nhớ đã cấu hình phụ trách.
</Step>
<Step title="Bật memory-wiki">
Bắt đầu với chế độ `isolated` trừ khi bạn chủ động muốn dùng chế độ cầu nối.
</Step>
<Step title="Sử dụng wiki_search / wiki_get khi nguồn gốc có ý nghĩa quan trọng">
Ưu tiên các công cụ này thay vì `memory_search` khi bạn muốn xếp hạng dành riêng cho wiki hoặc cấu trúc niềm tin ở cấp trang.
</Step>
<Step title="Sử dụng wiki_apply cho các bản tổng hợp hẹp hoặc cập nhật siêu dữ liệu">
Tránh chỉnh sửa thủ công các khối được tạo và quản lý.
</Step>
<Step title="Chạy wiki_lint sau các thay đổi đáng kể">
Phát hiện mâu thuẫn, câu hỏi còn bỏ ngỏ và khoảng trống về nguồn gốc.
</Step>
<Step title="Bật bảng điều khiển để theo dõi nội dung cũ/mâu thuẫn">
Đặt `render.createDashboards: true` (mặc định).
</Step>
</Steps>

## Tài liệu liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [CLI: bộ nhớ](/vi/cli/memory)
- [CLI: wiki](/vi/cli/wiki)
- [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview)
