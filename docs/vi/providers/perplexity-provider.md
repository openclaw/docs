---
read_when:
    - Bạn muốn cấu hình Perplexity làm nhà cung cấp tìm kiếm web
    - Bạn cần khóa API của Perplexity hoặc thiết lập proxy OpenRouter
summary: Thiết lập nhà cung cấp tìm kiếm web Perplexity (khóa API, chế độ tìm kiếm, lọc)
title: Perplexity
x-i18n:
    generated_at: "2026-04-29T23:08:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity cung cấp khả năng tìm kiếm web thông qua Perplexity
Search API hoặc Perplexity Sonar qua OpenRouter.

<Note>
Trang này là phần thiết lập **nhà cung cấp** Perplexity. Đối với **công cụ** Perplexity (cách tác nhân sử dụng nó), xem [công cụ Perplexity](/vi/tools/perplexity-search).
</Note>

| Thuộc tính       | Giá trị                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| Loại             | Nhà cung cấp tìm kiếm web (không phải nhà cung cấp mô hình)            |
| Xác thực         | `PERPLEXITY_API_KEY` (trực tiếp) hoặc `OPENROUTER_API_KEY` (qua OpenRouter) |
| Đường dẫn cấu hình | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    Chạy luồng cấu hình tìm kiếm web tương tác:

    ```bash
    openclaw configure --section web
    ```

    Hoặc đặt khóa trực tiếp:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Bắt đầu tìm kiếm">
    Tác nhân sẽ tự động sử dụng Perplexity cho các lượt tìm kiếm web sau khi khóa được
    cấu hình. Không cần thêm bước nào.
  </Step>
</Steps>

## Chế độ tìm kiếm

Plugin tự động chọn phương thức truyền tải dựa trên tiền tố khóa API:

<Tabs>
  <Tab title="API Perplexity gốc (pplx-)">
    Khi khóa của bạn bắt đầu bằng `pplx-`, OpenClaw sử dụng Perplexity Search
    API gốc. Phương thức truyền tải này trả về kết quả có cấu trúc và hỗ trợ bộ lọc tên miền, ngôn ngữ
    và ngày (xem các tùy chọn lọc bên dưới).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Khi khóa của bạn bắt đầu bằng `sk-or-`, OpenClaw định tuyến qua OpenRouter bằng
    mô hình Perplexity Sonar. Phương thức truyền tải này trả về câu trả lời do AI tổng hợp kèm
    trích dẫn.
  </Tab>
</Tabs>

| Tiền tố khóa | Phương thức truyền tải      | Tính năng                                        |
| ------------ | --------------------------- | ------------------------------------------------ |
| `pplx-`      | Perplexity Search API gốc   | Kết quả có cấu trúc, bộ lọc tên miền/ngôn ngữ/ngày |
| `sk-or-`     | OpenRouter (Sonar)          | Câu trả lời do AI tổng hợp kèm trích dẫn         |

## Lọc API gốc

<Note>
Các tùy chọn lọc chỉ khả dụng khi dùng Perplexity API gốc
(khóa `pplx-`). Tìm kiếm qua OpenRouter/Sonar không hỗ trợ các tham số này.
</Note>

Khi dùng Perplexity API gốc, lượt tìm kiếm hỗ trợ các bộ lọc sau:

| Bộ lọc          | Mô tả                                  | Ví dụ                               |
| --------------- | -------------------------------------- | ----------------------------------- |
| Quốc gia        | Mã quốc gia gồm 2 chữ cái              | `us`, `de`, `jp`                    |
| Ngôn ngữ        | Mã ngôn ngữ ISO 639-1                  | `en`, `fr`, `zh`                    |
| Khoảng ngày     | Khoảng thời gian gần đây               | `day`, `week`, `month`, `year`      |
| Bộ lọc tên miền | Danh sách cho phép hoặc danh sách chặn (tối đa 20 tên miền) | `example.com`                       |
| Ngân sách nội dung | Giới hạn token cho mỗi phản hồi / mỗi trang | `max_tokens`, `max_tokens_per_page` |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Biến môi trường cho tiến trình daemon">
    Nếu OpenClaw Gateway chạy như một daemon (launchd/systemd), hãy đảm bảo
    `PERPLEXITY_API_KEY` có sẵn cho tiến trình đó.

    <Warning>
    Khóa chỉ được đặt trong `~/.profile` sẽ không hiển thị với daemon launchd/systemd
    trừ khi môi trường đó được nhập rõ ràng. Đặt khóa trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv` để đảm bảo tiến trình Gateway có thể
    đọc khóa.
    </Warning>

  </Accordion>

  <Accordion title="Thiết lập proxy OpenRouter">
    Nếu bạn muốn định tuyến tìm kiếm Perplexity qua OpenRouter, hãy đặt
    `OPENROUTER_API_KEY` (tiền tố `sk-or-`) thay vì khóa Perplexity gốc.
    OpenClaw sẽ phát hiện tiền tố và tự động chuyển sang phương thức truyền tải Sonar.

    <Tip>
    Phương thức truyền tải OpenRouter hữu ích nếu bạn đã có tài khoản OpenRouter
    và muốn hợp nhất thanh toán trên nhiều nhà cung cấp.
    </Tip>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ tìm kiếm Perplexity" href="/vi/tools/perplexity-search" icon="magnifying-glass">
    Cách tác nhân gọi tìm kiếm Perplexity và diễn giải kết quả.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ bao gồm các mục nhập Plugin.
  </Card>
</CardGroup>
