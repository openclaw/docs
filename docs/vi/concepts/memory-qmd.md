---
read_when:
    - Bạn muốn thiết lập QMD làm backend bộ nhớ của mình
    - Bạn muốn các tính năng bộ nhớ nâng cao như xếp hạng lại hoặc bổ sung các đường dẫn được lập chỉ mục
summary: Sidecar tìm kiếm ưu tiên cục bộ với BM25, vectơ, xếp hạng lại và mở rộng truy vấn
title: Công cụ bộ nhớ QMD
x-i18n:
    generated_at: "2026-07-12T07:54:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) là một tiến trình phụ tìm kiếm ưu tiên cục bộ, chạy
song song với OpenClaw. Công cụ này kết hợp BM25, tìm kiếm vectơ và xếp hạng lại
trong một tệp nhị phân duy nhất, đồng thời có thể lập chỉ mục nội dung ngoài các
tệp bộ nhớ trong không gian làm việc của bạn.

## Những tính năng bổ sung so với công cụ tích hợp

- **Xếp hạng lại và mở rộng truy vấn** để cải thiện khả năng truy hồi.
- **Lập chỉ mục các thư mục bổ sung** - tài liệu dự án, ghi chú nhóm hoặc bất kỳ nội dung nào trên đĩa.
- **Lập chỉ mục bản chép lời phiên** - truy hồi các cuộc trò chuyện trước đó.
- **Hoàn toàn cục bộ** - chạy với Plugin trình cung cấp llama.cpp chính thức và
  tự động tải xuống các mô hình GGUF.
- **Tự động dự phòng** - nếu QMD không khả dụng, OpenClaw chuyển sang công cụ
  tích hợp một cách liền mạch.

## Bắt đầu

### Điều kiện tiên quyết

- Cài đặt QMD: `npm install -g @tobilu/qmd` hoặc `bun install -g @tobilu/qmd`
- Bản dựng SQLite cho phép phần mở rộng (`brew install sqlite` trên macOS).
- QMD phải nằm trong `PATH` của Gateway.
- macOS và Linux hoạt động ngay mà không cần cấu hình thêm. Windows được hỗ trợ tốt nhất qua WSL2.

### Bật

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw tạo một thư mục chính QMD độc lập tại
`~/.openclaw/agents/<agentId>/qmd/` và tự động quản lý vòng đời tiến trình phụ
— các bộ sưu tập, bản cập nhật và lượt tạo embedding đều được xử lý cho bạn.
OpenClaw ưu tiên các dạng bộ sưu tập và truy vấn MCP hiện tại của QMD, nhưng sẽ
chuyển sang các cờ mẫu bộ sưu tập thay thế và tên công cụ MCP cũ hơn khi cần.
Quá trình đối soát lúc khởi động cũng tạo lại các bộ sưu tập được quản lý đã lỗi
thời theo mẫu chuẩn khi vẫn còn một bộ sưu tập QMD cũ có cùng tên.

## Cách tiến trình phụ hoạt động

- OpenClaw tạo các bộ sưu tập từ những tệp bộ nhớ trong không gian làm việc và
  mọi `memory.qmd.paths` đã cấu hình, sau đó chạy `qmd update` khi trình quản lý
  QMD mở và định kỳ sau đó (`memory.qmd.update.interval`, mặc định là
  `5m`). Việc làm mới được thực hiện qua các tiến trình con QMD, không phải bằng
  cách quét hệ thống tệp trong tiến trình. Các chế độ tìm kiếm ngữ nghĩa cũng
  chạy `qmd embed` (`memory.qmd.update.embedInterval`, mặc định là `60m`).
- Bộ sưu tập không gian làm việc mặc định theo dõi `MEMORY.md` cùng toàn bộ cây
  `memory/`. Tệp `memory.md` viết thường không được lập chỉ mục như một tệp bộ
  nhớ gốc.
- Trình quét riêng của QMD bỏ qua các đường dẫn ẩn và những thư mục phụ thuộc/bản
  dựng phổ biến như `.git`, `.cache`, `node_modules`, `vendor`, `dist` và
  `build`. Theo mặc định, quá trình khởi động Gateway không khởi tạo QMD
  (`memory.qmd.update.startup` mặc định là `off`), vì vậy khởi động nguội tránh
  nhập môi trường thực thi bộ nhớ hoặc tạo trình theo dõi tồn tại lâu dài trước
  khi bộ nhớ được sử dụng lần đầu.
- Đặt `memory.qmd.update.startup` thành `idle` hoặc `immediate` để vẫn khởi tạo
  QMD khi Gateway khởi động. `memory.qmd.update.onBoot` mặc định là `true` và
  chạy lượt làm mới ban đầu lúc khởi động; đặt thành `false` để bỏ qua lượt làm
  mới tức thời đó (trình quản lý tồn tại lâu dài vẫn mở khi các khoảng thời gian
  cập nhật hoặc tạo embedding được cấu hình, vì vậy QMD vẫn quản lý trình theo
  dõi/bộ hẹn giờ định kỳ của mình).
- Các lượt tìm kiếm sử dụng `searchMode` đã cấu hình (mặc định: `search`; cũng hỗ
  trợ `vsearch` và `query`). `search` chỉ dùng BM25, vì vậy OpenClaw bỏ qua các
  phép kiểm tra mức sẵn sàng của vectơ ngữ nghĩa và việc duy trì embedding trong
  chế độ đó. Nếu một chế độ thất bại, OpenClaw thử lại bằng `qmd query`.
- Khi `searchMode` là `query`, đặt `memory.qmd.rerank` thành `false` để sử dụng
  đường dẫn truy vấn kết hợp của QMD mà không có trình xếp hạng lại (yêu cầu QMD
  2.1 trở lên). OpenClaw truyền `--no-rerank` cho đường dẫn CLI QMD trực tiếp và
  `rerank: false` cho công cụ truy vấn MCP của QMD.
- Với các bản phát hành QMD công bố hỗ trợ bộ lọc nhiều bộ sưu tập, OpenClaw nhóm
  các bộ sưu tập cùng nguồn vào một lần gọi tìm kiếm QMD. Các bản phát hành QMD
  cũ hơn vẫn dùng đường dự phòng tương thích theo từng bộ sưu tập.
- Nếu QMD hoàn toàn thất bại, OpenClaw chuyển sang công cụ SQLite tích hợp.
  Các lần thử lặp lại trong lượt trò chuyện sẽ tạm lùi lại sau khi mở thất bại,
  để tệp nhị phân bị thiếu hoặc phần phụ thuộc tiến trình phụ bị hỏng không tạo
  thành một cơn bão thử lại; `openclaw memory status` và các phép kiểm tra CLI
  dùng một lần vẫn trực tiếp kiểm tra lại QMD.

<Info>
Lần tìm kiếm đầu tiên có thể chậm — QMD tự động tải xuống các mô hình GGUF
(~2 GB) để xếp hạng lại và mở rộng truy vấn trong lần chạy `qmd query` đầu tiên.
</Info>

## Hiệu năng và khả năng tương thích của tìm kiếm

OpenClaw duy trì đường dẫn tìm kiếm QMD tương thích với cả bản cài đặt QMD hiện
tại và cũ hơn.

Khi khởi động, OpenClaw kiểm tra văn bản trợ giúp của QMD đã cài đặt một lần cho
mỗi trình quản lý. Nếu tệp nhị phân công bố hỗ trợ nhiều bộ lọc bộ sưu tập,
OpenClaw tìm kiếm tất cả các bộ sưu tập cùng nguồn bằng một lệnh:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Điều này tránh khởi chạy một tiến trình con QMD cho mỗi bộ sưu tập bộ nhớ bền
vững. Các bộ sưu tập bản chép lời phiên vẫn nằm trong nhóm nguồn riêng, vì vậy
các lượt tìm kiếm kết hợp `memory` + `sessions` vẫn cung cấp đầu vào từ cả hai
nguồn cho trình đa dạng hóa kết quả.

Các bản dựng QMD cũ hơn chỉ chấp nhận một bộ lọc bộ sưu tập. Khi OpenClaw phát
hiện một trong các bản dựng đó, OpenClaw giữ đường dẫn tương thích và tìm kiếm
riêng từng bộ sưu tập trước khi hợp nhất và loại bỏ kết quả trùng lặp.

Để kiểm tra thủ công hợp đồng đã cài đặt, hãy chạy:

```bash
qmd --help | grep -i collection
```

Phần trợ giúp QMD hiện tại đề cập đến việc nhắm mục tiêu một hoặc nhiều bộ sưu
tập. Phần trợ giúp cũ hơn thường mô tả một bộ sưu tập duy nhất.

## Ghi đè mô hình

Các biến môi trường mô hình QMD được chuyển nguyên vẹn từ tiến trình Gateway,
vì vậy bạn có thể tinh chỉnh QMD trên toàn cục mà không cần thêm cấu hình
OpenClaw mới:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Sau khi thay đổi mô hình embedding, hãy chạy lại việc tạo embedding để chỉ mục
khớp với không gian vectơ mới.

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

Các đoạn trích từ đường dẫn bổ sung xuất hiện dưới dạng
`qmd/<collection>/<relative-path>` trong kết quả tìm kiếm. `memory_get` hiểu
tiền tố này và đọc từ đúng thư mục gốc của bộ sưu tập.

## Lập chỉ mục bản chép lời phiên

Bật lập chỉ mục phiên để truy hồi các cuộc trò chuyện trước đó. QMD cần cả nguồn
phiên `memorySearch` tổng quát và trình xuất bản chép lời QMD:

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

Các bản chép lời được xuất dưới dạng các lượt Người dùng/Trợ lý đã làm sạch vào
một bộ sưu tập QMD chuyên dụng tại `~/.openclaw/agents/<id>/qmd/sessions/`.
Chỉ đặt `memorySearch.experimental.sessionMemory` sẽ không xuất bản chép lời
vào QMD.

Các kết quả khớp phiên vẫn được lọc theo
[`tools.sessions.visibility`](/vi/gateway/config-tools#toolssessions). Chế độ hiển
thị `tree` mặc định không để lộ các phiên không liên quan của cùng tác tử. Nếu
một phiên do Gateway điều phối cần có thể được truy hồi từ một phiên tin nhắn
trực tiếp riêng biệt, hãy chủ đích đặt `tools.sessions.visibility: "agent"`.

## Phạm vi tìm kiếm

Theo mặc định, kết quả tìm kiếm QMD chỉ xuất hiện trong các phiên trực tiếp
(không xuất hiện trong cuộc trò chuyện nhóm hoặc kênh). Cấu hình
`memory.qmd.scope` để thay đổi điều này:

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

Đoạn mã trên là quy tắc mặc định thực tế. Khi phạm vi từ chối một lượt tìm kiếm,
OpenClaw ghi cảnh báo kèm kênh và loại trò chuyện đã suy ra để dễ gỡ lỗi kết quả
trống hơn.

## Trích dẫn

Khi `memory.citations` là `auto` hoặc `on`, các đoạn trích tìm kiếm được nối thêm
phần chân trang `Source: <path>#L<line>` (hoặc `#L<start>-L<end>`). Trong chế độ
`auto`, phần chân trang chỉ được thêm cho các phiên trò chuyện trực tiếp. Đặt
`memory.citations = "off"` để bỏ phần chân trang nhưng vẫn truyền đường dẫn nội
bộ cho tác tử.

## Khi nào nên sử dụng

Chọn QMD khi bạn cần:

- Xếp hạng lại để có kết quả chất lượng cao hơn.
- Tìm kiếm tài liệu dự án hoặc ghi chú bên ngoài không gian làm việc.
- Truy hồi các cuộc trò chuyện trong phiên trước đây.
- Tìm kiếm hoàn toàn cục bộ mà không cần khóa API.

Đối với thiết lập đơn giản hơn, [công cụ tích hợp](/vi/concepts/memory-builtin) hoạt
động tốt mà không cần phần phụ thuộc bổ sung.

## Khắc phục sự cố

**Không tìm thấy QMD?** Hãy bảo đảm tệp nhị phân nằm trong `PATH` của Gateway.
Nếu OpenClaw chạy dưới dạng dịch vụ, hãy tạo liên kết tượng trưng:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Nếu `qmd --version` hoạt động trong shell nhưng OpenClaw vẫn báo
`spawn qmd ENOENT`, tiến trình Gateway có thể có `PATH` khác với shell tương
tác của bạn. Hãy chỉ định rõ tệp nhị phân:

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

**Lần tìm kiếm đầu tiên rất chậm?** QMD tải xuống các mô hình GGUF trong lần sử
dụng đầu tiên. Hãy làm nóng trước bằng `qmd query "test"` với cùng các thư mục
XDG mà OpenClaw sử dụng.

**Có nhiều tiến trình con QMD trong khi tìm kiếm?** Hãy cập nhật QMD nếu có thể.
OpenClaw chỉ sử dụng một tiến trình cho các lượt tìm kiếm nhiều bộ sưu tập cùng
nguồn khi QMD đã cài đặt công bố hỗ trợ nhiều bộ lọc `-c`; nếu không, OpenClaw
giữ đường dự phòng cũ hơn theo từng bộ sưu tập để bảo đảm tính chính xác.

**QMD chỉ dùng BM25 vẫn cố gắng dựng llama.cpp?** Đặt
`memory.qmd.searchMode = "search"`. OpenClaw coi chế độ đó là chỉ dùng từ vựng,
bỏ qua các phép kiểm tra trạng thái vectơ QMD và việc duy trì embedding, đồng
thời dành các phép kiểm tra mức sẵn sàng ngữ nghĩa cho thiết lập `vsearch` hoặc
`query`.

**Tìm kiếm hết thời gian chờ?** Tăng `memory.qmd.limits.timeoutMs` (mặc định:
4000ms). Đặt giá trị cao hơn, ví dụ `120000`, cho phần cứng chậm hơn.

**Kết quả trống trong cuộc trò chuyện nhóm hoặc kênh?** Đây là hành vi dự kiến
với `memory.qmd.scope` mặc định, vốn chỉ cho phép các phiên trực tiếp. Thêm quy
tắc `allow` cho loại trò chuyện `group` hoặc `channel` nếu bạn muốn kết quả QMD
xuất hiện ở đó.

**Tìm kiếm bộ nhớ gốc đột nhiên trở nên quá rộng?** Khởi động lại Gateway hoặc
chờ lần đối soát khởi động tiếp theo. OpenClaw tạo lại các bộ sưu tập được quản
lý đã lỗi thời theo mẫu chuẩn `MEMORY.md` và `memory/` khi phát hiện xung đột
trùng tên.

**Các kho lưu trữ tạm thời hiển thị trong không gian làm việc gây ra
`ENAMETOOLONG` hoặc làm hỏng quá trình lập chỉ mục?** Quá trình duyệt của QMD
tuân theo trình quét QMD nền tảng thay vì các quy tắc liên kết tượng trưng tích
hợp của OpenClaw. Hãy giữ các bản sao làm việc monorepo tạm thời trong thư mục
ẩn như `.tmp/` hoặc bên ngoài các thư mục gốc QMD được lập chỉ mục cho đến khi
QMD cung cấp khả năng duyệt an toàn trước chu trình hoặc các điều khiển loại trừ
tường minh.

## Cấu hình

Để xem toàn bộ bề mặt cấu hình (`memory.qmd.*`), các chế độ tìm kiếm, khoảng thời
gian cập nhật, quy tắc phạm vi và mọi tùy chọn khác, hãy xem
[tài liệu tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config).

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Công cụ bộ nhớ tích hợp](/vi/concepts/memory-builtin)
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho)
