---
read_when:
    - Bạn muốn sử dụng các mô hình Volcano Engine hoặc Doubao với OpenClaw
    - Bạn cần thiết lập khóa API Volcengine
    - Bạn muốn sử dụng tính năng chuyển văn bản thành giọng nói của Volcengine Speech
summary: Thiết lập Volcano Engine (các mô hình Doubao, endpoint lập trình và TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T08:22:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Nhà cung cấp Volcengine cho phép truy cập các mô hình Doubao và mô hình của bên thứ ba được lưu trữ trên Volcano Engine, với các điểm cuối riêng cho khối lượng công việc thông thường và lập trình. Plugin đi kèm này cũng đăng ký Volcengine Speech làm nhà cung cấp TTS.

| Chi tiết       | Giá trị                                                    |
| -------------- | ---------------------------------------------------------- |
| Nhà cung cấp   | `volcengine` (thông thường + TTS), `volcengine-plan` (lập trình) |
| Xác thực mô hình | `VOLCANO_ENGINE_API_KEY`                                 |
| Xác thực TTS   | `VOLCENGINE_TTS_API_KEY` hoặc `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API            | Các mô hình tương thích với OpenAI, BytePlus Seed Speech TTS |

## Bắt đầu

<Steps>
  <Step title="Set the API key">
    Chạy quy trình thiết lập ban đầu tương tác:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Thao tác này đăng ký cả nhà cung cấp thông thường (`volcengine`) và nhà cung cấp lập trình (`volcengine-plan`) bằng một khóa API duy nhất.

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
Để thiết lập không tương tác (CI, tập lệnh), hãy truyền trực tiếp khóa:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Nhà cung cấp và điểm cuối

| Nhà cung cấp     | Điểm cuối                                 | Trường hợp sử dụng |
| ---------------- | ----------------------------------------- | ------------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Mô hình thông thường |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Mô hình lập trình  |

<Note>
Cả hai nhà cung cấp đều được cấu hình bằng một khóa API duy nhất. Quá trình thiết lập tự động đăng ký cả hai và trình chọn mô hình của nhà cung cấp lập trình cũng tái sử dụng thông tin xác thực của nhà cung cấp thông thường (`volcengine-plan` là bí danh xác thực của `volcengine`).
</Note>

## Danh mục tích hợp sẵn

<Tabs>
  <Tab title="General (volcengine)">
    | Tham chiếu mô hình                           | Tên                             | Đầu vào      | Ngữ cảnh |
    | -------------------------------------------- | ------------------------------- | ------------ | -------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | văn bản, hình ảnh | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | văn bản, hình ảnh | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | văn bản, hình ảnh | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | văn bản, hình ảnh | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | văn bản, hình ảnh | 256,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Tham chiếu mô hình                                | Tên                      | Đầu vào | Ngữ cảnh |
    | ------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | văn bản | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | văn bản | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | văn bản | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | văn bản | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | văn bản | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | văn bản | 256,000 |
  </Tab>
</Tabs>

Cả hai danh mục đều là tĩnh (không có lệnh gọi khám phá `/models`) và hỗ trợ thống kê mức sử dụng theo luồng tương thích với OpenAI. Lược đồ công cụ của cả hai nhà cung cấp tự động loại bỏ các từ khóa `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` và `maxContains`, vì API gọi công cụ của Volcengine từ chối các từ khóa này.

## Chuyển văn bản thành giọng nói

Volcengine TTS sử dụng API HTTP BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) và được cấu hình riêng với khóa API mô hình Doubao tương thích với OpenAI. Trong bảng điều khiển BytePlus, hãy mở Seed Speech > Settings > API Keys, sao chép khóa API, rồi thiết lập:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Sau đó bật tính năng này trong `openclaw.json`:

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

Các trường khả dụng trong `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` và `baseUrl`. `!emotion=<value>` cũng hoạt động như một chỉ thị giọng nói nội tuyến khi cho phép ghi đè cài đặt giọng nói.

Đối với đích là tin nhắn thoại, OpenClaw yêu cầu định dạng gốc của nhà cung cấp là `ogg_opus`. Đối với tệp âm thanh đính kèm thông thường, hệ thống yêu cầu `mp3`. Các bí danh nhà cung cấp `bytedance` và `doubao` cũng phân giải thành nhà cung cấp giọng nói này.

Mã định danh tài nguyên mặc định là `seed-tts-1.0`, quyền sử dụng mà BytePlus mặc định cấp cho các khóa API Seed Speech mới tạo. Nếu dự án của bạn có quyền sử dụng TTS 2.0, hãy đặt `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` dành cho các điểm cuối mô hình ModelArk/Doubao và không phải là khóa API Seed Speech. TTS cần khóa API Seed Speech từ BytePlus Speech Console hoặc cặp AppID/mã thông báo của Speech Console cũ.
</Warning>

Xác thực AppID/mã thông báo cũ vẫn được hỗ trợ cho các ứng dụng Speech Console cũ hơn:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Các biến môi trường TTS tùy chọn khác: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` và `VOLCENGINE_TTS_BASE_URL` ghi đè các trường cấu hình tương ứng trong `messages.tts.providers.volcengine` khi được đặt.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Default model after onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` đặt `volcengine-plan/ark-code-latest` làm mô hình mặc định, đồng thời đăng ký danh mục `volcengine` thông thường.
  </Accordion>

  <Accordion title="Model picker fallback behavior">
    Trong quá trình thiết lập ban đầu/cấu hình lựa chọn mô hình, lựa chọn xác thực Volcengine ưu tiên cả các hàng `volcengine/*` và `volcengine-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ chuyển sang danh mục chưa lọc thay vì hiển thị trình chọn trống được giới hạn theo nhà cung cấp.
  </Accordion>

  <Accordion title="Environment variables for daemon processes">
    Nếu Gateway chạy dưới dạng tiến trình nền (launchd/systemd), hãy đảm bảo các biến môi trường mô hình và TTS như `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` và `VOLCENGINE_TTS_TOKEN` khả dụng cho tiến trình đó (ví dụ: trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Khi chạy OpenClaw dưới dạng dịch vụ nền, các biến môi trường được đặt trong shell tương tác không tự động được kế thừa. Xem ghi chú về tiến trình nền ở trên.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Configuration" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham khảo cấu hình đầy đủ cho tác tử, mô hình và nhà cung cấp.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và bước gỡ lỗi.
  </Card>
  <Card title="FAQ" href="/vi/help/faq" icon="circle-question">
    Các câu hỏi thường gặp về việc thiết lập OpenClaw.
  </Card>
</CardGroup>
