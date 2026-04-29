---
read_when:
    - Bạn muốn sử dụng Fireworks với OpenClaw
    - Bạn cần biến môi trường khóa API Fireworks hoặc mã định danh mô hình mặc định
summary: Thiết lập Fireworks (xác thực + chọn mô hình)
title: Fireworks
x-i18n:
    generated_at: "2026-04-29T23:06:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) cung cấp các model open-weight và model được định tuyến thông qua API tương thích với OpenAI. OpenClaw bao gồm một Plugin nhà cung cấp Fireworks được tích hợp sẵn.

| Thuộc tính     | Giá trị                                                |
| ------------- | ------------------------------------------------------ |
| Nhà cung cấp  | `fireworks`                                            |
| Xác thực      | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions tương thích với OpenAI                |
| URL cơ sở     | `https://api.fireworks.ai/inference/v1`                |
| Model mặc định | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Bắt đầu

<Steps>
  <Step title="Thiết lập xác thực Fireworks thông qua onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Lệnh này lưu khóa Fireworks của bạn trong cấu hình OpenClaw và đặt model khởi đầu Fire Pass làm mặc định.

  </Step>
  <Step title="Xác minh model có sẵn">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Ví dụ không tương tác

Đối với thiết lập bằng script hoặc CI, truyền tất cả giá trị trên dòng lệnh:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Danh mục tích hợp sẵn

| Tham chiếu model                                      | Tên                         | Đầu vào    | Ngữ cảnh | Đầu ra tối đa | Ghi chú                                                                                                                                               |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | Model Kimi mới nhất trên Fireworks. Tính năng suy luận bị tắt đối với yêu cầu Fireworks K2.6; hãy định tuyến trực tiếp qua Moonshot nếu bạn cần đầu ra suy luận của Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Model khởi đầu tích hợp sẵn mặc định trên Fireworks                                                                                                          |

<Tip>
Nếu Fireworks phát hành một model mới hơn, chẳng hạn một bản phát hành Qwen hoặc Gemma mới, bạn có thể chuyển trực tiếp sang model đó bằng cách dùng id model Fireworks của nó mà không cần chờ cập nhật danh mục tích hợp sẵn.
</Tip>

## Id model Fireworks tùy chỉnh

OpenClaw cũng chấp nhận id model Fireworks động. Dùng đúng id model hoặc router mà Fireworks hiển thị và thêm tiền tố `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cách hoạt động của tiền tố id model">
    Mọi tham chiếu model Fireworks trong OpenClaw đều bắt đầu bằng `fireworks/`, theo sau là đúng id hoặc đường dẫn router từ nền tảng Fireworks. Ví dụ:

    - Model router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model trực tiếp: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw loại bỏ tiền tố `fireworks/` khi tạo yêu cầu API và gửi đường dẫn còn lại đến endpoint Fireworks.

  </Accordion>

  <Accordion title="Lưu ý về môi trường">
    Nếu Gateway chạy bên ngoài shell tương tác của bạn, hãy đảm bảo `FIREWORKS_API_KEY` cũng có sẵn cho tiến trình đó.

    <Warning>
    Khóa chỉ nằm trong `~/.profile` sẽ không giúp được daemon launchd/systemd trừ khi môi trường đó cũng được nhập vào đó. Đặt khóa trong `~/.openclaw/.env` hoặc qua `env.shellEnv` để đảm bảo tiến trình gateway có thể đọc được khóa.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu model và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
