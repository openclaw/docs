---
read_when:
    - Bạn muốn sử dụng DeepSeek với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập DeepSeek (xác thực + lựa chọn mô hình)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:02:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) cung cấp các mô hình AI mạnh mẽ với API tương thích với OpenAI.

| Thuộc tính | Giá trị                    |
| -------- | -------------------------- |
| Nhà cung cấp | `deepseek`                 |
| Xác thực | `DEEPSEEK_API_KEY`         |
| API      | Tương thích với OpenAI          |
| URL cơ sở | `https://api.deepseek.com` |

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Get your API key">
    Tạo khóa API tại [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Lệnh này sẽ nhắc bạn nhập khóa API và đặt `deepseek/deepseek-v4-flash` làm mô hình mặc định.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Để kiểm tra danh mục tĩnh của Plugin mà không cần Gateway đang chạy,
    hãy dùng:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Với các bản cài đặt theo kịch bản hoặc không có giao diện, truyền trực tiếp tất cả các cờ:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `DEEPSEEK_API_KEY`
khả dụng cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua
`env.shellEnv`).
</Warning>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình             | Tên               | Đầu vào | Ngữ cảnh  | Đầu ra tối đa | Ghi chú                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | văn bản  | 1,000,000 | 384,000    | Mô hình mặc định; bề mặt V4 có khả năng suy luận |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | văn bản  | 1,000,000 | 384,000    | Bề mặt V4 có khả năng suy luận                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | văn bản  | 131,072   | 8,192      | Bề mặt V3.2 không suy luận của DeepSeek         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | văn bản  | 131,072   | 65,536     | Bề mặt V3.2 có bật suy luận             |

<Tip>
Các mô hình V4 hỗ trợ điều khiển `thinking` của DeepSeek. OpenClaw cũng phát lại
`reasoning_content` của DeepSeek trong các lượt tiếp theo để các phiên suy luận có lệnh gọi công cụ
có thể tiếp tục.
Dùng `/think xhigh` hoặc `/think max` với các mô hình DeepSeek V4 để yêu cầu
`reasoning_effort` tối đa của DeepSeek.
</Tip>

## Suy luận và công cụ

Các phiên suy luận DeepSeek V4 có hợp đồng phát lại nghiêm ngặt hơn hầu hết
các nhà cung cấp tương thích với OpenAI: sau khi một lượt có bật suy luận sử dụng công cụ, DeepSeek
kỳ vọng các tin nhắn trợ lý được phát lại từ lượt đó bao gồm
`reasoning_content` trong các yêu cầu tiếp theo. OpenClaw xử lý việc này bên trong
Plugin DeepSeek, nên việc sử dụng công cụ qua nhiều lượt bình thường hoạt động với
`deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro`.

Nếu bạn chuyển một phiên hiện có từ một nhà cung cấp tương thích với OpenAI khác sang
mô hình DeepSeek V4, các lượt gọi công cụ của trợ lý cũ hơn có thể không có
`reasoning_content` gốc của DeepSeek. OpenClaw điền trường còn thiếu đó trên các
tin nhắn trợ lý được phát lại cho các yêu cầu suy luận DeepSeek V4 để nhà cung cấp có thể chấp nhận
lịch sử mà không cần `/new`.

Khi suy luận bị tắt trong OpenClaw (bao gồm lựa chọn **None** trong giao diện),
OpenClaw gửi DeepSeek `thinking: { type: "disabled" }` và loại bỏ
`reasoning_content` được phát lại khỏi lịch sử gửi đi. Điều này giữ các phiên tắt suy luận
trên đường dẫn DeepSeek không suy luận.

Dùng `deepseek/deepseek-v4-flash` cho đường dẫn nhanh mặc định. Dùng
`deepseek/deepseek-v4-pro` khi bạn muốn mô hình V4 mạnh hơn và có thể chấp nhận
chi phí hoặc độ trễ cao hơn.

## Kiểm thử trực tiếp

Bộ kiểm thử mô hình trực tiếp bao gồm DeepSeek V4 trong tập mô hình hiện đại. Để
chỉ chạy các kiểm tra mô hình trực tiếp DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Kiểm tra trực tiếp đó xác minh cả hai mô hình V4 đều có thể hoàn tất và các lượt tiếp theo về suy luận/công cụ
giữ nguyên tải phát lại mà DeepSeek yêu cầu.

## Ví dụ cấu hình

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho tác nhân, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
