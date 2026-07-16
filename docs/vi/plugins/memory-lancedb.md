---
read_when:
    - Bạn đang cấu hình plugin memory-lancedb
    - Bạn muốn bộ nhớ dài hạn dựa trên LanceDB với khả năng tự động truy hồi hoặc tự động ghi nhớ
    - Bạn đang sử dụng các embedding cục bộ tương thích với OpenAI như Ollama
sidebarTitle: Memory LanceDB
summary: Cấu hình Plugin bộ nhớ LanceDB bên ngoài chính thức, bao gồm cả embedding cục bộ tương thích với Ollama
title: Bộ nhớ LanceDB
x-i18n:
    generated_at: "2026-07-16T14:54:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` là một plugin bên ngoài chính thức lưu trữ bộ nhớ dài hạn trong
LanceDB với tính năng tìm kiếm vectơ. Plugin có thể tự động truy hồi các ký ức liên quan trước một lượt
của mô hình và tự động ghi lại các dữ kiện quan trọng sau phản hồi.

Sử dụng plugin này cho cơ sở dữ liệu vectơ cục bộ, điểm cuối nhúng tương thích với OpenAI hoặc
kho bộ nhớ nằm ngoài backend bộ nhớ tích hợp mặc định.

## Cài đặt

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin được phát hành lên npm; plugin không được đóng gói trong ảnh runtime OpenClaw.
Việc cài đặt sẽ ghi mục nhập plugin, bật plugin và chuyển
`plugins.slots.memory` sang `memory-lancedb`. Nếu một plugin khác hiện đang sở hữu
khe bộ nhớ, plugin đó sẽ bị vô hiệu hóa kèm cảnh báo.

<Note>
Các plugin đồng hành như `memory-wiki` có thể chạy cùng với `memory-lancedb`,
nhưng mỗi thời điểm chỉ một plugin sở hữu khe bộ nhớ đang hoạt động.
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

Khởi động lại Gateway sau khi thay đổi cấu hình plugin, rồi xác minh plugin đã được tải:

```bash
openclaw gateway restart
openclaw plugins list
```

## Cấu hình nhúng

`embedding` là bắt buộc và phải bao gồm ít nhất một trường. `provider`
mặc định là `openai`; `model` mặc định là `text-embedding-3-small`.

| Trường                  | Kiểu          | Ghi chú                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | chuỗi        | ID bộ điều hợp, ví dụ `openai`, `github-copilot`, `ollama`. Mặc định `openai`. |
| `embedding.model`      | chuỗi        | Mặc định `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | chuỗi        | Không bắt buộc; hỗ trợ mở rộng `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | chuỗi        | Không bắt buộc; hỗ trợ mở rộng `${ENV_VAR}`.                               |
| `embedding.dimensions` | số nguyên (>=1) | Bắt buộc đối với các mô hình không có trong bảng tích hợp (xem bên dưới).               |

Có hai đường dẫn yêu cầu:

- **Đường dẫn bộ điều hợp nhà cung cấp** (mặc định): đặt `embedding.provider` và bỏ qua
  `embedding.apiKey`/`embedding.baseUrl`. Plugin phân giải hồ sơ xác thực đã cấu hình,
  biến môi trường hoặc `models.providers.<provider>.apiKey` của nhà cung cấp thông qua
  chính các bộ điều hợp nhúng bộ nhớ mà `memory-core` sử dụng. Đây là đường dẫn dành cho `github-copilot`, `ollama`
  và mọi nhà cung cấp đóng gói khác có hỗ trợ nhúng.
- **Đường dẫn máy khách tương thích trực tiếp với OpenAI**: để `embedding.provider` chưa được đặt
  (hoặc `"openai"`) và đặt `embedding.apiKey` cùng `embedding.baseUrl`. Sử dụng đường dẫn này
  cho điểm cuối nhúng tương thích trực tiếp với OpenAI không có bộ điều hợp nhà cung cấp
  đóng gói.

OAuth của OpenAI Codex / ChatGPT không phải là thông tin xác thực nhúng của OpenAI Platform.
Đối với nhúng OpenAI, hãy sử dụng hồ sơ xác thực bằng khóa API OpenAI, `OPENAI_API_KEY` hoặc
`models.providers.openai.apiKey`. Người dùng chỉ có OAuth nên chọn một
nhà cung cấp khác hỗ trợ nhúng, chẳng hạn như `github-copilot` hoặc `ollama`.

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

Một số điểm cuối nhúng tương thích với OpenAI từ chối tham số `encoding_format`;
các điểm cuối khác bỏ qua tham số này và luôn trả về `number[]`. `memory-lancedb`
bỏ qua `encoding_format` trong yêu cầu và chấp nhận cả phản hồi mảng số thực lẫn
float32 được mã hóa base64, vì vậy cả hai dạng phản hồi đều hoạt động mà không cần cấu hình.

### Số chiều

OpenClaw chỉ có số chiều tích hợp cho `text-embedding-3-small` (1536) và
`text-embedding-3-large` (3072). Mọi mô hình khác đều cần `embedding.dimensions`
tường minh để LanceDB có thể tạo cột vectơ, ví dụ
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

## Nhúng Ollama

Sử dụng đường dẫn bộ điều hợp nhà cung cấp Ollama được đóng gói (`embedding.provider: "ollama"`).
Đường dẫn này gọi điểm cuối `/api/embed` gốc của Ollama và tuân theo cùng quy tắc xác thực/URL cơ sở
như nhà cung cấp [Ollama](/vi/providers/ollama).

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

`mxbai-embed-large` không có trong bảng số chiều tích hợp, vì vậy `dimensions` là
bắt buộc. Đối với các mô hình nhúng cục bộ nhỏ, hãy giảm `recallMaxChars` nếu
máy chủ cục bộ trả về lỗi độ dài ngữ cảnh.

## Giới hạn truy hồi và ghi lại

| Cài đặt           | Mặc định | Phạm vi                        | Áp dụng cho                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Văn bản được gửi tới API nhúng để truy hồi.                 |
| `captureMaxChars` | `500`   | 100-10000                    | Độ dài tin nhắn đủ điều kiện để tự động ghi lại.                  |
| `customTriggers`  | `[]`    | 0-50 mục, mỗi mục <=100 ký tự | Các cụm từ cố định khiến tính năng tự động ghi lại xem xét một tin nhắn. |

`recallMaxChars` giới hạn truy vấn tự động truy hồi `before_prompt_build`,
công cụ `memory_recall`, đường dẫn truy vấn `memory_forget` và `openclaw ltm
search`. Tính năng tự động truy hồi nhúng tin nhắn mới nhất của người dùng trong lượt
và chỉ dùng toàn bộ prompt làm phương án dự phòng khi không có tin nhắn người dùng, nhờ đó loại
siêu dữ liệu kênh và các khối prompt lớn khỏi yêu cầu nhúng.

`captureMaxChars` kiểm soát việc tin nhắn người dùng từ sự kiện `agent_end`
của lượt có đủ ngắn để được xem xét tự động ghi lại hay không; cài đặt này không ảnh hưởng đến
các truy vấn truy hồi.

`customTriggers` thêm các cụm từ tự động ghi lại theo nghĩa đen mà không dùng biểu thức chính quy. Các
trình kích hoạt tích hợp bao gồm những cụm từ về bộ nhớ phổ biến trong tiếng Anh, tiếng Séc, tiếng Trung, tiếng Nhật và tiếng Hàn
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` và các cụm từ tương tự).

Tính năng tự động ghi lại cũng từ chối văn bản trông giống siêu dữ liệu phong bì/vận chuyển,
nội dung chèn prompt hoặc ngữ cảnh `<relevant-memories>` đã được chèn,
và giới hạn ở 3 ký ức được ghi lại trong mỗi lượt của tác nhân.

Mỗi ký ức thuộc sở hữu của một tác nhân. Việc truy hồi, phát hiện trùng lặp, ghi lại,
liệt kê, truy vấn thô và xóa đều thực thi quyền sở hữu đó trước khi trả về hoặc
thay đổi các hàng. Tác nhân có `memorySearch.enabled: false` (trong `agents.list[]`
hoặc thông qua `agents.defaults`) cũng không nhận được bất kỳ công cụ `memory_recall`, `memory_store`
hoặc `memory_forget` nào và không tham gia truy hồi hoặc
ghi lại tự động, ngay cả khi các cờ `autoRecall`/`autoCapture` ở cấp plugin được bật.

## Lệnh

`memory-lancedb` đăng ký không gian tên CLI `ltm` mỗi khi được cài đặt
(không chỉ khi sở hữu khe bộ nhớ đang hoạt động):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` chạy truy vấn không dùng vectơ trực tiếp trên bảng LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Cờ                              | Mặc định                                 | Ghi chú                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | tác nhân mặc định đã cấu hình                | Chọn không gian tên riêng của tác nhân. Có sẵn trên `list`, `search`, `query` và `stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Danh sách cho phép các cột, phân tách bằng dấu phẩy.                                                                                                         |
| `--filter <condition>`            | không có                                    | Một phép so sánh trên cột đầu ra, chẳng hạn như `category = 'preference'` hoặc `importance >= 0.8`. Giá trị chuỗi phải được đặt trong dấu ngoặc kép.             |
| `--limit <n>`                     | `10`                                    | Số nguyên dương.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | không có                                    | Được sắp xếp trong bộ nhớ sau khi bộ lọc chạy; cột sắp xếp được tự động thêm vào phép chiếu và bị loại khỏi đầu ra nếu không được yêu cầu. |

Các tác nhân nhận được ba công cụ từ plugin bộ nhớ đang hoạt động:

- `memory_recall`: tìm kiếm vectơ trên các ký ức đã lưu trữ.
- `memory_store`: lưu một dữ kiện, tùy chọn, quyết định hoặc thực thể (từ chối văn bản
  trông giống nội dung chèn prompt; bỏ qua các lần lưu gần trùng lặp).
- `memory_forget`: xóa theo `memoryId` hoặc theo `query` (tự động xóa một
  kết quả khớp duy nhất có điểm trên 90%; nếu không, liệt kê các ID ứng viên để phân biệt).

## Lưu trữ

Dữ liệu LanceDB mặc định nằm tại `~/.openclaw/memory/lancedb`. Ghi đè bằng `dbPath`:

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

Plugin duy trì một bảng LanceDB và lưu chủ sở hữu tác nhân đã chuẩn hóa trên mỗi
hàng. Đây là ranh giới lưu trữ, không phải bộ lọc sau tìm kiếm: quyền sở hữu của tác nhân được
áp dụng trước khi xếp hạng vectơ và được đưa vào các vị từ liệt kê, truy vấn, đếm và xóa.
`ltm query --filter` chấp nhận một phép so sánh đã xác thực trên các
cột đầu ra công khai. Kho lưu trữ xây dựng phép so sánh đó tách biệt với
vị từ chủ sở hữu bắt buộc, vì vậy bộ lọc không thể mở rộng truy vấn sang tác nhân
khác.

Các cơ sở dữ liệu được tạo trước khi có quyền sở hữu theo từng tác nhân không có nguồn gốc hàng đáng tin cậy.
Khi nâng cấp, `openclaw doctor --fix` gán một lần các hàng cũ đó cho
tác nhân mặc định đã cấu hình. Quyền truy cập runtime đóng khi lỗi cho đến khi quá trình di chuyển đó
hoàn tất; các tác nhân khác không bao giờ kế thừa các hàng dùng chung cũ.

`storageOptions` chấp nhận các cặp khóa/giá trị chuỗi cho backend lưu trữ LanceDB
(ví dụ: bộ nhớ đối tượng tương thích với S3) và hỗ trợ mở rộng `${ENV_VAR}`:

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

## Phụ thuộc thời gian chạy và hỗ trợ nền tảng

`memory-lancedb` phụ thuộc vào gói native `@lancedb/lancedb`, do gói
Plugin sở hữu (không phải bản phân phối lõi OpenClaw). Quá trình khởi động Gateway không sửa chữa
các phụ thuộc của Plugin; nếu phụ thuộc native bị thiếu hoặc không tải được,
hãy cài đặt lại hoặc cập nhật gói Plugin rồi khởi động lại Gateway.

`@lancedb/lancedb` không phát hành bản dựng native cho `darwin-x64` (máy Mac
Intel). Trên nền tảng đó, Plugin ghi nhật ký tại thời điểm tải rằng LanceDB không khả dụng;
hãy sử dụng backend bộ nhớ mặc định, chạy Gateway trên
nền tảng/kiến trúc được hỗ trợ hoặc vô hiệu hóa `memory-lancedb`.

## Khắc phục sự cố

### Độ dài đầu vào vượt quá độ dài ngữ cảnh

Mô hình embedding đã từ chối truy vấn truy hồi:

```text
memory-lancedb: truy hồi thất bại: Lỗi: 400 độ dài đầu vào vượt quá độ dài ngữ cảnh
```

Giảm `recallMaxChars`, sau đó khởi động lại Gateway:

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

Đối với Ollama, đồng thời xác minh rằng máy chủ embedding có thể được truy cập từ máy chủ
Gateway bằng endpoint nhúng native của nó:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Mô hình embedding không được hỗ trợ

Nếu không có `embedding.dimensions`, hệ thống chỉ biết các kích thước embedding OpenAI
tích hợp sẵn (`text-embedding-3-small`, `text-embedding-3-large`). Đối với bất kỳ
mô hình nào khác, hãy đặt `embedding.dimensions` thành kích thước vectơ mà mô hình đó báo cáo.

### Plugin tải được nhưng không xuất hiện ký ức nào

Xác nhận `plugins.slots.memory` trỏ đến `memory-lancedb`, sau đó chạy:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Nếu `autoCapture` bị vô hiệu hóa, Plugin vẫn truy hồi các ký ức hiện có nhưng
không tự động lưu ký ức mới. Hãy sử dụng công cụ `memory_store` hoặc bật
`autoCapture`.

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Wiki bộ nhớ](/vi/plugins/memory-wiki)
- [Ollama](/vi/providers/ollama)
