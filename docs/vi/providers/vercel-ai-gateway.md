---
read_when:
    - Bạn muốn sử dụng Vercel AI Gateway với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc tùy chọn xác thực CLI
summary: Thiết lập Vercel AI Gateway (xác thực + lựa chọn mô hình)
title: Gateway AI của Vercel
x-i18n:
    generated_at: "2026-07-12T08:20:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) cung cấp một API hợp nhất để
truy cập hàng trăm mô hình thông qua một điểm cuối duy nhất.

| Thuộc tính       | Giá trị                                |
| ---------------- | -------------------------------------- |
| Nhà cung cấp     | `vercel-ai-gateway`                    |
| Gói              | `@openclaw/vercel-ai-gateway-provider` |
| Xác thực         | `AI_GATEWAY_API_KEY`                   |
| API              | Tương thích với Anthropic Messages     |
| URL cơ sở        | `https://ai-gateway.vercel.sh`         |
| Danh mục mô hình | Tự động phát hiện qua `/v1/models`     |

<Tip>
OpenClaw tự động phát hiện danh mục `/v1/models` của Gateway, vì vậy cả lệnh trò chuyện
`/models vercel-ai-gateway` và
`openclaw models list --provider vercel-ai-gateway` đều bao gồm các tham chiếu mô hình
hiện tại như `vercel-ai-gateway/openai/gpt-5.5` và
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Bắt đầu

<Steps>
  <Step title="Cài đặt plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Đặt khóa API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Đặt mô hình mặc định">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="Xác minh mô hình khả dụng">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Ví dụ không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Dạng viết tắt của mã định danh mô hình

OpenClaw chuẩn hóa các tham chiếu mô hình Claude dạng viết tắt trong thời gian chạy:

| Đầu vào viết tắt                    | Tham chiếu mô hình đã chuẩn hóa               |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Bạn có thể sử dụng một trong hai dạng trong cấu hình; OpenClaw tự động phân giải
tham chiếu `anthropic/...` chính tắc.
</Tip>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Biến môi trường cho các tiến trình daemon">
    Nếu OpenClaw Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo
    tiến trình đó có thể truy cập `AI_GATEWAY_API_KEY`.

    <Warning>
    Khóa chỉ được xuất trong shell tương tác sẽ không hiển thị với daemon
    launchd/systemd, trừ khi môi trường đó được nhập một cách tường minh. Hãy đặt
    khóa trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv` để đảm bảo tiến trình
    Gateway có thể đọc khóa.
    </Warning>

  </Accordion>

  <Accordion title="Định tuyến nhà cung cấp">
    Vercel AI Gateway định tuyến từng yêu cầu đến nhà cung cấp thượng nguồn được nêu trong
    tiền tố tham chiếu mô hình. Ví dụ: `vercel-ai-gateway/anthropic/claude-opus-4.6`
    định tuyến qua Anthropic, `vercel-ai-gateway/openai/gpt-5.5` định tuyến qua
    OpenAI và `vercel-ai-gateway/moonshotai/kimi-k2.6` định tuyến qua
    MoonshotAI. Một `AI_GATEWAY_API_KEY` xác thực tất cả các nhà cung cấp thượng nguồn.
  </Accordion>
  <Accordion title="Mức độ suy nghĩ">
    Các tùy chọn `/think` tuân theo tiền tố mô hình thượng nguồn khi OpenClaw nhận diện
    được tiền tố đó. `vercel-ai-gateway/anthropic/...` sử dụng hồ sơ suy nghĩ của Claude,
    bao gồm chế độ mặc định thích ứng cho các mô hình Claude 4.6. Các tham chiếu
    `vercel-ai-gateway/openai/...` đáng tin cậy (`gpt-5.2` trở lên, cùng các biến thể
    Codex đến `gpt-5.1-codex`) cung cấp `/think xhigh`. Các tham chiếu có không gian tên
    khác giữ nguyên các mức suy luận tiêu chuẩn, trừ khi siêu dữ liệu danh mục của chúng
    khai báo thêm.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Lựa chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Hướng dẫn khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
