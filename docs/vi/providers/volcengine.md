---
read_when:
    - Bạn muốn sử dụng các mô hình Volcano Engine hoặc Doubao với OpenClaw
    - Bạn cần thiết lập khóa API Volcengine
    - Bạn muốn sử dụng tính năng chuyển văn bản thành giọng nói của Volcengine Speech
summary: Thiết lập Volcano Engine (mô hình Doubao, điểm cuối lập trình và Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-29T23:10:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 16
---

Nhà cung cấp Volcengine cho phép truy cập các mô hình Doubao và mô hình bên thứ ba
được lưu trữ trên Volcano Engine, với các điểm cuối riêng cho khối lượng công việc
chung và lập trình. Cùng một Plugin tích hợp cũng có thể đăng ký Volcengine Speech
làm nhà cung cấp TTS.

| Chi tiết   | Giá trị                                                    |
| ---------- | ---------------------------------------------------------- |
| Nhà cung cấp | `volcengine` (chung + TTS) + `volcengine-plan` (lập trình) |
| Xác thực mô hình | `VOLCANO_ENGINE_API_KEY`                             |
| Xác thực TTS | `VOLCENGINE_TTS_API_KEY` hoặc `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | Mô hình tương thích OpenAI, BytePlus Seed Speech TTS       |

## Bắt đầu

<Steps>
  <Step title="Set the API key">
    Chạy onboarding tương tác:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Lệnh này đăng ký cả nhà cung cấp chung (`volcengine`) và lập trình (`volcengine-plan`) từ một API key duy nhất.

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Để thiết lập không tương tác (CI, scripting), truyền key trực tiếp:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Nhà cung cấp và điểm cuối

| Nhà cung cấp      | Điểm cuối                                 | Trường hợp sử dụng |
| ----------------- | ----------------------------------------- | ------------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Mô hình chung      |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Mô hình lập trình  |

<Note>
Cả hai nhà cung cấp đều được cấu hình từ một API key duy nhất. Quá trình thiết lập tự động đăng ký cả hai.
</Note>

## Catalog tích hợp sẵn

<Tabs>
  <Tab title="General (volcengine)">
    | Tham chiếu mô hình                            | Tên                             | Đầu vào     | Ngữ cảnh |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | văn bản, hình ảnh | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | văn bản, hình ảnh | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | văn bản, hình ảnh | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | văn bản, hình ảnh | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | văn bản, hình ảnh | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Tham chiếu mô hình                                 | Tên                      | Đầu vào | Ngữ cảnh |
    | ------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | văn bản | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | văn bản | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | văn bản | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | văn bản | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | văn bản | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | văn bản | 256,000 |
  </Tab>
</Tabs>

## Chuyển văn bản thành giọng nói

Volcengine TTS sử dụng BytePlus Seed Speech HTTP API và được cấu hình
riêng với API key của API mô hình Doubao tương thích OpenAI. Trong console
BytePlus, mở Seed Speech > Settings > API Keys và sao chép API key, rồi thiết lập:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Sau đó bật trong `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Đối với mục tiêu ghi chú thoại, OpenClaw yêu cầu Volcengine dùng định dạng gốc của nhà cung cấp
`ogg_opus`. Đối với tệp đính kèm âm thanh thông thường, OpenClaw yêu cầu `mp3`. Các bí danh nhà cung cấp
`bytedance` và `doubao` cũng phân giải về cùng một nhà cung cấp giọng nói.

ID tài nguyên mặc định là `seed-tts-1.0` vì đây là quyền mà BytePlus cấp
cho các API key Seed Speech mới tạo trong dự án mặc định. Nếu dự án của bạn
có quyền TTS 2.0, hãy đặt `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` dùng cho các điểm cuối mô hình ModelArk/Doubao và không phải là
API key Seed Speech. TTS cần API key Seed Speech từ BytePlus Speech
Console, hoặc cặp AppID/token Speech Console cũ.
</Warning>

Xác thực AppID/token cũ vẫn được hỗ trợ cho các ứng dụng Speech Console cũ hơn:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Default model after onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` hiện đặt
    `volcengine-plan/ark-code-latest` làm mô hình mặc định đồng thời cũng đăng ký
    catalog chung `volcengine`.
  </Accordion>

  <Accordion title="Model picker fallback behavior">
    Trong quá trình onboarding/cấu hình lựa chọn mô hình, lựa chọn xác thực Volcengine ưu tiên
    cả các hàng `volcengine/*` và `volcengine-plan/*`. Nếu các mô hình đó chưa được
    tải, OpenClaw sẽ quay về catalog không lọc thay vì hiển thị một bộ chọn trống
    được giới hạn theo nhà cung cấp.
  </Accordion>

  <Accordion title="Environment variables for daemon processes">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo các biến môi trường
    cho mô hình và TTS như `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID`, và
    `VOLCENGINE_TTS_TOKEN` có sẵn cho tiến trình đó (ví dụ, trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Khi chạy OpenClaw dưới dạng dịch vụ nền, các biến môi trường được đặt trong
shell tương tác của bạn không tự động được kế thừa. Xem ghi chú về daemon ở trên.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Configuration" href="/vi/gateway/configuration" icon="gear">
    Tham chiếu cấu hình đầy đủ cho agent, mô hình và nhà cung cấp.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và các bước gỡ lỗi.
  </Card>
  <Card title="FAQ" href="/vi/help/faq" icon="circle-question">
    Các câu hỏi thường gặp về thiết lập OpenClaw.
  </Card>
</CardGroup>
