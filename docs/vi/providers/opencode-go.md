---
read_when:
    - Bạn muốn danh mục OpenCode Go
    - Bạn cần các tham chiếu mô hình thời gian chạy cho các mô hình do Go lưu trữ
summary: Sử dụng danh mục OpenCode Go với thiết lập OpenCode dùng chung
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-29T23:08:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go là danh mục Go trong [OpenCode](/vi/providers/opencode).
Nó dùng cùng `OPENCODE_API_KEY` như danh mục Zen, nhưng giữ id provider runtime
`opencode-go` để định tuyến theo từng mô hình ở upstream luôn chính xác.

| Thuộc tính       | Giá trị                         |
| ---------------- | ------------------------------- |
| Provider runtime | `opencode-go`                   |
| Xác thực         | `OPENCODE_API_KEY`              |
| Thiết lập cha    | [OpenCode](/vi/providers/opencode) |

## Danh mục tích hợp sẵn

OpenClaw lấy hầu hết các hàng trong danh mục Go từ registry mô hình pi được đóng gói kèm và
bổ sung các hàng upstream hiện tại trong khi registry bắt kịp. Chạy
`openclaw models list --provider opencode-go` để xem danh sách mô hình hiện tại.

Provider bao gồm:

| Tham chiếu mô hình             | Tên                   |
| ------------------------------ | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (giới hạn 3x) |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

## Bắt đầu

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Set a Go model as default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Pass the key directly">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Ví dụ cấu hình

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Routing behavior">
    OpenClaw tự động xử lý định tuyến theo từng mô hình khi tham chiếu mô hình dùng
    `opencode-go/...`. Không cần cấu hình provider bổ sung.
  </Accordion>

  <Accordion title="Runtime ref convention">
    Tham chiếu runtime vẫn rõ ràng: `opencode/...` cho Zen, `opencode-go/...` cho Go.
    Điều này giữ cho định tuyến theo từng mô hình ở upstream chính xác trên cả hai danh mục.
  </Accordion>

  <Accordion title="Shared credentials">
    Cùng một `OPENCODE_API_KEY` được dùng bởi cả danh mục Zen và Go. Việc nhập
    khóa trong quá trình thiết lập sẽ lưu thông tin xác thực cho cả hai provider runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Xem [OpenCode](/vi/providers/opencode) để biết tổng quan onboarding dùng chung và tài liệu tham khảo đầy đủ
về danh mục Zen + Go.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/vi/providers/opencode" icon="server">
    Onboarding dùng chung, tổng quan danh mục và ghi chú nâng cao.
  </Card>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
