---
read_when:
    - Bạn muốn sử dụng Cloudflare AI Gateway với OpenClaw
    - Bạn cần ID tài khoản, ID Gateway hoặc biến môi trường chứa khóa API
summary: Thiết lập Cloudflare AI Gateway (xác thực + lựa chọn mô hình)
title: Gateway AI của Cloudflare
x-i18n:
    generated_at: "2026-04-29T23:05:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway đứng trước các API của nhà cung cấp và cho phép bạn thêm phân tích, bộ nhớ đệm và các biện pháp kiểm soát. Với Anthropic, OpenClaw sử dụng Anthropic Messages API thông qua điểm cuối Gateway của bạn.

| Thuộc tính        | Giá trị                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| Nhà cung cấp      | `cloudflare-ai-gateway`                                                                  |
| URL cơ sở      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Mô hình mặc định | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Khóa API       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (khóa API nhà cung cấp của bạn cho các yêu cầu thông qua Gateway) |

<Note>
Với các mô hình Anthropic được định tuyến qua Cloudflare AI Gateway, hãy dùng **khóa API Anthropic** của bạn làm khóa nhà cung cấp.
</Note>

Khi bật tư duy cho các mô hình Anthropic Messages, OpenClaw sẽ loại bỏ các
lượt điền trước cuối của trợ lý trước khi gửi payload qua Cloudflare AI Gateway.
Anthropic từ chối điền trước phản hồi với tư duy mở rộng, trong khi điền trước
thông thường không dùng tư duy vẫn khả dụng.

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API nhà cung cấp và thông tin Gateway">
    Chạy quy trình giới thiệu ban đầu và chọn tùy chọn xác thực Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Lệnh này sẽ yêu cầu ID tài khoản, ID gateway và khóa API của bạn.

  </Step>
  <Step title="Đặt mô hình mặc định">
    Thêm mô hình vào cấu hình OpenClaw của bạn:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Xác minh mô hình khả dụng">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Ví dụ không tương tác

Với các thiết lập dạng script hoặc CI, hãy truyền mọi giá trị trên dòng lệnh:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Gateway đã xác thực">
    Nếu bạn đã bật xác thực Gateway trong Cloudflare, hãy thêm header `cf-aig-authorization`. Điều này **bổ sung cho** khóa API nhà cung cấp của bạn.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    Header `cf-aig-authorization` xác thực với chính Cloudflare Gateway, trong khi khóa API nhà cung cấp (ví dụ: khóa Anthropic của bạn) xác thực với nhà cung cấp thượng nguồn.
    </Tip>

  </Accordion>

  <Accordion title="Ghi chú về môi trường">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy bảo đảm `CLOUDFLARE_AI_GATEWAY_API_KEY` khả dụng cho tiến trình đó.

    <Warning>
    Một khóa chỉ nằm trong `~/.profile` sẽ không giúp ích cho daemon launchd/systemd trừ khi môi trường đó cũng được nhập vào đó. Đặt khóa trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv` để bảo đảm tiến trình gateway có thể đọc được khóa.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
