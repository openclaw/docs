---
read_when:
    - Bạn đang cấu hình Plugin memory-lancedb đi kèm
    - Bạn muốn bộ nhớ dài hạn dựa trên LanceDB với khả năng tự động truy hồi hoặc tự động ghi nhận
    - Bạn đang sử dụng các mô hình nhúng cục bộ tương thích với OpenAI, chẳng hạn như Ollama
sidebarTitle: Memory LanceDB
summary: Cấu hình Plugin bộ nhớ LanceDB đi kèm, bao gồm các vector nhúng cục bộ tương thích với Ollama
title: Bộ nhớ LanceDB
x-i18n:
    generated_at: "2026-04-29T23:00:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` là một Plugin bộ nhớ đi kèm, lưu trữ bộ nhớ dài hạn trong
LanceDB và dùng embeddings để truy hồi. Nó có thể tự động truy hồi các bộ nhớ
liên quan trước một lượt mô hình và ghi lại các sự kiện quan trọng sau một phản hồi.

Dùng Plugin này khi bạn muốn có một cơ sở dữ liệu vector cục bộ cho bộ nhớ, cần một
điểm cuối embedding tương thích OpenAI, hoặc muốn giữ cơ sở dữ liệu bộ nhớ bên ngoài
kho bộ nhớ tích hợp mặc định.

<Note>
`memory-lancedb` là một Plugin Active Memory. Bật nó bằng cách chọn slot bộ nhớ
với `plugins.slots.memory = "memory-lancedb"`. Các Plugin đồng hành như
`memory-wiki` có thể chạy cùng nó, nhưng chỉ một Plugin sở hữu slot bộ nhớ đang hoạt động.
</Note>

## Bắt đầu nhanh

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Khởi động lại Gateway sau khi thay đổi cấu hình Plugin:

```bash
openclaw gateway restart
```

Sau đó xác minh Plugin đã được tải:

```bash
openclaw plugins list
```

## Embeddings dựa trên nhà cung cấp

`memory-lancedb` có thể dùng cùng các adapter nhà cung cấp embedding bộ nhớ như
`memory-core`. Đặt `embedding.provider` và bỏ qua `embedding.apiKey` để dùng
hồ sơ xác thực đã cấu hình của nhà cung cấp, biến môi trường, hoặc
`models.providers.<provider>.apiKey`.

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
        },
      },
    },
  },
}
```

Đường dẫn này hoạt động với các hồ sơ xác thực nhà cung cấp có cung cấp thông tin xác thực embedding.
Ví dụ, GitHub Copilot có thể được dùng khi hồ sơ/gói Copilot hỗ trợ
embeddings:

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth (`openai-codex`) không phải là thông tin xác thực
embeddings của OpenAI Platform. Với embeddings OpenAI, hãy dùng hồ sơ xác thực khóa OpenAI API,
`OPENAI_API_KEY`, hoặc `models.providers.openai.apiKey`. Người dùng chỉ có OAuth có thể dùng
một nhà cung cấp có khả năng embedding khác như GitHub Copilot hoặc Ollama.

## Embeddings Ollama

Với embeddings Ollama, nên dùng nhà cung cấp embedding Ollama đi kèm. Nó dùng
điểm cuối Ollama `/api/embed` gốc và tuân theo cùng các quy tắc xác thực/base URL như
nhà cung cấp Ollama được ghi trong [Ollama](/vi/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Đặt `dimensions` cho các mô hình embedding không chuẩn. OpenClaw biết
số chiều của `text-embedding-3-small` và `text-embedding-3-large`; các mô hình tùy chỉnh
cần giá trị này trong cấu hình để LanceDB có thể tạo cột vector.

Với các mô hình embedding cục bộ nhỏ, hãy giảm `recallMaxChars` nếu bạn thấy lỗi
độ dài ngữ cảnh từ máy chủ cục bộ.

## Nhà cung cấp tương thích OpenAI

Một số nhà cung cấp embedding tương thích OpenAI từ chối tham số `encoding_format`,
trong khi các nhà cung cấp khác bỏ qua tham số này và luôn trả về vector `number[]`.
Do đó `memory-lancedb` bỏ qua `encoding_format` trong các yêu cầu embedding và
chấp nhận phản hồi dạng mảng số thực hoặc phản hồi float32 được mã hóa base64.

Nếu bạn có một điểm cuối embeddings tương thích OpenAI thô không có
adapter nhà cung cấp đi kèm, hãy bỏ qua `embedding.provider` (hoặc để là `openai`) và
đặt `embedding.apiKey` cùng `embedding.baseUrl`. Cách này giữ đường dẫn client
tương thích OpenAI trực tiếp.

Đặt `embedding.dimensions` cho các nhà cung cấp có số chiều mô hình không được tích hợp sẵn.
Ví dụ, ZhiPu `embedding-3` dùng `2048` chiều:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Giới hạn truy hồi và ghi lại

`memory-lancedb` có hai giới hạn văn bản riêng biệt:

| Cài đặt           | Mặc định | Phạm vi   | Áp dụng cho                                  |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | văn bản gửi đến API embedding để truy hồi     |
| `captureMaxChars` | `500`   | 100-10000 | độ dài tin nhắn assistant đủ điều kiện để ghi lại |

`recallMaxChars` kiểm soát tự động truy hồi, công cụ `memory_recall`, đường dẫn truy vấn
`memory_forget`, và `openclaw ltm search`. Tự động truy hồi ưu tiên
tin nhắn người dùng mới nhất trong lượt và chỉ dùng toàn bộ prompt làm dự phòng khi không có
tin nhắn người dùng. Cách này giữ metadata kênh và các khối prompt lớn
khỏi yêu cầu embedding.

`captureMaxChars` kiểm soát liệu phản hồi có đủ ngắn để được xem xét
ghi lại tự động hay không. Nó không giới hạn embeddings truy vấn truy hồi.

## Lệnh

Khi `memory-lancedb` là Plugin bộ nhớ đang hoạt động, nó đăng ký namespace CLI `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin cũng mở rộng `openclaw memory` bằng tiểu lệnh `query` không dùng vector
chạy trực tiếp trên bảng LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: danh sách cho phép các cột, phân tách bằng dấu phẩy (mặc định là `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: mệnh đề WHERE kiểu SQL; giới hạn ở 200 ký tự và chỉ cho phép chữ số/chữ cái, toán tử so sánh, dấu ngoặc kép/đơn, ngoặc đơn, và một tập nhỏ dấu câu an toàn.
- `--limit <n>`: số nguyên dương; mặc định là `10`.
- `--order-by <column>:<asc|desc>`: sắp xếp trong bộ nhớ được áp dụng sau bộ lọc; cột sắp xếp tự động được đưa vào phép chiếu.

Các agent cũng nhận các công cụ bộ nhớ LanceDB từ Plugin bộ nhớ đang hoạt động:

- `memory_recall` để truy hồi dựa trên LanceDB
- `memory_store` để lưu các sự kiện quan trọng, tùy chọn, quyết định, và thực thể
- `memory_forget` để xóa các bộ nhớ khớp

## Lưu trữ

Theo mặc định, dữ liệu LanceDB nằm trong `~/.openclaw/memory/lancedb`. Ghi đè
đường dẫn bằng `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` chấp nhận các cặp khóa/giá trị dạng chuỗi cho backend lưu trữ LanceDB và
hỗ trợ mở rộng `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Phụ thuộc runtime

`memory-lancedb` phụ thuộc vào gói gốc `@lancedb/lancedb`. Các bản cài đặt
OpenClaw đóng gói trước tiên thử phụ thuộc runtime đi kèm và có thể sửa
phụ thuộc runtime của Plugin trong trạng thái OpenClaw khi import đi kèm không
khả dụng.

Nếu một bản cài đặt cũ ghi log lỗi thiếu `dist/package.json` hoặc thiếu
`@lancedb/lancedb` trong lúc tải Plugin, hãy nâng cấp OpenClaw và khởi động lại
Gateway.

Nếu Plugin ghi log rằng LanceDB không khả dụng trên `darwin-x64`, hãy dùng backend
bộ nhớ mặc định trên máy đó, chuyển Gateway sang nền tảng được hỗ trợ, hoặc
tắt `memory-lancedb`.

## Khắc phục sự cố

### Độ dài đầu vào vượt quá độ dài ngữ cảnh

Điều này thường có nghĩa là mô hình embedding đã từ chối truy vấn truy hồi:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Đặt `recallMaxChars` thấp hơn, sau đó khởi động lại Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Với Ollama, cũng xác minh máy chủ embedding có thể truy cập từ máy chủ Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Mô hình embedding không được hỗ trợ

Nếu không có `dimensions`, chỉ các số chiều embedding OpenAI tích hợp sẵn mới được biết.
Với các mô hình embedding cục bộ hoặc tùy chỉnh, hãy đặt `embedding.dimensions` thành kích thước vector
do mô hình đó báo cáo.

### Plugin tải nhưng không có bộ nhớ nào xuất hiện

Kiểm tra rằng `plugins.slots.memory` trỏ đến `memory-lancedb`, sau đó chạy:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Nếu `autoCapture` bị tắt, Plugin sẽ truy hồi các bộ nhớ hiện có nhưng sẽ
không tự động lưu các bộ nhớ mới. Dùng công cụ `memory_store` hoặc bật
`autoCapture` nếu bạn muốn ghi lại tự động.

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Memory Wiki](/vi/plugins/memory-wiki)
- [Ollama](/vi/providers/ollama)
