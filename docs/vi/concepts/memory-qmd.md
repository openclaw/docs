---
read_when:
    - Bạn muốn thiết lập QMD làm backend bộ nhớ của mình
    - Bạn muốn các tính năng bộ nhớ nâng cao như xếp hạng lại hoặc các đường dẫn được lập chỉ mục bổ sung
summary: Dịch vụ phụ trợ tìm kiếm ưu tiên cục bộ với BM25, vector, xếp hạng lại và mở rộng truy vấn
title: Công cụ bộ nhớ QMD
x-i18n:
    generated_at: "2026-04-29T22:37:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) là một thành phần đi kèm tìm kiếm ưu tiên cục bộ chạy
cùng OpenClaw. Nó kết hợp BM25, tìm kiếm vector và sắp xếp lại thứ hạng trong một
tệp nhị phân duy nhất, đồng thời có thể lập chỉ mục nội dung ngoài các tệp bộ nhớ
không gian làm việc của bạn.

## Những gì nó bổ sung so với công cụ tích hợp sẵn

- **Sắp xếp lại thứ hạng và mở rộng truy vấn** để cải thiện khả năng truy hồi.
- **Lập chỉ mục các thư mục bổ sung** -- tài liệu dự án, ghi chú nhóm, bất kỳ thứ gì trên đĩa.
- **Lập chỉ mục bản ghi phiên** -- truy hồi các cuộc trò chuyện trước đó.
- **Hoàn toàn cục bộ** -- chạy với gói runtime node-llama-cpp tùy chọn và
  tự động tải xuống các mô hình GGUF.
- **Tự động dự phòng** -- nếu QMD không khả dụng, OpenClaw tự động chuyển về
  công cụ tích hợp sẵn một cách liền mạch.

## Bắt đầu

### Điều kiện tiên quyết

- Cài đặt QMD: `npm install -g @tobilu/qmd` hoặc `bun install -g @tobilu/qmd`
- Bản dựng SQLite cho phép tiện ích mở rộng (`brew install sqlite` trên macOS).
- QMD phải nằm trong `PATH` của gateway.
- macOS và Linux hoạt động ngay không cần cấu hình thêm. Windows được hỗ trợ tốt nhất qua WSL2.

### Bật

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw tạo một QMD home tự chứa trong
`~/.openclaw/agents/<agentId>/qmd/` và tự động quản lý vòng đời của thành phần đi kèm
-- collections, cập nhật và các lượt chạy embedding đều được xử lý cho bạn.
Nó ưu tiên các dạng collection và truy vấn MCP hiện tại của QMD, nhưng vẫn chuyển về
các cờ mẫu collection thay thế và tên công cụ MCP cũ hơn khi cần.
Quá trình đối soát lúc khởi động cũng tạo lại các collection được quản lý đã cũ về
các mẫu chuẩn của chúng khi một collection QMD cũ hơn có cùng tên vẫn còn
tồn tại.

## Cách thành phần đi kèm hoạt động

- OpenClaw tạo các collection từ các tệp bộ nhớ không gian làm việc của bạn và mọi
  `memory.qmd.paths` đã cấu hình, sau đó chạy `qmd update` khi trình quản lý QMD
  được mở và định kỳ sau đó (mặc định mỗi 5 phút). Các lần làm mới này
  chạy qua các tiến trình con QMD, không phải một lượt quét hệ thống tệp trong tiến trình. Các chế độ
  ngữ nghĩa cũng chạy `qmd embed`.
- Collection không gian làm việc mặc định theo dõi `MEMORY.md` cùng cây `memory/`.
  `memory.md` viết thường không được lập chỉ mục như một tệp bộ nhớ gốc.
- Trình quét riêng của QMD bỏ qua các đường dẫn ẩn và các thư mục phụ thuộc/bản dựng
  phổ biến như `.git`, `.cache`, `node_modules`, `vendor`, `dist` và
  `build`. Theo mặc định, khởi động Gateway không khởi tạo QMD, nên khởi động nguội
  tránh nhập runtime bộ nhớ hoặc tạo watcher chạy dài trước khi
  bộ nhớ được dùng lần đầu.
- Nếu bạn vẫn muốn làm mới khi Gateway khởi động, hãy đặt
  `memory.qmd.update.startup` thành `idle` hoặc `immediate`. Làm mới lúc khởi động dạng opt-in
  dùng đường dẫn tiến trình con QMD một lần thay vì tạo watcher trong tiến trình
  chạy dài đầy đủ.
- Tìm kiếm dùng `searchMode` đã cấu hình (mặc định: `search`; cũng hỗ trợ
  `vsearch` và `query`). `search` chỉ dùng BM25, vì vậy OpenClaw bỏ qua các
  phép thăm dò mức sẵn sàng của vector ngữ nghĩa và bảo trì embedding trong chế độ đó. Nếu một chế độ
  thất bại, OpenClaw thử lại bằng `qmd query`.
- Với các bản phát hành QMD quảng bá bộ lọc đa collection, OpenClaw nhóm
  các collection cùng nguồn vào một lệnh gọi tìm kiếm QMD. Các bản phát hành QMD cũ hơn
  giữ cơ chế dự phòng tương thích theo từng collection.
- Nếu QMD thất bại hoàn toàn, OpenClaw chuyển về công cụ SQLite tích hợp sẵn.
  Các lần thử lặp lại trong lượt chat sẽ tạm lùi ngắn sau khi mở thất bại để một
  tệp nhị phân bị thiếu hoặc phụ thuộc sidecar bị hỏng không tạo ra bão thử lại;
  `openclaw memory status` và các phép thăm dò CLI một lần vẫn kiểm tra lại QMD trực tiếp.

<Info>
Lần tìm kiếm đầu tiên có thể chậm -- QMD tự động tải xuống các mô hình GGUF (~2 GB) cho
sắp xếp lại thứ hạng và mở rộng truy vấn trong lần chạy `qmd query` đầu tiên.
</Info>

## Hiệu năng tìm kiếm và khả năng tương thích

OpenClaw giữ đường dẫn tìm kiếm QMD tương thích với cả các bản cài đặt QMD hiện tại và cũ hơn.

Khi khởi động, OpenClaw kiểm tra văn bản trợ giúp QMD đã cài đặt một lần cho mỗi trình quản lý. Nếu
tệp nhị phân quảng bá hỗ trợ nhiều bộ lọc collection, OpenClaw tìm kiếm tất cả
collection cùng nguồn bằng một lệnh:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Điều này tránh khởi động một tiến trình con QMD cho mỗi collection bộ nhớ bền vững.
Các collection bản ghi phiên nằm trong nhóm nguồn riêng, nên các lượt tìm kiếm kết hợp
`memory` + `sessions` vẫn cung cấp đầu vào bộ đa dạng hóa kết quả từ cả hai
nguồn.

Các bản dựng QMD cũ hơn chỉ chấp nhận một bộ lọc collection. Khi OpenClaw phát hiện một
trong các bản dựng đó, nó giữ đường dẫn tương thích và tìm kiếm từng collection
riêng trước khi hợp nhất và loại bỏ kết quả trùng lặp.

Để kiểm tra thủ công hợp đồng đã cài đặt, chạy:

```bash
qmd --help | grep -i collection
```

Trợ giúp QMD hiện tại nói rằng bộ lọc collection có thể nhắm tới một hoặc nhiều collection.
Trợ giúp cũ hơn thường mô tả một collection duy nhất.

## Ghi đè mô hình

Các biến môi trường mô hình QMD được truyền nguyên trạng từ tiến trình gateway,
nên bạn có thể tinh chỉnh QMD toàn cục mà không cần thêm cấu hình OpenClaw mới:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Sau khi thay đổi mô hình embedding, hãy chạy lại embeddings để chỉ mục khớp với
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

Bật lập chỉ mục phiên để truy hồi các cuộc trò chuyện trước đó:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Bản ghi được xuất dưới dạng các lượt User/Assistant đã được làm sạch vào một collection QMD
riêng trong `~/.openclaw/agents/<id>/qmd/sessions/`.

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

Khi phạm vi từ chối một lượt tìm kiếm, OpenClaw ghi cảnh báo với kênh và
loại chat suy ra để dễ gỡ lỗi kết quả rỗng hơn.

## Trích dẫn

Khi `memory.citations` là `auto` hoặc `on`, các đoạn trích tìm kiếm bao gồm một
chân trang `Source: <path#line>`. Đặt `memory.citations = "off"` để bỏ chân trang
trong khi vẫn truyền đường dẫn cho agent nội bộ.

## Khi nào nên dùng

Chọn QMD khi bạn cần:

- Sắp xếp lại thứ hạng để có kết quả chất lượng cao hơn.
- Tìm kiếm tài liệu dự án hoặc ghi chú ngoài không gian làm việc.
- Truy hồi các cuộc trò chuyện phiên trước đây.
- Tìm kiếm hoàn toàn cục bộ mà không cần khóa API.

Với các thiết lập đơn giản hơn, [công cụ tích hợp sẵn](/vi/concepts/memory-builtin) hoạt động tốt
mà không cần phụ thuộc bổ sung.

## Khắc phục sự cố

**Không tìm thấy QMD?** Đảm bảo tệp nhị phân nằm trong `PATH` của gateway. Nếu OpenClaw
chạy dưới dạng dịch vụ, hãy tạo symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Nếu `qmd --version` hoạt động trong shell của bạn nhưng OpenClaw vẫn báo
`spawn qmd ENOENT`, tiến trình gateway có thể có `PATH` khác với
shell tương tác của bạn. Ghim tệp nhị phân một cách rõ ràng:

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

Dùng `command -v qmd` trong môi trường nơi QMD được cài đặt, sau đó kiểm tra lại
bằng `openclaw memory status --deep`.

**Lần tìm kiếm đầu tiên rất chậm?** QMD tải xuống các mô hình GGUF trong lần dùng đầu tiên. Làm nóng trước
bằng `qmd query "test"` với cùng các thư mục XDG mà OpenClaw dùng.

**Có nhiều tiến trình con QMD trong lúc tìm kiếm?** Cập nhật QMD nếu có thể. OpenClaw dùng
một tiến trình cho tìm kiếm đa collection cùng nguồn chỉ khi QMD đã cài đặt
quảng bá hỗ trợ nhiều bộ lọc `-c`; nếu không, nó giữ cơ chế dự phòng
theo từng collection cũ hơn để đảm bảo đúng đắn.

**QMD chỉ BM25 vẫn cố gắng dựng llama.cpp?** Đặt
`memory.qmd.searchMode = "search"`. OpenClaw coi chế độ đó là chỉ từ vựng,
không chạy thăm dò trạng thái vector QMD hoặc bảo trì embedding, và để
kiểm tra mức sẵn sàng ngữ nghĩa cho các thiết lập `vsearch` hoặc `query`.

**Tìm kiếm hết thời gian chờ?** Tăng `memory.qmd.limits.timeoutMs` (mặc định: 4000ms).
Đặt thành `120000` cho phần cứng chậm hơn.

**Kết quả rỗng trong chat nhóm?** Kiểm tra `memory.qmd.scope` -- mặc định chỉ
cho phép các phiên trực tiếp và kênh.

**Tìm kiếm bộ nhớ gốc đột nhiên quá rộng?** Khởi động lại gateway hoặc chờ
lần đối soát khởi động tiếp theo. OpenClaw tạo lại các collection được quản lý đã cũ
về các mẫu `MEMORY.md` và `memory/` chuẩn khi phát hiện xung đột
cùng tên.

**Các repo tạm hiển thị trong không gian làm việc gây `ENAMETOOLONG` hoặc lập chỉ mục bị hỏng?**
Hiện tại quá trình duyệt của QMD đi theo hành vi trình quét QMD bên dưới thay vì
các quy tắc symlink tích hợp sẵn của OpenClaw. Giữ các checkout monorepo tạm thời trong
các thư mục ẩn như `.tmp/` hoặc bên ngoài các gốc QMD được lập chỉ mục cho đến khi QMD cung cấp
duyệt an toàn với chu kỳ hoặc điều khiển loại trừ rõ ràng.

## Cấu hình

Để xem toàn bộ bề mặt cấu hình (`memory.qmd.*`), các chế độ tìm kiếm, khoảng thời gian cập nhật,
quy tắc phạm vi và mọi nút điều chỉnh khác, xem
[tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config).

## Liên quan

- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin)
- [Bộ nhớ Honcho](/vi/concepts/memory-honcho)
