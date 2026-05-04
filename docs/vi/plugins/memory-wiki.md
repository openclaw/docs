---
read_when:
    - Bạn muốn có kiến thức được lưu giữ lâu dài ngoài các ghi chú MEMORY.md thuần túy
    - Bạn đang cấu hình Plugin memory-wiki đi kèm
    - Bạn muốn hiểu về wiki_search, wiki_get hoặc chế độ cầu nối
summary: 'memory-wiki: kho tri thức đã biên soạn với thông tin nguồn gốc, các tuyên bố, bảng điều khiển và chế độ cầu nối'
title: Wiki bộ nhớ
x-i18n:
    generated_at: "2026-05-04T02:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` là một Plugin đi kèm giúp biến bộ nhớ bền vững thành một kho tri thức đã biên dịch.

Nó **không** thay thế Plugin Active Memory. Plugin Active Memory vẫn
sở hữu việc truy hồi, thăng cấp, lập chỉ mục và Dreaming. `memory-wiki` nằm cạnh nó
và biên dịch tri thức bền vững thành một wiki có thể điều hướng với các trang xác định,
nhận định có cấu trúc, nguồn gốc, bảng điều khiển và bản tóm lược đọc được bằng máy.

Dùng nó khi bạn muốn bộ nhớ hoạt động giống một lớp tri thức được duy trì hơn và
ít giống một đống tệp Markdown hơn.

## Những gì nó bổ sung

- Một kho wiki chuyên dụng với bố cục trang xác định
- Siêu dữ liệu nhận định và bằng chứng có cấu trúc, không chỉ là văn xuôi
- Nguồn gốc, độ tin cậy, mâu thuẫn và câu hỏi mở ở cấp trang
- Bản tóm lược đã biên dịch cho tác nhân/người dùng runtime
- Công cụ tìm kiếm/lấy/áp dụng/lint dành riêng cho wiki
- Chế độ cầu nối tùy chọn để nhập hiện vật công khai từ Plugin Active Memory
- Chế độ kết xuất thân thiện với Obsidian và tích hợp CLI tùy chọn

## Cách nó phù hợp với bộ nhớ

Hãy hình dung sự phân tách như sau:

| Lớp                                                     | Sở hữu                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho, v.v.) | Truy hồi, tìm kiếm ngữ nghĩa, thăng cấp, Dreaming, runtime bộ nhớ                          |
| `memory-wiki`                                           | Trang wiki đã biên dịch, tổng hợp giàu nguồn gốc, bảng điều khiển, tìm kiếm/lấy/áp dụng riêng cho wiki |

Nếu Plugin Active Memory hiển thị các hiện vật truy hồi dùng chung, OpenClaw có thể tìm kiếm
cả hai lớp trong một lượt với `memory_search corpus=all`.

Khi bạn cần xếp hạng dành riêng cho wiki, nguồn gốc hoặc truy cập trang trực tiếp, hãy dùng
các công cụ riêng của wiki thay thế.

## Mẫu kết hợp được khuyến nghị

Một mặc định mạnh cho các thiết lập ưu tiên cục bộ là:

- QMD làm backend Active Memory cho truy hồi và tìm kiếm ngữ nghĩa rộng
- `memory-wiki` ở chế độ `bridge` cho các trang tri thức đã tổng hợp bền vững

Sự phân tách đó hoạt động tốt vì mỗi lớp vẫn tập trung:

- QMD giữ cho ghi chú thô, bản xuất phiên và các bộ sưu tập bổ sung có thể tìm kiếm được
- `memory-wiki` biên dịch các thực thể ổn định, nhận định, bảng điều khiển và trang nguồn

Quy tắc thực tế:

- dùng `memory_search` khi bạn muốn một lượt truy hồi rộng trên toàn bộ bộ nhớ
- dùng `wiki_search` và `wiki_get` khi bạn muốn kết quả wiki có nhận biết nguồn gốc
- dùng `memory_search corpus=all` khi bạn muốn tìm kiếm dùng chung bao phủ cả hai lớp

Nếu chế độ cầu nối báo cáo không có hiện vật đã xuất nào, Plugin Active Memory hiện
chưa hiển thị đầu vào cầu nối công khai. Chạy `openclaw wiki doctor` trước,
sau đó xác nhận Plugin Active Memory hỗ trợ hiện vật công khai.

Khi chế độ cầu nối đang hoạt động và `bridge.readMemoryArtifacts` được bật,
`openclaw wiki status`, `openclaw wiki doctor` và `openclaw wiki bridge
import` đọc thông qua Gateway đang chạy. Điều đó giữ cho các kiểm tra cầu nối CLI khớp
với ngữ cảnh Plugin bộ nhớ runtime. Nếu cầu nối bị tắt hoặc việc đọc hiện vật
bị tắt, các lệnh đó giữ nguyên hành vi cục bộ/ngoại tuyến.

## Chế độ kho

`memory-wiki` hỗ trợ ba chế độ kho:

### `isolated`

Kho riêng, nguồn riêng, không phụ thuộc vào `memory-core`.

Dùng chế độ này khi bạn muốn wiki là kho tri thức được tuyển chọn riêng.

### `bridge`

Đọc hiện vật bộ nhớ công khai và sự kiện bộ nhớ từ Plugin Active Memory
thông qua các seam công khai của Plugin SDK.

Dùng chế độ này khi bạn muốn wiki biên dịch và tổ chức các hiện vật đã xuất
của Plugin bộ nhớ mà không truy cập vào phần nội bộ riêng tư của Plugin.

Chế độ cầu nối có thể lập chỉ mục:

- hiện vật bộ nhớ đã xuất
- báo cáo Dreaming
- ghi chú hằng ngày
- tệp gốc bộ nhớ
- nhật ký sự kiện bộ nhớ

### `unsafe-local`

Lối thoát rõ ràng trên cùng máy cho các đường dẫn riêng tư cục bộ.

Chế độ này có chủ ý là thử nghiệm và không di động. Chỉ dùng khi bạn
hiểu ranh giới tin cậy và cụ thể cần truy cập hệ thống tệp cục bộ mà
chế độ cầu nối không thể cung cấp.

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

Nội dung được quản lý nằm trong các khối đã tạo. Các khối ghi chú của con người được giữ nguyên.

Các nhóm trang chính là:

- `sources/` cho tài liệu thô đã nhập và các trang dựa trên cầu nối
- `entities/` cho những thứ, con người, hệ thống, dự án và đối tượng bền vững
- `concepts/` cho ý tưởng, trừu tượng, mẫu và chính sách
- `syntheses/` cho tóm tắt đã biên dịch và bản tổng hợp được duy trì
- `reports/` cho bảng điều khiển đã tạo

## Nhận định và bằng chứng có cấu trúc

Các trang có thể mang frontmatter `claims` có cấu trúc, không chỉ văn bản tự do.

Mỗi nhận định có thể bao gồm:

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

Đây là điều khiến wiki hoạt động giống một lớp niềm tin hơn là một nơi đổ ghi chú
thụ động. Nhận định có thể được theo dõi, chấm điểm, phản biện và phân giải ngược về nguồn.

## Siêu dữ liệu thực thể hướng tới tác nhân

Trang thực thể cũng có thể mang siêu dữ liệu định tuyến để tác nhân sử dụng. Đây là
frontmatter chung, nên nó hoạt động cho người, nhóm, hệ thống, dự án hoặc bất kỳ
kiểu thực thể nào khác.

Các trường phổ biến bao gồm:

- `entityType`: ví dụ `person`, `team`, `system` hoặc `project`
- `canonicalId`: khóa danh tính ổn định được dùng trên các bí danh và bản nhập
- `aliases`: tên, handle hoặc nhãn nên phân giải về cùng một trang
- `privacyTier`: `public`, `local-private`, `sensitive` hoặc `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: gợi ý định tuyến gọn
- `lastRefreshedAt`: dấu thời gian làm mới nguồn tách biệt với thời gian chỉnh sửa trang
- `personCard`: thẻ định tuyến tùy chọn dành riêng cho người với handle, mạng xã hội,
  email, múi giờ, lane, nên hỏi, tránh hỏi, độ tin cậy và quyền riêng tư
- `relationships`: cạnh có kiểu tới các trang liên quan với đích, loại, trọng số,
  độ tin cậy, loại bằng chứng, bậc quyền riêng tư và ghi chú

Với wiki về con người, tác nhân thường nên bắt đầu từ
`reports/person-agent-directory.md`, sau đó mở trang người bằng `wiki_get`
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

## Pipeline biên dịch

Bước biên dịch đọc các trang wiki, chuẩn hóa tóm tắt và phát ra các hiện vật ổn định
hướng tới máy dưới:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Các bản tóm lược này tồn tại để tác nhân và mã runtime không phải thu thập dữ liệu từ
các trang Markdown.

Đầu ra đã biên dịch cũng hỗ trợ:

- lập chỉ mục wiki lượt đầu cho luồng tìm kiếm/lấy
- tra cứu claim-id ngược về trang sở hữu
- phần bổ sung prompt gọn
- tạo báo cáo/bảng điều khiển

## Bảng điều khiển và báo cáo sức khỏe

Khi `render.createDashboards` được bật, bước biên dịch duy trì bảng điều khiển dưới
`reports/`.

Các báo cáo tích hợp sẵn bao gồm:

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
- cụm nhận định cạnh tranh
- nhận định thiếu bằng chứng có cấu trúc
- trang và nhận định có độ tin cậy thấp
- độ mới đã cũ hoặc không xác định
- trang có câu hỏi chưa giải quyết
- thẻ định tuyến người/thực thể
- cạnh quan hệ có cấu trúc
- mức bao phủ lớp bằng chứng
- bậc quyền riêng tư không công khai cần xem xét trước khi dùng

## Tìm kiếm và truy xuất

`memory-wiki` hỗ trợ hai backend tìm kiếm:

- `shared`: dùng luồng tìm kiếm bộ nhớ dùng chung khi có sẵn
- `local`: tìm kiếm wiki cục bộ

Nó cũng hỗ trợ ba ngữ liệu:

- `wiki`
- `memory`
- `all`

Hành vi quan trọng:

- `wiki_search` và `wiki_get` dùng các bản tóm lược đã biên dịch làm lượt đầu khi có thể
- id nhận định có thể phân giải ngược về trang sở hữu
- nhận định bị tranh chấp/đã cũ/mới ảnh hưởng đến xếp hạng
- nhãn nguồn gốc có thể tồn tại trong kết quả
- chế độ tìm kiếm có thể thiên lệch xếp hạng cho tra cứu người, định tuyến câu hỏi, bằng chứng
  nguồn hoặc nhận định thô

Quy tắc thực tế:

- dùng `memory_search corpus=all` cho một lượt truy hồi rộng
- dùng `wiki_search` + `wiki_get` khi bạn quan tâm đến xếp hạng riêng của wiki,
  nguồn gốc hoặc cấu trúc niềm tin cấp trang

Chế độ tìm kiếm:

- `auto`: mặc định cân bằng
- `find-person`: tăng hạng thực thể giống người, bí danh, handle, mạng xã hội và
  ID chính tắc
- `route-question`: tăng hạng thẻ tác nhân, gợi ý nên hỏi, gợi ý phù hợp nhất và
  ngữ cảnh quan hệ
- `source-evidence`: tăng hạng trang nguồn và siêu dữ liệu bằng chứng có cấu trúc
- `raw-claim`: tăng hạng nhận định có cấu trúc khớp và trả về siêu dữ liệu
  nhận định/bằng chứng trong kết quả

Khi một kết quả khớp với một nhận định có cấu trúc, `wiki_search` có thể trả về
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` và `evidenceSourceIds` trong payload chi tiết của nó. Đầu ra văn bản
cũng bao gồm các dòng `Claim:` và `Evidence:` gọn khi có sẵn.

## Công cụ tác nhân

Plugin đăng ký các công cụ này:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Chúng làm gì:

- `wiki_status`: chế độ kho hiện tại, sức khỏe, tính khả dụng của CLI Obsidian
- `wiki_search`: tìm kiếm trang wiki và, khi được cấu hình, ngữ liệu bộ nhớ dùng chung;
  chấp nhận `mode` cho tra cứu người, định tuyến câu hỏi, bằng chứng nguồn hoặc đào sâu
  nhận định thô
- `wiki_get`: đọc trang wiki theo id/đường dẫn hoặc fallback sang ngữ liệu bộ nhớ dùng chung
- `wiki_apply`: đột biến tổng hợp/siêu dữ liệu hẹp mà không phẫu thuật trang tự do
- `wiki_lint`: kiểm tra cấu trúc, thiếu hụt nguồn gốc, mâu thuẫn, câu hỏi mở

Plugin cũng đăng ký một phần bổ sung ngữ liệu bộ nhớ không độc quyền, để
`memory_search` và `memory_get` dùng chung có thể truy cập wiki khi Plugin Active Memory
hỗ trợ chọn ngữ liệu.

## Hành vi prompt và ngữ cảnh

Khi `context.includeCompiledDigestPrompt` được bật, các phần prompt bộ nhớ
nối thêm một ảnh chụp đã biên dịch gọn từ `agent-digest.json`.

Ảnh chụp đó có chủ ý nhỏ và nhiều tín hiệu:

- chỉ các trang hàng đầu
- chỉ các nhận định hàng đầu
- số lượng mâu thuẫn
- số lượng câu hỏi
- bộ định tính độ tin cậy/độ mới

Đây là tùy chọn vì nó thay đổi hình dạng prompt và chủ yếu hữu ích cho các
công cụ ngữ cảnh hoặc quá trình lắp ráp prompt cũ tiêu thụ rõ ràng phần bổ sung bộ nhớ.

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
- `bridge.readMemoryArtifacts`: nhập các artifact công khai của Plugin Active Memory
- `bridge.followMemoryEvents`: bao gồm nhật ký sự kiện trong chế độ bridge
- `search.backend`: `shared` hoặc `local`
- `search.corpus`: `wiki`, `memory`, hoặc `all`
- `context.includeCompiledDigestPrompt`: thêm snapshot tóm tắt gọn vào các phần lời nhắc bộ nhớ
- `render.createBacklinks`: tạo các khối liên quan có tính xác định
- `render.createDashboards`: tạo các trang dashboard

### Ví dụ: QMD + chế độ bridge

Dùng cấu hình này khi bạn muốn QMD để truy hồi và `memory-wiki` cho một lớp
tri thức được duy trì:

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

Cấu hình này giữ:

- QMD phụ trách truy hồi Active Memory
- `memory-wiki` tập trung vào các trang đã biên dịch và dashboard
- hình dạng lời nhắc không đổi cho đến khi bạn chủ động bật lời nhắc tóm tắt đã biên dịch

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

Xem [CLI: wiki](/vi/cli/wiki) để biết tài liệu tham chiếu lệnh đầy đủ.

## Hỗ trợ Obsidian

Khi `vault.renderMode` là `obsidian`, Plugin ghi Markdown thân thiện với Obsidian
và có thể tùy chọn dùng CLI `obsidian` chính thức.

Các quy trình được hỗ trợ bao gồm:

- thăm dò trạng thái
- tìm kiếm vault
- mở một trang
- gọi một lệnh Obsidian
- chuyển tới ghi chú hằng ngày

Tính năng này là tùy chọn. Wiki vẫn hoạt động ở chế độ native mà không cần Obsidian.

## Quy trình được khuyến nghị

1. Giữ Plugin Active Memory của bạn cho truy hồi/quảng bá/Dreaming.
2. Bật `memory-wiki`.
3. Bắt đầu với chế độ `isolated` trừ khi bạn rõ ràng muốn chế độ bridge.
4. Dùng `wiki_search` / `wiki_get` khi nguồn gốc dữ liệu là quan trọng.
5. Dùng `wiki_apply` cho các bản tổng hợp hẹp hoặc cập nhật siêu dữ liệu.
6. Chạy `wiki_lint` sau các thay đổi đáng kể.
7. Bật dashboard nếu bạn muốn khả năng hiển thị dữ liệu cũ/mâu thuẫn.

## Tài liệu liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [CLI: memory](/vi/cli/memory)
- [CLI: wiki](/vi/cli/wiki)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
