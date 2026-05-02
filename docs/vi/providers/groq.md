---
read_when:
    - Bạn muốn sử dụng Groq với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập Groq (xác thực + chọn mô hình)
title: Groq
x-i18n:
    generated_at: "2026-05-02T10:50:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) cung cấp suy luận siêu nhanh trên các mô hình mã nguồn mở
(Llama, Gemma, Mistral và nhiều mô hình khác) bằng phần cứng LPU tùy chỉnh. OpenClaw kết nối
với Groq thông qua API tương thích với OpenAI của Groq.

| Thuộc tính | Giá trị             |
| -------- | ----------------- |
| Nhà cung cấp | `groq`            |
| Xác thực     | `GROQ_API_KEY`    |
| API      | Tương thích với OpenAI |

## Bắt đầu

<Steps>
  <Step title="Nhận khóa API">
    Tạo khóa API tại [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Đặt khóa API">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

OpenClaw đi kèm một danh mục Groq dựa trên manifest để liệt kê mô hình nhanh
được lọc theo nhà cung cấp. Chạy `openclaw models list --all --provider groq` để xem các
hàng được đóng gói sẵn, hoặc xem
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Mô hình                       | Ghi chú                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Mục đích chung, ngữ cảnh lớn     |
| **Llama 3.1 8B Instant**    | Nhanh, nhẹ                  |
| **Gemma 2 9B**              | Nhỏ gọn, hiệu quả                 |
| **Mixtral 8x7B**            | Kiến trúc MoE, suy luận mạnh |

<Tip>
Dùng `openclaw models list --all --provider groq` để xem các hàng Groq dựa trên manifest
mà phiên bản OpenClaw này biết đến.
</Tip>

## Mô hình suy luận

OpenClaw ánh xạ các mức `/think` dùng chung của mình sang các giá trị
`reasoning_effort` riêng theo mô hình của Groq. Với `qwen/qwen3-32b`, tắt suy nghĩ sẽ gửi
`none` và bật suy nghĩ sẽ gửi `default`. Với các mô hình suy luận GPT-OSS của Groq,
OpenClaw gửi `low`, `medium`, hoặc `high`; tắt suy nghĩ sẽ bỏ qua
`reasoning_effort` vì các mô hình đó không hỗ trợ giá trị tắt.

## Phiên âm âm thanh

Groq cũng cung cấp phiên âm âm thanh nhanh dựa trên Whisper. Khi được cấu hình làm
nhà cung cấp hiểu nội dung media, OpenClaw dùng mô hình `whisper-large-v3-turbo`
của Groq để phiên âm tin nhắn thoại thông qua bề mặt `tools.media.audio`
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
  <Accordion title="Chi tiết phiên âm âm thanh">
    | Thuộc tính | Giá trị |
    |----------|-------|
    | Đường dẫn cấu hình dùng chung | `tools.media.audio` |
    | URL cơ sở mặc định   | `https://api.groq.com/openai/v1` |
    | Mô hình mặc định      | `whisper-large-v3-turbo` |
    | Điểm cuối API       | `/audio/transcriptions` tương thích với OpenAI |
  </Accordion>

  <Accordion title="Ghi chú về môi trường">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `GROQ_API_KEY` có
    sẵn cho tiến trình đó (ví dụ: trong `~/.openclaw/.env` hoặc thông qua
    `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với các
    tiến trình gateway do daemon quản lý. Dùng cấu hình `~/.openclaw/.env` hoặc `env.shellEnv` để
    khả dụng bền vững.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm cài đặt nhà cung cấp và âm thanh.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Bảng điều khiển Groq, tài liệu API và giá.
  </Card>
  <Card title="Danh sách mô hình Groq" href="https://console.groq.com/docs/models" icon="list">
    Danh mục mô hình Groq chính thức.
  </Card>
</CardGroup>
