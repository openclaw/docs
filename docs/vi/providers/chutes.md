---
read_when:
    - Bạn muốn sử dụng Chutes với OpenClaw
    - Bạn cần đường dẫn thiết lập OAuth hoặc khóa API
    - Bạn muốn mô hình mặc định, bí danh hoặc hành vi khám phá
summary: Thiết lập Chutes (OAuth hoặc khóa API, khám phá mô hình, bí danh)
title: Chutes
x-i18n:
    generated_at: "2026-06-27T18:01:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) cung cấp các danh mục mô hình nguồn mở thông qua một
API tương thích với OpenAI. OpenClaw hỗ trợ cả OAuth trên trình duyệt và xác thực
trực tiếp bằng khóa API cho nhà cung cấp `chutes`.

| Thuộc tính | Giá trị                      |
| -------- | ---------------------------- |
| Nhà cung cấp | `chutes`                     |
| API      | Tương thích với OpenAI       |
| URL cơ sở | `https://llm.chutes.ai/v1`   |
| Xác thực | OAuth hoặc khóa API (xem bên dưới) |

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Bắt đầu

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Chạy luồng thiết lập OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw khởi chạy luồng trên trình duyệt ở máy cục bộ, hoặc hiển thị một URL + luồng
        dán chuyển hướng trên các máy chủ từ xa/không có giao diện. Token OAuth tự động làm mới thông qua các
        hồ sơ xác thực của OpenClaw.
      </Step>
      <Step title="Xác minh mô hình mặc định">
        Sau khi thiết lập, mô hình mặc định được đặt thành
        `chutes/zai-org/GLM-4.7-TEE` và danh mục tĩnh của Chutes được
        đăng ký.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Khóa API">
    <Steps>
      <Step title="Lấy khóa API">
        Tạo khóa tại
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Chạy luồng thiết lập bằng khóa API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Xác minh mô hình mặc định">
        Sau khi thiết lập, mô hình mặc định được đặt thành
        `chutes/zai-org/GLM-4.7-TEE` và danh mục tĩnh của Chutes được
        đăng ký.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Cả hai đường dẫn xác thực đều đăng ký danh mục tĩnh của Chutes và đặt mô hình mặc định thành
`chutes/zai-org/GLM-4.7-TEE`. Biến môi trường thời gian chạy: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Hành vi khám phá

Khi có xác thực Chutes, OpenClaw truy vấn danh mục Chutes bằng thông tin xác thực đó
và dùng các mô hình đã khám phá. Nếu khám phá thất bại, OpenClaw chuyển
về danh mục tĩnh để quy trình thiết lập và khởi động vẫn hoạt động.

## Bí danh mặc định

OpenClaw đăng ký ba bí danh tiện lợi cho danh mục tĩnh của Chutes:

| Bí danh         | Mô hình đích                                         |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Danh mục khởi đầu tích hợp sẵn

Danh mục dự phòng tĩnh bao gồm các ref Chutes hiện tại:

| Ref mô hình                                           |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Ví dụ cấu hình

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ghi đè OAuth">
    Bạn có thể tùy chỉnh luồng OAuth bằng các biến môi trường tùy chọn:

    | Biến | Mục đích |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID máy khách OAuth tùy chỉnh |
    | `CHUTES_CLIENT_SECRET` | Bí mật máy khách OAuth tùy chỉnh |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI chuyển hướng tùy chỉnh |
    | `CHUTES_OAUTH_SCOPES` | Phạm vi OAuth tùy chỉnh |

    Xem [tài liệu OAuth của Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    để biết yêu cầu và trợ giúp về ứng dụng chuyển hướng.

  </Accordion>

  <Accordion title="Ghi chú">
    - Cả khám phá bằng khóa API và OAuth đều dùng cùng id nhà cung cấp `chutes`.
    - Mô hình Chutes được đăng ký dưới dạng `chutes/<model-id>`.
    - Nếu khám phá thất bại khi khởi động, danh mục tĩnh sẽ tự động được dùng.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Quy tắc nhà cung cấp, ref mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm cài đặt nhà cung cấp.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Bảng điều khiển Chutes và tài liệu API.
  </Card>
  <Card title="Khóa API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Tạo và quản lý khóa API Chutes.
  </Card>
</CardGroup>
