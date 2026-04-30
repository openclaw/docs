---
read_when:
    - Bạn muốn sử dụng DeepSeek với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập DeepSeek (xác thực + lựa chọn mô hình)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T16:29:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) cung cấp các mô hình AI mạnh mẽ với API tương thích với OpenAI.

| Thuộc tính | Giá trị                    |
| ---------- | -------------------------- |
| Nhà cung cấp | `deepseek`               |
| Xác thực   | `DEEPSEEK_API_KEY`         |
| API        | Tương thích với OpenAI     |
| URL cơ sở  | `https://api.deepseek.com` |

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API của bạn">
    Tạo khóa API tại [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Chạy quy trình onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Lệnh này sẽ yêu cầu khóa API của bạn và đặt `deepseek/deepseek-v4-flash` làm mô hình mặc định.

  </Step>
  <Step title="Xác minh các mô hình có sẵn">
    ```bash
    openclaw models list --provider deepseek
    ```

    Để kiểm tra danh mục tĩnh đi kèm mà không cần Gateway đang chạy,
    hãy dùng:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Thiết lập không tương tác">
    Với các bản cài đặt theo script hoặc không có giao diện, truyền trực tiếp tất cả cờ:

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
có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua
`env.shellEnv`).
</Warning>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình           | Tên               | Đầu vào | Ngữ cảnh  | Đầu ra tối đa | Ghi chú                                      |
| ---------------------------- | ----------------- | ------- | --------- | ------------- | -------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000       | Mô hình mặc định; bề mặt V4 hỗ trợ suy nghĩ  |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000       | Bề mặt V4 hỗ trợ suy nghĩ                    |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192         | Bề mặt DeepSeek V3.2 không suy nghĩ          |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536        | Bề mặt V3.2 hỗ trợ lập luận                  |

<Tip>
Các mô hình V4 hỗ trợ điều khiển `thinking` của DeepSeek. OpenClaw cũng phát lại
`reasoning_content` của DeepSeek trong các lượt tiếp theo để các phiên suy nghĩ có lệnh gọi công cụ
có thể tiếp tục.
Dùng `/think xhigh` hoặc `/think max` với các mô hình DeepSeek V4 để yêu cầu
`reasoning_effort` tối đa của DeepSeek.
</Tip>

## Suy nghĩ và công cụ

Các phiên suy nghĩ của DeepSeek V4 có hợp đồng phát lại nghiêm ngặt hơn hầu hết
nhà cung cấp tương thích với OpenAI: sau khi một lượt bật suy nghĩ sử dụng công cụ, DeepSeek
kỳ vọng các thông điệp assistant được phát lại từ lượt đó bao gồm
`reasoning_content` trong các yêu cầu tiếp theo. OpenClaw xử lý việc này bên trong
Plugin DeepSeek, nên việc dùng công cụ nhiều lượt thông thường hoạt động với
`deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro`.

Nếu bạn chuyển một phiên hiện có từ một nhà cung cấp tương thích với OpenAI khác sang
mô hình DeepSeek V4, các lượt gọi công cụ cũ của assistant có thể không có
`reasoning_content` gốc của DeepSeek. OpenClaw điền trường còn thiếu đó trên các
thông điệp assistant được phát lại cho yêu cầu suy nghĩ DeepSeek V4 để nhà cung cấp có thể chấp nhận
lịch sử mà không cần `/new`.

Khi suy nghĩ bị tắt trong OpenClaw (bao gồm lựa chọn **None** trong UI),
OpenClaw gửi DeepSeek `thinking: { type: "disabled" }` và loại bỏ
`reasoning_content` được phát lại khỏi lịch sử gửi đi. Điều này giữ các
phiên tắt suy nghĩ trên đường dẫn DeepSeek không suy nghĩ.

Dùng `deepseek/deepseek-v4-flash` cho đường dẫn nhanh mặc định. Dùng
`deepseek/deepseek-v4-pro` khi bạn muốn mô hình V4 mạnh hơn và có thể chấp nhận
chi phí hoặc độ trễ cao hơn.

## Kiểm thử live

Bộ kiểm thử live mô hình trực tiếp bao gồm DeepSeek V4 trong tập mô hình hiện đại. Để
chỉ chạy các kiểm tra mô hình trực tiếp DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Kiểm tra live đó xác minh cả hai mô hình V4 có thể hoàn tất và các lượt tiếp theo
suy nghĩ/công cụ bảo toàn payload phát lại mà DeepSeek yêu cầu.

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
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho agent, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
