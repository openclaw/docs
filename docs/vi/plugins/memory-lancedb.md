---
read_when:
    - Bạn đang cấu hình plugin memory-lancedb
    - Bạn muốn bộ nhớ dài hạn dựa trên LanceDB với khả năng tự động truy hồi hoặc tự động ghi nhớ
    - Bạn đang sử dụng mô hình nhúng cục bộ tương thích với OpenAI, chẳng hạn như Ollama
sidebarTitle: Memory LanceDB
summary: Cấu hình Plugin bộ nhớ LanceDB bên ngoài chính thức, bao gồm cả embedding cục bộ tương thích với Ollama
title: Bộ nhớ LanceDB
x-i18n:
    generated_at: "2026-07-12T08:08:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` là một plugin bên ngoài chính thức, lưu trữ bộ nhớ dài hạn trong
LanceDB với khả năng tìm kiếm vectơ. Plugin có thể tự động truy hồi các bộ nhớ
liên quan trước một lượt mô hình và tự động thu thập các thông tin quan trọng
sau một phản hồi.

Hãy dùng plugin này khi cần cơ sở dữ liệu vectơ cục bộ, điểm cuối embedding
tương thích với OpenAI hoặc kho bộ nhớ nằm ngoài backend bộ nhớ tích hợp mặc định.

## Cài đặt

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin được phát hành lên npm; plugin không được đóng gói trong ảnh runtime
OpenClaw. Việc cài đặt sẽ ghi mục nhập plugin, bật plugin và chuyển
`plugins.slots.memory` sang `memory-lancedb`. Nếu một plugin khác hiện đang
sở hữu khe bộ nhớ, plugin đó sẽ bị vô hiệu hóa kèm cảnh báo.

<Note>
Các plugin bổ trợ như `memory-wiki` có thể chạy cùng với `memory-lancedb`,
nhưng tại mỗi thời điểm chỉ một plugin sở hữu khe bộ nhớ đang hoạt động.
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

Khởi động lại Gateway sau khi thay đổi cấu hình plugin, rồi xác minh plugin đã
được tải:

```bash
openclaw gateway restart
openclaw plugins list
```

## Cấu hình embedding

`embedding` là bắt buộc và phải bao gồm ít nhất một trường. `provider`
mặc định là `openai`; `model` mặc định là `text-embedding-3-small`.

| Trường                 | Kiểu          | Ghi chú                                                                   |
| ---------------------- | ------------- | ------------------------------------------------------------------------- |
| `embedding.provider`   | chuỗi         | ID bộ điều hợp, ví dụ `openai`, `github-copilot`, `ollama`. Mặc định `openai`. |
| `embedding.model`      | chuỗi         | Mặc định `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | chuỗi         | Không bắt buộc; hỗ trợ nội suy `${ENV_VAR}`.                              |
| `embedding.baseUrl`    | chuỗi         | Không bắt buộc; hỗ trợ nội suy `${ENV_VAR}`.                              |
| `embedding.dimensions` | số nguyên (>=1) | Bắt buộc đối với các mô hình không có trong bảng tích hợp (xem bên dưới). |

Có hai đường dẫn yêu cầu:

- **Đường dẫn bộ điều hợp nhà cung cấp** (mặc định): đặt `embedding.provider`
  và bỏ qua `embedding.apiKey`/`embedding.baseUrl`. Plugin phân giải hồ sơ xác
  thực đã cấu hình, biến môi trường hoặc `models.providers.<provider>.apiKey`
  của nhà cung cấp thông qua cùng các bộ điều hợp embedding bộ nhớ mà
  `memory-core` sử dụng. Đây là đường dẫn dành cho `github-copilot`, `ollama`
  và mọi nhà cung cấp đóng gói khác có hỗ trợ embedding.
- **Đường dẫn máy khách tương thích trực tiếp với OpenAI**: không đặt
  `embedding.provider` (hoặc đặt thành `"openai"`) và đặt `embedding.apiKey`
  cùng `embedding.baseUrl`. Dùng đường dẫn này cho điểm cuối embedding thô
  tương thích với OpenAI không có bộ điều hợp nhà cung cấp đóng gói.

OAuth của OpenAI Codex / ChatGPT không phải là thông tin xác thực embedding của
OpenAI Platform. Đối với embedding OpenAI, hãy dùng hồ sơ xác thực khóa API
OpenAI, `OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`. Người dùng chỉ
có OAuth nên chọn nhà cung cấp khác có khả năng embedding như `github-copilot`
hoặc `ollama`.

```json5
{
  plugins: {
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

Một số điểm cuối embedding tương thích với OpenAI từ chối tham số
`encoding_format`; các điểm cuối khác bỏ qua tham số này và luôn trả về
`number[]`. `memory-lancedb` không gửi `encoding_format` trong yêu cầu và chấp
nhận cả phản hồi mảng số thực lẫn số thực float32 được mã hóa base64, vì vậy cả
hai dạng phản hồi đều hoạt động mà không cần cấu hình.

### Số chiều

OpenClaw chỉ có số chiều tích hợp cho `text-embedding-3-small` (1536) và
`text-embedding-3-large` (3072). Mọi mô hình khác đều cần
`embedding.dimensions` được chỉ định rõ để LanceDB có thể tạo cột vectơ, ví dụ
ZhiPu `embedding-3` với 2048 chiều:

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

## Embedding Ollama

Sử dụng đường dẫn bộ điều hợp nhà cung cấp Ollama được đóng gói
(`embedding.provider: "ollama"`). Đường dẫn này gọi điểm cuối `/api/embed`
gốc của Ollama và tuân theo cùng các quy tắc xác thực/URL cơ sở như nhà cung
cấp [Ollama](/vi/providers/ollama).

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

`mxbai-embed-large` không có trong bảng số chiều tích hợp, vì vậy `dimensions`
là bắt buộc. Với các mô hình embedding cục bộ nhỏ, hãy giảm `recallMaxChars`
nếu máy chủ cục bộ trả về lỗi độ dài ngữ cảnh.

## Giới hạn truy hồi và thu thập

| Thiết lập          | Mặc định | Phạm vi                      | Áp dụng cho                                                  |
| ------------------ | -------- | ---------------------------- | ------------------------------------------------------------ |
| `recallMaxChars`   | `1000`   | 100-10000                    | Văn bản gửi đến API embedding để truy hồi.                   |
| `captureMaxChars`  | `500`    | 100-10000                    | Độ dài thông báo đủ điều kiện để tự động thu thập.           |
| `customTriggers`   | `[]`     | 0-50 mục, mỗi mục <=100 ký tự | Các cụm từ nguyên văn khiến tính năng tự động thu thập xem xét thông báo. |

`recallMaxChars` giới hạn truy vấn tự động truy hồi `before_prompt_build`,
công cụ `memory_recall`, đường dẫn truy vấn `memory_forget` và `openclaw ltm
search`. Tính năng tự động truy hồi nhúng thông báo mới nhất của người dùng
trong lượt và chỉ dùng toàn bộ prompt làm phương án dự phòng khi không có thông
báo người dùng, nhờ đó loại siêu dữ liệu kênh và các khối prompt lớn khỏi yêu
cầu embedding.

`captureMaxChars` kiểm soát xem thông báo người dùng từ sự kiện `agent_end`
của lượt có đủ ngắn để được xem xét cho việc tự động thu thập hay không; thiết
lập này không ảnh hưởng đến các truy vấn truy hồi.

`customTriggers` thêm các cụm từ tự động thu thập nguyên văn mà không dùng biểu
thức chính quy. Các yếu tố kích hoạt tích hợp bao gồm những cụm từ bộ nhớ phổ
biến bằng tiếng Anh, tiếng Séc, tiếng Trung, tiếng Nhật và tiếng Hàn
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` và các cụm từ tương tự).

Tính năng tự động thu thập cũng từ chối văn bản có vẻ là siêu dữ liệu
phong bì/vận chuyển, tải trọng chèn prompt hoặc ngữ cảnh
`<relevant-memories>` đã được chèn, đồng thời giới hạn tối đa 3 bộ nhớ được thu
thập cho mỗi lượt tác nhân.

## Lệnh

`memory-lancedb` đăng ký không gian tên CLI `ltm` bất cứ khi nào được cài đặt
(không chỉ khi plugin sở hữu khe bộ nhớ đang hoạt động):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` chạy truy vấn không dùng vectơ trực tiếp trên bảng LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Cờ                                | Mặc định                                | Ghi chú                                                                                                                                  |
| --------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Danh sách cho phép các cột, phân tách bằng dấu phẩy.                                                                                     |
| `--filter <condition>`            | không có                               | Mệnh đề WHERE kiểu SQL. Tối đa 200 ký tự; chỉ cho phép chữ và số, `_-`, khoảng trắng cùng `='"<>!.,()%*`.                                |
| `--limit <n>`                     | `10`                                    | Số nguyên dương.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | không có                               | Sắp xếp trong bộ nhớ sau khi bộ lọc chạy; cột sắp xếp được tự động thêm vào phép chiếu và loại khỏi đầu ra nếu không được yêu cầu.        |

Tác nhân nhận được ba công cụ từ plugin bộ nhớ đang hoạt động:

- `memory_recall`: tìm kiếm vectơ trên các bộ nhớ đã lưu trữ.
- `memory_store`: lưu thông tin, tùy chọn, quyết định hoặc thực thể (từ chối
  văn bản có vẻ là tải trọng chèn prompt; bỏ qua các bản lưu gần trùng lặp).
- `memory_forget`: xóa theo `memoryId` hoặc theo `query` (tự động xóa một kết
  quả duy nhất có điểm trên 90%; nếu không, liệt kê các ID ứng viên để phân
  biệt).

## Lưu trữ

Dữ liệu LanceDB mặc định được lưu tại `~/.openclaw/memory/lancedb`. Ghi đè bằng
`dbPath`:

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

`storageOptions` chấp nhận các cặp khóa/giá trị dạng chuỗi cho backend lưu trữ
LanceDB (ví dụ: lưu trữ đối tượng tương thích với S3) và hỗ trợ nội suy
`${ENV_VAR}`:

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

## Phụ thuộc runtime và hỗ trợ nền tảng

`memory-lancedb` phụ thuộc vào gói gốc `@lancedb/lancedb`, do gói plugin quản
lý (không phải bản phân phối lõi OpenClaw). Quá trình khởi động Gateway không
sửa chữa các phụ thuộc của plugin; nếu phụ thuộc gốc bị thiếu hoặc không tải
được, hãy cài đặt lại hoặc cập nhật gói plugin rồi khởi động lại Gateway.

`@lancedb/lancedb` không phát hành bản dựng gốc cho `darwin-x64` (máy Mac
Intel). Trên nền tảng đó, plugin ghi nhật ký khi tải rằng LanceDB không khả
dụng; hãy sử dụng backend bộ nhớ mặc định, chạy Gateway trên nền tảng/kiến trúc
được hỗ trợ hoặc vô hiệu hóa `memory-lancedb`.

## Khắc phục sự cố

### Độ dài đầu vào vượt quá độ dài ngữ cảnh

Mô hình embedding đã từ chối truy vấn truy hồi:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Giảm `recallMaxChars`, rồi khởi động lại Gateway:

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

Đối với Ollama, cũng hãy xác minh máy chủ embedding có thể được truy cập từ máy
chủ Gateway bằng điểm cuối embedding gốc:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Mô hình embedding không được hỗ trợ

Nếu không có `embedding.dimensions`, hệ thống chỉ biết số chiều embedding
OpenAI tích hợp (`text-embedding-3-small`, `text-embedding-3-large`). Với mọi
mô hình khác, hãy đặt `embedding.dimensions` thành kích thước vectơ mà mô hình
đó báo cáo.

### Plugin tải được nhưng không có bộ nhớ nào xuất hiện

Xác nhận `plugins.slots.memory` trỏ đến `memory-lancedb`, sau đó chạy:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Nếu `autoCapture` bị tắt, plugin vẫn truy hồi các ký ức hiện có nhưng
không tự động lưu ký ức mới. Hãy sử dụng công cụ `memory_store` hoặc bật
`autoCapture`.

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Wiki bộ nhớ](/vi/plugins/memory-wiki)
- [Ollama](/vi/providers/ollama)
