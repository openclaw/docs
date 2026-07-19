---
read_when:
    - Bạn muốn sử dụng các mô hình Volcano Engine hoặc Doubao với OpenClaw
    - Bạn cần thiết lập khóa API Volcengine
    - Bạn muốn sử dụng tính năng chuyển văn bản thành giọng nói của Volcengine Speech
summary: Thiết lập Volcano Engine (các mô hình Doubao, endpoint lập trình và TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-19T06:21:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ac0e86b5b94b0c0f08e76878d16e9c5562e0d3f9923697713bef20ebba5bab2
    source_path: providers/volcengine.md
    workflow: 16
---

Nhà cung cấp Volcengine cho phép truy cập các mô hình Doubao và các mô hình bên thứ ba được lưu trữ trên Volcano Engine, với các endpoint riêng biệt cho khối lượng công việc thông thường và lập trình. Plugin đi kèm này cũng đăng ký Volcengine Speech làm nhà cung cấp TTS.

| Chi tiết          | Giá trị                                                            |
| ----------------- | ------------------------------------------------------------------ |
| Nhà cung cấp      | `volcengine` (thông thường + TTS), `volcengine-plan` (lập trình) |
| Xác thực mô hình  | `VOLCANO_ENGINE_API_KEY`                                                 |
| Xác thực TTS      | `VOLCENGINE_TTS_API_KEY` hoặc `BYTEPLUS_SEED_SPEECH_API_KEY`                         |
| API               | Các mô hình tương thích với OpenAI, BytePlus Seed Speech TTS       |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    Chạy quy trình thiết lập ban đầu tương tác:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Thao tác này đăng ký cả nhà cung cấp thông thường (`volcengine`) và nhà cung cấp lập trình (`volcengine-plan`) từ một khóa API duy nhất.

  </Step>
  <Step title="Đặt mô hình mặc định">
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
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Để thiết lập không tương tác (CI, viết tập lệnh), hãy truyền trực tiếp khóa:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Nhà cung cấp và endpoint

| Nhà cung cấp      | Endpoint                                  | Trường hợp sử dụng       |
| ----------------- | ----------------------------------------- | ------------------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Các mô hình thông thường |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Các mô hình lập trình    |

<Note>
Cả hai nhà cung cấp đều được cấu hình từ một khóa API duy nhất. Quy trình thiết lập tự động đăng ký cả hai, đồng thời trình chọn mô hình của nhà cung cấp lập trình cũng tái sử dụng thông tin xác thực của nhà cung cấp thông thường (`volcengine-plan` là bí danh xác thực của `volcengine`).
</Note>

## Danh mục tích hợp sẵn

<Tabs>
  <Tab title="Thông thường (volcengine)">
    | Tham chiếu mô hình                           | Tên                             | Đầu vào          | Ngữ cảnh |
    | -------------------------------------------- | ------------------------------- | ---------------- | -------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | văn bản, hình ảnh | 128,000  |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | văn bản, hình ảnh | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | văn bản, hình ảnh | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | văn bản, hình ảnh | 200,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | văn bản, hình ảnh | 256,000  |
  </Tab>
  <Tab title="Lập trình (volcengine-plan)">
    | Tham chiếu mô hình                                | Tên                      | Đầu vào | Ngữ cảnh |
    | ------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | văn bản | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | văn bản | 256,000  |
  </Tab>
</Tabs>

Cả hai danh mục đều là tĩnh (không có lệnh gọi khám phá `/models`) và hỗ trợ tính toán mức sử dụng theo luồng tương thích với OpenAI. Lược đồ công cụ cho cả hai nhà cung cấp tự động loại bỏ các từ khóa `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` và `maxContains`, vì API gọi công cụ của Volcengine từ chối chúng.

## Chuyển văn bản thành giọng nói

Volcengine TTS sử dụng API HTTP BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) và được cấu hình riêng với khóa API mô hình Doubao tương thích với OpenAI. Trong bảng điều khiển BytePlus, hãy mở Seed Speech > Settings > API Keys, sao chép khóa API, rồi đặt:

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

Đối với đích đến là ghi chú thoại, OpenClaw yêu cầu `ogg_opus` gốc của nhà cung cấp. Đối với tệp âm thanh đính kèm thông thường, OpenClaw yêu cầu `mp3`. Các bí danh nhà cung cấp `bytedance` và `doubao` cũng được phân giải thành nhà cung cấp giọng nói này.

ID tài nguyên mặc định là `seed-tts-1.0`, quyền lợi mà BytePlus cấp mặc định cho các khóa API Seed Speech mới tạo. Nếu dự án của bạn có quyền lợi TTS 2.0, hãy đặt `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` dành cho các endpoint mô hình ModelArk/Doubao và không phải là khóa API Seed Speech. TTS cần khóa API Seed Speech từ BytePlus Speech Console hoặc cặp AppID/token của Speech Console cũ.
</Warning>

Xác thực AppID/token cũ vẫn được hỗ trợ cho các ứng dụng Speech Console cũ hơn:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Các biến môi trường TTS tùy chọn khác: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` và `VOLCENGINE_TTS_BASE_URL` ghi đè các trường cấu hình `messages.tts.providers.volcengine` tương ứng khi được đặt.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Mô hình mặc định sau khi thiết lập ban đầu">
    `openclaw onboard --auth-choice volcengine-api-key` đặt `volcengine-plan/ark-code-latest` làm mô hình mặc định, đồng thời đăng ký danh mục `volcengine` thông thường.
  </Accordion>

  <Accordion title="Hành vi dự phòng của trình chọn mô hình">
    Trong quá trình thiết lập ban đầu/cấu hình lựa chọn mô hình, tùy chọn xác thực Volcengine ưu tiên cả hai hàng `volcengine/*` và `volcengine-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ chuyển về danh mục chưa lọc thay vì hiển thị trình chọn theo phạm vi nhà cung cấp trống.
  </Accordion>

  <Accordion title="Biến môi trường cho tiến trình daemon">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy bảo đảm các biến môi trường mô hình và TTS như `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` và `VOLCENGINE_TTS_TOKEN` khả dụng cho tiến trình đó (ví dụ: trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Khi chạy OpenClaw dưới dạng dịch vụ nền, các biến môi trường được đặt trong shell tương tác không tự động được kế thừa. Xem ghi chú về daemon ở trên.
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham khảo cấu hình đầy đủ cho tác nhân, mô hình và nhà cung cấp.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề thường gặp và các bước gỡ lỗi.
  </Card>
  <Card title="Câu hỏi thường gặp" href="/vi/help/faq" icon="circle-question">
    Các câu hỏi thường gặp về việc thiết lập OpenClaw.
  </Card>
</CardGroup>
