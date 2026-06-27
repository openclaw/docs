---
read_when:
    - Bạn muốn sử dụng Fireworks với OpenClaw
    - Bạn cần biến môi trường khóa API Fireworks hoặc id mô hình mặc định
    - Bạn đang gỡ lỗi hành vi tắt suy nghĩ của Kimi trên Fireworks
summary: Thiết lập Fireworks (xác thực + chọn mô hình)
title: Pháo hoa
x-i18n:
    generated_at: "2026-06-27T18:03:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) cung cấp các mô hình trọng số mở và mô hình được định tuyến thông qua API tương thích OpenAI. Cài đặt Plugin provider Fireworks chính thức để sử dụng hai mô hình Kimi đã được đưa sẵn vào catalog và bất kỳ mô hình hoặc router id Fireworks nào khi chạy.

| Thuộc tính      | Giá trị                                                |
| --------------- | ------------------------------------------------------ |
| Provider id     | `fireworks` (bí danh: `fireworks-ai`)                  |
| Package         | `@openclaw/fireworks-provider`                         |
| Biến env xác thực | `FIREWORKS_API_KEY`                                  |
| Cờ thiết lập ban đầu | `--auth-choice fireworks-api-key`                |
| Cờ CLI trực tiếp | `--fireworks-api-key <key>`                           |
| API             | Tương thích OpenAI (`openai-completions`)              |
| URL cơ sở       | `https://api.fireworks.ai/inference/v1`                |
| Mô hình mặc định | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Bí danh mặc định | `Kimi K2.5 Turbo`                                     |

## Bắt đầu

<Steps>
  <Step title="Cài đặt Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Đặt khóa API Fireworks">
    <CodeGroup>

```bash Thiết lập ban đầu
openclaw onboard --auth-choice fireworks-api-key
```

```bash Cờ trực tiếp
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Chỉ env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Quy trình thiết lập ban đầu lưu khóa vào provider `fireworks` trong hồ sơ xác thực của bạn và đặt router **Fire Pass** Kimi K2.5 Turbo làm mô hình mặc định.

  </Step>
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider fireworks
    ```

    Danh sách nên bao gồm `Kimi K2.6` và `Kimi K2.5 Turbo (Fire Pass)`. Nếu `FIREWORKS_API_KEY` chưa được phân giải, `openclaw models status --json` báo cáo thông tin xác thực bị thiếu trong `auth.unusableProfiles`.

  </Step>
</Steps>

## Thiết lập không tương tác

Đối với cài đặt bằng script hoặc CI, truyền mọi thứ trên dòng lệnh:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalog tích hợp sẵn

| Model ref                                              | Tên                         | Đầu vào      | Context | Đầu ra tối đa | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ------------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | văn bản + hình ảnh | 262,144 | 262,144    | Bắt buộc tắt         |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | văn bản + hình ảnh | 256,000 | 256,000    | Bắt buộc tắt (mặc định) |

<Note>
  OpenClaw ghim tất cả mô hình Fireworks Kimi ở `thinking: off` vì Fireworks từ chối các tham số thinking của Kimi trong môi trường production. Việc định tuyến cùng mô hình trực tiếp qua [Moonshot](/vi/providers/moonshot) vẫn giữ nguyên đầu ra lập luận của Kimi. Xem [chế độ thinking](/vi/tools/thinking) để chuyển đổi giữa các provider.
</Note>

## ID mô hình Fireworks tùy chỉnh

OpenClaw chấp nhận bất kỳ mô hình hoặc router id Fireworks nào khi chạy. Dùng đúng id do Fireworks hiển thị và thêm tiền tố `fireworks/`. Cơ chế phân giải động sao chép mẫu Fire Pass (đầu vào văn bản + hình ảnh, API tương thích OpenAI, chi phí mặc định bằng không) và tự động tắt thinking khi id khớp với mẫu Kimi. Các id động GLM được đánh dấu là chỉ văn bản trừ khi bạn cấu hình một mục mô hình tùy chỉnh có đầu vào hình ảnh.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cách hoạt động của tiền tố model id">
    Mọi model ref Fireworks trong OpenClaw đều bắt đầu bằng `fireworks/`, theo sau là id chính xác hoặc đường dẫn router từ nền tảng Fireworks. Ví dụ:

    - Mô hình router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Mô hình trực tiếp: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw loại bỏ tiền tố `fireworks/` khi tạo yêu cầu API và gửi phần đường dẫn còn lại đến endpoint Fireworks dưới dạng trường `model` tương thích OpenAI.

  </Accordion>

  <Accordion title="Vì sao thinking bị bắt buộc tắt cho Kimi">
    Fireworks K2.6 trả về 400 nếu yêu cầu mang các tham số `reasoning_*`, dù Kimi hỗ trợ thinking thông qua API riêng của Moonshot. Chính sách provider (`extensions/fireworks/thinking-policy.ts`) chỉ công bố mức thinking `off` cho các model id Kimi, vì vậy các lần chuyển thủ công bằng `/think` và các bề mặt chính sách provider vẫn đồng bộ với hợp đồng runtime.

    Để sử dụng khả năng lập luận Kimi từ đầu đến cuối, hãy cấu hình [provider Moonshot](/vi/providers/moonshot) và định tuyến cùng mô hình qua provider đó.

  </Accordion>

  <Accordion title="Tính khả dụng của môi trường cho daemon">
    Nếu Gateway chạy như một dịch vụ được quản lý (launchd, systemd, Docker), khóa Fireworks phải hiển thị với tiến trình đó — không chỉ với shell tương tác của bạn.

    <Warning>
      Một khóa chỉ được export trong shell tương tác sẽ không giúp daemon launchd hoặc systemd trừ khi môi trường đó cũng được nhập vào đó. Đặt khóa trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv` để tiến trình gateway có thể đọc được.
    </Warning>

    Trên macOS, `openclaw gateway install` đã nối `~/.openclaw/.env` vào tệp môi trường LaunchAgent. Chạy lại cài đặt (hoặc `openclaw doctor --fix`) sau khi xoay vòng khóa.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Provider mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, model ref và hành vi failover.
  </Card>
  <Card title="Chế độ thinking" href="/vi/tools/thinking" icon="brain">
    Các mức `/think`, chính sách provider và định tuyến mô hình có khả năng lập luận.
  </Card>
  <Card title="Moonshot" href="/vi/providers/moonshot" icon="moon">
    Chạy Kimi với đầu ra thinking gốc thông qua API riêng của Moonshot.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
