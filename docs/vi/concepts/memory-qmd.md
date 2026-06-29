---
read_when:
    - Bạn muốn thiết lập QMD làm backend bộ nhớ của mình
    - Bạn muốn các tính năng bộ nhớ nâng cao như xếp hạng lại hoặc các đường dẫn được lập chỉ mục bổ sung
summary: Sidecar tìm kiếm ưu tiên cục bộ với BM25, vector, xếp hạng lại và mở rộng truy vấn
title: Bộ nhớ QMD
x-i18n:
    generated_at: "2026-06-28T22:33:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) là một sidecar tìm kiếm ưu tiên cục bộ chạy
cùng OpenClaw. Nó kết hợp BM25, tìm kiếm vector và reranking trong một binary
duy nhất, đồng thời có thể lập chỉ mục nội dung ngoài các tệp bộ nhớ trong workspace của bạn.

## Những gì nó bổ sung so với công cụ tích hợp sẵn

- **Reranking và mở rộng truy vấn** để cải thiện khả năng truy hồi.
- **Lập chỉ mục các thư mục bổ sung** -- tài liệu dự án, ghi chú nhóm, bất cứ thứ gì trên đĩa.
- **Lập chỉ mục bản ghi phiên** -- truy hồi các cuộc trò chuyện trước đó.
- **Hoàn toàn cục bộ** -- chạy với Plugin provider llama.cpp chính thức và
  tự động tải xuống các mô hình GGUF.
- **Tự động dự phòng** -- nếu QMD không khả dụng, OpenClaw tự động quay về
  công cụ tích hợp sẵn một cách liền mạch.

## Bắt đầu

### Điều kiện tiên quyết

- Cài đặt QMD: `npm install -g @tobilu/qmd` hoặc `bun install -g @tobilu/qmd`
- Bản dựng SQLite cho phép extension (`brew install sqlite` trên macOS).
- QMD phải nằm trong `PATH` của gateway.
- macOS và Linux hoạt động ngay mặc định. Windows được hỗ trợ tốt nhất qua WSL2.

### Bật

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw tạo một home QMD khép kín tại
`~/.openclaw/agents/<agentId>/qmd/` và tự động quản lý vòng đời sidecar
-- các collection, bản cập nhật và lượt chạy embedding đều được xử lý cho bạn.
Nó ưu tiên các dạng collection QMD và truy vấn MCP hiện tại, nhưng vẫn quay về
các cờ mẫu collection thay thế và tên công cụ MCP cũ hơn khi cần.
Việc đối chiếu khi khởi động cũng tạo lại các collection được quản lý đã cũ về
mẫu chuẩn của chúng khi một collection QMD cũ hơn có cùng tên vẫn còn tồn tại.

## Cách sidecar hoạt động

- OpenClaw tạo collection từ các tệp bộ nhớ workspace của bạn và mọi
  `memory.qmd.paths` đã cấu hình, sau đó chạy `qmd update` khi trình quản lý QMD
  được mở và định kỳ sau đó (mặc định mỗi 5 phút). Các lượt làm mới này
  chạy qua subprocess QMD, không phải một lượt quét hệ thống tệp trong tiến trình.
  Các chế độ ngữ nghĩa cũng chạy `qmd embed`.
- Collection workspace mặc định theo dõi `MEMORY.md` cùng cây `memory/`.
  `memory.md` viết thường không được lập chỉ mục như một tệp bộ nhớ gốc.
- Trình quét riêng của QMD bỏ qua các đường dẫn ẩn và những thư mục dependency/build
  phổ biến như `.git`, `.cache`, `node_modules`, `vendor`, `dist` và
  `build`. Khởi động Gateway không khởi tạo QMD theo mặc định, vì vậy cold boot
  tránh import runtime bộ nhớ hoặc tạo watcher dài hạn trước khi bộ nhớ được dùng lần đầu.
- Nếu bạn vẫn muốn QMD được khởi tạo khi gateway khởi động, hãy đặt
  `memory.qmd.update.startup` thành `idle` hoặc `immediate`. Với
  `memory.qmd.update.onBoot: true`, khởi động sẽ chạy lượt làm mới ban đầu. Với
  `onBoot: false`, khởi động bỏ qua lượt làm mới tức thời đó nhưng vẫn mở
  trình quản lý dài hạn khi các khoảng update hoặc embed được cấu hình, để QMD có thể
  sở hữu watcher và timer định kỳ của nó.
- Tìm kiếm sử dụng `searchMode` đã cấu hình (mặc định: `search`; cũng hỗ trợ
  `vsearch` và `query`). `search` chỉ dùng BM25, nên OpenClaw bỏ qua các probe
  sẵn sàng vector ngữ nghĩa và bảo trì embedding ở chế độ đó. Nếu một chế độ
  thất bại, OpenClaw thử lại bằng `qmd query`.
- Khi `searchMode` là `query`, đặt `memory.qmd.rerank` thành `false` để dùng
  đường dẫn truy vấn hybrid của QMD mà không có reranker. OpenClaw truyền
  `--no-rerank` vào đường dẫn CLI QMD trực tiếp và `rerank: false` vào công cụ
  truy vấn MCP của QMD. Tùy chọn này yêu cầu QMD 2.1 trở lên.
- Với các bản phát hành QMD quảng bá bộ lọc đa collection, OpenClaw nhóm
  các collection cùng nguồn vào một lượt gọi tìm kiếm QMD. Các bản phát hành QMD cũ hơn
  giữ đường dẫn dự phòng tương thích theo từng collection.
- Nếu QMD thất bại hoàn toàn, OpenClaw quay về công cụ SQLite tích hợp sẵn.
  Các lần thử lặp lại trong lượt chat sẽ tạm lùi sau lỗi mở để một binary
  bị thiếu hoặc dependency sidecar bị hỏng không tạo ra bão retry;
  `openclaw memory status` và các probe CLI một lần vẫn kiểm tra lại QMD trực tiếp.

<Info>
Lần tìm kiếm đầu tiên có thể chậm -- QMD tự động tải xuống các mô hình GGUF (~2 GB) để
reranking và mở rộng truy vấn trong lần chạy `qmd query` đầu tiên.
</Info>

## Hiệu năng tìm kiếm và khả năng tương thích

OpenClaw giữ đường dẫn tìm kiếm QMD tương thích với cả bản cài QMD hiện tại và cũ hơn.

Khi khởi động, OpenClaw kiểm tra văn bản trợ giúp QMD đã cài đặt một lần cho mỗi trình quản lý. Nếu
binary quảng bá hỗ trợ nhiều bộ lọc collection, OpenClaw tìm kiếm tất cả
collection cùng nguồn bằng một lệnh:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Điều này tránh khởi động một subprocess QMD cho từng collection bộ nhớ bền vững.
Các collection bản ghi phiên vẫn ở trong nhóm nguồn riêng, nên những tìm kiếm kết hợp
`memory` + `sessions` vẫn cung cấp đầu vào bộ đa dạng hóa kết quả từ cả hai
nguồn.

Các bản dựng QMD cũ hơn chỉ chấp nhận một bộ lọc collection. Khi OpenClaw phát hiện một
trong các bản dựng đó, nó giữ đường dẫn tương thích và tìm kiếm từng collection
riêng trước khi hợp nhất và loại bỏ trùng lặp kết quả.

Để kiểm tra hợp đồng đã cài đặt theo cách thủ công, hãy chạy:

```bash
qmd --help | grep -i collection
```

Trợ giúp QMD hiện tại nói rằng bộ lọc collection có thể nhắm tới một hoặc nhiều collection.
Trợ giúp cũ hơn thường mô tả một collection duy nhất.

## Ghi đè mô hình

Các biến môi trường mô hình QMD được truyền nguyên vẹn từ tiến trình gateway,
nên bạn có thể tinh chỉnh QMD trên toàn cục mà không cần thêm cấu hình OpenClaw mới:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Sau khi đổi mô hình embedding, chạy lại embedding để chỉ mục khớp với
không gian vector mới.

## Lập chỉ mục đường dẫn bổ sung

Trỏ QMD tới các thư mục bổ sung để có thể tìm kiếm chúng:

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
kết quả tìm kiếm. `memory_get` hiểu tiền tố này và đọc từ đúng
gốc collection.

## Lập chỉ mục bản ghi phiên

Bật lập chỉ mục phiên để truy hồi các cuộc trò chuyện trước đó. QMD cần cả nguồn phiên
`memorySearch` chung và trình xuất bản ghi QMD:

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

Bản ghi được xuất dưới dạng các lượt User/Assistant đã được làm sạch vào một collection QMD
chuyên dụng dưới `~/.openclaw/agents/<id>/qmd/sessions/`. Chỉ đặt
`memorySearch.experimental.sessionMemory` sẽ không xuất bản ghi vào QMD.

Các kết quả khớp phiên vẫn được lọc bởi
[`tools.sessions.visibility`](/vi/gateway/config-tools#toolssessions). Mức hiển thị mặc định
`tree` không phơi bày các phiên không liên quan của cùng agent. Nếu một
phiên được gateway điều phối cần có thể truy hồi từ một phiên DM riêng, hãy đặt
`tools.sessions.visibility: "agent"` một cách có chủ ý.

## Phạm vi tìm kiếm

Theo mặc định, kết quả tìm kiếm QMD được hiển thị trong các phiên trực tiếp và kênh
(không phải nhóm). Cấu hình `memory.qmd.scope` để thay đổi điều này:

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

Khi phạm vi từ chối một tìm kiếm, OpenClaw ghi log cảnh báo với kênh suy ra và
loại chat để kết quả rỗng dễ gỡ lỗi hơn.

## Trích dẫn

Khi `memory.citations` là `auto` hoặc `on`, các đoạn trích tìm kiếm bao gồm footer
`Source: <path#line>`. Đặt `memory.citations = "off"` để bỏ footer
trong khi vẫn truyền đường dẫn nội bộ cho agent.

## Khi nào nên dùng

Chọn QMD khi bạn cần:

- Reranking để có kết quả chất lượng cao hơn.
- Tìm kiếm tài liệu dự án hoặc ghi chú ngoài workspace.
- Truy hồi các cuộc trò chuyện phiên trước đây.
- Tìm kiếm hoàn toàn cục bộ, không cần khóa API.

Với các thiết lập đơn giản hơn, [công cụ tích hợp sẵn](/vi/concepts/memory-builtin) hoạt động tốt
mà không cần dependency bổ sung.

## Khắc phục sự cố

**Không tìm thấy QMD?** Đảm bảo binary nằm trong `PATH` của gateway. Nếu OpenClaw
chạy dưới dạng service, hãy tạo symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Nếu `qmd --version` hoạt động trong shell của bạn nhưng OpenClaw vẫn báo
`spawn qmd ENOENT`, tiến trình gateway có thể có `PATH` khác với
shell tương tác của bạn. Ghim binary một cách tường minh:

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

Dùng `command -v qmd` trong môi trường nơi QMD được cài đặt, rồi kiểm tra lại
bằng `openclaw memory status --deep`.

**Lần tìm kiếm đầu tiên rất chậm?** QMD tải xuống các mô hình GGUF trong lần dùng đầu tiên. Làm nóng trước
bằng `qmd query "test"` với cùng các thư mục XDG mà OpenClaw sử dụng.

**Nhiều subprocess QMD trong lúc tìm kiếm?** Cập nhật QMD nếu có thể. OpenClaw dùng
một tiến trình cho tìm kiếm đa collection cùng nguồn chỉ khi QMD đã cài đặt
quảng bá hỗ trợ nhiều bộ lọc `-c`; nếu không, nó giữ đường dẫn dự phòng cũ hơn
theo từng collection để đảm bảo đúng đắn.

**QMD chỉ BM25 vẫn cố dựng llama.cpp?** Đặt
`memory.qmd.searchMode = "search"`. OpenClaw xem chế độ đó là chỉ từ vựng,
không chạy các probe trạng thái vector QMD hoặc bảo trì embedding, và để
kiểm tra sẵn sàng ngữ nghĩa cho các thiết lập `vsearch` hoặc `query`.

**Tìm kiếm hết thời gian chờ?** Tăng `memory.qmd.limits.timeoutMs` (mặc định: 4000ms).
Đặt thành `120000` cho phần cứng chậm hơn.

**Kết quả rỗng trong chat nhóm?** Kiểm tra `memory.qmd.scope` -- mặc định chỉ
cho phép các phiên trực tiếp và kênh.

**Tìm kiếm bộ nhớ gốc đột nhiên quá rộng?** Khởi động lại gateway hoặc chờ
lượt đối chiếu khởi động tiếp theo. OpenClaw tạo lại các collection được quản lý đã cũ
về mẫu `MEMORY.md` và `memory/` chuẩn khi phát hiện xung đột cùng tên.

**Repo tạm hiển thị trong workspace gây `ENAMETOOLONG` hoặc làm hỏng lập chỉ mục?**
Việc duyệt QMD hiện tuân theo hành vi trình quét QMD bên dưới thay vì
quy tắc symlink tích hợp sẵn của OpenClaw. Giữ các checkout monorepo tạm thời trong
thư mục ẩn như `.tmp/` hoặc ngoài các gốc QMD được lập chỉ mục cho đến khi QMD cung cấp
duyệt an toàn theo chu kỳ hoặc kiểm soát loại trừ tường minh.

## Cấu hình

Để xem toàn bộ bề mặt cấu hình (`memory.qmd.*`), chế độ tìm kiếm, khoảng cập nhật,
quy tắc phạm vi và tất cả tùy chỉnh khác, hãy xem
[tham chiếu cấu hình Memory](/vi/reference/memory-config).

## Liên quan

- [Tổng quan Memory](/vi/concepts/memory)
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin)
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho)
