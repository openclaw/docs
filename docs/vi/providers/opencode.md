---
read_when:
    - Bạn muốn truy cập mô hình được lưu trữ trên OpenCode
    - Bạn muốn chọn giữa các danh mục Zen và Go
summary: Sử dụng danh mục OpenCode Zen và Go với OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T08:18:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode cung cấp hai danh mục được lưu trữ trên OpenClaw:

| Danh mục | Tiền tố           | Nhà cung cấp thời gian chạy |
| -------- | ----------------- | --------------------------- |
| **Zen**  | `opencode/...`    | `opencode`                  |
| **Go**   | `opencode-go/...` | `opencode-go`               |

Cả hai danh mục dùng chung một khóa API OpenCode (`OPENCODE_API_KEY`, bí danh
`OPENCODE_ZEN_API_KEY`). OpenClaw tách riêng các mã định danh nhà cung cấp thời gian chạy để
việc định tuyến theo từng mô hình ở thượng nguồn luôn chính xác, nhưng quy trình thiết lập ban đầu và tài liệu coi chúng là
một cấu hình OpenCode duy nhất.

## Bắt đầu

<Tabs>
  <Tab title="Danh mục Zen">
    **Phù hợp nhất cho:** proxy đa mô hình OpenCode được tuyển chọn (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Hoặc truyền trực tiếp khóa:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Đặt một mô hình Zen làm mặc định">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Xác minh các mô hình khả dụng">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Danh mục Go">
    **Phù hợp nhất cho:** bộ mô hình Kimi, GLM, MiniMax, Qwen và DeepSeek do OpenCode lưu trữ.

    <Steps>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Hoặc truyền trực tiếp khóa:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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

| Thuộc tính                  | Giá trị                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Nhà cung cấp thời gian chạy | `opencode`                                                                                    |
| Mô hình ví dụ               | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

Chạy `openclaw models list --provider opencode` để xem danh sách đầy đủ hiện tại, trong đó
cũng có các mục thuộc gói miễn phí như `opencode/big-pickle` và
`opencode/deepseek-v4-flash-free`.

### Go

| Thuộc tính                  | Giá trị                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| Nhà cung cấp thời gian chạy | `opencode-go`                                                            |
| Mô hình ví dụ               | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Xem [OpenCode Go](/vi/providers/opencode-go) để biết bảng mô hình Go đầy đủ.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Bí danh khóa API">
    `OPENCODE_ZEN_API_KEY` cũng được chấp nhận làm bí danh cho `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Thông tin xác thực dùng chung">
    Việc nhập một khóa OpenCode trong khi thiết lập sẽ lưu thông tin xác thực cho cả hai nhà cung cấp thời gian chạy.
    Bạn không cần thiết lập ban đầu riêng cho từng danh mục.
  </Accordion>

  <Accordion title="Lấy khóa API">
    Tạo tài khoản OpenCode và tạo khóa API tại
    [opencode.ai/auth](https://opencode.ai/auth). Việc thanh toán và tính khả dụng của danh mục
    được quản lý từ bảng điều khiển OpenCode.
  </Accordion>

  <Accordion title="Hành vi phát lại của Gemini">
    Các tham chiếu OpenCode dựa trên Gemini vẫn đi qua tuyến proxy-Gemini, nhờ đó OpenClaw tiếp tục
    làm sạch chữ ký suy luận của Gemini tại đó mà không bật tính năng xác thực phát lại Gemini
    gốc hoặc việc viết lại khởi tạo.
  </Accordion>

  <Accordion title="Hành vi phát lại không thuộc Gemini">
    Các tham chiếu OpenCode không thuộc Gemini giữ nguyên chính sách phát lại tối thiểu tương thích với OpenAI.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/vi/providers/opencode-go" icon="server">
    Tài liệu tham khảo đầy đủ về danh mục Go.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cách chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tài liệu tham khảo cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tài liệu tham khảo cấu hình đầy đủ cho các tác nhân, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
