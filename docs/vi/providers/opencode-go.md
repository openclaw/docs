---
read_when:
    - Bạn muốn danh mục OpenCode Go
    - Bạn cần các tham chiếu mô hình thời gian chạy cho các mô hình được lưu trữ trên Go
summary: Sử dụng danh mục OpenCode Go với thiết lập OpenCode dùng chung
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T08:21:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go là danh mục Go trong [OpenCode](/vi/providers/opencode). Danh mục này dùng chung
thông tin xác thực `OPENCODE_API_KEY` với danh mục Zen, nhưng vẫn giữ mã định danh
nhà cung cấp thời gian chạy riêng (`opencode-go`) để việc định tuyến theo từng mô hình
ở thượng nguồn luôn chính xác.

| Thuộc tính                | Giá trị                                            |
| ------------------------- | -------------------------------------------------- |
| Nhà cung cấp thời gian chạy | `opencode-go`                                    |
| Xác thực                  | `OPENCODE_API_KEY` (bí danh: `OPENCODE_ZEN_API_KEY`) |
| Thiết lập chính           | [OpenCode](/vi/providers/opencode)                    |

## Bắt đầu

<Tabs>
  <Tab title="Tương tác">
    <Steps>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Đặt một mô hình Go làm mặc định">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Xác minh các mô hình khả dụng">
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
      <Step title="Xác minh các mô hình khả dụng">
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

## Danh mục tích hợp sẵn

Chạy `openclaw models list --provider opencode-go` để xem danh sách mô hình hiện tại.
Các mục được đóng gói sẵn:

| Tham chiếu mô hình               | Tên               | Ngữ cảnh  | Đầu ra tối đa | Đầu vào hình ảnh |
| -------------------------------- | ----------------- | --------- | ------------ | ---------------- |
| `opencode-go/deepseek-v4-pro`    | DeepSeek V4 Pro   | 1M        | 384K         | Không            |
| `opencode-go/deepseek-v4-flash`  | DeepSeek V4 Flash | 1M        | 384K         | Không            |
| `opencode-go/glm-5`              | GLM-5             | 202,752   | 32,768       | Không            |
| `opencode-go/glm-5.1`            | GLM-5.1           | 202,752   | 32,768       | Không            |
| `opencode-go/glm-5.2`            | GLM-5.2           | 1M        | 131,072      | Không            |
| `opencode-go/hy3-preview`        | Bản xem trước HY3 | 262,144   | 32,768       | Không            |
| `opencode-go/kimi-k2.5`          | Kimi K2.5         | 262,144   | 65,536       | Có               |
| `opencode-go/kimi-k2.6`          | Kimi K2.6         | 262,144   | 65,536       | Có               |
| `opencode-go/kimi-k2.7-code`     | Kimi K2.7 Code    | 262,144   | 262,144      | Có               |
| `opencode-go/mimo-v2.5`          | MiMo V2.5         | 1M        | 128,000      | Có               |
| `opencode-go/mimo-v2.5-pro`      | MiMo V2.5 Pro     | 1,048,576 | 128,000      | Không            |
| `opencode-go/minimax-m2.5`       | MiniMax M2.5      | 204,800   | 65,536       | Không            |
| `opencode-go/minimax-m2.7`       | MiniMax M2.7      | 204,800   | 131,072      | Không            |
| `opencode-go/minimax-m3`         | MiniMax M3        | 204,800   | 131,072      | Không            |
| `opencode-go/qwen3.5-plus`       | Qwen3.5 Plus      | 262,144   | 65,536       | Có               |
| `opencode-go/qwen3.6-plus`       | Qwen3.6 Plus      | 262,144   | 65,536       | Có               |
| `opencode-go/qwen3.7-max`        | Qwen3.7 Max       | 1M        | 65,536       | Không            |
| `opencode-go/qwen3.7-plus`       | Qwen3.7 Plus      | 1M        | 65,536       | Có               |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Hành vi định tuyến">
    OpenClaw tự động định tuyến mọi tham chiếu mô hình `opencode-go/...`. Không cần
    cấu hình thêm nhà cung cấp.
  </Accordion>

  <Accordion title="Quy ước tham chiếu thời gian chạy">
    Các tham chiếu thời gian chạy luôn được chỉ định rõ ràng: `opencode/...` cho Zen,
    `opencode-go/...` cho Go. Điều này giúp việc định tuyến theo từng mô hình ở thượng nguồn
    luôn chính xác trên cả hai danh mục.
  </Accordion>

  <Accordion title="Thông tin xác thực dùng chung">
    Một `OPENCODE_API_KEY` dùng cho cả danh mục Zen và Go. Việc nhập
    khóa trong quá trình thiết lập sẽ lưu thông tin xác thực cho cả hai nhà cung cấp thời gian chạy.
  </Accordion>
</AccordionGroup>

<Tip>
Xem [OpenCode](/vi/providers/opencode) để biết tổng quan về quy trình thiết lập ban đầu dùng chung và tài liệu tham khảo
đầy đủ về danh mục Zen + Go.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="OpenCode (chính)" href="/vi/providers/opencode" icon="server">
    Quy trình thiết lập ban đầu dùng chung, tổng quan danh mục và các ghi chú nâng cao.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cách chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
