---
read_when:
    - Bạn muốn sử dụng Cloudflare AI Gateway với OpenClaw
    - Bạn cần ID tài khoản, ID Gateway hoặc biến môi trường khóa API
summary: Thiết lập Cloudflare AI Gateway (xác thực + chọn mô hình)
title: Gateway AI của Cloudflare
x-i18n:
    generated_at: "2026-06-27T18:02:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway nằm phía trước API của nhà cung cấp và cho phép bạn thêm phân tích, bộ nhớ đệm và các biện pháp kiểm soát. Với Anthropic, OpenClaw dùng Anthropic Messages API thông qua điểm cuối Gateway của bạn.

| Thuộc tính       | Giá trị                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| Nhà cung cấp      | `cloudflare-ai-gateway`                                                                  |
| URL cơ sở      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Model mặc định | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Khóa API       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (khóa API nhà cung cấp của bạn cho các yêu cầu đi qua Gateway) |

<Note>
Với các model Anthropic được định tuyến qua Cloudflare AI Gateway, hãy dùng **khóa API Anthropic** của bạn làm khóa nhà cung cấp.
</Note>

Khi bật suy luận cho các model Anthropic Messages, OpenClaw loại bỏ các lượt
điền sẵn trợ lý ở cuối trước khi gửi payload qua Cloudflare AI Gateway.
Anthropic từ chối điền sẵn phản hồi khi dùng suy luận mở rộng, trong khi điền sẵn
thông thường không suy luận vẫn khả dụng.

## Cài đặt Plugin

Cài đặt Plugin chính thức, rồi khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Set the provider API key and Gateway details">
    Chạy onboarding và chọn tùy chọn xác thực Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Lệnh này sẽ hỏi ID tài khoản, ID gateway và khóa API của bạn.

  </Step>
  <Step title="Set a default model">
    Thêm model vào cấu hình OpenClaw của bạn:

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Ví dụ không tương tác

Với thiết lập bằng script hoặc CI, truyền tất cả giá trị trên dòng lệnh:

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
  <Accordion title="Authenticated gateways">
    Nếu bạn đã bật xác thực Gateway trong Cloudflare, hãy thêm header `cf-aig-authorization`. Đây là phần **bổ sung ngoài** khóa API nhà cung cấp của bạn.

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
    Header `cf-aig-authorization` xác thực với chính Cloudflare Gateway, còn khóa API nhà cung cấp (ví dụ: khóa Anthropic của bạn) xác thực với nhà cung cấp thượng nguồn.
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    Nếu Gateway chạy như một daemon (launchd/systemd), hãy bảo đảm `CLOUDFLARE_AI_GATEWAY_API_KEY` khả dụng cho tiến trình đó.

    <Warning>
    Khóa chỉ được export trong shell tương tác sẽ không giúp ích cho daemon launchd/systemd trừ khi môi trường đó cũng được nhập vào đó. Đặt khóa trong `~/.openclaw/.env` hoặc qua `env.shellEnv` để bảo đảm tiến trình gateway có thể đọc được.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu model và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
