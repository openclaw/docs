---
read_when:
    - Bạn muốn sử dụng Fireworks với OpenClaw
    - Bạn cần biến môi trường chứa khóa API Fireworks hoặc ID mô hình mặc định
    - Bạn đang gỡ lỗi hành vi tắt suy luận của Kimi trên Fireworks
summary: Thiết lập Fireworks (xác thực + lựa chọn mô hình)
title: Fireworks
x-i18n:
    generated_at: "2026-07-19T05:59:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7720b23b69aa716d2e2903f5644bb74f81ca1c5e753f71d72d4d7a25c0747884
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) cung cấp các mô hình trọng số mở và mô hình được định tuyến thông qua API tương thích với OpenAI. Cài đặt Plugin nhà cung cấp Fireworks chính thức để sử dụng hai mô hình Kimi được lập danh mục sẵn và bất kỳ id mô hình hoặc bộ định tuyến Fireworks nào trong thời gian chạy.

| Thuộc tính        | Giá trị                                                  |
| --------------- | ------------------------------------------------------ |
| Id nhà cung cấp     | `fireworks` (bí danh: `fireworks-ai`)                    |
| Gói         | `@openclaw/fireworks-provider`                         |
| Biến môi trường xác thực    | `FIREWORKS_API_KEY`                                    |
| Cờ thiết lập ban đầu | `--auth-choice fireworks-api-key`                      |
| Cờ CLI trực tiếp | `--fireworks-api-key <key>`                            |
| API             | Tương thích với OpenAI (`openai-completions`)               |
| URL cơ sở        | `https://api.fireworks.ai/inference/v1`                |
| Mô hình mặc định   | `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` |
| Bí danh mặc định   | `Kimi K2.6 Turbo`                                      |

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

```bash Chỉ biến môi trường
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Quá trình thiết lập ban đầu lưu khóa cho nhà cung cấp `fireworks` trong các hồ sơ xác thực của bạn và đặt bộ định tuyến Kimi K2.6 Turbo **Fire Pass** làm mô hình mặc định.

  </Step>
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider fireworks
    ```

    Danh sách phải bao gồm `Kimi K2.6` và `Kimi K2.6 Turbo (Fire Pass)`. Nếu không thể phân giải `FIREWORKS_API_KEY`, `openclaw models status --json` sẽ báo thông tin xác thực bị thiếu trong `auth.unusableProfiles`.

  </Step>
</Steps>

## Thiết lập không tương tác

Đối với quy trình cài đặt bằng tập lệnh hoặc CI, hãy truyền mọi thứ trên dòng lệnh:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Danh mục tích hợp sẵn

| Tham chiếu mô hình                                              | Tên                        | Đầu vào        | Ngữ cảnh | Đầu ra tối đa | Suy luận             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | văn bản + hình ảnh | 262,144 | 262,144    | Buộc tắt           |
| `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` | Kimi K2.6 Turbo (Fire Pass) | văn bản + hình ảnh | 256,000 | 256,000    | Buộc tắt (mặc định) |

<Note>
  OpenClaw cố định tất cả mô hình Kimi trên Fireworks ở `thinking: off` vì Kimi trên Fireworks có thể làm lộ chuỗi suy luận trong câu trả lời hiển thị, trừ khi yêu cầu tắt suy luận một cách rõ ràng. Việc định tuyến trực tiếp cùng mô hình đó qua [Moonshot](/vi/providers/moonshot) sẽ giữ nguyên đầu ra suy luận của Kimi. Xem [các chế độ suy luận](/vi/tools/thinking) để chuyển đổi giữa các nhà cung cấp.
</Note>

## Id mô hình Fireworks tùy chỉnh

OpenClaw chấp nhận bất kỳ id mô hình hoặc bộ định tuyến Fireworks nào trong thời gian chạy. Sử dụng chính xác id do Fireworks hiển thị và thêm tiền tố `fireworks/`. Quá trình phân giải động sao chép mẫu Fire Pass (đầu vào văn bản + hình ảnh, API tương thích với OpenAI, chi phí mặc định bằng không) và tự động tắt suy luận khi id khớp với mẫu Kimi. Các id GLM động được đánh dấu là chỉ hỗ trợ văn bản, trừ khi bạn định cấu hình một mục mô hình tùy chỉnh có đầu vào hình ảnh.

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
  <Accordion title="Cách thêm tiền tố vào id mô hình">
    Mọi tham chiếu mô hình Fireworks trong OpenClaw đều bắt đầu bằng `fireworks/`, theo sau là id hoặc đường dẫn bộ định tuyến chính xác từ nền tảng Fireworks. Ví dụ:

    - Mô hình bộ định tuyến: `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo`
    - Mô hình trực tiếp: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw loại bỏ tiền tố `fireworks/` khi tạo yêu cầu API và gửi đường dẫn còn lại đến điểm cuối Fireworks dưới dạng trường `model` tương thích với OpenAI.

  </Accordion>

  <Accordion title="Tại sao Kimi bị buộc tắt suy luận">
    Fireworks cung cấp Kimi mà không có kênh suy luận riêng, vì vậy chuỗi suy luận có thể xuất hiện trong luồng `content` hiển thị. Trong mọi yêu cầu Kimi trên Fireworks, OpenClaw gửi `thinking: { type: "disabled" }` và loại bỏ `reasoning`, `reasoning_effort` và `reasoningEffort` khỏi tải trọng (`extensions/fireworks/stream.ts`). Chính sách nhà cung cấp (`extensions/fireworks/thinking-policy.ts`) chỉ công bố mức suy luận `off` cho các id mô hình Kimi, nhờ đó các thao tác chuyển đổi `/think` thủ công và các bề mặt chính sách nhà cung cấp luôn nhất quán với hợp đồng thời gian chạy.

    Để sử dụng toàn bộ khả năng suy luận của Kimi từ đầu đến cuối, hãy định cấu hình [nhà cung cấp Moonshot](/vi/providers/moonshot) và định tuyến cùng mô hình qua nhà cung cấp này.

  </Accordion>

  <Accordion title="Khả năng truy cập biến môi trường của tiến trình nền">
    Nếu Gateway chạy dưới dạng dịch vụ được quản lý (launchd, systemd, Docker), khóa Fireworks phải hiển thị với tiến trình đó — không chỉ với shell tương tác của bạn.

    <Warning>
      Khóa chỉ được xuất trong shell tương tác sẽ không có tác dụng với tiến trình nền launchd hoặc systemd, trừ khi môi trường đó cũng được nhập vào tiến trình. Đặt khóa trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv` để tiến trình gateway có thể đọc khóa.
    </Warning>

    OpenClaw tải `~/.openclaw/.env` khi tải cấu hình, vì vậy các khóa được lưu tại đó sẽ đến được các dịch vụ gateway được quản lý trên mọi nền tảng. Khởi động lại gateway (hoặc chạy lại `openclaw doctor --fix`) sau khi xoay vòng khóa.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cách chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chế độ suy luận" href="/vi/tools/thinking" icon="brain">
    Các mức `/think`, chính sách nhà cung cấp và cách định tuyến các mô hình có khả năng suy luận.
  </Card>
  <Card title="Moonshot" href="/vi/providers/moonshot" icon="moon">
    Chạy Kimi với đầu ra suy luận gốc thông qua API riêng của Moonshot.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Hướng dẫn khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
