---
read_when:
    - Bạn muốn sử dụng các mô hình GLM trong OpenClaw
    - Bạn cần quy ước đặt tên mô hình và cách thiết lập
summary: Tổng quan về dòng mô hình GLM và cách sử dụng trong OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:27:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM là một họ mô hình (không phải công ty) có sẵn thông qua nền tảng [Z.AI](https://z.ai). Trong OpenClaw, các mô hình GLM được truy cập thông qua nhà cung cấp `zai` đi kèm với các ref như `zai/glm-5.1`.

| Thuộc tính             | Giá trị                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| ID nhà cung cấp        | `zai`                                                                       |
| Plugin                 | đi kèm, `enabledByDefault: true`                                            |
| Biến môi trường xác thực | `ZAI_API_KEY` hoặc `Z_AI_API_KEY`                                           |
| Lựa chọn onboarding    | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                    | tương thích với OpenAI                                                      |
| URL cơ sở mặc định     | `https://api.z.ai/api/paas/v4`                                              |
| Mặc định được đề xuất  | `zai/glm-5.1`                                                               |
| Mô hình hình ảnh mặc định | `zai/glm-4.6v`                                                           |

## Bắt đầu

<Steps>
  <Step title="Chọn phương thức xác thực và chạy onboarding">
    Chọn lựa chọn onboarding phù hợp với gói Z.AI và khu vực của bạn. Lựa chọn chung `zai-api-key` tự động phát hiện endpoint phù hợp từ dạng khóa; dùng các lựa chọn khu vực rõ ràng khi bạn muốn ép buộc một Coding Plan cụ thể hoặc bề mặt API chung.

    | Lựa chọn xác thực  | Phù hợp nhất cho                                  |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | Khóa API chung với tự động phát hiện endpoint       |
    | `zai-coding-global` | Người dùng Coding Plan (toàn cầu)                   |
    | `zai-coding-cn`     | Người dùng Coding Plan (khu vực Trung Quốc)         |
    | `zai-global`        | API chung (toàn cầu)                                |
    | `zai-cn`            | API chung (khu vực Trung Quốc)                      |

    <CodeGroup>

```bash Tự động phát hiện
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (toàn cầu)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (Trung Quốc)
openclaw onboard --auth-choice zai-coding-cn
```

```bash API chung (toàn cầu)
openclaw onboard --auth-choice zai-global
```

```bash API chung (Trung Quốc)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

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
  `zai-api-key` cho phép OpenClaw phát hiện endpoint Z.AI phù hợp từ dạng khóa và tự động áp dụng URL cơ sở chính xác. Dùng các lựa chọn khu vực rõ ràng khi bạn muốn ghim một Coding Plan cụ thể hoặc bề mặt API chung.
</Tip>

## Danh mục tích hợp sẵn

Nhà cung cấp `zai` đi kèm khởi tạo 13 ref mô hình GLM. Tất cả mục đều hỗ trợ suy luận trừ khi được đánh dấu khác; `glm-5v-turbo` và `glm-4.6v` chấp nhận đầu vào hình ảnh cũng như văn bản.

| Ref mô hình           | Ghi chú                                            |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | Mô hình mặc định. Suy luận, chỉ văn bản, ngữ cảnh 202k. |
| `zai/glm-5`          | Suy luận, chỉ văn bản, ngữ cảnh 202k.              |
| `zai/glm-5-turbo`    | Suy luận, chỉ văn bản, ngữ cảnh 202k.              |
| `zai/glm-5v-turbo`   | Suy luận, văn bản + hình ảnh, ngữ cảnh 202k.       |
| `zai/glm-4.7`        | Suy luận, chỉ văn bản, ngữ cảnh 204k.              |
| `zai/glm-4.7-flash`  | Suy luận, chỉ văn bản, ngữ cảnh 200k.              |
| `zai/glm-4.7-flashx` | Suy luận, chỉ văn bản.                             |
| `zai/glm-4.6`        | Suy luận, chỉ văn bản.                             |
| `zai/glm-4.6v`       | Suy luận, văn bản + hình ảnh. Mô hình hình ảnh mặc định. |
| `zai/glm-4.5`        | Suy luận, chỉ văn bản.                             |
| `zai/glm-4.5-air`    | Suy luận, chỉ văn bản.                             |
| `zai/glm-4.5-flash`  | Suy luận, chỉ văn bản.                             |
| `zai/glm-4.5v`       | Suy luận, văn bản + hình ảnh.                      |

<Note>
  Phiên bản và tình trạng sẵn có của GLM có thể thay đổi. Chạy `openclaw models list --provider zai` để xem các hàng danh mục mà phiên bản đã cài đặt của bạn biết đến, và kiểm tra tài liệu của Z.AI để biết các mô hình mới được thêm hoặc đã ngừng dùng.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Tự động phát hiện endpoint">
    Khi bạn dùng lựa chọn xác thực `zai-api-key`, OpenClaw kiểm tra dạng khóa để xác định URL cơ sở Z.AI chính xác. Các lựa chọn khu vực rõ ràng (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) ghi đè tự động phát hiện và ghim trực tiếp endpoint.
  </Accordion>

  <Accordion title="Chi tiết nhà cung cấp">
    Các mô hình GLM được phục vụ bởi nhà cung cấp runtime `zai`. Để xem cấu hình nhà cung cấp đầy đủ, endpoint theo khu vực và các khả năng bổ sung, xem [trang nhà cung cấp Z.AI](/vi/providers/zai).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp Z.AI" href="/vi/providers/zai" icon="server">
    Cấu hình nhà cung cấp Z.AI đầy đủ và endpoint theo khu vực.
  </Card>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, ref mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chế độ suy nghĩ" href="/vi/tools/thinking" icon="brain">
    Các cấp độ `/think` cho họ GLM có khả năng suy luận.
  </Card>
  <Card title="Câu hỏi thường gặp về mô hình" href="/vi/help/faq-models" icon="circle-question">
    Hồ sơ xác thực, chuyển đổi mô hình và giải quyết lỗi "no profile".
  </Card>
</CardGroup>
