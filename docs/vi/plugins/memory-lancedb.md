---
read_when:
    - Bạn đang cấu hình plugin memory-lancedb
    - Bạn muốn bộ nhớ dài hạn được hỗ trợ bởi LanceDB với tự động truy xuất hoặc tự động ghi nhớ
    - Bạn đang sử dụng các embedding tương thích với OpenAI chạy cục bộ như Ollama
sidebarTitle: Memory LanceDB
summary: Cấu hình plugin bộ nhớ LanceDB bên ngoài chính thức, bao gồm embedding cục bộ tương thích với Ollama
title: Bộ nhớ LanceDB
x-i18n:
    generated_at: "2026-06-27T17:47:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` là Plugin bộ nhớ ngoài chính thức lưu trữ bộ nhớ dài hạn trong
LanceDB và dùng embeddings để truy hồi. Nó có thể tự động truy hồi các ký ức liên quan
trước một lượt mô hình và ghi lại các sự kiện quan trọng sau một phản hồi.

Dùng nó khi bạn muốn có cơ sở dữ liệu vector cục bộ cho bộ nhớ, cần một endpoint
embedding tương thích OpenAI, hoặc muốn giữ cơ sở dữ liệu bộ nhớ bên ngoài
kho bộ nhớ tích hợp mặc định.

## Cài đặt

Cài đặt `memory-lancedb` trước khi đặt `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin được phát hành lên npm và không được đóng gói vào image runtime của OpenClaw.
Trình cài đặt ghi mục Plugin và chuyển slot bộ nhớ khi chưa có Plugin nào khác
sở hữu nó.

<Note>
`memory-lancedb` là một Plugin Active Memory. Bật nó bằng cách chọn slot bộ nhớ
với `plugins.slots.memory = "memory-lancedb"`. Các Plugin đồng hành như
`memory-wiki` có thể chạy cùng nó, nhưng chỉ một Plugin sở hữu slot Active Memory.
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

## Embeddings dựa trên provider

`memory-lancedb` có thể dùng cùng các adapter provider embedding bộ nhớ như
`memory-core`. Đặt `embedding.provider` và bỏ qua `embedding.apiKey` để dùng
hồ sơ xác thực đã cấu hình của provider, biến môi trường, hoặc
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

Đường dẫn này hoạt động với các hồ sơ xác thực provider có cung cấp thông tin xác thực embedding.
Ví dụ, có thể dùng GitHub Copilot khi hồ sơ/gói Copilot hỗ trợ
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

OpenAI Codex / ChatGPT OAuth không phải là thông tin xác thực embeddings của OpenAI Platform.
Đối với OpenAI embeddings, hãy dùng hồ sơ xác thực khóa API OpenAI,
`OPENAI_API_KEY`, hoặc `models.providers.openai.apiKey`. Người dùng chỉ có OAuth có thể dùng
provider khác hỗ trợ embedding, chẳng hạn GitHub Copilot hoặc Ollama.

## Ollama embeddings

Đối với Ollama embeddings, ưu tiên provider embedding Ollama đi kèm. Nó dùng
endpoint Ollama `/api/embed` gốc và tuân theo cùng quy tắc xác thực/base URL như
provider Ollama được ghi trong [Ollama](/vi/providers/ollama).

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

Đặt `dimensions` cho các mô hình embedding không tiêu chuẩn. OpenClaw biết
số chiều của `text-embedding-3-small` và `text-embedding-3-large`; các
mô hình tùy chỉnh cần giá trị này trong cấu hình để LanceDB có thể tạo cột vector.

Đối với các mô hình embedding cục bộ nhỏ, hãy giảm `recallMaxChars` nếu bạn thấy lỗi
độ dài ngữ cảnh từ máy chủ cục bộ.

## Provider tương thích OpenAI

Một số provider embedding tương thích OpenAI từ chối tham số `encoding_format`,
trong khi các provider khác bỏ qua nó và luôn trả về vector `number[]`.
Vì vậy `memory-lancedb` bỏ qua `encoding_format` trong các yêu cầu embedding và
chấp nhận cả phản hồi mảng số thực hoặc phản hồi float32 được mã hóa base64.

Nếu bạn có endpoint embeddings tương thích OpenAI thô chưa có
adapter provider đi kèm, hãy bỏ qua `embedding.provider` (hoặc để là `openai`) và
đặt `embedding.apiKey` cùng `embedding.baseUrl`. Điều này giữ nguyên đường dẫn client
tương thích OpenAI trực tiếp.

Đặt `embedding.dimensions` cho các provider có số chiều mô hình chưa được tích hợp sẵn.
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

`memory-lancedb` có hai giới hạn văn bản riêng:

| Thiết lập         | Mặc định | Phạm vi  | Áp dụng cho                                              |
| ----------------- | -------- | -------- | -------------------------------------------------------- |
| `recallMaxChars`  | `1000`   | 100-10000 | văn bản gửi đến API embedding để truy hồi                |
| `captureMaxChars` | `500`    | 100-10000 | độ dài tin nhắn đủ điều kiện để tự động ghi lại          |
| `customTriggers`  | `[]`     | 0-50     | các cụm từ nguyên văn khiến tự động ghi lại xem xét một tin nhắn |

`recallMaxChars` kiểm soát tự động truy hồi, công cụ `memory_recall`, đường dẫn truy vấn
`memory_forget`, và `openclaw ltm search`. Tự động truy hồi ưu tiên
tin nhắn người dùng mới nhất trong lượt và chỉ quay về toàn bộ prompt khi không có
tin nhắn người dùng. Điều này giữ metadata kênh và các khối prompt lớn
khỏi yêu cầu embedding.

`captureMaxChars` kiểm soát liệu một phản hồi có đủ ngắn để được xem xét
ghi lại tự động hay không. Nó không giới hạn embeddings truy vấn truy hồi.

`customTriggers` cho phép bạn thêm các cụm từ tự động ghi lại nguyên văn mà không cần viết
biểu thức chính quy. Các trigger tích hợp bao gồm những cụm từ bộ nhớ thông dụng bằng tiếng Anh,
tiếng Séc, tiếng Trung, tiếng Nhật và tiếng Hàn.

## Lệnh

Khi `memory-lancedb` là Plugin bộ nhớ đang hoạt động, nó đăng ký namespace CLI `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Lệnh con `query` chạy một truy vấn không dùng vector trực tiếp trên bảng LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: danh sách cho phép các cột, phân tách bằng dấu phẩy (mặc định là `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: mệnh đề WHERE kiểu SQL; giới hạn ở 200 ký tự và chỉ cho phép chữ-số, toán tử so sánh, dấu nháy, dấu ngoặc đơn, và một tập nhỏ dấu câu an toàn.
- `--limit <n>`: số nguyên dương; mặc định `10`.
- `--order-by <column>:<asc|desc>`: sắp xếp trong bộ nhớ được áp dụng sau bộ lọc; cột sắp xếp được tự động đưa vào phép chiếu.

Agent cũng nhận được các công cụ bộ nhớ LanceDB từ Plugin bộ nhớ đang hoạt động:

- `memory_recall` để truy hồi dựa trên LanceDB
- `memory_store` để lưu các sự kiện, tùy chọn, quyết định và thực thể quan trọng
- `memory_forget` để xóa các ký ức khớp

## Lưu trữ

Theo mặc định, dữ liệu LanceDB nằm dưới `~/.openclaw/memory/lancedb`. Ghi đè
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

`storageOptions` chấp nhận các cặp khóa/giá trị chuỗi cho backend lưu trữ LanceDB và
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

`memory-lancedb` phụ thuộc vào gói native `@lancedb/lancedb`. OpenClaw được đóng gói
xem gói đó là một phần của gói Plugin. Quá trình khởi động Gateway
không sửa chữa phụ thuộc Plugin; nếu thiếu phụ thuộc, hãy cài đặt lại hoặc
cập nhật gói Plugin và khởi động lại Gateway.

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

Đặt `recallMaxChars` thấp hơn, rồi khởi động lại Gateway:

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

Đối với Ollama, cũng hãy xác minh máy chủ embedding có thể truy cập từ máy chủ Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Mô hình embedding không được hỗ trợ

Nếu không có `dimensions`, chỉ các số chiều embedding OpenAI tích hợp sẵn được biết.
Đối với mô hình embedding cục bộ hoặc tùy chỉnh, đặt `embedding.dimensions` thành kích thước
vector do mô hình đó báo cáo.

### Plugin tải nhưng không thấy ký ức nào

Kiểm tra rằng `plugins.slots.memory` trỏ đến `memory-lancedb`, rồi chạy:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Nếu `autoCapture` bị tắt, Plugin sẽ truy hồi các ký ức hiện có nhưng sẽ
không tự động lưu ký ức mới. Dùng công cụ `memory_store` hoặc bật
`autoCapture` nếu bạn muốn ghi lại tự động.

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Memory Wiki](/vi/plugins/memory-wiki)
- [Ollama](/vi/providers/ollama)
