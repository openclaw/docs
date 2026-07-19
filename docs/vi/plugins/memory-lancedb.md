---
read_when:
    - Bạn đang cấu hình plugin memory-lancedb
    - Bạn muốn bộ nhớ dài hạn dựa trên LanceDB với khả năng tự động truy hồi hoặc tự động ghi nhớ
    - Bạn đang sử dụng các embedding cục bộ tương thích với OpenAI, chẳng hạn như Ollama
sidebarTitle: Memory LanceDB
summary: Cấu hình Plugin bộ nhớ LanceDB bên ngoài chính thức, bao gồm embeddings cục bộ tương thích với Ollama
title: Bộ nhớ LanceDB
x-i18n:
    generated_at: "2026-07-19T05:52:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 771b28b9775175f53d3e6543e66618a56dd40ef95598c00c7abf9b62fb261e47
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` là một plugin bên ngoài chính thức lưu trữ bộ nhớ dài hạn trong
LanceDB với tính năng tìm kiếm vector. Plugin này có thể tự động truy hồi các ký ức liên quan trước một lượt
của mô hình và tự động ghi lại các dữ kiện quan trọng sau một phản hồi.

Sử dụng plugin này cho cơ sở dữ liệu vector cục bộ, một điểm cuối embedding tương thích với OpenAI hoặc
một kho lưu trữ bộ nhớ bên ngoài backend bộ nhớ tích hợp mặc định.

## Cài đặt

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin được phát hành lên npm; plugin này không được đóng gói kèm trong image runtime OpenClaw.
Việc cài đặt sẽ ghi mục nhập plugin, bật plugin và chuyển
`plugins.slots.memory` sang `memory-lancedb`. Nếu một plugin khác hiện đang sở hữu
khe bộ nhớ, plugin đó sẽ bị tắt kèm theo cảnh báo.

<Note>
Các plugin đồng hành như `memory-wiki` có thể chạy cùng với `memory-lancedb`,
nhưng mỗi thời điểm chỉ có một plugin sở hữu khe bộ nhớ đang hoạt động.
</Note>

<Note>
`memory_recall` của LanceDB không nhận quyền truy cập bản chép lời riêng tư được bảo vệ
mà `memorySearch.rememberAcrossConversations` sử dụng. Hãy sử dụng
`autoRecall` của LanceDB hoặc công cụ `memory_recall` của nó thông qua
[Active Memory nâng cao](/vi/concepts/active-memory#lancedb-memory).
`openclaw doctor` sẽ báo cáo khi tính năng Ghi nhớ qua các cuộc hội thoại không khả dụng
với nhà cung cấp bộ nhớ hiện tại.
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

## Cấu hình embedding

`embedding` là bắt buộc và phải chứa ít nhất một trường. `provider`
mặc định là `openai`; `model` mặc định là `text-embedding-3-small`.

| Trường                 | Kiểu          | Ghi chú                                                                  |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | chuỗi         | ID bộ chuyển đổi, ví dụ `openai`, `github-copilot`, `ollama`. Mặc định `openai`. |
| `embedding.model`      | chuỗi         | Mặc định `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | chuỗi         | Không bắt buộc; hỗ trợ mở rộng `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | chuỗi         | Không bắt buộc; hỗ trợ mở rộng `${ENV_VAR}`.                               |
| `embedding.dimensions` | số nguyên (>=1) | Bắt buộc đối với các mô hình không có trong bảng tích hợp (xem bên dưới). |

Có hai đường dẫn yêu cầu:

- **Đường dẫn bộ chuyển đổi nhà cung cấp** (mặc định): đặt `embedding.provider` và bỏ qua
  `embedding.apiKey`/`embedding.baseUrl`. Plugin phân giải hồ sơ xác thực,
  biến môi trường hoặc `models.providers.<provider>.apiKey` đã cấu hình của nhà cung cấp
  thông qua chính các bộ chuyển đổi embedding bộ nhớ mà `memory-core` sử dụng.
  Đây là đường dẫn dành cho `github-copilot`, `ollama` và mọi nhà cung cấp
  đóng gói kèm khác có hỗ trợ embedding.
- **Đường dẫn máy khách tương thích trực tiếp với OpenAI**: không đặt `embedding.provider`
  (hoặc `"openai"`) và đặt `embedding.apiKey` cùng `embedding.baseUrl`. Sử dụng đường dẫn này
  cho một điểm cuối embedding tương thích với OpenAI thô không có bộ chuyển đổi nhà cung cấp
  đóng gói kèm.

OAuth OpenAI Codex / ChatGPT không phải là thông tin xác thực embedding của OpenAI Platform.
Đối với embedding OpenAI, hãy sử dụng hồ sơ xác thực bằng khóa API OpenAI, `OPENAI_API_KEY` hoặc
`models.providers.openai.apiKey`. Người dùng chỉ có OAuth nên chọn một
nhà cung cấp hỗ trợ embedding khác như `github-copilot` hoặc `ollama`.

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

Một số điểm cuối embedding tương thích với OpenAI từ chối tham số `encoding_format`;
những điểm cuối khác bỏ qua tham số này và luôn trả về `number[]`. `memory-lancedb`
loại bỏ `encoding_format` khỏi yêu cầu và chấp nhận phản hồi dạng mảng số thực hoặc
float32 được mã hóa base64, vì vậy cả hai dạng phản hồi đều hoạt động mà không cần cấu hình.

### Số chiều

OpenClaw chỉ có số chiều tích hợp cho `text-embedding-3-small` (1536) và
`text-embedding-3-large` (3072). Mọi mô hình khác đều cần một
`embedding.dimensions` được chỉ định rõ để LanceDB có thể tạo cột vector, ví dụ
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

Sử dụng đường dẫn bộ chuyển đổi nhà cung cấp Ollama đóng gói kèm (`embedding.provider: "ollama"`).
Đường dẫn này gọi điểm cuối `/api/embed` gốc của Ollama và tuân theo cùng các quy tắc xác thực/URL cơ sở
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
bắt buộc. Đối với các mô hình embedding cục bộ nhỏ, hãy giảm `recallMaxChars` nếu
máy chủ cục bộ trả về lỗi độ dài ngữ cảnh.

## Giới hạn truy hồi và ghi lại

| Cài đặt           | Mặc định | Phạm vi                      | Áp dụng cho                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Văn bản được gửi đến API embedding để truy hồi.            |
| `captureMaxChars` | `500`   | 100-10000                    | Độ dài tin nhắn đủ điều kiện để tự động ghi lại.            |
| `customTriggers`  | `[]`    | 0-50 mục, mỗi mục <=100 ký tự | Các cụm từ nguyên văn khiến tính năng tự động ghi lại xem xét một tin nhắn. |

`recallMaxChars` giới hạn truy vấn tự động truy hồi `before_prompt_build`, công cụ
`memory_recall`, đường dẫn truy vấn `memory_forget` và `openclaw ltm
search`. Tính năng tự động truy hồi nhúng tin nhắn người dùng mới nhất trong lượt và chỉ
chuyển sang sử dụng toàn bộ prompt khi không có tin nhắn người dùng, nhờ đó loại
siêu dữ liệu kênh và các khối prompt lớn khỏi yêu cầu embedding.

`captureMaxChars` kiểm soát liệu một tin nhắn người dùng từ sự kiện `agent_end`
của lượt có đủ ngắn để được xem xét cho việc tự động ghi lại hay không; cài đặt này không ảnh hưởng
đến các truy vấn truy hồi.

`customTriggers` thêm các cụm từ tự động ghi lại nguyên văn mà không dùng biểu thức chính quy. Các trình kích hoạt
tích hợp bao gồm những cụm từ về bộ nhớ phổ biến trong tiếng Anh, tiếng Séc, tiếng Trung, tiếng Nhật và tiếng Hàn
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` và các cụm từ tương tự).

Tính năng tự động ghi lại cũng từ chối văn bản có vẻ là siêu dữ liệu phong bì/vận chuyển,
payload chèn prompt hoặc ngữ cảnh `<relevant-memories>` đã được chèn,
đồng thời giới hạn tối đa 3 ký ức được ghi lại trong mỗi lượt của tác nhân.

Mỗi ký ức thuộc sở hữu của một tác nhân. Việc truy hồi, phát hiện trùng lặp, ghi lại,
liệt kê, truy vấn thô và xóa đều thực thi quyền sở hữu đó trước khi trả về hoặc
thay đổi các hàng. Một tác nhân có `memorySearch.enabled: false` (trong `agents.list[]`
hoặc qua `agents.defaults`) cũng không nhận được bất kỳ công cụ `memory_recall`, `memory_store`
hay `memory_forget` nào và không tham gia truy hồi hoặc
ghi lại tự động, ngay cả khi các cờ `autoRecall`/`autoCapture` ở cấp plugin đang bật.

## Lệnh

`memory-lancedb` đăng ký không gian tên CLI `ltm` bất cứ khi nào plugin được cài đặt
(không chỉ khi plugin sở hữu khe bộ nhớ đang hoạt động):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` chạy một truy vấn không dùng vector trực tiếp trên bảng LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Cờ                                | Mặc định                                | Ghi chú                                                                                                                                   |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | tác nhân mặc định đã cấu hình            | Chọn không gian tên tác nhân riêng tư. Có trên `list`, `search`, `query` và `stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Danh sách cho phép các cột, phân tách bằng dấu phẩy.                                                                                      |
| `--filter <condition>`            | không có                               | Một phép so sánh trên cột đầu ra, chẳng hạn `category = 'preference'` hoặc `importance >= 0.8`. Giá trị chuỗi phải được đặt trong dấu ngoặc kép. |
| `--limit <n>`                     | `10`                                    | Số nguyên dương.                                                                                                                          |
| `--order-by <column>:<asc\|desc>` | không có                               | Được sắp xếp trong bộ nhớ sau khi bộ lọc chạy; cột sắp xếp được tự động thêm vào phép chiếu và bị loại khỏi đầu ra nếu không được yêu cầu. |

Các tác nhân nhận được ba công cụ từ plugin bộ nhớ đang hoạt động:

- `memory_recall`: tìm kiếm vector trên các ký ức đã lưu trữ.
- `memory_store`: lưu một dữ kiện, tùy chọn, quyết định hoặc thực thể (từ chối văn bản
  có vẻ là payload chèn prompt; bỏ qua các bản lưu gần trùng lặp).
- `memory_forget`: xóa theo `memoryId` hoặc theo `query` (tự động xóa một
  kết quả khớp duy nhất có điểm trên 90%, nếu không sẽ liệt kê các ID ứng viên để phân định).

## Lưu trữ

Dữ liệu LanceDB mặc định được lưu tại `~/.openclaw/memory/lancedb`. Ghi đè bằng `dbPath`:

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

Plugin duy trì một bảng LanceDB và lưu chủ sở hữu tác nhân đã được chuẩn hóa trên mỗi
hàng. Đây là ranh giới lưu trữ, không phải bộ lọc sau tìm kiếm: quyền sở hữu của tác nhân được
áp dụng trước khi xếp hạng vector và được đưa vào các vị từ liệt kê, truy vấn, đếm và xóa.
`ltm query --filter` chấp nhận một phép so sánh đã được xác thực trên các
cột đầu ra công khai. Kho lưu trữ xây dựng phép so sánh đó riêng biệt với
vị từ chủ sở hữu bắt buộc, vì vậy bộ lọc không thể mở rộng truy vấn sang một
tác nhân khác.

Các cơ sở dữ liệu được tạo trước khi có quyền sở hữu theo từng tác nhân không có nguồn gốc hàng đáng tin cậy.
Khi nâng cấp, `openclaw doctor --fix` gán một lần các hàng cũ đó cho
tác nhân mặc định đã cấu hình. Quyền truy cập runtime sẽ từ chối an toàn cho đến khi quá trình di chuyển đó
hoàn tất; các tác nhân khác không bao giờ kế thừa những hàng dùng chung cũ.

`storageOptions` chấp nhận các cặp khóa/giá trị dạng chuỗi cho các backend lưu trữ LanceDB
(ví dụ: kho lưu trữ đối tượng tương thích với S3) và hỗ trợ khai triển `${ENV_VAR}`:

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
plugin sở hữu (không phải bản phân phối lõi OpenClaw). Quá trình khởi động Gateway không sửa chữa
các phụ thuộc của plugin; nếu thiếu phụ thuộc native hoặc không tải được,
hãy cài đặt lại hoặc cập nhật gói plugin rồi khởi động lại Gateway.

`@lancedb/lancedb` không phát hành bản dựng native cho `darwin-x64` (máy Mac
dùng Intel). Trên nền tảng đó, plugin ghi nhật ký tại thời điểm tải rằng LanceDB không khả dụng;
hãy dùng backend bộ nhớ mặc định, chạy Gateway trên
nền tảng/kiến trúc được hỗ trợ hoặc vô hiệu hóa `memory-lancedb`.

## Khắc phục sự cố

### Độ dài đầu vào vượt quá độ dài ngữ cảnh

Mô hình embedding đã từ chối truy vấn truy hồi:

```text
memory-lancedb: truy hồi thất bại: Lỗi: 400 độ dài đầu vào vượt quá độ dài ngữ cảnh
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

Đối với Ollama, cũng cần xác minh máy chủ embedding có thể được truy cập từ máy chủ
Gateway bằng endpoint nhúng native của nó:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Mô hình embedding không được hỗ trợ

Nếu không có `embedding.dimensions`, hệ thống chỉ biết kích thước embedding OpenAI
tích hợp sẵn (`text-embedding-3-small`, `text-embedding-3-large`). Đối với bất kỳ
mô hình nào khác, hãy đặt `embedding.dimensions` thành kích thước vectơ mà mô hình đó báo cáo.

### Plugin tải được nhưng không xuất hiện ký ức nào

Xác nhận `plugins.slots.memory` trỏ đến `memory-lancedb`, rồi chạy:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Nếu `autoCapture` bị vô hiệu hóa, plugin vẫn truy hồi các ký ức hiện có nhưng
không tự động lưu ký ức mới. Hãy dùng công cụ `memory_store` hoặc bật
`autoCapture`.

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Wiki bộ nhớ](/vi/plugins/memory-wiki)
- [Ollama](/vi/providers/ollama)
