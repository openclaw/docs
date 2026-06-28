---
read_when:
    - Bạn muốn truy cập mô hình được lưu trữ trên OpenCode
    - Bạn muốn chọn giữa các danh mục Zen và Go
summary: Sử dụng các danh mục OpenCode Zen và Go với OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:44:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode cung cấp hai danh mục được lưu trữ trong OpenClaw:

| Danh mục | Tiền tố           | Nhà cung cấp runtime |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Cả hai danh mục đều dùng cùng một khóa API OpenCode. OpenClaw giữ các id nhà cung cấp runtime
tách riêng để định tuyến theo từng mô hình ở upstream luôn chính xác, nhưng quy trình khởi tạo và tài liệu xem chúng
như một thiết lập OpenCode duy nhất.

## Bắt đầu

<Tabs>
  <Tab title="Danh mục Zen">
    **Phù hợp nhất cho:** proxy đa mô hình OpenCode được tuyển chọn (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Chạy quy trình khởi tạo">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Hoặc truyền khóa trực tiếp:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Đặt một mô hình Zen làm mặc định">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Xác minh các mô hình có sẵn">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Danh mục Go">
    **Phù hợp nhất cho:** bộ mô hình Kimi, GLM và MiniMax do OpenCode lưu trữ.

    <Steps>
      <Step title="Chạy quy trình khởi tạo">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Hoặc truyền khóa trực tiếp:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Đặt một mô hình Go làm mặc định">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Xác minh các mô hình có sẵn">
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

| Thuộc tính        | Giá trị                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Nhà cung cấp runtime | `opencode`                                                                                    |
| Mô hình ví dụ     | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Thuộc tính        | Giá trị                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Nhà cung cấp runtime | `opencode-go`                                                            |
| Mô hình ví dụ     | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Bí danh khóa API">
    `OPENCODE_ZEN_API_KEY` cũng được hỗ trợ làm bí danh cho `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Thông tin xác thực dùng chung">
    Nhập một khóa OpenCode trong quá trình thiết lập sẽ lưu thông tin xác thực cho cả hai nhà cung cấp runtime.
    Bạn không cần khởi tạo từng danh mục riêng.
  </Accordion>

  <Accordion title="Thanh toán và bảng điều khiển">
    Bạn đăng nhập vào OpenCode, thêm thông tin thanh toán và sao chép khóa API của mình. Việc thanh toán
    và tính khả dụng của danh mục được quản lý từ bảng điều khiển OpenCode.
  </Accordion>

  <Accordion title="Hành vi phát lại Gemini">
    Các tham chiếu OpenCode dựa trên Gemini vẫn nằm trên đường dẫn proxy-Gemini, nên OpenClaw giữ
    thao tác làm sạch chữ ký suy nghĩ của Gemini tại đó mà không bật xác thực phát lại Gemini gốc
    hoặc ghi lại bootstrap.
  </Accordion>

  <Accordion title="Hành vi phát lại không phải Gemini">
    Các tham chiếu OpenCode không phải Gemini giữ chính sách phát lại tương thích OpenAI tối thiểu.
  </Accordion>
</AccordionGroup>

<Tip>
Nhập một khóa OpenCode trong quá trình thiết lập sẽ lưu thông tin xác thực cho cả nhà cung cấp runtime Zen và
Go, nên bạn chỉ cần khởi tạo một lần.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho agent, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
