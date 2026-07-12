---
read_when:
    - Bạn muốn sử dụng Groq với OpenClaw
    - Bạn cần biến môi trường chứa khóa API hoặc lựa chọn xác thực CLI
    - Bạn đang cấu hình tính năng phiên âm thanh bằng Whisper trên Groq
summary: Thiết lập Groq (xác thực + lựa chọn mô hình + phiên âm bằng Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T08:16:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) cung cấp khả năng suy luận siêu nhanh trên các mô hình trọng số mở (Llama, Gemma, Kimi, Qwen, GPT OSS và nhiều mô hình khác) bằng phần cứng LPU tùy chỉnh. Plugin Groq đăng ký cả nhà cung cấp trò chuyện tương thích với OpenAI và nhà cung cấp hiểu nội dung phương tiện âm thanh.

| Thuộc tính                    | Giá trị                                  |
| ----------------------------- | ---------------------------------------- |
| ID nhà cung cấp               | `groq`                                   |
| Plugin                        | gói bên ngoài chính thức                 |
| Biến môi trường xác thực      | `GROQ_API_KEY`                           |
| API                           | tương thích với OpenAI (`openai-completions`) |
| URL cơ sở                     | `https://api.groq.com/openai/v1`         |
| Phiên âm âm thanh             | `whisper-large-v3-turbo` (mặc định)      |
| Mô hình trò chuyện mặc định đề xuất | `groq/llama-3.3-70b-versatile`     |

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API tại [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Đặt khóa API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Đặt mô hình mặc định">
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
  <Step title="Xác minh có thể truy cập danh mục">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Ví dụ về tệp cấu hình

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

OpenClaw cung cấp danh mục Groq dựa trên tệp kê khai, bao gồm cả các mục có suy luận và không suy luận. Chạy `openclaw models list --provider groq` để xem các hàng tĩnh dành cho phiên bản đã cài đặt của bạn hoặc kiểm tra [console.groq.com/docs/models](https://console.groq.com/docs/models) để xem danh sách chính thức từ Groq.

| Tham chiếu mô hình                               | Tên                     | Suy luận | Đầu vào        | Ngữ cảnh |
| ------------------------------------------------ | ----------------------- | -------- | --------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | không    | văn bản         | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | không    | văn bản         | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | không    | văn bản + hình ảnh | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | có       | văn bản         | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | có       | văn bản         | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | có       | văn bản         | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | có       | văn bản         | 131,072  |
| `groq/groq/compound`                             | Compound                | có       | văn bản         | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | có       | văn bản         | 131,072  |

<Tip>
  Danh mục phát triển theo từng bản phát hành OpenClaw. `openclaw models list --provider groq` hiển thị các hàng mà phiên bản đã cài đặt của bạn nhận biết; hãy đối chiếu với [console.groq.com/docs/models](https://console.groq.com/docs/models) để biết các mô hình mới được thêm hoặc đã ngừng hỗ trợ.
</Tip>

## Mô hình suy luận

Các mô hình suy luận của Groq (`reasoning: true` trong bảng trên) ánh xạ các mức `/think` dùng chung của OpenClaw sang các giá trị `reasoning_effort` là `low`, `medium` hoặc `high`. `/think off` hoặc `/think none` sẽ bỏ qua `reasoning_effort` khỏi yêu cầu thay vì gửi một giá trị vô hiệu hóa.

Xem [Chế độ tư duy](/vi/tools/thinking) để biết các mức `/think` dùng chung và cách OpenClaw chuyển đổi chúng cho từng nhà cung cấp.

## Phiên âm âm thanh

Plugin của Groq cũng đăng ký một **nhà cung cấp hiểu nội dung phương tiện âm thanh** để có thể phiên âm tin nhắn thoại thông qua bề mặt dùng chung `tools.media.audio`.

| Thuộc tính               | Giá trị                                   |
| ------------------------ | ----------------------------------------- |
| Đường dẫn cấu hình dùng chung | `tools.media.audio`                  |
| URL cơ sở mặc định       | `https://api.groq.com/openai/v1`          |
| Mô hình mặc định         | `whisper-large-v3-turbo`                  |
| Mức ưu tiên tự động      | 20                                        |
| Điểm cuối API            | `/audio/transcriptions` tương thích với OpenAI |

Để đặt Groq làm phần phụ trợ âm thanh mặc định:

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
  <Accordion title="Khả dụng của môi trường đối với tiến trình nền">
    Nếu Gateway chạy dưới dạng dịch vụ được quản lý (launchd, systemd, Docker), `GROQ_API_KEY` phải hiển thị với tiến trình đó — không chỉ với shell tương tác của bạn.

    <Warning>
      Khóa chỉ được xuất trong shell tương tác sẽ không có tác dụng với tiến trình nền launchd hoặc systemd trừ khi môi trường đó cũng được nhập vào đó. Đặt khóa trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv` để tiến trình Gateway có thể đọc được.
    </Warning>

  </Accordion>

  <Accordion title="ID mô hình Groq tùy chỉnh">
    OpenClaw chấp nhận mọi ID mô hình Groq trong thời gian chạy. Sử dụng chính xác ID do Groq hiển thị và thêm tiền tố `groq/`. Danh mục tĩnh bao gồm các trường hợp phổ biến; các ID không có trong danh mục sẽ chuyển tiếp sang mẫu tương thích với OpenAI mặc định.

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
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chế độ tư duy" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận và sự tương tác với chính sách của nhà cung cấp.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm các cài đặt nhà cung cấp và âm thanh.
  </Card>
  <Card title="Bảng điều khiển Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Bảng điều khiển, tài liệu API và thông tin giá của Groq.
  </Card>
</CardGroup>
