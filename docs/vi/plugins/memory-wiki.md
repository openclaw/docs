---
read_when:
    - Bạn muốn có tri thức lâu dài vượt ngoài các ghi chú MEMORY.md thuần túy
    - Bạn đang cấu hình Plugin memory-wiki đi kèm
    - Bạn muốn hiểu wiki_search, wiki_get hoặc chế độ cầu nối
summary: 'memory-wiki: kho tri thức đã biên dịch với nguồn gốc, tuyên bố, bảng điều khiển và chế độ cầu nối'
title: Wiki bộ nhớ
x-i18n:
    generated_at: "2026-06-27T17:48:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` là một Plugin đi kèm, biến bộ nhớ bền vững thành một
kho tri thức đã biên soạn.

Nó **không** thay thế Plugin Active Memory. Plugin Active Memory vẫn
sở hữu việc gọi nhớ, thăng cấp, lập chỉ mục và Dreaming. `memory-wiki` nằm bên cạnh
và biên soạn tri thức bền vững thành một wiki có thể điều hướng với các trang xác định,
các khẳng định có cấu trúc, nguồn gốc, bảng điều khiển và bản tóm tắt máy có thể đọc.

Dùng nó khi bạn muốn bộ nhớ hoạt động giống một lớp tri thức được duy trì hơn
và ít giống một đống tệp Markdown hơn.

## Nó bổ sung gì

- Một kho wiki riêng với bố cục trang xác định
- Siêu dữ liệu khẳng định và bằng chứng có cấu trúc, không chỉ là văn xuôi
- Nguồn gốc, độ tin cậy, mâu thuẫn và câu hỏi mở ở cấp trang
- Bản tóm tắt đã biên soạn cho agent/người tiêu thụ runtime
- Công cụ tìm kiếm/lấy/áp dụng/lint dành riêng cho wiki
- Nhập Open Knowledge Format vào các khái niệm wiki đã biên soạn
- Chế độ cầu nối tùy chọn nhập hiện vật công khai từ Plugin Active Memory
- Chế độ render thân thiện với Obsidian và tích hợp CLI tùy chọn

## Cách nó khớp với bộ nhớ

Hãy hình dung phần tách lớp như sau:

| Lớp                                                     | Sở hữu                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho, v.v.) | Gọi nhớ, tìm kiếm ngữ nghĩa, thăng cấp, Dreaming, runtime bộ nhớ                           |
| `memory-wiki`                                           | Trang wiki đã biên soạn, tổng hợp giàu nguồn gốc, bảng điều khiển, tìm kiếm/lấy/áp dụng riêng cho wiki |

Nếu Plugin Active Memory phơi bày các hiện vật gọi nhớ dùng chung, OpenClaw có thể tìm kiếm
cả hai lớp trong một lượt bằng `memory_search corpus=all`.

Khi bạn cần xếp hạng dành riêng cho wiki, nguồn gốc hoặc truy cập trang trực tiếp, hãy dùng
các công cụ gốc của wiki.

## Mẫu kết hợp được khuyến nghị

Mặc định mạnh cho thiết lập ưu tiên cục bộ là:

- QMD làm backend Active Memory cho gọi nhớ và tìm kiếm ngữ nghĩa rộng
- `memory-wiki` ở chế độ `bridge` cho các trang tri thức tổng hợp bền vững

Cách tách đó hoạt động tốt vì mỗi lớp luôn tập trung:

- QMD giữ cho ghi chú thô, bản xuất phiên và các bộ sưu tập bổ sung có thể tìm kiếm
- `memory-wiki` biên soạn các thực thể, khẳng định, bảng điều khiển và trang nguồn ổn định

Quy tắc thực tế:

- dùng `memory_search` khi bạn muốn một lượt gọi nhớ rộng trên toàn bộ bộ nhớ
- dùng `wiki_search` và `wiki_get` khi bạn muốn kết quả wiki có nhận thức về nguồn gốc
- dùng `memory_search corpus=all` khi bạn muốn tìm kiếm dùng chung bao phủ cả hai lớp

Nếu chế độ cầu nối báo cáo không có hiện vật đã xuất nào, Plugin Active Memory hiện
chưa phơi bày đầu vào cầu nối công khai. Chạy `openclaw wiki doctor` trước,
rồi xác nhận Plugin Active Memory hỗ trợ hiện vật công khai.

Khi chế độ cầu nối đang hoạt động và `bridge.readMemoryArtifacts` được bật,
`openclaw wiki status`, `openclaw wiki doctor` và `openclaw wiki bridge
import` đọc qua Gateway đang chạy. Điều đó giữ cho các kiểm tra cầu nối CLI khớp
với ngữ cảnh Plugin bộ nhớ ở runtime. Nếu cầu nối bị tắt hoặc đọc hiện vật
bị tắt, các lệnh đó vẫn giữ hành vi cục bộ/ngoại tuyến.

## Chế độ kho

`memory-wiki` hỗ trợ ba chế độ kho:

### `isolated`

Kho riêng, nguồn riêng, không phụ thuộc vào `memory-core`.

Dùng chế độ này khi bạn muốn wiki là kho tri thức được tuyển chọn riêng.

### `bridge`

Đọc hiện vật bộ nhớ công khai và sự kiện bộ nhớ từ Plugin Active Memory
thông qua các điểm nối Plugin SDK công khai.

Dùng chế độ này khi bạn muốn wiki biên soạn và tổ chức các hiện vật đã xuất
của Plugin bộ nhớ mà không chạm vào nội bộ riêng tư của Plugin.

Chế độ cầu nối có thể lập chỉ mục:

- hiện vật bộ nhớ đã xuất
- báo cáo dream
- ghi chú hằng ngày
- tệp gốc bộ nhớ
- nhật ký sự kiện bộ nhớ

### `unsafe-local`

Cửa thoát tường minh trên cùng máy cho đường dẫn cục bộ riêng tư.

Chế độ này có chủ ý là thử nghiệm và không di động. Chỉ dùng khi bạn
hiểu ranh giới tin cậy và thật sự cần truy cập hệ thống tệp cục bộ mà
chế độ cầu nối không cung cấp được.

## Bố cục kho

Plugin khởi tạo một kho như sau:

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

Nội dung được quản lý nằm trong các khối đã tạo. Khối ghi chú của con người được giữ nguyên.

Các nhóm trang chính là:

- `sources/` cho tài liệu thô đã nhập và các trang được cầu nối hỗ trợ
- `entities/` cho sự vật, con người, hệ thống, dự án và đối tượng bền vững
- `concepts/` cho ý tưởng, trừu tượng, mẫu hình và chính sách
- `syntheses/` cho tóm tắt đã biên soạn và bản tổng hợp được duy trì
- `reports/` cho bảng điều khiển được tạo

## Nhập Open Knowledge Format

`memory-wiki` có thể nhập các gói Open Knowledge Format đã giải nén bằng:

```bash
openclaw wiki okf import ./bundles/ga4
```

Đây là cách phù hợp sạch nhất khi danh mục dữ liệu, trình thu thập tài liệu hoặc
agent làm giàu đã tạo OKF: giữ OKF làm hiện vật trao đổi di động,
rồi để `memory-wiki` biến nó thành các trang khái niệm gốc OpenClaw và
bản tóm tắt đã biên soạn.

Trình nhập tuân theo dạng OKF v0.1:

- các tệp `.md` không dành riêng là tài liệu khái niệm
- mỗi khái niệm đã nhập cần trường frontmatter `type` không rỗng
- các giá trị OKF `type` không xác định vẫn được chấp nhận
- các tệp dành riêng `index.md` và `log.md` không được nhập làm khái niệm
- liên kết markdown hỏng hoặc bên ngoài được giữ nguyên

Các trang khái niệm đã nhập được làm phẳng dưới `concepts/` để các đường dẫn biên soạn,
tìm kiếm, lấy, bảng điều khiển và prompt-digest hiện có nhìn thấy chúng mà không cần thêm
cây wiki thứ hai. Mỗi trang giữ ID khái niệm OKF gốc, đường dẫn nguồn, `type`,
`resource`, `tags`, dấu thời gian và toàn bộ frontmatter của bộ tạo. Liên kết OKF nội bộ
được viết lại sang các trang khái niệm wiki đã tạo và cũng được phát ra dưới dạng các mục
`relationships` có cấu trúc với `kind: okf-link`.

## Khẳng định và bằng chứng có cấu trúc

Trang có thể mang frontmatter `claims` có cấu trúc, không chỉ văn bản tự do.

Mỗi khẳng định có thể bao gồm:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Mục bằng chứng có thể bao gồm:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Đây là điều khiến wiki hoạt động giống một lớp niềm tin hơn là một nơi đổ ghi chú thụ động.
Khẳng định có thể được theo dõi, chấm điểm, tranh luận và truy ngược về nguồn.

## Siêu dữ liệu thực thể dành cho agent

Trang thực thể cũng có thể mang siêu dữ liệu định tuyến cho agent sử dụng. Đây là
frontmatter chung, nên nó hoạt động cho người, đội nhóm, hệ thống, dự án hoặc bất kỳ
loại thực thể nào khác.

Các trường phổ biến bao gồm:

- `entityType`: ví dụ `person`, `team`, `system` hoặc `project`
- `canonicalId`: khóa danh tính ổn định dùng trên alias và nhập liệu
- `aliases`: tên, handle hoặc nhãn nên phân giải về cùng một trang
- `privacyTier`: `public`, `local-private`, `sensitive` hoặc `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: gợi ý định tuyến ngắn gọn
- `lastRefreshedAt`: dấu thời gian làm mới nguồn tách biệt với thời gian chỉnh sửa trang
- `personCard`: thẻ định tuyến tùy chọn dành riêng cho người với handle, mạng xã hội,
  email, múi giờ, luồng, nên hỏi về, tránh hỏi về, độ tin cậy và quyền riêng tư
- `relationships`: cạnh có kiểu đến các trang liên quan với đích, loại, trọng số,
  độ tin cậy, loại bằng chứng, cấp riêng tư và ghi chú

Đối với wiki về con người, agent thường nên bắt đầu với
`reports/person-agent-directory.md`, rồi mở trang người bằng `wiki_get`
trước khi dùng chi tiết liên hệ hoặc sự kiện suy luận.

Ví dụ:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Pipeline biên soạn

Bước biên soạn đọc các trang wiki, chuẩn hóa tóm tắt và phát ra các hiện vật ổn định
dành cho máy dưới:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Các bản tóm tắt này tồn tại để agent và mã runtime không phải quét các trang Markdown.

Đầu ra đã biên soạn cũng cung cấp năng lực cho:

- lập chỉ mục wiki lượt đầu cho luồng tìm kiếm/lấy
- tra cứu ID khẳng định ngược về trang sở hữu
- phần bổ sung prompt ngắn gọn
- tạo báo cáo/bảng điều khiển

## Bảng điều khiển và báo cáo sức khỏe

Khi `render.createDashboards` được bật, quá trình biên soạn duy trì bảng điều khiển dưới
`reports/`.

Báo cáo tích hợp bao gồm:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Các báo cáo này theo dõi những thứ như:

- cụm ghi chú mâu thuẫn
- cụm khẳng định cạnh tranh
- khẳng định thiếu bằng chứng có cấu trúc
- trang và khẳng định có độ tin cậy thấp
- độ mới cũ hoặc không xác định
- trang có câu hỏi chưa giải quyết
- thẻ định tuyến người/thực thể
- cạnh quan hệ có cấu trúc
- độ phủ lớp bằng chứng
- cấp riêng tư không công khai cần xem xét trước khi dùng

## Tìm kiếm và truy xuất

`memory-wiki` hỗ trợ hai backend tìm kiếm:

- `shared`: dùng luồng tìm kiếm bộ nhớ dùng chung khi có
- `local`: tìm kiếm wiki cục bộ

Nó cũng hỗ trợ ba kho ngữ liệu:

- `wiki`
- `memory`
- `all`

Hành vi quan trọng:

- `wiki_search` và `wiki_get` dùng bản tóm tắt đã biên soạn làm lượt đầu khi có thể
- ID khẳng định có thể phân giải ngược về trang sở hữu
- khẳng định bị tranh luận/cũ/mới ảnh hưởng đến xếp hạng
- nhãn nguồn gốc có thể được giữ trong kết quả
- chế độ tìm kiếm có thể thiên vị xếp hạng cho tra cứu người, định tuyến câu hỏi, bằng chứng
  nguồn hoặc khẳng định thô

Quy tắc thực tế:

- dùng `memory_search corpus=all` cho một lượt gọi nhớ rộng
- dùng `wiki_search` + `wiki_get` khi bạn quan tâm đến xếp hạng dành riêng cho wiki,
  nguồn gốc hoặc cấu trúc niềm tin ở cấp trang

Chế độ tìm kiếm:

- `auto`: mặc định cân bằng
- `find-person`: tăng hạng thực thể giống người, alias, handle, mạng xã hội và
  ID chuẩn
- `route-question`: tăng hạng thẻ agent, gợi ý ask-for, gợi ý best-used-for và
  ngữ cảnh quan hệ
- `source-evidence`: tăng hạng trang nguồn và siêu dữ liệu bằng chứng có cấu trúc
- `raw-claim`: tăng hạng các khẳng định có cấu trúc khớp và trả về siêu dữ liệu
  khẳng định/bằng chứng trong kết quả

Khi một kết quả khớp với khẳng định có cấu trúc, `wiki_search` có thể trả về
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` và `evidenceSourceIds` trong payload chi tiết. Đầu ra văn bản
cũng bao gồm các dòng `Claim:` và `Evidence:` ngắn gọn khi có.

## Công cụ agent

Plugin đăng ký các công cụ sau:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Chúng làm gì:

- `wiki_status`: chế độ kho hiện tại, sức khỏe, tính khả dụng của CLI Obsidian
- `wiki_search`: tìm kiếm trang wiki và, khi được cấu hình, kho ngữ liệu bộ nhớ dùng chung;
  chấp nhận `mode` cho tra cứu người, định tuyến câu hỏi, bằng chứng nguồn hoặc đào sâu
  khẳng định thô
- `wiki_get`: đọc một trang wiki theo id/đường dẫn hoặc fallback về kho ngữ liệu bộ nhớ dùng chung
- `wiki_apply`: đột biến tổng hợp/siêu dữ liệu hẹp mà không phẫu thuật trang tự do
- `wiki_lint`: kiểm tra cấu trúc, khoảng trống nguồn gốc, mâu thuẫn, câu hỏi mở

Plugin cũng đăng ký một phần bổ sung kho ngữ liệu bộ nhớ không độc quyền, nên các công cụ dùng chung
`memory_search` và `memory_get` có thể truy cập wiki khi plugin bộ nhớ đang hoạt động
hỗ trợ chọn kho ngữ liệu.

## Hành vi lời nhắc và ngữ cảnh

Khi bật `context.includeCompiledDigestPrompt`, các phần lời nhắc bộ nhớ
sẽ nối thêm một ảnh chụp tổng hợp đã biên soạn, dạng nhỏ gọn, từ `agent-digest.json`.

Ảnh chụp này được cố ý giữ nhỏ gọn và giàu tín hiệu:

- chỉ các trang hàng đầu
- chỉ các nhận định hàng đầu
- số lượng mâu thuẫn
- số lượng câu hỏi
- các định tính về độ tin cậy/độ mới

Tùy chọn này là tự nguyện vì nó thay đổi hình dạng lời nhắc và chủ yếu hữu ích cho các engine ngữ cảnh
hoặc cơ chế lắp ráp lời nhắc cũ có chủ đích tiêu thụ các phần bổ sung bộ nhớ.

## Cấu hình

Đặt cấu hình dưới `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
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

Các nút bật/tắt chính:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` hoặc `obsidian`
- `bridge.readMemoryArtifacts`: nhập các hiện vật công khai của plugin bộ nhớ đang hoạt động
- `bridge.followMemoryEvents`: bao gồm nhật ký sự kiện ở chế độ bridge
- `search.backend`: `shared` hoặc `local`
- `search.corpus`: `wiki`, `memory`, hoặc `all`
- `context.includeCompiledDigestPrompt`: nối ảnh chụp digest nhỏ gọn vào các phần lời nhắc bộ nhớ
- `render.createBacklinks`: tạo các khối liên quan theo cách xác định
- `render.createDashboards`: tạo các trang bảng điều khiển

### Ví dụ: QMD + chế độ bridge

Dùng cấu hình này khi bạn muốn QMD để truy hồi và `memory-wiki` cho một
lớp tri thức được duy trì:

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

Điều này giữ cho:

- QMD phụ trách truy hồi bộ nhớ đang hoạt động
- `memory-wiki` tập trung vào các trang đã biên soạn và bảng điều khiển
- hình dạng lời nhắc không đổi cho đến khi bạn chủ động bật lời nhắc digest đã biên soạn

## CLI

`memory-wiki` cũng cung cấp một bề mặt CLI cấp cao nhất:

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

Xem [CLI: wiki](/vi/cli/wiki) để có tài liệu tham chiếu lệnh đầy đủ.

## Hỗ trợ Obsidian

Khi `vault.renderMode` là `obsidian`, plugin ghi Markdown thân thiện với Obsidian
và có thể tùy chọn dùng CLI `obsidian` chính thức.

Các quy trình được hỗ trợ bao gồm:

- thăm dò trạng thái
- tìm kiếm vault
- mở một trang
- gọi một lệnh Obsidian
- chuyển tới ghi chú hằng ngày

Phần này là tùy chọn. Wiki vẫn hoạt động ở chế độ native mà không cần Obsidian.

## Quy trình được khuyến nghị

1. Giữ plugin bộ nhớ đang hoạt động của bạn cho truy hồi/đề bạt/Dreaming.
2. Bật `memory-wiki`.
3. Bắt đầu với chế độ `isolated` trừ khi bạn rõ ràng muốn dùng chế độ bridge.
4. Dùng `wiki_search` / `wiki_get` khi nguồn gốc quan trọng.
5. Dùng `wiki_apply` cho các bản tổng hợp hẹp hoặc cập nhật siêu dữ liệu.
6. Chạy `wiki_lint` sau các thay đổi đáng kể.
7. Bật bảng điều khiển nếu bạn muốn thấy dữ liệu cũ/mâu thuẫn.

## Tài liệu liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [CLI: bộ nhớ](/vi/cli/memory)
- [CLI: wiki](/vi/cli/wiki)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
