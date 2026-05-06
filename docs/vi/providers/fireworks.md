---
read_when:
    - Bạn muốn sử dụng Fireworks với OpenClaw
    - Bạn cần biến môi trường khóa API Fireworks hoặc ID mô hình mặc định
    - Bạn đang gỡ lỗi hành vi khi tắt suy nghĩ của Kimi trên Fireworks
summary: Thiết lập Fireworks (xác thực + lựa chọn mô hình)
title: Pháo hoa
x-i18n:
    generated_at: "2026-05-06T09:26:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) cung cấp các mô hình open-weight và mô hình định tuyến thông qua một API tương thích OpenAI. OpenClaw bao gồm một Plugin nhà cung cấp Fireworks được đóng gói sẵn, đi kèm hai mô hình Kimi đã được lập danh mục trước và chấp nhận mọi id mô hình hoặc router của Fireworks khi chạy.

| Thuộc tính       | Giá trị                                                |
| --------------- | ------------------------------------------------------ |
| Id nhà cung cấp | `fireworks` (bí danh: `fireworks-ai`)                  |
| Plugin          | được đóng gói sẵn, `enabledByDefault: true`            |
| Biến môi trường xác thực | `FIREWORKS_API_KEY`                            |
| Cờ onboarding   | `--auth-choice fireworks-api-key`                      |
| Cờ CLI trực tiếp | `--fireworks-api-key <key>`                           |
| API             | Tương thích OpenAI (`openai-completions`)              |
| URL cơ sở       | `https://api.fireworks.ai/inference/v1`                |
| Mô hình mặc định | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Bí danh mặc định | `Kimi K2.5 Turbo`                                     |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Onboarding lưu khóa cho nhà cung cấp `fireworks` trong hồ sơ xác thực của bạn và đặt router Kimi K2.5 Turbo **Fire Pass** làm mô hình mặc định.

  </Step>
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider fireworks
    ```

    Danh sách nên bao gồm `Kimi K2.6` và `Kimi K2.5 Turbo (Fire Pass)`. Nếu `FIREWORKS_API_KEY` chưa được phân giải, `openclaw models status --json` sẽ báo thông tin xác thực bị thiếu trong `auth.unusableProfiles`.

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

## Danh mục tích hợp sẵn

| Tham chiếu mô hình                                    | Tên                         | Đầu vào      | Ngữ cảnh | Đầu ra tối đa | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | văn bản + hình ảnh | 262,144 | 262,144    | Bắt buộc tắt         |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | văn bản + hình ảnh | 256,000 | 256,000    | Bắt buộc tắt (mặc định) |

<Note>
  OpenClaw cố định tất cả mô hình Fireworks Kimi ở `thinking: off` vì Fireworks từ chối tham số thinking của Kimi trong môi trường production. Định tuyến cùng mô hình trực tiếp qua [Moonshot](/vi/providers/moonshot) sẽ giữ nguyên đầu ra suy luận của Kimi. Xem [chế độ thinking](/vi/tools/thinking) để chuyển đổi giữa các nhà cung cấp.
</Note>

## Id mô hình Fireworks tùy chỉnh

OpenClaw chấp nhận mọi id mô hình hoặc router của Fireworks khi chạy. Dùng đúng id do Fireworks hiển thị và thêm tiền tố `fireworks/`. Cơ chế phân giải động sao chép mẫu Fire Pass (đầu vào văn bản + hình ảnh, API tương thích OpenAI, chi phí mặc định bằng không) và tự động tắt thinking khi id khớp mẫu Kimi.

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
  <Accordion title="Cách tiền tố id mô hình hoạt động">
    Mọi tham chiếu mô hình Fireworks trong OpenClaw đều bắt đầu bằng `fireworks/`, theo sau là id chính xác hoặc đường dẫn router từ nền tảng Fireworks. Ví dụ:

    - Mô hình router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Mô hình trực tiếp: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw loại bỏ tiền tố `fireworks/` khi tạo yêu cầu API và gửi phần đường dẫn còn lại đến endpoint Fireworks dưới dạng trường `model` tương thích OpenAI.

  </Accordion>

  <Accordion title="Vì sao thinking bị buộc tắt cho Kimi">
    Fireworks K2.6 trả về 400 nếu yêu cầu mang các tham số `reasoning_*`, dù Kimi hỗ trợ thinking thông qua API riêng của Moonshot. Chính sách đóng gói sẵn (`extensions/fireworks/thinking-policy.ts`) chỉ quảng bá mức thinking `off` cho id mô hình Kimi, nên các chuyển đổi `/think` thủ công và bề mặt chính sách nhà cung cấp luôn khớp với hợp đồng runtime.

    Để dùng suy luận Kimi từ đầu đến cuối, hãy cấu hình [nhà cung cấp Moonshot](/vi/providers/moonshot) và định tuyến cùng mô hình qua nhà cung cấp đó.

  </Accordion>

  <Accordion title="Tính sẵn có của môi trường cho daemon">
    Nếu Gateway chạy như một dịch vụ được quản lý (launchd, systemd, Docker), khóa Fireworks phải hiển thị với tiến trình đó — không chỉ với shell tương tác của bạn.

    <Warning>
      Khóa chỉ nằm trong `~/.profile` sẽ không giúp daemon launchd hoặc systemd trừ khi môi trường đó cũng được nhập vào đó. Đặt khóa trong `~/.openclaw/.env` hoặc qua `env.shellEnv` để tiến trình gateway có thể đọc được.
    </Warning>

    Trên macOS, `openclaw gateway install` đã nối `~/.openclaw/.env` vào tệp môi trường LaunchAgent. Chạy lại install (hoặc `openclaw doctor --fix`) sau khi xoay vòng khóa.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Chế độ thinking" href="/vi/tools/thinking" icon="brain">
    Các mức `/think`, chính sách nhà cung cấp và định tuyến mô hình có khả năng suy luận.
  </Card>
  <Card title="Moonshot" href="/vi/providers/moonshot" icon="moon">
    Chạy Kimi với đầu ra thinking gốc thông qua API riêng của Moonshot.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
