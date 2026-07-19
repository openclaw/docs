---
read_when:
    - Bạn muốn thiết lập QMD làm backend bộ nhớ của mình
    - Bạn muốn các tính năng bộ nhớ nâng cao như xếp hạng lại hoặc bổ sung đường dẫn được lập chỉ mục
summary: Tiến trình phụ tìm kiếm ưu tiên cục bộ với BM25, vectơ, xếp hạng lại và mở rộng truy vấn
title: Công cụ bộ nhớ QMD
x-i18n:
    generated_at: "2026-07-19T05:41:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e41e8c0e3b0a0b365fdfc5f00d5f8dd81e90d4cf45c98ea203a64fc9b7d921f0
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) là một sidecar tìm kiếm ưu tiên cục bộ chạy
cùng với OpenClaw. Công cụ này kết hợp BM25, tìm kiếm vectơ và xếp hạng lại trong một
tệp nhị phân duy nhất, đồng thời có thể lập chỉ mục nội dung ngoài các tệp bộ nhớ trong không gian làm việc của bạn.

## Những tính năng bổ sung so với công cụ tích hợp sẵn

- **Xếp hạng lại và mở rộng truy vấn** để cải thiện khả năng tìm thấy kết quả.
- **Lập chỉ mục các thư mục bổ sung** - tài liệu dự án, ghi chú của nhóm, mọi nội dung trên ổ đĩa.
- **Lập chỉ mục bản chép lời phiên** - tìm lại các cuộc trò chuyện trước đó.
- **Hoàn toàn cục bộ** - chạy với plugin nhà cung cấp llama.cpp chính thức và
  tự động tải xuống các mô hình GGUF.
- **Tự động dự phòng** - nếu QMD không khả dụng, OpenClaw chuyển sang
  công cụ tích hợp sẵn một cách liền mạch.

## Bắt đầu

### Điều kiện tiên quyết

- Cài đặt QMD: `npm install -g @tobilu/qmd` hoặc `bun install -g @tobilu/qmd`
- Bản dựng SQLite cho phép phần mở rộng (`brew install sqlite` trên macOS).
- QMD phải nằm trong `PATH` của Gateway.
- macOS và Linux hoạt động ngay khi cài đặt. Windows được hỗ trợ tốt nhất qua WSL2.

### Bật

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw tạo một thư mục chính QMD độc lập tại
`~/.openclaw/agents/<agentId>/qmd/` và tự động quản lý vòng đời
của sidecar - các bộ sưu tập, bản cập nhật và lượt chạy nhúng đều được xử lý cho bạn.
OpenClaw ưu tiên các dạng truy vấn bộ sưu tập QMD và MCP hiện tại, nhưng chuyển sang
các cờ mẫu bộ sưu tập thay thế và tên công cụ MCP cũ hơn khi cần.
Quá trình đối soát khi khởi động cũng tạo lại các bộ sưu tập được quản lý đã lỗi thời về
mẫu chuẩn khi vẫn còn một bộ sưu tập QMD cũ có cùng tên.

## Cách sidecar hoạt động

- OpenClaw tạo các bộ sưu tập từ những tệp bộ nhớ trong không gian làm việc và mọi
  `memory.qmd.paths` đã cấu hình, sau đó chạy `qmd update` khi trình quản lý QMD
  mở và chạy lại định kỳ sau đó (`memory.qmd.update.interval`, mặc định
  `5m`). Các lần làm mới chạy qua tiến trình con QMD, không phải quy trình
  quét hệ thống tệp trong tiến trình. Các chế độ tìm kiếm ngữ nghĩa cũng chạy `qmd embed`
  (`memory.qmd.update.embedInterval`, mặc định `60m`).
- QMD tiếp tục sở hữu `index.sqlite`, cấu hình bộ sưu tập YAML và các mô hình
  đã tải xuống trong thư mục chính QMD riêng của từng tác tử; đây là các tạo tác của công cụ bên ngoài,
  không phải bảng trạng thái của OpenClaw. Hoạt động điều phối thuộc sở hữu của OpenClaw chỉ nằm trong SQLite:
  một hợp đồng thuê dùng chung giới hạn công việc nhúng giữa các tác tử, còn một hợp đồng thuê trong mỗi
  cơ sở dữ liệu tác tử tuần tự hóa các thao tác ghi bộ sưu tập, cập nhật và nhúng của tác tử đó.
  Runtime không còn tạo các sidecar tệp khóa QMD. `openclaw doctor --fix`
  chỉ xóa các sidecar đã ngừng sử dụng sau khi chứng minh chủ sở hữu tiến trình cũ của chúng đã lỗi thời.
  Việc nâng cấp là một lần chuyển đổi dứt điểm: dừng và khởi động lại mọi tiến trình OpenClaw
  dùng chung thư mục trạng thái trước khi sử dụng phiên bản mới. Không hỗ trợ các trình ghi QMD
  cũ/mới chạy lẫn nhau; runtime chủ ý không khóa kép các sidecar
  đã ngừng sử dụng.
- Bộ sưu tập không gian làm việc mặc định theo dõi `MEMORY.md` cùng cây `memory/`.
  `memory.md` viết thường không được lập chỉ mục dưới dạng tệp bộ nhớ gốc.
- Trình quét riêng của QMD bỏ qua các đường dẫn ẩn và những thư mục phụ thuộc/bản dựng
  phổ biến như `.git`, `.cache`, `node_modules`, `vendor`, `dist` và
  `build`. Theo mặc định, quá trình khởi động Gateway không khởi tạo QMD
  (`memory.qmd.update.startup` mặc định là `off`), vì vậy quá trình khởi động nguội tránh
  nhập runtime bộ nhớ hoặc tạo trình theo dõi tồn tại lâu dài trước khi
  bộ nhớ được sử dụng lần đầu.
- Đặt `memory.qmd.update.startup` thành `idle` hoặc `immediate` để vẫn khởi tạo QMD
  khi Gateway khởi động. `memory.qmd.update.onBoot` mặc định là `true` và
  chạy lần làm mới ban đầu khi khởi động; đặt thành `false` để bỏ qua
  lần làm mới tức thì đó (trình quản lý tồn tại lâu dài vẫn mở khi đã cấu hình
  khoảng thời gian cập nhật hoặc nhúng, vì vậy QMD tiếp tục sở hữu trình theo dõi/bộ hẹn giờ định kỳ của mình).
- Các lượt tìm kiếm sử dụng `searchMode` đã cấu hình (mặc định: `search`; cũng hỗ trợ
  `vsearch` và `query`). `search` chỉ dùng BM25, vì vậy OpenClaw bỏ qua các bước
  kiểm tra mức độ sẵn sàng của vectơ ngữ nghĩa và bảo trì dữ liệu nhúng trong chế độ đó. Nếu một chế độ
  thất bại, OpenClaw thử lại bằng `qmd query`.
- Khi `searchMode` là `query`, hãy đặt `memory.qmd.rerank` thành `false` để sử dụng
  đường dẫn truy vấn kết hợp của QMD mà không dùng trình xếp hạng lại (yêu cầu QMD 2.1 trở lên).
  OpenClaw truyền `--no-rerank` đến đường dẫn CLI trực tiếp của QMD và
  `rerank: false` đến công cụ truy vấn MCP của QMD.
- Với các bản phát hành QMD công bố hỗ trợ bộ lọc nhiều bộ sưu tập, OpenClaw nhóm
  các bộ sưu tập cùng nguồn vào một lần gọi tìm kiếm QMD. Các bản phát hành QMD cũ hơn
  vẫn dùng phương án dự phòng tương thích theo từng bộ sưu tập.
- Nếu QMD thất bại hoàn toàn, OpenClaw chuyển sang công cụ SQLite tích hợp sẵn.
  Các lần thử lặp lại trong lượt trò chuyện sẽ tạm lùi lại sau khi mở thất bại để
  tệp nhị phân bị thiếu hoặc phụ thuộc sidecar bị hỏng không tạo ra một cơn bão thử lại;
  `openclaw memory status` và các bước kiểm tra CLI một lần vẫn kiểm tra lại QMD
  trực tiếp.

<Info>
Lần tìm kiếm đầu tiên có thể chậm - QMD tự động tải xuống các mô hình GGUF (~2 GB) để
xếp hạng lại và mở rộng truy vấn trong lần chạy `qmd query` đầu tiên.
</Info>

## Hiệu năng và khả năng tương thích của tìm kiếm

OpenClaw duy trì đường dẫn tìm kiếm QMD tương thích với cả các bản cài đặt QMD
hiện tại và cũ hơn.

Khi khởi động, OpenClaw kiểm tra văn bản trợ giúp của QMD đã cài đặt một lần cho mỗi trình quản lý. Nếu
tệp nhị phân công bố hỗ trợ nhiều bộ lọc bộ sưu tập, OpenClaw
tìm kiếm tất cả bộ sưu tập cùng nguồn bằng một lệnh:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Cách này tránh khởi chạy một tiến trình con QMD cho mỗi bộ sưu tập bộ nhớ bền vững.
Các bộ sưu tập bản chép lời phiên vẫn nằm trong nhóm nguồn riêng, vì vậy các lượt tìm kiếm
kết hợp `memory` + `sessions` vẫn cung cấp dữ liệu đầu vào từ cả hai nguồn
cho bộ đa dạng hóa kết quả.

Các bản dựng QMD cũ hơn chỉ chấp nhận một bộ lọc bộ sưu tập. Khi OpenClaw phát hiện
một trong những bản dựng đó, OpenClaw giữ lại đường dẫn tương thích và tìm kiếm riêng từng bộ sưu tập
trước khi hợp nhất và loại bỏ kết quả trùng lặp.

Để kiểm tra thủ công hợp đồng đã cài đặt, hãy chạy:

```bash
qmd --help | grep -i collection
```

Trợ giúp QMD hiện tại đề cập đến việc nhắm đến một hoặc nhiều bộ sưu tập. Trợ giúp cũ hơn
thường mô tả một bộ sưu tập duy nhất.

## Ghi đè mô hình

Các biến môi trường mô hình QMD được truyền nguyên trạng từ tiến trình Gateway,
vì vậy bạn có thể điều chỉnh QMD trên toàn cục mà không cần thêm cấu hình OpenClaw mới:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Sau khi thay đổi mô hình nhúng, hãy chạy lại quá trình nhúng để chỉ mục khớp với
không gian vectơ mới.

## Lập chỉ mục các đường dẫn bổ sung

Trỏ QMD đến các thư mục bổ sung để có thể tìm kiếm chúng:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Các đoạn trích từ đường dẫn bổ sung xuất hiện dưới dạng `qmd/<collection>/<relative-path>` trong
kết quả tìm kiếm. `memory_get` hiểu tiền tố này và đọc từ thư mục gốc
chính xác của bộ sưu tập.

## Lập chỉ mục bản chép lời phiên

Bật tính năng lập chỉ mục phiên để nhớ lại các cuộc trò chuyện trước đó. QMD cần cả
nguồn phiên `memorySearch` chung và trình xuất bản chép lời QMD:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Các bản chép lời được xuất dưới dạng các lượt Người dùng/Trợ lý đã được làm sạch vào một
bộ sưu tập QMD chuyên biệt trong `~/.openclaw/agents/<id>/qmd/sessions/`. Chỉ đặt
`memorySearch.experimental.sessionMemory` sẽ không xuất bản chép lời vào
QMD.

Các kết quả khớp từ phiên vẫn được lọc bởi
[`tools.sessions.visibility`](/vi/gateway/config-tools#toolssessions). Khả năng hiển thị
`tree` mặc định bao gồm phiên hiện tại, các phiên do phiên đó tạo ra
và các phiên nhóm của cùng agent được theo dõi thông qua nhận biết nhóm xung quanh. Với
`session.dmScope: "main"`, người dùng trong thiết lập DM nhiều người dùng chia sẻ phiên
chính và có thể nhớ lại nội dung từ các nhóm mà phiên đó theo dõi. Sử dụng
`dmScope` riêng cho từng peer để cô lập DM, hoặc đặt khả năng hiển thị thành
`"self"` để không đọc các phiên được theo dõi xung quanh. Các phiên cùng agent
không liên quan khác vẫn yêu cầu khả năng hiển thị `"agent"`.

## Phạm vi tìm kiếm

Theo mặc định, kết quả tìm kiếm QMD chỉ hiển thị trong các phiên trực tiếp (không
hiển thị trong cuộc trò chuyện nhóm hoặc kênh). Cấu hình `memory.qmd.scope` để thay đổi điều này:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Đoạn mã trên chính là quy tắc mặc định thực tế. Khi phạm vi từ chối một tìm kiếm,
OpenClaw ghi nhật ký cảnh báo kèm kênh và loại trò chuyện đã suy ra để dễ gỡ lỗi
kết quả trống hơn.

## Trích dẫn

Khi `memory.citations` là `auto` hoặc `on`, các đoạn trích tìm kiếm
được nối thêm phần chân trang `Source: <path>#L<line>` (hoặc `#L<start>-L<end>`). Trong chế độ
`auto`, phần chân trang chỉ được thêm cho các phiên trò chuyện trực tiếp. Đặt
`memory.citations = "off"` để bỏ phần chân trang trong khi vẫn truyền đường dẫn nội bộ
cho agent.

## Khi nào nên dùng

Chọn QMD khi bạn cần:

- Xếp hạng lại để có kết quả chất lượng cao hơn.
- Tìm kiếm tài liệu dự án hoặc ghi chú bên ngoài workspace.
- Nhớ lại các cuộc trò chuyện trong phiên trước đây.
- Tìm kiếm hoàn toàn cục bộ mà không cần khóa API.

Đối với các thiết lập đơn giản hơn, [công cụ tích hợp sẵn](/vi/concepts/memory-builtin) hoạt động tốt
mà không cần phần phụ thuộc bổ sung.

## Khắc phục sự cố

**Không tìm thấy QMD?** Đảm bảo tệp nhị phân nằm trong `PATH` của Gateway. Nếu OpenClaw
chạy dưới dạng dịch vụ, hãy tạo liên kết tượng trưng:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Nếu `qmd --version` hoạt động trong shell của bạn nhưng OpenClaw vẫn báo
`spawn qmd ENOENT`, tiến trình Gateway có thể có `PATH` khác với
shell tương tác của bạn. Chỉ định rõ tệp nhị phân:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Sử dụng `command -v qmd` trong môi trường đã cài đặt QMD, sau đó kiểm tra lại
bằng `openclaw memory status --deep`.

**Lần tìm kiếm đầu tiên rất chậm?** QMD tải xuống các mô hình GGUF trong lần sử dụng đầu tiên. Hãy làm nóng trước
bằng `qmd query "test"`, sử dụng cùng các thư mục XDG mà OpenClaw sử dụng.

**Có nhiều tiến trình con QMD trong khi tìm kiếm?** Hãy cập nhật QMD nếu có thể. OpenClaw
chỉ sử dụng một tiến trình cho các tìm kiếm nhiều bộ sưu tập có cùng nguồn khi
QMD đã cài đặt công bố hỗ trợ nhiều bộ lọc `-c`; nếu không,
hệ thống giữ cơ chế dự phòng cũ, mỗi bộ sưu tập một tiến trình, để đảm bảo tính chính xác.

**QMD chỉ dùng BM25 vẫn cố gắng xây dựng llama.cpp?** Đặt
`memory.qmd.searchMode = "search"`. OpenClaw coi chế độ đó là
chỉ dùng tìm kiếm từ vựng, bỏ qua các phép thăm dò trạng thái vector QMD và việc bảo trì embedding,
đồng thời để các bước kiểm tra mức độ sẵn sàng ngữ nghĩa cho thiết lập `vsearch` hoặc `query`.

**Tìm kiếm hết thời gian chờ?** Tăng `memory.qmd.limits.timeoutMs` (mặc định: 4000ms).
Đặt giá trị cao hơn, ví dụ `120000`, cho phần cứng chậm hơn. Giới hạn này áp dụng cho
các lệnh tìm kiếm riêng của QMD trong những lần gọi `memory_search` của agent; công việc thiết lập,
đồng bộ, dự phòng tích hợp sẵn và kho dữ liệu bổ sung vẫn giữ thời hạn ngắn hơn riêng.

**Kết quả trống trong cuộc trò chuyện nhóm hoặc kênh?** Đây là hành vi dự kiến với
`memory.qmd.scope` mặc định, vốn chỉ cho phép các phiên trực tiếp. Thêm quy tắc
`allow` cho loại trò chuyện `group` hoặc `channel` nếu bạn muốn có kết quả QMD
ở đó.

**Tìm kiếm bộ nhớ gốc đột nhiên trở nên quá rộng?** Khởi động lại Gateway hoặc đợi
đợt đối chiếu tiếp theo khi khởi động. OpenClaw tạo lại các bộ sưu tập được quản lý
đã lỗi thời theo các mẫu `MEMORY.md` và `memory/` chuẩn khi
phát hiện xung đột trùng tên.

**Các kho lưu trữ tạm thời hiển thị trong không gian làm việc gây ra `ENAMETOOLONG` hoặc làm hỏng việc lập chỉ mục?**
Quá trình duyệt của QMD tuân theo trình quét QMD nền tảng thay vì các quy tắc
liên kết tượng trưng tích hợp của OpenClaw. Hãy giữ các bản checkout monorepo tạm thời trong các
thư mục ẩn như `.tmp/` hoặc bên ngoài các thư mục gốc QMD được lập chỉ mục cho đến khi QMD cung cấp
cơ chế duyệt an toàn trước chu trình hoặc các tùy chọn kiểm soát loại trừ rõ ràng.

## Cấu hình

Để biết toàn bộ phạm vi cấu hình (`memory.qmd.*`), các chế độ tìm kiếm, khoảng thời gian cập nhật,
quy tắc phạm vi và tất cả tùy chọn khác, hãy xem
[Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config).

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Công cụ bộ nhớ tích hợp](/vi/concepts/memory-builtin)
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho)
