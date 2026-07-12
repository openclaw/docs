---
read_when:
    - Bạn muốn sử dụng Chutes với OpenClaw
    - Bạn cần quy trình thiết lập OAuth hoặc khóa API
    - Bạn muốn cấu hình mô hình mặc định, bí danh hoặc hành vi khám phá
summary: Thiết lập Chutes (OAuth hoặc khóa API, khám phá mô hình, bí danh)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T08:15:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) cung cấp danh mục mô hình nguồn mở thông qua một API tương thích với OpenAI. OpenClaw hỗ trợ cả OAuth qua trình duyệt và xác thực bằng khóa API.

| Thuộc tính       | Giá trị                                                 |
| ---------------- | ------------------------------------------------------- |
| Nhà cung cấp     | `chutes`                                                |
| Plugin           | gói bên ngoài chính thức (`@openclaw/chutes-provider`)  |
| API              | tương thích với OpenAI                                  |
| URL cơ sở        | `https://llm.chutes.ai/v1`                              |
| Xác thực         | OAuth hoặc khóa API (xem bên dưới)                      |
| Biến môi trường thời gian chạy | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`      |

`CHUTES_OAUTH_TOKEN` cung cấp trực tiếp một mã thông báo truy cập OAuth đã được lấy từ trước
(ví dụ trong CI), bỏ qua quy trình tương tác qua trình duyệt bên dưới.

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Bắt đầu

Cả hai cách đều đặt mô hình mặc định thành `chutes/zai-org/GLM-4.7-TEE` và đăng ký
danh mục Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Chạy quy trình thiết lập ban đầu OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw khởi chạy quy trình trình duyệt cục bộ hoặc hiển thị URL cùng quy trình
        dán URL chuyển hướng trên các máy chủ từ xa/không giao diện. Mã thông báo OAuth
        tự động làm mới thông qua các hồ sơ xác thực của OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Khóa API">
    <Steps>
      <Step title="Lấy khóa API">
        Tạo khóa tại
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Chạy quy trình thiết lập ban đầu bằng khóa API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Hành vi khám phá

Khi thông tin xác thực Chutes khả dụng, OpenClaw truy vấn `GET /v1/models` bằng
thông tin xác thực đó và sử dụng các mô hình được phát hiện, được lưu vào bộ nhớ đệm
trong 5 phút cho mỗi thông tin xác thực. Với khóa đã hết hạn/không được ủy quyền
(HTTP 401), OpenClaw thử lại một lần mà không dùng thông tin xác thực. Nếu quá trình
khám phá vẫn không trả về hàng nào, thất bại hoặc trả về bất kỳ trạng thái nào khác
ngoài 2xx, hệ thống chuyển sang danh mục tĩnh được đóng gói sẵn (cả quá trình khám phá
bằng khóa API và OAuth đều sử dụng cùng đường dẫn này). Nếu quá trình khám phá thất bại
khi khởi động, danh mục tĩnh sẽ tự động được sử dụng.

## Bí danh mặc định

OpenClaw đăng ký ba bí danh tiện dụng cho danh mục Chutes:

| Bí danh         | Mô hình đích                                           |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Danh mục khởi đầu tích hợp sẵn

Danh mục dự phòng được đóng gói sẵn có 47 mô hình. Dưới đây là một số tham chiếu tiêu biểu hiện tại:

| Tham chiếu mô hình                                    |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Chạy `openclaw models list --all --provider chutes` để xem danh sách đầy đủ.

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
    Tùy chỉnh quy trình OAuth bằng các biến môi trường tùy chọn:

    | Biến | Mục đích |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID máy khách OAuth (sẽ được nhắc nhập nếu chưa đặt) |
    | `CHUTES_CLIENT_SECRET` | Bí mật máy khách OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI chuyển hướng (mặc định `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Các phạm vi được phân tách bằng dấu cách (mặc định `openid profile chutes:invoke`) |

    Xem [tài liệu OAuth của Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    để biết các yêu cầu đối với ứng dụng chuyển hướng và nhận trợ giúp.

  </Accordion>

  <Accordion title="Lưu ý">
    - Các mô hình Chutes được đăng ký dưới dạng `chutes/<model-id>`.
    - Chutes không báo cáo mức sử dụng mã thông báo trong khi truyền phát (`supportsUsageInStreaming: false`); tổng mức sử dụng vẫn hiển thị sau khi luồng hoàn tất.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Quy tắc nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm các thiết lập nhà cung cấp.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Bảng điều khiển Chutes và tài liệu API.
  </Card>
  <Card title="Khóa API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Tạo và quản lý khóa API Chutes.
  </Card>
</CardGroup>
