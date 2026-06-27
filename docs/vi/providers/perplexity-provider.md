---
read_when:
    - Bạn muốn cấu hình Perplexity làm nhà cung cấp tìm kiếm web
    - Bạn cần khóa API Perplexity hoặc thiết lập proxy OpenRouter
summary: Thiết lập nhà cung cấp tìm kiếm web Perplexity (khóa API, chế độ tìm kiếm, lọc)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:05:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity cung cấp khả năng tìm kiếm web thông qua Perplexity
Search API hoặc Perplexity Sonar qua OpenRouter.

<Note>
Trang này là phần thiết lập **provider** Perplexity. Đối với **tool** Perplexity (cách agent sử dụng nó), hãy xem [tool Perplexity](/vi/tools/perplexity-search).
</Note>

| Thuộc tính    | Giá trị                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Loại        | Provider tìm kiếm web (không phải provider mô hình)                             |
| Xác thực        | `PERPLEXITY_API_KEY` (trực tiếp) hoặc `OPENROUTER_API_KEY` (qua OpenRouter) |
| Đường dẫn cấu hình | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Cài đặt plugin

Cài đặt plugin chính thức, rồi khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Thiết lập API key">
    Chạy luồng cấu hình tìm kiếm web tương tác:

    ```bash
    openclaw configure --section web
    ```

    Hoặc thiết lập khóa trực tiếp:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Bắt đầu tìm kiếm">
    Agent sẽ tự động sử dụng Perplexity cho các lượt tìm kiếm web sau khi khóa được
    cấu hình. Không cần bước bổ sung nào.
  </Step>
</Steps>

## Chế độ tìm kiếm

Plugin tự động chọn transport dựa trên tiền tố API key:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Khi khóa của bạn bắt đầu bằng `pplx-`, OpenClaw sử dụng Perplexity Search
    API gốc. Transport này trả về kết quả có cấu trúc và hỗ trợ bộ lọc miền, ngôn ngữ,
    và ngày (xem các tùy chọn lọc bên dưới).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Khi khóa của bạn bắt đầu bằng `sk-or-`, OpenClaw định tuyến qua OpenRouter bằng
    mô hình Perplexity Sonar. Transport này trả về câu trả lời do AI tổng hợp kèm
    trích dẫn.
  </Tab>
</Tabs>

| Tiền tố khóa | Transport                    | Tính năng                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Native Perplexity Search API | Kết quả có cấu trúc, bộ lọc miền/ngôn ngữ/ngày |
| `sk-or-`   | OpenRouter (Sonar)           | Câu trả lời do AI tổng hợp kèm trích dẫn            |

## Lọc Native API

<Note>
Các tùy chọn lọc chỉ khả dụng khi dùng native Perplexity API
(khóa `pplx-`). Tìm kiếm OpenRouter/Sonar không hỗ trợ các tham số này.
</Note>

Khi dùng native Perplexity API, tìm kiếm hỗ trợ các bộ lọc sau:

| Bộ lọc         | Mô tả                            | Ví dụ                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Quốc gia        | Mã quốc gia 2 chữ cái                  | `us`, `de`, `jp`                    |
| Ngôn ngữ       | Mã ngôn ngữ ISO 639-1                | `en`, `fr`, `zh`                    |
| Khoảng ngày     | Cửa sổ độ mới                         | `day`, `week`, `month`, `year`      |
| Bộ lọc miền | Danh sách cho phép hoặc danh sách chặn (tối đa 20 miền) | `example.com`                       |
| Ngân sách nội dung | Giới hạn token trên mỗi phản hồi / mỗi trang   | `max_tokens`, `max_tokens_per_page` |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Biến môi trường cho tiến trình daemon">
    Nếu OpenClaw Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo
    `PERPLEXITY_API_KEY` khả dụng cho tiến trình đó.

    <Warning>
    Khóa chỉ được export trong shell tương tác sẽ không hiển thị với daemon
    launchd/systemd trừ khi môi trường đó được nhập rõ ràng. Thiết lập
    khóa trong `~/.openclaw/.env` hoặc qua `env.shellEnv` để đảm bảo tiến trình gateway
    có thể đọc được.
    </Warning>

  </Accordion>

  <Accordion title="Thiết lập proxy OpenRouter">
    Nếu bạn muốn định tuyến tìm kiếm Perplexity qua OpenRouter, hãy thiết lập
    `OPENROUTER_API_KEY` (tiền tố `sk-or-`) thay vì khóa Perplexity gốc.
    OpenClaw sẽ phát hiện tiền tố và tự động chuyển sang transport Sonar.

    <Tip>
    Transport OpenRouter hữu ích nếu bạn đã có tài khoản OpenRouter
    và muốn hợp nhất việc thanh toán giữa nhiều provider.
    </Tip>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tool tìm kiếm Perplexity" href="/vi/tools/perplexity-search" icon="magnifying-glass">
    Cách agent gọi tìm kiếm Perplexity và diễn giải kết quả.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ, bao gồm các mục plugin.
  </Card>
</CardGroup>
