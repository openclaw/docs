---
read_when:
    - Bạn muốn sử dụng Groq với OpenClaw
    - Bạn cần biến môi trường cho khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập Groq (xác thực + chọn mô hình)
title: Groq
x-i18n:
    generated_at: "2026-04-29T23:06:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) cung cấp khả năng suy luận siêu nhanh trên các mô hình mã nguồn mở
(Llama, Gemma, Mistral, và nhiều mô hình khác) bằng phần cứng LPU tùy chỉnh. OpenClaw kết nối
với Groq thông qua API tương thích OpenAI của Groq.

| Thuộc tính | Giá trị             |
| -------- | ----------------- |
| Nhà cung cấp | `groq`            |
| Xác thực     | `GROQ_API_KEY`    |
| API      | Tương thích OpenAI |

## Bắt đầu

<Steps>
  <Step title="Get an API key">
    Tạo khóa API tại [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

Danh mục mô hình của Groq thay đổi thường xuyên. Chạy `openclaw models list | grep groq`
để xem các mô hình hiện có, hoặc kiểm tra
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Mô hình                       | Ghi chú                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Mục đích chung, ngữ cảnh lớn     |
| **Llama 3.1 8B Instant**    | Nhanh, nhẹ                  |
| **Gemma 2 9B**              | Nhỏ gọn, hiệu quả                 |
| **Mixtral 8x7B**            | Kiến trúc MoE, suy luận mạnh |

<Tip>
Dùng `openclaw models list --provider groq` để có danh sách mới nhất về
các mô hình có trong tài khoản của bạn.
</Tip>

## Mô hình suy luận

OpenClaw ánh xạ các mức `/think` dùng chung của mình sang các giá trị
`reasoning_effort` riêng theo mô hình của Groq. Với `qwen/qwen3-32b`, việc tắt suy nghĩ gửi
`none` và bật suy nghĩ gửi `default`. Với các mô hình suy luận GPT-OSS của Groq,
OpenClaw gửi `low`, `medium`, hoặc `high`; khi tắt suy nghĩ thì bỏ qua
`reasoning_effort` vì các mô hình đó không hỗ trợ giá trị tắt.

## Chuyển âm thanh thành văn bản

Groq cũng cung cấp tính năng chuyển âm thanh thành văn bản nhanh dựa trên Whisper. Khi được cấu hình làm
nhà cung cấp hiểu phương tiện, OpenClaw dùng mô hình `whisper-large-v3-turbo`
của Groq để chuyển các tin nhắn thoại thành văn bản thông qua bề mặt `tools.media.audio`
dùng chung.

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
  <Accordion title="Audio transcription details">
    | Thuộc tính | Giá trị |
    |----------|-------|
    | Đường dẫn cấu hình dùng chung | `tools.media.audio` |
    | URL cơ sở mặc định   | `https://api.groq.com/openai/v1` |
    | Mô hình mặc định      | `whisper-large-v3-turbo` |
    | Điểm cuối API       | `/audio/transcriptions` tương thích OpenAI |
  </Accordion>

  <Accordion title="Environment note">
    Nếu Gateway chạy như một daemon (launchd/systemd), hãy bảo đảm `GROQ_API_KEY`
    có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua
    `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với
    các tiến trình gateway do daemon quản lý. Dùng cấu hình `~/.openclaw/.env` hoặc `env.shellEnv` để
    bảo đảm luôn có sẵn.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ bao gồm cài đặt nhà cung cấp và âm thanh.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Bảng điều khiển Groq, tài liệu API và giá.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    Danh mục mô hình chính thức của Groq.
  </Card>
</CardGroup>
