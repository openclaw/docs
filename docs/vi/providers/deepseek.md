---
read_when:
    - Bạn muốn sử dụng DeepSeek với OpenClaw
    - Bạn cần biến môi trường chứa khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập DeepSeek (xác thực + lựa chọn mô hình)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T08:17:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) cung cấp các mô hình AI mạnh mẽ với API tương thích OpenAI.

| Thuộc tính    | Giá trị                    |
| ------------- | -------------------------- |
| Nhà cung cấp  | `deepseek`                 |
| Xác thực      | `DEEPSEEK_API_KEY`         |
| API           | Tương thích OpenAI         |
| URL cơ sở     | `https://api.deepseek.com` |

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API tại [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Yêu cầu nhập khóa API và đặt `deepseek/deepseek-v4-flash` làm mô hình mặc định.

  </Step>
  <Step title="Xác minh các mô hình khả dụng">
    ```bash
    openclaw models list --provider deepseek
    ```

    Để kiểm tra danh mục tĩnh của Plugin mà không cần Gateway đang chạy:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Thiết lập không tương tác">
    Đối với các bản cài đặt bằng tập lệnh hoặc không có giao diện, hãy truyền trực tiếp tất cả cờ:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Nếu Gateway chạy dưới dạng tiến trình nền (launchd/systemd), hãy đảm bảo
`DEEPSEEK_API_KEY` khả dụng cho tiến trình đó (ví dụ: trong `~/.openclaw/.env`
hoặc thông qua `env.shellEnv`).
</Warning>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình           | Tên               | Đầu vào | Ngữ cảnh | Đầu ra tối đa | Ghi chú                                                        |
| ---------------------------- | ----------------- | ------- | -------- | ------------ | -------------------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | văn bản | 1,000,000 | 384,000      | Mô hình mặc định; giao diện V4 hỗ trợ chế độ suy luận           |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | văn bản | 1,000,000 | 384,000      | Giao diện V4 hỗ trợ chế độ suy luận                             |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | văn bản | 1,000,000 | 384,000      | Tên tương thích đã lỗi thời cho V4 Flash không suy luận         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | văn bản | 1,000,000 | 384,000      | Tên tương thích đã lỗi thời cho V4 Flash có suy luận            |

<Warning>
DeepSeek sẽ ngừng cung cấp `deepseek-chat` và `deepseek-reasoner` vào lúc
15:59 UTC ngày 24 tháng 7 năm 2026. Hiện tại, chúng lần lượt định tuyến đến
DeepSeek V4 Flash ở chế độ không suy luận và có suy luận. Hãy chuyển các tham
chiếu mô hình đã cấu hình sang `deepseek/deepseek-v4-flash` hoặc
`deepseek/deepseek-v4-pro` trước thời hạn.
</Warning>

Ước tính chi phí cục bộ của OpenClaw tuân theo mức phí trúng bộ nhớ đệm,
trượt bộ nhớ đệm và đầu ra do DeepSeek công bố. DeepSeek có thể thay đổi các
mức phí này; trang [Mô hình và giá](https://api-docs.deepseek.com/quick_start/pricing/)
của họ là nguồn chính thức để tính phí.

<Tip>
Các mô hình V4 hỗ trợ tùy chọn điều khiển `thinking` của DeepSeek. OpenClaw
cũng phát lại `reasoning_content` của DeepSeek trong các lượt tiếp theo để
các phiên suy luận có lệnh gọi công cụ có thể tiếp tục.
Sử dụng `/think xhigh` hoặc `/think max` với các mô hình DeepSeek V4 để yêu cầu
mức `reasoning_effort` tối đa của DeepSeek; cả hai đều ánh xạ thành `"max"`.
</Tip>

## Suy luận và công cụ

Các phiên suy luận DeepSeek V4 yêu cầu thông điệp trợ lý được phát lại từ một
lượt bật chế độ suy luận phải bao gồm `reasoning_content` trong các yêu cầu
tiếp theo. Plugin DeepSeek của OpenClaw tự động bổ sung trường đó, vì vậy việc
sử dụng công cụ qua nhiều lượt thông thường hoạt động trên
`deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro` ngay cả khi lịch sử
đến từ một nhà cung cấp tương thích OpenAI khác (không có `reasoning_content`
gốc) hoặc từ một thông điệp trợ lý thông thường. Không cần dùng `/new` sau khi
chuyển nhà cung cấp giữa phiên.

Khi chế độ suy luận bị tắt (bao gồm lựa chọn **None** trong giao diện), OpenClaw
gửi `thinking: { type: "disabled" }` và loại bỏ `reasoning_content` được phát
lại khỏi lịch sử gửi đi, giúp phiên tiếp tục sử dụng luồng DeepSeek không suy
luận.

Sử dụng `deepseek/deepseek-v4-flash` cho luồng nhanh mặc định. Sử dụng
`deepseek/deepseek-v4-pro` để có mô hình mạnh hơn khi bạn có thể chấp nhận chi
phí hoặc độ trễ cao hơn.

## Kiểm thử trực tiếp

Để chỉ chạy các kiểm tra mô hình trực tiếp DeepSeek V4 từ bộ kiểm thử trực tiếp
mô hình hiện đại:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Xác minh cả hai mô hình V4 đều hoàn tất và các lượt tiếp theo có suy luận/công
cụ vẫn giữ nguyên tải trọng phát lại mà DeepSeek yêu cầu.

## Ví dụ cấu hình

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho tác tử, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
