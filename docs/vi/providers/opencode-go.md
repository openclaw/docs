---
read_when:
    - Bạn muốn danh mục OpenCode Go
    - Bạn cần các tham chiếu mô hình runtime cho các mô hình được lưu trữ bằng Go
summary: Sử dụng danh mục OpenCode Go với thiết lập OpenCode dùng chung
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:05:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go là catalog Go trong [OpenCode](/vi/providers/opencode).
Nó dùng cùng `OPENCODE_API_KEY` như catalog Zen, nhưng giữ id nhà cung cấp runtime
`opencode-go` để định tuyến theo từng mô hình ở upstream vẫn chính xác.

| Thuộc tính          | Giá trị                         |
| ------------------- | ------------------------------- |
| Nhà cung cấp runtime | `opencode-go`                  |
| Xác thực            | `OPENCODE_API_KEY`              |
| Thiết lập cha       | [OpenCode](/vi/providers/opencode) |

## Catalog tích hợp sẵn

OpenClaw lấy hầu hết các hàng catalog Go từ registry mô hình OpenClaw được đóng gói kèm và
bổ sung các hàng upstream hiện tại trong khi registry đang bắt kịp. Chạy
`openclaw models list --provider opencode-go` để xem danh sách mô hình hiện tại.

Nhà cung cấp bao gồm:

| Tham chiếu mô hình             | Tên                   |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (giới hạn 3x) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 dùng cửa sổ ngữ cảnh 1 triệu token và hỗ trợ tối đa 131K token đầu ra.

## Bắt đầu

<Tabs>
  <Tab title="Tương tác">
    <Steps>
      <Step title="Chạy quy trình hướng dẫn ban đầu">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Đặt mô hình Go làm mặc định">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Không tương tác">
    <Steps>
      <Step title="Truyền khóa trực tiếp">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Xác minh mô hình có sẵn">
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
  <Accordion title="Hành vi định tuyến">
    OpenClaw tự động xử lý định tuyến theo từng mô hình khi tham chiếu mô hình dùng
    `opencode-go/...`. Không cần cấu hình nhà cung cấp bổ sung.
  </Accordion>

  <Accordion title="Quy ước tham chiếu runtime">
    Tham chiếu runtime luôn rõ ràng: `opencode/...` cho Zen, `opencode-go/...` cho Go.
    Điều này giữ cho định tuyến theo từng mô hình ở upstream chính xác trên cả hai catalog.
  </Accordion>

  <Accordion title="Thông tin đăng nhập dùng chung">
    Cùng một `OPENCODE_API_KEY` được cả catalog Zen và Go sử dụng. Việc nhập
    khóa trong quá trình thiết lập sẽ lưu thông tin đăng nhập cho cả hai nhà cung cấp runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Xem [OpenCode](/vi/providers/opencode) để biết tổng quan hướng dẫn thiết lập dùng chung và tham chiếu catalog
Zen + Go đầy đủ.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="OpenCode (cha)" href="/vi/providers/opencode" icon="server">
    Hướng dẫn thiết lập dùng chung, tổng quan catalog và ghi chú nâng cao.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
