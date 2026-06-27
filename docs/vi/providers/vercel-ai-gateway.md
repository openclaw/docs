---
read_when:
    - Bạn muốn sử dụng Vercel AI Gateway với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập Vercel AI Gateway (xác thực + chọn mô hình)
title: Cổng Vercel AI
x-i18n:
    generated_at: "2026-06-27T18:06:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) cung cấp một API hợp nhất để
truy cập hàng trăm mô hình thông qua một endpoint duy nhất.

| Thuộc tính     | Giá trị                                |
| -------------- | -------------------------------------- |
| Nhà cung cấp   | `vercel-ai-gateway`                    |
| Gói            | `@openclaw/vercel-ai-gateway-provider` |
| Xác thực       | `AI_GATEWAY_API_KEY`                   |
| API            | tương thích với Anthropic Messages     |
| Danh mục mô hình | Tự động phát hiện qua `/v1/models`   |

<Tip>
OpenClaw tự động phát hiện danh mục Gateway `/v1/models`, vì vậy
`/models vercel-ai-gateway` bao gồm các tham chiếu mô hình hiện tại như
`vercel-ai-gateway/openai/gpt-5.5` và
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
    Chạy quá trình onboarding và chọn tùy chọn xác thực AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Đặt mô hình mặc định">
    Thêm mô hình vào cấu hình OpenClaw của bạn:

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
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Ví dụ không tương tác

Đối với thiết lập bằng script hoặc CI, hãy truyền tất cả giá trị trên dòng lệnh:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Cách viết tắt ID mô hình

OpenClaw chấp nhận các tham chiếu mô hình viết tắt Vercel Claude và chuẩn hóa chúng trong
runtime:

| Đầu vào viết tắt                    | Tham chiếu mô hình đã chuẩn hóa              |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Bạn có thể dùng tham chiếu mô hình dạng viết tắt hoặc dạng đầy đủ trong
cấu hình của mình. OpenClaw tự động phân giải về dạng chính tắc.
</Tip>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Biến môi trường cho tiến trình daemon">
    Nếu OpenClaw Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo
    `AI_GATEWAY_API_KEY` có sẵn cho tiến trình đó.

    <Warning>
    Khóa chỉ được export trong shell tương tác sẽ không hiển thị với daemon
    launchd/systemd trừ khi môi trường đó được nhập một cách rõ ràng. Đặt
    khóa trong `~/.openclaw/.env` hoặc qua `env.shellEnv` để đảm bảo tiến trình
    gateway có thể đọc được.
    </Warning>

  </Accordion>

  <Accordion title="Định tuyến nhà cung cấp">
    Vercel AI Gateway định tuyến yêu cầu đến nhà cung cấp upstream dựa trên tiền tố
    tham chiếu mô hình. Ví dụ, `vercel-ai-gateway/anthropic/claude-opus-4.6` định tuyến
    qua Anthropic, trong khi `vercel-ai-gateway/openai/gpt-5.5` định tuyến qua
    OpenAI và `vercel-ai-gateway/moonshotai/kimi-k2.6` định tuyến qua
    MoonshotAI. Một `AI_GATEWAY_API_KEY` duy nhất của bạn xử lý xác thực cho tất cả
    nhà cung cấp upstream.
  </Accordion>
  <Accordion title="Mức thinking">
    Các tùy chọn `/think` tuân theo tiền tố mô hình upstream đáng tin cậy khi OpenClaw biết
    hợp đồng của nhà cung cấp upstream. `vercel-ai-gateway/anthropic/...` dùng hồ sơ
    thinking của Claude, bao gồm các mặc định thích ứng cho mô hình Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` và các tham chiếu kiểu Codex cung cấp
    `/think xhigh` giống như các nhà cung cấp OpenAI/OpenAI Codex trực tiếp. Các tham chiếu
    có namespace khác giữ các mức reasoning thông thường trừ khi metadata danh mục của chúng
    khai báo thêm.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và FAQ.
  </Card>
</CardGroup>
