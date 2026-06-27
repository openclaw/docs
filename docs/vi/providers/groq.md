---
read_when:
    - Bạn muốn sử dụng Groq với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc lựa chọn xác thực CLI
    - Bạn đang cấu hình phiên âm âm thanh Whisper trên Groq
summary: Thiết lập Groq (xác thực + chọn mô hình + phiên âm Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:03:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) cung cấp suy luận siêu nhanh trên các mô hình open-weight (Llama, Gemma, Kimi, Qwen, GPT OSS, và nhiều mô hình khác) bằng phần cứng LPU tùy chỉnh. Plugin Groq đăng ký cả nhà cung cấp trò chuyện tương thích với OpenAI và nhà cung cấp hiểu phương tiện âm thanh.

| Thuộc tính             | Giá trị                                   |
| ---------------------- | ---------------------------------------- |
| ID nhà cung cấp        | `groq`                                   |
| Plugin                 | gói bên ngoài chính thức                 |
| Biến môi trường xác thực | `GROQ_API_KEY`                         |
| API                    | tương thích với OpenAI (`openai-completions`) |
| URL cơ sở              | `https://api.groq.com/openai/v1`         |
| Phiên âm âm thanh      | `whisper-large-v3-turbo` (mặc định)      |
| Mặc định trò chuyện được đề xuất | `groq/llama-3.3-70b-versatile` |

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Get an API key">
    Tạo một khóa API tại [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify the catalog is reachable">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Ví dụ tệp cấu hình

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Danh mục tích hợp sẵn

OpenClaw cung cấp danh mục Groq dựa trên manifest với cả các mục có suy luận và không suy luận. Chạy `openclaw models list --provider groq` để xem các hàng tĩnh cho phiên bản đã cài đặt của bạn, hoặc kiểm tra [console.groq.com/docs/models](https://console.groq.com/docs/models) để xem danh sách chính thức của Groq.

| Tham chiếu mô hình                              | Tên                     | Suy luận | Đầu vào              | Ngữ cảnh |
| ------------------------------------------------ | ----------------------- | -------- | -------------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | không    | văn bản              | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | không    | văn bản              | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | không    | văn bản + hình ảnh   | 131,072  |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | có       | văn bản              | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | có       | văn bản              | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | có       | văn bản              | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | có       | văn bản              | 131,072  |
| `groq/groq/compound`                             | Compound                | có       | văn bản              | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | có       | văn bản              | 131,072  |

<Tip>
  Danh mục phát triển theo từng bản phát hành OpenClaw. `openclaw models list --provider groq` hiển thị các hàng mà phiên bản đã cài đặt của bạn biết đến; đối chiếu với [console.groq.com/docs/models](https://console.groq.com/docs/models) để xem các mô hình mới được thêm hoặc đã ngừng dùng.
</Tip>

## Mô hình suy luận

OpenClaw ánh xạ các mức `/think` dùng chung của mình sang các giá trị `reasoning_effort` dành riêng cho mô hình của Groq:

- Với `qwen/qwen3-32b`, tắt suy nghĩ sẽ gửi `none` và bật suy nghĩ sẽ gửi `default`.
- Với các mô hình suy luận Groq GPT OSS (`openai/gpt-oss-*`), OpenClaw gửi `low`, `medium`, hoặc `high` dựa trên mức `/think`. Tắt suy nghĩ sẽ bỏ qua `reasoning_effort` vì các mô hình đó không hỗ trợ giá trị tắt.
- DeepSeek R1 Distill, Qwen QwQ, và Compound sử dụng bề mặt suy luận gốc của Groq; `/think` kiểm soát khả năng hiển thị nhưng mô hình luôn suy luận.

Xem [Chế độ suy nghĩ](/vi/tools/thinking) để biết các mức `/think` dùng chung và cách OpenClaw chuyển đổi chúng theo từng nhà cung cấp.

## Phiên âm âm thanh

Plugin của Groq cũng đăng ký một **nhà cung cấp hiểu phương tiện âm thanh** để có thể phiên âm tin nhắn thoại thông qua bề mặt `tools.media.audio` dùng chung.

| Thuộc tính              | Giá trị                                   |
| ----------------------- | ---------------------------------------- |
| Đường dẫn cấu hình dùng chung | `tools.media.audio`               |
| URL cơ sở mặc định      | `https://api.groq.com/openai/v1`         |
| Mô hình mặc định        | `whisper-large-v3-turbo`                 |
| Độ ưu tiên tự động      | 20                                       |
| Điểm cuối API           | `/audio/transcriptions` tương thích với OpenAI |

Để đặt Groq làm backend âm thanh mặc định:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Environment availability for the daemon">
    Nếu Gateway chạy dưới dạng dịch vụ được quản lý (launchd, systemd, Docker), `GROQ_API_KEY` phải hiển thị với tiến trình đó, không chỉ với shell tương tác của bạn.

    <Warning>
      Khóa chỉ được export trong shell tương tác sẽ không giúp ích cho daemon launchd hoặc systemd trừ khi môi trường đó cũng được nhập vào đó. Đặt khóa trong `~/.openclaw/.env` hoặc qua `env.shellEnv` để tiến trình Gateway có thể đọc được.
    </Warning>

  </Accordion>

  <Accordion title="Custom Groq model ids">
    OpenClaw chấp nhận bất kỳ ID mô hình Groq nào tại runtime. Dùng đúng ID mà Groq hiển thị và thêm tiền tố `groq/`. Danh mục tĩnh bao phủ các trường hợp phổ biến; các ID không có trong danh mục sẽ dùng mẫu tương thích với OpenAI mặc định.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model providers" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Thinking modes" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận và tương tác với chính sách nhà cung cấp.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Sơ đồ cấu hình đầy đủ bao gồm thiết lập nhà cung cấp và âm thanh.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Bảng điều khiển Groq, tài liệu API, và giá.
  </Card>
</CardGroup>
