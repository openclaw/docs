---
read_when:
    - Bạn muốn kiến thức lâu dài vượt ngoài các ghi chú MEMORY.md đơn thuần
    - Bạn đang cấu hình plugin memory-wiki đi kèm
    - Bạn muốn tìm hiểu về wiki_search, wiki_get hoặc chế độ cầu nối
summary: 'memory-wiki: kho tri thức tổng hợp với nguồn gốc, các khẳng định, bảng điều khiển và chế độ cầu nối'
title: Wiki bộ nhớ
x-i18n:
    generated_at: "2026-04-29T23:00:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` là một Plugin đi kèm, biến bộ nhớ bền vững thành một
kho tri thức đã biên dịch.

Nó **không** thay thế Plugin Active Memory. Plugin Active Memory vẫn
sở hữu việc truy hồi, thăng hạng, lập chỉ mục và Dreaming. `memory-wiki` nằm bên cạnh nó
và biên dịch tri thức bền vững thành một wiki có thể điều hướng với các trang xác định,
claim có cấu trúc, provenance, bảng điều khiển và digest máy có thể đọc.

Dùng nó khi bạn muốn bộ nhớ hoạt động giống một lớp tri thức được bảo trì hơn và
ít giống một đống tệp Markdown hơn.

## Nó bổ sung gì

- Một kho wiki chuyên dụng với bố cục trang xác định
- Siêu dữ liệu claim và bằng chứng có cấu trúc, không chỉ là văn xuôi
- Provenance, độ tin cậy, mâu thuẫn và câu hỏi mở ở cấp trang
- Digest đã biên dịch cho agent/runtime sử dụng
- Công cụ tìm kiếm/lấy/áp dụng/lint nguyên sinh của wiki
- Chế độ bridge tùy chọn để nhập artifact công khai từ Plugin Active Memory
- Chế độ render thân thiện với Obsidian và tích hợp CLI tùy chọn

## Cách nó khớp với memory

Hãy hình dung phần tách lớp như sau:

| Lớp                                                     | Sở hữu                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho, v.v.) | Truy hồi, tìm kiếm ngữ nghĩa, thăng hạng, Dreaming, runtime bộ nhớ                         |
| `memory-wiki`                                           | Trang wiki đã biên dịch, bản tổng hợp giàu provenance, bảng điều khiển, tìm kiếm/lấy/áp dụng riêng của wiki |

Nếu Plugin Active Memory cung cấp artifact truy hồi dùng chung, OpenClaw có thể tìm kiếm
cả hai lớp trong một lượt với `memory_search corpus=all`.

Khi bạn cần xếp hạng riêng của wiki, provenance hoặc truy cập trang trực tiếp, hãy dùng
các công cụ nguyên sinh của wiki thay thế.

## Mẫu hybrid được khuyến nghị

Mặc định mạnh cho các thiết lập ưu tiên cục bộ là:

- QMD làm backend Active Memory cho truy hồi và tìm kiếm ngữ nghĩa rộng
- `memory-wiki` ở chế độ `bridge` cho các trang tri thức tổng hợp bền vững

Phần tách đó hoạt động tốt vì mỗi lớp giữ đúng trọng tâm:

- QMD giữ cho ghi chú thô, bản xuất phiên và các collection bổ sung có thể tìm kiếm
- `memory-wiki` biên dịch entity ổn định, claim, bảng điều khiển và trang nguồn

Quy tắc thực tế:

- dùng `memory_search` khi bạn muốn một lượt truy hồi rộng trên bộ nhớ
- dùng `wiki_search` và `wiki_get` khi bạn muốn kết quả wiki có nhận thức provenance
- dùng `memory_search corpus=all` khi bạn muốn tìm kiếm dùng chung bao phủ cả hai lớp

Nếu chế độ bridge báo cáo không có artifact đã xuất nào, Plugin Active Memory hiện
chưa cung cấp đầu vào bridge công khai. Trước tiên chạy `openclaw wiki doctor`,
sau đó xác nhận Plugin Active Memory hỗ trợ artifact công khai.

Khi chế độ bridge hoạt động và `bridge.readMemoryArtifacts` được bật,
`openclaw wiki status`, `openclaw wiki doctor` và `openclaw wiki bridge
import` đọc thông qua Gateway đang chạy. Điều đó giữ các kiểm tra bridge của CLI đồng bộ
với ngữ cảnh Plugin memory runtime. Nếu bridge bị tắt hoặc đọc artifact
bị tắt, các lệnh đó giữ hành vi cục bộ/ngoại tuyến.

## Chế độ vault

`memory-wiki` hỗ trợ ba chế độ vault:

### `isolated`

Vault riêng, nguồn riêng, không phụ thuộc vào `memory-core`.

Dùng chế độ này khi bạn muốn wiki là kho tri thức được tuyển chọn riêng.

### `bridge`

Đọc artifact memory công khai và sự kiện memory từ Plugin Active Memory
thông qua các seam công khai của Plugin SDK.

Dùng chế độ này khi bạn muốn wiki biên dịch và tổ chức các artifact đã xuất
của Plugin memory mà không chạm vào nội bộ Plugin riêng tư.

Chế độ bridge có thể lập chỉ mục:

- artifact memory đã xuất
- báo cáo dream
- ghi chú hằng ngày
- tệp gốc memory
- nhật ký sự kiện memory

### `unsafe-local`

Lối thoát rõ ràng trên cùng máy cho đường dẫn cục bộ riêng tư.

Chế độ này có chủ đích là thử nghiệm và không di động. Chỉ dùng khi bạn
hiểu ranh giới tin cậy và thật sự cần quyền truy cập hệ thống tệp cục bộ mà
chế độ bridge không cung cấp được.

## Bố cục vault

Plugin khởi tạo một vault như sau:

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

- `sources/` cho tư liệu thô đã nhập và các trang được bridge hỗ trợ
- `entities/` cho những thứ, con người, hệ thống, dự án và đối tượng bền vững
- `concepts/` cho ý tưởng, trừu tượng, mẫu hình và chính sách
- `syntheses/` cho tóm tắt đã biên dịch và rollup được bảo trì
- `reports/` cho bảng điều khiển đã tạo

## Claim và bằng chứng có cấu trúc

Trang có thể mang frontmatter `claims` có cấu trúc, không chỉ văn bản tự do.

Mỗi claim có thể bao gồm:

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

Đây là điều khiến wiki hoạt động giống một lớp niềm tin hơn là một nơi
đổ ghi chú thụ động. Claim có thể được theo dõi, chấm điểm, phản biện và truy ngược về nguồn.

## Siêu dữ liệu entity hướng tới agent

Trang entity cũng có thể mang siêu dữ liệu định tuyến cho agent sử dụng. Đây là
frontmatter chung, nên nó hoạt động cho con người, nhóm, hệ thống, dự án hoặc bất kỳ
kiểu entity nào khác.

Các trường thường gặp gồm:

- `entityType`: ví dụ `person`, `team`, `system` hoặc `project`
- `canonicalId`: khóa danh tính ổn định dùng trên alias và lượt nhập
- `aliases`: tên, handle hoặc nhãn nên phân giải về cùng một trang
- `privacyTier`: `public`, `local-private`, `sensitive` hoặc `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: gợi ý định tuyến ngắn gọn
- `lastRefreshedAt`: dấu thời gian làm mới nguồn tách biệt với thời gian sửa trang
- `personCard`: thẻ định tuyến tùy chọn riêng cho người, với handle, mạng xã hội,
  email, múi giờ, lane, ask-for, avoid-asking-for, độ tin cậy và quyền riêng tư
- `relationships`: cạnh có kiểu tới các trang liên quan với đích, loại, trọng số,
  độ tin cậy, loại bằng chứng, tầng quyền riêng tư và ghi chú

Với wiki về con người, agent thường nên bắt đầu từ
`reports/person-agent-directory.md`, sau đó mở trang người đó bằng `wiki_get`
trước khi dùng thông tin liên hệ hoặc dữ kiện suy luận.

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

Bước biên dịch đọc các trang wiki, chuẩn hóa tóm tắt và phát ra các artifact ổn định
hướng tới máy dưới:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Các digest này tồn tại để agent và mã runtime không phải scrape trang Markdown.

Đầu ra đã biên dịch cũng cung cấp năng lực cho:

- lập chỉ mục wiki lượt đầu cho luồng tìm kiếm/lấy
- tra cứu claim-id ngược về trang sở hữu
- phần bổ sung prompt nhỏ gọn
- tạo báo cáo/bảng điều khiển

## Bảng điều khiển và báo cáo sức khỏe

Khi `render.createDashboards` được bật, compile duy trì bảng điều khiển trong
`reports/`.

Báo cáo tích hợp gồm:

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
- cụm claim cạnh tranh
- claim thiếu bằng chứng có cấu trúc
- trang và claim có độ tin cậy thấp
- độ mới cũ hoặc không rõ
- trang có câu hỏi chưa giải quyết
- thẻ định tuyến person/entity
- cạnh quan hệ có cấu trúc
- độ phủ lớp bằng chứng
- tầng quyền riêng tư không công khai cần xem xét trước khi dùng

## Tìm kiếm và truy hồi

`memory-wiki` hỗ trợ hai backend tìm kiếm:

- `shared`: dùng luồng tìm kiếm memory dùng chung khi có sẵn
- `local`: tìm kiếm wiki cục bộ

Nó cũng hỗ trợ ba corpus:

- `wiki`
- `memory`
- `all`

Hành vi quan trọng:

- `wiki_search` và `wiki_get` dùng digest đã biên dịch làm lượt đầu khi có thể
- id claim có thể phân giải ngược về trang sở hữu
- claim bị phản biện/cũ/mới ảnh hưởng tới xếp hạng
- nhãn provenance có thể được giữ trong kết quả
- chế độ tìm kiếm có thể thiên vị xếp hạng cho tra cứu người, định tuyến câu hỏi, bằng chứng
  nguồn hoặc claim thô

Quy tắc thực tế:

- dùng `memory_search corpus=all` cho một lượt truy hồi rộng
- dùng `wiki_search` + `wiki_get` khi bạn quan tâm tới xếp hạng riêng của wiki,
  provenance hoặc cấu trúc niềm tin cấp trang

Chế độ tìm kiếm:

- `auto`: mặc định cân bằng
- `find-person`: tăng điểm các entity giống người, alias, handle, mạng xã hội và
  ID canonical
- `route-question`: tăng điểm thẻ agent, gợi ý ask-for, gợi ý best-used-for và
  ngữ cảnh quan hệ
- `source-evidence`: tăng điểm trang nguồn và siêu dữ liệu bằng chứng có cấu trúc
- `raw-claim`: tăng điểm claim có cấu trúc khớp và trả về siêu dữ liệu claim/bằng chứng
  trong kết quả

Khi một kết quả khớp với claim có cấu trúc, `wiki_search` có thể trả về
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` và `evidenceSourceIds` trong payload chi tiết của nó. Đầu ra văn bản
cũng bao gồm các dòng `Claim:` và `Evidence:` nhỏ gọn khi có.

## Công cụ agent

Plugin đăng ký các công cụ này:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Chúng làm gì:

- `wiki_status`: chế độ vault hiện tại, sức khỏe, khả năng có sẵn của CLI Obsidian
- `wiki_search`: tìm kiếm trang wiki và, khi được cấu hình, corpus memory dùng chung;
  chấp nhận `mode` cho tra cứu người, định tuyến câu hỏi, bằng chứng nguồn hoặc đào sâu
  claim thô
- `wiki_get`: đọc trang wiki theo id/path hoặc fallback về corpus memory dùng chung
- `wiki_apply`: đột biến tổng hợp/siêu dữ liệu hẹp mà không phẫu thuật trang tự do
- `wiki_lint`: kiểm tra cấu trúc, khoảng trống provenance, mâu thuẫn, câu hỏi mở

Plugin cũng đăng ký phần bổ sung corpus memory không độc quyền, để
`memory_search` và `memory_get` dùng chung có thể chạm tới wiki khi Plugin Active Memory
hỗ trợ chọn corpus.

## Hành vi prompt và context

Khi `context.includeCompiledDigestPrompt` được bật, các phần prompt memory
thêm một snapshot đã biên dịch nhỏ gọn từ `agent-digest.json`.

Snapshot đó được chủ đích giữ nhỏ và giàu tín hiệu:

- chỉ các trang hàng đầu
- chỉ các claim hàng đầu
- số lượng mâu thuẫn
- số lượng câu hỏi
- định tính độ tin cậy/độ mới

Đây là tùy chọn vì nó thay đổi hình dạng prompt và chủ yếu hữu ích cho engine context
hoặc lắp ráp prompt legacy tiêu thụ rõ ràng các phần bổ sung memory.

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

Các tùy chọn bật/tắt chính:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` hoặc `obsidian`
- `bridge.readMemoryArtifacts`: nhập các artifact công khai của Plugin Active Memory
- `bridge.followMemoryEvents`: bao gồm nhật ký sự kiện ở chế độ bridge
- `search.backend`: `shared` hoặc `local`
- `search.corpus`: `wiki`, `memory`, hoặc `all`
- `context.includeCompiledDigestPrompt`: thêm ảnh chụp digest nhỏ gọn vào các phần lời nhắc bộ nhớ
- `render.createBacklinks`: tạo các khối liên quan xác định
- `render.createDashboards`: tạo các trang bảng điều khiển

### Ví dụ: QMD + chế độ bridge

Dùng cấu hình này khi bạn muốn QMD để truy hồi và `memory-wiki` làm một lớp tri thức được duy trì:

```json5
{
  memory: {
    backend: "qmd",
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
- `memory-wiki` tập trung vào các trang đã biên dịch và bảng điều khiển
- hình dạng lời nhắc không đổi cho đến khi bạn chủ động bật lời nhắc digest đã biên dịch

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

Khi `vault.renderMode` là `obsidian`, Plugin ghi Markdown thân thiện với Obsidian và có thể tùy chọn dùng CLI `obsidian` chính thức.

Các quy trình được hỗ trợ bao gồm:

- thăm dò trạng thái
- tìm kiếm vault
- mở một trang
- gọi một lệnh Obsidian
- chuyển đến ghi chú hằng ngày

Tính năng này là tùy chọn. Wiki vẫn hoạt động ở chế độ native mà không cần Obsidian.

## Quy trình được khuyến nghị

1. Giữ Plugin Active Memory của bạn cho truy hồi/quảng bá/Dreaming.
2. Bật `memory-wiki`.
3. Bắt đầu với chế độ `isolated` trừ khi bạn rõ ràng muốn chế độ bridge.
4. Dùng `wiki_search` / `wiki_get` khi nguồn gốc quan trọng.
5. Dùng `wiki_apply` cho các tổng hợp hẹp hoặc cập nhật siêu dữ liệu.
6. Chạy `wiki_lint` sau các thay đổi đáng kể.
7. Bật bảng điều khiển nếu bạn muốn hiển thị nội dung lỗi thời/mâu thuẫn.

## Tài liệu liên quan

- [Tổng quan về Memory](/vi/concepts/memory)
- [CLI: memory](/vi/cli/memory)
- [CLI: wiki](/vi/cli/wiki)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
