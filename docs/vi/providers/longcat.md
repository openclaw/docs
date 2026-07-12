---
read_when:
    - Bạn muốn sử dụng LongCat-2.0 với OpenClaw
    - Bạn cần khóa API LongCat hoặc giới hạn của mô hình
summary: Thiết lập API LongCat cho LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T08:18:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) cung cấp API được lưu trữ cho LongCat-2.0, một
mô hình suy luận được xây dựng cho các tác vụ lập trình và tác tử. OpenClaw cung cấp
plugin `longcat` chính thức cho điểm cuối tương thích với OpenAI của LongCat.

| Thuộc tính   | Giá trị                              |
| ------------ | ------------------------------------ |
| Nhà cung cấp | `longcat`                            |
| Xác thực     | `LONGCAT_API_KEY`                    |
| API          | Chat Completions tương thích OpenAI  |
| URL cơ sở    | `https://api.longcat.chat/openai`    |
| Mô hình      | `longcat/LongCat-2.0`                |
| Ngữ cảnh     | 1.048.576 token                      |
| Đầu ra tối đa | 131.072 token                       |
| Đầu vào      | Văn bản                              |

## Cài đặt plugin

Cài đặt gói chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Tạo khóa API">
    Đăng nhập vào [Nền tảng API LongCat](https://longcat.chat/platform/) và
    tạo khóa trên trang [API Keys](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Xác minh mô hình">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

Quy trình thiết lập ban đầu thêm danh mục được lưu trữ và chọn `longcat/LongCat-2.0` khi
chưa có mô hình chính nào được cấu hình.

### Thiết lập không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Hành vi suy luận

LongCat cung cấp cơ chế điều khiển suy nghĩ nhị phân. OpenClaw ánh xạ các mức suy nghĩ được bật
thành `thinking: { type: "enabled" }` và `/think off` thành
`thinking: { type: "disabled" }`. LongCat hiện chưa cung cấp tài liệu về
`reasoning_effort`, vì vậy OpenClaw không gửi trường này.

LongCat trả về nội dung suy luận trong `reasoning_content`. OpenClaw giữ nguyên trường đó
khi phát lại các lượt gọi công cụ của trợ lý để các phiên tác tử nhiều lượt duy trì
định dạng thông điệp mà nhà cung cấp mong đợi.

## Giá

Danh mục tích hợp sẵn sử dụng giá niêm yết trả theo mức sử dụng của LongCat, tính bằng USD trên mỗi triệu
token: 0,75 USD cho đầu vào không được lưu bộ nhớ đệm, 0,015 USD cho đầu vào được lưu bộ nhớ đệm và 2,95 USD cho đầu ra. LongCat có thể
cung cấp ưu đãi tạm thời; [trang giá](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
và hồ sơ thanh toán của bạn là nguồn thông tin chính xác.

## LongCat-2.0 tự lưu trữ

Nhà cung cấp `longcat` nhắm đến API được lưu trữ của LongCat. Đối với các trọng số mở trên
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), hãy phục vụ
mô hình thông qua một môi trường chạy tương thích với OpenAI và sử dụng nhà cung cấp
[vLLM](/vi/providers/vllm) hoặc [SGLang](/vi/providers/sglang) hiện có của OpenClaw.

Giữ nguyên định danh mô hình chính xác của môi trường chạy trong danh mục nhà cung cấp tự lưu trữ;
không định tuyến một bản triển khai cục bộ qua `longcat/LongCat-2.0`.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Khóa hoạt động trong shell nhưng không hoạt động trong Gateway">
    Các tiến trình Gateway do daemon quản lý không kế thừa mọi biến của shell tương tác.
    Đặt `LONGCAT_API_KEY` trong `~/.openclaw/.env`, cấu hình khóa thông qua
    quy trình thiết lập ban đầu hoặc sử dụng tham chiếu bí mật đã được phê duyệt.
  </Accordion>

  <Accordion title="Yêu cầu thất bại với mã 402 hoặc 429">
    `402` có nghĩa là tài khoản không đủ hạn mức token. `429` có nghĩa là khóa API
    đã chạm giới hạn tốc độ. Kiểm tra [mức sử dụng LongCat](https://longcat.chat/platform/usage)
    và thử lại các yêu cầu bị giới hạn tốc độ sau khoảng thời gian chờ lùi của nhà cung cấp.
  </Accordion>

  <Accordion title="Mô hình không xuất hiện">
    Chạy `openclaw plugins list` và xác nhận plugin `longcat` đã được
    bật, sau đó chạy `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cấu hình nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tài liệu API LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Các điểm cuối API được lưu trữ, xác thực, giới hạn và ví dụ.
  </Card>
  <Card title="Thẻ mô hình LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Kiến trúc, hướng dẫn triển khai và thông tin chi tiết về mô hình.
  </Card>
  <Card title="Bí mật" href="/vi/gateway/secrets" icon="key">
    Lưu trữ thông tin xác thực của nhà cung cấp mà không nhúng văn bản thuần túy vào cấu hình.
  </Card>
</CardGroup>
