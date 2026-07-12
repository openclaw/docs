---
read_when:
    - Bạn muốn sử dụng Cloudflare AI Gateway với OpenClaw
    - Bạn cần ID tài khoản, ID Gateway hoặc biến môi trường chứa khóa API
summary: Thiết lập Cloudflare AI Gateway (xác thực + lựa chọn mô hình)
title: Gateway AI của Cloudflare
x-i18n:
    generated_at: "2026-07-12T08:15:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) nằm phía trước các API của nhà cung cấp và bổ sung khả năng phân tích, lưu vào bộ nhớ đệm cùng các biện pháp kiểm soát. Đối với Anthropic, OpenClaw sử dụng Anthropic Messages API thông qua điểm cuối Gateway của bạn.

| Thuộc tính       | Giá trị                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Nhà cung cấp     | `cloudflare-ai-gateway`                                                                              |
| Plugin           | gói bên ngoài chính thức (`@openclaw/cloudflare-ai-gateway-provider`)                                |
| URL cơ sở        | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                            |
| Mô hình mặc định | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                            |
| Khóa API         | `CLOUDFLARE_AI_GATEWAY_API_KEY` (khóa API của nhà cung cấp dùng cho các yêu cầu thông qua Gateway)   |

<Note>
Đối với các mô hình Anthropic được định tuyến qua Cloudflare AI Gateway, hãy dùng **khóa API Anthropic** của bạn làm khóa nhà cung cấp.
</Note>

Khi chế độ suy luận được bật cho các mô hình Anthropic Messages, OpenClaw loại bỏ các lượt điền trước cuối cùng của trợ lý trước khi gửi tải trọng qua Cloudflare AI Gateway.
Anthropic từ chối việc điền trước phản hồi khi bật chế độ suy luận mở rộng, trong khi tính năng điền trước thông thường không dùng chế độ suy luận vẫn khả dụng.

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API của nhà cung cấp và thông tin Gateway">
    Chạy quy trình thiết lập ban đầu và chọn tùy chọn xác thực Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Thao tác này sẽ yêu cầu ID tài khoản, ID gateway và khóa API của bạn.

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

Đối với thiết lập bằng tập lệnh hoặc CI, hãy truyền tất cả giá trị trên dòng lệnh:

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
  <Accordion title="Gateway có xác thực">
    Nếu bạn đã bật tính năng xác thực Gateway trong Cloudflare, hãy thêm tiêu đề `cf-aig-authorization`. Tiêu đề này được dùng **ngoài** khóa API của nhà cung cấp.

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
    Tiêu đề `cf-aig-authorization` dùng để xác thực với chính Cloudflare Gateway, còn khóa API của nhà cung cấp (ví dụ: khóa Anthropic của bạn) dùng để xác thực với nhà cung cấp thượng nguồn.
    </Tip>

  </Accordion>

  <Accordion title="Lưu ý về môi trường">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy bảo đảm tiến trình đó có thể truy cập `CLOUDFLARE_AI_GATEWAY_API_KEY`.

    <Warning>
    Khóa chỉ được xuất trong shell tương tác sẽ không có tác dụng với daemon launchd/systemd, trừ khi môi trường đó cũng được nhập vào daemon. Hãy đặt khóa trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv` để bảo đảm tiến trình gateway có thể đọc khóa.
    </Warning>

  </Accordion>
</AccordionGroup>

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cách chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Hướng dẫn khắc phục sự cố chung và các câu hỏi thường gặp.
  </Card>
</CardGroup>
