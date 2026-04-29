---
read_when:
    - Bạn muốn sử dụng DeepSeek với OpenClaw
    - Bạn cần biến môi trường chứa khóa API hoặc tùy chọn xác thực CLI
summary: Thiết lập DeepSeek (xác thực + lựa chọn mô hình)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-29T23:05:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
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
  <Step title="Lấy API key của bạn">
    Tạo API key tại [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Lệnh này sẽ nhắc nhập API key của bạn và đặt `deepseek/deepseek-v4-flash` làm mô hình mặc định.

  </Step>
  <Step title="Xác minh các mô hình có sẵn">
    ```bash
    openclaw models list --provider deepseek
    ```

    Để kiểm tra danh mục tĩnh được đóng gói sẵn mà không yêu cầu Gateway đang chạy,
    hãy dùng:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Thiết lập không tương tác">
    Đối với cài đặt theo script hoặc không có giao diện, truyền trực tiếp tất cả flag:

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
có sẵn cho tiến trình đó (ví dụ: trong `~/.openclaw/.env` hoặc thông qua
`env.shellEnv`).
</Warning>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình           | Tên               | Đầu vào | Ngữ cảnh  | Đầu ra tối đa | Ghi chú                                    |
| ---------------------------- | ----------------- | ------- | --------- | ------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000       | Mô hình mặc định; bề mặt V4 hỗ trợ thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000       | Bề mặt V4 hỗ trợ thinking                  |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192         | Bề mặt DeepSeek V3.2 không thinking        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536        | Bề mặt V3.2 bật reasoning                  |

<Tip>
Các mô hình V4 hỗ trợ điều khiển `thinking` của DeepSeek. OpenClaw cũng phát lại
`reasoning_content` của DeepSeek trong các lượt tiếp theo để các phiên thinking có lệnh gọi công cụ
có thể tiếp tục.
</Tip>

## Thinking và công cụ

Các phiên thinking của DeepSeek V4 có hợp đồng phát lại nghiêm ngặt hơn hầu hết
các nhà cung cấp tương thích với OpenAI: sau khi một lượt bật thinking dùng công cụ, DeepSeek
kỳ vọng các tin nhắn assistant được phát lại từ lượt đó bao gồm
`reasoning_content` trong các yêu cầu tiếp theo. OpenClaw xử lý việc này bên trong
Plugin DeepSeek, nên việc dùng công cụ nhiều lượt thông thường hoạt động với
`deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro`.

Nếu bạn chuyển một phiên hiện có từ nhà cung cấp tương thích với OpenAI khác sang một
mô hình DeepSeek V4, các lượt gọi công cụ của assistant cũ hơn có thể không có
`reasoning_content` gốc của DeepSeek. OpenClaw điền trường còn thiếu đó trên các
tin nhắn assistant được phát lại cho yêu cầu thinking DeepSeek V4 để nhà cung cấp có thể chấp nhận
lịch sử mà không yêu cầu `/new`.

Khi thinking bị tắt trong OpenClaw (bao gồm lựa chọn **None** trong UI),
OpenClaw gửi `thinking: { type: "disabled" }` của DeepSeek và loại bỏ
`reasoning_content` được phát lại khỏi lịch sử gửi đi. Điều này giữ các phiên tắt thinking
trên đường dẫn DeepSeek không thinking.

Dùng `deepseek/deepseek-v4-flash` cho đường dẫn nhanh mặc định. Dùng
`deepseek/deepseek-v4-pro` khi bạn muốn mô hình V4 mạnh hơn và có thể chấp nhận
chi phí hoặc độ trễ cao hơn.

## Kiểm thử live

Bộ mô hình live trực tiếp bao gồm DeepSeek V4 trong tập mô hình hiện đại. Để
chỉ chạy các kiểm tra mô hình trực tiếp của DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Kiểm tra live đó xác minh cả hai mô hình V4 đều có thể hoàn tất và các lượt tiếp theo
thinking/công cụ vẫn giữ payload phát lại mà DeepSeek yêu cầu.

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
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho agent, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
