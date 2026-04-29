---
read_when:
    - Bạn muốn quyền truy cập mô hình do OpenCode lưu trữ
    - Bạn muốn chọn giữa các danh mục Zen và Go
summary: Sử dụng danh mục OpenCode Zen và Go với OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-29T23:08:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode cung cấp hai danh mục được lưu trữ trong OpenClaw:

| Danh mục | Tiền tố           | Nhà cung cấp runtime |
| -------- | ----------------- | -------------------- |
| **Zen**  | `opencode/...`    | `opencode`           |
| **Go**   | `opencode-go/...` | `opencode-go`        |

Cả hai danh mục dùng cùng một khóa API OpenCode. OpenClaw giữ các id nhà cung cấp runtime
tách biệt để việc định tuyến theo từng mô hình ở upstream vẫn chính xác, nhưng quy trình onboarding và tài liệu xem chúng
như một thiết lập OpenCode duy nhất.

## Bắt đầu

<Tabs>
  <Tab title="Zen catalog">
    **Phù hợp nhất cho:** proxy đa mô hình OpenCode được tuyển chọn (Claude, GPT, Gemini).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Hoặc truyền trực tiếp khóa:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **Phù hợp nhất cho:** nhóm Kimi, GLM và MiniMax do OpenCode lưu trữ.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Hoặc truyền trực tiếp khóa:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
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
</Tabs>

## Ví dụ cấu hình

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Danh mục tích hợp sẵn

### Zen

| Thuộc tính           | Giá trị                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| Nhà cung cấp runtime | `opencode`                                                              |
| Mô hình ví dụ        | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Thuộc tính           | Giá trị                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| Nhà cung cấp runtime | `opencode-go`                                                            |
| Mô hình ví dụ        | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` cũng được hỗ trợ làm bí danh cho `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Shared credentials">
    Nhập một khóa OpenCode trong quá trình thiết lập sẽ lưu thông tin xác thực cho cả hai nhà cung cấp runtime.
    Bạn không cần onboard từng danh mục riêng biệt.
  </Accordion>

  <Accordion title="Billing and dashboard">
    Bạn đăng nhập vào OpenCode, thêm chi tiết thanh toán và sao chép khóa API. Việc thanh toán
    và tính khả dụng của danh mục được quản lý từ dashboard OpenCode.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Các ref OpenCode dựa trên Gemini vẫn đi theo đường dẫn proxy-Gemini, nên OpenClaw giữ
    việc làm sạch chữ ký suy nghĩ của Gemini ở đó mà không bật xác thực replay Gemini gốc
    hoặc viết lại bootstrap.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    Các ref OpenCode không phải Gemini giữ chính sách replay tối thiểu tương thích với OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Nhập một khóa OpenCode trong quá trình thiết lập sẽ lưu thông tin xác thực cho cả nhà cung cấp runtime Zen và
Go, nên bạn chỉ cần onboard một lần.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, ref mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ cho agent, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
