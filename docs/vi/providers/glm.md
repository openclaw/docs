---
read_when:
    - Bạn muốn sử dụng các mô hình GLM trong OpenClaw
    - Bạn cần quy ước đặt tên mô hình và cách thiết lập
summary: Tổng quan về họ mô hình GLM + cách sử dụng trong OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-29T23:06:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 16
---

# Các mô hình GLM

GLM là một **họ mô hình** (không phải một công ty) có sẵn thông qua nền tảng Z.AI. Trong OpenClaw, các mô hình GLM được truy cập qua nhà cung cấp `zai` và các ID mô hình như `zai/glm-5`.

## Bắt đầu

<Steps>
  <Step title="Chọn tuyến xác thực và chạy quy trình khởi tạo">
    Chọn tùy chọn khởi tạo phù hợp với gói Z.AI và khu vực của bạn:

    | Lựa chọn xác thực | Phù hợp nhất cho |
    | ----------- | -------- |
    | `zai-api-key` | Thiết lập khóa API chung với tự động phát hiện endpoint |
    | `zai-coding-global` | Người dùng Coding Plan (toàn cầu) |
    | `zai-coding-cn` | Người dùng Coding Plan (khu vực Trung Quốc) |
    | `zai-global` | API chung (toàn cầu) |
    | `zai-cn` | API chung (khu vực Trung Quốc) |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Đặt GLM làm mô hình mặc định">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Xác minh các mô hình có sẵn">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Ví dụ cấu hình

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` cho phép OpenClaw phát hiện endpoint Z.AI tương ứng từ khóa và tự động áp dụng base URL chính xác. Hãy dùng các lựa chọn khu vực rõ ràng khi bạn muốn buộc dùng một Coding Plan cụ thể hoặc bề mặt API chung cụ thể.
</Tip>

## Danh mục tích hợp sẵn

OpenClaw hiện khởi tạo nhà cung cấp `zai` đi kèm với các tham chiếu GLM sau:

| Mô hình           | Mô hình            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
Tham chiếu mô hình đi kèm mặc định là `zai/glm-5.1`. Các phiên bản GLM và tình trạng khả dụng có thể thay đổi; hãy xem tài liệu của Z.AI để biết thông tin mới nhất.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tự động phát hiện endpoint">
    Khi bạn dùng lựa chọn xác thực `zai-api-key`, OpenClaw kiểm tra định dạng khóa để xác định base URL Z.AI chính xác. Các lựa chọn khu vực rõ ràng (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) ghi đè tự động phát hiện và ghim trực tiếp endpoint.
  </Accordion>

  <Accordion title="Chi tiết nhà cung cấp">
    Các mô hình GLM được phục vụ bởi nhà cung cấp runtime `zai`. Để xem cấu hình đầy đủ của nhà cung cấp, các endpoint khu vực và các khả năng bổ sung, hãy xem [tài liệu nhà cung cấp Z.AI](/vi/providers/zai).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp Z.AI" href="/vi/providers/zai" icon="server">
    Cấu hình đầy đủ của nhà cung cấp Z.AI và các endpoint khu vực.
  </Card>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
